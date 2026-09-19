# Vector Vortex — STATUS
Version: 0.0.9 · Changeset: CS013 (P2 of 5 done) · Wells: 16/16 · Enemies: 6/6 Classic, 1/3 Overdrive · Tracks: 3/5 · Tokens: 5/5 effects

## Phase ledger — CS013

Plan: `PLANNED-FEATURES-CS013.md` (§0 answered, every recommendation);
prompts: `IMPLEMENTATION-PHASES-CS013.md`. Reasoning per phase: `log/CS013.md`.
CS012's ledger and review notes: `log/CS012.md`.

| Phase | Commit | One line |
|---|---|---|
| P2 | this commit | Lance, Spread, Ward (T7–T9): `Shot.pierce` at fire time + `fireLanes()` + the cap in force (`06-shots.js`); one term on the shot-retiring line and the Ward's early return below `killSkimmer()`'s guard (`09-collision.js`); `Thorn.chip()` × `LANCE_CHIP_MULT`, paid per chip of length; the gold streak and `WARD_POLY`/`craftPoints()`'s shell; `C.SFX.wardBreak`. `test-cs013-p2.js` (167). ⚠ TWO unpredicted closed edits, both findings below. 3 of 3 red |
| P1 | `18b812a` | Tokens: `state.tokens` / `state.powers`; `10-powerups.js` (`dropToken()` the ONE way in, one draw per Overdrive kill, a no-op in Classic; `updateTokens()`; Bounty, Recharge; lasting flags); both tables in `C`; `drawToken()`; `C.SFX.collect`. `test-cs013-p1.js` (140). Four closed files in place, one edit unpredicted. 2 of 2 red |

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (25 modules + 3 inlined kit,
  **684.5 KB**); the manifest is checked both directions against `src/`, and a
  missing `KIT_INLINE` file fails the build.
- `node scratchpad/run-all.js`: **68 files, all green, zero skips** (⚠ machine
  load moves the wall clock a lot — 299 s at P1, HEAD's own `test-cs008-p8.js`
  taking 88 s of it).
- **CS001–CS011 are closed; each has a `log/CS0##.md`** (wells and the depth
  model; the loop, craft, shots and four devices; the entity contract, spawner,
  collision, Purge and respawn; the Carrier, Weaver, Thorn, Drifter and Surger;
  the renumber and the Dive; the heat clock, the schedule as DATA and telemetry;
  scoring, Start Depth, the HUD and the front door; the audio engine, the
  director and the limiter; the inlined kit, profiles and the boards).
  ⛔ **The Classic roster is complete at six and GDD §6.2's variant table at
  three** (CS005); ⛔ **all five of GDD §4.5's death conditions are live**
  (CS006).
- **CS012 closed 2026-09-17 — OVERDRIVE'S CORE.** `drive`; `C.MODE_FLAGS` and
  `modeHas()`; the Reaver in `07-enemies-overdrive.js` behind
  `C.SPAWN_SCHEDULE_OVERDRIVE`; OVERDRIVE on MODE with its own board, SCORES per
  mode and `progress` v2; the Jump (kit-audio **0.4.0**); the combo multiplier.
  `log/CS012.md`.
- ⛔ **TEN SOAKS, AND THEY PROVE DIFFERENT THINGS ON DIFFERENT BOARDS.**
  `-cs003-p5` (Vaulter, L2, the per-tick lane SPEED bound); `-cs004-p5` (three
  kinds, L7); `-cs005-p5` and `-cs006-p5` (full board, L23; the latter owns the
  Dive); `-cs007-p5` (the ESCALATING run). ⛔ The front-door soaks: `-cs008-p8`
  (Start Depths 1/5/9, rim arrival); `-cs009-p6` (audio on vs off); `-cs010-p5`
  (`dangerInputs` spied vs constant); `-cs011-p6` (a working store vs
  `storage: "blocked"`, then a reload); **`-cs012-p6` (TWO PAIRS — Classic as-is
  vs jump-pressed-and-stubbed, Overdrive on the recording fake vs no audio API;
  110,174 + 121,840 frames; Overdrive's invariants per step; a reload holding
  BOTH modes).** ⛔ An eleventh file, never a widened closed one.
- ⛔ **`test-cs006-p5.js` carries the count-based form of the no-draw rule**, a
  function of the LEVEL: `spawnEnemy`'s 1 plus `pickSpawnLane`'s bounded
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
  gesture is a DOM event**: `G.input.keyDown()` does not make one, so a soak that
  wants music attaches `fakeTarget()`s and fires `keydown` (`test-cs009-p6.js`,
  `-cs010-p5.js`, `-cs012-p6.js`).
- ⛔ **A seat writes no `state` and draws nothing.** ⛔ The headroom gate
  (`test-cs009-p5.js`, ⚠ provisional) is D16's limiter-curve model: 0.450 against
  `pulse` 0.3512, `title` 0.3408 and — in its own gate, 1e-9 s tie tolerance —
  `drive` 0.3505. It holds only at the rendered settings, so `test-cs010-p1.js`
  pins `C.MUSIC_LIMIT` to D2's literals.
- ⚠ **SETTLED — MUSIC IS STRUCK, NEVER SWELLED** (Paul, 2026-09-16; `CLAUDE.md`
  Audio, GDD §11.3). ✅ Paul's lab picks are ported for `title` and `pulse`;
  ⚠ **`pulse` loops at 72 s** and `drive` at 62.6 s.
- ⛔ **Read GDD §6.5 before adding an enemy.** Eight contract fields (plus
  `points()`), the wiring points, and the Dive.
- `tools/music-lab.html` and `tools/sfx-lab.html` are the porting sources for
  `17-audio-tracks.js` and `C.SFX`, bound to the build by text identity;
  `tools/well-lab.html` (⛔ the visual audition has not happened) and
  `tools/feel-lab.html` (`npm run serve` for LAN) complete the set.

## Known issues

### What CS013's next phases must act on

- ⛔ **THE KILL LINES NOW CARRY `dropToken()`** (P1): `…comboKill(state);
  dropToken(state, e); sfx("kill", …)`. `test-cs012-p4.js` pins them by
  `mutate` in `COMBO_OUT` AND in two shot-kill `mutantRed` strings (`:615–619`,
  ⚠ the one P1 edit plan §11 did not predict). ⛔ **P3's jump-strike kill line
  must match none of them, and a phase that edits a kill line repairs both
  lists.**
- ⛔ **EVERY OVERDRIVE BOARD MOVED AFTER ITS FIRST KILL** (one roll each, K4).
  Three closed fixtures were re-seeded to restore their preconditions:
  `test-cs012-p2.js`'s wall soak (`SOAK_SEED`), `test-cs012-p4.js`'s ×1 run
  (seed 17), `test-cs012-p6.js`'s Overdrive pair (`OD_CLOCK` 7927). ⚠ All three
  are seed-fragile; P3's and P4's schedule rows will move them again.
- ⛔ **ITEM 8 PRICES A BOUNTY PER STEP via a `collectToken` spy** in
  `test-cs012-p4.js` and `-p6.js`. A new unmultiplied event owes both a price.
- ⛔ **`state.powers` IS NOW READ IN THREE FILES** (P2): `06-shots.js` (the cap
  and the volley, `spread`; `pierce` stamped on each `Shot` from `lance`),
  `09-collision.js` (one term on the shot-retiring line; the Ward's early
  return in `killSkimmer()`) and `23-main.js`'s draw (`ward` → the shell).
  **`purgeUses` has a second zeroing writer** (Recharge). `C.TOKEN_COLOR`
  `#FFF347` is the warm gold and is now ALSO a pierced shot's streak and the
  Ward's shell; ⛔ the Warden's blue and the Mimic's violet (W6, MI3) must not
  reach for it or for the eight enemy colours (O16).
- ⛔ **THE SHOT CAP IS THE CAP IN FORCE, NOT `C.SHOT_MAX`** (P2, T8; GDD §17
  item 4 reworded). `C.SPREAD_SHOT_MAX` 24 while Spread is on, and 24 IS
  reached: MEASURED 24 in flight, 15.0 /s per lane on three lanes.
  ⛔ **A test that bounds `state.shots` reads the cap off `state.powers`** —
  `test-cs012-p6.js`'s soak was repaired for exactly this, and
  `test-cs002-p3.js`'s Classic claim is unmoved.
- ⛔ **`killSkimmer()` HAS A SECOND EARLY RETURN, AND EVERY DEATH PATH MEETS IT**
  (P2, T9). Below the invulnerability guard, above everything a death does:
  ⛔ **a P3 or P4 death condition inherits the Ward automatically**, and a
  staged death in an Overdrive fixture must clear `state.powers.ward` or set up
  two hits. ⛔ The Dive is safe only because `startDive()` spends every power —
  a forced-on shell absorbs a Thorn strike (asserted both ways in
  `test-cs013-p2.js`).
- ⛔ **`Thorn.onShot()` READS ITS ARGUMENT — the build's first** (P2, T7). ⛔ A
  new `onShot` must decide what `null` means to it: the rim sweep passes `null`,
  and a Thorn never reaches the sweep (`killDepth` null, asserted). ⛔ The pay
  line moved into `Thorn.chip()` and `    addScore(C.PTS_THORN);` is STILL in
  the build exactly once (`test-cs012-p4.js:607`).
- ⚠ **FINDING (P2, MEASURED) — TWO CLOSED-FILE EDITS PLAN §11 DID NOT PREDICT,
  both "a claim written before the effect existed", restored in place.**
  (1) `test-cs013-p1.js`'s "a death keeps every power": the Ward is spent by the
  hit it ABSORBS, so the fixture needed a second hit and the assertion now reads
  T5's own wording (tokens, Lance and Spread). ⚠ **T5 and T9 interact**, and
  plan §11's P2 row says "none". (2) `test-cs012-p6.js`'s "no array past
  `C.SHOT_MAX`" — the cap in force, above.
- ⛔ **`hudLayout()` HAS TWO OVERDRIVE RECTANGLES, BOTH TIGHT, AND TOKENS ADDED
  NONE** (T10). The Classic four and the jump box are bit-identical with or
  without the combo (`test-cs012-p4.js`, `-p5.js`). ⛔ The centre-top band is
  76.29 px (the Fan well); `HUD_COMBO_Y` 6 + `SIZE` 56 + 2 × `PAD` 4 clears it by
  6.29 px, so `HUD_COMBO_SIZE` cannot pass ~62 (GDD §10.4).
- ⛔ **AN OVERDRIVE ENEMY GOES IN `07-enemies-overdrive.js`** (CS012 P2, O15),
  against the contract in `07-enemies.js`, and reaches the board ONLY through
  `C.SPAWN_SCHEDULE_OVERDRIVE` — the Warden at 11 and the Mimic at 16. ⛔ There
  is no bench key for an Overdrive enemy (O16), and `DEBUG_ROW_KINDS` stays
  Classic's six. `PTS_WARDEN` and `PTS_MIMIC` are unread.
  ⛔ **`scratchpad/test-registry.js`: `enemies` 7 and `enemyKinds` 10** — CS013's
  two are the next movers.
- ⛔ **A MUTATION RUN THAT THROWS, OR ANSWERS UNREADABLY, IS A DEFECT IN THE
  TEST** (CS012 P3, P5, P6): guard the reads, report a COUNT and one index, and
  ⛔ `mutantRed()` asserts its string is in the build exactly once BEFORE it
  asserts red — a `buildGame` throw on a stale string reads as a pass.
- ⚠ **FINDING (CS012 P2, MEASURED): CS008 P1's ε and `atRim()` mutations no
  longer redden a rim-arrival table alone.** P1b's sweep masks them under held
  fire. ⛔ **A CS013 item-13 test for the Warden or Mimic mutates the sweep AND ε
  together** (`test-cs012-p2.js` §9: 18/24). `atRim()` cannot redden a Reaver
  case at all, because a Reaver hunts mid-climb.
- ⚠ **EVERY KIT `VERSION` BUMP IS A CLOSED-FILE EDIT.** FOUR files pin
  `AUDIO_VERSION` by literal (`test-cs009-p1.js`, `-p4.js`, `test-cs010-p1.js`,
  `test-cs012-p5.js`; CS013 plan F3) and two pin the signal path node by node.
  ⛔ A plan that bumps a kit owes §11 a row per pinning file.
- ⚠ **DELETING A CONFIG OBJECT IS A DIFFERENT GREP FROM RE-SOURCING A KEY**:
  ⛔ a plan that deletes one owes §11 a grep for `in <OBJECT>` too.
- ⛔ **`instanceof` IS PER BUILD.** A `gddPoints()`-style helper closed over one
  build matches nothing in any other, and every non-vacuity check then passes on
  zero (`test-cs012-p4.js`). Take the build as an argument.
- ⛔ **A PHASE LENGTH IS NOT `Math.ceil(limit / C.FIXED_DT)`.** `1/60` is not a
  binary fraction, so a count-up timer takes 13 steps to reach 0.20 s where
  `ceil` says 12. Assert the property, never the step count.

### The board, the entities and the Dive

- ⛔ **THE REAVER (CS012 P2) IS A `Vaulter` SUBCLASS.** The Vaulter's hop duration
  and mid-climb heading are overridable readers (`hopDuration()`,
  `midClimbDir()`) and both intervals are `÷ this.hopRate` (1). ⛔ Keep
  `C.VAULT_CLIMB * climbMult()` textually as is (five call sites,
  `test-cs007-p2.js`). ⛔ `bandRun`-style `instanceof X.Vaulter` checks in closed
  files also match a Reaver; they run Classic, so none sees one today.
- ⚠ **A wall-pinned, fire-holding driver parks an Overdrive L7 board with no
  Reaver released** (Weavers and Carriers fill the budget). `test-cs012-p2.js`'s
  `pinWall()` alternates the sweeping replay with a fire-released wall pin.
- ⚠ **THREE ROSTER CLASSES PARK RATHER THAN HUNT** — Carrier, Weaver, Surger. ⛔
  **The repair is the driver, never the build** (`replayWide`'s wall-to-wall pin).
- ⛔ **The Dive has no visual.** No changeset owns it; `state.dive.depth` is the
  value a renderer wants. ⚠ **`C.DIVE_TIME` is the WHOLE dive, grace included**
  (descent 2.25 s); CS014's `DIVE_TIME_OD` inherits the same reading.
- ⚠ The dive death-loop bound in `test-cs006-p5.js` is a BOUND measured at its
  limit (`test-cs006-p3.js` has the mechanism proof), and `test-cs007-p5.js`'s
  well-stall gate does not catch a reverted `threatCount()` — the blocked-beat
  assertion beside it does.
- ⚠ **Unowned, none reachable by the suite's drivers:** a second Purge prefers a
  bolt above 0.95 and pays 0 (PREDICTED); a run STARTING past 99 gets the modulo
  well and no band roll (unreachable at `START_DEPTH_CAP` 81); no played board
  reaches `C.LIVES_MAX` (`test-cs008-p2.js`'s staged rows are the proof); a rim
  Vaulter hunts the CONTINUOUS lane, so a player parked between centres has it
  hopping back and forth. **GDD §12's four-second promise is CS016's.**
- ⛔ **A chosen level is reached from START DEPTH**, never `w`; a console unlock
  is `levelRecord("classic").noteCleared(81)`.

### The Jump and the combo (CS012 P4, P5)

- ⛔ **Airborne is a phase and the multiplier lives at the kill lines — both
  rules are `CLAUDE.md`'s and are not repeated here.** The bag is `state.jump`
  `{ phase, t, cool, latched }`.
- ⛔ **THE LANDING STEP IS NOT AN AIRBORNE STEP** (CS012 P6, MEASURED).
  `updateJump()` runs at the TOP of `update()`, above `updateShots()` and the
  collision pass, so a step that BEGINS airborne can end in `recover` — which is
  contact-lethal and cannot fire, by design. An invariant written on the
  pre-step phase alone reads two legal landing deaths as a breach.
- ⛔ **`updateJump()` MUST STAY A TOTAL NO-OP OUTSIDE `modeHas("jump")`** — it
  writes nothing, `latched` included. ⛔ **THE COOLDOWN COUNTS FROM LANDING**, and
  `JUMP_RECOVERY` is its first beat rather than a fourth timer. ⛔ **`resetJump()`
  HAS THREE CALLERS** — `enterWell()`, `respawnSkimmer()` and `startDive()` — and
  it does NOT clear `latched`; `killSkimmer()` forces `latched` true.
- ⛔ **FOUR SIGNATURES MOVED, EVERY ADDED ARGUMENT OPTIONAL** (older callers
  bit-identical): `skimmerPoints(well, lane, squash, lift)`, `Skimmer.draw(ctx,
  well, lift, ward)` (CS013 P2) and `drawShot(ctx, well, lane, depth, pierce)`
  (P2). The HUD view carries `jump`, `null` in Classic. ⛔ `skimmerPoints()`'s
  body is now `craftPoints(well, poly, pts, …)`, shared with `wardPoints()` —
  **ONE copy of the lift math**; a third silhouette passes a poly and a scratch,
  never a second projector.
- ⛔ **`test-cs012-p5.js` PINS TWO TEXTS BY `mutate`, each exactly once in the
  build:** `  if (jumpAirborne(state)) return;` (with its newline) and
  `state.input.fire && jumpCanFire(state) &&`. It also `mutate`s
  `  JUMP_LIFT:            0.12,` to prove the lift is draw-only. ⚠ It RUNS
  `test-cs009-p5.js` in a child process, so a change that reddens that file
  reddens this one too, with a less useful message.
- ⛔ **A lapse does NOT empty the kill count** — O3 empties it on a death alone.
  ⛔ `since` WRAPS at `C.COMBO_WINDOW`. ⛔ **`peak` is 0 until the run's first
  kill**, so "never below the live multiplier" starts there, not at `newState()`.
- ⛔ **SIX MUTATION STRINGS TAKE THE COMBO OUT** (`COMBO_OUT`,
  `test-cs012-p4.js`), one per kill line plus `comboDeath()` and `updateCombo()`.
  The three kill lines are textually identical, so each string carries the line
  that follows it (`break;` / `continue;` / the Purge's own `if`). ⛔ **A phase
  that edits a kill line repairs that list.**
- ⛔ **GDD §17 item 8 WITH A MULTIPLIER IS ASSERTED PER `addScore` CALL, NOT PER
  STEP**: a step can span a step up. The board's price multiset holds prices > 0
  only — a zero-price death is a bolt self-terminating or a Thorn taken by its
  last chip.
- ⛔ **`state.shots.push` CANNOT BE INTERCEPTED to see a new shot** (CS012 P6,
  MEASURED): `updateShots()` filters `state.shots` into a NEW array before it
  fires, so a hook on the pre-step array never sees it and a removed fire gate
  reads GREEN. `state.tally.shotsFired` is the honest counter. ⚠ `state.enemies`
  is the opposite case — filtered AFTER the entity and collision passes, so a
  Carrier's split does land on the pre-step array.

### Audio

- ⛔ **KIT-AUDIO 0.4.0** — the chain and its rules are `CLAUDE.md`'s. The hazard
  here: the duck and dip sit AFTER the limiter because a duck in front of one
  measured −1.9 dB, and `setHighpass()`'s `Q` is a fixed Butterworth so D16's
  model needs no term for it.
- ⚠ **FINDING (CS012 P1, MEASURED): THE HEADROOM GATE CANNOT CATCH A LOUDER
  TRACK.** Under D16's curve a doubled layer moves the model by 1/20 of its dB
  (`drive`'s kick ×2: 0.3505 → 0.3564); red needs an input of 152.8. The gate
  guards the limiter's premise, the curve and the buses, and goes red without the
  limiter. ⛔ **Whether it should also bound the limiter's INPUT is Paul's call.**
- ⛔ **`drive` IS UNTIERED, UNMARKED AND UNHEARD** (O13). ⛔ **Paul's lab port
  rewrites `test-cs012-p1.js`'s "no tier" / "no audition mark" in place**;
  music-lab's slowest step for it is 76 BPM. ⚠ sfx-lab plays only
  `pulse` in context, so the Surger tone over `drive` has no lab audition.
  ⛔ One `beat: true` layer per track: `pulse`'s `heart`, `drive`'s `kick`.
- ⚠ **Classic's intensity peaks at 0.668, Overdrive's at 0.6448** (CS012 P6, over
  121,840 front-door frames; P4 measured 0.6519 on staged boards). ⛔ **GDD §19
  keeps its ✗ and no weight is rescaled** (O14, D6).
- ⚠ **Unowned:** the Surger tone's 1.106 sample peak at unity, the empty VOICE
  bus (A3), and R2's pad-only silence (kit-input's `onGesture` fires on
  `keydown`, `mousedown` and `touchend` only).
- ⛔ **CS009 TRAPS IN AUDIO CODE.** (1) The vocabulary scan reads the whole built
  file, comments included, and also bans "atari" (write "the original's").
  (2) Never `.key` after an identifier ending in `e`. (3) Never start a comment
  line with `// 21-telemetry.js` or `// 22-meta.js`. (4) No platform RNG.
- ⛔ **Never write the text `audioFrame()` inside `frame()`**, comments included
  (`test-cs009-p3.js` counts it there), and ⛔ `audioFrame()`'s body may not
  contain the text "draw".
- ⛔ **THE SURGER TONE IS DECIDED AT FRAME END**: frozen or off play stops every
  voice; a live run with no step holds them. Do not stop it on a stepless frame.
- ⛔ **THE DIRECTOR runs BEFORE `setState()`.** Its one board reader is
  `dangerInputs(state, out)`; **any new `heat(` call turns `test-cs007-p2.js`
  red** (use `heatT()`), and **`19-sfx.js`'s code may not name `state`**. ⚠ A run
  resets it only when play is entered from a non-run screen. ⛔ **`setState()`
  before the first gesture is DROPPED**, which is why `audioFrame()` calls it
  every frame; never move it onto a screen change. The rim pulse is `Game`'s
  closure variable `rimGlow`, 0 off play.
- ⛔ **AN EDIT TO `16-audio-engine.js` OR `17-audio-tracks.js` IS A THREE-FILE
  EDIT** (both labs' BLOCK A / B), and so is a change to `C.MUSIC_LIMIT`,
  `C.LAYER_THRESHOLD`, `C.LAYER_CROSSFADE` or `C.FILTER_*` (`test-cs010-p3.js`
  pins both labs' `LAB` copies). `00-config.js`'s SFX group is sfx-lab's BLOCK
  SFX; ⛔ each `C.SFX` event stays ONE line starting `    name:`.
- ⚠ **`test-cs009-p5.js`'s headroom sort compares exact floats**: a non-binary
  `stepDur` (138 BPM) reads a back-to-back pair as an overlap, and a future tempo
  port repairs that fixture in place. ⛔ A test that counts scheduled steps counts
  NOTES, never distinct start times; a menu step's sound is read off its ANSWER,
  and `syncScreen()` sets `menuEntering` so an entry step is silent.

### Meta, menus and the front door

- ⛔ **`22-meta.js` IS THE ONLY ROUTE TO STORAGE** (kit-storage THROWS on an
  undeclared key), ⛔ **`p0`'s scope is the ROOT store**, and ⛔ **`OWN_KEYS` is
  the declared per-profile list** — CS015 adds `achievements` there and to
  `Store`; never `scores` or `profiles`.
- ⛔ **THE BOOT BLOCK RUNS INSIDE THE HARNESS** (`Meta.boot()` writes `profiles`
  in every build). ⛔ **kit-leaderboard cannot be inlined**: `test-cs009-p1.js:508`
  bans its `setTimeout` and `test-cs002-p1.js` its `addEventListener`.
- ⛔ **THE RUN'S END IS `Meta.runEnded(outcome)`**, seated at `startGame()`'s last
  line, `quitToTitle()`'s first (on pause), and `frame()` after the steps.
  ⛔ **ONE GATE, `Meta.eligible()`**, closed by a bench digit, `0` or `w` in play;
  ⛔ **Meta writes no `state`.**
- ⛔ **`Leaderboard` HOLDS ONE KIT CLIENT PER MODE**, over
  `C.LEADERBOARD_GAME_IDS`, both made by the first call that finds the module,
  Classic first; a throwing `create()` is not retried, per client. `queueLength()`
  **sums both** and ONE stale token covers both. ⛔ **`C.GAME_ID` is the SAVE
  keyspace, never a board id** (CS012 P6 repaired seven closed assertions on it).
  ⛔ **It is the ONE reader of `window.KitLeaderboard`, LAZY on every call**: a
  test sets a fake on `X._env.win`, and ⛔ **a fake serving both clients counts
  its queues and submits PER `gameId`.**
- ⚠ **TWO TESTS READ coinless-kit's `registry.js`**, from `../coinless-kit`, and
  each SKIPS LOUDLY without it: `test-cs011-p5.js` at `git show f0b0eb2:` and
  `test-cs012-p3.js` at `e2efed5` (⛔ never `f8d34f3`). ⛔ **A closing phase
  cannot close with a skip**, so that clone must be present.
- ⛔ **`progress` IS v2 AND PER MODE**; `readProgress()` returns BOTH modes so
  `noteCleared()` writes the pair, and `levelRecord(mode)` defaults to
  `state.mode`.
- ⛔ **MODE IS `OVERDRIVE`, THEN `CLASSIC`, BOTH ENABLED**, and ⛔ **the row ORDER
  is GDD §13's default highlight** — no mark, no colour, no flag. ⛔ **A driver
  that wants a Classic run steps ONE row down first**; fifteen closed files carry
  that repair. ⛔ **START DEPTH is built for `pendingMode`, never `state.mode`**,
  which at MODE names the LAST run's.
- ⛔ **SCORES' ROWS ARE MODE, VIEW (module only), THE ENTRIES, BACK**, so VIEW is
  row 1. ⛔ Rebuilt on entry, on MODE, on VIEW and when a board answers, never in
  `draw()`. ⛔ **The entry mode is the last run STARTED this session**
  (`lastRunMode`), else MODE's first row. ⛔ **A score row stamps `profileName`
  when the run ends.**
- ⛔ **Nine texts are pinned by a closed `mutate`, each exactly once in the
  build**, so editing one of these lines reddens a CS011 file: `hooks.resetSettings();`;
  `if (!on && state.screen !== "play") Meta.saveTelemetry();`;
  `if (state.screen === "gameover" && Meta.runOpen()) Meta.runEnded("died");`;
  `return run !== null && !run.bench;`; `sfx("gameOver");`;
  `input.captureText(state.screen === "profileName" ? onNameText : null);`;
  `for (const key of OWN_KEYS) scope.remove(key);`; `Profiles.remove`'s kit-first
  body, whitespace included; `const answer = b => { if (t === token) done(b); };`;
  and `currentRunId = mintRunId();` in `lib/kit-leaderboard/`.
- ⛔ **The title has four rows**; game over three lines; ⛔ **OPTIONS HAS TEN
  ROWS, THE WINDOW SHOWS SEVEN**, and rows added go before BACK, never above
  TELEMETRY. ⛔ **NAME steps in place of the menu model** (`stepName()`), armed
  and ended in `syncScreen()` only; ⚠ there Space, Z and X type. ⚠ **SETTLED —
  DELETE RUNS kit-profile's `remove(id)` BEFORE THE `remove(key)` CALLS.**
- ⛔ **NO TELEMETRY WRITE FROM A PLAY STEP.** ⛔ A settings save runs inside
  `update()` on a menu step, and `levelRecord(mode)` reads storage on every call
  (never cache it). ⛔ **A switch runs `beforeChange`, then `change`:
  `resetSettings()`, the incoming `settings`, an emptied ring.**
- ⛔ **`Game.reset()` restores the controls and the sound rows and writes
  nothing**, and leaves the screen on play — so a fixture's `frame(0)` before
  `quitToTitle()` schedules real notes on the fake at t = 0. A test claiming a
  setting survives a RELOAD builds again over the same `Map`.
- ⚠ **A `Store.set` spy sees only `p0`'s writes.** ⚠ The stored `lastUsed` stays
  `""` after a first boot — accepted by Paul; ⛔ do not "fix" it by renaming
  `legacyProfileId`.
- ⛔ **A REPLAY THAT OUTLIVES ITS GAME OVER MEETS A LIVE MENU** — a scripted Fire
  there RESTARTS on a time seed and a Purge quits, so stop pressing at the stop;
  ⛔ **a driver that starts at the title spends two live steps before its first
  press.** ⛔ **THE SCRIPTED FIRE-HOLDER HAS NO DEATH PATH ON LEVELS 1–4** (the
  rim sweep), so the front-door soaks turn passive after 9,000 steps — ⚠ **and a
  SCRIPTED JUMPER outlives that too** (airborne immunity is 39 % of the cycle),
  so `test-cs012-p6.js` stops jumping when the fire hold ends.
- ⛔ **`test-cs008-p4.js` scans the WHOLE built file, comments included**: no
  `fillRect`/`strokeRect`, one `.fillText(` / `.strokeText(` site.
  `test-cs002-p3.js` bans `ctx.fill` in `14-render-entities.js`;
  `test-cs002-p1.js` bans `e.key`, `.touches`, `getGamepads`, `clientX` and
  `addEventListener` outside `04-input.js`, and `C.`/`state.` inside it;
  `Game.draw()` must not name `Telemetry`.
- ⛔ **`Game.update()` calls `syncScreen()` TWICE**, before and AFTER
  `input.sample()` — remove the second and a Fire held in play confirms RESUME.
  ⛔ **`frame()` drains `hitStopLeft` only on `"play"` and `"gameover"`.**
- ⚠ **`_harness.js`**: `{ stub }` rebinds a named top-level function to a no-op;
  `{ spy }` counts calls and runs optional `.before` / `.after` hooks. A function
  inside `Game`'s closure cannot be reached this way — ⛔ **`Game.update` is one
  of them**, so a per-step soak hook reads `G.stats.ticks` around a half-frame
  instead. `{ store, storage, crypto, mutate }` and `_env.storageReads` are
  CS011's.
- ⚠ `drawFragments`, `drawHud` and `drawMenu` read `C` for sizes and colours, so
  kit-fx and kit-menu extraction each owe an options argument. ⚠ `C.MENU_COL_W`
  460 clears "MOUSE SENSITIVITY" + an adjusting detail. ⚠ The touch buttons and
  the top-centre pause target are live but undrawn, and the combo readout
  overlaps that target (O8 measured and accepted it).
- ⚠ **A closed test may pin the literal text of a line a later phase changes.**
  ⛔ Pin only the argument the claim is about. ⚠ `test-cs007-p4.js:479`'s comment
  still names `Profiles.keyFor` (a closed file; not an assertion).

## Open questions (blocking)

- None.

## Carried tasks

- ⛔ **Paul, when he wants it: `drive`'s lab session** (PASS marks, tiers, gains,
  tempo). It ports as its own commit. Nothing waits on it.
- ⚠ **Paul replaces `C.CREDITS_LINES` before ship.**
- ✅ **Both boards are registered and deployed** (coinless-kit `e2efed5`,
  2026-09-16): `vector-vortex` and `vector-vortex-overdrive`, both at
  `maxMetricPerSecond` **150,000**, the same seven `statsFields`, `maxMetric`
  10,000,000 and durations 5–86,400 s. ⛔ Never pin `f8d34f3`. ⚠ The deployed
  `statsFields` cannot be read remotely; the repo's registry has all seven.
- ⛔ **CS015 — achievements** (Paul's M4), planned once Overdrive exists.
- ⛔ **The seven debug spawn actions ship until CS017** (Paul's H5 call).
- Backport kit-input (0.8.0), kit-menu (0.1.0), kit-fx, kit-audio (**0.4.0**) and
  kit-leaderboard (0.2.1, `lib/`) to coinless-kit — each a separate manual step,
  verified against that repo's own suite. `createScores`
  (`src/22-meta.NOTES.md`) is kit-scores' draft.
- ⚠ **`CLAUDE.md` carries no telemetry rule**; whether it earns one is Paul's
  call. ⛔ **`TELEMETRY_FIELDS` is frozen at 29 columns and `telemetry` at v1**
  until a changeset deliberately moves it; `TELEMETRY_FIELDS`,
  `TELEMETRY_KINDS`, `telemetryRow()` and `22-meta.js`'s declared `telemetry`
  version move together.

## Next up — CS013 P3

The Warden (W1–W6): `aloft` as the ninth contract field, the climb, the hunt,
the strike, the jump strike — a FOURTH kill site — and its row at level 11.
`IMPLEMENTATION-PHASES-CS013.md`'s P3 prompt. ⛔ Read "What CS013's next phases
must act on" above first.
