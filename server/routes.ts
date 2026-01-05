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
      const { createCheckoutSession } = await import("./services/stripe");
      const { createCheckoutSessionSchema } = await import("@shared/schema");
      
      const { priceId } = createCheckoutSessionSchema.parse(req.body);
      
      // TODO: Get actual user ID from session
      const userId = "demo-user-id";
      const userEmail = "demo@example.com";
      
      const session = await createCheckoutSession(priceId, userId, userEmail);
      
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
      
      // TODO: Get customer ID from user's subscription
      const customerId = "demo-customer-id";
      
      const session = await createPortalSession(customerId, returnUrl);
      
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
      
      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed':
          // TODO: Create or update user subscription
          console.log('Checkout completed:', event.data.object);
          break;
          
        case 'customer.subscription.updated':
          // TODO: Update subscription status
          console.log('Subscription updated:', event.data.object);
          break;
          
        case 'customer.subscription.deleted':
          // TODO: Cancel subscription
          console.log('Subscription deleted:', event.data.object);
          break;
          
        case 'invoice.payment_failed':
          // TODO: Handle failed payment
          console.log('Payment failed:', event.data.object);
          break;
          
        default:
          console.log('Unhandled event type:', event.type);
      }
      
      res.json({ received: true });
    } catch (error) {
      handleError(res, error, "Webhook error");
    }
  });

  /**
   * GET /api/billing/plans
   * Get all available subscription plans
   */
  app.get("/api/billing/plans", async (req, res) => {
    try {
      // Mock plans for now - in production, fetch from database
      const plans = [
        {
          id: "plan_free",
          name: "Free",
          description: "Get started with basic features",
          price: 0,
          currency: "usd",
          interval: "month",
          analysesPerMonth: 5,
          maxSavedDesigns: 3,
          features: [
            "5 website analyses per month",
            "3 saved designs",
            "Basic AI analysis",
            "Standard support"
          ],
          stripePriceId: "price_free",
          isActive: true,
        },
        {
          id: "plan_pro",
          name: "Pro",
          description: "Perfect for professionals",
          price: 1900, // $19.00
          currency: "usd",
          interval: "month",
          analysesPerMonth: 50,
          maxSavedDesigns: 50,
          features: [
            "50 website analyses per month",
            "50 saved designs",
            "Advanced AI analysis with all 3 providers",
            "Design versioning",
            "Comparison tools",
            "Priority support"
          ],
          stripePriceId: process.env.STRIPE_PRICE_ID_PRO || "price_pro",
          isActive: true,
        },
        {
          id: "plan_enterprise",
          name: "Enterprise",
          description: "For teams and agencies",
          price: 9900, // $99.00
          currency: "usd",
          interval: "month",
          analysesPerMonth: -1, // unlimited
          maxSavedDesigns: -1, // unlimited
          features: [
            "Unlimited website analyses",
            "Unlimited saved designs",
            "Advanced AI analysis",
            "Team collaboration",
            "API access",
            "White-label options",
            "Dedicated support"
          ],
          stripePriceId: process.env.STRIPE_PRICE_ID_ENTERPRISE || "price_enterprise",
          isActive: true,
        },
      ];
      
      res.json(plans);
    } catch (error) {
      handleError(res, error, "Failed to get plans");
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
