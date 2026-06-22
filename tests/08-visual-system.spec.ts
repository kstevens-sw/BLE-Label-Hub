import { expect, test } from '@playwright/test';
import { dismissInfoDialog, waitForAppReady } from './helpers/app';

test.describe('Warm modern visual system', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForAppReady(page);
    await dismissInfoDialog(page);
  });

  test('applies warm design tokens and typography', async ({ page }) => {
    // Given the editor is loaded
    // When the computed design tokens are inspected
    const design = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const body = getComputedStyle(document.body);
      return {
        page: root.getPropertyValue('--surface-page').trim(),
        accent: root.getPropertyValue('--accent-primary').trim(),
        font: body.fontFamily,
      };
    });

    // Then the approved warm-modern system is active
    expect(design.page).toBe('#f3efe8');
    expect(design.accent).toBe('#b65f45');
    expect(design.font).toContain('Manrope');
  });

  for (const viewport of [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 900 },
    { name: 'desktop', width: 1280, height: 900 },
  ]) {
    test(`has no horizontal overflow at ${viewport.name} width`, async ({ page }) => {
      // Given the editor uses the target viewport
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      // When the layout dimensions are measured
      const sizes = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
      }));

      // Then the layout remains within the viewport
      expect(sizes.document).toBeLessThanOrEqual(sizes.viewport);
    });
  }
});
