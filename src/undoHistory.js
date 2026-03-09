/**
 * Undo/redo history manager.
 * Maintains a bounded stack of state snapshots with undo and redo support.
 *
 * @module undoHistory
 */

'use strict';

/**
 * Create an undo/redo history manager.
 *
 * @param {object} [options]
 * @param {number} [options.limit=50] - Max number of past states to retain
 * @param {Function} [options.onUndo] - Callback fired after undo(state)
 * @param {Function} [options.onRedo] - Callback fired after redo(state)
 * @returns {object}
 */
function createUndoHistory(options = {}) {
  const { limit = 50, onUndo = null, onRedo = null } = options;

  /** @type {any[]} */
  let past = [];    // index 0 = oldest, last = most recent
  /** @type {any[]} */
  let future = [];  // index 0 = next-redo, last = oldest-redo

  return {
    /**
     * Push a new state onto the history stack.
     * Clears redo (future) stack.
     *
     * @param {any} state
     */
    push(state) {
      past.push(state);
      if (past.length > limit) {
        past.shift(); // drop oldest
      }
      future = [];
    },

    /**
     * Undo: moves current state to redo stack, returns previous state.
     *
     * @returns {any|undefined}
     */
    undo() {
      if (past.length < 2) return undefined;
      const current = past.pop();
      future.unshift(current);
      const prev = past[past.length - 1];
      if (typeof onUndo === 'function') onUndo(prev);
      return prev;
    },

    /**
     * Redo: re-applies the next future state.
     *
     * @returns {any|undefined}
     */
    redo() {
      if (future.length === 0) return undefined;
      const next = future.shift();
      past.push(next);
      if (past.length > limit) past.shift();
      if (typeof onRedo === 'function') onRedo(next);
      return next;
    },

    /**
     * Returns true if there is at least one state to undo to.
     *
     * @returns {boolean}
     */
    canUndo() {
      return past.length >= 2;
    },

    /**
     * Returns true if there is at least one state to redo.
     *
     * @returns {boolean}
     */
    canRedo() {
      return future.length > 0;
    },

    /**
     * Returns the current (most recent) state, or undefined if empty.
     *
     * @returns {any|undefined}
     */
    current() {
      return past.length > 0 ? past[past.length - 1] : undefined;
    },

    /**
     * Clears all history and redo stacks.
     */
    clear() {
      past = [];
      future = [];
    },

    /**
     * Returns a shallow copy of past states, oldest first.
     *
     * @returns {any[]}
     */
    getHistory() {
      return past.slice();
    }
  };
}

module.exports = { createUndoHistory };
