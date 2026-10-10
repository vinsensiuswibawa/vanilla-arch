---
target: detail page skeleton (shot 6d), chrome and structure
total_score: 21
max_score: 28
na_heuristics: 5,9,10
p0_count: 0
p1_count: 1
target_identity: "file:C:\\Users\\vinse\\Documents\\Vanilla Arch\\components\\detail\\Detail.tsx"
target_fingerprint: "sha256:6cbfe56cd1fa392e0d21bf6b2886efd36d0d6dd39567da3b286657645c084b83"
target_path: "C:\\Users\\vinse\\Documents\\Vanilla Arch\\components\\detail\\Detail.tsx"
timestamp: 2026-10-08T17-17-07Z
slug: components-detail-detail-tsx
---
Method: DEGRADED single-context (sub-agents not used; this session only spawns agents on request).

# Critique: detail page skeleton (shot 6d), chrome and structure

Score 21/28 (heuristics 5, 9, 10 n/a). Detector: 0 findings. Live overlay not attempted (no human browser).

Priority issues
1. [P1] Sound had no mute on the detail page (M disabled while a listing was open). Partly fixed: M works again; a visible control is a user decision.
2. [P2] The 20% P0 zoom puts the car's nose under "Jump to specs" and "Make · year" at 1440. Move the P0 anchor right (about 0.52) or move the link.
3. [P2] Offscreen controls stay tabbable; make sections inert until near (6e). The pill is now first in tab order.
4. [P2] Emblem placeholder overlapped the next photo (160 wide, storyboard 80). Fixed.
5. [P3] Pill is 36 px high against the 44 px target in PRODUCT.md (the plan specifies 36).

Personas: Sam (offscreen focusables), Alex (no key hints, lag cannot be skipped), Riley (16:9 car size, E right-aligned).
