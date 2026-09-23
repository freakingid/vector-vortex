# IMPLEMENTATION-PHASES-CS016

One phase per Claude Code session. `/clear` between phases. Commit per phase on
`main`; never push.

Each phase below is the literal prompt to paste. A session reads `CLAUDE.md`
and `STATUS.md` automatically, and nothing else unless the prompt names it.

⛔ **`ultrathink` appears inside the prompt text where it is wanted.** It is a
per-turn lever, so it has to be in the pasted message.

⛔ **§0 IS ANSWERED (Paul, 2026-09-23): every recommendation, as written.**
`PLANNED-FEATURES-CS016.md` §0's answer column carries N1–N13; a prompt below
that says "N3's answer" means what that column says, and ⛔ **a phase re-opens
none of it**. N12 answered CS016, so the changeset is **four phases** and P3
stands. N2 took all five candidate rows (8–12).

**Baseline:** CS015 closed at `bea33c8`; CS016 is planned on top of it.
- `node build.js` → 25 modules + 3 inlined kit, **827,351 bytes** (808.0 KB).
- `node scratchpad/run-all.js` → **78 files, zero skips, exit 0** (235.3 s).
- `test-registry.js`: `wells: 16`, `openWells: 6`, `tracks: 3`, `enemies: 9`,
  `enemyKinds: 13`; `STATE_FIELDS` through CS013; `state` **28** top-level keys.
- `test-cs006-p2.js`'s `P1_DETERMINISM_HASH` is **1229033515**.
- `test-cs004-p1.js`'s `GOLDEN_LANES` is the `9ebd27b` sixteen plus CS008's `2, 5`.
- `state.tally` has **21** fields. `C.MODE_FLAGS` is `{ jump, combo, tokens,
  rings }` per row. `C.SFX` **28 events**, `C.SFX_KILL_PITCH` **11 voices**.
  `TELEMETRY_FIELDS` **29**, `telemetry` **v1**. `C.ACHIEVEMENTS`: 23 lifetime,
  18 weekly, `perWeek` 5. `_harness.js`'s `EXPORTS` **211** names (MEASURED;
  `STATUS.md` says 212 — record what you find).
- Declared keys: `settings` v1, `progress` v2 + `migrate`, `telemetry` v1,
  `scores` v1, `achievements` v1. ⛔ **`onboarding` is NOT declared.**
  `OWN_KEYS` is `["settings", "progress", "telemetry", "achievements"]`.
- `C.ATTRACT_IDLE` is **20 and read by nothing** (`00-config.js:939`).
- kit-names **0.1.0**, kit-storage **0.1.0**, kit-profile **0.1.1**,
  kit-leaderboard **0.2.1**, kit-input **0.8.0**, kit-audio **0.4.0**,
  kit-menu **0.1.0**. coinless-kit present beside the repo.
- `STATUS.md` **277 lines**; `CLAUDE.md` **36,926 bytes** (72 % of 50 KB).

| Phase | Builds | Model | Effort |
|---|---|---|---|
| P1 | The prompts: `src/22-onboarding.js`, `C.PROMPTS`, the `onboarding` key, the band, GDD §12 restated, §19's row | Opus 5 | **high** |
| P2 | Attract mode: the idle timer, the driver, the gates, the ending, the demo line | Opus 5 | **high** |
| P3 | The pre-ship achievement pass (⚠ only if N12 says CS016) | Opus 5 | **high** |
| P4 | The fourteenth soak, the review, the close | Opus 5 | **high** |

---

## ⛔ Why the seams fall here

Plan §2 has the argument. In short:
- **P1 is the module and everything provable on a staged board.** Every trigger
  is a board read; its closed edits are N5's three and the `EXPORTS` rows,
  MEASURED or read (plan §1.2 V3, §11).
- **P2 is the only phase that starts a run the player did not ask for**, and it
  is alone so its claim — no storage byte moves and no seat fires — is about a
  commit that changed nothing else. MEASURED (V1) it owes no closed repair.
- **P3 is the one phase that touches `tally` and `C.ACHIEVEMENTS`**, Paul's
  numbers landed whole, as CS015 P3 was.
- **P4 is the fourteenth soak** — ⛔ **a NEW file, never a widened closed one.**

### ⛔ Preconditions

| Before | What | Whose |
|---|---|---|
| **P1** | §0's answer column filled for N1, N2, N3, N4, N5, N11, N13 | ✅ answered 2026-09-23 |
| P2 | N6, N7, N8, N9, N10 answered | ✅ answered 2026-09-23 |
| P3 | N12 answered CS016, with its three numbers (`depth_reached`'s top tier; `dives_done`'s fact or tiers; `week_lean_well` cut or its par) and the two new rows' names and notes | ✅ answered 2026-09-23 |
| P4 | `../coinless-kit` present beside this repo — `test-cs011-p5.js` and `test-cs012-p3.js` SKIP LOUDLY without it; ⛔ a close cannot skip | ✅ MEASURED present, 2026-09-20 |

### ⛔ The re-records — none

| Phase | Baseline | Moves? |
|---|---|---|
| P1–P4 | `P1_DETERMINISM_HASH` 1229033515 | ⛔ **No** under N1-A. A move is a defect |
| P1–P4 | `GOLDEN_LANES` | ⛔ **No** — CS016 spends no draw (plan §8) |
| P1–P4 | the thirteen closed soaks' paired hashes | ⛔ **No** — V1 and V7 green; V3's and V6's reds are the named pins, not hashes |
| P1–P4 | `STATE_FIELDS` and `state`'s 28 keys | ⛔ **No** (plan §8): nothing of CS016 is on `state` |
| P1–P4 | `COUNTS` (all five) | ⛔ **No** |
| P1–P4 | `TELEMETRY_FIELDS` 29 / `telemetry` v1 | ⛔ **No** |
| P1–P4 | the four kill sites and five kill lines | ⛔ **No** — P3's counters sit on no kill line |

### ⛔ Closed-file edits — in place (plan §11)

| Phase | File | What | Basis |
|---|---|---|---|
| P1 | `test-cs011-p6.js:329` | the `declared` regex gains `onboarding`; the claim and message are unchanged | **MEASURED** (V3) |
| P1 | `test-cs015-p4.js:432` | the same regex, the same way (two assertions read it) | **MEASURED** (V3) |
| P1 | `test-cs015-p1.js:294` | the `OWN_KEYS` literal gains `onboarding` in BOTH strings of the mutation pair | **MEASURED** (V3) |
| P1 | `test-cs015-p2.js:431` | ⛔ **none** — a prompt is MARKED on the trigger step and WRITTEN at `saveTelemetry()`'s four seats, so no bare play step writes. V3's stand-in wrote at `startGame()` and turned this RED; the shipped design does not | **MEASURED** (V3) + PREDICTED |
| P1 | `scratchpad/_harness.js` `EXPORTS` | +`promptScan`, +`promptStep`, +`drawPrompt`, and the module's bag accessors if top-level | PREDICTED (read) |
| P1 | `test-cs011-p2.js:119`, `:130`, `test-cs008-p7.js` | ⛔ **none** under N5-A. Under N5-B `settings`' shape moves in 2 files, 21 assertions | **MEASURED** (V2) |
| P1 | `test-cs008-p4.js`, `test-cs008-p6.js` | ⛔ **none** — one `fillText` site, no rectangle, no banned word | **MEASURED** (V7 green) |
| P2 | every closed front-door soak | ⛔ **none** — no closed test idles 20 s on the title | **MEASURED** (V1) |
| P2 | `_harness.js` `EXPORTS` | +`attractDrive` | PREDICTED |
| P3 | `test-cs015-p3.js` `REACH` and the pool-length line | +`wellTokens`, +`wellThornsCleared` (+`cleanDives` if re-aimed), each MEASURED by its own four passes | **MEASURED** (V6: 3 assertions, one file) |
| P3 | `test-cs015-p1.js`, `test-cs015-p4.js` | any fixture pinning a specific week's five ids under the old pool length | **MEASURED** (V6: 3 assertions, one file) |
| — | `test-cs004-p1.js`, `test-cs006-p2.js`, every level-1 soak | ⛔ **none** under N1-A. Under N1-B: 8 files red with one extra draw, 7 with none | **MEASURED** (V4, V4b) |
| — | kit `VERSION` pins, `in <OBJECT>` assertions, `test-cs013-p1.js:63` | ⛔ **none** | **MEASURED** (grep) |

⛔ **An edit this table does not predict is a finding.** Stop, record it in
`STATUS.md` with its cause, and make the edit only if it restores the claim the
closed test was always making. ⛔ **A fixture is repaired to restore its
precondition, never relaxed.**

---

## P1 — the prompts

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS016.md` §0
> (N1–N5, N11, N13 **and their ANSWERS**; §0.1; the readings), §1.2, §1.3,
> §1.4, §1.6, §1.7, §1.8, §2, §3, §7, §8, §10, §11 and §12. Then
> `VECTOR-VORTEX-GDD.md` §0, §1, §10.2, §10.3, §10.4, §12, §15.1, §15.2,
> §16.4, §18 and §19. Then `src/23-main.js`'s `update()`, `draw()`,
> `startGame()`, `runAction()` and `syncScreen()`; `src/22-meta.js`'s
> `Profiles`, `activateSettings()`, `saveTelemetry()` and its four callers,
> `sounded()` and `boot()`; `src/13-render-well.js`'s `drawText()`;
> `src/15-render-hud.js`'s `hudLayout()`; `src/07-enemies.js`'s class list;
> `build.js`'s `MANIFEST`. Then `scratchpad/_harness.js`, `test-cs008-p4.js`
> (the throat-zone method), `test-cs011-p6.js:320–335`,
> `test-cs015-p4.js:425–440`, `test-cs015-p1.js:290–306`,
> `test-cs015-p2.js:424–432` and `test-cs002-p1.js:400–440`. Create
> `log/CS016.md`. ultrathink.
>
> ⛔ **§0: build N1–N5, N11 and N13 exactly as ANSWERED and re-open none.**
>
> **1. ⛔ GDD §12's "within four seconds a player who does nothing sees a
> death" is MEASURED FALSE and you do not make it true.** The first enemy
> leaves the throat at 1.600 s and reaches the rim at 6.883 s on every seed
> (plan §1.3); both numbers are heat-clock bases. Under N1-A you REWRITE §12's
> first paragraph to the measured sentence and touch no constant, no spawn
> lane, no schedule. ⛔ `GOLDEN_LANES` and `P1_DETERMINISM_HASH` do not move.
>
> **2. Record §0.1's findings in `STATUS.md` first**: §12's "half speed" names
> nothing in the build; the `EXPORTS` count you find. ⛔ **Set
> `C.GAME_VERSION` to `"0.0.12"`** (Paul, 2026-09-23 — CS015 is 0.0.12; plan
> §0.1); the CS016 close bumps it to `"0.0.13"`.
>
> **3. The module (N11).** `src/22-onboarding.js`, in `MANIFEST` directly
> after `22-meta.js`: `promptScan(state, well, seen, queue)`,
> `promptStep(queue, dt)`, `drawPrompt(ctx, queue)` as TOP-LEVEL functions — a
> soak stubs them by name — and its two bags. ⛔ It calls no storage:
> `22-meta.js` gains `promptsSeen()`, `promptSeen(id)` (marks, in Meta's
> closure) and `savePrompts()` (writes), and stays the one route. ⛔ **No
> device token in the module** (`test-cs002-p1.js` scans every banner slice).
> Update `MANIFEST`, `CLAUDE.md`'s code map, GDD §16.4 and `STATUS.md`.
>
> **4. `C.PROMPTS` and the constants (N2, N3, N4).** `{ id, text }` rows in
> §12's order plus whichever of N2's rows 8–12 Paul answered — ⛔ **a row Paul
> did not answer is NOT built** — and `PROMPT_Y`, `PROMPT_SIZE`, `PROMPT_COLOR`,
> `PROMPT_TIME`, `PROMPT_FADE` under Presentation beside `ATTRACT_IDLE`. ⛔ No
> trigger, class name or level in `C` (plan §7). ⛔ Every text ≤ 36 characters
> and checked against the vocabulary table BY EYE as well as by the scan.
>
> **5. The scan.** Called from `update()` after the two end-of-frame filters
> and before `updateSpawner()`. It reads `state.enemies` by `instanceof`,
> `state.purgeUses`, `well.closed`, and — for answered rows — `state.tokens`,
> `state.dive` and Meta's unlock counter. ⛔ **It spends no draw, reads no clock,
> writes no `state`, and stops reading the board once every row is seen.** One
> fire per step, FIFO, `PROMPT_TIME` each; the clock counts UP on play steps
> only; `startGame()` empties the queue; a death keeps it.
>
> **6. The key (N5).** `onboarding` declared v1 beside `achievements`, no
> `migrate`, in `OWN_KEYS` (⛔ never `scores`, never `profiles`), loaded
> known-value-else-default at `activateSettings()`'s seat so a profile switch
> resets then loads. ⛔ **WRITTEN ONLY at `saveTelemetry()`'s four seats** —
> the clear edge, `runEnded()`, `autoPause`, `beforeChange` — because
> `test-cs015-p2.js:431` pins "no storage write on a play step that is not the
> clear edge" (MEASURED red under a trigger-step write, plan §1.2 V3).
>
> **7. The draw (N3).** `drawPrompt()` from `draw()` AFTER the well and the
> Dive's rungs and BEFORE the tokens: an airborne craft reaches y 666 (plan
> §1.6) and goes over the line, never under. `drawText()` only, centred, at
> `PROMPT_Y` 636 / `PROMPT_SIZE` 28 unless N3's answer says otherwise; in play
> and pause; never on another screen. ⛔ No rectangle, no fill, no HUD edit.
>
> **8. ⛔ DO NOT BUILD:** the idle timer, the driver, anything attract; a
> sound; a `tally` field; a screen value; a telemetry column; a toast.
>
> **9. GDD.** §12 rewritten whole to shipped behaviour (N1's sentence, the
> table with ids and triggers, the band, the key, the seats); §10.4 one line
> for the band; §15.1's key table; §16.4's tree; §19 gains the Onboarding row
> from plan §12 (N13).
>
> **10. The test, `scratchpad/test-cs016-p1.js`** — plan §3's list. ⛔ Seed
> above the first `buildGame()`. ⛔ A mutation run that throws is a defect in
> the test. ⛔ A played Classic session hashes identically step for step with
> `promptScan` and `promptStep` stubbed out.
>
> **11. Expect exactly these closed-file edits** (plan §11): the two declared
> regexes, `test-cs015-p1.js`'s `OWN_KEYS` literal, `_harness.js`'s `EXPORTS`.
> ⛔ Anything else is a finding. ⛔ **Run `node scratchpad/run-all.js` before
> committing.** Update `STATUS.md` (ledger line + ≤ 200 words), `CLAUDE.md`'s
> Save-data table and code map. Commit "CS016 P1: the prompts, the band and
> the onboarding key".

---

## P2 — attract mode

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS016.md` §0
> (N6–N10 **and their ANSWERS**), §1.2 (V1), §1.5, §1.7, §2, §4, §8, §9, §10,
> §11 and §12. Then `VECTOR-VORTEX-GDD.md` §0, §1, §9.5, §10.4 (H4), §10.5,
> §12, §15.3, §15.4, §15.5 and §15.6. Then `src/22-onboarding.js` whole,
> `src/23-main.js`'s `startGame()`, `runAction()`, `pauseRun()`,
> `quitToTitle()`, `update()`, `draw()`, `frame()`, `audioFrame()` and the
> boot block; `src/22-meta.js`'s `runStarted()`, `eligible()`, `clearEdge()`,
> `runEnded()`, `levelRecord()`; `src/21-telemetry.js`'s `sample()`;
> `src/19-sfx.js`'s `musicStateFor()`; `src/04-input.js`'s `sample()` and
> `onAction`. Then `scratchpad/test-cs014-p3.js:120–210` (the hunter you port),
> `test-cs015-p4.js:150–260` (the front-door helper) and
> `test-cs011-p6.js:270–300`. Append to `log/CS016.md`. ultrathink.
>
> ⛔ **§0: build N6–N10 exactly as ANSWERED and re-open none.**
>
> **1. The idle timer (N10).** In `update()`'s menu branch, TITLE only:
> simulation `dt` accumulates while the sampled struct is at rest (`rotate`
> 0, no button held) and no named action arrived; anything else zeroes it; at
> `C.ATTRACT_IDLE` the demo starts. ⛔ **Not a clock read** — `Date.now` and
> `performance.now` keep their four shipped readers (plan §1.7). MEASURED (V1):
> no closed test idles 20 s on the title, so no fixture moves.
>
> **2. The start (N7, N8).** `startGame(C.ATTRACT_SEED, { mode:
> C.ATTRACT_MODE, startDepth: C.ATTRACT_DEPTH, attract: true })`. Under
> `attract: true`, `startGame()` skips `Meta.runStarted()` and the
> `lastRunMode` write. ⛔ **`run` stays null, so `eligible()` reads false at
> every seat with no new term** — the gate gains nothing. `state.screen` stays
> `"play"`; a `Game`-closure flag says it is a demo. ⛔ **Three explicit skips**
> on that flag: `levelRecord().noteCleared()` at the clear edge (MEASURED the
> one writer outside the gate, plan §1.5), `Telemetry.sample()`, and
> `Meta.clearEdge()`. The prompt scan is skipped too.
>
> **3. The driver (N6).** `attractDrive(state, well, out)` in
> `22-onboarding.js`, a port of `test-cs014-p3.js`'s four-clause hunter plus a
> periodic Purge ⚠, writing the four-field struct AFTER `input.sample()` on the
> same line of `update()`. ⛔ The values `sample()` wrote are read FIRST: a
> `rotate !== 0` or a held button ends the demo (N9). ⛔ No listener, no device
> read outside `04-input.js`, no `state` write beyond the struct.
>
> **4. The ending (N9).** `runAction()` in attract ends the demo on ANY named
> action and dispatches nothing else — no pause, no bench spawn, no well cycle,
> no telemetry toggle, no `saveTelemetry()`. The demo's game over ends it at
> once (no game-over screen); so does `C.ATTRACT_LENGTH`. The ending is
> `quitToTitle()`; the `'quit'` seat cannot fire (the screen is never pause)
> and the title's entry step latches what is held, so the ending press confirms
> nothing.
>
> **5. What it shows.** The board and the HUD as shipped (`runOnScreen()` needs
> no edit) plus `C.ATTRACT_LINE` through `drawPrompt()`'s seat, never a prompt
> row. Music through the unchanged `musicStateFor()`; ⛔ no audio edit, no new
> sound. ⚠ Record in `SKIPPED-PLAYTESTS.md` that a fresh load's demo is silent
> by the browser's gesture rule (K6) and that the demo's readability as a demo
> is a human judgment.
>
> **6. ⛔ DO NOT BUILD:** a screen value, a pause path in the demo, a storage
> write, a `tally` field, a telemetry column, a `sfx` seat, a HUD rectangle.
>
> **7. The test, `scratchpad/test-cs016-p2.js`** — plan §4's list, and above
> all: ⛔ **the store's bytes are identical before and after a demo that clears
> a well and dies** (the ninth soak's method), spies on `runStarted`,
> `runEnded`, `clearEdge`, `noteCleared`, `Telemetry.sample` and
> `sfx("unlock")` at zero, `eligible()` false on every demo step, no prompt
> fired, `lastRunMode` unchanged, the demo's whole hash identical on two loads,
> and ⛔ a played session that never idles hashing identically with
> `attractDrive` stubbed out.
>
> **8. Expect exactly one closed-file edit**: `_harness.js`'s `EXPORTS`
> (+`attractDrive`). ⛔ Anything else is a finding. ⛔ **Run
> `node scratchpad/run-all.js` before committing.** Update `STATUS.md`, GDD §12,
> `CLAUDE.md` if a rule landed. Commit "CS016 P2: attract mode".

---

## P3 — the pre-ship achievement pass (⚠ only if N12 says CS016)

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS016.md` §0 (N12
> **and its ANSWER, with Paul's three numbers**), §1.2 (V6), §2, §5, §10, §11
> and §12. Then `NEXT-STEPS.md` whole. Then `VECTOR-VORTEX-GDD.md` §0, §1,
> §15.5, §17 item 10 and §19's Meta row. Then `src/02-state.js`'s `tally`,
> `src/10-powerups.js`'s `updateTokens()`, `src/07-enemies.js`'s
> `Thorn.chip()`, `src/22-meta.js`'s `wellWindow()` and `facts()`,
> `src/00-config.js`'s `ACHIEVEMENTS`. Then `scratchpad/test-cs015-p3.js`
> whole (its `REACH` and the four probe passes behind it) and
> `test-cs015-p1.js`'s rotation cases. Append to `log/CS016.md`. ultrathink.
>
> ⛔ **§0: build N12 exactly as ANSWERED.** ⛔ **No `id` is renamed, no
> `lifetime` row deleted, no kill line edited, no number invented** — a
> threshold Paul did not write is a stop, not a guess.
>
> **1. The counters.** `tokensCollected` in `updateTokens()` beside the kind
> mask; `thornsDestroyed` in `Thorn.chip()` on its own `dead` edge. ⛔ Both
> write-only; ⛔ neither at a kill line — a Thorn dies inside its own `onShot`,
> so `tallyKill()` is not its seat and the pinned kill-line strings do not move.
>
> **2. The facts and the rows.** `wellTokens` and `wellThornsCleared` in
> `wellWindow()`; the two pool rows with Paul's names (≤ 20) and notes (≤ 60);
> `depth_reached`'s top tier, `dives_done`'s fact or tiers, and `week_lean_well`
> cut or re-parred — each exactly as answered. ⛔ **Re-measure `REACH` with
> `test-cs015-p3.js`'s own four passes** and add the new facts to it; a row the
> front door does not reach is REPORTED, never lowered.
>
> **3. ⛔ Delete `NEXT-STEPS.md`'s entry in this commit** — its own rule — and
> leave "Nothing else queued".
>
> **4. The test, `scratchpad/test-cs016-p3.js`** — plan §5's list, including a
> Classic session hashing identically with both counters mutated out.
>
> **5. Expect the closed-file edits plan §11 names for P3 and no others.**
> ⛔ **Run `node scratchpad/run-all.js` before committing.** Update `STATUS.md`,
> GDD §15.5. Commit "CS016 P3: the pre-ship achievement pass".

---

## P4 — the fourteenth soak, the review, the close

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS016.md` §0 (all
> answers), §2, §6, §8, §10, §11, §12, §13 and §14. Then `VECTOR-VORTEX-GDD.md`
> §0, §1, §12, §17 item 12 and §19 whole. Then `src/22-onboarding.js` whole and
> the three CS016 tests. Then `scratchpad/test-cs015-p4.js` whole (the
> thirteenth soak: its wall-clock fake, its helper, its stubbed twin) and
> `log/CS016.md` whole — ⛔ this is the one session that reads `log/`, because
> the close reviews it. Append to `log/CS016.md`. ultrathink.
>
> **1. The fourteenth soak, `scratchpad/test-cs016-p4.js`** — ⛔ a NEW file.
> Both modes through the front door over a working store, `Date.now` faked as
> WALL time (the frame clock plus a base — the thirteenth soak's finding), Start
> Depths that reach every shipped prompt row; each prompt seen exactly once per
> profile across a RESTART, a reload and a profile switch and back; a title
> idled into the demo and ended by a gesture with zero storage bytes changed,
> then a real run started and eligible; ⛔ a stubbed twin (`promptScan`,
> `promptStep`, `attractDrive` out) hashing identically on every frame of a
> session that never idles; non-vacuity for every claim. ⛔ It must fit
> `run-all.js`'s 120 s per-file timeout; a timeout is not a red.
>
> **2. The review.** Read every phase's `log/CS016.md` entry together;
> compress; move what a later changeset must act on to `STATUS.md`'s reset and
> the rest into the log's close entry with the version line — **0.0.13**, and
> `C.GAME_VERSION` bumped to `"0.0.13"` in the same commit.
>
> **3. The close.** `STATUS.md` reset for CS017 (ship); `ROADMAP.md`'s CS016 row
> to shipped with "What CS016 deliberately left"; `DECISIONS.md` gains one
> index line per §0 call — a pointer, never the writeup; `SKIPPED-PLAYTESTS.md`
> gains the prompts' readability, the demo, and K13's glyphs; GDD §19's
> Onboarding row gets its verdicts; `CLAUDE.md` stays under 50 KB; the two
> planning documents move to `archive/`. ⛔ **Zero skips**: `../coinless-kit`
> must be present. ⛔ **Run `node scratchpad/run-all.js` before committing.**
> Commit "CS016 P4: the fourteenth soak, the review, and the close".
