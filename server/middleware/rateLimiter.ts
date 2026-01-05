import type { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitStore {
  [key: string]: RateLimitEntry;
}

// In-memory store for rate limiting
// In production, replace with Redis for distributed rate limiting
const rateLimitStore: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const key in rateLimitStore) {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

// Tier-based rate limits
export const RATE_LIMITS = {
  free: { windowMs: 15 * 60 * 1000, maxRequests: 10 }, // 10 per 15 min
  pro: { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 per 15 min
  enterprise: { windowMs: 15 * 60 * 1000, maxRequests: 1000 }, // 1000 per 15 min
  anonymous: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 per 15 min
};

/**
 * Create a rate limiting middleware
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (req) => {
      // Use user ID if authenticated, otherwise use IP
      const userId = (req as any).session?.user?.id;
      return userId || req.ip || 'unknown';
    },
  } = config;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyGenerator(req);
      const now = Date.now();

      // Get or create entry
      let entry = rateLimitStore[key];
      
      if (!entry || entry.resetTime < now) {
        // Create new entry with reset time
        entry = {
          count: 0,
          resetTime: now + windowMs,
        };
        rateLimitStore[key] = entry;
      }

      // Increment request count
      entry.count++;

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count).toString());
      res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

      // Check if rate limit exceeded
      if (entry.count > maxRequests) {
        res.setHeader('Retry-After', Math.ceil((entry.resetTime - now) / 1000).toString());
        
        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil((entry.resetTime - now) / 1000)} seconds.`,
          resetAt: new Date(entry.resetTime).toISOString(),
        });
      }

      // Hook into response to potentially skip counting
      const originalSend = res.send;
      res.send = function (body: any) {
        const statusCode = res.statusCode;
        
        // Decrement count if we're skipping this request
        if (
          (skipSuccessfulRequests && statusCode >= 200 && statusCode < 400) ||
          (skipFailedRequests && statusCode >= 400)
        ) {
          entry.count--;
        }
        
        return originalSend.call(this, body);
      };

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // On error, allow request through (fail open)
      next();
    }
  };
}

/**
 * Get user's rate limit based on their tier
 */
export function getUserRateLimit(userRole?: string): RateLimitConfig {
  switch (userRole) {
    case 'enterprise':
      return RATE_LIMITS.enterprise;
    case 'pro':
      return RATE_LIMITS.pro;
    case 'free':
      return RATE_LIMITS.free;
    default:
      return RATE_LIMITS.anonymous;
  }
}

/**
 * Dynamic rate limiter that adjusts based on user tier
 */
export const dynamicRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as any).session?.user;
  const userRole = user?.role || 'anonymous';
  const config = getUserRateLimit(userRole);
  
  const limiter = createRateLimiter(config);
  return limiter(req, res, next);
};

/**
 * Check current rate limit status for a user
 */
export function getRateLimitStatus(key: string) {
  const entry = rateLimitStore[key];
  
  if (!entry || entry.resetTime < Date.now()) {
    return {
      count: 0,
      remaining: Infinity,
      resetTime: null,
    };
  }
  
  return {
    count: entry.count,
    remaining: Math.max(0, entry.count),
    resetTime: new Date(entry.resetTime),
  };
}

/**
 * Clear rate limit for a specific key (admin function)
 */
export function clearRateLimit(key: string) {
  delete rateLimitStore[key];
}

/**
 * Get rate limit statistics
 */
export function getRateLimitStats() {
  const now = Date.now();
  let activeKeys = 0;
  let totalRequests = 0;
  let exceededLimits = 0;
  
  for (const key in rateLimitStore) {
    const entry = rateLimitStore[key];
    if (entry.resetTime >= now) {
      activeKeys++;
      totalRequests += entry.count;
      
      // Check if this key has exceeded any limit
      const limits = Object.values(RATE_LIMITS);
      for (const limit of limits) {
        if (entry.count > limit.maxRequests) {
          exceededLimits++;
          break;
        }
      }
    }
  }
  
  return {
    activeKeys,
    totalRequests,
    exceededLimits,
    storeSize: Object.keys(rateLimitStore).length,
  };
}
