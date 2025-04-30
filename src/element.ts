import type { Bezier, Point, PointGroup, Width } from './types';
import { createPoint, distanceTo, velocityFrom } from './point';
import { createBezier } from './bezier';

const pointerDownToken = 'pointerdown', emptyToken = 'empty',
    calculateControlPoints = (s1:Point, s2:Point, s3:Point) =>{
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
    },
    bezierFromPoints = ([zero,one,two,three]: Point[], width: Width) => createBezier(
        one, 
        calculateControlPoints(zero, one, two).c2, 
        calculateControlPoints(one, two, three).c1,
        two,
        width.start,
        width.end
    ),
    getNumAttr = (instance: SignaturePad, name: string, fallback: number) => instance.hasAttribute(name) ? parseFloat(instance.getAttribute(name)!) : fallback;

export class SignaturePad extends HTMLElement {
    #canvas: HTMLCanvasElement;
    #ctx: CanvasRenderingContext2D;

    static formAssociated = true;

    #as = new AbortController();
    #internals = this.attachInternals();
    #penColor = '#000';
    #backgroundColor = '#fff';
    #data: PointGroup[] = [];
    #velocityFilterWeight = 0.7;
    #lastPoints: Point[] = [];
    #lastVelocity = 0;
    #lastWidth = (this.#minWidth + this.#maxWidth) / 2;

    get #minWidth() {
        return getNumAttr(this, 'min-width', 0.5);
    }
    get #maxWidth() {
        return getNumAttr(this, 'max-width', 2.5);
    }
    get #minDistance() {
        return getNumAttr(this, 'min-distance', 5);
    }
    get #dotSize() {
        return getNumAttr(this, 'dot-size', (this.#minWidth + this.#maxWidth) / 2);
    }
    get #canvasWidth() {
        return getNumAttr(this, 'canvas-width', 500);
    }
    get #canvasHeight() {
        return getNumAttr(this, 'canvas-height', 200);
    }

    constructor() {
        super();
        
        this.attachShadow({ mode: 'open' }).innerHTML = `<canvas width="${this.#canvasWidth}" height="${this.#canvasHeight}" style="touch-action: none;"></canvas>`;
        
        if (!this.hasAttribute('name')) this.setAttribute('name', this.localName);
        
        this.#canvas = this.shadowRoot!.querySelector('canvas')!;
        this.#ctx = this.#canvas.getContext('2d')!;
    }

    #reset() {
        this.#lastPoints = [];
        this.#lastVelocity = 0;
        this.#lastWidth = (this.#minWidth + this.#maxWidth) / 2;
        this.#ctx.fillStyle = this.#penColor;
        this.#internals.states.add(emptyToken);
        this.#internals.setFormValue('');
    }
    
    #createPoint(x:number, y:number, canvas: HTMLCanvasElement) {
        const rect = canvas.getBoundingClientRect();
        return createPoint(x - rect.left, y - rect.top);
    }

    #clear() {
        this.#ctx.fillStyle = this.#backgroundColor;
        this.#ctx.clearRect(0, 0, this.#canvasWidth, this.#canvasHeight);
        this.#ctx.fillRect(0, 0, this.#canvasWidth, this.#canvasHeight);
        this.#data = [];
        this.#reset();
    }

    #toDataURL(type = 'image/png', encoderOptions?:number) {
        switch(type) {
            case 'image/png':
                return this.#canvas.toDataURL(type, encoderOptions);
            default:
                import.meta.env.DEV && console.warn(`Generating an image of type ${type} is not supported`);
        }
    }
    
    handleEvent(e: CommandEvent|PointerEvent) {
        switch('command' in e ? e.command : e.type) {
            case '--clear':
                this.#clear();
                break;
            case '--reset':
                this.#reset();
                break;
            case 'pointerdown':
                this.#internals.states.add(pointerDownToken);
                this.#strokeStart();
                break;
            case 'pointermove':
                if (this.#internals.states.has(pointerDownToken)) this.#strokeUpdate(e as PointerEvent);
                break;
            case 'pointerup':
                this.#internals.states.delete(pointerDownToken)
                this.#strokeEnd(e as PointerEvent);
                break;
            default:
                import.meta.env.DEV && console.log(`@${this.constructor.name}::Missing handler for ${e.type} events`);
                break;
        }
    }
    
    #strokeStart() {
        this.#data.push({
            color: this.#penColor,
            points: [],
        });
        this.#reset()
    }
    
    #strokeUpdate(e: PointerEvent) {
        const point = this.#createPoint(e.clientX, e.clientY, this.#canvas);
        const lastPointGroup = this.#data.at(-1)!;
        
        const lastPoints = lastPointGroup.points;
        const lastPoint = lastPoints.length > 0 && lastPoints.at(-1);
        
        const isLastPointTooClose = lastPoint ? distanceTo(lastPoint, point) <= this.#minDistance : false;
        const color = lastPointGroup.color;
        if (!lastPoint || !(lastPoint && isLastPointTooClose)) {
            const curve = this.#addPoint(point);
            
            if (!lastPoint) {
                this.#drawDot(color, point);
            } else if (curve) {
                this.#drawCurve(color, curve);
            }
            lastPoints.push(point)
        }
    }
    
    #strokeEnd(e: PointerEvent) {
        this.#strokeUpdate(e);
        this.#internals.setFormValue(this.#toDataURL()!);
        this.#internals.states.delete(emptyToken);
    }
    
    #strokeWidth = (velocity: number) => Math.max(this.#maxWidth / (velocity + 1), this.#minWidth);
    
    #drawCurve(
        color: string, 
        {
            control1,
            control2,
            startPoint,
            endPoint,
            startWidth,
            endWidth,
            length
        }: Bezier) {
        const widthDelta = endWidth - startWidth,
            drawSteps = Math.floor(length) * 2;
            
        this.#ctx.beginPath();
        this.#ctx.fillStyle = color;
        for (let i = 0;i < drawSteps;i+=1) {
            const t = i / drawSteps,
                tt = t * t,
                ttt = tt * t,
                u = 1 - t,
                uu = u * u,
                uuu = uu * u,
                x = uuu * startPoint.x + 3 * uu * t * control1.x + 3 * u * tt * control2.x + ttt * endPoint.x,
                y = uuu * startPoint.y + 3 * uu * t * control1.y + 3 * u * tt * control2.y + ttt * endPoint.y;
            /*
            The above long lines of code for x and y was what you see below. Commenting out for preservation
            x += 3 * uu * t * curve.control1.x;
            x += 3 * u * tt * curve.control2.x;
            x += ttt * curve.endPoint.x;
            y += 3 * uu * t * curve.control1.y;
            y += 3 * u * tt * curve.control2.y;
            y += ttt * curve.endPoint.y;
            */
            
            this.#drawCurveSegment(x, y, Math.min(startWidth + ttt * widthDelta, this.#maxWidth));
        }
        this.#ctx.closePath();
        this.#ctx.fill();
    }
    
    #drawDot(color: string, point: Point) {
        this.#ctx.beginPath();
        this.#drawCurveSegment(point.x, point.y, this.#dotSize);
        this.#ctx.closePath();
        this.#ctx.fillStyle = color;
        this.#ctx.fill();
    }
    
    #drawCurveSegment(x:number, y:number, width: number) {
        this.#ctx.moveTo(x, y);
        this.#ctx.arc(x, y, width, 0, 2 * Math.PI, false);
    }
    
    #addPoint(point:Point) {
        this.#lastPoints.push(point);
        
        if (this.#lastPoints.length < 3) return;
        
        if (this.#lastPoints.length === 3) {
            this.#lastPoints.unshift(this.#lastPoints[0]);
        }
        const widths = this.#calculateCurveWidths(this.#lastPoints[1], this.#lastPoints[2]);
        
        this.#lastPoints.shift();
        return bezierFromPoints(this.#lastPoints, widths);
    }
    
    #calculateCurveWidths(start:Point, end: Point) {
        const velocity = this.#velocityFilterWeight * velocityFrom(start, end) + (1 - this.#velocityFilterWeight) * this.#lastVelocity;
        const widths = {
            end: this.#strokeWidth(velocity),
            start: this.#lastWidth
        };
        
        this.#lastVelocity = velocity;
        this.#lastWidth = widths.end;
        return widths;
    }
    
    connectedCallback() {
        const opts = { capture: true, signal: this.#as.signal };
        this.addEventListener('pointerdown', this, opts);
        this.addEventListener('pointermove', this, opts);
        this.addEventListener('pointerup', this, opts);
        this.addEventListener('command', this, opts);
        this.style.maxWidth = 'fit-content';
    }

    disconnectedCallback() {
        this.#as.abort();
    }
}