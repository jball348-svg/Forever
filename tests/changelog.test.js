const { execSync } = require('child_process');
const path = require('path');

// Mock child_process.execSync for testing
const originalExecSync = execSync;

function mockExecSync(command, options) {
  if (command.includes('git log')) {
    // Mock git log output with various commit types
    return `abc1234|feat: add new feature|2024-01-15
def5678|fix: resolve bug in authentication|2024-01-14
ghi9012|perf: improve database query performance|2024-01-13
jkl3456|refactor: restructure user service|2024-01-12
mno7890|docs: update API documentation|2024-01-11
pqr2345|chore: update dependencies|2024-01-10
stu6789|test: add unit tests for utils|2024-01-09
vwx0123|random commit without conventional format|2024-01-08
yza4567|feat(auth): add OAuth support|2024-01-07
bcd8901|fix(ui): resolve button styling issue|2024-01-06`;
  }
  return originalExecSync(command, options);
}

// Test functions
function testParseGitCommits() {
  console.log('Testing parseGitCommits...');
  
  // Temporarily replace execSync
  const originalModule = require('child_process');
  originalModule.execSync = mockExecSync;
  
  const changelogGenerator = require('../scripts/generate-changelog.js');
  const commits = changelogGenerator.parseGitCommits();
  
  // Restore original execSync
  originalModule.execSync = originalExecSync;
  
  if (commits.length !== 10) {
    throw new Error(`Expected 10 commits, got ${commits.length}`);
  }
  
  const firstCommit = commits[0];
  if (firstCommit.sha !== 'abc1234') {
    throw new Error(`Expected SHA 'abc1234', got '${firstCommit.sha}'`);
  }
  
  if (firstCommit.message !== 'feat: add new feature') {
    throw new Error(`Expected message 'feat: add new feature', got '${firstCommit.message}'`);
  }
  
  if (firstCommit.date !== '2024-01-15') {
    throw new Error(`Expected date '2024-01-15', got '${firstCommit.date}'`);
  }
  
  console.log('✓ parseGitCommits test passed');
}

function testGroupCommitsByType() {
  console.log('Testing groupCommitsByType...');
  
  // Temporarily replace execSync
  const originalModule = require('child_process');
  originalModule.execSync = mockExecSync;
  
  const changelogGenerator = require('../scripts/generate-changelog.js');
  const commits = changelogGenerator.parseGitCommits();
  const grouped = changelogGenerator.groupCommitsByType(commits);
  
  // Restore original execSync
  originalModule.execSync = originalExecSync;
  
  // Check that all expected types exist
  const expectedTypes = ['feat', 'fix', 'perf', 'refactor', 'docs', 'chore', 'test', 'other'];
  expectedTypes.forEach(type => {
    if (!grouped.hasOwnProperty(type)) {
      throw new Error(`Missing group for type: ${type}`);
    }
  });
  
  // Check specific groupings
  if (grouped.feat.length !== 2) {
    throw new Error(`Expected 2 feat commits, got ${grouped.feat.length}`);
  }
  
  if (grouped.fix.length !== 2) {
    throw new Error(`Expected 2 fix commits, got ${grouped.fix.length}`);
  }
  
  if (grouped.other.length !== 1) {
    throw new Error(`Expected 1 other commit, got ${grouped.other.length}`);
  }
  
  if (grouped.other[0].message !== 'random commit without conventional format') {
    throw new Error('Other commit not correctly categorized');
  }
  
  console.log('✓ groupCommitsByType test passed');
}

function testGenerateMarkdownChangelog() {
  console.log('Testing generateMarkdownChangelog...');
  
  // Temporarily replace execSync
  const originalModule = require('child_process');
  originalModule.execSync = mockExecSync;
  
  const changelogGenerator = require('../scripts/generate-changelog.js');
  const commits = changelogGenerator.parseGitCommits();
  const grouped = changelogGenerator.groupCommitsByType(commits);
  const markdown = changelogGenerator.generateMarkdownChangelog(grouped);
  
  // Restore original execSync
  originalModule.execSync = originalExecSync;
  
  // Check that markdown contains expected sections
  if (!markdown.includes('# Changelog')) {
    throw new Error('Missing changelog header');
  }
  
  if (!markdown.includes('## Features')) {
    throw new Error('Missing Features section');
  }
  
  if (!markdown.includes('## Bug Fixes')) {
    throw new Error('Missing Bug Fixes section');
  }
  
  if (!markdown.includes('## Performance Improvements')) {
    throw new Error('Missing Performance Improvements section');
  }
  
  if (!markdown.includes('## Other Changes')) {
    throw new Error('Missing Other Changes section');
  }
  
  // Check that commits are properly formatted
  if (!markdown.includes('- feat: add new feature (abc1234, 2024-01-15)')) {
    throw new Error('Commit not properly formatted in markdown');
  }
  
  console.log('✓ generateMarkdownChangelog test passed');
}

function testGenerateJsonChangelog() {
  console.log('Testing generateJsonChangelog...');
  
  // Temporarily replace execSync
  const originalModule = require('child_process');
  originalModule.execSync = mockExecSync;
  
  const changelogGenerator = require('../scripts/generate-changelog.js');
  const commits = changelogGenerator.parseGitCommits();
  const grouped = changelogGenerator.groupCommitsByType(commits);
  const json = changelogGenerator.generateJsonChangelog(grouped);
  
  // Restore original execSync
  originalModule.execSync = originalExecSync;
  
  // Check that JSON has expected structure
  if (!json.feat) {
    throw new Error('Missing feat group in JSON');
  }
  
  if (json.feat.title !== 'Features') {
    throw new Error('Incorrect title for feat group');
  }
  
  if (!Array.isArray(json.feat.commits)) {
    throw new Error('feat.commits should be an array');
  }
  
  if (json.feat.commits.length !== 2) {
    throw new Error(`Expected 2 feat commits in JSON, got ${json.feat.commits.length}`);
  }
  
  if (json.feat.commits[0].sha !== 'abc1234') {
    throw new Error('Incorrect SHA in JSON output');
  }
  
  console.log('✓ generateJsonChangelog test passed');
}

function testSinceFlag() {
  console.log('Testing --since flag...');
  
  // Mock execSync to check if since flag is passed
  let capturedCommand = null;
  const mockWithSince = (command, options) => {
    capturedCommand = command;
    return mockExecSync(command, options);
  };
  
  const originalModule = require('child_process');
  originalModule.execSync = mockWithSince;
  
  // Mock process.argv
  const originalArgv = process.argv;
  process.argv = ['node', 'generate-changelog.js', '--since', 'v1.0.0'];
  
  try {
    // Re-require the module to pick up new argv
    delete require.cache[require.resolve('../scripts/generate-changelog.js')];
    const changelogGenerator = require('../scripts/generate-changelog.js');
    changelogGenerator.parseGitCommits();
    
    if (!capturedCommand.includes('v1.0.0..HEAD')) {
      throw new Error('Since flag not properly passed to git command');
    }
  } finally {
    // Restore
    process.argv = originalArgv;
    originalModule.execSync = originalExecSync;
    delete require.cache[require.resolve('../scripts/generate-changelog.js')];
  }
  
  console.log('✓ --since flag test passed');
}

// Run all tests
function runTests() {
  console.log('Running changelog generator tests...\n');
  
  try {
    testParseGitCommits();
    testGroupCommitsByType();
    testGenerateMarkdownChangelog();
    testGenerateJsonChangelog();
    testSinceFlag();
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = {
  testParseGitCommits,
  testGroupCommitsByType,
  testGenerateMarkdownChangelog,
  testGenerateJsonChangelog,
  testSinceFlag,
  runTests
};
