import type { Bezier, Point } from "./types";

/* Something to do with calculating the bez curve, very magical */
const point = (t:number, start:number, c1:number, c2:number, end:number) => (start * (1.0 - t) * (1.0 - t) * (1.0 - t))
    + (3.0 * c1 * (1.0 - t) * (1.0 - t) * t)
    + (3.0 * c2 * (1.0 - t) * t * t)
    + (end * t * t * t),
    createBezier = (startPoint: Point, control2: Point, control1: Point, endPoint: Point, startWidth: number, endWidth: number): Bezier => ({
        startPoint, control2, control1, endPoint, startWidth, endWidth,
        get length() {
            const steps = 10;
            let length = 0;
            let px, py;
            for (let i = 0;i <= steps;i+=1) {
                const t = i / steps;
                const cx = point(t, this.startPoint.x, this.control1.x, this.control2.x, this.endPoint.x);
                const cy = point(t, this.startPoint.y, this.control1.y, this.control2.y, this.endPoint.y);
                if (i > 0) {
                    const xdiff = cx - px!;
                    const ydiff = cy - py!;
                    length += Math.sqrt(xdiff * xdiff + ydiff * ydiff);
                }
                px = cx;
                py = cy;
            }
            return length;
        }
    })

export { createBezier }