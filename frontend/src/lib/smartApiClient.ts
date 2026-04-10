import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { smartScheduler, getSchedulerStats, type RequestPriority } from './smartScheduler';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface QueuedAxiosRequest {
  config: InternalAxiosRequestConfig;
  priority: RequestPriority;
  resolve: (value: AxiosResponse) => void;
  reject: (error: any) => void;
}

class SmartApiClient {
  private client: AxiosInstance;
  private requestQueue: QueuedAxiosRequest[] = [];
  private isProcessing = false;
  private maxConcurrent = 3;
  private executing = 0;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        if (config.headers['X-Request-Priority']) {
          config.metadata = { startTime: Date.now() };
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => {
        if (response.config.metadata?.startTime) {
          const duration = Date.now() - response.config.metadata.startTime;
          if (duration > 5000) {
            console.warn(`Slow request detected: ${response.config.url} took ${duration}ms`);
          }
        }
        return response;
      },
      (error: AxiosError) => {
        if (error.response) {
          const { status } = error.response;

          switch (status) {
            case 401:
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
              break;
            case 429:
              console.warn('Rate limited, will retry with backoff');
              break;
            case 502:
            case 503:
              console.warn('Server error, may need to retry');
              break;
          }
        } else if (error.request) {
          console.error('Network error - no response received');
        }

        return Promise.reject(error);
      }
    );
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.requestQueue.length > 0 && this.executing < this.maxConcurrent) {
      const priorityOrder: Record<RequestPriority, number> = {
        critical: 0,
        high: 1,
        normal: 2,
        low: 3
      };

      const sortedQueue = [...this.requestQueue].sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return 0;
      });

      const queuedRequest = sortedQueue[0];
      const index = this.requestQueue.indexOf(queuedRequest);
      this.requestQueue.splice(index, 1);
      this.executing++;

      const { config, priority, resolve, reject } = queuedRequest;

      this.executeWithCircuitBreaker(config, priority)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.executing--;
          this.processQueue();
        });
    }

    this.isProcessing = false;
  }

  private async executeWithCircuitBreaker(
    config: InternalAxiosRequestConfig,
    priority: RequestPriority
  ): Promise<AxiosResponse> {
    const endpoint = this.getEndpointKey(config.url || '');

    return new Promise((resolve, reject) => {
      smartScheduler.schedule(
        () => this.client.request(config),
        priority,
        priority === 'critical' ? 3 : 2
      ).then(resolve).catch(reject);
    });
  }

  private getEndpointKey(url: string): string {
    const match = url.match(/\/api\/(\w+)/);
    return match ? match[1] : 'default';
  }

  async request<T = any>(
    config: InternalAxiosRequestConfig & { priority?: RequestPriority }
  ): Promise<T> {
    const priority = config.priority || 'normal';

    if (priority === 'critical' || priority === 'high') {
      return this.client.request<T>(config)
        .then(res => res.data);
    }

    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        config,
        priority,
        resolve: (res) => resolve(res.data as T),
        reject
      });
      this.processQueue();
    });
  }

  get<T = any>(url: string, priority: RequestPriority = 'normal', config?: any): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url, priority });
  }

  post<T = any>(url: string, data?: any, priority: RequestPriority = 'normal', config?: any): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data, priority });
  }

  put<T = any>(url: string, data?: any, priority: RequestPriority = 'normal', config?: any): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data, priority });
  }

  delete<T = any>(url: string, priority: RequestPriority = 'normal', config?: any): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url, priority });
  }

  getStats() {
    return {
      ...getSchedulerStats(),
      queueSize: this.requestQueue.length,
      executing: this.executing
    };
  }
}

export const smartApiClient = new SmartApiClient();
export { getSchedulerStats };
