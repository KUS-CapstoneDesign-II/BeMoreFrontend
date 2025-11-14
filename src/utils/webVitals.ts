/**
 * Web Vitals Performance Monitoring
 *
 * Core Web Vitals 측정 및 모니터링
 * - LCP (Largest Contentful Paint): 페이지 로드 성능
 * - FID (First Input Delay): 상호작용 반응성
 * - CLS (Cumulative Layout Shift): 시각적 안정성
 * - TTFB (Time to First Byte): 서버 응답 성능
 * - FCP (First Contentful Paint): 첫 번째 콘텐츠 표시
 */

import { getAnalyticsEnabled } from '../config/features';

/**
 * Performance API Extended Types for Web Vitals
 */
interface PerformancePaintTiming extends PerformanceEntry {
  renderTime?: number;
  loadTime?: number;
}

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

export interface VitalsMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'FCP' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType?: string;
  entries?: PerformanceEntry[];
}

interface VitalsThresholds {
  good: number;
  'needs-improvement': number;
}

const thresholds: Record<string, VitalsThresholds> = {
  LCP: { good: 2500, 'needs-improvement': 4000 }, // ms
  FID: { good: 100, 'needs-improvement': 300 }, // ms
  CLS: { good: 0.1, 'needs-improvement': 0.25 }, // unitless
  TTFB: { good: 600, 'needs-improvement': 1800 }, // ms
  FCP: { good: 1800, 'needs-improvement': 3000 }, // ms
  INP: { good: 200, 'needs-improvement': 500 } // ms
};

/**
 * Web Vitals 메트릭 등급 판정
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = thresholds[name];
  if (!threshold) return 'needs-improvement';

  if (value <= threshold.good) return 'good';
  if (value <= threshold['needs-improvement']) return 'needs-improvement';
  return 'poor';
}

/**
 * LCP (Largest Contentful Paint) 측정
 *
 * 화면에 표시되는 가장 큰 이미지나 텍스트 블록이 렌더링되는 시간
 * 목표: < 2.5초
 */
export function measureLCP(callback: (metric: VitalsMetric) => void): void {
  if (!('PerformanceObserver' in window)) {
    console.warn('PerformanceObserver not supported');
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformancePaintTiming;

      const metric: VitalsMetric = {
        name: 'LCP',
        value: Math.round(lastEntry.renderTime || lastEntry.loadTime || 0),
        rating: getRating('LCP', lastEntry.renderTime || lastEntry.loadTime || 0),
        delta: 0,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        navigationType: performance.navigation.type === 0 ? 'navigation' : 'reload',
        entries: entries
      };

      callback(metric);
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (error) {
    console.warn('LCP measurement failed:', error);
  }
}

/**
 * FID (First Input Delay) 측정
 *
 * 사용자 상호작용 이후 브라우저가 반응하기까지의 지연 시간
 * 목표: < 100ms
 */
export function measureFID(callback: (metric: VitalsMetric) => void): void {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstEntry = entries[0] as PerformanceEventTiming;

      const metric: VitalsMetric = {
        name: 'FID',
        value: Math.round(firstEntry.processingStart - firstEntry.startTime),
        rating: getRating('FID', firstEntry.processingStart - firstEntry.startTime),
        delta: 0,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        entries: entries
      };

      callback(metric);
    });

    observer.observe({ type: 'first-input', buffered: true });
  } catch (error) {
    console.warn('FID measurement failed:', error);
  }
}

/**
 * CLS (Cumulative Layout Shift) 측정
 *
 * 사용자가 예기치 않게 레이아웃이 이동하는 누적 정도
 * 목표: < 0.1
 */
export function measureCLS(callback: (metric: VitalsMetric) => void): void {
  if (!('PerformanceObserver' in window)) return;

  let clsValue = 0;
  const clsEntries: PerformanceEntry[] = [];

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as LayoutShiftEntry;
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value;
          clsEntries.push(entry);

          const metric: VitalsMetric = {
            name: 'CLS',
            value: Math.round(clsValue * 10000) / 10000,
            rating: getRating('CLS', clsValue),
            delta: layoutShift.value,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            entries: clsEntries
          };

          callback(metric);
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (error) {
    console.warn('CLS measurement failed:', error);
  }
}

/**
 * FCP (First Contentful Paint) 측정
 *
 * 첫 번째 텍스트나 이미지가 화면에 표시되는 시간
 * 목표: < 1.8초
 */
export function measureFCP(callback: (metric: VitalsMetric) => void): void {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry;

      const metric: VitalsMetric = {
        name: 'FCP',
        value: Math.round(lastEntry.startTime),
        rating: getRating('FCP', lastEntry.startTime),
        delta: 0,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        entries: entries
      };

      callback(metric);
    });

    observer.observe({ type: 'paint', buffered: true });
  } catch (error) {
    console.warn('FCP measurement failed:', error);
  }
}

/**
 * 모든 Web Vitals 측정 시작
 */
export function initWebVitals(callback: (metric: VitalsMetric) => void): void {
  if (import.meta.env.PROD || import.meta.env.DEV) {
    measureFCP(callback);
    measureLCP(callback);
    measureFID(callback);
    measureCLS(callback);
  }
}

/**
 * Analytics 엔드포인트 가용성 캐시
 * 404 응답을 받으면 더 이상 재시도하지 않음
 */
let analyticsEndpointAvailable: boolean | null = null;

/**
 * 성능 메트릭을 분석 서버로 전송 (선택사항)
 *
 * 환경 변수:
 * - VITE_ANALYTICS_ENABLED: 분석 활성화 여부 (기본값: true)
 *
 * 동작:
 * - DEV: 로컬 로깅만 수행
 * - PROD: /api/analytics/vitals 엔드포인트에 전송
 *   - 404 응답 시 재시도 중단
 *   - CORS 오류 시 로깅 후 무시
 */
export async function sendVitalsToAnalytics(metric: VitalsMetric): Promise<void> {
  // 개발 환경: 로컬 로깅만 수행
  if (import.meta.env.DEV) {
    console.log(`📊 Web Vitals: ${metric.name}`, {
      value: `${metric.value}${metric.name === 'CLS' ? '' : 'ms'}`,
      rating: metric.rating,
      id: metric.id
    });
    return;
  }

  // Analytics 비활성화 확인 (Feature Flag)
  if (!getAnalyticsEnabled()) {
    return;
  }

  // 이전에 404 받았으면 더 이상 요청하지 않음
  if (analyticsEndpointAvailable === false) {
    return;
  }

  try {
    const response = await fetch('/api/analytics/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        timestamp: new Date().toISOString()
      })
    });

    // 404: 엔드포인트 없음 → 재시도 중단
    if (response.status === 404) {
      analyticsEndpointAvailable = false;
      console.warn('⚠️ Analytics endpoint not available (404) - stopping vitals collection');
      return;
    }

    // CORS 오류 (이미 fetch 성공했으므로 여기서는 안 나타남)
    if (!response.ok) {
      console.warn(`⚠️ Analytics endpoint returned ${response.status} - ${response.statusText}`);
      return;
    }

    // 성공
    analyticsEndpointAvailable = true;
    if (import.meta.env.DEV) {
      console.log('✅ Analytics vitals sent successfully');
    }
  } catch (error) {
    // CORS 오류는 fetch 단계에서 발생
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.warn('⚠️ Analytics endpoint unreachable (possible CORS error) - retrying next time');
    } else {
      console.warn('⚠️ Failed to send analytics vitals:', error);
    }
    // 네트워크 오류는 재시도 허용
  }
}

/**
 * 성능 요약 리포트
 */
export interface PerformanceSummary {
  LCP: VitalsMetric | null;
  FID: VitalsMetric | null;
  CLS: VitalsMetric | null;
  FCP: VitalsMetric | null;
  loadTime: number;
  domReady: number;
}

/**
 * 성능 리포트 생성
 */
export function getPerformanceSummary(): PerformanceSummary {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

  return {
    LCP: null,
    FID: null,
    CLS: null,
    FCP: null,
    loadTime: Math.round(navigation?.loadEventEnd - navigation?.fetchStart || 0),
    domReady: Math.round(navigation?.domContentLoadedEventEnd - navigation?.fetchStart || 0)
  };
}

export default {
  initWebVitals,
  sendVitalsToAnalytics,
  measureLCP,
  measureFID,
  measureCLS,
  measureFCP,
  getPerformanceSummary
};
