import type { Width, Point } from "./types";
import { createPoint } from "./point";

function calculateControlPoints(s1:Point, s2:Point, s3:Point) {
    const dx1 = s1.x - s2.x,
        dy1 = s1.y - s2.y,
        dx2 = s2.x - s3.x,
        dy2 = s2.y - s3.y,
        m1 = { x: (s1.x + s2.x) / 2.0, y: (s1.y + s2.y) / 2.0 },
        m2 = { x: (s2.x + s3.x) / 2.0, y: (s2.y + s3.y) / 2.0 },
        l1 = Math.sqrt(dx1 * dx1 + dy1 * dy1),
        l2 = Math.sqrt(dx2 * dx2 + dy2 * dy2),
        dxm = m1.x - m2.x,
        dym = m1.y - m2.y,
        k = l2 / (l1 + l2),
        cm = { x: m2.x + dxm * k, y: m2.y + dym * k },
        tx = s2.x - cm.x,
        ty = s2.y - cm.y;
    return {
        c1: createPoint(m1.x + tx, m1.y + ty),
        c2: createPoint(m2.x + tx, m2.y + ty)
    }
}

/* Something to do with calculating the bez curve, very magical */
const point = (t:number, start:number, c1:number, c2:number, end:number) => (start * (1.0 - t) * (1.0 - t) * (1.0 - t))
    + (3.0 * c1 * (1.0 - t) * (1.0 - t) * t)
    + (3.0 * c2 * (1.0 - t) * t * t)
    + (end * t * t * t);

export const fromPoints = (points: Point[], widths: Width) => new Bezier(
    points[1], 
    calculateControlPoints(points[0], points[1], points[2]).c2, 
    calculateControlPoints(points[1], points[2], points[3]).c1,
    points[2],
    widths.start,
    widths.end
)

export class Bezier {
    constructor(
        public startPoint: Point, 
        public control2: Point,
        public control1: Point, 
        public endPoint: Point, 
        public startWidth: number,
        public endWidth: number) {}
    
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
}