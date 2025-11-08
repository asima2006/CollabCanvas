// In-memory store for the drawing state.
// This is not persistent. The state is lost on server restart.

let history = [];
let redoStack = [];
const users = new Map();

const COLORS = [
  '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
  '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
  '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'
];

let userColorIndex = 0;
let userNameCounter = 1;

function getNextColor() {
  const color = COLORS[userColorIndex];
  userColorIndex = (userColorIndex + 1) % COLORS.length;
  return color;
}

function addUser(id) {
  const user = {
    id,
    name: `User-${userNameCounter++}`,
    color: getNextColor(),
  };
  users.set(id, user);
  return user;
}

function removeUser(id) {
  users.delete(id);
}

function getUser(id) {
  return users.get(id);
}

function getAllUsers() {
  return Array.from(users.values());
}

function addStroke(stroke) {
  history.push(stroke);
  // A new stroke clears the redo stack
  redoStack = [];
}

function undoStroke() {
  if (history.length > 0) {
    const lastStroke = history.pop();
    redoStack.push(lastStroke);
  }
  return history;
}

function redoStroke() {
  if (redoStack.length > 0) {
    const lastUndoneStroke = redoStack.pop();
    history.push(lastUndoneStroke);
  }
  return history;
}

function getHistory() {
  return history;
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
};
