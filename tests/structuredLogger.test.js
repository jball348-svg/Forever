'use strict';

const assert = require('assert');
const { Writable } = require('stream');
const { createLogger } = require('../src/structuredLogger');

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

/** Create a writable stream that collects output lines */
function makeOutput() {
  const lines = [];
  const stream = new Writable({
    write(chunk, _enc, cb) {
      lines.push(chunk.toString().trim());
      cb();
    }
  });
  stream.lines = lines;
  return stream;
}

console.log('\nStructured Logger Tests');
console.log('=======================');

console.log('\n[Level filtering]');

test('does not log below the current level', () => {
  const out = makeOutput();
  const log = createLogger({ level: 'warn', output: out, formatter: 'json' });
  log.debug('nope');
  log.info('nope');
  log.warn('yes');
  log.error('yes');
  assert.strictEqual(out.lines.length, 2);
});

test('silent level suppresses all output', () => {
  const out = makeOutput();
  const log = createLogger({ level: 'silent', output: out, formatter: 'json' });
  log.error('nothing');
  assert.strictEqual(out.lines.length, 0);
});

test('debug level logs everything', () => {
  const out = makeOutput();
  const log = createLogger({ level: 'debug', output: out, formatter: 'json' });
  log.debug('d');
  log.info('i');
  log.warn('w');
  log.error('e');
  assert.strictEqual(out.lines.length, 4);
});

console.log('\n[setLevel / getLevel]');

test('getLevel returns current level', () => {
  const log = createLogger({ output: makeOutput() });
  assert.strictEqual(log.getLevel(), 'info');
});

test('setLevel changes the active level', () => {
  const out = makeOutput();
  const log = createLogger({ level: 'error', output: out, formatter: 'json' });
  log.info('before'); // suppressed
  log.setLevel('debug');
  log.info('after'); // now logged
  assert.strictEqual(out.lines.length, 1);
  assert.strictEqual(log.getLevel(), 'debug');
});

test('setLevel throws on unknown level', () => {
  const log = createLogger({ output: makeOutput() });
  assert.throws(() => log.setLevel('verbose'), /Invalid log level/);
});

console.log('\n[isLevelEnabled]');

test('isLevelEnabled returns true for enabled levels', () => {
  const log = createLogger({ level: 'warn', output: makeOutput() });
  assert.strictEqual(log.isLevelEnabled('warn'), true);
  assert.strictEqual(log.isLevelEnabled('error'), true);
});

test('isLevelEnabled returns false for disabled levels', () => {
  const log = createLogger({ level: 'warn', output: makeOutput() });
  assert.strictEqual(log.isLevelEnabled('debug'), false);
  assert.strictEqual(log.isLevelEnabled('info'), false);
});

console.log('\n[JSON formatter]');

test('json output is valid JSON with required fields', () => {
  const out = makeOutput();
  const log = createLogger({ level: 'debug', formatter: 'json', output: out, name: 'test' });
  log.info('hello', { requestId: '123' });
  const entry = JSON.parse(out.lines[0]);
  assert.ok(entry.timestamp);
  assert.strictEqual(entry.level, 'info');
  assert.strictEqual(entry.name, 'test');
  assert.strictEqual(entry.msg, 'hello');
  assert.strictEqual(entry.requestId, '123');
});

test('context fields appear in every json entry', () => {
  const out = makeOutput();
  const log = createLogger({ formatter: 'json', output: out, context: { service: 'api' } });
  log.info('ping');
  const entry = JSON.parse(out.lines[0]);
  assert.strictEqual(entry.service, 'api');
});

test('Error objects are serialised in json output', () => {
  const out = makeOutput();
  const log = createLogger({ formatter: 'json', output: out });
  const err = new Error('boom');
  log.error('oops', { err });
  const entry = JSON.parse(out.lines[0]);
  assert.strictEqual(entry.err.message, 'boom');
  assert.strictEqual(entry.err.name, 'Error');
});

console.log('\n[Pretty formatter]');

test('pretty output contains the message', () => {
  const out = makeOutput();
  const log = createLogger({ formatter: 'pretty', output: out });
  log.info('hello world');
  assert.ok(out.lines[0].includes('hello world'));
});

test('pretty output contains the level', () => {
  const out = makeOutput();
  const log = createLogger({ formatter: 'pretty', output: out });
  log.warn('watch out');
  assert.ok(out.lines[0].includes('WARN'));
});

console.log('\n[Child logger]');

test('child logger inherits parent context', () => {
  const out = makeOutput();
  const parent = createLogger({ formatter: 'json', output: out, context: { app: 'forever' } });
  const child = parent.child({ module: 'auth' });
  child.info('login');
  const entry = JSON.parse(out.lines[0]);
  assert.strictEqual(entry.app, 'forever');
  assert.strictEqual(entry.module, 'auth');
});

test('child logger context overrides parent context on same key', () => {
  const out = makeOutput();
  const parent = createLogger({ formatter: 'json', output: out, context: { env: 'prod' } });
  const child = parent.child({ env: 'test' });
  child.info('hi');
  const entry = JSON.parse(out.lines[0]);
  assert.strictEqual(entry.env, 'test');
});

test('child logger inherits parent level', () => {
  const out = makeOutput();
  const parent = createLogger({ level: 'error', formatter: 'json', output: out });
  const child = parent.child({ x: 1 });
  child.info('suppressed');
  assert.strictEqual(out.lines.length, 0);
});

console.log(`\n${'='.repeat(30)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
