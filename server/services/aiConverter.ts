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
  type: "hero" | "navigation" | "content" | "features" | "cta" | "footer" | "form" | "gallery" | "stats" | "testimonial";
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
          content: `You are an expert mobile UI/UX designer specializing in converting desktop websites to beautiful, functional mobile experiences. 

Your task is to analyze a website and create a complete mobile-optimized version with real content from the site.

CRITICAL REQUIREMENTS:
1. Use ACTUAL content from the website - real headings, real descriptions, real CTAs
2. Create clean, modern mobile layouts with proper spacing and visual hierarchy
3. Ensure all text is readable and touch targets are large enough
4. Use the website's actual colors when detected, or create a harmonious palette
5. Generate complete, ready-to-render HTML for each section

You MUST respond with valid JSON only. No markdown code blocks, no explanations.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response - handle markdown code blocks
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.replace(/```json\n?|\n?```/g, "").trim();
    }
    
    const result = JSON.parse(cleanedContent) as AIAnalysisResult;
    return result;
  } catch (error: any) {
    console.error("AI analysis error:", error);
    return generateFallbackAnalysis(extractedContent, url);
  }
}

function buildAnalysisPrompt(url: string, content: ExtractedContent): string {
  const navItems = content.navigation.slice(0, 8).filter(n => n.length < 30);
  const headings = content.headings.slice(0, 6);
  const buttons = content.buttons.slice(0, 6).filter(b => b.length < 50);
  const mainContent = content.mainContent.slice(0, 4).map(p => p.slice(0, 300));
  
  return `Analyze this website and create a beautiful mobile version:

URL: ${url}
TITLE: ${content.title || "Website"}
DESCRIPTION: ${content.description || "No description available"}

NAVIGATION: ${navItems.join(" | ") || "Home, About, Contact"}
HEADINGS: ${headings.join(" || ") || "Welcome"}
BUTTONS: ${buttons.join(", ") || "Get Started, Learn More"}
CONTENT: ${mainContent.join(" ... ") || "Main content here"}
COLORS: ${content.styles.colors.slice(0, 6).join(", ") || "#6366f1, #f8fafc, #1e293b"}
FONTS: ${content.styles.fonts.slice(0, 3).join(", ") || "Inter, system-ui"}

Respond with this exact JSON structure (use the REAL content from above):
{
  "responsiveScore": 75,
  "readabilityScore": 80,
  "suggestions": [
    {"type": "layout", "priority": "high", "title": "Use hamburger menu", "description": "Convert horizontal nav to mobile menu"},
    {"type": "style", "priority": "medium", "title": "Larger touch targets", "description": "Increase button padding to 48px minimum"},
    {"type": "accessibility", "priority": "medium", "title": "Add focus states", "description": "Improve keyboard navigation visibility"}
  ],
  "mobileLayout": [
    {
      "id": "header",
      "type": "navigation",
      "title": "Header",
      "content": "<div style='display:flex;align-items:center;justify-content:space-between;'><h1 style='font-size:20px;font-weight:700;margin:0;'>[Site Name]</h1><button style='background:none;border:none;padding:12px;'><svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><path d='M3 12h18M3 6h18M3 18h18'/></svg></button></div>",
      "styles": {"backgroundColor": "#ffffff", "padding": "16px", "borderBottom": "1px solid #e2e8f0"}
    },
    {
      "id": "hero",
      "type": "hero", 
      "title": "Hero",
      "content": "<div style='text-align:center;'><h2 style='font-size:28px;font-weight:800;margin-bottom:16px;line-height:1.2;'>[Main Heading]</h2><p style='font-size:16px;color:#64748b;margin-bottom:24px;line-height:1.6;'>[Description]</p><button style='background:#6366f1;color:white;border:none;padding:16px 32px;border-radius:12px;font-size:16px;font-weight:600;width:100%;max-width:280px;'>[Primary CTA]</button></div>",
      "styles": {"backgroundColor": "#f8fafc", "padding": "48px 24px"}
    },
    {
      "id": "features",
      "type": "features",
      "title": "Features",
      "content": "<div><h3 style='font-size:22px;font-weight:700;margin-bottom:24px;text-align:center;'>Key Features</h3><div style='display:flex;flex-direction:column;gap:16px;'>[Feature cards with icons]</div></div>",
      "styles": {"backgroundColor": "#ffffff", "padding": "40px 24px"}
    },
    {
      "id": "cta",
      "type": "cta",
      "title": "Call to Action",
      "content": "<div style='text-align:center;'><h3 style='font-size:22px;font-weight:700;margin-bottom:12px;color:white;'>[CTA Heading]</h3><p style='color:rgba(255,255,255,0.9);margin-bottom:24px;'>[CTA Description]</p><button style='background:white;color:#6366f1;border:none;padding:16px 32px;border-radius:12px;font-size:16px;font-weight:600;'>[CTA Button]</button></div>",
      "styles": {"backgroundColor": "#6366f1", "padding": "48px 24px"}
    },
    {
      "id": "footer",
      "type": "footer",
      "title": "Footer",
      "content": "<div style='text-align:center;'><p style='font-size:14px;color:#64748b;'>[Footer text]</p></div>",
      "styles": {"backgroundColor": "#f1f5f9", "padding": "32px 24px"}
    }
  ],
  "colorPalette": ["#6366f1", "#10b981", "#f59e0b", "#f8fafc", "#1e293b"],
  "typography": {
    "headingFont": "Inter, system-ui, sans-serif",
    "bodyFont": "Inter, system-ui, sans-serif",
    "sizes": {"heading": "28px", "body": "16px", "small": "14px"}
  }
}

IMPORTANT: Replace all [bracketed placeholders] with REAL content from the website. Create 4-6 sections that best represent this specific website.`;
}

function generateFallbackAnalysis(content: ExtractedContent, url: string): AIAnalysisResult {
  const siteName = content.title || new URL(url).hostname.replace('www.', '');
  const primaryColor = content.styles.colors[0] || "#6366f1";
  const description = content.description || "Welcome to our website";
  const mainHeading = content.headings[0] || content.title || "Welcome";
  const ctaButton = content.buttons[0] || "Get Started";
  
  return {
    responsiveScore: 70,
    readabilityScore: 75,
    suggestions: [
      {
        type: "layout",
        priority: "high",
        title: "Mobile Navigation",
        description: "Implement a collapsible hamburger menu for smaller screens",
      },
      {
        type: "style",
        priority: "high",
        title: "Touch-Friendly Buttons",
        description: "Ensure all interactive elements have at least 44px touch targets",
      },
      {
        type: "content",
        priority: "medium",
        title: "Prioritize Content",
        description: "Show the most important content first for mobile users",
      },
      {
        type: "accessibility",
        priority: "medium",
        title: "Improve Contrast",
        description: "Ensure text has sufficient contrast against backgrounds",
      },
    ],
    mobileLayout: [
      {
        id: "header",
        type: "navigation",
        title: "Header",
        content: `<div style="display:flex;align-items:center;justify-content:space-between;">
          <h1 style="font-size:20px;font-weight:700;margin:0;color:#1e293b;">${siteName}</h1>
          <button style="background:none;border:none;padding:12px;cursor:pointer;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="2">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>
        </div>`,
        styles: { backgroundColor: "#ffffff", padding: "16px 20px", borderBottom: "1px solid #e2e8f0" },
      },
      {
        id: "hero",
        type: "hero",
        title: "Hero Section",
        content: `<div style="text-align:center;">
          <h2 style="font-size:32px;font-weight:800;margin-bottom:16px;line-height:1.2;color:#1e293b;">${mainHeading}</h2>
          <p style="font-size:17px;color:#64748b;margin-bottom:28px;line-height:1.7;">${description}</p>
          <button style="background:${primaryColor};color:white;border:none;padding:18px 36px;border-radius:12px;font-size:17px;font-weight:600;width:100%;max-width:300px;cursor:pointer;box-shadow:0 4px 14px rgba(99,102,241,0.3);">${ctaButton}</button>
        </div>`,
        styles: { backgroundColor: "#f8fafc", padding: "56px 24px" },
      },
      {
        id: "features",
        type: "features",
        title: "Features",
        content: `<div>
          <h3 style="font-size:24px;font-weight:700;margin-bottom:28px;text-align:center;color:#1e293b;">What We Offer</h3>
          <div style="display:flex;flex-direction:column;gap:20px;">
            ${content.headings.slice(1, 4).map((heading, i) => `
              <div style="background:white;border-radius:16px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                <div style="width:48px;height:48px;background:${primaryColor}15;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="${primaryColor}"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                <h4 style="font-size:18px;font-weight:600;margin-bottom:8px;color:#1e293b;">${heading}</h4>
                <p style="font-size:15px;color:#64748b;line-height:1.6;">${content.mainContent[i]?.slice(0, 120) || 'Discover amazing features designed for you.'}</p>
              </div>
            `).join('')}
          </div>
        </div>`,
        styles: { backgroundColor: "#f1f5f9", padding: "48px 24px" },
      },
      {
        id: "cta-section",
        type: "cta",
        title: "Call to Action",
        content: `<div style="text-align:center;">
          <h3 style="font-size:26px;font-weight:700;margin-bottom:16px;color:white;">Ready to Get Started?</h3>
          <p style="color:rgba(255,255,255,0.9);margin-bottom:28px;font-size:16px;line-height:1.6;">Join thousands of users who trust us</p>
          <button style="background:white;color:${primaryColor};border:none;padding:18px 36px;border-radius:12px;font-size:17px;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,0.15);">Sign Up Free</button>
        </div>`,
        styles: { backgroundColor: primaryColor, padding: "56px 24px" },
      },
      {
        id: "footer",
        type: "footer",
        title: "Footer",
        content: `<div style="text-align:center;">
          <p style="font-size:15px;color:#64748b;margin-bottom:16px;">${siteName}</p>
          <div style="display:flex;gap:24px;justify-content:center;flex-wrap:wrap;">
            ${content.navigation.slice(0, 4).map(nav => `<a href="#" style="color:#64748b;text-decoration:none;font-size:14px;">${nav}</a>`).join('')}
          </div>
          <p style="font-size:13px;color:#94a3b8;margin-top:24px;">© 2024 ${siteName}. All rights reserved.</p>
        </div>`,
        styles: { backgroundColor: "#f8fafc", padding: "40px 24px", borderTop: "1px solid #e2e8f0" },
      },
    ],
    colorPalette: content.styles.colors.length > 0 
      ? [...content.styles.colors.slice(0, 3), "#f8fafc", "#1e293b"]
      : [primaryColor, "#10b981", "#f59e0b", "#f8fafc", "#1e293b"],
    typography: {
      headingFont: content.styles.fonts[0] || "Inter, system-ui, sans-serif",
      bodyFont: content.styles.fonts[1] || content.styles.fonts[0] || "Inter, system-ui, sans-serif",
      sizes: { heading: "28px", body: "16px", small: "14px" },
    },
  };
}

export function generateMobileHtml(analysis: AIAnalysisResult, title: string): string {
  const sections = analysis.mobileLayout.map(section => {
    const styleStr = Object.entries(section.styles)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`)
      .join("; ");
    
    return `<section id="${section.id}" class="mobile-section" style="${styleStr}">
      ${section.content}
    </section>`;
  }).join("\n  ");

  const primaryColor = analysis.colorPalette[0] || "#6366f1";
  const bgColor = analysis.colorPalette[3] || "#ffffff";
  const textColor = analysis.colorPalette[4] || "#1e293b";

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
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    html {
      -webkit-text-size-adjust: 100%;
      -webkit-tap-highlight-color: transparent;
    }
    
    body {
      font-family: ${analysis.typography.bodyFont};
      font-size: ${analysis.typography.sizes.body};
      line-height: 1.6;
      color: ${textColor};
      background-color: ${bgColor};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      overflow-x: hidden;
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: ${analysis.typography.headingFont};
      line-height: 1.2;
      font-weight: 700;
    }
    
    img {
      max-width: 100%;
      height: auto;
      display: block;
    }
    
    button {
      font-family: inherit;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    
    button:active {
      transform: scale(0.98);
    }
    
    a {
      color: ${primaryColor};
      text-decoration: none;
      transition: opacity 0.15s ease;
    }
    
    a:active {
      opacity: 0.7;
    }
    
    .mobile-section {
      width: 100%;
    }
    
    /* Smooth scrolling */
    html {
      scroll-behavior: smooth;
    }
    
    /* Better focus states */
    button:focus-visible, a:focus-visible {
      outline: 2px solid ${primaryColor};
      outline-offset: 2px;
    }
  </style>
</head>
<body>
  ${sections}
</body>
</html>`;
}
