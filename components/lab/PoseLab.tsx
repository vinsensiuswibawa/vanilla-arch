"use client";

import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ACESFilmicToneMapping, PerspectiveCamera, Vector3 } from "three";
import { BakedShadow } from "@/components/three/BakedShadow";
import { StudioLook } from "@/components/three/StudioLook";
import { applyState, FOV, headingAt, POSE_IDS, poseAt, poseFor, screenBox, solveAll, stateOf, toScreen, type SolvedPose } from "@/lib/choreography";
import { applyPaint } from "@/lib/materials";
import { measureCar, type CarShape } from "@/lib/shape";

export interface PoseLabOptions {
  slug: string;
  src: string;
  paint: { hex: string; metallic?: boolean };
  /** 0 to 3: P0, P1, P2, P3, and T1 to T3 between them. */
  progress: number;
  /** Stage size in the viewport it stands for; the preview keeps its aspect ratio. */
  width: number;
  height: number;
  /** The turntable's angle when T1 starts, degrees. */
  turntable: number;
  guides: boolean;
  reduced: boolean;
  /** A bare stage at exactly width x height, for screenshots. */
  still: boolean;
}

/** The storyboard frame that shows each pose (docs/storyboard), copied to public/lab/storyboard. */
const FRAMES = [1, 4, 10, 14];
const FIELD = "#f1f1f1";
const rad = (degrees: number) => (degrees * Math.PI) / 180;

/** The car on its baked shadow, turned about the vertical axis by the turntable `heading` (degrees). */
function Car({ src, paint, heading, onShape }: Pick<PoseLabOptions, "src" | "paint"> & { heading: number; onShape: (shape: CarShape) => void }) {
  const { scene } = useGLTF(src, false, true);
  // Measured before it joins the turntable group, so the shape is the car at heading 0 whatever the heading is.
  const { car, shape } = useMemo(() => {
    const copy = scene.clone(true);
    applyPaint(copy, paint);
    return { car: copy, shape: measureCar(copy) };
  }, [scene, paint]);
  useLayoutEffect(() => onShape(shape), [shape, onShape]);
  return (
    <group rotation-y={rad(heading)}>
      <primitive object={car} />
      <BakedShadow car={car} />
    </group>
  );
}

/** Points the camera from the current progress, every frame. */
function Rig({ solved, progress, reduced }: { solved: SolvedPose[] | null; progress: number; reduced: boolean }) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const size = useThree((state) => state.size);
  useFrame(() => {
    if (solved) applyState(camera, stateOf(poseAt(solved, progress, reduced)), size.width, size.height);
  });
  return null;
}

/** Flags the page once the model is measured and a few frames have drawn, for screenshots. */
function Ready({ solved }: { solved: boolean }) {
  const frames = useRef(0);
  useFrame(() => {
    if (solved && ++frames.current === 12) document.documentElement.dataset.poseReady = "true";
  });
  return null;
}

/** What the camera shows at a progress: the reference point and the car's silhouette extent, in stage pixels. */
function measure(solved: SolvedPose[], shape: CarShape, progress: number, turntable: number, reduced: boolean, width: number, height: number, camera: PerspectiveCamera) {
  const pose = poseAt(solved, progress, reduced);
  const heading = headingAt(turntable, progress, reduced);
  applyState(camera, stateOf(pose), width, height);
  return { pose, heading, ref: toScreen(camera, pose.ref, width, height), box: screenBox(camera, shape.hull, heading, width, height) };
}

/**
 * The gate's numbers, in the page so the real model is used: each pose's anchor and extent error, and for each
 * transition whether it is smooth at one stage size and whether its ends meet the poses either side of it. A
 * jump is a step that stands out from the steps around it (`spike`, about 1 when smooth), measured on where
 * the reference lands, the silhouette's four edges and the car's heading; the seam compares the pose just
 * inside each end with the pose itself, in pixels (or degrees).
 */
function sweep(slug: string, shape: CarShape, width: number, height: number, turntable: number) {
  const solved = solveAll(slug, shape, width / height);
  const camera = new PerspectiveCamera();
  const vector = (progress: number, turn: number) => {
    const m = measure(solved, shape, progress, turn, false, width, height, camera);
    return [m.ref.x, m.ref.y, m.box.x0, m.box.y0, m.box.x1, m.box.y1, m.heading];
  };
  const poses = POSE_IDS.map((id, i) => {
    const pose = poseFor(slug, id);
    const m = measure(solved, shape, i, 0, false, width, height, camera);
    const extent = pose.fit.of === "viewportWidth" ? (m.box.x1 - m.box.x0) / width : (m.box.y1 - m.box.y0) / height;
    return { id, anchorErrorPx: Math.hypot(m.ref.x - pose.anchor.x * width, m.ref.y - pose.anchor.y * height), extent, target: pose.fit.share };
  });
  const N = 240;
  const near = 3;
  const transitions = [0, 1, 2].map((i) => {
    const samples = Array.from({ length: N + 1 }, (_, s) => vector(i + s / N, turntable));
    let spike = 0;
    for (let d = 0; d < 7; d++) {
      const steps = samples.slice(1).map((sample, s) => Math.abs(sample[d] - samples[s][d]));
      steps.forEach((step, s) => {
        const around = steps.filter((_, o) => o !== s && Math.abs(o - s) <= near);
        spike = Math.max(spike, step / Math.max(around.reduce((a, b) => a + b, 0) / around.length, 0.02));
      });
    }
    const gap = (a: number, b: number) => Math.max(...vector(a, turntable).map((v, d) => Math.abs(v - vector(b, turntable)[d])));
    return { id: `T${i + 1}`, spike, seam: Math.max(gap(i, i + 1e-6), gap(i + 1, i + 1 - 1e-6)) };
  });
  const { box } = shape;
  return { slug, width, height, box: { size: box.getSize(new Vector3()).toArray(), min: box.min.toArray(), max: box.max.toArray(), hullPoints: shape.hull.length }, poses, transitions };
}

export function PoseLab(options: PoseLabOptions) {
  const { slug, src, paint, width, height, guides, still } = options;
  const [progress, setProgress] = useState(options.progress);
  const [turntable, setTurntable] = useState(options.turntable);
  const [reduced, setReduced] = useState(options.reduced);
  const [playing, setPlaying] = useState(false);
  const [shape, setShape] = useState<CarShape | null>(null);
  const [scale, setScale] = useState(still ? 1 : 0.5);
  const onShape = useCallback((measured: CarShape) => setShape(measured), []);

  // The preview shrinks to fit two stages side by side; a still is exactly width x height.
  useEffect(() => {
    if (still) return;
    const fit = () => setScale(Math.min(1, (window.innerWidth - 48) / 2 / width, (window.innerHeight - 150) / height));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [still, width, height]);

  // Play: three seconds per transition, then back to the start.
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      setProgress((p) => (p + (now - last) / 3000) % 3.0001);
      last = now;
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const solved = useMemo(() => (shape ? solveAll(slug, shape, width / height) : null), [slug, shape, width, height]);
  useEffect(() => {
    if (!shape) return;
    (window as unknown as { __poseLab: unknown }).__poseLab = { sweep: (w: number, h: number, turn: number) => sweep(slug, shape, w, h, turn) };
  }, [slug, shape]);

  const overlay = useMemo(() => (solved && shape && guides ? measure(solved, shape, progress, turntable, reduced, width, height, new PerspectiveCamera(FOV)) : null), [solved, shape, guides, progress, turntable, reduced, width, height]);

  const stage = (
    <div style={{ width: width * scale, height: height * scale, background: FIELD, position: "relative" }} data-pose-stage>
      <Canvas dpr={still ? 1 : [1, 2]} camera={{ fov: FOV, near: 0.1, far: 100 }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: still, toneMapping: ACESFilmicToneMapping }}>
        <Suspense fallback={null}>
          <StudioLook />
          <Car src={src} paint={paint} heading={headingAt(turntable, progress, reduced)} onShape={onShape} />
          <Ready solved={!!solved} />
        </Suspense>
        <Rig solved={solved} progress={progress} reduced={reduced} />
      </Canvas>
      {overlay && (
        <svg viewBox={`0 0 ${width} ${height}`} className="pointer-events-none absolute inset-0 size-full" fill="none" stroke="#f0f" strokeWidth={2}>
          <path d={`M${overlay.ref.x - 14} ${overlay.ref.y}h28M${overlay.ref.x} ${overlay.ref.y - 14}v28`} />
          <rect x={overlay.box.x0} y={overlay.box.y0} width={overlay.box.x1 - overlay.box.x0} height={overlay.box.y1 - overlay.box.y0} strokeDasharray="8 6" />
        </svg>
      )}
    </div>
  );
  if (still) return stage;

  const nearest = Math.round(progress);
  return (
    <div className="min-h-dvh bg-white p-4 pt-24">
      <div className="flex gap-4">
        {stage}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/lab/storyboard/${FRAMES[nearest]}.jpg`} alt={`Storyboard frame ${FRAMES[nearest]}`} style={{ width: width * scale, height: height * scale }} className="object-cover" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[12px]">
        <button type="button" onClick={() => setPlaying((p) => !p)} className="border border-ink/40 px-3 py-1">{playing ? "pause" : "play T1 to T3"}</button>
        <label className="flex items-center gap-2">
          <span>{["P0", "T1", "P1", "T2", "P2", "T3", "P3"][Math.round(progress * 2)]} · {progress.toFixed(2)}</span>
          <input type="range" min={0} max={3} step={0.005} value={progress} onChange={(e) => { setPlaying(false); setProgress(Number(e.target.value)); }} className="w-[420px]" />
        </label>
        <label className="flex items-center gap-2">
          turntable at T1 start
          <input type="number" min={-180} max={360} value={turntable} onChange={(e) => setTurntable(Number(e.target.value))} className="w-16 border border-ink/40 px-1" />°
        </label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={reduced} onChange={(e) => setReduced(e.target.checked)} />reduced motion (cut at midpoint)</label>
        {shape && <span>box {(shape.box.max.x - shape.box.min.x).toFixed(2)} × {(shape.box.max.y - shape.box.min.y).toFixed(2)} × {(shape.box.max.z - shape.box.min.z).toFixed(2)} m</span>}
      </div>
    </div>
  );
}
