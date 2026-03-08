/**
 * Simple named task scheduler.
 */
const tasks = new Map();

function schedule(name, intervalMs, fn) {
  if (tasks.has(name)) cancel(name);
  const id = setInterval(fn, intervalMs);
  tasks.set(name, id);
}

function cancel(name) {
  if (!tasks.has(name)) return false;
  clearInterval(tasks.get(name));
  tasks.delete(name);
  return true;
}

function list() {
  return Array.from(tasks.keys());
}

module.exports = { schedule, cancel, list };
