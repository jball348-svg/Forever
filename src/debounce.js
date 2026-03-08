/**
 * debounce: delays fn until delayMs ms after the last call.
 * throttle: invokes fn at most once per intervalMs ms.
 */

function debounce(fn, delayMs) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delayMs);
  };
}

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
