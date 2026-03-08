const assert = require('assert');
const { createObservable } = require('../src/observable');

// Synchronous value emission
const values = [];
const obs = createObservable(sub => {
  sub.next(1);
  sub.next(2);
  sub.next(3);
  sub.complete();
});
let completed = false;
obs.subscribe({
  next: v => values.push(v),
  complete: () => { completed = true; }
});
assert.deepStrictEqual(values, [1, 2, 3], 'should emit values in order');
assert.strictEqual(completed, true, 'complete callback should fire');

// Error handling
let caughtError = null;
const errObs = createObservable(sub => {
  sub.next('before');
  sub.error(new Error('boom'));
});
errObs.subscribe({
  error: e => { caughtError = e.message; }
});
assert.strictEqual(caughtError, 'boom', 'error callback should receive the error');

// Observer with no callbacks (no crash)
const silentObs = createObservable(sub => {
  sub.next('ignored');
  sub.complete();
});
silentObs.subscribe({});

console.log('All observable tests passed!');
