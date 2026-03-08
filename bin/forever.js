#!/usr/bin/env node
/**
 * bin/forever.js – Forever CLI
 *
 * Usage:
 *   forever --help
 *   forever validate --file <path> [--schema <path>]
 *   forever benchmark [--format table|json]
 *   forever plugin list
 */

'use strict';

const path = require('path');
const fs   = require('fs');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function exit(code, msg) {
  if (msg) (code === 0 ? process.stdout : process.stderr).write(msg + '\n');
  process.exit(code);
}

function parseArgs(argv) {
  const args = { flags: {}, positional: [] };
  let i = 0;
  while (i < argv.length) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args.flags[key] = next;
        i += 2;
      } else {
        args.flags[key] = true;
        i++;
      }
    } else {
      args.positional.push(token);
      i++;
    }
  }
  return args;
}

function readStdin() {
  return new Promise(resolve => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
  });
}

// ─── Help texts ──────────────────────────────────────────────────────────────

const HELP_ROOT = `
Forever CLI – a command-line interface for the Forever library.

Usage:
  forever <command> [options]

Commands:
  validate    Validate a JSON file against a schema
  benchmark   Run the benchmark suite
  plugin      Manage and inspect plugins

Options:
  --help      Show help for any command

Examples:
  forever validate --file data.json --schema schema.json
  forever benchmark --format json
  forever plugin list
`;

const HELP_VALIDATE = `
Usage:
  forever validate [--file <path>] [--schema <path>]

Validate a JSON payload against a schema.

Options:
  --file    Path to the JSON file to validate (defaults to stdin)
  --schema  Path to a JSON schema file (optional; keys map to field types)
  --help    Show this help

Schema format (JSON):
  {
    "fieldName": { "type": "string|number|boolean", "required": true, "min": 0, "max": 100 }
  }

Example:
  echo '{"name":"Alice","age":30}' | forever validate --schema schema.json
  forever validate --file payload.json --schema schema.json
`;

const HELP_BENCHMARK = `
Usage:
  forever benchmark [--format table|json]

Run the Forever benchmark suite.

Options:
  --format  Output format: 'table' (default) or 'json'
  --help    Show this help

Example:
  forever benchmark
  forever benchmark --format json
`;

const HELP_PLUGIN = `
Usage:
  forever plugin <sub-command>

Sub-commands:
  list   List all built-in plugins

Options:
  --help  Show this help

Example:
  forever plugin list
`;

// ─── Commands ────────────────────────────────────────────────────────────────────

async function cmdValidate(flags) {
  if (flags.help) exit(0, HELP_VALIDATE);

  // Read JSON payload
  let raw;
  if (flags.file) {
    const filePath = path.resolve(process.cwd(), flags.file);
    if (!fs.existsSync(filePath)) exit(1, `Error: file not found: ${filePath}`);
    raw = fs.readFileSync(filePath, 'utf8');
  } else {
    raw = await readStdin();
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    exit(1, `Error: invalid JSON \u2013 ${e.message}`);
  }

  // If no schema supplied, just confirm it’s valid JSON
  if (!flags.schema) {
    process.stdout.write(JSON.stringify({ valid: true, errors: [] }, null, 2) + '\n');
    return;
  }

  const schemaPath = path.resolve(process.cwd(), flags.schema);
  if (!fs.existsSync(schemaPath)) exit(1, `Error: schema file not found: ${schemaPath}`);

  let schema;
  try {
    schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  } catch (e) {
    exit(1, `Error: invalid schema JSON \u2013 ${e.message}`);
  }

  // Simple validation engine
  const errors = [];
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    if (rules.required && (value === undefined || value === null)) {
      errors.push(`"${field}" is required but missing.`);
      continue;
    }
    if (value !== undefined && rules.type && typeof value !== rules.type) {
      errors.push(`"${field}" must be of type ${rules.type}, got ${typeof value}.`);
    }
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min)
        errors.push(`"${field}" must be >= ${rules.min}.`);
      if (rules.max !== undefined && value > rules.max)
        errors.push(`"${field}" must be <= ${rules.max}.`);
    }
  }

  const result = { valid: errors.length === 0, errors };
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  if (!result.valid) process.exit(1);
}

async function cmdBenchmark(flags) {
  if (flags.help) exit(0, HELP_BENCHMARK);

  const format = flags.format || 'table';
  if (!['table', 'json'].includes(format)) {
    exit(1, `Error: --format must be 'table' or 'json'.`);
  }

  const benchDir = path.resolve(__dirname, '..', 'benchmarks');
  const benchFiles = [
    'cache.bench.js',
    'memoize.bench.js',
    'eventBus.bench.js',
    'queue.bench.js',
    'retry.bench.js',
    'pipeline.bench.js',
    'validator.bench.js',
  ];

  const allResults = [];

  for (const file of benchFiles) {
    const filePath = path.join(benchDir, file);
    if (!fs.existsSync(filePath)) {
      process.stderr.write(`Warning: benchmark file not found: ${file}\n`);
      continue;
    }
    try {
      const suite = require(filePath);
      process.stdout.write(`Running ${suite.name}\u2026\n`);
      const results = await suite.run();
      allResults.push(...results);
    } catch (err) {
      process.stderr.write(`Error running ${file}: ${err.message}\n`);
    }
  }

  if (format === 'json') {
    process.stdout.write(JSON.stringify(allResults, null, 2) + '\n');
  } else {
    // table format
    const header = `${'Name'.padEnd(36)} ${'Mean(ms)'.padStart(10)} ${'p95(ms)'.padStart(10)} ${'Max(ms)'.padStart(10)}`;
    process.stdout.write('\n' + header + '\n');
    process.stdout.write('-'.repeat(header.length) + '\n');
    for (const r of allResults) {
      process.stdout.write(
        `${r.name.padEnd(36)} ` +
        `${r.mean.toFixed(3).padStart(10)} ` +
        `${r.p95.toFixed(3).padStart(10)} ` +
        `${r.max.toFixed(3).padStart(10)}\n`
      );
    }
    process.stdout.write('\n');
  }
}

function cmdPlugin(positional, flags) {
  if (flags.help || positional.length === 0) exit(0, HELP_PLUGIN);

  const sub = positional[0];
  if (sub === 'list') {
    const builtins = [
      { name: 'loggingPlugin', description: 'Logs every function call with timestamps to the console.' },
      { name: 'timingPlugin',  description: 'Records execution time per call; access via timingPlugin.getTimings().' },
    ];
    process.stdout.write('\nBuilt-in Forever plugins:\n\n');
    for (const p of builtins) {
      process.stdout.write(`  • ${p.name.padEnd(18)} ${p.description}\n`);
    }
    process.stdout.write('\n');
  } else {
    exit(1, `Unknown plugin sub-command: "${sub}". Try: forever plugin list`);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────────

async function main() {
  const argv = process.argv.slice(2);
  const { flags, positional } = parseArgs(argv);
  const command = positional[0];

  if (!command || flags.help) exit(0, HELP_ROOT);

  switch (command) {
    case 'validate':
      await cmdValidate(flags);
      break;
    case 'benchmark':
      await cmdBenchmark(flags);
      break;
    case 'plugin':
      cmdPlugin(positional.slice(1), flags);
      break;
    default:
      exit(1, `Unknown command: "${command}". Run 'forever --help' for usage.`);
  }
}

main().catch(err => {
  process.stderr.write(`Fatal error: ${err.message}\n`);
  process.exit(1);
});
