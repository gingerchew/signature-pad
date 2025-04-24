
/**
 * Signature Pad Custom Element
 */
export class Point {
    constructor(public x: number, public y:number, public time: number = Date.now()) {}
    distanceTo = (start: Point) => Math.sqrt(Math.pow(this.x - start.x, 2) + Math.pow(this.y - start.y, 2));
    equals = (other: Point) => this.x === other.x && this.y === other.y && this.time === other.time;
    velocityFrom = (start: Point) => this.time !== start.time ? this.distanceTo(start) / (this.time - start.time) : 0;
}