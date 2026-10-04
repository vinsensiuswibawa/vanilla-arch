---
name: Arcade
description: A white-and-gray 3D showroom for modern classic cars, laid out like an architecture firm's project archive.
---

<!-- SEED: established with the user before implementation; re-run /impeccable document once there's code to capture the actual tokens and components. -->

# Design System: Arcade

## Overview

A gallery, not a store. Visitors move sideways through full-bleed horizontal journeys: a carousel of cars in Bauhaus frames, then listings told as horizontal chapters in the manner of normalisboring.es. The material character is white paper, stepped grays and a soft studio mist like Gran Turismo 4's cyclorama. Cars are the only saturated thing on screen, and seller photos stay unretouched.

Motion grammar: slow where it carries meaning (the endless turntable, the frame-to-listing morph, the mist phase-in), instant where it repeats. Reusable signatures: the four Bauhaus frame primitives, the auction-sheet condition report with its signal-orange hanko seal, and the architectural side-elevation drawing of each car.

## Colors

Established with the user: whites and grays, with color carried only by the cars, the small full-color manufacturer emblems, and one signal accent, Braun signal orange (#EE6A1F).

The neutral ramp in `docs/PRD.md` (paper, mist-100 to mist-700, ink, night) and the text-safe orange (#C2541B) are proposals [to be confirmed during implementation].

**The One Signal Rule.** Signal orange marks live and active states (grade seal, live dot, active chapter, cursor dot), covers at most 2% of any screen, never carries body text, and is never the only indicator of state.

## Typography

Established: a high-contrast Didone for display over a working grotesk, Normal is Boring-style, all in free OFL fonts. Bodoni Moda for car names, statements and giant cut-off words; Host Grotesk for text and UI; Geist Mono for tabular numerals; Shippori Mincho for Japanese accents, including vertical chapter spines. The fluid scale in `docs/PRD.md` is [to be resolved during implementation].

## Layout

Horizontal panels sized in viewport units, cut-off display type, and vertical spines set in Mincho. On phones the carousel becomes a native swipe row and listings read vertically. Exact spacing and frame proportions are [to be resolved during implementation].

## Elevation & Depth

Flat by default. Depth comes from the 3D studio itself (mist, baked contact shadows), not from UI shadows. Slight neumorphism appears only on secondary controls (sound toggle, camera presets, Index button, chapter pill), each backed by a label or hairline for contrast; primary actions stay flat.

## Shapes

Car frames use four Bauhaus primitives (arch, circle, square, half-disc), one per car. Panels and photos have square corners for architectural crispness; buttons and the cursor are full pills.

## Do's and Don'ts

- Do let car paint be the only saturated color; the UI stays achromatic.
- Do keep Japanese as editorial accents (market names, vertical spines), never as translation.
- Don't use neumorphism on primary actions or anything that must read as interactive at a glance.
- Don't drift toward warm cream backgrounds; Arcade is white and gray.
- Don't animate layout properties or high-frequency actions.
- Don't use Gran Turismo assets, logos or music; GT4 is a reference for feel only.
