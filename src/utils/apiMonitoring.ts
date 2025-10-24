/**
 * API 성능 모니터링
 * 느린 API 호출, 타임아웃, 실패율을 추적합니다.
 */

interface APIMetric {
  endpoint: string;
  method: string;
  duration: number;
  status?: number;
  success: boolean;
  timestamp: number;
}

interface APIStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  timeoutCalls: number;
  averageResponseTime: number;
  slowCalls: APIMetric[]; // 3초 이상 걸린 호출들
}

const metrics: APIMetric[] = [];
const SLOW_THRESHOLD = 3000; // 3초 이상이면 slow
const MAX_METRICS = 100; // 최대 100개 메트릭 저장 (메모리 관리)

export const apiMonitoring = {
  /**
   * API 호출 시작
   */
  startRequest: (endpoint: string, method: string = 'GET') => {
    return {
      endpoint,
      method,
      startTime: performance.now(),
    };
  },

  /**
   * API 호출 완료 기록
   */
  recordRequest: (
    requestData: { endpoint: string; method: string; startTime: number },
    success: boolean,
    status?: number,
    isTimeout: boolean = false
  ) => {
    const duration = performance.now() - requestData.startTime;

    const metric: APIMetric = {
      endpoint: requestData.endpoint,
      method: requestData.method,
      duration,
      status,
      success,
      timestamp: Date.now(),
    };

    metrics.push(metric);

    // 메모리 관리: 최대 개수 초과 시 오래된 항목 제거
    if (metrics.length > MAX_METRICS) {
      metrics.shift();
    }

    // 느린 호출 로깅
    if (duration > SLOW_THRESHOLD) {
      const durationStr = duration.toFixed(0);
      console.warn(
        `🐢 Slow API: ${requestData.method} ${requestData.endpoint} (${durationStr}ms)`
      );
    }

    // 타임아웃 로깅
    if (isTimeout) {
      console.warn(`⏱️ API Timeout: ${requestData.method} ${requestData.endpoint}`);
    }

    // 실패 로깅
    if (!success && !isTimeout) {
      console.warn(
        `⚠️ API Failed: ${requestData.method} ${requestData.endpoint} (${status})`
      );
    }

    return metric;
  },

  /**
   * 현재 통계 조회
   */
  getStats: (): APIStats => {
    const stats: APIStats = {
      totalCalls: metrics.length,
      successfulCalls: metrics.filter((m) => m.success).length,
      failedCalls: metrics.filter((m) => !m.success).length,
      timeoutCalls: metrics.filter((m) => m.duration > 20000).length, // 20초 이상
      averageResponseTime: 0,
      slowCalls: metrics.filter((m) => m.duration > SLOW_THRESHOLD),
    };

    if (metrics.length > 0) {
      const totalTime = metrics.reduce((sum, m) => sum + m.duration, 0);
      stats.averageResponseTime = totalTime / metrics.length;
    }

    return stats;
  },

  /**
   * 엔드포인트별 성능 조회
   */
  getEndpointStats: (endpoint?: string): Record<string, APIStats> => {
    const statsMap: Record<string, APIMetric[]> = {};

    metrics.forEach((metric) => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!statsMap[key]) {
        statsMap[key] = [];
      }
      statsMap[key].push(metric);
    });

    const result: Record<string, APIStats> = {};

    Object.entries(statsMap).forEach(([key, endpointMetrics]) => {
      const stats: APIStats = {
        totalCalls: endpointMetrics.length,
        successfulCalls: endpointMetrics.filter((m) => m.success).length,
        failedCalls: endpointMetrics.filter((m) => !m.success).length,
        timeoutCalls: endpointMetrics.filter((m) => m.duration > 20000).length,
        averageResponseTime: 0,
        slowCalls: endpointMetrics.filter((m) => m.duration > SLOW_THRESHOLD),
      };

      const totalTime = endpointMetrics.reduce((sum, m) => sum + m.duration, 0);
      stats.averageResponseTime = totalTime / endpointMetrics.length;

      result[key] = stats;
    });

    return endpoint ? { [endpoint]: result[endpoint] || { totalCalls: 0, successfulCalls: 0, failedCalls: 0, timeoutCalls: 0, averageResponseTime: 0, slowCalls: [] } } : result;
  },

  /**
   * 메트릭 초기화
   */
  reset: () => {
    metrics.length = 0;
  },

  /**
   * 현재 메트릭 배열
   */
  getMetrics: () => [...metrics],
};
