export type Point = {
  x: number;
  y: number;
};

export type Stroke = {
  points: Point[];
  color: string;
  strokeWidth: number;
  tool?: 'brush' | 'eraser';
};

export type User = {
  id: string;
  name: string;
  color: string;
};

export type Cursors = {
  [id: string]: {
    x: number;
    y: number;
    name: string;
    color: string;
  };
};
