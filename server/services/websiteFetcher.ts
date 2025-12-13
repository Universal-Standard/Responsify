/**
 * Website Fetcher Service
 * Fetches and parses websites using a desktop user-agent to avoid mobile redirects
 */

interface FetchResult {
  success: boolean;
  html?: string;
  title?: string;
  description?: string;
  error?: string;
  statusCode?: number;
}

interface ExtractedElement {
  type: string;
  tagName: string;
  text?: string;
  attributes?: Record<string, string>;
  children?: ExtractedElement[];
}

interface ExtractedContent {
  title: string;
  description: string;
  headings: string[];
  navigation: string[];
  mainContent: string[];
  buttons: string[];
  forms: { action: string; fields: string[] }[];
  images: { src: string; alt: string }[];
  links: { href: string; text: string }[];
  styles: {
    colors: string[];
    fonts: string[];
  };
}

// Desktop Chrome user agent to avoid mobile-specific pages
const DESKTOP_USER_AGENT = 
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const FETCH_TIMEOUT = 15000; // 15 seconds

export async function fetchWebsite(url: string): Promise<FetchResult> {
  try {
    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    // Validate URL
    const urlObj = new URL(normalizedUrl);
    
    // Fetch with desktop user agent
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(normalizedUrl, {
      method: "GET",
      headers: {
        "User-Agent": DESKTOP_USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status,
      };
    }

    const html = await response.text();
    
    // Extract basic metadata from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : urlObj.hostname;
    
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    const description = descMatch ? descMatch[1].trim() : "";

    return {
      success: true,
      html,
      title,
      description,
      statusCode: response.status,
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      return {
        success: false,
        error: "Request timed out. The website took too long to respond.",
      };
    }
    
    return {
      success: false,
      error: error.message || "Failed to fetch website",
    };
  }
}

export function extractWebsiteContent(html: string): ExtractedContent {
  // Extract key content using regex (simple extraction without DOM parser)
  const content: ExtractedContent = {
    title: "",
    description: "",
    headings: [],
    navigation: [],
    mainContent: [],
    buttons: [],
    forms: [],
    images: [],
    links: [],
    styles: {
      colors: [],
      fonts: [],
    },
  };

  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  content.title = titleMatch ? titleMatch[1].trim() : "";

  // Description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  content.description = descMatch ? descMatch[1].trim() : "";

  // Headings (h1-h3)
  const headingRegex = /<h[1-3][^>]*>([^<]*(?:<[^>]+>[^<]*)*)<\/h[1-3]>/gi;
  let headingMatch;
  while ((headingMatch = headingRegex.exec(html)) !== null) {
    const text = headingMatch[1].replace(/<[^>]+>/g, "").trim();
    if (text) content.headings.push(text);
  }

  // Navigation items
  const navRegex = /<nav[^>]*>([\s\S]*?)<\/nav>/gi;
  let navMatch;
  while ((navMatch = navRegex.exec(html)) !== null) {
    const linkRegex = /<a[^>]*>([^<]+)<\/a>/gi;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(navMatch[1])) !== null) {
      content.navigation.push(linkMatch[1].trim());
    }
  }

  // Buttons
  const buttonRegex = /<button[^>]*>([^<]*(?:<[^>]+>[^<]*)*)<\/button>/gi;
  let buttonMatch;
  while ((buttonMatch = buttonRegex.exec(html)) !== null) {
    const text = buttonMatch[1].replace(/<[^>]+>/g, "").trim();
    if (text) content.buttons.push(text);
  }

  // Links with text
  const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*(?:<[^>]+>[^<]*)*)<\/a>/gi;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const text = linkMatch[2].replace(/<[^>]+>/g, "").trim();
    if (text && text.length < 100) {
      content.links.push({ href: linkMatch[1], text });
    }
  }

  // Images
  const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    content.images.push({ src: imgMatch[1], alt: imgMatch[2] });
  }

  // Extract colors from inline styles
  const colorRegex = /#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)/g;
  const colorMatches = html.match(colorRegex) || [];
  content.styles.colors = Array.from(new Set(colorMatches)).slice(0, 20);

  // Extract font families
  const fontRegex = /font-family:\s*([^;}"']+)/gi;
  let fontMatch;
  const fonts: string[] = [];
  while ((fontMatch = fontRegex.exec(html)) !== null) {
    const font = fontMatch[1].trim();
    if (!fonts.includes(font)) fonts.push(font);
  }
  content.styles.fonts = fonts.slice(0, 10);

  // Main content paragraphs
  const pRegex = /<p[^>]*>([^<]*(?:<[^>]+>[^<]*)*)<\/p>/gi;
  let pMatch;
  while ((pMatch = pRegex.exec(html)) !== null && content.mainContent.length < 10) {
    const text = pMatch[1].replace(/<[^>]+>/g, "").trim();
    if (text && text.length > 20) {
      content.mainContent.push(text);
    }
  }

  return content;
}

export type { FetchResult, ExtractedContent, ExtractedElement };
