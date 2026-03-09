/**
 * @file config.js
 * @description Robust configuration management system for the Forever library.
 * Loads configuration from multiple sources in priority order:
 * 1. Runtime overrides (set via config.set)
 * 2. Environment variables prefixed with FOREVER_
 * 3. A local .foreverrc.json file (if present)
 * 4. Built-in defaults
 *
 * Supports dot-notation access, validation, change watchers, reset, and
 * sanitized JSON snapshots that mask sensitive keys.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const pkg  = require('../package.json');

// ---------------------------------------------------------------------------
// Built-in defaults
// ---------------------------------------------------------------------------

/** @type {object} Factory defaults for the Forever config */
const DEFAULTS = Object.freeze({
  name:        pkg.name,
  version:     pkg.version,
  description: pkg.description,
  env:         process.env.NODE_ENV || 'development',
  log: {
    level:  'info',   // trace | debug | info | warn | error
    format: 'text',   // text | json
  },
  cache: {
    defaultTtlMs: 60000,
    maxSize:      1000,
  },
  retry: {
    attempts: 3,
    delayMs:  100,
  },
  scheduler: {
    maxConcurrent: 10,
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Deep-clone a plain object (no functions/special types).
 *
 * @param {object} obj
 * @returns {object}
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Deep-merge source into target (target is mutated).
 *
 * @param {object} target
 * @param {object} source
 * @returns {object}
 */
function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      if (typeof target[key] !== 'object' || target[key] === null) {target[key] = {};}
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

/**
 * Read a dot-notation key from a nested object.
 *
 * @param {object} obj
 * @param {string} dotKey - e.g. 'log.level'
 * @returns {*} The value, or undefined if the path doesn't exist
 * @example
 * dotGet({ log: { level: 'info' } }, 'log.level'); // 'info'
 */
function dotGet(obj, dotKey) {
  const parts = dotKey.split('.');
  let cur = obj;
  for (const part of parts) {
    if (cur === undefined || cur === null) {return undefined;}
    cur = cur[part];
  }
  return cur;
}

/**
 * Write a dot-notation key onto a nested object (mutates obj).
 *
 * @param {object} obj
 * @param {string} dotKey - e.g. 'log.level'
 * @param {*} value
 */
function dotSet(obj, dotKey, value) {
  const parts = dotKey.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) {
      cur[parts[i]] = {};
    }
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

/**
 * Parse FOREVER_* environment variables into a nested config object.
 * FOREVER_LOG_LEVEL=debug  ->  { log: { level: 'debug' } }
 * FOREVER_CACHE_MAXSIZE=500 -> { cache: { maxSize: 500 } }
 *
 * @returns {object}
 */
function parseEnvVars() {
  const result = {};
  const prefix = 'FOREVER_';
  for (const [key, val] of Object.entries(process.env)) {
    if (!key.startsWith(prefix)) {continue;}
    // Convert FOREVER_LOG_LEVEL -> log.level
    const parts = key.slice(prefix.length).toLowerCase().split('_');
    const dotKey = parts.join('.');
    // Try to coerce numeric values
    const coerced = val === 'true' ? true : val === 'false' ? false : isNaN(val) ? val : Number(val);
    dotSet(result, dotKey, coerced);
  }
  return result;
}

/**
 * Load configuration from .foreverrc.json if it exists in the cwd.
 *
 * @returns {object}
 */
function loadRcFile() {
  const rcPath = path.resolve(process.cwd(), '.foreverrc.json');
  if (!fs.existsSync(rcPath)) {return {};}
  try {
    return JSON.parse(fs.readFileSync(rcPath, 'utf8'));
  } catch (_) {
    return {};
  }
}

/**
 * Recursively mask sensitive keys in a config snapshot.
 * Keys whose names contain 'password', 'secret', or 'token' are replaced with '***'.
 *
 * @param {object} obj
 * @returns {object}
 */
function maskSensitive(obj) {
  const SENSITIVE = /password|secret|token/i;
  if (typeof obj !== 'object' || obj === null) {return obj;}
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE.test(k)) {
      out[k] = '***';
    } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      out[k] = maskSensitive(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Config store
// ---------------------------------------------------------------------------

/** Internal merged config (re-computed on reset) */
let _store = {};
/** Runtime overrides */
let _overrides = {};
/** Change watchers: Map<dotKey, Set<Function>> */
const _watchers = new Map();

/**
 * Rebuild the internal config store from all sources.
 * Priority (highest first): _overrides > env vars > .foreverrc.json > DEFAULTS
 */
function _rebuild() {
  _store = deepClone(DEFAULTS);
  deepMerge(_store, loadRcFile());
  deepMerge(_store, parseEnvVars());
  deepMerge(_store, _overrides);
}

// Initialise on load
_rebuild();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Retrieve a configuration value using dot-notation.
 *
 * @param {string} key - Dot-notation key, e.g. 'log.level'
 * @param {*} [defaultValue] - Fallback if the key is not found
 * @returns {*}
 * @example
 * config.get('cache.defaultTtlMs'); // 60000
 * config.get('nonexistent', 42);    // 42
 */
function get(key, defaultValue) {
  const val = dotGet(_store, key);
  return val !== undefined ? val : defaultValue;
}

/**
 * Set a configuration value at runtime.
 * Triggers any registered watchers for the key.
 *
 * @param {string} key - Dot-notation key
 * @param {*} value - New value
 * @example
 * config.set('log.level', 'debug');
 */
function set(key, value) {
  const oldValue = dotGet(_store, key);
  dotSet(_overrides, key, value);
  _rebuild();
  const newValue = dotGet(_store, key);
  _notifyWatchers(key, newValue, oldValue);
}

/**
 * Validate the current config against a schema.
 * Each schema entry may have: { type, required, min, max }.
 *
 * @param {object} schema - Schema definition where keys are dot-notation paths
 * @returns {string[]} Array of validation error messages (empty if valid)
 * @example
 * const errors = config.validate({
 *   'log.level': { type: 'string', required: true },
 *   'cache.maxSize': { type: 'number', min: 1, max: 10000 },
 * });
 */
function validate(schema) {
  const errors = [];
  for (const [key, rules] of Object.entries(schema)) {
    const value = get(key);
    if (rules.required && (value === undefined || value === null)) {
      errors.push(`'${key}' is required but missing.`);
      continue;
    }
    if (value !== undefined && rules.type && typeof value !== rules.type) {
      errors.push(`'${key}' must be of type ${rules.type}, got ${typeof value}.`);
    }
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min)
        {errors.push(`'${key}' must be >= ${rules.min}, got ${value}.`);}
      if (rules.max !== undefined && value > rules.max)
        {errors.push(`'${key}' must be <= ${rules.max}, got ${value}.`);}
    }
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`'${key}' must be one of [${rules.enum.join(', ')}], got '${value}'.`);
    }
  }
  return errors;
}

/**
 * Register a watcher for a dot-notation key.
 * The callback is invoked whenever that key's value changes via config.set.
 *
 * @param {string} key - Dot-notation key to watch
 * @param {Function} callback - Called as callback(newValue, oldValue)
 * @returns {Function} An unsubscribe function
 * @example
 * const unsub = config.watch('log.level', (newVal, oldVal) => {
 *   console.log(`log.level changed from ${oldVal} to ${newVal}`);
 * });
 * unsub(); // stop watching
 */
function watch(key, callback) {
  if (!_watchers.has(key)) {_watchers.set(key, new Set());}
  _watchers.get(key).add(callback);
  return () => _watchers.get(key).delete(callback);
}

/**
 * Notify all watchers registered for a key.
 *
 * @param {string} key
 * @param {*} newValue
 * @param {*} oldValue
 * @private
 */
function _notifyWatchers(key, newValue, oldValue) {
  if (!_watchers.has(key)) {return;}
  for (const cb of _watchers.get(key)) {
    try { cb(newValue, oldValue); } catch (_) { /* non-fatal */ }
  }
}

/**
 * Reset configuration to factory defaults, clearing all runtime overrides.
 * Watchers are preserved.
 *
 * @example
 * config.set('log.level', 'debug');
 * config.reset();
 * config.get('log.level'); // 'info' (default)
 */
function reset() {
  _overrides = {};
  _rebuild();
}

/**
 * Return a deep clone of the current config with sensitive keys masked.
 * Keys whose names contain 'password', 'secret', or 'token' are replaced with '***'.
 *
 * @returns {object} Sanitized config snapshot
 * @example
 * config.set('db.password', 'hunter2');
 * config.toJSON(); // { db: { password: '***' }, ... }
 */
function toJSON() {
  return maskSensitive(deepClone(_store));
}

module.exports = { get, set, validate, watch, reset, toJSON };
