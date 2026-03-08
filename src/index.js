/**
 * Barrel export for all modules in the src/ directory.
 * Provides a single import point for all public APIs.
 */

// Cache and storage
const { set, get, has, delete: deleteFromCache } = require('./cache');
const store = require('./store');

// Event systems
const { on, off, emit } = require('./eventBus');

// Logging and utilities
const { log } = require('./logger');
const { capitalize, isEmpty, sleep } = require('./utils');

// Function utilities
const { debounce, throttle } = require('./debounce');
const { memoize, memoizeAsync } = require('./memoize');
const { pipeline } = require('./pipeline');

// Decorators and middleware
const { readonly, logged, timed } = require('./decorators');
const { createMiddleware } = require('./middleware');

// Dependency injection and containers
const { createContainer } = require('./di');
const { createPool } = require('./pool');

// State management
const { setState, getState, subscribe } = require('./stateManager');

// Async and flow control
const { createQueue } = require('./queue');
const { retry } = require('./retry');
const { createStream } = require('./stream');

// Patterns and architectures
const { createCommandBus } = require('./commandBus');
const { createFSM } = require('./fsm');
const { createObservable } = require('./observable');

// Routing and scheduling
const { addRoute, navigate, notFound } = require('./router');
const { schedule, cancel, list } = require('./scheduler');

// Validation and configuration
const { validate } = require('./validator');
const config = require('./config');

// Welcome/greeting
const { greet } = require('./greet');

// Performance monitoring
const performance = require('./performance');

// Plugin system
const { PluginManager, withPlugins, loggingPlugin, timingPlugin } = require('./plugins');

// Health monitoring
const health = require('./health');
const { configure, start, stop, getStatus } = require('./healthServer');

// Metrics and monitoring
const metrics = require('./metrics');

// Rate limiting
const { createRateLimiter, createTokenBucket, createSlidingWindow, createFixedWindow } = require('./ratelimiter');

// Circuit breaker
const { createCircuitBreaker, CircuitOpenError } = require('./circuitbreaker');

// KV Store
const { createKVStore } = require('./kvstore');

// Structured logger
const { createLogger } = require('./structuredLogger');

// Re-export everything under sensible namespaces
module.exports = {
  // Cache and storage
  cache: { set, get, has, delete: deleteFromCache },
  store,
  
  // Events
  eventBus: { on, off, emit },
  
  // Logging and utilities
  logger: { log },
  utils: { capitalize, isEmpty, sleep },
  
  // Function utilities
  debounce,
  throttle,
  memoize,
  memoizeAsync,
  pipeline,
  
  // Decorators and middleware
  decorators: { readonly, logged, timed },
  middleware: { createMiddleware },
  
  // Dependency injection and containers
  di: { createContainer },
  pool: { createPool },
  
  // State management
  stateManager: { setState, getState, subscribe },
  
  // Async and flow control
  queue: { createQueue },
  retry,
  stream: { createStream },
  
  // Patterns and architectures
  commandBus: { createCommandBus },
  fsm: { createFSM },
  observable: { createObservable },
  
  // Routing and scheduling
  router: { addRoute, navigate, notFound },
  scheduler: { schedule, cancel, list },
  
  // Validation and configuration
  validator: { validate },
  config,
  
  // Welcome
  greet,

  // Performance monitoring
  performance,

  // Plugin system
  plugins: { PluginManager, withPlugins, loggingPlugin, timingPlugin },

  // Health monitoring
  health,
  healthServer: { configure, start, stop, getStatus },

  // Metrics and monitoring
  metrics,

  // Rate limiting
  rateLimiter: { createRateLimiter, createTokenBucket, createSlidingWindow, createFixedWindow },

  // Circuit breaker
  circuitBreaker: { createCircuitBreaker, CircuitOpenError },

  // KV Store with TTL and LRU eviction
  kvstore: { createKVStore },

  // Structured logger
  structuredLogger: { createLogger },
};
