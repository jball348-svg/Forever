/**
 * benchmarks/pipeline.bench.js
 * Benchmark suite for src/pipeline.js
 */

const { benchmark } = require('../src/performance');
const { pipeline }  = require('../src/pipeline');

const NAME = 'Pipeline';

async function run() {
  const results = [];

  const double = x => x * 2;
  const addOne = x => x + 1;
  const square = x => x * x;

  // Small pipeline (3 stages)
  results.push(await benchmark('pipeline.3 stages (sync)', () => {
    const pipe = pipeline(double, addOne, square);
    for (let i = 0; i < 1000; i++) pipe(i);
  }, { iterations: 200 }));

  // Larger pipeline (10 stages)
  const fns = Array.from({ length: 10 }, () => (x => x + 1));
  results.push(await benchmark('pipeline.10 stages (sync)', () => {
    const pipe = pipeline(...fns);
    for (let i = 0; i < 1000; i++) pipe(i);
  }, { iterations: 200 }));

  return results;
}

module.exports = { name: NAME, run };
