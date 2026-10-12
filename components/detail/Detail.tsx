"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { PerspectiveCamera } from "three";
import { Blocks } from "@/components/detail/Blocks";
import { Enquiry } from "@/components/detail/Enquiry";
import { Gallery } from "@/components/detail/Gallery";
import { PriceModule, prepareChartReveal } from "@/components/detail/PriceCharts";
import { CarName } from "@/components/experience/CarName";
import { toggleSound } from "@/components/experience/Chrome";
import shapes from "@/content/shapes.json";
import { play } from "@/lib/audio";
import { cars, getCar, type CarWithAssets, type Photo } from "@/lib/cars";
import { applyState, mixPose, arc as shortestArc, screenBox, solveAll, stateOf } from "@/lib/choreography";
import { detail, exit, leaveDetail, resetDetail, stepTurntable } from "@/lib/detail";
import { block, cueRanges, progressAt, STOPS, styleOf, toneAt, TRACK, u } from "@/lib/detail-layout";
import { barExit, charRise, chromeFade, depthOffset, depthSetter, frameDrift, frameOffset, imageReveal, imageSwap, lineRise, parallax, ruleDraw, scrollText, sideEntrance, splitChars, splitLines } from "@/lib/detail-fx";
import { ease, effect, entry, reduced as reducedTokens, SCROLL_LAG, scrollFeel } from "@/lib/detail-motion";
import { formatKilometres, formatMiles, formatPrice } from "@/lib/format";
import { FRAMES } from "@/lib/frames";
import { carouselPose } from "@/lib/handoff";
import { fromData, type ShapeData } from "@/lib/shape";
import { runtime } from "@/lib/showroom";
import { useArcade } from "@/lib/store";

const SHAPES = shapes as unknown as Record<string, ShapeData>;
/** The back pill's centre, in px from the top left: where the page asks "light or dark under here?". */
const PILL = { x: 24 + 56, y: 24 + 18 };
/** The spec bar leaves over the end of section A and the start of T1: a scroll range, in u, around T1's start. */
const BAR_EXIT = { before: 487, after: 146 };
/** Make/year sits exactly 24px below the name's last line of text, and "Jump to specs" exactly 12px below
 * make/year (user, after 6h), at any width and for any name length. Literal px, like the grid's margins, not
 * `--u`. Module scope so the render's first-paint estimate and the layout effect's measured reposition share them. */
const MAKE_GAP_PX = 24;
const JUMP_GAP_PX = 12;
const MAKE_SIZE = 24;
const JUMP_SIZE = 12;
const EMBLEM_WIDTH = 140;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Drops nulls from a ref list; the result is a plain array, assignable wherever the fx factories expect `Targets`. */
const live = (els: (Element | null)[]): Element[] => els.filter((el): el is Element => el !== null);

/** Section C's spec table rows (docs/overhaul-copy.md, "Spec table rows"). */
/** [label, value, numeral]: `numeral` rows get the mono face (CLAUDE.md's "Geist Mono (numerals)"),
 * matching the bottom bar's price. */
const specRowsLeft = (car: CarWithAssets): [string, string, boolean?][] => [
  ["Make", car.make],
  // The chassis only when the model name doesn't already carry it ("Gallardo LP 560-4 · LP 560-4", 6h).
  ["Model", car.model.includes(car.chassis) ? car.model : `${car.model} · ${car.chassis}`],
  ["Mileage", `${formatMiles(car.mileageMi)} · ${formatKilometres(car.mileageMi)}`, true],
  ["Location", car.location],
  ["Body style", car.bodyStyle],
  ["Drivetrain", car.spec.drivetrain],
  ["Transmission", car.spec.transmission],
];
const specRowsRight = (car: CarWithAssets): [string, string, boolean?][] => [
  ["Engine", car.spec.engine],
  ["Displacement", `${car.spec.displacementCc.toLocaleString("en-US")} cc`, true],
  ["Power", `${car.spec.powerPs} PS · ${car.spec.powerHp} hp`, true],
  ["Torque", `${car.spec.torqueNm} Nm · ${car.spec.torqueLbFt} lb-ft`, true],
  ["Exterior colour", car.colors.paint.name],
  ["Interior colour", car.colors.interior.name],
  ["Seller type", car.sellerType],
];

/** M5's swap slot (section A2, section B's photo): photos stacked by `zIndex` (first on top), each layer's own
 * clip-path wiping it away to uncover the next; `parallax` wraps the whole stack in the 112%-wide drifting
 * layer M6 needs, so a slot can carry both at once without the two effects fighting over the same element. The
 * Page effect drives both per tick by querying `[data-swap-layer]` / `[data-swap-inner]` / `[data-swap-parallax]`. */
function SwapSlot({ id, photos, sizes, parallax: withParallax }: { id: string; photos: Photo[]; sizes: string; parallax?: boolean }) {
  if (!photos.length) return null;
  return (
    <div data-block={id} data-tone="dark" className="absolute overflow-hidden" style={styleOf(block(id))}>
      <div data-reveal-inner className="absolute inset-0">
        <div
          {...(withParallax ? { "data-swap-parallax": "" } : {})}
          className="absolute top-0"
          style={withParallax ? { left: "-6%", width: "112%", height: "100%" } : { inset: 0 }}
        >
          {photos.map((photo, i) => (
            <div key={photo.src} data-swap-layer className="absolute inset-0" style={{ zIndex: photos.length - i, clipPath: "inset(0)" }}>
              <div data-swap-inner className="absolute inset-0">
                <Image src={photo.src} alt={photo.alt} fill sizes={sizes} className="object-cover" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * M2's char rise, grouped by word: each word is its own `inline-block, white-space: nowrap` span so the browser
 * can only break the line between words, not between the individual `inline-block` character spans a naive
 * char-by-char split would otherwise offer as break points — reproduced on the section B headline (verified in
 * the walk at 1440: "THE BENCHMARK" broke as "THE / BENCH-MARK" without this). Characters still need
 * `inline-block` themselves, since CSS transforms don't apply to plain inline boxes. Indices are assigned once
 * per render, in document order, so repeated ref-callback invocations across re-renders stay idempotent.
 */
function charRiseLine(text: string, li: number, linesRef: React.MutableRefObject<HTMLSpanElement[][]>): React.ReactNode[] {
  const words = text.split(" ");
  const nodes: React.ReactNode[] = [];
  let ci = 0;
  words.forEach((word, wi) => {
    if (wi > 0) nodes.push(" ");
    const index0 = ci;
    nodes.push(
      <span key={`w${wi}`} className="inline-block" style={{ whiteSpace: "nowrap" }}>
        {splitChars(word).map((ch, i) => {
          const index = index0 + i;
          return (
            <span
              key={index}
              ref={(el) => {
                if (!el) return;
                (linesRef.current[li] ??= [])[index] = el;
              }}
              className="inline-block"
            >
              {ch}
            </span>
          );
        })}
      </span>,
    );
    ci += word.length;
  });
  return nodes;
}

/** M3's characters, the same word-safe grouping as `charRiseLine` but without `inline-block` on each character
 * (opacity alone doesn't need it, and plain inline text only ever breaks at real whitespace). */
function scrollTextWords(text: string, reduced: boolean): React.ReactNode[] {
  const words = text.split(" ");
  const nodes: React.ReactNode[] = [];
  words.forEach((word, wi) => {
    if (wi > 0) nodes.push(" ");
    nodes.push(
      <span key={`w${wi}`} style={{ whiteSpace: "nowrap" }}>
        {splitChars(word).map((ch, ci) => (
          <span key={ci} data-summary-char style={{ opacity: reduced ? 1 : 0.2 }}>
            {ch}
          </span>
        ))}
      </span>,
    );
  });
  return nodes;
}

/**
 * The detail page (docs/overhaul.md): an overlay state of the one experience, mounted when a listing is open.
 * Three stacks share the one horizontal track: a "behind" layer under the persistent canvas, the canvas with
 * the car (drawn by DetailScene), and a "front" layer over it. The page is vertical scroll mapped 1:1 to sideways
 * travel: Lenis smooths the wheel, one ScrollTrigger timeline (with `SCROLL_LAG`) moves both tracks, and the
 * camera reads that same lagged position, so the car and the DOM stay in lockstep. One GSAP ticker drives
 * everything, so each frame renders once, after the DOM has moved.
 */
export default function Detail() {
  const slug = useArcade((state) => state.listing);
  const car = slug ? getCar(slug) : undefined;
  return car ? <Page key={car.slug} car={car} /> : null;
}

function Page({ car }: { car: CarWithAssets }) {
  const root = useRef<HTMLElement>(null);
  const probe = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const front = useRef<HTMLDivElement>(null);
  const behind = useRef<HTMLDivElement>(null);
  const viewSlot = useRef<HTMLDivElement>(null);
  const drag = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const facts = useRef<HTMLDListElement>(null);
  const price = useRef<HTMLParagraphElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const name = useRef<HTMLHeadingElement>(null);
  const nameChars = useRef<HTMLSpanElement[][]>([]);
  const make = useRef<HTMLParagraphElement>(null);
  const jumpBtn = useRef<HTMLButtonElement>(null);
  /** Set once per car by the main effect's `layout()`; re-run after every render (not just resize) by the
   * dependency-free effect below, since React rewrites `make`/`jumpBtn`'s inline `top` from the render-time
   * estimate on any re-render (a sound/phase toggle, say), undoing the measured correction otherwise. */
  const repositionName = useRef<() => void>(() => {});
  const emblem = useRef<HTMLDivElement>(null);
  const scrollCue = useRef<HTMLParagraphElement>(null);
  const backPill = useRef<HTMLAnchorElement>(null);
  const soundBtn = useRef<HTMLButtonElement>(null);
  const a1Frame = useRef<HTMLDivElement>(null);
  const a1Inner = useRef<HTMLDivElement>(null);
  const a3Frame = useRef<HTMLDivElement>(null);
  const a3Inner = useRef<HTMLDivElement>(null);
  const aboutLabel = useRef<HTMLHeadingElement>(null);
  const priceTitle = useRef<HTMLHeadingElement>(null);
  const headline = useRef<HTMLParagraphElement>(null);
  const headlineChars = useRef<HTMLSpanElement[][]>([]);
  const priceVerdictChars = useRef<HTMLSpanElement[][]>([]);
  const aboutBodyP = useRef<HTMLParagraphElement>(null);
  const aboutBodyInner = useRef<HTMLSpanElement>(null);
  const cBandFrame = useRef<HTMLDivElement>(null);
  const cBandInner = useRef<HTMLDivElement>(null);
  const cLabel = useRef<HTMLHeadingElement>(null);
  const tableA = useRef<HTMLDListElement>(null);
  const tableB = useRef<HTMLDListElement>(null);
  const cOverlay = useRef<HTMLButtonElement>(null);
  const summaryRef = useRef<HTMLParagraphElement>(null);
  const cTake = useRef<HTMLDivElement>(null);
  const cTakeLabel = useRef<HTMLParagraphElement>(null);
  const cTakeBody = useRef<HTMLSpanElement>(null);
  const cKeep = useRef<HTMLDivElement>(null);
  const cKeepLabel = useRef<HTMLParagraphElement>(null);
  const cKeepBody = useRef<HTMLSpanElement>(null);
  const sTallFrame = useRef<HTMLDivElement>(null);
  const sTallInner = useRef<HTMLDivElement>(null);
  const sThirdFrame = useRef<HTMLDivElement>(null);
  const sThirdInner = useRef<HTMLDivElement>(null);
  const giveIt = useRef<HTMLParagraphElement>(null);
  const newHome = useRef<HTMLParagraphElement>(null);
  const fieldETrigger = useRef<HTMLDivElement>(null);
  const jump = useRef<() => void>(() => {});
  const phase = useArcade((state) => state.phase);
  const sound = useArcade((state) => state.sound);
  const router = useRouter();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryModal, setEnquiryModal] = useState(false);
  /** The scroll-triggered, non-modal enquiry is open: the tick closes it once the visitor heads away from E. */
  const enquiryAuto = useRef(false);

  useLayoutEffect(() => {
    if (phase === "showroom") heading.current?.focus({ preventScroll: true });
  }, [phase]);

  useLayoutEffect(() => {
    const rootEl = root.current!;
    const scrollerEl = scroller.current!;
    const contentEl = content.current!;
    const frontEl = front.current!;
    const behindEl = behind.current!;
    const viewSlotEl = viewSlot.current!;
    const dragEl = drag.current;
    const lineEl = line.current!;
    const barEl = bar.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shape = fromData(SHAPES[car.slug]);
    gsap.registerPlugin(ScrollTrigger);

    resetDetail(gsap.ticker.time, reduced);
    runtime.reducedMotion = reduced;

    let u = 1;
    let travel = 1;
    let ranges: [number, number][] = [];
    let stops: number[] = [];
    // M3's trigger range (the summary block's left edge at 90% of the viewport to its centre at 45%) and M5/M6's
    // slot geometry: all depend on `u` and the viewport width, so layout() keeps them current across resizes.
    let summaryStart = 0;
    let summaryEnd = 1;
    const a2Swap = { timelines: [] as gsap.core.Animation[], left: 0, width: 0 };
    const bPhotoSwap = { timelines: [] as gsap.core.Animation[], left: 0, width: 0 };
    const bPhotoFrame = { left: 0, width: 0 };
    const sSwap = { timelines: [] as gsap.core.Animation[], left: 0, width: 0 };
    const layout = () => {
      u = probe.current!.getBoundingClientRect().width || 1;
      const w = rootEl.clientWidth;
      const h = rootEl.clientHeight;
      const total = TRACK * u;
      travel = Math.max(1, total - w);
      contentEl.style.height = `${h + travel}px`;
      frontEl.style.width = behindEl.style.width = `${total}px`;
      ranges = cueRanges(u, w, travel);
      stops = STOPS.map((stop) => Math.min(stop.x * u, travel));
      detail.viewport = { w, h };
      detail.solved = solveAll(car.slug, shape, w / h);
      const summaryBlock = block("c-summary");
      summaryStart = summaryBlock.x * u - 0.9 * w;
      summaryEnd = summaryBlock.x * u + (summaryBlock.w * u) / 2 - 0.45 * w;
      const setLeftWidth = (id: string, target: { left: number; width: number }) => {
        const b = block(id);
        target.left = b.x * u;
        target.width = b.w * u;
      };
      setLeftWidth("a2", a2Swap);
      setLeftWidth("b-photo", bPhotoSwap);
      setLeftWidth("b-photo", bPhotoFrame);
      setLeftWidth("s-swap", sSwap);
      // The section-E trigger marker sits at the track's true resting scroll position (`travel`), not the
      // nominal `ENQUIRY` track constant: the two aren't quite equal (the achievable `travel` runs a little
      // short of `ENQUIRY * u`, likely the scrollbar's own width shaving off client area) — found live-testing
      // at 1024 wide, the narrowest supported width: with the marker fixed at `ENQUIRY`, that gap left the
      // trigger just out of reach, so M9's reveal and the enquiry sidebar's auto-open never fired at all.
      if (fieldETrigger.current) fieldETrigger.current.style.left = `${travel}px`;
      if (dragEl) {
        // The hero's drag target covers the car where it stands at P0.
        const camera = new PerspectiveCamera();
        applyState(camera, stateOf(detail.solved[0]), w, h);
        const b = screenBox(camera, shape.hull, 0, w, h);
        const padX = (b.x1 - b.x0) * 0.06;
        const padY = (b.y1 - b.y0) * 0.1;
        Object.assign(dragEl.style, { left: `${b.x0 - padX}px`, top: `${b.y0 - padY}px`, width: `${b.x1 - b.x0 + 2 * padX}px`, height: `${b.y1 - b.y0 + 2 * padY}px` });
      }
      repositionName.current();
    };

    // The hero name: full size always (user, 2026-10-10: shrinking read as "really small" — revert). Instead
    // the box widens just enough to stop a single word (which the line mask's `overflow-hidden` would
    // otherwise clip, since a `white-space: nowrap` word can't wrap) from overflowing — "GALLARDO" clipped to
    // "GALLAR" at the fixed 560u width. Multi-word lines stay free to wrap if they still don't fit even at
    // that width. Then make/year and "Jump to specs" follow the name's *measured* rendered height, not the
    // line-count estimate the render used for first paint (a wrapped extra line, e.g. the Gallardo's
    // "LP 560-4", left them sitting inside it). Re-run after every render (see the `repositionName` ref),
    // since React rewrites make/jump's inline `top` back to the estimate on any re-render.
    repositionName.current = () => {
      const nameEl = name.current;
      if (!nameEl) return;
      const defaultWidth = block("hero-name").w * u;
      const words = Array.from(nameEl.querySelectorAll<HTMLElement>(":scope > span > span > span"));
      let widest = defaultWidth;
      for (const word of words) widest = Math.max(widest, word.scrollWidth);
      nameEl.style.width = `${widest}px`;
      // The last line's bottom, not the h2's: the h2 keeps its block's fixed 430u height, so measuring the box
      // left a one-line name ("TR6") with a gap of several lines below it (user, after 6h).
      // Measured in viewport px, then written relative to each element's own positioned container: make/year
      // sits in the behind layer and "Jump to specs" in the front one, which can sit a couple of px apart (2 px
      // at 1024 x 640). Heights from the unrounded rect, not `offsetHeight`.
      const lines = nameEl.querySelectorAll<HTMLElement>(":scope > span");
      const textBottom = (lines[lines.length - 1] ?? nameEl).getBoundingClientRect().bottom;
      const top = (el: HTMLElement) => (el.offsetParent as HTMLElement | null)?.getBoundingClientRect().top ?? 0;
      const makeEl = make.current;
      if (!makeEl) return;
      makeEl.style.top = `${textBottom + MAKE_GAP_PX - top(makeEl)}px`;
      const makeBottom = top(makeEl) + parseFloat(makeEl.style.top) + makeEl.getBoundingClientRect().height;
      if (jumpBtn.current) jumpBtn.current.style.top = `${makeBottom + JUMP_GAP_PX - top(jumpBtn.current)}px`;
    };
    layout();

    // ---- The hero entry (docs/overhaul.md step 2's table; the hand-off contract in step 4) ----------------
    //
    // Every entry-animated element is set to its hidden starting look immediately, synchronously, before the
    // first paint (useLayoutEffect), so a deep link never flashes the finished hero through the dissolving
    // gate. Only the actual *playback* (below) is gated on `phase === "showroom"`.
    const chromeEls = live([emblem.current, scrollCue.current, backPill.current, soundBtn.current]);
    const charEls = live(nameChars.current.flat());
    if (reduced) {
      gsap.set(live([name.current, make.current, jumpBtn.current, barEl, a1Frame.current]).concat(chromeEls), { opacity: 0 });
    } else {
      gsap.set(charEls, { yPercent: 110 });
      gsap.set(live([make.current, jumpBtn.current, facts.current, price.current]), { yPercent: 100 });
      gsap.set(barEl, { yPercent: 100, opacity: 0 });
      if (a1Frame.current) gsap.set(a1Frame.current, { clipPath: "inset(100% 0 0 0)" });
      if (a1Inner.current) gsap.set(a1Inner.current, { yPercent: 15 });
      gsap.set(chromeEls, { opacity: 0 });
    }

    const canvasEl = document.querySelector<HTMLCanvasElement>("canvas");
    let entryTweens: gsap.core.Animation[] = [];

    // Hand-off is only possible when the showroom was already open (you can only click a frame from
    // there); a deep link always mounts with `phase` still "gate". Decided once, synchronously, so the
    // *starting* look (below) can be applied immediately regardless of when playback is allowed to begin.
    const handoffIndex = useArcade.getState().phase === "showroom" ? cars.findIndex((c) => c.slug === car.slug) : -1;
    const frameRect = handoffIndex >= 0 ? runtime.slots[handoffIndex]?.getBoundingClientRect() : undefined;
    const isHandoff = Boolean(frameRect && frameRect.width > 0 && frameRect.height > 0);
    const toPose = detail.solved![0];
    const handoffPose = isHandoff ? carouselPose(car, FRAMES[car.frame]) : null;
    const handoffHeading = isHandoff ? runtime.heading[handoffIndex] ?? 0 : 0;
    const settlePose = { ...toPose, azimuth: toPose.azimuth + 2, distance: toPose.distance * 1.03 };

    const setGrow = (t: number) => {
      const rect = frameRect!;
      const vw = rootEl.clientWidth;
      const vh = rootEl.clientHeight;
      const w = rect.width + (vw - rect.width) * t;
      const h = rect.height + (vh - rect.height) * t;
      const x = rect.left * (1 - t);
      const y = rect.top * (1 - t);
      viewSlotEl.style.transform = `translate(${x}px, ${y}px) scale(${w / vw}, ${h / vh})`;
      detail.viewport = { w, h };
      detail.entryPose = mixPose(handoffPose!, toPose, t);
      detail.heading = handoffHeading + shortestArc(handoffHeading, 0) * t;
    };

    // The starting look, applied immediately (before paint) regardless of `phase`, so a deep link never
    // flashes the finished pose through the dissolving gate before its own entry gets to play.
    if (reduced) {
      if (canvasEl) canvasEl.style.opacity = "0";
    } else if (isHandoff) {
      setGrow(0);
      if (canvasEl) canvasEl.style.opacity = "1";
    } else {
      viewSlotEl.style.transform = "none";
      detail.viewport = { w: rootEl.clientWidth, h: rootEl.clientHeight };
      detail.entryPose = settlePose;
      if (canvasEl) canvasEl.style.opacity = "0";
    }

    const playContent = () => {
      if (reduced) {
        const all = live([name.current, make.current, jumpBtn.current, barEl, a1Frame.current]).concat(chromeEls);
        entryTweens.push(gsap.fromTo(all, { opacity: 0 }, { opacity: 1, duration: reducedTokens.fade, ease: ease.fade }));
        return;
      }
      const tl = gsap.timeline();
      const lines = nameChars.current.filter((l) => l.length);
      tl.add(charRise(lines, false), entry.name);
      tl.add(lineRise(live([make.current, jumpBtn.current]), false), entry.makeYear);
      tl.fromTo(barEl, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, ease: ease.reveal }, entry.bar);
      tl.add(lineRise(live([facts.current, price.current]), false), entry.bar + 0.1);
      if (a1Frame.current && a1Inner.current) tl.add(imageReveal(a1Frame.current, a1Inner.current, false), entry.firstPhoto);
      tl.add(chromeFade(chromeEls), entry.chromeIn);
      entryTweens.push(tl);
    };

    const finishEntry = () => {
      detail.entryPose = null;
      detail.entering = false;
      detail.angle = 0;
      detail.resumeAt = gsap.ticker.time;
      viewSlotEl.style.transform = "none";
      if (canvasEl) canvasEl.style.opacity = "1";
    };

    const playEntry = () => {
      if (reduced) {
        if (canvasEl) entryTweens.push(gsap.fromTo(canvasEl, { opacity: 0 }, { opacity: 1, duration: reducedTokens.fade, ease: ease.fade }));
        finishEntry();
      } else if (isHandoff) {
        const grow = { t: 0 };
        entryTweens.push(gsap.to(grow, { t: 1, duration: entry.grow, ease: ease.settle, onUpdate: () => setGrow(grow.t), onComplete: finishEntry }));
      } else {
        const settle = { t: 0 };
        entryTweens.push(
          gsap.to(settle, { t: 1, duration: entry.deepLinkFade, ease: ease.settle, onUpdate: () => (detail.entryPose = mixPose(settlePose, toPose, settle.t)), onComplete: finishEntry }),
        );
        if (canvasEl) entryTweens.push(gsap.to(canvasEl, { opacity: 1, duration: entry.deepLinkFade, ease: ease.fade }));
      }
      playContent();
    };

    let unsubscribePhase: (() => void) | null = null;
    if (useArcade.getState().phase === "showroom") {
      playEntry();
    } else {
      unsubscribePhase = useArcade.subscribe((state) => {
        if (state.phase === "showroom") {
          unsubscribePhase?.();
          unsubscribePhase = null;
          playEntry();
        }
      });
    }

    const fastForwardEntry = () => {
      if (!entryTweens.length) return;
      for (const t of entryTweens) {
        if (typeof (t as gsap.core.Animation).isActive === "function" && (t as gsap.core.Animation).isActive()) {
          gsap.to(t, { time: (t as gsap.core.Animation).duration(), duration: entry.scrollFastForward, ease: "none", overwrite: true });
        }
      }
      entryTweens = [];
    };

    const lenis = new Lenis({ wrapper: scrollerEl, content: contentEl, lerp: scrollFeel.lerp, smoothWheel: !reduced, syncTouch: false, autoRaf: false });
    lenis.on("scroll", () => {
      ScrollTrigger.update();
      fastForwardEntry();
    });
    // Lag smoothing off, so a slow frame doesn't change how far the page has travelled.
    gsap.ticker.lagSmoothing(0);

    const timeline = gsap.timeline({
      scrollTrigger: { trigger: contentEl, scroller: scrollerEl, start: 0, end: () => travel, scrub: reduced ? true : SCROLL_LAG, invalidateOnRefresh: true },
    });
    timeline.fromTo([frontEl, behindEl], { x: 0 }, { x: () => -travel, ease: ease.linear, duration: 1 });

    const revealOut = gsap.parseEase(ease.reveal);
    const scrollTo = (to: number) => {
      fastForwardEntry();
      // Deliberately navigating the page (keyboard stepping, Home/End, "Jump to specs") closes whichever
      // overlay is open: without this, the enquiry sidebar's full-screen scrim stayed up — and kept
      // intercepting clicks — even after scrolling all the way back to the hero, since nothing else ever
      // told it to close (found by the smoke test: "Jump to specs" became unclickable after Home).
      setGalleryOpen(false);
      setEnquiryOpen(false);
      setEnquiryModal(false);
      // Also cancels the sidebar's pending auto-open (the `gsap.delayedCall` scheduled after M9 fires, below):
      // closing an overlay that isn't open yet is a no-op, so without this a visitor who reached section E,
      // then navigated away inside that ~2 s window, would see the sidebar pop open later at a completely
      // different section — reproduced by the smoke test once the auto-open's own delay made this window real.
      for (const t of delayedCalls) t.kill();
      delayedCalls.length = 0;
      enquiryAuto.current = false;
      lenis.scrollTo(to, reduced ? { immediate: true, force: true } : { duration: scrollFeel.jump, easing: revealOut, force: true });
    };
    jump.current = () => scrollTo(stops[STOPS.findIndex((stop) => stop.id === "specs")]);

    // ---- Sections A to C (docs/overhaul.md step 6f) --------------------------------------------------------
    //
    // Triggered effects (M1, M2, M4, M8) hang off the same horizontal timeline via GSAP's `containerAnimation`,
    // so "85%" means exactly what step 2 says: this element's left edge at 85% of the viewport. Scroll-tied
    // effects (M3, M5's cadence, M6) are read per tick below, next to the bar exit and tone that already work
    // that way. Every ScrollTrigger created here is collected for cleanup; none of them survive a car change.
    const triggers: ScrollTrigger[] = [];
    const delayedCalls: gsap.core.Tween[] = [];
    const revealOnce = (el: Element | null, trigger: number, play: () => void, edge: "left" | "right" = "left") => {
      if (!el) return;
      triggers.push(ScrollTrigger.create({ trigger: el, containerAnimation: timeline, start: `${edge} ${trigger * 100}%`, once: true, onEnter: play }));
    };

    revealOnce(aboutLabel.current, effect.lineRise.trigger, () => lineRise(aboutLabel.current!, reduced));
    const headlineLines = headlineChars.current.filter((l) => l.length);
    if (reduced) gsap.set(live(headlineLines.flat()), { opacity: 0 });
    else gsap.set(headlineLines.flat(), { yPercent: effect.charRise.yPercent });
    revealOnce(headline.current, effect.charRise.trigger, () => charRise(headlineLines, reduced));

    const wireImageReveal = (frame: HTMLElement | null, inner: HTMLElement | null) => {
      if (!frame || !inner) return;
      if (reduced) gsap.set(frame, { opacity: 0 });
      else {
        gsap.set(frame, { clipPath: "inset(100% 0 0 0)" });
        gsap.set(inner, { yPercent: effect.imageReveal.innerYPercent, scale: effect.imageReveal.zoomFrom });
      }
      // User, 7d: reveal when the frame's left edge reaches 80% of the viewport. This reverses the 2026-10-10
      // "fully in frame" call (right edge at 100%), which read as late.
      revealOnce(frame, effect.imageReveal.trigger, () => imageReveal(frame, inner, reduced));
    };
    wireImageReveal(a3Frame.current, a3Inner.current);
    wireImageReveal(cBandFrame.current, cBandInner.current);
    const wireSlotReveal = (id: string) =>
      wireImageReveal(rootEl.querySelector<HTMLElement>(`[data-block="${id}"]`), rootEl.querySelector<HTMLElement>(`[data-block="${id}"] [data-reveal-inner]`));
    wireSlotReveal("a2");
    wireSlotReveal("b-photo");
    wireSlotReveal("s-swap");

    revealOnce(cLabel.current, effect.lineRise.trigger, () => lineRise(cLabel.current!, reduced));

    const wireSpecTable = (tableEl: HTMLElement | null, alongside?: () => void) => {
      if (!tableEl) return;
      const texts = Array.from(tableEl.querySelectorAll<HTMLElement>("[data-spec-text]"));
      const rules = Array.from(tableEl.querySelectorAll<HTMLElement>("[data-spec-rule]"));
      if (reduced) gsap.set(live([...texts, ...rules]), { opacity: 0 });
      else {
        gsap.set(texts, { yPercent: effect.lineRise.yPercent });
        gsap.set(rules, { scaleX: 0 });
      }
      revealOnce(tableEl, effect.lineRise.trigger, () => {
        lineRise(live(texts), reduced);
        ruleDraw(rules, reduced);
        alongside?.();
      });
    };
    wireSpecTable(tableA.current);
    // The equipment button never moves (7c): it fades in with the first row and the rule draw (M12), not as the
    // 15th item of the stagger.
    if (cOverlay.current) gsap.set(cOverlay.current, { opacity: 0 });
    wireSpecTable(tableB.current, () => {
      if (cOverlay.current) chromeFade(cOverlay.current);
    });

    const wireProse = (container: HTMLElement | null, body: HTMLElement | null) => {
      if (!container || !body) return;
      const lines = splitLines(body);
      if (reduced) gsap.set(live(lines), { opacity: 0 });
      else gsap.set(lines, { yPercent: effect.lineRise.yPercent });
      revealOnce(container, effect.lineRise.trigger, () => lineRise(lines, reduced, { stagger: effect.lineRise.stagger }));
    };
    const wireLabelledProse = (container: HTMLElement | null, label: HTMLElement | null, body: HTMLElement | null) => {
      if (!container || !label || !body) return;
      const lines = splitLines(body);
      if (reduced) gsap.set(live([label, ...lines]), { opacity: 0 });
      else {
        gsap.set(label, { yPercent: effect.lineRise.yPercent });
        gsap.set(lines, { yPercent: effect.lineRise.yPercent });
      }
      revealOnce(container, effect.lineRise.trigger, () => {
        lineRise(label, reduced);
        lineRise(lines, reduced, { stagger: effect.lineRise.stagger });
      });
    };
    wireProse(aboutBodyP.current, aboutBodyInner.current);
    wireLabelledProse(cTake.current, cTakeLabel.current, cTakeBody.current);
    wireLabelledProse(cKeep.current, cKeepLabel.current, cKeepBody.current);

    // M3: the summary's characters brighten as the block crosses the screen (scroll-tied, read in the tick
    // loop below); under reduced motion they simply show at full opacity (step 2's reduced-motion table).
    const summaryChars = summaryRef.current ? Array.from(summaryRef.current.querySelectorAll<HTMLElement>("[data-summary-char]")) : [];
    if (reduced) for (const el of summaryChars) el.style.opacity = "1";

    // M5: one paused timeline per swap boundary (from lib/detail-fx.ts's `imageSwap`), driven by `.progress()`
    // from the scroll position each tick rather than played once, so the cadence is a pure, reversible function
    // of scroll (docs/overhaul.md step 2's cadence note) even though the factory's own durations describe its feel.
    const buildSwapTimelines = (id: string) => {
      const slot = rootEl.querySelector<HTMLElement>(`[data-block="${id}"]`);
      if (!slot) return [];
      const layers = Array.from(slot.querySelectorAll<HTMLElement>("[data-swap-layer]"));
      const inners = Array.from(slot.querySelectorAll<HTMLElement>("[data-swap-inner]"));
      if (layers.length < 2) return [];
      return layers.slice(0, -1).map((top, i) => {
        const tl = imageSwap(top, inners[i + 1], reduced);
        tl.pause(0);
        return tl;
      });
    };
    a2Swap.timelines = buildSwapTimelines("a2");
    bPhotoSwap.timelines = buildSwapTimelines("b-photo");
    sSwap.timelines = buildSwapTimelines("s-swap");
    const bPhotoParallaxEl = rootEl.querySelector<HTMLElement>('[data-block="b-photo"] [data-swap-parallax]');

    // ---- Section D: the slideshow's two single-photo reveals, and the price charts (docs/overhaul.md step 6g) --
    wireImageReveal(sTallFrame.current, sTallInner.current);
    wireImageReveal(sThirdFrame.current, sThirdInner.current);
    // Step 5: "when the section arrives (triggered at 80%)" — the strip's line draws, then its dots and the
    // further datasets' axes and marks, via `prepareChartReveal`'s own `data-rule`/`data-mark` lookup (the
    // same shape `wireSpecTable` already uses for section C's rules and text).
    // The chart marks mount a commit after this effect (each chart measures its box first), so the hidden
    // starting state is set a frame later; the section is screens away from the viewport at that point.
    const priceModuleEl = rootEl.querySelector<HTMLElement>('[data-block="price-module"]');
    const prepareFrame = requestAnimationFrame(() => {
      if (priceModuleEl) {
        // 7b: the verdict headline is the section's M2, started with the rest of the module's reveal.
        const verdictLines = priceVerdictChars.current.filter((l) => l.length);
        if (reduced) gsap.set(live(verdictLines.flat()), { opacity: 0 });
        else gsap.set(verdictLines.flat(), { yPercent: effect.charRise.yPercent });
        const playCharts = prepareChartReveal(priceModuleEl, reduced);
        revealOnce(priceModuleEl, 0.8, () => {
          playCharts();
          charRise(verdictLines, reduced);
        });
      }
    });
    // The section title rises like "About the car" (M1); it starts hidden under its own overflow mask.
    if (priceTitle.current) gsap.set(priceTitle.current, reduced ? { opacity: 0 } : { yPercent: effect.lineRise.yPercent });
    revealOnce(priceTitle.current, effect.lineRise.trigger, () => lineRise(priceTitle.current!, reduced));

    // ---- Section E: "Give it" / "a new home" (M9, its first live use), and the enquiry sidebar (M11) -------
    if (giveIt.current) gsap.set(giveIt.current, reduced ? { opacity: 0 } : { xPercent: -effect.sideEntrance.xPercent, opacity: 0 });
    if (newHome.current) gsap.set(newHome.current, reduced ? { opacity: 0 } : { xPercent: effect.sideEntrance.xPercent, opacity: 0 });
    // `fieldETrigger` (not the "field-e" block itself): that block lives in the *behind* layer, a separate
    // `position: fixed` tree outside `scroller`/`content` entirely — `ScrollTrigger`'s `containerAnimation`
    // trigger math never fired against it (verified: it calibrates fine against front-layer elements, which
    // sit inside the real scroller). This marker carries the same track geometry in the front layer instead.
    //
    // It's positioned (in `layout()`, above) at the track's true resting scroll position, not "field-e"'s
    // block x: that block starts right where the slideshow ends and includes the D-to-E gap (step 3), so the
    // generic M1-style 70%/40% thresholds fired against it long before T3 (the side-to-front camera move) had
    // even started — verified visually: at the storyboard-13 scroll position, "GIVE IT" was already mid-reveal
    // and the sidebar already open while the car was still in its side pose. Anchored at rest instead, a small
    // trigger value means "fires once the track is nearly or fully settled".
    revealOnce(fieldETrigger.current, 0.1, () => sideEntrance(live([giveIt.current]), live([newHome.current]), reduced));
    // The sidebar opens once per visit (step 3), timed off M9 rather than its own scroll trigger: two
    // independent scroll-position triggers can't guarantee the text finishes its 1.4 s + 0.15 s reveal before
    // the sidebar covers it (the same bug above, just worse at the very end of the track, where there's no
    // further scroll distance left to space them apart). A fixed delay after the text starts revealing does.
    revealOnce(fieldETrigger.current, 0.1, () => {
      // The scroll-triggered open is non-modal: no scrim, no focus move (see Enquiry.tsx's `modal` prop).
      // Only if the visitor is still headed for section E when it fires (the scroll's target, not the lagged
      // track): `scrollTo` cancels the call for keyboard navigation, but a wheel flick back within the 2 s
      // still opened it over section D (6h).
      delayedCalls.push(
        gsap.delayedCall(reduced ? 0.3 : 2, () => {
          if (lenis.targetScroll < travel - 0.25 * rootEl.clientWidth) return;
          enquiryAuto.current = true;
          setEnquiryOpen(true);
        }),
      );
    });

    // The leave fade (step 2): the page and the canvas (showing only this car, since the showroom's own
    // views stay off while a listing is open) fade out together over 0.6 s, then back in once the route has
    // actually changed and the showroom is what the canvas draws next.
    exit.run = () =>
      new Promise<void>((resolveExit) => {
        const duration = reduced ? reducedTokens.fade : 0.6;
        gsap.to(live([rootEl, behindEl, canvasEl]), { opacity: 0, duration, ease: ease.fade, onComplete: () => resolveExit() });
      });

    // ---- The frame: Lenis, then the DOM has moved (GSAP's own tick ran first), then chrome, camera, draw ----
    let last = gsap.ticker.time;
    let tone = "";
    let section = "";
    let progressWritten = -1;
    let barWritten = -1;
    // 7c: M7 depth drift on the GSAP-owned type (one quickSetter each, made once: their own tweens write the same
    // transform, so style.transform would erase one or the other), M14 frame drift on the swap slots' roots (nothing
    // else animates those), and M6 on the single photos' wrappers. All off under reduced motion, and each is computed
    // only while its block is within one viewport of the screen (writing 0 once it leaves).
    const d = effect.depthDrift;
    const depthItems = reduced
      ? []
      : (
          [
            [name.current, "hero-name", (x: number) => depthOffset(x, d.name)],
            [make.current, "hero-make", (x: number) => depthOffset(x, d.make)],
            [jumpBtn.current, "jump", (x: number) => depthOffset(x, d.jump), 1440],
            [giveIt.current, "give-it", (x: number) => depthOffset(x - travel, d.giveIt)],
            [newHome.current, "new-home", (x: number) => depthOffset(x - travel, d.newHome)],
          ] as const
        ).flatMap(([el, id, offset, until]) => (el ? [{ set: depthSetter(el), id, offset, until, last: 0 }] : []));
    const frameItems = reduced
      ? []
      : ["a2", "b-photo", "s-swap"].flatMap((id) => {
          const el = rootEl.querySelector<HTMLElement>(`[data-block="${id}"]`);
          return el ? [{ el, id, last: 0 }] : [];
        });
    const photoItems = reduced
      ? []
      : ["a1", "s-tall", "s-third"].flatMap((id) => {
          const el = rootEl.querySelector<HTMLElement>(`[data-block="${id}"] [data-parallax-inner]`);
          return el ? [{ el, id }] : [];
        });
    const tick = (time: number) => {
      const dt = Math.min(0.05, Math.max(0, time - last));
      last = time;
      lenis.raf(time * 1000);
      const x = -(gsap.getProperty(frontEl, "x") as number);
      detail.progress = progressAt(x, ranges);
      stepTurntable(dt, time);

      const nextTone = toneAt((x + PILL.x) / u, PILL.y / u, detail.viewport.h / u);
      if (nextTone !== tone) rootEl.dataset.pillTone = tone = nextTone;
      let at = 0;
      for (let i = 0; i < stops.length; i++) if (x >= stops[i] - 4) at = i;
      if (STOPS[at].id !== section) rootEl.dataset.section = section = STOPS[at].id;
      // The non-modal enquiry doesn't block the wheel, so it leaves when the visitor scrolls away from E.
      if (enquiryAuto.current && lenis.targetScroll < travel - 0.5 * detail.viewport.w) {
        enquiryAuto.current = false;
        setEnquiryOpen(false);
      }

      const written = Math.round((x / travel) * 10_000);
      if (written !== progressWritten) {
        progressWritten = written;
        lineEl.style.transform = `scaleX(${written / 10_000})`;
      }
      // M10: the spec bar slides down and out over the end of A and the start of T1.
      const from = ranges[0][0] - BAR_EXIT.before * u;
      const q = clamp01((x - from) / (BAR_EXIT.before * u + BAR_EXIT.after * u));
      const qWritten = Math.round(q * 1000);
      if (qWritten !== barWritten) {
        barWritten = qWritten;
        barExit(barEl, q);
      }
      // M3: the summary brightens from its left edge at 90% of the viewport to its centre at 45%.
      if (!reduced && summaryChars.length) scrollText(summaryChars, clamp01((x - summaryStart) / (summaryEnd - summaryStart)));
      // M5: a swap slot's cadence is one step per `step` of the viewport's width of travel (half, docs/overhaul.md
      // step 2), starting once the slot's left edge reaches `start` of the viewport's width (1: as it enters),
      // expressed as a float index into its timelines; each timeline's own progress is that index clamped to its
      // [0, 1] step, so scrolling back unwinds exactly the same path.
      const stepSwap = (swap: typeof a2Swap, start = 1, step = 0.5) => {
        if (!swap.timelines.length) return;
        const vw = detail.viewport.w;
        const traveled = start * vw - (swap.left - x);
        const idx = Math.min(swap.timelines.length, Math.max(0, traveled / (step * vw)));
        for (let i = 0; i < swap.timelines.length; i++) swap.timelines[i].progress(clamp01(idx - i));
      };
      // A2 waits until its left edge is a quarter of the way across the screen, so the first photo can be seen
      // before it wipes away (user, after 6h: it was swapping as it entered); a quarter-viewport step then
      // finishes the first swap as the slot reaches the left edge, still fully on screen.
      stepSwap(a2Swap, 0.25, 0.25);
      // B's photo and the slideshow's swap slot reveal first (M4, 80% trigger, 1.4 s of zoom), so their first wipe waits.
      stepSwap(bPhotoSwap, 0.6, 0.25);
      stepSwap(sSwap, 0.6, 0.25);
      // M6: the photo drifts against the scroll while it crosses the viewport; off under reduced motion.
      if (!reduced && bPhotoParallaxEl) {
        const vw = detail.viewport.w;
        const left = bPhotoFrame.left - x;
        const right = left + bPhotoFrame.width;
        parallax(bPhotoParallaxEl, clamp01((vw - right) / (vw + bPhotoFrame.width)));
      }
      if (depthItems.length) {
        const vw = detail.viewport.w;
        const near = (id: string) => {
          const b = block(id);
          const left = b.x * u - x;
          return left < 2 * vw && left + b.w * u > -vw;
        };
        for (const item of depthItems) {
          const v = near(item.id) && (item.until === undefined || x < item.until * u) ? item.offset(x) : 0;
          if (v !== item.last) {
            item.last = v;
            item.set(v);
          }
        }
        for (const item of frameItems) {
          const b = block(item.id);
          const v = near(item.id) ? frameOffset(x, (b.x + b.w / 2) * u - vw / 2) : 0;
          if (v !== item.last) {
            item.last = v;
            frameDrift(item.el, v);
          }
        }
        for (const item of photoItems) {
          if (!near(item.id)) continue;
          const b = block(item.id);
          const right = (b.x + b.w) * u - x;
          parallax(item.el, clamp01((vw - right) / (vw + b.w * u)));
        }
      }
      if (process.env.NODE_ENV !== "production") {
        rootEl.dataset.x = String(Math.round(x));
        rootEl.dataset.camera = detail.progress.toFixed(3);
      }
      runtime.advance(time);
    };
    gsap.ticker.add(tick);
    runtime.external = true;
    runtime.detailSlot = viewSlotEl;
    useArcade.getState().setDetailReady(true);

    // Height and width are the visitor's device, not a constant: re-measure whenever the overlay's box changes.
    let first = true;
    const resize = new ResizeObserver(() => {
      if (first) return void (first = false);
      layout();
      lenis.resize();
      ScrollTrigger.refresh();
    });
    resize.observe(rootEl);

    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (useArcade.getState().phase !== "showroom") return;
      if ((event.target as HTMLElement).closest("input, textarea, select, [contenteditable='true']")) return;
      const target = lenis.targetScroll;
      const here = stops.reduce((best, stop, i) => (target >= stop - 4 ? i : best), 0);
      const forward = event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === "PageDown" || (event.key === " " && !event.shiftKey);
      const backward = event.key === "ArrowLeft" || event.key === "ArrowUp" || event.key === "PageUp" || (event.key === " " && event.shiftKey);
      if (forward) scrollTo(stops[Math.min(stops.length - 1, here + 1)]);
      else if (backward) scrollTo(target > stops[here] + 4 ? stops[here] : stops[Math.max(0, here - 1)]);
      else if (event.key === "Home") scrollTo(0);
      else if (event.key === "End") scrollTo(travel);
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);

    // The page follows focus: Tab walks every control from the hero to the enquiry in DOM order, and the browser
    // can't scroll a transformed track to an off-screen one, so this brings the focused control's block into
    // view with the 24u margin (WCAG 2.4.11). It replaces 6d's `inert` margin (6h): that hid far controls from
    // Tab and from screen readers, still let near-but-off-screen ones take an invisible focus ring (the chart
    // dots ten viewports out, "See all…" at x ≈ 1926 px), and, once focus moved the page, could make the very
    // next control inert, so "See all of this car's images" became unreachable by Tab.
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as Element;
      const owner = frontEl.contains(target) ? target.closest<HTMLElement>("[data-block]") : null;
      if (!owner?.dataset.block) return;
      const r = target.getBoundingClientRect();
      const vw = rootEl.clientWidth;
      if (r.left >= 0 && r.right <= vw) return;
      const b = block(owner.dataset.block);
      const to = r.right > vw ? Math.min(travel, (b.x + b.w + 24) * u - vw) : Math.max(0, (b.x - 24) * u);
      // Immediate, not the 1.2 s "Jump to specs" tween (/review-animations, after 6h): Tab is a keyboard action
      // and shouldn't wait on an animation; the page's own scroll lag (`SCROLL_LAG`) still carries the track
      // there smoothly, as it does for the wheel.
      lenis.scrollTo(to, { immediate: true, force: true });
    };
    rootEl.addEventListener("focusin", onFocusIn);

    // Drag turns the car about the vertical axis in the hero only; it hands back to the turntable after 1.2 s.
    let dragging = false;
    let lastX = 0;
    const onDown = (event: PointerEvent) => {
      dragging = detail.dragging = true;
      lastX = event.clientX;
      dragEl!.setPointerCapture(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      if (!dragging) return;
      detail.angle = (detail.angle + (event.clientX - lastX) * 0.4) % 360;
      lastX = event.clientX;
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = detail.dragging = false;
      detail.resumeAt = gsap.ticker.time + 1.2;
      detail.velocity = 0;
    };
    dragEl?.addEventListener("pointerdown", onDown);
    dragEl?.addEventListener("pointermove", onMove);
    dragEl?.addEventListener("pointerup", onUp);
    dragEl?.addEventListener("pointercancel", onUp);
    dragEl?.addEventListener("lostpointercapture", onUp);

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      timeline.scrollTrigger?.kill();
      timeline.kill();
      for (const t of entryTweens) t.kill();
      cancelAnimationFrame(prepareFrame);
      for (const t of triggers) t.kill();
      for (const t of delayedCalls) t.kill();
      for (const t of [...a2Swap.timelines, ...bPhotoSwap.timelines, ...sSwap.timelines]) t.kill();
      lenis.destroy();
      resize.disconnect();
      window.removeEventListener("keydown", onKey);
      rootEl.removeEventListener("focusin", onFocusIn);
      dragEl?.removeEventListener("pointerdown", onDown);
      dragEl?.removeEventListener("pointermove", onMove);
      dragEl?.removeEventListener("pointerup", onUp);
      dragEl?.removeEventListener("pointercancel", onUp);
      dragEl?.removeEventListener("lostpointercapture", onUp);
      useArcade.getState().setDetailReady(false);
      runtime.external = false;
      runtime.detailSlot = null;
      detail.solved = null;
      exit.run = null;
      unsubscribePhase?.();
      if (canvasEl) canvasEl.style.opacity = "";
    };
  }, [car]);

  // No dependency array: runs after every commit (a sound toggle, a phase change), not just mount, so
  // the measured make/year and jump position survives React rewriting their inline `top` back to the
  // render-time estimate on each of those re-renders.
  useLayoutEffect(() => {
    repositionName.current();
  });

  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { spec } = car;
  const factRows: [string, string][] = [
    ["Mileage", formatMiles(car.mileageMi)],
    ["Engine", spec.engine],
    ["Colour", car.colors.paint.name],
    ["Location", car.location],
  ];
  const firstPhoto = car.photos.find((p) => p.kind === "exterior") ?? car.photos[0];
  // Every photo appears once on the page (7d), with one exception (7e). Slots fill in priority order until the
  // photos run out. The seven single frames (A1, A2, B, C band, S tall, S third, S swap) always render: when the
  // pool is under seven, S swap alone reuses A2's photo (the frame furthest from it on the page). A3 and the
  // extra swap layers take only unused photos, so they simply don't render when the pool runs out.
  const ordered = [firstPhoto, ...car.photos.filter((p) => p !== firstPhoto)];
  let nextPhoto = 1; // ordered[0] is A1's
  const take = (): Photo | undefined => ordered[nextPhoto++];
  const layer = (photo: Photo | undefined): Photo[] => (photo ? [photo] : []);
  const a2Photos = layer(take());
  const bPhotos = layer(take());
  const cBandPhoto = take();
  const sTallPhoto = take();
  const sThirdPhoto = take();
  const sSwapPhotos = layer(take() ?? (ordered.length < 7 ? a2Photos[0] : undefined));
  const a3Photo = take();
  for (const photos of [a2Photos, bPhotos, sSwapPhotos, a2Photos, bPhotos, sSwapPhotos]) {
    const extra = take();
    if (extra) photos.push(extra);
  }
  // Make/year and "Jump to specs" follow the name's actual line count (MAKE_GAP_PX below the name, JUMP_GAP_PX
  // below make/year), so a one-line name (NSX, M5, TR6) doesn't leave the gap a fixed y would. Name: 160u at
  // 0.95 leading = 152u per line; make/year and jump set `lineHeight: 1` so their boxes are just their font
  // size. This is the first-paint estimate only: the layout effect measures the name's last rendered line
  // (which catches a wrapped extra line, e.g. the Gallardo's "LP 560-4") and repositions both from that.
  const nameBottom = 100 + car.heroName.length * (160 * 0.95);
  const makeTop = `calc(${u(nameBottom)} + ${MAKE_GAP_PX}px)`;
  // The emblem's right edge lines up with "Scroll for more"'s (user, 2026-10-09), computed from the
  // scroll-cue block's own right edge rather than a fixed left x, so it holds regardless of box width.
  const scrollCueBlock = block("scroll-cue");
  const emblemLeft = scrollCueBlock.x + scrollCueBlock.w - EMBLEM_WIDTH;
  const jumpTop = `calc(${u(nameBottom)} + ${MAKE_GAP_PX + JUMP_GAP_PX}px + max(16px, ${u(MAKE_SIZE)}))`;
  const leave = (event: MouseEvent) => {
    event.preventDefault();
    leaveDetail(() => router.push("/", { scroll: false }));
  };

  return (
    <>
      {/* The detail View's tracked element: fixed to the full viewport, but at hand-off it carries a
          transform that maps that viewport down to the carousel frame's rectangle, so the camera grows
          into place rather than snapping (docs/overhaul.md, "Entry from the carousel"). */}
      <div ref={viewSlot} data-view-slot aria-hidden className="pointer-events-none fixed top-0 left-0 h-full w-full" style={{ transformOrigin: "0 0" }} />

      {/* Behind the canvas: the pale fields the car stands on and the large type it passes in front of. */}
      <div aria-hidden className="pointer-events-none fixed top-0 left-0 z-[-1] h-dvh w-full overflow-clip">
        <div ref={behind} className="absolute top-0 left-0 h-full will-change-transform">
          <Blocks layer="behind" />
          <h2 ref={name} aria-label={car.heroName.join(" ")} className="font-display absolute" style={{ ...styleOf(block("hero-name")), fontSize: "var(--type-hero)", lineHeight: "var(--display-leading)", letterSpacing: "var(--display-tracking)", textTransform: "var(--display-case)" }}>
            {car.heroName.map((text, li) => (
              <span key={li} aria-hidden className="block overflow-hidden">
                <span className="block">{charRiseLine(text, li, nameChars)}</span>
              </span>
            ))}
          </h2>
          <p
            ref={make}
            className="font-condensed absolute overflow-hidden"
            style={{ ...styleOf(block("hero-make")), top: makeTop, lineHeight: 1, textTransform: "var(--label-case)", letterSpacing: "var(--label-tracking)", fontSize: `max(16px, ${u(MAKE_SIZE)})` }}
          >
            {car.make} · {car.year}
          </p>
          {/* Section E (step 3/6g): decorative behind-layer type, same as the hero name above — the real
              text is "Inquire about this car here →" in the front layer, below. */}
          <p ref={giveIt} className="font-display absolute" style={{ ...styleOf(block("give-it")), fontSize: "var(--type-enquiry)", lineHeight: "var(--display-leading)", letterSpacing: "var(--display-tracking)", textTransform: "var(--display-case)" }}>
            Give it
          </p>
          <p ref={newHome} className="font-display absolute" style={{ ...styleOf(block("new-home")), fontSize: "var(--type-enquiry)", lineHeight: "var(--display-leading)", letterSpacing: "var(--display-tracking)", textTransform: "var(--display-case)" }}>
            A new home
          </p>
        </div>
      </div>

      <section ref={root} aria-labelledby="detail-title" data-detail data-pill-tone="light" data-section="hero" className="fixed top-0 left-0 z-30 h-dvh w-full">
        <div ref={probe} aria-hidden className="pointer-events-none invisible absolute top-0 left-0 h-0" style={{ width: "var(--u)" }} />
        {/* The page's heading while it is open: the showroom's own h1 is hidden underneath. */}
        <h1 ref={heading} id="detail-title" tabIndex={-1} className="sr-only">
          <CarName car={car} />
        </h1>
        <div ref={scroller} className="absolute inset-0 overflow-x-hidden overflow-y-scroll overscroll-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div ref={content} className="relative">
            <div className="sticky top-0 h-dvh overflow-clip">
              {/* First in the DOM, so it is the first stop for the keyboard; the z-index puts it above the track. */}
              <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
                <Link ref={backPill} href="/" scroll={false} aria-keyshortcuts="Escape" className="detail-pill" onClick={leave}>
                  <span aria-hidden>←</span> Showroom
                </Link>
                <button ref={soundBtn} type="button" className="detail-pill" aria-label="Sound" aria-pressed={sound} aria-keyshortcuts="M" onClick={toggleSound} onPointerDown={() => play("press")}>
                  {sound ? "Sound on" : "Sound off"}
                </button>
              </div>

              {/* In front of the canvas: photos, the dark sections, the price section, small text and buttons. */}
              <div ref={front} className="absolute top-0 left-0 h-full will-change-transform">
                {!reduced && <div ref={drag} data-drag className="absolute z-0 cursor-grab touch-none active:cursor-grabbing" />}
                <Blocks layer="front" />

                <button
                  type="button"
                  data-block="jump"
                  data-tone="light"
                  className="detail-jump absolute"
                  style={{ ...styleOf(block("jump")), top: jumpTop, lineHeight: 1, fontSize: `max(12px, ${u(JUMP_SIZE)})`, textTransform: "var(--label-case)", letterSpacing: "var(--label-tracking)" }}
                  ref={jumpBtn}
                  onClick={() => jump.current()}
                >
                  Jump to specs →
                </button>

                {car.emblem && (
                  // Capped by width, not height (user, 2026-10-09): some marks are crests (Datsun, near
                  // square) and some are wordmarks (Porsche's is 256x17, 15:1) — a true 120px-tall box would
                  // make a wordmark nearly 1800px wide. Nearly every mark is a wordmark (11 of 13 render
                  // under 40px tall at this width), so the box is centred on the back pill/sound button
                  // row's own centre line (`PILL.y`) rather than top-anchored: top-anchoring left a thin
                  // wordmark sitting flush against the top of a tall empty box, well above the pill's centre
                  // (user, 2026-10-10). The one near-square mark (BMW, 1:1) loses a couple of px off its top
                  // to the viewport edge at this ceiling — the better trade given the other eleven.
                  <div
                    ref={emblem}
                    data-block="emblem"
                    className="absolute"
                    style={{ ...styleOf(block("emblem")), left: u(emblemLeft), top: u(PILL.y), transform: "translateY(-50%)", width: u(EMBLEM_WIDTH), height: "max(80px, calc(80 * var(--u)))" }}
                  >
                    <Image src={car.emblem.src} alt="" fill sizes="140px" unoptimized className="object-contain object-right" />
                  </div>
                )}

                <p
                  ref={scrollCue}
                  data-block="scroll-cue"
                  aria-hidden
                  className="text-mist-700 absolute [writing-mode:vertical-rl]"
                  style={{ ...styleOf(block("scroll-cue")), fontSize: "max(10px, var(--type-label))", letterSpacing: "var(--label-tracking)", textTransform: "var(--label-case)" }}
                >
                  Scroll for more
                </p>

                {firstPhoto && (
                  <div ref={a1Frame} data-block="a1" data-tone="dark" className="absolute overflow-hidden" style={styleOf(block("a1"))}>
                    <div data-parallax-inner className="absolute top-0 h-full" style={{ left: "-6%", width: "112%" }}>
                      <div ref={a1Inner} className="absolute inset-0">
                        <Image src={firstPhoto.src} alt={firstPhoto.alt} fill sizes="620px" className="object-cover" />
                      </div>
                    </div>
                  </div>
                )}

                {/* A2: the swap slot (M5), cycling through this car's next two or three photos. */}
                <SwapSlot id="a2" photos={a2Photos} sizes="530px" />

                {/* A3: a single photo reveal (M4), when the car has a photo to spare for it. */}
                {a3Photo && (
                  <div ref={a3Frame} data-block="a3" data-tone="dark" className="absolute overflow-hidden" style={styleOf(block("a3"))}>
                    <div ref={a3Inner} className="absolute inset-0">
                      <Image src={a3Photo.src} alt={a3Photo.alt} fill sizes="542px" className="object-cover" />
                    </div>
                  </div>
                )}

                {/* B: about the car, over the roof field's front surface (6d's "about-surface" decision):
                    the label and headline (M2) rise first, then the paragraph's real wrapped lines (M1). */}
                {/* The visible section labels are the page's h2s (6h): without them the only heading a screen-reader
                    user could jump between was the hidden h1. */}
                <h2
                  ref={aboutLabel}
                  data-block="about-label"
                  data-tone="light"
                  className="font-condensed absolute overflow-hidden"
                  style={{ ...styleOf(block("about-label")), lineHeight: 1, fontSize: "max(11px, var(--type-label))", letterSpacing: "var(--label-tracking)", textTransform: "var(--label-case)" }}
                >
                  About the car
                </h2>
                {/* Not a heading: "About the car" above is this section's h2 (6h); this editorial line is its
                    display copy, not a landmark a screen-reader user would jump to. */}
                <p
                  ref={headline}
                  data-block="headline"
                  data-tone="light"
                  className="font-display absolute"
                  style={{ ...styleOf(block("headline")), fontSize: "var(--type-headline)", lineHeight: "var(--display-leading)", letterSpacing: "var(--display-tracking)", textTransform: "var(--display-case)" }}
                >
                  {/* Readable text beside the aria-hidden split pieces, not an aria-label: screen readers ignore
                      aria-label on a plain paragraph, so this headline, the about text, the summary and the two
                      closing paragraphs all read as empty (found in the 6h accessibility-tree pass). */}
                  <span className="sr-only">{car.headline.join(" ")}</span>
                  {car.headline.map((text, li) => (
                    <span key={li} aria-hidden className="block overflow-hidden">
                      <span className="block">{charRiseLine(text, li, headlineChars)}</span>
                    </span>
                  ))}
                </p>
                <p
                  ref={aboutBodyP}
                  data-block="about-body"
                  data-tone="light"
                  className="font-text absolute"
                  // height auto (6h): bottom-anchored with the block's fixed 120u, the 13px text floor ran past the
                  // bottom edge at 1024 x 640 (the c-take/c-keep fix from 6f, same cause).
                  style={{ ...styleOf(block("about-body")), height: "auto", fontSize: "max(13px, var(--type-body))", lineHeight: 1.4 }}
                >
                  <span className="sr-only">{car.about}</span>
                  <span aria-hidden ref={aboutBodyInner}>
                    {car.about}
                  </span>
                </p>

                {/* B's 480 x 640 photo: the swap slot (M5) and, the first live use of it, parallax (M6). */}
                <SwapSlot id="b-photo" photos={bPhotos} sizes="480px" parallax />

                {/* C: specs. The photo band (M4), the label, the two-half spec table with rule draws (M1/M8),
                    the equipment-overlay placeholder, the scroll-to-reveal summary (M3), and the two closing
                    paragraphs. All paper-on-ink, since this panel sits over the dark section. */}
                {cBandPhoto && (
                  <div ref={cBandFrame} data-block="c-band" data-tone="dark" className="absolute overflow-hidden" style={styleOf(block("c-band"))}>
                    <div ref={cBandInner} className="absolute inset-0">
                      <Image src={cBandPhoto.src} alt={cBandPhoto.alt} fill sizes="1300px" className="object-cover" />
                    </div>
                  </div>
                )}
                <h2 ref={cLabel} data-block="c-label" data-tone="dark" className="font-condensed absolute overflow-hidden"
                  style={{ ...styleOf(block("c-label")), lineHeight: 1, fontSize: "max(11px, var(--type-label))", letterSpacing: "var(--label-tracking)", textTransform: "var(--label-case)", color: "var(--color-paper)" }}
                >
                  Listed car specifications
                </h2>
                <dl ref={tableA} data-block="c-table-a" data-tone="dark" className="absolute flex h-full flex-col" style={{ ...styleOf(block("c-table-a")), color: "var(--color-paper)" }}>
                  {specRowsLeft(car).map(([label, value, numeral]) => (
                    <div key={label} className="relative flex flex-1 items-baseline justify-between gap-3">
                      <dt data-spec-text className="detail-label shrink-0 overflow-hidden">
                        {label}
                      </dt>
                      <dd data-spec-text className={`min-w-0 truncate overflow-hidden text-right ${numeral ? "font-mono" : ""}`} style={{ fontSize: "max(13px, var(--type-spec))" }}>
                        {value}
                      </dd>
                      <div data-spec-rule aria-hidden className="absolute inset-x-0 bottom-0 h-px origin-left" style={{ background: "color-mix(in srgb, var(--color-paper) 30%, transparent)" }} />
                    </div>
                  ))}
                </dl>
                <dl ref={tableB} data-block="c-table-b" data-tone="dark" className="absolute flex h-full flex-col" style={{ ...styleOf(block("c-table-b")), color: "var(--color-paper)" }}>
                  {specRowsRight(car).map(([label, value, numeral]) => (
                    <div key={label} className="relative flex flex-1 items-baseline justify-between gap-3">
                      <dt data-spec-text className="detail-label shrink-0 overflow-hidden">
                        {label}
                      </dt>
                      <dd data-spec-text className={`min-w-0 truncate overflow-hidden text-right ${numeral ? "font-mono" : ""}`} style={{ fontSize: "max(13px, var(--type-spec))" }}>
                        {value}
                      </dd>
                      <div data-spec-rule aria-hidden className="absolute inset-x-0 bottom-0 h-px origin-left" style={{ background: "color-mix(in srgb, var(--color-paper) 30%, transparent)" }} />
                    </div>
                  ))}
                </dl>
                {/* Placeholder only: opens nothing yet (docs/overhaul.md, "Overlays and later pieces"). */}
                <button
                  ref={cOverlay}
                  type="button"
                  data-block="c-overlay"
                  data-tone="dark"
                  className="absolute flex items-center justify-center overflow-hidden rounded-full px-5 text-center"
                  style={{
                    ...styleOf(block("c-overlay")),
                    // 44px floor (PRODUCT.md's touch-target commitment): at u(44) alone this fell to 28px at
                    // 1080 wide, below the floor the back pill already carries a known gap against (found
                    // by /impeccable audit, 6f).
                    height: "max(44px, calc(var(--u) * 44))",
                    color: "var(--color-paper)",
                    fontSize: "max(11px, var(--type-label))",
                    letterSpacing: "var(--label-tracking)",
                    textTransform: "var(--label-case)",
                    boxShadow: "inset 0 0 0 1px var(--color-paper)",
                  }}
                >
                  See equipment and ownership history
                </button>
                <p
                  ref={summaryRef}
                  data-block="c-summary"
                  data-tone="dark"
                  className="font-display absolute"
                  style={{ ...styleOf(block("c-summary")), color: "var(--color-paper)", fontSize: "var(--type-summary)", lineHeight: "var(--display-leading)" }}
                >
                  <span className="sr-only">{car.summary}</span>
                  <span aria-hidden>{scrollTextWords(car.summary, reduced)}</span>
                </p>
                <div ref={cTake} data-block="c-take" data-tone="dark" className="absolute" style={{ ...styleOf(block("c-take")), height: "auto", color: "var(--color-paper)" }}>
                  <p ref={cTakeLabel} className="detail-label overflow-hidden" style={{ lineHeight: 1 }}>
                    Our take
                  </p>
                  <p className="mt-2" style={{ fontSize: "max(13px, var(--type-body))", lineHeight: 1.4 }}>
                    <span className="sr-only">{car.ourTake}</span>
                    <span aria-hidden ref={cTakeBody}>
                      {car.ourTake}
                    </span>
                  </p>
                </div>
                <div ref={cKeep} data-block="c-keep" data-tone="dark" className="absolute" style={{ ...styleOf(block("c-keep")), height: "auto", color: "var(--color-paper)" }}>
                  <p ref={cKeepLabel} className="detail-label overflow-hidden" style={{ lineHeight: 1 }}>
                    To keep in mind
                  </p>
                  <p className="mt-2" style={{ fontSize: "max(13px, var(--type-body))", lineHeight: 1.4 }}>
                    <span className="sr-only">{car.toKeepInMind}</span>
                    <span aria-hidden ref={cKeepBody}>
                      {car.toKeepInMind}
                    </span>
                  </p>
                </div>

                {/* D: the price comparison in three tabs (docs/overhaul.md step 5, 7a). The
                    `--color-card` token (already in the theme, used nowhere else yet) gives the module the
                    storyboard's bounded card (frame 10) instead of floating the charts on the bare field. */}
                <h2
                  ref={priceTitle}
                  data-block="price-title"
                  data-tone="light"
                  className="font-condensed absolute overflow-hidden"
                  style={{ ...styleOf(block("price-title")), height: "auto", lineHeight: 1, fontSize: "max(11px, var(--type-label))", letterSpacing: "var(--label-tracking)", textTransform: "var(--label-case)" }}
                >
                  Price comparison
                </h2>
                <div
                  data-block="price-module"
                  data-tone="light"
                  className="absolute box-border flex flex-col"
                  style={{ ...styleOf(block("price-module")), background: "var(--color-card)", padding: "max(20px, calc(32 * var(--u)))" }}
                >
                  <PriceModule car={car} renderVerdict={(text) => charRiseLine(text, 0, priceVerdictChars)} />
                </div>

                {/* D: the slideshow (M4 on the single photos, M5 on the swap slot) and the gallery link. */}
                {sTallPhoto && (
                  <div ref={sTallFrame} data-block="s-tall" data-tone="dark" className="absolute overflow-hidden" style={styleOf(block("s-tall"))}>
                    <div data-parallax-inner className="absolute top-0 h-full" style={{ left: "-6%", width: "112%" }}>
                      <div ref={sTallInner} className="absolute inset-0">
                        <Image src={sTallPhoto.src} alt={sTallPhoto.alt} fill sizes="607px" className="object-cover" />
                      </div>
                    </div>
                  </div>
                )}
                <SwapSlot id="s-swap" photos={sSwapPhotos} sizes="465px" />
                {sThirdPhoto && (
                  <div ref={sThirdFrame} data-block="s-third" data-tone="dark" className="absolute overflow-hidden" style={styleOf(block("s-third"))}>
                    <div data-parallax-inner className="absolute top-0 h-full" style={{ left: "-6%", width: "112%" }}>
                      <div ref={sThirdInner} className="absolute inset-0">
                        <Image src={sThirdPhoto.src} alt={sThirdPhoto.alt} fill sizes="720px" className="object-cover" />
                      </div>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  data-block="s-all"
                  data-tone="dark"
                  className="absolute text-right"
                  style={{ ...styleOf(block("s-all")), color: "var(--color-paper)", fontSize: "max(12px, var(--type-label))", letterSpacing: "var(--label-tracking)", textTransform: "var(--label-case)" }}
                  onClick={() => setGalleryOpen(true)}
                >
                  See all of this car&rsquo;s images →
                </button>

                {/* E: an invisible front-layer trigger marker, positioned imperatively in `layout()` at the
                    track's true resting scroll position rather than "field-e"'s own block — see the comments
                    at `layout()`'s assignment and at this marker's `revealOnce` calls. */}
                <div ref={fieldETrigger} aria-hidden className="pointer-events-none absolute top-0 h-full" style={{ width: u(1) }} />

                {/* E: the real link behind "Give it" / "A new home"'s decorative type (step 3/5/6g). */}
                <button
                  type="button"
                  data-block="inquire"
                  data-tone="light"
                  className="font-display absolute text-right"
                  style={{ ...styleOf(block("inquire")), fontSize: "max(16px, calc(28 * var(--u)))", lineHeight: 1.15 }}
                  onClick={() => {
                    enquiryAuto.current = false;
                    setEnquiryOpen(true);
                    setEnquiryModal(true);
                  }}
                >
                  Inquire about this car here →
                </button>
              </div>

              {/* Chrome: the progress line and the spec bar. */}
              <div ref={line} aria-hidden className="detail-line pointer-events-none absolute top-0 left-0 h-px w-full origin-left" style={{ transform: "scaleX(0)" }} />
              <div ref={bar} className="detail-bar absolute inset-x-0 bottom-0 flex items-center justify-between gap-6 px-6" style={{ height: "calc(var(--u) * 68)" }}>
                <dl ref={facts} className="flex min-w-0 items-baseline gap-x-5 overflow-hidden whitespace-nowrap">
                  {factRows.map(([term, value]) => (
                    // Mileage never truncates (6h: "54,300 …" at 1024 wide); the text facts give way instead.
                    <div key={term} className={`flex min-w-0 items-baseline gap-2 ${term === "Mileage" ? "shrink-0" : ""}`}>
                      <dt className="detail-label">{term}</dt>
                      <dd className="min-w-0 truncate" style={{ fontSize: "max(13px, calc(17 * var(--u)))" }}>{value}</dd>
                    </div>
                  ))}
                </dl>
                <p ref={price} className="flex shrink-0 items-baseline gap-3">
                  <span className="detail-label">Price as listed</span>
                  <span className="font-mono" style={{ fontSize: "max(18px, var(--type-bar-value))" }}>{formatPrice(car.priceUsd)}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Gallery car={car} open={galleryOpen} onClose={() => setGalleryOpen(false)} />
      <Enquiry
        car={car}
        open={enquiryOpen}
        modal={enquiryModal}
        onClose={() => {
          enquiryAuto.current = false;
          setEnquiryOpen(false);
          setEnquiryModal(false);
        }}
      />
    </>
  );
}
