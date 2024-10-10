const app = require('./app');
const http = require('http');
const socketHandlers = require('./sockets/socketHandlers');

// Create HTTP server
const server = http.createServer(app);

// WebSocket setup
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

wss.on('connection', socketHandlers.connection);

// Server listen
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
