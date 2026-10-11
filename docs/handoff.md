# Session handoff (2026-10-11, after shot 7b)

Start the next session by reading this file, then `docs/overhaul.md` (the detail page's plan and the 6c–6h status
blocks), `CLAUDE.md` and `AGENTS.md`. The working rule stands (user, 2026-10-08): before touching anything, state what
you are going to do and wait for a go; verify once, then report; no build-measure-tweak loops.

**The detail page overhaul is complete** (shots 6a–6h). Everything is on GitHub,
`vinsensiuswibawa/vanilla-arch`. Shot 6h's work (fixes from the full audit and accessibility pass, document updates)
is in the working tree until the user asks for a commit.

## Where things stand

- **The detail page** (`components/detail/`, `lib/detail*.ts`, `lib/choreography.ts`, `lib/comparables.ts`): hero,
  sections A–E, the camera's four poses and three transitions, the price charts, slideshow, gallery placeholder and
  enquiry sidebar, all with real content for the 13 cars. Default theme `figma`; `?theme=current` opens the other.
- **Theme:** the user picked **figma** at the 6h gate. `?theme=current` still works until someone removes it.
  `DESIGN.md` and `.impeccable/design.json` were regenerated from it in 6h.
- **Keyboard:** the page follows focus (6h). Tab walks every control from the hero to the enquiry and back; arrows,
  Page Up/Down, Home and End step by section; Escape leaves (or closes an open overlay first).
- **Checks:** `npm run check` (typecheck, lint, build, 6 smoke tests). Detail-page scripts in `.cache/` (gitignored,
  so they don't travel with a fresh clone; 6h rewrote them for the bundled Chromium, `CHROME_PATH` overrides it):
  `detail-walk.mjs` (14 storyboard positions, `--theme`, `--w/--h`, `--slug`, `--at`), `detail-perf.mjs` (production
  build on port 3200, record mode, steady wheel, rAF frame times; `--chrome` uses the system Chrome on the laptop),
  `js-size.mjs`, `a11y.mjs`/`a11y2.mjs`/`a11y3.mjs`/`a11y-tree.mjs` (keyboard path, focus rings, overlays, tree).
- **Performance:** last trusted numbers are from the Intel Arc laptop (6g: 60.0 fps, one frame over 50 ms). Shot 6h
  ran in a cloud sandbox with no GPU (software WebGL, about 1 fps), where no frame-rate figure means anything: run
  `.cache/detail-perf.mjs --chrome` at 1440 and 1920, both themes, on the laptop for the final measurement.

## Open, for the user

1. **`DESIGN.md`** was regenerated in 6h from the figma theme ("The Stuttgart Brochure"); review it.
2. **`/review-animations`** ran on 6h's motion; its three findings are fixed (see the 6h status block). Re-run it after
   the next motion change.
3. **The non-modal enquiry panel** still covers the end of "A new home" at 1440 (420 px wide); a slimmer panel would
   clear it.
4. **Remove `?theme=current`** (tokens, Bodoni and Host Grotesk loading) now that figma is picked, or keep it.
5. **M7 depth drift** (left for later by the user) (behind-layer type at 0.9× the page's speed) is in `lib/detail-fx.ts` but was never wired.
6. **Shots 7a and 7b** (section D's price comparison in three tabs, then bolder: verdict headline, title above the
   card, M13 tab switch) are built; see their status blocks in `docs/overhaul.md`. Open: `/impeccable critique`,
   `audit` and `polish`, the full cars × viewports walk, and the user's `/review-animations` on M13 and the headline reveal.
7. **What counts toward the 350 KB "initial" JS budget** (6d), and whether `content/shapes.json` (236 KB raw) slims.
8. **Commit the `.cache/` check scripts** somewhere tracked (e.g. `scripts/detail/`) so they travel with the repo.
9. **Claude Doc sync:** mirror the PRD's 2026-10-10 decision-log rows and budget note to the canonical Claude Doc.

## Next work ("After the overhaul" in `docs/overhaul.md`)

- The showroom (carousel) redesign under the same principles, passing a `CarHandoff` from whatever its camera becomes.
- The equipment and history overlay, the full gallery and `/credits` designed properly.
- `PRODUCT.md` still describes the original nine-car lineup and an eight-chapter listing; refresh it with
  `/impeccable init` (or by hand) before the showroom redesign.

## Environment notes

- Windows laptop: PowerShell plus the Write and Edit tools (the Bash tool fails there); PowerShell writes UTF-8 BOMs,
  so write JSON from Node. Start the dev server in its own window; Next 16 refuses a second dev server per folder.
- Cloud sandbox (claude.ai/code): bundled Chromium only, no GPU. `playwright.config.ts` uses `channel: "chrome"`, so
  run the smoke tests through a local config (6h used `.cache/playwright.local.config.ts`: bundled Chromium, 90 s
  expect timeout). The Impeccable launcher lost its exec bit in the clone: run it as `sh .claude/skills/impeccable/scripts/impeccable`.
