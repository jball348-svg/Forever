/**
 * Tests for Hash Table data structure
 */

const { createHashTable } = require('../src/hashTable');

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function testBasicOperations() {
  console.log('Testing basic operations...');
  
  const ht = createHashTable();
  
  // Test set and get
  assert(ht.set('key1', 'value1') === true, 'Should return true for new key');
  assert(ht.set('key1', 'updated') === false, 'Should return false for existing key');
  assert(ht.get('key1') === 'updated', 'Should get updated value');
  
  // Test has
  assert(ht.has('key1') === true, 'Should have key1');
  assert(ht.has('nonexistent') === false, 'Should not have nonexistent key');
  
  // Test delete
  assert(ht.delete('key1') === true, 'Should delete existing key');
  assert(ht.delete('nonexistent') === false, 'Should not delete nonexistent key');
  assert(ht.has('key1') === false, 'Key should be deleted');
  
  // Test size
  assert(ht.size === 0, 'Size should be 0 after deletion');
  
  console.log('✓ Basic operations passed');
}

function testDifferentKeyTypes() {
  console.log('Testing different key types...');
  
  const ht = createHashTable();
  
  // String keys
  ht.set('string', 'string value');
  assert(ht.get('string') === 'string value', 'String key should work');
  
  // Number keys
  ht.set(42, 'number value');
  assert(ht.get(42) === 'number value', 'Number key should work');
  
  // Float keys
  ht.set(3.14, 'float value');
  assert(ht.get(3.14) === 'float value', 'Float key should work');
  
  // Object keys
  const obj1 = { a: 1 };
  const obj2 = { b: 2 };
  ht.set(obj1, 'object value 1');
  ht.set(obj2, 'object value 2');
  assert(ht.get(obj1) === 'object value 1', 'Object key should work');
  assert(ht.get(obj2) === 'object value 2', 'Different object key should work');
  
  // Array keys
  const arr = [1, 2, 3];
  ht.set(arr, 'array value');
  assert(ht.get(arr) === 'array value', 'Array key should work');
  
  // Boolean keys
  ht.set(true, 'true value');
  ht.set(false, 'false value');
  assert(ht.get(true) === 'true value', 'Boolean true key should work');
  assert(ht.get(false) === 'false value', 'Boolean false key should work');
  
  assert(ht.size === 8, 'Should have 8 entries');
  
  console.log('✓ Different key types passed');
}

function testCollisionHandling() {
  console.log('Testing collision handling...');
  
  // Create hash table with small size to force collisions
  const ht = createHashTable(4);
  
  // These keys should collide with a simple hash function
  const keys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const values = [1, 2, 3, 4, 5, 6, 7, 8];
  
  // Insert multiple entries
  for (let i = 0; i < keys.length; i++) {
    ht.set(keys[i], values[i]);
  }
  
  // Verify all entries are accessible
  for (let i = 0; i < keys.length; i++) {
    assert(ht.get(keys[i]) === values[i], `Key ${keys[i]} should have correct value`);
  }
  
  assert(ht.size === keys.length, 'Should have all entries');
  
  // Test deletion in collision scenario
  assert(ht.delete('c') === true, 'Should delete key in collision');
  assert(ht.get('c') === undefined, 'Deleted key should not exist');
  assert(ht.get('b') === 2, 'Other keys should still work');
  assert(ht.get('d') === 4, 'Other keys should still work');
  
  console.log('✓ Collision handling passed');
}

function testResizing() {
  console.log('Testing resizing...');
  
  const ht = createHashTable(4);
  
  // Add entries to trigger resizing
  for (let i = 0; i < 20; i++) {
    ht.set(`key${i}`, `value${i}`);
  }
  
  assert(ht.size === 20, 'Should have all entries after resizing');
  
  // Verify all entries are still accessible
  for (let i = 0; i < 20; i++) {
    assert(ht.get(`key${i}`) === `value${i}`, `Key ${i} should work after resizing`);
  }
  
  // Test manual resize
  ht.resize(8);
  assert(ht.size === 20, 'Size should remain after manual resize');
  
  for (let i = 0; i < 20; i++) {
    assert(ht.get(`key${i}`) === `value${i}`, `Key ${i} should work after manual resize`);
  }
  
  console.log('✓ Resizing passed');
}

function testIterationMethods() {
  console.log('Testing iteration methods...');
  
  const ht = createHashTable();
  const entries = [
    ['a', 1],
    ['b', 2],
    ['c', 3],
    ['d', 4]
  ];
  
  // Add entries
  for (const [key, value] of entries) {
    ht.set(key, value);
  }
  
  // Test keys()
  const keys = ht.keys();
  assert(keys.length === 4, 'Keys should return 4 items');
  assert(keys.includes('a') && keys.includes('b'), 'Keys should contain expected values');
  
  // Test values()
  const values = ht.values();
  assert(values.length === 4, 'Values should return 4 items');
  assert(values.includes(1) && values.includes(2), 'Values should contain expected values');
  
  // Test entries()
  const entryPairs = ht.entries();
  assert(entryPairs.length === 4, 'Entries should return 4 items');
  
  // Verify entries are correct
  const entryMap = new Map(entryPairs);
  assert(entryMap.get('a') === 1, 'Entry should be correct');
  assert(entryMap.get('d') === 4, 'Entry should be correct');
  
  // Test forEach
  let forEachCount = 0;
  const forEachResults = [];
  ht.forEach((value, key) => {
    forEachCount++;
    forEachResults.push([key, value]);
  });
  
  assert(forEachCount === 4, 'ForEach should iterate 4 times');
  assert(forEachResults.length === 4, 'ForEach should collect 4 results');
  
  console.log('✓ Iteration methods passed');
}

function testClearAndSize() {
  console.log('Testing clear and size...');
  
  const ht = createHashTable();
  
  // Initial state
  assert(ht.size === 0, 'Initial size should be 0');
  
  // Add entries
  ht.set('a', 1);
  ht.set('b', 2);
  assert(ht.size === 2, 'Size should be 2 after adding');
  
  // Clear
  ht.clear();
  assert(ht.size === 0, 'Size should be 0 after clear');
  assert(ht.get('a') === undefined, 'Should not get value after clear');
  assert(ht.has('b') === false, 'Should not have key after clear');
  
  console.log('✓ Clear and size passed');
}

function testEdgeCases() {
  console.log('Testing edge cases...');
  
  const ht = createHashTable();
  
  // Test undefined values
  ht.set('undefined', undefined);
  assert(ht.has('undefined') === true, 'Should have key with undefined value');
  assert(ht.get('undefined') === undefined, 'Should return undefined value');
  
  // Test null values
  ht.set('null', null);
  assert(ht.has('null') === true, 'Should have key with null value');
  assert(ht.get('null') === null, 'Should return null value');
  
  // Test empty string key
  ht.set('', 'empty string key');
  assert(ht.get('') === 'empty string key', 'Empty string key should work');
  
  // Test large numbers
  ht.set(Number.MAX_SAFE_INTEGER, 'max int');
  assert(ht.get(Number.MAX_SAFE_INTEGER) === 'max int', 'Max safe integer should work');
  
  // Test negative numbers
  ht.set(-42, 'negative');
  assert(ht.get(-42) === 'negative', 'Negative number should work');
  
  // Test forEach with invalid callback
  try {
    ht.forEach('not a function');
    assert(false, 'Should throw error for invalid callback');
  } catch (error) {
    assert(error.message.includes('function'), 'Should throw TypeError for invalid callback');
  }
  
  console.log('✓ Edge cases passed');
}

function testPerformance() {
  console.log('Testing performance with large dataset...');
  
  const ht = createHashTable();
  const startTime = Date.now();
  
  // Insert 1000 entries
  for (let i = 0; i < 1000; i++) {
    ht.set(`key${i}`, `value${i}`);
  }
  
  const insertTime = Date.now() - startTime;
  
  // Retrieve all entries
  const retrieveStart = Date.now();
  for (let i = 0; i < 1000; i++) {
    assert(ht.get(`key${i}`) === `value${i}`, `Performance test: key ${i} should work`);
  }
  const retrieveTime = Date.now() - retrieveStart;
  
  assert(ht.size === 1000, 'Should have 1000 entries');
  
  console.log(`✓ Performance test passed (${insertTime}ms insert, ${retrieveTime}ms retrieve)`);
}

function testLoadFactor() {
  console.log('Testing load factor...');
  
  const ht = createHashTable(4);
  
  // Initial load factor
  assert(ht.getLoadFactor() === 0, 'Initial load factor should be 0');
  
  // Add some entries
  ht.set('a', 1);
  ht.set('b', 2);
  
  const loadFactor = ht.getLoadFactor();
  assert(loadFactor === 0.5, 'Load factor should be 0.5 (2/4)');
  
  console.log('✓ Load factor passed');
}

function runAllTests() {
  console.log('Running Hash Table tests...\n');
  
  try {
    testBasicOperations();
    testDifferentKeyTypes();
    testCollisionHandling();
    testResizing();
    testIterationMethods();
    testClearAndSize();
    testEdgeCases();
    testPerformance();
    testLoadFactor();
    
    console.log('\n✅ All Hash Table tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testBasicOperations,
  testDifferentKeyTypes,
  testCollisionHandling,
  testResizing,
  testIterationMethods,
  testClearAndSize,
  testEdgeCases,
  testPerformance,
  testLoadFactor
};
