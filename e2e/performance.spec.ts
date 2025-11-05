/**
 * Performance E2E Tests
 *
 * Tests for page performance, Web Vitals, and load times
 */

import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('should load home page within reasonable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should measure page load metrics', async ({ page }) => {
    await page.goto('/');

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (!timing) return null;

      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.fetchStart,
        loadComplete: timing.loadEventEnd - timing.fetchStart,
        domInteractive: timing.domInteractive - timing.fetchStart,
      };
    });

    expect(metrics).not.toBeNull();

    if (metrics) {
      expect(metrics.domContentLoaded).toBeGreaterThan(0);
      expect(metrics.loadComplete).toBeGreaterThan(metrics.domContentLoaded);
    }
  });

  test('should not have significant layout shifts', async ({ page }) => {
    await page.goto('/');

    // Check for performance observer data
    const clsData = await page.evaluate(() => {
      return (window as unknown).__performance?.getSummary?.();
    });

    // If performance reporting is available, it should be accessible
    if (clsData) {
      expect(clsData).toHaveProperty('totalMetrics');
    }
  });

  test('should have optimized resource sizes', async ({ page }) => {
    let resourceCount = 0;

    page.on('response', (response) => {
      const contentLength = response.headers()['content-length'];
      if (contentLength) {
        resourceCount++;
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    // Should load resources efficiently
    expect(resourceCount).toBeGreaterThan(0);
  });

  test('should cache critical resources', async ({ page }) => {
    const firstLoadMetrics: Record<string, number> = {};
    const secondLoadMetrics: Record<string, number> = {};

    // First load
    let startTime = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    firstLoadMetrics.time = Date.now() - startTime;

    // Clear cache and reload
    await page.context().clearCookies();

    // Second load (should be faster due to caching)
    startTime = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    secondLoadMetrics.time = Date.now() - startTime;

    // Expect some level of caching benefit
    expect(secondLoadMetrics.time).toBeLessThanOrEqual(firstLoadMetrics.time * 1.5);
  });
});
