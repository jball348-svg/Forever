const assert = require('assert');
const cache = require('../src/cache');

async function runTests() {
  // Basic set/get
  cache.set('token', 'abc123', 200);
  assert.strictEqual(cache.get('token'), 'abc123', 'should retrieve value before TTL expires');
  assert.strictEqual(cache.has('token'), true, 'has() should return true before expiry');

  // Wait for TTL to expire
  await new Promise(r => setTimeout(r, 250));
  assert.strictEqual(cache.get('token'), undefined, 'should return undefined after TTL expires');
  assert.strictEqual(cache.has('token'), false, 'has() should return false after expiry');

  // delete
  cache.set('temp', 'value', 5000);
  assert.strictEqual(cache.has('temp'), true);
  cache.delete('temp');
  assert.strictEqual(cache.has('temp'), false, 'should be gone after delete');

  // Missing key
  assert.strictEqual(cache.get('nonexistent'), undefined);

  console.log('All cache tests passed!');
}

runTests().catch(err => { console.error(err); process.exit(1); });
