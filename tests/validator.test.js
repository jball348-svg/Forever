const assert = require('assert');
const { validate } = require('../src/validator');

// required
assert.strictEqual(validate('', { required: true }).valid, false);
assert.strictEqual(validate('hello', { required: true }).valid, true);

// type checks
assert.strictEqual(validate(42, { type: 'number' }).valid, true);
assert.strictEqual(validate('oops', { type: 'number' }).valid, false);
assert.strictEqual(validate([1,2], { type: 'array' }).valid, true);
assert.strictEqual(validate('str', { type: 'string' }).valid, true);
assert.strictEqual(validate(true, { type: 'boolean' }).valid, true);

// minLength / maxLength
assert.strictEqual(validate('hi', { minLength: 5 }).valid, false);
assert.strictEqual(validate('hello!', { maxLength: 5 }).valid, false);
assert.strictEqual(validate('hey', { minLength: 2, maxLength: 5 }).valid, true);

// min / max
assert.strictEqual(validate(3, { min: 5 }).valid, false);
assert.strictEqual(validate(10, { max: 5 }).valid, false);
assert.strictEqual(validate(5, { min: 1, max: 10 }).valid, true);

// errors array populated
const result = validate('x', { minLength: 3, maxLength: 2 });
assert.ok(result.errors.length >= 1);

console.log('All validator tests passed!');
