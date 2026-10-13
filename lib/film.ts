// Film mode (?film, or ?film=<slug>): a hands-free, repeatable run of the whole experience for screen recording
// (the LinkedIn plan, after 7f). It implies ?record (every car warm before the gate opens), hides the cursor and
// the Next dev badge, enters without sound, glides the carousel to the car, opens it, then drives the detail
// page's track from stop to stop at a steady pace (halting on section C's summary, and touring the price charts
// with a stand-in cursor that hovers their marks and clicks through the tabs) and ends on the enquiry sidebar. Any wheel, key or pointer
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
  pace: 546, // u/s between stops (380, then +25%, then +15% at the user's request); each move takes at least `minMove`
  minMove: 1.65,
  hold: 1.8, // at each section stop
  summaryHold: 2.6, // the extra halt on section C's summary, once it is fully lit
  tourMarks: 5, // marks the stand-in cursor visits on each price chart
  tourStep: 0.4, // seconds per glide between marks
  tourPause: 0.35, // the tooltip held on each mark
  tabSettle: 0.7, // after a tab click, for M13's switch to play
  endHold: 2.4, // on section E before the sidebar opens
  sidebarHold: 3, // the sidebar on screen before the run reports done
} as const;
