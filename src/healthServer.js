/**
 * HTTP health check server for Forever.
 * Provides lightweight HTTP endpoint for health monitoring.
 */

const http = require('http');
const { toJSON } = require('./health');

/**
 * Health server configuration
 */
let serverInstance = null;
let serverConfig = {
  port: 9090,
  host: '0.0.0.0',
  timeout: 5000
};

/**
 * Configure health server settings.
 * @param {Object} config - Server configuration
 * @param {number} config.port - Port to listen on (default: 9090)
 * @param {string} config.host - Host to bind to (default: '0.0.0.0')
 * @param {number} config.timeout - Request timeout in ms (default: 5000)
 */
function configure(config = {}) {
  serverConfig = { ...serverConfig, ...config };
}

/**
 * Create HTTP request handler for health checks.
 * @returns {Function} Request handler function
 */
function createHandler() {
  return async (req, res) => {
    // Set timeout
    req.setTimeout(serverConfig.timeout, () => {
      if (!res.headersSent) {
        res.writeHead(408, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Request timeout',
          timestamp: new Date().toISOString()
        }));
      }
    });

    // Only handle GET requests to /health
    if (req.method !== 'GET' || req.url !== '/health') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Not found',
        message: 'Only GET /health is supported',
        timestamp: new Date().toISOString()
      }));
      return;
    }

    try {
      const healthReport = await toJSON();
      
      // Set appropriate status code based on health status
      let statusCode;
      switch (healthReport.status) {
        case 'ok':
          statusCode = 200;
          break;
        case 'degraded':
          statusCode = 207; // Multi-Status
          break;
        case 'failing':
          statusCode = 503; // Service Unavailable
          break;
        default:
          statusCode = 500;
      }

      // Set CORS headers for cross-origin requests
      res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });

      res.end(JSON.stringify(healthReport, null, 2));
    } catch (error) {
      console.error('Health check error:', error);
      
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Internal server error',
          message: error.message,
          timestamp: new Date().toISOString()
        }));
      }
    }
  };
}

/**
 * Start the health check server.
 * @param {Object} options - Server options
 * @returns {Promise<Object>} Server instance with stop method
 */
function start(options = {}) {
  return new Promise((resolve, reject) => {
    if (serverInstance && serverInstance.server.listening) {
      reject(new Error('Health server is already running'));
      return;
    }

    // Merge options with existing config
    const config = { ...serverConfig, ...options };
    
    const server = http.createServer(createHandler());
    
    server.on('error', (error) => {
      console.error('Health server error:', error);
      if (error.code === 'EADDRINUSE') {
        reject(new Error(`Port ${config.port} is already in use`));
      } else {
        reject(error);
      }
    });

    server.on('listening', () => {
      const address = server.address();
      console.log(`Health server listening on ${address.address}:${address.port}`);
      
      serverInstance = {
        server,
        address,
        port: address.port,
        host: address.address,
        stop: () => stop()
      };
      
      resolve(serverInstance);
    });

    server.listen(config.port, config.host);
  });
}

/**
 * Stop the health check server.
 * @returns {Promise<void>}
 */
function stop() {
  return new Promise((resolve) => {
    if (!serverInstance || !serverInstance.server.listening) {
      resolve();
      return;
    }

    serverInstance.server.close(() => {
      console.log('Health server stopped');
      serverInstance = null;
      resolve();
    });
  });
}

/**
 * Get current server status.
 * @returns {Object|null} Server status or null if not running
 */
function getStatus() {
  if (!serverInstance) {
    return { running: false };
  }

  return {
    running: serverInstance.server.listening,
    port: serverInstance.port,
    host: serverInstance.host,
    address: serverInstance.address
  };
}

module.exports = {
  configure,
  start,
  stop,
  getStatus,
  createHandler
};
