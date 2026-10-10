import type { FramePrimitive } from "@/lib/cars";

/**
 * The four Bauhaus frame primitives. Each frame is a box sized in units of the showroom's frame
 * height (H) and standing on one shared floor line, so the row reads as an arcade. `path` draws the
 * opening in a viewBox of `width × height` (scaled by 100); `fit` and `ground` place the car inside
 * it: the share of the view's width the car's turning circle may use, and where the ground line
 * sits, from the top.
 */
export interface FrameShape {
  width: number;
  height: number;
  path: string;
  fit: number;
  ground: number;
}

export const FRAMES: Record<FramePrimitive, FrameShape> = {
  arch: {
    width: 0.74,
    height: 1,
    path: "M0 100V37A37 37 0 0 1 74 37V100Z",
    fit: 1.14,
    ground: 0.83,
  },
  circle: {
    width: 0.92,
    height: 0.92,
    path: "M0 46A46 46 0 0 1 92 46A46 46 0 0 1 0 46Z",
    fit: 1,
    ground: 0.7,
  },
  square: {
    width: 0.84,
    height: 0.84,
    path: "M0 0H84V84H0Z",
    fit: 1.1,
    ground: 0.79,
  },
  "half-disc": {
    width: 1.44,
    height: 0.72,
    path: "M0 72A72 72 0 0 1 144 72Z",
    fit: 0.7,
    ground: 0.86,
  },
};

/** The paper mat around an opening: the box (bled 1 unit) minus the shape, filled even-odd. */
export const matPath = (shape: FrameShape) => {
  const w = shape.width * 100;
  const h = shape.height * 100;
  return `M-1 -1H${w + 1}V${h + 1}H-1Z ${shape.path}`;
};

/** A small glyph of each primitive in a 16×16 box, for the gate and the progress index. */
export const GLYPHS: Record<FramePrimitive, string> = {
  arch: "M3 15V8A5 5 0 0 1 13 8V15Z",
  circle: "M2 8A6 6 0 0 1 14 8A6 6 0 0 1 2 8Z",
  square: "M2.5 2.5H13.5V13.5H2.5Z",
  "half-disc": "M1 12A7 7 0 0 1 15 12Z",
};
