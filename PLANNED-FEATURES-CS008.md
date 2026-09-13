# PLANNED-FEATURES-CS008 — the rim fix, and front of house

**The rim hit-window fix first, then scoring and extra lives, Start Depth and
the mode, text and the HUD, the death fragmentation, the screen state machine,
pause, Options and the Controls page.**

⛔ **EVERY CLAIM IN THIS DOCUMENT IS MARKED MEASURED OR PREDICTED.** A MEASURED
claim names what was run and where. A PREDICTED one says so.

**Baseline for every measurement: commit `b10d77e`** — except §1.16 and §2b,
which were measured at `0b41f55` (after P1) by a second planning session.
`node build.js` → 24 modules, 338.8 KB. `node scratchpad/run-all.js` → **34
files passed, zero skips, exit 0** (10 s).

**How the fixes were measured.** Each candidate was applied to its own
throwaway copy of the repository in the session's temporary directory. Each
copy was rebuilt, and the real suite and the probes ran there. ⛔ **Nothing in
this repository's `src/`, `scratchpad/` or `tools/` was touched** (`CLAUDE.md`
rule 3a). The probes drive `dist/` through `scratchpad/_harness.js`, exactly as
the suite does.

---

## ⛔ 0. PAUL'S CALLS — ✅ ALL ANSWERED 2026-09-13, IN THIS SESSION

`DECISIONS.md` carries the entry. ⛔ A build phase builds these; it does not
re-open them.

| # | The call | ✅ Answer |
|---|---|---|
| R1 | Which rim fix | **(A) + (B)**, plus the float tolerance §1.1 proves (A)+(B) needs |
| R2 | 100 % killable at the rim, or partly lethal | **100 % killable** — the danger is arriving in time, not the cooldown phase |
| R3 | Where the fix lands | **CS008 P1**, before any front-of-house work. No renumber |
| R4 | Rotating ONTO a rim-parked enemy (§1.2) | ~~**Defer to playtest.**~~ ⛔ **SUPERSEDED 2026-09-13 after playing P1: with fire held, it always dies.** Planned as **P1b** (§1.16, §2b), calls K1–K4 below |
| K1 | How the crossing fix works (§1.16) | ✅ **The rim sweep.** A firing Skimmer's contact with a rim enemy asks that enemy `onShot()` before contact can kill. The shot-based family is measured short of 24/24 |
| K2 | A fire-holding player has no death path at levels 1–4 (§1.16, MEASURED 0 deaths in 20 × 60 s) | ✅ **Accept; P8 writes a `PLAYTEST.md` ask** on whether levels 1–4 still feel tense. The answer goes to §8.2 tuning, not to this rule |
| K3 | What "always dies" covers | ✅ **Only an enemy a shot could kill that step.** A riding (armoured) Drifter, a Weaver bolt, and a Surger discharging below the rim still kill a crossing player (GDD §4.5 items 2–4 unchanged) |
| K4 | Numbering | ✅ **P1b**, between P1 and P2. No renumber |
| F1 | Session kind | This session plans; P1 is built in a fresh session from this document |
| T1 | Text rendering | **One sanctioned `drawText()` path** (Orbital Overhaul's precedent); `CLAUDE.md` gets the exception |
| S1 | Start Depth without profiles | **Expand in memory**; CS011 swaps the source to the profile store |
| S2 | Start Depth bonus timing | **Paid through `addScore()` on clearing the starting well** — it counts toward lives, but only if you survive the well you chose |
| S3 | Start Depth formula vs GDD §4.6's table (§1.10) | **The formula is canonical**; P3 corrects the table |
| M1 | Mode screen before Overdrive exists | **Both rows shown, OVERDRIVE locked** until CS012 |
| P1s | Drifter 250/500/750 by depth | **Thirds, rim pays most**: depth < ⅓ → 250, < ⅔ → 500, else 750 |
| P2s | Purge kills score | **Yes, normal points** (both uses) |
| P3s | Extra-life schedule | **20k, 60k, 100k, 140k …** — first at 20,000, then every 40,000 |
| P4s | Well-clear bonuses | **Paid on the clear step, before the dive**; "no death" means no death in that well's play — a dive death does not count |
| U1 | Menu navigation | **Rotate / Fire / Purge** — rotate moves the selection, Fire confirms, Purge backs out. Esc also backs out |
| U2 | Game over | **RESTART** (same mode and Start Depth, new seed) **+ QUIT TO TITLE**. `r` stops being a debug key |
| U3 | Scope additions | **All three IN CS008: Options screen, death fragmentation, pause** |
| U4 | Pause trigger | **Esc / `p` and gamepad Start as a named action; auto-pause when the tab is hidden; a touch pause target top-centre.** Menu: RESUME / OPTIONS / QUIT TO TITLE; resume is instant (no countdown — house rule) |
| U5 | Options rows | **TELEMETRY on/off + EXPORT, CONTROLS ›, CREDITS ›.** Sound/Music is **CS009's** row |
| U6 | Credits copy | **Placeholder as data in `C`**; Paul finalizes before ship. No mention of the original game or its publisher |
| U7 | Controls page | **A sub-page of Options**: mouse sensitivity, touch sensitivity, left-handed touch, touch auto-fire, **keyboard bindings, gamepad bindings** |
| U8 | Rebind clash | **Swap.** Esc and gamepad Start are reserved and cannot be assigned; a RESET TO DEFAULTS row |
| U9 | Fragmentation look | **The craft breaks into its own outline segments**, drifting outward, spinning slightly and fading |
| H1 | HUD lives | **Reserve craft icons** (`lives − 1`) |
| H2 | HUD band | **"LEVEL n" in the band's colour**, no band name |
| H3 | HUD on touch | **Inset beside the touch buttons** on whichever side they are |

### ⚠ Readings this plan takes and flags, and none is a call Paul left open

Each one follows from an answer above or from an existing definition. ⛔ **If
Paul objects to any of them, the phase that builds it stops.**

- **Dive-destroyed Thorn scores 0.** GDD §5's termination path is not a player
  kill: `11-dive.js` does not count it in `tally.kills` (MEASURED, grep), and
  `kills` is defined as "enemies the player destroyed, by shot or by Purge"
  (GDD §15.6).
- **The Purge charge HUD.** `purgeUses` 0 draws bright, 1 draws dim (the weak
  second use is still available), and 2 or more draws nothing (GDD §4.3).
- **The Start Depth list.** It is every odd depth from 1 up to
  `max(9, highest level cleared this session snapped down to odd)`, capped at
  81 (GDD §4.6).
- **Rebinding covers the five device actions** — left, right, fire, purge and
  jump — two key slots each, matching `INPUT_KEYS_DEFAULT`. Debug keys, digits,
  Esc and `p` cannot be assigned.
- **The `t` / `e` telemetry debug keys stay** beside the new Options rows. They
  are the only debug keys that are safe inside a hashed run (`23-main.js`).
  Removing them is CS016's debug-key decision, not CS008's.
- **The HUD insets on the touch-button side at all times**, not only once touch
  is detected. Doing it only on detected touch would need a new kit-input
  query.
- **The sensitivity slider range is ×0.5 to ×2.0 of the shipped constant, in
  ×0.1 steps.** ⛔ This is a tuning number. P7 stops and asks Paul before
  shipping it unless he has confirmed it.

---

## 1. ⛔ WHAT THIS SESSION MEASURED, AND WHERE THE HANDOVER WAS WRONG

### 1.1 ⛔ MEASURED — (A) + (B) is 75 %, NOT 100 %. Floating point takes the fourth tick.

`NEXT-STEPS.md` printed the combined fix as "4 of 4, 100 %", derived by
arithmetic. **That is false by 4.4 × 10⁻¹⁷.** An enemy parked at
`1 - C.RIM_CONTACT_DEPTH` sits at `0.95`, and `Math.abs(1 - 0.95)` is
`0.050000000000000044`, which is **greater** than `C.HIT_DEPTH_TOL` (0.05). So a
shot at depth exactly 1.000 misses it. That is the one extra sample (A) exists
to add.

**MEASURED — the arrival probe.** Each variant is built from its copy. A
Skimmer holds fire through the input module (`keyDown(" ")`), with the spawner
held and 0–23 ticks of pre-fire to walk all 24 cooldown phases. Kills out of 24:

| Scenario | shipped | (A) | (B) | (A)+(B) | **(A)+(B)+ε** |
|---|---|---|---|---|---|
| S1 — hunting rim Vaulter one lane away hops INTO a stationary firing Skimmer | **6** | 12 | 18 | **18** | **24** |
| S2 — Vaulter climbs the Skimmer's own lane from 0.5 (control) | 24 | 24 | 24 | 24 | 24 |
| S3 — Skimmer rotates ONTO a Carrier parked at the rim | 0 | 6 | 6 | **0** | 6 |
| S4 — rim Drifter homes in | 6 | 12 | 18 | 18 | **24** |

The shipped S1 figure is exactly `NEXT-STEPS.md`'s 6/24 and 18/24, so the probe
reproduces the reported defect. ε is `C.HIT_DEPTH_TOL + 1e-9` in the band test.
⛔ **ε alone is inert on the whole suite**: 34/34 green with
`P1_DETERMINISM_HASH` unchanged (MEASURED, its own copy).

**The fix therefore has three parts, and P1 builds all three.**
- **(A)** Age and retire the shots already in flight, then fire.
- **(B)** Stop the four climbs at `1 - C.RIM_CONTACT_DEPTH`, and move
  `Vaulter.atRim()` with them.
- **(ε)** Add a named `C.HIT_DEPTH_EPS`.

⚠ **(A) has two orderings and they differ.**
- **A1** decides the `SHOT_MAX` check after retirement. S4: 12/24.
- **A2** decides it before ageing and pushes afterwards. S4: 11/24.

MEASURED, both copies. PREDICTED mechanism: under A2 a fresh shot is aged 0, so
8 shots can be alive at the fire check, and the cap binds one tick in the
cadence. **P1 builds A1.** On the shipped build the cadence is a clean 4 ticks
with the cap never binding (MEASURED: 95 consecutive gaps of 4, peak 7 shots).

### 1.2 ⛔ MEASURED — rotating ONTO a parked enemy stays a cooldown coin flip under every fix.

S3 above. No shot can be in a lane before the Skimmer enters it, so the only
shot that can save the player is the one fired on the entry tick. That shot
depends on the cooldown phase: at most 6/24. (A)+(B) without ε drops it to 0,
by the same float miss.

Re-arming the cooldown on every change of fire lane was measured: S3 rises to
**17/24**. The rest are Carrier split children in the probe, a confound. The
cost is that mouse jitter across a lane boundary fires on every tick (up to
`SHOT_MAX`). ✅ **Paul, R4: defer to playtest.** P1 does not touch it; P8 writes
the `PLAYTEST.md` ask.

⛔ **SUPERSEDED — see §1.16.** R4 was re-opened after Paul played P1. The 17/24
above is measured with a short pre-fire, and it falls to **6/24** once the shot
rack is full.

### 1.3 ⛔ MEASURED — the played-run death share is a property of the DRIVER, and "62 %" is not reproducible without the original one.

Twenty runs from level 1 per variant, deaths classified by the killer's depth
and kind at the death step:

| Driver | shipped: rim-parked deaths | fix: rim-parked deaths | levels (median, fix) |
|---|---|---|---|
| chase — reacts every 250 ms, 4.8 lanes/s, dodges Thorns in the dive | 2 / 60 | 6 / 60 | 16 |
| sweep — the soaks' recorded list with fire held throughout | **48 / 60 (80 %)** | **58 / 60** | 4 |

The chase bot dies to bolts and discharges, and the rim barely matters to it.
The sweep bot dies to the rim either way, because it keeps rotating onto hunters
mid-hop — S3's shape, which R4 leaves alone.

⛔ **Neither bot is a player, and the plan claims nothing played from them.**
The claim P1 owns is the arrival table in §1.1, which needs no driver. Whether
the fix changes how the game *feels* is a `PLAYTEST.md` question. ⛔ It also
unblocks the CS007 ask ("can you NAME what changed at level 5, at 9, at 13"),
which `NEXT-STEPS.md` correctly said a player could not reach.

### 1.4 ⛔ MEASURED — (A) does NOT move `GOLDEN_LANES`. (B) does, and it only APPENDS.

`NEXT-STEPS.md` asked whether (A) moves `test-cs004-p1.js`'s golden. **No:**
under (A) alone the only red is `P1_DETERMINISM_HASH`. **(B) moves it:** under
(B), (A)+(B) and (A)+(B)+ε the sequence becomes
`[10,10,12,0,8,14,12,12,8,14,10,0,7,7,12,3,2,5]`. The recorded 16 entries are
character-identical, with **two appended**. PREDICTED cause: a Vaulter parked
at 0.95 dies to held fire sooner than one at 1.0, so the window clears faster
and fits two more spawns.

`P1_DETERMINISM_HASH` (`test-cs006-p2.js`, currently `3661952239`) under each
mutation:

| Mutation | Hash |
|---|---|
| ε only | **3661952239 — unchanged** |
| (A) only | 3063940911 |
| (B) only | 3924408609 |
| (A)+(B) | 2236574593 |
| **(A)+(B)+ε — what P1 ships** | **1862183225** |

⛔ **`STATUS.md` says a `GOLDEN_LANES` move is a defect. This is the one change
where it is not**, and P1 writes the exception at the assertion and in
`STATUS.md` with its single cause: *the climb stops at the kill band*. ⛔ The
guard that keeps it honest is that the first 16 entries do not move.
`test-cs006-p5.js`'s draws-per-spawn count is also **green** under the fix
(MEASURED), so no draw was added.

### 1.5 ⛔ MEASURED — the closed-file inventory: 19 assertions in 8 files go red, 2 more pass VACUOUSLY, and the repairs are verified.

Full suite under (A)+(B)+ε: **8 files, 19 failures.**

| File:line | Assertion | Repair, IN PLACE |
|---|---|---|
| `test-cs003-p1.js:169` | "settles exactly at 1" | the park depth `1 - C.RIM_CONTACT_DEPTH`; also tighten `:163` `overRim` to it |
| `test-cs003-p1.js:170–172` | "the rim is reached at VAULT_CLIMB (tick −1)" | `reachedAt` at the park depth; `expected = ceil(park / VAULT_CLIMB / DT)` |
| `test-cs003-p5.js:360` → `:410` ×6 | "an enemy reached the rim — rim hunting ran" | `sawRim` at the park depth |
| `test-cs004-p1.js:287` | `GOLDEN_LANES` | **re-record** (§1.4), with the stated exception |
| `test-cs004-p2.js:151` | "climb stops AT the rim — depth 1 exactly" | the park depth; tighten `:137`/`:147` `overshoot` to it |
| `test-cs005-p2.js:236,237,246,253` → 4 failures | Drifter climb rate / stops / sat / still at rim | `before.depth >=` park, `d.depth ===` park, both `eq`s to park |
| `test-cs005-p3.js:279,289,294` → 3 failures | Surger climb rate / stops / still at rim | `d.depth !==` park, both `eq`s to park |
| `test-cs006-p2.js:488` | `P1_DETERMINISM_HASH` | **re-record** → `1862183225` |
| `test-cs007-p3.js:332` | "level 18–22: Drifter cargo arrived" | the band's window, not the claim — see below |

⛔ **Two more pass VACUOUSLY, and they are the dangerous kind.**
`test-cs004-p5.js:609` and `test-cs005-p5.js:698` both read
`if (e.depth >= 1) sawRim = true`. Under the fix no climbing enemy ever reaches
1, and they stay green **only because a `WeaverBolt` still does**. The repair is
`!(e instanceof X.WeaverBolt) && e.depth >= park`. MEASURED: both still pass
with it, so a real enemy reaches the park depth in both soaks.

⚠ **`test-cs007-p3.js`'s level-22 window was always marginal.** In
`bandRun(22, 1200)` the first `carrierDrifter` arrived at tick **732** on the
shipped build, as one sample. Under the fix it arrives at tick **1,355**
(MEASURED, an instrumented copy of the fixture). The claim is "Drifter cargo
arrives in the 18–22 band". The repair is the window for that one band:
`bandRun(22, 2 * DT_TICKS)`. ⛔ The negative claim beside it ("Surger cargo has
not") only gets stronger with a longer window.

✅ **MEASURED — every repair above, applied in a copy with the fix: `run-all.js`
→ 34 files passed.**

### 1.6 ⛔ MEASURED — forgetting to move `atRim()` is NOT silent.

`NEXT-STEPS.md` feared a Vaulter that never hunts would slip past the suite.
With (B) built but `atRim()` left at `depth >= 1`, `test-cs003-p4.js` goes red:
*"a passive run reaches the stop unaided"* and *"the reserve is spent down to
exactly zero"*. `test-cs004-p1.js`'s golden also collapses to 5 entries. ⛔ P1's
own test still asserts hunting directly, so the protection is not borrowed.

### 1.7 ⛔ MEASURED — the respawn guarantee is untouched.

`test-cs007-p2.js` is green under the fix. The guarantee is derived against the
climb from `RESPAWN_PUSH_DEPTH` 0.55 to the kill band at 0.95, and (B) moves the
park depth onto that band without changing either end.

### 1.8 ⛔ MEASURED — scoring and extra lives move no baseline; five assertions assert their absence.

A rough emulation, applied on top of the fix: `addScore()` with the 20k/60k
schedule, points on shot and Purge kills, Thorn chips and the clear bonuses.
It adds **5 failures in 5 files, all of them "not built yet" claims**:
- `test-cs002-p1.js` — the registry inventory: new `state` fields.
- `test-cs003-p3.js:91` and `test-cs003-p4.js:127` — *"state carries no score
  field this changeset"*.
- `test-cs005-p2.js:115` — *"C.PTS_DRIFTER is still unread"*.
- `test-cs005-p3.js:115` — *"C.PTS_SURGER is still unread"*.

**`P1_DETERMINISM_HASH` and `GOLDEN_LANES` did not move.** Scoring spends no
draw, and extra lives are rare in the soaks: 1 award in each of `test-cs003-p5`,
`cs005-p5` and `cs006-p5`, 2 in `cs007-p5`, **0 inside the hashed run**.
⚠ PREDICTED only for the shipped design, because the emulation guessed shapes P2
will decide.

### 1.9 ⛔ MEASURED — booting to a title screen is suite-neutral.

Boot stops calling `startGame()` and sets `screen = "title"`, and
`Game.update()` returns early on any screen but `"play"`: **34/34 green**. This
holds because `newState().screen` stays `"play"` and every closed test starts
through `G.reset()` / `startGame()`.

### 1.10 ⛔ MEASURED — three statements in the handover documents are wrong.

1. **`STATUS.md`: "the Drifter and the Surger shipped no points constants."**
   False. `C.PTS_SURGER` 200 and `C.PTS_DRIFTER` `[250, 500, 750]` are in
   `00-config.js:532–533` and date from **CS001 P0** (`ad8b954`, `git log -S`).
   What is true is that nothing reads them, and two closed tests assert exactly
   that (§1.8).
2. **`STATUS.md`: "CS008 takes the first two bites" of
   `C.TELEMETRY_PLACEHOLDER`.** CS008 owns **three**: `score` (P2), and `mode`
   and `startDepth` (P3). GDD §4.6 is in CS008's row. Only `maxCombo` survives,
   for CS012.
3. **GDD §4.6's table disagrees with its own formula at three depths** —
   `round100(800 × (d−1)^1.6)`:

   | d | 7 | 17 | 33 |
   |---|---|---|---|
   | formula | 14,100 | 67,600 | 204,800 |
   | table | 14,300 | 67,500 | 191,700 |

   ✅ S3: the formula is canonical, and depth 81 pays **887,200**.

### 1.11 ⛔ MEASURED — kit-input cannot change a setting after creation.

`createInput()` (`04-input.js`, `VERSION` 0.3.0) captures every sensitivity, the
auto-fire and mirror flags, the key map and the gamepad button map as `const` at
creation. The returned API has no setter.
- **Controls page (P7):** needs a MINOR bump.
- **Pause (P6):** a gamepad Start button, a touch pause target and a
  visibility-driven pause all need new kit-input sources, and one blur listener
  already exists (`reset()` on window blur).

Both stay game-agnostic, with `.NOTES.md` entries.

### 1.12 ⛔ MEASURED — the past-99 `startGame()` defect stays unreachable.

Start Depth caps at 81, and `C.BAND_RNG_LEVEL` is 99. A run starting at 81 maps
to `WELLS[(81−1) % 16]` = the Ring in the Green band, with `bandRoll` 0 correct
below 99. ⛔ No fix in CS008: `STATUS.md`'s entry stays open, re-worded as
"unreachable while the cap is 81".

### 1.13 ⛔ MEASURED — the touch buttons sit on two HUD corners.

`touchButtonCenters()` puts Purge at `(1280 − 84, 84)` and Jump at
`(1280 − 84, 720 − 84)`, radius 56 (`C.TOUCH_BUTTON_R`, margin `1.5 × R`). That
is exactly GDD §10.4's level/band and Purge-charge corners. With
`C.INPUT_MIRROR` they cover score and lives instead. ✅ H3: inset.

### 1.14 ⛔ MEASURED — there is no text path in the build.

`grep fillText|strokeText|font src/` finds nothing. Orbital Overhaul
(`../ADD-Orbital-Overhaul`, `5abd37a`) draws every string through one
`drawText()` over `fillText` with a glow, and calls it "the already-sanctioned
fillText path". ✅ T1 adopts the precedent. ⛔ Glow is the **two-pass**
technique of GDD §10.2, `strokeText` wide and dim then `fillText` bright under
`lighter`, **not** Orbital Overhaul's `shadowBlur`, which §10.2 rejects on cost.

### 1.15 MEASURED — a split would cost 62 pointers, and the plan does not split.

Eight phases is past `ROADMAP.md` assumption #1's "3–5". Splitting the tail to a
new CS009 means renumbering every later changeset. MEASURED:
`grep -rEo 'CS0(09|1[0-6])'` over `src/`, `scratchpad/`, `tools/` and the root
docs finds **62** (39 in `ROADMAP.md`). ✅ U3 put the scope in CS008. The plan
keeps it and P8 notes the assumption.

### 1.16 ⛔ MEASURED at `0b41f55` — crossing a rim enemy: no shot-based fix reaches 24/24, and the handover's 17/24 was a short pre-fire

**Planning session 2026-09-13 (second), after Paul played P1.** `src/` is
byte-identical to `22c75b5` (`git diff --stat 22c75b5 -- src scratchpad` is
empty). `node build.js` → 24 modules, 340.9 KB. Suite → 35 files, zero skips.
Every variant was built in a throwaway copy of the repository in the session's
temporary directory. ⛔ Nothing in this repository's `src/`, `scratchpad/` or
`tools/` was touched.

**The probe.** It drives the real `Game.update()` through `_harness.js`. The
level is 1, except Carrier rows at 3, Drifter rows at 9 and Surger rows at 13.
- The spawner is held, as in `test-cs008-p1.js`.
- The Skimmer sits on lane centre `b`, with fire held through `keyDown(" ")`.
- After **40 + p** ticks (p = 0..23), one enemy is placed at `b ± 2` at the
  park depth. The Skimmer then moves to `b ± 4` and waits 20 ticks.
- Keyboard rows hold an arrow key. Mouse rows call `mouseMove(px)` every step.
- A run is **killed** when no `blocksClear` enemy is left alive, and **died**
  when `lives` drops.

**The stagings — MEASURED values, which P1b's test reuses.**
- `b` is 0 on the Ring (`WELLS[0]`), 3 on the Vee (`WELLS[7]`), and 8 for the
  leftward rows.
- Parked enemies:
  - Vaulter: `new Vaulter(b±2, PARK, 1)`.
  - Carrier: `new Carrier(b±2, PARK, "vaulter")`.
  - Surger: `new Surger(b±2, PARK)`.
- Mouse rates: `px = rate / C.MOUSE_SENS`. C4's 0.5 lane/step from lane 8
  visits 7.5, 7, **6.5**, 6 (MEASURED).
- C10 and C11 — a Vaulter about to hop: `hopTimer = vaultRimInterval() - 4 * DT`.
- C12 — a Drifter that starts a vulnerable cross this step: `phase = "ride"`,
  `lane = b + 2.5`, `rideTimer = 1e9`.
- C13 — two Vaulters at `(b + 2, PARK)`.
- N1 — C1 without `keyDown(" ")`.
- N2 — C12 with `rideTimer = -1e9`, so it stays riding and armoured.
- N3 — `new Surger(b + 2, 0.5)`, then `setPhase("discharge")`.

⛔ **40 ticks fills the rack, and a full rack is the steady state for anyone
holding fire.** A shot retires on its 32nd step under A1 and the cadence is 4,
so 8 shots are alive: `C.SHOT_MAX`. MEASURED: `shots.length` is 8 at placement
in all 24 phases. With a 0-tick pre-fire, the re-arm row reproduces
`NEXT-STEPS.md`'s 17/24 exactly. With a full rack it is **6/24**, no better
than shipping nothing.

Kills out of 24:

| Shape | shipped | re-arm on fire-lane change | + that shot ignores `SHOT_MAX` | + contact tested on the fire lane | **rim sweep** |
|---|---|---|---|---|---|
| C1 Vaulter parked, keys right, Ring | 6 | 6 | 24 | 24 | **24** |
| C2 the same on the open Vee | 6 | 6 | 24 | 24 | **24** |
| C3 keys LEFT, Ring | 6 | 6 | 24 | 24 | **24** |
| C4 mouse left at 0.5 lane/step — lands EXACTLY on 6.5 | 0 | 0 | 0 | 24 | **24** |
| C5 mouse 0.1 lane/step | 6 | 6 | 24 | 24 | **24** |
| C6 mouse 0.6 lane/step | 6 | 6 | 24 | 24 | **24** |
| C7 Carrier parked, Ring (it splits) | 0 | 6 | 24 | 24 | **24** |
| C8 Carrier parked, Vee | 0 | 6 | 24 | 24 | **24** |
| C9 Surger parked | 6 | 6 | 24 | 24 | **24** |
| C10 rim Vaulter hops INTO a keyboard mover | 0 | 0 | 0 | 18 (6 never touched) | **24** |
| C11 rim Vaulter hops into a slow mouse mover (0.06/step) | 24 | 24 | 18 | 6 | **24** |
| C12 a crossing (vulnerable) Drifter | 6 | 6 | 24 | 24 | **24** |
| C13 two Vaulters stacked in one lane | 0 | 0 | 0 | 0 | **24** |
| N1 C1 with fire NOT held — must die | 0 | 0 | 0 | 0 | **0** |
| N2 riding (armoured) Drifter — must die (K3) | 0 | 0 | 0 | 0 | **0** |
| N3 Surger DISCHARGING at depth 0.5 — must die (K3) | 0 | 0 | 0 | 0 | **0** |

**Why each shot-based step falls short.** Each mechanism was MEASURED from the
state at the death step.
- **The cooldown (shipped).** Death is on the first contact step: keys put
  `skimmer.lane` at 1.589, fire lane 2. The lane-2 shot is not due yet.
- **The rack (re-arm).** The re-arm shot is refused by `SHOT_MAX` on every step
  but the one where a slot frees. ⚠ `NEXT-STEPS.md` predicted the re-arm's 7
  residual deaths were the Vaulter's hop. **Measured false as the cause of those
  7** — the cap is. The hop shape is real, and it is C10.
- **The closed interval (C4).** At `skimmer.lane` = 6.5 exactly, `Math.round`
  fires into lane 7. Contact with lane 6 is `|0.5| <= C.HIT_LANE_TOL`.
- **Between centres (C10).** The Skimmer at 1.257 fires into lane 1, and the
  Vaulter mid-hop is at 1.583. Contact is 0.326; the shot's lane gap is 0.583.
- **Stacked (C13).** `collideShots()`'s unconditional `break` means one shot
  resolves one enemy per step, and that `break` is ⛔ load-bearing.
- **C11 gets WORSE as the shot-based fix grows.** Moving contact onto the fire
  lane moves where contact happens.

⛔ **The rim sweep is the only candidate at 24/24 on every shootable shape**, and
it holds all three negative rows. ✅ K1.

**The sweep, as measured** — four lines in `collideSkimmer()`, after the lane
match and before `killSkimmer()`:

```js
if (state.input.fire && e.depth >= 1 - C.RIM_CONTACT_DEPTH) {
  e.onShot(null);
  if (e.dead) { state.tally.kills++; continue; }
}
```

MEASURED, grep: no `onShot` in the build reads its argument, so `null` is safe.
A Shot was also measured in that slot, and the results are identical.

**MEASURED — mutations, each on its own copy of the sweep.**
- Fire gate removed → N1 is killed 24/24.
- Depth gate removed → N3 is killed 24/24.
- `e.dead = true` in place of `onShot` → N2 is killed 24/24.
- Sweep removed → the shipped column.

**MEASURED — non-vacuity.** C7 and C8 record exactly **3** kills in every phase:
the Carrier and both children. So the split happened, through `onShot`.

**The played consequence — ✅ K2.** 20 seeds × 3,600 ticks from level 1, fire
held throughout, rotating on the soaks' recorded list:
- shipped: **15** deaths, every one a Vaulter with fire held;
- sweep: **0** deaths.

Both reach level 3–4. The soaks' scripted players change the same way
(hashed windows, level: deaths / game overs):

| Run | shipped | sweep |
|---|---|---|
| `test-cs004-p5.js`, L7 | 7 / 2 | 1 / 0 |
| `test-cs005-p5.js` = `test-cs006-p5.js`, L23 | 3 / 1 | 2 / 0 |
| `test-cs007-p4.js` capture, L1, 6,000 ticks | 1 / 0 | 0 / 0 (first death at tick 7,028, level 6) |

**MEASURED — the suite under the sweep: 5 failures in 5 files.**
- `test-cs004-p5.js:330`, `test-cs005-p5.js:360` and `test-cs006-p5.js:363`:
  *"reached the game-over stop at least once"*.
- `test-cs007-p4.js:562`: *"the deaths column moved — the recorded list dies"*.
- `test-cs006-p2.js`: `P1_DETERMINISM_HASH` → 4203989832.

Four of these are fixture preconditions. The scripted players hold fire, and
they no longer die. ⛔ **Green guards:**
- `GOLDEN_LANES`, all 18 entries unmoved;
- `test-cs008-p1.js`, P1's arrival table;
- `test-cs006-p5.js`'s draws-per-spawn count;
- `test-cs007-p2.js`'s respawn guarantee.

**MEASURED — the fixture repairs, and the ones rejected.**

| Repair | L7 deaths / game overs / respawns | L23 | Verdict |
|---|---|---|---|
| **`st.lives = 1` after the FIRST `armMixed()` only** | 2 / 1 / 1 | 2 / 1 / 1 | ✅ restores the game over AND keeps a respawn in the hash |
| `lives = 1` on every run | 3 / 3 / 0 | 5 / 5 / 0 | ✗ drops `respawnSkimmer()` out of the hash |
| `lives = 2` on every run | 1 / 0 / 1 | 3 / 1 / 2 | ✗ L7 still never stops |

`test-cs007-p4.js`: `CAPTURE_TICKS` 6,000 → **7,300**. Under the fix, deaths land
at 7,028 (inside) and 7,574 (outside). At 8,000 the run stops at 7,780 inside
the window, and *"a column IS the counter"* goes red (2 against 3): the last
death is never sampled. Margins at 7,300 are 272 and 274 ticks.

⛔ **MEASURED — the repairs are fix-independent:** on the shipped build they are
green except the hash.

| Hash | Value |
|---|---|
| fixture repairs only | 2859072280 |
| sweep only | 4203989832 |
| **sweep + repairs — what P1b ships** | **1229033515** (34/35 green before the re-record) |

**MEASURED by emulation — P2's "no baseline moves" still holds.** Scoring was
emulated on the P1b hashed windows (§3's table, clear bonuses, Thorn chips
omitted). The best run scores **5,150** at L7 and **6,650** at L23, far below
`C.EXTRA_LIFE_FIRST` 20,000. So no extra life falls inside the hashed run.
⚠ PREDICTED for the build itself, because P2 is unbuilt.

---

## 2. P1 — THE RIM FIX

**What ships.**

1. **(A), ordering A1.** `updateShots()` (`06-shots.js`) ages every shot
   already in flight and filters the dead, **then** fires. A shot is born at
   depth 1.000 and is tested there on its fire tick. The `SHOT_MAX` check reads
   the post-retirement length. The file header's ordering comment changes with
   it.
2. **(B).** The four climb clamps — Vaulter (`07-enemies.js` ~188), Carrier
   (~380), Drifter (~998), Surger (~1267) — stop at
   **`1 - C.RIM_CONTACT_DEPTH`**. ⛔ They use that expression and **not**
   `this.killDepth`, because the Surger mutates its `killDepth` to 0. No new
   constant for the park depth: it is the band, named once, exactly as
   `killDepth` is. `Vaulter.atRim()` moves to the same expression. ⛔ The
   `WeaverBolt` is untouched: it self-terminates at 1 and does not park.
3. **(ε).** `C.HIT_DEPTH_EPS` **1e-9**, in `collideShots()`'s band test
   (`> C.HIT_DEPTH_TOL + C.HIT_DEPTH_EPS`). Its comment carries §1.1's number:
   it absorbs representation error and is not a tuning margin. ⛔ No other
   comparison takes it.

**Behaviour that moves with it, and is part of the fix rather than a side
effect.**
- **A parked enemy sits just inside the rim.** Gap from rim to depth 0.95,
  lane 0: **Ring 7.7 px, Vee 8.6 px, Twist 2.1 px** (MEASURED, `screenPos`).
- **A Vaulter starts hunting when it becomes lethal (0.95)**, not 0.28 s later.
  Arithmetic: `0.05 / VAULT_CLIMB`.
- ⚠ PREDICTED edge: **a second Purge now prefers a bolt above 0.95 over a
  parked enemy**, because `purgeTarget()` takes the highest depth. A bolt is
  above 0.95 for about nine ticks.

**GDD edits.**
- §6.1: *"The climb is monotonic and stops at the rim"* becomes *"stops at the
  kill band"*, with this section's reason.
- §4.2: shots are tested at the rim on their fire tick.
- §6.5 `killDepth` row: the park depth is the same expression.
- §17: the arrival guarantee.

---

## 2b. P1b — THE CROSSING FIX: THE RIM SWEEP

✅ **K1–K4, Paul, 2026-09-13.** The rule is: **with fire held, a rim enemy the
Skimmer touches dies if a shot could kill it.** Measured in §1.16.

**What ships.**

1. **The sweep, in `collideSkimmer()` (`09-collision.js`)**, after the lane
   match and before `killSkimmer()`. It is exactly §1.16's four lines.
   - **The fire gate is `state.input.fire`**, the level every device writes, so
     touch auto-fire counts. A player not holding fire still dies on contact
     (the settled reading, `DECISIONS.md`).
   - **The depth gate is `e.depth >= 1 - C.RIM_CONTACT_DEPTH`**, the park
     expression, and ⛔ no new constant. Its one job is N3: a Surger
     discharging below the rim keeps GDD §4.5 item 3.
   - **`e.onShot(null)`, and ⛔ never `e.dead = true`.**
     - The enemy decides what a hit does (GDD §6.5), so armour refuses: N2 is
       item 2.
     - A Carrier splits through `spawnEnemy()` exactly as a shot kill does,
       spending the same draws.
     - No `Shot` is minted, because none leaves the rim. The return value
       ("consumed") is ignored, because there is nothing to consume.
     - ⛔ This is the opposite of the Purge's ⚠ SETTLED omission, and the
       reason is the same: the Purge is a statement, and this is a shot that
       never had to fly.
   - **`if (e.dead) { state.tally.kills++; continue; }`.**
     - `continue`, not `return`: every enemy touching this step is asked, which
       covers C13's stacked pair, and a Carrier's children appended mid-loop
       are reached by the index-based walk.
     - `kills` counts ("the player destroyed it"); `shotsFired` does not.
   - **It runs above `killSkimmer()`'s invulnerability guard.** An invulnerable
     craft that is firing still kills what it touches — "invulnerability
     suspends dying, not playing".
   - ⛔ **No change to `updateShots()`, the cooldown, `SHOT_MAX`,
     `HIT_LANE_TOL` or the contact geometry.**
2. **Comments, corrected in place.**
   - `09-collision.js`'s file header ("ONE PASS, in a FIXED ORDER").
   - `collideSkimmer()`'s header, which gains the sweep's rule and its §1.16
     reason: why contact-side and not shot-side.
   - The "No scoring" note gets a line saying P2 awards here too.
   - ⚠ The sweep reads like a bypass of the fire economy, and a later session
     will be tempted to "unify" it into `updateShots()`. The comment carries
     §1.16's C10/C13 numbers so that session sees why it can't.

**Closed-file edits — MEASURED in §1.16, IN PLACE, each written as restoring a
precondition.**
- `test-cs004-p5.js:177`, `test-cs005-p5.js:202`, `test-cs006-p5.js:201`: add
  `st.lives = 1;` after the first `armMixed()` only, never after a restart.
  The claim "reached the game-over stop" is unchanged. The scripted player
  holds fire, so under the sweep it dies too rarely to spend three lives.
- `test-cs007-p4.js:36`: `CAPTURE_TICKS` 6000 → 7300, with the two measured
  margins at the constant.

**The one re-record.** `test-cs006-p2.js` `P1_DETERMINISM_HASH` 1862183225 →
**1229033515**.
- ⚠ **Two causes in one re-record, each measured alone:** the sweep
  (4203989832) and the fixture repairs (2859072280). This is P1's precedent: a
  three-part fix with a decomposition table.
- ⛔ All three values go at the assertion.
- ⛔ `GOLDEN_LANES` does not move. A move is a defect.

**GDD edits.**
- §4.5, after item 1: "Shipped, CS008 P1b" — the sweep, K3's three exclusions,
  and the rule that an unfiring player still dies.
- §4.2: replace the "⚠ Rotating onto… deferred to playtest" sentence with the
  crossing guarantee.
- §6.5: `onShot` is asked by the sweep as well as by shots.
- §17: the crossing guarantee beside the arrival guarantee.

---

## 3. P2 — SCORING AND EXTRA LIVES

**What ships.**

- **`addScore(n)` in `src/12-scoring.js`**, ⛔ the only writer of `state.score`
  and the only place an extra life is awarded. `state.score` starts at 0.
- **The next milestone is a field.** `state.nextLife` starts at
  `C.EXTRA_LIFE_FIRST` (20,000). Crossing it adds a life if
  `lives < C.LIVES_MAX` and advances it by `C.EXTRA_LIFE_EVERY` (40,000). A
  `while` handles one award that crosses two milestones.
- ⚠ **An award past the cap is lost, and in CS008 that is silent.** GDD §4.4
  wants a distinct sound, and audio is CS009's. P2 leaves one commented hook
  line where CS009 attaches the voice.
- **Points are read off the entity through one method, `points()`**, with the
  base `Enemy` returning 0, the same default-safe pattern as `onShot`:

  | Entity | `points()` |
  |---|---|
  | Vaulter | `C.PTS_VAULTER` |
  | Carrier | `C.PTS_CARRIER` (its children score for themselves when shot) |
  | Weaver | `C.PTS_WEAVER` |
  | Surger | `C.PTS_SURGER` |
  | Drifter | `C.PTS_DRIFTER[min(len−1, floor(depth × len))]` — thirds, rim pays most (✅ P1s), band count derived from the array's length |
  | Thorn | **0** — it scores per chip instead, from inside `Thorn.onShot()` via `addScore(C.PTS_THORN)` (the enemy decides what a hit does, GDD §6.5) |
  | WeaverBolt | 0 |

  ⛔ This is a **fourth contract method**, and GDD §6.5 "The three methods"
  becomes four in the same commit.
- **Kill sites.**
  - `collideShots()` awards `e.points()` when the call to `onShot` turned
    `e.dead` from false to true.
  - ⛔ **Added by the P1b planning session:** `collideSkimmer()`'s rim sweep
    (§2b) awards `e.points()` on the same false→true transition. It is a shot
    kill that never had to fly. This follows from K1 and is not a new call.
  - `updatePurge()` awards `victim.points()` for every kill, both uses
    (✅ P2s).
  - `startDive()`'s termination kill awards nothing (the reading in §0).
- **The clear edge — the line in `Game.update()` that counts
  `tally.wellsCleared`.** In one deterministic order:
  - `C.PTS_WELL_PER_LEVEL × state.level`;
  - `C.PURGE_SAVED_BONUS` if `state.purgeUses === 0`;
  - `C.PTS_NO_DEATH_WELL` if no death happened in this well — a new `state`
    flag that `enterWell()` clears and `killSkimmer()` sets. A dive death sets
    it after the clear edge and `nextWell()` clears it, so ✅ P4s falls out
    with no special case;
  - P3 adds the Start Depth bonus here.
- **Telemetry.** Delete `score` from `C.TELEMETRY_PLACEHOLDER`; the column
  reads `state.score`. ⛔ The column order does not move.

**Closed-file edits, in place** (§1.8):
- `test-cs003-p3.js:91` and `test-cs003-p4.js:127` — "no score field" becomes
  "the score field is born at 0".
- `test-cs005-p2.js:115` and `test-cs005-p3.js:115` — "still unread" becomes
  the value's reader.
- `test-registry.js` gets a `CS008` entry.

⛔ **GDD §17 item 8** ("total equals the sum of logged events") is P2's to
cover. It uses no production-side event log that exists only for a test:
observe per-step deltas against what happened on the board.

---

## 4. P3 — THE RUN'S PARAMETERS: MODE AND START DEPTH

**What ships.**

- **`startGame(seed, opts)`**, where `opts` is `{ mode, startDepth }`.
  Omitted, it is `"classic"` and 1. ⛔ **The defaults are bit-identical to
  today:** every closed test calls `startGame(seed)`. `state.mode` and
  `state.startDepth` are new fields. `state.level = startDepth`, `wellIndex`
  comes from the same modulo, and `bandRoll` is 0 (§1.12).
- **`startBonus(d)`** — `round100(C.START_BONUS_SCALE × (d − 1)^C.START_BONUS_EXP)`,
  with `C.START_BONUS_SCALE` 800, `C.START_BONUS_EXP` 1.6 and
  `C.START_BONUS_ROUND` 100. ✅ S3: the formula, and **P3 corrects GDD §4.6's
  table** to 0 / 2,400 / 7,400 / 14,100 / 22,300 / 67,600 / 204,800.
- **Paid at the clear edge when `state.level === state.startDepth`** (✅ S2).
  ⛔ No "paid" flag is needed: `state.level` only rises, through `nextWell()`,
  and the `w` debug key changes `wellIndex` and never `level` (MEASURED,
  `23-main.js`). Level 1 pays 0.
- **The Start Depth list** — `C.START_DEPTH_FIRST` `[1, 3, 5, 7, 9]` and
  `C.START_DEPTH_CAP` 81, from a **session record of the highest level
  cleared**. The record is written at the clear edge.
  - ⛔ **It is NOT `state`.** It must survive `startGame()`, which resets
    `state` from `newState()`.
  - It lives in `src/22-meta.js`, the profiles and scores module, behind a
    function CS011 re-points at the profile store. ✅ S1.
- **Telemetry.** Delete `mode` and `startDepth` from
  `C.TELEMETRY_PLACEHOLDER`; the columns read `state.mode` and
  `state.startDepth`. Only `maxCombo` remains.

⛔ **No screen this phase.** Headless tests drive `startGame(seed, opts)`
directly. The Start Depth *screen* is P5's.

---

## 5. P4 — TEXT, THE HUD, AND THE DEATH FRAGMENTATION

**What ships.**

- **`drawText(ctx, str, x, y, size, color, align)`**, beside `glowStroke` in
  `13-render-well.js`, ⛔ **the only `fillText` / `strokeText` call site in the
  build**. Glow uses §10.2's two passes under `lighter`: `strokeText` at
  `C.GLOW_WIDE_W` / `C.GLOW_WIDE_ALPHA`, then `fillText` at full.
  `C.TEXT_FONT_FAMILY` is a monospace stack. `CLAUDE.md`'s Rendering rule
  gains one line naming the exception, and a source-text assertion pins the
  single call site.
- **`drawHud(ctx, view)` in `15-render-hud.js`**, taking an explicit view
  object with no state reach, so the HUD half of the module is kit-shaped too.
  The four corners follow GDD §10.4:

  | Corner | Content |
  |---|---|
  | Top-left | score |
  | Bottom-left | reserve craft icons, `lives − 1`, as small `SKIMMER_POLY` outlines (✅ H1) |
  | Top-right | "LEVEL n" in `wellBandColor(level, bandRoll)` (✅ H2) |
  | Bottom-right | Purge charge, bright / dim / none (§0 reading) |

  - **Insets (✅ H3).** Every item on the touch-button side (`C.INPUT_MIRROR`
    decides the side) shifts inward by `C.TOUCH_BUTTON_R × 2.5`, the button's
    far edge plus a margin.
  - ⛔ **The readability contract.** No HUD item may overlap
    `screenPos(depth < C.READABILITY_DEPTH)` on any of the sixteen wells.
    Asserted headless from the corner rectangles.
- **The death fragmentation (✅ U9)** is a kit-fx primitive in
  `14-render-entities.js`: `drawFragments(ctx, points, closed, t, color)`.
  - Each outline segment of the craft's own points drifts outward from the
    centroid by `C.FRAG_DRIFT × t`, spins by `±C.FRAG_SPIN × t` alternating by
    segment index, and fades as `1 − t`.
  - ⛔ **`t` is hit-stop progress**, `1 − Game.hitStopLeft / C.HIT_STOP_DEATH`,
    read in `draw()`. There is **no new clock and no RNG**. The freeze is when
    it plays, and `update()` is not running then.
  - `Game.draw()` draws fragments instead of the craft while `skimmer.dead`.
    Dive deaths fragment too.
  - ⛔ **`src/14-render-entities.NOTES.md` does not exist** (MEASURED, `ls src/`)
    although the file is `kit-fx`'s draft. P4 creates it, scoped to this
    primitive plus the existing glow helpers it reuses.

⛔ **Nothing in P4 is simulation.** P4 predicts no baseline moves.

---

## 6. P5 — THE SCREENS

**What ships.**

- **The flow**, as `state.screen` values: `title → mode → depth → play →
  gameover`, with `options` reachable from the title (P6 fills it in). ⛔ **The
  menu model is kit-shaped and lives in `15-render-hud.js`**, per `CLAUDE.md`'s
  kit table:
  - a screen is data — an item list, each item with a label, an enabled flag
    and an action name;
  - the module takes an input snapshot and returns an action name;
  - it never reads `state`.

  **`src/15-render-hud.NOTES.md` is born with it** (`kit-menu`).
- **`Game.update()`.** After `input.sample()`, every screen but `"play"` runs
  the menu step and returns. The simulation stop stays exactly where the
  game-over stop is today.
  - ⛔ **The menu step reads rising edges of `fire` and `purge`**, detected
    against "held last step" as `updatePurge()` does. The input struct stays
    four levels (GDD §9.5).
  - Rotate accumulates, and each whole `C.MENU_ROTATE_STEP` (1.0 lane) moves
    the selection one row: a keyboard tap is one row, and a mouse flick is
    several.
  - Esc backs out, through a named action.
- **Boot.** `screen = "title"` and no `startGame()` (§1.9). ⛔
  `newState().screen` **stays `"play"`**, and every closed test relies on it.
- **The screens.**
  - **Title** — PLAY / OPTIONS.
  - **Mode** — CLASSIC selectable, OVERDRIVE drawn dim and not selectable
    (✅ M1).
  - **Start Depth** — §4's list, each row with its bonus. ⛔ **No countdown**
    (GDD §4.6 house rule).
  - **Play** — `startGame(time seed, { mode, startDepth })`.
  - **Game over** — overlays the frozen board: SCORE, LEVEL, then RESTART and
    QUIT TO TITLE (✅ U2).
- ⛔ **The game-over menu is inert during the death freeze**, because
  `update()` does not run then. The "fresh run inherits no freeze" claim
  therefore holds by construction.
- **`quitToTitle()`** — no submission. ⛔ CS011 adds the `'quit'` submit, and
  GDD §15.4's "checked before that function overwrites the state" ordering is
  written at the function now, so CS011 inherits a correct seat.
- **The `restart` debug action and its `r` binding are deleted.**
  `test-cs003-p4.js:443–468` asserts `r` restarts from inside a freeze.
  Rewritten in place: the claims become that RESTART restarts, that the menu
  is inert during the freeze, and that the fresh run inherits no freeze. The
  three soaks' `FORBIDDEN` lists keep `"r"` (harmless, and still right).
- **Touch (PREDICTED, P5 measures first).** A tap confirms: auto-fire drives
  `fire` while a drag touch is down. ⚠ `touchStart` classifies touches by zone
  (rotation zone is the lower 40 %, buttons in the corners), so a tap in the
  upper screen may not produce `fire`. If it does not, the fix is a kit-input
  change, and P5 records it rather than inventing a second path.

⛔ **The two parked `PLAYTEST.md` asks — the six-kind board at 23 and the dim
band at 65 — become answerable at P5**, because both are odd depths ≤ 81. P5
un-parks them.

---

## 7. P6 — PAUSE AND OPTIONS

- **Pause (✅ U4).** A named action `pause` on Esc and `p`. Gamepad Start
  (standard index 9) and a touch pause target centred at the top edge feed the
  same action. **The page going hidden** (`visibilitychange`) queues it too.
  All sources live in kit-input **0.4.0** (MINOR), with a `.NOTES.md` entry.
  - Pause applies on `"play"` only, including during a dive and a death freeze.
  - ⛔ **A pause freezes the hit-stop drain too.** `Game.frame()` decrements
    `hitStopLeft` before `update()`, so a pause that only stopped `update()`
    would let the death freeze — and the fragmentation — run out under the
    menu.
  - PAUSE menu: RESUME / OPTIONS / QUIT TO TITLE. Purge and Esc back out, which
    resumes. ⛔ Resume is instant.
- **Options (✅ U5).** TELEMETRY (ON/OFF, the GDD §15.6 session switch — ⛔ off
  at every launch and never persisted), EXPORT TELEMETRY (`Telemetry.exportCsv()`,
  the `console.log` path), CONTROLS ›, CREDITS ›, BACK. Reachable from the
  title and from pause.
- **Credits (✅ U6).** `C.CREDITS_LINES`, placeholder: the title, "COINLESS
  GAMES", and `C.GAME_VERSION`. A carried task for Paul to replace before ship.
- ⛔ **GDD §0 has no row for screens, menus, pause or Options** — a defect by
  `CLAUDE.md`'s own rule. P5 adds **GDD §10.5 Screens and menus** and its §0
  row; P6 and P7 extend it.

## 8. P7 — THE CONTROLS PAGE

- **Rows (✅ U7).** MOUSE SENSITIVITY, TOUCH SENSITIVITY, LEFT-HANDED TOUCH,
  TOUCH AUTO-FIRE, KEYBOARD ›, GAMEPAD ›, RESET TO DEFAULTS (✅ U8), BACK.
  Session-only until CS011.
- **Sliders.** Rotate adjusts by `C.SENS_STEP` within
  `[C.SENS_MIN_MULT, C.SENS_MAX_MULT]` × the shipped constant. ⛔ The range is
  the flagged reading in §0, and P7 confirms it before shipping.
- **Rebinding.** KEYBOARD and GAMEPAD pages list the five device actions, two
  slots each. Confirm on a slot and the next key or button pressed is captured.
  A clash **swaps** (✅ U8). Esc, `p`, gamepad Start, the debug keys and the
  digits are refused.
- **kit-input 0.5.0 (MINOR).**
  - `configure(partial)` for `mouseSens`, `touchSens`, `touchAutofire` and
    `inputMirror`, validated with the same `inputRequire*` rules.
  - `setBindings(keys)` / `setGamepadButtons(map)`.
  - `captureNext(cb)`: the next key or button goes to `cb` and **not** into
    the struct.
  - ⛔ Game-agnostic. `.NOTES.md` entry. ⛔ **A remap must never bind a key
    that is also a named action**, which is `04-input.js`'s own header rule
    ("a key doing two jobs is a bug waiting for a player who rebinds").
- ⚠ **The mirror flag moves at runtime**, so P4's HUD inset reads it through
  the input module rather than off `C.INPUT_MIRROR`.

---

## 9. ⛔ THE BASELINE LEDGER

| Phase | Baseline | Cause — exactly one each | Status |
|---|---|---|---|
| **P1** | `test-cs006-p2.js` `P1_DETERMINISM_HASH` 3661952239 → **1862183225** | the rim fix (§1.4 decomposes it; ε alone does not move it) | MEASURED on the mutation. ⛔ P1 re-verifies on the built code; a different value means P1 built something other than §2 |
| **P1** | `test-cs004-p1.js` `GOLDEN_LANES` → **+2 entries `[…,3,2,5]`** | (B) — the climb stops at the kill band | MEASURED. ⛔ **The first 16 entries must not move**; the exception is written at the assertion |
| **P1b** | `test-cs006-p2.js` `P1_DETERMINISM_HASH` 1862183225 → **1229033515** | ⚠ two, each measured alone: the rim sweep (4203989832) and the three soaks' first-run `lives = 1` fixture (2859072280) | MEASURED (§1.16). ⛔ `GOLDEN_LANES` does not move under P1b |
| P2 | none | scoring spends no draw | PREDICTED from the §1.8 emulation; re-emulated on P1b's hashed run, best run 6,650 against 20,000 (§1.16) |
| P3 | none | defaults are bit-identical | PREDICTED |
| P4 | none | draw path only | PREDICTED |
| P5 | none | boot-to-title measured neutral | MEASURED for the boot change; PREDICTED for the menus |
| P6, P7 | none | input-side; no recorded input list presses a menu key | PREDICTED |
| P8 | none | — | — |

⛔ **What keeps P1's two re-records honest, and none needs a baseline.**
- `test-cs006-p5.js`'s draws-per-spawn count, green under the fix (MEASURED).
- `GOLDEN_LANES`' own 16-entry prefix.
- The ε-only mutation leaving the hash unchanged.
- `test-cs006-p2.js`'s three geometry goldens. PREDICTED untouched: no
  geometry changes.

---

## 10. ⛔ ACCEPTANCE CRITERIA

**P1.**
- S1, S2 and S4 kill 24/24 on the real build, on the Ring **and** on an open
  well.
- **Three mutations each turn the P1 test red:** ε removed (S1 → 18), (A)
  reverted (S1 → 18), `atRim()` left at 1.
- The §1.5 inventory repaired in place, including both vacuous `sawRim`s.
- The two re-records, each with its cause at the assertion.

**P1b.**
- §1.16's table on the real build, with a full rack (40 + p ticks): C1–C13 at
  24/24 killed, and N1–N3 at 24/24 died. Every run ends in one of the two.
- The open well is covered by C2 and C8 (the Vee); the rest run on the Ring.
- Non-vacuity: the rack is full at placement, C4 lands on exactly 6.5, and
  C7/C8 record 3 kills.
- **Four mutations each turn the P1b test red:** sweep removed, fire gate
  removed, depth gate removed, `e.dead = true` for `onShot`.
- `test-cs008-p1.js` green and unedited.
- The four fixture repairs, and the one re-record with both causes at the
  assertion.

**P2.**
- Every row of GDD §7 that Classic can produce, including Drifter thirds, Thorn
  per chip and Purge kills.
- Lives at exactly 20k, 60k and 100k; capped at `LIVES_MAX`.
- The three clear bonuses on the clear step; no-death survives a dive death.
- GDD §17 item 8 covered.

**P3.**
- `startGame(seed)` bit-identical.
- `startBonus` reproduces the corrected table.
- The bonus is paid exactly once, on the starting well's clear, and never if
  the run ends there.
- The list expands within a session and caps at 81.
- Three placeholder keys gone, `maxCombo` left.

**P4.**
- One `fillText`/`strokeText` site.
- No `fillRect`/`strokeRect`.
- HUD rectangles clear of the throat zone on all 16 wells and clear of the
  touch buttons in both mirror states.
- Fragmentation draws no `state.rng`, and is a pure function of hit-stop
  progress.

**P5.**
- Title → mode → depth → play → death → game over → restart and → quit, driven
  headless through the input sink on keyboard, mouse, gamepad and touch.
- OVERDRIVE not selectable.
- No `restart` action in the built file.
- 34-file suite still green.

**P6.**
- Pause from all four sources.
- Hit-stop does not drain while paused.
- Resume is instant.
- The telemetry toggle via menu equals the `t` key.
- Credits contain neither forbidden word (grep).

**P7.**
- Each setting changes behaviour live and resets.
- A swap leaves no action unbound.
- Reserved keys are refused.
- kit-input `VERSION` bumped twice across P6 and P7, with `.NOTES.md` entries.

**P8 — the close.** A sixth soak file, **front door to game over and back**:
- the menus into a run;
- scoring invariants on a played board (score never decreases, lives ≤
  `LIVES_MAX`, score equals the sum of events);
- the rim-arrival property on a played board;
- ⛔ zero skips.

---

## 11. ⛔ WHAT CS008 DOES NOT DO

- ~~**Rotating onto a rim-parked enemy** — ✅ R4, a playtest ask.~~ ⛔
  SUPERSEDED: P1b does it (§2b). What CS008 still does not do is K3's three
  exclusions (armour, bolts, a discharge below the rim).
- **Any sound**: the over-cap life sound, Options' Sound/Music row — CS009.
- **Persistence** of Start Depth, settings or bindings; **local top-10**;
  **leaderboard submission** — CS011. ⚠ `STATUS.md` said CS008 owns "the
  submission". `ROADMAP.md`'s CS011 row says leaderboard wiring, and this plan
  follows the row: CS008 builds the seat, not the submit.
- **Overdrive**, the combo HUD, splitting `07-enemies.js` — CS012.
- **First-run prompts, attract mode** — CS015.
- **The Dive's visual** — still unowned.
- **Name entry** — no GDD section asks for it before CS011's board.

## 12. RISKS

1. **Eight phases, against a stated 3–5.** Measured cost of splitting: 62
   pointers (§1.15). If P5 or P6 overruns a session, split at **P5/P6**, where
   the menu model exists and pause/Options/Controls sit on top of it.
2. **Touch in menus is unmeasured** (§6). It may need a kit-input change P5
   did not plan for.
3. **Pause × hit-stop** (§7). The drain is in `frame()`, not `update()`, and a
   test that drives `update()` directly will not see the bug.
4. **`fillText` cost on the 2021 phone target** — unmeasured, and GDD §17's
   perf gate is CS016's. PREDICTED small: the HUD is four short strings and
   menus are not in play.
5. **`STATUS.md` at 279 lines** before eight ledger lines. The ~400-line limit
   is reachable, and P5 is the phase to compress if it is close.
6. **`CLAUDE.md` at 29.8 KB**: the text exception and any screen rule fit
   under 50 KB.
7. **P1b's `CAPTURE_TICKS` 7,300 sits between two deaths 546 ticks apart.**
   A later change to what kills the capture's player at level 6 can move
   either one. The failure is loud: *"a column IS the counter"*, or *"the
   recorded list dies"*.
8. **P1b makes levels 1–4 deathless for a fire-holding player** (K2, MEASURED).
   Nothing in CS008 tunes that; the P8 playtest ask is the instrument.
   ⚠ PREDICTED: GDD §12's four-second promise is about a **passive** player, so
   it is untouched.

## 13. ASSUMPTIONS

| # | Assumption | What would change it |
|---|---|---|
| 1 | The float gap in §1.1 is IEEE-754 behaviour and identical in every browser | It is — `0.95` is not representable, on any conformant engine |
| 2 | Parked enemies 2–9 px inside the rim will read as "at the rim" | A playtest saying otherwise; the fix is visual only (draw at 1, collide at 0.95) and would be its own call |
| 3 | The session-only Start Depth record is acceptable until CS011 | A playtest sitting that reloads often; CS011 is the answer, not an earlier storage key |
| 4 | Menus need no new input struct field | P5's touch measurement |
