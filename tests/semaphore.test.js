'use strict';

const assert = require('assert');
const { createSemaphore } = require('../src/semaphore');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✔ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ ${name}\n    ${err.message}`);
    failed++;
  }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  console.log('\nSemaphore Tests');
  console.log('===============');

  console.log('\n[validation]');

  await test('throws if concurrency < 1', () => {
    assert.throws(() => createSemaphore(0), /concurrency/);
    assert.throws(() => createSemaphore(-1), /concurrency/);
  });

  await test('throws if concurrency is not a number', () => {
    assert.throws(() => createSemaphore('2'), /concurrency/);
  });

  console.log('\n[available / waiting]');

  await test('initial available equals concurrency', () => {
    const s = createSemaphore(3);
    assert.strictEqual(s.available, 3);
    assert.strictEqual(s.waiting, 0);
  });

  await test('acquire reduces available count', async () => {
    const s = createSemaphore(2);
    await s.acquire();
    assert.strictEqual(s.available, 1);
    await s.acquire();
    assert.strictEqual(s.available, 0);
  });

  await test('release increases available count', async () => {
    const s = createSemaphore(1);
    await s.acquire();
    assert.strictEqual(s.available, 0);
    s.release();
    assert.strictEqual(s.available, 1);
  });

  await test('queues callers when all slots taken', async () => {
    const s = createSemaphore(1);
    await s.acquire();
    assert.strictEqual(s.available, 0);

    let resolved = false;
    const waiting = s.acquire().then(() => { resolved = true; });
    assert.strictEqual(s.waiting, 1);
    assert.strictEqual(resolved, false);

    s.release();
    await waiting;
    assert.strictEqual(resolved, true);
    assert.strictEqual(s.waiting, 0);
    assert.strictEqual(s.available, 0);
    s.release(); // clean up
  });

  console.log('\n[run()]');

  await test('run() resolves with fn return value', async () => {
    const s = createSemaphore(2);
    const result = await s.run(() => 42);
    assert.strictEqual(result, 42);
    assert.strictEqual(s.available, 2);
  });

  await test('run() releases slot even if fn throws', async () => {
    const s = createSemaphore(1);
    try {
      await s.run(() => { throw new Error('boom'); });
      assert.fail('should have thrown');
    } catch (err) {
      assert.strictEqual(err.message, 'boom');
    }
    assert.strictEqual(s.available, 1);
  });

  await test('run() releases slot even if async fn rejects', async () => {
    const s = createSemaphore(1);
    try {
      await s.run(async () => { throw new Error('async boom'); });
      assert.fail('should have thrown');
    } catch (err) {
      assert.strictEqual(err.message, 'async boom');
    }
    assert.strictEqual(s.available, 1);
  });

  console.log('\n[concurrency limits]');

  await test('works as a mutex (concurrency=1) - serialises tasks', async () => {
    const s = createSemaphore(1);
    const order = [];

    const t1 = s.run(async () => {
      order.push('t1-start');
      await delay(10);
      order.push('t1-end');
    });
    const t2 = s.run(async () => {
      order.push('t2-start');
      await delay(5);
      order.push('t2-end');
    });

    await Promise.all([t1, t2]);
    assert.deepStrictEqual(order, ['t1-start', 't1-end', 't2-start', 't2-end']);
  });

  await test('allows up to concurrency simultaneous run() calls', async () => {
    const s = createSemaphore(3);
    let concurrent = 0;
    let maxConcurrent = 0;

    const tasks = Array.from({ length: 5 }, () =>
      s.run(async () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await delay(10);
        concurrent--;
      })
    );
    await Promise.all(tasks);
    assert.strictEqual(maxConcurrent, 3);
  });

  console.log(`\n${'='.repeat(30)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) { process.exit(1); }
})().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
