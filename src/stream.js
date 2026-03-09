/**
 * Simple async stream abstraction.
 */
function createStream() {
  const queue = [];
  const waiters = [];
  let ended = false;
  let _onEnd = null;

  return {
    set onEnd(fn) { _onEnd = fn; },

    write(chunk) {
      if (waiters.length > 0) {
        const resolve = waiters.shift();
        resolve(chunk);
      } else {
        queue.push(chunk);
      }
    },

    read() {
      if (queue.length > 0) {
        return Promise.resolve(queue.shift());
      }
      return new Promise(resolve => waiters.push(resolve));
    },

    end() {
      ended = true;
      // Resolve any pending readers with undefined
      while (waiters.length > 0) {waiters.shift()(undefined);}
      if (typeof _onEnd === 'function') {_onEnd();}
    },

    get ended() { return ended; },
  };
}

module.exports = { createStream };
