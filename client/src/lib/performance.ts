// Frontend performance utilities

// Debounced search function
export const debouncedSearch = (callback: (query: string) => void, delay: number = 300) => {
  let timeoutId: NodeJS.Timeout;
  return (query: string) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(query), delay);
  };
};

// Throttled function for scroll events
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Local storage with error handling
export const safeLocalStorage = {
  get: (key: string, defaultValue: any = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
};

// Image optimization
export const optimizeImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(null);
      return;
    }
    
    const img = new Image();
    
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      canvas.width = Math.min(maxWidth, img.width);
      canvas.height = canvas.width / aspectRatio;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
    };
    
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
};

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance() {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTiming(label: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration);
    };
  }

  recordMetric(label: string, value: number) {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    
    const values = this.metrics.get(label)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.splice(0, values.length - 100);
    }
  }

  getMetrics() {
    const result: Record<string, any> = {};
    
    for (const [label, values] of this.metrics.entries()) {
      if (values.length === 0) continue;
      
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);
      
      result[label] = { avg: Math.round(avg), max: Math.round(max), min: Math.round(min) };
    }
    
    return result;
  }

  logSlowOperations(threshold: number = 100) {
    for (const [label, values] of this.metrics.entries()) {
      const recent = values.slice(-10); // Last 10 measurements
      const avg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
      
      if (avg > threshold) {
        console.warn(`[PERFORMANCE] Slow operation detected: ${label} (avg: ${Math.round(avg)}ms)`);
      }
    }
  }
}

// Memory usage tracking
export const trackMemoryUsage = (): { used: number; total: number; limit: number } | null => {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
    };
  }
  return null;
};

// Intersection Observer for lazy loading
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) => {
  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '50px',
    ...options,
  };

  return new IntersectionObserver(callback, defaultOptions);
};

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();