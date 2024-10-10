const signalingService = require('../services/signalingService');

const connection = (ws, req) => {
  console.log('New WebSocket connection established');

  ws.on('message', (message) => {
    // Trim the message to remove extra spaces or newlines
    const trimmedMessage = message.trim();
    console.log('Received raw message:', message); // Log the raw message

    // Check if the message is empty after trimming
    if (!trimmedMessage) {
      console.error('Received an empty message or newline');
      return;
    }

    try {
      const parsedMessage = JSON.parse(trimmedMessage);

      if (parsedMessage && parsedMessage.type) {
        signalingService.handleSignalingMessage(ws, parsedMessage);
      } else {
        console.error('Invalid message format:', parsedMessage);
      }
    } catch (error) {
      console.error('Error parsing JSON message:', error.message);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
};

module.exports = { connection };

