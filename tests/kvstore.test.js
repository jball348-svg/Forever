'use strict';

const assert = require('assert');
const { createKVStore } = require('../src/kvstore');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('\nKV Store Tests');
console.log('==============');

console.log('\n[Basic get/set]');

test('set and get a value', () => {
  const store = createKVStore();
  store.set('foo', 42);
  assert.strictEqual(store.get('foo'), 42);
  store.destroy();
});

test('get returns undefined for missing key', () => {
  const store = createKVStore();
  assert.strictEqual(store.get('nope'), undefined);
  store.destroy();
});

test('overwrites existing value', () => {
  const store = createKVStore();
  store.set('k', 1);
  store.set('k', 2);
  assert.strictEqual(store.get('k'), 2);
  store.destroy();
});

test('stores any value type', () => {
  const store = createKVStore();
  const obj = { a: 1 };
  store.set('obj', obj);
  assert.strictEqual(store.get('obj'), obj);
  store.set('arr', [1, 2]);
  assert.deepStrictEqual(store.get('arr'), [1, 2]);
  store.destroy();
});

console.log('\n[TTL expiry]');

test('entry expires after TTL', (done) => {
  // Synchronous test with small TTL
  const store = createKVStore();
  store.set('x', 'hello', 10); // 10ms TTL
  assert.strictEqual(store.get('x'), 'hello');
  setTimeout(() => {
    assert.strictEqual(store.get('x'), undefined);
    store.destroy();
  }, 20);
});

test('defaultTTL is applied when no per-entry TTL given', (done) => {
  const store = createKVStore({ defaultTTL: 10 });
  store.set('y', 'world');
  assert.strictEqual(store.get('y'), 'world');
  setTimeout(() => {
    assert.strictEqual(store.get('y'), undefined);
    store.destroy();
  }, 20);
});

test('per-entry TTL overrides defaultTTL', () => {
  const store = createKVStore({ defaultTTL: 1000 });
  store.set('a', 1, 0); // 0 = no expiry override
  // TTL=0 means no expiry when used as override
  const remaining = store.ttl('a');
  assert.ok(remaining === Infinity || remaining > 0);
  store.destroy();
});

test('has() returns false for expired key', (done) => {
  const store = createKVStore();
  store.set('exp', 'v', 10);
  setTimeout(() => {
    assert.strictEqual(store.has('exp'), false);
    store.destroy();
  }, 20);
});

console.log('\n[LRU eviction]');

test('evicts LRU entry when maxSize exceeded', () => {
  const store = createKVStore({ maxSize: 3 });
  store.set('a', 1);
  store.set('b', 2);
  store.set('c', 3);
  store.set('d', 4); // should evict 'a'
  assert.strictEqual(store.has('a'), false);
  assert.strictEqual(store.has('b'), true);
  store.destroy();
});

test('accessing a key makes it MRU', () => {
  const store = createKVStore({ maxSize: 3 });
  store.set('a', 1);
  store.set('b', 2);
  store.set('c', 3);
  store.get('a'); // a is now MRU
  store.set('d', 4); // should evict 'b' (now LRU)
  assert.strictEqual(store.has('a'), true);
  assert.strictEqual(store.has('b'), false);
  store.destroy();
});

test('onEvict callback fires on LRU eviction', () => {
  const evicted = [];
  const store = createKVStore({
    maxSize: 2,
    onEvict: (k, v) => evicted.push({ k, v })
  });
  store.set('x', 10);
  store.set('y', 20);
  store.set('z', 30); // evicts 'x'
  assert.strictEqual(evicted.length, 1);
  assert.strictEqual(evicted[0].k, 'x');
  assert.strictEqual(evicted[0].v, 10);
  store.destroy();
});

console.log('\n[has/delete/clear]');

test('has() returns true for existing key', () => {
  const store = createKVStore();
  store.set('p', 'q');
  assert.strictEqual(store.has('p'), true);
  assert.strictEqual(store.has('missing'), false);
  store.destroy();
});

test('delete() removes a key and returns true', () => {
  const store = createKVStore();
  store.set('del', 1);
  assert.strictEqual(store.delete('del'), true);
  assert.strictEqual(store.has('del'), false);
  store.destroy();
});

test('delete() returns false for missing key', () => {
  const store = createKVStore();
  assert.strictEqual(store.delete('ghost'), false);
  store.destroy();
});

test('clear() removes all entries', () => {
  const store = createKVStore();
  store.set('a', 1);
  store.set('b', 2);
  store.clear();
  assert.strictEqual(store.size(), 0);
  store.destroy();
});

console.log('\n[size/keys/values/entries]');

test('size() returns count of non-expired entries', () => {
  const store = createKVStore();
  store.set('a', 1);
  store.set('b', 2);
  assert.strictEqual(store.size(), 2);
  store.destroy();
});

test('keys() returns non-expired keys', () => {
  const store = createKVStore();
  store.set('a', 1);
  store.set('b', 2);
  const keys = store.keys();
  assert.ok(keys.includes('a'));
  assert.ok(keys.includes('b'));
  store.destroy();
});

test('values() returns non-expired values', () => {
  const store = createKVStore();
  store.set('x', 99);
  assert.ok(store.values().includes(99));
  store.destroy();
});

test('entries() returns [key,value] pairs', () => {
  const store = createKVStore();
  store.set('m', 'n');
  const e = store.entries();
  assert.strictEqual(e.length, 1);
  assert.deepStrictEqual(e[0], ['m', 'n']);
  store.destroy();
});

console.log('\n[TTL helper & stats]');

test('ttl() returns Infinity for no-expiry entry', () => {
  const store = createKVStore();
  store.set('k', 1);
  assert.strictEqual(store.ttl('k'), Infinity);
  store.destroy();
});

test('ttl() returns undefined for missing key', () => {
  const store = createKVStore();
  assert.strictEqual(store.ttl('nope'), undefined);
  store.destroy();
});

test('ttl() returns positive ms for future expiry', () => {
  const store = createKVStore();
  store.set('t', 1, 5000);
  const remaining = store.ttl('t');
  assert.ok(remaining > 0 && remaining <= 5000);
  store.destroy();
});

test('getStats() tracks hits, misses, evictions', () => {
  const evicted = [];
  const store = createKVStore({
    maxSize: 2,
    onEvict: (k) => evicted.push(k)
  });
  store.set('a', 1);
  store.get('a'); // hit
  store.get('z'); // miss
  store.set('b', 2);
  store.set('c', 3); // evicts 'a'
  const stats = store.getStats();
  assert.strictEqual(stats.hits, 1);
  assert.strictEqual(stats.misses, 1);
  assert.strictEqual(stats.evictions, 1);
  store.destroy();
});

console.log(`\n${'='.repeat(30)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
