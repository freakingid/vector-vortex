# PLANNED-FEATURES-CS005 — The boundary and the fuse

**Changeset:** CS005 · **Status:** not started · **Depends on:** CS004 closed at
`74fb50c`
**GDD sections in scope:** §3.5 (open wells are a tactical system), §4.5 items 2
and 3, §6.1 (roster — the Drifter and Surger rows), §6.2 (the remaining two
cargo rows), §6.3 (the two ⛔ readability rules this changeset exists for), §6.5
(entity contract), §10.2–10.3 (rendering, the readability contract), §12 (the
prompt strings that name the Drifter's visual language), §17 items 1, 3 and 6

---

## Why this changeset exists

CS004 landed the three enemies that pour into CS003's contract as it shipped.
The two left are the ones whose **readability is the feature**. Both carry a ⛔
in §6.3. Both have a failure mode that is not "too hard" but "a death the player
cannot account for", which §6.3 names as the most common complaint about clones.

They also need machinery the spine did not anticipate. The Drifter is the first
entity in the build that lives on a lane *boundary* — a half-lane — and the
build's one wall helper folds about lane centres. The Surger is the first entity
whose lethality is a **phase of its own cycle** rather than a fixed depth.

After this changeset the Classic roster is complete: six enemies, three Carrier
variants, and §4.5's death conditions 1 through 4 live. Only condition 5 (a
Thorn during the Dive) is left, and it needs a Dive.

---

## Scope check against what CS004 actually shipped

⛔ **Read this before assuming `ROADMAP.md`'s CS005 line is still exact.** It is
mostly right and it is **wrong on two of five items**, both load-bearing.
Checked against the pushed tree at `74fb50c`, with `node build.js` and
`node scratchpad/run-all.js` green — 19 test files, zero skips.

### 1. ⛔ The Drifter's `killDepth` cannot be `0`, and two shipped comments say it will be

This is the finding of the scope check and it is the one thing that would have
shipped an unfair enemy.

`collideSkimmer()` (`src/09-collision.js`) is three lines of test:

```js
if (e.killDepth === null || e.killDepth === undefined) continue;
if (e.depth < e.killDepth) continue;
if (!laneHit(well, e.lane, sk.lane)) continue;
killSkimmer(state);
```

There is no term for where the *Skimmer* is, because the Skimmer is always at
depth 1. So `killDepth = 0` does not mean "lethal on contact at any depth". It
means **`e.depth >= 0`, which is every legal depth** — the entire lane, from the
throat outward, is a kill zone the instant a Drifter is in it.

`pickSpawnLane()` draws a lane from the run's stream with no reference to the
Skimmer, and `updateSpawner()` spawns at depth 0. `spawnEnemy()`'s safe-spawn
rule only ever *lowers* a depth, and lower is still lethal here. So a Drifter
released into the player's lane kills them **on the spawn step, from the far end
of the well, having travelled nowhere**. It is frequent, it is free, and it is
precisely the death §6.3's ⛔ exists to prevent.

⛔ **Default taken: `killDepth = 1 - C.RIM_CONTACT_DEPTH`,** the same expression
every other contact enemy uses, so retuning the band moves them together.

**What §4.5 item 2 means under that reading.** The list distinguishes *which
entities kill by contact and when*. The Weaver's body never kills, at any depth,
including at the rim. The Thorn never kills outside the Dive. The Drifter is the
opposite extreme: it kills **in both phases of its cycle** — you can neither
shoot an armoured one nor touch it. "Any depth" is about there being no safe
*phase*, not about there being no safe *distance*. That is a real distinction
and it is why the condition is listed separately.

⛔ **Two shipped comments predict `0` and must be corrected in the same phase.**
`src/07-enemies.js`'s base-class `killDepth` note ("the Drifter will be 0
(lethal at any depth, GDD 4.5 item 2)") and `src/09-collision.js`'s
`collideSkimmer` header say the same thing. A comment predicting a value reads
as shipped truth to the session that finds it — the same rule CS003 P1 and
CS004 P1 applied to stale changeset pointers, and for the same reason.

**The retreat, if this is ever revisited.** The moment the Skimmer has a real
depth — §5's Dive, §14.2's Jump — `killDepth = 0` becomes honest, because
`collideSkimmer` would then have two depths to compare. Lowering the field is a
one-line change with nothing else to move. ⛔ Do not build that machinery now:
the Skimmer has no `depth` field, adding one for an entity that cannot use it
yet is building ahead, and a collision pass with a Skimmer-depth term is a
second thing to keep in step for zero present benefit.

⚠ **This is the one call in this document I want confirmed before P2 runs.** It
is ~10 lines of P2 and one line of P5's soak either way.

### 2. `laneHop()` is the right helper. "Fix the fold point" is the wrong fix

The carried task in `STATUS.md` says *"`laneHop()`'s half-lane fold point is
CS005's"*, and reasons that the Drifter may not call `laneHop` at all because it
"moves continuously". Both halves need correcting.

**The Drifter does call it.** Its lane coordinate changes only during a *cross*,
and a cross is exactly one lane unit from one boundary to the next. What moves
continuously is its **depth**, along the boundary it is riding. Its lane motion
is a hop with a different lattice, not a different kind of motion.

**The degeneracy is real.** Verified against the build:

```
laneHop(Vee, 0.5, -1, -1)   →  { lane: 0.5,  dir: +1 }
laneHop(Vee, 11.5, +1, +1)  →  { lane: 11.5, dir: -1 }
```

A cross that lands where it started. On the Vaulter this is documented and
harmless ("a half-lane, which no spawner produces"). On the Drifter it is the
*normal case at the wall*, and it costs a whole vulnerable crossing window in
which the entity announces itself as shootable and then does not move — which
reads as a bug even to a player who cannot name it.

**But the fold points are not a defect.** `laneHop` mirror-folds about `0` and
`lanes - 1` because those are the extreme legal positions **for a lane-centre
entity**, and that is correct for the Vaulter forever. A boundary-rider's
extreme legal positions are `0.5` and `lanes - 1.5`. The two entities want
different fold bounds, not a different helper.

⛔ **The fix is that the fold bounds become optional parameters, defaulting to
`0` and `well.lanes - 1`.** The Vaulter's call site does not change and its
behaviour is unchanged by construction.

Verified before writing this: the generalised function is **bit-identical** to
the shipped one across a sweep of six wells (four open, two closed) × 81 lane
values at quarter-lane resolution × seven deltas including half-lanes × both
directions. Mismatches: **0**. P1 ships that sweep as its test.

With the boundary bounds, the same call behaves:

```
laneHop(Vee, 0.5,  -1, -1, 0.5, 11.5)  →  { lane: 1.5,  dir: +1 }
laneHop(Vee, 11.5, +1, +1, 0.5, 11.5)  →  { lane: 10.5, dir: -1 }
```

It moves one full lane and reverses. No wasted vulnerable beat, and the wall and
the heading stay one piece of state, which is the whole reason `laneHop` returns
`dir` at all.

### 3. How a Drifter is born on a boundary — and why the answer is "it isn't"

`pickSpawnLane()` returns `rngInt(state.rng, well.lanes)`, an integer lane
centre, and `laneNormalize()` clamps `-0.5` to `0` on an open well. So the
spawner cannot produce a half-lane and the two outermost boundaries are not
addressable. `STATUS.md`'s framing offers two answers: the factory snaps, or
`spawnEnemy` learns about half-lanes. **Both are wrong, and the second is wrong
twice.**

⛔ **`spawnEnemy` learns nothing.** It is the one entry point and it stays a
function of `(kind, lane, depth)` with no knowledge of any entity's lattice.

⛔ **The factory does not snap either, and this is verified rather than
preferred.** `scratchpad/test-cs004-p2.js` and `test-cs004-p5.js` both loop over
the `CARGO` table, split a Carrier of each cargo, and assert the children land
in exactly `splitLanes()`' two integer lanes:

```js
H.assert(kids[0].lane === want[0] && kids[1].lane === want[1], ...)
```

A factory that snapped a Drifter to the nearest boundary turns both of those red
— in two closed changesets' test files — the moment `CARGO.drifter` lands.
`scratchpad/test-cs004-p1.js` also probes every `ENEMY_KINDS` row by calling it
directly as `ENEMY_KINDS[kind](0, 0, 1)`, with no well in scope at all.

⛔ **A Drifter is born at the lane centre it was spawned into, and its first act
is a half-cross onto the nearest legal boundary.** Three consequences, all of
them good:

- The constructor needs no `well`, which is what makes the three closed tests
  pass untouched.
- It emerges from the throat **visibly vulnerable** — the crossing state, open
  and bright — and only becomes armoured once it settles. The player is shown
  the vulnerable read at the depth where they have the most time. §1.1 P2,
  delivered by the movement model rather than by a rule.
- The wall case collapses to a direction choice. `lane ± 0.5` from an integer
  lane always lands on the lattice except from lane 0 heading down and lane
  `lanes-1` heading up, and one reversal always fixes it — provable by
  exhaustion on a strip of three lanes or more, which every shipped well is.

The birth cross does **not** go through `laneHop`. Folding an off-lattice start
about the lattice bounds overshoots: `laneHop(Vee, 0, -0.5, -1, 0.5, 11.5)`
returns lane **1.5**, a lane and a half in one cross time — three times the
Drifter's lane speed, which its own soak would read as a teleport. It gets its
own six-line helper next to `laneHop`, and that helper is where `well.closed` is
consulted, so ⛔ **nothing in `07-enemies.js` reads the topology** — the same
property the Vaulter's header claims and the reason a Drifter behaves on a Ring
and on a Fan without a branch.

**And a Drifter cannot ride the outermost boundaries at all.** Separately from
`laneClamp`: `polyAt()` clamps an open well's vertex parameter to
`[0.5, n - 0.5]`, which is lane `[0, n-1]`. Verified — lane `-0.5` and lane
`n-0.5` project to the same point as lanes `0` and `n-1`, the lane *centres*.
So the walls are not drawable, let alone ridable. A 13-lane Vee has **twelve**
ridable boundaries, not fourteen. On a closed well all `n` boundaries are legal
and drawable: `polyAt(Ring, 15.5)` correctly returns vertex 0.

### 4. The Surger's discharge fits the shipped contract, with no eighth field

Verified against `collideSkimmer()` as written.

⛔ **The discharge is `killDepth` mutated to `0` for the discharge window and
restored afterwards.** With `killDepth = 0` the test `e.depth >= e.killDepth` is
unconditionally true, so the only remaining term is `laneHit()` — which is
exactly §4.5 item 3, "being in a Surger's lane when it discharges". It is a
mutated field, not a new one, and the collision pass grows no branch.

`Game.update()` runs the entity pass, then the Purge, then the collision pass,
so a Surger that enters the discharge on step *n* is lethal on step *n*. Correct
ordering, no one-step lag.

⛔ **Do not add a field.** Note the irony that this is the same value finding 1
rejects for the Drifter, and it is right here for the same reason it is wrong
there: on the Drifter it would be a permanent property of a climbing enemy; on
the Surger it is a 0.30 s window the player was given a 0.45 s fuse to leave.

**Two constraints the carried task did not name, both from the collision pass:**

- ⛔ **A Surger starts in `climb` with a zero timer and can never discharge on
  its first step.** §6.3 is explicit that the fuse is the fairness. A Surger
  that arrives already discharging is the same unaccountable death finding 1 is
  about. This also keeps `test-cs004-p1.js`'s `spawnRow` case green, which
  drives one `G.update(DT)` over a freshly spawned row.
- ⛔ **`C.SURGE_DISCHARGE` must be strictly less than `C.RESPAWN_INVULN`.**
  §4.4's rim push clamps enemies down to `RESPAWN_PUSH_DEPTH` on respawn so the
  player is never killed on re-entry — but a `killDepth = 0` entity is still
  lethal at 0.55, so the push does nothing for a discharging Surger and the
  invulnerability window is the only thing protecting the player. Asserted from
  the constants, with the reason at the assertion.

### 5. `entityPoints()` covers both Drifter states, and §6.3 and §12 agree

`STATUS.md` frames the Drifter's two states as "a line-weight and glow decision,
not a silhouette one". §12's prompt string says otherwise, and it is the sharper
statement of the two:

> `SOLID = ARMOURED · OPEN = VULNERABLE`

That is `drawPoly`'s `closed` argument. §6.3's own wording agrees — "tight,
hard-edged, dim" against "**bloomed open** and bright". So the read has **three
independent channels**, and all three are available with no renderer change:

| Channel | Riding (armoured) | Crossing (vulnerable) | Mechanism |
|---|---|---|---|
| Silhouette | compact, **closed** | splayed, **open** | two polys, `drawPoly`'s `closed` |
| Stroke width | narrow | wide | the `width` argument to `glowStroke` |
| Bloom / alpha | dim | full | the `alpha` argument to `glowStroke` |

`glowStroke` is two strokes whose spread is `width * C.GLOW_WIDE_W`, so a
narrower width is *literally* a harder edge, not a metaphor for one. ⛔ **No
global glow constant is touched** — `GLOW_WIDE_W`, `GLOW_WIDE_ALPHA` and
`GLOW_THIN_ALPHA` are shared with the well and every other entity, and retuning
them is an art pass across the whole build. The Drifter's states are per-entity
multipliers only.

Two polys is free: `entityPoints()` memoizes a scratch array **per poly array**,
which is the Carrier's shipped hull-plus-glyph pattern. No change to
`entityPoints` is in scope.

### 6. The Surger's telegraph is an entity draw, and that still holds

Re-confirmed against the shipped renderer. `Game.draw()` calls
`drawWell(ctx, well, state.level, null, 0)` — `laneState` is `null` and no
caller passes one. §6.3 asks for a lane that **brightens throat→rim across
`SURGE_TELEGRAPH`**, which is a progressive segment, not a boolean spoke.

`src/14-render-entities.js` already names this: `drawThorn()`'s header says it
is the first entity that is a segment along a lane rather than a silhouette at a
point, and that *"CS005's Surger telegraph is the other one."* The pattern is
`drawShot()`'s — preallocated scratch points, `screenPos` per end, `drawPoly`,
`glowStroke`. ⛔ **Its own scratch points, not the Thorn's**: both can be live
in the same lane in the same frame, and sharing module scratch between two
segment drawers is a trap even though the calls are sequential leaves today.

⛔ `laneState` stays unwired. It is CS006's, with the dim band.

### 7. ⛔ CS005 edits **no** closed changeset's test file — and three of them will exercise it anyway

`STATUS.md` carries *"⛔ `MAX_LANE_STEP` has to become per-entity, in
`test-cs003-p5.js` and `test-cs004-p5.js` both."* Checked; it does not.

**`test-cs003-p5.js` — zero edits.** It never touches `C.DEBUG_SPAWN_KINDS`, so
it runs on the shipped `["vaulter"]` and only Vaulters ever reach its board. Its
`MAX_LANE_STEP = 2 * DT / C.VAULT_HOP_TIME` is the right bound for the entities
it actually observes, and CS003 P5's whole finding — that a range check misses a
wrapping hop — is preserved untouched. Its one CS005-relevant line reads
`COUNTS.enemyKinds` from the registry.

**`test-cs004-p5.js` — zero edits.** It sets its own
`MIXED = ["vaulter", "carrierVaulter", "weaver"]`. ⛔ **CS005 must not extend
that list.** Doing so would make CS004's closing soak assert entities CS005
built, which is exactly what `CLAUDE.md`'s "a test asserts only what its own
phase owns" forbids, and it would put a per-entity bound into a file whose
stated job is the *stronger* exact-equality form.

**CS005 writes its own soak** (P5), which owns the Drifter's bound and the
Surger's strong form. The only shared edit anywhere is `test-registry.js`, which
is explicitly the one file allowed to name a global count.

**But three closed test files start exercising CS005's entities the moment its
kinds land, and they pass unchanged only if four things hold:**

| File | What reaches CS005's entities | Constraint on CS005 |
|---|---|---|
| `test-cs004-p1.js` | `DEBUG_ROW_KINDS` already lists `drifter` and `surger`; the row grows 4 → 6 and is driven one `G.update(DT)` | ⛔ Neither new entity may **spawn anything** on its first step (the Weaver does, and the test filters for exactly that). Depths must stay ascending and inside `[0, SAFE_SPAWN_DEPTH]` after one step |
| `test-cs004-p1.js` | `ENEMY_KINDS[kind](0, 0, 1)` probes every row | ⛔ Both constructors must work **with no `well` in scope** |
| `test-cs004-p2.js`, `test-cs004-p5.js` | Both loop over `CARGO` and assert children land in `splitLanes()`' exact integer lanes and at the parent's exact depth | ⛔ A newborn Drifter's `lane` and `depth` are exactly what the constructor was handed. Finding 3's birth model |
| `test-cs004-p2.js:440` | `Array.isArray(X.CARGO_GLYPHS.vaulter) && ... .length >= 2` | ⛔ `CARGO_GLYPHS` values stay **plain arrays** and every glyph stays an **open path**. No `{poly, closed}` reshape |

⚠ `test-cs004-p5.js`'s `FORBIDDEN` key list is hardcoded as
`["r","w","0","1","2","3","4"]`. Two new debug digits do not make it fail — its
own recorded input list presses none of them — but it stops being exhaustive.
CS005's soak carries the superset and says why rather than editing CS004's.

**Verdict: `ROADMAP.md`'s CS005 line holds, with two items reworded.** The
`laneHop` task becomes a parameterisation; the `MAX_LANE_STEP` task becomes a
new soak rather than two edits.

---

## ⛔ One changeset, not two

The case for splitting was three things: a geometry change, edits to two closed
changesets' test files, and a rendering requirement carrying a ⛔. All three
shrank on inspection.

- The geometry change is **two optional parameters and one six-line helper**,
  with a provable no-op for every existing caller.
- The test-file edits are **zero**.
- The rendering requirement is **per-entity constants and two polys**, touching
  no shared glow value and no renderer.

What is left is two enemies, two cargo rows and a soak — the shape of CS004,
which was five phases. `ROADMAP.md`'s sizing assumption (#1: "3–5 phases of one
session each") is met.

⚠ **If it does want splitting, the seam is after P2.** CS005 becomes the
boundary lattice and the Drifter; CS006 becomes the Surger, the cargo rows and
the close. That is the honest seam because the Drifter carries all of the
geometry risk and none of the Surger's work depends on it. Renumbering is cheap
and `ROADMAP.md` has already absorbed one +1 sweep. ⛔ Do not split *inside* P2:
a Drifter that moves but does not read is worse than no Drifter, because it
would be judged on hardware in a state its own ⛔ forbids.

---

## What ships

- **P1 — the boundary lattice.** `laneHop`'s optional fold bounds,
  `laneBoundaryLo/Hi()`, `boundaryFrom()`. No entity, no rendering.
- **P2 — the Drifter.** `class Drifter`, the ride/cross cycle, the birth
  half-cross, homing, the armour, both visual states, the `drifter` kind, debug
  key `5`.
- **P3 — the Surger.** `class Surger`, the climb/telegraph/discharge cycle, the
  `killDepth` mutation, the zigzag silhouette, the telegraph segment, the
  `surger` kind, debug key `6`.
- **P4 — the last two cargo rows.** `CARGO.drifter`, `CARGO.surger`, the two
  `ENEMY_KINDS` carrier variants, two glyphs. §6.2's table complete.
- **P5 — the soak, the docs, the close.** §17 items 1, 3 and 6 across the full
  roster; the registry counts; GDD, `CLAUDE.md` and `RATIONALE.md` updates;
  `log/CS005.md`; archive. Closing phase.

### The contract, after this changeset

⛔ **Unchanged. Seven fields, three signatures, still no behaviour in the base.**
This is the first changeset since CS003 that adds nothing to `Enemy`, and that
is the strongest available evidence the contract is right. Both new entities are
expressed entirely in the existing fields:

| Entity | `purgeable` | `blocksClear` | `killDepth` | `anchored` | `onShot` |
|---|---|---|---|---|---|
| **Drifter** | `true` — §6.1's "Purge anywhere" | `true` | `1 - C.RIM_CONTACT_DEPTH` (finding 1) | `false` | ⛔ **phase-dependent**: `false` while riding (armoured, shot flies on), `true` + `dead` while crossing |
| **Surger** | `true` | `true` | `1 - C.RIM_CONTACT_DEPTH`, ⛔ **mutated to `0`** for the discharge window | `false` | `true` + `dead` — any shot kills it |

⛔ **The Drifter is the roster's first phase-dependent `onShot`,** and it is the
first entity to use the base class's documented `return false` path in anger.
The Weaver's bolt is the shipped precedent (never consumed) and the Thorn is the
other (always consumed); the Drifter is the first that is sometimes each.

⛔ **The Surger is the roster's first mutated `killDepth`.** Write at the field
that it is a *cycle phase expressed in an existing field*, not a new kind of
value — and that `collideSkimmer` needs no branch for it, which is the whole
return on the contract.

### The Drifter's movement model

⛔ **Two phases and a birth, all timers counting UP (§16.3).**

```
  birth   one half-cross from the spawned lane centre onto the nearest legal
          boundary, over C.DRIFT_CROSS_TIME * 0.5.  VULNERABLE.
  ride    on the boundary. depth climbs at C.DRIFT_CLIMB. INVULNERABLE.
          Held for C.DRIFT_RIDE_TIME.
  cross   one lane to the next boundary, over C.DRIFT_CROSS_TIME. VULNERABLE.
  ride    …
```

- ⛔ **Depth climbs in *both* phases.** A Drifter can never park, which is what
  keeps an unshootable entity from becoming a permanent concurrency squatter
  (see Known hazards). The lane speed is therefore identical in birth and cross
  — half the distance over half the time — so the soak's bound is one derived
  number, `2 * DT / C.DRIFT_CROSS_TIME`, and not a per-phase table.
- ⛔ **The cross goes through `laneHop`** with the boundary fold bounds, and the
  returned `dir` is **written back**. Same rule as the Vaulter's, same reason:
  the wall and the hopper's heading are one piece of state.
- **Homing.** Above `C.DRIFT_HOME_DEPTH` the next cross's direction comes from
  `laneDelta(well, this.lane, skimmer.lane)` rather than from the stored
  heading — the shape of `Vaulter.huntDir()`, reused deliberately. Below it, the
  stored heading carries. §6.1's "homes near rim".
- **At depth 1** the climb stops (the Vaulter's rule, and for the Vaulter's
  reason: `depth > 1` is not a legal position) and the cycle continues, so a rim
  Drifter is a boundary-hopping hunter.

⚠ **A riding Drifter threatens two lanes.** `C.HIT_LANE_TOL` is 0.5, and a
boundary is exactly 0.5 from two lane centres, so `laneHit` is true for both.
That is correct — it is the entity's whole tactical identity — and it is worth
knowing before playtesting, because it makes the Drifter the largest lethal
footprint in Classic.

### The Surger's cycle

```
  climb       depth rises at C.SURGE_CLIMB. surgeTimer counts UP toward
              C.SURGE_INTERVAL. killDepth is the rim band.
  telegraph   C.SURGE_TELEGRAPH (0.45 s). The lane brightens throat -> rim as a
              growing segment. ⛔ killDepth is STILL the rim band — the fuse is
              a warning, not the effect.
  discharge   C.SURGE_DISCHARGE. ⛔ killDepth = 0. The whole lane is live.
  climb       …
```

⛔ **Starts in `climb` with `surgeTimer = 0`.** Finding 4.
⛔ **The lane is never lethal during the telegraph.** A fuse that kills is not a
fuse.
⛔ **One lane, never hops.** No lane helper is touched; `lane` is written once,
by the constructor. It therefore joins CS004's four entities in P5's *strong*
lane assertion rather than needing a speed bound.

### Constants this changeset adds to `C`

⛔ All in `src/00-config.js`, grouped, before first use. Every value is a
level-1 starting point; CS006 owns retuning them through `heat(level)`.

| Group | Constant | Proposed | Note |
|---|---|---|---|
| Drifter | `DRIFTER_SIZE` | `0.66` | Lane widths spanned by the crossing silhouette |
| Drifter | `DRIFT_CLIMB` | `0.13` | depth/s, in **both** phases. Throat→rim ≈ 7.7 s |
| Drifter | `DRIFT_RIDE_TIME` | `0.85` | s on a boundary before a cross. ⛔ The armour budget — see hazards |
| Drifter | `DRIFT_CROSS_TIME` | `0.45` | s to cross one lane, vulnerable throughout |
| Drifter | `DRIFT_HOME_DEPTH` | `0.60` | Above this, crosses aim at the Skimmer |
| Drifter | `DRIFT_RIDE_WIDTH` | `0.70` | ⛔ Multiplier on `laneLineWidth` while riding — tight, hard-edged |
| Drifter | `DRIFT_CROSS_WIDTH` | `1.60` | ⛔ …and while crossing — bloomed |
| Drifter | `DRIFT_RIDE_ALPHA` | `0.55` | ⛔ The dim half of §6.3's read. Crossing is 1.0 |
| Surger | `SURGER_SIZE` | `0.85` | Lane widths spanned by the zigzag bar |
| Surger | `SURGE_CLIMB` | `0.15` | depth/s. Throat→rim ≈ 6.7 s |
| Surger | `SURGE_INTERVAL` | `2.60` | s between discharges. ⚠ CS006 makes this heat-derived |
| Surger | `SURGE_DISCHARGE` | `0.30` | s the lane is live. ⛔ Must be `< C.RESPAWN_INVULN` |
| Surger | `SURGE_LIT_WIDTH` | `2.20` | Multiplier on `laneLineWidth` for the live lane |

⛔ **`SURGE_TELEGRAPH` (0.45) already exists and is not re-declared.** It has
been in `C` unread since CS001; this changeset is its first reader.
`DRIFTER_COLOR`, `SURGER_COLOR`, `PTS_DRIFTER` and `PTS_SURGER` also already
exist. The two colours stay ⚠ provisional with the rest of the palette; the two
point values stay **unread** until `addScore()` lands in CS007.

⛔ **The two-state separation is a headless gate, not an eyeball.** §6.3's ⛔ is
an art rule, and art rules rot silently. Assert from the constants that the two
states differ on every channel by a stated margin:

```
C.DRIFT_CROSS_WIDTH / C.DRIFT_RIDE_WIDTH  >=  2.0
C.DRIFT_RIDE_ALPHA                        <=  0.7
DRIFTER_POLY_RIDE  is drawn closed;  DRIFTER_POLY_CROSS  is drawn open
```

A future retune cannot then collapse the two reads into one without turning the
suite red. This is what CS005 does *instead of* building `tools/glow-lab.html`.

### The two cargo rows

Three table entries and two glyphs, per §6.2's shape:

| Cargo | `CARGO` row | `ENEMY_KINDS` row | Glyph |
|---|---|---|---|
| `drifter` | `{ kind: "drifter" }` | `carrierDrifter` | ⛔ open path |
| `surger` | `{ kind: "surger" }` | `carrierSurger` | ⛔ open path |

⛔ **One `splitLanes()` for all three rows.** §6.2's "adjacent" (Vaulter) and
"flanking" (Surger) are the same geometry; the distinction that section draws is
between the correct *responses* — move away versus hold still — which comes from
what the cargo does after it lands. CS004 settled this and it does not reopen
because the second word finally has an entity behind it.

⛔ **Glyph design rule, and it is the one this row completes:** the glyph is a
miniature of the cargo's own gesture. The Vaulter's is a chevron, which is its
arm. The Surger's is a zigzag, which is its bar. The Drifter's is a jagged
scatter with no dominant axis, which is its cluster. That makes cargo-reading
*learnable* rather than memorised, which is §6.2's stated point. All three stay
**open paths** and **plain arrays** — finding 7's fourth row.

⛔ **The correct responses are opposite and the glyphs are what carry them.**
Drifter cargo: shoot, **move away**. Surger cargo: shoot, **hold still**. A
player who reads the glyph wrong at throat depth does the exact opposite of the
right thing, which is why §6.2 says reading it fast separates competent from
good — and why P4's playtest ask is about throat depth, not the rim.

### The debug bench

Two more named actions on the existing `actionKeys` path. ⛔ Digits, ⛔ no second
listener.

| Key | Action | Does |
|---|---|---|
| `5` | `spawnDrifter` | One, in the Skimmer's lane, at `depth 0` |
| `6` | `spawnSurger` | " |
| `0` | `spawnRow` | **Already lists both.** The row grows 4 → 6 with no edit |

`DEBUG_ROW_KINDS` in `src/23-main.js` already reads
`["vaulter","carrierVaulter","weaver","thorn","drifter","surger"]`, and the
stagger is already computed on `n = 6`. CS004 P1 wrote it that way deliberately.
⛔ Do not touch it.

⛔ **Not cargo keys.** The bench gets one key per roster row, not one per
`ENEMY_KINDS` string. Pressing `2` shows a hull and a glyph, which is what the
bench is for. Six keys plus the row is where this stops; if CS011 wants more,
collapse to a select-and-spawn pair.

### Fields `state` gains

**None.** Both entities hold their phase and their timers as instance fields,
exactly as the Weaver holds its cycle. `test-registry.js`'s `STATE_FIELDS` gets
no `CS005` key.

---

## Acceptance criteria

**The boundary lattice (P1)**

- [ ] ⛔ `laneHop(well, lane, delta, dir, lo, hi)` takes optional fold bounds
      defaulting to `0` and `well.lanes - 1`.
- [ ] ⛔ **Provably a no-op for every existing caller.** A sweep over all sixteen
      wells × lane values at quarter-lane resolution × deltas including
      half-lanes × both directions asserts the four-argument form returns
      `Object.is`-identical `lane` and identical `dir` to the shipped
      implementation's behaviour. **Mutation-checked:** changing either default
      turns the sweep red.
- [ ] `laneBoundaryLo(well)` / `laneBoundaryHi(well)` return `0.5` and
      `well.lanes - 1.5` on an open well. ⛔ Numbers, not an object — they are
      called from a per-frame path and must not allocate.
- [ ] ⛔ `boundaryFrom(well, lane, dir)` returns a legal boundary and the heading
      to keep, reversing once at an open well's wall. Asserted **by exhaustion**:
      every integer lane of every one of the six open wells, both directions —
      the result is always on the lattice and always within half a lane of the
      input.
- [ ] On a closed well, `boundaryFrom` wraps and never reverses:
      `boundaryFrom(Ring, 0, -1)` gives lane `15.5`, which `polyAt` resolves to
      vertex 0.
- [ ] ⛔ **The two outermost boundaries of an open well are documented as
      unridable**, with the `polyAt` clamp as the reason — a 13-lane Vee has
      twelve ridable boundaries.
- [ ] The Vaulter's soak in `test-cs003-p5.js` is still green, untouched.

**The Drifter (P2)**

- [ ] ⛔ Born at the lane centre it was handed. `lane` and `depth` immediately
      after construction are `Object.is`-identical to `spawnEnemy`'s arguments,
      and the constructor takes no `well`.
- [ ] The first `update()` starts a half-cross onto a legal boundary; every
      subsequent cross is one full lane through `laneHop` with the boundary
      bounds and the returned `dir` written back.
- [ ] ⛔ On every open well, from every starting lane, `lane` never leaves
      `[0, lanes-1]` and — once settled — is always on the boundary lattice or
      strictly between two adjacent lattice points.
- [ ] ⛔ Riding is invulnerable: `onShot` returns `false`, the Drifter does not
      die, and the shot flies on. Crossing is vulnerable: `onShot` kills and
      consumes. **Mutation-checked:** a Drifter that returns `true` while riding
      turns the suite red.
- [ ] ⛔ The Purge kills it in **either** phase — §6.1's "Purge anywhere",
      which is `purgeable = true` and no special case.
- [ ] ⛔ `killDepth` is `1 - C.RIM_CONTACT_DEPTH` (finding 1), and the two
      shipped comments that predict `0` are corrected in the same commit.
- [ ] Depth rises in both phases and stops at 1; the cycle continues at the rim.
- [ ] Above `C.DRIFT_HOME_DEPTH` the next cross aims at the Skimmer via
      `laneDelta`; below it the stored heading carries.
- [ ] ⛔ Two polys, two `glowStroke` calls, one drawn `closed` and one open. The
      three-channel separation gate passes from the constants.
- [ ] ⛔ It reads no `well.closed` anywhere in `07-enemies.js`.
- [ ] ⛔ It spawns nothing on any step, ever.

**The Surger (P3)**

- [ ] The cycle runs — climb, telegraph, discharge, climb — with `depth` never
      leaving `[0,1]` and every timer counting up.
- [ ] ⛔ It never discharges on its first step, from any spawn depth.
- [ ] ⛔ `killDepth` is the rim band during climb **and telegraph**, and exactly
      `0` during discharge, restored on exit. **Mutation-checked:** a Surger
      lethal during its telegraph turns the suite red.
- [ ] §4.5 item 3 is live through the real `killSkimmer()`: a Skimmer standing
      in a discharging Surger's lane dies at any depth the Surger has reached.
- [ ] A Skimmer one lane away does **not** die — `laneHit`'s `HIT_LANE_TOL` is
      the whole lane test and nothing widens it.
- [ ] ⛔ `C.SURGE_DISCHARGE < C.RESPAWN_INVULN`, asserted from the constants with
      the reason at the assertion.
- [ ] ⛔ One lane, never hops. `lane` is `Object.is`-identical to its spawn lane
      on every tick, on every well.
- [ ] The telegraph draws as a segment rooted at the throat whose tip advances to
      the rim across `C.SURGE_TELEGRAPH`, in its own preallocated scratch, with
      no per-frame allocation.
- [ ] Any shot kills it and is consumed; the Purge kills it; it blocks the clear.

**The cargo rows (P4)**

- [ ] `CARGO` has three rows; each has an `ENEMY_KINDS` carrier variant, a live
      child kind, and a glyph. §6.2's table is complete.
- [ ] ⛔ `test-cs004-p2.js` and `test-cs004-p5.js`'s `CARGO` loops pass
      **unedited** for all three rows — exact split lanes, exact parent depth,
      exactly two children, exactly two RNG draws.
- [ ] ⛔ All three glyphs are open paths in plain arrays.
      `test-cs004-p2.js:440` is green.
- [ ] A `carrierDrifter` killed at the rim yields two Drifters at the parent's
      depth, which then begin their birth crosses independently.

**Cross-cutting (P5)**

- [ ] ⛔ §17 item 3, extended: 5,000 ticks on each of the six open wells with
      **all six** kinds live, plus adversarial rotation input. No `lane` outside
      `[0, lanes-1]`, no `depth` outside `[0,1]`, no NaN in state or in any
      projected point, no array growing without bound.
- [ ] ⛔ **The lane assertion is per entity and the Surger joins the strong
      form.** The Drifter gets `2 * DT / C.DRIFT_CROSS_TIME`, derived from the
      constant and not picked. Every other entity in the build gets `Object.is`
      equality with its spawn lane except the Vaulter, which keeps
      `2 * DT / C.VAULT_HOP_TIME`. **Mutation-checked:** a Drifter cross that
      wraps instead of folding turns it red where a range check would not.
- [ ] §17 item 1 re-verified with the new draws: same seed and recorded input ⇒
      identical hash after 10,000 ticks, twice in one process and once across
      two. The hash covers a Drifter's phase and a Surger's phase.
- [ ] ⛔ `scratchpad/test-registry.js`: `enemies` 4 → 6, `enemyKinds` 5 → 9. Two
      counts, two different amounts, raised in the phases that land them.
- [ ] 20 seeded runs to game over on a six-kind list, no exception, no stuck run.
- [ ] ⛔ **Not one line of `test-cs003-p5.js` or `test-cs004-p5.js` is edited.**
      Asserted by `git diff --stat` at the close.
- [ ] `node build.js` and `node scratchpad/run-all.js` green, zero skips.
- [ ] `STATUS.md` reset to CS006, `log/CS005.md` written, planning docs archived.

---

## ⛔ Scope boundaries — what this changeset does NOT touch

**No `laneState`.** `drawWell()`'s parameter stays unwired and the Surger's
telegraph is an entity draw. Settled in CS004's scope check, re-confirmed here
against the shipped renderer. CS006.

**No `C.DEBUG_SPAWN_KINDS` tuning.** ⛔ It is a bench, not a difficulty knob. It
still ships as `["vaulter"]`. Adding the two new kinds to the *shipped* value
would be tuning the game by editing a debug constant, which the constant's own
header forbids. Tests set their own list, as CS004's do.

**No heat, no introduction schedule.** Every constant here is flat. The Drifter
does not wait for L9 and the Surger does not wait for L13. ⛔ No second clock.
CS006.

**No cargo weights.** §8's "Carrier cargo weights shift toward Drifter/Surger"
is heat. The `CARGO` table becomes three rows; it does not become a weighted
draw. CS006.

**No scoring.** `PTS_DRIFTER` and `PTS_SURGER` stay unread. ⛔ `addScore()` is
CS007's single entry point and the way to protect that is not to build a second
one. §7's Drifter row scores 250/500/750 *by depth*, which is the first scoring
rule in the game that needs a band lookup — CS007's problem, and worth knowing
it is coming.

**No fix for the spawner stall.** `updateSpawner()` still counts everything in
`state.enemies` against `ENEMY_CONCURRENT`. ⛔ CS005 does not make it reachable
(see hazards) and the answer is a design call that belongs to the changeset that
does. CS006.

**No Dive.** §4.5's fifth death condition still has nothing to attach to.
`WELL_CLEAR_HOLD` still runs. CS006.

**No `tools/glow-lab.html`.** ⛔ It exists to tune the **global** glow constants
against a busy frame. CS005 changes none of them — both Drifter states are
per-entity multipliers — so the lab is not on this changeset's critical path,
and building it would be the largest single item here, competing with two
enemies for the phase budget. The ⛔ it would have served is covered instead by
the three-channel separation gate and by debug keys `5` and `6`. The lab stays
unbuilt and unowned; whichever changeset takes the art pass owns it.

**No answer to `throatOffset` or the degenerate Flat well.** Neither is an enemy
question. Both are design calls for Paul, carried in `STATUS.md`, landing spot
CS006.

**No change to `entityPoints()`, `glowStroke()`, `drawPoly()` or `spawnEnemy()`.**
All four are load-bearing for entities that already ship, and none of them needs
anything CS005 wants. ⛔ If a phase finds itself editing one, that is the signal
to stop and surface it, not to proceed carefully.

**No HUD, no audio, no fragmentation, no Overdrive.** Unchanged from CS004.

---

## Known hazards

**⛔ `killDepth = 0` on a climbing enemy is a death from the throat.** Finding 1.
This is the changeset's headline hazard and it is written into the build's own
comments today. The phase prompt has to say why the shipped comments are wrong,
not just what to write instead.

**⛔ A snapped-at-spawn Drifter turns three closed test files red.** Finding 3.
The birth model is not a preference; it is the only shape that keeps
`test-cs004-p1.js`, `test-cs004-p2.js` and `test-cs004-p5.js` passing untouched.
Any P2 that "simplifies" the birth into a constructor snap will discover this by
breaking a changeset that closed a week ago.

**⛔ An armoured Drifter holds a concurrency slot the player cannot free — and
this is the Thorn stall's shape, not the Thorn stall itself.**
`updateSpawner()` blocks on `state.enemies.length >= min(ENEMY_CONCURRENT,
ENEMY_CAP)`, and `ENEMY_CONCURRENT` is 3. A riding Drifter is unshootable. Three
riding Drifters would hold the spawner shut for `C.DRIFT_RIDE_TIME`.

⚠ **It is self-resolving and the Thorn is not**, for two reasons that are both
design decisions rather than luck: a Drifter crosses on a fixed cadence, so the
window is bounded by `DRIFT_RIDE_TIME`; and ⛔ **it climbs in both phases**, so
it reaches the rim and forces a resolution either way. A Thorn does neither.

⛔ **CS005 does not make the Thorn stall reachable.** The stall needs Thorns,
which need Weavers, which need `C.DEBUG_SPAWN_KINDS` to name one — it does not,
and CS005 adds no Thorn source. Not fixed here. But CS006 inherits one new input
for its design call: *does the concurrency budget count threats or entities?*
now has a second entity that is temporarily neither.

⛔ **`DRIFT_RIDE_TIME` is the armour budget, and it is the knob if the Drifter
feels cheap.** At 0.85 s riding and 0.45 s crossing it is shootable about a
third of the time. Raising it is the fastest way to make an enemy the player
cannot answer.

**⚠ A riding Drifter shields two lanes.** `collideShots()`'s `break` is
unconditional, so a declined shot still costs its resolution for the steps of
overlap — the Weaver bolt's shipped note, which explicitly predicts this. A
boundary is within `HIT_LANE_TOL` of two lane centres, so the shielding applies
to shots in both. About three steps against eight shots in flight and a 0.055 s
cooldown. ⛔ Not a bug, and ⛔ do not make that `break` conditional to "fix" it —
it is load-bearing for the Carrier's split and for §4.2's chip economy as well.

**The Surger's telegraph is the same shape as a Thorn, in nearly the band's own
hue.** Both are bright segments rooted at the throat. `THORN_COLOR` is `#A98CFF`
(cool violet) and `SURGER_COLOR` is `#9AF0FF` (pale cyan) — and §8.1 introduces
Surgers at L13, still inside the cyan band (levels 1–16). Motion separates them:
one grows over 0.45 s and vanishes, one is static and permanent. ⚠ Both colours
are provisional. Playtest ask, not a blocker.

**⛔ Nothing opaque below `C.READABILITY_DEPTH` — and the telegraph is exempt for
the Thorn's reason.** §10.3 governs what may be drawn *over* the throat zone:
explosions, particles, popups. A telegraph is not drawn over the well, it **is**
lane geometry, and the player must be able to see which lane is arming from the
moment it starts. Full alpha at every depth, exactly as the Thorn has it. Do not
apply `shotAlpha()` to it.

**Two entities within `HIT_DEPTH_TOL` resolve in array order, not depth order.**
⚠ SETTLED in CS003 for the replay guarantee. More reachable now — a boundary
Drifter overlaps two lanes' worth of traffic. No change; do not add a depth sort
to the hot path.

**A Drifter and a Surger can share a lane, and one of them is invisible to
`laneCrowded()` half the time.** `laneCrowded` reads `depth > READABILITY_DEPTH`
as "not crowding", the same as it does for a grown Thorn. A boundary Drifter
below 0.25 crowds two lanes at once, narrowing `pickSpawnLane`'s options. With
`SPAWN_LANE_TRIES` 4 and settle-for-last it cannot stall. ⚠ Noted, not fixed.

**The `Enemy` base is still a slope, and this changeset is the test of it.** ⛔
CS005 adds **no field and no behaviour** to the base. If a phase finds itself
wanting to put a climb rate or a phase enum in there, GDD §6.5 says what that
means: flatten the base back to independent classes, do not add a field to
switch the behaviour off.

---

## Assumptions and decisions

| # | Decision | What would change it |
|---|---|---|
| 1 | ⛔ The Drifter's `killDepth` is `1 - C.RIM_CONTACT_DEPTH`, not `0`; §4.5 item 2 means "no safe phase", not "no safe distance" | Paul reading item 2 the other way. Under `0`, `collideSkimmer` as written kills from the throat on the spawn step — so the alternative is not "use 0", it is "give the Skimmer a depth", which is CS006/CS011 work and building ahead. If the Dive or Jump ever lands a Skimmer depth, lowering this to `0` is one line |
| 2 | ⛔ `laneHop` gains optional fold bounds rather than the Drifter getting its own hop helper | A second mirror-fold is the one piece of math this build must not have twice — `RATIONALE.md#depth-model` says exactly that about its analogue. If a third lattice ever appears, that is the moment to extract a `laneFold` and make `laneHop` a wrapper |
| 3 | ⛔ A Drifter is born at a lane centre and crosses onto the lattice, rather than snapping in its factory or teaching `spawnEnemy` about half-lanes | Verified, not preferred: a snap turns three closed test files red. It also happens to give the best read — the entity emerges visibly vulnerable at the depth where the player has the most time. If those tests ever change shape, the snap is still the worse option for the second reason |
| 4 | The birth cross does **not** go through `laneHop` | Folding an off-lattice start about the lattice bounds overshoots by a lane and a half, which the soak would read as a teleport. `boundaryFrom` is six lines and it is where `well.closed` is read, so nothing in `07-enemies.js` learns the topology |
| 5 | ⛔ The Drifter climbs in **both** phases | It removes the "unshootable entity parks forever" failure by construction rather than by tuning, and it makes the lane speed one number for the soak. If riding-without-climbing turns out to look better, the hazard comes back and `DRIFT_RIDE_TIME` becomes load-bearing rather than merely important |
| 6 | ⛔ The Surger's discharge is a mutated `killDepth`, not an eighth contract field | It is the value the field was designed to express, and `collideSkimmer` needs no branch. If a second entity ever wants a *different* kind of lane-wide lethality, that is the moment to ask whether the field is carrying two ideas |
| 7 | ⛔ `C.SURGE_DISCHARGE < C.RESPAWN_INVULN`, asserted | §4.4's rim push cannot protect against a `killDepth = 0` entity — it lowers depth, and 0 is below everything. The invulnerability window is the only guard, so the relationship is an invariant and not a coincidence. If CS006's heat curve ever lengthens the discharge, this assertion is what catches it |
| 8 | ⛔ CS005 edits no closed changeset's test file; it writes its own soak | `CLAUDE.md`'s "a test asserts only what its own phase owns". Verified reachable: neither closed soak's board can contain a CS005 entity. If a future changeset genuinely cannot avoid it, the rule to preserve is that the *existing* assertion is never weakened — add a case, never widen a bound |
| 9 | The Surger joins the **strong** lane assertion rather than needing a bound | It never hops, so exact equality is available and it is both stronger and simpler. Only the Drifter needs a new `MAX_LANE_STEP`, derived from `C.DRIFT_CROSS_TIME` |
| 10 | ⛔ `tools/glow-lab.html` is not built, and the ⛔ it would have served becomes a headless separation gate | The lab tunes **global** glow constants and CS005 touches none. If the first art pass finds the per-entity multipliers fighting the globals, that is the pass that owns the lab. The gate is the durable half either way — an eyeball verdict does not survive a retune |
| 11 | The Drifter's two states are two polys plus width and alpha, not one poly restyled | §12's prompt string is `SOLID = ARMOURED · OPEN = VULNERABLE`, which is a silhouette statement, and §6.3 says "bloomed **open**" — they agree. One poly drawn closed then open loses a single edge, which is not a read at a glance |
| 12 | Glyphs are miniatures of their cargo's own gesture | It makes cargo-reading learnable rather than memorised, which is §6.2's stated point. If a playtest says the three are not separable at throat depth, the rule survives and the shapes change — the alternative (colour-coding the glyph) is an art call `14-render-entities.js` already flags and defers |
| 13 | ⛔ All glyphs stay open paths in plain arrays | `test-cs004-p2.js:440` asserts the array shape. A `{poly, closed}` reshape would edit a closed changeset's test to buy a distinction the three shapes can carry without it |
| 14 | Two debug keys, on digits `5` and `6`; the cargo variants get none | One key per roster row. The bench has six keys and the roster has six rows; pressing `2` to see a hull and a glyph is what the bench is for. If CS011 wants more, collapse to select-and-spawn — but not before, because a direct key is faster to use |
| 15 | One changeset, five phases; the seam if it splits is after P2 | The three reasons to split — geometry, closed-test edits, a ⛔ rendering rule — measured smaller than expected on inspection. If P2 overruns a session, split there and renumber; `ROADMAP.md` says renumbering is cheap and has already absorbed one sweep |
| 16 | CS005 does not touch the spawner stall, and says so rather than silently not doing it | It is not reachable from anything CS005 ships. If CS006's heat pass finds the riding Drifter changes the answer to "threats or entities?", that is a finding for CS006, and `STATUS.md` carries the input |
| 17 | No `state` fields, so `STATE_FIELDS` gets no `CS005` key | If P2 finds the Drifter needs run state, that is a finding about the movement model, not about the contract — surface it |
| 18 | ⛔ The `Enemy` base gains nothing | Two entities landing with no contract change is the strongest evidence CS003's spine is right. If either one cannot be expressed in the seven fields, stop and surface it rather than adding an eighth quietly |