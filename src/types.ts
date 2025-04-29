
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

interface Width {
  start: number;
  end: number;
}

export type {
  Point,
  PointCoords,
  PointGroup,
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