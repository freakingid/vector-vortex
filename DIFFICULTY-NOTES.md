# DIFFICULTY-NOTES — Vector Vortex

⛔ **One clock: `game.level`.** Every difficulty-scaled value derives from it
through `heat(level)`. No parallel clocks, no per-system counters.

```js
heat(level) = C.HEAT_BASE
            + C.HEAT_RISE * (1 - exp(-(level-1) / C.HEAT_KNEE))
            + C.HEAT_LINEAR * (level-1)
```

Fast early rise so levels 1–5 teach quickly, then near-linear, so late levels
are relentless without becoming arbitrary.

**Shipped, CS007 P2** — `heat()` and its seven accessors live beside `C` in
`src/00-config.js`. ⛔ **`heat(1)` is EXACTLY 0**, which is load-bearing: every
derived value below is its own level-1 base at level 1.

⛔ **The mapping is Form A, endpoint interpolation**, and it is the same one
line for every row:

```js
v(level) = base + (clamp - base) * min(heat(level) / heat(C.HEAT_FULL_LEVEL), 1)
```

`C.HEAT_FULL_LEVEL` is **99** — GDD §8.2's "99 is a legend" — so **the clamp
values ARE the curve**: no row carries a rate constant of its own and every row
saturates at the same level. ⛔ **There is no `C.HEAT_HOLD_LEVEL`**: every row is
clamped, so heat past a row's saturation changes nothing and a hold would be
inert. `heat()` itself never plateaus, which keeps GDD §17 item 7's
`heat(n+1) > heat(n)` literally true over 1..200.

## What heat drives

⛔ **One accessor per row, and nothing reads a heat-derived base constant
directly.** `test-cs007-p2.js` asserts that off the built file, so a direct read
turns the suite red. GDD §8 carries the same table; this one adds the constant
that holds each clamp.

| Derived value | Accessor | Base at level 1 | Clamp at 99, and the constant that holds it |
|---|---|---|---|
| Spawn interval | `spawnInterval()` | `C.SPAWN_INTERVAL` 1.60 | falls to **0.70**, held by `C.SPAWN_INTERVAL_MIN` |
| Concurrent enemies | `enemyConcurrent()` | `C.ENEMY_CONCURRENT` 3 | rises to **8**, held by `C.ENEMY_CONCURRENT_MAX` — and read as `min(…, C.ENEMY_CAP)` by `spawnLimit()` |
| Enemy climb speed | `climbMult()` | ×1 (the identity) | rises to **×1.40**, held by `C.CLIMB_MULT_MAX`. ⛔ **SEVEN call sites since CS013 P4** — one per entity climb, the Warden's and the Mimic's included |
| Vault interval | `vaultInterval()` | `C.VAULT_INTERVAL` 2.20 | falls to **1.00**, held by `C.VAULT_INTERVAL_MIN` |
| Rim hunt interval | `vaultRimInterval()` | `C.VAULT_RIM_INTERVAL` 0.55 | falls to **0.35**, held by `C.VAULT_RIM_INTERVAL_MIN` |
| Surge frequency (the interval falls) | `surgeInterval()` | `C.SURGE_INTERVAL` 2.60 | falls to **1.40**, held by `C.SURGE_INTERVAL_MIN` |
| Weaver apex **= Weaver thorn length** | `weaverApex()` | `C.WEAVER_APEX` 0.55 | rises to **0.75**, held by `C.WEAVER_APEX_MAX` |
| Carrier cargo weights | — | — | ⛔ **none — emergent from the schedule below** |

⚠ **TWO ROWS OF THAT LIST ARE NOT SEPARATE KNOBS, AND BOTH LOOK LIKE THEY ARE.**

- **Weaver thorn length IS the apex — one number, not two.** `Weaver.layThorn()`
  writes the Thorn's tip to the Weaver's own depth, so a deeper apex is a longer
  Thorn by construction. `weaverApex()` is the only knob; there is no thorn-length
  constant and there is no "lane length" clamp, which is what this table used to
  print.
- **Carrier cargo weights have NO mechanism and NO constants.** ⚠ **SETTLED —
  Paul, 2026-08-31: the kind pick is UNIFORM and there is no weight table.** The
  three Carrier variants are three `ENEMY_KINDS` rows and three schedule rows, so
  the mix shifts by arithmetic alone: 100 % Vaulter cargo at L3–17, 50/50 at
  L18–22, 33/33/33 from L23. ⛔ The missing table is a decision, not a gap.

⛔ **THE CONCURRENCY LADDER IS MEANT TO BE NAMEABLE** (GDD §1.1 P3), which is
why `enemyConcurrent()` floors. The step levels, on the shipped constants:

| Concurrent enemies | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|
| From level | 1 | 6 | 16 | 40 | 70 | 99 |

⚠ Still 3 at level 5, which is where the Weaver arrives.

⛔ **WHAT HEAT DOES NOT SCALE, and it is a list rather than an oversight.**
`C.VAULT_HOP_TIME`, `C.DRIFT_CROSS_TIME`, `C.DRIFT_RIDE_TIME` — heat never scales
a hop or a crossing duration; `C.WEAVER_BOLT_SPEED` and `C.WEAVER_RETREAT` — a
bolt is ordnance and a retreat is a departure; `C.SURGE_DISCHARGE` — the list
above says surge *frequency*; `C.ENEMY_CAP` — a readability ceiling;
`C.RESPAWN_PUSH_DEPTH` — held at 0.55 by the cap on the climb instead.
⚠ A **slower** bolt would breach GDD §4.4's respawn guarantee, which is why
`C.CLIMB_MULT_MAX` 1.40 and not more: 1.4815 is the breach, and the shipped
margin is +0.087 s.

⛔ **`C.ENEMY_CAP` is a READABILITY constraint, not a difficulty constraint.**
Difficulty past the cap comes from faster and meaner, never from more. Raising
the cap to make the game harder is the fastest route to a game that feels cheap.

## Introduction schedule

Continuous heat, gated introductions — the player should be able to *name* what
changed. GDD §8.1 is the design statement; this is what the build does with it.

⛔ **Shipped, CS007 P3 — the schedule is DATA in `C`.** `C.SPAWN_SCHEDULE` is
seven `{ level, kind }` rows, cumulative and sorted; `eligibleKinds(level, mode)`
(`08-spawner.js`) returns the rows at or below the level and `pickSpawnKind()`
picks **uniformly** from that. ⛔ **It is a function of the level and the run's
MODE, and nothing else** — no board state, no heat, no draw. The set only ever
grows, so a kind the player has learned never stops arriving.

⛔ **Shipped, CS012 P2 — Overdrive's rows are a SECOND table** (`C.SPAWN_SCHEDULE_OVERDRIVE`,
GDD §8.1, Paul's O2), never a `mode` field on the rows above. `eligibleKinds()`
merges the two in level order, a Classic row first at an equal level, and `mode`
defaults to `"classic"`. ⚠ **This file's tables below are a CLASSIC run's**, and
⛔ **CS013 P3 and P4 moved nothing in them.**

⛔ **Shipped, CS013 P3 — the Warden's row at 11 and CS013 P4 — the Mimic's at
16**, the second and third in that table, which is now COMPLETE at three rows.
The Overdrive set and the share the uniform pick gives each Overdrive enemy:

| Levels | Overdrive set size | Reaver's share | Warden's share | Mimic's share |
|---|---|---|---|---|
| 1–5 | as Classic | — | — | — |
| 6–8 | 4 | 1/4 | — | — |
| 9–10 | 5 | 1/5 | — | — |
| **11–12** | **6** | 1/6 | **1/6** | — |
| 13–15 | 7 | 1/7 | 1/7 | — |
| **16–17** | **8** | 1/8 | 1/8 | **1/8** |
| 18–22 | 9 | 1/9 | 1/9 | 1/9 |
| 23+ | 10 | 1/10 | 1/10 | 1/10 |

⚠ **A Warden is the one release that does not come back as pressure the player
can spend a shot on.** It is `blocksClear: true` and killable only by the Jump,
so it HOLDS a release slot against the concurrency ladder until the player
jumps at it — MEASURED, `test-cs013-p3.js`: a non-jumping driver at L13 sees 1–3
released per 5,000 steps and clears no well. That is W5's intent (the Warden
counts inside the ladder rather than adding pressure outside it), and the tuning
question it raises — whether the ladder should make room for one — belongs to
§8.2's pass, not here.

⚠ **A MIMIC COSTS TWO SHOTS AND A HALF-SECOND, AND THAT IS WHAT IT COSTS THE
BOARD.** MEASURED (`test-cs013-p1.js`, two played Overdrive boards at Start
Depths 16 and 23, 8,000 steps): **302 kills over 20,000 steps with its row
mutated out against 285 with it in** — it absorbs one shot per opening, it is
`blocksClear: true`, and each reflection is one more thing the player must LEAVE
rather than shoot. The difference is not a bug and no constant was retuned for
it: P1's own played-board fixture was lengthened to 25,000 steps instead, which
is a fixture repair rather than a lowered claim. ⚠ **It is also the one entity
whose contribution to the curve is provisional in a second sense** — it is on
probation (GDD §14.6, §21 #6), so ⛔ **cutting its one schedule row returns this
table to CS013 P3's, exactly**, and nothing else here moves.

⚠ **`MIMIC_CLIMB` is `climbMult()`'s SEVENTH call site and the ONLY thing heat
touches on it** (R6, R7). `MIMIC_APEX`, `MIMIC_OPEN_TIME` and `MIMIC_SHOT_RATIO`
are all FLAT at every level — and the apex is not a free tuning knob either: it
is bounded by `(1 − RIM_CONTACT_DEPTH) − SURGE_TELEGRAPH × (MIMIC_SHOT_RATIO /
SHOT_TIME)` = **0.4308**, so 0.40 has **0.031 of headroom** and a retune that
pushed the Mimic closer to the rim would turn the suite red (GDD §6.4).

| Level | Introduced | How the build delivers it |
|---|---|---|
| 1 | Vaulters (non-vaulting) | `C.SPAWN_SCHEDULE` row — `vaulter` |
| 2 | Vaulting | `C.VAULT_FIRST_LEVEL` 2 — ⚠ not a schedule row; shipped since CS003 |
| 3 | Carriers | row — `carrierVaulter` |
| 5 | Weavers, Thorns | row — `weaver`. ⛔ `thorn` is **not** a row: a Thorn is laid by its parent |
| 8 | First open well | `nextWell()`'s modulo mapping — level 8 → `WELLS[7]`, the Vee, `closed: false`. ⚠ not a schedule row |
| 9 | Drifters | row — `drifter` |
| 13 | Surgers | row — `surger` |
| 18 | Drifter Carriers | row — `carrierDrifter` |
| 23 | Surger Carriers | row — `carrierSurger` |
| 27 | Full mix; heat alone | nothing — the last row landed at 23, so from 23 on the only thing still moving is heat |

⛔ **`thorn` and `weaverBolt` are NEVER rows.** They enter through
`Weaver.layThorn()` and `Weaver.fire()`; a row for either would put a parentless
entity in the throat.

⛔ **A ONE-ENTRY ELIGIBLE SET SPENDS NO DRAW; TWO OR MORE SPEND EXACTLY ONE**,
and ⛔ **the rule is the same in both modes** — Overdrive's set is one entry at
levels 1–2 as well, because its first row is at level 6 (CS012 P2).
`rngPick()` on a single-element array still advances the run's one stream, and
that stream is shared with every spawn lane — so a draw spent at levels 1–2 would
move `test-cs004-p1.js`'s `GOLDEN_LANES`, whose whole 3,000-tick window lives
there. It is measured, not assumed.

| Levels | Eligible set size | Draws the kind pick spends |
|---|---|---|
| 1–2 | 1 | **0** |
| 3–4 | 2 | 1 |
| 5–8 | 3 | 1 |
| 9–12 | 4 | 1 |
| 13–17 | 5 | 1 |
| 18–22 | 6 | 1 |
| 23+ | 7 | 1 |

## Tuning targets

Measure against these with the harness, not by feel. GDD §8.2 carries the same
numbers.

| Player | Expected peak level |
|---|---|
| First-time | 4–6 |
| Competent, after an hour | 15–20 |
| Strong | 30–40 |
| Level 50 | A genuine achievement |
| Level 99 | A legend |

⚠ **Nothing has been tuned against these yet — they are the targets, not a
finding.** ⛔ **The instrument is `src/21-telemetry.js`** (CS007 P4, GDD §15.6):
twenty-nine columns including `heat` and all seven derived values, sampled every
`C.TELEMETRY_INTERVAL` of simulation time, `t` to toggle capture and `e` to
export the CSV. A retune can be replotted against a recorded run because the
whole curve is in the log, which is the only reason those eight columns are
there. ⛔ **Capture is a session switch, OFF at every launch, never persisted.**

⛔ **A RETUNE MOVES A BASELINE, AND THAT IS NORMAL — LAUNDERING ONE IS NOT.**
`test-cs006-p2.js`'s `P1_DETERMINISM_HASH` is the cross-file baseline every heat
change moves; ⛔ re-record it **once per change, with one named cause**, and check
the move against `test-cs006-p5.js`'s draws-per-spawn count, which needs no
baseline and survives every retune. ⛔ **`test-cs004-p1.js`'s `GOLDEN_LANES` is
the level-1/2 board and must NOT move** — `heat(1)` is 0 and the kind pick spends
nothing there, so a move is heat leaking into level 1 or a stray draw, which is a
bug rather than a baseline.
