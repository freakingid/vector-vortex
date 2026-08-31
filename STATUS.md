# Vector Vortex — STATUS
Version: 0.0.3 · Changeset: CS007 (P1 of 5 built) · Wells: 16/16 · Enemies: 6/6 Classic · Tracks: 0/5

## Phase ledger — CS007

One line per phase here; reasoning goes to `log/CS007.md`.

- **P1 — the spawner-stall split.** Budget counts THREATS, ceiling counts
  ENTITIES. 30 files green, zero skips. New `scratchpad/test-cs007-p1.js`.

⛔ **What the two numbers count now.** `min(C.ENEMY_CONCURRENT, C.ENEMY_CAP)` is
a budget on entities where `blocksClear && !dead`, read off the entity, so it
bounds what the player must *answer*. `C.ENEMY_CAP` is untouched — raw
`state.enemies.length`, one enforcement site — because a Thorn is drawn.
**Verified at `1d64329` first** (`git diff 1d64329 HEAD -- src/` empty): the
repro ran 6,000 ticks at 1 → 1, quota 10 → 10, board 3 → 3; after it the quota
spends and the well clears with three Thorns standing. ⛔ No heat.
`wellCleared()`, Thorn persistence and `C.ENEMY_CAP` unchanged, as settled.
GDD §6.1's ⚠ Thorn-slot note is now what shipped.

⛔ **`P1_DETERMINISM_HASH` re-recorded once, 2063617640 → 571388570**, cause at
the assertion. **Re-measured** pre-split: **1,072 of 1,417 blocked beats** are
ones the split releases, first at **tick 3,381**. ⚠ The plan predicted 1,082 /
3,380 on a byte-identical build — a probe-definition gap, not behaviour.
`GOLDEN_LANES` and the geometry goldens are untouched and green.

⛔ **THREE REDS THE PLAN DID NOT PREDICT, none a baseline, and P2 should expect
more.** Wells now progress instead of stalling, so three closed soaks lost a
*precondition*. Both closing soaks' `lastRun` is overwritten by
`hashRun(SEED + 1)`, so their "the hashed run reached the stop" checks always
read the **wrong run** — latent, exposed not caused; on `SEED + 1` the player now
survives to tick 10,913, past the 10,000 window. Repaired by snapshotting
`lastRun` before the different-seed case; no hash moves. `test-cs004-p5.js`'s
20-run soak hit the parked-enemy fixed point CS005 documented (seed 21308120,
level 8, quota 0, three Weavers parked at 0.55, nothing moving from tick 10,951
to the cap) and got CS005's own repair, the wall-to-wall pin. ⛔ `RUN_CAP`, seeds
and assertions unchanged. ⚠ `test-cs004-p5.js` has the same `lastRun` defect and
is **green**; left alone because this phase did not invalidate it.

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (24 modules); the manifest
  is checked both directions against `src/`.
- `node scratchpad/run-all.js`: **30 test files, all green, zero skips.**
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

- ⚠ **THREE OF THE SIX ROSTER CLASSES PARK RATHER THAN HUNT — Carrier, Weaver,
  Surger — and that is what stalls a SOAK now that wells progress.** ⛔ Not a
  build defect and not the Thorn stall: a parked entity is `blocksClear: true`,
  so it correctly holds a release slot and correctly blocks the clear. A well
  whose only survivors are parked never clears, and a scripted driver whose
  rotation never reaches their lane neither kills them nor dies to them. ⛔ **The
  repair is the driver, never the build** — `replayWide`'s wall-to-wall pin,
  CS005's, and CS007 P1 gave `test-cs004-p5.js` the same one after seed 21308120
  sat at level 8 for 19,000 ticks. ⚠ **The Purge is the played answer** (GDD
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

**The heat clock, GDD §8.1's introduction schedule, the spawner-stall split, and
telemetry as the tuning instrument.** ⚠ One clock: `game.level`. Every
heat-derived value comes off it. No parallel clocks.

⛔ **THE SPEC IS WRITTEN AND FINISHED. Read `PLANNED-FEATURES-CS007.md` and
`IMPLEMENTATION-PHASES-CS007.md`; the CS006 handover section they were written
from is spent.** Planned 2026-08-31 against `1d64329`; every claim in both
documents is marked MEASURED or PREDICTED.

✅ **ALL THREE DESIGN CALLS ARE ANSWERED — Paul, 2026-08-31.** Full entry with the
reasoning and the "what would change it" for each in `DECISIONS.md`; the measured
option tables stay in `PLANNED-FEATURES-CS007.md` §3 and §5.

| | ✅ Answer |
|---|---|
| **H1** | A hard `C.CLIMB_MULT_MAX` of **1.40**; `RESPAWN_PUSH_DEPTH` stays **0.55**. ⛔ **No derived push, no `respawnPush()`, no `RESPAWN_PUSH_MARGIN`** — at 1.40 it would evaluate to 0.55 at every level and ship as dead code |
| **H3** | **Form A** endpoint interpolation, `C.HEAT_FULL_LEVEL` **99**, the "Mid" clamp package (below). `DIFFICULTY-NOTES.md` is corrected **in place** |
| **C3** | Carrier cargo weights are **emergent from the introduction schedule**. ⛔ No weight table, no new constants, and the schedule and GDD §6.2 must both say that is a decision |

### ⛔ The shipped curve

```js
v(level) = base + (clamp - base) * min(heat(level) / heat(C.HEAT_FULL_LEVEL), 1)
```

| Constant | Value | | Constant | Value |
|---|---|---|---|---|
| `HEAT_FULL_LEVEL` | 99 | | `VAULT_INTERVAL_MIN` | 1.00 |
| `SPAWN_INTERVAL_MIN` | 0.70 | | `VAULT_RIM_INTERVAL_MIN` | 0.35 |
| `ENEMY_CONCURRENT_MAX` | 8 | | `SURGE_INTERVAL_MIN` | 1.40 |
| `CLIMB_MULT_MAX` | 1.40 | | `WEAVER_APEX_MAX` | 0.75 |
| `CLIMB_MAX_BASE` | 0.18 | | `RESPAWN_PUSH_DEPTH` | **0.55, unchanged** |

⛔ **The concurrency ladder steps, and a player is meant to be able to name each
step:** 3 at levels 1–5 · 4 from 6 · 5 from 16 · 6 from 40 · 7 from 70 · 8 at 99.
⚠ Still 3 at level 5, which is where the Weaver arrives — the stall split does its
work at the tightest budget the run ever has. ⛔ `C.ENEMY_CAP` 16 is never
approached and is not touched.

⛔ **All seven heat-derived rows are clamped, so `C.HEAT_HOLD_LEVEL` is NOT
built.** `src/02-state.js`'s note anticipating it is superseded; the rule that a
hold, if one is ever needed, belongs in the **caller** is not.

### ⛔ Five phases, and P1 is unblocked today

| Phase | Builds | Effort |
|---|---|---|
| P1 | The spawner-stall split — the budget counts THREATS | medium |
| P2 | The heat clock, every derived value, and the respawn guarantee | **high** |
| P3 | GDD §8.1's introduction schedule | **high** |
| P4 | Telemetry — the tuning instrument | medium |
| P5 | The soak, the docs, the close | **high** |

⛔ **P1 lands before P3, measured:** on a level-5 eligible set at
`C.ENEMY_CONCURRENT` 3 every seed tested stalls — four seeds × two drivers ×
18,000 ticks, the level never leaves 1, longest stretch with no progress
16,336–17,806 ticks. Blocked spawner beats go 7,027 → 30,579 the moment a Weaver
becomes eligible and **94.6 % of them are beats the split releases.**

⚠ **The plan was SIX phases when first committed (`578c21b`).** H1's answer
removed the only production code the old P3 was to write, so it collapsed into
P2 — which now proves the guarantee **before** it wires a single accessor.

### ⛔ FOUR BASELINE RE-RECORDS, NOT ONE — this corrects what this file used to say

`test-cs006-p2.js`'s `P1_DETERMINISM_HASH` is a **cross-file** baseline: it runs
the closed `test-cs005-p5.js` in a child process, and that soak reaches level 15
on a six-kind board. **Measured: three separate CS007 changes move it.**

| Phase | Baseline | ⛔ Cause — exactly one each |
|---|---|---|
| P1 | `P1_DETERMINISM_HASH` | the release budget counts threats — 1,082 diverging ticks in that soak's own fixture, first at tick 3,380 |
| P2 | `GOLDEN_LANES` | heat lowers the level-2 spawn interval (1.600 → 1.428), so another spawn fits the window |
| P2 | `P1_DETERMINISM_HASH` | heat |
| P3 | `P1_DETERMINISM_HASH` | the soak's kind fixture becomes a level |

⛔ **`GOLDEN_LANES`'s first ten entries — `10,10,12,0,8,14,12,12,8,14` — must NOT
move.** They are the level-1 spawns and `heat(1)` is 0. A re-record that moves them
is heat leaking into level 1, or a draw spent at level 1: a bug, not a baseline.

⛔ **And the cause is NOT the introduction schedule, which this file and
`ROADMAP.md` both used to predict.** Measured: the golden's 3,000-tick window
never leaves level 2 (2,065 ticks at L1, 935 at L2, every spawn a Vaulter), and
GDD §8.1's eligible set is one entry at both levels, so the kind pick spends
nothing. P5 corrects `ROADMAP.md`.

### ⚠ Other measured corrections the planning session found

- ⛔ **GDD §8.1's "8 | First open well" is already delivered.** Level 8 →
  `WELLS[7]` = Vee, `closed: false`. It is a row the schedule documents, not one it
  implements, and CS007 does not touch well selection.
- ⛔ **`vector-vortex` is ALREADY registered** in `coinless-kit`'s
  `services/leaderboard/src/registry.js` (`79206f3`) with all seven `statsFields`.
  The carried task below is stale in its wording; what remains is confirming the
  **deployed** Worker carries it, and that is CS011's.
- ⚠ **`test-cs003-p2.js` asserts `!("SPAWN_MIN" in C)`** and stays green, because
  the constant is named `SPAWN_INTERVAL_MIN`. `SPAWN_MIN` never existed and
  `DIFFICULTY-NOTES.md` names it; P5 corrects the document.
- ⛔ **The introduction schedule reaches SIX closed test files plus `_harness.js`**,
  and all three closing soaks go red **loudly** on their own non-vacuity
  assertions (26, 33 and 7 failures) rather than silently passing over a
  Vaulter-only board. The full edit inventory and the replacement fixture shape are
  in `PLANNED-FEATURES-CS007.md` §4.4.
- ⛔ **Heat alone leaves 25 of 29 test files green; 18 never leave level 1.** Not
  one lane bound, lattice assertion or contract assertion moved — H2's discipline
  (heat never scales a hop or cross duration), measured rather than argued.
