/**
 * Feature flags / toggles module with rollout percentage support.
 * Provides deterministic per-user flag evaluation using a stable hash.
 *
 * @module featureFlags
 */

'use strict';

/**
 * djb2 hash — maps a string to a stable 0-99 bucket.
 *
 * @param {string} str
 * @returns {number} 0-99
 */
function _hashToBucket(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & 0x7fffffff; // keep positive 32-bit int
  }
  return hash % 100;
}

/**
 * Deep clone a flag config.
 *
 * @param {object} cfg
 * @returns {object}
 */
function _cloneConfig(cfg) {
  return JSON.parse(JSON.stringify(cfg));
}

/**
 * Create a feature flag store.
 *
 * @param {object} [options]
 * @param {object} [options.flags={}] - Initial flag definitions
 * @param {Function} [options.onChange] - Called with (flagName, newValue, oldValue) on change
 * @returns {object} Flag store instance
 */
function createFlagStore(options = {}) {
  const { flags: initialFlags = {}, onChange = null } = options;

  // Deep-clone initial flags so reset() can restore them
  const _initial = JSON.parse(JSON.stringify(initialFlags));

  // Working copy of flag configs
  /** @type {Map<string, object>} */
  const store = new Map();

  // Seed working copy from initial flags
  for (const [name, cfg] of Object.entries(_initial)) {
    store.set(name, _cloneConfig(cfg));
  }

  function _fire(flagName, newValue, oldValue) {
    if (typeof onChange === 'function' && newValue !== oldValue) {
      onChange(flagName, newValue, oldValue);
    }
  }

  function _isEnabledForContext(cfg, context) {
    if (!cfg.enabled) {return false;}
    if (typeof cfg.rolloutPercentage === 'number' && cfg.rolloutPercentage < 100) {
      const userId = context && context.userId !== null
        ? String(context.userId)
        : String(Math.random()); // no userId = random every time
      const bucket = _hashToBucket(userId);
      return bucket < cfg.rolloutPercentage;
    }
    return true;
  }

  return {
    /**
     * Check if a flag is enabled for the given context.
     *
     * @param {string} flagName
     * @param {object} [context] - Optional context; supports `context.userId` for rollout
     * @returns {boolean}
     */
    isEnabled(flagName, context) {
      const cfg = store.get(flagName);
      if (!cfg) {return false;}
      return _isEnabledForContext(cfg, context);
    },

    /**
     * Enable a flag.
     *
     * @param {string} flagName
     */
    enable(flagName) {
      const cfg = store.get(flagName);
      if (!cfg) {throw new Error(`Unknown flag: '${flagName}'`);}
      const old = cfg.enabled;
      cfg.enabled = true;
      _fire(flagName, true, old);
    },

    /**
     * Disable a flag.
     *
     * @param {string} flagName
     */
    disable(flagName) {
      const cfg = store.get(flagName);
      if (!cfg) {throw new Error(`Unknown flag: '${flagName}'`);}
      const old = cfg.enabled;
      cfg.enabled = false;
      _fire(flagName, false, old);
    },

    /**
     * Set the rollout percentage for a flag.
     *
     * @param {string} flagName
     * @param {number} percentage - 0 to 100
     */
    setRollout(flagName, percentage) {
      if (percentage < 0 || percentage > 100) {
        throw new Error('rolloutPercentage must be between 0 and 100');
      }
      const cfg = store.get(flagName);
      if (!cfg) {throw new Error(`Unknown flag: '${flagName}'`);}
      cfg.rolloutPercentage = percentage;
    },

    /**
     * Define a new flag or update an existing one.
     *
     * @param {string} flagName
     * @param {object} config
     */
    define(flagName, config) {
      store.set(flagName, _cloneConfig(config));
    },

    /**
     * Get the full config for a flag.
     *
     * @param {string} flagName
     * @returns {object|undefined}
     */
    getFlag(flagName) {
      const cfg = store.get(flagName);
      return cfg ? _cloneConfig(cfg) : undefined;
    },

    /**
     * Get all flag configs.
     *
     * @returns {object}
     */
    getAllFlags() {
      const result = {};
      for (const [name, cfg] of store) {
        result[name] = _cloneConfig(cfg);
      }
      return result;
    },

    /**
     * Reset all flags to their initial values.
     */
    reset() {
      store.clear();
      for (const [name, cfg] of Object.entries(_initial)) {
        store.set(name, _cloneConfig(cfg));
      }
    }
  };
}

module.exports = { createFlagStore };
