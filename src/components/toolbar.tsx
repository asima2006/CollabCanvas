"use client";

import { Brush, Palette, Redo, Share2, Undo } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Slider } from "./ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

type ToolbarProps = {
  color: string;
  strokeWidth: number;
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
  onColorChange,
  onStrokeWidthChange,
  onUndo,
  onRedo,
  onShare,
  canUndo,
  canRedo,
}: ToolbarProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 p-2 bg-card border rounded-lg shadow-lg">
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <Palette className="h-5 w-5" style={{ color }}/>
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
                <Button variant="outline" size="icon">
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
