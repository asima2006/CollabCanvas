// In-memory store for the drawing state.
// This is not persistent. The state is lost on server restart.

// Room-based in-memory store for the drawing state.
// Each room has its own history, redo stack and user map.
// This is not persistent. The state is lost on server restart.

const rooms = new Map();

const COLORS = [
  '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
  '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
  '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'
];
function createRoomIfMissing(roomId = 'default') {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      history: [],
      redoStack: [],
      users: new Map(),
      userColorIndex: 0,
      userNameCounter: 1,
    });
  }
  return rooms.get(roomId);
}

function getNextColor(roomId) {
  const room = createRoomIfMissing(roomId);
  const idx = room.userColorIndex;
  const color = COLORS[idx % COLORS.length];
  room.userColorIndex = (idx + 1) % COLORS.length;
  return color;
}

function addUser(id, roomId = 'default') {
  const room = createRoomIfMissing(roomId);
  const user = {
    id,
    name: `User-${room.userNameCounter++}`,
    color: getNextColor(roomId),
  };
  room.users.set(id, user);
  return user;
}

function removeUser(id, roomId = 'default') {
  const room = createRoomIfMissing(roomId);
  room.users.delete(id);
}

function getUser(id, roomId = 'default') {
  const room = createRoomIfMissing(roomId);
  return room.users.get(id);
}

function getAllUsers(roomId = 'default') {
  const room = createRoomIfMissing(roomId);
  return Array.from(room.users.values());
}

function addStroke(stroke, roomId = 'default') {
  const room = createRoomIfMissing(roomId);
  room.history.push(stroke);
  // A new stroke clears the redo stack
  room.redoStack = [];
}

function undoStroke(roomId = 'default') {
  const room = createRoomIfMissing(roomId);
  if (room.history.length > 0) {
    const lastStroke = room.history.pop();
    if (lastStroke) {
      room.redoStack.push(lastStroke);
    }
  }
}

function redoStroke(roomId = 'default') {
  const room = createRoomIfMissing(roomId);
  if (room.redoStack.length > 0) {
    const lastUndoneStroke = room.redoStack.pop();
    if (lastUndoneStroke) {
      room.history.push(lastUndoneStroke);
    }
  }
}

function getHistory(roomId = 'default') {
  const room = createRoomIfMissing(roomId);
  return room.history;
}

function getRedoStack(roomId = 'default') {
  const room = createRoomIfMissing(roomId);
  return room.redoStack;
}

module.exports = {
  addUser,
  removeUser,
  getUser,
  getAllUsers,
  addStroke,
  undoStroke,
  redoStroke,
  getHistory,
  getRedoStack,
};
