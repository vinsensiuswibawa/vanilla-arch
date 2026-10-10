// The detail page's camera choreography (docs/overhaul.md, step 4): four shared poses, one framing solver,
// and the interpolation between them. Math on a car's measured shape; no React, no scene. The car stays
// at the origin (nose +Z, on the ground, as the pipeline normalises it) and the camera moves around it.
import { PerspectiveCamera, Vector3, type Box3 } from "three";
import { travelBezier } from "@/lib/detail-motion";
import { cubicBezier } from "@/lib/motion";
import type { CarShape } from "@/lib/shape";

/** The vertical field of view, fixed on every pose so perspective never changes between them. */
export const FOV = 24;

export type PoseId = "P0" | "P1" | "P2" | "P3";
export const POSE_IDS: readonly PoseId[] = ["P0", "P1", "P2", "P3"];

/** What the anchor places on screen: the car's centre, the ground under its centre, or the ground under its front bumper. */
export type PoseRef = "center" | "ground" | "nose";

export interface CarPose {
  /** Degrees around the car, 0 = looking at the nose, 90 = from the car's left (nose points left), 270 = from its right (nose points right). */
  azimuth: number;
  /** Degrees above the ground plane; 88 is top-down (never 90, to keep "up" defined). */
  elevation: number;
  /** Degrees the image is turned clockwise on screen (the angled roof view, whose nose leans left in frame 4, is negative). */
  roll: number;
  /** The car's projected bounding box along the screen axis `of`, as a share of the viewport. `dimension` says which car dimension dominates, for the reader. */
  fit: { dimension: "length" | "width" | "height"; share: number; of: "viewportWidth" | "viewportHeight" };
  /** Where `ref` lands, as a share of the viewport (0, 0 = top left). */
  anchor: { x: number; y: number };
  ref: PoseRef;
}

/**
 * Measured from storyboard frames 1, 4, 10 and 14 at 1440 x 960 (README, "The camera, frame by frame"). The
 * user approved them on 2026-10-08 with P0 zoomed past the frame, then (2026-10-09) at 10% (0.58 x 1.1) and a
 * little right (anchor 0.50) so the nose clears the hero's text column, then zoomed back out 5% the same day
 * (0.638 x 0.95) once the hero had real content; P1 to P3 are accepted for now and get refined later
 * (docs/overhaul.md, "6c status").
 */
export const POSES: Record<PoseId, CarPose> = {
  P0: { azimuth: 55, elevation: 5, roll: 0, fit: { dimension: "length", share: 0.606, of: "viewportWidth" }, anchor: { x: 0.5, y: 0.78 }, ref: "ground" },
  P1: { azimuth: 180, elevation: 88, roll: -12, fit: { dimension: "length", share: 0.78, of: "viewportHeight" }, anchor: { x: 0.23, y: 0.52 }, ref: "center" },
  P2: { azimuth: 270, elevation: 3, roll: 0, fit: { dimension: "length", share: 0.67, of: "viewportWidth" }, anchor: { x: 0.5, y: 0.68 }, ref: "nose" },
  P3: { azimuth: 0, elevation: 4, roll: 0, fit: { dimension: "width", share: 0.42, of: "viewportWidth" }, anchor: { x: 0.5, y: 0.72 }, ref: "ground" },
};

type PoseOverride = Partial<Omit<CarPose, "fit" | "anchor">> & { fit?: Partial<CarPose["fit"]>; anchor?: Partial<CarPose["anchor"]> };

/** Per-car tweaks, used only where a car looks wrong in the lab (an MPV-tall roofline, a long wagon tail). */
export const OVERRIDES: Partial<Record<string, Partial<Record<PoseId, PoseOverride>>>> = {};

export function poseFor(slug: string, id: PoseId): CarPose {
  const base = POSES[id];
  const o = OVERRIDES[slug]?.[id];
  return o ? { ...base, ...o, fit: { ...base.fit, ...o.fit }, anchor: { ...base.anchor, ...o.anchor } } : base;
}

const rad = (degrees: number) => (degrees * Math.PI) / 180;
const UP = new Vector3(0, 1, 0);

function direction(azimuth: number, elevation: number, into = new Vector3()) {
  const a = rad(azimuth);
  const e = rad(elevation);
  return into.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
}

/** The reference point as a world position. x and z are 0, not the box centre, so the turntable (about the origin) can't move it. */
export function refPoint(ref: PoseRef, box: Box3, into = new Vector3()) {
  if (ref === "center") return into.set(0, (box.min.y + box.max.y) / 2, 0);
  if (ref === "ground") return into.set(0, box.min.y, 0);
  return into.set(0, box.min.y, box.max.z);
}

/** A pose reduced to what the camera needs, solved for one car and one aspect ratio. */
export interface SolvedPose {
  azimuth: number;
  elevation: number;
  roll: number;
  /** Camera distance from `ref`, metres. */
  distance: number;
  ref: Vector3;
  anchor: { x: number; y: number };
}

const probe = new PerspectiveCamera(FOV, 1, 0.1, 1000);
const corner = new Vector3();

/** Points the probe camera the way the page's camera will be pointed (before any view offset). */
function aim(camera: PerspectiveCamera, ref: Vector3, azimuth: number, elevation: number, roll: number, distance: number) {
  camera.position.copy(direction(azimuth, elevation)).multiplyScalar(distance).add(ref);
  camera.up.set(0, 1, 0);
  camera.lookAt(ref);
  camera.rotateZ(rad(roll));
  camera.updateMatrixWorld(true);
}

/** The car's silhouette extent as a share of the viewport along `of`, from the probe camera as aimed. */
function extent(camera: PerspectiveCamera, hull: readonly Vector3[], of: CarPose["fit"]["of"]) {
  camera.updateProjectionMatrix();
  let lo = Infinity;
  let hi = -Infinity;
  for (const point of hull) {
    corner.copy(point).project(camera);
    const v = of === "viewportWidth" ? corner.x : corner.y;
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
  return (hi - lo) / 2;
}

/**
 * Size is set by framing, not by distance: bisect (on a log scale) for the camera distance at which the
 * car's projected silhouette takes the pose's share of the viewport. The shape is the loaded model's, so a
 * 3.7 m car and a 4.9 m one fill the frame the same way.
 */
export function solvePose(pose: CarPose, shape: CarShape, aspect: number): SolvedPose {
  const ref = refPoint(pose.ref, shape.box);
  const camera = probe;
  camera.aspect = aspect;
  // Nearest the camera may sit: every hull vertex stays in front of it.
  const reach = Math.max(...shape.hull.map((point) => point.distanceTo(ref)));
  let near = Math.log(reach * 1.02);
  let far = Math.log(reach * 400);
  for (let i = 0; i < 48; i++) {
    const mid = (near + far) / 2;
    aim(camera, ref, pose.azimuth, pose.elevation, pose.roll, Math.exp(mid));
    if (extent(camera, shape.hull, pose.fit.of) > pose.fit.share) near = mid;
    else far = mid;
  }
  return { azimuth: pose.azimuth, elevation: pose.elevation, roll: pose.roll, distance: Math.exp((near + far) / 2), ref, anchor: { ...pose.anchor } };
}

export function solveAll(slug: string, shape: CarShape, aspect: number): SolvedPose[] {
  return POSE_IDS.map((id) => solvePose(poseFor(slug, id), shape, aspect));
}

/** What to do to the camera: position, aim, roll, and the view offset that places the reference on screen. */
export interface CameraState {
  position: Vector3;
  target: Vector3;
  roll: number;
  anchor: { x: number; y: number };
}

export function stateOf(pose: SolvedPose): CameraState {
  return { position: direction(pose.azimuth, pose.elevation).multiplyScalar(pose.distance).add(pose.ref), target: pose.ref.clone(), roll: pose.roll, anchor: { ...pose.anchor } };
}

const travel = cubicBezier(...travelBezier);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** Signed shortest arc from `a` to `b`, in degrees, in (-180, 180]. */
export const arc = (a: number, b: number) => ((((b - a) % 360) + 540) % 360) - 180;

/** The raw mix between two solved poses at `k` (0 to 1, already eased by the caller): azimuth by the
 * shortest arc, elevation, roll, anchor and the reference point linearly, distance on a log scale (so a
 * zoom feels even). Shared by `between` (the scroll-tied transitions, eased with `travel`) and the carousel
 * hand-off entry (eased with `settle`), which needs the same math at a different curve. */
export function mixPose(from: SolvedPose, to: SolvedPose, k: number): SolvedPose {
  return {
    azimuth: from.azimuth + arc(from.azimuth, to.azimuth) * k,
    elevation: mix(from.elevation, to.elevation, k),
    roll: mix(from.roll, to.roll, k),
    distance: Math.exp(mix(Math.log(from.distance), Math.log(to.distance), k)),
    ref: from.ref.clone().lerp(to.ref, k),
    anchor: { x: mix(from.anchor.x, to.anchor.x, k), y: mix(from.anchor.y, to.anchor.y, k) },
  };
}

/**
 * One transition: azimuth by the shortest arc, elevation, roll, anchor and the reference point linearly, the
 * solved distance on a log scale (so a zoom feels even), all eased with `travel`. With reduced motion the
 * pose cuts at the midpoint instead of travelling (step 2).
 */
export function between(from: SolvedPose, to: SolvedPose, t: number, reduced = false): SolvedPose {
  const k = reduced ? (t < 0.5 ? 0 : 1) : travel(Math.min(1, Math.max(0, t)));
  return mixPose(from, to, k);
}

/** The pose at a point along P0 to P3: 0 is P0, 1 is P1, 2 is P2, 3 is P3; each whole number holds the pose. */
export function poseAt(solved: readonly SolvedPose[], progress: number, reduced = false): SolvedPose {
  const p = Math.min(3, Math.max(0, progress));
  const i = Math.min(2, Math.floor(p));
  return between(solved[i], solved[i + 1], p - i, reduced);
}

/**
 * The car's turntable angle (degrees) while the camera travels. The turntable stops when T1 starts; across T1
 * it eases back to 0 by the shortest arc, so the roof view is reached "from whatever position the turntable is
 * in". Elsewhere the car holds still.
 */
export function headingAt(turntable: number, progress: number, reduced = false) {
  const t = Math.min(1, Math.max(0, progress));
  const k = reduced ? (t < 0.5 ? 0 : 1) : travel(t);
  return progress >= 1 ? 0 : turntable + arc(turntable, 0) * k;
}

/** Applies a state to a three camera: FOV, aim, roll, and the view offset that lands the reference at `anchor`. */
export function applyState(camera: PerspectiveCamera, state: CameraState, width: number, height: number) {
  camera.fov = FOV;
  camera.aspect = width / height;
  camera.position.copy(state.position);
  camera.up.set(0, 1, 0);
  camera.lookAt(state.target);
  camera.rotateZ(rad(state.roll));
  // Without an offset the reference sits at the screen centre; shifting the window moves it to the anchor.
  camera.setViewOffset(width, height, (0.5 - state.anchor.x) * width, (0.5 - state.anchor.y) * height, width, height);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
}

/** The car's silhouette extent in pixels from the top left, turned by the turntable `heading` (degrees), through a camera that has had `applyState`. */
export function screenBox(camera: PerspectiveCamera, hull: readonly Vector3[], heading: number, width: number, height: number) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const point of hull) {
    corner.copy(point).applyAxisAngle(UP, rad(heading)).project(camera);
    const x = ((corner.x + 1) / 2) * width;
    const y = ((1 - corner.y) / 2) * height;
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return { x0, y0, x1, y1 };
}

/** Where a world point lands on screen, in pixels from the top left, through a camera that has had `applyState`. */
export function toScreen(camera: PerspectiveCamera, point: Vector3, width: number, height: number) {
  const v = point.clone().project(camera);
  return { x: ((v.x + 1) / 2) * width, y: ((1 - v.y) / 2) * height };
}
