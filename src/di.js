/**
 * Minimal Dependency Injection container.
 */
function createContainer() {
  const factories = new Map();
  const singletonCache = new Map();
  const singletonKeys = new Set();

  const container = {
    register(name, factory) {
      factories.set(name, factory);
    },

    singleton(name, factory) {
      factories.set(name, factory);
      singletonKeys.add(name);
    },

    resolve(name) {
      if (!factories.has(name)) {throw new Error(`No factory registered for '${name}'`);}
      if (singletonKeys.has(name)) {
        if (!singletonCache.has(name)) {
          singletonCache.set(name, factories.get(name)(container));
        }
        return singletonCache.get(name);
      }
      return factories.get(name)(container);
    },
  };

  return container;
}

module.exports = { createContainer };
