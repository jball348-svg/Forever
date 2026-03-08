const assert = require('assert');
const { memoize, memoizeAsync } = require('../src/memoize');

// Sync: caches results
let calls = 0;
const expensive = memoize((n) => { calls++; return n * n; });
assert.strictEqual(expensive(4), 16);
assert.strictEqual(expensive(4), 16);
assert.strictEqual(calls, 1, 'fn should only be called once for same args');
assert.strictEqual(expensive(5), 25);
assert.strictEqual(calls, 2, 'fn should be called for new args');

// Custom key function
const withKey = memoize((a, b) => a + b, args => args[0]);
assert.strictEqual(withKey(1, 99), 100);
assert.strictEqual(withKey(1, 0), 100, 'should use custom key, ignoring second arg');

// Async memoization
async function runAsyncTests() {
  let asyncCalls = 0;
  const asyncFn = memoizeAsync(async (x) => { asyncCalls++; return x * 3; });
  const r1 = await asyncFn(7);
  const r2 = await asyncFn(7);
  assert.strictEqual(r1, 21);
  assert.strictEqual(r2, 21);
  assert.strictEqual(asyncCalls, 1, 'async fn should only be called once for same args');
  console.log('All memoize tests passed!');
}

runAsyncTests().catch(err => { console.error(err); process.exit(1); });
