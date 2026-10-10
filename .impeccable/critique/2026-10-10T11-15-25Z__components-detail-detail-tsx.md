---
target: car detail page, both themes (shot 6h)
total_score: 26
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 5
target_identity: "file:/home/user/vanilla-arch/components/detail/Detail.tsx"
target_fingerprint: "sha256:3c3b0234af45b1c41d8048d410e7ef7a69f60d265ca96363949a24e006b3c3f5"
target_path: /home/user/vanilla-arch/components/detail/Detail.tsx
timestamp: 2026-10-10T11-15-25Z
slug: components-detail-detail-tsx
---
# Critique: car detail page (shot 6h), both themes

Method: dual-agent (A: design review sub-agent · B: detector sub-agent)

## Design Health Score (before 6h fixes)
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Only a 1 px progress line says where you are |
| 2 | Match system / real world | 3 | Scatter and history have no axes |
| 3 | User control and freedom | 3 | Scroll-triggered sidebar is an unrequested modal |
| 4 | Consistency and standards | 2 | Leaked placeholder labels; four CTA treatments; dt/dd without dl |
| 5 | Error prevention | 3 | Concept disclaimer before sending |
| 6 | Recognition over recall | 3 | Facts repeated in bar and table |
| 7 | Flexibility and efficiency | 3 | Arrows, PgUp/PgDn, Home/End, Jump to specs |
| 8 | Aesthetic and minimalist | 3 | Leaked labels, dense price micro-type, dimmed finale |
| 9 | Error recovery | 3 | Text errors with role=alert |
| 10 | Help and documentation | n/a | Display-only Experience surface |
| Total | | 26/36 | Good (72%) |

## Design specificity
Authored for the product: the scroll-driven car through four poses, covered and revealed by dark panels, against a brochure layout. Weakest: section D's beige chart cards read as a SaaS widget; all-caps Satoshi display (figma) is the most interchangeable choice. Detector: CLI clean; browser findings false positives except 10 px chart ticks and the dark pill at 4.3:1 over light photos.

## Priority issues (all P1 fixed in 6h)
- [P1] Placeholder labels "C: SPECS" / "SLIDESHOW" on the live page. Fixed.
- [P1] Keyboard: invisible off-screen focus (chart dots, See all…); focusable dots inside aria-hidden; text in aria-label on <p> read as empty; no section headings; dt/dd without dl. Fixed (focus-follow replaces the inert margin).
- [P1] Figma contrast 4.03:1 for light labels, comparison line, disclaimer. Fixed (75% ink).
- [P1] 1024x640 overflow: about paragraph and price module. Fixed.
- [P1/open] Auto-opened modal sidebar dims and covers the finale. Modal semantics fixed (Tab enters, focus returns); presentation left for the user.
- [P2/open] Charts without axes; dead space in price-more; M7 depth drift never wired.

## Persona red flags
Sam: off-screen focus, silent paragraphs, no headings (fixed). Riley: wheel-back auto-open (guarded), 1024 overflow (fixed), six-photo repeats (open). Craft reviewer: leaked labels (fixed), dimmed finale, no depth drift, Bodoni hairlines in software rendering (pre-existing).

## Questions
1. Should the final frame ever be covered by the scroll-triggered sidebar?
2. Must section D look like a dashboard, or can the strip live on the field under the side-view car?
3. If figma wins, what replaces Bodoni + signal orange as the signature type moment?
