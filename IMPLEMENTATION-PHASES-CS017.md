# IMPLEMENTATION-PHASES-CS017

One phase per Claude Code session. `/clear` between phases. Commit per phase on
`main`; never push.

Each phase below is the literal prompt to paste. A session reads `CLAUDE.md`
and `STATUS.md` automatically, and nothing else unless the prompt names it.

⛔ **`ultrathink` appears inside the prompt text where it is wanted.** It is a
per-turn lever, so it has to be in the pasted message.

⛔ **§0 IS ANSWERED (Paul, 2026-09-23): every recommendation, S1–S14; S9 keeps the current credits.** `PLANNED-FEATURES-CS017.md` §0
carries S1–S14, each with one recommendation and an empty answer column. A
prompt below that says "S3's answer" means what that column says once Paul
fills it, and ⛔ **a phase re-opens none of it**; ⛔ **a phase that needs an
unanswered call stops** (`CLAUDE.md` rule 3). The prompts are written for the
recommendations; where an answer differs, the phase builds the answer and says
so in its log.

**Baseline:** CS016 closed at `3f312cc`; Paul's accepted-behaviour commit
`867ebd1` is HEAD; CS017 is planned on top of it.
- `node build.js` → 26 modules + 3 inlined kit, **852,420 bytes** (832.4 KB).
- `node scratchpad/run-all.js` → **82 files, zero skips, exit 0** (282 s); the
  slowest file is `test-cs014-p3.js`, 37.6 s.
- `test-registry.js`: `wells: 16`, `openWells: 6`, `tracks: 3`, `enemies: 9`,
  `enemyKinds: 13`; `state` **28** top-level keys; `tally` **23**.
- `test-cs006-p2.js`'s `P1_DETERMINISM_HASH` is **1229033515**.
- `test-cs004-p1.js`'s `GOLDEN_LANES` is the `9ebd27b` sixteen plus CS008's `2, 5`.
- `C.SPAWN_SCHEDULE_OVERDRIVE` is **3 rows** (Reaver 6, Warden 11, Mimic 16).
  `C.ACHIEVEMENTS`: 23 lifetime, 19 weekly, `perWeek` 5 — ⛔ **frozen at ship**.
  `C.PROMPTS` **12**. `C.GAME_VERSION` **`"0.0.13"`**, pinned by literal at
  `test-cs016-p1.js:120`.
- `ACTION_KEYS` (`23-main.js`) has **12** actions, **8** of them the bench
  (`1`–`6`, `0`, `w`); nothing on screen shows a bench run.
- `_harness.js`'s `EXPORTS` **218** names. kit-names **0.1.0**, kit-storage
  **0.1.0**, kit-profile **0.1.1**, kit-leaderboard **0.2.1**, kit-input
  **0.8.0**, kit-audio **0.4.0**, kit-menu **0.1.0**. coinless-kit present
  beside the repo.
- Chromium for `tools/`: `~/.cache/ms-playwright/chromium_headless_shell-1243/`
  (MEASURED present); `zip` **absent**, `python3` present.
- `STATUS.md` **313 lines** before the planning edit; `CLAUDE.md` **38,311
  bytes** (77 % of 50 KB).

| Phase | Builds | Model | Effort |
|---|---|---|---|
| P1 | The budget: `tools/perf-probe.js`, the four draw-path allocators, the counter gate, GDD §17's budget restated | Opus 5.5 | **high** |
| P2 | The bench behind `C.DEBUG_KEYS` and its 17 closed repairs; the headless traverse-and-stop per device | Opus 5.5 | **high** |
| P3 | The verdicts and the sweeps: the Mimic, the credits, the legal sweep, the package, the sweep clause, the skipped entries, §19 at ship | Opus 5.5 | **high** |
| P4 | The fifteenth soak (100 runs), the version, the review and the close | Opus 5.5 | **high** |

---

## ⛔ Why the seams fall here

Plan §2 has the argument. In short:
- **P1 is the only phase that edits the renderer**, and V4 MEASURED its four
  fixes green across all 82 files, so its commit's claim is about bytes and
  nothing else.
- **P2 moves 17 closed files** (V3, MEASURED) and is alone so a red is about
  the key map. The device test reads the same module surface.
- **P3 is data and documents** — a verdict, a sweep, a script line — plus V1's
  six repairs only if S6 answers CUT.
- **P4 is the fifteenth soak** — ⛔ **a NEW file, never a widened closed one**
  — and the ROADMAP's last close.

### ⛔ Preconditions

| Before | What | Whose |
|---|---|---|
| **P1** | S1, S2, S3, S4 answered | ✅ answered 2026-09-23 |
| P2 | S7 answered | ✅ answered 2026-09-23 |
| P3 | S6, S9, S10, S11, S12, S13 answered | ✅ answered 2026-09-23 (S9: keep the current two lines) |
| P4 | S5, S8, S14 answered; `../coinless-kit` present — `test-cs011-p5.js` and `test-cs012-p3.js` SKIP LOUDLY without it; ⛔ a close cannot skip | ✅ answered 2026-09-23 / MEASURED present 2026-09-23 |

### ⛔ The re-records — none

| Phase | Baseline | Moves? |
|---|---|---|
| P1–P4 | `P1_DETERMINISM_HASH` 1229033515 | ⛔ **No.** A move is a defect |
| P1–P4 | `GOLDEN_LANES` | ⛔ **No** — CS017 spends no draw |
| P1–P4 | the fourteen closed soaks' paired hashes | ⛔ **No** (V4 green; S6-A moves no row). Under S6-cut, V1's six files are REWRITTEN, not re-recorded |
| P1–P4 | `STATE_FIELDS`, `state`'s 28 keys, `tally`'s 23 | ⛔ **No** |
| P1–P4 | the four kill sites and five kill lines | ⛔ **No** |
| P1–P4 | `C.ACHIEVEMENTS` ids and the pool's length | ⛔ **No — frozen** |

### ⛔ Closed-file edits — in place (plan §11)

| Phase | File | What | Basis |
|---|---|---|---|
| P1 | every closed test | ⛔ **none** | **MEASURED** (V4: 82/82 green) |
| P1 | `_harness.js` `EXPORTS` | +`projectPoly`, only if the test names it | PREDICTED |
| P2 | `test-cs004-p1.js` … `-p4.js`, `-cs005-p2.js`, `-p3.js`, `-cs007-p3.js` | their `buildGame` flips `DEBUG_KEYS` by `mutate` — the bench is how they stage | **MEASURED red** (V2); repair PREDICTED |
| P2 | `test-cs011-p3.js`, `-p4.js`, `-p5.js`, `-p6.js`, `-cs012-p3.js`, `-cs015-p2.js` | the same flip — "a bench run earns nothing" needs a bench | **MEASURED red** (V2) |
| P2 | `test-cs002-p1.js`, `-cs006-p1.js`, `-cs008-p7.js` | the same flip for `w` (⚠ `-cs002-p1`'s determinism list presses `w`; `-cs008-p7`'s cause is unread — read it first) | **MEASURED red** (V3) |
| P2 | `test-cs016-p2.js` | its ender table: the eight keys become "unbound in the shipped build" | **MEASURED red** (V2/V3) |
| P3, S6-cut only | `test-cs012-p2.js`, `-cs013-p3.js`, `-p4.js`, `-p5.js`, `-cs014-p3.js`, `-cs016-p4.js` | the two-row table, eleven prompt rows | **MEASURED** (V1) |
| P4 | `test-cs016-p1.js:120` | the version literal | **MEASURED** (V5: the one assertion) |

⛔ **An edit this table does not predict is a finding.** Stop, record it in
`STATUS.md` with its cause, and make the edit only if it restores the claim the
closed test was always making. ⛔ **A fixture is repaired to restore its
precondition, never relaxed.**

---

## P1 — the budget

**Model: Opus 5.5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS017.md` §0 (S1–S4
> **and their ANSWERS**; §0.1), §1.2, §1.3, §1.4, §1.8 (V4, V4b), §2, §3, §7,
> §8, §10, §11 and §12. Then `VECTOR-VORTEX-GDD.md` §0, §1, §10.2, §16.1 and
> §17 whole. Then `src/13-render-well.js`'s `drawPoly`, `glowStroke`,
> `drawText`, `projectPoly` and `drawWell`; `src/14-render-entities.js`'s
> `drawShot`, `entityScratch` and `entityPoints`; `src/22-onboarding.js`'s
> `promptAlpha` and `drawPrompt`; `src/23-main.js`'s `draw()` and `frame()`;
> `scratchpad/_harness.js` (the canvas `Proxy`, `spy`, `mutate`) and
> `tools/reach-probe.js` (the shape of a tool). Create `log/CS017.md`.
> ultrathink.
>
> ⛔ **§0: build S1–S4 exactly as ANSWERED and re-open none.**
>
> **1. Record §0.1's findings in `STATUS.md` first** if the planning session's
> edit did not already carry them.
>
> **2. `tools/perf-probe.js` (S1a).** Node only, ⛔ no npm dependency: find
> Chromium (`CHROME_BIN`, else `~/.cache/ms-playwright/chromium_headless_shell-*/`,
> else print why and exit nonzero — ⛔ never a silent pass); launch it
> headless with `--disable-gpu` and `--remote-debugging-port=0`; talk to it
> with Node's built-in `WebSocket`; load `dist/vector-vortex.html` from
> `file://`. Report, as one JSON block: (a) boot health — the title reached,
> Space ×3 reaching play, exceptions, console errors; (b) bytes per
> `Game.draw()` on S2's budget board and on an empty board, from
> `HeapProfiler.startSampling` WITH `includeObjectsCollectedByMajorGC` and
> `…MinorGC` (⛔ without them it reports only survivors — plan §1.3), top
> attributions; (c) the budget board's uncapped frame cost
> (`--disable-frame-rate-limit --disable-gpu-vsync`) at 1× and 4×
> `Emulation.setCPUThrottlingRate`. ⛔ It stages through the page's globals
> (`startGame`, `ENEMY_KINDS`, `Shot`, `state`) and never edits the build.
> ⛔ It is a tool: `run-all.js` never runs it. Add it to `CLAUDE.md`'s
> `tools/` list in one line.
>
> **3. The four fixes (S3-A)** — plan §1.8's V4 edits: `projectPoly()` onto a
> scratch cached on the point array (non-enumerable, as `wellThroat()` and
> `entityScratch()` do); `drawShot()` with one module pair; `drawText()`'s font
> string cached per size; `drawPrompt()`'s fade colour cached per 1/100 of
> alpha. ⛔ Nothing else in the renderer moves — the `entityPoints` residue is
> NOT chased (S3-B rejected). ⛔ The step path's `.filter()` is an INVARIANT.
>
> **4. The test, `scratchpad/test-cs017-p1.js`** — plan §3's list: the
> counter gate on the budget board (strokes and text calls per `draw()` at
> the MEASURED ceiling — read the numbers off the build at HEAD before the
> fix and assert they did not move; non-vacuity 16 / 24 / 2); the four sites
> by IDENTITY, each mutation-checked with the old line put back; a played
> session's hash unmoved. ⛔ Seed above the first `buildGame()`. ⛔ A mutation
> run that throws is a defect in the test. ⛔ Nothing reads a wall clock.
>
> **5. Run the tool on the fixed build** and port its JSON into GDD §17's
> budget paragraph, restated per S2/S3/S4 (MEASURED, with the tool's name and
> the commit). Log the before/after in `log/CS017.md`.
>
> **6. Expect exactly these closed-file edits** (plan §11): none, and
> `EXPORTS` only if named. ⛔ Anything else is a finding. ⛔ **Run
> `node scratchpad/run-all.js` before committing.** Update `STATUS.md`
> (ledger line + ≤ 200 words). Commit "CS017 P1: the budget, measured".

---

## P2 — the bench and the devices

**Model: Opus 5.5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS017.md` §0 (S1,
> S7 **and their ANSWERS**), §1.8 (V2, V3), §1.9, §2, §4, §8, §10, §11. Then
> `VECTOR-VORTEX-GDD.md` §0, §1, §9 whole and §19's Core row. Then
> `src/23-main.js`'s `ACTION_KEYS`, `DEBUG_SPAWN_ACTIONS`, `spawnRow()`,
> `runAction()` and the `createInput` call; `src/04-input.js`'s device paths
> and snap assist; `src/22-meta.js`'s `benchUsed()` / `eligible()`. Then every
> closed file in §11's P2 rows, at the lines that press a bench key or build
> the game, and `test-cs002-p1.js` / `-p4.js` for how each device is driven.
> Append to `log/CS017.md`. ultrathink.
>
> ⛔ **§0: build S7 exactly as ANSWERED.**
>
> **1. `C.DEBUG_KEYS: false`** under Build / debug, with a header: what it
> gates (the eight bench bindings), why (a stray digit silently voids a run's
> eligibility — plan S7), and that ⛔ `t`, `e`, `p` and Escape are not bench
> keys. `ACTION_KEYS` includes the eight rows only when it is true.
> ⛔ `runAction()`, `DEBUG_SPAWN_ACTIONS`, `spawnRow()`, the bench flag and
> `Meta.benchUsed()` are NOT edited or deleted (`CLAUDE.md` rule 7).
> ⚠ `SEAT_EDGE` matches by indentation luck — do not re-indent `update()`'s
> demo block.
>
> **2. The 17 closed repairs** (plan §11), in the two MEASURED forms: the
> staging and bench-flag files flip the flag in their `buildGame` by `mutate`
> (restoring the precondition "a bench exists"); `test-cs016-p2.js`'s enders
> are rewritten in place. ⛔ Read `test-cs008-p7.js`'s red first — its cause is
> unread; if it is not the flag, it is a finding. ⛔ `test-cs002-p1.js`'s
> determinism list keeps pressing `w` in a flagged build; its recorded hash
> must come back unmoved.
>
> **3. The test, `scratchpad/test-cs017-p2.js`**: the shipped build binds none
> of the eight (each pressed in play does nothing and the run stays
> eligible); a flagged build binds all eight (non-vacuity); ⛔ **the headless
> traverse-and-stop, per device** — mouse, keyboard hold, keyboard taps, touch
> drag, gamepad stick — through the real input paths, on a closed and an open
> well: from a lane centre, reach the lane a third of the well away and come
> to rest, input released and the snap done, within `HIT_LANE_TOL` of its
> centre. GDD §9's requirement is the claim; the input sequences are yours and
> each is written down in the test header.
>
> **4. GDD** — §9.5 and §10.5 say the bench is a dev build's; §19 Core's
> traverse-and-stop clause names the test.
>
> ⛔ **Run `node scratchpad/run-all.js` before committing.** Update
> `STATUS.md` (ledger line + ≤ 200 words; the bench is no longer a shipped
> surface) and `CLAUDE.md` only if a rule changes. Commit "CS017 P2: the
> bench behind a flag, and traverse-and-stop per device".

---

## P3 — the verdicts and the sweeps

**Model: Opus 5.5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS017.md` §0 (S1,
> S6, S9–S13 **and their ANSWERS**; §0.1; §0.2), §1.6, §1.7, §1.8 (V1), §1.9,
> §2, §5, §11, §12 and §13. Then `VECTOR-VORTEX-GDD.md` §0, §1, §14.6, §17,
> §18, §19 whole and §21. Then `SKIPPED-PLAYTESTS.md`'s headings (⛔ headings
> only, then the CS013 P4 entry whole), `package-for-itch.sh` and
> `EXTERNAL-FILES.md`. Append to `log/CS017.md`. ultrathink.
>
> ⛔ **§0: build S6, S9–S13 exactly as ANSWERED.**
>
> **1. S6.** KEEP: GDD §14.6, §19 (Overdrive) and §21 #6 record the verdict
> with plan §1.7's table; the `⚠ ON PROBATION` wording in `CLAUDE.md`, GDD and
> `00-config.js`'s comment becomes the verdict. ⛔ The row, the `C.MIMIC_*`
> constants and prompt row 11 do not move. (CUT: delete the row, repair V1's
> six files in place, re-measure `REACH` with `tools/reach-probe.js` and
> report `mimic_kill` to Paul — ⛔ never lowered.)
>
> **2. S9 — the credits**, verbatim from the answer column. ⛔ ≤ 7 lines,
> ≤ 66 characters, and every line through the substring vocabulary scan
> (`test-cs008-p6.js`) — a line it rejects is reported, never reworded by you.
>
> **3. S10, S11, S12** per the answers: the legal sweep (under B, nothing in
> the repo moves and §13's note to Paul stands); §19 Audio's clause restated;
> `package-for-itch.sh`'s zip fallback, then run the script and list the zip.
>
> **4. `SKIPPED-PLAYTESTS.md`** — one CS017 entry per hardware half in plan
> S1's table (the two devices at 60 fps; traverse-and-stop by hand; Firefox
> and Safari from `file://`; the airborne state "unmistakable"; the sweep and
> the tone by ear, if not already covered — ⛔ point at an existing entry
> rather than duplicate it). Each: what Paul would have done, what it was for,
> the knobs.
>
> **5. The acceptance-criteria sweep.** GDD §19 gets a **"⛔ At ship (CS017)"**
> block under EVERY row — Core and Quality their first — every clause ✅ / ◐ /
> ✗ with the test file or tool that carries it. ⛔ **Written from the suite and
> the tool, never from memory**: open each cited test at the assertion. A
> clause with no carrier is ✗ and a finding, never a ✅.
>
> ⛔ **Run `node scratchpad/run-all.js` before committing.** Update
> `STATUS.md`. Commit "CS017 P3: the verdicts and the sweeps".

---

## P4 — the fifteenth soak, the version, the review, the close

**Model: Opus 5.5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS017.md` §0 (all
> answers), §1.5, §2, §6, §8, §10–§15. Then `VECTOR-VORTEX-GDD.md` §0, §1, §17
> item 12 and §19 whole. Then `scratchpad/test-cs016-p4.js` whole (the
> fourteenth soak: its wall-clock fake, its driver, its front door, its
> staged records) and `log/CS017.md` whole — ⛔ this is the one session that
> reads `log/`, because the close reviews it. Append to `log/CS017.md`.
> ultrathink.
>
> **1. The fifteenth soak, `scratchpad/test-cs017-p4.js`** — ⛔ a NEW file,
> under S5's answer: 100 time-seeded runs to game over through the front door,
> 50 per mode; Start Depths from each mode's option list (⚠ they are odd;
> stage the records AFTER a no-write window and assert the precondition); a
> fire-hold per run from the soak's own seed; press within 20 s at every title
> visit (the demo); per played step no exception, every lane / depth / score
> finite, `enemies` ≤ `ENEMY_CAP`, `shots` ≤ the cap in force, `tokens` ≤
> `MAX_TOKENS`; non-vacuity (both modes, a Mimic's level, a dive, distinct
> death levels per mode). ⛔ **Time it alone before committing: under 60 s,**
> or re-shape per S5 and record why. ⛔ A timeout is not a red — and a close
> cannot carry one.
>
> **2. S8.** `C.GAME_VERSION` → the answer (`"1.0.0"` recommended);
> `test-cs016-p1.js:120` rewritten in place; `package.json`'s `version` aligned.
>
> **3. The review.** Read every phase's `log/CS017.md` entry together;
> compress; the close entry carries the version line.
>
> **4. The close (S14).** `STATUS.md` reset to a POST-SHIP file: what a patch
> must obey, the frozen ids and pool, the carried tasks (the lab session,
> backports, the unowned list per plan §0.2, the headroom-gate question), and
> the tool. `ROADMAP.md`'s CS017 row to shipped with "What CS017 deliberately
> left", and no CS018 row unless S14 says otherwise. `DECISIONS.md` gains one
> index line per §0 call — a pointer, never the writeup. GDD §19's Quality row
> gets item 12's verdict. `CLAUDE.md` stays under 50 KB. The two planning
> documents move to `archive/`. ⛔ **Zero skips**: `../coinless-kit` must be
> present. ⛔ **Run `node scratchpad/run-all.js` before committing.** Commit
> "CS017 P4: the fifteenth soak, the review, and the close — ship".
