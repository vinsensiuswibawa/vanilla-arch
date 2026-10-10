"use client";

import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, N8AO } from "@react-three/postprocessing";
import { Suspense, useEffect, useMemo, useRef } from "react";
import {
  ACESFilmicToneMapping,
  AgXToneMapping,
  Color,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  PMREMGenerator,
  type Material,
  type Mesh,
  type Object3D,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { BakedShadow } from "@/components/three/BakedShadow";
import { GroundShadow } from "@/components/three/GroundShadow";
import { STUDIO_HDRI, StudioLook } from "@/components/three/StudioLook";
import { applyPaint, isPaint } from "@/lib/materials";

export interface LabOptions {
  slug: string;
  mode: "new" | "old";
  env: string;
  bg: "grey" | "none";
  ao: boolean;
  view: "ref" | "side" | "rear" | "top" | "wheel" | "nose" | "tail";
  still: boolean;
  /** Listing paint colour; replaces the authored paint the way lib/materials.ts does in the showroom. */
  paint?: string;
  /** Metallic or pearl paint (flake under the clear coat); unset guesses from the colour. */
  metallic?: boolean;
  /** "hero" is the shipping desktop file (400k triangles, 2K textures); "budget" the old 110k cap; "raw" the source. */
  lod: "hero" | "budget" | "phone" | "raw";
  /** "baked" renders the shadow once per car (shipping); "live" is a real-time shadow map. */
  shadow: "baked" | "live";
  /** Renders each frame this many times: headroom for slower GPUs shows as fps that holds. */
  stress: number;
  /**
   * "now": the first studio pass (tinted semi-metallic paint, Neutral tone mapping). "solid": solid paint
   * under a sharp clear coat, rubber made matte, ACES. "studio": solid, plus a darkened floor and overhead
   * and side softboxes in the reflections, the way car renders get their shape.
   */
  look: "now" | "solid" | "studio";
  tone: "neutral" | "aces" | "agx";
  /** Showroom triangle checkpoint (public/lab/<slug>.b<N>.glb), overriding lod. */
  checkpoint?: number;
}

const CYCLORAMA = "radial-gradient(120% 90% at 50% 40%, #f2f2f2 0%, #e4e4e4 55%, #d4d4d4 100%)";

/** Camera presets. "ref" is the user's reference: front three-quarter from the car's left, low. */
const VIEWS = {
  ref: { azimuth: 38, height: 0.75, distance: 7.6, fov: 26 },
  side: { azimuth: 90, height: 0.85, distance: 8.6, fov: 26 },
  rear: { azimuth: 145, height: 0.9, distance: 7.8, fov: 26 },
  // High three-quarter: bonnet and roof, where reduced paint shows first.
  top: { azimuth: 55, height: 4.6, distance: 6.4, fov: 26 },
  // Close on the front wheel and arch, where creases from reduction show in reflections.
  wheel: { azimuth: 62, height: 0.75, distance: 2.6, fov: 30, target: [0.75, 0.38, 1.2] },
  // Close on the front bumper, where dents from reduction show in reflections. Rear: the tail lights.
  nose: { azimuth: 20, height: 0.7, distance: 3.2, fov: 30, target: [0, 0.5, 1.9] },
  tail: { azimuth: 160, height: 0.95, distance: 3.2, fov: 30, target: [0, 0.75, -1.9] },
} as const satisfies Record<string, { azimuth: number; height: number; distance: number; fov: number; target?: readonly number[] }>;
const target = (view: LabOptions["view"]) => ("target" in VIEWS[view] ? VIEWS[view].target : [0, 0.62, 0]) as [number, number, number];

/**
 * "old" reproduces the shipping pipeline for comparison: the procedural room for reflections, and paint,
 * glass and rims replaced by flat materials with their textures dropped.
 */
function emulateOldPipeline(scene: Object3D) {
  const flat = {
    paint: new MeshPhysicalMaterial({ color: "#b7babd", metalness: 0.55, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.04 }),
    glass: new MeshPhysicalMaterial({ color: "#0b0d10", roughness: 0.05, transparent: true, opacity: 0.35 }),
    rim: new MeshStandardMaterial({ color: "#c9cacb", metalness: 0.8, roughness: 0.32 }),
  };
  scene.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    const name = (mesh.material as Material).name.toLowerCase();
    if (/paint|cp-/.test(name)) {
      flat.paint.color = new Color((mesh.material as MeshStandardMaterial).color);
      mesh.material = flat.paint;
    } else if (/glass/.test(name)) mesh.material = flat.glass;
    else if (/rim/.test(name)) mesh.material = flat.rim;
  });
}

/**
 * Listing paint (the material repairs are baked in by scripts/models/optimize.mjs). "now" tints a
 * semi-metallic base, so every broad reflection takes the paint's colour (the candy look); the other looks
 * use the shipping paint (lib/materials.ts).
 */
function repaint(scene: Object3D, paint: string, look: LabOptions["look"], metallic?: boolean) {
  if (look !== "now") return applyPaint(scene, { hex: paint, metallic });
  const candy = new MeshPhysicalMaterial({ color: paint, metalness: 0.35, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.03 });
  scene.traverse((object) => {
    const mesh = object as Mesh;
    if (mesh.isMesh && isPaint((mesh.material as Material).name.toLowerCase())) mesh.material = candy;
  });
}

function Car({ slug, mode, paint, metallic, lod, shadow, look, checkpoint }: Pick<LabOptions, "slug" | "mode" | "paint" | "metallic" | "lod" | "shadow" | "look" | "checkpoint">) {
  // The shipping files live in public/models; the lab's comparison files in public/lab (npm run models -- --lab).
  const file = checkpoint ? `/lab/${slug}.b${checkpoint}.glb` : { hero: `/models/${slug}.glb`, budget: `/lab/${slug}.budget.glb`, phone: `/models/${slug}.lod1.glb`, raw: `/lab/${slug}.glb` }[lod];
  const { scene } = useGLTF(file, false, true);
  const car = useMemo(() => {
    const copy = scene.clone(true);
    if (mode === "old") emulateOldPipeline(copy);
    else if (paint) repaint(copy, paint, look, metallic);
    copy.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
    return copy;
  }, [scene, mode, paint, metallic, look]);
  return (
    <>
      <primitive object={car} />
      {mode === "new" && shadow === "baked" && <BakedShadow car={car} />}
    </>
  );
}

/** Takes over rendering to draw each frame `times` times: if fps holds, that much GPU headroom exists. */
function Stress({ times }: { times: number }) {
  useFrame(({ gl, scene, camera }) => {
    for (let i = 0; i < times; i++) gl.render(scene, camera);
  }, 1);
  return null;
}

function RoomLight() {
  const gl = useThree((state) => state.gl);
  const texture = useMemo(() => {
    const pmrem = new PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    return env;
  }, [gl]);
  return <primitive object={texture} attach="environment" />;
}

function Rig({ view }: { view: LabOptions["view"] }) {
  const camera = useThree((state) => state.camera);
  useEffect(() => {
    const { azimuth, height, distance } = VIEWS[view];
    const [x, y, z] = target(view);
    const a = (azimuth * Math.PI) / 180;
    camera.position.set(x + Math.sin(a) * distance, height, z + Math.cos(a) * distance);
    camera.lookAt(x, y, z);
  }, [camera, view]);
  return null;
}

/** Flags the page once the HDRI, the model and the accumulated shadow have settled, for screenshots. */
function Ready() {
  const frames = useRef(0);
  useFrame(() => {
    if (++frames.current === 120) document.documentElement.dataset.labReady = "true";
  });
  return null;
}

function FrameTimer() {
  const samples = useRef<number[]>([]);
  useFrame((_, delta) => {
    samples.current.push(delta);
    if (samples.current.length === 120) {
      const avg = samples.current.reduce((a, b) => a + b, 0) / samples.current.length;
      document.documentElement.dataset.labFps = (1 / avg).toFixed(1);
      samples.current = [];
    }
  });
  return null;
}

export function Lab({ slug, mode, env, bg, ao, view, still, paint, metallic, lod, shadow, stress, look, tone, checkpoint }: LabOptions) {
  const fresh = mode === "new";
  // The shipping HDRI lives in public/hdri; the alternatives stay in the lab.
  const hdri = env === "studio_small_09" ? STUDIO_HDRI : `/lab/hdri/${env}.hdr`;
  return (
    <div className={still ? "h-[630px] w-[1120px]" : "h-dvh w-full"} style={{ background: bg === "grey" ? CYCLORAMA : "transparent" }}>
      <Canvas
        shadows={shadow === "live" ? "variance" : false}
        dpr={still ? 2 : [1, 2]}
        camera={{ fov: VIEWS[view].fov, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: still, toneMapping: { neutral: NeutralToneMapping, aces: ACESFilmicToneMapping, agx: AgXToneMapping }[tone] }}
      >
        <Rig view={view} />
        <Suspense fallback={null}>
          {!fresh ? <RoomLight /> : look === "studio" ? <StudioLook file={hdri} /> : <Environment files={hdri} environmentIntensity={1.5} environmentRotation={[0, Math.PI / 3, 0]} />}
          {!fresh && <directionalLight position={[3, 5, 2]} intensity={1.2} />}
          <Car slug={slug} mode={mode} paint={paint} metallic={metallic} lod={lod} shadow={shadow} look={look} checkpoint={checkpoint} />
          {/* StudioLook brings its own key light. */}
          {fresh && shadow === "baked" && look !== "studio" && <directionalLight position={[2, 9, 3.5]} intensity={0.6} />}
          {fresh && shadow === "live" ? (
            <>
              {/* One soft key light for the cast shadow (variance shadow maps blur its edge), caught by
                  a transparent plane, plus the baked blob for the darkness right under the tyres. */}
              <directionalLight
                castShadow
                position={[2, 9, 3.5]}
                intensity={0.6}
                shadow-mapSize={[2048, 2048]}
                shadow-radius={14}
                shadow-blurSamples={24}
                shadow-bias={-0.0004}
                shadow-camera-left={-5}
                shadow-camera-right={5}
                shadow-camera-top={5}
                shadow-camera-bottom={-5}
                shadow-camera-near={1}
                shadow-camera-far={20}
              />
              <mesh rotation-x={-Math.PI / 2} position-y={0.001} receiveShadow>
                <planeGeometry args={[10, 10]} />
                <shadowMaterial transparent opacity={0.32} />
              </mesh>
              <GroundShadow lengthM={4.9} widthM={2} opacity={0.5} />
            </>
          ) : !fresh ? (
            <GroundShadow lengthM={4.6} widthM={1.9} />
          ) : null}
          {fresh && ao && (
            <EffectComposer multisampling={4}>
              <N8AO aoRadius={0.6} distanceFalloff={0.8} intensity={2.2} quality="high" halfRes={false} />
            </EffectComposer>
          )}
          <Ready />
        </Suspense>
        <FrameTimer />
        {stress > 1 && <Stress times={stress} />}
        {!still && <OrbitControls target={target(view)} makeDefault />}
      </Canvas>
    </div>
  );
}
