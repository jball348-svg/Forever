const assert = require('assert');
const { greet } = require('../src/greet');

const result = greet();

assert.strictEqual(typeof result, 'string', 'greet() should return a string');
assert.ok(result.length > 0, 'greet() should return a non-empty string');
assert.ok(result.includes('Forever'), 'greet() output should contain the word \'Forever\'');

console.log('All tests passed!');
