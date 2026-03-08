/**
 * TTL-based in-memory cache.
 */
const _store = new Map();

function set(key, value, ttlMs) {
  const expiresAt = Date.now() + ttlMs;
  _store.set(key, { value, expiresAt });
}

function _isExpired(entry) {
  return Date.now() > entry.expiresAt;
}

function get(key) {
  const entry = _store.get(key);
  if (!entry) return undefined;
  if (_isExpired(entry)) { _store.delete(key); return undefined; }
  return entry.value;
}

function has(key) {
  return get(key) !== undefined;
}

function del(key) {
  _store.delete(key);
}

module.exports = { set, get, has, delete: del };
