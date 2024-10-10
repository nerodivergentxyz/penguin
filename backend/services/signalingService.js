const peers = {}; // In-memory storage of peers (e.g., roomId -> [peer1, peer2])

const handleSignalingMessage = (ws, message) => {
  const { type, roomId, payload } = message;

  switch (type) {
    case 'join-room':
      handleJoinRoom(ws, roomId);
      break;
    case 'offer':
      handleOffer(ws, roomId, payload);
      break;
    case 'answer':
      handleAnswer(ws, roomId, payload);
      break;
    case 'ice-candidate':
      handleIceCandidate(ws, roomId, payload);
      break;
    default:
      console.error('Unknown message type:', type);
  }
};

// Handle a peer joining a room
const handleJoinRoom = (ws, roomId) => {
  if (!peers[roomId]) {
    peers[roomId] = [];
  }

  peers[roomId].push(ws);

  console.log(`Peer joined room ${roomId}`);

  // Notify the existing peers that a new peer has joined
  peers[roomId].forEach(peer => {
    if (peer !== ws) {
      peer.send(JSON.stringify({ type: 'new-peer', roomId }));
    }
  });
};

// Handle WebRTC offer
const handleOffer = (ws, roomId, offer) => {
  console.log(`Received offer for room ${roomId}`);

  peers[roomId].forEach(peer => {
    if (peer !== ws) {
      peer.send(JSON.stringify({ type: 'offer', roomId, payload: offer }));
    }
  });
};

// Handle WebRTC answer
const handleAnswer = (ws, roomId, answer) => {
  console.log(`Received answer for room ${roomId}`);

  peers[roomId].forEach(peer => {
    if (peer !== ws) {
      peer.send(JSON.stringify({ type: 'answer', roomId, payload: answer }));
    }
  });
};

// Handle ICE candidates
const handleIceCandidate = (ws, roomId, candidate) => {
  console.log(`Received ICE candidate for room ${roomId}`);

  peers[roomId].forEach(peer => {
    if (peer !== ws) {
      peer.send(JSON.stringify({ type: 'ice-candidate', roomId, payload: candidate }));
    }
  });
};

module.exports = { handleSignalingMessage };
