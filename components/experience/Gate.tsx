"use client";

import { useEffect, useRef } from "react";
import { prepare, setMuted, storedSound, unlock } from "@/lib/audio";
import { cars } from "@/lib/cars";
import { GLYPHS } from "@/lib/frames";
import { MOTION, prefersReducedMotion } from "@/lib/motion";
import { useArcade } from "@/lib/store";

/** Enter runs inside the visitor's gesture, which is what lets the audio context start. */
export function enterShowroom(withSound: boolean) {
  const state = useArcade.getState();
  if (state.phase !== "gate" || (state.record && !state.loaded.every(Boolean))) return;
  unlock(withSound);
  setMuted(!withSound);
  state.setSound(withSound);
  state.setPhase("entering");
  const duration = prefersReducedMotion() ? MOTION.gateEnterReduced : MOTION.gateEnter;
  window.setTimeout(() => useArcade.getState().setPhase("showroom"), duration);
}

/**
 * The Press Start gate. It is server-rendered HTML and CSS, so the wordmark paints before any
 * JavaScript runs; the frame glyphs under it fill as each car's model arrives.
 */
export function Gate() {
  const phase = useArcade((state) => state.phase);
  const loaded = useArcade((state) => state.loaded);
  const record = useArcade((state) => state.record);
  const withSound = useRef<HTMLButtonElement>(null);
  const withoutSound = useRef<HTMLButtonElement>(null);
  const ready = loaded.filter(Boolean).length;
  // Record mode holds the doors until every car is loaded and warm; the glyph row above is the progress bar.
  const holding = record && ready < cars.length;

  // The visitor's last choice takes focus, so Enter repeats it. The audio context is built while the
  // gate idles (lib/audio.ts), so Enter only has to resume it.
  useEffect(() => {
    (storedSound() ? withSound : withoutSound).current?.focus();
    const idle = window.requestIdleCallback?.(prepare, { timeout: 2000 }) ?? window.setTimeout(prepare, 500);
    return () => (window.cancelIdleCallback ?? window.clearTimeout)(idle);
  }, []);

  return (
    <section
      aria-label="Welcome"
      className="gate fixed inset-0 z-50 grid place-items-center"
      data-phase={phase}
      hidden={phase === "showroom"}
    >
      <div className="gate-inner flex flex-col items-center px-6 text-center">
        <div className="inline-grid">
          <p className="font-display text-[clamp(4rem,11vw,10rem)] leading-[0.9] font-medium tracking-[0.06em] uppercase">
            Arcade
          </p>
          <ol aria-hidden className="mt-[clamp(1.25rem,2.4vw,2.25rem)] flex w-full items-end justify-between px-[0.06em]">
            {cars.map((car, index) => (
              <li key={car.slug}>
                <svg viewBox="0 0 16 16" className="block size-[clamp(1rem,1.9vw,1.75rem)]">
                  <path d={GLYPHS[car.frame]} fill="none" stroke="var(--color-ink)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                  <path d={GLYPHS[car.frame]} fill="var(--color-ink)" className="glyph-fill" data-on={loaded[index] || undefined} />
                </svg>
              </li>
            ))}
          </ol>
        </div>
        <p className="mt-10 max-w-[34ch] text-[17px] leading-relaxed text-mist-700">
          Thirteen classics, 1972 to 2008, each in 3D beside the seller&rsquo;s photographs.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3" aria-busy={holding || undefined}>
          <button ref={withSound} type="button" className="pill pill-ink" disabled={holding} onClick={() => enterShowroom(true)}>
            Enter the showroom
          </button>
          <button ref={withoutSound} type="button" className="pill pill-line" disabled={holding} onClick={() => enterShowroom(false)}>
            Enter without sound
          </button>
        </div>
        <p className="mt-5 text-[13px] text-mist-700">Sound is a quiet room tone and soft clicks. Press M to mute.</p>
        <p className="sr-only" aria-live="polite">
          {ready === cars.length ? `All ${cars.length} cars are ready.` : ""}
        </p>
      </div>
      <p className="absolute inset-x-6 bottom-8 text-center text-[13px] text-mist-700">
        A concept. Every listing is fiction; the cars and their specifications are real.
      </p>
    </section>
  );
}
