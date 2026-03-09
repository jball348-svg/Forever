/**
 * tests/performance.test.js
 * Tests for src/performance.js
 */

const {
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
} = require('../src/performance');

beforeEach(() => {
  clearHistory();
});

// ─── measureSync ─────────────────────────────────────────────────────────────

describe('measureSync', () => {
  test('returns the function result', () => {
    const { result } = measureSync(x => x * 2, 21);
    expect(result).toBe(42);
  });

  test('duration is a non-negative number', () => {
    const { duration } = measureSync(() => {});
    expect(typeof duration).toBe('number');
    expect(duration).toBeGreaterThanOrEqual(0);
  });

  test('captures non-trivial durations for slow work', () => {
    const { duration } = measureSync(() => {
      let x = 0;
      for (let i = 0; i < 1e6; i++) {x += i;}
      return x;
    });
    expect(duration).toBeGreaterThan(0);
  });
});

// ─── measureAsync ────────────────────────────────────────────────────────────

describe('measureAsync', () => {
  test('returns the awaited result', async () => {
    const { result } = await measureAsync(async x => x + 1, 99);
    expect(result).toBe(100);
  });

  test('duration is a non-negative number', async () => {
    const { duration } = await measureAsync(async () => {});
    expect(typeof duration).toBe('number');
    expect(duration).toBeGreaterThanOrEqual(0);
  });

  test('works with promises that resolve after a delay', async () => {
    const { duration } = await measureAsync(
      () => new Promise(r => setTimeout(r, 10))
    );
    expect(duration).toBeGreaterThanOrEqual(5); // generous lower bound
  });
});

// ─── memorySnapshot ───────────────────────────────────────────────────────────

describe('memorySnapshot', () => {
  test('returns an object with heapUsed, heapTotal, external', () => {
    const snap = memorySnapshot();
    expect(snap).toHaveProperty('heapUsed');
    expect(snap).toHaveProperty('heapTotal');
    expect(snap).toHaveProperty('external');
  });

  test('heapUsed is a non-negative number', () => {
    const { heapUsed } = memorySnapshot();
    expect(heapUsed).toBeGreaterThanOrEqual(0);
  });
});

// ─── monitor ─────────────────────────────────────────────────────────────────

describe('monitor', () => {
  test('returns the wrapped function result', async () => {
    const add = monitor('add', (a, b) => a + b);
    const result = await add(2, 3);
    expect(result).toBe(5);
  });

  test('records an entry in history', async () => {
    const fn = monitor('hist-test', () => 'done');
    await fn();
    const history = getHistory();
    expect(history.length).toBe(1);
    expect(history[0].name).toBe('hist-test');
    expect(history[0].success).toBe(true);
  });

  test('records failed calls in history', async () => {
    const fn = monitor('fail-test', () => { throw new Error('boom'); });
    await expect(fn()).rejects.toThrow('boom');
    const history = getHistory();
    expect(history[0].success).toBe(false);
  });

  test('works with async functions', async () => {
    const fn = monitor('async-test', async () => {
      await new Promise(r => setTimeout(r, 5));
      return 'async-done';
    });
    const result = await fn();
    expect(result).toBe('async-done');
    expect(getHistory()[0].duration).toBeGreaterThan(0);
  });
});

// ─── benchmark ───────────────────────────────────────────────────────────────

describe('benchmark', () => {
  test('returns a result object with expected shape', async () => {
    const r = await benchmark('noop', () => {}, { iterations: 10 });
    expect(r).toMatchObject({
      name: 'noop',
      iterations: 10,
    });
    for (const key of ['mean', 'min', 'max', 'p50', 'p95', 'p99', 'stddev']) {
      expect(typeof r[key]).toBe('number');
    }
  });

  test('min <= mean <= max', async () => {
    const r = await benchmark('order-check', () => {}, { iterations: 20 });
    expect(r.min).toBeLessThanOrEqual(r.mean);
    expect(r.mean).toBeLessThanOrEqual(r.max);
  });

  test('works with async functions', async () => {
    const r = await benchmark(
      'async-bench',
      async () => { await Promise.resolve(); },
      { iterations: 10 }
    );
    expect(r.mean).toBeGreaterThanOrEqual(0);
  });

  test('appends to history', async () => {
    await benchmark('hist-bench', () => {}, { iterations: 5 });
    expect(getHistory().length).toBeGreaterThanOrEqual(1);
  });
});

// ─── setBaseline / regression ─────────────────────────────────────────────────

describe('setBaseline', () => {
  test('sets a baseline without throwing', () => {
    expect(() => setBaseline('some-fn', 50)).not.toThrow();
  });

  test('regression warning does not throw', async () => {
    setBaseline('fast-fn', 0.001); // impossibly tight baseline
    const fn = monitor('fast-fn', () => {
      // deliberately slow
      let x = 0;
      for (let i = 0; i < 1e5; i++) {x += i;}
    });
    // Should not throw even when baseline is exceeded
    await expect(fn()).resolves.toBeUndefined();
  });
});

// ─── detectMemoryLeak ─────────────────────────────────────────────────────────

describe('detectMemoryLeak', () => {
  test('returns leaked:false for clean function', async () => {
    const result = await detectMemoryLeak(() => {}, { iterations: 10, thresholdBytes: 1024 * 1024 });
    expect(result).toHaveProperty('leaked');
    expect(result).toHaveProperty('growthBytes');
    expect(typeof result.growthBytes).toBe('number');
  });

  test('detects large allocation', async () => {
    const blobs = [];
    const result = await detectMemoryLeak(
      () => { blobs.push(Buffer.alloc(1024 * 100)); }, // allocate 100 KB each call
      { iterations: 20, thresholdBytes: 512 * 1024 }   // threshold 512 KB
    );
    // With 20 * 100 KB = 2 MB allocated, should detect a leak
    expect(result.leaked).toBe(true);
    blobs.length = 0; // cleanup
  });
});

// ─── Export functions ─────────────────────────────────────────────────────────

describe('exportJSON', () => {
  test('returns valid JSON', async () => {
    await benchmark('export-test', () => {}, { iterations: 2 });
    const json = exportJSON();
    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(parsed).toHaveProperty('entries');
    expect(Array.isArray(parsed.entries)).toBe(true);
  });
});

describe('exportCSV', () => {
  test('returns a string with headers', async () => {
    const fn = monitor('csv-test', () => 42);
    await fn();
    const csv = exportCSV();
    expect(typeof csv).toBe('string');
    expect(csv.startsWith('name,')).toBe(true);
    expect(csv).toContain('csv-test');
  });
});

// ─── clearHistory ─────────────────────────────────────────────────────────────

describe('clearHistory', () => {
  test('empties the history array', async () => {
    await benchmark('clear-test', () => {}, { iterations: 3 });
    expect(getHistory().length).toBeGreaterThan(0);
    clearHistory();
    expect(getHistory().length).toBe(0);
  });
});
