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
      name: '智能缓存服务',
      status: 'running',
      description: 'AI驱动的智能缓存系统，自动管理会话和消息缓存',
      details: {
        currentSize: stats.cache.size,
        maxSize: stats.cache.maxSize,
        hitRate: stats.cache.hitRate,
        totalHits: stats.cache.hits,
        totalMisses: stats.cache.misses,
        memoryUsage: this.formatBytes(stats.cache.memoryUsage)
      },
      features: [
        '自动LRU淘汰',
        'TTL过期管理',
        '模式匹配失效',
        '命中率统计'
      ]
    };
  },

  getQueryStats() {
    const stats = getAIStats();
    const slowQueries = stats.queries.slowQueries > 0
      ? stats.queries.slowQueries + ' 慢查询'
      : '无慢查询';

    return {
      name: '查询优化服务',
      status: stats.queries.uniqueQueries > 0 ? 'running' : 'idle',
      description: 'AI分析SQL查询模式，自动识别和优化慢查询',
      details: {
        uniqueQueries: stats.queries.uniqueQueries,
        totalExecutions: stats.queries.totalExecutions,
        slowQueries: slowQueries,
        avgTime: stats.queries.avgTime
      },
      features: [
        '查询模式分析',
        '慢查询识别',
        '优化建议',
        '执行统计'
      ]
    };
  },

  getPrefetcherStats() {
    const stats = getAIStats();
    return {
      name: '数据预取服务',
      status: 'running',
      description: 'AI预测用户行为，预取可能需要的数据',
      details: {
        accessHistory: stats.patterns?.length || 0,
        recentPatterns: (stats.patterns || []).slice(0, 3).map(p => ({
          pattern: p.pattern,
          count: p.count
        }))
      },
      features: [
        '访问模式学习',
        '下一步预测',
        '智能预取',
        '模式可视化'
      ]
    };
  },

  getAntiSpamStats() {
    return {
      name: 'AI反垃圾服务',
      status: 'running',
      description: 'AI实时分析消息内容，识别垃圾信息和恶意行为',
      details: {
        messageTracking: 'active',
        ipTracking: 'active',
        cooldownUsers: 'managed',
        cooldownIPs: 'managed'
      },
      config: {
        maxMessagesPerWindow: 10,
        windowMs: 60000,
        repeatThreshold: 3,
        cooldownMs: 5000,
        maxConcurrent: 5
      },
      features: [
        '消息频率检测',
        '内容相似度分析',
        'IP多账户检测',
        '实时冷却机制',
        '置信度评分'
      ]
    };
  },

  getRateLimiterStats() {
    const stats = getRateLimitStats();
    return {
      name: '请求限流服务',
      status: 'running',
      description: '保护后端服务，防止过载和DDoS攻击',
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
        'IP级别限流',
        '全局负载检测',
        '临时IP封禁',
        '自适应限流'
      ]
    };
  },

  getLoadBalancerStats() {
    return {
      name: '负载均衡服务',
      status: 'running',
      description: '多服务器环境下的请求分配和负载管理',
      details: {
        mode: '单服务器模式',
        note: '多服务器部署时可扩展'
      },
      features: [
        '请求计数',
        '最少连接优先',
        '服务器健康检查',
        '自动清理'
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