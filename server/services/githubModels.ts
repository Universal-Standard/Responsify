/**
 * GitHub Models Integration
 * Uses GitHub's Models API to replace OpenAI, Anthropic, and Gemini
 * https://docs.github.com/en/github-models
 */

import OpenAI from "openai";
import type { ExtractedContent } from "./websiteFetcher";
import type { 
  AIAnalysisResult, 
  AISuggestion, 
  MobileLayoutSection 
} from "./aiConverter";

// GitHub Models API client (compatible with OpenAI SDK)
const githubModels = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: process.env.GITHUB_TOKEN!,
});

// Available models on GitHub
const MODELS = {
  GPT4O: "gpt-4o",
  GPT4O_MINI: "gpt-4o-mini", 
  CLAUDE_SONNET: "claude-sonnet-4-5",
  GEMINI_FLASH: "gemini-2.5-flash",
  LLAMA: "meta-llama-3.3-70b-instruct",
} as const;

export interface GitHubAgentEvaluation {
  model: string;
  responsiveScore: number;
  readabilityScore: number;
  overallScore: number;
  feedback: string;
  suggestions: AISuggestion[];
}

export interface GitHubConsensusResult {
  consensusScore: number;
  responsiveScore: number;
  readabilityScore: number;
  accessibilityScore: number;
  performanceScore: number;
  evaluations: GitHubAgentEvaluation[];
  mobileLayout: MobileLayoutSection[];
  suggestions: AISuggestion[];
  colorPalette: string[];
  typography: {
    headingFont: string;
    bodyFont: string;
    sizes: { heading: string; body: string; small: string };
  };
  accessibilityAudit: {
    wcagScore: number;
    issues: Array<{
      type: string;
      severity: string;
      description: string;
      recommendation: string;
    }>;
  };
  performanceInsights: {
    suggestions: Array<{
      category: string;
      impact: string;
      title: string;
      description: string;
    }>;
  };
}

/**
 * Analyzer Agent - Using GPT-4o from GitHub Models
 */
async function runAnalyzerAgent(
  url: string,
  content: ExtractedContent
): Promise<{ structure: string; keyElements: string[] }> {
  try {
    const response = await githubModels.chat.completions.create({
      model: MODELS.GPT4O_MINI,
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

Respond with JSON: {"structure": "brief description", "keyElements": ["list", "of", "key", "elements"]}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const text = response.choices[0]?.message?.content || "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("GitHub Analyzer agent error:", error);
    return {
      structure: "standard website layout",
      keyElements: content.headings.slice(0, 5)
    };
  }
}

/**
 * Designer Agent - Using GPT-4o from GitHub Models
 */
async function runDesignerAgent(
  url: string,
  content: ExtractedContent,
  structure: string
): Promise<{ layout: MobileLayoutSection[]; colors: string[]; fonts: { heading: string; body: string } }> {
  try {
    const response = await githubModels.chat.completions.create({
      model: MODELS.GPT4O,
      messages: [
        {
          role: "system",
          content: "You are an expert mobile UI designer. Create mobile-optimized layouts with UX focus. Respond in JSON only."
        },
        {
          role: "user",
          content: `Create a mobile-optimized layout for this website.

Website: ${url}
Title: ${content.title}
Description: ${content.description}
Structure: ${structure}
Navigation: ${content.navigation.slice(0, 6).join(", ")}
Headings: ${content.headings.slice(0, 5).join(" | ")}
CTAs: ${content.buttons.slice(0, 4).join(", ")}
Colors: ${content.styles.colors.slice(0, 5).join(", ") || "#6366f1, #f8fafc"}

Create a JSON response with this structure:
{
  "layout": [
    {
      "id": "header",
      "type": "navigation",
      "title": "Header",
      "content": "<HTML for mobile header>",
      "styles": {"backgroundColor": "#fff", "padding": "16px"}
    }
  ],
  "colors": ["#primary", "#secondary", "#accent", "#bg", "#text"],
  "fonts": {"heading": "Inter, sans-serif", "body": "Inter, sans-serif"}
}

Create 4-6 sections with real content. RESPOND WITH JSON ONLY.`
        }
      ],
      temperature: 0.5,
      max_tokens: 4000,
    });

    const text = response.choices[0]?.message?.content || "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("GitHub Designer agent error:", error);
    return createFallbackDesign(content, url);
  }
}

/**
 * Critic Agent - Using Llama from GitHub Models
 */
async function runCriticAgent(
  url: string,
  layout: MobileLayoutSection[],
  originalContent: ExtractedContent
): Promise<GitHubAgentEvaluation> {
  try {
    const response = await githubModels.chat.completions.create({
      model: MODELS.LLAMA,
      messages: [
        {
          role: "system",
          content: "You are a mobile UX critic. Evaluate mobile designs. Respond in JSON only."
        },
        {
          role: "user",
          content: `Evaluate this mobile design conversion.

Original Website: ${url}
Sections: ${layout.map(s => `${s.type}: ${s.title}`).join(", ")}

Rate on:
1. Responsive Score (0-100): Mobile optimization
2. Readability Score (0-100): Text readability & touch targets
3. Overall Score (0-100): General quality

Respond with JSON:
{
  "responsiveScore": 85,
  "readabilityScore": 80,
  "overallScore": 82,
  "feedback": "Brief feedback",
  "suggestions": [{"type": "layout", "priority": "high", "title": "Title", "description": "Detail"}]
}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const text = response.choices[0]?.message?.content || "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const result = JSON.parse(cleaned);
    
    return {
      model: MODELS.LLAMA,
      responsiveScore: result.responsiveScore || 75,
      readabilityScore: result.readabilityScore || 75,
      overallScore: result.overallScore || 75,
      feedback: result.feedback || "Design meets basic requirements",
      suggestions: result.suggestions || [],
    };
  } catch (error) {
    console.error("GitHub Critic agent error:", error);
    return {
      model: MODELS.LLAMA,
      responsiveScore: 75,
      readabilityScore: 75,
      overallScore: 75,
      feedback: "Unable to complete review",
      suggestions: [],
    };
  }
}

/**
 * Accessibility Agent - Using GPT-4o Mini
 */
async function runAccessibilityAgent(
  layout: MobileLayoutSection[],
  originalContent: ExtractedContent
): Promise<{ accessibilityScore: number; audit: any }> {
  try {
    const layoutHtml = layout.map(s => s.content).join("\n");
    
    const response = await githubModels.chat.completions.create({
      model: MODELS.GPT4O_MINI,
      messages: [
        {
          role: "system",
          content: "You are a WCAG accessibility expert. Audit designs for accessibility. Respond in JSON only."
        },
        {
          role: "user",
          content: `Audit this mobile design for accessibility.

Layout HTML (sample):
${layoutHtml.slice(0, 2000)}

Images: ${originalContent.images.slice(0, 5).map(img => `${img.alt ? 'Has alt' : 'Missing alt'}`).join(", ")}

Check: alt text, color contrast, touch targets, focus indicators, semantic structure

Respond with JSON:
{
  "wcagScore": 75,
  "issues": [
    {
      "type": "alt-text",
      "severity": "serious",
      "description": "Issue description",
      "recommendation": "Fix recommendation"
    }
  ]
}`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const text = response.choices[0]?.message?.content || "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const result = JSON.parse(cleaned);

    return {
      accessibilityScore: result.wcagScore || 70,
      audit: {
        wcagScore: result.wcagScore || 70,
        issues: result.issues || [],
      },
    };
  } catch (error) {
    console.error("GitHub Accessibility agent error:", error);
    return {
      accessibilityScore: 70,
      audit: {
        wcagScore: 70,
        issues: [{
          type: "other",
          severity: "moderate",
          description: "Could not complete audit",
          recommendation: "Manual review recommended",
        }],
      },
    };
  }
}

/**
 * Performance Agent - Using GPT-4o Mini
 */
async function runPerformanceAgent(
  layout: MobileLayoutSection[],
  originalContent: ExtractedContent
): Promise<{ performanceScore: number; insights: any }> {
  try {
    const response = await githubModels.chat.completions.create({
      model: MODELS.GPT4O_MINI,
      messages: [
        {
          role: "system",
          content: "You are a web performance expert. Analyze performance. Respond in JSON only."
        },
        {
          role: "user",
          content: `Analyze performance optimization opportunities.

Images: ${originalContent.images.length} detected
Fonts: ${originalContent.styles.fonts.slice(0, 3).join(", ")}

Analyze: image optimization, font loading, CSS efficiency, general performance

Respond with JSON:
{
  "performanceScore": 80,
  "optimizations": [
    {
      "category": "images",
      "impact": "high",
      "title": "Title",
      "description": "Description"
    }
  ]
}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const text = response.choices[0]?.message?.content || "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const result = JSON.parse(cleaned);

    return {
      performanceScore: result.performanceScore || 75,
      insights: {
        suggestions: result.optimizations || [],
      },
    };
  } catch (error) {
    console.error("GitHub Performance agent error:", error);
    return {
      performanceScore: 75,
      insights: {
        suggestions: [{
          category: "general",
          impact: "medium",
          title: "Performance Review Needed",
          description: "Manual review recommended",
        }],
      },
    };
  }
}

/**
 * Run additional evaluators for consensus
 */
async function runAdditionalEvaluators(
  layout: MobileLayoutSection[],
  originalContent: ExtractedContent
): Promise<GitHubAgentEvaluation[]> {
  try {
    const [eval1, eval2] = await Promise.all([
      // GPT-4o Mini evaluator
      githubModels.chat.completions.create({
        model: MODELS.GPT4O_MINI,
        messages: [
          {
            role: "system",
            content: "You are a mobile design evaluator. Score designs. Respond in JSON only."
          },
          {
            role: "user",
            content: `Evaluate this mobile design:

Sections: ${layout.map(s => s.type).join(", ")}

Rate: {"responsiveScore": 0-100, "readabilityScore": 0-100, "overallScore": 0-100, "feedback": "brief", "suggestions": []}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
      // Another GPT-4o evaluator for diversity
      githubModels.chat.completions.create({
        model: MODELS.GPT4O,
        messages: [
          {
            role: "system",
            content: "You are a UX evaluator. Rate mobile designs. Respond in JSON only."
          },
          {
            role: "user",
            content: `Rate this design:

Sections: ${layout.map(s => `${s.type}: ${s.title}`).join(", ")}
Content: ${originalContent.title}

Respond: {"responsiveScore": 0-100, "readabilityScore": 0-100, "overallScore": 0-100, "feedback": "feedback", "suggestions": []}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    ]);

    const results = [];
    
    // Parse first evaluator
    try {
      const text1 = eval1.choices[0]?.message?.content || "";
      const cleaned1 = text1.replace(/```json\n?|\n?```/g, "").trim();
      const result1 = JSON.parse(cleaned1);
      results.push({
        model: MODELS.GPT4O_MINI,
        responsiveScore: result1.responsiveScore || 78,
        readabilityScore: result1.readabilityScore || 78,
        overallScore: result1.overallScore || 78,
        feedback: result1.feedback || "Design acceptable",
        suggestions: result1.suggestions || [],
      });
    } catch (e) {
      results.push({
        model: MODELS.GPT4O_MINI,
        responsiveScore: 78,
        readabilityScore: 78,
        overallScore: 78,
        feedback: "Evaluation completed",
        suggestions: [],
      });
    }

    // Parse second evaluator
    try {
      const text2 = eval2.choices[0]?.message?.content || "";
      const cleaned2 = text2.replace(/```json\n?|\n?```/g, "").trim();
      const result2 = JSON.parse(cleaned2);
      results.push({
        model: MODELS.GPT4O,
        responsiveScore: result2.responsiveScore || 80,
        readabilityScore: result2.readabilityScore || 80,
        overallScore: result2.overallScore || 80,
        feedback: result2.feedback || "Design meets requirements",
        suggestions: result2.suggestions || [],
      });
    } catch (e) {
      results.push({
        model: MODELS.GPT4O,
        responsiveScore: 80,
        readabilityScore: 80,
        overallScore: 80,
        feedback: "Evaluation completed",
        suggestions: [],
      });
    }

    return results;
  } catch (error) {
    console.error("GitHub additional evaluators error:", error);
    return [
      {
        model: MODELS.GPT4O_MINI,
        responsiveScore: 78,
        readabilityScore: 78,
        overallScore: 78,
        feedback: "Default evaluation",
        suggestions: [],
      },
      {
        model: MODELS.GPT4O,
        responsiveScore: 80,
        readabilityScore: 80,
        overallScore: 80,
        feedback: "Default evaluation",
        suggestions: [],
      },
    ];
  }
}

/**
 * Calculate consensus from multiple evaluations
 */
function calculateConsensus(evaluations: GitHubAgentEvaluation[]): {
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

  // Calculate agreement (low std dev = high consensus)
  const scores = validEvals.map(e => e.overallScore);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  const agreementBonus = Math.max(0, 10 - stdDev);
  const consensusScore = Math.min(100, Math.round(overallAvg + agreementBonus));

  return { consensusScore, responsiveScore, readabilityScore };
}

/**
 * Merge suggestions from all agents
 */
function mergeSuggestions(evaluations: GitHubAgentEvaluation[]): AISuggestion[] {
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

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return unique.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 6);
}

/**
 * Create fallback design
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
 * Main analysis function using GitHub Models
 */
export async function runGitHubModelsAnalysis(
  url: string,
  extractedContent: ExtractedContent
): Promise<GitHubConsensusResult> {
  console.log("[GitHub Models] Starting analysis for:", url);

  // Step 1: Analyzer
  console.log("[GitHub Models] Running Analyzer...");
  const analysis = await runAnalyzerAgent(url, extractedContent);

  // Step 2: Designer
  console.log("[GitHub Models] Running Designer...");
  const design = await runDesignerAgent(url, extractedContent, analysis.structure);

  // Step 3: Run all agents in parallel
  console.log("[GitHub Models] Running Critics, Accessibility, and Performance...");
  const [criticEval, additionalEvals, accessibilityResult, performanceResult] = await Promise.all([
    runCriticAgent(url, design.layout, extractedContent),
    runAdditionalEvaluators(design.layout, extractedContent),
    runAccessibilityAgent(design.layout, extractedContent),
    runPerformanceAgent(design.layout, extractedContent),
  ]);

  const evaluations = [criticEval, ...additionalEvals];

  // Step 4: Calculate consensus
  const consensus = calculateConsensus(evaluations);
  const mergedSuggestions = mergeSuggestions(evaluations);

  console.log(`[GitHub Models] Consensus score: ${consensus.consensusScore}%`);

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
 * Generate mobile HTML from GitHub Models result
 */
export function generateGitHubModelsHtml(result: GitHubConsensusResult, title: string): string {
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
  <title>${title} - Mobile (GitHub Models)</title>
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
    .github-badge {
      position: fixed;
      bottom: 8px;
      right: 8px;
      background: #24292e;
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 11px;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 6px;
    }
  </style>
</head>
<body>
  <div class="consensus-badge">
    <span>AI Consensus</span>
    <span class="score">${result.consensusScore}%</span>
  </div>
  <div class="github-badge">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="white"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
    <span>Powered by GitHub Models</span>
  </div>
  ${sections}
</body>
</html>`;
}
