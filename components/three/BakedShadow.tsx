"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Box3, CanvasTexture, MeshBasicMaterial, OrthographicCamera, Scene, WebGLRenderTarget, type Object3D } from "three";

/**
 * The PRD's baked shadow: the car's silhouette rendered once from above, then softened at two radii (a
 * tight contact shadow and a wide penumbra) by down- and up-scaling on a 2D canvas. It costs one textured
 * quad per frame, and as the car's sibling on the turntable it turns with the car.
 */
export function BakedShadow({ car }: { car: Object3D }) {
  const gl = useThree((state) => state.gl);
  const baked = useMemo(() => {
    const box = new Box3().setFromObject(car);
    const half = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) * 0.75;
    const size = 256;
    const camera = new OrthographicCamera(-half, half, half, -half, 0.01, 20);
    camera.position.set(0, 10, 0);
    camera.up.set(0, 0, -1);
    camera.lookAt(0, 0, 0);
    const scene = new Scene();
    scene.overrideMaterial = new MeshBasicMaterial({ color: "#000" });
    scene.add(car.clone(true));
    const target = new WebGLRenderTarget(size, size);
    const previous = gl.getRenderTarget();
    const clear = gl.getClearAlpha();
    gl.setRenderTarget(target);
    gl.setClearAlpha(0);
    gl.clear();
    gl.render(scene, camera);
    const pixels = new Uint8Array(size * size * 4);
    gl.readRenderTargetPixels(target, 0, 0, size, size, pixels);
    gl.setRenderTarget(previous);
    gl.setClearAlpha(clear);
    target.dispose();
    scene.overrideMaterial.dispose();

    // Silhouette as alpha, rows flipped so the canvas top is -Z, matching the plane below.
    const silhouette = document.createElement("canvas");
    silhouette.width = silhouette.height = size;
    const image = silhouette.getContext("2d")!.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const from = ((size - 1 - y) * size + x) * 4;
        const to = (y * size + x) * 4;
        image.data[to + 3] = pixels[from + 3];
      }
    }
    silhouette.getContext("2d")!.putImageData(image, 0, 0);
    const blur = (scale: number) => {
      const small = document.createElement("canvas");
      small.width = small.height = Math.round(size * scale);
      const sctx = small.getContext("2d")!;
      sctx.imageSmoothingQuality = "high";
      sctx.drawImage(silhouette, 0, 0, small.width, small.height);
      return small;
    };
    const out = document.createElement("canvas");
    out.width = out.height = size;
    const ctx = out.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.globalAlpha = 0.5;
    ctx.drawImage(blur(1 / 10), 0, 0, size, size);
    ctx.globalAlpha = 0.65;
    ctx.drawImage(blur(1 / 4), 0, 0, size, size);
    const texture = new CanvasTexture(out);
    return { texture, half };
  }, [car, gl]);
  useEffect(() => () => baked.texture.dispose(), [baked]);
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={0.002} renderOrder={-1}>
      <planeGeometry args={[baked.half * 2, baked.half * 2]} />
      <meshBasicMaterial map={baked.texture} transparent depthWrite={false} toneMapped={false} opacity={0.85} />
    </mesh>
  );
}
