const assert = require('assert');
const { createCommandBus } = require('../src/commandBus');

const bus = createCommandBus();

// Handler registration and dispatch
bus.register('greet', ({ name }) => `Hello, ${name}!`);
const result = bus.dispatch('greet', { name: 'Forever' });
assert.strictEqual(result, 'Hello, Forever!', 'should return handler result');

// Return value propagation
bus.register('add', ({ a, b }) => a + b);
assert.strictEqual(bus.dispatch('add', { a: 3, b: 4 }), 7);

// Unknown command throws
let threw = false;
try { bus.dispatch('unknown', {}); } catch (e) { threw = true; }
assert.strictEqual(threw, true, 'dispatching unknown command should throw');

// Handler can be overridden
bus.register('greet', () => 'Overridden!');
assert.strictEqual(bus.dispatch('greet', {}), 'Overridden!');

console.log('All commandBus tests passed!');
