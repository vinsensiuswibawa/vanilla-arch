# Shot 7c prompt: parallax, the about paragraph, section C alignment

Paste below the line into a fresh session (Sonnet). Targeted on purpose: read only what's listed, change only
what's listed.

---

Shot 7c on Arcade's car detail page (`main`, after 7b). Four small changes. **Read only:** `CLAUDE.md`,
`docs/overhaul.md` step 2 (the M6/M7 rows and "Allowed properties"), `lib/detail-motion.ts`, `lib/detail-fx.ts`
(`parallax`, `depthDrift`), `lib/detail-layout.ts`, and in `components/detail/Detail.tsx` the parts found by the
searches named below. Don't re-read the whole plan or storyboard. State your plan in five lines, wait for a go,
then build.

**GSAP trap (6g, binding):** elements GSAP already animates (entry or reveal tweens) must get their parallax
offset through GSAP too (`gsap.quickSetter(el, "x", "px")`), never by writing `style.transform`. Otherwise one write
erases the other. Elements nothing else animates can take `style.transform` directly, like `parallax()` does today.

## 1. Parallax (new effect M14 "Frame drift", plus M6 on more photos and M7 wired)

Add to `effect` in `lib/detail-motion.ts`:
`frameDrift: { k: 0.12 }` and `depthDrift: { name: 0.82, make: 0.88, jump: 0.94, giveIt: 0.85, newHome: 1.1 }`
(replacing `depthDrift: { speed: 0.9 }`). Every offset is computed per tick inside `tick` in `Detail.tsx`, from
`x` (the lagged track position in px, already computed there) and `u`. All offsets are **0 when the element is at
its resting position**, so no composition changes at any keyboard stop. All are skipped (and left at 0) under
reduced motion. Compute an element only while its block is within one viewport of the screen.

| # | Element (search in `Detail.tsx`) | Kind | Offset (px) | Notes |
| --- | --- | --- | --- | --- |
| 1a | Hero name `h2` (`ref={name}`) | M7 depth drift | `x * (1 - 0.82)` | Behind layer. GSAP animates its char spans, not the `h2`, but use `quickSetter` anyway. |
| 1b | Make · year (`ref={make}`) | M7 | `x * (1 - 0.88)` | GSAP-owned (`lineRise` yPercent): **`quickSetter` required**. |
| 1c | Jump to specs (`ref={jumpBtn}`) | M7 | `x * (1 - 0.94)` | GSAP-owned: `quickSetter`. Front layer. Compute only while `x < 1440 * u`. |
| 2a | A2 swap slot (`SwapSlot id="a2"`, its root `[data-block="a2"]`) | M14 frame drift | `-(x - xc) * 0.12`, `xc = (1794 + 265) * u - vw / 2` | Not GSAP-owned: `style.transform = translate3d(...)`. It slides over A1 faster than the page. Keep `stepSwap`'s maths on the nominal block x (don't add the offset). |
| 2b | A1 photo (`ref={a1Inner}`) | M6 inner drift | `parallax(wrapper, t)` | Wrap `a1Inner` in a new `<div data-parallax-inner className="absolute top-0 h-full" style={{ left: "-6%", width: "112%" }}>`. The entry tween keeps `a1Inner`; `parallax()` writes on the wrapper. `t = clamp01((vw - right) / (vw + width))` with the A1 block's screen left/right, exactly like the B photo's existing code (search `bPhotoParallaxEl`). |
| 3 | B photo (`SwapSlot id="b-photo"`) | M14 on the root, plus its existing M6 | `-(x - xc) * 0.12`, `xc = (6008 + 240) * u - vw / 2` | Root `[data-block="b-photo"]` via `style.transform`. M6 inside stays. |
| 4a | Slideshow tall photo (`ref={sTallInner}`) | M6 | as 2b | Same wrapper pattern (`sTallInner` carries M4's reveal tween). |
| 4b | Slideshow swap slot (`SwapSlot id="s-swap"`) | M14 | `-(x - xc) * 0.12`, `xc = (11780 + 232.5) * u - vw / 2` | Root via `style.transform`. |
| 4c | Slideshow third photo (`ref={sThirdInner}`) | M6 | as 2b | Same wrapper pattern. |
| 5a | "Give it" (`ref={giveIt}`) | M7 | `(x - travel) * (1 - 0.85)` | GSAP-owned (M9 `sideEntrance` xPercent): **`quickSetter`**. Behind layer. 0 at the track's end. |
| 5b | "A new home" (`ref={newHome}`) | M7 | `(x - travel) * (1 - 1.1)` | Same; it drifts opposite to "Give it", echoing M9's two sides. |

- Use one `quickSetter` per GSAP-owned element, created once after the elements exist, not per tick.
- Add M14 to step 2's effects table in `docs/overhaul.md`
  (`Frame drift | small overlapping photos move at 1.12× the page | -(x - xc) × 0.12 | scroll-tied | A2, B photo, slideshow swap`),
  and mark M7 as wired (hero type, Give it / A new home).
- Check that nothing slides under the back pill or off the 24u margins at the keyboard stops (the offsets are 0
  there by construction).

## 2. The about paragraph: 50% wider, 4–5 lines

`lib/detail-layout.ts`, block `about-body`: `w: 542` → **`w: 813`** (right edge 5645u, 363u clear of the B photo at
6008). Nothing else changes; it's bottom-anchored with `height: auto` (6h). Check at 1440 × 960 that every car's
`about` text renders in **4 or 5 lines** (count `splitLines` results, or measure `offsetHeight / lineHeight`). If a
car exceeds 5, report which cars and their line counts; don't change the font size.

## 3. Section C

- **3a. The equipment button appears late.** It's revealed as `extra` in `wireSpecTable(tableB.current,
  live([cOverlay.current]))`, so it rises last in the 15-item stagger (about 1.1 s late), from `yPercent: 100`
  inside its own pill. That's what reads as "out of alignment". Change: call `wireSpecTable(tableB.current)` with no
  `extra`; set the button's start state to `opacity: 0` (reduced motion: the same); and in table B's `revealOnce`
  callback, play `chromeFade([cOverlay.current])` (M12: 0.6 s, `fade`) **at time 0**, alongside the first row and
  the rule draw. The button never moves, only fades.
- **3b. "Listed car specifications" in Staatliches.** The `h2` with `ref={cLabel}`: replace `className="detail-label
  absolute overflow-hidden"` with `className="font-condensed absolute overflow-hidden"`, and give it the "About the
  car" label's style (search `ref={aboutLabel}`): `fontSize: "max(11px, var(--type-label))"`, `lineHeight: 1`,
  `letterSpacing: "var(--label-tracking)"`, `textTransform: "var(--label-case)"`, plus `color: "var(--color-paper)"`
  (it sits on the dark panel). Its M1 reveal stays.
- **3c. The photo band doesn't line up with the spec table.** In 6f the tables were widened (358 → 410u), so table
  B's right edge moved to 8028u while the band still ends at 7924u (104u short). `c-band`: `w: 1196` → **`w: 1300`**
  (6728 + 1300 = 8028, flush with table B), and the band's `<Image sizes="1196px">` → `sizes="1300px"`. The summary
  block starts at 8224u, so it stays clear.

## Verify once

- `npm run check` (cloud session: the local Playwright config with the bundled Chromium, long timeouts).
- `.cache/detail-walk.mjs --slug triumph-tr6 --at 1,2,5,6,7,11,12,14` at 1440 × 960 and 1024 × 640.
  Confirm: the hero elements and "Give it / A new home" are at their 7b positions at frames 1 and 14 (offset 0);
  A2, B and slideshow photos visibly shift mid-scroll; the about paragraph has 4–5 lines; the band's right edge
  equals table B's right edge (measure with `getBoundingClientRect`); the button is there from the first row's reveal.
- Poll `getComputedStyle(el).transform` for 1b and 5a at a mid-scroll position: x must be non-zero and their
  yPercent/xPercent reveal must still have played (the GSAP trap).
- Reduced motion: every new offset stays 0.
- Then ask the user to run `/review-animations` on M14, M7 and the button's fade. Don't commit unless asked; then
  push to `main`. Add a short "7c status" block to `docs/overhaul.md`.
