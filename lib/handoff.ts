// The hand-off from the carousel into the detail page (docs/overhaul.md, step 4, "Entry from the carousel").
// CarScene already knows the exact camera the visitor was looking through (azimuth 40, elevation 9, a
// distance solved from the car's bounding-box diagonal and its frame's shape); this reproduces that camera
// as a SolvedPose, the same shape lib/choreography.ts's `stateOf`/`applyState` already consume, so the
// detail page can interpolate from it to P0 without a visible jump on the first frame.
import { Vector3 } from "three";
import type { CarWithAssets } from "@/lib/cars";
import { FOV, type SolvedPose } from "@/lib/choreography";
import type { FrameShape } from "@/lib/frames";

const AZIMUTH = 40;
const ELEVATION = 9;
const rad = (degrees: number) => (degrees * Math.PI) / 180;

export interface CarHandoff {
  slug: string;
  /** The camera the carousel was showing this car through, as a solved pose. */
  pose: SolvedPose;
  /** The car's own turntable heading at that moment, in degrees. */
  turntable: number;
  /** The frame's on-screen rectangle, read at hand-off time. */
  rect: DOMRect;
}

/** CarScene's own camera math, restated to produce a SolvedPose instead of a Vector3 eye. */
export function carouselPose(car: CarWithAssets, shape: FrameShape): SolvedPose {
  const length = car.spec.lengthMm / 1000;
  const width = car.spec.widthMm / 1000;
  const aspect = shape.width / shape.height;
  const tanV = Math.tan(rad(FOV / 2));
  const diagonal = Math.hypot(length, width);
  const distance = diagonal / (2 * shape.fit * tanV * aspect);
  const lift = (2 * shape.ground - 1) * distance * tanV;
  return {
    azimuth: AZIMUTH,
    elevation: ELEVATION,
    roll: 0,
    distance,
    ref: new Vector3(0, lift, 0),
    anchor: { x: 0.5, y: 0.5 },
  };
}
