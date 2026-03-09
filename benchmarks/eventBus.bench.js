/**
 * benchmarks/eventBus.bench.js
 * Benchmark suite for src/eventBus.js
 */

const { benchmark }  = require('../src/performance');
const { createEventBus } = require('../src/eventBus');

const NAME = 'EventBus';

async function run() {
  const results = [];

  // Publish with a single listener
  results.push(await benchmark('eventBus.emit (1 listener)', () => {
    const bus = createEventBus();
    bus.on('evt', () => {});
    for (let i = 0; i < 1000; i++) {bus.emit('evt', i);}
  }, { iterations: 100 }));

  // Publish with many listeners
  results.push(await benchmark('eventBus.emit (50 listeners)', () => {
    const bus = createEventBus();
    for (let i = 0; i < 50; i++) {bus.on('evt', () => {});}
    for (let i = 0; i < 1000; i++) {bus.emit('evt', i);}
  }, { iterations: 100 }));

  // Subscribe / unsubscribe churn
  results.push(await benchmark('eventBus.on/off churn', () => {
    const bus = createEventBus();
    for (let i = 0; i < 500; i++) {
      const off = bus.on('evt', () => {});
      if (typeof off === 'function') {off();}
    }
  }, { iterations: 200 }));

  return results;
}

module.exports = { name: NAME, run };
