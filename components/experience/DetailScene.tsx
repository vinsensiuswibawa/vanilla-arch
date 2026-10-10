"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import type { Group, PerspectiveCamera as Camera } from "three";
import { CarModel } from "@/components/three/CarModel";
import { StudioLook } from "@/components/three/StudioLook";
import type { CarWithAssets } from "@/lib/cars";
import { applyState, FOV, poseAt, stateOf } from "@/lib/choreography";
import { detail } from "@/lib/detail";

/**
 * The car on the detail page, drawn through one full-viewport drei View. The camera and the car's heading come
 * from lib/detail.ts each frame (the DOM loop writes them from the lagged page position); the car itself never
 * moves except on its turntable. There is no cyclorama: the canvas stays transparent, so the "behind" DOM layer
 * shows through and the "front" layer covers the car.
 */
export function DetailScene({ car }: { car: CarWithAssets }) {
  const camera = useRef<Camera>(null);
  const turntable = useRef<Group>(null);

  useFrame(({ gl }) => {
    // A View renders without clearing, and this one has nothing opaque behind it: wipe last frame first.
    gl.clear(true, true, true);
    const solved = detail.solved;
    const group = turntable.current;
    if (group) group.visible = solved !== null;
    if (!camera.current || !solved || !group) return;
    const pose = detail.entryPose ?? poseAt(solved, detail.progress, detail.reduced);
    applyState(camera.current, stateOf(pose), detail.viewport.w, detail.viewport.h);
    group.rotation.y = (detail.heading * Math.PI) / 180;
  });

  return (
    <>
      <PerspectiveCamera ref={camera} makeDefault fov={FOV} near={0.1} far={100} />
      <Suspense fallback={null}>
        <StudioLook />
        <group ref={turntable} visible={false}>
          <CarModel src={car.model3d.src} paint={car.colors.paint} />
        </group>
      </Suspense>
    </>
  );
}
