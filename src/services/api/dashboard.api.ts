import { apiClient } from '../shared/apiClient';
import { retryWithBackoff } from '../../utils/retry';
import type { ApiResponse } from '../shared/types';

/**
 * Dashboard API
 *
 * Dashboard summary and statistics endpoints
 */
export const dashboardAPI = {
  /**
   * 대시보드 요약 조회 (자동 재시도 포함)
   */
  summary: async (): Promise<unknown> => {
    const retryResult = await retryWithBackoff(
      async () => {
        const response = await apiClient.get<ApiResponse>('/api/dashboard/summary');
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
      throw (
        retryResult.error || new Error(retryResult.lastError || 'Failed to get dashboard summary')
      );
    }

    return retryResult.data;
  },
};
