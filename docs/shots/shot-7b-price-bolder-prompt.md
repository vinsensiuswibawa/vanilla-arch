# Shot 7b prompt: section D's price comparison, bolder (title first, verdict as headline, tab motion)

Paste everything below the line into the same machine's next session (Sonnet), after shot 7a. Self-contained.

---

Shot 7a rebuilt Arcade's section D price comparison into one beige card with three tabs (`Price spread`,
`Price vs mileage`, `Price history`) and a narrow right-hand title column. The user reviewed it: the design reads
**weak**. This session is **shot 7b only**: make that module bolder with Impeccable's `bolder` command, move the title
so it is read **before** the data, and add motion when switching tabs. Nothing else on the page changes.

## Read first

1. `CLAUDE.md`, `AGENTS.md`, `DESIGN.md` (north star "The Stuttgart Brochure"; the figma theme is the system).
2. `docs/shots/shot-7a-price-tabs-prompt.md` (what 7a was asked to build) and **your own 7a code**: the price module
   in `components/detail/PriceCharts.tsx`, its markup in `components/detail/Detail.tsx`, and the `price-module` /
   `price-title` blocks in `lib/detail-layout.ts`. Use the real names you find there; the names below are 7a's
   brief's names.
3. `docs/overhaul.md` step 2 (motion vocabulary) and the 6h and 7a status blocks. 6h fixed real bugs in this code
   (focusable marks inside `aria-hidden`, Escape leaking to the page, contrast on the beige card, overflow at
   1024 × 640, SVG letterboxing); keep them fixed.

## What the user saw, and what's wrong with it

At 1440 × 960 (Mazda MX-5, $46,000): a 56u price, a small comparison line, plain tabs, a one-sentence takeaway, a
small dot strip floating in the middle with empty bands of ~200 px above and below it, a stat row, and a 12u
"PRICE COMPARISON" alone in a separate column to the right. Specific defects:

- **The title is read last.** The page scrolls left to right, so a title to the right of the card comes after the data.
- **No hierarchy.** The answer the visitor came for (is the price fair?) is a 12u word above the ring.
- **Dead space.** The strip is vertically centred in a tall box, leaving empty bands.
- **Overlapping tick labels:** `$38,0$40,000`, where two ticks fall too close together.

## The direction (approved by the user)

Impeccable's rule for `bolder`: **one decisive move, in the system's own vocabulary, with everything around it
quieter**. The page's strongest move is huge uppercase Satoshi display type (the car name at 160u, section B's headline
at 106u). Section D opts out of it. The decisive move: **the verdict becomes the section's headline**.

### 1. Title first, above the card (nothing else moves)

The car, the camera, the price stop (9726), the price panel (x 10553, w 747) and the card's x and width (x 10577,
w 564) all stay. Only the title moves, from its right-hand column to directly above the card, and the card starts
lower by the title's height plus a gap:

| Block (`lib/detail-layout.ts`) | Now (7a) | 7b |
| --- | --- | --- |
| `price-title` | x 11165, y 56, w 111, h 24 | **x 10577, y 24, w 564, h 16** |
| `price-module` | x 10577, y 24, w 564, h `"inset"` | **x 10577, y 52, w 564**, height in the JSX: `calc(100% - calc(var(--u) * 76))` (24 top + 12 title + 16 gap + 24 bottom margin) |

- The title keeps 7a's exact style (Staatliches, `max(11px, var(--type-label))`, `line-height: 1`, label tracking and
  case, the section's `h2`, M1 reveal). It stays **before** the card in the DOM.
- The right-hand column (11165 → 11276) goes back to plain white panel. That's intended; the user asked for nothing
  else to change.
- `cueRanges` uses the module's x, which is unchanged, so the camera is unchanged. Don't touch `STOPS`, `P2`, `TRACK`.

### 2. The card's header: verdict as headline

Inside the card (padding stays `max(20px, calc(32 * var(--u)))`), replace the 56u price block with this, top to bottom:

| # | Element | Spec |
| --- | --- | --- |
| 1 | **Verdict headline** | `VERDICT_LABEL[verdictFor(price, prices)]` (`Good value` / `Fair price` / `Above market`). `font-family: var(--t-display)`, `font-size: max(32px, calc(64 * var(--u)))`, `line-height: var(--display-leading)` (0.95), `letter-spacing: var(--display-tracking)`, `text-transform: var(--display-case)` (uppercase), weight 400, ink 100%. Wraps by words if needed (never mid-word). Rendered with the page's char-rise structure (an `sr-only` copy of the text plus `aria-hidden` per-word `nowrap` spans of per-character `inline-block` spans, exactly like `charRiseLine` in `Detail.tsx`) so it can reveal with M2. |
| 2 | **Price line** | gap 16u. One flex row, `align-items: baseline`, `flex-wrap: wrap`, column gap 12u: the price in `font-mono`, `max(20px, calc(32 * var(--u)))`, ink; then `cheaper than ${Math.round(cheaperThanShare(price, prices) * 100)}% of ${listings.length} comparable listings` in `max(13px, var(--type-body))`, ink at 75%. (`cheaperThanShare` is in `lib/comparables.ts`.) |
| 3 | Comparison line | gap 8u; unchanged from 7a (`comparisonLine`, 12u / 12 px floor, 75% ink). |
| 4 | Tabs | gap 32u (was 24u); unchanged from 7a except the indicator (see Motion). |
| 5 | Active panel | gap 24u; unchanged structure. |

Everything else in the card stays at its 7a size or gets quieter; nothing else gets louder. Remove the price label
and verdict word that sat above the ring in the strip (the headline says it now).

### 3. Tab 1, "Price spread": fill the space with meaning

- **Takeaway** (replaces `stripSummary`, which the header now covers):
  `Half of the comparable listings ask between ${formatPrice(p25)} and ${formatPrice(p75)}.` with p25/p75 the 25th and
  75th percentiles of the comparables' prices (linear interpolation on the sorted prices). Keep `stripSummary` as an
  `sr-only` sentence directly after the price line (header item 2), so screen readers still hear the full sentence once.
- **Strip box:** `flex: 1; min-height: max(200px, calc(200 * var(--u)))`. Baseline at `0.62 * height`, full width,
  1 px at 22% ink (`data-rule`).
- **Dots:** radius `scaleSqrt` over bucket counts → `[0.016 * width, 0.055 * width]` px (8 → 27.5 px at 500 px).
  Fill ink, opacity 0.72 (0.22 when another bucket is hovered).
- **This car, as a pin:** an ink ring at the car's price on the baseline (`r = 0.03 * width + 2`, stroke 2 px, no
  fill), and a 2 px ink line rising from the ring's top to 28 px below the box's top. At the line's top, centred on it
  and clamped inside the box: `This car` in `.detail-label` over the price in `font-mono` 13u (11 px floor). The pin
  gives the vertical space a job instead of leaving it empty.
- **Ticks:** `x.ticks(4)`, labels at `baseline + rMax + 12px`. After computing them, drop any tick whose label would
  start less than 8 px after the previous label ends (measure with the label's `getBoundingClientRect` after first
  render, or estimate at `0.62em` per character). Clamp the first and last labels inside the box. This fixes `$38,0$40,000`.
- **Stat row:** stays at the bottom of the panel (4 columns, hairline above, 16 px padding-top), values bolder:
  `font-mono`, `max(20px, calc(32 * var(--u)))`. Labels unchanged (`.detail-label`).
- Caption unchanged.

Tabs 2 and 3 keep 7a's charts; apply the same tick-overlap rule to their x axes.

### 4. Motion: switching tabs

The user asked for motion on tab switches. It is a new effect, **M13 "Tab switch"**: add its numbers to
`lib/detail-motion.ts` (`effect.tabSwitch`) and a row to `docs/overhaul.md` step 2's effects table, as a user-approved
addition. All of it is `transform` and `opacity` only, and every value is below:

| Part | Values |
| --- | --- |
| Indicator | One 2 px ink bar under the tab row, absolutely positioned, `width: 1px`, `transform-origin: left`, moved with GSAP to the active tab: `x` = the tab's left offset in px, `scaleX` = the tab's width in px. 0.3 s, `ease.reveal` (power3.out), `overwrite: "auto"` so a new click retargets mid-flight. Replaces 7a's per-tab bar. |
| Incoming panel | The outgoing panel hides instantly (no exit animation). The incoming panel's takeaway, chart box and caption (and tab 1's stat row) go from `opacity: 0, y: 8` to `opacity: 1, y: 0`, 0.3 s, `ease.reveal`, stagger 0.05 s. |
| Marks | Strip dots: `opacity 0 → 1` and `scale 0.85 → 1` (never from 0), 0.3 s, `ease.reveal`, stagger 0.012 s, left to right. Scatter points: `opacity 0 → 1`, 0.3 s, one tween, starting 0.05 s in. History: the line's clip `rect` `scaleX 0 → 1`, 0.3 s, `ease.reveal`, then its points `opacity 0 → 1` over 0.2 s. |
| Interruption | Before starting a switch, `gsap.killTweensOf` every element the previous switch animated, and set them to their end state, so rapid clicks never leave half-faded content. |
| Keyboard | Arrow / Home / End switches (keyboard-initiated) are **instant**: indicator `gsap.set`, no content motion (`/review-animations`: no animation on keyboard-initiated actions). Pointer clicks animate. |
| Reduced motion | Indicator moves instantly; incoming content `opacity 0 → 1` over `reduced.fade` (0.3 s), no `y`, no scale. |

The section's first reveal (7a's `prepareChartReveal` at 80%) stays, plus **M2 on the verdict headline**:
`charRise` with the headline's character spans, started with the rest of the reveal.

## How to work

1. **State the plan and wait for a go.**
2. **Impeccable context:** `sh .claude/skills/impeccable/scripts/impeccable context --target components/detail/PriceCharts.tsx`
   (Windows: `.claude\skills\impeccable\scripts\impeccable.cmd context --target components/detail/PriceCharts.tsx`).
3. **Run Impeccable's `bolder` on the price module only**: load `.claude/skills/impeccable/reference/bolder.md` and
   follow it with the direction above as its answer (target: `components/detail/PriceCharts.tsx` and the price
   module's markup; everything else untouched). Apply its **skeleton test** before building: strip the copy out of
   the planned card; the verdict headline, the pin and the stat row must still read as "the answer, where it sits,
   the range". **Read `reference/craft-floor.md` immediately before the first edit.** Don't add colours, fonts,
   radii or shadows; if the direction seems to need one, stop and ask the user.
4. For the motion, load the `animate` skill and follow its order (purpose, property, curve, duration, interruption,
   exit) with the M13 values above. Don't invent other values.
5. Build in this order and check each in the browser: title move → header → tab 1 → tick-overlap rule (all tabs)
   → indicator → panel switch motion → reveal.
6. **Verify once:**
   - `npm run check` (cloud sessions: the local Playwright config with the bundled Chromium, as 6h did).
   - `.cache/detail-walk.mjs --at 10,11` for `mazda-mx-5-nc` (the screenshot the user reviewed), `peugeot-205-cj`,
     `jaguar-xj220` and `porsche-930` at 1440 × 960, 1024 × 640 and 1920 × 1080: the title sits above the card's
     top-left; the verdict fits (one or two lines) at every size; no tick labels overlap; nothing overflows the card.
   - Poll the DOM: the tab indicator's transform matches the active tab after a click, after three rapid clicks, and
     after ArrowRight; keyboard switches leave no running tweens; the page doesn't step sections while a tab has focus.
   - `page.locator("[data-detail]").ariaSnapshot()`: `heading "Price comparison"`, then the verdict, the price line
     (with the `stripSummary` sentence), the comparison line, the tab list, the active panel, the data table.
7. **Audit:** `frontend-design` self-critique; `/impeccable critique` (two isolated sub-agents) and `/impeccable
   audit`, fixing every P0 and P1; `sh .claude/skills/impeccable/scripts/impeccable detect --json components/detail`;
   then `/impeccable polish` on the price module only, as `bolder.md` hands off. Ask the user to run
   `/review-animations` on M13 and the headline reveal (you can't trigger it).
8. **Record:** a "7b status" block and the M13 row in `docs/overhaul.md`; a PRD decision-log row (2026-10-11: price
   module bolder, verdict as headline, title above the card, M13 tab switch); `DESIGN.md`'s Price card / Price strip
   entries; `docs/handoff.md`.

## Rules

- Only this shot; ask instead of improvising. Every number above is exact; if one fails in the browser, show the
  measurement and propose the replacement before changing it.
- Don't commit or push unless the user asks (then push to `main`).
- Say what you didn't test; never quote frame rates from a GPU-less cloud session.
- **Gate:** the title reads first; the verdict headline carries the section; no dead bands or overlapping labels at
  1440 × 960, 1024 × 640 and 1920 × 1080; tab switching animates by pointer, is instant by keyboard and interruptible;
  every P0/P1 fixed; `/review-animations` Approve; the user's review.
