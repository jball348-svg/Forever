/**
 * @file eventBus.js
 * @description Minimal publish/subscribe event bus.
 */
const listeners = {};

/**
 * Subscribe a handler to an event.
 *
 * @param {string} event - Event name
 * @param {Function} handler - Callback invoked when the event is emitted
 * @example
 * eventBus.on('user:login', (data) => console.log('Logged in:', data.userId));
 */
function on(event, handler) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(handler);
}

/**
 * Unsubscribe a previously registered handler from an event.
 *
 * @param {string} event - Event name
 * @param {Function} handler - The handler to remove
 */
function off(event, handler) {
  if (!listeners[event]) return;
  listeners[event] = listeners[event].filter(h => h !== handler);
}

/**
 * Publish data to all subscribers of a given event.
 *
 * @param {string} event - Event name
 * @param {*} data - Payload passed to each subscribed handler
 * @example
 * eventBus.emit('user:login', { userId: 123 });
 */
function emit(event, data) {
  if (!listeners[event]) return;
  listeners[event].forEach(h => h(data));
}

module.exports = { on, off, emit };
