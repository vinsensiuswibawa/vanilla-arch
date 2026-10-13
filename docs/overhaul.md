# Arcade UI overhaul: the car detail page

Planning document for the overhaul, written with the user on 2026-10-08 and executed later by a separate session
(Sonnet) one shot at a time. Status: **built, shots 6a–6h** (2026-10-10); the per-shot status blocks in step 6 record how
the build differs from the plan. "After the overhaul" is what comes next.

How to use this file: each step below is reviewed by the user before the next is written. The build (step 6) runs
shot by shot, and each shot stops at its gate for review. Where this file and `docs/PRD.md` disagree, this file wins
for the detail page; the PRD still governs everything else until the showroom redesign.

## Scope

The overhaul splits the site in two. **This plan covers the car detail page** and the transition into it from the
existing carousel. The showroom (carousel) redesign comes later, under the same principles; the detail page must
accept the car from whatever camera pose the future carousel uses.

**The flow.** A visitor clicks a car in the carousel. Its 3D model grows from its frame to the middle of the screen
(reference: Agrumea Farm, where the jar travels from the carousel down into the product hero) and settles into a slow
turntable, while the listing's text and data arrive in gentle, staggered reveals. From there the page scrolls
horizontally through photos, an editorial overview, specs, a price comparison and an enquiry, and the car moves
through the page with the scroll, Apple product-page style.

**North stars:** [Normal is Boring](https://normalisboring.es/) and [Saisei](https://saisei-sbj.webflow.io/) for
motion and interaction; [Cars & Bids](https://carsandbids.com/) for listing content and order. The goal is an
expensive feel (text reveals, image reveals, parallax) on a page that still works as a car listing.

## Decisions locked (2026-10-08)

| Topic | Decision |
| --- | --- |
| Visual system | Undecided. Two directions are built side by side as design tokens behind `?theme=`: the current system (Bodoni Moda, Host Grotesk, Geist Mono, achromatic plus signal orange) and the user's earlier Figma direction (Satoshi for text and display, Staatliches for the narrow condensed subheadings, deep teal ink on off-white, dark spec bar). Fonts load via `next/font`. Staatliches is OFL. Satoshi (Indian Type Foundry, Fontshare, ITF Free Font License) is allowed by the user as a named exception to the OFL rule, self-hosted through `next/font/local`; the build keeps its licence file with the font and credits it. |
| Grid | Five columns, 24 px outer margins, 24 px gutters, drawn at 1440 × 960. Applies to the whole site. Responsive, tuned for 1080, 1440 and 1920 widths. Desktop only. |
| Page direction | Fully horizontal: the wheel moves the whole detail page sideways, from the hero to the enquiry. |
| Car at rest | Slow turntable in a low side three-quarter pose (the Figma hero). Drag rotates about the vertical axis only; no pitch. |
| Car on scroll | Scroll-driven camera choreography between poses (hero, roof, side, front), shared by all 13 cars and scaled to each car's size; per-car overrides only when one looks wrong. Transitions are tied to scroll position, so they reverse when scrolling back. |
| Layers | Three stacks: a "behind" DOM layer (for example the large car name), the transparent 3D canvas, and a "front" DOM layer that can cover the car (heavy sections such as specs). All text stays real DOM text. |
| Entry from the carousel | The car's view grows from its frame to full screen while the camera eases from the carousel's pose (any angle) into the hero pose. |
| Deep links | `/cars/<slug>` opened directly shows the gate as today, then the detail page plays its own entry (the car settles in, text reveals). |
| Chrome | Only a way back to the showroom, plus a horizontal progress indicator. The make's emblem shows in the hero only. The bottom spec bar is pinned through the first sections, then fades out downwards (at the end of section A). "Jump to specs" scrolls to section C. |
| Emblems | Keep the current freely licensed wordmarks (the Figma crests were mockups). |
| Price | USD. |
| Colour swatches | None: Arcade is not a new-car dealer. |
| Condition report | Moves into the equipment and history overlay (not its own section). |
| Overlays and later pieces | Equipment and history overlay, full gallery and the enquiry form are placeholders for now. No backend anywhere: this is a showcase. |
| New copy | Claude drafts the new per-car fields for all 13 cars, in the current curator voice, for review. |
| Thin photo sets | Source more photos before building (Peugeot has 2; Porsche and Datsun have 3). |
| Clip-path | Allowed as a named exception to the motion non-negotiable, for image reveals only: `clip-path: inset()`. Everything else still animates transform, opacity and blur only. |
| Animation library | Adopt GSAP (ScrollTrigger, SplitText, Flip; all plugins free since 2025). Versions are checked on npm at build time. Lenis stays for smooth scrolling. |
| Motion numbers | The overhaul's motion vocabulary (step 2) replaces the PRD's motion spec for the detail page. The showroom's numbers are revisited in its own redesign. |
| Order of work | Detail page first, entered from the current carousel; the showroom redesign after. |

## Research findings (2026-10-08)

Read from the sites' own scripts (`.cache/research/`, gitignored): Normal is Boring's unminified theme files and
Saisei's minified bundle.

### Normal is Boring

- **Stack:** GSAP 3.12 with ScrollTrigger, SplitText and MorphSVG; Lenis with default settings; Swiper.
- **Horizontal scroll:** pins `main` and translates all sections along x on one timeline, driven by scroll with a
  smoothing lag of 1. Every inner animation is attached to that horizontal timeline, so triggers are horizontal
  positions.
- **Headline reveal:** split into lines, then characters; each character rises 110% from under a line mask over
  0.65–0.75 s, `power3.out`, staggered 0.03–0.05 s. Alternate lines come from opposite directions (+110% / −110%).
- **Paragraph reveal:** split into lines; each line rises 100% from under its mask over 0.5 s, staggered 0.09 s,
  starting when the paragraph reaches 75% of the viewport.
- **Scroll-to-reveal text:** characters run from 30% to 100% opacity, staggered 0.005 s, tied to scroll with a 0.5
  lag, from the text entering at 90% of the viewport until its middle reaches 40%. The horizontal variant brightens
  whole lines from 20%, staggered 0.1.
- **Image reveal:** `clip-path: inset(100% 0 0 0)` opens to 0 over 1.2 s, `power3.out`, while the image inside rises
  35% over 1.5 s. Triggered when the image's middle enters the viewport.
- **Parallax:** a separate scroll-tied layer runs the inner image from +100% to 0 while it crosses the viewport (lag
  0.5). The inner image is 115% tall so it never shows an edge.
- **Image swap in one slot:** the top image clips away (left to right or right to left) over 1.5 s, `power2.out`,
  while the image underneath scales from 1.2 to 1 over 2 s.
- **Section exit:** the outgoing section scales to 0.85 and fades to 85% opacity, tied to scroll.

### Saisei

- **Stack:** GSAP with ScrollTrigger and Flip; Lenis at duration 1.4, an exponential ease-out
  (`1.001 - 2^(-10t)`), wheel multiplier 1.6; custom text splitting.
- **Dominant move:** `yPercent: 100` to 0 over 1.5 s, `power3.out`, staggered 0.1–0.2 s (from under a mask). Also
  slides from the left (`xPercent: -100`), rules and lines drawn by growing from zero width, and fades with
  `sine.out` over 1.5 s.
- **Character:** slower and more uniform than Normal is Boring; almost every move lasts 1.5 s, and stagger carries
  the rhythm.

### What carries the expensive feel

Masked reveals (text rising from under a mask, images clipping open), long `power3.out` curves, overlapping
staggers, and continuous scroll-tied parallax. Neither site uses 3D; the scroll-driven car is Arcade's own signature
on top of that vocabulary.

### Cars & Bids order (content reference)

Photos, then the quick-facts table, the curator's take, highlights, equipment, modifications, known flaws, service
history, items included, ownership history and seller notes. Arcade keeps photos, full specs, the take and the
enquiry on the page, and moves the long lists into the overlay.

## What changes in the PRD

- **Replaced for the detail page:** the motion spec (step 2), the listing chapters and layout (steps 3 and 5), and
  the "morph" description (step 4).
- **Amended:** the motion non-negotiable gains the clip-path exception; GSAP joins the stack; the condition report
  moves into an overlay.
- **Kept:** one persistent canvas in the root layout, with DOM driving and drei Views following; every 3D fact also
  exists as DOM text; OFL fonts; achromatic-UI rule while the current direction is on test; reduced motion honoured;
  the 13 hero models and record mode.
- The PRD and its decision log get updated once this plan is approved, and the Claude Doc mirror after that.

## Page outline (from the user's storyboard)

Each section is specified in steps 3 to 5; this is the order and intent only. The visual reference is the user's
storyboard, processed frame by frame with positions, layers and the user's notes in
[`docs/storyboard/README.md`](storyboard/README.md) (14 frames at 1440 × 960). Read it with the frames before
building any section.

1. **Hero.** Large car name behind the car; make and year; "Jump to specs"; the make's emblem; the turntable; the
   first photo peeking in from the right as a scroll cue; the bottom spec bar (mileage, engine, colour, location,
   price).
2. **A: Photos.** Three or four photos in an asymmetric layout on the grid, using an image-swap reveal so one slot
   shows several photos. At the end, the camera moves to a top-down roof view, slightly angled right, on the left
   of the composition, and the bottom bar fades out downwards.
3. **B: About the car.** Magazine layout in the manner of a Stuttgart brochure: headline, general text, a
   480 × 640 photo with a cycling reveal and parallax. The next section always peeks in at the edge.
4. **C: Specs.** A dark section in front of the car: a one-line summary in scroll-to-reveal text, the listed
   specifications, "Our take" and "To keep in mind", and a button for the overlay (equipment, modifications, flaws,
   condition report, ownership and service history). The camera moves from the roof to a side view, starting as the
   dark section is almost off screen.
5. **D: Price comparison.** A light section in front of the car with the interactive price chart and further
   datasets, then a photo slideshow with "See all of this car's images" (placeholder gallery). The camera then
   moves from the side view to a centred front view.
6. **E: Enquiry.** "Give it" fades in from the left and "a new home" from the right; the enquiry form arrives in a
   sidebar, by scrolling far enough or with the "Inquire about this car" button (placeholder, no backend).

## Step 2: Motion vocabulary

*Written 2026-10-08, awaiting review.* Every animation on the detail page is one of the named effects below. Values
sit between Normal is Boring (quicker, 0.5–1.2 s) and Saisei (slower, 1.5 s throughout), leaning slow: the page should
feel unhurried. GSAP names are given; CSS equivalents are for non-GSAP transitions (hover, focus).

### Principles

- **Two kinds of motion.** *Triggered* effects play once on a timeline when their element reaches a trigger point,
  and stay played (they don't reverse when scrolling back, as in both references). *Scroll-tied* effects are a pure
  function of scroll position, so they reverse naturally: the horizontal travel, parallax, the scroll-to-reveal text,
  the bottom bar's exit and every camera move.
- **Triggers are horizontal.** The page scrolls sideways, so trigger points are measured along the x axis: "at 85%"
  means "when the element's left edge reaches 85% of the viewport's width". Every inner trigger hangs off the one
  horizontal timeline (GSAP `containerAnimation`).
- **Masks, not fades.** Text rises from under a line mask; images open with a clip. Plain opacity fades are reserved
  for small chrome. Content never slides in from far away: travel is at most one line height, or ~15% of an image.
- **Overlap.** Sequences overlap generously (each item starts before the previous ends); stagger carries the rhythm.
- **Allowed properties.** `transform`, `opacity`, `filter: blur()` (≤ 8 px) and, for image reveals only,
  `clip-path: inset()` (the recorded exception). Nothing animates layout (`width`, `height`, `top`, `left`). Rules
  draw with `scaleX`, not width.
- **Interruptible.** Scroll-tied effects can't be interrupted by definition. Triggered timelines never block input:
  scrolling during the hero entry fast-forwards it (its remaining time compresses to 0.3 s).

### Easing

| Token | GSAP | CSS | Use |
| --- | --- | --- | --- |
| `reveal` | `power3.out` | `cubic-bezier(0.215, 0.61, 0.355, 1)` | Text rises, image clips, sidebars arriving. The default. |
| `settle` | `expo.out` | `cubic-bezier(0.16, 1, 0.3, 1)` | The car arriving from the carousel; long decelerations. |
| `travel` | none (custom) | `cubic-bezier(0.8, 0, 0.45, 1)` | Inside each camera transition's scroll range: very gentle at the start, fastest about two thirds of the way, then a long soft landing (user, 2026-10-09; it was `power2.inOut`, then `power3.in`, which snapped at the end). Code: `travelBezier` in `lib/detail-motion.ts`. |
| `swap` | `power2.out` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | The image-swap wipe. |
| `fade` | `sine.out` | `cubic-bezier(0.39, 0.575, 0.565, 1)` | Opacity-only chrome. |
| `leave` | `power2.out` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Closing sidebars and overlays. Was `power2.in` until `/review-animations` after 6h: ease-in on UI delays the response the visitor is watching. |
| `linear` | `none` | `linear` | Scroll-tied effects (the scroll supplies the feel). |

### Scroll

- Lenis smooths the wheel (lerp 0.1, wheel multiplier 1.0, trackpad and touch native). The vertical scroll distance
  drives one horizontal timeline that translates the page track with Normal is Boring's extra lag (`scrub: 1`), the
  user's choice for its floatier feel.
- **The camera reads that same lagged timeline**, never the raw scroll, so the car and the DOM stay in lockstep
  despite the lag. Every scroll-tied effect (M3, M6, M7, M10, the camera) takes its progress from the horizontal
  timeline.
- The lag is one constant (`SCROLL_LAG`, default 1). Setting it to 0 gives the Lenis-only alternative (no extra lag),
  which the user may want to compare later; nothing else changes.
- Keyboard: arrows and Page Up/Down step by one section; Home and End go to the hero and the enquiry. "Jump to specs"
  scrolls to section C in 1.2 s (`reveal`).
- The progress indicator is a 1 px line across the top that fills with `scaleX` from 0 to 1, scroll-tied.

### The effects

| # | Name | What moves | Values | Trigger | Used in |
| --- | --- | --- | --- | --- | --- |
| M1 | Line rise | Text split into lines; each line rises from under its own mask. | `yPercent` 100 → 0, 0.9 s, `reveal`, stagger 0.08 s | Triggered at 85% | Labels, paragraphs, spec rows, "Our take", "To keep in mind", captions |
| M2 | Character rise | Display text split into lines, then characters; characters rise from under the line mask, every line in the same direction (from below). | `yPercent` 110 → 0, 0.8 s, `reveal`, stagger 0.03 s per character, lines start 0.12 s apart | Triggered at 80% | The car name (hero entry), section headlines, "Give it", "A new home" (see M9) |
| M3 | Scroll-to-reveal text | Characters brighten from dim to full as the block crosses the screen. | Opacity 0.2 → 1 per character, `linear`, stagger spread over the range | Scroll-tied, from the block's left edge at 90% to its centre at 45% | Section C summary quote |
| M4 | Image reveal | The frame's clip opens from the bottom while the photo inside rises into place. | Clip `inset(100% 0 0 0)` → `inset(0)`, 1.2 s, `reveal`; inner photo `yPercent` 15 → 0, 1.5 s, `reveal`, then settles from 1.05 to 1 over 1.4 s, starting at 0.6 s | Triggered when the image's left edge reaches 80% | Every photo's first appearance |
| M5 | Image swap | Several photos share one slot: the top photo wipes away right to left, uncovering the next, which settles from a slight zoom. | Top clip `inset(0)` → `inset(0 100% 0 0)`, 1.4 s, `swap`; next photo `scale` 1.15 → 1, 1.9 s, `reveal` | See the cadence note below | Section A's smaller slot, section B's 480 × 640 photo, the section D slideshow |
| M6 | Parallax | The photo inside its frame drifts against the scroll; the frame stays on the grid. Photos are rendered 112% wide so no edge shows. | Inner `xPercent` −6 → +6 across the frame's trip through the viewport, `linear` | Scroll-tied | All photos in frames |
| M7 | Depth drift | Behind-layer type moves slightly slower than the page, so it separates from the front layer and the car. | Offset `x * (1 - speed)`, `linear`; speeds: name 0.82, make · year 0.88, "Jump to specs" 0.94, "Give it" 0.85, "A new home" 1.1 (opposite to "Give it", echoing M9). Wired in 7c | Scroll-tied | Hero name, make · year, "Jump to specs", "Give it / A new home" |
| M8 | Rule draw | Hairlines draw from left to right. | `scaleX` 0 → 1, origin left, 1.2 s, `reveal`, stagger 0.06 s | Triggered with their row (M1) | Spec table rules, the progress line on first show, link underlines on hover (0.3 s) |
| M9 | Scroll fade (was Side entrance; changed after 7f) | Section E's headings and the form link fade in with the scroll. | Opacity 0 → 1, `linear`, all three together | Scroll-tied, M3's range: section E's resting left edge from 90% of the viewport to 45% | Section E |
| M10 | Bar exit | The bottom spec bar slides down and out. | `yPercent` 0 → 100, opacity 1 → 0 over the last 30% of the bar's travel, `linear` | Scroll-tied, over section A's final 25% | Bottom spec bar |
| M11 | Sidebar | A panel arrives from the right over a scrim. | Panel `xPercent` 100 → 0, 0.8 s, `reveal`; scrim opacity 0 → 0.4, 0.6 s, `fade`; closing 0.5 s, `leave` | Clicked, or (enquiry) section E reaching 40% | Enquiry form, equipment and history overlay (placeholders) |
| M12 | Chrome fade | Small UI fades in place. | Opacity 0 → 1, 0.6 s, `fade` | With its sequence | Emblem, back link, "Scroll for more", "Jump to specs" |
| M13 | Tab switch | The price module's tabs: the active-tab bar slides, the incoming panel rises in. (Added in 7b, user-approved.) | Indicator `x`/`scaleX`, 0.3 s, `reveal`, retargets mid-flight; panel text, chart box and caption opacity 0 → 1 and `y` 8 → 0, 0.3 s, `reveal`, stagger 0.05 s; dots scale 0.85 → 1 (stagger 0.012 s), scatter points fade, history line draws along its clip then its points fade | A pointer click on a tab (keyboard switches are instant; reduced motion: 0.3 s fade only) | The price module's three tabs |
| M14 | Frame drift | Small overlapping photos move at 1.12× the page, so they slide over their neighbours. (Added in 7c.) | `-(x - xc) × 0.12` px on the frame, `linear`; `xc` is the track x at which the frame is centred | Scroll-tied | A2, B photo, slideshow swap |

**Image-swap cadence (M5).** Everywhere (section A, section B's photo, the section D slideshow): scroll-tied, one
swap per half-viewport of travel while the slot is on screen, so the visitor drives it and scrolling back reverses
it. Nothing cycles on a timer.

### The hero entry (from the carousel)

One timeline, 2.4 s in total, the car first:

| Time | What happens | Effect |
| --- | --- | --- |
| 0.0–1.6 s | The car's view grows from its carousel frame to the full viewport while the camera eases from the carousel's pose to the hero pose. | `settle`, 1.6 s (camera spec in step 4) |
| 0.0–0.4 s | The carousel's other frames and chrome fade out. | M12 reversed, 0.4 s |
| 0.7 s | The car name rises. | M2 |
| 1.1 s | Make · year and "Jump to specs" rise. | M1 |
| 1.2 s | The bottom spec bar rises from below (`yPercent` 100 → 0, 0.9 s, `reveal`), then its values rise (M1). | M1 |
| 1.4 s | The first photo opens at the right edge. | M4 |
| 1.6 s | Emblem, back link and "Scroll for more" appear. | M12 |
| 1.6 s → | The turntable ramps up over 1.2 s (the existing ramp). | — |

**Deep-link entry** (no carousel): the same timeline, but the car fades in place over 0.8 s (`fade`) with a short
camera settle (2° of rotation, 3% of zoom) instead of the grow from a frame.

**Leaving** (back to the showroom): the detail page and its car fade out together over 0.6 s (`fade`) from wherever
the visitor is, while the showroom fades in (step 4).

### Camera moves (timing class only; poses in step 4)

The three camera transitions are scroll-tied, eased with `travel` inside their range, and read their progress from
the lagged horizontal timeline, so the page's `scrub: 1` already keeps a flick of the wheel from snapping the car.
Only when `SCROLL_LAG` is 0 does the camera add its own damping (the rendered pose follows the target with an
exponential smoothing that covers 95% of the gap in 0.35 s); otherwise the car would lag twice.

### Reduced motion

- Triggered effects (M1, M2, M4, M8, M9, M12) become a 0.3 s opacity fade with no travel; M5 swaps become a 0.4 s
  crossfade at the same scroll points.
- Scroll-tied text (M3) shows at full opacity; parallax and depth drift (M6, M7) are off.
- The horizontal scroll stays (it's the page), with Lenis smoothing off.
- The turntable stops at the hero pose. Camera transitions cut to their target pose at the midpoint of their scroll
  range instead of travelling.
- Sidebars fade in place (0.3 s) instead of sliding.

### Performance rules

- Split text once after fonts load (`document.fonts.ready`) and re-split on resize (debounced 150 ms); keep the
  original text in the DOM for screen readers (`aria-label` on the split element, the pieces `aria-hidden`).
- `will-change` only while an effect runs. Clip-path reveals at most two at a time on screen.
- Hold 60 fps on the Intel Arc laptop at 1440 and 1920 wide, with the hero files, through the whole horizontal
  journey (measured in a run without screenshots).

### Resolved in review (2026-10-08)

1. Display lines all rise in one direction (from below).
2. Image swaps follow the scroll everywhere, including section B ("cycled through" meant the same as section A).
3. Normal is Boring's extra lag (`scrub: 1`) is the default; Lenis-only stays one constant away for a later
   comparison.

## Step 3: Layout and layers

*Written 2026-10-08, awaiting review.* Positions come from the storyboard frames (`docs/storyboard/README.md`),
snapped to the grid. Sizes are written at the 1440 × 960 reference.

### Grid and scale

- **Columns.** Five columns, 24 px outer margins, 24 px gutters at every width. Column width = (viewport width −
  144) / 5: **187 px at 1080, 259 px at 1440, 355 px at 1920.** Column *n* starts at 24 + (n − 1) × (column + 24):
  at 1440, columns start at 24, 307, 590, 874 and 1157 px.
- **Scale unit.** Everything drawn in Figma pixels (type, photo sizes, section widths, vertical positions) is
  multiplied by one unit: `--u = min(100vw / 1440, 100vh / 960)`. The design keeps its 3 : 2 proportions on any
  screen: at 1920 × 1080, `--u` = 1.125; at 1080 × 720, 0.75. Margins and gutters stay 24 px; only `--u`-sized things
  scale. Sizes below are at `--u = 1`.
- **Widths.** Tuned for 1080, 1440 and 1920 wide; supported from 1024 × 640. No maximum width: wide screens get more
  of the horizontal track at once. Desktop only.
- **Vertical rhythm.** Every section is exactly one viewport tall (no vertical scrolling inside sections). Bottom
  alignments use the 24 px margin; top alignments use 24 px, or 160 px for photos that align with the storyboard's
  upper line.

### Layers

| z | Layer | Holds | Pointer events |
| --- | --- | --- | --- |
| 0 | Page background | The page colour (theme token). | — |
| 1 | **Behind** | Light "fields" the car stands on (the pale panels in frames 2–4, 9–10, 13–14), the large type the car passes in front of (car name, "About" headline, "Give it / A new home"). | Text selectable |
| 2 | **Canvas** | The one persistent, transparent 3D canvas (fixed, full viewport). Only the car and its baked shadow; no cyclorama on the detail page. | None (see the drag target) |
| 3 | **Front** | Photos, the dark sections (C, the slideshow), the price section, small text, buttons. Covers the car where they overlap. | Normal |
| 4 | Chrome | Back link, progress line, bottom spec bar. | Normal |
| 5 | Overlays | Enquiry sidebar, equipment and history overlay, gallery (placeholders). | Normal |

- Behind and front both live in the one horizontal track and move together (behind-layer type adds M7's depth
  drift). The canvas doesn't move with the track: the car's screen position comes from the camera (step 4).
- **Drag target.** An invisible element in the front layer covers the car's on-screen bounds in the hero only, where
  the turntable runs; dragging it rotates the car about the vertical axis. Elsewhere the car is scroll-driven only.
- **Every 3D fact is also DOM text**, as before: the car's identity and specs are all in the hero, the bar and the
  spec table.

### The track (section widths)

The page is one horizontal track. Widths are in `--u` units of the 1440 reference, so 1440 = one viewport at the
reference size; the totals are approximate and get tuned in the build.

| Section | Width | Contents and layer | Camera (step 4) |
| --- | --- | --- | --- |
| Hero | 1440 | See below | Hero pose, turntable |
| A: photos | ≈ 1900 | Photos (front) over a light field (behind) | Hero pose, turntable continues |
| A → B gap | ≈ 900 | Light field only; the car alone (frame 3) | Transition 1 runs here |
| B: about | ≈ 2000 | Roof field (behind), about block, 480 × 640 photo | Roof view |
| C: specs | ≈ 2600 | Dark, front: photo band and spec table, then the summary | Roof view, hidden behind C |
| C → D gap | ≈ 600 | Light field (frame 9) | Transition 2 |
| D: price | ≈ 1440 | Side-view field (behind), price section (front) | Side view |
| D slideshow | ≈ 2100 | Dark, front | Side view, hidden behind it |
| D → E gap | ≈ 600 | Light field (frame 13) | Transition 3 |
| E: enquiry | 1440 | Behind type, front link, car centred | Front view |

**Total ≈ 15,000 px of horizontal travel at the reference size** (about ten viewports), mapped one to one to
vertical scroll distance.

**Peek rule.** Wherever a section ends, at least 96 px (`--u`-scaled) of the next section's first element must be
on screen before the current section's last element leaves. Gaps are sized so that a field or photo edge is always
visible at the right edge.

### Per section

Columns are numbered 1–5 at the reference; "cols 2–3" means from column 2's left edge to column 3's right edge.

**Hero (frame 1)**
- Car name: cols 1–3, from the top margin, three lines, cap height 120 (font size ≈ 168, line height 0.95). Behind.
  One word per line where the name allows; long names wrap by words.
- Make · year: col 1, y 500, small caps. Behind. "Jump to specs →": col 1, y 552. Front.
- Emblem: col 5, top right (24 px margin), height 64. Front, belongs to the hero (it scrolls away with it).
- "Scroll for more": vertical, the right edge of col 5's gutter, bottom-aligned above the bar. Front.
- Section A's first photo starts at x 1294, so it peeks in at the right edge.
- Car: centred about x 680, ground at y 750, about 840 wide (camera framing in step 4).

**Bottom spec bar (frames 1–3).** Chrome layer, full bleed, 68 high, fixed to the bottom. Left: mileage, engine,
colour, location (label in small caps, value larger), separated by dots. Right: "Price as listed" and the price.
Visible through the hero and section A; exits with M10 over section A's last quarter.

**Back link and progress.** Chrome layer, sticky for the whole page.
- "← Showroom" (Esc also works) top left at the 24 px margins, as a small pill (label plus arrow, 36 high). In the
  hero it sits above the car name's first line, so the name starts below it (the name's top moves down by the
  pill's height plus 24).
- **It adapts to light and dark.** Every section, field and photo declares a tone (`data-tone="light"` or `"dark"`;
  photos count as dark). The pill reads the tone of whatever is under its own position and switches between two
  variants: on light, an ink label on a translucent paper fill; on dark, a paper label on a translucent ink fill;
  both with a hairline and a light background blur, so a busy photo never breaks it. The switch is a 0.3 s colour
  crossfade (`fade`) as the boundary passes under the pill.
- Progress: a 1 px line across the top edge that fills left to right; it takes the same tone switch.

**A: photos (frames 2–3).** Three to four photos, asymmetric, on the grid:
- A1: large, cols 1–2 plus bleed to the left edge, full height above the bar.
- A2: the swap slot (M5), 530 × 355 landscape, overlapping A1's right edge by about 120 and sitting lower (y 446),
  cycling through two or three photos.
- A3 (optional): a portrait photo cols 4–5, top-aligned at 160.
- Light grey field (behind) from A1's right edge, so the car reads on a clean ground.

**B: about (frames 4–6).**
- Roof field: a light grey panel, cols 1–2 plus half a gutter (0–667), full height, behind; the roof-view car sits on
  it.
- About block, cols 3–5 (from x 690): label at y 240; headline at y 420, cap height 75, up to three lines; paragraph
  2 columns wide, bottom-aligned at the 24 px margin.
- 480 × 640 photo (swap slot, M5, with parallax M6), top at 160, about one column of space after the paragraph.
- The dark section C's first edge peeks in at the right (frame 6).

**C: specs (frames 7–8).** One dark front panel in two parts.
- Part 1, one viewport wide: photo band across cols 1–4 at the top (0–360 tall); "Listed car specifications" label,
  col 1, bottom-aligned; spec table in two halves, cols 2–3 and cols 4–5, rows 56 tall with hairline rules (M8),
  labels left and values right. The button "See equipment and ownership history" closes the right half.
- Part 2, about 1.2 viewports wide: the summary quote (M3), cols 1–4 indented half a column, cap height 60, up to
  five lines, vertically centred; a bottom row with "Our take" (left half) and "To keep in mind" (right half), each a
  small label and a paragraph about 340 wide.

**D: price (frame 10).**
- Side-view field: light, behind, 0–827; the car's nose at about half the viewport.
- Price section, front, cols 4–5 from the top margin: the price, a one-line explanation, the strip chart; the further
  datasets below it in the same columns (designs in step 5).

**D slideshow (frames 11–12).** Dark front panel: a tall photo (cols 1–2, full height minus 24 margins), a landscape
swap slot overlapping it (≈ 465 × 480), a third photo top right (cols 4–5, 24 to 424); "See all of this car's images
→" bottom right (placeholder gallery).

**E: enquiry (frame 14).**
- "Give it": cols 1–2 from x 225, top 200, cap height 95, behind (M9 from the left).
- "A new home": cols 2–4 from x 450, top 770, same size, behind (M9 from the right).
- "Inquire about this car here →": col 5, vertically centred, three lines, front; opens the enquiry sidebar (M11).
- The enquiry sidebar opens both ways: on the button, and on its own when section E is 40% on screen (once per visit;
  closing it leaves the button to reopen it).

### Resolved in review (2026-10-08)

1. Drag rotates the car (no pan, no pitch) in the hero only, nowhere else.
2. The back link stays top left, as a sticky pill that adapts to light and dark sections (above).
3. The enquiry sidebar opens both on the button and by scrolling far enough.

## Step 4: Camera choreography

*Written 2026-10-08, awaiting review.* One shared choreography for all 13 cars, defined relative to each car's size,
with per-car overrides only where one looks wrong. Pose values come from the storyboard frames at 1440 × 960 and are
starting points: the build tunes them in the lab against the frames before wiring them into the page.

### How the car is drawn on the detail page

- The detail page uses **one full-viewport drei `View`** in the persistent canvas (not a frame-sized slot). While the
  detail page is open, the showroom's per-frame views stop rendering.
- The car stays at the origin, nose toward +Z, on its baked shadow, as the pipeline normalises it. **The camera moves;
  the car only turns on the turntable.** The studio environment stays fixed in the world, so reflections slide
  naturally as the camera orbits.
- **Where the car sits on screen** is set with `camera.setViewOffset` (a shift of the projection), not by moving the
  camera off-centre. So "car on the left third" never changes the viewing angle, and the angle and the screen position
  can be tuned independently.
- **Size is set by framing, not by distance.** Each pose says how big one of the car's dimensions should be on screen
  (length, width or height, as a share of the viewport). The camera distance is solved from that, the car's real
  bounding box (measured from the loaded model) and the field of view. Short cars (the 205, 3.7 m) and long ones (the
  XJ220, 4.9 m) then fill the frame the same way.
- Field of view: 24° vertical, fixed (the showroom's value), so the perspective never changes between poses.

### A pose

```ts
interface CarPose {
  azimuth: number;    // degrees around the car, 0 = looking at the nose, 90 = the car's left side
  elevation: number;  // degrees above the ground plane; 88 = top-down (never 90, to keep "up" defined)
  roll: number;       // degrees the image is turned on screen (used for the angled roof view)
  fit: { dimension: "length" | "width" | "height"; share: number; of: "viewportWidth" | "viewportHeight" };
  anchor: { x: number; y: number }; // where the car's centre (or ground point, see each pose) lands, as a share of the viewport
}
```

Interpolation between two poses: azimuth by the shortest arc, elevation and roll linearly, the solved camera distance
on a log scale (so zooming feels even), and the anchor linearly; all eased with `travel` (`cubic-bezier(0.8, 0, 0.45, 1)`) across the
transition's scroll range.

### The four poses

Measured from the storyboard frames. "Ground point" is the car's centre projected onto the ground.

| Pose | Frames | Azimuth | Elevation | Roll | Fit | Anchor |
| --- | --- | --- | --- | --- | --- | --- |
| **P0 Hero** | 1–3 | 55° (lower and more side-on than the carousel's 40°): front three-quarter, nose toward the viewer's left | 5° (low) | 0 | Silhouette = **63.8%** of the viewport width (frame 1 shows 58%; the user asked for 20% more zoom on 2026-10-08, then 10% on 2026-10-09) | Ground point at **x 50%**, y 78% (moved right so the nose clears the hero's text column) |
| **P1 Roof** | 4–9 | **180°** (camera behind the car, nose up) | 88° (top-down) | **−12°** (the nose leans 12° left of vertical, counter-clockwise, as frame 4 shows) | Silhouette = 78% of the viewport height | Centre at x 23%, y 52% |
| **P2 Side** | 10–13 | **270°**, pure side view from the car's right, nose right | 3° | 0 | Silhouette = 67% of the viewport width (so ≈ 75% of the body shows and the tail is cut off) | Nose (front bumper) at x 50%, ground at y 68% |
| **P3 Front** | 14 | 0°, head-on | 4° | 0 | Silhouette = 42% of the viewport width | Ground point at x 50%, y 72% |

Built in 6c (`lib/choreography.ts`): "fit" measures the car's projected **silhouette** (the convex hull of its vertices), not
a bounding box, because the storyboard's sizes were measured on the silhouette; a pose also carries a `ref` (`center`,
`ground` or `nose`) saying which point the anchor places. Azimuth runs the same way through all three transitions
(55° → 180° → 270° → 360°).

Notes:
- P2 anchors the **front bumper**, not the centre, because the storyboard pins the nose to the middle of the screen
  and lets the tail run off the left edge, whatever the car's length.
- In P1 the shadow sits directly under the car, so the roof reads as standing on the field. The baked shadow already
  handles this.

### The transitions

Each runs across a scroll range on the horizontal timeline (track positions in `--u` units, from step 3) and is
scroll-tied: scrolling back reverses it exactly.

| Transition | From → to | Starts when | Ends when | Range |
| --- | --- | --- | --- | --- |
| **T1** | P0 → P1 | Section A's last photo's right edge reaches the viewport's left edge ("only just exiting the grid") | Section B's about block reaches its frame-4 position | ≈ 900 |
| **T2** | P1 → P2 | Section C's right edge is at 14% of the viewport width (a sliver of dark still showing, frame 9) | Section D's price section reaches its frame-10 position | ≈ 600 |
| **T3** | P2 → P3 | The slideshow's right edge is at 16% of the viewport width (frame 13) | Section E is aligned (frame 14) | ≈ 600 |

Between transitions the pose holds still, including while a dark section covers the car (frames 7–8 and 11–12); the
car reappears exactly where it was when the section leaves.

### Turntable, drag and scroll

Only one of them drives the car's heading at a time.

1. **At the hero and through section A** the turntable runs (the existing 60 s revolution, 1.2 s ramp). Drag works in
   the hero only: it rotates the car about the vertical axis (no pitch, no pan), adds to the turntable angle, and
   releases into the turntable again after 1.2 s.
2. **When T1 starts** the turntable stops where it is. Across T1, the car's turntable angle eases back to 0 by the
   shortest arc while the camera moves from P0 to P1, so the roof view is always reached exactly, "from whatever
   position the turntable is in" (the storyboard).
3. **Scrolling back before T1's start** hands control back: the car stays at angle 0 in P0 and the turntable ramps up
   again over 1.2 s once the scroll has rested for 0.5 s.
4. After T1 the car never turns on its own: P1, P2 and P3 are still poses, and drag is off.

### Entry from the carousel (the hand-off contract)

The showroom will be redesigned later with camera angles not yet chosen, so the detail page accepts the car from any
pose. **The contract:** when a car is opened, the showroom passes the car's current on-screen state:

```ts
interface CarHandoff {
  slug: string;
  pose: CarPose;            // the camera it was seen through
  turntable: number;        // the car's own heading at that moment, degrees
  rect: DOMRect;            // the frame's on-screen rectangle
}
```

The detail view starts from exactly that picture (same angle, same heading, same size and place on screen, so
nothing jumps on the first frame), then animates over 1.6 s with `settle` (`expo.out`):
- the view's bounds grow from the frame's rectangle to the full viewport;
- the camera interpolates from the hand-off pose to P0 as described above;
- the car's heading eases from the hand-off turntable angle to the hero's starting angle.

The current carousel already knows all of this (`CarScene`: azimuth 40°, elevation 9°, the turntable angle and the
frame's slot), so the first build passes it as is. **Deep links** have no hand-off: the car fades in at P0 with a
small settle (2° of azimuth, 3% of size) over 0.8 s, as in step 2.

**Leaving** (back to the showroom) does not fly the car back: the detail page and its car fade out together over
0.6 s (`fade`) while the showroom fades in with the car already in its frame. This is cheaper, and it works from any
point on the page, including when a dark section or the price section covers the car.

### Overrides and tuning

- Per-car overrides live next to the shared poses (for example `lib/choreography.ts`): a partial `CarPose` per pose
  per slug, used only when a car looks wrong (an MPV-tall roofline, a long wagon tail).
- The build adds a **pose tuner to the lab**: `/lab/<slug>?pose=P0…P3` renders one pose at 1440 × 960 next to the
  matching storyboard frame, and a scrubber plays T1–T3, so poses are tuned visually and checked for all 13 cars
  before any section is built.
- Acceptance: for each of the 13 cars, P0–P3 match the storyboard's composition (position, size, angle) within a
  few percent, and T1–T3 play without a jump at either end at 1080, 1440 and 1920 wide.

### Reduced motion

The hero turntable is off (the car holds P0). Each transition cuts from its start pose to its end pose at the middle
of its scroll range instead of travelling. The carousel hand-off becomes a 0.3 s crossfade at P0.

### Resolved in review (2026-10-08)

1. The hero has its own angle, lower and more side-on than the carousel's, as in frame 1; the hand-off therefore
   rotates as well as grows.
2. Leaving fades the page and car out (no flight back to the frame): better for performance and for the many points
   where UI covers the car.

## Step 5: Content and data

*Parts 1 and 2 approved 2026-10-08 (part 2 with the user's own edits to the copy).*

### Section D: price comparison

*Rewritten in shot 7a (2026-10-11): the stacked cards became one card with three tabs.*

A two-column spread inside the white price panel: a narrow right-hand title column ("Price comparison", the
condensed label face, otherwise empty on purpose) and one tall beige card (`price-module`, 564u × the full inset
height) holding the price, the comparison line (e.g. "Compared with 58 similar listings across Halden, Torquewell
and Lot Twelve.") and a tab list with one chart per tab, each filling the card. The tabs follow the WAI-ARIA tabs
pattern (automatic activation, roving tabindex, arrows wrap, Home/End). Switching is instant (no tab token in the
motion vocabulary; it is a frequent, keyboard-reachable action).

1. **Price spread** (the strip): groups of comparable listings in $1,000 steps ($500 under $20,000, $5,000 over
   $200,000) as ink dots whose area is proportional to the count; this car is an ink ring with its price and a
   verdict in words (**Good value** cheaper than at least 60%, **Fair price**, **Above market** pricier than at
   least 70%); price ticks; a Lowest / Median / Highest / Listings row.
2. **Price vs mileage** (the scatter): the comparables with a straight trend line, labelled axes, gridlines, this car
   as an ink ring; the takeaway reads "$12,400 below the trend for its mileage."
3. **Price history** (the line): the model's median asking price by quarter, this car's price as a dashed
   reference, a vertical guide at the hovered quarter.

Charts are drawn in real CSS pixels (`useChartSize` measures the chart box; nothing scales a drawing after the
fact). **Interaction:** one transparent plot rect takes the pointer and finds the nearest target (strip: nearest
bucket; scatter: nearest point within 40 px; history: nearest quarter), so every hover target is at least
24 × 24 px; hover and focus show the same tooltip and write it into an always-mounted `aria-live` region. The
marks keep a roving tabindex (one Tab stop per chart, arrows move, Escape leaves the chart, not the page).
**The linked strip ↔ scatter hover is dropped** (they sit in different tabs). The full data stays as a visually
hidden table outside the tab panels.
**Motion:** when the section arrives (80%), hairlines draw (M8), strip dots grow (scale 0 → 1, 0.6 s, reveal,
stagger 0.02 s), everything else rises with M1 timing; only the default tab is mounted then, so other tabs appear
instantly when chosen. Reduced motion: the 0.3 s fades.
**Charts are hand-built SVG** with `d3-scale` and `d3-shape` only; no chart library.

**The data** (`content/comparables.json`), generated once by a script (`scripts/comparables.mjs`) and committed, so
it never changes between visits:
- Seeded by slug, so regenerating gives the same numbers.
- Per car: 40–80 comparable listings, each with marketplace, year (the car's model years), mileage, condition grade,
  location and asking price. Prices sit around the car's own price (roughly ±15%, skewed so the verdicts vary across
  the 13 cars: about five good value, five fair, three above market), and fall with mileage.
- Per car: 20 quarterly medians for the price history, with a plausible trend (mostly rising, some flat).
- Three **fictional marketplaces**: **Halden** (classifieds, like Edmunds), **Torquewell** (a dealer marketplace,
  like Carwow) and **Lot Twelve** (an online auction house, like Cars & Bids). The build checks with a web search that
  none of the three names is a real car business before using them.
- Every chart caption says the data is illustrative, in keeping with the site's "every listing is fiction" line.

### Section D: slideshow and gallery

- The slideshow follows frames 11–12: a dark front panel, the tall photo, the landscape swap slot (M5, scroll-tied),
  the third photo.
- **"See all of this car's images →"** opens the **gallery placeholder**: a full-screen overlay (M11 timing, from the
  bottom instead of the side) with a plain grid of every photo for the car, each with its credit and licence. It
  doubles as the photo credits until `/credits` exists. Esc and a close button return to the slideshow.

### Section E: enquiry sidebar (placeholder)

A mock form in the sidebar (M11): name, email, an optional phone, and a message pre-filled with "I'm interested in the
1976 Porsche 911 Turbo (930)." Labels above fields, inline validation on blur, a "Send enquiry" button.
**Nothing is sent:** on submit the form is replaced by a thank-you state ("Thanks, [name]. This is a concept, so no
one will reply, but the car is still here.") with a button back to the car. A note under the button says the same
before sending. No backend, no storage.

### Equipment and history overlay (placeholder)

Opened by "See equipment and ownership history" in section C. A sidebar (M11) listing, unstyled for now, the data
that already exists in `lib/cars.ts`: highlights, equipment, modifications, the condition grade with each condition
mark as text (code and note), the service history, items included and the number of owners. It is redesigned later.

### Resolved in review (2026-10-08)

1. Satoshi is allowed (named exception to the OFL rule) for the Figma theme.
2. The marketplace names stay: Halden, Torquewell, Lot Twelve.

### Part 2: per-car content

The new per-car fields and draft copy for all 13 cars are in [`docs/overhaul-copy.md`](overhaul-copy.md), reviewed
car by car and approved; they go into `lib/cars.ts` verbatim in shot 6a.

## Step 6: Shot list for the build

*Written 2026-10-08, awaiting review.* The build runs in a separate session (Sonnet), **one shot per session**, in
this order. Each shot ends at its gate: stop, report against the gate, and wait for the user.

### Rules for every shot

- **Read first:** this file, `docs/storyboard/README.md` (with the frames), `docs/overhaul-copy.md`, `CLAUDE.md`,
  `AGENTS.md` (Next.js 16.3 differs from older versions; read the matching guide in `node_modules/next/dist/docs/`
  before writing Next code), and `docs/handoff.md`.
- **Plan before acting** (the user's standing rule): at the start of each shot, state what will be done and in which
  order, and wait for a go. Ask before deviating from this file.
- **Verify once, then report.** No loops of build, measure, tweak. For performance, design one decisive measurement
  (`.cache/record-run.mjs` against `next start`, with no screenshots during the timed walk: Playwright screenshots
  stall the page about 100 ms).
- **Smallest change** that meets the shot's goal (`karpathy-guidelines`). Keep the showroom working throughout.
- **Environment:** Windows; the Bash tool fails, so use PowerShell plus the Write and Edit tools. PowerShell writes
  UTF-8 BOMs: write JSON from Node. Start the dev server in its own window
  (`Start-Process powershell -ArgumentList '-NoExit','-Command','npm run dev'`) so it outlives the session's
  two-hour limit. Next 16 refuses a second dev server in the same folder.
- **Audit protocol at each gate** (from `CLAUDE.md`): `frontend-design` self-critique; `/impeccable critique` and
  `/impeccable audit`, fixing every P0 and P1; ask the user to run `/review-animations` for any shot with motion.
  From shot 6h, also `web-design-guidelines` and `break-ui`.
- **Don't commit or deploy** unless the user asks.

### 6a: Foundations (no visible change to the showroom)

- **Goal:** everything the detail page needs before any of it is drawn.
- **Work:**
  - Check current versions on npm, then install GSAP (with ScrollTrigger, SplitText, Flip), `d3-scale` and
    `d3-shape`. Lenis is already installed.
  - Fonts through `next/font`: Satoshi self-hosted with `next/font/local` (download from Fontshare, keep the licence
    file next to it), Staatliches from Google Fonts.
  - Design tokens for both themes as CSS variables, switched with `?theme=current` / `?theme=figma` (default:
    current). Colours, fonts, the type scale, the grid (`--u`, columns, margins, gutters) and the motion tokens from
    step 2.
  - The new per-car fields in `lib/cars.ts`, copied verbatim from `docs/overhaul-copy.md`.
  - `scripts/comparables.mjs` and `content/comparables.json` (step 5). First, web-search the three marketplace names
    to confirm none is a real car business.
  - Record the decisions in the PRD's decision log: clip-path exception, GSAP, Satoshi exception, the overhaul
    overriding the PRD for the detail page.
- **Gate:** `npm run check` passes; `?theme=` switches fonts and colours on the existing pages; the comparables file
  validates (13 cars, 40–80 listings each, verdict mix as specified); the user reviews the two themes' token sheets.

### 6b: Photos for the thin sets

- **Goal:** six to eight photos per car, so sections A, B and D have enough.
- **Work:** with `scripts/photos/commons.mjs` and `scripts/photos/search.mjs` (Openverse), find more photos of each
  car's exact colourway and variant, **same physical car per set where possible**, CC0, CC BY or CC BY-SA only. Start
  with the Peugeot (2), Porsche and Datsun (3 each); then any car under six. Show the user contact sheets
  (`.cache/photos/<slug>/…sheet.jpg`) before adding to `content/photos.selection.json`, then run
  `node scripts/photos/fetch.mjs`. Commons rate-limits hard: keep the scripts' pacing.
- **Gate:** every car has at least six photos, approved by the user; `content/photos.json` credits all of them.

### 6c: Choreography and the pose tuner

- **Goal:** the camera system from step 4, proven on all 13 cars before any page exists.
- **Work:** the `CarPose` type, the framing solver (dimension share to camera distance, from the loaded model's
  bounding box, 24° FOV), `setViewOffset` anchoring, pose interpolation (shortest-arc azimuth, log distance, eased
  with `travel`), the four shared poses and the per-car override table (`lib/choreography.ts`). A lab page
  `/lab/<slug>?pose=P0…P3` rendering one pose at 1440 × 960 beside the matching storyboard frame, and a scrubber
  that plays T1–T3.
- **Gate:** a contact sheet of 13 cars × 4 poses next to the storyboard frames, approved by the user; T1–T3 play
  without a jump at either end at 1080, 1440 and 1920 wide.

#### 6c status (2026-10-08)

Built; `npm run check` passes. The user reviewed the contact sheets and approved them with one change, P0 zoomed in by
20% (applied). Tools: `/lab/<slug>?pose=P0..P3` (`p` progress 0 to 3, `w` 1080/1440/1920, `turn`, `guides=1`,
`reduce=1`, `still=1`); `.cache/pose-sheet.mjs` renders the 52 stills, the transition numbers and the sheets. Poses
P1 to P3 and the rest below are accepted as they are **for now and are to be improved later**:

- **Poses P1 to P3** (and P0's angle and anchor): composition accepted; refine against the real layout in 6d and the
  polish pass. The per-car override table (`OVERRIDES`) is still empty.
- **Transition smoothness:** the largest step against its neighbours is 1.4 to 2.6 on most cars, but 2.9 to 3.8 on
  Porsche T1, NSX T1, Fiat T2 and Lotus T1. Suspected cause: the silhouette's outermost point changing hands (an aerial,
  a mirror); the camera path itself is the same for every car. Not yet confirmed. Check these in the scrubber, or add a
  camera-only metric.
- **Sizes are shares of the viewport.** At 16:9 the car is about 18% larger against the DOM than at 3:2, which scales
  with `--u`. Decide in 6d, when the DOM sits beside the car.
- **`measureCar` cost** (convex hull of about 40,000 sampled vertices) is untimed; in 6d run it at load or precompute it
  in the model pipeline.
- **Not exercised:** the lab's play button and reduced-motion toggle; the audit protocol (6c draws no page UI);
  `/review-animations` (the camera motion is judged with the real page in 6d).

### 6d: The track, layers, camera and chrome

- **Goal:** the whole detail page as a working skeleton, with grey placeholder blocks instead of content.
- **Work:**
  - The detail page as an overlay state of the one experience (routes still set metadata only): the horizontal track
    with every section at its step-3 width, the peek rule, the behind and front layers, the full-viewport `View`.
  - Lenis plus the pinned horizontal ScrollTrigger timeline with `SCROLL_LAG` (default 1); keyboard stepping;
    "Jump to specs".
  - The camera driven by the timeline (T1–T3 at their ranges); the turntable, drag (hero only) and hand-back rules.
  - Chrome: the back pill with its light and dark tone switch, the progress line, the bottom spec bar with M10.
  - Record mode keeps working (`?record` loads and warms everything before the gate opens).
- **Gate:** a walk through the whole track at 1080, 1440 and 1920 wide matches the storyboard's frame sequence
  (blocks in the right places, car in the right poses, covered by the dark sections and revealed again); 60 fps
  average and no frames over 50 ms on the Intel Arc laptop at 1440 and 1920 with the hero files; reduced motion
  verified.

#### 6d status (2026-10-09)

Built; `npm run check` passes (6 smoke tests, two new). The skeleton: `components/detail/` (the overlay, grey placeholder
blocks), `lib/detail-layout.ts` (the track as data, in u), `lib/detail.ts` (per-frame state, turntable), `DetailScene` in the
one `Stage`, `content/shapes.json` (`npm run shapes`: each car's box and hull, measured in Node, so nothing is measured in
the browser). Measured on the Intel Arc laptop, production build, headed, record mode, steady wheel over the whole track:
**60.0 fps, no frame over 50 ms** at 1440 × 960 (dpr 1 and 2) and 1920 × 1080 (worst frame 23.5 ms, at dpr 2).

How it differs from the plan:

- **One loop, GSAP's.** While a detail page is open its ticker runs Lenis, then the DOM has moved, then chrome, camera and
  draw; the carousel's loop skips its render (`runtime.external`). This replaces the planned "one-line hook in the carousel
  tick", which could not keep the car and the DOM in the same frame.
- **Own scroll element** (fixed, `100dvh`), not the document; `--u` and every section height follow `dvh`.
- **Camera ranges come from the layout**, not rounded numbers: T1 starts when A3's right edge reaches the viewport's left,
  T2 when the specs panel's edge is at 14% of the width, T3 at 16%; T3's end is capped at the track's end on a wide screen
  (at 1920 × 1080 section E settles right-aligned and the camera still reaches P3).
- **Heading on scroll-back:** across T1 the heading eases from the stopped angle to 0 and reverses exactly; back at P0 the
  turntable resumes from that angle after 0.5 s (the plan's "stays at angle 0" read as a jump).
- **Spec bar exit** runs over [T1 start − 487 u, T1 start + 146 u], tuned to frame 3 (the bar is about three quarters out
  when T1 starts); step 2's "A's final 25%" and "last 30% of its travel" disagree with frame 3.
- Chrome and focus: the sound shortcut (M) still works on the detail page; focus rings on dark panels are paper.

Decided with the user after the gate review (2026-10-09), and built:

1. **Roof-view car, frames 5 to 9:** it holds its pose but sits *under* the front layer. Section B is a front surface
   (`about-surface`, from the roof field's edge to the specs panel) that covers the car from frame 5 on; the dark panel
   keeps it covered until it leaves in frame 9. The B headline and label moved to the front layer.
2. **P0 hero:** zoom 10% (not 20%) and the anchor moved right (0.47 to 0.50), so the nose clears "Jump to specs" and
   "Make · year" at 1440 and 1920 wide.
3. **Sound toggle** beside the back pill (same tone switching; M still works).

Open, for the user or the next shots:

1. Offscreen buttons stay tabbable (make sections `inert` until near, from 6e); the back pill is 36 px (PRODUCT.md says
   44); drag has no keyboard alternative.
5. Car size is a share of the viewport: about 18% larger against the DOM at 16:9.
6. JavaScript: the showroom ships 479 KB over the wire (including the lazily loaded three stage); a listing adds about
   91 KB (GSAP, ScrollTrigger, shapes). `content/shapes.json` is 236 KB raw and could be slimmed. The 350 KB budget needs a
   decision on what counts as "initial".

### 6e: The hero and the entry

- **Goal:** frame 1, and the transition into it.
- **Work:** the motion utilities from step 2 (M1–M12 as reusable functions or components: split text with
  accessible labels, masks, clip reveals, swaps, parallax, depth drift); the hero (frame 1) with real content and
  both themes; the hand-off from the current carousel (`CarHandoff` from `CarScene`), the 2.4 s entry timeline, the
  deep-link entry and the 0.6 s fade out; fast-forwarding the entry when the visitor scrolls during it.
- **Gate:** clicking any of the 13 cars plays the entry with no jump on the first frame; deep links and leaving work;
  the user runs `/review-animations` (verdict must be Approve).

#### 6e status (2026-10-10)

Built; `npm run check` passes (6 smoke tests). `/review-animations` ran and **approved** (one P3 fix applied: the
"Jump to specs" underline is now gated behind `@media (hover: hover) and (pointer: fine)`, since it wasn't). New:
`lib/detail-fx.ts` (M1, M2, M4, M10, M12 wired to the hero; M3, M5–M9, M11 written and ready for 6f/6g but not yet
called anywhere), `lib/handoff.ts` (`carouselPose`, reproducing `CarScene`'s own camera math as a `SolvedPose`, not
routed through the silhouette solver). `lib/choreography.ts` gained `mixPose` (the raw pose-mix, extracted from
`between` so the entry can reuse it with `settle` instead of `travel`). `lib/detail.ts` gained `entering`/`entryPose`
(suppresses the turntable and overrides the scroll-driven pose while the entry plays) and `exit`/`leaveDetail` (the
leave sequence, called from both the back pill and Escape).

How it differs from the plan, and from the two post-gate polish rounds with the user:

- **The hand-off doesn't go through `CarPose`.** `CarHandoff`'s pose is built directly as a `SolvedPose` (azimuth 40,
  elevation 9, distance from `CarScene`'s own diagonal/fit formula) rather than expressed as a `CarPose` run through
  the silhouette solver — the carousel already gives an exact analytic distance, so solving for it again would just
  reproduce the same number by a longer path. Leaving is a 0.6 s fade of the page and the canvas (which only shows
  this car while a listing is open), not a true WebGL crossfade with the showroom's own cars re-appearing
  mid-fade — that would need per-material opacity on the car, which felt like too much for this shot.
- **The view's tracked element is a new, separate `viewSlot` div** (`data-view-slot`), not `root` as in 6d: `root`
  holds the whole DOM overlay, which must size correctly immediately, while `viewSlot` is the thing that actually
  grows from the frame's rect via `transform: translate() scale()`. Verified by polling its `getBoundingClientRect()`
  through a hand-off (screenshots stall and hide the real curve): it starts at the frame's rect and eases smoothly
  to the full viewport, confirmed no jump.
- **The entry's starting look is set eagerly, before `phase` gates playback.** A deep link mounts Detail while
  `phase` is still `"gate"`; if the hidden-state `gsap.set` calls waited for `phase === "showroom"` too, the gate's
  1.2 s fade-out would reveal the *finished* hero for an instant before the entry replayed it. The starting
  transform/opacity/pose apply immediately in the layout effect; only playback is gated on phase.
- **Hero sizing was tuned twice against the Figma mock after the gate**, both rounds verified with screenshots, not
  guessed: name 160px (down from the storyboard's 168), make/year 24px, "Jump to specs" 12px, each separated by an
  exact 12px margin computed from the name's actual line count (`Detail.tsx`'s `nameBottom`/`makeTop`/`jumpTop`) —
  not a fixed y, so one-line names (NSX, M5...) don't leave a large gap. P0's zoom came down another 5% (now 0.606,
  was 0.638) once real content was in the hero. The first photo moved 24u right. The emblem is capped by width
  (140px), not height: Porsche's wordmark is 256×17px (15:1) — a true 120px-tall box would be ~1800px wide — and its
  right edge now lines up with "Scroll for more"'s, computed from that block rather than a fixed x. "Jump to specs"
  had two bugs from being a bare `<button>`: UA default padding (read as indented) and UA default `text-align:
  center` (read as centred, not left); both reset, plus `white-space: nowrap` since the text's 12px floor and the
  box's `--u`-scaled width don't shrink at the same rate, which could otherwise wrap the arrow onto its own line on
  a small viewport.
- **One real pre-existing bug, surfaced by `/impeccable critique` and fixed:** `Chrome`'s `inert` prop never
  accounted for `listing !== null` (only `Carousel`'s did), so keyboard focus could tab from the hero straight into
  the hidden showroom's bottom-left nav glyphs. Fixed in `Experience.tsx`; verified the tab order no longer escapes.
- **Performance did not cleanly hit 60 fps today.** `.cache/detail-perf.mjs` measured ~55 fps at 1440 (0–4 frames
  over 50 ms across repeated runs) and ~53 fps at 1920 (up to 26 frames over 50 ms) — against 6d's clean 60.0 fps.
  Chased hard: ruled out the new hero images (disabling them made it *worse*), ruled out stray background
  processes, and cross-checked against the **unrelated, untouched** showroom benchmark (`record-run.mjs`) on the
  same machine, which also measured ~53 fps with the same p99 pattern. That's evidence of the day's machine
  conditions, not a 6e regression, but it isn't proof — there's no pre-6e commit to diff against, since nothing was
  committed before this shot. Re-measure on a quiet machine before trusting either number.
- **Not fixed, not in scope:** the figma theme's warm paper tone reads against DESIGN.md's "don't drift toward
  cream" line — that tension is the point of the two-theme comparison 6a built, not a 6e defect. A faint ghosted
  outline on Bodoni Moda's large glyphs (seen on "NSX") in headless Chrome is confirmed pre-existing (identical on
  the untouched carousel's car name) — likely a font/software-rendering quirk, worth a glance in a real browser.

### 6f: Sections A, B and C

- **Goal:** frames 2 to 9 with real content.
- **Work:** section A (photos, the scroll-tied swap slot, the light field), section B (roof field, the about block,
  the 480 × 640 swap photo with parallax), section C (the dark panel, photo band, spec table with rule draws, the
  scroll-to-reveal summary, "Our take", "To keep in mind", and the button opening the equipment and history overlay
  placeholder). Both themes.
- **Gate:** matches frames 2–9 at 1440 × 960 and holds up at 1080 and 1920; every headline in `overhaul-copy.md`
  fits; `/review-animations` Approve; 60 fps re-measured once.

#### 6f status (2026-10-10)

Built; `npm run check` passes (6 smoke tests). `frontend-design` self-critique, `/impeccable critique` (dual
sub-agents) and `/impeccable audit` all ran; every P0/P1 they raised is fixed (below). Performance re-measured
clean: 59.2 fps at 1440 × 960, 59.9 fps at 1920 × 1080, no sustained jank. `/review-animations` still needs the
user to run it (it sets `disable-model-invocation`).

Real bugs found and fixed during the build and the audit, not scope creep — each verified, not assumed:

- Char-split text (M2, M3) collapsed its spaces (`<span> </span>` alone collapses inside `inline-block`) and let
  the browser break mid-word (every character was its own `inline-block`, not just the spaces). Both are fixed
  by `charRiseLine`/`scrollTextWords` in `components/detail/Detail.tsx`: words are grouped into their own
  `white-space: nowrap` spans, with a plain (unwrapped) space between them.
- Jaguar's headline didn't fit at any width; rebalanced its line breaks only, per `overhaul-copy.md`'s own
  license to do so (no words changed): `["OXFORDSHIRE'S", "PROOF OF CRAFT", "AND FINESSE."]`.
- The summary quote's approved 25–40-word range didn't fit 5 lines at the drawn size for the longer end
  (Peugeot, Subaru both hit 6 and collided with "Our take"): `--type-summary` 86 → 76px, block widened 999 → 1080u.
- `gsap.set([], {...})` (an empty array stringifies to `""`) was logging "GSAP target  not found" every load,
  from `wireSpecTable`'s optional `extra` param on table A (no overlay button there). Guarded with `if (extra.length)`.
- The dark-panel focus-ring override was scoped to `.blk` (6d's placeholders only); section C's real
  "See equipment and ownership history" button had an invisible ink-on-black ring. Scoped to `[data-tone="dark"]`
  generally now.
- Engine value truncated mid-word in the spec table. Both table columns widened 358 → 410u, `--type-spec` 20 → 18px.
- Mileage was miles-only in the new spec table, against PRODUCT.md's miles-and-km commitment; added km. (Left
  the pre-existing hero bar, out of 6f's scope, as miles-only — flagged, not fixed.)
- Numeral-heavy spec values weren't in Geist Mono per CLAUDE.md; added (`specRowsLeft`/`Right`'s third tuple field).
- Section B's headline was an `<h3>` with no `<h2>` in the accessibility tree (the hero's own h2 is deliberately
  `aria-hidden`); changed to a `<p>`.
- The equipment-overlay button fell to 28px tall at 1080 wide, under the 44px touch-target commitment; added a
  `max(44px, ...)` floor.
- Thin photo sets (8 of 13 cars sit at 6b's 6-photo floor) repeated 2–3 photos across sections A–C in one
  continuous scroll. Slot counts now adapt to the pool size and A3 is skipped below 8 photos (it's optional per
  the plan) rather than forced into a repeat — zero repeats for every car at its current photo count.

A second round of fixes, from the user's direct review after the gate (same session, still 2026-10-10):

- Section C's two spec-table halves didn't share a height (392 vs 336u), so their hairline rules didn't line up
  row-for-row; both are 392u now (seven rows each, at the same pitch).
- "Our take" and "To keep in mind" were positioned with a fixed `h` *and* `bottom`, so a longer paragraph
  overflowed past the intended 24u margin while a shorter one sat inside it — different visible bottom edges
  depending on content length. Both now render at `height: auto`, so they genuinely grow upward from a fixed
  bottom instead of growing past it. The summary quote moved up (y 330 → 270) for more clearance above them.
- The hero name box clipped long single words (its line mask's `overflow-hidden` cut "GALLARDO" to "GALLAR")
  and didn't account for a line wrapping an extra time (the Gallardo's "LP 560-4"), leaving make/year and "Jump
  to specs" sitting inside the wrapped line. Fixed with a measured approach in the layout effect
  (`repositionName`, Detail.tsx): shrink the whole name only enough that no single word (which can't wrap)
  overflows its box, then position make/year and jump from the name's *measured* rendered height, re-applied
  after every render (not just mount) since React rewrites the inline `top` back to the estimate on unrelated
  re-renders (a sound toggle, say).
- The make emblem was top-anchored in a 120px-tall box; since 11 of 13 marks are wide wordmarks rendering under
  40px tall there, the visible mark sat near the box's top, well above the back-pill/sound-button row's centre.
  The box now centres on the pill row's own centre line (`PILL.y`) instead, with a reduced 80px height ceiling.
- M4 (image reveal) triggered when a photo's centre reached 90% of the viewport — in practice, while it was
  still mostly off-screen, "just entering". Changed to trigger when the frame's right edge reaches 100% (fully
  in view) before it starts revealing: `revealOnce(frame, 1, ..., "right")` in `wireImageReveal`.
- Default theme switched from "current" to "figma" (`app/layout.tsx`'s `themeScript`): the user's primary focus
  going forward. `?theme=current` still opens the other system.

A third round, after seeing the second round's own result (same session, still 2026-10-10):

- The hero name shrink-to-fit read as "really small" — reverted. The name is always full size now
  (`--type-hero`, never scaled down); instead `repositionName` widens the name's own box just enough to fit
  whichever word is widest (the box can run under the first photo/emblem, which already cover it, same as the
  storyboard's "the car's antenna crosses COUPE" note already has the name sitting behind the car).
  Multi-word lines that still don't fit at that width are still free to wrap, as before.
- The spec table and "See equipment and ownership history" button, as a group, ended 76u above "Our take"/"To
  keep in mind"'s shared bottom margin. Both tables' `y` moved 400 → 476 and the button's 816 → 892, so the
  group's own bottom now lands on the same 24u-from-960 baseline.

A fourth round, catching what the third round's own fix exposed (same session, still 2026-10-10):

- `NAME_GAP` (title to make/year, make/year to "Jump to specs") was 12u; the site's one blanket margin value
  is 24, so it's 24 now, consistently below the name regardless of whether the name is 2 or 3 lines (unchanged:
  `repositionName` already measures the name's real rendered height before adding this gap).
- The round-three fix (table+button bottom-aligned to "Our take"/"To keep in mind") used the button's nominal
  `y + h`, but the button's own 44px touch-target floor makes its *real* height taller than `h` on anything
  narrower than the 1440 reference — top-anchored, that extra height grew the button *downward*, past the
  shared baseline, worse the narrower the viewport. Same class of bug the round-two `height: auto` fix solved
  for "Our take"/"To keep in mind" text, just on a control instead of a paragraph: the button is bottom-anchored
  now (`bottom: 24`, dropping `y`), so its real bottom edge matches theirs exactly at any width — verified
  pixel-identical (666px both) at 1024, the product's narrowest supported width. The tables moved up slightly
  (y 476 → 450) for clear margin above wherever the floor pushes the button's top at that width.

### 6g: Sections D and E

- **Goal:** frames 10 to 14 with real content and data.
- **Work:** the price strip, the price and mileage scatter and the price history (hand-built SVG, linked hover,
  keyboard and screen-reader support, entrance motion); the slideshow and the gallery placeholder; section E (behind
  type with M9, the inquire link) and the enquiry sidebar (mock form, opened by the button and by scrolling); follow
  the `dataviz` skill for the charts.
- **Gate:** matches frames 10–14; charts are correct for all 13 cars (spot-check three against
  `content/comparables.json`); the form validates and shows its thank-you state; `/review-animations` Approve.

#### 6g status (2026-10-10)

Built; `npm run check` passes (6 smoke tests, stable across two consecutive runs). New: `lib/comparables.ts` (the
verdict/bucket/trend-line/takeaway math, mirroring `scripts/comparables.mjs`'s own `verdictFor` so the page and its
generator's check agree), `components/detail/PriceCharts.tsx` (the strip, scatter and history, plus
`prepareChartReveal` for the shared M8/M1-timing entrance), `components/detail/Gallery.tsx` and
`components/detail/Enquiry.tsx` (M11's first live use). `frontend-design` self-critique and a dual-agent
`/impeccable critique` and `/impeccable audit` all ran; every finding either fixed or confirmed a false positive
below. Charts spot-checked for Porsche ($245k, above market), Peugeot ($9.8k, good value) and Jaguar ($585k, above
market) against `content/comparables.json` — all three match the generator's planned verdict mix exactly.
Performance re-measured clean: 60.0 fps average, one frame over 50 ms (83 ms), on a production build (the first of
two runs hit one anomalous 2049 ms frame that didn't reproduce — not chased further). `/review-animations` still
needs the user to run it.

Real bugs found and fixed, not scope creep — each verified, not assumed:

- `sidebar()` in `lib/detail-fx.ts` built both its open and close tweens eagerly; GSAP auto-plays on construction,
  so calling the factory ran both directions at once the instant it was ever used. Both now built `paused: true`.
- `ScrollTrigger`'s `containerAnimation` trigger math never fires against the *behind* layer (a separate
  `position: fixed` tree outside `scroller`/`content` entirely) — M9 needed an invisible front-layer marker
  instead of the `field-e` block itself.
- That marker's first position (anchored to `field-e`'s own block x, which includes the D-to-E gap) fired M9 and
  the sidebar's auto-open while T3 (the side-to-front camera move) hadn't even started — confirmed visually against
  the storyboard-13 scroll position, where "GIVE IT" was already mid-reveal and the sidebar already open over the
  still-side-on car. Re-anchored at the track's true resting position, with a small trigger value instead of the
  generic M1-style 70%/40%.
- The sidebar's auto-open is timed off M9 finishing (a `gsap.delayedCall`, not a second independent scroll
  trigger) — two position triggers can't guarantee the text finishes its reveal before the sidebar covers it,
  especially this close to the end of the track, where there's no scroll distance left to space them apart.
- That same resting-position marker, pinned to the nominal `ENQUIRY` track constant, sat just out of reach at
  1024 wide (the narrowest supported width) once real scrollbar geometry was accounted for — section E's reveal
  would never have fired there. Fixed by computing the marker's position from the actually measured `travel` in
  `layout()`, not the nominal constant.
- The delayed sidebar auto-open had nothing cancelling it if the visitor navigated away before it fired, so it
  could pop open later at a completely different section (caught by the keyboard-stepping smoke test). `scrollTo`
  now cancels pending delayed calls alongside closing any already-open overlay.
- A raw `transform` written directly in JSX (the sidebar's and gallery's hidden starting position) got baked into
  GSAP's internal transform cache as a frozen pixel offset the first time GSAP touched the element, separate from
  the `xPercent` it then animated — the panel's tween visibly ran but the panel never moved. Both components now
  set their hidden state via GSAP itself, in a layout effect, with no transform in the JSX.
- Auto-opening the sidebar also stole keyboard focus into the Name field — an unrequested context change
  (WCAG 3.2.5) that silently broke the page's Home/End section-stepping (caught by the smoke test). Only the
  button-triggered open steals focus now; the scroll-triggered auto-open doesn't.
- `.detail-label` is paper-on-dark by default (built for the spec table and the bar); reused inside the light
  price-chart panels and the enquiry form, it read as paper-on-paper — present in the DOM, unreadable. Added a
  `[data-tone="light"]` override.
- The chart captions and price-strip tick labels measured 4.03:1 and worse against their background, under WCAG
  AA's 4.5:1 floor for normal text. Both bumped to match `.detail-label`'s own ratio (measured 4.68:1).
- The enquiry dialog claimed `aria-modal="true"` but Tab escaped it into the rest of the page. Added a focus trap
  (and the identical fix to the gallery, which has the same claim).
- Chart circles got only the browser's default focus outline, not the project's explicit "2 px ink" rule. Added it.
- `trendLine`'s OLS math had an unguarded division that produces `NaN` for a degenerate dataset; not reproducible
  against any of the 13 real cars after testing all of them, but guarded regardless since it's cheap and correct.
- `frontend-design` self-critique: the enquiry form's bordered, rounded inputs matched neither of the page's own
  vocabularies (full pills or bare hairlines) — switched to hairline-underline fields.
- The price module had no visual boundary, unlike the storyboard's card (frame 10); restored it with
  `--color-card`, a token that already existed in both themes but was unused until now.

Not tested: mobile/touch (out of scope until shot 3/6h); the equipment-and-history overlay button (unchanged,
still a placeholder); VoiceOver/NVDA directly (verified the accessibility tree and `aria-label` values
programmatically, not by ear).

### 6h: Polish, audits and the record

- **Goal:** ship-ready detail page in both themes, and the documents brought up to date.
- **Work:** the full audit protocol including `web-design-guidelines` and `break-ui` (long names, a car with only six
  photos, extreme prices); accessibility pass (keyboard path through the whole page, focus visibility on light and
  dark, screen-reader summaries); one final performance measurement; update `docs/PRD.md`, `DESIGN.md` (re-run
  `/impeccable document`), `docs/handoff.md` and `CLAUDE.md` (the clip-path and Satoshi exceptions, GSAP, and the
  per-car model budgets, which still say 120k triangles and 2.5 MB while the hero files ship up to 400k and
  4.49 MB: ask the user before changing them).
- **Gate:** every P0 and P1 fixed; the user compares the two themes and picks one (or keeps both for later); the
  user's final review.

#### 6h status (2026-10-10)

Run in a claude.ai cloud sandbox, not on the Windows laptop: Node 22, bundled Chromium only (no system Chrome), **no
GPU** (SwiftShader WebGL, about 1 fps with a car on screen). `.cache/` is gitignored, so none of the earlier check
scripts came with the clone; `detail-walk.mjs`, `detail-perf.mjs` and `js-size.mjs` were rewritten for the bundled
Chromium (`CHROME_PATH` or `--chrome` for the laptop), plus new `a11y.mjs`, `a11y2.mjs`, `a11y3.mjs` and
`a11y-tree.mjs`. `npm run check`'s smoke tests ran through a local config (bundled Chromium, 90 s expect timeout);
`playwright.config.ts` is unchanged.

Audit protocol, whole page, both themes: `frontend-design` self-critique; `/impeccable critique` (dual sub-agents:
design review, and the detector, whose CLI scan came back clean and whose browser findings were all false positives
or outside the page apart from the two folded in below); `/impeccable audit`; `web-design-guidelines`; `break-ui` with
the real worst cases (Gallardo LP 560-4's wrapping name, the Lotus without an emblem, the eight six-photo cars, the
$9.8k Peugeot and the $585k Jaguar, the Subaru's six-line summary); and an accessibility pass (the full Tab path both
ways, focus rings on light and dark, the overlays, the accessibility tree read as one document).

Fixed (each verified once, by walk screenshot or by polling the DOM):

- **Placeholder labels on the live page:** "C: SPECS" and "SLIDESHOW" still printed on the two dark panels
  (`Blocks.tsx` rendered every non-field block's label). No label text now.
- **Keyboard path:** from the hero, Tab jumped straight into the price charts' dots about ten viewports away, with an
  invisible focus ring (they weren't in 6d's inert list); at the slideshow stop "See all of this car's images" took
  focus off screen. The page now follows focus (`onFocusIn` in `Detail.tsx`: the track scrolls the focused control's
  block into view), and **6d's `inert` margin is gone**: once focus moved the page, the margin made "See all…"
  unreachable by Tab, and it hid every far control from screen readers too. Tab now walks Showroom, Sound, Jump to
  specs, the equipment button, the three charts, See all…, Inquire… and back, every stop on screen with its ring
  (ink on light, paper on dark). Recorded in the PRD's decision log.
- **Dialogs:** Tab from outside an auto-opened enquiry sidebar walked the page behind the scrim (it now enters the
  dialog); closing either dialog dropped focus to `<body>` (it now returns to the opener); Escape on a focused chart
  dot also left the page (it now stops at the chart).
- **Screen-reader text:** the B headline, the about paragraph, the summary quote, "Our take" and "To keep in mind"
  carried their text only in `aria-label` on a `<p>` over `aria-hidden` split pieces, which screen readers ignore: all
  five read as empty paragraphs. Each now has a visually hidden copy beside the hidden pieces. The chart dots were
  focusable inside `aria-hidden` SVGs (now labelled groups); the spec tables were `dt`/`dd` with no `dl`; "About the
  car", "Listed car specifications" and a hidden "Price comparison" are now `h2`s; `stripSummary` moved next to the
  strip it summarises; marketplace names read as slugs ("lot-twelve") in labels, tooltips and the hidden table.
- **Contrast (figma theme):** light `.detail-label`, the comparison line and the enquiry disclaimer measured 4.03:1
  (the 6g figure of 4.68:1 was against paper, not the beige card); now 75% ink (5.25:1 on the card). The dark pill
  over light photo areas measured 4.2:1; now 72% ink (5.8:1 over white). Tick labels' floor 9 → 11 px.
- **1024 × 640, the narrowest supported size:** the about paragraph ran off the bottom (now `height: auto`, as 6f did
  for "Our take"); the price module overflowed its cards because the charts' heights were fixed px inside `--u`
  cards, and the SVGs letterboxed against their HTML ticks at other widths. The charts now scale uniformly with their
  card's width (`useChartScale`). The spec bar's mileage no longer truncates.
- **Smaller visual bugs:** the price strip's verdict label overlapped the dots at 1920 and on the Peugeot and Jaguar
  (bottom-anchored now); "See all…" ran 43u off the grid and off screen at frame 12; the Gallardo's spec row read
  "Gallardo LP 560-4 · LP 560-4".
- **The enquiry auto-open** could still fire after a wheel flick back from section E (only keyboard navigation
  cancelled it); its delayed call now checks the scroll's target first. Not reproducible as a race in this sandbox
  (at 1 fps the sidebar is already open before a scripted scroll back), so verified by reading only.

Checks: typecheck, lint and build pass; 5 of 6 smoke tests passed in the full run and the sixth ("steps through its
sections") hit its own hard-coded 15 s limit on the software renderer, then passed on its one re-run in 34.5 s (35.7 s
at the 6h baseline). JS over the wire, compressed (`js-size.mjs`, new method, not comparable to 6d's): 449 KB before
any interaction, 146 KB more on opening a listing.

**Performance was not measured.** No frame-rate figure from a GPU-less sandbox means anything; `detail-perf.mjs` was
rewritten and run here only to prove it works end to end (it did: the run completed and printed the renderer it
measured, SwiftShader, at 1.4 fps; the script prints the GL renderer so a software run can't pass for a real one).
The decisive run is the user's, on the laptop:
`npm run build`, `npx next start -p 3200`, then `node .cache/detail-perf.mjs --chrome` at `--w 1440 --h 960` and
`--w 1920 --h 1080`, each with `--theme figma` and `--theme current`.

Decided by the user at the gate (2026-10-10), and built:

- **Theme: figma.** Recorded in the PRD; `?theme=current` still works until removed.
- **Non-modal auto-open.** The scroll-triggered enquiry opens without the scrim, without `aria-modal`, without taking
  focus, with the page behind still live, and closes when the visitor scrolls away from E; the button still opens the
  modal (scrim, focus into Name, Tab trapped), and pressing it while the non-modal panel is up adds the scrim without
  re-sliding the panel. Verified by polling the dialog's state in both motion modes. Found on the way: under reduced
  motion the sidebar's and the gallery's scrims faded to opacity 1 (a solid ink page), not 0.4; both fixed. The panel
  (420 px) still covers the end of "A new home" at 1440.
- **M7 depth drift** stays unwired for now (`depthDrift` in `lib/detail-fx.ts`).

From the user's review after the gate (same day), and built:

- **Hero spacing:** make · year sits exactly 24 px below the name's last line, and "Jump to specs" exactly 12 px below
  make · year, for any name length (literal px, like the grid's margins). The old reposition measured the name's
  box, which keeps the block's fixed 430u height, so a one-line name ("TR6") had several lines of empty space
  under it; it now measures the last rendered line. A stray `position: relative` on `.detail-jump` (it overrode the
  button's `absolute`) also put the button 2 px low at 1024 × 640; removed. Measured 24/12 px on the TR6, Porsche
  and Gallardo at 1440, the Gallardo at 1024 × 640 and the MX-5 at 1920 × 1080.
- **A2's swap timing:** the first swap waited for nothing and played as the slot entered on the right. It now starts
  when A2's left edge reaches 25% of the screen's width and, at a quarter-viewport step, finishes as the slot
  reaches the left edge, still fully on screen (polled: clip `inset(0)` at 100%, 50% and 25%, mid-wipe at 12.5%,
  done at 0). The B photo and the slideshow slot keep step 2's cadence (half a viewport, starting on entry).

`/review-animations` (run by the user after the gate) on 6h's motion: three findings, all fixed. Focus-follow
scrolled with the 1.2 s "Jump to specs" tween on a keyboard action; it now jumps immediately and the page's own
scroll lag carries the track. Sidebars and the gallery closed on `power2.in`; the `leave` token is now `power2.out`
(step 2's easing table updated). The non-modal-to-modal scrim fade used a literal curve; now `ease.fade`. Re-verified
the Tab path and both enquiry modes. Kept as the plan sets them, with the review's note: M11's 0.8 s open (longer
than a UI drawer's usual 500 ms, the overhaul's deliberately unhurried vocabulary) and the 1.2 s arrow-key stepping.

Not fixed, for the user (critique findings that are design calls, or outside 6h):

1. The non-modal enquiry panel covers the end of "A new home"; a slimmer panel would clear it.
2. `?theme=current` can be removed now that figma is picked.
3. The scatter and history have no axis labels, and `price-more`'s `justify-between` leaves a gap mid-card at 1440 and
   1920; section D reads more dashboard than brochure.
4. Six-photo cars repeat section A's photos in the slideshow (the known 6g trade-off).
5. At 1920 × 1080 the larger car (6c's 16:9 trade-off) runs under "Scroll for more".
6. P2/P3 polish: focus the first invalid field on submit; tooltips' `role="status"` regions mount with their content
   (unreliably announced); the arrows in link labels are read aloud; form inputs have no `name`; the gallery's rounded
   corners against the square-cornered system; the current theme uses no signal orange on the detail page.
7. `DESIGN.md` and `.impeccable/design.json` were regenerated from the figma theme (`/impeccable document`, scan
   mode, north star "The Stuttgart Brochure", chosen by the user).

### 7a: Section D's price comparison in three tabs

#### 7a status (2026-10-11)

- **Built:** `price-card` and `price-more` became `price-module` (x 10577, 564u wide, full inset height) and
  `price-title` (x 11165, 111u wide); the camera, the stops and every other block are unchanged. Detail.tsx renders
  the title as an h2 with M1 `lineRise`, and one card with the tabs; `hoverMid` is gone. PriceCharts.tsx was
  rewritten (`useChartSize`, real-pixel SVG, plot-rect pointer targeting, aria-live regions).
- **Enlargement fallback: not needed.** Chart boxes (width × height, px; Porsche, Peugeot and Jaguar identical):
  1440 × 960: 500 × 578 (spread), 500 × 603 (mileage, history); 1024 × 640: 333 × 340 and 333 × 359; 1920 × 1080
  (Porsche): 562 × 650 and 562 × 679. None under 320 × 220; nothing overflowed the card.
- **Checked** (cloud sandbox, software WebGL, no timings taken): typecheck, lint, production build and the 6 smoke
  tests; the tab keys (ArrowRight, End, Home, ArrowLeft), arrows on a focused mark not stepping the page, Escape on
  a mark leaving the chart but not the page, hover tooltip into the live region, and the accessibility tree order
  (Porsche, 1440 × 960).
- **Found and fixed:** the scatter's "Asking price" title collided with the top y tick (ticks within 16 px of the
  top are dropped); the strip's last tick overhung the chart box (ticks clamp inside it).
- **Fixed (user approved):** `price-title` wrapped to two lines and clipped at 1024 × 640 (111u is about 74 px
  there, the label needs about 85 px at the 11 px floor). It now has `height: auto` with its overflow mask kept, so
  it reads on two lines at narrow widths and one line at 1440.
- **Open:** Not run: the other
  twelve cars, the hover on tabs 1 and 3, the reveal, the `.cache/` walk (the folder is not in a fresh clone),
  `/impeccable critique` and `audit`, `web-design-guidelines`, `break-ui`, and the user's `/review-animations`.

### 7b: Section D's price comparison, bolder

#### 7b status (2026-10-11)

- **Built:** the verdict is the section's headline (display face, 64u, M2 char rise started with the module's reveal);
  `price-title` moved above the card (x 10577, y 24, w 564, h 16) and `price-module` starts at y 52 with its height set in
  the JSX (`calc(100% - calc(var(--u) * 76))`); the camera, stops and `cueRanges` are untouched. The header is verdict,
  price line ("cheaper than N% of M comparable listings", with the full sentence kept sr-only), comparison line, tabs.
  Tab 1 has a p25–p75 takeaway (`spreadTakeaway`), a flex-fill strip box, a "This car" pin (ring, 2 px line, label) and a
  bolder stat row below the strip box; the tick-overlap rule (`placeTicks`: 0.62 em per character, 8 px gap, clamped
  inside the box) runs on all three tabs.
- **M13 (tab switch)** is `effect.tabSwitch` in `lib/detail-motion.ts`: one indicator bar (`x`/`scaleX`, `overwrite:
  "auto"`), the incoming panel's text, chart box, stat row and caption rising 8 px, dots scaling from 0.85, scatter
  points fading, the history clip drawing. Pointer clicks animate; arrows, Home and End are instant; the previous
  switch's tweens are killed and cleared before each one.
- **Layout revised after review (user, 2026-10-11):** the title sits in a left column beside the card, not above it
  (`price-title` x 10577, w 111; `price-module` x 10712, y 24, full inset height). `t2` now reads the title's x, which is the
  old card x, so the camera is unchanged; the card's right part is therefore past the viewport at the price stop and comes
  into view as the visitor scrolls on.
- **Measured departures (both user-approved):** stat values 24u instead of 32u (at 32u the Porsche's $192,500 / $229,000
  / $284,000 measured 153 px each in a 500 px row and collided); strip baseline 0.74 instead of 0.62 (a ~100 px empty
  band under the ticks at 1440 × 960). Also: the pin line starts at `max(28, label height)` so the label never leaves the box,
  and marks fade to their resting opacity (the dots' 0.72 and the scatter's 0.55 live in the SVG attribute), not to 1.
- **Found and fixed:** price-axis labels repeated on the cheap cars ("$9k, $9k" on the Peugeot); ticks on half-thousands
  now carry one decimal.
- **Checked** (cloud sandbox, software WebGL, no timings): typecheck, lint, production build, the 6 smoke tests;
  `impeccable detect` (clean); title above the card, verdict on one line, no tick overlap and no overflow on Mazda,
  Porsche (1440 × 960), Jaguar (1024 × 640) and Peugeot (1920 × 1080 and 1440 × 960); the indicator's transform
  matched the active tab after a click, three rapid clicks and ArrowRight; the arrow keys did not step the page; the
  accessibility tree reads heading, verdict, price line, tab list, panel, tables.
- **Not run:** the full 4 cars × 3 viewports matrix (each car was run at one or two sizes), the mid-flight appearance
  of any tween (the sandbox renders about 1 fps, so no animation could be watched), reduced motion on the tab switch,
  `/impeccable critique` (the two isolated sub-agents), `/impeccable audit`, `/impeccable polish`, the
  `frontend-design` self-critique written out, and the user's `/review-animations` on M13 and the headline reveal.



- The showroom (carousel) redesign under the same principles, passing a `CarHandoff` from whatever its camera
  becomes.
- The equipment and history overlay, the gallery and `/credits` designed properly.

## 7c status

Built:

- **M14 Frame drift** on the A2, B photo and slideshow swap roots (`style.transform`; `stepSwap` still uses the nominal x).
  **M6** on the A1, slideshow tall and third photos through a `data-parallax-inner` wrapper (112% wide), so the entry
  and reveal tweens keep the inner element. **M7** wired through one `gsap.quickSetter(el, "x", "px")` per element
  (name, make · year, "Jump to specs", "Give it", "A new home"), created once. All skipped under reduced motion; each
  element is computed only while its block is within one viewport of the screen.
- Known: the offsets are 0 only where the frame is centred (M14) or at the track's start/end (M7). The A2 and B photo
  stops are within about 2u of that; the slideshow swap is +58u at the slideshow stop and -36u at frame 12.
- About paragraph 542 → 813u wide. Section C: the equipment button fades with table B's first row and rule draw (M12)
  and never moves; the "Listed car specifications" label is Staatliches like "About the car"; the photo band is 1300u
  wide, flush with table B's right edge (8028u).
- **Checks** (cloud sandbox, software WebGL, no timings): typecheck, lint, production build; 5 of the 6 smoke tests, and the
  keyboard-steps test passes once its 15 s waits are raised to 150 s (the sandbox renders about 1 fps; the page was still
  scrolling). Walk of the Triumph TR6 at 1440 × 960 and 1024 × 640, frames 1, 2, 5, 6, 7, 11, 12, 14: hero type at offset 0
  at frame 1 and "Give it" / "A new home" at 0 at frame 14; the A2, B and slideshow photos shift mid-scroll; the band's
  right edge equals table B's (8028 at 1440, flush at 1024 too); the button is at opacity 0 until table B's reveal, then 1.
  GSAP trap: at x = 400u "Make · year" read tx 48 with ty 0 (its rise had played) and "Jump to specs" tx 24, ty 0; at 13300u
  (after M9 played) "Give it" read tx -70.5 and "A new home" +47, both at opacity 1. Reduced motion: every new offset 0
  at five scroll positions.
- **About paragraph, 1440 × 960:** 4 lines on the Porsche 930, Triumph TR6, Jaguar XJ220 and Datsun 240K GT; 3 lines on the
  other nine (none above 5). Font size untouched.
- **Not run:** `/review-animations` on M14, M7 and the button fade (the user's), the full car matrix for the walk,
  `/impeccable critique` and `audit`.


## 7d status

Built:

- **Price header:** price and claim on one ink block (price, 12 px, claim; claim at 80% paper; paper focus rings inside). The
  "How we count" text button is now a 16u circle with an italic "i" (`aria-label="About this comparison"`, 44px hit area).
  Its tooltip carries the listing count, the marketplaces (`Intl.ListFormat`, "and" list) and the method note; it shows on
  hover (fine pointers), `:focus-visible` and `aria-expanded` (click, for touch), with `price-info-in` (reduced motion:
  `price-info-fade`). The source `<p>` and `InfoNote` are gone.
- **Tabs:** `justify-content: space-between` (equal gaps; last label flush right). The indicator re-measures when each tab
  button resizes and once after `document.fonts.ready`.
- **M4 everywhere:** trigger 0.9 → 0.8 on the frame's left edge (reverses the 2026-10-10 "fully in frame" call); A2, B photo
  and the slideshow swap slot reveal through `[data-reveal-inner]` (separate from the M6 element); the photo zooms 1.05 → 1
  over 1.4 s from 0.6 s (ends at 2.0 s; none under reduced motion). B photo's and the swap slot's first wipe now start at
  0.6 of the viewport (step 0.25); A2 keeps (0.25, 0.25).
- **Slideshow:** panel 2100 → 1720u (ends 12u after "See all" and S third, at 13020u); everything from E on moved 380u left
  (`TRACK` 14830, `ENQUIRY` 13390, frames 13 and 14: 12792, 13390); `layout()` uses `TRACK * u`. "Give it" 80u left, "A new home"
  80u left and 50u up. "Inquire about this car here →" is right-aligned, its box ending at TRACK − 12.
- **Photos:** each photo appears once. Fill order A1, A2, B, C band, S tall, S third, S swap, A3, then extra swap layers
  (A2, B, S swap, three rounds). `photoGroup` is deleted. Slots by photo count: 6 photos (Datsun, Integra, NSX, Gallardo, MX-5,
  205, 930, TR6) → A1, A2, B, C, S tall, S third (no S swap); 7 (Barchetta, Subaru) add a static S swap; 13 (Elise, XJ220) fill A3,
  A2 and B at 3 layers and S swap at 2; 14 (M5) fills every layer.
- "Scroll for more" sits 12u above the bar (was 24u).

Checks (cloud sandbox, software WebGL, about 1 fps; no timings): typecheck, lint, build; 5 of the 6 smoke tests on the full run,
the 6th (keyboard steps) fails on its 15 s waits at this frame rate and passes alone. Walk of the TR6 and M5 at 1440 × 960
and 1024 × 640, frames 2, 5, 9 to 14: price → 12 px → claim; tab indicator equals its label's text rect (±0.4 px) and the last
label ends at the divider's right; slideshow right edge − S third right = 12u (12 px at 1440, 8 px at 1024); no src repeats
on any of the 13 cars. B photo: hidden at a left edge of 85%, reveals at 80%, ends at clip 0 and scale 1. Reduced motion: the
frame fades, no scale. Not run: `/review-animations` on the reveal and zoom (the user's), `/impeccable critique` and `audit`.

**Open, needs a decision:** `layout()` sizes the track from the probe's measured width, and Chromium quantises that width to
1/64 px: `--u` is 1.0979 at 1885 × 1054 but the probe reads 1.09375, so the track is 16220 px instead of 16282 and the blocks (laid
out by CSS `--u`) overshoot at the end by 62 px. At 1885 × 1054 the inquire text's right edge is 1933.6 px (clientWidth 1885;
want 1871.8). At 1440 × 960 it is exact (1428). At 1024 × 640 it is 1170.5 (want 1016). Fix: measure the probe at
`calc(var(--u) * 1000)` and divide by 1000.

## 7e status

- Done: `.price-info-tip` wraps and sits inside its box and the price card at 1440 × 960 and 1024 × 640 with no clipping ancestor; S swap always renders (reuses A2's photo only for pools under seven: porsche-930 and triumph-tr6 repeat once, bmw-m5-e39 never); "Give it" x 13535 → 13499.
- Open: the cut-off inquire text is not the `h + travel` height mismatch (`lenis.limit === travel`, scroller height equals root height at every size) but the probe's 1/64 px quantisation noted above (1896 × 950: text 65 px past the edge; 1896 × 1065 and 1440 × 960 are exact). Not changed, awaiting a go on the `calc(var(--u) * 1000)` fix.
- Verified: typecheck, lint, 6 smoke tests, porsche-930 walk at frames 11, 12, 14 (1440 × 960; enquiry auto-open fires). Not committed.

## 7f status

- Done: the inquire cut-off (7e's open item) is fixed by measuring the `u` probe at the full track width (`u(TRACK)`, then `/ TRACK`): a 1u probe's 1/64 px rounding, times 14,830, overshot the track's end. The inquire text's right edge is now exactly 12u inside the screen at 1885 × 1054, 1896 × 950, 1440 × 960 and 1024 × 640, with no horizontal page scroll. S third and "See all" end 24u before the slideshow panel (x 12276 / 12676). "Give it" → "Give this car" (one line, box w 900). The TR6's interior photo now sits in the C band (photos.json and photos.selection.json order).
- Photos (after the network was opened): the 930 gets a classic-911 black-leather interior (fragment.fi, CC BY 2.0) in the C band, and its listing now reads black leather to match the photo and the model; the TR6 gets a cream TR6 from behind (andreboeni, CC BY 2.0) for S swap. Both cars now fill every frame with no repeats (A3 stays empty below eight photos). Both new files are Flickr 1024 px sources, so the C band upscales the 930's interior slightly. Commons' API throttles this environment, so the files were added the way `scripts/photos/fetch.mjs` would, without running it. "Give this car" moved another 96u left (x 13403).
- "Our take" and "To keep in mind" are now the columns of one bottom-anchored grid aligned to the top: labels and first lines share a level at 1440 × 960 and 1024 × 640, and the longer paragraph ends on the 24u bottom margin.
- Verified: typecheck, lint, build, 6 smoke tests (the keyboard test timed out once on software WebGL and passed on rerun). Not committed.

## After 7f: chassis number and section E

- Hero: a chassis number (new `chassisNo` per car in `lib/cars.ts`, fiction in each maker's real format) sits 4px under make · year in the same box, so it rises and drifts with it; "Jump to specs" stays 12px under the box.
- Section E: "Give this car" / "A new home" stack at the resting viewport's top-left (24u, floored at the pills' 24px, and below the pills' row), and enter together from the left (M9); the right column (a fictional contact card, "or", the form link) enters from the right, stacked in one flex column 12u inside the right edge. The form link draws a hairline under each line from the right on hover/focus (transform only, `--dur-hover`, `--ease-reveal`) and nudges its arrow; it opens the sidebar modal.
- The scroll-triggered sidebar (the non-modal auto-open from 6h) is removed (user): it covered the contact card and "or". The form opens only from the link, as a modal.
- Verified: typecheck, lint, build, 6 smoke tests; positions measured at 1440 × 960, 1885 × 1054 and 1024 × 640.
- Then (user): the contact card moved into the enquiry sidebar, above the form, with an "or send a message" divider; section E keeps only the form link (back at x 14578, y 430). "Give this car" / "a new home" are now sentence case like the summary, centred in the resting viewport (layout() spans them across it at any width).
- Then: M9 is now a scroll-tied fade (opacity 0 → 1 over M3's range) on the two headings and the form link; the triggered side entrance and the section E trigger marker are gone. Reduced motion shows them at full opacity.

## Film mode (for the LinkedIn recording)

- `?film` (TR6) or `?film=<slug>` on `/`: implies `?record`, hides the cursor, the Next dev badge and focus rings, enters without sound, glides the carousel to the car, opens it, then drives the track stop to stop (380u/s, the camera's `travel` curve, 1.8 s holds) and ends on the enquiry sidebar; the detail root reads `data-film="running"`, then `"done"`. Any wheel, key, pointer or touch press stops the run. On `/cars/<slug>?film` it skips the showroom. Off under reduced motion. Timings in `lib/film.ts`.
- Record on the laptop against the production build (`npm run build && npm start`), not in a cloud session (software WebGL, about 1 fps). Verified in the cloud only for sequence: gate → showroom → morph → seven stops → sidebar → done.
- Section E at rest: the headings start at the back pill's left edge and the form link ends the same 24px from the right edge.

## After film mode: the price gap and the price parallax

- `PRICE_GAP` (600u, `lib/detail-layout.ts`): the price section and everything after it moved 600u right (TRACK 15430, ENQUIRY 13990, price stop 10326, slideshow stop 11405; FRAMES updated), while T2 still ends at 9726u, so the car holds its side pose over the open field before the price card enters.
- M14 on the price section: the card (`frameDrift`) and its title (quickSetter; M1 owns its transform) move at 1.12× the page, 0 at the price stop.
- Film mode's pace: 380 → 475 u/s (about 25% quicker), minimum move 2.4 → 1.9 s.
- Seen, not changed: at the price stop the card's right edge runs past a 1440-wide viewport (card 986–1550px); the card and the stop moved together, so this predates the gap.
- Film mode, round 2: pace 546 u/s (another +15%), minimum move 1.65 s; an extra 2.6 s halt on section C's summary once M3 has fully lit it; at the price stop a stand-in cursor (`.film-cursor`) glides over five marks on each chart (feeding them real `pointermove` events, so the tooltips show) and clicks through Price vs mileage and Price history. Where the card would run past the right edge (narrower than about 1.6:1), the run halts a little further on so the tour stays on screen. A `/cars/<slug>?film` deep link now enters the gate too. Only real (trusted) input stops the run.
