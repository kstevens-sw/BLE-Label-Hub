# BLE Label Hub

A browser-based thermal label designer and driver. Design labels with text, barcodes, QR
codes, images, and shapes, then print directly to BLE/USB thermal printers — no app, no drivers.
Runs entirely client-side. Originally built for the **Jadens JD-468BT**, now supports Niimbot,
Phomemo, and many M-/D-series, P12/A30 tape, and TSPL shipping printers.

## Quick start

```bash
npm start
# serves src/web on http://localhost:3001 — open in Chrome or Edge
```

1. Open the app in Chrome/Edge (desktop or Android).
2. Set the **connection-type dropdown** (next to Connect) to match your printer:
   **Bluetooth**, **Niimbot**, or **USB** — see [Connecting](#connecting).
3. Click **Connect** and pick your printer from the browser's device picker.
4. Design your label and click **Print**.

**Requires** a Chromium browser (Chrome, Edge, Opera). Web Bluetooth is **not** available in
Firefox or Safari, and **not** on iOS. Android Chrome is supported. Production hosting needs
HTTPS; `localhost` works for development.

## Install as a mobile app (PWA)

BLE Label Hub is a Progressive Web App. On Android Chrome, open the site and choose
**Install app** / **Add to Home screen** to run it full-screen and offline, like a native app.

## Connecting

The **connection-type dropdown is the single switch** that decides how the app talks to the
printer. Print Settings does *not* change it.

| Dropdown | Use for | Protocol |
|----------|---------|----------|
| **Bluetooth** | Jadens JD-468BT, Phomemo, M-series, D-series, P12/A30, TSPL shipping | ESC/POS / TSPL over BLE |
| **Niimbot** | NIIMBOT printers (B1, B21, D11, D110, B18, …) | NiimBlueLib protocol |
| **USB** | Printers connected by USB cable, where supported | WebUSB |

Picking the wrong mode is the most common failure: a Niimbot on "Bluetooth" (or a Jadens on
"Niimbot") will pair in the picker but fail to connect/print. The **Connect** button becomes
**Disconnect** once connected.

> **Bluetooth allows one connection at a time.** If a printer won't connect even when you're
> next to it, it's usually still linked to its phone app or another device — close that, toggle
> Bluetooth off/on, power-cycle the printer, and retry.

## Features

- **Design elements** — Text (system fonts, sizes, styles, alignment, background), images
  (scale, aspect lock), barcodes (Code128, EAN-13, UPC-A, Code39), QR codes, and shapes
  (rectangle, ellipse, triangle, line) with solid, dithered-grayscale, and stroke fills.
- **Editing** — Drag/resize/rotate, multi-select (Shift+click), grouping (Ctrl/Cmd+G),
  undo/redo, keyboard nudge, layer order, clipboard image paste (Ctrl/Cmd+V), Move tool.
- **Multi-tab workspace** — Keep multiple label designs open as tabs, switch between them, each
  with independent elements, label size, and undo history. Tabs persist across reload.
- **Image tuning for thermal** — Brightness, contrast, a one-click **Black & White** toggle for
  pasted color images, and selectable dithering (Floyd-Steinberg, Atkinson, ordered, threshold).
- **Label sizes** — Per-printer presets, round labels, custom dimensions, and multi-label rolls.
  The correct **default size auto-applies** when you connect or pick a printer.
- **Templates & batch printing** — `{{FieldName}}` placeholders, CSV import, preview grid, and
  batch printing with progress.
- **Instant expressions** — Print-time values via `[[date]]`, `[[time]]`, `[[datetime]]`, or
  `[[date|MM/DD/YYYY]]`, in text, barcodes, and QR codes.
- **Print layout preview** — Click the eye button to see exactly what will be sent to the
  printer, at the correct label size. Works with Auto-Fill (fill page) — shows the full tiled
  grid layout.
- **Auto-Fill Page** — Tile a single design across a larger sheet at print time. Configurable
  sheet size, gap, and grid. Disabled automatically for rotated-head printers (D-series, P12).
- **Custom printer definitions** — Add/override width, DPI, density, and BLE name patterns.
- **PWA** — Installable and offline-capable on mobile.

## How it works

Designs are laid out on an HTML Canvas, rendered at the printer's resolution, converted to
grayscale, dithered, and packed to a **1-bit bitmap**, then streamed to the printer. Thermal
printers are raster devices, so all output is monochrome regardless of on-screen color. Niimbot
printers use their own protocol (via NiimBlueLib); everything else uses ESC/POS or TSPL over BLE.

D-series and P12/A30 printers rotate the raster 90° before sending — the app handles this
automatically. Printhead widths for all supported models are verified and locked in
`printers.json` with a regression test (`tests/printer-specs.test.js`).

## Project structure

```
src/web/
├── index.html        UI markup + styles (Tailwind via CDN)
├── app.js            main controller (state, events, connect/print flow)
├── canvas.js         CanvasRenderer — draw, filters, raster + dither
├── printer.js        printer definitions + print() protocol dispatch
├── niimbot.js        NiimbotTransport (wraps NiimBlueLib)
├── ble.js / usb.js   BLE / USB transports
├── elements.js       element model + helpers
├── handles.js        resize/rotate handles
├── constants.js      label-size tables, BLE UUIDs, app-wide constants
├── templates.js      template fields + CSV merge
├── storage.js        design persistence (IndexedDB via design-db.js)
├── design-db.js      IndexedDB adapter for design payloads
├── design-store.js   design metadata index (localStorage)
├── themes.js         theme token helpers
├── printers.json     built-in printer definitions (widthBytes, DPI, rotated)
├── manifest.json     PWA manifest
├── sw.js             service worker (offline shell)
├── utils/            shared error/validation/binding helpers
└── icons/            PWA icons
```

No build step — the browser loads ES modules directly. Module imports are cache-busted with
`?v=` query strings; bump them on change if caching gets stale.

## Development

```bash
npm start          # copy vendor lib + serve on :3001
npm test           # Playwright end-to-end tests
npm run vendor     # copy NiimBlueLib into src/web/vendor
```

Syntax-check ES modules:

```bash
node --input-type=module --check < src/web/app.js
```

Printer spec regression test (no Playwright needed):

```bash
node tests/printer-specs.test.js
```

## Troubleshooting

- **Printer pairs but won't connect** — held by its phone app (BLE = one connection at a time).
  Close it, toggle Bluetooth, power-cycle, retry.
- **Connects but printer light stays red** — a Niimbot needs its handshake to finish (watch the
  status bar for "Printer handshake OK").
- **"Not a Niimbot printer" / "no suitable characteristic"** — wrong connection-type dropdown.
- **Printer not in the picker** — filtered to known name prefixes; Shift+click **Connect** to
  show all Bluetooth devices.
- **D-series / P12 prints blank** — printhead width overflow. The label height (after 90°
  rotation) must fit the narrow head (D30 = 12mm / 96px). Auto-Fill is disabled for these
  printers automatically.

## Credits

Built on the work of these projects:

- [transcriptionstream/phomymo](https://github.com/transcriptionstream/phomymo) — Phomemo thermal
  printing foundation.
- [a-rbsn/phomymo-pwa](https://github.com/a-rbsn/phomymo-pwa) — PWA structure and approach.
- [labbots/NiimPrintX](https://github.com/labbots/NiimPrintX) — reference for Niimbot BLE support.

Niimbot protocol support uses [NiimBlueLib](https://github.com/MultiMote/niimbluelib).
