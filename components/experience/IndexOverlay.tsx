"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { CarName } from "@/components/experience/CarName";
import { play } from "@/lib/audio";
import { cars } from "@/lib/cars";
import { carLabel, carSubtitle, formatKilometres, formatMiles, formatPrice } from "@/lib/format";
import { MOTION } from "@/lib/motion";
import { useArcade } from "@/lib/store";

/**
 * The Index: all nine as an architect's project list, a linear alternative to the horizontal row.
 * A modal <dialog> keeps focus inside and the page inert; its sheet slides in on CSS transitions,
 * which reverse from wherever they are if the visitor changes their mind mid-flight.
 */
export function IndexOverlay() {
  const open = useArcade((state) => state.indexOpen);
  const setOpen = useArcade((state) => state.setIndexOpen);
  const centered = useArcade((state) => state.centered);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const navigating = useRef(false);

  useEffect(() => {
    const element = dialog.current!;
    if (open) {
      navigating.current = false;
      element.dataset.byKey = String(useArcade.getState().indexByKey);
      if (!element.open) {
        opener.current = document.activeElement as HTMLElement | null;
        element.showModal();
        // Start on the car in view, so the list opens where the visitor already is.
        element.querySelectorAll<HTMLElement>(".index-link")[useArcade.getState().centered]?.focus({ preventScroll: true });
        play("paper");
      }
      // Next frame, so the sheet starts from off-screen and transitions in.
      const frame = requestAnimationFrame(() => (element.dataset.state = "open"));
      return () => cancelAnimationFrame(frame);
    }
    if (!element.open) return;
    element.dataset.byKey = String(useArcade.getState().indexByKey);
    element.dataset.state = "closing";
    play("paper");
    const timer = window.setTimeout(() => {
      element.close();
      delete element.dataset.state;
      // Esc restores focus to whatever opened the Index; picking a car leaves it to the listing.
      if (!navigating.current) opener.current?.focus({ preventScroll: true });
    }, element.dataset.byKey === "true" ? 0 : MOTION.indexClose);
    return () => window.clearTimeout(timer);
  }, [open]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="index-title"
      data-lenis-prevent
      className="index fixed inset-0 m-0 h-full max-h-none w-full max-w-none bg-transparent p-0"
      onCancel={(event) => {
        event.preventDefault();
        setOpen(false, true);
      }}
    >
      <div className="index-scrim absolute inset-0 bg-paper/80" onClick={() => setOpen(false)} aria-hidden />
      <div className="index-sheet absolute inset-y-0 right-0 flex w-[min(52rem,100vw)] flex-col overflow-y-auto border-l border-mist-300 bg-paper px-10 pt-8 pb-10">
        <div className="flex items-start justify-between gap-6">
          <h2 id="index-title" className="font-display text-[clamp(2rem,3.5vw,3.5rem)] leading-none font-medium">
            Index
          </h2>
          <button type="button" className="pill pill-soft" onClick={() => setOpen(false)} onPointerDown={() => play("press")}>
            Close <kbd aria-hidden className="kbd">Esc</kbd>
          </button>
        </div>

        <div aria-hidden className="index-row mt-12 border-b border-ink pb-3 text-[12px] tracking-[0.08em] text-mist-700 uppercase">
          <span>No.</span>
          <span>Year</span>
          <span>Car</span>
          <span>Mileage</span>
          <span className="text-right">Price</span>
        </div>
        <ol>
          {cars.map((car, index) => (
            <li key={car.slug} className="border-b border-mist-300">
              <Link
                href={`/cars/${car.slug}`}
                scroll={false}
                aria-label={`${carLabel(car)}, ${formatMiles(car.mileageMi)}${index === centered ? ", in view" : ""}`}
                className="index-row index-link py-5"
                onClick={() => {
                  navigating.current = true;
                  setOpen(false);
                }}
              >
                <span className="font-mono text-[13px] tabular-nums text-mist-700">{String(car.no).padStart(2, "0")}</span>
                <span className="font-mono text-[13px] tabular-nums">{car.year}</span>
                <span className="min-w-0">
                  <span className="block font-display text-[clamp(1.375rem,2vw,1.75rem)] leading-tight font-medium">
                    <CarName car={car} />
                    {index === centered && (
                      <span className="ml-3 inline-flex items-center gap-1.5 align-middle font-text text-[12px] font-normal tracking-[0.08em] text-mist-700 uppercase">
                        <span className="size-1.5 rounded-full bg-signal" />
                        In view
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-[13px] text-mist-700">
                    {car.marketName || !car.model.includes(car.chassis) ? `${carSubtitle(car)} · ` : ""}
                    {car.location} ·{" "}
                    <span lang="ja" className="font-ja whitespace-nowrap">
                      {car.marketNameJa}
                    </span>
                  </span>
                </span>
                <span className="font-mono text-[13px] tabular-nums">
                  {formatMiles(car.mileageMi)}
                  <span className="block text-mist-700">{formatKilometres(car.mileageMi)}</span>
                </span>
                <span className="text-right font-mono text-[13px] tabular-nums">{formatPrice(car.priceUsd)}</span>
              </Link>
            </li>
          ))}
        </ol>

        <p className="mt-auto max-w-[60ch] pt-12 text-[13px] leading-relaxed text-mist-700">
          Arcade is a concept. Every listing is fiction; makes, models and specifications are real. Not affiliated with any
          manufacturer; all trademarks belong to their owners.
        </p>
      </div>
    </dialog>
  );
}
