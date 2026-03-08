/**
 * In-memory key-value store with TTL expiry and LRU eviction.
 * Provides a fast, configurable cache for any JavaScript value.
 *
 * @module kvstore
 */

'use strict';

const SWEEP_INTERVAL_MS = 30000;

/**
 * Create a key-value store with optional TTL and LRU eviction.
 *
 * @param {object} [options]
 * @param {number} [options.maxSize=Infinity] - Max entries before LRU eviction
 * @param {number} [options.defaultTTL=0] - Default TTL in ms (0 = no expiry)
 * @param {Function} [options.onEvict] - Called with (key, value) when evicted
 * @returns {object} KV store instance
 */
function createKVStore(options = {}) {
  const {
    maxSize = Infinity,
    defaultTTL = 0,
    onEvict = null
  } = options;

  // Doubly-linked list node for LRU tracking
  // Map preserves insertion order; we re-insert on access for LRU effect
  /** @type {Map<string, { value: *, expiresAt: number|null }>} */
  const store = new Map();

  let hits = 0;
  let misses = 0;
  let evictions = 0;

  let sweepTimer = null;

  function _isExpired(entry) {
    return entry.expiresAt !== null && Date.now() > entry.expiresAt;
  }

  function _evictEntry(key, entry) {
    store.delete(key);
    evictions++;
    if (typeof onEvict === 'function') onEvict(key, entry.value);
  }

  function _evictLRU() {
    // The first key in the Map is the LRU (least recently used)
    const firstKey = store.keys().next().value;
    if (firstKey !== undefined) {
      _evictEntry(firstKey, store.get(firstKey));
    }
  }

  function _sweep() {
    for (const [key, entry] of store) {
      if (_isExpired(entry)) {
        _evictEntry(key, entry);
      }
    }
  }

  // Start periodic sweep
  function _startSweep() {
    if (sweepTimer === null && maxSize !== 0) {
      sweepTimer = setInterval(_sweep, SWEEP_INTERVAL_MS);
      if (sweepTimer.unref) sweepTimer.unref(); // don't block process exit
    }
  }

  function _stopSweep() {
    if (sweepTimer !== null) {
      clearInterval(sweepTimer);
      sweepTimer = null;
    }
  }

  _startSweep();

  return {
    /**
     * Store a value.
     *
     * @param {string} key
     * @param {*} value
     * @param {number} [ttl] - TTL in ms for this entry (overrides defaultTTL)
     */
    set(key, value, ttl) {
      const effectiveTTL = ttl !== undefined ? ttl : defaultTTL;
      const expiresAt = effectiveTTL > 0 ? Date.now() + effectiveTTL : null;

      // Re-insert to make it MRU (Map preserves insertion order)
      store.delete(key);
      store.set(key, { value, expiresAt });

      // Enforce maxSize
      while (store.size > maxSize) {
        _evictLRU();
      }
    },

    /**
     * Retrieve a value.
     *
     * @param {string} key
     * @returns {*} The value, or undefined if missing/expired
     */
    get(key) {
      const entry = store.get(key);
      if (!entry) { misses++; return undefined; }
      if (_isExpired(entry)) {
        _evictEntry(key, entry);
        misses++;
        return undefined;
      }
      // Re-insert as MRU
      store.delete(key);
      store.set(key, entry);
      hits++;
      return entry.value;
    },

    /**
     * Check if a non-expired entry exists.
     *
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {
      const entry = store.get(key);
      if (!entry) return false;
      if (_isExpired(entry)) {
        _evictEntry(key, entry);
        return false;
      }
      return true;
    },

    /**
     * Delete an entry.
     *
     * @param {string} key
     * @returns {boolean} True if the entry existed
     */
    delete(key) {
      return store.delete(key);
    },

    /**
     * Remove all entries.
     */
    clear() {
      store.clear();
    },

    /**
     * Count of non-expired entries.
     *
     * @returns {number}
     */
    size() {
      _sweep();
      return store.size;
    },

    /**
     * Non-expired keys.
     *
     * @returns {string[]}
     */
    keys() {
      _sweep();
      return [...store.keys()];
    },

    /**
     * Non-expired values.
     *
     * @returns {*[]}
     */
    values() {
      _sweep();
      return [...store.values()].map(e => e.value);
    },

    /**
     * Non-expired [key, value] pairs.
     *
     * @returns {Array<[string, *]>}
     */
    entries() {
      _sweep();
      return [...store.entries()].map(([k, e]) => [k, e.value]);
    },

    /**
     * Milliseconds until expiry for a key.
     *
     * @param {string} key
     * @returns {number|undefined} Remaining ms, Infinity if no TTL, undefined if missing/expired
     */
    ttl(key) {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (_isExpired(entry)) { _evictEntry(key, entry); return undefined; }
      if (entry.expiresAt === null) return Infinity;
      return Math.max(0, entry.expiresAt - Date.now());
    },

    /**
     * Get cache statistics.
     *
     * @returns {{ hits: number, misses: number, evictions: number, size: number }}
     */
    getStats() {
      return { hits, misses, evictions, size: store.size };
    },

    /**
     * Stop the background sweep timer.
     * Call this when you're done with the store to allow clean process exit.
     */
    destroy() {
      _stopSweep();
      store.clear();
    }
  };
}

module.exports = { createKVStore };
