const assert = require('assert');
const { pipeline } = require('../src/pipeline');

// Number transformations
const double = x => x * 2;
const addTen = x => x + 10;
const square = x => x * x;

const transform = pipeline(double, addTen, square);
assert.strictEqual(transform(3), 256); // (3*2+10)^2 = 16^2 = 256

// String transformations
const trim = s => s.trim();
const lower = s => s.toLowerCase();
const exclaim = s => s + '!';

const formatString = pipeline(trim, lower, exclaim);
assert.strictEqual(formatString('  HELLO  '), 'hello!');

// Single function passthrough
const identity = pipeline(x => x);
assert.strictEqual(identity(42), 42);

console.log('All pipeline tests passed!');
