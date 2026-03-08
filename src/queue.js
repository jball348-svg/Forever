/**
 * Async task queue with concurrency control.
 * @param {number} concurrency - max simultaneous tasks
 */
function createQueue(concurrency = 1) {
  let running = 0;
  const pending = [];

  function run() {
    while (running < concurrency && pending.length > 0) {
      const { fn, resolve, reject } = pending.shift();
      running++;
      Promise.resolve()
        .then(() => fn())
        .then(result => { resolve(result); })
        .catch(err => { reject(err); })
        .finally(() => { running--; run(); });
    }
  }

  return {
    add(fn) {
      return new Promise((resolve, reject) => {
        pending.push({ fn, resolve, reject });
        run();
      });
    },
    size() {
      return pending.length;
    },
  };
}

module.exports = { createQueue };
