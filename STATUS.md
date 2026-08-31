# Vector Vortex — STATUS
Version: 0.0.4 · Changeset: CS008 (not started) · Wells: 16/16 · Enemies: 6/6 Classic · Tracks: 0/5

## Phase ledger — CS008

Nothing built yet. One line per phase here; ⛔ **reasoning goes to
`log/CS008.md` as the phase goes**, not to this file (`CLAUDE.md`, Session
rules, 2026-08-31). That rule is what the ~400-line squeeze cost CS007 two
compression authorizations to work around; it should not recur.

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (24 modules, 338.8 KB); the
  manifest is checked both directions against `src/`.
- `node scratchpad/run-all.js`: **34 test files, all green, zero skips.**
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
- CS006 closed — the +1 renumber and the CS006/CS007 split, past-99 well
  progression and the colour-band roll, `throatOffset` and the two degenerate
  wells behind `C.MIN_LANE_SPOKE_PX`, **the Dive**, and `laneState` gated to the
  dim band. ⛔ **All five of GDD §4.5's death conditions are live.**
- **CS007 closed 2026-08-31 — the run escalates.** ⛔ **One clock**: `heat()` and
  seven accessors beside `C`, Form A endpoint interpolation, `HEAT_FULL_LEVEL`
  99, `heat(1)` exactly 0, and GDD §4.4's respawn guarantee held by a hard
  `C.CLIMB_MULT_MAX` 1.40 with `C.RESPAWN_PUSH_DEPTH` staying 0.55 at every
  level. ⛔ **GDD §8.1's introduction schedule as DATA** — `C.SPAWN_SCHEDULE`,
  seven rows, `eligibleKinds(level)` a function of the level and nothing else,
  and CS004's ⚠ TEMPORARY bench constant deleted. ⛔ **The spawner-stall split** —
  the release budget counts THREATS, the readability ceiling counts ENTITIES.
  ⛔ **Telemetry** — 29 columns, the ring, the session switch, the CSV. Full
  narrative, the shipped constants, every judgment call, the four baseline
  re-records with one cause each, the eleven closed-file edits and the
  acceptance-criteria verdicts are in `log/CS007.md`.
- ⛔ **Read GDD §6.5 before adding an enemy.** Seven contract fields, six wiring
  points, the one array / one spawn entry / one well entry / one collision pass
  rule, and — CS006 — **the Dive**: an entity that is `blocksClear: false` and
  not `anchored` must decide explicitly whether it survives a dive.
  `startDive()` filters to `anchored`, so today the answer is *no*.
- ⛔ **FIVE SOAKS, AND THEY PROVE DIFFERENT THINGS ON DIFFERENT BOARDS — which
  is stated as a LEVEL in each of them.** `test-cs003-p5.js` is the VAULTER soak
  (level 2) and catches GDD §3.5's wrapping hop with a per-tick lane SPEED bound.
  `test-cs004-p5.js` runs the schedule's three-kind band (level 7) and asserts
  the STRONGER exact-lane form; it also asserts that band ENDS at 8, because a
  level-9 Drifter crosses lanes and its `hopless` assertions do not describe one.
  `test-cs005-p5.js` and `test-cs006-p5.js` run the full board (level 23) — the
  latter owns **the Dive**. ⛔ **`test-cs007-p5.js` is the only one that pins no
  level at all**: it owns the ESCALATING run, twenty runs from level 1 to the
  stop, and it arms **no `C` fixture** because raising `C.ENEMY_CONCURRENT` the
  way the other four do would flatten the concurrency ladder it is there to
  watch. ⛔ A future changeset extends the pattern with a sixth file rather than
  widening a closed one.
- ⛔ **`test-cs006-p5.js` carries the count-based form of the no-draw rule, and
  since CS007 P3 it is a function of the LEVEL.** Draws per interval spawn are
  `spawnEnemy`'s 1 (the heading) plus `pickSpawnLane`'s bounded
  `[1, C.SPAWN_LANE_TRIES]`, plus **+0 at levels 1–2 and +1 from level 3** — each
  counted directly on the shipped function. ⛔ **It needs no baseline and survives
  every retune**, which is what let all three of CS007's `P1_DETERMINISM_HASH`
  re-records be checked rather than merely recorded.
- ⛔ **`test-cs004-p1.js`'s `GOLDEN_LANES` is STILL on its ORIGINAL recording from
  `9ebd27b`** — through CS006 and the whole of CS007, all sixteen entries,
  character for character, with no edit. ⚠ Five documents predicted a move (the
  Dive, then heat, then the schedule) and all three predictions are **measured
  false**: the golden's 3,000-tick window ends at level 2, `heat(1)` is 0 and the
  eligible set there is one entry, which spends no draw. ⛔ **A move is a defect,
  not a baseline** — heat leaking into level 1, or a stray draw.
- ⛔ **`test-cs006-p2.js`'s `P1_DETERMINISM_HASH` is the one baseline that moves,
  and it is a CROSS-FILE one** — it runs the closed `test-cs005-p5.js` in a child
  process. It stands at **3661952239**. ⛔ Re-record it **once per change, with
  one named cause written at the assertion**, and check the move against the
  draws-per-spawn count above.
- ⛔ **On a boundary rider the LATTICE is where §17 item 3 stands, not the speed
  bound.** Proved by mutation at the CS005 close: a wrapping Drifter cross leaves
  both a range check and a per-tick speed bound green, because `crossDur()`
  scales with the cross distance. GDD §3.5 and `RATIONALE.md#boundary-lattice`.
- `tools/well-lab.html` — well polygons, the perspective curve, live
  `throatOffset` sliders and a **Legibility** readout. ⚠ Its duplicated slice
  agrees with the build to 1e-13 px on all sixteen wells; ⛔ **the visual audition
  has not happened** — the ask is in `PLAYTEST.md`.
- `tools/feel-lab.html` — traverse-and-stop measurement across the four device
  sensitivity/timing constants. Reachable over LAN via `npm run serve`.

## Known issues

- ⚠ **THREE OF THE SIX ROSTER CLASSES PARK RATHER THAN HUNT — Carrier, Weaver,
  Surger — and that is what stalls a SOAK now that wells progress.** ⛔ Not a
  build defect, and ⛔ **not the standing-Thorn stall, which CS007 P1 FIXED** — a
  parked entity is `blocksClear: true`, so it correctly holds a release slot and
  correctly blocks the clear. A well whose only survivors are parked never
  clears, and a scripted driver whose rotation never reaches their lane neither
  kills them nor dies to them. ⛔ **The repair is the driver, never the build** —
  `replayWide`'s wall-to-wall pin, CS005's, now in four soak files.
  ⚠ **The Purge is the played answer** (GDD §4.3); a soak that never presses it is
  the only thing that stalls. ⛔ No code change — the reading is the record.
- ⛔ **The Dive has no visual, and a dive reads as 2.6 s of a still board.**
  `Game.draw()` paints the well, the surviving Thorns and a Skimmer still drawn
  at the rim; nothing shows the descent. ⛔ Deliberate — GDD §5's camera widen,
  doppler and the descent's own rendering are presentation and CS006 scoped them
  out — but it is **the largest gap in the build between what is simulated and
  what is seen**, and no changeset owns it. `state.dive.depth` is the value a
  renderer wants and it is already there. The `PLAYTEST.md` ask names the failure
  mode that makes it more than cosmetic: *when a Thorn kills you in a dive, can
  you tell what killed you?*
- ⚠ **`C.DIVE_TIME` is the WHOLE dive, grace included** — the descent is
  `DIVE_TIME - DIVE_GRACE` = 2.25 s, not 2.6. Easy to read the two constants as
  additive, and CS014's `DIVE_TIME_OD` 4.0 inherits the same reading.
- ⚠ **The dive death-loop bound in `test-cs006-p5.js` is a BOUND, not a mechanism
  proof, and it is measured at exactly its limit.** No run loses more than two
  lives inside one dive sequence (worst 2, seed 21622307). ⛔ Reducing
  `diveRespawn()` to the naive version leaves that soak **green**. The
  mutation-sensitive proof is `test-cs006-p3.js`'s staged cases.
- ⚠ **`test-cs007-p5.js`'s well-stall gate is a STALL GATE and not a P1
  detector** — measured at the CS007 close: reverting `threatCount()` to
  `state.enemies.length` leaves it green (worst well 2,555 ticks against 2,435),
  because an escalating run tops out near level 9 and never accumulates the
  Thorns that shut a well. ⛔ **The assertion beside it IS a detector** and turns
  red on that mutation: every blocked beat must be legal against a threat count
  recomputed off GDD §6.5's `blocksClear` field.
- **`tools/glow-lab.html` does not exist and has no owner.** It is the instrument
  for the **global** glow constants, which nothing since CS004 has touched.
- **The whole enemy palette is ⚠ provisional.** `SKIMMER_COLOR`, `VAULTER_COLOR`
  and the six CS004 P1 added are inference, not design — the GDD specifies no
  enemy palette. They were chosen **as one set** against the constraint recorded
  in `C`: an enemy colour must read against all seven band colours (§3.6),
  because the well cycles and the enemies do not. ⛔ All are judgeable on
  hardware now, and ⛔ **the debug bench keys they are judged with are permanent**
  (Paul's H5 call, CS007 P3).
- ⛔ **`src/07-enemies.js` wants splitting, and the moment is CS012.** Measured at
  the CS005 close. The measurement, the seam and the reasoning are in
  `ROADMAP.md` under "Still open" — ⛔ not restated here.
- **GDD §12's four-second promise is not delivered.** A passive player does die
  on level 1, but not reliably within four seconds — it needs spawn lanes
  weighted toward the player's lane. Settled: onboarding, and **CS015's**.
  ⚠ CS007 touched no spawn-lane selection, so it did not fall out for free.
- **A rim Vaulter hunts the Skimmer's *continuous* lane**, so a player parked
  between two lane centres has it hopping back and forth across them. Lethal
  either way, and GDD §6.1 says only "direction from `laneDelta`". ⚠ Flagged for
  CS007's tuning pass and **not taken — CS007 tuned nothing**, it built the
  instrument. Still open, still unowned.
- ⚠ **A run that STARTS past level 99 gets the modulo well and a `bandRoll` of
  0.** `startGame()` still does `wellIndex = (level - 1) % WELLS.length` and
  `newState()` ships `bandRoll: 0`, so GDD §3.6's roll only ever happens on a
  level *transition*. Unreachable today, and **it goes live with GDD §4.6's Start
  Depth**, which is CS008's. ⛔ Not fixed: the changeset that lands Start Depth
  owns it, and the fix is one branch shared with `nextWell()`.
- ⚠ **A closed test may pin the literal text of a line a later phase is scheduled
  to change.** `test-cs005-p3.js` pinned all five `drawWell` arguments to assert
  one of them. Source-text assertions are the right tool for "this is still
  unwired", but ⛔ **pin only the argument the claim is about**.
- ⛔ **Playtest asks live in `PLAYTEST.md`**, eight of them marked ⛔. Not session
  context — pull it up at the machine with a build in front of you, never during
  a build phase.

## Open questions (blocking)

- None.

## Carried tasks (not blocking, no changeset owns them yet)

- ⚠ **`C.TELEMETRY_PLACEHOLDER` IS A FOUR-KEY OBJECT THAT SHRINKS, and CS008
  takes the first two bites.** `score` and `mode` are CS008's, GDD §4.6's Start
  Depth deletes `startDepth`, GDD §14.4's combo deletes `maxCombo`. ⛔ A key left
  there after its column has a real source is a column silently reporting zero.
- ⚠ **THE TELEMETRY COLUMN LIST IS FROZEN UNTIL A CHANGESET DELIBERATELY MOVES
  IT** (GDD §15.6). A column added in CS008 invalidates every CS007 log, which is
  why the four above already ship at known constants. ⛔ Adding or reordering one
  edits `TELEMETRY_FIELDS`, `TELEMETRY_KINDS` and `telemetryRow()` **together**;
  `test-cs007-p4.js` goes red on any two of the three drifting.
- ⛔ **CS011 OWNS TELEMETRY PERSISTENCE**, and CS007 P4 built the row shape and
  the export so it is wiring rather than a rewrite. What is missing: the
  `telemetry` key's profile scope, `Profiles.keyFor(base)` as the one route to
  it, and GDD §15.6's `read()` rejecting any envelope `v` that does not match the
  current shape. ⛔ **Not buildable before `22-meta.js` exists.**
- ⛔ **`vector-vortex` IS ALREADY REGISTERED** in `coinless-kit`'s
  `services/leaderboard/src/registry.js` (measured at `79206f3`) with all seven
  `statsFields`, and CS007 P4's column names map onto them **totally**. ⛔ What
  remains is confirming the **deployed** Worker carries it, and that is CS011's.
- ⚠ **`CLAUDE.md` carries no telemetry rule**, and P4 did not add one for the
  reason P3 did not add a schedule rule before Paul did (`49cfec6`): whether a
  system earns a rule in a 50 KB auto-loading file is Paul's call, not a build
  phase's. GDD §15.6 carries the shipped column table, the ring, the surface and
  the no-persistence rule; only the code-map line was updated.
- Backport `kit-input` (`src/04-input.js`, all four devices, v0.3.0) to
  coinless-kit — a separate manual step, verified against that repo's own suite.
- **`state.screen === "gameover"` is a STOP with nothing on screen** but the
  frozen board. `r` restarts. CS008 owns the screen, the submission and the real
  restart flow, and the `restart` debug action should be folded into it.
- **No scoring anywhere.** `PTS_VAULTER`, `PTS_CARRIER`, `PTS_WEAVER`,
  `PTS_THORN`, `PTS_WELL_PER_LEVEL`, `PTS_NO_DEATH_WELL` and
  `PURGE_SAVED_BONUS` are deliberately unread until `addScore()` lands in CS008,
  which is the one entry point. ⚠ The Drifter and the Surger shipped **no** points
  constants at all — GDD §6.1 gives the Drifter 250/500/750 by depth and the
  Surger 200, and CS008 lands both.
- ⛔ **THE SEVEN DEBUG SPAWN ACTIONS SHIP UNTIL CS016** decides whether debug keys
  ship at all (Paul's H5 call, 2026-08-31). They are **not** ⚠ TEMPORARY, the
  ⚠ provisional palette still needs judging, and `PLAYTEST.md` is written around
  them.
- ⛔ `scratchpad/test-registry.js` carries TWO counts and they are not the same
  number. ✅ Settled: `enemies` is 6 (GDD §6.1 roster rows, complete) and
  `enemyKinds` is 9 (`ENEMY_KINDS` rows). ⛔ The next mover of either is an
  Overdrive enemy (GDD §6.4), not a cargo. **CS007 moved neither.**

## Next up — CS008, front of house

**Scoring and extra lives, the HUD, the screen state machine, and
title → mode → Start Depth → play → game over → restart.** GDD §4.6, §7, §10.4,
§13; `ROADMAP.md`'s row.

⛔ **NO SPEC EXISTS YET.** `PLANNED-FEATURES-CS008.md` and
`IMPLEMENTATION-PHASES-CS008.md` are unwritten; CS007's are spent and archived
(`archive/`). A planning session writes them, writes **no code**, and marks every
claim MEASURED or PREDICTED.

⛔ **What CS008 inherits, and each of these is a thing the plan must place:**

1. ⛔ **The past-99 `startGame()` defect goes LIVE with Start Depth.** See Known
   issues; the fix is one branch shared with `nextWell()`. ⚠ GDD §4.6 caps Start
   Depth at 81, so it may still be unreachable — the plan should measure that
   rather than assume it.
2. ⛔ **`addScore()` is the ONE entry point** and it also owns extra-life
   milestones (`CLAUDE.md`, Scoring). Seven `PTS_*` constants are waiting unread,
   and **two enemies have none at all** — the Drifter's 250/500/750 by depth and
   the Surger's 200 are GDD §6.1's and CS008 lands the constants with the reader.
3. ⛔ **Two `C.TELEMETRY_PLACEHOLDER` keys are CS008's to delete** — `score` and
   `mode` — in the same phase that gives each column a real source.
4. ⛔ **The `restart` debug action folds into the real flow**, and `r` stops being
   a debug key. ⚠ It is on three closed soaks' `FORBIDDEN` list because it
   reseeds from the clock; that list stays right either way.
5. ⚠ **The HUD's menu/screen-state portion is `kit-menu`'s draft** (`CLAUDE.md`,
   Kit modules) — it obeys the boundary contract from its first commit and
   carries a `.NOTES.md` beside it in `src/`.
6. ⚠ **Nothing has been tuned against GDD §8.2's targets.** CS007 built the
   instrument and chose the curve from measured option tables; the ask is
   `PLAYTEST.md`'s ⛔ *"can you NAME what changed at level 5, at 9, at 13"*. If a
   sitting happens before CS008 is planned, its answer belongs in `DECISIONS.md`.
