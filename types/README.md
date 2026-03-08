# Forever – TypeScript Types

This directory contains the official TypeScript type definitions for the **Forever** library.

## Installation

The types are included automatically when you install the package. No `@types/` package is needed.

If you are referencing the types manually, add this to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "typeRoots": ["./types"],
    "types": ["forever"]
  }
}
```

## Usage

```typescript
import {
  cache,
  eventBus,
  memoize,
  retry,
  PluginManager,
  withPlugins,
  BenchmarkResult,
  Plugin,
} from 'forever';

// Typed memoize
const expensiveCalc = memoize((n: number): number => n * n);
const result: number = expensiveCalc(42);

// Typed retry
const data = await retry<{ id: number }>(
  () => fetch('/api/data').then(r => r.json()),
  { attempts: 3, delay: 200, backoff: 'exponential' }
);

// Typed plugin
const myPlugin: Plugin = {
  beforeCall(ctx) { console.log(`Calling ${ctx.fnName}`); },
  afterCall(ctx)  { console.log(`Done in ${ctx.duration}ms`); },
};

const pm = new PluginManager();
pm.register('my-plugin', myPlugin);
```

## Available Types

| Type / Interface | Description |
|---|---|
| `Cache<K, V>` | Generic cache instance |
| `Store<T>` | Typed reactive store |
| `EventHandler<T>` | Event bus handler |
| `MiddlewareChain<T>` | Composable middleware |
| `DIContainer` | Dependency injection container |
| `Pool<T>` | Generic object pool |
| `Queue<T>` | Concurrent task queue |
| `RetryOptions` | Options for `retry()` |
| `Stream<T>` | Push-based data stream |
| `FSM<S, E>` | Finite state machine |
| `Observable<T>` | Observable/reactive stream |
| `BenchmarkResult` | Result from `performance.benchmark()` |
| `MemorySnapshot` | Heap stats snapshot |
| `MemoryLeakResult` | Result from `performance.detectMemoryLeak()` |
| `Plugin` | Plugin lifecycle hooks interface |
| `PluginManager` | Plugin registry class |
| `PluginHookContext` | Context passed to hook functions |
| `ValidationResult` | Schema validation output |
| `Schema` | Validator schema definition |
| `FieldRule` | Single field validation rule |
| `FSMConfig<S, E>` | State machine configuration |
| `LogLevel` | `'info' \| 'warn' \| 'error' \| 'debug'` |

## Generics

Many utilities accept generic type parameters for type safety:

```typescript
import { memoize, createPool, createQueue } from 'forever';

const cached = memoize<(x: number) => number>(Math.sqrt);
const pool   = pool.createPool<WebSocket>(() => new WebSocket('ws://...'));
const q      = queue.createQueue<string>({ concurrency: 4 });
```
