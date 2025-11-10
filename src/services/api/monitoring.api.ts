import { apiClient } from '../shared/apiClient';
import type { ApiResponse } from '../shared/types';

/**
 * Monitoring API
 *
 * System health and error statistics endpoints
 */
export const monitoringAPI = {
  /**
   * 에러 통계 조회
   */
  getErrorStats: async (): Promise<any> => {
    const response = await apiClient.get<ApiResponse>('/api/monitoring/error-stats');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get error stats');
    }

    return response.data.data;
  },

  /**
   * 헬스 체크
   */
  healthCheck: async (): Promise<any> => {
    const response = await apiClient.get<ApiResponse>('/api/monitoring/health');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get health status');
    }

    return response.data.data;
  },
};
