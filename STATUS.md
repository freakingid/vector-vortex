# Vector Vortex — STATUS
Version: 0.0.4 · Changeset: CS008 (P3 done — ⛔ P4, text, HUD and fragmentation, next) · Wells: 16/16 · Enemies: 6/6 Classic · Tracks: 0/5

## Phase ledger — CS008

One line per phase here; ⛔ **reasoning goes to `log/CS008.md` as the phase
goes**, not to this file (`CLAUDE.md`, Session rules, 2026-08-31).

- **Planning (2026-09-13)** — `PLANNED-FEATURES-CS008.md` +
  `IMPLEMENTATION-PHASES-CS008.md`, **eight phases**, every call answered by
  Paul (plan §0, `DECISIONS.md`). ⛔ Three handover claims measured false:
  (A)+(B) is 75 % not 100 % (float — P1 adds `C.HIT_DEPTH_EPS`), (A) does not
  move `GOLDEN_LANES` but (B) appends two entries, and the rim death share is
  driver-dependent. Built nothing.

- **P1 (2026-09-13) — the rim fix, (A) + (B) + ε.** Shots age, retire, then
  fire, so a shot is tested at the rim on its fire tick; the four climbs park at
  `1 - C.RIM_CONTACT_DEPTH` and `atRim()` moved with them; `C.HIT_DEPTH_EPS`
  1e-9 in `collideShots()` only. ⛔ **An enemy arriving at the rim in a firing
  lane is killed on every cooldown phase** — `test-cs008-p1.js`, 24/24 on S1, S2
  and S4, Ring and Vee, mutation-checked (ε, (A), `atRim()` — all red; record in
  `log/CS008.md`). Both planned re-records landed at the planned values; the 19
  closed-file failures matched §1.5 line for line and were repaired in place.
  ⛔ **`PLAYTEST.md`'s CS007 ask is unblocked.**

- **Planning, P1b (2026-09-13, at `0b41f55`) — the crossing fix.** Paul
  answered K1–K4 (plan §0, `DECISIONS.md`):
  - K1: the **rim sweep** in `collideSkimmer()`;
  - K2: accept that levels 1–4 are deathless for a fire-holder, with a P8
    playtest ask;
  - K3: armour, bolts and a discharge below the rim still kill;
  - K4: P1b, no renumber.

  ⛔ **Measured false in the handover:** the re-arm's 17/24 is a short
  pre-fire. With a full rack it is 6/24, and the cap, not the hop, caused the
  residual deaths. No shot-based variant reaches 24/24 (plan §1.16). Built
  nothing; `NEXT-STEPS.md`'s entry deleted.

- **P1b (2026-09-13) — the crossing fix, the rim sweep.** In
  `collideSkimmer()`, a firing Skimmer asks a touching enemy at the park depth
  `onShot(null)` before contact can kill — plan §2b, exactly. ⛔ **With fire
  held, a rim enemy a shot could kill dies on contact**: `test-cs008-p1b.js`,
  C1–C13 24/24 killed and N1–N3 24/24 died on a full rack, mutation-checked
  (sweep, fire gate, depth gate, `dead = true` — all red; record in
  `log/CS008.md`). The five closed-file failures and all three hash values
  matched §1.16 to the digit. Four fixtures repaired in place, one re-record;
  `GOLDEN_LANES` and `test-cs008-p1.js` green unedited.

- **P2 (2026-09-13) — scoring and extra lives.** `addScore()` and
  `clearBonuses()` in `12-scoring.js`. `points()` is the fourth contract
  method. Three kill sites pay on the false → true `dead` transition. The clear
  bonuses are paid on the clear step, and the dive termination pays nothing.
  Lives come at 20k and then every 40k, lost past the cap. `state.score`,
  `nextLife` and `diedThisWell` are new; `score` left the telemetry
  placeholder. ⛔ **No baseline moved.** `test-cs008-p2.js` covers every GDD §7
  row, lives, the bonuses, no-draw against a stubbed `addScore()`, and **§17
  item 8 over 120,000 played steps with 0 mismatches**. Mutation-checked, 14 of
  14 red (record in `log/CS008.md`). §1.8's 5 closed-file reds plus 5 from new
  causes (below), all repaired in place.

- **P3 (2026-09-13) — mode and Start Depth, no screen.** `startGame(seed,
  opts)`; `state.mode`/`startDepth`; `startBonus(d)` off `C.START_BONUS_*`,
  paid in `clearBonuses()` fourth when `level === startDepth`;
  `C.START_DEPTH_FIRST`/`_CAP`; `levelRecord()` + `startDepthOptions()` in
  `22-meta.js`, written at the clear edge, outside `state`. Placeholder is
  `maxCombo` only. ⛔ **No baseline moved** — hash and `GOLDEN_LANES` green
  unedited. `test-cs008-p3.js`: defaults identical over 8,000 played steps, the
  eight bonus literals, paid once, the list 1–9 → 13 → 81 across `startGame()`,
  81 → `WELLS[0]`, `bandRoll` 0, no draw. Mutation-checked, 7 of 7 red (record
  in `log/CS008.md`). Three planned reds repaired in place; one new-cause red was
  my own comment, fixed in source (below). GDD §4.6 table corrected.

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (24 modules, 357.5 KB); the
  manifest is checked both directions against `src/`.
- `node scratchpad/run-all.js`: **38 test files, all green, zero skips.**
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
- ⛔ **`test-cs004-p1.js`'s `GOLDEN_LANES` — its first SIXTEEN entries are STILL
  the ORIGINAL recording from `9ebd27b`** — through CS006, CS007, CS008 P1, P1b and P2,
  character for character, and a separate prefix assertion now holds them.
  ⛔ **THE ONE EXCEPTION: CS008 P1 APPENDED `2, 5`, and it has ONE cause — the
  climb stops at the kill band**, so held fire clears the window sooner and two
  more spawns fit. Written at the assertion. It covers appends from that cause
  only; the rule below is not weakened for anything else. ⚠ Five documents predicted a move (the
  Dive, then heat, then the schedule) and all three predictions are **measured
  false**: the golden's 3,000-tick window ends at level 2, `heat(1)` is 0 and the
  eligible set there is one entry, which spends no draw. ⛔ **A move is a defect,
  not a baseline** — heat leaking into level 1, or a stray draw.
- ⛔ **`test-cs006-p2.js`'s `P1_DETERMINISM_HASH` is the one baseline that moves,
  and it is a CROSS-FILE one** — it runs the closed `test-cs005-p5.js` in a child
  process. It stands at **1229033515** (CS008 P1b, the crossing fix — two causes
  measured apart and written at the assertion: the sweep alone 4203989832, the
  soaks' first-run `lives = 1` alone 2859072280; the planned value, matched to
  the digit before the re-record). ⛔ Re-record it **once per change, with
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

- ⚠ **CS008 P2 — THREE NEW-CAUSE REDS the plan's §1.8 did not list**, recorded
  before any edit. Code in, suite run, hash and `GOLDEN_LANES` green. Beside
  §1.8's five, five assertions in four files went red:
  1. `test-cs003-p3.js:88` and `test-cs003-p4.js:125`, *"no addScore exists
     yet"*. Cause: `_harness.js` now exports `addScore` and `clearBonuses`.
  2. `test-cs004-p1.js:77`, *"exactly the three signatures"*. Cause: `points()`
     is the planned fourth method (plan §3), and the prototype list pins three.
  3. `test-cs007-p4.js:149,153`, *"the score column is 0 until addScore()"* and
     *"all four read C.TELEMETRY_PLACEHOLDER"*. Cause: the planned deletion of
     `score` from the placeholder. §1.8's emulation never deleted the key.

  All three are the replaced claim, repaired in place. ⛔ **Lesson for P3–P8:**
  an emulation that adds no export, method or key cannot see an assertion that
  pins one.
- ⚠ **CS008 P3 — "dies in well 9" was built as the RUN ending there**, which is
  what plan §4's mechanism gives (paid when `level === startDepth`, no death
  test). A life lost in the starting well, then a clear, still pays the bonus
  (not the no-death 1,000). ⛔ If S2's "survive the well you chose" meant any
  death, that is Paul's call and a one-line change; `test-cs008-p3.js` asserts
  only the run-ending case.
- ⚠ **`test-cs007-p4.js` finds the telemetry module by the text
  `// 22-meta.js`**, first occurrence. A comment line anywhere earlier in the
  build that begins `// 22-meta.js` (P3 wrote one in `02-state.js`) blanks its
  scan — 6 reds. ⛔ Never start a comment line with a module file name.
- ✅ **A clear on the step that spends the last life — answered and built.**
  Paul, 2026-09-13: **score, no life**. The bonuses count toward the final score,
  and `addScore()` awards no life while `screen === "gameover"`, so `lives`
  stays 0 on the stop. Staged in `test-cs008-p2.js`. `DECISIONS.md` carries it.
- ⚠ **`_harness.js` has `buildGame({ stub: [names] })`** (CS008 P2). It
  rebinds a top-level function to a no-op after evaluation, for "X changes
  nothing else" claims. Only `test-cs008-p2.js` uses it.

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
- ⚠ **A run that STARTS past level 99 would get the modulo well and a
  `bandRoll` of 0** — `startGame()` does `wellIndex = (level - 1) % WELLS.length`
  and never rolls. ⛔ **Unreachable while `C.START_DEPTH_CAP` is 81** (plan
  §1.12; CS008 P3 shipped the cap). `startGame(seed, { startDepth })` itself does
  not validate, so only a direct API caller can reach it. Raising the cap past
  99 owns the fix: one branch shared with `nextWell()`.
- ⚠ **A closed test may pin the literal text of a line a later phase is scheduled
  to change.** `test-cs005-p3.js` pinned all five `drawWell` arguments to assert
  one of them. Source-text assertions are the right tool for "this is still
  unwired", but ⛔ **pin only the argument the claim is about**.
- ⚠ **PREDICTED, CS008 P1: a SECOND Purge now prefers a Weaver bolt above 0.95
  over a parked enemy.** `purgeTarget()` takes the highest depth, and enemies
  now park at 0.95 while a bolt spends ~9 steps above it. Plan §2 flagged it;
  not measured, and no phase owns it. ⚠ Since P2, that Purge pays **0** —
  a bolt has no points.
- ⚠ **THE SCRIPTED SOAK PLAYER HOLDS FIRE, SO SINCE P1b IT BARELY DIES** — the
  sweep kills what it crosses. Four closed fixtures were repaired for exactly
  that: `st.lives = 1` on the FIRST run of three soaks' `hashRun()` (never after
  a restart — that drops the respawn from the hash), and `test-cs007-p4.js`'s
  `CAPTURE_TICKS` 7,300 (deaths at 7,028 and 7,574; ⛔ 8,000 stops inside the
  window and goes red). ⛔ **A later fixture that needs a death or a game over
  inside a window will hit the same wall** — and P8's sixth soak is one.
- ⛔ **NO KEY IN THE BUILD REACHES A CHOSEN LEVEL.** `w` (`cycleWell`) advances
  `state.wellIndex` and never `state.level`, and both `eligibleKinds()` and
  `wellBandColor(level, …)` are functions of the level. ⚠ Found at the CS007
  close: `PLAYTEST.md` carried "press `w` up to level 23" and "press `w` to level
  65" for two asks and both were impossible. ⛔ **GDD §4.6's Start Depth is what
  unblocks them** — odd depths to 81 — so **CS008 makes two parked playtest asks
  answerable**, and the plan should say so.
- ⛔ **Playtest asks live in `PLAYTEST.md`**, eight of them marked ⛔, two of them
  ⛔ **PARKED until CS008's Start Depth**. Not session context — pull it up at the
  machine with a build in front of you, never during a build phase.

## Open questions (blocking)

- None.

## Carried tasks (not blocking, no changeset owns them yet)

- ✅ **`C.TELEMETRY_PLACEHOLDER` IS ONE KEY, `maxCombo`.** CS008 took three
  bites, not two (plan §1.10): `score` in P2, `mode` and `startDepth` in P3.
  `maxCombo` goes with GDD §14.4's combo. ⛔ A key left there after its column
  has a real source is a column silently reporting a constant.
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
  frozen board. `r` restarts. CS008 P5 owns the screen and the restart flow and
  deletes the `restart` action; ⚠ the leaderboard **submission** is CS011's
  (`ROADMAP.md`), and P5 builds only its seat.
- ⚠ **Corrected (plan §1.10): the Drifter and the Surger DID ship points
  constants** — `PTS_DRIFTER` `[250, 500, 750]` and `PTS_SURGER` 200, since
  CS001 P0. Since CS008 P2 each has exactly one reader, its class's
  `points()`. The Overdrive `PTS_REAVER`, `PTS_MIMIC` and `PTS_WARDEN` are still
  unread, and CS012 owns them.
- ⛔ **THE SEVEN DEBUG SPAWN ACTIONS SHIP UNTIL CS016** decides whether debug keys
  ship at all (Paul's H5 call, 2026-08-31). They are **not** ⚠ TEMPORARY, the
  ⚠ provisional palette still needs judging, and `PLAYTEST.md` is written around
  them.
- ⛔ `scratchpad/test-registry.js` carries TWO counts and they are not the same
  number. ✅ Settled: `enemies` is 6 (GDD §6.1 roster rows, complete) and
  `enemyKinds` is 9 (`ENEMY_KINDS` rows). ⛔ The next mover of either is an
  Overdrive enemy (GDD §6.4), not a cargo. **CS007 moved neither.**

## Next up — ⛔ P4, TEXT, THE HUD AND THE DEATH FRAGMENTATION

⛔ **Paste P4's prompt from `IMPLEMENTATION-PHASES-CS008.md` into a fresh
session.** The plan is `PLANNED-FEATURES-CS008.md`;
⛔ a build phase reads the document, not the planning conversation
(`CLAUDE.md` rule 3c).

**The sequence:** P1 the rim fix · P1b the crossing fix · P2 scoring and
extra lives · P3 mode and Start Depth · **P4 text, HUD, fragmentation** · P5 the
screens · P6 pause and Options · P7 the Controls page · P8 the front-door soak
and the close.

⛔ **What each phase must not lose, carried from before the plan:**

1. ✅ **All three re-records landed** — P1's `GOLDEN_LANES` +2 appended entries
   (the first 16 unmoved) and `P1_DETERMINISM_HASH` 1862183225, then P1b's hash
   **1229033515** (plan §9). ⛔ **A baseline move in P4–P8 is a defect.** ✅ P2
   and P3 moved none.
2. ✅ **The past-99 `startGame()` defect is re-worded as unreachable** while
   Start Depth caps at 81 (P3). ⛔ P5's screen offers only `startDepthOptions()`.
3. ⛔ **Start Depth un-parks two `PLAYTEST.md` asks** (23 and 65) at P5.
4. ⚠ **The HUD's menu/screen portion is `kit-menu`'s draft** and
   `14-render-entities.js` is `kit-fx`'s — both get a `.NOTES.md` in the phase
   that first touches them (P4, P5).
5. ⚠ **Nothing has been tuned against GDD §8.2's targets.** The CS007 ask
   *"can you NAME what changed at level 5, at 9, at 13"* is answerable now
   that P1 has shipped; a sitting's answer belongs in `DECISIONS.md`.
6. ⚠ **P7 must confirm the sensitivity slider range with Paul** — the plan's
   one flagged tuning number.
7. ✅ **P3's Start Depth bonus is in `clearBonuses()`**, fourth. ⛔ **P5's
   RESTART must pass the run's `{ mode, startDepth }` back to `startGame()`** —
   the `restart` debug action still calls `startGame()` bare (U2).
