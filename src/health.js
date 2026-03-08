/**
 * Health-check and diagnostics system for Forever.
 * Provides comprehensive monitoring of system health with registered checks.
 */

const v8 = require('v8');
const config = require('./config');

// Registered health checks
const checks = new Map();

/**
 * Register a named health check function.
 * @param {string} name - The name of the health check
 * @param {Function} fn - Async function that returns { ok: boolean, message: string }
 */
function register(name, fn) {
  if (typeof name !== 'string') throw new TypeError('Health check name must be a string');
  if (typeof fn !== 'function') throw new TypeError('Health check function must be a function');
  checks.set(name, fn);
}

/**
 * Run all registered health checks.
 * @returns {Promise<Object>} Result with status, checks array, and overall summary
 */
async function check() {
  const results = [];
  const startTime = Date.now();
  
  for (const [name, checkFn] of checks) {
    const checkStart = Date.now();
    try {
      const result = await Promise.race([
        checkFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), 5000)
        )
      ]);
      const duration = Date.now() - checkStart;
      
      results.push({
        name,
        status: result.ok ? 'ok' : 'failing',
        message: result.message || (result.ok ? 'Check passed' : 'Check failed'),
        durationMs: duration
      });
    } catch (error) {
      const duration = Date.now() - checkStart;
      results.push({
        name,
        status: 'failing',
        message: error.message || 'Health check threw an error',
        durationMs: duration
      });
    }
  }
  
  const totalDuration = Date.now() - startTime;
  const failingCount = results.filter(r => r.status === 'failing').length;
  const totalCount = results.length;
  
  let status;
  if (failingCount === 0) status = 'ok';
  else if (failingCount < totalCount) status = 'degraded';
  else status = 'failing';
  
  return {
    status,
    checks: results,
    summary: `${totalCount - failingCount}/${totalCount} checks passing`,
    totalDurationMs: totalDuration,
    timestamp: new Date().toISOString()
  };
}

/**
 * Get a one-line human-readable summary.
 * @returns {Promise<string>} Summary string
 */
async function summary() {
  const result = await check();
  return result.summary;
}

/**
 * Get full diagnostic report as JSON.
 * @returns {Promise<Object>} Complete diagnostic report
 */
async function toJSON() {
  const healthResult = await check();
  const memUsage = process.memoryUsage();
  const heapStats = v8.getHeapStatistics();
  
  return {
    ...healthResult,
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      uptime: process.uptime(),
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers
      },
      heap: {
        totalHeapSize: heapStats.total_heap_size,
        usedHeapSize: heapStats.used_heap_size,
        heapSizeLimit: heapStats.heap_size_limit,
        totalAvailableSize: heapStats.total_available_size,
        totalHeapSizeExecutable: heapStats.total_heap_size_executable,
        totalPhysicalSize: heapStats.total_physical_size
      }
    }
  };
}

// Built-in health checks

/**
 * Memory usage check - fails if heap usage is above 90%
 */
async function memoryCheck() {
  const memUsage = process.memoryUsage();
  const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  return {
    ok: heapUsagePercent < 90,
    message: `Heap usage: ${heapUsagePercent.toFixed(1)}% (${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB / ${(memUsage.heapTotal / 1024 / 1024).toFixed(1)}MB)`
  };
}

/**
 * Event loop lag check - fails if lag is > 100ms
 */
async function eventLoopCheck() {
  const start = process.hrtime.bigint();
  await new Promise(resolve => setImmediate(resolve));
  const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
  
  return {
    ok: lag < 100,
    message: `Event loop lag: ${lag.toFixed(2)}ms`
  };
}

/**
 * Config validation check - ensures required config keys are present
 */
async function configCheck() {
  try {
    // Check if config module has required structure
    const requiredKeys = ['get', 'set', 'validate']; // Basic config methods
    const missingKeys = requiredKeys.filter(key => typeof config[key] !== 'function');
    
    return {
      ok: missingKeys.length === 0,
      message: missingKeys.length === 0 
        ? 'Config module is properly loaded'
        : `Missing config methods: ${missingKeys.join(', ')}`
    };
  } catch (error) {
    return {
      ok: false,
      message: `Config check failed: ${error.message}`
    };
  }
}

// Register built-in checks
register('memory', memoryCheck);
register('eventLoop', eventLoopCheck);
register('config', configCheck);

module.exports = {
  register,
  check,
  summary,
  toJSON
};
