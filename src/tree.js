/**
 * General Tree data structure implementation
 */

function createTree(value) {
  // Create root node
  const root = {
    value,
    children: [],
    parent: null
  };

  let nodeCount = 1;

  // Helper function to find node by value
  function findNode(targetValue, startNode = root) {
    if (startNode.value === targetValue) {
      return startNode;
    }
    
    for (const child of startNode.children) {
      const found = findNode(targetValue, child);
      if (found) return found;
    }
    
    return undefined;
  }

  // Helper function to calculate height from a node
  function calculateHeight(node) {
    if (node.children.length === 0) {
      return 0;
    }
    
    let maxChildHeight = 0;
    for (const child of node.children) {
      const childHeight = calculateHeight(child);
      maxChildHeight = Math.max(maxChildHeight, childHeight);
    }
    
    return maxChildHeight + 1;
  }

  // Helper function for breadth-first traversal
  function breadthFirstTraversal(startNode = root) {
    const result = [];
    const queue = [startNode];
    
    while (queue.length > 0) {
      const node = queue.shift();
      result.push(node.value);
      queue.push(...node.children);
    }
    
    return result;
  }

  // Helper function for depth-first traversal (pre-order)
  function depthFirstTraversal(startNode = root) {
    const result = [];
    
    function traverse(node) {
      result.push(node.value);
      for (const child of node.children) {
        traverse(child);
      }
    }
    
    traverse(startNode);
    return result;
  }

  // Helper function for post-order traversal
  function postOrderTraversal(startNode = root) {
    const result = [];
    
    function traverse(node) {
      for (const child of node.children) {
        traverse(child);
      }
      result.push(node.value);
    }
    
    traverse(startNode);
    return result;
  }

  // Helper function to find path between nodes
  function findPath(fromValue, toValue) {
    const fromNode = findNode(fromValue);
    const toNode = findNode(toValue);
    
    if (!fromNode || !toNode) {
      return null;
    }
    
    // Build path from root to fromNode
    const fromPath = [];
    let current = fromNode;
    while (current) {
      fromPath.unshift(current.value);
      current = current.parent;
    }
    
    // Build path from root to toNode
    const toPath = [];
    current = toNode;
    while (current) {
      toPath.unshift(current.value);
      current = current.parent;
    }
    
    // Find common ancestor
    let commonIndex = 0;
    while (commonIndex < fromPath.length && 
           commonIndex < toPath.length && 
           fromPath[commonIndex] === toPath[commonIndex]) {
      commonIndex++;
    }
    
    // Build path: fromNode up to common ancestor, then down to toNode
    const path = [];
    // Add fromNode up to (but not including) common ancestor
    for (let i = fromPath.length - 1; i >= commonIndex; i--) {
      path.push(fromPath[i]);
    }
    // Add common ancestor to toNode path
    for (let i = commonIndex - 1; i < toPath.length; i++) {
      path.push(toPath[i]);
    }
    
    return path;
  }

  // Helper function to extract subtree
  function extractSubtree(nodeValue) {
    const node = findNode(nodeValue);
    if (!node) {
      return null;
    }
    
    // Create a deep copy of the subtree
    function copyNode(originalNode, parent = null) {
      const copy = {
        value: originalNode.value,
        children: [],
        parent
      };
      
      for (const child of originalNode.children) {
        copy.children.push(copyNode(child, copy));
      }
      
      return copy;
    }
    
    const copiedRoot = copyNode(node);
    
    // Create tree factory function with the copied root
    return createTreeFromRoot(copiedRoot);
  }

  // Helper to create tree from existing root
  function createTreeFromRoot(existingRoot) {
    // Count nodes in the new root
    function countNodes(node) {
      let count = 1;
      for (const child of node.children) {
        count += countNodes(child);
      }
      return count;
    }
    
    const newRoot = existingRoot;
    const newNodeCount = countNodes(newRoot);
    
    // Helper function to find node by value
    function findNode(targetValue, startNode = newRoot) {
      if (startNode.value === targetValue) {
        return startNode;
      }
      
      for (const child of startNode.children) {
        const found = findNode(targetValue, child);
        if (found) return found;
      }
      
      return undefined;
    }

    // Helper function to calculate height from a node
    function calculateHeight(node) {
      if (node.children.length === 0) {
        return 0;
      }
      
      let maxChildHeight = 0;
      for (const child of node.children) {
        const childHeight = calculateHeight(child);
        maxChildHeight = Math.max(maxChildHeight, childHeight);
      }
      
      return maxChildHeight + 1;
    }

    // Helper function for breadth-first traversal
    function breadthFirstTraversal(startNode = newRoot) {
      const result = [];
      const queue = [startNode];
      
      while (queue.length > 0) {
        const node = queue.shift();
        result.push(node.value);
        queue.push(...node.children);
      }
      
      return result;
    }

    // Helper function for depth-first traversal (pre-order)
    function depthFirstTraversal(startNode = newRoot) {
      const result = [];
      
      function traverse(node) {
        result.push(node.value);
        for (const child of node.children) {
          traverse(child);
        }
      }
      
      traverse(startNode);
      return result;
    }

    // Helper function for post-order traversal
    function postOrderTraversal(startNode = newRoot) {
      const result = [];
      
      function traverse(node) {
        for (const child of node.children) {
          traverse(child);
        }
        result.push(node.value);
      }
      
      traverse(startNode);
      return result;
    }

    // Helper function to find path between nodes
    function findPath(fromValue, toValue) {
      const fromNode = findNode(fromValue);
      const toNode = findNode(toValue);
      
      if (!fromNode || !toNode) {
        return null;
      }
      
      // Build path from root to fromNode
      const fromPath = [];
      let current = fromNode;
      while (current) {
        fromPath.unshift(current.value);
        current = current.parent;
      }
      
      // Build path from root to toNode
      const toPath = [];
      current = toNode;
      while (current) {
        toPath.unshift(current.value);
        current = current.parent;
      }
      
      // Find common ancestor
      let commonIndex = 0;
      while (commonIndex < fromPath.length && 
             commonIndex < toPath.length && 
             fromPath[commonIndex] === toPath[commonIndex]) {
        commonIndex++;
      }
      
      // Build path: fromNode up to common ancestor, then down to toNode
      const path = [];
      // Add fromNode up to (but not including) common ancestor
      for (let i = fromPath.length - 1; i >= commonIndex; i--) {
        path.push(fromPath[i]);
      }
      // Add common ancestor to toNode path
      for (let i = commonIndex - 1; i < toPath.length; i++) {
        path.push(toPath[i]);
      }
      
      return path;
    }

    // Helper function to extract subtree
    function extractSubtree(nodeValue) {
      const node = findNode(nodeValue);
      if (!node) {
        return null;
      }
      
      // Create a deep copy of the subtree
      function copyNode(originalNode, parent = null) {
        const copy = {
          value: originalNode.value,
          children: [],
          parent
        };
        
        for (const child of originalNode.children) {
          copy.children.push(copyNode(child, copy));
        }
        
        return copy;
      }
      
      const copiedRoot = copyNode(node);
      
      // Create tree factory function with the copied root
      return createTreeFromRoot(copiedRoot);
    }

    // Return the tree object with the new root
    return {
      get root() {
        return newRoot;
      },

      add(parentValue, childValue) {
        const parent = findNode(parentValue);
        if (!parent) {
          return false;
        }
        
        const child = {
          value: childValue,
          children: [],
          parent
        };
        
        parent.children.push(child);
        newNodeCount++;
        return true;
      },

      remove(value) {
        const node = findNode(value);
        if (!node) {
          return false;
        }
        
        if (node === newRoot) {
          // Clear entire tree
          newRoot.children = [];
          newNodeCount = 1;
          return true;
        }
        
        // Remove from parent's children array
        const parent = node.parent;
        const index = parent.children.indexOf(node);
        if (index !== -1) {
          parent.children.splice(index, 1);
          
          // Count removed nodes
          function countSubtreeNodes(subtreeNode) {
            let count = 1;
            for (const child of subtreeNode.children) {
              count += countSubtreeNodes(child);
            }
            return count;
          }
          
          newNodeCount -= countSubtreeNodes(node);
          return true;
        }
        
        return false;
      },

      find(value) {
        return findNode(value);
      },

      contains(value) {
        return findNode(value) !== undefined;
      },

      size() {
        return newNodeCount;
      },

      height() {
        return calculateHeight(newRoot);
      },

      isLeaf(value) {
        const node = findNode(value);
        return node ? node.children.length === 0 : false;
      },

      siblings(value) {
        const node = findNode(value);
        if (!node || !node.parent) {
          return [];
        }
        
        return node.parent.children
          .filter(child => child !== node)
          .map(child => child.value);
      },

      children(value) {
        const node = findNode(value);
        return node ? node.children.map(child => child.value) : [];
      },

      parent(value) {
        const node = findNode(value);
        return node && node.parent ? node.parent.value : null;
      },

      breadthFirstTraversal() {
        return breadthFirstTraversal(newRoot);
      },

      depthFirstTraversal() {
        return depthFirstTraversal(newRoot);
      },

      toArray() {
        return depthFirstTraversal(newRoot);
      },

      clear() {
        newRoot.children = [];
        newNodeCount = 1;
      },

      clone() {
        function copyNode(originalNode, parent = null) {
          const copy = {
            value: originalNode.value,
            children: [],
            parent
          };
          
          for (const child of originalNode.children) {
            copy.children.push(copyNode(child, copy));
          }
          
          return copy;
        }
        
        const copiedRoot = copyNode(newRoot);
        
        // Create a completely new tree with the copied structure
        return createTreeFromRoot(copiedRoot);
      },

      // Bonus traversal methods with callbacks
      traversePreOrder(callback) {
        function traverse(node) {
          callback(node.value, node);
          for (const child of node.children) {
            traverse(child);
          }
        }
        traverse(newRoot);
      },

      traversePostOrder(callback) {
        function traverse(node) {
          for (const child of node.children) {
            traverse(child);
          }
          callback(node.value, node);
        }
        traverse(newRoot);
      },

      traverseInOrder(callback) {
        // For general trees, in-order is not well-defined
        // We'll implement it as: traverse first half of children, node, second half
        function traverse(node) {
          const children = node.children;
          const midIndex = Math.floor(children.length / 2);
          
          for (let i = 0; i < midIndex; i++) {
            traverse(children[i]);
          }
          
          callback(node.value, node);
          
          for (let i = midIndex; i < children.length; i++) {
            traverse(children[i]);
          }
        }
        traverse(newRoot);
      },

      // Bonus path finding
      findPath(fromValue, toValue) {
        return findPath(fromValue, toValue);
      },

      // Bonus subtree extraction
      extractSubtree(nodeValue) {
        return extractSubtree(nodeValue);
      }
    };
  }

  // Public API
  return {
    get root() {
      return root;
    },

    add(parentValue, childValue) {
      const parent = findNode(parentValue);
      if (!parent) {
        return false;
      }
      
      const child = {
        value: childValue,
        children: [],
        parent
      };
      
      parent.children.push(child);
      nodeCount++;
      return true;
    },

    remove(value) {
      const node = findNode(value);
      if (!node) {
        return false;
      }
      
      if (node === root) {
        // Clear entire tree
        root.children = [];
        nodeCount = 1;
        return true;
      }
      
      // Remove from parent's children array
      const parent = node.parent;
      const index = parent.children.indexOf(node);
      if (index !== -1) {
        parent.children.splice(index, 1);
        
        // Count removed nodes
        function countSubtreeNodes(subtreeNode) {
          let count = 1;
          for (const child of subtreeNode.children) {
            count += countSubtreeNodes(child);
          }
          return count;
        }
        
        nodeCount -= countSubtreeNodes(node);
        return true;
      }
      
      return false;
    },

    find(value) {
      return findNode(value);
    },

    contains(value) {
      return findNode(value) !== undefined;
    },

    size() {
      return nodeCount;
    },

    height() {
      return calculateHeight(root);
    },

    isLeaf(value) {
      const node = findNode(value);
      return node ? node.children.length === 0 : false;
    },

    siblings(value) {
      const node = findNode(value);
      if (!node || !node.parent) {
        return [];
      }
      
      return node.parent.children
        .filter(child => child !== node)
        .map(child => child.value);
    },

    children(value) {
      const node = findNode(value);
      return node ? node.children.map(child => child.value) : [];
    },

    parent(value) {
      const node = findNode(value);
      return node && node.parent ? node.parent.value : null;
    },

    breadthFirstTraversal() {
      return breadthFirstTraversal(root);
    },

    depthFirstTraversal() {
      return depthFirstTraversal(root);
    },

    toArray() {
      return depthFirstTraversal(root);
    },

    clear() {
      root.children = [];
      nodeCount = 1;
    },

    clone() {
      function copyNode(originalNode, parent = null) {
        const copy = {
          value: originalNode.value,
          children: [],
          parent
        };
        
        for (const child of originalNode.children) {
          copy.children.push(copyNode(child, copy));
        }
        
        return copy;
      }
      
      const copiedRoot = copyNode(root);
      
      // Create a completely new tree with the copied structure
      return createTreeFromRoot(copiedRoot);
    },

    // Bonus traversal methods with callbacks
    traversePreOrder(callback) {
      function traverse(node) {
        callback(node.value, node);
        for (const child of node.children) {
          traverse(child);
        }
      }
      traverse(root);
    },

    traversePostOrder(callback) {
      function traverse(node) {
        for (const child of node.children) {
          traverse(child);
        }
        callback(node.value, node);
      }
      traverse(root);
    },

    traverseInOrder(callback) {
      // For general trees, in-order is not well-defined
      // We'll implement it as: traverse first half of children, node, second half
      function traverse(node) {
        const children = node.children;
        const midIndex = Math.floor(children.length / 2);
        
        for (let i = 0; i < midIndex; i++) {
          traverse(children[i]);
        }
        
        callback(node.value, node);
        
        for (let i = midIndex; i < children.length; i++) {
          traverse(children[i]);
        }
      }
      traverse(root);
    },

    // Bonus path finding
    findPath(fromValue, toValue) {
      return findPath(fromValue, toValue);
    },

    // Bonus subtree extraction
    extractSubtree(nodeValue) {
      const node = findNode(nodeValue);
      if (!node) {
        return null;
      }
      
      // Create a deep copy of the subtree
      function copyNode(originalNode, parent = null) {
        const copy = {
          value: originalNode.value,
          children: [],
          parent
        };
        
        for (const child of originalNode.children) {
          copy.children.push(copyNode(child, copy));
        }
        
        return copy;
      }
      
      const copiedRoot = copyNode(node);
      
      // Create a completely new tree with the copied subtree
      return createTreeFromRoot(copiedRoot);
    }
  };
}

module.exports = { createTree };
