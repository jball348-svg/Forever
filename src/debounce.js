/**
 * @file debounce.js
 * @description Debounce and throttle utilities for rate-limiting function calls.
 */

/**
 * Delay invoking `fn` until `delayMs` milliseconds have elapsed since the last call.
 * Useful for handling rapid user input events like typing or resizing.
 *
 * @param {Function} fn - The function to debounce
 * @param {number} delayMs - Delay in milliseconds
 * @returns {Function} A debounced wrapper around `fn`
 * @example
 * const onResize = debounce(() => recalcLayout(), 150);
 * window.addEventListener('resize', onResize);
 */
function debounce(fn, delayMs) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delayMs);
  };
}

/**
 * Invoke `fn` at most once per `intervalMs` milliseconds.
 * Calls that occur within the interval are silently dropped.
 *
 * @param {Function} fn - The function to throttle
 * @param {number} intervalMs - Minimum interval between invocations in milliseconds
 * @returns {Function} A throttled wrapper around `fn`
 * @example
 * const onScroll = throttle(() => updateScrollProgress(), 100);
 * window.addEventListener('scroll', onScroll);
 */
function throttle(fn, intervalMs) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= intervalMs) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

module.exports = { debounce, throttle };
