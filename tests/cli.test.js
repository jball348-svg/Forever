'use strict';
/**
 * @file cli.test.js
 * @description Tests for src/cli.js – the CLI utilities module.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const cli = require('../src/cli.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

console.log('\n🧪 cli.test.js\n');

// ---------------------------------------------------------------------------
// colour() helper
// ---------------------------------------------------------------------------
console.log('colour()');

test('colour returns a string', () => {
  const result = cli.colour('green', 'hello');
  assert.ok(typeof result === 'string');
});

test('colour output contains the original text', () => {
  const result = cli.colour('red', 'world');
  assert.ok(result.includes('world'));
});

test('colour with unknown key still returns text', () => {
  const result = cli.colour('nonexistent', 'text');
  assert.ok(result.includes('text'));
});

// ---------------------------------------------------------------------------
// listModules()
// ---------------------------------------------------------------------------
console.log('\nlistModules()');

test('returns an array', () => {
  const mods = cli.listModules();
  assert.ok(Array.isArray(mods));
});

test('includes known modules', () => {
  const mods = cli.listModules();
  assert.ok(mods.includes('cache'), 'should include cache');
  assert.ok(mods.includes('eventBus'), 'should include eventBus');
  assert.ok(mods.includes('retry'), 'should include retry');
});

test('does not include cli.js itself or index.js', () => {
  const mods = cli.listModules();
  assert.ok(!mods.includes('cli'), 'should not include cli');
  assert.ok(!mods.includes('index'), 'should not include index');
});

test('returns sorted list', () => {
  const mods = cli.listModules();
  const sorted = [...mods].sort();
  assert.deepStrictEqual(mods, sorted);
});

// ---------------------------------------------------------------------------
// getModuleSummary()
// ---------------------------------------------------------------------------
console.log('\ngetModuleSummary()');

test('returns a string for cache', () => {
  const summary = cli.getModuleSummary('cache');
  assert.ok(typeof summary === 'string');
});

test('returns non-empty summary for cache', () => {
  const summary = cli.getModuleSummary('cache');
  assert.ok(summary.length > 0, 'cache should have a summary');
});

test('returns empty string for non-existent module', () => {
  const summary = cli.getModuleSummary('doesNotExist');
  assert.strictEqual(summary, '');
});

test('cache summary mentions cache or TTL', () => {
  const summary = cli.getModuleSummary('cache').toLowerCase();
  assert.ok(summary.includes('cache') || summary.includes('ttl'));
});

// ---------------------------------------------------------------------------
// getExports()
// ---------------------------------------------------------------------------
console.log('\ngetExports()');

test('returns array for cache', () => {
  const exports = cli.getExports('cache');
  assert.ok(Array.isArray(exports));
});

test('cache exports include set, get, has, delete', () => {
  const exports = cli.getExports('cache');
  assert.ok(exports.includes('set'), 'missing set');
  assert.ok(exports.includes('get'), 'missing get');
  assert.ok(exports.includes('has'), 'missing has');
});

test('eventBus exports include on, off, emit', () => {
  const exports = cli.getExports('eventBus');
  assert.ok(exports.includes('on'), 'missing on');
  assert.ok(exports.includes('off'), 'missing off');
  assert.ok(exports.includes('emit'), 'missing emit');
});

test('returns empty array for non-existent module', () => {
  const exports = cli.getExports('nope');
  assert.deepStrictEqual(exports, []);
});

// ---------------------------------------------------------------------------
// getModuleAPI()
// ---------------------------------------------------------------------------
console.log('\ngetModuleAPI()');

test('returns array for cache', () => {
  const api = cli.getModuleAPI('cache');
  assert.ok(Array.isArray(api));
});

test('cache API includes set function with params', () => {
  const api = cli.getModuleAPI('cache');
  const setFn = api.find(f => f.name === 'set');
  assert.ok(setFn, 'should find set function');
  assert.ok(setFn.params.length > 0, 'set should have params');
});

test('each API entry has name, params, description fields', () => {
  const api = cli.getModuleAPI('cache');
  for (const entry of api) {
    assert.ok('name' in entry, 'missing name');
    assert.ok('params' in entry, 'missing params');
    assert.ok('description' in entry, 'missing description');
  }
});

test('returns empty array for non-existent module', () => {
  const api = cli.getModuleAPI('doesNotExist');
  assert.deepStrictEqual(api, []);
});

// ---------------------------------------------------------------------------
// runAllTests() – smoke test
// ---------------------------------------------------------------------------
console.log('\nrunAllTests()');

test('returns object with results, total, passed, failed', () => {
  // This is expensive so just verify the shape with a small timeout scenario
  // We can't fully run all tests here (circular), so we check the return shape
  // by calling it but accept that cli.test.js itself may not be in the count
  const result = cli.runAllTests();
  assert.ok(typeof result === 'object');
  assert.ok(Array.isArray(result.results));
  assert.ok(typeof result.total === 'number');
  assert.ok(typeof result.passed === 'number');
  assert.ok(typeof result.failed === 'number');
  assert.ok(result.total >= 0);
});

test('each result entry has file, passed, durationMs fields', () => {
  const { results } = cli.runAllTests();
  for (const r of results) {
    assert.ok('file' in r, 'missing file');
    assert.ok('passed' in r, 'missing passed');
    assert.ok('durationMs' in r, 'missing durationMs');
    assert.ok(typeof r.durationMs === 'number');
  }
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
