/**
 * Comprehensive metrics and monitoring system for Forever.
 * Provides Prometheus-style metrics collection with counters, gauges, histograms, and timers.
 */

// Internal storage for all metrics
const metrics = new Map();

// Default histogram buckets in seconds
const DEFAULT_BUCKETS = [0.1, 0.5, 1, 2, 5, 10];

/**
 * Base class for all metric types
 */
class BaseMetric {
  constructor(name, help = '', labels = []) {
    if (metrics.has(name)) {
      throw new Error(`Metric '${name}' already exists`);
    }
    
    this.name = name;
    this.help = help;
    this.labels = labels;
    this.values = new Map();
    
    metrics.set(name, this);
  }
  
  /**
   * Get key for labeled values
   */
  _getKey(labelValues = {}) {
    const key = this.labels.map(label => `${label}="${labelValues[label] || ''}"`).join(',');
    return key || '{}';
  }
  
  /**
   * Get metric value(s)
   */
  get(labelValues = {}) {
    const key = this._getKey(labelValues);
    return this.values.get(key) || this._getDefaultValue();
  }
  
  _getDefaultValue() {
    return 0;
  }
  
  /**
   * Export metric in Prometheus format
   */
  _export() {
    const lines = [];
    
    if (this.help) {
      lines.push(`# HELP ${this.name} ${this.help}`);
    }
    lines.push(`# TYPE ${this.name} ${this._getType()}`);
    
    for (const [key, value] of this.values) {
      const labelStr = key !== '{}' ? `{${key}}` : '';
      lines.push(`${this.name}${labelStr} ${value}`);
    }
    
    return lines.join('\n');
  }
  
  _getType() {
    throw new Error('Must implement _getType()');
  }
}

/**
 * Counter metric - only goes up
 */
class Counter extends BaseMetric {
  inc(labelValues = {}, value = 1) {
    const key = this._getKey(labelValues);
    const current = this.values.get(key) || 0;
    this.values.set(key, current + value);
  }
  
  _getType() {
    return 'counter';
  }
  
  _getDefaultValue() {
    return 0;
  }
}

/**
 * Gauge metric - can go up or down
 */
class Gauge extends BaseMetric {
  set(labelValues = {}, value) {
    const key = this._getKey(labelValues);
    this.values.set(key, value);
  }
  
  inc(labelValues = {}, value = 1) {
    const key = this._getKey(labelValues);
    const current = this.values.get(key) || 0;
    this.values.set(key, current + value);
  }
  
  dec(labelValues = {}, value = 1) {
    const key = this._getKey(labelValues);
    const current = this.values.get(key) || 0;
    this.values.set(key, current - value);
  }
  
  _getType() {
    return 'gauge';
  }
  
  _getDefaultValue() {
    return 0;
  }
}

/**
 * Histogram metric - tracks distribution of values
 */
class Histogram extends BaseMetric {
  constructor(name, help = '', labels = [], buckets = DEFAULT_BUCKETS) {
    super(name, help, labels);
    this.buckets = buckets.sort((a, b) => a - b);
    this.counts = new Map(); // Track counts per bucket
    this.sums = new Map(); // Track sum of values
  }
  
  observe(labelValues = {}, value) {
    const key = this._getKey(labelValues);
    
    // Update bucket counts
    if (!this.counts.has(key)) {
      this.counts.set(key, new Array(this.buckets.length + 1).fill(0));
    }
    
    if (!this.sums.has(key)) {
      this.sums.set(key, 0);
    }
    
    const bucketCounts = this.counts.get(key);
    const currentSum = this.sums.get(key);
    
    // Increment appropriate bucket
    let bucketIndex = this.buckets.findIndex(bucket => value <= bucket);
    if (bucketIndex === -1) {
      bucketIndex = this.buckets.length; // +Inf bucket
    }
    
    for (let i = bucketIndex; i < bucketCounts.length; i++) {
      bucketCounts[i]++;
    }
    
    this.sums.set(key, currentSum + value);
    
    // Store total count in values map for compatibility
    this.values.set(key, bucketCounts[0]);
  }
  
  get(labelValues = {}) {
    const key = this._getKey(labelValues);
    const bucketCounts = this.counts.get(key) || new Array(this.buckets.length + 1).fill(0);
    const sum = this.sums.get(key) || 0;
    
    return {
      buckets: this.buckets.map((bucket, index) => ({
        le: bucket,
        count: bucketCounts[index]
      })),
      count: bucketCounts[bucketCounts.length - 1],
      sum
    };
  }
  
  _getType() {
    return 'histogram';
  }
  
  _export() {
    const lines = [];
    
    if (this.help) {
      lines.push(`# HELP ${this.name} ${this.help}`);
    }
    lines.push(`# TYPE ${this.name} ${this._getType()}`);
    
    for (const [key] of this.values) {
      const bucketCounts = this.counts.get(key) || new Array(this.buckets.length + 1).fill(0);
      const sum = this.sums.get(key) || 0;
      const labelStr = key !== '{}' ? `{${key}}` : '';
      
      // Export bucket counts
      for (let i = 0; i < this.buckets.length; i++) {
        lines.push(`${this.name}_bucket${labelStr}{le="${this.buckets[i]}"} ${bucketCounts[i]}`);
      }
      
      // Export +Inf bucket (total count)
      lines.push(`${this.name}_bucket${labelStr}{le="+Inf"} ${bucketCounts[bucketCounts.length - 1]}`);
      
      // Export sum and count
      lines.push(`${this.name}_sum${labelStr} ${sum}`);
      lines.push(`${this.name}_count${labelStr} ${bucketCounts[bucketCounts.length - 1]}`);
    }
    
    return lines.join('\n');
  }
}

/**
 * Timer metric - convenience wrapper around histogram for timing
 */
class Timer {
  constructor(histogramMetric, labelValues = {}) {
    this.histogram = histogramMetric;
    this.labelValues = labelValues;
    this.start = process.hrtime.bigint();
  }
  
  stop() {
    const end = process.hrtime.bigint();
    const duration = Number(end - this.start) / 1000000000; // Convert to seconds
    this.histogram.observe(this.labelValues, duration);
    return duration;
  }
}

/**
 * Create a counter metric
 */
function counter(name, help = '', labels = []) {
  return new Counter(name, help, labels);
}

/**
 * Create a gauge metric
 */
function gauge(name, help = '', labels = []) {
  return new Gauge(name, help, labels);
}

/**
 * Create a histogram metric
 */
function histogram(name, help = '', labels = [], buckets = DEFAULT_BUCKETS) {
  return new Histogram(name, help, labels, buckets);
}

/**
 * Create a timer for timing operations
 */
function timer(name, labelValues = {}, buckets) {
  const hist = metrics.get(name) || histogram(name, '', [], buckets);
  return new Timer(hist, labelValues);
}

/**
 * Get all metrics in Prometheus text format
 */
function getSnapshot() {
  const lines = [];
  for (const metric of metrics.values()) {
    lines.push(metric._export());
  }
  return lines.join('\n\n') + '\n';
}

/**
 * Get all metrics as JSON
 */
function exportJSON() {
  const result = {};
  
  for (const [name, metric] of metrics) {
    const metricData = {
      name: metric.name,
      help: metric.help,
      labels: metric.labels,
      type: metric._getType(),
      values: {}
    };
    
    if (metric instanceof Histogram) {
      for (const [key] of metric.values) {
        metricData.values[key] = metric.get(key === '{}' ? {} : parseLabelKey(key, metric.labels));
      }
    } else {
      for (const [key, value] of metric.values) {
        metricData.values[key] = value;
      }
    }
    
    result[name] = metricData;
  }
  
  return result;
}

/**
 * Parse label key back to object
 */
function parseLabelKey(key) {
  if (key === '{}') {return {};}
  
  const result = {};
  const pairs = key.split(',');
  for (const pair of pairs) {
    const [label, value] = pair.split('=');
    result[label] = value.replace(/"/g, '');
  }
  return result;
}

/**
 * Reset all metrics to initial state
 */
function reset() {
  for (const metric of metrics.values()) {
    metric.values.clear();
    if (metric instanceof Histogram) {
      metric.counts.clear();
      metric.sums.clear();
    }
  }
}

/**
 * Initialize built-in metrics collection
 */
function initializeBuiltInMetrics() {
  // Memory heap usage gauge
  const heapUsedGauge = gauge('nodejs_memory_heap_used_bytes', 'Node.js heap size used in bytes');
  
  // Event loop lag histogram
  const eventLoopHistogram = histogram('nodejs_eventloop_lag_seconds', 'Node.js event loop lag in seconds');
  
  // Operations counter
  const operationsCounter = counter('forever_operations_total', 'Total number of operations performed', ['operation_type']);
  
  // Operation duration histogram
  const operationDurationHistogram = histogram('forever_operation_duration_seconds', 'Duration of operations in seconds', ['operation_type']);
  
  // Start collecting built-in metrics periodically
  setInterval(() => {
    // Update heap usage
    const memUsage = process.memoryUsage();
    heapUsedGauge.set({}, memUsage.heapUsed);
    
    // Measure event loop lag
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1000000000;
      eventLoopHistogram.observe({}, lag);
    });
  }, 5000); // Collect every 5 seconds
  
  return {
    heapUsedGauge,
    eventLoopHistogram,
    operationsCounter,
    operationDurationHistogram
  };
}

// Initialize built-in metrics
const builtIn = initializeBuiltInMetrics();

module.exports = {
  counter,
  gauge,
  histogram,
  timer,
  getSnapshot,
  exportJSON,
  reset,
  builtIn
};
