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

const cursorPositions = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Add user to state and get their details
  const user = drawingState.addUser(socket.id);
  cursorPositions.set(socket.id, { x: -1, y: -1, name: user.name, color: user.color });

  // Send the current state to the new user
  socket.emit('canvas-state', {
    history: drawingState.getHistory(),
    redoStack: drawingState.getRedoStack(),
    users: drawingState.getAllUsers(),
  });

  // Inform all other users that a new user has joined
  socket.broadcast.emit('user-list', drawingState.getAllUsers());


  // Handle drawing events
  socket.on('draw', (stroke) => {
    drawingState.addStroke(stroke);
    // Broadcast the new stroke to all other clients
    socket.broadcast.emit('new-draw', stroke);
  });

  // Handle cursor movement
  socket.on('cursor-move', (pos) => {
    const userCursor = cursorPositions.get(socket.id);
    if(userCursor) {
      userCursor.x = pos.x;
      userCursor.y = pos.y;
      // Broadcast all cursor positions (throttled on client)
      io.emit('cursor-positions', Object.fromEntries(cursorPositions));
    }
  });

  // Handle undo events
  socket.on('undo', () => {
    drawingState.undoStroke();
    // Broadcast the updated history to all clients
    io.emit('canvas-update', { 
        history: drawingState.getHistory(),
        redoStack: drawingState.getRedoStack(),
    });
  });

  // Handle redo events
  socket.on('redo', () => {
    drawingState.redoStroke();
    // Broadcast the updated history to all clients
    io.emit('canvas-update', { 
        history: drawingState.getHistory(),
        redoStack: drawingState.getRedoStack(),
    });
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    drawingState.removeUser(socket.id);
    cursorPositions.delete(socket.id);
    // Inform all clients that a user has left
    io.emit('user-list', drawingState.getAllUsers());
    io.emit('cursor-positions', Object.fromEntries(cursorPositions));
  });
});

server.listen(PORT, HOST, () => {
  console.log(`CollabCanvas server is running on http://${HOST}:${PORT}`);
});
