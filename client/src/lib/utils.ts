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
    const validDomains = ['checkout.stripe.com', 'billing.stripe.com'];
    
    // Check for exact domain match and HTTPS protocol
    return validDomains.includes(urlObj.hostname) && urlObj.protocol === 'https:';
  } catch {
    // Invalid URL format
    return false;
  }
}
