# Vector Vortex — STATUS
Version: 0.0.10 · Changeset: **CS014 in flight** · phase: **P1 done, P2 next** ·
Wells: 16/16 · Enemies: 6/6 Classic, 3/3 Overdrive · Tracks: 3/5 · Tokens: 5/5 effects

## Phase ledger

⛔ **CS013's ledger and reasoning are in `log/CS013.md`; CS014's are in
`log/CS014.md`.** ⛔ `log/` is not session context: pull one file in only when a
question genuinely needs project history, and say that you did.

| Phase | Shipped |
|---|---|
| **CS014 P1** ✅ | The ring flight's simulation half — the gate, the set, the take pass, the score path |

**CS014 P1 — the ring flight (RF1–RF6, RF9; `log/CS014.md`).** `C.MODE_FLAGS`
gains `rings` in both rows; `00-config.js`'s Dive group gains `RING_POINTS` 100,
`RING_ARC_LANES` 1.5 and `RING_LANE_STEP` 0.25, all ⚠ provisional; `state.dive`
gains `rings`; `11-dive.js` gains `diveTime()`, `layRings()` and `takeRings()`.
Six rings, rim-first at the midpoints of `C.DIVE_RINGS_MAX` slices, arc centres
walking through `laneHop()`; taken by `laneDelta` inside `C.RING_ARC_LANES` at
the step the descent crosses them; resolved once; `addScore(C.RING_POINTS)`
unmultiplied. ⛔ Classic is a total no-op, proved as a step-by-step hash.
⛔ The cut is proved. ⛔ No kill site, no kill line, no draw, no `ENEMY_KINDS`
row, no registry move; `09-collision.js` untouched. ⚠ **P1 shipped the flight
with no visual and no sound**: an Overdrive dive is now 4.0 s of a still board
with six rings nobody can see. Both are P2's.

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (25 modules + 3 inlined kit,
  **750.8 KB**); the manifest is checked both directions against `src/`, and a
  missing `KIT_INLINE` file fails the build.
- `node scratchpad/run-all.js`: **72 files, all green, zero skips.**
  ⚠ **`run-all.js` has a 120 s PER-FILE timeout and machine load can trip it**:
  `test-cs008-p8.js` TIMED OUT at 119.2 s during CS014 P1 while other node
  processes ran, and took **23.6 s** alone on the same machine moments later.
  ⛔ A timeout is not a red — re-run the file alone before treating it as one.
- **CS001–CS013 are closed; each has a `log/CS0##.md`.** ⛔ **The Classic roster
  is complete at six and GDD §6.2's variant table at three** (CS005); ⛔ **all
  five of GDD §4.5's death conditions are live** (CS006), and every hazard since
  has been a new SHAPE of one of them.
- **CS012 (2026-09-17) shipped OVERDRIVE'S CORE** — `drive`, `C.MODE_FLAGS` and
  `modeHas()`, the Reaver, OVERDRIVE on MODE with its own board and `progress`
  v2, the Jump (kit-audio **0.4.0**), the combo — and **CS013 (2026-09-20) its
  TOKENS AND LAST TWO ENEMIES**: five tokens behind one `dropToken()`; the
  Warden (`aloft`, the ninth contract field, and the jump strike — the FOURTH
  kill site); the Mimic and its `MimicShot`, ⚠ on probation. `log/CS013.md`.
- **CS014 (in flight) is OVERDRIVE'S DIVE.** ⛔ **A FOURTH MODE FLAG, `rings`,
  and it is the whole gate AND the whole cut.** `modeHas("rings")` decides how
  long a dive is (`diveTime()`: `C.DIVE_TIME_OD` 4.0 or `C.DIVE_TIME` 2.6, each
  ⛔ **the WHOLE dive, grace included**) and whether anything is in it.
- ⛔ **ELEVEN SOAKS, EACH PROVING A DIFFERENT THING ON A DIFFERENT BOARD** —
  `-cs003-p5` … `-cs007-p5`, then the front-door pairs `-cs008-p8`, `-cs009-p6`,
  `-cs010-p5`, `-cs011-p6`, `-cs012-p6`, `-cs013-p5`; each header says what its
  pair holds constant. ⛔ **CS014 P3's is a TWELFTH file, never a widened one.**
- ⛔ **`test-cs006-p5.js` carries the count-based no-draw rule**, a function of
  the LEVEL: `spawnEnemy`'s 1 plus `pickSpawnLane`'s bounded
  `[1, C.SPAWN_LANE_TRIES]`, +0 at levels 1–2 and +1 from level 3.
- ⛔ **`test-cs004-p1.js`'s `GOLDEN_LANES` — its first SIXTEEN entries are the
  ORIGINAL `9ebd27b` recording**, held by a separate prefix assertion; CS008 P1
  appended `2, 5`. ⛔ **Any other move is a defect, not a baseline.**
- ⛔ **`test-cs006-p2.js`'s `P1_DETERMINISM_HASH` is the one baseline that moves,
  and it is CROSS-FILE** (it runs `test-cs005-p5.js` in a child process). It
  stands at **1229033515**, unmoved through CS009–CS013. ⛔ Re-record it once per
  change, one named cause at the assertion.
- ⛔ **On a boundary rider the LATTICE is where §17 item 3 stands, not the speed
  bound** (`RATIONALE.md#boundary-lattice`).
- ⛔ **`AudioSys.ctx` is null until a key, click or lifted touch**, and every
  audio entry point returns early on it. `buildGame({ audio: true })` installs
  the recording fake (`X._audio`). ⛔ **A gesture is a DOM event**:
  `G.input.keyDown()` does not make one, so a test that wants audio attaches
  `fakeTarget()`s and fires `keydown`.
- ⛔ **A seat writes no `state` and draws nothing.** ⛔ The headroom gate
  (`test-cs009-p5.js`, ⚠ provisional) is D16's limiter-curve model — 0.450
  against `pulse` 0.3512, `title` 0.3408, `drive` 0.3505 — and holds only at the
  rendered settings, so `test-cs010-p1.js` pins `C.MUSIC_LIMIT` to D2's literals.
- ⚠ **SETTLED — MUSIC IS STRUCK, NEVER SWELLED** (Paul, 2026-09-16; `CLAUDE.md`
  Audio, GDD §11.3). ✅ Paul's lab picks are ported for `title` and `pulse`;
  ⚠ **`pulse` loops at 72 s** and `drive` at 62.6 s.
- ⛔ **Read GDD §6.5 before adding an entity.** NINE contract fields (plus
  `points()`), the wiring points, the Dive — and ⛔ **a token is not on that
  table** (GDD §14.1's T1): no contract field, no `ENEMY_KINDS` row, its own
  array, its own wiring.
- `tools/music-lab.html` and `tools/sfx-lab.html` are the porting sources for
  `17-audio-tracks.js` and `C.SFX`, bound to the build by text identity;
  `well-lab` (⛔ the visual audition has not happened) and `feel-lab` complete
  the set. ⛔ **A new `SFX_KILL_PITCH` voice is a THREE-file edit**: `C`,
  sfx-lab's BLOCK SFX and its `PITCH_*` candidate tables.

## Known issues

### What CS014 must act on

- ⛔ **`startDive()` DOES FIVE THINGS NOW** (GDD §5, §14.5): `resetDive()` — ⛔
  which also EMPTIES `state.dive.rings`, which is why the set needs no second
  reset caller — the board filtered to `anchored` survivors, `resetJump()` (⛔
  the Dive is never airborne), `resetTokens()` (⛔ the array emptied and all
  three powers off, so **no Ward can absorb the Thorn strike**) and, since
  CS014 P1, `layRings()`, ⛔ **the ring set's ONE way in**, BELOW the other four
  because everything above belongs to the well being LEFT.
  ⛔ **A Warden and a `MimicShot` are NEVER Dive survivors.**
  ⛔ **A REPEATED DIVE RE-LAYS THE SET** (RF3) — `diveRespawn()` ends in
  `startDive()`, so a struck diver earns it again, and a snapshot taken across a
  repeat is of objects the array no longer holds.
- ⛔ **BOTH DIVE CAPS NOW HAVE EXACTLY ONE READER EACH, AND `test-cs006-p3.js`
  COUNTS THEM ON CODE LINES ONLY** — `C.DIVE_TIME_OD` in `diveTime()`,
  `C.DIVE_RINGS_MAX` in `layRings()`; a second reader OR a comment-blind count
  turns that file red. ⛔ **`diveTime()` reads the FLAG, never `state.mode`** —
  the cut has to take the length with it.
- ⛔ **A DIVE NOW PAYS EXACTLY ONE THING, AND IT IS A RING** (GDD §5, §7;
  asserted per step in FOUR files — `-cs012-p4`, `-cs012-p6`, `-cs013-p2`,
  `-cs013-p5`, repaired in place at P1). Every `addScore` call inside a dive is
  `C.RING_POINTS`, unmultiplied, not a kill; a dive still builds nothing, rolls
  nothing and spends **zero draws**, and the termination kill pays nothing.
  ⛔ Each reads the literal off the build and carries a `ringCalls > 0` line.
- ⛔ **THE DIVE STILL HAS NO VISUAL AND NO SOUND, AND P2 OWNS BOTH IN BOTH
  MODES** (RF7, RF8; GDD §5). ⚠ An Overdrive dive is now **4.0 s** of a still
  board carrying six invisible rings, and a run spends 19.8 % of its steps
  there. `state.dive.rings` is `{ lane, depth, taken }` and `state.dive.depth`
  is the descent — both are what a renderer wants. ⛔ **The deepest ring sits at
  0.0833, under `C.READABILITY_DEPTH` 0.25** (GDD §10.3 is a contract): it
  fades there like a token, or the lattice does not reach it. ⛔ P2 owes
  `SKIPPED-PLAYTESTS.md` an entry (plan K5, K7).
- ⚠ **`C.RING_POINTS` 100, `C.RING_ARC_LANES` 1.5 and `C.RING_LANE_STEP` 0.25
  are PROVISIONAL** (CS012 O16's sense); ⛔ **`DIVE_TIME_OD` 4.0 and
  `DIVE_RINGS_MAX` 6 are NOT** — GDD §14.5's hard scope cap. Derivations in
  `log/CS014.md`. ⛔ **The lattice is a function of the WELL and constants and
  nothing else** — no draw, no `heat()`, no `state.level`, ⛔ **not the craft's
  lane**; `test-cs014-p1.js` scans the three bodies for all four and for a
  tunable literal. ⛔ **The arc walk uses `laneHop()`, never `laneNormalize()`**
  — a clamp piles the walk's tail on one wall (MEASURED: rings 4 and 5 both on
  Fan lane 6); ⚠ a fold turns the walk around, so two rings near a wall can sit
  close together. ⛔ **`startDive()` derives the well from
  `WELLS[state.wellIndex]`** — four closed files call `startDive(state)` by
  name, so a signature change is an unpredicted closed-file edit.
- ⛔ **FOUR KILL SITES AND FIVE KILL LINES, ALL IN `09-collision.js`, AND CS014
  ADDED NONE** (the rule is `CLAUDE.md`'s): a ring is not a kill and a Dive is
  not a kill site. `jumpStrike()` runs THIRD in `updateCollisions()` and ⛔ its
  line matches none of `test-cs012-p4.js`'s six `COMBO_OUT` strings (it ends on
  `\n  }`). ⛔ **A phase that edits a kill line repairs `COMBO_OUT`, `-p4.js`'s
  two shot-kill `mutantRed` strings AND `test-cs014-p1.js`'s line count** — it
  asserts the shared kill text appears in the build exactly four times.
- ⛔ **`gddPoints()` HAS SIX COPIES AND THE COUNT IS NOT WHAT DECIDES** (CS013
  P5's review): `-cs008-p2`, `-cs008-p8`, `-cs012-p4`, `-cs012-p6`, `-cs013-p2`,
  `-cs013-p5`. ⛔ **What decides is whether that copy's board can KILL the
  entity** — the two CS008 copies price CLASSIC boards and rightly carry no
  Overdrive row. ⚠ **`-cs013-p2`'s carries a Mimic row and NO Warden row**, right
  only because its driver never jumps. ⛔ **`instanceof` is PER BUILD** — the
  helper takes the build, or every non-vacuity check passes on zero.
  ⚠ **`test-cs014-p1.js` adds no seventh copy**: a ring has no `points()`.
- ⛔ **A CLOSED OVERDRIVE PLAY AT L11+ OWES ITS DRIVER THREE THINGS, EACH THE
  PLAYER'S OWN ANSWER** (CS013 P3–P5; MEASURED): (1) **JUMP at anything `aloft`
  in reach** — a Warden is `blocksClear: true` and killable only by the Jump, so
  a non-jumping driver stalls the board; (2) **NEVER TARGET a `MimicShot`, and
  STEER AWAY within a lane** — it declines every shot and kills by contact;
  (3) **GO TO a hovering token** — taken by touch and nothing else. ⛔ **Repairs
  are the DRIVER, never the build, a lowered level or a relaxed assertion**;
  each is a no-op where the entity does not exist, so Classic pairs hold.
- ⚠ **AND THE DRIVER IS NOT ALWAYS THE WHOLE REPAIR** (CS013 P4, MEASURED): a
  Mimic costs the board real throughput on purpose (302 kills over 20,000 steps
  with its row out against 285 with it in), and the driver repair was worth
  285 → 286. ⛔ **The second repair is the FIXTURE — playing longer — never a
  lowered claim.**
- ⛔ **THREE OVERDRIVE FIXTURES ARE SEED-FRAGILE, AND CS014 P1 MOVED ONE**:
  `test-cs012-p2.js`'s `SOAK_SEED` and `test-cs012-p6.js`'s `OD_CLOCK` 7927
  held; `test-cs012-p4.js`'s `drawRun()` went **17 → 59** (MEASURED across
  twenty seeds; 59 ends at ×3). ⛔ **AND THE CAUSE WAS A NEW KIND: not a draw, a
  CLOCK.** `C.DIVE_TIME_OD` 4.0 makes the same draws land on later STEPS, so a
  fixed tick budget reaches a different board — ⛔ **anything that changes how
  long an Overdrive beat lasts is as much a mover as a draw.** ⚠ The plan
  predicted `-p4.js:628` would move too and it did not; which fragile fixture
  moves is not predictable from a stand-in.
- ⛔ **ITEM 8 PRICES A BOUNTY PER STEP via a `collectToken` spy** in
  `-cs012-p4`, `-p6` and `-cs013-p5`; ⛔ **and since P1 it prices a RING per
  step in those three plus `-cs013-p2`.** A new unmultiplied event owes all
  four a price and a non-vacuity line.
- ⛔ **A TEST THAT BOUNDS `state.shots` READS THE CAP IN FORCE off
  `state.powers`** (GDD §17 item 4; the rule is `CLAUDE.md`'s). MEASURED: 24 IS
  reached, at 15.0 shots/s per lane on three lanes.
- ⛔ **`state.powers` IS READ IN THREE FILES**: `06-shots.js`, `09-collision.js`
  and `23-main.js`'s draw. ⛔ **`purgeUses` has a second zeroing writer**, the
  Recharge (CS013 P1). ⛔ **`C.TOKEN_COLOR` `#FFF347` is also a pierced shot's
  streak and the Ward's shell**; ⚠ **P2's ring needs a colour and must not reach
  for it**, for the eight enemy colours, the Warden's `#477EFF` or the Mimic's
  `#D447FF`.
- ⛔ **A STAGED DEATH IN AN OVERDRIVE FIXTURE MUST CLEAR `state.powers.ward` OR
  SET UP TWO HITS** — every death path meets `killSkimmer()`'s second early
  return.
- ⛔ **`liftPoints()` IS THE BUILD'S ONE COPY OF THE LIFT MATH**
  (`05-skimmer.js`), three asserted call sites — `craftPoints()`,
  `drawWardenBeam()`, `drawWarden()`. A fourth silhouette passes already-
  projected points and a count, never a second projector.
- ⛔ **`test-registry.js`: `enemies` 9, `enemyKinds` 13** — they differ by more
  than one because `mimicShot` and `weaverBolt` are kinds with no roster row and
  the three Carrier variants are three rows behind one roster entry.
- ⛔ **A MUTATION RUN THAT THROWS, OR ANSWERS UNREADABLY, IS A DEFECT IN THE
  TEST**: guard the reads, report a COUNT and one index, ⛔ assert the string is
  in the build exactly once BEFORE asserting red, and ⛔ **run the same probe
  function over the real build and the mutant** (`test-cs014-p1.js`'s form).
- ⚠ **SEVEN UNPREDICTED CLOSED-FILE EDITS ACROSS CS013, all one shape: a claim
  written before the effect existed**, restored in place. ⛔ **The lesson is a
  grep discipline** — a field-list pin, a prototype pin, a price table and a
  mutation string are four greps, and a helper the SAME changeset wrote is the
  copy a plan's grep misses. ✅ **CS014 P1 had none**: every edit was in §11.
- ⛔ **A PHASE LENGTH IS NOT `Math.ceil(limit / C.FIXED_DT)`.** `1/60` is not a
  binary fraction, so a count-up timer takes 13 steps to reach 0.20 s where
  `ceil` says 12. Assert the property, never the step count.
- ⛔ **AND A KILL SITE'S OWN READING IS READ AT THE CALL, NOT AFTER THE STEP**
  (CS013 P5, MEASURED): `jumpStrike()` killing the last blocker clears the well
  on that step and `startDive()` calls `resetJump()`, so a post-step read calls
  two legal airborne kills grounded. ⛔ **The same trap bites `state.dive`**:
  the dive's END is `nextWell()` → `enterWell()` → `resetDive()` on the same
  step, so the rings and the timer must be snapshot BEFORE the step, never
  after (`test-cs014-p1.js`).
- ⚠ **FINDING (CS012 P2, MEASURED): CS008 P1's ε and `atRim()` mutations no
  longer redden a rim-arrival table alone** — P1b's sweep masks them under held
  fire, so an item-13 table mutates the sweep AND ε together (`-cs012-p2` §9:
  18/24). ⛔ **Neither the Warden nor the Mimic owes item 13, and neither does a
  ring** (CS014 R9): nothing in a dive arrives at the rim.

### The board, the entities and the Dive

- ⛔ **THE REAVER IS A `Vaulter` SUBCLASS AND THE `MimicShot` A `WeaverBolt`
  ONE; THE WARDEN AND THE MIMIC ARE NOT** — each variant leans on its parent's
  overridable readers (`hopDuration()`, `midClimbDir()`, `speed()`). ⛔ Keep
  each `C.X_CLIMB * climbMult()` textually as is (`-cs007-p2:476` reads seven);
  order a price table's branches subclass-first.
- ⛔ **AN `aloft` ENTITY IS INVISIBLE TO THE SHOT PASS AND VISIBLE TO EVERYTHING
  ELSE** — `collideSkimmer()`, `purgeTarget()`, `respawnSkimmer()`,
  `dangerInputs()`, `threatCount()` and `wellCleared()` all read it as an
  ordinary entity at depth 1, and that is the point. ⛔ **A new reader that wants
  to exclude one must say so itself.**
- ⛔ **A WARDEN HOLDS A RELEASE SLOT UNTIL SOMEBODY JUMPS** (MEASURED, L13:
  1–3 per 5,000 steps, clearing nothing); ⚠ **a MIMIC is the softer version.**
  Both are intended; the ladder is GDD §8.2's tuning pass.
- ⚠ **THE MIMIC IS ON PROBATION AND CUTS IN ONE ROW** (GDD §14.6, §21 #6):
  `{ level: 16, kind: "mimic" }`, with `mimicShot` deliberately not a row.
  ⛔ **Keep it that way**; cutting it moves `test-registry.js` to 8 / 11.
  ⛔ **`C.MIMIC_APEX` IS BOUNDED, NOT TUNED**: ≤ 0.4308 against the shipped 0.40.
- ⛔ **`C.SPAWN_SCHEDULE_OVERDRIVE` IS COMPLETE AT THREE ROWS** — 6, 11, 16. No
  bench key; `DEBUG_ROW_KINDS` stays Classic's six.
- ⚠ The dive death-loop bound in `test-cs006-p5.js` is measured at its limit
  (worst two lives in one dive), and `test-cs007-p5.js`'s well-stall gate does
  not catch a reverted `threatCount()` — the blocked-beat assertion beside it
  does. ⛔ Both are CLASSIC soaks and CS014 P1 left them green.
- ⚠ **Unowned, none reachable by the suite's drivers:** a second Purge prefers
  a bolt or a reflection above 0.95 and pays 0 (PREDICTED); a run STARTING past
  99 gets the modulo well and no band roll (unreachable at `START_DEPTH_CAP`
  81); no played board reaches `C.LIVES_MAX`; a rim Vaulter — ⚠ and an aloft
  Warden — hunts the CONTINUOUS lane, so a player between centres has it hopping
  back and forth.

### The Jump, the combo and the tokens

- ⛔ **Airborne is a phase, aloft is a phase, the multiplier lives at the kill
  lines, and a token is not an enemy — all four rules are `CLAUDE.md`'s.** The
  bags: `state.jump` `{ phase, t, cool, latched }`, `state.combo`
  `{ mult, kills, since, peak }`, `state.tokens`, `state.powers`.
- ⛔ **THE LANDING STEP IS NOT AN AIRBORNE STEP** (MEASURED): `updateJump()`
  runs at the TOP of `update()`, so a step that BEGINS airborne can end in
  `recover` — contact-lethal and unable to fire, by design. An invariant on the
  pre-step phase alone reads two legal landing deaths as a breach.
- ⛔ **THE COOLDOWN COUNTS FROM LANDING** (`JUMP_RECOVERY` is its first beat,
  not a fourth timer), and ⛔ **`resetJump()` HAS THREE CALLERS** —
  `enterWell()`, `respawnSkimmer()`, `startDive()` — and does NOT clear
  `latched`; `killSkimmer()` forces it true.
- ⛔ **A lapse does NOT empty the combo's kill count** — a death alone does;
  `since` WRAPS at `C.COMBO_WINDOW`; `peak` is 0 until the run's first kill.
- ⛔ **GDD §17 item 8 WITH A MULTIPLIER IS ASSERTED PER `addScore` CALL, NOT PER
  STEP**: a step can span a step up. The board's price multiset holds prices > 0
  only — a zero-price kill is a bolt or a reflection self-terminating, or a
  Thorn taken by its last chip.
- ⛔ **`state.shots.push` CANNOT BE INTERCEPTED to see a new shot** (MEASURED):
  `updateShots()` filters into a NEW array before firing, so a hook on the
  pre-step array never sees it; `state.tally.shotsFired` is honest.
  ⚠ `state.enemies` is the opposite — filtered AFTER both passes.

### Audio

- ⛔ **KIT-AUDIO 0.4.0** — the chain and its rules are `CLAUDE.md`'s. The duck
  and dip sit AFTER the limiter (a duck in front measured −1.9 dB), and
  `setHighpass()`'s `Q` is a fixed Butterworth so D16's model needs no term.
- ⚠ **FINDING (CS012 P1, MEASURED): THE HEADROOM GATE CANNOT CATCH A LOUDER
  TRACK** — under D16's curve a doubled layer moves the model by 1/20 of its dB
  (red needs an input of 152.8). ⛔ Whether it should bound the limiter's INPUT
  is Paul's.
- ⛔ **`drive` IS UNTIERED, UNMARKED AND UNHEARD**; ⛔ **Paul's lab port
  rewrites `test-cs012-p1.js`'s "no tier" / "no audition mark" in place.**
  ⚠ sfx-lab plays only `pulse` in context, so the Surger tone — ⚠ the Warden's
  fuse too — has no lab audition over `drive`. ⛔ One `beat: true` layer per
  track.
- ⚠ **The director's measured maxima: Classic 0.668; Overdrive 0.6593 staged and
  0.6860 over 114,446 front-door frames with the tokens, the Warden and the
  Mimic live** (CS013 P5, the highest yet). ⛔ **GDD §19 keeps its ✗ and no
  weight is rescaled** (O14, D6); each soak asserts its maximum is below 1.
- ⚠ **Unowned:** the Surger tone's 1.106 sample peak at unity, the empty VOICE
  bus (A3), and R2's pad-only silence.
- ⛔ **CS009 TRAPS IN AUDIO CODE.** (1) The vocabulary scan reads the whole built
  file, comments included, and also bans "atari" (write "the original's").
  (2) Never `.key` after an identifier ending in `e`. (3) Never start a comment
  line with a module banner for `21-` or `22-`. (4) No platform RNG. (5) Never
  write `audioFrame()` inside `frame()`, comments included, and that function's
  body may not contain the text "draw".
- ⛔ **THE DIRECTOR runs BEFORE `setState()`**; its one board reader is
  `dangerInputs(state, out)`, **a new `heat(` call turns `test-cs007-p2.js` red**
  (use `heatT()`), and **`19-sfx.js`'s code may not name `state`**.
  ⛔ **`setState()` before the first gesture is DROPPED** — which is why
  `audioFrame()` calls it every frame.
- ⛔ **AN EDIT TO `16-audio-engine.js` OR `17-audio-tracks.js` IS A THREE-FILE
  EDIT** (both labs' BLOCK A / B), and so is one to `C.MUSIC_LIMIT`,
  `C.LAYER_THRESHOLD`, `C.LAYER_CROSSFADE` or `C.FILTER_*` (`test-cs010-p3.js`
  pins both labs' `LAB` copies). `00-config.js`'s SFX group is sfx-lab's BLOCK
  SFX; ⛔ each event stays ONE line starting `    name:`, and a NEW one owes the
  lab a brief, an A label, 1–2 alts and an in-context sequence. ⛔ **25 events,
  11 voices.**

### Meta, menus and the front door

- ⛔ **THE RUN'S END IS `Meta.runEnded(outcome)`** — `startGame()`'s last line,
  `quitToTitle()`'s first, `frame()` after the steps — and ⛔ **ONE GATE,
  `Meta.eligible()`**, closed by a bench digit, `0` or `w` in play.
- ⛔ **`Leaderboard`'s two-client rule is `CLAUDE.md`'s**; ⛔ `C.GAME_ID` is the
  SAVE keyspace, never a board id; `window.KitLeaderboard` is read LAZY on every
  call (a test sets a fake on `X._env.win`); a fake serving both clients counts
  and submits PER `gameId`.
- ⚠ **TWO TESTS READ coinless-kit's `registry.js`** from `../coinless-kit` and
  each SKIPS LOUDLY without it: `test-cs011-p5.js` at `f0b0eb2`,
  `test-cs012-p3.js` at `e2efed5` (⛔ never `f8d34f3`). ⛔ **No closing phase can
  close with a skip**, so that clone must be present.
- ⛔ **MODE IS `OVERDRIVE`, THEN `CLASSIC`, BOTH ENABLED** — the row ORDER is
  GDD §13's default highlight. ⛔ **A driver wanting a Classic run steps ONE row
  down first** (sixteen closed files carry that repair); ⛔ **START DEPTH is
  built for `pendingMode`, never `state.mode`.**
- ⛔ **A REPLAY THAT OUTLIVES ITS GAME OVER MEETS A LIVE MENU** — a scripted Fire
  there RESTARTS on a time seed and a Purge quits, so stop pressing at the stop,
  and ⛔ **a driver that starts at the title spends two live steps before its
  first press.** ⛔ **A FIRE-HOLDER HAS NO DEATH PATH ON LEVELS 1–4** and a
  jumping one outlives that too, so a driver stops both at its stop.
- ⛔ **`test-cs008-p4.js` scans the WHOLE built file, comments included**: no
  `fillRect`/`strokeRect`, one `.fillText(`/`.strokeText(` site.
  `test-cs002-p3.js` bans `ctx.fill` in `14-render-entities.js`;
  `test-cs002-p1.js` bans `e.key`, `.touches`, `getGamepads`, `clientX` and
  `addEventListener` outside `04-input.js`, and `C.`/`state.` inside it.
  ⚠ **Strip comments before grepping a function's own source.**
- ⛔ **`Game.update()` calls `syncScreen()` TWICE**, before and AFTER
  `input.sample()` — remove the second and a Fire held in play confirms RESUME.
  ⛔ `frame()` drains `hitStopLeft` only on `"play"` and `"gameover"`.
- ⚠ **`_harness.js`**: `{ stub }` rebinds a named top-level function to a no-op;
  `{ spy }` counts calls and runs optional `.before`/`.after` hooks; `{ mutate }`
  throws unless its string is in the build exactly once. ⛔ **A function inside
  `Game`'s closure cannot be reached this way**, `Game.update` included.
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
- ⛔ **CS015 — achievements** (Paul's M4). ⛔ **The seven debug spawn actions
  ship until CS017** (Paul's H5 call), which also owes two CS013 measurements:
  GDD §17's performance budget names "8 shots" where Spread's cap in force is
  **24**, and `drawShot()` allocates an array on every call (F4).
- Backport kit-input (0.8.0), kit-menu (0.1.0), kit-fx, kit-audio (**0.4.0**) and
  kit-leaderboard (0.2.1, `lib/`) to coinless-kit — each a separate manual step.
  `createScores` (`src/22-meta.NOTES.md`) is kit-scores' draft.
- ⚠ **`CLAUDE.md` carries no telemetry rule**; whether it earns one is Paul's.
  ⛔ **`TELEMETRY_FIELDS` is frozen at 29 columns and `telemetry` at v1**, and it,
  `TELEMETRY_KINDS`, `telemetryRow()` and the version move together.

## Next up — CS014 P2: the Dive's visual and the two audio seats

⛔ **A BUILD phase**, its prompt in `IMPLEMENTATION-PHASES-CS014.md`. It builds
RF7-A — the descent drawn in **both** modes, the rings on top of it in Overdrive
— and RF8-A's two seats, `ringTake` and `ringMiss`, ⛔ **auditioned in
`tools/sfx-lab.html` first** and ported verbatim. ⛔ **It moves no state and no
hash**, `C.JUMP_LIFT`-at-0's proof, and it owes `SKIPPED-PLAYTESTS.md` an entry.
⛔ Read "What CS014 must act on" first — the rings' shape, the readability floor
at 0.0833, and what `startDive()` now does.

⚠ **`CLAUDE.md` IS AT 48,897 BYTES, 97.8 % OF ITS 50 KB CEILING** (it was 45,797
at CS014 planning). ⛔ **P2 has about 1.1 KB and P3 needs some of it.** The
valve fired at P1 on the new `### The Dive` section
(`RATIONALE.md#ring-flight`); ⚠ **`### Math and lifecycle` is 7.0 KB and is the
next real candidate** — but `CLAUDE.md`'s own ⚠ SETTLED rule fires the valve
only when an over-size section is EDITED, never as a sweep. ⚠ `## Code map` is
4.3 KB and has no reasoning to move: it is all rule.
