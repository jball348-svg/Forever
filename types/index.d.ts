/**
 * Forever Library – TypeScript Type Definitions
 * @module forever
 */

// ────────────────────────────────────────────────────────────────────────────────
// Cache
// ────────────────────────────────────────────────────────────────────────────────

export interface CacheOptions {
  maxSize?: number;
  ttl?: number;
}

export interface Cache<K = string, V = unknown> {
  set(key: K, value: V): void;
  get(key: K): V | undefined;
  has(key: K): boolean;
  delete(key: K): boolean;
  clear(): void;
  size(): number;
}

export declare const cache: {
  set(key: string, value: unknown): void;
  get(key: string): unknown;
  has(key: string): boolean;
  delete(key: string): boolean;
};

// ────────────────────────────────────────────────────────────────────────────────
// Store
// ────────────────────────────────────────────────────────────────────────────────

export interface Store<T = Record<string, unknown>> {
  get(): T;
  set(value: T): void;
  update(updater: (state: T) => T): void;
  subscribe(listener: (state: T) => void): () => void;
}

export declare const store: Store;

// ────────────────────────────────────────────────────────────────────────────────
// EventBus
// ────────────────────────────────────────────────────────────────────────────────

export type EventHandler<T = unknown> = (payload: T) => void;

export declare const eventBus: {
  on<T = unknown>(event: string, handler: EventHandler<T>): () => void;
  off(event: string, handler: EventHandler): void;
  emit<T = unknown>(event: string, payload?: T): void;
};

// ────────────────────────────────────────────────────────────────────────────────
// Logger
// ────────────────────────────────────────────────────────────────────────────────

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export declare const logger: {
  log(level: LogLevel, message: string, ...args: unknown[]): void;
};

// ────────────────────────────────────────────────────────────────────────────────
// Utils
// ────────────────────────────────────────────────────────────────────────────────

export declare const utils: {
  capitalize(str: string): string;
  isEmpty(value: unknown): boolean;
  sleep(ms: number): Promise<void>;
};

// ────────────────────────────────────────────────────────────────────────────────
// Debounce / Throttle
// ────────────────────────────────────────────────────────────────────────────────

export declare function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): T & { cancel(): void; flush(): void };

export declare function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): T & { cancel(): void };

// ────────────────────────────────────────────────────────────────────────────────
// Memoize
// ────────────────────────────────────────────────────────────────────────────────

export declare function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options?: { maxSize?: number; resolver?: (...args: Parameters<T>) => string }
): T & { cache: Map<string, ReturnType<T>> };

export declare function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: { maxSize?: number }
): T;

// ────────────────────────────────────────────────────────────────────────────────
// Pipeline
// ────────────────────────────────────────────────────────────────────────────────

export declare function pipeline<T>(
  ...fns: Array<(value: any) => any>
): (input: T) => any;

// ────────────────────────────────────────────────────────────────────────────────
// Decorators
// ────────────────────────────────────────────────────────────────────────────────

export declare const decorators: {
  readonly<T extends object>(obj: T): Readonly<T>;
  logged<T extends (...args: any[]) => any>(fn: T, label?: string): T;
  timed<T extends (...args: any[]) => any>(fn: T, label?: string): T;
};

// ────────────────────────────────────────────────────────────────────────────────
// Middleware
// ────────────────────────────────────────────────────────────────────────────────

export type MiddlewareFn<T = unknown> = (
  context: T,
  next: () => Promise<void>
) => Promise<void>;

export interface MiddlewareChain<T = unknown> {
  use(fn: MiddlewareFn<T>): this;
  run(context: T): Promise<void>;
}

export declare const middleware: {
  createMiddleware<T = unknown>(): MiddlewareChain<T>;
};

// ────────────────────────────────────────────────────────────────────────────────
// Dependency Injection
// ────────────────────────────────────────────────────────────────────────────────

export interface DIContainer {
  register<T>(name: string, factory: () => T): void;
  resolve<T>(name: string): T;
  has(name: string): boolean;
}

export declare const di: {
  createContainer(): DIContainer;
};

// ────────────────────────────────────────────────────────────────────────────────
// Pool
// ────────────────────────────────────────────────────────────────────────────────

export interface Pool<T> {
  acquire(): T;
  release(item: T): void;
  size(): number;
  available(): number;
}

export declare const pool: {
  createPool<T>(factory: () => T, options?: { maxSize?: number }): Pool<T>;
};

// ────────────────────────────────────────────────────────────────────────────────
// State Manager
// ────────────────────────────────────────────────────────────────────────────────

export declare const stateManager: {
  setState<T>(key: string, value: T): void;
  getState<T>(key: string): T | undefined;
  subscribe(key: string, listener: (value: unknown) => void): () => void;
};

// ────────────────────────────────────────────────────────────────────────────────
// Queue
// ────────────────────────────────────────────────────────────────────────────────

export interface Queue<T = unknown> {
  add(task: () => Promise<T>): void;
  drain?(): Promise<void>;
  size(): number;
  clear(): void;
}

export declare const queue: {
  createQueue<T = unknown>(options?: { concurrency?: number }): Queue<T>;
};

// ────────────────────────────────────────────────────────────────────────────────
// Retry
// ────────────────────────────────────────────────────────────────────────────────

export interface RetryOptions {
  attempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  onRetry?: (error: Error, attempt: number) => void;
}

export declare function retry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T>;

// ────────────────────────────────────────────────────────────────────────────────
// Stream
// ────────────────────────────────────────────────────────────────────────────────

export interface Stream<T> {
  push(value: T): void;
  subscribe(listener: (value: T) => void): () => void;
  map<U>(fn: (value: T) => U): Stream<U>;
  filter(predicate: (value: T) => boolean): Stream<T>;
  take(n: number): Stream<T>;
}

export declare const stream: {
  createStream<T>(): Stream<T>;
};

// ────────────────────────────────────────────────────────────────────────────────
// CommandBus
// ────────────────────────────────────────────────────────────────────────────────

export interface CommandBus {
  register(command: string, handler: (payload: unknown) => unknown): void;
  execute<T = unknown>(command: string, payload?: unknown): T;
}

export declare const commandBus: {
  createCommandBus(): CommandBus;
};

// ────────────────────────────────────────────────────────────────────────────────
// Finite State Machine
// ────────────────────────────────────────────────────────────────────────────────

export interface FSMConfig<S extends string = string, E extends string = string> {
  initial: S;
  states: Record<S, {
    on?: Partial<Record<E, S>>;
    onEnter?: () => void;
    onExit?: () => void;
  }>;
}

export interface FSM<S extends string = string, E extends string = string> {
  state: S;
  send(event: E): void;
  can(event: E): boolean;
  matches(state: S): boolean;
}

export declare const fsm: {
  createFSM<S extends string = string, E extends string = string>(
    config: FSMConfig<S, E>
  ): FSM<S, E>;
};

// ────────────────────────────────────────────────────────────────────────────────
// Observable
// ────────────────────────────────────────────────────────────────────────────────

export interface Observable<T> {
  subscribe(observer: { next?(v: T): void; error?(e: Error): void; complete?(): void }): { unsubscribe(): void };
  pipe<U>(...operators: Array<(obs: Observable<any>) => Observable<any>>): Observable<U>;
}

export declare const observable: {
  createObservable<T>(subscribe: (observer: {
    next(v: T): void;
    error(e: Error): void;
    complete(): void;
  }) => void | (() => void)): Observable<T>;
};

// ────────────────────────────────────────────────────────────────────────────────
// Router
// ────────────────────────────────────────────────────────────────────────────────

export type RouteHandler = (params: Record<string, string>) => void;

export declare const router: {
  addRoute(path: string, handler: RouteHandler): void;
  navigate(path: string): void;
  notFound(handler: () => void): void;
};

// ────────────────────────────────────────────────────────────────────────────────
// Scheduler
// ────────────────────────────────────────────────────────────────────────────────

export interface ScheduledTask {
  id: string;
  fn: () => void;
  interval: number;
}

export declare const scheduler: {
  schedule(fn: () => void, interval: number): string;
  cancel(id: string): void;
  list(): ScheduledTask[];
};

// ────────────────────────────────────────────────────────────────────────────────
// Validator
// ────────────────────────────────────────────────────────────────────────────────

export interface FieldRule {
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: unknown[];
}

export type Schema = Record<string, FieldRule>;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export declare const validator: {
  validate(schema: Schema, data: Record<string, unknown>): ValidationResult;
};

// ────────────────────────────────────────────────────────────────────────────────
// Config
// ────────────────────────────────────────────────────────────────────────────────

export declare const config: Record<string, unknown>;

// ────────────────────────────────────────────────────────────────────────────────
// Greet
// ────────────────────────────────────────────────────────────────────────────────

export declare function greet(name?: string): string;

// ────────────────────────────────────────────────────────────────────────────────
// Performance
// ────────────────────────────────────────────────────────────────────────────────

export interface MeasureResult<T> {
  result: T;
  duration: number;
}

export interface BenchmarkResult {
  name: string;
  iterations: number;
  mean: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
  stddev: number;
  memDeltaBytes: number;
  timestamp: string;
}

export interface MemorySnapshot {
  heapUsed: number;
  heapTotal: number;
  external: number;
}

export interface MemoryLeakResult {
  leaked: boolean;
  growthBytes: number;
}

export interface PerformanceHistoryEntry {
  name: string;
  duration: number;
  memDelta?: number;
  timestamp: string;
  success?: boolean;
}

export declare const performance: {
  measureSync<T>(fn: (...args: any[]) => T, ...args: any[]): MeasureResult<T>;
  measureAsync<T>(fn: (...args: any[]) => Promise<T>, ...args: any[]): Promise<MeasureResult<T>>;
  memorySnapshot(): MemorySnapshot;
  monitor<T extends (...args: any[]) => any>(name: string, fn: T): (...args: Parameters<T>) => Promise<ReturnType<T>>;
  benchmark(name: string, fn: () => any, options?: { iterations?: number; warmup?: boolean }): Promise<BenchmarkResult>;
  setBaseline(name: string, durationMs: number): void;
  detectMemoryLeak(fn: () => any, options?: { iterations?: number; thresholdBytes?: number }): Promise<MemoryLeakResult>;
  getHistory(): PerformanceHistoryEntry[];
  clearHistory(): void;
  exportJSON(): string;
  exportCSV(): string;
};

// ────────────────────────────────────────────────────────────────────────────────
// Plugin System
// ────────────────────────────────────────────────────────────────────────────────

export interface PluginHookContext {
  fnName: string;
  args: unknown[];
  startTime: number;
  result?: unknown;
  error?: Error;
  endTime?: number;
  duration?: number;
}

export interface Plugin {
  beforeCall?(context: PluginHookContext): void | Promise<void>;
  afterCall?(context: PluginHookContext): void | Promise<void>;
  onError?(context: PluginHookContext): void | Promise<void>;
}

export declare class PluginManager {
  register(name: string, plugin: Plugin): this;
  unregister(name: string): boolean;
  getPlugin(name: string): Plugin | undefined;
  listPlugins(): string[];
  [Symbol.iterator](): IterableIterator<[string, Plugin]>;
}

export declare function withPlugins<T extends (...args: any[]) => any>(
  fn: T,
  pluginManager: PluginManager,
  fnName?: string
): (...args: Parameters<T>) => Promise<ReturnType<T>>;

export declare const loggingPlugin: Plugin;

export declare const timingPlugin: Plugin & {
  getTimings(): Array<{ fnName: string; duration: number; timestamp: string; error?: boolean }>;
  clearTimings(): void;
};

export declare const plugins: {
  PluginManager: typeof PluginManager;
  withPlugins: typeof withPlugins;
  loggingPlugin: typeof loggingPlugin;
  timingPlugin: typeof timingPlugin;
};
