import { query } from '../utils/db.js';
import { getAIStats } from './AIService.js';
import { antiSpamService } from './antiSpamService.js';
import { getRateLimitStats } from '../middleware/rateLimiter.js';

const ANTI_SPAM_I18N = {
  details: {
    monitoredConversations: '监控中的会话',
    messagesProcessed: '已处理消息',
    threatsBlocked: '已拦截威胁',
    activeUsers: '活跃用户',
    cooldownUsers: '冷却中用户',
    cooldownIPs: '冷却中IP'
  },
  config: {
    maxMessagesPerWindow: '窗口内最大消息数',
    windowMs: '检测窗口(毫秒)',
    repeatThreshold: '重复阈值',
    cooldownMs: '冷却时间(毫秒)',
    maxConcurrent: '最大并发数',
    blockThreshold: '拦截阈值',
    feedbackConfidence: '反馈置信度'
  },
  features: {
    'aiServices.messageFrequencyDetection': '消息频率检测',
    'aiServices.contentSimilarityAnalysis': '内容相似度分析',
    'aiServices.ipMultiAccountDetection': 'IP多账户检测',
    'aiServices.realTimeCooldown': '实时冷却机制',
    'aiServices.confidenceScore': '置信度评分'
  }
};

const RATE_LIMITER_I18N = {
  details: {
    activeRequests: '活跃请求',
    blockedIPs: '已封禁IP',
    globalLoad: '全局负载'
  },
  config: {
    windowMs: '检测窗口(毫秒)',
    maxRequests: '最大请求数',
    maxConcurrent: '最大并发数',
    blockDurationMs: '封禁时长(毫秒)'
  },
  features: {
    'aiServices.ipLevelRateLimit': 'IP级别限流',
    'aiServices.globalLoadDetection': '全局负载检测',
    'aiServices.temporaryIPBlock': '临时IP封禁',
    'aiServices.adaptiveRateLimit': '自适应限流'
  }
};

const CACHE_I18N = {
  details: {
    currentSize: '当前大小',
    maxSize: '最大容量',
    hitRate: '命中率',
    totalHits: '总命中次数',
    totalMisses: '总未命中次数',
    memoryUsage: '内存使用'
  },
  features: {
    'aiServices.autoLRU': '自动LRU淘汰',
    'aiServices.ttlExpiration': 'TTL过期管理',
    'aiServices.patternInvalidation': '模式匹配失效',
    'aiServices.hitRateStats': '命中率统计'
  }
};

const QUERY_I18N = {
  details: {
    uniqueQueries: '独立查询数',
    totalExecutions: '总执行次数',
    slowQueries: '慢查询数',
    avgTime: '平均耗时'
  },
  features: {
    'aiServices.queryPatternAnalysis': '查询模式分析',
    'aiServices.slowQueryDetection': '慢查询识别',
    'aiServices.optimizationSuggestions': '优化建议',
    'aiServices.executionStats': '执行统计'
  }
};

const PREFETCHER_I18N = {
  details: {
    accessHistory: '访问历史',
    recentPatterns: '最近模式'
  },
  features: {
    'aiServices.accessPatternLearning': '访问模式学习',
    'aiServices.nextStepPrediction': '下一步预测',
    'aiServices.smartPrefetch': '智能预取',
    'aiServices.patternVisualization': '模式可视化'
  }
};

const LOAD_BALANCER_I18N = {
  details: {
    mode: '运行模式',
    note: '扩展说明'
  },
  features: {
    'aiServices.requestCounting': '请求计数',
    'aiServices.leastConnectionFirst': '最少连接优先',
    'aiServices.serverHealthCheck': '服务器健康检查',
    'aiServices.autoCleanup': '自动清理'
  }
};

const I18N_MAP = {
  intelligentCache: CACHE_I18N,
  queryOptimizer: QUERY_I18N,
  dataPrefetcher: PREFETCHER_I18N,
  antiSpam: ANTI_SPAM_I18N,
  rateLimiter: RATE_LIMITER_I18N,
  loadBalancer: LOAD_BALANCER_I18N
};

function translateDetails(serviceKey, details) {
  const i18n = I18N_MAP[serviceKey];
  if (!i18n || !i18n.details) return details;

  const translated = {};
  for (const [key, value] of Object.entries(details)) {
    const cnKey = i18n.details[key] || key;
    if (key === 'recentPatterns' && Array.isArray(value)) {
      translated[cnKey] = value.map(p => `${p.pattern}: ${p.count}次`).join(', ') || '无';
    } else if (key === 'hitRate') {
      translated[cnKey] = `${value}%`;
    } else {
      translated[cnKey] = value;
    }
  }
  return translated;
}

function translateConfig(serviceKey, config) {
  const i18n = I18N_MAP[serviceKey];
  if (!i18n || !i18n.config) return config;

  const translated = {};
  for (const [key, value] of Object.entries(config)) {
    translated[i18n.config[key] || key] = value;
  }
  return translated;
}

function translateFeatures(serviceKey, features) {
  const i18n = I18N_MAP[serviceKey];
  if (!i18n || !i18n.features) return features;

  return features.map(f => i18n.features[f] || f);
}

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
    const details = {
      currentSize: stats.cache.size,
      maxSize: stats.cache.maxSize,
      hitRate: stats.cache.hitRate,
      totalHits: stats.cache.hits,
      totalMisses: stats.cache.misses,
      memoryUsage: this.formatBytes(stats.cache.memoryUsage)
    };

    return {
      nameKey: 'aiServices.intelligentCache',
      nameCn: '智能缓存服务',
      status: 'running',
      descKey: 'aiServices.intelligentCacheDesc',
      descCn: 'AI驱动的智能缓存系统，自动管理会话和消息缓存',
      details: translateDetails('intelligentCache', details),
      features: translateFeatures('intelligentCache', [
        'aiServices.autoLRU',
        'aiServices.ttlExpiration',
        'aiServices.patternInvalidation',
        'aiServices.hitRateStats'
      ])
    };
  },

  getQueryStats() {
    const stats = getAIStats();
    const slowQueries = stats.queries.slowQueries > 0 ? stats.queries.slowQueries : 0;

    const details = {
      uniqueQueries: stats.queries.uniqueQueries,
      totalExecutions: stats.queries.totalExecutions,
      slowQueries: slowQueries,
      avgTime: stats.queries.avgTime + 'ms'
    };

    return {
      nameKey: 'aiServices.queryOptimizer',
      nameCn: '查询优化服务',
      status: stats.queries.uniqueQueries > 0 ? 'running' : 'idle',
      descKey: 'aiServices.queryOptimizerDesc',
      descCn: 'AI分析SQL查询模式，自动识别和优化慢查询',
      details: translateDetails('queryOptimizer', details),
      features: translateFeatures('queryOptimizer', [
        'aiServices.queryPatternAnalysis',
        'aiServices.slowQueryDetection',
        'aiServices.optimizationSuggestions',
        'aiServices.executionStats'
      ])
    };
  },

  getPrefetcherStats() {
    const stats = getAIStats();

    const details = {
      accessHistory: stats.patterns?.length || 0,
      recentPatterns: (stats.patterns || []).slice(0, 3).map(p => ({
        pattern: p.pattern,
        count: p.count
      }))
    };

    return {
      nameKey: 'aiServices.dataPrefetcher',
      nameCn: '数据预取服务',
      status: 'running',
      descKey: 'aiServices.dataPrefetcherDesc',
      descCn: 'AI预测用户行为，预取可能需要的数据',
      details: translateDetails('dataPrefetcher', details),
      features: translateFeatures('dataPrefetcher', [
        'aiServices.accessPatternLearning',
        'aiServices.nextStepPrediction',
        'aiServices.smartPrefetch',
        'aiServices.patternVisualization'
      ])
    };
  },

  getAntiSpamStats() {
    const realStats = antiSpamService.getServiceStats();

    const details = {
      monitoredConversations: realStats.monitoredConversations,
      messagesProcessed: realStats.messagesProcessed,
      threatsBlocked: realStats.threatsBlocked,
      activeUsers: realStats.activeUsers,
      cooldownUsers: realStats.cooldownUsers,
      cooldownIPs: realStats.cooldownIPs
    };

    const config = {
      maxMessagesPerWindow: 5,
      windowMs: 5000,
      repeatThreshold: 2,
      cooldownMs: 3000,
      maxConcurrent: 3,
      blockThreshold: 50,
      feedbackConfidence: 65
    };

    return {
      nameKey: 'aiServices.antiSpam',
      nameCn: 'AI反垃圾服务',
      status: 'running',
      descKey: 'aiServices.antiSpamDesc',
      descCn: 'AI实时分析消息内容，识别垃圾信息和恶意行为',
      details: translateDetails('antiSpam', details),
      config: translateConfig('antiSpam', config),
      features: translateFeatures('antiSpam', [
        'aiServices.messageFrequencyDetection',
        'aiServices.contentSimilarityAnalysis',
        'aiServices.ipMultiAccountDetection',
        'aiServices.realTimeCooldown',
        'aiServices.confidenceScore'
      ])
    };
  },

  getRateLimiterStats() {
    const stats = getRateLimitStats();

    const details = {
      activeRequests: stats.activeRequests,
      blockedIPs: stats.blocked,
      globalLoad: stats.globalLoad
    };

    const config = {
      windowMs: 60000,
      maxRequests: 100,
      maxConcurrent: 30,
      blockDurationMs: 30000
    };

    return {
      nameKey: 'aiServices.rateLimiter',
      nameCn: '请求限流服务',
      status: 'running',
      descKey: 'aiServices.rateLimiterDesc',
      descCn: '保护后端服务，防止过载和DDoS攻击',
      details: translateDetails('rateLimiter', details),
      config: translateConfig('rateLimiter', config),
      features: translateFeatures('rateLimiter', [
        'aiServices.ipLevelRateLimit',
        'aiServices.globalLoadDetection',
        'aiServices.temporaryIPBlock',
        'aiServices.adaptiveRateLimit'
      ])
    };
  },

  getLoadBalancerStats() {
    const details = {
      mode: '单机模式',
      note: '可扩展为多服务器'
    };

    return {
      nameKey: 'aiServices.loadBalancer',
      nameCn: '负载均衡服务',
      status: 'running',
      descKey: 'aiServices.loadBalancerDesc',
      descCn: '多服务器环境下的请求分配和负载管理',
      details: translateDetails('loadBalancer', details),
      features: translateFeatures('loadBalancer', [
        'aiServices.requestCounting',
        'aiServices.leastConnectionFirst',
        'aiServices.serverHealthCheck',
        'aiServices.autoCleanup'
      ])
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