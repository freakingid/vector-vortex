# Vector Vortex — STATUS
Version: 0.0.1 · Changeset: CS003 (P2 of 5 done) · Wells: 16/16 · Tracks: 0/5

## Phase ledger — CS003

- **P1 — the RNG, the entity contract, the Vaulter.** Done 2026-08-30.
- **P2 — the spawner and the well lifecycle.** Done 2026-08-30.

`01-rng.js`: `mulberry32` + `rngInt` / `rngPick`; `state.seed` and `state.rng`
default from `C.RNG_DEFAULT_SEED`, and `startGame()` (P2) mints the run's real
one. `07-enemies.js`: the `Enemy` base — six fields, three signatures, no
behaviour — and the Vaulter (climb, the L2 vault gate, ungated rim hunting,
`killDepth = 1 - RIM_CONTACT_DEPTH`). Every hop goes through `laneHop()` and
writes back the `dir` it returns. `14-render-entities.js`: `entityPoints()`,
the shared projection all nine enemies will use, plus `invPerspective()` in
`03-wells.js` — an enemy's drawn depth extent scales with its own perspective
position, so it shrinks with distance instead of growing.

Judgment calls: **(a)** added `C.RNG_DEFAULT_SEED` beyond the phase's listed
constants — a default seed is a magic number, and the no-inline-numbers
invariant outranks the list. **(b)** `entityPoints` pulls a silhouette inward
when it would reach past the rim, rather than letting the clamp flatten a
rim-hunting Vaulter into a different shape. **(c)** the hop timer runs during a
hop, so hop *starts* are one `VAULT_INTERVAL` apart; reaching the rim resets it,
so arrival never lunges.

**P2.** `08-spawner.js`: `spawnEnemy(kind, lane, depth)` is the ONE way an
enemy enters `state.enemies` — it owns GDD §6.3's safe-spawn rule (a spawn in
the Skimmer's lane is LOWERED to `SAFE_SPAWN_DEPTH`, never relocated sideways,
so CS004's Carrier splits keep the shape they teach) and the `ENEMY_CAP`
ceiling. `updateSpawner` counts UP to `SPAWN_INTERVAL` and HOLDS there when the
board is full, so a freed slot refills the same step. `wellCleared` is the two
conditions, quota AND no `blocksClear` survivor. `23-main.js`: `enterWell()` /
`nextWell()` / `startGame(seed)`, the enemy pass + end-of-frame filter, the
⚠ temporary `WELL_CLEAR_HOLD` branch, and enemies in the z-order between the
well and the shots. Boot now calls `startGame()`; the debug cycler routes
through `enterWell()`.

Judgment calls: **(a)** `enterWell()` mints a fresh Skimmer at lane 0 — well
lane counts differ, so carrying the craft over is not free, and lives/respawn
are P4's. **(b)** "near the throat" for the lane redraw reuses
`C.READABILITY_DEPTH` rather than adding a knob for the same band. **(c)** the
spawn heading draw happens inside `spawnEnemy`, one draw per spawn, so the
stream stays aligned however a caller got there. **(d)** `update()` calls
`enterWell()` when it finds no Skimmer, which is what keeps `reset()` a pure
shipped-defaults write and still gives the suite a live well on its first step.

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (24 modules); manifest is
  checked both directions against `src/`.
- `node scratchpad/run-all.js` passes, 11 files, zero skips.
- ⛔ P2's three named invariants were mutation-checked: removing the
  safe-spawn clamp, dropping the quota half of the clear condition, and
  resetting the spawn timer on a blocked beat each turn the suite red.
- ⛔ Both of P1's named invariants were mutation-checked, not just asserted: a
  Vaulter that keeps its own heading fails 18 assertions across the six open
  wells, and a constant-depth silhouette fails the two shrink-with-distance
  assertions.
- CS001 closed 2026-08-30 — 16 wells, the depth model, the well renderer. Full
  narrative in `log/CS001.md`.
- CS002 closed 2026-08-30 — the loop, the Skimmer, shots, and all four input
  devices (mouse/keyboard/touch/gamepad), verified on real hardware. Full
  narrative, shipped constants, and the on-hardware pass results in
  `log/CS002.md`.
- `tools/well-lab.html` — well polygons and the perspective curve.
- `tools/feel-lab.html` — traverse-and-stop measurement across the four
  device sensitivity/timing constants. Reachable over LAN via `npm run serve`.

## Known issues

- **Two prior-phase test fixtures now reset before reading defaults.** Boot
  calls `startGame()`, so the live `state` at load is a run in progress with a
  time-derived seed. `test-cs002-p1.js` (the field inventory and
  `skimmer === null`) and `test-cs003-p1.js` (`seed` defaults to
  `RNG_DEFAULT_SEED`) each gained a `G.reset()` before the block that asserts
  shipped defaults. No assertion was weakened or removed.
- **The `state` field inventory moved to `scratchpad/test-registry.js`.**
  `test-cs002-p1.js` asserted a bare `Object.keys(state).length === 8` as a
  build-ahead guard; P1's two legitimate fields turned it into a false alarm.
  An exhaustive list is a global count, and CLAUDE.md puts those in exactly one
  file. A changeset now adds its fields under its own key there; the guard is
  the sum, so a field no changeset claims still fails loudly.
- **`_harness.js` exists twice** — the repo root holds a tracked, stale copy of
  `scratchpad/_harness.js` (older, exports only `C` and `state`). Nothing loads
  it today; a test that reaches one directory too far gets a silently smaller
  surface. Delete or de-duplicate — not P1's to do unprompted.
- A rim Vaulter hunts the Skimmer's *continuous* lane, so a player parked
  between two lane centres has it hopping back and forth across them. It is
  lethal either way (contact tolerance is half a lane, P3), and GDD 6.1 says
  only "direction from `laneDelta`". Flagged for the CS005 tuning pass, in case
  the jitter reads as indecision rather than menace.
- GDD §3.3's `throatOffset` is undefined — no well uses it and the GDD never
  says what it offsets. `wellThroat` defaults it to zero. Design call for
  Paul, not an inference to make silently.
- The Flat well (11) is geometrically degenerate: its rim is a straight line,
  so it renders with zero depth. Same underlying question as `throatOffset`
  above (an offset throat is what would fix it). Natural landing spot: CS004
  (well progression, per `ROADMAP.md`).
- `SKIMMER_COLOR` (`#FFFFFF`) and `VAULTER_COLOR` (`#FF4A4A`) are placeholders,
  recorded with a ⚠ in GDD §4.1 and in `C`. No enemy palette is specified
  anywhere, and `tools/glow-lab.html` does not exist yet.

## Open questions (blocking)

- None.

## Carried tasks (not blocking, no changeset owns them yet)

- Register `vector-vortex` in the Worker's `services/leaderboard/src/registry.js`
  with the seven stats keys, before any submission is attempted.
- Backport `kit-input` (`src/04-input.js`, all four devices, v0.3.0) to
  coinless-kit — separate manual step, verified against that repo's own suite.
- CS006 (death sequence) should confirm the P1 judgment call that devices are
  still drained during hit-stop (`input.sample()` runs, `update()` doesn't).
- `scratchpad/test-registry.js`'s `enemies` count stays at 0 until CS003 P5
  raises it to 1 — that is on P5's closing checklist, and no test reads it yet.
- The Skimmer exposes `dead`; nothing sets it yet. Shots exist with no
  collision pass. Both are CS003 P3/P4's.
- `state.purgeReady` is armed by `enterWell()` and nothing spends it — P3 owns
  the Purge's effect, including GDD §4.3's weak second use, which may want a
  count rather than the boolean P2 landed.
- ⚠ `C.WELL_CLEAR_HOLD`, `state.clearHold` and the branch in `Game.update()`
  that reads them are TEMPORARY and are CS005's to delete when the Dive lands.

## Next up

- CS003 P3 — the collision pass and the Purge. The prompt is in
  `IMPLEMENTATION-PHASES-CS003.md`.

## Playtest asks (open only)

- The Vaulter is now on screen: does the flattened X read as a *threat* at
  throat depth, and is `VAULTER_SIZE` 0.70 enough silhouette to see it coming?
- Does `SPAWN_INTERVAL` 1.60 with `ENEMY_CONCURRENT` 3 hit GDD §12's promise —
  a passive player dead within four seconds, an active one with a kill? Nothing
  can be shot yet (P3), so only the death half is observable this phase.
