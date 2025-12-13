import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
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
  errorMessage: string | null;
  completedAt: Date | null;
}>;

// Request/response schemas for API validation
export const analyzeUrlRequestSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
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
