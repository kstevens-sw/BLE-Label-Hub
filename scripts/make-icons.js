// Rasterize the master SVG icon into the PNG sizes a PWA needs.
// Run: node scripts/make-icons.js  (uses the puppeteer dep already installed)
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ICONS_DIR = path.join(__dirname, '..', 'src', 'web', 'icons');
const svg = fs.readFileSync(path.join(ICONS_DIR, 'icon.svg'), 'utf8');

// any = the plain icon; maskable = same art with extra safe-area padding (no rounded corners)
const targets = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'icon-maskable-512.png', size: 512, maskable: true },
];

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  for (const t of targets) {
    // Maskable: paint full-bleed accent bg + scale art to 80% (safe area)
    const inner = t.maskable
      ? `<div style="position:absolute;inset:0;background:#b65f45"></div>
         <div style="position:absolute;inset:10%;background-size:contain;background-repeat:no-repeat;
              background-image:url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}')"></div>`
      : `<div style="position:absolute;inset:0;background-size:contain;
              background-image:url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}')"></div>`;
    await page.setViewport({ width: t.size, height: t.size, deviceScaleFactor: 1 });
    await page.setContent(`<body style="margin:0;width:${t.size}px;height:${t.size}px;position:relative">${inner}</body>`);
    await page.screenshot({ path: path.join(ICONS_DIR, t.file), omitBackground: true });
    console.log('wrote', t.file);
  }
  await browser.close();
})();
