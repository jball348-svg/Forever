'use strict';

const assert = require('assert');
const { createUndoHistory } = require('../src/undoHistory');

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

console.log('\nUndo/Redo History Tests');
console.log('=======================');

console.log('\n[push / current / getHistory]');

test('current() returns undefined when empty', () => {
  const h = createUndoHistory();
  assert.strictEqual(h.current(), undefined);
});

test('current() returns the last pushed state', () => {
  const h = createUndoHistory();
  h.push({ x: 1 });
  h.push({ x: 2 });
  assert.deepStrictEqual(h.current(), { x: 2 });
});

test('getHistory() returns all pushed states oldest-first', () => {
  const h = createUndoHistory();
  h.push(1);
  h.push(2);
  h.push(3);
  assert.deepStrictEqual(h.getHistory(), [1, 2, 3]);
});

test('getHistory() returns a copy - mutations do not affect internals', () => {
  const h = createUndoHistory();
  h.push('a');
  const hist = h.getHistory();
  hist.push('injected');
  assert.deepStrictEqual(h.getHistory(), ['a']);
});

console.log('\n[canUndo / canRedo]');

test('canUndo() is false when empty', () => {
  assert.strictEqual(createUndoHistory().canUndo(), false);
});

test('canUndo() is false with only one state', () => {
  const h = createUndoHistory();
  h.push(1);
  assert.strictEqual(h.canUndo(), false);
});

test('canUndo() is true with two or more states', () => {
  const h = createUndoHistory();
  h.push(1);
  h.push(2);
  assert.strictEqual(h.canUndo(), true);
});

test('canRedo() is false initially', () => {
  const h = createUndoHistory();
  h.push(1);
  h.push(2);
  assert.strictEqual(h.canRedo(), false);
});

test('canRedo() is true after an undo', () => {
  const h = createUndoHistory();
  h.push(1);
  h.push(2);
  h.undo();
  assert.strictEqual(h.canRedo(), true);
});

console.log('\n[undo / redo basic flow]');

test('undo returns the previous state', () => {
  const h = createUndoHistory();
  h.push('a');
  h.push('b');
  assert.strictEqual(h.undo(), 'a');
  assert.strictEqual(h.current(), 'a');
});

test('undo returns undefined when nothing to undo', () => {
  const h = createUndoHistory();
  assert.strictEqual(h.undo(), undefined);
  h.push(1);
  assert.strictEqual(h.undo(), undefined);
});

test('redo returns the next state after undo', () => {
  const h = createUndoHistory();
  h.push(10);
  h.push(20);
  h.undo();
  assert.strictEqual(h.redo(), 20);
  assert.strictEqual(h.current(), 20);
});

test('redo returns undefined when nothing to redo', () => {
  const h = createUndoHistory();
  h.push(1);
  assert.strictEqual(h.redo(), undefined);
});

test('multiple undo/redo steps work correctly', () => {
  const h = createUndoHistory();
  h.push(1);
  h.push(2);
  h.push(3);
  h.undo();
  h.undo();
  assert.strictEqual(h.current(), 1);
  h.redo();
  assert.strictEqual(h.current(), 2);
});

console.log('\n[redo stack cleared on new push]');

test('pushing after undo clears redo history', () => {
  const h = createUndoHistory();
  h.push('a');
  h.push('b');
  h.undo();
  assert.strictEqual(h.canRedo(), true);
  h.push('c');
  assert.strictEqual(h.canRedo(), false);
  assert.strictEqual(h.current(), 'c');
});

console.log('\n[limit enforcement]');

test('drops oldest entry when limit is exceeded', () => {
  const h = createUndoHistory({ limit: 3 });
  h.push(1);
  h.push(2);
  h.push(3);
  h.push(4);
  assert.deepStrictEqual(h.getHistory(), [2, 3, 4]);
});

test('canUndo still works correctly after limit trim', () => {
  const h = createUndoHistory({ limit: 2 });
  h.push('x');
  h.push('y');
  h.push('z');
  assert.strictEqual(h.canUndo(), true);
  assert.strictEqual(h.undo(), 'y');
  assert.strictEqual(h.canUndo(), false);
});

console.log('\n[clear()]');

test('clears past and future', () => {
  const h = createUndoHistory();
  h.push(1);
  h.push(2);
  h.undo();
  h.clear();
  assert.strictEqual(h.current(), undefined);
  assert.strictEqual(h.canUndo(), false);
  assert.strictEqual(h.canRedo(), false);
  assert.deepStrictEqual(h.getHistory(), []);
});

console.log('\n[callbacks]');

test('onUndo is called with the state after undo', () => {
  const calls = [];
  const h = createUndoHistory({ onUndo: (state) => calls.push(state) });
  h.push('first');
  h.push('second');
  h.undo();
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0], 'first');
});

test('onRedo is called with the state after redo', () => {
  const calls = [];
  const h = createUndoHistory({ onRedo: (state) => calls.push(state) });
  h.push('first');
  h.push('second');
  h.undo();
  h.redo();
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0], 'second');
});

test('onUndo is not called when nothing to undo', () => {
  const calls = [];
  const h = createUndoHistory({ onUndo: () => calls.push(1) });
  h.push('only');
  h.undo();
  assert.strictEqual(calls.length, 0);
});

console.log(`\n${'='.repeat(30)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) { process.exit(1); }
