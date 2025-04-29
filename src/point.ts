import type { Point } from "./types";

const distanceTo = (start:Point, end:Point) => Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
const velocityFrom = (start:Point, end:Point) => end.time !== start.time ? distanceTo(start, end) / (end.time - start.time) : 0;
const createPoint = (x:number, y:number, time: number = Date.now()) => ({ x, y, time });

export {
    distanceTo,
    velocityFrom,
    createPoint
}