'use strict';

const assert = require('assert');
const {
  deepClone, deepEqual, deepMerge,
  flatten, unflatten,
  pick, omit, mapValues, mapKeys, groupBy
} = require('../src/serializer');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ ${name}\n    ${err.message}`);
    failed++;
  }
}

console.log('\nSerializer / Deep Object Utils Tests');
console.log('=====================================');

console.log('\n[deepClone]');

test('clones primitives', () => {
  assert.strictEqual(deepClone(42), 42);
  assert.strictEqual(deepClone('hello'), 'hello');
  assert.strictEqual(deepClone(null), null);
  assert.strictEqual(deepClone(undefined), undefined);
});

test('clones objects (no reference sharing)', () => {
  const orig = { a: { b: 1 } };
  const clone = deepClone(orig);
  assert.deepStrictEqual(clone, orig);
  clone.a.b = 99;
  assert.strictEqual(orig.a.b, 1);
});

test('clones arrays', () => {
  const orig = [1, [2, 3]];
  const clone = deepClone(orig);
  clone[1][0] = 99;
  assert.strictEqual(orig[1][0], 2);
});

test('clones Date', () => {
  const d = new Date('2024-01-01');
  const clone = deepClone(d);
  assert.ok(clone instanceof Date);
  assert.strictEqual(clone.getTime(), d.getTime());
  assert.notStrictEqual(clone, d);
});

console.log('\n[deepEqual]');

test('equal primitives', () => {
  assert.ok(deepEqual(1, 1));
  assert.ok(deepEqual('a', 'a'));
  assert.ok(deepEqual(null, null));
});

test('unequal primitives', () => {
  assert.ok(!deepEqual(1, 2));
  assert.ok(!deepEqual(null, undefined));
});

test('equal objects (key order independent)', () => {
  const a = { x: 1, y: 2 };
  const b = { y: 2, x: 1 };
  assert.ok(deepEqual(a, b));
});

test('unequal objects', () => {
  assert.ok(!deepEqual({ a: 1 }, { a: 2 }));
  assert.ok(!deepEqual({ a: 1 }, { b: 1 }));
});

test('equal arrays', () => {
  assert.ok(deepEqual([1, 2, 3], [1, 2, 3]));
});

test('unequal arrays (length)', () => {
  assert.ok(!deepEqual([1, 2], [1, 2, 3]));
});

test('equal nested', () => {
  assert.ok(deepEqual({ a: { b: [1, 2] } }, { a: { b: [1, 2] } }));
});

test('equal Dates', () => {
  assert.ok(deepEqual(new Date('2024-01-01'), new Date('2024-01-01')));
  assert.ok(!deepEqual(new Date('2024-01-01'), new Date('2024-01-02')));
});

console.log('\n[deepMerge]');

test('merges two flat objects', () => {
  const r = deepMerge({ a: 1 }, { b: 2 });
  assert.deepStrictEqual(r, { a: 1, b: 2 });
});

test('later source overrides earlier', () => {
  const r = deepMerge({ a: 1 }, { a: 2 });
  assert.strictEqual(r.a, 2);
});

test('deeply merges nested objects', () => {
  const r = deepMerge({ x: { a: 1, b: 2 } }, { x: { b: 99, c: 3 } });
  assert.deepStrictEqual(r.x, { a: 1, b: 99, c: 3 });
});

test('arrays are replaced not concatenated', () => {
  const r = deepMerge({ arr: [1, 2] }, { arr: [3] });
  assert.deepStrictEqual(r.arr, [3]);
});

test('merges three sources', () => {
  const r = deepMerge({ a: 1 }, { b: 2 }, { c: 3 });
  assert.deepStrictEqual(r, { a: 1, b: 2, c: 3 });
});

console.log('\n[flatten / unflatten]');

test('flattens nested object', () => {
  const f = flatten({ a: { b: { c: 1 } } });
  assert.strictEqual(f['a.b.c'], 1);
});

test('flatten handles arrays', () => {
  const f = flatten({ arr: [10, 20] });
  assert.strictEqual(f['arr.0'], 10);
  assert.strictEqual(f['arr.1'], 20);
});

test('flatten with custom delimiter', () => {
  const f = flatten({ a: { b: 1 } }, '_');
  assert.strictEqual(f['a_b'], 1);
});

test('unflatten reverses flatten', () => {
  const orig = { a: { b: { c: 42 } } };
  const flat = flatten(orig);
  const restored = unflatten(flat);
  assert.deepStrictEqual(restored, orig);
});

test('unflatten with custom delimiter', () => {
  const restored = unflatten({ 'a_b': 1 }, '_');
  assert.strictEqual(restored.a.b, 1);
});

console.log('\n[pick / omit]');

test('pick returns only specified keys', () => {
  const r = pick({ a: 1, b: 2, c: 3 }, ['a', 'c']);
  assert.deepStrictEqual(r, { a: 1, c: 3 });
});

test('pick ignores missing keys', () => {
  const r = pick({ a: 1 }, ['a', 'x']);
  assert.deepStrictEqual(r, { a: 1 });
});

test('omit removes specified keys', () => {
  const r = omit({ a: 1, b: 2, c: 3 }, ['b']);
  assert.deepStrictEqual(r, { a: 1, c: 3 });
});

test('omit with non-existent key is safe', () => {
  const r = omit({ a: 1 }, ['z']);
  assert.deepStrictEqual(r, { a: 1 });
});

console.log('\n[mapValues / mapKeys]');

test('mapValues transforms values', () => {
  const r = mapValues({ a: 1, b: 2 }, v => v * 10);
  assert.deepStrictEqual(r, { a: 10, b: 20 });
});

test('mapValues receives key as second arg', () => {
  const r = mapValues({ x: 1 }, (v, k) => `${k}=${v}`);
  assert.strictEqual(r.x, 'x=1');
});

test('mapKeys transforms keys', () => {
  const r = mapKeys({ a: 1, b: 2 }, k => k.toUpperCase());
  assert.deepStrictEqual(r, { A: 1, B: 2 });
});

console.log('\n[groupBy]');

test('groups by string key', () => {
  const items = [{ type: 'a' }, { type: 'b' }, { type: 'a' }];
  const r = groupBy(items, i => i.type);
  assert.strictEqual(r.a.length, 2);
  assert.strictEqual(r.b.length, 1);
});

test('groupBy with number key', () => {
  const r = groupBy([1, 2, 3, 4], n => n % 2 === 0 ? 'even' : 'odd');
  assert.deepStrictEqual(r.even, [2, 4]);
  assert.deepStrictEqual(r.odd, [1, 3]);
});

test('groupBy with empty array', () => {
  assert.deepStrictEqual(groupBy([], x => x), {});
});

console.log(`\n${'='.repeat(30)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {process.exit(1);}
