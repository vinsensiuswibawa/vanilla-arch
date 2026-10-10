"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { BakedShadow } from "@/components/three/BakedShadow";
import type { Car } from "@/lib/cars";
import { applyPaint } from "@/lib/materials";

/**
 * One car from public/models, normalized by the pipeline (meters, nose +Z, origin on the ground), in the
 * listing's paint, standing on its baked shadow.
 */
export function CarModel({ src, paint }: { src: string; paint: Car["colors"]["paint"] }) {
  const { scene } = useGLTF(src, false, true);
  const car = useMemo(() => {
    const copy = scene.clone(true);
    applyPaint(copy, paint);
    return copy;
  }, [scene, paint]);
  return (
    <>
      <primitive object={car} />
      <BakedShadow car={car} />
    </>
  );
}
