import { test, expect, type Page } from '@playwright/test';
import * as app from '../../app.js';

const APP = '/app.html';

function editTitle(page: Page) {
  return page.getByRole('button', { name: 'Edit title' });
}

// setMarkdown debounces the fragment sync; wait until the URL actually
// encodes the expected document, not merely "changed since the last edit".
async function waitFragmentSync(page: Page, markdown: string) {
  const encoded = '#' + await app.encodePlainFragment(markdown);
  await expect.poll(() => page.evaluate(() => location.hash), { timeout: 5000 })
    .toBe(encoded);
}

test.describe('checklist title — in-place editing', () => {
  test('renders the shared title next to the pencil button', async ({ page }) => {
    await page.goto(APP);
    await expect(page.locator('#list-title')).toHaveText('My checklist');
    await expect(page.locator('#edit-title')).toBeVisible();
    await expect(page.locator('#edit-title svg')).toBeVisible();
  });

  test('pencil opens an in-place editor, prefilled, title hidden', async ({ page }) => {
    await page.goto(APP);
    await editTitle(page).click();
    const input = page.locator('#title-input');
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('My checklist');
    await expect(input).toBeFocused();
    await expect(page.locator('#list-title')).toBeHidden();
    await expect(editTitle(page)).toBeHidden();
  });

  test('Enter commits, re-renders, and the title survives a reload (shared fragment)', async ({ page }) => {
    await page.goto(APP);
    const input = page.locator('#title-input');
    await editTitle(page).click();
    await input.fill('Groceries');
    await input.press('Enter');
    await expect(input).toBeHidden();
    await expect(page.locator('#list-title')).toHaveText('Groceries');
    await expect(editTitle(page)).toBeVisible();
    await waitFragmentSync(page, '# Groceries\n\n- [ ] Try the app\n');

    await page.reload();
    await expect(page.locator('#list-title')).toHaveText('Groceries');
    await expect(page.locator('.checklist li.task').first()).toContainText('Try the app');
  });

  test('blur commits the edit', async ({ page }) => {
    await page.goto(APP);
    await editTitle(page).click();
    await page.locator('#title-input').fill('Blur title');
    await page.locator('h1').click();
    await expect(page.locator('#list-title')).toHaveText('Blur title');
    await expect(page.locator('#title-input')).toBeHidden();
  });

  test('Escape cancels and reverts to the previous title', async ({ page }) => {
    await page.goto(APP);
    await editTitle(page).click();
    const input = page.locator('#title-input');
    await input.fill('Should not stick');
    await input.press('Escape');
    await expect(input).toBeHidden();
    await expect(page.locator('#list-title')).toHaveText('My checklist');
  });

  test('document without a # heading: editor shows placeholder, commit prepends the title', async ({ page }) => {
    await page.goto(APP);
    await page.getByRole('button', { name: /Edit Markdown/ }).click();
    await page.locator('#raw').fill('- [ ] a\n- [ ] b\n');
    await page.getByRole('button', { name: /View list/ }).click();
    await expect(page.locator('#list-title')).toHaveText('Untitled checklist');

    await editTitle(page).click();
    const input = page.locator('#title-input');
    await input.fill('Plan');
    await input.press('Enter');
    await expect(page.locator('#list-title')).toHaveText('Plan');
    await waitFragmentSync(page, '# Plan\n\n- [ ] a\n- [ ] b\n');

    await page.reload();
    await expect(page.locator('#list-title')).toHaveText('Plan');
    await expect(page.locator('.checklist li.task')).toHaveCount(2);
  });

  test('title edit cycle produces no console or page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(APP);
    await editTitle(page).click();
    await page.locator('#title-input').fill('Quiet title');
    await page.locator('#title-input').press('Enter');
    await waitFragmentSync(page, '# Quiet title\n\n- [ ] Try the app\n');
    await page.reload();
    await expect(page.locator('#list-title')).toHaveText('Quiet title');
    expect(errors).toEqual([]);
  });
});
