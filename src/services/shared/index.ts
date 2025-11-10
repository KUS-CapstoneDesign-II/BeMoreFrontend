/**
 * Shared Service Layer
 *
 * Common utilities and types used across all API modules
 */

export { apiClient, API_BASE_URL } from './apiClient';
export { detectCORSError, logApiError } from './errorHandler';
export type {
  ApiResponse,
  ApiError,
  ApiResult,
  RateLimitInfo,
  CORSErrorDetails,
  MonitoringRecord,
} from './types';
