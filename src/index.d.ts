/**
 * Barrel export for all modules in the src/ directory.
 * Provides a single import point for all public APIs.
 */

// Cache and storage
export const set: (key: string, value: any) => void;
export const get: (key: string) => any;
export const has: (key: string) => boolean;
export const deleteFromCache: (key: string) => boolean;
export const store: any;

// Event systems
export const on: <T>(event: string, handler: (data: T) => void) => () => void;
export const off: (event: string, handler: Function) => void;
export const emit: <T>(event: string, data: T) => void;

// Logging and utilities
export const log: (level: string, message: string) => void;
export const capitalize: (str: string) => string;
export const isEmpty: (value: any) => boolean;
export const sleep: (ms: number) => Promise<void>;

// Function utilities
export const debounce: (func: Function, delay: number) => Function;
export const throttle: (func: Function, delay: number) => Function;
export const memoize: <T extends Function>(fn: T) => T;
export const memoizeAsync: <T extends Function>(fn: T) => T;
export const pipeline: <T, U>(...fns: Array<(arg: any) => any>) => (arg: T) => U;

// Decorators and middleware
export const readonly: (target: any, propertyKey: string) => void;
export const logged: (target: any, propertyKey: string) => void;
export const timed: (target: any, propertyKey: string) => void;
export const createMiddleware: () => any;

// Dependency injection and containers
export const createContainer: () => any;
export const createPool: () => any;

// State management
export const setState: (state: any) => void;
export const getState: () => any;
export const subscribe: (callback: Function) => () => void;

// Async and flow control
export const createQueue: () => any;
export const retry: <T>(fn: () => Promise<T>, options?: any) => Promise<T>;
export const createStream: () => any;

// Patterns and architectures
export const createCommandBus: () => any;
export const fsm: {
  createFSM: <S, E>(config: FSMConfig<S, E>) => FSM<S, E>;
};
export const createObservable: () => any;

// Routing and scheduling
export const addRoute: (path: string, handler: Function) => void;
export const navigate: (path: string) => void;
export const notFound: (handler: Function) => void;
export const schedule: (task: Function, delay: number) => any;
export const cancel: (id: any) => void;
export const list: () => any[];

// Validation and configuration
export const validate: (schema: any, data: any) => any;
export const config: any;

// Additional exports that might be referenced
export const cache: {
  set: (key: string, value: any) => void;
  get: (key: string) => any;
  has: (key: string) => boolean;
  delete: (key: string) => boolean;
  clear: () => void;
};

export const eventBus: {
  on: <T>(event: string, handler: (data: T) => void) => () => void;
  off: (event: string, handler: Function) => void;
  emit: <T>(event: string, data: T) => void;
};

export const utils: {
  capitalize: (str: string) => string;
  isEmpty: (value: any) => boolean;
  sleep: (ms: number) => Promise<void>;
};

export const stateManager: {
  setState: (state: any) => void;
  getState: () => any;
  subscribe: (callback: Function) => () => void;
};

export const validator: {
  validate: (schema: any, data: any) => any;
};

export const performance: {
  benchmark: (name: string, fn: Function, options?: any) => Promise<any>;
  detectMemoryLeak: (fn: Function, options?: any) => Promise<any>;
};

export const plugins: any;
export type Plugin = {
  beforeCall?: (ctx: PluginHookContext) => void;
  afterCall?: (ctx: PluginHookContext) => void;
  onError?: (ctx: PluginHookContext) => void;
};
export const PluginManager: any;
export type PluginHookContext = {
  fnName: string;
  args: any[];
  result?: any;
  duration?: number;
  error?: Error;
};
export const withPlugins: (fn: Function, manager: any, name: string) => Function;
export const loggingPlugin: any;
export const timingPlugin: any;

export const greet: () => string;

// Type aliases
export type EventHandler<T> = (data: T) => void;
export type RetryOptions = {
  attempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
};
export type FSMConfig<S, E> = {
  initial: S;
  states: Partial<Record<S, { on: Partial<Record<E, S>> }>>;
};
export type FSM<S, E> = {
  state: S;
  send: (event: E) => void;
};
export type Schema = Record<string, any>;
export type ValidationResult = {
  valid: boolean;
  errors: string[];
};
export type BenchmarkResult = {
  mean: number;
  min: number;
  max: number;
  iterations: number;
};
export type MemoryLeakResult = {
  leaked: boolean;
  details?: any;
};
