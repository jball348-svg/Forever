/**
 * Serialisation and deep-object utilities.
 * Provides deepClone, deepEqual, deepMerge, flatten/unflatten, pick/omit, mapValues/mapKeys, and groupBy.
 *
 * @module serializer
 */

'use strict';

/**
 * Deep clone a value.
 * Handles objects, arrays, Date, null, undefined, and primitives.
 *
 * @param {*} value
 * @returns {*}
 */
function deepClone(value) {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return new Date(value.getTime());
  if (Array.isArray(value)) return value.map(deepClone);
  if (typeof value === 'object') {
    const clone = Object.create(Object.getPrototypeOf(value));
    for (const key of Object.keys(value)) {
      clone[key] = deepClone(value[key]);
    }
    return clone;
  }
  return value; // primitive
}

/**
 * Deep equality check.
 * Handles objects, arrays, Date, null, undefined, and primitives.
 * Does not use JSON.stringify; handles object key order differences.
 *
 * @param {*} a
 * @param {*} b
 * @returns {boolean}
 */
function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (a === undefined || b === undefined) return a === b;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (typeof a === 'object') {
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();
    if (!deepEqual(keysA, keysB)) return false;
    return keysA.every(k => deepEqual(a[k], b[k]));
  }
  return false;
}

/**
 * Deep merge multiple source objects into a new object.
 * Arrays from later sources replace (not concat) earlier ones.
 *
 * @param {...object} sources
 * @returns {object}
 */
function deepMerge(...sources) {
  const result = {};
  for (const source of sources) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) continue;
    for (const key of Object.keys(source)) {
      const srcVal = source[key];
      const resVal = result[key];
      if (
        typeof srcVal === 'object' && srcVal !== null && !Array.isArray(srcVal) &&
        typeof resVal === 'object' && resVal !== null && !Array.isArray(resVal)
      ) {
        result[key] = deepMerge(resVal, srcVal);
      } else {
        result[key] = deepClone(srcVal);
      }
    }
  }
  return result;
}

/**
 * Flatten a nested object to a single-depth object with delimited keys.
 *
 * @param {object} obj
 * @param {string} [delimiter='.']
 * @param {string} [prefix='']
 * @returns {object}
 */
function flatten(obj, delimiter = '.', prefix = '') {
  const result = {};
  function _flatten(current, parentKey) {
    if (current === null || current === undefined || typeof current !== 'object') {
      result[parentKey] = current;
      return;
    }
    if (current instanceof Date) {
      result[parentKey] = current;
      return;
    }
    const keys = Array.isArray(current)
      ? current.map((_, i) => String(i))
      : Object.keys(current);
    if (keys.length === 0) {
      if (parentKey) result[parentKey] = Array.isArray(current) ? [] : {};
      return;
    }
    for (const key of keys) {
      const fullKey = parentKey ? `${parentKey}${delimiter}${key}` : key;
      _flatten(Array.isArray(current) ? current[key] : current[key], fullKey);
    }
  }
  _flatten(obj, prefix);
  return result;
}

/**
 * Unflatten a single-depth object with delimited keys into a nested object.
 *
 * @param {object} obj
 * @param {string} [delimiter='.']
 * @returns {object}
 */
function unflatten(obj, delimiter = '.') {
  const result = {};
  for (const flatKey of Object.keys(obj)) {
    const parts = flatKey.split(delimiter);
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const next = parts[i + 1];
      if (current[part] === undefined || typeof current[part] !== 'object') {
        current[part] = /^\d+$/.test(next) ? [] : {};
      }
      current = current[part];
    }
    const lastPart = parts[parts.length - 1];
    current[lastPart] = obj[flatKey];
  }
  return result;
}

/**
 * Return a shallow object with only the specified keys.
 *
 * @param {object} obj
 * @param {string[]} keys
 * @returns {object}
 */
function pick(obj, keys) {
  const result = {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Return a shallow object without the specified keys.
 *
 * @param {object} obj
 * @param {string[]} keys
 * @returns {object}
 */
function omit(obj, keys) {
  const excluded = new Set(keys);
  const result = {};
  for (const key of Object.keys(obj)) {
    if (!excluded.has(key)) result[key] = obj[key];
  }
  return result;
}

/**
 * Return a new object with each value mapped through fn(value, key).
 *
 * @param {object} obj
 * @param {Function} fn
 * @returns {object}
 */
function mapValues(obj, fn) {
  const result = {};
  for (const key of Object.keys(obj)) {
    result[key] = fn(obj[key], key);
  }
  return result;
}

/**
 * Return a new object with each key transformed by fn(key, value).
 *
 * @param {object} obj
 * @param {Function} fn
 * @returns {object}
 */
function mapKeys(obj, fn) {
  const result = {};
  for (const key of Object.keys(obj)) {
    result[fn(key, obj[key])] = obj[key];
  }
  return result;
}

/**
 * Group an array of items by the result of keyFn(item).
 *
 * @param {*[]} array
 * @param {Function} keyFn
 * @returns {object}
 */
function groupBy(array, keyFn) {
  const result = {};
  for (const item of array) {
    const key = String(keyFn(item));
    if (!result[key]) result[key] = [];
    result[key].push(item);
  }
  return result;
}

module.exports = {
  deepClone,
  deepEqual,
  deepMerge,
  flatten,
  unflatten,
  pick,
  omit,
  mapValues,
  mapKeys,
  groupBy,
};
