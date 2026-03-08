/**
 * Minimal Finite State Machine.
 * @param {{ initial: string, states: Object }} config
 */
function createFSM(config) {
  let current = config.initial;

  return {
    get state() { return current; },

    can(event) {
      const stateConfig = config.states[current];
      return !!(stateConfig && stateConfig.on && stateConfig.on[event]);
    },

    send(event) {
      if (!this.can(event)) {
        throw new Error(`Invalid transition: '${event}' from state '${current}'`);
      }
      current = config.states[current].on[event];
      return current;
    },
  };
}

module.exports = { createFSM };
