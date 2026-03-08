/**
 * Simple in-memory key-value store.
 */
const _data = new Map();

const store = {
  set(key, value) { _data.set(key, value); },
  get(key) { return _data.get(key); },
  has(key) { return _data.has(key); },
  delete(key) { return _data.delete(key); },
  clear() { _data.clear(); },
};

module.exports = store;
