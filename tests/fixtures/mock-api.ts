/**
 * Mock API Responses
 *
 * E2E 테스트에서 사용할 Mock API 응답 데이터 및 Playwright route mocking 헬퍼
 */

import type { Page, Route } from '@playwright/test';
import { generateMockToken, VALID_USER, type TestUser } from './test-users';

// ============================================================================
// Mock API Response Types
// ============================================================================

export interface MockApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface DashboardSummary {
  totalSessions: number;
  averageEmotionScore: number;
  recentSessions: Array<{
    id: string;
    date: string;
    emotionScore: number;
    duration: number;
  }>;
  emotionDistribution: Record<string, number>;
}

export interface SessionData {
  id: string;
  userId: string;
  startTime: string;
  endTime: string | null;
  emotionData: Array<{
    timestamp: number;
    emotion: string;
    score: number;
  }>;
  vadData: Array<{
    timestamp: number;
    vad: number;
  }>;
  summary?: {
    primaryEmotion: string;
    averageVad: number;
    insights: string[];
  };
}

// ============================================================================
// Mock API Responses
// ============================================================================

/**
 * 로그인 성공 응답
 */
export function getMockLoginSuccess(user: TestUser = VALID_USER): MockApiResponse<AuthResponse> {
  return {
    success: true,
    data: {
      user: {
        id: `user_${Date.now()}`,
        email: user.email,
        name: user.name,
        role: user.role || 'user',
      },
      tokens: {
        accessToken: generateMockToken(user),
        refreshToken: `refresh_${generateMockToken(user)}`,
      },
    },
  };
}

/**
 * 로그인 실패 응답 (401 Unauthorized)
 */
export function getMockLoginFailure(): MockApiResponse {
  return {
    success: false,
    error: {
      code: 'INVALID_CREDENTIALS',
      message: '이메일 또는 비밀번호가 올바르지 않습니다.',
    },
  };
}

/**
 * 회원가입 성공 응답
 */
export function getMockSignupSuccess(user: TestUser): MockApiResponse<AuthResponse> {
  return getMockLoginSuccess(user);
}

/**
 * 회원가입 실패 응답 - 중복 이메일 (409 Conflict)
 */
export function getMockSignupDuplicateEmail(): MockApiResponse {
  return {
    success: false,
    error: {
      code: 'EMAIL_ALREADY_EXISTS',
      message: '이미 사용 중인 이메일입니다.',
    },
  };
}

/**
 * 회원가입 실패 응답 - 약한 비밀번호 (400 Bad Request)
 */
export function getMockSignupWeakPassword(): MockApiResponse {
  return {
    success: false,
    error: {
      code: 'WEAK_PASSWORD',
      message: '비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다.',
    },
  };
}

/**
 * 대시보드 요약 데이터
 */
export function getMockDashboardSummary(): MockApiResponse<DashboardSummary> {
  return {
    success: true,
    data: {
      totalSessions: 12,
      averageEmotionScore: 0.72,
      recentSessions: [
        {
          id: 'session_1',
          date: new Date(Date.now() - 86400000).toISOString(),
          emotionScore: 0.75,
          duration: 1800,
        },
        {
          id: 'session_2',
          date: new Date(Date.now() - 172800000).toISOString(),
          emotionScore: 0.68,
          duration: 2100,
        },
        {
          id: 'session_3',
          date: new Date(Date.now() - 259200000).toISOString(),
          emotionScore: 0.73,
          duration: 1650,
        },
      ],
      emotionDistribution: {
        happy: 0.35,
        neutral: 0.25,
        sad: 0.15,
        angry: 0.10,
        anxious: 0.08,
        surprised: 0.04,
        disgusted: 0.02,
        fearful: 0.01,
      },
    },
  };
}

/**
 * 세션 데이터
 */
export function getMockSessionData(sessionId: string): MockApiResponse<SessionData> {
  return {
    success: true,
    data: {
      id: sessionId,
      userId: 'user_123',
      startTime: new Date(Date.now() - 3600000).toISOString(),
      endTime: new Date().toISOString(),
      emotionData: [
        { timestamp: 0, emotion: 'neutral', score: 0.85 },
        { timestamp: 30, emotion: 'happy', score: 0.72 },
        { timestamp: 60, emotion: 'happy', score: 0.78 },
        { timestamp: 90, emotion: 'neutral', score: 0.68 },
      ],
      vadData: [
        { timestamp: 0, vad: 0.5 },
        { timestamp: 30, vad: 0.7 },
        { timestamp: 60, vad: 0.8 },
        { timestamp: 90, vad: 0.6 },
      ],
      summary: {
        primaryEmotion: 'happy',
        averageVad: 0.65,
        insights: [
          '전반적으로 긍정적인 감정 상태를 유지했습니다.',
          '대화 중반부에 가장 활발한 모습을 보였습니다.',
        ],
      },
    },
  };
}

/**
 * Rate Limit 초과 응답 (429 Too Many Requests)
 */
export function getMockRateLimitExceeded(): MockApiResponse {
  return {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    },
  };
}

/**
 * 서버 에러 응답 (500 Internal Server Error)
 */
export function getMockServerError(): MockApiResponse {
  return {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    },
  };
}

/**
 * 네트워크 에러 (타임아웃)
 */
export function getMockNetworkError(): Error {
  return new Error('Network request failed');
}

// ============================================================================
// Playwright Route Mocking Helpers
// ============================================================================

/**
 * API 엔드포인트별 Mock 응답 설정
 */
export interface MockApiConfig {
  loginSuccess?: boolean;
  signupSuccess?: boolean;
  dashboardSuccess?: boolean;
  sessionSuccess?: boolean;
  networkError?: boolean;
  serverError?: boolean;
  rateLimitError?: boolean;
  responseDelay?: number; // 응답 지연 시간 (ms)
}

/**
 * Playwright Page에 Mock API Routes 설정
 *
 * @param page - Playwright Page 객체
 * @param config - Mock API 설정
 */
export async function setupMockApiRoutes(
  page: Page,
  config: MockApiConfig = {}
): Promise<void> {
  const {
    loginSuccess = true,
    signupSuccess = true,
    dashboardSuccess = true,
    sessionSuccess = true,
    networkError = false,
    serverError = false,
    rateLimitError = false,
    responseDelay = 0,
  } = config;

  // 네트워크 에러 시뮬레이션
  if (networkError) {
    await page.route('**/api/**', (route) => route.abort('failed'));
    return;
  }

  // 로그인 API
  await page.route('**/api/auth/login', async (route: Route) => {
    await delay(responseDelay);

    if (rateLimitError) {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify(getMockRateLimitExceeded()),
      });
      return;
    }

    if (serverError) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify(getMockServerError()),
      });
      return;
    }

    if (loginSuccess) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(getMockLoginSuccess()),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify(getMockLoginFailure()),
      });
    }
  });

  // 회원가입 API
  await page.route('**/api/auth/signup', async (route: Route) => {
    await delay(responseDelay);

    if (signupSuccess) {
      const request = route.request();
      const postData = request.postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(getMockSignupSuccess(postData)),
      });
    } else {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify(getMockSignupDuplicateEmail()),
      });
    }
  });

  // 대시보드 API
  await page.route('**/api/dashboard/summary', async (route: Route) => {
    await delay(responseDelay);

    if (dashboardSuccess) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(getMockDashboardSummary()),
      });
    } else {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify(getMockServerError()),
      });
    }
  });

  // 세션 API
  await page.route('**/api/session/**', async (route: Route) => {
    await delay(responseDelay);

    if (sessionSuccess) {
      const url = route.request().url();
      const sessionId = url.split('/').pop() || 'session_1';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(getMockSessionData(sessionId)),
      });
    } else {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify(getMockServerError()),
      });
    }
  });

  // Analytics API (Feature Flag에 따라 활성화/비활성화)
  await page.route('**/api/analytics/**', async (route: Route) => {
    await delay(responseDelay);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Metric received' }),
    });
  });
}

/**
 * 지연 헬퍼 함수
 */
function delay(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock API 비활성화 (실제 API 사용)
 */
export async function disableMockApi(page: Page): Promise<void> {
  await page.unroute('**/api/**');
}

/**
 * 특정 엔드포인트만 Mock 설정
 */
export async function mockSpecificEndpoint(
  page: Page,
  endpoint: string,
  response: MockApiResponse,
  statusCode = 200
): Promise<void> {
  await page.route(`**${endpoint}`, async (route: Route) => {
    await route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}
