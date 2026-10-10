// Per-frame state the DOM loop writes and the 3D views read. It lives outside React on purpose:
// it changes every frame, and re-rendering for it would cost more than the frame itself.
import { CAR_COUNT } from "@/lib/store";

export const runtime = {
  /** Each car's veil after the intro mist (0 clear, 1 lost in mist). */
  veil: new Float32Array(CAR_COUNT).fill(1),
  /** The car that is centred and at rest, so its turntable runs; -1 while moving. */
  active: -1,
  hovered: -1,
  /** True while the row travels (wheel, swipe, snap or step); hover holds still until it rests. */
  moving: false,
  /** True from a navigation keystroke until the mouse really moves: hover is the pointer's, not the keyboard's. */
  keyboard: false,
  reducedMotion: false,
  /** Each frame's 3D slot, the element its drei View tracks. */
  slots: [] as (HTMLDivElement | null)[],
  /** Each car's current turntable heading, in degrees, written every frame (docs/overhaul.md, "Entry from the carousel"). */
  heading: new Float32Array(CAR_COUNT),
  /** The detail page's 3D slot: the full-viewport element its View tracks (null while the page is closed). */
  detailSlot: null as HTMLElement | null,
  /** True while the open detail page runs the frame loop (it ticks on GSAP's ticker), so the carousel's loop doesn't also render. */
  external: false,
  /** Renders the canvas for this frame; a no-op until the lazily loaded stage arrives. */
  advance: (() => {}) as (seconds: number) => void,
};

type GoTo = (index: number, options?: { immediate?: boolean }) => void;

/**
 * Set by the carousel once Lenis is running; the keyboard and progress glyphs call it. `target` is
 * where the row is heading, so quick repeated steps count from there rather than from a car mid-flight.
 */
export const showroom: { goTo: GoTo; target: number } = { goTo: () => {}, target: 0 };
