class SlidingWindowRateLimiter {
  constructor(config = {}) {
    this.config = {
      windowMs: config.windowMs || 60000,
      maxRequests: config.maxRequests || 100,
      maxConcurrent: config.maxConcurrent || 30,
      blockDurationMs: config.blockDurationMs || 30000,
      precisionMs: config.precisionMs || 1000
    };

    this.requestLog = new Map();
    this.globalRequestTimestamps = [];
    this.maxGlobalEntries = 10000;
    this.skipPaths = ['/api/rate-limit/unblock'];

    this.startCleanup();
  }

  cleanOldEntries(entry, now) {
    const windowStart = now - this.config.windowMs;
    while (entry.timestamps.length > 0 && entry.timestamps[0] < windowStart) {
      entry.timestamps.shift();
    }
    return entry;
  }

  cleanGlobalEntries(now) {
    const windowStart = now - this.config.windowMs;
    while (this.globalRequestTimestamps.length > 0 && this.globalRequestTimestamps[0] < windowStart) {
      this.globalRequestTimestamps.shift();
    }
    while (this.globalRequestTimestamps.length > this.maxGlobalEntries) {
      this.globalRequestTimestamps.shift();
    }
  }

  unblockUser(identifier) {
    const entry = this.requestLog.get(identifier);
    if (entry) {
      entry.blocked = false;
      entry.blockedUntil = 0;
      entry.timestamps = [];
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
      for (const [key, entry] of this.requestLog.entries()) {
        if (entry.blocked && entry.blockedUntil < now) {
          entry.blocked = false;
          entry.timestamps = [];
        }
        if (!entry.blocked && entry.timestamps.length === 0) {
          this.requestLog.delete(key);
        }
      }
      this.cleanGlobalEntries(now);
    }, this.config.precisionMs);
  }

  isAllowed(identifier) {
    const now = Date.now();
    this.cleanGlobalEntries(now);

    if (this.globalRequestTimestamps.length > this.config.maxConcurrent * 3) {
      const oldestGlobal = this.globalRequestTimestamps[0];
      const retryAfter = Math.ceil((this.config.windowMs - (now - oldestGlobal)) / 1000);
      return {
        allowed: false,
        retryAfter: Math.max(1, retryAfter),
        reason: 'Server is experiencing high load'
      };
    }

    let entry = this.requestLog.get(identifier);
    if (!entry) {
      entry = {
        timestamps: [],
        blocked: false,
        blockedUntil: 0
      };
      this.requestLog.set(identifier, entry);
    }

    entry = this.cleanOldEntries(entry, now);

    if (entry.blocked && entry.blockedUntil > now) {
      return {
        allowed: false,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
        reason: 'Rate limit exceeded'
      };
    }

    entry.timestamps.push(now);
    this.globalRequestTimestamps.push(now);

    const windowStart = now - this.config.windowMs;
    const requestCount = entry.timestamps.filter(ts => ts >= windowStart).length;

    if (requestCount > this.config.maxRequests) {
      entry.blocked = true;
      entry.blockedUntil = now + this.config.blockDurationMs;
      return {
        allowed: false,
        retryAfter: Math.ceil(this.config.blockDurationMs / 1000),
        reason: 'Rate limit exceeded, blocked temporarily'
      };
    }

    return { 
      allowed: true, 
      remaining: Math.max(0, this.config.maxRequests - requestCount),
      resetIn: Math.ceil((entry.timestamps[0] + this.config.windowMs - now) / 1000)
    };
  }

  getStats() {
    const now = Date.now();
    this.cleanGlobalEntries(now);
    
    let activeUsers = 0;
    let blocked = 0;
    const windowStart = now - this.config.windowMs;

    for (const entry of this.requestLog.values()) {
      const validTimestamps = entry.timestamps.filter(ts => ts >= windowStart);
      if (validTimestamps.length > 0) {
        activeUsers++;
      }
      if (entry.blocked && entry.blockedUntil > now) {
        blocked++;
      }
    }

    return {
      activeUsers,
      blocked,
      globalLoad: this.globalRequestTimestamps.length,
      windowMs: this.config.windowMs,
      maxRequests: this.config.maxRequests
    };
  }
}

const rateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60000,
  maxRequests: 500,
  maxConcurrent: 200,
  blockDurationMs: 10000,
  precisionMs: 1000
});

export function rateLimitMiddleware(req, res, next) {
  const identifier = req.ip || req.socket.remoteAddress || 'unknown';

  if (rateLimiter.isSkipPath(req.path)) {
    return next();
  }

  const result = rateLimiter.isAllowed(identifier);

  res.setHeader('X-RateLimit-Remaining', String(result.remaining || 0));
  res.setHeader('X-RateLimit-Reset', String(result.resetIn || 60));

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
  res.setHeader('X-Active-Requests', String(stats.activeUsers));

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