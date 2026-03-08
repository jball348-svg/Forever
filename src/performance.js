/**
 * performance.js – Performance monitoring, benchmarking and memory-leak detection
 * for the Forever library. Uses Node.js built-in `perf_hooks`.
 */

const { performance, PerformanceObserver } = require('perf_hooks');

// ─── Baseline registry (used for regression detection) ───────────────────────
const _baselines = new Map();
const _history   = [];

// ─── Core timer helpers ───────────────────────────────────────────────────────

/**
 * Measure the wall-clock time (ms) of a synchronous function.
 * @param {Function} fn
 * @param {...*} args
 * @returns {{ result: *, duration: number }}
 */
function measureSync(fn, ...args) {
  const start  = performance.now();
  const result = fn(...args);
  const duration = performance.now() - start;
  return { result, duration };
}

/**
 * Measure the wall-clock time (ms) of an asynchronous function.
 * @param {Function} fn
 * @param {...*} args
 * @returns {Promise<{ result: *, duration: number }>}
 */
async function measureAsync(fn, ...args) {
  const start  = performance.now();
  const result = await fn(...args);
  const duration = performance.now() - start;
  return { result, duration };
}

// ─── Memory snapshot ─────────────────────────────────────────────────────────

/**
 * Returns current heap usage in bytes (Node.js only).
 * @returns {{ heapUsed: number, heapTotal: number, external: number }}
 */
function memorySnapshot() {
  if (typeof process === 'undefined' || !process.memoryUsage) {
    return { heapUsed: 0, heapTotal: 0, external: 0 };
  }
  const { heapUsed, heapTotal, external } = process.memoryUsage();
  return { heapUsed, heapTotal, external };
}

// ─── Performance decorator ────────────────────────────────────────────────────

/**
 * Wraps `fn` so every call is automatically timed and logged to history.
 * Works for both sync and async functions.
 *
 * @param {string}   name  – label for the measurement
 * @param {Function} fn
 * @returns {Function}
 */
function monitor(name, fn) {
  return async function (...args) {
    const memBefore = memorySnapshot();
    const start     = performance.now();
    let result;
    let error;

    try {
      result = await fn.apply(this, args);
    } catch (err) {
      error = err;
    }

    const duration  = performance.now() - start;
    const memAfter  = memorySnapshot();
    const memDelta  = memAfter.heapUsed - memBefore.heapUsed;

    const entry = {
      name,
      duration,
      memDelta,
      timestamp: new Date().toISOString(),
      success: !error,
    };

    _history.push(entry);
    _checkRegression(name, duration);

    if (error) throw error;
    return result;
  };
}

// ─── Benchmark runner ─────────────────────────────────────────────────────────

/**
 * Run `fn` `iterations` times and return aggregate statistics.
 *
 * @param {string}   name
 * @param {Function} fn        – sync or async
 * @param {object}   [opts]
 * @param {number}   [opts.iterations=100]
 * @param {boolean}  [opts.warmup=true]   – run once before measuring
 * @returns {Promise<BenchmarkResult>}
 */
async function benchmark(name, fn, opts = {}) {
  const { iterations = 100, warmup = true } = opts;

  if (warmup) await fn(); // warm JIT

  const times = [];
  let memStart = memorySnapshot();

  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    await fn();
    times.push(performance.now() - t0);
  }

  const memEnd = memorySnapshot();
  const sorted = [...times].sort((a, b) => a - b);
  const sum    = times.reduce((a, b) => a + b, 0);
  const mean   = sum / iterations;
  const min    = sorted[0];
  const max    = sorted[sorted.length - 1];
  const p50    = sorted[Math.floor(iterations * 0.50)];
  const p95    = sorted[Math.floor(iterations * 0.95)];
  const p99    = sorted[Math.floor(iterations * 0.99)];
  const stddev = Math.sqrt(
    times.reduce((acc, t) => acc + (t - mean) ** 2, 0) / iterations
  );

  const result = {
    name,
    iterations,
    mean,
    min,
    max,
    p50,
    p95,
    p99,
    stddev,
    memDeltaBytes: memEnd.heapUsed - memStart.heapUsed,
    timestamp: new Date().toISOString(),
  };

  _history.push({ ...result, type: 'benchmark' });
  return result;
}

// ─── Regression detection ─────────────────────────────────────────────────────

/**
 * Set a performance baseline for a named function.
 * @param {string} name
 * @param {number} durationMs – the expected upper bound in ms
 */
function setBaseline(name, durationMs) {
  _baselines.set(name, durationMs);
}

/**
 * Check whether a measured duration exceeds its baseline (if any).
 * Emits a console warning rather than throwing, to stay non-blocking.
 * @private
 */
function _checkRegression(name, duration) {
  if (!_baselines.has(name)) return;
  const baseline = _baselines.get(name);
  if (duration > baseline * 1.2) {
    // 20% tolerance
    console.warn(
      `[Forever/performance] REGRESSION detected for "${name}": ` +
      `${duration.toFixed(3)}ms > baseline ${baseline}ms (20% tolerance)`
    );
  }
}

// ─── Memory-leak detector ─────────────────────────────────────────────────────

/**
 * Run `fn` `iterations` times and check whether heap grows consistently.
 * Returns `{ leaked: boolean, growthBytes: number }`.
 *
 * @param {Function} fn
 * @param {object}  [opts]
 * @param {number}  [opts.iterations=50]
 * @param {number}  [opts.thresholdBytes=1024*1024]  – warn if growth > 1 MB
 * @returns {Promise<{ leaked: boolean, growthBytes: number }>}
 */
async function detectMemoryLeak(fn, opts = {}) {
  const { iterations = 50, thresholdBytes = 1024 * 1024 } = opts;

  // Give GC a chance before starting
  if (global.gc) global.gc();

  const snapshots = [];
  for (let i = 0; i < iterations; i++) {
    await fn();
    snapshots.push(memorySnapshot().heapUsed);
  }

  const growthBytes = snapshots[snapshots.length - 1] - snapshots[0];
  const leaked = growthBytes > thresholdBytes;

  if (leaked) {
    console.warn(
      `[Forever/performance] Potential memory leak detected: heap grew ` +
      `${(growthBytes / 1024).toFixed(1)} KB over ${iterations} iterations.`
    );
  }

  return { leaked, growthBytes };
}

// ─── Report generation ────────────────────────────────────────────────────────

/**
 * Return all recorded history entries.
 * @returns {object[]}
 */
function getHistory() {
  return [..._history];
}

/**
 * Clear all recorded history entries.
 */
function clearHistory() {
  _history.length = 0;
}

/**
 * Export results as a JSON string.
 * @returns {string}
 */
function exportJSON() {
  return JSON.stringify({ generatedAt: new Date().toISOString(), entries: _history }, null, 2);
}

/**
 * Export results as a CSV string.
 * @returns {string}
 */
function exportCSV() {
  const headers = ['name', 'duration', 'memDelta', 'timestamp', 'success'];
  const rows = _history.map(e =>
    headers.map(h => (e[h] !== undefined ? String(e[h]) : '')).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  measureSync,
  measureAsync,
  memorySnapshot,
  monitor,
  benchmark,
  setBaseline,
  detectMemoryLeak,
  getHistory,
  clearHistory,
  exportJSON,
  exportCSV,
};
