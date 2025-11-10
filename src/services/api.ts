/**
 * API Service (Backward Compatibility Layer)
 *
 * This file maintains backward compatibility by re-exporting
 * all API modules from the new modular structure.
 *
 * New code should import from specific modules:
 * - import { authAPI } from './api/auth.api'
 * - import { sessionAPI } from './api/session.api'
 *
 * Existing code can continue using:
 * - import { authAPI, sessionAPI } from './api'
 */

// Re-export all API modules
export { authAPI } from './api/auth.api';
export { userAPI } from './api/user.api';
export { sessionAPI } from './api/session.api';
export { sttAPI } from './api/stt.api';
export { monitoringAPI } from './api/monitoring.api';
export { dashboardAPI } from './api/dashboard.api';
export { emotionAPI } from './api/emotion.api';

// Re-export shared utilities for backward compatibility
export { apiClient as api, API_BASE_URL } from './shared/apiClient';
export type { ApiResponse, ApiError, ApiResult } from './shared/types';
