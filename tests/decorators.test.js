const assert = require('assert');
const { readonly, logged, timed } = require('../src/decorators');

// readonly
const obj = { name: 'Forever', version: '1.0' };
readonly(obj, 'name');
let threw = false;
try { 'use strict'; obj.name = 'changed'; } catch (e) { threw = true; }
// In non-strict mode silently fails; either way, value should not change
assert.strictEqual(obj.name, 'Forever', 'readonly property should not be changeable');

// logged: wraps and returns correct result
const add = (a, b) => a + b;
const loggedAdd = logged(add, 'add');
assert.strictEqual(loggedAdd(3, 4), 7, 'logged fn should return correct result');

// timed: wraps and returns correct result
const double = x => x * 2;
const timedDouble = timed(double, 'double');
assert.strictEqual(timedDouble(6), 12, 'timed fn should return correct result');

// logged + timed can be composed
const composed = timed(logged(add, 'add'), 'add-timed');
assert.strictEqual(composed(10, 20), 30);

console.log('All decorator tests passed!');
