/**
 * Trie (prefix tree) data structure implementation
 */

function createTrie() {
  const root = {
    children: new Map(),
    isEnd: false
  };
  
  let wordCount = 0;

  function insert(word) {
    if (typeof word !== 'string') {
      throw new TypeError('Word must be a string');
    }
    
    let node = root;
    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, {
          children: new Map(),
          isEnd: false
        });
      }
      node = node.children.get(char);
    }
    
    if (!node.isEnd) {
      node.isEnd = true;
      wordCount++;
    }
  }

  function search(word) {
    if (typeof word !== 'string') {
      return false;
    }
    
    let node = root;
    for (const char of word) {
      if (!node.children.has(char)) {
        return false;
      }
      node = node.children.get(char);
    }
    return node.isEnd;
  }

  function startsWith(prefix) {
    if (typeof prefix !== 'string') {
      return false;
    }
    
    let node = root;
    for (const char of prefix) {
      if (!node.children.has(char)) {
        return false;
      }
      node = node.children.get(char);
    }
    return true;
  }

  function deleteWord(word) {
    if (typeof word !== 'string') {
      return false;
    }
    
    function deleteHelper(node, wordToDelete, index) {
      if (index === wordToDelete.length) {
        if (!node.isEnd) {
          return false;
        }
        node.isEnd = false;
        wordCount--;
        
        // If node has no children, it can be deleted
        return node.children.size === 0;
      }
      
      const char = wordToDelete[index];
      const childNode = node.children.get(char);
      
      if (!childNode) {
        return false;
      }
      
      const shouldDeleteChild = deleteHelper(childNode, wordToDelete, index + 1);
      
      if (shouldDeleteChild) {
        node.children.delete(char);
        
        // Delete node if it's not end of another word and has no children
        return !node.isEnd && node.children.size === 0;
      }
      
      return false;
    }
    
    return deleteHelper(root, word, 0);
  }

  function autocomplete(prefix, limit) {
    if (typeof prefix !== 'string') {
      return [];
    }
    
    let node = root;
    for (const char of prefix) {
      if (!node.children.has(char)) {
        return [];
      }
      node = node.children.get(char);
    }
    
    const results = [];
    
    function dfs(currentNode, currentWord) {
      if (results.length >= limit) {
        return;
      }
      
      if (currentNode.isEnd) {
        results.push(currentWord);
      }
      
      for (const [char, childNode] of currentNode.children) {
        dfs(childNode, currentWord + char);
      }
    }
    
    dfs(node, prefix);
    
    return limit ? results.slice(0, limit) : results;
  }

  function clear() {
    root.children.clear();
    root.isEnd = false;
    wordCount = 0;
  }

  function toArray() {
    const results = [];
    
    function dfs(node, currentWord) {
      if (node.isEnd) {
        results.push(currentWord);
      }
      
      for (const [char, childNode] of node.children) {
        dfs(childNode, currentWord + char);
      }
    }
    
    dfs(root, '');
    return results.sort();
  }

  return {
    insert,
    search,
    startsWith,
    delete: deleteWord,
    autocomplete,
    get size() {
      return wordCount;
    },
    clear,
    toArray
  };
}

module.exports = { createTrie };
