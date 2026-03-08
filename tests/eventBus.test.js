const assert = require('assert');
const { on, off, emit } = require('../src/eventBus');

// Test: on + emit
let received = null;
const handler = (data) => { received = data; };
on('test', handler);
emit('test', 'hello');
assert.strictEqual(received, 'hello', 'handler should receive emitted data');

// Test: off
off('test', handler);
received = null;
emit('test', 'world');
assert.strictEqual(received, null, 'handler should not fire after off()');

// Test: multiple listeners
let count = 0;
const inc = () => count++;
on('count', inc);
on('count', inc);
emit('count');
assert.strictEqual(count, 2, 'both listeners should fire');

console.log('All eventBus tests passed!');
