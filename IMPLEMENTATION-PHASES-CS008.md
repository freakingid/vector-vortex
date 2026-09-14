# IMPLEMENTATION-PHASES-CS008

One phase per Claude Code session. `/clear` between phases. Commit per phase on
`main`; never push.

Each phase below is the literal prompt to paste. A session reads `CLAUDE.md`
and `STATUS.md` automatically, and nothing else unless the prompt names it.

⛔ **`ultrathink` appears inside the prompt text where it is wanted.** It is a
per-turn lever, so it has to be in the pasted message.

**Baseline:** CS007 closed; CS008 planned at `b10d77e`. `node build.js` → 24
modules, 338.8 KB. `node scratchpad/run-all.js` → **34 files, zero skips.**
- `test-registry.js`: `wells: 16`, `openWells: 6`, `tracks: 0`, `enemies: 6`,
  `enemyKinds: 9`.
- `test-cs004-p1.js`'s `GOLDEN_LANES` is on its original `9ebd27b` recording.
- `test-cs006-p2.js`'s `P1_DETERMINISM_HASH` is `3661952239`.
- `src/12-scoring.js`, `src/15-render-hud.js` and `src/22-meta.js` are
  placeholders.
- kit-input (`src/04-input.js`) is `0.3.0`.

✅ **Every design call is answered — Paul, 2026-09-13, `DECISIONS.md` and
`PLANNED-FEATURES-CS008.md` §0.** Seven readings are flagged in §0. ⛔ The only
one a phase must confirm before shipping is P7's sensitivity range.

| Phase | Builds | Model | Effort |
|---|---|---|---|
| P1 | The rim fix — (A) + (B) + ε | Opus 5 | **high** |
| **P1b** | **The crossing fix — the rim sweep** (planned 2026-09-13 at `0b41f55`, after P1) | Opus 5 | **high** |
| P2 | Scoring and extra lives — `addScore()` | Opus 5 | **high** |
| P3 | The run's parameters — mode and Start Depth | Opus 5 | medium |
| P4 | Text, the HUD, and the death fragmentation | Opus 5 | medium |
| P5 | The screens — title → mode → depth → play → game over → restart | Opus 5 | **high** |
| P6 | Pause and Options | Opus 5 | **high** |
| P7 | The Controls page — settings and rebinding | Opus 5 | **high** |
| P8 | The front-door soak, the docs, the close | Opus 5 | **high** |

---

## ⛔ Why the seam falls here

**P1 goes first because Paul said so (R3), and because it is measured.** Every
later phase is judged by playing, and the shipped rim is a 6-in-24 coin flip on
the single most common arrival (plan §1.1). P1 is also the phase with **both**
of CS008's re-records. Landing it before any front-of-house code means those
re-records have exactly one cause each, with nothing else moving beside them.

**P2 before P3, because P3's bonus is paid through P2's `addScore()`.** And P2
is the phase that repairs the closed "no score yet" assertions, so P3 inherits
a suite that already expects a score.

**P3 before any screen.** The Start Depth screen is a list of `startGame()`
parameters. The parameters, the formula, the bonus timing and the session
record are all headless and testable without a menu. ⛔ This is CS005 P1's
shape: the phase with no UI makes the UI phase one thing.

**P4 before P5, because every screen draws text.** P4 builds the one `drawText`
path, and puts the HUD and the fragmentation on it, all draw-path and all
baseline-free.

**P5 is the flow and the menu model; P6 and P7 are pages on it.** Pause needs a
menu, Options needs a menu, and the Controls page needs Options. ⚠ **If P5 or P6
overruns a session, split the changeset at P5/P6**; plan §1.15 measures the
renumber at 62 pointers.

**P8 is the close and a sixth soak file** — `STATUS.md`: "a future changeset
extends the pattern with a sixth file rather than widening a closed one."

### ⛔ The re-records — in P1 and P1b, and nowhere else

| Phase | Baseline | Cause |
|---|---|---|
| P1 | `test-cs006-p2.js` `P1_DETERMINISM_HASH` 3661952239 → **1862183225** | the rim fix. The plan measured the parts: ε alone 3661952239 (unchanged); (A) alone 3063940911; (B) alone 3924408609 |
| P1 | `test-cs004-p1.js` `GOLDEN_LANES` → `[…,12,3,2,5]` | (B), the climb stops at the kill band. ⛔ **The first 16 entries do not move** |
| **P1b** | `test-cs006-p2.js` `P1_DETERMINISM_HASH` 1862183225 → **1229033515** | ⚠ two, measured apart: the rim sweep alone 4203989832; the soaks' first-run `lives = 1` fixture alone 2859072280 (plan §1.16). ⛔ `GOLDEN_LANES` does not move |
| P2–P8 | ⛔ none | — |

**Why P1b sits between P1 and P2 (K4).** Paul played P1 and could not survive
crossing a rim Vaulter. P2 onward is judged by playing, as P1 was, and P1b
moves the hash. Landing it before scoring keeps that move to one phase whose
causes are measured.

---

## P1 — the rim fix

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS008.md` §0, §1.1–§1.7,
> §2 and §9. Then `VECTOR-VORTEX-GDD.md` §0, §1, §4.2, §4.4, §6.1, §6.5, §17.
> Then read `src/06-shots.js`, `src/09-collision.js`'s `collideShots`, the four
> climbs and `Vaulter.atRim()` in `src/07-enemies.js`, and `Game.update()`'s
> ordering in `src/23-main.js`. ultrathink.
>
> ⛔ **THE DESIGN CALL IS MADE — Paul, 2026-09-13: (A) + (B), 100 % killable at
> the rim.** The planning session proved (A) + (B) alone is 75 %, not 100 %,
> because `Math.abs(1 - 0.95) > 0.05` in IEEE-754, so the fix has a third part,
> ε. ⛔ **Do not re-open the choice, and do not touch rotating ONTO a parked
> enemy** (plan §1.2) — Paul deferred it to playtest.
>
> **1. The fix, three parts** (plan §2):
>
> - **(A), ordering A1.** `updateShots()` ages every shot already in flight and
>   filters the dead, THEN fires. The `SHOT_MAX` check reads the
>   post-retirement length. ⛔ Not A2 (cap check before ageing): measured worse
>   (§1.1). Rewrite the file header's ordering note to say why the order is
>   what it is.
> - **(B).** The Vaulter, Carrier, Drifter and Surger climbs clamp at
>   `1 - C.RIM_CONTACT_DEPTH`. ⛔ The expression, never `this.killDepth` — the
>   Surger mutates that to 0. `Vaulter.atRim()` moves to the same expression.
>   ⛔ The `WeaverBolt` is NOT changed: it self-terminates at 1. Each clamp's
>   comment ("stops at the rim; depth > 1 is not a legal position") is now half
>   wrong — correct it in place.
> - **(ε).** `C.HIT_DEPTH_EPS` = `1e-9`, used in exactly one comparison:
>   `collideShots()`'s band test. Its comment carries the number
>   `0.050000000000000044` and says it absorbs representation error and is not
>   a tuning margin.
>
> **2. Your test, `scratchpad/test-cs008-p1.js`.** Drive the real build:
>
> - **The arrival table.** Hold fire through `G.input.keyDown(" ")`; hold the
>   spawner (`state.spawn.remaining` above 0 and `state.spawn.timer` very
>   negative, or the empty well clears and dives); pre-fire 0..23 ticks to walk
>   all 24 cooldown phases. Then assert kills out of 24:
>   - **S1** — a Vaulter at the park depth, one lane away, hunting (level 1),
>     hops into a stationary Skimmer → **24/24**;
>   - **S2** — a Vaulter climbing the Skimmer's own lane → **24/24**;
>   - **S4** — a rim Drifter homing in → **24/24**.
>
>   On the Ring AND on an open well. ⛔ A run that ends in neither outcome is a
>   failure, not a skip.
> - **Mutation-sensitive, and prove it.** Before committing, confirm each of
>   these turns your file red, then revert: ε removed (plan measured S1 → 18);
>   (A) reverted (S1 → 18); `atRim()` left at `depth >= 1`. Record the three
>   results in `log/CS008.md`.
> - **The park depth itself**: each of the four climbs settles at exactly
>   `1 - C.RIM_CONTACT_DEPTH`; a Vaulter hunts once there.
>
> **3. ⛔ The closed-file inventory — plan §1.5, repaired IN PLACE.** Measured at
> `b10d77e` with the fix applied: 19 failures in 8 files, plus two VACUOUS
> passes. Every repair in §1.5's table was applied in a copy and the suite went
> 34/34. Re-run the suite first and diff your failure list against §1.5. ⛔ **A
> failure not in that table is a NEW cause**: stop and record it in `STATUS.md`
> before editing anything.
>
> - The park-depth rewrites in `test-cs003-p1`, `cs003-p5`, `cs004-p2`,
>   `cs005-p2` and `cs005-p3`, including tightening the `> 1` overshoot bounds
>   to the park depth. ⛔ The claim each makes is "the climb stops where it
>   should"; that is what moves, not the claim.
> - ⛔ **`test-cs004-p5.js:609` and `test-cs005-p5.js:698` pass VACUOUSLY under
>   the fix** — green only because a Weaver bolt still reaches depth 1. Repair:
>   `!(e instanceof X.WeaverBolt) && e.depth >= park`.
> - `test-cs007-p3.js:332`: `bandRun(22, 2 * DT_TICKS)`. The first Drifter
>   cargo moved from tick 732 to 1,355 in a 1,200-tick window. It is a window,
>   not a claim.
>
> **4. ⛔ The two re-records** (plan §9), each with ONE cause written at the
> assertion:
>
> - `P1_DETERMINISM_HASH` → expect **1862183225**. ⛔ If you get a different
>   value, your code is not behaviourally §2's. Find out why before
>   re-recording anything.
> - `GOLDEN_LANES` → `[10,10,12,0,8,14,12,12,8,14,10,0,7,7,12,3,2,5]`. ⛔ **The
>   first 16 entries must be character-identical.** `STATUS.md` says a move
>   here is a defect: write the exception at the assertion and in `STATUS.md` —
>   *one cause, the climb stops at the kill band, appends only* — and do not
>   weaken the rule for anything else.
> - ⛔ Guards, all green without edit: `test-cs006-p5.js`'s draws-per-spawn
>   count, `test-cs006-p2.js`'s three geometry goldens, `test-cs007-p2.js`'s
>   respawn guarantee.
>
> **5. Docs.**
> - GDD §6.1 ("stops at the rim" → the kill band), §4.2 (a shot is tested at
>   the rim on its fire tick), §6.5's `killDepth` row, and §17.
> - `NEXT-STEPS.md` is already clear of this entry; do not re-add it.
> - `STATUS.md`: the ledger line; move the rim entry out of Known issues; the
>   golden exception.
> - `log/CS008.md` (create it): the reasoning and the three mutation results.
> - `PLAYTEST.md` is P8's.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> Nonzero exit means not done. ⛔ Edit docs in place. ⛔ Do not push.

---

## P1b — the crossing fix: the rim sweep

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS008.md` §0 (R4 and
> K1–K4), §1.16, §2b, §9 and §10's P1b. Then `VECTOR-VORTEX-GDD.md` §0, §1,
> §4.2, §4.5, §6.5, §17. Then read `src/09-collision.js` end to end, every
> `onShot` in `src/07-enemies.js`, `scratchpad/test-cs008-p1.js` (your fixture
> shapes are its shapes), and the `hashRun()` openings of `test-cs004-p5.js`,
> `test-cs005-p5.js` and `test-cs006-p5.js`. ultrathink.
>
> ⛔ **THE DESIGN CALLS ARE MADE — Paul, 2026-09-13, K1–K4.** With fire held, a
> rim enemy the Skimmer touches dies if a shot could kill it. The mechanism is
> the rim sweep, and the plan measured every shot-based alternative short of
> 24/24 (§1.16). ⛔ **Do not re-open it, and do not touch `updateShots()`, the
> cooldown, `SHOT_MAX`, `HIT_LANE_TOL` or the contact geometry.** A riding
> Drifter, a Weaver bolt and a Surger discharging below the rim still kill
> (K3). A player not holding fire still dies on contact.
>
> **1. The fix** (plan §2b) — in `collideSkimmer()`, after the lane match and
> before `killSkimmer()`:
> ```js
> if (state.input.fire && e.depth >= 1 - C.RIM_CONTACT_DEPTH) {
>   e.onShot(null);
>   if (e.dead) { state.tally.kills++; continue; }
> }
> ```
> - ⛔ `onShot`, never `e.dead = true`: armour must refuse and a Carrier must
>   split.
> - ⛔ `continue`, never `return`: stacked enemies are each asked.
> - ⛔ No new `C` constant: the depth gate is the park expression.
> - Correct the file header, `collideSkimmer()`'s header and the "No scoring"
>   note in place. The header carries §1.16's C10 and C13 numbers, so a later
>   session sees why this is contact-side and not shot-side.
>
> **2. Your test, `scratchpad/test-cs008-p1b.js`** — §1.16's probe shape on the
> real build, through `Game.update()`:
> - Spawner held. Fire held through `G.input.keyDown(" ")`. **40 + p ticks of
>   pre-fire, p = 0..23.** ⛔ Assert the rack is FULL (`C.SHOT_MAX`) at
>   placement: a short pre-fire hides the shot cap, which is how
>   `NEXT-STEPS.md`'s 17/24 happened.
> - Enemy two lanes away at `1 - C.RIM_CONTACT_DEPTH`. Move to four lanes away
>   and wait 20 ticks.
> - **C1–C13 → 24/24 killed. N1–N3 → 24/24 died.** ⛔ A run that ends in
>   neither is a failure, not a skip.
> - ⛔ C4 asserts the Skimmer really reached exactly 6.5.
> - ⛔ C7/C8 assert 3 kills: the split happened through `onShot`.
> - ⛔ C13 asserts both stacked Vaulters died.
> - **Mutation-sensitive, and prove it.** Confirm each turns your file red,
>   then revert:
>   - sweep removed → the shipped column;
>   - fire gate removed → N1 killed;
>   - depth gate removed → N3 killed;
>   - `e.dead = true` for `onShot` → N2 killed.
>
>   Record all four in `log/CS008.md`.
> - ⛔ `test-cs008-p1.js` stays green **unedited**. P1's arrival guarantee is
>   not yours to restate.
>
> **3. ⛔ Closed files, IN PLACE — plan §1.16, measured.** Re-run the suite
> after the fix and before any test edit. Expect exactly five failures:
> - `test-cs004-p5.js:330`, `test-cs005-p5.js:360` and `test-cs006-p5.js:363`
>   ("game-over stop");
> - `test-cs007-p4.js:562` ("the recorded list dies");
> - `test-cs006-p2.js`'s hash at **4203989832**.
>
> ⛔ **Any other red, or a different hash, is a NEW cause.** Stop and record it
> in `STATUS.md` before editing anything.
> - The three soaks: `st.lives = 1;` after the FIRST `armMixed()` in
>   `hashRun()`, never after a restart. Measured: a game over AND a respawn
>   stay in both hashed windows. `lives = 1` on every run drops the respawn
>   path out of the hash, and `lives = 2` never stops at L7.
> - `test-cs007-p4.js`: `CAPTURE_TICKS` 6000 → **7300**, with the measured
>   deaths (7,028 in, 7,574 out) written at the constant. ⛔ 8,000 is red:
>   the run stops inside the window.
> - Each edit's comment says it **restores the precondition**: the scripted
>   player holds fire, so under the sweep it dies too rarely. Never frame it as
>   relaxing a check.
>
> **4. ⛔ The one re-record** — `P1_DETERMINISM_HASH` → expect
> **1229033515**.
> - Write all three at the assertion: 4203989832 (sweep alone), 2859072280
>   (fixtures alone), 1229033515 (both).
> - ⛔ A different value means your code is not §2b's. Find out why first.
> - ⛔ Guards, green without edit: `GOLDEN_LANES` (all 18 entries), the
>   draws-per-spawn count, `test-cs007-p2.js`, `test-cs008-p1.js`.
>
> **5. Docs.**
> - GDD §4.5 ("Shipped, CS008 P1b"), §4.2 (the "rotating onto… deferred"
>   sentence goes), §6.5 (`onShot` is also asked by the sweep), §17.
> - `STATUS.md`: the ledger line; move the crossing entry out of Known issues;
>   the hash value; test count 36.
> - `log/CS008.md`: the reasoning and the four mutation results.
> - `NEXT-STEPS.md` is already clear of this entry.
> - `PLAYTEST.md` is P8's.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> Nonzero exit means not done. ⛔ Edit docs in place. ⛔ Do not push.

---

## P2 — scoring and extra lives

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS008.md` §0 (P1s–P4s
> and the readings), §1.8, §1.10 and §3. Then `VECTOR-VORTEX-GDD.md` §0, §1,
> §4.3, §4.4, §6.5, §7, §15.6, §17. Then `src/09-collision.js`, the `onShot`
> methods in `src/07-enemies.js`, `src/11-dive.js`'s termination kill,
> `src/21-telemetry.js`, and the clear edge in `src/23-main.js`. ultrathink.
>
> ⛔ **Every scoring call is answered** (plan §0). Drifter thirds, rim pays
> most. Purge kills score. Lives at 20k, then every 40k. Clear bonuses on the
> clear step, and a dive death does not void "no death". ⛔ Do not add a combo,
> a multiplier, a sound, or a HUD — those are CS012, CS009 and P4.
>
> **1. Build plan §3.**
> - `addScore(n)` in `12-scoring.js` is the only writer of `state.score` and
>   the only life-awarder, through `state.nextLife`.
> - `points()` is a fourth contract method: base 0, the table in §3. The Thorn
>   scores per chip from its own `onShot`, and its `points()` is 0.
> - The kill sites award on the false→true `dead` transition. **There are
>   three:** `collideShots()`, `collideSkimmer()`'s rim sweep (P1b, plan §3),
>   and both Purge uses. The dive termination awards nothing.
> - The three clear bonuses at the clear edge, in a fixed order. The no-death
>   flag is cleared in `enterWell()` and set in `killSkimmer()`.
> - ⚠ An award past `LIVES_MAX` is lost silently in CS008. Leave one comment
>   where CS009 voices it.
> - ⛔ `C.PTS_DRIFTER`'s band index is derived from the array's length, never a
>   literal 3.
>
> **2. Telemetry.** Delete `score` from `C.TELEMETRY_PLACEHOLDER`; the column
> reads `state.score`. ⛔ `TELEMETRY_FIELDS`, `TELEMETRY_KINDS` and
> `telemetryRow()` keep their order — only the source moves.
>
> **3. Your test, `scratchpad/test-cs008-p2.js`.**
> - Every GDD §7 row Classic can produce, staged. That includes each Drifter
>   band, including the exact boundaries ⅓ and ⅔; a Carrier and then its
>   children; a Thorn chipped to death (5 per chip, nothing extra); both Purge
>   uses; a Purged bolt (0); a dive-destroyed Thorn (0).
> - Lives at exactly 20,000, 60,000, 100,000. One award crossing two
>   milestones. The cap.
> - The clear bonuses on the clear step: `100 × level`; +500 with the Purge
>   unspent; +1,000 with no death; no-death still paid when the dive that
>   follows kills.
> - ⛔ **GDD §17 item 8** — a played board where every step's score delta equals
>   the events of that step, observed off the board. ⛔ No production event log
>   built only for this test.
> - Scoring spends no RNG draw: count draws across a scoring-heavy run against
>   the same run with `addScore` stubbed.
>
> **4. ⛔ Closed files, IN PLACE** (plan §1.8, measured):
> - `test-cs003-p3.js:91` and `test-cs003-p4.js:127` — "no score field" → the
>   field is born at 0.
> - `test-cs005-p2.js:115` and `test-cs005-p3.js:115` — "still unread" → the
>   constant's reader.
> - `test-registry.js` gets a `CS008` state-field entry.
>
> Any other red is a NEW cause: record it in `STATUS.md` before editing.
>
> **5. ⛔ No baseline moves** (plan §9, PREDICTED). If `P1_DETERMINISM_HASH`
> moves, scoring spent a draw or awarded a life inside the hashed run: find it.
>
> **6. Docs.** GDD §7 and §4.4 ("Shipped, CS008 P2"), §6.5 (four methods),
> §15.6 (placeholder now 3 keys). `STATUS.md`: ledger line; correct the false
> claim that the Drifter and Surger have no points constants (plan §1.10).
> `log/CS008.md`.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> ⛔ Edit docs in place. ⛔ Do not push.

---

## P3 — the run's parameters: mode and Start Depth

**Model: Opus 5 · Effort: medium**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS008.md` §0 (S1–S3, M1
> and the Start Depth list reading), §1.10, §1.12 and §4. Then
> `VECTOR-VORTEX-GDD.md` §0, §1, §3.6, §4.6, §13, §15.6. Then `startGame()`,
> `enterWell()` and `nextWell()` in `src/23-main.js`, and `src/02-state.js`.
>
> ⛔ **Answered: the formula is canonical, the bonus is paid on clearing the
> starting well, and the list expands in memory.** No screen this phase — P5
> draws it.
>
> **1. Build plan §4.**
> - `startGame(seed, opts)` — defaults bit-identical.
> - `state.mode` and `state.startDepth`.
> - `startBonus(d)` from `C.START_BONUS_SCALE` / `_EXP` / `_ROUND`.
> - The bonus at the clear edge when `state.level === state.startDepth`,
>   through `addScore()`.
> - `C.START_DEPTH_FIRST` and `C.START_DEPTH_CAP`.
> - The session record of the highest level cleared, in `22-meta.js`, behind
>   one function CS011 re-points. ⛔ Not in `state`; it must survive
>   `startGame()`.
> - `startDepthOptions()` returning the list.
>
> **2. Telemetry.** Delete `mode` and `startDepth` from
> `C.TELEMETRY_PLACEHOLDER`; only `maxCombo` is left.
>
> **3. Your test, `scratchpad/test-cs008-p3.js`.**
> - `startGame(seed)` equals `startGame(seed, {mode:"classic", startDepth:1})`
>   under a state hash.
> - `startBonus` gives 0 / 2,400 / 7,400 / 14,100 / 22,300 / 67,600 / 204,800
>   at 1 / 3 / 5 / 7 / 9 / 17 / 33, and 887,200 at 81.
> - A run started at 9 is paid on its first clear exactly once, is not paid
>   again at 10, and is never paid if it dies in well 9.
> - The list: 1–9 at launch; clear level 14 → the list reaches 13; clear 90 →
>   it caps at 81.
> - ⛔ A run started at 81 lands on `WELLS[0]` with `bandRoll` 0 (plan §1.12).
>
> **4. ⛔ No baseline moves.** Closed tests call `startGame(seed)`. Any red is a
> default that is not bit-identical.
>
> **5. Docs.**
> - GDD §4.6: **correct the table to the formula** (plan §1.10) and add
>   "Shipped, CS008 P3".
> - GDD §15.6: placeholder now one key.
> - `STATUS.md`: re-word the past-99 entry as unreachable while the cap is 81;
>   correct "two bites" to three. Ledger line.
> - `log/CS008.md`.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> ⛔ Edit docs in place. ⛔ Do not push.

---

## P4 — text, the HUD, and the death fragmentation

**Model: Opus 5 · Effort: medium**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS008.md` §0 (T1, U9,
> H1–H3 and the Purge-charge and inset readings), §1.13, §1.14 and §5. Then
> `VECTOR-VORTEX-GDD.md` §0, §1, §4.3, §4.4, §10, §15.7, §18. Then
> `src/13-render-well.js`, `src/14-render-entities.js`, `Game.draw()` and
> `Game.frame()` in `src/23-main.js`, and `touchButtonCenters()` in
> `src/04-input.js`.
>
> ⛔ **Answered: one `drawText()`, reserve icons, "LEVEL n" in the band colour,
> inset beside the touch buttons, and the craft breaks into its own lines.**
>
> **1. Build plan §5.**
> - `drawText()` beside `glowStroke`, two-pass glow, ⛔ the ONLY
>   `fillText`/`strokeText` in the build.
> - `drawHud(ctx, view)` in `15-render-hud.js`, taking an explicit view with no
>   `state` reach, called from `Game.draw()` last.
> - `drawFragments()` in `14-render-entities.js`, driven by hit-stop progress,
>   ⛔ no RNG and no new clock, drawn instead of a dead craft.
> - Every size, offset, drift, spin and alpha is a `C` constant.
>
> **2. `CLAUDE.md`.** One line under Rendering naming the sanctioned text path.
> ⛔ Check the file stays under 50 KB.
>
> **3. `src/14-render-entities.NOTES.md`** (create it; plan §5). Scoped to the
> fragment primitive and the glow helpers it reuses, in
> `lib/MODULE-NOTES-TEMPLATE.md`'s shape.
>
> **4. Your test, `scratchpad/test-cs008-p4.js`.**
> - A source-text assertion: exactly one `fillText` and one `strokeText` site,
>   and zero `fillRect`/`strokeRect`, in the built file.
> - HUD rectangles clear of the throat zone (`depth < C.READABILITY_DEPTH`) on
>   all 16 wells.
> - HUD rectangles clear of both touch buttons, mirrored and not.
> - Reserve icons equal `lives − 1`.
> - The Purge glyph is bright / dim / absent at uses 0 / 1 / ≥ 2.
> - Fragments: identical draw calls for identical hit-stop progress; ⛔ no
>   `state.rng` reachable from `drawFragments`; `t` runs 0 → 1 across
>   `C.HIT_STOP_DEATH`.
>
> **5. ⛔ No baseline moves.** Draw path only.
>
> **6. Docs.** GDD §10.4 and §4.4 ("Shipped, CS008 P4"), §10.2 (the text
> exception). `STATUS.md` ledger. `log/CS008.md`.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> ⛔ Edit docs in place. ⛔ Do not push.

---

## P5 — the screens

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS008.md` §0 (U1, U2,
> M1), §1.9 and §6. Then `VECTOR-VORTEX-GDD.md` §0, §1, §2, §4.4, §4.6, §9.5,
> §10.4, §13, §15.4, §15.7. Then `Game.update()`, `runAction()` and the boot
> block in `src/23-main.js`, `src/04-input.js` end to end, and
> `test-cs003-p4.js:443–468`. ultrathink.
>
> ⛔ **Answered: Rotate / Fire / Purge navigate (Esc also backs out), OVERDRIVE
> is shown locked, and game over offers RESTART (same mode and depth, new
> seed) and QUIT TO TITLE.** ⛔ **And H4 (plan §0): `drawHud()` draws in play,
> pause, the dive and game over, and NOT on title, mode or Start Depth.**
>
> **0. ⛔ MEASURE TOUCH FIRST** (plan §6, risk 2). Before writing the menu, drive
> `touchStart`/`touchEnd` in the upper and lower screen and record whether a
> tap produces `fire`. If a tap outside the rotation zone cannot confirm, the
> fix is a kit-input change: MINOR bump, `.NOTES.md` entry, game-agnostic.
> ⛔ Never a second listener.
>
> **1. Build plan §6.**
> - The menu model, kit-shaped in `15-render-hud.js`: screens as data, input
>   snapshot in, action name out, ⛔ no `state` reach.
> - `src/15-render-hud.NOTES.md` from this commit.
> - Rising-edge `fire`/`purge` against held-last-step; rotate accumulated in
>   `C.MENU_ROTATE_STEP`.
> - Boot to `"title"`. ⛔ `newState().screen` stays `"play"`.
> - Title, mode, Start Depth (P3's list, bonus per row, ⛔ no countdown), play,
>   and game over over the frozen board.
> - `quitToTitle()` with the CS011 ordering note and no submit.
> - The HUD per H4; assert it in your test on every screen.
> - Delete the `restart` action and its `r` binding.
>
> **2. ⛔ Closed file, IN PLACE: `test-cs003-p4.js:443–468`.** It asserts `r`
> restarts from inside a freeze. The replacement claims:
> - RESTART from the game-over menu starts a fresh run (lives, level,
>   Start Depth, a live craft);
> - the menu is inert during the death freeze;
> - the fresh run inherits no freeze.
>
> ⛔ The three soaks' `FORBIDDEN` lists keep `"r"`.
>
> **3. Your test, `scratchpad/test-cs008-p5.js`.** Headless, through the input
> sink only:
> - title → mode → depth → play → death → game over → RESTART; and → QUIT TO
>   TITLE — on keyboard, mouse (`mouseMove` + `setButton`), gamepad (stubbed
>   `getGamepads`) and touch;
> - OVERDRIVE not selectable;
> - Purge backs out of every non-title screen;
> - a keyboard tap moves one row;
> - `restart` absent from the built file;
> - boot screen `"title"`;
> - ⛔ the gameplay stop still holds on every non-play screen: no clock, no
>   spawner, no entity pass.
>
> **4. GDD.** Add **§10.5 Screens and menus** and its **§0 row** — ⛔ §0 has no
> row for this today, a defect by `CLAUDE.md`'s own rule. §4.4's "stop, not a
> screen" paragraph gets "Shipped, CS008 P5".
>
> **5. `PLAYTEST.md`.** Un-park the two Start Depth asks (the six-kind board at
> 23, the dim band at 65). Both are odd and ≤ 81, so both are now reachable
> from the depth screen. ⛔ Correct their instructions to use it.
>
> **6. ⛔ No baseline moves** (boot-to-title was measured neutral).
> `STATUS.md` ledger; ⚠ compress if the file nears 400 lines (plan risk 5).
> `log/CS008.md`.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> ⛔ Edit docs in place. ⛔ Do not push.

---

## P6 — pause and Options

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS008.md` §0 (U3–U6 and
> the `t`/`e` reading), §1.11 and §7. Then `VECTOR-VORTEX-GDD.md` §0, §1, §10.5,
> §15.6, §16.3, §18. Then `src/04-input.js` and its `.NOTES.md`,
> `Game.frame()` in `src/23-main.js`, and `src/21-telemetry.js`. ultrathink.
>
> ⛔ **Answered.**
> - Pause comes from Esc/`p`, gamepad Start, a top-centre touch target, and
>   the page going hidden.
> - The pause menu is RESUME / OPTIONS / QUIT TO TITLE, with instant resume.
> - Options is TELEMETRY on/off, EXPORT, CONTROLS ›, CREDITS ›.
> - Sound/Music is CS009's.
> - Credits are a placeholder in `C`.
>
> **1. kit-input 0.4.0 (MINOR).**
> - Gamepad Start and the touch pause target as sources of a named action.
> - `visibilitychange` → hidden queues it, inside `attach()` — ⛔ the one DOM
>   adapter.
> - `.NOTES.md` entry: game-agnostic confirmation, backport `not yet`.
>
> **2. Pause.**
> - `"pause"` screen over the frozen board.
> - ⛔ **`Game.frame()` must not drain `hitStopLeft` while paused** (plan §7):
>   a test that only drives `update()` cannot see this, so drive `frame()`.
> - Pause only from `"play"`, including during a dive and a death freeze.
>
> **3. Options and Credits.**
> - Reachable from the title and from pause.
> - The telemetry row flips the same session switch as `t`. ⛔ Off at every
>   launch, never persisted.
> - EXPORT calls the same export as `e`.
> - `C.CREDITS_LINES`. ⛔ Grep the built file: no forbidden vocabulary
>   (`CLAUDE.md`).
> - The CONTROLS row opens an empty page stub that P7 fills. ⛔ A stub row
>   that does nothing must say so on screen, not fail silently.
>
> **4. Your test, `scratchpad/test-cs008-p6.js`.**
> - Pause from each source.
> - Nothing simulates while paused.
> - **`hitStopLeft` unchanged across paused frames.**
> - Resume is instant.
> - The fragmentation progress is frozen under pause.
> - The telemetry row equals the `t` key; export equals `e`.
> - The credits contain no forbidden word.
> - `t`/`e` still work (plan §0 reading).
>
> **5. ⛔ No baseline moves.** No recorded input list presses Esc, `p` or a
> gamepad button.
>
> **6. Docs.**
> - GDD §10.5 (pause, Options, Credits); §15.6 (the surface is now the Options
>   row plus the bench keys).
> - `EXTERNAL-FILES.md` unchanged (no new runtime file).
> - `STATUS.md`: ledger line, and the carried task "Paul replaces the credits
>   copy before ship".
> - `log/CS008.md`.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> ⛔ Edit docs in place. ⛔ Do not push.

---

## P7 — the Controls page

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS008.md` §0 (U7, U8 and
> the rebinding and sensitivity readings), §1.11 and §8. Then
> `VECTOR-VORTEX-GDD.md` §0, §1, §9, §10.5, §15.7. Then `src/04-input.js` end to
> end and `src/04-input.NOTES.md`. ultrathink.
>
> ⛔ **Answered: mouse sensitivity, touch sensitivity, left-handed touch, touch
> auto-fire, keyboard bindings, gamepad bindings, RESET TO DEFAULTS; a clash
> SWAPS; Esc and gamepad Start are reserved.**
>
> ⛔ **STOP FIRST, and ask Paul about one number.** The sensitivity range is
> the plan's flagged reading: ×0.5 to ×2.0 of the shipped constant, ×0.1 steps.
> It is a feel number (GDD §1.1 P1). Do not ship it unconfirmed; if Paul is not
> available, build everything else and leave the slider range as the one open
> item in `STATUS.md`.
>
> **1. kit-input 0.5.0 (MINOR).**
> - `configure(partial)` for `mouseSens`, `touchSens`, `touchAutofire` and
>   `inputMirror`, with the same required-type validation.
> - `setBindings(keys)` and `setGamepadButtons(map)`.
> - `captureNext(cb)` — the next key or button goes to `cb` and ⛔ not into the
>   struct.
> - ⛔ Refuse any key that is a named action.
> - Game-agnostic. `.NOTES.md` entry.
>
> **2. The page.**
> - Rows per plan §8.
> - Sliders move by rotate.
> - The KEYBOARD and GAMEPAD pages list left/right/fire/purge/jump, two slots
>   each.
> - Confirm arms a capture. A clash swaps. Esc, `p`, gamepad Start, the debug
>   keys and the digits are refused with a visible reason.
> - RESET TO DEFAULTS restores `INPUT_KEYS_DEFAULT`, the gamepad defaults and
>   the `C` values.
> - Session-only.
> - P4's HUD inset now reads the mirror flag through the input module, not
>   `C.INPUT_MIRROR`.
>
> **3. Your test, `scratchpad/test-cs008-p7.js`.**
> - Each setting changes the struct live: a mouse delta at two sensitivities; a
>   touch drag with auto-fire on and off; mirrored button hits.
> - Rebind fire to another key: the old key no longer fires; a swap leaves both
>   actions bound; a reserved key is refused.
> - Capture does not leak into `state.input`.
> - Reset restores everything.
> - ⛔ The mouse path is still one multiply (GDD §9.1): no curve crept in with
>   `configure`.
>
> **4. ⛔ Closed files.** `test-cs002-p*` assert kit-input's shape and
> required-option failures. An added method is additive. A changed failure
> message is not — keep them.
>
> **5. ⛔ No baseline moves.**
>
> **6. Docs.** GDD §9.5 and §10.5. `STATUS.md` ledger. `log/CS008.md`.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> ⛔ Edit docs in place. ⛔ Do not push.

---

## P8 — the front-door soak, the docs, the close

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, `PLANNED-FEATURES-CS008.md` §9–§12, then
> `log/CS008.md` end to end — ⛔ the close is the one pass that reads every
> phase together. Then `VECTOR-VORTEX-GDD.md` §0, §1, §17, §19. ultrathink.
>
> **1. `scratchpad/test-cs008-p8.js` — the sixth soak** (`STATUS.md`: extend
> with a new file, never widen a closed one). Twenty seeded runs, through the
> front door. Each one: title → mode → Start Depth (vary 1 / 5 / 9 across
> seeds) → play → game over → RESTART once → game over → QUIT TO TITLE. Driven
> only through the input sink. Assert:
> - no exception and no NaN;
> - score never decreases within a run, and score equals the sum of that run's
>   events (GDD §17 item 8, played);
> - `lives <= C.LIVES_MAX` on every tick;
> - the Start Depth bonus paid at most once per run;
> - the rim-arrival property on the played board — every hunting Vaulter that
>   enters the Skimmer's lane at the park depth while a shot is within band is
>   killed before contact;
> - ⛔ non-vacuity for each: a life awarded, a bonus paid, a restart taken;
> - ⛔ zero skips.
>
> **2. The GDD §19 sweep** for "Start Depth selects, expands, and pays" and
> "playable title → mode → depth → play → death → game over → restart". Each
> gets a verdict with the test that proves it.
>
> **3. `PLAYTEST.md`.**
> - ⛔ No R4 ask: R4 was superseded and P1b built it.
> - Add K2's ask (Paul, 2026-09-13): with the rim sweep, a player holding
>   fire has no death path on levels 1–4. MEASURED: 0 deaths in 20 × 60 s
>   (plan §1.16). **Do levels 1–4 still feel tense?** The answer feeds GDD
>   §8.2 tuning, not the rule.
> - Add: parked enemies sit 2–9 px inside the rim — do they read as "at the
>   rim"?
> - Add: the HUD on touch, the menu flow on each device, the fragmentation.
> - Mark the CS007 "name what changed at 5, 9, 13" ask as unblocked by P1.
>
> **4. The close.**
> - Compress `log/CS008.md` and move what is left of `STATUS.md` into it.
> - Reset `STATUS.md` for CS009.
> - `ROADMAP.md`: CS008's row as shipped, the "what CS008 shipped / left"
>   paragraphs, and assumption #1's note on the eight-phase changeset.
> - Bump `C.GAME_VERSION` per the log's convention.
> - Archive both CS008 planning docs to `archive/`.
> - ⛔ Carried to CS009: the over-cap life sound, the Sound/Music Options row.
> - ⛔ Carried to CS011: persistence of Start Depth, settings and bindings; the
>   `'quit'` and `'died'` submits at P5's seat.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js`, zero skips, before
> committing. ⛔ Edit docs in place. ⛔ Do not push.

---

## Assumptions and decisions

| # | Decision | What would change it |
|---|---|---|
| 1 | Eight phases in one changeset (Paul's U3 put the scope here) | P5 or P6 overrunning a session: split at P5/P6 (62-pointer renumber, plan §1.15) |
| 2 | The re-records land in P1 and P1b and nowhere else | A P2–P8 baseline move is a defect, not a re-record |
| 3 | kit-input takes two MINOR bumps (0.4.0 pause, 0.5.0 controls) rather than one | P6 and P7 merged, or a touch fix in P5 taking 0.4.0 first — then renumber the bumps in order |
| 4 | P3 is medium effort | The session record's CS011 seam proving harder than one function |
