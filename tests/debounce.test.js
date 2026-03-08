const assert = require('assert');
const { debounce, throttle } = require('../src/debounce');

const wait = ms => new Promise(r => setTimeout(r, ms));

async function runTests() {
  // debounce: rapid calls should result in only 1 invocation
  let debounceCount = 0;
  const debounced = debounce(() => debounceCount++, 60);
  debounced(); debounced(); debounced();
  await wait(120);
  assert.strictEqual(debounceCount, 1, 'debounce: only the last call should fire');

  // debounce: resets timer on each call
  let debounceCount2 = 0;
  const debounced2 = debounce(() => debounceCount2++, 60);
  debounced2();
  await wait(30);
  debounced2(); // resets timer
  await wait(30);
  assert.strictEqual(debounceCount2, 0, 'debounce: timer should reset on each call');
  await wait(80);
  assert.strictEqual(debounceCount2, 1, 'debounce: should fire once after final delay');

  // throttle: rapid calls should fire at most N times in interval
  let throttleCount = 0;
  const throttled = throttle(() => throttleCount++, 60);
  throttled(); throttled(); throttled();
  await wait(10);
  assert.strictEqual(throttleCount, 1, 'throttle: only first call in interval should fire');
  await wait(80);
  throttled();
  assert.strictEqual(throttleCount, 2, 'throttle: should allow another call after interval');

  console.log('All debounce/throttle tests passed!');
}

runTests().catch(err => { console.error(err); process.exit(1); });
