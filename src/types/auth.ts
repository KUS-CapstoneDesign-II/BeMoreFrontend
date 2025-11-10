import type { User } from '../contexts/AuthContext';

// ============================================================================
// Request Types
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UpdateProfileRequest {
  name?: string;
  profileImage?: string;
}

// ============================================================================
// Response Types
// ============================================================================

export interface LoginResponse {
  success: true;
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface SignupResponse {
  success: true;
  message: string;
  user: User;
}

export interface RefreshTokenResponse {
  success: true;
  accessToken: string;
  refreshToken: string;
}

export interface UpdateProfileResponse {
  success: true;
  message: string;
  user: User;
}

export interface LogoutResponse {
  success: true;
  message: string;
}

export interface MeResponse {
  success: true;
  user: User;
}

// ============================================================================
// Error Types
// ============================================================================

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export type ApiResponse<T> = T | ApiError;

// ============================================================================
// Type Guards
// ============================================================================

export function isApiError(response: any): response is ApiError {
  return response && response.success === false && 'error' in response;
}

export function isLoginResponse(response: any): response is LoginResponse {
  return (
    response &&
    response.success === true &&
    'accessToken' in response &&
    'refreshToken' in response &&
    'user' in response
  );
}

export function isSignupResponse(response: any): response is SignupResponse {
  return response && response.success === true && 'user' in response && !('accessToken' in response);
}

export function isRefreshTokenResponse(response: any): response is RefreshTokenResponse {
  return (
    response &&
    response.success === true &&
    'accessToken' in response &&
    'refreshToken' in response &&
    !('user' in response)
  );
}
