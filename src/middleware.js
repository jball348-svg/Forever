/**
 * Simple Express-style middleware chain.
 */
function createMiddleware() {
  const stack = [];

  function use(fn) {
    stack.push(fn);
  }

  async function run(ctx) {
    let index = 0;
    async function next() {
      if (index >= stack.length) {return;}
      const fn = stack[index++];
      await fn(ctx, next);
    }
    await next();
  }

  return { use, run };
}

module.exports = { createMiddleware };
