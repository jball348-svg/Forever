const assert = require('assert');
const { createContainer } = require('../src/di');

// Basic register + resolve
const c = createContainer();
c.register('greeting', () => 'Hello, Forever!');
assert.strictEqual(c.resolve('greeting'), 'Hello, Forever!');

// Dependency chaining
c.register('name', () => 'Forever');
c.register('message', container => `Hi from ${container.resolve('name')}`);
assert.strictEqual(c.resolve('message'), 'Hi from Forever');

// Singleton: factory called only once
const c2 = createContainer();
let callCount = 0;
c2.singleton('counter', () => { callCount++; return { id: callCount }; });
const inst1 = c2.resolve('counter');
const inst2 = c2.resolve('counter');
assert.strictEqual(inst1, inst2, 'singleton should return same instance');
assert.strictEqual(callCount, 1, 'singleton factory should only be called once');

// Unregistered name throws
let threw = false;
try { c.resolve('nonexistent'); } catch (e) { threw = true; }
assert.strictEqual(threw, true, 'resolving unknown name should throw');

console.log('All DI container tests passed!');
