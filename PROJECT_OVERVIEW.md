# BLE Label Hub — Project Overview (LLM Context)

A single-page, browser-based **label designer and printer driver** for BLE/USB thermal label
printers. It runs entirely client-side (no backend): you design a label on a canvas, then it
rasterizes the design to a 1-bit bitmap and streams it to the printer over Web Bluetooth or WebUSB.
Originally built for the **Jadens JD-468BT** thermal printer, it now supports many thermal printers (Niimbot,
Phomemo, M-series ESC/POS, D-series, P12/A30 tape, PM-241 / TSPL shipping). Installable as a PWA.

## What it accomplishes

- Visual label editor: text, barcodes, QR codes, images, shapes; multi-element selection, grouping,
  z-order, rotation, snapping, undo/redo, copy/paste, templates with CSV data merge.
- Per-printer label-size presets, with the correct **default size** auto-applied when a printer is
  selected/connected (e.g. Niimbot B1 → 50×30mm).
- Image processing for thermal output: brightness/contrast, **black & white (grayscale)** toggle,
  and dithering (Floyd-Steinberg / Atkinson / ordered / threshold).
- Direct printing over BLE/USB with no drivers, including a "dither preview" that shows the exact
  monochrome print output.
- **PWA**: installable + offline on mobile (manifest + service worker).

## Tech stack

- **Vanilla JS ES modules** (no framework, no bundler). Tailwind via CDN. HTML5 Canvas for rendering.
- **Web Bluetooth** + **WebUSB** for device I/O (Chromium browsers only; not Firefox/Safari/iOS).
- Vendored `@mmote/niimbluelib` (`src/web/vendor/niimbluelib.min.js`) for the Niimbot protocol.
- Playwright/Puppeteer for tests/screenshots (Puppeteer also rasterizes PWA icons).

## Run / test

```bash
npm start   # copies vendor lib, serves src/web on http://localhost:3001 (python http.server)
npm test    # Playwright
node scripts/make-icons.js   # regenerate PWA icons from icons/icon.svg (uses puppeteer)
```

There is **no build step** — the browser loads `src/web/index.html` → `app.js` directly. Module
imports are cache-busted with query strings (e.g. `import ... from './canvas.js?v=129'`); bump the
`?v=` when a file changes if caching gets stale. PWA install/service worker need HTTPS or localhost.

## Source layout (`src/web/`)

| File | LOC | Responsibility |
|------|-----|----------------|
| `index.html` | — | Entire UI markup + inline styles; PWA meta; loads modules. |
| `app.js` | ~8600 | Main controller: state, event wiring, selection, properties panel, connect/print flow, label-size logic, footer printer info, PWA desktop link. Entry module. |
| `canvas.js` | ~2360 | `CanvasRenderer`: draws elements, applies image filters (brightness/contrast/grayscale), generates raster + dither preview. |
| `printer.js` | ~1240 | Printer **definitions manager** + `print()` dispatch across protocols (ESC/POS M-series, M02/M04/M110, D-series, P12, TSPL, Niimbot). |
| `niimbot.js` | ~120 | `NiimbotTransport` wrapping niimbluelib (connect, handshake/heartbeat events, firmware capture, `printRaster`). |
| `ble.js` / `usb.js` | ~730 / ~230 | `BLETransport` / `USBTransport` (Web Bluetooth / WebUSB). |
| `elements.js` | ~610 | Element model + immutable update helpers. |
| `handles.js` | ~660 | Resize/rotate handle geometry + hit-testing. |
| `constants.js` | ~355 | Label-size tables + BLE service/characteristic UUID candidate lists + config. |
| `templates.js` | ~470 | Template fields + CSV data merge. |
| `storage.js` | ~310 | localStorage persistence (designs, settings, custom printers). |
| `printers.json` | — | 23 built-in printer definitions; Niimbot models added dynamically from niimbluelib. |
| `manifest.json`, `sw.js`, `icons/` | — | PWA: manifest, offline service worker, icon set (master `icon.svg` + generated PNGs). |

## Core data flow: design → print

1. User edits `state.elements` (array of element objects). `modifyElement(id, changes)` updates state,
   clears the renderer cache **only for keys in `contentKeys`**, then re-renders.
   ⚠️ Any element property that affects rendering (e.g. `grayscale`) **must be in `contentKeys`** or
   the cached canvas won't refresh.
2. On print, `CanvasRenderer.getRasterData(...)` (or `getRasterDataRaw` for rotated printers)
   renders all elements at printer resolution, converts to grayscale, dithers, and packs to a
   **1-bit bitmap** `{ data, widthBytes, heightLines }`.
3. `printer.js` `print(transport, rasterData, opts)` dispatches by protocol to the right encoder,
   which streams bytes via `transport.send()` — except Niimbot, which calls `transport.printRaster()`.
   `print()` routes to `printRaster` whenever the transport exposes it (only `NiimbotTransport` does),
   so a generic Niimbot device name doesn't misroute to ESC/POS.

## Connection / transport routing (important)

- **The connection-type dropdown (`#conn-type`: `ble` / `niimbot` / `usb`) is the sole transport
  switch.** In `handleConnect`: `usb` → `USBTransport`; `niimbot` → `NiimbotTransport`; `ble` →
  `BLETransport` (generic ESC/POS) — **always**. `usesNiimbot = state.connectionType === 'niimbot'`.
- This is deliberate: an earlier version auto-routed `ble` to Niimbot based on the Print Settings
  make/model, which trapped users — a stale `make = NIIMBOT` silently sent a Jadens to niimbluelib,
  which then failed with "no suitable characteristic". Routing is now dropdown-only, no hidden state.
- Print Settings make/model still drives **printer profile** (width, DPI, default label size,
  per-model overrides) — just not the transport.
- **Why the dropdown rather than auto-detect:** Web Bluetooth `requestDevice` needs a user gesture
  and allows only **one picker per click**, and niimbluelib owns its own picker — so the transport
  must be chosen *before* the device is picked. You can't sniff the device then pick a transport.
- `NiimbotTransport.connect` surfaces a friendly error ("Not a Niimbot printer…") when niimbluelib
  fails to find its channel characteristic (i.e. a non-Niimbot printer chosen under "Niimbot").
- BLE only allows **one connection at a time** — a printer still held by its phone app won't connect.

## Printer profiles & label sizes

- A printer is identified by **BLE device name** (`detectPrinterConfig` matches name prefixes) or a
  **manual make/model override** (Print Settings). Resolved config gives
  `{ protocol, widthBytes, dpi, definition }`.
- Label-size sets and defaults are filtered per printer family in `updateLabelSizeDropdown`; the
  default is family-based with a small per-model override map (`MODEL_DEFAULT_SIZE`, keyed by
  definition id — currently `niimbot-b1` → `50x30`). `forceDefault` applies the default on explicit
  printer selection/connect. The default option is labelled `… (Default)` in the dropdown.
- `constants.js` `BLE.ALT_SERVICE_UUIDS` / `WRITE_CHAR_UUIDS` / `NOTIFY_CHAR_UUIDS` are candidate
  lists tried during GATT discovery; any service used must also be declared to `requestDevice`
  (these lists are reused as `optionalServices`). Widen these to support a new printer's UUID.

## UI / DOM gotchas

- **Dropdowns must escape the ribbon's clip.** The toolbar is `overflow-x-auto`, which also clips
  vertically, so `absolute` dropdowns get cut off / pop *under*. Ribbon/header popovers
  (`export-dropdown`, `shape-dropdown`, `elements-dropdown`) are `position: fixed` + reparented to
  `<body>` on open via `openPopoverUnder(dropdown, btn)`, positioned with `getBoundingClientRect`.
- **`textContent` on a button wipes its child `<svg>` icon.** Update a child `<span>` instead — see
  the Connect button label logic (owned by `updateConnectionStatus` via the span).
- **Tailwind utility classes lose to `.toolbar-btn` CSS.** `bg-blue-500`/`text-white` on a
  `.toolbar-btn` are overridden by the component's own `background`/`color`. Don't rely on utilities
  for toolbar button state; toolbar icons should use `stroke="currentColor"`.
- **Tooltips show on disabled buttons** (custom instant-tooltip system reads `data-tooltip`;
  `.toolbar-btn:disabled` keeps `pointer-events:auto`). Disabled = greyed via `opacity-50`.
- Connection status: green dot/`isConnected()` reflects the BLE link; a Niimbot printer also needs
  its niimbluelib handshake/heartbeat (`printerinfofetched` / `heartbeat` events), surfaced to the
  status bar and footer. `onDisconnect`/`onLog` callbacks on the transport are wired in `handleConnect`.
- Footer (bottom-right) shows the connected printer's **make · model · FW firmware**
  (`updateFooterPrinterInfo`); Niimbot firmware comes from `client.info.softwareVersion` on handshake.

## Gotchas for anyone editing this

- **Syntax-check ES modules** (imports use `?v=` query strings, so plain `node --check` fails):
  `node --input-type=module --check < src/web/app.js`. Run on every JS file touched. (`sw.js` is a
  classic script — plain `node --check sw.js` works.)
- Web Bluetooth is BLE-only; Bluetooth-Classic-only devices can't work in-browser. Niimbot/Phomemo
  here are BLE GATT.
- The served user manual is `src/web/docs/manual.html` (linked in-app); `docs/manual.html` and
  `docs/manual.md` are separate, possibly-stale copies.

## Status / known rough edges

- Niimbot D-series models (D11/D110) currently fall into the M-series default size bucket because
  their protocol is `niimbot`, not `d-series` — default sizes for small Niimbot models are not yet
  per-model accurate (only B1 is overridden in `MODEL_DEFAULT_SIZE`).
- Firmware in the footer is best-effort: captured from `client.info.softwareVersion` on Niimbot
  handshake, or from the printer-info query on protocols that support it; may be blank otherwise.
- No share-target yet (the reference phomymo-pwa appears in Android's share sheet); would need a
  `manifest.json` `share_target` + handler.
