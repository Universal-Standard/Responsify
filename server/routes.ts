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
        extractedContent: (job.extractedElements || {}) as any,
        mobileHtml: job.mobileConversion,
        mobileStyles: null,
        aiSuggestions: (job.suggestions || []) as any,
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
      const { versionId} = req.params;
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
  // USER MANAGEMENT ENDPOINTS
  // ============================================

  /**
   * GET /api/users/:userId/analyses
   * Get user's analysis history with pagination and filtering
   */
  app.get("/api/users/:userId/analyses", async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = '1', limit = '50', search = '', status = '', projectId = '' } = req.query;
      
      // In production, verify user is authenticated and authorized
      // if (req.session?.user?.id !== userId) {
      //   return res.status(403).json({ error: "Unauthorized" });
      // }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Build query - this is a simplified version
      // In production, use proper query builder or ORM
      const analyses = await storage.db
        .prepare(`
          SELECT 
            a.*,
            ua.project_id,
            ua.tags,
            ua.notes,
            ua.is_favorite,
            ua.view_count,
            p.name as project_name,
            p.color as project_color
          FROM analyses a
          LEFT JOIN user_analyses ua ON a.id = ua.analysis_id
          LEFT JOIN projects p ON ua.project_id = p.id
          WHERE ua.user_id = ?
            AND (? = '' OR a.url LIKE '%' || ? || '%')
            AND (? = '' OR a.status = ?)
            AND (? = '' OR ua.project_id = ?)
          ORDER BY a.created_at DESC
          LIMIT ? OFFSET ?
        `)
        .all(
          userId,
          search, search,
          status, status,
          projectId, projectId,
          limitNum,
          offset
        );

      const total = await storage.db
        .prepare(`
          SELECT COUNT(*) as count
          FROM analyses a
          LEFT JOIN user_analyses ua ON a.id = ua.analysis_id
          WHERE ua.user_id = ?
            AND (? = '' OR a.url LIKE '%' || ? || '%')
            AND (? = '' OR a.status = ?)
            AND (? = '' OR ua.project_id = ?)
        `)
        .get(
          userId,
          search, search,
          status, status,
          projectId, projectId
        );

      res.json({
        success: true,
        data: analyses,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: (total as any)?.count || 0,
        },
      });
    } catch (error) {
      handleError(res, error, "Failed to get user analyses");
    }
  });

  // ============================================
  // PROJECTS ENDPOINTS
  // ============================================

  /**
   * GET /api/projects
   * Get all projects for the authenticated user
   */
  app.get("/api/projects", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      
      if (!userId) {
        return res.status(400).json({ error: "userId required" });
      }

      const projects = await storage.db
        .prepare(`
          SELECT 
            p.*,
            COUNT(DISTINCT ua.id) as analysis_count,
            COUNT(DISTINCT pm.id) as member_count
          FROM projects p
          LEFT JOIN user_analyses ua ON p.id = ua.project_id
          LEFT JOIN project_members pm ON p.id = pm.project_id
          WHERE p.user_id = ?
          GROUP BY p.id
          ORDER BY p.created_at DESC
        `)
        .all(userId);

      res.json({ success: true, data: projects });
    } catch (error) {
      handleError(res, error, "Failed to get projects");
    }
  });

  /**
   * POST /api/projects
   * Create a new project
   */
  app.post("/api/projects", async (req, res) => {
    try {
      const { userId, name, description, color, icon } = req.body;

      if (!userId || !name) {
        return res.status(400).json({ error: "userId and name required" });
      }

      const result = await storage.db
        .prepare(`
          INSERT INTO projects (id, user_id, name, description, color, icon, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `)
        .run(
          crypto.randomUUID(),
          userId,
          name,
          description || null,
          color || '#6366f1',
          icon || '📁'
        );

      const project = await storage.db
        .prepare('SELECT * FROM projects WHERE id = ?')
        .get(result.lastInsertRowid);

      res.json({ success: true, data: project });
    } catch (error) {
      handleError(res, error, "Failed to create project");
    }
  });

  /**
   * PUT /api/projects/:projectId
   * Update a project
   */
  app.put("/api/projects/:projectId", async (req, res) => {
    try {
      const { projectId } = req.params;
      const { name, description, color, icon } = req.body;

      await storage.db
        .prepare(`
          UPDATE projects 
          SET name = ?, description = ?, color = ?, icon = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)
        .run(name, description, color, icon, projectId);

      const project = await storage.db
        .prepare('SELECT * FROM projects WHERE id = ?')
        .get(projectId);

      res.json({ success: true, data: project });
    } catch (error) {
      handleError(res, error, "Failed to update project");
    }
  });

  /**
   * DELETE /api/projects/:projectId
   * Delete a project
   */
  app.delete("/api/projects/:projectId", async (req, res) => {
    try {
      const { projectId } = req.params;

      await storage.db
        .prepare('DELETE FROM projects WHERE id = ?')
        .run(projectId);

      res.json({ success: true, message: "Project deleted" });
    } catch (error) {
      handleError(res, error, "Failed to delete project");
    }
  });

  // ============================================
  // USER PROFILE & PREFERENCES ENDPOINTS
  // ============================================

  /**
   * PUT /api/users/:userId/profile
   * Update user profile
   */
  app.put("/api/users/:userId/profile", async (req, res) => {
    try {
      const { userId } = req.params;
      const { displayName, bio } = req.body;

      await storage.db
        .prepare(`
          UPDATE users 
          SET display_name = ?, bio = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)
        .run(displayName, bio, userId);

      const user = await storage.db
        .prepare('SELECT * FROM users WHERE id = ?')
        .get(userId);

      res.json({ success: true, data: user });
    } catch (error) {
      handleError(res, error, "Failed to update profile");
    }
  });

  /**
   * GET /api/users/:userId/preferences
   * Get user preferences
   */
  app.get("/api/users/:userId/preferences", async (req, res) => {
    try {
      const { userId } = req.params;

      let preferences = await storage.db
        .prepare('SELECT * FROM user_preferences WHERE user_id = ?')
        .get(userId);

      // Create default preferences if not exist
      if (!preferences) {
        await storage.db
          .prepare(`
            INSERT INTO user_preferences (
              id, user_id, theme, compact_mode, email_notifications,
              analysis_notifications, created_at, updated_at
            ) VALUES (?, ?, 'system', 0, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `)
          .run(crypto.randomUUID(), userId);

        preferences = await storage.db
          .prepare('SELECT * FROM user_preferences WHERE user_id = ?')
          .get(userId);
      }

      res.json({ success: true, data: preferences });
    } catch (error) {
      handleError(res, error, "Failed to get preferences");
    }
  });

  /**
   * PUT /api/users/:userId/preferences
   * Update user preferences
   */
  app.put("/api/users/:userId/preferences", async (req, res) => {
    try {
      const { userId } = req.params;
      const { 
        theme, 
        compactMode, 
        emailNotifications, 
        analysisNotifications 
      } = req.body;

      await storage.db
        .prepare(`
          INSERT INTO user_preferences (
            id, user_id, theme, compact_mode, email_notifications, analysis_notifications, 
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT(user_id) DO UPDATE SET
            theme = excluded.theme,
            compact_mode = excluded.compact_mode,
            email_notifications = excluded.email_notifications,
            analysis_notifications = excluded.analysis_notifications,
            updated_at = CURRENT_TIMESTAMP
        `)
        .run(
          crypto.randomUUID(),
          userId,
          theme || 'system',
          compactMode ? 1 : 0,
          emailNotifications ? 1 : 0,
          analysisNotifications ? 1 : 0
        );

      const preferences = await storage.db
        .prepare('SELECT * FROM user_preferences WHERE user_id = ?')
        .get(userId);

      res.json({ success: true, data: preferences });
    } catch (error) {
      handleError(res, error, "Failed to update preferences");
    }
  });

  // ============================================
  // API KEYS ENDPOINTS
  // ============================================

  /**
   * GET /api/api-keys
   * Get user's API keys
   */
  app.get("/api/api-keys", async (req, res) => {
    try {
      const userId = req.query.userId as string;

      if (!userId) {
        return res.status(400).json({ error: "userId required" });
      }

      const keys = await storage.db
        .prepare(`
          SELECT id, name, scopes, last_used_at, created_at
          FROM api_keys
          WHERE user_id = ? AND revoked_at IS NULL
          ORDER BY created_at DESC
        `)
        .all(userId);

      res.json({ success: true, data: keys });
    } catch (error) {
      handleError(res, error, "Failed to get API keys");
    }
  });

  /**
   * POST /api/api-keys
   * Generate a new API key
   */
  app.post("/api/api-keys", async (req, res) => {
    try {
      const { userId, name, scopes } = req.body;

      if (!userId || !name) {
        return res.status(400).json({ error: "userId and name required" });
      }

      // Generate a secure random key
      const key = `rsk_${crypto.randomUUID().replace(/-/g, '')}`;
      
      // In production, hash the key before storing
      // const hashedKey = await bcrypt.hash(key, 10);

      await storage.db
        .prepare(`
          INSERT INTO api_keys (
            id, user_id, name, key, scopes, created_at
          ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `)
        .run(
          crypto.randomUUID(),
          userId,
          name,
          key, // In production, store hashedKey
          scopes || 'read'
        );

      // Return the key ONCE - user must copy it
      res.json({ 
        success: true, 
        key: key,
        message: "Save this key - it won't be shown again"
      });
    } catch (error) {
      handleError(res, error, "Failed to create API key");
    }
  });

  /**
   * DELETE /api/api-keys/:keyId
   * Revoke an API key
   */
  app.delete("/api/api-keys/:keyId", async (req, res) => {
    try {
      const { keyId } = req.params;

      await storage.db
        .prepare(`
          UPDATE api_keys 
          SET revoked_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)
        .run(keyId);

      res.json({ success: true, message: "API key revoked" });
    } catch (error) {
      handleError(res, error, "Failed to revoke API key");
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
