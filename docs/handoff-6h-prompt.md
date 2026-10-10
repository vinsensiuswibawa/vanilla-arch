We're building the car detail page overhaul for Arcade. The plan is complete and approved; your job is to
execute it, one shot per session. Shots 6a through 6g are done. This session is shot 6h only — the last shot of
the overhaul.

Before doing anything, read these in full:
1. docs/overhaul.md (the plan; it overrides docs/PRD.md for the detail page). Read shot 6h closely (search for
   "### 6h"), and the "6c" through "6g" status blocks in step 6 — they list what was decided, how the build
   differs from the plan, and what's still open. 6f's status block has two extra rounds of fixes from the
   user's direct review; 6g's lists a dozen real bugs found and fixed during its own audit (a GSAP transform-
   decomposition trap, a ScrollTrigger/behind-layer limitation, several sequencing and responsive-reach bugs
   around the section-E trigger, a missing focus trap, contrast fixes) — read it closely, since 6h's own audit
   pass should not rediscover the same classes of bug.
2. docs/storyboard/README.md and all 14 frames (docs/storyboard/1.png through 14.png) — the full visual
   reference, now that every section is built.
3. CLAUDE.md and AGENTS.md. Next.js 16.3 differs from older versions: read the matching guide in
   node_modules/next/dist/docs/ before writing any Next code.

State after 6a–6g (nothing is committed):
- All five sections (hero through specs, price comparison through enquiry) are built with real content, both
  themes, audited at each shot (frontend-design self-critique, /impeccable critique, /impeccable audit — every
  P0/P1 fixed) and polished against direct user review where the user gave one.
- The default theme is "figma" (not "current"); verify your work there first, current second.
- Checks that exist: npm run check (6 smoke tests); .cache/detail-walk.mjs (walks the 14 storyboard positions
  at a viewport size, dev server only, pass --theme figma or --theme current); .cache/detail-perf.mjs
  (production build, headed, steady wheel, the project's performance gate); .cache/js-size.mjs.
- A dev server may still be running on :3000 in its own window; reuse it if so.
- Known, accepted gaps carried forward from earlier shots (read the relevant status block before touching):
  offscreen buttons' tabbability relies on an `inert` margin, not a hard cutoff (6d); the car reads about 18%
  larger against the DOM at 16:9 than 3:2 (6c/6d, never revisited); JS bundle size and what counts toward the
  350 KB "initial" budget was never resolved (6d); the hero's ghosted-outline font-rendering quirk on
  Bodoni Moda is pre-existing, confirmed unrelated to the overhaul (6e); the equipment-and-history overlay
  button opens nothing (placeholder, by design, redesigned later per the plan's "After the overhaul" section).

What 6h needs, from the plan:
- The full audit protocol across the whole detail page, both themes: `frontend-design` self-critique,
  `/impeccable critique`, `/impeccable audit`, plus (new from this shot on) `web-design-guidelines` and
  `break-ui` — stress it with a long car name, a car with only six photos (check which of the 13 are still at
  6b's floor), and extreme prices (the $9.8k Peugeot and the $585k Jaguar are the two ends already in the data).
- A full accessibility pass: the complete keyboard path from the hero to the enquiry sidebar and back, focus
  visibility on both light and dark sections, and the screen-reader summaries (the hero, the spec table, the
  price strip's `stripSummary`, the enquiry form) read correctly as a connected whole, not just section by
  section as each shot checked its own.
- One final, decisive performance measurement (`.cache/detail-perf.mjs` against a production build, no
  screenshots during the timed walk) at 1440 and 1920, both themes.
- Update the documents: `docs/PRD.md`'s decision log, `DESIGN.md` (re-run `/impeccable document` now that the
  whole page is real), `docs/handoff.md`, and `CLAUDE.md` — specifically the clip-path and Satoshi exceptions,
  GSAP joining the stack, and the per-car model budgets (CLAUDE.md still says 120k triangles / 2.5 MB; the hero
  files ship up to 400k triangles / 4.49 MB — ask the user before changing the stated budget, don't just raise
  it to match).

Working rules (mine, and binding):
- Before touching anything, tell me exactly what you will do for shot 6h, in order, and wait for my go.
  Reading files is fine before that; changing anything is not.
- This is the last shot. Do only shot 6h — don't start anything from "After the overhaul" (the showroom
  redesign, the equipment overlay, the real gallery, /credits).
- Verify once, then report. No loops of build, measure, tweak. If something fails, say so with the output.
  Say what you did not test.
- If anything in the plan is unclear or seems wrong, ask instead of improvising.
- Windows: the Bash tool can drop its stream mid-session — if that happens, switch to PowerShell for the rest
  of the session. Use PowerShell plus the Write and Edit tools generally; PowerShell writes UTF-8 BOMs and
  mangles non-ASCII characters when it rewrites a file, so write or patch files with Edit/Write or from a Node
  script in .cache/*.mjs, never with Set-Content. If you need the dev server, start it in its own window with
  Start-Process powershell -ArgumentList '-NoExit','-Command','npm run dev' (Next 16 refuses a second dev
  server in the same folder).
- When checking visual results, screenshot and compare directly — mid-animation state is unreliable from
  screenshots alone; for anything timing-sensitive, poll the actual DOM/style state instead, and be aware that
  a dev-server HMR reload mid-test can produce a one-off flake — if a result looks wrong right after an edit,
  re-run once cleanly before reporting it as a bug.
- Don't commit or deploy unless I ask.

Gate for 6h (plan, step 6): every P0 and P1 fixed; I compare the two themes and pick one (or keep both for
later); my final review.

Start by confirming you've read the files, then give me your plan for shot 6h.
