/**
 * State manager built on store + eventBus.
 * setState triggers 'change' events for subscribers.
 */
const store = require('./store');
const { on, emit } = require('./eventBus');

function setState(key, value) {
  store.set(key, value);
  emit('change', { key, value });
}

function getState(key) {
  return store.get(key);
}

function subscribe(handler) {
  on('change', handler);
}

module.exports = { setState, getState, subscribe };
