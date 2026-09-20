# Vector Vortex — STATUS
Version: 0.0.9 · Changeset: CS013 (P4 of 5 done) · Wells: 16/16 · Enemies: 6/6 Classic, 3/3 Overdrive · Tracks: 3/5 · Tokens: 5/5 effects

## Phase ledger — CS013

Plan: `PLANNED-FEATURES-CS013.md` (§0 answered, every recommendation);
prompts: `IMPLEMENTATION-PHASES-CS013.md`. Reasoning per phase: `log/CS013.md`.
CS012's ledger and review notes: `log/CS012.md`.

| Phase | Commit | One line |
|---|---|---|
| P4 | this commit | The Mimic, ⚠ ON PROBATION (MI1–MI3): `class Mimic extends Enemy` — reflect-then-open, the apex hold, and a budget that is its two states rather than a counter; `class MimicShot extends WeaverBolt` over the bolt's new overridable `speed()` (a Classic bolt bit-identical, proved by hash); the row at Overdrive 16 — ⛔ **one row is the whole cut**; two polys on the Drifter's three channels and the player's streak turned; `C.SFX.reflect` + two kill pitches. `test-cs013-p4.js` (222). ⚠ TWO unpredicted closed edits, both below. 5 of 5 red |
| P3 | `0978c53` | The Warden (W1–W6): the ninth contract field `aloft` on the base; `class Warden extends Enemy` (`07-enemies-overdrive.js`) — the climb, the lift-off at depth 1, the rim hunt, and hover → telegraph → discharge through ONE `setPhase()`; the row at Overdrive 11; the `aloft` skip in `collideShots()` and `jumpStrike()` — the FOURTH kill site; `drawWarden()` over `liftPoints()`, the extracted one copy of the lift math. `test-cs013-p3.js` (243). ⚠ TWO unpredicted closed edits, both below. 4 of 4 red |
| P2 | `ad3b61b` | Lance, Spread, Ward (T7–T9): `Shot.pierce` at fire time + `fireLanes()` + the cap in force (`06-shots.js`); one term on the shot-retiring line and the Ward's early return below `killSkimmer()`'s guard (`09-collision.js`); `Thorn.chip()` × `LANCE_CHIP_MULT`, paid per chip of length; the gold streak and `WARD_POLY`/`craftPoints()`'s shell; `C.SFX.wardBreak`. `test-cs013-p2.js` (167). ⚠ TWO unpredicted closed edits, both findings below. 3 of 3 red |
| P1 | `18b812a` | Tokens: `state.tokens` / `state.powers`; `10-powerups.js` (`dropToken()` the ONE way in, one draw per Overdrive kill, a no-op in Classic; `updateTokens()`; Bounty, Recharge; lasting flags); both tables in `C`; `drawToken()`; `C.SFX.collect`. `test-cs013-p1.js` (140). Four closed files in place, one edit unpredicted. 2 of 2 red |

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (25 modules + 3 inlined kit,
  **736.9 KB**); the manifest is checked both directions against `src/`, and a
  missing `KIT_INLINE` file fails the build.
- `node scratchpad/run-all.js`: **70 files, all green, zero skips** (⚠ machine
  load moves the wall clock a lot; `test-cs008-p8.js` alone takes ~88 s).
- **CS001–CS011 are closed; each has a `log/CS0##.md`.** ⛔ **The Classic roster
  is complete at six and GDD §6.2's variant table at three** (CS005); ⛔ **all
  five of GDD §4.5's death conditions are live** (CS006), and every hazard since
  has been a new SHAPE of one of them.
- **CS012 closed 2026-09-17 — OVERDRIVE'S CORE.** `drive`; `C.MODE_FLAGS` and
  `modeHas()`; the Reaver behind `C.SPAWN_SCHEDULE_OVERDRIVE`; OVERDRIVE on MODE
  with its own board, SCORES per mode and `progress` v2; the Jump (kit-audio
  **0.4.0**); the combo multiplier. `log/CS012.md`.
- ⛔ **TEN SOAKS, AND THEY PROVE DIFFERENT THINGS ON DIFFERENT BOARDS** —
  `-cs003-p5` … `-cs007-p5` on the board, and the front-door pairs `-cs008-p8`,
  `-cs009-p6`, `-cs010-p5`, `-cs011-p6`, `-cs012-p6`. Each file's header says
  what its pair holds constant. ⛔ **CS013's is an ELEVENTH file, never a
  widened closed one.**
- ⛔ **`test-cs006-p5.js` carries the count-based no-draw rule**, a function of
  the LEVEL: `spawnEnemy`'s 1 plus `pickSpawnLane`'s bounded
  `[1, C.SPAWN_LANE_TRIES]`, plus +0 at levels 1–2 and +1 from level 3.
- ⛔ **`test-cs004-p1.js`'s `GOLDEN_LANES` — its first SIXTEEN entries are the
  ORIGINAL `9ebd27b` recording**, held by a separate prefix assertion; CS008 P1
  appended `2, 5`. ⛔ **Any other move is a defect, not a baseline.**
- ⛔ **`test-cs006-p2.js`'s `P1_DETERMINISM_HASH` is the one baseline that moves,
  and it is CROSS-FILE** (it runs `test-cs005-p5.js` in a child process). It
  stands at **1229033515** (CS008 P1b; unmoved through CS009–CS012). ⛔ Re-record
  it once per change, one named cause at the assertion.
- ⛔ **On a boundary rider the LATTICE is where §17 item 3 stands, not the speed
  bound** (`RATIONALE.md#boundary-lattice`).
- ⛔ **`AudioSys.ctx` is null until a key, click or lifted touch**, and every
  audio entry point returns early on it. `buildGame({ audio: true })` installs
  the recording fake (`X._audio`); the default is still no audio API. ⛔ **A
  gesture is a DOM event**: `G.input.keyDown()` does not make one, so a test that
  wants audio attaches `fakeTarget()`s and fires `keydown` (`test-cs009-p6.js`,
  `-cs010-p5.js`, `-cs012-p6.js`, `-cs013-p3.js`).
- ⛔ **A seat writes no `state` and draws nothing.** ⛔ The headroom gate
  (`test-cs009-p5.js`, ⚠ provisional) is D16's limiter-curve model: 0.450 against
  `pulse` 0.3512, `title` 0.3408 and `drive` 0.3505 (its own gate, 1e-9 s tie
  tolerance). It holds only at the rendered settings, so `test-cs010-p1.js` pins
  `C.MUSIC_LIMIT` to D2's literals.
- ⚠ **SETTLED — MUSIC IS STRUCK, NEVER SWELLED** (Paul, 2026-09-16; `CLAUDE.md`
  Audio, GDD §11.3). ✅ Paul's lab picks are ported for `title` and `pulse`;
  ⚠ **`pulse` loops at 72 s** and `drive` at 62.6 s.
- ⛔ **Read GDD §6.5 before adding an enemy.** NINE contract fields (plus
  `points()`), the wiring points, and the Dive.
- `tools/music-lab.html` and `tools/sfx-lab.html` are the porting sources for
  `17-audio-tracks.js` and `C.SFX`, bound to the build by text identity;
  `tools/well-lab.html` (⛔ the visual audition has not happened) and
  `tools/feel-lab.html` (`npm run serve` for LAN) complete the set. ⛔ **A new
  `SFX_KILL_PITCH` voice is a THREE-file edit**: `C`, sfx-lab's BLOCK SFX (the
  same text) and its `PITCH_*` candidate tables.

## Known issues

### What CS013's next phases must act on

- ⛔ **FOUR KILL SITES AND FIVE KILL LINES** (P3, W4; the rule is `CLAUDE.md`'s).
  `jumpStrike()` runs THIRD in `updateCollisions()` and ⛔ **its line matches
  none of `test-cs012-p4.js`'s six `COMBO_OUT` strings** (it ends on `\n  }`).
  ⛔ **A phase that edits a kill line repairs `COMBO_OUT` AND `-p4.js`'s two
  shot-kill `mutantRed` strings.**
- ⛔ **A CLOSED OVERDRIVE PLAY AT L11+ OWES ITS DRIVER TWO THINGS, AND BOTH ARE
  THE PLAYER'S OWN ANSWER** (P3 and P4, MEASURED — the one thing plan §11
  under-predicted, twice). (1) **JUMP at anything `aloft` within `HIT_LANE_TOL`**:
  a Warden is killable only by the Jump and `blocksClear: true`, so a
  non-jumping driver stalls the board (P3: `hunt()` lost 90 kills and the
  Recharge drop; `drive()` lost the clear its two bonus mutants need).
  (2) **NEVER TARGET a `MimicShot`, and STEER AWAY from one within a lane**: it
  declines every shot and kills by contact, so "the deepest thing on the board"
  steers into the one entity a shot cannot remove. ⛔ **Repairs are the DRIVER,
  never the build, never a lowered level and never a relaxed assertion**; a
  driver change is a no-op wherever the entity does not exist, so Classic pairs
  stay bit-identical. `drive()`'s jump branch is gated on an optional `Z` so
  §11's Classic pair still runs the recorded driver to the byte.
- ⚠ **AND THE DRIVER IS NOT ALWAYS THE WHOLE REPAIR** (P4, MEASURED). A Mimic
  costs the board real throughput on purpose — **302 kills over 20,000 steps
  with its row mutated out against 285 with it in** — and the driver repair was
  worth 285 → 286. `test-cs013-p1.js`'s played window went **4,000 → 5,000 ticks
  per board (25,000 steps)** instead. ⛔ That is a FIXTURE repair restoring the
  precondition, never a lowered claim: a non-vacuity count is repaired by
  playing longer.
- ⛔ **EVERY OVERDRIVE BOARD MOVED AFTER ITS FIRST KILL** (one roll each, K4).
  Three closed fixtures were re-seeded at P1: `test-cs012-p2.js`'s wall soak
  (`SOAK_SEED`), `test-cs012-p4.js`'s ×1 run (seed 17), `test-cs012-p6.js`'s
  Overdrive pair (`OD_CLOCK` 7927). ⚠ All three are seed-fragile. ⛔ **P3 moved
  none of them by re-seeding**, and ⛔ **P4 moved none either** — what broke was
  repaired by the driver and the fixture above; ⚠ P5's soak is the next mover.
- ⛔ **ITEM 8 PRICES A BOUNTY PER STEP via a `collectToken` spy** in
  `test-cs012-p4.js` and `-p6.js`; a new unmultiplied event owes both a price,
  and a new PRICED KILL owes all three `gddPoints()` copies a branch (the P4
  finding below).
- ⛔ **`state.powers` IS READ IN THREE FILES** (P2; the rules are `CLAUDE.md`'s):
  `06-shots.js`, `09-collision.js` and `23-main.js`'s draw. **`purgeUses` has a
  second zeroing writer** (Recharge). ⛔ **`C.TOKEN_COLOR` `#FFF347` is also a
  pierced shot's streak and the Ward's shell**; the Mimic's violet (MI3) must
  not reach for it, for the eight enemy colours or for the Warden's `#477EFF`.
- ⛔ **THE SHOT CAP IS THE CAP IN FORCE, NOT `C.SHOT_MAX`** (P2, T8; GDD §17
  item 4 reworded), and 24 IS reached (MEASURED: 24 in flight, 15.0 /s per lane
  on three). ⛔ **A test that bounds `state.shots` reads the cap off
  `state.powers`** — `test-cs012-p6.js`'s soak was repaired for exactly this.
- ⛔ **`liftPoints()` IS THE BUILD'S ONE COPY OF THE LIFT MATH** (P3;
  `05-skimmer.js`), with THREE asserted call sites: `craftPoints()`,
  `drawWardenBeam()`, `drawWarden()`. A fourth silhouette that leaves the rim
  passes its already-projected points and a count, never a second projector.
- ⛔ **`killSkimmer()` HAS A SECOND EARLY RETURN, AND EVERY DEATH PATH MEETS IT**
  (P2, T9; the rule is `CLAUDE.md`'s). ⛔ **A P4 death condition inherits the
  Ward automatically**, and a staged death in an Overdrive fixture must clear
  `state.powers.ward` or set up two hits — P3's Warden fixtures do the former.
- ⛔ **`onShot` IS ASKED BY TWO PATHS AND A NEW ONE MUST DECIDE WHAT `null`
  MEANS** (P2, T7): a shot passes itself, the rim sweep passes `null`.
  `Thorn.onShot()` is the build's ONE reader of the argument, and
  `    addScore(C.PTS_THORN);` is STILL in the build exactly once
  (`test-cs012-p4.js:607`). ⚠ The Warden is asked by BOTH and declines both;
  ⚠ the Mimic reaches only the first, because it never arrives at the rim.
- ⚠ **FINDING (P2–P4, MEASURED) — SEVEN unpredicted closed edits, every one
  "a claim written before the effect existed", restored in place.** P2:
  `test-cs013-p1.js`'s "a death keeps every power" (⚠ T5 and T9 interact, and
  §11 said "none") and `test-cs012-p6.js`'s "no array past `C.SHOT_MAX`".
  P3: `test-cs004-p1.js`'s "exactly the EIGHT contract fields, in contract
  order" — rewritten for the third time (CS008 P2, CS009 P5), now a named
  constant the message counts — and `test-cs013-p1.js`'s stalled boards.
  P4: `test-cs013-p1.js`'s played non-vacuity (above) and
  ⛔ **`test-cs013-p2.js`'s `gddPoints()` — THE THIRD COPY OF THAT HELPER**
  (`-cs012-p4.js` and `-p6.js` were both predicted). ⛔ **A NEW PRICED ENTITY IS
  A THREE-FILE EDIT**, and the third file is one this changeset wrote.
  ⛔ **§11 predicted `test-cs012-p2.js`'s "Enemy stays fields and signatures",
  which reads the PROTOTYPE and never moved: a field-list pin and a prototype
  pin are two different greps.**
- ⛔ **`hudLayout()` HAS TWO OVERDRIVE RECTANGLES, BOTH TIGHT, AND NOTHING IN
  CS013 ADDED ONE** (T10). ⛔ The centre-top band is 76.29 px (the Fan well);
  `HUD_COMBO_Y` 6 + `SIZE` 56 + 2 × `PAD` 4 clears it by 6.29 px, so
  `HUD_COMBO_SIZE` cannot pass ~62 (GDD §10.4).
- ⛔ **AN OVERDRIVE ENEMY GOES IN `07-enemies-overdrive.js`** (CS012 P2, O15),
  against `07-enemies.js`'s contract, and reaches a board ONLY through
  `C.SPAWN_SCHEDULE_OVERDRIVE` — the Reaver at 6, the Warden at 11, the Mimic at
  16, and ⛔ **that table is COMPLETE at three rows**. No bench key (O16);
  `DEBUG_ROW_KINDS` stays Classic's six. ⛔ **`test-registry.js`: `enemies` 9,
  `enemyKinds` 13** — P4 moved the second by TWO against the first's ONE, because
  `mimicShot` is a kind with no roster row (the bolt's case).
- ⚠ **THE MIMIC IS ON PROBATION AND CUTS IN ONE ROW** (P4, MI3; GDD §14.6,
  §21 #6). `{ level: 16, kind: "mimic" }` is the only thing that puts one on a
  board and `mimicShot` is deliberately not a row, so the reflections go with it.
  ⛔ **Keep it that way**: a second way in makes CS017's verdict a phase rather
  than a one-line edit. ⛔ **`C.MIMIC_APEX` IS BOUNDED, NOT TUNED** (MI2):
  `≤ (1 − RIM_CONTACT_DEPTH) − SURGE_TELEGRAPH × (MIMIC_SHOT_RATIO / SHOT_TIME)`
  = **0.4308** against 0.40, asserted from the constants AND on played boards
  (min flight MEASURED **0.4767 s** over 12,000 steps) — raising the apex or the
  ratio turns the suite red. ⛔ **`climbMult()` has SEVEN call sites** and
  `test-cs007-p2.js:476`'s `CLIMBS` seven entries.
- ⛔ **THE BOLT'S SPEED IS AN OVERRIDABLE READER** (P4, MI2), named ONCE in the
  build inside `WeaverBolt.speed()`, and ⛔ **a speed refactor is proved by a
  HASH** — a Classic run bit-identical against a build carrying the old line —
  never by reading. ⚠ **A `MimicShot` is the SECOND entity that can be airborne
  when a dive starts**, and `startDive()` drops it, the bolt's answer.
- ⛔ **AN `aloft` ENTITY IS INVISIBLE TO THE SHOT PASS AND VISIBLE TO EVERYTHING
  ELSE** (P3, W1). `collideShots()` skips it; `collideSkimmer()`, `purgeTarget()`,
  `respawnSkimmer()`, `dangerInputs()`, `threatCount()` and `wellCleared()` all
  read it as an ordinary entity at depth 1, and that is the point. ⛔ **A P4
  reader that wants to exclude one must say so itself** — there is no second
  array and no exemption to inherit.
- ⛔ **A MUTATION RUN THAT THROWS, OR ANSWERS UNREADABLY, IS A DEFECT IN THE
  TEST**: guard the reads, report a COUNT and one index, and ⛔ assert the string
  is in the build exactly once BEFORE asserting red.
- ⚠ **FINDING (CS012 P2, MEASURED): CS008 P1's ε and `atRim()` mutations no
  longer redden a rim-arrival table alone** — P1b's sweep masks them under held
  fire, so an item-13 table mutates the sweep AND ε together
  (`test-cs012-p2.js` §9: 18/24). ⛔ **Neither the Warden nor the Mimic owes
  item 13** (R10, confirmed at P3 and P4): one cannot be shot and passes the band
  harmlessly, the other never leaves its apex.
- ⚠ **EVERY KIT `VERSION` BUMP IS A CLOSED-FILE EDIT.** FOUR files pin
  `AUDIO_VERSION` by literal (F3) and two pin the signal path node by node.
  ⛔ A plan that bumps a kit owes §11 a row per pinning file.
- ⚠ **DELETING A CONFIG OBJECT IS A DIFFERENT GREP FROM RE-SOURCING A KEY**:
  ⛔ a plan that deletes one owes §11 a grep for `in <OBJECT>` too.
- ⛔ **`instanceof` IS PER BUILD.** A `gddPoints()`-style helper closed over one
  build matches nothing in any other, and every non-vacuity check then passes on
  zero. Take the build as an argument.
- ⛔ **A PHASE LENGTH IS NOT `Math.ceil(limit / C.FIXED_DT)`.** `1/60` is not a
  binary fraction, so a count-up timer takes 13 steps to reach 0.20 s where
  `ceil` says 12. Assert the property, never the step count.
- ⛔ **ATTRIBUTE A KILL TO THE PHASE THE STEP ENDED IN** (P3; `test-cs005-p3.js`'s
  form). The entity pass runs before the collision pass, so a step that ENTERS a
  discharge is lethal on that step — reading the pre-step phase blames the fuse
  for five kills it did not make.

### The board, the entities and the Dive

- ⛔ **THE REAVER (CS012 P2) IS A `Vaulter` SUBCLASS; THE WARDEN AND THE MIMIC
  ARE NOT** — and the MimicShot is a `WeaverBolt` one (P4). Each variant leans on
  its parent's overridable readers (`hopDuration()`, `midClimbDir()`, `speed()`).
  ⛔ Keep each `C.X_CLIMB * climbMult()` textually as is: `test-cs007-p2.js:476`
  reads seven. ⛔ `instanceof X.Vaulter` in closed files matches a Reaver and
  NOT a Warden or a Mimic — which is why all three `gddPoints()` copies need
  their own branches, ordered subclass-first.
- ⚠ **A wall-pinned, fire-holding driver parks an Overdrive L7 board with no
  Reaver released**; `test-cs012-p2.js`'s `pinWall()` alternates the sweeping
  replay with a fire-released wall pin.
- ⚠ **THREE ROSTER CLASSES PARK RATHER THAN HUNT** — Carrier, Weaver, Surger.
  ⛔ **The repair is the driver, never the build.**
- ⛔ **The Dive has no visual.** No changeset owns it; `state.dive.depth` is the
  value a renderer wants. ⚠ **`C.DIVE_TIME` is the WHOLE dive, grace included**
  (descent 2.25 s); CS014's `DIVE_TIME_OD` inherits it.
- ⚠ The dive death-loop bound in `test-cs006-p5.js` is measured at its limit;
  `test-cs007-p5.js`'s well-stall gate does not catch a reverted `threatCount()`
  — the blocked-beat assertion beside it does.
- ⚠ **Unowned, none reachable by the suite's drivers:** a second Purge prefers a
  bolt or a reflection above 0.95 and pays 0 (PREDICTED); a run STARTING past 99
  gets the modulo well and no band roll (unreachable at `START_DEPTH_CAP` 81); no
  played board reaches `C.LIVES_MAX`; a rim Vaulter — ⚠ and an aloft Warden,
  the same `huntDir` — hunts the CONTINUOUS lane, so a player parked between
  centres has it hopping back and forth. **GDD §12's four-second promise is
  CS016's, and both "jump at the thing you cannot shoot" and "leave the lane your
  own shot came back down" are now part of it.**
- ⛔ **A chosen level is reached from START DEPTH**, never `w`; a console unlock
  is `levelRecord("classic").noteCleared(81)`.
- ⛔ **A WARDEN HOLDS A RELEASE SLOT UNTIL SOMEBODY JUMPS** (P3, MEASURED): it is
  `blocksClear: true` and unkillable by anything else, so at L13 a non-jumping
  driver sees 1–3 released per 5,000 steps and clears nothing. ⚠ **A MIMIC IS
  THE SOFTER VERSION OF THE SAME THING** (P4, MEASURED): `blocksClear: true` and
  two shots plus a 0.5 s guard, worth **17 kills over 20,000 steps**. Both are
  W5's / MI1's intent; whether the concurrency ladder should make room for either
  is §8.2's tuning pass.

### The Jump and the combo (CS012 P4, P5)

- ⛔ **Airborne is a phase and the multiplier lives at the kill lines — both
  rules are `CLAUDE.md`'s and are not repeated here.** The bag is `state.jump`
  `{ phase, t, cool, latched }`.
- ⛔ **THE LANDING STEP IS NOT AN AIRBORNE STEP** (CS012 P6, MEASURED).
  `updateJump()` runs at the TOP of `update()`, so a step that BEGINS airborne
  can end in `recover` — contact-lethal and unable to fire, by design. An
  invariant on the pre-step phase alone reads two legal landing deaths as a breach.
- ⛔ **`updateJump()` MUST STAY A TOTAL NO-OP OUTSIDE `modeHas("jump")`** — it
  writes nothing, `latched` included. ⛔ **THE COOLDOWN COUNTS FROM LANDING**, and
  `JUMP_RECOVERY` is its first beat rather than a fourth timer. ⛔ **`resetJump()`
  HAS THREE CALLERS** — `enterWell()`, `respawnSkimmer()` and `startDive()` — and
  it does NOT clear `latched`; `killSkimmer()` forces `latched` true.
- ⛔ **FOUR SIGNATURES MOVED, EVERY ADDED ARGUMENT OPTIONAL** (older callers
  bit-identical): `skimmerPoints(well, lane, squash, lift)`, `Skimmer.draw(ctx,
  well, lift, ward)` and `drawShot(ctx, well, lane, depth, pierce)` (P2). The HUD
  view carries `jump`, `null` in Classic. ⛔ `skimmerPoints()`'s body is
  `craftPoints(well, poly, pts, …)`, shared with `wardPoints()`.
- ⛔ **`test-cs012-p5.js` PINS TWO TEXTS BY `mutate`, each exactly once:**
  `  if (jumpAirborne(state)) return;` (with its newline) and
  `state.input.fire && jumpCanFire(state) &&`; it also mutates `JUMP_LIFT` to 0.
  ⚠ It RUNS `test-cs009-p5.js` in a child process, so a change that reddens that
  file reddens this one too, with a less useful message.
- ⛔ **A lapse does NOT empty the kill count** — O3 empties it on a death alone.
  ⛔ `since` WRAPS at `C.COMBO_WINDOW`. ⛔ **`peak` is 0 until the run's first
  kill**, so "never below the live multiplier" starts there, not at `newState()`.
- ⛔ **SIX MUTATION STRINGS TAKE THE COMBO OUT** (`COMBO_OUT`,
  `test-cs012-p4.js`): four kill lines plus `comboDeath()` and `updateCombo()`.
  The kill lines are textually identical, so each string carries the line that
  FOLLOWS it — which is also why P3's fifth line matches none of them.
- ⛔ **GDD §17 item 8 WITH A MULTIPLIER IS ASSERTED PER `addScore` CALL, NOT PER
  STEP**: a step can span a step up. The board's price multiset holds prices > 0
  only — a zero-price death is a bolt or a reflection self-terminating, or a
  Thorn taken by its last chip.
- ⛔ **`state.shots.push` CANNOT BE INTERCEPTED to see a new shot** (CS012 P6,
  MEASURED): `updateShots()` filters into a NEW array before it fires, so a hook
  on the pre-step array never sees it; `state.tally.shotsFired` is the honest
  counter. ⚠ `state.enemies` is the opposite — filtered AFTER both passes, so a
  Carrier's split and a Mimic's reflection both land.

### Audio

- ⛔ **KIT-AUDIO 0.4.0** — the chain and its rules are `CLAUDE.md`'s. The duck
  and dip sit AFTER the limiter (a duck in front measured −1.9 dB), and
  `setHighpass()`'s `Q` is a fixed Butterworth so D16's model needs no term.
- ⚠ **FINDING (CS012 P1, MEASURED): THE HEADROOM GATE CANNOT CATCH A LOUDER
  TRACK.** Under D16's curve a doubled layer moves the model by 1/20 of its dB
  (red needs an input of 152.8). The gate guards the limiter's premise, the curve
  and the buses. ⛔ **Whether it should also bound the limiter's INPUT is Paul's.**
- ⛔ **`drive` IS UNTIERED, UNMARKED AND UNHEARD** (O13); ⛔ **Paul's lab port
  rewrites `test-cs012-p1.js`'s "no tier" / "no audition mark" in place.**
  ⚠ sfx-lab plays only `pulse` in context, so the Surger tone over `drive` has no
  lab audition — ⚠ and since P3 that tone is the Warden's fuse too. ⛔ One
  `beat: true` layer per track: `pulse`'s `heart`, `drive`'s `kick`.
- ⚠ **Classic's intensity peaks at 0.668, Overdrive's at 0.6448** (CS012 P6, 121,840
  front-door frames; staged boards record 0.6593, unmoved by P3 or P4).
  ⛔ **GDD §19 keeps its ✗ and no weight is rescaled** (O14, D6).
- ⚠ **Unowned:** the Surger tone's 1.106 sample peak at unity, the empty VOICE
  bus (A3), and R2's pad-only silence.
- ⛔ **CS009 TRAPS IN AUDIO CODE.** (1) The vocabulary scan reads the whole built
  file, comments included, and also bans "atari" (write "the original's").
  (2) Never `.key` after an identifier ending in `e`. (3) Never start a comment
  line with a module banner for `21-` or `22-`. (4) No platform RNG. (5) Never
  write `audioFrame()` inside `frame()`, comments included, and that function's
  body may not contain the text "draw".
- ⛔ **THE SURGER TONE IS DECIDED AT FRAME END**: frozen or off play stops every
  voice; a live run with no step holds them. ⛔ **`reconcileSurgeTones()` is
  DUCK-TYPED** (`phase === "telegraph"` plus `chargeTip()`) — how the Warden
  borrows it with `19-sfx.js` unedited, and ⛔ **an entity that does NOT want the
  voice must not match** (K8). ⚠ The Mimic's `phase` is `"closed"`/`"open"` and
  it has no `chargeTip()`, so it does not.
- ⛔ **THE DIRECTOR runs BEFORE `setState()`.** Its one board reader is
  `dangerInputs(state, out)`; **a new `heat(` call turns `test-cs007-p2.js` red**
  (use `heatT()`), and **`19-sfx.js`'s code may not name `state`**.
  ⛔ **`setState()` before the first gesture is DROPPED** — which is why
  `audioFrame()` calls it every frame; never move it onto a screen change.
- ⛔ **AN EDIT TO `16-audio-engine.js` OR `17-audio-tracks.js` IS A THREE-FILE
  EDIT** (both labs' BLOCK A / B), and so is a change to `C.MUSIC_LIMIT`,
  `C.LAYER_THRESHOLD`, `C.LAYER_CROSSFADE` or `C.FILTER_*` (`test-cs010-p3.js`
  pins both labs' `LAB` copies). `00-config.js`'s SFX group is sfx-lab's BLOCK
  SFX; ⛔ each `C.SFX` event stays ONE line starting `    name:`, and a NEW
  event also owes the lab a brief, an A label, 1–2 alts and an in-context
  sequence (`test-cs009-p4.js` counts all four). ⛔ **25 events, 11 voices.**
- ⚠ **`test-cs009-p5.js`'s headroom sort compares exact floats**: a non-binary
  `stepDur` (138 BPM) reads a back-to-back pair as an overlap, repaired in place
  by a future tempo port. ⛔ A test counting scheduled steps counts NOTES, never
  distinct start times; an entry step is silent (`menuEntering`).

### Meta, menus and the front door

- ⛔ **The store rules are `CLAUDE.md`'s.** The hazards: ⛔ **`OWN_KEYS` is the
  declared per-profile list** (CS015 adds `achievements` there and to `Store`;
  never `scores` or `profiles`); ⛔ **the boot block RUNS INSIDE THE HARNESS**
  (`Meta.boot()` writes `profiles` in every build); ⛔ **kit-leaderboard cannot be
  inlined** — `test-cs009-p1.js:508` bans its `setTimeout`, `test-cs002-p1.js`
  its `addEventListener`.
- ⛔ **THE RUN'S END IS `Meta.runEnded(outcome)`** — `startGame()`'s last line,
  `quitToTitle()`'s first (on pause), `frame()` after the steps. ⛔ **ONE GATE,
  `Meta.eligible()`**, closed by a bench digit, `0` or `w` in play.
- ⛔ **`Leaderboard`'s two-client rule is `CLAUDE.md`'s.** The hazards:
  ⛔ **`C.GAME_ID` is the SAVE keyspace, never a board id** (CS012 P6 repaired
  seven closed assertions on it); it reads `window.KitLeaderboard` **LAZY on
  every call**, so a test sets a fake on `X._env.win`; and ⛔ **a fake serving
  both clients counts its queues and submits PER `gameId`.**
- ⚠ **TWO TESTS READ coinless-kit's `registry.js`** from `../coinless-kit` and
  each SKIPS LOUDLY without it: `test-cs011-p5.js` at `f0b0eb2`, `test-cs012-p3.js`
  at `e2efed5` (⛔ never `f8d34f3`). ⛔ **P5 cannot close with a skip**, so that
  clone must be present.
- ⛔ **`progress` IS v2 AND PER MODE**; `readProgress()` returns BOTH modes so
  `noteCleared()` writes the pair; `levelRecord(mode)` defaults to `state.mode`.
- ⛔ **MODE IS `OVERDRIVE`, THEN `CLASSIC`, BOTH ENABLED** — the row ORDER is
  GDD §13's default highlight. ⛔ **A driver wanting a Classic run steps ONE row
  down first** (fifteen closed files carry that repair); ⛔ **START DEPTH is
  built for `pendingMode`, never `state.mode`.**
- ⛔ **SCORES' ROWS ARE MODE, VIEW (module only), THE ENTRIES, BACK** — VIEW is
  row 1, rebuilt on entry / MODE / VIEW / a board's answer, never in `draw()`.
  ⛔ **The entry mode is the last run STARTED this session** (`lastRunMode`).
- ⛔ **Nine texts in `22-meta.js`, `23-main.js` and `lib/kit-leaderboard/` are
  pinned by a closed CS011 `mutate`, each exactly once in the build.**
  ⛔ **Grep `test-cs011-*.js` for `mutate:` before editing a line in those three
  files.**
- ⛔ **The title has four rows**; game over three lines; ⛔ **OPTIONS HAS TEN
  ROWS, THE WINDOW SHOWS SEVEN**, rows added before BACK, never above TELEMETRY.
  ⛔ **NAME steps in place of the menu model** (`stepName()`), armed and ended in
  `syncScreen()` only; ⚠ there Space, Z and X type.
- ⛔ **NO TELEMETRY WRITE FROM A PLAY STEP.** A settings save runs inside
  `update()` on a menu step; `levelRecord(mode)` reads storage on every call.
- ⛔ **`Game.reset()` restores the controls and the sound rows, writes nothing,
  and leaves the screen on play** — a fixture's `frame(0)` before
  `quitToTitle()` schedules real notes on the fake at t = 0; a test claiming a
  setting survives a RELOAD builds again over the same `Map`.
- ⚠ **A `Store.set` spy sees only `p0`'s writes.** ⚠ The stored `lastUsed` stays
  `""` after a first boot — accepted by Paul; do not "fix" it by renaming
  `legacyProfileId`.
- ⛔ **A REPLAY THAT OUTLIVES ITS GAME OVER MEETS A LIVE MENU** — a scripted Fire
  there RESTARTS on a time seed and a Purge quits, so stop pressing at the stop;
  ⛔ **a driver that starts at the title spends two live steps before its first
  press.** ⛔ **THE SCRIPTED FIRE-HOLDER HAS NO DEATH PATH ON LEVELS 1–4**, and
  ⚠ a SCRIPTED JUMPER outlives that too (39 % of the cycle), so
  `test-cs012-p6.js` stops jumping when the fire hold ends. ⚠ P3's and P4's
  jumping drivers jump only AT something aloft, so they do not inherit it.
- ⛔ **`test-cs008-p4.js` scans the WHOLE built file, comments included**: no
  `fillRect`/`strokeRect`, one `.fillText(`/`.strokeText(` site.
  `test-cs002-p3.js` bans `ctx.fill` in `14-render-entities.js`;
  `test-cs002-p1.js` bans `e.key`, `.touches`, `getGamepads`, `clientX` and
  `addEventListener` outside `04-input.js`, and `C.`/`state.` inside it;
  `Game.draw()` must not name `Telemetry`. ⚠ **Strip comments before grepping a
  function's own source** — P3's draw scan read "fill" out of prose.
- ⛔ **`Game.update()` calls `syncScreen()` TWICE**, before and AFTER
  `input.sample()` — remove the second and a Fire held in play confirms RESUME.
  ⛔ `frame()` drains `hitStopLeft` only on `"play"` and `"gameover"`.
- ⚠ **`_harness.js`**: `{ stub }` rebinds a named top-level function to a no-op;
  `{ spy }` counts calls and runs optional `.before`/`.after` hooks. ⛔ **A
  function inside `Game`'s closure cannot be reached this way**, `Game.update`
  included.
- ⚠ `drawFragments`, `drawHud` and `drawMenu` read `C`, so kit-fx and kit-menu
  extraction each owe an options argument. ⚠ `C.MENU_COL_W` 460 clears "MOUSE
  SENSITIVITY" + an adjusting detail. ⚠ The touch buttons and the top-centre
  pause target are live but undrawn; the combo readout overlaps that target (O8)
  and covers 10 rim lane-centres (F1, accepted at P3, GDD §10.4).
- ⚠ **A closed test may pin the literal text of a line a later phase changes.**
  ⛔ Pin only the argument the claim is about.

## Open questions (blocking)

- None.

## Carried tasks

- ⛔ **Paul, when he wants it: `drive`'s lab session** (PASS marks, tiers, gains,
  tempo). It ports as its own commit. Nothing waits on it.
- ⚠ **Paul replaces `C.CREDITS_LINES` before ship.**
- ✅ **Both boards are registered and deployed** (coinless-kit `e2efed5`):
  `vector-vortex` and `vector-vortex-overdrive`, `maxMetricPerSecond` **150,000**,
  the same seven `statsFields`. ⛔ Never pin `f8d34f3`. ⚠ The deployed fields
  cannot be read remotely.
- ⛔ **CS015 — achievements** (Paul's M4), planned once Overdrive exists.
- ⛔ **The seven debug spawn actions ship until CS017** (Paul's H5 call).
- Backport kit-input (0.8.0), kit-menu (0.1.0), kit-fx, kit-audio (**0.4.0**) and
  kit-leaderboard (0.2.1, `lib/`) to coinless-kit — each a separate manual step.
  `createScores` (`src/22-meta.NOTES.md`) is kit-scores' draft.
- ⚠ **`CLAUDE.md` carries no telemetry rule**; whether it earns one is Paul's.
  ⛔ **`TELEMETRY_FIELDS` is frozen at 29 columns and `telemetry` at v1**; it,
  `TELEMETRY_KINDS`, `telemetryRow()` and the version move together.

## Next up — CS013 P5

The eleventh soak, the review and the close. `scratchpad/test-cs013-p5.js`, ⛔ a
NEW file in `test-cs012-p6.js`'s form, never a widened closed one; then the
review that reads every phase together, `log/CS013.md` compressed, `STATUS.md`
reset and GDD §19's Overdrive row closed.
`IMPLEMENTATION-PHASES-CS013.md`'s P5 prompt. ⛔ Read "What CS013's next phases
must act on" above first — in particular the L11+ DRIVER rule, which now has
TWO clauses (jump at anything aloft; never target a `MimicShot` and steer away
from one), and the fixture-repair note beside it. ⛔ P5's non-vacuity list owes
a Mimic killed and a reflection alongside the five tokens.
