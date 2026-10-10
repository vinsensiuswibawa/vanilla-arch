"use client";

import { useEffect, useRef } from "react";
import { hasFinePointer, MOTION, prefersReducedMotion } from "@/lib/motion";
import { runtime } from "@/lib/showroom";
import { useArcade } from "@/lib/store";

/**
 * The pill cursor: an ink pill with a signal dot that follows the pointer at lerp 0.18 per frame
 * while it is over a car. Fine pointers only; reduced motion keeps the native cursor.
 */
export function Cursor() {
  const pill = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasFinePointer() || prefersReducedMotion()) return;
    const element = pill.current!;
    const target = { x: -100, y: -100 };
    const position = { x: -100, y: -100 };
    let shown = false;
    let raf = 0;

    const move = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      // Appear where the pointer is rather than gliding in from the last exit.
      if (!shown) Object.assign(position, target);
    };
    let last = performance.now();
    const tick = (time: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(time - last, 100);
      last = time;
      const { phase, indexOpen, listing } = useArcade.getState();
      const visible = runtime.hovered >= 0 && phase === "showroom" && !indexOpen && !listing;
      if (visible !== shown) {
        shown = visible;
        element.dataset.on = visible ? "true" : "";
      }
      if (!shown) return;
      // The PRD's 0.18 per frame is a 60 Hz figure; scaled by elapsed time so the follow feels the
      // same on a 120 Hz display.
      const follow = 1 - (1 - MOTION.cursorLerp) ** (dt / (1000 / 60));
      position.x += (target.x - position.x) * follow;
      position.y += (target.y - position.y) * follow;
      element.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
    };
    window.addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
    };
  }, []);

  return (
    <div ref={pill} aria-hidden className="cursor-pill pointer-events-none fixed top-0 left-0 z-40">
      <span className="flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-ink py-2.5 pr-4 pl-3.5 text-[13px] whitespace-nowrap text-paper">
        <span className="size-1.5 rounded-full bg-signal" />
        View the car
      </span>
    </div>
  );
}
