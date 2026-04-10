import { query } from '../utils/db.js';
import { getAIStats } from './AIService.js';
import { antiSpamService } from './antiSpamService.js';
import { getRateLimitStats } from '../middleware/rateLimiter.js';

export const AIServiceManager = {
  getAllStats() {
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        intelligentCache: this.getCacheStats(),
        queryOptimizer: this.getQueryStats(),
        dataPrefetcher: this.getPrefetcherStats(),
        antiSpam: this.getAntiSpamStats(),
        rateLimiter: this.getRateLimiterStats(),
        loadBalancer: this.getLoadBalancerStats()
      }
    };
  },

  getCacheStats() {
    const stats = getAIStats();
    return {
      nameKey: 'aiServices.intelligentCache',
      status: 'running',
      descKey: 'aiServices.intelligentCacheDesc',
      details: {
        currentSize: stats.cache.size,
        maxSize: stats.cache.maxSize,
        hitRate: stats.cache.hitRate,
        totalHits: stats.cache.hits,
        totalMisses: stats.cache.misses,
        memoryUsage: this.formatBytes(stats.cache.memoryUsage)
      },
      features: [
        'aiServices.autoLRU',
        'aiServices.ttlExpiration',
        'aiServices.patternInvalidation',
        'aiServices.hitRateStats'
      ]
    };
  },

  getQueryStats() {
    const stats = getAIStats();
    const slowQueries = stats.queries.slowQueries > 0
      ? stats.queries.slowQueries
      : 0;

    return {
      nameKey: 'aiServices.queryOptimizer',
      status: stats.queries.uniqueQueries > 0 ? 'running' : 'idle',
      descKey: 'aiServices.queryOptimizerDesc',
      details: {
        uniqueQueries: stats.queries.uniqueQueries,
        totalExecutions: stats.queries.totalExecutions,
        slowQueries: slowQueries,
        avgTime: stats.queries.avgTime + 'ms'
      },
      features: [
        'aiServices.queryPatternAnalysis',
        'aiServices.slowQueryDetection',
        'aiServices.optimizationSuggestions',
        'aiServices.executionStats'
      ]
    };
  },

  getPrefetcherStats() {
    const stats = getAIStats();
    return {
      nameKey: 'aiServices.dataPrefetcher',
      status: 'running',
      descKey: 'aiServices.dataPrefetcherDesc',
      details: {
        accessHistory: stats.patterns?.length || 0,
        recentPatterns: (stats.patterns || []).slice(0, 3).map(p => ({
          pattern: p.pattern,
          count: p.count
        }))
      },
      features: [
        'aiServices.accessPatternLearning',
        'aiServices.nextStepPrediction',
        'aiServices.smartPrefetch',
        'aiServices.patternVisualization'
      ]
    };
  },

  getAntiSpamStats() {
    return {
      nameKey: 'aiServices.antiSpam',
      status: 'running',
      descKey: 'aiServices.antiSpamDesc',
      details: {
        messageTracking: 'Active',
        ipTracking: 'Active',
        cooldownUsers: 'Managed',
        cooldownIPs: 'Managed'
      },
      config: {
        maxMessagesPerWindow: 10,
        windowMs: 60000,
        repeatThreshold: 3,
        cooldownMs: 5000,
        maxConcurrent: 5
      },
      features: [
        'aiServices.messageFrequencyDetection',
        'aiServices.contentSimilarityAnalysis',
        'aiServices.ipMultiAccountDetection',
        'aiServices.realTimeCooldown',
        'aiServices.confidenceScore'
      ]
    };
  },

  getRateLimiterStats() {
    const stats = getRateLimitStats();
    return {
      nameKey: 'aiServices.rateLimiter',
      status: 'running',
      descKey: 'aiServices.rateLimiterDesc',
      details: {
        activeRequests: stats.activeRequests,
        blockedIPs: stats.blocked,
        globalLoad: stats.globalLoad
      },
      config: {
        windowMs: 60000,
        maxRequests: 100,
        maxConcurrent: 30,
        blockDurationMs: 30000
      },
      features: [
        'aiServices.ipLevelRateLimit',
        'aiServices.globalLoadDetection',
        'aiServices.temporaryIPBlock',
        'aiServices.adaptiveRateLimit'
      ]
    };
  },

  getLoadBalancerStats() {
    return {
      nameKey: 'aiServices.loadBalancer',
      status: 'running',
      descKey: 'aiServices.loadBalancerDesc',
      details: {
        mode: 'aiServices.singleServerMode',
        note: 'aiServices.multiServerExpandable'
      },
      features: [
        'aiServices.requestCounting',
        'aiServices.leastConnectionFirst',
        'aiServices.serverHealthCheck',
        'aiServices.autoCleanup'
      ]
    };
  },

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};

export default AIServiceManager;