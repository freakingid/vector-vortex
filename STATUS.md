# Vector Vortex — STATUS
Version: 0.0.11 · Changeset: **CS015 P3 shipped 2026-09-20** · next: **CS015 P4** ·
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
| **CS015 P3** | the id table and the surface — 23 lifetime + **18** weekly rows, the per-well window and the seats' split facts, the ACHIEVEMENTS screen, the `unlock` sound |

**P1.** `20-achievements.js` is `createAchievements({ defs, load, save, now })`,
kit-achievements' draft, with `src/20-achievements.NOTES.md` beside it. ⛔ **It
names no `state`, no `C` and no game global**, proved by a comment-stripped scan
of its slice of the built file — ⛔ **cut at the first kit banner, because that
banner is a rule of DASHES and the equals-signs module scan runs 20's slice
straight through the three inlined bodies** (55 KB). `C.ACHIEVEMENTS` is
`{ perWeek, wellShotPar, lifetime, weekly }`, handed over as `defs` —
`createScores`' seam. `achievements` is declared v1 with ⛔ **no `migrate`**, and
is in `OWN_KEYS`. The eight week boundaries: `log/CS015.md`.

**P2.** `state.tally` is **21 fields**: P2 added THIRTEEN, each beside the
counter or event already at its place, ⛔ **write-only, and nothing branches on
one.** Two are BITMASKS — `wellsSeenMask`, `tokenKindsMask` — handed over as bit
COUNTS. ⛔ **`tallyKill(state, e)` is called on its OWN LINE above four kill
lines**, so the five kill lines' pinned text is untouched; the jump strike takes
its counter beside `tally.kills++`. ⛔ **A Carrier's two children share one
`brood`** and the split counts on the second destroyed. The seats are
`Meta.clearEdge()` (after the bonuses and `noteCleared()`) and `Meta.runEnded()`,
which ⛔ **reads `ok`, the local — `run` is already null there**. MEASURED: no
baseline moved, and a four-run played session hashes identically against both
seats mutated out and against all thirteen counters written out. `log/CS015.md`.

**P3.** ⛔ **THE IDS ARE SAVE DATA FROM THIS COMMIT.** `C.ACHIEVEMENTS` is A8's
**23 lifetime rows** (nine tiered) and an **18-row weekly pool**, `perWeek` 5.
⛔ **Every row is MEASURED reachable PER ROW** (`test-cs015-p3.js`'s `REACH`:
four front-door passes, 40,000 steps each, seven mode/Start-Depth pairs);
`carrier_split` reaches **259**. ⛔ **Two of plan §9's twenty weekly rows have NO
FACT and were REPORTED, not shipped** (below). ⛔ **No new `tally` field, no
module change.** The surface is a SCREEN off the title and off OPTIONS, SCORES'
shape, ⛔ **no HUD rectangle**; one new SFX event, `unlock` (27 → 28), one seat.
MEASURED: **77 files green, zero skips**, no baseline moved. ⛔ **Five closed
files were edited — three predicted, two not** — see Test hazards. `log/CS015.md`.

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (25 modules + 3 inlined kit,
  **808.0 KB**); `MANIFEST` is checked both ways and a missing `KIT_INLINE` file
  fails the build.
- `node scratchpad/run-all.js`: **77 files, all green, zero skips.**
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
  `-cs007-p5`, then `-cs008-p8`, `-cs009-p6`, `-cs010-p5`, `-cs011-p6`,
  `-cs012-p6`, `-cs013-p5`, `-cs014-p3`. ⛔ **CS015's is a THIRTEENTH file.**
- ⛔ **`test-cs006-p5.js` carries the count-based no-draw rule**, a function of
  the LEVEL: `spawnEnemy`'s 1 plus `pickSpawnLane`'s `[1, C.SPAWN_LANE_TRIES]`.
- ⛔ **`GOLDEN_LANES`' first SIXTEEN entries are the ORIGINAL `9ebd27b`
  recording** (`test-cs004-p1.js`), held by a prefix assertion; CS008 P1
  appended `2, 5`. ⛔ **Any other move is a defect, not a baseline.**
- ⛔ **`P1_DETERMINISM_HASH` is the one baseline that moves, and it is
  CROSS-FILE** (`test-cs006-p2.js` runs `test-cs005-p5.js` in a child process).
  It stands at **1229033515**, unmoved through CS009–CS015 P3. ⛔ Re-record once
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
- ⚠ **SETTLED — MUSIC IS STRUCK, NEVER SWELLED** (Paul, 2026-09-16). ✅ The lab
  picks are ported for `title` and `pulse`; ⚠ `pulse` loops at 72 s, `drive` 62.6.
- ⛔ **Read GDD §6.5 before adding an entity.** NINE contract fields (plus
  `points()`), the wiring points, the Dive — and ⛔ **neither a token nor a RING
  is on that table** (GDD §14.1's T1, §14.5's RF1): no contract field, no
  `ENEMY_KINDS` row, its own home, its own wiring.
- `tools/music-lab.html` and `tools/sfx-lab.html` are the porting sources for
  `17-audio-tracks.js` and `C.SFX`, bound to the build by text identity;
  `well-lab` (⛔ the visual audition has not happened) and `feel-lab` complete
  the set. ⛔ **A new `SFX_KILL_PITCH` voice is a THREE-file edit**: `C`, BLOCK
  SFX and the `PITCH_*` tables. ⛔ **`C.SFX` is 28 events (CS015 P3's `unlock`),
  `C.SFX_KILL_PITCH` 11
  voices**; a new event owes the lab a brief, an A label, 1–2 alternates and an
  in-context sequence, and is ONE line starting `    name:`. **Four** lab copies
  of `C` are pinned to the build (`test-cs010-p3.js`, `-cs014-p2.js`'s `LAB.dive`).

## Known issues

### What CS015 must act on

⛔ **CS015 is ACHIEVEMENTS (Paul's M4).** Reasoning is in `log/CS015.md`.

- ✅ **THE MODULE, THE STORE, THE SEATS AND THE TABLE ARE ALL SHIPPED.**
  `evaluate(facts)` takes ONE flat object, ⛔ **skips a fact that is not a finite
  number** and ⛔ **writes only when something unlocked.**
- ✅ **THE ID TABLE IS LANDED AND IS SAVE DATA (P3).** ⛔ **23 lifetime ids and
  18 weekly ones are never renamed**; a threshold, a `name` and a `note` are
  NOT save data and any changeset may move one. `achievements` stays **v1** —
  "lifetime" is one run banked, because `lifetimeTiers` is monotonic. ⚠ Real
  totals stay possible later as an ADDITIVE v2, new ids beside these.
- ✅ **PLAN §9's TWO UNSHIPPABLE WEEKLY ROWS GO IN BEFORE SHIP** (Paul,
  2026-09-20, after P3): *collect three tokens in one well* and *chip a Thorn to
  nothing in one pass*. ⛔ **Neither had a fact** — `tally` counts token KINDS in
  a bitmask and chips of LENGTH, not tokens collected or Thorns destroyed — so
  each owes ONE new `tally` counter (tokens collected; Thorns destroyed) and one
  pool row, in CS016 or CS017. ⛔ **NOT CS015 P4**, which is the soak and the
  close. ⚠ **Adding them reshuffles which five rows a week shows** (the walk
  reads the pool's LENGTH), which is why it happens while no player has a save —
  ⛔ **after ship it is not free.** ⚠ A counter added at a kill line owes
  `tallyKill()`'s rule and the five pinned kill-line strings.
- ⚠ **`C.ACHIEVEMENTS.wellShotPar` 120 is P3's one invented number**, MEASURED
  over 579 cleared wells (fewest 106, p10 ~121, median ~185). It is a tunable,
  not save data.
- ✅ **THE WEEKLY FACTS ARE BUILT (P3)**, the three shapes in GDD §15.5 and
  `CLAUDE.md`. ⛔ **The window and the streak move ABOVE the eligibility gate**,
  or a bench run hands the next well a doubled delta. ⚠ **Four facts have no
  row** — `deaths`, `purgesSpent`, `shotsFired`, `thornDeaths`, CS007's own —
  and `test-cs015-p3.js` pins that exact set.
- ⛔ **A row-shape change bumps that key's version and supplies a `migrate`** —
  pure, never calling back into the store. `progress` v2's `migrateProgress` is
  the worked example.
- ⛔ **THE BOOT BLOCK RUNS INSIDE THE HARNESS**: `Meta.boot()` writes `profiles`
  in every build. ⚠ **A `Store.set` spy sees only `p0`'s writes**, and ⛔ **`p0`'s
  scope IS the root store**, so a per-profile `remove(key)` there must never name
  a root key.
- ⛔ **NO TELEMETRY WRITE FROM A PLAY STEP**; a settings save runs inside
  `update()` on a menu step, and `levelRecord(mode)` reads storage on every call.
- ✅ **THE GDD §0 DEFECT IS REPAIRED (P3)** — §10.5, §15.5 and §0's §10.5 row.
  ⛔ **The surface is a SCREEN and there is no toast**, off the TITLE (after
  PROFILE) and off OPTIONS (before BACK), ⛔ **no seventh HUD rectangle.**
- ⛔ **THE MENU SHAPES A SCREEN HAS TO FIT INTO**: the title has **five rows**
  (P3's ACHIEVEMENTS is the fifth, after PROFILE), game over **three lines**, and
  ⛔ **OPTIONS HAS ELEVEN ROWS WITH A SEVEN-ROW WINDOW** — a row goes before
  BACK, never above TELEMETRY. ⛔ **A LABEL IS ≤ 20 CHARACTERS BESIDE A
  FOUR-CHARACTER DETAIL AND A SCREEN GETS TWO INFO LINES** (MEASURED, P3).
  ⛔ **SCORES' rows are
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
  a rim Vaulter — ⚠ and an aloft Warden — hunts the CONTINUOUS lane; and a
  biggest-Purge of SIX (best of 289 uses is **4**). ⚠ **`C.LIVES_MAX` LEFT this
  list** — MEASURED reachable; ⛔ **the difference is run LENGTH, not the
  driver**, which is the same trap CS015 P3 hit from the other side.

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
  ⛔ **`state.tally` is re-minted by `startGame()`**, and ⛔ **so are CS015 P3's
  per-well window and clean streak** (`runStarted()`).
- ⛔ **A KILL SITE'S OWN READING IS READ AT THE CALL, NOT AFTER THE STEP**, and
  ⛔ **`state.dive` the same**: the dive's END is `nextWell()` → `enterWell()` →
  `resetDive()` on ONE step, so rings and timer are snapshot BEFORE it.
- ⛔ **CS015 P3 EDITED FIVE CLOSED FILES — THREE PREDICTED, TWO NOT.** Predicted
  (plan §11): `test-cs009-p4.js`'s `EVENTS` + `unlock`, `test-cs011-p3.js:384`
  and `test-cs011-p5.js:375`'s title label lists; ⛔ **the OPTIONS row reddened
  nothing.** ⛔ **Not predicted, and both are CS015's OWN earlier phases
  asserting the PLACEHOLDER table P1 shipped**: `test-cs015-p1.js`'s "every id
  starts `_`" is inverted in place (no id carries the prefix), and
  `test-cs015-p2.js`'s `TABLE` is EMPTIED — the real table names real facts, so
  no mutate is needed to make an unlock possible — with its `SEAT_END` string
  following the seat's new text and its mode-tag assertion restated against the
  SHIPPED tags. ⛔ **A PHASE THAT EDITS EITHER SEAT MOVES `test-cs015-p2.js`'s
  `SEAT_EDGE` / `SEAT_END` AND `test-cs015-p3.js`'s `SEAT_CLEAR` / `SEAT_END`** —
  four mutate strings, and each must be in the build exactly once.
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

- ✅ **`CLAUDE.md` WAS COMPACTED, 47,919 → 34.6 KB** (Paul, 2026-09-20), ⛔ **no
  rule deleted**; it stands at **36,926** bytes after P3. ⚠ The valve and the ban
  on standing sweeps stand.
- ✅ **A CLOSE PHASE NOW WRITES `DECISIONS.md` TOO** (Paul, 2026-09-20): the
  changeset's calls indexed AT THE CLOSE, ⛔ **a pointer, never the writeup.**
- ✅ **`DECISIONS.md`'S INDEX IS COMPLETE** through CS014 (Paul, `4bfd169`).
  ⛔ **CS015's row is the CLOSE's.**
- ⛔ **ONE LAB SESSION COVERS ALL OF IT, when Paul wants it** (his call,
  2026-09-20, after P3): `drive`'s tiers, gains and tempo (PASS marks) **and the
  FIVE unauditioned cues** — `ringTake`, `ringMiss`, the Surger tone, the
  Warden's fuse and ⚠ **CS015 P3's `unlock`**, which ships as candidate A with
  two alternates in the lab ("square bell pair", "triangle step up"). Its own
  commit; it rewrites `test-cs012-p1.js`'s "no tier" and "no audition mark"
  assertions in place. ⛔ **Nothing waits on it**, and ⛔ **a re-pick is ported
  verbatim from the lab, never hand-tuned in `C`.**
- ⚠ **Paul replaces `C.CREDITS_LINES` before ship.**
- ✅ **Both boards are registered and deployed** (coinless-kit `e2efed5`; ⛔ never
  pin `f8d34f3`), same seven `statsFields`. ⛔ **Read the Worker's registered
  `statsFields` before sending a stats key**; `C.GAME_ID` is the SAVE keyspace.
- ⛔ **CS017 owes three measurements**: the Mimic's probation verdict (GDD §21
  #6 — ⚠ and `mimic_kill` is now a shipped id, unearnable for new players if the
  Mimic is cut), GDD §17's budget naming "8 shots" where Spread's cap is **24**,
  and `drawShot()` allocating per call (F4). ⛔ **The seven debug spawn actions
  ship until CS017** (Paul's H5).
- Backport kit-input (0.8.0), kit-menu (0.1.0), kit-fx, kit-audio (**0.4.0**) and
  kit-leaderboard (0.2.1, `lib/`) — each a separate manual step. `createScores`
  is kit-scores' draft, `createAchievements` kit-achievements' (⚠ and its screen
  is the game's wrapper, not the module's).
- ⚠ **`CLAUDE.md` carries no telemetry rule**; whether it earns one is Paul's.
  ⛔ **`TELEMETRY_FIELDS` is frozen at 29 and `telemetry` at v1**, and it,
  `TELEMETRY_KINDS`, `telemetryRow()` and the version move together.
- ⚠ **Unowned, and CS015 has moved none of them:** the pad-only silence, the
  VOICE bus, the Surger tone's 1.106 sample peak, the enemy / menu palette and
  the HUD sizes, `tools/glow-lab.html`'s visual audition, F1 and F2, and whether
  the headroom gate should bound the limiter's INPUT (Paul's call).

## Next up — CS015 P4

✅ **CS015 IS PLANNED AND ANSWERED** (2026-09-20, four phases), ✅ **Paul answered
all twelve calls (A1–A12) taking every recommendation**, and ✅ **ALL TWELVE ARE
NOW BUILT** — their shape is GDD §15.5's and §10.5's, not this file's, from here
on. ⛔ **P4 is the thirteenth soak, the review and the close.**

⛔ **P4 IS A THIRTEENTH SOAK FILE, never a widened closed one** (plan §6): a
front-door session in each mode over a working store and a RELOAD with every
unlock still there; ⛔ **the same session with the seats stubbed out hashing
identically, step by step**; a week roll emptying `weeklyUnlocked` alone;
⛔ **no enumeration read** (`_env.storageReads` 0); zero skips.

⛔ **THE SOAK'S OWN NEW HAZARD (P3): THE SHIPPED TABLE UNLOCKS DURING PLAY.** A
front-door session now writes `achievements` at clear edges and sounds
`sfx("unlock")` there. MEASURED: all twelve closed soaks stayed green, so the
write and the sound move no hash and no audio count — ⛔ **but a soak that spies
storage or counts sounds must expect both.**

⛔ **P4's DRIVER IS `STATUS.md`'s FOUR-CLAUSE L11+ DRIVER**, unchanged, and
⚠ **a driver that HOLDS FIRE and SPENDS THE PURGE cannot reach three rows** —
`week_lean_well`, `week_purge_held` and `purge_saver`'s upper tiers. That is a
property of the driver, not of the rows (`test-cs015-p3.js`'s `REACH` measures
all four passes), so ⛔ **a P4 non-vacuity line about those three needs its own
pass or must not be written.**

⛔ **THE CLOSE:** compresses `log/CS015.md`, resets this file, updates
`ROADMAP.md` and `SKIPPED-PLAYTESTS.md`, flips ⛔ **GDD §19's Meta row off its
last ✗**, and ⛔ **indexes CS015's twelve calls in `DECISIONS.md`, one line
each** — a pointer, never the writeup, ⛔ **the two reported weekly rows too.**

✅ **THE VOCABULARY SCAN IS A SUBSTRING SCAN** (Paul, 2026-09-20; only `webkit`
is excepted from "web"), and ✅ **P3 checked every id, name and note BY EYE and
wrote that check into `test-cs015-p3.js` as an assertion over the table**, in
both the substring and the `\b` form.
