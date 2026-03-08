'use strict';

const assert = require('assert');
const { createRateLimiter, createTokenBucket, createSlidingWindow, createFixedWindow } = require('../src/ratelimiter');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('\nRate Limiter Tests');
console.log('==================');

// ---------------------------------------------------------------------------
// Token Bucket
// ---------------------------------------------------------------------------
console.log('\n[Token Bucket]');

test('allows consumption when tokens are available', () => {
  const bucket = createTokenBucket({ capacity: 5, refillRate: 1 });
  assert.strictEqual(bucket.consume(), true);
  assert.strictEqual(bucket.getTokens(), 4);
});

test('denies consumption when bucket is empty', () => {
  const bucket = createTokenBucket({ capacity: 2, refillRate: 1 });
  assert.strictEqual(bucket.consume(), true);
  assert.strictEqual(bucket.consume(), true);
  assert.strictEqual(bucket.consume(), false);
});

test('consume multiple tokens at once', () => {
  const bucket = createTokenBucket({ capacity: 10, refillRate: 1 });
  assert.strictEqual(bucket.consume(5), true);
  assert.strictEqual(bucket.getTokens(), 5);
  assert.strictEqual(bucket.consume(6), false); // not enough
});

test('reset refills to capacity', () => {
  const bucket = createTokenBucket({ capacity: 5, refillRate: 1 });
  bucket.consume(5);
  assert.strictEqual(bucket.getTokens(), 0);
  bucket.reset();
  assert.strictEqual(bucket.getTokens(), 5);
});

test('throws on negative count', () => {
  const bucket = createTokenBucket({ capacity: 5, refillRate: 1 });
  assert.throws(() => bucket.consume(-1), /non-negative/);
});

test('throws on invalid capacity', () => {
  assert.throws(() => createTokenBucket({ capacity: 0, refillRate: 1 }), /capacity/);
  assert.throws(() => createTokenBucket({ capacity: -1, refillRate: 1 }), /capacity/);
});

test('throws on invalid refillRate', () => {
  assert.throws(() => createTokenBucket({ capacity: 5, refillRate: 0 }), /refillRate/);
});

// ---------------------------------------------------------------------------
// Sliding Window
// ---------------------------------------------------------------------------
console.log('\n[Sliding Window]');

test('allows requests up to the limit', () => {
  const limiter = createSlidingWindow({ limit: 3, windowMs: 10000 });
  assert.strictEqual(limiter.hit('user1').allowed, true);
  assert.strictEqual(limiter.hit('user1').allowed, true);
  assert.strictEqual(limiter.hit('user1').allowed, true);
  assert.strictEqual(limiter.hit('user1').allowed, false);
});

test('tracks remaining count correctly', () => {
  const limiter = createSlidingWindow({ limit: 5, windowMs: 10000 });
  limiter.hit('a');
  limiter.hit('a');
  const result = limiter.hit('a');
  assert.strictEqual(result.remaining, 2);
});

test('isolates different keys', () => {
  const limiter = createSlidingWindow({ limit: 2, windowMs: 10000 });
  limiter.hit('alice');
  limiter.hit('alice');
  // alice is at limit, but bob should still be allowed
  assert.strictEqual(limiter.hit('bob').allowed, true);
  assert.strictEqual(limiter.hit('alice').allowed, false);
});

test('status does not consume a slot', () => {
  const limiter = createSlidingWindow({ limit: 2, windowMs: 10000 });
  limiter.hit('x');
  const before = limiter.status('x');
  const after = limiter.status('x');
  assert.strictEqual(before.remaining, after.remaining);
});

test('reset clears a specific key', () => {
  const limiter = createSlidingWindow({ limit: 1, windowMs: 10000 });
  limiter.hit('key1');
  assert.strictEqual(limiter.hit('key1').allowed, false);
  limiter.reset('key1');
  assert.strictEqual(limiter.hit('key1').allowed, true);
});

test('reset with no args clears all keys', () => {
  const limiter = createSlidingWindow({ limit: 1, windowMs: 10000 });
  limiter.hit('a');
  limiter.hit('b');
  limiter.reset();
  assert.strictEqual(limiter.hit('a').allowed, true);
  assert.strictEqual(limiter.hit('b').allowed, true);
});

test('zero limit blocks all requests', () => {
  const limiter = createSlidingWindow({ limit: 0, windowMs: 10000 });
  assert.strictEqual(limiter.hit('x').allowed, false);
});

test('resetAt is a Date in the future', () => {
  const limiter = createSlidingWindow({ limit: 5, windowMs: 5000 });
  const result = limiter.hit('x');
  assert.ok(result.resetAt instanceof Date);
  assert.ok(result.resetAt > new Date());
});

// ---------------------------------------------------------------------------
// Fixed Window
// ---------------------------------------------------------------------------
console.log('\n[Fixed Window]');

test('allows requests up to the limit', () => {
  const limiter = createFixedWindow({ limit: 3, windowMs: 10000 });
  assert.strictEqual(limiter.hit('u').allowed, true);
  assert.strictEqual(limiter.hit('u').allowed, true);
  assert.strictEqual(limiter.hit('u').allowed, true);
  assert.strictEqual(limiter.hit('u').allowed, false);
});

test('isolates keys in fixed window', () => {
  const limiter = createFixedWindow({ limit: 1, windowMs: 10000 });
  limiter.hit('p');
  assert.strictEqual(limiter.hit('p').allowed, false);
  assert.strictEqual(limiter.hit('q').allowed, true);
});

test('status does not consume in fixed window', () => {
  const limiter = createFixedWindow({ limit: 3, windowMs: 10000 });
  limiter.hit('z');
  const s1 = limiter.status('z');
  const s2 = limiter.status('z');
  assert.strictEqual(s1.remaining, s2.remaining);
});

test('zero limit blocks all in fixed window', () => {
  const limiter = createFixedWindow({ limit: 0, windowMs: 10000 });
  assert.strictEqual(limiter.hit('x').allowed, false);
});

// ---------------------------------------------------------------------------
// Unified Factory
// ---------------------------------------------------------------------------
console.log('\n[createRateLimiter factory]');

test('creates sliding-window by default', () => {
  const rl = createRateLimiter({ limit: 2, windowMs: 10000 });
  assert.strictEqual(typeof rl.hit, 'function');
  assert.strictEqual(typeof rl.status, 'function');
});

test('creates token-bucket via algorithm option', () => {
  const rl = createRateLimiter({ algorithm: 'token-bucket', capacity: 5, refillRate: 1 });
  assert.strictEqual(typeof rl.consume, 'function');
  assert.strictEqual(typeof rl.getTokens, 'function');
});

test('creates fixed-window via algorithm option', () => {
  const rl = createRateLimiter({ algorithm: 'fixed-window', limit: 5, windowMs: 10000 });
  assert.strictEqual(typeof rl.hit, 'function');
});

test('throws on unknown algorithm', () => {
  assert.throws(() => createRateLimiter({ algorithm: 'magic' }), /Unknown algorithm/);
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n${'='.repeat(30)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
