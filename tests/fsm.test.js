const assert = require('assert');
const { createFSM } = require('../src/fsm');

const trafficLight = createFSM({
  initial: 'red',
  states: {
    red:    { on: { GO:   'green' } },
    green:  { on: { SLOW: 'amber' } },
    amber:  { on: { STOP: 'red'   } },
  },
});

// Initial state
assert.strictEqual(trafficLight.state, 'red');

// Valid transitions
trafficLight.send('GO');
assert.strictEqual(trafficLight.state, 'green');
trafficLight.send('SLOW');
assert.strictEqual(trafficLight.state, 'amber');
trafficLight.send('STOP');
assert.strictEqual(trafficLight.state, 'red');

// can() checks
assert.strictEqual(trafficLight.can('GO'), true);
assert.strictEqual(trafficLight.can('SLOW'), false);

// Invalid transition throws
let threw = false;
try { trafficLight.send('SLOW'); } catch (e) { threw = true; }
assert.strictEqual(threw, true, 'invalid transition should throw');

console.log('All FSM tests passed!');
