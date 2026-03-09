const { createQueue } = require('../src/dataQueue');

describe('Queue', () => {
  let queue;

  beforeEach(() => {
    queue = createQueue();
  });

  describe('basic operations', () => {
    test('should enqueue and dequeue items correctly', () => {
      queue.enqueue(1);
      queue.enqueue(2);
      queue.enqueue(3);
      
      expect(queue.dequeue()).toBe(1);
      expect(queue.dequeue()).toBe(2);
      expect(queue.dequeue()).toBe(3);
    });

    test('should return front and rear items correctly', () => {
      queue.enqueue(1);
      queue.enqueue(2);
      queue.enqueue(3);
      
      expect(queue.front()).toBe(1);
      expect(queue.rear()).toBe(3);
      
      queue.dequeue();
      
      expect(queue.front()).toBe(2);
      expect(queue.rear()).toBe(3);
    });

    test('should check if empty correctly', () => {
      expect(queue.isEmpty()).toBe(true);
      
      queue.enqueue(1);
      expect(queue.isEmpty()).toBe(false);
      
      queue.dequeue();
      expect(queue.isEmpty()).toBe(true);
    });

    test('should track size correctly', () => {
      expect(queue.size).toBe(0);
      
      queue.enqueue(1);
      expect(queue.size).toBe(1);
      
      queue.enqueue(2);
      queue.enqueue(3);
      expect(queue.size).toBe(3);
      
      queue.dequeue();
      expect(queue.size).toBe(2);
      
      queue.clear();
      expect(queue.size).toBe(0);
    });

    test('should clear all items', () => {
      queue.enqueue(1);
      queue.enqueue(2);
      queue.enqueue(3);
      
      queue.clear();
      
      expect(queue.size).toBe(0);
      expect(queue.isEmpty()).toBe(true);
      expect(queue.front()).toBeNull();
      expect(queue.rear()).toBeNull();
      expect(queue.dequeue()).toBeNull();
    });
  });

  describe('edge cases', () => {
    test('should handle empty queue operations', () => {
      expect(queue.dequeue()).toBeNull();
      expect(queue.front()).toBeNull();
      expect(queue.rear()).toBeNull();
      expect(queue.isEmpty()).toBe(true);
      expect(queue.size).toBe(0);
    });

    test('should handle single item', () => {
      queue.enqueue(42);
      
      expect(queue.size).toBe(1);
      expect(queue.front()).toBe(42);
      expect(queue.rear()).toBe(42);
      expect(queue.dequeue()).toBe(42);
      expect(queue.isEmpty()).toBe(true);
    });

    test('should handle different data types', () => {
      queue.enqueue(1);
      queue.enqueue('string');
      queue.enqueue(true);
      queue.enqueue(null);
      queue.enqueue(undefined);
      queue.enqueue({ object: 'value' });
      queue.enqueue([1, 2, 3]);
      
      expect(queue.size).toBe(7);
      expect(queue.contains('string')).toBe(true);
      expect(queue.contains({ object: 'value' })).toBe(true);
      
      expect(queue.dequeue()).toBe(1);
      expect(queue.dequeue()).toBe('string');
      expect(queue.dequeue()).toBe(true);
      expect(queue.dequeue()).toBeNull();
      expect(queue.dequeue()).toBeUndefined();
    });
  });

  describe('toArray and fromArray', () => {
    test('should convert empty queue to array', () => {
      expect(queue.toArray()).toEqual([]);
    });

    test('should convert queue to array in front-to-rear order', () => {
      queue.enqueue(1);
      queue.enqueue(2);
      queue.enqueue(3);
      
      expect(queue.toArray()).toEqual([1, 2, 3]);
    });

    test('should populate queue from array', () => {
      queue.fromArray([1, 2, 3, 4, 5]);
      
      expect(queue.size).toBe(5);
      expect(queue.dequeue()).toBe(1);
      expect(queue.dequeue()).toBe(2);
      expect(queue.dequeue()).toBe(3);
      expect(queue.dequeue()).toBe(4);
      expect(queue.dequeue()).toBe(5);
    });

    test('should replace existing contents', () => {
      queue.enqueue(1);
      queue.enqueue(2);
      queue.fromArray([3, 4, 5]);
      
      expect(queue.size).toBe(3);
      expect(queue.toArray()).toEqual([3, 4, 5]);
    });

    test('should handle empty array', () => {
      queue.enqueue(1);
      queue.enqueue(2);
      queue.fromArray([]);
      
      expect(queue.size).toBe(0);
      expect(queue.isEmpty()).toBe(true);
    });

    test('should throw error for non-array input', () => {
      expect(() => queue.fromArray('not an array')).toThrow(TypeError);
      expect(() => queue.fromArray({})).toThrow(TypeError);
      expect(() => queue.fromArray(null)).toThrow(TypeError);
    });

    test('should maintain order after round trip', () => {
      const original = [1, 2, 3, 4, 5];
      queue.fromArray(original);
      const result = queue.toArray();
      
      expect(result).toEqual(original);
    });
  });

  describe('contains method', () => {
    beforeEach(() => {
      queue.enqueue(1);
      queue.enqueue(2);
      queue.enqueue(3);
    });

    test('should find existing items', () => {
      expect(queue.contains(1)).toBe(true);
      expect(queue.contains(2)).toBe(true);
      expect(queue.contains(3)).toBe(true);
    });

    test('should return false for non-existing items', () => {
      expect(queue.contains(4)).toBe(false);
      expect(queue.contains('string')).toBe(false);
      expect(queue.contains(null)).toBe(false);
    });

    test('should work with different data types', () => {
      queue.enqueue('string');
      queue.enqueue(true);
      queue.enqueue(null);
      
      expect(queue.contains('string')).toBe(true);
      expect(queue.contains(true)).toBe(true);
      expect(queue.contains(null)).toBe(true);
    });

    test('should work on empty queue', () => {
      queue.clear();
      expect(queue.contains(1)).toBe(false);
      expect(queue.contains('anything')).toBe(false);
    });
  });

  describe('iteration methods', () => {
    beforeEach(() => {
      queue.enqueue(1);
      queue.enqueue(2);
      queue.enqueue(3);
    });

    test('should iterate with forEach from front to rear', () => {
      const result = [];
      queue.forEach((item, index) => {
        result.push({ item, index });
      });
      
      expect(result).toEqual([
        { item: 1, index: 0 },
        { item: 2, index: 1 },
        { item: 3, index: 2 }
      ]);
    });

    test('should map to new array from front to rear', () => {
      const result = queue.map((item, index) => item * index);
      expect(result).toEqual([0, 2, 6]);
    });

    test('should throw error for non-function callbacks', () => {
      expect(() => queue.forEach('not a function')).toThrow(TypeError);
      expect(() => queue.map('not a function')).toThrow(TypeError);
    });

    test('should work with empty queue', () => {
      queue.clear();
      
      const forEachResult = [];
      queue.forEach((item, index) => forEachResult.push(item));
      expect(forEachResult).toEqual([]);
      
      expect(queue.map(x => x * 2)).toEqual([]);
    });

    test('should handle complex mapping', () => {
      queue.enqueue(4);
      queue.enqueue(5);
      
      const doubled = queue.map(item => item * 2);
      expect(doubled).toEqual([2, 4, 6, 8, 10]);
      
      const strings = queue.map(item => `item-${item}`);
      expect(strings).toEqual(['item-1', 'item-2', 'item-3', 'item-4', 'item-5']);
    });
  });

  describe('clone method', () => {
    test('should create independent copy', () => {
      queue.enqueue(1);
      queue.enqueue(2);
      queue.enqueue(3);
      
      const clonedQueue = queue.clone();
      
      expect(clonedQueue.size).toBe(queue.size);
      expect(clonedQueue.toArray()).toEqual(queue.toArray());
      
      // Modify original
      queue.dequeue();
      queue.enqueue(4);
      
      // Clone should be unaffected
      expect(clonedQueue.size).toBe(3);
      expect(clonedQueue.dequeue()).toBe(1);
      
      // Original should reflect changes
      expect(queue.size).toBe(3);
      expect(queue.dequeue()).toBe(2);
    });

    test('should clone empty queue', () => {
      const clonedQueue = queue.clone();
      
      expect(clonedQueue.size).toBe(0);
      expect(clonedQueue.isEmpty()).toBe(true);
      
      // Modify clone
      clonedQueue.enqueue(1);
      
      // Original should remain empty
      expect(queue.size).toBe(0);
      expect(clonedQueue.size).toBe(1);
    });

    test('should clone with different data types', () => {
      queue.enqueue(1);
      queue.enqueue('string');
      queue.enqueue(true);
      queue.enqueue(null);
      
      const clonedQueue = queue.clone();
      
      expect(clonedQueue.toArray()).toEqual([1, 'string', true, null]);
      expect(clonedQueue.dequeue()).toBe(1);
      expect(clonedQueue.dequeue()).toBe('string');
      
      // Original should be unchanged
      expect(queue.dequeue()).toBe(1);
      expect(queue.dequeue()).toBe('string');
    });
  });

  describe('circular buffer behavior', () => {
    test('should handle wrap-around correctly', () => {
      // Fill the queue to capacity and beyond
      for (let i = 0; i < 20; i++) {
        queue.enqueue(i);
      }
      
      expect(queue.size).toBe(20);
      
      // Dequeue some items to create space at the beginning
      for (let i = 0; i < 10; i++) {
        expect(queue.dequeue()).toBe(i);
      }
      
      expect(queue.size).toBe(10);
      
      // Add more items to test wrap-around
      for (let i = 20; i < 30; i++) {
        queue.enqueue(i);
      }
      
      expect(queue.size).toBe(20);
      
      // Verify all items are in correct order
      const expected = Array.from({ length: 20 }, (_, i) => i + 10);
      expect(queue.toArray()).toEqual(expected);
    });

    test('should resize buffer when needed', () => {
      // Add many items to trigger multiple resizes
      for (let i = 0; i < 100; i++) {
        queue.enqueue(i);
      }
      
      expect(queue.size).toBe(100);
      
      // Verify order is maintained
      for (let i = 0; i < 100; i++) {
        expect(queue.dequeue()).toBe(i);
      }
    });

    test('should shrink buffer when many items are removed', () => {
      // Add many items
      for (let i = 0; i < 100; i++) {
        queue.enqueue(i);
      }
      
      // Remove most items to trigger shrinking
      for (let i = 0; i < 90; i++) {
        queue.dequeue();
      }
      
      expect(queue.size).toBe(10);
      
      // Verify remaining items are correct
      for (let i = 90; i < 100; i++) {
        expect(queue.dequeue()).toBe(i);
      }
    });
  });

  describe('performance and large datasets', () => {
    test('should handle large number of operations', () => {
      const operations = 10000;
      
      // Enqueue many items
      for (let i = 0; i < operations; i++) {
        queue.enqueue(i);
      }
      
      expect(queue.size).toBe(operations);
      expect(queue.front()).toBe(0);
      expect(queue.rear()).toBe(operations - 1);
      
      // Dequeue many items
      for (let i = 0; i < operations; i++) {
        expect(queue.dequeue()).toBe(i);
      }
      
      expect(queue.isEmpty()).toBe(true);
    });

    test('should handle large array conversion', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => i);
      queue.fromArray(largeArray);
      
      expect(queue.size).toBe(10000);
      
      const result = queue.toArray();
      expect(result.length).toBe(10000);
      expect(result[0]).toBe(0);
      expect(result[9999]).toBe(9999);
    });

    test('should handle large iterations efficiently', () => {
      for (let i = 0; i < 1000; i++) {
        queue.enqueue(i);
      }
      
      let sum = 0;
      queue.forEach(item => sum += item);
      
      // Sum of 0 to 999
      expect(sum).toBe(999 * 1000 / 2);
      
      const doubled = queue.map(item => item * 2);
      expect(doubled.length).toBe(1000);
      expect(doubled[0]).toBe(0);   // 0 * 2
      expect(doubled[999]).toBe(1998); // 999 * 2
    });
  });

  describe('complex scenarios', () => {
    test('should handle mixed operations correctly', () => {
      queue.enqueue(1);
      queue.enqueue(2);
      
      expect(queue.dequeue()).toBe(1);
      
      queue.enqueue(3);
      queue.enqueue(4);
      
      expect(queue.front()).toBe(2);
      expect(queue.rear()).toBe(4);
      expect(queue.size).toBe(3);
      
      queue.fromArray([5, 6, 7]);
      
      expect(queue.toArray()).toEqual([5, 6, 7]);
      expect(queue.size).toBe(3);
      
      queue.clear();
      
      expect(queue.isEmpty()).toBe(true);
      expect(queue.enqueue(8) === undefined);
      expect(queue.size).toBe(1);
    });

    test('should maintain FIFO order consistently', () => {
      const items = ['first', 'second', 'third', 'fourth', 'fifth'];
      
      items.forEach(item => queue.enqueue(item));
      
      const dequeued = [];
      while (!queue.isEmpty()) {
        dequeued.push(queue.dequeue());
      }
      
      expect(dequeued).toEqual(items);
    });

    test('should work with object references', () => {
      const obj1 = { id: 1, value: 'first' };
      const obj2 = { id: 2, value: 'second' };
      const obj3 = { id: 3, value: 'third' };
      
      queue.enqueue(obj1);
      queue.enqueue(obj2);
      queue.enqueue(obj3);
      
      expect(queue.front()).toBe(obj1);
      expect(queue.rear()).toBe(obj3);
      expect(queue.contains(obj2)).toBe(true);
      
      const dequeued = queue.dequeue();
      expect(dequeued).toBe(obj1);
      expect(dequeued.value).toBe('first');
      
      // Modify object after dequeuing
      dequeued.value = 'modified';
      
      // Queue should no longer reference the dequeued object
      expect(queue.contains(obj1)).toBe(false);
      expect(queue.front()).toBe(obj2);
    });
  });

  describe('error handling and validation', () => {
    test('should handle undefined and null values correctly', () => {
      queue.enqueue(undefined);
      queue.enqueue(null);
      
      expect(queue.size).toBe(2);
      expect(queue.front()).toBeUndefined();
      expect(queue.rear()).toBeNull();
      expect(queue.dequeue()).toBeUndefined();
      expect(queue.dequeue()).toBeNull();
    });

    test('should handle NaN and Infinity', () => {
      queue.enqueue(NaN);
      queue.enqueue(Infinity);
      queue.enqueue(-Infinity);
      
      expect(queue.size).toBe(3);
      expect(queue.contains(NaN)).toBe(true);
      expect(queue.contains(Infinity)).toBe(true);
      
      expect(queue.dequeue()).toBeNaN();
      expect(queue.dequeue()).toBe(Infinity);
      expect(queue.dequeue()).toBe(-Infinity);
    });

    test('should handle circular references', () => {
      const obj = {};
      obj.self = obj;
      
      queue.enqueue(obj);
      
      expect(queue.size).toBe(1);
      expect(queue.contains(obj)).toBe(true);
      
      const dequeued = queue.dequeue();
      expect(dequeued).toBe(obj);
      expect(dequeued.self).toBe(obj);
    });
  });
});
