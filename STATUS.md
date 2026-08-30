# Vector Vortex — STATUS
Version: 0.0.1 · Changeset: CS001 · Phase: P2 · Wells: 16/16 · Tracks: 0/5

## Phase ledger — CS001

- P0 — Repo skeleton. `build.js` (manifest-checked concat), `src/shell.html`,
  `src/00-config.js` (C, grouped, populated from GDD defaults), 23 module
  placeholders, `scratchpad/` harness + runner + registry, smoke test. Build and
  suite green: 24 modules, 2 test files passing.

- P1 — Well definitions. `src/03-wells.js`: sixteen wells as data, per GDD
  §3.3/§3.4 — `{ id, name, closed, lanes, rim, throatScale }`, rim vertices in
  a normalized `[-1,1]` space centred on the origin. Closed wells: rim length
  equals lane count (loop). Open wells: rim length is lane count + 1 (strip).
  The six open wells (Vee, Stair, Trough, Flat, Double-Vee, Fan) match GDD
  §3.4 exactly. `scratchpad/test-cs001-p1.js` added, asserting count, per-well
  vertex/lane agreement, the open-well set, and no NaN/out-of-range
  coordinates. `_harness.js`'s `buildGame()` tail now also returns `WELLS`.
  `test-registry.js`'s `COUNTS.wells`/`COUNTS.openWells` already held 16/6
  from P0 — no change needed there. No projection, renderer, or movement — that
  is P2/P3. Build and suite green: 24 modules, 3 test files passing.

- P2 — The depth model. `src/03-wells.js` gains the projection below the data:
  `screenPos(well, lane, depth)`, `perspective()` from `C.PERSPECTIVE_EXP`,
  memoized `wellThroat`/`wellCentroid` (rim scaled toward centroid by
  `throatScale`), `rimPoint`/`throatPoint`, and lane space:
  `laneWrap`/`laneClamp`/`laneNormalize`/`laneDelta`/`laneHop`/`laneAtWall`.
  ⛔ `laneHop` is the wall helper — it mirror-folds on open wells and returns
  `{lane, dir}`, so a hopper writes the direction back and the wall and the
  hopper's heading stay one clock. Closed wells wrap and never reverse.
  ⛔ `lane === i` is the CENTRE of lane i (vertex param `i + 0.5`); a
  fractional lane walks the rim polygon, not the chord, so corners stay on the
  wire. New `C` knobs: `WORLD_W`/`WORLD_H` (matching the shell canvas) and
  `WELL_CX`/`WELL_CY`/`WELL_RADIUS`. `_harness.js` now names its exports in an
  explicit list rather than a hand-written tail. `scratchpad/test-cs001-p2.js`
  covers §17 items 2 and 3, including the 5,000-tick lane-bounds soak on all
  six open wells plus a closed-well mirror soak; verified against six mutants
  (open-wrap, open-clamp, half-lane offset, linear perspective, unwrapped
  `laneDelta`, dropped `dir`) — each fails the suite. No renderer, no entities.
  Build and suite green: 24 modules, 4 test files, 492 P2 assertions.

## Working / verified

- `node build.js` produces `dist/vector-vortex.html`; manifest is checked both
  directions against `src/`.
- `node scratchpad/run-all.js` passes, failure-only output.
- Harness loads `dist/`, not `src/` — the oracle rule holds from commit one.
- GDD §21 is closed — all seven open questions resolved 2026-08-30, see
  `DECISIONS.md`. `ROADMAP.md` now exists.

## Known issues

- GDD §3.3 lists `throatOffset` in the well shape, but no well defines one and
  the GDD never says what it offsets. `wellThroat` accepts it and defaults it
  to zero (applied after the scale, shifting the whole throat), so the sixteen
  shipped wells are unaffected. ⛔ Its semantics are UNDEFINED, not decided —
  if a later phase wants an offset throat, that is a design call for Paul, not
  an inference from this implementation.

## Open questions (blocking)

- None. GDD §21 #2 and #3 both resolved 2026-08-30 — see `DECISIONS.md`.

## Carried tasks (not blocking CS001)

- Register `vector-vortex` in the Worker's `services/leaderboard/src/registry.js`
  with the seven stats keys, before any submission is attempted.
- ~~Vendor kit modules~~ — done. All four (`kit-names` 0.1.0, `kit-storage`
  0.1.0, `kit-profile` 0.1.1, `kit-leaderboard` 0.2.0) are in `lib/`, unmodified,
  each with a `.NOTES.md`.
- GDD §15.1 was rewritten: `kit-storage` owns the keyspace, so the invented
  `vv_*` key table is gone. `CLAUDE.md`'s save-data table follows it.

## Next up

- CS001 P3 (closing) — `src/13-render-well.js`: `drawPoly`, `glowStroke`,
  depth-varying line weight, the §3.6 band palette, a debug key cycling all
  sixteen wells; `tools/well-lab.html` for tuning `PERSPECTIVE_EXP` and the
  glow constants. Then close CS001 per the phase prompt.
- P3 tunes `WELL_CX`/`WELL_CY`/`WELL_RADIUS` against a real canvas — they were
  picked to be sane, not composed, and well-lab is where they get chosen.

## Playtest asks (open only)

- None yet.
