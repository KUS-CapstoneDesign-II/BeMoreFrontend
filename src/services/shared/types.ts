/**
 * Shared types for Service Layer
 */

/**
 * Standard API Response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code?: string;
    message: string;
    requestId?: string;
  };
  message?: string;
  timestamp?: number;
}

/**
 * API Error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
}

/**
 * Result type for explicit success/failure handling
 */
export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

/**
 * Rate Limit Information
 */
export interface RateLimitInfo {
  limit: number | null;
  remaining: number | null;
  reset: number | null;
}

/**
 * CORS Error Details
 */
export interface CORSErrorDetails {
  isCORS: boolean;
  details?: 'preflight-failed' | 'missing-cors-header';
}

/**
 * API Monitoring Record
 */
export interface MonitoringRecord {
  endpoint: string;
  method: string;
  startTime: number;
}
