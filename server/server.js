const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const drawingState = require('./drawingState');

const app = express();
app.use(cors());
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for simplicity in development
    methods: ['GET', 'POST'],
  },
});

// Simple HTTP route to inspect room state for debugging
app.get('/room/:id', (req, res) => {
  const roomId = req.params.id || 'default';
  try {
    const history = drawingState.getHistory(roomId);
    const redo = drawingState.getRedoStack(roomId);
    const users = drawingState.getAllUsers(roomId);
    res.json({ roomId, historyLength: history.length, redoLength: redo.length, users });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Map of roomId -> Map(socketId -> cursor)
const cursorPositions = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Default room until client joins
  socket.data.room = 'default';

  // Listen for room join from client
  socket.on('join-room', (roomId = 'default') => {
    console.log(`Socket ${socket.id} requested join-room: ${roomId}`);
    // Leave previous room (if any)
    const prevRoom = socket.data.room;
    if (prevRoom && prevRoom !== roomId) {
      socket.leave(prevRoom);
    }

    socket.join(roomId);
    socket.data.room = roomId;

    // Add user to state for this room and set cursor default
    const user = drawingState.addUser(socket.id, roomId);
    if (!cursorPositions.has(roomId)) cursorPositions.set(roomId, new Map());
    cursorPositions.get(roomId).set(socket.id, { x: -1, y: -1, name: user.name, color: user.color });

    // Send the current state for the room to the new user
    socket.emit('canvas-state', {
      history: drawingState.getHistory(roomId),
      redoStack: drawingState.getRedoStack(roomId),
      users: drawingState.getAllUsers(roomId),
    });

    // Inform other users in the room
    socket.to(roomId).emit('user-list', drawingState.getAllUsers(roomId));
  });

  // Handle final drawing events
  socket.on('draw', (stroke) => {
    console.log(`Received draw from ${socket.id} in room ${socket.data.room}: points=${(stroke.points||[]).length} tool=${stroke.tool}`);
    const roomId = socket.data.room || 'default';
    // Ensure stroke has metadata: id, ownerId, ts
    const enriched = Object.assign({}, stroke);
    if (!enriched.id) enriched.id = `${socket.id}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
    enriched.ownerId = enriched.ownerId || socket.id;
    enriched.ts = enriched.ts || Date.now();

    drawingState.addStroke(enriched, roomId);
    // Broadcast the new stroke to all clients in the same room (including sender)
    io.to(roomId).emit('new-draw', enriched);
  });

  // Handle in-progress drawing events
  socket.on('drawing', (stroke) => {
    // small debug log to confirm receipt of high-frequency events (throttled in logs)
    if(Math.random() < 0.02) console.log(`Received drawing preview from ${socket.id} in room ${socket.data.room} (points=${(stroke.points||[]).length} tool=${stroke.tool})`);
    const roomId = socket.data.room || 'default';
    // Attach ownerId so other clients can show cursor/preview correctly
    const enriched = Object.assign({}, stroke);
    enriched.ownerId = enriched.ownerId || socket.id;
    if (!enriched.id) enriched.id = `${socket.id}-tmp-${Math.random().toString(36).slice(2,6)}`;
    socket.to(roomId).emit('drawing', enriched);
  });

  // Handle cursor movement
  socket.on('cursor-move', (pos) => {
    // debug cursor
    // console.log(`cursor-move from ${socket.id} in room ${socket.data.room}: x=${pos.x}, y=${pos.y}`);
    const roomId = socket.data.room || 'default';
    const roomCursors = cursorPositions.get(roomId);
    if (roomCursors) {
      const userCursor = roomCursors.get(socket.id);
      if (userCursor) {
        userCursor.x = pos.x;
        userCursor.y = pos.y;
        // Broadcast all cursor positions for the room (throttled on client)
        io.to(roomId).emit('cursor-positions', Object.fromEntries(roomCursors));
      }
    }
  });

  // Handle undo events
  socket.on('undo', () => {
    console.log(`Undo requested by ${socket.id} in room ${socket.data.room}`);
    const roomId = socket.data.room || 'default';
    drawingState.undoStroke(roomId);
    // Broadcast the updated history to all clients in the room
    io.to(roomId).emit('canvas-update', { 
        history: drawingState.getHistory(roomId),
        redoStack: drawingState.getRedoStack(roomId),
    });
  });

  // Handle redo events
  socket.on('redo', () => {
    console.log(`Redo requested by ${socket.id} in room ${socket.data.room}`);
    const roomId = socket.data.room || 'default';
    drawingState.redoStroke(roomId);
    // Broadcast the updated history to all clients in the room
    io.to(roomId).emit('canvas-update', { 
        history: drawingState.getHistory(roomId),
        redoStack: drawingState.getRedoStack(roomId),
    });
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    const roomId = socket.data.room || 'default';
    drawingState.removeUser(socket.id, roomId);
    const roomCursors = cursorPositions.get(roomId);
    if (roomCursors) {
      roomCursors.delete(socket.id);
    }
    // Inform clients in the room that a user has left
    io.to(roomId).emit('user-list', drawingState.getAllUsers(roomId));
    io.to(roomId).emit('cursor-positions', roomCursors ? Object.fromEntries(roomCursors) : {});
  });
});

server.listen(PORT, HOST, () => {
  console.log(`CollabCanvas server is running on http://${HOST}:${PORT}`);
});
