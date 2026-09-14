# kit-fx — change notes

**Module:** `src/14-render-entities.js` (the fragment primitive) and the two glow
helpers it reuses from `src/13-render-well.js`
**Vendored from:** *originated here (Vector Vortex), destined for coinless-kit as `kit-fx`*
**Current version:** *unversioned — no `VERSION` string yet; the first extraction assigns `0.1.0`*
**Depends on:** a canvas 2D context, and a config object carrying the constants below

---

## Scope

⚠ **This file covers the extractable primitives only.** The rest of
`14-render-entities.js` is game art — the Vector Vortex silhouettes, their
projection through the well's depth model (`entityPoints`) — and does not go to
the kit. Three functions do:

| Function | File | What it is |
|---|---|---|
| `drawPoly(ctx, points, closed)` | `13-render-well.js` | Builds a path from `{x, y}` screen points. No fill, no stroke. |
| `glowStroke(ctx, color, width, alpha)` | `13-render-well.js` | Strokes the **current** path twice under `lighter`: `width × GLOW_WIDE_W` at `GLOW_WIDE_ALPHA × alpha`, then `width` at `GLOW_THIN_ALPHA × alpha`. Restores every context property it sets. |
| `drawFragments(ctx, points, closed, t, color)` | `14-render-entities.js` | Breaks an outline into its own segments and scatters them. |
| `fragmentT(left, total)` | `14-render-entities.js` | Progress `1 − left / total`, clamped to `[0, 1]`. |

---

## Contract summary

`drawFragments` takes an outline the host has already projected to screen
points and draws it **coming apart**: segment `i` (from `points[i]` to
`points[i + 1]`, plus the closing edge when `closed`) moves outward from the
points' centroid by `FRAG_DRIFT × t` px, turns about its own midpoint by
`±FRAG_SPIN × t` rad with the sign alternating by index, and is stroked through
`glowStroke` at alpha `1 − t` and width `FRAG_LINE_W`. At `t = 0` it is the
outline, segment for segment; at `t ≥ 1` (or `NaN`) it draws nothing.

⛔ **It is a pure function of its arguments.** No RNG, no clock, no host state.
The host owns time and passes progress in. That is what makes it safe in a
draw path that runs on a frame clock while the simulation does not — identical
`t` gives identical draw calls, and there is nothing to seed. The "random"
look comes from the outline's own geometry: each segment flies away along its
own outward normal.

⛔ **No per-frame allocation.** One preallocated two-point scratch; the function
is non-reentrant, which is fine for a leaf draw call.

**Constants read** (today off the game's `C`; the kit version takes them as an
options object, per the boundary contract):

| Constant | Vector Vortex value | Meaning |
|---|---|---|
| `FRAG_DRIFT` | 48 | px each segment travels outward by `t = 1` |
| `FRAG_SPIN` | 1.2 | rad each segment turns by `t = 1` |
| `FRAG_LINE_W` | 3.0 | px stroke width |
| `GLOW_WIDE_W` / `GLOW_WIDE_ALPHA` / `GLOW_THIN_ALPHA` | 6.0 / 0.20 / 0.95 | `glowStroke`'s two passes |

```js
// Vector Vortex's wiring (Game.draw()): the freeze is the clock.
if (skimmer.dead) {
  drawFragments(ctx, skimmerPoints(well, skimmer.lane, 0), true,
                fragmentT(Game.hitStopLeft, C.HIT_STOP_DEATH), C.SKIMMER_COLOR);
}
```

⚠ **Extraction work still owed.** The module reads `C` for the constants
above; `drawFragments` must take them as an explicit options argument (or a
`createFx(options)` factory, the `kit-input` shape) before it is a kit module.
Nothing else in it reaches the host.

---

## Changes

Newest last. One entry per change.

### 2026-09-13 — the death fragmentation (unversioned → first draft)

**What changed.** `drawFragments()` and `fragmentT()` added at the foot of
`14-render-entities.js`; `FRAG_DRIFT`, `FRAG_SPIN` and `FRAG_LINE_W` added to
`C`. This notes file created.

**Why.** CS008 P4 (`PLANNED-FEATURES-CS008.md` §5, Paul's U9): the craft breaks
into its own outline segments on death, drifting outward, spinning slightly and
fading, played across the death hit-stop.

**Game-agnostic?** Yes for the two functions — they take screen points, a
progress number and a colour, and name no Vector Vortex entity, state or clock.
No, for the constants' source, which is the game's `C` (see "Extraction work
still owed").

**Backport status.** `not yet`
