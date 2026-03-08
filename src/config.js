const pkg = require('../package.json');

const config = {
  name: pkg.name,
  version: pkg.version,
  description: pkg.description,
  startedAt: new Date().toISOString(),
};

module.exports = config;
