const app = require('./App');
const http = require('http');
const { handleSignalingMessage } = require('./services/signalingservice'); // Correct import

// Create HTTP server
const server = http.createServer(app);

// WebSocket setup
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

// Ping-pong mechanism to keep WebSocket connections alive
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');

  // Mark the socket as alive and reset it on pong
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true; // Reset isAlive to true when a pong is received
  });

  // Set an interval to ping clients every 30 seconds
  const interval = setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.isAlive === false) {
        console.log('Terminating inactive client');
        return client.terminate();  // Terminate if no pong received
      }
      client.isAlive = false;
      client.ping();  // Send ping to client
    });
  }, 30000); // Ping every 30 seconds

  // Handle WebSocket messages
  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      handleSignalingMessage(ws, parsedMessage); // Pass the message to signaling service
    } catch (error) {
      console.error('Error parsing message:', error.message);
    }
  });

  // Error handling for WebSocket connection
  ws.on('error', (err) => {
    console.error('WebSocket encountered an error:', err.message);
  });

  // Log connection closure
  ws.on('close', (code, reason) => {
    console.log(`WebSocket closed. Code: ${code}, Reason: ${reason}`);
    clearInterval(interval); // Clear the interval when connection is closed
  });
});

// Graceful shutdown of WebSocket connections on server termination
process.on('SIGINT', () => {
  console.log('Shutting down server...');

  // Terminate all active WebSocket clients
  wss.clients.forEach((client) => client.terminate());

  // Close the HTTP server
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Server listen
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
