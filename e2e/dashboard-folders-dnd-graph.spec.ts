import { test, expect } from '@playwright/test';

test.describe('Dashboard (Folders, DnD, and Graph)', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Enable E2E Auth Bypass + Disable Tour
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-storage', JSON.stringify({
        state: { 
            isAuthenticated: true, 
            user: { id: '00000000-0000-0000-0000-000000000000', email: 'e2e@example.com' },
            userProfile: { id: '00000000-0000-0000-0000-000000000000', terms_agreed: true, display_name: 'E2E User' }
        },
        version: 0
      }));
      window.localStorage.setItem('notia-tour-seen', 'true');
    });
    
    await page.goto('/dashboard');
    await page.waitForSelector('text=노트', { timeout: 15000 });
  });

  async function createNote(page, title) {
    await page.click('#tour-create-note', { force: true });
    await page.waitForSelector('.cm-content', { timeout: 15000 });
    await page.fill('h1[contenteditable="true"]', title);
    await page.waitForTimeout(1000); 
  }

  test('Folder CRUD operations', async ({ page }) => {
    // Create
    await page.click('[aria-label="새 폴더 만들기"]', { force: true });
    const folderInput = page.locator('div[role="dialog"] input');
    await folderInput.fill('TestFolder');
    await page.click('button:has-text("생성")', { force: true });
    
    // Use .first() to avoid strict mode violation (Breadcrumb vs Sidebar)
    const folderInTree = page.locator('span.text-sm.font-medium.truncate', { hasText: 'TestFolder' }).first();
    await expect(folderInTree).toBeVisible();

    // Rename
    await page.click('button[aria-label*="TestFolder 폴더 메뉴"]', { force: true });
    await page.click('text=이름 변경', { force: true });
    await folderInput.clear();
    await folderInput.fill('RenamedFolder');
    await page.click('button:has-text("변경")', { force: true });
    await expect(page.locator('span.text-sm.font-medium.truncate', { hasText: 'RenamedFolder' }).first()).toBeVisible();

    // Delete
    await page.click('button[aria-label*="RenamedFolder 폴더 메뉴"]', { force: true });
    await page.click('text=폴더 삭제', { force: true });
    await expect(page.locator('span.text-sm.font-medium.truncate', { hasText: 'RenamedFolder' }).first()).not.toBeVisible();
  });

  test('Folder collapse/expand', async ({ page }) => {
    const folderName = 'CollapseTest';
    const noteTitle = 'NoteInsideFolder';

    await page.click('[aria-label="새 폴더 만들기"]', { force: true });
    await page.locator('div[role="dialog"] input').fill(folderName);
    await page.click('button:has-text("생성")', { force: true });
    
    await createNote(page, noteTitle);

    const noteRow = page.locator('.group', { hasText: noteTitle });
    const dragHandle = noteRow.locator('[aria-label="노트 드래그"]');
    const dropTarget = page.locator('span.text-sm.font-medium.truncate', { hasText: folderName }).first();
    
    await dragHandle.dragTo(dropTarget);
    await expect(page.locator(`text=${noteTitle}`)).toBeVisible();
    
    await dropTarget.click({ force: true });
    await expect(page.locator(`text=${noteTitle}`)).not.toBeVisible();

    await dropTarget.click({ force: true });
    await expect(page.locator(`text=${noteTitle}`)).toBeVisible();
  });

  test('Note click to open editor', async ({ page }) => {
    const noteTitle = 'ClickTestNote';
    await createNote(page, noteTitle);
    
    await page.click('button:has-text("리마인더")', { force: true });
    await page.click('button:has-text("노트")', { force: true });
    
    await page.click(`text=${noteTitle}`, { force: true });
    await expect(page.locator('.cm-editor')).toBeVisible();
    await expect(page.locator('h1[contenteditable="true"]')).toHaveText(noteTitle);
  });

  test('Graph module and node click', async ({ page }) => {
    const noteTitle = 'GraphTestNote';
    await createNote(page, noteTitle);
    
    await page.click('button:has-text("그래프")', { force: true });
    await page.waitForSelector('.mermaid-container svg', { timeout: 20000 });
    
    const node = page.locator('.mermaid-container svg text', { hasText: noteTitle }).first();
    await node.click({ force: true });
    
    await expect(page.locator('.cm-editor')).toBeVisible();
    await expect(page.locator('h1[contenteditable="true"]')).toHaveText(noteTitle);
  });
});
