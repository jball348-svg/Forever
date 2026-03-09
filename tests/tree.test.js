/**
 * Tests for Tree data structure
 */

const { createTree } = require('../src/tree');

function runTests() {
  let passed = 0;
  let failed = 0;

  function test(description, testFn) {
    try {
      testFn();
      console.log(`✓ ${description}`);
      passed++;
    } catch (error) {
      console.log(`✗ ${description}`);
      console.log(`  Error: ${error.message}`);
      failed++;
    }
  }

  function assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  function assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  function assertDeepEqual(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  }

  // Test 1: Basic tree creation
  test('createTree should create a tree with root', () => {
    const tree = createTree('root');
    assertEqual(tree.root.value, 'root');
    assertEqual(tree.size(), 1);
    assertEqual(tree.height(), 0);
    assert(tree.isLeaf('root'));
  });

  // Test 2: Add nodes
  test('add should add child nodes to parent', () => {
    const tree = createTree('root');
    assert(tree.add('root', 'child1'));
    assert(tree.add('root', 'child2'));
    assertEqual(tree.size(), 3);
    assertDeepEqual(tree.children('root'), ['child1', 'child2']);
    assert(!tree.isLeaf('root'));
    assert(tree.isLeaf('child1'));
    assert(tree.isLeaf('child2'));
  });

  // Test 3: Add to non-existent parent
  test('add should return false for non-existent parent', () => {
    const tree = createTree('root');
    assert(!tree.add('nonexistent', 'child'));
    assertEqual(tree.size(), 1);
  });

  // Test 4: Find nodes
  test('find should locate nodes in tree', () => {
    const tree = createTree('root');
    tree.add('root', 'child1');
    tree.add('root', 'child2');
    tree.add('child1', 'grandchild1');
    
    const found = tree.find('grandchild1');
    assert(found);
    assertEqual(found.value, 'grandchild1');
    assertEqual(found.parent.value, 'child1');
    
    assert(!tree.find('nonexistent'));
  });

  // Test 5: Contains method
  test('contains should check if value exists in tree', () => {
    const tree = createTree('root');
    tree.add('root', 'child1');
    tree.add('child1', 'grandchild1');
    
    assert(tree.contains('root'));
    assert(tree.contains('child1'));
    assert(tree.contains('grandchild1'));
    assert(!tree.contains('nonexistent'));
  });

  // Test 6: Parent relationship
  test('parent should return parent value or null', () => {
    const tree = createTree('root');
    tree.add('root', 'child1');
    tree.add('child1', 'grandchild1');
    
    assertEqual(tree.parent('child1'), 'root');
    assertEqual(tree.parent('grandchild1'), 'child1');
    assertEqual(tree.parent('root'), null);
    assertEqual(tree.parent('nonexistent'), null);
  });

  // Test 7: Siblings
  test('siblings should return sibling values', () => {
    const tree = createTree('root');
    tree.add('root', 'child1');
    tree.add('root', 'child2');
    tree.add('root', 'child3');
    tree.add('child1', 'grandchild1');
    
    assertDeepEqual(tree.siblings('child1'), ['child2', 'child3']);
    assertDeepEqual(tree.siblings('child2'), ['child1', 'child3']);
    assertDeepEqual(tree.siblings('grandchild1'), []);
    assertDeepEqual(tree.siblings('root'), []);
    assertDeepEqual(tree.siblings('nonexistent'), []);
  });

  // Test 8: Tree height calculation
  test('height should calculate tree height correctly', () => {
    const tree = createTree('root');
    assertEqual(tree.height(), 0);
    
    tree.add('root', 'child1');
    assertEqual(tree.height(), 1);
    
    tree.add('child1', 'grandchild1');
    assertEqual(tree.height(), 2);
    
    tree.add('root', 'child2');
    assertEqual(tree.height(), 2);
    
    tree.add('grandchild1', 'greatgrandchild1');
    assertEqual(tree.height(), 3);
  });

  // Test 9: Traversal methods
  test('traversal methods should return correct order', () => {
    const tree = createTree('root');
    tree.add('root', 'child1');
    tree.add('root', 'child2');
    tree.add('child1', 'grandchild1');
    tree.add('child1', 'grandchild2');
    tree.add('child2', 'grandchild3');
    
    // Breadth-first: root, child1, child2, grandchild1, grandchild2, grandchild3
    const bfs = tree.breadthFirstTraversal();
    assertDeepEqual(bfs, ['root', 'child1', 'child2', 'grandchild1', 'grandchild2', 'grandchild3']);
    
    // Depth-first (pre-order): root, child1, grandchild1, grandchild2, child2, grandchild3
    const dfs = tree.depthFirstTraversal();
    assertDeepEqual(dfs, ['root', 'child1', 'grandchild1', 'grandchild2', 'child2', 'grandchild3']);
    
    // toArray should be same as depth-first
    assertDeepEqual(tree.toArray(), dfs);
  });

  // Test 10: Remove nodes
  test('remove should remove node and all descendants', () => {
    const tree = createTree('root');
    tree.add('root', 'child1');
    tree.add('root', 'child2');
    tree.add('child1', 'grandchild1');
    tree.add('child1', 'grandchild2');
    tree.add('grandchild1', 'greatgrandchild1');
    
    const initialSize = tree.size();
    assert(tree.remove('child1'));
    assertEqual(tree.size(), initialSize - 4); // child1 + 2 grandchildren + 1 great-grandchild
    assert(!tree.contains('child1'));
    assert(!tree.contains('grandchild1'));
    assert(!tree.contains('grandchild2'));
    assert(!tree.contains('greatgrandchild1'));
    assert(tree.contains('child2'));
    assertDeepEqual(tree.children('root'), ['child2']);
  });

  // Test 11: Remove non-existent node
  test('remove should return false for non-existent node', () => {
    const tree = createTree('root');
    tree.add('root', 'child1');
    
    assert(!tree.remove('nonexistent'));
    assertEqual(tree.size(), 2);
  });

  // Test 12: Remove root node
  test('remove root should clear tree except root', () => {
    const tree = createTree('root');
    tree.add('root', 'child1');
    tree.add('root', 'child2');
    tree.add('child1', 'grandchild1');
    
    assert(tree.remove('root'));
    assertEqual(tree.size(), 1);
    assert(tree.contains('root'));
    assert(!tree.contains('child1'));
    assert(!tree.contains('child2'));
    assertDeepEqual(tree.children('root'), []);
  });

  // Test 13: Clear tree
  test('clear should remove all nodes except root', () => {
    const tree = createTree('root');
    tree.add('root', 'child1');
    tree.add('root', 'child2');
    tree.add('child1', 'grandchild1');
    
    tree.clear();
    assertEqual(tree.size(), 1);
    assert(tree.contains('root'));
    assert(!tree.contains('child1'));
    assertDeepEqual(tree.children('root'), []);
  });

  // Test 14: Clone tree
  test('clone should create deep copy of tree', () => {
    const tree = createTree('root');
    tree.add('root', 'child1');
    tree.add('root', 'child2');
    tree.add('child1', 'grandchild1');
    
    const clone = tree.clone();
    assertEqual(clone.size(), tree.size());
    assertEqual(clone.height(), tree.height());
    assertDeepEqual(clone.toArray(), tree.toArray());
    
    // Modify original and verify clone is unchanged
    tree.add('child2', 'grandchild2');
    assertEqual(clone.size(), tree.size() - 1);
    assert(!clone.contains('grandchild2'));
  });

  // Test 15: Empty tree edge cases
  test('empty tree should handle edge cases', () => {
    const tree = createTree('root');
    
    assertEqual(tree.parent('nonexistent'), null);
    assertDeepEqual(tree.siblings('nonexistent'), []);
    assertDeepEqual(tree.children('nonexistent'), []);
    assert(!tree.isLeaf('nonexistent'));
    assertEqual(tree.find('nonexistent'), undefined);
    assert(!tree.remove('nonexistent'));
  });

  // Test 16: Single node tree
  test('single node tree should work correctly', () => {
    const tree = createTree('root');
    
    assertEqual(tree.size(), 1);
    assertEqual(tree.height(), 0);
    assert(tree.isLeaf('root'));
    assertDeepEqual(tree.children('root'), []);
    assertDeepEqual(tree.siblings('root'), []);
    assertEqual(tree.parent('root'), null);
    assertDeepEqual(tree.toArray(), ['root']);
    assertDeepEqual(tree.breadthFirstTraversal(), ['root']);
    assertDeepEqual(tree.depthFirstTraversal(), ['root']);
  });

  // Test 17: Complex tree structure
  test('complex tree structure should work correctly', () => {
    const tree = createTree('A');
    tree.add('A', 'B');
    tree.add('A', 'C');
    tree.add('B', 'D');
    tree.add('B', 'E');
    tree.add('C', 'F');
    tree.add('C', 'G');
    tree.add('D', 'H');
    tree.add('E', 'I');
    tree.add('E', 'J');
    
    assertEqual(tree.size(), 10);
    assertEqual(tree.height(), 3);
    
    // Test various relationships
    assertDeepEqual(tree.children('B'), ['D', 'E']);
    assertDeepEqual(tree.siblings('C'), ['B']);
    assertEqual(tree.parent('H'), 'D');
    assert(tree.isLeaf('F'));
    assert(!tree.isLeaf('B'));
    
    // Test traversals
    const dfs = ['A', 'B', 'D', 'H', 'E', 'I', 'J', 'C', 'F', 'G'];
    const bfs = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    
    assertDeepEqual(tree.depthFirstTraversal(), dfs);
    assertDeepEqual(tree.breadthFirstTraversal(), bfs);
  });

  // Test 18: Traversal with callbacks
  test('traversal with callbacks should work correctly', () => {
    const tree = createTree('root');
    tree.add('root', 'child1');
    tree.add('root', 'child2');
    tree.add('child1', 'grandchild1');
    
    const preOrderValues = [];
    tree.traversePreOrder((value) => preOrderValues.push(value));
    assertDeepEqual(preOrderValues, ['root', 'child1', 'grandchild1', 'child2']);
    
    const postOrderValues = [];
    tree.traversePostOrder((value) => postOrderValues.push(value));
    assertDeepEqual(postOrderValues, ['grandchild1', 'child1', 'child2', 'root']);
  });

  // Test 19: Path finding
  test('findPath should find correct path between nodes', () => {
    const tree = createTree('A');
    tree.add('A', 'B');
    tree.add('A', 'C');
    tree.add('B', 'D');
    tree.add('C', 'E');
    
    // Path from D to E: D -> B -> A -> C -> E
    const path = tree.findPath('D', 'E');
    assertDeepEqual(path, ['D', 'B', 'A', 'C', 'E']);
    
    // Path from root to leaf
    const rootToLeaf = tree.findPath('A', 'D');
    assertDeepEqual(rootToLeaf, ['A', 'B', 'D']);
    
    // Path to non-existent node
    assertEqual(tree.findPath('A', 'nonexistent'), null);
    assertEqual(tree.findPath('nonexistent', 'A'), null);
  });

  // Test 20: Subtree extraction
  test('extractSubtree should create subtree from node', () => {
    const tree = createTree('A');
    tree.add('A', 'B');
    tree.add('A', 'C');
    tree.add('B', 'D');
    tree.add('B', 'E');
    tree.add('C', 'F');
    
    const subtree = tree.extractSubtree('B');
    assert(subtree);
    assertEqual(subtree.root.value, 'B');
    assertEqual(subtree.size(), 3); // B, D, E
    assertDeepEqual(subtree.toArray(), ['B', 'D', 'E']);
    assert(subtree.contains('D'));
    assert(subtree.contains('E'));
    assert(!subtree.contains('A'));
    assert(!subtree.contains('C'));
    
    // Non-existent node
    assertEqual(tree.extractSubtree('nonexistent'), null);
  });

  console.log(`\nTree Tests: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
