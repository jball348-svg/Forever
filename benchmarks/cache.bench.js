/**
 * benchmarks/cache.bench.js
 * Benchmark suite for src/cache.js
 */

const { benchmark } = require('../src/performance');
const { createCache } = require('../src/cache');

const NAME = 'Cache';

async function run() {
  const results = [];

  // Benchmark: set / get small values
  results.push(await benchmark('cache.set+get (small)', async () => {
    const cache = createCache({ maxSize: 1000 });
    for (let i = 0; i < 100; i++) {cache.set(`key-${i}`, i);}
    for (let i = 0; i < 100; i++) {cache.get(`key-${i}`);}
  }, { iterations: 200 }));

  // Benchmark: LRU eviction under load
  results.push(await benchmark('cache.set+get (eviction)', async () => {
    const cache = createCache({ maxSize: 50 });
    for (let i = 0; i < 200; i++) {cache.set(`key-${i}`, i);}
    for (let i = 0; i < 200; i++) {cache.get(`key-${i}`);}
  }, { iterations: 100 }));

  return results;
}

module.exports = { name: NAME, run };
