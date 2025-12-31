/**
 * GitHub Storage Service
 * Uses GitHub Issues, Gists, and GitHub Pages as a database replacement
 * 
 * Architecture:
 * - GitHub Issues: Track analysis jobs (one issue per job)
 * - GitHub Gists: Store generated mobile HTML and design data
 * - GitHub Projects: Organize and track job status
 * - Issue Labels: Categorize job status (analyzing, completed, failed)
 * - Issue Comments: Store progress updates and version history
 */

import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Repository where issues will be created
const REPO_OWNER = process.env.GITHUB_REPO_OWNER || "Universal-Standard";
const REPO_NAME = process.env.GITHUB_REPO_NAME || "Responsify";

// Labels for job status
const STATUS_LABELS = {
  ANALYZING: "status:analyzing",
  CONVERTING: "status:converting",
  COMPLETED: "status:completed",
  FAILED: "status:failed",
} as const;

interface AnalysisJobData {
  url: string;
  status: "analyzing" | "converting" | "completed" | "failed";
  pageTitle?: string;
  pageDescription?: string;
  responsiveScore?: number;
  readabilityScore?: number;
  consensusScore?: number;
  accessibilityScore?: number;
  performanceScore?: number;
  mobileConversion?: string;
  suggestions?: any;
  aiAnalysis?: any;
  errorMessage?: string;
  rawHtml?: string;
  extractedElements?: any;
  gistId?: string;
  gistUrl?: string;
}

interface GitHubAnalysisJob extends AnalysisJobData {
  id: string;
  issueNumber: number;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Initialize repository labels for job tracking
 */
export async function initializeGitHubLabels(): Promise<void> {
  const labels = [
    { name: STATUS_LABELS.ANALYZING, color: "0366d6", description: "Analysis in progress" },
    { name: STATUS_LABELS.CONVERTING, color: "fbca04", description: "Converting to mobile" },
    { name: STATUS_LABELS.COMPLETED, color: "0e8a16", description: "Analysis completed" },
    { name: STATUS_LABELS.FAILED, color: "d73a4a", description: "Analysis failed" },
    { name: "responsify:job", color: "5319e7", description: "ResponsiAI analysis job" },
  ];

  for (const label of labels) {
    try {
      await octokit.issues.createLabel({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        name: label.name,
        color: label.color,
        description: label.description,
      });
      console.log(`Created label: ${label.name}`);
    } catch (error: any) {
      if (error.status === 422) {
        // Label already exists, update it
        try {
          await octokit.issues.updateLabel({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            name: label.name,
            color: label.color,
            description: label.description,
          });
          console.log(`Updated label: ${label.name}`);
        } catch (updateError) {
          console.error(`Failed to update label ${label.name}:`, updateError);
        }
      } else {
        console.error(`Failed to create label ${label.name}:`, error);
      }
    }
  }
}

/**
 * Create a new analysis job as a GitHub Issue
 */
export async function createAnalysisJob(data: Pick<AnalysisJobData, "url" | "status">): Promise<GitHubAnalysisJob> {
  const issue = await octokit.issues.create({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    title: `Analysis: ${data.url}`,
    body: `# Website Analysis Job

**URL:** ${data.url}
**Status:** ${data.status}
**Created:** ${new Date().toISOString()}

---

This issue tracks the mobile responsiveness analysis for the website.

## Progress
- [ ] Fetch website
- [ ] Extract content
- [ ] AI analysis
- [ ] Generate mobile design
- [ ] Create consensus scores

**Powered by ResponsiAI using GitHub Models**`,
    labels: ["responsify:job", STATUS_LABELS.ANALYZING],
  });

  return {
    id: `github-issue-${issue.data.number}`,
    issueNumber: issue.data.number,
    url: data.url,
    status: data.status,
    createdAt: new Date(issue.data.created_at),
  };
}

/**
 * Get an analysis job by ID
 */
export async function getAnalysisJob(jobId: string): Promise<GitHubAnalysisJob | null> {
  const issueNumber = parseInt(jobId.replace("github-issue-", ""));
  if (isNaN(issueNumber)) return null;

  try {
    const issue = await octokit.issues.get({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      issue_number: issueNumber,
    });

    // Parse data from issue body and comments
    const data = parseIssueData(issue.data);
    
    return {
      id: jobId,
      issueNumber,
      ...data,
      createdAt: new Date(issue.data.created_at),
      completedAt: data.status === "completed" ? new Date(issue.data.updated_at) : undefined,
    };
  } catch (error) {
    console.error(`Failed to get issue ${issueNumber}:`, error);
    return null;
  }
}

/**
 * Update an analysis job
 */
export async function updateAnalysisJob(
  jobId: string,
  updates: Partial<AnalysisJobData>
): Promise<GitHubAnalysisJob | null> {
  const issueNumber = parseInt(jobId.replace("github-issue-", ""));
  if (isNaN(issueNumber)) return null;

  try {
    // Get current issue
    const currentIssue = await octokit.issues.get({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      issue_number: issueNumber,
    });

    const currentData = parseIssueData(currentIssue.data);
    const mergedData = { ...currentData, ...updates };

    // Update labels based on status
    let labels = ["responsify:job"];
    if (updates.status) {
      const statusLabel = STATUS_LABELS[updates.status.toUpperCase() as keyof typeof STATUS_LABELS];
      if (statusLabel) {
        labels.push(statusLabel);
      }
    }

    // Store large data in Gist if mobile conversion is updated
    let gistId = mergedData.gistId;
    let gistUrl = mergedData.gistUrl;
    
    if (updates.mobileConversion && updates.mobileConversion.length > 0) {
      const gist = await createOrUpdateGist(
        gistId,
        mergedData.url,
        updates.mobileConversion,
        mergedData
      );
      gistId = gist.id;
      gistUrl = gist.html_url;
    }

    // Update issue
    const updatedBody = generateIssueBody({
      ...mergedData,
      gistId,
      gistUrl,
    });

    await octokit.issues.update({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      issue_number: issueNumber,
      body: updatedBody,
      labels,
    });

    // Add a comment with the update
    if (updates.status || updates.consensusScore !== undefined) {
      const comment = generateUpdateComment(updates);
      await octokit.issues.createComment({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        issue_number: issueNumber,
        body: comment,
      });
    }

    return await getAnalysisJob(jobId);
  } catch (error) {
    console.error(`Failed to update issue ${issueNumber}:`, error);
    return null;
  }
}

/**
 * Create or update a Gist to store mobile HTML and design data
 */
async function createOrUpdateGist(
  existingGistId: string | undefined,
  url: string,
  mobileHtml: string,
  data: AnalysisJobData
): Promise<{ id: string; html_url: string }> {
  const files: any = {
    "mobile.html": {
      content: mobileHtml,
    },
    "analysis-data.json": {
      content: JSON.stringify({
        url: data.url,
        pageTitle: data.pageTitle,
        pageDescription: data.pageDescription,
        responsiveScore: data.responsiveScore,
        readabilityScore: data.readabilityScore,
        consensusScore: data.consensusScore,
        accessibilityScore: data.accessibilityScore,
        performanceScore: data.performanceScore,
        suggestions: data.suggestions,
        aiAnalysis: data.aiAnalysis,
      }, null, 2),
    },
  };

  if (existingGistId) {
    // Update existing gist
    const gist = await octokit.gists.update({
      gist_id: existingGistId,
      files,
    });
    return { id: gist.data.id!, html_url: gist.data.html_url! };
  } else {
    // Create new gist
    const gist = await octokit.gists.create({
      description: `Mobile conversion for ${url}`,
      public: false,
      files,
    });
    return { id: gist.data.id!, html_url: gist.data.html_url! };
  }
}

/**
 * Parse issue data from body
 */
function parseIssueData(issue: any): AnalysisJobData {
  const body = issue.body || "";
  
  const data: AnalysisJobData = {
    url: "",
    status: "analyzing",
  };

  // Extract URL
  const urlMatch = body.match(/\*\*URL:\*\*\s*(.+)/);
  if (urlMatch) data.url = urlMatch[1].trim();

  // Extract status
  const statusMatch = body.match(/\*\*Status:\*\*\s*(\w+)/);
  if (statusMatch) data.status = statusMatch[1].toLowerCase() as any;

  // Extract scores
  const responsiveMatch = body.match(/\*\*Responsive Score:\*\*\s*(\d+)/);
  if (responsiveMatch) data.responsiveScore = parseInt(responsiveMatch[1]);

  const readabilityMatch = body.match(/\*\*Readability Score:\*\*\s*(\d+)/);
  if (readabilityMatch) data.readabilityScore = parseInt(readabilityMatch[1]);

  const consensusMatch = body.match(/\*\*Consensus Score:\*\*\s*(\d+)/);
  if (consensusMatch) data.consensusScore = parseInt(consensusMatch[1]);

  const accessibilityMatch = body.match(/\*\*Accessibility Score:\*\*\s*(\d+)/);
  if (accessibilityMatch) data.accessibilityScore = parseInt(accessibilityMatch[1]);

  const performanceMatch = body.match(/\*\*Performance Score:\*\*\s*(\d+)/);
  if (performanceMatch) data.performanceScore = parseInt(performanceMatch[1]);

  // Extract Gist URL
  const gistMatch = body.match(/\*\*Gist:\*\*\s*\[([^\]]+)\]\(([^)]+)\)/);
  if (gistMatch) {
    const gistUrl = gistMatch[2];
    // Extract gist ID from URL (handles gist.github.com/username/gistid and raw gist URLs)
    const gistIdMatch = gistUrl.match(/gist\.github\.com\/[^\/]+\/([a-f0-9]+)/i) ||
                        gistUrl.match(/gist\.github\.com\/([a-f0-9]+)/i);
    if (gistIdMatch) {
      data.gistId = gistIdMatch[1];
      data.gistUrl = gistUrl;
    }
  }

  // Extract page info
  const titleMatch = body.match(/\*\*Page Title:\*\*\s*(.+)/);
  if (titleMatch) data.pageTitle = titleMatch[1].trim();

  const descMatch = body.match(/\*\*Page Description:\*\*\s*(.+)/);
  if (descMatch) data.pageDescription = descMatch[1].trim();

  return data;
}

/**
 * Generate issue body
 */
function generateIssueBody(data: AnalysisJobData): string {
  let body = `# Website Analysis Job

**URL:** ${data.url}
**Status:** ${data.status}
**Created:** ${new Date().toISOString()}

---
`;

  if (data.pageTitle) {
    body += `\n**Page Title:** ${data.pageTitle}`;
  }

  if (data.pageDescription) {
    body += `\n**Page Description:** ${data.pageDescription}`;
  }

  if (data.status === "completed") {
    body += `\n\n## Analysis Results\n`;
    
    if (data.consensusScore !== undefined) {
      body += `\n**Consensus Score:** ${data.consensusScore}/100`;
    }
    
    if (data.responsiveScore !== undefined) {
      body += `\n**Responsive Score:** ${data.responsiveScore}/100`;
    }
    
    if (data.readabilityScore !== undefined) {
      body += `\n**Readability Score:** ${data.readabilityScore}/100`;
    }
    
    if (data.accessibilityScore !== undefined) {
      body += `\n**Accessibility Score:** ${data.accessibilityScore}/100`;
    }
    
    if (data.performanceScore !== undefined) {
      body += `\n**Performance Score:** ${data.performanceScore}/100`;
    }

    if (data.gistUrl) {
      body += `\n\n**Gist:** [View Mobile Design](${data.gistUrl})`;
    }
  }

  if (data.status === "failed" && data.errorMessage) {
    body += `\n\n## Error\n\n${data.errorMessage}`;
  }

  body += `\n\n---

**Powered by ResponsiAI using GitHub Models**`;

  return body;
}

/**
 * Generate update comment
 */
function generateUpdateComment(updates: Partial<AnalysisJobData>): string {
  let comment = `## Update: ${new Date().toLocaleString()}\n\n`;

  if (updates.status) {
    comment += `**Status changed to:** ${updates.status}\n\n`;
  }

  if (updates.consensusScore !== undefined) {
    comment += `**Consensus Score:** ${updates.consensusScore}/100\n`;
  }

  if (updates.responsiveScore !== undefined) {
    comment += `**Responsive Score:** ${updates.responsiveScore}/100\n`;
  }

  if (updates.readabilityScore !== undefined) {
    comment += `**Readability Score:** ${updates.readabilityScore}/100\n`;
  }

  if (updates.errorMessage) {
    comment += `\n**Error:** ${updates.errorMessage}\n`;
  }

  return comment;
}

/**
 * Get all analysis jobs
 */
export async function getAllAnalysisJobs(): Promise<GitHubAnalysisJob[]> {
  try {
    const issues = await octokit.issues.listForRepo({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      labels: "responsify:job",
      state: "all",
      per_page: 100,
    });

    return issues.data.map(issue => {
      const data = parseIssueData(issue);
      return {
        id: `github-issue-${issue.number}`,
        issueNumber: issue.number,
        ...data,
        createdAt: new Date(issue.created_at),
        completedAt: data.status === "completed" ? new Date(issue.updated_at) : undefined,
      };
    });
  } catch (error) {
    console.error("Failed to get all jobs:", error);
    return [];
  }
}

/**
 * Get Gist content (mobile HTML)
 */
export async function getGistContent(gistId: string): Promise<string | null> {
  try {
    const gist = await octokit.gists.get({
      gist_id: gistId,
    });

    const mobileFile = gist.data.files?.["mobile.html"];
    return mobileFile?.content || null;
  } catch (error) {
    console.error(`Failed to get gist ${gistId}:`, error);
    return null;
  }
}
