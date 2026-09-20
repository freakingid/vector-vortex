# Vector Vortex — STATUS
Version: 0.0.11 · Changeset: **CS014 closed 2026-09-20** · next: **CS015 planning** ·
Wells: 16/16 · Enemies: 6/6 Classic, 3/3 Overdrive · Tracks: 3/5 · Tokens: 5/5 effects

## Phase ledger

⛔ **CS014's ledger, reasoning, mutation records and the CLOSE REVIEW moved to
`log/CS014.md`.** This file is reset for CS015 and carries only what a CS015
phase must act on. ⛔ `log/` is not session context: pull one file in only when a
question genuinely needs project history, and say that you did.

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (25 modules + 3 inlined kit,
  **762.9 KB**, 781,198 bytes); the manifest is checked both directions against
  `src/`, and a missing `KIT_INLINE` file fails the build.
- `node scratchpad/run-all.js`: **74 files, all green, zero skips.**
  ⚠ **`run-all.js` has a 120 s PER-FILE timeout and machine load can trip it.**
  ⛔ A timeout is not a red — re-run the file alone before treating it as one.
- **CS001–CS014 are closed; each has a `log/CS0##.md`.** ⛔ **The Classic roster
  is complete at six and GDD §6.2's variant table at three** (CS005); ⛔ **all
  five of GDD §4.5's death conditions are live** (CS006) in **both modes**
  (CS014), and every hazard since has been a new SHAPE of one of them.
- **CS012 (2026-09-17) shipped OVERDRIVE'S CORE** — `drive`, `C.MODE_FLAGS` and
  `modeHas()`, the Reaver, OVERDRIVE on MODE with its own board and `progress`
  v2, the Jump (kit-audio **0.4.0**), the combo. **CS013 (2026-09-20) its TOKENS
  AND LAST TWO ENEMIES** — five tokens behind one `dropToken()`, the Warden
  (`aloft`, the jump strike, the FOURTH kill site), the Mimic ⚠ on probation.
  **CS014 (2026-09-20) its DIVE** — a fourth mode flag `rings`, `diveTime()`,
  six rings on a lattice of the well and constants alone, an unmultiplied
  payout, and ⛔ **the Dive's visual, in BOTH modes.** `log/CS012–014.md`.
- ✅ **GDD §19's OVERDRIVE ROW IS MET, every item.** ⛔ Core, Audio and Meta keep
  their standing verdicts; ⚠ **Audio's "filter sweep audible end to end" is the
  one remaining ✗ in the document** and it is Paul's D6, not a phase's: the
  highest reading ever measured is **0.6860** (CS013 P5) and CS014's twelfth
  soak came in *lower*, 0.6539, because a longer release beat reads less danger.
- ⛔ **TWELVE SOAKS, EACH PROVING A DIFFERENT THING ON A DIFFERENT BOARD** —
  `-cs003-p5` … `-cs007-p5` on the board, then the front-door pairs `-cs008-p8`,
  `-cs009-p6`, `-cs010-p5`, `-cs011-p6`, `-cs012-p6`, `-cs013-p5`, `-cs014-p3`.
  Each file's header says what its pair holds constant. ⛔ **CS015's is a
  THIRTEENTH file, never a widened closed one.**
- ⛔ **`test-cs006-p5.js` carries the count-based no-draw rule**, a function of
  the LEVEL: `spawnEnemy`'s 1 plus `pickSpawnLane`'s bounded
  `[1, C.SPAWN_LANE_TRIES]`, +0 at levels 1–2 and +1 from level 3.
- ⛔ **`test-cs004-p1.js`'s `GOLDEN_LANES` — its first SIXTEEN entries are the
  ORIGINAL `9ebd27b` recording**, held by a separate prefix assertion; CS008 P1
  appended `2, 5`. ⛔ **Any other move is a defect, not a baseline.**
- ⛔ **`test-cs006-p2.js`'s `P1_DETERMINISM_HASH` is the one baseline that moves,
  and it is CROSS-FILE** (it runs `test-cs005-p5.js` in a child process). It
  stands at **1229033515**, unmoved through CS009–CS014. ⛔ Re-record it once per
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
  `points()`), the wiring points, the Dive — and ⛔ **neither a token nor a RING
  is on that table** (GDD §14.1's T1, §14.5's RF1): no contract field, no
  `ENEMY_KINDS` row, its own home, its own wiring.
- `tools/music-lab.html` and `tools/sfx-lab.html` are the porting sources for
  `17-audio-tracks.js` and `C.SFX`, bound to the build by text identity;
  `well-lab` (⛔ the visual audition has not happened) and `feel-lab` complete
  the set. ⛔ **A new `SFX_KILL_PITCH` voice is a THREE-file edit**: `C`,
  sfx-lab's BLOCK SFX and its `PITCH_*` candidate tables. ⛔ **`C.SFX` is 27
  events and `C.SFX_KILL_PITCH` 11 voices**; a new event owes the lab a brief,
  an A label, 1–2 alternates and an in-context sequence, and is ONE line
  starting `    name:`. There are **four** lab preview copies of `C` pinned to
  the build (`test-cs010-p3.js`, `test-cs014-p2.js`'s `LAB.dive`).

## Known issues

### What CS015 must act on

⛔ **CS015 is ACHIEVEMENTS (Paul's M4), so it is the STORE and a SCREEN.** The
hazards below are the ones that block, in that order. ⛔ Reasoning for any of
them is in `log/CS0##.md`, not here.

- ⛔ **`src/20-achievements.js` IS A ONE-LINE PLACEHOLDER** and is already in
  `MANIFEST` and in `CLAUDE.md`'s code map as a future kit module
  (`kit-achievements`). ⛔ **It obeys the boundary contract from its first
  commit** — explicit params and callbacks, no game reach — and owes a
  `src/20-achievements.NOTES.md` from the start.
- ⛔ **`achievements` IS NOT A DECLARED KEY YET** (`CLAUDE.md`, Save data).
  CS015 adds it to `22-meta.js`'s one `Store` **and** to `Profiles.remove()`'s
  `OWN_KEYS`, which today is `["settings", "progress", "telemetry"]` — ⛔ never
  `scores` and never `profiles`, which are ROOT. ⛔ **`get`/`set` on an
  undeclared key throws**, and ⛔ **the game never enumerates storage and never
  builds a key string**; `22-meta.js` is the only file that calls storage.
- ⛔ **Achievement `id` values are SAVE DATA and are never renamed** (GDD §15.5;
  `CLAUDE.md`). ⛔ **A row-shape change bumps that key's version and supplies a
  `migrate`** — pure, never calling back into the store, returning `undefined`
  for an origin version it cannot read. `progress` v2's `migrateProgress` is the
  worked example.
- ⛔ **THE BOOT BLOCK RUNS INSIDE THE HARNESS**: `Meta.boot()` writes `profiles`
  in every build, so a storage test starts from a booted store.
  ⚠ **A `Store.set` spy sees only `p0`'s writes**, and ⛔ **profile `p0`'s scope
  IS the root store**, so a per-profile `remove(key)` on `p0` must never name a
  root key.
- ⛔ **NO TELEMETRY WRITE FROM A PLAY STEP**; a settings save runs inside
  `update()` on a menu step, and `levelRecord(mode)` reads storage on every
  call. An achievement evaluator that reads or writes per step is the same trap.
- ⛔ **THE MENU SHAPES A SCREEN HAS TO FIT INTO**: the title has **four rows**,
  game over **three lines**, and ⛔ **OPTIONS HAS TEN ROWS WITH A SEVEN-ROW
  WINDOW** — a row is added before BACK, never above TELEMETRY. ⛔ **SCORES' rows
  are MODE, VIEW (module only), the entries, BACK**, VIEW rebuilt on entry /
  MODE / VIEW / a board's answer and never in `draw()`; ⛔ **the entry mode is
  the last run STARTED this session** (`lastRunMode`). ⛔ **NAME steps in place
  of the menu model** (`stepName()`); ⚠ there Space, Z and X type.
- ⛔ **NINE TEXTS IN `22-meta.js`, `23-main.js` AND `lib/kit-leaderboard/` ARE
  PINNED BY A CLOSED CS011 `mutate`**, each exactly once in the build — grep
  `test-cs011-*.js` for `mutate:` before editing a line in those three files.
  ⛔ **kit-leaderboard cannot be inlined**: `test-cs009-p1.js:508` bans its
  `setTimeout` and `test-cs002-p1.js` its `addEventListener`.
- ⛔ **`Game.reset()` restores the controls and the sound rows, writes nothing,
  and leaves the screen on play**; a test claiming a setting survives a RELOAD
  builds again over the same `Map`. ⛔ **A chosen level is reached from START
  DEPTH**, never `w`; a console unlock is `levelRecord("classic").noteCleared(81)`.
- ⛔ **`progress` IS v2 AND PER MODE**: `readProgress()` returns both modes so
  `noteCleared()` writes the pair, and `levelRecord(mode)` defaults to
  `state.mode`. `Object.keys(C.MODE_FLAGS)` is where the mode list comes from,
  so ⛔ **a feature is a FIELD IN THE ROWS, never a new top-level mode key.**

### The Dive, the ring flight and the entities, as shipped

- ⛔ **`startDive()` DOES FIVE THINGS** (GDD §5, §14.5): `resetDive()` — ⛔ which
  also EMPTIES `state.dive.rings`, which is why the set needs no second reset
  caller — the board filtered to `anchored` survivors, `resetJump()`,
  `resetTokens()` (⛔ so **no Ward can absorb the Thorn strike**) and
  `layRings()`, ⛔ the set's ONE way in, BELOW the other four. ⛔ **A Warden and
  a `MimicShot` are NEVER Dive survivors.** ⛔ **A REPEATED DIVE RE-LAYS THE
  SET**, so a snapshot taken across a repeat is of objects the array no longer
  holds.
- ⛔ **BOTH DIVE CAPS HAVE EXACTLY ONE READER EACH, AND `test-cs006-p3.js`
  COUNTS THEM ON CODE LINES ONLY** — `C.DIVE_TIME_OD` in `diveTime()`,
  `C.DIVE_RINGS_MAX` in `layRings()`. ⛔ **`diveTime()` reads the FLAG, never
  `state.mode`** — the cut has to take the length with it.
- ⛔ **A DIVE PAYS EXACTLY ONE THING AND IT IS A RING**, asserted per step in
  FIVE files (`-cs012-p4`, `-p6`, `-cs013-p2`, `-p5`, `-cs014-p3`), each reading
  `C.RING_POINTS` off the build. A dive builds nothing, rolls nothing and spends
  **zero draws**; the termination kill pays nothing. ⛔ **ITEM 8 ALSO PRICES A
  BOUNTY PER STEP** in three of those files.
- ⛔ **`diveDrawDepth()` IS THE RENDERER'S WHOLE KNOWLEDGE OF THE DIVE** and the
  rest of that rule is `CLAUDE.md`'s. ⛔ **A soak that hashes must call
  `frame()`, not `update()`.**
- ⚠ **`RING_POINTS` 100, `RING_ARC_LANES` 1.5, `RING_LANE_STEP` 0.25 and the
  five visual values are PROVISIONAL**; ⛔ **`DIVE_TIME_OD` 4.0 and
  `DIVE_RINGS_MAX` 6 are NOT** — GDD §14.5's hard cap, and ⛔ **a ceiling may
  only come DOWN.** ⛔ **The lattice is a function of the WELL and constants and
  nothing else** — no draw, no `heat()`, no `state.level`, ⛔ not the craft's
  lane — and ⛔ **the arc walk uses `laneHop()`, never `laneNormalize()`.**
- ⛔ **FOUR KILL SITES AND FIVE KILL LINES, ALL IN `09-collision.js`**
  (`:159`, `:284`, `:495`, `:508`, `:560`), and CS014 added none. ⛔ **A phase
  that edits a kill line repairs `test-cs012-p4.js`'s six `COMBO_OUT` strings,
  its two `mutantRed` shot-kill strings, `-p6.js`'s, and `test-cs014-p1.js`'s
  count of four.**
- ⛔ **AN `aloft` ENTITY IS INVISIBLE TO THE SHOT PASS AND VISIBLE TO EVERYTHING
  ELSE** — `collideSkimmer()`, `purgeTarget()`, `respawnSkimmer()`,
  `dangerInputs()`, `threatCount()` and `wellCleared()` all read it as an
  ordinary entity at depth 1. ⛔ **A new reader that wants to exclude one must
  say so itself.**
- ⛔ **THE REAVER IS A `Vaulter` SUBCLASS AND THE `MimicShot` A `WeaverBolt`
  ONE; THE WARDEN AND THE MIMIC ARE NOT.** ⛔ Keep each `C.X_CLIMB *
  climbMult()` textually as is (`-cs007-p2:476` reads **seven**); order a price
  table's branches subclass-first.
- ⚠ **THE MIMIC IS ON PROBATION AND CUTS IN ONE ROW** (GDD §21 #6):
  `{ level: 16, kind: "mimic" }`. ⛔ **Keep it that way**; cutting it moves
  `test-registry.js` to 8 / 11. ⛔ **`C.SPAWN_SCHEDULE_OVERDRIVE` IS COMPLETE AT
  THREE ROWS** (6, 11, 16), and ⛔ `C.MIMIC_APEX` is BOUNDED, not tuned (≤ 0.4308
  against the shipped 0.40).
- ⛔ **`test-registry.js`: `enemies` 9, `enemyKinds` 13**, `state` **28** keys —
  they differ by more than one because `mimicShot` and `weaverBolt` are kinds
  with no roster row and the three Carrier variants are three rows behind one
  roster entry.
- ⚠ **Unowned, none reachable by the suite's drivers:** a second Purge prefers a
  bolt or a reflection above 0.95 and pays 0 (PREDICTED); a run STARTING past 99
  gets the modulo well and no band roll (unreachable at `START_DEPTH_CAP` 81);
  no played board reaches `C.LIVES_MAX`; a rim Vaulter — ⚠ and an aloft Warden —
  hunts the CONTINUOUS lane.

### Test hazards

- ⛔ **A CLOSED OVERDRIVE PLAY AT L11+ OWES ITS DRIVER FOUR THINGS** (CS013 P3–P5,
  CS014 P3; MEASURED): jump at anything `aloft`; **never target** a `MimicShot`
  and steer away within a lane; **go to** a hovering token; and ⛔ **steer to a
  ring in reach during a dive** — "in reach" derived from the depth model and
  `C.KEY_SPEED_MAX`, never a constant. ⛔ Each is a no-op where the thing does
  not exist, which is what keeps a Classic pair bit-identical.
  ⛔ **Repairs are the DRIVER, never the build, a lowered level or a relaxed
  assertion** — ⚠ **with the FIXTURE, playing longer, as the second repair.**
- ⛔ **A DIVE'S LENGTH IS A PROPERTY, NEVER A STEP COUNT** (`1/60` is not binary,
  so `Math.ceil(limit / C.FIXED_DT)` is wrong by a step). ⛔ **A run that ends
  inside a dive leaves `dive.active` TRUE until the RESTART press**, so a "the
  dive ended" detector must gate on the PRE-STEP screen being `"play"`. ⛔ **And
  `state.tally` is re-minted by `startGame()`** — a multi-run session accumulates
  per step or reads the last run's tally alone.
- ⛔ **A KILL SITE'S OWN READING IS READ AT THE CALL, NOT AFTER THE STEP**, and
  ⛔ **the same trap bites `state.dive`**: the dive's END is `nextWell()` →
  `enterWell()` → `resetDive()` on one step, so rings and timer are snapshot
  BEFORE the step.
- ⛔ **THREE OVERDRIVE FIXTURES ARE SEED-FRAGILE**: `-cs012-p2`'s `SOAK_SEED`,
  `-cs012-p4`'s seed (**59** since CS014 P1) and `-cs012-p6`'s `OD_CLOCK` 7927.
  ⛔ **Anything that changes how long an Overdrive BEAT lasts is as much a mover
  as a draw**, and ⚠ which one moves is not predictable from a stand-in.
- ⛔ **`gddPoints()` HAS SEVEN COPIES AND THE COUNT IS NOT WHAT DECIDES** —
  `-cs008-p2`, `-p8`, `-cs012-p4`, `-p6`, `-cs013-p2`, `-p5`, `-cs014-p3`.
  ⛔ **What decides is whether that copy's board can KILL the entity**; the two
  CS008 copies price CLASSIC boards and rightly carry no Overdrive row, and
  ⚠ `-cs013-p2`'s carries a Mimic row and NO Warden row, right only because its
  driver never jumps. ⛔ **`instanceof` is PER BUILD** — the helper takes the
  build. ⚠ A ring is on none of them: it has no `points()`.
- ⛔ **A MUTATION RUN THAT THROWS IS A DEFECT IN THE TEST**: guard the reads,
  report a COUNT and one index, ⛔ assert the string is in the build exactly once
  BEFORE asserting red, and ⛔ **run one probe over the real build and the
  mutant.** ⚠ **A closed test may pin the literal text of a line a later phase
  changes** — ⛔ **pin only the ARGUMENT the claim is about**, which is the
  lesson CS014 P2 learned on CS014 P1's own file.
- ⛔ **A TEST THAT BOUNDS `state.shots` READS THE CAP IN FORCE off
  `state.powers`** (GDD §17 item 4). MEASURED: 24 IS reached.
- ⛔ **A STAGED DEATH IN AN OVERDRIVE FIXTURE MUST CLEAR `state.powers.ward` OR
  SET UP TWO HITS** — every death path meets `killSkimmer()`'s second early
  return.
- ⛔ **`state.shots.push` CANNOT BE INTERCEPTED to see a new shot** (MEASURED):
  `updateShots()` filters into a NEW array before firing; `state.tally.shotsFired`
  is honest. ⚠ `state.enemies` is the opposite — filtered AFTER both passes.
- ⛔ **MODE IS `OVERDRIVE`, THEN `CLASSIC`, BOTH ENABLED** — the row ORDER is
  GDD §13's default highlight. ⛔ **A driver wanting a Classic run steps ONE row
  down first**; ⛔ **START DEPTH is built for `pendingMode`, never `state.mode`.**
- ⛔ **A REPLAY THAT OUTLIVES ITS GAME OVER MEETS A LIVE MENU** — a scripted Fire
  there RESTARTS on a time seed and a Purge quits, so stop pressing at the stop,
  and ⛔ **a driver starting at the title spends two live steps first.**
  ⛔ **A FIRE-HOLDER HAS NO DEATH PATH ON LEVELS 1–4**, jumping or not.
- ⛔ **`test-cs008-p4.js` scans the WHOLE built file, comments included**: no
  `fillRect`/`strokeRect`, one `.fillText(`/`.strokeText(` site.
  `test-cs002-p3.js` bans `ctx.fill` in `14-render-entities.js`;
  `test-cs002-p1.js` bans `e.key`, `.touches`, `getGamepads`, `clientX` and
  `addEventListener` outside `04-input.js`, and `C.`/`state.` inside it.
  ⚠ **Strip comments before grepping a function's own source.**
- ⛔ **CS009 TRAPS IN AUDIO CODE.** (1) The vocabulary scan reads the whole built
  file, comments included, and also bans "atari" (write "the original's").
  (2) Never `.key` after an identifier ending in `e`. (3) Never start a comment
  line with a `21-`/`22-` module banner. (4) No platform RNG. (5) Never write
  `audioFrame()` inside `frame()`, and that body may not contain "draw".
  ⛔ **THE DIRECTOR runs BEFORE `setState()`**; a new `heat(` call turns
  `test-cs007-p2.js` red (use `heatT()`), and `19-sfx.js`'s code may not name
  `state`. ⛔ **`setState()` before the first gesture is DROPPED.**
- ⛔ **AN EDIT TO `16-audio-engine.js` OR `17-audio-tracks.js` IS A THREE-FILE
  EDIT** (both labs' BLOCK A / B), and so is one to `C.MUSIC_LIMIT`,
  `C.LAYER_THRESHOLD`, `C.LAYER_CROSSFADE` or `C.FILTER_*`. ⚠ **EVERY KIT
  `VERSION` BUMP IS A CLOSED-FILE EDIT** — four files pin `AUDIO_VERSION` by
  literal and two pin the signal path node by node.
- ⚠ **`_harness.js`**: `{ stub }` rebinds a named top-level function to a no-op;
  `{ spy }` counts calls and runs optional `.before`/`.after` hooks;
  `{ mutate }` throws unless its string is in the build exactly once. ⛔ **A
  function inside `Game`'s closure cannot be reached this way**, `Game.update`
  included. ⚠ **An added `EXPORTS` row is a real decision and a plan's §11 owes
  it a line** — CS014 added ten across two phases and predicted neither.
- ⚠ **TWO TESTS READ coinless-kit's `registry.js`** from `../coinless-kit` and
  each SKIPS LOUDLY without it: `-cs011-p5` at `f0b0eb2`, `-cs012-p3` at
  `e2efed5` (⛔ never `f8d34f3`). ⛔ **No close can carry a skip.**

## Open questions (blocking)

- None.

## Carried tasks

- ✅ **THE `CLAUDE.md` VALVE HAS FIRED ON `### Math and lifecycle`** (Paul's
  direction, 2026-09-20, its own commit after the CS014 close). The section went
  **7.0 KB → 5.4 KB** and the file **49,524 → 47,903 bytes**, ⛔ **with no rule
  deleted**: the reasoning behind the Jump's phase, `aloft`, the Mimic's
  two-state budget and `MimicShot`'s `speed()` moved to a new
  `RATIONALE.md#entity-phases`, and the four blocks name it. ⚠ **What is left in
  that section is RULE, twelve invariants, and the valve cannot shrink it
  further** — the next reduction there is Paul deciding a rule has expired, not
  a relocation. ⚠ **`## Code map` is 4.5 KB and is the other over-size section**,
  and `log/CS014.md` records why the valve does not fire on it: it is entirely
  rule with no reasoning to move, and relocating it would delete the read-order
  skeleton every session needs. ⛔ The ⚠ SETTLED rule still forbids a standing
  sweep: the valve fires on an EDIT.
- ⚠ **~2.1 KB of headroom under the 50 KB ceiling.** ⛔ A CS015 phase that
  cannot fit its rule fires the valve on the section it is editing first.
- ⚠ **`DECISIONS.md` has no row for CS012's sixteen calls (O1–O16) or CS014's
  nine (RF1–RF9).** CS010's, CS011's and CS013's are indexed there, so the index
  is incomplete. ⛔ Found by CS014 P3's review; ⛔ **a CLOSE phase may not write
  that file** (`CLAUDE.md`'s session table), so it is Paul's or a planning
  session's.
- ⛔ **Paul, when he wants it: `drive`'s lab session** (PASS marks, tiers, gains,
  tempo). It ports as its own commit and rewrites `test-cs012-p1.js`'s "no tier"
  and "no audition mark" assertions in place. Nothing waits on it.
  ⚠ `drive` is untiered, unmarked and unheard, and ⚠ **`ringTake` / `ringMiss`,
  the Surger tone and the Warden's fuse have no lab audition over it.**
- ⚠ **Paul replaces `C.CREDITS_LINES` before ship.**
- ✅ **Both boards are registered and deployed** (coinless-kit `e2efed5`):
  `vector-vortex` and `vector-vortex-overdrive`, `maxMetricPerSecond` **150,000**,
  the same seven `statsFields`. ⛔ Never pin `f8d34f3`. ⚠ The deployed fields
  cannot be read remotely. ⛔ **Read the Worker's registered `statsFields` before
  sending a stats key**, and ⛔ `C.GAME_ID` is the SAVE keyspace, never a board id.
- ⛔ **CS017 owes three measurements nobody has made**: the Mimic's probation
  verdict (GDD §21 #6), GDD §17's performance budget naming "8 shots" where
  Spread's cap in force is **24**, and `drawShot()` allocating an array per call
  (F4). ⛔ **The seven debug spawn actions ship until CS017** (Paul's H5 call).
- Backport kit-input (0.8.0), kit-menu (0.1.0), kit-fx, kit-audio (**0.4.0**) and
  kit-leaderboard (0.2.1, `lib/`) to coinless-kit — each a separate manual step.
  `createScores` (`src/22-meta.NOTES.md`) is kit-scores' draft.
- ⚠ **`CLAUDE.md` carries no telemetry rule**; whether it earns one is Paul's.
  ⛔ **`TELEMETRY_FIELDS` is frozen at 29 columns and `telemetry` at v1**, and it,
  `TELEMETRY_KINDS`, `telemetryRow()` and the version move together.
- ⚠ **Unowned, and CS014 moved none of them:** the pad-only silence, the VOICE
  bus, the Surger tone's 1.106 sample peak, the whole enemy / menu palette and
  the HUD sizes, `tools/glow-lab.html`'s visual audition, F1 and F2, and whether
  the headroom gate should also bound the limiter's INPUT (Paul's call).
  ✅ **The Dive's visual leaves this list** — it was the oldest thing on it, open
  since CS006.

## Next up — CS015 planning

⛔ **A PLANNING session**, writing no code (`CLAUDE.md` rule 3a) and ending in
`PLANNED-FEATURES-CS015.md` and `IMPLEMENTATION-PHASES-CS015.md`, committed. The
row is **achievements: the id table written once against the whole game, local
only, monotonic tiers and UTC ISO weeks** (GDD §15.5, §17 item 10; ROADMAP §21
#4's "the evaluator returns a payload-shaped object from day one"). ⛔ Read
"What CS015 must act on" first — ⛔ **an `id` is SAVE DATA and is never
renamed**, so the table is written against a FINISHED game, which is why Paul
moved it here (M4). ⛔ **Measure anything measurable**, and ⛔ **every claim is
marked MEASURED or PREDICTED.**
