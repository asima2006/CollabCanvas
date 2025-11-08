"use client";

import { useState } from "react";
import useDrawingSocket from "@/hooks/use-drawing-socket";
import DrawingCanvas from "./drawing-canvas";
import Toolbar from "./toolbar";
import UserList from "./user-list";
import { type User } from "@/lib/types";
import { Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CollabCanvas() {
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(5);
  const { socket, history, redoStack, users, cursors, undo, redo, draw, moveCursor } = useDrawingSocket();
  const { toast } = useToast();

  const selfId = socket?.id;
  const self = users.find(u => u.id === selfId);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied!",
      description: "You can now share the link with others.",
    });
  };

  return (
    <div className="relative flex h-full w-full flex-col md:flex-row">
      <header className="absolute top-0 left-0 z-10 w-full p-2 md:p-4">
        <div className="flex justify-center">
            <Toolbar
                color={color}
                strokeWidth={strokeWidth}
                onColorChange={setColor}
                onStrokeWidthChange={setStrokeWidth}
                onUndo={undo}
                onRedo={redo}
                onShare={handleShare}
                canUndo={history.length > 0}
                canRedo={redoStack.length > 0}
            />
        </div>
      </header>
      
      <div className="flex-grow relative h-full w-full">
        <DrawingCanvas
          history={history}
          color={color}
          strokeWidth={strokeWidth}
          onDraw={draw}
          onCursorMove={moveCursor}
          cursors={cursors}
          selfId={selfId}
        />
      </div>

      <aside className="absolute top-2 right-2 md:top-4 md:right-4 z-10">
        <UserList users={users} self={self} />
      </aside>

      <footer className="absolute bottom-2 left-2 md:bottom-4 md:left-4 z-10 p-2 bg-background/50 rounded-lg backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{users.length} user{users.length !== 1 ? 's' : ''} online</span>
        </div>
      </footer>
    </div>
  );
}
