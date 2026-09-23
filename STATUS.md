# Vector Vortex — STATUS
Version: 0.0.13 · Changeset: **CS017 planned 2026-09-23** · next: **P1 (S1–S4 answered); Paul
answers S5–S14 before P2–P4** · Wells: 16/16 · Enemies: 6/6 Classic, 3/3 Overdrive ·
Tracks: 3/5 · Tokens: 5/5 effects · Achievements: 23 lifetime + 19 weekly ·
Prompts: 12

## Phase ledger

⛔ **CS016's ledger, reasoning, mutation records, the fourteenth soak and the
CLOSE REVIEW moved to `log/CS016.md`.** This file is reset for CS017 and carries
only what a CS017 session must act on. ⛔ `log/` is not session context: pull one
file in only when a question genuinely needs project history, and say that you
did.

| Phase | Landed |
|---|---|
| Planning | ✅ 2026-09-23 — `PLANNED-FEATURES-CS017.md` + `IMPLEMENTATION-PHASES-CS017.md`: four phases (the budget; the bench and the devices; the verdicts and the sweeps; the fifteenth soak and the close), fourteen calls S1–S14; ✅ S1–S4 answered (every recommendation), ⚠ **S5–S14 open** |

**Planning (2026-09-23).** Measured at `867ebd1`: suite 82 green, 0 skips, 282 s
(slowest file 37.6 s). The shipped file boots and plays from `file://` in
headless Chromium with zero exceptions; the budget board (16 enemies, 24 shots,
2 tokens) allocates 8.2 KB a `draw()` (6.2 KB with four draw-path fixes, V4 —
suite green) and costs 4.4–4.7 ms a frame uncapped at 1× CPU, 18.4–20.1 ms at
4×, raster-bound. A run to game over costs 0.19–1.02 s on average, so 100 fit one file.
Mimic from Start Depth 17: a reflection kills 0.125 per instance for a
non-dodging bot (below the Weaver bolt's 0.194). Stand-ins: Mimic cut 6 files
red, the seven bench keys unbound 14, plus `w` 17, version bump 1. Findings
below, under "What CS017 must act on".

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (26 modules + 3 inlined kit,
  **832.4 KB**); `MANIFEST` is checked both ways and a missing `KIT_INLINE` file
  fails the build.
- `node scratchpad/run-all.js`: **82 files, all green, zero skips** (~290 s).
  ⚠ **`run-all.js` has a 120 s PER-FILE timeout and machine load can trip it.**
  ⛔ A timeout is not a red — re-run the file alone before treating it as one.
- **CS001–CS016 are closed; each has a `log/CS0##.md`.** ⛔ **The Classic roster
  is complete at six and GDD §6.2's variants at three**; ⛔ **all five of GDD
  §4.5's death conditions are live in BOTH modes.**
- **CS012–CS014 shipped OVERDRIVE WHOLE, CS015 ACHIEVEMENTS WHOLE and CS016
  ONBOARDING WHOLE** (2026-09-17 … 09-23). What a phase must still obey is below
  and in `CLAUDE.md`; the narrative is `log/CS012–016.md`.
- ✅ **GDD §19's OVERDRIVE, META AND ONBOARDING ROWS ARE MET, every item**
  (Onboarding's, added by CS016 P1, closed at the CS016 close). ⚠ **Audio's "filter sweep audible end to end" is
  the document's one remaining ✗** and it is Paul's D6: the highest reading ever
  measured is **0.6860** (CS013 P5).
- ⛔ **FOURTEEN SOAKS, EACH PROVING A DIFFERENT THING** — `-cs003-p5` …
  `-cs007-p5`, then `-cs008-p8`, `-cs009-p6`, `-cs010-p5`, `-cs011-p6`,
  `-cs012-p6`, `-cs013-p5`, `-cs014-p3`, `-cs015-p4`, `-cs016-p4`. ⛔ **A new
  changeset's is a FIFTEENTH file, never a widened one.**
- ⛔ **`test-cs006-p5.js` carries the count-based no-draw rule**, a function of
  the LEVEL: `spawnEnemy`'s 1 plus `pickSpawnLane`'s `[1, C.SPAWN_LANE_TRIES]`.
- ⛔ **`GOLDEN_LANES`' first SIXTEEN entries are the ORIGINAL `9ebd27b`
  recording** (`test-cs004-p1.js`), held by a prefix assertion; CS008 P1
  appended `2, 5`. ⛔ **Any other move is a defect, not a baseline.**
- ⛔ **`P1_DETERMINISM_HASH` is the one baseline that moves, and it is
  CROSS-FILE** (`test-cs006-p2.js` runs `test-cs005-p5.js` in a child process).
  It stands at **1229033515**, unmoved through CS009–CS016. ⛔ Re-record once
  per change, one named cause at the assertion.
- ⛔ **On a boundary rider the LATTICE is where §17 item 3 stands, not the speed
  bound** (`RATIONALE.md#boundary-lattice`).
- ⛔ **`AudioSys.ctx` is null until a key, click or lifted touch**, and every
  audio entry point returns early on it. `buildGame({ audio: true })` installs
  the recording fake. ⛔ **A gesture is a DOM event**: `G.input.keyDown()` is not
  one, so a test wanting audio attaches `fakeTarget()`s and fires `keydown`.
  ⚠ So a fresh load's demo is SILENT: the gesture that opens audio ends it.
- ⛔ **A seat writes no `state` and draws nothing.** ⛔ The headroom gate
  (`test-cs009-p5.js`, ⚠ provisional) is D16's limiter-curve model — 0.450
  against `pulse` 0.3512, `title` 0.3408, `drive` 0.3505 — and holds only at the
  rendered settings, so `test-cs010-p1.js` pins `C.MUSIC_LIMIT` to D2's literals.
- ⚠ **SETTLED — MUSIC IS STRUCK, NEVER SWELLED** (Paul, 2026-09-16). ✅ The lab
  picks are ported for `title` and `pulse`; ⚠ `pulse` loops at 72 s, `drive` 62.6.
- ⛔ **Read GDD §6.5 before adding an entity.** NINE contract fields (plus
  `points()`), the wiring points, the Dive — and ⛔ **neither a token nor a RING
  is on that table**: no contract field, no `ENEMY_KINDS` row, its own home.
- `tools/music-lab.html` and `tools/sfx-lab.html` are the porting sources for
  `17-audio-tracks.js` and `C.SFX`, bound to the build by text identity;
  `well-lab` (⛔ the visual audition has not happened) and `feel-lab` complete
  the set. ⛔ **A new `SFX_KILL_PITCH` voice is a THREE-file edit**: `C`, BLOCK
  SFX and the `PITCH_*` tables. ⛔ **`C.SFX` is 28 events, `C.SFX_KILL_PITCH`
  11 voices**; a new event owes the lab a brief, an A label, 1–2 alternates and
  an in-context sequence, and is ONE line starting `    name:`. **Four** lab
  copies of `C` are pinned to the build (`test-cs010-p3.js`, `-cs014-p2.js`'s
  `LAB.dive`).

## Known issues

### What CS017 must act on

⛔ **CS017 is SHIP and it is PLANNED; §0 is UNANSWERED** (`PLANNED-FEATURES-CS017.md`).
Reasoning for everything CS016 built is in `log/CS016.md`; the rules are in
`CLAUDE.md`.

⚠ **Found by the planning session (2026-09-23), not worked around** — each
has a §0 call or a note in the plan:
- ⚠ **The GitHub repo is PUBLIC** and 8 live files name the original or its
  maker on 38 lines (GDD §18.1 says "docs"); the shipped package and `README.md`
  are clean (S10).
- ⚠ **`package-for-itch.sh` fails on this machine: `zip` is absent** (line 33;
  `python3` is present). S12.
- ⚠ **A stray bench digit silently voids a run's eligibility** — no row, no
  submit, no achievement, nothing on screen (S7).
- ⚠ **GDD §17's budget names "full particles"** (the build has none) **and "no
  per-frame allocation"**, which the ⛔ end-of-frame `.filter()` invariant
  contradicts on the step path (S2, S3).
- ⚠ **The soaks' MimicShot dodge — and `attractDrive()`'s port of it — measured
  WORSE than no dodge for a bot** (0.274 against 0.125 kills per reflection).
  No call; recorded.
- ⚠ **`package.json` says `"0.0.1"`**; §19's Core and Quality rows have never had
  a verdict block; no test asserts GDD §9's traverse-and-stop.
- ⚠ **Start Depth options are odd** (1, 3 … 29): a driver asking for an even
  depth silently gets row −1, i.e. level 1.

- ⛔ **CS017 OWES FOUR MEASUREMENTS AND ONE VERDICT**: the Mimic's probation
  verdict (GDD §21 #6) — ⚠ prompt row 11 (`mimic`) and the shipped id
  `mimic_kill` ride it: a cut leaves the row unfireable (harmless) and the id
  unearnable for new players; GDD §17's budget naming "8 shots" where Spread's
  cap is **24**; `drawShot()` allocating per call (F4); and ⚠ `drawPrompt()`
  building one `rgba()` string per frame of a prompt's last `PROMPT_FADE`
  (`drawText()` owns `globalAlpha`). ⛔ **The seven debug spawn actions ship
  until CS017** (Paul's H5).
- ⛔ **`C.GAME_VERSION` is `"0.0.13"` AND IS PINNED BY LITERAL in
  `test-cs016-p1.js:120`**: a bump rewrites that assertion in place (MEASURED red
  at the CS016 close). Ship's number is Paul's.
- ⛔ **AFTER SHIP THE ACHIEVEMENT IDS AND THE POOL'S LENGTH ARE FROZEN**: 23
  lifetime and 19 weekly ids, never renamed; the rotation walks the pool by
  length, so a row added or cut reshuffles every week's five against live saves.
  A threshold, a `name` and a `note` are not save data. ⚠ Real totals stay
  possible as an ADDITIVE v2, new ids beside these.
- ⛔ **`REACH` IS MEASURED BY `tools/reach-probe.js`** (~30 s, four passes):
  replace `REACH` WHOLE from its output; an unreached row is reported to Paul,
  never lowered.
- ⛔ **A TEST THAT IDLES 20 s AT REST ON THE TITLE ENTERS THE DEMO** (`"play"`
  under a `Game`-closure flag): a soak that parks on the title presses something
  inside 20 s or expects `"play"`. ⛔ `Date.now` / `performance.now` keep their
  four readers (the time seed, `nowMs()`, a score row's `ts`, the achievements
  clock).
- ⛔ **THE PROMPT BAND IS ARITHMETIC** (plan K2): `PROMPT_Y` 636 sits 6 px under
  the lowest rim and above the mirrored lives rectangle; a change to
  `HUD_MARGIN`, `HUD_ICON_SIZE`, `WELL_RADIUS`, `PROMPT_SIZE` or a prompt's length
  re-derives it, and `test-cs016-p1.js` asserts the clearance.
- ⛔ **`attractDrive()` IS A PORT OF THE SOAKS' HUNTER** (plan K5): a roster or
  rule change the soaks' driver learns must be taught to it too.
- ⚠ **SETTLED — A PROMPT CAN BE MARKED SEEN AND NEVER DRAWN, AND THAT IS
  ACCEPTED** (Paul, 2026-09-23, after the CS016 close): a row is marked on its
  trigger step and `startGame()` empties the queue (N4), so a row still queued
  at a RESTART or a QUIT is lost for that profile. Do not "fix" it.
- ⚠ **A mouse move during a demo DEATH FREEZE is drained and lost** (`frame()`'s
  freeze branch samples without `update()`); a held button or a named action
  still ends it. The shipped demo dies nowhere (MEASURED, ten seeds).
- ⛔ **`SEAT_EDGE` (`test-cs015-p2.js`) MATCHES BY INDENTATION LUCK**:
  `Meta.clearEdge();` sits at eight spaces inside the demo's `if (!attract)`
  block and the pinned six-space string is its suffix, once. A phase that
  re-indents that block moves the pin.
- ⛔ **A PHASE THAT EDITS EITHER ACHIEVEMENT SEAT MOVES SEVEN MUTATE STRINGS**:
  `test-cs015-p2.js`'s `SEAT_EDGE` / `SEAT_END`, `-p3.js`'s `SEAT_CLEAR` /
  `SEAT_END`, `-p4.js`'s `SEATS_OUT` (two) and `test-cs016-p3.js`'s
  `SEAT_CLEAR`, each in the build exactly once — ⚠ and `tools/reach-probe.js`
  mutates the line above each seat (`const win = wellWindow();`,
  `const ok = eligible();`).
- ⛔ **The per-well window and the clean streak move ABOVE the eligibility
  gate**, or a bench run hands the next well a doubled delta; both are re-minted
  by `runStarted()`. ⚠ **Five facts have no row** — `deaths`, `divesCompleted`,
  `purgesSpent`, `shotsFired`, `thornDeaths` — and `test-cs015-p3.js` pins that
  exact set.
- ⛔ **THE MENU SHAPES A SCREEN HAS TO FIT INTO**: the title has **five rows**
  (PLAY, OPTIONS, SCORES, PROFILE, ACHIEVEMENTS), game over **three lines**, and
  ⛔ **OPTIONS HAS ELEVEN ROWS WITH A SEVEN-ROW WINDOW** — a row goes before
  BACK, never above TELEMETRY. ⛔ **A LABEL IS ≤ 20 CHARACTERS BESIDE A
  FOUR-CHARACTER DETAIL AND A SCREEN GETS TWO INFO LINES** (MEASURED, CS015 P3).
  ⛔ **SCORES' rows are MODE, VIEW (module only), the entries, BACK**, rebuilt on
  entry / MODE / VIEW / a board's answer and never in `draw()`; ⛔ **the entry
  mode is the last run STARTED this session** (`lastRunMode`, which a demo never
  writes). ⛔ **NAME steps in place of the menu model**; ⚠ there Space, Z and X
  type. ⛔ **The ACHIEVEMENTS screen is SCORES' shape**, BACK returns to
  whichever door, and ⛔ **no seventh HUD rectangle** — centre-top is
  Overdrive's combo readout, centre-bottom the prompt band.
- ⛔ **NINE TEXTS IN `22-meta.js`, `23-main.js` AND `lib/kit-leaderboard/` ARE
  PINNED BY A CLOSED CS011 `mutate`** — grep `test-cs011-*.js` for `mutate:`
  before editing those files. ⛔ **kit-leaderboard cannot be inlined.**
- ⛔ **`Game.reset()` restores the controls and the sound rows, writes nothing,
  and leaves the screen on play**; a RELOAD test builds again over the same `Map`.
  ⛔ **A chosen level is reached from START DEPTH**, never `w`.
- ⛔ **`progress` IS v2 AND PER MODE**: `noteCleared()` writes the pair and
  `levelRecord(mode)` defaults to `state.mode`; the mode list is
  `Object.keys(C.MODE_FLAGS)`, so ⛔ **a feature is a FIELD IN THE ROWS, never a
  new top-level mode key.** ⛔ **A row-shape change bumps that key's version and
  supplies a `migrate`** — `migrateProgress` is the worked example.
- ⛔ **THE BOOT BLOCK RUNS INSIDE THE HARNESS**: `Meta.boot()` writes `profiles`
  in every build. ⚠ **A `Store.set` spy sees only `p0`'s writes**, and ⛔ **`p0`'s
  scope IS the root store**, so a per-profile `remove(key)` there must never name
  a root key. ⛔ **NO TELEMETRY WRITE FROM A PLAY STEP**; a settings save runs
  in `update()` on a menu step, and the clear edge writes `progress`,
  `achievements` and `onboarding` on a play step, legally.

### The entities and the Dive, as shipped (compressed; full text `log/CS015.md`)

- ⛔ **FOUR KILL SITES AND FIVE KILL LINES, ALL IN `09-collision.js`**
  (`:160`, `:286`, `:498`, `:512`, `:565`). ⛔ **A phase that edits a kill line
  repairs `test-cs012-p4.js`'s six `COMBO_OUT` strings, its two `mutantRed`
  shot-kill strings, `-p6.js`'s, and `test-cs014-p1.js`'s count of four.**
- ⛔ **`startDive()` DOES FIVE THINGS** — `resetDive()` (which empties the ring
  set), the `anchored` filter, `resetJump()`, `resetTokens()` and `layRings()`
  last; ⛔ **a repeated dive re-lays the set**, and a Warden and a `MimicShot`
  never survive into one. ⛔ **A dive pays exactly one thing, a ring**, spends
  zero draws, and `diveDrawDepth()` is the renderer's whole knowledge of it.
- ⛔ **AN `aloft` ENTITY IS INVISIBLE TO THE SHOT PASS AND VISIBLE TO EVERYTHING
  ELSE**; ⛔ a new reader that excludes one says so itself.
- ⛔ **THE REAVER IS A `Vaulter` SUBCLASS AND THE `MimicShot` A `WeaverBolt`
  ONE**; order a price table's branches subclass-first. ⚠ **THE MIMIC IS ON
  PROBATION AND CUTS IN ONE ROW** (GDD §21 #6) — ⚠ and `mimic_kill` is a shipped
  id, unearnable for new players if it goes. ⛔ `test-registry.js`: `enemies` 9,
  `enemyKinds` 13, `state` **28** keys, `tally` **23** counters inside one.
- ⚠ **`RING_POINTS`, `RING_ARC_LANES`, `RING_LANE_STEP` and the five visual
  values are PROVISIONAL**; ⛔ **`DIVE_TIME_OD` 4.0 and `DIVE_RINGS_MAX` 6 are
  NOT** (a ceiling may only come DOWN).
- ⚠ **Unowned, none reachable by the suite's drivers:** a second Purge preferring
  a bolt or a reflection above 0.95; a run STARTING past 99; a rim Vaulter and an
  aloft Warden hunting the CONTINUOUS lane; a biggest-Purge of six.

### Test hazards

- ⛔ **A CLOSED OVERDRIVE PLAY AT L11+ OWES ITS DRIVER FOUR THINGS**: jump at
  anything `aloft`; **never target** a `MimicShot` and steer away within a lane;
  **go to** a hovering token; ⛔ **steer to a ring in reach during a dive** —
  "in reach" from the depth model and `C.KEY_SPEED_MAX`, never a constant. ⛔ Each
  is a no-op where the thing does not exist. ⛔ **Repairs are the DRIVER or the
  FIXTURE (playing longer), never the build, a lowered level or a relaxed
  assertion.** ⚠ **That driver holds fire and spends the Purge**, so it cannot
  reach `week_purge_held` or `purge_saver`'s upper tiers.
- ⛔ **A CLOCK READ IS A MOVER.** Every closed front-door soak but the last two
  fakes `Date.now` per CALL and RESTARTS on a time seed, so a phase that adds a
  clock reader plays those sessions differently (CS015 P2 repaired
  `test-cs013-p5.js`'s driver for exactly this). ⛔ **`test-cs015-p4.js` and
  `-cs016-p4.js` fake WALL time** (the frame clock plus a base) — MEASURED, under
  a per-call fake a stubbed twin diverges at the first RESTART for no reason the
  board owns.
- ⛔ **A STAGED RECORD CAN MASK A WRITE** (CS016 P4, MEASURED by its own
  mutant): a zero-bytes claim over a demo is vacuous if the profile's Start
  Depth record already sits above the demo's clears, because `noteCleared()`
  then writes nothing. Stage records AFTER a no-write window, and assert the
  precondition. ⛔ **"Fires nothing" is PROBED off the real `promptScan()`** with
  one row unseen and a scratch queue — never a copy of a trigger.
- ⛔ **A DIVE'S LENGTH IS A PROPERTY, NEVER A STEP COUNT** (`1/60` is not
  binary). ⛔ **A run that ends inside a dive leaves `dive.active` TRUE until the
  RESTART press.** ⛔ **`state.tally`, the per-well window and the clean streak
  are re-minted by `startGame()`.** ⛔ **A kill site's reading and `state.dive`
  are read AT THE CALL**: the dive's end is `nextWell()` → `enterWell()` →
  `resetDive()` on ONE step.
- ⛔ **THREE OVERDRIVE FIXTURES ARE SEED-FRAGILE**: `-cs012-p2`'s `SOAK_SEED`,
  `-cs012-p4`'s seed **59** and `-cs012-p6`'s `OD_CLOCK` 7927. ⛔ **Anything that
  changes how long an Overdrive BEAT lasts is as much a mover as a draw.**
- ⛔ **`gddPoints()` HAS SEVEN COPIES AND THE COUNT IS NOT WHAT DECIDES** —
  whether that copy's board can KILL the entity does; ⛔ `instanceof` is PER
  BUILD. ⛔ **ITEM 8 PRICES A RING AND A BOUNTY PER STEP** in `-cs012-p4`, `-p6`,
  `-cs013-p2`, `-p5`, `-cs014-p3`: a new payout owes all five a term.
- ⛔ **A MUTATION RUN THAT THROWS IS A DEFECT IN THE TEST**: guard the reads,
  report a COUNT and one index, ⛔ assert the string is in the build exactly once
  BEFORE asserting red. ⚠ **A closed test may pin the literal text of a line a
  later phase changes** — ⛔ pin only the ARGUMENT the claim is about.
- ⛔ **A TEST THAT BOUNDS `state.shots` READS THE CAP IN FORCE off
  `state.powers`**; MEASURED, 24 IS reached. ⛔ **A STAGED DEATH IN AN OVERDRIVE
  FIXTURE MUST CLEAR `state.powers.ward` OR SET UP TWO HITS.** ⛔
  **`state.shots.push` CANNOT BE INTERCEPTED**; `tally.shotsFired` is honest.
- ⛔ **MODE IS `OVERDRIVE`, THEN `CLASSIC`, BOTH ENABLED** — ⛔ a driver wanting
  a Classic run steps ONE row down; ⛔ **START DEPTH is built for `pendingMode`.**
  ⛔ **A REPLAY THAT OUTLIVES ITS GAME OVER MEETS A LIVE MENU** — stop pressing
  at the stop; ⛔ a driver starting at the title spends two live steps first;
  ⛔ **a fire-holder has no death path on levels 1–4 and never spends a Ward**;
  ⛔ **a menu press is an EDGE** — release every held key first.
- ⛔ **A `Profiles.select()` STAGED ON A PLAY SCREEN LOOKS LIKE A PLAY-STEP WRITE**
  to a `Store.set` spy (`beforeChange` writes `telemetry` and now `onboarding`).
  In the game a switch is a menu action: stage it off play (`test-cs016-p1.js`).
  ⛔ **A played session now stores `onboarding`** (per profile, at the clear
  edge or the run's end); a new "every stored key" assertion must allow it.
- ⛔ **`test-cs008-p4.js` scans the WHOLE built file, comments included**: no
  `fillRect`/`strokeRect`, one `.fillText(`/`.strokeText(` site;
  `test-cs008-p6.js`'s vocabulary scan is a SUBSTRING scan (only `webkit` is
  excepted from "web"). `test-cs002-p1.js` bans `e.key`, `.touches`,
  `getGamepads`, `clientX` and `addEventListener` outside `04-input.js` — ⚠ and
  `20-achievements.js`'s banner slice holds the three inlined kit bodies.
  ⚠ **Strip comments before grepping a function's source.**
- ⛔ **CS009 TRAPS IN AUDIO CODE**: no "atari" (write "the original's"); never
  `.key` after an identifier ending in `e`; no `21-`/`22-` banner at a comment
  line's start; no platform RNG; never `audioFrame()` inside `frame()`.
  ⛔ **THE DIRECTOR runs BEFORE `setState()`**; a new `heat(` call turns
  `test-cs007-p2.js` red (use `heatT()`); `19-sfx.js`'s code may not name
  `state`; ⛔ **`setState()` before the first gesture is DROPPED.**
- ⛔ **AN EDIT TO `16-audio-engine.js` OR `17-audio-tracks.js` IS A THREE-FILE
  EDIT** (both labs), as is one to `C.MUSIC_LIMIT`, `C.LAYER_THRESHOLD`,
  `C.LAYER_CROSSFADE` or `C.FILTER_*`. ⚠ **EVERY KIT `VERSION` BUMP IS A
  CLOSED-FILE EDIT** — four files pin `AUDIO_VERSION` by literal.
- ⚠ **`_harness.js`**: `{ stub }` rebinds a named top-level function to a no-op;
  `{ spy }` counts calls with optional `.before`/`.after`; `{ mutate }` throws
  unless its string is in the build exactly once. ⛔ **A function inside `Game`'s
  closure cannot be reached this way**, `Game.update` and `Meta`'s seats
  included. ⚠ **An added `EXPORTS` row is a design decision a plan's §11 owes a
  line** (**218** at the CS016 close).
- ⚠ **TWO TESTS READ coinless-kit's `registry.js`** and each SKIPS LOUDLY without
  it: `-cs011-p5` (at `f0b0eb2`), `-cs012-p3` (at `e2efed5`, ⛔ never `f8d34f3`).
  ⛔ **No close can carry a skip.**

## Open questions (blocking)

- None.

## Carried tasks

- ⛔ **ONE LAB SESSION COVERS ALL OF IT, when Paul wants it**: `drive`'s tiers,
  gains and tempo (PASS marks) **and the FIVE unauditioned cues** — `ringTake`,
  `ringMiss`, the Surger tone, the Warden's fuse and `unlock` (candidate A;
  alternates "square bell pair", "triangle step up"). Its own commit; it
  rewrites `test-cs012-p1.js`'s "no tier" and "no audition mark" assertions in
  place. ⛔ **Nothing waits on it**; ⛔ **a re-pick is ported verbatim from the
  lab, never hand-tuned in `C`.**
- ⚠ **Paul replaces `C.CREDITS_LINES` before ship.**
- ✅ **Both boards are registered and deployed** (coinless-kit `e2efed5`), same
  seven `statsFields`. ⛔ **Read the Worker's registered `statsFields` before
  sending a stats key**; `C.GAME_ID` is the SAVE keyspace.
- Backport kit-input (0.8.0), kit-menu (0.1.0), kit-fx, kit-audio (**0.4.0**) and
  kit-leaderboard (0.2.1, `lib/`) — each a separate manual step. `createScores`
  is kit-scores' draft, `createAchievements` kit-achievements' (⚠ its screen is
  the game's wrapper, not the module's).
- ⚠ **`CLAUDE.md` carries no telemetry rule**; whether it earns one is Paul's.
  ⛔ **`TELEMETRY_FIELDS` is frozen at 29 and `telemetry` at v1**, and it,
  `TELEMETRY_KINDS`, `telemetryRow()` and the version move together.
- ⚠ **Unowned:** the pad-only silence, the VOICE bus, the Surger tone's 1.106
  sample peak, the enemy / menu palette and the HUD sizes,
  `tools/glow-lab.html`'s visual audition, F1 and F2, and whether the headroom
  gate should bound the limiter's INPUT (Paul's call).
- ✅ **A close indexes its changeset's calls in `DECISIONS.md`**, a pointer and
  never the writeup; ✅ **the index is complete through CS016.**
- ✅ **`CLAUDE.md` is 38,311 bytes** against its 50 KB ceiling. ⚠ The valve and
  the ban on standing sweeps stand.

## Next up — Paul answers CS017 §0, then P1 (the budget)

⛔ **§0 of `PLANNED-FEATURES-CS017.md` is unanswered**: S1–S14, one
recommendation each. P1 needs S1–S4; P2 S7; P3 S6, S9 (the credits lines
themselves), S10–S13; P4 S5, S8, S14. ⛔ A phase that reaches an unanswered
call stops. Then `IMPLEMENTATION-PHASES-CS017.md`'s P1 prompt. ⛔
`../coinless-kit` must be present for the close (zero skips); P1's tool needs
Chromium (Playwright's cache holds one here).
