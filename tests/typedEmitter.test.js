'use strict';

const assert = require('assert');
const { createTypedEmitter, createAsyncTypedEmitter } = require('../src/typedEmitter');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    const r = fn();
    if (r && typeof r.then === 'function') {
      return r.then(() => { console.log(`  ✔ ${name}`); passed++; })
              .catch(err => { console.error(`  ✖ ${name}\n    ${err.message}`); failed++; });
    }
    console.log(`  ✔ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ ${name}\n    ${err.message}`);
    failed++;
  }
  return Promise.resolve();
}

async function runTests() {
  console.log('\nTyped Emitter Tests');
  console.log('===================');

  console.log('\n[Basic emit/on]');

  await test('handler is called on emit', () => {
    const e = createTypedEmitter();
    let called = false;
    e.on('foo', () => { called = true; });
    e.emit('foo');
    assert.ok(called);
  });

  await test('handler receives emitted args', () => {
    const e = createTypedEmitter();
    let received;
    e.on('data', (v) => { received = v; });
    e.emit('data', 42);
    assert.strictEqual(received, 42);
  });

  await test('on() returns an unsubscribe function', () => {
    const e = createTypedEmitter();
    let count = 0;
    const unsub = e.on('x', () => count++);
    e.emit('x');
    unsub();
    e.emit('x');
    assert.strictEqual(count, 1);
  });

  await test('multiple handlers fire in order', () => {
    const e = createTypedEmitter();
    const log = [];
    e.on('go', () => log.push(1));
    e.on('go', () => log.push(2));
    e.emit('go');
    assert.deepStrictEqual(log, [1, 2]);
  });

  console.log('\n[once]');

  await test('once fires exactly once', () => {
    const e = createTypedEmitter();
    let count = 0;
    e.once('ping', () => count++);
    e.emit('ping');
    e.emit('ping');
    assert.strictEqual(count, 1);
  });

  await test('once returns an unsubscribe before first fire', () => {
    const e = createTypedEmitter();
    let count = 0;
    const unsub = e.once('z', () => count++);
    unsub();
    e.emit('z');
    assert.strictEqual(count, 0);
  });

  console.log('\n[off]');

  await test('off removes a specific handler', () => {
    const e = createTypedEmitter();
    let count = 0;
    const h = () => count++;
    e.on('ev', h);
    e.emit('ev');
    e.off('ev', h);
    e.emit('ev');
    assert.strictEqual(count, 1);
  });

  await test('off does not throw for unknown event', () => {
    const e = createTypedEmitter();
    assert.doesNotThrow(() => e.off('nonexistent', () => {}));
  });

  console.log('\n[wildcard]');

  await test('wildcard handler receives all events', () => {
    const e = createTypedEmitter();
    const received = [];
    e.on('*', (event) => received.push(event));
    e.emit('a');
    e.emit('b');
    assert.deepStrictEqual(received, ['a', 'b']);
  });

  await test('wildcard handler receives event name and args', () => {
    const e = createTypedEmitter();
    let capturedEvent, capturedArg;
    e.on('*', (event, val) => { capturedEvent = event; capturedArg = val; });
    e.emit('click', 99);
    assert.strictEqual(capturedEvent, 'click');
    assert.strictEqual(capturedArg, 99);
  });

  console.log('\n[removeAllListeners / listenerCount / eventNames]');

  await test('removeAllListeners(event) clears that event', () => {
    const e = createTypedEmitter();
    let count = 0;
    e.on('a', () => count++);
    e.on('a', () => count++);
    e.removeAllListeners('a');
    e.emit('a');
    assert.strictEqual(count, 0);
  });

  await test('removeAllListeners() clears all events', () => {
    const e = createTypedEmitter();
    let count = 0;
    e.on('x', () => count++);
    e.on('y', () => count++);
    e.removeAllListeners();
    e.emit('x');
    e.emit('y');
    assert.strictEqual(count, 0);
  });

  await test('listenerCount returns correct count', () => {
    const e = createTypedEmitter();
    e.on('q', () => {});
    e.on('q', () => {});
    assert.strictEqual(e.listenerCount('q'), 2);
    assert.strictEqual(e.listenerCount('missing'), 0);
  });

  await test('eventNames returns names with listeners', () => {
    const e = createTypedEmitter();
    e.on('alpha', () => {});
    e.on('beta', () => {});
    const names = e.eventNames();
    assert.ok(names.includes('alpha'));
    assert.ok(names.includes('beta'));
  });

  await test('listeners() returns a copy', () => {
    const e = createTypedEmitter();
    const h = () => {};
    e.on('t', h);
    const list = e.listeners('t');
    assert.strictEqual(list.length, 1);
    list.push(() => {}); // mutate the copy
    assert.strictEqual(e.listenerCount('t'), 1); // original unaffected
  });

  console.log('\n[Async emitter]');

  await test('async emit awaits handlers', async () => {
    const e = createAsyncTypedEmitter();
    const log = [];
    e.on('step', async () => {
      await new Promise(r => setTimeout(r, 5));
      log.push(1);
    });
    e.on('step', async () => { log.push(2); });
    await e.emit('step');
    assert.deepStrictEqual(log, [1, 2]);
  });

  await test('async emit propagates errors', async () => {
    const e = createAsyncTypedEmitter();
    e.on('fail', async () => { throw new Error('async error'); });
    await assert.rejects(() => e.emit('fail'), /async error/);
  });

  await test('async emitter supports wildcard', async () => {
    const e = createAsyncTypedEmitter();
    const seen = [];
    e.on('*', async (event) => { seen.push(event); });
    await e.emit('hello');
    await e.emit('world');
    assert.deepStrictEqual(seen, ['hello', 'world']);
  });

  console.log(`\n${'='.repeat(30)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
