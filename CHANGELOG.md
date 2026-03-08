# Changelog

All notable changes to the Forever project will be documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.5.0] - 2026-03-08
### Added
- `src/logger.js` — simple levelled logging utility (info/warn/error)
- `tests/logger.test.js` — console spy tests for all log levels

## [0.6.0] - 2026-03-08
### Added
- `src/config.js` — centralised project configuration (name, version, startedAt)
- Updated `index.js` to log project name and version on startup

## [0.7.0] - 2026-03-08
### Added
- `src/eventBus.js` — minimal pub/sub event bus (on, off, emit)
- `tests/eventBus.test.js`

## [0.8.0] - 2026-03-08
### Added
- `src/store.js` — in-memory key-value store (set, get, has, delete, clear)
- `tests/store.test.js`

## [0.9.0] - 2026-03-08
### Added
- `src/utils.js` — general utilities: capitalize, isEmpty, sleep
- `tests/utils.test.js`

## [0.10.0] - 2026-03-08
### Added
- `src/pipeline.js` — left-to-right function pipeline composer
- `tests/pipeline.test.js`

## [0.11.0] - 2026-03-08
### Added
- `src/scheduler.js` — named recurring task scheduler (schedule, cancel, list)
- `tests/scheduler.test.js`

## [0.12.0] - 2026-03-08
### Added
- `src/stateManager.js` — reactive state manager built on store + eventBus
- `tests/stateManager.test.js`

## [0.13.0] - 2026-03-08
### Added
- `src/validator.js` — data validation with required/type/minLength/maxLength/min/max rules
- `tests/validator.test.js`

## [0.14.0] - 2026-03-08
### Added
- `src/router.js` — path router with :param support and notFound fallback
- `tests/router.test.js`

## [0.15.0] - 2026-03-08
### Added
- `src/cache.js` — TTL-based in-memory cache
- `tests/cache.test.js`

## [0.16.0] - 2026-03-08
### Added
- `src/retry.js` — async retry with configurable attempts and delay
- `tests/retry.test.js`

## [0.17.0] - 2026-03-08
### Added
- `src/queue.js` — async task queue with concurrency control
- `tests/queue.test.js`

## [0.18.0] - 2026-03-08
### Added
- `src/middleware.js` — Express-style middleware chain (use, run, next)
- `tests/middleware.test.js`

## [0.19.0] - 2026-03-08
### Added
- `src/observable.js` — minimal Observable with next/error/complete
- `tests/observable.test.js`

## [0.20.0] - 2026-03-08
### Added
- `src/di.js` — Dependency Injection container with register/resolve/singleton
- `tests/di.test.js`

## [0.21.0] - 2026-03-08
### Added
- `src/debounce.js` — debounce and throttle higher-order functions
- `tests/debounce.test.js`

## [0.22.0] - 2026-03-08
### Added
- `src/fsm.js` — Finite State Machine with typed transitions (send, can)
- `tests/fsm.test.js`

## [0.23.0] - 2026-03-08
### Added
- `src/commandBus.js` — Command pattern bus (register, dispatch)
- `tests/commandBus.test.js`

## [0.24.0] - 2026-03-08
### Added
- `src/memoize.js` — sync and async memoization with optional custom key functions
- `tests/memoize.test.js`

## [0.25.0] - 2026-03-08
### Added
- `src/stream.js` — async readable/writable stream abstraction
- `tests/stream.test.js`

## [0.26.0] - 2026-03-08
### Added
- `src/pool.js` — generic object pool with max size and waiter queue
- `tests/pool.test.js`

## [0.27.0] - 2026-03-08
### Added
- `src/decorators.js` — function decorators: readonly, logged, timed
- `tests/decorators.test.js`

## [0.4.0] - 2026-03-08
### Added
- `CHANGELOG.md` to track the project’s evolution over time

## [0.3.0] - 2026-03-08
### Added
- `.gitignore` with Node.js best practices

## [0.2.0] - 2026-03-08
### Added
- `index.js` as the main entry point

## [0.1.0] - 2026-03-08
### Added
- `package.json` establishing Forever as a Node.js project
- `next_task` self-evolving task loop
