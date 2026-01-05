import { Router, type Request, type Response } from "express";
import { db } from "./db";
import { users, insertUserSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5000";

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
  console.warn("GitHub OAuth not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.");
}

// Extend Express Session types
declare module "express-session" {
  interface SessionData {
    userId?: string;
    user?: {
      id: string;
      username: string | null;
      email: string | null;
      displayName: string | null;
      githubUsername: string | null;
      githubAvatarUrl: string | null;
      role: string;
      subscriptionTier: string | null;
    };
    oauthState?: string;
  }
}

// GitHub OAuth: Initiate flow
router.get("/github", (req: Request, res: Response) => {
  if (!GITHUB_CLIENT_ID) {
    return res.status(500).json({ error: "GitHub OAuth not configured" });
  }

  // Generate random state for CSRF protection
  const state = crypto.randomBytes(32).toString("hex");
  req.session.oauthState = state;

  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", GITHUB_CLIENT_ID);
  githubAuthUrl.searchParams.set("redirect_uri", `${CLIENT_URL}/api/auth/github/callback`);
  githubAuthUrl.searchParams.set("scope", "read:user user:email");
  githubAuthUrl.searchParams.set("state", state);

  res.redirect(githubAuthUrl.toString());
});

// GitHub OAuth: Handle callback
router.get("/github/callback", async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    // Verify state to prevent CSRF
    if (!state || state !== req.session.oauthState) {
      return res.redirect(`${CLIENT_URL}?error=invalid_state`);
    }

    // Clear state from session
    delete req.session.oauthState;

    if (!code || typeof code !== "string") {
      return res.redirect(`${CLIENT_URL}?error=no_code`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${CLIENT_URL}/api/auth/github/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("GitHub OAuth error:", tokenData);
      return res.redirect(`${CLIENT_URL}?error=github_auth_failed`);
    }

    const accessToken = tokenData.access_token;

    // Fetch user data from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
      },
    });

    const githubUser = await userResponse.json();

    // Fetch user emails
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
      },
    });

    const emails = await emailsResponse.json();
    const primaryEmail = emails.find((e: any) => e.primary)?.email || githubUser.email;

    // Find or create user in database
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.githubId, String(githubUser.id)))
      .limit(1);

    if (!user) {
      // Create new user
      [user] = await db
        .insert(users)
        .values({
          githubId: String(githubUser.id),
          githubUsername: githubUser.login,
          githubAvatarUrl: githubUser.avatar_url,
          githubAccessToken: accessToken,
          email: primaryEmail,
          displayName: githubUser.name || githubUser.login,
          bio: githubUser.bio,
          username: githubUser.login,
          emailVerified: true,
          lastLoginAt: new Date(),
        })
        .returning();
    } else {
      // Update existing user
      [user] = await db
        .update(users)
        .set({
          githubAccessToken: accessToken,
          githubAvatarUrl: githubUser.avatar_url,
          githubUsername: githubUser.login,
          displayName: githubUser.name || user.displayName,
          bio: githubUser.bio || user.bio,
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning();
    }

    // Set session
    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      githubUsername: user.githubUsername,
      githubAvatarUrl: user.githubAvatarUrl,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
    };

    // Redirect to client
    res.redirect(`${CLIENT_URL}/dashboard`);
  } catch (error) {
    console.error("GitHub OAuth callback error:", error);
    res.redirect(`${CLIENT_URL}?error=auth_failed`);
  }
});

// Get current session
router.get("/session", (req: Request, res: Response) => {
  if (!req.session.userId || !req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  res.json({
    user: req.session.user,
  });
});

// Logout
router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destruction error:", err);
      return res.status(500).json({ error: "Failed to logout" });
    }
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

// Middleware to check authentication
export function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

// Middleware to check role
export function requireRole(role: string) {
  return (req: Request, res: Response, next: Function) => {
    if (!req.session.user || req.session.user.role !== role) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

export default router;
