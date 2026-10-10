// What the camera solver needs to know about a car (docs/overhaul.md, step 4): its true bounding box and the
// vertices of its convex hull. Written to be run by Node too (scripts/models/shapes.mjs imports it), so it
// imports only `three` and carries no path aliases or React.
import { Box3, Vector3, type Mesh, type Object3D } from "three";
import { ConvexHull } from "three/addons/math/ConvexHull.js";

/**
 * The hull gives the exact silhouette extent from any camera (the extremes of a convex shape under
 * perspective are hull vertices), where a box overstates it at three-quarter angles and the storyboard's
 * sizes were measured on the silhouette.
 */
export interface CarShape {
  box: Box3;
  hull: Vector3[];
}

/** A shape as stored in content/shapes.json, in metres, rounded to the millimetre. */
export interface ShapeData {
  min: [number, number, number];
  max: [number, number, number];
  hull: [number, number, number][];
}

const SAMPLE = 40_000;
/** Directions whose extreme vertex is always kept, so thin parts (mirrors, an aerial) survive subsampling. */
const EXTREMES = [
  [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
  [1, 1, 0], [1, -1, 0], [-1, 1, 0], [-1, -1, 0], [1, 0, 1], [1, 0, -1], [-1, 0, 1], [-1, 0, -1],
  [0, 1, 1], [0, 1, -1], [0, -1, 1], [0, -1, -1],
].map(([x, y, z]) => new Vector3(x, y, z).normalize());

/** Measures a car from its world-space vertices: the exact box, and the hull of a subsample plus every directional extreme. */
export function shapeOf(vertices: Iterable<Vector3>, total: number): CarShape {
  const stride = Math.max(1, Math.floor(total / SAMPLE));
  const best = EXTREMES.map(() => ({ score: -Infinity, point: new Vector3() }));
  const box = new Box3();
  const points: Vector3[] = [];
  let index = 0;
  for (const v of vertices) {
    box.expandByPoint(v);
    if (index++ % stride === 0) points.push(v.clone());
    for (let d = 0; d < EXTREMES.length; d++) {
      const score = v.dot(EXTREMES[d]);
      if (score > best[d].score) {
        best[d].score = score;
        best[d].point.copy(v);
      }
    }
  }
  points.push(...best.map((b) => b.point));
  const hull = new ConvexHull().setFromPoints(points);
  const unique = new Set<Vector3>();
  for (const face of hull.faces) {
    let edge = face.edge;
    do {
      unique.add(edge.head().point);
      edge = edge.next;
    } while (edge !== face.edge);
  }
  return { box, hull: [...unique] };
}

/** Measures a loaded car as drawn (heading 0, world matrices as they stand). Used by the lab. */
export function measureCar(car: Object3D): CarShape {
  car.updateWorldMatrix(true, true);
  const meshes: Mesh[] = [];
  let total = 0;
  car.traverse((object) => {
    if ((object as Mesh).isMesh) {
      meshes.push(object as Mesh);
      total += (object as Mesh).geometry.getAttribute("position").count;
    }
  });
  function* vertices() {
    const v = new Vector3();
    for (const mesh of meshes) {
      const attribute = mesh.geometry.getAttribute("position");
      for (let i = 0; i < attribute.count; i++) yield v.fromBufferAttribute(attribute, i).applyMatrix4(mesh.matrixWorld);
    }
  }
  return shapeOf(vertices(), total);
}

const mm = (n: number) => Math.round(n * 1000) / 1000;

export function toData({ box, hull }: CarShape): ShapeData {
  return {
    min: [mm(box.min.x), mm(box.min.y), mm(box.min.z)],
    max: [mm(box.max.x), mm(box.max.y), mm(box.max.z)],
    hull: hull.map((p) => [mm(p.x), mm(p.y), mm(p.z)]),
  };
}

export function fromData(data: ShapeData): CarShape {
  return {
    box: new Box3(new Vector3(...data.min), new Vector3(...data.max)),
    hull: data.hull.map(([x, y, z]) => new Vector3(x, y, z)),
  };
}
