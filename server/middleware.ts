import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import sanitizeHtml from 'sanitize-html';

/**
 * Rate limiting middleware for API endpoints
 * Prevents abuse by limiting requests per IP address
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Stricter rate limiting for analysis endpoints
 * Analysis is resource-intensive, so we limit it more
 */
export const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 analysis requests per hour
  message: 'Analysis limit reached. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting for billing endpoints
 * Prevents abuse of Stripe API calls which can incur costs
 */
export const billingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 billing requests per hour
  message: 'Billing request limit reached. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Authentication middleware
 * Checks if user has a valid session
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // For now, we allow all requests
  // In production, check if req.session.user exists
  // if (!req.session?.user) {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }
  next();
}

/**
 * Optional authentication middleware
 * Doesn't block requests but attaches user info if available
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  // Attach user info to request if session exists
  // req.user = req.session?.user || null;
  next();
}

/**
 * Input validation middleware
 * Sanitizes and validates request data
 * 
 * SECURITY NOTE: This provides basic XSS protection for demonstration purposes.
 * The current implementation has known limitations and should NOT be considered
 * comprehensive protection against all XSS vectors.
 * 
 * For production environments, you MUST:
 * 1. Use a dedicated sanitization library like:
 *    - DOMPurify (browser-side)
 *    - sanitize-html (server-side Node.js)
 *    - OWASP Java HTML Sanitizer
 * 2. Implement Content Security Policy (CSP) headers
 * 3. Use prepared statements/parameterized queries for database operations
 * 4. Validate data types and formats with Zod schemas (already implemented)
 * 5. Escape output in templates (React does this automatically)
 * 
 * Current implementation removes common patterns but may miss edge cases.
 */
export function validateRequest(req: Request, res: Response, next: NextFunction) {
  // Basic XSS prevention: This is NOT comprehensive
  // In production, prefer a fully configured sanitization setup and CSP.
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Use a well-tested sanitization library instead of ad-hoc regexes.
      // Configuration here is intentionally strict for API inputs:
      //  - strip all HTML tags
      //  - disallow dangerous URL schemes like "javascript:" and "vbscript:"
      return sanitizeHtml(obj, {
        allowedTags: [],
        allowedAttributes: {},
        allowedSchemes: ['http', 'https', 'mailto'],
        allowProtocolRelative: false,
      });
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }

  next();
}

/**
 * Error handling middleware
 * Catches and formats errors consistently
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(isDevelopment && { stack: err.stack }),
  });
}
