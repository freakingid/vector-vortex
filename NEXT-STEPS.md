# NEXT-STEPS — Vector Vortex

Work that is **specified but not yet scheduled**: a defect found or a decision
taken outside the phase flow, written up in enough detail that a fresh session
can act on it without the conversation that produced it.

⛔ **Not session context.** A build or planning phase does not read this file
unless its prompt names it. It is picked up deliberately — *"read
`NEXT-STEPS.md` and plan the rim fix"* — and never loaded by default.

**How this file is maintained**

- ⛔ **An entry is DELETED by the session that acts on it**, in the same commit
  that lands the plan or the fix. This file is a queue, not a record; the record
  is `log/CS0##.md` and `DECISIONS.md`. An entry left here after its work landed
  is a stale pointer, which is the one failure mode this file has.
- ⛔ **Every figure names the commit it was measured at**, and an entry that
  reproduces measurements from a conversation says so, because ⛔ a session that
  acts on it **re-measures before planning against it** (`CLAUDE.md` rule 3b).
- An entry names the design calls that are **Paul's**, and leaves them open. ⛔ A
  handover is not authority to decide what the game does.

---

## ⛔ THE RIM HIT-WINDOW DEFECT — unscheduled, and it blocks a playtest ask

⛔ **A session picking this up is a PLANNING session.** It writes
`PLANNED-FEATURES-*.md` and `IMPLEMENTATION-PHASES-*.md` and nothing else.
⛔ **No code, not even a test.** Run anything — probes, greps, the suite — and
measure everything.

Read `CLAUDE.md`, then `STATUS.md`. Then GDD §0 + §1, and §4.2 (Firing), §4.4,
§4.5, §6.1, §6.5, §17. Then `src/06-shots.js`, `src/09-collision.js`,
`src/23-main.js`'s `update()` ordering, and the four climb clamps in
`src/07-enemies.js`. `DIFFICULTY-NOTES.md` is not needed.

⛔ **Every number below was MEASURED at commit `9cf1320`, in the session that
found the defect, and is written down here rather than in a test. Re-measure all
of it before planning against it.** If a figure disagrees, the figure below is
wrong and yours is right — say so in the plan.

### The defect, in one sentence

An enemy parked at the rim is hittable on **1 tick in 4**, everywhere else in the
lane it is 3 in 4, and **62 % of all player deaths are to an enemy at exactly
depth 1.000** — so the game is a coin flip the player cannot see, and GDD §6.1's
*"Killed by: any shot"* is false at the rim.

Found by Paul playing the build after the CS007 close: *"these red 4-cornered
stars come out of the centre, sit on the edge of the ring and move around it.
Once they are at the edge of the ring, I can do nothing to defeat them."* That is
the Vaulter, and he is right.

### The mechanism — two off-by-ones that meet at the rim

1. **A shot never exists at the rim.** `updateShots()` (`06-shots.js`) pushes the
   new `Shot` and then ages **every** shot in the same pass, including the one it
   just created. A shot is born at depth 1.000 and its first *tested* depth is
   **0.968** (`1 - FIXED_DT / SHOT_TIME`, `SHOT_TIME` 0.52).
   ⚠ The spawner is deliberately the other way round — it runs *after* the entity
   pass so a new enemy does not move on its spawn tick (`23-main.js`). Shots and
   enemies disagree about this, and the disagreement is the bug's first half.
2. **Four enemies park at exactly depth 1.000.** Vaulter, Carrier, Drifter and
   Surger each clamp `if (this.depth > 1) this.depth = 1` (`07-enemies.js` ~190,
   ~382, ~1000, ~1269). All four carry `killDepth = 1 - C.RIM_CONTACT_DEPTH`
   = **0.95**, so they park 0.05 *past* the depth at which they already kill you.
   ⚠ The `WeaverBolt` self-terminates at `depth >= 1` and does not park; the
   Weaver and the Thorn have `killDepth = null`.

The hit test is a **point sample** with `HIT_DEPTH_TOL` 0.05 (`09-collision.js`,
`collideShots`). Shot depths step down by 0.0321 per tick, so:

| Enemy depth | Shot samples in range | Killable, 24 arrival phases |
|---|---|---|
| 0.50 / 0.80 (climbing) | 3 | **24/24** |
| 0.95 (its own kill band) | 3 | 18/24 |
| **1.000 (parked at the rim)** | **1** | **6/24** |

A held trigger fires every **4 ticks** (`SHOT_COOLDOWN` 0.055). So a rim-parked
enemy is shootable on 1 tick in 4, and which tick it hops into your lane on is
decided by the cooldown's phase — invisible and uninfluenceable.

**Measured, 20 played runs from level 1, competent driver holding fire:**

- 60 player deaths. **37 (62 %) to an enemy at exactly depth 1.000**, 13 (22 %)
  to one arriving through 0.95–0.99, 9 (15 %) other.
- Rim-parked Vaulter one lane away, hunting: **killed 6/24, killed you 18/24.**
- Mid-climb Vaulter in your lane: **killed 24/24, killed you 0/24.**

⚠ **It is not a stalemate and not an infinite loop** — 88 % of rim-reaching
enemies do die eventually. They cost a life first, then you respawn and kill
them. That is why it reads to a player as *"I can do nothing"* rather than as a
freeze, and it is why no soak in the suite catches it: every one of them asks
whether the run **terminates**, and it does.

### The two candidate fixes, and what each is worth

Both were measured by mutating `C` at runtime or by arithmetic on the shot
trajectory. ⛔ **Neither has been built. Re-derive before planning.**

| Fix | Rim ticks in range | Killable |
|---|---|---|
| shipped | 1 of 4 | 25 % |
| **(A)** fire the shot **after** the ageing loop, so its first tested depth is exactly 1.000 | 2 of 4 | 50 % |
| **(B)** stop each enemy's climb at its own `killDepth` (0.95) instead of 1.0 | 3 of 4 | 75 % |
| **(A) + (B)** | 4 of 4 | **100 %** |

⚠ **Rejected, with the measurement:** `SHOT_COOLDOWN` 0.055 → 0.033 or → 0.0167
moves the rim only 25 % → 33 %, because `SHOT_MAX` 8 then binds instead. Raising
`HIT_DEPTH_TOL` 0.05 → 0.09 reaches 50 % but widens **every** hit test in the
game and changes how shooting feels everywhere. Neither is the root cause.

⛔ **The recommendation carried into this entry is (A) + (B) as ONE change**, on
the argument that the shootable region and the killable region must be the same
region: today there is a 0.05-deep shell at the top of every lane where an enemy
kills you and your shots barely reach. With both, the difficulty goes back where
it belongs — you can only shoot your own lane, so the skill is getting there in
time. ⛔ **It is still a design call and it is Paul's, not the planning
session's.** Present it with the measurements; do not decide it.

### ⛔ The calls that are Paul's — name them and stop

1. **(A) + (B), or one of them, or something else.** See above.
2. **Whether 100 % killable at the rim is what he wants**, or whether a rim
   arrival should stay partly lethal by design. GDD §6.1 says "any shot"; GDD
   §1.1 P2 says legible before lethal. Both point at (A) + (B), but the *feel*
   call is his.
3. ⛔ **WHERE THIS LANDS, AND IT IS NOT FREE.** `ROADMAP.md` says renumbering is
   cheap; the two +1 renumbers it records actually cost sweeps of 17 and 73
   in-repo pointers. ⚠ **The recommendation is to make it `CS008 P1`, before any
   front-of-house work**, on the argument that you cannot judge scoring, extra
   lives or a HUD in a game where 62 % of deaths are a lottery — and that this
   avoids a third renumber for a two-file fix. The alternative is a
   `CS007.1`-style insert, which breaks the `CS0##` filename convention used by
   `log/`, `archive/` and both document maps.

### ⛔ What the plan must MEASURE before it is written

1. **Does (A) move `test-cs004-p1.js`'s `GOLDEN_LANES`?** ⚠ `STATUS.md` says a
   move there is a defect. **This is the one change for which that may not be
   true**: killing an enemy one tick earlier changes the board, which changes
   `laneCrowded()`, which changes `pickSpawnLane()`'s bounded redraws, which is
   the golden's own sequence. Measure it directly. If it moves, the plan says so,
   names the single cause, and `STATUS.md`'s rule gets an explicit exception —
   ⛔ do not let it move quietly, and do not weaken the rule for anything else.
2. **`test-cs006-p2.js`'s `P1_DETERMINISM_HASH` will move.** One cause. Check the
   move against `test-cs006-p5.js`'s draws-per-spawn count, which needs no
   baseline and survives every retune — that is what it is for.
3. **The ten closed test files that touch shot depth or `SHOT_TIME`**:
   `test-cs002-p3`, `test-cs003-p3`, `test-cs003-p5`, `test-cs004-p2`,
   `test-cs004-p3`, `test-cs004-p4`, `test-cs004-p5`, `test-cs005-p2`,
   `test-cs005-p3`, `test-cs005-p5`. ⛔ Inventory which assertions actually
   change, one by one, with the failure each will produce.
   `PLANNED-FEATURES-CS006.md`'s three false predictions and CS007's
   over-forecast (26/33/7 predicted, 1/9/throw actual) are both in the record —
   ⛔ **probe the real thing, do not emulate it.**
4. **Does (B) disturb GDD §4.4's respawn guarantee?** `C.RESPAWN_PUSH_DEPTH` 0.55
   and `C.CLIMB_MULT_MAX` 1.40 with a margin of +0.087 s are derived against a
   climb to the *kill band*, not to 1.0, so it should be untouched — ⛔ but
   `test-cs007-p2.js` asserts the property over levels 1..200 and the plan must
   say it was checked, not assume it.
5. **Does (B) change `atRim()`?** The Vaulter's `atRim()` is `depth >= 1` and
   gates rim hunting and `vaultRimInterval()`. If the clamp becomes 0.95 the
   predicate must move with it or a Vaulter never hunts again — ⛔ this is the
   most likely way to ship a silent regression, and `test-cs007-p5.js`'s passive
   runs would probably not catch it.
6. **Does anything else read `depth >= 1` or `depth === 1`?** Grep the build.
7. **The four soaks' lane bounds and `test-cs007-p5.js`'s clamp sampling** should
   be untouched by both fixes. Confirm, do not assume.

### What the plan must produce

- `PLANNED-FEATURES-*.md`: the defect **re-measured**, the option table, the
  three calls above stated and **left open for Paul**, the closed-file edit
  inventory with a named cause each, the baseline re-record ledger with one cause
  each, and acceptance criteria. Every claim marked MEASURED or PREDICTED.
- `IMPLEMENTATION-PHASES-*.md`: phase order and per-phase prompts.
- ⛔ Nothing else. No `src/`, no tests.

### Two things the fix unblocks

- ⛔ **`PLAYTEST.md`'s CS007 ask — *"can you NAME what changed at level 5, at 9,
  at 13"* — is BLOCKED on this.** With 62 % of deaths coming from the rim, a
  player does not reach level 5, so the ask cannot be answered and the sitting
  should not be attempted until the fix ships. Say so in the plan.
- The two ⛔ asks parked on GDD §4.6's Start Depth are still parked on Start
  Depth; that is a different blocker, not this one.

### Interim workaround, already in `PLAYTEST.md`'s key list

`shift` or `x` is the **Purge** — one charge per well, first use clears the whole
board (GDD §4.3). That is the answer to a rim-parked enemy until this ships.
