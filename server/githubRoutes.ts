/**
 * GitHub-Based Routes
 * Uses GitHub Issues, Gists, and GitHub Models instead of PostgreSQL and third-party AI
 */

import type { Express } from "express";
import type { Server } from "http";
import { 
  analyzeUrlRequestSchema, 
} from "@shared/schema";
import { fetchWebsite, extractWebsiteContent } from "./services/websiteFetcher";
import { 
  runGitHubModelsAnalysis, 
  generateGitHubModelsHtml 
} from "./services/githubModels";
import {
  createAnalysisJob,
  getAnalysisJob,
  updateAnalysisJob,
  getAllAnalysisJobs,
  initializeGitHubLabels,
} from "./services/githubStorage";
import { ZodError } from "zod";

export async function registerGitHubRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Ensure GitHub labels are initialized before registering routes
  try {
    await initializeGitHubLabels();
  } catch (err) {
    console.error("Failed to initialize GitHub labels:", err);
    // Continue anyway - labels can be created manually if needed
  }
  
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
  // ANALYSIS ENDPOINTS (GitHub-based)
  // ============================================

  /**
   * POST /api/github/analyze
   * Start analyzing a URL using GitHub Models and GitHub Issues
   */
  app.post("/api/github/analyze", async (req, res) => {
    try {
      const { url } = analyzeUrlRequestSchema.parse(req.body);

      // Create analysis job as GitHub Issue
      const job = await createAnalysisJob({
        url,
        status: "analyzing",
      });

      // Start async analysis (don't await - return job ID immediately)
      processGitHubAnalysis(job.id, url).catch(err => {
        console.error("GitHub analysis failed:", err);
      });

      res.json({ 
        jobId: job.id,
        issueNumber: job.issueNumber,
        status: "analyzing",
        message: "Analysis started using GitHub Models" 
      });
    } catch (error) {
      handleError(res, error, "Failed to start GitHub analysis");
    }
  });

  /**
   * GET /api/github/analyze/:jobId
   * Get the status and results of a GitHub-based analysis job
   */
  app.get("/api/github/analyze/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = await getAnalysisJob(jobId);

      if (!job) {
        return res.status(404).json({ error: "Analysis job not found" });
      }

      res.json({
        id: job.id,
        issueNumber: job.issueNumber,
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
        gistUrl: job.gistUrl,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
      });
    } catch (error) {
      handleError(res, error, "Failed to get GitHub analysis status");
    }
  });

  /**
   * GET /api/github/jobs
   * Get all GitHub-based analysis jobs
   */
  app.get("/api/github/jobs", async (req, res) => {
    try {
      const jobs = await getAllAnalysisJobs();
      res.json(jobs);
    } catch (error) {
      handleError(res, error, "Failed to get GitHub jobs");
    }
  });

  /**
   * GET /api/github/health
   * Health check for GitHub integration
   */
  app.get("/api/github/health", async (req, res) => {
    try {
      const hasToken = !!process.env.GITHUB_TOKEN;
      const repoOwner = process.env.GITHUB_REPO_OWNER || "Universal-Standard";
      const repoName = process.env.GITHUB_REPO_NAME || "Responsify";

      res.json({
        status: "ok",
        githubToken: hasToken ? "configured" : "missing",
        repository: `${repoOwner}/${repoName}`,
        services: {
          githubModels: "https://models.inference.ai.azure.com",
          githubIssues: "enabled",
          githubGists: "enabled",
        },
      });
    } catch (error) {
      handleError(res, error, "Health check failed");
    }
  });

  return httpServer;
}

/**
 * Process website analysis asynchronously using GitHub Models
 */
async function processGitHubAnalysis(jobId: string, url: string): Promise<void> {
  try {
    // Step 1: Fetch website
    await updateAnalysisJob(jobId, { status: "analyzing" });
    
    const fetchResult = await fetchWebsite(url);
    
    if (!fetchResult.success || !fetchResult.html) {
      await updateAnalysisJob(jobId, {
        status: "failed",
        errorMessage: fetchResult.error || "Failed to fetch website",
      });
      return;
    }

    // Step 2: Extract content
    const extractedContent = extractWebsiteContent(fetchResult.html);
    
    await updateAnalysisJob(jobId, {
      rawHtml: fetchResult.html.slice(0, 50000),
      pageTitle: fetchResult.title,
      pageDescription: fetchResult.description,
      extractedElements: extractedContent as any,
      status: "converting",
    });

    // Step 3: GitHub Models AI analysis with consensus
    console.log(`[${jobId}] Starting GitHub Models analysis...`);
    
    const consensusResult = await runGitHubModelsAnalysis(url, extractedContent);
    
    // Step 4: Generate mobile HTML from consensus
    const mobileHtml = generateGitHubModelsHtml(
      consensusResult, 
      fetchResult.title || "Mobile Version"
    );

    // Step 5: Save results (will be stored in Gist automatically)
    await updateAnalysisJob(jobId, {
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

    console.log(`[${jobId}] GitHub Models analysis completed with consensus score: ${consensusResult.consensusScore}`);

  } catch (error: any) {
    console.error("GitHub analysis processing error:", error);
    await updateAnalysisJob(jobId, {
      status: "failed",
      errorMessage: error.message || "Analysis failed",
    });
  }
}
