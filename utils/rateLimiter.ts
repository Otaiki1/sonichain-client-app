/**
 * Rate Limiter for Stacks API Calls
 * Prevents exceeding Stacks API rate limits
 */

interface RateLimitConfig {
  maxRequests: number; // Maximum requests per window
  windowMs: number; // Time window in milliseconds
}

interface RequestRecord {
  timestamp: number;
  key: string;
}

class RateLimiter {
  private requests: RequestRecord[] = [];
  private config: RateLimitConfig;
  private queue: Array<{
    key: string;
    fn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private processing = false;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if we can make a request
   */
  private canMakeRequest(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Clean up old requests
    this.requests = this.requests.filter((r) => r.timestamp > windowStart);

    // Check if under limit
    return this.requests.length < this.config.maxRequests;
  }

  /**
   * Record a request
   */
  private recordRequest(key: string): void {
    this.requests.push({
      timestamp: Date.now(),
      key,
    });
  }

  /**
   * Get time until next available slot
   */
  private getWaitTime(): number {
    if (this.requests.length === 0) return 0;

    const now = Date.now();
    const oldestRequest = this.requests[0];
    const windowStart = now - this.config.windowMs;

    if (oldestRequest.timestamp > windowStart) {
      return oldestRequest.timestamp - windowStart;
    }

    return 0;
  }

  /**
   * Process queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      if (!this.canMakeRequest(this.queue[0].key)) {
        const waitTime = this.getWaitTime();
        console.log(`⏳ Rate limit reached. Waiting ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime + 100));
        continue;
      }

      const item = this.queue.shift();
      if (!item) break;

      this.recordRequest(item.key);

      try {
        const result = await item.fn();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.processing = false;
  }

  /**
   * Execute function with rate limiting
   */
  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        key,
        fn,
        resolve,
        reject,
      });

      this.processQueue();
    });
  }

  /**
   * Get current status
   */
  getStatus() {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const activeRequests = this.requests.filter(
      (r) => r.timestamp > windowStart
    );

    return {
      activeRequests: activeRequests.length,
      maxRequests: this.config.maxRequests,
      queueLength: this.queue.length,
      canMakeRequest: this.canMakeRequest('status-check'),
    };
  }
}

// Stacks API rate limit: ~50 requests per minute (conservative estimate)
// We'll use 40 to be safe
const stacksRateLimiter = new RateLimiter({
  maxRequests: 40,
  windowMs: 60 * 1000, // 1 minute
});

/**
 * Wrap Stacks API call with rate limiting
 */
export async function withRateLimit<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  return stacksRateLimiter.execute(key, fn);
}

/**
 * Get rate limiter status
 */
export function getRateLimitStatus() {
  return stacksRateLimiter.getStatus();
}

/**
 * Debounce function to prevent rapid repeated calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
