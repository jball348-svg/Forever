/**
 * @file cli.js
 * @description Core CLI utilities for the Forever library.
 * Provides ANSI colour helpers, module introspection, and JSDoc summary extraction.
 * Used by bin/forever.js to power the interactive CLI experience.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// ---------------------------------------------------------------------------
// ANSI colour helpers
// ---------------------------------------------------------------------------

/** @type {boolean} Whether the current terminal supports colour */
const COLOUR = process.stdout.isTTY !== false && !process.env.NO_COLOR;

const ansi = {
  reset:   COLOUR ? '\x1b[0m'  : '',
  bold:    COLOUR ? '\x1b[1m'  : '',
  dim:     COLOUR ? '\x1b[2m'  : '',
  red:     COLOUR ? '\x1b[31m' : '',
  green:   COLOUR ? '\x1b[32m' : '',
  yellow:  COLOUR ? '\x1b[33m' : '',
  blue:    COLOUR ? '\x1b[34m' : '',
  magenta: COLOUR ? '\x1b[35m' : '',
  cyan:    COLOUR ? '\x1b[36m' : '',
  white:   COLOUR ? '\x1b[37m' : '',
};

/**
 * Wrap text in an ANSI colour code.
 *
 * @param {string} colour - Key from the `ansi` map (e.g. 'cyan')
 * @param {string} text
 * @returns {string}
 * @example
 * console.log(colour('green', 'Success!'));
 */
function colour(colourName, text) {
  return `${ansi[colourName] || ''}${text}${ansi.reset}`;
}

/**
 * Print a formatted section header to stdout.
 *
 * @param {string} title
 */
function printHeader(title) {
  const line = '─'.repeat(Math.min(process.stdout.columns || 72, 72));
  process.stdout.write(`\n${colour('cyan', ansi.bold + title + ansi.reset)}\n${colour('dim', line)}\n`);
}

/**
 * Print a success message in green.
 *
 * @param {string} msg
 */
function ok(msg) {
  process.stdout.write(`${colour('green', '✔')} ${msg}\n`);
}

/**
 * Print an error message in red and optionally exit.
 *
 * @param {string} msg
 * @param {number} [code=1] - Exit code; pass 0 to not exit
 */
function fail(msg, code = 1) {
  process.stderr.write(`${colour('red', '✖')} ${msg}\n`);
  if (code !== 0) process.exit(code);
}

/**
 * Print a warning in yellow.
 *
 * @param {string} msg
 */
function warn(msg) {
  process.stdout.write(`${colour('yellow', '⚠')} ${msg}\n`);
}

// ---------------------------------------------------------------------------
// Module introspection
// ---------------------------------------------------------------------------

const SRC_DIR = path.resolve(__dirname);

/**
 * List all .js files in src/ (excluding index.js).
 *
 * @returns {string[]} Module names without the .js extension
 */
function listModules() {
  return fs.readdirSync(SRC_DIR)
    .filter(f => f.endsWith('.js') && f !== 'index.js' && f !== 'cli.js')
    .map(f => path.basename(f, '.js'))
    .sort();
}

/**
 * Extract the one-line module summary from the first JSDoc block in a file.
 * Returns an empty string if no summary is found.
 *
 * @param {string} moduleName - Name of the module (without .js)
 * @returns {string} The module summary
 */
function getModuleSummary(moduleName) {
  const filePath = path.join(SRC_DIR, `${moduleName}.js`);
  if (!fs.existsSync(filePath)) return '';
  const src = fs.readFileSync(filePath, 'utf8');
  // First /** ... */ block
  const m = src.match(/\/\*\*[\s\S]*?\*\//);
  if (!m) return '';
  // Strip * prefixes and collect non-tag lines
  const lines = m[0].split('\n')
    .map(l => l.replace(/^\s*\/?\/?\*+\/?\s?/, '').trim())
    .filter(l => l && !l.startsWith('@') && !l.startsWith('@file'));
  return lines.find(l => !l.startsWith('@file') && !l.startsWith('@description') && l.length > 0)
    || lines[0] || '';
}

/**
 * Get the exported names from a source module.
 *
 * @param {string} moduleName - Module name without .js
 * @returns {string[]} Exported names
 */
function getExports(moduleName) {
  const filePath = path.join(SRC_DIR, `${moduleName}.js`);
  if (!fs.existsSync(filePath)) return [];
  const src = fs.readFileSync(filePath, 'utf8');
  const m = src.match(/module\.exports\s*=\s*\{([^}]+)\}/);
  if (m) return m[1].split(',').map(e => e.trim().split(':')[0].trim()).filter(Boolean);
  const m2 = src.match(/module\.exports\s*=\s*(\w+)/);
  return m2 ? [m2[1]] : [];
}

/**
 * Extract per-function JSDoc signatures from a module's source.
 *
 * @param {string} moduleName
 * @returns {Array<{ name: string, params: string, returns: string, description: string }>}
 */
function getModuleAPI(moduleName) {
  const filePath = path.join(SRC_DIR, `${moduleName}.js`);
  if (!fs.existsSync(filePath)) return [];
  const src = fs.readFileSync(filePath, 'utf8');
  const results = [];

  const JSDOC_RE = /\/\*\*([\s\S]*?)\*\/\s*(?:async\s+)?function\s+(\w+)/g;
  let m;
  while ((m = JSDOC_RE.exec(src)) !== null) {
    const block = m[1];
    const name  = m[2];
    const lines = block.split('\n').map(l => l.replace(/^\s*\*\s?/, '').trim());

    const descLines = [];
    const params = [];
    let returns = '';

    for (const line of lines) {
      if (line.startsWith('@param')) {
        const pm = line.match(/@param\s+(?:\{([^}]*)\}\s+)?(\S+)(?:\s+(.*))?/);
        if (pm) params.push(`${pm[2]}: ${pm[1] || '*'}`);
      } else if (line.startsWith('@returns') || line.startsWith('@return')) {
        const rm = line.match(/@returns?\s+(?:\{([^}]*)\})?/);
        returns = rm ? rm[1] || '*' : '*';
      } else if (!line.startsWith('@') && line.length > 0) {
        descLines.push(line);
      }
    }

    results.push({
      name,
      params: params.join(', '),
      returns,
      description: descLines.join(' ').trim()
    });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Test runner helper
// ---------------------------------------------------------------------------

const TESTS_DIR = path.resolve(__dirname, '..', 'tests');

/**
 * Run all test files in tests/ and return a summary.
 *
 * @returns {{ results: Array<{file: string, passed: boolean, durationMs: number, output: string}>, total: number, passed: number, failed: number }}
 */
function runAllTests() {
  const testFiles = fs.readdirSync(TESTS_DIR)
    .filter(f => f.endsWith('.test.js'))
    .sort();

  const results = [];
  let totalPassed = 0;
  let totalFailed = 0;

  for (const file of testFiles) {
    const filePath = path.join(TESTS_DIR, file);
    const start = Date.now();
    let output = '';
    let passed = false;
    try {
      output = execFileSync(process.execPath, [filePath], {
        encoding: 'utf8',
        timeout: 15000,
        env: { ...process.env, NO_COLOR: '1' }
      });
      passed = true;
      totalPassed++;
    } catch (err) {
      output = (err.stdout || '') + (err.stderr || '');
      totalFailed++;
    }
    results.push({ file, passed, durationMs: Date.now() - start, output });
  }

  return { results, total: testFiles.length, passed: totalPassed, failed: totalFailed };
}

// ---------------------------------------------------------------------------
// Rate limiter demo
// ---------------------------------------------------------------------------

/**
 * Run a demonstration of the rate limiter (sliding window, 5 req / 10s, 7 attempts).
 * Prints a formatted table of results to stdout.
 */
function ratelimitDemo() {
  const { createSlidingWindow } = require('./ratelimiter');
  const limiter = createSlidingWindow({ limit: 5, windowMs: 10000 });
  const key = 'demo-user';
  const totalRequests = 7;

  printHeader('Rate Limiter Demo  (sliding window: 5 req / 10s)');

  const colW = [6, 10, 12, 26];
  const row = (cells) =>
    '│ ' + cells.map((c, i) => String(c).padEnd(colW[i])).join(' │ ') + ' │';
  const sep = '├' + colW.map(w => '─'.repeat(w + 2)).join('┼') + '┤';
  const top = '┌' + colW.map(w => '─'.repeat(w + 2)).join('┬') + '┐';
  const bot = '└' + colW.map(w => '─'.repeat(w + 2)).join('┴') + '┘';

  process.stdout.write(top + '\n');
  process.stdout.write(row(['Req #', 'Status', 'Remaining', 'Reset At']) + '\n');
  process.stdout.write(sep + '\n');

  for (let i = 1; i <= totalRequests; i++) {
    const result = limiter.hit(key);
    const status = result.allowed
      ? colour('green', 'ALLOWED')
      : colour('red',   'DENIED ');
    const resetStr = result.resetAt.toLocaleTimeString();
    process.stdout.write(row([i, status, result.remaining, resetStr]) + '\n');
  }

  process.stdout.write(bot + '\n\n');
}

module.exports = {
  colour, printHeader, ok, fail, warn, ansi,
  listModules, getModuleSummary, getExports, getModuleAPI,
  runAllTests, ratelimitDemo,
  SRC_DIR, TESTS_DIR
};
