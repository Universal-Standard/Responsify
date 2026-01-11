import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { apiLimiter, validateRequest, errorHandler } from "./middleware";
import { authenticate } from "./auth";
import { seedSubscriptionPlans } from "./seed-plans";
import { createSessionStore, getSessionConfig } from "./config/session";
import { initializeSentry, sentryRequestHandler, sentryTracingHandler, sentryErrorHandler } from "./config/sentry";
import { configureSecurityHeaders } from "./config/security";
import { log as loggerLog } from "./config/logger";

const app = express();
const httpServer = createServer(app);

// Initialize Sentry first (before any other middleware)
initializeSentry(app);

// Sentry request handler - must be first
app.use(sentryRequestHandler());

// Sentry tracing handler - after request handler
app.use(sentryTracingHandler());

// Configure security headers (helmet)
configureSecurityHeaders(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Apply rate limiting to all API routes FIRST (before expensive operations)
app.use('/api', apiLimiter);

// Apply security middleware, but skip for Stripe webhook (needs raw body)
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path === "/api/billing/webhook") {
    return next();
  }
  return validateRequest(req, res, next);
});

// Apply authentication to all API routes
app.use('/api', authenticate);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize session store
  try {
    log('Initializing session store...');
    const sessionStore = await createSessionStore();
    const sessionConfig = getSessionConfig(sessionStore);

    // Ensure session cookies are sent only over HTTPS and are not accessible via client-side JavaScript
    sessionConfig.cookie = sessionConfig.cookie || {};
    sessionConfig.cookie.httpOnly = sessionConfig.cookie.httpOnly ?? true;

    if (process.env.NODE_ENV === "production") {
      // Behind a reverse proxy/HTTPS terminator, trust the proxy so "secure" cookies work correctly
      app.set("trust proxy", 1);
      sessionConfig.cookie.secure = sessionConfig.cookie.secure ?? true;
    }

    app.use(session(sessionConfig));
    log('✅ Session store initialized');
  } catch (error) {
    console.error('Failed to initialize session store:', error);
  }

  // Seed subscription plans on startup
  try {
    await seedSubscriptionPlans();
  } catch (error) {
    console.error('Failed to seed subscription plans:', error);
  }
  
  await registerRoutes(httpServer, app);

  // Sentry error handler - must be after all routes
  app.use(sentryErrorHandler());

  // Use custom error handler (after Sentry)
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
      loggerLog.info(`🚀 Server started on port ${port}`);
    },
  );
})();
