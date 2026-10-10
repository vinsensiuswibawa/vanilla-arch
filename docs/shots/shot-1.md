# Shot 1 report: the showroom

Date: 2026-10-06. Gate status: **met on desktop, pending your `/review-animations` verdict** (it is command-only, so Claude can't run it).

## Gate check

| Gate item (PRD) | Status |
| --- | --- |
| Nine cars at 60 fps on desktop | Done. Production build, wheel-scrolling through all nine for 6 s: 60.0 fps average, p95 frame 16.9 ms, no frame over 33 ms (Intel Arc 130T, Chrome, Direct3D 11) |
| `/impeccable critique` passes | Done. 25/36 (69%, Good); no P0. Both P1s fixed, and the P2s fixed except the veil question below |
| `review-animations` verdict Approve | Round 1 was Block; all seven findings are fixed (below). **Waiting on your re-run** |
| `npm run check` green | Done: typecheck, lint, build and 5 Playwright tests (gate; keyboard path with the Index; reduced motion; deep link plus Esc with focus restored; 404s) |

## What was built

- **Persistent stage.** `app/layout.tsx` mounts `<Experience />`; routes set metadata only. `/cars/[slug]` is static for the nine cars, and unknown slugs 404.
- **One canvas, lazily loaded.** `Stage.tsx` holds the only `<Canvas>` (`frameloop="never"`) with one drei `View` per frame, each tracking a DOM slot. The carousel's single rAF loop runs Lenis, moves the track, writes the veil and then calls R3F's `advance`, so views never lag the DOM by a frame.
- **Gate (FR-01).** Server-rendered, so the wordmark paints before JS. ARCADE in Bodoni capitals over the nine frame glyphs, which fill as each car becomes ready. Enter with or without sound; the choice persists and its button takes focus next time. Shows on every load (decided).
- **Carousel (FR-02 to FR-07).**
  - Movement: Lenis at lerp 0.09 with `gestureOrientation: "both"`. Soft snap 150 ms after the last input, 500–700 ms by distance on ease-out, and any input cancels it. ← → (and ↑ ↓) step; Home, End, PageUp and PageDown scroll natively and then snap.
  - The veil is the PRD formula verbatim; hover clears a further 30%.
  - Turntable: 60 s a revolution, ramping in over 1.2 s once the car settles; others spring back to the ¾ pose. Hover speeds it 1.5×.
  - Every frame is an `<a>` named like "1991 Eunos Roadster (Mazda MX-5, NA6CE), $14,500". The label shows name, year, chassis, No. and price, with a vertical Mincho market name on the floor beside the frame.
  - Emblem top-right, period-correct (Mazda 1991 for the Eunos, Mazda 1992 for the FD, Nissan 1983–2002 for the R34).
- **Index (FR-08).** A modal `<dialog>`: an architect's list with No., year, car, mi and km, and price. It slides in at 320 ms on the drawer curve and out at 220 ms, interruptibly. It opens on the car in view; Esc restores focus.
- **Sound (FR-20).** `lib/audio.ts`, all Web Audio from noise: room tone, snap tick, Index paper slide, button press, and the breath ready for Shot 2. `M` and a visible toggle mute it, the choice persists, and audio pauses while the tab is hidden.
- **Cursor (FR-06).** An ink "View the car" pill with a signal dot, following at lerp 0.18, on fine pointers only. Native cursor under reduced motion.
- **Keyboard.** Focus lands on car 01 when the gate lifts and moves with the row. The ring traces the frame's own shape, with the name underlined as a second cue. Back from a listing, focus returns to that car.
- **Listing placeholder.** `/cars/[slug]` shows a fact panel with "Back to showroom". Shot 2 replaces it with the morph and the eight chapters.

## Budgets

| Budget | Result |
| --- | --- |
| Initial JS ≤ 350 KB gzipped | 203 KB. three, R3F and drei (about 265 KB gzipped) load as their own chunk while the gate shows |
| 60 fps desktop | 60.0 fps, no stalls (above) |
| First-view stalls | Fixed. Each car is compiled and drawn once offscreen when it loads; before this, ANGLE stalled 300 ms to 1 s the first time each car scrolled into view |

## Audit protocol

| Step | Result |
| --- | --- |
| `frontend-design` self-critique | Done: specific to the subject. The Index's hairline rows are the closest call to the editorial cluster, justified as an architect's project list |
| `/impeccable critique` | Done, dual-agent. Snapshot in `.impeccable/critique/` |
| `/impeccable audit` | Done in-thread: Accessibility 3, Performance 4, Responsive 1 (desktop-only by plan; Shot 3), Theming 3, Integrity 4 = 15/20 (Good). The detector is clean; axe's `region` findings are fixed. No P0 or P1 open |
| Impeccable hooks | On. No findings during the shot |
| `/review-animations` | **Your turn** |

## Fixed from the critique

1. Focus was lost to `<body>` after leaving a listing; it now returns to the car's frame.
2. The cars were undersized; frame fits are raised in `lib/frames.ts`.
3. Bodoni's hairline hyphens erased "RX-7" and "GT-R"; hyphens are now set in Host Grotesk.
4. Hover went stale when the row moved under a still pointer; it is re-hit-tested as the row moves. The pill hides behind the gate, the Index and a listing.
5. The Index opened with focus on its scroll container; it now opens on the car in view.
6. Landmarks: the gate is a labelled section and the wordmark sits in a `<header>`. The chrome now comes before the row in tab order.
7. The live dot hides under reduced motion; the gate announces readiness once; the meta description said 2010 and now says 2008 (the LP 560-4's year). The PRODUCT.md lineup now matches `lib/cars.ts`.

## Motion review, round 1 (`/review-animations`: Block, all seven findings applied)

| Finding | Fix |
| --- | --- |
| Pill and hover mist flickered as frames passed under a still pointer during scroll | Hover clears when the row starts moving and is re-read once when it rests; no hover during the gate lift |
| Emblem and live dot blinked on every (often keyboard) step | Emblem swaps instantly on the nearest car; the dot toggles with no transition |
| `I` slid the Index in like a drawer | The shortcut opens and closes it instantly; the button keeps the 320 ms drawer slide |
| A departing car sprang back to its ¾ pose in view, so the turntable visibly ran backwards | The spin eases out and the car holds; it resets to ¾ only once the veil is 1 |
| Gate and emerging car double-exposed | The gate content blurs (8 px) as it lifts; the car's mist holds for the first 400 ms, then clears over 800 ms (1200 ms total) |
| The cursor's follow depended on frame rate | Time-scaled: 0.18 per 60 Hz frame on any display |
| The pill faded in from nothing | It grows from scale 0.92 with the fade |

Two follow-ups surfaced in the re-measure:
- The instant emblem swap rasterised the BMW roundel SVG on the GPU in one frame, a 100 ms stall at car 06. Emblems now ship as 2× PNGs (1–3 KB each), with the SVGs kept as sources.
- The offscreen warm-up drew into a render target, which three.js compiles as a different shader variant (no tone mapping). It now draws one canvas pixel, warming the variant actually used on screen.

The nine car scenes also no longer re-render when the centre changes. Result: three production runs at 60.0 fps with no long animation frames. Re-run `/review-animations` for the verdict.

## Deviations from the PRD's architecture notes (implementation only; no decision reopened)

- **Frame masks.** A paper mat (SVG, even-odd) sits over each view instead of drei's stencil `Mask`. Edges stay crisp and antialiased, and the frame paths can still be morphed in the P1 polish. The mist is a DOM layer in the cyclorama's colours whose opacity is the veil; the 3D layer draws the cyclorama itself.
- **GSAP is not installed yet.** Shot 1 needs only Lenis and CSS transitions, which reverse from their current value, so they are interruptible. GSAP arrives with Flip for the Shot 2 morph.
- **The vertical scrollbar is hidden.** It would point the wrong way for a sideways row; the progress glyphs and the Index stand in.
- **Emblems.** No freely licensed Honda "H" or Lamborghini bull shield exists, so those two use their public-domain wordmarks. Credits are in `content/emblems.json` for `/credits` in Shot 3.

## Needs your call

1. **The veil and the neighbours.** The PRD's veil is `smoothstep(0.18, 0.85, d)` with `d` normalised to half the viewport. At a sensible frame spacing, the neighbouring cars sit at a veil of about 0.85, so they read as empty windows (hover clears them to a ghost). The critique flagged this against the colonnade idea. Options:
   - Keep the PRD numbers. That's GT4-faithful: cars appear only at centre.
   - Widen the edges to about (0.3, 1.05) so the next car reads at about half mist.
   - Normalise `d` by frame spacing, so the neighbour sits at about 0.5 at every width.
2. **After car 09.** The row ends in white space. A closing beat (the Index, credits and the disclaimer) could be the peak-end moment. It's polish-pass material unless you want it in Shot 2.

## Notes

- Not deployed, as asked. Shot 0 and Shot 1 are both uncommitted.
- Impeccable's finish review and the DESIGN.md documenter are deferred until the surface is complete (after Shot 3). DESIGN.md is still the seed.
- Console: `/favicon.ico` 404s (icons are Shot 3). ANGLE's D3D shader-compiler warnings and R3F's `THREE.Clock` deprecation notice are library noise.
- Mobile is untouched (Shot 3): the critique saw the bottom pills overlap the glyph row at 390 px.
