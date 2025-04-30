# SignaturePad Custom Element

>[note:] Still under some development

## Attributes

- `name`: Equivalent to `name` on `<input>` elements, defaults to `signature-pad`
- `min-width`: Minimum width to draw, default is .5
- `max-width`: Max width to draw, default is 2.5
- `min-distance`: Minimum distancea to travel before drawing a new point on the canvas, default is 5
- `dot-size`: Pixel size of the ink, default is `min-width` + `max-width` / 2
- `canvas-width`: Set the width of the canvas element, default is 500
- `canvas-height`: Set the height of the canvas element, deafult is 200

## States

- `drawing`: A state for changing styles when the user is drawing in the canvas
- `empty`: Whether or not the canvas has been drawn in

### How to use states

```css
signature-pad:state(pointerdown) {
    border: 1px solid rebeccapurple;
}
signature-pad:state(empty) {
    border: 1px solid orangered;
}
```

### Possible additions

- Export to svg (Adding a type attribute that accepts 'png'|'svg')
- More custom states for better styling
- Slots for adding icons or helper text

## Thanks to:

- [The Original jQuery Signature Pad](https://github.com/thread-pond/signature-pad/tree/main) which most of the math comes from