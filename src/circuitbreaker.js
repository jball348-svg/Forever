/**
 * Circuit breaker module for resilient async function calls.
 * Prevents cascading failures by short-circuiting calls to failing dependencies.
 *
 * @module circuitbreaker
 */

'use strict';

/**
 * Error thrown when a call is attempted on an open circuit.
 */
class CircuitOpenError extends Error {
  /**
   * @param {string} state - Current circuit state
   */
  constructor(state) {
    super(`Circuit is ${state}. Call rejected.`);
    this.name = 'CircuitOpenError';
    this.state = state;
  }
}

const STATES = Object.freeze({
  CLOSED: 'closed',
  OPEN: 'open',
  HALF_OPEN: 'half-open'
});

/**
 * Wrap an async function with a circuit breaker.
 *
 * @param {Function} fn - The async function to protect
 * @param {object} [options]
 * @param {number} [options.failureThreshold=5] - Consecutive failures before opening
 * @param {number} [options.successThreshold=2] - Consecutive successes in half-open to close
 * @param {number} [options.timeout=60000] - Milliseconds to wait before trying half-open
 * @param {Function} [options.onOpen] - Called when circuit opens
 * @param {Function} [options.onClose] - Called when circuit closes
 * @param {Function} [options.onHalfOpen] - Called when circuit enters half-open
 * @returns {{ call: Function, getState: Function, getStats: Function, reset: Function }}
 */
function createCircuitBreaker(fn, options = {}) {
  const {
    failureThreshold = 5,
    successThreshold = 2,
    timeout = 60000,
    onOpen = null,
    onClose = null,
    onHalfOpen = null
  } = options;

  let state = STATES.CLOSED;
  let failures = 0;
  let successes = 0;
  let lastFailureAt = null;
  let totalCalls = 0;
  let totalFailures = 0;
  let openedAt = null;

  function _open(err) {
    state = STATES.OPEN;
    openedAt = Date.now();
    if (typeof onOpen === 'function') {onOpen(err);}
  }

  function _close() {
    state = STATES.CLOSED;
    failures = 0;
    successes = 0;
    openedAt = null;
    if (typeof onClose === 'function') {onClose();}
  }

  function _halfOpen() {
    state = STATES.HALF_OPEN;
    successes = 0;
    if (typeof onHalfOpen === 'function') {onHalfOpen();}
  }

  function _tryHalfOpen() {
    if (state === STATES.OPEN && openedAt !== null) {
      if (Date.now() - openedAt >= timeout) {
        _halfOpen();
        return true;
      }
    }
    return false;
  }

  return {
    /**
     * Call the wrapped function, subject to circuit breaker logic.
     *
     * @param {...*} args - Arguments to pass to the wrapped function
     * @returns {Promise<*>}
     * @throws {CircuitOpenError} If the circuit is open
     */
    async call(...args) {
      totalCalls++;

      if (state === STATES.OPEN) {
        if (!_tryHalfOpen()) {
          throw new CircuitOpenError(state);
        }
      }

      try {
        const result = await fn(...args);

        if (state === STATES.HALF_OPEN) {
          successes++;
          if (successes >= successThreshold) {
            _close();
          }
        } else {
          // Successful call in closed state resets failure count
          failures = 0;
        }

        return result;
      } catch (err) {
        failures++;
        totalFailures++;
        lastFailureAt = new Date();

        if (state === STATES.HALF_OPEN) {
          // Any failure in half-open reopens the circuit
          _open(err);
        } else if (failures >= failureThreshold) {
          _open(err);
        }

        throw err;
      }
    },

    /**
     * Get the current state of the circuit.
     *
     * @returns {'closed'|'open'|'half-open'}
     */
    getState() {
      return state;
    },

    /**
     * Get statistics about the circuit breaker.
     *
     * @returns {{ failures: number, successes: number, state: string, lastFailureAt: Date|null, totalCalls: number, totalFailures: number }}
     */
    getStats() {
      return {
        failures,
        successes,
        state,
        lastFailureAt,
        totalCalls,
        totalFailures
      };
    },

    /**
     * Manually reset the circuit to closed state.
     */
    reset() {
      _close();
      totalCalls = 0;
      totalFailures = 0;
      lastFailureAt = null;
    }
  };
}

module.exports = { createCircuitBreaker, CircuitOpenError };
