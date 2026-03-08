/**
 * Rate limiter module supporting multiple algorithms.
 * Provides token bucket, sliding window, and fixed window rate limiting strategies.
 *
 * @module ratelimiter
 */

'use strict';

/**
 * Create a token bucket rate limiter.
 *
 * @param {object} options
 * @param {number} options.capacity - Maximum number of tokens
 * @param {number} options.refillRate - Tokens added per refill interval
 * @param {number} [options.refillInterval=1000] - Milliseconds between refills
 * @returns {{ consume: Function, getTokens: Function, reset: Function }}
 */
function createTokenBucket({ capacity, refillRate, refillInterval = 1000 }) {
  if (!capacity || capacity <= 0) throw new Error('capacity must be a positive number');
  if (!refillRate || refillRate <= 0) throw new Error('refillRate must be a positive number');

  let tokens = capacity;
  let lastRefill = Date.now();

  function _refill() {
    const now = Date.now();
    const elapsed = now - lastRefill;
    const intervalsElapsed = Math.floor(elapsed / refillInterval);
    if (intervalsElapsed > 0) {
      tokens = Math.min(capacity, tokens + intervalsElapsed * refillRate);
      lastRefill = now - (elapsed % refillInterval);
    }
  }

  return {
    /**
     * Attempt to consume tokens from the bucket.
     *
     * @param {number} [count=1] - Number of tokens to consume
     * @returns {boolean} True if tokens were available and consumed
     */
    consume(count = 1) {
      if (count < 0) throw new Error('count must be non-negative');
      _refill();
      if (tokens >= count) {
        tokens -= count;
        return true;
      }
      return false;
    },

    /**
     * Get the current token count.
     *
     * @returns {number}
     */
    getTokens() {
      _refill();
      return tokens;
    },

    /**
     * Reset the bucket to full capacity.
     */
    reset() {
      tokens = capacity;
      lastRefill = Date.now();
    }
  };
}

/**
 * Create a sliding window rate limiter.
 *
 * @param {object} options
 * @param {number} options.limit - Max requests allowed in the window
 * @param {number} options.windowMs - Window duration in milliseconds
 * @returns {{ hit: Function, status: Function, reset: Function }}
 */
function createSlidingWindow({ limit, windowMs }) {
  if (limit == null || limit < 0) throw new Error('limit must be a non-negative number');
  if (!windowMs || windowMs <= 0) throw new Error('windowMs must be a positive number');

  // Map of key -> array of timestamps
  const windows = new Map();

  function _prune(key) {
    const now = Date.now();
    const cutoff = now - windowMs;
    const hits = windows.get(key) || [];
    const pruned = hits.filter(t => t > cutoff);
    windows.set(key, pruned);
    return pruned;
  }

  function _resetAt() {
    return new Date(Date.now() + windowMs);
  }

  return {
    /**
     * Record a request hit and check if it's within the limit.
     *
     * @param {string} key - Identifier for this rate limit bucket
     * @returns {{ allowed: boolean, remaining: number, resetAt: Date }}
     */
    hit(key) {
      const hits = _prune(key);
      const allowed = hits.length < limit;
      if (allowed) {
        hits.push(Date.now());
        windows.set(key, hits);
      }
      return {
        allowed,
        remaining: Math.max(0, limit - hits.length),
        resetAt: _resetAt()
      };
    },

    /**
     * Check status for a key without consuming a slot.
     *
     * @param {string} key
     * @returns {{ allowed: boolean, remaining: number, resetAt: Date }}
     */
    status(key) {
      const hits = _prune(key);
      return {
        allowed: hits.length < limit,
        remaining: Math.max(0, limit - hits.length),
        resetAt: _resetAt()
      };
    },

    /**
     * Clear all recorded hits for a key.
     *
     * @param {string} [key] - If omitted, resets all keys
     */
    reset(key) {
      if (key !== undefined) {
        windows.delete(key);
      } else {
        windows.clear();
      }
    }
  };
}

/**
 * Create a fixed window rate limiter.
 *
 * @param {object} options
 * @param {number} options.limit - Max requests allowed per window
 * @param {number} options.windowMs - Window duration in milliseconds
 * @returns {{ hit: Function, status: Function, reset: Function }}
 */
function createFixedWindow({ limit, windowMs }) {
  if (limit == null || limit < 0) throw new Error('limit must be a non-negative number');
  if (!windowMs || windowMs <= 0) throw new Error('windowMs must be a positive number');

  // Map of key -> { count, windowStart }
  const windows = new Map();

  function _getWindow(key) {
    const now = Date.now();
    const existing = windows.get(key);
    if (!existing || now - existing.windowStart >= windowMs) {
      const w = { count: 0, windowStart: now };
      windows.set(key, w);
      return w;
    }
    return existing;
  }

  return {
    /**
     * Record a request hit and check if it's within the limit.
     *
     * @param {string} key
     * @returns {{ allowed: boolean, remaining: number, resetAt: Date }}
     */
    hit(key) {
      const w = _getWindow(key);
      const allowed = w.count < limit;
      if (allowed) w.count++;
      return {
        allowed,
        remaining: Math.max(0, limit - w.count),
        resetAt: new Date(w.windowStart + windowMs)
      };
    },

    /**
     * Check status without consuming a slot.
     *
     * @param {string} key
     * @returns {{ allowed: boolean, remaining: number, resetAt: Date }}
     */
    status(key) {
      const w = _getWindow(key);
      return {
        allowed: w.count < limit,
        remaining: Math.max(0, limit - w.count),
        resetAt: new Date(w.windowStart + windowMs)
      };
    },

    /**
     * Clear state for a key.
     *
     * @param {string} [key]
     */
    reset(key) {
      if (key !== undefined) {
        windows.delete(key);
      } else {
        windows.clear();
      }
    }
  };
}

/**
 * Create a rate limiter using the specified algorithm.
 *
 * @param {object} options
 * @param {'sliding-window'|'fixed-window'|'token-bucket'} [options.algorithm='sliding-window'] - Algorithm to use
 * @param {number} [options.limit] - Request limit (sliding/fixed window)
 * @param {number} [options.windowMs] - Window duration in ms (sliding/fixed window)
 * @param {number} [options.capacity] - Token capacity (token bucket)
 * @param {number} [options.refillRate] - Refill rate (token bucket)
 * @param {number} [options.refillInterval] - Refill interval ms (token bucket)
 * @returns {object} Rate limiter instance
 */
function createRateLimiter(options = {}) {
  const { algorithm = 'sliding-window', ...rest } = options;
  switch (algorithm) {
    case 'token-bucket':
      return createTokenBucket(rest);
    case 'fixed-window':
      return createFixedWindow(rest);
    case 'sliding-window':
      return createSlidingWindow(rest);
    default:
      throw new Error(`Unknown algorithm: '${algorithm}'. Must be 'token-bucket', 'sliding-window', or 'fixed-window'.`);
  }
}

module.exports = {
  createRateLimiter,
  createTokenBucket,
  createSlidingWindow,
  createFixedWindow
};
