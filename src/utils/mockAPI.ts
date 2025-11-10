/**
 * Mock API Handler for Development
 *
 * Provides mock responses for API endpoints when backend is unavailable
 * Enable via: VITE_ENABLE_MOCK_API=true
 */

import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

interface MockResponse {
  success: boolean;
  data?: unknown;
  error?: {
    message: string;
    code: string;
  };
}

/**
 * Mock responses for different API endpoints
 */
const mockResponses: Record<string, MockResponse> = {
  '/api/user/preferences': {
    success: true,
    data: {
      fontScale: 'md',
      layoutDensity: 'spacious',
      language: 'ko',
      notificationsOptIn: false,
    },
  },
  '/api/dashboard/summary': {
    success: true,
    data: {
      totalSessions: 12,
      completedSessions: 8,
      averageSessionDuration: 2400,
      thisWeekSessions: 3,
      thisMonthSessions: 12,
      lastSessionDate: new Date(Date.now() - 86400000).toISOString(),
      streakDays: 5,
    },
  },
  '/api/monitoring/health': {
    success: true,
    data: {
      status: 'healthy',
      uptime: 99.9,
      version: '1.0.0',
      timestamp: Date.now(),
    },
  },
  '/api/monitoring/error-stats': {
    success: true,
    data: {
      totalErrors: 0,
      recentErrors: [],
      errorRate: 0,
    },
  },
};

/**
 * Check if mock API is enabled
 */
export function isMockAPIEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_MOCK_API === 'true';
}

/**
 * Get mock response for endpoint
 */
export function getMockResponse(url: string): MockResponse | null {
  // Extract path from full URL
  const path = new URL(url, 'http://localhost').pathname;

  // Check if we have a mock response for this endpoint
  if (mockResponses[path]) {
    // Simulate network delay (100-300ms)
    return mockResponses[path];
  }

  return null;
}

/**
 * Simulate API call with mock data
 */
export async function mockAPICall<T = unknown>(
  url: string,
  options?: {
    delay?: number;
    simulateError?: boolean;
  }
): Promise<T> {
  const { delay = Math.random() * 200 + 100, simulateError = false } = options || {};

  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, delay));

  if (simulateError) {
    throw new Error('Mock API Error');
  }

  const mockResponse = getMockResponse(url);
  if (mockResponse) {
    return mockResponse.data as T;
  }

  // Default mock response for unknown endpoints
  return {
    success: true,
    data: {},
  } as T;
}

/**
 * Initialize mock API interceptor for axios
 * This patches axios to use mock responses when backend is unavailable
 */
export function initMockAPIInterceptor(api: AxiosInstance): void {
  if (!isMockAPIEnabled()) {
    return;
  }

  // Store original request method
  const originalRequest = api.request;

  // Patch request method to use mock data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  api.request = async function (config: InternalAxiosRequestConfig): Promise<any> {
    try {
      // Try real API first
      return await originalRequest.call(this, config);
    } catch (error: unknown) {
      // If real API fails and mock is enabled, use mock response
      if (isMockAPIEnabled()) {
        const mockResponse = getMockResponse(config.url || '');
        if (mockResponse) {
          console.log(`📱 Using mock API for: ${config.method?.toUpperCase()} ${config.url}`);

          // Return mock response in axios format
          return {
            status: 200,
            statusText: 'OK (Mock)',
            headers: {},
            config,
            data: mockResponse,
          };
        }
      }

      // Re-throw original error if no mock available
      throw error;
    }
  };

  if (import.meta.env.DEV) {
    console.log('🎭 Mock API Interceptor initialized', {
      enabled: isMockAPIEnabled(),
      endpoints: Object.keys(mockResponses),
    });
  }
}

export default {
  isMockAPIEnabled,
  getMockResponse,
  mockAPICall,
  initMockAPIInterceptor,
};
