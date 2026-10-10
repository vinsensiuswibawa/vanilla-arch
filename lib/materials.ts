import { Color, MeshPhysicalMaterial, type Mesh, type MeshStandardMaterial, type Object3D } from "three";

/**
 * Listing paint. Real solid paint is a diffuse colour under a clear coat: the colour stays deep and the
 * reflections stay white and sharp. Metallic and pearl paints keep flake (metalness) under the coat.
 * Unset `metallic` guesses from the colour: greys and silvers are metallic paints.
 */
export function paintMaterial(hex: string, metallic?: boolean) {
  const hsl = { h: 0, s: 0, l: 0 };
  new Color(hex).getHSL(hsl);
  const flake = metallic ?? (hsl.s < 0.15 && hsl.l > 0.3);
  return new MeshPhysicalMaterial({
    color: hex,
    metalness: flake ? 0.6 : 0,
    roughness: flake ? 0.38 : 0.5,
    // Solid paint's base coat is pigment, not a mirror: only the clear coat reflects, so reflections stay
    // sharp and white instead of a blurred tinted sheen.
    specularIntensity: flake ? 1 : 0,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
  });
}

/** The pipeline names the body "paint" (scripts/models/optimize.mjs); some authors' own names also match. */
export const isPaint = (name: string) => /(^|_)paint$|^paint|car_?paint|cp-/.test(name) && !/black/.test(name);

/**
 * Paints a car from public/models in the listing's colour. Everything else keeps the modeler's own
 * materials, repaired in the pipeline.
 */
export function applyPaint(scene: Object3D, paint: { hex: string; metallic?: boolean }) {
  const material = paintMaterial(paint.hex, paint.metallic);
  scene.traverse((object) => {
    const mesh = object as Mesh;
    if (mesh.isMesh && isPaint((mesh.material as MeshStandardMaterial).name.toLowerCase())) mesh.material = material;
  });
}
