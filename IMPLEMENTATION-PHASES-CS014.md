# IMPLEMENTATION-PHASES-CS014

One phase per Claude Code session. `/clear` between phases. Commit per phase on
`main`; never push.

Each phase below is the literal prompt to paste. A session reads `CLAUDE.md`
and `STATUS.md` automatically, and nothing else unless the prompt names it.

⛔ **`ultrathink` appears inside the prompt text where it is wanted.** It is a
per-turn lever, so it has to be in the pasted message.

✅ **Every call is answered: Paul took every recommendation in
`PLANNED-FEATURES-CS014.md` §0 (RF1–RF9), 2026-09-20.** A prompt below that says
"RF3's answer" means RF3's recommendation. No phase's shape changed.
⛔ **The RF-B and RF-C branches in the prompts below are dead** — they are the
record of what was priced, not a choice left open. Build the A branch.

**Baseline:** CS013 closed at `144825e`, and CS014 is planned on top of it.
- `node build.js` → 25 modules + 3 inlined kit, **754,849 bytes** (737.2 KB).
- `node scratchpad/run-all.js` → **71 files, zero skips, exit 0** (161.6 s).
- `test-registry.js`: `tracks: 3`, `enemies: 9`, `enemyKinds: 13`;
  `STATE_FIELDS` through CS013.
- `test-cs006-p2.js`'s `P1_DETERMINISM_HASH` is **1229033515**.
- `test-cs004-p1.js`'s `GOLDEN_LANES` is the `9ebd27b` sixteen plus CS008's `2, 5`.
- `C.MODE_FLAGS` is `{ jump, combo, tokens }` per row; `C.SFX` has **25 events**;
  `C.SFX_KILL_PITCH` **11 voices**; `TELEMETRY_FIELDS` **29**; `state` **28**
  top-level keys.
- kit-audio **0.4.0**, kit-input **0.8.0**, kit-menu **0.1.0**,
  kit-leaderboard **0.2.1**. coinless-kit is at **`e2efed5`**, present beside
  the repo.
- `STATUS.md` is **401 lines** (plan K1) and `CLAUDE.md` **45,797 bytes**,
  91.6 % of its 50 KB ceiling (plan K2).

| Phase | Builds | Model | Effort |
|---|---|---|---|
| P1 | The flight: the gate, `C.DIVE_TIME_OD`'s and `C.DIVE_RINGS_MAX`'s first readers, the ring set, the take pass, and the score path | Opus 5 | **high** |
| P2 | The Dive's visual (RF7) and the audio seats (RF8) | Opus 5 | **high** |
| P3 | The twelfth soak, the review, the close | Opus 5 | **high** |

---

## ⛔ Why the seams fall here

Plan §2 has the argument. In short:
- **P1 is one seam wide: simulation.** Everything that moves a hash or reddens a
  closed assertion is in it — the mode flag, the two unread constants, the ring
  lattice and the scoring path. ⛔ The scoring claim is asserted **per step** in
  four closed files, so splitting it would leave half the claim repaired.
- **P2 is presentation and nothing else**, and owes the same proof
  `C.JUMP_LIFT` at 0 owes: the state hash does not move.
- ⛔ **The cut stays one line across both** — under RF6-A, `rings: false` in the
  Overdrive row takes P1 and P2 out together.
- **Four was considered** and rejected: the ring set apart from the score path
  splits one claim, and the soak apart from the close is what CS012 P6 and
  CS013 P5 each held in one session.

### ⛔ Preconditions

| Before | What | Whose |
|---|---|---|
| **P1** | §0's answer column filled for RF1–RF9 in `PLANNED-FEATURES-CS014.md` | ✅ Done 2026-09-20 |
| P2 | RF7 and RF8 answered (they are §0 rows; the same gate) | ✅ Done 2026-09-20 |
| P2 | `tools/sfx-lab.html` carries RF8's briefs and candidates before a recipe is ported | P2's own first act |
| P3 | `../coinless-kit` present beside this repo (two closed files read its registry and SKIP without it; ⛔ a close cannot skip) | ✅ MEASURED present at `e2efed5`, 2026-09-20 |

### ⛔ The re-records — none

| Phase | Baseline | Moves? |
|---|---|---|
| P1–P3 | `P1_DETERMINISM_HASH` 1229033515 | ⛔ **No.** Every change is Overdrive-gated; plan §1.2 MEASURED it green under both stand-ins. A move is a defect |
| P1–P3 | `GOLDEN_LANES` | ⛔ **No** |
| P1–P3 | the eleven closed soaks' paired hashes | ⛔ **No** |
| P1 | `STATE_FIELDS` | ⛔ **No** — RF1-A, MEASURED green under the stand-in |
| P1 | `COUNTS.enemies` / `enemyKinds` | ⛔ **No** — RF1-A: a ring is not an enemy and has no `ENEMY_KINDS` row |
| P2 | `COUNTS.tracks` | ⛔ **No** — RF8 adds seats, never a track |

### ⛔ Closed-file edits — in place (plan §11)

| Phase | File | What | Basis |
|---|---|---|---|
| P1 | `test-cs006-p3.js:95–98` | the two "still unread" assertions become their replacement: each constant has exactly one reader, and Classic's dive is still `C.DIVE_TIME` long. ⛔ Written so RF6's cut does not redden it | **MEASURED** (V1, V2) |
| P1 | `test-cs012-p2.js:54–56` | the `C.MODE_FLAGS` literal gains RF6's field | **MEASURED** |
| P1 | `test-cs013-p1.js:58`, `:59` | the two row literals gain it; ⛔ `:60`'s claim is unchanged | **MEASURED** |
| P1 | `test-cs012-p4.js:457`, `:515`, `:584` | item 8's dive skip becomes "every `addScore` inside a dive is a ring at RF4's literal" | **MEASURED** |
| P1 | `test-cs012-p6.js:183`, `:341`, `:706` | the same claim and its message | **MEASURED** |
| P1 | `test-cs013-p2.js:380`, `:436` | the same, with Lance live | **MEASURED** |
| P1 | `test-cs013-p5.js:438`, `:440`, `:724–726` | the same, plus "and rolls nothing" — unchanged under RF4-A | **MEASURED** |
| P1 | `test-cs012-p4.js:628`, `:1114` | ⛔ **FIXTURES**: restore the mutation window and the reached-multiplier preconditions. ⚠ Seed-fragile (`STATUS.md`) | **MEASURED** |
| P1 | `test-cs012-p2.js:204`, `test-registry.js` | ⛔ **none** — RF1-A, MEASURED green under both stand-ins | **MEASURED** |
| P2 | `test-cs009-p4.js:37–40`, `test-cs009-p5.js:26` | `EVENTS` + RF8's seats | PREDICTED |
| — | `test-cs010-p2.js:346–364`, `test-cs006-p5.js:555–580`, `test-cs008-p2.js`, `test-cs008-p8.js` | ⛔ **none** — MEASURED green under both stand-ins | **MEASURED** |
| — | `test-cs013-p3.js:737`, `test-cs011-p3.js:176–196` | ⛔ **none** predicted; read both before writing the take pass | PREDICTED |

⛔ **An edit this table does not predict is a finding.** Stop, record it in
`STATUS.md` with its cause, and make the edit only if it restores the claim the
closed test was always making. ⛔ **A fixture is repaired to restore its
precondition, never relaxed to let a broken one pass.**

---

## P1 — the flight: the gate, the ring set, the take pass, the score path

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS014.md` §0
> (RF1–RF6 and RF9 **and their ANSWERS**; R1–R11), §1 whole, §2, §3, §6, §7,
> §8, §9, §10, §11 and §12. Then `VECTOR-VORTEX-GDD.md` §0, §1, §4.4, §4.5,
> §5, §6.5, §7, §13, §14.4, §14.5, §16.3 and §17 items 1, 8 and 12. Then
> `src/11-dive.js` whole, `src/02-state.js` (`state.dive`),
> `src/00-config.js`'s Dive and Overdrive groups and `modeHas()`,
> `src/12-scoring.js`, `src/09-collision.js` (`killSkimmer` and the five kill
> lines), `src/03-wells.js` (the depth model), and `enterWell()`,
> `respawnSkimmer()`, `update()` and `draw()` in `src/23-main.js`. Then
> `scratchpad/test-cs006-p3.js` (`:80–110`, `:405–455`),
> `test-cs006-p5.js` (`:440–585`), `test-cs012-p2.js` (`:40–70`, `:195–210`),
> `test-cs012-p4.js` (`:240–280`, `:340–360`, `:450–640`, `:1100–1120`),
> `test-cs012-p6.js` (`:175–200`, `:330–350`, `:695–725`),
> `test-cs013-p2.js` (`:375–440`), `test-cs013-p5.js` (`:225–260`, `:375–445`,
> `:715–760`), `test-cs013-p3.js:725–740` and `scratchpad/test-registry.js`.
> Create `log/CS014.md`. ultrathink.
>
> ⛔ **§0: RF1–RF6 and RF9. Build exactly those answers.** If any is blank,
> STOP and say so — a build phase invents no design.
>
> **0. `STATUS.md` is at 401 lines and `CLAUDE.md` at 45,797 bytes** (plan K1,
> K2). Compress `STATUS.md` before you add to it; reasoning goes to
> `log/CS014.md`, which you create. If a `CLAUDE.md` section you edit is over
> ~4 KB, fire the valve: its reasoning moves to `RATIONALE.md` under an
> `#anchor`, its rule stays and names the anchor.
>
> **1. The gate (RF6, R2).** Each row of `C.MODE_FLAGS` gains RF6's field. ⛔ A
> field in the rows, never a new top-level key — `22-meta.js` derives
> `progress`'s modes from `Object.keys(C.MODE_FLAGS)` and
> `test-cs013-p1.js:60` pins that.
>
> **2. The constants (R11).** `C.DIVE_TIME_OD` and `C.DIVE_RINGS_MAX` get their
> **first readers**, and RF3's and RF4's answers become new keys in
> `00-config.js`'s **Dive group**, each ⚠ marked provisional. ⛔ Every value in
> `C`; ⛔ no magic number reaches `11-dive.js`. ⛔ RF9: `C.DIVE_TIME_OD` is read
> exactly as `C.DIVE_TIME` is — **the WHOLE dive, grace included**.
>
> **3. The ring set (RF1, RF3).** Under RF1-A it is a field on `state.dive`,
> cleared by `resetDive()` and laid by `startDive()` — ⛔ **its one way in**,
> under `modeHas(...)`. Its comment block says what a ring is and why it is not
> an enemy, in plan RF1's MEASURED terms: during a dive only five of
> `state.enemies`' twenty readers run, and **the two that do are wrong by
> default** — §4.4's push collapses 3 of 6 rings onto 0.55, and
> `startDive()`'s `anchored` filter drops them on the repeat.
>
> **4. The take pass (RF2).** In `updateDive()`, ⛔ **above the strike test and
> above the completion check**, for the strike's own reason (`11-dive.js:266`).
> ⛔ Under RF2-A it is a lane match plus a depth crossing, through the build's
> existing `laneDelta` / `laneHit` — **no second idea of lane-sameness and no
> second control model.**
>
> **5. The score path (RF4, plan §8).** ⛔ Under RF4-A: `addScore()` with an
> unmultiplied literal, and **no** `comboKill()`, **no** `dropToken()`, **no**
> `tally.kills` and **no** `sfx("kill")`. ⛔ `addScore()` is unchanged and stays
> the one writer and the one life-awarder. ⛔ **The four kill sites and five kill
> lines do not move** and `09-collision.js` is not edited.
>
> **6. ⛔ CLASSIC IS A TOTAL NO-OP.** Nothing laid, nothing taken, no draw spent,
> and the dive is `C.DIVE_TIME` long. Prove it as a step-by-step hash against a
> build with the ring calls stubbed out — the Jump's and the token's proof.
> ⛔ `P1_DETERMINISM_HASH` and `GOLDEN_LANES` do not move; a move is a defect.
>
> **7. ⛔ THE CUT (RF6, plan §6).** Prove it in this phase, as
> `test-cs013-p4.js` proves the Mimic's: with RF6's flag mutated to `false`, an
> Overdrive session lays zero rings, pays nothing inside a dive, and its dive
> lasts `C.DIVE_TIME`. ⛔ Write `test-cs006-p3.js`'s repair so **the cut does
> not redden it**.
>
> **8. ⛔ RF5 — death condition 5 stays live in both modes.** The Thorn strike,
> `diveRespawn()`, the lane walk and the termination guarantee are untouched,
> and the build's ONE two-depth comparison is still the dive strike's
> (`test-cs013-p3.js:737` — read it before writing the take pass).
> ⛔ **The Dive still spends ZERO RNG draws** (`test-cs006-p3.js:431`, `:444`).
>
> **9. `scratchpad/test-cs014-p1.js`**, plus the §11 repairs P1 owns, made **in
> place**. Mutation-check the gate, the two constants' readers and the score
> line; ⛔ assert each mutation string is in the build exactly once before
> asserting red. ⛔ Assert the property, never the step count.
>
> **10.** `node scratchpad/run-all.js` green, zero skips. Update GDD §5, §14.5,
> §16 if the code map moved, `STATUS.md` and `log/CS014.md`. Commit
> "CS014 P1: the ring flight — the gate, the set, the take, and what it pays".

---

## P2 — the Dive's visual and the two seats

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS014.md` §0 (RF7
> and RF8 **and their ANSWERS**; RF1–RF3's answers for what a ring is; R8, R11),
> §1.3, §1.7, §1.8, §2, §4, §10, §11 and §12. Then `VECTOR-VORTEX-GDD.md` §0,
> §1, §3.2, §5, §10.1, §10.2, §10.3, §10.4, §11.8 and §14.5. Then
> `src/11-dive.js`, `src/03-wells.js` (`perspective`, `invPerspective`,
> `polyAt`, `screenPos`), `src/13-render-well.js` (`drawWell`, `drawPoly`,
> `glowStroke`, `drawText`), `src/14-render-entities.js` (`entityPoints`,
> `drawToken`, `shotAlpha`, the glyph rule), `src/15-render-hud.js`,
> `draw()` in `src/23-main.js`, `src/19-sfx.js` (`sfx`, `musicStateFor`),
> `src/00-config.js`'s SFX group, and `tools/sfx-lab.html`. Then
> `scratchpad/test-cs008-p4.js`, `test-cs009-p4.js`, `test-cs009-p5.js`
> (`:20–40`, `:320–360`, `:400–430`), `test-cs010-p2.js:340–370`,
> `test-cs012-p5.js:640–660` and `test-cs013-p1.js` (the token draw section).
> ultrathink.
>
> ⛔ **§0: RF7 and RF8. Build exactly those answers**, and nothing outside them.
> If either is blank, STOP and say so.
>
> **1. The visual (RF7).** ⛔ `drawPoly` + `glowStroke` only — **no fill, no
> sprite, no per-entity pipeline**, and text only through `drawText()`
> (`test-cs008-p4.js` scans the whole built file for a second `fillText` site
> and for any rectangle). ⛔ **Nothing opaque below `C.READABILITY_DEPTH`
> 0.25**: MEASURED, the deepest evenly-spaced ring sits at **0.0833**, so it
> fades as a token does or the lattice does not reach it. ⛔ **No per-frame
> allocation in the draw path** (GDD §6.5). ⛔ **Game math never reads window
> size.**
>
> **2. The z-order.** A ring is drawn where a token is — above the well, below
> the enemies — so a Thorn a diver is threading is never behind a gift
> (GDD §1.1 P2, CS013 T4).
>
> **3. ⛔ THE HASH DOES NOT MOVE.** P2 is draw-time and seat-only. Prove it the
> way `C.JUMP_LIFT` at 0 is proved (`test-cs012-p5.js:652`): a played session
> hashes identically with the visual's scale at 0. ⛔ A seat writes no `state`
> and draws nothing, and its argument names no `state`, no draw and no rng
> (`test-cs009-p5.js:410–430`).
>
> **4. The seats (RF8).** ⛔ **`tools/sfx-lab.html` FIRST** — the porting source:
> a brief, an A label, 1–2 alternates and an in-context sequence per event, then
> port candidate A **verbatim**. Each new event is **ONE line starting
> `    name:`** in `00-config.js`'s SFX group, which is sfx-lab's BLOCK SFX
> (`test-cs009-p4.js` pins the pair). ⛔ **No new track, no director change and
> no new intensity weight**: GDD §5's release is the Dive's music
> (`test-cs010-p2.js`: "a Dive reads 0", "a Dive makes no danger read") and the
> combo clock still HOLDS (O5). Tell Paul the lab is ready and what to hand
> back.
>
> **5. ⛔ CLASSIC.** RF7-A: the descent IS drawn in Classic too, and ⛔ **that
> must not move a Classic hash either** — it is presentation, and the proof is
> item 3's.
>
> **6. `scratchpad/test-cs014-p2.js`**, plus `test-cs009-p4.js`'s and
> `test-cs009-p5.js`'s `EVENTS` repaired in place.
>
> **7.** ⛔ **A skipped playtest.** Whether the flight READS as a flight is a
> hardware judgment the suite cannot make: one entry in `SKIPPED-PLAYTESTS.md`
> (changeset, phase, what Paul would have done, what it was trying to learn, the
> knobs). ⛔ Never in `STATUS.md`.
>
> **8.** `node scratchpad/run-all.js` green, zero skips. Update GDD §5, §10.3,
> §11.8 and §14.5, `STATUS.md` and `log/CS014.md`. Commit
> "CS014 P2: the Dive you can see, and the two seats".

---

## P3 — the twelfth soak, the review, the close

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS014.md` whole.
> Then `VECTOR-VORTEX-GDD.md` §0, §1, §5, §7, §13, §14.5, §17 and §19. Then
> `scratchpad/test-cs013-p5.js` whole (the eleventh soak's form: the driver, the
> hasher, the front door, the paired sessions), `test-cs012-p6.js`'s invariant
> section, `scratchpad/_harness.js`, `scratchpad/test-registry.js`, and
> `src/11-dive.js`. Then `ROADMAP.md` and `log/CS014.md`. ultrathink.
>
> **1. ⛔ `scratchpad/test-cs014-p3.js` — A NEW FILE, never a closed one
> widened.** The twelfth soak, in `test-cs013-p5.js`'s form: one front-door
> driver from the boot title, three paired proofs.
> - **Classic untouched:** one Classic session (Start Depths 1 / 13 / 23,
>   RESTART, a pause, QUIT) played as is and against a build with the ring calls
>   stubbed and RF6's flag mutated. ⛔ **Same hash every frame.**
> - **The cut:** one Overdrive session against a build with RF6's flag `false`.
>   ⛔ Zero rings laid, zero ring score, and the dive is `C.DIVE_TIME` long.
> - **The sounds cannot steer Overdrive:** one Overdrive session on the
>   recording fake and with no audio API. ⛔ **Same hash every frame.**
>
> **2. ⛔ Overdrive's invariants on EVERY step** of that session: at most
> `C.DIVE_RINGS_MAX` rings; rings only inside a dive and only in Overdrive;
> every ring depth in `[0, 1]`; ⛔ a dive spends **zero** draws; ⛔ every
> `addScore` call inside a dive is one ring at RF4's literal and nothing else;
> the combo unchanged across a dive (O5); ⛔ **item 5 still fires** (RF5); no
> token and no power inside a dive (CS013 T5); `state.enemies` never grows
> during a dive; shots ≤ the cap in force; no NaN; bounded arrays.
> ⛔ **Non-vacuity for every one:** rings taken AND missed, a dive repeated
> after a strike, a full set cleared, and an extra life crossed on a ring —
> staged if no played board reaches one.
>
> **3. ⛔ THE DRIVER IS THE REPAIR, never the build and never a relaxed
> assertion.** `STATUS.md`'s L11+ rule has three clauses (jump at anything
> aloft, never target a `MimicShot`, go to a hovering token); ⛔ **CS014 adds a
> fourth — steer to a ring in reach during a dive** — and each is a no-op
> wherever the thing does not exist, which is what keeps the Classic pair
> bit-identical. ⚠ And the driver is not always the whole repair: the second
> repair is the FIXTURE, playing longer.
>
> **4. ⛔ THE REVIEW — the point of this phase.** The one pass that reads every
> CS014 phase together and catches what two phases said differently. Check each
> of plan §11's predicted edits actually happened, each unpredicted one is
> recorded with its cause, plan §10's ledger row by row, and every ⛔ and ⚠ this
> changeset added to `CLAUDE.md`, the GDD and `STATUS.md` against the code.
>
> **5. The close.** ⛔ `log/CS014.md` REVIEWED and compressed; what is left in
> `STATUS.md` moved into it and `STATUS.md` reset for CS015, ⛔ under ~400 lines
> and current-changeset-only. `ROADMAP.md` gets CS014's "what shipped" and "what
> it deliberately left" paragraphs. **GDD §19's Overdrive row closes its last
> ✗** — "ring-flight inside its 4 s / 6 ring cap" — with the verdicts written
> the way CS012's and CS013's are, and ⛔ **`C.DIVE_TIME_OD` and
> `C.DIVE_RINGS_MAX` are no longer unread.** `SKIPPED-PLAYTESTS.md` gets CS014's
> remaining entries. ⛔ `CLAUDE.md` under 50 KB.
>
> **6.** ⛔ **`node scratchpad/run-all.js` green with ZERO SKIPS** — the
> `../coinless-kit` clone must be present (it is, at `e2efed5`). Commit
> "CS014 P3: the twelfth soak, the review, and the close".
