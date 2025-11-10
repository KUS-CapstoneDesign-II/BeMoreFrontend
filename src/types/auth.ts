import type { User } from '../contexts/AuthContext';

// ============================================================================
// Request Types
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UpdateProfileRequest {
  username?: string;
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
    details?: unknown;
  };
}

export type ApiResponse<T> = T | ApiError;

// ============================================================================
// Type Guards
// ============================================================================

export function isApiError(response: unknown): response is ApiError {
  return typeof response === 'object' && response !== null && 'success' in response && response.success === false && 'error' in response;
}

export function isLoginResponse(response: unknown): response is LoginResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === true &&
    'accessToken' in response &&
    'refreshToken' in response &&
    'user' in response
  );
}

export function isSignupResponse(response: unknown): response is SignupResponse {
  return typeof response === 'object' && response !== null && 'success' in response && response.success === true && 'user' in response && !('accessToken' in response);
}

export function isRefreshTokenResponse(response: unknown): response is RefreshTokenResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === true &&
    'accessToken' in response &&
    'refreshToken' in response &&
    !('user' in response)
  );
}
