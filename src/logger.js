/**
 * Simple logging utility.
 * @param {'info'|'warn'|'error'} level
 * @param {string} message
 */
function log(level, message) {
  switch (level) {
    case 'info':
      console.log(`[INFO] ${message}`);
      break;
    case 'warn':
      console.warn(`[WARN] ${message}`);
      break;
    case 'error':
      console.error(`[ERROR] ${message}`);
      break;
    default:
      console.log(`[LOG] ${message}`);
  }
}

module.exports = { log };
