import { test, expect } from '@playwright/test';

test('startsidan laddar med korrekt titel', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/searchboost/i);
  await expect(page.locator('h1').first()).toBeVisible();
});

test('inga konsolfel på startsidan', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});

test('mobil viewport renderar utan overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(375);
});
