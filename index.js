const { greet } = require('./src/greet');
const { log } = require('./src/logger');

log('info', 'Forever is starting...');
console.log(greet());
log('info', 'Forever is running. The journey never ends.');
