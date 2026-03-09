const { createTrie } = require('../src/trie');

describe('Trie Data Structure', () => {
  let trie;

  beforeEach(() => {
    trie = createTrie();
  });

  describe('insert and search', () => {
    test('should insert and search for words successfully', () => {
      trie.insert('hello');
      trie.insert('world');
      trie.insert('help');
      
      expect(trie.search('hello')).toBe(true);
      expect(trie.search('world')).toBe(true);
      expect(trie.search('help')).toBe(true);
    });

    test('should return false for non-existent words', () => {
      trie.insert('hello');
      
      expect(trie.search('hell')).toBe(false);
      expect(trie.search('helloo')).toBe(false);
      expect(trie.search('world')).toBe(false);
    });

    test('should handle empty string', () => {
      trie.insert('');
      
      expect(trie.search('')).toBe(true);
      expect(trie.size).toBe(1);
    });

    test('should handle single character words', () => {
      trie.insert('a');
      trie.insert('b');
      
      expect(trie.search('a')).toBe(true);
      expect(trie.search('b')).toBe(true);
      expect(trie.search('c')).toBe(false);
    });

    test('should handle duplicate inserts', () => {
      trie.insert('hello');
      trie.insert('hello');
      trie.insert('hello');
      
      expect(trie.search('hello')).toBe(true);
      expect(trie.size).toBe(1);
    });
  });

  describe('startsWith', () => {
    test('should return true for existing prefixes', () => {
      trie.insert('hello');
      trie.insert('world');
      trie.insert('help');
      
      expect(trie.startsWith('hell')).toBe(true);
      expect(trie.startsWith('wor')).toBe(true);
      expect(trie.startsWith('hel')).toBe(true);
    });

    test('should return false for non-existing prefixes', () => {
      trie.insert('hello');
      
      expect(trie.startsWith('xyz')).toBe(false);
      expect(trie.startsWith('helloo')).toBe(false);
      expect(trie.startsWith('world')).toBe(false);
    });

    test('should handle empty prefix', () => {
      trie.insert('hello');
      
      expect(trie.startsWith('')).toBe(true);
    });

    test('should return false when trie is empty', () => {
      expect(trie.startsWith('any')).toBe(false);
    });
  });

  describe('delete', () => {
    test('should delete existing words', () => {
      trie.insert('hello');
      trie.insert('world');
      trie.insert('help');
      
      expect(trie.delete('hello')).toBe(true);
      expect(trie.search('hello')).toBe(false);
      expect(trie.size).toBe(2);
      
      expect(trie.delete('world')).toBe(true);
      expect(trie.search('world')).toBe(false);
      expect(trie.size).toBe(1);
    });

    test('should return false for non-existing words', () => {
      trie.insert('hello');
      
      expect(trie.delete('hell')).toBe(false);
      expect(trie.delete('world')).toBe(false);
      expect(trie.size).toBe(1);
    });

    test('should handle words with shared prefixes', () => {
      trie.insert('cat');
      trie.insert('car');
      trie.insert('card');
      
      expect(trie.delete('car')).toBe(true);
      expect(trie.search('car')).toBe(false);
      expect(trie.search('cat')).toBe(true);
      expect(trie.search('card')).toBe(true);
      expect(trie.size).toBe(2);
    });

    test('should handle deleting words that are prefixes of others', () => {
      trie.insert('car');
      trie.insert('card');
      
      expect(trie.delete('car')).toBe(true);
      expect(trie.search('car')).toBe(false);
      expect(trie.search('card')).toBe(true);
      expect(trie.size).toBe(1);
    });

    test('should handle deleting empty string', () => {
      trie.insert('');
      trie.insert('hello');
      
      expect(trie.delete('')).toBe(true);
      expect(trie.search('')).toBe(false);
      expect(trie.search('hello')).toBe(true);
      expect(trie.size).toBe(1);
    });
  });

  describe('autocomplete', () => {
    beforeEach(() => {
      trie.insert('hello');
      trie.insert('help');
      trie.insert('helmet');
      trie.insert('world');
      trie.insert('work');
      trie.insert('worker');
    });

    test('should return all words with given prefix', () => {
      const results = trie.autocomplete('hel');
      expect(results).toEqual(expect.arrayContaining(['hello', 'help', 'helmet']));
      expect(results).toHaveLength(3);
    });

    test('should return empty array for non-existing prefix', () => {
      const results = trie.autocomplete('xyz');
      expect(results).toEqual([]);
    });

    test('should respect limit parameter', () => {
      const results = trie.autocomplete('wo', 1);
      expect(results).toHaveLength(1);
      expect(results[0]).toMatch(/^wo/);
    });

    test('should return all words when prefix is empty', () => {
      const results = trie.autocomplete('');
      expect(results).toEqual(expect.arrayContaining(['hello', 'help', 'helmet', 'world', 'work', 'worker']));
      expect(results).toHaveLength(6);
    });

    test('should return empty array when trie is empty', () => {
      const emptyTrie = createTrie();
      const results = emptyTrie.autocomplete('any');
      expect(results).toEqual([]);
    });
  });

  describe('size getter', () => {
    test('should return correct size after inserts', () => {
      expect(trie.size).toBe(0);
      
      trie.insert('hello');
      expect(trie.size).toBe(1);
      
      trie.insert('world');
      expect(trie.size).toBe(2);
      
      trie.insert('hello'); // duplicate
      expect(trie.size).toBe(2);
    });

    test('should return correct size after deletes', () => {
      trie.insert('hello');
      trie.insert('world');
      trie.insert('help');
      
      expect(trie.size).toBe(3);
      
      trie.delete('hello');
      expect(trie.size).toBe(2);
      
      trie.delete('nonexistent');
      expect(trie.size).toBe(2);
    });

    test('should return correct size after clear', () => {
      trie.insert('hello');
      trie.insert('world');
      
      expect(trie.size).toBe(2);
      
      trie.clear();
      expect(trie.size).toBe(0);
    });
  });

  describe('clear', () => {
    test('should remove all words', () => {
      trie.insert('hello');
      trie.insert('world');
      trie.insert('help');
      
      expect(trie.size).toBe(3);
      
      trie.clear();
      
      expect(trie.size).toBe(0);
      expect(trie.search('hello')).toBe(false);
      expect(trie.search('world')).toBe(false);
      expect(trie.search('help')).toBe(false);
      expect(trie.toArray()).toEqual([]);
    });

    test('should work on empty trie', () => {
      expect(trie.size).toBe(0);
      
      trie.clear();
      
      expect(trie.size).toBe(0);
      expect(trie.toArray()).toEqual([]);
    });
  });

  describe('toArray', () => {
    test('should return all words in sorted order', () => {
      trie.insert('zebra');
      trie.insert('apple');
      trie.insert('banana');
      trie.insert('cherry');
      
      const results = trie.toArray();
      expect(results).toEqual(['apple', 'banana', 'cherry', 'zebra']);
    });

    test('should return empty array for empty trie', () => {
      const results = trie.toArray();
      expect(results).toEqual([]);
    });

    test('should handle words with shared prefixes', () => {
      trie.insert('cat');
      trie.insert('car');
      trie.insert('card');
      trie.insert('care');
      
      const results = trie.toArray();
      expect(results).toEqual(['car', 'card', 'care', 'cat']);
    });

    test('should include empty string if inserted', () => {
      trie.insert('');
      trie.insert('apple');
      
      const results = trie.toArray();
      expect(results).toEqual(['', 'apple']);
    });
  });

  describe('edge cases and error handling', () => {
    test('should throw error for non-string insert', () => {
      expect(() => trie.insert(123)).toThrow(TypeError);
      expect(() => trie.insert(null)).toThrow(TypeError);
      expect(() => trie.insert(undefined)).toThrow(TypeError);
      expect(() => trie.insert({})).toThrow(TypeError);
    });

    test('should handle non-string search gracefully', () => {
      trie.insert('hello');
      
      expect(trie.search(123)).toBe(false);
      expect(trie.search(null)).toBe(false);
      expect(trie.search(undefined)).toBe(false);
      expect(trie.search({})).toBe(false);
    });

    test('should handle non-string startsWith gracefully', () => {
      trie.insert('hello');
      
      expect(trie.startsWith(123)).toBe(false);
      expect(trie.startsWith(null)).toBe(false);
      expect(trie.startsWith(undefined)).toBe(false);
      expect(trie.startsWith({})).toBe(false);
    });

    test('should handle non-string delete gracefully', () => {
      trie.insert('hello');
      
      expect(trie.delete(123)).toBe(false);
      expect(trie.delete(null)).toBe(false);
      expect(trie.delete(undefined)).toBe(false);
      expect(trie.delete({})).toBe(false);
    });

    test('should handle non-string autocomplete gracefully', () => {
      trie.insert('hello');
      
      expect(trie.autocomplete(123)).toEqual([]);
      expect(trie.autocomplete(null)).toEqual([]);
      expect(trie.autocomplete(undefined)).toEqual([]);
      expect(trie.autocomplete({})).toEqual([]);
    });
  });

  describe('complex scenarios', () => {
    test('should handle large number of words', () => {
      const words = [];
      for (let i = 0; i < 1000; i++) {
        const word = `word${i}`;
        words.push(word);
        trie.insert(word);
      }
      
      expect(trie.size).toBe(1000);
      
      const allWords = trie.toArray();
      expect(allWords).toHaveLength(1000);
      expect(allWords).toEqual(expect.arrayContaining(words));
    });

    test('should handle words with special characters', () => {
      trie.insert('hello-world');
      trie.insert('test_case');
      trie.insert('user@email.com');
      
      expect(trie.search('hello-world')).toBe(true);
      expect(trie.search('test_case')).toBe(true);
      expect(trie.search('user@email.com')).toBe(true);
      
      expect(trie.startsWith('hello-')).toBe(true);
      expect(trie.startsWith('test_')).toBe(true);
      expect(trie.startsWith('user@')).toBe(true);
    });

    test('should maintain performance with deep nesting', () => {
      const longWord = 'a'.repeat(1000);
      trie.insert(longWord);
      
      expect(trie.search(longWord)).toBe(true);
      expect(trie.startsWith('a'.repeat(500))).toBe(true);
      expect(trie.autocomplete('a'.repeat(500))).toEqual([longWord]);
    });
  });
});
