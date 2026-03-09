'use strict';

const assert = require('assert');
const { createTaskRunner } = require('../src/taskRunner');

let passed = 0;
let failed = 0;

function test(name, fn) {
  const r = fn();
  if (r && typeof r.then === 'function') {
    return r.then(() => { console.log(`  ✔ ${name}`); passed++; })
            .catch(err => { console.error(`  ✖ ${name}\n    ${err.message}`); failed++; });
  }
  try {
    console.log(`  ✔ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ ${name}\n    ${err.message}`);
    failed++;
  }
  return Promise.resolve();
}

async function runTests() {
  console.log('\nTask Runner Tests');
  console.log('=================');

  console.log('\n[Basic tasks]');

  await test('runs a simple task', async () => {
    const runner = createTaskRunner();
    runner.task('hello', [], async () => 'world');
    const results = await runner.run('hello');
    assert.strictEqual(results.hello, 'world');
  });

  await test('runs all tasks when no name given', async () => {
    const runner = createTaskRunner();
    runner.task('a', [], async () => 1);
    runner.task('b', [], async () => 2);
    const results = await runner.run();
    assert.strictEqual(results.a, 1);
    assert.strictEqual(results.b, 2);
  });

  console.log('\n[Dependencies]');

  await test('runs dependencies before dependent task', async () => {
    const order = [];
    const runner = createTaskRunner();
    runner.task('first', [], async () => { order.push('first'); return 'F'; });
    runner.task('second', ['first'], async () => { order.push('second'); return 'S'; });
    await runner.run('second');
    assert.strictEqual(order[0], 'first');
    assert.strictEqual(order[1], 'second');
  });

  await test('passes dependency results to dependent task', async () => {
    const runner = createTaskRunner();
    runner.task('fetch', [], async () => ({ data: 42 }));
    runner.task('process', ['fetch'], async ({ fetch }) => fetch.data * 2);
    const results = await runner.run('process');
    assert.strictEqual(results.process, 84);
  });

  await test('deep dependency chain', async () => {
    const runner = createTaskRunner();
    runner.task('a', [], async () => 1);
    runner.task('b', ['a'], async ({ a }) => a + 1);
    runner.task('c', ['b'], async ({ b }) => b + 1);
    const results = await runner.run('c');
    assert.strictEqual(results.c, 3);
  });

  console.log('\n[Circular detection]');

  await test('throws on direct circular dependency', () => {
    const runner = createTaskRunner();
    runner.task('a', [], async () => {});
    runner.task('b', ['a'], async () => {});
    assert.throws(() => runner.task('a', ['b'], async () => {}), /[Cc]ircular/);
  });

  console.log('\n[Concurrency]');

  await test('respects concurrency limit', async () => {
    let running = 0;
    let maxRunning = 0;
    const runner = createTaskRunner({ concurrency: 2 });
    for (let i = 0; i < 4; i++) {
      const name = `t${i}`;
      runner.task(name, [], async () => {
        running++;
        maxRunning = Math.max(maxRunning, running);
        await new Promise(r => setTimeout(r, 20));
        running--;
      });
    }
    await runner.run();
    assert.ok(maxRunning <= 2, `maxRunning was ${maxRunning}, expected <= 2`);
  });

  console.log('\n[Timeout]');

  await test('rejects with timeout error when task exceeds timeout', async () => {
    const runner = createTaskRunner({ timeout: 10 });
    runner.task('slow', [], async () => {
      await new Promise(r => setTimeout(r, 100));
      return 'done';
    });
    await assert.rejects(() => runner.run('slow'), /timed out/);
  });

  console.log('\n[Hooks]');

  await test('onTaskStart fires for each task', async () => {
    const started = [];
    const runner = createTaskRunner({ onTaskStart: (n) => started.push(n) });
    runner.task('x', [], async () => {});
    runner.task('y', [], async () => {});
    await runner.run();
    assert.ok(started.includes('x'));
    assert.ok(started.includes('y'));
  });

  await test('onTaskEnd fires with result', async () => {
    const ended = [];
    const runner = createTaskRunner({ onTaskEnd: (n, r) => ended.push({ n, r }) });
    runner.task('q', [], async () => 99);
    await runner.run();
    assert.strictEqual(ended[0].r, 99);
  });

  await test('onTaskError fires on failure', async () => {
    const errors = [];
    const runner = createTaskRunner({ onTaskError: (n, e) => errors.push({ n, e }) });
    runner.task('bad', [], async () => { throw new Error('oops'); });
    await assert.rejects(() => runner.run());
    assert.strictEqual(errors.length, 1);
    assert.strictEqual(errors[0].e.message, 'oops');
  });

  console.log('\n[Status and reset]');

  await test('getStatus returns pending initially', () => {
    const runner = createTaskRunner();
    runner.task('t', [], async () => {});
    assert.strictEqual(runner.getStatus().t, 'pending');
  });

  await test('getStatus returns done after run', async () => {
    const runner = createTaskRunner();
    runner.task('t', [], async () => 42);
    await runner.run();
    assert.strictEqual(runner.getStatus().t, 'done');
  });

  await test('reset() allows re-run', async () => {
    let count = 0;
    const runner = createTaskRunner();
    runner.task('t', [], async () => ++count);
    await runner.run();
    runner.reset();
    await runner.run();
    assert.strictEqual(count, 2);
  });

  console.log(`\n${'='.repeat(30)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {process.exit(1);}
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
