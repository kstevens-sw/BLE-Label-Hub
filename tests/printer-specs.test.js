// Unit tests for printer hardware specs — guard against head-width regressions.
// Run: node tests/printer-specs.test.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');

// Load printers.json
const printersPath = path.join(projectRoot, 'src/web/printers.json');
const printersData = JSON.parse(fs.readFileSync(printersPath, 'utf8'));
const printerMap = new Map(printersData.printers.map(p => [p.id, p]));

function getPrinterSpec(id) {
  return printerMap.get(id);
}

// Test suite
console.log('Testing printer hardware specifications...\n');

// D30/D35/Q30: 12-byte head (96px @ 203 DPI)
const d30 = getPrinterSpec('d-series-9b');
assert.strictEqual(d30.widthBytes, 12, 'D30/D35/Q30 head width must be 12 bytes (96px @ 203 DPI)');
assert.strictEqual(d30.dpi, 203, 'D30/D35/Q30 DPI must be 203');
assert.strictEqual(d30.rotated, true, 'D30/D35/Q30 must be marked as rotated');
console.log('✓ d-series-9b (D30/D35/Q30): widthBytes=12, dpi=203, rotated=true');

// Q30S: 12-byte head (96px @ 203 DPI), accepts 15mm paper but prints 12mm max
const q30s = getPrinterSpec('d-series-q30s');
assert.strictEqual(q30s.widthBytes, 12, 'Q30S head width must be 12 bytes (96px @ 203 DPI)');
assert.strictEqual(q30s.dpi, 203, 'Q30S DPI must be 203');
assert.strictEqual(q30s.rotated, true, 'Q30S must be marked as rotated');
console.log('✓ d-series-q30s (Q30S): widthBytes=12, dpi=203, rotated=true (paper-width ≠ printhead)');

// D50: 22-byte head (176px @ 180 DPI)
const d50 = getPrinterSpec('d-series-d50');
assert.strictEqual(d50.widthBytes, 22, 'D50 head width must be 22 bytes (176px @ 180 DPI)');
assert.strictEqual(d50.dpi, 180, 'D50 DPI must be 180');
assert.strictEqual(d50.rotated, true, 'D50 must be marked as rotated');
console.log('✓ d-series-d50 (D50): widthBytes=22, dpi=180, rotated=true');

// P12: 12-byte head (96px @ 203 DPI)
const p12 = getPrinterSpec('p12');
assert.strictEqual(p12.widthBytes, 12, 'P12 head width must be 12 bytes (96px @ 203 DPI)');
assert.strictEqual(p12.dpi, 203, 'P12 DPI must be 203');
assert.strictEqual(p12.rotated, true, 'P12 must be marked as rotated');
console.log('✓ p12 (P12/P12 Pro): widthBytes=12, dpi=203, rotated=true');

// A30: 15-byte head (120px @ 203 DPI)
const a30 = getPrinterSpec('a30');
assert.strictEqual(a30.widthBytes, 15, 'A30 head width must be 15 bytes (120px @ 203 DPI)');
assert.strictEqual(a30.dpi, 203, 'A30 DPI must be 203');
assert.strictEqual(a30.rotated, true, 'A30 must be marked as rotated');
console.log('✓ a30 (A30): widthBytes=15, dpi=203, rotated=true');

// Test the guard math: rotation overflow detection
function testGuardMath() {
  const testCases = [
    // [headBytes, heightPixels, shouldPass, description]
    [12, 96, true, 'D30 at 96px (max 12mm at 203 DPI)'],
    [12, 97, false, 'D30 at 97px (exceeds 12mm)'],
    [12, 1136, false, 'D30 at 1136px (Auto-Fill regression test)'],
    [22, 176, true, 'D50 at 176px (max 24mm at 180 DPI)'],
    [22, 177, false, 'D50 at 177px (exceeds 24mm)'],
    [15, 120, true, 'A30 at 120px (max 15mm at 203 DPI)'],
    [15, 121, false, 'A30 at 121px (exceeds 15mm)'],
  ];

  testCases.forEach(([headBytes, heightPixels, shouldPass, desc]) => {
    const outgoingWidthBytes = Math.ceil(heightPixels / 8);
    const passes = outgoingWidthBytes <= headBytes;
    const status = passes === shouldPass ? '✓' : '✗';
    assert.strictEqual(
      passes,
      shouldPass,
      `Guard math failed for ${desc}: headBytes=${headBytes}, heightPixels=${heightPixels}, outgoingWidthBytes=${outgoingWidthBytes}`
    );
    console.log(`  ${status} ${desc}: ${heightPixels}px → ${outgoingWidthBytes} bytes, ${passes ? 'passes' : 'rejects'}`);
  });
}

console.log('\nTesting guard math (90° rotation overflow detection):');
testGuardMath();

console.log('\n✓ All printer spec tests passed!');
