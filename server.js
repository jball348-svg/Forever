const express = require('express');
const path = require('path');
const forever = require('./src/index');

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to get all modules
app.get('/api/modules', (req, res) => {
  const modules = {
    'Cache & Storage': {
      description: 'Efficient caching and storage solutions for data management',
      modules: [
        {
          name: 'cache',
          description: 'Simple in-memory cache with get/set/has/delete operations',
          methods: ['set(key, value)', 'get(key)', 'has(key)', 'delete(key)'],
          useCase: 'Caching frequently accessed data to improve performance'
        },
        {
          name: 'store',
          description: 'Persistent key-value store with data persistence',
          methods: ['get(key)', 'set(key, value)', 'has(key)', 'delete(key)', 'clear()'],
          useCase: 'Storing configuration data or user preferences'
        },
        {
          name: 'kvstore',
          description: 'Advanced KV store with TTL and LRU eviction',
          methods: ['set(key, value, ttl)', 'get(key)', 'delete(key)', 'clear()'],
          useCase: 'Session management or temporary data storage'
        }
      ]
    },
    'Event Systems': {
      description: 'Powerful event-driven architecture components',
      modules: [
        {
          name: 'eventBus',
          description: 'Publish-subscribe event system for loose coupling',
          methods: ['on(event, handler)', 'off(event, handler)', 'emit(event, data)'],
          useCase: 'Decoupling components and handling application events'
        },
        {
          name: 'observable',
          description: 'Observable pattern for reactive programming',
          methods: ['subscribe(observer)', 'next(value)', 'error(err)', 'complete()'],
          useCase: 'Reactive data streams and state management'
        },
        {
          name: 'typedEmitter',
          description: 'Type-safe event emitter with TypeScript support',
          methods: ['on(event, handler)', 'emit(event, ...args)', 'once(event, handler)'],
          useCase: 'Type-safe event handling in TypeScript projects'
        }
      ]
    },
    'Data Structures': {
      description: 'Essential data structures for efficient algorithms',
      modules: [
        {
          name: 'trie',
          description: 'Prefix tree for efficient string searches',
          methods: ['insert(word)', 'search(word)', 'startsWith(prefix)', 'delete(word)', 'autocomplete(prefix)'],
          useCase: 'Autocomplete systems, prefix matching, dictionary implementations'
        },
        {
          name: 'binarySearchTree',
          description: 'Binary Search Tree with balanced operations',
          methods: ['insert(value)', 'search(value)', 'delete(value)', 'findMin()', 'findMax()', 'traverse()'],
          useCase: 'Efficient searching, sorting, and range queries'
        },
        {
          name: 'linkedList',
          description: 'Doubly linked list with efficient insertions/deletions',
          methods: ['append(value)', 'prepend(value)', 'insertAt(index, value)', 'remove(value)', 'get(index)'],
          useCase: 'Implementing queues, stacks, or when frequent insertions/deletions are needed'
        },
        {
          name: 'stack',
          description: 'LIFO stack data structure with dynamic resizing',
          methods: ['push(item)', 'pop()', 'peek()', 'isEmpty()', 'size()', 'clear()'],
          useCase: 'Expression evaluation, backtracking algorithms, function call management'
        },
        {
          name: 'dataQueue',
          description: 'FIFO queue with circular buffer implementation',
          methods: ['enqueue(item)', 'dequeue()', 'front()', 'rear()', 'isEmpty()', 'size()'],
          useCase: 'Task scheduling, message queues, breadth-first search'
        },
        {
          name: 'hashTable',
          description: 'Hash table with collision resolution',
          methods: ['set(key, value)', 'get(key)', 'has(key)', 'delete(key)', 'keys()', 'values()'],
          useCase: 'Fast key-value lookups, caching, symbol tables'
        },
        {
          name: 'tree',
          description: 'General-purpose tree structure with traversal methods',
          methods: ['addChild(node)', 'removeChild(node)', 'find(predicate)', 'traverse()', 'getPath()'],
          useCase: 'Hierarchical data, file systems, organization charts'
        }
      ]
    },
    'Function Utilities': {
      description: 'Higher-order functions for functional programming',
      modules: [
        {
          name: 'debounce',
          description: 'Delay function execution until after wait period',
          methods: ['debounce(func, wait)', 'cancel()', 'flush()'],
          useCase: 'Search input handling, button click prevention, resize events'
        },
        {
          name: 'memoize',
          description: 'Cache function results based on arguments',
          methods: ['memoize(func)', 'cache.get(key)', 'cache.clear()'],
          useCase: 'Expensive computations, pure functions, API response caching'
        },
        {
          name: 'pipeline',
          description: 'Compose functions for data transformation pipelines',
          methods: ['pipeline(...functions)', 'pipe(data)'],
          useCase: 'Data processing workflows, transformation chains'
        }
      ]
    },
    'Async & Flow Control': {
      description: 'Tools for managing asynchronous operations',
      modules: [
        {
          name: 'queue',
          description: 'Async task queue with concurrency control',
          methods: ['add(task)', 'process()', 'pause()', 'resume()'],
          useCase: 'Managing async operations, rate limiting, job processing'
        },
        {
          name: 'retry',
          description: 'Automatic retry mechanism for failed operations',
          methods: ['retry(fn, options)', 'retry.async(fn, options)'],
          useCase: 'Network requests, database operations, external API calls'
        },
        {
          name: 'stream',
          description: 'Readable/writable stream processing',
          methods: ['createReadable()', 'createWritable()', 'pipe(destination)'],
          useCase: 'File processing, data transformation, real-time data handling'
        },
        {
          name: 'semaphore',
          description: 'Concurrency limiter for resource management',
          methods: ['acquire()', 'release()', 'tryAcquire()', 'availablePermits()'],
          useCase: 'Rate limiting, resource pool management, controlling concurrent operations'
        }
      ]
    },
    'State Management': {
      description: 'State management and configuration tools',
      modules: [
        {
          name: 'stateManager',
          description: 'Simple state management with subscriptions',
          methods: ['setState(state)', 'getState()', 'subscribe(listener)'],
          useCase: 'Application state management, reactive UI updates'
        },
        {
          name: 'config',
          description: 'Configuration management with environment support',
          methods: ['get(key)', 'set(key, value)', 'has(key)', 'load()'],
          useCase: 'Application configuration, environment-specific settings'
        },
        {
          name: 'featureFlags',
          description: 'Feature flag system with rollout support',
          methods: ['isEnabled(flag)', 'enable(flag)', 'disable(flag)', 'getVariants(flag)'],
          useCase: 'A/B testing, gradual rollouts, feature toggling'
        }
      ]
    },
    'Architecture Patterns': {
      description: 'Implementation of common architectural patterns',
      modules: [
        {
          name: 'commandBus',
          description: 'Command pattern implementation for CQRS',
          methods: ['register(command, handler)', 'execute(command)', 'registerMiddleware(middleware)'],
          useCase: 'CQRS architecture, separating command handling from business logic'
        },
        {
          name: 'fsm',
          description: 'Finite State Machine for stateful logic',
          methods: ['addState(name, config)', 'transition(event)', 'getCurrentState()', 'can(event)'],
          useCase: 'Workflow management, game logic, protocol implementation'
        },
        {
          name: 'middleware',
          description: 'Middleware pattern for request processing',
          methods: ['createMiddleware()', 'use(middleware)', 'process(request)'],
          useCase: 'HTTP servers, request processing pipelines, authentication chains'
        }
      ]
    },
    'Monitoring & Observability': {
      description: 'Tools for monitoring application health and performance',
      modules: [
        {
          name: 'metrics',
          description: 'Metrics collection and reporting',
          methods: ['increment(name)', 'decrement(name)', 'timing(name, value)', 'gauge(name, value)'],
          useCase: 'Performance monitoring, business metrics, system health'
        },
        {
          name: 'health',
          description: 'Health check system for services',
          methods: ['addCheck(name, check)', 'getStatus()', 'isHealthy()'],
          useCase: 'Service health monitoring, load balancer health checks'
        },
        {
          name: 'performance',
          description: 'Performance monitoring and profiling',
          methods: ['mark(name)', 'measure(name, start, end)', 'getEntries()'],
          useCase: 'Performance profiling, bottleneck identification'
        }
      ]
    },
    'Resilience & Reliability': {
      description: 'Patterns for building resilient applications',
      modules: [
        {
          name: 'circuitBreaker',
          description: 'Circuit breaker pattern for fault tolerance',
          methods: ['execute(fn)', 'open()', 'close()', 'getState()'],
          useCase: 'Preventing cascade failures, external service protection'
        },
        {
          name: 'rateLimiter',
          description: 'Rate limiting with multiple algorithms',
          methods: ['limit(key)', 'isAllowed(key)', 'getRemainingTokens(key)'],
          useCase: 'API rate limiting, preventing abuse, resource protection'
        },
        {
          name: 'undoHistory',
          description: 'Undo/redo functionality for actions',
          methods: ['execute(action)', 'undo()', 'redo()', 'canUndo()', 'canRedo()'],
          useCase: 'Editor applications, form handling, game moves'
        }
      ]
    },
    'Utilities & Helpers': {
      description: 'General utility functions and helpers',
      modules: [
        {
          name: 'utils',
          description: 'Common utility functions',
          methods: ['capitalize(str)', 'isEmpty(value)', 'sleep(ms)'],
          useCase: 'String manipulation, validation, async utilities'
        },
        {
          name: 'logger',
          description: 'Simple logging utility',
          methods: ['log(message)', 'error(message)', 'warn(message)', 'info(message)'],
          useCase: 'Application logging, debugging, audit trails'
        },
        {
          name: 'validator',
          description: 'Data validation utilities',
          methods: ['validate(data, schema)', 'isEmail(email)', 'isURL(url)', 'isRequired(value)'],
          useCase: 'Form validation, API input validation, data integrity'
        }
      ]
    }
  };

  res.json(modules);
});

// API endpoint to get module examples
app.get('/api/examples/:module', (req, res) => {
  const examples = {
    cache: `// Basic cache usage
const { cache } = require('forever');

// Set values
cache.set('user:1', { name: 'John', age: 30 });
cache.set('config', { theme: 'dark' });

// Get values
const user = cache.get('user:1');
const hasConfig = cache.has('config');

// Delete values
cache.delete('user:1');`,

    eventBus: `// Event bus usage
const { eventBus } = require('forever');

// Listen for events
eventBus.on('user:login', (user) => {
  console.log(\`User \${user.name} logged in\`);
});

// Emit events
eventBus.emit('user:login', { name: 'John', id: 1 });

// Stop listening
eventBus.off('user:login', handler);`,

    trie: `// Trie usage for autocomplete
const { trie } = require('forever');
const dictionary = trie();

// Insert words
dictionary.insert('apple');
dictionary.insert('application');
dictionary.insert('apply');

// Search
console.log(dictionary.search('apple')); // true
console.log(dictionary.startsWith('app')); // true

// Autocomplete
console.log(dictionary.autocomplete('app')); 
// ['apple', 'application', 'apply']`,

    debounce: `// Debounce for search input
const { debounce } = require('forever');

const searchAPI = (query) => {
  console.log('Searching for:', query);
};

const debouncedSearch = debounce(searchAPI, 300);

// This will only trigger once after 300ms
debouncedSearch('a');
debouncedSearch('ap');
debouncedSearch('app');`,

    retry: `// Retry mechanism for API calls
const { retry } = require('forever');

const fetchUserData = async (userId) => {
  const response = await fetch(\`/api/users/\${userId}\`);
  if (!response.ok) throw new Error('API failed');
  return response.json();
};

// Retry up to 3 times with exponential backoff
const user = await retry(fetchUserData, {
  retries: 3,
  delay: 1000,
  backoff: 'exponential'
})(1);`,

    circuitBreaker: `// Circuit breaker for external service
const { circuitBreaker } = require('forever');

const breaker = circuitBreaker(
  async () => {
    const response = await fetch('https://api.external.com/data');
    return response.json();
  },
  {
    threshold: 5,      // Open after 5 failures
    timeout: 60000,    // Stay open for 1 minute
    reset: 10000       // Try to close after 10 seconds
  }
);

try {
  const data = await breaker.execute();
  console.log(data);
} catch (error) {
  console.log('Service unavailable:', error.message);
}`
  };

  const example = examples[req.params.module];
  if (example) {
    res.json({ example });
  } else {
    res.status(404).json({ error: 'Example not found' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Forever dev server running at http://localhost:${PORT}`);
});
