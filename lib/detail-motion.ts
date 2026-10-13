// The detail page's motion vocabulary (docs/overhaul.md, step 2) as GSAP values. The CSS twins are the
// --ease-* and --dur-* tokens in app/globals.css; change both together. Effects (M1 to M12) are built
// on these in shot 6e; this file holds only the numbers. The showroom's own motion spec stays in lib/motion.ts.

export const ease = {
  reveal: "power3.out", // text rises, image clips, sidebars arriving; the default
  settle: "expo.out", // the car arriving from the carousel
  travel: "power3.inOut", // GSAP has no name for the camera's curve; see `travelBezier`, which lib/choreography.ts uses
  swap: "power2.out", // the image-swap wipe
  fade: "sine.out", // opacity-only chrome
  leave: "power2.out", // closing sidebars and overlays: ease-out like everything else (was power2.in until /review-animations after 6h)
  linear: "none", // scroll-tied effects: the scroll supplies the feel
} as const;

/**
 * The camera transitions' curve (the `travel` token; CSS twin `--ease-travel`): very gentle at the start, fastest
 * about two thirds of the way, then a long soft landing (user, 2026-10-09: first `power2.inOut`, then too
 * snappy at the end). As cubic-bezier(x1, y1, x2, y2): about 5% of the move happens in the first 27% of the
 * scroll range, 88% in the first 80%, and the last 10% of the range moves under 2%.
 */
export const travelBezier = [0.8, 0, 0.45, 1] as const;

/**
 * The extra lag between the wheel and the page, in seconds (ScrollTrigger `scrub`). Normal is Boring's floaty
 * feel at 1; 0 gives the Lenis-only alternative to compare later. The camera reads the same lagged position.
 */
export const SCROLL_LAG = 1;

/** Lenis on the detail page: smoothing, and the length of "Jump to specs" and the keyboard's section steps. */
export const scrollFeel = { lerp: 0.1, jump: 1.2 } as const;

/** Seconds, unless the name says otherwise. Triggers are shares of the viewport along the x axis. */
export const effect = {
  lineRise: { yPercent: 100, duration: 0.9, stagger: 0.08, ease: ease.reveal, trigger: 0.85 }, // M1
  charRise: { yPercent: 110, duration: 0.8, stagger: 0.03, lineOffset: 0.12, ease: ease.reveal, trigger: 0.8 }, // M2
  scrollText: { from: 0.2, to: 1, start: 0.9, end: 0.45 }, // M3: opacity per character, scroll-tied
  imageReveal: { clipDuration: 1.2, innerDuration: 1.5, innerYPercent: 15, ease: ease.reveal, trigger: 0.8, zoomFrom: 1.05, zoomDelay: 0.6, zoomDuration: 1.4 }, // M4
  imageSwap: { clipDuration: 1.4, scaleDuration: 1.9, scaleFrom: 1.15, clipEase: ease.swap, scaleEase: ease.reveal }, // M5
  parallax: { xPercent: 6, frameScale: 1.12 }, // M6: inner photo drifts -6 to +6 %, rendered 112 % wide
  // M7 (7c): each element's speed against the page; behind-layer type below 1; E's two heading lines share one speed since they stack (after 7f)
  depthDrift: { name: 0.82, make: 0.88, jump: 0.94, giveIt: 0.85, newHome: 0.85 },
  frameDrift: { k: 0.12 }, // M14 (7c): small overlapping photos move at 1.12x the page: offset -(x - xc) * k
  ruleDraw: { duration: 1.2, stagger: 0.06, ease: ease.reveal, hoverDuration: 0.3 }, // M8
  // M9 (after 7f): section E's headings and form link fade 0 → 1 with the scroll over `scrollText`'s start/end range
  barExit: { share: 0.3 }, // M10: last 30 % of the bar's travel, over section A's final 25 %
  sidebar: { duration: 0.8, scrimDuration: 0.6, scrimOpacity: 0.4, leaveDuration: 0.5 }, // M11
  chromeFade: { duration: 0.6, ease: ease.fade }, // M12
  // M13 (7b, user-approved): the price module's tab switch. The incoming panel's text, chart box and caption rise 8 px
  // while fading in; dots grow from 0.85 (never from 0); the history line draws along its clip, then its points fade.
  tabSwitch: { duration: 0.3, ease: ease.reveal, y: 8, stagger: 0.05, dotScale: 0.85, dotStagger: 0.012, scatterDelay: 0.05, pointsDuration: 0.2 },
} as const;

/** The hero entry from the carousel, one 2.4 s timeline (step 2): seconds from the start. */
export const entry = {
  total: 2.4,
  grow: 1.6, // the car's view grows to the viewport; the camera eases to the hero pose
  chromeOut: 0.4, // the carousel's other frames fade
  name: 0.7,
  makeYear: 1.1,
  bar: 1.2,
  firstPhoto: 1.4,
  chromeIn: 1.6,
  turntableRamp: 1.2,
  scrollFastForward: 0.3, // scrolling during the entry compresses what is left to this
  deepLinkFade: 0.8,
  leaveFade: 0.6,
} as const;

/** Reduced motion: triggered effects become an opacity fade, swaps a crossfade (step 2). */
export const reduced = { fade: 0.3, swapFade: 0.4, sidebarFade: 0.3 } as const;
