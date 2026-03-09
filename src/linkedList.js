/**
 * Doubly Linked List data structure implementation
 */

function createLinkedList() {
  let head = null;
  let tail = null;
  let count = 0;

  function createNode(value) {
    return {
      value,
      next: null,
      prev: null
    };
  }

  function getNodeAt(index) {
    if (index < 0 || index >= count) {
      return null;
    }

    let current;
    if (index < count / 2) {
      // Start from head for better performance
      current = head;
      for (let i = 0; i < index; i++) {
        current = current.next;
      }
    } else {
      // Start from tail for better performance
      current = tail;
      for (let i = count - 1; i > index; i--) {
        current = current.prev;
      }
    }
    return current;
  }

  function append(value) {
    const newNode = createNode(value);
    
    if (tail === null) {
      // Empty list
      head = newNode;
      tail = newNode;
    } else {
      tail.next = newNode;
      newNode.prev = tail;
      tail = newNode;
    }
    
    count++;
  }

  function prepend(value) {
    const newNode = createNode(value);
    
    if (head === null) {
      // Empty list
      head = newNode;
      tail = newNode;
    } else {
      head.prev = newNode;
      newNode.next = head;
      head = newNode;
    }
    
    count++;
  }

  function insertAt(index, value) {
    if (index < 0 || index > count) {
      return false;
    }

    if (index === 0) {
      prepend(value);
      return true;
    }

    if (index === count) {
      append(value);
      return true;
    }

    const newNode = createNode(value);
    const current = getNodeAt(index);

    newNode.prev = current.prev;
    newNode.next = current;
    current.prev.next = newNode;
    current.prev = newNode;

    count++;
    return true;
  }

  function remove(value) {
    let current = head;
    
    while (current !== null) {
      if (current.value === value) {
        if (current === head) {
          head = current.next;
          if (head !== null) {
            head.prev = null;
          } else {
            tail = null; // List is now empty
          }
        } else if (current === tail) {
          tail = current.prev;
          tail.next = null;
        } else {
          current.prev.next = current.next;
          current.next.prev = current.prev;
        }
        
        count--;
        return true;
      }
      current = current.next;
    }
    
    return false;
  }

  function removeAt(index) {
    if (index < 0 || index >= count) {
      return null;
    }

    const current = getNodeAt(index);
    const value = current.value;

    if (current === head) {
      head = current.next;
      if (head !== null) {
        head.prev = null;
      } else {
        tail = null; // List is now empty
      }
    } else if (current === tail) {
      tail = current.prev;
      tail.next = null;
    } else {
      current.prev.next = current.next;
      current.next.prev = current.prev;
    }

    count--;
    return value;
  }

  function get(index) {
    const node = getNodeAt(index);
    return node ? node.value : null;
  }

  function indexOf(value) {
    let current = head;
    let index = 0;
    
    while (current !== null) {
      if (current.value === value) {
        return index;
      }
      current = current.next;
      index++;
    }
    
    return -1;
  }

  function contains(value) {
    return indexOf(value) !== -1;
  }

  function toArray() {
    const result = [];
    let current = head;
    
    while (current !== null) {
      result.push(current.value);
      current = current.next;
    }
    
    return result;
  }

  function fromArray(array) {
    if (!Array.isArray(array)) {
      throw new TypeError('Expected array');
    }
    
    clear();
    
    for (const value of array) {
      append(value);
    }
  }

  function isEmpty() {
    return count === 0;
  }

  function clear() {
    head = null;
    tail = null;
    count = 0;
  }

  function reverse() {
    if (count <= 1) {
      return;
    }

    let current = head;
    while (current !== null) {
      // Swap next and prev
      const temp = current.next;
      current.next = current.prev;
      current.prev = temp;
      
      current = temp; // Move to next node (which was prev before swap)
    }

    // Swap head and tail
    const temp = head;
    head = tail;
    tail = temp;
  }

  function forEach(callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }

    let current = head;
    let index = 0;
    
    while (current !== null) {
      callback(current.value, index);
      current = current.next;
      index++;
    }
  }

  function map(callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }

    const result = [];
    let current = head;
    let index = 0;
    
    while (current !== null) {
      result.push(callback(current.value, index));
      current = current.next;
      index++;
    }
    
    return result;
  }

  function filter(callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }

    const result = [];
    let current = head;
    let index = 0;
    
    while (current !== null) {
      if (callback(current.value, index)) {
        result.push(current.value);
      }
      current = current.next;
      index++;
    }
    
    return result;
  }

  return {
    append,
    prepend,
    insertAt,
    remove,
    removeAt,
    get,
    indexOf,
    contains,
    toArray,
    fromArray,
    get size() {
      return count;
    },
    isEmpty,
    clear,
    reverse,
    forEach,
    map,
    filter
  };
}

module.exports = { createLinkedList };
