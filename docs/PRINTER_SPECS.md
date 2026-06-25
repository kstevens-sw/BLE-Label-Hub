# Printer Specs — Single Source of Truth & Audit Task

**Goal:** every printer's hardware limits live in **one place** — `src/web/printers.json` — so guards and rendering read from data, not hard-coded per-printer logic. This doc explains the schema, the invariants the app relies on, and a concrete audit task to verify/complete the specs for **all** printers (offloadable to another agent, e.g. Qwen).

## Why this exists

D-series/P12/A30 printers **rotate the raster 90°** before sending, so the **outgoing print width = the design's height in pixels**. If that exceeds the physical print head, the printer **silently feeds blank paper** (no error). A real bug: Auto-Fill tiled a 40×12 mm D30 label into a 1136px-tall strip → rotated to 1136px wide → 12× the D30's 96px head → blank feed.

The fix is data-driven: `print()` in `src/web/printer.js` reads each printer's head width from `printers.json` and **throws a visible error** if the outgoing raster is too wide. That guard is only as correct as the data. **This task makes the data correct for every printer.**

## `printers.json` schema

Each entry in `printers[]`:

| field | type | meaning |
|---|---|---|
| `id` | string | unique key (e.g. `"d-series"`) |
| `name` | string | human label shown in UI |
| `group` | string | make grouping (`Phomemo`/`Jadens`/`NIIMBOT`) |
| `description` | string | short blurb |
| `protocol` | string | print encoder: `m-series`, `m02`, `m04`, `m110`, `d-series`, `p12`, `tspl`, `niimbot` |
| **`widthBytes`** | int | **print-head width in BYTES = printhead pixels ÷ 8.** THE critical field for the guard. e.g. 96px head → `12`. |
| `dpi` | int | 203 or 300 |
| `alignment` | string | `left` / `center` / `right` — how the label sits within the head |
| **`rotated`** | bool | **true if the printer prints sideways (raster rotated 90° before send).** D-series/P12/A30. |
| `tape` | bool | continuous-tape printer |
| `tapeWidths` / `defaultTapeWidth` | array/int·null | for tape printers |
| `namePatterns` | string[] | BLE device-name substrings for auto-detect; longer = more specific |
| `labelPresets` | string | which label-size group to show |
| `builtin` | bool | always true for entries here |

### Invariants the code depends on

1. **`widthBytes` = head pixels ÷ 8, rounded up.** Never `null`. (Niimbot entries are generated at runtime from the library and already follow this.)
2. **`rotated: true`** ⇒ outgoing width = design height. The guard checks `ceil(heightLines/8) ≤ widthBytes`. So `widthBytes` for a rotated printer MUST be its true head width, or valid jobs get false-rejected / overflows get missed.
3. One entry may cover several models via `namePatterns` (e.g. `d-series` covers D30/D35/D50/Q30). **Only valid if they share the same `widthBytes`, `dpi`, `rotated`, `protocol`.** If they differ, split into separate entries.

## Current state (audit table)

`?` / suspect rows need verification against manufacturer specs.

| id | head px | dpi | rotated | protocol | status / action |
|---|---|---|---|---|---|
| p12 | 96 | 203 | yes | p12 | ✓ Verified: 12mm paper @ 203 DPI = 96px head |
| a30 | 120 | 203 | yes | p12 | ✓ Verified: 15mm paper @ 203 DPI = 120px head |
| d-series-9b | 96 | 203 | yes | d-series | ✓ Verified: D30/D35/Q30 all 12mm printhead (96px @ 203 DPI) |
| d-series-q30s | 96 | 203 | yes | d-series | ✓ Verified: Q30S 12mm printhead (accepts 15mm paper but prints 12mm max) |
| d-series-d50 | 176 | 180 | yes | d-series | ✓ Verified: 24mm paper max @ 180 DPI = 176px head |
| m02 / m02-pro | 384 / 624 | 203 / 300 | no | m02 | verify |
| m03 / t02 | 432 / 384 | 203 | no | m-series / m-series | verify |
| m04s-53/80/110 | 600/896/1232 | 300 | no | m04 | verify head widths & that user picks variant |
| m110 / m110s | 384 | 203 | no | m110 | verify |
| m200/m220/m221/m250/m260 | 608/576 | 203 | no | m-series | verify each head px |
| jadens-jd-468bt | 816 | 203 | no | tspl | verify (4-inch class) |
| jadens-tspl-2in/3in/4in | 384/576/816 | 203 | no | tspl | verify |
| pm241 | 816 | 203 | no | tspl | verify |
| niimbot-auto | 384 | 203 | no | niimbot | fallback only; real Niimbot specs come from niimbluelib at runtime |

## TASK (for Qwen / contributor)

Edit **only** `src/web/printers.json`. For each entry:

1. **Verify `widthBytes`** against the manufacturer's printhead spec: `widthBytes = ceil(printhead_pixels / 8)`. Phomemo/Niimbot publish printhead dot counts (often as "203 dpi, N dots"). If you can only find mm: `pixels = mm × 8` at 203 dpi (`× 11.81` at 300 dpi), then ÷ 8 for bytes.
2. **Verify `dpi`** (203 vs 300) — affects the px math above.
3. **Verify `rotated`** — true only for printers that print labels sideways (D-series, P12, A30). If unsure, leave as-is and add a `// note` is NOT allowed in JSON, so instead list it in the PR description.
4. **Split lumped entries** where models in one `namePatterns` list have different head widths/dpi/rotated. Give each its own entry with the right `namePatterns`. Keep a catch-all last (shortest pattern, e.g. `"D"`) if helpful for auto-detect.
5. **No `null` `widthBytes`.** Every entry must have a real head width.
6. **Don't change** `protocol`, encoder logic, or any `.js` file. Specs only.

For anything you can't confirm, **leave the current value and note it** in your summary as "unverified — best guess" rather than inventing a number.

## Verification (run after edits)

```bash
cd "src/web"
# 1. JSON still valid:
python3 -c "import json; json.load(open('printers.json')); print('valid')"
# 2. No null head widths:
python3 -c "import json; [print('NULL widthBytes:', p['id']) for p in json.load(open('printers.json'))['printers'] if p.get('widthBytes') is None]"
# 3. Guard math sanity (head=12 → 96px label passes, 1136px strip rejects):
node -e 'const c=(h,hl)=>h&&Math.ceil(hl/8)>h; console.assert(c(12,96)===false); console.assert(c(12,1136)===true); console.log("guard ok")'
```

Then bump the cache version: in `src/web/index.html` increment `printer.js?v=N` only if `printer.js` changed (it shouldn't for a specs-only edit; `printers.json` is fetched fresh, not `?v=`-cached, but the service worker caches it — bump the SW `CACHE` string in `src/web/sw.js` so deployed clients refetch).

## How the guard uses this (reference, do not edit)

`src/web/printer.js` → `print()`:
```js
if (isRotatedPrinter(deviceName, printerModel)) {
  const headBytes = getPrinterWidthBytes(deviceName, printerModel); // from printers.json
  const outgoingWidthBytes = Math.ceil(heightLines / 8);            // width after 90° rotation
  if (headBytes && outgoingWidthBytes > headBytes) throw new Error('Image too wide…');
}
```
Non-rotated printers pad to `widthBytes` during raster build, so they can't overflow. The guard is the safety net; accurate `printers.json` is what makes it correct.
