/**
 * Multi-Agent Orchestrator Service
 * Coordinates OpenAI, Anthropic, and Gemini for consensus-based website analysis
 * 
 * Agent Roles:
 * - Analyzer (OpenAI GPT-4o): Extracts and understands website structure
 * - Designer (Anthropic Claude): Generates mobile layouts with UX focus
 * - Critic (Google Gemini): Reviews and scores design quality
 * - Accessibility Agent (Gemini): Audits WCAG compliance
 * - Performance Agent (OpenAI): Analyzes optimization opportunities
 */

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import type { ExtractedContent } from "./websiteFetcher";
import type { AIAnalysisResult, AISuggestion, MobileLayoutSection } from "./aiConverter";

// Initialize AI clients
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY!,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const gemini = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export interface AgentEvaluation {
  agent: "openai" | "anthropic" | "gemini";
  responsiveScore: number;
  readabilityScore: number;
  overallScore: number;
  feedback: string;
  suggestions: AISuggestion[];
}

export interface AccessibilityAudit {
  wcagScore: number;
  issues: {
    type: "alt-text" | "color-contrast" | "touch-targets" | "focus-indicators" | "semantic-structure" | "other";
    severity: "critical" | "serious" | "moderate" | "minor";
    description: string;
    recommendation: string;
  }[];
}

export interface PerformanceInsights {
  suggestions: {
    category: "images" | "fonts" | "css" | "scripts" | "general";
    impact: "high" | "medium" | "low";
    title: string;
    description: string;
  }[];
}

export interface AgentProgressEvent {
  agent: string;
  status: "running" | "completed" | "failed";
  message: string;
}

export interface ConsensusResult {
  consensusScore: number;
  responsiveScore: number;
  readabilityScore: number;
  accessibilityScore: number;
  performanceScore: number;
  evaluations: AgentEvaluation[];
  mobileLayout: MobileLayoutSection[];
  suggestions: AISuggestion[];
  colorPalette: string[];
  typography: {
    headingFont: string;
    bodyFont: string;
    sizes: { heading: string; body: string; small: string };
  };
  accessibilityAudit: AccessibilityAudit;
  performanceInsights: PerformanceInsights;
}

/**
 * Agent 1: Analyzer (OpenAI)
 * Analyzes website structure and extracts key information
 */
async function runAnalyzerAgent(
  url: string,
  content: ExtractedContent
): Promise<{ structure: string; keyElements: string[] }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a website structure analyzer. Extract key elements and patterns from websites. Respond in JSON only."
        },
        {
          role: "user",
          content: `Analyze this website structure:
URL: ${url}
Title: ${content.title}
Description: ${content.description}
Navigation: ${content.navigation.slice(0, 8).join(", ")}
Headings: ${content.headings.slice(0, 6).join(" | ")}
Buttons: ${content.buttons.slice(0, 6).join(", ")}
Main Content Samples: ${content.mainContent.slice(0, 3).map(p => p.slice(0, 200)).join(" ... ")}

Respond with JSON: {"structure": "brief description of layout pattern", "keyElements": ["list", "of", "key", "elements"]}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const text = response.choices[0]?.message?.content || "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Analyzer agent error:", error);
    return {
      structure: "standard website layout",
      keyElements: content.headings.slice(0, 5)
    };
  }
}

/**
 * Agent 2: Designer (Anthropic Claude)
 * Creates mobile-optimized layouts with UX focus
 */
async function runDesignerAgent(
  url: string,
  content: ExtractedContent,
  structure: string
): Promise<{ layout: MobileLayoutSection[]; colors: string[]; fonts: { heading: string; body: string } }> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `You are an expert mobile UI designer. Create a mobile-optimized layout for this website.

Website: ${url}
Title: ${content.title}
Description: ${content.description}
Structure: ${structure}
Navigation: ${content.navigation.slice(0, 6).join(", ")}
Headings: ${content.headings.slice(0, 5).join(" | ")}
CTAs: ${content.buttons.slice(0, 4).join(", ")}
Colors detected: ${content.styles.colors.slice(0, 5).join(", ") || "#6366f1, #f8fafc"}
Fonts detected: ${content.styles.fonts.slice(0, 2).join(", ") || "Inter"}

Create a JSON response with this exact structure (use REAL content from the website):
{
  "layout": [
    {
      "id": "header",
      "type": "navigation",
      "title": "Header",
      "content": "<HTML for mobile header with hamburger menu>",
      "styles": {"backgroundColor": "#fff", "padding": "16px"}
    },
    {
      "id": "hero",
      "type": "hero",
      "title": "Hero",
      "content": "<HTML for hero section with real heading and CTA>",
      "styles": {"backgroundColor": "#f8fafc", "padding": "48px 24px"}
    }
  ],
  "colors": ["#primary", "#secondary", "#accent", "#bg", "#text"],
  "fonts": {"heading": "Inter, sans-serif", "body": "Inter, sans-serif"}
}

Create 4-6 sections. Use inline styles in the content HTML for proper mobile rendering. RESPOND WITH JSON ONLY.`
        }
      ],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text : "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Designer agent error:", error);
    return createFallbackDesign(content, url);
  }
}

/**
 * Agent 3: Critic (Google Gemini)
 * Reviews and scores the generated design
 */
async function runCriticAgent(
  url: string,
  layout: MobileLayoutSection[],
  originalContent: ExtractedContent
): Promise<AgentEvaluation> {
  try {
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a mobile UX critic. Evaluate this mobile design conversion.

Original Website: ${url}
Original Title: ${originalContent.title}
Original Description: ${originalContent.description}

Generated Mobile Layout Sections:
${layout.map(s => `- ${s.type}: ${s.title}`).join("\n")}

Evaluate the design on:
1. Responsive Score (0-100): How well is it optimized for mobile?
2. Readability Score (0-100): Is text readable? Touch targets adequate?
3. Overall Score (0-100): General quality assessment

Respond with JSON only:
{
  "responsiveScore": 85,
  "readabilityScore": 80,
  "overallScore": 82,
  "feedback": "Brief feedback on the design quality",
  "suggestions": [
    {"type": "layout", "priority": "high", "title": "Suggestion title", "description": "Detailed suggestion"}
  ]
}`,
    });

    const text = response.text || "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const result = JSON.parse(cleaned);
    
    return {
      agent: "gemini",
      responsiveScore: result.responsiveScore || 75,
      readabilityScore: result.readabilityScore || 75,
      overallScore: result.overallScore || 75,
      feedback: result.feedback || "Design meets basic mobile requirements",
      suggestions: result.suggestions || [],
    };
  } catch (error) {
    console.error("Critic agent error:", error);
    return {
      agent: "gemini",
      responsiveScore: 75,
      readabilityScore: 75,
      overallScore: 75,
      feedback: "Unable to complete detailed review",
      suggestions: [],
    };
  }
}

/**
 * Accessibility Agent (Gemini)
 * Audits WCAG compliance for the mobile design
 */
async function runAccessibilityAgent(
  layout: MobileLayoutSection[],
  originalContent: ExtractedContent
): Promise<{ accessibilityScore: number; audit: AccessibilityAudit }> {
  try {
    const layoutHtml = layout.map(s => s.content).join("\n");
    
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a WCAG accessibility expert. Audit this mobile design for accessibility compliance.

Layout HTML:
${layoutHtml.slice(0, 3000)}

Images detected: ${originalContent.images.slice(0, 10).map(img => `${img.alt ? 'Has alt' : 'Missing alt'}: ${img.src.slice(0, 50)}`).join(", ")}

Check for:
1. Alt text - Do images have descriptive alt text?
2. Color contrast - Are text colors contrasted enough against backgrounds?
3. Touch targets - Are buttons and links at least 44x44px?
4. Focus indicators - Are interactive elements focusable?
5. Semantic structure - Is there proper heading hierarchy?

Respond with JSON only:
{
  "wcagScore": 75,
  "issues": [
    {
      "type": "alt-text",
      "severity": "serious",
      "description": "Description of the issue",
      "recommendation": "How to fix it"
    }
  ]
}

Types: alt-text, color-contrast, touch-targets, focus-indicators, semantic-structure, other
Severity: critical, serious, moderate, minor`,
    });

    const text = response.text || "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const result = JSON.parse(cleaned);

    const wcagScore = result.wcagScore || 70;
    const issues = (result.issues || []).map((issue: any) => ({
      type: issue.type || "other",
      severity: issue.severity || "moderate",
      description: issue.description || "Accessibility issue detected",
      recommendation: issue.recommendation || "Review and fix the issue",
    }));

    return {
      accessibilityScore: wcagScore,
      audit: { wcagScore, issues },
    };
  } catch (error) {
    console.error("Accessibility agent error:", error);
    return {
      accessibilityScore: 70,
      audit: {
        wcagScore: 70,
        issues: [
          {
            type: "other",
            severity: "moderate",
            description: "Could not complete full accessibility audit",
            recommendation: "Manually review accessibility guidelines",
          },
        ],
      },
    };
  }
}

/**
 * Performance Agent (OpenAI)
 * Analyzes optimization opportunities for the design
 */
async function runPerformanceAgent(
  layout: MobileLayoutSection[],
  originalContent: ExtractedContent
): Promise<{ performanceScore: number; insights: PerformanceInsights }> {
  try {
    const layoutHtml = layout.map(s => s.content).join("\n");
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a web performance optimization expert. Analyze designs for performance issues. Respond in JSON only."
        },
        {
          role: "user",
          content: `Analyze this mobile design for performance optimization opportunities.

Layout HTML:
${layoutHtml.slice(0, 3000)}

Images: ${originalContent.images.length} detected
Fonts: ${originalContent.styles.fonts.slice(0, 5).join(", ")}
Colors/Styles: ${originalContent.styles.colors.length} color values

Analyze:
1. Image optimization - Are there opportunities for lazy loading, WebP format, responsive images?
2. Font loading optimization - Can fonts be subset, preloaded, or replaced with system fonts?
3. CSS efficiency - Is there redundant styling? Can styles be consolidated?
4. General performance - Are there render-blocking concerns?

Respond with JSON:
{
  "performanceScore": 80,
  "optimizations": [
    {
      "category": "images",
      "impact": "high",
      "title": "Optimization title",
      "description": "Detailed description"
    }
  ]
}

Categories: images, fonts, css, scripts, general
Impact: high, medium, low`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const text = response.choices[0]?.message?.content || "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const result = JSON.parse(cleaned);

    const performanceScore = result.performanceScore || 75;
    const suggestions = (result.optimizations || []).map((opt: any) => ({
      category: opt.category || "general",
      impact: opt.impact || "medium",
      title: opt.title || "Performance suggestion",
      description: opt.description || "Optimize for better performance",
    }));

    return {
      performanceScore,
      insights: { suggestions },
    };
  } catch (error) {
    console.error("Performance agent error:", error);
    return {
      performanceScore: 75,
      insights: {
        suggestions: [
          {
            category: "general",
            impact: "medium",
            title: "Performance Review Needed",
            description: "Could not complete automated performance analysis. Manual review recommended.",
          },
        ],
      },
    };
  }
}

/**
 * Run additional evaluation from OpenAI for consensus
 */
async function runOpenAIEvaluator(
  layout: MobileLayoutSection[],
  originalContent: ExtractedContent
): Promise<AgentEvaluation> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a mobile design evaluator. Score designs and provide feedback. Respond in JSON only."
        },
        {
          role: "user",
          content: `Evaluate this mobile design:

Sections: ${layout.map(s => s.type).join(", ")}
Original content preserved: ${originalContent.headings.slice(0, 3).join(", ")}

Rate the design:
{"responsiveScore": 0-100, "readabilityScore": 0-100, "overallScore": 0-100, "feedback": "brief feedback", "suggestions": [{"type": "style", "priority": "medium", "title": "title", "description": "description"}]}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const text = response.choices[0]?.message?.content || "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const result = JSON.parse(cleaned);

    return {
      agent: "openai",
      responsiveScore: result.responsiveScore || 80,
      readabilityScore: result.readabilityScore || 80,
      overallScore: result.overallScore || 80,
      feedback: result.feedback || "Design is acceptable",
      suggestions: result.suggestions || [],
    };
  } catch (error) {
    console.error("OpenAI evaluator error:", error);
    return {
      agent: "openai",
      responsiveScore: 78,
      readabilityScore: 78,
      overallScore: 78,
      feedback: "Evaluation completed with defaults",
      suggestions: [],
    };
  }
}

/**
 * Run additional evaluation from Anthropic for consensus
 */
async function runAnthropicEvaluator(
  layout: MobileLayoutSection[],
  originalContent: ExtractedContent
): Promise<AgentEvaluation> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `You are a mobile UX evaluator. Rate this design (JSON only):

Sections: ${layout.map(s => `${s.type}: ${s.title}`).join(", ")}
Content: ${originalContent.title}

Respond: {"responsiveScore": 0-100, "readabilityScore": 0-100, "overallScore": 0-100, "feedback": "feedback", "suggestions": []}`
        }
      ],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text : "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const result = JSON.parse(cleaned);

    return {
      agent: "anthropic",
      responsiveScore: result.responsiveScore || 80,
      readabilityScore: result.readabilityScore || 80,
      overallScore: result.overallScore || 80,
      feedback: result.feedback || "Design meets requirements",
      suggestions: result.suggestions || [],
    };
  } catch (error) {
    console.error("Anthropic evaluator error:", error);
    return {
      agent: "anthropic",
      responsiveScore: 80,
      readabilityScore: 80,
      overallScore: 80,
      feedback: "Evaluation completed",
      suggestions: [],
    };
  }
}

/**
 * Calculate consensus from multiple agent evaluations
 */
function calculateConsensus(evaluations: AgentEvaluation[]): {
  consensusScore: number;
  responsiveScore: number;
  readabilityScore: number;
} {
  const validEvals = evaluations.filter(e => e.overallScore > 0);
  if (validEvals.length === 0) {
    return { consensusScore: 75, responsiveScore: 75, readabilityScore: 75 };
  }

  const responsiveScore = Math.round(
    validEvals.reduce((sum, e) => sum + e.responsiveScore, 0) / validEvals.length
  );
  const readabilityScore = Math.round(
    validEvals.reduce((sum, e) => sum + e.readabilityScore, 0) / validEvals.length
  );
  const overallAvg = Math.round(
    validEvals.reduce((sum, e) => sum + e.overallScore, 0) / validEvals.length
  );

  // Calculate standard deviation to measure agreement
  const scores = validEvals.map(e => e.overallScore);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // High agreement (low std dev) boosts consensus score
  const agreementBonus = Math.max(0, 10 - stdDev);
  const consensusScore = Math.min(100, Math.round(overallAvg + agreementBonus));

  return { consensusScore, responsiveScore, readabilityScore };
}

/**
 * Merge suggestions from all agents, removing duplicates
 */
function mergeSuggestions(evaluations: AgentEvaluation[]): AISuggestion[] {
  const allSuggestions = evaluations.flatMap(e => e.suggestions);
  const seen = new Set<string>();
  const unique: AISuggestion[] = [];

  for (const suggestion of allSuggestions) {
    const key = `${suggestion.type}-${suggestion.title}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(suggestion);
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return unique.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 6);
}

/**
 * Create fallback design when designer agent fails
 */
function createFallbackDesign(content: ExtractedContent, url: string): {
  layout: MobileLayoutSection[];
  colors: string[];
  fonts: { heading: string; body: string };
} {
  const siteName = content.title || new URL(url).hostname;
  const primaryColor = content.styles.colors[0] || "#6366f1";

  return {
    layout: [
      {
        id: "header",
        type: "navigation",
        title: "Header",
        content: `<div style="display:flex;align-items:center;justify-content:space-between;"><h1 style="font-size:20px;font-weight:700;margin:0;">${siteName}</h1><button style="background:none;border:none;padding:12px;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg></button></div>`,
        styles: { backgroundColor: "#ffffff", padding: "16px", borderBottom: "1px solid #e2e8f0" },
      },
      {
        id: "hero",
        type: "hero",
        title: "Hero",
        content: `<div style="text-align:center;"><h2 style="font-size:28px;font-weight:800;margin-bottom:16px;">${content.headings[0] || "Welcome"}</h2><p style="font-size:16px;color:#64748b;margin-bottom:24px;">${content.description || ""}</p><button style="background:${primaryColor};color:white;border:none;padding:16px 32px;border-radius:12px;font-size:16px;font-weight:600;">${content.buttons[0] || "Get Started"}</button></div>`,
        styles: { backgroundColor: "#f8fafc", padding: "48px 24px" },
      },
      {
        id: "content",
        type: "content",
        title: "Content",
        content: `<div>${content.mainContent.slice(0, 2).map(p => `<p style="margin-bottom:16px;line-height:1.6;">${p.slice(0, 200)}</p>`).join("")}</div>`,
        styles: { backgroundColor: "#ffffff", padding: "32px 24px" },
      },
      {
        id: "footer",
        type: "footer",
        title: "Footer",
        content: `<div style="text-align:center;"><p style="color:#64748b;font-size:14px;">© ${new Date().getFullYear()} ${siteName}</p></div>`,
        styles: { backgroundColor: "#f8fafc", padding: "24px" },
      },
    ],
    colors: [primaryColor, "#10b981", "#f59e0b", "#f8fafc", "#1e293b"],
    fonts: { heading: "Inter, sans-serif", body: "Inter, sans-serif" },
  };
}

/**
 * Run a single iteration of multi-agent analysis
 */
async function runAnalysisIteration(
  url: string,
  extractedContent: ExtractedContent,
  iteration: number,
  previousFeedback?: string
): Promise<ConsensusResult> {
  console.log(`[Multi-Agent] Starting iteration ${iteration} for:`, url);

  // Step 1: Run Analyzer Agent (OpenAI)
  console.log("[Multi-Agent] Running Analyzer Agent (OpenAI)...");
  const analysis = await runAnalyzerAgent(url, extractedContent);

  // Step 2: Run Designer Agent (Anthropic Claude)
  // If refinement iteration, include previous feedback
  const structureWithFeedback = previousFeedback 
    ? `${analysis.structure}\n\nPrevious feedback to incorporate: ${previousFeedback}`
    : analysis.structure;
  
  console.log("[Multi-Agent] Running Designer Agent (Anthropic)...");
  const design = await runDesignerAgent(url, extractedContent, structureWithFeedback);

  // Step 3: Run all agents in parallel - critics, accessibility, and performance
  console.log("[Multi-Agent] Running Critic, Accessibility, and Performance Agents...");
  const [geminiEval, openaiEval, anthropicEval, accessibilityResult, performanceResult] = await Promise.all([
    runCriticAgent(url, design.layout, extractedContent),
    runOpenAIEvaluator(design.layout, extractedContent),
    runAnthropicEvaluator(design.layout, extractedContent),
    runAccessibilityAgent(design.layout, extractedContent),
    runPerformanceAgent(design.layout, extractedContent),
  ]);

  const evaluations = [geminiEval, openaiEval, anthropicEval];

  // Step 4: Calculate consensus scores
  const consensus = calculateConsensus(evaluations);
  const mergedSuggestions = mergeSuggestions(evaluations);

  console.log(`[Multi-Agent] Iteration ${iteration} consensus score: ${consensus.consensusScore}%`);

  return {
    consensusScore: consensus.consensusScore,
    responsiveScore: consensus.responsiveScore,
    readabilityScore: consensus.readabilityScore,
    accessibilityScore: accessibilityResult.accessibilityScore,
    performanceScore: performanceResult.performanceScore,
    evaluations,
    mobileLayout: design.layout,
    suggestions: mergedSuggestions,
    colorPalette: design.colors,
    typography: {
      headingFont: design.fonts.heading,
      bodyFont: design.fonts.body,
      sizes: { heading: "28px", body: "16px", small: "14px" },
    },
    accessibilityAudit: accessibilityResult.audit,
    performanceInsights: performanceResult.insights,
  };
}

/**
 * Main orchestration function - runs all agents and builds consensus with iteration support
 */
export async function runMultiAgentAnalysis(
  url: string,
  extractedContent: ExtractedContent
): Promise<ConsensusResult> {
  const MAX_ITERATIONS = 2;
  const CONSENSUS_THRESHOLD = 80;
  
  console.log("[Multi-Agent] Starting consensus analysis for:", url);

  // First iteration
  let bestResult = await runAnalysisIteration(url, extractedContent, 1);
  
  // Check if refinement is needed (consensus score < 80)
  if (bestResult.consensusScore < CONSENSUS_THRESHOLD && MAX_ITERATIONS > 1) {
    console.log(`[Multi-Agent] Consensus score ${bestResult.consensusScore}% < ${CONSENSUS_THRESHOLD}%, running refinement iteration...`);
    
    // Gather feedback from evaluations for refinement
    const feedbackSummary = bestResult.evaluations
      .map(e => `${e.agent}: ${e.feedback}`)
      .join(" | ");
    
    // Run second iteration with feedback
    const refinedResult = await runAnalysisIteration(url, extractedContent, 2, feedbackSummary);
    
    // Keep the better result
    if (refinedResult.consensusScore > bestResult.consensusScore) {
      console.log(`[Multi-Agent] Refinement improved score from ${bestResult.consensusScore}% to ${refinedResult.consensusScore}%`);
      bestResult = refinedResult;
    } else {
      console.log(`[Multi-Agent] Keeping original result (${bestResult.consensusScore}% >= ${refinedResult.consensusScore}%)`);
    }
  }

  console.log(`[Multi-Agent] Final consensus score: ${bestResult.consensusScore}%`);
  return bestResult;
}

/**
 * Generate mobile HTML from consensus result
 */
export function generateConsensusHtml(result: ConsensusResult, title: string): string {
  const sections = result.mobileLayout.map(section => {
    const styleStr = Object.entries(section.styles)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`)
      .join("; ");
    
    return `<section id="${section.id}" class="mobile-section" style="${styleStr}">
      ${section.content}
    </section>`;
  }).join("\n  ");

  const primaryColor = result.colorPalette[0] || "#6366f1";
  const bgColor = result.colorPalette[3] || "#ffffff";
  const textColor = result.colorPalette[4] || "#1e293b";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${title} - Mobile</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { -webkit-text-size-adjust: 100%; -webkit-tap-highlight-color: transparent; }
    body {
      font-family: ${result.typography.bodyFont};
      font-size: ${result.typography.sizes.body};
      line-height: 1.6;
      color: ${textColor};
      background-color: ${bgColor};
      -webkit-font-smoothing: antialiased;
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: ${result.typography.headingFont};
      line-height: 1.2;
      font-weight: 700;
    }
    img { max-width: 100%; height: auto; display: block; }
    button {
      font-family: inherit;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    button:active { transform: scale(0.98); }
    a { color: ${primaryColor}; text-decoration: none; }
    .mobile-section { width: 100%; }
    /* Consensus Badge */
    .consensus-badge {
      position: fixed;
      top: 8px;
      right: 8px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .consensus-badge .score {
      background: ${result.consensusScore >= 80 ? "#10b981" : result.consensusScore >= 60 ? "#f59e0b" : "#ef4444"};
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="consensus-badge">
    <span>AI Consensus</span>
    <span class="score">${result.consensusScore}%</span>
  </div>
  ${sections}
</body>
</html>`;
}
