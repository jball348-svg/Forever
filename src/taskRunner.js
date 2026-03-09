/**
 * Task runner and workflow orchestrator with dependency resolution and concurrency control.
 * Supports named tasks, dependency graphs, timeouts, and lifecycle hooks.
 *
 * @module taskRunner
 */

'use strict';

/**
 * Create a task runner.
 *
 * @param {object} [options]
 * @param {number} [options.concurrency=Infinity] - Max simultaneous running tasks
 * @param {number} [options.timeout=0] - Per-task timeout in ms (0 = no timeout)
 * @param {Function} [options.onTaskStart] - Called with (name) when task starts
 * @param {Function} [options.onTaskEnd] - Called with (name, result) on success
 * @param {Function} [options.onTaskError] - Called with (name, error) on failure
 * @returns {object} Task runner instance
 */
function createTaskRunner(options = {}) {
  const {
    concurrency = Infinity,
    timeout: globalTimeout = 0,
    onTaskStart = null,
    onTaskEnd = null,
    onTaskError = null,
  } = options;

  /** @type {Map<string, { deps: string[], fn: Function, status: string, result: *, error: * }>} */
  const tasks = new Map();

  function _hasCycle(name, deps, visited = new Set(), stack = new Set()) {
    visited.add(name);
    stack.add(name);
    for (const dep of deps) {
      if (!visited.has(dep)) {
        const task = tasks.get(dep);
        if (task && _hasCycle(dep, task.deps, visited, stack)) {return true;}
      } else if (stack.has(dep)) {
        return true;
      }
    }
    stack.delete(name);
    return false;
  }

  function _checkCycle(name, deps) {
    // Check if adding this task creates a cycle
    // Temporarily add to check
    tasks.set(name, { deps, fn: null, status: 'pending', result: undefined, error: null });
    const cycle = _hasCycle(name, deps);
    if (cycle) {
      tasks.delete(name);
      throw new Error(`Circular dependency detected for task '${name}'`);
    }
  }

  function _topoSort(names) {
    const visited = new Set();
    const result = [];

    function visit(n) {
      if (visited.has(n)) {return;}
      visited.add(n);
      const task = tasks.get(n);
      if (!task) {throw new Error(`Unknown task: '${n}'`);}
      for (const dep of task.deps) {visit(dep);}
      result.push(n);
    }

    for (const n of names) {visit(n);}
    return result;
  }

  async function _runOne(name, results) {
    const task = tasks.get(name);
    if (!task) {throw new Error(`Unknown task: '${name}'`);}

    if (task.status === 'done') {return task.result;}
    if (task.status === 'failed') {throw task.error;}

    task.status = 'running';
    if (typeof onTaskStart === 'function') {onTaskStart(name);}

    // Build dep results
    const depResults = {};
    for (const dep of task.deps) {
      depResults[dep] = results.get(dep);
    }

    let resolve, reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });

    let timerHandle = null;
    if (globalTimeout > 0) {
      timerHandle = setTimeout(() => {
        reject(new Error(`Task '${name}' timed out after ${globalTimeout}ms`));
      }, globalTimeout);
    }

    task.fn(depResults)
      .then(result => {
        if (timerHandle) {clearTimeout(timerHandle);}
        task.status = 'done';
        task.result = result;
        results.set(name, result);
        if (typeof onTaskEnd === 'function') {onTaskEnd(name, result);}
        resolve(result);
      })
      .catch(err => {
        if (timerHandle) {clearTimeout(timerHandle);}
        task.status = 'failed';
        task.error = err;
        if (typeof onTaskError === 'function') {onTaskError(name, err);}
        reject(err);
      });

    return promise;
  }

  async function _runAll(names) {
    const order = _topoSort(names);
    const results = new Map();

    // Group tasks into waves (tasks whose deps are already done)
    // With concurrency limit, use a queue-based approach
    const pending = new Set(order);
    const running = new Set();
    const done = new Set();

    async function tryLaunch() {
      const launchable = [...pending].filter(name => {
        if (running.size >= concurrency) {return false;}
        const task = tasks.get(name);
        return task.deps.every(d => done.has(d));
      });

      for (const name of launchable) {
        pending.delete(name);
        running.add(name);
        _runOne(name, results)
          .then(() => {
            running.delete(name);
            done.add(name);
          })
          .catch(() => {
            running.delete(name);
            done.add(name); // mark done so we don't retry
          });
      }
    }

    // Poll until all tasks complete
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        await tryLaunch();
        if (pending.size === 0 && running.size === 0) {
          clearInterval(interval);
          // Check for failures
          for (const name of order) {
            const task = tasks.get(name);
            if (task.status === 'failed') {
              return reject(task.error);
            }
          }
          resolve(Object.fromEntries(results));
        }
        // Continue polling
        return undefined;
      }, 0);

      // Kick off first wave immediately
      tryLaunch();
    });
  }

  return {
    /**
     * Register a named task.
     *
     * @param {string} name - Task name
     * @param {string[]} deps - Names of tasks that must complete first
     * @param {Function} fn - Async function receiving dep results: fn({ depName: result })
     */
    task(name, deps, fn) {
      if (tasks.has(name) && tasks.get(name).fn !== null) {
        // Re-registration: remove old before cycle check
        tasks.delete(name);
      }
      _checkCycle(name, deps);
      const existing = tasks.get(name) || {};
      tasks.set(name, { ...existing, deps, fn, status: 'pending', result: undefined, error: null });
    },

    /**
     * Run a task (and its dependencies), or all tasks.
     *
     * @param {string} [name] - If omitted, runs all registered tasks
     * @returns {Promise<object>} Map of { taskName: result }
     */
    async run(name) {
      if (name !== undefined) {
        if (!tasks.has(name)) {throw new Error(`Unknown task: '${name}'`);}
        return _runAll([name]);
      }
      return _runAll([...tasks.keys()]);
    },

    /**
     * Get status of all tasks.
     *
     * @returns {object} Map of { taskName: 'pending'|'running'|'done'|'failed' }
     */
    getStatus() {
      const status = {};
      for (const [name, task] of tasks) {
        status[name] = task.status;
      }
      return status;
    },

    /**
     * Reset all tasks to pending state.
     */
    reset() {
      for (const task of tasks.values()) {
        task.status = 'pending';
        task.result = undefined;
        task.error = null;
      }
    }
  };
}

module.exports = { createTaskRunner };
