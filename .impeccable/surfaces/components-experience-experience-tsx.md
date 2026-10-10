---
version: 1
slug: "components-experience-experience-tsx"
primary_target: "components/experience/Experience.tsx"
related_targets: ["app/page.tsx"]
---

# Showroom (gate + carousel + Index)

Scope: the `/` experience mounted in the root layout: Press Start gate, horizontal desktop carousel, Index overlay, sound, cursor, emblem. Visitor mode: Experience.
Audience: scrollers from LinkedIn/X (20–60 s), petrolheads, craft reviewers on desktop. Job: get a stranger to open a car.
Constraints: PRD motion spec durations and easings only; achromatic UI, signal orange ≤ 2%; every 3D fact also in DOM; 60 fps desktop.
Decided with the user (2026-10-06): chronological order (opens on the Eunos); wordmark is Didone capitals over the nine frame shapes, which fill as cars load; the gate shows on every load.

## Direction contract

THESIS: A colonnade, not a slider. Nine cars stand in Bauhaus window shapes on one shared floor line, like an arcade of arches seen walking past; the category's centered product card with arrows is refused.
OWN-WORLD: White paper mat with frame-shaped openings onto a soft grey studio cyclorama; Bodoni Moda caps and names, Host Grotesk working text, Geist Mono numbers, vertical Shippori Mincho market names; ink pills, mist-200 neumorphic secondary controls; one signal dot.
STORY: The visitor presses Start, watches the first car phase out of the mist and turn, scrolls sideways through the archive in year order, and opens one car.
FIRST VIEWPORT: Gate: ARCADE in Bodoni caps centred over the nine frame glyphs on a misty field, ink "Enter the showroom" pill below. Showroom: the centred frame ~62vh tall on the floor line, neighbours half-misted at the edges, label below each frame, emblem top-right, progress glyphs bottom-left, Index and Sound bottom-right.
FORM: PRD-pinned arcade of frames (docs/PRD.md); no concept-seed roll because the surface is precisely specified. Seed key: none.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
