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