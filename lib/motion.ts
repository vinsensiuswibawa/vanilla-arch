// The PRD's motion spec as code. Durations are in ms; JS easings mirror the CSS tokens in
// app/globals.css so canvas-side and Lenis-driven motion share one set of curves.

/** cubic-bezier(x1, y1, x2, y2) as a function of progress, solved by Newton's method with a bisection fallback. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  const solve = (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const error = sampleX(t) - x;
      if (Math.abs(error) < 1e-6) return t;
      const slope = slopeX(t);
      if (Math.abs(slope) < 1e-6) break;
      t -= error / slope;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    while (lo < hi) {
      const value = sampleX(t);
      if (Math.abs(value - x) < 1e-6) return t;
      if (x > value) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
      if (hi - lo < 1e-6) break;
    }
    return t;
  };

  return (progress: number) => (progress <= 0 ? 0 : progress >= 1 ? 1 : sampleY(solve(progress)));
}

export const easeOut = cubicBezier(0.23, 1, 0.32, 1);
export const easeInOut = cubicBezier(0.77, 0, 0.175, 1);

export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

export const MOTION = {
  gateEnter: 1200,
  gateEnterReduced: 250,
  lenisLerp: 0.09,
  snapIdle: 150,
  snapMin: 500,
  snapMax: 700,
  /** Seconds per turntable revolution, and the speed ramp's length. */
  turntablePeriod: 60,
  turntableRamp: 1.2,
  hoverTurntable: 1.5,
  hoverIn: 240,
  hoverOut: 320,
  cursorLerp: 0.18,
  indexOpen: 320,
  indexClose: 220,
} as const;

/** The veil from the PRD: 0 when a frame is centred, 1 when its centre reaches the viewport edge. */
export const veilFor = (distance: number) => smoothstep(0.18, 0.85, distance);

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const hasFinePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
