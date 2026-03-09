const { createStack } = require('../src/stack');

describe('Stack', () => {
  let stack;

  beforeEach(() => {
    stack = createStack();
  });

  describe('basic operations', () => {
    test('should push and pop items correctly', () => {
      stack.push(1);
      stack.push(2);
      stack.push(3);
      
      expect(stack.pop()).toBe(3);
      expect(stack.pop()).toBe(2);
      expect(stack.pop()).toBe(1);
    });

    test('should peek at top item without removing it', () => {
      stack.push(1);
      stack.push(2);
      stack.push(3);
      
      expect(stack.peek()).toBe(3);
      expect(stack.peek()).toBe(3);
      expect(stack.size).toBe(3);
    });

    test('should check if empty correctly', () => {
      expect(stack.isEmpty()).toBe(true);
      
      stack.push(1);
      expect(stack.isEmpty()).toBe(false);
      
      stack.pop();
      expect(stack.isEmpty()).toBe(true);
    });

    test('should track size correctly', () => {
      expect(stack.size).toBe(0);
      
      stack.push(1);
      expect(stack.size).toBe(1);
      
      stack.push(2);
      stack.push(3);
      expect(stack.size).toBe(3);
      
      stack.pop();
      expect(stack.size).toBe(2);
      
      stack.clear();
      expect(stack.size).toBe(0);
    });

    test('should clear all items', () => {
      stack.push(1);
      stack.push(2);
      stack.push(3);
      
      stack.clear();
      
      expect(stack.size).toBe(0);
      expect(stack.isEmpty()).toBe(true);
      expect(stack.peek()).toBeNull();
      expect(stack.pop()).toBeNull();
    });
  });

  describe('edge cases', () => {
    test('should handle empty stack operations', () => {
      expect(stack.pop()).toBeNull();
      expect(stack.peek()).toBeNull();
      expect(stack.isEmpty()).toBe(true);
      expect(stack.size).toBe(0);
    });

    test('should handle single item', () => {
      stack.push(42);
      
      expect(stack.size).toBe(1);
      expect(stack.peek()).toBe(42);
      expect(stack.pop()).toBe(42);
      expect(stack.isEmpty()).toBe(true);
    });

    test('should handle different data types', () => {
      stack.push(1);
      stack.push('string');
      stack.push(true);
      stack.push(null);
      stack.push(undefined);
      stack.push({ object: 'value' });
      stack.push([1, 2, 3]);
      
      expect(stack.size).toBe(7);
      expect(stack.contains('string')).toBe(true);
      expect(stack.contains({ object: 'value' })).toBe(true);
      
      expect(stack.pop()).toEqual([1, 2, 3]);
      expect(stack.pop()).toEqual({ object: 'value' });
      expect(stack.pop()).toBeUndefined();
      expect(stack.pop()).toBeNull();
      expect(stack.pop()).toBe(true);
    });
  });

  describe('toArray and fromArray', () => {
    test('should convert empty stack to array', () => {
      expect(stack.toArray()).toEqual([]);
    });

    test('should convert stack to array in top-to-bottom order', () => {
      stack.push(1);
      stack.push(2);
      stack.push(3);
      
      expect(stack.toArray()).toEqual([3, 2, 1]);
    });

    test('should populate stack from array', () => {
      stack.fromArray([1, 2, 3, 4, 5]);
      
      expect(stack.size).toBe(5);
      expect(stack.pop()).toBe(5);
      expect(stack.pop()).toBe(4);
      expect(stack.pop()).toBe(3);
      expect(stack.pop()).toBe(2);
      expect(stack.pop()).toBe(1);
    });

    test('should replace existing contents', () => {
      stack.push(1);
      stack.push(2);
      stack.fromArray([3, 4, 5]);
      
      expect(stack.size).toBe(3);
      expect(stack.toArray()).toEqual([5, 4, 3]);
    });

    test('should handle empty array', () => {
      stack.push(1);
      stack.push(2);
      stack.fromArray([]);
      
      expect(stack.size).toBe(0);
      expect(stack.isEmpty()).toBe(true);
    });

    test('should throw error for non-array input', () => {
      expect(() => stack.fromArray('not an array')).toThrow(TypeError);
      expect(() => stack.fromArray({})).toThrow(TypeError);
      expect(() => stack.fromArray(null)).toThrow(TypeError);
    });

    test('should maintain order after round trip', () => {
      const original = [1, 2, 3, 4, 5];
      stack.fromArray(original);
      const result = stack.toArray();
      
      expect(result).toEqual([5, 4, 3, 2, 1]);
    });
  });

  describe('contains method', () => {
    beforeEach(() => {
      stack.push(1);
      stack.push(2);
      stack.push(3);
    });

    test('should find existing items', () => {
      expect(stack.contains(1)).toBe(true);
      expect(stack.contains(2)).toBe(true);
      expect(stack.contains(3)).toBe(true);
    });

    test('should return false for non-existing items', () => {
      expect(stack.contains(4)).toBe(false);
      expect(stack.contains('string')).toBe(false);
      expect(stack.contains(null)).toBe(false);
    });

    test('should work with different data types', () => {
      stack.push('string');
      stack.push(true);
      stack.push(null);
      
      expect(stack.contains('string')).toBe(true);
      expect(stack.contains(true)).toBe(true);
      expect(stack.contains(null)).toBe(true);
    });

    test('should work on empty stack', () => {
      stack.clear();
      expect(stack.contains(1)).toBe(false);
      expect(stack.contains('anything')).toBe(false);
    });
  });

  describe('iteration methods', () => {
    beforeEach(() => {
      stack.push(1);
      stack.push(2);
      stack.push(3);
    });

    test('should iterate with forEach from top to bottom', () => {
      const result = [];
      stack.forEach((item, index) => {
        result.push({ item, index });
      });
      
      expect(result).toEqual([
        { item: 3, index: 0 },
        { item: 2, index: 1 },
        { item: 1, index: 2 }
      ]);
    });

    test('should map to new array from top to bottom', () => {
      const result = stack.map((item, index) => item * index);
      expect(result).toEqual([0, 2, 6]);
    });

    test('should throw error for non-function callbacks', () => {
      expect(() => stack.forEach('not a function')).toThrow(TypeError);
      expect(() => stack.map('not a function')).toThrow(TypeError);
    });

    test('should work with empty stack', () => {
      stack.clear();
      
      const forEachResult = [];
      stack.forEach((item, index) => forEachResult.push(item));
      expect(forEachResult).toEqual([]);
      
      expect(stack.map(x => x * 2)).toEqual([]);
    });

    test('should handle complex mapping', () => {
      stack.push(4);
      stack.push(5);
      
      const doubled = stack.map(item => item * 2);
      expect(doubled).toEqual([10, 8, 6, 4, 2]);
      
      const strings = stack.map(item => `item-${item}`);
      expect(strings).toEqual(['item-5', 'item-4', 'item-3', 'item-2', 'item-1']);
    });
  });

  describe('clone method', () => {
    test('should create independent copy', () => {
      stack.push(1);
      stack.push(2);
      stack.push(3);
      
      const clonedStack = stack.clone();
      
      expect(clonedStack.size).toBe(stack.size);
      expect(clonedStack.toArray()).toEqual(stack.toArray());
      
      // Modify original
      stack.pop();
      stack.push(4);
      
      // Clone should be unaffected
      expect(clonedStack.size).toBe(3);
      expect(clonedStack.pop()).toBe(3);
      
      // Original should reflect changes
      expect(stack.size).toBe(3);
      expect(stack.pop()).toBe(4);
    });

    test('should clone empty stack', () => {
      const clonedStack = stack.clone();
      
      expect(clonedStack.size).toBe(0);
      expect(clonedStack.isEmpty()).toBe(true);
      
      // Modify clone
      clonedStack.push(1);
      
      // Original should remain empty
      expect(stack.size).toBe(0);
      expect(clonedStack.size).toBe(1);
    });

    test('should clone with different data types', () => {
      stack.push(1);
      stack.push('string');
      stack.push(true);
      stack.push(null);
      
      const clonedStack = stack.clone();
      
      expect(clonedStack.toArray()).toEqual([null, true, 'string', 1]);
      expect(clonedStack.pop()).toBeNull();
      expect(clonedStack.pop()).toBe(true);
      
      // Original should be unchanged
      expect(stack.pop()).toBeNull();
      expect(stack.pop()).toBe(true);
    });
  });

  describe('performance and large datasets', () => {
    test('should handle large number of operations', () => {
      const operations = 10000;
      
      // Push many items
      for (let i = 0; i < operations; i++) {
        stack.push(i);
      }
      
      expect(stack.size).toBe(operations);
      expect(stack.peek()).toBe(operations - 1);
      
      // Pop many items
      for (let i = operations - 1; i >= 0; i--) {
        expect(stack.pop()).toBe(i);
      }
      
      expect(stack.isEmpty()).toBe(true);
    });

    test('should handle large array conversion', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => i);
      stack.fromArray(largeArray);
      
      expect(stack.size).toBe(10000);
      
      const result = stack.toArray();
      expect(result.length).toBe(10000);
      expect(result[0]).toBe(9999);
      expect(result[9999]).toBe(0);
    });

    test('should handle large iterations efficiently', () => {
      for (let i = 0; i < 1000; i++) {
        stack.push(i);
      }
      
      let sum = 0;
      stack.forEach(item => sum += item);
      
      // Sum of 0 to 999
      expect(sum).toBe(999 * 1000 / 2);
      
      const doubled = stack.map(item => item * 2);
      expect(doubled.length).toBe(1000);
      expect(doubled[0]).toBe(1998); // 999 * 2
      expect(doubled[999]).toBe(0);  // 0 * 2
    });
  });

  describe('complex scenarios', () => {
    test('should handle mixed operations correctly', () => {
      stack.push(1);
      stack.push(2);
      
      expect(stack.pop()).toBe(2);
      
      stack.push(3);
      stack.push(4);
      
      expect(stack.peek()).toBe(4);
      expect(stack.size).toBe(3);
      
      stack.fromArray([5, 6, 7]);
      
      expect(stack.toArray()).toEqual([7, 6, 5]);
      expect(stack.size).toBe(3);
      
      stack.clear();
      
      expect(stack.isEmpty()).toBe(true);
      expect(stack.push(8) === undefined);
      expect(stack.size).toBe(1);
    });

    test('should maintain LIFO order consistently', () => {
      const items = ['first', 'second', 'third', 'fourth', 'fifth'];
      
      items.forEach(item => stack.push(item));
      
      const popped = [];
      while (!stack.isEmpty()) {
        popped.push(stack.pop());
      }
      
      expect(popped).toEqual(['fifth', 'fourth', 'third', 'second', 'first']);
    });

    test('should work with object references', () => {
      const obj1 = { id: 1, value: 'first' };
      const obj2 = { id: 2, value: 'second' };
      const obj3 = { id: 3, value: 'third' };
      
      stack.push(obj1);
      stack.push(obj2);
      stack.push(obj3);
      
      expect(stack.peek()).toBe(obj3);
      expect(stack.contains(obj2)).toBe(true);
      
      const popped = stack.pop();
      expect(popped).toBe(obj3);
      expect(popped.value).toBe('third');
      
      // Modify object after popping
      popped.value = 'modified';
      
      // Stack should no longer reference the popped object
      expect(stack.contains(obj3)).toBe(false);
      expect(stack.peek()).toBe(obj2);
    });
  });

  describe('error handling and validation', () => {
    test('should handle undefined and null values correctly', () => {
      stack.push(undefined);
      stack.push(null);
      
      expect(stack.size).toBe(2);
      expect(stack.peek()).toBeNull();
      expect(stack.pop()).toBeNull();
      expect(stack.pop()).toBeUndefined();
    });

    test('should handle NaN and Infinity', () => {
      stack.push(NaN);
      stack.push(Infinity);
      stack.push(-Infinity);
      
      expect(stack.size).toBe(3);
      expect(stack.contains(NaN)).toBe(true);
      expect(stack.contains(Infinity)).toBe(true);
      
      expect(stack.pop()).toBe(-Infinity);
      expect(stack.pop()).toBe(Infinity);
      expect(stack.pop()).toBeNaN();
    });

    test('should handle circular references', () => {
      const obj = {};
      obj.self = obj;
      
      stack.push(obj);
      
      expect(stack.size).toBe(1);
      expect(stack.contains(obj)).toBe(true);
      
      const popped = stack.pop();
      expect(popped).toBe(obj);
      expect(popped.self).toBe(obj);
    });
  });
});
