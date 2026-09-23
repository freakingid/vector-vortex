# PLANNED-FEATURES-CS018 — 1.0.1: the ten coverage gaps, the VOICE row

**The first post-ship patch. It closes GDD §19's ten open coverage gaps with a
carrier each, in one new test file, and fixes the one latent build defect the
`dist/`-against-`src/` gap turned up; it cuts OPTIONS' VOICE VOLUME row, a
slider that moves nothing; and it ships as `C.GAME_VERSION` 1.0.1 (GDD §9.4,
§10.5, §11.1, §11.7, §12, §15.5, §17, §18, §19).** Nothing in it touches the
simulation.

⛔ **EVERY CLAIM IN THIS DOCUMENT IS MARKED MEASURED OR PREDICTED.** A MEASURED
claim names what was run (§1 lists the probes) and was run at commit
**`43e07f2`**, the CS017 close. A PREDICTED one says so.

⛔ **§0's calls each carry ONE recommendation, and it STANDS unless Paul answers
otherwise** (`CLAUDE.md` rule 3). A build phase builds what the answer column
says (the recommendation while the column says "—"), re-opens none of it, and
records in its last message what it took.

**Baseline for every measurement: commit `43e07f2`.**
- `node build.js` → 26 modules + 3 inlined kit, `dist/vector-vortex.html`
  **856,874 bytes** (836.8 KB), sha256 `702d98989a56b57c…`.
- `node scratchpad/run-all.js` → **85 files passed, ZERO skips, exit 0, 308.8 s
  wall** (`/usr/bin/time`). `../coinless-kit` present.
- `_harness.js`'s `EXPORTS` **218** names (regex over the array, comments
  stripped). `CLAUDE.md` **38,741 bytes**; `STATUS.md` **262 lines**.
- `C.GAME_VERSION` `"1.0.0"`, `package.json` `"1.0.0"`; the one literal pin is
  `test-cs016-p1.js:121`.
- The machine: Node **v24.21.0**, time zone **America/Chicago** (offset 300 min
  at planning), 8 cores, WSL2.
- ⚠ The working tree carries Paul's uncommitted `vector-vortex-human-notes.txt`
  and the untracked `dist/vector-vortex-itch.zip`. ⛔ **No CS018 commit stages
  either** unless Paul asks.

**How the probes ran.** Every probe lived in this session's own scratchpad
directory and is gone. ⛔ **Nothing in this repository's `src/`, `scratchpad/`,
`tools/`, `lib/` or `build.js` was touched** (`CLAUDE.md` rule 3a).
- **Gap probes** (§1.2): small Node scripts over `scratchpad/_harness.js` and
  the shipped `dist/`, one per gap — the heat range, `pulse`'s table, the stick
  through `createInput()`, `drawShot()` against a recording context, the build's
  slices against `src/`, the week key under six `TZ` values with a local-time
  mutant, level 1 through the front door, and the vocabulary scan over the
  page's markup and the package's two `lib/` files.
- **Two stand-in variants** (§1.3): `git clone --shared` copies of `43e07f2`
  with `../coinless-kit` symlinked beside them (so nothing skipped), each with
  ONE edit, **the whole suite run in each**: V1 cuts the VOICE row (Q2-A's
  exact edit), V2 sets `C.GAME_VERSION` to `"1.0.1"`.

**Read for this plan, beyond the prompt's list:** GDD §10.5's OPTIONS lines,
§11.1's bus sentence, §11.7's `pulse` row, §12's first paragraph and §17's item
7 — each because a gap or a call cites it. `src/23-main.js`'s sound rows,
`settingsSnapshot()` and `applySettings()`; `src/16-audio-engine.js`'s
`AUDIO_BUSES`; `src/19-sfx.js`'s bus volumes; `src/20-achievements.js`'s
`isoWeekKey()`; `src/04-input.js`'s `gamepadAxisDelta()`;
`src/14-render-entities.js`'s `shotAlpha()` / `drawShot()`;
`src/13-render-well.js`'s `glowStroke()`; `src/17-audio-tracks.js`'s
`buildPulseTrack()`; `build.js` whole; `scratchpad/_harness.js`, `run-all.js`,
`test-registry.js`'s head; the closed tests each gap cites, at their lines.
From `archive/`, for FORM only, `PLANNED-FEATURES-CS017.md` and
`IMPLEMENTATION-PHASES-CS017.md`. ⚠ **Three history reads, each named:**
`log/CS017.md`'s P3 findings and review (a grep, to learn which ten gaps
`STATUS.md`'s "ten" counted — §0.1); `archive/PLANNED-FEATURES-CS016.md` §1.3
(the level-1 probe's method, which §12 cites); and
`archive/PLANNED-FEATURES-CS009.md`'s A3 row (what Paul decided about the
VOICE bus). Nothing else from `log/` or `archive/`.

---

## ⛔ 0. PAUL'S CALLS — ten, each with one recommendation

| # | The call | Recommendation | ⛔ Answer — Paul |
|---|---|---|---|
| Q1 | **The patch's scope** | **The ten gaps of §1.2 (the nine `STATUS.md` carries plus the page's markup in the vocabulary scan), Q6's build fix, the VOICE row (Q2) and the version (Q3) — nothing else.** Every other carried item stays carried (§0.2) | — |
| Q2 | **The VOICE bus** — Paul's A3 (CS009) shipped the row "live, controlling silence"; no recipe has ever routed to it (MEASURED, grep) | **A — cut the OPTIONS row and the game's `voice` setting; keep kit-audio's bus**, built at unity and never moved. B: keep the row as shipped. C: cut the bus from kit-audio too — a kit edit, a `VERSION` bump, four `AUDIO_VERSION` pins and both labs' BLOCK A, for no audible change. §1.3 V1 | — |
| Q3 | **The version** | **`"1.0.1"`** — a PATCH: one row cut, no save key, board or id touched; the Worker takes any non-empty `game_version` string and stores it (MEASURED, coinless-kit `services/leaderboard/src/scores.js:18`). `package.json` moves with it; `test-cs016-p1.js:121` is rewritten in place (V2: the ONE red); `package-for-itch.sh` is run so the untracked zip is the 1.0.1 build | — |
| Q4 | **Level 1's carrier** (G7) — "a player who moves and fires" needs a driver | **64 time-seeded front-door runs, 16 per mode per half.** Active: fire held, the craft steered through the MOUSE path toward the deepest live enemy's lane at no more than `KEY_SPEED_MAX` lanes a second; every run's first kill ≤ **3.0 s**. Passive: no input; every run's first craft lost in **[6.883 s − one tick, 12 s]**. MEASURED §1.2 G7 | — |
| Q5 | **The week key's time zone** (G6) | **The new file re-runs itself in child processes under `TZ=UTC`, `Pacific/Kiritimati` (+14) and `Pacific/Pago_Pago` (−11)**, each asserting its own offset first; the shipped key identical in all three; a local-reading mutant RED in both non-UTC zones and GREEN under UTC — the gap, shown. MEASURED §1.2 G6 | — |
| Q6 | **`dist/` against `src/`** (G5) — and `build.js`'s `$` hazard | **A — both**: the slice test, and `build.js` injects the script through a FUNCTION replacement (`shell.replace(MARKER, () => script)`), exported as `injectScript()` beside `kitBlock()` so the test drives both. ⚠ Today `shell.replace(MARKER, script)` would rewrite `$&`, `$$`, `` $` `` or `$'` in any module (MEASURED, one line of Node); no module holds one (MEASURED, grep), so the fix moves no `dist/` byte (PREDICTED). B: the test alone — it would catch the day one lands, as a red far from its cause | — |
| Q7 | **Which `INT_*` / `FILTER_*` values to pin** (G8, G9) | **Exactly the four §19's clauses name** — `INT_ATTACK` 0.40, `INT_RELEASE` 2.50, `FILTER_MIN_HZ` 600, `FILTER_MAX_HZ` 18,000 — by literal, each message citing its clause, each mutation-checked. The weights stay as they are (`INT_W_COMBO` is already pinned, `test-cs010-p2.js`) | — |
| Q8 | **`pulse`'s A→B→C** (G2) — and §11.7's "an octave up" | **Assert the sections by the bassline's figure** — `drive`'s method (`test-cs012-p1.js:67`–`:70`) — **changing at exactly bars 0, 12 and 24**, and the heart doubling from A to B (2 → 4 notes a bar). **Restate §11.7's B parenthetical to the data**: the tune sits higher (+5.5 semitones on average, MEASURED) and the bassline leaps an OCTAVE where A's leaps a fifth — "an octave up" read as the melody is not what the table does | — |
| Q9 | **`CLAUDE.md` names `glow-lab.html` in `tools/`**; the file does not exist (MEASURED, `ls`) | **Correct the one line** to say it was never built (ROADMAP assumption 9). Building the lab is Paul's audition, not a patch's | — |
| Q10 | **The shape** | **Two phases, P2 ending in the close** (as every changeset since CS008 has), and **no sixteenth soak**: nothing CS018 builds moves the simulation, and the fifteen soaks staying green with `P1_DETERMINISM_HASH` unmoved is the proof (V1, V2 MEASURED green on every soak) | — |

### Q2 — the VOICE row (the one player-visible change)

⚠ **What ships today** (MEASURED, grep of `src/`): `AUDIO_BUSES` is `master`,
`music`, `sfx`, `voice` (`16-audio-engine.js:52`); `19-sfx.js:24` builds the
voice bus at unity; OPTIONS carries VOICE VOLUME between SFX VOLUME and MUSIC
TRACK; `settings` stores `sound.voice`; no `C.SFX` recipe and no track routes a
node to the bus. **A player who moves the row hears nothing change** — the one
row on any screen that does nothing.

**A — the recommendation.** In `src/23-main.js` only: the `SOUND_ROWS.voice`
row and its place in OPTIONS' items, `"voice"` out of `VOL_BUSES`, `sound`,
`ADJUST`, `settingsSnapshot()` and `applySettings()`'s field list; the A3
comment restated. ⛔ **kit-audio is not edited**: the bus is the kit's, it stays
at the unity `19-sfx.js` builds it at, and nothing ever calls
`setVol("voice")`. ⛔ **`settings` stays v1 with no `migrate`**: removing a field
needs no migration (`CLAUDE.md`, save data), and `applySettings()` reads a
fixed field list, so a 1.0.0 row's `voice` is skipped and every other field
loads (MEASURED by reading the loader; P2's test asserts it on a planted row).
A 1.0.0 build handed a 1.0.1 row finds no `voice` and keeps its default, which
it never used. OPTIONS goes from **eleven rows to ten** in the same seven-row
window.

**Cost — V1, MEASURED: 5 closed files red, all label lists, settings shapes
or navigation by row index** (§1.3). No closed `mutate` string names an edited
line (none threw), and no closed file navigates OPTIONS past the sound rows by
index and stayed green (MEASURED, grep — §1.4).

### Q4 — level 1, re-measured

GDD §12's first paragraph is a MEASURED sentence with no carrier: one CS016
planning probe, 64 runs, and nothing in the suite or `tools/` re-measures it.
This session re-measured it with its own driver (§1.2 G7) and the sentence
holds. The active driver is a stated proxy for "a player who moves and fires":
its top speed is a keyboard player's (`KEY_SPEED_MAX`, 14 lanes a second),
applied through the mouse path so it stops on a lane rather than tapping past
it — ⚠ a first probe that steered by key TAPS oscillated a lane either side of
its target and killed at a median 6.9 s, which is a driver defect and not the
game (MEASURED, then discarded). ⛔ The bounds are §12's own numbers; the test
header writes the driver down.

### Q5 — why three zones and not the machine's

MEASURED (§1.2 G6): on THIS machine (America/Chicago) the closed
`test-cs015-p1.js` already catches a local-time bug — its `00:00:00Z` instants
are the previous evening locally. ⛔ **On any machine at UTC it catches
nothing** (0 of 9 cases red), and that is the gap. The two extremes are
chosen because no daylight saving moves them and a local reading is wrong
there on every day boundary that matters. ⚠ **A Node built without full
time-zone data falls back to UTC silently**, which would make the non-UTC
children vacuous: each child asserts its own `getTimezoneOffset()` at a fixed
instant before anything else (MEASURED here: −840, 660, 0).

---

### §0.1 — findings recorded in `STATUS.md`, not worked around

- ⚠ **`STATUS.md` and `ROADMAP.md` say "ten coverage gaps"; nine were open at
  the close.** CS017 P3's list counted "no played session on all sixteen
  wells", which P4's fifteenth soak closed (MEASURED, `log/CS017.md` grep). Q1's
  tenth is the page's markup, which §19 Quality's at-ship ◐ names and the
  carried list does not.
- ⚠ **`build.js` injects the script with a STRING replacement**
  (`shell.replace(MARKER, script)`), so `$&`, `$$`, `` $` `` and `$'` in any
  module would be silently rewritten in `dist/` (MEASURED: `"a<!--M-->b"
  .replace("<!--M-->", "x$&y$$z")` is `ax<!--M-->y$zb`). No module holds one
  today (MEASURED, grep over `src/` and the three inlined kits). Q6.
- ⚠ **GDD §11.7's `pulse` row says B is "an octave up"**; the melody's mean
  rises 5.5 semitones (A 71.8 → B 77.3 MIDI) and the bassline's B figure
  leaps an octave. Q8.
- ⚠ **`CLAUDE.md`'s `tools/` list names `glow-lab.html`**, which was never
  built. Q9.

### §0.2 — carried items CS018 does not take (Q1)

| Item | Why it stays carried |
|---|---|
| Paul's lab session (`drive`'s tiers and gains; five unauditioned cues) | ⛔ a recipe or gain changes only by a port from a lab; the audition is Paul's |
| Backports (kit-input, kit-menu, kit-fx, kit-audio, kit-leaderboard; kit-scores' and kit-achievements' drafts) | each is a separate manual step, outside the repo |
| The pad-only silence | a platform rule; a line on the itch page is Paul's |
| The Surger tone's 1.106 sample peak | the lab session |
| The palette and the HUD sizes (⚠ provisional) | tuning, in `SKIPPED-PLAYTESTS.md` |
| `glow-lab`'s audition, F1, F2, the four unreachable entity cases | as `STATUS.md` records them |
| Whether the headroom gate should bound the limiter's INPUT | Paul's since CS012; no recommendation has ever been written, and measuring one needs a render this session cannot make |
| Whether `CLAUDE.md` earns a telemetry rule | Paul's |
| ⚠ §19's other at-ship ⚠ notes, not on the carried list: the 10-minute drift measured on a synthetic track, not the shipped tables; the Surger gate at all tiers open, not a per-tier loop; `playerId`'s "once" as identity, no mint count; "never pausing" carried by the hash; CS016 P2's demo gates mutation-checked in one file | noted, not taken (rule 2) — each is a one-line addition to a later plan if Paul wants it |

---

## 1. ⛔ WHAT THIS SESSION MEASURED

### 1.1 MEASURED — the baseline, at `43e07f2`

The header's numbers. The suite's slowest files are unchanged from the CS017
close (`test-cs014-p3.js`, then the fifteenth soak); nothing here re-timed
them.

### 1.2 MEASURED — the ten gaps, each probed

| # | §19 clause (row) | What is missing today | MEASURED at `43e07f2` |
|---|---|---|---|
| **G1** | §17 item 7, heat monotone for n in 1..200 (Quality) | `test-cs007-p2.js:253` loops `l < 200`: the last comparison is `heat(200) > heat(199)` | `heat(n+1) > heat(n)` for **every n in 1..200 inclusive**; `heat(200)` 4.98, `heat(201)` 5.00, finite |
| **G2** | `pulse`'s A→B→C (Audio) | only `drive`'s sections are asserted (`test-cs012-p1.js:70`) | `bassline`'s per-bar figure changes at **exactly bars 0, 12, 24** (36 bars); `heart` 2 → 4 → 4 notes a bar in A / B / C; `tick` changes at 0, 4, 12, 24; the melody's mean A 71.8, B 77.3, C 75.2 MIDI; bar 32's tune equals bar 0's |
| **G3** | the stick proportional (Core) | one deflection and its mirror (`test-cs002-p4.js:163`, `:166`) | through `createInput()` + `pollGamepads()`, **36 deflections** (`GAMEPAD_DEADZONE` 0.15 to 0.95 by 0.05, both signs): `rotate` equals `x × GAMEPAD_SENS × FIXED_DT` exactly (worst error 0); 0.8 against 0.4 is exactly 2× |
| **G4** | the shot faded below `READABILITY_DEPTH` (Quality) | `test-cs002-p3.js:160–164` drives the call path and says it cannot read the alpha | `drawShot()` against a recording context: both passes' `globalAlpha` are `GLOW_WIDE_ALPHA` 0.2 and `GLOW_THIN_ALPHA` 0.95 times `depth / 0.25` below the line — **0 at the throat**, 0.2375 thin at 0.0625, 0.4750 at 0.125 — and full at and above 0.25 |
| **G5** | the concatenated build identical to `src/` (Quality) | the banner scan checks module NAMES (`test-cs002-p1.js:426`) | all **26** `MANIFEST` modules appear verbatim, under their banners, **once each, in `MANIFEST` order**; the **3** kit blocks equal `wrapKitModule()`'s output; with those removed the script is `"use strict";` and whitespace. ⚠ plus §0.1's `$` hazard |
| **G6** | UTC ISO weeks (Meta) | no test pins `TZ` | the nine week-key cases of `test-cs015-p1.js` §6 against a mutant reading `getDay` / `getFullYear` / `getMonth` / `getDate`: red in **0/9 under UTC** (and under `TZ=""`), **4/9 America/Chicago**, **2/9 Pacific/Kiritimati**, **4/9 Pacific/Pago_Pago**, **2/9 Asia/Kolkata**; the shipped key right in all six. Both mutant strings are in the build exactly once. A child run costs **~0.07 s** |
| **G7** | level 1's first seconds (Onboarding) | one CS016 planning probe | 64 time-seeded front-door runs at Start Depth 1, 16 per mode per half, Q4's drivers. **Active: first kill 1.65–2.32 s**, median 2.20 (both modes). **Passive: first craft lost 6.883–10.87 s**, medians 9.2 (both modes). **1.55 s wall**, 21,622 steps |
| **G8** | intensity rises ~0.4 s, falls ~2.5 s (Audio) | `C.INT_ATTACK` / `INT_RELEASE` read by name, never by value (grep) | 0.40 and 2.50; each `C` line is in the build once |
| **G9** | the sweep 600 Hz → 18 kHz (Audio) | `C.FILTER_MIN_HZ` / `MAX_HZ` read by name only (grep) | 600 and 18,000; each line in the build once |
| **G10** | no banned vocabulary anywhere (Quality) | `test-cs008-p6.js:445` scans the SCRIPT only | the page's markup outside the script (1,481 bytes, the module bridge included) and `package-for-itch.sh`'s two `LIB_FILES` scanned with `test-cs008-p6.js`'s list and the `T-####` rule: **clean** |

### 1.3 MEASURED — two stand-in variants, the whole suite in each

| Variant | The one edit | Result |
|---|---|---|
| **V1** | Q2-A in `src/23-main.js` (7 lines; `dist/` 856,874 → **856,656 bytes**) | **80 green, 5 red, zero skips, 309 s.** `test-cs008-p6.js` 1/260 (the sound-row label list); `test-cs008-p7.js` 1/172 (RESET TO DEFAULTS' stored shape); `test-cs011-p2.js` 45/135 (the `DEF` / `GOOD` shapes, VOICE's navigation step, and two `sound.voice` rows of the planted-field table); `test-cs012-p1.js` 6/55 (`toTrack()` steps `right(8)` to MUSIC TRACK and lands one row past it); `test-cs009-p3.js` **THROWS at `:227`** — its `right(8)` at `:194` misses MUSIC TRACK, and its VOICE block (`:245`–`:328`, A3's own assertions) never ran. ⛔ `P1_DETERMINISM_HASH`, `GOLDEN_LANES` and all fifteen soaks green |
| **V2** | `C.GAME_VERSION` `"1.0.1"` | **84 green, 1 red, zero skips, 308 s**: `test-cs016-p1.js:121`, the literal (1/159) |

### 1.4 MEASURED — the greps

- **The VOICE bus has no input**: no `C.SFX` recipe, track layer or
  `connect` names it; its one game-side writer is `volAdjust("voice")` /
  `resetSound()` (`23-main.js:909`–`:935`).
- **No closed file navigates OPTIONS past the sound rows by index and stays
  green under V1**: the files that open OPTIONS and step `right(n)` are
  `test-cs008-p6.js`, `-cs009-p3.js`, `-cs011-p2.js`, `-cs011-p6.js` (stops at
  MUSIC VOLUME, index 5, unmoved) and `-cs012-p1.js`; four are V1's reds. No
  ACHIEVEMENTS-from-OPTIONS press is by index (grep of `test-cs015-*`,
  `-cs016-*`).
- **The vocabulary list lives in ONE file**, `test-cs008-p6.js:426` (nine
  words, the maker's name added at `:440` / `:444`). ⛔ CS018's scan READS it from there
  rather than writing a second copy (`CLAUDE.md` vocabulary).
- **`_harness.js` already exports** `drawShot`, `shotAlpha`, `createInput`,
  `heat`, `MUSIC_TRACKS`, `createAchievements` and `Game` — G1–G10 need no
  `EXPORTS` row (PREDICTED 218 unmoved).
- **`build.js` exports** `MANIFEST`, `KIT_INLINE`, `KIT_INLINE_AFTER`,
  `kitNamespace`, `wrapKitModule`, `build`; not `kitBlock` (Q6 adds it and
  `injectScript`).

---

## 2. THE SHAPE

**Two phases, one session each.**

| Phase | Builds | Calls |
|---|---|---|
| **P1** | The ten gaps: `scratchpad/test-cs018-p1.js`; `build.js`'s `injectScript()` and `kitBlock` export; GDD §19's at-1.0.1 lines and §11.7's `pulse` row; `CLAUDE.md`'s `glow-lab` line | Q1, Q4–Q9 |
| **P2** | The VOICE row cut and V1's five repairs; `scratchpad/test-cs018-p2.js`; the version and its one repair; GDD §10.5 / §11.1; the itch package; **the review and the close** | Q2, Q3, Q10 |

**Why these seams.** P1 moves **no `dist/` byte** (PREDICTED: Q6's fix changes
the injection's form, not its output) and no closed file, so its commit is
pure coverage and a red in it is a red in the new file. P2 is the only phase
that changes what a player sees and the only one that edits closed files, so a
red there is about the row. The version rides with the row because 1.0.1 IS
the row; the close rides with P2 as CS008–CS017's closes rode their last
phase. **Merging them** puts 45 closed-assertion repairs in the commit that
adds ten new carriers; **splitting P2** leaves a phase whose whole content is a
version string and a review.

---

## 3. P1 — the ten gaps

⛔ **One new file, `scratchpad/test-cs018-p1.js`**, seeded above its first
build, header ≤ ~15 lines naming the traps below. PREDICTED **< 6 s** alone
(G7's 1.55 s, three ~0.07 s children, a handful of builds).

- **G1** — `heat(n+1) > heat(n)` for n = 1..200 **inclusive**, the comparison
  count asserted as 200, `heat(201)` finite. ⛔ `test-cs007-p2.js`'s loop is
  NOT edited: its message overstates by one, but no behaviour was replaced, and
  new coverage goes in the new file.
- **G2** — per Q8, off `MUSIC_TRACKS.pulse`: the bassline's per-bar figure
  changes at exactly `[0, 12, 24]`; `heart` doubles from A to B.
- **G3** — per the MEASURED sweep, through `createInput()` and
  `pollGamepads()` (`test-cs002-p4.js`'s `fakeWin` form, written again here —
  a fixture, not the logic under test): every deflection from the deadzone to
  1.0 in 0.05 steps, both signs, exact; doubling a deflection doubles `rotate`.
- **G4** — `drawShot()` against a recording context (the
  `ctx.stroke` capture `test-cs005-p2.js:618` uses) at depths 0, 0.01, and
  quarter steps to 0.25, and at 0.5 and 1: both passes' alpha as MEASURED;
  **one real `Game.draw()`** with a staged shot below the line whose
  `SKIMMER_COLOR` strokes carry the faded alpha. ⛔ Mutation: `shotAlpha(depth)`
  → `1` on `drawShot()`'s `glowStroke` line is red.
- **G5** — per Q6. After one `H.buildGame()` (which rebuilds a stale `dist/`
  — ⛔ trap: read `dist/` only after it): every `MANIFEST` module's
  banner-and-body slice in the script exactly once and in order; `kitBlock()`'s
  output exactly once, straight after `KIT_INLINE_AFTER`'s slice; the residue
  `"use strict";` and whitespace; the page equals `injectScript(shell, script)`.
  ⛔ **Never a re-assembly of `build()`** (`CLAUDE.md`: never inline the logic
  under test) — the claims are slice properties. Non-vacuity: the checker is
  red on a copy of the script with one byte changed in one module, and with
  two modules swapped; `injectScript()` returns a script carrying `$&`, `$$`,
  `` $` `` and `$'` verbatim (red on the string form — log the demonstration).
  ⛔ **`dist/` byte-identical across the fix** (sha before and after, logged).
- **G6** — per Q5. The file spawns `process.execPath` on itself with `TZ` and
  a child flag set; each child prints JSON (its offset at a fixed instant, the
  nine keys shipped, the nine keys under the mutant) and exits. The parent
  asserts each child's offset first (0, −840, 660), then the shipped keys equal
  the want list in all three, the mutant's differ in at least one case in each
  non-UTC zone, and equal it under UTC. ⛔ The mutant is `buildGame({ mutate })`
  over `isoDayIndex()`'s and `isoWeekKey()`'s two UTC lines (each once in the
  build, MEASURED).
- **G7** — per Q4. ⛔ Traps: `Date.now` is WALL time (the frame clock plus a
  base) so each run seeds differently, with a 0–89-step title jitter drawn
  from the test's OWN stream; ⚠ a title idled 20 s enters the demo, so no
  jitter reaches it; MODE is OVERDRIVE then CLASSIC; two live steps before the
  first press.
- **G8, G9** — per Q7: the four literals, each mutation-checked by `mutate`
  on its `C` line.
- **G10** — the page's markup (the `dist/` HTML with the script cut out) and
  each file in `package-for-itch.sh`'s `LIB_FILES` line (read from the
  script, asserted non-empty) scanned with `test-cs008-p6.js`'s word list and
  its maker's-name addition, READ FROM THAT FILE by text (asserted: nine words and
  the addition found), plus the `T-####` rule. Non-vacuity: the scan catches a
  probe built from the list, as the closed file's does. ⛔ **This file writes no
  banned word** — the substring scan and `CLAUDE.md` both forbid a second copy.

**Documents (P1).** GDD §19 gains one **"⛔ at 1.0.1 (CS018 P1)"** line per
moved clause — Core (the stick), Audio (`pulse`, the attack and release, the
sweep's range), Meta (the week key), Onboarding (level 1), Quality (item 7,
the shot's fade, the concat build, the markup) — each ◐ → ✅ with its
`test-cs018-p1.js` line; the at-ship blocks stay as history. §11.7's `pulse`
row per Q8. `CLAUDE.md`'s `tools/` line per Q9. `STATUS.md`: the gap list goes,
the four §0.1 findings are recorded as fixed or restated.

## 4. P2 — the VOICE row, the version, the close

- **The cut** — Q2-A, exactly V1's seven lines, plus the A3 comment restated
  (the bus stays, fed and moved by nothing; OPTIONS has no row for it).
- **V1's five repairs, in place** (§8): label lists and settings shapes drop
  `voice`; a `right(8)` to MUSIC TRACK becomes `right(7)`; ⛔
  **`test-cs009-p3.js`'s VOICE block is REPLACED behaviour** — its assertions
  are rewritten to what 1.0.1 does (no VOICE row; the voice bus at unity and
  never moved), never deleted; `test-cs011-p2.js`'s two `sound.voice` rows
  become "a stored `voice`, valid or not, is ignored and every other field
  loads". ⛔ **Read `test-cs009-p3.js` past `:227` first**: V1 never ran it, so
  its further reds are PREDICTED, not measured. ⛔ **Then re-run the vacuity
  grep** (a closed file can go vacuous without going red — `STATUS.md`).
- **`scratchpad/test-cs018-p2.js`**: OPTIONS' rows by label (ten, no VOICE,
  ACHIEVEMENTS then BACK last) and a traversal of all ten; a planted 1.0.0
  `settings` row with `voice: 2` loads every other field, and the next save
  stores no `voice` and stays `v: 1`; with a recording audio context, no
  `setVol` / gain automation ever reaches the voice bus across an OPTIONS
  traversal, a RESET TO DEFAULTS and `Game.reset()`, while MASTER still moves
  its bus (non-vacuity); a mutant that puts `SOUND_ROWS.voice` back is red.
- **The version** — Q3: `C.GAME_VERSION` `"1.0.1"`, `package.json`, and
  `test-cs016-p1.js:121` rewritten in place with the cause; then
  `bash package-for-itch.sh` (⚠ it overwrites the untracked 1.0.0 zip — that is
  the point) and list the zip.
- **Documents** — GDD §10.5 (the OPTIONS table's row list, "the five rows" →
  four, "Ten rows outgrow" restated to the count, the VOICE sentence) and §11.1
  (the bus sentence: built, fed by nothing, no OPTIONS row); §19 Audio's
  "volume sliders persist" gets its at-1.0.1 line.
- **The close** — review `log/CS018.md` whole; `STATUS.md` reset to the
  post-ship form (version 1.0.1, OPTIONS ten rows, 87 files, the VOICE row off
  the unowned list, the gap list gone); `ROADMAP.md`'s CS018 row to shipped with
  "What CS018 deliberately left"; `DECISIONS.md` one index line per §0 call;
  the log's version entry; the two plan documents to `archive/`. ⛔ **Zero
  skips** (`../coinless-kit` present).

## 5. ⛔ NOTHING OF THIS CHANGESET TOUCHES THE SIMULATION

PREDICTED, and V1 / V2 MEASURED it for P2's edits: every soak, both determinism
files and `GOLDEN_LANES` green with the row cut and with the version moved. P1
adds a test and changes how `build.js` injects a script whose bytes do not
change. ⛔ `P1_DETERMINISM_HASH` 1229033515 and `GOLDEN_LANES` do not move; a
move is a defect.

## 6. ⛔ WHAT A PHASE MUST NOT DISTURB

From `STATUS.md`'s hazards, the ones CS018 comes near:
- **`SEAT_EDGE` matches by indentation luck** — P2 edits `23-main.js` far from
  `update()`'s demo block; nothing is re-indented.
- **Nine CS011 texts are pinned by `mutate`** — V1 threw no `mutate` error, so
  none sits on an edited line (MEASURED). P2 greps again before committing.
- **The OPTIONS shape** — a row goes before BACK, never above TELEMETRY; P2
  REMOVES one, which neither rule forbids. **The seven-row window** still
  scrolls at ten rows.
- **A clock read is a mover** — G7's wall-clock fake is the test's own; G6's
  children never read the wall clock for a key (the instants are literals).
- **A title idled 20 s enters the demo** — G7's jitter stays under 1.5 s.
- **`test-cs008-p4.js` / `-p6.js` scan the whole built file, comments
  included** — P1's `build.js` comment and P2's restated comment carry no
  banned word, no `fillRect` / `strokeRect` and no text call.
- **Every kit `VERSION` bump is a closed-file edit** — Q2-A bumps nothing.

## 7. ⛔ THE BASELINE LEDGER

| Baseline | At `43e07f2` (MEASURED) | CS018 (PREDICTED) |
|---|---|---|
| `P1_DETERMINISM_HASH` | **1229033515** | ⛔ unmoved P1–P2 (V1, V2 MEASURED) |
| `GOLDEN_LANES` | the `9ebd27b` sixteen + `2, 5` | ⛔ unmoved |
| The fifteen soaks | green | ⛔ green, unedited (V1, V2) |
| `state` keys / `tally` / `STATE_FIELDS` | 28 / 23 | unmoved |
| Kill sites / kill lines; `C.SFX` / `SFX_KILL_PITCH` | 4 / 5; 28 / 11 | unmoved |
| `C.ACHIEVEMENTS` ids and pool length | 23 / 19 / 5 | ⛔ **frozen**, unmoved |
| Save keys and versions | `settings` v1 … `onboarding` v1 | ⛔ unmoved — `settings` stays **v1**, no `migrate` (Q2) |
| OPTIONS rows | **11** | **10**, P2 |
| `C.GAME_VERSION` / `package.json` | `"1.0.0"` | **`"1.0.1"`**, P2 |
| `dist/` bytes | **856,874** | P1: identical (sha logged); P2: **~856,650** (V1 856,656 plus the comment) |
| `build.js` exports | 6 | **8** (+`injectScript`, `kitBlock`), P1 |
| `_harness.js` `EXPORTS` | **218** | 218 |
| The suite | **85 files, 0 skips, 308.8 s** | **87** (+`-cs018-p1`, `-p2`), 0 skips at the close; +~10 s |
| `CLAUDE.md` | **38,741 bytes** | ⛔ < 50 KB; ~±50 bytes (Q9) |
| `STATUS.md` | 262 lines + this session's entry | ⛔ < ~400; reset post-ship at P2 |

## 8. ⛔ CLOSED-FILE EDITS, PREDICTED AND MEASURED

| Phase | File | What | Basis |
|---|---|---|---|
| P1 | every closed test | ⛔ **none** | PREDICTED (P1 moves no `dist/` byte) |
| P2 | `test-cs008-p6.js` | `SOUND_ROWS` label list without VOICE | **MEASURED red** (V1, 1 assertion) |
| P2 | `test-cs008-p7.js` | RESET TO DEFAULTS' stored shape without `voice` | **MEASURED red** (V1, 1) |
| P2 | `test-cs011-p2.js` | `DEF` / `GOOD` without `voice`; VOICE's navigation step out; the two `sound.voice` rows rewritten | **MEASURED red** (V1, 45 — one cause) |
| P2 | `test-cs012-p1.js` | `toTrack()`'s `right(8)` → `right(7)` | **MEASURED red** (V1, 6) |
| P2 | `test-cs009-p3.js` | `:194`'s `right(8)` aims at MUSIC TRACK, now index 7; `:324` / `:338`'s `right(8)` scroll the window and are re-read, not assumed; the VOICE block (`LABEL`/`BUSES` at `:245`, A3's `:279`, `:327`, and `Game.reset()`'s "ramps the voice bus back" at `:331`–`:336`) rewritten to 1.0.1's behaviour; the header's row list | **MEASURED** (V1 throws at `:227`); everything past it PREDICTED |
| P2 | `test-cs016-p1.js:121` | the version literal → `"1.0.1"` | **MEASURED** (V2, the one red) |

⛔ **An edit this table does not predict is a finding.** The phase stops,
records it in `STATUS.md` with its cause, and makes the edit only if it
restores the claim the closed test was always making. ⛔ **A fixture is
repaired to restore its precondition, never relaxed.**

## 9. ⛔ ACCEPTANCE CRITERIA

- **§19** — each of G1–G10's clauses ◐ → ✅ in an at-1.0.1 line naming its
  `test-cs018-p1.js` assertion; the hardware halves stay skipped playtests.
- **§17 item 7** — the full 1..200 range asserted.
- **§18** — the shipped package (page, markup, two `lib/` files) inside the
  suite's vocabulary scan.
- **§10.5 / §11.1** — OPTIONS has ten rows, none of them VOICE; the bus is
  built, fed by nothing and moved by nothing; a 1.0.0 `settings` row loads.
- **Quality** — `dist/` asserted slice-identical to `src/`; `build.js`
  injection `$`-safe; ⛔ zero skips at the close; `C.GAME_VERSION` 1.0.1.

## 10. ⛔ WHAT CS018 DOES NOT DO

- **Touch the simulation, a schedule, a heat base, a kill line, a `tally`
  field, a telemetry column, a stats key or a save key's version.**
- **Rename, add or cut an achievement id** — frozen.
- **Edit, bump or backport a kit module** — kit-audio's `voice` bus stays.
- **Retune anything** — every value G8 / G9 pins is pinned AS SHIPPED.
- **Edit a closed test for new coverage** — G1's short loop stays as written.
- **Take any §0.2 item**; **write the itch page, upload, change the
  repository's visibility, or push** — Paul's.

## 11. RISKS

- **K1 — G7's driver is a proxy.** A driver that plays worse would fail §12's
  three seconds without the game changing; the header names it, and Q4 fixes
  it before the build.
- **K2 — G6 depends on the platform's zone data.** Each child asserts its
  offset; a Node without the data is a loud red in the precondition, never a
  vacuous green.
- **K3 — pins on tuning values** (G8, G9) make a later retune a two-place
  edit (the value and the §19 clause's carrier). That is the point: the clause
  names the number.
- **K4 — `test-cs009-p3.js` past `:227` was never run under V1**; its VOICE
  block is A3's own assertions and is rewritten, not repaired. §8 marks it.
- **K5 — P2 overwrites the untracked 1.0.0 itch zip.** Paul uploads the 1.0.1
  one; nothing is lost that `git` holds.
- **K6 — ⛔ zero skips at the close needs `../coinless-kit`** (MEASURED
  present).

## 12. ASSUMPTIONS

- **A1 — §0 stands as recommended unless Paul answers** before the phase that
  needs a call (P1: Q1, Q4–Q9; P2: Q2, Q3, Q10).
- **A2 — no playtest happens**; CS018 adds no `SKIPPED-PLAYTESTS.md` entry,
  because nothing it builds is a judgment only a person could make.
- **A3 — `STATUS.md` and `CLAUDE.md` have room**: 262 lines and 38,741 bytes.
