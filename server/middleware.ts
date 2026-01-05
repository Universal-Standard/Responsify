import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';

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
 */
export function validateRequest(req: Request, res: Response, next: NextFunction) {
  // Basic XSS prevention: remove script tags from all string inputs
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
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
