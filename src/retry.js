/**
 * Retries an async function up to options.attempts times.
 * @param {Function} fn - async function to call
 * @param {{ attempts?: number, delayMs?: number }} options
 * @returns {Promise<*>}
 */
async function retry(fn, options = {}) {
  const { attempts = 3, delayMs = 100 } = options;
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }
  throw lastError;
}

module.exports = { retry };
