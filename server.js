// Minimal Node.js HTTP server built only from Node.js built-in modules: it serves
// GET /hello with "Hello world" and answers every other request with "Not Found".
// Run it with: node server.js

const http = require('http');

const DEFAULT_PORT = 3000;
const PORT_MIN = 1024;
const PORT_MAX = 65535;
const HELLO_PATH = '/hello';
const HELLO_BODY = 'Hello world';
const NOT_FOUND_BODY = 'Not Found';
const CONTENT_TYPE_TEXT = 'text/plain';

// Turns the raw PORT value into a usable port number, or reports the problem on
// stderr and exits with status 1. Returns a number between 1024 and 65535.
function resolvePort(rawValue) {
  if (rawValue === undefined) {
    return DEFAULT_PORT;
  }

  if (!/^\d+$/.test(rawValue)) {
    console.error(
      'Configuration error: PORT="' + rawValue + '" is not a valid port number. Use an integer between 1024 and 65535.'
    );
    process.exit(1);
  }

  const port = Number(rawValue);

  // The range starts at 1024 because ports below it are privileged: rejecting them
  // here keeps the server from ever seizing a port reserved for system services.
  if (port < PORT_MIN || port > PORT_MAX) {
    console.error(
      'Configuration error: PORT=' + rawValue + ' is out of range. Use an integer between 1024 and 65535.'
    );
    process.exit(1);
  }

  return port;
}

const port = resolvePort(process.env.PORT);

// Writes one stdout line per request in the fixed
// [ISO-8601 timestamp] [HTTP method] [request path] format.
function logRequest(req) {
  console.log('[' + new Date().toISOString() + '] [' + req.method + '] [' + req.url + ']');
}

// Writes a plain-text response: sets the Content-Type header and ends the stream.
function sendPlainTextResponse(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': CONTENT_TYPE_TEXT });
  res.end(body);
}

// Handles one HTTP request: logs it, isolates the pathname from the request
// target, and answers with either the hello endpoint or the catch-all response.
function handleRequest(req, res) {
  // Logged before the routing decision so that unmatched requests are logged too.
  logRequest(req);

  let pathname;

  try {
    pathname = new URL(req.url, 'http://localhost').pathname;
  } catch {
    sendPlainTextResponse(res, 404, NOT_FOUND_BODY);
    return;
  }

  if (req.method === 'GET' && pathname === HELLO_PATH) {
    sendPlainTextResponse(res, 200, HELLO_BODY);
    return;
  }

  sendPlainTextResponse(res, 404, NOT_FOUND_BODY);
}

const server = http.createServer(handleRequest);

// Reports a binding failure on stderr and exits with status 1. Nothing about the
// failure is written to any HTTP response.
function handleServerError(error) {
  if (error.code === 'EADDRINUSE') {
    console.error(
      'Error: port ' + port + ' is already in use. Stop the process using it or start with a different port, e.g. PORT=3001 node server.js.'
    );
  } else {
    console.error('Error: failed to start the server: ' + error.message);
  }

  process.exit(1);
}

server.on('error', handleServerError);

server.listen(port, function onServerListening() {
  console.log('Server listening on port ' + port);
});

// Logs the shutdown, stops accepting connections, and exits with status 0.
function shutdown(signal) {
  console.log('Received SIGINT. Shutting down gracefully...');

  server.close(function onServerClosed() {
    console.log('Server closed. Exiting.');
    process.exit(0);
  });

  // closeIdleConnections() exists only from Node.js 18.2.0, so it is feature-detected
  // to keep the declared >=18.0.0 floor working. It also releases an idle keep-alive
  // socket immediately instead of holding server.close() for the default 5s timeout.
  if (typeof server.closeIdleConnections === 'function') {
    server.closeIdleConnections();
  }
}

process.on('SIGINT', shutdown);
