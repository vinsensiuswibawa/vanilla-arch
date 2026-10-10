// The detail page's track as data (docs/overhaul.md step 3, positions measured from the storyboard in
// docs/storyboard/README.md). Everything is in `--u` units, the 1440 x 960 reference pixel, in track
// coordinates (x from the track's left edge, y from the top of the viewport). Shot 6d draws these as grey
// placeholder blocks; 6e to 6g replace them with content. Plain data, so Node and the browser share it.

export type Tone = "light" | "dark";
export type Layer = "behind" | "front";
/** field: the pale ground the car stands on; surface: a light front panel; panel: a dark front section; photo; type: text to come; card; control. */
export type Kind = "field" | "surface" | "panel" | "photo" | "type" | "card" | "control";

export interface Block {
  id: string;
  layer: Layer;
  kind: Kind;
  /** What the back pill and progress line read when this block is under them. Photos count as dark. */
  tone: Tone;
  label: string;
  /** Rendered with real content elsewhere (Detail.tsx's hero markup); Blocks.tsx skips it. */
  real?: true;
  x: number;
  w: number;
  /** From the top of the viewport. Omit with `bottom` to stand on the bottom margin instead. */
  y?: number;
  /** In u, or: full viewport height, full height above the spec bar, or full height inside 24 px margins. */
  h: number | "full" | "aboveBar" | "inset";
  /** Distance from the bottom of the viewport, in u. */
  bottom?: number;
}

export const BAR = 68;
/** The whole track, from the hero's left edge to the end of the enquiry section. */
export const TRACK = 15210;
/** Where section E is aligned in the viewport (frame 14), as a track x. */
export const ENQUIRY = 13770;

export const BLOCKS: Block[] = [
  // ---- Behind the car: pale fields and the large type the car passes in front of ----
  { id: "field-ab", layer: "behind", kind: "field", tone: "light", label: "Light field, photos to roof view", x: 1914, w: 2895, h: "full" },
  { id: "hero-name", layer: "behind", kind: "type", tone: "light", label: "Car name", real: true, x: 24, y: 100, w: 560, h: 430 },
  { id: "hero-make", layer: "behind", kind: "type", tone: "light", label: "Make · year", real: true, x: 24, y: 560, w: 300, h: 28 },
  { id: "field-cd", layer: "behind", kind: "field", tone: "light", label: "Light field, specs to price", x: 9328, w: 1225, h: "full" },
  { id: "field-e", layer: "behind", kind: "field", tone: "light", label: "Light field, enquiry", x: 13400, w: 1810, h: "full" },
  { id: "give-it", layer: "behind", kind: "type", tone: "light", label: "Give it", real: true, x: 13995, y: 200, w: 560, h: 130 },
  { id: "new-home", layer: "behind", kind: "type", tone: "light", label: "A new home", real: true, x: 14220, y: 770, w: 1000, h: 130 },

  // ---- In front of the car: photos, the dark sections, the price section, small text and buttons ----
  { id: "emblem", layer: "front", kind: "control", tone: "light", label: "Emblem", real: true, x: 1170, y: 24, w: 80, h: 64 },
  // 150, not the storyboard's 200 (user, 2026-10-09: the underline below it, width:100% of this box, was
  // trailing well past the text; -25% hugs "Jump to specs →" instead).
  { id: "jump", layer: "front", kind: "control", tone: "light", label: "Jump to specs →", real: true, x: 24, y: 612, w: 150, h: 36 },
  { id: "scroll-cue", layer: "front", kind: "type", tone: "light", label: "Scroll", real: true, x: 1252, bottom: BAR + 24, w: 20, h: 190 },
  { id: "a1", layer: "front", kind: "photo", tone: "dark", label: "A1 photo", real: true, x: 1318, y: 0, w: 620, h: "aboveBar" },
  { id: "a2", layer: "front", kind: "photo", tone: "dark", label: "A2 swap slot", real: true, x: 1794, y: 446, w: 530, h: 355 },
  { id: "a3", layer: "front", kind: "photo", tone: "dark", label: "A3 photo", real: true, x: 2700, y: 160, w: 542, h: 640 },
  // The about section is a front surface from the roof field's edge to the specs panel: the roof-view car holds
  // its pose underneath it, covered, from frame 5 until the dark section leaves in frame 9 (user, 2026-10-09).
  { id: "about-surface", layer: "front", kind: "surface", tone: "light", label: "B: about", x: 4809, w: 1919, h: "full" },
  { id: "about-label", layer: "front", kind: "type", tone: "light", label: "About the car", real: true, x: 4832, y: 240, w: 220, h: 24 },
  { id: "headline", layer: "front", kind: "type", tone: "light", label: "Headline", real: true, x: 4832, y: 420, w: 1000, h: 270 },
  { id: "about-body", layer: "front", kind: "type", tone: "light", label: "About paragraph", real: true, x: 4832, bottom: 24, w: 542, h: 120 },
  { id: "b-photo", layer: "front", kind: "photo", tone: "dark", label: "B photo 480 × 640", real: true, x: 6008, y: 160, w: 480, h: 640 },

  { id: "specs", layer: "front", kind: "panel", tone: "dark", label: "C: specs", x: 6728, w: 2600, h: "full" },
  { id: "c-band", layer: "front", kind: "photo", tone: "dark", label: "Photo band", real: true, x: 6728, y: 0, w: 1196, h: 360 },
  { id: "c-label", layer: "front", kind: "type", tone: "dark", label: "Listed car specifications", real: true, x: 6752, bottom: 24, w: 330, h: 20 },
  // Widened from the storyboard's 358/358 (user, 6f): the longer engine and spec values (e.g. "3.0 L
  // 930/50 turbocharged flat-six") truncated with no room to spare; table B shifts right to match, still
  // well clear of the summary block (x 8224) that occupies this panel's second screen, not this one.
  // Both columns carry the same seven rows, so both get the same height (user, 2026-10-10: at 392/336
  // their hairlines didn't line up between the two halves). y 450 (not 476): the button is now bottom-
  // anchored (below) rather than y+h, so this just needs a safe gap above wherever the button's own 44px
  // touch-target floor pushes its top at the narrowest supported width (1024, step 3) — verified ~18px
  // clear there, comfortably more at 1440+.
  { id: "c-table-a", layer: "front", kind: "type", tone: "dark", label: "Spec table", real: true, x: 7160, y: 450, w: 410, h: 392 },
  { id: "c-table-b", layer: "front", kind: "type", tone: "dark", label: "Spec table", real: true, x: 7618, y: 450, w: 410, h: 392 },
  // Bottom-anchored like "Our take"/"To keep in mind" (user, 2026-10-10: top-anchored with a fixed `h`,
  // the button's own 44px touch-target floor — real height on any viewport narrower than the 1440
  // reference — grew it *downward* past their shared baseline instead of keeping it, the same bug the
  // take/keep height:auto fix solved for text; "align to the button['s box], not the text inside it"
  // was the diagnosis: the mismatch was the button's real rendered bottom against its nominal y+h, not
  // its label's baseline).
  { id: "c-overlay", layer: "front", kind: "control", tone: "dark", label: "See equipment and ownership history", real: true, x: 7618, bottom: 24, w: 410, h: 44 },
  // Widened from the storyboard's 999 (see --type-summary in app/globals.css) for the same reason: more room
  // per line keeps the longest approved summaries to five lines. y moved up from 330 (user, 2026-10-10:
  // more clearance above "Our take"/"To keep in mind").
  { id: "c-summary", layer: "front", kind: "type", tone: "dark", label: "Summary quote", real: true, x: 8224, y: 270, w: 1080, h: 310 },
  // `h` is nominal only: these two render at `height: auto` (Detail.tsx) so a longer paragraph grows
  // upward from the shared 24u bottom margin instead of overflowing past it (user, 2026-10-10: "Our take"
  // and "To keep in mind" landed at different bottom edges depending on their text length).
  { id: "c-take", layer: "front", kind: "type", tone: "dark", label: "Our take", real: true, x: 8224, bottom: 24, w: 440, h: 100 },
  { id: "c-keep", layer: "front", kind: "type", tone: "dark", label: "To keep in mind", real: true, x: 8752, bottom: 24, w: 470, h: 100 },

  // Runs up to the slideshow, so the side-view car stays hidden in the gap between them (frame 11).
  { id: "price-panel", layer: "front", kind: "surface", tone: "light", label: "D: price", x: 10553, w: 747, h: "full" },
  { id: "price-card", layer: "front", kind: "card", tone: "light", label: "Price and strip chart", real: true, x: 10577, y: 24, w: 564, h: 326 },
  { id: "price-more", layer: "front", kind: "card", tone: "light", label: "Further datasets", real: true, x: 10577, y: 374, w: 564, h: 562 },

  { id: "slideshow", layer: "front", kind: "panel", tone: "dark", label: "Slideshow", x: 11300, w: 2100, h: "full" },
  { id: "s-tall", layer: "front", kind: "photo", tone: "dark", label: "Tall photo", real: true, x: 11324, y: 24, w: 607, h: "inset" },
  { id: "s-swap", layer: "front", kind: "photo", tone: "dark", label: "Swap slot", real: true, x: 11780, y: 240, w: 465, h: 480 },
  { id: "s-third", layer: "front", kind: "photo", tone: "dark", label: "Third photo", real: true, x: 12288, y: 24, w: 720, h: 400 },
  // Right edge on the third photo's right edge (13008), as in frame 12; at 12731 it ran 43u past it and its
  // arrow sat off screen at the frame-12 position (6h).
  { id: "s-all", layer: "front", kind: "control", tone: "dark", label: "See all of this car's images →", real: true, x: 12688, bottom: 24, w: 320, h: 28 },

  { id: "inquire", layer: "front", kind: "control", tone: "light", label: "Inquire about this car here →", real: true, x: 14950, y: 430, w: 240, h: 100 },
];

const byId = new Map(BLOCKS.map((block) => [block.id, block]));
export const block = (id: string) => {
  const found = byId.get(id);
  if (!found) throw new Error(`detail layout: no block "${id}"`);
  return found;
};

/** Where each section settles, as a track x; the keyboard steps through these and Jump to specs goes to "specs". */
export const STOPS = [
  { id: "hero", x: 0 },
  { id: "photos", x: 1354 },
  { id: "about", x: 4142 },
  { id: "specs", x: 6728 },
  { id: "price", x: 9726 },
  { id: "slideshow", x: 10805 },
  { id: "enquiry", x: ENQUIRY },
] as const;

/** Scroll positions (u) of the storyboard's 14 frames, for the walk check. */
export const FRAMES = [0, 1354, 3242, 4142, 4710, 5542, 6728, 8118, 9128, 9726, 10805, 11593, 13172, 13770] as const;

/** A block's rectangle in u, for a viewport `height` u tall. */
export function rect(b: Block, height: number) {
  const h = b.h === "full" ? height : b.h === "aboveBar" ? height - BAR : b.h === "inset" ? height - 48 : b.h;
  const y = b.y ?? height - (b.bottom ?? 0) - h;
  return { x0: b.x, x1: b.x + b.w, y0: y, y1: y + h };
}

/** One `u` (Figma pixel) as a CSS length, for any value computed outside the fixed `BLOCKS` table. */
export const u = (n: number) => `calc(var(--u) * ${n})`;

/** A block's CSS height, in the same terms `rect` resolves numerically. */
export const heightOf = (h: Block["h"]) => (h === "full" ? "100%" : h === "aboveBar" ? `calc(100% - ${u(BAR)})` : h === "inset" ? `calc(100% - ${u(48)})` : u(h));

/** A block's CSS position, for both Blocks.tsx's placeholders and any real content standing in a block's place. */
export function styleOf(b: Block): { left: string; width: string; height: string; top?: string; bottom?: string } {
  return {
    left: u(b.x),
    width: u(b.w),
    height: heightOf(b.h),
    ...(b.y !== undefined ? { top: u(b.y) } : b.bottom !== undefined ? { bottom: u(b.bottom) } : { top: "0" }),
  };
}

/** The tone under a point (track x, viewport y, both in u): dark if a dark front block covers it. */
export function toneAt(x: number, y: number, height: number): Tone {
  for (const b of BLOCKS) {
    if (b.layer !== "front" || b.tone !== "dark" || (b.kind !== "panel" && b.kind !== "photo")) continue;
    const r = rect(b, height);
    if (x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1) return "dark";
  }
  return "light";
}

/**
 * The three camera transitions as scroll ranges in px (docs/overhaul.md, step 4): T1 runs from the last
 * photo of A leaving to the about block reaching its frame-4 place, T2 from the specs panel's edge at 14%
 * of the viewport width to the price card at its frame-10 place, T3 from the slideshow's edge at 16% to
 * section E aligned. `travel` caps the last one on a wide screen, where E can't reach the left edge.
 */
export function cueRanges(u: number, vw: number, travel: number): [number, number][] {
  const end = (v: number) => Math.min(v, travel);
  const t1: [number, number] = [(block("a3").x + block("a3").w) * u, block("headline").x * u - 690 * u];
  const t2: [number, number] = [(block("specs").x + block("specs").w) * u - 0.14 * vw, block("price-card").x * u - 851 * u];
  const t3: [number, number] = [(block("slideshow").x + block("slideshow").w) * u - 0.16 * vw, end(ENQUIRY * u)];
  const out: [number, number][] = [];
  let floor = 0;
  for (const [start, stop] of [t1, t2, t3]) {
    const to = Math.max(end(stop), floor + 1);
    const from = Math.min(Math.max(start, floor), to - 1);
    out.push([from, to]);
    floor = to;
  }
  return out;
}

/** The camera's progress along P0 to P3 (0 to 3) for a scroll position, given the three ranges. */
export function progressAt(scroll: number, ranges: readonly [number, number][]) {
  let progress = 0;
  for (const [from, to] of ranges) progress += Math.min(1, Math.max(0, (scroll - from) / (to - from)));
  return progress;
}
