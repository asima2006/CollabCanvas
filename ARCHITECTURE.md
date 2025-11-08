# CollabCanvas Architecture

This document outlines the technical architecture of the Real-Time Collaborative Drawing Canvas application.

## 1. System Overview

The application consists of two main parts:

1.  **Next.js Frontend**: A client-side application built with Next.js and React that renders the canvas, toolbar, and user interface. It communicates with the backend via WebSockets.
2.  **Node.js + Socket.IO Backend**: A standalone WebSocket server responsible for real-time communication, state synchronization, and managing the global drawing history.

This decoupled architecture allows the frontend and backend to be developed, deployed, and scaled independently.

---

## 2. Data Flow Diagram

The core of the application is the real-time data flow between clients and the server.

```
+-----------+         +---------------------+         +-----------+
|           |         |                     |         |           |
|  Client A |--(1,2)-->|   Socket.IO Server  |--(4,5)-->|  Client B |
|           |<--(3,4)--| (Node.js + Express) |<--(2,6)--|           |
|           |         |                     |         |           |
+-----------+         +---------------------+         +-----------+
      ^                                                     ^
      |                                                     |
      +------------------------(3,5)------------------------+

```

**Event Sequence:**

1.  **Client Connects (`connection`)**: A user opens the app, and the client establishes a WebSocket connection with the server. The server assigns a unique ID and color.
2.  **Client Draws (`draw`)**: Client A draws a stroke on their canvas. When the stroke is complete (e.g., on `mouseup`), an event containing the stroke data (points, color, width) is emitted to the server.
3.  **Server Broadcasts Draw (`new-draw`)**: The server receives the stroke, adds it to the global drawing history, and broadcasts it to *all other* connected clients.
4.  **Client Renders (`new-draw`)**: Client B (and others) receives the `new-draw` event and renders the new stroke onto their local canvas.
5.  **Server Broadcasts State (`canvas-update`)**: For actions that change the entire state (like Undo/Redo), the server sends the complete, updated drawing history to *all* clients, who then clear and redraw their canvases.
6.  **Client Sends Cursor Position (`cursor-move`)**: While drawing, the client sends throttled cursor coordinates to the server. The server broadcasts these to other clients (`cursor-positions`) to show real-time cursor locations.

---

## 3. WebSocket Message Types

Communication is handled via a set of defined WebSocket events.

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| **Connection & State** | | | |
| `connection` | C -> S | - | A new client connects to the server. |
| `canvas-state` | S -> C | `{ history: Stroke[], users: User[] }` | Sent to a newly connected client to provide the current canvas history and user list. |
| `user-list` | S -> C | `User[]` | Broadcast to all clients when a user joins or leaves. |
| **Drawing** | | | |
| `draw` | C -> S | `Stroke` | A client sends a completed drawing stroke to the server. |
| `new-draw` | S -> C | `Stroke` | The server broadcasts a new stroke to be drawn by other clients. |
| **Cursors** | | | |
| `cursor-move` | C -> S | `{ x: number, y: number }` | A client sends its current cursor position (throttled). |
| `cursor-positions`| S -> C | `Map<string, { x: number, y: number, name: string, color: string }>` | The server broadcasts the positions of all active cursors. |
| **History Management** | | | |
| `undo` | C -> S | - | A client requests to undo the last action. |
| `redo` | C -> S | - | A client requests to redo the last undone action. |
| `canvas-update` | S -> C | `{ history: Stroke[] }` | Sent after an undo/redo, instructing clients to redraw the canvas with the new history. |

---

## 4. Backend State Management (`server/drawingState.js`)

The server maintains the global state of the application in memory. This is simple and fast but not persistent; the drawing is lost if the server restarts.

-   **`history`**: An array of `Stroke` objects. It serves as the single source of truth for the drawing. Each object contains all points, color, and width for a single continuous line.
-   **`redoStack`**: An array of `Stroke` objects that have been undone. This allows for the redo functionality.
-   **`users`**: A `Map` that stores information about each connected client (`socket.id` -> `{ id, name, color }`).

## 5. Undo/Redo Strategy

The undo/redo functionality is managed centrally on the server to ensure consistency.

-   **Undo**: When the server receives an `undo` event:
    1.  It checks if the `history` array is not empty.
    2.  It `pop()`s the last stroke from `history` and `push()`es it onto the `redoStack`.
    3.  It broadcasts a `canvas-update` event with the entire modified `history` array to all clients.
-   **Redo**: When the server receives a `redo` event:
    1.  It checks if the `redoStack` is not empty.
    2.  It `pop()`s the last stroke from `redoStack` and `push()`es it back onto the `history` array.
    3.  It broadcasts a `canvas-update` event with the modified `history`.
-   **New Drawing Action**: When a new stroke is drawn, the `redoStack` is cleared. This is standard behavior for undo/redo systems.

Clients simply listen for `canvas-update` and redraw their canvas from scratch based on the received history. This is a robust approach that prevents client-side state from desynchronizing.

## 6. Conflict Handling

Given the nature of the application, conflicts are minimal. The strategy is "last write wins."

-   If two users draw over the same area, the strokes are rendered in the order they are received by the server. The `history` array maintains this order, and since all clients render from this array, the final image is consistent for everyone.
-   There is no locking or merging of strokes. This simple approach works well for a collaborative drawing tool.
