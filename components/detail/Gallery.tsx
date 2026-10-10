"use client";

// The gallery placeholder (docs/overhaul.md step 5): opened by section D's "See all of this car's images →",
// a full-screen grid of every photo with its credit and licence (doubling as the photo credits until
// `/credits` exists). M11's timing, but from the bottom instead of the side, per the plan's own wording.
import gsap from "gsap";
import Image from "next/image";
import { useEffect, useId, useLayoutEffect, useRef } from "react";
import type { CarWithAssets } from "@/lib/cars";
import { ease, effect, reduced as reducedTokens } from "@/lib/detail-motion";

export function Gallery({ car, open, onClose }: { car: CarWithAssets; open: boolean; onClose: () => void }) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  /** Where focus was when the panel opened, so closing hands it back (6h: it fell to <body>, and the next Tab
   * started over from the top of the page). */
  const opener = useRef<HTMLElement | null>(null);

  // `useLayoutEffect`, not `useEffect`, and no hardcoded `transform`/`opacity` in the JSX below: see the
  // identical comment in Enquiry.tsx — GSAP must be the one to set the hidden starting state (here, on first
  // mount, via the trailing `else`), or an inline CSS `transform` written by React gets baked into GSAP's own
  // cache as a fixed pixel offset the `yPercent` tween can never move past.
  useLayoutEffect(() => {
    const panelEl = panel.current;
    const scrimEl = scrim.current;
    if (!panelEl || !scrimEl) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (open) {
      wasOpen.current = true;
      const active = document.activeElement as HTMLElement | null;
      opener.current = active && active !== document.body && !panelEl.contains(active) ? active : null;
      closeBtn.current?.focus();
      if (reduced) {
        // The scrim to 0.4 like the full version, not 1 (6h: a solid ink page behind the gallery).
        gsap.to(panelEl, { opacity: 1, duration: reducedTokens.sidebarFade, ease: ease.fade });
        gsap.to(scrimEl, { opacity: effect.sidebar.scrimOpacity, duration: reducedTokens.sidebarFade, ease: ease.fade });
      } else {
        gsap.fromTo(panelEl, { yPercent: 100 }, { yPercent: 0, duration: effect.sidebar.duration, ease: ease.reveal });
        gsap.fromTo(scrimEl, { opacity: 0 }, { opacity: effect.sidebar.scrimOpacity, duration: effect.sidebar.scrimDuration, ease: ease.fade });
      }
    } else if (wasOpen.current) {
      const active = document.activeElement;
      if (!active || active === document.body || panelEl.contains(active)) opener.current?.focus({ preventScroll: true });
      const duration = reduced ? reducedTokens.sidebarFade : effect.sidebar.leaveDuration;
      if (reduced) {
        gsap.to([panelEl, scrimEl], { opacity: 0, duration, ease: ease.fade });
      } else {
        gsap.to(panelEl, { yPercent: 100, duration, ease: ease.leave });
        gsap.to(scrimEl, { opacity: 0, duration, ease: ease.leave });
      }
    } else {
      gsap.set(panelEl, reduced ? { opacity: 0 } : { yPercent: 100 });
      gsap.set(scrimEl, { opacity: 0 });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // Capture phase, stopped here: Experience.tsx has its own window `keydown` listener (bubble phase) that
    // treats any Escape as "leave the detail page" whenever a listing is open, with no notion of an overlay
    // on top of it — without intercepting the event before it gets there, Escape would close this gallery and
    // navigate back to the showroom in the same keystroke. Also traps Tab inside the panel — see the identical
    // fix and reasoning in Enquiry.tsx.
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const panelEl = panel.current;
      if (!panelEl) return;
      const focusable = Array.from(panelEl.querySelectorAll<HTMLElement>('button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])')).filter(
        (el) => !el.hasAttribute("disabled"),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      // Focus still outside the panel (the scroll-triggered auto-open doesn't take it): the first Tab enters
      // the dialog rather than walking the page behind the scrim, which `aria-modal` says is unreachable (6h).
      if (!panelEl.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [open, onClose]);

  return (
    <div aria-hidden={!open} inert={!open} className="fixed inset-0 z-50" style={{ pointerEvents: open ? "auto" : "none" }}>
      <div ref={scrim} onClick={onClose} className="absolute inset-0" style={{ opacity: 0, background: "var(--color-ink)" }} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-x-0 bottom-0 overflow-y-auto rounded-t-2xl"
        style={{ top: "6%", background: "var(--color-paper)" }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-5" style={{ background: "var(--color-paper)", borderBottom: "1px solid color-mix(in srgb, var(--color-ink) 14%, transparent)" }}>
          <h2 id={titleId} className="font-display" style={{ fontSize: "max(18px, calc(28 * var(--u)))" }}>
            All photos · {car.make} {car.model}
          </h2>
          <button ref={closeBtn} type="button" onClick={onClose} className="detail-pill">
            Close <span aria-hidden>×</span>
          </button>
        </div>
        <div className="grid gap-6 px-6 py-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {car.photos.map((photo) => (
            <figure key={photo.src} className="m-0">
              <div className="relative aspect-[4/3] overflow-hidden rounded">
                <Image src={photo.src} alt={photo.alt} fill sizes="320px" className="object-cover" />
              </div>
              <figcaption className="mt-2" style={{ fontSize: "max(11px, var(--type-label))", color: "color-mix(in srgb, var(--color-ink) 65%, transparent)" }}>
                {photo.credit} ·{" "}
                {photo.licenseUrl ? (
                  <a href={photo.licenseUrl} target="_blank" rel="noreferrer" className="underline">
                    {photo.license}
                  </a>
                ) : (
                  photo.license
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
