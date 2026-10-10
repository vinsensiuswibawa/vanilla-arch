# Session handoff (2026-10-08)

Start the next session by reading this file, then `docs/lineup.md` (lineup, rejections, pipeline) and
`docs/shots/shot-1.md`. Nothing is committed since `3be503b`: Shot 0, Shot 1, the lab and the 13-car integration are
all uncommitted. Don't deploy. Commit only when asked.

**Next work: the UI overhaul of the car detail page.** The full plan is in `docs/overhaul.md` (decisions, research,
motion, layout, camera, content, and the ordered shot list in step 6), with the visual reference in
`docs/storyboard/README.md` and the approved copy in `docs/overhaul-copy.md`. Start at shot 6a, one shot per session,
and stop at each gate.

**Working rule (user, 2026-10-08):** before touching anything, state what you are going to do and wait for a go.
Avoid repeated build-and-measure loops; the previous session spent most of its budget on them.

## Where things stand

- **The lineup is 13 cars and is integrated into the showroom.** The user closed the two open slots and ships 13.
  `content/lineup.json` drives the pipeline; `lib/cars.ts` holds the 13 listings (real specs, fiction listings,
  paint and location matched to each photo set).
- **Pipeline:** `npm run models:fetch` (Sketchfab to `raw/<slug>.glb`), `npm run models` (`scripts/models/optimize.mjs`
  to `public/models/<slug>.glb` hero and `<slug>.lod1.glb`, material repairs baked in), `--lab` adds the 110k
  comparison file to `public/lab`. `content/models.json` and `scripts/models/lab.mjs` are gone.
- **One look everywhere:** `components/three/StudioLook.tsx` (HDRI `public/hdri/studio_small_09_1k.hdr`, dark floor,
  softboxes, one shared PMREM per renderer, key light), `components/three/BakedShadow.tsx`, listing paint from
  `lib/materials.ts`, ACES in the showroom, studio and lab.
- **Photos:** 87 in `public/photos`, credits in `content/photos.json`. `scripts/photos/fetch.mjs` now also takes
  direct Openverse/Flickr picks (`{ url, credit, license, licenseUrl, sourceUrl }`). Thin sets: Peugeot 2,
  Porsche 3, Datsun 3.
- **Emblems:** 12 in `content/emblems.json` / `public/emblems`. The Lotus has none (no freely licensed Lotus Cars
  mark); `emblem` is optional and the chrome skips it. The Triumph mark is the motorcycle-era wordmark.
- **Stills:** all 13 regenerated in `public/stills` (with a dev server already running, use
  `STUDIO_URL=http://localhost:3000 node scripts/stills.mjs`; Next 16 refuses a second dev server).
- **Record mode:** `/?record` mounts and warms all 13 cars behind the gate, holds the Enter buttons until all are
  loaded (about 7–9 s on the laptop), and pins the pixel ratio (no PerformanceMonitor switches mid-take).
- **Measured (production build, Intel Arc 130T, D3D11, hero files):** 60.0 fps average across the 13-car walk, p99
  frame 16.9 ms at pixel ratio 1 and 2, no frames over 50 ms in either direction. Script: `.cache/record-run.mjs
  --headed` against `next start -p 3200`. Note: Playwright screenshots stall the page ~100 ms; never time a walk
  that takes screenshots.
- **Fixes this session:** `runtime.veil` was sized for 9 cars (now `CAR_COUNT`); the AudioContext is built while
  the gate idles (`prepare()` in `lib/audio.ts`), which removed a ~200 ms stall on Enter.
- **Checks:** `npm run check` passes (typecheck, lint, build, 5/5 smoke tests updated for the 13-car order).

## Open, for the user

1. **Budgets.** CLAUDE.md and the PRD still say ≤ 120k triangles and ≤ 2.5 MB per car. The hero files ship up to
   400k and 4.49 MB (Datsun); 30 MB in total. Decide whether to rewrite the caps to the hero figures.
2. **Gate lift** still drops 2–4 frames (50–117 ms) during its 1200 ms fade with `filter: blur(8px)`. Removing or
   shortening the blur is a motion-spec change.
3. **`/review-animations`** on Shot 1 (user-invoked gate).
4. **Claude Doc sync:** the PRD lineup table, materials, lighting and decision log were edited locally; mirror them to
   the canonical Claude Doc.
5. **UI shell overhaul** and the veil question (memory: `project-ui-shell-overhaul.md`).

## Still to build (Shot 2/3 scope)

- `/credits`: every CC BY model and photo, the CC BY-SA note for the Datsun, the Gallardo's extra credits (Velstyde,
  young-chief), Poly Haven, emblems. The user said to ignore licence problems for now.
- Favicon (the one remaining 404).
- `lineup.json` `colors` are lab swatches only; the listing paint comes from `lib/cars.ts`.

## Environment notes

- The Bash tool fails with "Stream closed"; use PowerShell plus Write and Edit. Write scripts to `.cache/*.mjs`
  rather than `node -e` with complex quoting. PowerShell writes UTF-8 BOMs; write JSON from node.
- Commons rate-limits hard (HTTP 429 for minutes). `scripts/photos/commons.mjs` now batches 20 titles and retries 8
  times; Openverse (`scripts/photos/search.mjs`) is the fallback.
- A dev server may already be running on :3000 from an earlier session; reuse it.
- Lab: `/lab/<slug>` defaults to the shipping file; `lod=budget|phone|raw`, `look`, `tone`, `view`, `paint`, `still=1`,
  `bg=none`. HDRI alternatives stay in `public/lab/hdri`.
