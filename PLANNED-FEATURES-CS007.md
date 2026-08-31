# PLANNED-FEATURES-CS007 — the run escalates

**The heat clock and every value derived from it, GDD §8.1's introduction
schedule, the spawner-stall split, and telemetry as the tuning instrument.**

⛔ **EVERY CLAIM IN THIS DOCUMENT IS MARKED MEASURED OR PREDICTED.** A **MEASURED**
claim names the command and the commit it was measured at. A **PREDICTED** one
says so. `PLANNED-FEATURES-CS006.md` made three predictions that were one command
away and got all three wrong; two cost a build phase. See `DECISIONS.md`,
2026-08-31.

**Baseline for every measurement in this document: commit `1d64329`.**
`node build.js` → 24 modules, 290.5 KB. `node scratchpad/run-all.js` → **29 test
files passed, zero skips, exit 0.** Every probe below was run against that build;
probes live outside the repo and this session wrote no code into `src/`,
`scratchpad/` or `tools/` (`CLAUDE.md` session rule 3a).

---

## ⛔ 0. THE THREE CALLS THAT WERE PAUL'S — ✅ ALL ANSWERED 2026-08-31

`CLAUDE.md` session rule 3 binds a planning session: being able to read the code
is not authority to decide what the game does. This session surfaced three calls
with their options measured and answered none of them; **Paul answered all three
on 2026-08-31**, in this session, after the measurements below were in front of
him. `DECISIONS.md` carries the entry.

| | The call | ✅ Answer |
|---|---|---|
| **H1** | How the respawn guarantee survives heat | **A hard `C.CLIMB_MULT_MAX` of 1.40; `RESPAWN_PUSH_DEPTH` stays 0.55.** ⛔ No derived push, no `respawnPush()`, no `RESPAWN_PUSH_MARGIN` |
| **H3** | The five floor/ceiling values, and the mapping shape | **Form A endpoint interpolation, `HEAT_FULL_LEVEL` 99, "Mid" package** — §5.1 |
| **C3** | Carrier cargo weights | **Emergent from the introduction schedule. No weight table, no new constants** |

⛔ **The measured option tables below are LEFT IN PLACE.** They are the reasoning
behind the answers, not a menu still open; a build phase reads the answer and the
tables tell it what the answer was chosen against.

⛔ **H1's answer removed the only production code P3 was to write, so the plan is
now FIVE phases, not six** — see `IMPLEMENTATION-PHASES-CS007.md`.

⛔ **H2 is not a call — it is a constraint this document carries throughout, and
this session verified it empirically.** See §2.4.
⛔ **H4 is SETTLED** (Paul, 2026-08-31, `DECISIONS.md`) and P1 builds it.
⛔ **H5 is settled**: the seven debug keys survive the constant and stop being ⚠
TEMPORARY. **H6 is done** — `test-cs006-p5.js` carries the count-based form.

---

## 1. ⛔ WHAT THIS SESSION MEASURED, AND WHERE THE HANDOVER WAS WRONG

Six findings. Four correct a prediction that was standing in `STATUS.md`,
`ROADMAP.md` or the CS006 handover.

### 1.1 ⛔ MEASURED — the introduction schedule does NOT move `GOLDEN_LANES`. Heat does, and it only APPENDS.

`STATUS.md` and `ROADMAP.md` both say CS007 moves `test-cs004-p1.js`'s
`GOLDEN_LANES` because *"the introduction schedule changes the draw count per
spawn."* **That is false.**

**MEASURED** (probe: drive `test-cs004-p1.js`'s own `spawnLaneRun()` fixture and
record `state.level` at each spawn; `1d64329`):

```
lanes  : 10,10,12,0,8,14,12,12,8,14,10,0,7,7,12,3
levels :  1, 1, 1,1,1, 1, 1, 1,1, 1, 2,2,2,2, 2,2
ticks per level: {"1":2065,"2":935}   final level: 2
```

⛔ **The golden's 3,000-tick window never leaves level 2.** Under GDD §8.1 the
eligible spawn set is `[vaulter]` at level 1 **and** at level 2 — level 2
introduces *vaulting*, not a kind — so the schedule's kind pick faces a one-entry
list for the whole window and, by the ⛔ no-draw rule, spends nothing. The
schedule alone leaves the sequence character-identical.

**What does move it is heat**, through the level-2 spawn interval. **MEASURED**
(probe: rewrite `C.SPAWN_INTERVAL` / `C.ENEMY_CONCURRENT` / `C.VAULT_*` from
`state.level` before each tick — every reader in the build reads `C.X` at use
time, so this is behaviourally a heat-derived accessor):

| Curve driven | Result |
|---|---|
| control (nothing) | `[…,12,3]` — 16 entries, identical |
| interp base→clamp at heat(27) | `[…,12,3,2]` — **17 entries, first 16 unchanged** |
| multiplier `1/(1+0.35h)` | `[…,12,3,2]` — **17 entries, first 16 unchanged** |
| spawn interval **alone** | `[…,12,3,2]` — **17 entries, first 16 unchanged** |
| climb rate **alone** | 16 entries, **identical** |
| L2 interval 0.55 **and** concurrency 8 | 19 entries, **first 16 unchanged** |
| L2 interval 0.55 **and** concurrency 8 **and** climb ×1.40 | 20 entries, diverges at index **13** |

⛔ **Two properties fall out of this and both are acceptance criteria for P2.**

1. **Entries 0–9 are invariant under ANY heat curve with `heat(1) = 0`**, because
   level 1 is then bit-identical. A re-record that moves them is not a legitimate
   move — it is heat leaking into level 1, or a draw spent at level 1.
2. **The array GROWS.** Every curve measured added spawns to the window; none
   removed one. Entries 10–15 (level 2) move only once the level-2 board is busy
   enough for `pickSpawnLane`'s crowding redraw to fire.

⛔ **So the one sanctioned `GOLDEN_LANES` re-record belongs to P2, and its cause
is "heat lowers the level-2 spawn interval, so another spawn fits the window" —
not the introduction schedule.**

### 1.2 ⛔ MEASURED — CS007 moves a SECOND baseline, and `STATUS.md` says there is only one.

`test-cs006-p2.js:399` carries `P1_DETERMINISM_HASH = 2063617640`, and its trap 4
says why it is a constant at all: *"The determinism hash comes from a CHILD
PROCESS running the closed `test-cs005-p5.js`."* That soak drives a six-kind board
for 10,000 ticks and **reaches level 15** — so it is inside heat's reach, inside
the schedule's reach, and inside the split's reach.

**MEASURED**, three independent causes, each verified separately at `1d64329`:

| Cause | Evidence |
|---|---|
| **the threats split (P1)** | Replaying `test-cs005-p5.js`'s `hashRun` fixture (MIXED, `ENEMY_CONCURRENT` 3, seed 20260830, 10,000 ticks): **1,082 ticks** where the spawner is blocked and `threats < 3`, **first at tick 3,380**. Max board 5, max standing Thorns 3. |
| **heat (P2)** | Running `test-cs005-p5.js` under the per-level `C` emulation: in-process hash **3605983985** against the clean child's **2063617640**. |
| **the schedule (P3)** | The soak's `C.DEBUG_SPAWN_KINDS = MIXED` fixture is deleted with the constant and must be replaced by a level (§4.4); any replacement changes the run. |

⛔ **CS007 therefore re-records `P1_DETERMINISM_HASH` three times — once per
moving phase — and `GOLDEN_LANES` once.** That is deliberate, and it is
`ROADMAP.md`'s own preference stated back: *"two small, separately-reasoned
re-records instead of one large one that absorbs three unrelated causes at once —
and a re-record is the one moment a stray RNG draw can be laundered into a new
baseline, so a re-record with one nameable cause is worth two commits."* Merging
the phases to get one re-record would leave the suite red between them, which
`CLAUDE.md`'s test rules forbid.

⛔ **Deleting the constant instead was considered and rejected.** `CLAUDE.md`:
a later changeset *"rewrites those assertions IN PLACE to the replacement
behaviour. It does not delete them, does not weaken them."* A re-record **is**
that rewrite.

⛔ **What keeps each re-record honest** — all three already exist and none needs a
baseline:
- `test-cs006-p2.js`'s three geometry goldens (`GOLDEN_SCREEN`, `GOLDEN_LANE`,
  `GOLDEN_MIN_SPOKE_PX`, all still on their original `8e0fb7c` recordings) and its
  §8 source assertion. **PREDICTED** they do not move: heat, the schedule and the
  split touch no geometry constant and no well data.
- `test-cs006-p5.js`'s draws-per-spawn count (§4.5).
- `GOLDEN_LANES`'s own level-1 prefix (§1.1).

### 1.3 ⛔ MEASURED — the introduction schedule reaches SIX closed test files, and all three closing soaks go RED, loudly.

**Probe:** wrap `H.buildGame` so `C.DEBUG_SPAWN_KINDS` is a getter returning
`["vaulter"]` with a silent setter — the exact shape of the constant being
deleted and the schedule answering `[vaulter]` at level 1 — then run each closed
file unmodified.

| File | Result |
|---|---|
| `test-cs004-p1.js` | **FAIL** 2/59 — the `MIXED` kind-run block (lines 236–254) |
| `test-cs005-p2.js` | green — but its `["drifter"]` fixture (682–688) becomes a **vacuous** Vaulter well |
| `test-cs005-p3.js` | green — same, its `["surger"]` fixture (668–677) |
| `test-cs004-p5.js` | **FAIL** 26/212 — every non-vacuity assertion, on all six wells |
| `test-cs005-p5.js` | **FAIL** 33/196 — all six roster classes absent, no Thorn laid, no Drifter phase seen |
| `test-cs006-p5.js` | **FAIL** 7/59 — including ⛔ **the draws-per-spawn control**, whose two-entry case is built from the constant |

⛔ **ANSWER TO "do the three closing soaks' fixtures survive it": NO — and that is
the good outcome.** They fail loudly on their own non-vacuity assertions rather
than silently passing over a Vaulter-only board. **The fixtures must be repaired
in place** (§4.4), not relaxed.

⚠ The `hash identically across two processes` failures in that run are **probe
artifacts** — the child process does not carry the emulation. They are not a
finding.

⚠ **The emulation keeps the constant PRESENT.** Real deletion additionally turns
`test-cs004-p1.js:220–221` and `:256`, `test-cs005-p2.js:677,688` and
`test-cs005-p3.js:663,677` red — they assert `C.DEBUG_SPAWN_KINDS` is a list
equal to `["vaulter"]`. **Seven files in total, plus `_harness.js`'s export
comment at line 150.**

### 1.4 ⛔ MEASURED — heat alone leaves 25 of 29 test files green, and H2's discipline is why.

**Probe:** install a setter on `state.level` that rewrites the heat-derived
constants in `C` from a candidate curve (interp base→clamp at `heat(27)`;
climb ×1.40, spawn interval → 0.55, concurrency → 8, vault intervals → 0.90 /
0.32, surge interval → 1.20, apex → 0.75), then run each closed file unmodified.

| File | Under heat |
|---|---|
| `test-cs003-p1/p2/p3/p4`, `test-cs006-p1/p3/p4` | **green** |
| the 18 files that never leave level 1 (see below) | **unreachable** — `heat(1) = 0`, so every derived value is its base |
| `test-cs004-p1.js` | **1 failure: the golden, `[…,12,3,2]`** — §1.1 |
| `test-cs003-p5.js`, `test-cs006-p5.js` | only the cross-process hash (probe artifact) |
| `test-cs004-p5.js` | +2: `Fan: an enemy reached an end lane`, `Fan: a Carrier split` — **non-vacuity, not correctness** |
| `test-cs005-p5.js` | +6: all of them non-vacuity (`all SIX roster classes`, `the wall was exercised`, `a Weaver laid a Thorn`) |

⛔ **Not one lane bound, lattice assertion, wall-behaviour assertion or contract
assertion went red under heat.** That is H2's discipline measured rather than
argued: heat scaled climbs and intervals and never a hop or cross duration, so
every derived per-tick bound in three closed soaks stayed valid without being
re-derived.

**MEASURED — the maximum `state.level` each closed file ever reaches** (probe:
a tracking setter on `state.level`). This is the heat clock's whole exposure
surface:

```
level 1 only (18 files, provably unreachable by heat):
  cs001-p0 p1 p2 p3 · cs002-p1 p2 p3 p4 · cs004-p2 p3 p4
  cs005-p1 p2 p3 p4 · cs006-p2 · test-registry
reachable:  cs004-p1 → 2 · cs003-p4 → 4 · cs006-p3 → 4 · cs003-p1 → 5
            cs003-p3 → 5 · cs006-p5 → 7 · cs003-p5 → 15 · cs004-p5 → 15
            cs005-p5 → 15 · cs003-p2 → 36 · cs006-p4 → 150 · cs006-p1 → 300
```

⚠ `cs006-p1` (300) and `cs006-p4` (150) drive the level directly to exercise
past-99 progression and the band table; they run no simulation there, and both
were **green** under the heat emulation.

### 1.5 ⛔ MEASURED — GDD §8.1's "8 | First open well" is already delivered and costs CS007 nothing.

`nextWell()` maps `wellIndex = (level - 1) % 16`, so level 8 → `WELLS[7]` =
**Vee, `closed: false`, 13 lanes** — GDD §3.4's *"First open well; teaches the
corner."* That row of §8.1 is documentation of shipped behaviour, not a code
change. ⛔ Nothing in P3 touches well selection.

### 1.6 ⛔ MEASURED — `vector-vortex` is ALREADY registered in the Worker's leaderboard registry.

`STATUS.md` carries a task: *"Register `vector-vortex` in the Worker's
`services/leaderboard/src/registry.js` with the seven stats keys."*
`~/projects/game/coinless-kit/services/leaderboard/src/registry.js` already has
it (`79206f3`), with exactly seven `statsFields`:

```
level_reached · mode · start_depth · wells_cleared · purges_spent · max_combo · deaths
```

⚠ Registered **in that repo**; whether the deployed Worker carries it is not
measurable from here. Not CS007's scope — it is CS011's — but P4's telemetry
columns should be a **superset** of those seven so the two instruments agree.
P5 corrects the carried task's wording.

---

## 2. THE HEAT CLOCK

### 2.1 What ships, and where

⛔ **One clock: `game.level`.** Every derived value comes off `heat(state.level)`.
No parallel clocks. `heat()` lands in `src/00-config.js`'s neighbourhood as a
function beside `C` — ⛔ **its four constants (`HEAT_BASE`, `HEAT_RISE`,
`HEAT_KNEE`, `HEAT_LINEAR`) already ship and are unchanged.**

**MEASURED** at `1d64329` (probe: the shipped formula over levels 1..200):

```
heat(1)  = 0.00000      heat(27)  = 1.50688      heat(99)  = 2.96000
heat(2)  = 0.17352      heat(30)  = 1.57204      heat(100) = 2.98000
heat(5)  = 0.56658      heat(40)  = 1.77850      heat(150) = 3.98000
heat(9)  = 0.89640      heat(50)  = 1.97972      heat(200) = 4.98000
heat(13) = 1.10466      heat(65)  = 2.27998
heat(18) = 1.28118      heat(80)  = 2.58000
strictly monotone over 1..200: yes        heat(1) = 0 exactly: yes
```

⛔ **`heat(1) = 0` exactly is load-bearing and is a P2 acceptance criterion.** It
is what makes every level-1 test in the suite (18 of 29 files) provably
unreachable, and what makes `GOLDEN_LANES`'s first ten entries invariant.

### 2.2 ⛔ The seven derived values, and one accessor each

⛔ **No call site computes heat inline.** Each derived value is one function; the
entity reads the function, never `C.<BASE>` directly. That is what makes the
clamp enforceable in one place and testable as a property.

| Derived value | Accessor | Base (shipped) | Clamp — ⛔ **H3, Paul's** |
|---|---|---|---|
| Spawn interval | `spawnInterval()` | `SPAWN_INTERVAL` 1.60 | floor `SPAWN_INTERVAL_MIN` ✅ **0.70** |
| Concurrent enemies | `enemyConcurrent()` | `ENEMY_CONCURRENT` 3 | ceiling ✅ **`ENEMY_CONCURRENT_MAX` 8**, itself under ⛔ `ENEMY_CAP` 16 |
| Enemy climb rate | `climbMult()` | ×1 on every entity climb | ceiling `CLIMB_MULT_MAX` ✅ **1.40** |
| Vault interval | `vaultInterval()` | `VAULT_INTERVAL` 2.20 | floor `VAULT_INTERVAL_MIN` ✅ **1.00** |
| Rim hunt interval | `vaultRimInterval()` | `VAULT_RIM_INTERVAL` 0.55 | floor `VAULT_RIM_INTERVAL_MIN` ✅ **0.35** |
| Surge frequency | `surgeInterval()` | `SURGE_INTERVAL` 2.60 | floor `SURGE_INTERVAL_MIN` ✅ **1.40** |
| Weaver thorn length **= apex** | `weaverApex()` | `WEAVER_APEX` 0.55 | ceiling `WEAVER_APEX_MAX` ✅ **0.75** |
| Carrier cargo weights | — | — | ✅ **none — emergent from the schedule** (C3) |

⛔ **`climbMult()` is ONE multiplier applied to every entity's climb rate** —
`VAULT_CLIMB`, `CARRIER_CLIMB`, `WEAVER_CLIMB`, `DRIFT_CLIMB`, `SURGE_CLIMB`.
GDD §8 says *"climb speed"*, singular, and one multiplier is what keeps the
respawn guarantee (§3) a single arithmetic statement.

⛔ **`WEAVER_BOLT_SPEED` and `WEAVER_RETREAT` are NOT heat-scaled.** GDD §8's list
is spawn interval, concurrent cap, climb speed, vault interval, surge frequency,
Weaver thorn length, and cargo weights. A bolt is ordnance, not a climb; a retreat
is a departure. ⛔ Scaling the bolt would make the Weaver's warning window shrink
twice over — once through the apex, once through the speed.

### 2.3 ⛔ MEASURED — no `C.HEAT_HOLD_LEVEL` is needed, and CS006 P1's prediction is superseded.

`src/02-state.js` and `PLANNED-FEATURES-CS006.md` both anticipate
`heat(min(level, C.HEAT_HOLD_LEVEL))`, with the hold ⛔ **in the caller** so
`heat()` itself never plateaus and GDD §17 item 7 (`heat(n+1) > heat(n)` for
n in 1..200) stays literally true.

⛔ **The hold-in-the-caller rule stands and is not re-litigated. The constant is
not needed.** **MEASURED:** with a clamp on every one of the seven rows above —
which is exactly what H3 asks for — every derived value is at its clamp past its
own saturation level, so heat past that point has **no effect on any value in the
build**. A hold is then inert by construction, and GDD §17 item 7 stays green on
the shipped formula with no clamping inside `heat()` at all.

⚠ **The condition is "every row clamped".** ✅ **H3's answer clamps all seven
rows**, so the condition is met and no hold ships. **P2 asserts the property, not
the constant.**

### 2.4 ⛔ H2 — the constraint this document carries, now measured

> ⛔ **Heat scales intervals, climb rates and the Weaver's apex. It never scales a
> crossing or hop duration.** `VAULT_HOP_TIME`, `DRIFT_CROSS_TIME` and
> `DRIFT_RIDE_TIME` are untouched by the clock.

**MEASURED** (§1.4): under a heat curve that scaled five climb rates, four
intervals and the apex, **every derived lane bound in three closed soaks stayed
green**. Those bounds are, by grep at `1d64329`:

```
test-cs003-p5.js:232   MAX_LANE_STEP = 2 * DT / C.VAULT_HOP_TIME
test-cs004-p5.js:336   MAX_LANE_STEP = 2 * DT / C.VAULT_HOP_TIME
test-cs005-p5.js:399   MAX_LANE_STEP = 2 * DT / C.VAULT_HOP_TIME
test-cs005-p5.js:634   MAX_CROSS_STEP, from C.DRIFT_CROSS_TIME
```

⛔ **And `SURGE_DISCHARGE < RESPAWN_INVULN` survives untouched.** GDD §8 lists
*surge frequency*, which is `SURGE_INTERVAL`; it does not list discharge duration.
`test-cs005-p3.js`'s constant-pair assertion **stays green and is not edited.**
`DRIFT_RIDE_TIME` is the armour budget and `00-config.js` carries a ⛔ on raising
it.

---

## 3. ⛔ H1 — THE RESPAWN GUARANTEE UNDER HEAT (PAUL'S CALL, OPEN)

### 3.1 The guarantee, and what heat does to it

GDD §4.4: enemies at the rim are pushed to `RESPAWN_PUSH_DEPTH` on respawn so the
player is never killed on re-entry. The arithmetic:

```
(1 - RIM_CONTACT_DEPTH - RESPAWN_PUSH_DEPTH) / climb  >  RESPAWN_INVULN
(1 - 0.05 - 0.55) / 0.18 = 2.222 s  >  1.5 s   ✓ at VAULT_CLIMB
```

**MEASURED** — the margin is 0.722 s and it is spent by a climb multiplier of
**1.4815**.

**MEASURED — the binding entity, over the whole roster** (time from the push
depth 0.55 to `killDepth` 0.95, base rates):

| Constant | depth/s | time | verdict |
|---|---|---|---|
| `VAULT_CLIMB` | 0.180 | 2.222 s | ⛔ **the binding contact-killer** |
| `SURGE_CLIMB` | 0.150 | 2.667 s | safe |
| `DRIFT_CLIMB` | 0.130 | 3.077 s | safe |
| `CARRIER_CLIMB` | 0.110 | 3.636 s | safe |
| `WEAVER_CLIMB` | 0.220 | 1.818 s | `killDepth = null` — never contact-kills |
| `WEAVER_BOLT_SPEED` | 0.320 | **1.250 s** | ⚠ **see below** |

⚠ **The bolt is the fastest thing on the board that carries a rim `killDepth`,
and it is safe by SELF-TERMINATION, not by the arithmetic.** Pushed to 0.55 it
reaches `killDepth` at 1.250 s — inside the 1.5 s window — and then dies:
`WeaverBolt.update()` sets `dead` on the step after `depth >= 1`, which is
**1.406 s + one step**, still inside the window. ⛔ **So `CLIMB_MAX_BASE` is
`VAULT_CLIMB` 0.18 and not `WEAVER_BOLT_SPEED` 0.32**, and the reason is written
here so a build phase neither misses it nor over-pushes for it. ⛔ It is also the
reason the bolt must not be heat-scaled (§2.2): a *faster* bolt is safer, but a
slower one would breach.

### 3.2 ⛔ OPTION 1 — the derived push (H1's recommendation)

```js
function respawnPush() {
  const worst = C.CLIMB_MAX_BASE * climbMult();
  const need  = (1 - C.RIM_CONTACT_DEPTH) - worst * C.RESPAWN_INVULN * C.RESPAWN_PUSH_MARGIN;
  return Math.min(C.RESPAWN_PUSH_DEPTH, need);
}
```

The guarantee is the spec and the number falls out of it. ⛔ Monotone-safe — the
push can only move an enemy *away* from the rim, which is the property GDD §4.4's
⚠ SETTLED clamp rests on.

**MEASURED — what it evaluates to** (`RIM_CONTACT_DEPTH` 0.05, `RESPAWN_INVULN`
1.5, `CLIMB_MAX_BASE` 0.18):

| climb mult | `MARGIN` 1.00 | `MARGIN` 1.10 | `MARGIN` 1.25 |
|---|---|---|---|
| 1.00 | 0.5500 | 0.5500 | 0.5500 |
| 1.20 | 0.5500 | 0.5500 | 0.5450 |
| 1.35 | 0.5500 | 0.5490 | 0.4944 |
| 1.40 | 0.5500 | 0.5342 | 0.4775 |
| 1.4815 | 0.5500 | 0.5100 | 0.4500 |
| 1.80 | 0.4640 | 0.4154 | 0.3425 |
| 2.00 | 0.4100 | 0.3560 | 0.2750 |
| 2.50 | **0.2750** | ⛔ 0.2075 | ⛔ 0.1063 |
| 3.00 | ⛔ 0.1400 | ⛔ 0.0590 | ⛔ **−0.0625** |

⛔ **MEASURED — the derived push has a hard floor of its own, and it is
`C.READABILITY_DEPTH` 0.25.** Below it, respawn-pushed enemies land in the band
where nothing opaque may be drawn (`CLAUDE.md`, Rendering; GDD §10.3) — the push
itself becomes illegible, which is §1.1 P2 failing at the exact moment the rule
exists to protect. Back-solved: the multiplier ceiling that keeps the push at or
above 0.25 is **2.593** at `MARGIN` 1.00, **2.357** at 1.10, **2.074** at 1.25.

⛔ **So the two options are not "derived push OR a cap". They are "a cap near
1.48" versus "a derived push AND a looser cap near 2.4".** Either way
`CLIMB_MULT_MAX` ships.

⚠ **MEASURED — at `CLIMB_MULT_MAX` 1.40 the derived push is INERT.** At `MARGIN`
1.00 it evaluates to exactly 0.55 at every multiplier up to 1.4815; at `MARGIN`
1.10 it reaches 0.5342 at the ceiling. H1's *"inert until level ~90, 0.534 at 99"*
matches `MARGIN` ≈ 1.10 on a slow multiplier form — **MEASURED**, per mapping
form, for `CLIMB_MULT_MAX` 1.40:

| Mapping form | reaches 1.347 (push engages, MARGIN 1.10) | reaches the ceiling |
|---|---|---|
| interp over `heat/heat(27)` | L19 | L28 |
| interp over `heat/heat(50)` | L37 | L51 |
| `1 + 0.25·heat`, capped | L22 | L32 |
| `1 + 0.15·heat`, capped | L67 | L85 |

### 3.3 ⛔ OPTION 2 — a hard `CLIMB_MULT_MAX` low enough that 0.55 always holds

**MEASURED — the difficulty consequence, which is the actual question:**

| `CLIMB_MULT_MAX` | Vaulter climb | **throat→rim** | push-to-kill time | margin vs 1.5 s |
|---|---|---|---|---|
| 1.00 (today) | 0.180 | **5.56 s** | 2.222 s | +0.722 |
| 1.20 | 0.216 | 4.63 s | 1.852 s | +0.352 |
| 1.30 | 0.234 | 4.27 s | 1.709 s | +0.209 |
| **1.40** | 0.252 | **3.97 s** | 1.587 s | +0.087 |
| 1.45 | 0.261 | 3.83 s | 1.533 s | +0.033 |
| 1.4815 | 0.267 | 3.75 s | 1.500 s | ⛔ **0.000 — breach** |
| 2.00 | 0.360 | **2.78 s** | 1.111 s | ⛔ −0.389 |

### 3.4 ✅ ANSWERED — a hard `C.CLIMB_MULT_MAX` of **1.40**, and `RESPAWN_PUSH_DEPTH` stays 0.55

**Paul, 2026-08-31.** A Vaulter's terminal throat→rim is **3.97 s** against 5.56 s
at level 1, and the shipped 0.55 push holds with **+0.087 s** of margin.

⛔ **NOTHING IS BUILT FOR THE DERIVED PUSH.** No `respawnPush()`, no
`C.RESPAWN_PUSH_MARGIN`, no `C.CLIMB_MAX_BASE` derivation. **MEASURED: at a
ceiling of 1.40 the derived push evaluates to exactly 0.55 at every level, so it
would be dead code from the day it shipped.** A build phase that finds this
section's Option-1 sketch and builds it is building a decision that was not made.

⛔ **`C.CLIMB_MAX_BASE` still ships as a named constant** — 0.18, `VAULT_CLIMB`'s
value — because the §17 property below has to name the fastest contact-killer,
and naming it `VAULT_CLIMB` inside a respawn assertion is how a future entity
faster than a Vaulter escapes the guarantee silently.

**MEASURED — the whole roster at ×1.40, time from the 0.55 push to `killDepth`:**

| Constant | ×1.40 | push→kill | verdict |
|---|---|---|---|
| `VAULT_CLIMB` | 0.2520 | 1.587 s | ⛔ **binds — margin +0.087 s** |
| `SURGE_CLIMB` | 0.2100 | 1.905 s | +0.405 s |
| `DRIFT_CLIMB` | 0.1820 | 2.198 s | +0.698 s |
| `CARRIER_CLIMB` | 0.1540 | 2.597 s | +1.097 s |
| `WEAVER_CLIMB` | 0.3080 | — | `killDepth = null`, never contact-kills |
| `WEAVER_BOLT_SPEED` | ⛔ **0.32, unscaled** | 1.250 s | dies at depth 1 at 1.406 s + one step — inside the window |

⛔ **GDD §17 item 7's assertion is a property over levels 1..200 regardless**, and
it is what catches a future retune that walks past 1.4815 —

```
for level in 1..200:
    (1 - RIM_CONTACT_DEPTH - respawnPush(level)) / (CLIMB_MAX_BASE * climbMult(level))
        > RESPAWN_INVULN
    and every derived value of §2.2 is inside its clamp
```

`respawnPush(level)` is the constant 0.55 throughout. ⛔ **And the property must
be driven through the real `respawnSkimmer()` as well as evaluated as
arithmetic** — a property over constants is not a proof that the code reads them.

✅ **The guarantee therefore moves no baseline: `RESPAWN_PUSH_DEPTH` is
unchanged, so nothing about a respawn changes at any level.** That is what
collapsed the old P3 into P2.

---

## 4. THE SPAWNER: THE STALL SPLIT, THE SCHEDULE, AND WHAT THE SOAKS NEED

### 4.1 ⛔ H4 — SETTLED, and P1 builds it

`DECISIONS.md`, 2026-08-31. **The concurrency budget counts THREATS; the
readability ceiling keeps counting ENTITIES.**

- `spawnEnemy()`'s `C.ENEMY_CAP` check: ⛔ **unchanged**, raw
  `state.enemies.length`. A Thorn is drawn, so a readability ceiling counts it.
- `updateSpawner()`'s block: counts entities where `blocksClear && !dead`, against
  `enemyConcurrent()`.

⛔ Three follow-ons are settled with it and are **no change**: no Thorn expires,
`wellCleared()` is untouched, `C.ENEMY_CAP` is not raised. ⛔ **Do not
re-litigate any of this.**

### 4.2 ⛔ MEASURED — the stall repro, and how big it gets the moment Weavers arrive

**MEASURED at `1d64329`** — `STATUS.md`'s repro, re-run: three standing Thorns,
quota full, no input, 6,000 ticks (100 simulated seconds):

```
level    1 -> 1      quota  10 -> 10      board 3 -> 3
threats now 0        spawner blocked: true
```

**MEASURED** — blocked spawner beats that the threats split releases, by eligible
set, `ENEMY_CONCURRENT` 3, four seeds × 18,000 ticks, wall-to-wall driver.
"released" counts only beats where a non-blocking entity is actually on the board:

| Eligible set (GDD §8.1) | blocked ticks | released by the split | still blocked | mean end level |
|---|---|---|---|---|
| L1–2 `[vaulter]` | 7,027 | **0** | 7,027 | 11.8 |
| L3–4 `+carrierVaulter` | 10,499 | **0** | 10,499 | 7.3 |
| **L5–8 `+weaver`** | **30,579** | **28,917 (94.6 %)** | 1,662 | **5.5** |
| L9–12 `+drifter` | 25,211 | 17,905 | 7,306 | 6.8 |
| L13+ `+surger` | 21,778 | 12,861 | 8,917 | 7.0 |
| L23+ full seven | 21,074 | 9,521 | 11,553 | 6.0 |

⛔ **Blocked beats quadruple the moment a Weaver becomes eligible (7,027 →
30,579), and 94.6 % of them are beats the split releases.** Mean progression
halves. And on a level-5 eligible set at the shipped concurrency, **every seed
tested stalls**: across four seeds × two drivers × 18,000 ticks, the level never
leaves 1 and the longest stretch with no level and no quota movement is
**16,336–17,806 ticks** — 4.5 to 5 minutes of a well that cannot finish.

⛔ **This is why P1 lands before P3.** Shipping the schedule first would put a
five-minute stall into the middle of the changeset.

### 4.3 GDD §8.1's introduction schedule — what ships

⛔ **The schedule is DATA and it lives in `C`** (`CLAUDE.md`, Config: every
tunable, grouped by system). The levels are difficulty numbers.

⛔ **The eligible set is a function of level and nothing else.** **MEASURED** — the
seven spawner-eligible `ENEMY_KINDS` rows against GDD §8.1's table:

| Levels | Eligible set | size |
|---|---|---|
| 1–2 | `vaulter` | **1** |
| 3–4 | `+ carrierVaulter` | **2** |
| 5–8 | `+ weaver` | 3 |
| 9–12 | `+ drifter` | 4 |
| 13–17 | `+ surger` | 5 |
| 18–22 | `+ carrierDrifter` | 6 |
| 23+ | `+ carrierSurger` | 7 |

⛔ **`thorn` and `weaverBolt` are never eligible.** They enter through their
parents (`Weaver.layThorn`, `Weaver.fire`), which call `spawnEnemy()` directly.
⛔ Row **1** — *"Vaulters (non-vaulting)"* — and row **2** — *"Vaulting"* — are
already delivered by `C.VAULT_FIRST_LEVEL` 2, which ships. Row **8** — *"First
open well"* — is already delivered by the modulo mapping (§1.5). ⛔ **Neither is a
code change; both are rows the spec records as already true.**

⛔ **The no-draw rule survives verbatim, and the schedule makes it stronger.**

```
eligible.length < 2  ->  return eligible[0], spending NO draw
eligible.length >= 2 ->  exactly ONE draw
```

⛔ **Keep the function named `pickSpawnKind(state)`.** `_harness.js`'s `EXPORTS`
list names it; a renamed function returns `null` there and turns four closed
files' direct calls into a different failure than the one being made. Its *reader*
changes from `C.DEBUG_SPAWN_KINDS` to the schedule; its name, its signature and
its no-draw contract do not.

⛔ **H5 — `C.DEBUG_SPAWN_KINDS` is DELETED. The seven debug keys are NOT, and they
stop being ⚠ TEMPORARY.** The constant answers *"what does the well release"* — a
difficulty question the schedule now owns. The keys answer *"put one of these on
screen so I can look at it"* — a hardware-pass question the schedule does not
address. `PLAYTEST.md` is written around them, the six enemy colours are still ⚠
provisional and `0` is the only way to see them together. They ship until CS016
decides whether debug keys ship at all.

### 4.4 ⛔ The seven closed files P3 must repair, IN PLACE

`CLAUDE.md`, Test rules: *"When a later changeset REPLACES behaviour a closed
phase's test asserts, it rewrites those assertions IN PLACE to the replacement
behaviour. It does not delete them, does not weaken them"* — and a fixture
invalidated by the replacement is *"repaired to restore the precondition the
assertion was always about, never relaxed."*

⛔ **MEASURED — and the schedule's own levels supply, almost exactly, the sets
these files hand-built:**

| File | Its `MIXED` | The level whose eligible set matches | Line numbers |
|---|---|---|---|
| `test-cs004-p5.js` | `["vaulter","carrierVaulter","weaver"]` | ⛔ **level 5 — character for character** | 59; fixtures 133, 433, 604, 748; traps 13, 56 |
| `test-cs005-p5.js` | six kinds, no `carrierVaulter` | **level 23** — a superset by one Carrier variant, which its `sawCarrier` check already accepts | 90; fixtures 165, 540, 843; traps 8, 30, 87 |
| `test-cs006-p5.js` | same six | **level 23**, same | 71; fixtures 162, 387, 518, 570, 655; traps 22, 67; restores 373, 543–545, 643, 696–697 |
| `test-cs004-p1.js` | `["vaulter","carrier","weaver"]` — never spawned, `pickSpawnKind` only | **level 5** (three entries) | 220–221, 236–256 |
| `test-cs005-p2.js` | `["drifter"]` | ⚠ **no level has a one-entry Drifter set** — see below | 675–688 |
| `test-cs005-p3.js` | `["surger"]` | ⚠ same | 661–677 |
| `_harness.js` | — | its ⚠ TEMPORARY comment on the `pickSpawnKind` export | 150 |

⛔ **The fixture shape.** Where a file set `C.DEBUG_SPAWN_KINDS`, it now sets the
level and re-arms the well through the real path:

```js
X.startGame(SEED);
state.level = N;
state.wellIndex = (N - 1) % X.WELLS.length;
X.enterWell();
```

⚠ **Two files need something else, and P3 must decide which — this is engineering,
not design, and the options are named so the phase executes rather than invents.**
`test-cs005-p2.js` and `test-cs005-p3.js` each want a **single-kind** well
(Drifters only, Surgers only) to prove *"the interval spawner releases these when
a test asks it to."* No level of GDD §8.1 has a one-entry set containing either.
The two honest repairs:
1. Assert the claim on `pickSpawnKind` and `spawnEnemy` directly at the level
   where the kind first becomes eligible (9 and 13), rather than through a
   single-kind well; the claim is about the one entry point, and the entry point
   is what is being driven.
2. Drive `spawnEnemy("drifter", …)` on an interval by hand for the 1,800 ticks.
⛔ Neither weakens the assertion; option 1 is the closer match to what the
assertion says it is about.

⛔ **`test-cs006-p5.js`'s draws-per-spawn control is the important one**, because
it is what makes CS007's re-records honest at all. **MEASURED from the source:**
its one-entry run uses `["vaulter"]` and its control uses `["vaulter","vaulter"]`
— *"two entries of the SAME kind: nothing else about the board changes — no
Carrier to split, no Weaver to lay."* Under the schedule:

- one-entry case → **level 1**. Vaulters only; `out.extra === 0` stays true.
- two-entry control → **level 3**, the only band whose set is exactly two
  (`vaulter`, `carrierVaulter`). ⚠ **A Carrier splits on being shot and adds two
  entities in one tick** — the file already routes `added > 1` to `out.extra` and
  asserts `extra === 0` only on the one-entry run, so `min(perSpawn)` stays clean.
- ⛔ **The level must be pinned** or the run walks out of its band. Top up
  `state.spawn.remaining` every tick — the fixture shape `test-cs005-p5.js`'s
  open-well soak already uses.
- The decomposed section becomes `state.level = 1` → **0 draws** and
  `state.level = 3` → **exactly 1**, measured on `pickSpawnKind` directly.

⛔ **And the three soaks' `C.ENEMY_CONCURRENT = C.ENEMY_CAP` fixture comments are
FALSE after P1 and are corrected in place.** All three say it is *"a WORKAROUND
for a live defect that belongs to CS007, not a fix for it"*
(`test-cs006-p5.js:26–29`, `test-cs005-p5.js:48–52`, `test-cs004-p5.js:406–417`).
After P1 the defect is fixed and the raise is a plain difficulty fixture that
keeps the board busy. ⛔ **Keep the fixture; rewrite the reason.** Removing it
would change three soaks' boards for no assertion's benefit.

### 4.5 ⛔ What guards the re-records

`test-cs006-p5.js`'s counting form — **read at `1d64329`**, and it needs no
baseline:

```
every interval spawn spends  >= 2   (pickSpawnLane's first + spawnEnemy's heading)
                             <= 1 + C.SPAWN_LANE_TRIES   (bounded, settles for its last)
a tick that spawned nothing spends 0
a dive spends 0
```

⛔ **Under the schedule this becomes a function of the eligible-set size, and it
is checkable at every level**: `+0` at levels 1–2, `+1` from level 3. That is
strictly more than it could say before, and it is what lets P2's and P3's
re-records be *checked* rather than merely recorded.

---

## 5. WHAT EACH OPEN CALL NEEDS, WITH THE OPTIONS MEASURED

### 5.1 ✅ H3 — ANSWERED: Form A, `HEAT_FULL_LEVEL` 99, the "Mid" package

`DIFFICULTY-NOTES.md`'s curve matches `00-config.js` exactly and `heat(1) = 0`;
that half is right and is kept. Four rows need a clamp they do not have, and two
of its rows are one knob.

#### ✅ The mapping form — Form A, with `C.HEAT_FULL_LEVEL` 99

**Paul, 2026-08-31.** The clamp values are stated as level-99 endpoints, which is
Form A by construction.

**Form A — endpoint interpolation. ✅ CHOSEN.**
```js
v(level) = base + (clamp - base) * min(heat(level) / C.HEAT_FULL, 1)
```
One shared constant, `C.HEAT_FULL`. The base already ships and the clamp is the
number Paul is choosing anyway, so **the clamp values ARE the curve** and no row
needs a rate constant of its own. Every row saturates at the same level, which is
what makes §2.3's "no hold needed" true by construction.

⛔ **MEASURED — `C.HEAT_FULL` is "the level past which the game stops getting
harder", and GDD §8.2 constrains it.** §8.2 wants a strong player at 30–40, level
50 a genuine achievement and 99 a legend. `HEAT_FULL = heat(27)` = 1.507 would
make levels 27–99 identical. `heat(99)` = 2.960 keeps the curve live to the top;
at it, `climbMult(27)` = 1.204 and `climbMult(50)` = 1.268 for a
`CLIMB_MULT_MAX` of 1.40.

**Form B — per-row rate.** `max(base / (1 + k·heat), floor)`, one `k` per row.
More expressive; five more difficulty numbers; each row saturates at a different
level, so §2.3's argument has to be checked per row. ⛔ **Not chosen.**

#### ✅ THE SHIPPED CURVE — every derived value, at every level that matters

**MEASURED** from the answers, `HEAT_FULL_LEVEL` 99 → `heat(99)` = 2.96000,
`t(L) = min(heat(L)/2.96, 1)`, `v(L) = base + (clamp - base)·t(L)`:

| L | t | spawn iv | concur | climbMult | vault iv | rim iv | surge iv | apex | Vaulter throat→rim |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 0.000 | 1.600 | 3 | 1.0000 | 2.200 | 0.550 | 2.600 | 0.550 | 5.56 s |
| 5 | 0.191 | 1.428 | 3 | 1.0766 | 1.970 | 0.512 | 2.370 | 0.588 | 5.16 s |
| 9 | 0.303 | 1.327 | 4 | 1.1211 | 1.837 | 0.489 | 2.237 | 0.611 | 4.96 s |
| 13 | 0.373 | 1.264 | 4 | 1.1493 | 1.752 | 0.475 | 2.152 | 0.625 | 4.83 s |
| 23 | 0.478 | 1.170 | 5 | 1.1911 | 1.627 | 0.454 | 2.027 | 0.646 | 4.66 s |
| 27 | 0.509 | 1.142 | 5 | 1.2036 | 1.589 | 0.448 | 1.989 | 0.652 | 4.62 s |
| 40 | 0.601 | 1.059 | 6 | 1.2403 | 1.479 | 0.430 | 1.879 | 0.670 | 4.48 s |
| 50 | 0.669 | 0.998 | 6 | 1.2675 | 1.397 | 0.416 | 1.797 | 0.684 | 4.38 s |
| 70 | 0.804 | 0.876 | 7 | 1.3216 | 1.235 | 0.389 | 1.635 | 0.711 | 4.20 s |
| 99+ | 1.000 | **0.700** | **8** | **1.4000** | **1.000** | **0.350** | **1.400** | **0.750** | **3.97 s** |

⛔ **The concurrency ladder, measured** — `enemyConcurrent()` floors a continuous
value, so it steps, and a player can name each step:

```
3 at levels 1-5   ·   4 from 6   ·   5 from 16   ·   6 from 40   ·   7 from 70   ·   8 at 99
```

⚠ **Concurrency is still 3 at level 5, which is exactly where the Weaver arrives**
— so P1's threats split is doing its work at the tightest budget the run ever has.
⛔ `C.ENEMY_CAP` 16 is never approached and is not touched.

**MEASURED — three consequences worth knowing before a build phase meets them:**

1. ⛔ **The Surger gets FASTER to the rim, not slower.** §5.1's warning was that a
   falling `SURGE_INTERVAL` lengthens the approach because the climb pauses during
   telegraph and discharge. At the chosen pair — floor 1.40 with climb ×1.40 — the
   climb more than compensates: throat→rim goes **8.59 s → 7.63 s (L27) → 7.31 s
   (L99)** while lethal duty rises 9.0 % → 14.0 %. The break-even multiplier at a
   1.40 floor is ×1.164 and the shipped ceiling is 1.40.
2. ⛔ **The rim hunt interval never goes inert.** It ends at 0.350, above the
   `VAULT_HOP_TIME` 0.28 saturation line, so the knob is live at every level. At
   L99 a rim Vaulter is hopping ~79 % of ticks and still visibly pauses.
3. ⛔ **The Weaver's bolt keeps a real warning.** At the 0.75 apex ceiling the
   flight is **0.781 s**, still 1.7× `SURGE_TELEGRAPH`'s 0.45 s — the build's own
   "fair difficulty is a visible fuse" benchmark. The Thorn costs 10 shots, leaves
   0.25 of the lane, and a dive is struck at 0.91 s of 2.6.

#### The five values

| Row | Constant to land | ⛔ MEASURED consequence of the choice |
|---|---|---|
| **Spawn interval** | ✅ `C.SPAWN_INTERVAL_MIN` **0.70** (⚠ **not** `SPAWN_MIN`, which never existed) | ⚠ **Almost inert on its own.** At `ENEMY_CONCURRENT` 3, dropping the interval 1.60 → 0.35 moved spawns in 60 s from **19 to 20** and blocked ticks from 1,016 to 2,088. Choose it **with** the concurrency curve, not against it. |
| **Concurrent** | ✅ `C.ENEMY_CONCURRENT_MAX` **8**, under ⛔ `ENEMY_CAP` 16 | ⛔ **This is the knob that actually changes a well.** At interval 1.60, concurrency 3 → 8 took blocked ticks 1,016 → 21 and cleared two levels instead of one. Mean live enemies never exceeded **3.85** even at concurrency 16 with a firing player, so `ENEMY_CAP` 16 is nowhere near binding. |
| **Climb** | ✅ `C.CLIMB_MULT_MAX` **1.40** | ⛔ **H1** — §3.4. |
| **Vault intervals** | ✅ `C.VAULT_INTERVAL_MIN` **1.00**, `C.VAULT_RIM_INTERVAL_MIN` **0.35** | ⛔ **H3's stated reason is wrong, and the real one is better** — see below. |
| **Surge frequency** | ✅ `C.SURGE_INTERVAL_MIN` **1.40** | ⛔ **A falling interval makes the Surger SLOWER** — see below. |
| **Weaver apex = thorn length** | ✅ `C.WEAVER_APEX_MAX` **0.75** | ⛔ **One number sets four things** — see below. |

#### ⛔ MEASURED — a `VAULT_RIM_INTERVAL` floor below `VAULT_HOP_TIME` does not overlap hops. It saturates.

H3 says the floor exists *"or hops overlap."* `Vaulter.update()` gates on
`if (this.hopping) { this.advanceHop(dt, well); return; }`, so a second hop cannot
start inside a first. Driven directly (a rim Vaulter, a target kept four lanes
ahead so it never arrives, 600 ticks):

| `VAULT_RIM_INTERVAL` | hops / 10 s | % of ticks hopping | max lane step |
|---|---|---|---|
| 0.55 (shipped) | 18 | 49 % | 0.05952 |
| 0.35 | 28 | 79 % | 0.05952 |
| **0.28** (= `VAULT_HOP_TIME`) | 33 | 92 % | 0.05952 |
| 0.20 | 33 | 93 % | 0.05952 |
| 0.10 | 33 | 94 % | 0.05952 |
| 0.02 | 34 | 94 % | 0.05952 |

⛔ **The rate saturates at `1 / VAULT_HOP_TIME` = 3.57 hops/s, so any floor below
0.28 is inert — the knob does nothing.** The real consequence of approaching 0.28
is a rim Vaulter that **never pauses**, which is a §1.1 P2 legibility question,
not a correctness one. ⛔ **And the per-tick lane step is 0.05952 = `DT /
VAULT_HOP_TIME` at every value — exactly half the three closed soaks' bound of
`2·DT/VAULT_HOP_TIME`.** The interesting range for this number is **[0.28,
0.55]**.

⚠ Related, and already flagged in `STATUS.md`: a rim Vaulter hunts the Skimmer's
*continuous* lane, so a player parked between two centres has it hopping back and
forth. A shorter interval makes that jitter faster. ⛔ **That is the same knob and
it is a playtest ask, not a spec change.**

#### ⛔ MEASURED — flooring `SURGE_INTERVAL` makes the Surger take LONGER to reach the rim

`SURGE_CLIMB` advances in the **climb phase only** (`00-config.js` carries a ⛔ on
it), so the honest throat→rim time is `(1/climb) · cycle/interval`:

| `SURGE_INTERVAL` | cycle | lethal duty | throat→rim @ 0.15 | …with climb ×1.40 |
|---|---|---|---|---|
| 2.60 (shipped) | 3.35 | 9.0 % | **8.59 s** | 6.14 s |
| 2.00 | 2.75 | 10.9 % | 9.17 s | 6.55 s |
| 1.50 | 2.25 | 13.3 % | 10.00 s | 7.14 s |
| 1.00 | 1.75 | 17.1 % | 11.67 s | 8.33 s |
| 0.50 | 1.25 | 24.0 % | 16.67 s | 11.90 s |

⛔ **The floor buys lane-denial and costs approach speed.** Break-even climb
multipliers, to hold the 8.60 s rim time: floor 2.00 needs ×1.067, 1.50 needs
×1.164, 1.00 needs ×1.358, 0.50 needs ×1.940. ⛔ A floor near 1.00 with a
`CLIMB_MULT_MAX` of 1.40 leaves the Surger *roughly where it started* on approach
and nearly doubles its lethal duty — which may be exactly the intent, and is the
kind of trade only Paul can price.

#### ⛔ MEASURED — the Weaver's apex is ONE number that sets FOUR things

`Weaver.layThorn()` writes the Thorn's tip to the Weaver's own depth, clamped at
`THORN_MAX` — so **thorn length IS apex**, and H3's two rows are one knob.
`WEAVER_APEX` already carries a ⚠ note promising exactly this.

| apex | bolt flight apex→rim | shots to clear the Thorn | lane left to the player | dive struck after |
|---|---|---|---|---|
| **0.55** (shipped) | **1.406 s** | 7 | 0.45 | 1.36 s of 2.60 |
| 0.65 | 1.094 s | 9 | 0.35 | 1.14 s |
| 0.75 | 0.781 s | 10 | 0.25 | 0.91 s |
| 0.85 | 0.469 s | 11 | 0.15 | 0.69 s |
| 0.95 | **0.156 s** | 12 | 0.05 | 0.46 s |
| 1.00 | **0.000 s** | 13 | 0.00 | ⛔ 0.35 s — at the grace boundary |

⛔ **The ceiling must be strictly below 1.00.** At 1.00 the tip sits at the rim,
the lane is sealed against the player's own shots, and the bolt is born in contact
— GDD §6.1 says a Weaver climbs *partway*, and `00-config.js` already flags
`THORN_MAX` 1.00 as the knob if lane denial reads as unfair.
⚠ For scale: `SURGE_TELEGRAPH`, the build's stated *"fair difficulty is a visible
fuse"*, is **0.45 s**. An apex of 0.85 gives a bolt a shorter warning than that.

⚠ **The Weaver already handles a moving apex.** `07-enemies.js`: *"a Weaver that
ARRIVED above the apex turns around from where it is instead of teleporting down
to the line… CS007's heat curve will move the apex under live entities."*
MEASURED by reading the guard: `if (this.depth < C.WEAVER_APEX)`, not an
unconditional clamp. ⛔ **No change is needed there; do not "tidy" it.**

#### And the document itself

✅ **`DIFFICULTY-NOTES.md` is CORRECTED IN PLACE.** Recommended and taken —
H3's own finding is that the document *"survives in shape and fails in detail"*,
its curve matches `00-config.js` exactly and `heat(1) = 0`. Four rows gain the
clamp they lack, the two rows that are one knob say so, and ⛔ `SPAWN_MIN` — a
constant that never existed — is corrected to `SPAWN_INTERVAL_MIN`. ⚠ It is the
one document in the repo never exercised; the closing phase is what exercises it.

### 5.2 ⛔ H1 — see §3

### 5.3 ✅ C3 — ANSWERED: emergent from the schedule, no weight table

GDD §8 and `DIFFICULTY-NOTES.md` both carry a row: *"Carrier cargo weights shift
toward Drifter/Surger."* GDD §6.2 says explicitly: ⚠ *"Still **not a weighted
draw** — §8's 'cargo weights shift toward Drifter/Surger' is heat, and heat is
CS007's."* So it is CS007's and it has no number.

**Option A — emergent, no code.** The three Carrier variants are three separate
`ENEMY_KINDS` rows and three separate schedule entries, so the mix shifts by
arithmetic alone. **MEASURED** from the eligible sets in §4.3:

| Levels | Carrier share of the eligible set | cargo split within Carriers |
|---|---|---|
| 3–17 | 1/2 → 1/5 | 100 % Vaulter |
| 18–22 | 2/6 | 50 / 50 Vaulter / Drifter |
| 23+ | 3/7 | 33 / 33 / 33 |

⛔ That is GDD §8's row delivered literally, at zero cost, and it keeps the
one-draw rule trivially true.

**Option B — an explicit weight table in `C` that heat interpolates.** Still
exactly one draw, but five to seven more difficulty numbers and a second thing
that decides the mix. ⛔ **Not chosen.**

✅ **Paul, 2026-08-31: Option A.** The schedule delivers GDD §8's row literally,
at zero cost, and the kind pick stays a uniform `rngPick` over the eligible set —
⛔ which is what keeps "one draw when there is a choice, none when there is not"
true without a second mechanism. ⛔ **The schedule's definition and GDD §6.2 must
both SAY there is no weight table**, so a future session does not read the missing
one as an oversight.

---

## 6. TELEMETRY — THE TUNING INSTRUMENT

⛔ **`TELEMETRY_FIELDS` is the one source of truth for both row shape and CSV
column order** (GDD §15.6). Adding or reordering a column edits `TELEMETRY_FIELDS`
and the matching line in `push()` **together**. GDD §17 item 11 asserts they agree
in length and order.

⛔ **Capture is a session switch: opt-in, OFF at every launch, never persisted.**
A launch must be unable to revive a stale "was ON last session" state.

⛔ **Three column kinds, and the names do not tell you which** — **instantaneous**,
**cumulative**, **sawtooth**. ⛔ Sawtooth columns are excluded **by name** from any
monotonicity check, and each column's kind is documented at its definition.

⛔ **Nothing is posted anywhere.** Strictly local CSV export (`ROADMAP.md` §21 #5,
⚠ SETTLED 2026-08-30). It is a tuning instrument and explicitly **not** an
anti-cheat mechanism.

### 6.1 ⛔ MEASURED — the buffer is IN MEMORY this changeset, and CS011 lands persistence

`CLAUDE.md`'s save-data table declares a `telemetry` key, *per-profile, lazy*, and
⛔ *"`Profiles.keyFor(base)` is the one route from a store's base name to the key
it reads."* **MEASURED at `1d64329`:** `src/22-meta.js` is a **one-line
placeholder**, and `grep -rn "KitStorage\|KitProfile\|Profiles\.\|window.Kit"
src/` returns exactly one hit — `src/shell.html:38`, the leaderboard module
bridge. **There is no keyspace, no `Profiles`, and no route to `keyFor` in the
build.**

⛔ **So CS007's telemetry is a ring buffer on `state`, exported on demand, and
never written to storage.** Writing it any other way would mean the game choosing
a raw `localStorage` key name, which `CLAUDE.md` forbids outright. CS011 owns
persistence, the profile scope and `read()`'s envelope-version rejection, and it
is one wiring step because the row shape and the export already exist.

### 6.2 The surface, this changeset

There is no HUD and no Options screen until CS008, so ⛔ **the surface is the debug
bench** — which H5 just made permanent, and which `PLAYTEST.md` is already written
around. Two actions: toggle capture, export.

⛔ **The export writes the CSV to `console.log`.** It is the only path that works
on `file://`, which the built game must open from by double-click. A
`navigator.clipboard.writeText` attempt may sit beside it **inside a try/catch** —
`file://` is not a secure context, so absence is the normal path, exactly as
`EXTERNAL-FILES.md`'s rule 1 requires of every optional capability. ⛔ **Never an
`<a download>`, never a `fetch`.**

### 6.3 The columns

⚠ **PREDICTED — the column list below is a proposal, not a measurement.** The
instrument's job is GDD §8.2's tuning targets (first-time 4–6, competent 15–20,
strong 30–40) and CS007's own curve, and its columns should be a superset of the
seven `statsFields` the Worker already registers (§1.6) so the two agree.

| Column | Kind | Why the heat pass needs it |
|---|---|---|
| `t` | instantaneous | simulation seconds; the row clock |
| `level` | instantaneous | ⛔ the one clock |
| `heat` | instantaneous | the curve, sampled, so a log can be replotted against a retune |
| `spawnInterval`, `enemyConcurrent`, `climbMult`, `weaverApex`, `surgeInterval` | instantaneous | ⛔ **each derived value, sampled** — this is what makes the log a tuning instrument rather than a score log |
| `enemiesAlive`, `threatsAlive`, `thornsStanding` | instantaneous | the H4 split, visible in the field |
| `spawnBlockedTicks` | cumulative | ⛔ the stall's own signature — §4.2's metric, in a played run |
| `livesLeft` | instantaneous | GDD §8.2's targets are about where a player dies |
| `deaths`, `wellsCleared`, `purgesSpent`, `divesSurvived`, `thornDeaths` | cumulative | the four registered stats keys plus the Dive's own |
| `shotsFired`, `kills` per kind | cumulative | which enemy is actually killing the run |
| `score` | cumulative | ⚠ **zero until CS008** — `addScore()` does not exist |
| `mode`, `startDepth`, `seed` | instantaneous | ⚠ `mode` is `"classic"` and `startDepth` is 1 until CS008/§4.6; carried so the column order never has to change |

⛔ **`score` and `startDepth` ship as columns with known-constant values rather
than being added later.** GDD §15.6's rule is that adding or reordering a column
edits two things together; a column added in CS008 invalidates every CS007 log.

### 6.4 ⛔ Telemetry moves no baseline

⛔ **It spends no RNG, reads no `state.rng`, and is sampled from `update()` on the
simulation clock — never from `draw()`** (`CLAUDE.md`, Math and lifecycle;
`RATIONALE.md#draw-path-rng`). A sample taken on the frame clock would make a
capture-on run diverge from a capture-off one, which is GDD §17.1's replay
guarantee failing in the one system built to observe it. ⛔ **P4 asserts that the
determinism hash is identical with capture ON and OFF.**

---

## 7. ⛔ ACCEPTANCE CRITERIA

P5 answers each of these with a verdict, one by one, in `log/CS007.md`. Not "all
green" — the list.

**The clock**
1. `heat(1) === 0` exactly.
2. GDD §17 item 7: `heat(n+1) > heat(n)` for n in 1..200, **and** every derived
   value of §2.2 inside its clamp across the same range.
3. Every derived value is reached through its own accessor; ⛔ no call site
   computes heat inline, and no entity reads a heat-derived `C.<BASE>` directly.
4. `C.HEAT_BASE`, `HEAT_RISE`, `HEAT_KNEE`, `HEAT_LINEAR` are unchanged.

**The guarantee**
5. The §3.4 property holds over levels 1..200 on the shipped constants, and is
   ⛔ **driven through the real `respawnSkimmer()`** at a high level as well as
   evaluated as arithmetic.
5a. ⛔ `RESPAWN_PUSH_DEPTH` is **0.55, unchanged**, and no `respawnPush()`,
   `RESPAWN_PUSH_MARGIN` or derived-push code exists anywhere in the build.
6. `SURGE_DISCHARGE < RESPAWN_INVULN` — ⛔ `test-cs005-p3.js` green **and
   unedited**.
7. ⛔ `VAULT_HOP_TIME`, `DRIFT_CROSS_TIME` and `DRIFT_RIDE_TIME` are unchanged and
   unscaled, and the three soaks' derived lane bounds are green and unedited.

**The spawner**
8. §4.2's repro terminates: three standing Thorns, quota full, no input — the
   quota spends and the well clears.
9. `spawnEnemy()`'s `C.ENEMY_CAP` check still reads raw `state.enemies.length`;
   `wellCleared()` is unchanged; `C.ENEMY_CAP` is 16; no Thorn expires.
10. `C.DEBUG_SPAWN_KINDS` and its reader do not appear anywhere in the built file.
11. The seven debug spawn keys work and are no longer marked ⚠ TEMPORARY.
12. ⛔ A one-entry eligible set spends **zero** draws; a two-entry one spends
    exactly one — measured on `pickSpawnKind` at levels 1 and 3.

**The baselines**
13. `GOLDEN_LANES` re-recorded **once**, in P2, cause named at the assertion and
    in `log/CS007.md`, and ⛔ **its first ten entries are character-identical to
    the recording at `9ebd27b`.**
14. `P1_DETERMINISM_HASH` re-recorded once per moving phase, each with **one**
    named cause, and `test-cs006-p2.js`'s three geometry goldens and its §8 source
    assertion are ⛔ **untouched and green**.
15. No other baseline anywhere in the suite moved.

**Telemetry**
16. GDD §17 item 11: `TELEMETRY_FIELDS` and `push()` agree in length and order.
17. Capture is OFF at every launch and is not persisted.
18. ⛔ The 10,000-tick determinism hash is identical with capture ON and OFF.

**The changeset**
19. `node build.js` green; `node scratchpad/run-all.js` green, **zero skips, zero
    failures**.
20. A fifth soak file, `test-cs007-p6.js`, owning CS007's board — ⛔ not an edit to
    the other four.
21. `DIFFICULTY-NOTES.md` agrees with what shipped, row for row, clamp for clamp.

---

## 8. ⛔ WHAT CS007 DOES NOT DO

- ⛔ **No scoring.** `addScore()` is CS008's, and it is the one entry point. The
  `PTS_*` constants stay unread; the Drifter's and Surger's points constants are
  still absent and CS008 lands them.
- ⛔ **No HUD, no screens, no Start Depth.** GDD §4.6's Start Depth is CS008's, and
  with it the ⚠ carried defect that a run *starting* past level 99 gets the modulo
  well and a `bandRoll` of 0.
- ⛔ **No Dive visual.** `STATUS.md` calls it the largest gap in the build between
  what is simulated and what is seen; no changeset owns it and CS007 is not it.
- ⛔ **No enemy is added, no `ENEMY_KINDS` row is added.** `test-registry.js`'s
  `enemies: 6` and `enemyKinds: 9` are unchanged, and P5 confirms it.
- ⛔ **No spawn-lane weighting toward the player's lane.** GDD §12's four-second
  promise is onboarding and is CS015's (`ROADMAP.md` assumption #6). ⚠ If P3 finds
  it falls out of the schedule for free, **note it, do not take it.**
- ⛔ **`src/07-enemies.js` is not split.** That is CS012's, measured and recorded
  in `ROADMAP.md`.
- ⛔ **No telemetry persistence** — §6.1.

---

## 9. RISKS

| Risk | Mitigation |
|---|---|
| ⛔ **Three re-records of one constant is three chances to launder a stray draw** | §4.5's count guard needs no baseline and is checked at every level; §1.1's level-1 prefix invariant; `test-cs006-p2.js`'s three geometry goldens must not move |
| P3 is the biggest phase — seven closed files plus `_harness.js` | The edit inventory is measured (§4.4) and the replacement fixture is specified, so the phase executes rather than invents. P3 is **high** effort |
| A curve Paul picks may push the golden's window into level 3 | ⚠ **MEASURED**: every curve tried ended the window at level 2. ⛔ **MEASURED on the shipped curve: it ends at level 2** (spawn interval 1.600 at L1, 1.428 at L2). P3 re-runs it and confirms; if it ever reaches 3, that is a second `GOLDEN_LANES` re-record with its own cause |
| The soaks get much harder at level 5 / level 23 and start failing on time | ⚠ **MEASURED**: under heat, only *non-vacuity* assertions moved (§1.4). P3 must re-check the run caps (`RUN_CAP` 30,000 ticks) after the fixture change |
| ~~H1's derived push engages inside a soak's level range~~ | ✅ **Gone.** H1's answer keeps `RESPAWN_PUSH_DEPTH` at 0.55, so a respawn is unchanged at every level and the guarantee moves no baseline |
| Telemetry sampling perturbs the simulation | ⛔ Acceptance criterion 18: hash identical with capture ON and OFF |
| ⛔ **A build phase reads §3.2's derived-push sketch and builds it** | §3.4 marks it ⛔ not chosen and says why it would be dead code. The sketch is kept because it is what 1.40 was chosen against |

---

## 10. ASSUMPTIONS

| # | Assumption | What would change it |
|---|---|---|
| 1 | **Five phases**, seamed as `IMPLEMENTATION-PHASES-CS007.md` argues. ⚠ **Six until H1 was answered** — the answer removed the only production code the old P3 was to write | A phase that overruns a session means the seam was wrong; P4 (telemetry) is the one with slack |
| 2 | ⛔ **P1 lands before P3 (the schedule)** | Nothing. §4.2 measured a five-minute stall on every seed the moment Weavers are eligible |
| 3 | ⛔ **P1 needs none of the three open calls** and can be built today | Nothing — it builds a decision already in `DECISIONS.md` |
| 4 | ✅ The heat→value mapping is Form A, `HEAT_FULL_LEVEL` 99 — **answered, not assumed** | Playtest evidence that the curve saturates too late or too early; the accessors do not change, only `HEAT_FULL_LEVEL` |
| 5 | Telemetry lands after heat, not before | `ROADMAP.md` assumption #3: the columns want the derived values to exist, and `TELEMETRY_FIELDS` and `push()` must be edited together |
| 6 | The soaks' `ENEMY_CONCURRENT = ENEMY_CAP` fixture is **kept**, its comment corrected | Evidence that the busy board is now redundant — which is a playtest answer, not an argument |
