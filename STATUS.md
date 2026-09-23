# Vector Vortex — STATUS
Version: 0.0.12 · Changeset: **CS016 P3 landed 2026-09-23** · next: **CS016 P4**
(the fourteenth soak, the review, the close) · Wells: 16/16 · Enemies: 6/6 Classic, 3/3 Overdrive · Tracks: 3/5 ·
Tokens: 5/5 effects · Achievements: 23 lifetime + 19 weekly

## Phase ledger

⛔ **CS015's ledger, reasoning, mutation records, the thirteenth soak and the
CLOSE REVIEW moved to `log/CS015.md`.** This file is reset for CS016 and carries
only what a CS016 phase must act on. ⛔ `log/` is not session context: pull one
file in only when a question genuinely needs project history, and say that you
did.

| Phase | Landed |
|---|---|
| Planning | 2026-09-20 — `PLANNED-FEATURES-CS016.md` and `IMPLEMENTATION-PHASES-CS016.md` written at `bea33c8`; §0 answered by Paul 2026-09-23: every recommendation, N2 rows 8–12 all in, N12 in CS016 (four phases) |
| P1 | 2026-09-23 — `src/22-onboarding.js`, `C.PROMPTS` (12 rows) and the band, the `onboarding` key v1, GDD §12 restated, §19's Onboarding row; `test-cs016-p1.js` (159); 79/79 green |
| P2 | 2026-09-23 — attract mode: `attractDrive()`, the title idle clock, the demo's skips and endings, six `C.ATTRACT_*` constants; GDD §12, a `CLAUDE.md` rule; `test-cs016-p2.js` (251); 80/80 green |
| P3 | 2026-09-23 — the pre-ship achievement pass: two `tally` counters, two per-well facts, `cleanDives`, two pool rows, `week_lean_well` cut, `depth_reached` [10, 25, 99], `dives_done` [5, 15, 25]; `REACH` re-measured; `NEXT-STEPS.md`'s entry deleted; GDD §15.5; `test-cs016-p3.js` (67); 81/81 green |

**P1 — the prompts, the band and the onboarding key.** Built N1–N5, N11, N13
as answered; nothing re-opened. `promptScan()` / `promptStep()` / `drawPrompt()`
are top-level in `22-onboarding.js`; `Meta` owns the seen set (`promptsSeen()`,
`promptSeen(id)`, `savePrompts()`, `unlocks()`), loaded in `activateSettings()`
and written only at the clear edge, `runEnded()`, `autoPause` and
`beforeChange`, and only when a mark is unsaved. Exactly the four predicted
closed edits (two regexes, `OWN_KEYS`, `EXPORTS` 212 → **217**); the other 78
files green untouched; `P1_DETERMINISM_HASH` and `GOLDEN_LANES` unmoved. A
played Classic session hashes identically with the scan and the clock stubbed.
⛔ **Two seats the plan's text did not name** (findings, `log/CS016.md`): the
scan ALSO runs in the Dive's branch (row 9 reads `dive.active`, which the named
seat never sees true), and `promptStep()` sits ABOVE the dive branch (N4: a dive
runs the clock on). ⚠ "saveTelemetry()'s four seats" is the plan's list — the
function's own fourth caller is the TELEMETRY toggle, not the clear edge.
`C.GAME_VERSION` is `"0.0.12"`. One `SKIPPED-PLAYTESTS.md` entry (legibility,
glyphs, durations).

**P2 — attract mode.** Built N6–N10 as answered; nothing re-opened. The demo is
`"play"` under a `Game`-closure flag; `startGame(…, { attract: true })` skips
`runStarted()` and `lastRunMode`, so `eligible()` is false with no new term; the
telemetry sample, the prompt scan and the clear edge's `noteCleared()` /
`clearEdge()` / `savePrompts()` skip on the flag. MEASURED: the store's bytes
identical across a demo that clears, dies and reaches game over. The predicted
closed edit (`EXPORTS` 217 → **218**) ⛔ **plus one FINDING**: `test-cs016-p1.js`'s
module scan banned `state.time` module-wide, and the driver's periodic Purge
reads it — rewritten in place to the prompt code, every other token still
module-wide. `P1_DETERMINISM_HASH`, `GOLDEN_LANES` unmoved. ⛔ **One defect the plan predicted away** (N9's "the
entry step latches what is held"): an ending inside a step re-minted
`state.input` through `quitToTitle()`, so the ending Fire confirmed PLAY —
MEASURED red, fixed by `endAttract()` keeping the step's struct (`log/CS016.md`).
Two calls inside the answers: `C.ATTRACT_PURGE_EVERY` 5.2 s ⚠ (N6 named no N),
and `C.ATTRACT_SEED` **1** ⚠ (measured over ten seeds). One `SKIPPED-PLAYTESTS.md`
entry (legible as a demo; silent on a fresh load).

**P3 — the pre-ship achievement pass.** Built N12 as answered, with one amendment:
⛔ **`cleanDives` MEASURED 44 at most** over `REACH`'s four passes, against the
answered top tier of 50, so the row failed the per-row gate. That was reported
and not lowered. ✅ **Paul, 2026-09-23: `dives_done` [5, 15, 25]** (the plan's
§0 is amended to match). Rows appended at the pool's end. ⛔ **One text Paul did not
write**: `dives_done`'s note, now "DIVES FLOWN IN ONE RUN WITH NO THORN DEATH",
because the old note described the old fact. ✅ Paul keeps it. §11's P3 edit
landed as predicted (`REACH` re-measured in full). ⛔ **Three closed edits the
table did not name** (findings, each forced by an answer, each rewritten in
place): `test-cs015-p3.js`'s `wellShotPar` assertion (the par left with its row),
its pinned unread-fact set (+`divesCompleted`), and its per-well list
(`leanClear` → the two new facts). `test-cs015-p1.js` and `-p4.js`: none.
`P1_DETERMINISM_HASH`, `GOLDEN_LANES`, kill lines: unmoved.

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (26 modules + 3 inlined kit,
  **832.4 KB**); `MANIFEST` is checked both ways and a missing `KIT_INLINE` file
  fails the build.
- `node scratchpad/run-all.js`: **81 files, all green, zero skips.**
  ⚠ **`run-all.js` has a 120 s PER-FILE timeout and machine load can trip it.**
  ⛔ A timeout is not a red — re-run the file alone before treating it as one.
- **CS001–CS015 are closed; each has a `log/CS0##.md`.** ⛔ **The Classic roster
  is complete at six and GDD §6.2's variants at three**; ⛔ **all five of GDD
  §4.5's death conditions are live in BOTH modes.**
- **CS012–CS014 shipped OVERDRIVE WHOLE and CS015 ACHIEVEMENTS WHOLE**
  (2026-09-17 … 09-20). What a phase must still obey is below; the narrative is
  `log/CS012–015.md`.
- ✅ **GDD §19's OVERDRIVE AND META ROWS ARE MET, every item** (Meta's last ✗
  closed at the CS015 close). ⚠ **Audio's "filter sweep audible end to end" is
  the document's one remaining ✗** and it is Paul's D6: the highest reading ever
  measured is **0.6860** (CS013 P5).
- ⛔ **THIRTEEN SOAKS, EACH PROVING A DIFFERENT THING** — `-cs003-p5` …
  `-cs007-p5`, then `-cs008-p8`, `-cs009-p6`, `-cs010-p5`, `-cs011-p6`,
  `-cs012-p6`, `-cs013-p5`, `-cs014-p3`, `-cs015-p4`. ⛔ **A new changeset's is a
  FOURTEENTH file, never a widened one.**
- ⛔ **`test-cs006-p5.js` carries the count-based no-draw rule**, a function of
  the LEVEL: `spawnEnemy`'s 1 plus `pickSpawnLane`'s `[1, C.SPAWN_LANE_TRIES]`.
- ⛔ **`GOLDEN_LANES`' first SIXTEEN entries are the ORIGINAL `9ebd27b`
  recording** (`test-cs004-p1.js`), held by a prefix assertion; CS008 P1
  appended `2, 5`. ⛔ **Any other move is a defect, not a baseline.**
- ⛔ **`P1_DETERMINISM_HASH` is the one baseline that moves, and it is
  CROSS-FILE** (`test-cs006-p2.js` runs `test-cs005-p5.js` in a child process).
  It stands at **1229033515**, unmoved through CS009–CS015. ⛔ Re-record once
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

### What CS016 must act on

⛔ **CS016 is ONBOARDING (GDD §12), PLANNED 2026-09-20 at `bea33c8`.** A build
phase reads the plan's §0 answers, not this block.

- ⛔ **GDD §12's four-second promise is MEASURED FALSE in one half** (plan
  §1.3, 64 front-door runs): the first Vaulter leaves the throat at 1.600 s
  and reaches the kill band at 6.883 s on every seed, so no passive player
  dies under 6.883 s (p50 8.5–8.7, max 11.4). The active half is met: a mover
  kills at 2.38 s median, 2.68 s worst, 64/64. ⛔ Both floors are heat-clock
  bases — a phase does not make the sentence true. ✅ **§12 restated at P1**
  (N1-A); no constant, lane or schedule moved.
  ⚠ **§12's "half speed" names nothing in the build** (`climbMult(1)` is 1).
- ⛔ **`test-cs015-p2.js:431` PINS "no storage write on a play step that is
  not the clear edge", any key** (MEASURED red under a stand-in that wrote a
  new key at `startGame()`). A prompt's seen-flag is therefore MARKED on its
  trigger step and WRITTEN at `saveTelemetry()`'s four seats, never on a bare
  play step.
- ⛔ **`C.GAME_VERSION` is `"0.0.12"` since P1** (Paul, 2026-09-23); ⛔ **the
  CS016 close bumps it to `"0.0.13"`.** ✅ `_harness.js`'s `EXPORTS` was **212**
  at `51d86bf` (MEASURED by evaluating the array; the plan's 211 was the
  miscount) and is **217** after P1.
- ✅ **Attract mode shipped at P2** (GDD §12; `CLAUDE.md`, Attract mode).
  ⛔ **A test that idles 20 s at rest on the TITLE now enters a demo** — no
  closed test does; a new soak that parks on the title must press something
  inside 20 s or expect `"play"`. ⛔ **`Date.now` / `performance.now` still
  have their four readers.**
- ✅ **`C.ATTRACT_LINE` is `DEMO — PRESS FIRE`** (Paul, 2026-09-23): an unbound
  key reaches neither the struct nor a named action and does not end the demo,
  so the line names the one input that ends it on every device and can never be
  unbound. No third ending was built.
- ⚠ **A mouse move during a demo DEATH FREEZE is drained and lost** (`frame()`'s
  freeze branch samples without `update()`); a held button or a named action
  still ends it. The shipped demo dies nowhere (MEASURED, ten seeds).
- ✅ **The prompts are live on every play step but a demo's**: `scanPrompts()`
  (two seats) returns at once under the attract flag, and the band carries
  `C.ATTRACT_LINE` in place of `drawPrompt()` (P2).
- ⛔ **`SEAT_EDGE` (`test-cs015-p2.js`) still matches BY INDENTATION LUCK**:
  `Meta.clearEdge();` now sits at eight spaces inside P2's `if (!attract)`
  block and the pinned six-space string is its suffix, once. A phase that
  re-indents that block moves the pin.
- ⚠ **`drawPrompt()` builds one `rgba()` string per frame during a prompt's last
  `PROMPT_FADE`** (`drawText()` owns `globalAlpha`) — CS017's allocation
  measurement (F4) may count it.

- ⛔ **GDD §12's four-second promise has four things to teach beyond the
  basics**: CS013's tokens and the Jump, CS014's steerable dive (nothing on
  screen says a ring is worth going to) and ⚠ **CS015's achievements** — there
  is no toast (A1), so an unlock is HEARD (`unlock`) and never seen until the
  player opens the screen.
- ✅ **The pre-ship achievement pass shipped at P3** (GDD §15.5). ⛔ **After
  ship the pool's LENGTH is frozen too**: the rotation walks it, so a row
  added or cut reshuffles every week's five against live saves.
- ⛔ **`REACH` IS MEASURED BY `tools/reach-probe.js`** (Paul, 2026-09-23, after
  P3): `node tools/reach-probe.js` runs the four passes (~30 s), prints the table,
  the rows it did not reach, and the drift against the shipped `REACH`. It
  reproduces P3's `REACH` exactly. ⛔ A design instrument, not a test: replace
  `REACH` WHOLE from its output, and report an unreached row to Paul, never
  lower it. ⛔ The close indexes this call in `DECISIONS.md`.
- ⛔ **THE IDS ARE SAVE DATA**: 23 lifetime and 19 weekly, never renamed; a
  threshold, a `name` and a `note` are not. `achievements` is **v1**, "lifetime"
  is one run banked (`lifetimeTiers` is monotonic); ⚠ real totals stay possible
  as an ADDITIVE v2, new ids beside these.
- ⛔ **A PHASE THAT EDITS EITHER ACHIEVEMENT SEAT MOVES SIX MUTATE STRINGS**:
  `test-cs015-p2.js`'s `SEAT_EDGE` / `SEAT_END`, `-p3.js`'s `SEAT_CLEAR` /
  `SEAT_END` and `-p4.js`'s `SEATS_OUT` (two), each in the build exactly once.
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
  mode is the last run STARTED this session** (`lastRunMode`). ⛔ **NAME steps in
  place of the menu model**; ⚠ there Space, Z and X type. ⛔ **The ACHIEVEMENTS
  screen is SCORES' shape**, BACK returns to whichever door, and ⛔ **no seventh
  HUD rectangle** — centre-top is Overdrive's combo readout.
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
  in `update()` on a menu step, and the clear edge writes `progress` and
  `achievements` on a play step, legally.
- ⚠ **CS014's two planning documents are still at the repository root**; the
  CS011–CS013 and CS015 closes archived their own. Paul's to move or keep.

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
- ⛔ **A CLOCK READ IS A MOVER.** Every closed front-door soak but the thirteenth
  fakes `Date.now` per CALL and RESTARTS on a time seed, so a phase that adds a
  clock reader plays those sessions differently (CS015 P2 repaired
  `test-cs013-p5.js`'s driver for exactly this). ⛔ **`test-cs015-p4.js` fakes
  WALL time** (the frame clock plus a base) — MEASURED, under a per-call fake its
  stubbed twin diverges at the first RESTART for no reason the board owns.
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
  line** (212 at the CS015 close).
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
- ⛔ **CS017 owes three measurements**: the Mimic's probation verdict (GDD §21
  #6), GDD §17's budget naming "8 shots" where Spread's cap is **24**, and
  `drawShot()` allocating per call (F4). ⛔ **The seven debug spawn actions ship
  until CS017** (Paul's H5).
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
  never the writeup; ✅ **the index is complete through CS015.**
- ✅ **`CLAUDE.md` is 36,926 bytes** against its 50 KB ceiling. ⚠ The valve and
  the ban on standing sweeps stand.

## Next up — CS016 P4

The fourteenth soak, the review and the close, from
`IMPLEMENTATION-PHASES-CS016.md`'s P4 prompt. ⛔ A new FILE, never a widened
closed soak. ⛔ The close bumps `C.GAME_VERSION` to `"0.0.13"` and indexes
CS016's calls in `DECISIONS.md`, P3's amended `dives_done` tiers among them.
