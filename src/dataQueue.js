/**
 * Queue data structure implementation using circular buffer
 */

function createQueue() {
  let buffer = new Array(16); // Initial capacity
  let head = 0;
  let tail = 0;
  let count = 0;

  function resize(newCapacity) {
    const newBuffer = new Array(newCapacity);
    
    // Copy elements from head to tail in order
    for (let i = 0; i < count; i++) {
      const index = (head + i) % buffer.length;
      newBuffer[i] = buffer[index];
    }
    
    buffer = newBuffer;
    head = 0;
    tail = count;
  }

  function ensureCapacity() {
    if (count === buffer.length) {
      resize(buffer.length * 2);
    }
  }

  function shrinkIfNeeded() {
    if (buffer.length > 16 && count < buffer.length / 4) {
      resize(Math.max(16, buffer.length / 2));
    }
  }

  function enqueue(item) {
    ensureCapacity();
    buffer[tail] = item;
    tail = (tail + 1) % buffer.length;
    count++;
  }

  function dequeue() {
    if (count === 0) {
      return null;
    }

    const item = buffer[head];
    buffer[head] = undefined; // Clear reference
    head = (head + 1) % buffer.length;
    count--;

    shrinkIfNeeded();
    return item;
  }

  function front() {
    if (count === 0) {
      return null;
    }
    return buffer[head];
  }

  function rear() {
    if (count === 0) {
      return null;
    }
    const rearIndex = (tail - 1 + buffer.length) % buffer.length;
    return buffer[rearIndex];
  }

  function isEmpty() {
    return count === 0;
  }

  function clear() {
    buffer = new Array(16);
    head = 0;
    tail = 0;
    count = 0;
  }

  function toArray() {
    const result = new Array(count);
    for (let i = 0; i < count; i++) {
      const index = (head + i) % buffer.length;
      result[i] = buffer[index];
    }
    return result;
  }

  function fromArray(array) {
    if (!Array.isArray(array)) {
      throw new TypeError('Expected array');
    }

    clear();
    
    // Ensure capacity for all elements
    const neededCapacity = Math.max(16, array.length);
    if (neededCapacity > buffer.length) {
      buffer = new Array(neededCapacity);
    }

    for (const item of array) {
      buffer[tail] = item;
      tail = (tail + 1) % buffer.length;
      count++;
    }
  }

  function contains(item) {
    for (let i = 0; i < count; i++) {
      const index = (head + i) % buffer.length;
      if (buffer[index] === item) {
        return true;
      }
    }
    return false;
  }

  function forEach(callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }

    for (let i = 0; i < count; i++) {
      const index = (head + i) % buffer.length;
      callback(buffer[index], i);
    }
  }

  function map(callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }

    const result = new Array(count);
    for (let i = 0; i < count; i++) {
      const index = (head + i) % buffer.length;
      result[i] = callback(buffer[index], i);
    }
    return result;
  }

  function clone() {
    const newQueue = createQueue();
    newQueue.fromArray(toArray());
    return newQueue;
  }

  return {
    enqueue,
    dequeue,
    front,
    rear,
    isEmpty,
    get size() {
      return count;
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

module.exports = { createQueue };
