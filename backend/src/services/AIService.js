class IntelligentCache {
  constructor(maxSize = 1000, defaultTTL = 300000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.hits = 0;
    this.misses = 0;
  }

  generateKey(prefix, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => ({ ...acc, [key]: params[key] }), {});
    return `${prefix}:${JSON.stringify(sortedParams)}`;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    entry.hits++;
    entry.lastAccess = Date.now();
    this.hits++;
    return entry.data;
  }

  set(key, data, ttl = this.defaultTTL) {
    if (this.cache.size >= this.maxSize) {
      this.evict();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      lastAccess: Date.now(),
      hits: 0,
      ttl,
      size: JSON.stringify(data).length,
    });
  }

  evict() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      const score = entry.lastAccess - entry.hits * 1000;
      if (score < oldestTime) {
        oldestTime = score;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  invalidate(pattern) {
    const regex = new RegExp(pattern);
    const keysToDelete = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(2) + '%' : '0%',
      memoryUsage: Array.from(this.cache.values()).reduce((sum, e) => sum + e.size, 0),
    };
  }

  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

class LoadBalancer {
  constructor() {
    this.requestCount = new Map();
    this.lastCleanup = Date.now();
  }

  selectServer(servers) {
    if (servers.length === 0) return null;
    if (servers.length === 1) return servers[0];

    servers.forEach(s => {
      if (!this.requestCount.has(s)) {
        this.requestCount.set(s, 0);
      }
    });

    let minCount = Infinity;
    let selected = servers[0];

    for (const [server, count] of this.requestCount.entries()) {
      if (count < minCount) {
        minCount = count;
        selected = server;
      }
    }

    this.requestCount.set(selected, minCount + 1);

    if (Date.now() - this.lastCleanup > 60000) {
      this.cleanup(servers);
      this.lastCleanup = Date.now();
    }

    return selected;
  }

  cleanup(activeServers) {
    for (const [server] of this.requestCount.entries()) {
      if (!activeServers.includes(server)) {
        this.requestCount.delete(server);
      }
    }
  }

  getStats() {
    return Object.fromEntries(this.requestCount);
  }
}

class QueryOptimizer {
  constructor() {
    this.queryPatterns = new Map();
    this.slowQueryThreshold = 1000;
  }

  analyzeQuery(query, executionTime) {
    const normalized = this.normalizeQuery(query);
    const existing = this.queryPatterns.get(normalized);

    if (existing) {
      existing.count++;
      existing.totalTime += executionTime;
      existing.avgTime = existing.totalTime / existing.count;
      if (executionTime > this.slowQueryThreshold) {
        existing.slowCount++;
      }
    } else {
      this.queryPatterns.set(normalized, {
        query,
        count: 1,
        totalTime: executionTime,
        avgTime: executionTime,
        slowCount: executionTime > this.slowQueryThreshold ? 1 : 0,
      });
    }
  }

  normalizeQuery(query) {
    return query
      .replace(/SELECT\s+/gi, 'SELECT ')
      .replace(/FROM\s+/gi, 'FROM ')
      .replace(/WHERE\s+/gi, 'WHERE ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  getSlowQueries(limit = 10) {
    return Array.from(this.queryPatterns.values())
      .filter(q => q.slowCount > 0)
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, limit);
  }

  suggestOptimizations() {
    const suggestions = [];

    for (const [pattern, stats] of this.queryPatterns.entries()) {
      if (stats.avgTime > 500) {
        suggestions.push({
          query: stats.query.substring(0, 100) + '...',
          avgTime: stats.avgTime.toFixed(2) + 'ms',
          count: stats.count,
          suggestion: 'Consider adding index or caching this query result',
        });
      }
    }

    return suggestions.sort((a, b) => parseFloat(b.avgTime) - parseFloat(a.avgTime));
  }

  getStats() {
    const allStats = Array.from(this.queryPatterns.values());
    return {
      uniqueQueries: allStats.length,
      totalExecutions: allStats.reduce((sum, q) => sum + q.count, 0),
      slowQueries: allStats.filter(q => q.slowCount > 0).length,
      avgTime: allStats.length > 0
        ? (allStats.reduce((sum, q) => sum + q.avgTime, 0) / allStats.length).toFixed(2) + 'ms'
        : '0ms',
    };
  }
}

class DataPrefetcher {
  constructor() {
    this.accessHistory = [];
    this.maxHistory = 100;
  }

  recordAccess(accessPath) {
    this.accessHistory.push({
      path: accessPath,
      timestamp: Date.now(),
    });

    if (this.accessHistory.length > this.maxHistory) {
      this.accessHistory.shift();
    }
  }

  predictNextAccess(currentPath) {
    if (this.accessHistory.length < 3) {
      return [];
    }

    const recentPaths = this.accessHistory.slice(-10).map(h => h.path);
    const frequency = {};

    for (let i = 0; i < recentPaths.length - 1; i++) {
      const current = recentPaths[i];
      const next = recentPaths[i + 1];

      if (!frequency[current]) frequency[current] = {};
      frequency[current][next] = (frequency[current][next] || 0) + 1;
    }

    const predictions = frequency[currentPath] || {};
    return Object.entries(predictions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([path, count]) => ({ path, confidence: count / recentPaths.length }));
  }

  getCommonPatterns() {
    const patterns = {};

    for (let i = 0; i < this.accessHistory.length - 1; i++) {
      const current = this.accessHistory[i].path;
      const next = this.accessHistory[i + 1].path;
      const key = `${current} -> ${next}`;

      patterns[key] = (patterns[key] || 0) + 1;
    }

    return Object.entries(patterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pattern, count]) => ({ pattern, count }));
  }
}

export const intelligentCache = new IntelligentCache();
export const loadBalancer = new LoadBalancer();
export const queryOptimizer = new QueryOptimizer();
export const dataPrefetcher = new DataPrefetcher();

export function getAIStats() {
  return {
    cache: intelligentCache.getStats(),
    queries: queryOptimizer.getStats(),
    patterns: dataPrefetcher.getCommonPatterns(),
  };
}