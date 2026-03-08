# Forever – Benchmark Suite

This directory contains performance benchmarks for every major module in the Forever library.

## Running

```bash
node benchmarks/index.js
```

Reports are written to `benchmarks/reports/` in both JSON and CSV formats.

## Individual benchmarks

| File | Module |
|------|--------|
| `cache.bench.js` | `src/cache.js` |
| `memoize.bench.js` | `src/memoize.js` |
| `eventBus.bench.js` | `src/eventBus.js` |
| `queue.bench.js` | `src/queue.js` |
| `retry.bench.js` | `src/retry.js` |
| `pipeline.bench.js` | `src/pipeline.js` |
| `validator.bench.js` | `src/validator.js` |

## Options

Each benchmark accepts `{ iterations, warmup }` options – see `src/performance.js` for details.

## Memory leak detection

Use `detectMemoryLeak(fn)` from `src/performance.js` to check any function for heap growth.

```js
const { detectMemoryLeak } = require('./src/performance');
const result = await detectMemoryLeak(myFn, { iterations: 100 });
console.log(result); // { leaked: false, growthBytes: 512 }
```
