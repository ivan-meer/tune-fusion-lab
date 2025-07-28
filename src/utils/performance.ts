/**
 * Performance monitoring and optimization utilities
 */

import React from 'react';

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  apiResponseTime: number;
  memoryUsage?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();
  private startTimes: Map<string, number> = new Map();

  startTimer(name: string): void {
    this.startTimes.set(name, performance.now());
  }

  endTimer(name: string): number {
    const startTime = this.startTimes.get(name);
    if (!startTime) {
      console.warn(`Timer "${name}" was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics.set(name, duration);
    this.startTimes.delete(name);
    
    return duration;
  }

  getMetric(name: string): number | undefined {
    return this.metrics.get(name);
  }

  getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  logMetrics(): void {
    const metrics = this.getAllMetrics();
    if (Object.keys(metrics).length > 0) {
      console.table(metrics);
    }
  }

  // Monitor API calls
  async measureApiCall<T>(
    name: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    this.startTimer(`api_${name}`);
    try {
      const result = await apiCall();
      const duration = this.endTimer(`api_${name}`);
      
      // Log slow API calls
      if (duration > 5000) {
        console.warn(`Slow API call detected: ${name} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      this.endTimer(`api_${name}`);
      throw error;
    }
  }

  // Monitor React component render times
  measureRender(componentName: string) {
    return {
      start: () => this.startTimer(`render_${componentName}`),
      end: () => {
        const duration = this.endTimer(`render_${componentName}`);
        
        // Log slow renders
        if (duration > 100) {
          console.warn(`Slow render detected: ${componentName} took ${duration.toFixed(2)}ms`);
        }
        
        return duration;
      }
    };
  }

  // Get memory usage (if available)
  getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return undefined;
  }

  // Monitor memory usage changes
  watchMemoryUsage(): void {
    const initialMemory = this.getMemoryUsage();
    if (!initialMemory) return;

    const checkMemory = () => {
      const currentMemory = this.getMemoryUsage();
      if (currentMemory) {
        const diff = currentMemory - initialMemory;
        const diffMB = diff / (1024 * 1024);
        
        if (diffMB > 50) { // Alert if memory usage increased by more than 50MB
          console.warn(`High memory usage detected: +${diffMB.toFixed(2)}MB`);
        }
      }
    };

    setInterval(checkMemory, 30000); // Check every 30 seconds
  }
}

export const performanceMonitor = new PerformanceMonitor();

// React hook for measuring component performance
export function usePerformanceMonitor(componentName: string) {
  const monitor = performanceMonitor.measureRender(componentName);
  
  React.useEffect(() => {
    monitor.start();
    return () => {
      monitor.end();
    };
  });

  return {
    measureApiCall: <T>(name: string, apiCall: () => Promise<T>) => 
      performanceMonitor.measureApiCall(name, apiCall),
    getMetrics: () => performanceMonitor.getAllMetrics()
  };
}

// Debounce utility for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout;
  
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  }) as T;
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean;
  
  return ((...args: any[]) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}

// Lazy loading utility
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return React.lazy(importFn);
}

// Performance-optimized memo
export function createMemoComponent<T extends React.ComponentType<any>>(
  Component: T,
  areEqual?: (prevProps: any, nextProps: any) => boolean
) {
  return React.memo(Component, areEqual);
}