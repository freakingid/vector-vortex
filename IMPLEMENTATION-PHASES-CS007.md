# IMPLEMENTATION-PHASES-CS007

One phase per Claude Code session. `/clear` between phases. Commit per phase on
`main`; never push.

Each phase below is the literal prompt to paste. Keep them self-contained — a
session reads `CLAUDE.md` and `STATUS.md` automatically, and nothing else unless
the prompt names it.

⛔ **`ultrathink` appears inside the prompt text where it is wanted.** It is a
per-turn lever, not a session setting, so it has to be in the pasted message.

**Baseline:** CS006 closed at `1d64329`. `node build.js` green (24 modules,
290.5 KB), `node scratchpad/run-all.js` green — **29 files, zero skips.**
`test-registry.js` reads `wells: 16`, `openWells: 6`, `tracks: 0`, `enemies: 6`,
`enemyKinds: 9`. `C.HEAT_BASE` / `HEAT_RISE` / `HEAT_KNEE` / `HEAT_LINEAR` and
every `C.PTS_*` exist and are unread. `src/12-scoring.js`, `src/15-render-hud.js`
and `src/16`–`22` are placeholders. `test-cs004-p1.js`'s `GOLDEN_LANES` is on its
original `9ebd27b` recording; `test-cs006-p2.js`'s `P1_DETERMINISM_HASH` is
`2063617640`, recorded at the CS006 P5 close.

✅ **All three design calls are answered — Paul, 2026-08-31, `DECISIONS.md`.**
No phase below is blocked.

| Phase | Builds | Model | Effort |
|---|---|---|---|
| P1 | The spawner-stall split — the budget counts THREATS | Opus 5 | medium |
| P2 | The heat clock, every derived value, and the respawn guarantee | Opus 5 | **high** |
| P3 | GDD §8.1's introduction schedule | Opus 5 | **high** |
| P4 | Telemetry — the tuning instrument | Opus 5 | medium |
| P5 | The soak, the docs, the close | Opus 5 | **high** |

### ✅ The answers, as shipped numbers

⛔ **Form A endpoint interpolation**, one shared endpoint:

```js
v(level) = base + (clamp - base) * min(heat(level) / heat(C.HEAT_FULL_LEVEL), 1)
C.HEAT_FULL_LEVEL = 99          // heat(99) = 2.96000
```

| Constant | Value | Row |
|---|---|---|
| `C.HEAT_FULL_LEVEL` | **99** | the level past which nothing gets harder |
| `C.SPAWN_INTERVAL_MIN` | **0.70** | ⚠ **not** `SPAWN_MIN`, which never existed |
| `C.ENEMY_CONCURRENT_MAX` | **8** | under ⛔ `ENEMY_CAP` 16, which is untouched |
| `C.CLIMB_MULT_MAX` | **1.40** | H1 |
| `C.CLIMB_MAX_BASE` | **0.18** | = `VAULT_CLIMB`; the fastest contact-killer, named |
| `C.VAULT_INTERVAL_MIN` | **1.00** | |
| `C.VAULT_RIM_INTERVAL_MIN` | **0.35** | ⛔ above `VAULT_HOP_TIME` 0.28, so the knob stays live |
| `C.SURGE_INTERVAL_MIN` | **1.40** | |
| `C.WEAVER_APEX_MAX` | **0.75** | = the Thorn's length ceiling; they are one knob |
| `C.RESPAWN_PUSH_DEPTH` | **0.55, UNCHANGED** | ⛔ no derived push, no `RESPAWN_PUSH_MARGIN` |
| Carrier cargo weights | ⛔ **none — emergent from the schedule** | C3 |

⛔ **The concurrency ladder, measured** — `enemyConcurrent()` floors a continuous
value, so it steps and a player can name each step:

```
3 at levels 1-5  ·  4 from 6  ·  5 from 16  ·  6 from 40  ·  7 from 70  ·  8 at 99
```

⚠ **Concurrency is still 3 at level 5, which is exactly where the Weaver arrives.**
P1's split is doing its work at the tightest budget the run ever has.

---

## ⛔ Why the seam falls here

**P1 goes first because the schedule is what makes the stall live, and that is
measured, not felt.** On a level-5 eligible set at the shipped
`C.ENEMY_CONCURRENT` 3, **every seed tested stalls**: four seeds × two drivers ×
18,000 ticks, the level never leaves 1 and the longest stretch with no level and
no quota movement is 16,336–17,806 ticks. Blocked spawner beats quadruple the
moment a Weaver becomes eligible — 7,027 → 30,579 — and **94.6 % of them are
beats the split releases.** Landing the schedule first would put a five-minute
stall in the middle of the changeset, in the same commit as the thing that was
supposed to fix it.

**P1 is also the phase that ships no design and no entity, which is what lets P3
be one thing.** That is CS005 P1's shape and CS005's own stated reason for holding
as one changeset. Here it is a two-line behaviour change with a measured before
and after, and it means P3 is *"which kinds at which level"* and nothing else.

**P2 is one phase and not two, and H1's answer is what collapsed it.** This
document carried a sixth phase — *the respawn guarantee under heat* — written
against H1's recommended **derived push**: `respawnPush()`, `RESPAWN_PUSH_MARGIN`
and a monotonicity argument, which is a phase's worth of production code with a
shipped guarantee riding on it. ⛔ **Paul chose the hard cap instead, so all of
that is gone.** What remains is one constant that has to land with the other five
clamps anyway (`climbMult()` is meaningless without its ceiling) and one property
test. A phase whose entire content is a test that a previous phase's constant
satisfies an inequality is not a phase — it is that phase's acceptance criterion.
⛔ **So P2 proves the guarantee FIRST, before it wires a single accessor**, and the
riskiest thing in the phase is not the thing that gets squeezed at the end.

**P3 is its own phase because of its closed-file count, measured: six test files
plus `_harness.js`.** CS006 called four closed-file edits the reason its P5 was
high effort. P3 also deletes a shipped constant, and a deletion plus a fixture
repair plus a schedule in one session is exactly the sprawl `CLAUDE.md`'s
one-phase rule exists to stop.

**P4 comes after heat, per `ROADMAP.md` assumption #3.** *"An instrument built one
changeset before the thing it measures ships with a column list that has to be
edited the moment heat lands, and `TELEMETRY_FIELDS` and `push()` must be edited
together."* Its columns are the derived values; those have to exist. P4 is also
the phase with slack — it touches one placeholder file and one debug action — and
it is where P2's or P3's overflow goes.

**P5 is the close and it is a fifth soak file.** `STATUS.md`: *"Four soaks, and
they prove different things on different boards… A future changeset extends the
pattern with a fifth file rather than widening a closed one."*

### ⛔ The re-records, phase by phase — and there are FOUR, not one

`STATUS.md` says CS007 owns exactly one baseline re-record. **That is wrong, and
`PLANNED-FEATURES-CS007.md` §1.2 measures why.** `test-cs006-p2.js`'s
`P1_DETERMINISM_HASH` is a **cross-file** baseline: it runs the closed
`test-cs005-p5.js` in a child process, and that soak reaches level 15 on a
six-kind board. Three separate CS007 changes move it.

| Phase | Baseline | Cause — ⛔ exactly one each |
|---|---|---|
| P1 | `P1_DETERMINISM_HASH` | the release budget counts threats — **1,082 diverging ticks in that soak's own fixture, first at tick 3,380** |
| P2 | `GOLDEN_LANES` | heat lowers the level-2 spawn interval (1.600 → 1.428), so another spawn fits the 3,000-tick window. ⛔ **The first ten entries do not move** |
| P2 | `P1_DETERMINISM_HASH` | heat |
| P3 | `P1_DETERMINISM_HASH` | the soak's kind fixture becomes a level |
| P4, P5 | — | ⛔ none |

⛔ **Four small re-records, each with one nameable cause, is `ROADMAP.md`'s own
stated preference** over one that absorbs three unrelated causes at once. Merging
phases to reduce the count would leave the suite red between them, which
`CLAUDE.md` forbids. Deleting the constant instead was considered and rejected: a
later changeset rewrites a closed assertion in place, it does not delete it.

⛔ **The guarantee itself moves nothing** — `RESPAWN_PUSH_DEPTH` stays 0.55, so a
respawn is unchanged at every level.

---

## P1 — the spawner-stall split

**Model: Opus 5 · Effort: medium**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS007.md` §4.1, §4.2 and
> §4.4, and `VECTOR-VORTEX-GDD.md` §0, §1, §5, §6.5. Then read `src/08-spawner.js`
> end to end and `DECISIONS.md`'s 2026-08-31 entry "the spawner-stall call".
> ultrathink.
>
> ⛔ **THE DESIGN CALL IS ALREADY MADE. Paul's, 2026-08-31. Do not re-open it, do
> not improve on it, do not extend it.** You are building a decision, not making
> one.
>
> **1. The split.**
>
> - `updateSpawner()`'s concurrency block counts entities where
>   `blocksClear && !dead`, against `min(C.ENEMY_CONCURRENT, C.ENEMY_CAP)`.
> - ⛔ `spawnEnemy()`'s `C.ENEMY_CAP` check is **UNCHANGED** — raw
>   `state.enemies.length`. A Thorn is drawn, so a readability ceiling counts it.
> - ⛔ Read `blocksClear` off the entity, never a class name (GDD §6.5).
> - ⛔ **Three follow-ons are settled and are NO CHANGE:** no Thorn expires (GDD
>   §5's lesson depends on it persisting), `wellCleared()` is untouched, and
>   `C.ENEMY_CAP` is not raised.
> - `00-config.js`'s `ENEMY_CONCURRENT` comment currently says the spawner reads
>   `state.enemies.length`; it does not any more. Correct it in place, and say
>   what the two numbers now count.
> - ⛔ **No heat this phase.** `C.ENEMY_CONCURRENT` stays a flat 3 and
>   `enemyConcurrent()` is P2's.
>
> **2. Your own test file, `scratchpad/test-cs007-p1.js`.** Assert what this phase
> owns and nothing else.
>
> - ⛔ **The repro from `STATUS.md`, terminating.** Three standing Thorns, quota
>   full, no input. **Measured before this phase at `1d64329`:** after 6,000 ticks
>   the level was 1 → 1, the quota 10 → 10 and the board 3 → 3, with the spawner
>   blocked. After the split the quota must spend and the well must clear.
> - ⛔ **The ceiling still holds.** Stage `C.ENEMY_CAP` Thorns and assert
>   `spawnEnemy()` refuses — the split must not have walked past the readability
>   ceiling on its way to fixing the release budget.
> - ⛔ **A board of live threats still blocks.** Three Vaulters and no Thorn: the
>   spawner blocks exactly as it did. Without this the first case could pass on a
>   build that had simply removed the limit.
> - The bolt is the other `blocksClear: false` entity in the roster. Assert it
>   frees a slot too, so the claim is about the flag and not about the Thorn.
>
> **3. ⛔ Three closed comments are now FALSE and you correct them in place.**
> `test-cs004-p5.js` (~406–417), `test-cs005-p5.js` (~48–52) and
> `test-cs006-p5.js` (~26–29) all say raising `C.ENEMY_CONCURRENT` to
> `C.ENEMY_CAP` is *"a WORKAROUND for a live defect that belongs to CS007, not a
> fix for it."* After this phase the defect is fixed and the raise is a plain
> difficulty fixture that keeps the board busy. ⛔ **KEEP THE FIXTURE. Rewrite the
> reason.** Removing it would change three soaks' boards for no assertion's
> benefit, and `CLAUDE.md` says a closed phase still owns its claim.
>
> **4. ⛔ The re-record — one baseline, one cause.**
>
> `test-cs006-p2.js`'s `P1_DETERMINISM_HASH` (`2063617640`) is a **cross-file**
> baseline: it runs `scratchpad/test-cs005-p5.js --hash-only` in a child process.
> That soak drives a six-kind board at `C.ENEMY_CONCURRENT` 3, so the split moves
> it. **Measured before this phase: 1,082 ticks in that exact fixture where the
> spawner is blocked and `blocksClear && !dead` is under 3, the first at tick
> 3,380.** Re-verify that number, then re-record, and write the cause **at the
> assertion itself** and in `STATUS.md`.
>
> ⛔ **THIS IS THE ONLY BASELINE YOU MAY TOUCH.** `test-cs004-p1.js`'s
> `GOLDEN_LANES` is green and owes this phase nothing — **measured**: over its
> 3,000-tick window every entity on the board is a Vaulter, so `blocksClear &&
> !dead` equals `state.enemies.length` on every tick and the split is provably a
> no-op there. Verify that it is still green; if it is red, that is a **new**
> cause, it is not this step, and it gets a ⛔ line in `STATUS.md` before you touch
> anything.
>
> ⛔ **And `test-cs006-p2.js`'s three geometry goldens (`GOLDEN_SCREEN`,
> `GOLDEN_LANE`, `GOLDEN_MIN_SPOKE_PX`) and its §8 source assertion must be
> untouched and green.** They are what make the re-record honest.
>
> **5.** `STATUS.md`: one ledger line, and a body under ~200 words. ⛔ Move the
> "A STANDING THORN HOLDS A SPAWNER SLOT" entry out of "Known issues" — it is
> fixed. Record what replaced it and what the two counts now mean.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> Nonzero exit means not done. ⛔ Edit docs in place. ⛔ Do not push.

---

## P2 — the heat clock, every derived value, and the respawn guarantee

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, `DIFFICULTY-NOTES.md`, then
> `PLANNED-FEATURES-CS007.md` §1.1, §1.4, §2, §3 and §5.1 in full, and
> `VECTOR-VORTEX-GDD.md` §0, §1, §4.4, §4.5, §8, §8.1, §8.2, §17. Then read
> `src/00-config.js`'s Difficulty group, `src/02-state.js`'s `level` field,
> `src/23-main.js`'s `respawnSkimmer()` including both ⚠ SETTLED paragraphs, and
> `scratchpad/test-cs004-p1.js`'s golden block. ultrathink.
>
> **The biggest phase after P3. ⛔ Do the guarantee FIRST — step 1 — and wire the
> accessors after it.** The guarantee is the only thing in this changeset whose
> failure mode is a life lost every 1.5 s, and it must not be the thing that gets
> squeezed at the end of a long session.
>
> **1. ⛔ THE RESPAWN GUARANTEE, AND IT IS A HARD CAP — Paul's, 2026-08-31.**
>
> `C.CLIMB_MULT_MAX = 1.40`, and ⛔ **`C.RESPAWN_PUSH_DEPTH` STAYS 0.55.**
>
> ⛔ **DO NOT BUILD A DERIVED PUSH.** `PLANNED-FEATURES-CS007.md` §3.2 sketches
> `respawnPush()` and `C.RESPAWN_PUSH_MARGIN`; that section is kept because it is
> what 1.40 was chosen *against*, and §3.4 marks it ⛔ **not chosen**. **Measured:
> at a ceiling of 1.40 the derived push evaluates to exactly 0.55 at every level,
> so it would be dead code from the day it shipped.** Building it is building a
> decision that was not made.
>
> ⛔ **`C.CLIMB_MAX_BASE` DOES ship** — 0.18, `VAULT_CLIMB`'s value — because the
> assertion below has to name the fastest contact-killer, and naming it
> `VAULT_CLIMB` inside a respawn assertion is how a future entity faster than a
> Vaulter escapes the guarantee silently.
>
> ⛔ **`C.CLIMB_MAX_BASE` is 0.18 and NOT `WEAVER_BOLT_SPEED`'s 0.32, and the
> reason is written here so you neither miss it nor over-push for it.** The bolt
> is the fastest thing on the board carrying a rim `killDepth`. Pushed to 0.55 it
> reaches `killDepth` at 1.250 s — **inside** the 1.5 s window — and is safe anyway
> because `WeaverBolt.update()` kills it on the step after `depth >= 1`, at
> 1.406 s + one step, still inside. ⛔ It is safe by **self-termination**, not by
> the arithmetic, which is also why step 2 does not scale it. **Assert the bolt's
> window explicitly** so the next session does not have to rediscover it.
>
> The property, in your own file — ⛔ **over levels 1..200, not a spot check:**
>
> ```
> for level in 1..200:
>   (1 - C.RIM_CONTACT_DEPTH - C.RESPAWN_PUSH_DEPTH)
>       / (C.CLIMB_MAX_BASE * climbMult(level))  >  C.RESPAWN_INVULN
> ```
>
> **Measured at 1.40: 1.587 s against 1.500 s — a margin of +0.087 s**, and every
> other roster climb has more (Surger +0.405, Drifter +0.698, Carrier +1.097; the
> Weaver's `killDepth` is `null`). ⛔ **Then drive the real `respawnSkimmer()`**
> at a high level with a Vaulter at the rim and step the real `Game.update()`
> through the whole invulnerability window, asserting no death. A property over
> constants is not a proof that the code reads them.
>
> ⛔ **The `anchored` skip in `respawnSkimmer()` is ⚠ SETTLED and is untouched.**
> An anchored entity's `depth` is a LENGTH; clamping a length is a free chip, not
> a push. Do not narrow GDD §4.4's band while you are in there.
>
> **2. `heat(level)` and the mapping.** ⛔ **Form A endpoint interpolation, Paul's,
> 2026-08-31:**
>
> ```js
> v(level) = base + (clamp - base) * min(heat(level) / heat(C.HEAT_FULL_LEVEL), 1)
> ```
>
> `heat()` itself is the shipped formula from the four constants that already
> exist, **unchanged**. ⛔ **`heat(1)` must be exactly 0** — that is what makes
> eighteen of the suite's twenty-nine files provably unreachable by this phase,
> and it is an acceptance criterion.
>
> ⛔ **NO `C.HEAT_HOLD_LEVEL`.** `src/02-state.js` and CS006's handover both
> anticipate `heat(min(level, C.HEAT_HOLD_LEVEL))`. **Measured:** every one of the
> seven rows is clamped, so heat past a row's saturation level changes nothing in
> the build, a hold is inert, and GDD §17 item 7 stays green on the shipped formula
> with no plateau inside `heat()` at all. ⛔ The rule that a hold, if one is ever
> needed, belongs in the CALLER and never inside `heat()` **stands and is not
> re-litigated.**
>
> **3. The constants, and the seven accessors.**
>
> | Constant | Value |
> |---|---|
> | `C.HEAT_FULL_LEVEL` | 99 |
> | `C.SPAWN_INTERVAL_MIN` | 0.70 |
> | `C.ENEMY_CONCURRENT_MAX` | 8 |
> | `C.CLIMB_MULT_MAX` | 1.40 |
> | `C.CLIMB_MAX_BASE` | 0.18 |
> | `C.VAULT_INTERVAL_MIN` | 1.00 |
> | `C.VAULT_RIM_INTERVAL_MIN` | 0.35 |
> | `C.SURGE_INTERVAL_MIN` | 1.40 |
> | `C.WEAVER_APEX_MAX` | 0.75 |
>
> `spawnInterval()`, `enemyConcurrent()`, `climbMult()`, `vaultInterval()`,
> `vaultRimInterval()`, `surgeInterval()`, `weaverApex()`. ⛔ **Every entity reads
> the accessor; no entity reads a heat-derived `C.<BASE>` directly any more, and no
> call site computes heat inline.** That is what makes the clamp enforceable in one
> place and testable as a property.
>
> - ⛔ `climbMult()` is ONE multiplier on every entity climb — `VAULT_CLIMB`,
>   `CARRIER_CLIMB`, `WEAVER_CLIMB`, `DRIFT_CLIMB`, `SURGE_CLIMB`.
> - ⛔ **`WEAVER_BOLT_SPEED` and `WEAVER_RETREAT` are NOT scaled.** GDD §8's list
>   does not contain them, a bolt is ordnance rather than a climb, and step 1 is
>   why a slower bolt would be a breach.
> - ⛔ **H2, and it protects three closed soaks for free:** heat scales intervals,
>   climb rates and the Weaver's apex — **never a crossing or hop duration.**
>   `VAULT_HOP_TIME`, `DRIFT_CROSS_TIME` and `DRIFT_RIDE_TIME` are untouched by
>   the clock, and `test-cs005-p3.js`'s `SURGE_DISCHARGE < RESPAWN_INVULN` pair
>   stays green and **unedited**.
> - `enemyConcurrent()` interpolates 3 → `C.ENEMY_CONCURRENT_MAX` 8 and is still
>   read as `min(…, C.ENEMY_CAP)`. ⛔ `ENEMY_CAP` 16 is a readability ceiling, is
>   never approached by this curve, and is not touched.
> - `weaverApex()` replaces `C.WEAVER_APEX`'s one reader. ⛔ **Do not touch the
>   `if (this.depth < C.WEAVER_APEX)` guard's shape** — `07-enemies.js` already
>   explains that it is written non-clamping *because* CS007 moves the apex under
>   live entities.
>
> **4. `scratchpad/test-cs007-p2.js`.**
>
> - ⛔ **GDD §17 item 7 as a PROPERTY over levels 1..200:** `heat(n+1) > heat(n)`,
>   and **every derived value inside its clamp** across the same range.
> - `heat(1) === 0` exactly; each accessor equals its base at level 1 and its clamp
>   at level 99; each is monotone in the direction `DIFFICULTY-NOTES.md` names.
> - The guarantee property and the live respawn drive from step 1.
> - ⛔ **The concurrency ladder, which is what a player is meant to be able to
>   name:** `enemyConcurrent()` returns 3 at levels 1–5, 4 from 6, 5 from 16, 6
>   from 40, 7 from 70, 8 at 99. **Measured — assert the step levels**, because a
>   floored interpolation is exactly the kind of thing an innocent retune slides.
> - ⛔ **A source assertion, because it needs no baseline and survives every
>   retune:** read the built file (the behaviour oracle, GDD §16.2) and assert that
>   each heat-derived base constant is named **only** inside its own accessor — the
>   form `test-cs006-p2.js` §8 uses for `throatOffset`. A future session that reads
>   `C.VAULT_CLIMB` directly from an entity turns the suite red instead of quietly
>   escaping the clamp.
>
> **5. ⛔ THE ONE SANCTIONED `GOLDEN_LANES` RE-RECORD, AND ITS CAUSE IS NOT WHAT
> `ROADMAP.md` PREDICTED.**
>
> `STATUS.md` and `ROADMAP.md` both say the *introduction schedule* moves it
> because it changes the draw count per spawn. **Measured at `1d64329`: false.**
> The golden's 3,000-tick window never leaves level 2 — 2,065 ticks at level 1 and
> 935 at level 2, every spawn a Vaulter — and GDD §8.1's eligible set is
> `[vaulter]` at both levels, so the kind pick faces a one-entry list throughout
> and spends nothing. **What moves it is this phase: heat lowers the level-2 spawn
> interval from 1.600 to 1.428, so another spawn fits the window.**
>
> ⛔ **THE RE-RECORD'S FIRST TEN ENTRIES MUST BE CHARACTER-IDENTICAL TO THE
> RECORDING AT `9ebd27b`** — `10,10,12,0,8,14,12,12,8,14`. Those ten are the
> level-1 spawns and `heat(1)` is 0, so they cannot legitimately move. **A
> re-record that moves them is heat leaking into level 1, or a draw spent at level
> 1 — it is a bug, not a new baseline.** Every curve measured in planning left them
> untouched and simply appended entries; on the shipped curve, exactly one.
>
> Record the new sequence, the commit, and the cause at the assertion and in
> `STATUS.md`. ⛔ **Check it against `test-cs006-p5.js`'s draws-per-spawn count,
> not against the old sequence alone** — every interval spawn must still spend at
> least 2 draws and at most `1 + C.SPAWN_LANE_TRIES`, with no third while the
> eligible set has one entry.
>
> **6. `P1_DETERMINISM_HASH`, second re-record, one cause: heat.** Same rules as
> P1's — cause at the assertion, cause in `STATUS.md`, and
> ⛔ **`test-cs006-p2.js`'s three geometry goldens and its §8 source assertion
> untouched and green.** Heat touches no geometry constant and no well datum; if a
> geometry golden moves, stop.
>
> **7. ⛔ Do NOT touch `DIFFICULTY-NOTES.md` yet.** It is corrected in place, and
> that is P5's — after the schedule lands, so the document is corrected once
> against a finished build rather than twice. Record in `STATUS.md` which rows this
> phase made true.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing. ⛔ Edit
> docs in place. ⛔ Do not push.

---

## P3 — GDD §8.1's introduction schedule

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS007.md` §1.3, §1.5,
> §4.3, §4.4, §4.5 and §5.3 in full, and `VECTOR-VORTEX-GDD.md` §0, §1, §6.1,
> §6.2, §6.5, §8.1, §17. Then read `src/08-spawner.js` end to end,
> `scratchpad/test-cs006-p5.js`'s counting section (from "THE NO-DRAW RULE AS A
> COUNT") and `scratchpad/_harness.js`'s `EXPORTS` list. ultrathink.
>
> **The biggest phase in the changeset. Seven closed files, measured, and a
> shipped constant deleted.**
>
> **1. The schedule.** ⛔ **DATA in `C`** (`CLAUDE.md`, Config: every tunable, and
> these levels are difficulty numbers). One function of level and nothing else.
> The eligible sets, measured against GDD §8.1 and the seven spawner-eligible
> `ENEMY_KINDS` rows:
>
> ```
> L1-2   vaulter                                           (1 entry)
> L3-4   + carrierVaulter                                  (2)
> L5-8   + weaver                                          (3)
> L9-12  + drifter                                         (4)
> L13-17 + surger                                          (5)
> L18-22 + carrierDrifter                                  (6)
> L23+   + carrierSurger                                   (7)
> ```
>
> - ⛔ **`thorn` and `weaverBolt` are NEVER eligible.** They enter through
>   `Weaver.layThorn()` and `Weaver.fire()`, which call `spawnEnemy()` directly.
> - ⛔ **Two of §8.1's rows are already true and cost nothing.** Row 1/2
>   (*"Vaulters (non-vaulting)"* / *"Vaulting"*) is `C.VAULT_FIRST_LEVEL` 2, which
>   ships. Row 8 (*"First open well"*) is the shipped modulo mapping: level 8 →
>   `WELLS[7]` = Vee, `closed: false` — **measured**. ⛔ **Do not touch well
>   selection.** Record both as rows the schedule documents rather than implements.
> - ⛔ **THE NO-DRAW RULE, VERBATIM.** An eligible set of fewer than two entries
>   returns its one entry and spends **no** draw; two or more spend **exactly
>   one**. `rngPick()` on a single-element array still advances the run's ONE
>   stream, and the stream is shared with every spawn lane in the run.
> - ⛔ **Keep the function named `pickSpawnKind(state)`.** `_harness.js`'s
>   `EXPORTS` names it; a renamed function comes back `null` there and turns four
>   closed files' direct calls into a different failure than the one you are
>   making. Its reader changes; its name, signature and contract do not.
>
> **2. ⛔ C3 — NO CARGO WEIGHT TABLE. Paul's, 2026-08-31.** The kind pick stays a
> **uniform** `rngPick` over the eligible set. The three Carrier variants are three
> separate schedule entries, so GDD §8's *"cargo weights shift toward
> Drifter/Surger"* is delivered by arithmetic alone: 100 % Vaulter cargo at L3–17,
> 50/50 at L18–22, 33/33/33 from L23. ⛔ **Say so at the schedule's definition and
> in GDD §6.2**, so a future session does not read the missing table as an
> oversight. ⛔ **Do not add weights, and do not add a second draw.**
>
> **3. ⛔ H5 — the constant goes, the keys stay.** Delete `C.DEBUG_SPAWN_KINDS` and
> its reader. ⛔ **The seven debug spawn actions in `23-main.js` are NOT deleted
> and they stop being ⚠ TEMPORARY.** The constant answered *"what does the well
> release"* — a difficulty question the schedule now owns. The keys answer *"put
> one of these on screen so I can look at it"* — a hardware-pass question the
> schedule does not address and cannot. `PLAYTEST.md` is written around them, the
> six enemy colours are still ⚠ provisional and `0` is the only way to see them
> together. They ship until CS016 decides whether debug keys ship at all.
>
> **4. ⛔ SEVEN CLOSED FILES, REPAIRED IN PLACE.** `CLAUDE.md`, Test rules: rewrite
> the assertions to the replacement behaviour; **do not delete, do not weaken**;
> and a fixture invalidated by the replacement is *repaired to restore the
> precondition the assertion was always about*, never relaxed. Measured at
> `1d64329`, emulating the deletion, all three closing soaks go **red on their own
> non-vacuity assertions** — 26, 33 and 7 failures. That is the correct behaviour
> and it is what you are repairing.
>
> ⛔ **The schedule's own levels supply, almost exactly, the sets these files
> hand-built:**
>
> | File | Its `MIXED` | Replacement |
> |---|---|---|
> | `test-cs004-p5.js` | `["vaulter","carrierVaulter","weaver"]` | ⛔ **level 5 — character for character** |
> | `test-cs005-p5.js` | six kinds | **level 23** — a superset by one Carrier variant its `sawCarrier` check already accepts |
> | `test-cs006-p5.js` | same six | **level 23** |
> | `test-cs004-p1.js` | `["vaulter","carrier","weaver"]`, `pickSpawnKind` only | **level 5** |
>
> The fixture shape, through the real path:
> `X.startGame(SEED); state.level = N; state.wellIndex = (N-1) % WELLS.length; X.enterWell();`
>
> ⚠ **`test-cs005-p2.js` and `test-cs005-p3.js` want a SINGLE-kind well (Drifters
> only, Surgers only) and no level of §8.1 has a one-entry set containing either.**
> Two honest repairs, and `PLANNED-FEATURES-CS007.md` §4.4 recommends the first:
> assert the claim on `pickSpawnKind` and `spawnEnemy` directly at the level where
> the kind first becomes eligible (9 and 13) — the claim is about the one entry
> point, and the one entry point is what gets driven — or drive `spawnEnemy` on an
> interval by hand. ⛔ Neither weakens the assertion. Pick one and say why in
> `STATUS.md`.
>
> ⛔ **`test-cs006-p5.js`'s draws-per-spawn control is the important one, because
> it is what makes all four of CS007's re-records honest.** Its one-entry run
> becomes **level 1**; its two-entry control becomes **level 3**, the only band
> whose eligible set is exactly two. ⛔ **Pin the level by topping up
> `state.spawn.remaining` every tick** — the fixture shape `test-cs005-p5.js`'s
> open-well soak already uses — or the run walks out of its band. ⚠ At level 3 a
> Carrier splits on being shot and adds two entities in one tick; the file already
> routes `added > 1` to `out.extra` and asserts `extra === 0` only on the one-entry
> run, so `min(perSpawn)` stays clean. The decomposed section becomes
> `state.level = 1` → **0 draws** and `state.level = 3` → **exactly 1**, measured
> on `pickSpawnKind` directly.
>
> Also: `_harness.js` line ~150's ⚠ TEMPORARY comment on the `pickSpawnKind`
> export — the export survives, the reason changes.
>
> **5. `scratchpad/test-cs007-p3.js`.** The schedule itself: each level's eligible
> set, the boundaries at 3/5/9/13/18/23, the draw count at each set size, and
> ⛔ **a source assertion that `DEBUG_SPAWN_KINDS` does not appear anywhere in the
> built file** — the form `test-cs003-p2.js` uses for `WELL_CLEAR_HOLD`. A
> placeholder that outlives its replacement is what these assertions exist to
> prevent.
>
> **6. `P1_DETERMINISM_HASH`, third and last re-record, one cause: the soak's kind
> fixture became a level.** Cause at the assertion and in `STATUS.md`. ⛔ The three
> geometry goldens untouched and green.
>
> **7. ⛔ RE-RUN THE GOLDEN AND CHECK WHERE ITS WINDOW ENDS.** Measured on the
> shipped curve: the 3,000-tick window ends at **level 2** (spawn interval 1.600 at
> L1, 1.428 at L2), so the eligible set is one entry throughout and this phase moves
> nothing there. ⛔ **If it has reached level 3, the kind pick now spends a draw,
> `GOLDEN_LANES` moves a second time, and that is a NEW cause with its own line in
> `STATUS.md`** — not a quiet re-record folded into P2's.
>
> **8. The GDD.** §6.1's ⚠ *"None of them is introduced on a schedule yet"*
> paragraph and §6.2's ⚠ *"Still not a weighted draw"* are both false after this
> phase — and §6.2's replacement must say the absence of a weight table is a
> decision, not a gap. §8.1 gains what actually shipped. ⛔ Edit in place.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing. ⛔ Edit
> docs in place. ⛔ Do not push.

---

## P4 — telemetry, the tuning instrument

**Model: Opus 5 · Effort: medium**

> Read `CLAUDE.md`, `STATUS.md`, then `PLANNED-FEATURES-CS007.md` §6 in full, and
> `VECTOR-VORTEX-GDD.md` §0, §1, §15.6, §17, §21. Then read `src/21-telemetry.js`
> (a one-line placeholder) and `23-main.js`'s `runAction()`. ultrathink.
>
> ⛔ **This phase moves no baseline and touches no simulation value.** If a
> determinism hash moves, you have put telemetry inside the simulation and it is a
> bug, not a re-record.
>
> **1. `src/21-telemetry.js`.** A `Telemetry` object with a ring buffer.
>
> - ⛔ **`TELEMETRY_FIELDS` is the one source of truth for both row shape and CSV
>   column order.** Adding or reordering a column edits `TELEMETRY_FIELDS` and the
>   matching line in `push()` **together** — the list drives the header, `push()`
>   drives the data, and they must never drift.
> - ⛔ **Three column kinds and the names do not tell you which:**
>   **instantaneous**, **cumulative**, **sawtooth**. Document each column's kind at
>   its definition; ⛔ sawtooth columns are excluded **by name** from any
>   monotonicity check.
> - ⛔ **Capture is a session switch: opt-in, OFF at every launch, never
>   persisted.** A launch must be unable to revive a stale "was ON last session"
>   state.
> - ⛔ **Sampled from `update()`, on the simulation clock — never from `draw()`.**
>   `draw()` runs on a frame clock and `update()` does not.
> - ⛔ **The ring latches `wrapped` the first time it drops a row, and the export
>   reports it in the header block.** Orbital Overhaul's v4 lesson: a total read
>   off a silently-wrapped buffer is wrong and nothing says so.
>
> ⛔ **NO PERSISTENCE THIS CHANGESET, and the reason is a shipped rule rather than
> a preference.** `CLAUDE.md`: `kit-storage` owns the keyspace and
> `Profiles.keyFor(base)` is the one route to a key. **Measured at `1d64329`:**
> `src/22-meta.js` is a one-line placeholder and the only `Kit*` reference in
> `src/` is `shell.html:38`'s leaderboard bridge. There is no keyspace and no
> `Profiles`. Writing telemetry to storage now would mean the game choosing a raw
> `localStorage` key name, which `CLAUDE.md` forbids outright. ⛔ CS011 owns
> persistence, the profile scope and `read()`'s envelope-version rejection; say so
> in `STATUS.md`'s carried tasks.
>
> **2. The columns.** `PLANNED-FEATURES-CS007.md` §6.3 proposes a list; it is
> ⚠ PREDICTED, not measured, and this phase owns the final one. ⛔ **Sample every
> heat-derived value** — `heat`, `spawnInterval`, `enemyConcurrent`, `climbMult`,
> `weaverApex`, `surgeInterval` — that is what makes the log a tuning instrument
> rather than a score log, and it is the whole reason `ROADMAP.md` pairs telemetry
> with this changeset. ⛔ Also sample `enemiesAlive` **and** `threatsAlive` and
> `thornsStanding` separately, so P1's split is visible in the field, and a
> cumulative `spawnBlockedTicks`, which is the stall's own signature.
>
> ⛔ **Ship `score`, `mode` and `startDepth` as columns now**, with their
> known-constant values (0, `"classic"`, 1) until CS008. GDD §15.6's rule is that a
> column change edits two things together; a column added in CS008 invalidates
> every CS007 log.
>
> ⚠ **Cross-check the names against the seven `statsFields` the Worker already
> registers for `vector-vortex`** — `level_reached`, `mode`, `start_depth`,
> `wells_cleared`, `purges_spent`, `max_combo`, `deaths` — so the two instruments
> agree. (**Measured:** the registration already exists in `coinless-kit` at
> `79206f3`; `STATUS.md`'s carried task saying it is outstanding is stale and P5
> corrects it.)
>
> **3. The surface.** There is no HUD and no Options screen until CS008, so ⛔ **the
> surface is the debug bench**, which P3 just made permanent. Two actions: toggle
> capture, export.
>
> ⛔ **Export writes the CSV to `console.log`.** It is the only path that works on
> `file://`, and the built game must open and play from a double-click. A
> `navigator.clipboard.writeText` attempt may sit beside it **inside a try/catch**
> — `file://` is not a secure context, so failure is the normal path, exactly as
> `EXTERNAL-FILES.md`'s rule 1 requires. ⛔ **Never an `<a download>`, never a
> `fetch`.** ⛔ Log the new key(s) wherever `PLAYTEST.md` names the bench.
>
> **4. `scratchpad/test-cs007-p4.js`.**
> - ⛔ **GDD §17 item 11:** `TELEMETRY_FIELDS` and `push()` agree in length **and
>   order** — drive the real `push()` and compare the row's key order to the list.
> - Capture defaults OFF, and a fresh boot cannot turn it on.
> - The ring is bounded, and `wrapped` latches exactly once.
> - The CSV's header line is `TELEMETRY_FIELDS.join(",")`, and every data row has
>   the same arity.
> - ⛔ **The 10,000-tick determinism hash is IDENTICAL with capture ON and OFF.**
>   That is this phase's headline assertion: an instrument that perturbs the run it
>   measures is worse than no instrument.
>
> **5. `EXTERNAL-FILES.md`** — nothing new loads, so nothing is added; say so in
> `STATUS.md` rather than leaving it ambiguous.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing. ⛔ Edit
> docs in place. ⛔ Do not push.

---

## P5 — the soak, the docs, the close

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, `ROADMAP.md`, `DIFFICULTY-NOTES.md`, then
> `PLANNED-FEATURES-CS007.md` §7 (acceptance criteria) in full, and
> `VECTOR-VORTEX-GDD.md` §0, §1, §8, §8.1, §8.2, §15.6, §17, §19. Then read
> `scratchpad/test-cs006-p5.js` end to end including its six-trap header.
> ultrathink.
>
> The closing phase. Four jobs: the soak, the acceptance sweep, the difficulty
> document, and the close.
>
> **1. `scratchpad/test-cs007-p5.js` — a FIFTH soak file, not an edit to the other
> four.** `STATUS.md`: *"Four soaks, and they prove different things on different
> boards… A future changeset extends the pattern with a fifth file rather than
> widening a closed one."* This one owns **the escalating run**.
>
> Extend `test-cs006-p5.js` rather than restate it — same hash mixer, same
> recorded input list shape, same NaN walker, same fixtures — so a reader who knows
> one knows all five. ⛔ Do **not** restate the other four's lane bounds, lattice
> cases, per-well §17 item 3 soak or Dive coverage; those are their changesets'
> claims. Cover, at minimum:
>
> - **§17 item 1** with heat in the hash: 10,000 ticks, identical in one process
>   and across two, and a different seed moves it. ⛔ The hashed run must actually
>   **cross an introduction boundary** — assert it reached level 5 or better, or
>   the claim is about a schedule that never fired.
> - **§17 item 12**, twenty seeded runs to game over: no exception, no NaN, no
>   unbounded array.
> - ⛔ **A run that never presses fire still terminates.** With the schedule live
>   this is a stronger claim than it was for CS006 — a passive run now meets
>   Weavers, Thorns and Drifters.
> - ⛔ **The escalation is observable, not merely present.** Across the runs,
>   assert that each of the seven eligible kinds first appears at or after its
>   scheduled level and **never before it**. That is GDD §1.1 P3 —
>   *"escalation you can name"* — as an assertion.
> - ⛔ **No well stalls.** For every well entered in the twenty runs, assert the
>   quota spends and the level advances inside a bounded tick budget. This is P1's
>   claim, verified end to end on a board P1 could not reach.
> - ⛔ **Every derived value stays inside its clamp during a live run**, sampled
>   from the real accessors — not only as the arithmetic property P2 asserts.
>
> ⛔ Use the fixture shapes the other soaks use, and ⛔ **put every fixture back and
> assert it went back.**
>
> **2. ⛔ Check `PLANNED-FEATURES-CS007.md` §7's acceptance criteria one by one**
> and say which are met, in `log/CS007.md`. Not "all green" — the list, with a
> verdict each. Anything unmet is a ⛔ line in `STATUS.md` with an owner.
>
> **3. `DIFFICULTY-NOTES.md` — ⛔ CORRECTED IN PLACE, Paul's, 2026-08-31.** Not
> rewritten: H3's own finding is that the document *"survives in shape and fails in
> detail"*, and its curve already matches `00-config.js` exactly. When you are
> done: every row names its clamp **and the constant that holds it**, the two rows
> that are one knob say so (Weaver thorn length **is** apex), the introduction
> schedule matches §8.1 and the build, the concurrency ladder's step levels are
> written down, and ⛔ **`SPAWN_MIN` — a constant that never existed — does not
> appear anywhere.** It is the one document in the repo never exercised; this is
> the phase that exercises it.
>
> **4. The close.**
>
> - `log/CS007.md`: the narrative, the shipped constants and their values, every
>   judgment call, ⛔ **all four baseline re-records with their one cause each**,
>   the seven closed-file edits with their causes, the acceptance verdicts, and the
>   version-history entry. ⛔ There is no central changelog.
> - `STATUS.md`: ⛔ move the whole thing to `log/CS007.md` and reset it for CS008.
>   Target under 250 lines. Carry forward, unchanged in substance: the ⚠
>   provisional palette, `glow-lab` unbuilt and unowned, the `07-enemies.js` split
>   at CS012, the Dive's missing visual, the past-99 `startGame` defect that goes
>   live with Start Depth, and the rim-parked-Carrier reading.
>   ⛔ **DELETE the standing-Thorn stall entry — P1 fixed it** — and ⛔ **correct
>   the carried task that says `vector-vortex` still needs registering in the
>   Worker's `registry.js`: measured, it is already there at `79206f3` with all
>   seven `statsFields`.** What remains is confirming the deployed Worker carries
>   it, which is CS011's.
> - `ROADMAP.md`: mark CS007 closed, with what actually shipped against the row and
>   ⚠ what it deliberately left. ⛔ **Correct the "Why this order" paragraph that
>   says the introduction schedule is what moves `GOLDEN_LANES`** — measured false;
>   heat's level-2 spawn interval is what moved it, and the schedule's own window
>   never leaves level 2.
> - `scratchpad/test-registry.js`: ⛔ confirm `COUNTS` reads `wells: 16`,
>   `openWells: 6`, `tracks: 0`, `enemies: 6`, `enemyKinds: 9` — **unchanged.**
>   This changeset adds no enemy and no kind.
> - `PLAYTEST.md`: add the changeset's asks — ⛔ **one ⛔ only**, the ask CS007
>   exists for. Mine would be *"can you NAME what changed at level 5, at 9, at
>   13 — or does it just feel busier?"*, which is GDD §1.1 P3 and the one thing the
>   suite cannot check. The bench keys are permanent now; say so where that file
>   depends on them.
> - Archive `PLANNED-FEATURES-CS007.md` and `IMPLEMENTATION-PHASES-CS007.md` to
>   `archive/`, and leave a pointer in `STATUS.md`'s "Next up" to anything CS008
>   inherits.
>
> **5. Version.** Bump `C.GAME_VERSION` and `STATUS.md`'s header line.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing. ⛔
> **Zero skips and zero failures.** A closing phase asserts zero skips and leaves
> nothing red. ⛔ Edit docs in place; never print one for copy-paste. ⛔ Do not push.

---

## Assumptions and decisions

| # | Decision | What would change it |
|---|---|---|
| 1 | **Five phases**, and P1 is deliberately small. ⚠ **Six until H1 was answered** — the hard cap removed the only production code the old P3 was to write, and a phase whose whole content is a property test is its neighbour's acceptance criterion | A phase that overruns a session means the seam was wrong; P4 (telemetry) is the one with slack |
| 2 | ⛔ **P1 is first and is its own commit** | Nothing. Measured: every seed stalls for ~5 minutes on a level-5 board at the shipped concurrency. A fix that lands in the same commit as the thing it fixes is a diff nobody can review |
| 3 | ⛔ **P2 proves the guarantee BEFORE it wires an accessor** | Nothing. It is the only work in the changeset whose failure mode is a life lost every 1.5 s, and last-in-a-long-session is where that gets squeezed |
| 4 | **Four re-records, each with one cause**, rather than one compound one at the close | `ROADMAP.md`'s own argument, and merging phases to reduce the count would leave the suite red between them |
| 5 | P4 (telemetry) is medium and carries the overflow | It touches one placeholder module and one debug action, and nothing else in the build depends on it |
| 6 | The GDD's §8.1 rows for level 1/2 and level 8 are **documented, not implemented** | Measured: `C.VAULT_FIRST_LEVEL` 2 and `wellIndex = (level-1) % 16` already deliver both |
| 7 | `DIFFICULTY-NOTES.md` is corrected **in P5**, not in P2 | Correcting it before the schedule lands means correcting it twice; the closing phase sees a finished build |
