// Production-ready performance optimizations
import type { Express } from 'express';

// Response compression middleware
import compression from 'compression';

export const compressionMiddleware = compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
});

// Enhanced security headers
export const securityMiddleware = (req: any, res: any, next: any) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

// Database connection pooling optimization
export const optimizeDatabase = () => {
  // Connection pool settings are handled in db.ts
  return {
    maxConnections: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
};

// Response caching for static data (simple in-memory cache)
const responseCache = new Map<string, { data: any; timestamp: number }>();

export const cacheResponses = async (key: string, fetchFunction: () => Promise<any>) => {
  const cached = responseCache.get(key);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < 300000) { // 5 minutes
    return cached.data;
  }
  
  const data = await fetchFunction();
  responseCache.set(key, { data, timestamp: now });
  
  // Clean old cache entries
  if (responseCache.size > 1000) {
    const oldestKey = responseCache.keys().next().value;
    responseCache.delete(oldestKey);
  }
  
  return data;
};

// API response optimization
export const optimizeApiResponse = (data: any) => {
  // Remove sensitive fields
  if (data && typeof data === 'object') {
    const { password, privateKey, sessionToken, ...cleanData } = data;
    return cleanData;
  }
  return data;
};

// Request timeout middleware
export const timeoutMiddleware = (timeoutMs: number = 30000) => {
  return (req: any, res: any, next: any) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({ error: 'Request timeout' });
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));
    
    next();
  };
};

// Production logging
export const productionLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'ERROR' : 'INFO';
    
    console.log(`[${logLevel}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    
    // Log slow requests
    if (duration > 5000) {
      console.warn(`[SLOW REQUEST] ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
};

// Health check endpoint
export const healthCheck = (app: Express) => {
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    });
  });
};

// Graceful shutdown handler
export const gracefulShutdown = (server: any) => {
  const shutdown = (signal: string) => {
    console.log(`Received ${signal}. Graceful shutdown...`);
    
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};