/**
 * benchmarks/memoize.bench.js
 * Benchmark suite for src/memoize.js
 */

const { benchmark } = require('../src/performance');
const { memoize }   = require('../src/memoize');

const NAME = 'Memoize';

function expensiveFib(n) {
  if (n <= 1) return n;
  return expensiveFib(n - 1) + expensiveFib(n - 2);
}

async function run() {
  const results = [];

  // Raw (un-memoized) baseline
  results.push(await benchmark('memoize.raw fib(20)', () => {
    expensiveFib(20);
  }, { iterations: 500 }));

  // Memoized – first call (cache miss)
  const memoFib = memoize(expensiveFib);
  results.push(await benchmark('memoize.memoized fib(20) – miss', () => {
    memoFib.cache && memoFib.cache.clear && memoFib.cache.clear();
    return memoFib(20);
  }, { iterations: 200, warmup: false }));

  // Memoized – subsequent calls (cache hit)
  const memoFib2 = memoize(expensiveFib);
  memoFib2(20); // prime cache
  results.push(await benchmark('memoize.memoized fib(20) – hit', () => {
    return memoFib2(20);
  }, { iterations: 500 }));

  return results;
}

module.exports = { name: NAME, run };
