# Forever API Documentation

This document provides comprehensive API documentation for all modules in the Forever library.

## Table of Contents

- [Cache](#cache)
- [Store](#store)
- [Logger](#logger)
- [Event Bus](#event-bus)
- [Utils](#utils)
- [Debounce & Throttle](#debounce--throttle)
- [Memoize](#memoize)
- [Pipeline](#pipeline)
- [Decorators](#decorators)
- [Middleware](#middleware)
- [Dependency Injection](#dependency-injection)
- [Pool](#pool)
- [State Manager](#state-manager)
- [Queue](#queue)
- [Retry](#retry)
- [Stream](#stream)
- [Command Bus](#command-bus)
- [Finite State Machine](#finite-state-machine)
- [Observable](#observable)
- [Router](#router)
- [Scheduler](#scheduler)
- [Validator](#validator)
- [Config](#config)
- [Greet](#greet)

---

## Cache

TTL-based in-memory cache with automatic expiration.

### Functions

#### `set(key, value, ttlMs)`

Stores a value with a time-to-live.

**Parameters:**
- `key` (any): The cache key
- `value` (any): The value to cache
- `ttlMs` (number): Time-to-live in milliseconds

**Returns:** `void`

#### `get(key)`

Retrieves a value from the cache. Returns undefined if expired or not found.

**Parameters:**
- `key` (any): The cache key

**Returns:** `any` - The cached value or undefined

#### `has(key)`

Checks if a key exists and is not expired.

**Parameters:**
- `key` (any): The cache key

**Returns:** `boolean` - True if key exists and is valid

#### `delete(key)`

Removes a key from the cache.

**Parameters:**
- `key` (any): The cache key

**Returns:** `void`

### Usage Example

```javascript
const { cache } = require('./src');

// Store a value for 5 seconds
cache.set('user:123', { name: 'John' }, 5000);

// Retrieve the value
const user = cache.get('user:123');
console.log(user); // { name: 'John' }

// Check if key exists
console.log(cache.has('user:123')); // true

// Delete the key
cache.delete('user:123');
```

### Best Practices

- Use appropriate TTL values based on your use case
- Cache expensive operations like database queries or API calls
- Consider memory usage when caching large objects

---

## Store

Simple in-memory key-value store for persistent data storage.

### Methods

#### `set(key, value)`

Stores a value with the given key.

**Parameters:**
- `key` (any): The storage key
- `value` (any): The value to store

**Returns:** `void`

#### `get(key)`

Retrieves a value by key.

**Parameters:**
- `key` (any): The storage key

**Returns:** `any` - The stored value or undefined

#### `has(key)`

Checks if a key exists in the store.

**Parameters:**
- `key` (any): The storage key

**Returns:** `boolean` - True if key exists

#### `delete(key)`

Removes a key-value pair.

**Parameters:**
- `key` (any): The storage key

**Returns:** `boolean` - True if key was deleted

#### `clear()`

Removes all key-value pairs from the store.

**Returns:** `void`

### Usage Example

```javascript
const { store } = require('./src');

// Store values
store.set('config', { theme: 'dark' });
store.set('counter', 0);

// Retrieve values
const config = store.get('config');
console.log(config.theme); // 'dark'

// Check existence
console.log(store.has('counter')); // true

// Delete specific key
store.delete('counter');

// Clear all data
store.clear();
```

### Best Practices

- Use for application state that needs to persist in memory
- Consider using the State Manager for reactive updates
- Store is not persistent across application restarts

---

## Logger

Simple logging utility with different log levels.

### Functions

#### `log(level, message)`

Logs a message with the specified level.

**Parameters:**
- `level` ('info'|'warn'|'error'): The log level
- `message` (string): The message to log

**Returns:** `void`

### Usage Example

```javascript
const { logger } = require('./src');

logger.log('info', 'Application started');
logger.log('warn', 'Deprecated API used');
logger.log('error', 'Database connection failed');
```

### Best Practices

- Use appropriate log levels for different types of messages
- Include relevant context in log messages
- Consider using structured logging for production applications

---

## Event Bus

Minimal publish/subscribe event system for decoupled communication.

### Functions

#### `on(event, handler)`

Subscribes to an event.

**Parameters:**
- `event` (string): The event name
- `handler` (function): The event handler function

**Returns:** `void`

#### `off(event, handler)`

Unsubscribes from an event.

**Parameters:**
- `event` (string): The event name
- `handler` (function): The handler function to remove

**Returns:** `void`

#### `emit(event, data)`

Publishes an event with data.

**Parameters:**
- `event` (string): The event name
- `data` (any): The data to pass to handlers

**Returns:** `void`

### Usage Example

```javascript
const { eventBus } = require('./src');

// Subscribe to events
eventBus.on('user:login', (user) => {
  console.log(`User ${user.name} logged in`);
});

eventBus.on('data:updated', (data) => {
  console.log('Data updated:', data);
});

// Emit events
eventBus.emit('user:login', { name: 'John', id: 123 });
eventBus.emit('data:updated', { timestamp: Date.now() });
```

### Best Practices

- Use descriptive event names with colons for namespacing
- Keep event handlers lightweight
- Avoid circular dependencies between event handlers

---

## Utils

General-purpose utility functions.

### Functions

#### `capitalize(str)`

Capitalizes the first letter of a string.

**Parameters:**
- `str` (string): The string to capitalize

**Returns:** `string` - The capitalized string

#### `isEmpty(val)`

Checks if a value is empty (null, undefined, empty string, empty array, or empty object).

**Parameters:**
- `val` (any): The value to check

**Returns:** `boolean` - True if the value is empty

#### `sleep(ms)`

Returns a promise that resolves after the specified milliseconds.

**Parameters:**
- `ms` (number): Milliseconds to sleep

**Returns:** `Promise<void>`

### Usage Example

```javascript
const { utils } = require('./src');

console.log(utils.capitalize('hello')); // 'Hello'
console.log(utils.isEmpty('')); // true
console.log(utils.isEmpty([])); // true
console.log(utils.isEmpty({})); // true
console.log(utils.isEmpty('test')); // false

// Async delay
await utils.sleep(1000); // Wait 1 second
```

---

## Debounce & Throttle

Function execution control utilities.

### Functions

#### `debounce(fn, delayMs)`

Creates a debounced function that delays execution until after the specified delay has elapsed since the last call.

**Parameters:**
- `fn` (function): The function to debounce
- `delayMs` (number): Delay in milliseconds

**Returns:** `function` - The debounced function

#### `throttle(fn, intervalMs)`

Creates a throttled function that executes at most once per specified interval.

**Parameters:**
- `fn` (function): The function to throttle
- `intervalMs` (number): Minimum interval between executions

**Returns:** `function` - The throttled function

### Usage Example

```javascript
const { debounce, throttle } = require('./src');

// Debounced search
const debouncedSearch = debounce((query) => {
  console.log('Searching for:', query);
}, 300);

// Throttled scroll handler
const throttledScroll = throttle(() => {
  console.log('Scroll position updated');
}, 100);

// Usage
debouncedSearch('javascript');
debouncedSearch('python'); // Only this will execute after 300ms

throttledScroll();
throttledScroll(); // Only first call within 100ms will execute
```

### Best Practices

- Use debounce for search inputs, auto-save, and resize events
- Use throttle for scroll handlers, mouse move events, and animations

---

## Memoize

Function memoization utilities for caching function results.

### Functions

#### `memoize(fn, keyFn)`

Creates a memoized version of a synchronous function.

**Parameters:**
- `fn` (function): The function to memoize
- `keyFn` (function, optional): Function to generate cache keys from arguments

**Returns:** `function` - The memoized function

#### `memoizeAsync(fn, keyFn)`

Creates a memoized version of an asynchronous function.

**Parameters:**
- `fn` (function): The async function to memoize
- `keyFn` (function, optional): Function to generate cache keys from arguments

**Returns:** `function` - The memoized async function

### Usage Example

```javascript
const { memoize, memoizeAsync } = require('./src');

// Memoized expensive calculation
const expensiveCalculation = memoize((n) => {
  console.log('Computing...');
  return n * n * n; // Cube calculation
});

console.log(expensiveCalculation(5)); // Computes and logs
console.log(expensiveCalculation(5)); // Returns cached result

// Memoized async function
const fetchData = memoizeAsync(async (id) => {
  console.log('Fetching data...');
  await new Promise(resolve => setTimeout(resolve, 100));
  return { id, data: `Data for ${id}` };
});

const result1 = await fetchData(1); // Fetches
const result2 = await fetchData(1); // Returns cached result
```

### Best Practices

- Use for pure functions with expensive computations
- Consider memory usage for functions with many unique arguments
- Use custom keyFn for complex arguments

---

## Pipeline

Creates a function pipeline for data transformation.

### Functions

#### `pipeline(...fns)`

Creates a pipeline that passes data through multiple functions.

**Parameters:**
- `...fns` (function[]): Functions to compose in the pipeline

**Returns:** `function` - A function that applies the pipeline to input data

### Usage Example

```javascript
const { pipeline } = require('./src');

const add1 = x => x + 1;
const double = x => x * 2;
const toString = x => x.toString();

const process = pipeline(add1, double, toString);
console.log(process(3)); // "8" ( (3 + 1) * 2 = 8, then to string )

// Text processing pipeline
const trim = str => str.trim();
const uppercase = str => str.toUpperCase();
const addExclamation = str => str + '!';

const formatText = pipeline(trim, uppercase, addExclamation);
console.log(formatText('  hello world  ')); // "HELLO WORLD!"
```

### Best Practices

- Keep pipeline functions pure and single-purpose
- Use descriptive function names for better readability
- Consider error handling in pipeline functions

---

## Decorators

Function decoration utilities for adding behavior to functions.

### Functions

#### `readonly(obj, key)`

Makes an object property non-writable.

**Parameters:**
- `obj` (object): The object to modify
- `key` (string): The property key to make readonly

**Returns:** `void`

#### `logged(fn, label)`

Wraps a function to log calls with arguments and return values.

**Parameters:**
- `fn` (function): The function to wrap
- `label` (string, optional): Label for log messages

**Returns:** `function` - The wrapped function

#### `timed(fn, label)`

Wraps a function to log execution time.

**Parameters:**
- `fn` (function): The function to wrap
- `label` (string, optional): Label for timing messages

**Returns:** `function` - The wrapped function

### Usage Example

```javascript
const { decorators } = require('./src');

// Make property readonly
const config = { apiVersion: 'v1' };
decorators.readonly(config, 'apiVersion');
config.apiVersion = 'v2'; // Won't change

// Log function calls
const loggedAdd = decorators.logged((a, b) => a + b, 'add');
loggedAdd(2, 3); // Logs: [add] called with [2,3] => 5

// Time function execution
const timedProcess = decorators.timed((data) => {
  // Simulate work
  for (let i = 0; i < 1000000; i++) {}
  return data.length;
}, 'process');
timedProcess('test data'); // Logs execution time
```

---

## Middleware

Express-style middleware chain implementation.

### Functions

#### `createMiddleware()`

Creates a middleware system with use() and run() methods.

**Returns:** `object` - Middleware instance with use() and run() methods

### Methods

#### `use(fn)`

Adds a middleware function to the stack.

**Parameters:**
- `fn` (function): Middleware function (ctx, next) => void

#### `run(ctx)`

Executes the middleware chain.

**Parameters:**
- `ctx` (any): Context object passed to middleware

**Returns:** `Promise<void>`

### Usage Example

```javascript
const { middleware } = require('./src');

const mw = middleware.createMiddleware();

// Add middleware
mw.use(async (ctx, next) => {
  ctx.startTime = Date.now();
  await next();
  ctx.duration = Date.now() - ctx.startTime;
});

mw.use(async (ctx, next) => {
  console.log('Processing request');
  ctx.processed = true;
  await next();
});

mw.use(async (ctx, next) => {
  console.log('Final step');
});

// Run middleware
const context = { request: 'GET /api/data' };
await mw.run(context);

console.log(context);
// { request: 'GET /api/data', startTime: ..., processed: true, duration: ... }
```

---

## Dependency Injection

Minimal dependency injection container.

### Functions

#### `createContainer()`

Creates a new DI container.

**Returns:** `object` - Container instance with register(), singleton(), and resolve() methods

### Methods

#### `register(name, factory)`

Registers a factory function for a dependency.

**Parameters:**
- `name` (string): Dependency name
- `factory` (function): Factory function

#### `singleton(name, factory)`

Registers a singleton dependency.

**Parameters:**
- `name` (string): Dependency name
- `factory` (function): Factory function

#### `resolve(name)`

Resolves a dependency by name.

**Parameters:**
- `name` (string): Dependency name

**Returns:** `any` - The resolved dependency

### Usage Example

```javascript
const { di } = require('./src');

const container = di.createContainer();

// Register services
container.register('database', () => ({
  query: async (sql) => `Result for: ${sql}`
}));

container.singleton('logger', () => ({
  log: (msg) => console.log(`[LOG] ${msg}`)
}));

// Register service that depends on others
container.register('userService', (container) => ({
  getUser: async (id) => {
    const logger = container.resolve('logger');
    logger.log(`Fetching user ${id}`);
    const db = container.resolve('database');
    return await db.query(`SELECT * FROM users WHERE id = ${id}`);
  }
}));

// Use services
const userService = container.resolve('userService');
const user = await userService.getUser(123);
console.log(user);
```

---

## Pool

Generic object pool with max size and waiter queue.

### Functions

#### `createPool(factory, options)`

Creates a new object pool.

**Parameters:**
- `factory` (function): Function to create new objects
- `options` (object, optional): Configuration options
  - `max` (number): Maximum pool size (default: 10)

**Returns:** `object` - Pool instance with acquire(), release(), and size() methods

### Methods

#### `acquire()`

Acquires an object from the pool.

**Returns:** `Promise<any>` - Promise that resolves to an object

#### `release(obj)`

Releases an object back to the pool.

**Parameters:**
- `obj` (any): The object to release

#### `size()`

Gets the number of idle objects in the pool.

**Returns:** `number` - Number of idle objects

### Usage Example

```javascript
const { pool } = require('./src');

// Create a database connection pool
const dbPool = pool.createPool(() => ({
  id: Math.random(),
  query: async (sql) => `Result: ${sql}`
}), { max: 5 });

// Use pool
async function handleRequest() {
  const connection = await dbPool.acquire();
  try {
    const result = await connection.query('SELECT * FROM users');
    console.log(result);
  } finally {
    dbPool.release(connection);
  }
}

// Multiple concurrent requests
await Promise.all([handleRequest(), handleRequest(), handleRequest()]);
```

---

## State Manager

State management built on store + eventBus for reactive updates.

### Functions

#### `setState(key, value)`

Sets a state value and emits a change event.

**Parameters:**
- `key` (any): The state key
- `value` (any): The state value

**Returns:** `void`

#### `getState(key)`

Gets a state value.

**Parameters:**
- `key` (any): The state key

**Returns:** `any` - The state value

#### `subscribe(handler)`

Subscribes to state changes.

**Parameters:**
- `handler` (function): Function called on state changes (data) => void

**Returns:** `void`

### Usage Example

```javascript
const { stateManager } = require('./src');

// Subscribe to state changes
stateManager.subscribe((data) => {
  console.log('State changed:', data.key, '=', data.value);
});

// Set state
stateManager.setState('user', { name: 'John', id: 123 });
// Logs: State changed: user = { name: 'John', id: 123 }

stateManager.setState('theme', 'dark');
// Logs: State changed: theme = dark

// Get state
const user = stateManager.getState('user');
console.log(user.name); // 'John'
```

---

## Queue

Async task queue with concurrency control.

### Functions

#### `createQueue(concurrency)`

Creates a new task queue.

**Parameters:**
- `concurrency` (number, optional): Maximum concurrent tasks (default: 1)

**Returns:** `object` - Queue instance with add() and size() methods

### Methods

#### `add(fn)`

Adds a task to the queue.

**Parameters:**
- `fn` (function): Async task function

**Returns:** `Promise<any>` - Promise that resolves when task completes

#### `size()`

Gets the number of pending tasks.

**Returns:** `number` - Number of pending tasks

### Usage Example

```javascript
const { queue } = require('./src');

// Create queue with max 3 concurrent tasks
const taskQueue = queue.createQueue(3);

// Add tasks
const task1 = taskQueue.add(async () => {
  console.log('Task 1 started');
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('Task 1 completed');
  return 'result1';
});

const task2 = taskQueue.add(async () => {
  console.log('Task 2 started');
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('Task 2 completed');
  return 'result2';
});

// Wait for tasks
const [result1, result2] = await Promise.all([task1, task2]);
console.log('Results:', result1, result2);
```

---

## Retry

Retries an async function with configurable attempts and delays.

### Functions

#### `retry(fn, options)`

Retries a function with specified options.

**Parameters:**
- `fn` (function): Async function to retry
- `options` (object, optional): Retry configuration
  - `attempts` (number): Maximum retry attempts (default: 3)
  - `delayMs` (number): Delay between retries (default: 100)

**Returns:** `Promise<any>` - Promise that resolves with function result or rejects on final failure

### Usage Example

```javascript
const { retry } = require('./src');

// Unreliable function
let attempts = 0;
const unreliableFunction = async () => {
  attempts++;
  console.log(`Attempt ${attempts}`);
  if (attempts < 3) {
    throw new Error('Temporary failure');
  }
  return 'Success!';
};

// Retry with custom options
try {
  const result = await retry(unreliableFunction, {
    attempts: 5,
    delayMs: 200
  });
  console.log('Final result:', result);
} catch (error) {
  console.error('All attempts failed:', error.message);
}
```

---

## Stream

Simple async stream abstraction for data flow.

### Functions

#### `createStream()`

Creates a new stream instance.

**Returns:** `object` - Stream instance with write(), read(), end(), and onEnd properties

### Methods

#### `write(chunk)`

Writes data to the stream.

**Parameters:**
- `chunk` (any): Data to write

#### `read()`

Reads data from the stream.

**Returns:** `Promise<any>` - Promise that resolves with next chunk or undefined when ended

#### `end()`

Ends the stream.

**Returns:** `void`

#### `onEnd`

Property to set end handler.

**Parameters:**
- `fn` (function): Function called when stream ends

### Usage Example

```javascript
const { stream } = require('./src');

const dataStream = stream.createStream();

// Set end handler
dataStream.onEnd = () => {
  console.log('Stream ended');
};

// Producer
setTimeout(() => {
  dataStream.write('chunk1');
  setTimeout(() => {
    dataStream.write('chunk2');
    setTimeout(() => {
      dataStream.write('chunk3');
      dataStream.end();
    }, 100);
  }, 100);
}, 100);

// Consumer
async function consumeStream() {
  let chunk;
  while ((chunk = await dataStream.read()) !== undefined) {
    console.log('Received:', chunk);
  }
}

consumeStream();
// Output:
// Received: chunk1
// Received: chunk2
// Received: chunk3
// Stream ended
```

---

## Command Bus

Command pattern implementation for decoupled command handling.

### Functions

#### `createCommandBus()`

Creates a new command bus.

**Returns:** `object` - Command bus with register() and dispatch() methods

### Methods

#### `register(commandName, handler)`

Registers a command handler.

**Parameters:**
- `commandName` (string): Command name
- `handler` (function): Handler function

#### `dispatch(commandName, payload)`

Dispatches a command to its handler.

**Parameters:**
- `commandName` (string): Command name
- `payload` (any): Command payload

**Returns:** `any` - Handler return value

### Usage Example

```javascript
const { commandBus } = require('./src');

const bus = commandBus.createCommandBus();

// Register command handlers
bus.register('createUser', async (userData) => {
  console.log('Creating user:', userData);
  return { id: 123, ...userData };
});

bus.register('sendEmail', async (emailData) => {
  console.log('Sending email to:', emailData.to);
  return { sent: true, messageId: 'msg123' };
});

// Dispatch commands
const user = await bus.dispatch('createUser', {
  name: 'John Doe',
  email: 'john@example.com'
});

const emailResult = await bus.dispatch('sendEmail', {
  to: 'john@example.com',
  subject: 'Welcome!',
  body: 'Hello John!'
});

console.log('User created:', user);
console.log('Email sent:', emailResult);
```

---

## Finite State Machine

Minimal finite state machine implementation.

### Functions

#### `createFSM(config)`

Creates a new finite state machine.

**Parameters:**
- `config` (object): FSM configuration
  - `initial` (string): Initial state
  - `states` (object): State definitions with transitions

**Returns:** `object` - FSM instance with state property, can() and send() methods

### Methods

#### `state` (property)

Current state of the FSM.

**Returns:** `string` - Current state

#### `can(event)`

Checks if an event can be triggered in current state.

**Parameters:**
- `event` (string): Event name

**Returns:** `boolean` - True if event is allowed

#### `send(event)`

Sends an event to trigger a state transition.

**Parameters:**
- `event` (string): Event name

**Returns:** `string` - New state

### Usage Example

```javascript
const { fsm } = require('./src');

const trafficLight = fsm.createFSM({
  initial: 'red',
  states: {
    red: {
      on: { timer: 'green' }
    },
    green: {
      on: { timer: 'yellow' }
    },
    yellow: {
      on: { timer: 'red' }
    }
  }
});

console.log('Current state:', trafficLight.state); // 'red'
console.log('Can timer?', trafficLight.can('timer')); // true

trafficLight.send('timer');
console.log('New state:', trafficLight.state); // 'green'

trafficLight.send('timer');
console.log('New state:', trafficLight.state); // 'yellow'

trafficLight.send('timer');
console.log('New state:', trafficLight.state); // 'red'
```

---

## Observable

Minimal Observable implementation for reactive programming.

### Functions

#### `createObservable(subscribeFn)`

Creates a new observable.

**Parameters:**
- `subscribeFn` (function): Function that receives subscriber

**Returns:** `object` - Observable with subscribe() method

### Methods

#### `subscribe(observer)`

Subscribes to the observable.

**Parameters:**
- `observer` (object): Observer object with optional next(), error(), complete() methods

**Returns:** `void`

### Usage Example

```javascript
const { observable } = require('./src');

// Create an observable that emits values
const numberObservable = observable.createObservable((subscriber) => {
  let count = 0;
  const interval = setInterval(() => {
    count++;
    if (count <= 3) {
      subscriber.next(count);
    } else {
      subscriber.complete();
      clearInterval(interval);
    }
  }, 100);
});

// Subscribe to the observable
const subscription = numberObservable.subscribe({
  next: (value) => console.log('Received:', value),
  error: (err) => console.error('Error:', err),
  complete: () => console.log('Complete!')
});

// Output:
// Received: 1
// Received: 2
// Received: 3
// Complete!
```

---

## Router

Minimal path router with parameter support.

### Functions

#### `addRoute(path, handler)`

Adds a route to the router.

**Parameters:**
- `path` (string): Route path with :param support
- `handler` (function): Route handler function

**Returns:** `void`

#### `navigate(path)`

Navigates to a path and executes matching handler.

**Parameters:**
- `path` (string): Navigation path

**Returns:** `any` - Handler return value or null if no match

#### `notFound(handler)`

Sets a handler for unmatched routes.

**Parameters:**
- `handler` (function): Not found handler

**Returns:** `void`

### Usage Example

```javascript
const { router } = require('./src');

// Add routes
router.addRoute('/', () => 'Home page');
router.addRoute('/about', () => 'About page');
router.addRoute('/users/:id', (params) => `User ${params.id}`);
router.addRoute('/posts/:category/:slug', (params) => 
  `Post: ${params.category}/${params.slug}`
);

// Set not found handler
router.notFound((path) => `404 - Page not found: ${path}`);

// Navigate
console.log(router.navigate('/')); // 'Home page'
console.log(router.navigate('/about')); // 'About page'
console.log(router.navigate('/users/123')); // 'User 123'
console.log(router.navigate('/posts/tech/hello-world')); // 'Post: tech/hello-world'
console.log(router.navigate('/missing')); // '404 - Page not found: /missing'
```

---

## Scheduler

Simple named task scheduler for recurring tasks.

### Functions

#### `schedule(name, intervalMs, fn)`

Schedules a recurring task.

**Parameters:**
- `name` (string): Task name
- `intervalMs` (number): Execution interval in milliseconds
- `fn` (function): Task function

**Returns:** `void`

#### `cancel(name)`

Cancels a scheduled task.

**Parameters:**
- `name` (string): Task name

**Returns:** `boolean` - True if task was cancelled

#### `list()`

Lists all scheduled task names.

**Returns:** `string[]` - Array of task names

### Usage Example

```javascript
const { scheduler } = require('./src');

// Schedule tasks
scheduler.schedule('cleanup', 5000, () => {
  console.log('Running cleanup task');
});

scheduler.schedule('backup', 30000, () => {
  console.log('Running backup task');
});

// List tasks
console.log('Scheduled tasks:', scheduler.list());
// ['cleanup', 'backup']

// Cancel a task
setTimeout(() => {
  const cancelled = scheduler.cancel('cleanup');
  console.log('Cleanup cancelled:', cancelled);
}, 15000);
```

---

## Validator

Simple value validation with configurable rules.

### Functions

#### `validate(value, rules)`

Validates a value against rules.

**Parameters:**
- `value` (any): Value to validate
- `rules` (object): Validation rules
  - `required` (boolean): Value is required
  - `type` (string): Expected type ('string', 'number', 'boolean', 'object', 'array')
  - `minLength` (number): Minimum length for strings/arrays
  - `maxLength` (number): Maximum length for strings/arrays
  - `min` (number): Minimum value for numbers
  - `max` (number): Maximum value for numbers

**Returns:** `object` - Validation result
  - `valid` (boolean): Whether validation passed
  - `errors` (string[]): Array of error messages

### Usage Example

```javascript
const { validator } = require('./src');

// Validate user data
const userValidation = validator.validate('John', {
  required: true,
  type: 'string',
  minLength: 2,
  maxLength: 50
});

console.log(userValidation);
// { valid: true, errors: [] }

// Validate age
const ageValidation = validator.validate(25, {
  type: 'number',
  min: 18,
  max: 120
});

console.log(ageValidation);
// { valid: true, errors: [] }

// Validate with errors
const invalidValidation = validator.validate('', {
  required: true,
  minLength: 5
});

console.log(invalidValidation);
// { valid: false, errors: ['Value is required'] }
```

---

## Config

Application configuration object with package metadata.

### Properties

- `name` (string): Package name from package.json
- `version` (string): Package version
- `description` (string): Package description
- `startedAt` (string): Application start timestamp

### Usage Example

```javascript
const { config } = require('./src');

console.log('App:', config.name);
console.log('Version:', config.version);
console.log('Description:', config.description);
console.log('Started at:', config.startedAt);
```

---

## Greet

Returns the Forever welcome message.

### Functions

#### `greet()`

Returns the Forever welcome message as a formatted string.

**Returns:** `string` - Welcome message

### Usage Example

```javascript
const { greet } = require('./src');

console.log(greet());
// Outputs:
// =========================================
//   Welcome to Forever
// =========================================
// 
//   Forever is a self-evolving repository.
//   With each iteration, it grows smarter,
//   more structured, and more capable.
// 
//   The journey never ends.
// =========================================
```

---

## Barrel Export

All modules can be imported from a single entry point:

```javascript
const { 
  cache, store, eventBus, logger, utils,
  debounce, throttle, memoize, memoizeAsync, pipeline,
  decorators, middleware, di, pool, stateManager,
  queue, retry, stream, commandBus, fsm, observable,
  router, scheduler, validator, config, greet
} = require('./src');

// Or use namespace imports
const { 
  cache: { set, get, has, delete: del },
  eventBus: { on, off, emit },
  logger: { log },
  utils: { capitalize, isEmpty, sleep }
} = require('./src');
```

This provides a convenient way to access all Forever library functionality from a single import statement.
