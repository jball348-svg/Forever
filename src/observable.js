/**
 * Minimal Observable implementation.
 */
function createObservable(subscribeFn) {
  return {
    subscribe(observer = {}) {
      const subscriber = {
        next(value) { if (typeof observer.next === 'function') observer.next(value); },
        error(err) { if (typeof observer.error === 'function') observer.error(err); },
        complete() { if (typeof observer.complete === 'function') observer.complete(); },
      };
      try {
        subscribeFn(subscriber);
      } catch (err) {
        subscriber.error(err);
      }
    }
  };
}

module.exports = { createObservable };
