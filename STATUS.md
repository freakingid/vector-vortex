# Vector Vortex — STATUS
Version: 0.0.3 · Changeset: CS007 (P3 of 5 built) · Wells: 16/16 · Enemies: 6/6 Classic · Tracks: 0/5

## Phase ledger — CS007

One line per phase here; reasoning goes to `log/CS007.md`.

- **P1 — the spawner-stall split.** Budget counts THREATS, ceiling counts
  ENTITIES. 30 files green, zero skips. New `scratchpad/test-cs007-p1.js`.
- **P2 — the heat clock, the seven accessors, the respawn guarantee.** 31 files
  green, zero skips. New `scratchpad/test-cs007-p2.js` (186 assertions).
- **P3 — GDD §8.1's introduction schedule.** `C.SPAWN_SCHEDULE` in, ⚠ the bench
  constant out, **eight** closed files repaired. 32 files green, zero skips. New
  `scratchpad/test-cs007-p3.js` (69 assertions).

⛔ **P1 AND P2, COMPRESSED — ✅ Paul authorized this at the P2 close to make room
for P3.** Nothing is deleted and every measured figure is kept; the full
narrative is P5's to move to `log/CS007.md`.

⛔ **P1 — the release budget counts THREATS** (entities where
`blocksClear && !dead`), so it bounds what the player must *answer*;
`C.ENEMY_CAP` is untouched raw `state.enemies.length`, one enforcement site,
because a Thorn is drawn. `wellCleared()`, Thorn persistence and `C.ENEMY_CAP`
unchanged. Verified at `1d64329` first (`git diff 1d64329 HEAD -- src/` empty):
6,000 ticks at 1 → 1, quota 10 → 10, board 3 → 3, then the quota spends and the
well clears with three Thorns standing. ⛔ `P1_DETERMINISM_HASH` re-recorded
2063617640 → 571388570; pre-split, **1,072 of 1,417 blocked beats** are ones the
split releases, first at tick **3,381** (⚠ the plan predicted 1,082 / 3,380 on a
byte-identical build — a probe-definition gap, not behaviour). ⛔ **Three reds
the plan did not predict, none a baseline:** wells progress instead of stalling,
so both closing soaks' `lastRun` was exposed as reading `hashRun(SEED + 1)`
(repaired by snapshotting; no hash moved), and `test-cs004-p5.js`'s 20-run soak
hit CS005's parked-enemy fixed point (seed 21308120, level 8) and got CS005's
wall-to-wall pin.

⛔ **P2 — the guarantee was built FIRST and is proved twice.**
`C.RESPAWN_PUSH_DEPTH` **stays 0.55** at every level, `C.CLIMB_MULT_MAX` **1.40**
holds it there, margin **+0.087 s** (1.587 s against `RESPAWN_INVULN` 1.500) —
asserted as a property over levels **1..200** *and* driven through the real
`respawnSkimmer()` + `Game.update()` at 1/50/99/200 on a live board. ⛔ **No
derived push, no `respawnPush()`, no `C.RESPAWN_PUSH_MARGIN`**; a source
assertion pins `RESPAWN_PUSH_DEPTH` to one reader, and `C.CLIMB_MAX_BASE` 0.18
names the fastest contact-killer. ⚠ **The `WeaverBolt` is the one entity the
arithmetic does not save** — pushed to 0.55 it reaches its kill band at 1.250 s,
inside the window, surviving on self-termination at 1.406 s + one step; asserted
live. ⛔ Mutation-checked: 1.40 → 1.50 turns both red at L99/L200. ⛔ **Seven
accessors beside `C`; Form A, `HEAT_FULL_LEVEL` 99; every endpoint EXACT at
levels 1 and 99 (`Object.is`); no `C.HEAT_HOLD_LEVEL`.** A source assertion off
the built file says each base is named only inside its own accessor, every
`C.*_CLIMB` read is `* climbMult()`, `climbMult()` has exactly five call sites,
and `heat()` is named only by `heatT()`. Ladder asserted at every level in each
band; ⚠ level 15 sits at 4.998. ⛔ `P1_DETERMINISM_HASH` re-recorded 571388570 →
3019834406, **one cause: heat**, proved sole rather than inferred — that soak's
own `--hash-only` path with all seven clamps flattened onto their level-1 bases
returns **571388570 exactly**; the hashed run first leaves level 1 at tick
**1,445**. ⛔ **`GOLDEN_LANES` was NOT re-recorded**, correcting four documents:
**1.428 is level *5*'s spawn interval; level 2's is 1.5472.** ⛔ **Three
closed-soak fixtures repaired, one assertion rewritten, zero relaxed** —
`C.ENEMY_CONCURRENT` is the budget's level-1 *endpoint* now, so all three soaks
pin **both** endpoints and restore a budget of 16 at every level, recovering
`all SIX roster classes` and `a Weaver laid a Thorn` with no assertion touched.


⛔ **P3 — GDD §8.1's INTRODUCTION SCHEDULE, AND THE PLACEHOLDER IS GONE.**
`C.SPAWN_SCHEDULE` is DATA in `C`: seven `{ level, kind }` rows at
1/3/5/9/13/18/23, cumulative and sorted. `eligibleKinds(level)`
(`08-spawner.js`) is the whole mechanism, and `pickSpawnKind(state)` keeps its
**name, signature and no-draw contract** — only its reader moved. ⛔ `thorn` and
`weaverBolt` are not rows and cannot be; §8.1's rows 1/2 and 8 are documented as
already-shipped (`C.VAULT_FIRST_LEVEL` 2; level 8 → `WELLS[7]` = Vee,
`closed: false`) and **no well selection was touched**. ⛔ **C3 built as
answered: a uniform `rngPick`, NO weight table** — worst deviation from 1/7 over
70,000 draws is **0.0022**, and `test-cs007-p3.js` asserts no row carries any
field but `level` and `kind`. Cargo: 100 % Vaulter at L3–17, 50/50 at L18–22,
33/33/33 from L23, by arithmetic. ⛔ **H5, both halves:** the constant is deleted
and **`DEBUG_SPAWN_KINDS` appears nowhere in the built file, not even in a
comment** (asserted; the new comments describe it without naming it — CS006's
`WELL_CLEAR_HOLD` convention); the seven debug spawn actions are **kept and no
longer ⚠ TEMPORARY**, proved by driving one — pressing `5` at level 1 puts a
Drifter on a board the schedule does not release one to. **32 files green, zero
skips**, new `scratchpad/test-cs007-p3.js` (69 assertions).

⛔ **`P1_DETERMINISM_HASH` re-recorded a THIRD time, 3019834406 → 3661952239, one
cause: the soak's kind fixture became a level** — `test-cs005-p5.js`'s hashed run
now starts at level 23 on `WELLS[6]` instead of level 1 on `WELLS[0]`, both hashed
on tick one. Cause at the assertion. ⛔ **`GOLDEN_LANES` NOT re-recorded, no edit
— item 7 discharged. MEASURED: its 3,000-tick window ends at LEVEL 2** (2,065
ticks at L1, 935 at L2), one entry throughout. ⛔ CS007's re-record budget is
**spent**: three, all `P1_DETERMINISM_HASH`; the geometry goldens are green.

⛔ **EIGHT CLOSED FILES REPAIRED, NOT SEVEN — ⚠ `test-cs003-p5.js` is the one the
plan missed.** It never touched the deleted constant, so nothing flagged it; it
went red because it *relied on the shipped default being Vaulter-only*. Two
failures, two repairs. **(a)** Its open-well soak is the project's VAULTER soak
(the per-tick bound is the Vaulter's hop), and `nextWell()` left it at levels
8–15 — a three- to five-kind board spending the release budget on entities with
no lane arithmetic in them, turning `Flat: an enemy reached an end lane` red.
**Shape stays `idx`; the level is pinned to `C.VAULT_FIRST_LEVEL` 2**, the only
level that is both the one-entry band and at the vaulting line. **(b)** Its
20-run soak walked into the parked-enemy fixed point, unreachable before because
a Vaulter hunts: seed 20889204 at **level 9**, quota 0, three Carriers at the rim
in lane 8 and a Weaver at 0.51 in lane 6, no movement from tick **10,714** to the
20,000-tick cap — repaired with CS005's wall-to-wall pin (⛔ the driver, never the
build; third file to need it), as a wrapper so `replay` itself is untouched.

⛔ **AND `test-cs004-p5.js`'s LATENT `lastRun` DEFECT FIRED.** P1 measured it as
not firing and left it because P1 had not invalidated it; P3 did — the assertions
read `hashRun(SEED + 1)`, and on that seed the player no longer reaches the stop
inside the window. Repaired with P1's own snapshot. ⛔ No hash moved. ⛔ **And
every `level > 1` non-vacuity assertion in the three soaks was rewritten to
`> MIXED_LEVEL`**: a run *started* at a level satisfies `> 1` without clearing
anything, which is a weakening smuggled in by a fixture.

⛔ **THE REPAIRED FIXTURES' LEVELS, TWO OF THEM MEASURED RATHER THAN PICKED.**
`test-cs005-p5.js` and `test-cs006-p5.js` take **23** — their six kinds plus
`carrierVaulter`, a superset by one whose every check is by CLASS, and 18–22's
six are the *wrong* six. ⚠ **`test-cs004-p5.js` takes 7, not 5**, and all four
levels of the band were run: **5** — the player survives the whole hashed window
(`restarts > 0` red); **6** — Double-Vee never sees a Carrier split; **8** — the
player never clears a well (`nextWell() is in the hash` red); **7** green.
⚠ Sensitive: a split needs the driver to shoot a Carrier, so a retune may move it.

⛔ **`test-cs006-p5.js`'s DRAWS-PER-SPAWN CONTROL IS BUILT AND STRONGER — AND THE
PHASE PROMPT'S PINNING ADVICE WOULD HAVE BROKEN IT.** One-entry run is levels
1–2, control levels 3–4 (the only band whose set is exactly two); decomposed,
level 1 → **0 draws**, level 3 → **1**. ⛔ **Not pinned with a `spawn.remaining`
top-up** as the prompt suggested: a well that never clears never dives, and `a
dive spends ZERO draws on a live board` is one of that section's own claims. Each
run stops at its band's edge instead — sound because `Game.update()` runs the
spawner **before** the well-clear check — and both assert the set size they saw.
⚠ The control's second entry is a Carrier, not a duplicate Vaulter, so it can
split; `added > 1` was already routed to `out.extra`, with `extra === 0` asserted
on the one-entry run only.

⛔ **`test-cs005-p2.js` AND `test-cs005-p3.js` TOOK OPTION 1** — no level of §8.1
has a one-entry set with the Drifter (fourth, at 9) or the Surger (fifth, at 13),
so the claim is asserted on the **one entry point it names**, ⛔ because driving
`spawnEnemy` by hand would prove the constructor and the sentence under repair
says *"the interval spawner releases these"*. It **adds** a non-vacuity assertion
the original never had — the kind actually reached the board — and both
⚠ TEMPORARY bench-key headers are corrected, since the keys are not.


⚠ **P4/P5 HAZARDS, two.** (1) `CLAUDE.md` carries **no rule** for the schedule —
its Config section names the seven heat accessors and says nothing about
`C.SPAWN_SCHEDULE`, `eligibleKinds()` or the no-weight-table decision; only the
code-map line was updated. GDD §6.2/§8.1 and the config comment carry it, and
⛔ whether it earns a rule in a 50 KB auto-loading file is not a build phase's
call. (2) ⚠ **This file is 416 lines against its ~400 ceiling** even with P1 and P2
compressed once (Paul's authorization, spent) and the shipped-curve table
replaced by a pointer to GDD §8, its permanent home. ⛔ The remaining excess is
P3's own entry, and every measured figure in it exists **only** here until P5
moves it to `log/CS007.md`; cutting further would lose one.


⛔ **WHAT P5 ALSO OWES THIS FILE — a re-file, not a cut** (Paul, 2026-08-31).
The `## Next up — CS007` section is 78 lines and ~58 of them duplicate
`PLANNED-FEATURES-CS007.md` and `IMPLEMENTATION-PHASES-CS007.md`, which a phase
already reads when in flight; those become a pointer. ⛔ **The other ~20 are
load-bearing and MOVE rather than go**: the four-row baseline re-record ledger
(⛔ STATUS's corrected version is the authoritative one — the planning doc's is
stale) belongs with the operational state, and the planning corrections under
*"Other measured corrections"* are carried tasks and belong under Carried tasks.
⚠ **Do this at the close, not before** — P4 should not have a second hand in this
file mid-changeset. ⛔ And CS008's phases append reasoning to `log/CS008.md` as
they go (`CLAUDE.md`, Session rules, changed 2026-08-31), so the ~400-line
squeeze that cost CS007 two compression authorizations should not recur.

⛔ **WHAT P5 OWES `DIFFICULTY-NOTES.md`** (not touched this phase, by instruction).
Made true by P2: the heat formula block; *spawn interval falls*, *concurrent
enemies rises*, *enemy climb speed rises*, *vault interval falls*, *surge
frequency rises*, *Weaver thorn length rises*. Still wrong or missing there:
`SPAWN_MIN` never existed (it is `SPAWN_INTERVAL_MIN`); four rows now have a
clamp the table says they lack; *Weaver thorn length* and the apex are **one
knob**; *Carrier cargo weights* has **no** mechanism and is emergent from §8.1
(P3's); and the table needs `HEAT_FULL_LEVEL` 99 and the ladder.

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (24 modules); the manifest
  is checked both directions against `src/`.
- `node scratchpad/run-all.js`: **32 test files, all green, zero skips.**
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
  edits, the acceptance-criteria verdicts and the eleven-row mutation record are in
  `log/CS006.md`.
- ⛔ **Read GDD §6.5 before adding an enemy.** Seven contract fields, six wiring
  points, the one array / one spawn entry / one well entry / one collision pass
  rule, and — CS006 — **the Dive**: an entity that is `blocksClear: false` and
  not `anchored` must decide explicitly whether it survives a dive.
  `startDive()` filters to `anchored`, so today the answer is *no*.
- ⛔ **Four soaks, and they prove different things on different boards — which
  is now stated as a LEVEL in each of them (CS007 P3).** `test-cs003-p5.js` is
  the VAULTER soak (level 2) and catches GDD §3.5's wrapping hop with a per-tick
  lane SPEED bound. `test-cs004-p5.js` runs the schedule's three-kind band (level
  7) and asserts the STRONGER exact-lane form; it also asserts that the band ENDS
  at 8, because a level-9 Drifter crosses lanes and its `hopless` assertions do
  not describe one. `test-cs005-p5.js` and `test-cs006-p5.js` run the full board
  (level 23) — the latter owns **the Dive**. ⛔ A future changeset extends the
  pattern with a fifth file rather than widening a closed one.
- ⛔ **`test-cs006-p5.js` carries the count-based form of the no-draw rule**, and
  ⛔ **since CS007 P3 it is a function of the LEVEL, which is strictly more than
  it could say before.** Draws per interval spawn are `spawnEnemy`'s 1 (the
  heading) plus `pickSpawnLane`'s bounded `[1, C.SPAWN_LANE_TRIES]`, plus **+0 at
  levels 1–2 and +1 from level 3** — each counted directly on the shipped
  function, on two bands of the shipped game rather than one shipped list and one
  invented one. ⛔ **It needs no baseline and survives every retune**, which is
  what let all three `P1_DETERMINISM_HASH` re-records be checked rather than
  merely recorded.
- ⛔ **`test-cs004-p1.js`'s `GOLDEN_LANES` is STILL on its ORIGINAL recording
  from `9ebd27b`, through the whole of CS007** — not P1, not P2, and ⛔ **not P3
  either**: measured green, character for character, with **no edit**. ⚠ Four
  documents predicted P2 would move it and the phase prompt flagged P3 as a
  second risk; both measurements are in the entries above (level 2's spawn
  interval is 1.5472, not 1.428; the golden's window ends at level 2, where the
  eligible set is one entry). ⛔ **Nothing in CS007 re-records it, and P4 and P5
  should treat a move as a defect** — it is the level-1/2 board, and the heat
  clock is 0 there and the kind pick spends nothing there.
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

- ⚠ **THREE OF THE SIX ROSTER CLASSES PARK RATHER THAN HUNT — Carrier, Weaver,
  Surger — and that is what stalls a SOAK now that wells progress.** ⛔ Not a
  build defect and not the Thorn stall: a parked entity is `blocksClear: true`,
  so it correctly holds a release slot and correctly blocks the clear. A well
  whose only survivors are parked never clears, and a scripted driver whose
  rotation never reaches their lane neither kills them nor dies to them. ⛔ **The
  repair is the driver, never the build** — `replayWide`'s wall-to-wall pin,
  CS005's; CS007 P1 gave `test-cs004-p5.js` the same one after seed 21308120 sat
  at level 8, and ⛔ **CS007 P3 gave `test-cs003-p5.js` the third**, because the
  schedule is what first put parked classes on that file's board at all (seed
  20889204, level 9, stuck from tick 10,714). ⚠ **The Purge is the played answer** (GDD
  §4.3, "the enemy nearest the rim, deterministically"); a soak that never
  presses it is the only thing that stalls. ⛔ No code change — the reading is
  the record.

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
- ⛔ **DONE, CS007 P3 — the pair is split and this is what is left of the task.**
  The bench constant is deleted (and absent from the built file); `pickSpawnKind()`
  survives with its name, signature and no-draw contract, reading
  `C.SPAWN_SCHEDULE`. ⛔ **The seven debug spawn actions in `23-main.js` are NOT
  TEMPORARY and ship until CS016 decides whether debug keys ship at all** — they
  answer "put one of these on screen so I can look at it", the ⚠ provisional
  palette still needs judging, and `PLAYTEST.md`'s six-kind ask was rewritten
  around level 23 rather than around the deleted constant.
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

**The heat clock, GDD §8.1's introduction schedule, the spawner-stall split, and
telemetry as the tuning instrument.** ⚠ One clock: `game.level`. Every
heat-derived value comes off it. No parallel clocks.

⛔ **THE SPEC IS WRITTEN AND FINISHED. Read `PLANNED-FEATURES-CS007.md` and
`IMPLEMENTATION-PHASES-CS007.md`; the CS006 handover section they were written
from is spent.** Planned 2026-08-31 against `1d64329`; every claim in both
documents is marked MEASURED or PREDICTED.

✅ **ALL THREE DESIGN CALLS ARE ANSWERED — Paul, 2026-08-31 — AND ALL THREE ARE
NOW BUILT** (H1 and H3 at P2, C3 at P3). Reasoning and the "what would change it"
for each are in `DECISIONS.md`; the measured option tables are in
`PLANNED-FEATURES-CS007.md` §3 and §5. ⛔ **The shipped curve, its ten constants
and the nameable concurrency ladder are recorded in GDD §8**, which P2 wrote and
which is the permanent home — not duplicated here. ⛔ **All seven heat-derived
rows are clamped, so `C.HEAT_HOLD_LEVEL` is NOT built**; `src/02-state.js`'s note
anticipating it is superseded, the rule that a hold belongs in the **caller** is
not.

### ⛔ Five phases, three built

| Phase | Builds | Effort |
|---|---|---|
| P1 ✅ | The spawner-stall split — the budget counts THREATS | medium |
| P2 ✅ | The heat clock, every derived value, and the respawn guarantee | **high** |
| P3 ✅ | GDD §8.1's introduction schedule | **high** |
| P4 | Telemetry — the tuning instrument | medium |
| P5 | The soak, the docs, the close | **high** |

⛔ **P1 landed before P3 and the ordering paid, measured at planning:** on a
level-5 eligible set at `C.ENEMY_CONCURRENT` 3 every seed tested stalled (four
seeds × two drivers × 18,000 ticks, the level never leaving 1, longest stretch
with no progress 16,336–17,806 ticks); blocked spawner beats went 7,027 → 30,579
the moment a Weaver became eligible, **94.6 % of them beats the split releases.**
⚠ The plan was SIX phases at `578c21b`; H1's answer collapsed the old P3 into P2.

### ⛔ FOUR BASELINE RE-RECORDS, NOT ONE — this corrects what this file used to say

`test-cs006-p2.js`'s `P1_DETERMINISM_HASH` is a **cross-file** baseline: it runs
the closed `test-cs005-p5.js` in a child process, and that soak reaches level 15
on a six-kind board. **Measured: three separate CS007 changes move it.**

| Phase | Baseline | ⛔ Cause — exactly one each |
|---|---|---|
| P1 ✅ | `P1_DETERMINISM_HASH` | the release budget counts threats — 1,072 diverging beats in that soak's own fixture, first at tick 3,381 |
| ~~P2~~ | ~~`GOLDEN_LANES`~~ | ⛔ **DID NOT HAPPEN — measured.** Level 2's interval is 1.5472, not 1.428; the window is unmoved. See the P2 entry |
| P2 ✅ | `P1_DETERMINISM_HASH` | heat — proved sole by flattening every clamp and getting P1's hash back exactly |
| P3 ✅ | `P1_DETERMINISM_HASH` | the soak's kind fixture became a level — 3019834406 → **3661952239**; the hashed run now starts at level 23 on `WELLS[6]` |

⛔ **`GOLDEN_LANES`'s first ten entries — `10,10,12,0,8,14,12,12,8,14` — must NOT
move.** They are the level-1 spawns and `heat(1)` is 0. A re-record that moves them
is heat leaking into level 1, or a draw spent at level 1: a bug, not a baseline.
⚠ **Measured at P2: all sixteen are unmoved, not merely the first ten.**

⛔ **Both predicted causes are now discharged by measurement** — not heat (P2),
and not the schedule (P3: the window ends at level 2, one entry throughout).
`ROADMAP.md` still carries the schedule prediction; **P5 corrects both.**

### ⚠ Other measured corrections the planning session found

- ⛔ **`vector-vortex` is ALREADY registered** in `coinless-kit`'s
  `services/leaderboard/src/registry.js` (`79206f3`) with all seven `statsFields`.
  The carried task below is stale in its wording; what remains is confirming the
  **deployed** Worker carries it, and that is CS011's.
- ⚠ **`test-cs003-p2.js` asserts `!("SPAWN_MIN" in C)`** and stays green, because
  the constant is named `SPAWN_INTERVAL_MIN`. `SPAWN_MIN` never existed and
  `DIFFICULTY-NOTES.md` names it; P5 corrects the document.
- ⚠ **The plan's red-count forecast for the schedule was far too high, and the
  reason is instructive.** Its probe emulated a *level-1* answer, so it forecast
  26 / 33 / 7 failures in the three closing soaks. Against the REAL schedule those
  soaks reach high levels on their own and got a rich board for free: the actual
  reds were **1 / 9 / a load-time throw**, plus the file the plan did not list at
  all. ⛔ The repairs were still needed and were the ones §4.4 named; what was
  over-predicted was the noise, not the work.
- ⛔ **Heat alone leaves 25 of 29 test files green; 18 never leave level 1.** Not
  one lane bound, lattice assertion or contract assertion moved — H2's discipline
  (heat never scales a hop or cross duration), measured rather than argued.
