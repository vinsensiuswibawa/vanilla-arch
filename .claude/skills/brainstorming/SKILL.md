---
name: brainstorming
description: Collaborative design-first brainstorming workflow. Enforces a hard gate — no code, scaffolding, or implementation until a design is presented and user-approved. Use when starting any project to explore approaches, propose alternatives with tradeoffs, and document a spec before building.
metadata:
  source: https://github.com/obra/superpowers
---

# Brainstorming

**HARD GATE: Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it. This applies to EVERY project regardless of perceived simplicity.**

## Why This Matters

"Simple" projects contain the most unexamined assumptions — these cause the most wasted work. The design gate exists to surface what hasn't been thought through before code commits to a direction.

## Process (9 sequential steps)

1. **Explore project context** — read existing files, commits, README, and any relevant documentation before asking questions
2. **Offer visual tools just-in-time** — not upfront. Only offer when the content itself is visual (mockups, diagrams, spatial relationships). A question *about* a UI topic is not automatically a visual question.
3. **Ask clarifying questions one at a time** — sequential, never a list dump. Wait for the answer before the next question.
4. **Propose 2-3 competing approaches with tradeoffs** — present alternatives; don't silently pick one
5. **Present design sections iteratively** — gain approval incrementally, not all at once
6. **Write design documentation** — save to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
7. **Self-review the spec** — check for gaps, contradictions, ambiguity, and scope creep before handing to the user
8. **Obtain user review and approval** — the user reviews the written spec; not just verbal agreement
9. **Invoke `writing-plans` skill only** — this is the terminal state. No other implementation skills are called from here.

## Design Principles

- Components should have clear purposes and well-defined interfaces
- Design for testability — can someone understand what a unit does without reading its internals?
- Visual companion is offered only for genuinely visual content, as its own dedicated message requiring explicit user acceptance

## What Counts as Visual

Use the browser/visual companion for: UI mockups, architecture diagrams, side-by-side visual comparisons, design polish, spatial relationships.

Use the terminal for: requirements, conceptual choices, tradeoffs, technical decisions, clarifying questions — anything where the answer is words, not visual preference.

## Terminal State

The final action is invoking the `writing-plans` skill exclusively. No other implementation skills are called.
