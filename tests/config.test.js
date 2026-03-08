'use strict';
/**
 * @file config.test.js
 * @description Tests for the robust configuration management system in src/config.js.
 */

const assert = require('assert');

// We must reset between test groups to avoid pollution
// Clone the module fresh each time would require cache-busting; instead
// we call config.reset() between sections.
const config = require('../src/config.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  \u2714 ${name}`);
    passed++;
  } catch (err) {
    console.error(`  \u2716 ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

console.log('\n\ud83e\uddea config.test.js\n');

// ---------------------------------------------------------------------------
// config.get()
// ---------------------------------------------------------------------------
console.log('config.get()');

test('returns default name', () => {
  config.reset();
  const name = config.get('name');
  assert.ok(typeof name === 'string' && name.length > 0, 'name should be a non-empty string');
});

test('returns default log.level', () => {
  config.reset();
  assert.strictEqual(config.get('log.level'), 'info');
});

test('returns default cache.defaultTtlMs', () => {
  config.reset();
  assert.strictEqual(config.get('cache.defaultTtlMs'), 60_000);
});

test('returns defaultValue for missing key', () => {
  config.reset();
  const val = config.get('nonexistent.key', 42);
  assert.strictEqual(val, 42);
});

test('returns undefined for missing key without default', () => {
  config.reset();
  assert.strictEqual(config.get('totally.missing'), undefined);
});

test('supports top-level key access', () => {
  config.reset();
  assert.ok(config.get('version'), 'version should exist');
});

// ---------------------------------------------------------------------------
// config.set()
// ---------------------------------------------------------------------------
console.log('\nconfig.set()');

test('overrides a top-level key', () => {
  config.reset();
  config.set('env', 'production');
  assert.strictEqual(config.get('env'), 'production');
});

test('overrides a nested key via dot notation', () => {
  config.reset();
  config.set('log.level', 'debug');
  assert.strictEqual(config.get('log.level'), 'debug');
});

test('does not affect sibling keys', () => {
  config.reset();
  config.set('log.level', 'warn');
  assert.strictEqual(config.get('log.format'), 'text');
});

test('set then reset restores default', () => {
  config.reset();
  config.set('log.level', 'trace');
  assert.strictEqual(config.get('log.level'), 'trace');
  config.reset();
  assert.strictEqual(config.get('log.level'), 'info');
});

test('set creates deep nested key', () => {
  config.reset();
  config.set('custom.deep.value', 99);
  assert.strictEqual(config.get('custom.deep.value'), 99);
});

// ---------------------------------------------------------------------------
// config.validate()
// ---------------------------------------------------------------------------
console.log('\nconfig.validate()');

test('returns empty array when valid', () => {
  config.reset();
  const errors = config.validate({
    'log.level':  { type: 'string', required: true },
    'cache.maxSize': { type: 'number', required: true },
  });
  assert.deepStrictEqual(errors, []);
});

test('reports missing required key', () => {
  config.reset();
  const errors = config.validate({ 'does.not.exist': { required: true } });
  assert.ok(errors.length > 0);
  assert.ok(errors[0].includes('required'));
});

test('reports wrong type', () => {
  config.reset();
  config.set('cache.maxSize', 'oops');
  const errors = config.validate({ 'cache.maxSize': { type: 'number' } });
  assert.ok(errors.length > 0);
  assert.ok(errors[0].includes('number'));
  config.reset();
});

test('reports value below min', () => {
  config.reset();
  config.set('cache.maxSize', 0);
  const errors = config.validate({ 'cache.maxSize': { type: 'number', min: 1 } });
  assert.ok(errors.length > 0);
  config.reset();
});

test('reports value above max', () => {
  config.reset();
  config.set('retry.attempts', 999);
  const errors = config.validate({ 'retry.attempts': { type: 'number', max: 10 } });
  assert.ok(errors.length > 0);
  config.reset();
});

test('reports enum violation', () => {
  config.reset();
  config.set('log.level', 'verbose');
  const errors = config.validate({
    'log.level': { type: 'string', enum: ['trace', 'debug', 'info', 'warn', 'error'] }
  });
  assert.ok(errors.length > 0);
  assert.ok(errors[0].includes('one of'));
  config.reset();
});

test('returns multiple errors for multiple violations', () => {
  config.reset();
  const errors = config.validate({
    'missing.a': { required: true },
    'missing.b': { required: true },
  });
  assert.ok(errors.length >= 2);
});

// ---------------------------------------------------------------------------
// config.watch()
// ---------------------------------------------------------------------------
console.log('\nconfig.watch()');

test('watcher is called on set', () => {
  config.reset();
  let called = false;
  config.watch('log.level', () => { called = true; });
  config.set('log.level', 'warn');
  assert.ok(called);
  config.reset();
});

test('watcher receives newValue and oldValue', () => {
  config.reset();
  let captured = {};
  config.watch('log.level', (newVal, oldVal) => { captured = { newVal, oldVal }; });
  config.set('log.level', 'error');
  assert.strictEqual(captured.newVal, 'error');
  assert.strictEqual(captured.oldVal, 'info');
  config.reset();
});

test('unsubscribe stops watcher', () => {
  config.reset();
  let count = 0;
  const unsub = config.watch('log.format', () => { count++; });
  config.set('log.format', 'json');
  unsub();
  config.set('log.format', 'text');
  assert.strictEqual(count, 1);
  config.reset();
});

test('multiple watchers on same key all fire', () => {
  config.reset();
  let a = 0; let b = 0;
  config.watch('env', () => { a++; });
  config.watch('env', () => { b++; });
  config.set('env', 'staging');
  assert.strictEqual(a, 1);
  assert.strictEqual(b, 1);
  config.reset();
});

// ---------------------------------------------------------------------------
// config.reset()
// ---------------------------------------------------------------------------
console.log('\nconfig.reset()');

test('reset clears all runtime overrides', () => {
  config.set('log.level', 'debug');
  config.set('cache.maxSize', 5);
  config.reset();
  assert.strictEqual(config.get('log.level'), 'info');
  assert.strictEqual(config.get('cache.maxSize'), 1000);
});

test('reset does not wipe watchers', () => {
  config.reset();
  let called = false;
  config.watch('env', () => { called = true; });
  config.reset();
  config.set('env', 'test');
  assert.ok(called);
  config.reset();
});

// ---------------------------------------------------------------------------
// config.toJSON()
// ---------------------------------------------------------------------------
console.log('\nconfig.toJSON()');

test('returns an object', () => {
  config.reset();
  const snap = config.toJSON();
  assert.ok(typeof snap === 'object' && snap !== null);
});

test('masks keys containing "password"', () => {
  config.reset();
  config.set('db.password', 'supersecret');
  const snap = config.toJSON();
  assert.strictEqual(snap.db.password, '***');
  config.reset();
});

test('masks keys containing "secret"', () => {
  config.reset();
  config.set('api.secret', 'mySecret');
  const snap = config.toJSON();
  assert.strictEqual(snap.api.secret, '***');
  config.reset();
});

test('masks keys containing "token"', () => {
  config.reset();
  config.set('auth.token', 'tok_abc123');
  const snap = config.toJSON();
  assert.strictEqual(snap.auth.token, '***');
  config.reset();
});

test('does not mask normal keys', () => {
  config.reset();
  const snap = config.toJSON();
  assert.strictEqual(snap.log.level, 'info');
});

test('toJSON does not mutate internal store', () => {
  config.reset();
  const snap = config.toJSON();
  snap.log.level = 'hacked';
  assert.strictEqual(config.get('log.level'), 'info');
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n\ud83d\udcca Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
