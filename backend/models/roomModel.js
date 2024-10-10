class Room {
  constructor(roomId) {
    this.roomId = roomId;
    this.clients = []; // Store WebSocket connections here
  }

  // Add a client to the room
  addClient(client) {
    this.clients.push(client);
  }

  // Remove a client from the room
  removeClient(client) {
    this.clients = this.clients.filter(c => c !== client);
  }

  // Broadcast a message to all clients except the sender
  broadcastMessage(sender, message) {
    this.clients.forEach(client => {
      if (client !== sender) {
        client.send(JSON.stringify(message));
      }
    });
  }
}

// In-memory room store
const rooms = {};

const createRoom = (roomId) => {
  if (!rooms[roomId]) {
    rooms[roomId] = new Room(roomId);
  }
  return rooms[roomId];
};

const getRoom = (roomId) => rooms[roomId];

const removeRoom = (roomId) => {
  delete rooms[roomId];
};

module.exports = { createRoom, getRoom, removeRoom };
