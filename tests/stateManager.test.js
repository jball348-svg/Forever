const assert = require('assert');
const { setState, getState, subscribe } = require('../src/stateManager');

const received = [];
subscribe(change => received.push(change));

setState('color', 'blue');
setState('count', 99);

assert.strictEqual(getState('color'), 'blue', 'getState should return stored value');
assert.strictEqual(getState('count'), 99, 'getState should return stored value');
assert.strictEqual(received.length, 2, 'subscriber should receive 2 change events');
assert.deepStrictEqual(received[0], { key: 'color', value: 'blue' });
assert.deepStrictEqual(received[1], { key: 'count', value: 99 });

console.log('All stateManager tests passed!');
