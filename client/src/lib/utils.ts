import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates that a URL is from a trusted Stripe domain
 * Prevents open redirect and subdomain attacks
 * @param url - The URL to validate
 * @returns true if the URL is from a valid Stripe domain
 */
export function isValidStripeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Allow stripe.com and any secure subdomain of stripe.com
    const isStripeDomain = hostname === 'stripe.com' || hostname.endsWith('.stripe.com');
    
    // Check for valid Stripe domain and HTTPS protocol
    return isStripeDomain && urlObj.protocol === 'https:';
  } catch {
    // Invalid URL format
    return false;
  }
}
