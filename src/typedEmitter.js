/**
 * Typed event emitter with wildcard support, once/off helpers, and async variant.
 * Provides a lightweight, feature-rich alternative to Node's built-in EventEmitter.
 *
 * @module typedEmitter
 */

'use strict';

const WILDCARD = '*';

/**
 * Build a synchronous typed emitter.
 *
 * @returns {object} Emitter instance
 */
function createTypedEmitter() {
  /** @type {Map<string, Set<Function>>} */
  const handlers = new Map();

  function _getOrCreate(event) {
    if (!handlers.has(event)) handlers.set(event, new Set());
    return handlers.get(event);
  }

  return {
    /**
     * Subscribe to an event.
     *
     * @param {string} event
     * @param {Function} handler
     * @returns {Function} Unsubscribe function
     */
    on(event, handler) {
      _getOrCreate(event).add(handler);
      return () => this.off(event, handler);
    },

    /**
     * Subscribe for exactly one invocation.
     *
     * @param {string} event
     * @param {Function} handler
     * @returns {Function} Unsubscribe function
     */
    once(event, handler) {
      const wrapper = (...args) => {
        this.off(event, wrapper);
        handler(...args);
      };
      wrapper._original = handler;
      return this.on(event, wrapper);
    },

    /**
     * Remove a specific handler.
     *
     * @param {string} event
     * @param {Function} handler
     */
    off(event, handler) {
      const set = handlers.get(event);
      if (!set) return;
      // Also remove if handler was wrapped by `once`
      for (const fn of set) {
        if (fn === handler || fn._original === handler) {
          set.delete(fn);
          break;
        }
      }
      if (set.size === 0) handlers.delete(event);
    },

    /**
     * Emit an event, calling all registered handlers.
     * Wildcard handlers receive (event, ...args).
     *
     * @param {string} event
     * @param {...*} args
     */
    emit(event, ...args) {
      const set = handlers.get(event);
      if (set) {
        for (const fn of [...set]) fn(...args);
      }
      if (event !== WILDCARD) {
        const wildcards = handlers.get(WILDCARD);
        if (wildcards) {
          for (const fn of [...wildcards]) fn(event, ...args);
        }
      }
    },

    /**
     * Get a copy of the handlers array for an event.
     *
     * @param {string} event
     * @returns {Function[]}
     */
    listeners(event) {
      return [...(handlers.get(event) || [])];
    },

    /**
     * Get the number of handlers for an event.
     *
     * @param {string} event
     * @returns {number}
     */
    listenerCount(event) {
      return (handlers.get(event) || new Set()).size;
    },

    /**
     * Remove all handlers for an event, or all events.
     *
     * @param {string} [event]
     */
    removeAllListeners(event) {
      if (event !== undefined) {
        handlers.delete(event);
      } else {
        handlers.clear();
      }
    },

    /**
     * Get all event names with at least one listener.
     *
     * @returns {string[]}
     */
    eventNames() {
      return [...handlers.keys()].filter(k => handlers.get(k).size > 0);
    }
  };
}

/**
 * Build an async typed emitter. Handlers are awaited in series.
 *
 * @returns {object} Async emitter instance
 */
function createAsyncTypedEmitter() {
  const base = createTypedEmitter();
  const originalEmit = base.emit.bind(base);

  // Override emit to be async
  return Object.assign({}, base, {
    /**
     * Emit an event, awaiting each handler in series.
     *
     * @param {string} event
     * @param {...*} args
     * @returns {Promise<void>}
     */
    async emit(event, ...args) {
      const set = base.listeners(event);
      for (const fn of set) await fn(...args);
      if (event !== WILDCARD) {
        const wildcards = base.listeners(WILDCARD);
        for (const fn of wildcards) await fn(event, ...args);
      }
    }
  });
}

module.exports = { createTypedEmitter, createAsyncTypedEmitter };
