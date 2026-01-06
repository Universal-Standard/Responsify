import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  analyzeUrlRequestSchema, 
  saveDesignRequestSchema,
  updateDesignRequestSchema 
} from "@shared/schema";
import { fetchWebsite, extractWebsiteContent } from "./services/websiteFetcher";
import { runMultiAgentAnalysis, generateConsensusHtml } from "./services/multiAgentOrchestrator";
import { ZodError } from "zod";
import { analysisLimiter } from "./middleware";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Error handler helper
  const handleError = (res: any, error: any, defaultMessage: string) => {
    console.error(defaultMessage, error);
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        error: "Validation error", 
        details: error.errors 
      });
    }
    return res.status(500).json({ 
      error: error.message || defaultMessage 
    });
  };

  // ============================================
  // ANALYSIS ENDPOINTS
  // ============================================

  /**
   * POST /api/analyze
   * Start analyzing a URL - fetches website and initiates AI analysis
   * Rate limited to prevent abuse of expensive AI operations
   */
  app.post("/api/analyze", analysisLimiter, async (req, res) => {
    try {
      const { url } = analyzeUrlRequestSchema.parse(req.body);

      // Create analysis job
      const job = await storage.createAnalysisJob({
        url,
        status: "analyzing",
      });

      // Start async analysis (don't await - return job ID immediately)
      processAnalysis(job.id, url).catch(err => {
        console.error("Analysis failed:", err);
      });

      res.json({ 
        jobId: job.id, 
        status: "analyzing",
        message: "Analysis started" 
      });
    } catch (error) {
      handleError(res, error, "Failed to start analysis");
    }
  });

  /**
   * GET /api/analyze/:jobId
   * Get the status and results of an analysis job
   */
  app.get("/api/analyze/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = await storage.getAnalysisJob(jobId);

      if (!job) {
        return res.status(404).json({ error: "Analysis job not found" });
      }

      res.json({
        id: job.id,
        url: job.url,
        status: job.status,
        pageTitle: job.pageTitle,
        pageDescription: job.pageDescription,
        responsiveScore: job.responsiveScore,
        readabilityScore: job.readabilityScore,
        consensusScore: job.consensusScore,
        accessibilityScore: job.accessibilityScore,
        performanceScore: job.performanceScore,
        mobileConversion: job.mobileConversion,
        suggestions: job.suggestions,
        aiAnalysis: job.aiAnalysis,
        errorMessage: job.errorMessage,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
      });
    } catch (error) {
      handleError(res, error, "Failed to get analysis status");
    }
  });

  // ============================================
  // SAVED DESIGNS ENDPOINTS
  // ============================================

  /**
   * POST /api/designs
   * Save a completed analysis as a design
   */
  app.post("/api/designs", async (req, res) => {
    try {
      const { jobId, name } = saveDesignRequestSchema.parse(req.body);

      const job = await storage.getAnalysisJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Analysis job not found" });
      }

      if (job.status !== "completed") {
        return res.status(400).json({ error: "Analysis not yet completed" });
      }

      const design = await storage.createSavedDesign({
        name,
        originalUrl: job.url,
        status: "completed",
        analysisScore: job.responsiveScore,
        readabilityScore: job.readabilityScore,
        pageTitle: job.pageTitle,
        pageDescription: job.pageDescription,
        extractedContent: job.extractedElements,
        mobileHtml: job.mobileConversion,
        mobileStyles: null,
        aiSuggestions: job.suggestions,
        isStarred: false,
        viewCount: 0,
      });

      res.status(201).json(design);
    } catch (error) {
      handleError(res, error, "Failed to save design");
    }
  });

  /**
   * GET /api/designs
   * Get all saved designs
   */
  app.get("/api/designs", async (req, res) => {
    try {
      const designs = await storage.getAllSavedDesigns();
      res.json(designs);
    } catch (error) {
      handleError(res, error, "Failed to get designs");
    }
  });

  /**
   * GET /api/designs/:id
   * Get a specific saved design
   */
  app.get("/api/designs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const design = await storage.getSavedDesign(id);

      if (!design) {
        return res.status(404).json({ error: "Design not found" });
      }

      // Increment view count
      await storage.incrementViewCount(id);

      res.json(design);
    } catch (error) {
      handleError(res, error, "Failed to get design");
    }
  });

  /**
   * PATCH /api/designs/:id
   * Update a saved design (name, starred status)
   */
  app.patch("/api/designs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = updateDesignRequestSchema.parse(req.body);

      const design = await storage.updateSavedDesign(id, updates);

      if (!design) {
        return res.status(404).json({ error: "Design not found" });
      }

      res.json(design);
    } catch (error) {
      handleError(res, error, "Failed to update design");
    }
  });

  /**
   * DELETE /api/designs/:id
   * Delete a saved design
   */
  app.delete("/api/designs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSavedDesign(id);

      if (!deleted) {
        return res.status(404).json({ error: "Design not found" });
      }

      res.json({ success: true, message: "Design deleted" });
    } catch (error) {
      handleError(res, error, "Failed to delete design");
    }
  });

  // ============================================
  // DESIGN VERSIONS ENDPOINTS
  // ============================================

  /**
   * GET /api/versions/:jobId
   * Get all design versions for an analysis job
   */
  app.get("/api/versions/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const versions = await storage.getDesignVersions(jobId);
      res.json(versions);
    } catch (error) {
      handleError(res, error, "Failed to get design versions");
    }
  });

  /**
   * POST /api/versions/:versionId/select
   * Select a specific version as the active design
   */
  app.post("/api/versions/:versionId/select", async (req, res) => {
    try {
      const { versionId } = req.params;
      const version = await storage.selectDesignVersion(versionId);
      
      if (!version) {
        return res.status(404).json({ error: "Version not found" });
      }
      
      res.json(version);
    } catch (error) {
      handleError(res, error, "Failed to select version");
    }
  });

  // ============================================
  // BILLING ENDPOINTS (Stripe Integration)
  // ============================================

  /**
   * POST /api/billing/create-checkout-session
   * Create a Stripe Checkout session for subscription
   */
  app.post("/api/billing/create-checkout-session", async (req, res) => {
    try {
      const { createCheckoutSession, createCustomer } = await import("./services/stripe");
      const { createCheckoutSessionSchema } = await import("@shared/schema");
      
      const { priceId } = createCheckoutSessionSchema.parse(req.body);
      const userId = req.userId!;
      
      // Get or create user
      let user = await storage.getUser(userId);
      if (!user) {
        // Create a default user for this session
        user = await storage.createUser({
          username: `user_${userId.substring(0, 8)}`,
          password: '', // Password not used in this flow
        });
      }
      
      // Get user's subscription to check for existing Stripe customer
      let subscription = await storage.getUserSubscription(userId);
      let stripeCustomerId: string;
      
      if (subscription?.stripeCustomerId) {
        stripeCustomerId = subscription.stripeCustomerId;
      } else {
        // Create Stripe customer
        const customer = await createCustomer(
          `user_${userId.substring(0, 8)}@responsiai.local`,
          userId
        );
        stripeCustomerId = customer.id;
      }
      
      const session = await createCheckoutSession(
        priceId,
        userId,
        `user_${userId.substring(0, 8)}@responsiai.local`,
        stripeCustomerId
      );
      
      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      handleError(res, error, "Failed to create checkout session");
    }
  });

  /**
   * POST /api/billing/create-portal-session
   * Create a Stripe Customer Portal session
   */
  app.post("/api/billing/create-portal-session", async (req, res) => {
    try {
      const { createPortalSession } = await import("./services/stripe");
      const { manageBillingPortalSchema } = await import("@shared/schema");
      
      const { returnUrl } = manageBillingPortalSchema.parse(req.body);
      const userId = req.userId!;
      
      // Validate returnUrl belongs to our application
      const appUrl = process.env.APP_URL || 'http://localhost:5000';
      if (returnUrl && !returnUrl.startsWith(appUrl)) {
        return res.status(400).json({ error: "Invalid return URL" });
      }
      
      // Get user's subscription
      const subscription = await storage.getUserSubscription(userId);
      if (!subscription || !subscription.stripeCustomerId) {
        return res.status(404).json({ error: "No active subscription found" });
      }
      
      const session = await createPortalSession(subscription.stripeCustomerId, returnUrl);
      
      res.json({ url: session.url });
    } catch (error) {
      handleError(res, error, "Failed to create portal session");
    }
  });

  /**
   * POST /api/billing/webhook
   * Handle Stripe webhook events
   */
  app.post("/api/billing/webhook", async (req, res) => {
    try {
      const { constructWebhookEvent } = await import("./services/stripe");
      const signature = req.headers['stripe-signature'] as string;
      
      if (!signature) {
        return res.status(400).json({ error: "Missing stripe-signature header" });
      }
      
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
      const event = constructWebhookEvent(
        req.rawBody as Buffer,
        signature,
        webhookSecret
      );
      
      const isProduction = process.env.NODE_ENV === 'production';
      
      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as any;
          const userId = session.client_reference_id || session.metadata?.userId;
          const subscriptionId = session.subscription;
          
          if (!isProduction) {
            console.log('Checkout completed', { type: event.type, userId, subscriptionId });
          }
          
          if (userId && subscriptionId) {
            // Get subscription details from Stripe
            const { getSubscription } = await import("./services/stripe");
            const stripeSubscription = await getSubscription(subscriptionId as string);
            
            // Get the plan
            const plan = await storage.getSubscriptionPlanByStripeId(
              stripeSubscription.items.data[0].price.id
            );
            
            if (plan) {
              // Create user subscription
              await storage.createUserSubscription({
                userId,
                planId: plan.id,
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: subscriptionId as string,
                status: 'active',
                currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
                cancelAtPeriodEnd: false,
                analysesUsedThisMonth: 0,
              });
            }
          }
          break;
        }
          
        case 'customer.subscription.updated': {
          const subscription = event.data.object as any;
          
          if (!isProduction) {
            console.log('Subscription updated', { type: event.type, id: subscription.id });
          }
          
          const dbSubscription = await storage.getUserSubscriptionByStripeId(subscription.id);
          
          if (dbSubscription) {
            await storage.updateUserSubscription(dbSubscription.id, {
              status: subscription.status,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            });
          }
          break;
        }
          
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as any;
          
          if (!isProduction) {
            console.log('Subscription deleted', { type: event.type, id: subscription.id });
          }
          
          const dbSubscription = await storage.getUserSubscriptionByStripeId(subscription.id);
          
          if (dbSubscription) {
            await storage.updateUserSubscription(dbSubscription.id, {
              status: 'canceled',
            });
          }
          break;
        }
          
        case 'invoice.payment_failed': {
          const invoice = event.data.object as any;
          const subscriptionId = invoice.subscription;
          
          if (!isProduction) {
            console.log('Payment failed', { type: event.type, subscriptionId });
          }
          
          if (subscriptionId) {
            const dbSubscription = await storage.getUserSubscriptionByStripeId(subscriptionId);
            if (dbSubscription) {
              await storage.updateUserSubscription(dbSubscription.id, {
                status: 'past_due',
              });
            }
          }
          break;
        }
          
        default:
          if (!isProduction) {
            console.log('Unhandled webhook event', { type: event.type });
          }
      }
      
      res.json({ received: true });
    } catch (error: any) {
      // Distinguish Stripe signature verification errors (client issue)
      if (error?.type === 'StripeSignatureVerificationError') {
        return res.status(400).json({ error: "Invalid webhook signature" });
      }
      // Other errors are treated as internal processing errors
      handleError(res, error, "Webhook error");
    }
  });

  /**
   * GET /api/billing/plans
   * Get all available subscription plans from database
   */
  app.get("/api/billing/plans", async (req, res) => {
    try {
      const plans = await storage.getAllSubscriptionPlans();
      
      // Format plans for frontend
      const formattedPlans = plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        interval: plan.interval,
        analysesPerMonth: plan.analysesPerMonth,
        maxSavedDesigns: plan.maxSavedDesigns,
        features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
        stripePriceId: plan.stripePriceId,
        isActive: plan.isActive,
      }));
      
      res.json(formattedPlans);
    } catch (error) {
      handleError(res, error, "Failed to get plans");
    }
  });
  
  /**
   * GET /api/user/subscription
   * Get current user's subscription details
   */
  app.get("/api/user/subscription", async (req, res) => {
    try {
      const userId = req.userId!;
      const subscription = await storage.getUserSubscription(userId);
      
      if (!subscription) {
        return res.json({ plan: 'Free', status: 'active', analysesUsed: 0, analysesLimit: 5 });
      }
      
      const plan = await storage.getSubscriptionPlan(subscription.planId);
      
      res.json({
        id: subscription.id,
        plan: plan?.name || 'Unknown',
        status: subscription.status,
        analysesUsed: subscription.analysesUsedThisMonth,
        analysesLimit: plan?.analysesPerMonth || 0,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      });
    } catch (error) {
      handleError(res, error, "Failed to get subscription");
    }
  });
  
  /**
   * GET /api/analytics/stats
   * Get analytics statistics
   */
  app.get("/api/analytics/stats", async (req, res) => {
    try {
      const userId = req.userId;
      const stats = await storage.getAnalyticsStats(userId);
      res.json(stats);
    } catch (error) {
      handleError(res, error, "Failed to get analytics stats");
    }
  });
  
  /**
   * GET /api/analytics/recent
   * Get recent analyses
   */
  app.get("/api/analytics/recent", async (req, res) => {
    try {
      const userId = req.userId;
      const limit = parseInt(req.query.limit as string) || 10;
      const analyses = await storage.getRecentAnalyses(userId, limit);
      
      // Format for frontend
      const formatted = analyses.map(job => ({
        url: job.url,
        score: job.consensusScore || 0,
        date: job.completedAt?.toISOString().split('T')[0] || '',
        type: 'Website', // Could be enhanced with categorization
      }));
      
      res.json(formatted);
    } catch (error) {
      handleError(res, error, "Failed to get recent analyses");
    }
  });

  return httpServer;
}

/**
 * Process website analysis asynchronously using multi-agent orchestration
 */
async function processAnalysis(jobId: string, url: string): Promise<void> {
  try {
    // Step 1: Fetch website
    await storage.updateAnalysisJob(jobId, { status: "analyzing" });
    
    const fetchResult = await fetchWebsite(url);
    
    if (!fetchResult.success || !fetchResult.html) {
      await storage.updateAnalysisJob(jobId, {
        status: "failed",
        errorMessage: fetchResult.error || "Failed to fetch website",
      });
      return;
    }

    // Step 2: Extract content
    const extractedContent = extractWebsiteContent(fetchResult.html);
    
    await storage.updateAnalysisJob(jobId, {
      rawHtml: fetchResult.html.substring(0, 50000),
      pageTitle: fetchResult.title,
      pageDescription: fetchResult.description,
      extractedElements: extractedContent as any,
      status: "converting",
    });

    // Step 3: Multi-agent AI analysis with consensus
    console.log(`[${jobId}] Starting multi-agent analysis...`);
    
    const consensusResult = await runMultiAgentAnalysis(url, extractedContent);
    
    // Step 4: Generate mobile HTML from consensus
    const mobileHtml = generateConsensusHtml(
      consensusResult, 
      fetchResult.title || "Mobile Version"
    );

    // Step 5: Save initial design version
    await storage.createDesignVersion({
      jobId,
      version: 1,
      consensusScore: consensusResult.consensusScore,
      responsiveScore: consensusResult.responsiveScore,
      readabilityScore: consensusResult.readabilityScore,
      accessibilityScore: consensusResult.accessibilityScore,
      performanceScore: consensusResult.performanceScore,
      mobileHtml,
      agentEvaluations: consensusResult.evaluations as any,
      suggestions: consensusResult.suggestions as any,
      isSelected: true,
    });

    // Step 6: Save final results to analysis job
    await storage.updateAnalysisJob(jobId, {
      status: "completed",
      aiAnalysis: {
        evaluations: consensusResult.evaluations,
        accessibilityAudit: consensusResult.accessibilityAudit,
        performanceInsights: consensusResult.performanceInsights,
        colorPalette: consensusResult.colorPalette,
        typography: consensusResult.typography,
      } as any,
      mobileConversion: mobileHtml,
      suggestions: consensusResult.suggestions as any,
      responsiveScore: consensusResult.responsiveScore,
      readabilityScore: consensusResult.readabilityScore,
      consensusScore: consensusResult.consensusScore,
      accessibilityScore: consensusResult.accessibilityScore,
      performanceScore: consensusResult.performanceScore,
    });

    console.log(`[${jobId}] Analysis completed with consensus score: ${consensusResult.consensusScore}`);

  } catch (error: any) {
    console.error("Analysis processing error:", error);
    await storage.updateAnalysisJob(jobId, {
      status: "failed",
      errorMessage: error.message || "Analysis failed",
    });
  }
}
