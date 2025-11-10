/**
 * API Module Exports
 *
 * Consolidated exports for all API domains
 */

export { authAPI } from './auth.api';
export { userAPI } from './user.api';
export { sessionAPI } from './session.api';
export { sttAPI } from './stt.api';
export { monitoringAPI } from './monitoring.api';
export { dashboardAPI } from './dashboard.api';
export { emotionAPI } from './emotion.api';

// Re-export shared types for convenience
export type { ApiResponse, ApiError, ApiResult } from '../shared/types';
