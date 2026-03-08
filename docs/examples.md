# Forever Library Examples

This document provides practical examples of using Forever library modules to build real-world applications.

## Table of Contents

- [Simple Web Server](#simple-web-server)
- [Data Processing Pipeline](#data-processing-pipeline)
- [Stateful Todo Application](#stateful-todo-application)
- [API Client with Retry and Caching](#api-client-with-retry-and-caching)
- [Real-time Dashboard](#real-time-dashboard)
- [Task Queue Worker](#task-queue-worker)
- [Form Validation System](#form-validation-system)
- [Event-Driven Architecture](#event-driven-architecture)

---

## Simple Web Server

Build a minimal web server using router, middleware, and event bus modules.

```javascript
const { router, middleware, eventBus, logger } = require('./src');

// Create middleware stack
const app = middleware.createMiddleware();

// Logging middleware
app.use(async (ctx, next) => {
  ctx.startTime = Date.now();
  logger.log('info', `${ctx.method} ${ctx.path}`);
  await next();
  const duration = Date.now() - ctx.startTime;
  logger.log('info', `Response sent in ${duration}ms`);
});

// CORS middleware
app.use(async (ctx, next) => {
  ctx.headers = ctx.headers || {};
  ctx.headers['Access-Control-Allow-Origin'] = '*';
  ctx.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE';
  ctx.headers['Access-Control-Allow-Headers'] = 'Content-Type';
  await next();
});

// Body parsing middleware
app.use(async (ctx, next) => {
  if (ctx.method === 'POST' && ctx.body) {
    try {
      ctx.parsedBody = JSON.parse(ctx.body);
    } catch (e) {
      ctx.parsedBody = {};
    }
  }
  await next();
});

// Setup routes
router.addRoute('/', () => ({ message: 'Welcome to Forever Server' }));
router.addRoute('/api/users', () => ({ users: [] }));
router.addRoute('/api/users/:id', (params) => ({ user: { id: params.id, name: 'John' } }));

// 404 handler
router.notFound((path) => ({ error: 'Not Found', path }));

// Main request handler
app.use(async (ctx) => {
  const result = router.navigate(ctx.path);
  ctx.response = result;
});

// Simulate HTTP requests
async function simulateRequest(method, path, body = null) {
  const ctx = { method, path, body };
  await app.run(ctx);
  return ctx.response;
}

// Test the server
(async () => {
  console.log('=== Simple Web Server Example ===');
  
  const home = await simulateRequest('GET', '/');
  console.log('Home:', home);
  
  const users = await simulateRequest('GET', '/api/users');
  console.log('Users:', users);
  
  const user = await simulateRequest('GET', '/api/users/123');
  console.log('User:', user);
  
  const notFound = await simulateRequest('GET', '/missing');
  console.log('404:', notFound);
})();
```

---

## Data Processing Pipeline

Create a data processing pipeline using pipeline, memoize, and queue modules.

```javascript
const { pipeline, memoize, queue, utils, cache } = require('./src');

// Data processing steps
const fetchData = memoize(async (source) => {
  console.log(`Fetching data from ${source}...`);
  await utils.sleep(100); // Simulate network delay
  return Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    value: Math.random() * 100,
    source
  }));
});

const filterData = (data) => {
  console.log('Filtering data...');
  return data.filter(item => item.value > 50);
};

const transformData = (data) => {
  console.log('Transforming data...');
  return data.map(item => ({
    ...item,
    processed: true,
    category: item.value > 75 ? 'high' : 'medium'
  }));
};

const aggregateData = (data) => {
  console.log('Aggregating data...');
  return {
    total: data.length,
    high: data.filter(item => item.category === 'high').length,
    medium: data.filter(item => item.category === 'medium').length,
    averageValue: data.reduce((sum, item) => sum + item.value, 0) / data.length
  };
};

// Create processing pipeline
const processData = pipeline(fetchData, filterData, transformData, aggregateData);

// Batch processing with queue
const processingQueue = queue.createQueue(3); // 3 concurrent processes

async function processBatch(sources) {
  console.log(`=== Processing batch from ${sources.length} sources ===`);
  
  const tasks = sources.map(source => 
    processingQueue.add(async () => {
      const cacheKey = `processed:${source}`;
      const cached = cache.get(cacheKey);
      
      if (cached) {
        console.log(`Cache hit for ${source}`);
        return cached;
      }
      
      const result = await processData(source);
      cache.set(cacheKey, result, 60000); // Cache for 1 minute
      return result;
    })
  );
  
  const results = await Promise.all(tasks);
  return results;
}

// Example usage
(async () => {
  const sources = ['api1', 'api2', 'api3', 'database', 'file'];
  const results = await processBatch(sources);
  
  console.log('\n=== Batch Results ===');
  results.forEach((result, index) => {
    console.log(`Source ${sources[index]}:`, result);
  });
  
  // Test caching by running again
  console.log('\n=== Second Batch (should use cache) ===');
  await processBatch(sources.slice(0, 2));
})();
```

---

## Stateful Todo Application

Build a todo application using state manager, event bus, and validation.

```javascript
const { stateManager, eventBus, validator, utils, decorators } = require('./src');

// Todo validation rules
const todoRules = {
  required: true,
  type: 'object',
  // Custom validation would be implemented here
};

// Todo store with state management
class TodoStore {
  constructor() {
    this.todos = [];
    this.filter = 'all'; // all, active, completed
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    // Subscribe to state changes
    stateManager.subscribe((data) => {
      if (data.key === 'todos') {
        this.todos = data.value;
        eventBus.emit('todos:changed', this.todos);
      }
      if (data.key === 'filter') {
        this.filter = data.value;
        eventBus.emit('filter:changed', this.filter);
      }
    });
  }
  
  addTodo(text) {
    if (!text || text.trim() === '') {
      throw new Error('Todo text is required');
    }
    
    const todo = {
      id: Date.now(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    const todos = stateManager.getState('todos') || [];
    stateManager.setState('todos', [...todos, todo]);
    eventBus.emit('todo:added', todo);
    return todo;
  }
  
  toggleTodo(id) {
    const todos = stateManager.getState('todos') || [];
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    stateManager.setState('todos', updatedTodos);
    
    const toggledTodo = updatedTodos.find(todo => todo.id === id);
    eventBus.emit('todo:toggled', toggledTodo);
    return toggledTodo;
  }
  
  deleteTodo(id) {
    const todos = stateManager.getState('todos') || [];
    const filteredTodos = todos.filter(todo => todo.id !== id);
    stateManager.setState('todos', filteredTodos);
    eventBus.emit('todo:deleted', id);
  }
  
  clearCompleted() {
    const todos = stateManager.getState('todos') || [];
    const activeTodos = todos.filter(todo => !todo.completed);
    stateManager.setState('todos', activeTodos);
    eventBus.emit('completed:cleared');
  }
  
  setFilter(filter) {
    if (['all', 'active', 'completed'].includes(filter)) {
      stateManager.setState('filter', filter);
    }
  }
  
  getFilteredTodos() {
    const todos = stateManager.getState('todos') || [];
    const filter = stateManager.getState('filter') || 'all';
    
    switch (filter) {
      case 'active':
        return todos.filter(todo => !todo.completed);
      case 'completed':
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  }
  
  getStats() {
    const todos = stateManager.getState('todos') || [];
    return {
      total: todos.length,
      active: todos.filter(todo => !todo.completed).length,
      completed: todos.filter(todo => todo.completed).length
    };
  }
}

// UI Controller (simulated)
class TodoUI {
  constructor(todoStore) {
    this.todoStore = todoStore;
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    eventBus.on('todos:changed', (todos) => {
      this.renderTodos();
      this.renderStats();
    });
    
    eventBus.on('filter:changed', (filter) => {
      this.renderTodos();
      this.renderFilter();
    });
  }
  
  renderTodos() {
    const todos = this.todoStore.getFilteredTodos();
    console.log('\n=== Todos ===');
    if (todos.length === 0) {
      console.log('No todos to display');
    } else {
      todos.forEach(todo => {
        const status = todo.completed ? '✓' : '○';
        console.log(`${status} [${todo.id}] ${todo.text}`);
      });
    }
  }
  
  renderStats() {
    const stats = this.todoStore.getStats();
    console.log(`\nStats: ${stats.total} total, ${stats.active} active, ${stats.completed} completed`);
  }
  
  renderFilter() {
    const filter = stateManager.getState('filter') || 'all';
    console.log(`Filter: ${filter}`);
  }
  
  addTodo(text) {
    try {
      const todo = this.todoStore.addTodo(text);
      console.log(`Added: ${todo.text}`);
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
  
  toggleTodo(id) {
    this.todoStore.toggleTodo(id);
  }
  
  deleteTodo(id) {
    this.todoStore.deleteTodo(id);
  }
  
  setFilter(filter) {
    this.todoStore.setFilter(filter);
  }
}

// Example usage
(async () => {
  console.log('=== Todo Application Example ===');
  
  const todoStore = new TodoStore();
  const ui = new TodoUI(todoStore);
  
  // Add some todos
  ui.addTodo('Learn Forever library');
  ui.addTodo('Build amazing applications');
  ui.addTodo('Write documentation');
  
  // Toggle a todo
  const todos = todoStore.getFilteredTodos();
  if (todos.length > 0) {
    ui.toggleTodo(todos[0].id);
  }
  
  // Change filter
  ui.setFilter('active');
  await utils.sleep(100);
  
  ui.setFilter('completed');
  await utils.sleep(100);
  
  ui.setFilter('all');
  await utils.sleep(100);
  
  // Clear completed
  todoStore.clearCompleted();
  
  // Delete a todo
  const remainingTodos = todoStore.getFilteredTodos();
  if (remainingTodos.length > 0) {
    ui.deleteTodo(remainingTodos[0].id);
  }
})();
```

---

## API Client with Retry and Caching

Create a robust API client with retry logic, caching, and rate limiting.

```javascript
const { retry, cache, debounce, throttle, utils, pool, stream } = require('./src');

class APIClient {
  constructor(baseURL, options = {}) {
    this.baseURL = baseURL;
    this.options = {
      maxRetries: 3,
      retryDelay: 1000,
      cacheTimeout: 300000, // 5 minutes
      rateLimitMs: 100, // 10 requests per second
      ...options
    };
    
    // Create connection pool for HTTP requests
    this.connectionPool = pool.createPool(() => {
      return { 
        id: Math.random(),
        lastUsed: Date.now(),
        requestCount: 0
      };
    }, { max: 5 });
    
    // Throttled request method
    this.throttledRequest = throttle(this._makeRequest.bind(this), this.options.rateLimitMs);
  }
  
  async request(endpoint, options = {}) {
    const cacheKey = `${endpoint}:${JSON.stringify(options)}`;
    
    // Try cache first
    const cached = cache.get(cacheKey);
    if (cached && !options.skipCache) {
      console.log(`Cache hit for ${endpoint}`);
      return cached;
    }
    
    try {
      const result = await retry(
        () => this.throttledRequest(endpoint, options),
        {
          attempts: this.options.maxRetries,
          delayMs: this.options.retryDelay
        }
      );
      
      // Cache successful responses
      if (!options.skipCache) {
        cache.set(cacheKey, result, this.options.cacheTimeout);
      }
      
      return result;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error.message);
      throw error;
    }
  }
  
  async _makeRequest(endpoint, options = {}) {
    const connection = await this.connectionPool.acquire();
    
    try {
      connection.requestCount++;
      connection.lastUsed = Date.now();
      
      console.log(`Making request to ${endpoint} (connection ${connection.id})`);
      
      // Simulate HTTP request
      await utils.sleep(50 + Math.random() * 100);
      
      // Simulate occasional failures
      if (Math.random() < 0.1) {
        throw new Error('Network error');
      }
      
      const response = {
        status: 200,
        data: {
          endpoint,
          timestamp: Date.now(),
          connectionId: connection.id,
          requestCount: connection.requestCount
        }
      };
      
      return response;
    } finally {
      this.connectionPool.release(connection);
    }
  }
  
  // Streaming endpoint for large data
  async streamEndpoint(endpoint) {
    const dataStream = stream.createStream();
    
    // Simulate streaming data
    setTimeout(() => {
      let chunk = 0;
      const interval = setInterval(() => {
        chunk++;
        dataStream.write({
          chunk,
          data: `Data chunk ${chunk} from ${endpoint}`,
          timestamp: Date.now()
        });
        
        if (chunk >= 5) {
          clearInterval(interval);
          dataStream.end();
        }
      }, 200);
    }, 100);
    
    return dataStream;
  }
  
  // Batch requests
  async batch(requests) {
    console.log(`Processing batch of ${requests.length} requests`);
    
    const batchPromises = requests.map(({ endpoint, options }) =>
      this.request(endpoint, options)
    );
    
    return Promise.all(batchPromises);
  }
  
  // Debounced search
  debouncedSearch = debounce(async (query) => {
    return this.request(`/search?q=${encodeURIComponent(query)}`);
  }, 300);
}

// Example usage
(async () => {
  console.log('=== API Client Example ===');
  
  const client = new APIClient('https://api.example.com');
  
  // Single request
  console.log('\n--- Single Request ---');
  const user = await client.request('/users/123');
  console.log('User data:', user.data);
  
  // Cached request
  console.log('\n--- Cached Request ---');
  const cachedUser = await client.request('/users/123');
  console.log('Cached user data:', cachedUser.data);
  
  // Batch requests
  console.log('\n--- Batch Requests ---');
  const batchResults = await client.batch([
    { endpoint: '/users/123' },
    { endpoint: '/users/456' },
    { endpoint: '/posts/789' }
  ]);
  console.log('Batch results:', batchResults.map(r => r.data.endpoint));
  
  // Streaming data
  console.log('\n--- Streaming Data ---');
  const stream = await client.streamEndpoint('/data/large');
  let chunk;
  while ((chunk = await stream.read()) !== undefined) {
    console.log('Stream chunk:', chunk);
  }
  
  // Debounced search
  console.log('\n--- Debounced Search ---');
  client.debouncedSearch('javascript');
  client.debouncedSearch('python'); // Only this will execute
  await utils.sleep(350);
  
  // Rate limiting test
  console.log('\n--- Rate Limiting Test ---');
  const rapidRequests = Array.from({ length: 5 }, (_, i) => 
    client.request(`/rapid/${i}`)
  );
  await Promise.all(rapidRequests);
})();
```

---

## Real-time Dashboard

Create a real-time dashboard using observables, event bus, and scheduler.

```javascript
const { observable, scheduler, eventBus, stateManager, utils, fsm } = require('./src');

// Dashboard data sources
class DataSource {
  constructor(name, interval, dataGenerator) {
    this.name = name;
    this.interval = interval;
    this.dataGenerator = dataGenerator;
    this.observable = null;
  }
  
  start() {
    this.observable = observable.createObservable((subscriber) => {
      const taskName = `data-source-${this.name}`;
      
      scheduler.schedule(taskName, this.interval, () => {
        try {
          const data = this.dataGenerator();
          subscriber.next(data);
          eventBus.emit('data:received', { source: this.name, data });
        } catch (error) {
          subscriber.error(error);
        }
      });
      
      // Cleanup on unsubscribe
      return () => scheduler.cancel(taskName);
    });
    
    return this.observable;
  }
  
  stop() {
    const taskName = `data-source-${this.name}`;
    scheduler.cancel(taskName);
  }
}

// Dashboard state management
class DashboardState {
  constructor() {
    this.state = 'idle'; // idle, loading, active, error
    this.data = new Map();
    this.fsm = this.createFSM();
    this.setupEventHandlers();
  }
  
  createFSM() {
    return fsm.createFSM({
      initial: 'idle',
      states: {
        idle: {
          on: { start: 'loading' }
        },
        loading: {
          on: { success: 'active', error: 'error' }
        },
        active: {
          on: { stop: 'idle', error: 'error' }
        },
        error: {
          on: { retry: 'loading', stop: 'idle' }
        }
      }
    });
  }
  
  setupEventHandlers() {
    eventBus.on('data:received', ({ source, data }) => {
      this.data.set(source, data);
      stateManager.setState('dashboard:data', Object.fromEntries(this.data));
      stateManager.setState('dashboard:updated', Date.now());
    });
    
    eventBus.on('data:error', ({ source, error }) => {
      console.error(`Data source ${source} error:`, error);
      this.fsm.send('error');
    });
  }
  
  start() {
    if (this.fsm.can('start')) {
      this.fsm.send('start');
      stateManager.setState('dashboard:state', this.fsm.state);
    }
  }
  
  stop() {
    if (this.fsm.can('stop')) {
      this.fsm.send('stop');
      stateManager.setState('dashboard:state', this.fsm.state);
    }
  }
  
  retry() {
    if (this.fsm.can('retry')) {
      this.fsm.send('retry');
      stateManager.setState('dashboard:state', this.fsm.state);
    }
  }
}

// Dashboard UI
class Dashboard {
  constructor() {
    this.state = new DashboardState();
    this.dataSources = [];
    this.subscriptions = [];
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    stateManager.subscribe((data) => {
      if (data.key === 'dashboard:state') {
        this.renderState();
      }
      if (data.key === 'dashboard:data') {
        this.renderData();
      }
      if (data.key === 'dashboard:updated') {
        this.renderTimestamp();
      }
    });
  }
  
  addDataSource(source) {
    this.dataSources.push(source);
  }
  
  async start() {
    console.log('=== Starting Dashboard ===');
    this.state.start();
    
    // Start all data sources
    for (const source of this.dataSources) {
      const observable = source.start();
      
      const subscription = observable.subscribe({
        next: (data) => {
          console.log(`📊 ${source.name}:`, data);
        },
        error: (error) => {
          console.error(`❌ ${source.name} error:`, error);
          eventBus.emit('data:error', { source: source.name, error });
        },
        complete: () => {
          console.log(`✅ ${source.name} completed`);
        }
      });
      
      this.subscriptions.push(subscription);
    }
    
    this.state.fsm.send('success');
    stateManager.setState('dashboard:state', this.state.fsm.state);
  }
  
  stop() {
    console.log('=== Stopping Dashboard ===');
    this.state.stop();
    
    // Stop all data sources
    this.dataSources.forEach(source => source.stop());
    
    // Unsubscribe from all observables
    this.subscriptions = [];
    
    this.renderState();
  }
  
  renderState() {
    const state = stateManager.getState('dashboard:state') || 'idle';
    const stateEmojis = {
      idle: '😴',
      loading: '⏳',
      active: '🟢',
      error: '🔴'
    };
    console.log(`\nDashboard State: ${stateEmojis[state]} ${state.toUpperCase()}`);
  }
  
  renderData() {
    const data = stateManager.getState('dashboard:data') || {};
    console.log('\n=== Current Data ===');
    Object.entries(data).forEach(([source, values]) => {
      console.log(`${source}:`, values);
    });
  }
  
  renderTimestamp() {
    const updated = stateManager.getState('dashboard:updated');
    console.log(`Last updated: ${new Date(updated).toLocaleTimeString()}`);
  }
}

// Example usage
(async () => {
  // Create dashboard
  const dashboard = new Dashboard();
  
  // Add data sources
  const cpuSource = new DataSource('CPU', 2000, () => ({
    usage: Math.random() * 100,
    cores: 4,
    timestamp: Date.now()
  }));
  
  const memorySource = new DataSource('Memory', 3000, () => ({
    used: Math.random() * 8000,
    total: 16000,
    percentage: (Math.random() * 100).toFixed(1),
    timestamp: Date.now()
  }));
  
  const networkSource = new DataSource('Network', 1500, () => ({
    download: Math.random() * 1000,
    upload: Math.random() * 500,
    latency: Math.random() * 100,
    timestamp: Date.now()
  }));
  
  dashboard.addDataSource(cpuSource);
  dashboard.addDataSource(memorySource);
  dashboard.addDataSource(networkSource);
  
  // Start dashboard
  dashboard.start();
  
  // Let it run for 10 seconds
  await utils.sleep(10000);
  
  // Stop dashboard
  dashboard.stop();
})();
```

---

## Task Queue Worker

Build a task queue worker with dependency injection and retry logic.

```javascript
const { queue, di, retry, logger, eventBus, pool, utils } = require('./src');

// Task types
const TASK_TYPES = {
  EMAIL: 'email',
  PROCESSING: 'processing',
  BACKUP: 'backup'
};

// Task handlers
class EmailHandler {
  async handle(task) {
    logger.log('info', `Sending email to ${task.payload.to}`);
    await utils.sleep(100 + Math.random() * 200);
    
    // Simulate occasional failures
    if (Math.random() < 0.2) {
      throw new Error('SMTP server unavailable');
    }
    
    return { sent: true, messageId: `msg_${Date.now()}` };
  }
}

class ProcessingHandler {
  async handle(task) {
    logger.log('info', `Processing ${task.payload.type} data`);
    await utils.sleep(200 + Math.random() * 300);
    
    return {
      processed: true,
      result: `Processed ${task.payload.items.length} items`,
      duration: Date.now() - task.startTime
    };
  }
}

class BackupHandler {
  async handle(task) {
    logger.log('info', `Creating backup of ${task.payload.source}`);
    await utils.sleep(500 + Math.random() * 500);
    
    return {
      backedUp: true,
      size: Math.floor(Math.random() * 1000000),
      location: `/backups/${task.payload.source}_${Date.now()}.zip`
    };
  }
}

// Task worker
class TaskWorker {
  constructor(container, concurrency = 3) {
    this.container = container;
    this.taskQueue = queue.createQueue(concurrency);
    this.processedTasks = 0;
    this.failedTasks = 0;
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    eventBus.on('task:completed', (task, result) => {
      this.processedTasks++;
      logger.log('info', `Task completed: ${task.id} (${this.processedTasks} total)`);
    });
    
    eventBus.on('task:failed', (task, error) => {
      this.failedTasks++;
      logger.log('error', `Task failed: ${task.id} - ${error.message} (${this.failedTasks} total)`);
    });
  }
  
  async processTask(task) {
    const handler = this.getHandler(task.type);
    if (!handler) {
      throw new Error(`No handler for task type: ${task.type}`);
    }
    
    const startTime = Date.now();
    
    try {
      const result = await retry(
        () => handler.handle(task),
        {
          attempts: task.maxRetries || 3,
          delayMs: task.retryDelay || 1000
        }
      );
      
      const duration = Date.now() - startTime;
      eventBus.emit('task:completed', task, { ...result, duration });
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      eventBus.emit('task:failed', task, { ...error, duration });
      throw error;
    }
  }
  
  getHandler(type) {
    switch (type) {
      case TASK_TYPES.EMAIL:
        return this.container.resolve('emailHandler');
      case TASK_TYPES.PROCESSING:
        return this.container.resolve('processingHandler');
      case TASK_TYPES.BACKUP:
        return this.container.resolve('backupHandler');
      default:
        return null;
    }
  }
  
  async addTask(task) {
    task.id = task.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    task.startTime = Date.now();
    
    return this.taskQueue.add(() => this.processTask(task));
  }
  
  getStats() {
    return {
      processed: this.processedTasks,
      failed: this.failedTasks,
      pending: this.taskQueue.size(),
      total: this.processedTasks + this.failedTasks + this.taskQueue.size()
    };
  }
}

// Task generator
class TaskGenerator {
  constructor(worker) {
    this.worker = worker;
    this.isRunning = false;
  }
  
  async start(intervalMs = 2000) {
    this.isRunning = true;
    
    while (this.isRunning) {
      const task = this.generateRandomTask();
      await this.worker.addTask(task);
      await utils.sleep(intervalMs + Math.random() * 1000);
    }
  }
  
  stop() {
    this.isRunning = false;
  }
  
  generateRandomTask() {
    const types = Object.values(TASK_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    
    switch (type) {
      case TASK_TYPES.EMAIL:
        return {
          type,
          payload: {
            to: `user${Math.floor(Math.random() * 100)}@example.com`,
            subject: 'Hello from Forever',
            body: 'This is a test email'
          },
          maxRetries: 3,
          retryDelay: 1000
        };
        
      case TASK_TYPES.PROCESSING:
        return {
          type,
          payload: {
            type: ['image', 'video', 'document'][Math.floor(Math.random() * 3)],
            items: Array.from({ length: Math.floor(Math.random() * 10) + 1 }, (_, i) => ({ id: i }))
          },
          maxRetries: 2,
          retryDelay: 2000
        };
        
      case TASK_TYPES.BACKUP:
        return {
          type,
          payload: {
            source: ['database', 'files', 'logs'][Math.floor(Math.random() * 3)],
            compress: Math.random() > 0.5
          },
          maxRetries: 5,
          retryDelay: 3000
        };
    }
  }
}

// Example usage
(async () => {
  console.log('=== Task Queue Worker Example ===');
  
  // Setup dependency injection
  const container = di.createContainer();
  container.register('emailHandler', () => new EmailHandler());
  container.register('processingHandler', () => new ProcessingHandler());
  container.register('backupHandler', () => new BackupHandler());
  
  // Create worker
  const worker = new TaskWorker(container, 2); // 2 concurrent tasks
  
  // Create task generator
  const generator = new TaskGenerator(worker);
  
  // Start generating tasks
  generator.start(1500);
  
  // Monitor stats
  const statsInterval = setInterval(() => {
    const stats = worker.getStats();
    console.log(`📊 Stats: ${stats.processed} processed, ${stats.failed} failed, ${stats.pending} pending, ${stats.total} total`);
  }, 3000);
  
  // Run for 15 seconds
  await utils.sleep(15000);
  
  // Stop generator
  generator.stop();
  
  // Wait for remaining tasks to complete
  while (worker.taskQueue.size() > 0) {
    await utils.sleep(1000);
  }
  
  clearInterval(statsInterval);
  
  // Final stats
  const finalStats = worker.getStats();
  console.log('\n=== Final Stats ===');
  console.log(`Processed: ${finalStats.processed}`);
  console.log(`Failed: ${finalStats.failed}`);
  console.log(`Total: ${finalStats.total}`);
  console.log(`Success rate: ${((finalStats.processed / finalStats.total) * 100).toFixed(1)}%`);
})();
```

---

## Form Validation System

Create a comprehensive form validation system using validator, event bus, and state management.

```javascript
const { validator, eventBus, stateManager, utils, debounce } = require('./src');

// Form field definitions
const fieldDefinitions = {
  username: {
    label: 'Username',
    rules: {
      required: true,
      type: 'string',
      minLength: 3,
      maxLength: 20
    },
    sanitize: (value) => value.trim().toLowerCase()
  },
  email: {
    label: 'Email',
    rules: {
      required: true,
      type: 'string',
      minLength: 5,
      maxLength: 100
    },
    sanitize: (value) => value.trim().toLowerCase(),
    custom: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) ? null : 'Invalid email format';
    }
  },
  age: {
    label: 'Age',
    rules: {
      required: true,
      type: 'number',
      min: 18,
      max: 120
    },
    sanitize: (value) => parseInt(value, 10) || 0
  },
  password: {
    label: 'Password',
    rules: {
      required: true,
      type: 'string',
      minLength: 8
    },
    custom: (value) => {
      if (!/[A-Z]/.test(value)) return 'Password must contain uppercase letter';
      if (!/[a-z]/.test(value)) return 'Password must contain lowercase letter';
      if (!/[0-9]/.test(value)) return 'Password must contain number';
      return null;
    }
  },
  confirmPassword: {
    label: 'Confirm Password',
    rules: {
      required: true,
      type: 'string'
    },
    custom: (value, formData) => {
      return value === formData.password ? null : 'Passwords do not match';
    }
  }
};

// Form validator class
class FormValidator {
  constructor(fieldDefs) {
    this.fieldDefs = fieldDefs;
    this.formData = {};
    this.errors = {};
    this.touched = {};
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    eventBus.on('field:changed', (fieldName, value) => {
      this.updateField(fieldName, value);
    });
    
    eventBus.on('field:touched', (fieldName) => {
      this.touched[fieldName] = true;
      this.validateField(fieldName);
      this.updateFormState();
    });
    
    eventBus.on('form:submit', () => {
      this.validateAll();
    });
  }
  
  updateField(fieldName, value) {
    const fieldDef = this.fieldDefs[fieldName];
    if (!fieldDef) return;
    
    // Sanitize value
    const sanitizedValue = fieldDef.sanitize ? fieldDef.sanitize(value) : value;
    this.formData[fieldName] = sanitizedValue;
    
    // Validate if field has been touched
    if (this.touched[fieldName]) {
      this.validateField(fieldName);
    }
    
    this.updateFormState();
  }
  
  validateField(fieldName) {
    const fieldDef = this.fieldDefs[fieldName];
    const value = this.formData[fieldName];
    const errors = [];
    
    if (!fieldDef) return;
    
    // Standard validation
    const validation = validator.validate(value, fieldDef.rules);
    if (!validation.valid) {
      errors.push(...validation.errors);
    }
    
    // Custom validation
    if (fieldDef.custom) {
      const customError = fieldDef.custom(value, this.formData);
      if (customError) {
        errors.push(customError);
      }
    }
    
    this.errors[fieldName] = errors;
    
    // Emit validation result
    eventBus.emit('field:validated', fieldName, {
      isValid: errors.length === 0,
      errors
    });
  }
  
  validateAll() {
    Object.keys(this.fieldDefs).forEach(fieldName => {
      this.touched[fieldName] = true;
      this.validateField(fieldName);
    });
    
    this.updateFormState();
    
    const isValid = this.isFormValid();
    eventBus.emit('form:validated', {
      isValid,
      data: this.formData,
      errors: this.errors
    });
    
    return isValid;
  }
  
  updateFormState() {
    stateManager.setState('form:data', this.formData);
    stateManager.setState('form:errors', this.errors);
    stateManager.setState('form:touched', this.touched);
    stateManager.setState('form:isValid', this.isFormValid());
  }
  
  isFormValid() {
    return Object.keys(this.fieldDefs).every(fieldName => {
      const errors = this.errors[fieldName] || [];
      return errors.length === 0;
    });
  }
  
  getFieldError(fieldName) {
    const errors = this.errors[fieldName] || [];
    return errors.length > 0 ? errors[0] : null;
  }
  
  reset() {
    this.formData = {};
    this.errors = {};
    this.touched = {};
    this.updateFormState();
  }
}

// Form UI controller
class FormUI {
  constructor(validator) {
    this.validator = validator;
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    eventBus.on('field:validated', (fieldName, result) => {
      this.renderFieldValidation(fieldName, result);
    });
    
    eventBus.on('form:validated', (result) => {
      this.renderFormValidation(result);
    });
  }
  
  inputChanged(fieldName, value) {
    eventBus.emit('field:changed', fieldName, value);
  }
  
  fieldBlurred(fieldName) {
    eventBus.emit('field:touched', fieldName);
  }
  
  submitForm() {
    eventBus.emit('form:submit');
  }
  
  renderFieldValidation(fieldName, { isValid, errors }) {
    const error = this.validator.getFieldError(fieldName);
    if (error) {
      console.log(`❌ ${this.validator.fieldDefs[fieldName].label}: ${error}`);
    } else if (this.validator.touched[fieldName]) {
      console.log(`✅ ${this.validator.fieldDefs[fieldName].label}: Valid`);
    }
  }
  
  renderFormValidation({ isValid, data, errors }) {
    console.log('\n=== Form Validation Result ===');
    console.log(`Form is ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    
    if (!isValid) {
      console.log('\nErrors:');
      Object.entries(errors).forEach(([field, fieldErrors]) => {
        if (fieldErrors.length > 0) {
          console.log(`  ${field}: ${fieldErrors.join(', ')}`);
        }
      });
    }
    
    if (isValid) {
      console.log('\nForm data to submit:');
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

// Example usage
(async () => {
  console.log('=== Form Validation System Example ===');
  
  // Create form validator
  const formValidator = new FormValidator(fieldDefinitions);
  
  // Create UI controller
  const formUI = new FormUI(formValidator);
  
  // Simulate user input
  console.log('\n--- Simulating User Input ---');
  
  // Username input
  console.log('Username: "jo"');
  formUI.inputChanged('username', 'jo');
  formUI.fieldBlurred('username');
  await utils.sleep(100);
  
  // Fix username
  console.log('Username: "john"');
  formUI.inputChanged('username', 'john');
  await utils.sleep(100);
  
  // Email input
  console.log('Email: "invalid-email"');
  formUI.inputChanged('email', 'invalid-email');
  formUI.fieldBlurred('email');
  await utils.sleep(100);
  
  // Fix email
  console.log('Email: "john@example.com"');
  formUI.inputChanged('email', 'john@example.com');
  await utils.sleep(100);
  
  // Age input
  console.log('Age: "15"');
  formUI.inputChanged('age', '15');
  formUI.fieldBlurred('age');
  await utils.sleep(100);
  
  // Fix age
  console.log('Age: "25"');
  formUI.inputChanged('age', '25');
  await utils.sleep(100);
  
  // Password input
  console.log('Password: "weak"');
  formUI.inputChanged('password', 'weak');
  formUI.fieldBlurred('password');
  await utils.sleep(100);
  
  // Fix password
  console.log('Password: "StrongPass1"');
  formUI.inputChanged('password', 'StrongPass1');
  await utils.sleep(100);
  
  // Confirm password (mismatch)
  console.log('Confirm Password: "DifferentPass1"');
  formUI.inputChanged('confirmPassword', 'DifferentPass1');
  formUI.fieldBlurred('confirmPassword');
  await utils.sleep(100);
  
  // Fix confirm password
  console.log('Confirm Password: "StrongPass1"');
  formUI.inputChanged('confirmPassword', 'StrongPass1');
  await utils.sleep(100);
  
  // Submit form
  console.log('\n--- Submitting Form ---');
  formUI.submitForm();
})();
```

---

## Event-Driven Architecture

Build an event-driven microservices simulation using command bus, event bus, and state management.

```javascript
const { commandBus, eventBus, stateManager, scheduler, retry, utils, fsm } = require('./src');

// Service states
const SERVICE_STATES = {
  IDLE: 'idle',
  STARTING: 'starting',
  RUNNING: 'running',
  STOPPING: 'stopping',
  ERROR: 'error'
};

// Base service class
class Service {
  constructor(name, commandBus, eventBus) {
    this.name = name;
    this.commandBus = commandBus;
    this.eventBus = eventBus;
    this.state = SERVICE_STATES.IDLE;
    this.fsm = this.createFSM();
    this.setupCommandHandlers();
    this.setupEventHandlers();
  }
  
  createFSM() {
    return fsm.createFSM({
      initial: SERVICE_STATES.IDLE,
      states: {
        [SERVICE_STATES.IDLE]: {
          on: { start: SERVICE_STATES.STARTING }
        },
        [SERVICE_STATES.STARTING]: {
          on: { ready: SERVICE_STATES.RUNNING, error: SERVICE_STATES.ERROR }
        },
        [SERVICE_STATES.RUNNING]: {
          on: { stop: SERVICE_STATES.STOPPING, error: SERVICE_STATES.ERROR }
        },
        [SERVICE_STATES.STOPPING]: {
          on: { stopped: SERVICE_STATES.IDLE, error: SERVICE_STATES.ERROR }
        },
        [SERVICE_STATES.ERROR]: {
          on: { recover: SERVICE_STATES.STARTING, stop: SERVICE_STATES.STOPPING }
        }
      }
    });
  }
  
  setupCommandHandlers() {
    this.commandBus.register(`${this.name}:start`, async () => {
      if (this.fsm.can('start')) {
        this.fsm.send('start');
        await this.start();
      }
    });
    
    this.commandBus.register(`${this.name}:stop`, async () => {
      if (this.fsm.can('stop')) {
        this.fsm.send('stop');
        await this.stop();
      }
    });
    
    this.commandBus.register(`${this.name}:restart`, async () => {
      await this.commandBus.dispatch(`${this.name}:stop`);
      await utils.sleep(1000);
      await this.commandBus.dispatch(`${this.name}:start`);
    });
  }
  
  setupEventHandlers() {
    this.eventBus.on('system:shutdown', async () => {
      await this.commandBus.dispatch(`${this.name}:stop`);
    });
    
    this.eventBus.on('system:startup', async () => {
      await this.commandBus.dispatch(`${this.name}:start`);
    });
  }
  
  async start() {
    console.log(`🚀 Starting ${this.name} service...`);
    
    try {
      await this.onStart();
      this.fsm.send('ready');
      this.state = SERVICE_STATES.RUNNING;
      this.eventBus.emit('service:started', { service: this.name });
      console.log(`✅ ${this.name} service started`);
    } catch (error) {
      this.fsm.send('error');
      this.state = SERVICE_STATES.ERROR;
      this.eventBus.emit('service:error', { service: this.name, error: error.message });
      console.error(`❌ ${this.name} service failed to start:`, error.message);
    }
  }
  
  async stop() {
    console.log(`🛑 Stopping ${this.name} service...`);
    
    try {
      await this.onStop();
      this.fsm.send('stopped');
      this.state = SERVICE_STATES.IDLE;
      this.eventBus.emit('service:stopped', { service: this.name });
      console.log(`✅ ${this.name} service stopped`);
    } catch (error) {
      this.fsm.send('error');
      this.state = SERVICE_STATES.ERROR;
      this.eventBus.emit('service:error', { service: this.name, error: error.message });
      console.error(`❌ ${this.name} service failed to stop:`, error.message);
    }
  }
  
  async onStart() {
    // Override in subclasses
  }
  
  async onStop() {
    // Override in subclasses
  }
}

// User service
class UserService extends Service {
  constructor(commandBus, eventBus) {
    super('UserService', commandBus, eventBus);
    this.users = new Map();
    this.setupUserCommands();
  }
  
  setupUserCommands() {
    this.commandBus.register('user:create', async (userData) => {
      if (this.state !== SERVICE_STATES.RUNNING) {
        throw new Error('UserService is not running');
      }
      
      const user = {
        id: Date.now(),
        ...userData,
        createdAt: new Date().toISOString()
      };
      
      this.users.set(user.id, user);
      this.eventBus.emit('user:created', { user });
      console.log(`👤 Created user: ${user.name} (${user.id})`);
      
      return user;
    });
    
    this.commandBus.register('user:get', async (userId) => {
      if (this.state !== SERVICE_STATES.RUNNING) {
        throw new Error('UserService is not running');
      }
      
      const user = this.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      return user;
    });
  }
  
  async onStart() {
    // Initialize with some demo users
    await this.commandBus.dispatch('user:create', { name: 'John Doe', email: 'john@example.com' });
    await this.commandBus.dispatch('user:create', { name: 'Jane Smith', email: 'jane@example.com' });
  }
  
  async onStop() {
    this.users.clear();
  }
}

// Notification service
class NotificationService extends Service {
  constructor(commandBus, eventBus) {
    super('NotificationService', commandBus, eventBus);
    this.setupNotificationHandlers();
  }
  
  setupNotificationHandlers() {
    this.eventBus.on('user:created', async ({ user }) => {
      await this.sendNotification({
        type: 'welcome',
        recipient: user.email,
        subject: 'Welcome to our platform!',
        body: `Hello ${user.name}, welcome to our platform!`
      });
    });
    
    this.commandBus.register('notification:send', async (notification) => {
      if (this.state !== SERVICE_STATES.RUNNING) {
        throw new Error('NotificationService is not running');
      }
      
      await this.sendNotification(notification);
    });
  }
  
  async sendNotification(notification) {
    console.log(`📧 Sending ${notification.type} notification to ${notification.recipient}`);
    await utils.sleep(100 + Math.random() * 200);
    
    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error('SMTP server unavailable');
    }
    
    this.eventBus.emit('notification:sent', { notification });
    console.log(`✅ Notification sent to ${notification.recipient}`);
  }
}

// Analytics service
class AnalyticsService extends Service {
  constructor(commandBus, eventBus) {
    super('AnalyticsService', commandBus, eventBus);
    this.events = [];
    this.setupAnalyticsHandlers();
  }
  
  setupAnalyticsHandlers() {
    this.eventBus.on('*', (eventName, data) => {
      if (this.state === SERVICE_STATES.RUNNING) {
        this.trackEvent(eventName, data);
      }
    });
    
    this.commandBus.register('analytics:report', async () => {
      if (this.state !== SERVICE_STATES.RUNNING) {
        throw new Error('AnalyticsService is not running');
      }
      
      return this.generateReport();
    });
  }
  
  trackEvent(eventName, data) {
    this.events.push({
      event: eventName,
      data,
      timestamp: Date.now()
    });
    
    // Keep only last 100 events
    if (this.events.length > 100) {
      this.events.shift();
    }
  }
  
  generateReport() {
    const eventCounts = {};
    this.events.forEach(({ event }) => {
      eventCounts[event] = (eventCounts[event] || 0) + 1;
    });
    
    return {
      totalEvents: this.events.length,
      eventCounts,
      timeRange: {
        from: this.events[0]?.timestamp,
        to: this.events[this.events.length - 1]?.timestamp
      }
    };
  }
}

// Service orchestrator
class ServiceOrchestrator {
  constructor() {
    this.commandBus = commandBus.createCommandBus();
    this.eventBus = eventBus;
    this.services = [];
    this.healthCheckInterval = null;
  }
  
  addService(service) {
    this.services.push(service);
  }
  
  async startAll() {
    console.log('🌟 Starting all services...');
    
    // Start services in order
    for (const service of this.services) {
      await this.commandBus.dispatch(`${service.name}:start`);
      await utils.sleep(500);
    }
    
    this.eventBus.emit('system:started');
    this.startHealthChecks();
    
    console.log('✅ All services started');
  }
  
  async stopAll() {
    console.log('🛑 Stopping all services...');
    
    this.stopHealthChecks();
    this.eventBus.emit('system:shutdown');
    
    // Stop services in reverse order
    for (const service of [...this.services].reverse()) {
      await this.commandBus.dispatch(`${service.name}:stop`);
      await utils.sleep(500);
    }
    
    console.log('✅ All services stopped');
  }
  
  startHealthChecks() {
    this.healthCheckInterval = scheduler.schedule('health-check', 5000, async () => {
      await this.performHealthCheck();
    });
  }
  
  stopHealthChecks() {
    if (this.healthCheckInterval) {
      scheduler.cancel('health-check');
      this.healthCheckInterval = null;
    }
  }
  
  async performHealthCheck() {
    console.log('\n🏥 Health Check');
    
    for (const service of this.services) {
      const status = service.state === SERVICE_STATES.RUNNING ? '🟢' : '🔴';
      console.log(`  ${status} ${service.name}: ${service.state}`);
    }
  }
  
  async getSystemStatus() {
    const report = await this.commandBus.dispatch('analytics:report');
    return {
      services: this.services.map(s => ({
        name: s.name,
        state: s.state
      })),
      analytics: report
    };
  }
}

// Example usage
(async () => {
  console.log('=== Event-Driven Architecture Example ===');
  
  // Create orchestrator
  const orchestrator = new ServiceOrchestrator();
  
  // Create and register services
  const userService = new UserService(orchestrator.commandBus, orchestrator.eventBus);
  const notificationService = new NotificationService(orchestrator.commandBus, orchestrator.eventBus);
  const analyticsService = new AnalyticsService(orchestrator.commandBus, orchestrator.eventBus);
  
  orchestrator.addService(userService);
  orchestrator.addService(notificationService);
  orchestrator.addService(analyticsService);
  
  // Start all services
  await orchestrator.startAll();
  
  // Simulate some operations
  console.log('\n--- Simulating Operations ---');
  
  // Create users
  await orchestrator.commandBus.dispatch('user:create', {
    name: 'Alice Johnson',
    email: 'alice@example.com'
  });
  
  await utils.sleep(1000);
  
  await orchestrator.commandBus.dispatch('user:create', {
    name: 'Bob Wilson',
    email: 'bob@example.com'
  });
  
  await utils.sleep(1000);
  
  // Send custom notification
  await orchestrator.commandBus.dispatch('notification:send', {
    type: 'announcement',
    recipient: 'all',
    subject: 'System Maintenance',
    body: 'Scheduled maintenance tonight at 2 AM'
  });
  
  await utils.sleep(2000);
  
  // Get system status
  const status = await orchestrator.getSystemStatus();
  console.log('\n📊 System Status:');
  console.log(JSON.stringify(status, null, 2));
  
  // Let it run for a bit
  await utils.sleep(5000);
  
  // Stop all services
  await orchestrator.stopAll();
})();
```

---

## Conclusion

These examples demonstrate how Forever library modules can be combined to build sophisticated applications:

1. **Simple Web Server** - Shows routing, middleware, and logging integration
2. **Data Processing Pipeline** - Demonstrates pipeline processing, memoization, and queuing
3. **Stateful Todo Application** - Illustrates state management, validation, and event-driven updates
4. **API Client with Retry and Caching** - Shows robust error handling, caching, and rate limiting
5. **Real-time Dashboard** - Demonstrates observables, schedulers, and reactive programming
6. **Task Queue Worker** - Illustrates dependency injection, retry logic, and concurrent processing
7. **Form Validation System** - Shows comprehensive validation with real-time feedback
8. **Event-Driven Architecture** - Demonstrates microservices communication patterns

Each example is self-contained and demonstrates best practices for combining different Forever modules to solve real-world problems. The examples are designed to be educational and can serve as starting points for building more complex applications.
