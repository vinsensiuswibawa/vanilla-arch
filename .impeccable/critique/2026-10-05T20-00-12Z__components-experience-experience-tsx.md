---
target: Shot 1 showroom
total_score: 25
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\vinse\\Documents\\Vanilla Arch\\components\\experience\\Experience.tsx"
target_fingerprint: "sha256:5e62b3f0926f68791851ccf22a5e9e61adbf49306b607aeb1f10573f1c4264d9"
target_path: "C:\\Users\\vinse\\Documents\\Vanilla Arch\\components\\experience\\Experience.tsx"
timestamp: 2026-10-05T20-00-12Z
slug: components-experience-experience-tsx
---
Method: dual-agent (A: design review sub-agent · B: detector + browser sub-agent)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Live dot stayed on under reduced motion (fixed) |
| 2 | Match System / Real World | 3 | Bodoni hairline hyphens erased "RX-7", "GT-R" (fixed: hyphens in Host Grotesk) |
| 3 | User Control and Freedom | 3 | Focus dropped to body after leaving a listing (fixed) |
| 4 | Consistency and Standards | 3 | Index opened focus on its scroll container (fixed: opens on the car in view) |
| 5 | Error Prevention | 3 | Gate pre-focuses the last sound choice |
| 6 | Recognition Rather Than Recall | 2 | Progress glyphs encode shape, not car; no visible names |
| 7 | Flexibility and Efficiency | 3 | Index sat 19 tab stops deep (fixed: chrome now precedes the row) |
| 8 | Aesthetic and Minimalist Design | 3 | Cars undersized in frames (fixed: fit raised); row ends in white void |
| 9 | Error Recovery | 2 | Loading/failed model indistinguishable from mist; no WebGL fallback yet (Shot 3) |
| 10 | Help and Documentation | n/a | Experience surface; inline key hints suffice |
| **Total** | | **25/36** | **Good (69%)** |

## Design Specificity Verdict
Authored for this product: Bodoni caps over nine loading frame glyphs, Bauhaus windows on one floor line, Mincho market-name spines, period-correct emblems, an architect's project list for the Index. Weak point: neighbours are ~85–100% misted under the PRD veil, so the row reads as one car among empty windows.
Deterministic scan: CLI detect clean (0 findings, also with --no-config). Browser overlay: 10 findings per view, all verified false positives (stacked emblem images, intentional sticky clip, Geist Mono as the specified numerals face, detector's own highlight). axe: moderate `region` on gate and h1 (fixed with landmarks). Console: favicon 404 (Shot 3), ANGLE D3D shader warnings (driver noise).

## Priority Issues
- [P1] Focus lost to <body> on return from a listing. Fixed.
- [P1] Car under-scaled for "the car is the hero". Fixed (lib/frames.ts fit/ground).
- [P2] Neighbours effectively invisible: PRD veil smoothstep(0.18, 0.85, d) at this spacing puts a neighbour at veil ≈ 0.85. Conflicts with the PRD; flagged to the user.
- [P2] Bodoni hyphens vanish in model codes. Fixed.
- [P2] Stale hover/pill when the row moves under a still pointer; Index focus on scroll container. Fixed.

## Persona Red Flags
Alex: glyphs have no names, so jumping to a car means arrows or the Index. Sam: focus loss after listing (fixed), h1 after the row (fixed), aria-live counted 9 times (fixed: announces once). Petrolhead: hyphens (fixed), meta description said 2010 (fixed to 2008).

## Minor Observations
Emblems vary in optical weight; Index rows wrap to three lines on some cars; listing placeholder leaves chrome active; mobile overlaps (Shot 3); no closing beat after car 09.

## Questions to Consider
Should the veil let the neighbour read (sell the next car)? Should frame shape follow each car's proportions? What happens after car 09?
