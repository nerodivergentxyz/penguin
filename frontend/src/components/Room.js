import React, { useState, useEffect, useRef } from 'react';
import { connectToSignalingServer, sendSignalingData } from '../utils/signalingClient';

const Room = () => {
  const [roomId] = useState('test-room');
  const [peerId] = useState(() => `peer_${Math.random().toString(36).substr(2, 9)}`); // Unique peerId
  const [dataChannel, setDataChannel] = useState(null);
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [message, setMessage] = useState('');
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket signaling server if not already open
    if (!socketRef.current) {
      const socket = connectToSignalingServer(roomId, peerId); // Send peerId to server
      socketRef.current = socket;

      socket.onmessage = async (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'offer') {
          // Handle incoming offer
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.payload));
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          sendSignalingData({ type: 'answer', roomId, peerId, payload: peerConnectionRef.current.localDescription });
        }

        if (message.type === 'answer') {
          // Handle incoming answer
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.payload));
        }

        if (message.type === 'ice-candidate') {
          // Add ICE candidate
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(message.payload));
        }
      };
    }

    if (!peerConnectionRef.current) {
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      // Create a data channel only on the offerer's side (i.e., when initiating the connection)
      if (pc.signalingState === 'have-local-offer') {
        const dc = pc.createDataChannel("messagingChannel");
        setDataChannel(dc);

        // Handle incoming messages over the data channel
        dc.onmessage = (event) => {
          const messageData = JSON.parse(event.data);
          setReceivedMessages(prev => [...prev, messageData.content]);
        };

        dc.onopen = () => {
          console.log('Data channel is open');
        };

        dc.onclose = () => {
          console.log('Data channel closed');
        };
      }

      // Handle the incoming data channels for the answerer's side
      pc.ondatachannel = (event) => {
        const receivedChannel = event.channel;
        setDataChannel(receivedChannel);

        receivedChannel.onmessage = (event) => {
          const messageData = JSON.parse(event.data);
          setReceivedMessages(prev => [...prev, messageData.content]);
        };

        receivedChannel.onopen = () => {
          console.log('Data channel is open (on receiver)');
        };

        receivedChannel.onclose = () => {
          console.log('Data channel closed (on receiver)');
        };
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignalingData({ type: 'ice-candidate', roomId, peerId, payload: event.candidate });
        }
      };
    }

    // Ping-Pong Heartbeat to keep WebSocket connection alive
    const heartbeat = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds

    return () => {
      clearInterval(heartbeat);  // Clear heartbeat interval
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    };
  }, [roomId, peerId]);

  const handleSendMessage = () => {
    if (!dataChannel) {
      console.error('Data channel is not initialized');
      return;
    }

    if (dataChannel.readyState === 'open') {
      const messageData = { type: 'chat', content: message };
      dataChannel.send(JSON.stringify(messageData));  // Send message over data channel
      setReceivedMessages(prev => [...prev, message]);
      setMessage('');  // Clear input
    } else {
      console.error('Data channel is not open');
    }
  };

  return (
    <div>
      <h2>Room: {roomId}</h2>
      <div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
      <div>
        <h3>Messages:</h3>
        <ul>
          {receivedMessages.map((msg, idx) => (
            <li key={idx}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Room;
