
export interface Point {
  x: number;
  y: number;
  time: number;
}

export interface PointCoords {
    x: number;
    y: number;
}
export interface PointGroup {
    color: string;
    points: Point[]
}

export interface Width {
    start: number;
    end: number;
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