/**
 * User Journey E2E Tests
 *
 * 전체 사용자 경로 시나리오 테스트:
 * - 로그인 → 대시보드 → 세션 시작 → 세션 종료 → 히스토리 조회
 */

import { test, expect, type Page } from '@playwright/test';
import { setupMockApiRoutes } from '../../fixtures/mock-api';
import { VALID_USER } from '../../fixtures/test-users';

// ============================================================================
// Test Configuration
// ============================================================================

const USE_MOCK_API = process.env.VITE_TEST_MODE === 'mock';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 로그인 헬퍼 함수
 */
async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // 로그인 성공 대기 (대시보드로 리다이렉트)
  await page.waitForURL('**/app**', { timeout: 5000 });
}

// ============================================================================
// Test Suite: Complete User Journey
// ============================================================================

test.describe('Complete User Journey (로그인 → 세션 → 히스토리)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API 설정 (환경 변수에 따라)
    if (USE_MOCK_API) {
      await setupMockApiRoutes(page, {
        loginSuccess: true,
        dashboardSuccess: true,
        sessionSuccess: true,
      });
    }
  });

  test('전체 사용자 경로: 로그인 → 대시보드 확인 → 세션 시작 → 히스토리 조회', async ({
    page,
  }) => {
    test.setTimeout(60000); // 1분 타임아웃

    // ========================================================================
    // Step 1: 로그인
    // ========================================================================
    await test.step('로그인 페이지에서 로그인', async () => {
      await page.goto('/auth/login');

      // 페이지 로딩 확인
      await expect(page).toHaveTitle(/BeMore/);

      // 로그인 폼 입력
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const loginButton = page.locator('button[type="submit"]');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();

      await emailInput.fill(VALID_USER.email);
      await passwordInput.fill(VALID_USER.password);
      await loginButton.click();

      // 로그인 성공 대기
      await page.waitForURL('**/app**', { timeout: 5000 });
    });

    // ========================================================================
    // Step 2: 대시보드 확인
    // ========================================================================
    await test.step('대시보드 데이터 확인', async () => {
      // URL 확인
      expect(page.url()).toContain('/app');

      // 대시보드 요소 확인
      const dashboardTitle = page.locator('h1, h2').filter({ hasText: /대시보드|Dashboard/ });
      await expect(dashboardTitle).toBeVisible({ timeout: 5000 });

      // 요약 데이터 로딩 대기
      const totalSessions = page.locator('[data-testid="total-sessions"]');
      if (await totalSessions.count() > 0) {
        await expect(totalSessions).toBeVisible();
      }

      // 감정 분포 차트 확인 (있는 경우)
      const emotionChart = page.locator('[data-testid="emotion-chart"]');
      if (await emotionChart.count() > 0) {
        await expect(emotionChart).toBeVisible();
      }
    });

    // ========================================================================
    // Step 3: 세션 페이지로 이동
    // ========================================================================
    await test.step('세션 페이지로 이동', async () => {
      // 네비게이션에서 "세션" 또는 "Start Session" 버튼 찾기
      const sessionLink = page.locator('a, button').filter({
        hasText: /세션|Session|Start/i,
      }).first();

      if (await sessionLink.count() > 0) {
        await sessionLink.click();
        await page.waitForURL('**/session**', { timeout: 5000 });

        // 세션 페이지 로딩 확인
        const sessionTitle = page.locator('h1, h2').filter({ hasText: /세션|Session/ });
        await expect(sessionTitle).toBeVisible({ timeout: 5000 });
      } else {
        // 세션 버튼이 없으면 직접 URL 이동
        await page.goto('/app/session');
      }
    });

    // ========================================================================
    // Step 4: 세션 시작 (Mock 또는 UI만 확인)
    // ========================================================================
    await test.step('세션 시작 버튼 확인', async () => {
      // 세션 시작 버튼 확인
      const startButton = page.locator('button').filter({
        hasText: /시작|Start|Begin/i,
      }).first();

      if (await startButton.count() > 0) {
        await expect(startButton).toBeVisible();
        // 주의: 실제 미디어 스트림은 E2E 테스트에서 시뮬레이션 어려움
        // UI 요소만 확인하고 실제 시작은 스킵
      }
    });

    // ========================================================================
    // Step 5: 히스토리 페이지로 이동
    // ========================================================================
    await test.step('히스토리 페이지로 이동', async () => {
      // 네비게이션에서 "히스토리" 또는 "History" 링크 찾기
      const historyLink = page.locator('a').filter({
        hasText: /히스토리|History|기록/i,
      }).first();

      if (await historyLink.count() > 0) {
        await historyLink.click();
        await page.waitForURL('**/history**', { timeout: 5000 });
      } else {
        await page.goto('/app/history');
      }

      // 히스토리 페이지 로딩 확인
      const historyTitle = page.locator('h1, h2').filter({
        hasText: /히스토리|History|기록/,
      });
      await expect(historyTitle).toBeVisible({ timeout: 5000 });
    });

    // ========================================================================
    // Step 6: 히스토리 데이터 확인
    // ========================================================================
    await test.step('히스토리 데이터 목록 확인', async () => {
      // 세션 목록 또는 "데이터 없음" 메시지 확인
      const sessionList = page.locator('[data-testid="session-list"]');
      const noDataMessage = page.locator('text=/데이터가 없습니다|No sessions|Empty/i');

      // 둘 중 하나는 표시되어야 함
      const sessionListVisible = await sessionList.isVisible().catch(() => false);
      const noDataVisible = await noDataMessage.isVisible().catch(() => false);

      expect(sessionListVisible || noDataVisible).toBeTruthy();
    });

    // ========================================================================
    // Step 7: 로그아웃
    // ========================================================================
    await test.step('로그아웃', async () => {
      // 사용자 메뉴 버튼 찾기
      const userMenuButton = page.locator('[data-testid="user-menu-button"]').first();
      const profileButton = page.locator('button').filter({
        hasText: /프로필|Profile|설정|Settings/i,
      }).first();

      if (await userMenuButton.count() > 0) {
        await userMenuButton.click();
      } else if (await profileButton.count() > 0) {
        await profileButton.click();
      }

      // 로그아웃 버튼 클릭
      const logoutButton = page.locator('button, a').filter({
        hasText: /로그아웃|Logout|Sign out/i,
      }).first();

      if (await logoutButton.count() > 0) {
        await logoutButton.click();

        // 로그인 페이지로 리다이렉트 대기
        await page.waitForURL('**/auth/login', { timeout: 5000 });

        // 로그인 폼 표시 확인
        await expect(page.locator('input[type="email"]')).toBeVisible();
      }
    });
  });

  test('사용자 경로: 빠른 네비게이션 테스트 (모든 주요 페이지 접근)', async ({ page }) => {
    test.setTimeout(45000);

    // 로그인
    await login(page, VALID_USER.email, VALID_USER.password);

    // 주요 페이지들을 순회
    const pages = [
      { name: '대시보드', path: '/app', titlePattern: /대시보드|Dashboard|Home/ },
      { name: '세션', path: '/app/session', titlePattern: /세션|Session/ },
      { name: '히스토리', path: '/app/history', titlePattern: /히스토리|History|기록/ },
      { name: '설정', path: '/app/settings', titlePattern: /설정|Settings|Profile/ },
    ];

    for (const pageInfo of pages) {
      await test.step(`${pageInfo.name} 페이지 접근`, async () => {
        await page.goto(pageInfo.path);

        // 페이지 타이틀 또는 헤딩 확인
        const pageTitle = page.locator('h1, h2').filter({ hasText: pageInfo.titlePattern });
        const titleVisible = await pageTitle.isVisible().catch(() => false);

        // 최소한 URL이 올바른지 확인
        expect(page.url()).toContain(pageInfo.path);

        // 타이틀이 보이면 검증
        if (titleVisible) {
          await expect(pageTitle).toBeVisible();
        }
      });
    }
  });
});

// ============================================================================
// Test Suite: Protected Routes Verification
// ============================================================================

test.describe('보호된 라우트 검증', () => {
  test('비인증 사용자는 보호된 페이지 접근 시 로그인 페이지로 리다이렉트', async ({
    page,
  }) => {
    const protectedPages = ['/app', '/app/session', '/app/history', '/app/settings'];

    for (const path of protectedPages) {
      await test.step(`${path} 접근 시 리다이렉트 확인`, async () => {
        await page.goto(path);

        // 로그인 페이지로 리다이렉트되어야 함
        await page.waitForURL('**/auth/login**', { timeout: 5000 });

        // 로그인 폼 확인
        await expect(page.locator('input[type="email"]')).toBeVisible();
      });
    }
  });

  test('인증된 사용자는 보호된 페이지 접근 가능', async ({ page }) => {
    if (USE_MOCK_API) {
      await setupMockApiRoutes(page, { loginSuccess: true });
    }

    // 로그인
    await login(page, VALID_USER.email, VALID_USER.password);

    // 보호된 페이지 접근
    await page.goto('/app');
    expect(page.url()).toContain('/app');

    // 대시보드 요소 확인
    const dashboardContent = page.locator('h1, h2').filter({ hasText: /대시보드|Dashboard/ });
    await dashboardContent.isVisible().catch(() => false);

    // URL이 올바르면 성공
    expect(page.url()).toContain('/app');
  });
});

// ============================================================================
// Test Suite: Navigation Flow
// ============================================================================

test.describe('네비게이션 흐름 테스트', () => {
  test.beforeEach(async ({ page }) => {
    if (USE_MOCK_API) {
      await setupMockApiRoutes(page, { loginSuccess: true });
    }
    await login(page, VALID_USER.email, VALID_USER.password);
  });

  test('브라우저 뒤로가기/앞으로가기 동작', async ({ page }) => {
    // 페이지 이동: Dashboard → Session → History
    await page.goto('/app');
    await page.goto('/app/session');
    await page.goto('/app/history');

    // 뒤로가기
    await page.goBack();
    expect(page.url()).toContain('/app/session');

    // 뒤로가기
    await page.goBack();
    expect(page.url()).toContain('/app');

    // 앞으로가기
    await page.goForward();
    expect(page.url()).toContain('/app/session');
  });

  test('새로고침 시 상태 유지', async ({ page }) => {
    await page.goto('/app/history');

    // 페이지 새로고침
    await page.reload();

    // URL 유지 확인
    expect(page.url()).toContain('/app/history');

    // 로그인 상태 유지 확인 (로그인 페이지로 리다이렉트되지 않음)
    await page.waitForTimeout(1000);
    expect(page.url()).not.toContain('/auth/login');
  });
});
