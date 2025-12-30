import { 
  users, type User, type InsertUser,
  savedDesigns, type SavedDesign, type InsertSavedDesign,
  analysisJobs, type AnalysisJob, type InsertAnalysisJob, type UpdateAnalysisJob,
  designVersions, type DesignVersion, type InsertDesignVersion
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Analysis Jobs
  createAnalysisJob(job: InsertAnalysisJob): Promise<AnalysisJob>;
  getAnalysisJob(id: string): Promise<AnalysisJob | undefined>;
  updateAnalysisJob(id: string, updates: UpdateAnalysisJob): Promise<AnalysisJob | undefined>;
  
  // Saved Designs
  createSavedDesign(design: InsertSavedDesign): Promise<SavedDesign>;
  getSavedDesign(id: string): Promise<SavedDesign | undefined>;
  getAllSavedDesigns(): Promise<SavedDesign[]>;
  updateSavedDesign(id: string, updates: Partial<InsertSavedDesign>): Promise<SavedDesign | undefined>;
  deleteSavedDesign(id: string): Promise<boolean>;
  incrementViewCount(id: string): Promise<void>;
  
  // Design Versions
  createDesignVersion(version: InsertDesignVersion): Promise<DesignVersion>;
  getDesignVersions(jobId: string): Promise<DesignVersion[]>;
  getDesignVersion(id: string): Promise<DesignVersion | undefined>;
  selectDesignVersion(id: string): Promise<DesignVersion | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Analysis Jobs
  async createAnalysisJob(job: InsertAnalysisJob): Promise<AnalysisJob> {
    const [created] = await db.insert(analysisJobs).values(job).returning();
    return created;
  }

  async getAnalysisJob(id: string): Promise<AnalysisJob | undefined> {
    const [job] = await db.select().from(analysisJobs).where(eq(analysisJobs.id, id));
    return job || undefined;
  }

  async updateAnalysisJob(id: string, updates: UpdateAnalysisJob): Promise<AnalysisJob | undefined> {
    const [updated] = await db
      .update(analysisJobs)
      .set(updates)
      .where(eq(analysisJobs.id, id))
      .returning();
    return updated || undefined;
  }

  // Saved Designs
  async createSavedDesign(design: InsertSavedDesign): Promise<SavedDesign> {
    const [created] = await db.insert(savedDesigns).values(design).returning();
    return created;
  }

  async getSavedDesign(id: string): Promise<SavedDesign | undefined> {
    const [design] = await db.select().from(savedDesigns).where(eq(savedDesigns.id, id));
    return design || undefined;
  }

  async getAllSavedDesigns(): Promise<SavedDesign[]> {
    return await db.select().from(savedDesigns).orderBy(desc(savedDesigns.createdAt));
  }

  async updateSavedDesign(id: string, updates: Partial<InsertSavedDesign>): Promise<SavedDesign | undefined> {
    const [updated] = await db
      .update(savedDesigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(savedDesigns.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSavedDesign(id: string): Promise<boolean> {
    const result = await db.delete(savedDesigns).where(eq(savedDesigns.id, id)).returning();
    return result.length > 0;
  }

  async incrementViewCount(id: string): Promise<void> {
    await db
      .update(savedDesigns)
      .set({ viewCount: sql`${savedDesigns.viewCount} + 1` })
      .where(eq(savedDesigns.id, id));
  }

  // Design Versions
  async createDesignVersion(version: InsertDesignVersion): Promise<DesignVersion> {
    const [created] = await db.insert(designVersions).values(version).returning();
    return created;
  }

  async getDesignVersions(jobId: string): Promise<DesignVersion[]> {
    return await db.select().from(designVersions)
      .where(eq(designVersions.jobId, jobId))
      .orderBy(desc(designVersions.version));
  }

  async getDesignVersion(id: string): Promise<DesignVersion | undefined> {
    const [version] = await db.select().from(designVersions).where(eq(designVersions.id, id));
    return version || undefined;
  }

  async selectDesignVersion(id: string): Promise<DesignVersion | undefined> {
    const version = await this.getDesignVersion(id);
    if (!version) return undefined;
    
    // Deselect all versions for this job
    await db.update(designVersions)
      .set({ isSelected: false })
      .where(eq(designVersions.jobId, version.jobId));
    
    // Select this version
    const [updated] = await db.update(designVersions)
      .set({ isSelected: true })
      .where(eq(designVersions.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
