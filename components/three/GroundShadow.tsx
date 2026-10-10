"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture } from "three";

/**
 * A soft, pre-baked ground shadow sized to the car's real footprint, in the spirit of GT4's
 * studio. It is a child of the car, so it turns with the car at no per-frame cost. (drei's
 * ContactShadows renders nothing visible with three r186, so this replaces it.)
 */
export function GroundShadow({ lengthM, widthM, opacity = 0.42 }: { lengthM: number; widthM: number; opacity?: number }) {
  const texture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(0,0,0,1)");
    gradient.addColorStop(0.45, "rgba(0,0,0,0.7)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    return new CanvasTexture(canvas);
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh rotation-x={-Math.PI / 2} position-y={0.002} scale={[widthM * 1.35, lengthM * 1.2, 1]} renderOrder={-1}>
      <planeGeometry />
      <meshBasicMaterial map={texture} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
