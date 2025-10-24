import { test, expect } from '@playwright/test';

test('landing renders and shows BeMore title', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('BeMore')).toBeVisible();
});


