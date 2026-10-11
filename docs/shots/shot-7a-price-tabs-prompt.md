# Shot 7a prompt: section D's price comparison, redesigned into three tabs

Paste everything below the line into a fresh session (Sonnet). It is self-contained.

---

We're polishing Arcade's car detail page. The overhaul (shots 6a–6h) is complete and on `main`
(`vinsensiuswibawa/vanilla-arch`). This session is **shot 7a only**: redesign section D's price comparison module
(the beige cards in frame 10) so it reads at a glance and is easy to interact with. Nothing else on the page changes.

## Read first, in full

1. `CLAUDE.md` and `AGENTS.md` (Next.js 16.3 differs from older versions: read the matching guide in
   `node_modules/next/dist/docs/` before writing Next code).
2. `docs/handoff.md`, then `docs/overhaul.md`: step 2 (motion vocabulary: M1, M8, the `reveal`/`fade` easings),
   step 3 ("D: price"), step 5 ("Section D: price comparison", the original spec this shot replaces), and the
   **6g and 6h status blocks** in step 6. 6h fixed real bugs in exactly this code: focusable dots inside an
   `aria-hidden` SVG, Escape leaking from a chart to the page, contrast on the beige card, the price module
   overflowing at 1024 × 640, the SVG letterboxing against its HTML ticks. Do not reintroduce any of them.
3. `DESIGN.md` (the figma theme is the chosen system; north star "The Stuttgart Brochure") and `PRODUCT.md`.
4. `docs/storyboard/README.md` frame 10 and `docs/storyboard/10.png`.
5. The code you will change: `components/detail/PriceCharts.tsx`, the price-module markup in
   `components/detail/Detail.tsx` (search `price-card`), `lib/detail-layout.ts` (`price-card`, `price-more`,
   `cueRanges`), `lib/comparables.ts` (read-only: reuse its helpers), the "Detail page" section of `app/globals.css`.

## The brief (approved by the user)

- **Job:** a visitor at section D wants one answer: is this car's price fair? Today three charts are stacked in two
  small beige cards with tiny type, no axes, 3 px hover targets and a large empty gap mid-card.
- **Direction:** a two-column magazine spread inside the existing white price panel. A narrow right-hand column
  carries only the section title in Staatliches (and is otherwise empty, on purpose); the wide left column is one tall
  beige card holding the price, the comparison line and **three tabs**, one chart per tab, each chart filling the card.
- **Labels (exact):** title `Price comparison`; tabs `Price spread`, `Price vs mileage`, `Price history`.
- **Dropped:** the strip ↔ scatter linked hover (different tabs now). Remove the `hoverMid` plumbing entirely.
- **Untouched:** the camera, every other section, the car's side view at the price stop. Build at the current width
  first (the price panel stays 747u, the track 15210u). The user has allowed the section to grow **only if the data
  needs it**; the exact, measured condition and recipe are under "Enlarging the section (fallback)" below.

## Exact layout (u = the 1440 × 960 reference pixel; position everything with `styleOf`/`u()` from `lib/detail-layout.ts`)

### Blocks (`lib/detail-layout.ts`)

Replace the `price-card` and `price-more` entries with exactly these two; keep `price-panel` as it is
(x 10553, w 747):

```ts
{ id: "price-module", layer: "front", kind: "card", tone: "light", label: "Price comparison", real: true, x: 10577, y: 24, w: 564, h: "inset" },
{ id: "price-title", layer: "front", kind: "type", tone: "light", label: "Price comparison title", real: true, x: 11165, y: 56, w: 111, h: 24 },
```

- Geometry check: card 10577 → 11141, 24u gutter, title column 11165 → 11276, 24u margin, slideshow starts at 11300.
  `h: "inset"` = viewport height − 48u (912u at 960), so the card runs from the top margin to the bottom margin.
- `price-title`'s y 56 = the card's top (24) + the card's padding (32), so the title's cap line sits level with the
  first line inside the card.
- In `cueRanges`, change `block("price-card")` to `block("price-module")` (same x: the camera is unchanged).
- Leave `STOPS` alone (price stays at 9726). At exactly 1440 × 960 the title column sits just past the right edge at
  the price stop and slides into view as the visitor scrolls on; on 16:10 and 16:9 screens it's visible at the stop.
  The user accepted this.

### Enlarging the section (fallback, only on a measured failure)

Build at the width above first. Then measure each tab's chart box in the browser (`getBoundingClientRect()` of the
chart box, all three tabs, Porsche, Peugeot and Jaguar) at 1440 × 960 and 1024 × 640. **Enlarge only if** a chart box
is narrower than 320 px or shorter than 220 px, or the strip's tick labels or its 4-column stat row can't fit on one
line without overlapping. If none of that happens, don't enlarge, and say so in the report with the measurements.

If it does happen, apply exactly this, and nothing else (Δ = 135u, which makes the card 699u):

| What | From | To |
| --- | --- | --- |
| `price-panel` w | 747 | 882 |
| `price-module` w | 564 | 699 (x stays 10577) |
| `price-title` x | 11165 | 11300 (the card's right edge 11276 + the 24u gutter) |
| `slideshow` x | 11300 | 11435 |
| `s-tall` x / `s-swap` x / `s-third` x / `s-all` x | 11324 / 11780 / 12288 / 12688 | 11459 / 11915 / 12423 / 12823 |
| `field-e` x / `give-it` x / `new-home` x / `inquire` x | 13400 / 13995 / 14220 / 14950 | 13535 / 14130 / 14355 / 15085 |
| `TRACK` / `ENQUIRY` | 15210 / 13770 | 15345 / 13905 |
| `STOPS` slideshow (enquiry follows `ENQUIRY`) | 10805 | 10940 |
| `FRAMES` (in `lib/detail-layout.ts` **and** `.cache/detail-walk.mjs`), last four | 10805, 11593, 13172, 13770 | 10940, 11728, 13307, 13905 |
| `Detail.tsx` `const total = 15210 * u` | the literal | `TRACK * u` (import `TRACK`; the literal is a latent bug either way) |

- **Leave `STOPS` price at 9726 and P2 alone.** At that stop at 1440 × 960 the card's right 110u is past the viewport
  edge and comes into view as the visitor scrolls on. Moving the stop right instead would slide the white price panel
  over the side-view car's nose (the panel would start at x 693 at 1440, the nose sits at 720), which the storyboard
  never allows. Don't move the camera to compensate.
- Every block from the slideshow on moves by the same Δ, so the slideshow, the enquiry and the camera's T3 keep
  their relationships (`cueRanges` reads the blocks, so T3 follows automatically). Check the peek rule (≥ 96u of the
  next section in view) at the price → slideshow seam, and re-walk frames 10–14 at all three sizes.
- Record the enlargement, with the measurements that triggered it, in the 7a status block and the PRD decision log.

### The title (`Detail.tsx`)

Render it as the section's `h2`, **before** the card in the DOM (so it's read first), styled exactly like section B's
"About the car" label (search `ref={aboutLabel}`):

```tsx
<h2 ref={priceTitle} data-block="price-title" data-tone="light" className="font-condensed absolute overflow-hidden"
  style={{ ...styleOf(block("price-title")), lineHeight: 1, fontSize: "max(11px, var(--type-label))", letterSpacing: "var(--label-tracking)", textTransform: "var(--label-case)" }}>
  Price comparison
</h2>
```

Reveal it with M1 exactly like `aboutLabel`: `revealOnce(priceTitle.current, effect.lineRise.trigger, () => lineRise(priceTitle.current!, reduced))`
plus the matching hidden starting state. Delete the `sr-only` "Price comparison" `h2` inside `PriceCard`.

### The card (`price-module`)

One element replaces both cards: `background: var(--color-card)`, square corners,
`padding: max(20px, calc(32 * var(--u)))`, `display: flex; flex-direction: column`, `box-sizing: border-box`.
Children top to bottom, with these gaps (all `calc(N * var(--u))` with the floors given):

| # | Element | Spec |
| --- | --- | --- |
| 1 | Price | `font-mono`, `var(--type-price)` (56u), `line-height: 1`, ink |
| 2 | Comparison line | gap 8u; `comparisonLine(listings)`; `max(12px, var(--type-label))`, `line-height: 1.4`, ink at 75% |
| 3 | Tab list | gap 24u; see Tabs below |
| 4 | Active tab panel | gap 24u; `flex: 1; min-height: 0; display: flex; flex-direction: column` |
| 5 | Screen-reader data | the existing `DataTable`, **outside** the tab panels (hidden panels hide their content from assistive tech) |

Inside each tab panel, top to bottom:

| Element | Spec |
| --- | --- |
| Takeaway | the existing `Takeaway` component (body size, ink) |
| Chart box | gap 16u; `flex: 1; min-height: max(220px, calc(220 * var(--u)))`; `position: relative`; the chart measures this box |
| Caption | gap 12u; the existing `Caption` (`max(10px, var(--type-label))`, ink at 70%) |

At 1440 × 960 that leaves a chart box of roughly 500 × 560 px; at 1024 × 640, roughly 330 × 300 px. Both must fit
with nothing overflowing the card (6h's overflow bug).

### Tabs (WAI-ARIA tabs pattern, automatic activation)

- Markup: `role="tablist"` with `aria-label="Price comparison datasets"`; three `<button role="tab">` with `id`s from
  `useId()`, `aria-selected`, `aria-controls` → each panel; three `role="tabpanel"` with `aria-labelledby` → its tab.
  Inactive panels get the `hidden` attribute; **render a panel's chart only while it is active** (so the chart's
  `ResizeObserver` measures a visible box).
- Roving `tabIndex`: active tab 0, others −1. Keys on a tab: ArrowRight / ArrowLeft move to the next / previous tab
  (wrapping) and activate it; Home / End go to the first / last. Call `event.preventDefault()` on each of these:
  `Detail.tsx`'s window `onKey` returns early on `defaultPrevented`, which is what stops the arrows from also
  stepping the page between sections.
- Look: tabs left-aligned in one row, 32u between them, height `max(44px, calc(44 * var(--u)))` (44 px touch-target
  floor), no padding, no background. Label: `font-family: var(--t-text)`, `max(12px, var(--type-label))`, uppercase,
  `var(--label-tracking)`. Inactive label: ink at 75% (5.25:1 on the card, the 6h floor); active: ink at 100%.
  Active indicator: a 2 px ink bar flush with the tab's bottom edge, full label width. Under the whole row, a 1 px
  hairline at 22% ink (a `data-rule` element, so the section's M8 reveal draws it).
- Hover (gated `@media (hover: hover) and (pointer: fine)`): label to 100% ink, no transition.
  Focus: `:focus-visible` 2 px ink outline, 2 px offset (the global rule already does this).
- **Switching tabs is instant: no animation** of the panel or the indicator. Tabs are a frequent, keyboard-reachable
  action (`/review-animations` standard 2), and the overhaul's motion vocabulary has no tab token.

### Charts: drop the viewBox scaling, draw in real pixels

Replace `useChartScale` (the `W = 564` viewBox approach) with a `useChartSize(ref)` hook: a `ResizeObserver` on the
chart box returning `{ width, height }` in CSS px. Each SVG is `width={width} height={height}` with
`viewBox={`0 0 ${width} ${height}`}`, every d3 range is in those px, and every HTML overlay (ticks, labels, tooltip)
is positioned in the same px. Nothing scales a drawing after the fact, so ticks and marks always line up.
Plot margins inside the chart box (px): **top 8, right 8, bottom 36, left 56** for the scatter and the history;
**left 0, right 0** for the strip. Tick labels are HTML: `font-mono`, `max(11px, calc(11 * var(--u)))`, ink at 70%.

#### Tab 1, "Price spread" (the strip)

- Takeaway: `stripSummary(car.priceUsd, listings)` (it is now visible, so delete the separate `sr-only` copy).
- Baseline at `y = 0.42 * height`, a 1 px hairline at 22% ink (`data-rule`) across the full width.
- Buckets: `priceBuckets(listings, bucketStep(price))` as today. Dot radius: `scaleSqrt` over counts →
  `[0.012 * width, 0.04 * width]` px (6 → 20 px at 500 px wide). Fill ink, opacity 0.72 (0.22 when another bucket is
  hovered). This car: an ink ring, `r = 0.024 * width + 2`, stroke 2 px, no fill.
- The car's label (price in `font-mono` 13u / 11 px floor, then the verdict word in `.detail-label`): bottom-anchored
  at `baseline − rMax − 8px`, centred on the ring, clamped so it never leaves the box.
- Ticks: `x.ticks(5)`, labels at `baseline + rMax + 12px`, formatted `formatPrice`.
- **Stat row** at the bottom of the chart box: a 4-column grid, a 1 px hairline at 22% ink above it, 16 px padding-top.
  Columns: `Lowest`, `Median`, `Highest` (comparable asking prices; median = the middle value of the sorted prices, or
  the mean of the two middle values) and `Listings` (`listings.length`). Label: `.detail-label`; value: `font-mono`,
  `max(15px, calc(20 * var(--u)))`, ink.
- Caption: `Larger dots mean more listings at that price. Illustrative data.`

#### Tab 2, "Price vs mileage" (the scatter)

- Takeaway: `mileageTakeaway(car.priceUsd, car.mileageMi, trendLine(listings))`.
- x: mileage, domain `[0, max(mileageMi, all listings) * 1.05]`, 4 ticks labelled `${Math.round(v / 1000)}k mi`.
  y: asking price, domain `[min * 0.94, max * 1.06]`, 4 ticks labelled `$${Math.round(v / 1000)}k`.
- Horizontal gridlines at the y ticks: 1 px at 12% ink. Axis titles, `.detail-label`: `Mileage` right-aligned under
  the x axis, `Asking price` left-aligned above the y axis.
- Points r 4 px, ink, opacity 0.55. Trend line: dashed `4 4`, 1.5 px, ink at 45%. This car: ink ring r 9, stroke 2.
- Caption: `Illustrative data; a straight trend line fit to the comparables above.`

#### Tab 3, "Price history" (the line)

- Takeaway: `historyTakeaway(car.chassis, history)`.
- x: quarter index; tick labels at index 0, 10 and the last, showing the quarter string (e.g. `2021-Q4`).
  y: 4 ticks labelled `$${Math.round(v / 1000)}k`; gridlines as in tab 2.
- Line 2 px ink; points r 3 px (the last one r 5 px). This car's price: a dashed `5 5` 1.5 px line at 50% ink across
  the plot, with a right-aligned label above its right end: `This car` in `.detail-label` + the price in `font-mono`.
- Keep 6g's line draw: the clip `rect` with `data-rule` scaled in with `scaleX` (an allowed transform).
- Caption: `Median of ${listings.length} comparable listings' asking price by quarter. Illustrative data.`

### Hover and keyboard (the "hard to interact" fix)

- **Pointer:** one transparent `<rect>` covering each chart's plot area takes `pointermove` / `pointerleave`
  (`pointer-events: all`; the marks themselves get `pointer-events: none`). On move, find the target:
  - strip: the bucket nearest in x, if within half the spacing to its neighbour (at least 24 px either side);
  - scatter: the point nearest by Euclidean distance in px, if within 40 px;
  - history: the quarter nearest in x (always one), plus a 1 px vertical guide at 30% ink at that x.
  Highlight the target (strip: the others fade to 0.22; scatter and history: the target's r → 6 px, opacity 1) and
  show the tooltip. `pointerleave` clears it. Every hover target is therefore ≥ 24 × 24 CSS px (WCAG 2.5.8).
- **Tooltip:** HTML, `var(--color-paper)` background, 1 px inset ring at 16% ink, the existing soft shadow, 12u text
  (11 px floor), `white-space: nowrap`, offset 12 px from the target and flipped to the other side past the plot's
  midpoint. Content: strip `$X – $Y` + `N listing(s)`; scatter `marketplaceName(...)`, then
  `year · formatMiles · formatPrice`; history `quarter · formatPrice`. **Keep one `aria-live="polite"` region per
  chart mounted at all times** and write the tooltip text into it (6h found `role="status"` mounting with its content
  is announced unreliably).
- **Keyboard:** keep 6g/6h's roving `tabIndex` on the marks (one Tab stop per chart), `role="img"` and `aria-label`
  on each mark, arrows to move (with `preventDefault`), the same highlight and tooltip on focus, and Escape to blur
  **with `event.stopPropagation()`** (6h: without it Escape left the whole page). The SVG is
  `role="group"` with the existing labels, never `aria-hidden`. The 2 px ink focus ring on circles stays
  (`svg[data-mark-group] circle:focus-visible` in `globals.css`).
- Focus-follow (6h, `onFocusIn` in `Detail.tsx`) already scrolls the page to any focused control; the new tabs inside
  `price-module` get that for free. Don't add another.

### Motion

- Section arrival is unchanged in kind: `prepareChartReveal` on the `price-module` element, triggered at 80%
  (`revealOnce(el, 0.8, play)`): rules draw with M8 (`scaleX`, 1.2 s, `reveal`, stagger 0.06), strip dots grow
  (`scale` 0 → 1, 0.6 s, `reveal`, stagger 0.02), everything else rises with M1 timing. Only the default tab
  (Price spread) is mounted at that moment, so only it reveals; other tabs appear instantly when chosen.
- No other new motion. Reduced motion: the existing 0.3 s fades (and `clearProps: "opacity"`, as 6g needed).
- Allowed properties only: `transform`, `opacity` (and the M8 clip `scaleX`). Never animate `r`, `width`, `top`.

### Remove

- `hoverMid` / `setHoverMid` state in `Detail.tsx` and the props on the chart components; the strip ↔ scatter filter in
  `PriceMore`; `useChartScale` and `W`; the second card. Keep `DataTable`, `markRise`, `dotGrow`, `Rule`, `Caption`,
  `Takeaway` where they still fit.

## How to work (Impeccable and the other skills, in this order)

1. **State the plan and wait for a go** (the user's standing rule). Reading files is fine before that.
2. **Impeccable context:** from the project root run
   `sh .claude/skills/impeccable/scripts/impeccable context --target components/detail/PriceCharts.tsx`
   (Windows: `.claude\skills\impeccable\scripts\impeccable.cmd context --target components/detail/PriceCharts.tsx`;
   the launcher lost its exec bit in git, hence `sh`). Follow its directives. This is a **refinement inside an
   established world** (`DESIGN.md` is the authority), so load `reference/layout.md` (the spatial thesis: a two-column
   magazine spread, title column left empty on purpose) and **read `reference/craft-floor.md` immediately before the
   first UI edit**. Don't open `new-work.md`: the visual world isn't changing.
3. **`dataviz` skill** before writing chart code: apply its mark specs and interaction rules within the theme tokens
   (achromatic; "this car" is always an ink ring, never colour; the verdict is always words).
4. Build in this order, checking each in the browser before moving on: blocks and title → the card shell and tabs →
   tab 1 → tab 2 → tab 3 → hover and keyboard → reveal.
5. **Verify once** (no build-measure-tweak loops):
   - `npm run check` (typecheck, lint, build, 6 smoke tests; in a claude.ai cloud session, run the smoke tests with a
     local gitignored Playwright config that points at `/opt/pw-browsers/chromium` with long timeouts, as 6h did).
   - `.cache/detail-walk.mjs --at 10,11` for `porsche-930`, `peugeot-205-cj` (fewest buckets, $500 steps) and
     `jaguar-xj220` (densest, $5,000 steps) at 1440 × 960, 1024 × 640 and 1920 × 1080, figma theme. Each tab must fit
     its card with nothing clipped, and the title column must sit at x 11165 with 24u to the slideshow.
   - Poll the DOM (not screenshots) for: every hover target ≥ 24 × 24 px; the tab list's ARIA state after
     ArrowRight / End / Home; Escape on a focused mark leaves the page open; the page does **not** step sections while
     a tab has focus and an arrow is pressed.
   - `page.locator("[data-detail]").ariaSnapshot()`: the section reads as `heading "Price comparison"`, the price, the
     comparison line, the tab list, the active panel and the data table, in that order.
6. **Audit protocol** (CLAUDE.md): `frontend-design` self-critique; `/impeccable critique` (its two isolated
   sub-agents) and `/impeccable audit`, fixing every P0 and P1; `sh .claude/skills/impeccable/scripts/impeccable
   detect --json components/detail`; `web-design-guidelines` on `components/detail/PriceCharts.tsx`; `break-ui` with
   the Peugeot, the Jaguar and the car with the fewest listings. Then ask the user to run `/review-animations` (it sets
   `disable-model-invocation`, so you can't).
7. **Record it:** `docs/overhaul.md` (step 5's "Section D: price comparison" rewritten to the tabs, the linked hover
   marked dropped, and a "7a status" block), a row in `docs/PRD.md`'s decision log (2026-10-11: price module in three
   tabs, linked hover dropped, title column), `DESIGN.md`'s Price card and Price strip entries, and `docs/handoff.md`.

## Working rules (binding)

- Do only this shot. If anything here seems wrong or ambiguous, ask instead of improvising.
- Every number above is exact. If one doesn't work in the browser, say which, show the measurement, and propose the
  replacement before changing it.
- Don't commit or push unless the user asks; when they do, push to `main`.
- Say what you did not test. Never quote frame rates from a GPU-less cloud session.
- **Gate:** the three tabs work by mouse, keyboard and screen reader for all 13 cars; nothing overflows at 1024 × 640;
  the report states whether the fallback enlargement was needed, with the chart-box measurements;
  every P0/P1 fixed; `/review-animations` Approve; the user's review.
