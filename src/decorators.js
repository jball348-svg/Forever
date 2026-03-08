const { log } = require('./logger');

/**
 * Makes an object property non-writable.
 */
function readonly(obj, key) {
  Object.defineProperty(obj, key, { writable: false, configurable: false });
}

/**
 * Wraps fn so every call is logged with args and return value.
 */
function logged(fn, label = fn.name || 'anonymous') {
  return function (...args) {
    const result = fn.apply(this, args);
    log('info', `[${label}] called with ${JSON.stringify(args)} => ${JSON.stringify(result)}`);
    return result;
  };
}

/**
 * Wraps fn and logs how long it takes to run.
 */
function timed(fn, label = fn.name || 'anonymous') {
  return function (...args) {
    const start = Date.now();
    const result = fn.apply(this, args);
    const elapsed = Date.now() - start;
    log('info', `[${label}] took ${elapsed}ms`);
    return result;
  };
}

module.exports = { readonly, logged, timed };
