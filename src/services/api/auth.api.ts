import { apiClient } from '../shared/apiClient';
import type { ApiResponse } from '../shared/types';

/**
 * Auth API
 *
 * Authentication and user profile management endpoints
 */
export const authAPI = {
  /**
   * 로그인
   */
  login: async (
    email: string,
    password: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: number;
      username: string;
      email: string;
      profileImage?: string;
    };
  }> => {
    const response = await apiClient.post<
      ApiResponse<{
        accessToken: string;
        refreshToken: string;
        user: {
          id: number;
          username: string;
          email: string;
          profileImage?: string;
        };
      }>
    >('/api/auth/login', { email, password });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '로그인에 실패했습니다');
    }

    return response.data.data;
  },

  /**
   * 회원가입
   */
  signup: async (
    email: string,
    password: string,
    username: string
  ): Promise<{
    user: {
      id: number;
      username: string;
      email: string;
      profileImage?: string;
    };
  }> => {
    const response = await apiClient.post<
      ApiResponse<{
        user: {
          id: number;
          username: string;
          email: string;
          profileImage?: string;
        };
      }>
    >('/api/auth/signup', { username, email, password });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '회원가입에 실패했습니다');
    }

    return response.data.data;
  },

  /**
   * 로그아웃
   */
  logout: async (): Promise<void> => {
    const response = await apiClient.post<ApiResponse>('/api/auth/logout');

    if (!response.data.success) {
      throw new Error(response.data.error?.message || '로그아웃에 실패했습니다');
    }
  },

  /**
   * 프로필 업데이트
   */
  updateProfile: async (data: {
    username?: string;
    profileImage?: string;
  }): Promise<{
    user: {
      id: number;
      username: string;
      email: string;
      profileImage?: string;
    };
  }> => {
    const response = await apiClient.put<
      ApiResponse<{
        user: {
          id: number;
          username: string;
          email: string;
          profileImage?: string;
        };
      }>
    >('/api/auth/profile', data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '프로필 업데이트에 실패했습니다');
    }

    return response.data.data;
  },

  /**
   * 토큰 갱신
   */
  refreshToken: async (refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> => {
    const response = await apiClient.post<
      ApiResponse<{
        accessToken: string;
        refreshToken: string;
      }>
    >('/api/auth/refresh', { refreshToken });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '토큰 갱신에 실패했습니다');
    }

    return response.data.data;
  },

  /**
   * 현재 사용자 정보 조회
   */
  me: async (): Promise<{
    user: {
      id: number;
      username: string;
      email: string;
      profileImage?: string;
    };
  }> => {
    const response = await apiClient.get<
      ApiResponse<{
        user: {
          id: number;
          username: string;
          email: string;
          profileImage?: string;
        };
      }>
    >('/api/auth/me');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '사용자 정보 조회에 실패했습니다');
    }

    return response.data.data;
  },
};
