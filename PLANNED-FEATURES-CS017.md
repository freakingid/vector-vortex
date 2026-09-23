# PLANNED-FEATURES-CS017 — ship: the budget measured, the verdicts, the sweeps, the hundred-run soak

**GDD §17, §18 and §19 closed against the finished game, with no playtest: the
performance budget restated to the board the build can produce and MEASURED by
a headless-Chromium lab in `tools/`, the four source allocators in the draw path
removed, every hardware clause given a headless measure and a
`SKIPPED-PLAYTESTS.md` entry, the Mimic's probation decided on a measurement,
the debug bench kept out of the shipped key map, the legal sweep and the
acceptance-criteria sweep, the version, the credits and the itch package — and
§17 item 12's hundred seeded runs as the fifteenth soak (GDD §14.6, §17, §18,
§19, §21 #6, §23).**

⛔ **EVERY CLAIM IN THIS DOCUMENT IS MARKED MEASURED OR PREDICTED.** A MEASURED
claim names what was run (§1 lists the probes) and was run at commit
**`867ebd1`**, the CS016 close plus Paul's accepted-behaviour commit. A
PREDICTED one says so.

⛔ **§0 IS ANSWERED (Paul, 2026-09-23): every recommendation, S1–S14**; S9
keeps the current credits. Every call carries one recommendation and an answer column. A build phase that reaches an unanswered call it needs STOPS
(`CLAUDE.md` rule 3); the phase prompts in `IMPLEMENTATION-PHASES-CS017.md`
name the calls each needs.

**Baseline for every measurement: commit `867ebd1`.**
- `node build.js` → 26 modules + 3 inlined kit, `dist/vector-vortex.html`
  **852,420 bytes** (832.4 KB).
- `node scratchpad/run-all.js` → **82 files passed, ZERO skips, exit 0, 282 s
  wall** (4 m 42 s, `/usr/bin/time`, MEASURED this session with this session's
  probes running beside it). Run file by file, sequentially: the files sum to
  **285 s**, and the slowest is **`test-cs014-p3.js` at 37.6 s**, then
  `-cs013-p5` 33.5, `-cs008-p8` 32.1, `-cs012-p6` 29.4, `-cs010-p5` 27.5 —
  every file under a third of `run-all.js`'s 120 s per-file timeout.
- `../coinless-kit` is present: `test-cs011-p5.js` and `test-cs012-p3.js` did
  not skip. The Worker was not contacted (§1.6 blocked its host).
- `CLAUDE.md` **38,311 bytes** (77 % of its 50 KB ceiling); `STATUS.md`
  **313 lines** before this session's edit; `_harness.js`'s `EXPORTS` **218**
  names (MEASURED by regex over the array, comments stripped — it agrees with
  `STATUS.md`).
- The GitHub repository `freakingid/vector-vortex` is **PUBLIC** (MEASURED,
  `gh repo view --json visibility`: `"PUBLIC"`; description, homepage and
  topics empty). S10 turns on it.

**How the probes ran.** Everything lived in this session's own scratchpad
directory and is gone. ⛔ **Nothing in this repository's `src/`, `scratchpad/`,
`tools/` or `lib/` was touched** (`CLAUDE.md` rule 3a); the files this session
writes are its two documents and `STATUS.md`.
- **A browser probe** (§1.2–§1.4): the shipped `dist/` file in
  `chrome-headless-shell` 1243 (Playwright's cached build, already on this
  machine, `--disable-gpu`, so canvas rasterises on the CPU), driven over the
  DevTools protocol from plain Node 24 (its built-in `WebSocket`; no npm
  package). It loads the file from `file://`, presses Space three times, then
  stages **the budget board** — 16 enemies (one of each Overdrive kind plus
  repeats), 24 shots (`SPREAD_SHOT_MAX`), 2 tokens, the combo readout at ×4 and
  a prompt mid-fade — and measures (a) bytes allocated per `Game.draw()` with
  V8's sampling heap profiler **counting collected objects**, attributed to
  the build's functions, (b) frame intervals under `Emulation.setCPUThrottlingRate`
  1× / 4× / 6×, vsync-capped and uncapped. The host is an **Intel i7-9700
  (2019 desktop), 8 cores, WSL2**.
- **A soak-cost probe** (§1.5): the closed soaks' four-clause hunter
  (`test-cs016-p4.js`'s `drive()`, copied into the probe) played from the boot
  title to game over and RESTART, under the wall-clock `Date.now` fake, over a
  staged Start Depth record, per mode and Start Depth, timing each run.
- **A Mimic probe** (§1.7): that session from Overdrive Start Depth 17, twenty
  runs per driver, with `killSkimmer` spied to name what killed the craft, and
  every entity instance counted by class — once with the hunter's MimicShot
  dodge clause and once without it.
- **An itch probe** (§1.6): `package-for-itch.sh` in a clone, then the same
  three files staged by hand, served on `127.0.0.1`, loaded in the headless
  browser with `*coinlessgames.com*` blocked.
- **Six stand-in variants** (§1.8): `git clone --shared` copies of `867ebd1`,
  each with ONE edit, **the whole suite run in each**. ⚠ In a clone there is no
  sibling `../coinless-kit`, so `test-cs011-p5.js` and `test-cs012-p3.js` SKIP
  there; that is the clone's location, not the edit.
- **Greps** (§1.9) for the legal vocabulary over every tracked file, `mutate:`
  pins on the lines CS017 would edit, the debug actions' closed presses, the
  `.filter(` sites on the step path and the credits screen's arithmetic.

**Read for this plan, beyond the prompt's list:** `src/23-main.js`'s
`ACTION_KEYS`, `DEBUG_SPAWN_ACTIONS`, `spawnRow`, `runAction`, `draw`, `frame`,
`startGame` and the `SCREENS.credits` row; `src/13-render-well.js`'s
`drawPoly`, `glowStroke`, `drawText`, `projectPoly`, `drawWell`;
`src/14-render-entities.js`'s `drawShot`, `entityScratch`, `entityPoints`,
`drawToken`, `TOKEN_GLYPHS`; `src/22-onboarding.js`'s `drawPrompt`;
`src/03-wells.js`'s `screenPos`; `src/09-collision.js`'s `collideSkimmer`,
`killSkimmer`; `src/15-render-hud.js`'s `drawMenu`; `src/10-powerups.js`'s
`dropToken`; `scratchpad/_harness.js`, `run-all.js`, `test-cs016-p4.js`'s driver
and session, `test-registry.js`'s head. `SKIPPED-PLAYTESTS.md`'s **headings
only** (so the entries this plan asks for do not duplicate its 51 entries).
From `archive/`, only `PLANNED-FEATURES-CS016.md` §0–§2 and §10–§15 and
`IMPLEMENTATION-PHASES-CS016.md`'s head and P4, for their FORM. ⚠ **Two
history reads, both greps:** F2 and the Surger tone's 1.106 peak are named in
`STATUS.md`'s unowned list and defined in no live document, so their
definitions were read from `log/CS013.md` (F1, F2) and
`archive/PLANNED-FEATURES-CS010.md` §1.6 (the peak). Nothing else from `log/`.

---

## ⛔ 0. PAUL'S CALLS — fourteen, each with one recommendation

Each is a call the GDD does not settle, with its measurement and one
recommendation. ⛔ **A build phase builds the answer in the right-hand column and
does not re-open it.** ⛔ **Paul does no playtests** (2026-09-16): no call below
waits on one, and every clause only a person could judge gets a
`SKIPPED-PLAYTESTS.md` entry and ships at its shipped value.

⚠ **CS017 IS THE FIRST CHANGESET WHOSE ACCEPTANCE CRITERIA NAME HARDWARE THE
PROJECT WILL NEVER TOUCH.** GDD §17's budget ("60 fps … on a 2019 mid-range
laptop and a 2021 mid-range phone") and eight §19 clauses ("verified on every
device", "by ear on hardware", "unmistakable", "audible", "60 fps … on both
targets") cannot be closed by the method they name. S1 is the route for all of
them at once; S2–S4 are the budget's own numbers.

| # | The call | Recommendation | ⛔ Answer — Paul |
|---|---|---|---|
| S1 | **The route for every hardware clause** (§17 budget; §19 Core's device clauses, Overdrive's "unmistakable", Audio's "audible" / "by ear", Quality's "60 fps on both targets") | **A — measure the half a machine can measure, headless, and skip the half only a person can judge**: (a) `tools/perf-probe.js`, a Node + headless-Chromium lab over the shipped `file://` build (frame cost and bytes per frame on the budget board, at CPU throttle); (b) a counter-based frame-budget gate in the suite; (c) a headless traverse-and-stop per device; (d) one `SKIPPED-PLAYTESTS.md` entry per remaining judgment; (e) each §19 clause reworded to say which half is MEASURED and where the other half is recorded. §1.2–§1.4 | **A** — measure + skip, as recommended (Paul, 2026-09-23) |
| S2 | **The budget's board** — §17 says "16 enemies, 8 shots, 2 tokens and full particles" | **Restate it to the board the build can produce**: 16 enemies (`ENEMY_CAP`), **24 shots** (`SPREAD_SHOT_MAX`, the cap in force — MEASURED reached, CS013), 2 tokens (`MAX_TOKENS`), the combo readout, a prompt mid-fade and a death's fragments. ⚠ "Full particles" names nothing: the build has no particle system (MEASURED, grep) | **As recommended** — 16 / 24 / 2, the readout, a fading prompt, a death's fragments; "full particles" dropped (Paul, 2026-09-23) |
| S3 | **"No per-frame allocation in the hot path"** — MEASURED 8.2 KB per `draw()` on the budget board | **A — remove the four source-level allocators in the draw path** (`projectPoly`, `drawShot`'s pair, `drawText`'s font string, `drawPrompt`'s fade colour; V4 MEASURED the result: 8.2 → 6.2 KB, and 1.8 KB → 0.18 KB on an empty board), **restate the rule to what a source can promise** — no allocating expression on the draw path — and record the engine's residue as the tool's number. ⛔ The step path's end-of-frame `.filter()` is a `CLAUDE.md` INVARIANT and is not touched. §1.3 | **A** — the four sites fixed, the rule restated (Paul, 2026-09-23) |
| S4 | **What number stands for "60 fps on the targets"** | **A — no pass/fail threshold on a borrowed machine**: the lab reports the budget board's uncapped frame cost at 1× and 4× CPU throttle into GDD §17 as MEASURED data (today **4.4–4.7 ms and 18.4–20.1 ms**, two passes), the suite gates canvas WORK per frame by counter, and "on a 2019 laptop and a 2021 phone" becomes a skipped playtest. §1.4 | **A** — report, don't gate (Paul, 2026-09-23) |
| S5 | **§17 item 12's hundred-run soak against `run-all.js`'s 120 s per-file timeout** | **A — ONE new file, the fifteenth soak: 100 time-seeded runs to game over through the front door, 50 per mode, Start Depths spread over each mode's list, a per-run fire-hold drawn from the soak's own seed**, every played step checked for exception, NaN and each array inside its cap in force — ⛔ **MEASURED under 60 s on this machine before it is committed** (PREDICTED 45–70 s from §1.5: 0.19–1.02 s a run on average, 2.64 s the longest single run) | **A** — one file, 100 runs, under 60 s (Paul, 2026-09-23) |
| S6 | **The Mimic's probation verdict** (GDD §21 #6) — and prompt row 11 and the shipped id `mimic_kill` with it | **A — KEEP IT: the probation closes on a measurement**. The player the probation is about — one who trusts their own shots — is the no-dodge driver, and for it a reflection kills **0.125** of the time, **below the Weaver bolt (0.194) and the Warden (0.139)**; `MIMIC_APEX`'s ≥ 0.45 s bound stands; the ask stays in `SKIPPED-PLAYTESTS.md`. §1.7. ⚠ The cut is priced (V1: 6 files) | **A — KEEP.** The probation closes on the measurement; the ask stays in `SKIPPED-PLAYTESTS.md` (Paul, 2026-09-23) |
| S7 | **The seven debug spawn actions** (Paul's H5) — and `w` | **B — out of the shipped key map, behind one flag**: `C.DEBUG_KEYS` `false`; the six spawn digits, `0` and `w` are bound only when it is `true`; the functions, the bench flag and Meta's gate stay. ⚠ **Today a stray digit silently makes a run ineligible** — no row, no submit, no achievement, and nothing on screen says so (MEASURED, grep). Closed cost MEASURED: V2 14 files, V3 17 (§1.8) | **B** — all eight behind `C.DEBUG_KEYS` (`false` shipped) (Paul, 2026-09-23) |
| S8 | **Ship's version number** | **`"1.0.0"`**, set at the close, with `test-cs016-p1.js:120`'s literal rewritten in place and `package.json`'s `"0.0.1"` aligned (V5 MEASURED the red set) | **`"1.0.0"`**, `package.json` aligned (Paul, 2026-09-23) |
| S9 | **`C.CREDITS_LINES`** — Paul replaces them | **Paul writes them in this column**; the phase ports them verbatim. MEASURED limits: **≤ 7 lines** (the VERSION line is the 8th; a 9th info line puts BACK at y 700–730, off the canvas) and **≤ 66 characters a line**; ⛔ each passes the build's SUBSTRING vocabulary scan — "WEB" inside any word is red (a `WEBSITE` line would fail) | **Keep the current two** — `"VECTOR VORTEX"`, `"COINLESS GAMES"` (+ VERSION); P3's credits step moves nothing (Paul, 2026-09-23) |
| S10 | **The legal sweep's reach** (GDD §18) — the repo is PUBLIC | **B — Paul makes the GitHub repository private before the itch page goes live.** The shipped package and `README.md` are MEASURED clean; 8 live files and 6 closed records name the original or its maker, 38 lines in the live ones (§1.9), and §18.1 says "docs". One setting, no file edit, nothing left behind. ⚠ A and C priced below | **B** — Paul makes the repository private before the itch page goes live; nothing in the repo moves (Paul, 2026-09-23) |
| S11 | **Audio's "filter sweep audible end to end"** — the document's one ✗ (Paul's D6) | **A — restate the clause to what ships**, as N1-A did for §12: the sweep maps the director's `[0, 1]` onto 600 Hz → 18 kHz, and the played maximum is recorded (0.6860, ~6.2 kHz); nothing is rescaled. The row then closes met | **A** — restate the clause; nothing rescaled (Paul, 2026-09-23) |
| S12 | **`package-for-itch.sh` cannot run on this machine** — `zip` is absent | **A — fall back to `python3 -m zipfile -c` when `zip` is missing** (MEASURED: `zip` absent, `python3` present; a Python-made zip of the same three files served and ran). One guarded line | **A** — the `python3 -m zipfile -c` fallback (Paul, 2026-09-23) |
| S13 | **STATUS's unowned list at ship** | **Ship owns none of it**; each item is left with its reason (§0.2's table) and carried to the post-ship `STATUS.md` | **Ship owns none** (Paul, 2026-09-23) |
| S14 | **Where the close leaves the project** | **CS017 closes the ROADMAP** — no CS018 row is written; `STATUS.md` resets to a post-ship file (what a patch must obey, the frozen ids, the carried tasks); the planning documents move to `archive/` as usual | **CS017 closes the ROADMAP**; no CS018 row (Paul, 2026-09-23) |

### S1 — the route for every hardware clause

⛔ **The rule this obeys:** "Frame-budget gates are counter-based, never
wall-clock" (`CLAUDE.md`), and "a lab in `tools/` is NOT a playtest: building
one for Paul is allowed, and its results port in as data" (`CLAUDE.md`,
STATUS format).

**MEASURED that the route exists on this machine** (§1.2): the shipped file
boots in headless Chromium from `file://`, reaches the title, and three Space
presses reach Overdrive level 1 in play with the audio context open, **zero
exceptions**; the only console errors are the leaderboard bridge's CORS refusal,
which is `EXTERNAL-FILES.md` rule 2 working as designed.

| Clause | MEASURED half (route) | Skipped half |
|---|---|---|
| §17 "60 fps … 2019 laptop, 2021 phone" | `tools/perf-probe.js` frame cost at 1× / 4× (S4); the suite's canvas-work gate (P1) | the two named devices |
| §17 "no per-frame allocation" | the lab's bytes per `draw()`, attributed; the four source sites (S3) | — |
| §19 Core "rim movement proportional on mouse, gamepad, touch; keyboard tap/hold" | ✅ asserted headless per device path, per the headers of `test-cs002-p1.js` (mouse, keys) and `-p4.js` (touch, gamepad) — PREDICTED from the headers, P3's sweep reads the assertions | feel |
| §19 Core "traverse-and-stop verified on every device" | **NEW, P2**: per device, through the real input module, from a lane traverse a third of the well and come to rest within `HIT_LANE_TOL` of the aimed lane centre after the snap (GDD §9's requirement, verbatim). ⚠ **No closed test asserts it today** (MEASURED, grep for "traverse") | on hardware |
| §19 Overdrive "unmistakable airborne state" | ✅ the three channels asserted (CS012) | "unmistakable" |
| §19 Audio "no audible drift", "audible end to end", "by ear on hardware" | ✅ drift headless; S11 for the sweep; the headroom gate for the tone | by ear |
| §19 Quality "60 fps under budget on both targets"; "plays from `file://`" | the lab; ✅ **`file://` MEASURED in Chromium this session** | Firefox and Safari (⚠ not installed here — MEASURED: the Playwright cache holds Chromium only) |

**The three shapes priced.**
- **A — the route above** (recommended). Cost: one tool (~250 lines of Node,
  PREDICTED from this session's three probes), one counter gate, one device
  test, ~6 `SKIPPED-PLAYTESTS.md` entries, and §17/§19 wording.
- **B — reword every hardware clause to "skipped" and measure nothing new.**
  Cheapest, and it throws away a measurement this session proved available:
  the budget board is at 20.1 ms under 4× throttle, which is exactly the kind
  of fact ship should know.
- **C — a wall-clock frame gate in the suite.** ⛔ Rejected: `CLAUDE.md` forbids
  it, and a suite run on a loaded machine would flap.

⚠ **The lab needs a Chromium binary** it does not ship. It looks for
`CHROME_BIN`, then Playwright's cache, and when neither exists it says so and
exits nonzero — ⛔ never a silent pass. It is a tool: `run-all.js` never runs it.

### S2 — the budget's board

MEASURED (§1.3, §1.4) on the board S2 names. "8 shots" is `SHOT_MAX`, which is
Classic's cap and Overdrive's without Spread; Spread's cap in force is 24 and
CS013 MEASURED the rack reach it on a played board. **A budget measured at 8
shots under-states Overdrive's worst frame by the 16 shots that are 32 of its
144 strokes** (MEASURED: 144 strokes a `draw()` at 24 shots, 112 at 8).
"Full particles" names nothing in the build — a death's fragments are the only
effect, and they are drawn at most once, on a dead craft (a §17 wording defect,
recorded in `STATUS.md`).

### S3 — allocation, measured in the real engine

⛔ **Node's harness cannot answer this.** Its canvas is a `Proxy` whose traps
box every double they store, so the first Node measurement attributed its
bytes to the stub (MEASURED, then discarded). The numbers below are Chromium's,
on a real `CanvasRenderingContext2D`.

| Board (Chromium 1243, `Game.draw()` ×2000) | HEAD | V4 (four sites fixed) |
|---|---|---|
| Overdrive L23: 16 enemies, 24 shots, 2 tokens, ×4, prompt fading | **8,200 B** | **6,196 B** |
| Overdrive L23: 16 enemies, 8 shots, 2 tokens | 6,680 | 5,005 |
| Classic L23: 16 enemies, 8 shots | 5,046 | 3,403 |
| Classic L23: empty board, the HUD | **1,819** | **184** |

**What allocates at HEAD, by source** (MEASURED attribution; the first two are
on EVERY frame, menus included):
1. **`projectPoly()`** — two fresh arrays of fresh `{x, y}` per `drawWell()`:
   **~1,560 B a frame**.
2. **`drawText()`** — `size + "px " + C.TEXT_FONT_FAMILY` per call: ~80 B a
   frame on the HUD.
3. **`drawShot()`** — `[_shotHead, _shotTail]` per shot (F4): ~280 B at 24.
4. **`drawPrompt()`** — one `rgba(…)` string per frame of a fade.
5. **`entityPoints()`** — ⚠ **~5–6 KB on the full board and NOT a source
   allocation**: its scratch is cached per polygon and its body allocates
   nothing. The bytes are the engine's (double results boxed). ⚠ A
   double-typed scratch initialiser (`{ x: 0.5, y: 0.5 }` at all 32 sites) did
   **not** move them (V4b, MEASURED identical to V4). Not planned.

⛔ **And on the step path, BY RULE**: `update()` allocated ~650 B a step on a
live Overdrive board, most of it the end-of-frame `.filter()` on `enemies`,
`shots` and `tokens` (four sites, MEASURED grep) that `CLAUDE.md`'s entity
lifecycle makes an INVARIANT ("remove with an end-of-frame `.filter()`; never
splice mid-loop"). ⛔ **§17's sentence and that invariant disagree, and the
invariant wins** — S3's restatement scopes the budget sentence to the DRAW path.

**Shapes.** **A** (recommended): the four fixes (V4's edits, §1.8, suite
result in the V4 row), the restatement, the tool's number recorded. **B**:
also chase the engine residue (a typed-array point store behind every
`entityPoints` consumer) — a renderer refactor at ship, rejected. **C**: touch
nothing and reword — leaves 1.6 KB on every menu frame that three lines remove.

⚠ **Is 8 KB a frame a frame-rate problem?** PREDICTED not: ~0.5 MB/s of
short-lived garbage is a young-generation scavenge every few seconds, each
sub-millisecond. The tool records it; nothing here claims otherwise.

⛔ **S3 addendum — ANSWERED (Paul, 2026-09-23, after P1).** P1 found three
more draw-path allocators S3 did not name (`STATUS.md`, `log/CS017.md`). ONE
is decided: **`wellBandColor()`'s `for (const band of C.BAND_COLORS)` becomes
an indexed loop — a rewrite, not a cache** (the function is pure, so no state
and no hash moves), asserted as P1's four are, by an observable its old line
fails (no array iterator is taken). ⛔ **Second addendum — ANSWERED (Paul,
2026-09-23, after P2): CACHE the rest.** The HUD's score / level / combo
strings and the game-over screen's three lines are built once per VALUE (the
value is the cache's key, compared by identity), so §17's rule is met whole;
asserted by a counting value object read on the first frame only, each old
line mutation-checked red, and the played-session hash unmoved.

### S4 — the number that stands for "60 fps"

MEASURED (§1.4), the budget board live, `--disable-gpu` (software raster):

| CPU throttle | vsync-capped: frames / 6 s, p50 interval | uncapped: fps, p50 frame | JS per step (update + draw) |
|---|---|---|---|
| 1× | 361, **16.7 ms** | 209.5 fps, **4.7 ms** | 0.80 ms |
| 4× | 221, 33.3 ms | **49.8 fps, 20.1 ms** | 3.25 ms |
| 6× | 166, 33.4 ms | — | 6.39 ms |

A second uncapped pass over the budget board alone, on the idle machine: **4.4 /
8.9 / 13.6 / 18.4 ms at 1× / 2× / 3× / 4×** (223 / 110 / 73 / 54 fps) — linear
in the throttle, crossing 16.7 ms near **3.6×**; the two passes agree within
~9 % (4.7 against 4.4, 20.1 against 18.4). The empty play board costs 2.7 ms (1×) and 11.4 ms (4×) uncapped; **the budget
board with ONE glow pass instead of two costs 1.9 ms and 8.3 ms**. So ⚠ **the
frame is raster-bound, not script-bound**: JS is 3.25 of 20.1 ms at 4×, and GDD
§10.2's two-pass `lighter` glow is ~60 % of the budget board's raster in
software. ⚠ PREDICTED: a 2021 mid-range phone rasterises a 2D canvas on its GPU
(Chrome on Android accelerates canvases this size), so the software figure is
pessimistic; 4× on this desktop is the conventional stand-in for a mid-tier
phone's CPU, and nothing here measures a phone's GPU.

**Shapes.** **A** (recommended): report, don't gate — the lab's four numbers
land in §17 as MEASURED data, the counter gate holds the WORK (strokes, text
calls) at the MEASURED ceiling, the devices are skipped. **B**: a pass/fail
threshold (e.g. "uncapped ≥ 60 fps at 3×") — ⚠ a number chosen on one borrowed
desktop is a guess about two devices, and 4× already fails it. **C**: a
low-end glow switch (one pass) — ⛔ a new design surface and a §10.2 change;
not recommended at ship, recorded as the lever if a playtest ever says so.

### S5 — the hundred-run soak

MEASURED (§1.5): a run to game over through the front door costs **0.19–1.02 s** on average (2.64 s the longest single run)
on this machine — 73–142 µs a step, 2,600–9,900 steps a run with the hunter
holding fire 2,000–9,000 steps — and a build costs ~22 ms. Every closed soak
that plays "seeded runs to game over" plays **twenty** (`-cs003-p5` …
`-cs007-p5`, `-cs008-p8`; MEASURED grep) "at a closing phase's budget", so
**§17 item 12's hundred has never been met in one file**.

| Shape | PREDICTED wall | Margin to 120 s |
|---|---|---|
| **A — one file, 100 runs, 50 per mode, Start Depths spread, fire-hold drawn per run** (recommended) | 45–70 s | ⛔ must MEASURE < 60 s before commit |
| B — two files of 50 (a fifteenth and a sixteenth) | 25–40 s each | wide; ⚠ two files for one claim, and `STATUS.md` counts soaks by file |
| C — restate item 12 as "summed over the suite" (6 × 20 Classic runs) | 0 | ⚠ no Overdrive run counts, and the sum was never asserted as one claim |

⚠ **A time-seeded run held to the same fire length lands on the same level**
(MEASURED: five Classic runs, all level 9; five Overdrive, 6–9) — a hundred
copies of one run prove little. The hold length drawn per run from the soak's
own seed is what spreads the deaths (PREDICTED); P4 asserts the spread
(non-vacuity: at least N distinct death levels per mode).
⛔ **A title idled 20 s enters the demo** (`STATUS.md`): the soak presses within
20 s at every title visit.

### S6 — the Mimic

MEASURED (§1.7): Overdrive, Start Depth 17, twenty time-seeded runs per driver,
~10,000 steps a run, reaching levels 17–45.

| | Hunter WITH the dodge clause (the soaks', `attractDrive()`'s) | Hunter WITHOUT it ("trusts its own shots") |
|---|---|---|
| Deaths, all causes | 153 | 150 |
| … by a reflected shot | **48 (31 %)** | **28 (19 %)** |
| … by a dive's Thorn strike | 73 | 89 |
| Reflections sent back | 175 | 232 |
| **Kills per instance** — MimicShot | **0.274** | **0.125** |
| — Weaver bolt | 0.188 | 0.194 |
| — Warden (a Ward absorbing it counted) | 0.156 | 0.139 |
| — Surger | 0.040 | 0.023 |

**What decides the probation without a playtest.** §14.6 names the risk
exactly: "players read their own bullets as safe and reversing that betrays a
deep expectation". The player who reads them as safe is the no-dodge driver,
and for that player **a reflection is less lethal per instance than two things
the game already ships unquestioned**; and `MIMIC_APEX`'s bound gives every
reflection ≥ `SURGE_TELEGRAPH` of flight (CS013, asserted). That is the
recommendation's basis.

⚠ **A finding the recommendation does not hide:** the DODGE clause makes it
**worse** for the bot — 0.274 against 0.125, the most lethal per instance of
anything on the board. The clause steers one lane away at keyboard speed while
the hunt keeps pulling back toward the deepest target; a bot is not a person,
and nothing here claims "LEAVE THE LANE" (row 11's text) is wrong advice for a
human. ⚠ But `attractDrive()` ports the same clause (plan K5, CS016), so the
demo shows a dodge the probe measured as the worse policy. Recorded in
`STATUS.md`; no call is made on it here — a driver change is not a ship item
and would move nothing a player owns.

**The cut, priced (V1, MEASURED).** Deleting the one row turns **6 files red**:
`test-cs012-p2.js` (3 assertions — the written-out Overdrive table and a
fixture keeping "the Mimic's row"), `-cs013-p3.js` (3, the same),
`-cs013-p4.js` and `-cs013-p5.js` (both THROW — their `mutate` pins the row's
text), `-cs014-p3.js` (1), `-cs016-p4.js` (15: row 11 never fires, "all twelve
exactly once"). ⚠ And `mimic_kill` becomes unearnable for a new player while
its id stays frozen; `test-cs015-p3.js` stays green because `REACH` is data —
⛔ a cut owes a `REACH` re-measure and a report on that row (`STATUS.md`).

### S7 — the debug bench

MEASURED: the bench is **eight bindings** in `ACTION_KEYS` — `1`–`6`, `0`
(`spawnRow`) and `w` (`cycleWell`); `t` and `e` are telemetry, have OPTIONS
rows, touch no simulation and are not part of H5. `runAction()` calls
`Meta.benchUsed()` for all eight in play, and ⚠ **nothing draws the bench
flag** (the one call site; `15-render-hud.js` never reads it): a player who
brushes `1` loses the run's row, its submit and its achievements, silently.

| Shape | Closed files red (MEASURED) | What it keeps |
|---|---|---|
| A — unbind the seven spawn actions, keep `w` | **14** (V2): `-cs004-p1` … `-p4`, `-cs005-p2`, `-p3`, `-cs007-p3` (staging by digit; three THROW), `-cs011-p3`, `-p4`, `-p5`, `-p6`, `-cs012-p3`, `-cs015-p2` (the bench flag's own proofs press `1`), `-cs016-p2` (digits as demo enders) | `w` ships |
| A′ — unbind all eight | **17** (V3): A's 14 + `-cs002-p1` (4 — ⚠ including §17 item 1's 10,000-tick determinism hash, whose recorded event list presses `w` every 401 ticks), `-cs006-p1` (1), `-cs008-p7` (3, the GAMEPAD page's navigation; ⚠ cause not read — P2 reads it) | nothing |
| **B — all eight behind `C.DEBUG_KEYS` (`false` shipped)** (recommended) | **PREDICTED the same 17**, repaired two ways: the staging and bench-flag files rebuild with the flag flipped by `mutate` — restoring their precondition, "a bench exists" — and `-cs016-p2`'s ender list rewrites the eight keys from "ends it" to "unbound in the shipped build" | the whole bench, one constant away, for the `SKIPPED-PLAYTESTS.md` asks that name digits |
| C — ship as is | 0 | the silent-ineligibility hazard |

⚠ Under B the bench flag and `Meta.benchUsed()` become unreachable in the
shipped build; they are kept, not deleted (`CLAUDE.md` rule 7: no unprompted
refactor), and the closed tests still prove them in a flagged build.

⛔ **S7 addendum — ANSWERED (Paul, 2026-09-23, after P2): `w` stays BINDABLE
in the shipped build.** P2 found that CONTROLS refuses `w` only because it was
a named action; unbound, it is a free key. No code moves: `reservedKey()`
still refuses every digit and every key in force, and a profile that binds `w`
loads its KEYBOARD page as defaults in a flagged dev build (dev only).

### S10 — the legal sweep's reach

MEASURED (§1.9): **the shipped package is clean** — `index.html`,
`lib/kit-names/kit-names.js`, `lib/kit-leaderboard/kit-leaderboard.js` carry
none of §18's words (the build's four "web" substrings are the four `webkit`
the closed scan excepts; its eight "minter" hits are `vaultRimInterval`, and
"Minter" is not on the list), and `README.md` names nothing (its one "Web" is
"Web Audio"). ⚠ **The repository is public**, and §18.1 reads "no Atari marks
anywhere — code, comments, docs, marketing". Live documents name the original
or its maker ("Tempest", "Atari", "TxK", "Minter") on **38 lines across 8
files** (the GDD 16, CLAUDE-AI-PROJECT-INSTRUCTIONS 5, DECISIONS 5, CLAUDE.md 3,
the two tests' ban lists 6, RATIONALE 2, STATUS 1); closed records in `log/`
and `archive/` in 6 more files.

- **A — sweep the live prose, keep the ban lists.** Rewrite each mention that
  is not a list of what is banned to "the 1981 arcade original" / "its 1994
  sequel"; the tests' `WORDS`, CLAUDE.md's vocabulary rule and GDD §3.1/§18
  must name what they ban and stay. ⚠ Residue: those lists, §18's own
  paragraph, and every closed record (not swept — correcting one falsifies it,
  ROADMAP's rule). Cost: ~30 lines of docs.
- **B — the repository goes private** (recommended). Paul's one setting; no file
  edit, no residue, nothing in the game depends on the repo's visibility
  (MEASURED: the build, the boards and the itch package read nothing from
  GitHub). ⚠ If the GPL release is meant to be public, A is the fallback and
  C its complement.
- **C — restate §18.1 to the product and its marketing.** The docs are a design
  record; ⚠ it narrows a legal rule by editing the rule.

⚠ **The itch page's own copy is outside the repo** (§18.6): no file here can
scan it. It is listed in §13 as Paul's.

### S11 — the filter sweep

MEASURED across CS010–CS014 and unchanged since (no director input moved in
CS015–CS016): the highest played reading is **0.6860** (CS013 P5, ~6.2 kHz of
18 kHz); `test-cs012-p6.js` asserts the maximum stays below 1. **A** restates
the clause (recommended; D6 stands, nothing is rescaled, the row closes met on
the restated clause). **B** ships with the ✗ — the one unmet criterion at
ship. **C** retunes the weights — ⛔ D6 already refused, and nobody will hear it.

### S12 — the package

MEASURED: `bash package-for-itch.sh` in a clone builds, stages, and fails at
line 33, `zip: command not found`. The same three files zipped by Python's
standard library (285,575 bytes), served over `http://127.0.0.1`, boot to the
title with `window.KitLeaderboard` an object exporting `create`,
`validateName`, `VERSION`, `NAME_CHANGE_NOTICE`, **zero exceptions and zero
console errors**, and — with `*coinlessgames.com*` blocked — nothing contacted
at boot. **A** (recommended): `command -v zip || python3 -m zipfile -c …`.
**B**: document `zip` as a prerequisite (Paul installs it). **C**: a zip writer
in Node (no dependency, ~60 lines) — more code than the problem.

### §0.1 — findings recorded in `STATUS.md`, not worked around

- ⚠ **GDD §17's budget names "full particles"**; the build has no particle
  system. A wording defect; S2 decides the sentence.
- ⚠ **GDD §17's "no per-frame allocation in the hot path" contradicts the
  ⛔ end-of-frame `.filter()` invariant** on the step path. S3 decides it; the
  invariant is not touched.
- ⚠ **`package-for-itch.sh` fails on this machine** (`zip` absent). S12.
- ⚠ **A stray bench digit silently voids a run's eligibility.** S7.
- ⚠ **The soaks' Mimic dodge — and `attractDrive()`'s port of it — measured
  worse than no dodge** (S6). No call; recorded.
- ⚠ **`package.json` says `"0.0.1"`** against `C.GAME_VERSION` `"0.0.13"`.
  S8 aligns them at ship.
- ⚠ **§19's Core and Quality rows have never had a verdict block**; the sweep
  (P3) writes their first.

### §0.2 — STATUS's unowned list, at ship (S13)

| Item | What it is (MEASURED where noted) | Ship | Why |
|---|---|---|---|
| The pad-only silence | a pad-only player hears nothing until a key, click or touch: a pad press is not a browser user activation | **Leaves** | a platform rule; a line on the itch page is Paul's (§13) |
| The VOICE bus | `AUDIO_BUSES` has `voice` and OPTIONS a VOICE VOLUME row, and no `C.SFX` recipe routes to it (MEASURED, grep) — a slider that moves nothing | **Leaves** | removing the row is an OPTIONS-shape change (eleven rows, pinned); a design call for a post-ship patch |
| The Surger tone's 1.106 sample peak | the tone alone renders past full scale (CS010 §1.6) | **Leaves** | ⛔ a recipe changes only by a port from `tools/sfx-lab.html`; that is the carried lab session |
| The enemy / menu palette and the HUD sizes | ⚠ provisional since CS004 / CS008 | **Leaves** | tuning, in `SKIPPED-PLAYTESTS.md` |
| `tools/glow-lab.html`'s visual audition | never held | **Leaves** | Paul's lab session |
| F1 | the combo readout covers 10 of 233 rim lane-centres (GDD §10.4, ACCEPTED) | **Leaves** | accepted in CS013 |
| F2 | the lifted rim point is off-screen on five lanes at the Jump's apex (Box 1–2, Cross 0–1, Fan 5; `log/CS013.md`) | **Leaves** | CS012 geometry, accepted in CS013; a `JUMP_LIFT` or well change moves `PROMPT_Y`'s arithmetic (K2, CS016) |
| The headroom gate bounding the limiter's INPUT | Paul's call since CS012 | **Leaves** | unanswered; asked again in the post-ship `STATUS.md` |
| The four unreachable entity cases (a second Purge on a bolt or reflection above 0.95; a run starting past 99; a rim Vaulter / aloft Warden on the continuous lane; a biggest-Purge of six) | none reachable by the suite's drivers | **Leaves** | no board reaches them; a patch that makes one reachable owns it |

---

## 1. ⛔ WHAT THIS SESSION MEASURED

### 1.1 MEASURED — the baseline, at `867ebd1`

The header's numbers: 26 + 3 modules, 852,420 bytes; 82 files, zero skips,
282 s (files sum 285 s, slowest 37.6 s); `CLAUDE.md` 38,311 bytes; `STATUS.md`
313 lines; `EXPORTS` 218; `C.GAME_VERSION` `"0.0.13"`; the repository public.

### 1.2 MEASURED — the shipped file in headless Chromium, from `file://`

Boot: `state.screen` `"title"`, the loop running (89 ticks in 1.5 s),
`window.KitLeaderboard` undefined (the bridge refused by CORS, by design),
`C.GAME_VERSION` `"0.0.13"`. Space ×3: `"play"`, `"overdrive"`, level 1,
`AudioSys.ctx` open. **Exceptions: 0.** Console errors: exactly two, both the
bridge (`Access to script … blocked by CORS`, `net::ERR_FAILED`).

### 1.3 MEASURED — bytes per `draw()`

S3's table and attribution. Sampling interval 16 B, collected objects
included, 2,000 draws after 300 warm-up draws and a forced GC; attribution
is the sampled node's function and its caller.

### 1.4 MEASURED — frame cost on the budget board

S4's table. Vsync-capped runs: the page's own `requestAnimationFrame` loop over
6 s per throttle, with a hook re-staging the board whenever it thins (the craft
invulnerable). Uncapped runs: `--disable-frame-rate-limit --disable-gpu-vsync`,
4 s per board per throttle; boards `title`, empty play at L23, the budget
board, and the budget board with `glowStroke` replaced in the page by one pass
(a stand-in, not a proposal). JS per step: `Game.update(FIXED_DT)` +
`Game.draw()` timed in the page over 120 iterations. ⚠ **Wall-clock numbers on
one machine**: they are data for §17, never a gate.

### 1.5 MEASURED — the price of a run to game over

| Mode, Start Depth, fire held | Runs | Steps / run (mean) | s / run (mean, max) | µs / step | Levels reached |
|---|---|---|---|---|---|
| Classic 1, 9,000 | 5 | 9,685 | 0.72, 0.75 | 74 | 9, 9, 9, 9, 9 |
| Classic 1, 2,000 | 5 | 2,608 | 0.19, 0.23 | 73 | all 2 |
| Classic 13, 9,000 | 4 | 9,767 | 0.83, 0.90 | 85 | all 22 |
| Classic 23, 3,000 | 4 | 4,119 | 0.40, 0.45 | 98 | all 26 |
| Overdrive 1, 9,000 | 5 | 9,725 | 0.92, 1.05 | 95 | 6–9 |
| Overdrive 17, 30,000 | 20 | 10,286 | 1.02, 2.64 | 99 | 17–41 |
| Overdrive 23, 3,000 | 4 | 3,558 | 0.50, 0.67 | 142 | 24–26 |

Per-step checks (NaN over every lane, depth and score; array high-water marks)
cost nothing measurable (95.2 against 94.7 µs a step). High-water marks seen:
enemies 10, shots 24, tokens 2. **No exception in any of the ~115 runs this
session played, and no NaN on any step of the 42 that checked.**
⚠ Start Depth options are odd (1, 3, 5 … 29 with a record of 30): a driver
asking for 16 gets 1 (MEASURED — this probe's first attempt did exactly that).

### 1.6 MEASURED — the itch package

S12's findings. Zip 285,575 bytes: `index.html` (the build, renamed),
`lib/kit-names/kit-names.js`, `lib/kit-leaderboard/kit-leaderboard.js`.

### 1.7 MEASURED — the Mimic

S6's table. Cause of death = the first live entity whose `killDepth` is reached
within `HIT_LANE_TOL` of the craft on the killing step, or "the dive" when
`state.dive.active`. A hit a Ward absorbed is counted beside the deaths.
Instances counted once per object.

### 1.8 MEASURED — six stand-in variants, the whole suite in each

| Variant | The one edit | Result |
|---|---|---|
| **V1** | delete `{ level: 16, kind: "mimic" }` | **6 files red** (S6) |
| **V2** | unbind `spawnVaulter` … `spawnSurger`, `spawnRow` | **14 files red** (S7) |
| **V3** | V2 + unbind `cycleWell` | **17 files red** (S7) |
| **V4** | `projectPoly` onto a per-array scratch, `drawShot`'s pair preallocated, `drawText`'s font string cached per size, `drawPrompt`'s fade colour cached per 1/100 of alpha | **GREEN, 82/82** (the clone's two skips): no closed file moves, no hash moves; allocation per S3's table |
| **V4b** | V4 + every `{ x: 0, y: 0 }` scratch initialised `{ x: 0.5, y: 0.5 }` | allocation only (browser): identical to V4 |
| **V5** | `C.GAME_VERSION` `"1.0.0"` | **1 file red, 1 assertion**: `test-cs016-p1.js:120`'s literal ("got 1.0.0, want 0.0.13") |

### 1.9 MEASURED — the greps

- **Vocabulary, every tracked file** (`git grep -i`): "tempest" 22 hits / 5
  files, "atari" 35 / 14, each Atari entity name 6–7 / 5 files — all in the
  ban lists, the GDD, the two instruction files, DECISIONS, RATIONALE, STATUS,
  `log/CS008.md`, `log/CS015.md` and four archived plans. **`src/`: 0.**
- **`mutate:` pins on lines CS017 would edit**: `test-cs013-p4.js:805` and its
  reuse in `-cs013-p5` pin the Mimic row's text (V1); `-cs012-p2` and
  `-cs013-p3` mutate OTHER schedule rows and assert the Mimic's survives. None
  on `ACTION_KEYS`, `projectPoly`, `drawShot`, `drawText`, `drawPrompt` or
  `GAME_VERSION`.
- **Closed presses of a bench key**: digits in 13 files, `w` in 4
  (`-cs002-p1`, `-cs003-p2`, `-cs006-p1`, `-cs016-p2`); V2/V3 measured which
  of them go red (`-cs003-p2` does not; `-cs011-p4` and `-cs008-p7`, which press
  none, do).
- **Step-path `.filter(` sites**: `23-main.js:1804`, `:1805`,
  `06-shots.js:120`, `10-powerups.js:162`.
- **The credits screen**: `drawMenu` puts info lines from y 240 at 46 px, a
  blank row, then BACK; at `MENU_TEXT_SIZE` 30 an 8th info line puts BACK at
  654–684 and a 9th at 700–730 (off a 720 canvas); `TEXT_CHAR_W` 0.62 gives
  66 characters inside 24 px margins.

---

## 2. THE SHAPE

**Four phases, one session each.** ROADMAP's guideline is 3–5.

| Phase | Builds | Depends on |
|---|---|---|
| **P1** | The budget: `tools/perf-probe.js`, the four draw-path allocators removed, the counter-based frame-budget gate, GDD §17's budget restated | S1, S2, S3, S4 |
| **P2** | The bench and the devices: `C.DEBUG_KEYS` and its closed repairs; the headless traverse-and-stop per device | S1, S7 |
| **P3** | The verdicts and the sweeps: the Mimic, the legal sweep, the credits, the package, the filter-sweep clause, every hardware clause's `SKIPPED-PLAYTESTS.md` entry, and §19's sweep written row by row | S1, S6, S9, S10, S11, S12, S13 |
| **P4** | The fifteenth soak (100 runs), the version, the review and the close — ROADMAP's last | S5, S8, S14 |

**Why these seams.**
- **P1 is the only phase that edits the renderer**, and its claim — the frame
  is unchanged except in what it allocates — is a draw-path claim the suite
  can hold by hash (the draw path writes no state) and the tool by bytes.
- **P2 is the only phase that moves closed files in bulk** (S7's 17), so its
  commit is about the key map and nothing else; the device test sits with it
  because both read `04-input.js`'s surface.
- **P3 is documents and data**: a verdict, a sweep, a script line, the
  credits. If S6 answers CUT, P3 also carries V1's six repairs.
- **P4 is the fifteenth soak** — ⛔ **a NEW file, never a widened closed one** —
  and the close.

**What a different split would cost.** Three phases (P1+P2) puts 17 closed
repairs in the commit that changes the renderer, so a red in a closed soak
could be either. Five (the sweep alone) was considered: the sweep is prose over
facts P1–P3 produce, and splitting it from P3 leaves P3 a two-line phase.

---

## 3. P1 — the budget

⛔ **Builds:**
1. **`tools/perf-probe.js`** — this session's browser probe as a tool: finds
   Chromium (`CHROME_BIN`, else Playwright's cache, else a loud nonzero exit),
   launches it headless over the DevTools protocol with Node's own
   `WebSocket` (⛔ no npm dependency), loads `dist/vector-vortex.html` from
   `file://`, and prints: boot/front-door health; bytes per `draw()` with
   attribution on the budget board and an empty board; uncapped frame cost at
   1× and 4× on the budget board. ⛔ **It stages through the page's own
   globals and never edits the build.** Output is a JSON block P1 ports into
   GDD §17 as MEASURED data. `CLAUDE.md`'s `tools/` list gains a line.
2. **S3's four fixes** (under S3-A): `projectPoly()`, `drawShot()`,
   `drawText()`, `drawPrompt()` — the V4 edits, each PREDICTED to move no
   hash (the draw path writes no state). ⚠ `tools/well-lab.html` has its own
   `projectPoly` copy (MEASURED) and is **not** pinned by any test; it is left.
3. **`scratchpad/test-cs017-p1.js`**:
   - ⛔ **the frame-budget gate, by counter**: on the budget board (staged as
     S2 names it, through `startGame` and the real constructors) one `draw()`
     issues ≤ the MEASURED ceiling of strokes and text calls — 144 and 4 today
     — counted through the harness canvas (a test may assign counting methods
     through its `set` trap); and the board is non-vacuous (16 / 24 / 2);
   - ⛔ **the four sites allocate nothing, by identity**: `projectPoly(a)`
     returns the same array twice; `drawShot()` hands `drawPoly` the same
     array on every call (a `spy` `.before`); `drawText()`'s font string for a
     size is the cached one; a fading prompt's colour for one alpha is the
     cached one — each mutation-checked (the old line put back is red);
   - ⛔ **a played session hashes identically** to itself with the four fixes'
     draw path — the draw path writes no state (a `P1_DETERMINISM_HASH` move
     is a defect).
4. **GDD §17's budget paragraph** restated under S2/S3/S4, with the tool's
   numbers; §10.2 gains nothing.

⛔ **Closed-file edits**: see §11. PREDICTED none beyond `EXPORTS`
(+`projectPoly` if the test needs it by name).

---

## 4. P2 — the bench and the devices

⛔ **Builds (under S7-B):**
1. `C.DEBUG_KEYS: false` under Build / debug, beside `GAME_VERSION`, with a
   header saying what it gates and why (the silent-ineligibility hazard).
2. `ACTION_KEYS` built with the eight bench rows only when the flag is true;
   `runAction()`, `DEBUG_SPAWN_ACTIONS`, `spawnRow()` and `Meta.benchUsed()`
   untouched. ⛔ `t`, `e`, `p`, Escape untouched.
3. **The 17 closed repairs** (§11): a `mutate` flipping the flag in each
   staging / bench-flag file's `buildGame`, and `test-cs016-p2.js`'s enders
   rewritten in place (the eight keys move to "not bound in the shipped
   build"). ⛔ **Each repair restores the fixture's precondition; none weakens
   an assertion.**
4. **`scratchpad/test-cs017-p2.js`**: the shipped map has no bench binding
   (pressing each of the eight in play does nothing and leaves the run
   eligible); a flagged build has all eight (non-vacuity); ⛔ **the headless
   traverse-and-stop** — per device (mouse, keyboard hold, keyboard taps,
   touch drag, gamepad stick), through `04-input.js`'s real paths as
   `test-cs002-p1.js` and `-p4.js` drive them, on a closed and an open well:
   from a lane centre, reach the lane a third of the well away and come to
   rest (input released, snap assist done) within `HIT_LANE_TOL` of its
   centre. ⚠ The input sequences are the test's; GDD §9's requirement is the
   claim.

---

## 5. P3 — the verdicts and the sweeps

⛔ **Builds (per the answers):**
1. **S6** — keep: GDD §14.6 and §21 #6 record the verdict and §1.7's numbers,
   the `⚠ ON PROBATION` markers in `CLAUDE.md`, GDD §19 and `00-config.js`'s
   comment become the verdict; ⛔ the row, `C.MIMIC_*` and prompt row 11
   untouched. (Cut: delete the row, V1's six repairs, `REACH` re-measured by
   `tools/reach-probe.js` and `mimic_kill` reported.)
2. **S9** — the credits, verbatim, checked against §1.9's limits and the scan.
3. **S10** — per the answer (B: nothing in the repo; A: the sweep).
4. **S11** — §19 Audio's clause restated.
5. **S12** — the script's fallback line; `EXTERNAL-FILES.md` unchanged (no
   runtime file moves).
6. **`SKIPPED-PLAYTESTS.md`** — one CS017 entry per remaining hardware
   judgment (S1's table's right column), each with what Paul would have done,
   what it was for, and the knobs.
7. **The acceptance-criteria sweep** — GDD §19 gets a **"⛔ at ship (CS017)"**
   verdict block under EVERY row: Core and Quality their first, Overdrive,
   Audio, Meta and Onboarding a one-line carry-forward each, every clause
   ✅ / ◐ / ✗ with its test or tool — ⛔ **written from the suite and the tool,
   never from memory**.

---

## 6. P4 — the fifteenth soak, the version, the review, the close

1. **`scratchpad/test-cs017-p4.js`** under S5-A: 100 time-seeded runs to game
   over through the front door, 50 per mode, Start Depths drawn from each
   mode's option list (records staged AFTER a no-write window — `STATUS.md`'s
   masked-write trap), a fire-hold per run from the soak's seed; per played
   step: no exception, every lane / depth / score finite, `enemies` ≤
   `ENEMY_CAP`, `shots` ≤ the cap in force, `tokens` ≤ `MAX_TOKENS`;
   non-vacuity (both modes reach the Mimic's level, both reach a dive, distinct
   death levels). ⛔ **MEASURED under 60 s before commit.**
   ⛔ **P3 addendum (rule 3: a recommendation, TAKEN; Paul may reverse):**
   non-vacuity also asserts **every one of the sixteen wells was played** across
   the hundred runs — §19 Core's "all 16 wells render and play" has no played
   carrier today (P3's sweep). PREDICTED reachable: Start Depths up to 29 put
   runs on every well; if one is not, P4 reports it rather than widening.
2. **S8** — `C.GAME_VERSION` `"1.0.0"`, `test-cs016-p1.js:120` rewritten in
   place, `package.json` aligned.
3. **The close** — `log/CS017.md` compressed; `STATUS.md` reset post-ship
   (S14); `ROADMAP.md`'s CS017 row shipped and "What CS017 deliberately left";
   `DECISIONS.md` one index line per §0 call; the two planning documents to
   `archive/`. ⛔ **Zero skips** (`../coinless-kit` present).

---

## 7. ⛔ THE BUDGET IS A MEASUREMENT, NOT A GATE ON A CLOCK

The suite holds the WORK (counters) and the SHAPE (no allocating expression);
the tool reports TIME and BYTES as data. ⛔ Nothing in `scratchpad/` reads a
wall clock to pass or fail, and nothing in `tools/` is run by `run-all.js`.

## 8. ⛔ NOTHING OF THIS CHANGESET TOUCHES THE SIMULATION

PREDICTED, and each phase asserts its part: P1 edits only the draw path (V4:
every closed hash green); P2 edits only which keys are bound — no closed SOAK
presses a bench key (three soaks carry a FORBIDDEN list, per the `ACTION_KEYS`
comment), and ⚠ `test-cs002-p1.js`'s determinism list DOES press `w`, which is
why its repair flips the flag rather than editing the list (V3); P3 edits data and documents (under
S6-A no row moves); P4 adds a test and a version string. ⛔ `GOLDEN_LANES` and
`P1_DETERMINISM_HASH` 1229033515 do not move.

## 9. ⛔ WHAT A PHASE MUST NOT DISTURB

From `STATUS.md`'s hazards, the ones CS017's edits come near (read, not
re-measured):
- **`SEAT_EDGE` matches by indentation luck** — P2 edits `23-main.js`
  (`ACTION_KEYS`); the demo's `if (!attract)` block is not re-indented.
- **Seven achievement-seat `mutate` strings and nine CS011 texts** — no CS017
  phase edits a seat, `22-meta.js`, or `lib/kit-leaderboard/` (MEASURED, §1.9:
  no pin on a line CS017 edits except the Mimic row).
- **The prompt band is arithmetic** (K2, CS016) — no HUD size, `WELL_RADIUS`
  or prompt text moves.
- **`attractDrive()` is a port of the soaks' hunter** — S6's finding is
  recorded, not acted on.
- **A title idled 20 s enters the demo** — the fifteenth soak presses inside
  20 s at every title visit.
- **A staged record can mask a write** — the fifteenth soak stages its Start
  Depth records after a no-write window.

---

## 10. ⛔ THE BASELINE LEDGER

| Baseline | At `867ebd1` (MEASURED) | CS017 (PREDICTED) |
|---|---|---|
| `P1_DETERMINISM_HASH` | **1229033515** | ⛔ unmoved P1–P4 |
| `GOLDEN_LANES` | the `9ebd27b` sixteen + `2, 5` | ⛔ unmoved |
| The fourteen closed soaks' hashes | green | ⛔ unmoved (S6-A); under S6-cut, V1's six |
| `COUNTS` enemies / enemyKinds / wells / openWells / tracks | 9 / 13 / 16 / 6 / 3 | unmoved (a cut Mimic stays a class and a kind) |
| `state` keys / `tally` fields | 28 / 23 | unmoved |
| `C.SPAWN_SCHEDULE` / `_OVERDRIVE` | 7 / 3 | unmoved (S6-A); 7 / 2 cut |
| `C.SFX` / `SFX_KILL_PITCH` | 28 / 11 | unmoved |
| Kill sites / kill lines | 4 / 5 | ⛔ unmoved |
| `C.ACHIEVEMENTS` | 23 lifetime / 19 pool / 5 a week | ⛔ **frozen** |
| `C.PROMPTS` | 12 | unmoved |
| `ACTION_KEYS` in the shipped build | 12 actions | **4** — `back`, `pause`, `telemetryToggle`, `telemetryExport` (S7-B: the eight bench rows flag-gated) |
| `C.GAME_VERSION` | `"0.0.13"` | **`"1.0.0"`**, P4 |
| `MANIFEST` | 26 + 3 | unmoved |
| `_harness.js` `EXPORTS` | **218** | +0–2, P1 |
| `tools/` | 5 labs + `reach-probe.js` | **+`perf-probe.js`**, P1 |
| The suite | **82 files, 0 skips, 282 s** | **85 files** (+`-cs017-p1`, `-p2`, `-p4`), 0 skips at the close; **+~60 s** |
| Bytes per `draw()`, budget board (tool) | **8,200** | ~6,200 (V4) |
| `dist` bytes | **852,420** | ~ +1 KB |
| `CLAUDE.md` | **38,311 bytes** | ⛔ < 50 KB every phase |
| `STATUS.md` | 313 lines | ⛔ < ~400; reset post-ship at P4 |

## 11. ⛔ CLOSED-FILE EDITS, PREDICTED AND MEASURED

| Phase | File | What | Basis |
|---|---|---|---|
| P1 | `_harness.js` `EXPORTS` | +`projectPoly` (only if the test needs it by name) | PREDICTED |
| P1 | every closed test | ⛔ **none** | **MEASURED** (V4 green) |
| P2 | `test-cs004-p1.js` … `-p4.js`, `-cs005-p2.js`, `-p3.js`, `-cs007-p3.js` | `buildGame` gains `mutate` flipping `DEBUG_KEYS` — the bench is their staging tool | **MEASURED red** (V2); repair PREDICTED |
| P2 | `test-cs011-p3.js`, `-p4.js`, `-p5.js`, `-p6.js`, `-cs012-p3.js`, `-cs015-p2.js` | the same flip — their claim is "a bench run earns nothing", which needs a bench | **MEASURED red** (V2) |
| P2 | `test-cs002-p1.js`, `-cs006-p1.js`, `-cs008-p7.js` | the same flip for `w` | **MEASURED red** (V3) |
| P2 | `test-cs016-p2.js` | the ender table: the eight bench keys rewritten from "ends the demo" to "unbound in the shipped build" (6–9 assertions) | **MEASURED red** (V2/V3) |
| P3, cut only | `test-cs012-p2.js`, `-cs013-p3.js`, `-cs013-p4.js`, `-cs013-p5.js`, `-cs014-p3.js`, `-cs016-p4.js` | V1's red set, each rewritten to the two-row table / eleven prompt rows | **MEASURED** (V1) |
| P4 | `test-cs016-p1.js:120` | the version literal → `"1.0.0"` | **MEASURED** (V5: the one assertion) |
| — | `test-cs008-p6.js` (credits) | ⛔ **none** — it reads `C.CREDITS_LINES` as data; ⚠ red if a line trips the substring scan | PREDICTED (read) |

⛔ **An edit not in this table is a finding.** The phase stops, records it in
`STATUS.md` with its cause, and makes the edit only if it restores the claim the
closed test was always making.

## 12. ⛔ ACCEPTANCE CRITERIA

- **§17 item 12** — the fifteenth soak: 100 seeded runs to game over, both
  modes, no exception, no NaN, no array past its cap; under 60 s.
- **§17's budget** — restated (S2–S4), the tool's numbers recorded, the
  counter gate green, the four sites allocation-free by identity.
- **§18** — the shipped package and the build scanned clean (the closed scan
  plus the package's two lib files); S10's answer done.
- **§19** — every row carries an "at ship" verdict block, every clause ✅ / ◐
  / ✗ with its evidence, every hardware half pointing at its
  `SKIPPED-PLAYTESTS.md` entry; Audio's ✗ resolved per S11.
- **§21 #6** — the verdict recorded in §14.6, §19 and §21.
- **Quality** — plays from `file://` (the tool's boot check), the concat build
  is the oracle, ⛔ zero skips at the close.

## 13. ⛔ WHAT CS017 DOES NOT DO

- **Rename, add or cut an achievement id, or change the pool's length.**
  Frozen at ship.
- **Change a spawn schedule, a heat base, a kill line, a `tally` field, a
  telemetry column or a stats key** (S6-A). The Worker is not contacted.
- **Retune anything** — the director's weights (S11), a recipe, the palette,
  the glow (S4-C), `PROMPT_*`, the demo.
- **Touch the Mimic dodge in `attractDrive()`** (S6's finding).
- **Edit, bump or backport a kit module.**
- **Write the itch page's copy, upload the package, change the repository's
  visibility or push** — Paul's (S10, S12).
- **Build a CS018 row** (S14).
- **Chase the engine's `entityPoints` residue** (S3-B).

## 14. RISKS

- **K1 — the tool depends on a Chromium binary outside the repo.** It fails
  loudly without one; a future machine without Playwright's cache sets
  `CHROME_BIN`. The suite never depends on it.
- **K2 — the counter gate's ceiling is today's board.** A later entity that
  draws more strokes moves it on purpose; the gate says so rather than
  hiding it.
- **K3 — S7-B's 17 repairs are the biggest closed edit since CS007.** Each is
  one of two MEASURED forms; P2 stops on a third.
- **K4 — the fifteenth soak is the suite's slowest file by 1.5×** (PREDICTED
  45–70 s against 37.6 s). ⛔ A timeout is not a red — but a close cannot
  carry one, so P4 measures before it commits.
- **K5 — a time-seeded soak at one fire length plays one run a hundred times**
  (§1.5). The per-run hold is the spread; P4's non-vacuity asserts it.
- **K6 — the Mimic numbers are bots'.** S6-A keeps the ask in
  `SKIPPED-PLAYTESTS.md`; nothing here says a person would agree.
- **K7 — ⛔ three Overdrive fixtures are seed-fragile** (`-cs012-p2`, `-p4`,
  `-p6`). CS017 spends no draw and changes no beat under S6-A.
- **K8 — `SEAT_EDGE` matches by indentation luck** (`STATUS.md`): P2 edits
  `23-main.js` near `ACTION_KEYS`, far from the demo's `if (!attract)` block;
  PREDICTED untouched.
- **K9 — ⛔ zero skips at the close** needs `../coinless-kit` (MEASURED present
  at HEAD, absent in every clone).
- **K10 — the credits are Paul's text** and the scan is a substring scan.

## 15. ASSUMPTIONS

- **A1 — Paul answers §0 before P1** (P1 needs S1–S4; P2 S7; P3 S6, S9–S13; P4
  S5, S8, S14). ⛔ A phase that reaches an unanswered call stops.
- **A2 — `../coinless-kit` is present for the close** (K9).
- **A3 — Chromium is available to the tool** on the machine that runs P1
  (MEASURED here: Playwright's `chromium_headless_shell-1243`).
- **A4 — no playtest happens.** Every hardware half ships as a
  `SKIPPED-PLAYTESTS.md` entry.
- **A5 — `STATUS.md` and `CLAUDE.md` have room**: 313 lines and 38,311 bytes.
