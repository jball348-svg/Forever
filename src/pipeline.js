/**
 * Creates a function pipeline.
 * pipeline(f, g, h)(x) === h(g(f(x)))
 * @param {...Function} fns
 * @returns {Function}
 */
function pipeline(...fns) {
  return function (value) {
    return fns.reduce((acc, fn) => fn(acc), value);
  };
}

module.exports = { pipeline };
