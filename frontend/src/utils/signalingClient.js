let socket;

export const connectToSignalingServer = (roomId, peerId) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    socket = new WebSocket('ws://localhost:5000'); // Make sure this is your correct signaling server

    socket.onopen = () => {
      console.log("Connected to the signaling server");
      const joinMessage = {
        type: 'join-room',
        roomId: roomId,
        peerId: peerId // Send the unique peerId to identify the client
      };
      socket.send(JSON.stringify(joinMessage));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received message:", data);
    };

    socket.onerror = (error) => {
      console.error("WebSocket encountered an error:", error.message);
    };

    socket.onclose = (event) => {
      console.error(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
      if (event.code !== 1000) { // Reconnect only if it's not a normal closure
        setTimeout(() => connectToSignalingServer(roomId, peerId), 3000); // Retry connection after 3 seconds
      }
    };
  }

  return socket;
};

export const sendSignalingData = (message) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else {
    console.error("WebSocket is not open to send data");
  }
};
