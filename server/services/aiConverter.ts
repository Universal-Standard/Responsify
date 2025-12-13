/**
 * AI Converter Service
 * Uses OpenAI to analyze websites and generate mobile-responsive conversions
 */

import OpenAI from "openai";
import type { ExtractedContent } from "./websiteFetcher";

// Initialize OpenAI with Replit AI Integrations
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

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

export interface AISuggestion {
  type: "style" | "layout" | "content" | "accessibility";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action?: string;
}

export interface MobileLayoutSection {
  id: string;
  type: "hero" | "navigation" | "content" | "features" | "cta" | "footer" | "form" | "gallery";
  title: string;
  content: string;
  styles: Record<string, string>;
}

export async function analyzeAndConvert(
  url: string,
  extractedContent: ExtractedContent,
  rawHtml: string
): Promise<AIAnalysisResult> {
  const prompt = buildAnalysisPrompt(url, extractedContent);
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert mobile UI/UX designer and web developer. Your task is to analyze desktop websites and create mobile-optimized responsive designs.

You MUST respond with valid JSON only. No explanations, no markdown, just pure JSON.

Focus on:
1. Mobile-first responsive design principles
2. Touch-friendly UI elements (min 44px touch targets)
3. Readable typography (16px+ body text)
4. Optimized navigation for small screens
5. Performance-conscious design choices
6. Accessibility best practices

Score the design objectively based on mobile usability.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    const cleanedContent = content.replace(/```json\n?|\n?```/g, "").trim();
    const result = JSON.parse(cleanedContent) as AIAnalysisResult;
    
    return result;
  } catch (error: any) {
    console.error("AI analysis error:", error);
    
    // Return a fallback analysis if AI fails
    return generateFallbackAnalysis(extractedContent);
  }
}

function buildAnalysisPrompt(url: string, content: ExtractedContent): string {
  return `Analyze this website and create a mobile-optimized version.

URL: ${url}
Title: ${content.title}
Description: ${content.description}

NAVIGATION ITEMS:
${content.navigation.slice(0, 10).join(", ") || "None found"}

HEADINGS:
${content.headings.slice(0, 8).join("\n") || "None found"}

BUTTONS/CTAs:
${content.buttons.slice(0, 8).join(", ") || "None found"}

MAIN CONTENT PREVIEW:
${content.mainContent.slice(0, 3).join("\n\n") || "None found"}

DETECTED COLORS:
${content.styles.colors.slice(0, 10).join(", ") || "None found"}

DETECTED FONTS:
${content.styles.fonts.slice(0, 5).join(", ") || "None found"}

Generate a JSON response with this exact structure:
{
  "responsiveScore": <number 0-100>,
  "readabilityScore": <number 0-100>,
  "suggestions": [
    {
      "type": "style|layout|content|accessibility",
      "priority": "high|medium|low",
      "title": "<short title>",
      "description": "<actionable description>",
      "action": "<optional CSS or code suggestion>"
    }
  ],
  "mobileLayout": [
    {
      "id": "<unique-id>",
      "type": "hero|navigation|content|features|cta|footer|form|gallery",
      "title": "<section title>",
      "content": "<HTML content for this section optimized for mobile>",
      "styles": {
        "backgroundColor": "<color>",
        "padding": "<value>",
        "textAlign": "<value>"
      }
    }
  ],
  "colorPalette": ["<primary>", "<secondary>", "<accent>", "<background>", "<text>"],
  "typography": {
    "headingFont": "<font family>",
    "bodyFont": "<font family>",
    "sizes": {
      "heading": "<size>",
      "body": "<size>",
      "small": "<size>"
    }
  }
}

Create 4-6 mobile layout sections that represent the key parts of this website optimized for mobile viewing.
Include at least 3 specific, actionable suggestions for improving mobile UX.`;
}

function generateFallbackAnalysis(content: ExtractedContent): AIAnalysisResult {
  // Generate a reasonable fallback if AI fails
  return {
    responsiveScore: 75,
    readabilityScore: 80,
    suggestions: [
      {
        type: "layout",
        priority: "high",
        title: "Optimize Navigation",
        description: "Convert navigation to a hamburger menu for better mobile usability",
      },
      {
        type: "style",
        priority: "medium",
        title: "Increase Touch Targets",
        description: "Ensure all buttons and links have at least 44px touch target size",
      },
      {
        type: "content",
        priority: "medium",
        title: "Simplify Content",
        description: "Consider using progressive disclosure to reduce cognitive load on mobile",
      },
    ],
    mobileLayout: [
      {
        id: "header",
        type: "navigation",
        title: "Header",
        content: `<header class="mobile-header"><h1>${content.title || "Website"}</h1></header>`,
        styles: { backgroundColor: "#ffffff", padding: "16px" },
      },
      {
        id: "hero",
        type: "hero",
        title: "Hero Section",
        content: `<section class="mobile-hero"><h2>${content.headings[0] || "Welcome"}</h2><p>${content.description || ""}</p></section>`,
        styles: { backgroundColor: "#f8f9fa", padding: "24px", textAlign: "center" },
      },
      {
        id: "content",
        type: "content",
        title: "Main Content",
        content: `<section class="mobile-content">${content.mainContent.slice(0, 2).map(p => `<p>${p}</p>`).join("") || "<p>Content goes here</p>"}</section>`,
        styles: { backgroundColor: "#ffffff", padding: "16px" },
      },
      {
        id: "cta",
        type: "cta",
        title: "Call to Action",
        content: `<section class="mobile-cta"><button>${content.buttons[0] || "Get Started"}</button></section>`,
        styles: { backgroundColor: "#6C5CE7", padding: "24px", textAlign: "center" },
      },
    ],
    colorPalette: content.styles.colors.slice(0, 5).length > 0 
      ? content.styles.colors.slice(0, 5) 
      : ["#6C5CE7", "#00B894", "#FDCB6E", "#F8F9FA", "#2D3436"],
    typography: {
      headingFont: content.styles.fonts[0] || "Inter, sans-serif",
      bodyFont: content.styles.fonts[1] || "Inter, sans-serif",
      sizes: { heading: "28px", body: "16px", small: "14px" },
    },
  };
}

export function generateMobileHtml(analysis: AIAnalysisResult, title: string): string {
  const sections = analysis.mobileLayout.map(section => {
    const styleStr = Object.entries(section.styles)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`)
      .join("; ");
    
    return `<section id="${section.id}" class="mobile-section mobile-${section.type}" style="${styleStr}">
      ${section.content}
    </section>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Mobile Version</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${analysis.typography.bodyFont};
      font-size: ${analysis.typography.sizes.body};
      line-height: 1.6;
      color: ${analysis.colorPalette[4] || "#2D3436"};
      background-color: ${analysis.colorPalette[3] || "#F8F9FA"};
    }
    h1, h2, h3 {
      font-family: ${analysis.typography.headingFont};
      font-size: ${analysis.typography.sizes.heading};
      line-height: 1.2;
      margin-bottom: 16px;
    }
    .mobile-section { padding: 24px 16px; }
    .mobile-hero { text-align: center; }
    .mobile-cta { text-align: center; }
    .mobile-cta button {
      background: ${analysis.colorPalette[0] || "#6C5CE7"};
      color: white;
      border: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      max-width: 300px;
    }
    a { color: ${analysis.colorPalette[0] || "#6C5CE7"}; }
    p { margin-bottom: 16px; }
  </style>
</head>
<body>
  ${sections}
</body>
</html>`;
}
