import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');
const BASE = 'http://localhost:3007';

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name), fullPage: false });
  console.log('saved', name);
}

async function dismissInfo(page) {
  const btn = page.locator('#info-dialog button').first();
  if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) await btn.click();
  await page.waitForTimeout(300);
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

// 1. Main editor — empty canvas
await page.goto(BASE, { waitUntil: 'networkidle' });
await dismissInfo(page);
await page.waitForTimeout(500);
await shot(page, '01-editor.png');

// 2. Editor with content — add text + QR
await page.click('#add-text');
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
// click somewhere to deselect
await page.mouse.click(360, 650);
await page.waitForTimeout(200);
await shot(page, '02-editor-with-content.png');

// 3. Print settings dialog
await page.click('#print-settings-btn');
await page.waitForSelector('#print-settings-dialog', { state: 'visible' });
await page.waitForTimeout(300);
await shot(page, '03-print-settings.png');
// close
await page.click('#print-settings-save');
await page.waitForTimeout(200);

// 4. Print layout preview
await page.click('#dither-preview-btn');
await page.waitForSelector('#print-layout-dialog', { state: 'visible' });
await page.waitForTimeout(400);
await shot(page, '04-print-layout-preview.png');
await page.click('#print-layout-close-btn');
await page.waitForTimeout(200);

// 5. Multi-tab — add a second tab
await page.click('button[title="New tab"], button[aria-label="New tab"], .tab-add-btn, #tab-add, button:has-text("+")');
await page.waitForTimeout(400);
await shot(page, '05-multi-tab.png');

await browser.close();
console.log('Done.');
