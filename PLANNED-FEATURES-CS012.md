# PLANNED-FEATURES-CS012 — Overdrive core: the mode, the Reaver, the combo, Jump, `drive`, Overdrive's board

**Overdrive becomes a mode a player can choose. It gets its own flagship track
(`drive`), its first enemy (the Reaver), a combo multiplier that scores and feeds
the intensity director, the Jump with its three airborne channels, and an online
board of its own with a SCORES view. `max_combo` gets its real source. The tenth
soak closes it (GDD §11.4, §11.7, §13, §14.2, §14.4, §14.6, §15.3, §15.4, §19).**

⛔ **EVERY CLAIM IN THIS DOCUMENT IS MARKED MEASURED OR PREDICTED.** A MEASURED
claim names what was run (§1 lists the probes). A PREDICTED one says so.

⛔ **§0 IS OPEN. No build phase starts until Paul has answered O1–O16 and the
answers are written into §0's last column.** A phase prompt that names an answer
reads it from there.

**Baseline for every measurement: commit `de53c0d`.** `node build.js` → 24
modules + 3 inlined, `dist/vector-vortex.html` **600,628 bytes**.
`node scratchpad/run-all.js` → **60 files passed, zero skips, exit 0, 85.3 s
wall**. coinless-kit is at **`e9a4c2c`**. The Worker was read with three GETs on
2026-09-16 (§1.7). **Nothing was posted.**

**How the probes ran.** Everything lived in the session's scratchpad directory
and is gone. ⛔ **Nothing in this repository's `src/`, `scratchpad/`, `tools/` or
`lib/` was touched** (`CLAUDE.md` rule 3a).
- **Arithmetic probes** built the real `dist/` through `scratchpad/_harness.js`
  and read its accessors: `climbMult()`, `vaultInterval()`, `surgeInterval()` and
  the rest (§1.1, §1.9).
- **Two hunting bots** drove `Game.update()` on real boards: fire held, the mouse
  aimed at the deepest live non-anchored enemy that is not a Weaver bolt. The
  **sharp** bot re-aims every step at up to 13 lanes/s. The **dull** bot re-aims
  every 0.45 s at up to 6 lanes/s. Kills, clears and deaths were read with the
  harness's `{ spy: ["sfx"] }` and `{ spy: ["addScore"] }`. ⚠ **A bot is not a
  player.** Its kill cadence is set mostly by the spawner (§1.3), which is why
  the numbers are still useful.
- **Three variant builds** were shared `git clone`s of `de53c0d` with one edit to
  `src/23-main.js` each, and the suite was run in each (§1.6).
- **The Worker** was read with `curl` GETs only.

**Read for this plan, beyond the prompt's list:** GDD §4.5 (one paragraph),
§4.6, §10.4–10.5, §11.3, §11.5, §11.6, §11.8, §16.3 (one line) and §17;
`src/00-config.js`, `02-state.js`, `05-skimmer.js`, `06-shots.js`,
`07-enemies.js` (the base and the Vaulter), `08-spawner.js`, `09-collision.js`,
`12-scoring.js`, `15-render-hud.js` (the HUD), `16-audio-engine.js` (`createMusic`),
`18-audio-director.js`, `19-sfx.js`, `21-telemetry.js`, `22-meta.js`,
`23-main.js`; `build.js`; `scratchpad/_harness.js`, `test-registry.js`, and the
closed assertions §11 names; `lib/kit-leaderboard/` and its NOTES;
`EXTERNAL-FILES.md`; coinless-kit's `services/leaderboard/src/registry.js`,
`validate.js` and `scores.js`. ⛔ **From `archive/`**, beyond
`PLANNED-FEATURES-CS011.md` §1.4: that file's header, §0 and §1.5 (the rate
measurement, §1.5 here) and `IMPLEMENTATION-PHASES-CS011.md` (for the form of
the phase prompts). **From `log/`**, only the two "Carried forward" sections.

---

## ⛔ 0. PAUL'S CALLS — OPEN

Each is a design call the GDD does not settle, with its measurement and a
recommendation. ⛔ **None is answered here.** A build phase builds the answer
written in the last column and does not re-open it.

| # | The call | Recommendation | ✅ Answer |
|---|---|---|---|
| O1 | What the Reaver's "1.6×" scales | The hop only: hop time and both hop intervals ÷ 1.6. The climb stays the Vaulter's | ⏳ |
| O2 | How Overdrive's introduction schedule is expressed | A second table of Overdrive-only rows, merged by level | ⏳ |
| O3 | How the combo builds, lapses and resets, and what `max_combo` reports | +0.5 per 4 kills; −0.5 per window without a kill; ×1 on death; the run's peak; Classic posts 0 | ⏳ |
| O4 | What the multiplier multiplies, and which kills build it | Kill points at all three kill sites; every kill builds it; chips and bonuses unmultiplied | ⏳ |
| O5 | Does the combo window run during the Dive? | No: its clock holds while the dive is active | ⏳ |
| O6 | Jump's timing rules | Cooldown counts from landing; recovery is lethal and cannot fire; Purge allowed airborne; takeoff on the rising edge | ⏳ |
| O7 | Jump's three airborne channels | A drawn lift, a stroked shadow, and a high-pass on the music for the whole jump (kit-audio 0.4.0); no jump SFX | ⏳ |
| O8 | The Overdrive HUD: combo and Jump readiness | ×N centre-top, absent at ×1, with a depletion ring; `comboLost` on every fall; a jump glyph beside the Purge glyph | ⏳ |
| O9 | MODE's default highlight (GDD §13) | OVERDRIVE first and highlighted; repair 8 front-door fixtures | ⏳ |
| O10 | How SCORES reaches OVERDRIVE | A MODE row first; opens on the last run's mode, else MODE's first row | ⏳ |
| O11 | Overdrive's board id, its registry entry, and when | `vector-vortex-overdrive`; Paul registers and deploys before P3 | ⏳ |
| O12 | The Start Depth record: shared or per mode | Per mode (`progress` v2, migrated) | ⏳ |
| O13 | `drive`: tempo, length, tiers | 138 BPM, ≥ 36 bars A→B→C, untiered until Paul marks PASS | ⏳ |
| O14 | If the sweep still does not open end to end | Accept, record the number and GDD §19's ✗; no rescale | ⏳ |
| O15 | Does `src/07-enemies.js` split now, and how | Yes: a new `src/07-enemies-overdrive.js`; nothing moves out | ⏳ |
| O16 | The provisional values: the Reaver's look and sound, the HUD sizes, the Jump numbers, the bench | Vaulter-red with barbs, pitch 1.15, no bench key; the §0 table below | ⏳ |

### O1 — what the Reaver's "1.6×" scales

GDD §14.6: "Vaulter at 1.6× that vaults toward the Skimmer". It does not say 1.6×
of what.

**MEASURED (§1.1): a Reaver that CLIMBS at 1.6× breaches GDD §4.4's respawn
guarantee at every level it can appear.** The guarantee is `(0.95 − 0.55) /
(climb × climbMult(level)) > C.RESPAWN_INVULN` (1.5 s), held today by
`C.CLIMB_MULT_MAX` 1.40 with a +0.087 s margin (⚠ SETTLED, Paul's H1).

| Climb multiple | Push→band at L6 | Margin at L6 | Worst (L99) | First level that breaches |
|---|---|---|---|---|
| ×1.000 (the Vaulter) | 2.039 s | +0.539 | 1.587 s | none |
| ×1.058 | 1.927 s | +0.427 | 1.500 s | none (the largest that holds) |
| ×1.2 | 1.699 s | +0.199 | 1.323 s | 38 |
| ×1.4 | 1.456 s | −0.044 | 1.134 s | 4 |
| **×1.6** | **1.274 s** | **−0.226** | **0.992 s** | **1** |

- **A — the hop only (recommended).** `C.VAULT_HOP_TIME` ÷ 1.6 = **0.175 s**; the
  mid-climb interval `vaultInterval() / 1.6` (1.930 → **1.206 s** at L6); the rim
  interval `vaultRimInterval() / 1.6` (0.505 → **0.316 s** at L6, floor
  0.35 / 1.6 = **0.219 s**, still above the 0.175 s hop, so the knob stays live
  by CS007's saturation rule). The climb is `C.VAULT_CLIMB × climbMult()`, so
  `C.CLIMB_MAX_BASE` and the guarantee do not move. MEASURED.
- **B — the climb as well.** It breaches H1's guarantee (above). Holding it
  would need a new push rule for Reavers, or a lower `C.CLIMB_MULT_MAX` for
  everything. ⛔ Not recommended: both re-open a SETTLED call.
- **C — the hop ×1.6 and the climb ×1.05.** It holds, with a 0.015 s margin at
  L99 (PREDICTED, from the table), and `test-cs007-p2.js` would need a sixth climb
  constant named in `CONTACT_CLIMBS` (MEASURED by reading `:65`).

**And the reading this plan takes on the other half** (confirm or correct it with
O1): *"vaults toward the Skimmer"* means **every mid-climb hop takes
`huntDir()`**, the rim hunt's direction, from its first update, with no level
gate. It holds its lane when it is already in the Skimmer's lane. At the rim it
hunts exactly as a Vaulter does, at the Reaver's interval.

### O2 — how Overdrive's schedule is expressed

`eligibleKinds(level)` is "a function of the level and nothing else" (⛔
`CLAUDE.md`). The Reaver is Overdrive-only (GDD §13), so the set must now depend
on the run's mode. Either form rewords that invariant.

**MEASURED by reading `test-cs007-p3.js`:** `:77` asserts `C.SPAWN_SCHEDULE` has
**exactly seven rows**; `:103` asserts **no row carries a field but `level` and
`kind`** (the no-weight-table absence, Paul's 2026-08-31 call); `:121–127`
assert `eligibleKinds(L)` with one argument equals the Classic band table at
every level 1..40.

- **A — a second table (recommended).** `C.SPAWN_SCHEDULE_OVERDRIVE: [{ level: 6,
  kind: "reaver" }]`, merged with the Classic rows by
  `eligibleKinds(level, mode)`, in level order, a Classic row first at an equal
  level. `mode` defaults to `"classic"`. `pickSpawnKind(state)` passes
  `state.mode`. **Zero closed edits** (PREDICTED from the three pins above). CS013
  adds its Warden (11) and Mimic (16) rows there.
- **B — a `mode` field on rows.** It turns `:77` and `:103` red, and `:103` is
  the assertion that stands for the weight-table decision (PREDICTED).

Under A, the uniform pick gives the Reaver **1/4 of releases at L6–8, 1/5 at
L9–12, 1/6 at L13–17, 1/7 at L18–22, 1/8 from L23** (PREDICTED, arithmetic;
CS013's rows dilute it further). ⛔ **The no-draw rule holds in Overdrive**: its
set is one entry at L1–2 as well.

### O3 — how the combo builds, lapses and resets, and what `max_combo` reports

GDD §14.4: "Consecutive kills, no death, no gap beyond `COMBO_WINDOW` 2.5 s. ×1 to
×8 in half steps. Decays rather than snapping", and "set the window generous
enough that ordinary competent play sustains ×3–4".

**MEASURED (§1.3): 94–95 % of inter-kill gaps are under 2.5 s for BOTH bots**,
median 0.50–0.62 s. The kill cadence comes from the spawner more than from aim,
so the gap test alone almost never breaks a combo. What the multiplier sustains
is set by the build rate and the lapse rule:

| Kills per +0.5 | Lapse rule | Mean multiplier per kill, sharp / dull | Kills at ≥ ×3 (sharp) | Peak |
|---|---|---|---|---|
| 1 | −0.5 per window | **7.20 / 6.82** | 94 % | 8 |
| 1 | snap to ×1 | 5.06 / 4.77 | 77 % | 8 |
| 2 | −0.5 per window | 6.42 / 5.74 | 88 % | 8 |
| 2 | snap to ×1 | 3.07 / 2.89 | 55 % | 8 |
| 3 | −0.5 per window | 5.59 / 4.74 | 81 % | 8 |
| **4** | **−0.5 per window** | **4.76 / 3.85** | 72 % | 8 |
| 4 | snap to ×1 | 1.92 / 1.83 | 14 % | 4.5 |

⛔ **The literal reading (+0.5 per kill) sustains about ×7, twice GDD §14.4's
×3–4 target.** "Decays rather than snapping" rules out the snap rows.

- **Recommended:** +0.5 every `C.COMBO_KILLS_PER_STEP` = **4** kills (⚠
  provisional). A window with no kill costs 0.5, and each further window costs
  another 0.5, down to ×1. A death is ×1 at once, with the kill count emptied. The
  window restarts on every kill.
- **`max_combo`** (stats) and **`maxCombo`** (telemetry) are **the run's peak
  multiplier**: 5.5, not 11 kills. The Worker stores any JSON value (MEASURED,
  coinless-kit `scores.js:27`, `validate.js:55`). ⛔ **A Classic run reports 0**,
  which is the value every Classic row posted so far carries.

### O4 — what the multiplier multiplies, and which kills build it

**MEASURED (§1.5): the multiplier's scope decides whether Overdrive's board flags
deep starts.** Worst score ÷ duration during a run, with the sharp bot:

| Start Depth | Classic today | ×8 on kill points only | ×8 on everything |
|---|---|---|---|
| 1 | 213–231 /s | 973–1,092 /s | 1,707–1,851 /s |
| 23 | 9,142–9,354 /s | 10,488–12,208 /s | 73,135–74,831 /s |
| 81 | 69,336–**100,078** /s | 71,732–**103,111** /s | 554,689–**800,622** /s |

At SD81, "everything" reaches **8.6–8.7 M in 180 s** against the registry's
`maxMetric` 10 M. (One SD81 Classic seed already crosses 100,000 /s; see F1.)

- **Recommended:** the multiplier applies to **kill points at all three kill sites**
  (a shot, the rim sweep, and both Purge uses), and **every kill there builds
  it**. Thorn chips, the clear bonuses and the Start Depth bonus are **not
  multiplied**. That is one rule, and it is the kill sites' existing one
  (`points()` on the false → true `dead` edge).
- Alternatives: exclude Purge victims from building it (the combo then "measures
  you", like §14.3's droid attribution), or multiply chips too.

### O5 — does the combo window run during the Dive?

**MEASURED (§1.3):** from the last kill before a clear to the first kill after it,
the median is **4.58–4.83 s**. The Dive is 2.6 s of that, and the next well's
first release waits `spawnInterval()`. So a strict window lapses at every well
change: −0.5 under O3's recommendation, ×1 under a snap.

- **Recommended:** the window's clock **holds while `state.dive.active`** and
  resumes in the next well. The Dive is the breath (P4), and nothing can be killed
  in it. The ring holds too.
- Alternative: strict (−0.5 per well change under O3).

### O6 — Jump's timing rules

GDD §14.2: `JUMP_TIME` 0.9 s airborne ("can rotate, cannot fire"), `JUMP_RECOVERY`
0.2 s "vulnerable on landing", `JUMP_COOLDOWN` 1.4 s "so clearing one leaves you
grounded for the next". It does not say when the cooldown starts, what recovery
forbids, or whether the Purge works airborne.

**MEASURED (arithmetic on `C` at `de53c0d`):** the most of the time a player can
spend airborne is:

| Cooldown counts from | Longest cycle | Airborne share |
|---|---|---|
| takeoff | 1.4 s | **64.3 %** |
| **landing** | 2.3 s | **39.1 %** |
| the end of recovery | 2.5 s | 36.0 % |

A Surger's cycle is 3.08 s at L6, 2.90 s at L13 and 2.78 s at L23 (MEASURED,
`surgeInterval()`).

- **Recommended:**
  - The cooldown counts up from **landing**; `JUMP_RECOVERY` is its first 0.2 s.
  - **During recovery** the craft is on the rim and contact-lethal, and it cannot
    fire or jump. The rim sweep needs fire, so it cannot save a landing on a
    parked rim enemy.
  - **Airborne** the craft rotates at full speed and may Purge.
  - **Takeoff** is the jump input's rising edge. A held button never re-jumps,
    and a death re-latches it, exactly as `killSkimmer()` re-latches the Purge.

### O7 — Jump's three airborne channels

GDD §14.2 ⛔: "the Skimmer lifts visibly off the rim line, casts a bright
drop-shadow onto its lane, and the music high-passes briefly". `CLAUDE.md`
forbids fills.

- **Recommended:**
  - **Lift.** The craft is drawn raised outward from the well's centroid by up
    to `C.JUMP_LIFT` rim radii (⚠ provisional 0.12), on a parabola over
    `JUMP_TIME`. It is draw-time geometry, and the craft's `lane` and depth model
    are untouched.
  - **Shadow.** The craft's own outline is stroked flat on the rim in its lane,
    bright, at `C.JUMP_SHADOW_ALPHA`. It is never filled.
  - **Music.** A high-pass engages at takeoff and releases at landing, for the
    whole airborne time. It is a new optional group in kit-audio
    (**0.3.0 → 0.4.0, MINOR**): `highpass: { hz, tc }` and an idempotent
    `setHighpass(on)`, moved by `setTargetAtTime`, never `.value` after build.
    ⛔ It is a three-file edit (both labs' BLOCK A).
  - **No jump SFX.** GDD §11.8 lists none, and the high-pass is §14.2's audio
    channel.
- Alternative: "briefly" as a short high-pass pulse at takeoff (~0.25 s) rather
  than one held for the whole jump.

### O8 — the Overdrive HUD: combo and Jump readiness

GDD §10.4: "combo (Overdrive) centre-top and loud"; §14.4: "a visible depletion
ring and loss has its own sound"; §16.3: jump cooldown shows "a depleting ring
with no numerals".

**MEASURED (arithmetic from `04-input.js:356` and `C`):** the undrawn top pause
target is a circle at **(640, 84), r 56**, so a centre-top combo sits inside it.
The top of the well's radius is at **y 30**. The touch Jump button is at
**(1196, 636), r 56**, and the Purge glyph is already inset beside it (H3).

- **Recommended:**
  - **Combo.** `×N` (for example `×3.5`) centre-top at `C.HUD_COMBO_SIZE` (⚠
    provisional 56 px), **absent at ×1**. A ring around it depletes over the
    window (full on a kill, empty at a lapse, holding in the Dive).
  - **`comboLost`** (a new `C.SFX` event, from sfx-lab candidates) sounds **once
    per fall**: a lapse step, or a death reset.
  - **Jump readiness.** A small raised-craft glyph left of the Purge glyph:
    bright when ready, dim with a filling ring while cooling, absent while
    airborne.
  - Both are Overdrive only. ⛔ **The Classic HUD's rectangles are unchanged.**

### O9 — MODE's default highlight

GDD §13: "Overdrive is the default highlight; Classic is presented as the purist
option." The menu model puts the cursor on the first enabled row (GDD §10.5).

**MEASURED (§1.6):**
- **Variant A:** OVERDRIVE enabled, CLASSIC still first. **1 file red**:
  `test-cs008-p5.js`, 15 assertions, every one the "OVERDRIVE is locked" claim
  CS012 replaces.
- **Variant B:** OVERDRIVE first. **9 files red**: `test-cs008-p5.js`,
  `test-cs008-p8.js`, `test-cs009-p3.js`, `test-cs009-p6.js`, `test-cs010-p4.js`,
  `test-cs010-p5.js`, `test-cs011-p3.js`, `test-cs011-p5.js` and
  `test-cs011-p6.js`, because every front-door fixture confirms MODE's first
  row.
- Three more stay green but silently play Overdrive: `test-cs010-p2.js:277`,
  `test-cs011-p1.js:172` and `test-cs011-p2.js:164` (PREDICTED, by grep).

- **Recommended: OVERDRIVE first and highlighted**, as GDD §13 says. Each
  front-door fixture is repaired in place to step to CLASSIC and restore its
  precondition (a Classic run), the rule `CLAUDE.md` gives for exactly this. The
  repair is one press per driver.
- Alternative: CLASSIC first, and §13's highlight left to CS016 (onboarding owns
  first-run presentation). That costs one file.

### O10 — how SCORES reaches OVERDRIVE

**MEASURED (§1.6, variant C):** a MODE row first on SCORES turns **2 files red**.
`test-cs011-p3.js` fails 7 assertions, and `test-cs011-p5.js` throws at `:275`
(its VIEW press lands on MODE).

- **Recommended:**
  - **Rows:** MODE (CLASSIC / OVERDRIVE) first, always; then VIEW (only with
    the module); the entries; BACK.
  - **Entry:** SCORES opens on the mode of the last run started this session,
    else MODE's first row, and on LOCAL (as today).
  - **Info lines:** `OVERDRIVE · LOCAL` and `OVERDRIVE · ONLINE`.
  - ONLINE loads the shown mode's board.
- Alternative: a MODE row after VIEW, or VIEW cycling four states.

### O11 — Overdrive's board id, its registry entry, and when

**MEASURED (§1.7):**
- The Worker lists `["orbital-overhaul", "vector-vortex"]`.
- A GET for `vector-vortex-overdrive` answers `INVALID_GAME`, and kit-leaderboard
  treats that as a permanent reject: a submit is dropped, never queued
  (`PERMANENT_REJECT_CODES`).
- `C.GAME_ID` is also kit-storage's `gameId`, the save keyspace
  (`22-meta.js` boot). ⛔ It must not change.

- **Recommended:**
  - **The id:** `vector-vortex-overdrive`, in a new `C.LEADERBOARD_GAME_IDS`
    whose `classic` stays `"vector-vortex"`.
  - **Paul, outside this repo, before P3:** add the entry to coinless-kit's
    `registry.js`, copying `vector-vortex`'s seven `statsFields`, `maxMetric` and
    durations, with `maxMetricPerSecond` **150,000** (O4's kills-only worst,
    103,111 /s, × ~1.5). Then deploy, and name the commit in `STATUS.md`.
  - P3's test pins that commit, as `test-cs011-p5.js` pins `f0b0eb2`.
- If O4 multiplies everything, the bound must be about 1,000,000 /s and
  `maxMetric` must rise (§1.5).

### O12 — the Start Depth record: shared or per mode

**MEASURED by reading:** `progress` is one `{ highestCleared }` per profile, v1
(`22-meta.js:457`). A clear in either mode would extend both modes' START DEPTH
lists, and the Classic list pays Classic's bonus onto Classic's board.

- **Recommended: per mode.**
  - `progress` becomes **v2** `{ classic, overdrive }`, with a `migrate` that
    moves v1's value to `classic` (⛔ `CLAUDE.md`: a shape change bumps the
    version, never the key).
  - `levelRecord(mode)` and `startDepthOptions(mode)` default to `state.mode`.
    START DEPTH reads the mode MODE chose.
  - Closed pins move: `test-cs011-p2.js:127`, `:224–225`, `:258`;
    `test-cs011-p4.js:447`, `:506` (the stored shape; PREDICTED, by grep).
- Alternative: shared, with no migration. Overdrive clears then unlock Classic
  starts, and the reverse.

### O13 — `drive`: tempo, length and tiers

GDD §11.7: "~138 BPM. The flagship." Paul picked 120 for `title` and `pulse`.

- **MEASURED (§1.8):** at 138 BPM `stepDur` is 0.10869565…, not a binary
  fraction, and 36 bars run **62.6 s**. GDD §11.3 measured that such a tempo
  reads a back-to-back note pair as an overlap under an exact comparison.
- **MEASURED:** the closed headroom gate covers only `["pulse", "title"]`
  (`test-cs009-p5.js:574`), so **no closed fixture needs that repair**. The new
  gate for `drive` must compare with a 1e-9 s tie tolerance.
- **MEASURED:** the closed articulation gate (`test-cs010-p3.js`) and node ceiling
  (`test-cs009-p2.js`) loop over every `MUSIC_TRACKS` entry, so they cover
  `drive` unedited.

- **Recommended:**
  - **138 BPM, ≥ 36 bars in A→B→C sections**, struck on every layer, every layer
    a part, the melody in the foundation.
  - **Untiered**, with no `audition` mark, which is the ⚠ SETTLED retreat
    position.
  - A `beat: true` layer (its kick) for the rim pulse.
  - Paul's lab session (PASS marks, tiers, tempo, gains) ports as **its own later
    commit**, as CS009's did. CS012 does not wait for it.
- Alternative: 120 BPM, to match the other two tracks.

### O14 — if the sweep still does not open end to end

GDD §19: "filter sweep audible end to end", ✗ in Classic at 0.668 (CS010).

**MEASURED (§1.4):** a good player keeps intensity lower, not higher. On Classic
boards the sharp bot's director level peaks at **0.381** (2.19 kHz), and the
`tick` tier (0.40) never enters. A modeled combo adds at most `C.INT_W_COMBO`
0.15.
- Under O3's recommendation, the peak is **0.521** (3.54 kHz).
- Under the literal rule, it is **0.529** (3.63 kHz).
- PREDICTED ceiling: CS010's fire-holder 0.668 + 0.15 = **0.818 (9.69 kHz)**.

The weights already sum to 1.00 (MEASURED).

- **Recommended: accept.** P4 and P6 measure the Overdrive maximum on played
  boards. GDD §19 records the number and keeps its ✗. No weight is rescaled (the
  spirit of D6), and no playtest can judge it.
- Alternative: map the sweep to reach 18 kHz at a lower level, or raise
  `INT_W_COMBO`. Either is a retune nobody will hear before ship.

### O15 — does `src/07-enemies.js` split now, and how

**MEASURED (`wc`, a line count at `de53c0d`):** `src/07-enemies.js` is **71,338
bytes, 1,381 lines, 899 of them comment (65 %)**. ROADMAP measured 65.2 KB /
1,277 lines at the CS005 close and 39.1 KB at CS004's. CS012 and CS013 add three
entities.

- **Recommended: yes, as ROADMAP planned.**
  - A new `src/07-enemies-overdrive.js` sits in `MANIFEST` directly after
    `07-enemies.js` and before `08-spawner.js`, which builds classes by name at
    evaluation. It holds the Reaver now, and the Warden and Mimic in CS013.
  - **Nothing moves out of `07-enemies.js`**: the base and the Classic roster
    stay, and its header gains a pointer.
  - The banner scan (`test-cs002-p1.js:404`) picks up the new module with no edit
    (MEASURED by reading: it checks every `src/*.js` both ways).
- Alternatives: no split until CS013; or a full split, with the base `Enemy` in
  its own file.

### O16 — the provisional values

⚠ Every value here is provisional and owned by the art or audio pass, like the
Classic palette.

| Value | Recommended | Why |
|---|---|---|
| The Reaver's silhouette | The Vaulter's X with two swept barbs on its rim-side arms | The family read ("a faster Vaulter"), and a different outline |
| The Reaver's colour | `C.VAULTER_COLOR` (shared) | §14.1 reserves a warm palette for CS013's tokens. The Classic set already uses red, amber, acid green, pale green, violet, pink and pale cyan. The silhouette carries the difference |
| `C.SFX_KILL_PITCH.reaver` | 1.15 (sfx-lab candidate A) | Brighter than the Vaulter's 1 |
| A bench key for the Reaver | **None** | The bench stops at six roster keys (`23-main.js`, H5). Overdrive's START DEPTH 7 shows one |
| `C.COMBO_KILLS_PER_STEP` | 4 | O3 |
| `C.HUD_COMBO_SIZE` | 56 px | `C.MENU_TITLE_SIZE`'s size: "loud" |
| `C.JUMP_LIFT`, `C.JUMP_SHADOW_ALPHA` | 0.12 rim radii, 0.6 | O7 |
| `C.JUMP_HP_HZ`, `C.JUMP_HP_TC` | 700 Hz, 0.03 s | A clear thinning with the tune intact; the tc of a de-click |

### Findings for Paul — not calls

- **F1 — Classic's board can already flag a strong Start Depth 81 start.**
  MEASURED (§1.5): one of three sharp-bot SD81 Classic runs peaks at **100,078 /s**
  against the deployed `maxMetricPerSecond` 100,000. CS011's worst was 86,616 /s,
  measured with the fire-holder. The registry edit O11 asks for could raise
  Classic's bound in the same commit. Outside this repo.
- **F2 — good play keeps the music quiet.** MEASURED (§1.4): the sharp bot's
  Classic intensity peaks at 0.381, where CS010's fire-holder reached 0.668, so
  `tick` (0.40) never enters and the combo is the input that moves a skilled run
  most. This bears on O14.

### ⚠ Readings this plan takes and flags

Each follows from the GDD, a shipped rule or a measurement. ⛔ **If Paul objects
to one, the phase that builds it stops.**

- **R1 — Mode flags are DATA** (GDD §20 #28, "flags in the config, not a fork").
  `C.MODE_FLAGS = { classic: { jump: false, combo: false }, overdrive: { jump:
  true, combo: true } }`, with one reader, `modeHas(name)`, beside the heat
  accessors. The level argument's pattern applies: an optional mode, defaulting
  to `state.mode`. The Reaver goes through the schedule (O2), the track through
  `C.MODE_TRACK`, and the board through `C.LEADERBOARD_GAME_IDS`, so no flag
  exists for those three.
- **R2 — Two `state` bags: `combo` (P4) and `jump` (P5)**, reset by `newState()`,
  as `tally` and `dive` are. `test-registry.js`'s `STATE_FIELDS` gains
  `CS012: ["combo", "jump"]`.
- **R3 — Airborne is a phase on `state.jump`, not a Skimmer depth.**
  - `collideSkimmer()` skips its contact test while airborne; the rim sweep never
    runs there, because fire is refused.
  - `killSkimmer()` is unchanged.
  - The three comments that predicted "Jump gives this pass a second depth to
    compare" (`07-enemies.js`'s base, `09-collision.js`'s header, GDD §4.5 and
    §6.5) are corrected to what shipped.
- **R4 — Jump state resets** on `enterWell()` and on a respawn (ready, grounded).
  **A jump in flight when the well clears lands on the clear step**, so the Dive
  (Classic's thorn-dodge in both modes until CS014) never has an airborne craft.
- **R5 — The director's combo input is the multiplier**, by GDD §11.4's literal
  formula `clamp01(combo / C.INT_COMBO_MAX)`. ×1 reads 0.125, which is **0.0187**
  of intensity (MEASURED, arithmetic). It is 0 in Classic (D6) and 0 in a Dive.
  `19-sfx.js` is unchanged.
- **R6 — The multiplier is applied at the kill sites**,
  `addScore(e.points() * comboMult())`, and never inside `addScore()`. Its
  one-writer rule and the milestones are unchanged. In Classic the factor is
  exactly 1, and `n * 1 === n` in IEEE-754, so Classic scores are bit-identical
  (PREDICTED; P4 asserts it). ⛔ It follows O4: if O4 widens the scope, this
  reading is re-planned, not improvised.
- **R7 — `max_combo` and the `maxCombo` column read `state.combo.peak`**, 0 in
  Classic. `C.TELEMETRY_PLACEHOLDER` is **deleted whole**: its last key is
  gone, and an empty object is dead code. `TELEMETRY_FIELDS` does not move, so
  `telemetry` stays v1 (the row shape is unchanged; MEASURED, 29 columns).
- **R8 — Two kit-leaderboard clients, one per board**, both made on the first call
  that finds the module.
  - `beginRun()` and `submit()` route by the run's mode.
  - `load(mode, done)` fetches the shown mode's board.
  - The title's queued line sums both queues.
  - kit-leaderboard is unedited: two `create()`s are inside its contract, each
    with its own queue key `coinless.lb.<gameId>.v1` (MEASURED by reading).
  - `test-cs011-p5.js:148` and `:163` ("the client is made once") are rewritten
    in place to one client per board. `:165` holds, because the first client is
    Classic's with `C.GAME_ID` (PREDICTED).
- **R9 — The Reaver is `class Reaver extends Vaulter`** in the new module (O15).
  - The Vaulter gains two overridable readers, `hopDuration()` and
    `midClimbDir(well, state)`, and scales its interval accessors by
    `this.hopRate` (1 on a Vaulter). Every existing expression stays textually
    `C.VAULT_CLIMB * climbMult()`, so `test-cs007-p2.js:501`'s five `climbMult()`
    call sites do not move (PREDICTED).
  - A Vaulter's arithmetic is bit-identical: the factor 1 is exact. P2 asserts it
    with the closed hashes.
  - ⛔ **This is not the base-class slope** (GDD §6.5): `Enemy` stays fields
    only. A parameter variant subclassing its parent is what §14.6 describes.
- **R10 — `drive` plays in either mode.** AUTO in Overdrive is `drive`, AUTO in
  Classic is `pulse`, and DRIVE forces it. `C.MUSIC_TRACK_CHOICES` becomes
  `["auto", "pulse", "drive"]`, appended so a stored name still loads (CS011
  stores by name).
- **R11 — `drive` lands BEFORE Overdrive is choosable.** MEASURED (§1.6, variant
  B): with Overdrive reachable and no `C.MODE_TRACK.overdrive`, AUTO resolves to
  `undefined` and play has no gameplay track (`test-cs009-p6.js`: "got undefined,
  want pulse").
- **R12 — The Reaver's kill voice and `comboLost` come from `tools/sfx-lab.html`**
  as candidate A. `C.SFX_KILL_PITCH` and `C.SFX` are the lab's BLOCK SFX, so each
  is a lab edit (⛔ `CLAUDE.md`, Design instruments).
- **R13 — CS012 adds no telemetry column** and no per-kind kill column
  (`21-telemetry.js`'s standing decision).
- **R14 — kit-input is not edited.** The struct already carries `jump` on all four
  devices (MEASURED): keys `["arrowup", "c"]`, pad `[4, 6]`, a bottom-right touch
  button, and JUMP 1 / JUMP 2 on KEYBOARD and GAMEPAD. In Classic nothing reads
  it, and the touch button stays live, inert and undrawn.
- **R15 — The Reaver's soak bound** is `2 × DT / (C.VAULT_HOP_TIME / C.REAVER_HOP_RATE)`
  = **0.1905 lanes per step** (MEASURED, arithmetic), under O1-A. ⛔ Heat never
  scales it (H2).
- **R16 — A Reaver is not cargo.** GDD §6.2's table is complete at three, and the
  Carrier split is untouched.

---

## 1. ⛔ WHAT THIS SESSION MEASURED

### 1.1 MEASURED — the respawn guarantee against a faster Reaver

The probe built `dist/` and evaluated `(1 − C.RIM_CONTACT_DEPTH −
C.RESPAWN_PUSH_DEPTH) / (C.VAULT_CLIMB × m × climbMult(L))` for L = 1..200.
O1's table is its output. The largest multiple that holds at the L99 ceiling is
**×1.0582** (0.1905 depth/s). `climbMult(6)` = 1.0899 and `heatT(6)` = 0.2248.
Throat→rim (the kill band), Vaulter against a ×1.6 climb: L6 **4.84 / 3.03 s**,
L23 **4.43 / 2.77 s**, L99 **3.77 / 2.36 s**.

### 1.2 MEASURED — what already pins the schedule, the kinds and the counts

- **`test-cs007-p3.js`:** `:77` seven rows; `:103` only `level` and `kind`;
  `:121–127` the one-argument set at every level 1..40.
- **`test-cs007-p2.js`:** `:65` `CONTACT_CLIMBS`; `:476` `CLIMBS`; `:501`
  `climbMult()` has exactly 5 call sites.
- **`test-cs004-p5.js:392–407` and `test-cs005-p5.js:403–419`:** the roster is
  derived from `ENEMY_KINDS`' classes minus the bolt, and equals
  `COUNTS.enemies`. `test-cs003-p5.js:217` and `test-cs005-p5.js:407`: the kind
  count equals `COUNTS.enemyKinds`.
- **`test-cs009-p5.js:91`:** every kind builds a voiced entity. **`:83–89`:** the
  seven named classes have kill pitches.
- **`test-cs009-p4.js:109`:** `Object.keys(C.SFX)` equals its 21-event list;
  **`:115`:** `C.SFX_KILL_PITCH`'s keys equal its seven voices; **`:142`:** the lab
  lists no event outside its list.
- **`test-cs009-p3.js:38–39`:** `C.MODE_TRACK` is `{ classic: "pulse" }` and
  `C.MUSIC_TRACK_CHOICES` is `["auto", "pulse"]`, both exactly.
- **`test-cs009-p2.js:183–184`:** the track count equals `COUNTS.tracks`, and the
  names include `title` and `pulse`, so it stays true with `drive` added.
- **`C.TELEMETRY_PLACEHOLDER` is pinned in four closed files:**
  `test-cs007-p4.js:154, :157`; `test-cs008-p3.js:155–156`;
  `test-cs008-p2.js:387–388`; `test-cs011-p5.js:239`.
- **Build counts:** `ENEMY_KINDS` 9, `C.SPAWN_SCHEDULE` 7, `C.SFX` 21,
  `C.SFX_KILL_PITCH` 7, `TELEMETRY_FIELDS` 29, `C.INT_W_*` summing to 1.00.
- **Already in `C` and unread:** `JUMP_TIME` 0.90, `JUMP_RECOVERY` 0.20,
  `JUMP_COOLDOWN` 1.40, `COMBO_WINDOW` 2.50, `COMBO_MAX` 8, `INT_W_COMBO` 0.15,
  `INT_COMBO_MAX` 8, `PTS_REAVER` 300. CS012 reads them all.

### 1.3 MEASURED — kill timing, and what candidate combo rules make of it

**Probe `p2`:** the sharp bot, Start Depths 1, 6, 13 and 23, six seeds each,
300 s cap.

| Start | Sim s | Kills | Clears | Deaths | Gap p50 / p90 | Gaps ≤ 2.5 s | Clear→next kill (median) |
|---|---|---|---|---|---|---|---|
| 1 | 1,800 | 1,778 | 102 | 13 | 0.60 / 1.72 s | 94.4 % | 4.83 s |
| 6 | 1,726 | 1,765 | 97 | 23 | 0.62 / 1.62 s | 94.3 % | 4.82 s |
| 13 | 1,800 | 1,978 | 107 | 22 | 0.60 / 1.48 s | 94.6 % | 4.68 s |
| 23 | 1,800 | 2,234 | 111 | 22 | 0.50 / 1.32 s | 95.1 % | 4.58 s |

**Probe `p3`:** both bots, Start Depths 1, 6, 13 and 23, four seeds each, 240 s cap.
- The sharp bot killed **64.9 per minute** and died 0.76 times per minute, with
  94.8 % of gaps within the window.
- The dull bot killed **60.5 per minute** and died 1.18 times per minute, with
  94.2 % of gaps within the window.

O3's table is its output. Each model scores a kill at the current multiplier and
then raises it. A death resets to ×1 and empties the count. The lapse is judged
on the gap before each kill. Pausing the window in the Dive moved the literal
rule's mean from 7.39 to 7.44 (probe `p2`), a small effect under a decaying
lapse.

### 1.4 MEASURED — the director's level with a modeled combo

**Probe `p4`:** the sharp bot, Start Depths 1, 6, 13 and 23, three seeds each,
240 s cap.
- Each step, `dangerInputs(state, out)` was read off the real board, and `combo`
  was overwritten by a model driven by the kill spy.
- The build's own `createDirector` smoothed it with `C`'s weights, attack and
  release, on simulation time. A Dive fed the zero board, as `audioFrame()` does.

| Combo model | Max level | Sweep at max | Mean | Frames ≥ 0.25 | ≥ 0.40 | ≥ 0.80 |
|---|---|---|---|---|---|---|
| none (Classic today) | 0.381 | 2,190 Hz | 0.130 | 7.1 % | 0.0 % | 0 |
| +0.5 per kill, decay | 0.529 | 3,629 Hz | 0.248 | 49.0 % | 6.3 % | 0 |
| +0.5 per 2, snap | 0.464 | 2,909 Hz | 0.186 | 21.2 % | 0.7 % | 0 |
| +0.5 per 4, decay | 0.521 | 3,535 Hz | 0.204 | 30.2 % | 3.1 % | 0 |

⚠ The model has no Reavers and no Jump, which both change the board. P4 and P6
re-measure on the real thing.

### 1.5 MEASURED — score rate by the multiplier's scope

**Probe `p5`:** the sharp bot, Start Depths 1, 23, 49 and 81, three seeds each,
180 s cap.
- `addScore` was spied: a call on a step where `state.tally.kills` had just
  risen was kill points, and anything else was bonuses and chips.
- The rates are `score / Math.round(state.time)` from 5 s on (the Worker's
  `minDurationS`).
- Kill points per 180 s run: 18,300–22,050 at SD1 and 46,350–56,300 at SD81.
  Everything else: ~18,200 at SD1 and ~1,030,000 at SD81.

O4's table is the worst rate. For comparison, CS011 plan §1.5 measured 57,780–86,616 /s at SD81
with the fire-holder (`archive/`).

### 1.6 MEASURED — the front door: three variant builds

Shared clones of `de53c0d`, one edit each to `src/23-main.js`.
- **A** and **B** ran `node scratchpad/run-all.js`.
- **C** ran `node scratchpad/run-all.js --only test-cs011`.

| Variant | The edit | Red |
|---|---|---|
| A | OVERDRIVE `enabled: true`, `pickOverdrive` → `pendingMode = "overdrive"`; CLASSIC stays row 0 | **1/60**: `test-cs008-p5.js` 15/310 ("rotating toward OVERDRIVE leaves CLASSIC highlighted", "in CLASSIC", "and the mode" ×4 devices; "drawn in the locked colour"; "three taps … leave the cursor on CLASSIC"; "the run that follows is CLASSIC") |
| B | as A, with OVERDRIVE as row 0 | **9/60**: `test-cs008-p5.js` 6; `test-cs008-p8.js` 20+ ("starts a CLASSIC run"); `test-cs009-p3.js` throws at `:219`; `test-cs009-p6.js` 3 (incl. "got undefined, want pulse"); `test-cs010-p4.js` 4; `test-cs010-p5.js` 5; `test-cs011-p3.js` 13; `test-cs011-p5.js` 4; `test-cs011-p6.js` 6 |
| C | SCORES gains a first row MODE / CLASSIC | **2/6**: `test-cs011-p3.js` 7/83; `test-cs011-p5.js` throws at `:275` |

### 1.7 MEASURED — the boards

- **`GET https://scores.coinlessgames.com/v1/health`** →
  `{"ok":true,"games":["orbital-overhaul","vector-vortex"]}`.
- **`GET /v1/scores?game=vector-vortex-overdrive&window=all&limit=1`** →
  `{"error":{"code":"INVALID_GAME","message":"Unknown or missing game"}}`.
- **kit-leaderboard 0.2.1:** `INVALID_GAME` is in `PERMANENT_REJECT_CODES`, so a
  submit to an unregistered id is `rejected` and never queued. Each `create()`
  builds its own queue at `coinless.lb.<gameId>.v1`, flushes it once, and adds
  one `online` listener. `fetchBoard` sends the instance's `gameId`.
- **coinless-kit `e9a4c2c` `registry.js`:** `vector-vortex` has
  `maxMetricPerSecond` 100,000, `maxMetric` 10,000,000, durations 5–86,400 s, and
  the seven `statsFields`. Stats values are not type-checked; only unknown keys
  flag (`validate.js:55`).
- **`22-meta.js`:** one client, `gameId: C.GAME_ID` (`:115`); the payload's
  `max_combo` is `C.TELEMETRY_PLACEHOLDER.maxCombo` (`:141`); `KitStorage.create({
  gameId: C.GAME_ID })` (`:325–326`). `createScores` already keeps `overdrive`
  apart (`:338`).
- **`test-cs011-p5.js`:** `:148` and `:163` assert one `create()`; `:165` asserts
  `cfg.gameId === C.GAME_ID`; `:179` reads `REG[C.GAME_ID].statsFields`;
  `readRegistry()` shows `f0b0eb2`.

### 1.8 MEASURED — `drive`'s arithmetic and the gates that already cover a track

- **`stepDur = 60 / BPM / 4`.** Binary fractions: 120 (0.125), 128 (0.1171875),
  160. Not binary: 132, 136, **138** (0.10869565217391304), 140, 144, 150. 36
  bars at 138 BPM is 62.6 s.
- **music-lab's `TEMPO_LADDER`** is `[60 … 120, 126, 132, 138, 144, 152, 160, 168,
  176]` (`tools/music-lab.html:1164`), so 138 is on it.
- **Closed gates that loop every track:** the articulation rule
  (`test-cs010-p3.js`), rows, frequencies and the node ceiling
  (`test-cs009-p2.js`, `C.MUSIC_STEP_NODE_MAX` 16). **Closed gates that do not:**
  the headroom gate (`test-cs009-p5.js:574`, `["pulse", "title"]`) and pulse's
  36-bar check (`test-cs009-p2.js`, by name).
- **Both labs carry `17-audio-tracks.js` as BLOCK B, by text identity**
  (`test-cs009-p2.js`, `test-cs009-p4.js`, `test-cs010-p3.js`,
  `test-cs010-p4.js`). An edit to it is a three-file edit.

### 1.9 MEASURED — sizes and surfaces

- **`CLAUDE.md`** 34,068 bytes (ceiling 50 KB); **`STATUS.md`** 23,065.
- **`musicStateFor(screen, optionsFrom, mode, trackSetting)`** already resolves
  AUTO through `C.MODE_TRACK[mode]` (`19-sfx.js`).
- **`dangerInputs()`** already writes `out.combo = 0` (`23-main.js:338`), and the director already
  weights `combo` (`23-main.js`, `19-sfx.js`).
- **`CONTROL_ACTIONS`** already lists `jump` (`23-main.js:628`).
- **The HUD view** carries `score`, `lives`, `level`, `levelColor`, `purgeUses`,
  `mirror` and `icon` (`15-render-hud.js`).
- **The kill sites** are `09-collision.js`: `collideShots` `:113`,
  `collideSkimmer` `:219`, and `updatePurge` `:386` and `:399`. Each runs
  `state.tally.kills++; addScore(e.points()); sfx("kill", e.sfxVoice)`.
- **Timers already in `C`:** `DIVE_TIME_OD` and `DIVE_RINGS_MAX` (CS014),
  `MAX_TOKENS`, `TOKEN_LIFE`, `TOKEN_HOVER_DEPTH` (CS013). CS012 reads none of
  them.

---

## 2. THE SHAPE

Six phases, one session each. ⚠ Six is one past ROADMAP's guideline, as CS009
and CS011 were.

| Phase | Builds | Depends on |
|---|---|---|
| **P1** | `drive`: composed in music-lab, ported verbatim; `C.MODE_TRACK.overdrive`; MUSIC TRACK gains DRIVE | O13 |
| **P2** | The mode flags table; the Reaver in the new module; Overdrive's schedule | O1, O2, O15, O16 |
| **P3** | Overdrive at the front door and on its own board: MODE, the second board id, SCORES' OVERDRIVE view, the Start Depth record per mode | O9–O12; Paul's registry commit |
| **P4** | The combo: scoring, the HUD, `comboLost`, the director's combo input, `max_combo`'s real source | O3–O5, O8, O16 |
| **P5** | Jump: the rules, airborne immunity, the lift and shadow, kit-audio 0.4.0's high-pass, the HUD glyph | O6–O8, O16 |
| **P6** | The tenth soak, the Overdrive intensity re-measure, the review, the close | O14 |

**Why the seams fall here.**
- **P1 first, because an Overdrive run with no track has no music** (R11,
  MEASURED). `drive` is pure data and a lab, so it goes first and alone.
- **P2 builds the Reaver before Overdrive is choosable.** It is reachable through
  `startGame(seed, { mode: "overdrive" })`, as CS008 P3 built the mode parameter
  before its screen. That keeps an enemy's contract and the front door's fixture
  repairs in different sessions.
- **P3 makes Overdrive choosable and gives its runs a board in the same commit.**
  Split, an Overdrive run would post to Classic's board, the STATUS hazard
  CS011 left.
- **P4 before P5.** The combo touches scoring, meta, the HUD and the director.
  Jump touches collision, the renderer, kit-audio and the HUD. They share only
  `hudLayout()`, and the combo places its rectangle first.
- **P6 needs every system** for its paired sessions.

---

## 3. P1 — `drive`

- **`17-audio-tracks.js`:** `buildDriveTrack()` and `MUSIC_TRACKS.drive`,
  composed in `tools/music-lab.html` at O13's answer (recommended: 138 BPM,
  `bar: 16`, ≥ 36 bars in A→B→C).
  - Struck on every layer (GDD §11.3's table, ⚠ SETTLED).
  - Every layer written as a part; the melody in the foundation.
  - No `tier` and no `audition`. One kick-like layer carries `beat: true`.
  - ≤ `C.MUSIC_STEP_NODE_MAX` nodes on its worst step.
  - The file reads no game global.
- ⛔ **Ported verbatim.** Both labs' BLOCK B are the new file, character for
  character. music-lab lists the track, and its ladder offers the tempo.
- **`00-config.js`:** `MODE_TRACK: { classic: "pulse", overdrive: "drive" }`,
  and `MUSIC_TRACK_CHOICES: ["auto", "pulse", "drive"]` (R10).
- **`scratchpad/test-registry.js`:** `tracks: 3`.
- **`scratchpad/test-cs012-p1.js`:**
  - `drive` has ≥ 36 bars and three sections.
  - Its tempo is O13's answer.
  - ⛔ **The D16 limiter-curve headroom gate holds on `drive`**, with a 1e-9 s
    tie tolerance (§1.8), against the tone's 0.450, with a mutation that doubles
    one layer's gain turning it red.
  - `musicStateFor("play", "title", "overdrive", "auto") === "drive"`, and DRIVE
    forces `drive` in Classic.
  - The MUSIC TRACK row cycles AUTO / PULSE / DRIVE and saves by name.
  - A stored `"drive"` reloads.
  - The closed articulation and node gates are green on `drive` (they loop).
- **Closed edit:** `test-cs009-p3.js:38–39` is rewritten to the three-choice
  literals.
- **Docs:** GDD §11.3, §11.7, §19 (Audio: flagship length); `CLAUDE.md` Audio if
  a rule moves; `SKIPPED-PLAYTESTS.md` (`drive` by ear, and its solo audition,
  which is Paul's lab work and not a playtest).

## 4. P2 — the mode flags, the Reaver and Overdrive's schedule

- **`00-config.js`:**
  - `C.MODE_FLAGS` and `modeHas(name, mode)` (R1).
  - `C.SPAWN_SCHEDULE_OVERDRIVE: [{ level: 6, kind: "reaver" }]` (O2-A).
  - A Reaver group: `REAVER_HOP_RATE` 1.6 (O1-A), `REAVER_SIZE`, the silhouette
    constants, `REAVER_COLOR` per O16.
  - `SFX_KILL_PITCH.reaver` from sfx-lab (R12).
- **`08-spawner.js`:** `eligibleKinds(level, mode)` merges in level order, Classic
  first at an equal level, with `mode` defaulting to `"classic"`.
  `pickSpawnKind(state)` passes `state.mode`, and its name does not change (⛔
  `CLAUDE.md`). An `ENEMY_KINDS.reaver` row is added.
- **`07-enemies.js`:** the Vaulter's two overridable readers and `hopRate` (R9).
  ⛔ Every existing expression stays textually as it is.
- **`src/07-enemies-overdrive.js` (new; O15):** `class Reaver extends Vaulter`,
  with the contract in §9. `build.js`'s `MANIFEST` lists it after
  `07-enemies.js`.
- **`14-render-entities.js`:** `REAVER_POLY` and `drawReaver()`, through
  `entityPoints` + `drawPoly` + `glowStroke`, with no fill.
- **`scratchpad/test-registry.js`:** `enemies: 7`, `enemyKinds: 10`.
- **`scratchpad/test-cs012-p2.js`:**
  - ⛔ The eight fields, `points()` and `onShot()` (§9).
  - The Overdrive set at every level 1..40, and the Classic set unchanged with and
    without the mode argument.
  - The no-draw rule at Overdrive L1–2, counted.
  - Mid-climb hops always toward the Skimmer, holding in its lane.
  - Hop time and intervals ÷ `REAVER_HOP_RATE`, with no heat on the hop (H2).
  - ⛔ **The respawn guarantee with Reavers**: a Reaver pushed to 0.55 does not
    reach the band inside `RESPAWN_INVULN` at L6, L23 and L99, staged through the
    real `respawnSkimmer()`.
  - ⛔ **§17 item 3:** no Reaver lane leaves `[0, lanes−1]` on the six open wells,
    5,000 steps each, with the per-step bound R15.
  - ⛔ **§17 item 13 for the Reaver:** 24/24 kills over 0..23 ticks of pre-fire,
    hopping in and climbing in, on a closed and an open well.
  - The Purge kills it, and the Dive never holds one.
  - ⛔ **Classic never sees one:** a Classic run at Start Depth 7 hashes
    identically to the same run built with `mutate` removing the `reaver` rows.
- **Closed edit:** `test-cs009-p4.js:115`'s voice list and the lab's pitch row.
- **Docs:**
  - GDD §6.4, §6.5 (the roster of voices), §8.1 (Overdrive's schedule), §14.6,
    §16.4.
  - `CLAUDE.md`: the schedule invariant reworded to "the level and the run's
    mode"; the code map; "New enemies wire into seven places" names the new
    module.
  - `SKIPPED-PLAYTESTS.md`: the Reaver's readability against the Vaulter.

## 5. P3 — Overdrive at the front door, and its own board

⛔ **Precondition: Paul's O11 registry commit is named in `STATUS.md`.** Without
it, P3's registry assertion skips loudly, and P6 cannot close with a skip.

- **MODE (O9):** OVERDRIVE enabled with `pickOverdrive`, in O9's order, carried
  as `pendingMode`. START DEPTH reads the chosen mode's record (O12).
- **`C.LEADERBOARD_GAME_IDS`** (O11). `Leaderboard` holds one client per mode
  (R8); `beginRun()` and `submit()` route by `state.mode`, `load(mode, done)`, and
  `queueLength()` sums both. `C.GAME_ID` is unchanged.
- **SCORES (O10):** the MODE row, the entry mode, `OVERDRIVE · LOCAL` /
  `· ONLINE`, `Meta.scores(mode)`, and ONLINE per mode. ⛔ The rows are rebuilt
  on entry, on MODE, on VIEW and when a board answers, never in `draw()`.
- **`progress` v2 (O12)**, with `migrate`; `levelRecord(mode)` and
  `startDepthOptions(mode)`.
- **`scratchpad/test-cs012-p3.js`:**
  - OVERDRIVE is choosable on all four devices, and a run starts in it.
  - An Overdrive run submits once, to the Overdrive client, with the seven keys
    read from coinless-kit's `registry.js` **at Paul's commit** for
    `vector-vortex-overdrive`. A Classic run submits only to Classic's.
  - A bench run submits to neither.
  - Local rows land per mode.
  - SCORES shows both modes, both views, and a stale answer dropped per mode.
  - The queued line sums both.
  - The record migrates v1 → v2, is per mode across a reload, and a per-mode clear
    extends only its own list.
  - ⛔ Meta still writes no `state` (hash around every call).
- **Closed edits** (§11): `test-cs008-p5.js` (15); O9's eight fixture repairs;
  `test-cs011-p3.js` and `test-cs011-p5.js` (SCORES, and `:148`, `:163`);
  `test-cs011-p2.js` and `test-cs011-p4.js` (the record's shape).
- **Docs:**
  - GDD §4.6, §10.5 (MODE, SCORES), §13 (the table's board row), §15.3, §15.4,
    §19 (Meta).
  - `CLAUDE.md`: Leaderboard; Save data (`progress` v2); the rule that
    `C.GAME_ID` is the save keyspace.
  - `EXTERNAL-FILES.md` (two clients); `lib/kit-leaderboard/kit-leaderboard.NOTES.md`
    (usage only; no version bump); `src/22-meta.NOTES.md`.
  - `SKIPPED-PLAYTESTS.md`: MODE's highlight and the SCORES layout.

## 6. P4 — the combo

- **`12-scoring.js`:**
  - `state.combo` `{ mult, kills, since, peak }`, with `since` counting up (GDD
    §16.3).
  - Top-level `comboKill(state)`, `comboDeath(state)`, `updateCombo(state, dt)`
    and `comboMult()`, each a no-op or 1 unless `modeHas("combo")`.
  - The rules are O3's answer; the Dive hold is O5's.
- **`09-collision.js`:** the four kill-site lines gain `* comboMult()` and
  `comboKill(state)`, in O4's scope (R6). `killSkimmer()` calls `comboDeath`.
  ⛔ The Purge still never calls `onShot()`.
- **`23-main.js`:**
  - `updateCombo` runs in the step, beside the invulnerability clock, and holds in
    a Dive.
  - `dangerInputs` reads the multiplier (R5).
  - The HUD view gains `combo`, `comboFill` and `mode`.
- **`15-render-hud.js`:** `hudLayout()`'s combo rectangle and ring (O8). ⛔ Classic
  rectangles are unchanged; `drawText()` and strokes only.
- **`C.SFX.comboLost`** from sfx-lab, sounding at the fall (O8).
- **`max_combo` and `maxCombo` read `state.combo.peak`** (R7).
  `C.TELEMETRY_PLACEHOLDER` is deleted, with `21-telemetry.js`'s `P` and its
  header.
- **`scratchpad/test-registry.js`:** `STATE_FIELDS.CS012: ["combo"]`.
- **`scratchpad/test-cs012-p4.js`:**
  - The build, lapse, death and Dive rules, staged step by step.
  - The multiplier is always in {1, 1.5, … 8}.
  - ⛔ **GDD §17 item 8 in Overdrive:** on played Overdrive boards (L1–23), every
    step's score delta equals that step's events at that step's multiplier, per
    O4. It is mutation-checked: multiplying a chip is red.
  - ⛔ **Classic is untouched:** a Classic session's hash matches the same session
    built with the combo calls mutated out of each kill site (`buildGame({ mutate })`,
    one unique string per site).
  - `dangerInputs().combo` is in [0, 1], 0 in Classic and 0 in a Dive.
  - The HUD rectangle clears the throat zone on all sixteen wells (GDD §10.3).
  - `comboLost` fires once per fall.
  - The stats and the column read the peak.
  - **The first Overdrive intensity measurement** on played boards, recorded in
    `log/CS012.md`.
- **Closed edits:** the placeholder pins (§11); `test-cs009-p4.js`' event list,
  `:109` and `:142`, and the lab's new row.
- **Docs:**
  - GDD §7, §10.4, §11.4, §11.8, §14.4, §15.4, §15.6.
  - `CLAUDE.md` Scoring: the multiplier is applied at the kill sites and is not
    a bypass.
  - `SKIPPED-PLAYTESTS.md`: combo feel, the HUD's loudness, `comboLost`.

## 7. P5 — Jump

- **`05-skimmer.js`:** `state.jump` `{ phase: "ground" | "air" | "recover", t,
  cool, latched }` and top-level `updateJump(state, dt)`, a no-op unless
  `modeHas("jump")`. It follows O6's rules: a rising-edge takeoff, `t` counting
  up, and the cooldown from O6's start. The lift and shadow (O7) are in the
  craft's draw; `skimmerPoints` takes a lift.
- **`06-shots.js`:** no shot while airborne, or while recovering if O6 says so.
- **`09-collision.js`:** `collideSkimmer()` skips while airborne (R3), and
  `killSkimmer()` re-latches `jump` (O6).
- **`23-main.js` / `11-dive.js`:** resets on `enterWell()` and respawn, and a
  jump lands on the clear step (R4). `audioFrame()` calls
  `MusicSys.setHighpass(airborne)` every frame. ⛔ Its body may not contain
  "draw", and `19-sfx.js` may not name `state`, so the airborne flag is read in
  `23-main.js`.
- **`16-audio-engine.js` (kit-audio 0.4.0, MINOR):** the optional `highpass`
  group, a Butterworth high-pass after the sweep and before the limiter, and
  `setHighpass(on)`.
  - ⛔ It lands in both labs' BLOCK A, with a `16-audio-engine.NOTES.md` entry.
  - `19-sfx.js` passes `C.JUMP_HP_HZ` / `C.JUMP_HP_TC`.
- **`15-render-hud.js`:** the jump glyph and its ring (O8).
- **`scratchpad/test-registry.js`:** `STATE_FIELDS.CS012` gains `"jump"`.
- **`scratchpad/test-cs012-p5.js`:**
  - ⛔ **Airborne immunity against every contact killer**: a Vaulter, a Carrier,
    a bolt, a Drifter, a Reaver, and a Surger's discharge. It is mutation-checked:
    removing the skip is red.
  - No shot airborne.
  - The O6 timings, to the step: recovery lethal, the cooldown, edge-only
    takeoff, the re-latch across a death.
  - A jump landing on the clear step.
  - ⛔ **Classic ignores the jump input:** a Classic session with the jump key
    pressed every 50 steps hashes identically to one without.
  - kit-audio: the high-pass engages and releases by ramps only, with no bare
    `.value` after build. The node is at or under unity (a Butterworth, no peak),
    so D16's headroom model holds unedited.
  - The lift is draw-only: the craft's `lane` and the hash are identical with the
    lift constant at 0.
  - The glyph rectangle clears the throat and touch buttons, mirrored and not.
- **Docs:**
  - GDD §4.5, §6.5 (R3's correction), §9.3, §10.4, §11.1, §11.6, §14.2.
  - `CLAUDE.md`: Math and lifecycle (airborne), and Audio (the high-pass group).
  - `SKIPPED-PLAYTESTS.md`: the three airborne channels and the high-pass by
    ear.

## 8. P6 — the tenth soak, the re-measure, the close

**`scratchpad/test-cs012-p6.js` is the tenth soak** (⛔ `STATUS.md`: a new file,
never a closed one widened). It proves three things on three boards.

1. **Classic is untouched by Overdrive.** One front-door Classic session
   (Start Depths 1 / 13 / 23, RESTART, QUIT, a pause) is played twice: once as
   is, and once with the jump key pressed on a fixed schedule and every Overdrive
   entry point stubbed (`{ stub: ["updateCombo", "updateJump", "comboKill",
   "comboDeath"] }`). ⛔ **The state hash is identical on every frame.**
2. **The music cannot steer Overdrive.** One front-door **Overdrive** session is
   played twice, audio on and audio off: MODE → OVERDRIVE → START DEPTH 1 / 7 /
   13, with scripted jumps, a Purge, a Dive, RESTART and a pause. ⛔ **The hash is
   identical on every frame.** On the audio-on session:
   - `drive` is scheduled, and every tier and sweep call is in [0, 1].
   - The high-pass automation happens only on takeoff and landing frames.
   - **The director's maximum and the sweep's Hz at it are recorded and asserted
     against O14's answer.**
3. **The Overdrive invariants hold on a played board, every step:**
   - The multiplier is on its half-step lattice, and `peak` is non-decreasing.
   - The score delta equals the events at the multiplier (O4).
   - No contact death while airborne, and no shot while airborne.
   - Takeoffs respect the cooldown.
   - Reavers appear only at level ≥ 6 and only in Overdrive.
   - Reaver lanes stay in range on open wells.
   - No NaN, and bounded arrays.
   - An Overdrive run end submits once to the Overdrive fake, and a Classic end
     to Classic's.
   - A reload brings back per-mode tables and records.

**The close:**
- **Zero skips.**
- **The review:** read every phase's `log/CS012.md` entry together and reconcile
  them.
- **The baseline ledger and acceptance criteria:** measure every row of §10 and
  §12.
- **`log/CS012.md`:** version history.
- **`STATUS.md`:** compress and reset for CS013.
- **`ROADMAP.md`:** the CS012 row and narrative.
- **GDD §19:** the Overdrive and Audio verdicts.
- **`SKIPPED-PLAYTESTS.md`**, then move both plan docs to `archive/`.

---

## 9. ⛔ THE REAVER'S CONTRACT AND WIRING (GDD §6.5)

**The eight fields, `points()` and `onShot()`,** under O1-A and O16's
recommendation:

| Field | Value | Why |
|---|---|---|
| `lane`, `depth` | a position, lane-centre units | The Vaulter's (GDD §3.2) |
| `dead` | set true to kill | The contract |
| `purgeable` | **true** | GDD §4.3 exempts only the Thorn |
| `blocksClear` | **true** | It is a threat. It cannot be on the board at a clear, so it is never a Dive survivor |
| `killDepth` | **`1 − C.RIM_CONTACT_DEPTH`** | GDD §4.5 item 1, the shared expression; ⛔ never mutated |
| `anchored` | **false** | `depth` is a position, so `respawnSkimmer()` clamps it to 0.55. The guarantee holds under O1-A |
| `sfxVoice` | **`"reaver"`** | `C.SFX_KILL_PITCH.reaver` (O16, R12) |
| `points()` | **`C.PTS_REAVER`** (300) | GDD §7; × the multiplier at the kill site (O4, R6) |
| `onShot(shot)` | dies, consumes: **true** | The Vaulter's. The rim sweep kills it the same way |

**The wiring points:**

| Point | What the Reaver needs | Where |
|---|---|---|
| 1. `startGame` reset | nothing: `newState()`'s `enemies: []` | — |
| 2. `update()` entity pass | nothing: the generic loop | — |
| 3. collision pass | nothing: `killDepth` and `onShot` | — |
| 4. cleanup filter | nothing: the generic filter | — |
| 5. `draw()` z-order | `draw()` → `drawReaver()` | `14-render-entities.js` |
| 6. well-clear | nothing: `blocksClear: true` | — |
| 7. the Dive | nothing: never on the board at `startDive()`. ⛔ Not the seventh-point case (§6.5: `blocksClear: false` and not anchored) | — |
| Purge | destroys it (`purgeable`) | — |
| `sfxVoice` | `"reaver"`, and a pitch | `00-config.js` via sfx-lab |
| the one way in | `ENEMY_KINDS.reaver`; `C.SPAWN_SCHEDULE_OVERDRIVE` L6 | `08-spawner.js`, `00-config.js` |

**Also read, all generic and unedited:** `threatCount()`, `laneCrowded()`,
`dangerInputs()` (counted), `buildLaneState()` (occupied), `telemetryRow()`
(counted), and the safe-spawn rule in `spawnEnemy()`.

**Not the Reaver's:** Carrier cargo (R16), and a debug bench key (O16).

---

## 10. ⛔ THE BASELINE LEDGER

| Baseline | At `de53c0d` (MEASURED) | CS012 (PREDICTED) |
|---|---|---|
| `test-cs006-p2.js:522` `P1_DETERMINISM_HASH` | **1229033515** | ⛔ **Unmoved P1–P6.** Every new behaviour is gated on the mode, combo and Jump spend no draw, and its run is Classic. A move is a defect |
| `test-cs004-p1.js:301` `GOLDEN_LANES` | `[10,10,12,0,8,14,12,12,8,14,10,0,7,7,12,3,2,5]` | ⛔ **Unmoved** (Classic, levels 1–2) |
| The nine closed soaks' paired hashes | green | ⛔ **Unmoved** (Classic sessions; O9's repairs restore Classic) |
| `COUNTS.tracks` | 2 | **3** at P1 |
| `COUNTS.enemies` | 6 | **7** at P2 |
| `COUNTS.enemyKinds` | 9 | **10** at P2 |
| `COUNTS.wells` / `openWells` | 16 / 6 | unmoved |
| `STATE_FIELDS` | CS002–CS008 | **+ `CS012: ["combo", "jump"]`**, P4 and P5 |
| `C.SPAWN_SCHEDULE` | 7 rows, `level` + `kind` | unmoved (O2-A) |
| `C.SPAWN_SCHEDULE_OVERDRIVE` | absent | 1 row at P2 |
| `C.SFX` events / `C.SFX_KILL_PITCH` voices | 21 / 7 | **22** at P4 / **8** at P2 |
| `C.MODE_TRACK` / `C.MUSIC_TRACK_CHOICES` | `{ classic }` / `[auto, pulse]` | + `overdrive: "drive"` / + `"drive"`, P1 |
| `C.TELEMETRY_PLACEHOLDER` | `{ maxCombo: 0 }` | **deleted** at P4 |
| `TELEMETRY_FIELDS` / `telemetry` version | 29 / 1 | unmoved |
| `progress` version | 1 | **2** at P3 (if O12 per mode) |
| `settings`, `scores` versions | 1, 1 | unmoved |
| `climbMult()` call sites (`test-cs007-p2.js:501`) | 5 | unmoved (O1-A, R9) |
| kit-audio (`16-audio-engine.js`) | 0.3.0 | **0.4.0** at P5 |
| kit-input / kit-menu / kit-leaderboard | 0.8.0 / 0.1.0 / 0.2.1 | unmoved |
| `MANIFEST` | 24 modules + 3 inlined | **25** at P2 |
| The suite | 60 files, 0 skips, 85.3 s | **66 files**, 0 skips at the close |
| `CLAUDE.md` | 34,068 bytes | < 50 KB |

---

## 11. ⛔ CLOSED-FILE EDITS, PREDICTED AND MEASURED

Every edit rewrites an assertion or restores a fixture's precondition in place (⛔
`CLAUDE.md`, Test rules). None deletes or weakens one.

| Phase | File | What | Basis |
|---|---|---|---|
| P1 | `test-cs009-p3.js:38–39` | the `MODE_TRACK` and `MUSIC_TRACK_CHOICES` literals, with `drive` | PREDICTED (read) |
| P2 | `test-cs009-p4.js:115` | the kill-pitch voice list gains `reaver` | PREDICTED (read) |
| P3 | `test-cs008-p5.js` (15 assertions) | "OVERDRIVE is locked" → OVERDRIVE is choosable, in O9's order | **MEASURED** (§1.6 A) |
| P3, O9-A | `test-cs008-p8.js`, `test-cs009-p3.js`, `test-cs009-p6.js`, `test-cs010-p4.js`, `test-cs010-p5.js`, `test-cs011-p3.js`, `test-cs011-p5.js`, `test-cs011-p6.js` | each front-door driver steps to CLASSIC before confirming | **MEASURED** (§1.6 B) |
| P3, O9-A | `test-cs010-p2.js:277`, `test-cs011-p1.js:172`, `test-cs011-p2.js:164` | the same repair on three that stay green but would play Overdrive | PREDICTED (grep) |
| P3, O10 | `test-cs011-p3.js` (7), `test-cs011-p5.js` from `:261` | SCORES' rows gain MODE | **MEASURED** (§1.6 C) |
| P3 | `test-cs011-p5.js:148`, `:163` | one client → one per board (R8) | PREDICTED (read) |
| P3, O12 | `test-cs011-p2.js:127`, `:224–225`, `:258`; `test-cs011-p4.js:447`, `:506` | `progress` v1's shape → v2 | PREDICTED (grep) |
| P4 | `test-cs007-p4.js:154`, `:157`; `test-cs008-p3.js:155–156`; `test-cs008-p2.js:387–388`; `test-cs011-p5.js:239` | the placeholder → `state.combo.peak` | PREDICTED (grep) |
| P4 | `test-cs009-p4.js:32`, `:109`, `:142` | `comboLost` joins the event list | PREDICTED (read) |
| — | `test-cs007-p2.js`, `test-cs007-p3.js` | **none** under O1-A, O2-A and R9 | PREDICTED (read `:65`, `:501`, `:77`, `:103`) |
| — | `test-cs009-p5.js` | **none**: its headroom gate names `pulse` and `title` only | MEASURED (read `:574`) |

⛔ **An edit not in this table is a finding.** The phase stops, records it in
`STATUS.md`, and states its cause at the assertion.

---

## 12. ⛔ ACCEPTANCE CRITERIA

GDD §19's rows that CS012 owns, and what closes each.

- **Overdrive — Jump with cooldown and an unmistakable airborne state on three
  channels.** Closed when the rules, immunity, lift, shadow and high-pass are
  asserted headless (P5, P6). "Unmistakable" is a skipped playtest.
- **Overdrive — combo builds, decays, displays, feeds the director.** Closed when
  all four are asserted (P4) and played (P6).
- **Overdrive — Reaver correct.** Closed when the contract, schedule, hop, hunt,
  respawn guarantee, wall bound and rim arrival are asserted (P2) and played
  (P6).
- **Audio — flagship tracks ≥ 36 bars.** ◐ → ✅ when `drive` has ≥ 36 bars in
  A→B→C (P1).
- **Audio — filter sweep audible end to end.** Re-measured on Overdrive (P4, P6)
  and recorded per O14.
- **Audio — every gated layer passes the solo audition.** Unchanged, because
  `drive` ships untiered (O13).
- **Audio — the Surger tone over music at every tier.** The proxy extends to
  `drive` (P1). "By ear" is a skipped playtest.
- **Meta — local top 10 per mode.** ◐ → ✅ when SCORES shows OVERDRIVE (P3).
- **Meta — separate online boards.** ✗ → ✅ when Overdrive posts to its own
  registered id (P3), given Paul's O11 commit.
- **Quality:**
  - No Atari terminology (the closed scan).
  - Plays from `file://`.
  - Nothing opaque below depth 0.25: the combo and jump glyphs are asserted
    against the throat zone.
  - The concat build is the oracle.
  - ⛔ Zero skips at the close.

---

## 13. ⛔ WHAT CS012 DOES NOT DO

- **Powerups, tokens, the Warden and the Mimic** (CS013). `C.MAX_TOKENS`,
  `TOKEN_*` and `PTS_WARDEN` / `PTS_MIMIC` stay unread.
- **The ring-flight Dive** (CS014). Overdrive dives with the Classic thorn-dodge,
  and `C.DIVE_TIME_OD` / `DIVE_RINGS_MAX` stay unread.
- **Achievements** (CS015), and **first-run presentation or attract mode** (CS016).
- **Tier any `drive` layer, or move its gains or tempo, before Paul's lab marks**
  (O13). That port is its own commit.
- **Rescale an intensity weight** (O14, unless answered otherwise).
- **Change heat, the concurrency ladder or any Classic constant for Overdrive.**
  Overdrive's difficulty differs only by its roster.
- **Add a telemetry column** (R13), **a bench key** (O16), or a time-window switch
  on ONLINE.
- **Edit kit-input, kit-menu or kit-leaderboard** (R8, R14).
- **Deploy or edit the Worker.** O11's registry entry is Paul's, outside this repo.
- **Draw the touch buttons, give the Dive a visual, fix the pad-only silence, feed
  the VOICE bus, or the Surger tone's 1.106 peak.** All still unowned.
- **Backport** any kit module to coinless-kit.

---

## 14. RISKS

- **K1 — a Reaver faster than ×1.058 on the climb breaks the respawn
  guarantee.** MEASURED (§1.1). O1 decides, and P2 asserts it.
- **K2 — Overdrive without `drive` has no gameplay music.** MEASURED (§1.6 B).
  Mitigated by P1 landing first (R11).
- **K3 — an Overdrive submit before registration is dropped, not queued.**
  MEASURED (§1.7). P3's precondition (O11).
- **K4 — the combo numbers come from bots.** Their kill cadence is 60–65 per
  minute with ~95 % of gaps inside the window. A human's may differ (PREDICTED).
  `C.COMBO_KILLS_PER_STEP` is ⚠ provisional, and the ask goes to
  `SKIPPED-PLAYTESTS.md`.
- **K5 — O9-A touches eight closed front-door fixtures in one phase.** MEASURED
  (§1.6 B). Each repair is one press, and every paired soak's two sessions get
  the same press, so their hash comparisons hold (PREDICTED). If a repair
  changes anything but the mode, that is a finding.
- **K6 — kit-audio 0.4.0 is a three-file edit,** and D16's headroom model assumes
  every music node is at or under unity. A Butterworth high-pass has no peak
  (PREDICTED; P5 asserts the node's Q).
- **K7 — the combo sits inside the undrawn top pause target (640, 84, r 56)**
  and near the well's top radius (y 30). MEASURED, arithmetic. On touch, a tap on
  the combo pauses. ⚠ Accepted as provisional art.
- **K8 — shipped text traps still apply.**
  - No `fillRect` / `strokeRect` and one `fillText` site (`test-cs008-p4.js`).
  - No `ctx.fill` in `14-render-entities.js` (`test-cs002-p3.js`).
  - No `.key` after an identifier ending in `e` (`test-cs002-p1.js`).
  - No text `audioFrame()` inside `frame()`, and no "draw" in `audioFrame()`'s
    body.
  - No `heat(` call outside the accessors (use `heatT`).
  - `19-sfx.js` names no `state`.
  - `Game.draw()` names no `Telemetry`.
  - No banned vocabulary, including in comments.
- **K9 — `STATUS.md` must stay under ~400 lines** while carrying CS012's new
  hazards. The build phases append their reasoning to `log/CS012.md`.
- **K10 — F1:** Classic SD81 can already cross the deployed rate bound (MEASURED,
  §1.5). This is outside this repo and not CS012's to fix.

## 15. ASSUMPTIONS

- **A1 — Overdrive and Classic share heat, the concurrency ladder, the band roll,
  the Dive, the Purge and scoring constants.** GDD §13's table lists no other
  difference.
- **A2 — `pulse` stays Classic's AUTO track, and `title` plays on every menu in
  both modes** (GDD §11.7).
- **A3 — Paul's lab session on `drive` is optional to CS012's close** (O13; Paul's
  2026-09-16 rule that nothing waits on a playtest, and that a lab is not one).
- **A4 — CS013's tokens will take a warm palette no enemy uses** (GDD §14.1).
  O16's colour recommendation leans on it.
- **A5 — the tenth soak's run length follows the ninth's** (~100,000 frames),
  inside `run-all.js`'s 120 s per-file timeout (PREDICTED; CS011 P6's soak ran
  10.9 s).
