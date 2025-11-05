/**
 * Navigation E2E Tests
 *
 * Tests for basic navigation and routing
 */

import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the home page', async ({ page }) => {
    expect(page.url()).toContain('localhost');
  });

  test('should have visible main content', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible({ timeout: 10000 });
  });

  test('should render without errors', async ({ page }) => {
    let hasErrors = false;
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        hasErrors = true;
      }
    });

    await page.waitForLoadState('networkidle', { timeout: 10000 });
    expect(hasErrors).toBe(false);
  });

  test('should have proper document structure', async ({ page }) => {
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', /(ko|en)/);
  });
});
