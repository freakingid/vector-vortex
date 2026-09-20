# IMPLEMENTATION-PHASES-CS013

One phase per Claude Code session. `/clear` between phases. Commit per phase on
`main`; never push.

Each phase below is the literal prompt to paste. A session reads `CLAUDE.md`
and `STATUS.md` automatically, and nothing else unless the prompt names it.

⛔ **`ultrathink` appears inside the prompt text where it is wanted.** It is a
per-turn lever, so it has to be in the pasted message.

✅ **Every call is answered: Paul took every recommendation in
`PLANNED-FEATURES-CS013.md` §0 (T1–T11, W1–W6, MI1–MI3) and every reading
(R1–R11), 2026-09-17.** A prompt below that says "T3's answer" means T3's
recommendation. No phase's shape changed.

**Baseline:** CS012 closed at `4704d2c`, and CS013 was planned on top of it.
- `node build.js` → 25 modules + 3 inlined, 670,746 bytes.
- `node scratchpad/run-all.js` → **66 files, zero skips** (123.1 s).
- `test-registry.js`: `tracks: 3`, `enemies: 7`, `enemyKinds: 10`;
  `STATE_FIELDS` through CS012.
- `test-cs006-p2.js`'s `P1_DETERMINISM_HASH` is **1229033515**.
- `test-cs004-p1.js`'s `GOLDEN_LANES` is the `9ebd27b` sixteen plus CS008's `2, 5`.
- kit-audio **0.4.0**, kit-input **0.8.0**, kit-menu **0.1.0**,
  kit-leaderboard **0.2.1**.
- coinless-kit is at **`e2efed5`**.
- `STATUS.md` is **403 lines** — at its ceiling (plan K1).

| Phase | Builds | Model | Effort |
|---|---|---|---|
| P1 | Tokens: `state.tokens`, `dropToken()` at every kill site, both tables as data, the life on the board, the look, `collect`; Bounty and Recharge | Opus 5 | **high** |
| P2 | Lance, Spread and Ward; `wardBreak` | Opus 5 | **high** |
| P3 | The Warden: `aloft`, the climb, the hunt, the strike, the jump strike, its row at 11 | Opus 5 | **high** |
| P4 | The Mimic and the `MimicShot`; `reflect`; its row at 16 | Opus 5 | **high** |
| P5 | The eleventh soak, the review, the close | Opus 5 | **high** |

---

## ⛔ Why the seams fall here

Plan §2 has the argument. In short:
- **P1 and P2 split the tokens at GDD §14.1's own seam**: the drop-weight table
  and the entity (P1, with the two instant effects) against the three effects
  with a budget, each of which edits a pinned hot path (P2).
- **One enemy per phase** (P3, P4), as CS005 and CS012 did.
- **P3 after P1**, so the jump strike is written with the drop in it; **P4 after
  P2**, so the Mimic is written knowing what Lance does.
- **The Mimic is the last feature phase**, so ROADMAP's second cut is one phase.
- **P5** needs every system for its paired sessions.

### ⛔ Preconditions

| Before | What | Whose |
|---|---|---|
| P1 | §0's answer column filled in `PLANNED-FEATURES-CS013.md` | ✅ Done 2026-09-17 |
| P5 | `../coinless-kit` present beside this repo (two closed files read its registry and SKIP without it; a close cannot skip) | ✅ Confirmed by Paul 2026-09-17 |

### ⛔ The re-records — none

| Phase | Baseline | Moves? |
|---|---|---|
| P1–P5 | `P1_DETERMINISM_HASH` 1229033515 | ⛔ **No.** Every change is Overdrive-gated (plan §1.2 MEASURED it green under all three stand-ins). A move is a defect |
| P1–P5 | `GOLDEN_LANES` | ⛔ **No** |
| P1 | `STATE_FIELDS` | + `CS013: ["tokens", "powers"]` |
| P3 | `COUNTS.enemies` / `enemyKinds` | 7 → 8 / 10 → 11 |
| P4 | `COUNTS.enemies` / `enemyKinds` | 8 → 9 / 11 → 13 |

### ⛔ Closed-file edits — in place (plan §11)

| Phase | File | What | Basis |
|---|---|---|---|
| P1 | `test-cs012-p2.js:52` | `MODE_FLAGS` + `tokens` | PREDICTED |
| P1 | `test-cs012-p2.js:157–187`; its Trough and Double-Vee wall soaks | the draw counter excludes the token roll; the wall precondition restored | MEASURED (stand-in) |
| P1 | `test-cs012-p4.js` `COMBO_OUT` (`:655`), item 8 (`:436`), the window fixture, `:1083` | `dropToken` in both strings; Bounty priced; the ×1.5 precondition restored | PREDICTED / MEASURED |
| P1 | `test-cs012-p6.js` item 8, and `:761` if it moves | Bounty priced; the cleared-past-13 precondition restored | MEASURED (stand-in) |
| P1, P2, P4 | `test-cs009-p4.js:34–37` | `EVENTS` + `collect`, `wardBreak`, `reflect`; `VOICES` + `warden` (P3), `mimic`, `mimicShot` (P4) | PREDICTED |
| P3, P4 | `test-cs012-p2.js:92`, `:96–102`, `:124`, `:595` | the Overdrive schedule literals at L11+ and L16+; the `ROW` fixture | MEASURED (stand-in) |
| P3 | `test-cs012-p4.js:585` | a clear restored inside the mutation window | MEASURED (stand-in) |
| P3, P4 | `test-cs012-p4.js:46`, `test-cs012-p6.js:63` | `gddPoints` prices the Warden (500) and the Mimic (400) | PREDICTED |
| P3, P4 | `test-cs007-p2.js:476` | `CLIMBS` + `WARDEN_CLIMB`, `MIMIC_CLIMB` | PREDICTED |
| P4 | `test-cs004-p5.js:388`, `test-cs005-p5.js:400` | `PROJECTILE_CLASSES` + `X.MimicShot` | PREDICTED |

⛔ **An edit this table does not predict is a finding.** Stop, record it in
`STATUS.md` with its cause, and make the edit only if it restores the claim the
closed test was always making. ⛔ **A fixture is repaired to restore its
precondition, never relaxed to let a broken one pass.**

---

## P1 — tokens: the table, the entity, the two instant ones

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS013.md` §0 (T1–T6,
> T10, T11 and their ANSWERS; R1–R5, R8, R11; F3), §1.2, §1.3, §1.4, §2, §3, §8,
> §9's last paragraph, §10, §11 and §12. Then `VECTOR-VORTEX-GDD.md` §0, §1,
> §4.3, §5, §6.5, §7, §10.2, §10.3, §10.4, §11.8, §13, §14.1, §16.3 and §17
> items 8 and 12. Then `src/10-powerups.js`, `src/02-state.js`,
> `src/09-collision.js` whole, `startDive()` in `src/11-dive.js`,
> `src/12-scoring.js`, `src/14-render-entities.js` (`entityPoints`, `drawShot`,
> `shotAlpha`, the cargo glyphs), `src/15-render-hud.js` (the rings,
> `PURGE_GLYPH_POLY`), `src/00-config.js`'s Overdrive, SFX and scoring groups
> and `modeHas()`, `RECORD_MODES` in `src/22-meta.js`, and `enterWell()`,
> `update()` and `draw()` in `src/23-main.js`. Then `scratchpad/test-cs012-p2.js`
> (`:40–200`, `:430–480`), `test-cs012-p4.js` (`:1–100`, `:385–700`,
> `:1060–1090`), `test-cs012-p6.js` (its item-8 section and `:750–770`),
> `test-cs009-p4.js`, `test-cs009-p5.js` (`:400–430`) and `tools/sfx-lab.html`.
> Create `log/CS013.md`. ultrathink.
>
> ⛔ **§0: T1–T6, T10, T11.** Build exactly those answers.
>
> **0. `STATUS.md` is at 403 lines** (K1). Compress it before you add to it;
> reasoning goes to `log/CS013.md`.
>
> **1. The mode flag (R3).** Each row of `C.MODE_FLAGS` gains `tokens` (Classic
> false, Overdrive true). ⛔ A field in the rows, never a new top-level key:
> `22-meta.js:505` derives `progress`'s modes from `Object.keys(C.MODE_FLAGS)`.
>
> **2. The two tables, as data (plan §8).** `C.TOKEN_WEIGHTS` per T3's answer,
> and the budgeted-effect list's constants per T6–T9's answers (P2 reads three
> of them). ⛔ **Neither table names the other's numbers.** `MAX_TOKENS`,
> `TOKEN_LIFE` and `TOKEN_HOVER_DEPTH` get their first readers. ⛔ Every value in
> `C`, grouped under the Overdrive heading with a comment that says which table
> each belongs to.
>
> **3. State (R2).** `tokens: []` and `powers: { lance: false, spread: false,
> ward: false }` in `newState()`. `scratchpad/test-registry.js`:
> `STATE_FIELDS.CS013: ["tokens", "powers"]`.
>
> **4. `src/10-powerups.js` (T1–T6)** replaces the placeholder. Its header says
> what lives here, why a token is not an enemy (T1's measured reasons), and that
> the two tables are two. Top-level functions, so a test can stub or spy them:
> - `dropToken(state, e)`: a TOTAL no-op outside `modeHas("tokens")` — no draw.
>   In Overdrive, T2's answer: the draw, the curve, `MAX_TOKENS`, and the kind
>   from T3's table. Born per T4.
> - `updateTokens(state, well, dt)`: the rise, `age` counting UP (GDD §16.3), the
>   collection per T4, the pickup per T6 (Bounty through `addScore()` —
>   ⛔ never multiplied, builds nothing; Recharge; a lasting token sets its
>   `state.powers` flag, which P2 reads, R11), expiry at `age >= TOKEN_LIFE`, and
>   an end-of-pass filter.
> - `resetTokens(state)`.
> - ⛔ **Nothing in the draw path calls `state.rng()`.**
>
> **5. The kill sites (T2).** `dropToken(state, e)` on each of the four kill
> lines in `09-collision.js`, on the false → true `dead` edge, beside
> `comboKill()`. ⛔ `addScore()` stays the one writer and the multiplier stays at
> the kill site. ⛔ The Purge still never calls `onShot()`. ⛔ The Dive's
> termination kill is not a kill site and rolls nothing.
>
> **6. The well owns them (T5).** `enterWell()` and `startDive()` call
> `resetTokens()`. `updateTokens()` runs once per play step, after the collision
> pass and both filters, before the spawner. The draw: after the well, before the
> enemies (plan §3).
>
> **7. The look (T10).** `drawToken()` in `14-render-entities.js`: T4's ring
> (a polyline, depleting over `TOKEN_LIFE`) and five glyphs by GDD §6.2's glyph
> rule, in `C.TOKEN_COLOR`, faded below `READABILITY_DEPTH` with `shotAlpha()`.
> ⛔ `entityPoints` + `drawPoly` + `glowStroke`; no `ctx.fill`
> (`test-cs002-p3.js`); preallocated scratch, no per-frame allocation.
> ⛔ Under T10's recommendation **no HUD rectangle moves**.
>
> **8. The sounds (T11).** 2–3 candidates per new event in `tools/sfx-lab.html`,
> candidate A ported into `C.SFX` as one line starting `    collect:` (and any
> other event T11's answer names). ⛔ BLOCK SFX identical to `00-config.js`'s SFX
> group. ⛔ One seat per event, its name a string literal, and nothing in its
> arguments that writes or draws (`test-cs009-p5.js:414`).
>
> **9. `scratchpad/test-cs013-p1.js`** (≤ 15 header lines; the harness; seed
> first):
> - ⛔ **Classic is untouched:** a Classic session (5,000 steps, Start Depth 13,
>   held fire, scheduled Purges) hashes identically, step by step, to the same
>   session built with `{ stub: ["dropToken", "updateTokens"] }`, and
>   `state.tokens` stays empty and every `powers` flag false.
> - ⛔ **One draw per Overdrive kill** (T2's answer): on played Overdrive boards,
>   `dropToken()` is called once per kill (a spy against `tally.kills`' delta),
>   and each Overdrive call spends exactly one draw (the stream wrapped around the
>   call) — drop or no drop, and at `MAX_TOKENS` too.
> - **The drop, staged,** through the real `dropToken()` with the stream replaced
>   by chosen values: T2's curve at staged threat counts, T3's kinds at every
>   band edge, and a board at `MAX_TOKENS` spending its draw and adding nothing.
> - **The life, staged** (T4): the birth lane and depth, the rise, the hover,
>   collection only while hovering and only in lane, and expiry on the step `age`
>   reaches `TOKEN_LIFE`. ⛔ Assert the property, never a step count (STATUS's
>   float trap).
> - **T5:** a Dive and a new well empty `tokens` and reset `powers`; a death keeps
>   both; a duplicate changes nothing.
> - **T6:** a Bounty pays `C.BOUNTY_POINTS` once, unmultiplied at ×N, and builds
>   nothing; a Recharge restores `purgeUses` to 0 and the clear then pays
>   `PURGE_SAVED_BONUS`.
> - **Readability:** a token below `READABILITY_DEPTH` strokes at `shotAlpha()`'s
>   alpha (spy `glowStroke`).
> - `MAX_TOKENS` is never exceeded over 20,000 played Overdrive steps, and all
>   five kinds drop there.
> - **Mutation-checked:** the mode gate removed from `dropToken()` reddens the
>   Classic claim; the draw made conditional on a drop reddens the count.
>   ⛔ `mutantRed()` asserts its string is in the build exactly once before it
>   asserts red, and guards its reads (STATUS).
>
> **10. Closed edits (the P1 rows above)**, each in place with its cause at the
> assertion. ⛔ **Any other red is a finding: stop and record it.**
>
> **11. Docs:**
> - GDD §14.1 (tokens as shipped, T1–T6, T10, T11, and the two tables side by
>   side), §6.5 (a token is not an enemy; the second array and its one entry
>   point), §7 (the Bounty; what is not multiplied), §10.3 (tokens fade), §10.4
>   (no token HUD item, if so), §11.8 (the `collect` seat), §13 (the Powerups
>   row), §16.3 (the token's ring), §17 item 8.
> - `CLAUDE.md`: a Tokens block under Build rules — the second array, `dropToken()`
>   the one way in, one draw per Overdrive kill, the two tables kept apart, the
>   well owns them — and the code map's `10-powerups.js` line.
> - `SKIPPED-PLAYTESTS.md`: the drop rate, the rise and hover, collection's pull,
>   the glyphs and the gold.
> - `DECISIONS.md`: one line pointing at plan §0 and its answers.
> - `log/CS013.md` and `STATUS.md`.
>
> ⛔ `P1_DETERMINISM_HASH` and `GOLDEN_LANES` do not move. `node
> scratchpad/run-all.js` green, zero skips. Commit "CS013 P1: tokens — …". Do not
> push.

---

## P2 — Lance, Spread, Ward

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS013.md` §0 (T5, T7,
> T8, T9 and their ANSWERS; R11; F4; K6, K14), §1.6, §4, §8, §10, §11 and §12.
> Then `VECTOR-VORTEX-GDD.md` §0, §1, §4.2, §4.4, §4.5, §5, §6.1 (the Thorn, the
> Carrier's split), §6.5, §7, §14.1, §16.3 and §17 items 4 and 8. Then
> `src/06-shots.js`, `src/09-collision.js`, the Thorn in `src/07-enemies.js`,
> `src/05-skimmer.js` (`skimmerPoints`, `Skimmer.draw`), `src/10-powerups.js`,
> `drawShot()` in `src/14-render-entities.js`, and `draw()` in `src/23-main.js`.
> Then `scratchpad/test-cs012-p4.js` (`:419`, `:584–630`), `test-cs012-p5.js`
> (`:140–200`), `test-cs012-p2.js` (`:515–540`), `test-cs008-p2.js` (its chip
> decoder), the shot-cap assertions in `test-cs002-p3.js`, and `test-cs008-p1b.js`
> (the sweep). ultrathink.
>
> ⛔ **§0: T5, T7, T8, T9.** Build exactly those answers.
>
> **1. Spread (T8).** In `updateShots()`: the lanes per T8's answer through
> `laneNormalize()`, deduplicated at an open well's wall, under the cap in force.
> ⛔ The fire gate's text `state.input.fire && jumpCanFire(state) &&` stays in the
> build exactly once (`test-cs012-p5.js:196` mutates it). `tally.shotsFired`
> counts shots.
>
> **2. Lance (T7).** A `Shot` carries `pierce`, set at fire time from
> `state.powers.lance`. `collideShots()`'s one line per T7's answer; ⛔ the
> `break` stays unconditional. `Thorn.onShot()` chips per T7's answer and pays
> `PTS_THORN` per chip of length. ⛔ **`    addScore(C.PTS_THORN);` stays in the
> build exactly once** (`test-cs012-p4.js:607`). ⛔ The sweep line
> `    if (state.input.fire && e.depth >= 1 - C.RIM_CONTACT_DEPTH) {` is untouched
> (`test-cs012-p2.js:525`). `Thorn.onShot()` is now the first `onShot` that reads
> its argument: guard `null`, and assert that no Thorn ever reaches the rim sweep.
>
> **3. Ward (T9).** In `killSkimmer()`, BELOW the invulnerability guard, per T9's
> answer. ⛔ The `COMBO_OUT` string `"\n  comboDeath(state);\n"` stays exactly once.
> ⛔ Not a death: `lives`, the combo, `diedThisWell` and `tally.deaths` untouched.
> The `wardBreak` sound from sfx-lab candidate A, one literal seat.
>
> **4. The look (T10's language).** The Lance streak and the Ward's shell in
> `C.TOKEN_COLOR`, draw-time only. ⛔ Strokes, never fills; no allocation.
>
> **5. `scratchpad/test-cs013-p2.js`:**
> - **Spread:** on the built fire path with fire held, shots per lane per second
>   match plan §1.6's row for T8's answer (within one step's quantization); the
>   cap in force is never exceeded; at each open well's two walls a volley puts
>   one shot per lane.
> - **Lance:** a pierced kill flies on and can kill behind it on a later step; a
>   chip, a riding Drifter's refusal and a bolt's refusal consume or decline
>   exactly as without Lance; a Carrier split under Lance; a Thorn chip removes
>   `LANCE_CHIP_MULT × THORN_CHIP` and pays that many × 5.
> - ⛔ **GDD §17 item 8 with Lance live**, on played Overdrive boards, in
>   `test-cs012-p4.js`'s per-call form (a new file; the closed decoders are
>   predicted green unedited — say so if they are not).
> - **Ward:** it absorbs each death condition, staged — rim contact, a Drifter, a
>   Surger's discharge, a bolt — starts the invulnerability window, keeps lives,
>   the combo and the no-death bonus, holds one at a time, and never reaches a
>   Dive (T5).
> - ⛔ **Classic never sets a flag:** a Classic session's hash equals one with
>   `state.powers` frozen.
> - **Mutation-checked:** the Ward check moved above the guard; pierce made
>   "never consumed"; the Spread cap removed.
>
> **6. Closed edits:** `test-cs009-p4.js`'s `EVENTS` + `wardBreak`. ⛔ Plan §11
> predicts no other; any other red is a finding.
>
> **7. Docs:** GDD §14.1 (Lance, Spread, Ward as shipped), §4.2 (firing under
> Spread and Lance), §4.4 and §4.5 (the Ward), §7 (a Lance chip), §17 item 4 (the
> cap in force); `CLAUDE.md` only where a new ⛔ is earned (the pierce line, the
> Ward's seat); `SKIPPED-PLAYTESTS.md` (Spread's feel, Lance, the shell's read);
> `log/CS013.md`; `STATUS.md`.
>
> ⛔ The hash and the golden do not move. Suite green, zero skips. Commit "CS013
> P2: Lance, Spread and Ward — …". Do not push.

---

## P3 — the Warden

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS013.md` §0 (W1–W6
> and their ANSWERS; R6, R7, R9, R10; F1, F2; K5, K8, K9, K10), §1.2, §1.4, §1.5,
> §1.8, §1.9, §5, §9, §10, §11 and §12. Then `VECTOR-VORTEX-GDD.md` §0, §1, §3.5,
> §4.3, §4.4, §4.5, §6.1 (the Surger), §6.3, §6.4, §6.5, §7, §8, §8.1, §10.3,
> §10.4, §11.8, §14.2, §14.6 and §17 items 3, 5 and 8. Then `src/07-enemies.js`
> (the base; the Vaulter's hop and `huntDir()`; the Surger's `setPhase()`),
> `src/07-enemies-overdrive.js`, `src/08-spawner.js`, `src/09-collision.js`,
> `src/05-skimmer.js` (`jumpAirborne()`, the lift in `skimmerPoints()`),
> `src/14-render-entities.js` (`drawSurgeLane`, `drawReaver`),
> `reconcileSurgeTones()` in `src/19-sfx.js`, `src/00-config.js`'s enemy,
> Overdrive and SFX groups, and `respawnSkimmer()` and `dangerInputs()` in
> `src/23-main.js`. Then `scratchpad/test-cs012-p2.js` whole (the form),
> `test-cs005-p3.js` (the discharge tests), `test-cs012-p5.js` (`:60–160`),
> `test-cs007-p2.js` (`:60–80`, `:470–520`), `test-cs012-p4.js` (`:46`, `:580–610`,
> `:655–700`), `test-cs012-p6.js` (`:55–70`), and `tools/sfx-lab.html`'s KILL
> PITCH table. ultrathink.
>
> ⛔ **§0: W1–W6.** Build exactly those answers. Under W1's
> recommendation, **aloft is a PHASE, not a depth** — the Jump's rule.
>
> **1. The ninth field (W1).** The base `Enemy` gains `aloft = false`, with a
> header paragraph that says what it means, its two readers, and what it is not
> (not a depth; the respawn push still applies). ⛔ `Enemy` stays fields only.
>
> **2. The Warden** in `07-enemies-overdrive.js`, against plan §9: the climb
> (W2), aloft at depth 1, the hunt (W3) through `laneHop()` with its `dir` written
> back, the strike through ONE writer of `phase` and `killDepth`, `onShot()`
> declining and never dying, `points()`, and `draw()`.
> - ⛔ Its climb is `C.WARDEN_CLIMB * climbMult()` (R6).
> - ⛔ `WARDEN_DISCHARGE < RESPAWN_INVULN`, stated beside the constants.
> - ⛔ No cycle constant is heat-scaled (R7), and no hop duration is (H2).
>
> **3. The way in.** `ENEMY_KINDS.warden`; `{ level: 11, kind: "warden" }` in
> `C.SPAWN_SCHEDULE_OVERDRIVE`; `C`'s Warden group, colour and lift per W6;
> `C.SFX_KILL_PITCH.warden` from sfx-lab (candidate A). ⛔ `C.SPAWN_SCHEDULE` is
> not touched.
>
> **4. The collision (W1, W4).** `collideShots()` skips an `aloft` entity.
> `jumpStrike(state, well)` runs third in `updateCollisions()`: while
> `jumpAirborne(state)`, every live aloft entity within `HIT_LANE_TOL` of the
> craft dies at a **fifth kill line** in O4's form, with T2's `dropToken()`.
> - ⛔ That line's text matches none of `test-cs012-p4.js`'s six `COMBO_OUT`
>   strings.
> - ⛔ `  if (jumpAirborne(state)) return;\n` stays exactly once
>   (`test-cs012-p5.js:151`).
> - ⛔ The build keeps exactly ONE two-depth comparison (the dive strike).
>
> **5. The sounds (W6).** Per W6's answer. Under the recommendation: the fuse's
> phase is named `"telegraph"` and has a `chargeTip()`, so
> `reconcileSurgeTones()` holds the Surger's voice for it; the strike calls
> `sfx("surgeDischarge")` from its `setPhase()`. ⛔ `19-sfx.js` is not edited and
> names no `state`.
>
> **6. The draw (W6).** `drawWarden()`: the climbing silhouette; aloft, lifted
> `C.WARDEN_LIFT` rim radii in screen space the way `skimmerPoints()` lifts the
> craft; the fuse's beam from the Warden to the rim. ⛔ No fill; no allocation.
>
> **7. `scratchpad/test-registry.js`:** `enemies: 8`, `enemyKinds: 11`.
> `DIFFICULTY-NOTES.md`: Overdrive's shares with the Warden in the set.
>
> **8. `scratchpad/test-cs013-p3.js`:**
> - **The contract** (plan §9), read off `ENEMY_KINDS.warden`; `aloft` false on
>   every other kind.
> - `eligibleKinds(L, "overdrive")` equals a WRITTEN-OUT table at every level
>   1..40; Classic's is unchanged; the no-draw rule at Overdrive L1–2 still holds.
> - **W2:** the climb at `WARDEN_CLIMB × climbMult()` at L11, L16 and L99; a shot
>   fired into a climbing Warden is declined and flies on past it; it passes the
>   rim band without killing; it goes aloft at depth 1.
> - **W3:** the hunt, and its fold at an open well's wall; ⛔ **GDD §17 item 3**
>   on the six open wells, 5,000 steps each with Wardens aloft: lanes in
>   `[0, lanes−1]`, and no step moves one more than `2 × DT / WARDEN_HOP_TIME`;
>   the fuse is never lethal; the discharge kills a grounded craft in its lane and
>   is restored; ⛔ `WARDEN_DISCHARGE < RESPAWN_INVULN` from the constants; the
>   respawn push brings it to 0.55 and it climbs back; no contact death inside
>   `RESPAWN_INVULN` at L11, L23 and L99.
> - **W4:** an airborne craft in its lane kills it (its price times the
>   multiplier, a combo build, T2's draw, the kill sound); one lane away does not;
>   a grounded craft never does; 600 steps of fire at an aloft Warden do not; the
>   Purge's two uses leave it. **Mutation-checked:** the `aloft` skip removed from
>   `collideShots()`, the `jumpStrike()` call removed, and the strike made to need
>   a grounded craft.
> - **W5:** a well with a live Warden does not clear, and clears after the jump
>   kill (per W5's answer).
> - **W6:** the lift is draw-only (`C.WARDEN_LIFT` mutated to 0: the same hash);
>   under the recommendation, the recording fake holds exactly one Surger voice
>   per telegraphing Warden and none after.
> - ⛔ **Airborne immunity holds against its discharge** (`test-cs012-p5.js`'s
>   form, in this file).
> - ⛔ **Classic never sees a Warden:** a Classic run at Start Depth 13 hashes
>   identically, step by step for 5,000 steps, to a build with the row mutated out.
>
> **9. Closed edits (the P3 rows above).** A non-jumping closed play at L11+ that
> loses its precondition (a clear, a kill class) is repaired by a driver that
> jumps at aloft Wardens — never by lowering the play's level or relaxing the
> assertion. ⛔ **Any other red is a finding.**
>
> **10. Docs:**
> - GDD §6.4 (the Warden's two tables), §6.5 (the ninth field; the fourth kill
>   site; the seventh point answered), §4.5 (its strike is item 3's shape), §7
>   ("four kill sites"), §8.1 (Overdrive's set table), §10.4 (F1, accepted if
>   so), §11.8 (its seats), §14.6 (as shipped), §17 item 5 ("all purgeable").
> - `CLAUDE.md`: Math and lifecycle (aloft is a phase; its readers), Scoring (five
>   kill lines, four sites), "New enemies wire into…" (decide `aloft`
>   explicitly). Keep it under 50 KB.
> - `DIFFICULTY-NOTES.md`; `SKIPPED-PLAYTESTS.md` (peripheral visibility, the
>   shared tone, the jump kill's feel); `log/CS013.md`; `STATUS.md`.
>
> ⛔ The hash and the golden do not move. Suite green, zero skips. Commit "CS013
> P3: the Warden — …". Do not push.

---

## P4 — the Mimic

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS013.md` §0 (MI1–MI3
> and their ANSWERS; T7; R6, R8, R10), §1.7, §6, §9, §10, §11 and §12. Then
> `VECTOR-VORTEX-GDD.md` §0, §1, §4.4, §4.5, §6.1 (the bolt; the Drifter's
> read), §6.3, §6.5, §7, §8.1, §12 (the SOLID / OPEN prompt), §14.6, §17 items 3
> and 8, §19 and §21. Then `src/07-enemies.js` (`WeaverBolt`; the Drifter's draw
> channels), `src/07-enemies-overdrive.js`, `src/08-spawner.js`,
> `src/09-collision.js` (`collideShots()`; the Carrier split's path),
> `src/14-render-entities.js` (`drawShot`, `drawDrifter`, `drawWeaverBolt`), and
> `src/00-config.js`'s enemy, Overdrive and SFX groups. Then
> `scratchpad/test-cs005-p2.js` (the headless gate's form), `test-cs004-p3.js`
> (the bolt), `test-cs004-p5.js` (`:375–410`), `test-cs005-p5.js` (`:395–412`),
> `test-cs007-p2.js` (`:470–520`) and `tools/sfx-lab.html`. ultrathink.
>
> ⛔ **§0: MI1–MI3.** Build exactly those answers. ⚠ The Mimic is
> on probation: build it to be cut in one row (MI3).
>
> **1. The bolt's speed becomes an overridable reader** on `WeaverBolt` (the
> Reaver's precedent). ⛔ A Classic bolt is bit-identical (assert it with a hash),
> and `C.WEAVER_BOLT_SPEED` is still never scaled by `climbMult()`.
>
> **2. `class MimicShot extends WeaverBolt`** (MI2): its speed
> (`C.MIMIC_SHOT_RATIO / C.SHOT_TIME`), its draw (the player's streak at MI2's
> size, in `C.MIMIC_COLOR`), its voice. The bolt's contract otherwise.
>
> **3. `class Mimic extends Enemy`** (MI1): the climb (`C.MIMIC_CLIMB *
> climbMult()`) to `MIMIC_APEX`, held; one lane, never hopping. `onShot()` per
> MI1's answer: closed — consumed, one `spawnEnemy("mimicShot", …)`, `reflect`
> sounding only when the spawn was not refused, open for `MIMIC_OPEN_TIME`;
> open — it dies, consumed. ⛔ At most one reflection per opening. Two polys,
> closed and open, differing on stroke width and alpha (the Drifter's channels).
> ⛔ `MIMIC_APEX ≤ 0.95 − SURGE_TELEGRAPH × the reflected speed`, stated beside
> the constants.
>
> **4. The way in.** `ENEMY_KINDS.mimic` and `.mimicShot`; `{ level: 16, kind:
> "mimic" }`; `C`'s Mimic group; two kill pitches and `reflect` from sfx-lab
> (candidate A).
>
> **5. `scratchpad/test-registry.js`:** `enemies: 9`, `enemyKinds: 13`.
>
> **6. `scratchpad/test-cs013-p4.js`:**
> - **Both contracts** (plan §9), read off `ENEMY_KINDS`.
> - The Overdrive set table 1..40 with both rows, written out; Classic's unchanged.
> - **MI1, staged:** closed → one reflection and open; open → dead; the window
>   closing; a Purge kills it closed or open; a Lance shot is reflected and
>   consumed (T7); a Spread side shot reflects into the Mimic's own lane.
>   **Played:** under held fire a Mimic costs exactly one reflection.
> - **MI2:** the speed; ⛔ the apex bound from the constants; on played boards
>   every reflection's flight to the band is at least `SURGE_TELEGRAPH`; a shot
>   declines at a `MimicShot` and flies on; the Purge kills one for 0; it
>   self-terminates the step after depth 1; it is not a Dive survivor; no contact
>   death inside `RESPAWN_INVULN` after a respawn among them.
> - **The two-state read,** off the real `glowStroke` calls: the width ratio and
>   the alpha, `test-cs005-p2.js`'s gate form.
> - **GDD §17 item 3:** a Mimic's and a `MimicShot`'s lane equal their spawn lane
>   (`Object.is`) on every step.
> - ⛔ **MI3, the cut:** with the row mutated out, a played Overdrive session at
>   L16+ has zero Mimics; and Classic never sees one (a hash against that build).
>
> **7. Closed edits (the P4 rows above),** including `PROJECTILE_CLASSES` in
> `test-cs004-p5.js:388` and `test-cs005-p5.js:400` — the roster there is
> "classes minus projectiles", and the claim does not change. ⛔ **Any other red
> is a finding.**
>
> **8. Docs:** GDD §6.4 (the Mimic and the `MimicShot`), §6.5 (a projectile
> subclass; the new voices), §8.1, §11.8 (`reflect`), §14.6 (as shipped, on
> probation), §19 ("flagged for playtest"); `CLAUDE.md` where a ⛔ is earned;
> `DIFFICULTY-NOTES.md`; `SKIPPED-PLAYTESTS.md` (⛔ the probation ask: does a
> reflected shot read as cheap?); `log/CS013.md`; `STATUS.md`.
>
> ⛔ The hash and the golden do not move. Suite green, zero skips. Commit "CS013
> P4: the Mimic — …". Do not push.

---

## P5 — the eleventh soak, the review, the close

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS013.md` whole. Then
> `VECTOR-VORTEX-GDD.md` §0, §1, §13, §14, §17 and §19. Then
> `scratchpad/test-cs012-p6.js` and `test-cs011-p6.js` (the tenth and ninth soaks'
> forms), and `log/CS013.md` whole (⛔ this phase's review reads every entry).
> Then `ROADMAP.md`. ultrathink.
>
> ⛔ **Every §0 answer is built.** Do not re-open one.
>
> **1. `scratchpad/test-cs013-p5.js` — the eleventh soak** (plan §7; ⛔ a new
> file, never a closed one widened), in `test-cs012-p6.js`'s form, over one
> front-door driver that starts at the title:
> - **Classic untouched:** one Classic session (Start Depths 1 / 13 / 23, RESTART,
>   a pause, QUIT) played as is and with `{ stub: ["dropToken", "updateTokens",
>   "jumpStrike"] }` and both new rows mutated out. ⛔ **Same hash on every frame.**
> - **The sounds cannot steer Overdrive:** one Overdrive session — MODE →
>   OVERDRIVE → Start Depths 1 / 11 / 17 off a staged record — with a driver that
>   holds fire, jumps at aloft Wardens, sidesteps a `MimicShot`, Purges, dives,
>   RESTARTs and pauses, played on the recording fake and with no audio API.
>   ⛔ **Same hash on every frame.**
> - **Overdrive's invariants, on every step of that session:** tokens ≤
>   `MAX_TOKENS`, empty at every Dive, never in Classic; ⛔ exactly one draw per
>   Overdrive kill (T2); every live token's `age` below `TOKEN_LIFE`; GDD §17
>   item 8 at the multiplier with every new price; an aloft Warden dies only to an
>   airborne craft in its lane; no contact death while airborne; at most one
>   reflection per opening; no `MimicShot` shot dead; shots within the cap in
>   force; Warden lanes in range on open wells; no NaN; bounded arrays.
> - ⛔ **Non-vacuity for every claim:** all five tokens collected, a Ward broken,
>   a Lance chip, a Spread volley, a Warden jump-killed, a Mimic killed, a
>   reflection, a dive completed.
>
> **2. The review** (the close's point). Read every phase's `log/CS013.md` entry
> together, find where two phases said different things, reconcile them in the
> docs, and record each in the log's review notes.
>
> **3. The ledgers.** Measure plan §10's baseline ledger row by row and plan §12's
> acceptance criteria item by item, into `log/CS013.md`. ⛔ **Zero skips.**
> ⛔ `P1_DETERMINISM_HASH` and `GOLDEN_LANES` unmoved.
>
> **4. Close:**
> - **`log/CS013.md`:** the phase ledger moved from `STATUS.md`, the version
>   history, and "Carried forward" (F1, F2, F4 and the Mimic's verdict among it).
> - **`STATUS.md`:** compressed and reset for CS014, under ~400 lines, with the
>   hazards CS014 must act on — `startDive()` now resets tokens and powers, the
>   Warden is never a Dive survivor, `C.DIVE_TIME_OD` and `DIVE_RINGS_MAX` still
>   unread.
> - **`ROADMAP.md`:** CS013's row marked shipped, with its narrative paragraphs
>   ("held as…", "shipped against the row", "deliberately left").
> - **GDD §19:** Overdrive's verdicts at the CS013 close — five tokens, the
>   Warden, the Mimic flagged.
> - **`SKIPPED-PLAYTESTS.md`:** the eleventh soak's asks.
> - **Move** `PLANNED-FEATURES-CS013.md` and `IMPLEMENTATION-PHASES-CS013.md` to
>   `archive/`.
> - **`C.GAME_VERSION`:** 0.0.10, and CREDITS reads it.
>
> Suite green, zero skips. Commit "CS013 P5: the eleventh soak, the review, and
> the close". Do not push.
