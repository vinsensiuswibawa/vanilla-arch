// Per-frame state of the open detail page, written by the DOM loop (components/detail/Detail.tsx) and read by
// the 3D view (components/experience/DetailScene.tsx). Like lib/showroom.ts it lives outside React: it changes
// every frame, and re-rendering for it would cost more than the frame itself.
import { headingAt, type SolvedPose } from "@/lib/choreography";
import { MOTION } from "@/lib/motion";

export const detail = {
  /** The four solved poses for this car at this viewport; null until the page has measured itself. */
  solved: null as SolvedPose[] | null,
  viewport: { w: 1440, h: 960 },
  /** The camera's place along P0 to P3 (0 to 3), read from the lagged page position. */
  progress: 0,
  /** The car's turntable heading in degrees, after the T1 easing to 0. */
  heading: 0,
  /** True while the hero entry (hand-off, deep-link fade or reduced crossfade) is still running: the
   * turntable holds off and DetailScene reads `entryPose` instead of the scroll-driven pose. */
  entering: true,
  /** The entry's own camera pose while `entering`; null once the entry has handed off to the scroll. */
  entryPose: null as SolvedPose | null,
  reduced: false,
  // Turntable state (docs/overhaul.md, step 4): one thing drives the heading at a time.
  angle: 0,
  velocity: 0,
  /** The angle the turntable stopped at when T1 started; T1 eases from it back to 0. */
  hold: 0,
  atHero: true,
  dragging: false,
  /** Seconds (gsap ticker time) before the turntable may run again. */
  resumeAt: 0,
};

const SPIN = 360 / MOTION.turntablePeriod; // degrees per second

export function resetDetail(now: number, reduced: boolean) {
  Object.assign(detail, {
    solved: null,
    progress: 0,
    heading: 0,
    entering: true,
    entryPose: null,
    reduced,
    angle: 0,
    velocity: 0,
    hold: 0,
    atHero: true,
    dragging: false,
    resumeAt: now,
  });
}

/** Set by the open detail page's leave sequence (a 0.6 s fade of the page and canvas, step 2); run by whoever
 * takes the visitor back to the showroom (the back pill, Escape), so the fade finishes before the route
 * changes. Null when no detail page is mounted, or it has none to run (e.g. before its effect attaches). */
export const exit: { run: (() => Promise<void>) | null } = { run: null };

/** Runs the open detail page's leave fade, if there is one, then navigates; navigates straight away if not
 * (no detail page, or its effect hasn't attached yet). Shared by the back pill and the Escape shortcut. */
export function leaveDetail(navigate: () => void) {
  if (exit.run) exit.run().then(navigate);
  else navigate();
}

/**
 * The turntable runs in the hero and through section A, ramping over 1.2 s. When T1 starts it stops where it
 * is and, across T1, the heading eases back to 0 (headingAt). Scrolling back before T1's start hands control
 * back, and it ramps up again once the scroll has rested for 0.5 s. A drag adds to the angle and releases to
 * the turntable after 1.2 s. After T1 nothing turns the car. Reduced motion holds it at the hero pose.
 */
export function stepTurntable(dt: number, now: number) {
  if (detail.entering) return;
  const hero = detail.progress <= 0.0005;
  if (detail.reduced) {
    detail.angle = detail.velocity = detail.hold = 0;
    detail.heading = 0;
    return;
  }
  if (!hero) {
    if (detail.atHero) {
      detail.atHero = false;
      detail.hold = detail.angle;
      detail.velocity = 0;
    }
    detail.heading = headingAt(detail.hold, detail.progress);
    return;
  }
  if (!detail.atHero) {
    detail.atHero = true;
    detail.angle = detail.hold;
    detail.resumeAt = now + 0.5;
  }
  const target = !detail.dragging && now >= detail.resumeAt ? SPIN : 0;
  // Exponential ramp, about 95% of the way after the spec's 1.2 s.
  detail.velocity += (target - detail.velocity) * (1 - Math.exp((-3 * dt) / MOTION.turntableRamp));
  detail.angle = (detail.angle + detail.velocity * dt) % 360;
  detail.heading = detail.angle;
}
