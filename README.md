# CollabCanvas - Real-Time Collaborative Drawing Canvas

CollabCanvas is a multi-user collaborative drawing application built with Next.js and Socket.IO. It allows multiple users to draw on the same canvas in real-time, with all actions synchronized instantly between connected clients.

![CollabCanvas Screenshot](https://picsum.photos/seed/collab-canvas/1200/600?data-ai-hint=app%20screenshot)

## 🎯 Core Features

-   **Real-time Collaborative Drawing**: Draw on a shared canvas with updates synchronized live using WebSockets.
-   **Drawing Tools**: Select your brush color and stroke width.
-   **User Identification**: Each user is assigned a unique name and color. Active users' cursors are displayed on the canvas.
-   **Global Undo/Redo**: Revert or reapply the last drawing actions. The state is synchronized for all users.
-   **Connected Users List**: See a list of all users currently in the session.
-   **Responsive Design**: The canvas and UI are fully responsive, providing a seamless experience on both desktop and mobile devices.

## ⚙️ Tech Stack

-   **Frontend**: Next.js, React, TypeScript, Tailwind CSS
-   **Backend**: Node.js, Express, Socket.IO
-   **UI Components**: ShadCN/UI, Lucide React (Icons)
-   **Drawing**: HTML5 Canvas API (no third-party canvas libraries)

## 🚀 Getting Started

To run CollabCanvas locally, you will need to run two processes in separate terminals: the Next.js frontend and the Socket.IO backend.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later recommended)
-   [npm](https://www.npmjs.com/) (or yarn/pnpm)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd collaborative-canvas
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Running in Development

1.  **Start the Backend (Socket.IO Server):**
    Open a terminal and run:
    ```bash
    npm run dev:socket
    ```
    This will start the WebSocket server on `http://localhost:3001`.

2.  **Start the Frontend (Next.js App):**
    Open a second terminal and run:
    ```bash
    npm run dev
    ```
    This will start the Next.js development server, typically on `http://localhost:9002`.

3.  **Open the App:**
    Navigate to `http://localhost:9002` in your web browser.

### How to Test Collaboration

1.  Open `http://localhost:9002` in two or more separate browser tabs or windows.
2.  Each tab will represent a different user.
3.  Draw in one window — the drawing should appear instantly in the others.
4.  Change colors, use the undo/redo buttons, and watch as the state stays synchronized across all sessions.

## 📦 Available Scripts

-   `npm run dev`: Starts the Next.js frontend development server.
-   `npm run dev:socket`: Starts the backend WebSocket server with `nodemon` for auto-reloading.
-   `npm run build`: Creates a production build of the Next.js application.
-   `npm run start`: Starts the production Next.js server (requires `npm run build` first).
-   `npm run start:socket`: Starts the backend WebSocket server for production.

## Known Limitations

-   **No Persistence**: The drawing state is stored in memory on the server. If the server restarts, the current drawing will be lost.
-   **Basic Usernames**: Usernames are assigned randomly (`User-1`, `User-2`, etc.) and are not customizable.
-   **No Eraser Tool**: The current implementation focuses on additive drawing. An eraser tool can be added as a future enhancement by drawing with the background color.
