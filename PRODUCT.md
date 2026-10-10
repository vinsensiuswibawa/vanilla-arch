# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 (App Router) with React 19, React Three Fiber 9 and drei 10 on three 0.186 (WebGLRenderer), GSAP 3.15, Lenis 1.3, zustand 5, Tailwind CSS 4, TypeScript strict; deployed on Vercel (vercel.app URL, Hobby plan). The user chose this stack over Vite with vanilla Three.js and over Astro with vanilla Three.js. The WebGL2 renderer was delegated: Claude's call, because three.js still labels WebGPURenderer experimental.

## Users

- Primary: people arriving from the author's LinkedIn and X posts (designers, recruiters, founders), mostly on phones with sound off, giving it 20–60 seconds and judging craft.
- Petrolheads who check that specs, chassis codes and condition details are right.
- Craft reviewers (creative directors, design engineers) on desktop, inspecting motion, type and transitions.

## Product Purpose

An exploratory, display-only digital showroom for secondhand enthusiast cars that demonstrates the author's interaction craft. It sits between corporate, information-dense marketplaces and unpolished luxury boutiques. Success: visitors open at least one car and stay past a minute, and enthusiasts find the details right.

## Positioning

Every listing pairs the seller's subjective photos with an objective 3D model configured to the car's actual spec (a red car with a black interior renders as one), presented like an architecture firm's project archive rather than a store.

## Operating Context

- Shared as a LinkedIn and X showcase piece and kept in the author's portfolio.
- Built as: planning, an asset-prep pass, 2–3 Claude Code build shots, then a polish pass.
- Visitors browse a horizontal carousel, open a listing with eight horizontal chapters, and return; an Index overlay lists all nine cars.

## Capabilities and Constraints

- Nine real cars with full manufacturer branding: 1991 Eunos Roadster (Mazda MX-5, NA6CE), 1991 Honda NSX (NA1), 1993 Jaguar XJ220, 1994 Efini RX-7 (Mazda RX-7, FD3S), 1997 Honda Integra Type R (DB8), 1998 BMW M3 Evolution (E36), 1999 Nissan Skyline GT-R V-spec (BNR34), 2002 BMW M5 (E39), 2008 Lamborghini Gallardo LP 560-4. Colorways follow each car's photo set; `lib/cars.ts` is the source of truth.
- 3D models are free CC-BY Sketchfab models, credited. Seller photos are licensed real photos, and each car's 3D colorway is matched to its photo set.
- Fixed-price listings in USD, mileage in miles and kilometers. Prices, mileage, owners and flaws are fictional; makes, models and specs are factual.
- No accounts, transactions, backend or CMS; the enquiry form is a mock that sends nothing.
- Sound is on by default after a Press Start gate: room tone and UI micro-sounds, no music.
- Vercel Hobby supports page-view analytics only; custom events need Pro.
- Undecided: final colorway per car (follows the photo sets), the vercel.app subdomain, the launch date, and the lineup order.

## Brand Commitments

- Name: Arcade (codename Vanilla Arch).
- Voice: a house curator ("The Take"): precise, warm, a little wry, Monocle in tone, numbers over adjectives.
- References the user made binding: Dieter Rams, Kenya Hara and MUJI, Monocle, Aesop, Nendo, Bauhaus, east-Asian editorial design, architecture-firm portfolios, Gran Turismo 4's Arcade Mode turntable, Agrumea Farm's flow, normalisboring.es for the listing flow, the Lacoste Polo Factory's interaction principles, Cars & Bids for content depth, Bruno Simon for Three.js craft.
- It must not read as a generic Dribbble or Behance UI exploration.

## Evidence on Hand

- The Requirement Brief v1.0 (Notion export) with reference images, summarized in `docs/PRD.md`.
- `docs/PRD.md` and its canonical Claude Doc.
- No real listings, sales, testimonials, press or partnerships exist. Never present the fiction as real; the site is labeled a concept.

## Product Principles

1. The car is the hero; the interface recedes.
2. Trust through correspondence: what the 3D shows must match the photos and the spec.
3. Gentle, interruptible motion; nothing frequent animates.
4. Enthusiast-correct detail over marketing copy.
5. Exploratory, but production-grade in performance and accessibility.

## Accessibility & Inclusion

WCAG 2.2 AA where it applies: a complete keyboard flow, visible and unobscured focus, reduced-motion support, 4.5:1 text contrast and 3:1 for non-text UI (neumorphic controls included), sound only after a gesture with a visible mute, reflow at 200% zoom, 44 px touch targets, and every fact the 3D shows also available as text.
