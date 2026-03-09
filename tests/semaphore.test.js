'use strict';

const { createSemaphore } = require('../src/semaphore');

describe('semaphore', () => {
  it('throws if concurrency < 1', () => {
    expect(() => createSemaphore(0)).toThrow();
    expect(() => createSemaphore(-1)).toThrow();
  });

  it('initial available equals concurrency', () => {
    const s = createSemaphore(3);
    expect(s.available).toBe(3);
    expect(s.waiting).toBe(0);
  });

  it('acquire reduces available count', async () => {
    const s = createSemaphore(2);
    await s.acquire();
    expect(s.available).toBe(1);
    await s.acquire();
    expect(s.available).toBe(0);
  });

  it('release increases available count', async () => {
    const s = createSemaphore(1);
    await s.acquire();
    expect(s.available).toBe(0);
    s.release();
    expect(s.available).toBe(1);
  });

  it('queues callers when all slots taken', async () => {
    const s = createSemaphore(1);
    await s.acquire(); // takes the only slot
    expect(s.available).toBe(0);

    let resolved = false;
    const waiting = s.acquire().then(() => { resolved = true; });
    expect(s.waiting).toBe(1);
    expect(resolved).toBe(false);

    s.release(); // should unblock the queued acquire
    await waiting;
    expect(resolved).toBe(true);
    expect(s.waiting).toBe(0);
    // The waiting caller now holds the slot
    expect(s.available).toBe(0);
  });

  it('run() resolves with fn return value', async () => {
    const s = createSemaphore(2);
    const result = await s.run(() => 42);
    expect(result).toBe(42);
    expect(s.available).toBe(2);
  });

  it('run() releases slot even if fn throws', async () => {
    const s = createSemaphore(1);
    await expect(s.run(() => { throw new Error('boom'); })).rejects.toThrow('boom');
    expect(s.available).toBe(1);
  });

  it('works as a mutex (concurrency = 1) - serialises tasks', async () => {
    const s = createSemaphore(1);
    const order = [];
    const delay = ms => new Promise(r => setTimeout(r, ms));

    const t1 = s.run(async () => {
      order.push('t1-start');
      await delay(10);
      order.push('t1-end');
    });
    const t2 = s.run(async () => {
      order.push('t2-start');
      await delay(5);
      order.push('t2-end');
    });

    await Promise.all([t1, t2]);
    expect(order).toEqual(['t1-start', 't1-end', 't2-start', 't2-end']);
  });

  it('allows up to concurrency simultaneous run() calls', async () => {
    const s = createSemaphore(3);
    let concurrent = 0;
    let maxConcurrent = 0;
    const delay = ms => new Promise(r => setTimeout(r, ms));

    const tasks = Array.from({ length: 5 }, (_, i) =>
      s.run(async () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await delay(10);
        concurrent--;
      })
    );
    await Promise.all(tasks);
    expect(maxConcurrent).toBe(3);
  });
});
