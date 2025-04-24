import { Point } from "./point";
export type PointCoords = {
    x: number;
    y: number;
}
export type PointGroup = {
    color: string;
    points: Point[]
}

export type Width = {
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