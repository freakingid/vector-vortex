# Vector Vortex — STATUS
Version: 0.0.2 · Changeset: CS006 (not started) · Wells: 16/16 · Enemies: 6/6 Classic · Tracks: 0/5

## Phase ledger — CS006

*Nothing yet.* `PLANNED-FEATURES-CS006.md` and `IMPLEMENTATION-PHASES-CS006.md`
are not written. One line per phase here; reasoning goes to `log/CS006.md`.

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (24 modules); the manifest
  is checked both directions against `src/`.
- `node scratchpad/run-all.js` passes: 24 test files, zero skips, ~7 s.
- CS001 closed — 16 wells, the depth model, the well renderer.
- CS002 closed — the loop, the Skimmer, shots, and all four input devices
  (mouse/keyboard/touch/gamepad), verified on real hardware.
- CS003 closed — the seeded RNG, the entity contract, the Vaulter, the spawner
  and well lifecycle, the one collision pass, the Purge, death, lives, respawn
  and the game-over stop.
- CS004 closed — the Carrier and `splitLanes()`, the Weaver and its bolt, the
  Thorn and the chip economy, the `anchored` contract field, the debug bench.
- CS005 closed 2026-08-30 — the boundary lattice and `laneHop`'s fold-bound
  parameter, the Drifter, the Surger, the two remaining cargo rows, and the
  six-kind §17 soak. ⛔ **The Classic roster is complete at six and GDD §6.2's
  variant table at three. Four of GDD §4.5's five death conditions are live** —
  only item 5 (a Thorn during the Dive) is unwired, and it is not a `killDepth`.
  Full narrative, shipped constants, every judgment call and the thirty-seven-row
  mutation-check record are in `log/CS005.md`.
- ⛔ **Read GDD §6.5 before adding an enemy.** Seven contract fields, six wiring
  points, the one array / one spawn entry / one well entry / one collision pass
  rule, why `Carrier.onShot()` may push into `state.enemies` from inside the
  collision pass's own loop, and — new in CS005 — that `killDepth` is a field an
  entity may **mutate and restore** within its own cycle.
- ⛔ **Three soaks, and they prove different things on different boards.**
  `test-cs003-p5.js` runs the shipped `["vaulter"]` and catches GDD §3.5's
  wrapping hop with a per-tick lane SPEED bound. `test-cs004-p5.js` runs a
  three-kind list and asserts the STRONGER exact-lane form for the four entities
  that do not hop. `test-cs005-p5.js` runs six kinds and carries the per-entity
  bounds in three tiers. ⛔ **CS005 edited neither closed soak**, and a future
  changeset should extend the pattern the same way rather than widening a closed
  file's assertions.
- ⛔ **On a boundary rider the LATTICE is where §17 item 3 stands, not the speed
  bound.** Proved by mutation at the CS005 close: a wrapping Drifter cross
  leaves both a range check and a per-tick speed bound green, because
  `crossDur()` scales with the cross distance. GDD §3.5 and
  `RATIONALE.md#boundary-lattice` carry it.
- ⛔ **`test-cs004-p1.js` carries a GOLDEN spawn-lane sequence** recorded from
  the build at `9ebd27b`, before `pickSpawnKind()` existed. It is the only guard
  on the no-draw rule that works end to end: the determinism hashes compare two
  runs of the *same* build, so a stream shift is self-consistent there and
  invisible. Retuning the spawner legitimately re-records it; a stray RNG draw
  does not.
- `tools/well-lab.html` — well polygons and the perspective curve.
- `tools/feel-lab.html` — traverse-and-stop measurement across the four device
  sensitivity/timing constants. Reachable over LAN via `npm run serve`.

## Known issues

- ⛔ **A STANDING THORN HOLDS A SPAWNER SLOT, and the well can stall.** Found by
  CS004 P5's soak, measured, not inferred. `updateSpawner()` blocks on
  `state.enemies.length >= min(ENEMY_CONCURRENT, ENEMY_CAP)` — a count of
  **everything in the one array, Thorns included** — and `ENEMY_CONCURRENT` is
  3. A Thorn nobody shoots is permanent, so **three standing Thorns hold the
  spawner shut**: the quota never spends, the well never clears, and because a
  Thorn does not kill, nothing threatens the player either. Repro: three Thorns
  at any length, quota full, no input — after 100 simulated seconds the level,
  the quota and the board are where they started.

  ⚠ **Unreachable in a played build today**, and only because
  `C.DEBUG_SPAWN_KINDS` ships as `["vaulter"]`. It goes **live the moment
  CS006's introduction schedule puts Weavers at L5.** ⛔ Not fixed yet: the
  answer is a design call — *does the concurrency budget count threats or
  entities? does the clear condition change? does a Thorn expire?* — and it
  belongs to the changeset that makes it reachable. Both closing soaks work
  around it with a documented fixture (`C.ENEMY_CONCURRENT` raised to
  `C.ENEMY_CAP` for the six-well pass only, put back afterwards). ⛔
  `C.ENEMY_CAP` is untouched; it is a readability ceiling, not a difficulty knob.

  ⚠ **CS005 gave that design call two new inputs and answered neither.**
  1. A **riding Drifter** is temporarily neither a threat the player can remove
     nor a slot they can free — but it is **self-resolving where a Thorn is
     not**, and for reasons that are decisions rather than luck: it crosses on a
     fixed cadence, so the window is bounded by `C.DRIFT_RIDE_TIME`, and it
     climbs in **both** phases, so it reaches the rim and forces a resolution.
     "Threats or entities?" now has a case where the honest answer is "neither,
     for 0.85 s".
  2. ⛔ A **rim-parked Carrier is NOT self-resolving**, and it stalled a seeded
     run at the CS005 close: one Carrier at depth 1.00 with the quota spent, for
     the full 30,000-tick cap. A Carrier is "slow, one lane, never hops" and has
     no rim behaviour at all, so a well whose only survivor is a rim Carrier
     never clears unless the player enters its lane. ⚠ **Three of the six roster
     classes park rather than hunt** — Carrier, Weaver, Surger. The Vaulter
     hunts and the Drifter homes; those two will come to you. Fixed in the soak
     *fixture*, never in the build. This is the same design call seen from the
     other side and it is CS006's.
- **`drawWell()`'s `laneState` parameter is still unwired.** Lane occupancy
  lighting (GDD §3.7) belongs with the dim band, in CS006. ⛔ The Surger's
  telegraph shipped as an **entity draw** (`drawSurgeLane`) and must not be
  moved onto `laneState` when that lands: `isLaneLit()` is a boolean over spokes
  and cannot express a progressive fill.
- **`tools/glow-lab.html` does not exist and has no owner.** It is the
  instrument for the **global** glow constants, which CS005 did not touch — both
  new entities read as per-entity multipliers on `laneLineWidth` only. What
  CS005 did instead is a headless three-channel separation gate in
  `test-cs005-p2.js`, so a retune cannot silently collapse the Drifter's two
  states into one. Palette asks: see `PLAYTEST.md`.
- **The whole enemy palette is ⚠ provisional.** `SKIMMER_COLOR`,
  `VAULTER_COLOR` and the six CS004 P1 added are inference, not design — the GDD
  specifies no enemy palette. They were chosen **as one set** against the
  constraint recorded in `C`: an enemy colour must read against all seven band
  colours (§3.6), because the well cycles and the enemies do not. ⛔ All six are
  judgeable on hardware now, and both CS005 colours for the first time.
- ⛔ **`src/07-enemies.js` wants splitting, and the moment is CS011.** Measured
  at the CS005 close. The measurement, the seam and the reasoning are in
  `ROADMAP.md` under "Still open" — ⛔ not restated here.
- **GDD §12's four-second promise is not delivered.** A passive player does die
  on level 1, but not reliably within four seconds — it needs spawn lanes
  weighted toward the player's lane. Settled: that is onboarding and it is
  **CS014's**.
- **A rim Vaulter hunts the Skimmer's *continuous* lane**, so a player parked
  between two lane centres has it hopping back and forth across them. Lethal
  either way, and GDD §6.1 says only "direction from `laneDelta`". Flagged for
  CS006's tuning pass in case the jitter reads as indecision rather than menace.
- **GDD §3.3's `throatOffset` is undefined** — no well uses it and the GDD never
  says what it offsets. `wellThroat` defaults it to zero. Design call for Paul.
- **The Flat well (11) is geometrically degenerate**: its rim is a straight
  line, so it renders with zero depth. Same underlying question as
  `throatOffset`. Design call for Paul before CS006.
- ⛔ **Playtest asks live in `PLAYTEST.md`**, twenty-eight of them, four marked
  ⛔. Not session context — pull it up at the machine with a build in front of
  you, never during a build phase.

## Open questions (blocking)

- None.

## Carried tasks (not blocking, no changeset owns them yet)

- Register `vector-vortex` in the Worker's `services/leaderboard/src/registry.js`
  with the seven stats keys, before any submission is attempted.
- Backport `kit-input` (`src/04-input.js`, all four devices, v0.3.0) to
  coinless-kit — a separate manual step, verified against that repo's own suite.
- ⚠ `C.WELL_CLEAR_HOLD`, `state.clearHold` and the branch in `Game.update()`
  that reads them are TEMPORARY and are CS006's to delete when the Dive lands.
- ⚠ `C.DEBUG_SPAWN_KINDS`, `pickSpawnKind()` (`08-spawner.js`) and the six debug
  spawn actions in `23-main.js` are TEMPORARY. GDD §8.1's introduction schedule
  replaces all of them, and that is CS006's. ⛔ The list is a bench, never a
  difficulty knob — do not tune the game by editing it. ⛔ One key per §6.1
  roster row, none for a Carrier variant; six plus the `0` row is where the
  bench stops.
- `state.screen === "gameover"` is a STOP with nothing on screen but the frozen
  board. `r` restarts. CS007 owns the screen, the submission and the real
  restart flow, and the `restart` debug action should be folded into it rather
  than left as a second way in.
- **No scoring anywhere.** `PTS_VAULTER`, `PTS_CARRIER`, `PTS_WEAVER`,
  `PTS_THORN` and `PURGE_SAVED_BONUS` are deliberately unread until `addScore()`
  lands in CS007, which is the one entry point (`CLAUDE.md`, Scoring). ⚠ The
  Drifter and the Surger shipped **no** points constants at all — GDD §6.1 gives
  the Drifter 250/500/750 by depth and the Surger 200, and CS007 lands both.
- ⛔ `scratchpad/test-registry.js` carries TWO counts and they are not the same
  number. ✅ **Settled: `enemies` is 6** (GDD §6.1 roster rows, complete) **and
  `enemyKinds` is 9** (`ENEMY_KINDS` rows). ⛔ The next mover of either is an
  Overdrive enemy (GDD §6.4), not a cargo.

## Next up — CS006

Level flow, and it is the changeset that makes several things above reachable at
once. `PLANNED-FEATURES-CS006.md` is unwritten; the scope from `ROADMAP.md` is
**§5, §3.6–3.7, §8, §15.6** — the Dive, well progression and colour bands, the
heat clock, GDD §8.1's introduction schedule, and telemetry as the tuning
instrument.

Four things it inherits, in the order they will bite:

1. ⛔ **The introduction schedule is what makes the spawner stall live.** It
   deletes `C.DEBUG_SPAWN_KINDS` and puts Weavers at L5, so the design call
   above has to be answered *in the same changeset*, not discovered by it.
2. ⛔ **The heat clock is what breaks `SURGE_DISCHARGE < RESPAWN_INVULN`.** That
   invariant is asserted from the constants in `test-cs005-p3.js`; a heat curve
   that raises the discharge past the invulnerability window turns it red, which
   is the point.
3. `C.WELL_CLEAR_HOLD` and `state.clearHold` are the Dive's placeholder and are
   deleted, not kept.
4. `laneState` and the dim band land together.

⚠ **One clock: `game.level`** (`CLAUDE.md`, Config; `DIFFICULTY-NOTES.md`). Every
heat-derived value comes off it. No parallel clocks.
