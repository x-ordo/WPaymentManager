import { test, expect } from '@playwright/test';

test.describe('Staging Smoke', () => {
  test('landing renders critical sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-animate="hero"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-animate="pricing"]')).toBeVisible();
  });

  test('login form renders', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input#email')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('signup form renders', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input#name')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('select#role')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
