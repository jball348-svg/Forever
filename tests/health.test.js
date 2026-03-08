/**
 * Tests for health check system
 */

const assert = require('assert');
const { register, check, summary, toJSON } = require('../src/health');
const healthServer = require('../src/healthServer');

async function runTests() {
  // Test register()
  console.log('Testing register()...');
  
  const mockCheck = async () => ({ ok: true, message: 'Test OK' });
  
  // Should register a valid health check
  assert.doesNotThrow(() => register('test', mockCheck));
  
  // Should throw for invalid name
  assert.throws(() => register(123, mockCheck), /Health check name must be a string/);
  
  // Should throw for invalid function
  assert.throws(() => register('test', 'not a function'), /Health check function must be a function/);
  
  console.log('✓ register() tests passed');
  
  // Test check()
  console.log('Testing check()...');
  
  const result = await check();
  
  // Check result structure
  assert(typeof result.status === 'string', 'status should be string');
  assert(['ok', 'degraded', 'failing'].includes(result.status), 'status should be valid');
  assert(Array.isArray(result.checks), 'checks should be array');
  assert(typeof result.summary === 'string', 'summary should be string');
  assert(typeof result.totalDurationMs === 'number', 'totalDurationMs should be number');
  assert(typeof result.timestamp === 'string', 'timestamp should be string');
  
  // Check individual check structure
  for (const checkResult of result.checks) {
    assert(typeof checkResult.name === 'string', 'check name should be string');
    assert(['ok', 'failing'].includes(checkResult.status), 'check status should be valid');
    assert(typeof checkResult.message === 'string', 'check message should be string');
    assert(typeof checkResult.durationMs === 'number', 'check duration should be number');
    assert(checkResult.durationMs >= 0, 'check duration should be non-negative');
  }
  
  console.log('✓ check() tests passed');
  
  // Test failing health checks
  console.log('Testing failing health checks...');
  
  register('failingCheck', async () => ({ ok: false, message: 'Test failure' }));
  
  const resultWithFailure = await check();
  const failingCheck = resultWithFailure.checks.find(c => c.name === 'failingCheck');
  
  assert(failingCheck, 'failing check should be present');
  assert.strictEqual(failingCheck.status, 'failing', 'failing check should have failing status');
  assert.strictEqual(failingCheck.message, 'Test failure', 'failing check should have correct message');
  
  console.log('✓ failing health checks tests passed');
  
  // Test health check exceptions
  console.log('Testing health check exceptions...');
  
  register('errorCheck', async () => {
    throw new Error('Test error');
  });
  
  const resultWithError = await check();
  const errorCheck = resultWithError.checks.find(c => c.name === 'errorCheck');
  
  assert(errorCheck, 'error check should be present');
  assert.strictEqual(errorCheck.status, 'failing', 'error check should have failing status');
  assert.strictEqual(errorCheck.message, 'Test error', 'error check should have correct message');
  
  console.log('✓ health check exceptions tests passed');
  
  // Test summary()
  console.log('Testing summary()...');
  
  const summaryStr = await summary();
  
  assert(typeof summaryStr === 'string', 'summary should be string');
  assert(summaryStr.match(/\d+\/\d+ checks passing/), 'summary should have correct format');
  
  console.log('✓ summary() tests passed');
  
  // Test toJSON()
  console.log('Testing toJSON()...');
  
  const report = await toJSON();
  
  assert(report.hasOwnProperty('status'), 'report should have status');
  assert(report.hasOwnProperty('checks'), 'report should have checks');
  assert(report.hasOwnProperty('summary'), 'report should have summary');
  assert(report.hasOwnProperty('system'), 'report should have system');
  
  // Check system info
  assert(typeof report.system.nodeVersion === 'string', 'node version should be string');
  assert(typeof report.system.platform === 'string', 'platform should be string');
  assert(typeof report.system.arch === 'string', 'arch should be string');
  assert(typeof report.system.pid === 'number', 'pid should be number');
  assert(typeof report.system.uptime === 'number', 'uptime should be number');
  
  // Check memory structure
  const memKeys = ['rss', 'heapTotal', 'heapUsed', 'external', 'arrayBuffers'];
  for (const key of memKeys) {
    assert(typeof report.system.memory[key] === 'number', `memory.${key} should be number`);
    assert(report.system.memory[key] > 0, `memory.${key} should be positive`);
  }
  
  console.log('✓ toJSON() tests passed');
  
  // Test built-in checks
  console.log('Testing built-in checks...');
  
  const resultWithBuiltIns = await check();
  
  // Memory check
  const memoryCheck = resultWithBuiltIns.checks.find(c => c.name === 'memory');
  assert(memoryCheck, 'memory check should be present');
  assert(memoryCheck.message.match(/Heap usage: \d+\.\d+% \(\d+\.\d+MB \/ \d+\.\d+MB\)/), 'memory check message format');
  
  // Event loop check
  const eventLoopCheck = resultWithBuiltIns.checks.find(c => c.name === 'eventLoop');
  assert(eventLoopCheck, 'event loop check should be present');
  assert(eventLoopCheck.message.match(/Event loop lag: \d+\.\d+ms/), 'event loop check message format');
  
  // Config check
  const configCheck = resultWithBuiltIns.checks.find(c => c.name === 'config');
  assert(configCheck, 'config check should be present');
  assert(configCheck.message.match(/Config module is properly loaded|Missing config methods:|Config check failed:/), 'config check message format');
  
  console.log('✓ built-in checks tests passed');
  
  // Test health server
  console.log('Testing health server...');
  
  // Test server lifecycle
  const server = await healthServer.start({ port: 0 }); // Use random port
  
  assert(server, 'server should be returned');
  assert(server.port > 0, 'server port should be positive');
  
  const status = healthServer.getStatus();
  assert(status.running === true, 'status should show running');
  assert(status.port === server.port, 'status should show correct port');
  
  // Test that we can't start another server on the same port
  await assert.rejects(
    healthServer.start({ port: server.port }),
    /Health server is already running/
  );
  
  await healthServer.stop();
  
  const statusAfterStop = healthServer.getStatus();
  assert(statusAfterStop.running === false, 'status should show not running after stop');
  
  console.log('✓ health server tests passed');
  
  console.log('✅ All health tests passed!');
}

runTests().catch(err => { console.error(err); process.exit(1); });
