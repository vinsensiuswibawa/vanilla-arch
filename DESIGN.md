---
name: Arcade
description: A horizontally scrolling 3D showroom of modern classic cars, set like a German sales brochure in motion.
colors:
  paper: "#fffdf9"
  ink: "#102e30"
  slate-panel: "#2c3638"
  brochure-beige: "#dbd7cb"
  studio-field: "#ededed"
  mist-100: "#f4f2ec"
  mist-300: "#cfd4d2"
  mist-500: "#8a9899"
  mist-700: "#4a5f61"
  signal-text: "#c2541b"
typography:
  display:
    fontFamily: "Satoshi, system-ui, sans-serif"
    fontSize: "calc(160 * var(--u))"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Satoshi, system-ui, sans-serif"
    fontSize: "calc(106 * var(--u))"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Satoshi, system-ui, sans-serif"
    fontSize: "calc(76 * var(--u))"
    fontWeight: 400
    lineHeight: 0.95
  body:
    fontFamily: "Satoshi, system-ui, sans-serif"
    fontSize: "max(13px, calc(17 * var(--u)))"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Satoshi, system-ui, sans-serif"
    fontSize: "max(10px, calc(12 * var(--u)))"
    fontWeight: 400
    letterSpacing: "0.04em"
  condensed:
    fontFamily: "Staatliches, Arial Narrow, sans-serif"
    fontSize: "max(16px, calc(24 * var(--u)))"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.04em"
  numerals:
    fontFamily: "Satoshi, system-ui, sans-serif"
    fontSize: "calc(56 * var(--u))"
    fontWeight: 400
    lineHeight: 1
    fontFeature: "tnum"
rounded:
  none: "0px"
  pill: "9999px"
spacing:
  margin: "24px"
  gutter: "24px"
  unit: "min(100vw / 1440, 100dvh / 960)"
components:
  pill:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "36px"
  pill-on-dark:
    backgroundColor: "{colors.slate-panel}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "36px"
  outline-button-on-dark:
    backgroundColor: "{colors.slate-panel}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    height: "max(44px, calc(44 * var(--u)))"
  spec-bar:
    backgroundColor: "{colors.slate-panel}"
    textColor: "{colors.paper}"
    height: "calc(68 * var(--u))"
    padding: "0 24px"
  price-card:
    backgroundColor: "{colors.brochure-beige}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "max(16px, calc(20 * var(--u)))"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "8px 2px"
  sidebar:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    width: "420px"
---

# Design System: Arcade

<!-- Scanned from the shipped "figma" theme (app/globals.css `[data-theme="figma"]`, components/detail/) after the
detail-page overhaul, shot 6h, 2026-10-10. The user picked this theme at the 6h gate; `?theme=current` (Bodoni Moda,
Host Grotesk, Geist Mono, achromatic plus signal orange) still exists in code until it is removed. -->

## Overview

**Creative North Star: "The Stuttgart Brochure"**

Arcade reads like a German sales brochure that turns its own pages. Each car's listing is one long horizontal
spread: a cover with the name set huge behind the car, photo spreads, a magazine "About" page, a dark specification
sheet, a price page and a closing call to action. The grid is strict (five columns, 24 px margins and gutters,
everything sized in one unit drawn at 1440 × 960), the ink is a deep teal rather than black, and the paper is a
barely warm off-white. Nothing is decorated; hierarchy comes from scale, case and the layer the type sits on.

The car is the photograph. The one persistent 3D model moves through four camera poses as the page scrolls (a low
three-quarter hero, a top-down roof view, a pure side view, a head-on front view), and the page's dark panels pass
over it and reveal it again. Type and fields sit behind the car; photos, panels and controls sit in front. Seller
photos are unretouched and the cars carry all of the colour.

Motion is unhurried and masked: text rises from under a line, photos open with a clip, everything long and
`power3.out`. Scroll-tied effects (the travel, the camera, parallax, the spec bar's exit) reverse with the scroll;
triggered reveals play once.

**Key Characteristics:**

- Deep teal ink on warm paper, slate panels, one beige card; no saturated UI colour.
- Huge uppercase Satoshi display with tight tracking, condensed Staatliches for small heads.
- A five-column grid at a single scale unit, with 24 px margins at every size.
- Three layers: type behind the car, the car, photos and panels in front.
- Square corners on everything that holds content; full pills only for controls.

## Colors

An achromatic system tinted toward teal: ink, paper and slate do all the work, and the cars bring the colour.

### Primary

- **Deep Teal Ink** (#102e30): all text on light ground, the car name, headlines, rules on light, focus rings, the
  progress line. Never black.

### Neutral

- **Warm Paper** (#fffdf9): the page, the about surface, the sidebar, labels and text on dark ground.
- **Slate Panel** (#2c3638): the specification section, the slideshow, the bottom spec bar, the dark pill.
- **Brochure Beige** (#dbd7cb): the price card and its two dataset cards; nothing else.
- **Studio Field** (#ededed): the pale ground the 3D car stands on between sections.
- **Mist 700** (#4a5f61): secondary text on paper (7:1), the vertical "Scroll for more".
- **Mist 100 / 300 / 500** (#f4f2ec, #cfd4d2, #8a9899): tints of the ink for quiet surfaces and hairlines; 500 only
  for decorative type at 24 px and up.
- **Signal Text** (#c2541b): form error text only, always beside words, never the only cue.

### Named Rules

**The Car Carries the Colour Rule.** The UI stays in ink, paper, slate, beige and field. Saturation belongs to the
cars, their photos and the small full-colour maker emblems.

**The Translucent Ink Floor.** Secondary text is ink mixed with transparency, never below 75% on beige or paper
(5.25:1 on the card) and 70% for captions on paper; the dark pill is ink at 72% so paper text holds 5.8:1 even over a
white photo.

## Typography

**Display Font:** Satoshi (variable, self-hosted; ITF Free Font License, the project's named exception to OFL)
**Body Font:** Satoshi
**Label/Condensed Font:** Staatliches (OFL)

**Character:** one geometric grotesk at every size, made to feel editorial by scale and case alone, with a narrow
poster face for the small heads that a brochure would set in a condensed sans.

### Hierarchy

- **Display** (400, 160u, 0.95, −0.02em, uppercase): the car name in the hero, one word per line, behind the car.
  "Give it" / "A new home" in the finale use the same treatment at 136u.
- **Headline** (400, 106u, 0.95, uppercase): the about section's three-line headline.
- **Title** (400, 76u, 0.95, sentence case): the specification section's summary quote, brightening as it scrolls.
- **Numerals** (400, 56u for the price, tabular figures): prices and mileage wherever figures align.
- **Body** (400, 17u with a 13 px floor, 1.4): the about paragraph, "Our take", "To keep in mind", form text.
- **Label** (400, 12u with a 10 px floor, 0.04em, uppercase): spec-table terms, chart heads, captions, pills.
- **Condensed** (Staatliches, 24u with a 16 px floor, 0.04em, uppercase): make · year, "About the car".

### Named Rules

**The Floor Rule.** Every `--u`-scaled size carries a pixel floor (`max(13px, …)` for body, 10–12 px for labels), so
the brochure scales down to 1024 × 640 without text falling below legibility.

## Layout

A five-column grid drawn at 1440 × 960: column width = (viewport − 144) / 5, 24 px margins and gutters at every
size. One scale unit, `--u = min(100vw / 1440, 100dvh / 960)`, sizes type, photos, section widths and vertical
positions; margins and gutters stay 24 px. Every section is exactly one viewport tall, and the page is one horizontal
track about ten viewports long, mapped one to one to vertical scroll. The next section always peeks at least 96u in
at the right edge. Supported from 1024 × 640, tuned for 1080, 1440 and 1920 wide; desktop only.

## Elevation & Depth

Flat. Depth comes from the layers and the 3D studio, not from shadows: type and pale fields sit behind the canvas,
the car and its baked contact shadow in the middle, photos and dark panels in front. Overlays use a 40% ink scrim
(modal only). The only shadow in the system is the chart tooltip's soft lift
(`0 2px 12px color-mix(in srgb, ink 18%, transparent)`).

### Named Rules

**The Three Layers Rule.** Anything the car may pass over goes in the behind layer; anything that may cover the car
goes in front. Every fact in 3D also exists as DOM text.

## Shapes

Square corners on everything that holds content: photos, panels, cards, the sidebar, form fields (a single bottom
hairline, no box). Controls are full pills (9999px): the back pill, the sound toggle, the equipment button, form
buttons. Hairlines are 1 px at 22–30% ink (or paper on dark) and draw in from the left.

## Components

### Buttons

- **Shape:** full pill (9999px), 36 px tall for chrome, at least 44 px for in-page actions.
- **Pill (light ground):** ink label on paper at 72% with a 22% ink hairline and an 8 px backdrop blur.
- **Pill (dark ground):** paper label on ink at 72% with a 30% paper hairline; the back pill switches between the two
  with a 0.3 s colour crossfade as a section boundary passes under it.
- **Outline (dark):** paper label, 1 px paper inset ring, uppercase label size ("See equipment and ownership
  history").
- **Text links:** "Jump to specs →" draws a 1 px underline from the left on hover and focus; "Inquire about this car
  here →" is set in the display face at 28u.
- **Focus:** 2 px ink outline with 2 px offset everywhere; paper on dark ground.

### Cards / Containers

- **Price card (7a, 7b):** one tall brochure-beige card, square, 32u padding (20 px floor). Its headline is the
  verdict in the display face (64u, uppercase), then the price in mono with "cheaper than N% of M comparable
  listings", the comparison line and three tabs, one chart per tab. The "Price comparison" title in the condensed
  label face sits above the card, so it is read first.
- **Price tabs:** left-aligned labels in uppercase text face, 44 px touch height, 32u apart; inactive ink at 75%,
  active ink; one 2 px ink bar slides under the active tab (0.3 s, `reveal`) over a 22%-ink hairline; keyboard
  switches are instant.
- **Price strip (7a, 7b):** a 1 px baseline at 22% ink; filled ink dots (area ∝ listing count, radius 1.6–5.5% of the
  chart width, 72% opacity); this car an ink ring with a 2 px ink pin rising to a "This car" and price label; up to
  four price ticks (dropped when they would touch); a four-column Lowest / Median / Highest / Listings row (mono, 24u)
  under a hairline below the chart.
- **Dark panels:** slate, full height, with paper type and 30%-paper hairlines.

### Inputs / Fields

- **Style:** no box; a 1 px bottom hairline at 30% ink, 8 px × 2 px padding, body size with a 14 px floor.
- **Focus:** 2 px ink outline, 2 px offset.
- **Error:** the hairline and a text message in signal text, height reserved so nothing reflows.

### Navigation

- The back pill ("← Showroom", Escape) and the sound toggle, top left at the 24 px margins; a 1 px progress line
  across the top edge, filling with `scaleX`, switching tone with the pill.
- Keyboard: arrows and Page Up/Down step by section, Home and End go to the ends, Tab walks every control and the
  page follows focus.

### The Spec Bar (signature)

A slate bar 68u tall across the bottom of the hero and section A: mileage, engine, colour and location on the left
(label above value, separated by dots), "Price as listed" and the price in tabular figures on the right. It slides
down and out as the camera begins its first move.

### The Price Strip (signature)

One hairline across the card; comparable listings grouped into price steps, each a filled ink dot whose area tracks
its count; this car an ink ring on a pin that rises to its price. The verdict in words ("Good value", "Fair price",
"Above market") is the card's headline above it. Up to four mono ticks below, a caption saying the data is illustrative.

## Do's and Don'ts

### Do:

- **Do** keep every size on the `--u` scale with a pixel floor, and every margin at 24 px.
- **Do** put type the car may cross in the behind layer and anything that may cover it in front.
- **Do** reveal text from under a line mask and photos with `clip-path: inset()`; travel at most one line or ~15% of a
  photo.
- **Do** say a verdict or a state in words; colour is never the only cue.
- **Do** keep secondary text at 75% ink or more on beige and paper.

### Don't:

- **Don't** add UI colour: no accent fills, no coloured buttons; the cars carry the colour.
- **Don't** round content corners (photos, panels, cards, fields); pills are for controls only.
- **Don't** use shadows for depth; use the layers and the studio.
- **Don't** animate layout properties; DOM motion is `transform`, `opacity`, `filter: blur()` (≤ 8 px) and, for image
  reveals only, `clip-path: inset()`.
- **Don't** cover the finale: the scroll-triggered enquiry opens without a scrim; only the button's open is modal.
- **Don't** use Gran Turismo assets, logos or music; GT4 is a reference for feel only.
