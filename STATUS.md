# Vector Vortex — STATUS
Version: 0.0.11 · Changeset: **CS015 P2 shipped 2026-09-20** · next: **CS015 P3** ·
Wells: 16/16 · Enemies: 6/6 Classic, 3/3 Overdrive · Tracks: 3/5 · Tokens: 5/5 effects

## Phase ledger

⛔ **CS014's ledger, reasoning, mutation records and the CLOSE REVIEW moved to
`log/CS014.md`.** This file is reset for CS015 and carries only what a CS015
phase must act on. ⛔ `log/` is not session context: pull one file in only when a
question genuinely needs project history, and say that you did.

| Phase | Landed |
|---|---|
| **CS015 P1** | the achievements module, the store, the week — `createAchievements()`, `C.ACHIEVEMENTS`, `achievements` v1 declared and in `OWN_KEYS`, the UTC ISO week and the rotation |
| **CS015 P2** | the facts, the seats and the gate — thirteen `tally` counters, `tallyKill()` and the Carrier `brood`, `Meta.clearEdge()` and the run-end seat, `Meta.eligible()`'s third caller |

**P1.** `20-achievements.js` is `createAchievements({ defs, load, save, now })`,
kit-achievements' draft, with `src/20-achievements.NOTES.md` beside it. ⛔ **It
names no `state`, no `C` and no game global**, proved by a comment-stripped scan
of its slice of the built file — ⛔ **cut at the first kit banner, because that
banner is a rule of DASHES and the equals-signs module scan runs 20's slice
straight through the three inlined bodies** (55 KB). `C.ACHIEVEMENTS` is
`{ perWeek, lifetime, weekly }`, handed over as `defs` — `createScores`' seam.
⚠ **Its rows are PLACEHOLDERS, every id prefixed `_`, and P3 replaces them
whole.** `achievements` is declared v1 with ⛔ **no `migrate`**, and is in
`OWN_KEYS`. The eight week boundaries and the mutation records: `log/CS015.md`.

**P2.** `state.tally` is **21 fields**: P2 added THIRTEEN, each beside the
counter or event already at its place, ⛔ **write-only, and nothing branches on
one.** Two are BITMASKS — `wellsSeenMask`, `tokenKindsMask` — because "distinct
wells" and "all five kinds" need a memory; Meta hands them over as bit COUNTS.
⛔ **`tallyKill(state, e)` is called on its OWN LINE above four kill lines**, so
the five kill lines' pinned text is untouched; the jump strike takes its counter
beside `tally.kills++`. ⛔ **A Carrier's two children share one `brood`** and the
split counts on the second destroyed, only when both were spawned. The seats are
`Meta.clearEdge()` (after the bonuses and `noteCleared()`) and `Meta.runEnded()`,
which ⛔ **reads `ok`, the local — `run` is already null there**; `Meta.eligible()`
gained a third caller and no change. MEASURED: **76 files green, zero skips**, no
baseline moved, and a four-run played session hashes identically against both
seats mutated out and against all thirteen counters written out. ⛔ **One closed
file was repaired — see Test hazards.** `log/CS015.md`.

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (25 modules + 3 inlined kit,
  **787.8 KB**, 806,711 bytes); `MANIFEST` is checked both ways and a missing
  `KIT_INLINE` file fails the build.
- `node scratchpad/run-all.js`: **76 files, all green, zero skips.**
  ⚠ **`run-all.js` has a 120 s PER-FILE timeout and machine load can trip it.**
  ⛔ A timeout is not a red — re-run the file alone before treating it as one.
- **CS001–CS014 are closed; each has a `log/CS0##.md`.** ⛔ **The Classic roster
  is complete at six and GDD §6.2's variants at three**; ⛔ **all five of GDD
  §4.5's death conditions are live in BOTH modes**, and every hazard since has
  been a new SHAPE of one of them.
- **CS012–CS014 shipped OVERDRIVE WHOLE** (2026-09-17 … 09-20): the mode flags
  and the combo, the five tokens, the Warden and the Mimic, the ring flight and
  the Dive's visual. ⛔ What a phase must still obey is in the two sections
  below, not here; the narrative is `log/CS012–014.md`.
- ✅ **GDD §19's OVERDRIVE ROW IS MET, every item.** ⚠ **Audio's "filter sweep
  audible end to end" is the document's one remaining ✗** and it is Paul's D6:
  the highest reading ever measured is **0.6860** (CS013 P5), and a longer
  release beat reads *less* danger, not more.
- ⛔ **TWELVE SOAKS, EACH PROVING A DIFFERENT THING** — `-cs003-p5` …
  `-cs007-p5`, then the front-door pairs `-cs008-p8`, `-cs009-p6`, `-cs010-p5`,
  `-cs011-p6`, `-cs012-p6`, `-cs013-p5`, `-cs014-p3`. ⛔ **CS015's is a
  THIRTEENTH file, never a widened closed one.**
- ⛔ **`test-cs006-p5.js` carries the count-based no-draw rule**, a function of
  the LEVEL: `spawnEnemy`'s 1 plus `pickSpawnLane`'s `[1, C.SPAWN_LANE_TRIES]`.
- ⛔ **`GOLDEN_LANES`' first SIXTEEN entries are the ORIGINAL `9ebd27b`
  recording** (`test-cs004-p1.js`), held by a prefix assertion; CS008 P1
  appended `2, 5`. ⛔ **Any other move is a defect, not a baseline.**
- ⛔ **`P1_DETERMINISM_HASH` is the one baseline that moves, and it is
  CROSS-FILE** (`test-cs006-p2.js` runs `test-cs005-p5.js` in a child process).
  It stands at **1229033515**, unmoved through CS009–CS015 P2. ⛔ Re-record once
  per change, one named cause at the assertion.
- ⛔ **On a boundary rider the LATTICE is where §17 item 3 stands, not the speed
  bound** (`RATIONALE.md#boundary-lattice`).
- ⛔ **`AudioSys.ctx` is null until a key, click or lifted touch**, and every
  audio entry point returns early on it. `buildGame({ audio: true })` installs
  the recording fake. ⛔ **A gesture is a DOM event**: `G.input.keyDown()` is not
  one, so a test wanting audio attaches `fakeTarget()`s and fires `keydown`.
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
  the set. ⛔ **A new `SFX_KILL_PITCH` voice is a THREE-file edit**: `C`, BLOCK
  SFX and the `PITCH_*` tables. ⛔ **`C.SFX` is 27 events, `C.SFX_KILL_PITCH` 11
  voices**; a new event owes the lab a brief, an A label, 1–2 alternates and an
  in-context sequence, and is ONE line starting `    name:`. **Four** lab copies
  of `C` are pinned to the build (`test-cs010-p3.js`, `-cs014-p2.js`'s `LAB.dive`).

## Known issues

### What CS015 must act on

⛔ **CS015 is ACHIEVEMENTS (Paul's M4), so it is the STORE and a SCREEN.** The
hazards below block, in that order; reasoning is in `log/CS0##.md`.

- ✅ **THE MODULE, THE STORE AND THE SEATS ARE SHIPPED (P1, P2).** ⛔ **What P3
  inherits:** `evaluate(facts)` takes ONE flat object, reads `facts.mode` and
  each row's `fact` name, ⛔ **skips a fact that is not a finite number** — a row
  naming a fact nobody builds silently unlocks nothing rather than throwing —
  and ⛔ **writes only when something unlocked.**
- ✅ **A "LIFETIME" ROW MEANS ONE RUN, AND `achievements` STAYS v1** (Paul,
  2026-09-20, after P2). ⛔ **No totals, no v2, no `migrate`**: `lifetimeTiers`
  is monotonic, so a per-run threshold over that store already IS "your best run,
  banked" — GDD §15.5's *lifetime* is the store that never resets, against
  *weekly*. ⛔ **P3 retunes the nine tiered rows to PER-RUN readings**, and
  ⚠ **tier 3 sits near 50–60 % of what a probe reached, never AT it**: a top tier
  set at a bot's best is what dropped `purge_wide`. ✅ **Displayed names may be
  reworded to read true** ("MOST WELLS IN A RUN"); ⛔ **the 23 ids are A8's,
  unchanged.** ⚠ Real totals stay possible later as an ADDITIVE v2 — new
  cumulative ids, these keeping their meaning.
- ✅ **THE TWENTY WEEKLY ROWS LAND IN P3, THEIR FACTS BUILT IN `facts()`** (Paul,
  same): ⛔ **no new `tally` field, no module change, and P3 is still alone in its
  session.** Three shapes, all arithmetic in `22-meta.js`: a PER-WELL window is
  ⛔ **the delta since the last clear edge** — `tally` is monotonic within a run
  and the edge fires once per well; a CONJUNCTION ("level 20 from Start Depth 1")
  and an AT-MOST or WITHOUT row ("one life left", "no Thorn death") are ⛔ **0/1
  facts with `at: 1`**, because a row is ONE fact `>=` ONE threshold. ⛔ **The
  run-end seat OMITS the per-well facts** — a non-finite fact is a skip, so a
  stale window cannot unlock anything. ⚠ **"Take four rings in one dive" is the
  one row with no fact**: reword it to the full set (`ringSetsTaken`) or report
  it. ⚠ **Adding weekly rows LATER reshuffles which five a week shows** (the walk
  reads the pool's length), which is why all twenty land at once.
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
  `update()` on a menu step, and `levelRecord(mode)` reads storage on every call.
- ⛔ **A DEFECT IN GDD §0: THERE IS NO ROW FOR AN ACHIEVEMENTS SCREEN** (CS015
  planning; recorded rather than worked around). MEASURED at `b92da55`: §10.5's
  screen table has no ACHIEVEMENTS row, §0's §10.5 row names every screen and
  names none, and §15.5 specs no surface. ⚠ **A1 is ANSWERED (a screen off the
  title, no toast)**, so ⛔ **P3 edits §10.5, §15.5 and §0's §10.5 row together.**
- ⛔ **THE MENU SHAPES A SCREEN HAS TO FIT INTO**: the title has **four rows**,
  game over **three lines**, and ⛔ **OPTIONS HAS TEN ROWS WITH A SEVEN-ROW
  WINDOW** — a row goes before BACK, never above TELEMETRY. ⛔ **SCORES' rows are
  MODE, VIEW (module only), the entries, BACK**, rebuilt on entry / MODE / VIEW /
  a board's answer and never in `draw()`; ⛔ **the entry mode is the last run
  STARTED this session** (`lastRunMode`). ⛔ **NAME steps in place of the menu
  model**; ⚠ there Space, Z and X type.
- ⛔ **NINE TEXTS IN `22-meta.js`, `23-main.js` AND `lib/kit-leaderboard/` ARE
  PINNED BY A CLOSED CS011 `mutate`** — grep `test-cs011-*.js` for `mutate:`
  before editing a line in those three files. ⛔ **kit-leaderboard cannot be
  inlined** (`test-cs009-p1.js:508`, `test-cs002-p1.js`).
- ⛔ **`Game.reset()` restores the controls and the sound rows, writes nothing,
  and leaves the screen on play**; a RELOAD test builds again over the same
  `Map`. ⛔ **A chosen level is reached from START DEPTH**, never `w`.
- ⛔ **`progress` IS v2 AND PER MODE**: `noteCleared()` writes the pair and
  `levelRecord(mode)` defaults to `state.mode`; the mode list is
  `Object.keys(C.MODE_FLAGS)`, so ⛔ **a feature is a FIELD IN THE ROWS, never a
  new top-level mode key.**

### The Dive, the ring flight and the entities, as shipped

- ⛔ **`startDive()` DOES FIVE THINGS** (GDD §5, §14.5): `resetDive()` — ⛔ which
  also EMPTIES `state.dive.rings` — the board filtered to `anchored` survivors,
  `resetJump()`, `resetTokens()` (⛔ so **no Ward can absorb the Thorn strike**)
  and `layRings()`, ⛔ the set's ONE way in, BELOW the other four. ⛔ **A Warden
  and a `MimicShot` are NEVER Dive survivors**, and ⛔ **a REPEATED DIVE RE-LAYS
  THE SET.**
- ⛔ **BOTH DIVE CAPS HAVE ONE READER EACH, COUNTED ON CODE LINES ONLY**
  (`test-cs006-p3.js`): `C.DIVE_TIME_OD` in `diveTime()`, `C.DIVE_RINGS_MAX` in
  `layRings()`. ⛔ **`diveTime()` reads the FLAG, never `state.mode`.**
- ⛔ **A DIVE PAYS EXACTLY ONE THING AND IT IS A RING**, asserted per step in
  FIVE files (`-cs012-p4`, `-p6`, `-cs013-p2`, `-p5`, `-cs014-p3`), each reading
  `C.RING_POINTS` off the build; it builds nothing, rolls nothing and spends
  **zero draws**. ⛔ **ITEM 8 ALSO PRICES A BOUNTY PER STEP** in three of them.
- ⛔ **`diveDrawDepth()` IS THE RENDERER'S WHOLE KNOWLEDGE OF THE DIVE** and the
  rest of that rule is `CLAUDE.md`'s. ⛔ **A soak that hashes must call
  `frame()`, not `update()`.**
- ⚠ **`RING_POINTS` 100, `RING_ARC_LANES` 1.5, `RING_LANE_STEP` 0.25 and the
  five visual values are PROVISIONAL**; ⛔ **`DIVE_TIME_OD` 4.0 and
  `DIVE_RINGS_MAX` 6 are NOT** (GDD §14.5's hard cap; ⛔ a ceiling may only come
  DOWN). ⛔ **The lattice is a function of the WELL and constants alone** — no
  draw, no `heat()`, no `state.level`, ⛔ not the craft's lane — and ⛔ **the arc
  walk uses `laneHop()`.**
- ⛔ **FOUR KILL SITES AND FIVE KILL LINES, ALL IN `09-collision.js`**
  (`:159`, `:284`, `:495`, `:508`, `:560`), and CS014 added none. ⛔ **A phase
  that edits a kill line repairs `test-cs012-p4.js`'s six `COMBO_OUT` strings,
  its two `mutantRed` shot-kill strings, `-p6.js`'s, and `test-cs014-p1.js`'s
  count of four.**
- ⛔ **AN `aloft` ENTITY IS INVISIBLE TO THE SHOT PASS AND VISIBLE TO EVERYTHING
  ELSE** — `collideSkimmer()`, `purgeTarget()`, `respawnSkimmer()`,
  `dangerInputs()`, `threatCount()` and `wellCleared()` read it as an ordinary
  entity at depth 1. ⛔ **A new reader that excludes one says so itself.**
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
  `mimicShot` and `weaverBolt` are kinds with no roster row, and the three
  Carrier variants are three rows behind one roster entry.
- ⚠ **Unowned, none reachable by the suite's drivers:** a second Purge prefers a
  bolt or a reflection above 0.95 and pays 0 (PREDICTED); a run STARTING past 99
  gets the modulo well and no band roll (unreachable at `START_DEPTH_CAP` 81);
  a rim Vaulter — ⚠ and an aloft Warden — hunts the CONTINUOUS lane.
  ⚠ **`C.LIVES_MAX` LEAVES THIS LIST — it IS reachable** (MEASURED, CS015
  planning): a long probe held **6** lives in five of seven sessions. ⛔ **The
  difference is run LENGTH, not the driver.** ⚠ **A biggest-Purge of SIX is
  genuinely unreachable**: best of 289 uses is **4**.

### Test hazards

- ⛔ **A CLOSED OVERDRIVE PLAY AT L11+ OWES ITS DRIVER FOUR THINGS** (CS013 P3–P5,
  CS014 P3; MEASURED): jump at anything `aloft`; **never target** a `MimicShot`
  and steer away within a lane; **go to** a hovering token; and ⛔ **steer to a
  ring in reach during a dive** — "in reach" derived from the depth model and
  `C.KEY_SPEED_MAX`, never a constant. ⛔ Each is a no-op where the thing does
  not exist, which keeps a Classic pair bit-identical. ⛔ **Repairs are the
  DRIVER, never the build, a lowered level or a relaxed assertion.**
- ⛔ **A DIVE'S LENGTH IS A PROPERTY, NEVER A STEP COUNT** (`1/60` is not
  binary). ⛔ **A run that ends inside a dive leaves `dive.active` TRUE until the
  RESTART press**, so a "the dive ended" detector gates on the PRE-STEP screen.
  ⛔ **`state.tally` is re-minted by `startGame()`** — a multi-run session
  accumulates per step or reads the last run's tally alone.
- ⛔ **A KILL SITE'S OWN READING IS READ AT THE CALL, NOT AFTER THE STEP**, and
  ⛔ **`state.dive` the same**: the dive's END is `nextWell()` → `enterWell()` →
  `resetDive()` on ONE step, so rings and timer are snapshot BEFORE it.
- ⛔ **A CLOCK READ IS NOW A MOVER, AND CS015 P2 SPENT THAT MOVE** (MEASURED,
  and ⛔ **the one closed-file edit of P2**, which plan §11 did not predict):
  `Achievements.evaluate()` reads the injected clock once per call and the
  clear-edge seat calls it on every clear, so a soak that fakes `Date.now` per
  CALL and RESTARTS on a time seed plays a different session. `test-cs013-p5.js`
  lost its *a Ward absorbed a hit and broke* non-vacuity — ⛔ **a coincidence, 2
  breaks in 101,330 frames, and twelve seeds and six ticks all read 0.** ⛔ **The
  DRIVER was repaired, never the build or the assertion**: shelled, it now steers
  to the deepest contact killer AND RELEASES FIRE, because a held trigger lets
  the rim sweep take the hit first (11 breaks after). ⛔ **A phase that adds a
  clock reader moves those sessions again.**
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
  BEFORE asserting red. ⚠ **A closed test may pin the literal text of a line a
  later phase changes** — ⛔ **pin only the ARGUMENT the claim is about.**
- ⛔ **A TEST THAT BOUNDS `state.shots` READS THE CAP IN FORCE off
  `state.powers`** (GDD §17 item 4); MEASURED, 24 IS reached.
- ⛔ **A STAGED DEATH IN AN OVERDRIVE FIXTURE MUST CLEAR `state.powers.ward` OR
  SET UP TWO HITS** — every death path meets `killSkimmer()`'s second return.
- ⛔ **`state.shots.push` CANNOT BE INTERCEPTED to see a new shot** (MEASURED):
  `updateShots()` filters into a NEW array before firing; `state.tally.shotsFired`
  is honest. ⚠ `state.enemies` is the opposite — filtered AFTER both passes.
- ⛔ **MODE IS `OVERDRIVE`, THEN `CLASSIC`, BOTH ENABLED** — the row ORDER is
  GDD §13's default highlight. ⛔ **A driver wanting a Classic run steps ONE row
  down first**; ⛔ **START DEPTH is built for `pendingMode`, never `state.mode`.**
- ⛔ **A REPLAY THAT OUTLIVES ITS GAME OVER MEETS A LIVE MENU** — a scripted Fire
  there RESTARTS on a time seed and a Purge quits, so stop pressing at the stop,
  and ⛔ **a driver starting at the title spends two live steps first.**
  ⛔ **A FIRE-HOLDER HAS NO DEATH PATH ON LEVELS 1–4**, jumping or not, and
  ⛔ **a driver that HOLDS FIRE never spends a Ward** (CS015 P2): the rim sweep
  takes the contact killer first. ⛔ **A MENU PRESS IS AN EDGE** — release every
  key the driver holds before touching one.
- ⛔ **`test-cs008-p4.js` scans the WHOLE built file, comments included**: no
  `fillRect`/`strokeRect`, one `.fillText(`/`.strokeText(` site.
  `test-cs002-p3.js` bans `ctx.fill` in `14-render-entities.js`;
  `test-cs002-p1.js` bans `e.key`, `.touches`, `getGamepads`, `clientX` and
  `addEventListener` outside `04-input.js`, and `C.`/`state.` inside it.
  ⚠ **Strip comments before grepping a function's source**, and ⛔ **GDD §14.1's
  two tables stay two — `collectToken()` may not name `C.TOKEN_WEIGHTS`**
  (`test-cs013-p1.js`; CS015 P2 moved its token-kind mask to the PICKUP for it).
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
- ⚠ **TWO TESTS READ coinless-kit's `registry.js`** and each SKIPS LOUDLY
  without it: `-cs011-p5`, `-cs012-p3`. ⛔ **No close can carry a skip.**

## Open questions (blocking)

- None. ✅ **P2's two — what "lifetime" means, and where the weekly rows' facts
  come from — were put to Paul and answered the same day**; both answers are in
  "What CS015 must act on" above, and the reasoning is in `log/CS015.md`.

## Carried tasks

- ✅ **`CLAUDE.md` WAS COMPACTED, 47,919 → ~34.6 KB** (Paul, 2026-09-20, its own
  commit), ⛔ **with no rule deleted** — reasons to `RATIONALE.md`, history to
  `log/`, a fact stated once. ⚠ The valve and the ban on standing sweeps stand.
- ✅ **A CLOSE PHASE NOW WRITES `DECISIONS.md` TOO** (Paul, 2026-09-20). ⛔ **The
  changeset's calls are indexed AT THE CLOSE**, one line each — ⛔ **a pointer,
  never the writeup**; `DECISIONS.md`'s header states the form.
- ✅ **`DECISIONS.md`'S INDEX IS COMPLETE** — Paul backfilled CS012's O1–O16 and
  CS014's RF1–RF9 (`4bfd169`), and an audit found CS007–CS014 all indexed;
  ⚠ CS001–CS006 owe no row. ⛔ **CS015's row is the CLOSE's.**
- ⛔ **Paul, when he wants it: `drive`'s lab session** (PASS marks, tiers, gains,
  tempo). Its own commit; it rewrites `test-cs012-p1.js`'s "no tier" and "no
  audition mark" assertions in place. ⚠ `drive` is untiered and unheard, and
  ⚠ `ringTake` / `ringMiss`, the Surger tone and the Warden's fuse have no lab
  audition over it. Nothing waits on it.
- ⚠ **Paul replaces `C.CREDITS_LINES` before ship.**
- ✅ **Both boards are registered and deployed** (coinless-kit `e2efed5`; ⛔ never
  pin `f8d34f3`), same seven `statsFields`. ⛔ **Read the Worker's registered
  `statsFields` before sending a stats key**; ⛔ `C.GAME_ID` is the SAVE keyspace,
  never a board id.
- ⛔ **CS017 owes three measurements**: the Mimic's probation verdict (GDD §21
  #6), GDD §17's budget naming "8 shots" where Spread's cap is **24**, and
  `drawShot()` allocating per call (F4). ⛔ **The seven debug spawn actions ship
  until CS017** (Paul's H5).
- Backport kit-input (0.8.0), kit-menu (0.1.0), kit-fx, kit-audio (**0.4.0**) and
  kit-leaderboard (0.2.1, `lib/`) — each a separate manual step. `createScores`
  is kit-scores' draft, `createAchievements` kit-achievements'.
- ⚠ **`CLAUDE.md` carries no telemetry rule**; whether it earns one is Paul's.
  ⛔ **`TELEMETRY_FIELDS` is frozen at 29 columns and `telemetry` at v1**, and it,
  `TELEMETRY_KINDS`, `telemetryRow()` and the version move together.
- ⚠ **Unowned, and CS015 has moved none of them:** the pad-only silence, the
  VOICE bus, the Surger tone's 1.106 sample peak, the enemy / menu palette and
  the HUD sizes, `tools/glow-lab.html`'s visual audition, F1 and F2, and whether
  the headroom gate should bound the limiter's INPUT (Paul's call).

## Next up — CS015 P3

✅ **CS015 IS PLANNED AND ANSWERED** (2026-09-20,
`PLANNED-FEATURES-CS015.md` + `IMPLEMENTATION-PHASES-CS015.md`, four phases).
✅ **Paul answered all twelve calls (A1–A12) and took EVERY recommendation**, with
one qualification on A8. ⛔ **A build phase builds the answer in §0's column and
does not re-open it**; the B and C branches are dead. ✅ **A6, A7, A11 and A12 are
BUILT** — their shape is GDD §15.5's, not this file's, from here on.

⚠ **This is the first changeset since CS008 whose main risk is a decision that
cannot be revised, rather than a mechanism that can** — ⛔ **an achievement `id`
is SAVE DATA and is never renamed**, so A8's table is written once, which is why
Paul moved it out of CS011 (M4). ⛔ **P3 is alone in its session for that
reason.**

⛔ **THE ANSWERS STILL TO BUILD.** A1 a SCREEN off the title, no toast. A5 rows
MODE-TAGGED (the tags are the TABLE's, so they land with it). A8 ⛔ **23 lifetime
rows plus the twenty weekly.** A10 one new `C.SFX` event, `unlock` (27 → 28).
✅ **A2, A3, A4 and A9 are BUILT** — the facts, the seats, the gate; an unlock
pays nothing.

⛔ **P3 BUILDS ITS ROWS AGAINST THE SHIPPED FACTS**, which are `mode`, `level`,
`score`, `startDepth`, `lives`, `comboPeak` and every `tally` counter, the two
masks as `wellsSeen` and `tokenKinds` (`facts()`, `22-meta.js`). ⛔ **A fact that
is not there is a SKIP, so a row naming one silently unlocks nothing** — assert
per row, as the prompt already says.

⛔ **A8's qualification: `purge_wide` IS DROPPED** — MEASURED unreachable (best
of 289 Purge uses is **4**, not six), and lowering it would set a threshold from
what a bot reached. ⚠ **`mimic_kill` STAYS** and its probation risk is accepted:
if CS017 cuts the Mimic, one id is unearnable for new players and nothing else
breaks. ⚠ **`carrier_split` is the one lifetime row with NO measurement behind
it**, and ⛔ **the twenty weekly rows are a STARTING list that P3 settles,
MEASURED** — a row no board reaches is reported, never shipped and never quietly
lowered.

⛔ **A threshold is NOT save data; only the `id` is.** A later changeset may
retune any tier.

✅ **THE VOCABULARY SCAN IS NOW A SUBSTRING SCAN** (Paul, 2026-09-20, after P1):
`test-cs008-p6.js` catches a banned word glued on by `_` or camelCase, and only
`webkit` is excepted from "web"; indexed in `DECISIONS.md`. P3 still eyes
every id and displayed name.
