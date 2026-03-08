/**
 * Tests for the barrel export in src/index.js
 * Verifies all expected exports are present and functional.
 */

const barrelExports = require('../src/index');

describe('Barrel Export Tests', () => {
  
  describe('Cache and storage exports', () => {
    test('should export cache functions', () => {
      expect(barrelExports.cache).toBeDefined();
      expect(typeof barrelExports.cache.set).toBe('function');
      expect(typeof barrelExports.cache.get).toBe('function');
      expect(typeof barrelExports.cache.has).toBe('function');
      expect(typeof barrelExports.cache.delete).toBe('function');
    });

    test('should export store object', () => {
      expect(barrelExports.store).toBeDefined();
      expect(typeof barrelExports.store.set).toBe('function');
      expect(typeof barrelExports.store.get).toBe('function');
      expect(typeof barrelExports.store.has).toBe('function');
      expect(typeof barrelExports.store.delete).toBe('function');
      expect(typeof barrelExports.store.clear).toBe('function');
    });

    test('cache functions should work correctly', () => {
      barrelExports.cache.set('test', 'value', 1000);
      expect(barrelExports.cache.get('test')).toBe('value');
      expect(barrelExports.cache.has('test')).toBe(true);
      barrelExports.cache.delete('test');
      expect(barrelExports.cache.has('test')).toBe(false);
    });
  });

  describe('Event system exports', () => {
    test('should export eventBus functions', () => {
      expect(barrelExports.eventBus).toBeDefined();
      expect(typeof barrelExports.eventBus.on).toBe('function');
      expect(typeof barrelExports.eventBus.off).toBe('function');
      expect(typeof barrelExports.eventBus.emit).toBe('function');
    });

    test('eventBus functions should work correctly', () => {
      let receivedData = null;
      barrelExports.eventBus.on('test', (data) => { receivedData = data; });
      barrelExports.eventBus.emit('test', 'hello');
      expect(receivedData).toBe('hello');
    });
  });

  describe('Logging and utilities exports', () => {
    test('should export logger functions', () => {
      expect(barrelExports.logger).toBeDefined();
      expect(typeof barrelExports.logger.log).toBe('function');
    });

    test('should export utility functions', () => {
      expect(barrelExports.utils).toBeDefined();
      expect(typeof barrelExports.utils.capitalize).toBe('function');
      expect(typeof barrelExports.utils.isEmpty).toBe('function');
      expect(typeof barrelExports.utils.sleep).toBe('function');
    });

    test('utility functions should work correctly', () => {
      expect(barrelExports.utils.capitalize('hello')).toBe('Hello');
      expect(barrelExports.utils.isEmpty('')).toBe(true);
      expect(barrelExports.utils.isEmpty('test')).toBe(false);
    });
  });

  describe('Function utilities exports', () => {
    test('should export debounce and throttle', () => {
      expect(typeof barrelExports.debounce).toBe('function');
      expect(typeof barrelExports.throttle).toBe('function');
    });

    test('should export memoize functions', () => {
      expect(typeof barrelExports.memoize).toBe('function');
      expect(typeof barrelExports.memoizeAsync).toBe('function');
    });

    test('should export pipeline', () => {
      expect(typeof barrelExports.pipeline).toBe('function');
    });

    test('pipeline should work correctly', () => {
      const add1 = x => x + 1;
      const double = x => x * 2;
      const pipelineResult = barrelExports.pipeline(add1, double);
      expect(pipelineResult(3)).toBe(8); // (3 + 1) * 2 = 8
    });
  });

  describe('Decorators and middleware exports', () => {
    test('should export decorator functions', () => {
      expect(barrelExports.decorators).toBeDefined();
      expect(typeof barrelExports.decorators.readonly).toBe('function');
      expect(typeof barrelExports.decorators.logged).toBe('function');
      expect(typeof barrelExports.decorators.timed).toBe('function');
    });

    test('should export middleware creator', () => {
      expect(barrelExports.middleware).toBeDefined();
      expect(typeof barrelExports.middleware.createMiddleware).toBe('function');
    });
  });

  describe('Dependency injection and containers exports', () => {
    test('should export DI container', () => {
      expect(barrelExports.di).toBeDefined();
      expect(typeof barrelExports.di.createContainer).toBe('function');
    });

    test('should export pool creator', () => {
      expect(barrelExports.pool).toBeDefined();
      expect(typeof barrelExports.pool.createPool).toBe('function');
    });
  });

  describe('State management exports', () => {
    test('should export state manager functions', () => {
      expect(barrelExports.stateManager).toBeDefined();
      expect(typeof barrelExports.stateManager.setState).toBe('function');
      expect(typeof barrelExports.stateManager.getState).toBe('function');
      expect(typeof barrelExports.stateManager.subscribe).toBe('function');
    });
  });

  describe('Async and flow control exports', () => {
    test('should export queue creator', () => {
      expect(barrelExports.queue).toBeDefined();
      expect(typeof barrelExports.queue.createQueue).toBe('function');
    });

    test('should export retry function', () => {
      expect(typeof barrelExports.retry).toBe('function');
    });

    test('should export stream creator', () => {
      expect(barrelExports.stream).toBeDefined();
      expect(typeof barrelExports.stream.createStream).toBe('function');
    });
  });

  describe('Patterns and architectures exports', () => {
    test('should export commandBus creator', () => {
      expect(barrelExports.commandBus).toBeDefined();
      expect(typeof barrelExports.commandBus.createCommandBus).toBe('function');
    });

    test('should export FSM creator', () => {
      expect(barrelExports.fsm).toBeDefined();
      expect(typeof barrelExports.fsm.createFSM).toBe('function');
    });

    test('should export observable creator', () => {
      expect(barrelExports.observable).toBeDefined();
      expect(typeof barrelExports.observable.createObservable).toBe('function');
    });
  });

  describe('Routing and scheduling exports', () => {
    test('should export router functions', () => {
      expect(barrelExports.router).toBeDefined();
      expect(typeof barrelExports.router.addRoute).toBe('function');
      expect(typeof barrelExports.router.navigate).toBe('function');
      expect(typeof barrelExports.router.notFound).toBe('function');
    });

    test('should export scheduler functions', () => {
      expect(barrelExports.scheduler).toBeDefined();
      expect(typeof barrelExports.scheduler.schedule).toBe('function');
      expect(typeof barrelExports.scheduler.cancel).toBe('function');
      expect(typeof barrelExports.scheduler.list).toBe('function');
    });
  });

  describe('Validation and configuration exports', () => {
    test('should export validator function', () => {
      expect(barrelExports.validator).toBeDefined();
      expect(typeof barrelExports.validator.validate).toBe('function');
    });

    test('should export config object', () => {
      expect(barrelExports.config).toBeDefined();
      expect(typeof barrelExports.config).toBe('object');
      expect(barrelExports.config.name).toBeDefined();
      expect(barrelExports.config.version).toBeDefined();
    });

    test('validator should work correctly', () => {
      const result = barrelExports.validator.validate('test', { required: true, minLength: 2 });
      expect(result.valid).toBe(true);
    });
  });

  describe('Welcome function export', () => {
    test('should export greet function', () => {
      expect(typeof barrelExports.greet).toBe('function');
    });

    test('greet should return a string', () => {
      const greeting = barrelExports.greet();
      expect(typeof greeting).toBe('string');
      expect(greeting).toContain('Welcome to Forever');
    });
  });

  describe('Integration test - single import usage', () => {
    test('should allow consuming all modules via single import', () => {
      // Test that we can use multiple modules together
      barrelExports.store.set('testKey', 'testValue');
      expect(barrelExports.store.get('testKey')).toBe('testValue');
      
      const greeting = barrelExports.greet();
      expect(greeting).toContain('Forever');
      
      const pipelineResult = barrelExports.pipeline(
        x => x + 1,
        x => x * 2
      )(5);
      expect(pipelineResult).toBe(12);
    });
  });
});
