/**
 * Command Bus — maps command names to handler functions.
 */
function createCommandBus() {
  const handlers = new Map();

  return {
    register(commandName, handler) {
      handlers.set(commandName, handler);
    },

    dispatch(commandName, payload) {
      if (!handlers.has(commandName)) {
        throw new Error(`No handler registered for command '${commandName}'`);
      }
      return handlers.get(commandName)(payload);
    },
  };
}

module.exports = { createCommandBus };
