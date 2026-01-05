/**
 * In-memory cache service with TTL and LRU eviction
 * For production with multiple servers, replace with Redis
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private stats: CacheStats;
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 1000, defaultTTL: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      maxSize,
    };

    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size = this.cache.size;
      return null;
    }

    // Update last accessed time for LRU
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    
    return entry.value;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);

    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      expiresAt,
      lastAccessed: Date.now(),
    });

    this.stats.size = this.cache.size;
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.stats.size = this.cache.size;
    return result;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.size = this.cache.size;
      return false;
    }

    return true;
  }

  /**
   * Clear all cache entries
   */
  flush(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  /**
   * Clear cache entries by prefix/namespace
   */
  clearNamespace(prefix: string): number {
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.stats.size = this.cache.size;
    return count;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      ...this.stats,
      size: this.cache.size,
    };
  }

  /**
   * Get cache hit rate
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total === 0 ? 0 : this.stats.hits / total;
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`Cache cleanup: removed ${removed} expired entries`);
      this.stats.size = this.cache.size;
    }
  }

  /**
   * Get or set with fallback function
   */
  async getOrSet<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const value = await fallback();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Warm cache with multiple entries
   */
  warm<T>(entries: Array<{ key: string; value: T; ttl?: number }>): void {
    for (const { key, value, ttl } of entries) {
      this.set(key, value, ttl);
    }
  }
}

// Export singleton instance
export const cache = new CacheService();

// Helper functions for common cache key patterns
export const CacheKeys = {
  userAnalyses: (userId: string, options?: any) => 
    `user:${userId}:analyses:${JSON.stringify(options || {})}`,
  
  projects: (userId: string) => 
    `user:${userId}:projects`,
  
  project: (projectId: string) => 
    `project:${projectId}`,
  
  preferences: (userId: string) => 
    `user:${userId}:preferences`,
  
  apiKeys: (userId: string) => 
    `user:${userId}:apiKeys`,
  
  analysis: (analysisId: string) => 
    `analysis:${analysisId}`,
  
  userProfile: (userId: string) => 
    `user:${userId}:profile`,
};

// Cache invalidation helpers
export const CacheInvalidation = {
  onUserUpdate: (userId: string) => {
    cache.clearNamespace(`user:${userId}:`);
  },
  
  onProjectChange: (userId: string, projectId?: string) => {
    cache.delete(CacheKeys.projects(userId));
    if (projectId) {
      cache.delete(CacheKeys.project(projectId));
    }
  },
  
  onAnalysisChange: (userId: string, analysisId?: string) => {
    cache.clearNamespace(`user:${userId}:analyses:`);
    if (analysisId) {
      cache.delete(CacheKeys.analysis(analysisId));
    }
  },
  
  onPreferencesChange: (userId: string) => {
    cache.delete(CacheKeys.preferences(userId));
  },
};

// Export cache service
export default cache;
