import axios from 'axios';
import { apiMonitoring } from '../utils/apiMonitoring';
import { retryWithBackoff, requestDeduplicator } from '../utils/retry';
import { initMockAPIInterceptor } from '../utils/mockAPI';
import {
  generateRequestId,
  getClientVersion,
  getDeviceId,
  parseRateLimitHeaders,
  timestampTracker,
  getCsrfToken,
  sanitizeUrlForLogging,
  maskSensitiveDataInObject,
} from '../utils/requestTracking';
import { maskSessionId } from '../utils/security';
import type {
  ApiResponse,
  SessionStartResponse,
  Session,
  SessionReport,
  SessionStats,
} from '../types';

// 런타임 주입 환경변수 지원 (on‑prem 대비)
const runtimeEnv = (typeof window !== 'undefined' ? (window as unknown as { __ENV__?: { API_URL?: string } }).__ENV__ : undefined) || {};
const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string) ||
  (runtimeEnv.API_URL as string) ||
  'http://localhost:8000';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased from 20s to 30s for session end endpoint
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Initialize mock API interceptor if enabled
initMockAPIInterceptor(api);

// 요청 인터셉터 (보안 헤더 자동 추가)
api.interceptors.request.use(
  (config) => {
    // 요청 ID 생성
    const requestId = generateRequestId();
    (config as any).__requestId = requestId;

    // 요청 타임스탐프 추적 시작
    timestampTracker.startRequest(requestId);

    // 보안 헤더 자동 추가 (모든 요청)
    const securityHeaders = {
      'X-Request-ID': requestId,
      'X-Client-Version': getClientVersion(),
      'X-Device-ID': getDeviceId(),
      'X-Timestamp': Date.now().toString(),
    };

    config.headers = config.headers || {};
    Object.assign(config.headers, securityHeaders);

    // 인증 토큰 추가
    try {
      const token = localStorage.getItem('bemore_token');
      if (token) {
        (config.headers as any)['Authorization'] = `Bearer ${token}`;
      }
    } catch {}

    // CSRF 토큰 추가 (POST, PUT, DELETE, PATCH 요청)
    const method = config.method?.toUpperCase();
    if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      try {
        const csrfToken = getCsrfToken();
        (config.headers as any)['X-CSRF-Token'] = csrfToken;
      } catch {}
    }

    // 개발 환경 로깅 (민감한 데이터 마스킹)
    if (import.meta.env.DEV) {
      const sanitizedUrl = sanitizeUrlForLogging(config.url || '');
      console.log(`📡 API Request [${requestId}]: ${config.method?.toUpperCase()} ${sanitizedUrl}`);
    }

    // API 모니터링 시작
    const monitoring = apiMonitoring.startRequest(config.url || '', config.method?.toUpperCase());
    (config as any).__monitoring = monitoring;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 (Rate limiting & 보안 헤더 모니터링)
api.interceptors.response.use(
  (response) => {
    // 요청 ID 추적 종료
    const requestId = (response.config as any).__requestId;
    if (requestId) {
      timestampTracker.endRequest(requestId);
    }

    // Rate limiting 헤더 모니터링
    const rateLimitInfo = parseRateLimitHeaders(response.headers);
    if (rateLimitInfo.remaining !== null && rateLimitInfo.remaining < 10) {
      console.warn(`⚠️ Rate limit approaching: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} remaining`);
    }

    if (import.meta.env.DEV) {
      const sanitizedUrl = sanitizeUrlForLogging(response.config.url || '');
      const maskedData = typeof response.data === 'object' && response.data
        ? maskSensitiveDataInObject(response.data as Record<string, any>)
        : response.data;

      console.log(`✅ API Response [${requestId}]: ${sanitizedUrl} (${response.status})`, {
        data: maskedData,
        rateLimit: rateLimitInfo,
      });
    }

    // 성공한 요청 모니터링 기록
    const monitoring = (response.config as any).__monitoring;
    if (monitoring) {
      apiMonitoring.recordRequest(monitoring, true, response.status);
    }

    return response;
  },
  (error) => {
    // 요청 ID 추적 종료
    const requestId = (error.config as any)?.__requestId;
    if (requestId) {
      timestampTracker.endRequest(requestId);
    }

    let errorMsg = error.message;

    // 서버 또는 요청에서 제공한 요청 ID 추출
    const serverReqId = error?.response?.data?.error?.requestId || (error?.response?.headers && (error.response.headers as any)['x-request-id']);
    const trackedReqId = requestId || serverReqId;

    // 요청 ID 마스킹
    const maskedReqId = trackedReqId ? maskSessionId(trackedReqId) : 'unknown';

    if (trackedReqId) {
      errorMsg = `${errorMsg} [${maskedReqId}]`;
    }

    // 상세 에러 로깅
    const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
    const statusCode = error?.response?.status || 'unknown';
    const sanitizedUrl = sanitizeUrlForLogging(error.config?.url || 'unknown');

    // 에러 응답 데이터 마스킹
    const errorData = error?.response?.data;
    const maskedErrorData = typeof errorData === 'object' && errorData
      ? maskSensitiveDataInObject(errorData as Record<string, any>)
      : errorData;

    // 실패한 요청 모니터링 기록
    const monitoring = (error.config as any)?.__monitoring;
    if (monitoring) {
      apiMonitoring.recordRequest(monitoring, false, statusCode, isTimeout);
    }

    // 에러 로깅 (요청 ID 포함, 민감한 데이터 마스킹)
    if (import.meta.env.DEV) {
      if (isTimeout) {
        console.warn(`⏱️ API Timeout [${maskedReqId}]: ${sanitizedUrl}`, {
          error: errorMsg,
          errorData: maskedErrorData,
        });
      } else {
        console.error(`❌ API Error [${maskedReqId}] (${statusCode}): ${sanitizedUrl}`, {
          error: errorMsg,
          errorData: maskedErrorData,
        });
      }
    } else {
      // 프로덕션 환경: 간단한 메시지만 로깅
      if (isTimeout) {
        console.warn(`⏱️ API Timeout [${maskedReqId}]: ${sanitizedUrl}`);
      } else {
        console.error(`❌ API Error [${maskedReqId}] (${statusCode}): ${sanitizedUrl}`);
      }
    }

    return Promise.reject(error);
  }
);

// =====================================
// Session API
// =====================================

export const sessionAPI = {
  /**
   * 세션 시작 (자동 재시도 포함)
   */
  start: async (userId: string, counselorId: string): Promise<SessionStartResponse> => {
    const retryResult = await retryWithBackoff(
      async () => {
        const response = await api.post<ApiResponse<SessionStartResponse>>('/api/session/start', {
          userId,
          counselorId,
        });

        if (!response.data.success || !response.data.data) {
          throw new Error(response.data.error?.message || 'Failed to start session');
        }

        return response.data.data;
      },
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
      }
    );

    if (!retryResult.success) {
      throw retryResult.error || new Error(retryResult.lastError || 'Failed to start session');
    }

    return retryResult.data!;
  },

  /**
   * 세션 조회
   */
  get: async (sessionId: string): Promise<Session> => {
    const response = await api.get<ApiResponse<Session>>(`/api/session/${sessionId}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get session');
    }

    return response.data.data;
  },

  /**
   * 세션 일시정지
   */
  pause: async (sessionId: string): Promise<void> => {
    const response = await api.post<ApiResponse>(`/api/session/${sessionId}/pause`);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to pause session');
    }
  },

  /**
   * 세션 재개
   */
  resume: async (sessionId: string): Promise<void> => {
    const response = await api.post<ApiResponse>(`/api/session/${sessionId}/resume`);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to resume session');
    }
  },

  /**
   * 세션 종료 (자동 재시도 포함)
   */
  end: async (sessionId: string): Promise<void> => {
    const retryResult = await retryWithBackoff(
      async () => {
        const response = await api.post<ApiResponse>(`/api/session/${sessionId}/end`);

        if (!response.data.success) {
          throw new Error(response.data.error?.message || 'Failed to end session');
        }
      },
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
      }
    );

    if (!retryResult.success) {
      throw retryResult.error || new Error(retryResult.lastError || 'Failed to end session');
    }
  },

  /**
   * 세션 통계 조회
   */
  getStats: async (): Promise<SessionStats> => {
    const response = await api.get<ApiResponse<SessionStats>>('/api/session/stats/summary');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get session stats');
    }

    return response.data.data;
  },

  /**
   * 세션 리포트 조회
   */
  getReport: async (sessionId: string): Promise<SessionReport> => {
    const response = await api.get<ApiResponse<SessionReport>>(`/api/session/${sessionId}/report`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get session report');
    }

    return response.data.data;
  },

  /**
   * 세션 요약 조회
   */
  getSummary: async (sessionId: string): Promise<any> => {
    const response = await api.get<ApiResponse>(`/api/session/${sessionId}/summary`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get session summary');
    }

    return response.data.data;
  },

  /**
   * 세션 PDF 다운로드 (Blob)
   */
  downloadPdf: async (sessionId: string): Promise<Blob> => {
    const response = await api.get(`/api/session/${sessionId}/report/pdf`, {
      responseType: 'blob'
    });
    return response.data as Blob;
  },

  /**
   * 세션 리포트 요약 조회
   */
  getReportSummary: async (sessionId: string): Promise<any> => {
    const response = await api.get<ApiResponse>(`/api/session/${sessionId}/report/summary`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get report summary');
    }

    return response.data.data;
  },

  /**
   * 세션 CSV 다운로드 (Blob)
   */
  downloadCsv: async (sessionId: string, kind: 'vad' | 'emotion' = 'vad'): Promise<Blob> => {
    const response = await api.get(`/api/session/${sessionId}/report/csv`, {
      params: { kind },
      responseType: 'blob'
    });
    return response.data as Blob;
  },

  /**
   * 세션 피드백 제출
   */
  submitFeedback: async (sessionId: string, feedback: { rating: number; note?: string }): Promise<{ feedbackId: string; sessionId: string; rating: number; submittedAt: string }> => {
    const response = await api.post<ApiResponse<{ feedbackId: string; sessionId: string; rating: number; submittedAt: string }>>(`/api/session/${sessionId}/feedback`, feedback);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to submit feedback');
    }

    return response.data.data;
  },

  /**
   * 1분 단위 타임라인 메트릭 전송 (Phase 9)
   * 매분마다 누적된 메트릭을 서버에 전송
   * 자동 재시도 포함 (exponential backoff)
   */
  tick: async (sessionId: string, timelineCard: any): Promise<{ success: boolean; minuteIndex: number }> => {
    const requestId = `tick_${sessionId}_${timelineCard.minuteIndex}_${Date.now()}`;

    // 중복 제거 및 재시도 로직 적용
    const result = await requestDeduplicator.executeOnce(
      requestId,
      async () => {
        const retryResult = await retryWithBackoff(
          async () => {
            const response = await api.post<ApiResponse<{ success: boolean; minuteIndex: number }>>(
              `/api/session/${sessionId}/tick`,
              {
                ...timelineCard,
                requestId, // For request tracking and deduplication
              },
              {
                headers: {
                  'X-Request-ID': requestId,
                },
              }
            );

            if (!response.data.success || !response.data.data) {
              throw new Error(response.data.error?.message || 'Failed to send timeline metric');
            }

            return response.data.data;
          },
          {
            maxAttempts: 3,
            initialDelayMs: 1000,
            maxDelayMs: 10000,
          }
        );

        if (!retryResult.success) {
          throw retryResult.error || new Error(retryResult.lastError || 'Failed to send timeline metric');
        }

        return retryResult.data!;
      }
    );

    return result;
  },

  /**
   * 배치 타임라인 메트릭 전송 (Phase 9)
   * 여러 분의 메트릭을 한 번에 전송 (네트워크 오류 시 재시도)
   * 자동 재시도 포함 (exponential backoff with jitter: 1s, 3s, 10s)
   *
   * Backend API Spec:
   * - Endpoint: POST /api/session/batch-tick
   * - Body: { sessionId, items: [...] }
   * - Retry: exponential backoff (1s, 3s, 10s) + ±20% jitter
   */
  batchTick: async (sessionId: string, timelineCards: any[]): Promise<{ success: boolean; count: number }> => {
    const requestId = `batch_${sessionId}_${Date.now()}`;

    // 중복 제거 및 재시도 로직 적용
    const result = await requestDeduplicator.executeOnce(
      requestId,
      async () => {
        const retryResult = await retryWithBackoff(
          async () => {
            // Backend 스펙: POST /api/session/batch-tick
            // Body: { sessionId, items }
            const response = await api.post<ApiResponse<{ success: boolean; count: number; batchId: string }>>(
              '/api/session/batch-tick',
              {
                sessionId,
                items: timelineCards,
              },
              {
                headers: {
                  'X-Request-ID': requestId,
                },
              }
            );

            if (!response.data.success || !response.data.data) {
              throw new Error(response.data.error?.message || 'Failed to send batch timeline metrics');
            }

            return response.data.data;
          },
          {
            maxAttempts: 3,
            initialDelayMs: 1000,    // 1초
            maxDelayMs: 10000,       // 10초 (지터 포함)
          }
        );

        if (!retryResult.success) {
          throw retryResult.error || new Error(retryResult.lastError || 'Failed to send batch timeline metrics');
        }

        return retryResult.data!;
      }
    );

    return result;
  },

  /**
   * 장치 점검 (카메라/마이크/네트워크) (Phase 9)
   * 자동 재시도 포함 (exponential backoff)
   */
  checkDevices: async (): Promise<{
    camera: { available: boolean; permission: 'granted' | 'denied' | 'prompt' };
    microphone: { available: boolean; permission: 'granted' | 'denied' | 'prompt' };
    network: { latency: number; bandwidth: number };
  }> => {
    const retryResult = await retryWithBackoff(
      async () => {
        const response = await api.post<
          ApiResponse<{
            camera: { available: boolean; permission: 'granted' | 'denied' | 'prompt' };
            microphone: { available: boolean; permission: 'granted' | 'denied' | 'prompt' };
            network: { latency: number; bandwidth: number };
          }>
        >('/api/session/devices/check', {});

        if (!response.data.success || !response.data.data) {
          throw new Error(response.data.error?.message || 'Failed to check devices');
        }

        return response.data.data;
      },
      {
        maxAttempts: 3,
        initialDelayMs: 800,
        maxDelayMs: 5000,
      }
    );

    if (!retryResult.success) {
      throw retryResult.error || new Error(retryResult.lastError || 'Failed to check devices');
    }

    return retryResult.data!;
  },
};

// =====================================
// STT API
// =====================================

export const sttAPI = {
  /**
   * 음성 텍스트 변환
   */
  transcribe: async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');

    const response = await api.post<ApiResponse<{ text: string }>>('/api/stt/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to transcribe audio');
    }

    return response.data.data.text;
  },
};

// =====================================
// Monitoring API
// =====================================

export const monitoringAPI = {
  /**
   * 에러 통계 조회
   */
  getErrorStats: async (): Promise<any> => {
    const response = await api.get<ApiResponse>('/api/monitoring/error-stats');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get error stats');
    }

    return response.data.data;
  },

  /**
   * 헬스 체크
   */
  healthCheck: async (): Promise<any> => {
    const response = await api.get<ApiResponse>('/api/monitoring/health');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get health status');
    }

    return response.data.data;
  },
};

// =====================================
// Dashboard & User API
// =====================================

export const dashboardAPI = {
  /**
   * 대시보드 요약 조회 (자동 재시도 포함)
   */
  summary: async (): Promise<any> => {
    const retryResult = await retryWithBackoff(
      async () => {
        const response = await api.get<ApiResponse>('/api/dashboard/summary');
        if (!response.data.success || !response.data.data) {
          throw new Error(response.data.error?.message || 'Failed to get dashboard summary');
        }
        return response.data.data;
      },
      {
        maxAttempts: 2,
        initialDelayMs: 1000,
        maxDelayMs: 5000,
      }
    );

    if (!retryResult.success) {
      throw retryResult.error || new Error(retryResult.lastError || 'Failed to get dashboard summary');
    }

    return retryResult.data;
  }
};

export const userAPI = {
  /**
   * 사용자 설정 조회 (자동 재시도 포함)
   */
  getPreferences: async (): Promise<any> => {
    const retryResult = await retryWithBackoff(
      async () => {
        const response = await api.get<ApiResponse>('/api/user/preferences');
        if (!response.data.success) {
          throw new Error(response.data.error?.message || 'Failed to get preferences');
        }
        return response.data.data;
      },
      {
        maxAttempts: 2,
        initialDelayMs: 1000,
        maxDelayMs: 5000,
      }
    );

    if (!retryResult.success) {
      throw retryResult.error || new Error(retryResult.lastError || 'Failed to get preferences');
    }

    return retryResult.data;
  },
  /**
   * 사용자 설정 저장 (자동 재시도 포함)
   */
  setPreferences: async (preferences: any): Promise<any> => {
    const retryResult = await retryWithBackoff(
      async () => {
        const response = await api.put<ApiResponse>('/api/user/preferences', { preferences });
        if (!response.data.success) {
          throw new Error(response.data.error?.message || 'Failed to set preferences');
        }
        return response.data.data;
      },
      {
        maxAttempts: 2,
        initialDelayMs: 1000,
        maxDelayMs: 5000,
      }
    );

    if (!retryResult.success) {
      throw retryResult.error || new Error(retryResult.lastError || 'Failed to set preferences');
    }

    return retryResult.data;
  }
};

// =====================================
// Emotion API
// =====================================

export const emotionAPI = {
  analyze: async (text: string): Promise<{ emotion: string }> => {
    const response = await api.post<ApiResponse<{ emotion: string }>>('/api/emotion', { text });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to analyze emotion');
    }
    return response.data.data;
  }
};

// Export monitoring API for developer console debugging
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).__apiMonitoring = apiMonitoring;
  console.log('🔍 API Monitoring available at window.__apiMonitoring');
  console.log('  __apiMonitoring.getStats() - Overall statistics');
  console.log('  __apiMonitoring.getEndpointStats() - Per-endpoint statistics');
  console.log('  __apiMonitoring.getMetrics() - All recorded metrics');
  console.log('  __apiMonitoring.reset() - Clear metrics');
}

export default api;
