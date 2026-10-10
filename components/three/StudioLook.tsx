"use client";

import { useLoader, useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import {
  CircleGeometry,
  Color,
  DataTexture,
  DoubleSide,
  EquirectangularReflectionMapping,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  type Texture,
  type WebGLRenderer,
} from "three";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";

/** Poly Haven's studio_small_09 (CC0) at 1K, chosen in /lab (docs/lineup.md). */
export const STUDIO_HDRI = "/hdri/studio_small_09_1k.hdr";

const cache = new WeakMap<WebGLRenderer, Map<string, Texture>>();

/**
 * Car-studio reflections, rendered once per renderer and HDRI into one environment map that every view
 * shares: the HDRI with a dark floor under it (the lower body reflects dark, so the shoulder line reads),
 * one long overhead softbox and two side strips (the bright lines that run along the flanks).
 */
function studioEnvironment(gl: WebGLRenderer, file: string, hdr: DataTexture) {
  const byFile = cache.get(gl) ?? new Map<string, Texture>();
  cache.set(gl, byFile);
  const cached = byFile.get(file);
  if (cached) return cached;
  hdr.mapping = EquirectangularReflectionMapping;
  const scene = new Scene();
  scene.background = hdr;
  const floor = new Mesh(new CircleGeometry(60, 48), new MeshBasicMaterial({ color: "#0c0c0c", side: DoubleSide }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.55;
  scene.add(floor);
  // Softboxes, as drei's Lightformer draws them: unlit white planes, brightened past 1 by their intensity.
  const softbox = (intensity: number, position: [number, number, number], rotation: [number, number, number], scale: [number, number]) => {
    const mesh = new Mesh(
      new PlaneGeometry(),
      new MeshBasicMaterial({ color: new Color(1, 1, 1).multiplyScalar(intensity), side: DoubleSide, toneMapped: false }),
    );
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.scale.set(scale[0], scale[1], 1);
    scene.add(mesh);
  };
  softbox(3, [0, 6, 0], [Math.PI / 2, 0, 0], [1.6, 12]);
  softbox(1.4, [6, 1.4, 0], [0, -Math.PI / 2, 0], [14, 0.8]);
  softbox(1.4, [-6, 1.4, 0], [0, Math.PI / 2, 0], [14, 0.8]);
  const pmrem = new PMREMGenerator(gl);
  const texture = pmrem.fromScene(scene, 0, 0.1, 100, { size: 512 }).texture;
  pmrem.dispose();
  scene.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    (mesh.material as MeshBasicMaterial).dispose();
  });
  byFile.set(file, texture);
  return texture;
}

/** The studio look from /lab (look=studio): the shared reflections plus a soft key light from above. */
export function StudioLook({ file = STUDIO_HDRI }: { file?: string }) {
  const get = useThree((state) => state.get);
  const hdr = useLoader(HDRLoader, file);
  useLayoutEffect(() => {
    // The view's own scene (a drei View portals each car into one).
    const { gl, scene } = get();
    scene.environment = studioEnvironment(gl, file, hdr);
    scene.environmentIntensity = 1.2;
    scene.environmentRotation.set(0, Math.PI / 3, 0);
    return () => {
      scene.environment = null;
    };
  }, [file, get, hdr]);
  return <directionalLight position={[2, 9, 3.5]} intensity={0.6} />;
}
