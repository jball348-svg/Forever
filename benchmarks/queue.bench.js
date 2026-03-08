/**
 * benchmarks/queue.bench.js
 * Benchmark suite for src/queue.js
 */

const { benchmark } = require('../src/performance');
const { createQueue } = require('../src/queue');

const NAME = 'Queue';

async function run() {
  const results = [];

  // High-throughput enqueue / dequeue
  results.push(await benchmark('queue.enqueue+dequeue (1k)', async () => {
    const q = createQueue({ concurrency: 5 });
    const tasks = Array.from({ length: 1000 }, (_, i) => () => Promise.resolve(i));
    for (const t of tasks) q.add(t);
    await q.drain ? q.drain() : Promise.resolve();
  }, { iterations: 20 }));

  // Serial queue (concurrency 1)
  results.push(await benchmark('queue.serial (100 tasks)', async () => {
    const q = createQueue({ concurrency: 1 });
    const tasks = Array.from({ length: 100 }, (_, i) => () => Promise.resolve(i));
    for (const t of tasks) q.add(t);
    await q.drain ? q.drain() : Promise.resolve();
  }, { iterations: 50 }));

  return results;
}

module.exports = { name: NAME, run };
