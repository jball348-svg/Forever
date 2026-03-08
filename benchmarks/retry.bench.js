/**
 * benchmarks/retry.bench.js
 * Benchmark suite for src/retry.js
 */

const { benchmark } = require('../src/performance');
const { retry }     = require('../src/retry');

const NAME = 'Retry';

async function run() {
  const results = [];

  // Always-succeeds path (no retries)
  results.push(await benchmark('retry.success on first attempt', async () => {
    await retry(() => Promise.resolve('ok'), { attempts: 3, delay: 0 });
  }, { iterations: 500 }));

  // Fails once then succeeds
  results.push(await benchmark('retry.success on 2nd attempt', async () => {
    let calls = 0;
    await retry(() => {
      calls++;
      if (calls < 2) return Promise.reject(new Error('fail'));
      return Promise.resolve('ok');
    }, { attempts: 3, delay: 0 });
  }, { iterations: 300 }));

  return results;
}

module.exports = { name: NAME, run };
