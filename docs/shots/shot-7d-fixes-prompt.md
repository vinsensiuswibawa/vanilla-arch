# Shot 7d prompt: price header, one image reveal, slideshow length, section E spacing

Paste everything below the line into a fresh session (Sonnet). It's targeted on purpose: read only what's listed and
change only what's listed.

---

Shot 7d on Arcade's car detail page (`main`, after 7c and the price-module follow-ups at 77252e5). Five fixes.
**Read only:** `CLAUDE.md`, `lib/detail-motion.ts`, `lib/detail-fx.ts` (`imageReveal`), `lib/detail-layout.ts`,
`components/detail/PriceCharts.tsx` (from `InfoButton` to the end of `PriceModule`'s JSX), the `.price-tab` /
`.price-info*` rules in `app/globals.css`, and the parts of `components/detail/Detail.tsx` found by the searches
named below. Don't read the plan, the storyboard or the PRD. State your plan in six lines, wait for a go, then build.

**GSAP trap (6g, binding):** an element GSAP animates must get every further transform through GSAP, never through
`style.transform`.

## 1. Price module header (`PriceCharts.tsx`, `PriceModule`)

**1a. Dark block.** Wrap the price line and the claim line (everything from the `<div data-mark className="relative
flex flex-wrap items-baseline"` through the source `<p>`; the verdict and its hairline stay above, on the card) in one
`<div data-mark>` with `background: var(--color-ink)`, `color: var(--color-paper)`, padding
`max(16px, calc(20 * var(--u)))`, `marginTop: u(16)`. Inside it:
- The price `<span>` on its own line. The claim goes below it with **`marginTop: 12px`** (literal px, as with
  `MAKE_GAP_PX`), so drop the flex-wrap row and stack the two.
- The claim text becomes `cheaper than {n}% of vehicles across {count} comparable listings`, followed by the info
  button (1b). The color is `color-mix(in srgb, var(--color-paper) 80%, transparent)`, not `ink(75)`.
- **Delete** the visible source `<p>` (`{listings.length} listings · …`) and the `InfoNote` paragraph. Both move
  into the tooltip.
- Inside the block, focus rings are 2px **paper** (`outline-color: var(--color-paper)`); a 2px ink ring is invisible
  on ink.

**1b. Info button with a hover tooltip.** Replace the "How we count" text button with an icon button: a
`max(16px, calc(16 * var(--u)))` circle with a 1px border in `currentColor`, an italic serif "i" centered inside it,
and `aria-label="About this comparison"`. Keep `.price-info::after` for the 44px hit area. Its tooltip is an
absolutely positioned `<span role="tooltip" id=…>` (the button gets `aria-describedby`), anchored under the button,
left-aligned to it, `width: max(240px, calc(300 * var(--u)))`, on `var(--color-paper)` with `var(--color-ink)` text,
the 12px label size, `line-height: 1.4`, padding 12px, `z-index: 20`. Text (built in code, not hard-coded):

> {count} listings · {marketplaces joined with `new Intl.ListFormat("en", { type: "conjunction" })`}. Listings of the
> same model, by asking price. “Cheaper than” is the share asking more than this car. Illustrative data.

(For the TR6 this reads "45 listings · Torquewell, Halden, and Lot Twelve. …".)

The tooltip shows on `:hover` of the button (hover-capable pointers only), on `:focus-visible`, and while
`aria-expanded="true"` (a click toggles it, for touch; keep the existing outside-pointerdown close and the Escape
handler with `stopPropagation`). It enters with the existing `price-info-in` keyframes (reduced motion:
`price-info-fade`). Overlaying the tabs is fine while it's open; it's transient.

**1c. Tabs (`ref={tablist}`).** Two defects:
- Uneven spacing: the labels sit at a fixed `gap: u(32)` and stop about 50u short of the divider's end. Change the
  tablist to `justify-content: space-between` (drop `gap`): the first label sits flush left, the last flush right,
  with equal gaps between them.
- The indicator overruns into the next tab: `place()` measures `offsetWidth` before the webfont swaps in, and the
  `ResizeObserver` only watches the tablist, whose width doesn't change when the font does. Observe **each tab
  button** as well (`tabRefs.current.forEach((b) => b && observer.observe(b))`) and call
  `place(tabNow.current, false)` once more in `document.fonts.ready.then(…)` (guard against unmount). The indicator
  must start and end exactly at its label's text edges.

## 2. One image reveal everywhere, plus a 5% zoom-out

The page has three behaviours today: A1 reveals in the entry timeline; A3, C band, S tall and S third reveal through
`wireImageReveal` when their **right** edge reaches 100% (fully on screen, so it reads as late); A2, B photo and
S swap don't reveal at all, and the B photo's first wipe (M5) starts as it enters, which also reads as a late reveal.

**2a. Trigger.** Set `effect.imageReveal.trigger` from `0.9` to **`0.8`**. In `wireImageReveal`, replace
`revealOnce(frame, 1, …, "right")` with `revealOnce(frame, effect.imageReveal.trigger, …)` (left edge at 80% of the
viewport). Update the comment there: the user reversed the 2026-10-10 "fully in frame" call in 7d because it read as
late.

**2b. Swap slots reveal too.** In `SwapSlot`, wrap the existing inner `<div …data-swap-parallax…>` in
`<div data-reveal-inner className="absolute inset-0">`. Then wire `wireImageReveal(slotRoot, revealInner)` for
`a2`, `b-photo` and `s-swap`: the frame is the slot root `[data-block=id]` (its `clip-path` composes with 7c's M14
`style.transform`, since clip-path isn't a transform), and the inner is `[data-reveal-inner]` (GSAP-owned, separate
from the M6 element that `parallax()` writes). Then make the wipe wait for the reveal: `stepSwap(bPhotoSwap)` and
`stepSwap(sSwap)` become `stepSwap(…, 0.6, 0.25)`. A2 keeps `(0.25, 0.25)`.

**2c. Zoom-out.** In `lib/detail-motion.ts`, add `zoomFrom: 1.05, zoomDelay: 0.6, zoomDuration: 1.4` to
`imageReveal`. In `imageReveal()` (`lib/detail-fx.ts`), add to the same timeline
`tl.fromTo(inner, { scale: effect.imageReveal.zoomFrom }, { scale: 1, duration: effect.imageReveal.zoomDuration, ease: effect.imageReveal.ease, immediateRender: true }, effect.imageReveal.zoomDelay)`.
The photo is 5% large while the clip opens and settles after it, ending at 2.0 s. Also add `scale: zoomFrom` to the
non-reduced `gsap.set(inner, …)` in `wireImageReveal`, so nothing pops before the trigger. Reduced motion: no zoom
(the reduced branch already returns early). A1 gets this automatically through the entry timeline. Update M4's row in
`docs/overhaul.md` step 2 to match ("…then settles from 1.05 to 1 over 1.4 s, starting at 0.6 s").

## 3. Slideshow: shorter, and no repeated photos

**3a. Remove the empty space (`lib/detail-layout.ts`).** The last photo and "See all" end at 13008u, while the panel
runs to 13400u. End the panel 12u after them, at 13020u: everything from section E onward moves left by
**Δ = 380u**.

| Item | Was | Becomes |
| --- | --- | --- |
| `slideshow` w | 2100 | 1720 |
| `field-e` x | 13400 | 13020 |
| `give-it` x | 13995 | 13615 − 80 (item 4) = **13535** |
| `new-home` x, y | 14220, 770 | 13840 − 80 = **13760**, **720** (item 4) |
| `inquire` | x 14950 | see item 4 |
| `ENQUIRY` | 13770 | 13390 |
| `TRACK` | 15210 | 14830 |
| `FRAMES` [12], [13] | 13172, 13770 | 12792, 13390 |

Also replace the literal `const total = 15210 * u;` in `Detail.tsx`'s `layout()` with `TRACK * u` (import it).
`cueRanges`' T3 shifts with both its ends, so its length doesn't change. If `.cache/detail-walk.mjs` exists, update
its `FRAMES` copy the same way.

**3b. No photo appears twice on the page.** 8 of the 13 cars have 6 photos (the gallery popup shows those same
photos), but the page has 10 to 14 slots, so `photoGroup`'s wrap-around repeats them. Replace the fixed slot
arithmetic (search `const swapCount = pool >= 9`) with a unique allocation over
`ordered = [firstPhoto, ...car.photos.filter((p) => p !== firstPhoto)]`, filled in this priority order until the
photos run out:

1. A1 (`firstPhoto`), A2 layer 1, B layer 1, C band, S tall, S third, S swap layer 1, A3;
2. then extra swap layers, in turn: A2 layer 2, B layer 2, S swap layer 2, A2 layer 3, B layer 3, S swap layer 3.

A slot with no photo isn't rendered (`SwapSlot` already returns null; guard `sThirdPhoto` / `sTallPhoto` /
`a3Photo` as today). A swap slot with one photo just doesn't swap (`buildSwapTimelines` already returns `[]`).
Result: a 6-photo car shows A1, A2, B, C band, S tall and S third, with no S swap; 7 adds a static S swap; 8 adds A3;
14 (the M5) fills every layer. Delete the comment block that justified the repeats and `photoGroup` if nothing else
uses it. Report the per-car slot fill.

## 4. Section E spacing

- "Give it" and "A new home": the x/y in the 3a table (both 80u left, "A new home" 50u up).
- "Inquire about this car here →": keep a 12u right margin. Make the button `text-right` and anchor its right edge at
  `TRACK − 12` (x = 14830 − 12 − 240 = **14578**). Then measure at 1885 × 1054 (the user's window) with the track at
  its end: the text's right edge (a `Range` over the button's text, `getBoundingClientRect().right`) must equal
  `document.documentElement.clientWidth − 12u` (±1 px). If it still touches the edge, the cause is `travel` vs. the
  viewport width (see the scrollbar comment in `layout()`). Report the numbers before widening anything.

## 5. "Scroll for more"

`scroll-cue`: `bottom: BAR + 24` → `bottom: BAR + 12`.

## Verify once

- `npm run check` (cloud session: the local Playwright config with the bundled Chromium and long timeouts).
- Walk triumph-tr6 and bmw-m5-e39 at frames 2, 5, 9, 10, 11, 12, 13, 14, at 1440 × 960 and 1024 × 640. Confirm:
  - the dark header block shows the price, then 12px, then the claim and the icon, and hovering the icon shows the
    tooltip with the "and" list;
  - the tab indicator's left and right equal its label's text rect (±1 px) after fonts load, and the last label
    ends at the divider's right edge;
  - B photo and the slideshow photos clip-reveal at a left edge of 80%, and the inner `scale` reads 1 at 2.0 s;
  - no photo `src` repeats within the page (log the list per car);
  - the slideshow panel's right edge equals S third's right edge + 12u;
  - frame 14 shows Give it / A new home at their new spots and the inquire margin.
- Reduced motion: reveals are fades, no zoom.
- Ask the user to run `/review-animations` on the reveal and zoom. Don't commit unless asked; then push to `main`.
  Add a short "7d status" block to `docs/overhaul.md`.
