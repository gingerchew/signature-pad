
interface Point {
  x: number;
  y: number;
  time: number;
}

interface PointCoords {
  x: number;
  y: number;
}

interface PointGroup {
  color: string;
  points: Point[]
}

interface Bezier {
  startPoint: Point;
  control2: Point;
  control1: Point;
  endPoint: Point;
  startWidth: number;
  endWidth: number;
  length: number;
}

interface Width {
  start: number;
  end: number;
}

export type {
  Point,
  PointCoords,
  PointGroup,
  Bezier,
  Width
}

/**
 * Courtesy of the invoker-polyfill
 */
declare global {
  interface CommandEvent extends Event {
    source: Element;
    command: string;
  }
  interface HTMLButtonElement {
    commandForElement: HTMLElement | null;
    command: 'show-modal' | 'close' | 'hide-popover' | 'toggle-popover' | 'show-popover' | `--${string}`;
  }
  interface Window {
    CommandEvent: CommandEvent;
  }
}