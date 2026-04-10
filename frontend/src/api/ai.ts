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

export interface AIFeedback {
  id: number;
  type: 'spam' | 'malicious' | 'suspicious' | 'flood' | 'repeat' | 'sensitive';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id: number;
  target_type: 'message' | 'user' | 'conversation' | 'moments';
  target_id: number;
  content: string;
  content_full: string;
  metadata: any;
  ai_confidence: number;
  ai_analysis: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  handled_by: number;
  handled_at: string;
  handle_result: string;
  created_at: string;
  updated_at: string;
  username?: string;
  nickname?: string;
  avatar?: string;
}

export interface AIFeedbackListResponse {
  list: AIFeedback[];
  total: number;
  page: number;
  limit: number;
}

export interface AIServiceStatus {
  id: number;
  service_name: string;
  instance_id: string;
  status: 'running' | 'idle' | 'error' | 'maintenance';
  current_task: string;
  task_progress: number;
  task_detail: any;
  metrics: any;
  last_heartbeat: string;
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
  },

  getServiceStatus(): Promise<{ data: AIServiceStatus[] }> {
    return apiClient.get('/ai/service-status');
  },

  getAIServiceStats(): Promise<{ data: any }> {
    return apiClient.get('/ai/service-stats');
  },

  getFeedbackList(params: {
    status?: string;
    type?: string;
    severity?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: AIFeedbackListResponse }> {
    return apiClient.get('/ai/feedback', { params });
  },

  getFeedbackDetail(id: number): Promise<{ data: AIFeedback }> {
    return apiClient.get(`/ai/feedback/${id}`);
  },

  handleFeedback(id: number, action: 'approve' | 'reject', handleResult?: string): Promise<{ data: any }> {
    return apiClient.post(`/ai/feedback/${id}/handle`, { action, handleResult });
  },

  getActivityLog(params?: {
    service?: string;
    action?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any }> {
    return apiClient.get('/ai/activity-log', { params });
  },

  getBlacklist(params?: {
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any }> {
    return apiClient.get('/ai/blacklist', { params });
  },

  addToBlacklist(data: {
    type: 'user' | 'ip' | 'device' | 'content';
    value: string;
    reason?: string;
    severity?: 'warning' | 'mute' | 'block' | 'ban';
    expiresAt?: string;
  }): Promise<{ data: any }> {
    return apiClient.post('/ai/blacklist', data);
  },

  removeFromBlacklist(id: number): Promise<{ data: any }> {
    return apiClient.delete(`/ai/blacklist/${id}`);
  }
};

export default aiApi;