"use client";

import { Brush, Palette, Redo, Share2, Undo } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Slider } from "./ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

type ToolbarProps = {
  color: string;
  strokeWidth: number;
  tool?: 'brush' | 'eraser';
  onToolChange?: (tool: 'brush' | 'eraser') => void;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onShare: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

const colors = [
    '#000000', '#EF4444', '#F97316', '#EAB308', '#84CC16', '#22C55E', 
    '#14B8A6', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#78716C'
];

export default function Toolbar({
  color,
  strokeWidth,
  tool = 'brush',
  onToolChange,
  onColorChange,
  onStrokeWidthChange,
  onUndo,
  onRedo,
  onShare,
  canUndo,
  canRedo,
}: ToolbarProps) {
  const eraserSizes = [8, 16, 24, 40, 64];
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 p-2 bg-card border rounded-lg shadow-lg">
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  {/* Show a color swatch when using brush, and a visible eraser indicator when eraser is active */}
                  {tool === 'eraser' ? (
                    <div className="h-5 w-5 rounded-full flex items-center justify-center border" style={{ background: '#ffffff' }}>
                      {/* simple eraser icon inside circle */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-3 w-3 text-gray-600" fill="none" stroke="currentColor">
                        <path d="M3 17.25L10.75 9.5l4.5 4.5L7.5 21H3v-3.75z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border" style={{ backgroundColor: color, borderColor: 'rgba(0,0,0,0.08)' }} />
                  )}
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Change Color</p>
            </TooltipContent>
          </Tooltip>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-6 gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => onColorChange(c)}
                  className={`h-6 w-6 rounded-full border-2 ${color === c ? 'border-primary' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => onColorChange(e.target.value)}
                className="h-6 w-6 rounded-full border-none p-0 cursor-pointer appearance-none bg-transparent"
                aria-label="Custom color picker"
              />
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant={tool === 'brush' ? 'default' : 'outline'} size="icon" onClick={() => onToolChange?.('brush')}>
                  <Brush className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Stroke Width ({strokeWidth}px)</p>
            </TooltipContent>
          </Tooltip>
          <PopoverContent className="w-40 p-4">
              <Slider
                value={[strokeWidth]}
                onValueChange={(value) => onStrokeWidthChange(value[0])}
                min={1}
                max={50}
                step={1}
              />
          </PopoverContent>
        </Popover>

        {/* Eraser size quick-select (visible always near tools) */}
        <div className="flex items-center gap-1">
          {eraserSizes.map((s) => (
            <button
              key={s}
              onClick={() => onStrokeWidthChange(s)}
              title={`${s}px`}
              className={`rounded-full border ${strokeWidth === s ? 'border-primary' : 'border-transparent'}`}
              style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}
            >
              {/* make the inner preview visible for both tools; use a subtle gray for eraser */}
              <span style={{ width: Math.max(4, Math.min(20, s/4)), height: Math.max(4, Math.min(20, s/4)), borderRadius: '50%', background: tool === 'eraser' ? '#9CA3AF' : '#000', display: 'block' }} />
            </button>
          ))}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={onUndo} disabled={!canUndo}>
              <Undo className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Undo</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant={tool === 'eraser' ? 'default' : 'outline'} size="icon" onClick={() => onToolChange?.('eraser')}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M2 12l5 5L20 4l-5-5L2 12z" /></svg>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Eraser</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={onRedo} disabled={!canRedo}>
              <Redo className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Redo</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={onShare}>
              <Share2 className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copy Invite Link</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
