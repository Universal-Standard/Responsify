import session from 'express-session';
import RedisStore from 'connect-redis';
import MemoryStore from 'memorystore';
import { createClient } from 'redis';

const MemoryStoreSession = MemoryStore(session);

/**
 * Create session store based on environment
 * Production: Redis for distributed sessions
 * Development: Memory store for simplicity
 */
export async function createSessionStore() {
  const isProduction = process.env.NODE_ENV === 'production';
  const redisUrl = process.env.REDIS_URL;

  if (isProduction && redisUrl) {
    try {
      // Use Redis in production for distributed session management
      const redisClient = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('Redis connection failed after 10 retries');
              return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      redisClient.on('error', (err) => console.error('Redis Client Error', err));
      redisClient.on('connect', () => console.log('✅ Redis connected'));
      redisClient.on('reconnecting', () => console.log('⚠️  Redis reconnecting...'));

      await redisClient.connect();

      return new RedisStore({
        client: redisClient,
        prefix: 'responsiai:',
        ttl: 86400, // 24 hours
      });
    } catch (error) {
      console.warn('⚠️  Redis connection failed, falling back to memory store:', error);
      return createMemoryStore();
    }
  }

  // Development or fallback: Use memory store
  return createMemoryStore();
}

function createMemoryStore() {
  return new MemoryStoreSession({
    checkPeriod: 86400000, // Prune expired entries every 24h
    ttl: 86400000, // 24 hours
    max: 10000, // Max number of sessions
  });
}

/**
 * Session configuration
 */
export function getSessionConfig(store: session.Store): session.SessionOptions {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    store,
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    name: 'responsiai.sid',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction, // HTTPS only in production
      httpOnly: true, // Prevent XSS
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      sameSite: 'lax', // CSRF protection
      domain: isProduction ? process.env.COOKIE_DOMAIN : undefined,
    },
    rolling: true, // Extend session on activity
  };
}
