// Production monitoring and analytics
import type { Express } from 'express';

interface MetricData {
  timestamp: number;
  value: number;
  labels?: Record<string, string>;
}

class ProductionMonitoring {
  private metrics: Map<string, MetricData[]> = new Map();
  private alerts: Set<string> = new Set();

  // Track API performance
  trackApiCall(endpoint: string, duration: number, statusCode: number) {
    const key = `api_${endpoint}_${statusCode}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    this.metrics.get(key)!.push({
      timestamp: Date.now(),
      value: duration,
      labels: { endpoint, statusCode: statusCode.toString() }
    });

    // Alert on slow requests
    if (duration > 10000) {
      this.alert(`SLOW_API_${endpoint}`, `API call to ${endpoint} took ${duration}ms`);
    }

    // Alert on errors
    if (statusCode >= 500) {
      this.alert(`API_ERROR_${endpoint}`, `API error ${statusCode} on ${endpoint}`);
    }
  }

  // Track database performance
  trackDatabaseQuery(query: string, duration: number) {
    const key = 'database_query';
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    this.metrics.get(key)!.push({
      timestamp: Date.now(),
      value: duration,
      labels: { query_type: query.split(' ')[0] }
    });

    if (duration > 5000) {
      this.alert('SLOW_DATABASE_QUERY', `Database query took ${duration}ms: ${query.substring(0, 100)}`);
    }
  }

  // Track user activity
  trackUserActivity(userId: string, action: string) {
    const key = `user_activity_${action}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    this.metrics.get(key)!.push({
      timestamp: Date.now(),
      value: 1,
      labels: { userId, action }
    });
  }

  // Alert system
  private alert(type: string, message: string) {
    const alertKey = `${type}_${Date.now()}`;
    if (!this.alerts.has(alertKey)) {
      this.alerts.add(alertKey);
      console.warn(`[ALERT] ${type}: ${message}`);
      
      // In production, you'd send this to monitoring service
      // this.sendToMonitoringService(type, message);
    }
  }

  // Get metrics summary
  getMetrics() {
    const summary: Record<string, any> = {};
    
    for (const [key, values] of this.metrics.entries()) {
      if (values.length === 0) continue;
      
      const recent = values.filter(v => Date.now() - v.timestamp < 3600000); // Last hour
      if (recent.length === 0) continue;
      
      summary[key] = {
        count: recent.length,
        avg: recent.reduce((sum, v) => sum + v.value, 0) / recent.length,
        max: Math.max(...recent.map(v => v.value)),
        min: Math.min(...recent.map(v => v.value))
      };
    }
    
    return summary;
  }

  // Resource monitoring
  getResourceUsage() {
    const usage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memory: {
        rss: Math.round(usage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
        external: Math.round(usage.external / 1024 / 1024),
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      uptime: Math.round(process.uptime()),
    };
  }

  // Clean old metrics (prevent memory leaks)
  cleanOldMetrics() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    
    for (const [key, values] of this.metrics.entries()) {
      const filtered = values.filter(v => v.timestamp > cutoff);
      if (filtered.length === 0) {
        this.metrics.delete(key);
      } else {
        this.metrics.set(key, filtered);
      }
    }
  }

  // Setup monitoring middleware
  setupMiddleware(app: Express) {
    // Performance tracking middleware
    app.use((req: any, res: any, next: any) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.trackApiCall(req.path, duration, res.statusCode);
      });
      
      next();
    });

    // Metrics endpoint
    app.get('/metrics', (req, res) => {
      res.json({
        metrics: this.getMetrics(),
        resources: this.getResourceUsage(),
        timestamp: new Date().toISOString()
      });
    });

    // Clean old metrics every hour
    setInterval(() => {
      this.cleanOldMetrics();
    }, 3600000);
  }
}

export const monitoring = new ProductionMonitoring();