/**
 * Stack data structure implementation
 */

function createStack() {
  let items = [];

  function push(item) {
    items.push(item);
  }

  function pop() {
    if (items.length === 0) {
      return null;
    }
    return items.pop();
  }

  function peek() {
    if (items.length === 0) {
      return null;
    }
    return items[items.length - 1];
  }

  function isEmpty() {
    return items.length === 0;
  }

  function clear() {
    items = [];
  }

  function toArray() {
    // Return copy in top-to-bottom order
    return [...items].reverse();
  }

  function fromArray(array) {
    if (!Array.isArray(array)) {
      throw new TypeError('Expected array');
    }
    
    clear();
    // First element becomes bottom, last becomes top
    for (const item of array) {
      items.push(item);
    }
  }

  function contains(item) {
    return items.includes(item);
  }

  function forEach(callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }

    // Iterate from top to bottom
    for (let i = items.length - 1; i >= 0; i--) {
      callback(items[i], items.length - 1 - i);
    }
  }

  function map(callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }

    const result = [];
    // Map from top to bottom
    for (let i = items.length - 1; i >= 0; i--) {
      result.push(callback(items[i], items.length - 1 - i));
    }
    return result;
  }

  function clone() {
    const newStack = createStack();
    newStack.fromArray(items);
    return newStack;
  }

  return {
    push,
    pop,
    peek,
    isEmpty,
    get size() {
      return items.length;
    },
    clear,
    toArray,
    fromArray,
    contains,
    forEach,
    map,
    clone
  };
}

module.exports = { createStack };
