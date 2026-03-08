const assert = require('assert');
const { log } = require('../src/logger');

// Spy on console.log
let captured = '';
const origLog = console.log;
const origWarn = console.warn;
const origError = console.error;

console.log = (msg) => { captured = msg; };
log('info', 'hello world');
assert.ok(captured.includes('[INFO]'), 'info level should prefix [INFO]');
assert.ok(captured.includes('hello world'), 'info message should appear in output');

console.warn = (msg) => { captured = msg; };
log('warn', 'careful now');
assert.ok(captured.includes('[WARN]'), 'warn level should prefix [WARN]');
assert.ok(captured.includes('careful now'), 'warn message should appear in output');

console.error = (msg) => { captured = msg; };
log('error', 'something broke');
assert.ok(captured.includes('[ERROR]'), 'error level should prefix [ERROR]');
assert.ok(captured.includes('something broke'), 'error message should appear in output');

// Restore
console.log = origLog;
console.warn = origWarn;
console.error = origError;

console.log('All logger tests passed!');
