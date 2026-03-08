const fs = require('fs');
const path = require('path');

// Mock child_process.execSync for testing
const originalExecSync = require('child_process').execSync;

function mockExecSync(command, options) {
  if (command.includes('c8')) {
    // Mock successful coverage run
    return 'Coverage collection complete';
  }
  return originalExecSync(command, options);
}

function mockExecSyncFailure(command, options) {
  if (command.includes('c8')) {
    const error = new Error('Coverage thresholds not met');
    error.status = 1;
    throw error;
  }
  return originalExecSync(command, options);
}

// Test functions
function testCoverageScriptExists() {
  console.log('Testing coverage script exists...');
  
  const scriptPath = path.join(__dirname, '../scripts/coverage.js');
  if (!fs.existsSync(scriptPath)) {
    throw new Error('Coverage script does not exist');
  }
  
  console.log('✓ Coverage script exists');
}

function testCoverageDirectoryExists() {
  console.log('Testing coverage directory exists...');
  
  const coverageDir = path.join(__dirname, '../coverage');
  if (!fs.existsSync(coverageDir)) {
    throw new Error('Coverage directory does not exist');
  }
  
  console.log('✓ Coverage directory exists');
}

function testCoverageModuleExports() {
  console.log('Testing coverage module exports...');
  
  // Temporarily replace execSync
  const originalModule = require('child_process');
  originalModule.execSync = mockExecSync;
  
  try {
    const coverage = require('../scripts/coverage.js');
    
    if (typeof coverage.runCoverage !== 'function') {
      throw new Error('runCoverage function not exported');
    }
    
    if (typeof coverage.processCoverageResults !== 'function') {
      throw new Error('processCoverageResults function not exported');
    }
    
    if (typeof coverage.generateCoverageBadge !== 'function') {
      throw new Error('generateCoverageBadge function not exported');
    }
    
    if (typeof coverage.generateCoverageReport !== 'function') {
      throw new Error('generateCoverageReport function not exported');
    }
    
    if (!coverage.THRESHOLDS) {
      throw new Error('THRESHOLDS not exported');
    }
    
    // Check threshold values
    if (coverage.THRESHOLDS.lines !== 80) {
      throw new Error('Incorrect lines threshold');
    }
    
    if (coverage.THRESHOLDS.functions !== 90) {
      throw new Error('Incorrect functions threshold');
    }
    
    if (coverage.THRESHOLDS.branches !== 70) {
      throw new Error('Incorrect branches threshold');
    }
    
    if (coverage.THRESHOLDS.statements !== 80) {
      throw new Error('Incorrect statements threshold');
    }
    
  } finally {
    // Restore original execSync
    originalModule.execSync = originalExecSync;
  }
  
  console.log('✓ Coverage module exports correct functions and thresholds');
}

function testCoverageBadgeGeneration() {
  console.log('Testing coverage badge generation...');
  
  // Create mock coverage data
  const mockCoverageData = {
    lines: { pct: 85.5, covered: 171, total: 200 },
    functions: { pct: 92.3, covered: 24, total: 26 },
    branches: { pct: 75.0, covered: 15, total: 20 },
    statements: { pct: 82.1, covered: 164, total: 200 }
  };
  
  // Temporarily replace execSync
  const originalModule = require('child_process');
  originalModule.execSync = mockExecSync;
  
  try {
    const coverage = require('../scripts/coverage.js');
    
    // Create temporary coverage directory if it doesn't exist
    const coverageDir = path.join(__dirname, '../coverage');
    if (!fs.existsSync(coverageDir)) {
      fs.mkdirSync(coverageDir, { recursive: true });
    }
    
    // Generate badge
    coverage.generateCoverageBadge(mockCoverageData.lines.pct);
    
    // Check if badge was created
    const badgePath = path.join(__dirname, '../coverage/coverage-badge.svg');
    if (!fs.existsSync(badgePath)) {
      throw new Error('Coverage badge not generated');
    }
    
    // Check badge content
    const badgeContent = fs.readFileSync(badgePath, 'utf8');
    if (!badgeContent.includes('coverage: 86%')) { // Should be rounded
      throw new Error('Badge content incorrect');
    }
    
    if (!badgeContent.includes('#97ca00')) { // Should be green for >= 80%
      throw new Error('Badge color incorrect');
    }
    
    // Clean up
    if (fs.existsSync(badgePath)) {
      fs.unlinkSync(badgePath);
    }
    
  } finally {
    // Restore original execSync
    originalModule.execSync = originalExecSync;
  }
  
  console.log('✓ Coverage badge generation works correctly');
}

function testCoverageReportGeneration() {
  console.log('Testing coverage report generation...');
  
  // Create mock coverage data
  const mockCoverageData = {
    lines: { pct: 85.5, covered: 171, total: 200 },
    functions: { pct: 92.3, covered: 24, total: 26 },
    branches: { pct: 75.0, covered: 15, total: 20 },
    statements: { pct: 82.1, covered: 164, total: 200 }
  };
  
  // Temporarily replace execSync
  const originalModule = require('child_process');
  originalModule.execSync = mockExecSync;
  
  try {
    const coverage = require('../scripts/coverage.js');
    
    // Create temporary coverage directory if it doesn't exist
    const coverageDir = path.join(__dirname, '../coverage');
    if (!fs.existsSync(coverageDir)) {
      fs.mkdirSync(coverageDir, { recursive: true });
    }
    
    // Generate report
    coverage.generateCoverageReport(mockCoverageData);
    
    // Check if report was created
    const reportPath = path.join(__dirname, '../coverage/coverage-report.json');
    if (!fs.existsSync(reportPath)) {
      throw new Error('Coverage report not generated');
    }
    
    // Check report content
    const reportContent = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    
    if (!reportContent.timestamp) {
      throw new Error('Report missing timestamp');
    }
    
    if (!reportContent.coverage) {
      throw new Error('Report missing coverage data');
    }
    
    if (reportContent.coverage.lines.percentage !== 85.5) {
      throw new Error('Report lines percentage incorrect');
    }
    
    if (!reportContent.thresholds) {
      throw new Error('Report missing thresholds');
    }
    
    if (!reportContent.thresholdsMet) {
      throw new Error('Report missing thresholdsMet data');
    }
    
    // Clean up
    if (fs.existsSync(reportPath)) {
      fs.unlinkSync(reportPath);
    }
    
  } finally {
    // Restore original execSync
    originalModule.execSync = originalExecSync;
  }
  
  console.log('✓ Coverage report generation works correctly');
}

function testThresholdValidation() {
  console.log('Testing threshold validation...');
  
  // Test case 1: All thresholds met
  const goodCoverage = {
    lines: { pct: 85, covered: 85, total: 100 },
    functions: { pct: 95, covered: 19, total: 20 },
    branches: { pct: 75, covered: 15, total: 20 },
    statements: { pct: 82, covered: 82, total: 100 }
  };
  
  // Test case 2: Some thresholds not met
  const badCoverage = {
    lines: { pct: 75, covered: 75, total: 100 }, // Below 80%
    functions: { pct: 95, covered: 19, total: 20 },
    branches: { pct: 65, covered: 13, total: 20 }, // Below 70%
    statements: { pct: 82, covered: 82, total: 100 }
  };
  
  // Temporarily replace execSync
  const originalModule = require('child_process');
  originalModule.execSync = mockExecSync;
  
  try {
    const coverage = require('../scripts/coverage.js');
    const THRESHOLDS = coverage.THRESHOLDS;
    
    // Test good coverage
    const thresholdsMet1 = 
      goodCoverage.lines.pct >= THRESHOLDS.lines &&
      goodCoverage.functions.pct >= THRESHOLDS.functions &&
      goodCoverage.branches.pct >= THRESHOLDS.branches &&
      goodCoverage.statements.pct >= THRESHOLDS.statements;
    
    if (!thresholdsMet1) {
      throw new Error('Good coverage should pass thresholds');
    }
    
    // Test bad coverage
    const thresholdsMet2 = 
      badCoverage.lines.pct >= THRESHOLDS.lines &&
      badCoverage.functions.pct >= THRESHOLDS.functions &&
      badCoverage.branches.pct >= THRESHOLDS.branches &&
      badCoverage.statements.pct >= THRESHOLDS.statements;
    
    if (thresholdsMet2) {
      throw new Error('Bad coverage should fail thresholds');
    }
    
  } finally {
    // Restore original execSync
    originalModule.execSync = originalExecSync;
  }
  
  console.log('✓ Threshold validation works correctly');
}

function testPackageJsonConfiguration() {
  console.log('Testing package.json configuration...');
  
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Check if coverage script exists
  if (!packageJson.scripts.coverage) {
    throw new Error('Coverage script not found in package.json');
  }
  
  if (!packageJson.scripts.coverage.includes('node scripts/coverage.js')) {
    throw new Error('Coverage script incorrect');
  }
  
  // Check if c8 configuration exists
  if (!packageJson.c8) {
    throw new Error('c8 configuration not found in package.json');
  }
  
  // Check c8 thresholds
  if (packageJson.c8.lines !== 80) {
    throw new Error('c8 lines threshold incorrect');
  }
  
  if (packageJson.c8.functions !== 90) {
    throw new Error('c8 functions threshold incorrect');
  }
  
  if (packageJson.c8.branches !== 70) {
    throw new Error('c8 branches threshold incorrect');
  }
  
  if (packageJson.c8.statements !== 80) {
    throw new Error('c8 statements threshold incorrect');
  }
  
  // Check if coverage test is included in test script
  if (!packageJson.scripts.test.includes('coverage.test.js')) {
    throw new Error('Coverage test not included in test script');
  }
  
  console.log('✓ Package.json configuration is correct');
}

// Run all tests
function runTests() {
  console.log('Running coverage system tests...\n');
  
  try {
    testCoverageScriptExists();
    testCoverageDirectoryExists();
    testCoverageModuleExports();
    testCoverageBadgeGeneration();
    testCoverageReportGeneration();
    testThresholdValidation();
    testPackageJsonConfiguration();
    
    console.log('\n✅ All coverage tests passed!');
  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = {
  testCoverageScriptExists,
  testCoverageDirectoryExists,
  testCoverageModuleExports,
  testCoverageBadgeGeneration,
  testCoverageReportGeneration,
  testThresholdValidation,
  testPackageJsonConfiguration,
  runTests
};
