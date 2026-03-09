/**
 * Binary Search Tree (BST) data structure implementation
 */

function createBinarySearchTree(comparator) {
  let root = null;
  let nodeCount = 0;

  // Default comparator for numeric values
  const defaultComparator = (a, b) => {
    if (a < b) {
      return -1;
    }
    if (a > b) {
      return 1;
    }
    return 0;
  };

  const compare = comparator || defaultComparator;

  function createNode(value) {
    return {
      value,
      left: null,
      right: null
    };
  }

  function insert(value) {
    if (root === null) {
      root = createNode(value);
      nodeCount++;
      return true;
    }

    let current = root;
    while (current) {
      const cmp = compare(value, current.value);
      
      if (cmp === 0) {
        // Duplicate value
        return false;
      } else if (cmp < 0) {
        if (current.left === null) {
          current.left = createNode(value);
          nodeCount++;
          return true;
        }
        current = current.left;
      } else {
        if (current.right === null) {
          current.right = createNode(value);
          nodeCount++;
          return true;
        }
        current = current.right;
      }
    }
  }

  function search(value) {
    let current = root;
    while (current !== null) {
      const cmp = compare(value, current.value);
      
      if (cmp === 0) {
        return true;
      } else if (cmp < 0) {
        current = current.left;
      } else {
        current = current.right;
      }
    }
    return false;
  }

  function findMinNode(node) {
    let current = node;
    while (current.left !== null) {
      current = current.left;
    }
    return current;
  }

  function deleteNode(node, value) {
    if (node === null) {
      return null;
    }

    const cmp = compare(value, node.value);

    if (cmp < 0) {
      node.left = deleteNode(node.left, value);
    } else if (cmp > 0) {
      node.right = deleteNode(node.right, value);
    } else {
      // Node to be deleted found
      
      // Case 1: No child or one child
      if (node.left === null) {
        nodeCount--;
        return node.right;
      } else if (node.right === null) {
        nodeCount--;
        return node.left;
      }

      // Case 2: Two children
      // Find the inorder successor (smallest in right subtree)
      const minNode = findMinNode(node.right);
      node.value = minNode.value;
      
      // Delete the inorder successor
      node.right = deleteNode(node.right, minNode.value);
    }

    return node;
  }

  function deleteValue(value) {
    const initialSize = nodeCount;
    root = deleteNode(root, value);
    return nodeCount < initialSize;
  }

  function findMin() {
    if (root === null) {
      return null;
    }
    return findMinNode(root).value;
  }

  function findMax() {
    if (root === null) {
      return null;
    }
    
    let current = root;
    while (current.right !== null) {
      current = current.right;
    }
    return current.value;
  }

  function inOrderTraversal(node = root, result = []) {
    if (node !== null) {
      inOrderTraversal(node.left, result);
      result.push(node.value);
      inOrderTraversal(node.right, result);
    }
    return result;
  }

  function preOrderTraversal(node = root, result = []) {
    if (node !== null) {
      result.push(node.value);
      preOrderTraversal(node.left, result);
      preOrderTraversal(node.right, result);
    }
    return result;
  }

  function postOrderTraversal(node = root, result = []) {
    if (node !== null) {
      postOrderTraversal(node.left, result);
      postOrderTraversal(node.right, result);
      result.push(node.value);
    }
    return result;
  }

  function getHeight(node = root) {
    if (node === null) {
      return 0;
    }
    
    const leftHeight = getHeight(node.left);
    const rightHeight = getHeight(node.right);
    
    return Math.max(leftHeight, rightHeight) + 1;
  }

  function isBalancedNode(node = root) {
    if (node === null) {
      return true;
    }

    const leftHeight = getHeight(node.left);
    const rightHeight = getHeight(node.right);

    // Check if current node is balanced
    if (Math.abs(leftHeight - rightHeight) > 1) {
      return false;
    }

    // Recursively check if subtrees are balanced
    return isBalancedNode(node.left) && isBalancedNode(node.right);
  }

  function clear() {
    root = null;
    nodeCount = 0;
  }

  return {
    insert,
    search,
    delete: deleteValue,
    findMin,
    findMax,
    inOrderTraversal,
    preOrderTraversal,
    postOrderTraversal,
    get height() {
      return getHeight();
    },
    get size() {
      return nodeCount;
    },
    isBalanced: isBalancedNode,
    clear,
    toArray: inOrderTraversal
  };
}

module.exports = { createBinarySearchTree };
