/**
 * General-purpose utility functions.
 */

function capitalize(str) {
  if (!str || typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function isEmpty(val) {
  if (val === null || val === undefined) return true;
  if (typeof val === 'string') return val.length === 0;
  if (Array.isArray(val)) return val.length === 0;
  if (typeof val === 'object') return Object.keys(val).length === 0;
  return false;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { capitalize, isEmpty, sleep };
