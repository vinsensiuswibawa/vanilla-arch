"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Carousel } from "@/components/experience/Carousel";
import { Chrome, toggleSound } from "@/components/experience/Chrome";
import { Cursor } from "@/components/experience/Cursor";
import { enterShowroom, Gate } from "@/components/experience/Gate";
import { IndexOverlay } from "@/components/experience/IndexOverlay";
import { cars } from "@/lib/cars";
import { leaveDetail } from "@/lib/detail";
import { film, filmSlug } from "@/lib/film";
import { prefersReducedMotion } from "@/lib/motion";
import { showroom } from "@/lib/showroom";
import { useArcade } from "@/lib/store";

// three, R3F and drei are most of the JavaScript; they load as their own chunk while the gate shows.
const Stage = dynamic(() => import("@/components/experience/Stage"), { ssr: false });
// The detail page (GSAP, ScrollTrigger, the car shapes) loads on its own the first time a listing opens.
const Detail = dynamic(() => import("@/components/detail/Detail"), { ssr: false });

const slugFrom = (pathname: string) => /^\/cars\/([^/]+)/.exec(pathname)?.[1] ?? null;

/**
 * The client root, mounted once in the root layout: the persistent canvas plus every DOM surface.
 * Routes only set metadata; this reads the URL and decides what shows.
 */
export function Experience() {
  const router = useRouter();
  const pathname = usePathname();
  const phase = useArcade((state) => state.phase);
  const listing = useArcade((state) => state.listing);

  // ?record loads and warms every car behind the gate before it opens (lib/store.ts).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("record")) useArcade.getState().setRecord();
  }, []);

  // Film mode (lib/film.ts): the showroom half of the run. The detail page drives its own track once open.
  useEffect(() => {
    const slug = filmSlug();
    const index = cars.findIndex((car) => car.slug === slug);
    if (index < 0 || prefersReducedMotion()) return;
    document.documentElement.classList.add("film");
    useArcade.getState().setRecord();
    const timers: number[] = [];
    const later = (seconds: number, run: () => void) => timers.push(window.setTimeout(run, seconds * 1000));
    // On a /cars/<slug>?film deep link the gate still has to be entered, but the carousel step is skipped.
    const deepLink = slugFrom(window.location.pathname) !== null;
    let step = 0;
    const advance = () => {
      const state = useArcade.getState();
      if (step === 0 && state.phase === "gate" && state.loaded.every(Boolean)) {
        step = deepLink ? 2 : 1;
        later(film.gateHold, () => enterShowroom(false));
      } else if (step === 1 && state.phase === "showroom" && !state.listing) {
        step = 2;
        later(film.showroomHold, () => {
          showroom.goTo(index);
          later(film.carouselGlide, () => router.push(`/cars/${cars[index].slug}${window.location.search}`, { scroll: false }));
        });
      }
    };
    advance();
    const unsubscribe = useArcade.subscribe(advance);
    return () => {
      unsubscribe();
      for (const id of timers) window.clearTimeout(id);
    };
  }, [router]);

  // The URL is the source of truth for the open listing; its car is centred behind it.
  useEffect(() => {
    const slug = slugFrom(pathname);
    const index = cars.findIndex((car) => car.slug === slug);
    const leaving = useArcade.getState().listing;
    useArcade.getState().setListing(index >= 0 ? slug : null);
    // Back from a listing, focus returns to that car's frame, so the keyboard path resumes there.
    if (leaving && index < 0) {
      const back = cars.findIndex((car) => car.slug === leaving);
      requestAnimationFrame(() =>
        document.querySelectorAll<HTMLElement>("[data-frame]")[back]?.focus({ preventScroll: true }),
      );
    }
    if (index >= 0) {
      if (useArcade.getState().phase === "gate") useArcade.getState().setCentered(index);
      showroom.goTo(index, { immediate: useArcade.getState().phase === "gate" });
    }
  }, [pathname]);

  // When the gate lifts, focus lands on the centred car so the keyboard path continues from there.
  useEffect(() => {
    if (phase !== "entering" || listing) return;
    const frame = requestAnimationFrame(() => {
      const links = document.querySelectorAll<HTMLElement>("[data-frame]");
      links[useArcade.getState().centered]?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [phase, listing]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable='true']")) return;
      const state = useArcade.getState();

      if (state.phase === "gate") {
        // Enter means "with sound" unless a gate button has focus, in which case it presses that button.
        if (event.key === "Enter" && !(target instanceof HTMLButtonElement)) {
          event.preventDefault();
          enterShowroom(true);
        }
        return;
      }
      if (state.phase !== "showroom") return;

      // An open detail page owns the keyboard (its own handler steps through the sections); only Esc comes here.
      const key = event.key.toLowerCase();
      if (state.listing) {
        // The mute stays reachable (PRODUCT.md: sound needs a visible mute); the detail page has its own too.
        if (event.key === "Escape") {
          event.preventDefault();
          leaveDetail(() => router.push("/", { scroll: false }));
        } else if (key === "m") toggleSound();
        return;
      }
      if (key === "m") return toggleSound();
      if (key === "i") return state.setIndexOpen(!state.indexOpen, true);
      if (state.indexOpen) return;

      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (step) {
        event.preventDefault();
        const next = Math.max(0, Math.min(cars.length - 1, showroom.target + step));
        // Held keys repeat; repeats jump rather than queue animations.
        showroom.goTo(next, { immediate: event.repeat });
        // Roving focus: if a frame had focus, it moves with the row, so the ring is always on the centred car.
        if (target.hasAttribute("data-frame")) {
          document.querySelectorAll<HTMLElement>("[data-frame]")[next]?.focus({ preventScroll: true });
        }
      } else if (event.key === "Enter" && target === document.body) {
        router.push(`/cars/${cars[state.centered].slug}`, { scroll: false });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  // Dev tool routes (asset studio, lighting lab) render their own canvas; the showroom stays out.
  if (/^\/(studio|lab)\//.test(pathname)) return null;

  const gated = phase === "gate";
  return (
    <>
      <Stage />
      {/* An open detail page takes the whole screen; the showroom keeps its place underneath, hidden. Its
          chrome and frames fade out over 0.4 s at hand-off (M12 reversed, docs/overhaul.md step 2) rather
          than vanishing instantly; `inert` still disables them the moment a listing opens. */}
      <div className="contents">
        <Chrome inert={gated || listing !== null} fading={listing !== null} />
        <main className="relative z-10">
          <Carousel inert={gated || listing !== null} fading={listing !== null} />
        </main>
      </div>
      {listing !== null && <Detail />}
      <IndexOverlay />
      <Cursor />
      <Gate />
    </>
  );
}
