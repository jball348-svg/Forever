/**
 * Structured logging module with levels, context enrichment, and formatters.
 * Supports JSON, NDJSON, and pretty-printed output formats.
 *
 * @module structuredLogger
 */

'use strict';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 50 };
const LEVEL_NAMES = Object.keys(LEVELS);

const COLOURS = {
  debug:  '\x1b[36m', // cyan
  info:   '\x1b[32m', // green
  warn:   '\x1b[33m', // yellow
  error:  '\x1b[31m', // red
  reset:  '\x1b[0m',
  dim:    '\x1b[2m',
  bold:   '\x1b[1m',
};

function _coloured(colour, text) {
  return `${COLOURS[colour] || ''}${text}${COLOURS.reset}`;
}

function _formatPretty(entry) {
  const { timestamp, level, name, msg, ...rest } = entry;
  const ts = _coloured('dim', `[${timestamp}]`);
  const lvl = _coloured(level, level.toUpperCase().padEnd(5));
  const nameStr = name ? _coloured('bold', `${name}: `) : '';
  const extraKeys = Object.keys(rest);
  const extra = extraKeys.length > 0
    ? ' ' + _coloured('dim', JSON.stringify(rest))
    : '';
  return `${ts} ${lvl} ${nameStr}${msg}${extra}`;
}

function _formatJSON(entry) {
  return JSON.stringify(entry);
}

function _buildEntry(level, msg, context, fields, name) {
  const base = {
    timestamp: new Date().toISOString(),
    level,
    ...(name ? { name } : {}),
    msg: String(msg),
    ...context,
  };

  if (fields) {
    // Serialize Error objects helpfully
    for (const [k, v] of Object.entries(fields)) {
      if (v instanceof Error) {
        base[k] = { message: v.message, name: v.name, stack: v.stack };
      } else {
        base[k] = v;
      }
    }
  }

  return base;
}

/**
 * Create a structured logger.
 *
 * @param {object} [options]
 * @param {'debug'|'info'|'warn'|'error'|'silent'} [options.level='info'] - Minimum log level
 * @param {'json'|'ndjson'|'pretty'} [options.formatter='pretty'] - Output format
 * @param {NodeJS.WritableStream} [options.output=process.stderr] - Output stream
 * @param {object} [options.context={}] - Base context merged into every entry
 * @param {string} [options.name] - Logger name
 * @returns {object} Logger instance
 */
function createLogger(options = {}) {
  const {
    level: initialLevel = 'info',
    formatter = 'pretty',
    output = process.stderr,
    context = {},
    name,
  } = options;

  if (!LEVELS.hasOwnProperty(initialLevel)) {
    throw new Error(`Invalid log level: '${initialLevel}'. Must be one of: ${LEVEL_NAMES.join(', ')}`);
  }

  let currentLevel = initialLevel;

  function _write(level, msg, fields) {
    if (LEVELS[level] < LEVELS[currentLevel]) return;
    const entry = _buildEntry(level, msg, context, fields, name);
    let line;
    if (formatter === 'pretty') {
      line = _formatPretty(entry);
    } else {
      line = _formatJSON(entry);
    }
    output.write(line + '\n');
  }

  const logger = {
    /**
     * Log at debug level.
     * @param {string} msg
     * @param {object} [fields]
     */
    debug(msg, fields) { _write('debug', msg, fields); },

    /**
     * Log at info level.
     * @param {string} msg
     * @param {object} [fields]
     */
    info(msg, fields) { _write('info', msg, fields); },

    /**
     * Log at warn level.
     * @param {string} msg
     * @param {object} [fields]
     */
    warn(msg, fields) { _write('warn', msg, fields); },

    /**
     * Log at error level.
     * @param {string} msg
     * @param {object} [fields]
     */
    error(msg, fields) { _write('error', msg, fields); },

    /**
     * Create a child logger with additional context.
     *
     * @param {object} childContext - Extra fields merged into every entry
     * @returns {object} Child logger
     */
    child(childContext) {
      return createLogger({
        level: currentLevel,
        formatter,
        output,
        context: { ...context, ...childContext },
        name,
      });
    },

    /**
     * Set the minimum log level at runtime.
     *
     * @param {'debug'|'info'|'warn'|'error'|'silent'} level
     */
    setLevel(level) {
      if (!LEVELS.hasOwnProperty(level)) {
        throw new Error(`Invalid log level: '${level}'`);
      }
      currentLevel = level;
    },

    /**
     * Get the current log level.
     *
     * @returns {string}
     */
    getLevel() {
      return currentLevel;
    },

    /**
     * Check if a given level would be logged.
     *
     * @param {string} level
     * @returns {boolean}
     */
    isLevelEnabled(level) {
      return LEVELS[level] !== undefined && LEVELS[level] >= LEVELS[currentLevel];
    }
  };

  return logger;
}

module.exports = { createLogger };
