const assert = require('assert');
const { addRoute, navigate, notFound } = require('../src/router');

let result;

// Exact match
addRoute('/home', () => { result = 'home'; });
navigate('/home');
assert.strictEqual(result, 'home', 'exact route should match');

// Param extraction
addRoute('/user/:id', ({ id }) => { result = `user-${id}`; });
navigate('/user/42');
assert.strictEqual(result, 'user-42', 'param should be extracted');

// Multiple params
addRoute('/post/:year/:slug', ({ year, slug }) => { result = `${year}/${slug}`; });
navigate('/post/2026/forever');
assert.strictEqual(result, '2026/forever', 'multiple params should be extracted');

// notFound fallback
let notFoundPath;
notFound(path => { notFoundPath = path; });
navigate('/nonexistent');
assert.strictEqual(notFoundPath, '/nonexistent', 'notFound handler should fire for unknown routes');

console.log('All router tests passed!');
