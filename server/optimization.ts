// Advanced production optimizations for BAM AIChat
import { storage } from './storage';
import type { Express } from 'express';

// Database query optimization
export class QueryOptimizer {
  private queryCache = new Map<string, { result: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async cachedQuery<T>(key: string, queryFn: () => Promise<T>): Promise<T> {
    const cached = this.queryCache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      return cached.result;
    }

    const result = await queryFn();
    this.queryCache.set(key, { result, timestamp: now });

    // Cleanup old cache entries
    if (this.queryCache.size > 500) {
      const cutoff = now - this.CACHE_TTL;
      for (const [k, v] of this.queryCache.entries()) {
        if (v.timestamp < cutoff) {
          this.queryCache.delete(k);
        }
      }
    }

    return result;
  }

  clearCache(pattern?: string) {
    if (pattern) {
      for (const key of this.queryCache.keys()) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
  }
}

// Response optimization
export class ResponseOptimizer {
  static compressResponse(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.compressResponse(item));
    }
    
    if (data && typeof data === 'object') {
      const compressed: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Skip null/undefined values
        if (value != null) {
          compressed[key] = this.compressResponse(value);
        }
      }
      return compressed;
    }
    
    return data;
  }

  static paginate<T>(data: T[], page: number = 1, limit: number = 20): {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  } {
    const offset = (page - 1) * limit;
    const total = data.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedData = data.slice(offset, offset + limit);

    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }
}

// AI Response Optimization
export class AIOptimizer {
  private responseCache = new Map<string, { response: string; timestamp: number }>();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  generateCacheKey(messages: any[], category: string): string {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    return `${category}:${this.hashString(lastUserMessage)}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  async getCachedResponse(cacheKey: string): Promise<string | null> {
    const cached = this.responseCache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      return cached.response;
    }

    return null;
  }

  cacheResponse(cacheKey: string, response: string): void {
    this.responseCache.set(cacheKey, {
      response,
      timestamp: Date.now(),
    });

    // Cleanup old entries
    if (this.responseCache.size > 200) {
      const cutoff = Date.now() - this.CACHE_TTL;
      for (const [key, value] of this.responseCache.entries()) {
        if (value.timestamp < cutoff) {
          this.responseCache.delete(key);
        }
      }
    }
  }

  clearCache(): void {
    this.responseCache.clear();
  }
}

// Memory management
export class MemoryManager {
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Run cleanup every 30 minutes
    this.cleanupInterval = setInterval(() => {
      this.runCleanup();
    }, 30 * 60 * 1000);
  }

  private runCleanup(): void {
    if (global.gc) {
      global.gc();
    }

    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    
    console.log(`[MEMORY] Heap used: ${heapUsedMB}MB`);
    
    // Alert if memory usage is high
    if (heapUsedMB > 512) {
      console.warn(`[MEMORY WARNING] High memory usage: ${heapUsedMB}MB`);
    }
  }

  getMemoryStats() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      uptime: Math.round(process.uptime()),
    };
  }

  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Production middleware setup
export function setupProductionOptimizations(app: Express) {
  // Memory management
  const memoryManager = new MemoryManager();

  // Optimized health check
  app.get('/api/system/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      memory: memoryManager.getMemoryStats(),
      uptime: process.uptime(),
      version: '1.0.0',
    });
  });

  // System metrics endpoint
  app.get('/api/system/metrics', (req, res) => {
    res.json({
      memory: memoryManager.getMemoryStats(),
      timestamp: new Date().toISOString(),
    });
  });

  // Graceful shutdown cleanup
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, cleaning up...');
    memoryManager.cleanup();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, cleaning up...');
    memoryManager.cleanup();
    process.exit(0);
  });
}

// Export instances
export const queryOptimizer = new QueryOptimizer();
export const aiOptimizer = new AIOptimizer();
export const memoryManager = new MemoryManager();