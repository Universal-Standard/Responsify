import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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

// Subscription plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  stripePriceId: text("stripe_price_id").notNull().unique(),
  
  // Pricing
  price: integer("price").notNull(), // in cents
  currency: text("currency").notNull().default("usd"),
  interval: text("interval").notNull(), // 'month' or 'year'
  
  // Limits
  analysesPerMonth: integer("analyses_per_month").notNull(),
  maxSavedDesigns: integer("max_saved_designs").notNull(),
  
  // Features
  features: jsonb("features"),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

// User subscriptions table
export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  
  // Stripe details
  stripeCustomerId: text("stripe_customer_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  
  // Status
  status: text("status").notNull(), // 'active', 'canceled', 'past_due', 'trialing'
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  
  // Usage tracking
  analysesUsedThisMonth: integer("analyses_used_this_month").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;

// Billing API schemas
export const createCheckoutSessionSchema = z.object({
  priceId: z.string().min(1, "Price ID is required"),
});

export const manageBillingPortalSchema = z.object({
  returnUrl: z.string().url().optional(),
});

export type CreateCheckoutSessionRequest = z.infer<typeof createCheckoutSessionSchema>;
export type ManageBillingPortalRequest = z.infer<typeof manageBillingPortalSchema>;
