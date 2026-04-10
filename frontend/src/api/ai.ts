import apiClient from './client';

export interface AIServiceStats {
  name: string;
  status: string;
  description: string;
  details: Record<string, any>;
  features?: string[];
  config?: Record<string, any>;
}

export interface AIStatsResponse {
  timestamp: string;
  uptime: number;
  memory: {
    rss: string;
    heapTotal: string;
    heapUsed: string;
    external: string;
  };
  services: {
    intelligentCache: AIServiceStats;
    queryOptimizer: AIServiceStats;
    dataPrefetcher: AIServiceStats;
    antiSpam: AIServiceStats;
    rateLimiter: AIServiceStats;
    loadBalancer: AIServiceStats;
  };
}

export const aiApi = {
  getStats(): Promise<{ data: AIStatsResponse }> {
    return apiClient.get('/ai/stats');
  },

  getCacheStats(): Promise<{ data: AIServiceStats }> {
    return apiClient.get('/ai/stats/cache');
  },

  getAntiSpamStats(): Promise<{ data: AIServiceStats }> {
    return apiClient.get('/ai/stats/anti-spam');
  },

  getRateLimitStats(): Promise<{ data: AIServiceStats }> {
    return apiClient.get('/ai/stats/rate-limit');
  }
};

export default aiApi;