"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import Image from "next/image";
import { Suspense, useEffect } from "react";
import { ACESFilmicToneMapping } from "three";
import { CarModel } from "@/components/three/CarModel";
import { StudioLook } from "@/components/three/StudioLook";
import type { CarWithAssets } from "@/lib/cars";
import { carSubtitle, carTitle } from "@/lib/format";

// GT4-style studio: a soft grey cyclorama behind a transparent canvas.
const CYCLORAMA = "radial-gradient(120% 90% at 50% 40%, #f2f2f2 0%, #e4e4e4 55%, #d4d4d4 100%)";

/** Flags the page once the car has rendered, so scripts/stills.mjs knows when to capture. */
function Ready() {
  useEffect(() => {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        document.documentElement.dataset.studioReady = "true";
      });
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return null;
}

export function Studio({ car, still }: { car: CarWithAssets; still: boolean }) {
  const length = car.spec.lengthMm / 1000;
  const height = car.spec.heightMm / 1000;
  const target: [number, number, number] = [0, height * 0.45, 0];

  const stage = (
    <Canvas
      camera={{ fov: 30, position: [length * 0.95, length * 0.32, length * 1.05] }}
      dpr={[1, 2]}
      // The showroom's look (components/experience/Stage.tsx).
      gl={{ antialias: true, alpha: true, toneMapping: ACESFilmicToneMapping }}
      onCreated={({ camera }) => camera.lookAt(...target)}
    >
      <Suspense fallback={null}>
        <StudioLook />
        <CarModel src={car.model3d.src} paint={car.colors.paint} />
        <Ready />
      </Suspense>
      {!still && <OrbitControls target={target} makeDefault />}
    </Canvas>
  );

  if (still) {
    return (
      <div className="h-[630px] w-[1200px]" style={{ background: CYCLORAMA }}>
        {stage}
      </div>
    );
  }

  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[1fr_26rem]">
      <div className="h-[70dvh] lg:h-dvh" style={{ background: CYCLORAMA }}>
        {stage}
      </div>
      <aside className="space-y-6 p-6">
        <div>
          <p className="font-mono text-xs text-mist-700">Studio · asset QA (dev only)</p>
          <h1 className="mt-2 font-display text-3xl leading-tight">{carTitle(car)}</h1>
          <p className="mt-1 text-sm text-mist-700">{carSubtitle(car)}</p>
        </div>
        <dl className="grid grid-cols-[6rem_1fr] gap-y-1 text-sm">
          <dt className="text-mist-700">Paint</dt>
          <dd>{car.colors.paint.name}{car.colors.paint.metallic ? " (metallic)" : ""}</dd>
          <dt className="text-mist-700">Interior</dt>
          <dd>{car.colors.interior.name}</dd>
          <dt className="text-mist-700">Wheels</dt>
          <dd>{car.colors.wheels.name}</dd>
          <dt className="text-mist-700">Model</dt>
          <dd>
            {car.model3d.title} by {car.model3d.author}
          </dd>
        </dl>
        <ul className="grid grid-cols-2 gap-2">
          {car.photos.map((photo) => (
            <li key={photo.src}>
              <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="13rem" className="h-auto w-full" />
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
