import { queryClient } from "./queryClient";

const API_BASE = "/api";

// Types
export interface AnalysisJob {
  id: string;
  url: string;
  status: "pending" | "analyzing" | "converting" | "completed" | "failed";
  pageTitle?: string;
  pageDescription?: string;
  responsiveScore?: number;
  readabilityScore?: number;
  mobileConversion?: string;
  suggestions?: AISuggestion[];
  aiAnalysis?: AIAnalysisResult;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface AISuggestion {
  type: "style" | "layout" | "content" | "accessibility";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action?: string;
}

export interface AIAnalysisResult {
  responsiveScore: number;
  readabilityScore: number;
  suggestions: AISuggestion[];
  mobileLayout: MobileLayoutSection[];
  colorPalette: string[];
  typography: {
    headingFont: string;
    bodyFont: string;
    sizes: { heading: string; body: string; small: string };
  };
}

export interface MobileLayoutSection {
  id: string;
  type: string;
  title: string;
  content: string;
  styles: Record<string, string>;
}

export interface SavedDesign {
  id: string;
  name: string;
  originalUrl: string;
  status: string;
  analysisScore?: number;
  readabilityScore?: number;
  pageTitle?: string;
  pageDescription?: string;
  mobileHtml?: string;
  aiSuggestions?: AISuggestion[];
  isStarred?: boolean;
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
}

// API Functions
export async function startAnalysis(url: string): Promise<{ jobId: string; status: string }> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to start analysis");
  }
  return res.json();
}

export async function getAnalysisJob(jobId: string): Promise<AnalysisJob> {
  const res = await fetch(`${API_BASE}/analyze/${jobId}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to get analysis");
  }
  return res.json();
}

export async function saveDesign(jobId: string, name: string): Promise<SavedDesign> {
  const res = await fetch(`${API_BASE}/designs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId, name }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to save design");
  }
  queryClient.invalidateQueries({ queryKey: ["designs"] });
  return res.json();
}

export async function getAllDesigns(): Promise<SavedDesign[]> {
  const res = await fetch(`${API_BASE}/designs`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to get designs");
  }
  return res.json();
}

export async function getDesign(id: string): Promise<SavedDesign> {
  const res = await fetch(`${API_BASE}/designs/${id}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to get design");
  }
  return res.json();
}

export async function updateDesign(id: string, updates: { name?: string; isStarred?: boolean }): Promise<SavedDesign> {
  const res = await fetch(`${API_BASE}/designs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update design");
  }
  queryClient.invalidateQueries({ queryKey: ["designs"] });
  return res.json();
}

export async function deleteDesign(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/designs/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete design");
  }
  queryClient.invalidateQueries({ queryKey: ["designs"] });
}

// Polling helper for analysis status
export function pollAnalysisStatus(
  jobId: string,
  onUpdate: (job: AnalysisJob) => void,
  onComplete: (job: AnalysisJob) => void,
  onError: (error: Error) => void,
  intervalMs = 2000
): () => void {
  let active = true;
  
  const poll = async () => {
    if (!active) return;
    
    try {
      const job = await getAnalysisJob(jobId);
      onUpdate(job);
      
      if (job.status === "completed" || job.status === "failed") {
        if (job.status === "completed") {
          onComplete(job);
        } else {
          onError(new Error(job.errorMessage || "Analysis failed"));
        }
        return;
      }
      
      setTimeout(poll, intervalMs);
    } catch (error) {
      onError(error as Error);
    }
  };
  
  poll();
  
  return () => { active = false; };
}
