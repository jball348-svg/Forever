'use strict';
/**
 * @file docs.test.js
 * @description Tests for the documentation generation system.
 */

const assert = require('assert');

// We import individual functions from generate-docs so we can test without side-effects
const {
  parseJSDocBlock,
  extractSymbols,
  scanSrcFiles,
  generateHTML,
  generateMD
} = require('../scripts/generate-docs.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

console.log('\n🧪 docs.test.js\n');

// ---------------------------------------------------------------------------
// parseJSDocBlock tests
// ---------------------------------------------------------------------------
console.log('parseJSDocBlock');

test('parses description', () => {
  const block = `\n * A simple description.\n `;
  const result = parseJSDocBlock(block);
  assert.strictEqual(result.description, 'A simple description.');
});

test('parses @param with type', () => {
  const block = `\n * @param {string} name The name\n `;
  const result = parseJSDocBlock(block);
  assert.strictEqual(result.params.length, 1);
  assert.strictEqual(result.params[0].name, 'name');
  assert.strictEqual(result.params[0].type, 'string');
  assert.strictEqual(result.params[0].description, 'The name');
});

test('parses multiple @param tags', () => {
  const block = `\n * @param {number} a First\n * @param {number} b Second\n `;
  const result = parseJSDocBlock(block);
  assert.strictEqual(result.params.length, 2);
  assert.strictEqual(result.params[1].name, 'b');
});

test('parses @returns', () => {
  const block = `\n * @returns {boolean} True if OK\n `;
  const result = parseJSDocBlock(block);
  assert.ok(result.returns.includes('boolean'));
});

test('parses @example', () => {
  const block = `\n * @example\n * foo('bar');\n `;
  const result = parseJSDocBlock(block);
  assert.strictEqual(result.examples.length, 1);
  assert.ok(result.examples[0].includes("foo('bar')"));
});

test('parses @deprecated with message', () => {
  const block = `\n * @deprecated Use newFn instead\n `;
  const result = parseJSDocBlock(block);
  assert.strictEqual(result.deprecated, 'Use newFn instead');
});

test('parses @deprecated without message defaults to Deprecated', () => {
  const block = `\n * @deprecated\n `;
  const result = parseJSDocBlock(block);
  assert.strictEqual(result.deprecated, 'Deprecated');
});

test('parses @throws', () => {
  const block = `\n * @throws {TypeError} When argument is invalid\n `;
  const result = parseJSDocBlock(block);
  assert.strictEqual(result.throws.length, 1);
  assert.strictEqual(result.throws[0].type, 'TypeError');
});

test('returns null for deprecated when tag absent', () => {
  const block = `\n * Just a function\n `;
  const result = parseJSDocBlock(block);
  assert.strictEqual(result.deprecated, null);
  assert.strictEqual(result.returns, null);
});

// ---------------------------------------------------------------------------
// extractSymbols tests
// ---------------------------------------------------------------------------
console.log('\nextractSymbols');

test('extracts function symbol with JSDoc', () => {
  const src = `
/**
 * Module summary.
 */

/**
 * Adds two numbers.
 * @param {number} a First operand
 * @param {number} b Second operand
 * @returns {number} Sum
 */
function add(a, b) { return a + b; }

module.exports = { add };
`;
  const { symbols, moduleSummary } = extractSymbols(src, 'test.js');
  assert.ok(moduleSummary.includes('Module summary'));
  const addSym = symbols.find(s => s.name === 'add');
  assert.ok(addSym, 'should find add symbol');
  assert.strictEqual(addSym.params.length, 2);
  assert.ok(addSym.returns.includes('number'));
});

test('handles source with no JSDoc', () => {
  const src = `function noop() {}\nmodule.exports = { noop };`;
  const { symbols } = extractSymbols(src, 'empty.js');
  assert.strictEqual(symbols.length, 0);
});

test('extracts multiple symbols', () => {
  const src = `
/**
 * @param {string} x
 */
function foo(x) {}

/**
 * @param {number} y
 */
function bar(y) {}

module.exports = { foo, bar };
`;
  const { symbols } = extractSymbols(src, 'multi.js');
  assert.ok(symbols.length >= 2);
});

// ---------------------------------------------------------------------------
// scanSrcFiles tests
// ---------------------------------------------------------------------------
console.log('\nscanSrcFiles');

test('returns files array and coverageReport', () => {
  const { files, coverageReport } = scanSrcFiles();
  assert.ok(Array.isArray(files));
  assert.ok(typeof coverageReport.percent === 'number');
  assert.ok(coverageReport.percent >= 0 && coverageReport.percent <= 100);
});

test('coverage report has total and documented', () => {
  const { coverageReport } = scanSrcFiles();
  assert.ok(typeof coverageReport.total === 'number');
  assert.ok(typeof coverageReport.documented === 'number');
  assert.ok(coverageReport.documented <= coverageReport.total);
});

test('each file entry has required fields', () => {
  const { files } = scanSrcFiles();
  for (const f of files) {
    assert.ok(f.filename, 'should have filename');
    assert.ok(Array.isArray(f.symbols), 'should have symbols array');
    assert.ok(Array.isArray(f.missing), 'should have missing array');
  }
});

// ---------------------------------------------------------------------------
// HTML/MD generation tests
// ---------------------------------------------------------------------------
console.log('\ngenerateHTML / generateMD');

test('generateHTML returns a valid HTML string', () => {
  const { files, coverageReport } = scanSrcFiles();
  const html = generateHTML(files, coverageReport);
  assert.ok(html.startsWith('<!DOCTYPE html>'));
  assert.ok(html.includes('<title>Forever'));
  assert.ok(html.includes('Coverage:'));
});

test('generateHTML includes file sections', () => {
  const { files, coverageReport } = scanSrcFiles();
  const html = generateHTML(files, coverageReport);
  assert.ok(html.includes('cache.js'));
  assert.ok(html.includes('eventBus.js'));
});

test('generateMD returns markdown string', () => {
  const { files, coverageReport } = scanSrcFiles();
  const md = generateMD(files, coverageReport);
  assert.ok(md.startsWith('# Forever'));
  assert.ok(md.includes('Coverage:'));
  assert.ok(md.includes('cache.js'));
});

test('generateMD includes function headings', () => {
  const { files, coverageReport } = scanSrcFiles();
  const md = generateMD(files, coverageReport);
  // Should have at least one ### heading
  assert.ok(md.includes('###'));
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) {process.exit(1);}
