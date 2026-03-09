'use strict';

const assert = require('assert');
const { createCircuitBreaker, CircuitOpenError } = require('../src/circuitbreaker');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(() => {
        console.log(`  ✔ ${name}`);
        passed++;
      }).catch(err => {
        console.error(`  ✖ ${name}`);
        console.error(`    ${err.message}`);
        failed++;
      });
    }
    console.log(`  ✔ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
  return Promise.resolve();
}

async function runTests() {
  console.log('\nCircuit Breaker Tests');
  console.log('=====================');

  // Helpers
  const succeed = async (val = 'ok') => val;
  const fail = async () => { throw new Error('remote failure'); };

  console.log('\n[Basic behaviour]');

  await test('passes through successful calls', async () => {
    const cb = createCircuitBreaker(succeed);
    const result = await cb.call('hello');
    assert.strictEqual(result, 'hello');
    assert.strictEqual(cb.getState(), 'closed');
  });

  await test('re-throws errors from the wrapped function', async () => {
    const cb = createCircuitBreaker(fail, { failureThreshold: 10 });
    await assert.rejects(() => cb.call(), /remote failure/);
    assert.strictEqual(cb.getState(), 'closed');
  });

  await test('increments failure count on each error', async () => {
    const cb = createCircuitBreaker(fail, { failureThreshold: 10 });
    for (let i = 0; i < 3; i++) {
      try { await cb.call(); } catch (_) {/* expected */}
    }
    assert.strictEqual(cb.getStats().failures, 3);
    assert.strictEqual(cb.getStats().totalFailures, 3);
  });

  await test('resets failure count after a success', async () => {
    let calls = 0;
    const flaky = async () => {
      calls++;
      if (calls <= 2) {throw new Error('fail');}
      return 'ok';
    };
    const cb = createCircuitBreaker(flaky, { failureThreshold: 10 });
    try { await cb.call(); } catch (_) {}
    try { await cb.call(); } catch (_) {}
    await cb.call(); // success
    assert.strictEqual(cb.getStats().failures, 0);
  });

  console.log('\n[Circuit opening]');

  await test('opens circuit after failure threshold', async () => {
    const cb = createCircuitBreaker(fail, { failureThreshold: 3 });
    for (let i = 0; i < 3; i++) {
      try { await cb.call(); } catch (_) {}
    }
    assert.strictEqual(cb.getState(), 'open');
  });

  await test('throws CircuitOpenError when circuit is open', async () => {
    const cb = createCircuitBreaker(fail, { failureThreshold: 2 });
    for (let i = 0; i < 2; i++) {
      try { await cb.call(); } catch (_) {}
    }
    await assert.rejects(
      () => cb.call(),
      (err) => err instanceof CircuitOpenError && err.state === 'open'
    );
  });

  await test('fires onOpen callback when circuit opens', async () => {
    let opened = false;
    const cb = createCircuitBreaker(fail, {
      failureThreshold: 2,
      onOpen: () => { opened = true; }
    });
    for (let i = 0; i < 2; i++) {
      try { await cb.call(); } catch (_) {}
    }
    assert.ok(opened);
  });

  console.log('\n[Half-open and closing]');

  await test('transitions to half-open after timeout', async () => {
    const cb = createCircuitBreaker(fail, { failureThreshold: 1, timeout: 10 });
    try { await cb.call(); } catch (_) {}
    assert.strictEqual(cb.getState(), 'open');
    await new Promise(r => setTimeout(r, 20));
    // Next call should try half-open
    try { await cb.call(); } catch (_) {}
    // It will fail and reopen, but state was half-open during the attempt
    // We check the state is open again after failure
    assert.strictEqual(cb.getState(), 'open');
  });

  await test('closes circuit after success threshold in half-open', async () => {
    let calls = 0;
    const halfOpenFn = async () => {
      calls++;
      if (calls <= 1) {throw new Error('fail');} // force open
      return 'ok'; // then succeed
    };
    const cb = createCircuitBreaker(halfOpenFn, {
      failureThreshold: 1,
      successThreshold: 2,
      timeout: 10
    });
    try { await cb.call(); } catch (_) {} // opens circuit
    await new Promise(r => setTimeout(r, 20)); // wait for timeout
    await cb.call(); // half-open, success 1
    await cb.call(); // half-open, success 2 -> should close
    assert.strictEqual(cb.getState(), 'closed');
  });

  await test('fires onClose callback', async () => {
    let closed = false;
    let calls = 0;
    const fn = async () => {
      if (calls++ === 0) {throw new Error('fail');}
      return 'ok';
    };
    const cb = createCircuitBreaker(fn, {
      failureThreshold: 1,
      successThreshold: 1,
      timeout: 10,
      onClose: () => { closed = true; }
    });
    try { await cb.call(); } catch (_) {}
    await new Promise(r => setTimeout(r, 20));
    await cb.call();
    assert.ok(closed);
  });

  console.log('\n[Reset]');

  await test('reset() restores closed state and clears stats', async () => {
    const cb = createCircuitBreaker(fail, { failureThreshold: 1 });
    try { await cb.call(); } catch (_) {}
    assert.strictEqual(cb.getState(), 'open');
    cb.reset();
    assert.strictEqual(cb.getState(), 'closed');
    assert.strictEqual(cb.getStats().totalCalls, 0);
    assert.strictEqual(cb.getStats().failures, 0);
  });

  await test('CircuitOpenError has correct properties', () => {
    const err = new CircuitOpenError('open');
    assert.ok(err instanceof Error);
    assert.strictEqual(err.name, 'CircuitOpenError');
    assert.strictEqual(err.state, 'open');
    assert.ok(err.message.includes('open'));
  });

  console.log(`\n${'='.repeat(30)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {process.exit(1);}
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
