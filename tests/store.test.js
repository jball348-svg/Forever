const assert = require('assert');
const store = require('../src/store');

store.set('foo', 42);
assert.strictEqual(store.get('foo'), 42, 'get should return the set value');
assert.strictEqual(store.has('foo'), true, 'has should return true for existing key');
assert.strictEqual(store.get('missing'), undefined, 'get should return undefined for missing key');
assert.strictEqual(store.has('missing'), false, 'has should return false for missing key');

store.delete('foo');
assert.strictEqual(store.has('foo'), false, 'has should return false after delete');

store.set('a', 1);
store.set('b', 2);
store.clear();
assert.strictEqual(store.has('a'), false, 'clear should remove all keys');
assert.strictEqual(store.has('b'), false, 'clear should remove all keys');

console.log('All store tests passed!');
