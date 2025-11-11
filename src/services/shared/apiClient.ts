import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import { apiMonitoring } from '../../utils/apiMonitoring';
import { initMockAPIInterceptor } from '../../utils/mockAPI';
import {
  generateRequestId,
  getClientVersion,
  getDeviceId,
  parseRateLimitHeaders,
  timestampTracker,
  getCsrfToken,
  sanitizeUrlForLogging,
  maskSensitiveDataInObject,
} from '../../utils/requestTracking';
import { logApiError, getUserFriendlyErrorMessage } from './errorHandler';
import type { ApiResponse } from './types';

// Extend Axios config to include custom properties
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  __requestId?: string;
  __monitoring?: ReturnType<typeof apiMonitoring.startRequest>;
}

// 런타임 주입 환경변수 지원 (on‑prem 대비)
const runtimeEnv =
  (typeof window !== 'undefined'
    ? (window as unknown as { __ENV__?: { API_URL?: string } }).__ENV__
    : undefined) || {};
const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string) ||
  (runtimeEnv.API_URL as string) ||
  (import.meta.env.PROD ? 'https://bemorebackend.onrender.com' : 'http://localhost:8000');

// Axios 인스턴스 생성
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased from 20s to 30s for session end endpoint
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Initialize mock API interceptor if enabled
initMockAPIInterceptor(apiClient);

// =====================================
// Request Interceptor (보안 헤더 자동 추가)
// =====================================

apiClient.interceptors.request.use(
  (config) => {
    // 요청 ID 생성
    const requestId = generateRequestId();
    (config as CustomAxiosRequestConfig).__requestId = requestId;

    // 요청 타임스탬프 추적 시작
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
      const token = localStorage.getItem('bemore_access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {}

    // CSRF 토큰 추가 (POST, PUT, DELETE, PATCH 요청)
    const method = config.method?.toUpperCase();
    if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      try {
        const csrfToken = getCsrfToken();
        config.headers['X-CSRF-Token'] = csrfToken;
      } catch {}
    }

    // 개발 환경 로깅 (민감한 데이터 마스킹)
    if (import.meta.env.DEV) {
      const sanitizedUrl = sanitizeUrlForLogging(config.url || '');
      console.log(`📡 API Request [${requestId}]: ${config.method?.toUpperCase()} ${sanitizedUrl}`);
    }

    // API 모니터링 시작
    const monitoring = apiMonitoring.startRequest(config.url || '', config.method?.toUpperCase());
    (config as CustomAxiosRequestConfig).__monitoring = monitoring;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =====================================
// Response Interceptor (Rate limiting & 보안 헤더 모니터링)
// =====================================

apiClient.interceptors.response.use(
  (response) => {
    // 요청 ID 추적 종료
    const requestId = (response.config as CustomAxiosRequestConfig).__requestId;
    if (requestId) {
      timestampTracker.endRequest(requestId);
    }

    // Rate limiting 헤더 모니터링
    const rateLimitInfo = parseRateLimitHeaders(response.headers);
    if (rateLimitInfo.remaining !== null && rateLimitInfo.remaining < 10) {
      console.warn(
        `⚠️ Rate limit approaching: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} remaining`
      );
    }

    if (import.meta.env.DEV) {
      const sanitizedUrl = sanitizeUrlForLogging(response.config.url || '');
      const maskedData =
        typeof response.data === 'object' && response.data
          ? maskSensitiveDataInObject(response.data as Record<string, unknown>)
          : response.data;

      console.log(`✅ API Response [${requestId}]: ${sanitizedUrl} (${response.status})`, {
        data: maskedData,
        rateLimit: rateLimitInfo,
      });
    }

    // 성공한 요청 모니터링 기록
    const monitoring = (response.config as CustomAxiosRequestConfig).__monitoring;
    if (monitoring) {
      apiMonitoring.recordRequest(monitoring, true, response.status);
    }

    return response;
  },
  (error: AxiosError) => {
    // 요청 ID 추적 종료
    const requestId = (error.config as CustomAxiosRequestConfig | undefined)?.__requestId;
    if (requestId) {
      timestampTracker.endRequest(requestId);
    }

    // 서버 또는 요청에서 제공한 요청 ID 추출
    const serverReqId =
      (error?.response?.data as { error?: { requestId?: string } } | undefined)?.error?.requestId ||
      (error?.response?.headers && error.response.headers['x-request-id']);

    // 에러 로깅
    logApiError(error, requestId, serverReqId);

    // 실패한 요청 모니터링 기록
    const monitoring = (error.config as CustomAxiosRequestConfig | undefined)?.__monitoring;
    const statusCode = error?.response?.status;
    const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
    if (monitoring) {
      apiMonitoring.recordRequest(monitoring, false, statusCode, isTimeout);
    }

    // 사용자 친화적 에러 메시지 추가
    const userMessage = getUserFriendlyErrorMessage(error);
    (error as AxiosError & { userMessage?: string }).userMessage = userMessage;

    return Promise.reject(error);
  }
);

// =====================================
// 401 Token Refresh Interceptor
// =====================================

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null = null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// 401 에러 처리를 위한 별도 인터셉터
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고, 재시도하지 않은 요청인 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      // 로그인/회원가입/토큰갱신 API는 재시도하지 않음
      if (
        originalRequest.url?.includes('/api/auth/login') ||
        originalRequest.url?.includes('/api/auth/signup') ||
        originalRequest.url?.includes('/api/auth/refresh')
      ) {
        return Promise.reject(error);
      }

      // 토큰 갱신 중이 아니면 갱신 시작
      if (!isRefreshing) {
        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem('bemore_refresh_token');

          if (!refreshToken) {
            // Refresh token이 없으면 로그아웃 처리
            localStorage.removeItem('bemore_access_token');
            localStorage.removeItem('bemore_refresh_token');
            localStorage.removeItem('bemore_user');
            processQueue(new Error('No refresh token available'), null);
            window.location.href = '/auth/login';
            return Promise.reject(error);
          }

          // 토큰 갱신 API 호출
          const response = await axios.post<
            ApiResponse<{
              accessToken: string;
              refreshToken: string;
            }>
          >(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });

          if (response.data.success && response.data.data) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;

            // 새 토큰 저장
            localStorage.setItem('bemore_access_token', accessToken);
            localStorage.setItem('bemore_refresh_token', newRefreshToken);

            // Authorization 헤더 업데이트
            originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

            // 대기 중인 요청들 처리
            processQueue(null, accessToken);

            // 원래 요청 재시도
            return apiClient(originalRequest);
          } else {
            throw new Error('Token refresh failed');
          }
        } catch (refreshError) {
          // 토큰 갱신 실패 시 로그아웃
          localStorage.removeItem('bemore_access_token');
          localStorage.removeItem('bemore_refresh_token');
          localStorage.removeItem('bemore_user');
          processQueue(refreshError instanceof Error ? refreshError : new Error('Token refresh failed'), null);
          window.location.href = '/auth/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // 토큰 갱신 중이면 대기열에 추가
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    return Promise.reject(error);
  }
);

// Export base URL for direct use
export { API_BASE_URL };

// Export monitoring API for developer console debugging
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__apiMonitoring = apiMonitoring;
  console.log('🔍 API Monitoring available at window.__apiMonitoring');
  console.log('  __apiMonitoring.getStats() - Overall statistics');
  console.log('  __apiMonitoring.getEndpointStats() - Per-endpoint statistics');
  console.log('  __apiMonitoring.getMetrics() - All recorded metrics');
  console.log('  __apiMonitoring.reset() - Clear metrics');
}
