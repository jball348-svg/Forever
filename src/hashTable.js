/**
 * Hash Table data structure implementation using separate chaining
 */

function createHashTable(initialSize = 16) {
  let buckets = new Array(initialSize);
  let count = 0;
  const loadFactorThreshold = 0.75;

  // Simple hash function for different key types
  function hash(key) {
    if (typeof key === 'string') {
      let hashValue = 0;
      for (let i = 0; i < key.length; i++) {
        const char = key.charCodeAt(i);
        hashValue = ((hashValue << 5) - hashValue) + char;
        hashValue = hashValue & hashValue; // Convert to 32-bit integer
      }
      return Math.abs(hashValue);
    } else if (typeof key === 'number') {
      // Handle integers and floats
      if (Number.isInteger(key)) {
        return Math.abs(key);
      } else {
        // Convert float to string representation
        return hash(key.toString());
      }
    } else if (typeof key === 'object' && key !== null) {
      // For objects, use a simple object hash
      // Note: This is basic and may have collisions
      let hashValue = 0;
      const str = JSON.stringify(key);
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hashValue = ((hashValue << 5) - hashValue) + char;
        hashValue = hashValue & hashValue;
      }
      return Math.abs(hashValue);
    } else {
      // For other types (boolean, undefined, symbol, function)
      return hash(String(key));
    }
  }

  function getBucketIndex(key) {
    const hashValue = hash(key);
    return hashValue % buckets.length;
  }

  // Linked list node for separate chaining
  function createNode(key, value) {
    return {
      key,
      value,
      next: null
    };
  }

  function findNode(bucketIndex, key) {
    let current = buckets[bucketIndex] || null;
    while (current !== null) {
      if (keysEqual(current.key, key)) {
        return current;
      }
      current = current.next;
    }
    return null;
  }

  function keysEqual(key1, key2) {
    // Handle primitive types with strict equality
    if (key1 === key2) {
      return true;
    }
    
    // Handle objects and arrays with deep comparison
    if (typeof key1 === 'object' && typeof key2 === 'object' && 
        key1 !== null && key2 !== null) {
      try {
        return JSON.stringify(key1) === JSON.stringify(key2);
      } catch {
        return false;
      }
    }
    
    return false;
  }

  function set(key, value) {
    const bucketIndex = getBucketIndex(key);
    const existingNode = findNode(bucketIndex, key);

    if (existingNode !== null) {
      // Update existing key
      existingNode.value = value;
      return false;
    } else {
      // Add new key
      const newNode = createNode(key, value);
      newNode.next = buckets[bucketIndex] || null;
      buckets[bucketIndex] = newNode;
      count++;

      // Check load factor and resize if needed
      if (count / buckets.length > loadFactorThreshold) {
        resize(buckets.length * 2);
      }

      return true;
    }
  }

  function get(key) {
    const bucketIndex = getBucketIndex(key);
    const node = findNode(bucketIndex, key);
    return node ? node.value : undefined;
  }

  function has(key) {
    const bucketIndex = getBucketIndex(key);
    return findNode(bucketIndex, key) !== null;
  }

  function deleteKey(key) {
    const bucketIndex = getBucketIndex(key);
    let current = buckets[bucketIndex] || null;
    let prev = null;

    while (current !== null) {
      if (keysEqual(current.key, key)) {
        if (prev === null) {
          // Node is at the head of the list
          buckets[bucketIndex] = current.next;
        } else {
          prev.next = current.next;
        }
        count--;
        return true;
      }
      prev = current;
      current = current.next;
    }

    return false;
  }

  function clear() {
    buckets = new Array(initialSize);
    count = 0;
  }

  function keys() {
    const result = [];
    for (let i = 0; i < buckets.length; i++) {
      let current = buckets[i] || null;
      while (current !== null) {
        result.push(current.key);
        current = current.next;
      }
    }
    return result;
  }

  function values() {
    const result = [];
    for (let i = 0; i < buckets.length; i++) {
      let current = buckets[i] || null;
      while (current !== null) {
        result.push(current.value);
        current = current.next;
      }
    }
    return result;
  }

  function entries() {
    const result = [];
    for (let i = 0; i < buckets.length; i++) {
      let current = buckets[i] || null;
      while (current !== null) {
        result.push([current.key, current.value]);
        current = current.next;
      }
    }
    return result;
  }

  function forEach(callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }

    for (let i = 0; i < buckets.length; i++) {
      let current = buckets[i] || null;
      while (current !== null) {
        callback(current.value, current.key, { get, set, has, delete: deleteKey, clear });
        current = current.next;
      }
    }
  }

  function resize(newSize) {
    if (newSize < 1) {
      throw new Error('Size must be at least 1');
    }

    const oldBuckets = buckets;
    const oldCount = count;

    // Create new buckets
    buckets = new Array(newSize);
    count = 0;

    // Rehash all existing entries
    for (let i = 0; i < oldBuckets.length; i++) {
      let current = oldBuckets[i] || null;
      while (current !== null) {
        set(current.key, current.value);
        current = current.next;
      }
    }

    // Ensure count is correct
    count = oldCount;
  }

  function getLoadFactor() {
    return count / buckets.length;
  }

  return {
    set,
    get,
    has,
    delete: deleteKey,
    clear,
    get size() {
      return count;
    },
    keys,
    values,
    entries,
    forEach,
    resize,
    getLoadFactor
  };
}

module.exports = { createHashTable };
