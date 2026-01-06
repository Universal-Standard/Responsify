import type { Request, Response, NextFunction } from 'express';

/**
 * Simple session user interface
 * In production, this should be replaced with proper session management (express-session + passport)
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: string;
        username: string;
      };
    }
  }
}

/**
 * Authentication middleware - checks for user session
 * For now, creates a default user if none exists
 * Replace with proper authentication in production
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  // For now, use a default user ID
  // In production, get this from req.session or JWT token
  const userId = req.headers['x-user-id'] as string || 'default-user-id';
  
  req.userId = userId;
  req.user = {
    id: userId,
    username: 'user',
  };
  
  next();
}

/**
 * Require authentication middleware
 * Returns 401 if user is not authenticated
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}
