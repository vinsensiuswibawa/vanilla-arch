"use client";

import { PerformanceMonitor, View } from "@react-three/drei";
import { advance, Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useState, type RefObject } from "react";
import { ACESFilmicToneMapping } from "three";
import { CarScene } from "@/components/experience/CarScene";
import { DetailScene } from "@/components/experience/DetailScene";
import { cars, getCar } from "@/lib/cars";
import { FRAMES } from "@/lib/frames";
import { runtime } from "@/lib/showroom";
import { useArcade } from "@/lib/store";

/**
 * The one persistent canvas, loaded as its own chunk after the gate paints. It sits fixed behind
 * the DOM and renders one drei View per frame, each scissored to that frame's slot. It never runs
 * its own loop: the carousel moves the DOM and then calls `runtime.advance`, so every view reads
 * its frame's final position in the same frame.
 */
export default function Stage() {
  const record = useArcade((state) => state.record);
  const [adaptiveDpr, setDpr] = useState(1.5);
  const dpr = record ? Math.min(2, window.devicePixelRatio) : adaptiveDpr;
  const tracks = useMemo(
    () => cars.map((_, index) => ({ get current() { return runtime.slots[index]; } }) as RefObject<HTMLElement>),
    [],
  );
  const detailTrack = useMemo(() => ({ get current() { return runtime.detailSlot; } }) as RefObject<HTMLElement>, []);
  const listing = useArcade((state) => state.listing);
  const detailReady = useArcade((state) => state.detailReady);
  const detailCar = listing && detailReady ? getCar(listing) : undefined;

  useEffect(() => {
    // R3F reads a manual timestamp as seconds.
    runtime.advance = (seconds) => advance(seconds);
    return () => {
      runtime.advance = () => {};
    };
  }, []);

  return (
    <Canvas
      aria-hidden
      frameloop="never"
      dpr={dpr}
      // ACES, as chosen in /lab with the studio look: solid paint under a clear coat keeps its colour there.
      gl={{ antialias: true, alpha: true, toneMapping: ACESFilmicToneMapping, powerPreference: "high-performance" }}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    >
      {/* Record mode holds one resolution: a pixel-ratio switch mid-take reallocates the canvas. */}
      {record ? null : (
        <PerformanceMonitor
          onIncline={() => setDpr(Math.min(2, window.devicePixelRatio))}
          onDecline={() => setDpr(1)}
        />
      )}
      {/* While a detail page is open the showroom's views stop drawing; their cars stay loaded. */}
      {cars.map((car, index) => (
        <View key={car.slug} track={tracks[index]} visible={listing === null}>
          <CarScene car={car} index={index} shape={FRAMES[car.frame]} />
        </View>
      ))}
      {detailCar && (
        <View key={`detail-${detailCar.slug}`} track={detailTrack}>
          <DetailScene car={detailCar} />
        </View>
      )}
    </Canvas>
  );
}
