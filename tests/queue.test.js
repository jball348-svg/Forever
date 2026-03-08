const assert = require('assert');
const { createQueue } = require('../src/queue');

async function runTests() {
  // Basic result resolution
  const q = createQueue(2);
  const r1 = await q.add(() => Promise.resolve('first'));
  assert.strictEqual(r1, 'first', 'should resolve with task result');

  // Concurrency: track simultaneous executions
  const q2 = createQueue(2);
  let concurrent = 0;
  let maxConcurrent = 0;
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const task = async () => {
    concurrent++;
    maxConcurrent = Math.max(maxConcurrent, concurrent);
    await delay(50);
    concurrent--;
    return concurrent;
  };
  await Promise.all([q2.add(task), q2.add(task), q2.add(task), q2.add(task)]);
  assert.ok(maxConcurrent <= 2, `concurrency should not exceed 2, got ${maxConcurrent}`);

  // All results resolve correctly
  const q3 = createQueue(3);
  const results = await Promise.all([1, 2, 3].map(n => q3.add(() => Promise.resolve(n * 10))));
  assert.deepStrictEqual(results, [10, 20, 30]);

  console.log('All queue tests passed!');
}

runTests().catch(err => { console.error(err); process.exit(1); });
