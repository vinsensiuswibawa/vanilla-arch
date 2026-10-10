"use client";

import Lenis from "lenis";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CarName } from "@/components/experience/CarName";
import { play } from "@/lib/audio";
import { cars } from "@/lib/cars";
import { carLabel, carLine, formatPrice } from "@/lib/format";
import { FRAMES, matPath } from "@/lib/frames";
import { easeInOut, easeOut, MOTION, veilFor } from "@/lib/motion";
import { runtime, showroom } from "@/lib/showroom";
import { useArcade } from "@/lib/store";

const first = FRAMES[cars[0].frame];
const last = FRAMES[cars[cars.length - 1].frame];

/** Frame height (H) and the top of the tallest frame; every frame stands on the floor at top + H. */
const SECTION_STYLE = {
  "--H": "min(58svh, 42vw)",
  "--top": "14svh",
} as CSSProperties;

const TRACK_STYLE: CSSProperties = {
  paddingTop: "var(--top)",
  paddingLeft: `calc(50vw - var(--H) * ${first.width / 2})`,
  paddingRight: `calc(50vw - var(--H) * ${last.width / 2})`,
  gap: "calc(var(--H) * 0.2)",
};

const NAVIGATION_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown", "Tab", "Enter", " "]);

export function Carousel({ inert, fading }: { inert: boolean; fading?: boolean }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const frames = useRef<(HTMLLIElement | null)[]>([]);
  const mists = useRef<(HTMLDivElement | null)[]>([]);
  const [hovered, setHovered] = useState(-1);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    runtime.reducedMotion = motionQuery.matches;
    const onMotionChange = () => (runtime.reducedMotion = motionQuery.matches);
    motionQuery.addEventListener("change", onMotionChange);

    // Lenis honours reduced motion itself: no smoothing, and programmatic scrolls jump.
    const lenis = new Lenis({ lerp: MOTION.lenisLerp, gestureOrientation: "both", autoRaf: false });
    let viewport = window.innerWidth;
    let centers: number[] = [];
    let stops: number[] = [];
    let spacing = 1;
    let lastInput = -Infinity;
    let snapping = false;
    let introStart: number | null = null;
    // The mouse's last position: when the row moves under a still pointer, hover follows the row.
    let pointer: { x: number; y: number } | null = null;
    let rehit = false;
    let opened = false;
    const onPointer = (event: PointerEvent) => {
      // Only a real move hands hover back from the keyboard; browsers also fire moves on layout changes.
      if (runtime.keyboard && pointer && (pointer.x !== event.clientX || pointer.y !== event.clientY)) {
        runtime.keyboard = false;
        rehit = true;
      }
      pointer = event.pointerType === "mouse" ? { x: event.clientX, y: event.clientY } : null;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    // A navigation keystroke takes hover away from a parked pointer, so steps never blink the pill.
    const onKey = (event: KeyboardEvent) => {
      if (!NAVIGATION_KEYS.has(event.key)) return;
      runtime.keyboard = true;
      if (runtime.hovered >= 0) {
        runtime.hovered = -1;
        setHovered(-1);
      }
    };
    window.addEventListener("keydown", onKey, true);

    const measure = () => {
      viewport = window.innerWidth;
      centers = frames.current.map((frame) => (frame ? frame.offsetLeft + frame.offsetWidth / 2 : 0));
      stops = centers.map((center) => center - viewport / 2);
      spacing = (stops[stops.length - 1] - stops[0]) / (stops.length - 1);
      const travel = Math.max(0, track.current!.scrollWidth - viewport);
      section.current!.style.height = `${window.innerHeight + travel}px`;
      lenis.resize();
      lenis.scrollTo(stops[useArcade.getState().centered], { immediate: true, force: true });
    };

    const nearestStop = (scroll: number) => {
      let best = 0;
      for (let i = 1; i < stops.length; i++) if (Math.abs(stops[i] - scroll) < Math.abs(stops[best] - scroll)) best = i;
      return best;
    };

    const goTo = (index: number, { immediate = false } = {}) => {
      const target = Math.max(0, Math.min(stops.length - 1, index));
      if (snapping && target === showroom.target && !immediate) return;
      showroom.target = target;
      const distance = Math.abs(stops[target] - lenis.animatedScroll);
      if (distance < 0.5) return;
      snapping = !immediate;
      // 500–700 ms by distance: a neighbour gets the full settle, a long jump no more.
      const duration = MOTION.snapMin + (MOTION.snapMax - MOTION.snapMin) * Math.min(1, distance / spacing);
      lenis.scrollTo(stops[target], {
        immediate,
        force: true,
        duration: duration / 1000,
        easing: easeOut,
        onComplete: () => {
          if (!snapping) return;
          snapping = false;
          play("tick");
        },
      });
    };
    showroom.goTo = goTo;

    // Snapping never fights input: any wheel, swipe or native scroll cancels it and restarts the idle clock.
    lenis.on("virtual-scroll", () => {
      lastInput = performance.now();
      snapping = false;
    });

    let raf = 0;
    const tick = (time: number) => {
      raf = requestAnimationFrame(tick);
      lenis.raf(time);
      const state = useArcade.getState();
      const scroll = lenis.animatedScroll;
      track.current!.style.transform = `translate3d(${-scroll}px, 0, 0)`;
      if (lenis.isScrolling === "native") {
        lastInput = time;
        snapping = false;
      }

      // Hover never flickers while the row travels: it clears when the row starts moving and is
      // re-read once, under the still pointer, when the row comes to rest.
      runtime.moving = snapping || lenis.isScrolling !== false;
      if (runtime.moving) {
        rehit = true;
        if (runtime.hovered >= 0) {
          runtime.hovered = -1;
          setHovered(-1);
        }
      } else if (rehit && !runtime.keyboard) {
        rehit = false;
        const link = pointer && document.elementFromPoint(pointer.x, pointer.y)?.closest("[data-frame]");
        const under = link ? frames.current.findIndex((frame) => frame?.contains(link)) : -1;
        if (under !== runtime.hovered) {
          runtime.hovered = under;
          setHovered(under);
        }
      }

      // The first car emerges from the mist as the gate lifts: the gate clears for its first third,
      // then the car resolves over the rest, so the two never double-expose.
      if (state.phase !== "gate" && introStart === null) introStart = time;
      // A pointer already resting on a frame when the showroom opens gets its hover without moving.
      if (state.phase === "showroom" && !opened) opened = rehit = true;
      const delay = runtime.reducedMotion ? 0 : MOTION.gateEnter / 3;
      const duration = (runtime.reducedMotion ? MOTION.gateEnterReduced : MOTION.gateEnter) - delay;
      const intro = introStart === null ? 1 : 1 - easeInOut((time - introStart - delay) / duration);

      let nearest = 0;
      let nearestDistance = Infinity;
      for (let i = 0; i < centers.length; i++) {
        const distance = Math.abs(centers[i] - scroll - viewport / 2) / (viewport / 2);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = i;
        }
        // Rounded so a resting frame writes no styles at all.
        const veil = Math.round(Math.max(veilFor(distance), intro) * 1000) / 1000;
        if (veil !== runtime.veil[i]) {
          runtime.veil[i] = veil;
          const mist = mists.current[i];
          if (mist) mist.style.opacity = String(veil);
        }
      }
      if (nearest !== state.centered) state.setCentered(nearest);
      if (!snapping) showroom.target = nearest;

      const resting = !snapping && lenis.isScrolling === false && Math.abs(stops[nearest] - scroll) < 1 && intro < 0.02;
      runtime.active = resting ? nearest : -1;
      if (resting !== state.settled) state.setSettled(resting);

      // Soft snap: 150 ms after input stops, ease the car nearest to where the scroll is heading to centre.
      const free = state.phase === "showroom" && !lenis.isStopped;
      if (free && !snapping && time - lastInput > MOTION.snapIdle) {
        const target = nearestStop(lenis.targetScroll);
        if (Math.abs(stops[target] - scroll) > 0.5) goTo(target);
      }

      // An open detail page renders from its own tick, so each frame draws once.
      if (!runtime.external) runtime.advance(time / 1000);
    };

    const resize = new ResizeObserver(measure);
    resize.observe(track.current!);
    window.addEventListener("resize", measure);
    measure();
    raf = requestAnimationFrame(tick);

    // Lenis runs only while the showroom owns the page: not behind the gate, the Index or a listing.
    let owned: boolean | null = null;
    const syncLenis = (next: boolean) => {
      if (next === owned) return;
      owned = next;
      if (next) {
        // Stopping cancels a snap mid-flight without completing it; clear the flag so the idle
        // snap re-centres the row once the showroom has the page back.
        snapping = false;
        lenis.start();
      } else lenis.stop();
      document.documentElement.style.overflow = next ? "" : "hidden";
    };
    syncLenis(false);
    const unsubscribe = useArcade.subscribe((state) => syncLenis(state.phase === "showroom" && !state.indexOpen && !state.listing));

    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("keydown", onKey, true);
      motionQuery.removeEventListener("change", onMotionChange);
      unsubscribe();
      lenis.destroy();
      showroom.goTo = () => {};
    };
  }, []);

  const hover = (index: number) => (event: React.PointerEvent) => {
    // No hover while the row travels or the gate is still lifting: the car emerges on its own.
    if (event.pointerType !== "mouse" || runtime.moving || runtime.keyboard || useArcade.getState().phase !== "showroom") return;
    runtime.hovered = index;
    setHovered(index);
  };
  const leave = () => {
    if (runtime.moving) return;
    runtime.hovered = -1;
    setHovered(-1);
  };

  return (
    <section ref={section} aria-label="Showroom" inert={inert} data-fading={fading} className="relative" style={SECTION_STYLE}>
      <div className="sticky top-0 h-svh overflow-clip">
        <ol ref={track} className="flex w-max items-start will-change-transform" style={TRACK_STYLE}>
          {cars.map((car, index) => {
            const shape = FRAMES[car.frame];
            return (
              <li
                key={car.slug}
                ref={(element) => {
                  frames.current[index] = element;
                }}
                className="relative shrink-0"
                style={{ width: `calc(var(--H) * ${shape.width})`, marginTop: `calc(var(--H) * ${1 - shape.height})` }}
              >
                <Link
                  href={`/cars/${car.slug}`}
                  scroll={false}
                  aria-label={carLabel(car)}
                  data-frame
                  className="frame-link block"
                  onFocus={(event) => {
                    if (event.currentTarget.matches(":focus-visible")) showroom.goTo(index);
                  }}
                  onPointerEnter={hover(index)}
                  onPointerLeave={leave}
                >
                  <div className="relative" style={{ height: `calc(var(--H) * ${shape.height})` }}>
                    {/* The 3D slot: the lazily loaded stage tracks this element with a drei View. */}
                    <div
                      ref={(element) => {
                        runtime.slots[index] = element;
                      }}
                      className="absolute inset-0"
                    />
                    <div
                      ref={(element) => {
                        mists.current[index] = element;
                      }}
                      className="absolute inset-0"
                      style={{ opacity: 1 }}
                    >
                      <div className="mist absolute inset-0" data-clear={hovered === index || undefined} />
                    </div>
                    <svg
                      aria-hidden
                      className="absolute inset-0 h-full w-full overflow-visible"
                      viewBox={`0 0 ${shape.width * 100} ${shape.height * 100}`}
                      preserveAspectRatio="none"
                    >
                      <path d={matPath(shape)} fill="var(--color-paper)" fillRule="evenodd" />
                      {/* Keyboard focus traces the frame's own shape. */}
                      <path
                        className="frame-ring"
                        d={shape.path}
                        fill="none"
                        stroke="var(--color-ink)"
                        strokeWidth={2}
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                    {/* The market name as a vertical spine, standing on the floor beside the frame. */}
                    <p
                      lang="ja"
                      className="font-ja absolute bottom-0 left-full ml-4 text-[13px] leading-none tracking-[0.12em] whitespace-nowrap text-mist-700 [writing-mode:vertical-rl]"
                    >
                      {car.marketNameJa}
                    </p>
                  </div>
                  <div className="mt-6">
                    {/* Weight 500: at 400 the Didone's hairline hyphens vanish on 1x screens (RX-7, GT-R). */}
                    <h2 className="font-display text-[clamp(1.5rem,2.1vw,2.25rem)] leading-[1.05] font-medium text-balance">
                      <CarName car={car} />
                    </h2>
                    <p className="mt-2 text-[13px] leading-snug text-mist-700">{carLine(car)}</p>
                    <p className="mt-3 flex gap-5 font-mono text-[13px] tabular-nums">
                      <span className="text-mist-700">No. {String(car.no).padStart(2, "0")}</span>
                      <span>{formatPrice(car.priceUsd)}</span>
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
