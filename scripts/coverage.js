#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
let watchMode = false;
let verbose = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--watch') {
    watchMode = true;
  } else if (args[i] === '--verbose' || args[i] === '-v') {
    verbose = true;
  }
}

// Coverage thresholds
const THRESHOLDS = {
  lines: 80,
  functions: 90,
  branches: 70,
  statements: 80
};

function log(message) {
  if (verbose) {
    console.log(`[coverage] ${message}`);
  }
}

function runCoverage() {
  try {
    log('Starting coverage collection...');
    
    // Build c8 command to run all tests
    let c8Command = 'npx c8';
    
    // Add reporter options
    c8Command += ' --reporter=html';
    c8Command += ' --reporter=json';
    c8Command += ' --reporter=text';
    c8Command += ' --reporter=lcov';
    
    // Set output directory
    c8Command += ' --reports-dir=coverage';
    
    // Add thresholds
    c8Command += ` --lines=${THRESHOLDS.lines}`;
    c8Command += ` --functions=${THRESHOLDS.functions}`;
    c8Command += ` --branches=${THRESHOLDS.branches}`;
    c8Command += ` --statements=${THRESHOLDS.statements}`;
    
    // Include source files
    c8Command += ' --src=src';
    
    // Exclude certain files
    c8Command += ' --exclude=**/*.test.js';
    c8Command += ' --exclude=coverage/**';
    c8Command += ' --exclude=scripts/**';
    
    // Add watch mode if requested
    if (watchMode) {
      c8Command += ' --watch';
      c8Command += ' --node-option=--experimental-loader=c8/loader.mjs';
    }
    
    // Read package.json to get test command and run it through c8
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const testCommand = packageJson.scripts.test;
    
    if (!testCommand) {
      throw new Error('No test script found in package.json');
    }
    
    // Add the test command
    c8Command += ' -- ' + testCommand;
    
    log(`Running command: ${c8Command}`);
    
    // Execute the coverage command
    const output = execSync(c8Command, { 
      encoding: 'utf8',
      stdio: watchMode ? 'inherit' : 'pipe'
    });
    
    if (!watchMode) {
      console.log(output);
    }
    
    if (!watchMode) {
      // Process coverage results
      processCoverageResults();
    }
    
  } catch (error) {
    console.error('Coverage collection failed:', error.message);
    
    if (!watchMode && error.status === 1) {
      console.error('\n❌ Coverage thresholds not met!');
      process.exit(1);
    }
    
    process.exit(error.status || 1);
  }
}

function processCoverageResults() {
  try {
    log('Processing coverage results...');
    
    // Read the coverage summary from JSON report (try both possible filenames)
    let coverageJsonPath = path.join('coverage', 'coverage-summary.json');
    if (!fs.existsSync(coverageJsonPath)) {
      coverageJsonPath = path.join('coverage', 'coverage-final.json');
    }
    
    if (!fs.existsSync(coverageJsonPath)) {
      console.warn('Warning: coverage JSON file not found');
      return;
    }
    
    const coverageData = JSON.parse(fs.readFileSync(coverageJsonPath, 'utf8'));
    
    // Handle different JSON formats from c8
    let total;
    if (coverageData.total) {
      // coverage-summary.json format
      total = coverageData.total;
    } else {
      // coverage-final.json format - calculate totals
      const files = Object.values(coverageData);
      total = {
        lines: { 
          pct: calculateAverage(files, 'lines'),
          covered: sumValues(files, 'lines', 'covered'),
          total: sumValues(files, 'lines', 'total')
        },
        functions: { 
          pct: calculateAverage(files, 'functions'),
          covered: sumValues(files, 'functions', 'covered'),
          total: sumValues(files, 'functions', 'total')
        },
        branches: { 
          pct: calculateAverage(files, 'branches'),
          covered: sumValues(files, 'branches', 'covered'),
          total: sumValues(files, 'branches', 'total')
        },
        statements: { 
          pct: calculateAverage(files, 'statements'),
          covered: sumValues(files, 'statements', 'covered'),
          total: sumValues(files, 'statements', 'total')
        }
      };
    }
    
    console.log('\n📊 Coverage Summary:');
    console.log(`   Lines: ${total.lines.pct}% (${total.lines.covered}/${total.lines.total})`);
    console.log(`   Functions: ${total.functions.pct}% (${total.functions.covered}/${total.functions.total})`);
    console.log(`   Branches: ${total.branches.pct}% (${total.branches.covered}/${total.branches.total})`);
    console.log(`   Statements: ${total.statements.pct}% (${total.statements.covered}/${total.statements.total})`);
    
    // Check thresholds
    const thresholdsMet = 
      total.lines.pct >= THRESHOLDS.lines &&
      total.functions.pct >= THRESHOLDS.functions &&
      total.branches.pct >= THRESHOLDS.branches &&
      total.statements.pct >= THRESHOLDS.statements;
    
    if (thresholdsMet) {
      console.log('\n✅ All coverage thresholds met!');
    } else {
      console.log('\n❌ Coverage thresholds not met:');
      if (total.lines.pct < THRESHOLDS.lines) {
        console.log(`   Lines: ${total.lines.pct}% < ${THRESHOLDS.lines}%`);
      }
      if (total.functions.pct < THRESHOLDS.functions) {
        console.log(`   Functions: ${total.functions.pct}% < ${THRESHOLDS.functions}%`);
      }
      if (total.branches.pct < THRESHOLDS.branches) {
        console.log(`   Branches: ${total.branches.pct}% < ${THRESHOLDS.branches}%`);
      }
      if (total.statements.pct < THRESHOLDS.statements) {
        console.log(`   Statements: ${total.statements.pct}% < ${THRESHOLDS.statements}%`);
      }
      
      process.exit(1);
    }
    
    // Generate coverage badge
    generateCoverageBadge(total.lines.pct);
    
    // Generate coverage report for changelog integration
    generateCoverageReport(total);
    
  } catch (error) {
    console.error('Error processing coverage results:', error.message);
  }
}

function calculateAverage(files, metric) {
  const validFiles = files.filter(file => file[metric] && file[metric].total > 0);
  if (validFiles.length === 0) return 0;
  
  const total = validFiles.reduce((sum, file) => sum + file[metric].pct, 0);
  return Math.round(total / validFiles.length * 100) / 100;
}

function sumValues(files, metric, field) {
  return files.reduce((sum, file) => {
    if (file[metric] && typeof file[metric][field] === 'number') {
      return sum + file[metric][field];
    }
    return sum;
  }, 0);
}

function generateCoverageBadge(coveragePercentage) {
  try {
    log('Generating coverage badge...');
    
    const percentage = Math.round(coveragePercentage);
    let color = '#e05d44'; // red for < 60%
    
    if (percentage >= 80) {
      color = '#97ca00'; // green for >= 80%
    } else if (percentage >= 60) {
      color = '#dfb317'; // yellow for 60-79%
    }
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="108" height="20" role="img" aria-label="coverage: ${percentage}%">
  <title>coverage: ${percentage}%</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="108" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="62" height="20" fill="#555"/>
    <rect x="62" width="46" height="20" fill="${color}"/>
    <rect width="108" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text aria-hidden="true" x="320" y="150" fill="#010101" transform="scale(.1)" textLength="420">coverage</text>
    <text x="320" y="150" transform="scale(.1)" fill="#fff" textLength="420">coverage</text>
    <text aria-hidden="true" x="840" y="150" fill="#010101" transform="scale(.1)" textLength="360">${percentage}%</text>
    <text x="840" y="150" transform="scale(.1)" fill="#fff" textLength="360">${percentage}%</text>
  </g>
</svg>`;
    
    const badgePath = path.join('coverage', 'coverage-badge.svg');
    fs.writeFileSync(badgePath, svg);
    
    console.log(`📈 Coverage badge generated: ${badgePath}`);
    console.log(`   ![coverage](coverage/coverage-badge.svg)`);
    
  } catch (error) {
    console.error('Error generating coverage badge:', error.message);
  }
}

function generateCoverageReport(coverageData) {
  try {
    log('Generating coverage report for changelog integration...');
    
    const report = {
      timestamp: new Date().toISOString(),
      coverage: {
        lines: {
          percentage: coverageData.lines.pct,
          covered: coverageData.lines.covered,
          total: coverageData.lines.total
        },
        functions: {
          percentage: coverageData.functions.pct,
          covered: coverageData.functions.covered,
          total: coverageData.functions.total
        },
        branches: {
          percentage: coverageData.branches.pct,
          covered: coverageData.branches.covered,
          total: coverageData.branches.total
        },
        statements: {
          percentage: coverageData.statements.pct,
          covered: coverageData.statements.covered,
          total: coverageData.statements.total
        }
      },
      thresholds: THRESHOLDS,
      thresholdsMet: {
        lines: coverageData.lines.pct >= THRESHOLDS.lines,
        functions: coverageData.functions.pct >= THRESHOLDS.functions,
        branches: coverageData.branches.pct >= THRESHOLDS.branches,
        statements: coverageData.statements.pct >= THRESHOLDS.statements
      }
    };
    
    const reportPath = path.join('coverage', 'coverage-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Coverage report generated: ${reportPath}`);
    
  } catch (error) {
    console.error('Error generating coverage report:', error.message);
  }
}

function showHelp() {
  console.log(`
Usage: node scripts/coverage.js [options]

Options:
  --watch        Enable watch mode for continuous coverage monitoring
  --verbose, -v  Enable verbose logging
  --help         Show this help message

Coverage Thresholds:
  Lines: ${THRESHOLDS.lines}%
  Functions: ${THRESHOLDS.functions}%
  Branches: ${THRESHOLDS.branches}%
  Statements: ${THRESHOLDS.statements}%

Generated Files:
  coverage/coverage.html           - HTML coverage report
  coverage/coverage.json           - Raw coverage data
  coverage/coverage-badge.svg      - Coverage badge for README
  coverage/coverage-report.json   - Summary report for changelog integration
`);
}

// Main execution
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

if (watchMode) {
  console.log('🔍 Starting coverage in watch mode...');
  console.log('   Press Ctrl+C to stop');
}

runCoverage();

module.exports = {
  runCoverage,
  processCoverageResults,
  generateCoverageBadge,
  generateCoverageReport,
  THRESHOLDS
};
