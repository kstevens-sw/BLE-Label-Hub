import { test, expect } from '@playwright/test';
import { waitForAppReady, dismissInfoDialog, screenshot } from './helpers/app';

const CH = '05-print-settings';

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
