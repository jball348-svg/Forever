const assert = require('assert');
const { createPool } = require('../src/pool');

async function runTests() {
  let id = 0;
  const pool = createPool(() => ({ id: ++id }), { max: 2 });

  // acquire creates new objects
  const obj1 = await pool.acquire();
  const obj2 = await pool.acquire();
  assert.strictEqual(obj1.id, 1);
  assert.strictEqual(obj2.id, 2);
  assert.strictEqual(pool.size(), 0, 'no idle objects while all in use');

  // release returns object to pool
  pool.release(obj1);
  assert.strictEqual(pool.size(), 1, 'idle count should be 1 after release');

  // acquire reuses idle object
  const obj3 = await pool.acquire();
  assert.strictEqual(obj3.id, 1, 'should reuse released object');
  assert.strictEqual(pool.size(), 0);

  // max is respected: waiter queued when pool exhausted
  let waiterResolved = false;
  const waitPromise = pool.acquire().then(o => { waiterResolved = true; return o; });
  assert.strictEqual(waiterResolved, false);
  pool.release(obj2);
  await waitPromise;
  assert.strictEqual(waiterResolved, true, 'waiter should resolve on release');

  console.log('All pool tests passed!');
}

runTests().catch(err => { console.error(err); process.exit(1); });
