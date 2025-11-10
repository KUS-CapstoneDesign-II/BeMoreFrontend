/**
 * Performance Reporting System
 *
 * 성능 메트릭을 수집하고 분석하는 시스템
 * - 실시간 성능 감시
 * - 임계값 기반 경고
 * - 분석 데이터 저장
 * - 성능 트렌드 추적
 */

import type { VitalsMetric } from './webVitals';

export interface PerformanceReport {
  timestamp: number;
  url: string;
  metrics: Record<string, VitalsMetric>;
  navigation: NavigationTiming;
  resources: ResourceTiming[];
}

export interface NavigationTiming {
  dns: number;
  tcp: number;
  ttfb: number;
  download: number;
  domInteractive: number;
  domComplete: number;
  loadComplete: number;
}

export interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  type: string;
}

export interface PerformanceThresholds {
  LCP: { warning: number; critical: number };
  FID: { warning: number; critical: number };
  CLS: { warning: number; critical: number };
  TTFB: { warning: number; critical: number };
  FCP: { warning: number; critical: number };
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  LCP: { warning: 2500, critical: 4000 },
  FID: { warning: 100, critical: 300 },
  CLS: { warning: 0.1, critical: 0.25 },
  TTFB: { warning: 600, critical: 1800 },
  FCP: { warning: 1800, critical: 3000 }
};

/**
 * Performance Reporting Manager
 */
export class PerformanceReportingManager {
  private metrics: Map<string, VitalsMetric> = new Map();
  private thresholds: PerformanceThresholds;
  private reports: PerformanceReport[] = [];
  private maxStoredReports = 50;

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /**
   * 메트릭 기록
   */
  recordMetric(metric: VitalsMetric): void {
    this.metrics.set(metric.name, metric);

    // 임계값 확인
    this.checkThreshold(metric);

    // 개발 환경에서 로깅
    if (import.meta.env.DEV) {
      this.logMetric(metric);
    }
  }

  /**
   * 임계값 확인 및 경고
   */
  private checkThreshold(metric: VitalsMetric): void {
    const threshold = this.thresholds[metric.name as keyof PerformanceThresholds];
    if (!threshold) return;

    if (metric.value > threshold.critical) {
      this.warn(`🚨 Critical: ${metric.name} (${metric.value}ms)`);
    } else if (metric.value > threshold.warning) {
      this.warn(`⚠️ Warning: ${metric.name} (${metric.value}ms)`);
    }
  }

  /**
   * 메트릭 로깅
   */
  private logMetric(metric: VitalsMetric): void {
    const icon = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(`${icon} ${metric.name}: ${metric.value}${metric.name === 'CLS' ? '' : 'ms'} (${metric.rating})`);
  }

  /**
   * 경고 출력
   */
  private warn(message: string): void {
    if (import.meta.env.DEV) {
      console.warn(message);
    } else {
      // 프로덕션: 분석 서버로 전송 (별도 구현)
      this.sendAlert(message);
    }
  }

  /**
   * 성능 리포트 생성
   */
  generateReport(): PerformanceReport {
    const navigation = this.getNavigationTiming();
    const resources = this.getResourceTiming();

    const report: PerformanceReport = {
      timestamp: Date.now(),
      url: window.location.href,
      metrics: Object.fromEntries(this.metrics),
      navigation,
      resources
    };

    // 리포트 저장 (최근 N개만 유지)
    this.reports.push(report);
    if (this.reports.length > this.maxStoredReports) {
      this.reports.shift();
    }

    return report;
  }

  /**
   * Navigation Timing 추출
   */
  private getNavigationTiming(): NavigationTiming {
    if (!window.performance || !window.performance.timing) {
      return { dns: 0, tcp: 0, ttfb: 0, download: 0, domInteractive: 0, domComplete: 0, loadComplete: 0 };
    }

    const t = window.performance.timing;
    return {
      dns: t.domainLookupEnd - t.domainLookupStart,
      tcp: t.connectEnd - t.connectStart,
      ttfb: t.responseStart - t.navigationStart,
      download: t.responseEnd - t.responseStart,
      domInteractive: t.domInteractive - t.navigationStart,
      domComplete: t.domComplete - t.navigationStart,
      loadComplete: t.loadEventEnd - t.navigationStart
    };
  }

  /**
   * Resource Timing 추출
   */
  private getResourceTiming(): ResourceTiming[] {
    if (!window.performance || !window.performance.getEntriesByType) {
      return [];
    }

    const resources: ResourceTiming[] = [];
    const entries = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    // 주요 리소스만 기록 (상위 10개)
    entries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
      .forEach((entry) => {
        resources.push({
          name: entry.name,
          duration: Math.round(entry.duration),
          size: entry.transferSize || 0,
          type: entry.initiatorType
        });
      });

    return resources;
  }

  /**
   * 성능 요약 통계
   */
  getSummary(): Record<string, unknown> {
    const metricsArray = Array.from(this.metrics.values());

    return {
      totalMetrics: metricsArray.length,
      goodMetrics: metricsArray.filter((m) => m.rating === 'good').length,
      improvementNeeded: metricsArray.filter((m) => m.rating === 'needs-improvement').length,
      poorMetrics: metricsArray.filter((m) => m.rating === 'poor').length,
      averageRating:
        metricsArray.length > 0
          ? (metricsArray.filter((m) => m.rating === 'good').length / metricsArray.length * 100).toFixed(1)
          : 'N/A'
    };
  }

  /**
   * 성능 리포트 가져오기
   */
  getReports(limit: number = 10): PerformanceReport[] {
    return this.reports.slice(-limit).reverse();
  }

  /**
   * 성능 트렌드 분석
   */
  analyzeTrend(metricName: string, windowSize: number = 5): { improving: boolean; average: number } {
    const recentReports = this.reports.slice(-windowSize);
    const values = recentReports
      .map((r) => r.metrics[metricName]?.value)
      .filter((v) => v !== undefined) as number[];

    if (values.length < 2) {
      return { improving: false, average: 0 };
    }

    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const lastValue = values[values.length - 1];
    const firstValue = values[0];
    const trend = lastValue !== undefined && firstValue !== undefined && lastValue < firstValue;

    return { improving: trend, average };
  }

  /**
   * 성능 경고 전송 (프로덕션)
   */
  private sendAlert(message: string): void {
    if (import.meta.env.PROD) {
      // TODO: Replace with actual analytics endpoint
      fetch('/api/analytics/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          timestamp: new Date().toISOString(),
          url: window.location.href
        })
      }).catch(() => {
        // Fail silently
      });
    }
  }

  /**
   * 성능 데이터 내보내기
   */
  exportData(): string {
    const data = {
      timestamp: new Date().toISOString(),
      reports: this.reports,
      summary: this.getSummary()
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * 성능 데이터 초기화
   */
  clear(): void {
    this.metrics.clear();
    this.reports = [];
  }
}

// 전역 인스턴스
export const performanceReporting = new PerformanceReportingManager();

/**
 * Performance Reporting 초기화
 */
export function initPerformanceReporting(): void {
  if (import.meta.env.DEV) {
    // 개발 환경: 콘솔에서 접근 가능
    interface WindowWithPerf extends Window {
      __performance?: typeof performanceReporting;
    }
    (window as WindowWithPerf).__performance = performanceReporting;

    console.log(
      '%c📊 Performance Reporting Ready',
      'color: #10b981; font-weight: bold; font-size: 12px',
      'Use window.__performance.generateReport() or window.__performance.getSummary()'
    );
  }
}

export default performanceReporting;
