/**
 * Async semaphore for concurrency limiting.
 * Allows at most `concurrency` simultaneous operations.
 *
 * @module semaphore
 */

'use strict';

/**
 * Create an async semaphore.
 *
 * @param {number} concurrency - Max simultaneous operations (>= 1)
 * @returns {object}
 */
function createSemaphore(concurrency) {
  if (typeof concurrency !== 'number' || concurrency < 1) {
    throw new Error('concurrency must be a number >= 1');
  }

  let _available = concurrency;
  /** @type {Array<() => void>} */
  const _queue = [];

  return {
    /**
     * Acquire a slot. Returns a Promise that resolves when a slot is free.
     *
     * @returns {Promise<void>}
     */
    acquire() {
      if (_available > 0) {
        _available--;
        return Promise.resolve();
      }
      return new Promise(resolve => {
        _queue.push(resolve);
      });
    },

    /**
     * Release a slot, allowing the next queued caller to proceed.
     */
    release() {
      if (_queue.length > 0) {
        const next = _queue.shift();
        next();
      } else {
        _available++;
      }
    },

    /**
     * Run fn with a semaphore slot. Releases on completion or error.
     *
     * @param {Function} fn
     * @returns {Promise<any>}
     */
    async run(fn) {
      await this.acquire();
      try {
        return await fn();
      } finally {
        this.release();
      }
    },

    /**
     * Number of currently free slots.
     *
     * @returns {number}
     */
    get available() {
      return _available;
    },

    /**
     * Number of callers currently waiting for a slot.
     *
     * @returns {number}
     */
    get waiting() {
      return _queue.length;
    }
  };
}

module.exports = { createSemaphore };
