const assert = require('assert');
const { retry } = require('../src/retry');

async function runTests() {
  // Success on first try
  const result = await retry(() => Promise.resolve('ok'));
  assert.strictEqual(result, 'ok', 'should return result on first success');

  // Success after 2 failures
  let calls = 0;
  const flakey = async () => {
    calls++;
    if (calls < 3) throw new Error('not yet');
    return 'eventually';
  };
  const r2 = await retry(flakey, { attempts: 5, delayMs: 10 });
  assert.strictEqual(r2, 'eventually', 'should succeed after retries');
  assert.strictEqual(calls, 3);

  // Failure after exhausting all attempts
  let failed = false;
  try {
    await retry(() => { throw new Error('always fails'); }, { attempts: 3, delayMs: 10 });
  } catch (e) {
    failed = true;
    assert.strictEqual(e.message, 'always fails');
  }
  assert.strictEqual(failed, true, 'should throw after all attempts exhausted');

  console.log('All retry tests passed!');
}

runTests().catch(err => { console.error(err); process.exit(1); });
