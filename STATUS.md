# Vector Vortex — STATUS
Version: **1.0.1 — built, NOT RELEASED** (release tests pending) · CS018 closed 2026-09-23 · **no changeset in flight** ·
Wells: 16/16 · Enemies: 6/6 Classic, 3/3 Overdrive · Tracks: 3/5 · Tokens: 5/5 effects ·
Achievements: 23 lifetime + 19 weekly (**frozen**) · Prompts: 12

## What this file is now

⛔ **A POST-SHIP FILE.** CS001–CS018 are closed, each with a `log/CS0##.md`;
CS018's ledger, phase entries, review and **this file's pre-close text,
verbatim**, are in `log/CS018.md`. ⛔ **Post-ship work is a PATCH, and a patch
is a changeset**: a planning session first, then build phases, then a close —
`CLAUDE.md`'s three session kinds, unchanged. The next patch's planning session
adds its `ROADMAP.md` row and starts its ledger under "Phase ledger".

⛔ **NOT RELEASED. Paul has not yet played the game (2026-09-23), and the itch.io
upload waits on `RELEASE-TESTS.md`**: eleven by-hand tests, R1–R11, drawn from
`SKIPPED-PLAYTESTS.md`'s ▶ RELEASE entries, none of them skipped. A FAIL becomes
a patch changeset; the upload happens only when all eleven pass.

⚠ **PAUL'S, OUTSIDE THE REPO, BEFORE THE ITCH PAGE GOES LIVE** (CS017 S10, S12):
make `github.com/freakingid/vector-vortex` **private** (it is PUBLIC, and 8 live
documents name the original on ~38 lines); write the itch page's copy (no file
here can scan it — GDD §18.6); upload `dist/vector-vortex-itch.zip` — **the
1.0.1 build, packaged at CS018's close** (untracked; 287,515 bytes; three files: `index.html` 856,880, `kit-leaderboard.js`, `kit-names.js`).

## Phase ledger

None in flight. CS018 (1.0.1) closed 2026-09-23: the ten §19 coverage gaps
carried (`test-cs018-p1.js`), `build.js`'s `$`-safe injection, OPTIONS' VOICE
VOLUME row cut (`test-cs018-p2.js`), `C.GAME_VERSION` 1.0.1 — `log/CS018.md`.

## Working / verified (MEASURED at the CS018 close)

- `node build.js` → `dist/vector-vortex.html`, 26 modules + 3 inlined kit,
  **856,880 bytes** (836.8 KB, sha256 `57c3b3e0…`); `MANIFEST` checked both ways; a missing `KIT_INLINE` file fails
  the build.
- `node scratchpad/run-all.js` → **87 files, all green, zero skips**
  (378 s, `/usr/bin/time`). ⚠ **`run-all.js` has a 120 s PER-FILE timeout and machine load
  can trip it.** ⛔ A timeout is not a red — re-run the file alone first — but
  ⛔ a close cannot carry one. The slowest file is `test-cs014-p3.js` (37.6 s at planning, `867ebd1`),
  then the fifteenth soak (~35 s alone).
- ⛔ **Zero skips needs `../coinless-kit`**: `test-cs011-p5.js` (at `f0b0eb2`)
  and `test-cs012-p3.js` (at `e2efed5`, ⛔ never `f8d34f3`) read its
  `registry.js` and SKIP LOUDLY without it.
- ⛔ **`P1_DETERMINISM_HASH` 1229033515** (cross-file: `test-cs006-p2.js` runs
  `test-cs005-p5.js` in a child process) — unmoved CS009–CS018; re-record once
  per change, one named cause at the assertion. ⛔ **`GOLDEN_LANES`' first
  SIXTEEN entries are the `9ebd27b` recording** (+`2, 5`, CS008); any other move
  is a defect.
- ⛔ **FIFTEEN SOAKS, EACH PROVING A DIFFERENT THING** — `-cs003-p5` …
  `-cs007-p5`, `-cs008-p8`, `-cs009-p6`, `-cs010-p5`, `-cs011-p6`, `-cs012-p6`,
  `-cs013-p5`, `-cs014-p3`, `-cs015-p4`, `-cs016-p4`, **`-cs017-p4`** (§17 item
  12's hundred runs, 50 per mode, all sixteen wells). ⛔ **A new changeset's is a
  SIXTEENTH file, never a widened one.**
- ✅ **GDD §19: every row carries an "at ship" verdict block (CS017 P3, P4) and
  no clause is ✗.** The ten coverage gaps the at-ship sweep named are carried
  (CS018 P1, `test-cs018-p1.js`), each in an "At 1.0.1" line under its row's
  block; the at-ship blocks stay as history. A ◐ left names a skipped playtest
  (`SKIPPED-PLAYTESTS.md`, CS009–CS017).
- `_harness.js` `EXPORTS` **218**; `test-registry.js` `enemies` 9,
  `enemyKinds` 13, `state` **28** keys, `tally` **23** counters inside one.
  `C.SFX` 28 events, `C.SFX_KILL_PITCH` 11 voices; kill sites / lines 4 / 5.
- ✅ **`CLAUDE.md` is 38,748 bytes** (CS018 P1) against its 50 KB ceiling; the
  valve and the ban on standing sweeps stand.

## ⛔ What a patch must obey

The rules are `CLAUDE.md`'s; these are the facts a patch trips over.

### Frozen at ship

- ⛔ **THE ACHIEVEMENT IDS AND THE POOL'S LENGTH**: 23 lifetime and 19 weekly
  ids, `perWeek` 5, never renamed; the rotation walks the pool BY LENGTH, so a
  row added or cut reshuffles every week's five against live saves. A
  threshold, a `name` and a `note` are not save data. ⚠ Real totals stay
  possible as an ADDITIVE v2, new ids beside these. ⛔ **`REACH` is measured by
  `tools/reach-probe.js`** (~30 s): replace it WHOLE from its output; an
  unreached row is reported to Paul, never lowered.
- ⛔ **The save keyspace** (`CLAUDE.md`'s table): `settings` v1, `progress` v2,
  `achievements` v1, `scores` (root), `telemetry` v1 (`TELEMETRY_FIELDS` 29,
  moving with `TELEMETRY_KINDS`, `telemetryRow()` and the version),
  `onboarding` v1. ⛔ A row-shape change bumps the version and supplies a pure
  `migrate` — `migrateProgress` is the worked example — never a new key name.
- ⛔ **The boards**: `C.LEADERBOARD_GAME_IDS` `vector-vortex` /
  `vector-vortex-overdrive`, registered with seven `statsFields`. ⛔ Read the
  Worker's registered `statsFields` before sending a stats key. ⛔ `C.GAME_ID` is
  the SAVE keyspace and nothing else.
- ⛔ **`C.GAME_VERSION` is `"1.0.1"` AND IS PINNED BY LITERAL in
  `test-cs016-p1.js:121`**: a patch's bump rewrites that assertion in place;
  `package.json`'s `version` moves with it, and `bash package-for-itch.sh`
  rebuilds the untracked zip.

### The build and its switches

- ⛔ **`C.DEBUG_KEYS` ships `false`**: the eight bench bindings (`1`–`6`, `0`,
  `w`) exist only in a flagged build, so no key a player can press voids a
  run's eligibility; `t`, `e`, `p`, Escape are bound in both. ⛔ **A FLAGGED
  BUILD IS A `mutate` of `  DEBUG_KEYS:           false,`, by literal, in 18
  files** (MEASURED at the close, grep) — re-spacing that line rewrites all
  eighteen in place. ⚠ **SETTLED — `w` is bindable in the shipped build**
  (Paul, S7 addendum); a profile that binds it loads its KEYBOARD page as
  defaults in a flagged dev build (dev only).
- ⛔ **A CLOSED FILE CAN GO VACUOUS WITHOUT GOING RED** (CS017 P3,
  `test-cs003-p2.js`): a change that unbinds, stubs or gates something a closed
  file DRIVES needs a grep for the file's presses, not only the red set.
- ⛔ **`test-cs017-p1.js` PINS THE BUDGET BOARD AT 156 STROKES AND 8 TEXT CALLS
  a `draw()`**: a renderer change that draws more rewrites `BUDGET_*` in place
  with the cause named — a counter, never a clock. Its nine mutants pin
  `const out = points._screen;`, `drawPoly(ctx, _shotPair, false);`,
  `ctx.font = textFont(size);`, ` : promptFadeColor(a);`, `wellBandColor()`'s
  indexed `for`, the three HUD cache lines and game over's
  `if (screen === SCREENS.gameover &&` guard. ⛔ **No allocating expression on
  the DRAW path** (GDD §17); the step path's `.filter()` is the invariant.
- ⛔ **THE PROMPT BAND IS ARITHMETIC**: `PROMPT_Y` 636 sits 6 px under the
  lowest rim; a change to `HUD_MARGIN`, `HUD_ICON_SIZE`, `WELL_RADIUS`,
  `PROMPT_SIZE` or a prompt's length re-derives it (`test-cs016-p1.js`).
- ⛔ **THE MENU SHAPES**: the title has five rows, game over three lines,
  OPTIONS **ten** rows in a seven-row window since 1.0.1 (a row goes before BACK,
  never above TELEMETRY; `test-cs018-p2.js` pins the ten by label); a label ≤ 20 characters beside a four-character detail, TWO info
  lines a screen; the credits ≤ 7 lines of ≤ 66 characters, each passing the
  SUBSTRING vocabulary scan.
- ⛔ **`attractDrive()` IS A PORT OF THE SOAKS' HUNTER**: a roster or rule
  change the soaks' driver learns is taught to it too. ⚠ Its Mimic dodge — the
  soaks' too — MEASURED worse than no dodge for a bot (0.274 against 0.125
  kills per reflection); no call was made.
- ⚠ **SETTLED — a prompt can be marked seen and never drawn** (Paul,
  2026-09-23): `startGame()` empties the queue. Do not "fix" it.
- ⚠ **A mouse move during a demo DEATH FREEZE is drained and lost**; the
  shipped demo dies nowhere (MEASURED, ten seeds).

### Pinned text — grep before editing

- ⛔ **A PHASE THAT EDITS EITHER ACHIEVEMENT SEAT MOVES SEVEN `mutate`
  STRINGS**: `test-cs015-p2.js`'s `SEAT_EDGE` / `SEAT_END`, `-p3.js`'s
  `SEAT_CLEAR` / `SEAT_END`, `-p4.js`'s `SEATS_OUT` (two), `test-cs016-p3.js`'s
  `SEAT_CLEAR` — ⚠ and `tools/reach-probe.js` mutates the line above each seat.
  ⛔ **`SEAT_EDGE` MATCHES BY INDENTATION LUCK**: `Meta.clearEdge();` sits at
  eight spaces inside the demo's `if (!attract)` block.
- ⛔ **A PHASE THAT EDITS A KILL LINE** repairs `test-cs012-p4.js`'s six
  `COMBO_OUT` strings and two `mutantRed` shot-kill strings, `-p6.js`'s, and
  `test-cs014-p1.js`'s count of four (`09-collision.js:160, 286, 498, 512,
  565`). ⛔ **ITEM 8 PRICES A RING AND A BOUNTY PER STEP** in five files: a new
  payout owes all five a term. ⛔ **`gddPoints()` has seven copies**; order a
  price table's branches subclass-first.
- ⛔ **NINE TEXTS IN `22-meta.js`, `23-main.js` AND `lib/kit-leaderboard/` ARE
  PINNED BY A CLOSED CS011 `mutate`** — grep `test-cs011-*.js` for `mutate:`.
- ⛔ **SEVEN SOUND-SETTING LINES OF `23-main.js` ARE PINNED BY
  `test-cs018-p2.js`'s `V100`** (the 1.0.0 build rebuilt as a mutant):
  `SOUND_ROWS`' `sfx` row, OPTIONS' sound-row line, `VOL_BUSES`, `sound`'s
  second line, `ADJUST.sfx`, `settingsSnapshot()`'s sound line and
  `applySettings()`' field list. An edit to one rewrites `V100` in place.
- ⛔ **`test-cs018-p1.js` PINS BY TEXT**: `test-cs008-p6.js`'s
  `const WORDS = [ … ];` line, `WORDS.concat("…")` and the `w === "…" ? "…" : w`
  exception (G10 reads the list from there — a repair of that file keeps all
  three forms); `drawShot()`'s `glowStroke` line; `isoDayIndex()`'s and
  `isoWeekKey()`'s UTC lines; the `INT_ATTACK`, `INT_RELEASE`, `FILTER_MIN_HZ`
  and `FILTER_MAX_HZ` lines of `C`. G5 fixes `MANIFEST` at 26 modules; G7
  enters START DEPTH's first row.
- ⛔ **AN EDIT TO `16-audio-engine.js`, `17-audio-tracks.js`, `C.MUSIC_LIMIT`,
  `C.LAYER_THRESHOLD`, `C.LAYER_CROSSFADE` OR `C.FILTER_*` IS A THREE-FILE
  EDIT** (both labs). ⛔ **A new `SFX_KILL_PITCH` voice is too** (`C`, BLOCK
  SFX, the `PITCH_*` tables); a new `C.SFX` event owes the lab a brief, an A
  label, 1–2 alternates and an in-context sequence. ⚠ **Every kit `VERSION`
  bump is a closed-file edit** — four files pin `AUDIO_VERSION`.

### Test hazards

- ⛔ **A CLOSED OVERDRIVE PLAY AT L11+ OWES ITS DRIVER FOUR THINGS**: jump at
  anything `aloft`; never target a `MimicShot`; go to a hovering token; steer to
  a ring in reach during a dive. ⛔ Repairs are the DRIVER or the FIXTURE, never
  the build, a lowered level or a relaxed assertion. ⚠ That driver holds fire
  and spends the Purge.
- ⛔ **A CLOCK READ IS A MOVER.** `Date.now` / `performance.now` have four
  readers (the time seed, `nowMs()`, a score row's `ts`, the achievements
  clock). Closed soaks before `-cs015-p4` fake `Date.now` per CALL;
  `-cs015-p4`, `-cs016-p4` and `-cs017-p4` fake WALL time.
- ⛔ **A TEST THAT IDLES 20 s AT REST ON THE TITLE ENTERS THE DEMO.**
  ⛔ **A STAGED RECORD CAN MASK A WRITE**: stage Start Depth records after a
  no-write window and assert the precondition. ⚠ **Start Depth options are
  ODD** (1, 3 … 29 at a record of 30): choose by ROW; an even value is row −1.
- ⛔ **MODE IS `OVERDRIVE`, THEN `CLASSIC`**; START DEPTH is built for
  `pendingMode`; a driver starting at the title spends two live steps first; a
  menu press is an EDGE — release every held key first; a replay that outlives
  its game over meets a live menu. ⛔ A fire-holder has no death path on levels
  1–4 and never spends a Ward.
- ⛔ **A DIVE'S LENGTH IS A PROPERTY, NEVER A STEP COUNT**; a run ending inside
  a dive leaves `dive.active` true until the RESTART press. ⛔ **Three Overdrive
  fixtures are seed-fragile** (`-cs012-p2`'s `SOAK_SEED`, `-cs012-p4`'s seed
  59, `-cs012-p6`'s `OD_CLOCK` 7927); anything that changes an Overdrive BEAT's
  length is a mover.
- ⛔ **A TEST THAT BOUNDS `state.shots` READS THE CAP IN FORCE** off
  `state.powers` (24 is reached). ⚠ **A `Shot`'s `depth` is a METHOD**
  (`depth()`); an entity's is a field. ⛔ A staged death in an Overdrive fixture
  clears `state.powers.ward` or sets up two hits.
- ⛔ **A MUTATION RUN THAT THROWS IS A DEFECT IN THE TEST**: assert the string
  is in the build exactly once before asserting red; pin only the ARGUMENT a
  claim is about.
- ⛔ **`test-cs008-p4.js` and `-p6.js` scan the WHOLE built file, comments
  included** (no `fillRect` / `strokeRect`, one text site; vocabulary by
  SUBSTRING, only `webkit` excepted from "web"); `test-cs002-p1.js` bans raw
  input reads outside `04-input.js`. ⛔ **Audio code**: no "atari", no platform
  RNG, never `audioFrame()` inside `frame()`; a new `heat(` call is red (use
  `heatT()`); `setState()` before the first gesture is dropped.
- ⛔ **`AudioSys.ctx` is null until a key, click or lifted touch**; a gesture is
  a DOM event, not `G.input.keyDown()`. ⛔ **The boot block runs inside the
  harness**; a `Store.set` spy sees only `p0`'s writes, and `p0`'s scope IS the
  root store. ⛔ A `Profiles.select()` staged on a play screen looks like a
  play-step write.
- ⚠ **`_harness.js`**: `{ stub }`, `{ spy }` (`.before` / `.after`),
  `{ mutate }` (throws unless its string is in the build exactly once); a
  function inside `Game`'s closure cannot be reached this way. An added
  `EXPORTS` row is a design decision a plan owes a line.

### The entities and the Dive, as shipped

- ⛔ **`startDive()` DOES FIVE THINGS** — `resetDive()`, the `anchored` filter,
  `resetJump()`, `resetTokens()`, `layRings()` last; a repeated dive re-lays
  the set; a dive pays exactly one thing, a ring, and spends zero draws.
- ⛔ **AN `aloft` ENTITY IS INVISIBLE TO THE SHOT PASS AND VISIBLE TO EVERYTHING
  ELSE.** ⛔ The Reaver is a `Vaulter` subclass and the `MimicShot` a
  `WeaverBolt` one. ✅ The Mimic is KEPT (S6) and still cuts in ONE ROW.
- ⚠ **`RING_POINTS`, `RING_ARC_LANES`, `RING_LANE_STEP` and the five dive
  visual values are PROVISIONAL**; `DIVE_TIME_OD` 4.0 and `DIVE_RINGS_MAX` 6
  are not (a ceiling may only come DOWN).
- ⛔ **Read GDD §6.5 before adding an entity** — nine contract fields, the
  wiring points, the Dive; neither a token nor a ring is on that table.

## Carried tasks — none of them ship's (S13)

- ⛔ **ONE LAB SESSION, when Paul wants it**: `drive`'s tiers, gains and tempo
  (PASS marks) and the FIVE unauditioned cues — `ringTake`, `ringMiss`, the
  Surger tone, the Warden's fuse and `unlock` (candidate A). Its own commit; it
  rewrites `test-cs012-p1.js`'s "no tier" and "no audition mark" assertions in
  place. ⛔ A re-pick is ported verbatim from the lab, never hand-tuned in `C`.
- **Backports**, each a separate manual step: kit-input 0.8.0, kit-menu 0.1.0,
  kit-fx, kit-audio 0.4.0, kit-leaderboard 0.2.1 (`lib/`); `createScores` is
  kit-scores' draft, `createAchievements` kit-achievements' (⚠ its screen is
  the game's wrapper).
- **The unowned list** (plan §0.2's table, carried with its reasons):

| Item | Why it was left |
|---|---|
| The pad-only silence (a pad press is not a user activation) | a platform rule; a line on the itch page is Paul's |
| The Surger tone's 1.106 sample peak | a recipe changes only by a port from `tools/sfx-lab.html` — the lab session |
| The enemy / menu palette and the HUD sizes (⚠ provisional) | tuning, in `SKIPPED-PLAYTESTS.md` |
| `glow-lab.html` — never built (`CLAUDE.md`'s tools list says so since CS018 P1) | the audition is Paul's |
| F1 — the combo readout covers 10 of 233 rim lane-centres | accepted (CS013) |
| F2 — the lifted rim point off-screen on five lanes at the Jump's apex | accepted (CS013); a `JUMP_LIFT` or well change moves `PROMPT_Y`'s arithmetic |
| The four unreachable entity cases (a second Purge on a bolt or a reflection above 0.95; a run starting past 99; a rim Vaulter / aloft Warden on the continuous lane; a biggest-Purge of six) | no board reaches them; a patch that makes one reachable owns it |

- **§19's other at-ship ⚠ notes** (CS018 plan §0.2, noted, not taken): the
  10-minute drift measured on a synthetic track, not the shipped tables; the
  Surger gate at all tiers open, not a per-tier loop; `playerId`'s "once" as
  identity, no mint count; "never pausing" carried by the hash; CS016 P2's demo
  gates mutation-checked in one file. Each is a one-line addition to a later
  plan if Paul wants it.
- ⚠ **`CLAUDE.md` carries no telemetry rule**; whether it earns one is Paul's.

## The tools

- **`tools/perf-probe.js`** — Node + headless Chromium over the shipped
  `file://` build (`CHROME_BIN`, else Playwright's cache, else exit 2 with the
  reason): boot health, bytes per `draw()` (after 300 draws and at steady
  state) and uncapped frame cost at CPU throttle. DATA, never a gate;
  `run-all.js` never runs it; ~27 s. At the CS017 close: budget board **6,001 /
  4,979 B**, empty **1,228 / 131 B**; **4.3 ms p50 at 1×, ~18 ms at 4×**
  (software raster; raster-bound). ⚠ Its bytes are the JIT's as much as the
  source's: quote a reading with its warm-up; each board needs its own page.
- **`tools/reach-probe.js`** — the measurement behind `test-cs015-p3.js`'s
  `REACH` (above).
- `tools/music-lab.html`, `sfx-lab.html` (the porting sources, pinned by text
  identity), `well-lab.html` (⚠ its visual audition has not happened),
  `feel-lab.html`, `serve-lan.js`.

## Open questions (not blocking)

- ⚠ **Should the headroom gate (`test-cs009-p5.js`, D16's limiter-curve model,
  ⚠ provisional) also bound the limiter's INPUT?** Paul's call since CS012; it
  cannot catch a louder track (red needs an input of 152.8). Unanswered at ship.
