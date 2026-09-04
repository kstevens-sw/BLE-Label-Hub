/**
 * In-app debug log.
 *
 * The printer talks over BLE from a phone, where there is no devtools console,
 * and the interesting part of a failure is always the TIMING: which byte the
 * stream stalled on, how long a write took, whether the printer said anything
 * back before it stopped. So this tees console output into a ring buffer with
 * a delta-ms column and shows it in the app.
 *
 * ponytail: patches console instead of threading a logger through every call
 * site — every existing console.log in ble.js/printer.js is already exactly
 * the trace we want, and this way they keep working unchanged.
 */

const MAX_ENTRIES = 3000;

const entries = [];
let installed = false;
let lastStamp = 0;

/**
 * @param {string} level - log | warn | error
 * @param {string} text
 */
function record(level, text) {
  const now = performance.now();
  const delta = lastStamp ? Math.round(now - lastStamp) : 0;
  lastStamp = now;
  entries.push({ t: now, delta, level, text });
  // Ring buffer: a full print is ~100 lines, a long session is thousands.
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
}

function stringify(args) {
  return args.map(arg => {
    if (typeof arg === 'string') return arg;
    if (arg instanceof Uint8Array) return Array.from(arg).map(b => b.toString(16).padStart(2, '0')).join(' ');
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }).join(' ');
}

/**
 * Start capturing. Safe to call more than once.
 */
export function installDebugLog() {
  if (installed) return;
  installed = true;
  lastStamp = performance.now();

  for (const level of ['log', 'warn', 'error']) {
    const original = console[level].bind(console);
    console[level] = (...args) => {
      try {
        record(level, stringify(args));
      } catch {
        // Never let logging break the thing being logged.
      }
      original(...args);
    };
  }

  // A backgrounded tab has its timers throttled to ~1s, which stretches the
  // pacing delays between BLE writes and starves a print mid-raster. If a print
  // failed because the screen slept or the user switched apps, this is the line
  // that says so.
  document.addEventListener('visibilitychange', () =>
    record('log', `Page ${document.visibilityState}${document.hidden ? ' — timers throttled, prints will stall' : ''}`));

  window.addEventListener('error', e => record('error', `Uncaught: ${e.message} @ ${e.filename}:${e.lineno}`));
  window.addEventListener('unhandledrejection', e => record('error', `Unhandled rejection: ${e.reason?.message || e.reason}`));

  record('log', `Debug log started — ${navigator.userAgent}`);
}

/**
 * Add a line directly, for events that are not console-worthy in production.
 */
export function debugMark(text) {
  record('log', text);
}

/**
 * The captured log as text, newest last.
 * @param {boolean} withHeader - prepend environment info (for pasting into a bug report)
 */
export function getDebugLogText(withHeader = true) {
  const body = entries
    .map(e => `${(e.t / 1000).toFixed(3)}s +${String(e.delta).padStart(5)}ms ${e.level === 'log' ? ' ' : e.level[0].toUpperCase()} ${e.text}`)
    .join('\n');
  if (!withHeader) return body;
  return [
    `BLE Label Hub debug log`,
    `captured: ${new Date().toISOString()}`,
    `agent:    ${navigator.userAgent}`,
    `lines:    ${entries.length}${entries.length >= MAX_ENTRIES ? ' (oldest dropped)' : ''}`,
    '',
    body,
  ].join('\n');
}

export function getDebugLogEntries() {
  return entries.slice();
}

export function clearDebugLog() {
  entries.length = 0;
  lastStamp = performance.now();
  record('log', 'Debug log cleared');
}
