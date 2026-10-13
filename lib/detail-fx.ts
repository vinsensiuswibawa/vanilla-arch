// The detail page's motion vocabulary (docs/overhaul.md, step 2, M1 to M12) as GSAP tween factories built on
// the numbers in lib/detail-motion.ts. Each factory takes already-rendered DOM elements (the mask/line
// structure lives in the component's JSX; nothing here does DOM surgery) and returns a tween or timeline the
// caller adds to its own timeline, or a per-tick setter for the scroll-tied effects (M3, M6, M7, M10).
//
// M1 and M2 split text by rendering one span per character directly in JSX from a known string (`splitChars`),
// not by measuring wrapped lines: the hero's lines are already broken by hand (lib/cars.ts `heroName`), so no
// line-wrap detection is needed yet. That measurement (fonts.ready, debounced resize) belongs with the first
// effect that actually wraps prose (section B's paragraph, 6f), not here.
import gsap from "gsap";
import { ease, effect, reduced as reducedTokens } from "@/lib/detail-motion";

export type Targets = gsap.TweenTarget;

/** One span per character, for M2 (and M1 when a "line" is a single word or short phrase). Array.from keeps
 * surrogate pairs and combining marks together; ordinary Latin text (the only content here) splits cleanly. */
export const splitChars = (text: string): string[] => Array.from(text);

/**
 * M1 for wrapped prose (the hero's and headline's lines are already broken by hand; this is the first text
 * that actually wraps). Wraps each word, groups words sharing an `offsetTop` into a line, then wraps each line
 * in its own overflow-hidden mask with one inner span to carry the rise — the same mask/inner shape the hero's
 * hand-split lines use, so `lineRise` needs no special case. Call after `document.fonts.ready` and again on a
 * debounced resize; `el` must already carry the plain text as its only content.
 */
export function splitLines(el: HTMLElement): HTMLElement[] {
  const text = el.textContent ?? "";
  const words = text.split(/\s+/).filter(Boolean);
  el.textContent = "";
  const wordEls = words.map((w, i) => {
    const span = document.createElement("span");
    span.textContent = i < words.length - 1 ? `${w} ` : w;
    span.style.display = "inline-block";
    el.appendChild(span);
    return span;
  });
  const rows = new Map<number, HTMLElement[]>();
  for (const w of wordEls) {
    const top = w.offsetTop;
    const row = rows.get(top);
    if (row) row.push(w);
    else rows.set(top, [w]);
  }
  el.textContent = "";
  const inners: HTMLElement[] = [];
  for (const rowWords of rows.values()) {
    const mask = document.createElement("span");
    mask.style.display = "block";
    mask.style.overflow = "hidden";
    const inner = document.createElement("span");
    inner.style.display = "block";
    for (const w of rowWords) inner.appendChild(w);
    mask.appendChild(inner);
    el.appendChild(mask);
    inners.push(inner);
  }
  return inners;
}

/** M1: a line rises from under its own mask. `targets` share one mask (the stagger is between elements). */
export function lineRise(targets: Targets, reduced: boolean, opts: { stagger?: number } = {}) {
  if (reduced) return gsap.fromTo(targets, { opacity: 0 }, { opacity: 1, duration: reducedTokens.fade, ease: ease.fade });
  return gsap.fromTo(
    targets,
    { yPercent: effect.lineRise.yPercent },
    { yPercent: 0, duration: effect.lineRise.duration, ease: effect.lineRise.ease, stagger: opts.stagger ?? effect.lineRise.stagger },
  );
}

/** M2: character spans rise from under the line mask; `lineOffset` staggers multiple lines apart. */
export function charRise(lines: Targets[], reduced: boolean) {
  if (reduced) return gsap.fromTo(lines, { opacity: 0 }, { opacity: 1, duration: reducedTokens.fade, ease: ease.fade, stagger: 0.05 });
  const tl = gsap.timeline();
  lines.forEach((chars, i) => {
    tl.fromTo(
      chars,
      { yPercent: effect.charRise.yPercent },
      { yPercent: 0, duration: effect.charRise.duration, ease: effect.charRise.ease, stagger: effect.charRise.stagger },
      i * effect.charRise.lineOffset,
    );
  });
  return tl;
}

/** M3: characters brighten from dim to full as the block crosses the screen. Call per tick with t in [0, 1]. */
export function scrollText(chars: HTMLElement[], t: number) {
  const { from, to } = effect.scrollText;
  const n = chars.length || 1;
  for (let i = 0; i < chars.length; i++) {
    const local = Math.min(1, Math.max(0, t * n - i * 0.4));
    chars[i].style.opacity = String(from + (to - from) * local);
  }
}

/** M4: the frame's clip opens from the bottom while the photo inside rises into place. */
export function imageReveal(frame: Targets, inner: Targets, reduced: boolean) {
  if (reduced) return gsap.fromTo(frame, { opacity: 0 }, { opacity: 1, duration: reducedTokens.fade, ease: ease.fade });
  const tl = gsap.timeline();
  tl.fromTo(frame, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: effect.imageReveal.clipDuration, ease: effect.imageReveal.ease });
  tl.fromTo(inner, { yPercent: effect.imageReveal.innerYPercent }, { yPercent: 0, duration: effect.imageReveal.innerDuration, ease: effect.imageReveal.ease }, 0);
  // The photo is 5% large while the clip opens and settles after it (ends at zoomDelay + zoomDuration = 2.0 s).
  tl.fromTo(inner, { scale: effect.imageReveal.zoomFrom }, { scale: 1, duration: effect.imageReveal.zoomDuration, ease: effect.imageReveal.ease, immediateRender: true }, effect.imageReveal.zoomDelay);
  return tl;
}

/** M5: the top photo wipes away to uncover the next, which settles from a slight zoom. Scroll-tied cadence
 * (one swap per half-viewport) is the caller's job; this is one swap's motion. */
export function imageSwap(top: Targets, next: Targets, reduced: boolean) {
  // Crossfade: only the top layer fades away: `next` is already sitting beneath it at full opacity, so fading
  // it too (as an earlier draft of this factory did) would leave nothing visible once `top` was gone.
  if (reduced) return gsap.fromTo(top, { opacity: 1 }, { opacity: 0, duration: reducedTokens.swapFade, ease: ease.fade });
  const tl = gsap.timeline();
  tl.to(top, { clipPath: "inset(0 100% 0 0)", duration: effect.imageSwap.clipDuration, ease: effect.imageSwap.clipEase });
  tl.fromTo(next, { scale: effect.imageSwap.scaleFrom }, { scale: 1, duration: effect.imageSwap.scaleDuration, ease: effect.imageSwap.scaleEase }, 0);
  return tl;
}

/** M6: the photo drifts against the scroll while its frame stays on the grid. Call per tick with t in [0, 1]
 * (the frame's progress through the viewport); off entirely under reduced motion. */
export function parallax(inner: HTMLElement, t: number) {
  inner.style.transform = `translate3d(${(t * 2 - 1) * effect.parallax.xPercent}%, 0, 0)`;
}

/** M7 offset for an element travelling at `speed` times the page; 0 when `pageX` is 0 (or `speed` is 1). */
export const depthOffset = (pageX: number, speed: number) => pageX * (1 - speed);

/** M7 on a GSAP-owned element (its own tweens write transform): a setter for GSAP's `x`, in px, so the two
 * never overwrite each other (6g). Create once per element, call per tick. */
export const depthSetter = (el: Element) => gsap.quickSetter(el, "x", "px") as (px: number) => void;

/** M14: a small overlapping photo's frame moves at 1.12x the page; the offset is 0 when `pageX` equals `xc` (the
 * track x at which the frame is centred). */
export const frameOffset = (pageX: number, xc: number) => -(pageX - xc) * effect.frameDrift.k;

/** Writes M14's offset on a frame nothing else animates, so it takes `style.transform` directly. */
export function frameDrift(el: HTMLElement, px: number) {
  el.style.transform = px ? `translate3d(${px}px, 0, 0)` : "";
}

/** M8: a hairline draws from left to right, with its row. */
export function ruleDraw(targets: Targets, reduced: boolean) {
  if (reduced) return gsap.fromTo(targets, { opacity: 0 }, { opacity: 1, duration: reducedTokens.fade, ease: ease.fade });
  return gsap.fromTo(targets, { scaleX: 0 }, { scaleX: 1, duration: effect.ruleDraw.duration, ease: effect.ruleDraw.ease, stagger: effect.ruleDraw.stagger, transformOrigin: "left" });
}

/** M9: section E's two sides: the stacked headings from the left, the contact column from the right, with a fade. */
export function sideEntrance(left: Targets, right: Targets, reduced: boolean) {
  if (reduced) return gsap.fromTo([left, right], { opacity: 0 }, { opacity: 1, duration: reducedTokens.fade, ease: ease.fade, stagger: 0.1 });
  const tl = gsap.timeline();
  tl.fromTo(left, { xPercent: -effect.sideEntrance.xPercent, opacity: 0 }, { xPercent: 0, opacity: 1, duration: effect.sideEntrance.duration, ease: effect.sideEntrance.ease });
  tl.fromTo(right, { xPercent: effect.sideEntrance.xPercent, opacity: 0 }, { xPercent: 0, opacity: 1, duration: effect.sideEntrance.duration, ease: effect.sideEntrance.ease }, 0.15);
  return tl;
}

/** M10: the bottom spec bar slides down and out over its scroll range. `q` is progress through the exit, 0 to 1. */
export function barExit(el: HTMLElement, q: number) {
  el.style.transform = `translate3d(0, ${q * 100}%, 0)`;
  el.style.opacity = String(1 - q);
}

/** M11: a panel arrives from the right over a scrim. Returns `{ open, close }`, both built paused (GSAP
 * tweens and timelines autoplay on creation otherwise, which would run the open and close animations at the
 * same time the instant this factory is called) — the caller plays whichever one it needs. */
export function sidebar(panel: Targets, scrim: Targets, reduced: boolean, withScrim = true) {
  // `withScrim: false` is the enquiry's scroll-triggered, non-modal open (user, 6h): the panel alone, so the
  // finale (frame 14) stays visible beside it. Under reduced motion the scrim fades to the same 0.4 as the full
  // version (before 6h it faded to 1: a solid ink page behind the panel).
  const open = gsap.timeline({ paused: true });
  if (reduced) open.fromTo(panel, { opacity: 0 }, { opacity: 1, duration: reducedTokens.sidebarFade, ease: ease.fade });
  else open.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: effect.sidebar.duration, ease: ease.reveal });
  if (withScrim)
    open.fromTo(scrim, { opacity: 0 }, { opacity: effect.sidebar.scrimOpacity, duration: reduced ? reducedTokens.sidebarFade : effect.sidebar.scrimDuration, ease: ease.fade }, 0);
  const close = reduced
    ? gsap.to([panel, scrim], { opacity: 0, duration: reducedTokens.sidebarFade, ease: ease.fade, paused: true })
    : gsap
        .timeline({ paused: true })
        .to(panel, { xPercent: 100, duration: effect.sidebar.leaveDuration, ease: ease.leave })
        .to(scrim, { opacity: 0, duration: effect.sidebar.leaveDuration, ease: ease.leave }, 0);
  return { open, close };
}

/** M12: small chrome fades in place; `reverse: true` is the carousel's chrome fading out at hand-off. */
export function chromeFade(targets: Targets, reverse = false) {
  return reverse
    ? gsap.to(targets, { opacity: 0, duration: effect.chromeFade.duration, ease: effect.chromeFade.ease })
    : gsap.fromTo(targets, { opacity: 0 }, { opacity: 1, duration: effect.chromeFade.duration, ease: effect.chromeFade.ease });
}
