# Shot 0 report: assets and scaffold

Date: 2026-10-06. Gate status: **met, with accepted model mismatches** (see "Models against their photos"). Impeccable critique and audit move to the start of Shot 1 by decision.

## Gate check

| Gate item (PRD) | Status |
| --- | --- |
| Scaffold with tokens and fonts | Done: Next.js 16.3.8, React 19.2.8, Tailwind 4, the four OFL fonts, achromatic tokens, easing tokens |
| Nine GLBs within budget, visually matched | Done: all 18 files within budget (table below); orientation, scale and colours checked in stills. Body-kit and wheel mismatches listed below |
| Matched photo sets, licensed | Done: 80 photos across 9 cars, one physical car per set, CC BY / CC BY-SA / CC0 from Wikimedia Commons, credited in `content/photos.json` |
| `lib/cars.ts`: specs, takes, condition, provenance | Done: real specs with sources (below), fictional listings |
| Credits complete | Done for data: every photo and model carries author, license and source URL. The `/credits` page itself is Shot 3 (FR-26) |
| Stills rendered | Done: `public/stills/<slug>-og.jpg` (1200×630) and `<slug>-card.webp` for all nine |
| `npm run check` green | Done: typecheck, lint, build and 2 Playwright smoke tests pass |

## What exists now

- `app/`: root layout (fonts, metadata), a placeholder home that lists the collection as an architect's index (Shot 1 replaces it with the gate and carousel), and `app/studio/[slug]`, a dev-only asset studio (404 in production).
- `lib/cars.ts` (listings), `lib/format.ts`, `lib/materials.ts` (colors from data onto canonical material slots).
- `components/three/CarModel.tsx`, `components/three/GroundShadow.tsx`, `components/studio/Studio.tsx`: reusable in Shot 1.
- `content/models.json` (model credits and pipeline config), `content/photos.selection.json` (curation), `content/photos.json` (generated credits).
- Scripts: `npm run photos`, `models:fetch`, `models:inspect`, `models`, `stills`, `check`. Research helpers in `scripts/photos/` (`search.mjs` for Openverse, `commons.mjs` for Wikimedia Commons).

## Design plan pass (frontend-design)

**Plan.** Subject: modern-classic cars presented as an architect's project archive; the page's one job is to get a stranger to open a car. Palette: white paper, stepped greys, ink, Braun signal orange as an instrument mark only; the cars carry color. Type: Bodoni Moda for names (monumental, Normal is Boring-like), Host Grotesk for working text, Geist Mono for numbers, Shippori Mincho for Japanese accents. Layout device: the arcade, a row of Bauhaus frames (arch, circle, square, half-disc), with listings as horizontal chapters. Signatures: GT4-style mist and turntable, the auction-sheet condition report with its hanko seal, and the architectural elevation.

**Critique.**
- Specific to the subject? Yes. The arcade of frames is both architecture and GT4's Arcade Mode, and the auction sheet and market names (Eunos, Efini) are enthusiast-native.
- Default clusters: the Didone serif risks the editorial cluster, so structure must come from frames and panels, not hairline-ruled grids. The orange risks the artisanal cluster, so the paper stays pure white and the orange stays an instrument signal.
- Hero: frontend-design warns against "a floating 3D object", but here the 3D car is the product and the brief requires it (the brief wins). Mist, frames and the turntable make it specific.

**Fixes from rendering the placeholder.**
- At weight 400, Bodoni Moda's hairline hyphens vanish on 1x screens, so "RX-7" reads as "RX 7". Names use weight 500. Shot 1 should re-check at every display size.
- Japanese names now never wrap mid-word.

## Audit protocol

| Step | Result |
| --- | --- |
| frontend-design self-critique | Done (above) |
| `/impeccable critique` and `/impeccable audit` | **Not run.** Impeccable's launcher needs a one-time approval to download its engine, and that prompt timed out twice this session. Hooks are therefore not on yet. Approve it at the start of Shot 1 |
| `/review-animations` | Not applicable: Shot 0 has no motion |
| `web-design-guidelines`, `break-ui` | From Shot 3 |

## Lineup changes the photo sets required

Each listing now matches its photo set, so the 3D car can match the photos (PRD lineup and the Claude Doc are updated).

| Car | Planned | Now | Why |
| --- | --- | --- | --- |
| 01 MX-5 | 1991 US Miata, British Racing Green / tan | 1991 Eunos Roadster (JDM), Silver Stone Metallic, factory hardtop, light modifications | The only complete same-car set is a Japanese Eunos (13 photos, interior included) |
| 02 NSX | Manual, $128,000 | 1991 automatic, $92,000 | The red NA1 set's source files are named "Auto"; automatic specs used (252 hp) |
| 03 XJ220 | Silver / grey | Maroon / cream leather, Florida | Best set (13 photos, interior and engine) |
| 04 RX-7 | 1993 US, Competition Yellow | 1994 Efini RX-7 (JDM), white, unmodified | Only stock set; modified sets would contradict the stock 3D model's wheels |
| 05 Integra | 1998 | 1997 (E-DB8, pre-98 spec) | Photos are of an E-DB8; its catalog specs are verified |
| 06 M3 | 1995 US, modified, white | 1998 European M3 Evolution, Estoril Blue, stock | The only complete set (13 photos) is a stock UK Evo |
| 07 R34 | Bayside Blue | White, Seoul | 10-photo set of one white GF-BNR34 on Korean plates |
| 08 M5 | Black / caramel | Carbon Black / black leather | 22-photo set of one 2002 UK car; 14 used |
| 09 Gallardo | 2010, matte grey, manual | 2008 LP 560-4, black, e-gear | One black car (Belgian plates) in a mixed set; 6 photos verified as the same car |

Photo counts: Eunos 12, NSX 5, XJ220 13, RX-7 4, Integra 4, M3 12, R34 10, M5 14, Gallardo 6. Several are below the PRD's 8–12 fallback; the gallery must work from 4 photos up.

## Spec sources

- [Mazda MX-5 (NA)](https://en.wikipedia.org/wiki/Mazda_MX-5_(NA)) for engine, dimensions and hardtop; Japanese catalog listings (search results for E-NA6CE) for the Eunos's 120 PS, 137 N·m and 940 kg.
- [Honda NSX (first generation)](https://en.wikipedia.org/wiki/Honda_NSX_(first_generation)) for the NA1 and its automatic (252 hp, 285 N·m).
- [Jaguar XJ220](https://en.wikipedia.org/wiki/Jaguar_XJ220).
- [Mazda RX-7](https://en.wikipedia.org/wiki/Mazda_RX-7) for the FD3S. The listed 1,260 kg sits inside Wikipedia's 1,218–1,340 kg range for FD trims; the exact trim weight is unverified.
- [Gulliver catalog, Integra Type R E-DB8](https://221616.com/catalog/honda/integra/199305_200107/2003843/) and the [Classic Register DC2/DB8 guide](https://classicregister.com/guides/info-guide-1996-2001-honda-integra-type-r-dc2db8-jdm).
- [BMW M3](https://en.wikipedia.org/wiki/BMW_M3) for the E36 Evolution (321 PS, 350 N·m, 1,515 kg).
- [Gulliver catalog, Skyline GT-R V-spec GF-BNR34](https://221616.com/catalog/nissan/skyline/199805_200208/1501419/) for 280 PS, 392 N·m and 1,560 kg; [Nissan Skyline GT-R](https://en.wikipedia.org/wiki/Nissan_Skyline_GT-R) for production numbers.
- [BMW M5](https://en.wikipedia.org/wiki/BMW_M5) for the E39.
- [Lamborghini Gallardo](https://en.wikipedia.org/wiki/Lamborghini_Gallardo) for the LP 560-4.

Paint names to double-check against period brochures: Silver Stone Metallic (Eunos), Chaste White (FD), Nero (Gallardo).

## Verified on a synthetic model

A box "car" in centimetres, lying along X, with non-canonical material names, went through the whole chain. The optimizer removed the plate node, renamed materials to `paint`, `glass` and `rim`, rotated the long axis to Z, scaled it to exactly 4.405 m, put the origin on the ground at the centre, and applied Meshopt and quantization; it also wrote the phone variant. The studio then rendered it with the listing's colors, and `npm run stills` produced the OG and card stills. Headless Chrome renders on the real GPU (Intel Arc via Direct3D 11), so stills have full quality.

Two findings:
- drei's `ContactShadows` renders nothing visible with three r186 (no error), so `GroundShadow` replaces it: a soft baked shadow sized to each car's footprint that turns with the car.
- +90° rotation sent this car's nose to −Z, so each real model's `rotateY` is set after viewing it in the studio.

## Models

Budgets: desktop ≤ 110k triangles and 2.5 MB; phone (`.lod1.glb`) ≤ 40k triangles and 1 MB.

| Car | Desktop | Phone |
| --- | --- | --- |
| MX-5 | 0.40 MB, 51k | 0.34 MB, 40k |
| NSX | 0.72 MB, 56k | 0.44 MB, 40k |
| XJ220 | 0.88 MB, 39k | 0.58 MB, 39k |
| RX-7 | 0.66 MB, 29k | 0.43 MB, 29k |
| M3 | 0.92 MB, 67k | 0.62 MB, 40k |
| Integra | 0.34 MB, 22k | 0.27 MB, 22k |
| R34 | 0.80 MB, 62k | 0.50 MB, 40k |
| M5 | 1.11 MB, 110k | 0.65 MB, 40k |
| Gallardo | 1.92 MB, 110k | 0.85 MB, 40k |

Pipeline changes found on real models:
- Simplifying whole cars dented the paint's reflections (glaring on the M5's dark metallic). The triangle budget now comes out of wheels, trim and cabin first; paint is simplified only when still over budget, and then gets recomputed smooth normals.
- Paint, glass, interior and rim textures are stripped, since `lib/materials.ts` replaces those materials with the listing's colours.
- `phoneRemove` drops detail from the phone file only (the Gallardo's drilled brake discs, 11k triangles behind black spokes).
- The studio renders with Khronos PBR Neutral tone mapping; ACES turned Formula Red salmon. Shot 1's canvas should use the same.
- Removed: the XJ220's ground plane, the M3's ground plane and licence plates, the Integra's number plates.

## Models against their photos

Orientation, real-world length and listing colours are correct for all nine. Model differences from the photo sets, accepted for now:

| Car | Difference |
| --- | --- |
| MX-5 | No hardtop on the model (the photos and listing have one); aftermarket-style wheels |
| NSX | Aftermarket mesh wheels, front lip and an "NSX" front plate |
| RX-7 | Aftermarket five-spoke wheels and front lip; the photos are stock |
| M3 | Lowered, wide body kit, BBS-style wheels (accepted by decision) |
| R34 | Swapped (2026-10-06) from Lexyc16's model, which had no cabin, to unitygtt34's "Nissan Skyline GT-R R34 [Detailed (Unity3D)]" (CC BY 4.0), which has seats, dashboard and steering wheel. Remaining: aftermarket six-spoke wheels and a dark rear wing (the blade shares a textured trim material, so it can't take body colour). Rejected: a vecarz/heynic repost of a CC BY-NC-SA model, and Pooya_dh's, which also has no cabin |
| M5 | Aftermarket multi-spoke wheels and red calipers |
| XJ220, Integra, Gallardo | Close match |

## Decisions

1. **Sketchfab token.** Done: copied from `Sketchfab API Token.txt` (gitignored) into `.env.local`.
2. **E36 3D model.** The chosen model is lowered on BBS-style wheels; the photos are a stock M3 Evo. Decided (2026-10-05): accept the mismatch for now; revisit in the polish pass.
3. **Impeccable.** Decided: the user approves its launcher at the start of Shot 1, then hooks, `critique` and `audit` run.

## Notes

- Wikimedia's image server throttles bulk downloads (HTTP 429 with a 10-minute Retry-After). `npm run photos` paces itself, honors Retry-After and resumes; files are named by source hash, so reordering a selection can't mislabel a credit.
- `npm audit`: production dependencies are clean; 5 high findings sit in the dev-only ESLint chain (`eslint-config-next` → `fast-glob` → `micromatch` → `braces`).
- No favicon yet (Shot 3 adds icons and share cards).
