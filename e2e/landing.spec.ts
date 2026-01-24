import { expect, test } from '@playwright/test';

test('landing page renders primary content', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /기억의 조각을/ }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
});

test('can navigate to login page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '로그인' }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(
    page.getByRole('heading', { name: /다시 오신 것을 환영합니다/ }),
  ).toBeVisible();
});
