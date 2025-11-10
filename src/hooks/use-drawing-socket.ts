"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import { type User, type Stroke, type Cursors } from "@/lib/types";
import { useToast } from "./use-toast";
import throttle from "lodash.throttle";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3001` : "http://localhost:3001");

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke, isPreview = false) {
    const prevComposite = ctx.globalCompositeOperation;
    if (stroke.tool === 'eraser') {
      // For previews (on temporary canvas) draw a visible gray stroke using source-over so
      // other clients can see where erasing will occur. For final strokes on the main canvas
      // use destination-out to actually erase content.
      if (isPreview) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      } else {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      }
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color;
    }
    ctx.lineWidth = stroke.strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    if (stroke.points.length > 0) {
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }
    ctx.globalCompositeOperation = prevComposite;
}

export default function useDrawingSocket(providedRoomId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [history, setHistory] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [cursors, setCursors] = useState<Cursors>({});
  const { toast } = useToast();
  const usersRef = useRef(users);

  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tempCanvasContextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    // Create a temporary canvas to draw other users' live strokes
    const canvas = document.createElement('canvas');
    if (document.querySelector('.absolute.inset-0')) {
        const container = document.querySelector('.absolute.inset-0') as HTMLElement;
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        canvas.className = "absolute top-0 left-0 pointer-events-none";
        container.appendChild(canvas);
        tempCanvasRef.current = canvas;
        tempCanvasContextRef.current = canvas.getContext('2d');
    }
    return () => {
        if(canvas.parentElement) {
            canvas.parentElement.removeChild(canvas);
        }
    }
  }, []);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to socket server with ID:", socket.id);
    });

  // Determine room id to join: prefer providedRoomId (from UI), otherwise URL `room` param or 'default'
  const url = typeof window !== 'undefined' ? new URL(window.location.href) : null;
  const urlRoom = url?.searchParams.get('room');
  const roomId = providedRoomId || urlRoom || 'default';
  socket.emit('join-room', roomId);

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
      const oldUserCount = usersRef.current.length;
      if (userList.length > oldUserCount) {
        const newUser = userList.find(u => !usersRef.current.some(oldu => oldu.id === u.id));
        if (newUser && newUser.id !== socket.id) {
            toast({ description: `${newUser.name} joined the session.` });
        }
      } else if (userList.length < oldUserCount) {
        const leftUser = usersRef.current.find(u => !userList.some(newu => newu.id === u.id));
        if (leftUser) {
          toast({ description: `${leftUser.name} left the session.` });
        }
      }
      setUsers(userList);
    });

    socket.on("new-draw", (stroke: Stroke) => {
      setHistory((prevHistory) => [...prevHistory, stroke]);
      setRedoStack([]);

      // Clear the temporary canvas when a final stroke is received
      if(tempCanvasContextRef.current && tempCanvasRef.current) {
        tempCanvasContextRef.current.clearRect(0,0,tempCanvasRef.current.width, tempCanvasRef.current.height);
      }
    });

  socket.on("drawing", (stroke: Stroke) => {
    const ctx = tempCanvasContextRef.current;
    const canvas = tempCanvasRef.current;
    if(ctx && canvas) {
      // Clear the canvas before drawing the new stroke
      ctx.clearRect(0,0, canvas.width, canvas.height);
      // mark as preview so eraser strokes render visibly on the temp canvas
      drawStroke(ctx, stroke, true);
    }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  // throttled drawing emitter (25ms)
  const drawingThrottled = useRef(throttle((s: any) => {
    socketRef.current?.emit('drawing', s);
  }, 25)).current;

  const draw = useCallback((stroke: Stroke) => {
    // Attach id/owner/ts to final stroke before sending so server and peers have canonical metadata
    const enriched = {
      ...stroke,
      id: `${socketRef.current?.id || 'anon'}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      ownerId: socketRef.current?.id,
      ts: Date.now(),
    } as Stroke & { id: string; ownerId?: string; ts: number };
    socketRef.current?.emit("draw", enriched);
  }, []);

  const drawing = useCallback((stroke: Stroke) => {
    // Use a throttled sender for high-frequency in-progress drawing events.
    // We attach a temporary id and owner so peers can render previews.
    const enriched = {
      ...stroke,
      id: `${socketRef.current?.id || 'anon'}-tmp-${Math.random().toString(36).slice(2,6)}`,
      ownerId: socketRef.current?.id,
      ts: Date.now(),
    } as Stroke & { id: string; ownerId?: string; ts: number };
    // Send eraser drawing immediately for low-latency erasing; throttle brush previews
    if (enriched.tool === 'eraser') {
      socketRef.current?.emit('drawing', enriched);
    } else {
      drawingThrottled(enriched);
    }
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

  return { socket: socketRef.current, history, redoStack, users, cursors, draw, drawing, moveCursor, undo, redo };
}
