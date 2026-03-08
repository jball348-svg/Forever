const { greet } = require('./src/greet');
const { log } = require('./src/logger');
const config = require('./src/config');

log('info', `Starting ${config.name} v${config.version}`);
log('info', `Process started at ${config.startedAt}`);
console.log(greet());
log('info', 'Forever is running. The journey never ends.');
