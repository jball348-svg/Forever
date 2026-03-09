'use strict';

const { createUndoHistory } = require('../src/undoHistory');

describe('undoHistory', () => {
  describe('push / current / getHistory', () => {
    it('current() returns undefined when empty', () => {
      const h = createUndoHistory();
      expect(h.current()).toBeUndefined();
    });

    it('current() returns the last pushed state', () => {
      const h = createUndoHistory();
      h.push({ x: 1 });
      h.push({ x: 2 });
      expect(h.current()).toEqual({ x: 2 });
    });

    it('getHistory() returns all pushed states oldest-first', () => {
      const h = createUndoHistory();
      h.push(1);
      h.push(2);
      h.push(3);
      expect(h.getHistory()).toEqual([1, 2, 3]);
    });

    it('getHistory() returns a copy - mutations do not affect internals', () => {
      const h = createUndoHistory();
      h.push('a');
      const hist = h.getHistory();
      hist.push('injected');
      expect(h.getHistory()).toEqual(['a']);
    });
  });

  describe('canUndo / canRedo', () => {
    it('canUndo() is false when empty', () => {
      expect(createUndoHistory().canUndo()).toBe(false);
    });

    it('canUndo() is false with only one state', () => {
      const h = createUndoHistory();
      h.push(1);
      expect(h.canUndo()).toBe(false);
    });

    it('canUndo() is true with two or more states', () => {
      const h = createUndoHistory();
      h.push(1);
      h.push(2);
      expect(h.canUndo()).toBe(true);
    });

    it('canRedo() is false initially', () => {
      const h = createUndoHistory();
      h.push(1);
      h.push(2);
      expect(h.canRedo()).toBe(false);
    });

    it('canRedo() is true after an undo', () => {
      const h = createUndoHistory();
      h.push(1);
      h.push(2);
      h.undo();
      expect(h.canRedo()).toBe(true);
    });
  });

  describe('undo / redo basic flow', () => {
    it('undo returns the previous state', () => {
      const h = createUndoHistory();
      h.push('a');
      h.push('b');
      expect(h.undo()).toBe('a');
      expect(h.current()).toBe('a');
    });

    it('undo returns undefined when nothing to undo', () => {
      const h = createUndoHistory();
      expect(h.undo()).toBeUndefined();
      h.push(1);
      expect(h.undo()).toBeUndefined();
    });

    it('redo returns the next state after undo', () => {
      const h = createUndoHistory();
      h.push(10);
      h.push(20);
      h.undo();
      expect(h.redo()).toBe(20);
      expect(h.current()).toBe(20);
    });

    it('redo returns undefined when nothing to redo', () => {
      const h = createUndoHistory();
      h.push(1);
      expect(h.redo()).toBeUndefined();
    });

    it('multiple undo/redo steps work correctly', () => {
      const h = createUndoHistory();
      h.push(1);
      h.push(2);
      h.push(3);
      h.undo(); // back to 2
      h.undo(); // back to 1
      expect(h.current()).toBe(1);
      h.redo(); // forward to 2
      expect(h.current()).toBe(2);
    });
  });

  describe('redo stack cleared on new push', () => {
    it('pushing after undo clears redo history', () => {
      const h = createUndoHistory();
      h.push('a');
      h.push('b');
      h.undo();
      expect(h.canRedo()).toBe(true);
      h.push('c');
      expect(h.canRedo()).toBe(false);
      expect(h.current()).toBe('c');
    });
  });

  describe('limit enforcement', () => {
    it('drops oldest entry when limit is exceeded', () => {
      const h = createUndoHistory({ limit: 3 });
      h.push(1);
      h.push(2);
      h.push(3);
      h.push(4); // should drop 1
      expect(h.getHistory()).toEqual([2, 3, 4]);
    });

    it('canUndo still works correctly after limit trim', () => {
      const h = createUndoHistory({ limit: 2 });
      h.push('x');
      h.push('y');
      h.push('z'); // drops 'x'
      expect(h.canUndo()).toBe(true);
      expect(h.undo()).toBe('y');
      expect(h.canUndo()).toBe(false);
    });
  });

  describe('clear()', () => {
    it('clears past and future', () => {
      const h = createUndoHistory();
      h.push(1);
      h.push(2);
      h.undo();
      h.clear();
      expect(h.current()).toBeUndefined();
      expect(h.canUndo()).toBe(false);
      expect(h.canRedo()).toBe(false);
      expect(h.getHistory()).toEqual([]);
    });
  });

  describe('callbacks', () => {
    it('onUndo is called with the state after undo', () => {
      const onUndo = jest.fn();
      const h = createUndoHistory({ onUndo });
      h.push('first');
      h.push('second');
      h.undo();
      expect(onUndo).toHaveBeenCalledWith('first');
    });

    it('onRedo is called with the state after redo', () => {
      const onRedo = jest.fn();
      const h = createUndoHistory({ onRedo });
      h.push('first');
      h.push('second');
      h.undo();
      h.redo();
      expect(onRedo).toHaveBeenCalledWith('second');
    });

    it('onUndo is not called when nothing to undo', () => {
      const onUndo = jest.fn();
      const h = createUndoHistory({ onUndo });
      h.push('only');
      h.undo();
      expect(onUndo).not.toHaveBeenCalled();
    });
  });
});
