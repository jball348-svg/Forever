# Documentation

## 1. Project Purpose and Vision
The purpose of this project is to provide a comprehensive tool for visualizing SVG data in an interactive manner. The vision is to create a platform that can easily integrate into other tools and platforms, allowing for seamless visualization.

## 2. Architecture Overview
The architecture consists of a modular design where different components handle data input, processing, and visualization independently. This allows for scalability and ease of updates.

## 3. How to Contribute
We welcome contributions! Please fork the repository, make your changes, and create a pull request. Ensure that your code is documented and includes relevant tests.

## 4. Development Setup and Workflow
To set up the development environment, clone the repository and install the necessary dependencies using the following commands:

```bash
# Clone the repository
$ git clone https://github.com/jball348-svg/Forever.git

# Navigate to the directory
$ cd Forever

# Install dependencies
$ npm install
```

Ensure to follow our coding guidelines during development. Frequent commits are encouraged to keep track of changes.

## 5. CLI Usage Guide

The Forever CLI (`forever`) provides an interactive interface to the library's modules, tests, and documentation tools.

### Installation

```bash
npm link   # Makes 'forever' available globally from this repo
```

or run directly:

```bash
node bin/forever.js <command>
```

### Available Commands

#### `forever list`
List all modules in `src/` with their one-line JSDoc summary.

```bash
$ forever list
  cache           TTL-based in-memory cache.
  commandBus      Simple command bus pattern.
  debounce        Debounce and throttle utilities...
  ...
```

#### `forever info <module>`
Display the full API for a specific module, including exported function names, parameter signatures, and return types.

```bash
$ forever info cache
  set(key: string, value: *, ttlMs: number) → void
    Store a value in the cache with a time-to-live.

  get(key: string) → *
    Retrieve a value from the cache.

  has(key: string) → boolean
    Check whether a key exists and has not expired.
```

#### `forever info config`
Explore the configuration management API:

```bash
$ forever info config
  get(key: string, defaultValue: *) → *
    Retrieve a configuration value using dot-notation.

  set(key: string, value: *)
    Set a configuration value at runtime.

  validate(schema: object) → string[]
    Validate the current config against a schema.

  watch(key: string, callback: Function) → Function
    Register a watcher for a dot-notation key.

  reset()
    Reset configuration to factory defaults.

  toJSON() → object
    Return a sanitized config snapshot with sensitive keys masked.
```

#### `forever run <module>`
Dynamically load and display a module's exports. If the module exports a single function, it is called as a demo.

```bash
$ forever run greet
```

#### `forever test [--verbose]`
Run all test files in `tests/` sequentially and show pass/fail with timing per file.

```bash
$ forever test
  ✔ PASS  cache.test.js                        12ms
  ✔ PASS  eventBus.test.js                      8ms
  ✖ FAIL  someModule.test.js                   45ms

✖ 1 test file(s) failed — 24/25 passed
```

Use `--verbose` to see full output for each test file.

#### `forever docs [--watch]`
Generate HTML and Markdown API documentation from JSDoc comments.

```bash
$ forever docs           # one-shot generation
$ forever docs --watch   # watch src/ for changes and regenerate
```

Outputs:
- `docs/api/index.html` — browsable HTML reference
- `docs/api.md` — Markdown version for GitHub

#### `forever benchmark [--format table|json]`
Run the benchmark suite.

```bash
$ forever benchmark
$ forever benchmark --format json
```

#### `forever validate [--file <path>] [--schema <path>]`
Validate a JSON payload.

```bash
$ echo '{"name":"Alice"}' | forever validate
$ forever validate --file data.json --schema schema.json
```

#### `forever plugin list`
List available built-in plugins.

```bash
$ forever plugin list
```

#### Global flags

| Flag | Description |
|------|-------------|
| `--help` | Show help for any command |
| `--version` | Print the installed version |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NO_COLOR` | Set to any value to disable ANSI colour output |
| `FOREVER_LOG_LEVEL` | Override the log level (e.g. `debug`) |
| `FOREVER_CACHE_MAXSIZE` | Override the cache max size |
| `FOREVER_ENV` | Override the environment name |

---

## 6. Configuration System

The `config` module (`src/config.js`) provides a full-featured configuration manager.

### Priority Order
Values are resolved in this order (highest priority first):
1. **Runtime overrides** — set via `config.set(key, value)`
2. **Environment variables** — `FOREVER_*` vars (e.g. `FOREVER_LOG_LEVEL=debug`)
3. **`.foreverrc.json`** — a JSON file in the working directory
4. **Built-in defaults**

### Usage

```js
const config = require('./src/config');

// Read a nested value
config.get('log.level');           // 'info'
config.get('cache.defaultTtlMs'); // 60000
config.get('missing', 'fallback'); // 'fallback'

// Override at runtime
config.set('log.level', 'debug');

// Watch for changes
const unsub = config.watch('log.level', (newVal, oldVal) => {
  console.log(`log.level: ${oldVal} → ${newVal}`);
});
unsub(); // stop watching

// Validate configuration
const errors = config.validate({
  'log.level':    { type: 'string', required: true, enum: ['info', 'debug', 'warn', 'error'] },
  'cache.maxSize': { type: 'number', min: 1, max: 10000 },
});
if (errors.length) console.error(errors);

// Sanitized snapshot (passwords/secrets/tokens masked)
console.log(config.toJSON());

// Reset to defaults
config.reset();
```

### `.foreverrc.json` Example

```json
{
  "log": { "level": "warn", "format": "json" },
  "cache": { "maxSize": 500 }
}
```

---

## 7. Future Roadmap
- **Q2 2026**: Add more visualization options
- **Q3 2026**: Enhance performance and reduce loading times
- **2027**: Expand the project scope to mobile applications.

This document serves as a central knowledge base for developers and users.
