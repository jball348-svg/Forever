/**
 * Tests for the documentation examples to ensure they work correctly.
 */

const {
  cache, store, eventBus, logger, utils,
  debounce, throttle, memoize, pipeline,
  decorators, middleware, di, pool, stateManager,
  queue, retry, stream, commandBus, fsm, observable,
  router, scheduler, validator, config, greet
} = require('../src');

describe('Documentation Examples Tests', () => {
  
  beforeEach(() => {
    // Reset state between tests
    store.clear();
    eventBus.listeners = {}; // Reset event listeners
  });

  describe('Cache Example', () => {
    test('should cache and retrieve values with TTL', () => {
      const key = 'test-key';
      const value = { data: 'test' };
      const ttl = 1000;
      
      cache.set(key, value, ttl);
      
      expect(cache.get(key)).toEqual(value);
      expect(cache.has(key)).toBe(true);
      
      cache.delete(key);
      expect(cache.has(key)).toBe(false);
    });
  });

  describe('Store Example', () => {
    test('should store and retrieve key-value pairs', () => {
      store.set('user', { name: 'John', id: 123 });
      
      expect(store.get('user')).toEqual({ name: 'John', id: 123 });
      expect(store.has('user')).toBe(true);
      
      store.delete('user');
      expect(store.has('user')).toBe(false);
    });
  });

  describe('Logger Example', () => {
    test('should log messages at different levels', () => {
      // Test that log function doesn't throw errors
      expect(() => {
        logger.log('info', 'Test info message');
        logger.log('warn', 'Test warning message');
        logger.log('error', 'Test error message');
      }).not.toThrow();
    });
  });

  describe('Event Bus Example', () => {
    test('should publish and subscribe to events', (done) => {
      const testData = { message: 'test data' };
      
      eventBus.on('test-event', (data) => {
        expect(data).toEqual(testData);
        done();
      });
      
      eventBus.emit('test-event', testData);
    });

    test('should unsubscribe from events', () => {
      let callCount = 0;
      const handler = () => callCount++;
      
      eventBus.on('test-event', handler);
      eventBus.emit('test-event');
      expect(callCount).toBe(1);
      
      eventBus.off('test-event', handler);
      eventBus.emit('test-event');
      expect(callCount).toBe(1); // Should not increase
    });
  });

  describe('Utils Example', () => {
    test('should capitalize strings', () => {
      expect(utils.capitalize('hello')).toBe('Hello');
      expect(utils.capitalize('HELLO')).toBe('HELLO');
      expect(utils.capitalize('')).toBe('');
      expect(utils.capitalize(null)).toBe(null);
    });

    test('should check if values are empty', () => {
      expect(utils.isEmpty(null)).toBe(true);
      expect(utils.isEmpty(undefined)).toBe(true);
      expect(utils.isEmpty('')).toBe(true);
      expect(utils.isEmpty([])).toBe(true);
      expect(utils.isEmpty({})).toBe(true);
      expect(utils.isEmpty('test')).toBe(false);
      expect(utils.isEmpty([1])).toBe(false);
      expect(utils.isEmpty({ a: 1 })).toBe(false);
    });

    test('should sleep for specified time', async () => {
      const start = Date.now();
      await utils.sleep(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some tolerance
    });
  });

  describe('Debounce and Throttle Example', () => {
    jest.useFakeTimers();
    
    test('should debounce function calls', () => {
      let callCount = 0;
      const debouncedFn = debounce(() => callCount++, 300);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      jest.advanceTimersByTime(300);
      expect(callCount).toBe(1);
    });

    test('should throttle function calls', () => {
      let callCount = 0;
      const throttledFn = throttle(() => callCount++, 300);
      
      throttledFn();
      throttledFn();
      throttledFn();
      
      expect(callCount).toBe(1);
      
      jest.advanceTimersByTime(300);
      throttledFn();
      expect(callCount).toBe(2);
    });
    
    jest.useRealTimers();
  });

  describe('Memoize Example', () => {
    test('should cache function results', () => {
      let callCount = 0;
      const memoizedFn = memoize((x) => {
        callCount++;
        return x * 2;
      });
      
      expect(memoizedFn(5)).toBe(10);
      expect(callCount).toBe(1);
      
      expect(memoizedFn(5)).toBe(10);
      expect(callCount).toBe(1); // Should not increase
      
      expect(memoizedFn(10)).toBe(20);
      expect(callCount).toBe(2);
    });

    test('should cache async function results', async () => {
      let callCount = 0;
      const memoizedAsyncFn = memoizeAsync(async (x) => {
        callCount++;
        await utils.sleep(10);
        return x * 3;
      });
      
      const result1 = await memoizedAsyncFn(5);
      expect(result1).toBe(15);
      expect(callCount).toBe(1);
      
      const result2 = await memoizedAsyncFn(5);
      expect(result2).toBe(15);
      expect(callCount).toBe(1); // Should not increase
    });
  });

  describe('Pipeline Example', () => {
    test('should compose functions in pipeline', () => {
      const add1 = x => x + 1;
      const double = x => x * 2;
      const toString = x => x.toString();
      
      const pipelineFn = pipeline(add1, double, toString);
      
      expect(pipelineFn(3)).toBe('8'); // (3 + 1) * 2 = 8, then to string
    });
  });

  describe('Decorators Example', () => {
    test('should make properties readonly', () => {
      const obj = { value: 'test' };
      decorators.readonly(obj, 'value');
      
      expect(() => {
        obj.value = 'changed';
      }).toThrow();
      
      expect(obj.value).toBe('test');
    });

    test('should log function calls', () => {
      const add = (a, b) => a + b;
      const loggedAdd = decorators.logged(add, 'add');
      
      // Test that it doesn't change the function behavior
      expect(loggedAdd(2, 3)).toBe(5);
    });

    test('should time function execution', () => {
      const slowFn = () => {
        for (let i = 0; i < 1000000; i++) {}
        return 'done';
      };
      const timedFn = decorators.timed(slowFn, 'slow');
      
      expect(timedFn()).toBe('done');
    });
  });

  describe('Middleware Example', () => {
    test('should execute middleware chain', async () => {
      const mw = middleware.createMiddleware();
      const context = { value: 0 };
      
      mw.use(async (ctx, next) => {
        ctx.value += 1;
        await next();
        ctx.value += 3;
      });
      
      mw.use(async (ctx, next) => {
        ctx.value += 2;
        await next();
      });
      
      mw.use(async (ctx, next) => {
        ctx.value += 4;
        await next();
      });
      
      await mw.run(context);
      
      expect(context.value).toBe(10); // 1 + 2 + 4 + 3
    });
  });

  describe('Dependency Injection Example', () => {
    test('should resolve dependencies', () => {
      const container = di.createContainer();
      
      container.register('service', () => ({ name: 'test-service' }));
      container.singleton('config', () => ({ debug: true }));
      
      const service = container.resolve('service');
      const config = container.resolve('config');
      const configAgain = container.resolve('config'); // Should be same instance
      
      expect(service.name).toBe('test-service');
      expect(config.debug).toBe(true);
      expect(config).toBe(configAgain); // Same instance for singleton
    });
  });

  describe('Pool Example', () => {
    test('should pool objects correctly', async () => {
      const pool = pool.createPool(() => ({ id: Math.random() }), { max: 2 });
      
      const obj1 = await pool.acquire();
      const obj2 = await pool.acquire();
      
      expect(obj1).toBeDefined();
      expect(obj2).toBeDefined();
      expect(obj1).not.toBe(obj2);
      
      pool.release(obj1);
      pool.release(obj2);
      
      expect(pool.size()).toBe(2);
    });
  });

  describe('State Manager Example', () => {
    test('should manage state with events', (done) => {
      let changeReceived = false;
      
      stateManager.subscribe((data) => {
        expect(data.key).toBe('test');
        expect(data.value).toBe('value');
        changeReceived = true;
        done();
      });
      
      stateManager.setState('test', 'value');
      expect(stateManager.getState('test')).toBe('value');
    });
  });

  describe('Queue Example', () => {
    test('should process tasks with concurrency control', async () => {
      const taskQueue = queue.createQueue(2);
      let processedCount = 0;
      
      const createTask = (id) => async () => {
        await utils.sleep(50);
        processedCount++;
        return id;
      };
      
      const tasks = [
        taskQueue.add(createTask(1)),
        taskQueue.add(createTask(2)),
        taskQueue.add(createTask(3))
      ];
      
      const results = await Promise.all(tasks);
      
      expect(results).toEqual([1, 2, 3]);
      expect(processedCount).toBe(3);
    });
  });

  describe('Retry Example', () => {
    test('should retry function on failure', async () => {
      let attempts = 0;
      const failingFn = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };
      
      const result = await retry(failingFn, { attempts: 3, delayMs: 10 });
      
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    test('should fail after max attempts', async () => {
      const alwaysFailingFn = async () => {
        throw new Error('Permanent failure');
      };
      
      await expect(
        retry(alwaysFailingFn, { attempts: 2, delayMs: 10 })
      ).rejects.toThrow('Permanent failure');
    });
  });

  describe('Stream Example', () => {
    test('should stream data correctly', async () => {
      const dataStream = stream.createStream();
      const chunks = [];
      
      // Producer
      setTimeout(() => {
        dataStream.write('chunk1');
        dataStream.write('chunk2');
        dataStream.end();
      }, 50);
      
      // Consumer
      let chunk;
      while ((chunk = await dataStream.read()) !== undefined) {
        chunks.push(chunk);
      }
      
      expect(chunks).toEqual(['chunk1', 'chunk2']);
      expect(dataStream.ended).toBe(true);
    });
  });

  describe('Command Bus Example', () => {
    test('should register and dispatch commands', async () => {
      const bus = commandBus.createCommandBus();
      
      bus.register('test', async (data) => `processed: ${data}`);
      
      const result = await bus.dispatch('test', 'hello');
      
      expect(result).toBe('processed: hello');
    });

    test('should throw error for unregistered command', async () => {
      const bus = commandBus.createCommandBus();
      
      await expect(
        bus.dispatch('nonexistent', 'data')
      ).rejects.toThrow("No handler registered for command 'nonexistent'");
    });
  });

  describe('Finite State Machine Example', () => {
    test('should manage state transitions', () => {
      const trafficLight = fsm.createFSM({
        initial: 'red',
        states: {
          red: { on: { timer: 'green' } },
          green: { on: { timer: 'yellow' } },
          yellow: { on: { timer: 'red' } }
        }
      });
      
      expect(trafficLight.state).toBe('red');
      expect(trafficLight.can('timer')).toBe(true);
      
      trafficLight.send('timer');
      expect(trafficLight.state).toBe('green');
      
      trafficLight.send('timer');
      expect(trafficLight.state).toBe('yellow');
      
      trafficLight.send('timer');
      expect(trafficLight.state).toBe('red');
    });

    test('should prevent invalid transitions', () => {
      const fsmInstance = fsm.createFSM({
        initial: 'idle',
        states: {
          idle: { on: { start: 'running' } },
          running: { on: { stop: 'idle' } }
        }
      });
      
      expect(fsmInstance.can('invalid')).toBe(false);
      
      expect(() => {
        fsmInstance.send('invalid');
      }).toThrow("Invalid transition: 'invalid' from state 'idle'");
    });
  });

  describe('Observable Example', () => {
    test('should emit values to subscribers', (done) => {
      const values = [];
      
      const obs = observable.createObservable((subscriber) => {
        subscriber.next(1);
        subscriber.next(2);
        subscriber.next(3);
        subscriber.complete();
      });
      
      obs.subscribe({
        next: (value) => values.push(value),
        complete: () => {
          expect(values).toEqual([1, 2, 3]);
          done();
        }
      });
    });
  });

  describe('Router Example', () => {
    test('should route paths to handlers', () => {
      router.addRoute('/', () => 'home');
      router.addRoute('/users/:id', (params) => `user ${params.id}`);
      
      expect(router.navigate('/')).toBe('home');
      expect(router.navigate('/users/123')).toBe('user 123');
      expect(router.navigate('/unknown')).toBeNull();
    });

    test('should handle not found routes', () => {
      router.notFound((path) => `404: ${path}`);
      
      expect(router.navigate('/missing')).toBe('404: /missing');
    });
  });

  describe('Scheduler Example', () => {
    jest.useFakeTimers();
    
    test('should schedule and cancel tasks', () => {
      let taskExecuted = false;
      
      scheduler.schedule('test-task', 1000, () => {
        taskExecuted = true;
      });
      
      expect(scheduler.list()).toContain('test-task');
      
      jest.advanceTimersByTime(1000);
      expect(taskExecuted).toBe(true);
      
      const cancelled = scheduler.cancel('test-task');
      expect(cancelled).toBe(true);
      expect(scheduler.list()).not.toContain('test-task');
    });
    
    jest.useRealTimers();
  });

  describe('Validator Example', () => {
    test('should validate values against rules', () => {
      const result1 = validator.validate('test', {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 10
      });
      
      expect(result1.valid).toBe(true);
      expect(result1.errors).toEqual([]);
      
      const result2 = validator.validate('', {
        required: true,
        minLength: 5
      });
      
      expect(result2.valid).toBe(false);
      expect(result2.errors).toContain('Value is required');
    });

    test('should validate numbers', () => {
      const result = validator.validate(25, {
        type: 'number',
        min: 18,
        max: 120
      });
      
      expect(result.valid).toBe(true);
      
      const invalidResult = validator.validate(15, {
        type: 'number',
        min: 18
      });
      
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toContain('Minimum value is 18');
    });
  });

  describe('Config Example', () => {
    test('should have required config properties', () => {
      expect(config.name).toBeDefined();
      expect(config.version).toBeDefined();
      expect(config.description).toBeDefined();
      expect(config.startedAt).toBeDefined();
    });
  });

  describe('Greet Example', () => {
    test('should return welcome message', () => {
      const message = greet();
      
      expect(typeof message).toBe('string');
      expect(message).toContain('Welcome to Forever');
      expect(message).toContain('self-evolving');
    });
  });

  describe('Integration Example', () => {
    test('should work with barrel exports', () => {
      // Test that all barrel exports are available
      expect(cache).toBeDefined();
      expect(store).toBeDefined();
      expect(eventBus).toBeDefined();
      expect(logger).toBeDefined();
      expect(utils).toBeDefined();
      
      // Test that namespaced exports work
      expect(cache.set).toBeDefined();
      expect(cache.get).toBeDefined();
      expect(eventBus.on).toBeDefined();
      expect(eventBus.emit).toBeDefined();
      expect(logger.log).toBeDefined();
      expect(utils.capitalize).toBeDefined();
    });
  });
});
