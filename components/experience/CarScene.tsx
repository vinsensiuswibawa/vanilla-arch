"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Group, PerspectiveCamera as Camera } from "three";
import { CarModel } from "@/components/three/CarModel";
import { StudioLook } from "@/components/three/StudioLook";
import type { CarWithAssets } from "@/lib/cars";
import type { FrameShape } from "@/lib/frames";
import { MOTION } from "@/lib/motion";
import { runtime } from "@/lib/showroom";
import { useArcade } from "@/lib/store";

const FOV = 24;
/** Camera azimuth from the nose: front three-quarter, nose pointing left, the way the row travels. */
const AZIMUTH = (40 * Math.PI) / 180;
const ELEVATION = (9 * Math.PI) / 180;
const SPIN = (Math.PI * 2) / MOTION.turntablePeriod;

/** GT4's soft grey cyclorama, drawn as a full-view quad in sRGB so it matches the DOM mist exactly. */
function Cyclorama() {
  return (
    <mesh frustumCulled={false} renderOrder={-2}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        depthTest={false}
        depthWrite={false}
        vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }`}
        fragmentShader={`varying vec2 vUv;
          void main() {
            float d = distance(vUv, vec2(0.5, 0.58)) / 0.75;
            vec3 color = mix(vec3(0.949), vec3(0.831), smoothstep(0.0, 1.0, d));
            gl_FragColor = vec4(color, 1.0);
          }`}
      />
    </mesh>
  );
}

/**
 * Warms a freshly loaded car on the GPU while it is still offscreen. Without this, the first frame
 * it scrolls into view stalls for 300 ms to 1 s on a D3D11 laptop: shaders compile, textures and
 * buffers upload, and ANGLE finishes each program only at its first real draw. So: compile in
 * parallel, then draw once into a tiny target. Only then does the car count as loaded.
 */
function Loaded({ index }: { index: number }) {
  const markLoaded = useArcade((state) => state.markLoaded);
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  useEffect(() => {
    let alive = true;
    gl.compileAsync(scene, camera).then(() => {
      if (!alive) return;
      // Draw into one canvas pixel rather than a render target: three builds a different shader
      // variant for render targets (no tone mapping), and the screen variant is the one to warm.
      // The pixel never shows; the next frame's views overwrite or clear it.
      const autoClear = gl.autoClear;
      gl.autoClear = false;
      gl.setViewport(0, 0, 1, 1);
      gl.setScissor(0, 0, 1, 1);
      gl.setScissorTest(true);
      gl.render(scene, camera);
      gl.setScissorTest(false);
      gl.autoClear = autoClear;
      markLoaded(index);
    });
    return () => {
      alive = false;
    };
  }, [camera, gl, index, markLoaded, scene]);
  return null;
}

/**
 * One car in its frame: camera fitted to the frame's shape, the studio, and the turntable. The
 * centred car turns once per 60 s, ramping in over 1.2 s once it settles; a departing car eases
 * out and holds, and returns to the three-quarter pose only once the mist hides it completely.
 */
export function CarScene({ car, index, shape }: { car: CarWithAssets; index: number; shape: FrameShape }) {
  const camera = useRef<Camera>(null);
  const turntable = useRef<Group>(null);
  const motion = useRef({ angle: 0, velocity: 0 });

  // Load in lineup order, plus whatever is next to the centred car; once loaded, stay loaded. The
  // selector returns a boolean, so the nine scenes don't re-render every time the centre changes.
  const due = useArcade((state) => index < state.streamed || Math.abs(index - state.centered) <= 1);
  const [mounted, setMounted] = useState(false);
  if (!mounted && due) setMounted(true);

  const length = car.spec.lengthMm / 1000;
  const width = car.spec.widthMm / 1000;
  const { position, target } = useMemo(() => {
    const aspect = shape.width / shape.height;
    const tanV = Math.tan(((FOV / 2) * Math.PI) / 180);
    // Fit the car's turning circle, not its pose, so it never clips the frame as it turns.
    const diagonal = Math.hypot(length, width);
    const distance = diagonal / (2 * shape.fit * tanV * aspect);
    const lift = (2 * shape.ground - 1) * distance * tanV;
    const look: [number, number, number] = [0, lift, 0];
    const eye: [number, number, number] = [
      distance * Math.sin(AZIMUTH) * Math.cos(ELEVATION),
      lift + distance * Math.sin(ELEVATION),
      distance * Math.cos(AZIMUTH) * Math.cos(ELEVATION),
    ];
    return { position: eye, target: look };
  }, [shape, length, width]);

  useLayoutEffect(() => {
    camera.current?.lookAt(...target);
  }, [target]);

  useFrame((_, delta) => {
    const group = turntable.current;
    if (!group) return;
    const state = motion.current;
    const dt = Math.min(delta, 0.05);
    if (runtime.reducedMotion) {
      state.angle = state.velocity = 0;
    } else if (runtime.active === index) {
      const speed = SPIN * (runtime.hovered === index ? MOTION.hoverTurntable : 1);
      // Exponential ramp, about 95% of the way after the PRD's 1.2 s.
      state.velocity += (speed - state.velocity) * (1 - Math.exp((-3 * dt) / MOTION.turntableRamp));
      state.angle += state.velocity * dt;
    } else if (runtime.veil[index] >= 1) {
      // Fully lost in the mist: back to the three-quarter pose where nobody can see it happen.
      state.angle = state.velocity = 0;
    } else {
      // Leaving the centre: the spin eases out on the same ramp and the car holds where it stopped.
      // A turntable never runs backwards to a pose in view.
      state.velocity *= Math.exp((-3 * dt) / MOTION.turntableRamp);
      state.angle += state.velocity * dt;
    }
    group.rotation.y = state.angle;
    runtime.heading[index] = (state.angle * 180) / Math.PI;
  });

  return (
    <>
      <PerspectiveCamera ref={camera} makeDefault fov={FOV} near={0.1} far={100} position={position} />
      <Cyclorama />
      {mounted && (
        <Suspense fallback={null}>
          <StudioLook />
          <group ref={turntable}>
            <CarModel src={car.model3d.src} paint={car.colors.paint} />
          </group>
          <Loaded index={index} />
        </Suspense>
      )}
    </>
  );
}
