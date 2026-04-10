interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccess: number;
  priority: 'high' | 'medium' | 'low';
  size: number;
}

interface AIDataRequest<T> {
  key: string;
  fetcher: () => Promise<T>;
  priority?: 'high' | 'medium' | 'low';
  ttl?: number;
  prefetch?: boolean;
}

interface AIScheduleConfig {
  maxCacheSize: number;
  defaultTTL: number;
  prefetchThreshold: number;
  cleanupInterval: number;
  compressionThreshold: number;
}

const DEFAULT_CONFIG: AIScheduleConfig = {
  maxCacheSize: 0,
  defaultTTL: 0,
  prefetchThreshold: 0.7,
  cleanupInterval: 60000,
  compressionThreshold: 1000,
};

class AISmartScheduler {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private config: AIScheduleConfig;
  private userBehavior: Map<string, number[]> = new Map();
  private accessPatterns: string[] = [];
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<AIScheduleConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanup();
  }

  async request<T>(request: AIDataRequest<T>): Promise<T> {
    const { key, fetcher, priority = 'medium', ttl = this.config.defaultTTL, prefetch = false } = request;

    if (!prefetch && ttl > 0 && this.config.maxCacheSize > 0) {
      const cached = this.getFromCache<T>(key, ttl);
      if (cached) {
        this.updateAccessPattern(key);
        return cached;
      }

      if (this.pendingRequests.has(key)) {
        return this.pendingRequests.get(key) as Promise<T>;
      }
    }

    const promise = (async () => {
      try {
        const data = await fetcher();
        if (ttl > 0 && this.config.maxCacheSize > 0) {
          this.setCache(key, data, priority);
        }
        return data;
      } finally {
        this.pendingRequests.delete(key);
      }
    })();

    this.pendingRequests.set(key, promise);
    return promise;
  }

  private getFromCache<T>(key: string, ttl: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    entry.accessCount++;
    entry.lastAccess = now;
    return entry.data;
  }

  private setCache<T>(key: string, data: T, priority: 'high' | 'medium' | 'low'): void {
    const size = this.estimateSize(data);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccess: Date.now(),
      priority,
      size,
    };

    this.evictIfNeeded(size);
    this.cache.set(key, entry);
  }

  private evictIfNeeded(newSize: number): void {
    let currentSize = this.getCurrentCacheSize();
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => this.getEvictionScore(a) - this.getEvictionScore(b));

    while (currentSize + newSize > this.config.maxCacheSize && entries.length > 0) {
      const [key, entry] = entries.shift()!;
      currentSize -= entry.size;
      this.cache.delete(key);
    }
  }

  private getEvictionScore([key, entry]: [string, CacheEntry<any>]): number {
    const age = Date.now() - entry.lastAccess;
    const freq = entry.accessCount;
    const priorityScore = entry.priority === 'high' ? 1000 : entry.priority === 'medium' ? 500 : 0;
    return age / (freq + priorityScore + 1);
  }

  private getCurrentCacheSize(): number {
    let total = 0;
    this.cache.forEach(entry => {
      total += entry.size;
    });
    return total;
  }

  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2;
    } catch {
      return 1024;
    }
  }

  private updateAccessPattern(key: string): void {
    this.accessPatterns.push(key);
    if (this.accessPatterns.length > 100) {
      this.accessPatterns.shift();
    }

    const segments = key.split('/');
    const basePattern = segments.slice(0, -1).join('/');

    if (!this.userBehavior.has(basePattern)) {
      this.userBehavior.set(basePattern, []);
    }
    const pattern = this.userBehavior.get(basePattern)!;
    pattern.push(segments[segments.length - 1] || '');
    if (pattern.length > 50) pattern.shift();
  }

  predictNextAccess(basePath: string): string[] {
    const pattern = this.userBehavior.get(basePath) || [];
    const frequency: Map<string, number> = new Map();

    for (let i = 0; i < pattern.length - 1; i++) {
      const current = pattern[i];
      const next = pattern[i + 1];
      frequency.set(next, (frequency.get(next) || 0) + 1);
    }

    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key]) => `${basePath}/${key}`);
  }

  prefetch<T>(request: AIDataRequest<T>): void {
    const { key } = request;
    if (!this.cache.has(key) && !this.pendingRequests.has(key)) {
      this.request({ ...request, prefetch: true }).catch(() => {});
    }
  }

  invalidate(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (regex.test(key)) keysToDelete.push(key);
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      const expiredKeys: string[] = [];

      this.cache.forEach((entry, key) => {
        const age = now - entry.timestamp;
        if (age > this.config.defaultTTL * 3) {
          expiredKeys.push(key);
        }
      });

      expiredKeys.forEach(key => this.cache.delete(key));
    }, this.config.cleanupInterval);
  }

  getStats() {
    return {
      cacheSize: this.getCurrentCacheSize(),
      entryCount: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      patterns: Array.from(this.userBehavior.keys()),
    };
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cache.clear();
    this.pendingRequests.clear();
    this.userBehavior.clear();
  }
}

export const aiScheduler = new AISmartScheduler();

export function useAIScheduler() {
  return {
    request: <T>(req: AIDataRequest<T>) => aiScheduler.request(req),
    prefetch: <T>(req: AIDataRequest<T>) => aiScheduler.prefetch(req),
    invalidate: (pattern: string) => aiScheduler.invalidate(pattern),
    predictNextAccess: (path: string) => aiScheduler.predictNextAccess(path),
    getStats: () => aiScheduler.getStats(),
  };
}