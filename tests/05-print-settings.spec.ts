import { test, expect } from '@playwright/test';
import { waitForAppReady, dismissInfoDialog, screenshot } from './helpers/app';

const CH = '05-print-settings';

// Helper: add a text element so the preview canvas isn't blank
async function addTextElement(page: any) {
  await page.click('#add-text');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
}

test.describe.serial('Print Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForAppReady(page);
    await dismissInfoDialog(page);
  });

  test('open print settings dialog', async ({ page }) => {
    await page.click('#print-settings-btn');
    await expect(page.locator('#print-settings-dialog')).toBeVisible();

    await screenshot(page, CH, 1, 'print-settings-dialog');
  });

  test('printer make selector filters branded model labels', async ({ page }) => {
    // Given print settings are open
    await page.click('#print-settings-btn');
    await expect(page.locator('#print-settings-dialog')).toBeVisible();

    // When NIIMBOT is selected as the make
    await page.locator('#printer-make').selectOption('NIIMBOT');

    // Then only NIIMBOT-prefixed models are shown
    const labels = await page.locator('#printer-model option').allTextContents();
    expect(labels.length).toBeGreaterThan(5);
    expect(labels.every(label => label.startsWith('NIIMBOT - NIIMBOT'))).toBe(true);
    await screenshot(page, CH, 2, 'printer-model-dropdown');
  });

  test('select a printer model', async ({ page }) => {
    await page.click('#print-settings-btn');
    await expect(page.locator('#print-settings-dialog')).toBeVisible();

    await page.locator('#printer-make').selectOption('Phomemo');
    await page.locator('#printer-model').selectOption('m260');
    const selected = await page.locator('#printer-model').inputValue();
    expect(selected).toBe('m260');

    await screenshot(page, CH, 3, 'printer-selected');
  });

  test('adjust print density', async ({ page }) => {
    await page.click('#print-settings-btn');
    await expect(page.locator('#print-settings-dialog')).toBeVisible();

    await page.locator('#print-density').fill('4');
    await page.locator('#print-density').dispatchEvent('input');
    await page.waitForTimeout(200);

    const displayValue = await page.locator('#print-density-value').textContent();
    expect(displayValue).toBe('4');

    await screenshot(page, CH, 4, 'density-adjusted');
  });

  test('save and verify persistence', async ({ page }) => {
    await page.click('#print-settings-btn');
    await expect(page.locator('#print-settings-dialog')).toBeVisible();

    await page.locator('#printer-make').selectOption('Phomemo');
    await page.locator('#printer-model').selectOption('m260');
    await page.locator('#print-density').fill('4');
    await page.locator('#print-density').dispatchEvent('input');

    await page.click('#print-settings-save');
    await expect(page.locator('#print-settings-dialog')).toBeHidden();

    await screenshot(page, CH, 5, 'settings-saved');

    // Reopen and verify
    await page.click('#print-settings-btn');
    await expect(page.locator('#print-settings-dialog')).toBeVisible();

    const model = await page.locator('#printer-model').inputValue();
    expect(model).toBe('m260');
    await expect(page.locator('#printer-make')).toHaveValue('Phomemo');

    await screenshot(page, CH, 6, 'settings-persisted');
  });
});

test.describe.serial('Print Layout Preview', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForAppReady(page);
    await dismissInfoDialog(page);
  });

  test('eye button opens print layout preview dialog', async ({ page }) => {
    await page.click('#dither-preview-btn');
    await expect(page.locator('#print-layout-dialog')).toBeVisible();
    await expect(page.locator('#print-layout-canvas')).toBeVisible();
    await screenshot(page, CH, 7, 'print-layout-preview-open');
  });

  test('preview info shows current label size', async ({ page }) => {
    await page.click('#dither-preview-btn');
    await expect(page.locator('#print-layout-dialog')).toBeVisible();
    const info = await page.locator('#print-layout-info').textContent();
    // Default label is 40×30mm — info must include both dimensions
    expect(info).toMatch(/40/);
    expect(info).toMatch(/30/);
  });

  test('preview renders label content', async ({ page }) => {
    await addTextElement(page);
    await page.click('#dither-preview-btn');
    await expect(page.locator('#print-layout-dialog')).toBeVisible();

    // Canvas must have non-zero dimensions after render
    const w = await page.locator('#print-layout-canvas').evaluate((el: HTMLCanvasElement) => el.width);
    const h = await page.locator('#print-layout-canvas').evaluate((el: HTMLCanvasElement) => el.height);
    expect(w).toBeGreaterThan(0);
    expect(h).toBeGreaterThan(0);
    await screenshot(page, CH, 8, 'print-layout-preview-with-content');
  });

  test('close button dismisses dialog', async ({ page }) => {
    await page.click('#dither-preview-btn');
    await expect(page.locator('#print-layout-dialog')).toBeVisible();
    await page.click('#print-layout-close-btn');
    await expect(page.locator('#print-layout-dialog')).toBeHidden();
  });

  test('backdrop click dismisses dialog', async ({ page }) => {
    await page.click('#dither-preview-btn');
    await expect(page.locator('#print-layout-dialog')).toBeVisible();
    // Click the backdrop (the dialog overlay itself, not the inner panel)
    await page.locator('#print-layout-dialog').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('#print-layout-dialog')).toBeHidden();
  });

  test('auto-fill tiling info appears when fill page enabled', async ({ page }) => {
    // Enable auto-fill with a sheet larger than the label
    await page.click('#print-settings-btn');
    await expect(page.locator('#print-settings-dialog')).toBeVisible();
    await page.locator('#auto-fill-enable').check();
    await page.locator('#auto-fill-sheet-w').fill('100');
    await page.locator('#auto-fill-sheet-h').fill('100');
    await page.locator('#auto-fill-sheet-w').dispatchEvent('input');
    await page.locator('#auto-fill-sheet-h').dispatchEvent('input');
    await page.click('#print-settings-save');

    await page.click('#dither-preview-btn');
    await expect(page.locator('#print-layout-dialog')).toBeVisible();

    const info = await page.locator('#print-layout-info').textContent();
    // Should show tiling info, not just single label dimensions
    expect(info).toMatch(/labels/i);
    await screenshot(page, CH, 9, 'print-layout-preview-autofill');
  });
});
