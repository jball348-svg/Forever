/**
 * Minimal publish/subscribe event bus.
 */
const listeners = {};

function on(event, handler) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(handler);
}

function off(event, handler) {
  if (!listeners[event]) return;
  listeners[event] = listeners[event].filter(h => h !== handler);
}

function emit(event, data) {
  if (!listeners[event]) return;
  listeners[event].forEach(h => h(data));
}

module.exports = { on, off, emit };
