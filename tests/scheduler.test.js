const assert = require('assert');
const { schedule, cancel, list } = require('../src/scheduler');

async function runTests() {
  // list() starts empty
  assert.deepStrictEqual(list(), [], 'no tasks initially');

  // schedule a task
  let callCount = 0;
  schedule('ticker', 30, () => callCount++);
  assert.ok(list().includes('ticker'), 'ticker should appear in list');

  // wait long enough for at least 2 firings
  await new Promise(r => setTimeout(r, 100));
  assert.ok(callCount >= 2, `task should have fired >= 2 times, got ${callCount}`);

  // cancel
  const before = callCount;
  cancel('ticker');
  assert.strictEqual(list().includes('ticker'), false, 'ticker removed from list after cancel');

  // wait to confirm no more calls
  await new Promise(r => setTimeout(r, 80));
  assert.strictEqual(callCount, before, 'no more calls after cancel');

  console.log('All scheduler tests passed!');
}

runTests().catch(err => { console.error(err); process.exit(1); });
