import { apiClient } from '../shared/apiClient';
import { retryWithBackoff } from '../../utils/retry';
import type { ApiResponse } from '../shared/types';

/**
 * User API
 *
 * User preferences and settings management
 */
export const userAPI = {
  /**
   * 사용자 설정 조회 (자동 재시도 포함)
   */
  getPreferences: async (): Promise<unknown> => {
    const retryResult = await retryWithBackoff(
      async () => {
        const response = await apiClient.get<ApiResponse>('/api/user/preferences');
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
  setPreferences: async (preferences: unknown): Promise<unknown> => {
    const retryResult = await retryWithBackoff(
      async () => {
        const response = await apiClient.put<ApiResponse>('/api/user/preferences', {
          preferences,
        });
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
  },
};
