import axios from 'axios';
import type {
  ApiResponse,
  SessionStartResponse,
  Session,
  SessionReport,
  SessionStats,
} from '../types';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error(`❌ API Error: ${error.config?.url}`, error.message);
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

export default api;
