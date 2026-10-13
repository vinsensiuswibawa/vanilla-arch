// Film mode (?film, or ?film=<slug>): a hands-free, repeatable run of the whole experience for screen recording
// (the LinkedIn plan, after 7f). It implies ?record (every car warm before the gate opens), hides the cursor and
// the Next dev badge, enters without sound, glides the carousel to the car, opens it, then drives the detail
// page's track from stop to stop at a steady pace and ends on the enquiry sidebar. Any wheel, key or pointer
// press hands control back to the visitor. Off under reduced motion.

/** The car to film, or null when film mode is off. `?film` alone films the TR6. */
export function filmSlug(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  if (!params.has("film")) return null;
  const value = params.get("film");
  return value && value !== "1" ? value : "triumph-tr6";
}

/** Seconds, and the track pace in u per second (1u = 1px at the 1440 reference). */
export const film = {
  gateHold: 1.2, // after every car is warm, before entering
  showroomHold: 2.2, // the showroom on screen before the carousel moves
  carouselGlide: 2.4, // time for the carousel to centre the car before it opens
  afterEntry: 1.6, // the hero held after the car settles
  pace: 380, // u/s between stops; each move takes at least `minMove`
  minMove: 2.4,
  hold: 1.8, // at each section stop
  endHold: 2.4, // on section E before the sidebar opens
  sidebarHold: 3, // the sidebar on screen before the run reports done
} as const;
