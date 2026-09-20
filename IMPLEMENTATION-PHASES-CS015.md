# IMPLEMENTATION-PHASES-CS015

One phase per Claude Code session. `/clear` between phases. Commit per phase on
`main`; never push.

Each phase below is the literal prompt to paste. A session reads `CLAUDE.md`
and `STATUS.md` automatically, and nothing else unless the prompt names it.

⛔ **`ultrathink` appears inside the prompt text where it is wanted.** It is a
per-turn lever, so it has to be in the pasted message.

⛔ **NOTHING IN `PLANNED-FEATURES-CS015.md` §0 IS ANSWERED.** Twelve calls,
A1–A12, each with a measurement and one recommendation, and the answer column
empty. ⛔ **A prompt below that names a call builds the ANSWER Paul wrote
beside it. If that cell is blank, the phase STOPS and says so** — a build phase
invents no design (`CLAUDE.md` rule 3). The B and C branches in §0 are the
record of what was priced, not a choice left to the phase.

**Baseline:** CS014 closed at `ae9daf1`; CS015 is planned on top of `b92da55`.
- `node build.js` → 25 modules + 3 inlined kit, **781,198 bytes** (762.9 KB).
- `node scratchpad/run-all.js` → **74 files, zero skips, exit 0** (191.5 s).
- `test-registry.js`: `wells: 16`, `openWells: 6`, `tracks: 3`, `enemies: 9`,
  `enemyKinds: 13`; `STATE_FIELDS` through CS013; `state` **28** top-level keys.
- `test-cs006-p2.js`'s `P1_DETERMINISM_HASH` is **1229033515**.
- `test-cs004-p1.js`'s `GOLDEN_LANES` is the `9ebd27b` sixteen plus CS008's `2, 5`.
- `state.tally` has **8** fields. `C.MODE_FLAGS` is `{ jump, combo, tokens,
  rings }` per row. `C.SFX` **27 events**, `C.SFX_KILL_PITCH` **11 voices**.
  `TELEMETRY_FIELDS` **29**, `telemetry` **v1**. `C` **300** keys.
  `_harness.js`'s `EXPORTS` **210** names.
- Declared keys: `settings` v1, `progress` v2 + `migrate`, `telemetry` v1,
  `scores` v1. ⛔ **`achievements` is NOT declared.** `OWN_KEYS` is
  `["settings", "progress", "telemetry"]`.
- kit-names **0.1.0**, kit-storage **0.1.0**, kit-profile **0.1.1**,
  kit-leaderboard **0.2.1**, kit-input **0.8.0**, kit-audio **0.4.0**,
  kit-menu **0.1.0**. coinless-kit present beside the repo.
- `STATUS.md` **342 lines** (plan K2); `CLAUDE.md` **47,919 bytes**, 95.8 % of
  its 50 KB ceiling (plan K1).

| Phase | Builds | Model | Effort |
|---|---|---|---|
| P1 | The module, the store and the week: `20-achievements.js` + `.NOTES.md`, `C.ACHIEVEMENTS`, the `achievements` key, the ISO week and the rotation | Opus 5 | **high** |
| P2 | The facts, the two seats, the gate and the payload | Opus 5 | **high** |
| P3 | ⛔ The id table, whole, and the surface | Opus 5 | **high** |
| P4 | The thirteenth soak, the review, the close | Opus 5 | **high** |

⚠ **If A1 is answered C (a screen AND a toast), P3 splits in two and CS015 is
five phases.** P3's prompt says so at its head.

---

## ⛔ Why the seams fall here

Plan §2 has the argument. In short:
- **P1 is everything provable with no run.** A declared key, a pure week
  function and a pure rotation are all testable off `buildGame()` with no board.
  MEASURED (plan §1.2, V2 and V4) they cost two closed repairs between them.
- **P2 is the only phase that touches the simulation**, and it touches it the
  one way MEASURED free: `tally` fields (V3, green). ⛔ Its headline claim — no
  baseline moves — has to be made about a commit that changed nothing else.
- **P3 is the irreversible phase and it is alone.** ⛔ An achievement `id` is
  save data and is never renamed. It lands with its reachability assertions and
  its by-eye vocabulary check.
- **P4 is the thirteenth soak** — ⛔ **a NEW file, never a widened closed one.**
- **Three was considered** and rejected: it puts the store's repairs in the same
  commit as the seats, so P2's hash claim would have two causes. **Five** was
  considered too — splitting the table from the surface — and rejected because
  the surface is what proves the table complete, and finding a missing field one
  session later means editing save data.

### ⛔ Preconditions

| Before | What | Whose |
|---|---|---|
| **P1** | ⛔ **§0's answer column filled for A2, A5, A6, A7, A11 and A12** | **Paul — OPEN** |
| P2 | ⛔ A2, A3, A4 and A9 answered | **Paul — OPEN** |
| P3 | ⛔ A1, A8 and A10 answered | **Paul — OPEN** |
| P3 | `tools/sfx-lab.html` carries `unlock`'s brief, an A label, 1–2 alternates and an in-context sequence before a recipe is ported (only if A10 adds the event) | P3's own first act |
| P4 | `../coinless-kit` present beside this repo — `test-cs011-p5.js` reads its registry at `f0b0eb2` and `test-cs012-p3.js` at `e2efed5`, and each SKIPS LOUDLY without it; ⛔ a close cannot skip | ✅ MEASURED present, 2026-09-20 |

### ⛔ The re-records — none

| Phase | Baseline | Moves? |
|---|---|---|
| P1–P4 | `P1_DETERMINISM_HASH` 1229033515 | ⛔ **No.** MEASURED green under V3 and V4. A move is a defect |
| P1–P4 | `GOLDEN_LANES` | ⛔ **No** — CS015 spends no draw (R8) |
| P1–P4 | the twelve closed soaks' paired hashes | ⛔ **No** |
| P2 | `STATE_FIELDS` and `state`'s 28 keys | ⛔ **No** (R2) — a `tally` field is inside `STATE_FIELDS.CS007`'s one entry, MEASURED green under V3 |
| P1–P4 | `COUNTS` (all five) | ⛔ **No** — an achievement is not an enemy, a kind, a well or a track |
| P1–P4 | `TELEMETRY_FIELDS` 29 / `telemetry` v1 | ⛔ **No** (R3) |
| P1–P4 | the four kill sites and five kill lines | ⛔ **No** (R5, A9-A) |

### ⛔ Closed-file edits — in place (plan §11)

| Phase | File | What | Basis |
|---|---|---|---|
| P1 | `test-cs011-p6.js:326` | the `declared` regular expression gains `achievements`; `:330`'s claim and message are unchanged | **MEASURED** (V2) |
| P1 | `scratchpad/_harness.js` `EXPORTS` | ⛔ **+`createAchievements`, +`Achievements`**, and +the week-key function if it is top-level. ⚠ **CS014 added ten `EXPORTS` rows across two phases and predicted neither** — this row is that lesson | PREDICTED (read) |
| P1 | `test-cs011-p4.js:33` `REMOVE_KEYS`, `test-cs011-p2.js:119`, `:130` | ⛔ **none** — the first pins the LOOP not `OWN_KEYS`' contents, the others pin `settings` v1's and `progress` v2's shapes | **MEASURED** (V2 green) |
| P1 | `test-cs011-p1.js:41`, `:114` | ⛔ **none** — `KIT_INLINE_AFTER` is unchanged and the kit block still follows `20-achievements.js`'s banner | **MEASURED** (V4 green) |
| P2 | `test-registry.js` | ⛔ **none** | **MEASURED** (V3 green) |
| P2 | `test-cs012-p4.js:701` `COMBO_OUT`, `test-cs014-p1.js:332`, `:335` | ⛔ **none** under A2-A and A9-A. ⛔ **Under A2-B all six strings and both counts move** | **MEASURED** (V3 green) + PREDICTED |
| P2 | `test-cs011-p3.js:26` `GATE` | ⛔ **none** under A4-A: the gate gains a caller, not a body | PREDICTED (read) |
| P2 | the five item-8 price decoders (`-cs012-p4`, `-p6`, `-cs013-p2`, `-p5`, `-cs014-p3`) | ⛔ **none** under A9-A. ⛔ **Under A9-B or A9-C all five owe a term and a non-vacuity line** | PREDICTED (read) |
| P3 | `test-cs011-p3.js:384` | the title's four-label list gains the new row, in place | **MEASURED** (V1) |
| P3 | `test-cs011-p5.js:375` | the queued-line assertion's second array, the same list | **MEASURED** (V1) |
| P3 | OPTIONS' rows | ⛔ **none** — a row added before BACK moved nothing | **MEASURED** (V1) |
| P3 | `test-cs009-p4.js:39–42` | `EVENTS` + `unlock` (it drives `:119`, `:120`, `:140`, `:152`); `VOICES` unchanged | PREDICTED, only under A10-A |
| — | kit `VERSION` pins, `in <OBJECT>` assertions | ⛔ **none**: no kit bumps (R4) and no config object deleted — 17 closed `!("X" in …)` assertions, none naming a CS015 key | **MEASURED** (grep) |

⛔ **An edit this table does not predict is a finding.** Stop, record it in
`STATUS.md` with its cause, and make the edit only if it restores the claim the
closed test was always making. ⛔ **A fixture is repaired to restore its
precondition, never relaxed to let a broken one pass.**

---

## P1 — the module, the store, the week

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS015.md` §0
> (A1–A12 **and their ANSWERS**; the findings; R1–R10), §1 whole, §2, §3, §7,
> §8, §10, §11 and §12. Then `VECTOR-VORTEX-GDD.md` §0, §1, §15.1, §15.2,
> §15.5, §15.7, §16.4, §17 item 10 and §19's Meta row. Then `src/22-meta.js`
> WHOLE, `src/20-achievements.js`, `src/00-config.js`'s last group and
> `modeHas()`, `src/22-meta.NOTES.md` (the draft-kit-doc FORM), `build.js`'s
> `MANIFEST` and `KIT_INLINE`. Then `scratchpad/_harness.js`,
> `scratchpad/test-registry.js`, `test-cs011-p1.js`, `test-cs011-p2.js`,
> `test-cs011-p4.js:20–60`, `test-cs011-p6.js:310–340` and
> `test-cs002-p1.js:400–440`. Create `log/CS015.md`. ultrathink.
>
> ⛔ **§0: A2, A5, A6, A7, A11 and A12. Build exactly those answers.** If any
> cell is blank, STOP and say so — a build phase invents no design.
>
> **0. `STATUS.md` is at 342 lines and `CLAUDE.md` at 47,919 bytes** (plan K1,
> K2) — ⛔ **~2.0 KB of headroom, the tightest any phase has started with.**
> Reasoning goes to `log/CS015.md`, which you create, **as you go**; hazards and
> anything P2 must act on go to `STATUS.md`, one line in the ledger and ~200
> words. ⛔ **If a `CLAUDE.md` section you edit is over ~4 KB, fire the valve
> FIRST**: its reasoning moves to `RATIONALE.md` under an `#anchor`, its rule
> stays and names the anchor. ⚠ `### Math and lifecycle` is already rule-only at
> 5.4 KB and `## Code map` has no reasoning to move — neither is the target.
> **Save data** and **Leaderboard** are.
>
> **1. Record the two `STATUS.md` corrections plan §0.1 names, before anything
> else.** (a) ⛔ **GDD §0 has no row for an achievements SCREEN**: §10.5's screen
> table has none and §0's §10.5 row enumerates the screens and names none, while
> §15.5 — the section §0 points at — is entirely storage and evaluation. That is
> a defect in §0 by `CLAUDE.md`'s own rule; record it, do not work around it.
> (b) ⚠ `C.LIVES_MAX` is on the "none reachable by the suite's drivers" list and
> plan §1.3 MEASURED it **reached in five of seven** front-door probe sessions —
> the difference is run length, so the claim is true of the soaks and false of
> the driver. Correct it in place.
>
> **2. `20-achievements.js` becomes the module (R1).** A factory,
> `createAchievements(options)`, taking A12's answer for its definition table
> plus `load`, `save` and `now` callbacks. ⛔ **THE BOUNDARY CONTRACT HOLDS FROM
> THIS COMMIT** (`CLAUDE.md`, Kit modules; GDD §15.7): it names no `state`, no
> `C` and no game global, in either direction, because it is `kit-achievements`'
> draft. ⛔ **`src/20-achievements.NOTES.md` lands in this same commit** (R10),
> in `src/22-meta.NOTES.md`'s form — it doubles as the draft kit documentation.
> ⛔ **Nothing is added to `MANIFEST`**: the file is already listed and
> `KIT_INLINE_AFTER` is its name.
>
> ⚠ **TRAP, MEASURED (plan §1.2, R1): `20-achievements.js`'s banner slice is
> 55,197 bytes and HOLDS the three inlined kit bodies**, because the kit banner
> is a dash rule. So `test-cs002-p1.js`'s six forbidden device tokens apply to
> your code, and ⛔ **`e.key` anywhere in this module turns that file RED** — a
> loop over `entries` as `e` reading `e.key` is the natural way to write it and
> is the one way you must not.
>
> **3. `C.ACHIEVEMENTS` (A12).** ⛔ Every threshold in `C`, grouped by system,
> ⛔ no magic number in `20-achievements.js`. ⚠ **P3 replaces the rows' contents
> whole** — land placeholder rows here whose ids nothing will ever store under,
> and say so in a comment, because an id that reaches a player's store is save
> data from that moment on.
>
> **4. The `achievements` key (A6).** Declared in `22-meta.js`'s one `Store`
> **and** added to `Profiles.remove()`'s `OWN_KEYS` — ⛔ never `scores`, never
> `profiles`, which are ROOT and which profile `p0`'s scope shares. ⛔ **A new
> key needs no `migrate`**; loading is known-value-else-default, per field. ⛔ The
> game never builds a key string and never enumerates storage; `22-meta.js` stays
> the only file that calls storage.
>
> **5. The week (A7).** ⛔ **An ISO year-week computed in UTC.** Assert it
> against plan §1.6's six boundaries, `2026-W53` and `2020-W53` included, and
> against Sunday 23:30 UTC reading as the earlier week. ⛔ **The rotation is a
> function of the week and of NOTHING else** — no draw, no `heat()`, no board
> state — and a probe asserts `state.rng` is not called across a roll. ⛔ **The
> clock is the injected `now()`**, never `Date.now()` inside the module: plan
> §1.5 MEASURED that the build calls `Date.now()` twice per boot-plus-run, and
> that a per-step read moves the soaks' faked week by 9.2 days.
>
> **6. ⛔ DO NOT BUILD:** an evaluation seat, a `tally` field, the id table's
> real contents, any screen, any sound, any kill line, any draw call.
>
> **7. The test, `scratchpad/test-cs015-p1.js`.** The key is declared and an
> undeclared sibling still throws; a profile delete removes it by name and never
> a root key; a reload brings it back; each stored field falls back alone; tiers
> only rise, with a mutation that lowers one; the week key's six boundaries; the
> rotation's purity and its no-draw; and a text scan proving the module names no
> `state`, no `C` and no game global. ⛔ **Seed above the first `buildGame()`.**
> ⛔ **A mutation run that throws is a defect in the test**: guard the reads,
> report a COUNT and one index, and assert the string is in the build exactly
> once BEFORE asserting red.
>
> **8. Expect exactly these closed-file edits** (plan §11): `test-cs011-p6.js:326`
> and `_harness.js`'s `EXPORTS`. ⛔ **Anything else is a finding** — stop and
> record it. ⛔ **Run `node scratchpad/run-all.js` before committing**; nonzero
> exit means not done. Update `STATUS.md`, `VECTOR-VORTEX-GDD.md` §15.1's key
> table and §16 if the code map moved, `CLAUDE.md`'s Save-data table, and the
> code map. Commit "CS015 P1: the achievements module, the store, the week".

---

## P2 — the facts, the seats, the gate

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS015.md` §0
> (A2, A3, A4, A9 **and their ANSWERS**; R2–R8), §1.3, §1.4, §1.5, §1.7, §2,
> §4, §8, §9, §10, §11 and §12. Then `VECTOR-VORTEX-GDD.md` §0, §1, §7, §15.3,
> §15.5, §15.6 and §17 items 8 and 10. Then `src/02-state.js`'s `tally`,
> `src/22-meta.js` (`Meta` whole), `src/12-scoring.js`, `src/09-collision.js`
> (the five kill lines and `killSkimmer`), `src/10-powerups.js`
> (`collectToken`), `src/11-dive.js` (`takeRings`), and `runAction()`,
> `quitToTitle()`, the clear edge and `frame()` in `src/23-main.js`. Then
> `scratchpad/test-cs011-p3.js:20–60`, `test-cs011-p2.js:300–345`,
> `test-cs012-p4.js:690–740` and `test-cs014-p1.js:320–345`. Append to
> `log/CS015.md`. ultrathink.
>
> ⛔ **§0: A2, A3, A4 and A9. Build exactly those answers.** If any cell is
> blank, STOP and say so.
>
> **1. The counters (A2).** Each new `tally` field is incremented at the ONE
> place its event actually happens, beside the counter already there. ⛔ **They
> are write-only as far as the simulation is concerned and NOTHING BRANCHES ON
> ONE** (`02-state.js`'s own rule) — that is what keeps the determinism hash
> identical. ⛔ **`test-registry.js` does not move**: `STATE_FIELDS.CS007` is the
> single entry `["tally"]`, MEASURED green under plan §1.2's V3.
>
> **2. The seats (A3).** ⛔ **`Meta.runEnded()` sets `run = null` BEFORE it does
> anything**, so `eligible()` reads false inside it — read `ok`, the local,
> exactly as the submit does. Getting this backwards silently makes every run
> ineligible and nothing else says so. ⛔ **The clear edge is a PLAY step**, and
> plan §1.4 MEASURED that `levelRecord().noteCleared()` already reads and writes
> 39 bytes there; ⛔ **the shipped ban is on a TELEMETRY write from a play step**,
> because a full ring is 890,000 characters, and an achievements envelope is 681.
>
> **3. The gate (A4).** ⛔ **`Meta.eligible()` is the ONE gate** for the local
> top 10, both boards and now this. ⛔ Its body — `return run !== null &&
> !run.bench;` — is pinned by a closed `mutate` (`test-cs011-p3.js:26`) and must
> stay in the build exactly once; it gains a CALLER, not a change.
>
> **4. The payload (A11).** `evaluate()` returns A11's shape. ⛔ **Nothing is
> posted anywhere** — ⚠ SETTLED 2026-08-30, local-only (GDD §15.5, §21 #4) —
> and no stats key, no telemetry column and no registry read (R3).
>
> **5. ⛔ DO NOT BUILD:** the id table's real contents, any screen, any sound,
> any kill site or kill line, any draw call, any `addScore()` call (A9-A).
>
> **6. The test, `scratchpad/test-cs015-p2.js`.** Its headline claim is the one
> CS013 P1 and CS014 P1 each made: ⛔ **NO BASELINE MOVES.** Assert
> `P1_DETERMINISM_HASH` **1229033515** green, `GOLDEN_LANES` green, and a played
> session hashing identically against a build with the seats stubbed out. Then:
> each counter counts its own event at its own place; each seat fires once;
> ⛔ **a bench run reaches neither seat's write**; and ⛔ **no storage write
> happens on a play step that is not the clear edge** — a `Store.set` spy that
> records `state.screen`, which is plan §1.4's shape. ⚠ **A `Store.set` spy sees
> only `p0`'s writes**, and the boot block runs inside the harness, so the store
> is already booted.
>
> **7. Expect NO closed-file edits** under A2-A, A3-A, A4-A and A9-A (plan §11):
> not `COMBO_OUT`, not `test-cs014-p1.js`'s kill-line counts, not the five item-8
> price decoders, not the `GATE` pin. ⛔ **Any edit at all is a finding** — stop
> and record it. ⛔ **Run `node scratchpad/run-all.js` before committing.** Update
> `STATUS.md`, GDD §15.5 and `CLAUDE.md` if a rule landed. Commit
> "CS015 P2: the facts, the seats and the gate".

---

## P3 — ⛔ the id table, and the surface

**Model: Opus 5 · Effort: high**

⚠ **If A1 was answered C (a screen AND a toast), split this phase in two**: P3a
the table and the screen, P3b the toast, and CS015 becomes five phases. The
toast's own hazard is in §5 below.

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS015.md` §0
> (A1, A8, A10 **and their ANSWERS**; the findings; R9), §1.2, §1.3, §1.7, §1.8,
> §2, §5, §7, §9, §10, §11 and §12. Then `VECTOR-VORTEX-GDD.md` §0, §1, §7,
> §10.4, §10.5, §14.1, §14.2, §14.4, §14.5, §15.5, §17 item 10, §18 and §19's
> Meta row. Then `src/23-main.js`'s `SCREENS`, `syncScreen()`, `runAction()` and
> the SCORES builders, `src/15-render-hud.js` (`createMenu`, `drawMenu`,
> `hudLayout`), `src/00-config.js`'s `ACHIEVEMENTS` and SFX groups, and
> `src/20-achievements.js`. Then `scratchpad/test-cs011-p3.js:370–400`,
> `test-cs011-p5.js:360–385`, `test-cs009-p4.js:30–60`,
> `test-cs008-p6.js:415–436` and `test-cs008-p4.js:35–60`. Append to
> `log/CS015.md`. ultrathink.
>
> ⛔ **§0: A1, A8 and A10. Build exactly those answers.** If any cell is blank,
> STOP and say so.
>
> **1. ⛔ THIS PHASE IS IRREVERSIBLE.** An achievement `id` is save data and is
> never renamed (GDD §15.5; `CLAUDE.md`): renaming one drops that unlock for
> every player who had it, and deleting one orphans it. ⛔ **Land A8's table
> exactly as answered.** If a row looks wrong to you, ⛔ **stop and say so to
> Paul — do not change it in the session you noticed it.**
>
> **2. ⛔ CHECK EVERY ID AND EVERY DISPLAYED NAME BY EYE against the ten banned
> words** (`CLAUDE.md`'s vocabulary table; GDD §18). ⛔ **The closed scan is not
> enough**: `test-cs008-p6.js:432` tests `\bword\b`, and plan §0's findings
> MEASURED that a banned word joined by an underscore passes it while the same
> word hyphenated or spaced is red. An id table written once in snake_case is
> exactly the artefact that blind spot would let through. Say in `log/CS015.md`
> that you checked, and how.
>
> **3. Reachability (GDD §17 item 10).** ⛔ **Assert every predicate reachable
> PER ROW, never in aggregate** — plan §1.3 already found one row no board
> reaches, and an aggregate assertion would have hidden it. ⛔ **None throws on
> empty state** (a fresh `newState()`, a fresh profile, an empty store), and
> ⛔ **tiers are monotonic**, with a mutation that lowers one. ⚠ `purge_saver`
> and `rim_sweep` are MEASURED borderline on a played board — stage a board for
> those rather than relaxing them.
>
> **4. The surface (A1, R9).** SCORES' shape is the model: ⛔ **rows rebuilt on
> entry and on a row action, NEVER in `draw()`**; every string through
> `drawText()` — the build's one `fillText` site, pinned by `test-cs008-p4.js`;
> the chevron through `drawPoly` + `glowStroke`; the window is
> `MENU_VISIBLE_ROWS` 7; BACK last. ⛔ **A row on the TITLE goes AFTER PROFILE**
> and ⛔ **a row on OPTIONS goes before BACK, never above TELEMETRY** — MEASURED
> (plan §1.2, V1), the title costs two closed repairs and the OPTIONS row costs
> none.
>
> **5. ⚠ IF A TOAST IS IN SCOPE:** `hudLayout()` returns six rectangles and
> ⛔ **the jump glyph and the combo readout are each placed ABSOLUTELY, off no
> other rectangle**, which is what keeps the four CS008 corners bit-identical —
> asserted in `test-cs012-p4.js` and `test-cs012-p5.js`. A seventh must do the
> same, and ⚠ **the band it wants, centre-top, is the combo readout's in
> Overdrive** (plan §1.8). ⛔ Nothing opaque below `C.READABILITY_DEPTH` 0.25.
>
> **6. The sound (A10).** Only under A10-A. ⛔ **Compose in `tools/sfx-lab.html`
> and port verbatim** — the lab is the porting source for every `C.SFX` recipe,
> and the build ships candidate A until Paul picks. The event is ONE line
> starting `    name:` in `00-config.js`'s SFX group, ⛔ **no `SFX_KILL_PITCH`
> voice** (a ring took neither) and ⛔ **no `C.MUSIC_DIP_EVENTS` row.** ⛔ Every
> audio entry point stays `if (!AudioSys.ctx) return;`-guarded.
>
> **7. The test, `scratchpad/test-cs015-p3.js`.** GDD §17 item 10's three claims,
> per row; every id unique; the mode tags; the screen's rows rebuilt on entry and
> never in `draw()`; the window; and the vocabulary check written as an
> assertion over the table, ⛔ **testing both `\bword\b` AND the underscore
> form**, so the blind spot cannot reach a future row either.
>
> **8. Expect exactly these closed-file edits** (plan §11):
> `test-cs011-p3.js:384`, `test-cs011-p5.js:375`, and `test-cs009-p4.js:39` only
> under A10-A. ⛔ **Anything else is a finding.** ⛔ **Run
> `node scratchpad/run-all.js` before committing.** Update `STATUS.md`, GDD
> §10.5's screen table, §15.5, §0's §10.5 row (the P1 defect), and `CLAUDE.md`.
> Commit "CS015 P3: the id table and the surface".

---

## P4 — the thirteenth soak, the review, the close

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS015.md` WHOLE.
> Then `VECTOR-VORTEX-GDD.md` §0, §1, §15.5, §17 items 10 and 12, and §19's
> Meta row. Then `log/CS015.md` whole, `scratchpad/test-cs014-p3.js` (the
> twelfth soak, for its FORM and its driver), `scratchpad/test-cs011-p6.js`
> (the ninth, for the store's soak form) and `scratchpad/test-registry.js`.
> Then `ROADMAP.md`, `SKIPPED-PLAYTESTS.md` and `DECISIONS.md`. ultrathink.
>
> **1. The thirteenth soak, `scratchpad/test-cs015-p4.js`** — ⛔ **a NEW file,
> never a widened closed one.** The twelve are `-cs003-p5` … `-cs007-p5`, then
> the front-door pairs `-cs008-p8`, `-cs009-p6`, `-cs010-p5`, `-cs011-p6`,
> `-cs012-p6`, `-cs013-p5`, `-cs014-p3`; each file's header says what its pair
> holds constant, and yours says what yours does.
>
> It proves: a front-door session in **each mode** over a working store, then a
> reload, with every unlock the session earned still there; ⛔ **the same session
> against a build with the evaluator's seats stubbed out hashes identically, step
> by step** (CS014 P1's form); a week roll — the injected clock moved forward
> eight days — empties `weeklyUnlocked` and keeps `lifetimeUnlocked` and
> `lifetimeTiers`; ⛔ **no enumeration read across the whole session**
> (`_env.storageReads` 0); and ⛔ **only declared keys in storage.**
>
> ⛔ **The driver is `STATUS.md`'s four-clause L11+ driver, unchanged**: jump at
> anything `aloft`; never target a `MimicShot` and steer away within a lane; go
> to a hovering token; steer to a ring in reach during a dive, "in reach" derived
> from the depth model and `C.KEY_SPEED_MAX`, never a constant. ⛔ **A repair is
> the DRIVER or the FIXTURE — playing longer — never the build, a lowered level
> or a relaxed assertion.** ⚠ A dive's length is a PROPERTY, never a step count;
> a run that ends inside a dive leaves `dive.active` true until the RESTART
> press; and `state.tally` is re-minted by `startGame()`.
>
> **2. ⛔ THE REVIEW — the one pass that reads every phase together**, and the
> point of it is catching what two phases said differently. Read plan §10 row by
> row and MEASURE each at the close; read plan §11 and say, per row, whether the
> edit happened and whether any edit happened that the table did not predict;
> read every ⛔ and ⚠ CS015 added, against the code.
>
> **3. The close.** ⛔ **REVIEW and compress `log/CS015.md`**, move what is left
> in `STATUS.md` into it, and reset `STATUS.md` for CS016 — current changeset
> only, under ~400 lines. Append the version history entry to `log/CS015.md`.
> Update `ROADMAP.md`'s CS015 row and its "What CS015 deliberately left".
> ⛔ **Append to `SKIPPED-PLAYTESTS.md`** for anything only a person could judge
> — whether the five weekly feel weekly, whether the tier thresholds are
> reachable by a human rather than a bot, and whether the surface tells a player
> anything. ⛔ **Index CS015's twelve calls in `DECISIONS.md`, one line each — a
> pointer, never the writeup** (the rule `b92da55` added to `CLAUDE.md`'s session
> table).
>
> ⚠ **`DECISIONS.md` has no row for CS012's sixteen calls (O1–O16) or CS014's
> nine (RF1–RF9).** That gap is Paul's or a planning session's, not a close's —
> ⛔ **do not fix it here**, and say in `log/CS015.md` that you did not.
>
> **4. GDD §19's Meta row.** ⛔ **Its achievements item is the row's LAST ✗.**
> Write the verdict — met, half met or not met — beside the CS011 and CS012
> verdict blocks, in their form, and if it is met say so plainly: the row closes.
>
> **5. ⛔ ZERO SKIPS.** `../coinless-kit` must be present: `test-cs011-p5.js`
> reads its registry at `f0b0eb2` and `test-cs012-p3.js` at `e2efed5` (⛔ never
> `f8d34f3`). ⚠ `run-all.js` has a 120 s PER-FILE timeout and machine load can
> trip it — ⛔ a timeout is not a red; re-run the file alone before treating it
> as one. Commit "CS015 P4: the thirteenth soak, the review, and the close".
