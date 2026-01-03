# QUICK START IMPLEMENTATION GUIDE
## Priority Features with Code Samples

---

## 🔐 PHASE 1: AUTHENTICATION (START HERE)

### Step 1: GitHub OAuth Setup

**File: `server/auth/github.ts`**
```typescript
import { Octokit } from "@octokit/rest";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function getGitHubAuthURL() {
  const redirectURI = `${process.env.APP_URL}/api/auth/github/callback`;
  return `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectURI}&scope=user:email`;
}

export async function exchangeCodeForToken(code: string) {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  return await response.json();
}

export async function getGitHubUser(accessToken: string) {
  const octokit = new Octokit({ auth: accessToken });
  const { data } = await octokit.users.getAuthenticated();
  return data;
}

export async function createOrUpdateUser(githubUser: any, githubToken: string) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.githubId, githubUser.id.toString()))
    .limit(1);

  if (existing.length > 0) {
    // Update last login
    await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        githubToken,
        avatarUrl: githubUser.avatar_url,
      })
      .where(eq(users.id, existing[0].id));

    return existing[0];
  } else {
    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        githubId: githubUser.id.toString(),
        githubUsername: githubUser.login,
        email: githubUser.email,
        avatarUrl: githubUser.avatar_url,
        githubToken,
        planType: "free",
        creditsRemaining: 10,
      })
      .returning();

    return newUser;
  }
}

export function generateJWT(user: any) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      planType: user.planType,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyJWT(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
```

**File: `server/middleware/auth.ts`**
```typescript
import type { Request, Response, NextFunction } from "express";
import { verifyJWT } from "../auth/github";
import { db } from "../db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  user?: any;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const payload = verifyJWT(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // Load user from database
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, (payload as any).userId))
    .limit(1);

  if (!user || !user.isActive) {
    return res.status(401).json({ error: "User not found or inactive" });
  }

  req.user = user;
  next();
}

export function requirePlan(planType: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const planHierarchy: Record<string, number> = {
      free: 1,
      pro: 2,
      enterprise: 3,
    };

    if (planHierarchy[req.user.planType] < planHierarchy[planType]) {
      return res.status(403).json({
        error: `This feature requires ${planType} plan or higher`,
      });
    }

    next();
  };
}
```

**File: `server/authRoutes.ts`**
```typescript
import type { Express } from "express";
import {
  getGitHubAuthURL,
  exchangeCodeForToken,
  getGitHubUser,
  createOrUpdateUser,
  generateJWT,
} from "./auth/github";
import { requireAuth, type AuthRequest } from "./middleware/auth";

export function registerAuthRoutes(app: Express) {
  // Get GitHub OAuth URL
  app.get("/api/auth/github/url", async (req, res) => {
    try {
      const url = await getGitHubAuthURL();
      res.json({ url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GitHub OAuth callback
  app.get("/api/auth/github/callback", async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).json({ error: "Code required" });
      }

      // Exchange code for access token
      const { access_token } = await exchangeCodeForToken(code as string);

      // Get GitHub user
      const githubUser = await getGitHubUser(access_token);

      // Create or update user in database
      const user = await createOrUpdateUser(githubUser, access_token);

      // Generate JWT
      const token = generateJWT(user);

      // Set cookie
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to dashboard
      res.redirect("/dashboard");
    } catch (error: any) {
      console.error("GitHub auth error:", error);
      res.redirect("/?error=auth_failed");
    }
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, async (req: AuthRequest, res) => {
    res.json({
      user: {
        id: req.user.id,
        githubUsername: req.user.githubUsername,
        email: req.user.email,
        avatarUrl: req.user.avatarUrl,
        planType: req.user.planType,
        creditsRemaining: req.user.creditsRemaining,
      },
    });
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("auth_token");
    res.json({ success: true });
  });
}
```

### Step 2: Update Schema for Users

**File: `shared/schema.ts` (additions)**
```typescript
// Add to users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // GitHub info
  githubId: varchar("github_id").unique(),
  githubUsername: varchar("github_username"),
  githubToken: text("github_token"), // Encrypted in production
  email: varchar("email"),
  avatarUrl: text("avatar_url"),
  
  // Account info
  planType: varchar("plan_type").default("free"), // free, pro, enterprise
  creditsRemaining: integer("credits_remaining").default(10),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  
  // Preferences
  preferences: jsonb("preferences").default({}),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
  isActive: boolean("is_active").default(true),
});

// User analyses table
export const userAnalyses = pgTable("user_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  url: text("url").notNull(),
  
  // GitHub integration
  githubIssueNumber: integer("github_issue_number"),
  githubGistId: varchar("github_gist_id"),
  
  // Scores
  consensusScore: integer("consensus_score"),
  responsiveScore: integer("responsive_score"),
  readabilityScore: integer("readability_score"),
  accessibilityScore: integer("accessibility_score"),
  performanceScore: integer("performance_score"),
  
  // Metadata
  status: varchar("status").default("pending"),
  pageTitle: text("page_title"),
  pageDescription: text("page_description"),
  analysisMetadata: jsonb("analysis_metadata"),
  
  // User organization
  tags: text("tags").array(),
  notes: text("notes"),
  isFavorite: boolean("is_favorite").default(false),
  projectId: varchar("project_id"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  color: varchar("color"),
  icon: varchar("icon"),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## 📱 PHASE 2: REACT UI PAGES

### Dashboard Page

**File: `client/src/pages/dashboard.tsx`**
```typescript
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Not authenticated");
      return res.json();
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/overview");
      return res.json();
    },
  });

  const { data: recentAnalyses } = useQuery({
    queryKey: ["recent-analyses"],
    queryFn: async () => {
      const res = await fetch("/api/analyses?limit=5");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.user?.githubUsername}!
          </h1>
          <p className="text-slate-300">
            Here's what's happening with your analyses
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-slate-800/50 border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 text-sm">Total Analyses</h3>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white">
              {stats?.totalAnalyses || 0}
            </div>
          </Card>

          <Card className="p-6 bg-slate-800/50 border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 text-sm">Average Score</h3>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white">
              {stats?.averageScore || 0}
            </div>
          </Card>

          <Card className="p-6 bg-slate-800/50 border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 text-sm">Credits Left</h3>
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-white">
              {user?.user?.creditsRemaining || 0}
            </div>
          </Card>

          <Card className="p-6 bg-slate-800/50 border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 text-sm">Plan</h3>
            </div>
            <div className="text-3xl font-bold text-white capitalize">
              {user?.user?.planType || "Free"}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Link href="/">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Analysis
            </Button>
          </Link>
        </div>

        {/* Recent Analyses */}
        <Card className="p-6 bg-slate-800/50 border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">
            Recent Analyses
          </h2>
          
          {recentAnalyses?.analyses?.length > 0 ? (
            <div className="space-y-4">
              {recentAnalyses.analyses.map((analysis: any) => (
                <div
                  key={analysis.id}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
                >
                  <div>
                    <h3 className="text-white font-medium">{analysis.url}</h3>
                    <p className="text-slate-400 text-sm">
                      {new Date(analysis.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {analysis.consensusScore}
                      </div>
                      <div className="text-xs text-slate-400">Score</div>
                    </div>
                    <Link href={`/analyses/${analysis.id}`}>
                      <Button variant="outline">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400">No analyses yet</p>
              <Link href="/">
                <Button className="mt-4">Start Your First Analysis</Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
```

### Login Page

**File: `client/src/pages/login.tsx`**
```typescript
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Github } from "lucide-react";

export default function Login() {
  const handleGitHubLogin = async () => {
    const res = await fetch("/api/auth/github/url");
    const { url } = await res.json();
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-slate-800/50 border-slate-700">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🚀 ResponsiAI
          </h1>
          <p className="text-slate-300">
            AI-Powered Mobile Responsiveness Analyzer
          </p>
        </div>

        <div className="space-y-4">
          <Button
            className="w-full bg-slate-700 hover:bg-slate-600"
            onClick={handleGitHubLogin}
          >
            <Github className="w-5 h-5 mr-2" />
            Continue with GitHub
          </Button>

          <p className="text-center text-sm text-slate-400">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </Card>
    </div>
  );
}
```

---

## 🔧 NEXT STEPS

See PRODUCTION_ROADMAP.md for complete feature list and specifications.

**To implement:**
1. Set up environment variables (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET)
2. Run database migrations
3. Add auth routes to server
4. Create React pages
5. Add protected routes
6. Test authentication flow

Let me know which features to implement next!
