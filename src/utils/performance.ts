/**
 * Performance 유틸리티
 *
 * 웹 성능 메트릭을 측정하고 모니터링합니다.
 */

interface PerformanceMetrics {
  // Core Web Vitals
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift

  // Navigation Timing
  loadTime?: number;
  domContentLoaded?: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
}

/**
 * Web Vitals 수집
 */
export function collectWebVitals(): Promise<PerformanceMetrics> {
  return new Promise((resolve) => {
    const metrics: PerformanceMetrics = {};

    // FCP (First Contentful Paint)
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
    if (fcp) {
      metrics.firstContentfulPaint = fcp.startTime;
    }

    // LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
          metrics.LCP = lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime;
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        console.warn('LCP measurement not supported:', e);
      }
    }

    // Navigation Timing
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationTiming) {
      metrics.loadTime = navigationTiming.loadEventEnd - navigationTiming.fetchStart;
      metrics.domContentLoaded = navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart;
    }

    // 1초 후 메트릭 반환
    setTimeout(() => resolve(metrics), 1000);
  });
}

/**
 * 성능 메트릭 로깅
 */
export function logPerformanceMetrics(metrics: PerformanceMetrics): void {
  console.group('📊 Performance Metrics');

  if (metrics.firstContentfulPaint) {
    console.log(`First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(2)}ms`);
  }

  if (metrics.LCP) {
    const lcpStatus = metrics.LCP < 2500 ? '✅ Good' : metrics.LCP < 4000 ? '⚠️ Needs Improvement' : '❌ Poor';
    console.log(`Largest Contentful Paint: ${metrics.LCP.toFixed(2)}ms ${lcpStatus}`);
  }

  if (metrics.loadTime) {
    const loadStatus = metrics.loadTime < 3000 ? '✅ Good' : metrics.loadTime < 5000 ? '⚠️ Needs Improvement' : '❌ Poor';
    console.log(`Page Load Time: ${metrics.loadTime.toFixed(2)}ms ${loadStatus}`);
  }

  if (metrics.domContentLoaded) {
    console.log(`DOM Content Loaded: ${metrics.domContentLoaded.toFixed(2)}ms`);
  }

  console.groupEnd();
}

/**
 * 컴포넌트 렌더링 성능 측정
 */
export function measureRender(componentName: string, callback: () => void): void {
  const start = performance.now();
  callback();
  const end = performance.now();
  const duration = end - start;

  if (duration > 16.67) { // 60fps 기준
    console.warn(`⚠️ Slow render: ${componentName} took ${duration.toFixed(2)}ms`);
  }
}

/**
 * 메모리 사용량 측정 (Chrome only)
 */
export function logMemoryUsage(): void {
  if ('memory' in performance && (performance as any).memory) {
    const memory = (performance as any).memory;
    const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(2);
    const totalMB = (memory.totalJSHeapSize / 1048576).toFixed(2);
    const limitMB = (memory.jsHeapSizeLimit / 1048576).toFixed(2);

    console.log(`💾 Memory: ${usedMB}MB / ${totalMB}MB (Limit: ${limitMB}MB)`);
  }
}
