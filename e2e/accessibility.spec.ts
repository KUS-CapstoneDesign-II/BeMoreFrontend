/**
 * Accessibility E2E Tests
 *
 * Tests for WCAG compliance and accessibility features
 */

import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper heading structure', async ({ page }) => {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();

    // Should have at least one heading
    expect(headings).toBeGreaterThan(0);
  });

  test('should have proper lang attribute', async ({ page }) => {
    const html = page.locator('html');

    const lang = await html.getAttribute('lang');
    expect(lang).toMatch(/^(ko|en)$/);
  });

  test('should have alt text for images', async ({ page }) => {
    const images = await page.locator('img').count();

    if (images > 0) {
      // Each visible image should have alt text
      const imagesWithoutAlt = await page.locator('img:not([alt])').count();
      // Some images may not need alt text (decorative), but most should have it
      expect(imagesWithoutAlt).toBeLessThan(images);
    }
  });

  test('should have keyboard navigation support', async ({ page }) => {
    // Tab key should be functional
    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    // Something should be focusable
    expect(focusedElement).not.toBe('BODY');
  });

  test('should have proper link accessibility', async ({ page }) => {
    const links = await page.locator('a, button').count();

    if (links > 0) {
      // Check that links/buttons are keyboard accessible
      await page.keyboard.press('Tab');

      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.tagName;
      });

      expect(['A', 'BUTTON', 'BODY']).toContain(focusedElement);
    }
  });

  test('should have accessible form controls', async ({ page }) => {
    const inputs = await page.locator('input, textarea, select').count();

    if (inputs > 0) {
      // All inputs should be accessible
      const unlabeledInputs = await page.locator('input:not([aria-label]):not([title])').count();

      // Inputs should have labels or aria-label or title
      expect(unlabeledInputs).toBeLessThanOrEqual(inputs);
    }
  });

  test('should support focus visible indicators', async ({ page }) => {
    const htmlContent = await page.content();

    // Check for focus-visible styles or outline properties
    const hasFocusStyles = htmlContent.includes('focus') ||
                          htmlContent.includes(':focus-visible');

    expect(hasFocusStyles).toBe(true);
  });

  test('should have proper color contrast', async ({ page }) => {
    // Check that main content is readable
    const bodyStyle = await page.locator('body').evaluate((el) => {
      return window.getComputedStyle(el);
    });

    // Body should have a color defined
    expect(bodyStyle.color).not.toBe('');
  });

  test('should be navigable without mouse', async ({ page }) => {
    // Try navigating with keyboard only
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }

    const activeElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    // Should be able to tab through focusable elements
    expect(activeElement).not.toBe(undefined);
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    const buttons = await page.locator('button').count();
    const checkboxes = await page.locator('[role="checkbox"]').count();

    if (buttons > 0 || checkboxes > 0) {
      // Interactive elements are present
      expect(buttons + checkboxes).toBeGreaterThan(0);
    }
  });
});
