const peers = {}; // In-memory storage of peers (e.g., roomId -> {peerId -> ws})

const handleSignalingMessage = (ws, message) => {
  const { type, roomId, peerId, payload } = message;

  switch (type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;
    case 'join-room':
      handleJoinRoom(ws, roomId, peerId);
      break;
    case 'offer':
      handleOffer(ws, roomId, peerId, payload);
      break;
    case 'answer':
      handleAnswer(ws, roomId, peerId, payload);
      break;
    case 'ice-candidate':
      handleIceCandidate(ws, roomId, peerId, payload);
      break;
    default:
      console.error('Unknown message type:', type);
  }
};

// Handle a peer joining a room
const handleJoinRoom = (ws, roomId, peerId) => {
  if (!peers[roomId]) {
    peers[roomId] = {};
  }

  // If the peerId already exists in the room, close the duplicate connection
  if (peers[roomId][peerId]) {
    console.log(`Peer ${peerId} is already in room ${roomId}. Closing duplicate connection.`);
    ws.close(); // Close the duplicate connection
    return;
  }

  peers[roomId][peerId] = ws; // Store the WebSocket for the peer
  console.log(`Peer ${peerId} joined room ${roomId}`);

  // Notify all other peers in the room that a new peer has joined
  Object.values(peers[roomId]).forEach(peer => {
    if (peer !== ws) {
      peer.send(JSON.stringify({ type: 'new-peer', roomId, peerId }));
    }
  });

  // Handle WebSocket disconnection and remove the peer
  ws.on('close', (code, reason) => {
    console.log(`Peer ${peerId} disconnected from room ${roomId}. Code: ${code}, Reason: ${reason}`);
    delete peers[roomId][peerId];

    // Clean up room if no peers are left
    if (Object.keys(peers[roomId]).length === 0) {
      delete peers[roomId];
      console.log(`Room ${roomId} has been removed`);
    }
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error in room ${roomId}: ${error.message}`);
  });
};

// Handle WebRTC offer
const handleOffer = (ws, roomId, peerId, offer) => {
  if (!peers[roomId] || Object.keys(peers[roomId]).length <= 1) {
    console.error(`No other peers in room ${roomId} to send the offer`);
    return;
  }

  console.log(`Received offer for room ${roomId}`);

  Object.values(peers[roomId]).forEach(peer => {
    if (peer !== ws) {
      try {
        peer.send(JSON.stringify({ type: 'offer', roomId, peerId, payload: offer }));
      } catch (error) {
        console.error('Error sending offer:', error);
      }
    }
  });
};

// Handle WebRTC answer
const handleAnswer = (ws, roomId, peerId, answer) => {
  if (!peers[roomId] || Object.keys(peers[roomId]).length <= 1) {
    console.error(`No other peers in room ${roomId} to send the answer`);
    return;
  }

  console.log(`Received answer for room ${roomId}`);

  Object.values(peers[roomId]).forEach(peer => {
    if (peer !== ws) {
      try {
        peer.send(JSON.stringify({ type: 'answer', roomId, peerId, payload: answer }));
      } catch (error) {
        console.error('Error sending answer:', error);
      }
    }
  });
};

// Handle ICE candidates
const handleIceCandidate = (ws, roomId, peerId, candidate) => {
  if (!peers[roomId] || Object.keys(peers[roomId]).length <= 1) {
    console.error(`No other peers in room ${roomId} to send the ICE candidate`);
    return;
  }

  console.log(`Received ICE candidate for room ${roomId}`);

  Object.values(peers[roomId]).forEach(peer => {
    if (peer !== ws) {
      try {
        peer.send(JSON.stringify({ type: 'ice-candidate', roomId, peerId, payload: candidate }));
      } catch (error) {
        console.error('Error sending ICE candidate:', error);
      }
    }
  });
};

module.exports = { handleSignalingMessage };
