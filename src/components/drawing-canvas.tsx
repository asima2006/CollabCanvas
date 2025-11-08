"use client";

import { useRef, useEffect, useState } from "react";
import { type Point, type Stroke, type Cursors } from "@/lib/types";

type DrawingCanvasProps = {
  history: Stroke[];
  color: string;
  strokeWidth: number;
  onDraw: (stroke: Stroke) => void;
  onCursorMove: (pos: { x: number; y: number }) => void;
  cursors: Cursors;
  selfId?: string;
};

export default function DrawingCanvas({
  history,
  color,
  strokeWidth,
  onDraw,
  onCursorMove,
  cursors,
  selfId,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorCanvasRef = useRef<HTMLCanvasElement>(null);

  const isDrawing = useRef(false);
  const currentStroke = useRef<Point[]>([]);

  const getCanvasContext = (ref: React.RefObject<HTMLCanvasElement>) => {
    return ref.current?.getContext("2d");
  };

  const setCanvasDimensions = () => {
    const canvas = canvasRef.current;
    const cursorCanvas = cursorCanvasRef.current;
    if (!canvas || !cursorCanvas || !canvas.parentElement) return;

    const { width, height } = canvas.parentElement.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
    cursorCanvas.width = width;
    cursorCanvas.height = height;
  };
  
  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    ctx.strokeStyle = stroke.color;
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
  };

  const redrawCanvas = () => {
    const ctx = getCanvasContext(canvasRef);
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    history.forEach((stroke) => drawStroke(ctx, stroke));
  };
  
  useEffect(() => {
    setCanvasDimensions();
    redrawCanvas();

    const handleResize = () => {
      setCanvasDimensions();
      redrawCanvas();
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    redrawCanvas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history]);
  
  useEffect(() => {
    const cursorCtx = getCanvasContext(cursorCanvasRef);
    if (!cursorCtx || !cursorCanvasRef.current) return;
    cursorCtx.clearRect(0, 0, cursorCanvasRef.current.width, cursorCanvasRef.current.height);

    Object.entries(cursors).forEach(([id, cursor]) => {
      if (id !== selfId && cursor.x > 0 && cursor.y > 0) {
        cursorCtx.fillStyle = cursor.color;
        cursorCtx.beginPath();
        cursorCtx.arc(cursor.x, cursor.y, 5, 0, 2 * Math.PI);
        cursorCtx.fill();
        cursorCtx.font = "12px Inter";
        cursorCtx.fillText(cursor.name, cursor.x + 10, cursor.y + 4);
      }
    });
  }, [cursors, selfId]);

  const getPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleStartDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDrawing.current = true;
    const point = getPoint(e);
    currentStroke.current = [point];
  };

  const handleDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    
    const point = getPoint(e);
    currentStroke.current.push(point);
    onCursorMove({ x: point.x, y: point.y });

    const ctx = getCanvasContext(canvasRef);
    if (!ctx) return;
    
    const stroke: Stroke = {
        points: currentStroke.current,
        color,
        strokeWidth,
    };
    drawStroke(ctx, stroke);
  };

  const handleEndDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    isDrawing.current = false;
    
    if (currentStroke.current.length > 1) {
      onDraw({
        points: currentStroke.current,
        color,
        strokeWidth,
      });
    }
    currentStroke.current = [];
  };

  return (
    <div className="absolute inset-0 h-full w-full bg-white rounded-lg shadow-inner">
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0"
        onMouseDown={handleStartDrawing}
        onMouseMove={handleDrawing}
        onMouseUp={handleEndDrawing}
        onMouseLeave={handleEndDrawing}
        onTouchStart={handleStartDrawing}
        onTouchMove={handleDrawing}
        onTouchEnd={handleEndDrawing}
      />
      <canvas
        ref={cursorCanvasRef}
        className="absolute top-0 left-0 pointer-events-none"
      />
    </div>
  );
}
