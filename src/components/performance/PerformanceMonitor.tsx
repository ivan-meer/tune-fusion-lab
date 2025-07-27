/**
 * Performance Monitor Component
 * 
 * Tracks Web Vitals and performance metrics
 * Shows performance indicators in development mode
 */

import React, { useEffect, useState, memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Zap, Clock, Eye } from 'lucide-react';

interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

// Performance thresholds
const THRESHOLDS = {
  fcp: { good: 1800, poor: 3000 },
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  ttfb: { good: 800, poor: 1800 }
};

const getScoreColor = (value: number, metric: keyof typeof THRESHOLDS) => {
  const threshold = THRESHOLDS[metric];
  if (value <= threshold.good) return 'text-green-600';
  if (value <= threshold.poor) return 'text-yellow-600';
  return 'text-red-600';
};

const formatMetric = (value: number, metric: keyof typeof THRESHOLDS) => {
  if (metric === 'cls') return value.toFixed(3);
  return `${Math.round(value)}ms`;
};

const PerformanceMonitor = memo(() => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });

  useEffect(() => {
    let observer: PerformanceObserver | null = null;

    if ('PerformanceObserver' in window) {
      observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (entry.entryType === 'paint') {
            if (entry.name === 'first-contentful-paint') {
              setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
            }
          }
          
          if (entry.entryType === 'largest-contentful-paint') {
            setMetrics(prev => ({ ...prev, lcp: entry.startTime }));
          }
          
          if (entry.entryType === 'first-input') {
            setMetrics(prev => ({ ...prev, fid: (entry as any).processingStart - entry.startTime }));
          }
          
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            setMetrics(prev => ({ ...prev, cls: (prev.cls || 0) + (entry as any).value }));
          }

          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            setMetrics(prev => ({ 
              ...prev, 
              ttfb: navEntry.responseStart - navEntry.requestStart 
            }));
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift', 'navigation'] });
      } catch (e) {
        console.warn('Performance Observer not fully supported:', e);
      }
    }

    return () => {
      observer?.disconnect();
    };
  }, []);

  // Only show in development
  if (import.meta.env.PROD) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-background/95 backdrop-blur border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Performance Monitor
          <Badge variant="outline" className="text-xs">
            Renders: {renderCount}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {metrics.fcp && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                FCP
              </span>
              <span className={getScoreColor(metrics.fcp, 'fcp')}>
                {formatMetric(metrics.fcp, 'fcp')}
              </span>
            </div>
          )}
          
          {metrics.lcp && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                LCP
              </span>
              <span className={getScoreColor(metrics.lcp, 'lcp')}>
                {formatMetric(metrics.lcp, 'lcp')}
              </span>
            </div>
          )}
          
          {metrics.fid && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                FID
              </span>
              <span className={getScoreColor(metrics.fid, 'fid')}>
                {formatMetric(metrics.fid, 'fid')}
              </span>
            </div>
          )}
          
          {metrics.cls !== undefined && (
            <div className="flex items-center justify-between">
              <span>CLS</span>
              <span className={getScoreColor(metrics.cls, 'cls')}>
                {formatMetric(metrics.cls, 'cls')}
              </span>
            </div>
          )}
          
          {metrics.ttfb && (
            <div className="flex items-center justify-between">
              <span>TTFB</span>
              <span className={getScoreColor(metrics.ttfb, 'ttfb')}>
                {formatMetric(metrics.ttfb, 'ttfb')}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';

export default PerformanceMonitor;