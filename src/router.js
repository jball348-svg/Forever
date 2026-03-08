/**
 * Minimal path router with :param support.
 */
const routes = [];
let _notFound = null;

function addRoute(path, handler) {
  const keys = [];
  const pattern = path.replace(/:([\w]+)/g, (_, key) => {
    keys.push(key);
    return '([^/]+)';
  });
  routes.push({ regex: new RegExp(`^${pattern}$`), keys, handler });
}

function navigate(path) {
  for (const route of routes) {
    const match = path.match(route.regex);
    if (match) {
      const params = {};
      route.keys.forEach((key, i) => { params[key] = match[i + 1]; });
      return route.handler(params);
    }
  }
  if (_notFound) return _notFound(path);
  return null;
}

function notFound(handler) {
  _notFound = handler;
}

module.exports = { addRoute, navigate, notFound };
