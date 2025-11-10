import { apiClient } from '../shared/apiClient';
import type { ApiResponse } from '../shared/types';

/**
 * Emotion API
 *
 * Emotion analysis endpoints
 */
export const emotionAPI = {
  /**
   * 감정 분석
   */
  analyze: async (text: string): Promise<{ emotion: string }> => {
    const response = await apiClient.post<ApiResponse<{ emotion: string }>>('/api/emotion', {
      text,
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to analyze emotion');
    }

    return response.data.data;
  },
};
