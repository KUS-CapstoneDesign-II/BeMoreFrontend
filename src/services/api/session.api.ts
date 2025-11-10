import { apiClient } from '../shared/apiClient';
import { retryWithBackoff, requestDeduplicator } from '../../utils/retry';
import type { ApiResponse } from '../shared/types';
import type {
  SessionStartResponse,
  Session,
  SessionReport,
  SessionStats,
} from '../../types';
import type { TimelineCard } from '../../types/session';

/**
 * Session API
 *
 * Session lifecycle, timeline metrics, and report management
 */
export const sessionAPI = {
  /**
   * 세션 시작 (자동 재시도 포함)
   */
  start: async (userId: string, counselorId: string): Promise<SessionStartResponse> => {
    const retryResult = await retryWithBackoff(
      async () => {
        const response = await apiClient.post<ApiResponse<SessionStartResponse>>(
          '/api/session/start',
          {
            userId,
            counselorId,
          }
        );

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
    const response = await apiClient.get<ApiResponse<Session>>(`/api/session/${sessionId}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get session');
    }

    return response.data.data;
  },

  /**
   * 세션 일시정지
   */
  pause: async (sessionId: string): Promise<void> => {
    const response = await apiClient.post<ApiResponse>(`/api/session/${sessionId}/pause`);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to pause session');
    }
  },

  /**
   * 세션 재개
   */
  resume: async (sessionId: string): Promise<void> => {
    const response = await apiClient.post<ApiResponse>(`/api/session/${sessionId}/resume`);

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
        const response = await apiClient.post<ApiResponse>(`/api/session/${sessionId}/end`);

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
    const response = await apiClient.get<ApiResponse<SessionStats>>('/api/session/stats/summary');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get session stats');
    }

    return response.data.data;
  },

  /**
   * 세션 리포트 조회
   */
  getReport: async (sessionId: string): Promise<SessionReport> => {
    const response = await apiClient.get<ApiResponse<SessionReport>>(
      `/api/session/${sessionId}/report`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get session report');
    }

    return response.data.data;
  },

  /**
   * 세션 요약 조회
   */
  getSummary: async (sessionId: string): Promise<unknown> => {
    const response = await apiClient.get<ApiResponse>(`/api/session/${sessionId}/summary`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get session summary');
    }

    return response.data.data;
  },

  /**
   * 세션 PDF 다운로드 (Blob)
   */
  downloadPdf: async (sessionId: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/session/${sessionId}/report/pdf`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  /**
   * 세션 리포트 요약 조회
   */
  getReportSummary: async (sessionId: string): Promise<unknown> => {
    const response = await apiClient.get<ApiResponse>(`/api/session/${sessionId}/report/summary`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get report summary');
    }

    return response.data.data;
  },

  /**
   * 세션 CSV 다운로드 (Blob)
   */
  downloadCsv: async (sessionId: string, kind: 'vad' | 'emotion' = 'vad'): Promise<Blob> => {
    const response = await apiClient.get(`/api/session/${sessionId}/report/csv`, {
      params: { kind },
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  /**
   * 세션 피드백 제출
   */
  submitFeedback: async (
    sessionId: string,
    feedback: { rating: number; note?: string }
  ): Promise<{ feedbackId: string; sessionId: string; rating: number; submittedAt: string }> => {
    const response = await apiClient.post<
      ApiResponse<{ feedbackId: string; sessionId: string; rating: number; submittedAt: string }>
    >(`/api/session/${sessionId}/feedback`, feedback);

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
  tick: async (
    sessionId: string,
    timelineCard: TimelineCard
  ): Promise<{ success: boolean; minuteIndex: number }> => {
    const requestId = `tick_${sessionId}_${timelineCard.minuteIndex}_${Date.now()}`;

    // 중복 제거 및 재시도 로직 적용
    const result = await requestDeduplicator.executeOnce(requestId, async () => {
      const retryResult = await retryWithBackoff(
        async () => {
          const response = await apiClient.post<
            ApiResponse<{ success: boolean; minuteIndex: number }>
          >(
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
        throw (
          retryResult.error || new Error(retryResult.lastError || 'Failed to send timeline metric')
        );
      }

      return retryResult.data!;
    });

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
  batchTick: async (
    sessionId: string,
    timelineCards: TimelineCard[]
  ): Promise<{ success: boolean; count: number }> => {
    const requestId = `batch_${sessionId}_${Date.now()}`;

    // 중복 제거 및 재시도 로직 적용
    const result = await requestDeduplicator.executeOnce(requestId, async () => {
      const retryResult = await retryWithBackoff(
        async () => {
          // Backend 스펙: POST /api/session/batch-tick
          // Body: { sessionId, items }
          const response = await apiClient.post<
            ApiResponse<{ success: boolean; count: number; batchId: string }>
          >(
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
            throw new Error(
              response.data.error?.message || 'Failed to send batch timeline metrics'
            );
          }

          return response.data.data;
        },
        {
          maxAttempts: 3,
          initialDelayMs: 1000, // 1초
          maxDelayMs: 10000, // 10초 (지터 포함)
        }
      );

      if (!retryResult.success) {
        throw (
          retryResult.error ||
          new Error(retryResult.lastError || 'Failed to send batch timeline metrics')
        );
      }

      return retryResult.data!;
    });

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
        const response = await apiClient.post<
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
