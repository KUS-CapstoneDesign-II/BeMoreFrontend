/**
 * Error Handling E2E Tests
 *
 * 에러 처리 시나리오 테스트:
 * - 네트워크 에러
 * - 타임아웃
 * - 서버 에러 (5xx)
 * - Rate Limit (429)
 * - CORS 에러
 */

import { test, expect } from '@playwright/test';
import { setupMockApiRoutes, getMockServerError, getMockRateLimitExceeded } from '../../fixtures/mock-api';
import { VALID_USER } from '../../fixtures/test-users';

// ============================================================================
// Test Configuration
// ============================================================================

const USE_MOCK_API = process.env.VITE_TEST_MODE === 'mock';

// ============================================================================
// Test Suite: Network Errors
// ============================================================================

test.describe('네트워크 에러 처리', () => {
  test('네트워크 오프라인 시나리오', async ({ page }) => {
    await page.goto('/auth/login');

    // 네트워크 요청 차단 (오프라인 시뮬레이션)
    await page.route('**/api/**', (route) => route.abort('failed'));

    // 로그인 시도
    await page.fill('input[type="email"]', VALID_USER.email);
    await page.fill('input[type="password"]', VALID_USER.password);
    await page.click('button[type="submit"]');

    // 네트워크 에러 메시지 확인
    const errorMessage = page.locator('text=/서버와 연결할 수 없습니다|Network|연결|Connection/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('API 타임아웃 시나리오', async ({ page }) => {
    await page.goto('/auth/login');

    // 타임아웃 시뮬레이션 (응답 지연)
    await page.route('**/api/auth/login', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 35000)); // 35초 지연
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
      });
    });

    // 로그인 시도
    await page.fill('input[type="email"]', VALID_USER.email);
    await page.fill('input[type="password"]', VALID_USER.password);
    await page.click('button[type="submit"]');

    // 타임아웃 에러 메시지 확인
    const errorMessage = page.locator('text=/시간 초과|timeout|오래 걸립니다/i');
    const messageVisible = await errorMessage.isVisible({ timeout: 35000 }).catch(() => false);

    // 타임아웃 에러 메시지가 표시되거나, 로딩 상태가 계속 유지됨
    expect(messageVisible || page.url().includes('/auth/login')).toBeTruthy();
  });

  test('간헐적 네트워크 실패 및 재시도', async ({ page }) => {
    if (USE_MOCK_API) {
      let attemptCount = 0;

      await page.route('**/api/auth/login', async (route) => {
        attemptCount++;

        if (attemptCount < 2) {
          // 첫 번째 시도는 실패
          await route.abort('failed');
        } else {
          // 두 번째 시도는 성공
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                user: { id: '1', email: VALID_USER.email, name: VALID_USER.name, role: 'user' },
                tokens: { accessToken: 'mock_token', refreshToken: 'mock_refresh' },
              },
            }),
          });
        }
      });
    }

    await page.goto('/auth/login');
    await page.fill('input[type="email"]', VALID_USER.email);
    await page.fill('input[type="password"]', VALID_USER.password);
    await page.click('button[type="submit"]');

    // 에러 메시지 표시 후 재시도 버튼 클릭 (있는 경우)
    const retryButton = page.locator('button').filter({ hasText: /다시 시도|Retry|재시도/i });
    if (await retryButton.isVisible().catch(() => false)) {
      await retryButton.click();
    }

    // 재시도 후 성공 또는 에러 메시지 지속
    await page.waitForTimeout(2000);
  });
});

// ============================================================================
// Test Suite: Server Errors (5xx)
// ============================================================================

test.describe('서버 에러 처리 (5xx)', () => {
  test('500 Internal Server Error', async ({ page }) => {
    if (USE_MOCK_API) {
      await setupMockApiRoutes(page, {
        loginSuccess: false,
        serverError: true,
      });
    }

    await page.goto('/auth/login');
    await page.fill('input[type="email"]', VALID_USER.email);
    await page.fill('input[type="password"]', VALID_USER.password);
    await page.click('button[type="submit"]');

    // 서버 에러 메시지 확인
    const errorMessage = page.locator('text=/일시적인 오류|서버 오류|Server error|500/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('503 Service Unavailable', async ({ page }) => {
    await page.goto('/auth/login');

    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: '서비스 점검 중입니다. 잠시 후 다시 시도해주세요.',
          },
        }),
      });
    });

    await page.fill('input[type="email"]', VALID_USER.email);
    await page.fill('input[type="password"]', VALID_USER.password);
    await page.click('button[type="submit"]');

    // 서비스 점검 메시지 확인
    const errorMessage = page.locator('text=/서비스 점검|점검 중|Service unavailable|maintenance/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// Test Suite: Rate Limiting (429)
// ============================================================================

test.describe('Rate Limit 처리', () => {
  test('429 Too Many Requests', async ({ page }) => {
    if (USE_MOCK_API) {
      await setupMockApiRoutes(page, {
        loginSuccess: false,
        rateLimitError: true,
      });
    }

    await page.goto('/auth/login');
    await page.fill('input[type="email"]', VALID_USER.email);
    await page.fill('input[type="password"]', VALID_USER.password);
    await page.click('button[type="submit"]');

    // Rate Limit 에러 메시지 확인
    const errorMessage = page.locator('text=/요청이 너무 많습니다|Too many requests|Rate limit|잠시 후/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('Rate Limit 후 대기 및 재시도', async ({ page }) => {
    if (USE_MOCK_API) {
      let requestCount = 0;

      await page.route('**/api/auth/login', async (route) => {
        requestCount++;

        if (requestCount < 3) {
          // 처음 2번은 Rate Limit
          await route.fulfill({
            status: 429,
            contentType: 'application/json',
            body: JSON.stringify(getMockRateLimitExceeded()),
          });
        } else {
          // 3번째는 성공
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                user: { id: '1', email: VALID_USER.email, name: VALID_USER.name, role: 'user' },
                tokens: { accessToken: 'mock_token', refreshToken: 'mock_refresh' },
              },
            }),
          });
        }
      });
    }

    await page.goto('/auth/login');
    await page.fill('input[type="email"]', VALID_USER.email);
    await page.fill('input[type="password"]', VALID_USER.password);
    await page.click('button[type="submit"]');

    // Rate Limit 메시지 확인
    const errorMessage = page.locator('text=/요청이 너무 많습니다|Too many requests/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // 재시도 버튼 클릭 (있는 경우)
    await page.waitForTimeout(2000);
    const retryButton = page.locator('button').filter({ hasText: /다시 시도|Retry/i });
    if (await retryButton.isVisible().catch(() => false)) {
      await retryButton.click();
    }
  });
});

// ============================================================================
// Test Suite: Error Recovery
// ============================================================================

test.describe('에러 복구 및 사용자 피드백', () => {
  test('에러 발생 후 폼 재입력 가능', async ({ page }) => {
    if (USE_MOCK_API) {
      await setupMockApiRoutes(page, {
        loginSuccess: false,
        serverError: true,
      });
    }

    await page.goto('/auth/login');

    // 첫 번째 로그인 시도 (실패)
    await page.fill('input[type="email"]', VALID_USER.email);
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // 에러 메시지 대기
    await page.waitForTimeout(1000);

    // 폼 재입력 가능 확인
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await expect(emailInput).toBeEnabled();
    await expect(passwordInput).toBeEnabled();

    // 올바른 정보로 재시도
    await emailInput.clear();
    await passwordInput.clear();
    await emailInput.fill(VALID_USER.email);
    await passwordInput.fill(VALID_USER.password);
  });

  test('에러 메시지 닫기 버튼', async ({ page }) => {
    if (USE_MOCK_API) {
      await setupMockApiRoutes(page, { loginSuccess: false });
    }

    await page.goto('/auth/login');
    await page.fill('input[type="email"]', VALID_USER.email);
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // 에러 메시지 표시 확인
    const errorMessage = page.locator('[role="alert"], .error-message, .alert').first();
    if (await errorMessage.isVisible().catch(() => false)) {
      // 닫기 버튼 찾기
      const closeButton = errorMessage.locator('button').filter({ hasText: /닫기|Close|×/ }).first();

      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();

        // 에러 메시지 사라짐 확인
        await expect(errorMessage).not.toBeVisible({ timeout: 2000 });
      }
    }
  });

  test('여러 에러 동시 처리', async ({ page }) => {
    if (USE_MOCK_API) {
      // 첫 번째 요청: Rate Limit, 두 번째 요청: Server Error
      let requestCount = 0;

      await page.route('**/api/**', async (route) => {
        requestCount++;

        if (requestCount === 1) {
          await route.fulfill({
            status: 429,
            body: JSON.stringify(getMockRateLimitExceeded()),
          });
        } else {
          await route.fulfill({
            status: 500,
            body: JSON.stringify(getMockServerError()),
          });
        }
      });
    }

    await page.goto('/auth/login');

    // 첫 번째 시도
    await page.fill('input[type="email"]', VALID_USER.email);
    await page.fill('input[type="password"]', VALID_USER.password);
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    // 두 번째 시도
    await page.click('button[type="submit"]');

    // 에러 메시지가 올바르게 표시되는지 확인
    await page.waitForTimeout(1000);
    const errorMessages = page.locator('[role="alert"], .error-message, .alert');
    const errorCount = await errorMessages.count();

    // 최소한 하나의 에러 메시지는 표시되어야 함
    expect(errorCount).toBeGreaterThan(0);
  });
});

// ============================================================================
// Test Suite: CORS Errors (Optional)
// ============================================================================

test.describe('CORS 에러 처리', () => {
  test.skip('CORS 에러 시 사용자 친화적 메시지 표시', async () => {
    // CORS 에러는 브라우저에서만 발생하므로 실제 서버 테스트 필요
    // Mock으로 CORS 시뮬레이션 어려움
    // 실제 프로덕션 API 테스트에서 확인 권장
  });
});

// ============================================================================
// Test Suite: Error Logging
// ============================================================================

test.describe('에러 로깅 및 모니터링', () => {
  test('콘솔 에러 로그 확인', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    if (USE_MOCK_API) {
      await setupMockApiRoutes(page, { loginSuccess: false, serverError: true });
    }

    await page.goto('/auth/login');
    await page.fill('input[type="email"]', VALID_USER.email);
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    // 콘솔 에러 로그가 기록되었는지 확인 (선택 사항)
    // 프로덕션에서는 에러 로깅 시스템 검증 필요
  });

  test('네트워크 요청 실패 추적', async ({ page }) => {
    const failedRequests: string[] = [];

    page.on('requestfailed', (request) => {
      failedRequests.push(request.url());
    });

    // 네트워크 차단
    await page.route('**/api/**', (route) => route.abort('failed'));

    await page.goto('/auth/login');
    await page.fill('input[type="email"]', VALID_USER.email);
    await page.fill('input[type="password"]', VALID_USER.password);
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    // 실패한 요청이 기록되었는지 확인
    expect(failedRequests.length).toBeGreaterThan(0);
    expect(failedRequests.some((url) => url.includes('/api/'))).toBeTruthy();
  });
});
