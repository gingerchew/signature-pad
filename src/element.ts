import type { Point, PointCoords, PointGroup } from './types';
import { createPoint, distanceTo, velocityFrom } from './point';
import { Bezier, fromPoints } from './bezier';

const stateToken = 'pointerdown';
const emptyToken = 'empty';
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

    #getNumAttr(name:string, fallback:number) {
        return this.hasAttribute(name) ? parseInt(this.getAttribute(name)!, 10) : fallback;
    }

    get #minWidth() {
        return this.#getNumAttr('min-width', 0.5);
    }
    get #maxWidth() {
        return this.#getNumAttr('max-width', 2.5);
    }
    get #minDistance() {
        return this.#getNumAttr('min-distance', 5);
    }
    get #dotSize() {
        return this.#getNumAttr('dot-size', (this.#minWidth + this.#maxWidth) / 2);
    }
    get #canvasWidth() {
        return this.#getNumAttr('canvas-width', 500);
    }
    get #canvasHeight() {
        return this.#getNumAttr('canvas-height', 200);
    }

    constructor() {
        super();
        
        this.attachShadow({ mode: 'open' }).innerHTML = `<canvas width="${this.#canvasWidth}" height="${this.#canvasHeight}" style="touch-action: none;"></canvas>`;
        
        if (!this.hasAttribute('name')) this.setAttribute('name', this.localName);
        
        this.#canvas = this.shadowRoot!.querySelector('canvas')!;
        this.#canvas.style.touchAction = 'none';
        this.#ctx = this.#canvas.getContext('2d')!;
    }

    #reset() {
        this.#lastPoints = [];
        this.#lastVelocity = 0;
        this.#lastWidth = (this.#minWidth + this.#maxWidth) / 2;
        this.#ctx.fillStyle = this.#penColor;
        this.#internals.states.add(emptyToken);
    }
    
    #createPoint(x:number, y:number, canvas: HTMLCanvasElement) {
        const rect = canvas.getBoundingClientRect();
        return createPoint(x - rect.left, y - rect.top);
    }

    #clear() {
        const width = this.#canvasWidth;
        const height = this.#canvasHeight;
        this.#ctx.fillStyle = this.#backgroundColor;
        this.#ctx.clearRect(0, 0, width, height);
        this.#ctx.fillRect(0, 0, width, height);
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
        const type = 'command' in e ? e.command : e.type;
        switch(type) {
            case '--clear':
                this.#clear();
                break;
            case '--reset':
                this.#reset();
                break;
            case 'pointerdown':
                this.#internals.states.add(stateToken);
                this.#strokeStart();
                break;
            case 'pointermove':
                if (this.#internals.states.has(stateToken)) this.#strokeUpdate(e as PointerEvent);
                break;
            case 'pointerup':
                this.#internals.states.delete(stateToken)
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
    
    #strokeUpdate({ clientX: x, clientY: y }: PointerEvent) {
        const point = this.#createPoint(x, y, this.#canvas);
        const lastPointGroup = this.#data.at(-1)!;
        
        const lastPoints = lastPointGroup.points;
        const lastPoint = lastPoints.length > 0 && lastPoints.at(-1);
        
        const isLastPointTooClose = lastPoint ? distanceTo(lastPoint, point) <= this.#minDistance : false;
        const color = lastPointGroup.color;
        if (!lastPoint || !(lastPoint && isLastPointTooClose)) {
            const curve = this.#addPoint(point);
            
            if (!lastPoint) {
                this.#drawDot({ color, point });
            } else if (curve) {
                this.#drawCurve({ color, curve });
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
    
    #drawCurve({ color, curve }: { color: string, curve: Bezier}) {
        const widthDelta = curve.endWidth - curve.startWidth,
            drawSteps = Math.floor(curve.length) * 2;
            
        this.#ctx.beginPath();
        this.#ctx.fillStyle = color;
        for (let i = 0;i < drawSteps;i+=1) {
            const t = i / drawSteps;
            const tt = t * t;
            const ttt = tt * t;
            const u = 1 - t;
            const uu = u * u;
            const uuu = uu * u;
            let x = uuu * curve.startPoint.x;
            x += 3 * uu * t * curve.control1.x;
            x += 3 * u * tt * curve.control2.x;
            x += ttt * curve.endPoint.x;
            let y = uuu * curve.startPoint.y;
            y += 3 * uu * t * curve.control1.y;
            y += 3 * u * tt * curve.control2.y;
            y += ttt * curve.endPoint.y;
            
            this.#drawCurveSegment({x, y}, Math.min(curve.startWidth + ttt * widthDelta, this.#maxWidth));
        }
        this.#ctx.closePath();
        this.#ctx.fill();
    }
    
    #drawDot({ color, point }: { color: string, point: Point }) {
        this.#ctx.beginPath();
        this.#drawCurveSegment(point, this.#dotSize);
        this.#ctx.closePath();
        this.#ctx.fillStyle = color;
        this.#ctx.fill();
    }
    
    #drawCurveSegment({ x, y }: PointCoords, width: number) {
        this.#ctx.moveTo(x, y);
        this.#ctx.arc(x, y, width, 0, 2 * Math.PI, false);
    }
    
    #addPoint(point:Point) {
        this.#lastPoints.push(point);
        
        if (this.#lastPoints.length > 2) {
            if (this.#lastPoints.length === 3) {
                this.#lastPoints.unshift(this.#lastPoints[0]);
            }
            const widths = this.#calculateCurveWidths(this.#lastPoints[1], this.#lastPoints[2]);
            
            this.#lastPoints.shift();
            return fromPoints(this.#lastPoints, widths);
        }
        return null;
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