import axios from 'axios';
import { apiMonitoring } from '../utils/apiMonitoring';
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
  timeout: 20000, // Increased from 10s to 20s for slower API endpoints
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    // 간단한 요청 로깅 (개발 환경에서만 상세)
    if (import.meta.env.DEV) {
      console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }

    // API 모니터링 시작
    const monitoring = apiMonitoring.startRequest(config.url || '', config.method?.toUpperCase());
    (config as any).__monitoring = monitoring;

    try {
      const token = localStorage.getItem('bemore_token');
      if (token) {
        config.headers = config.headers || {};
        (config.headers as any)['Authorization'] = `Bearer ${token}`;
      }
      // Note: avoid custom headers that can trigger CORS preflight failures
    } catch {}
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.url} (${response.status})`, response.data);
    }

    // 성공한 요청 모니터링 기록
    const monitoring = (response.config as any).__monitoring;
    if (monitoring) {
      apiMonitoring.recordRequest(monitoring, true, response.status);
    }

    return response;
  },
  (error) => {
    let errorMsg = error.message;

    // Add request ID if available
    try {
      const reqId = error?.response?.data?.error?.requestId || (error?.response?.headers && (error.response.headers as any)['x-request-id']);
      if (reqId) {
        errorMsg = `${errorMsg} [${reqId}]`;
      }
    } catch {}

    // More detailed error logging
    const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
    const statusCode = error?.response?.status || 'unknown';
    const endpoint = error.config?.url || 'unknown';

    // 실패한 요청 모니터링 기록
    const monitoring = (error.config as any)?.__monitoring;
    if (monitoring) {
      apiMonitoring.recordRequest(monitoring, false, statusCode, isTimeout);
    }

    if (isTimeout) {
      console.warn(`⏱️ API Timeout (${statusCode}): ${endpoint} - ${errorMsg}`);
    } else {
      console.error(`❌ API Error (${statusCode}): ${endpoint} - ${errorMsg}`);
    }

    return Promise.reject(error);
  }
);

// =====================================
// Session API
// =====================================

export const sessionAPI = {
  /**
   * 세션 시작
   */
  start: async (userId: string, counselorId: string): Promise<SessionStartResponse> => {
    const response = await api.post<ApiResponse<SessionStartResponse>>('/api/session/start', {
      userId,
      counselorId,
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to start session');
    }

    return response.data.data;
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
   * 세션 종료
   */
  end: async (sessionId: string): Promise<void> => {
    const response = await api.post<ApiResponse>(`/api/session/${sessionId}/end`);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to end session');
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
  summary: async (): Promise<any> => {
    const response = await api.get<ApiResponse>('/api/dashboard/summary');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get dashboard summary');
    }
    return response.data.data;
  }
};

export const userAPI = {
  getPreferences: async (): Promise<any> => {
    const response = await api.get<ApiResponse>('/api/user/preferences');
    if (!response.data.success) throw new Error(response.data.error?.message || 'Failed to get preferences');
    return response.data.data;
  },
  setPreferences: async (preferences: any): Promise<any> => {
    const response = await api.put<ApiResponse>('/api/user/preferences', { preferences });
    if (!response.data.success) throw new Error(response.data.error?.message || 'Failed to set preferences');
    return response.data.data;
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
