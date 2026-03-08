const assert = require('assert');
const { createMiddleware } = require('../src/middleware');

async function runTests() {
  // Runs in order and next() passes control
  const m = createMiddleware();
  const order = [];
  m.use(async (ctx, next) => { order.push(1); await next(); order.push(3); });
  m.use(async (ctx, next) => { order.push(2); await next(); });
  await m.run({});
  assert.deepStrictEqual(order, [1, 2, 3], 'middleware should run in correct order');

  // Not calling next() stops the chain
  const m2 = createMiddleware();
  const reached = [];
  m2.use(async (ctx, next) => { reached.push('a'); /* no next() */ });
  m2.use(async (ctx, next) => { reached.push('b'); });
  await m2.run({});
  assert.deepStrictEqual(reached, ['a'], 'chain should stop if next() is not called');

  // ctx is shared and mutable across middleware
  const m3 = createMiddleware();
  m3.use(async (ctx, next) => { ctx.step = 1; await next(); });
  m3.use(async (ctx, next) => { ctx.step = 2; await next(); });
  const ctx = {};
  await m3.run(ctx);
  assert.strictEqual(ctx.step, 2, 'ctx mutations should be visible across middleware');

  console.log('All middleware tests passed!');
}

runTests().catch(err => { console.error(err); process.exit(1); });
