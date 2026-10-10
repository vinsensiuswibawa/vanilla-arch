# Arcade (codename Vanilla Arch)

A horizontally scrolling 3D showroom of nine modern-classic cars with fictional listings: a LinkedIn/X showcase that must be built like a real site. Greenfield; nothing is scaffolded yet.

## Sources of truth

- `docs/PRD.md`: the build spec. Read the sections a shot touches before writing code. It mirrors the canonical Claude Doc (https://claude.ai/code/artifact/6cbf5ebb-ec3a-4e80-a289-f0f3f3cb52ad), where the user reviews and comments. If they disagree, ask.
- `PRODUCT.md` and `DESIGN.md`: Impeccable's product record and visual seed. `DESIGN.md` is a seed; re-run `/impeccable document` once real tokens exist.
- Decisions already made are listed in the PRD's decision log. Don't reopen them without a reason; flag conflicts instead.
- `AGENTS.md` (managed by `next dev`, imported below): Next.js 16.3 differs from older versions; read the matching guide in `node_modules/next/dist/docs/` before writing Next code.

@AGENTS.md

## How the build runs

One shot per session; stop at the shot's gate and report against it (PRD: "Delivery plan, QA and audit protocol").

1. Shot 0, assets and scaffold: run `/impeccable hooks on` first (the user approved hooks for build shots), then scaffold, models, photos, `lib/cars.ts`, stills.
2. Shot 1, the showroom. 3. Shot 2, listings and the morph. 4. Shot 3, mobile, resilience and ship. 5. Polish pass.

Before the first UI code, run the `frontend-design` design-plan pass (palette, type pairing, layout device, signature element) and critique it against the brief.

## Audit protocol, after every shot

1. `frontend-design` self-critique.
2. `/impeccable critique` and `/impeccable audit`; fix every P0 and P1. Triage hook findings as the `impeccable` skill describes: fix real problems, add only narrow ignores with named evidence.
3. `/review-animations` (Emil Kowalski) on the shot's motion; the verdict must be Approve. It sets `disable-model-invocation`, so Claude can't trigger it: at each gate, ask the user to run it (same for `/prototype` and `/pick-ui-library`).
4. From Shot 3: `web-design-guidelines` and `break-ui`.

## Non-negotiables

- Motion: use only the durations and easings in the PRD's motion spec. DOM animates `transform`, `opacity` and `filter: blur()` (≤ 8 px) only; every interactive animation is interruptible; nothing high-frequency animates; honor `prefers-reduced-motion`.
- Color: achromatic UI; the cars carry color. Signal orange `#EE6A1F` covers ≤ 2% of a screen, never body text, never the only state cue. Focus rings are 2 px ink.
- Fonts: OFL only, via `next/font` and CSS variables: Bodoni Moda (display), Host Grotesk (text), Geist Mono (numerals), Shippori Mincho (Japanese accents).
- Architecture: one persistent canvas in the root layout; the DOM drives, drei `<View>`s follow. Routes set metadata only. Every fact in 3D also exists as DOM text.
- Budgets: GLB ≤ 2.5 MB per car, ≤ 120k triangles, initial JS ≤ 350 KB gzipped, 60 fps desktop and ≥ 45 fps on an iPhone 13-class phone.
- Content: listings are fiction, makes and specs are real. Credit every CC-BY model and photo on `/credits`, keep the non-affiliation disclaimer, and use no Gran Turismo assets or music.
- Code: follow `karpathy-guidelines`; the smallest change that meets the requirement, then verify it.

## Environment

- Windows 11; PowerShell and Git Bash. Node 24.6, npm 11.
- Versions in the PRD stack table were current on 2026-10-04; check npm before installing and don't downgrade.
- Planned scripts (created in Shot 0): `npm run dev`, `npm run build`, `npm run check` (typecheck, lint, build, Playwright smoke), `npm run models` (gltf-transform), `npm run stills` (Playwright stills and OG cards).
- Deploy: Vercel Hobby on a vercel.app URL. Custom analytics events need Pro, so only page views report.

## Skills and agents

56 project skills in `.claude/skills/` and 5 agents in `.claude/agents/`. Vendored third-party skills (Impeccable, Emil Kowalski's) are listed in `.claude/THIRD-PARTY-NOTICES.md`; don't edit them, update from upstream instead.
