'use strict';

const assert = require('assert');
const { createFlagStore } = require('../src/featureFlags');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ ${name}\n    ${err.message}`);
    failed++;
  }
}

console.log('\nFeature Flags Tests');
console.log('===================');

console.log('\n[Basic enable/disable]');

test('enabled flag returns true', () => {
  const store = createFlagStore({ flags: { myFlag: { enabled: true } } });
  assert.strictEqual(store.isEnabled('myFlag'), true);
});

test('disabled flag returns false', () => {
  const store = createFlagStore({ flags: { myFlag: { enabled: false } } });
  assert.strictEqual(store.isEnabled('myFlag'), false);
});

test('unknown flag returns false', () => {
  const store = createFlagStore();
  assert.strictEqual(store.isEnabled('ghost'), false);
});

test('enable() turns a flag on', () => {
  const store = createFlagStore({ flags: { f: { enabled: false } } });
  store.enable('f');
  assert.strictEqual(store.isEnabled('f'), true);
});

test('disable() turns a flag off', () => {
  const store = createFlagStore({ flags: { f: { enabled: true } } });
  store.disable('f');
  assert.strictEqual(store.isEnabled('f'), false);
});

test('enable() throws for unknown flag', () => {
  const store = createFlagStore();
  assert.throws(() => store.enable('nope'), /Unknown flag/);
});

test('disable() throws for unknown flag', () => {
  const store = createFlagStore();
  assert.throws(() => store.disable('nope'), /Unknown flag/);
});

console.log('\n[Rollout percentage]');

test('100% rollout enables flag for all users', () => {
  const store = createFlagStore({
    flags: { beta: { enabled: true, rolloutPercentage: 100 } }
  });
  for (let i = 0; i < 20; i++) {
    assert.strictEqual(store.isEnabled('beta', { userId: `user${i}` }), true);
  }
});

test('0% rollout disables flag for all users', () => {
  const store = createFlagStore({
    flags: { beta: { enabled: true, rolloutPercentage: 0 } }
  });
  for (let i = 0; i < 20; i++) {
    assert.strictEqual(store.isEnabled('beta', { userId: `user${i}` }), false);
  }
});

test('same userId always gets the same result (stable hash)', () => {
  const store = createFlagStore({
    flags: { partial: { enabled: true, rolloutPercentage: 50 } }
  });
  const result1 = store.isEnabled('partial', { userId: 'alice' });
  const result2 = store.isEnabled('partial', { userId: 'alice' });
  assert.strictEqual(result1, result2);
});

test('different userIds may get different results', () => {
  // With 50% rollout over many users, both outcomes should appear
  const store = createFlagStore({
    flags: { partial: { enabled: true, rolloutPercentage: 50 } }
  });
  const results = new Set();
  for (let i = 0; i < 200; i++) {
    results.add(store.isEnabled('partial', { userId: `u${i}` }));
  }
  assert.ok(results.has(true) && results.has(false),
    'Expected both true and false in rollout results');
});

test('disabled flag with rollout stays disabled', () => {
  const store = createFlagStore({
    flags: { f: { enabled: false, rolloutPercentage: 100 } }
  });
  assert.strictEqual(store.isEnabled('f', { userId: 'anyone' }), false);
});

console.log('\n[setRollout]');

test('setRollout changes the percentage', () => {
  const store = createFlagStore({ flags: { f: { enabled: true, rolloutPercentage: 0 } } });
  // All users are excluded at 0%
  assert.strictEqual(store.isEnabled('f', { userId: 'alice' }), false);
  store.setRollout('f', 100);
  assert.strictEqual(store.isEnabled('f', { userId: 'alice' }), true);
});

test('setRollout throws on invalid percentage', () => {
  const store = createFlagStore({ flags: { f: { enabled: true } } });
  assert.throws(() => store.setRollout('f', -1), /0 and 100/);
  assert.throws(() => store.setRollout('f', 101), /0 and 100/);
});

console.log('\n[onChange callback]');

test('onChange fires when flag is enabled', () => {
  const changes = [];
  const store = createFlagStore({
    flags: { f: { enabled: false } },
    onChange: (name, newVal, oldVal) => changes.push({ name, newVal, oldVal })
  });
  store.enable('f');
  assert.strictEqual(changes.length, 1);
  assert.strictEqual(changes[0].name, 'f');
  assert.strictEqual(changes[0].newVal, true);
  assert.strictEqual(changes[0].oldVal, false);
});

test('onChange fires when flag is disabled', () => {
  const changes = [];
  const store = createFlagStore({
    flags: { f: { enabled: true } },
    onChange: (name, newVal) => changes.push(newVal)
  });
  store.disable('f');
  assert.strictEqual(changes[0], false);
});

test('onChange does not fire if value unchanged', () => {
  const changes = [];
  const store = createFlagStore({
    flags: { f: { enabled: true } },
    onChange: () => changes.push(1)
  });
  store.enable('f'); // already true, should not fire
  assert.strictEqual(changes.length, 0);
});

console.log('\n[define / getFlag / getAllFlags]');

test('define creates a new flag', () => {
  const store = createFlagStore();
  store.define('newFlag', { enabled: true, description: 'A new flag' });
  assert.strictEqual(store.isEnabled('newFlag'), true);
});

test('getFlag returns a clone of the config', () => {
  const store = createFlagStore({ flags: { f: { enabled: true } } });
  const cfg = store.getFlag('f');
  cfg.enabled = false; // mutate clone
  assert.strictEqual(store.isEnabled('f'), true); // original unaffected
});

test('getFlag returns undefined for unknown flag', () => {
  const store = createFlagStore();
  assert.strictEqual(store.getFlag('nope'), undefined);
});

test('getAllFlags returns all flags', () => {
  const store = createFlagStore({
    flags: { a: { enabled: true }, b: { enabled: false } }
  });
  const all = store.getAllFlags();
  assert.ok('a' in all && 'b' in all);
});

console.log('\n[reset]');

test('reset restores flags to initial state', () => {
  const store = createFlagStore({ flags: { f: { enabled: false } } });
  store.enable('f');
  assert.strictEqual(store.isEnabled('f'), true);
  store.reset();
  assert.strictEqual(store.isEnabled('f'), false);
});

test('reset removes flags added after creation', () => {
  const store = createFlagStore({ flags: { original: { enabled: true } } });
  store.define('extra', { enabled: true });
  store.reset();
  assert.strictEqual(store.isEnabled('extra'), false); // not in initial
});

console.log(`\n${'='.repeat(30)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
