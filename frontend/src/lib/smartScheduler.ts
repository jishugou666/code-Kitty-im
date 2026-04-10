type RequestPriority = 'critical' | 'high' | 'normal' | 'low';
type RequestStatus = 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';

interface QueuedRequest<T = any> {
  id: string;
  request: () => Promise<T>;
  priority: RequestPriority;
  status: RequestStatus;
  retries: number;
  maxRetries: number;
  createdAt: number;
  executeAt: number;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

interface SchedulerConfig {
  maxConcurrent: number;
  maxQueueSize: number;
  baseDelay: number;
  maxDelay: number;
  circuitBreakerThreshold: number;
  circuitBreakerResetTime: number;
}

const DEFAULT_CONFIG: SchedulerConfig = {
  maxConcurrent: 3,
  maxQueueSize: 50,
  baseDelay: 1000,
  maxDelay: 30000,
  circuitBreakerThreshold: 5,
  circuitBreakerResetTime: 60000
};

class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private readonly threshold: number;
  private readonly resetTime: number;

  constructor(threshold: number = 5, resetTime: number = 60000) {
    this.threshold = threshold;
    this.resetTime = resetTime;
  }

  canExecute(): boolean {
    if (this.state === 'closed') {
      return true;
    }

    if (this.state === 'open') {
      if (Date.now() - this.lastFailure >= this.resetTime) {
        this.state = 'half-open';
        return true;
      }
      return false;
    }

    return true;
  }

  recordSuccess(): void {
    if (this.state === 'half-open') {
      this.state = 'closed';
      this.failures = 0;
    }
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  getState(): CircuitBreakerState {
    return {
      failures: this.failures,
      lastFailure: this.lastFailure,
      state: this.state
    };
  }
}

class AdaptiveRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;

  constructor(maxTokens: number = 10, refillRate: number = 5) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  async acquire(tokens: number = 1): Promise<boolean> {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = Math.floor((elapsed / 1000) * this.refillRate);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  getTokens(): number {
    this.refill();
    return this.tokens;
  }
}

export class SmartScheduler {
  private queue: QueuedRequest[] = [];
  private executing = 0;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private rateLimiters: Map<string, AdaptiveRateLimiter> = new Map();
  private config: SchedulerConfig;
  private isProcessing = false;
  private requestHistory: { timestamp: number; endpoint: string }[] = [];
  private readonly historyWindow = 60000;

  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getEndpointKey(endpoint: string): string {
    const match = endpoint.match(/\/api\/(\w+)/);
    return match ? match[1] : 'default';
  }

  private calculateBackoffDelay(retries: number, baseDelay: number, maxDelay: number): number {
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, retries), maxDelay);
    const jitter = Math.random() * 0.3 * exponentialDelay;
    return Math.floor(exponentialDelay + jitter);
  }

  private async executeRequest<T>(queuedRequest: QueuedRequest): Promise<T> {
    const endpoint = this.getEndpointKey('');
    const circuitBreaker = this.getCircuitBreaker(endpoint);
    const rateLimiter = this.getRateLimiter(endpoint);

    if (!circuitBreaker.canExecute()) {
      throw new Error('Circuit breaker is open');
    }

    const canProceed = await rateLimiter.acquire();
    if (!canProceed) {
      throw new Error('Rate limit exceeded');
    }

    try {
      queuedRequest.status = 'executing';
      const result = await queuedRequest.request();
      circuitBreaker.recordSuccess();
      queuedRequest.status = 'completed';
      return result;
    } catch (error) {
      circuitBreaker.recordFailure();
      queuedRequest.status = 'failed';
      throw error;
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0 && this.executing < this.config.maxConcurrent) {
      const now = Date.now();

      const readyIndex = this.queue.findIndex(
        req => req.status === 'pending' && req.executeAt <= now
      );

      if (readyIndex === -1) {
        const nextRequest = this.queue
          .filter(req => req.status === 'pending')
          .sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return a.createdAt - b.createdAt;
          })[0];

        if (!nextRequest) break;

        const waitTime = nextRequest.executeAt - now;
        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 100)));
          continue;
        }
      }

      const index = readyIndex !== -1 ? readyIndex :
        this.queue.findIndex(req => req.status === 'pending');

      if (index === -1) break;

      const request = this.queue[index];
      this.queue.splice(index, 1);
      this.executing++;

      this.executeRequest(request)
        .then(result => {
          request.resolve(result);
        })
        .catch(error => {
          if (request.retries < request.maxRetries) {
            request.retries++;
            request.status = 'pending';
            request.executeAt = Date.now() + this.calculateBackoffDelay(
              request.retries,
              this.config.baseDelay,
              this.config.maxDelay
            );
            this.queue.push(request);
          } else {
            request.reject(error);
          }
        })
        .finally(() => {
          this.executing--;
          this.processQueue();
        });
    }

    this.isProcessing = false;
  }

  async schedule<T>(
    request: () => Promise<T>,
    priority: RequestPriority = 'normal',
    maxRetries: number = 2
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const queuedRequest: QueuedRequest<T> = {
        id: this.generateRequestId(),
        request,
        priority,
        status: 'pending',
        retries: 0,
        maxRetries,
        createdAt: Date.now(),
        executeAt: Date.now(),
        resolve: resolve as (value: T) => void,
        reject
      };

      if (this.queue.length >= this.config.maxQueueSize) {
        const lowestPriority = this.queue
          .filter(r => r.priority === 'low')
          .sort((a, b) => a.createdAt - b.createdAt)[0];

        if (lowestPriority) {
          const index = this.queue.indexOf(lowestPriority);
          this.queue.splice(index, 1);
          lowestPriority.reject(new Error('Queue full, request cancelled'));
        } else {
          reject(new Error('Queue is full'));
          return;
        }
      }

      this.recordRequest('');
      this.queue.push(queuedRequest);
      this.processQueue();
    });
  }

  private recordRequest(endpoint: string): void {
    const now = Date.now();
    this.requestHistory.push({ timestamp: now, endpoint });

    this.requestHistory = this.requestHistory.filter(
      r => now - r.timestamp <= this.historyWindow
    );
  }

  getRequestLoad(): number {
    const now = Date.now();
    const recentRequests = this.requestHistory.filter(
      r => now - r.timestamp <= this.historyWindow
    );
    return recentRequests.length;
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getExecutingCount(): number {
    return this.executing;
  }

  private getCircuitBreaker(endpoint: string): CircuitBreaker {
    if (!this.circuitBreakers.has(endpoint)) {
      this.circuitBreakers.set(
        endpoint,
        new CircuitBreaker(
          this.config.circuitBreakerThreshold,
          this.config.circuitBreakerResetTime
        )
      );
    }
    return this.circuitBreakers.get(endpoint)!;
  }

  private getRateLimiter(endpoint: string): AdaptiveRateLimiter {
    if (!this.rateLimiters.has(endpoint)) {
      this.rateLimiters.set(endpoint, new AdaptiveRateLimiter(10, 5));
    }
    return this.rateLimiters.get(endpoint)!;
  }

  clearQueue(): void {
    this.queue.forEach(req => {
      req.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }
}

export const smartScheduler = new SmartScheduler({
  maxConcurrent: 3,
  maxQueueSize: 50,
  baseDelay: 1000,
  maxDelay: 30000,
  circuitBreakerThreshold: 5,
  circuitBreakerResetTime: 60000
});

export function getSchedulerStats() {
  return {
    queueSize: smartScheduler.getQueueSize(),
    executing: smartScheduler.getExecutingCount(),
    requestLoad: smartScheduler.getRequestLoad()
  };
}
