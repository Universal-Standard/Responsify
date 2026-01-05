import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - Enhanced with GitHub OAuth and user management
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // GitHub OAuth fields
  githubId: text("github_id").unique(),
  githubUsername: text("github_username"),
  githubAvatarUrl: text("github_avatar_url"),
  githubAccessToken: text("github_access_token"),
  
  // Basic auth (legacy support)
  username: text("username").unique(),
  password: text("password"),
  
  // User profile
  email: text("email").unique(),
  displayName: text("display_name"),
  bio: text("bio"),
  
  // Account status
  role: text("role").notNull().default("free"), // free, pro, enterprise
  accountStatus: text("account_status").notNull().default("active"), // active, suspended, deleted
  emailVerified: boolean("email_verified").default(false),
  
  // Subscription data
  subscriptionTier: text("subscription_tier").default("free"), // free, pro, enterprise
  subscriptionStatus: text("subscription_status"), // active, canceled, past_due
  subscriptionId: text("subscription_id"),
  currentPeriodEnd: timestamp("current_period_end"),
  
  // Usage tracking
  analysisCount: integer("analysis_count").default(0),
  lastAnalysisAt: timestamp("last_analysis_at"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Website analysis status enum
export const analysisStatusEnum = z.enum(["pending", "analyzing", "converting", "completed", "failed"]);
export type AnalysisStatus = z.infer<typeof analysisStatusEnum>;

// Saved designs table
export const savedDesigns = pgTable("saved_designs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  originalUrl: text("original_url").notNull(),
  
  // Analysis metadata
  status: text("status").notNull().default("pending"),
  analysisScore: integer("analysis_score"),
  readabilityScore: integer("readability_score"),
  
  // Website content extracted
  pageTitle: text("page_title"),
  pageDescription: text("page_description"),
  extractedContent: jsonb("extracted_content"),
  
  // AI-generated mobile version
  mobileHtml: text("mobile_html"),
  mobileStyles: text("mobile_styles"),
  aiSuggestions: jsonb("ai_suggestions"),
  
  // User preferences
  isStarred: boolean("is_starred").default(false),
  viewCount: integer("view_count").default(0),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSavedDesignSchema = createInsertSchema(savedDesigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSavedDesign = z.infer<typeof insertSavedDesignSchema>;
export type SavedDesign = typeof savedDesigns.$inferSelect;

// Analysis jobs table (for tracking async analysis tasks)
export const analysisJobs = pgTable("analysis_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  status: text("status").notNull().default("pending"),
  
  // Raw fetched content
  rawHtml: text("raw_html"),
  pageTitle: text("page_title"),
  pageDescription: text("page_description"),
  
  // Extracted structure
  extractedElements: jsonb("extracted_elements"),
  
  // AI analysis results
  aiAnalysis: jsonb("ai_analysis"),
  mobileConversion: text("mobile_conversion"),
  suggestions: jsonb("suggestions"),
  
  // Scores
  responsiveScore: integer("responsive_score"),
  readabilityScore: integer("readability_score"),
  consensusScore: integer("consensus_score"),
  accessibilityScore: integer("accessibility_score"),
  performanceScore: integer("performance_score"),
  
  // Error tracking
  errorMessage: text("error_message"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertAnalysisJobSchema = createInsertSchema(analysisJobs).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type InsertAnalysisJob = z.infer<typeof insertAnalysisJobSchema>;
export type AnalysisJob = typeof analysisJobs.$inferSelect;

// Update type for analysis jobs - includes all updateable fields
export type UpdateAnalysisJob = Partial<{
  url: string;
  status: string;
  rawHtml: string | null;
  pageTitle: string | null;
  pageDescription: string | null;
  extractedElements: unknown;
  aiAnalysis: unknown;
  mobileConversion: string | null;
  suggestions: unknown;
  responsiveScore: number | null;
  readabilityScore: number | null;
  consensusScore: number | null;
  accessibilityScore: number | null;
  performanceScore: number | null;
  errorMessage: string | null;
  completedAt: Date | null;
}>;

// Request/response schemas for API validation
export const analyzeUrlRequestSchema = z.object({
  url: z.string().min(1, "Please enter a URL").transform((val) => {
    const trimmed = val.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return "https://" + trimmed;
    }
    return trimmed;
  }),
});

export const saveDesignRequestSchema = z.object({
  jobId: z.string(),
  name: z.string().min(1, "Name is required"),
});

export const updateDesignRequestSchema = z.object({
  name: z.string().optional(),
  isStarred: z.boolean().optional(),
});

export type AnalyzeUrlRequest = z.infer<typeof analyzeUrlRequestSchema>;
export type SaveDesignRequest = z.infer<typeof saveDesignRequestSchema>;
export type UpdateDesignRequest = z.infer<typeof updateDesignRequestSchema>;

// Chat conversations table (for AI integrations)
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Design versions table (for iteration history)
export const designVersions = pgTable("design_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull(),
  version: integer("version").notNull().default(1),
  
  // Consensus data
  consensusScore: integer("consensus_score"),
  responsiveScore: integer("responsive_score"),
  readabilityScore: integer("readability_score"),
  accessibilityScore: integer("accessibility_score"),
  performanceScore: integer("performance_score"),
  
  // Generated content
  mobileHtml: text("mobile_html"),
  
  // Agent evaluations
  agentEvaluations: jsonb("agent_evaluations"),
  suggestions: jsonb("suggestions"),
  
  // Iteration metadata
  iterationReason: text("iteration_reason"),
  isSelected: boolean("is_selected").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDesignVersionSchema = createInsertSchema(designVersions).omit({
  id: true,
  createdAt: true,
});

export type DesignVersion = typeof designVersions.$inferSelect;
export type InsertDesignVersion = z.infer<typeof insertDesignVersionSchema>;

// User Analyses table - Links users to their analysis history
export const userAnalyses = pgTable("user_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  analysisJobId: varchar("analysis_job_id").notNull().references(() => analysisJobs.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "set null" }),
  
  // User metadata
  customName: text("custom_name"),
  tags: jsonb("tags").$type<string[]>(),
  notes: text("notes"),
  isFavorite: boolean("is_favorite").default(false),
  isShared: boolean("is_shared").default(false),
  shareToken: text("share_token"),
  
  // Usage tracking
  viewCount: integer("view_count").default(0),
  lastViewedAt: timestamp("last_viewed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserAnalysisSchema = createInsertSchema(userAnalyses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserAnalysis = typeof userAnalyses.$inferSelect;
export type InsertUserAnalysis = z.infer<typeof insertUserAnalysisSchema>;

// Projects table - Organize analyses into projects
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#6366f1"), // For UI organization
  icon: text("icon"), // Lucide icon name
  
  // Collaboration
  isTeamProject: boolean("is_team_project").default(false),
  
  // Stats
  analysisCount: integer("analysis_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

// Project Members table - Team collaboration
export const projectMembers = pgTable("project_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  role: text("role").notNull().default("viewer"), // owner, editor, viewer
  invitedBy: varchar("invited_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectMemberSchema = createInsertSchema(projectMembers).omit({
  id: true,
  createdAt: true,
});

export type ProjectMember = typeof projectMembers.$inferSelect;
export type InsertProjectMember = z.infer<typeof insertProjectMemberSchema>;

// User Preferences table - Store user settings
export const userPreferences = pgTable("user_preferences", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  
  // UI preferences
  theme: text("theme").default("dark"), // light, dark, system
  compactMode: boolean("compact_mode").default(false),
  
  // Notifications
  emailNotifications: boolean("email_notifications").default(true),
  analysisCompleteEmail: boolean("analysis_complete_email").default(true),
  weeklyDigest: boolean("weekly_digest").default(true),
  
  // Analysis defaults
  defaultView: text("default_view").default("mobile"), // mobile, tablet, desktop
  autoSaveEnabled: boolean("auto_save_enabled").default(true),
  
  // Dashboard
  dashboardLayout: jsonb("dashboard_layout"),
  defaultProject: varchar("default_project").references(() => projects.id),
  
  // Privacy
  analyticsEnabled: boolean("analytics_enabled").default(true),
  profilePublic: boolean("profile_public").default(false),
  
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  updatedAt: true,
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

// API Keys table - For programmatic access
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull().unique(), // Store hashed key
  keyPrefix: text("key_prefix").notNull(), // First 8 chars for identification
  
  // Permissions
  scopes: jsonb("scopes").$type<string[]>(), // ['read', 'write', 'delete']
  
  // Usage
  lastUsedAt: timestamp("last_used_at"),
  requestCount: integer("request_count").default(0),
  
  // Status
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  revokedAt: timestamp("revoked_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

// Rate Limits table - Track API usage
export const rateLimits = pgTable("rate_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  ipAddress: text("ip_address"),
  
  endpoint: text("endpoint").notNull(),
  requestCount: integer("request_count").notNull().default(1),
  
  windowStart: timestamp("window_start").notNull(),
  windowEnd: timestamp("window_end").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRateLimitSchema = createInsertSchema(rateLimits).omit({
  id: true,
  createdAt: true,
});

export type RateLimit = typeof rateLimits.$inferSelect;
export type InsertRateLimit = z.infer<typeof insertRateLimitSchema>;

// Monitoring Schedules table - Scheduled website checks
export const monitoringSchedules = pgTable("monitoring_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "set null" }),
  
  url: text("url").notNull(),
  name: text("name").notNull(),
  
  // Schedule configuration
  frequency: text("frequency").notNull(), // daily, weekly, monthly
  time: text("time"), // HH:MM format
  dayOfWeek: integer("day_of_week"), // 0-6 for weekly
  dayOfMonth: integer("day_of_month"), // 1-31 for monthly
  
  // Alert configuration
  alertOnScoreChange: boolean("alert_on_score_change").default(true),
  alertThreshold: integer("alert_threshold").default(10), // Alert if score changes by this much
  alertEmail: text("alert_email"),
  
  // Status
  isActive: boolean("is_active").default(true),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMonitoringScheduleSchema = createInsertSchema(monitoringSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type MonitoringSchedule = typeof monitoringSchedules.$inferSelect;
export type InsertMonitoringSchedule = z.infer<typeof insertMonitoringScheduleSchema>;

// A/B Tests table - Track A/B testing experiments
export const abTests = pgTable("ab_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  name: text("name").notNull(),
  description: text("description"),
  
  // Test configuration
  variantA: varchar("variant_a").notNull().references(() => analysisJobs.id),
  variantB: varchar("variant_b").notNull().references(() => analysisJobs.id),
  
  // Results
  variantAViews: integer("variant_a_views").default(0),
  variantBViews: integer("variant_b_views").default(0),
  variantAConversions: integer("variant_a_conversions").default(0),
  variantBConversions: integer("variant_b_conversions").default(0),
  
  // Metrics
  goalMetric: text("goal_metric"), // clicks, time_on_page, conversions
  goalValue: text("goal_value"),
  
  // Status
  status: text("status").notNull().default("draft"), // draft, running, completed, archived
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAbTestSchema = createInsertSchema(abTests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AbTest = typeof abTests.$inferSelect;
export type InsertAbTest = z.infer<typeof insertAbTestSchema>;
