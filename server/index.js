import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { customAlphabet } from 'nanoid';

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Hamsafer Web Signaling Server',
    activeRooms: rooms.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// nanoid custom alphabet (uppercase letters + digits), length 6
const generateRoomCode = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

// rooms: Map<roomCode, { users: Map<socketId, { name, socketId }> }>
const rooms = new Map();

function getRoomUsers(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return [];
  return Array.from(room.users.values());
}

function findUserRoom(socketId) {
  for (const [roomCode, roomData] of rooms.entries()) {
    if (roomData.users.has(socketId) || (roomData.creatorSocketId === socketId && roomData.users.size === 0)) {
      return roomCode;
    }
  }
  return null;
}

function handleUserLeave(socket) {
  const roomCode = findUserRoom(socket.id);
  if (roomCode) {
    const room = rooms.get(roomCode);
    room.users.delete(socket.id);
    
    // Notify remaining users
    socket.to(roomCode).emit('user-left', { socketId: socket.id });
    
    // Clean up empty room
    if (room.users.size === 0) {
      rooms.delete(roomCode);
      console.log(`[Room ${roomCode}] Empty room deleted`);
    }
    
    socket.leave(roomCode);
    console.log(`[Room ${roomCode}] User left (socket: ${socket.id})`);
  }
}

io.on('connection', (socket) => {
  socket.on('create-room', ({ name }, callback) => {
    const roomCode = generateRoomCode();
    
    // Only reserve the room — do NOT add the creator yet.
    // They will join via 'join-room' when they click "Enter Room".
    const users = new Map();
    rooms.set(roomCode, { users, creatorSocketId: socket.id });
    
    if (callback) {
      callback({ success: true, roomCode });
    }
    
    console.log(`[Room ${roomCode}] Created by ${name} (socket: ${socket.id})`);
  });

  socket.on('join-room', ({ roomCode, name }, callback) => {
    const normalizedRoomCode = roomCode ? roomCode.toUpperCase().trim() : '';
    console.log(`[join-room] ${name} attempting to join ${normalizedRoomCode} (socket: ${socket.id})`);
    
    const room = rooms.get(normalizedRoomCode);
    if (!room) {
      console.log(`[join-room] Room ${normalizedRoomCode} not found`);
      if (callback) callback({ success: false, message: 'Room not found. Please check the code and try again.' });
      return;
    }
    
    if (room.users.size >= 2) {
      console.log(`[join-room] Room ${normalizedRoomCode} is full (${room.users.size} users)`);
      if (callback) callback({ success: false, message: 'This room is already full. Only 2 people can join.' });
      return;
    }

    // If already in room (e.g. reconnect), allow through
    if (room.users.has(socket.id)) {
      console.log(`[join-room] ${name} already in room ${normalizedRoomCode}, re-entering`);
      if (callback) {
        callback({ success: true, roomCode: normalizedRoomCode, users: getRoomUsers(normalizedRoomCode) });
      }
      return;
    }
    
    room.users.set(socket.id, { name, socketId: socket.id });
    socket.join(normalizedRoomCode);
    
    // Notify other users in the room
    socket.to(normalizedRoomCode).emit('user-joined', { socketId: socket.id, name });
    
    if (callback) {
      callback({ success: true, roomCode: normalizedRoomCode, users: getRoomUsers(normalizedRoomCode) });
    }
    
    console.log(`[Room ${normalizedRoomCode}] ${name} joined (${room.users.size}/2 users)`);
  });

  socket.on('signal', ({ to, signal }) => {
    io.to(to).emit('signal', { from: socket.id, signal });
  });

  socket.on('yt-sync', ({ roomCode, action, videoTime, videoId }) => {
    socket.to(roomCode).emit('yt-sync', { action, videoTime, videoId });
  });

  socket.on('toggle-media', ({ roomCode, type, enabled }) => {
    socket.to(roomCode).emit('peer-media-toggle', { type, enabled, socketId: socket.id });
  });

  socket.on('chat-message', ({ roomCode, message, senderName, timestamp }) => {
    socket.to(roomCode).emit('chat-message', {
      message,
      senderName,
      senderId: socket.id,
      timestamp: timestamp || Date.now()
    });
  });

  socket.on('typing', ({ roomCode, isTyping, userName }) => {
    socket.to(roomCode).emit('peer-typing', { isTyping, userName });
  });

  socket.on('reaction', ({ roomCode, emoji, senderName }) => {
    socket.to(roomCode).emit('peer-reaction', { emoji, senderName, senderId: socket.id });
  });

  socket.on('share-image', ({ roomCode, imageData, senderName, caption }) => {
    socket.to(roomCode).emit('peer-image', { imageData, senderName, caption, timestamp: Date.now() });
  });

  socket.on('toggle-screen-share', ({ roomCode, isSharing }) => {
    socket.to(roomCode).emit('peer-screen-share', { isSharing, socketId: socket.id });
  });

  socket.on('leave-room', () => {
    handleUserLeave(socket);
  });

  socket.on('disconnect', () => {
    handleUserLeave(socket);
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`\n  🌹 Hamsafer Web Signaling Server`);
  console.log(`  ➜ Running on http://localhost:${PORT}\n`);
});
