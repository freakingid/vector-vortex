# IMPLEMENTATION-PHASES-CS001

One phase per Claude Code session. `/clear` between phases. Commit per phase on
`main`; never push.

Each phase below is the literal prompt to paste. Keep them self-contained — a
session reads `CLAUDE.md` and `STATUS.md` automatically, and nothing else unless
the prompt names it.

---

## P0 — repo skeleton ✅ done

---

## P1 — the sixteen well definitions

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §0, §1, §3.
>
> Build `src/03-wells.js`: the sixteen well definitions as data, per GDD §3.3
> and §3.4. Each is `{ id, name, closed, lanes, rim: [{x,y}...], throatScale }`
> with rim vertices in a normalized space centred on the origin.
>
> Write `scratchpad/test-cs001-p1.js` asserting: sixteen wells exist; each one's
> vertex count agrees with its lane count given its topology; exactly six carry
> `closed: false` and they are the six named in the GDD; no coordinate is NaN or
> outside the normalized range.
>
> Update `scratchpad/test-registry.js`'s `COUNTS.wells` and `COUNTS.openWells`
> — that file is the only place a global count may appear.
>
> Do not build the projection, the renderer, or anything that moves. Update
> `STATUS.md` and commit.

---

## P2 — the depth model

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §3.2, §3.5.
>
> Build the projection in `src/03-wells.js`: `screenPos(well, lane, depth)`, the
> perspective easing from `C.PERSPECTIVE_EXP`, throat derivation from
> `throatScale`, and the lane wrap/clamp helpers that every later system will
> use.
>
> ⛔ Open wells are not closed wells with a clamp. The helper an enemy will use
> to hop lanes must reverse at the wall, not wrap — build that now, correctly,
> even though no enemy exists yet.
>
> Test per GDD §17 items 2 and 3, including the 5,000-tick lane-bounds soak on
> every open well.
>
> Update `STATUS.md` and commit.

---

## P3 — static well rendering + well-lab

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §3.6, §10.
>
> Build `src/13-render-well.js`: `drawPoly` and `glowStroke` per §10.2, the
> depth-varying line weight, and the band palette from §3.6. A debug key cycles
> all sixteen wells.
>
> Build `tools/well-lab.html` for tuning `PERSPECTIVE_EXP` and the glow
> constants against a real canvas. It duplicates whatever slice of logic it
> needs — drift there produces a bad preview, never a bad build.
>
> Update `STATUS.md` and commit.
