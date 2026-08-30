# Vector Vortex — STATUS
Version: 0.0.1 · Changeset: CS003 (P4 of 5 done) · Wells: 16/16 · Tracks: 0/5

## Phase ledger — CS003

- **P1 — the RNG, the entity contract, the Vaulter.** Done 2026-08-30.
- **P2 — the spawner and the well lifecycle.** Done 2026-08-30.
- **P3 — collision and the Purge.** Done 2026-08-30.
- **P4 — death, lives, respawn.** Done 2026-08-30.

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

**P3.** `09-collision.js`: the ONE collision pass — shots vs enemies then
enemies vs the Skimmer, each front to back, called from `Game.update()` after
the entity pass and before the filters. ⛔ 1-D throughout: `laneDelta` within
`C.HIT_LANE_TOL` plus a `depth` overlap within `C.HIT_DEPTH_TOL`, no projected
point anywhere. A shot resolves against at most one enemy per step — the
`break` is unconditional, so an enemy that declines the shot stops its search
too. `killSkimmer()` is the one death route and today sets `dead` only, so P4
fills in one function. The Purge is here too: `state.purgeUses` counts up (1 =
clear every `purgeable`, 2 = the rim-nearest one, 3+ = nothing), re-armed to
zero by `enterWell()`, fired on the rising edge of the held `input.purge`
against `state.purgeLatched`. `Game.update()` now filters BOTH arrays after the
pass, so a consumed shot frees its `SHOT_MAX` slot the same step.

Judgment calls: **(a)** the Purge consumer lives in `09-collision.js`, not
`05-skimmer.js` — CLAUDE.md's code map assigns it to 05, but that map also
assigns "firing" there and firing shipped in `06-shots.js` in CS002; it is a
read-order skeleton, and the Purge is mass entity destruction over the same
array the collision pass walks. Worth a line in CLAUDE.md's map when someone is
next editing it. **(b)** `state.purgeReady` (P2's boolean) was REPLACED by
`purgeUses`, not supplemented — a boolean cannot express GDD 4.3's weak second
use, and P2's own carried task predicted this. `test-cs003-p2.js` and
`test-registry.js` were updated; no assertion was weakened. **(c)** the Purge
resolves BEFORE collision, so a charge spent on the step an enemy arrives in
your lane saves you rather than firing one step late. **(d)** `enterWell()`
deliberately does NOT clear `purgeLatched` — it is input state, not well state,
and clearing it would let a player still holding the button spend the new
charge without releasing. **(e)** a second use with no legal target is still
spent; the charge is consumed by the press, not the result.

**P4.** `killSkimmer()` is filled in and is the whole death sequence: the
invulnerability guard, one life, `state.purgeLatched`, the `screen = "gameover"`
stop at zero, and `Game.hitStop(C.HIT_STOP_DEATH)`. `state` gains `lives` and
`invulnTime` (counts UP, starts AT `RESPAWN_INVULN` — already expired).
`23-main.js` gains `spawnSkimmer()` — the ONE `new Skimmer` — and
`respawnSkimmer()`, which fires on the first live step that sees `skimmer.dead`,
pushes enemies down and mints the craft in the lane it died in. `update()` gains
the game-over early return above everything, and the respawn/aging branch. `r`
is a named debug action beside `cycleWell`, calling `startGame()`.

Judgment calls: **(a)** ⚠ **SETTLED — Paul, 2026-08-30.** GDD 4.4's rim push is
a CLAMP over every lane, not a narrow band at the rim — the narrow reading
leaves a Vaulter at 0.9 climbing into the kill band well inside the
invulnerability window, which is the death the rule exists to prevent. It is
deliberately more generous than §4.4's wording alone requires; do not narrow it
back. P5 writes this into §4.4's "Shipped, CS003" paragraph as settled, not as
an inference. **(b)** the respawn lives in `23-main.js` beside
`enterWell()`, not next to `killSkimmer()`: P3's comment said P4 would fill it
in "HERE", but it cannot be inside `killSkimmer` (nothing scheduled at death
advances during the freeze), and it moves enemies. **(c)** the invulnerability
clock is the ELSE branch of the respawn check, so the respawn step is not also
aged and the window is exactly `RESPAWN_INVULN`, not one step short. **(d)** the
guard is in `killSkimmer()` and not the collision pass, so CS004/CS005's four
remaining death conditions inherit it. **(e)** `runAction("restart")` clears
`hitStopLeft` — `startGame()` cannot reach it, and a fresh run must not inherit
the freeze that ended the last one. **(f)** `skimmerBlinkVisible()` takes the
TIMER, not `state`, so `05-skimmer.js` still reads no game global.

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (24 modules); manifest is
  checked both directions against `src/`.
- `node scratchpad/run-all.js` passes, 13 files, zero skips.
- ⛔ P4's named invariants were mutation-checked, not merely asserted. Each of
  these turns the suite red: an `invulnTime` born at 0, dropping the
  invulnerability guard, dropping the rim push, making the push an assignment
  instead of a clamp, dropping the purge re-latch, respawning at lane 0 instead
  of the lane it died in, dropping the game-over early return, aging the invuln
  clock on the respawn step too, a restart that inherits the old freeze, and
  removing either the hit-stop or the `lives -= 1`.
- ⛔ P3's named invariants were mutation-checked, not merely asserted. Each of
  these turns the suite red: a conditional `break` in the shot loop, a bare
  `(a - b)` in place of `laneDelta`, dropping the `killDepth === null` guard,
  a tie-break to the highest lane, a `>=` that loses array order, firing the
  Purge on the level instead of the edge, and a first Purge that ignores
  `purgeable`.
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
- **`test-cs002-p2.js`'s movement soak now pins `invulnTime = 0`.** That soak
  has run in a well with enemies in it since CS003 P2; P4 gave contact a
  consequence, so three deaths reached the game-over stop and the craft stopped
  moving for most of the remaining ticks — `sawIdle` failed on Trough,
  Double-Vee and Fan. Holding the respawn window open makes the craft
  unkillable, which restores the conditions the soak was written for. No
  assertion was weakened; every one now gets its full `SOAK_TICKS`.
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
- `scratchpad/test-registry.js`'s `enemies` count stays at 0 until CS003 P5
  raises it to 1 — that is on P5's closing checklist, and no test reads it yet.
- CLAUDE.md's code map still lists "firing, Purge" under `05-skimmer.js`; both
  shipped elsewhere (`06-shots.js`, `09-collision.js`), and death/respawn is
  split between `09-collision.js` and `23-main.js`. Not a phase's to rewrite a
  rule doc unprompted — a correction for whoever next edits that map (P5 is
  already scoped to touch it).
- `state.screen === "gameover"` is a STOP with nothing on screen but the frozen
  board and the craft that died on it. `r` restarts. CS006 owns the screen, the
  submission and the real restart flow, and the `restart` debug action should be
  folded into it rather than left as a second way in.
- ⚠ `C.WELL_CLEAR_HOLD`, `state.clearHold` and the branch in `Game.update()`
  that reads them are TEMPORARY and are CS005's to delete when the Dive lands.

## Next up

- CS003 P5 — the invariant soak, the docs, and the close. The prompt is in
  `IMPLEMENTATION-PHASES-CS003.md`. ⛔ Its closing checklist includes raising
  `enemies` to 1 in `scratchpad/test-registry.js`, correcting GDD §6.5's "five
  places" to six, and moving both CS003 planning docs into `archive/`.

## Playtest asks (open only)

- The Vaulter is now on screen: does the flattened X read as a *threat* at
  throat depth, and is `VAULTER_SIZE` 0.70 enough silhouette to see it coming?
- Does `SPAWN_INTERVAL` 1.60 with `ENEMY_CONCURRENT` 3 hit GDD §12's promise —
  a passive player dead within four seconds, an active one with a kill? Both
  halves are fully observable now — a death costs a life and freezes the board.
- Does the death sequence read? 1.2 s of hit-stop with no fragmentation and no
  sound is a long time to look at a frozen board — CS006 adds both, but the
  freeze LENGTH is settled now and worth judging bare.
- Is `RESPAWN_PUSH_DEPTH` 0.55 far enough? The clamp plus `RESPAWN_INVULN` 1.5 s
  is meant to guarantee a Vaulter cannot climb back into contact before the
  blink stops. It is provable at `VAULT_CLIMB` 0.18; it stops being provable the
  moment CS005's heat curve raises the climb rate.
- Is `HIT_DEPTH_TOL` 0.05 generous enough that a shot fired at a climbing
  Vaulter connects when it looks like it should? The band is ~3x the distance a
  shot covers in one step, so misses should read as aim, never as luck.
