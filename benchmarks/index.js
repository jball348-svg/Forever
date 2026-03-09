#!/usr/bin/env node
/**
 * benchmarks/index.js
 * Main benchmark runner – executes all module benchmarks and prints a summary.
 *
 * Usage: node benchmarks/index.js
 */

const { benchmark, exportJSON, exportCSV } = require('../src/performance');
const fs   = require('fs');
const path = require('path');

// ─── Import module benchmarks ────────────────────────────────────────────────
const cacheBench      = require('./cache.bench');
const memoizeBench    = require('./memoize.bench');
const eventBusBench   = require('./eventBus.bench');
const queueBench      = require('./queue.bench');
const retryBench      = require('./retry.bench');
const pipelineBench   = require('./pipeline.bench');
const validatorBench  = require('./validator.bench');

async function runAll() {
  console.log('\n🚀  Forever – Performance Benchmark Suite\n');
  console.log('='.repeat(60));

  const suites = [
    cacheBench,
    memoizeBench,
    eventBusBench,
    queueBench,
    retryBench,
    pipelineBench,
    validatorBench,
  ];

  const results = [];

  for (const suite of suites) {
    console.log(`\n📦  ${suite.name}`);
    console.log('-'.repeat(40));
    const suiteResults = await suite.run();
    for (const r of suiteResults) {
      results.push(r);
      const bar = '█'.repeat(Math.min(Math.round(r.mean * 10), 40));
      console.log(
        `  ${r.name.padEnd(30)} mean: ${r.mean.toFixed(3).padStart(8)} ms  ` +
        `p95: ${r.p95.toFixed(3).padStart(8)} ms  ` +
        `mem Δ: ${(r.memDeltaBytes / 1024).toFixed(1).padStart(7)} KB`
      );
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅  Benchmark complete.  Exporting reports…');

  // Write reports to benchmarks/reports/
  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) {fs.mkdirSync(reportsDir, { recursive: true });}

  fs.writeFileSync(path.join(reportsDir, 'results.json'), exportJSON());
  fs.writeFileSync(path.join(reportsDir, 'results.csv'),  exportCSV());

  console.log('  → benchmarks/reports/results.json');
  console.log('  → benchmarks/reports/results.csv\n');
}

runAll().catch(err => {
  console.error('Benchmark runner failed:', err);
  process.exit(1);
});
