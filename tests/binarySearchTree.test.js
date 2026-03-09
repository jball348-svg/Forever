const { createBinarySearchTree } = require('../src/binarySearchTree');

describe('Binary Search Tree', () => {
  let bst;

  beforeEach(() => {
    bst = createBinarySearchTree();
  });

  describe('insert and search', () => {
    test('should insert and search for values successfully', () => {
      expect(bst.insert(5)).toBe(true);
      expect(bst.insert(3)).toBe(true);
      expect(bst.insert(7)).toBe(true);
      
      expect(bst.search(5)).toBe(true);
      expect(bst.search(3)).toBe(true);
      expect(bst.search(7)).toBe(true);
    });

    test('should return false for non-existent values', () => {
      bst.insert(5);
      
      expect(bst.search(3)).toBe(false);
      expect(bst.search(7)).toBe(false);
      expect(bst.search(10)).toBe(false);
    });

    test('should handle duplicate inserts', () => {
      expect(bst.insert(5)).toBe(true);
      expect(bst.insert(5)).toBe(false);
      expect(bst.insert(5)).toBe(false);
      
      expect(bst.size).toBe(1);
      expect(bst.search(5)).toBe(true);
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      bst.insert(50);
      bst.insert(30);
      bst.insert(70);
      bst.insert(20);
      bst.insert(40);
      bst.insert(60);
      bst.insert(80);
    });

    test('should delete leaf nodes', () => {
      expect(bst.delete(20)).toBe(true);
      expect(bst.search(20)).toBe(false);
      expect(bst.size).toBe(6);
    });

    test('should delete nodes with one child', () => {
      // Delete 60 (has only right child 80 after we delete 20)
      bst.delete(20);
      expect(bst.delete(30)).toBe(true); // 30 has right child 40
      expect(bst.search(30)).toBe(false);
      expect(bst.search(40)).toBe(true);
      expect(bst.size).toBe(5);
    });

    test('should delete nodes with two children', () => {
      expect(bst.delete(30)).toBe(true);
      expect(bst.search(30)).toBe(false);
      expect(bst.search(20)).toBe(true);
      expect(bst.search(40)).toBe(true);
      expect(bst.size).toBe(6);
    });

    test('should delete root node', () => {
      expect(bst.delete(50)).toBe(true);
      expect(bst.search(50)).toBe(false);
      expect(bst.search(30)).toBe(true);
      expect(bst.search(70)).toBe(true);
      expect(bst.size).toBe(6);
    });

    test('should return false for non-existing values', () => {
      expect(bst.delete(100)).toBe(false);
      expect(bst.size).toBe(7);
    });

    test('should handle deleting from empty tree', () => {
      const emptyBst = createBinarySearchTree();
      expect(emptyBst.delete(5)).toBe(false);
    });
  });

  describe('findMin and findMax', () => {
    test('should return null for empty tree', () => {
      expect(bst.findMin()).toBeNull();
      expect(bst.findMax()).toBeNull();
    });

    test('should return the only value for single node tree', () => {
      bst.insert(5);
      expect(bst.findMin()).toBe(5);
      expect(bst.findMax()).toBe(5);
    });

    test('should return correct min and max for multiple nodes', () => {
      bst.insert(50);
      bst.insert(30);
      bst.insert(70);
      bst.insert(20);
      bst.insert(80);
      
      expect(bst.findMin()).toBe(20);
      expect(bst.findMax()).toBe(80);
    });

    test('should work correctly after deletions', () => {
      bst.insert(50);
      bst.insert(30);
      bst.insert(70);
      bst.insert(20);
      bst.insert(80);
      
      bst.delete(20);
      expect(bst.findMin()).toBe(30);
      
      bst.delete(80);
      expect(bst.findMax()).toBe(70);
    });
  });

  describe('traversal methods', () => {
    beforeEach(() => {
      bst.insert(50);
      bst.insert(30);
      bst.insert(70);
      bst.insert(20);
      bst.insert(40);
      bst.insert(60);
      bst.insert(80);
    });

    test('inOrderTraversal should return values in ascending order', () => {
      const result = bst.inOrderTraversal();
      expect(result).toEqual([20, 30, 40, 50, 60, 70, 80]);
    });

    test('preOrderTraversal should return values in pre-order', () => {
      const result = bst.preOrderTraversal();
      expect(result).toEqual([50, 30, 20, 40, 70, 60, 80]);
    });

    test('postOrderTraversal should return values in post-order', () => {
      const result = bst.postOrderTraversal();
      expect(result).toEqual([20, 40, 30, 60, 80, 70, 50]);
    });

    test('toArray should be alias for inOrderTraversal', () => {
      expect(bst.toArray()).toEqual(bst.inOrderTraversal());
    });

    test('should work for empty tree', () => {
      const emptyBst = createBinarySearchTree();
      expect(emptyBst.inOrderTraversal()).toEqual([]);
      expect(emptyBst.preOrderTraversal()).toEqual([]);
      expect(emptyBst.postOrderTraversal()).toEqual([]);
      expect(emptyBst.toArray()).toEqual([]);
    });
  });

  describe('height calculation', () => {
    test('should return 0 for empty tree', () => {
      expect(bst.height).toBe(0);
    });

    test('should return 1 for single node', () => {
      bst.insert(5);
      expect(bst.height).toBe(1);
    });

    test('should calculate correct height for balanced tree', () => {
      bst.insert(50);
      bst.insert(30);
      bst.insert(70);
      bst.insert(20);
      bst.insert(40);
      bst.insert(60);
      bst.insert(80);
      expect(bst.height).toBe(3);
    });

    test('should calculate correct height for unbalanced tree', () => {
      // Create a skewed tree (linked list like)
      bst.insert(1);
      bst.insert(2);
      bst.insert(3);
      bst.insert(4);
      bst.insert(5);
      expect(bst.height).toBe(5);
    });
  });

  describe('size tracking', () => {
    test('should track size correctly', () => {
      expect(bst.size).toBe(0);
      
      bst.insert(5);
      expect(bst.size).toBe(1);
      
      bst.insert(3);
      bst.insert(7);
      expect(bst.size).toBe(3);
      
      bst.insert(5); // duplicate
      expect(bst.size).toBe(3);
    });

    test('should update size after deletions', () => {
      bst.insert(5);
      bst.insert(3);
      bst.insert(7);
      
      bst.delete(3);
      expect(bst.size).toBe(2);
      
      bst.delete(10); // non-existing
      expect(bst.size).toBe(2);
    });

    test('should reset size after clear', () => {
      bst.insert(5);
      bst.insert(3);
      bst.insert(7);
      
      bst.clear();
      expect(bst.size).toBe(0);
    });
  });

  describe('isBalanced detection', () => {
    test('should return true for empty tree', () => {
      expect(bst.isBalanced()).toBe(true);
    });

    test('should return true for single node', () => {
      bst.insert(5);
      expect(bst.isBalanced()).toBe(true);
    });

    test('should return true for balanced tree', () => {
      bst.insert(50);
      bst.insert(30);
      bst.insert(70);
      bst.insert(20);
      bst.insert(40);
      bst.insert(60);
      bst.insert(80);
      expect(bst.isBalanced()).toBe(true);
    });

    test('should return false for unbalanced tree', () => {
      // Create an unbalanced tree
      bst.insert(1);
      bst.insert(2);
      bst.insert(3);
      bst.insert(4);
      bst.insert(5);
      expect(bst.isBalanced()).toBe(false);
    });
  });

  describe('clear functionality', () => {
    test('should clear all nodes', () => {
      bst.insert(5);
      bst.insert(3);
      bst.insert(7);
      
      expect(bst.size).toBe(3);
      expect(bst.search(5)).toBe(true);
      
      bst.clear();
      
      expect(bst.size).toBe(0);
      expect(bst.search(5)).toBe(false);
      expect(bst.height).toBe(0);
      expect(bst.findMin()).toBeNull();
      expect(bst.findMax()).toBeNull();
    });

    test('should work on empty tree', () => {
      bst.clear();
      
      expect(bst.size).toBe(0);
      expect(bst.height).toBe(0);
      expect(bst.toArray()).toEqual([]);
    });
  });

  describe('custom comparator', () => {
    test('should work with string comparator', () => {
      const stringBst = createBinarySearchTree((a, b) => a.localeCompare(b));
      
      stringBst.insert('zebra');
      stringBst.insert('apple');
      stringBst.insert('banana');
      
      expect(stringBst.inOrderTraversal()).toEqual(['apple', 'banana', 'zebra']);
      expect(stringBst.findMin()).toBe('apple');
      expect(stringBst.findMax()).toBe('zebra');
    });

    test('should work with object comparator', () => {
      const objectBst = createBinarySearchTree((a, b) => a.id - b.id);
      
      const obj1 = { id: 3, name: 'Charlie' };
      const obj2 = { id: 1, name: 'Alice' };
      const obj3 = { id: 2, name: 'Bob' };
      
      objectBst.insert(obj1);
      objectBst.insert(obj2);
      objectBst.insert(obj3);
      
      expect(objectBst.search(obj2)).toBe(true);
      expect(objectBst.findMin()).toBe(obj2);
      expect(objectBst.findMax()).toBe(obj1);
    });
  });

  describe('edge cases', () => {
    test('should handle large dataset', () => {
      const values = [];
      for (let i = 0; i < 1000; i++) {
        values.push(i);
        bst.insert(i);
      }
      
      expect(bst.size).toBe(1000);
      expect(bst.inOrderTraversal()).toEqual(values);
    });

    test('should handle negative numbers', () => {
      bst.insert(-10);
      bst.insert(0);
      bst.insert(10);
      bst.insert(-5);
      bst.insert(5);
      
      expect(bst.inOrderTraversal()).toEqual([-10, -5, 0, 5, 10]);
      expect(bst.findMin()).toBe(-10);
      expect(bst.findMax()).toBe(10);
    });

    test('should handle floating point numbers', () => {
      bst.insert(3.14);
      bst.insert(1.59);
      bst.insert(2.65);
      
      expect(bst.inOrderTraversal()).toEqual([1.59, 2.65, 3.14]);
    });

    test('should handle same value insertion with different object references', () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 1 };
      
      const objBst = createBinarySearchTree((a, b) => a.id - b.id);
      
      expect(objBst.insert(obj1)).toBe(true);
      expect(objBst.insert(obj2)).toBe(false); // Same id, should be considered duplicate
      expect(objBst.size).toBe(1);
    });
  });

  describe('complex scenarios', () => {
    test('should maintain BST properties after multiple operations', () => {
      // Insert values
      [50, 30, 70, 20, 40, 60, 80].forEach(val => bst.insert(val));
      
      // Delete some values
      bst.delete(20);
      bst.delete(70);
      
      // Insert new values
      bst.insert(25);
      bst.insert(75);
      
      const result = bst.inOrderTraversal();
      expect(result).toEqual([25, 30, 40, 50, 60, 75, 80]);
      
      // Verify BST property: each node is greater than all nodes in left subtree
      // and less than all nodes in right subtree
      const verifyBST = (node, min, max) => {
        if (node === null) {
          return true;
        }
        
        if (min !== null && node.value <= min) {
          return false;
        }
        if (max !== null && node.value >= max) {
          return false;
        }
        
        return verifyBST(node.left, min, node.value) && 
               verifyBST(node.right, node.value, max);
      };
      
      // Note: We can't access the root directly, but we can verify the traversal is sorted
      expect(result).toEqual([...result].sort((a, b) => a - b));
    });

    test('should handle extreme unbalanced scenarios', () => {
      // Create a completely unbalanced tree (ascending order)
      for (let i = 0; i < 100; i++) {
        bst.insert(i);
      }
      
      expect(bst.size).toBe(100);
      expect(bst.height).toBe(100);
      expect(bst.isBalanced()).toBe(false);
      
      // Should still work correctly
      expect(bst.search(50)).toBe(true);
      expect(bst.search(150)).toBe(false);
      expect(bst.inOrderTraversal()).toEqual(Array.from({length: 100}, (_, i) => i));
    });
  });
});
