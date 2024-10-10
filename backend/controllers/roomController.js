const { createRoom, getRoom } = require('../models/roomModel');

// Create Room Handler
exports.createRoom = (req, res) => {
  const { roomId } = req.body;

  if (!roomId) {
    return res.status(400).json({ message: 'Room ID is required' });
  }

  // Create or retrieve the room
  const room = createRoom(roomId);
  res.status(200).json({ message: `Room ${roomId} created`, room });
};

// (Optional) Retrieve Room Handler
exports.getRoomInfo = (req, res) => {
  const { roomId } = req.params;

  const room = getRoom(roomId);

  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }

  res.status(200).json({ room });
};
