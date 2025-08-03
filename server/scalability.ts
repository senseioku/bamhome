// Production scalability and reliability features
import { Request, Response, NextFunction } from 'express';

// Circuit breaker pattern for external services
export class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private resetTimeout: number = 30000 // 30 seconds
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailTime: this.lastFailTime,
    };
  }
}

// Load balancer for AI requests
export class AILoadBalancer {
  private servers: string[] = [];
  private currentIndex = 0;
  private healthChecks = new Map<string, boolean>();

  constructor(servers: string[]) {
    this.servers = servers;
    servers.forEach(server => this.healthChecks.set(server, true));
  }

  getNextServer(): string | null {
    const availableServers = this.servers.filter(server => 
      this.healthChecks.get(server) === true
    );

    if (availableServers.length === 0) {
      return null;
    }

    const server = availableServers[this.currentIndex % availableServers.length];
    this.currentIndex++;
    return server;
  }

  markServerDown(server: string) {
    this.healthChecks.set(server, false);
    
    // Auto-recovery after 5 minutes
    setTimeout(() => {
      this.healthChecks.set(server, true);
    }, 5 * 60 * 1000);
  }

  getHealthStatus() {
    return Object.fromEntries(this.healthChecks);
  }
}

// Request deduplication for identical concurrent requests
export class RequestDeduplicator {
  private cache = new Map<string, Promise<any>>();

  async deduplicate<T>(key: string, operation: () => Promise<T>): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const promise = operation().finally(() => {
      // Clean up after request completes
      setTimeout(() => {
        this.cache.delete(key);
      }, 1000);
    });

    this.cache.set(key, promise);
    return promise;
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return {
      activeRequests: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Database connection health monitoring
export class DatabaseHealthMonitor {
  private isHealthy = true;
  private lastCheck = 0;
  private checkInterval = 30000; // 30 seconds

  async checkHealth(db: any): Promise<boolean> {
    const now = Date.now();
    
    if (now - this.lastCheck < this.checkInterval) {
      return this.isHealthy;
    }

    try {
      // Simple health check query
      await db.execute('SELECT 1');
      this.isHealthy = true;
      this.lastCheck = now;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      this.isHealthy = false;
      this.lastCheck = now;
      return false;
    }
  }

  getStatus() {
    return {
      healthy: this.isHealthy,
      lastCheck: new Date(this.lastCheck).toISOString(),
    };
  }
}

// Auto-scaling middleware based on load
export class AutoScaler {
  private currentLoad = 0;
  private maxConcurrentRequests = 100;
  private queueSize = 0;

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      this.currentLoad++;
      
      if (this.currentLoad > this.maxConcurrentRequests) {
        this.queueSize++;
        res.status(503).json({
          error: 'Service temporarily unavailable',
          message: 'Server is at capacity, please try again later',
          retryAfter: 30,
        });
        return;
      }

      res.on('finish', () => {
        this.currentLoad--;
        if (this.queueSize > 0) {
          this.queueSize--;
        }
      });

      next();
    };
  }

  getStats() {
    return {
      currentLoad: this.currentLoad,
      maxConcurrentRequests: this.maxConcurrentRequests,
      queueSize: this.queueSize,
      utilizationPercent: Math.round((this.currentLoad / this.maxConcurrentRequests) * 100),
    };
  }

  adjustCapacity(newMax: number) {
    this.maxConcurrentRequests = Math.max(10, newMax);
  }
}

// Cache warming for better performance
export class CacheWarmer {
  private warmupTasks: Array<() => Promise<void>> = [];

  addWarmupTask(task: () => Promise<void>) {
    this.warmupTasks.push(task);
  }

  async warmup() {
    console.log('Starting cache warmup...');
    
    const promises = this.warmupTasks.map(async (task, index) => {
      try {
        await task();
        console.log(`Warmup task ${index + 1} completed`);
      } catch (error) {
        console.error(`Warmup task ${index + 1} failed:`, error);
      }
    });

    await Promise.allSettled(promises);
    console.log('Cache warmup completed');
  }
}

// Production readiness checker
export class ProductionReadinessChecker {
  private checks: Array<{ name: string; check: () => Promise<boolean> }> = [];

  addCheck(name: string, check: () => Promise<boolean>) {
    this.checks.push({ name, check });
  }

  async runChecks(): Promise<{ ready: boolean; results: any[] }> {
    const results = [];
    let allPassed = true;

    for (const { name, check } of this.checks) {
      try {
        const passed = await check();
        results.push({ name, passed, error: null });
        if (!passed) allPassed = false;
      } catch (error) {
        results.push({ 
          name, 
          passed: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        allPassed = false;
      }
    }

    return { ready: allPassed, results };
  }
}

// Export instances
export const aiCircuitBreaker = new CircuitBreaker(3, 30000, 15000);
export const aiLoadBalancer = new AILoadBalancer(['primary']);
export const requestDeduplicator = new RequestDeduplicator();
export const dbHealthMonitor = new DatabaseHealthMonitor();
export const autoScaler = new AutoScaler();
export const cacheWarmer = new CacheWarmer();
export const readinessChecker = new ProductionReadinessChecker();