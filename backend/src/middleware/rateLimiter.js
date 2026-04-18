class AdvancedRateLimiter {
  constructor(config = {}) {
    this.config = {
      windowMs: config.windowMs || 60000,
      maxRequests: config.maxRequests || 100,
      maxConcurrent: config.maxConcurrent || 30,
      blockDurationMs: config.blockDurationMs || 30000
    };

    this.requests = new Map();
    this.globalRequestCount = 0;
    this.lastGlobalReset = Date.now();
    this.skipPaths = ['/api/rate-limit/unblock'];

    this.startCleanup();
  }

  unblockUser(identifier) {
    const entry = this.requests.get(identifier);
    if (entry) {
      entry.blocked = false;
      entry.blockedUntil = 0;
      entry.count = 0;
      console.log(`[RateLimit] Unblocked user: ${identifier}`);
      return true;
    }
    return false;
  }

  unblockByIp(ip) {
    return this.unblockUser(ip);
  }

  isSkipPath(path) {
    return this.skipPaths.some(skipPath => path.includes(skipPath));
  }

  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.requests.entries()) {
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

  isAllowed(identifier) {
    const now = Date.now();

    if (this.globalRequestCount > this.config.maxConcurrent * 3) {
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
    if (now - this.lastGlobalReset >= this.config.windowMs) {
      this.globalRequestCount = 0;
      this.lastGlobalReset = now;
    }

    return { allowed: true };
  }

  getStats() {
    const now = Date.now();
    let activeRequests = 0;
    let blocked = 0;

    for (const entry of this.requests.values()) {
      if (entry.count > 0 && entry.resetTime > now) {
        activeRequests++;
      }
      if (entry.blocked && entry.blockedUntil > now) {
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
  maxRequests: 500,
  maxConcurrent: 200,
  blockDurationMs: 10000
});

export function rateLimitMiddleware(req, res, next) {
  const identifier = req.ip || req.socket.remoteAddress || 'unknown';

  if (rateLimiter.isSkipPath(req.path)) {
    return next();
  }

  const result = rateLimiter.isAllowed(identifier);

  res.setHeader('X-RateLimit-Remaining', '100');
  res.setHeader('X-RateLimit-Reset', new Date(Date.now() + 60000).toISOString());

  if (!result.allowed) {
    const retryAfterSeconds = Math.ceil((result.retryAfter || 30));
    res.setHeader('Retry-After', String(retryAfterSeconds));
    res.setHeader('X-RateLimit-Retry-After', String(retryAfterSeconds));

    console.log(`[RateLimit] Blocking ${identifier} for ${retryAfterSeconds}s - ${result.reason}`);

    res.status(429).json({
      code: 429,
      data: { retryAfter: retryAfterSeconds },
      msg: result.reason || 'Too many requests, please try again later'
    });
    return;
  }

  next();
}

export function globalRateLimitMiddleware(req, res, next) {
  const stats = rateLimiter.getStats();

  res.setHeader('X-Global-Load', String(stats.globalLoad));
  res.setHeader('X-Active-Requests', String(stats.activeRequests));

  if (stats.globalLoad > 1000) {
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

export function unblockByIp(ip) {
  return rateLimiter.unblockByIp(ip);
}

export function unblockUser(identifier) {
  return rateLimiter.unblockUser(identifier);
}

export default rateLimiter;