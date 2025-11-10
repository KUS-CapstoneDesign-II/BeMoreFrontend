import { apiClient } from '../shared/apiClient';
import type { ApiResponse } from '../shared/types';

/**
 * STT (Speech-to-Text) API
 *
 * Voice transcription endpoints
 */
export const sttAPI = {
  /**
   * 음성 텍스트 변환
   */
  transcribe: async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');

    const response = await apiClient.post<ApiResponse<{ text: string }>>(
      '/api/stt/transcribe',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to transcribe audio');
    }

    return response.data.data.text;
  },
};
