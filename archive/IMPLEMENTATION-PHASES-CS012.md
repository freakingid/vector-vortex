# IMPLEMENTATION-PHASES-CS012

One phase per Claude Code session. `/clear` between phases. Commit per phase on
`main`; never push.

Each phase below is the literal prompt to paste. A session reads `CLAUDE.md`
and `STATUS.md` automatically, and nothing else unless the prompt names it.

⛔ **`ultrathink` appears inside the prompt text where it is wanted.** It is a
per-turn lever, so it has to be in the pasted message.

✅ **Every call is answered: Paul took every recommendation in
`PLANNED-FEATURES-CS012.md` §0 (O1–O16), 2026-09-16.** A prompt below that says
"O3's answer" means O3's recommendation. No phase's shape changed.

**Baseline:** CS011 closed at `7dd90c8`, and CS012 was planned at `de53c0d`.
- `node build.js` → 24 modules + 3 inlined, 600,628 bytes.
- `node scratchpad/run-all.js` → **60 files, zero skips** (85.3 s).
- `test-registry.js`: `tracks: 2`, `enemies: 6`, `enemyKinds: 9`; `STATE_FIELDS`
  through CS008.
- `test-cs006-p2.js`'s `P1_DETERMINISM_HASH` is **1229033515**.
- `test-cs004-p1.js`'s `GOLDEN_LANES` is the `9ebd27b` sixteen plus CS008's `2, 5`.
- kit-audio **0.3.0**, kit-input **0.8.0**, kit-menu **0.1.0**,
  kit-leaderboard **0.2.1**.
- coinless-kit is at **`e9a4c2c`**. The Worker lists `orbital-overhaul` and
  `vector-vortex` only.

| Phase | Builds | Model | Effort |
|---|---|---|---|
| P1 | `drive`: composed in music-lab, ported verbatim; `C.MODE_TRACK.overdrive`; DRIVE on MUSIC TRACK | Opus 5 | **high** |
| P2 | Mode flags; the Reaver in `src/07-enemies-overdrive.js`; Overdrive's schedule | Opus 5 | **high** |
| P3 | OVERDRIVE on MODE; Overdrive's own board; SCORES' OVERDRIVE view; the Start Depth record per mode | Opus 5 | **high** |
| P4 | The combo: scoring, HUD, `comboLost`, the director's combo input, `max_combo`'s real source | Opus 5 | **high** |
| P5 | Jump: the rules, airborne immunity, lift and shadow, kit-audio 0.4.0's high-pass, the HUD glyph | Opus 5 | **high** |
| P6 | The tenth soak, the Overdrive intensity re-measure, the review, the close | Opus 5 | **high** |

---

## ⛔ Why the seams fall here

Plan §2 has the argument. In short:
- **P1 is first**, because an Overdrive run with no `drive` has no gameplay track
  (MEASURED, plan §1.6 B).
- **P2 builds the Reaver before anyone can choose Overdrive**, so an enemy's
  contract and the front door's fixture repairs are in different sessions.
- **P3 makes Overdrive choosable and gives its runs their own board in one
  commit.** Split, an Overdrive run would post to Classic's board.
- **P4 and P5** each touch the HUD. The combo places its rectangle first.
- **P6** needs every system for its paired sessions.

### ⛔ Preconditions outside this repo

| Before | What | Whose |
|---|---|---|
| P1 | §0's answers written into the plan | ✅ Done 2026-09-16 |
| P3 | O11's registry entry for `vector-vortex-overdrive` committed in coinless-kit and deployed, and **its commit named in `STATUS.md`** | Paul |

⛔ **If P3's precondition is not met, P3 still builds.** Its registry
assertion SKIPS LOUDLY, and `STATUS.md` records it. **P6 cannot close with a
skip**, so the close waits on the registry, never on a playtest.

### ⛔ The re-records — none

| Phase | Baseline | Moves? |
|---|---|---|
| P1–P6 | `P1_DETERMINISM_HASH` 1229033515 | ⛔ **No.** Every new behaviour is gated by the mode. A move is a defect (plan §10) |
| P1–P6 | `GOLDEN_LANES` | ⛔ **No** |
| P1 | `COUNTS.tracks` | 2 → 3 |
| P2 | `COUNTS.enemies`, `COUNTS.enemyKinds` | 6 → 7, 9 → 10 |
| P4, P5 | `STATE_FIELDS` | + `CS012: ["combo"]`, then `"jump"` |
| P3 | `progress` declared version | 1 → 2 (if O12 is per mode) |
| P5 | kit-audio `16-audio-engine.js` | 0.3.0 → 0.4.0 |

### ⛔ Closed-file edits — in place (plan §11)

| Phase | File | What | Basis |
|---|---|---|---|
| P1 | `test-cs009-p3.js:38–39` | `MODE_TRACK` and `MUSIC_TRACK_CHOICES` literals with `drive` | PREDICTED |
| P2 | `test-cs009-p4.js:115` | voice list + `reaver` | PREDICTED |
| P3 | `test-cs008-p5.js` (15) | OVERDRIVE locked → choosable | MEASURED |
| P3, O9-A | `test-cs008-p8.js`, `test-cs009-p3.js`, `test-cs009-p6.js`, `test-cs010-p4.js`, `test-cs010-p5.js`, `test-cs011-p3.js`, `test-cs011-p5.js`, `test-cs011-p6.js`; and `test-cs010-p2.js:277`, `test-cs011-p1.js:172`, `test-cs011-p2.js:164` | front-door drivers step to CLASSIC | MEASURED (8) / PREDICTED (3) |
| P3 | `test-cs011-p3.js` (7), `test-cs011-p5.js` from `:261` | SCORES gains MODE | MEASURED |
| P3 | `test-cs011-p5.js:148`, `:163` | one client per board | PREDICTED |
| P3, O12 | `test-cs011-p2.js:127`, `:224–225`, `:258`; `test-cs011-p4.js:447`, `:506` | `progress` v2 | PREDICTED |
| P4 | `test-cs007-p4.js:154`, `:157`; `test-cs008-p3.js:155–156`; `test-cs008-p2.js:387–388`; `test-cs011-p5.js:239` | the placeholder → `state.combo.peak` | PREDICTED |
| P4 | `test-cs009-p4.js:32`, `:109`, `:142` | `comboLost` | PREDICTED |

⛔ **An edit this table does not predict is a finding.** Stop, record it in
`STATUS.md` with its cause, and make the edit only if it restores the claim the
closed test was always making.

---

## P1 — `drive`

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS012.md` §0 (O13's
> answer and R10, R11), §1.8, §2, §3, §10, §11 and §12. Then
> `VECTOR-VORTEX-GDD.md` §0, §1, §11.3, §11.4(c), §11.5, §11.7 and §11.8. Then
> `src/17-audio-tracks.js` whole, `src/19-sfx.js` (`musicStateFor`), the
> `MUSIC_*` and `MODE_TRACK` lines of `src/00-config.js`, the OPTIONS sound rows in
> `src/23-main.js`, `tools/music-lab.html`, and `tools/sfx-lab.html`'s BLOCK B.
> Then the closed gates that loop every track: `scratchpad/test-cs009-p2.js`,
> `test-cs010-p3.js`, and `test-cs009-p5.js`'s headroom gate (`:574` on). Create
> `log/CS012.md`. ultrathink.
>
> ⛔ **Answered (§0):** O13 — tempo, length and tiers. Build exactly that answer.
>
> **1. Compose `drive` in `tools/music-lab.html` and port it verbatim.**
> - `buildDriveTrack()` in `src/17-audio-tracks.js`, registered as
>   `MUSIC_TRACKS.drive`. Use O13's tempo, `bar: 16`, and **at least 36 bars in
>   A→B→C sections**, written the way `pulse` carries its sections.
> - ⛔ **Struck, never swelled, on every layer** (GDD §11.3's table, ⚠ SETTLED):
>   `atk` ≤ 0.005, decay within 0.05 s, the builder's `GATE`, and any filter sweep
>   closing.
> - ⛔ **Every layer is a part** a player would recognise solo, and the melody is
>   in the foundation. GDD §11.7's character: the flagship, driving.
> - Per O13: **no `tier` and no `audition` mark**. One kick-like layer carries
>   `beat: true` for the rim pulse.
> - ⛔ **Worst step ≤ `C.MUSIC_STEP_NODE_MAX`** (16).
> - ⛔ **The file names no game global.**
> - ⛔ **Three-file edit:** the new `17-audio-tracks.js` is BLOCK B of both labs,
>   character for character. music-lab must list `drive` and offer its tempo on
>   the ladder.
>
> **2. `src/00-config.js`** (R10). `MODE_TRACK: { classic: "pulse", overdrive:
> "drive" }` and `MUSIC_TRACK_CHOICES: ["auto", "pulse", "drive"]`, appended.
> Update the two comments that say "CS012 adds".
>
> **3. `scratchpad/test-registry.js`:** `tracks: 3`.
>
> **4. `scratchpad/test-cs012-p1.js`** (≤ 15 header lines; harness; seed first):
> - `drive` exists, has ≥ 36 bars and its three sections, and runs at O13's tempo.
> - ⛔ **The headroom gate on `drive`.** Use D16's limiter-curve model exactly as
>   `test-cs009-p5.js` applies it to `pulse`, against the Surger tone's peak at
>   master, but ⛔ **with a 1e-9 s tie tolerance** on back-to-back notes (plan
>   §1.8: at a non-binary `stepDur` an exact compare reads a tie as an overlap).
>   **Mutation:** doubling one layer's gain turns it red.
> - `musicStateFor("play", "title", "overdrive", "auto") === "drive"`,
>   `musicStateFor("play", "title", "classic", "drive") === "drive"`, and Classic
>   AUTO is still `pulse`.
> - The MUSIC TRACK row cycles AUTO → PULSE → DRIVE, clamps, and saves `"drive"` by
>   name. A build over the same `Map` loads it.
> - The closed looping gates are green on `drive`: articulation, rows, node
>   ceiling. Assert nothing here that they own.
>
> **5. Closed edit:** `test-cs009-p3.js:38–39`, rewritten in place to the three
> choices and the two-mode map. Say why at the assertion.
>
> **6. Docs:**
> - GDD §11.7: `drive`'s shipped row, with measured length, worst nodes and
>   headroom. §11.3: note the new track. §19 Audio: flagship length ◐ → ✅.
> - GDD §10.5: MUSIC TRACK is AUTO / PULSE / DRIVE.
> - `SKIPPED-PLAYTESTS.md`: `drive` by ear. The solo audition and tiering are
>   Paul's lab work, not a playtest; its port is a later commit.
> - `log/CS012.md`: the composition's reasoning and the measured numbers.
> - `STATUS.md`: the ledger line, and any hazard for P2.
> - `DECISIONS.md`: one line pointing at plan §0 (O1–O16, every recommendation
>   taken, 2026-09-16).
>
> ⛔ `P1_DETERMINISM_HASH` and `GOLDEN_LANES` do not move. `node
> scratchpad/run-all.js` green, zero skips. Commit "CS012 P1: drive — …". Do not
> push.
>
> ⛔ **End the session by reminding Paul** that P3 needs the
> `vector-vortex-overdrive` registry entry in coinless-kit, deployed, with its
> commit named in `STATUS.md` (plan O11; F1 can ride in the same edit).

---

## P2 — mode flags, the Reaver, Overdrive's schedule

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS012.md` §0 (O1, O2,
> O15, O16's answers; R1, R9, R12, R15, R16), §1.1, §1.2, §4, §9, §10 and §11.
> Then `VECTOR-VORTEX-GDD.md` §0, §1, §3.5, §4.4, §4.5, §6.1, §6.3, §6.5, §7, §8,
> §8.1, §13 and §14.6. Then `src/07-enemies.js` (the base, the Vaulter, and every
> header), `src/08-spawner.js`, the Vaulter and entity-projection parts of
> `src/14-render-entities.js`, `src/00-config.js`'s enemy, spawner, heat and SFX
> groups, `build.js`, and `respawnSkimmer()` in `src/23-main.js`. Then
> `scratchpad/test-cs007-p2.js`, `test-cs007-p3.js`, `test-cs004-p5.js`
> (`:385–420`), `test-cs008-p1.js` (the rim-arrival cases) and
> `tools/sfx-lab.html`'s BLOCK SFX and candidates. ultrathink.
>
> ⛔ **Answered (§0):** O1 (what 1.6× scales, and "vaults toward the Skimmer"), O2
> (the schedule's form), O15 (the split), O16 (look, sound, no bench key). Build
> exactly those answers.
>
> **1. Mode flags (R1).** Add `C.MODE_FLAGS` and one reader,
> `modeHas(name, mode)`, beside the heat accessors in `00-config.js`. `mode`
> defaults to `state.mode`. Nothing reads them yet except the tests; P4 and P5
> do.
>
> **2. Overdrive's schedule (O2).**
> - Add `C.SPAWN_SCHEDULE_OVERDRIVE: [{ level: 6, kind: "reaver" }]`.
> - `eligibleKinds(level, mode)` merges the Classic rows and, for `"overdrive"`,
>   these, in ascending level, a Classic row first at an equal level. `mode`
>   defaults to `"classic"`.
> - `pickSpawnKind(state)` passes `state.mode`. ⛔ Its name stays: four closed
>   files call it.
> - ⛔ **A one-entry set spends no draw; two or more spend exactly one.** The
>   rule is unchanged in both modes.
> - ⛔ `C.SPAWN_SCHEDULE` is not touched (`test-cs007-p3.js:77`, `:103`).
>
> **3. The Reaver (O1, O15, O16; plan §9).**
> - A new `src/07-enemies-overdrive.js`, listed in `build.js`'s `MANIFEST` directly
>   after `07-enemies.js`. Its header says what lives here (Overdrive's roster;
>   CS013 adds two) and points back to the base's contract.
> - `class Reaver extends Vaulter` (R9). The Vaulter gains **overridable readers**
>   for its hop duration and its mid-climb direction, plus a `hopRate` of 1
>   applied to its two interval accessors.
>   - ⛔ **Every existing expression stays textually the same**:
>     `C.VAULT_CLIMB * climbMult()` keeps exactly five `climbMult()` call sites in
>     the build (`test-cs007-p2.js:501`).
>   - ⛔ **A Vaulter's arithmetic is bit-identical** (× 1 is exact).
>   - ⛔ **`Enemy` stays fields only.**
> - The Reaver sets `hopRate = C.REAVER_HOP_RATE` (O1) and hunts toward the
>   Skimmer mid-climb (O1), with its `sfxVoice` and `points()` from plan §9.
> - `ENEMY_KINDS.reaver` passes `dir`.
> - `C`'s Reaver group: the rate, its size and silhouette constants, and its
>   colour per O16. ⛔ No magic numbers outside `C`.
> - `14-render-entities.js`: `REAVER_POLY` and `drawReaver()`. ⛔ `entityPoints` +
>   `drawPoly` + `glowStroke`, no `ctx.fill` (`test-cs002-p3.js`).
> - `C.SFX_KILL_PITCH.reaver` is **candidate A from `tools/sfx-lab.html`**, with
>   2–3 candidates offered in the lab. ⛔ BLOCK SFX stays identical to
>   `00-config.js`'s SFX group.
> - Per O16: **no bench key**. `DEBUG_ROW_KINDS` stays Classic's six.
>
> **4. `scratchpad/test-registry.js`:** `enemies: 7`, `enemyKinds: 10`. Keep its
> comments true: the next mover is now CS013's.
>
> **5. `scratchpad/test-cs012-p2.js`:**
> - ⛔ **The contract.** Every field and method in plan §9's table, read off a
>   Reaver from `ENEMY_KINDS`.
> - `eligibleKinds(L, "overdrive")` equals a written-out band table at every
>   level 1..40. `eligibleKinds(L)` and `eligibleKinds(L, "classic")` equal
>   Classic's. ⛔ **Write the expected sets out; never derive them from `C`.**
> - ⛔ **The no-draw rule at Overdrive L1–2**, counted as `test-cs006-p5.js`
>   counts it.
> - **The hunt:** mid-climb hops take the Skimmer's direction, hold in its lane,
>   and fold at an open well's wall. **The hop:** its duration and both
>   intervals at the Reaver's rate, at L6, L23 and L99. ⛔ Heat never scales the
>   duration.
> - ⛔ **The respawn guarantee with Reavers.** Stage a rim Reaver, kill the
>   craft, and respawn through the real `respawnSkimmer()` at L6, L23 and L99. No
>   contact death inside `C.RESPAWN_INVULN`.
> - ⛔ **GDD §17 item 3:** on the six open wells, 5,000 steps each with Reavers
>   live, no Reaver lane leaves `[0, lanes−1]`, and no step moves one more than
>   R15's bound.
> - ⛔ **GDD §17 item 13 for the Reaver:** 24/24 over 0..23 ticks of pre-fire,
>   hopping in and climbing in, on a closed and an open well. Mutation-checked
>   like `test-cs008-p1.js`.
> - The Purge's first use kills it.
> - ⛔ **Classic never sees a Reaver:** a Classic run started at depth 7 hashes
>   identically, every step for 5,000 steps, to a build with the Overdrive
>   schedule row mutated out.
>
> **6. Closed edit:** `test-cs009-p4.js:115`'s voice list gains `reaver`, in
> place.
>
> **7. Docs:**
> - GDD §6.4 and §14.6 (the Reaver as shipped); §6.5 (the new module and the
>   eighth voice); §8.1 (Overdrive's rows and the per-mode set table); §16.4.
> - `CLAUDE.md`:
>   - Config: the schedule invariant reworded to "a function of the level and the
>     run's mode, and nothing else".
>   - The code map, with the new module.
>   - "New enemies wire into…": where an Overdrive enemy lives.
> - `ROADMAP.md` "Still open": the split's paragraph marked done by O15's answer.
> - `SKIPPED-PLAYTESTS.md`: the Reaver read against the Vaulter.
> - `log/CS012.md` and `STATUS.md`.
>
> ⛔ The hash and the golden do not move. Suite green, zero skips. Commit "CS012
> P2: …". Do not push.
>
> ⛔ **End the session by checking `STATUS.md` for Paul's registry commit.** If it
> is not there, remind Paul that P3 needs it (plan O11).

---

## P3 — Overdrive at the front door, and its own board

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md` (⛔ **find Paul's O11 registry commit
> there**), then `PLANNED-FEATURES-CS012.md` §0 (O9, O10, O11, O12's answers; R8,
> F1), §1.6, §1.7, §5, §10, §11 and §12. Then `VECTOR-VORTEX-GDD.md` §0, §1, §4.6,
> §10.5, §13, §15.1, §15.3 and §15.4. Then `src/22-meta.js` whole, the menus,
> `buildScoreRows()`, `buildDepthRows()`, `refreshTitleLine()` and `menuAction()`
> in `src/23-main.js`, `lib/kit-leaderboard/` and its NOTES,
> `lib/docs/kit-storage-client-api.md` (declared versions and `migrate`),
> `EXTERNAL-FILES.md`, and `src/22-meta.NOTES.md`. Then every closed file plan §11
> lists for P3. ultrathink.
>
> ⛔ **Answered (§0):** O9 (MODE's order), O10 (SCORES), O11 (the id), O12 (the
> record). Build exactly those answers.
>
> **1. MODE (O9).**
> - OVERDRIVE is enabled, in O9's row order, and `pickOverdrive` carries
>   `pendingMode`.
> - Remove the "LOCKED" detail and the M1 comment. Rewrite the comment on what
>   the default highlight is and why.
> - START DEPTH is built for `pendingMode` (step 4).
>
> **2. The boards (O11, R8).**
> - `C.LEADERBOARD_GAME_IDS = { classic: "vector-vortex", overdrive:
>   "vector-vortex-overdrive" }`. ⛔ **`C.GAME_ID` is unchanged: it is the save
>   keyspace.**
> - `Leaderboard` holds one kit client per mode, both made on the first call
>   that finds `window.KitLeaderboard`. A throwing `create()` is not retried, per
>   client.
>   - `beginRun()` and `submit(outcome)` use `state.mode`'s client.
>   - `load(mode, done)` keeps the stale-answer token per load.
>   - `queueLength()` sums both.
> - ⛔ **Every entry point is still a no-op without the module**, and nothing
>   throws into the game.
> - ⛔ **`Meta.eligible()` is still the one gate for the local row and the
>   submit.**
>
> **3. SCORES (O10).**
> - A MODE row per O10. Its entry mode per O10.
> - Info lines `<MODE> · LOCAL` / `<MODE> · ONLINE`; `Meta.scores(mode)`; ONLINE
>   loads that mode's board.
> - ⛔ **Rows are rebuilt on entry, on MODE, on VIEW and when a board answers,
>   never in `draw()`.** The M9 hint is unchanged.
>
> **4. The Start Depth record (O12).** If per mode:
> - `progress` is declared **v2** with a `migrate` from v1 (`{ highestCleared }` →
>   `classic`).
> - `levelRecord(mode)` and `startDepthOptions(mode)` default to `state.mode`.
> - The clear edge notes `state.mode`'s record.
> - ⛔ **Never a new key name.** ⛔ `levelRecord()` still reads storage on every
>   call.
>
> **5. `scratchpad/test-cs012-p3.js`:**
> - OVERDRIVE is chosen on keyboard, mouse, pad and touch, and the run's
>   `state.mode` is `"overdrive"`.
> - With a recording fake module: two `create()`s with the two ids and C's
>   endpoint and version.
>   - An Overdrive run end submits once to the Overdrive client and never to
>     Classic's. A Classic run does the reverse.
>   - A bench run submits to neither.
>   - RESTART keeps the mode's client.
>   - The queued line sums both queues.
> - ⛔ **The stats keys** equal coinless-kit's `registry.js` statsFields for
>   `vector-vortex-overdrive`, **read with `git show <Paul's commit>:`** as
>   `test-cs011-p5.js` does. Without that repo or entry, SKIP LOUDLY.
> - Local rows land per mode, and SCORES shows each mode's LOCAL and ONLINE,
>   with a stale answer dropped (mutation: the token ignored is red).
> - If O12 is per mode:
>   - a v1 record migrates to `classic`;
>   - a clear in one mode extends only that mode's list;
>   - a reload over the same `Map` keeps both.
> - ⛔ **Meta writes no `state`**: hash `state` around every `Meta` and
>   `Leaderboard` call on a played Overdrive run.
>
> **6. Closed edits (plan §11).** Rewrite each in place, and say at each why the
> claim moved:
> - `test-cs008-p5.js` (MODE).
> - O9's front-door repairs: one step to CLASSIC per driver, restoring a Classic
>   run. ⛔ In a paired soak, both sessions get the same step.
> - `test-cs011-p3.js` and `test-cs011-p5.js` (SCORES rows, `:148`, `:163`).
> - `test-cs011-p2.js` and `test-cs011-p4.js` (the record's shape).
> ⛔ **Any other red is a finding: stop and record it.**
>
> **7. Docs:**
> - GDD §4.6, §10.5 (MODE and SCORES rows), §13 (the board row), §15.1 (the
>   `progress` version), §15.3, §15.4; §19 Meta: separate online boards and the
>   local top 10 per mode.
> - `CLAUDE.md`:
>   - Leaderboard: two boards, one per mode, same gate.
>   - Save data: `progress` v2, and `C.GAME_ID` is the keyspace, never a board id.
> - `EXTERNAL-FILES.md` and `kit-leaderboard.NOTES.md`: two instances, usage only,
>   no version bump.
> - `src/22-meta.NOTES.md`.
> - `SKIPPED-PLAYTESTS.md`: MODE's highlight and the SCORES layout.
> - `STATUS.md`: delete the "Overdrive would post to Classic's board" hazard, and
>   record F1 as Paul's if he has not acted on it.
> - `log/CS012.md`.
>
> ⛔ The hash and the golden do not move. Suite green; the only permitted skip is
> the registry read, and only if Paul's commit is absent (recorded). Commit
> "CS012 P3: …". Do not push.

---

## P4 — the combo

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS012.md` §0 (O3, O4,
> O5, O8, O14, O16's answers; R2, R5, R6, R7), §1.3, §1.4, §1.5, §6, §10, §11 and
> §12. Then `VECTOR-VORTEX-GDD.md` §0, §1, §4.3, §5, §7, §10.3, §10.4, §11.4,
> §11.8, §14.4, §15.4, §15.6, §16.3 and §17 item 8. Then `src/12-scoring.js`,
> `src/09-collision.js`, `src/15-render-hud.js` (the HUD half), `src/21-telemetry.js`,
> `Leaderboard`'s payload in `src/22-meta.js`, and `dangerInputs()`, `update()`,
> `draw()` and `audioFrame()` in `src/23-main.js`. Then
> `scratchpad/test-cs008-p2.js` (the §17 item 8 form), `test-cs008-p4.js` (the HUD
> rectangles), `test-cs009-p4.js`, and the placeholder pins plan §11 lists.
> ultrathink.
>
> ⛔ **Answered (§0):** O3 (build, lapse, death, `max_combo`), O4 (scope), O5 (the
> Dive), O8 (HUD and sound), O16 (sizes, `C.COMBO_KILLS_PER_STEP`). Build exactly
> those answers.
>
> **1. The combo (`12-scoring.js`; R2).**
> - `state.combo` is `{ mult, kills, since, peak }`, reset by `newState()`. ⛔
>   `since` counts UP (GDD §16.3).
> - Top-level functions, so a test can stub them: `comboKill(state)`,
>   `comboDeath(state)`, `updateCombo(state, dt)`, `comboMult()`. Each is a no-op
>   or returns exactly 1 unless `modeHas("combo")`.
> - The rules are O3's. ⛔ **Every value is in `C`.** O5's Dive rule: while
>   `state.dive.active` the clock holds, or not, per the answer.
> - ⛔ **No RNG draw, and no `heat(` call.**
>
> **2. The kill sites (`09-collision.js`; O4, R6).**
> - Each of the four kill lines scores `e.points() * comboMult()` and calls
>   `comboKill(state)`, within O4's scope.
> - `killSkimmer()` calls `comboDeath(state)` below the invulnerability guard.
> - ⛔ **`addScore()` is unchanged and stays the one writer.**
> - ⛔ **The Purge still never calls `onShot()`** (⚠ SETTLED).
> - ⛔ **The Dive's termination kill still pays nothing and builds nothing.**
>
> **3. `23-main.js`.**
> - `updateCombo(state, dt)` runs once per play step. `dangerInputs()` writes
>   `out.combo` per R5: 0 in Classic, and `DANGER_NONE` still in a Dive.
> - The HUD view gains the combo fields and the mode. ⛔ It is filled in place,
>   never allocated per frame.
>
> **4. The HUD (O8).**
> - `hudLayout()` gains the combo rectangle and its ring; `drawHud()` draws them
>   in Overdrive only.
> - ⛔ `drawText()` for text; `drawPoly` + `glowStroke` for the ring. No fill, no
>   rect, no second `fillText` site.
> - ⛔ **Classic's rectangles are bit-identical.**
>
> **5. `comboLost`.** Add 2–3 candidates in `tools/sfx-lab.html`, and port
> **candidate A** into `C.SFX` as one line starting `    comboLost:` (⛔ BLOCK SFX
> identity). One `sfx("comboLost")` seat at the fall (O8). ⛔ No assignment in
> its arguments (`test-cs009-p5.js`'s scan).
>
> **6. `max_combo`'s real source (R7).**
> - `Leaderboard`'s payload and `telemetryRow()` read `state.combo.peak`: 0 in
>   Classic.
> - Delete `C.TELEMETRY_PLACEHOLDER` whole, with `21-telemetry.js`'s `P` and its
>   header paragraph.
> - ⛔ `TELEMETRY_FIELDS` does not move, so `telemetry` stays v1.
>
> **7. `scratchpad/test-registry.js`:** `STATE_FIELDS.CS012: ["combo"]`.
>
> **8. `scratchpad/test-cs012-p4.js`:**
> - Each O3 and O5 rule staged step by step: build, window, lapse, death, the
>   Dive. The multiplier is on its half-step lattice in [1, `C.COMBO_MAX`], and
>   `peak` never falls within a run.
> - ⛔ **GDD §17 item 8 in Overdrive**, in `test-cs008-p2.js`'s form: on played
>   Overdrive boards at L1, 6, 13 and 23, every step's score delta equals that
>   step's events priced from GDD §7 at that step's multiplier, per O4. It is
>   mutation-checked: multiplying a chip or a clear bonus is red.
> - ⛔ **Classic is untouched:** a Classic session's hash equals the same session
>   built with the combo calls mutated out of each kill site.
> - `dangerInputs().combo`: 0 in Classic and in a Dive, and R5's value in
>   Overdrive.
> - The combo rectangle clears the throat zone on all sixteen wells (GDD §10.3),
>   by `test-cs008-p4.js`'s arithmetic.
> - `comboLost` fires exactly once per fall (the recording fake).
> - The payload's `max_combo` and the `maxCombo` column equal `peak`, and are 0 in
>   Classic.
> - **Measure** the director's level and sweep maximum on those played Overdrive
>   boards (audio fake, the real `audioFrame`). Assert it is in [0, 1], and record
>   the number in `log/CS012.md` against plan §1.4.
>
> **9. Closed edits (plan §11):** the placeholder pins in four files, and
> `test-cs009-p4.js`'s event list, `:109` and `:142`, in place.
>
> **10. Docs:**
> - GDD §7 (the multiplier), §10.4 (combo, shipped), §11.4 (the combo input),
>   §11.8 (`comboLost`'s seat), §14.4 (as shipped), §15.4 and §15.6 (the real
>   source; the placeholder gone).
> - `CLAUDE.md` Scoring: the multiplier is applied at the kill sites, not in
>   `addScore()`.
> - `SKIPPED-PLAYTESTS.md`: combo feel, `C.COMBO_KILLS_PER_STEP`, HUD loudness,
>   `comboLost`.
> - `log/CS012.md` and `STATUS.md`.
>
> ⛔ The hash and the golden do not move. Suite green, zero skips. Commit "CS012
> P4: …". Do not push.

---

## P5 — Jump

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS012.md` §0 (O6, O7,
> O8, O16's answers; R3, R4, R14), §7, §10, §11 and §12. Then
> `VECTOR-VORTEX-GDD.md` §0, §1, §4.4, §4.5, §5, §6.5, §9.3, §9.5, §10.2, §10.4,
> §11.1, §11.5, §11.6, §11.8 and §14.2. Then `src/05-skimmer.js`, `src/06-shots.js`,
> `src/09-collision.js`, `src/11-dive.js` (`startDive`), `src/16-audio-engine.js`
> (`createMusic`) and its NOTES, `src/19-sfx.js`, `src/15-render-hud.js`, and
> `update()`, `enterWell()`, `respawnSkimmer()`, `draw()` and `audioFrame()` in
> `src/23-main.js`. Then `scratchpad/test-cs010-p1.js`, `test-cs010-p5.js` (the
> no-bare-`.value` form), `test-cs009-p5.js` (D16's model), and both labs' BLOCK A.
> ultrathink.
>
> ⛔ **Answered (§0):** O6 (the timing rules), O7 (the three channels), O8 (the
> glyph), O16 (the numbers). Build exactly those answers.
>
> **1. The Jump (`05-skimmer.js`; R2, R3, R4).**
> - `state.jump` (phase, `t`, cooldown, latch), reset by `newState()`.
> - A top-level `updateJump(state, dt)`, a no-op unless `modeHas("jump")`: takeoff,
>   airborne, recovery and cooldown per O6. ⛔ Every timer counts UP.
> - Resets on `enterWell()` and a respawn. A jump in flight when the well clears
>   lands on the clear step (R4).
> - `killSkimmer()` re-latches the jump input as it re-latches the Purge (O6).
>
> **2. Fire and contact.**
> - `updateShots()` fires nothing while airborne, or while recovering if O6 says
>   so.
> - `collideSkimmer()` skips its contact test while airborne (R3).
> - ⛔ **Correct the three comments that predicted a Skimmer depth**
>   (`07-enemies.js`'s base, `09-collision.js`'s header, GDD §4.5 and §6.5) to
>   what shipped.
>
> **3. The lift and the shadow (O7).**
> - Draw-time only: `skimmerPoints()` takes a lift, and the craft's draw strokes
>   the shadow on the rim.
> - ⛔ **No fill.** ⛔ **`lane` and the depth model are untouched.**
>
> **4. kit-audio 0.4.0 (O7).**
> - An optional `highpass: { hz, tc }` group builds a high-pass
>   `BiquadFilterNode` after the sweep and before the limiter.
> - `setHighpass(on)` is idempotent and moves by `setTargetAtTime`. ⛔ Never
>   `.value` after build.
> - ⛔ **The module names no game term.**
> - `AUDIO_VERSION` "0.4.0" and a `16-audio-engine.NOTES.md` entry (MINOR,
>   game-agnostic, backport `not yet`).
> - ⛔ **Three-file edit:** both labs' BLOCK A.
> - `19-sfx.js` passes `C.JUMP_HP_HZ` and `C.JUMP_HP_TC`. `audioFrame()` calls
>   `MusicSys.setHighpass(<airborne>)` every frame, reading `state.jump` in
>   `23-main.js`.
>   - ⛔ `19-sfx.js` names no `state`.
>   - ⛔ `audioFrame()`'s body has no "draw".
>   - ⛔ `frame()` never contains the text `audioFrame()` beyond its one call.
>
> **5. The HUD glyph (O8).** Through `hudLayout()`, Overdrive only. ⛔ Classic's
> rectangles are bit-identical.
>
> **6. `scratchpad/test-registry.js`:** `STATE_FIELDS.CS012` gains `"jump"`.
>
> **7. `scratchpad/test-cs012-p5.js`:**
> - ⛔ **Airborne immunity against every contact killer:** a Vaulter, a Carrier, a
>   Weaver bolt, a riding and a crossing Drifter, a Reaver, and a Surger's
>   discharge, each staged in the craft's lane at its kill depth. ⛔ **Mutation:**
>   removing the skip makes each a death.
> - No shot leaves the rim while airborne (or recovering, per O6).
> - **O6 to the step:** takeoff on a rising edge only; a held button never
>   re-jumps; recovery lethal; the cooldown from O6's start; the re-latch across a
>   death.
> - A jump in flight at a clear lands on the clear step, and the Dive starts
>   grounded.
> - ⛔ **Classic ignores the jump input:** a Classic session with the jump key
>   pressed every 50 steps hashes identically, step by step, to one without.
> - **kit-audio, on the recording fake:**
>   - the high-pass node exists only with the group;
>   - it automates only on takeoff and landing frames, by `setTargetAtTime`;
>   - it takes no bare `.value` after the build frame;
>   - it has Q ≤ the Butterworth value, so it is at or under unity and D16's
>     model holds unedited (assert the closed gate stays green, not a copy of it).
> - ⛔ **The lift is draw-only:** with `C.JUMP_LIFT` at 0 the state hash is
>   identical.
> - The glyph rectangle clears the throat zone and both touch buttons, mirrored
>   and not.
>
> **8. Docs:**
> - GDD §4.5 and §6.5 (R3), §9.3 (the Jump button in Overdrive; inert in Classic),
>   §10.4 (the glyph), §11.1 and §11.6 (the high-pass in the signal path), §14.2
>   (as shipped).
> - `CLAUDE.md`: Math and lifecycle (airborne is a phase, not a depth), and Audio
>   (the high-pass group, kit-audio 0.4.0).
> - `SKIPPED-PLAYTESTS.md`: the three airborne channels, the high-pass by ear,
>   the jump on touch.
> - `log/CS012.md` and `STATUS.md`.
>
> ⛔ The hash and the golden do not move. Suite green, zero skips. Commit "CS012
> P5: …". Do not push.

---

## P6 — the tenth soak, the re-measure, the close

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md` and `STATUS.md`, then `PLANNED-FEATURES-CS012.md` whole. Then
> `VECTOR-VORTEX-GDD.md` §0, §1, §13, §14, §17 and §19. Then
> `scratchpad/test-cs011-p6.js` and `test-cs010-p5.js` (the ninth and eighth soaks'
> forms), and `log/CS012.md` whole (⛔ this phase's review reads every entry).
> Then `ROADMAP.md`. ultrathink.
>
> ⛔ **Answered (§0):** O14 (the sweep). Every other answer is already built; do
> not re-open one.
>
> **1. `scratchpad/test-cs012-p6.js` — the tenth soak** (plan §8; ⛔ a new file,
> never a closed one widened). Three paired proofs over one front-door driver
> that starts at the title.
> - **Classic untouched.** One Classic session: Start Depths 1 / 13 / 23,
>   RESTART, QUIT, a pause. It is played twice: as is, and with the jump key
>   pressed on a fixed schedule and `{ stub: ["updateCombo", "updateJump",
>   "comboKill", "comboDeath"] }`. ⛔ **The state hash is identical on every
>   frame.**
> - **The music cannot steer Overdrive.** One Overdrive session: MODE → OVERDRIVE
>   → START DEPTH 1 / 7 / 13, scripted jumps, a Purge, a Dive, RESTART, a pause.
>   It is played on the recording fake and with no audio API. ⛔ **The hash is
>   identical on every frame.** On the audio session:
>   - `drive` is scheduled;
>   - every intensity and sweep argument is in [0, 1];
>   - high-pass automation lands only on takeoff and landing frames;
>   - ⛔ **the director's maximum and the sweep's Hz there are asserted and
>     recorded against O14's answer.**
> - **Overdrive's invariants, on every step of that session:**
>   - the multiplier is on its lattice, and `peak` never falls;
>   - the score delta equals the events at the multiplier (O4);
>   - no contact death while airborne, and no shot while airborne;
>   - takeoffs respect the cooldown;
>   - Reavers only at level ≥ 6 and only in Overdrive;
>   - Reaver lanes in range on open wells;
>   - no NaN, and bounded arrays.
>   - A fake leaderboard receives exactly one submit per run end, on the mode's
>     client.
>   - A reload over the same `Map` brings back both modes' tables and records.
> - ⛔ **Non-vacuity for every claim:** jumps taken, combos lost, Reavers killed, a
>   dive completed, both boards submitted to.
>
> **2. The review** (the close's point). Read every phase's `log/CS012.md` entry
> together, find where two phases said different things, and reconcile them in
> the docs. Record each in the log's review notes.
>
> **3. The ledgers.**
> - Measure plan §10's baseline ledger row by row, and plan §12's acceptance
>   criteria item by item, into `log/CS012.md`.
> - ⛔ **Zero skips.** The P3 registry read included.
> - ⛔ `P1_DETERMINISM_HASH` and `GOLDEN_LANES` unmoved.
>
> **4. Close:**
> - **`log/CS012.md`:** the phase ledger moved from `STATUS.md`, the version
>   history, and "Carried forward".
> - **`STATUS.md`:** compressed and reset for CS013, under ~400 lines, with the
>   hazards CS013 must act on (token palette vs O16's colours, `hudLayout()`'s
>   Overdrive rectangles, the new module for the Warden and Mimic).
> - **`ROADMAP.md`:** CS012's row marked shipped, with its narrative paragraphs
>   ("held as…", "shipped against the row", "deliberately left").
> - **GDD §19:** Overdrive (Jump, combo, Reaver) and Audio (flagship length, the
>   sweep per O14) verdicts at the CS012 close.
> - **`SKIPPED-PLAYTESTS.md`:** the tenth soak's asks.
> - **Move** `PLANNED-FEATURES-CS012.md` and `IMPLEMENTATION-PHASES-CS012.md` to
>   `archive/`.
> - **`C.GAME_VERSION`:** the next version, and CREDITS reads it.
>
> Suite green, zero skips. Commit "CS012 P6: the tenth soak …, the review, and the
> close". Do not push.
