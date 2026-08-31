# Vector Vortex — STATUS
Version: 0.0.3 · Changeset: CS007 (not started) · Wells: 16/16 · Enemies: 6/6 Classic · Tracks: 0/5

## Phase ledger — CS007

One line per phase here; reasoning goes to `log/CS007.md`. Nothing yet.

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (24 modules); the manifest
  is checked both directions against `src/`.
- `node scratchpad/run-all.js`: **29 test files, all green, zero skips.**
- CS001 closed — 16 wells, the depth model, the well renderer.
- CS002 closed — the loop, the Skimmer, shots, and all four input devices
  (mouse/keyboard/touch/gamepad), verified on real hardware.
- CS003 closed — the seeded RNG, the entity contract, the Vaulter, the spawner
  and well lifecycle, the one collision pass, the Purge, death, lives, respawn
  and the game-over stop.
- CS004 closed — the Carrier and `splitLanes()`, the Weaver and its bolt, the
  Thorn and the chip economy, the `anchored` contract field, the debug bench.
- CS005 closed — the boundary lattice and `laneHop`'s fold-bound parameter, the
  Drifter, the Surger, the two remaining cargo rows, the six-kind §17 soak.
  ⛔ **The Classic roster is complete at six and GDD §6.2's variant table at
  three.**
- CS006 closed 2026-08-31 — the +1 renumber and the CS006/CS007 split, past-99
  well progression and the colour-band roll, `throatOffset` and the two
  degenerate wells behind `C.MIN_LANE_SPOKE_PX`, **the Dive**, and `laneState`
  gated to the dim band. ⛔ **All five of GDD §4.5's death conditions are now
  live.** ⛔ **The between-wells hold is DELETED, not joined** — neither
  `C.WELL_CLEAR_HOLD` nor `state.clearHold` survives in the built file. Full
  narrative, the shipped constants, every judgment call, the seven closed-file
  edits, the acceptance-criteria verdicts and the ten-row mutation record are in
  `log/CS006.md`.
- ⛔ **Read GDD §6.5 before adding an enemy.** Seven contract fields, six wiring
  points, the one array / one spawn entry / one well entry / one collision pass
  rule, and — CS006 — **the Dive**: an entity that is `blocksClear: false` and
  not `anchored` must decide explicitly whether it survives a dive.
  `startDive()` filters to `anchored`, so today the answer is *no*.
- ⛔ **Four soaks, and they prove different things on different boards.**
  `test-cs003-p5.js` runs the shipped `["vaulter"]` list and catches GDD §3.5's
  wrapping hop with a per-tick lane SPEED bound. `test-cs004-p5.js` runs three
  kinds and asserts the STRONGER exact-lane form. `test-cs005-p5.js` runs six
  kinds and carries the per-entity bounds in three tiers. `test-cs006-p5.js`
  owns **the Dive**. ⛔ A future changeset extends the pattern with a fifth file
  rather than widening a closed one.
- ⛔ **`test-cs006-p5.js` carries the count-based form of the no-draw rule**, and
  it is what CS007 needs. Draws per interval spawn are `spawnEnemy`'s 1 (the
  heading) plus `pickSpawnLane`'s bounded `[1, C.SPAWN_LANE_TRIES]`, with no
  third while `C.DEBUG_SPAWN_KINDS` has one entry — each counted directly on the
  shipped function. ⛔ **It needs no baseline and survives every retune**, which
  is what lets CS007 move `GOLDEN_LANES` without laundering a stray draw into it.
- ⛔ **`test-cs004-p1.js`'s `GOLDEN_LANES` is still on its ORIGINAL recording
  from `9ebd27b`** and CS006 did not touch it — measured green, not assumed.
  ⚠ CS007's introduction schedule is what legitimately re-records it, once, with
  the cause named.
- ⛔ **On a boundary rider the LATTICE is where §17 item 3 stands, not the speed
  bound.** Proved by mutation at the CS005 close: a wrapping Drifter cross leaves
  both a range check and a per-tick speed bound green, because `crossDur()`
  scales with the cross distance. GDD §3.5 and `RATIONALE.md#boundary-lattice`.
- `tools/well-lab.html` — well polygons, the perspective curve, live
  `throatOffset` sliders and a **Legibility** readout (shortest lane-**centre**
  spoke, its lane, the max/min ratio, PASS/FAIL against `C.MIN_LANE_SPOKE_PX`).
  ⚠ Its duplicated slice agrees with the build to 1e-13 px on all sixteen wells;
  ⛔ **the visual audition has not happened** — the ask is in `PLAYTEST.md`.
- `tools/feel-lab.html` — traverse-and-stop measurement across the four device
  sensitivity/timing constants. Reachable over LAN via `npm run serve`.

## Known issues

- ⛔ **A STANDING THORN HOLDS A SPAWNER SLOT, and the well can stall.** Found by
  CS004 P5's soak, measured, not inferred. `updateSpawner()` blocks on
  `state.enemies.length >= min(ENEMY_CONCURRENT, ENEMY_CAP)` — a count of
  **everything in the one array, Thorns included** — and `ENEMY_CONCURRENT` is
  3. A Thorn nobody shoots is permanent, so **three standing Thorns hold the
  spawner shut**: the quota never spends, the well never clears, and nothing
  threatens the player either. Repro: three Thorns at any length, quota full, no
  input — after 100 simulated seconds the level, the quota and the board are
  where they started.

  ⚠ **Unreachable in a played build today**, and only because
  `C.DEBUG_SPAWN_KINDS` ships as `["vaulter"]`. It goes **live the moment
  CS007's introduction schedule puts Weavers at L5.** ⛔ Not fixed: the answer is
  a design call — *does the concurrency budget count threats or entities? does
  the clear condition change? does a Thorn expire?* — and it belongs to the
  changeset that makes it reachable. **Three** closing soaks now work around it
  with the same documented fixture (`C.ENEMY_CONCURRENT` raised to
  `C.ENEMY_CAP`, put back afterwards and asserted back). ⛔ `C.ENEMY_CAP` is
  untouched; it is a readability ceiling, not a difficulty knob.

  ⚠ **CS005 gave that design call two inputs and answered neither.**
  1. A **riding Drifter** is temporarily neither a threat the player can remove
     nor a slot they can free — but it is **self-resolving where a Thorn is
     not**: it crosses on a fixed cadence, so the window is bounded by
     `C.DRIFT_RIDE_TIME`, and it climbs in **both** phases, so it reaches the rim
     and forces a resolution. "Threats or entities?" now has a case where the
     honest answer is "neither, for 0.85 s".
  2. ⛔ A **rim-parked Carrier is NOT self-resolving**, and it stalled a seeded
     run at the CS005 close: one Carrier at depth 1.00 with the quota spent, for
     the full 30,000-tick cap. ⚠ **Three of the six roster classes park rather
     than hunt** — Carrier, Weaver, Surger. Fixed in the soak *fixture*, never in
     the build.

  ⛔ **`PLANNED-FEATURES-CS006.md`'s H4 carries a recommended default and it is a
  recommendation, not a decision** — the concurrency budget counts *threats*
  (`blocksClear && !dead`), the readability ceiling keeps counting *entities*;
  and the rim-parked Carrier is read as **the Purge's textbook case** rather than
  a bug, so: no code change, record the reading. That document is in `archive/`;
  see "Next up".

- ⛔ **The Dive has no visual, and a dive reads as 2.6 s of a still board.**
  `Game.draw()` paints the well, the surviving Thorns and a Skimmer still drawn
  at the rim; nothing shows the descent. ⛔ Deliberate — GDD §5's camera widen,
  doppler and the descent's own rendering are presentation and CS006 scoped them
  out — but it is **the largest gap in the build between what is simulated and
  what is seen**, and no changeset owns it. `state.dive.depth` is the value a
  renderer wants and it is already there. ⛔ The `PLAYTEST.md` ask names the
  failure mode that makes it more than cosmetic: *when a Thorn kills you in a
  dive, can you tell what killed you?*
- ⚠ **`C.DIVE_TIME` is the WHOLE dive, grace included** — the descent is
  `DIVE_TIME - DIVE_GRACE` = 2.25 s, not 2.6. Written down because it is easy to
  read the two constants as additive, and CS014's `DIVE_TIME_OD` 4.0 inherits the
  same reading.
- ⚠ **The dive death-loop bound in `test-cs006-p5.js` is a BOUND, not a
  mechanism proof, and it is measured at exactly its limit.** No run loses more
  than two lives inside one dive sequence (worst 2, seed 21622307). ⛔ Reducing
  `diveRespawn()` to the naive version leaves that soak **green** — a scripted
  player rotates out of the thorned lane before the next strike. The
  mutation-sensitive proof is `test-cs006-p3.js`'s staged cases. A live-board
  landing-lane assertion was tried and rejected as unsound (the craft rotates in
  the same step as the respawn); `log/CS006.md` has the measurement.
- **`tools/glow-lab.html` does not exist and has no owner.** It is the instrument
  for the **global** glow constants, which nothing since CS004 has touched.
  Palette asks: see `PLAYTEST.md`.
- **The whole enemy palette is ⚠ provisional.** `SKIMMER_COLOR`, `VAULTER_COLOR`
  and the six CS004 P1 added are inference, not design — the GDD specifies no
  enemy palette. They were chosen **as one set** against the constraint recorded
  in `C`: an enemy colour must read against all seven band colours (§3.6),
  because the well cycles and the enemies do not. ⛔ All are judgeable on
  hardware now.
- ⛔ **`src/07-enemies.js` wants splitting, and the moment is CS012.** Measured at
  the CS005 close. The measurement, the seam and the reasoning are in
  `ROADMAP.md` under "Still open" — ⛔ not restated here.
- **GDD §12's four-second promise is not delivered.** A passive player does die
  on level 1, but not reliably within four seconds — it needs spawn lanes
  weighted toward the player's lane. Settled: onboarding, and **CS015's**.
- **A rim Vaulter hunts the Skimmer's *continuous* lane**, so a player parked
  between two lane centres has it hopping back and forth across them. Lethal
  either way, and GDD §6.1 says only "direction from `laneDelta`". Flagged for
  CS007's tuning pass in case the jitter reads as indecision rather than menace.
- ⚠ **A run that STARTS past level 99 gets the modulo well and a `bandRoll` of
  0.** `startGame()` still does `wellIndex = (level - 1) % WELLS.length` and
  `newState()` ships `bandRoll: 0`, so GDD §3.6's roll only ever happens on a
  level *transition*. Unreachable today, and it goes live with GDD §4.6's Start
  Depth (which caps at 81 and so may never reach it). ⛔ Not fixed: the changeset
  that lands Start Depth owns it, and the fix is one branch shared with
  `nextWell()`.
- ⚠ **A closed test may pin the literal text of a line a later phase is scheduled
  to change.** `test-cs005-p3.js` pinned all five `drawWell` arguments to assert
  one of them. Source-text assertions are the right tool for "this is still
  unwired", but ⛔ **pin only the argument the claim is about**.
- ⛔ **Playtest asks live in `PLAYTEST.md`**, thirty of them, seven marked ⛔.
  Not session context — pull it up at the machine with a build in front of you,
  never during a build phase.

## Open questions (blocking)

- None.

## Carried tasks (not blocking, no changeset owns them yet)

- Register `vector-vortex` in the Worker's `services/leaderboard/src/registry.js`
  with the seven stats keys, before any submission is attempted.
- Backport `kit-input` (`src/04-input.js`, all four devices, v0.3.0) to
  coinless-kit — a separate manual step, verified against that repo's own suite.
- ⚠ `C.DEBUG_SPAWN_KINDS`, `pickSpawnKind()` (`08-spawner.js`) and the seven
  debug spawn actions in `23-main.js` are ⚠ TEMPORARY **as a pair that CS007
  splits**: GDD §8.1's introduction schedule deletes the constant and its
  reader, and ⛔ **the keys are not TEMPORARY and survive it** — they answer
  "put one of these on screen so I can look at it", which is a hardware-pass
  question the schedule does not address. `PLAYTEST.md` is written around them.
  They ship until CS016 decides whether debug keys ship at all.
- `state.screen === "gameover"` is a STOP with nothing on screen but the frozen
  board. `r` restarts. CS008 owns the screen, the submission and the real restart
  flow, and the `restart` debug action should be folded into it.
- **No scoring anywhere.** `PTS_VAULTER`, `PTS_CARRIER`, `PTS_WEAVER`,
  `PTS_THORN`, `PTS_WELL_PER_LEVEL`, `PTS_NO_DEATH_WELL` and
  `PURGE_SAVED_BONUS` are deliberately unread until `addScore()` lands in CS008,
  which is the one entry point. ⚠ The Drifter and the Surger shipped **no** points
  constants at all — GDD §6.1 gives the Drifter 250/500/750 by depth and the
  Surger 200, and CS008 lands both.
- ⛔ `scratchpad/test-registry.js` carries TWO counts and they are not the same
  number. ✅ Settled: `enemies` is 6 (GDD §6.1 roster rows, complete) and
  `enemyKinds` is 9 (`ENEMY_KINDS` rows). ⛔ The next mover of either is an
  Overdrive enemy (GDD §6.4), not a cargo.

## Next up — CS007, the run escalates

**The heat clock, GDD §8.1's introduction schedule, the spawner-stall call, and
telemetry as the tuning instrument.** ⚠ One clock: `game.level` (`CLAUDE.md`,
Config; `DIFFICULTY-NOTES.md`). Every heat-derived value comes off it. No
parallel clocks.

⛔ **CS007's spec is written from `archive/PLANNED-FEATURES-CS006.md`'s
"⛔ Handover to CS007" section** (H1–H6). It is not restated here and it is not
optional reading — it is six findings CS006 made and deliberately did not act
on:

| | |
|---|---|
| **H1** | ⛔ Heat breaks the respawn guarantee. The fix is a **derived push**, not a clamp on the multiplier, and §17's assertion becomes a property over levels 1..200 |
| **H2** | `SURGE_DISCHARGE < RESPAWN_INVULN` survives if heat is disciplined: ⛔ **heat scales intervals, climb rates and the Weaver's apex — never a crossing or hop duration.** That discipline is what protects three closed soaks' derived lane bounds for free |
| **H3** | `DIFFICULTY-NOTES.md` survives in shape and fails in detail — four rows are missing a clamp, and two of its rows are one knob |
| **H4** | The spawner stall, with a recommended default (see Known issues) |
| **H5** | ⛔ The debug **keys** survive the constant and stop being TEMPORARY |
| **H6** | The golden's guard role — ✅ **done at CS006 P5**, in `test-cs006-p5.js` |

⛔ **CS007 owns exactly one baseline re-record and it is `GOLDEN_LANES`**, moved
by the introduction schedule changing the draw count per spawn. Re-record it
once, with the cause named, and check it against `test-cs006-p5.js`'s
draws-per-spawn count rather than against the old sequence alone.
