/**
 * @file cache.js
 * @description TTL-based in-memory cache.
 */
const _store = new Map();

/**
 * Store a value in the cache with a time-to-live.
 *
 * @param {string} key - Cache key
 * @param {*} value - Value to store
 * @param {number} ttlMs - Time-to-live in milliseconds
 * @example
 * cache.set('user:42', { name: 'Alice' }, 60_000);
 */
function set(key, value, ttlMs) {
  const expiresAt = Date.now() + ttlMs;
  _store.set(key, { value, expiresAt });
}

/**
 * @param {string} key
 * @returns {boolean}
 * @private
 */
function _isExpired(entry) {
  return Date.now() > entry.expiresAt;
}

/**
 * Retrieve a value from the cache. Returns `undefined` if the key is absent or expired.
 *
 * @param {string} key - Cache key
 * @returns {*} The cached value, or `undefined`
 * @example
 * const user = cache.get('user:42');
 */
function get(key) {
  const entry = _store.get(key);
  if (!entry) return undefined;
  if (_isExpired(entry)) { _store.delete(key); return undefined; }
  return entry.value;
}

/**
 * Check whether a key exists and has not expired.
 *
 * @param {string} key - Cache key
 * @returns {boolean} True if the key exists and is still valid
 */
function has(key) {
  return get(key) !== undefined;
}

/**
 * Remove an entry from the cache immediately.
 *
 * @param {string} key - Cache key to delete
 */
function del(key) {
  _store.delete(key);
}

module.exports = { set, get, has, delete: del };
