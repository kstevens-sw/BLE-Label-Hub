# BLE Label Hub Manual

A practical guide to connecting supported BLE label printers, building labels in the editor, and printing cleanly from the browser.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Workspace Basics](#workspace-basics)
3. [Adding Elements](#adding-elements)
4. [Editing Properties](#editing-properties)
5. [Printer Setup](#printer-setup)
6. [Templates and Batch Printing](#templates-and-batch-printing)
7. [Custom Printer Definitions](#custom-printer-definitions)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

Open the app in Chrome, Edge, or another Chromium-based browser on a desktop or Android device. Web Bluetooth is the primary connection path for BLE printers. Some printers can also be used over USB when supported by the app.

> Fast path: choose your printer model in Print Settings, click Connect, then start designing.

1. Connect the printer from the browser’s device picker.
2. Add text, barcodes, QR codes, shapes, and images to the canvas.
3. Use the print controls to send the finished label to the device.

## Workspace Basics

The editor is split into three parts:

- Top controls for connecting, printing, label size, and settings.
- Center canvas for laying out the label.
- Right panel for the selected element’s properties and printer options.

Drag elements on the canvas to reposition them. Use the handles to resize or rotate supported items.

## Adding Elements

Use the toolbar to add content to the label. Every object can be moved, resized, and styled after placement.

- Text for names, addresses, prices, or notes.
- Barcode for Code 128, Code 39, EAN, UPC, and related formats.
- QR code for URLs, payloads, or short records.
- Shape for boxes, circles, triangles, and divider lines.
- Image for logos, symbols, and imported artwork.

## Editing Properties

Select an element to open its properties. The panel changes based on the item type, but common controls usually include position, size, rotation, alignment, font, and stroke or fill options.

For text fields, you can also insert template fields and expressions so the same design can be reused with different data.

Use the keyboard shortcuts shown in the app for undo, redo, duplicate, group, and nudge actions.

## Printer Setup

Choose the model that matches your printer in Print Settings. The app uses that profile to select width, DPI, and protocol behavior.

| Printer family | Notes |
| --- | --- |
| Jadens BLE and TSPL models | Use the Jadens profiles and select the exact make/model when possible. |
| NIIMBOT BLE models | Supported through the app’s NIIMBOT transport and printer library integration. |
| Compatible printer profiles | Kept for compatibility with existing hardware layouts and user-created definitions. |

If auto-detection does not pick the right model, manually choose the closest match in Print Settings before printing.

## Templates and Batch Printing

Templates let you create a single design and fill it with multiple data rows. Use `{{FieldName}}` placeholders inside text, barcode, or QR code content.

- Import data from CSV or paste rows into the template data dialog.
- Preview the generated labels before sending them to the printer.
- Print all rows or selected rows with progress tracking.

## Custom Printer Definitions

You can add or override printer definitions from the printer settings dialog. That is useful when you want a custom width, a different density profile, or a BLE name pattern for automatic detection.

- Create a new definition when a model is missing from the built-in list.
- Override an existing definition when your hardware revision behaves differently.
- Use name patterns to make the app recognize printers automatically on connect.

## Troubleshooting

- If the printer does not appear, confirm the browser supports Web Bluetooth, keep the printer awake, and verify the model is BLE-capable.
- If print output is offset, check width, DPI, and label size in Print Settings.
- If nothing prints, reconnect, verify the selected printer model, and retry with a simple text label first.

BLE Label Hub is a browser-based label editor for supported BLE printers. Keep the browser tab open while connecting and printing.
