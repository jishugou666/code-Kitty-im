import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockedUntil: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  maxConcurrent: number;
  blockDurationMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60000,
  maxRequests: 100,
  maxConcurrent: 20,
  blockDurationMs: 30000
};

class AdvancedRateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;
  private globalRequestCount = 0;
  private lastGlobalReset = Date.now();

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanup();
  }

  private startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.entries()) {
        if (entry.resetTime < now && !entry.blocked) {
          this.requests.delete(key);
        }
        if (entry.blocked && entry.blockedUntil < now) {
          entry.blocked = false;
          entry.count = 0;
        }
      }
    }, 10000);
  }

  private entries(): Map<string, RateLimitEntry> {
    return this.requests;
  }

  isAllowed(identifier: string): { allowed: boolean; retryAfter?: number; reason?: string } {
    const now = Date.now();

    if (this.globalRequestCount > this.config.maxConcurrent * 2) {
      return {
        allowed: false,
        retryAfter: Math.ceil((this.config.windowMs - (now - this.lastGlobalReset)) / 1000),
        reason: 'Server is experiencing high load'
      };
    }

    let entry = this.requests.get(identifier);

    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
        blocked: false,
        blockedUntil: 0
      };
      this.requests.set(identifier, entry);
    }

    if (entry.blocked && entry.blockedUntil > now) {
      return {
        allowed: false,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
        reason: 'Rate limit exceeded'
      };
    }

    entry.count++;

    if (entry.count > this.config.maxRequests) {
      entry.blocked = true;
      entry.blockedUntil = now + this.config.blockDurationMs;
      return {
        allowed: false,
        retryAfter: Math.ceil(this.config.blockDurationMs / 1000),
        reason: 'Rate limit exceeded, blocked temporarily'
      };
    }

    this.globalRequestCount++;
    if (now - this.lastGlobalReset > this.config.windowMs) {
      this.globalRequestCount = 1;
      this.lastGlobalReset = now;
    }

    return { allowed: true };
  }

  getStats() {
    const now = Date.now();
    let activeRequests = 0;
    let blocked = 0;

    for (const entry of this.entries()) {
      if (entry[1].count > 0 && entry[1].resetTime > now) {
        activeRequests++;
      }
      if (entry[1].blocked && entry[1].blockedUntil > now) {
        blocked++;
      }
    }

    return {
      activeRequests,
      blocked,
      globalLoad: this.globalRequestCount
    };
  }
}

const rateLimiter = new AdvancedRateLimiter({
  windowMs: 60000,
  maxRequests: 100,
  maxConcurrent: 30,
  blockDurationMs: 30000
});

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const identifier = req.ip || req.socket.remoteAddress || 'unknown';

  const result = rateLimiter.isAllowed(identifier);

  res.setHeader('X-RateLimit-Remaining', '100');
  res.setHeader('X-RateLimit-Reset', new Date(Date.now() + 60000).toISOString());

  if (!result.allowed) {
    res.setHeader('Retry-After', String(result.retryAfter || 30));
    res.setHeader('X-RateLimit-Retry-After', String(result.retryAfter || 30));

    console.log(`[RateLimit] Blocking ${identifier} for ${result.retryAfter}s - ${result.reason}`);

    res.status(429).json({
      code: 429,
      data: null,
      msg: result.reason || 'Too many requests, please try again later'
    });
    return;
  }

  next();
}

export function globalRateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const stats = rateLimiter.getStats();

  res.setHeader('X-Global-Load', String(stats.globalLoad));
  res.setHeader('X-Active-Requests', String(stats.activeRequests));

  if (stats.globalLoad > 100) {
    console.warn(`[GlobalRateLimit] High load detected: ${stats.globalLoad}`);

    if (req.method === 'GET' && !req.path.includes('/message/list')) {
      res.status(503).json({
        code: 503,
        data: { load: stats.globalLoad },
        msg: 'Server is busy, please try again'
      });
      return;
    }
  }

  next();
}

export function getRateLimitStats() {
  return rateLimiter.getStats();
}

export default rateLimiter;
