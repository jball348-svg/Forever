/**
 * Tests for metrics and monitoring system
 */

const assert = require('assert');
const { counter, gauge, histogram, timer, getSnapshot, exportJSON, reset, builtIn } = require('../src/metrics');

async function runTests() {
  // Reset metrics before each test
  reset();
  
  // Test counter()
  console.log('Testing counter()...');
  
  const testCounter = counter('test_counter', 'A test counter', ['method', 'status']);
  
  // Test incrementing
  testCounter.inc({ method: 'GET', status: '200' });
  testCounter.inc({ method: 'GET', status: '200' }, 5);
  testCounter.inc({ method: 'POST', status: '404' });
  
  assert.strictEqual(testCounter.get({ method: 'GET', status: '200' }), 6, 'counter should accumulate values');
  assert.strictEqual(testCounter.get({ method: 'POST', status: '404' }), 1, 'counter should work with different labels');
  assert.strictEqual(testCounter.get({ method: 'GET', status: '500' }), 0, 'counter should return 0 for non-existent labels');
  
  // Test duplicate metric names
  assert.throws(() => counter('test_counter'), /Metric 'test_counter' already exists/, 'should throw for duplicate metric names');
  
  console.log('✓ counter() tests passed');
  
  // Test gauge()
  console.log('Testing gauge()...');
  
  const testGauge = gauge('test_gauge', 'A test gauge', ['instance']);
  
  // Test setting values
  testGauge.set({ instance: 'server1' }, 42);
  testGauge.set({ instance: 'server2' }, 84);
  
  assert.strictEqual(testGauge.get({ instance: 'server1' }), 42, 'gauge should return set value');
  assert.strictEqual(testGauge.get({ instance: 'server2' }), 84, 'gauge should handle multiple instances');
  assert.strictEqual(testGauge.get({ instance: 'server3' }), 0, 'gauge should return 0 for non-existent labels');
  
  // Test increment/decrement
  testGauge.inc({ instance: 'server1' }, 8);
  assert.strictEqual(testGauge.get({ instance: 'server1' }), 50, 'gauge should increment correctly');
  
  testGauge.dec({ instance: 'server2' }, 4);
  assert.strictEqual(testGauge.get({ instance: 'server2' }), 80, 'gauge should decrement correctly');
  
  console.log('✓ gauge() tests passed');
  
  // Test histogram()
  console.log('Testing histogram()...');
  
  const testHistogram = histogram('test_histogram', 'A test histogram', ['endpoint'], [0.1, 0.5, 1, 2]);
  
  // Test observing values
  testHistogram.observe({ endpoint: '/api' }, 0.05); // Should go in 0.1 bucket
  testHistogram.observe({ endpoint: '/api' }, 0.3);  // Should go in 0.5 bucket
  testHistogram.observe({ endpoint: '/api' }, 0.8);  // Should go in 1.0 bucket
  testHistogram.observe({ endpoint: '/api' }, 1.5); // Should go in 2.0 bucket
  testHistogram.observe({ endpoint: '/api' }, 3.0); // Should go in +Inf bucket
  
  const result = testHistogram.get({ endpoint: '/api' });
  
  assert.strictEqual(result.count, 5, 'histogram should count all observations');
  assert.strictEqual(result.sum, 5.65, 'histogram should sum all values');
  
  // Check bucket counts
  assert.strictEqual(result.buckets[0].count, 1, '0.1 bucket should have 1 observation');
  assert.strictEqual(result.buckets[1].count, 2, '0.5 bucket should have 2 observations');
  assert.strictEqual(result.buckets[2].count, 3, '1.0 bucket should have 3 observations');
  assert.strictEqual(result.buckets[3].count, 4, '2.0 bucket should have 4 observations');
  
  console.log('✓ histogram() tests passed');
  
  // Test timer()
  console.log('Testing timer()...');
  
  // Create a histogram first, then use timer with it
  const timerHistogram = histogram('test_timer_histogram', 'Timer test histogram', [0.1, 0.5, 1]);
  const testTimer = timer('test_timer_histogram', {}, [0.1, 0.5, 1]);
  
  // Simulate some work
  await new Promise(resolve => setTimeout(resolve, 10));
  const duration = testTimer.stop();
  
  assert(typeof duration === 'number', 'timer should return number');
  assert(duration > 0, 'timer should measure positive duration');
  
  // Check that the histogram was updated
  const timerResult = timerHistogram.get({});
  assert.strictEqual(timerResult.count, 1, 'timer should update histogram count');
  
  console.log('✓ timer() tests passed');
  
  // Test getSnapshot()
  console.log('Testing getSnapshot()...');
  
  const snapshot = getSnapshot();
  
  assert(typeof snapshot === 'string', 'snapshot should be string');
  assert(snapshot.includes('# TYPE'), 'snapshot should include type information');
  assert(snapshot.includes('test_counter'), 'snapshot should include counter metric');
  assert(snapshot.includes('test_gauge'), 'snapshot should include gauge metric');
  assert(snapshot.includes('test_histogram'), 'snapshot should include histogram metric');
  assert(snapshot.includes('test_histogram_bucket'), 'snapshot should include histogram buckets');
  assert(snapshot.includes('test_histogram_sum'), 'snapshot should include histogram sum');
  assert(snapshot.includes('test_histogram_count'), 'snapshot should include histogram count');
  
  console.log('✓ getSnapshot() tests passed');
  
  // Test exportJSON()
  console.log('Testing exportJSON()...');
  
  const jsonExport = exportJSON();
  
  assert(typeof jsonExport === 'object', 'JSON export should be object');
  assert(jsonExport.test_counter, 'JSON export should include counter');
  assert(jsonExport.test_gauge, 'JSON export should include gauge');
  assert(jsonExport.test_histogram, 'JSON export should include histogram');
  
  // Check counter structure
  const counterData = jsonExport.test_counter;
  assert.strictEqual(counterData.name, 'test_counter', 'counter should have correct name');
  assert.strictEqual(counterData.type, 'counter', 'counter should have correct type');
  assert(Array.isArray(counterData.labels), 'counter should have labels array');
  assert(typeof counterData.values === 'object', 'counter should have values object');
  
  // Check histogram structure
  const histogramData = jsonExport.test_histogram;
  assert.strictEqual(histogramData.type, 'histogram', 'histogram should have correct type');
  const histogramValues = histogramData.values['{endpoint="/api"}'];
  if (histogramValues) {
    assert(histogramValues.buckets, 'histogram should have buckets');
    assert(typeof histogramValues.count === 'number', 'histogram should have count');
    assert(typeof histogramValues.sum === 'number', 'histogram should have sum');
  }
  
  console.log('✓ exportJSON() tests passed');
  
  // Test reset()
  console.log('Testing reset()...');
  
  // Verify metrics have values
  assert(testCounter.get({ method: 'GET', status: '200' }) > 0, 'counter should have values before reset');
  assert(testGauge.get({ instance: 'server1' }) > 0, 'gauge should have values before reset');
  assert(testHistogram.get({ endpoint: '/api' }).count > 0, 'histogram should have values before reset');
  
  // Reset all metrics
  reset();
  
  // Verify all metrics are reset
  assert.strictEqual(testCounter.get({ method: 'GET', status: '200' }), 0, 'counter should be reset to 0');
  assert.strictEqual(testGauge.get({ instance: 'server1' }), 0, 'gauge should be reset to 0');
  assert.strictEqual(testHistogram.get({ endpoint: '/api' }).count, 0, 'histogram should be reset');
  
  console.log('✓ reset() tests passed');
  
  // Test built-in metrics
  console.log('Testing built-in metrics...');
  
  // Wait a moment for built-in metrics to collect
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Check that built-in metrics exist
  const builtInSnapshot = getSnapshot();
  assert(builtInSnapshot.includes('nodejs_memory_heap_used_bytes'), 'should have heap usage metric');
  assert(builtInSnapshot.includes('nodejs_eventloop_lag_seconds'), 'should have event loop lag metric');
  assert(builtInSnapshot.includes('forever_operations_total'), 'should have operations counter');
  assert(builtInSnapshot.includes('forever_operation_duration_seconds'), 'should have operation duration histogram');
  
  // Test built-in metric functions
  builtIn.operationsCounter.inc({ operation_type: 'cache_get' });
  assert(builtIn.operationsCounter.get({ operation_type: 'cache_get' }) > 0, 'operations counter should work');
  
  builtIn.operationDurationHistogram.observe({ operation_type: 'cache_get' }, 0.1);
  const durationResult = builtIn.operationDurationHistogram.get({ operation_type: 'cache_get' });
  assert.strictEqual(durationResult.count, 1, 'operation duration histogram should work');
  
  console.log('✓ built-in metrics tests passed');
  
  // Test Prometheus format compliance
  console.log('Testing Prometheus format compliance...');
  
  // Create fresh metrics for format testing
  reset();
  const formatCounter = counter('format_test_counter', 'Test counter for format', ['status']);
  const formatGauge = gauge('format_test_gauge', 'Test gauge for format');
  const formatHistogram = histogram('format_test_histogram', 'Test histogram for format', [], [0.5, 1.0]);
  
  // Add some values
  formatCounter.inc({ status: '200' }, 5);
  formatGauge.set({}, 42);
  formatHistogram.observe({}, 0.3);
  formatHistogram.observe({}, 1.2);
  
  const formatSnapshot = getSnapshot();
  
  // Check HELP comments
  assert(formatSnapshot.includes('# HELP format_test_counter Test counter for format'), 'should include HELP for counter');
  assert(formatSnapshot.includes('# HELP format_test_gauge Test gauge for format'), 'should include HELP for gauge');
  assert(formatSnapshot.includes('# HELP format_test_histogram Test histogram for format'), 'should include HELP for histogram');
  
  // Check TYPE comments
  assert(formatSnapshot.includes('# TYPE format_test_counter counter'), 'should include TYPE for counter');
  assert(formatSnapshot.includes('# TYPE format_test_gauge gauge'), 'should include TYPE for gauge');
  assert(formatSnapshot.includes('# TYPE format_test_histogram histogram'), 'should include TYPE for histogram');
  
  // Check metric values
  assert(formatSnapshot.includes('format_test_counter{status="200"} 5'), 'should include counter value with labels');
  assert(formatSnapshot.includes('format_test_gauge 42'), 'should include gauge value');
  assert(formatSnapshot.includes('format_test_histogram_bucket{le="0.5"} 1'), 'should include histogram bucket');
  assert(formatSnapshot.includes('format_test_histogram_bucket{le="+Inf"} 2'), 'should include histogram +Inf bucket');
  assert(formatSnapshot.includes('format_test_histogram_sum 1.5'), 'should include histogram sum');
  assert(formatSnapshot.includes('format_test_histogram_count 2'), 'should include histogram count');
  
  console.log('✓ Prometheus format compliance tests passed');
  
  console.log('✅ All metrics tests passed!');
}

runTests().catch(err => { console.error(err); process.exit(1); });
