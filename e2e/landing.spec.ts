import { test, expect } from '@playwright/test';

test('landing page renders primary content', async ({ page }) => {
  await page.goto('/');
  // Case-insensitive match for "Notia"
  await expect(page).toHaveTitle(/notia/i);
  await expect(page.locator('text=당신의 생각, 그 이상의 가치')).toBeVisible({ timeout: 15000 });
});

test('can navigate to login page', async ({ page }) => {
  await page.goto('/');
  await page.click('text=로그인');
  
  await expect(page.locator('text=다시 오신 것을 환영합니다')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('button:has-text("로그인")')).toBeVisible();
});
