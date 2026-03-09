/**
 * Generic object pool with max size and waiter queue.
 */
function createPool(factory, options = {}) {
  const max = options.max || 10;
  const idle = [];
  const waiters = [];
  let totalCreated = 0;

  return {
    acquire() {
      // Return idle object if available
      if (idle.length > 0) {
        return Promise.resolve(idle.shift());
      }
      // Create new if under max
      if (totalCreated < max) {
        totalCreated++;
        return Promise.resolve(factory());
      }
      // Otherwise queue the waiter
      return new Promise(resolve => waiters.push(resolve));
    },

    release(obj) {
      if (waiters.length > 0) {
        const resolve = waiters.shift();
        resolve(obj);
      } else {
        idle.push(obj);
      }
    },

    size() {
      return idle.length;
    },
  };
}

module.exports = { createPool };
