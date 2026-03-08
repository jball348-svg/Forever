/**
 * tests/plugins.test.js
 * Comprehensive tests for src/plugins.js
 */

const {
  PluginManager,
  withPlugins,
  loggingPlugin,
  timingPlugin,
} = require('../src/plugins');

// ─── PluginManager ─────────────────────────────────────────────────────────────

describe('PluginManager', () => {
  let pm;
  beforeEach(() => { pm = new PluginManager(); });

  test('register and getPlugin return the same object', () => {
    const plugin = { beforeCall: jest.fn() };
    pm.register('test', plugin);
    expect(pm.getPlugin('test')).toBe(plugin);
  });

  test('listPlugins returns all registered names', () => {
    pm.register('a', {}).register('b', {}).register('c', {});
    expect(pm.listPlugins()).toEqual(['a', 'b', 'c']);
  });

  test('unregister removes a plugin', () => {
    pm.register('x', {});
    expect(pm.unregister('x')).toBe(true);
    expect(pm.getPlugin('x')).toBeUndefined();
  });

  test('unregister returns false for non-existent plugin', () => {
    expect(pm.unregister('nope')).toBe(false);
  });

  test('register throws on invalid name', () => {
    expect(() => pm.register('', {})).toThrow(TypeError);
    expect(() => pm.register(42, {})).toThrow(TypeError);
  });

  test('register throws on invalid plugin', () => {
    expect(() => pm.register('bad', null)).toThrow(TypeError);
    expect(() => pm.register('bad', 'string')).toThrow(TypeError);
  });

  test('register is chainable', () => {
    const result = pm.register('a', {});
    expect(result).toBe(pm);
  });
});

// ─── withPlugins ──────────────────────────────────────────────────────────────

describe('withPlugins', () => {
  let pm;
  beforeEach(() => { pm = new PluginManager(); });

  test('returns the function result unchanged', async () => {
    const add = withPlugins((a, b) => a + b, pm, 'add');
    expect(await add(2, 3)).toBe(5);
  });

  test('works with async functions', async () => {
    const fn = withPlugins(async x => x * 2, pm);
    expect(await fn(21)).toBe(42);
  });

  test('throws on non-function first arg', () => {
    expect(() => withPlugins('not a fn', pm)).toThrow(TypeError);
  });

  test('throws on non-PluginManager second arg', () => {
    expect(() => withPlugins(() => {}, {})).toThrow(TypeError);
  });

  // — Hook ordering —
  test('beforeCall fires before afterCall', async () => {
    const order = [];
    pm.register('hook', {
      beforeCall: () => { order.push('before'); },
      afterCall:  () => { order.push('after'); },
    });
    const fn = withPlugins(() => { order.push('fn'); }, pm);
    await fn();
    expect(order).toEqual(['before', 'fn', 'after']);
  });

  test('multiple plugins fire in registration order', async () => {
    const order = [];
    pm.register('first',  { beforeCall: () => order.push('first-before'),  afterCall: () => order.push('first-after') });
    pm.register('second', { beforeCall: () => order.push('second-before'), afterCall: () => order.push('second-after') });
    const fn = withPlugins(() => {}, pm);
    await fn();
    expect(order).toEqual(['first-before', 'second-before', 'first-after', 'second-after']);
  });

  // — Context shape —
  test('beforeCall context has fnName and args', async () => {
    let ctx;
    pm.register('ctx', { beforeCall: c => { ctx = c; } });
    const fn = withPlugins((a, b) => a + b, pm, 'myFn');
    await fn(10, 20);
    expect(ctx.fnName).toBe('myFn');
    expect(ctx.args).toEqual([10, 20]);
    expect(typeof ctx.startTime).toBe('number');
  });

  test('afterCall context has result and duration', async () => {
    let ctx;
    pm.register('ctx', { afterCall: c => { ctx = c; } });
    const fn = withPlugins(() => 99, pm);
    await fn();
    expect(ctx.result).toBe(99);
    expect(typeof ctx.duration).toBe('number');
    expect(ctx.duration).toBeGreaterThanOrEqual(0);
  });

  // — Error handling —
  test('onError fires when fn throws and re-throws', async () => {
    let errCtx;
    pm.register('errHook', { onError: c => { errCtx = c; } });
    const fn = withPlugins(() => { throw new Error('boom'); }, pm, 'failFn');
    await expect(fn()).rejects.toThrow('boom');
    expect(errCtx.error.message).toBe('boom');
    expect(errCtx.fnName).toBe('failFn');
  });

  test('afterCall does NOT fire when fn throws', async () => {
    const afterCall = jest.fn();
    pm.register('p', { afterCall });
    const fn = withPlugins(() => { throw new Error('err'); }, pm);
    await fn().catch(() => {});
    expect(afterCall).not.toHaveBeenCalled();
  });

  // — Async hooks —
  test('async beforeCall hook is awaited', async () => {
    const order = [];
    pm.register('async', {
      beforeCall: async () => {
        await new Promise(r => setTimeout(r, 5));
        order.push('before-async-done');
      },
    });
    const fn = withPlugins(() => { order.push('fn'); }, pm);
    await fn();
    expect(order).toEqual(['before-async-done', 'fn']);
  });

  test('async afterCall hook is awaited', async () => {
    const order = [];
    pm.register('async', {
      afterCall: async () => {
        await new Promise(r => setTimeout(r, 5));
        order.push('after-async-done');
      },
    });
    const fn = withPlugins(() => { order.push('fn'); }, pm);
    await fn();
    expect(order).toEqual(['fn', 'after-async-done']);
  });

  // — Plugin composition —
  test('plugins with only some hooks work without errors', async () => {
    pm.register('partial', { afterCall: jest.fn() }); // no beforeCall or onError
    const fn = withPlugins(() => 'ok', pm);
    await expect(fn()).resolves.toBe('ok');
  });

  test('unregistered plugin no longer fires', async () => {
    const beforeCall = jest.fn();
    pm.register('r', { beforeCall });
    pm.unregister('r');
    const fn = withPlugins(() => {}, pm);
    await fn();
    expect(beforeCall).not.toHaveBeenCalled();
  });
});

// ─── Built-in: loggingPlugin ─────────────────────────────────────────────────────

describe('loggingPlugin', () => {
  let pm;
  beforeEach(() => {
    pm = new PluginManager();
    pm.register('logging', loggingPlugin);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  test('logs on successful call', async () => {
    const fn = withPlugins(() => 'hi', pm, 'greet');
    await fn('world');
    expect(console.log).toHaveBeenCalledTimes(2);
  });

  test('logs error on failed call', async () => {
    const fn = withPlugins(() => { throw new Error('oops'); }, pm, 'fail');
    await fn().catch(() => {});
    expect(console.error).toHaveBeenCalledTimes(1);
  });
});

// ─── Built-in: timingPlugin ──────────────────────────────────────────────────────

describe('timingPlugin', () => {
  let pm;
  beforeEach(() => {
    pm = new PluginManager();
    pm.register('timing', timingPlugin);
    timingPlugin.clearTimings();
  });

  test('records a timing entry per call', async () => {
    const fn = withPlugins(() => 42, pm, 'myCalc');
    await fn();
    const timings = timingPlugin.getTimings();
    expect(timings.length).toBe(1);
    expect(timings[0].fnName).toBe('myCalc');
    expect(typeof timings[0].duration).toBe('number');
  });

  test('records error entries', async () => {
    const fn = withPlugins(() => { throw new Error('fail'); }, pm, 'badFn');
    await fn().catch(() => {});
    const timings = timingPlugin.getTimings();
    expect(timings[0].error).toBe(true);
  });

  test('getTimings returns a copy', () => {
    const t1 = timingPlugin.getTimings();
    t1.push({ fake: true });
    expect(timingPlugin.getTimings().length).toBe(0);
  });

  test('clearTimings empties the log', async () => {
    const fn = withPlugins(() => {}, pm);
    await fn();
    timingPlugin.clearTimings();
    expect(timingPlugin.getTimings().length).toBe(0);
  });
});
