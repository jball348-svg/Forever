/**
 * Memoization utilities for sync and async functions.
 */

function memoize(fn, keyFn) {
  const cache = new Map();
  return function (...args) {
    const key = keyFn ? keyFn(args) : JSON.stringify(args);
    if (cache.has(key)) {return cache.get(key);}
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

function memoizeAsync(fn, keyFn) {
  const cache = new Map();
  return async function (...args) {
    const key = keyFn ? keyFn(args) : JSON.stringify(args);
    if (cache.has(key)) {return cache.get(key);}
    const result = await fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

module.exports = { memoize, memoizeAsync };
