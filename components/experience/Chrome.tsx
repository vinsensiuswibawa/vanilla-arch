"use client";

import Image from "next/image";
import { useState } from "react";
import { play, setMuted } from "@/lib/audio";
import { cars } from "@/lib/cars";
import { GLYPHS } from "@/lib/frames";
import { showroom } from "@/lib/showroom";
import { carName } from "@/lib/format";
import { useArcade } from "@/lib/store";

export function toggleSound() {
  const { sound, setSound } = useArcade.getState();
  setMuted(sound);
  setSound(!sound);
}

/** Everything fixed around the showroom: wordmark, emblem, progress, Index and sound. */
export function Chrome({ inert, fading }: { inert: boolean; fading?: boolean }) {
  const centered = useArcade((state) => state.centered);
  const settled = useArcade((state) => state.settled);
  const sound = useArcade((state) => state.sound);
  const indexOpen = useArcade((state) => state.indexOpen);
  const setIndexOpen = useArcade((state) => state.setIndexOpen);
  const car = cars[centered];
  // The emblem follows the car at rest, not every car the row passes, so a fast scroll never rattles
  // through the makers; it still swaps with no fade.
  const [emblem, setEmblem] = useState(centered);
  if (settled && emblem !== centered) setEmblem(centered);

  return (
    <div inert={inert} data-fading={fading} className="pointer-events-none fixed inset-0 z-20 [&>*]:pointer-events-auto">
      <header className="absolute top-8 left-10">
        <h1 className="font-display text-[20px] leading-none font-medium tracking-[0.12em] uppercase">Arcade</h1>
      </header>

      {/* GT4-style: the centred car's maker, small and in full colour, top right. */}
      <div className="absolute top-7 right-10 flex h-8 w-32 items-start justify-end">
        {cars.map((each, index) => each.emblem && (
          <Image
            key={each.slug}
            src={each.emblem.src}
            alt=""
            fill
            sizes="128px"
            unoptimized
            className="object-contain object-right-top"
            style={{ opacity: index === emblem ? undefined : 0 }}
          />
        ))}
      </div>

      <nav aria-label="Cars" className="absolute bottom-8 left-10 flex items-center gap-5">
        <ol className="flex items-center">
          {cars.map((each, index) => (
            <li key={each.slug}>
              <button
                type="button"
                className="glyph-button grid h-11 w-7 place-items-center"
                aria-label={`${String(each.no).padStart(2, "0")}, ${each.year} ${carName(each)}`}
                aria-current={index === centered || undefined}
                onClick={() => showroom.goTo(index)}
              >
                <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
                  <path
                    d={GLYPHS[each.frame]}
                    fill={index === centered ? "var(--color-ink)" : "none"}
                    stroke={index === centered ? "var(--color-ink)" : "var(--color-mist-700)"}
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ol>
        <p className="flex items-center gap-2.5 font-mono text-[13px] tabular-nums">
          <span>
            {String(car.no).padStart(2, "0")} <span className="text-mist-700">/ {String(cars.length).padStart(2, "0")}</span>
          </span>
          {/* The live dot: on while the centred car is turning. The counter carries the state in text. */}
          <span aria-hidden className="live-dot size-1.5 rounded-full bg-signal motion-reduce:hidden" data-on={settled || undefined} />
        </p>
        <p className="hidden text-[13px] text-mist-700 lg:block">Scroll sideways, or use the arrow keys</p>
      </nav>

      <div className="absolute right-10 bottom-8 flex items-center gap-3">
        <button
          type="button"
          className="pill pill-soft"
          aria-haspopup="dialog"
          aria-expanded={indexOpen}
          aria-keyshortcuts="I"
          onClick={() => setIndexOpen(true)}
          onPointerDown={() => play("press")}
        >
          Index <kbd aria-hidden className="kbd">I</kbd>
        </button>
        <button
          type="button"
          className="pill pill-soft"
          aria-label="Sound"
          aria-pressed={sound}
          aria-keyshortcuts="M"
          onClick={toggleSound}
          onPointerDown={() => play("press")}
        >
          {sound ? "Sound on" : "Sound off"} <kbd aria-hidden className="kbd">M</kbd>
        </button>
      </div>
    </div>
  );
}
