/**
 * types/example.ts
 * Demonstrates correct usage of the Forever TypeScript API.
 * This file is for documentation/type-checking purposes only.
 *
 * To check types (without running): npx tsc --noEmit types/example.ts
 */

import {
  // Cache
  cache,

  // EventBus
  eventBus, EventHandler,

  // Utils
  utils,

  // Function utilities
  debounce, throttle, memoize, memoizeAsync, pipeline,

  // State
  stateManager,

  // Async
  retry, RetryOptions,

  // Patterns
  fsm, FSMConfig, FSM,

  // Validation
  validator, Schema, ValidationResult,

  // Performance
  performance, BenchmarkResult, MemoryLeakResult,

  // Plugins
  plugins, Plugin, PluginManager, PluginHookContext,
  withPlugins, loggingPlugin, timingPlugin,

  // Greet
  greet,
} from 'forever';

// ─── Cache ────────────────────────────────────────────────────────────────────────
cache.set('user:1', { name: 'Alice', age: 30 });
const user = cache.get('user:1');  // unknown
const has  = cache.has('user:1'); // boolean

// ─── EventBus ──────────────────────────────────────────────────────────────────
const handler: EventHandler<string> = (msg) => console.log(msg);
const unsubscribe = eventBus.on<string>('message', handler);
eventBus.emit<string>('message', 'hello');
unsubscribe();

// ─── Utils ──────────────────────────────────────────────────────────────────────
const cap: string  = utils.capitalize('hello');
const emp: boolean = utils.isEmpty([]);

async function exampleSleep(): Promise<void> {
  await utils.sleep(100);
}

// ─── Memoize ────────────────────────────────────────────────────────────────────
const square = memoize((n: number) => n * n);
const sq: number = square(9); // 81 (cached on repeat calls)

// ─── Pipeline ──────────────────────────────────────────────────────────────────
const pipe = pipeline(
  (x: number) => x * 2,
  (x: number) => x + 1,
  (x: number) => String(x)
);
const piped: any = pipe(5); // '11'

// ─── Retry ──────────────────────────────────────────────────────────────────────
const retryOpts: RetryOptions = { attempts: 3, delay: 100, backoff: 'exponential' };

async function exampleRetry(): Promise<number> {
  return retry<number>(async () => 42, retryOpts);
}

// ─── FSM ──────────────────────────────────────────────────────────────────────────
type State = 'idle' | 'running' | 'stopped';
type Event = 'START' | 'STOP' | 'RESET';

const config: FSMConfig<State, Event> = {
  initial: 'idle',
  states: {
    idle:    { on: { START: 'running' } },
    running: { on: { STOP: 'stopped', RESET: 'idle' } },
    stopped: { on: { RESET: 'idle' } },
  },
};

const machine: FSM<State, Event> = fsm.createFSM<State, Event>(config);
machine.send('START');
console.log(machine.state); // 'running'

// ─── Validator ─────────────────────────────────────────────────────────────────
const schema: Schema = {
  name: { type: 'string', required: true },
  age:  { type: 'number', required: true, min: 0, max: 150 },
};

const result: ValidationResult = validator.validate(schema, { name: 'Bob', age: 25 });
console.log(result.valid);  // true
console.log(result.errors); // []

// ─── Performance ───────────────────────────────────────────────────────────────
async function examplePerformance(): Promise<void> {
  const benchResult: BenchmarkResult = await performance.benchmark(
    'example',
    () => { let x = 0; for (let i = 0; i < 1000; i++) x += i; },
    { iterations: 50 }
  );
  console.log(`Mean: ${benchResult.mean.toFixed(3)}ms`);

  const leakResult: MemoryLeakResult = await performance.detectMemoryLeak(
    () => { /* clean function */ },
    { iterations: 10 }
  );
  console.log(`Leaked: ${leakResult.leaked}`);
}

// ─── Plugin System ────────────────────────────────────────────────────────────────
const myPlugin: Plugin = {
  beforeCall(ctx: PluginHookContext): void {
    console.log(`▶ ${ctx.fnName}(${ctx.args.join(', ')})`);
  },
  afterCall(ctx: PluginHookContext): void {
    console.log(`✔ returned ${ctx.result} in ${ctx.duration}ms`);
  },
  onError(ctx: PluginHookContext): void {
    console.error(`✘ ${ctx.error?.message}`);
  },
};

const pm = new PluginManager();
pm
  .register('my-plugin', myPlugin)
  .register('logging',   loggingPlugin)
  .register('timing',    timingPlugin);

const wrappedGreet = withPlugins(greet, pm, 'greet');

async function examplePlugins(): Promise<void> {
  const greeting: string = await wrappedGreet('World') as string;
  const names: string[]  = pm.listPlugins(); // ['my-plugin', 'logging', 'timing']
  const timings = timingPlugin.getTimings();
  console.log({ greeting, names, timings });
}
