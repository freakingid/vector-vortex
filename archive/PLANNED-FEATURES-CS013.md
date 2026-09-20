# PLANNED-FEATURES-CS013 — Overdrive's tokens, the Warden, the Mimic on probation

**Overdrive gets its five tokens (Lance, Spread, Recharge, Bounty, Ward), its
second enemy (the Warden, which flies above the well and dies only to a Jump) and
its third (the Mimic, which sends your shots back and is on probation). The
eleventh soak closes it (GDD §14.1, §14.6, §6.4, §6.5, §7, §8.1, §10.3, §16.3,
§17, §19).**

⛔ **EVERY CLAIM IN THIS DOCUMENT IS MARKED MEASURED OR PREDICTED.** A MEASURED
claim names what was run (§1 lists the probes) and was run at commit `4704d2c`.
A PREDICTED one says so.

✅ **§0 IS ANSWERED: Paul took every recommendation (2026-09-17)**, including
every reading R1–R11. A phase prompt that names a call builds the recommendation
written beside it and does not re-open it.

**Baseline for every measurement: commit `4704d2c`** (CS012 P6, the close).
- `node build.js` → 25 modules + 3 inlined, `dist/vector-vortex.html`
  **670,746 bytes** (655.0 KiB).
- `node scratchpad/run-all.js` → **66 files passed, zero skips, exit 0, 123.1 s
  wall** (MEASURED this session).
- coinless-kit is at **`e2efed5`**. The Worker was not contacted.
- `CLAUDE.md` **39,650 bytes**; `STATUS.md` **403 lines** (MEASURED, `wc`).

**How the probes ran.** Everything lived in this session's scratchpad directory
and is gone. ⛔ **Nothing in this repository's `src/`, `scratchpad/`, `tools/` or
`lib/` was touched** (`CLAUDE.md` rule 3a).
- **A geometry probe** built the real `dist/` through `scratchpad/_harness.js`,
  and projected every lane centre of all sixteen wells through `screenPos()` and
  `wellCentroid()`, lifted outward as `skimmerPoints()` lifts the craft, against
  the world rectangle and `hudLayout()`'s rectangles (§1.5).
- **A kill-cadence probe** played Overdrive boards at Start levels 1, 6, 11, 16
  and 23, two seeds × 9,000 steps each, with two drivers: **held** is
  `test-cs008-p2.js`'s recorded fire-holding driver unchanged; **hunter** holds
  fire and turns toward the deepest live non-anchored non-bolt enemy at up to
  13 lanes/s. Kill sites were read by `buildGame({ mutate })` hooks on the four
  kill lines — instrumentation of the real code, never a copy (§1.3).
- **Three variant builds** were shared `git clone`s of `4704d2c`, each with one
  stand-in edit, and the whole suite was run in each (§1.2).
- **Arithmetic** on `C`: the Spread fire path as a step simulation of
  `updateShots()`'s shipped order, the reflected-shot timings, the jump's reach,
  and the hue gaps in the shipped palette (§1.6–§1.9).

**Read for this plan, beyond the prompt's list:** GDD §4.5, §5 (the Dive filter),
§7, §11.4, §11.8; `src/00-config.js` whole, `02-state.js`, `06-shots.js`,
`07-enemies.js` (the base, the bolt, the Thorn's `onShot`), `07-enemies-overdrive.js`,
`08-spawner.js`, `09-collision.js`, `10-powerups.js` (the placeholder),
`11-dive.js`, `12-scoring.js`, `15-render-hud.js`, `19-sfx.js`
(`reconcileSurgeTones`), `21-telemetry.js` (`telemetryRow`), `22-meta.js`
(`RECORD_MODES`, `startDepthOptions`), `23-main.js` (`enterWell`,
`respawnSkimmer`, `dangerInputs`, `update`, `draw`); `build.js`'s `MANIFEST`;
`scratchpad/_harness.js`, `test-registry.js`, and the closed assertions §11 names.
From `archive/`, only `PLANNED-FEATURES-CS012.md` (§0, §2, §9–§15) and
`IMPLEMENTATION-PHASES-CS012.md`, for their form. From `log/`, only CS012's
"Carried forward", plus the CS012 P5 "lift's geometry" paragraph, **read because
§1.5 needed to know how the lift is applied** (it is applied after projection,
in screen space, because `perspective()` caps depth at 1).

---

## ⛔ 0. PAUL'S CALLS — ✅ ALL ANSWERED 2026-09-17: EVERY RECOMMENDATION

Each is a design call the GDD does not settle, with its measurement and a
recommendation. ✅ **Paul took every recommendation.** ⚠ Every number marked ⚠ is provisional in the sense O16
used: owned by an art, audio or tuning pass, like the Classic palette.

| # | The call | Recommendation | Answer |
|---|---|---|---|
| T1 | Where a token lives, and how it reaches the board | A second array, `state.tokens`, and one entry point, `dropToken()`, in `10-powerups.js`. A token is not an enemy | ✅ As recommended |
| T2 | Which kills drop, how often, and whose draw | Every kill at a kill site rolls; ONE draw per Overdrive kill, from the run's one stream; p = `TOKEN_DROP_CHANCE` / (1 + threats) with 0.10 ⚠ — about one token per well | ✅ As recommended |
| T3 | The drop-weight table | A weighted pick off the SAME draw; Bounty 3, Lance 2, Spread 2, Ward 2, Recharge 1 ⚠ | ✅ As recommended |
| T4 | A token's life on the board | Born at the kill's depth and lane; rises at 0.30 ⚠ to `TOKEN_HOVER_DEPTH`; `age` counts up from the drop to `TOKEN_LIFE`; collected by a live craft in its lane while it hovers; faded below 0.25; a depleting ring | ✅ As recommended |
| T5 | What owns a token and an effect | The well: all end at the clear (`startDive()`), a death keeps them, and a duplicate does nothing more | ✅ As recommended |
| T6 | Bounty and Recharge | Bounty: `addScore(2000)`, unmultiplied, builds nothing. Recharge: `purgeUses = 0`, so "Purge unspent" pays again | ✅ As recommended |
| T7 | Lance | A shot that KILLS is not consumed; a Thorn chip takes 3 × `THORN_CHIP` and pays 5 per chip | ✅ As recommended |
| T8 | Spread | Three lanes (walls dedupe) under a cap of 3 × `SHOT_MAX` while it is on | ✅ As recommended |
| T9 | Ward | One hit, absorbed in `killSkimmer()` below the invulnerability guard; it starts the respawn's invulnerability window, is not a death, and is drawn as a stroked shell | ✅ As recommended |
| T10 | Tokens' look, and the HUD | One warm colour (hue 56°, `#FFF347` ⚠) and five glyphs; no HUD item — each effect shows where it acts | ✅ As recommended |
| T11 | Tokens' sounds | Two new events: `collect` and `wardBreak`. No drop cue | ✅ As recommended |
| W1 | How an off-well enemy is represented | In `state.enemies`, `(lane, depth)` like everything else. ALOFT IS A PHASE: `depth` 1, a ninth contract field `aloft`, and a draw-time lift | ✅ As recommended |
| W2 | How the Warden arrives | From the throat through its schedule row, climbing its lane unshootable, and lifting off at the rim | ✅ As recommended |
| W3 | How it "fires down" | It hunts along the rim and strikes its own lane with the Surger's fuse → discharge, as a `killDepth` mutation. No new collision code for its kill | ✅ As recommended |
| W4 | "Killable only by Jump" | A jump strike: an airborne craft in an aloft Warden's lane kills it — a FOURTH kill site. Shots and the Purge never | ✅ As recommended |
| W5 | Does a Warden hold the well open? | Yes (`blocksClear: true`) | ✅ As recommended |
| W6 | Peripheral visibility | Drawn lift 0.06 rim radii ⚠; its own blue (hue 222°, `#477EFF` ⚠); its fuse and strike reuse the Surger's two sounds | ✅ As recommended |
| MI1 | The Mimic's cycle, and "vulnerable only while firing" | Reflect-then-open: a shot is sent back once and opens it for 0.5 s ⚠; a shot while open kills it | ✅ As recommended |
| MI2 | The reflected shot | An enemy projectile, `MimicShot extends WeaverBolt`, at 60 % of shot speed; the Mimic holds at depth 0.40 ⚠ so every reflection has ≥ 0.45 s of flight | ✅ As recommended |
| MI3 | The probation's shape | One schedule row is the whole cut; flagged in GDD §19 and `SKIPPED-PLAYTESTS.md`; violet (hue 286°, `#D447FF` ⚠) | ✅ As recommended |

### T1 — where a token lives, and how it reaches the board

GDD §14.1: "Destroyed enemies occasionally drop a token that rises up its lane;
collect by touch; lasts the current well only." ⛔ GDD §6.5: "ONE array,
`state.enemies`… a second array doubles all six wiring points", and "ONE spawn
entry point, `spawnEnemy()`".

**MEASURED (§1.4): `state.enemies` has 19 reader sites.** A token inside it would
need an answer at eight of them, and three of the answers are wrong by default:
- `collideShots()` (`09-collision.js:103`) hit-tests it. A token has to decline
  the shot, and a declined shot still spends its step (the unconditional `break`,
  ⚠ SETTLED). So a hovering token would **shield the rim enemies behind it in its
  lane** for about two steps per shot (PREDICTED from `SHOT_TIME` 0.52 and
  `HIT_DEPTH_TOL` 0.05).
- `respawnSkimmer()` (`23-main.js:144`) pushes it. A token hovering at 0.80 would
  **drop to 0.55 on every player death**.
- `spawnEnemy()` (`08-spawner.js:152`, `:166`) refuses it at `ENEMY_CAP`, and
  spends one RNG draw on a heading it has no use for.
- `dangerInputs()` (`23-main.js:356`), `telemetryRow()` (`21-telemetry.js:185`)
  and `laneCrowded()` (`08-spawner.js:269`) count it as a threat, a live enemy and
  a crowded lane. `threatCount()`, `wellCleared()`, the Purge and `startDive()`
  could be answered with flags.

- **A — a second array, `state.tokens`, and one entry point, `dropToken(state, e)`
  (recommended).** `state.shots` is the precedent: the player's shots are a second
  entity array for exactly this reason. The token's own pass rises, ages,
  collects and expires it; `enterWell()` and `startDive()` empty it. `10-powerups.js`,
  the placeholder `MANIFEST` has carried since CS001, becomes the module (R1).
  The enemy contract, the 19 sites and `ENEMY_CAP` do not move (PREDICTED).
- **B — a token kind in `ENEMY_KINDS`, through `spawnEnemy()`.** It costs the
  eight answers above, three of them new exemptions in shipped passes.

### T2 — which kills drop, how often, and whose draw

GDD §14.1: "drop rate *falls* as enemy count rises", "⛔ cap `MAX_TOKENS` at 2",
and a "weighted seeded table".

**MEASURED (§1.3), Overdrive, both drivers, Start levels 1–23:**

| | held | hunter |
|---|---|---|
| Kills per cleared well | 16.0–19.3 | 15.5–18.9 |
| Median well length (s) | 14.9–20.7 | 12.9–15.5 |
| Kills by shot / Purge (both uses) / rim sweep | 65–88 % / 10–34 % / 2–10 % | 96–99 % / 1–4 % / 0 |
| Kills with **no** other threat left alive | 15–30 % | 27–65 % |
| **Tokens per cleared well**, p = 0.10 / (1 + threats) | **0.77–1.09** | **1.06–1.30** |
| … with p = 0.10 flat (no falloff) | 1.60–1.93 | 1.55–1.89 |
| … with p = 0.10 × (1 − threats / 4) | 0.85–1.29 | 1.26–1.42 |

**MEASURED (§1.2), a stand-in draw on every Overdrive kill:** the Classic suite
stays green — `P1_DETERMINISM_HASH`, `GOLDEN_LANES` and every Classic soak — and
three closed Overdrive files go red on assertions whose claim does not change
(§11).

- **Recommended:**
  - **Every kill at a kill site rolls** — a shot, the rim sweep, both Purge uses
    and W4's jump strike, bolts and a Thorn's last chip included. That is one
    rule, and it is O4's: the kill sites' existing false → true `dead` edge.
  - **Exactly ONE draw per Overdrive kill, whether or not anything drops**, and
    none in Classic (`modeHas("tokens")`, R3). The kind comes from the SAME draw,
    rescaled (T3). A board at `MAX_TOKENS` still spends it and discards the drop.
    "One draw per Overdrive kill" is then a count a test can make, as
    `test-cs006-p5.js` counts one per spawn.
  - **The run's one stream.** Tokens are simulation; `01-rng.js`'s one stream is
    what one seed reproduces.
  - **p = `TOKEN_DROP_CHANCE` / (1 + `threatCount(state)`)**, read after the
    victim is dead, with `TOKEN_DROP_CHANCE` **0.10** ⚠: about one token per
    cleared well for both drivers (table).
- Alternatives:
  - **A token stream of its own**, seeded from the run's seed. It would spare
    four closed repairs (§11: `test-cs012-p2.js`'s idle count and two wall-soak
    fixtures, `test-cs012-p4.js`'s ×1 fixture) and add a second simulation
    stream to `state` and a rewrite of `01-rng.js`'s one-stream header.
  - **Shot kills only** (a Purge rolls nothing). The held driver's Purges are
    10–34 % of its kills.
  - A flat p, or another falloff (table).

### T3 — the drop-weight table

⚠ GDD §14.1: "the budgeted-effect list and the drop-weight table are two
different tables answering two different questions. Do not conflate them." This
is the second table; T6–T9 are the first. §8 lays both out side by side.

- **Recommended: a weighted pick off T2's one draw.** `u = rng()`; a drop when
  `u < p`; the kind from `u / p` over `C.TOKEN_WEIGHTS` **{ bounty: 3, lance: 2,
  spread: 2, ward: 2, recharge: 1 }** ⚠ in that key order. Bounty is the common
  gift, and Recharge — a second full Purge — the rarest. "Weighted seeded table —
  not a fixed cycle, not pure random" reads as: weighted rather than uniform,
  seeded rather than platform-random, and drawn rather than cycled.
  ⚠ At about one drop per well, a Recharge falls about once in ten wells
  (PREDICTED, arithmetic).
- **Alternative: a shuffle bag** (a deck of the weights, reshuffled when empty).
  It guarantees variety, and a reshuffle spends a burst of draws at once, so a
  kill's draw count stops being one.

### T4 — a token's life on the board

GDD §14.1: tokens "hover at `depth 0.8` for a beat before expiring". §16.3:
"`token.age >= TOKEN_LIFE`… a depleting ring with no numerals". `C` has carried
`TOKEN_LIFE` 9.0 and `TOKEN_HOVER_DEPTH` 0.80 unread since CS001.

**MEASURED (§1.3): kills happen deep.** The median kill depth is 0.16–0.33, and
**44–55 % (held) and 64–86 % (hunter) of kills are below `READABILITY_DEPTH`**.
A token born where its enemy died is usually born in the throat zone (GDD §10.3).

**MEASURED (arithmetic): time to rise to 0.80 from a kill depth.**

| Rise ⚠ | from 0.00 | 0.16 | 0.25 | 0.33 | then hovers, of 9.0 s |
|---|---|---|---|---|---|
| 0.20 depth/s | 4.00 s | 3.20 | 2.75 | 2.35 | 5.0–6.7 s |
| **0.30** | **2.67 s** | **2.13** | **1.83** | **1.57** | **6.3–7.4 s** |
| 0.45 | 1.78 s | 1.42 | 1.22 | 1.04 | 7.2–8.0 s |

**MEASURED (§1.3): the hunter is in the kill's lane** (mean 0.07–0.38 lanes
away); the held driver is 2.1–2.9 lanes away. A human who kills what is in
their lane gets most tokens in their lane.

- **Recommended:**
  - Born at the victim's lane (rounded to a centre) and at `min(depth,
    TOKEN_HOVER_DEPTH)`. It rises at `C.TOKEN_RISE` **0.30** ⚠ to the hover
    depth and holds there. Its lane is written once, so it never hops.
  - `age` counts up from the drop; it expires at `age >= TOKEN_LIFE` (§16.3's
    expression, verbatim).
  - **Collected by touch:** a live craft whose lane is within `HIT_LANE_TOL` of a
    token that has reached the hover depth. A rising token cannot be collected.
    Airborne counts (a pickup is not contact with a killer).
  - Drawn faded below `READABILITY_DEPTH` with `shotAlpha()`'s linear fade — the
    shipped precedent for an object that is not a threat (GDD §10.3).
  - A **ring round the glyph depletes over `TOKEN_LIFE`** (polyline, the combo
    ring's precedent; no numerals, no blink).
- Alternatives: the clock starting at the hover; a rising token collectable; the
  craft required to be grounded.

### T5 — what owns a token and an effect

- **Recommended: the well.**
  - `enterWell()` and **`startDive()`** empty `state.tokens` and reset
    `state.powers`, so **the Dive is untouched** — no token rises through it and
    no Ward can absorb a Thorn strike. That is R4 of CS012 (the Dive is never
    airborne) applied to tokens.
  - **A death keeps them.** Tokens stay on the board and Lance and Spread stay on.
    It is the Purge charge's rule: re-armed on entry, never on death.
  - **A duplicate does nothing more.** A second Lance or Spread while it is on,
    or a second Ward while shelled, is collected (and sounds) and changes nothing.
- Alternatives: a death ends the lasting effects; a duplicate converts to a
  Bounty.

### T6 — Bounty and Recharge (the two instant tokens)

**MEASURED (§1.2): a stand-in unmultiplied +2,000 turns the two closed item-8
decoders red** (`test-cs012-p4.js`, `test-cs012-p6.js`: "an unmultiplied call
paid 2000"). Both need the new event priced, in place (§11).

- **Recommended:**
  - **Bounty:** `addScore(C.BOUNTY_POINTS)` (2,000, GDD §14.1) on collection.
    ⛔ **Not multiplied and builds nothing** — O4's rule (only kill points are
    multiplied, and what is multiplied is what builds). It can cross a
    milestone and pay a life, as any `addScore()` can.
  - **Recharge:** `state.purgeUses = 0`, so the Purge is at full strength and its
    HUD glyph is bright. ⚠ **The "Purge unspent" clear bonus (500) then pays
    again**, because `clearBonuses()` reads `purgeUses === 0` and a recharged
    charge is unspent. `tally.purgesSpent` does not move.
- Alternative: the unspent bonus keeps a record of any spend this well (a new
  field).

### T7 — Lance: "shots pierce; chips Thorns at 3×"

**MEASURED by reading:** a shot resolves against at most one enemy per step (the
unconditional `break`, ⚠ SETTLED, `09-collision.js`); `Thorn.onShot()` pays
`addScore(C.PTS_THORN)` once per chip (`07-enemies.js:903`), and that exact line
is a closed mutation string (`test-cs012-p4.js:607`, exactly once in the build);
both closed chip decoders price a Thorn by its LENGTH change, one call of 5 per
`THORN_CHIP` (`chipsOf()`, `test-cs012-p4.js:419`).

- **Recommended:**
  - **Pierce means "a KILL does not consume the shot."** One line in
    `collideShots()`: a shot is spent when `onShot()` says so, unless it pierces
    and the enemy died. A chip, a reflection or a refusal is not a kill, so
    those still consume or decline exactly as the enemy decides. The `break`
    stays unconditional; a pierced kill resolves one enemy per step and meets the
    next on a later step.
  - **A Lance chip takes `LANCE_CHIP_MULT` (3) × `THORN_CHIP` and pays
    `PTS_THORN` per chip of length** — three calls of 5, so "5 per chip" stays
    literally true and both closed decoders stay green unedited (PREDICTED from
    their code). The `addScore(C.PTS_THORN);` line stays one line in the build.
  - A shot carries `pierce`, set at fire time from `state.powers.lance`.
    ⚠ `Thorn.onShot()` becomes the first `onShot` that reads its argument; the
    rim sweep passes `null`, and a Thorn never reaches the sweep
    (`killDepth` null), which the phase asserts rather than assumes.
- Alternatives: pierce as "never consumed" (a Thorn would be chipped every step
  the shot overlaps it); a Lance chip paying one call of 15 (both closed decoders
  red, PREDICTED).

### T8 — Spread: "fires into the lane plus both neighbours"

⛔ GDD §17 item 4: "Shot cap — never exceeds `SHOT_MAX` under held fire."

**MEASURED (step simulation of `updateShots()`'s shipped order — age, filter,
then fire — at `SHOT_TIME` 0.52, `SHOT_COOLDOWN` 0.055, 60 Hz), held fire:**

| Cap under Spread | Facing lane | Left | Right |
|---|---|---|---|
| none (today, no Spread) | **15.0 /s** | — | — |
| `SHOT_MAX` 8, partial volleys | 5.64 | 5.64 | 3.76 |
| `SHOT_MAX` 8, whole volleys only | 3.76 | 3.76 | 3.76 |
| **3 × `SHOT_MAX` (24)** | **15.0** | **15.0** | **15.0** |

Under a cap of 8, Spread cuts the lane the player faces by 62–75 %.

- **Recommended: the cap is `C.SPREAD_SHOT_MAX` = 24 while Spread is on**, and
  item 4 reads "never exceeds the cap in force". Lanes `c − 1, c, c + 1` through
  `laneNormalize()`, **deduplicated** at an open well's wall (two shots, never
  two in one lane). ⚠ GDD §17's performance budget names "8 shots"; 24 is CS017's
  to measure.
- Alternatives: `SHOT_MAX` 8 with partial or whole volleys (table) — Spread then
  trades the facing lane for coverage.

### T9 — Ward: "one free hit, visible as a shell"

**MEASURED by reading:** every death — contact, the Surger's discharge, a bolt,
the Dive's Thorn — goes through `killSkimmer()` (`09-collision.js`), below its
invulnerability guard; `diveStrike()` calls it too (`11-dive.js`).

- **Recommended:**
  - The Ward is absorbed **in `killSkimmer()`, below the invulnerability guard**
    (a hit the guard declined does not spend it): the Ward is cleared,
    `state.invulnTime = 0`, `wardBreak` sounds, and the function returns.
  - **The respawn's invulnerability window, with its blink, and nothing else.**
    No rim push (nobody died), no life lost, no combo loss, `diedThisWell` stays
    false. The enemy that touched is still there; the player has
    `RESPAWN_INVULN` (1.5 s) to leave. ⛔ `SURGE_DISCHARGE < RESPAWN_INVULN`
    already covers a discharge running through the window.
  - **One at a time** (T5): a second Ward while shelled does nothing.
  - **The shell is a stroke** round the craft in the token colour, draw-time only.
- Alternatives: the Ward also pushes the rim like a respawn; the Ward kills what
  touched it (a fifth kill site, and the Surger's discharge has nothing to kill).

### T10 — tokens' look, and the HUD

GDD §14.1: "tokens use a warm palette no enemy uses". ⛔ STATUS: a token colour
that reaches for one of the enemy set's colours re-opens CS012's O16.

**MEASURED (§1.9), hue in the shipped palette (enemies and bands):** the warm
hues in use are 0° (Vaulter, Reaver), 9.2° (band Ember), 36.5° (Carrier), 38.7°
(band Amber), 73.7° (Weaver bolt) and 84.2° (Weaver). **The widest warm gap is
38.7° → 73.7°, 35° wide, centred on 56°**; the only other is 9.2° → 36.5°, 27°
wide. Five warm hues cannot fit with any separation.

**MEASURED (§1.5): the HUD is full where it matters.** The combo readout's
rectangle already covers the RIM's top lane-centres on six wells (F1).

- **Recommended:**
  - **One token colour, `C.TOKEN_COLOR` `#FFF347` (hue 56°) ⚠**, 17.5° from its
    nearest neighbours, and **five glyphs** by GDD §6.2's glyph rule (a miniature
    of the effect's own gesture): Lance a long needle, Spread a three-way fan,
    Recharge `PURGE_GLYPH_POLY` itself, Bounty a diamond, Ward an arc over a
    craft. Each inside T4's ring, which no enemy has.
  - The lasting effects are drawn in the same colour where they act: a Lance
    shot's streak and the Ward's shell. **Gold means yours.**
  - **No HUD item.** Recharge shows on the Purge glyph, Bounty on the score, Ward
    on the craft, Lance and Spread on the shots. `hudLayout()`'s rectangles do
    not move (PREDICTED), so the Classic four and CS012's two stay bit-identical.
- Alternatives: two warm colours (instant vs lasting); an effect row on the HUD.
  §1.5 measured a free band for one: y 680–696 between the reserve icons and the
  jump glyph clears the lifted craft (lowest point y 665.5).

### T11 — tokens' sounds

GDD §11.8 lists no token sound. **MEASURED by reading `test-cs009-p5.js:414`:**
every `sfx(` seat must name its event as a literal and pass nothing that writes
or draws; `test-cs009-p4.js:34`'s `EVENTS` list drives the key-list assertion
(`:111`), a recipe and 2–3 lab candidates per event (`:112`, `:132`), the lab's
event count and in-context sequences (`:144`, `:155`), and two more loops
(`:166`, `:191`).

- **Recommended: two new events, from `tools/sfx-lab.html` candidate A** —
  `collect` (one recipe for all five) and `wardBreak`. **No drop cue:** a drop
  happens on a kill, which already sounds. Neither dips the music.
- Alternatives: a pitch per token kind; an expiry cue.

### W1 — how an off-well enemy is represented

⛔ `CLAUDE.md`: "Every entity position is `(lane, depth)`, never a screen
coordinate." GDD §14.6: the Warden "flies above the well… killable only by Jump."
The Jump's own answer (CS012 P5, ⛔): **airborne is a phase, not a depth**, and
the lift is draw-time only.

**MEASURED by reading, three facts about a depth above 1:**
- `perspective()` clamps depth to [0, 1] (`03-wells.js:361`), so an entity at
  depth 1.2 is drawn ON the rim. CS012 P5 hit this and lifted the craft in
  screen space instead.
- `spawnEnemy()` clamps a spawn depth above 1 to 1 (`08-spawner.js:158`).
- GDD §6.1: "`depth > 1` remains an illegal position."

**MEASURED (§1.4): what a depth-1 entity meets at the 19 reader sites.**
`collideShots()` hit-tests it on every shot's first two steps (a shot is born at
depth 1), so an unshootable one shields the rim band of its lane. `respawnSkimmer()`
pushes it to 0.55. `purgeTarget()` prefers the deepest (`09-collision.js:378`),
so a purgeable Warden at depth 1 would take every second Purge.

- **A — in `state.enemies`; ALOFT IS A PHASE (recommended).**
  - Its `(lane, depth)` is its lane and **depth 1** — it hovers over that lane's
    rim point — and the lift is draw-time, as the craft's is.
  - **A ninth contract field, `aloft`**, false on every entity in the base,
    true on a Warden above the rim. **Two readers:** `collideShots()` skips an
    aloft entity (a shot never meets something above the well), and W4's jump
    strike requires one.
  - **No other site moves.** `collideSkimmer()` is `killDepth`'s (W3).
    `respawnSkimmer()` pushes an aloft Warden to 0.55 by GDD §4.4's ⚠ SETTLED
    clamp — its `depth` IS a position — and it climbs back and lifts off again,
    so the push needs no exemption. `dangerInputs()` reads it as a threat at
    depth 1. The Purge skips it on `purgeable` (W4); `startDive()` drops it on
    `anchored` (it is not a Dive survivor).
  - ⛔ **The build keeps exactly ONE two-depth comparison** (the dive strike):
    the jump strike is a lane match on two flags.
- **B — depth above 1.** It breaks §6.1's ⛔ and needs a new reading at
  `perspective()`, `spawnEnemy()`, `respawnSkimmer()`, `dangerInputs()` and every
  `killDepth` comparison.
- **C — a second bag, `state.wardens`.** It doubles the seven wiring points, and
  it is not through `C.SPAWN_SCHEDULE_OVERDRIVE` (⛔ `CLAUDE.md`: an Overdrive
  enemy reaches the board only through it).

### W2 — how the Warden arrives

**MEASURED by reading:** the interval spawner releases every scheduled kind at
depth 0, the throat (`updateSpawner()`, `08-spawner.js`).

- **Recommended: from the throat, climbing its lane, and lifting off at the rim.**
  - It climbs at `C.WARDEN_CLIMB` 0.18 ⚠ × `climbMult()` — 4.89 s throat→rim at
    L11, 4.77 s at L16 (MEASURED arithmetic, `climbMult(11)` 1.1366,
    `climbMult(16)` 1.1646).
  - **Unshootable throughout** ("killable only by Jump"): `onShot()` declines, so
    it shields its lane as it climbs, as a riding Drifter does. ⛔ It climbs in
    every phase, so it cannot park (GDD §6.1's squatter rule).
  - **Its body never kills on the way up** (`killDepth` null), so it passes
    through the rim band harmlessly and goes aloft at depth 1.
  - It is announced the way every threat in the game is: out of the throat, at
    the depth where the player has the most time (GDD §1.1 P2).
- Alternatives: shootable while climbing (the Jump becomes optional against it);
  flying in from off the well (a second entry point).

### W3 — how it "fires down"

**MEASURED by reading:** the Surger expresses GDD §4.5 item 3 as `killDepth`
mutated to 0 and restored by one writer, `setPhase()`, with no branch in the
collision pass; airborne immunity is `collideSkimmer()`'s whole-pass skip, so
any `killDepth` killer is immune-to by an airborne craft for free (GDD §6.5).

- **Recommended:**
  - **Aloft, it hunts** along the rim: one hop toward the craft every
    `WARDEN_HOP_INTERVAL` 0.9 s ⚠, each `WARDEN_HOP_TIME` 0.35 s ⚠, through
    `laneHop()` with its `dir` written back (⛔ §3.5). GDD §17 item 3's bound is
    `2 × DT / 0.35` = **0.0952 lanes per step** (MEASURED arithmetic). Heat never
    scales the hop (H2).
  - **It strikes its own lane on its own clock:** hover `WARDEN_HOVER` 1.6 s ⚠
    (the first one `WARDEN_ARM` 0.6 s ⚠ after lift-off), then **telegraph**
    `WARDEN_TELEGRAPH` 0.45 s ⚠ (the Surger's "visible fuse"), then
    **discharge** `WARDEN_DISCHARGE` 0.30 s ⚠, holding its lane through both.
    During the discharge its `killDepth` is the rim band `1 − RIM_CONTACT_DEPTH`
    (its depth is 1, so contact at the rim in its lane kills), restored by one
    writer. **No new collision code for its kill.** The rim sweep cannot save a
    firing craft (its `onShot()` declines).
  - ⛔ **`WARDEN_DISCHARGE < RESPAWN_INVULN`**, asserted from the constants, the
    Surger's rule. **MEASURED (arithmetic):** a Warden pushed to 0.55 on a
    respawn re-climbs in ≥ 1.79 s (L99) and needs `ARM` + `TELEGRAPH` more, so its
    first discharge comes ≥ 2.84 s after the respawn — past the window even
    without it.
  - Its cycle is 1.6 + 0.45 + 0.30 = **2.35 s, the Jump's 2.30 s cycle** (O6):
    one strike per jump.
  - **No heat accessor** (the seven stay seven): only its climb takes
    `climbMult()`.
- Alternatives: a falling projectile entity (a bolt with a draw-only fall); a
  strike gated on the craft being below it.

### W4 — "killable only by Jump"

⛔ GDD §7: "Three kill sites, and no fourth." ⛔ `CLAUDE.md` Scoring: the kill
lines read `addScore(e.points() * comboMult()); comboKill(state);`. The Jump
cannot fire (O6), so no shot, sweep or Purge can be the Jump's kill.

**MEASURED (arithmetic on `C`), the Jump's reach:** airborne `JUMP_TIME` 0.90 s at
full rotation — **10.77 lanes** on keys from a standstill (`KEY_SPEED_MIN` 4 →
`MAX` 14 over `KEY_RAMP` 0.35 s), 10.8 on a pad, unbounded on a mouse. The
farthest lane on a closed well is 8 away; on an open well up to 13 (Trough and
Double-Vee; the Vee 12). **So one ready jump reaches an aloft Warden almost anywhere, and the
longest wait for a ready jump is the 2.30 s cycle.**

- **Recommended:**
  - **The jump strike:** `jumpStrike(state, well)`, a third function in
    `updateCollisions()` after `collideSkimmer()`. While `jumpAirborne(state)`,
    every live `aloft` entity within `HIT_LANE_TOL` of the craft's lane dies.
    Rotating airborne sweeps through lanes, so one jump can take two.
  - **It is a FOURTH KILL SITE and a FIFTH kill line**, and it is O4's rule:
    `tally.kills++`, `addScore(e.points() * comboMult())`, `comboKill(state)`,
    T2's drop, `sfx("kill", e.sfxVoice)`. GDD §7 and `CLAUDE.md` are corrected.
    ⛔ Its text must not repeat any of `test-cs012-p4.js`'s six `COMBO_OUT`
    strings (each is found exactly once).
  - **Shots never** (W1). **The Purge never** (`purgeable: false`): "only by
    Jump", and a purgeable Warden at depth 1 would absorb every second Purge
    (`purgeTarget()`, MEASURED by reading). ⚠ GDD §17 item 5 ("first use clears
    all enemies and zero Thorns") becomes "all purgeable enemies".
- Alternative: the Purge's first use kills it too.

### W5 — does a Warden hold the well open?

- **Recommended: yes, `blocksClear: true`.** Every threat in the roster does; the
  Warden then counts against the concurrency ladder rather than adding pressure
  outside it; and the player can always shorten the wait (W4's measured reach).
  ⚠ **A driver that never jumps cannot clear a well with a Warden in it.** The
  closed item-8 plays at L13 and L23 do not jump (PREDICTED stall, §11), and the
  eleventh soak's driver must jump at Wardens (§7).
- Alternative: `blocksClear: false` — the Warden leaves at the clear
  (`startDive()` drops it), its 500 is a bonus, and it is pressure outside the
  ladder.

### W6 — peripheral visibility

⛔ GDD §14.6: "Must be visible in peripheral vision — an off-well enemy killing
you from where you weren't looking is the definition of unfair."

**MEASURED (§1.5), 233 lane centres on sixteen wells:**

| Drawn lift | Off-screen | Within 18 px of an edge | Inside the combo readout |
|---|---|---|---|
| 0 (the rim) | 0 | 0 | 10 |
| **0.06 rim radii (18 px)** | **0** | 7 | 11 |
| 0.12 (the Jump's apex) | **5** (Box 1–2, Cross 0–1, Fan 5; y −6) | 11 | 8 |

**MEASURED by reading `19-sfx.js:137`:** `reconcileSurgeTones()` holds the
Surger's charge voice for ANY entity whose `phase` is `"telegraph"` and that has a
`chargeTip()` — it is duck-typed, not a class check.

- **Recommended:**
  - **Drawn lift `C.WARDEN_LIFT` 0.06 ⚠**: nothing leaves the world, and the
    rising craft passes through its height on the way to 0.12. The top-lane
    overlap with the combo readout is accepted as provisional art (F1 is the
    same overlap on the craft itself).
  - **Its own colour, `C.WARDEN_COLOR` `#477EFF` (hue 222°) ⚠** — the centre of
    the widest gap in the palette (189.7° → 255.1°, 65°), and off the warm range.
  - **Its fuse and strike reuse the Surger's two sounds**: the fuse by naming its
    phase `"telegraph"` with a `chargeTip()` (the duck-typed voice), the strike by
    `sfx("surgeDischarge")`. The meaning is the same — "the rim of this lane is
    about to be lethal; leave or jump" — and so is the answer. ⚠ SETTLED: the
    charge tone is a gameplay cue; this is a second entity it cues, not a
    change to it.
  - Drawn during the fuse: a **beam** from the lifted Warden to the rim of its
    lane, growing as the fuse runs (the Surger's fuse, drawn short).
  - Kill voice `warden`, pitch from sfx-lab's KILL PITCH table.
- Alternatives: the Jump's full 0.12 lift; a distinct fuse and strike sound (a
  second held-voice map in `19-sfx.js`); constraining the Warden's lanes by
  screen position (2-D geometry in entity logic, ⛔).

### MI1 — the Mimic's cycle, and "vulnerable only while firing"

GDD §14.6: "reflects shots; vulnerable only while firing… Reflected shots are
colour-shifted, larger, and 60% speed… **cut it without ceremony if it reads as
cheap.**"

**MEASURED (§1.6's step simulation, §1.7): held fire meets a Mimic 15 times a
second** (one shot per 4 steps; `SHOT_MAX` does not bind at depth 0.2–0.4). A
Mimic that reflected every shot would fill `ENEMY_CAP` (16) in about a second.

- **(a) Reflect-then-open (recommended).** From birth it is closed (guarding). A
  shot that reaches it is consumed and **sent back once** (one `MimicShot`, MI2),
  and the Mimic **opens for `MIMIC_OPEN_TIME` 0.5 s ⚠ — "firing"**. A shot that
  reaches it while open kills it; a Purge kills it any time (`purgeable: true`,
  the Drifter's precedent: "shots only while crossing; Purge anywhere"). Under
  held fire the next shot lands about 0.1 s later (PREDICTED: 4 steps, plus up to
  2 steps declined by the crossing `MimicShot`), so **a Mimic costs exactly one
  reflection**. It climbs at `MIMIC_CLIMB` 0.16 ⚠ × `climbMult()` to
  `MIMIC_APEX` 0.40 ⚠ and holds there, one lane, never hopping; its body never
  kills (`killDepth` null).
- **(b) Its own fire cycle.** It reflects (budgeted) while closed, and on its own
  clock it opens and fires a shot of its own up the lane. Two threats, one
  window.
- **(c) Reflect everything.** Unbounded — 15 reflections a second. Not
  recommended.

The open/closed read uses GDD §12's language, **SOLID = ARMOURED · OPEN =
VULNERABLE**: two polys, closed and open, differing on stroke width and alpha
(the Drifter's three channels, and its headless gate).

### MI2 — the reflected shot

**MEASURED (arithmetic):** a player shot moves 1 / 0.52 = **1.923 depth/s**; 60 %
is **1.154 depth/s**. From a reflection depth to the kill band (0.95):

| Reflected at | 0.20 | 0.30 | **0.40** | 0.431 | 0.50 | 0.60 | 0.75 |
|---|---|---|---|---|---|---|---|
| Flight to the band | 0.650 s | 0.563 | **0.477** | 0.450 | 0.390 | 0.303 | 0.173 |

**The deepest a Mimic may reflect from and still give the Surger's 0.45 s fuse is
0.431.** A Mimic that climbed to the rim would reflect with ~0.1 s to spare.

- **Recommended:**
  - **An enemy projectile in `state.enemies`**: `class MimicShot extends
    WeaverBolt` (a parameter variant subclassing its parent, the Reaver's
    precedent), with an overridable speed reader on the bolt so a Classic bolt's
    arithmetic is bit-identical. It enters through `spawnEnemy("mimicShot",
    lane, depth)` from inside `collideShots()` — the Carrier split's ⚠ SETTLED
    path (an index loop, the unconditional `break`, the end-of-frame filter).
  - Its contract is the bolt's: rim-band `killDepth`, `blocksClear: false`,
    `purgeable: true`, **not shootable** (the bolt's ⚠ SETTLED answer: dodged,
    not answered), self-terminating the step after depth 1, and **not a Dive
    survivor** (GDD §6.5's seventh point, the bolt's answer).
  - **Speed `MIMIC_SHOT_RATIO` 0.6 × (1 / `SHOT_TIME`)**, never heat-scaled (H2).
    **MEASURED (arithmetic):** pushed to 0.55 on a respawn it reaches the band in
    0.347 s and self-terminates at 0.390 s + 1 step, both inside
    `RESPAWN_INVULN` — safe by self-termination, the bolt's argument. ⛔ A
    reflected shot slower than 0.30 depth/s would breach it.
  - ⛔ **`MIMIC_APEX ≤ 0.95 − SURGE_TELEGRAPH × the reflected speed`**, i.e.
    0.431, asserted from the constants. A reflection below the
    apex (a climbing Mimic) only has longer.
  - "Colour-shifted, larger": the player's streak drawn at 2 × `SHOT_LEN` and 2 ×
    width ⚠ in the Mimic's colour — the player's own shot, turned.
- Alternative: reversing a player `Shot` in `state.shots`. It needs a new branch
  (`collideSkimmer()` reads only `state.enemies`, `09-collision.js:238`) and
  counts hostile shots against the player's `SHOT_MAX` (`06-shots.js`).

### MI3 — the probation's shape

- **Recommended:**
  - **One schedule row is the whole cut.** Removing `{ level: 16, kind: "mimic" }`
    removes every Mimic from play; P4 asserts it with that row mutated out.
    ROADMAP's cut order already puts the Mimic second.
  - GDD §19's "Mimic present and flagged for playtest" is met by the row, the
    tests and a `SKIPPED-PLAYTESTS.md` entry ("does a reflected shot read as
    cheap?"). The verdict is CS017's (GDD §21 #6).
  - **`C.MIMIC_COLOR` `#D447FF` (hue 286°) ⚠**, the centre of the 259.5° →
    313.3° gap (54°); its shots are that colour. Kill voices `mimic` and
    `mimicShot`, and one new event, `reflect`, from sfx-lab candidate A — a
    hostile shot coming up your lane must be heard (GDD §1.1 P2).
- Alternative: teal (hue 162°, `#47FFC8`), the other 54° gap.

### Findings for Paul — not calls

- **F1 — the combo readout already covers the RIM on six wells.** MEASURED
  (§1.5): its rectangle (x 566.6–713.4, y 6–70) contains **10 of 233 rim
  lane-centres** — Ring 0 and 15, Cross 0 and 1, Pinwheel 0, Clover 0 and 15,
  Fan 4–6. A craft (or a rim enemy) in those lanes is drawn under `×N`. CS012 P4
  measured only the throat zone (GDD §10.3), which it clears. Not CS013's to fix
  unless Paul says.
- **F2 — the Jump's lift leaves the world on five lanes.** MEASURED (§1.5): at
  its 0.12 apex the lifted rim point is off-screen on Box 1–2, Cross 0–1 and
  Fan 5 (to y −6). CS012 P5's; recorded.
- **F3 — `AUDIO_VERSION` is pinned by literal in FOUR closed files**, not the
  three `STATUS.md` counts: `test-cs009-p1.js:100`, `test-cs009-p4.js:100`,
  `test-cs010-p1.js:40` and `test-cs012-p5.js:440` (MEASURED, grep). CS013 bumps
  no kit (R5), so none moves.
- **F4 — `drawShot()` allocates an array on every call** (`[_shotHead,
  _shotTail]`, `14-render-entities.js:43`; MEASURED by reading). GDD §17's budget
  forbids per-frame allocation in the hot path, and T8 triples the shots.
  CS017's to measure.
- **F5 — the held driver dies far more at Overdrive L11–16** (32 and 37 deaths
  in ~4.6 minutes, against 1–4 at L1, 6 and 23; MEASURED §1.3). The Reaver and
  the Drifter are both live there. A bot, not a player.

### ⚠ Readings this plan takes and flags

Each follows from the GDD, a shipped rule or a measurement. ⛔ **If Paul objects
to one, the phase that builds it stops.**

- **R1 — `10-powerups.js` becomes the token module.** `MANIFEST` already lists it
  between `09-collision.js` and `11-dive.js` (MEASURED, `build.js:59`); no test
  pins its placeholder text (MEASURED, grep). Nothing is added to `MANIFEST`.
- **R2 — Two `state` fields, `tokens` (an array) and `powers`
  (`{ lance, spread, ward }`)**, reset by `newState()`. `STATE_FIELDS.CS013:
  ["tokens", "powers"]`, P1.
- **R3 — A mode flag, `tokens`**, in each row of `C.MODE_FLAGS` (false / true),
  read by `modeHas("tokens")`. ⛔ **A field in the rows, never a new top-level
  key**: `22-meta.js:505` derives `progress`'s modes from `Object.keys(C.MODE_FLAGS)`
  (MEASURED by reading). The Warden and the Mimic are schedule rows, not flags.
- **R4 — No telemetry column and no `tally` field.** `TELEMETRY_FIELDS` stays at
  29 and `telemetry` at v1; the leaderboard's stats keys do not move, so the
  registry is not read anew. What CS015's achievements need is CS015's.
- **R5 — No kit module is edited and no `VERSION` bumps.** New sounds are `C.SFX`
  data; the held-voice path exists (`Sfx.hold`). kit-audio stays 0.4.0, so the
  four pins in F3 and the signal-path pins do not move.
- **R6 — The Warden's and the Mimic's climbs take `climbMult()`** (GDD §8's
  "climb speed", singular). `test-cs007-p2.js:476`'s `CLIMBS` list gains each,
  in place, because `:505` asserts one call site per entry. **Neither is a
  contact climb** (`killDepth` null while climbing), so `CONTACT_CLIMBS`
  (`:65`), `CLIMB_MAX_BASE` and the respawn guarantee do not move (PREDICTED).
- **R7 — Every new cycle constant is flat.** No eighth heat accessor.
- **R8 — Each new sound is sfx-lab's candidate A**, and `C.SFX` and
  `C.SFX_KILL_PITCH` stay the lab's BLOCK SFX (⛔ `CLAUDE.md`). Each event stays
  one line starting `    name:`.
- **R9 — No bench key** for any of the three (CS012's O16). START DEPTH shows
  them.
- **R10 — Neither new enemy owes GDD §17 item 13 or 14.** Item 13 is about an
  enemy that ARRIVES at the rim and that a shot can kill; the Warden cannot be
  shot and passes the band harmlessly, the Mimic never reaches it, and a
  `MimicShot` is the bolt's case. ⛔ **If an answer changes that** (a shootable
  Warden, a Mimic that climbs to the rim), the item-13 test is owed and must
  mutate the sweep AND ε together (STATUS; `test-cs012-p2.js` §9's form).
- **R11 — The full drop-weight table ships in P1** (§2): a pickup of a lasting
  token in P1 sets its `state.powers` flag, which P2 gives its readers. A table
  that grew between phases would move P1's own drop sequences.

---

## 1. ⛔ WHAT THIS SESSION MEASURED

### 1.1 MEASURED — the baseline

`node build.js` (25 modules + 3 inlined, 670,746 bytes) and `node
scratchpad/run-all.js` (66 files, 0 skips, 123.1 s) at `4704d2c`. Working tree
clean but for Paul's own `vector-vortex-human-notes.txt`, which this plan does
not touch or commit.

### 1.2 MEASURED — three variant builds, the whole suite in each

| Variant | The stand-in edit | Red |
|---|---|---|
| V1 | Two rows in `C.SPAWN_SCHEDULE_OVERDRIVE` at 11 and 16 (kind `vaulter`, standing in for the Warden and the Mimic) | **2 files**: `test-cs012-p2.js` (4) — the one-row literal `:92`, the written-out table at L11+ `:96–102`, the L13 answer `:124`, and the `ROW`-mutated fixture `:595`; `test-cs012-p4.js` (2) — its clear-bonus mutants at L13 read GREEN (the 2,500-step window no longer holds a clear) |
| V2 | One `state.rng()` on every Overdrive kill, and a +2,000 unmultiplied `addScore` on one kill in ten (a drop roll and a Bounty, standing in) | **3 files**: `test-cs012-p2.js` (3) — "a tick that spawned nothing spends nothing (got 20)", and the Trough and Double-Vee wall soaks lost their precondition (0 wall-steps); `test-cs012-p4.js` (4) — item 8 "an unmultiplied call paid 2000", the mutation window's own fixture, "the Overdrive run reached ×1", and a staged Purge-2 price (a stand-in artefact: the real Bounty pays on collection, not on a kill); `test-cs012-p6.js` (2) — its item 8 and "each session cleared past its staged record (27 / 13)" |
| V3 | V1 + V2 | **3 files**: the union, except `test-cs012-p6.js`'s cleared-past-13, which held (it is seed-fragile) |

⛔ **In all three, every Classic file is green — `test-cs006-p2.js`
(`P1_DETERMINISM_HASH`), `test-cs004-p1.js` (`GOLDEN_LANES`) and all ten soaks.**
Overdrive-gated changes do not reach Classic (MEASURED). The director's
Overdrive maximum, which `test-cs012-p4.js` and `-p6.js` record without
asserting (only `< 1`), moved to 0.5976–0.6593 (MEASURED; recorded, not a claim).

### 1.3 MEASURED — Overdrive kill cadence

Two drivers (header), Start levels 1, 6, 11, 16, 23; per level two seeds × 9,000
steps; a game over restarts at the same level.

| Driver @ Start | Kills | Clears | Deaths | Kills/clear | Median well s | Shot / Purge / sweep | Below 0.25 | Mean lanes from craft |
|---|---|---|---|---|---|---|---|---|
| held @1 | 224 | 14 | 3 | 16.0 | 16.9 | 196 / 23 / 5 | 54.9 % | 2.08 |
| held @6 | 195 | 12 | 1 | 16.3 | 17.6 | 158 / 23 / 14 | 48.2 % | 2.20 |
| held @11 | 112 | 7 | 32 | 16.0 | 16.3 | 74 / 31 / 7 | 43.8 % | 2.53 |
| held @16 | 116 | 6 | 37 | 19.3 | 14.9 | 75 / 39 / 2 | 46.6 % | 2.89 |
| held @23 | 200 | 11 | 4 | 18.2 | 20.7 | 159 / 21 / 20 | 47.0 % | 2.07 |
| hunter @1 | 275 | 16 | 2 | 17.2 | 15.5 | 272 / 3 / 0 | 82.9 % | 0.07 |
| hunter @6 | 275 | 17 | 3 | 16.2 | 14.4 | 266 / 9 / 0 | 85.8 % | 0.11 |
| hunter @11 | 279 | 18 | 4 | 15.5 | 13.5 | 271 / 8 / 0 | 82.1 % | 0.20 |
| hunter @16 | 299 | 18 | 4 | 16.6 | 13.3 | 286 / 13 / 0 | 69.6 % | 0.30 |
| hunter @23 | 341 | 18 | 4 | 18.9 | 12.9 | 331 / 10 / 0 | 64.2 % | 0.38 |

Threats alive at a kill (after the victim), share with none: held 15–30 %,
hunter 27–65 %. T2's tokens-per-well table is these histograms times each
candidate curve. ⚠ **A bot is not a player** (K11).

### 1.4 MEASURED — the readers of `state.enemies`

A grep of `src/` at `4704d2c`, comment lines excluded: **19 sites** —
`08-spawner.js` `threatCount` `:111`, `spawnEnemy` `:152` / `:168`,
`laneCrowded` `:269`, `wellCleared` `:350`; `09-collision.js` `collideShots`
`:103`, `collideSkimmer` `:238`, `purgeTarget` `:374`, `updatePurge` `:428`;
`11-dive.js` `startDive` `:84`, `diveHazard` `:123`; `07-enemies.js`
`thornInLane` `:932`; `21-telemetry.js` `telemetryRow` `:185`; `23-main.js`
`enterWell` `:54`, `respawnSkimmer` `:144`, `buildLaneState` `:295`,
`dangerInputs` `:356`, the entity pass `:1579`, the filter `:1591`, the draw
`:1645`, and `reconcileSurgeTones` `:1851`. T1 and W1 price against this list.

### 1.5 MEASURED — lifted positions against the world and the HUD

233 lane centres (the sixteen wells' lane counts); the rim spans x 340–940,
y 30–630. `hudLayout()` at the widest readings: combo x 566.6–713.4, y 6–70;
level x 977–1116, y 24–52; the jump glyph y 666–696. A point lifted L rim radii
outward from the well's centroid, as `skimmerPoints()` lifts the craft:

| L | px | Off-screen | Within 18 px of an edge | In the combo rect (pad 0 / pad 18) |
|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 10 / 15 |
| 0.06 | 18 | 0 | 7 | 11 / 15 |
| 0.12 | 36 | 5 | 11 | 8 / 15 |
| 0.20 | 60 | 13 | 17 | — / 8, and 1 in LEVEL |

The lowest lifted point at 0.12 is y 665.5 (T10's free band sits below it).

### 1.6 MEASURED — the fire path under Spread

T8's table: a step simulation of `updateShots()`'s shipped order and constants
over 6,000 steps. ⚠ A model of the fire path, not the build; P2 asserts the
built rates.

### 1.7 MEASURED — the Mimic's numbers

MI2's table, and the held-fire rate: one shot per 4 steps (15 /s leaving the
rim, §1.6), with 5.7–7.6 in flight on the way to a Mimic at 0.2–0.4 — under
`SHOT_MAX` — so all 15 per second arrive. The respawn arithmetic in MI2.

### 1.8 MEASURED — the Jump against the Warden

W4's reach (10.77 lanes on keys, 10.8 on a pad, in one 0.90 s jump) and W3's
cycle (2.35 s against the Jump's 2.30 s). The Overdrive eligible set is 5 at
L11 and 6 at L16 today (MEASURED, `eligibleKinds`); with the two rows it is 6 at
L11, 7 at L13, 8 at L16, 9 at L18 and 10 from L23, so a Warden is 1/6 of
releases at L11–12 and the Mimic 1/8 at L16–17 — about 1.7 and 1.25 per well of
ten releases (PREDICTED, arithmetic; Carrier children are not picks).

### 1.9 MEASURED — the palette's hue gaps

Hue of every enemy and band colour in `C`: Vaulter/Reaver 0°, Ember 9.2°,
Carrier 36.5°, Amber 38.7°, bolt 73.7°, Weaver 84.2°, Green 134.7°, Surger
188.9°, Cyan 189.7°, Thorn 255.1°, Violet 259.5°, Magenta 313.3°, Drifter 320°.
Gaps: 38.7→73.7 (35°, warm), 9.2→36.5 (27°, warm), 84.2→134.7 (50.5°),
134.7→188.9 (54°), **189.7→255.1 (65°, the widest)**, 259.5→313.3 (54°),
320→360 (40°). T10's `#FFF347` is 56.1°; W6's `#477EFF` 222.1°; MI3's `#D447FF`
286.0°.

### 1.10 MEASURED — the closed pins read for §11

By reading: `test-cs012-p2.js:52` (the `MODE_FLAGS` literal), `:92`, `:96–102`,
`:124`, `:157–187` (the draw counter), `:440–470` (the wall soaks), `:525` (the
sweep line, ⛔ untouched by this plan), `:595`; `test-cs012-p4.js:46` and
`test-cs012-p6.js:63` (`gddPoints`), `test-cs012-p4.js:419` (`chipsOf`), `:436`
(item 8), `:585` (the mutation window), `:607` (the Thorn's pay line), `:655`
(`COMBO_OUT`), `:1083` (the ×1 fixture); `test-cs012-p6.js:761`;
`test-cs009-p4.js:34–37`, `:111`, `:117`, `:144`, `:155`; `test-cs009-p5.js:84`
(a fixed Classic `ROSTER`, no edit), `:93`, `:414`; `test-cs007-p2.js:65`,
`:476`, `:505`; `test-cs004-p5.js:388` and `test-cs005-p5.js:400`
(`PROJECTILE_CLASSES`); `_harness.js:197` (`mutate` throws unless its string is
in the build exactly once).

---

## 2. THE SHAPE

**Five phases, one session each.** ROADMAP's guideline is 3–5; CS009, CS011 and
CS012 each held six.

| Phase | Builds | Depends on |
|---|---|---|
| **P1** | Tokens: `state.tokens`, `dropToken()` at every kill site, both tables as data, the life on the board, the look, `collect`; Bounty and Recharge | T1–T6, T10, T11 |
| **P2** | The lasting tokens' effects: Lance, Spread, Ward (`wardBreak`) | T7–T9 |
| **P3** | The Warden: `aloft`, the climb, the hunt, the strike, the jump strike, the lifted draw, its row at 11 | W1–W6 |
| **P4** | The Mimic and the `MimicShot`, `reflect`, its row at 16 | MI1–MI3 |
| **P5** | The eleventh soak, the review, the close | all |

**Why five, and why these seams.**
- **The tokens split at GDD §14.1's own seam** — the drop-weight table and the
  budgeted-effect list. P1 is the table, the entity and the two instant effects
  (nothing that lasts); P2 is the three effects with a budget, and each of them
  edits a hot, pinned path (the fire gate, the collision line, `killSkimmer()`).
  One phase for all five would put three hot-path edits beside a new entity.
- **One enemy per phase** — CS005's P2/P3 and CS012's P2. The Warden brings a
  contract field and a kill site; the Mimic brings a projectile subclass and a
  pinned roster derivation. Neither shares a file edit with the other beyond
  the schedule table.
- **P2 before P4, so the Mimic is written knowing what Lance does** (T7: a
  reflection is not a kill, so a Lance shot is consumed by it). **P3 after P1,
  so the jump strike is written with T2's drop in it** rather than a later phase
  editing five kill lines.
- **The Mimic is the last feature phase**, so ROADMAP's second cut is one
  unbuilt phase or one reverted commit, and P5 can close without it.
- **Six was considered** — the Warden split into its climb and its strike, or
  the soak apart from the close. Neither half would ship an entity that is
  correct on its own, and CS012 P6 held the soak and the close in one session.

---

## 3. P1 — tokens: the table, the entity, the two instant ones

- `C`: the token group — `TOKEN_DROP_CHANCE`, `TOKEN_WEIGHTS`, `TOKEN_RISE`,
  `BOUNTY_POINTS`, `TOKEN_COLOR`, `TOKEN_SIZE`, `TOKEN_RING_SEG`, and the
  budgeted-effect list's constants (§8); `MODE_FLAGS` gains `tokens` (R3).
  `MAX_TOKENS`, `TOKEN_LIFE` and `TOKEN_HOVER_DEPTH` get their first readers.
- `02-state.js`: `tokens`, `powers` (R2).
- `10-powerups.js`: `dropToken(state, e)` (T2, T3), `updateTokens(state, well,
  dt)` (T4: rise, age, collect, expire, filter), the pickup (T6; lasting tokens
  set `state.powers`, R11), `resetTokens(state)`.
- `09-collision.js`: `dropToken(state, e)` on each of the four kill lines, on
  the false → true edge beside `comboKill()`. `test-cs012-p4.js`'s `COMBO_OUT`
  is repaired in place (§11).
- `23-main.js`: `enterWell()` resets; `updateTokens()` once per play step after
  the collision pass and the filters; drawn after the well and BEFORE the
  enemies, so a gift is never drawn over a threat (GDD §1.1 P2).
- `11-dive.js`: `startDive()` resets (T5).
- `14-render-entities.js`: `drawToken()` and the five glyphs; ⛔ `entityPoints`
  + `drawPoly` + `glowStroke`, no fill (`test-cs002-p3.js` bans `ctx.fill` here).
- `tools/sfx-lab.html` and `C.SFX`: `collect` (T11).

## 4. P2 — Lance, Spread, Ward

- `06-shots.js`: Spread's three lanes and T8's cap; `Shot` carries `pierce`.
  ⛔ The mutation pin `state.input.fire && jumpCanFire(state) &&` stays exactly
  once (`test-cs012-p5.js:196`).
- `09-collision.js`: T7's one line. ⛔ The sweep line `:525` pins and the
  `COMBO_OUT` strings are untouched.
- `07-enemies.js`: `Thorn.onShot()` — T7's chip, keeping `    addScore(C.PTS_THORN);`
  once (`test-cs012-p4.js:607`).
- `09-collision.js` `killSkimmer()`: T9, below the guard; ⛔ the `COMBO_OUT`
  string `"\n  comboDeath(state);\n"` stays exactly once.
- `05-skimmer.js` / `14-render-entities.js`: the shell and the Lance streak.
- sfx-lab and `C.SFX`: `wardBreak`.

## 5. P3 — the Warden

- `07-enemies.js`: the base gains `aloft = false` (the ninth field; GDD §6.5's
  table and the base's header both grow a row).
- `07-enemies-overdrive.js`: `class Warden extends Enemy` (§9).
- `08-spawner.js`: `ENEMY_KINDS.warden`. `00-config.js`: the Warden group, the
  row `{ level: 11, kind: "warden" }`, `SFX_KILL_PITCH.warden`, `PTS_WARDEN`'s
  first reader.
- `09-collision.js`: the `aloft` skip in `collideShots()` and `jumpStrike()` in
  `updateCollisions()` (W4).
- `14-render-entities.js`: `drawWarden()` — climbing, aloft (lifted), the beam.
- `test-registry.js`: `enemies: 8`, `enemyKinds: 11`.

## 6. P4 — the Mimic

- `07-enemies.js`: the bolt's speed becomes an overridable reader (a Classic
  bolt bit-identical).
- `07-enemies-overdrive.js`: `class Mimic extends Enemy`, `class MimicShot
  extends WeaverBolt` (§9).
- `08-spawner.js`: `mimic`, `mimicShot`. `00-config.js`: the Mimic group, the
  row at 16, three kill pitches' two new keys, `PTS_MIMIC`'s first reader.
- `14-render-entities.js`: the Mimic's two polys and the reflected streak.
- sfx-lab and `C.SFX`: `reflect`.
- `test-registry.js`: `enemies: 9`, `enemyKinds: 13`.

## 7. P5 — the eleventh soak, the review, the close

`scratchpad/test-cs013-p5.js`, ⛔ **a new file, never a closed one widened**, in
`test-cs012-p6.js`'s form: one front-door driver from the title.
- **Classic untouched:** one Classic session (Start Depths 1 / 13 / 23, RESTART,
  a pause, QUIT) played as is and with `{ stub: ["dropToken", "updateTokens",
  "jumpStrike"] }` and the two new rows mutated out. ⛔ **Same hash every frame.**
- **The sounds cannot steer Overdrive:** one Overdrive session (Start Depths 1 /
  11 / 17 off a staged record, a driver that jumps at aloft Wardens and dodges a
  `MimicShot`, Purges, dives, RESTART, a pause) on the recording fake and with no
  audio API. ⛔ **Same hash every frame.**
- **Overdrive's invariants on every step:** tokens ≤ `MAX_TOKENS`, only in
  Overdrive, empty at every Dive; ⛔ exactly one draw per Overdrive kill;
  `age < TOKEN_LIFE` for every live token; item 8 with every new price; an
  aloft Warden dies only to an airborne craft in its lane; no contact death while
  airborne; a Mimic reflects at most once per open; no `MimicShot` is ever shot
  dead; shots ≤ the cap in force; Warden lanes in range on open wells; no NaN;
  bounded arrays.
- ⛔ **Non-vacuity:** all five tokens collected, a Ward broken, a Lance chip, a
  Spread volley, a Warden jump-killed, a Mimic killed, a reflection.

---

## 8. ⛔ THE TWO TABLES (GDD §14.1) — kept apart

**The budgeted-effect list** — *what a token does, and how much of it.* One row
per token; P1 ships every row's data, P1 applies the two instant rows, P2 the
three lasting ones. Recommended values ⚠.

| Token | Effect | Budget | Constants |
|---|---|---|---|
| Bounty | `addScore(BOUNTY_POINTS)` | instant; unmultiplied | `BOUNTY_POINTS` 2000 |
| Recharge | `purgeUses = 0` | instant | — |
| Lance | a kill does not consume the shot; Thorn chip × 3 | the well (T5) | `LANCE_CHIP_MULT` 3 |
| Spread | lanes −1, 0, +1 | the well | `SPREAD_SHOT_MAX` 24 |
| Ward | absorbs one `killSkimmer()` | one hit, within the well | — |

**The drop-weight table** — *which token a drop is.* `C.TOKEN_WEIGHTS`
`{ bounty: 3, lance: 2, spread: 2, ward: 2, recharge: 1 }` ⚠, read off T2's one
draw. ⛔ **Neither table names the other's numbers:** a weight is never a
budget and a budget is never a weight, so retuning how often Ward drops cannot
change what it does, and the reverse.

---

## 9. ⛔ CONTRACTS AND WIRING (GDD §6.5)

**The Warden** (W1–W6):

| Field / method | Warden |
|---|---|
| `lane`, `depth` | a position; depth rises to 1, then 1 while aloft |
| `purgeable` / `blocksClear` | `false` (W4) / `true` (W5) |
| `killDepth` | `null`, except the rim band `1 − RIM_CONTACT_DEPTH` during its discharge; one writer, `setPhase()` |
| `anchored` | `false` — the respawn push reaches it |
| `aloft` (new) | `true` from lift-off; `false` while climbing, and again if pushed |
| `sfxVoice` | `"warden"` |
| `points()` / `onShot()` | `C.PTS_WARDEN` 500 / declines, never dies |

**The Mimic** (MI1): `(lane, depth)` a position, climbs to `MIMIC_APEX` and holds,
one lane; `purgeable: true`, `blocksClear: true`, `killDepth: null`, `anchored:
false`, `aloft: false`, `sfxVoice: "mimic"`, `points()` `C.PTS_MIMIC` 400;
`onShot()` — closed: consumes, reflects once, opens; open: dies, consumes.

**The `MimicShot`** (MI2): the bolt's contract, `sfxVoice: "mimicShot"`, its own
speed and draw.

**The wiring points:**

| Point | Warden | Mimic | MimicShot |
|---|---|---|---|
| 1. `startGame` reset | nothing (`newState()`) | nothing | nothing |
| 2. entity pass | generic | generic | generic |
| 3. collision | `aloft` skip in `collideShots()`; `killDepth` in `collideSkimmer()`; `jumpStrike()` | `onShot()` | `killDepth`; declines shots |
| 4. filter | generic | generic | generic |
| 5. `draw()` | `drawWarden()` | `drawMimic()` | `drawMimicShot()` |
| 6. well-clear | `blocksClear` | `blocksClear` | not blocking |
| 7. the Dive | not a survivor | not a survivor | ⛔ the seventh point: not a survivor (the bolt's answer) |
| Purge | no | yes | yes |
| `sfxVoice` | `warden` | `mimic` | `mimicShot` |
| the way in | `ENEMY_KINDS.warden`, row 11 | `ENEMY_KINDS.mimic`, row 16 | `spawnEnemy("mimicShot", …)` from `Mimic.onShot()` |

**A token is not on this table** (T1): no contract field, no `ENEMY_KINDS` row,
not in `state.enemies`. Its wiring is its own — `newState()`, `enterWell()`,
`startDive()`, `updateTokens()`, the draw — and `dropToken()` is its one way in.

---

## 10. ⛔ THE BASELINE LEDGER

| Baseline | At `4704d2c` (MEASURED) | CS013 (PREDICTED) |
|---|---|---|
| `test-cs006-p2.js` `P1_DETERMINISM_HASH` | **1229033515** | ⛔ **Unmoved P1–P5.** Every change is Overdrive-gated; V1–V3 left it green (MEASURED). A move is a defect |
| `test-cs004-p1.js` `GOLDEN_LANES` | the `9ebd27b` sixteen + `2, 5` | ⛔ **Unmoved** (Classic, levels 1–2; green in V1–V3) |
| The ten closed soaks' paired hashes | green | ⛔ **Unmoved** — the Classic pairs cannot see Overdrive, and `test-cs012-p6.js`'s Overdrive pair is relational (both sessions change together) |
| `COUNTS.enemies` / `enemyKinds` | 7 / 10 | **8 / 11** at P3; **9 / 13** at P4 |
| `COUNTS.wells` / `openWells` / `tracks` | 16 / 6 / 3 | unmoved |
| `STATE_FIELDS` | through CS012 | **+ `CS013: ["tokens", "powers"]`**, P1 |
| `C.SPAWN_SCHEDULE` | 7 rows | unmoved |
| `C.SPAWN_SCHEDULE_OVERDRIVE` | 1 row | **2** at P3, **3** at P4 |
| `C.MODE_FLAGS` | `{ jump, combo }` per mode | **+ `tokens`**, P1 (R3) |
| `C.SFX` events | 22 | **23** (`collect`, P1), **24** (`wardBreak`, P2), **25** (`reflect`, P4) — under W6's recommendation the Warden adds none |
| `C.SFX_KILL_PITCH` voices | 8 | **9** (P3), **11** (P4) |
| Enemy contract fields | 8 | **9** (`aloft`), P3 |
| Kill sites / kill lines | 3 / 4 | **4 / 5**, P3 |
| `climbMult()` call sites | 5 | **6** (P3), **7** (P4) |
| Heat accessors | 7 | unmoved (R7) |
| `TELEMETRY_FIELDS` / `telemetry` | 29 / v1 | unmoved (R4) |
| `progress` / `settings` / `scores` | v2 / v1 / v1 | unmoved |
| kit-audio / kit-input / kit-menu / kit-leaderboard | 0.4.0 / 0.8.0 / 0.1.0 / 0.2.1 | unmoved (R5) |
| `MANIFEST` | 25 + 3 | unmoved (R1) |
| The suite | 66 files, 0 skips, 123 s | **71 files**, 0 skips at the close |
| `CLAUDE.md` | 39,650 bytes | < 50 KB |
| `STATUS.md` | 403 lines | ⛔ under ~400 at every phase's end (K1) |

---

## 11. ⛔ CLOSED-FILE EDITS, PREDICTED AND MEASURED

Every edit rewrites an assertion or restores a fixture's precondition in place (⛔
`CLAUDE.md`, Test rules). None deletes or weakens one. "MEASURED" means the
file went red under §1.2's stand-in; the real repair is still PREDICTED.

| Phase | File | What | Basis |
|---|---|---|---|
| P1 | `test-cs012-p2.js:52` | `MODE_FLAGS` literal gains `tokens` | PREDICTED (read) |
| P1 | `test-cs012-p2.js:157–187` | the draw counter: an idle tick spends one draw per Overdrive kill (the token roll) and nothing else; a spawn tick's count excludes its kills' rolls. The claim (no kind draw on a one-entry set) is unchanged | **MEASURED** (V2) |
| P1 | `test-cs012-p2.js:440–470` | the Trough and Double-Vee wall soaks: restore "a Reaver at the wall" (driver or seed), never relax it | **MEASURED** (V2) |
| P1 | `test-cs012-p4.js:655` `COMBO_OUT` | the four kill strings carry `dropToken` in both `from` and `to` | PREDICTED (read) |
| P1 | `test-cs012-p4.js:436`, the window fixture | item 8 prices a Bounty collection as an unmultiplied GDD §14.1 literal | **MEASURED** (V2) |
| P1 | `test-cs012-p4.js:1083` | restore "the Overdrive run reached ×1.5" | **MEASURED** (V2) |
| P1 | `test-cs012-p6.js` item 8 | the same Bounty pricing | **MEASURED** (V2, V3) |
| P1 | `test-cs012-p6.js:761` | restore "the Overdrive session cleared past 13" if it moves | **MEASURED** red in V2 only (seed-fragile) |
| P1 | `test-cs009-p4.js:34–36` | `EVENTS` + `collect` (it drives `:111`, `:112`, `:132`, `:144`, `:155`, `:166`, `:191`) | PREDICTED (read) |
| P2 | `test-cs009-p4.js:34–36` | `EVENTS` + `wardBreak` | PREDICTED (read) |
| P2 | `test-cs012-p4.js:419`, `:607`; `test-cs008-p2.js` | **none** under T7 (per-chip calls; the pay line kept once) | PREDICTED (read) |
| P3 | `test-cs012-p2.js:92`, `:96–102`, `:124`, `:595` | the schedule literals at L11+, and the `ROW` fixture (it removes the Reaver's row only) | **MEASURED** (V1) |
| P3 | `test-cs012-p4.js:585` | the mutation window: restore a clear inside it (V1), and a Warden that non-jumping item-8 plays cannot kill (W5) | **MEASURED** (V1) + PREDICTED |
| P3 | `test-cs012-p4.js:46`, `test-cs012-p6.js:63` (`gddPoints`) | a Warden prices at GDD §7's 500 | PREDICTED (read) |
| P3 | `test-cs007-p2.js:476` | `CLIMBS` + `WARDEN_CLIMB` (R6) | PREDICTED (read `:505`) |
| P3 | `test-cs009-p4.js:37` | `VOICES` + `warden` | PREDICTED (read) |
| P4 | `test-cs012-p2.js` tables at L16+ | the second row | **MEASURED** (V1) |
| P4 | `test-cs012-p4.js:46`, `test-cs012-p6.js:63` | a Mimic prices at 400 | PREDICTED (read) |
| P4 | `test-cs007-p2.js:476` | `CLIMBS` + `MIMIC_CLIMB` | PREDICTED (read) |
| P4 | `test-cs009-p4.js:34–37` | `VOICES` + `mimic`, `mimicShot`; `EVENTS` + `reflect` | PREDICTED (read) |
| P4 | `test-cs004-p5.js:388`, `test-cs005-p5.js:400` | `PROJECTILE_CLASSES` + `X.MimicShot` — both derive the roster as "classes minus projectiles" and would count a new projectile class as a roster row | PREDICTED (read) |
| — | **kit `VERSION` pins** | none: no kit bumps (R5). ⛔ A bump would owe four rows (F3), and one per signal-path pin if a node moved | MEASURED (grep) |
| — | **deleted config objects** | none planned. ⛔ The `in <OBJECT>` grep: 13 closed `!("X" in C)` assertions, none naming a CS013 key | MEASURED (grep) |
| — | `test-cs009-p5.js:84` | **none**: its `ROSTER` is the Classic seven by name; `:93` is generic (every kind voiced) | MEASURED (read) |
| — | `test-cs007-p2.js:65` `CONTACT_CLIMBS` | **none** (R6) | PREDICTED (read) |

⛔ **An edit not in this table is a finding.** The phase stops, records it in
`STATUS.md` with its cause, and makes the edit only if it restores the claim the
closed test was always making.

---

## 12. ⛔ ACCEPTANCE CRITERIA

GDD §19's Overdrive row: "five tokens, max two on screen; … Reaver and Warden
correct; Mimic present and flagged for playtest". Its CS012 verdicts leave
"✗ CS013's — five tokens, the Warden and the Mimic".

- **Overdrive — five tokens, max two on screen.** Closed when every token drops,
  rises, hovers, is collected and expires per T2–T5; each effect is asserted per
  T6–T9; `MAX_TOKENS` holds on every step (P1, P2) and on the played session
  (P5); and Classic never sees one.
- **Overdrive — Warden correct.** Closed when its contract (§9), arrival,
  hunt, strike, jump kill and the `WARDEN_DISCHARGE < RESPAWN_INVULN` invariant
  are asserted (P3) and played (P5), and GDD §17 item 3 holds for its hops.
- **Overdrive — Mimic present and flagged for playtest.** Closed when its cycle,
  the reflection's bound and the apex ceiling are asserted (P4), it is played
  (P5), the one-row cut is proved (MI3), and `SKIPPED-PLAYTESTS.md` carries the
  probation ask.
- **§17 items:** 3 (the Warden's hops; tokens, the Mimic and its shots never
  hop), 4 (under T8's cap), 5 (reworded, W4), 8 (every new price), 12 (the soak).
  Items 13 and 14: not owed by the new entities (R10).
- **Quality:** no banned vocabulary (the closed scan); plays from `file://`;
  nothing opaque below depth 0.25 — tokens faded (T4), the Warden above the
  rim; the concat build is the oracle; ⛔ zero skips at the close (the
  coinless-kit clone present).

---

## 13. ⛔ WHAT CS013 DOES NOT DO

- **The ring-flight Dive** (CS014); **achievements** (CS015); **onboarding**
  (CS016); **the Mimic's verdict** (CS017).
- **A telemetry column, a `tally` field or a stats key** (R4); **a bench key**
  (R9); **a heat accessor** (R7).
- **Edit or bump a kit module, or backport one** (R5).
- **Move a HUD rectangle** (T10), **fix F1 or F2** (CS012's), or **give the Dive
  a visual**.
- **Change heat, the concurrency ladder, `ENEMY_CAP` or any Classic constant.**
- **Draw the touch buttons, feed the VOICE bus, fix the pad-only silence or the
  Surger tone's 1.106 peak.** All still unowned.

---

## 14. RISKS

- **K1 — `STATUS.md` starts at 403 lines**, at its ~400 ceiling (MEASURED). P1
  compresses before it adds; reasoning goes to `log/CS013.md`.
- **K2 — a driver that never jumps cannot clear a Warden's well** (W5,
  PREDICTED). Closed non-jumping Overdrive plays at L11+ lose clears; each repair
  restores its precondition, never relaxes it.
- **K3 — the Mimic's reflection kills scripted fire-holders** (PREDICTED: a
  held driver 2–3 lanes off on average, §1.3, stays in its lane long enough). The
  closed Overdrive soak reached L16; its cleared-past-13 is already seed-fragile
  (§1.2).
- **K4 — one draw per Overdrive kill moves every Overdrive board after the first
  kill** (MEASURED, V2). Every closed Overdrive fixture that needs a specific
  board is a repair candidate; the paired hashes are not.
- **K5 — the kill lines share their text.** `COMBO_OUT`'s strings carry the next
  line; P1 edits all four and P3 adds a fifth that must match none of them.
- **K6 — two lines P2 edits beside are closed mutation strings:** the Thorn's
  pay line (`test-cs012-p4.js:607`) and the sweep line (`test-cs012-p2.js:525`).
- **K7 — the vocabulary scan** (`test-cs008-p6.js:426`) bans nine whole words,
  case-insensitive, anywhere in the built file — comments too. A Lance glyph
  is a "needle", never the banned word for it.
- **K8 — `reconcileSurgeTones()` is duck-typed** (MEASURED, `19-sfx.js:137`): any
  entity with `phase === "telegraph"` and a `chargeTip()` gets the Surger's
  voice. W6 relies on it; an entity that does not want it must not match.
- **K9 — the combo readout covers top-lane rim points** (F1), so a Warden there is
  partly under `×N`. Accepted as provisional under W6's recommendation.
- **K10 — "no fourth kill site" is written in GDD §7 and `CLAUDE.md`**; P3 edits
  both, and CS012's "four kill lines" in `STATUS.md`.
- **K11 — the drop rate comes from bots** (§1.3). `TOKEN_DROP_CHANCE` is ⚠
  provisional, and the ask goes to `SKIPPED-PLAYTESTS.md`.
- **K12 — `test-cs009-p5.js:414`'s seat scan**: a new `sfx(` seat names its event
  as a string literal and passes nothing that writes or draws (no "draw" or
  "rng" in its arguments).
- **K13 — `instanceof` is per build** (STATUS): a repaired `gddPoints()` still
  takes the build.
- **K14 — Spread triples the shots on screen** (T8), and `drawShot()` allocates
  per call (F4). CS017's to measure.
- **K15 — a mutation run that throws is a defect in the test** (STATUS): guard
  the reads, report a count and one index, and check the mutation string was
  found once before asserting red.

## 15. ASSUMPTIONS

- **A1 — ✅ Met: Paul answered §0 on 2026-09-17** (every recommendation), in
  this document's answer column, as CS012's was.
- **A2 — ✅ Confirmed by Paul (2026-09-17): `../coinless-kit` is present for
  the close** (two closed files read its
  registry and SKIP without it).
- **A3 — Overdrive and Classic share heat, the ladder, the band roll, the Dive
  (until CS014), the Purge and the scoring constants** (GDD §13; CS012 A1).
- **A4 — the eleventh soak fits `run-all.js`'s 120 s per-file timeout** (the
  tenth took 23.9–24.6 s in §1.2; PREDICTED).
- **A5 — no registry change and no Worker contact** (R4).
