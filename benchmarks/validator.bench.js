/**
 * benchmarks/validator.bench.js
 * Benchmark suite for src/validator.js
 */

const { benchmark } = require('../src/performance');
const { createValidator } = require('../src/validator');

const NAME = 'Validator';

async function run() {
  const results = [];

  const schema = {
    name:  { type: 'string',  required: true },
    age:   { type: 'number',  required: true, min: 0, max: 150 },
    email: { type: 'string',  required: false },
  };

  const validator = createValidator(schema);

  // Valid payload
  results.push(await benchmark('validator.valid payload', () => {
    for (let i = 0; i < 1000; i++) {
      validator.validate({ name: 'Alice', age: 30, email: 'a@b.com' });
    }
  }, { iterations: 100 }));

  // Invalid payload (triggers error paths)
  results.push(await benchmark('validator.invalid payload', () => {
    for (let i = 0; i < 1000; i++) {
      validator.validate({ name: 42, age: -5 });
    }
  }, { iterations: 100 }));

  return results;
}

module.exports = { name: NAME, run };
