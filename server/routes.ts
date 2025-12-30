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
   */
  app.post("/api/analyze", async (req, res) => {
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
