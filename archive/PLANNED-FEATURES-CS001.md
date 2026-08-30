# PLANNED-FEATURES-CS001 — Repo skeleton and well geometry

**Changeset:** CS001 · **Status:** P0 done, P1 next
**GDD sections in scope:** §3 (The Well), §16 (Technical architecture)

Template for every changeset. Copy this shape; keep the four headed sections.

---

## Why this changeset exists

The depth model is the decision every later system inherits. Getting
`(lane, depth)` and the sixteen well definitions right — and proving them
against the harness — is what makes the rest of the game cheap to build.

## What ships

- P0 — repo skeleton, build, harness, smoke test. **Done.**
- P1 — `src/03-wells.js`: the 16 definitions as DATA, open/closed flags, lane
  counts, rim vertices.
- P2 — the depth model: `screenPos(lane, depth)`, the perspective curve,
  wrap/clamp helpers.
- P3 — `src/13-render-well.js`: draw a static well, all 16 selectable by a debug
  key. `tools/well-lab.html`.

## Acceptance criteria

- [ ] All 16 wells defined; lane count matches vertex count for every one.
- [ ] Exactly 6 wells carry `closed: false` (Vee, Stair, Trough, Flat,
      Double-Vee, Fan).
- [ ] `screenPos` returns finite coordinates for every `(lane, depth)` pair
      across all 16 wells — no NaN, tested at depth 0, 0.5, 1.
- [ ] Lane wrap on closed wells and clamp on open wells, both covered by test.
- [ ] The Twist (figure-eight) renders with crossing lanes and needs no special
      case in the projection code.
- [ ] `run-all.js` green.

## ⛔ Scope boundaries — what this changeset does NOT touch

No entities, no input handling, no audio, no HUD, no meta systems. The well is
static and nothing moves on it. Resist adding a test ship "just to see it" — that
is P2 of CS002 and it will be built against a spec.
