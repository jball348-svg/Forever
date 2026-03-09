/**
 * plugins.js – Plugin system for the Forever library.
 *
 * Allows users to register plugins with lifecycle hooks (beforeCall, afterCall,
 * onError) that fire automatically when any Forever function is wrapped via
 * `withPlugins(fn, pluginManager)`.
 */

// ─── PluginManager ─────────────────────────────────────────────────────────────

class PluginManager {
  constructor() {
    /** @type {Map<string, object>} */
    this._plugins = new Map();
  }

  /**
   * Register a plugin under `name`.
   * @param {string} name
   * @param {{ beforeCall?: Function, afterCall?: Function, onError?: Function }} plugin
   * @returns {this}
   */
  register(name, plugin) {
    if (typeof name !== 'string' || !name) {
      throw new TypeError('Plugin name must be a non-empty string.');
    }
    if (typeof plugin !== 'object' || plugin === null) {
      throw new TypeError('Plugin must be an object.');
    }
    this._plugins.set(name, plugin);
    return this;
  }

  /**
   * Unregister the plugin with the given name.
   * @param {string} name
   * @returns {boolean} true if the plugin existed and was removed
   */
  unregister(name) {
    return this._plugins.delete(name);
  }

  /**
   * Retrieve a plugin by name, or undefined if not found.
   * @param {string} name
   * @returns {object|undefined}
   */
  getPlugin(name) {
    return this._plugins.get(name);
  }

  /**
   * List all registered plugin names.
   * @returns {string[]}
   */
  listPlugins() {
    return [...this._plugins.keys()];
  }

  /**
   * Iterate over all plugins (internal).
   * @returns {IterableIterator<[string, object]>}
   */
  [Symbol.iterator]() {
    return this._plugins.entries();
  }
}

// ─── withPlugins ───────────────────────────────────────────────────────────────

/**
 * Wrap `fn` so that every registered plugin's lifecycle hooks fire
 * automatically around each call.
 *
 * Hook execution order:
 *   1. All `beforeCall(context)` hooks  (registration order)
 *   2. `fn(...args)` executes
 *   3. All `afterCall(context)` hooks   (registration order)
 *
 * If `fn` throws / rejects:
 *   3b. All `onError(context)` hooks    (registration order)
 *   3c. The error is re-thrown
 *
 * Hooks receive a `context` object:
 *   { fnName, args, result?, error?, startTime, endTime?, duration? }
 *
 * @param {Function}      fn
 * @param {PluginManager} pluginManager
 * @param {string}        [fnName]  – label used in hook context (defaults to fn.name)
 * @returns {Function}
 */
function withPlugins(fn, pluginManager, fnName) {
  if (typeof fn !== 'function') {throw new TypeError('fn must be a function.');}
  if (!(pluginManager instanceof PluginManager)) {
    throw new TypeError('pluginManager must be a PluginManager instance.');
  }

  const name = fnName || fn.name || 'anonymous';

  return async function (...args) {
    const context = {
      fnName: name,
      args,
      startTime: Date.now(),
    };

    // — beforeCall hooks —
    for (const [, plugin] of pluginManager) {
      if (typeof plugin.beforeCall === 'function') {
        await plugin.beforeCall({ ...context });
      }
    }

    let result;
    try {
      result = await fn.apply(this, args);
    } catch (error) {
      const errContext = {
        ...context,
        error,
        endTime: Date.now(),
        duration: Date.now() - context.startTime,
      };

      // — onError hooks —
      for (const [, plugin] of pluginManager) {
        if (typeof plugin.onError === 'function') {
          await plugin.onError({ ...errContext });
        }
      }

      throw error;
    }

    const endTime = Date.now();
    const afterContext = {
      ...context,
      result,
      endTime,
      duration: endTime - context.startTime,
    };

    // — afterCall hooks —
    for (const [, plugin] of pluginManager) {
      if (typeof plugin.afterCall === 'function') {
        await plugin.afterCall({ ...afterContext });
      }
    }

    return result;
  };
}

// ─── Built-in plugins ────────────────────────────────────────────────────────────

/**
 * loggingPlugin – logs every call with timestamps to the console.
 *
 * Usage:
 *   pluginManager.register('logging', loggingPlugin);
 */
const loggingPlugin = {
  beforeCall({ fnName, args, startTime }) {
    console.log(
      `[${new Date(startTime).toISOString()}] ▶ ${fnName} called`,
      args.length ? `with ${args.length} arg(s)` : '(no args)'
    );
  },
  afterCall({ fnName, endTime, duration }) {
    console.log(
      `[${new Date(endTime).toISOString()}] ✔ ${fnName} returned in ${duration}ms`
    );
  },
  onError({ fnName, error, endTime, duration }) {
    console.error(
      `[${new Date(endTime).toISOString()}] ✘ ${fnName} threw after ${duration}ms:`,
      error.message
    );
  },
};

/**
 * timingPlugin – records execution time per call in an internal log.
 *
 * Access recorded timings via `timingPlugin.getTimings()`.
 *
 * Usage:
 *   pluginManager.register('timing', timingPlugin);
 *   const timings = timingPlugin.getTimings();
 */
const _timings = [];

const timingPlugin = {
  beforeCall() {}, // nothing to do before
  afterCall({ fnName, duration, endTime }) {
    _timings.push({ fnName, duration, timestamp: new Date(endTime).toISOString() });
  },
  onError({ fnName, duration, endTime }) {
    _timings.push({ fnName, duration, error: true, timestamp: new Date(endTime).toISOString() });
  },
  /** @returns {object[]} copy of all recorded timing entries */
  getTimings() {
    return [..._timings];
  },
  /** Clear all recorded timings. */
  clearTimings() {
    _timings.length = 0;
  },
};

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  PluginManager,
  withPlugins,
  loggingPlugin,
  timingPlugin,
};
