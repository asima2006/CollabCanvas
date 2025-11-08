"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import { type User, type Stroke, type Cursors } from "@/lib/types";
import { useToast } from "./use-toast";
import throttle from "lodash.throttle";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export default function useDrawingSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [history, setHistory] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [cursors, setCursors] = useState<Cursors>({});
  const { toast } = useToast();

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to socket server with ID:", socket.id);
    });

    socket.on("canvas-state", (data: { history: Stroke[], redoStack: Stroke[], users: User[] }) => {
      setHistory(data.history);
      setRedoStack(data.redoStack);
      setUsers(data.users);
      toast({
        title: "Connected!",
        description: "You can now collaborate with others.",
      });
    });

    socket.on("user-list", (userList: User[]) => {
      const oldUserCount = users.length;
      if (userList.length > oldUserCount) {
        const newUser = userList[userList.length-1];
        if (newUser.id !== socket.id) {
            toast({ description: `${newUser.name} joined the session.` });
        }
      } else if (userList.length < oldUserCount) {
        toast({ description: `A user left the session.` });
      }
      setUsers(userList);
    });

    socket.on("new-draw", (stroke: Stroke) => {
      setHistory((prevHistory) => [...prevHistory, stroke]);
      setRedoStack([]);
    });
    
    socket.on("canvas-update", (data: { history: Stroke[], redoStack: Stroke[] }) => {
      setHistory(data.history);
      setRedoStack(data.redoStack);
    });

    socket.on("cursor-positions", (cursorPositions: Cursors) => {
      setCursors(cursorPositions);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from socket server");
      toast({
        title: "Connection Lost",
        description: "Attempting to reconnect...",
        variant: "destructive",
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [toast, users.length]);

  const draw = useCallback((stroke: Stroke) => {
    socketRef.current?.emit("draw", stroke);
    setHistory((prevHistory) => [...prevHistory, stroke]);
    setRedoStack([]);
  }, []);

  const moveCursor = useCallback(
    throttle((pos: { x: number; y: number }) => {
      socketRef.current?.emit("cursor-move", pos);
    }, 50), // Throttle to 20 times per second
    []
  );

  const undo = useCallback(() => {
    socketRef.current?.emit("undo");
  }, []);

  const redo = useCallback(() => {
    socketRef.current?.emit("redo");
  }, []);

  return { socket: socketRef.current, history, redoStack, users, cursors, draw, moveCursor, undo, redo };
}
