const assert = require('assert');
const { capitalize, isEmpty, sleep } = require('../src/utils');

// capitalize
assert.strictEqual(capitalize('hello'), 'Hello');
assert.strictEqual(capitalize('already'), 'Already');
assert.strictEqual(capitalize(''), '');
assert.strictEqual(capitalize(null), null);

// isEmpty
assert.strictEqual(isEmpty(null), true);
assert.strictEqual(isEmpty(undefined), true);
assert.strictEqual(isEmpty(''), true);
assert.strictEqual(isEmpty([]), true);
assert.strictEqual(isEmpty({}), true);
assert.strictEqual(isEmpty('hello'), false);
assert.strictEqual(isEmpty([1]), false);
assert.strictEqual(isEmpty({ a: 1 }), false);

// sleep (just verify it returns a Promise and resolves)
async function testSleep() {
  const start = Date.now();
  await sleep(50);
  const elapsed = Date.now() - start;
  assert.ok(elapsed >= 40, `sleep should wait at least ~50ms, got ${elapsed}ms`);
  console.log('All utils tests passed!');
}

testSleep().catch(err => { console.error(err); process.exit(1); });
