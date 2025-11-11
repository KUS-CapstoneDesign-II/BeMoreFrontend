/**
 * Authentication Flow E2E Tests
 *
 * 인증 관련 시나리오 테스트:
 * - 로그인 성공/실패
 * - 회원가입 성공/실패
 * - 토큰 관리 (갱신, 만료)
 * - 로그아웃
 */

import { test, expect } from '@playwright/test';
import { setupMockApiRoutes } from '../../fixtures/mock-api';
import {
  VALID_USER,
  INVALID_USER,
  WRONG_PASSWORD_USER,
  NEW_USER,
  DUPLICATE_EMAIL_USER,
  WEAK_PASSWORD_USER,
} from '../../fixtures/test-users';

// ============================================================================
// Test Configuration
// ============================================================================

const USE_MOCK_API = process.env.VITE_TEST_MODE === 'mock';

// ============================================================================
// Test Suite: Login Flow
// ============================================================================

test.describe('로그인 플로우', () => {
  test.beforeEach(async ({ page }) => {
    if (USE_MOCK_API) {
      await setupMockApiRoutes(page, { loginSuccess: true });
    }
  });

  test('로그인 성공 시나리오', async ({ page }) => {
    await page.goto('/auth/login');

    // 로그인 폼 입력
    await page.fill('input[type="email"]', VALID_USER.email);
    await page.fill('input[type="password"]', VALID_USER.password);

    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');

    // 대시보드로 리다이렉트 확인
    await page.waitForURL('**/app**', { timeout: 5000 });
    expect(page.url()).toContain('/app');

    // 로그인 상태 확인 (사용자 메뉴 또는 프로필 표시)
    const userMenu = page.locator('[data-testid="user-menu-button"]').first();
    const profileButton = page.locator('button').filter({ hasText: /프로필|Profile/i }).first();

    const userMenuVisible = await userMenu.isVisible().catch(() => false);
    const profileVisible = await profileButton.isVisible().catch(() => false);

    expect(userMenuVisible || profileVisible).toBeTruthy();
  });

  test('로그인 실패 시나리오 - 잘못된 비밀번호', async ({ page }) => {
    if (USE_MOCK_API) {
      await setupMockApiRoutes(page, { loginSuccess: false });
    }

    await page.goto('/auth/login');

    // 잘못된 비밀번호로 로그인 시도
    await page.fill('input[type="email"]', WRONG_PASSWORD_USER.email);
    await page.fill('input[type="password"]', WRONG_PASSWORD_USER.password);
    await page.click('button[type="submit"]');

    // 에러 메시지 확인
    const errorMessage = page.locator('text=/이메일 또는 비밀번호가 올바르지 않습니다|Invalid credentials/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // 로그인 페이지에 남아있는지 확인
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/auth/login');
  });

  test('로그인 실패 시나리오 - 존재하지 않는 사용자', async ({ page }) => {
    if (USE_MOCK_API) {
      await setupMockApiRoutes(page, { loginSuccess: false });
    }

    await page.goto('/auth/login');

    // 존재하지 않는 사용자로 로그인 시도
    await page.fill('input[type="email"]', INVALID_USER.email);
    await page.fill('input[type="password"]', INVALID_USER.password);
    await page.click('button[type="submit"]');

    // 에러 메시지 확인
    const errorMessage = page.locator('text=/이메일 또는 비밀번호가 올바르지 않습니다|Invalid credentials|User not found/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('로그인 폼 유효성 검사', async ({ page }) => {
    await page.goto('/auth/login');

    // 빈 폼 제출 시도
    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();

    // 이메일 필드 유효성 검사 메시지 확인
    const emailInput = page.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });
});

// ============================================================================
// Test Suite: Signup Flow
// ============================================================================

test.describe('회원가입 플로우', () => {
  test.beforeEach(async ({ page }) => {
    if (USE_MOCK_API) {
      await setupMockApiRoutes(page, { signupSuccess: true });
    }
  });

  test('회원가입 성공 시나리오', async ({ page }) => {
    await page.goto('/auth/signup');

    // 회원가입 폼 입력
    await page.fill('input[type="email"]', NEW_USER.email);
    await page.fill('input[name="name"], input[placeholder*="이름"], input[placeholder*="Name"]', NEW_USER.name);

    // 비밀번호 입력 (두 개의 필드 찾기)
    const passwordInputs = page.locator('input[type="password"]');
    const passwordCount = await passwordInputs.count();

    if (passwordCount >= 2) {
      // 비밀번호 + 비밀번호 확인
      await passwordInputs.nth(0).fill(NEW_USER.password);
      await passwordInputs.nth(1).fill(NEW_USER.password);
    } else {
      // 비밀번호만
      await passwordInputs.first().fill(NEW_USER.password);
    }

    // 회원가입 버튼 클릭
    const signupButton = page.locator('button[type="submit"]');
    await signupButton.click();

    // 로그인 페이지 또는 대시보드로 리다이렉트 확인
    await page.waitForURL(/\/(auth\/login|app)/, { timeout: 5000 });

    // 성공 메시지 또는 리다이렉트 확인
    const url = page.url();
    expect(url).toMatch(/\/(auth\/login|app)/);
  });

  test('회원가입 실패 시나리오 - 중복 이메일', async ({ page }) => {
    if (USE_MOCK_API) {
      await setupMockApiRoutes(page, { signupSuccess: false });
    }

    await page.goto('/auth/signup');

    // 중복 이메일로 회원가입 시도
    await page.fill('input[type="email"]', DUPLICATE_EMAIL_USER.email);
    await page.fill('input[name="name"], input[placeholder*="이름"]', DUPLICATE_EMAIL_USER.name);

    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.first().fill(DUPLICATE_EMAIL_USER.password);
    if (await passwordInputs.count() >= 2) {
      await passwordInputs.nth(1).fill(DUPLICATE_EMAIL_USER.password);
    }

    await page.click('button[type="submit"]');

    // 에러 메시지 확인
    const errorMessage = page.locator('text=/이미 사용 중인 이메일|Email already exists|already registered/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('회원가입 실패 시나리오 - 약한 비밀번호', async ({ page }) => {
    await page.goto('/auth/signup');

    // 약한 비밀번호로 회원가입 시도
    await page.fill('input[type="email"]', WEAK_PASSWORD_USER.email);
    await page.fill('input[name="name"], input[placeholder*="이름"]', WEAK_PASSWORD_USER.name);

    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.first().fill(WEAK_PASSWORD_USER.password);
    if (await passwordInputs.count() >= 2) {
      await passwordInputs.nth(1).fill(WEAK_PASSWORD_USER.password);
    }

    await page.click('button[type="submit"]');

    // 클라이언트 측 또는 서버 측 유효성 검사 에러 메시지 확인
    const errorMessage = page.locator('text=/비밀번호는|Password must|too weak|at least 8/i');
    const messageVisible = await errorMessage.isVisible().catch(() => false);

    // 에러 메시지가 표시되거나, 폼 제출이 차단되어야 함
    expect(messageVisible).toBeTruthy();
  });

  test('비밀번호 확인 불일치', async ({ page }) => {
    await page.goto('/auth/signup');

    await page.fill('input[type="email"]', NEW_USER.email);
    await page.fill('input[name="name"], input[placeholder*="이름"]', NEW_USER.name);

    const passwordInputs = page.locator('input[type="password"]');
    if (await passwordInputs.count() >= 2) {
      await passwordInputs.nth(0).fill(NEW_USER.password);
      await passwordInputs.nth(1).fill('DifferentPassword123!');

      await page.click('button[type="submit"]');

      // 비밀번호 불일치 에러 메시지
      const errorMessage = page.locator('text=/비밀번호가 일치하지|Passwords do not match|Password mismatch/i');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    }
  });
});

// ============================================================================
// Test Suite: Logout Flow
// ============================================================================

test.describe('로그아웃 플로우', () => {
  test('로그아웃 성공', async ({ page }) => {
    if (USE_MOCK_API) {
      await setupMockApiRoutes(page, { loginSuccess: true });
    }

    // 로그인
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', VALID_USER.email);
    await page.fill('input[type="password"]', VALID_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app**', { timeout: 5000 });

    // 로그아웃
    const userMenuButton = page.locator('[data-testid="user-menu-button"]').first();
    const settingsButton = page.locator('button, a').filter({ hasText: /설정|Settings|Profile/i }).first();

    // 사용자 메뉴 열기
    if (await userMenuButton.isVisible().catch(() => false)) {
      await userMenuButton.click();
    } else if (await settingsButton.isVisible().catch(() => false)) {
      await settingsButton.click();
    }

    // 로그아웃 버튼 클릭
    const logoutButton = page.locator('button, a').filter({ hasText: /로그아웃|Logout|Sign out/i }).first();
    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click();

      // 로그인 페이지로 리다이렉트 확인
      await page.waitForURL('**/auth/login', { timeout: 5000 });
      expect(page.url()).toContain('/auth/login');

      // 로그인 폼 표시 확인
      await expect(page.locator('input[type="email"]')).toBeVisible();
    }
  });

  test('로그아웃 후 보호된 페이지 접근 시 리다이렉트', async ({ page }) => {
    if (USE_MOCK_API) {
      await setupMockApiRoutes(page, { loginSuccess: true });
    }

    // 로그인
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', VALID_USER.email);
    await page.fill('input[type="password"]', VALID_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app**', { timeout: 5000 });

    // 로그아웃
    const userMenuButton = page.locator('[data-testid="user-menu-button"]').first();
    if (await userMenuButton.isVisible().catch(() => false)) {
      await userMenuButton.click();
      const logoutButton = page.locator('button, a').filter({ hasText: /로그아웃|Logout/i }).first();
      if (await logoutButton.isVisible().catch(() => false)) {
        await logoutButton.click();
        await page.waitForURL('**/auth/login', { timeout: 5000 });

        // 보호된 페이지 접근 시도
        await page.goto('/app');

        // 로그인 페이지로 리다이렉트 확인
        await page.waitForURL('**/auth/login', { timeout: 5000 });
        expect(page.url()).toContain('/auth/login');
      }
    }
  });
});

// ============================================================================
// Test Suite: Session Persistence
// ============================================================================

test.describe('세션 유지', () => {
  test('페이지 새로고침 후 로그인 상태 유지', async ({ page }) => {
    if (USE_MOCK_API) {
      await setupMockApiRoutes(page, { loginSuccess: true });
    }

    // 로그인
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', VALID_USER.email);
    await page.fill('input[type="password"]', VALID_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app**', { timeout: 5000 });

    // 페이지 새로고침
    await page.reload();

    // 로그인 상태 유지 확인 (로그인 페이지로 리다이렉트되지 않음)
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/app');
    expect(page.url()).not.toContain('/auth/login');
  });

  test('브라우저 탭 간 세션 공유 (동일 컨텍스트)', async ({ page, context }) => {
    if (USE_MOCK_API) {
      await setupMockApiRoutes(page, { loginSuccess: true });
    }

    // 첫 번째 탭에서 로그인
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', VALID_USER.email);
    await page.fill('input[type="password"]', VALID_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app**', { timeout: 5000 });

    // 새 탭 열기
    const newPage = await context.newPage();
    if (USE_MOCK_API) {
      await setupMockApiRoutes(newPage, { loginSuccess: true });
    }

    // 보호된 페이지로 직접 이동
    await newPage.goto('/app');

    // 로그인 상태 공유 확인 (로그인 페이지로 리다이렉트되지 않음)
    await newPage.waitForTimeout(1000);
    const url = newPage.url();

    // 로그인 상태가 공유되면 /app에 머무름
    expect(url).toContain('/app');
  });
});
