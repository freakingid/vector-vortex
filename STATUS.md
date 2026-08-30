# Vector Vortex — STATUS
Version: 0.0.1 · Changeset: CS001 · Phase: P1 · Wells: 16/16 · Tracks: 0/5

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

## Working / verified

- `node build.js` produces `dist/vector-vortex.html`; manifest is checked both
  directions against `src/`.
- `node scratchpad/run-all.js` passes, failure-only output.
- Harness loads `dist/`, not `src/` — the oracle rule holds from commit one.
- GDD §21 is closed — all seven open questions resolved 2026-08-30, see
  `DECISIONS.md`. `ROADMAP.md` now exists.

## Known issues

- None.

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

- CS001 P2 — the depth model: `screenPos`, perspective easing, throat
  derivation, and the wrap/clamp lane-hopping helpers open wells need.

## Playtest asks (open only)

- None yet.
