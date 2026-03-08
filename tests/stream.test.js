const assert = require('assert');
const { createStream } = require('../src/stream');

async function runTests() {
  // Write then read
  const s = createStream();
  s.write('hello');
  s.write('world');
  assert.strictEqual(await s.read(), 'hello');
  assert.strictEqual(await s.read(), 'world');

  // Await a future write
  const s2 = createStream();
  const pending = s2.read();
  setTimeout(() => s2.write('delayed'), 30);
  assert.strictEqual(await pending, 'delayed');

  // end() signals completion via onEnd callback
  const s3 = createStream();
  let ended = false;
  s3.onEnd = () => { ended = true; };
  s3.write('last');
  await s3.read();
  s3.end();
  assert.strictEqual(ended, true, 'onEnd should be called after end()');
  assert.strictEqual(s3.ended, true);

  console.log('All stream tests passed!');
}

runTests().catch(err => { console.error(err); process.exit(1); });
