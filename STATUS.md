# Vector Vortex — STATUS
Version: 0.0.10 · Changeset: **CS013 closed 2026-09-20** · next: **CS014 planning** ·
Wells: 16/16 · Enemies: 6/6 Classic, 3/3 Overdrive · Tracks: 3/5 · Tokens: 5/5 effects

## Phase ledger

⛔ **CS013's ledger, reasoning and review notes moved to `log/CS013.md` at the
close.** This file is reset for CS014 and carries only what a CS014 phase must
act on. ⛔ `log/` is not session context: pull one file in only when a question
genuinely needs project history, and say that you did.

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (25 modules + 3 inlined kit,
  **737.2 KB**); the manifest is checked both directions against `src/`, and a
  missing `KIT_INLINE` file fails the build.
- `node scratchpad/run-all.js`: **71 files, all green, zero skips** (⚠ machine
  load moves the wall clock a lot; `test-cs008-p8.js` alone takes ~88 s).
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
- ⛔ **ELEVEN SOAKS, AND THEY PROVE DIFFERENT THINGS ON DIFFERENT BOARDS** —
  `-cs003-p5` … `-cs007-p5` on the board, and the front-door pairs `-cs008-p8`,
  `-cs009-p6`, `-cs010-p5`, `-cs011-p6`, `-cs012-p6`, `-cs013-p5`. Each file's
  header says what its pair holds constant. ⛔ **CS014's is a TWELFTH file,
  never a widened closed one.**
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

- ⛔ **`startDive()` DOES FOUR THINGS NOW, AND THE RING-FLIGHT INHERITS ALL
  FOUR** (GDD §5, §14.5): `resetDive()`, the board filtered to `anchored`
  survivors, `resetJump()` (⛔ the Dive is never airborne) and, since CS013 P1,
  `resetTokens()` — ⛔ **the array emptied and all three powers off**, so no
  token rises through a Dive and **no Ward can absorb the Thorn strike**.
  ⛔ **A Warden and a `MimicShot` are therefore NEVER Dive survivors.**
- ⛔ **`C.DIVE_TIME_OD` and `C.DIVE_RINGS_MAX` ARE STILL UNREAD**, ⚠
  **`C.DIVE_TIME` is the WHOLE dive, grace included** (descent 2.25 s), and
  ⛔ **the Dive has no visual** — `state.dive.depth` is what a renderer wants.
- ⛔ **A DIVE SCORES NOTHING, BUILDS NOTHING AND ROLLS NOTHING** (GDD §5, §7;
  asserted per step by `-cs012-p6.js` and `-cs013-p5.js`): its termination kill
  is not a kill site — no `addScore`, no `tally.kills`, no build, no roll, no
  kill sound.
- ⛔ **FOUR KILL SITES AND FIVE KILL LINES, ALL IN `09-collision.js`** (the rule
  is `CLAUDE.md`'s). `jumpStrike()` runs THIRD in `updateCollisions()` and ⛔ its
  line matches none of `test-cs012-p4.js`'s six `COMBO_OUT` strings (it ends on
  `\n  }`). ⛔ **A phase that edits a kill line repairs `COMBO_OUT` AND
  `-p4.js`'s two shot-kill `mutantRed` strings.**
- ⛔ **`gddPoints()` HAS SIX COPIES, AND THE COUNT IS NOT WHAT DECIDES**
  (CS013 P5's review): `test-cs008-p2.js`, `-cs008-p8.js`, `-cs012-p4.js`,
  `-cs012-p6.js`, `-cs013-p2.js`, `-cs013-p5.js`. ⛔ **What decides is whether
  that copy's board can KILL the entity** — the two CS008 copies price CLASSIC
  boards and correctly carry no Overdrive row. ⚠ **`test-cs013-p2.js`'s carries
  a Mimic row and NO Warden row**, and is right only because its driver never
  jumps: the day it does, a 500 reads as "no GDD §7 price on the board matches".
  ⛔ **`instanceof` is PER BUILD** — the helper takes the build as an argument,
  or every non-vacuity check passes on zero.
- ⛔ **A CLOSED OVERDRIVE PLAY AT L11+ OWES ITS DRIVER THREE THINGS, AND EVERY
  ONE IS THE PLAYER'S OWN ANSWER** (CS013 P3, P4, P5; MEASURED). (1) **JUMP at
  anything `aloft` in reach** — a Warden is killable only by the Jump and
  `blocksClear: true`, so a non-jumping driver stalls the board. (2) **NEVER
  TARGET a `MimicShot`, and STEER AWAY from one within a lane** — it declines
  every shot and kills by contact. (3) **GO TO a hovering token** — it is taken
  by touch and by nothing else. ⛔ **Repairs are the DRIVER, never the build,
  never a lowered level and never a relaxed assertion**; each is a no-op wherever
  the entity does not exist, so Classic pairs stay bit-identical.
- ⚠ **AND THE DRIVER IS NOT ALWAYS THE WHOLE REPAIR** (CS013 P4, MEASURED): a
  Mimic costs the board real throughput on purpose (302 kills over 20,000 steps
  with its row out against 285 with it in), and the driver repair was worth
  285 → 286. ⛔ **The second repair is the FIXTURE — playing longer — never a
  lowered claim.**
- ⛔ **THREE OVERDRIVE FIXTURES ARE SEED-FRAGILE, and CS013 P5 moved none of
  them**: `test-cs012-p2.js`'s `SOAK_SEED`, `test-cs012-p4.js`'s seed 17,
  `test-cs012-p6.js`'s `OD_CLOCK` 7927. Each was re-seeded once, at CS013 P1,
  because ⛔ **one draw per Overdrive kill moves every Overdrive board after its
  first kill.** A change that spends a draw in Overdrive is the next mover.
- ⛔ **ITEM 8 PRICES A BOUNTY PER STEP via a `collectToken` spy** in
  `test-cs012-p4.js`, `-p6.js` and `-cs013-p5.js`; a new unmultiplied event owes
  all three a price.
- ⛔ **A TEST THAT BOUNDS `state.shots` READS THE CAP IN FORCE off
  `state.powers`** (GDD §17 item 4; the rule is `CLAUDE.md`'s). MEASURED: 24 IS
  reached, at 15.0 shots/s per lane on three lanes.
- ⛔ **`state.powers` IS READ IN THREE FILES**: `06-shots.js`, `09-collision.js`
  and `23-main.js`'s draw. ⛔ **`purgeUses` has a second zeroing writer**, the
  Recharge (CS013 P1) — `02-state.js`'s comment and GDD §4.3 were corrected.
  ⛔ **`C.TOKEN_COLOR` `#FFF347` is also a pierced shot's streak and the Ward's
  shell**; a new colour must not reach for it, for the eight enemy colours, for
  the Warden's `#477EFF` or for the Mimic's `#D447FF`.
- ⛔ **A STAGED DEATH IN AN OVERDRIVE FIXTURE MUST CLEAR `state.powers.ward` OR
  SET UP TWO HITS** — every death path meets `killSkimmer()`'s second early
  return.
- ⛔ **`onShot` IS ASKED BY TWO PATHS AND A NEW ONE MUST DECIDE WHAT `null`
  MEANS** (a shot passes itself, the rim sweep passes `null`). `Thorn.onShot()`
  is the ONE reader of the argument, and `    addScore(C.PTS_THORN);` is still
  in the build exactly once (`test-cs012-p4.js:607`).
- ⛔ **`liftPoints()` IS THE BUILD'S ONE COPY OF THE LIFT MATH**
  (`05-skimmer.js`), with THREE asserted call sites: `craftPoints()`,
  `drawWardenBeam()`, `drawWarden()`. A fourth silhouette passes its
  already-projected points and a count, never a second projector.
- ⛔ **`hudLayout()` HAS TWO OVERDRIVE RECTANGLES, BOTH TIGHT, AND CS013 ADDED
  NONE** (T10: no HUD item for any token — each effect shows where it acts). The
  centre-top band is 76.29 px (the Fan well) and `HUD_COMBO_Y` 6 + `SIZE` 56 +
  2 × `PAD` 4 clears it by 6.29 px, so `HUD_COMBO_SIZE` cannot pass ~62 (§10.4).
- ⛔ **`test-registry.js`: `enemies` 9, `enemyKinds` 13** — they differ by more
  than one because `mimicShot` and `weaverBolt` are kinds with no roster row and
  the three Carrier variants are three rows behind one roster entry.
- ⛔ **A MUTATION RUN THAT THROWS, OR ANSWERS UNREADABLY, IS A DEFECT IN THE
  TEST**: guard the reads, report a COUNT and one index, and ⛔ assert the string
  is in the build exactly once BEFORE asserting red.
- ⚠ **SEVEN CLOSED-FILE EDITS ACROSS CS013 WERE UNPREDICTED, every one the same
  shape: a claim written before the effect existed**, restored in place.
  ⛔ **The lesson is a grep discipline**: a field-list pin and a prototype pin
  are two greps, a price table and a mutation string two more, and a helper the
  SAME changeset wrote is the copy a plan's grep misses.
- ⚠ **EVERY KIT `VERSION` BUMP IS A CLOSED-FILE EDIT.** FOUR files pin
  `AUDIO_VERSION` by literal and two pin the signal path node by node.
  ⛔ A plan that bumps a kit owes §11 a row per pinning file.
- ⚠ **DELETING A CONFIG OBJECT IS A DIFFERENT GREP FROM RE-SOURCING A KEY**:
  ⛔ a plan that deletes one owes §11 a grep for `in <OBJECT>` too.
- ⛔ **A PHASE LENGTH IS NOT `Math.ceil(limit / C.FIXED_DT)`.** `1/60` is not a
  binary fraction, so a count-up timer takes 13 steps to reach 0.20 s where
  `ceil` says 12. Assert the property, never the step count.
- ⛔ **ATTRIBUTE A KILL TO THE PHASE THE STEP ENDED IN** (`test-cs005-p3.js`'s
  form). The entity pass runs before the collision pass, so a step that ENTERS a
  discharge is lethal on that step.
- ⛔ **AND A KILL SITE'S OWN READING IS READ AT THE CALL, NOT AFTER THE STEP**
  (CS013 P5, MEASURED). `jumpStrike()` killing the last blocker clears the well
  on the same step, and `startDive()` calls `resetJump()` — so a post-step
  `jumpAirborne()` read calls two legal airborne kills grounded. Spy the
  function and read the craft inside it.
- ⚠ **FINDING (CS012 P2, MEASURED): CS008 P1's ε and `atRim()` mutations no
  longer redden a rim-arrival table alone** — P1b's sweep masks them under held
  fire, so an item-13 table mutates the sweep AND ε together
  (`test-cs012-p2.js` §9: 18/24). ⛔ **Neither the Warden nor the Mimic owes
  item 13** (R10, confirmed at P3, P4 and P5): one cannot be shot and passes the
  band harmlessly, the other never leaves its apex.

### The board, the entities and the Dive

- ⛔ **THE REAVER IS A `Vaulter` SUBCLASS AND THE `MimicShot` A `WeaverBolt` ONE;
  THE WARDEN AND THE MIMIC ARE NOT** — each variant leans on its parent's
  overridable readers (`hopDuration()`, `midClimbDir()`, `speed()`). ⛔ Keep each
  `C.X_CLIMB * climbMult()` textually as is (`test-cs007-p2.js:476` reads seven),
  and order a price table's branches subclass-first.
- ⛔ **THE BOLT'S SPEED IS AN OVERRIDABLE READER**, named ONCE in the build
  inside `WeaverBolt.speed()`, and ⛔ **a speed refactor is proved by a HASH** —
  a Classic run bit-identical against a build carrying the old line.
- ⛔ **AN `aloft` ENTITY IS INVISIBLE TO THE SHOT PASS AND VISIBLE TO EVERYTHING
  ELSE** — `collideSkimmer()`, `purgeTarget()`, `respawnSkimmer()`,
  `dangerInputs()`, `threatCount()` and `wellCleared()` all read it as an
  ordinary entity at depth 1, and that is the point. ⛔ **A new reader that wants
  to exclude one must say so itself.**
- ⛔ **A WARDEN HOLDS A RELEASE SLOT UNTIL SOMEBODY JUMPS** (MEASURED): at L13 a
  non-jumping driver sees 1–3 released per 5,000 steps and clears nothing. ⚠ **A
  MIMIC IS THE SOFTER VERSION OF THE SAME THING**, worth 17 kills over 20,000
  steps. Both are W5's / MI1's intent; whether the concurrency ladder should make
  room for either is §8.2's tuning pass.
- ⚠ **THE MIMIC IS ON PROBATION AND CUTS IN ONE ROW** (GDD §14.6, §21 #6):
  `{ level: 16, kind: "mimic" }` is the only thing that puts one on a board and
  `mimicShot` is deliberately not a row, so the reflections go with it.
  ⛔ **Keep it that way** — a second way in makes CS017's verdict a phase rather
  than a one-line edit, and cutting it moves `test-registry.js` to 8 / 11.
  ⛔ **`C.MIMIC_APEX` IS BOUNDED, NOT TUNED**: ≤ 0.4308 against the shipped 0.40,
  asserted from the constants AND on played boards (min flight 0.4767 s).
- ⛔ **`C.SPAWN_SCHEDULE_OVERDRIVE` IS COMPLETE AT THREE ROWS** — 6, 11, 16. No
  bench key; `DEBUG_ROW_KINDS` stays Classic's six.
- ⚠ **A wall-pinned, fire-holding driver parks an Overdrive L7 board with no
  Reaver released** (`pinWall()` alternates the replay with a released wall pin),
  and ⚠ **three roster classes park rather than hunt** — Carrier, Weaver,
  Surger. ⛔ **The repair is the driver, never the build.**
- ⚠ The dive death-loop bound in `test-cs006-p5.js` is measured at its limit,
  and `test-cs007-p5.js`'s well-stall gate does not catch a reverted
  `threatCount()` — the blocked-beat assertion beside it does.
- ⚠ **Unowned, none reachable by the suite's drivers:** a second Purge prefers a
  bolt or a reflection above 0.95 and pays 0 (PREDICTED); a run STARTING past 99
  gets the modulo well and no band roll (unreachable at `START_DEPTH_CAP` 81); no
  played board reaches `C.LIVES_MAX`; a rim Vaulter — ⚠ and an aloft Warden —
  hunts the CONTINUOUS lane, so a player parked between centres has it hopping
  back and forth.
- ⛔ **A chosen level is reached from START DEPTH**, never `w`; a console unlock
  is `levelRecord("classic").noteCleared(81)`.

### The Jump, the combo and the tokens

- ⛔ **Airborne is a phase, aloft is a phase, the multiplier lives at the kill
  lines, and a token is not an enemy — all four rules are `CLAUDE.md`'s.** The
  bags: `state.jump` `{ phase, t, cool, latched }`, `state.combo`
  `{ mult, kills, since, peak }`, `state.tokens`, `state.powers`.
- ⛔ **THE LANDING STEP IS NOT AN AIRBORNE STEP** (MEASURED). `updateJump()` runs
  at the TOP of `update()`, so a step that BEGINS airborne can end in `recover` —
  contact-lethal and unable to fire, by design. An invariant on the pre-step
  phase alone reads two legal landing deaths as a breach.
- ⛔ **THE COOLDOWN COUNTS FROM LANDING** (`JUMP_RECOVERY` is its first beat,
  not a fourth timer), and ⛔ **`resetJump()` HAS THREE CALLERS** —
  `enterWell()`, `respawnSkimmer()`, `startDive()` — and does NOT clear
  `latched`; `killSkimmer()` forces it true.
- ⛔ **`test-cs012-p5.js` PINS TWO TEXTS BY `mutate`** — `  if (jumpAirborne(state)) return;`
  and `state.input.fire && jumpCanFire(state) &&` — and RUNS `test-cs009-p5.js`
  in a child process, so a change that reddens that file reddens this one too.
- ⛔ **A lapse does NOT empty the combo's kill count** — a death alone does;
  `since` WRAPS at `C.COMBO_WINDOW`; `peak` is 0 until the run's first kill.
- ⛔ **GDD §17 item 8 WITH A MULTIPLIER IS ASSERTED PER `addScore` CALL, NOT PER
  STEP**: a step can span a step up. The board's price multiset holds prices > 0
  only — a zero-price kill is a bolt or a reflection self-terminating, or a
  Thorn taken by its last chip.
- ⛔ **`state.shots.push` CANNOT BE INTERCEPTED to see a new shot** (MEASURED):
  `updateShots()` filters into a NEW array before it fires, so a hook on the
  pre-step array never sees it; `state.tally.shotsFired` is the honest counter.
  ⚠ `state.enemies` is the opposite — filtered AFTER both passes, so a Carrier's
  split and a Mimic's reflection both land.

### Audio

- ⛔ **KIT-AUDIO 0.4.0** — the chain and its rules are `CLAUDE.md`'s. The duck
  and dip sit AFTER the limiter (a duck in front measured −1.9 dB), and
  `setHighpass()`'s `Q` is a fixed Butterworth so D16's model needs no term.
- ⚠ **FINDING (CS012 P1, MEASURED): THE HEADROOM GATE CANNOT CATCH A LOUDER
  TRACK.** Under D16's curve a doubled layer moves the model by 1/20 of its dB
  (red needs an input of 152.8). ⛔ **Whether it should also bound the limiter's
  INPUT is Paul's.**
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
- ⛔ **THE SURGER TONE IS DECIDED AT FRAME END** (frozen or off play stops every
  voice), and ⛔ **`reconcileSurgeTones()` is DUCK-TYPED** — `phase ===
  "telegraph"` plus a `chargeTip()`, which is how the Warden borrows it with
  `19-sfx.js` unedited. ⛔ **An entity that does NOT want the voice must not
  match**; the Mimic's two phases and missing `chargeTip()` are why it does not.
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
- ⚠ **`test-cs009-p5.js`'s headroom sort compares exact floats**: a non-binary
  `stepDur` reads a back-to-back pair as an overlap, repaired in place by a
  future tempo port. ⛔ A test counting scheduled steps counts NOTES.

### Meta, menus and the front door

- ⛔ **The store rules are `CLAUDE.md`'s.** The hazards: ⛔ **`OWN_KEYS` is the
  declared per-profile list** (CS015 adds `achievements` there and to `Store`;
  never `scores` or `profiles`); ⛔ **the boot block RUNS INSIDE THE HARNESS**
  (`Meta.boot()` writes `profiles` in every build); ⛔ **kit-leaderboard cannot be
  inlined** — `test-cs009-p1.js:508` bans its `setTimeout`, `test-cs002-p1.js`
  its `addEventListener`.
- ⛔ **THE RUN'S END IS `Meta.runEnded(outcome)`** — `startGame()`'s last line,
  `quitToTitle()`'s first, `frame()` after the steps — and ⛔ **ONE GATE,
  `Meta.eligible()`**, closed by a bench digit, `0` or `w` in play.
- ⛔ **`Leaderboard`'s two-client rule is `CLAUDE.md`'s.** The hazards:
  ⛔ **`C.GAME_ID` is the SAVE keyspace, never a board id**; it reads
  `window.KitLeaderboard` **LAZY on every call**, so a test sets a fake on
  `X._env.win`; and ⛔ **a fake serving both clients counts its queues and
  submits PER `gameId`.**
- ⚠ **TWO TESTS READ coinless-kit's `registry.js`** from `../coinless-kit` and
  each SKIPS LOUDLY without it: `test-cs011-p5.js` at `f0b0eb2`,
  `test-cs012-p3.js` at `e2efed5` (⛔ never `f8d34f3`). ⛔ **No closing phase can
  close with a skip**, so that clone must be present.
- ⛔ **`progress` IS v2 AND PER MODE**: `readProgress()` returns both modes so
  `noteCleared()` writes the pair, and `levelRecord(mode)` defaults to
  `state.mode`.
- ⛔ **MODE IS `OVERDRIVE`, THEN `CLASSIC`, BOTH ENABLED** — the row ORDER is
  GDD §13's default highlight. ⛔ **A driver wanting a Classic run steps ONE row
  down first** (sixteen closed files carry that repair); ⛔ **START DEPTH is
  built for `pendingMode`, never `state.mode`.**
- ⛔ **SCORES' ROWS ARE MODE, VIEW (module only), THE ENTRIES, BACK** — VIEW is
  row 1, rebuilt on entry / MODE / VIEW / a board's answer, never in `draw()`.
  ⛔ **The entry mode is the last run STARTED this session** (`lastRunMode`).
- ⛔ **Nine texts in `22-meta.js`, `23-main.js` and `lib/kit-leaderboard/` are
  pinned by a closed CS011 `mutate`, each exactly once in the build** — grep
  `test-cs011-*.js` for `mutate:` before editing a line in those three files.
- ⛔ **The title has four rows**, game over three lines, and ⛔ **OPTIONS HAS TEN
  ROWS with a SEVEN-row window** — rows added before BACK, never above TELEMETRY.
  ⛔ **NAME steps in place of the menu model** (`stepName()`); ⚠ there Space, Z
  and X type.
- ⛔ **NO TELEMETRY WRITE FROM A PLAY STEP**; a settings save runs inside
  `update()` on a menu step, and `levelRecord(mode)` reads storage every call.
- ⛔ **`Game.reset()` restores the controls and the sound rows, writes nothing,
  and leaves the screen on play**; a test claiming a setting survives a RELOAD
  builds again over the same `Map`.
- ⚠ **A `Store.set` spy sees only `p0`'s writes**, and the stored `lastUsed`
  stays `""` after a first boot (accepted by Paul; do not rename
  `legacyProfileId` to "fix" it).
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
- ⚠ `drawFragments`, `drawHud` and `drawMenu` read `C`, so kit-fx and kit-menu
  extraction each owe an options argument. ⚠ The touch buttons and the
  top-centre pause target are live but undrawn, and the combo readout overlaps
  that target and covers 10 rim lane-centres (F1, accepted, GDD §10.4).
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

## Next up — CS014 planning

⛔ **A PLANNING session**, writing no code (`CLAUDE.md` rule 3a) and ending in
`PLANNED-FEATURES-CS014.md` and `IMPLEMENTATION-PHASES-CS014.md`, committed. The
row is **the ring-flight Dive, hard-capped at 4 s / 6 rings, no failure state
beyond "you stop earning", reusing the depth model** (GDD §14.5, §5). ⛔ Read
"What CS014 must act on" first — in particular what `startDive()` now does and
who is not a Dive survivor — and ⛔ **measure anything measurable.**
