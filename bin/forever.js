#!/usr/bin/env node
/**
 * bin/forever.js – Forever CLI
 *
 * Usage:
 *   forever --help
 *   forever --version
 *   forever run <module>
 *   forever list
 *   forever test
 *   forever docs [--watch]
 *   forever info <module>
 *   forever benchmark [--format table|json]
 *   forever validate --file <path> [--schema <path>]
 *   forever plugin list
 */

'use strict';

const path = require('path');
const fs   = require('fs');
const { execFileSync, spawnSync } = require('child_process');

// Load CLI utilities from src/cli.js
const cli = require('../src/cli.js');
const { colour, printHeader, ok, fail, warn, ansi } = cli;

const PKG = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf8'));

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
      if (next && !next.startsWith('--')) { args.flags[key] = next; i += 2; }
      else { args.flags[key] = true; i++; }
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
${colour('cyan', ansi.bold + 'Forever CLI' + ansi.reset + colour('dim', ` v${PKG.version}`))}
A command-line interface for the Forever library.

${colour('yellow', 'Usage:')}
  forever <command> [options]

${colour('yellow', 'Commands:')}
  ${colour('green', 'run')}        <module>    Require and display a src/ module
  ${colour('green', 'list')}                   List all src/ modules with summaries
  ${colour('green', 'test')}                   Run all tests with pass/fail and timing
  ${colour('green', 'docs')}       [--watch]   Generate API documentation
  ${colour('green', 'info')}       <module>    Show full API for a module
  ${colour('green', 'benchmark')}  [--format]  Run the benchmark suite
  ${colour('green', 'validate')}               Validate a JSON file against a schema
  ${colour('green', 'plugin')}                 Manage and inspect plugins
  ${colour('green', 'health')}      [--format]  Run health checks and show status
  ${colour('green', 'metrics')}     [--format]  Display current metrics

${colour('yellow', 'Global options:')}
  --help      Show help for any command
  --version   Print the version number

${colour('dim', 'Examples:')}
  forever list
  forever info cache
  forever test
  forever docs
  forever run greet
`;

const HELP_RUN = `
${colour('yellow', 'Usage:')} forever run <module>

Dynamically loads a named module from src/ and displays its exports.
If the module exports a default function, it is called with no arguments.

${colour('dim', 'Examples:')}
  forever run cache
  forever run greet
`;

const HELP_LIST = `
${colour('yellow', 'Usage:')} forever list

Print all available modules in src/ along with their one-line summary
extracted from the module's JSDoc comment.
`;

const HELP_TEST = `
${colour('yellow', 'Usage:')} forever test [--verbose]

Run all test files in tests/ sequentially.
Displays pass/fail status and timing per file.

  --verbose   Show full test output for each file
`;

const HELP_DOCS = `
${colour('yellow', 'Usage:')} forever docs [--watch]

Generate API documentation from JSDoc comments in src/.
Outputs HTML to docs/api/index.html and Markdown to docs/api.md.

  --watch   Continuously regenerate docs when src/ files change
`;

const HELP_INFO = `
${colour('yellow', 'Usage:')} forever info <module>

Show the full API of a specific module: its summary, exported names,
and parameter signatures extracted from JSDoc comments.

${colour('dim', 'Examples:')}
  forever info cache
  forever info eventBus
`;

const HELP_BENCHMARK = `
${colour('yellow', 'Usage:')} forever benchmark [--format table|json]

Run the Forever benchmark suite.

  --format   Output format: 'table' (default) or 'json'
`;

const HELP_VALIDATE = `
${colour('yellow', 'Usage:')} forever validate [--file <path>] [--schema <path>]

Validate a JSON payload against a schema.

  --file    Path to JSON file to validate (defaults to stdin)
  --schema  Path to a JSON schema file
`;

const HELP_PLUGIN = `
${colour('yellow', 'Usage:')} forever plugin <sub-command>

  list   List all built-in plugins
`;

const HELP_HEALTH = `
${colour('yellow', 'Usage:')} forever health [--format text|json]

Run health checks and display a formatted report.

  --format   Output format: 'text' (default) or 'json'
`;

const HELP_METRICS = `
${colour('yellow', 'Usage:')} forever metrics [--format table|json]

Display current metrics in a formatted table or JSON.

  --format   Output format: 'table' (default) or 'json'
`;

// ─── Commands ──────────────────────────────────────────────────────────────────

function cmdRun(positional, flags) {
  if (flags.help) exit(0, HELP_RUN);
  const modName = positional[0];
  if (!modName) fail('Usage: forever run <module>');

  const modPath = path.resolve(__dirname, '..', 'src', `${modName}.js`);
  if (!fs.existsSync(modPath)) fail(`Module '${modName}' not found in src/`);

  printHeader(`Module: ${modName}`);
  const mod = require(modPath);
  const exportedKeys = Object.keys(mod);

  if (exportedKeys.length === 0) {
    warn('Module exports nothing.');
    return;
  }

  process.stdout.write(`${colour('dim', 'Exports:')} ${exportedKeys.map(k => colour('cyan', k)).join(', ')}\n\n`);

  // If there's a single function export, call it as a demo
  if (exportedKeys.length === 1 && typeof mod[exportedKeys[0]] === 'function') {
    const fn = mod[exportedKeys[0]];
    process.stdout.write(`${colour('dim', 'Demo:')} calling ${colour('cyan', fn.name || exportedKeys[0])}()\n`);
    try {
      const result = fn();
      if (result !== undefined) {
        process.stdout.write(`${colour('dim', 'Result:')} ${JSON.stringify(result, null, 2)}\n`);
      } else {
        ok('Function called successfully (returned undefined).');
      }
    } catch (e) {
      warn(`Function threw: ${e.message}`);
    }
  }
}

function cmdList(flags) {
  if (flags.help) exit(0, HELP_LIST);

  printHeader('Available Modules');
  const modules = cli.listModules();
  if (modules.length === 0) { warn('No modules found in src/.'); return; }

  const maxLen = modules.reduce((m, n) => Math.max(m, n.length), 0);
  for (const mod of modules) {
    const summary = cli.getModuleSummary(mod) || colour('dim', '(no summary)');
    process.stdout.write(`  ${colour('green', mod.padEnd(maxLen + 2))}${summary}\n`);
  }
  process.stdout.write(`\n${colour('dim', `${modules.length} module(s) found`)}\n`);
}

function cmdTest(flags) {
  if (flags.help) exit(0, HELP_TEST);

  printHeader('Running Tests');
  const { results, total, passed, failed } = cli.runAllTests();

  for (const r of results) {
    const status = r.passed ? colour('green', '✔ PASS') : colour('red', '✖ FAIL');
    const timing = colour('dim', `${r.durationMs}ms`);
    process.stdout.write(`  ${status}  ${r.file.padEnd(36)} ${timing}\n`);
    if (!r.passed || flags.verbose) {
      // Indent output
      const lines = r.output.trim().split('\n').map(l => '       ' + l).join('\n');
      process.stdout.write(lines + '\n');
    }
  }

  process.stdout.write('\n');
  const summary = `${passed}/${total} passed`;
  if (failed > 0) {
    process.stderr.write(`${colour('red', `✖ ${failed} test file(s) failed`)} — ${summary}\n`);
    process.exit(1);
  } else {
    ok(`All tests passed — ${summary}`);
  }
}

function cmdDocs(flags) {
  if (flags.help) exit(0, HELP_DOCS);

  printHeader('Generating Documentation');
  const scriptPath = path.resolve(__dirname, '..', 'scripts', 'generate-docs.js');
  if (!fs.existsSync(scriptPath)) fail('scripts/generate-docs.js not found.');

  const args = flags.watch ? ['--watch'] : [];
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    stdio: 'inherit'
  });
  if (result.status !== 0) process.exit(result.status || 1);
}

function cmdInfo(positional, flags) {
  if (flags.help) exit(0, HELP_INFO);
  const modName = positional[0];
  if (!modName) fail('Usage: forever info <module>');

  const modPath = path.resolve(__dirname, '..', 'src', `${modName}.js`);
  if (!fs.existsSync(modPath)) fail(`Module '${modName}' not found in src/`);

  printHeader(`API: ${modName}`);

  const summary = cli.getModuleSummary(modName);
  if (summary) process.stdout.write(`${colour('dim', summary)}\n\n`);

  const exports = cli.getExports(modName);
  process.stdout.write(`${colour('yellow', 'Exports:')} ${exports.map(e => colour('cyan', e)).join(', ')}\n\n`);

  const api = cli.getModuleAPI(modName);
  if (api.length === 0) {
    warn('No JSDoc-annotated functions found.');
    return;
  }

  for (const fn of api) {
    const sig = `${colour('green', fn.name)}(${colour('cyan', fn.params || '')})${fn.returns ? ` → ${colour('yellow', fn.returns)}` : ''}`;
    process.stdout.write(`  ${sig}\n`);
    if (fn.description) process.stdout.write(`  ${colour('dim', fn.description)}\n`);
    process.stdout.write('\n');
  }
}

async function cmdBenchmark(flags) {
  if (flags.help) exit(0, HELP_BENCHMARK);

  const format = flags.format || 'table';
  if (!['table', 'json'].includes(format)) fail(`--format must be 'table' or 'json'.`);

  printHeader('Benchmark Suite');
  const benchDir = path.resolve(__dirname, '..', 'benchmarks');
  const benchFiles = [
    'cache.bench.js', 'memoize.bench.js', 'eventBus.bench.js',
    'queue.bench.js', 'retry.bench.js', 'pipeline.bench.js', 'validator.bench.js',
  ];

  const allResults = [];
  for (const file of benchFiles) {
    const filePath = path.join(benchDir, file);
    if (!fs.existsSync(filePath)) { warn(`Benchmark file not found: ${file}`); continue; }
    try {
      const suite = require(filePath);
      process.stdout.write(`${colour('dim', 'Running')} ${suite.name || file}…\n`);
      const results = await suite.run();
      allResults.push(...results);
    } catch (err) {
      warn(`Error running ${file}: ${err.message}`);
    }
  }

  if (allResults.length === 0) { warn('No benchmark results.'); return; }

  if (format === 'json') {
    process.stdout.write(JSON.stringify(allResults, null, 2) + '\n');
  } else {
    const H = `${colour('bold', 'Name'.padEnd(36))} ${'Mean(ms)'.padStart(10)} ${'p95(ms)'.padStart(10)} ${'Max(ms)'.padStart(10)}`;
    process.stdout.write('\n' + H + '\n' + colour('dim', '─'.repeat(70)) + '\n');
    for (const r of allResults) {
      process.stdout.write(
        `${colour('cyan', r.name.padEnd(36))} ` +
        `${r.mean.toFixed(3).padStart(10)} ` +
        `${r.p95.toFixed(3).padStart(10)} ` +
        `${r.max.toFixed(3).padStart(10)}\n`
      );
    }
    process.stdout.write('\n');
  }
}

async function cmdValidate(flags) {
  if (flags.help) exit(0, HELP_VALIDATE);

  let raw;
  if (flags.file) {
    const filePath = path.resolve(process.cwd(), flags.file);
    if (!fs.existsSync(filePath)) fail(`File not found: ${filePath}`);
    raw = fs.readFileSync(filePath, 'utf8');
  } else {
    raw = await readStdin();
  }

  let data;
  try { data = JSON.parse(raw); }
  catch (e) { fail(`Invalid JSON – ${e.message}`); }

  if (!flags.schema) {
    process.stdout.write(JSON.stringify({ valid: true, errors: [] }, null, 2) + '\n');
    return;
  }

  const schemaPath = path.resolve(process.cwd(), flags.schema);
  if (!fs.existsSync(schemaPath)) fail(`Schema file not found: ${schemaPath}`);

  let schema;
  try { schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8')); }
  catch (e) { fail(`Invalid schema JSON – ${e.message}`); }

  const errors = [];
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    if (rules.required && (value === undefined || value === null)) {
      errors.push(`"${field}" is required but missing.`); continue;
    }
    if (value !== undefined && rules.type && typeof value !== rules.type)
      errors.push(`"${field}" must be ${rules.type}, got ${typeof value}.`);
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) errors.push(`"${field}" must be >= ${rules.min}.`);
      if (rules.max !== undefined && value > rules.max) errors.push(`"${field}" must be <= ${rules.max}.`);
    }
  }

  const result = { valid: errors.length === 0, errors };
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  if (!result.valid) process.exit(1);
}

function cmdPlugin(positional, flags) {
  if (flags.help || positional.length === 0) exit(0, HELP_PLUGIN);
  const sub = positional[0];
  if (sub === 'list') {
    printHeader('Built-in Plugins');
    const builtins = [
      { name: 'loggingPlugin', description: 'Logs every function call with timestamps.' },
      { name: 'timingPlugin',  description: 'Records execution time per call.' },
    ];
    for (const p of builtins) {
      process.stdout.write(`  ${colour('cyan', p.name.padEnd(20))} ${p.description}\n`);
    }
    process.stdout.write('\n');
  } else {
    fail(`Unknown plugin sub-command: "${sub}". Try: forever plugin list`);
  }
}

async function cmdHealth(flags) {
  if (flags.help) exit(0, HELP_HEALTH);

  const format = flags.format || 'text';
  if (!['text', 'json'].includes(format)) fail(`--format must be 'text' or 'json'.`);

  printHeader('Health Check Report');
  
  try {
    const { health } = require('../src/index.js');
    
    if (format === 'json') {
      const report = await health.toJSON();
      process.stdout.write(JSON.stringify(report, null, 2) + '\n');
      
      // Exit with appropriate code based on status
      if (report.status === 'failing') {
        process.exit(1);
      } else if (report.status === 'degraded') {
        process.exit(2);
      }
    } else {
      const report = await health.check();
      const fullReport = await health.toJSON();
      
      // Overall status
      let statusColor;
      switch (report.status) {
        case 'ok': statusColor = 'green'; break;
        case 'degraded': statusColor = 'yellow'; break;
        case 'failing': statusColor = 'red'; break;
      }
      
      process.stdout.write(`${colour('bold', 'Overall Status:')} ${colour(statusColor, report.status.toUpperCase())}\n`);
      process.stdout.write(`${colour('dim', 'Summary:')} ${report.summary}\n`);
      process.stdout.write(`${colour('dim', 'Duration:')} ${report.totalDurationMs}ms\n`);
      process.stdout.write(`${colour('dim', 'Timestamp:')} ${new Date(report.timestamp).toLocaleString()}\n\n`);
      
      // Individual checks
      process.stdout.write(`${colour('bold', 'Individual Checks:')}\n`);
      for (const check of report.checks) {
        const checkStatusColor = check.status === 'ok' ? 'green' : 'red';
        const statusIcon = check.status === 'ok' ? '✔' : '✖';
        process.stdout.write(`  ${colour(checkStatusColor, statusIcon)} ${colour('cyan', check.name.padEnd(12))} ${check.message} ${colour('dim', `(${check.durationMs}ms)`)}\n`);
      }
      
      // System info summary
      process.stdout.write(`\n${colour('bold', 'System Information:')}\n`);
      process.stdout.write(`  ${colour('dim', 'Node.js:')} ${fullReport.system.nodeVersion} on ${fullReport.system.platform}-${fullReport.system.arch}\n`);
      process.stdout.write(`  ${colour('dim', 'Uptime:')} ${(fullReport.system.uptime / 3600).toFixed(1)}h\n`);
      process.stdout.write(`  ${colour('dim', 'Memory:')} ${(fullReport.system.memory.heapUsed / 1024 / 1024).toFixed(1)}MB / ${(fullReport.system.memory.heapTotal / 1024 / 1024).toFixed(1)}MB heap\n`);
      process.stdout.write(`  ${colour('dim', 'PID:')} ${fullReport.system.pid}\n`);
      
      // Exit with appropriate code based on status
      if (report.status === 'failing') {
        process.exit(1);
      } else if (report.status === 'degraded') {
        process.exit(2);
      }
    }
  } catch (error) {
    fail(`Health check failed: ${error.message}`);
  }
}

async function cmdMetrics(flags) {
  if (flags.help) exit(0, HELP_METRICS);

  const format = flags.format || 'table';
  if (!['table', 'json'].includes(format)) fail(`--format must be 'table' or 'json'.`);

  printHeader('Metrics Report');
  
  try {
    const { metrics } = require('../src/index.js');
    
    if (format === 'json') {
      const jsonExport = metrics.exportJSON();
      process.stdout.write(JSON.stringify(jsonExport, null, 2) + '\n');
    } else {
      const jsonExport = metrics.exportJSON();
      
      if (Object.keys(jsonExport).length === 0) {
        process.stdout.write(`${colour('dim', 'No metrics collected yet.')}\n`);
        return;
      }
      
      // Group metrics by type
      const counters = [];
      const gauges = [];
      const histograms = [];
      
      for (const [name, metric] of Object.entries(jsonExport)) {
        switch (metric.type) {
          case 'counter':
            counters.push({ name, ...metric });
            break;
          case 'gauge':
            gauges.push({ name, ...metric });
            break;
          case 'histogram':
            histograms.push({ name, ...metric });
            break;
        }
      }
      
      // Display counters
      if (counters.length > 0) {
        process.stdout.write(`${colour('bold', 'Counters:')}\n`);
        for (const counter of counters) {
          process.stdout.write(`  ${colour('cyan', counter.name)}\n`);
          if (counter.help) {
            process.stdout.write(`    ${colour('dim', counter.help)}\n`);
          }
          for (const [labels, value] of Object.entries(counter.values)) {
            const labelStr = labels === '{}' ? '' : ` ${labels}`;
            process.stdout.write(`    ${labelStr}: ${colour('green', value)}\n`);
          }
          process.stdout.write('\n');
        }
      }
      
      // Display gauges
      if (gauges.length > 0) {
        process.stdout.write(`${colour('bold', 'Gauges:')}\n`);
        for (const gauge of gauges) {
          process.stdout.write(`  ${colour('cyan', gauge.name)}\n`);
          if (gauge.help) {
            process.stdout.write(`    ${colour('dim', gauge.help)}\n`);
          }
          for (const [labels, value] of Object.entries(gauge.values)) {
            const labelStr = labels === '{}' ? '' : ` ${labels}`;
            process.stdout.write(`    ${labelStr}: ${colour('yellow', value)}\n`);
          }
          process.stdout.write('\n');
        }
      }
      
      // Display histograms
      if (histograms.length > 0) {
        process.stdout.write(`${colour('bold', 'Histograms:')}\n`);
        for (const histogram of histograms) {
          process.stdout.write(`  ${colour('cyan', histogram.name)}\n`);
          if (histogram.help) {
            process.stdout.write(`    ${colour('dim', histogram.help)}\n`);
          }
          for (const [labels, data] of Object.entries(histogram.values)) {
            const labelStr = labels === '{}' ? '' : ` ${labels}`;
            process.stdout.write(`    ${labelStr}:\n`);
            process.stdout.write(`      Count: ${colour('green', data.count)}\n`);
            process.stdout.write(`      Sum: ${colour('yellow', data.sum.toFixed(3))}\n`);
            process.stdout.write(`      Buckets:\n`);
            for (const bucket of data.buckets) {
              const bucketStr = `        ≤${bucket.le}s: ${bucket.count}`;
              process.stdout.write(`      ${bucketStr}\n`);
            }
            process.stdout.write('\n');
          }
        }
      }
      
      // Show built-in metrics status
      const builtInCount = Object.keys(jsonExport).filter(name => 
        name.startsWith('nodejs_') || name.startsWith('forever_')
      ).length;
      
      if (builtInCount > 0) {
        process.stdout.write(`${colour('dim', `Built-in metrics: ${builtInCount} active`)}\n`);
      }
    }
  } catch (error) {
    fail(`Metrics display failed: ${error.message}`);
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const argv = process.argv.slice(2);
  const { flags, positional } = parseArgs(argv);
  const command = positional[0];

  if (flags.version) {
    process.stdout.write(`forever v${PKG.version}\n`);
    process.exit(0);
  }

  if (!command || flags.help) exit(0, HELP_ROOT);

  switch (command) {
    case 'run':       cmdRun(positional.slice(1), flags); break;
    case 'list':      cmdList(flags); break;
    case 'test':      cmdTest(flags); break;
    case 'docs':      cmdDocs(flags); break;
    case 'info':      cmdInfo(positional.slice(1), flags); break;
    case 'benchmark': await cmdBenchmark(flags); break;
    case 'validate':  await cmdValidate(flags); break;
    case 'plugin':    cmdPlugin(positional.slice(1), flags); break;
    case 'health':    await cmdHealth(flags); break;
    case 'metrics':   await cmdMetrics(flags); break;
    default:
      fail(`Unknown command: "${command}". Run 'forever --help' for usage.`);
  }
}

main().catch(err => {
  process.stderr.write(`${colour('red', 'Fatal error:')} ${err.message}\n`);
  process.exit(1);
});
