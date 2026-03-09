const { createLinkedList } = require('../src/linkedList');

describe('Doubly Linked List', () => {
  let list;

  beforeEach(() => {
    list = createLinkedList();
  });

  describe('append and prepend', () => {
    test('should append values to end of list', () => {
      list.append(1);
      list.append(2);
      list.append(3);
      
      expect(list.toArray()).toEqual([1, 2, 3]);
      expect(list.size).toBe(3);
    });

    test('should prepend values to beginning of list', () => {
      list.prepend(3);
      list.prepend(2);
      list.prepend(1);
      
      expect(list.toArray()).toEqual([1, 2, 3]);
      expect(list.size).toBe(3);
    });

    test('should handle mixed append and prepend', () => {
      list.append(2);
      list.prepend(1);
      list.append(3);
      list.prepend(0);
      
      expect(list.toArray()).toEqual([0, 1, 2, 3]);
      expect(list.size).toBe(4);
    });

    test('should handle single element', () => {
      list.append(5);
      
      expect(list.toArray()).toEqual([5]);
      expect(list.size).toBe(1);
      expect(list.get(0)).toBe(5);
    });
  });

  describe('insertAt', () => {
    beforeEach(() => {
      list.append(1);
      list.append(3);
      list.append(5);
    });

    test('should insert at beginning', () => {
      expect(list.insertAt(0, 0)).toBe(true);
      expect(list.toArray()).toEqual([0, 1, 3, 5]);
      expect(list.size).toBe(4);
    });

    test('should insert at middle', () => {
      expect(list.insertAt(1, 2)).toBe(true);
      expect(list.toArray()).toEqual([1, 2, 3, 5]);
      expect(list.size).toBe(4);
    });

    test('should insert at end', () => {
      expect(list.insertAt(3, 6)).toBe(true);
      expect(list.toArray()).toEqual([1, 3, 5, 6]);
      expect(list.size).toBe(4);
    });

    test('should return false for invalid indices', () => {
      expect(list.insertAt(-1, 0)).toBe(false);
      expect(list.insertAt(4, 0)).toBe(false);
      expect(list.insertAt(10, 0)).toBe(false);
      expect(list.size).toBe(3);
    });

    test('should work on empty list', () => {
      const emptyList = createLinkedList();
      expect(emptyList.insertAt(0, 1)).toBe(true);
      expect(emptyList.toArray()).toEqual([1]);
      expect(emptyList.size).toBe(1);
    });
  });

  describe('remove and removeAt', () => {
    beforeEach(() => {
      list.append(1);
      list.append(2);
      list.append(3);
      list.append(4);
      list.append(5);
    });

    test('should remove existing values', () => {
      expect(list.remove(3)).toBe(true);
      expect(list.toArray()).toEqual([1, 2, 4, 5]);
      expect(list.size).toBe(4);
      
      expect(list.remove(1)).toBe(true);
      expect(list.toArray()).toEqual([2, 4, 5]);
      expect(list.size).toBe(3);
      
      expect(list.remove(5)).toBe(true);
      expect(list.toArray()).toEqual([2, 4]);
      expect(list.size).toBe(2);
    });

    test('should remove first occurrence only', () => {
      list.append(3);
      expect(list.remove(3)).toBe(true);
      expect(list.toArray()).toEqual([1, 2, 4, 5, 3]);
      expect(list.size).toBe(5);
    });

    test('should return false for non-existing values', () => {
      expect(list.remove(10)).toBe(false);
      expect(list.size).toBe(5);
    });

    test('should remove at valid indices', () => {
      expect(list.removeAt(0)).toBe(1);
      expect(list.toArray()).toEqual([2, 3, 4, 5]);
      expect(list.size).toBe(4);
      
      expect(list.removeAt(2)).toBe(4);
      expect(list.toArray()).toEqual([2, 3, 5]);
      expect(list.size).toBe(3);
      
      expect(list.removeAt(2)).toBe(5);
      expect(list.toArray()).toEqual([2, 3]);
      expect(list.size).toBe(2);
    });

    test('should return null for invalid indices', () => {
      expect(list.removeAt(-1)).toBeNull();
      expect(list.removeAt(5)).toBeNull();
      expect(list.removeAt(10)).toBeNull();
      expect(list.size).toBe(5);
    });

    test('should handle removing from single element list', () => {
      const singleList = createLinkedList();
      singleList.append(1);
      
      expect(singleList.remove(1)).toBe(true);
      expect(singleList.toArray()).toEqual([]);
      expect(singleList.size).toBe(0);
    });
  });

  describe('get, indexOf, and contains', () => {
    beforeEach(() => {
      list.append('apple');
      list.append('banana');
      list.append('cherry');
    });

    test('should get values at valid indices', () => {
      expect(list.get(0)).toBe('apple');
      expect(list.get(1)).toBe('banana');
      expect(list.get(2)).toBe('cherry');
    });

    test('should return null for invalid indices', () => {
      expect(list.get(-1)).toBeNull();
      expect(list.get(3)).toBeNull();
      expect(list.get(10)).toBeNull();
    });

    test('should find correct indices', () => {
      expect(list.indexOf('apple')).toBe(0);
      expect(list.indexOf('banana')).toBe(1);
      expect(list.indexOf('cherry')).toBe(2);
    });

    test('should return -1 for non-existing values', () => {
      expect(list.indexOf('orange')).toBe(-1);
      expect(list.indexOf('grape')).toBe(-1);
    });

    test('should find first occurrence for duplicates', () => {
      list.append('banana');
      expect(list.indexOf('banana')).toBe(1);
    });

    test('should check containment correctly', () => {
      expect(list.contains('apple')).toBe(true);
      expect(list.contains('banana')).toBe(true);
      expect(list.contains('orange')).toBe(false);
    });
  });

  describe('toArray and fromArray', () => {
    test('should convert empty list to array', () => {
      expect(list.toArray()).toEqual([]);
    });

    test('should convert list to array', () => {
      list.append(1);
      list.append(2);
      list.append(3);
      
      expect(list.toArray()).toEqual([1, 2, 3]);
    });

    test('should populate list from array', () => {
      list.fromArray([1, 2, 3, 4, 5]);
      
      expect(list.toArray()).toEqual([1, 2, 3, 4, 5]);
      expect(list.size).toBe(5);
    });

    test('should replace existing contents', () => {
      list.append(1);
      list.append(2);
      list.fromArray([3, 4, 5]);
      
      expect(list.toArray()).toEqual([3, 4, 5]);
      expect(list.size).toBe(3);
    });

    test('should handle empty array', () => {
      list.append(1);
      list.append(2);
      list.fromArray([]);
      
      expect(list.toArray()).toEqual([]);
      expect(list.size).toBe(0);
    });

    test('should throw error for non-array input', () => {
      expect(() => list.fromArray('not an array')).toThrow(TypeError);
      expect(() => list.fromArray({})).toThrow(TypeError);
      expect(() => list.fromArray(null)).toThrow(TypeError);
    });
  });

  describe('size and isEmpty', () => {
    test('should track size correctly', () => {
      expect(list.size).toBe(0);
      expect(list.isEmpty()).toBe(true);
      
      list.append(1);
      expect(list.size).toBe(1);
      expect(list.isEmpty()).toBe(false);
      
      list.append(2);
      list.append(3);
      expect(list.size).toBe(3);
      expect(list.isEmpty()).toBe(false);
    });

    test('should update size after removals', () => {
      list.append(1);
      list.append(2);
      list.append(3);
      
      list.remove(2);
      expect(list.size).toBe(2);
      
      list.removeAt(0);
      expect(list.size).toBe(1);
    });

    test('should update size after clear', () => {
      list.append(1);
      list.append(2);
      list.append(3);
      
      list.clear();
      expect(list.size).toBe(0);
      expect(list.isEmpty()).toBe(true);
    });
  });

  describe('clear and reverse', () => {
    beforeEach(() => {
      list.append(1);
      list.append(2);
      list.append(3);
    });

    test('should clear all elements', () => {
      list.clear();
      
      expect(list.toArray()).toEqual([]);
      expect(list.size).toBe(0);
      expect(list.isEmpty()).toBe(true);
    });

    test('should reverse list', () => {
      list.reverse();
      expect(list.toArray()).toEqual([3, 2, 1]);
      
      list.reverse();
      expect(list.toArray()).toEqual([1, 2, 3]);
    });

    test('should handle single element', () => {
      const singleList = createLinkedList();
      singleList.append(1);
      
      singleList.reverse();
      expect(singleList.toArray()).toEqual([1]);
    });

    test('should handle empty list', () => {
      list.clear();
      list.reverse();
      expect(list.toArray()).toEqual([]);
    });
  });

  describe('iteration methods', () => {
    beforeEach(() => {
      list.append(1);
      list.append(2);
      list.append(3);
    });

    test('should iterate with forEach', () => {
      const result = [];
      list.forEach((value, index) => {
        result.push({ value, index });
      });
      
      expect(result).toEqual([
        { value: 1, index: 0 },
        { value: 2, index: 1 },
        { value: 3, index: 2 }
      ]);
    });

    test('should map to new array', () => {
      const result = list.map((value, index) => value * index);
      expect(result).toEqual([0, 2, 6]);
    });

    test('should filter elements', () => {
      const result = list.filter((value, index) => value % 2 === 0);
      expect(result).toEqual([2]);
    });

    test('should throw error for non-function callbacks', () => {
      expect(() => list.forEach('not a function')).toThrow(TypeError);
      expect(() => list.map('not a function')).toThrow(TypeError);
      expect(() => list.filter('not a function')).toThrow(TypeError);
    });

    test('should work with empty list', () => {
      list.clear();
      
      const forEachResult = [];
      list.forEach((value, index) => forEachResult.push(value));
      expect(forEachResult).toEqual([]);
      
      expect(list.map(x => x * 2)).toEqual([]);
      expect(list.filter(x => x > 0)).toEqual([]);
    });
  });

  describe('edge cases', () => {
    test('should handle different data types', () => {
      list.append(1);
      list.append('string');
      list.append(true);
      list.append(null);
      list.append(undefined);
      list.append({ object: 'value' });
      list.append([1, 2, 3]);
      
      expect(list.size).toBe(7);
      expect(list.contains('string')).toBe(true);
      expect(list.contains({ object: 'value' })).toBe(true);
    });

    test('should handle large dataset', () => {
      const values = Array.from({ length: 1000 }, (_, i) => i);
      list.fromArray(values);
      
      expect(list.size).toBe(1000);
      expect(list.get(500)).toBe(500);
      expect(list.indexOf(999)).toBe(999);
      expect(list.contains(501)).toBe(true);
    });

    test('should maintain performance with large lists', () => {
      // Insert many elements
      for (let i = 0; i < 10000; i++) {
        list.append(i);
      }
      
      expect(list.size).toBe(10000);
      
      // Test access at different positions
      expect(list.get(0)).toBe(0);
      expect(list.get(9999)).toBe(9999);
      expect(list.get(5000)).toBe(5000);
      
      // Test removal from middle
      const removed = list.removeAt(5000);
      expect(removed).toBe(5000);
      expect(list.size).toBe(9999);
      expect(list.get(5000)).toBe(5001);
    });

    test('should handle rapid insertions and deletions', () => {
      for (let i = 0; i < 100; i++) {
        list.append(i);
      }
      
      for (let i = 0; i < 50; i++) {
        list.remove(i);
      }
      
      expect(list.size).toBe(50);
      expect(list.toArray()).toEqual(Array.from({ length: 50 }, (_, i) => i + 50));
    });
  });

  describe('complex scenarios', () => {
    test('should handle mixed operations correctly', () => {
      list.append(2);
      list.prepend(1);
      list.insertAt(2, 3);
      list.append(5);
      list.insertAt(3, 4);
      
      expect(list.toArray()).toEqual([1, 2, 3, 4, 5]);
      
      list.remove(3);
      list.removeAt(0);
      list.append(6);
      
      expect(list.toArray()).toEqual([2, 4, 5, 6]);
      
      list.reverse();
      expect(list.toArray()).toEqual([6, 5, 4, 2]);
      
      const doubled = list.map(x => x * 2);
      expect(doubled).toEqual([12, 10, 8, 4]);
      
      const evens = list.filter(x => x % 2 === 0);
      expect(evens).toEqual([6, 4, 2]);
    });

    test('should maintain bidirectional links', () => {
      list.fromArray([1, 2, 3, 4, 5]);
      
      // Verify structure by traversing both ways
      const forward = list.toArray();
      list.reverse();
      const backward = list.toArray();
      list.reverse(); // Restore original order
      
      expect(forward).toEqual([1, 2, 3, 4, 5]);
      expect(backward).toEqual([5, 4, 3, 2, 1]);
      
      // After all operations, structure should still be intact
      expect(list.get(2)).toBe(3);
      expect(list.indexOf(4)).toBe(3);
    });
  });
});
