# Vector Vortex — Game Design Document

**Version:** 0.2.0 (draft for review)
**Date:** 2026-08-30
**Supersedes:** v0.1.0, which was written without access to the Orbital Overhaul codebase and got five things wrong. See §22.
**Status:** Pre-spec. This document is the source from which numbered spec files are generated.
**Genre:** Tube shooter (arcade, wave-based)
**Platform:** Browser, Canvas 2D + Web Audio, vanilla JS, zero runtime dependencies
**Deployment:** coinlessgames.com
**Series:** Standalone original title

---

## 0. How to read this document

Modelled on Orbital Overhaul's §0 read contract. A future session reads §0 + §1 always, then the sections its phase names.

| § | Section | Read it when you are touching… |
|---|---|---|
| 1 | Concept and pillars | Anything. Arbitrates ambiguity. |
| 2 | Core loop | Pacing, flow, state machine |
| 3 | The Well — geometry | Level shapes, rendering, the depth model |
| 4 | The Skimmer | Player movement, firing, Purge, lives |
| 5 | The Dive | Between-level sequence, Thorn hazard |
| 6 | Enemies | Any entity, spawning, AI |
| 7 | Scoring | Points, bonuses, extra lives |
| 8 | Difficulty | The heat clock, introduction schedule |
| 9 | Controls | Any input path |
| 10 | Visual design | Rendering, glow, HUD, readability |
| 11 | **Audio** | Music, SFX, the intensity director |
| 12 | Onboarding | Prompts, attract mode, first-run |
| 13 | Modes | Classic vs Overdrive gating |
| 14 | **Overdrive proposal** | Any Overdrive feature; read before building one |
| 15 | Meta systems | Profiles, scores, leaderboard, achievements, telemetry |
| 16 | Technical architecture | Build shape, file layout, entity contract |
| 17 | Testing | Any test |
| 18 | Legal safety | Naming, art, copy — anything player-visible |
| 19 | Acceptance criteria | Closing a phase |
| 20 | Assumptions and decisions | On demand |
| 21 | Open questions | Before starting a blocked spec |
| 22 | What changed from v0.1.0 | On demand |

**Markers**, same meaning as in Orbital Overhaul's `CLAUDE.md`:

- **⛔ INVARIANT** — violating this breaks the build, save data, or a shipped guarantee.
- **⚠ SETTLED** — this looks wrong and is not. Do not re-litigate it in the session you noticed it.

---

## 1. Concept and pillars

**Vector Vortex** is a browser arcade tube shooter. You hold the rim of a glowing geometric well while things climb out of it toward you. You rotate, fire down lanes, and decide continuously which lane deserves your attention.

An homage to Atari's *Tempest* (1981), built as original IP, with two modes selectable from the title screen at all times:

- **CLASSIC** — the 1981 design philosophy. No powerups, one panic button, escalation through enemy mix and geometry.
- **OVERDRIVE** — the *Tempest 2000* philosophy. Powerups, a vertical escape axis, combo scoring, reactive music.

One codebase. Overdrive is feature flags, not a fork.

### 1.1 Design pillars

**P1 — Control fidelity above all.** The rim is a proportional analog axis on every input device. A player must be able to whip a third of the way around the well and stop exactly on a lane. If a feature makes the rim feel less precise, the feature loses.

**P2 — The threat is legible before it is lethal.** Every enemy announces itself by silhouette, colour, motion, and sound, at a depth where the player can still act. Nothing obscures the throat.

**P3 — Escalation you can name.** Difficulty rises continuously from one clock, but every new *kind* of threat arrives at a specific, learnable level.

**P4 — Pacing has a heartbeat.** Every well ends in a dive: a few seconds of release with a small skill test attached.

**P5 — Every added music layer is a part, not a texture.** See §11.4. This pillar exists because Orbital Overhaul's intensity layering failed on exactly this point.

---

## 2. Core loop

```
  [ READ ] ──► [ ROTATE ] ──► [ FIRE ] ──► [ TRIAGE ]
   what's        to the        down the     which lane
   climbing      threatened    lane, lead   is next
   and where     lane          the target        │
       ▲                                         │
       └────────────────────────────────────────┘
                        │
          [ WELL CLEARED ] ──► [ DIVE ] ──► next well
```

The moment-to-moment tension is **spatial triage under a movement constraint**. You occupy one lane; everything else is unattended. On a closed well, wrap distance is a resource. On an open well, the ends are walls — the corners are both trap and fortress.

Macro loop: **survive → clear → dive → escalate.**

---

## 3. The Well

### 3.1 Vocabulary

⛔ **These are the only terms used, in prose, docs, player-facing strings, and code identifiers.** Atari's terms appear in the right column for translation and nowhere else in the repo. A variable named `flipper` is a legal exposure, not a style problem (§18).

| Our term | What it is | (Atari's, never used) |
|---|---|---|
| **Well** | The tube the player defends | Web / tube |
| **Rim** | The near edge, where the player sits | Rim / top |
| **Throat** | The distant vanishing aperture | Bottom / centre |
| **Lane** | One segment running rim→throat | Segment |
| **Depth** | Normalized position, 0 = throat, 1 = rim | — |
| **Skimmer** | The player's craft | Blaster / claw |
| **Purge** | The once-per-well panic clear | Superzapper |
| **Thorn** | Static lane hazard | Spike |
| **Start Depth** | Selectable starting level | SkillStep / warp |

### 3.2 ⛔ The depth model

**Every entity's position is `(lane, depth)`, never a screen coordinate.** `lane` is a float in lane units; `depth` is a float in `[0,1]`, 0 at the throat, 1 at the rim.

Screen position is derived at render time only:

```
screenPos(lane, depth) = lerp( throatVertex(lane), rimVertex(lane), perspective(depth) )
perspective(d) = Math.pow(d, PERSPECTIVE_EXP)   // ~0.55; lower = more rush
```

Consequences: collision is a 1-D overlap on `depth` plus a lane match, with no trigonometry in the hot path; every well shape shares one code path; adding a shape is adding data; and the whole simulation runs headless with no canvas.

This is the analogue of Orbital Overhaul's wrap-aware `dist2`/`angleTo`/`shortDelta` rule — the one piece of math that, done naively, produces subtle bugs everywhere.

### 3.3 Well data

```js
{ id, name, closed, lanes, rim: [{x,y}, ...], throatScale, throatOffset }
```

The throat is the rim polygon scaled toward its centroid. This makes the figure-eight work with no special case: its throat is a smaller figure-eight, lanes cross correctly, and no code notices.

### 3.4 The sixteen wells

| # | Name | Topology | Lanes | Character |
|---|---|---|---|---|
| 1 | Ring | Closed | 16 | The teacher |
| 2 | Box | Closed | 16 | Corners compress lanes visually |
| 3 | Cross | Closed | 16 | Deep inlets; enemies vanish and reappear |
| 4 | Bowtie | Closed | 14 | Pinch between lobes = chokepoint |
| 5 | Pinwheel | Closed | 16 | Rotational skew, uneven lane widths |
| 6 | Delta | Closed | 15 | Three flats, three sharp corners |
| 7 | Clover | Closed | 16 | Wrap feels longer than it is |
| 8 | **Vee** | **Open** | 13 | First open well; teaches the corner |
| 9 | **Stair** | **Open** | 12 | Uneven lane lengths; depth cues vary |
| 10 | **Trough** | **Open** | 14 | Long flat bottom, two walls |
| 11 | **Flat** | **Open** | 12 | Purest open-well tactics |
| 12 | Heart | Closed | 16 | The top notch is a real hazard |
| 13 | Star | Closed | 16 | Alternating deep/shallow |
| 14 | **Double-Vee** | **Open** | 14 | Three defensible positions |
| 15 | **Fan** | **Open** | 11 | Fewest lanes; every one matters |
| 16 | Twist | Closed | 16 | Figure-eight. The signature shape. |

### 3.5 ⛔ Open wells are not closed wells with a clamp

The open/closed flag is a tactical system:

- The Skimmer cannot wrap; `lane` clamps to `[0, lanes-1]` with a 40 ms visual squash.
- End lanes are threatened from one side only — defensible, and a trap.
- **Enemy lane-hopping must handle the wall.** A Vaulter that would hop past the end reverses.

Clamping the player but leaving enemy AI wrapping produces enemies that teleport across the well. §17 test 3 exists for this bug.

**The boundary lattice — shipped CS005 P1.** A lane *boundary* is the half-integer between two lane centres: lane `k + 0.5` is the edge shared by lanes k and k+1, and because vertex parameter is `lane + 0.5` it sits exactly **on** rim vertex `k+1` rather than being interpolated between two. ⛔ **An open well's two outermost boundaries do not exist**, and the reason is not only that `laneClamp` would refuse them: `polyAt()` clamps an open well's vertex parameter to `[0.5, n - 0.5]`, which is lane `[0, n-1]`, so lane `-0.5` and lane `n - 0.5` project to the *same points* as the lane **centres** `0` and `n - 1`. The walls are not drawable, let alone ridable — an entity placed there would be a second silhouette exactly on top of a first, which is §1.1 P2 failing. The ridable boundaries are therefore the strip's **interior** rim vertices, `lanes - 1` of the `lanes + 1` it has: a 13-lane Vee has **twelve**, at lane `0.5` … `11.5`. `laneBoundaryLo(well)` / `laneBoundaryHi(well)` return them, ⛔ as two numbers and never one object, because they are read on a per-frame path and §17's budget forbids the allocation. On a closed well there are no walls, so all `lanes` boundaries are legal and drawable and `laneBoundaryHi` is `lanes - 0.5` — which `polyAt` resolves to vertex 0, the long way round the seam.

⛔ **The fold bounds are a parameter because two lattices exist, not because `laneHop` was wrong.** `laneHop(well, lane, delta, dir, lo, hi)` defaults `lo`/`hi` to `0` and `lanes - 1`, the extreme legal positions of a lane-**centre** entity; that is correct for the Vaulter and stays correct for it forever. A boundary-rider's extreme legal positions are `0.5` and `lanes - 1.5`, and folded about the centre bounds its cross from `0.5` lands back on `0.5` — a whole vulnerable crossing window in which the entity announces itself as shootable and then does not move. ⛔ Two entities want different **bounds**, not a second helper: there is exactly one mirror-fold in this build, and duplicating it is the specific mistake `RATIONALE.md#depth-model` names. The four-argument form is pinned bit-identical to the pre-change build by a 16,856-case sweep in `scratchpad/test-cs005-p1.js`. ⚠ On a closed well `lo`/`hi` are inert — it wraps — so a caller may pass them unconditionally.

⛔ **A rider is born at a lane centre and crosses onto the lattice**, because `spawnEnemy()` is a function of `(kind, lane, depth)` and learns nothing about any entity's lattice. `boundaryFrom(well, lane, dir)` answers that first half-cross: the wrapped half-step on a closed well, and on an open one the half-step with **one reversal** if it would leave `[lo, hi]`. ⛔ It does **not** go through `laneHop` — folding an off-lattice start about the lattice bounds overshoots, and `laneHop(Vee, 0, -0.5, -1, 0.5, 11.5)` returns lane `1.5`, a lane and a half in one cross time, which a soak reads as a teleport. One reversal always suffices and is proven by exhaustion rather than asserted in a comment: only two births in a whole well can fail — lane `0` heading down and lane `lanes-1` heading up — and every shipped well is at least eleven lanes wide. ⛔ `boundaryFrom` is also **where `well.closed` is read**, so an entity riding the lattice never learns the topology, exactly as the Vaulter never does.

### 3.6 Bands and colour

`shapeIndex = (level - 1) mod 16`. Each band of sixteen recolours.

| Levels | Band | Well colour |
|---|---|---|
| 1–16 | Cyan | `#3FE0FF` |
| 17–32 | Magenta | `#FF4FD8` |
| 33–48 | Amber | `#FFB020` |
| 49–64 | Violet | `#9B6BFF` |
| 65–80 | Ember | `#FF5A3C` @ 18% |
| 81–96 | Green | `#4FFF7A` |
| 97–99 | White | `#FFFFFF` |

Past 99 the counter holds and shapes come from the seeded RNG. Heat also holds — a marathon, not an impossibility. Same shape as Orbital Overhaul's escalating-waves-forever model: there is **no win condition**, which matters for the leaderboard `outcome` enum (§15.4).

### 3.7 The dim band

Levels 65–80 render at 18% alpha; lanes light when occupied, when a shot travels them, and when a Surger charges. Full invisibility on unknown browser gamma is a P2 catastrophe. **⚠ SETTLED 2026-08-30** — the band stays at levels 65–80 and `DIM_BAND_ALPHA` 0.18 as specced; no tuning time is spent on it. Revisit only if telemetry shows a player past level 65. See §21 and `DECISIONS.md`.

---

## 4. The Skimmer

### 4.1 Movement

`skimmer.lane` is a continuous float, never quantized in the simulation. Closed wells wrap; open wells clamp.

**Snap assist.** After `SNAP_IDLE_MS` (~90 ms) with no rotation input, the Skimmer is drawn toward the nearest lane centre at `SNAP_STRENGTH`. This resolves the "am I in that lane?" ambiguity that makes clones feel imprecise. ⛔ **Never active during rotation input.**

The Skimmer renders at its continuous position and fires down the nearest lane centre. Snap assist keeps visual and mechanical in agreement.

**Shipped, CS002 P2.** Snap stops once it is within `SNAP_EPSILON` of the centre and leaves the craft there — it never rounds `lane`, which is what keeps the float continuous. Its step is capped at the remaining distance, so it cannot overshoot into an oscillation and cannot pull past the clamp at either end of an open well. Across the seam of a closed well it takes the short way, via `laneDelta`.

The open-well clamp fires a `WALL_SQUASH_MS` squash that compresses the craft along the rim and stretches it down the well. ⛔ **The squash is visual only — it never writes `lane`.** A closed well has a seam, not a wall, and never squashes.

| Property | Constant | Value |
|---|---|---|
| Width at the rim | `SKIMMER_WIDTH` | 0.9 lane widths |
| Snap idle before engaging | `SNAP_IDLE_MS` | 90 ms |
| Snap pull | `SNAP_STRENGTH` | 6.0 lane-units/s |
| Snap settle threshold | `SNAP_EPSILON` | 0.01 lane |
| Wall squash duration | `WALL_SQUASH_MS` | 40 ms |
| Wall squash depth | `SKIMMER_SQUASH` | 0.35 of width |
| Craft colour | `SKIMMER_COLOR` | `#FFFFFF` ⚠ |

⚠ **`SKIMMER_COLOR` was not specified anywhere in this document.** CS002 P2 shipped white — the craft has to be the most legible thing on screen (§1.1 P2), and white is distinct from every band colour except the 97–99 White band. It is one constant to change. Confirm or replace it.

### 4.2 Firing

| Property | Constant | Value |
|---|---|---|
| Max shots in flight | `SHOT_MAX` | 8 |
| Rim→throat travel | `SHOT_TIME` | 0.52 s |
| Fire cooldown | `SHOT_COOLDOWN` | 0.055 s |
| Auto-fire on hold | — | Yes |

Shots are lane-locked and never change lanes. A shot meeting a Thorn stops and chips `THORN_CHIP` from it. Because a stopped shot frees its slot immediately, camping a thorned lane produces a rapid chip-away effect. ⚠ **SETTLED:** that is emergent, it is in the original, and it is not a bug to smooth out.

**Shipped, CS002 P3.** A shot's lane is captured once, at fire time, from the *nearest lane centre* to the Skimmer's continuous position — the same rounding `Skimmer.snap()` targets — and never changes afterwards; rotating the Skimmer after firing leaves every shot in flight exactly where it was. Depth runs rim (1) to throat (0) over `SHOT_TIME`; a shot reaching 0 retires and frees its array slot the same step. `SHOT_LEN` (0.06 depth units) is the length of the drawn streak, faded per the readability contract (§10.3) rather than clipped outright: opaque at and above `READABILITY_DEPTH`, fading linearly to nothing at the throat. There is no collision pass yet — Thorn chipping above is not yet wired and lands with §6/§9's collision phase.

### 4.3 The Purge

One charge per well; recharges on entry, never accumulates.

- **First use:** destroys every enemy in the well. ⛔ **Does not remove Thorns.**
- **Second use, same well:** destroys exactly one enemy — the one nearest the rim, deterministically, so the player can predict it. No bonus.

The weak second use converts the Purge from a spam button into a decision. HUD shows charge as bright/dim; the second use has a distinctly feeble sound so the downgrade is *felt*.

Clearing a well with the Purge unspent awards `PURGE_SAVED_BONUS` (500).

**Shipped, CS003 P3.** `state.purgeUses` counts **up** from zero and is the whole rule — a count, not a flag, because a boolean cannot express the weak second use. `enterWell()` is the only thing that returns it to zero, so a charge carried through four wells is still one charge. Use 1 kills every enemy whose `purgeable` flag is true and leaves the others untouched — the flag is read off the entity, never a class name, which is why "does not remove Thorns" costs no special case here. Use 2 kills exactly one: highest `depth`, then lowest lane, then array order, all three deterministic so the player can predict the victim. Use 3 and later do nothing, though the count keeps rising so a HUD can tell *spent* from *spent twice*. ⛔ `input.purge` is a **level** — all four devices write a held boolean (§9.5) — so the edge is detected in the game against `state.purgeLatched` ("held last step"); holding the button spends exactly one charge. The Purge resolves *before* the collision pass, so a charge spent on the step an enemy arrives in your lane actually saves you. No bonus is awarded yet: `PURGE_SAVED_BONUS` waits for `addScore()` in CS007, and reads `purgeUses === 0`. **CS003 P4 added one rule to the edge:** death forces `purgeLatched` true, so a Purge held across the death freeze needs a genuine release before it can spend the new well's charge — see §4.4.

### 4.4 Lives

Start 3. Extra life at 20,000 then every 40,000. Reserve cap 6; awards past the cap are lost with a distinct sound, never silently swallowed. Death: 1.2 s hit-stop, fragmentation, respawn in the same lane with `RESPAWN_INVULN` 1.5 s. ⛔ **Enemies at the rim are pushed to `depth = 0.55` on respawn** so the player is never killed on re-entry.

| Property | Constant | Value |
|---|---|---|
| Starting reserve | `START_LIVES` | 3 |
| Reserve ceiling | `LIVES_MAX` | 6 |
| Death freeze | `HIT_STOP_DEATH` | 1.20 s |
| Respawn invulnerability | `RESPAWN_INVULN` | 1.5 s |
| Respawn push depth | `RESPAWN_PUSH_DEPTH` | 0.55 |
| Respawn blink rate | `INVULN_BLINK_HZ` | 6 full cycles/s |

**Shipped, CS003 P4.** `killSkimmer()` (`09-collision.js`) is the one death route and owns the whole sequence — the invulnerability guard, the life, the `purgeLatched` force, the freeze, and the stop — so the four death conditions still to come inherit all of it without writing any of it — CS004 added item 4 (the Weaver's bolt), CS005 added items 2 and 3 (the Drifter and the Surger), and CS006 adds item 5 with the Dive. The **respawn is not in it**, and that is deliberate: `Game.update()` does not run during hit-stop, so anything scheduled at death sits unadvanced for the whole 1.2 s. The trigger is the state itself — the first live step that finds `skimmer.dead` respawns, in `respawnSkimmer()` (`23-main.js`), which also makes the sequence correct for a headless caller that drives `update()` directly and never freezes at all. `state.invulnTime` counts **up** and is born **at** `RESPAWN_INVULN`, already expired: ⛔ a fresh run is never invulnerable, and contact on the first step of a run kills. The aging is the *else* branch of the respawn check, so the window is exactly `RESPAWN_INVULN` rather than one step short of it. The blink is a draw-time decision only (`skimmerBlinkVisible()`, which takes the timer and not `state`) — the craft is fully simulated on the frames it is not painted, because a control dropout is pillar P1's one unforgivable failure.

⚠ **SETTLED — Paul, 2026-08-30. The rim push is a CLAMP over every lane, not a band at the rim.** Everything above `RESPAWN_PUSH_DEPTH` comes down to it, in every lane. This is deliberately broader than the wording above requires: the narrow reading leaves a Vaulter at 0.9 climbing back into the kill band well inside the invulnerability window, which is the exact death the rule exists to prevent. A clamp is also monotonic — it can never move an entity *toward* the rim. **Do not narrow it back.** At `VAULT_CLIMB` 0.18 the climb from 0.55 outlasts `RESPAWN_INVULN`; that guarantee stops being provable the moment CS006's heat curve raises the climb rate, and re-checking it is part of that phase.

⚠ **SETTLED, second half — Paul, CS004 P1.** The clamp applies to every entity whose `depth` is a **position**, and skips those whose `depth` is a **length** — §6.5's `anchored` field. ⛔ This is **not** a narrowing of the band above: everything above `RESPAWN_PUSH_DEPTH` still comes down to it, in every lane, on every entity the clamp means anything for. It is about *which entities*, not *how far down*. Clamping a length is not a push but a free chip — the Thorn is an extent rooted at the throat, so an unconditional clamp would silently shorten every Thorn past 0.55 on every player death, in the one place nobody would look. Every enemy that existed when this landed is `anchored = false` and is unaffected.

Zero lives sets `screen = "gameover"`, which is a ⛔ **stop, not a screen**: `Game.update()` returns early above everything, so no clock, no spawner, no entity pass, no collision and no level advance run, while `draw()` is untouched and the board the player died on stays up. CS007 owns the game-over UI, the submission and the real restart flow. Nothing awards an extra life yet — `EXTRA_LIFE_FIRST`, `EXTRA_LIFE_EVERY` and `LIVES_MAX` are `addScore()`'s in CS007 and are deliberately unread.

### 4.5 Death conditions

The complete list. No chip damage, no health bar.

1. An enemy reaching the rim in your lane and making contact.
2. Contact with a Drifter, any depth.
3. Being in a Surger's lane when it discharges.
4. A Weaver's projectile.
5. A Thorn during the Dive.

**Shipped, CS003 P3.** Condition 1 is live, as the one collision pass in `09-collision.js`. ⛔ **Collision is 1-D**: a lane match within `HIT_LANE_TOL` (half a lane either side, via `laneDelta` so a Ring's seam is a neighbourhood and not a fifteen-lane gap) plus an overlap on `depth`. No trigonometry, no screen coordinates, no distance in pixels — a hit test that read a projected point would pass at the rim and fail at the throat, because `perspective()` is not linear. The pass runs once per step in a fixed order (shots against enemies, then enemies against the Skimmer, each front to back), after the entity pass and before the end-of-frame filters; nothing in it splices an array. An enemy kills by contact when its `killDepth` is a number, its `depth` has reached it, and its lane matches — `killDepth === null` means contact never kills, which is the Weaver's body. Shots ask `enemy.onShot(shot)` and the *enemy* decides what a hit does; ⛔ one shot resolves against at most one enemy per step, whether or not that enemy consumed it. Death itself is one call to `killSkimmer()`, which today sets `skimmer.dead` and nothing else — lives, hit-stop, respawn and the game-over stop are CS003 P4's, in that one function.

**Shipped, CS004 P3 — condition 4, with no new collision code.** A Weaver's bolt is `class WeaverBolt` in `07-enemies.js`, an ordinary entity in the one array whose `killDepth` is `1 - C.RIM_CONTACT_DEPTH` — the same expression the Vaulter and the Carrier use. That is the whole of it: the pass above already asks every entity for its `killDepth`, so a second death condition cost three field writes and not one branch. ⛔ The Weaver's own body is the roster's first `null` `killDepth` and never kills, at any depth *including the rim*; §4.5 lists the projectile, and a Weaver sitting on top of the Skimmer is a nuisance. ⚠ That is going to look wrong the first time it is seen and it is correct.

⛔ **The bolt dies at `depth 1` on the step AFTER it arrives, and the ordering is why.** `Game.update()` runs the entity pass, then collision, and `collideSkimmer()` skips anything already `dead` — killing it on the step its depth reaches 1 would make the rim step silently non-lethal. The lethal band starts nine steps earlier, so this is belt and braces, written so the belt does not depend on the braces.

**Shipped, CS005 P2 — condition 2, and ⛔ its `killDepth` is the rim band and NOT `0`.** The Drifter's is `1 - C.RIM_CONTACT_DEPTH`, the same expression the Vaulter, the Carrier and the bolt use. ⛔ **Zero is not a stricter reading of this line, it is a different mechanic.** `collideSkimmer()` is `e.depth >= e.killDepth` plus a lane match and has **no term for where the Skimmer is**, because the Skimmer is always at depth 1 — so `killDepth = 0` does not say "kills on contact at any depth", it says every legal depth is a kill zone. `pickSpawnLane()` draws a lane with no reference to the player and `updateSpawner()` releases at depth 0, and `spawnEnemy()`'s safe-spawn rule only ever *lowers* a depth, which is still lethal at zero: a Drifter released into the player's lane would kill them **on the spawn step, from the throat, having travelled nowhere.** Frequent, free, and exactly the death §6.3's ⛔ exists to prevent. **Item 2's "any depth" means there is no safe *phase*** — a Drifter kills you while it is armoured, so you can neither shoot it nor touch it, where the Weaver has no lethal phase at all and the Thorn none outside the Dive. That is the distinction the condition is listed separately for. ⚠ Zero becomes honest the moment the craft can leave the rim (§5's Dive, §14.2's Jump) and this pass has two depths to compare; it is then a one-line change, and ⛔ building a Skimmer `depth` now to make it honest early is building ahead. Two shipped comments predicted `0` — `07-enemies.js`'s base class and `09-collision.js`'s `collideSkimmer` header — and CS005 P2 corrected both in the commit that landed the entity.

**Shipped, CS005 P3 — condition 3, as a MUTATED `killDepth` and still no new collision code.** The Surger's `killDepth` is the rim band while it climbs and through its whole telegraph, and exactly `0` for the `SURGE_DISCHARGE` window — at which point `e.depth >= e.killDepth` is unconditionally true and the only remaining term in the pass is `laneHit()`, which is this item's wording verbatim. ⛔ **That is the contract paying out, not a loophole in it:** the field was always "the depth at or past which contact in your lane is lethal", and a discharge is that depth being the whole lane for a moment. `Game.update()` runs the entity pass before the collision pass, so a Surger that enters its discharge on step *n* is lethal on step *n*. ⚠ **Zero is wrong on the Drifter and right here**, and both for the same reason: there it would be a permanent property of a climbing enemy, here it is a window the player was given a 0.45 s fuse to leave. ⛔ **The lane is never lethal during the telegraph** (§6.3), and the Surger keeps the rim band the rest of the time — so it is the roster's only entity that kills by **two** of these five conditions.

⛔ **Condition 5 is still unwired, and it is not a `killDepth`. The Thorn's stays `null` forever**: §4.5 item 5 is "a Thorn *during the Dive*", and the Dive is its own sequence with its own rule — CS006's — not a band at the rim. A future session that "finishes" the Thorn by giving it a `killDepth` makes standing still in a thorned lane fatal, which is not the rule this line describes.

### 4.6 Start Depth

Options 1, 3, 5, 7, 9 on a first run; thereafter the highest level ever cleared by that profile, snapped down to odd, capped at 81.

```
startBonus(d) = round100( 800 * Math.pow(d - 1, 1.6) )
```

| Depth | 1 | 3 | 5 | 7 | 9 | 17 | 33 |
|---|---|---|---|---|---|---|---|
| Bonus | 0 | 2,400 | 7,400 | 14,300 | 22,300 | 67,500 | 191,700 |

This is the original's SkillStep, credited as the first selectable difficulty in a commercial game. It solves onboarding by letting players trade safety for score legibly — doubly valuable for a browser player with no coin invested.

⛔ **No countdown timer on the Start Depth screen.** It waits. House rule.

**RESOLVED 2026-08-30** — the Start Depth bonus counts toward the submitted score, and `start_depth` ships as a registered stats field. See §21 and `DECISIONS.md`.

---

## 5. The Dive

On clearing a well, the Skimmer flies down the throat into the next. `DIVE_TIME` 2.6 s in Classic.

Remaining Thorns are the hazard. The player can rotate and must thread between them. Striking one costs a life and repeats the dive, not the well.

⛔ **In-flight shots are cleared at dive start.** Inherited from the original and deliberately unfair in a teachable way: a Thorn you were about to destroy is still there. The lesson is "clear thorns before the last enemy." ⚠ **SETTLED — do not fix this.**

Camera widens, music drops to its foundation layer (§11.5), a rising doppler sweep plays. It should feel like exhaling.

In Overdrive the Dive becomes a ring-flight — §14.5.

---

## 6. Enemies

### 6.1 Roster

| Enemy | Silhouette | First | Movement | Kills by | Killed by | Points |
|---|---|---|---|---|---|---|
| **Vaulter** | Flattened X | L1 | Climbs; vaults lanes from L2; hunts at rim | Contact / grab | Any shot, Purge | 150 |
| **Carrier** | Hollow diamond + cargo glyph | L3 | Slow, one lane, never hops | Contact | Any shot — **splits** | 100 |
| **Weaver** | Open spiral | L5 | Climbs partway laying a Thorn, retreats; fires down-lane | Its projectiles | Any shot, Purge | 50 |
| **Thorn** | Bright lane segment | L5 | Static | Only during the Dive | ⛔ Shots only | 5/chip |
| **Drifter** | Tumbling spark cluster | L9 | Rides lane *boundaries* (invulnerable); crosses lanes (vulnerable); homes near rim | Contact, any depth, instant | Shots only while crossing; Purge anywhere | 250/500/750 by depth |
| **Surger** | Zigzag bar | L13 | Climbs; periodically electrifies its whole lane | Discharge in your lane | Any shot, Purge | 200 |

**Shipped, CS003 P1, CS004 and CS005. ⛔ All six: the Vaulter, the Carrier, the Weaver, the Thorn, the Drifter and — CS005 P3 — the Surger. The Classic roster is complete.** The other two Carrier variants (§6.2) are CS005 P4's, and they are cargo rows rather than roster rows.

⚠ **None of them is introduced on a schedule yet.** GDD §8.1's table is CS006's, so until it lands the interval spawner releases whatever ⚠ `C.DEBUG_SPAWN_KINDS` lists — which ships as `["vaulter"]`, so a played build is a Vaulter build. The Carrier does not wait for L3 and the Weaver does not wait for L5 because there is nothing yet that could make them.

| Property | Constant | Value |
|---|---|---|
| Silhouette width | `VAULTER_SIZE` | 0.70 lane widths |
| Colour | `VAULTER_COLOR` | `#FF4A4A` ⚠ placeholder |
| Climb rate | `VAULT_CLIMB` | 0.18 depth/s (throat→rim ≈ 5.5 s) |
| Mid-climb hop interval | `VAULT_INTERVAL` | 2.20 s |
| Rim hunt hop interval | `VAULT_RIM_INTERVAL` | 0.55 s |
| Lane crossing time | `VAULT_HOP_TIME` | 0.28 s |
| First vaulting level | `VAULT_FIRST_LEVEL` | 2 |

⚠ `VAULTER_COLOR` has the same standing as `SKIMMER_COLOR` in §4.1 — no enemy palette is specified anywhere in this document, and CS003 P1 picked one so the enemy could be drawn. Confirm or replace it.

The climb is **monotonic and stops at the rim**; `depth > 1` is not a legal position, and letting it run past would leave every downstream depth comparison (`killDepth`, the readability zone, the respawn push) reading a number no other system can produce. It kills by contact at `killDepth = 1 - RIM_CONTACT_DEPTH` — ⛔ expressed that way rather than as a second constant, so retuning the band moves this and every later rim-contact enemy together. `lane` is **continuous through a hop**, interpolated over `VAULT_HOP_TIME`, so the craft really is hittable in both lanes it is near for the whole crossing; landing is written exactly rather than as the last interpolated step, or the drift would compound hop by hop. ⛔ **Every hop goes through `laneHop()` and the `dir` it returns is written back** — an enemy that keeps its own heading grinds against an open well's end forever. Nothing in the Vaulter reads `well.closed`; the topology lives entirely inside `laneHop`/`laneDelta`/`laneNormalize`, which is the only reason it behaves on a Ring and on a Fan without a branch.

Two timing details that look like polish and are not. The hop timer advances **during** a hop, so hop *starts* are one interval apart rather than interval-plus-crossing. And arriving at the rim resets the timer, so the first hunt hop lands a full `VAULT_RIM_INTERVAL` after arrival — otherwise whatever phase the climb's 2.2 s clock happened to be in decides whether the Vaulter lunges the instant it surfaces, which is an arrival that is sometimes fair and sometimes not for a reason the player cannot see (§1.1 P2).

⚠ A rim Vaulter hunts the Skimmer's *continuous* lane, so a player parked between two lane centres has it hopping back and forth across them. It is lethal either way — contact tolerance is half a lane — and this section says only "direction from `laneDelta`". Flagged for CS006's tuning pass in case the jitter reads as indecision rather than menace.

**Shipped, CS004 — the three new rows, and what each one actually is.**

| Enemy | Constants it shipped with |
|---|---|
| **Carrier** | `CARRIER_SIZE` 0.80, `CARRIER_GLYPH_SIZE` 0.34, `CARRIER_CLIMB` 0.11 (throat→rim ≈ 9 s), `CARRIER_COLOR` ⚠ |
| **Weaver** | `WEAVER_SIZE` 0.62, `WEAVER_CLIMB` 0.22, `WEAVER_RETREAT` 0.34, `WEAVER_APEX` 0.55, `WEAVER_APEX_HOLD` 0.35, `WEAVER_BOLT_SPEED` 0.32, `WEAVER_BOLT_SIZE` 0.30, `WEAVER_COLOR` / `WEAVER_BOLT_COLOR` ⚠ |
| **Thorn** | `THORN_CHIP` 0.08, `THORN_MAX` 1.00, `THORN_TIP_LEN` 0.05, `THORN_COLOR` ⚠ |

⚠ **The whole enemy palette is provisional**, the same standing as `SKIMMER_COLOR` and `VAULTER_COLOR`: this document specifies none, and CS004 P1 picked all six as ONE SET against the constraint that an enemy colour must read against all seven band colours (§3.6), because the well cycles and the enemies do not. The first art pass owns them and still wants `tools/glow-lab.html`, which does not exist.

⛔ **The Carrier and the Weaver touch no lane helper at all**, and "one lane, never hops" is therefore an absence of code rather than a flag. CS004 P5's soak asserts the strong form — exact lane equality on every tick, on every well — because that is what an entity with no lane arithmetic in it makes available, and because a range check does not catch §3.5's wrapping bug (a hop that wraps a 13-lane strip lands inside `[0, 12]`).

**The Weaver's cycle is a phase string and one up-counting timer** — climb to the apex, hold, retreat faster than it arrived, repeat — and it should be nameable by a player watching it. ⛔ `fired` is a per-**cycle** latch and not a cooldown; the bolt goes out on the FIRST step of the hold, so the player reads it while its parent is still visibly at the apex. A Weaver that arrived *above* the apex turns around from where it is rather than teleporting down to the line, which matters because CS006 makes `WEAVER_APEX` heat-derived and will move it under live entities.

**The Thorn is four flags and an `onShot`.** ⛔ `purgeable = false` (§4.3), ⛔ `blocksClear = false` (§5), `killDepth = null`, ⛔ `anchored = true` (§6.5). `update()` does nothing. A shot stops at its tip, chips `THORN_CHIP` and is **consumed**; a Thorn chipped to zero or below dies. ⚠ **The rapid chip-away under held fire is §4.2's settled emergent behaviour** — a consumed shot frees its `SHOT_MAX` slot the same step, so camping a thorned lane chips fast. Do not rate-limit it.

⛔ **A Weaver GROWS its Thorn and never drops a finished one.** `layThorn()` runs every step of the climb, tracks the tip to the Weaver's own depth, clamps at `THORN_MAX`, and ⛔ **only ever grows** — the cycle sends the Weaver back to the throat, so an unconditional write would saw the segment down again on the second climb. ⛔ It **adopts** a live Thorn already in its lane rather than standing a second one up: two overlapping Thorns are two hit-point pools behind one silhouette, which is §1.1 P2 failing and a scoring oddity at once. A Weaver killed mid-climb leaves its Thorn at the length it reached.

⚠ **A standing Thorn holds a spawner slot.** `updateSpawner()` blocks on `state.enemies.length >= min(ENEMY_CONCURRENT, ENEMY_CAP)`, which counts every entity in the one array — so three Thorns nobody shoots hold the spawner shut and the well never clears. Reachable today only through the debug bench; **live the moment §8.1 introduces Weavers**, and an open design call recorded in `STATUS.md` rather than answered here.

**Shipped, CS005 P2 — the Drifter, and it is the hardest entity in Classic because its failure mode is not difficulty.**

| Property | Constant | Value |
|---|---|---|
| Silhouette width | `DRIFTER_SIZE` | 0.66 lane widths (the **crossing** shape; the riding one is deliberately smaller) |
| Colour | `DRIFTER_COLOR` | `#FF5AC8` ⚠ provisional, with the rest of the palette |
| Climb rate | `DRIFT_CLIMB` | 0.13 depth/s in **both** phases (throat→rim ≈ 7.7 s) |
| Time on a boundary | `DRIFT_RIDE_TIME` | 0.85 s — ⛔ **the armour budget** |
| Lane crossing time | `DRIFT_CROSS_TIME` | 0.45 s, vulnerable throughout |
| Homing threshold | `DRIFT_HOME_DEPTH` | 0.60 |
| Stroke width, riding / crossing | `DRIFT_RIDE_WIDTH` / `DRIFT_CROSS_WIDTH` | 0.70 / 1.60 × `laneLineWidth` |
| Alpha, riding | `DRIFT_RIDE_ALPHA` | 0.55 (crossing is 1) |

**The cycle is a phase string and up-counting timers**, the Weaver's precedent: *birth* — one half-cross from the spawned lane centre onto the nearest legal boundary, over `DRIFT_CROSS_TIME * 0.5`; *ride* — on the boundary, armoured; *cross* — one lane to the next boundary, shootable; *ride*, forever. ⛔ **There is no second flag saying which way anything is moving**: the heading lives in `dir`, written back from the helper that owns the wall.

⛔ **It is born at a lane CENTRE and crosses onto the lattice; the constructor does not snap and does not take a `well`.** That is verified rather than preferred — `spawnEnemy()` is a function of `(kind, lane, depth)` and learns nothing about any entity's lattice, and three closed changesets' test files assert exactly the constructed values. It is also the better read: a Drifter emerges from the throat **visibly vulnerable** and only becomes armoured once it settles, so the player is shown the shootable state at the depth where they have the most time — §1.1 P2 delivered by the movement model rather than by a rule. The half-cross goes through `boundaryFrom()` and ⛔ **not** through `laneHop`, for the reason §3.5 gives.

⛔ **Depth climbs in BOTH phases, and that is a structural decision rather than a feel one.** An unshootable entity that never advances is a permanent concurrency squatter — `updateSpawner()` counts every entity in the one array against `ENEMY_CONCURRENT` — which is the exact shape of the Thorn stall `STATUS.md` carries. A Drifter cannot have it: it reaches the rim on a fixed clock and forces a resolution either way. The climb stops at 1 (the Vaulter's rule, for the Vaulter's reason) and ⛔ **the cycle continues there**, so a rim Drifter is a boundary-hopping hunter rather than a parked one.

⛔ **Every cross goes through `laneHop()` with the BOUNDARY fold bounds, and the returned `dir` is written back.** Both halves are load-bearing and they fail differently: the wrong bounds make a cross from lane 0.5 land back on lane 0.5 — a whole vulnerable window in which the Drifter announces itself as shootable and does not move — and a dropped write-back makes it grind out and back across two boundaries forever, which is §3.5's named bug. **Homing** is a *direction* and never a *whether*: at or above `DRIFT_HOME_DEPTH` the next cross's heading comes from `laneDelta` to the Skimmer, below it the stored heading carries, and ⚠ **a homing answer of zero falls back to the stored heading rather than skipping the beat** — the Vaulter may decline a hop, but a Drifter that declines a cross stays *armoured*, and the armour budget is `DRIFT_RIDE_TIME` and not "until the player moves". ⛔ Nothing in the class reads `well.closed`, and it spawns nothing, ever.

⚠ **A riding Drifter threatens two lanes.** `HIT_LANE_TOL` is half a lane and a boundary is exactly half a lane from two centres, so contact is lethal in both — the largest lethal footprint in Classic, and its whole tactical identity. It also **shields** shots in both of those lanes while riding, because `collideShots()`'s `break` is unconditional; the Weaver bolt's own note predicted this and ⛔ that `break` must not become conditional to "fix" it.

**Shipped, CS005 P3 — the Surger, and it is the first entity whose LETHALITY IS A PHASE OF ITS OWN CYCLE rather than a depth.**

| Property | Constant | Value |
|---|---|---|
| Silhouette width | `SURGER_SIZE` | 0.85 lane widths |
| Colour | `SURGER_COLOR` | `#9AF0FF` ⚠ provisional, with the rest of the palette |
| Climb rate | `SURGE_CLIMB` | 0.15 depth/s, ⛔ **in the climb phase only** (throat→rim ≈ 8.6 s, not 6.7 — see below) |
| Climb between discharges | `SURGE_INTERVAL` | 2.60 s ⚠ CS006 makes this heat-derived |
| The fuse | `SURGE_TELEGRAPH` | 0.45 s — ⛔ in `C` unread since CS001; this phase is its first reader |
| The live lane | `SURGE_DISCHARGE` | 0.30 s — ⛔ must stay **strictly below** `RESPAWN_INVULN` |
| Live-lane stroke | `SURGE_LIT_WIDTH` | 2.20 × `laneLineWidth`, on the **discharge** only |

**The cycle is a phase string and one up-counting timer**, the Weaver's and the Drifter's precedent: *climb* — depth rises, the timer runs to `SURGE_INTERVAL`; *telegraph* — the lane arms throat→rim across `SURGE_TELEGRAPH`; *discharge* — the whole lane is live for `SURGE_DISCHARGE`; *climb*, forever. ⛔ **It is born in `climb` with a zero timer and can never discharge on its first step, from any spawn depth** — a Surger that arrived already discharging is the same unaccountable death §4.5's Drifter paragraph is about.

⛔ **The discharge is `killDepth` MUTATED TO 0 AND RESTORED, and there is no eighth contract field.** `collideSkimmer()` is `depth >= killDepth` plus a lane match, so with `killDepth = 0` the depth test is unconditionally true and the only remaining term is `laneHit()` — which is §4.5 item 3 verbatim. The collision pass grows **no branch**, which is the return §6.5's contract was designed to pay. ⚠ **Note the asymmetry with the Drifter, because it is the same number meaning two different things:** zero is wrong there and right here. On the Drifter it would be a permanent property of a climbing enemy, lethal from the throat on its spawn step; here it is a `SURGE_DISCHARGE` window the player was given a `SURGE_TELEGRAPH` fuse to walk out of. A permanent kill zone is not a discharge. ⛔ The restore is as load-bearing as the mutation: an unrestored zero is a permanently lane-lethal enemy that nothing downstream could tell from a bug in the collision pass, so `setPhase()` is the one writer of both `phase` and `killDepth`.

⛔ **The lane is NEVER lethal during the telegraph** — `killDepth` stays on the rim band for the whole of it. That is the whole of §6.3's rule, and it is mutation-checked through the real `Game.update()`: a Surger lethal during its fuse turns `test-cs005-p3.js` red.

⛔ **`SURGE_DISCHARGE < RESPAWN_INVULN` is an INVARIANT, not a coincidence, and it is asserted from the constants.** §4.4's rim push only ever *lowers* an enemy's depth, to `RESPAWN_PUSH_DEPTH` — and 0.55 is still above 0, so the push does nothing at all against a discharging Surger. The invulnerability window is the only thing between a respawn and a discharge that was already running. ⛔ CS006's heat curve is exactly what would break it.

⛔ **Depth rises in the climb phase ONLY, and that is the opposite of the Drifter's rule for a stated reason.** `DRIFT_CLIMB` runs in both of that entity's phases because riding is unshootable and a parked unshootable entity is a concurrency squatter; a Surger is shootable in all three phases, so nothing forces it. The pause is worth having on its own merits — the bar stops moving at the instant its lane starts arming, which is a fourth channel on the fuse for free. The consequence is that the honest throat→rim time is the climb's share of the cycle (2.60 of 3.35 s), ≈ 8.6 s, and **not** `1 / SURGE_CLIMB`.

⛔ **One lane, never hops** — the Carrier's and the Weaver's absence of code. It touches no lane helper and `lane` is written once, by the constructor, which is what lets CS005 P5's soak give it the *strong* assertion (`Object.is` equality with its spawn lane) rather than a per-step speed bound. It also still carries the rim band at rest, so a Surger that reaches the rim in your lane kills by **§4.5 item 1** as well: it is the roster's only entity covered by two of the five conditions.

⛔ **The telegraph is an ENTITY DRAW and not `drawWell()`'s `laneState`,** which is still unwired and is CS006's with the dim band — `isLaneLit()` is a boolean over spokes and could not express a progressive fill anyway. The fuse is a segment rooted at the throat whose tip advances to the rim, the second thing in the build drawn that way (`drawShot`'s pattern, via the Thorn's), and ⛔ **it has its own preallocated scratch points rather than the Thorn's**, because both can be live in the same lane in the same frame. The fuse creeps up at plain lane weight and the discharge slams the lane to `SURGE_LIT_WIDTH`, so the fuse reaching the rim and the lane going live are the same instant and the width jump is what says which instant it was. ⛔ **Full alpha at every depth, the throat zone included** — §10.3 governs what may be drawn *over* that zone, and a telegraph is not drawn over the well, it *is* lane geometry.

⚠ **The fuse is the same shape as a Thorn, in nearly the band's own colour**, and both colours are provisional. Motion separates them — one grows and vanishes, one is static and permanent — and that is a playtest ask rather than an assertion.


### 6.2 Carrier variants

Cargo shows as a glyph in the centre. Reading it fast is the skill that separates competent from good.

| Variant | First | Splits into | Correct response |
|---|---|---|---|
| Vaulter Carrier | L3 | 2 Vaulters, adjacent | Shoot deep; you have time |
| Drifter Carrier | L18 | 2 Drifters | Shoot, **move away** |
| Surger Carrier | L23 | 2 Surgers, flanking | Shoot, **hold still** |

The two opposite correct responses make cargo-reading consequential rather than cosmetic.

**Shipped, CS004 P2 — one of the three rows.** `CARGO` (`07-enemies.js`) maps a cargo name to what it splits into. ⚠ **CS005 P2 and P3 landed the Drifter and the Surger as ENEMY_KINDS rows and deliberately did NOT add their `CARGO` rows** — the cargo rows and their `carrierDrifter` / `carrierSurger` variants are P4's, one phase per thing, so each entity is judgeable on the bench before it is judgeable inside a hull.

**Shipped, CS005 P4 — the table is complete, and it cost three table rows and two glyphs.** All three cargoes are buildable: `CARGO` has `vaulter`, `drifter` and `surger`; `ENEMY_KINDS` (`08-spawner.js`) has `carrierVaulter`, `carrierDrifter` and `carrierSurger`, one row per variant, all three building the **same `Carrier` class** with a different cargo string; and `CARGO_GLYPHS` (`14-render-entities.js`) has a glyph for each. ⛔ **There is no branch on cargo anywhere in the build** — not in `Carrier.onShot()`, not in `splitLanes()`, not in the draw path, which reads the cargo for exactly one thing: which glyph to look up. `Carrier.onShot()` and `splitLanes()` were written in CS004 P2 to serve every row of a table that then had one entry, so the two new rows are the whole phase. A Carrier's `killDepth` is `1 - C.RIM_CONTACT_DEPTH` on all three: **a Carrier is a Carrier regardless of what is inside it, and the cargo only matters after it dies.** ⚠ Still **not a weighted draw** — §8's "cargo weights shift toward Drifter/Surger" is heat, and heat is CS006's. ⛔ **No new bench keys either**: a variant is a *kind*, not a §6.1 roster row, and pressing `2` shows a hull and a glyph, which is what the bench is for.

⛔ **THE GLYPH DESIGN RULE, which this row completes: a glyph is a MINIATURE OF ITS CARGO'S OWN GESTURE.** The Vaulter's is a chevron, which is its arm; the Surger's is a zigzag with square corners, which is its bar; the Drifter's is a jagged scatter with no dominant axis, which is its cluster. That is what makes cargo-reading **learnable** rather than memorised — a player who has met the enemy has already met its glyph — and learnable is this section's stated point. A ninth enemy inherits the rule: take the silhouette the entity already has and reduce it to the fewest points that keep the gesture. The legibility target is **throat depth**, not the rim: two or three points, one unmistakable gesture, no feature that survives only at full size. ⛔ **And the stakes are real, which is why the two consequential rows are the two that look least alike.** The correct responses above are opposite — Drifter cargo: shoot, *move away*; Surger cargo: shoot, *hold still* — so a player who reads the glyph wrong does the exact opposite of the right thing. The Vaulter's and the Surger's both span the full width; the Drifter's is the compact tangle that doubles back across the lanes, and compact-versus-wide is the channel carrying the costly half of the read at the depth where all three are smallest. ⛔ **Every glyph is a plain point array and every glyph is an open path** — `drawCarrier()` calls `drawPoly(..., false)` for all of them with no per-cargo branch, and a closed glyph would read as a second outline nested in the hull. `scratchpad/test-cs005-p4.js` asserts both shapes, the compact/wide separation and the doubling-back, off the real draw calls.

⛔ **One `ENEMY_KINDS` row per VARIANT, not one for "a Carrier".** The kind is `carrierVaulter`, because the cargo is half of what the entity is — reading the glyph fast is the skill this section is about — so it belongs in the string exactly as the class it becomes belongs in the table. CS005 P4 added `carrierDrifter` and `carrierSurger` alongside their `CARGO` entries and touched nothing else.

⛔ **"Adjacent" and "flanking" are the same geometry**, and `splitLanes(well, lane)` (`03-wells.js`) serves all three rows — proven rather than intended, since CS005 P4 landed the second and third words' entities and added no placement code. The distinction this section draws is between the correct *responses* — move away versus hold still — which comes from what the cargo does after it lands, not from where it lands. Do not invent a second placement rule to justify the second word; it would be a difference the player cannot see.

⛔ **`splitLanes` shifts the pair inward at an open well's wall; it does not clamp.** `laneNormalize` clamps, so the naive `lane ± 1` puts both children of a lane-0 Carrier into lanes 0 and 1 — two silhouettes in one lane, on the six wells where the player has the least room, at the exact moment they are being asked to read a split. The rule is: shift until both ends are legal and distinct, so the gap stays exactly two lanes at the wall as much as in the middle. A lane-0 parent on the 13-lane Vee yields children at lanes **0 and 2**, and one child therefore still occupies the lane the parent died in. ⚠ Earlier drafts of this said the pair "still straddles the parent's lane"; at a wall that is false — 0 and 2 straddle lane 1 — and the concrete example is the part that was always right.

⛔ **Both children go through `spawnEnemy()`**, so a split inherits §6.3's safe-spawn lowering, `C.ENEMY_CAP` (a split on a full board adds nothing, and "it is only a split" is precisely the bypass one entry point exists to prevent) and two RNG draws. ⚠ **The Purge does not split Carriers**: `updatePurge()` sets `dead` directly and never calls `onShot()`, so a panic button cannot double the enemy count. That works by **omission**, which is exactly the kind of thing a later session "unifies", and it is written down at both sites.

### 6.3 Behaviour notes that matter

**Vaulters do not vault at level 1.** They climb straight up, which is how the player learns what a lane is. Teach-immediately applied to AI.

⛔ **Drifter invulnerability must be visible.** Riding a boundary: tight, hard-edged, dim. Crossing: bloomed open and bright. If the player cannot tell at a glance, the Drifter is not a threat, it is a random death — the most common complaint about clones.

⛔ **Surgers telegraph.** `SURGE_TELEGRAPH` 0.45 s: the lane brightens throat→rim with a rising tone, then discharge is unavoidable. Fair difficulty is a visible fuse.

⛔ **Never spawn in the Skimmer's lane above `SAFE_SPAWN_DEPTH` (0.75).**

**Shipped, CS003 P1/P2.** The level-1 rule is `C.VAULT_FIRST_LEVEL` and ⛔ **it gates vaulting only.** Rim hunting is *not* gated: §6.1 attaches "from L2" to vaulting, and §12 promises a passive player dies on level 1, which a Vaulter parked politely at the rim cannot deliver. Getting that split wrong in either direction is a level-1 experience that teaches the wrong thing.

**Shipped, CS004 — what the three new entities do and do not read.** ⛔ **Nothing added this changeset reads `well.closed`, and nothing added this changeset hops.** The Carrier, the Weaver, the bolt and the Thorn each write `lane` exactly once, in the constructor. That is deliberate and it is why they behave identically on a Ring and on a Fan: all sixteen topologies live inside `laneHop`/`laneDelta`/`laneNormalize`, and an entity that never asks cannot get the answer wrong.

⛔ **The safe-spawn rule reaches three new callers**, all through the one entry point: the Carrier's split, `Weaver.fire()`, and `Weaver.layThorn()`. Lowering rather than relocating is what makes it safe for all three — a bolt fired from above the line starts deeper, which only ever gives the player more time. ⚠ **On an anchored entity the same rule would SHORTEN rather than lower**, because a Thorn's `depth` is a length; it is harmless because a Thorn is created one climb step above the throat and grown from there, and because the grow runs on the same step. ⛔ Do not reorder those two, and do not teach anything to drop a finished Thorn deep in a lane.

⛔ **A grown Thorn does not block spawns behind it, and that is inherited, not an oversight.** `laneCrowded()` only counts entities *below* `READABILITY_DEPTH` as crowding a lane, so a Thorn whose tip is above 0.25 is invisible to the spawn-lane picker and enemies will appear at the throat in thorned lanes. A shot stops at the tip, so anything below it cannot be hit — until it climbs past, which makes the shelter temporary and self-resolving. ⚠ Not a bug; a playtest question about whether a lane you failed to keep clean reads as a consequence.

The safe-spawn rule is enforced inside `spawnEnemy()` — the one entry point (§6.5) — and ⛔ **by LOWERING the depth to `SAFE_SPAWN_DEPTH`, never by moving the lane and never by refusing the spawn.** CS004's Carrier has to put its two children somewhere specific ("adjacent", "flanking", §6.2), and relocating them sideways would break the shape the player is being taught to read; dropping one deeper only ever gives the player more time. "The Skimmer's lane" is read as anything within one lane of its *continuous* position rather than `Math.round()`'s single answer — a player parked between two centres is half in each, and the wider reading is the safe direction to be wrong in.

The spawner also declines to stack a new enemy on one already sitting in the same lane down in the throat zone (`READABILITY_DEPTH`, §10.3, reused rather than given a second constant for the same band): two silhouettes at the same lane and nearly the same depth read as one, which is §1.1 P2 failing at the moment the player has the most time to react. ⛔ The retry is **bounded** by `SPAWN_LANE_TRIES` and settles for its last draw — the run has one RNG stream, and an unbounded search would spend a board-dependent number of draws and desynchronize every later draw in the run (§17 item 1).

**Shipped, CS005 P2 — the invulnerability read, as THREE independent channels.** §12's first-Drifter prompt names the visual language this ⛔ is asking for: `SOLID = ARMOURED · OPEN = VULNERABLE`. So the two states differ on three things at once, and no one of them carries the read alone:

| Channel | Riding (armoured) | Crossing (vulnerable) |
|---|---|---|
| Silhouette | a compact irregular knot, drawn **closed** | a splayed scatter, drawn **open**, reaching ±1 |
| Stroke width | `laneLineWidth(depth) * C.DRIFT_RIDE_WIDTH` (0.70) | `* C.DRIFT_CROSS_WIDTH` (1.60) |
| Alpha | `C.DRIFT_RIDE_ALPHA` (0.55) | 1 |

⛔ **Two polys, not one poly restyled.** `entityPoints()` memoizes a scratch array per poly array, so the second one costs one projection loop and zero allocation — the Carrier's shipped hull-and-glyph pattern. One poly drawn closed and then open differs by a single edge, which is not a read at a glance. ⛔ **No global glow constant is touched.** `glowStroke`'s wide pass is `width * GLOW_WIDE_W`, so the narrower riding stroke is *literally* a harder edge — but `GLOW_WIDE_W`, `GLOW_WIDE_ALPHA` and `GLOW_THIN_ALPHA` are shared with the well and every other entity, and retuning one is an art pass across the whole build. Both states are per-entity multipliers only.

⛔ **The separation is a HEADLESS GATE, not an eyeball verdict**, because this is an art rule and art rules rot silently: `scratchpad/test-cs005-p2.js` asserts `DRIFT_CROSS_WIDTH / DRIFT_RIDE_WIDTH >= 2.0` and `DRIFT_RIDE_ALPHA <= 0.7` from the constants, *and* measures the same two ratios back off the real `glowStroke` calls, *and* asserts the two polys are different arrays drawn with different `closed` arguments. A future retune cannot collapse the two reads into one without turning the suite red. That gate is what CS005 does **instead of** building `tools/glow-lab.html`, which tunes the global constants this changeset does not touch.

⚠ **The full-alpha rule the other four enemies carry does not apply to the Drifter, and that is not a hole in §10.3.** That rule is about what may be drawn *over* the throat zone; the Drifter's alpha is constant with depth and *is* the feature. `DRIFT_RIDE_ALPHA` is therefore the one enemy constant in the build that can make an enemy hard to see at the throat, and judging it there is a playtest ask.

**Shipped, CS005 P3 — the fuse, and it is the whole of this section's ⛔ on the Surger.** The telegraph is `SURGE_TELEGRAPH` (0.45 s) of a segment rooted at the throat whose tip advances to the rim, drawn by the entity in its own preallocated scratch (`drawSurgeLane`, `14-render-entities.js`) — ⛔ **not** on `drawWell()`'s `laneState`, which stays unwired for CS006 and is a boolean over spokes that could not express a progressive fill in any case. The tip travelling up the lane is the point: a lane that merely got brighter would say nothing about *how long the player has*, and the decision the fuse is asking for is whether to shoot or to leave.

⛔ **The lane is not lethal while the fuse is running.** `killDepth` stays on the rim band through the whole telegraph and is mutated to `0` only when the discharge begins (§6.1). A fuse that kills is not a fuse. That is mutation-checked through the real `Game.update()` rather than by inspection — a Surger lethal during its telegraph turns `test-cs005-p3.js` red — because this is a fairness rule and fairness rules rot silently.

The discharge is `SURGE_DISCHARGE` (0.30 s), and the fuse reaching the rim and the lane going live are the **same instant**: the fuse creeps up at plain lane weight and the live lane slams to `SURGE_LIT_WIDTH`, so the width jump is what says which instant it was. ⛔ **The rising tone this section asks for is CS008's** — there is no audio in the build yet, and `C.SURGE_TELEGRAPH` is the one number both halves will read. ⚠ **SETTLED, `CLAUDE.md`:** the charge tone is a gameplay cue and must stay audible over music at every intensity tier when it lands.

⛔ **The pause is part of the fuse.** Depth rises in the climb phase only, so a Surger visibly *stops* at the moment its lane starts arming. That is a fourth channel on the warning for free, and it is deliberately the opposite of the Drifter's rule (§6.1) — which climbs in both its phases because an unshootable entity that parks is a concurrency squatter, a hazard a Surger cannot have because it is shootable in all three of its phases.

### 6.4 Overdrive enemies

**Reaver** (L6+), **Warden** (L11+), **Mimic** (L16+). Detailed with concerns in §14.6.

### 6.5 Entity contract

⛔ Matching Orbital Overhaul: every entity is a **class** with `constructor` / `update(dt)` / `draw()` / `dead`. Kill by setting `dead = true`; remove with an end-of-frame `.filter()`. **Never splice mid-loop.**

⛔ **New enemies wire into six places:** `startGame` reset, `update()` entity pass, `update()` collision pass, `update()` cleanup filter, `draw()` z-order, and the well-clear condition. **Decide explicitly whether the new hazard can be destroyed by the Purge.**

**Shipped, CS003 P1–P3 — read this before adding an enemy.** `07-enemies.js` holds the base class `Enemy`, and ⛔ **it is fields and signatures only: no movement, no AI, no draw code.** It exists so the ninth enemy cannot silently forget a field; the value is the field list, not the inheritance. ⚠ **That is a slope.** The first time a climb rate or a hop timer lands in the base, five enemies that do not climb inherit one and the bug is invisible until one of them is given a reason to read it. If the base ever acquires behaviour, that is the signal to flatten it back to independent classes — not to add a second field to switch the behaviour off.

**The seven fields, and what each one decides:**

| Field | Meaning |
|---|---|
| `lane`, `depth` | ⛔ The whole position (§3.2). Lane-centre units and 0 = throat, 1 = rim. No entity ever stores a screen coordinate. |
| `dead` | Set true to kill. The caller's end-of-frame `.filter()` does the removal. |
| `purgeable` | Whether the Purge destroys it (§4.3). **Shipped `false`: the Thorn, and it is the roster's only one** — which is why §4.3's "does not remove Thorns" costs the Purge no special case, in either of its two uses. |
| `blocksClear` | Whether it must be gone before the well counts as clear. The Thorn is `false`, and that is *why* a Thorn is still standing during the Dive (§5) rather than an oversight in the clear check. |
| `killDepth` | §4.5's contact rule as a number: contact kills when `depth >= killDepth` and the lanes match. `null` means contact never kills — the Weaver's body. ⛔ **Every enemy that has a number uses the same one, `1 - C.RIM_CONTACT_DEPTH`, the Drifter included** — there is no term here for where the Skimmer is, so a `killDepth` of `0` would be lethal from the throat rather than "lethal on contact" (§4.5, CS005 P2). One comparison covers three of the five death conditions, which is why it is a field. ⛔ **CS005 P3's Surger is the first entity in the roster that MUTATES this field** — `0` for its `SURGE_DISCHARGE` window and the rim band either side of it — which is how §4.5 item 3 is expressed with no eighth field and no branch in the collision pass. That is a *cycle phase written into an existing field*, not a new kind of value, and the restore is as load-bearing as the mutation. |
| `anchored` | ⛔ **What `depth` MEANS on this entity, not whether it moves.** `false` — the default, and every enemy but one — means `depth` is a **position**. `true` means `depth` is a **length**: the tip of an extent rooted at the throat. A stationary enemy whose `depth` is still a position is `false`; anything that ever reads `depth` as a length sets it true. The Thorn is the roster's only `true`. ⛔ **Its one reader is `respawnSkimmer()`**, which skips anchored entities: §4.4's rim push clamps `depth` down to 0.55, and on a length that is not a push but a free chip nobody earned, applied silently on every player death in the one place nobody would look. ⚠ **This is NOT a narrowing of §4.4's SETTLED clamp.** The band is untouched — everything above `RESPAWN_PUSH_DEPTH` still comes down to it, in every lane. The field says *which entities the clamp means anything for*, not *how far down it reaches*. See `RATIONALE.md#thorn-depth`. |

**The three methods:** `update(dt, well, state)`, `draw(ctx, well)`, and `onShot(shot)`. ⛔ **`onShot` returns whether the shot is CONSUMED**, and the *enemy* decides what a hit does — the collision pass only asks. `true` retires the shot; `false` lets it fly on to whatever is behind. That is what keeps the Thorn (chip, consume) and an armoured entity (no damage, do not consume) out of the collision pass as special cases. The base returns `false` deliberately, so a subclass that forgets to override it lets shots through — visible — rather than eating them silently.

**Four singular things, and each one is singular on purpose:**

- ⛔ **ONE array, `state.enemies`.** Thorns, Carriers and Drifters all live in it; the flags above decide behaviour, not a second array. A second array doubles all six wiring points.
- ⛔ **ONE spawn entry point, `spawnEnemy(kind, lane, depth)`** (`08-spawner.js`). Every enemy that enters the array comes through it, and **CS004 shipped three callers that are not the spawner**: the Carrier's split, `Weaver.fire()` and `Weaver.layThorn()`. It owns §6.3's safe-spawn rule, the `ENEMY_CAP` ceiling, and the one RNG draw a spawn spends on its heading; a caller that pushes straight into the array re-implements all three and forgets one. A `kind` is a **string**, and `ENEMY_KINDS` is the one table where a string becomes a class — that is where the roster grows. A refused spawn returns `null` and is not an error; the interval spawner spends no quota on one.
- ⛔ **ONE well entry, `enterWell()`** (`23-main.js`). A new run, the next level, the debug cycler and the restart all land there. It clears both entity arrays (**cleared, not filtered** — an enemy's lane is only meaningful against the well it was spawned into, and well lane counts differ), re-arms the Purge charge and the spawner, and mints the craft. It deliberately does **not** touch `state.lives` (the reserve belongs to the run) or `state.purgeLatched` (that is input state, not well state).
- ⛔ **ONE collision pass** (`09-collision.js`), in a fixed order: shots against enemies, then enemies against the Skimmer, each front to back. §17 item 1's replay guarantee is why the order is written down. It is **1-D throughout** — a lane match within `HIT_LANE_TOL` via `laneDelta`, plus a `depth` overlap within `HIT_DEPTH_TOL`. No projected point appears anywhere in it: the same overlap would start passing at the rim and failing at the throat, because `perspective()` is not linear.

**Shipped, CS004 — the three non-spawner callers, and why the first one is safe.** ⚠ **SETTLED — a Carrier pushes into `state.enemies` from inside `collideShots()`'s own loop over that array**, because `Carrier.onShot()` splits and both children go through `spawnEnemy()`. That is safe, and it is safe because of three separate decisions in two files rather than by luck:

1. the collision loop is **index-based and re-reads `.length`**, so an appended child is simply part of the array — nothing is invalidated and no iterator is live across the push;
2. the `break` after `onShot` is **unconditional**, so the shot that caused the split stops there and cannot walk forward into the children it just created;
3. removal is still the end-of-frame `.filter()` — the dead parent is skipped by `e.dead` for the rest of the step. Nothing is spliced mid-loop.

⛔ Do not "fix" this into a deferred spawn queue: a queue would put the children on the board one step late, at a depth they never occupied, and buy nothing. Do not make that `break` conditional either — it is item 2, and it is load-bearing for §4.2's chip-away economy as well.

⚠ **SETTLED — the Purge kills without asking.** `updatePurge()` sets `dead` directly and **never calls `onShot()`**, which is the only reason a Purge on a well of Carriers leaves it empty instead of doubling it. The two are not the same question: a shot *asks* the enemy what a hit does, and the Purge is §4.3's panic button, which is a statement. ⛔ This works by **omission**, so it is written down at both sites — an omission is what a later session "unifies for consistency".

⚠ **A `false` from `onShot` still costs the shot its resolution for that step**, because the `break` is unconditional. The Weaver's bolt is the shipped example: it declines every shot, so it briefly shields whatever is behind it — about three steps against eight shots in flight and a 0.055 s cooldown. That is the same mechanism CS005's armoured Drifter will depend on, and it is not a bug.

**Where the six wiring points actually are today.** `startGame()` resets through `newState()`, so a field added in `02-state.js` is reset without `startGame` being touched. The entity pass, the Purge, the collision pass, both end-of-frame filters, the spawner and the well-clear check are all in `Game.update()` in that order; the z-order is in `Game.draw()`, with enemies between the well and the shots. The clear condition is `wellCleared()` — ⛔ **two conditions, quota spent AND no `blocksClear` survivor.** "The array is empty" alone is true one tick after `startGame()` and in every gap between spawns.

⛔ **No enemy allocates per frame in its draw path.** `entityPoints()` (`14-render-entities.js`) is the shared projection every enemy uses; each polygon memoizes its own scratch array of screen points, so the array is **shared** — copy out of it if you need to keep it, and it is non-reentrant per polygon.

---

## 7. Scoring

| Event | Points |
|---|---|
| Thorn chip | 5 |
| Weaver | 50 |
| Carrier | 100 |
| Vaulter | 150 |
| Surger | 200 |
| Drifter | 250 / 500 / 750 by depth |
| Reaver *(OD)* | 300 |
| Mimic *(OD)* | 400 |
| Warden *(OD)* | 500 |
| Well cleared | 100 × level |
| Purge unspent | 500 |
| Well cleared, no death | 1,000 |
| Start Depth | §4.6 |

⛔ **All scoring routes through `addScore()`.** One entry point, matching Orbital Overhaul's rule, so milestone logic has exactly one place to live.

**No score cap and no rollover.** The original's 999,999 rollover was a bug.

Overdrive adds a combo multiplier — §14.4.

---

## 8. Difficulty

⛔ **One clock: `game.level`.** No parallel clocks. Matching Orbital Overhaul's `game.wave` rule, which exists because a second clock silently desynchronises from the first.

Per house rule there are no stair-step tiers. One continuous scalar:

```js
function heat(level) {
  const t = level - 1;
  return HEAT_BASE
       + HEAT_RISE * (1 - Math.exp(-t / HEAT_KNEE))
       + HEAT_LINEAR * t;
}
```

Heat modulates spawn interval (floored), concurrent enemy cap, climb speed, vault interval, surge frequency, Weaver thorn length, and Carrier cargo weights.

⛔ **`ENEMY_CAP` is a readability constraint, not a difficulty constraint.** Difficulty past the cap comes from faster and meaner, never more. Raising it violates P2 and is the fastest route to a game that feels cheap.

### 8.1 Introduction schedule

| Level | Introduced |
|---|---|
| 1 | Vaulters (non-vaulting) |
| 2 | Vaulting |
| 3 | Carriers |
| 5 | Weavers, Thorns |
| 8 | First open well |
| 9 | Drifters |
| 13 | Surgers |
| 18 | Drifter Carriers |
| 23 | Surger Carriers |
| 27 | Full mix; heat alone |

Compressed relative to the original (Pulsars at 17, Pulsar Tankers at 41) because our tuned ceiling is ~35–40, not ~99. A threat introduced past the window most players reach does not exist.

### 8.2 Tuning target

First-time player: level 4–6. Competent after an hour: 15–20. Strong: 30–40. Level 50 is an achievement; 99 is a legend. Tune against these numbers with the harness, not by feel.

---

## 9. Controls

P1 is the pillar most likely to be quietly compromised. This section is deliberately prescriptive.

> **The requirement:** a player must be able to traverse a third of the well and stop on their intended lane, on every supported device.

### 9.1 Mouse — the reference implementation

Relative horizontal movement; Pointer Lock offered, never forced. `Δlane = Δx * MOUSE_SENS`. ⛔ **No acceleration curve** — a spinner has none, and adding one is the most common way to ruin this.

### 9.2 Keyboard — parity through dual mode

A digital key delivers both spinner affordances if we separate them:

- **Tap** (released within `KEY_TAP_MS`, 130 ms): move exactly one lane. Precision.
- **Hold**: accelerate `KEY_SPEED_MIN` → `KEY_SPEED_MAX` over `KEY_RAMP` (0.35 s). Traversal.

These two constants are the most feel-critical pair in the game.

### 9.3 Touch

- **Rotation:** horizontal drag anywhere in the lower 40%, relative, same sensitivity model as mouse. Not a virtual stick.
- **Fire:** ⛔ **auto-fire ON by default.** Requiring a second thumb on a game whose core input is a continuous drag is a design error — and this is what makes the Jump button affordable (§14.2).
- **Purge:** large button, top-right. **Jump:** bottom-right. Mirrorable for left-handed play.

### 9.4 Gamepad

Left stick X proportional; D-pad uses the keyboard dual-mode model.

### 9.5 Abstraction

⛔ All four collapse to one struct; the simulation never learns which device produced it. Call sites never read the raw key map — matching Orbital Overhaul's `input.*` predicates rule.

```js
state.input = { rotate: 0, fire: false, purge: false, jump: false }
```

---

## 10. Visual design

### 10.1 Direction

Neon wireframe on near-black, with **deliberate divergence from Atari's trade dress** (§18): line weight varies by depth (vector hardware could not do this), the well carries an animated gradient along its length, silhouettes and palette are ours.

### 10.2 Rendering rules

⛔ **Render through `drawPoly` + `glowStroke`**, matching Orbital Overhaul. New entities define local-space point arrays and reuse these. No per-entity pipelines, no fills, no sprites, no textures.

Glow is two strokes — wide at low alpha, thin at full — composited with `lighter` into an offscreen canvas. Roughly 4× cheaper than `shadowBlur` and it looks better.

⛔ **HUD uses `glowStroke`.** No `fillRect`, no `strokeRect`.

### 10.3 ⛔ The readability contract

**Nothing is drawn over `depth < 0.25` at an opacity that obscures an approaching enemy.** Explosions, particles, and score popups are clipped or faded in that zone. This is what Tempest 4000 was criticised for violating, and it is the difference between tense and unfair.

### 10.4 HUD

Score top-left, lives bottom-left, level and band top-right, Purge charge bottom-right, combo (Overdrive) centre-top and loud. Everything else lives in the well.

---

## 11. Audio

⛔ **Web Audio synthesis only. No audio files.** House standard, unchanged.

The architecture below is Orbital Overhaul's proven MusicSys, adopted rather than reinvented. §11.4 is the one genuinely new system, and it exists to succeed where that game's intensity layering failed.

### 11.1 Module shape

⛔ **`MusicSys` lives alongside `AudioSys`, never inside it.** `AudioSys` is a flat bag of one-shot voices and must not grow a sequencer. All music output routes into `AudioSys.music`, so the existing Music Volume slider governs everything with no new plumbing.

```
note envelopes → layerGate → trackGain (crossfaded) → duck → AudioSys.music → master
SFX ───────────────────────────────────────────────────────→ AudioSys.sfx → master
```

### 11.2 ⛔ Scheduler

**Per-frame lookahead, called once per frame from the main loop. Never `setTimeout`, never `setInterval` for notes.** Each frame, schedule any note starting within `MUSIC_LOOKAHEAD` (0.2 s) using absolute `AudioContext.currentTime`. Timing is sample-accurate and immune to frame-rate jitter.

⛔ **`scheduleStep` never consults intensity.** Every layer is always scheduled; gating is entirely a downstream gain node. That is what makes a track's note timing provably fixed regardless of what the director is doing.

### 11.3 ⛔ Tracks are DATA

Generic step-sequencer table, consumed unmodified by the scheduler:

```js
{ stepDur, steps, layers: [ { name, tier, type, cutoff, cutoffTo, detune,
                              gain, atk, rel, steps: [cell|null] } ] }
```

⛔ **Composed and auditioned in `tools/music-lab.html`, ported verbatim.** No re-tuning a single gain in the build; the lab is the source of truth for note data. New tracks are new table entries — do not touch the scheduler. `playNote`'s voice branch is the one extension point.

**Length target.** Orbital Overhaul's tracks run 21.8–48 s (`zen` longest). Vector Vortex targets **≥ 90 s before the loop point** for the two flagship tracks, achieved through A→B→C sections — the same technique `drift` and `warehouse` already use for their A→B, extended.

### 11.4 The intensity director — the new work

**What failed in Orbital Overhaul, recorded so we do not repeat it.** Layers were gated on `musicIntensity(wave) = 1 − e^-(w-1)/8`, a smooth curve over wave number. Two findings: the tier-4 threshold at 0.70 first crossed at **wave 11**, so no track had an audible melody for most of a typical run; and re-tiering was then tried and rejected on audition, because on every track the preferred mix was the foundation alone — the thickening read as clutter.

Three changes address that:

**(a) The trigger is live danger, not wave number.** A wave curve moves once per wave and is unaffected by anything the player does. That is not music reacting to you; it is music being slightly different later. Instead:

```js
raw = W_COUNT     * clamp01(enemiesAlive / EXPECTED_ENEMIES)
    + W_PROXIMITY * clamp01(nearestEnemyDepth)
    + W_COMBO     * clamp01(combo / COMBO_MAX)      // Overdrive
    + W_PERIL     * (lives <= 1 ? 1 : 0)
    + W_HEAT      * clamp01(heat / HEAT_MAX);
```

Smoothed **asymmetrically** — attack ~0.4 s so danger registers immediately, release ~2.5 s so relief is earned. Symmetric smoothing makes layers flutter, which sounds broken.

**(b) The melody is never gated.** ⛔ The foundation tier carries the tune. Layers add *to* a complete piece of music; they are never what makes it music. This is the direct fix for finding (1).

**(c) ⛔ P5 — the standalone test.** *Every layer above the foundation must be recognizable played solo, with the rest of the track muted.* A layer that only makes sense inside the stack is texture, and texture is what produced the mud. `music-lab` gains a **solo button per layer**, and a layer that fails the solo audition does not ship. This is an audition gate, not a code rule, and it is the thing that was missing last time.

### 11.5 ⛔ Scope: sweep plus two or three earned layers

Deliberately narrower than the five-tier design that failed.

1. **A filter and mix sweep**, always on. A one-pole low-pass on the music bus opens 600 Hz → 18 kHz across the intensity range. This alone is a large, unmistakable change that is structurally incapable of sounding cluttered, because it adds no notes.
2. **Two or three layers that pass §11.4(c).** Realistically a hook that is a real riff, a percussion layer that is a real groove change, and a danger layer that enters only near death. Anything that cannot survive solo does not ship.

⛔ **Tier changes latch to the next bar line**, crossfaded over `MUSIC_LAYER_CROSSFADE`. A layer entering mid-phrase sounds like a bug even when intentional.

⚠ **SETTLED — this is a re-opening of a decision Orbital Overhaul made against, taken deliberately with Paul's approval on 2026-08-30, on the diagnosis that the failure was compositional (undefined, muddy layers) rather than architectural.** If the audition fails again, the correct response is the same freeze that game took: drop the `tier` fields and every gate builds always-on with no code change. Build the machinery so that remains a data-only retreat.

⛔ **A layer's `tier`, if set, must be in `1..4`.** `LAYER_THRESHOLD` has no key for 5+, and `f >= undefined` is always false, so a tier-5 layer would be permanently silent.

### 11.6 Ducking and reactive visuals

`duck` ramps to 0.5 while a menu is open and dips 6 dB on Purge, death, and extra life — always `linearRampToValueAtTime`, never a bare `.value` set.

The scheduler emits kick and snare events to the render layer; the rim pulses on the kick. ⛔ **Driven by the scheduler, not an `AnalyserNode`** — an analyser adds latency, and tightness is the point.

### 11.7 Tracks

| Track | Mode | Character |
|---|---|---|
| `title` | — | Title screen |
| `pulse` | Classic default | Sparse, tonal, near-ambient at foundation |
| `drive` | Overdrive default | ~138 BPM. The flagship. |
| `rush` | Overdrive alt | ~150 BPM, aggressive |
| `deep` | Both | ~124 BPM, dubby, wide |

Selectable in Options, persisted per profile, cycled exactly like Orbital Overhaul's `settings.musicTrack`.

### 11.8 SFX

⛔ **The Surger charge tone is a gameplay cue, not decoration.** It must be audible over the music at every intensity tier. Verify by ear on real hardware; it is the one sound whose absence costs a life.

Every entry point is `if (!AudioSys.ctx) return;`-guarded, headless-safe.

---

## 12. Onboarding

Level 1 is the Ring, non-vaulting Vaulters at half speed, three at a time. Within four seconds, a player who does nothing sees a death; one who moves and fires kills something. Both teach.

Non-modal prompts, once per profile, in the well's line style, never pausing:

| Trigger | Prompt |
|---|---|
| First frame | `ROTATE — FIRE DOWN THE LANE` |
| First Carrier | `IT CARRIES TWO` |
| First Thorn | `THORNS BLOCK THE DIVE` |
| First Drifter | `SOLID = ARMOURED · OPEN = VULNERABLE` |
| First Surger | `ITS LANE GOES LIVE` |
| First open well | `NO WRAP — THE ENDS ARE WALLS` |
| First Purge | `ONE PER WELL` |

Attract mode after `ATTRACT_IDLE` (20 s).

---

## 13. Modes

| | CLASSIC | OVERDRIVE |
|---|---|---|
| Powerups | None | §14.1 |
| Jump | No | §14.2 |
| Combo | No | §14.4 |
| Dive | Thorn-dodge | Ring-flight |
| Extra enemies | No | Reaver, Warden, Mimic |
| Music | `pulse` | `drive` |
| Leaderboard | Own board | Own board |

Both available from first launch. Overdrive is the default highlight; Classic is presented as the purist option, not a tutorial.

---

## 14. Overdrive proposal and concerns

Each component on merit. Three are cut or deferred.

### 14.1 Powerups — **include**

Destroyed enemies occasionally drop a token that rises up its lane; collect by touch; lasts the current well only.

| Token | Effect |
|---|---|
| **Lance** | Shots pierce; chips Thorns at 3× |
| **Spread** | Fires into the lane plus both neighbours |
| **Recharge** | Restores the Purge to full strength |
| **Bounty** | +2,000 |
| **Ward** | One free hit, visible as a shell |

Weighted seeded table — not a fixed cycle, not pure random.

**Concerns.** Collection pulls you toward danger, which is good tension but means a token in a Surger's lane must read as a choice, not a gotcha — so tokens use a warm palette no enemy uses, and hover at `depth 0.8` for a beat before expiring. Clutter threatens P2 directly: ⛔ **cap `MAX_TOKENS` at 2**, and drop rate *falls* as enemy count rises. Per-well expiry creates a rhythm problem (the last ten seconds of every well are the strong ones) inherited from Tempest 2000 — **keep it anyway**, because carrying powerups across wells snowballs and trivialises escalation, which is worse.

⚠ Following Orbital Overhaul's hard-won distinction: **the budgeted-effect list and the drop-weight table are two different tables answering two different questions.** Do not conflate them.

### 14.2 Jump — **include**

Lifts off the rim for `JUMP_TIME` ~0.9 s: immune to rim contact and Surger discharge, can rotate, cannot fire. `JUMP_RECOVERY` 0.2 s vulnerable on landing.

**Concerns.** It is the one addition that changes the genre's dimensionality, and it is why Tempest 2000 felt new. It can trivialise Surgers — mitigated by `JUMP_COOLDOWN` 1.4 s, so clearing one leaves you grounded for the next. ⛔ **"Am I airborne?" must be unmistakable on three independent channels:** the Skimmer lifts visibly off the rim line, casts a bright drop-shadow onto its lane, and the music high-passes briefly. Getting this wrong makes every death feel arbitrary. Touch cost is real but affordable precisely because §9.3 makes auto-fire the touch default — ⛔ **those two decisions are coupled; changing one breaks the other.**

### 14.3 Companion droid — **defer**

Autonomous ally that floats above the well and auto-fires.

**Concerns.** It muddies the counterfactual when you die. It breaks combo attribution: if droid kills feed your multiplier the multiplier stops measuring you; if they don't, the powerup hurts your score. And it is the most expensive item here to build well — good autonomous targeting across a wrapping topology with invulnerable-phase Drifters is a genuine AI problem, and Tempest X3's droid was considered a downgrade precisely because its behaviour became unpredictable.

Worst value-per-risk in the set. If it ships later, droid kills score 50% and do not feed the combo.

### 14.4 Combo multiplier — **include**

Consecutive kills, no death, no gap beyond `COMBO_WINDOW` 2.5 s. ×1 to ×8 in half steps. Decays rather than snapping.

**Concerns.** It can turn the board into a combo-maintenance contest — mitigated by capping at ×8 and setting the window generous enough that ordinary competent play sustains ×3–4, so the multiplier rewards *not dying*, which is already what we want to reward. Hidden state is a design smell: the display carries a visible depletion ring and loss has its own sound. It feeds the audio director (§11.4), which is the strongest argument for it — a good run is something you *hear*.

### 14.5 Ring-flight dive — **include, hard-scoped**

The Overdrive Dive becomes a short ring corridor.

**Concerns.** Different control model mid-run; highest build cost in the set; and it can break P4 by turning the breath into more work.

⛔ **Scope cap: max 4 seconds, max 6 rings, no failure state beyond "you stop earning," and it reuses the depth model** — rings are objects at decreasing depth in a lane-less tube, not a second renderer. Under those constraints it is a few hundred lines. **First candidate to cut under scope pressure**, falling back to the Classic thorn-dodge.

### 14.6 Additional enemies

**Reaver** (L6+) — Vaulter at 1.6× that vaults toward the Skimmer. A parameter variation on an existing entity, the cheapest possible threat. **Include.**

**Warden** (L11+) — flies above the well, fires down, killable only by Jump. Slightly circular (it exists to justify Jump) but it makes Jump offensive as well as defensive. ⛔ **Must be visible in peripheral vision** — an off-well enemy killing you from where you weren't looking is the definition of unfair. **Include.**

**Mimic** (L16+) — reflects shots; vulnerable only while firing. **Probation.** Reflected shots that kill you are a hard sell: players read their own bullets as safe and reversing that betrays a deep expectation. Reflected shots are colour-shifted, larger, and 60% speed. Build it, playtest it, **cut it without ceremony if it reads as cheap.**

### 14.7 Level skip — **cut**

Combined with Start Depth it makes level-reached meaningless as a stat, and two overlapping skip mechanisms is one too many. Start Depth already provides the affordance, priced and legible, at run start.

### 14.8 Beastly mode — **defer**

Content gated behind clearing 99 levels is content for nobody. Revisit if telemetry ever shows players getting there.

### 14.9 Summary

| Component | Verdict | Primary risk |
|---|---|---|
| Powerups | Include | Clutter vs P2 |
| Jump | Include | Airborne readability |
| Combo | Include | Score distortion |
| Reaver | Include | None material |
| Warden | Include | Off-screen fairness |
| Ring-flight dive | Include, capped | Build cost; first cut |
| Mimic | Probation | Reflected shots feel like betrayal |
| Companion droid | Defer | Cost, attribution, agency |
| Level skip | Cut | Breaks comparability |
| Beastly mode | Defer | Nobody reaches it |

---

## 15. Meta systems

Specced against Orbital Overhaul's shipped, working implementations rather than invented.

### 15.1 Storage

⛔ **`kit-storage` owns the keyspace.** The game does not choose raw
`localStorage` key names. All keys are `coinless.<gameId>.<key>`, declared up
front via `create({gameId, keys})` with a version and optional `migrate` per key;
`get`/`set` on an undeclared key throws.

⛔ **Vector Vortex is a new game with no legacy stores.** `kit-profile` is wired
with empty `legacyRosterKey` / `legacyProbeKeys` so its `afd_*` import path —
Orbital Overhaul's — never runs here.

| Declared key | Scope | Notes |
|---|---|---|
| `settings` | Per-profile, via `scope(profileId)` | Options, bindings, track choice |
| `achievements` | Per-profile | Lifetime + weekly + tiers |
| `scores` | Root store, shared across profiles | Records stamped `profileId`/`profileName` |
| `telemetry` | Per-profile | ⛔ Lazy — untouched unless capture is on |

The profile roster itself is `kit-profile`'s, not ours.

⛔ **A row-shape change bumps that key's declared version and supplies a
`migrate`, never a new key name.**

⛔ **New state is additive under known-value-else-default loading.** Removing a
field needs no migration — a saved value for a deleted field orphans harmlessly.

### 15.2 Profiles

⛔ **`Profiles.keyFor(base)` is the one route from a store's base name to the key it reads.** Non-legacy profiles get a suffix (`vv_settings_v1:p3`); the legacy profile `p0` resolves to the bare name. ⛔ **`localStorage` is never enumerated** anywhere in the build — no `key(i)`, no `.length`, no `Object.keys` over storage.

⛔ **`activate(id)` resets the runtime to shipped defaults *before* loading the incoming profile.** Loading alone bleeds the outgoing profile's settings onto the incoming one, because the load path is written for a cold boot.

⛔ **`playerId` is minted once, on first activation, never at creation, never regenerated.** Mint-if-missing is the only writer, and it doubles as the backfill path. It is never rendered; `name` is the only user-facing identity.

⛔ **Mint via a `crypto.randomUUID` → `crypto.getRandomValues` fallback.** An opaque origin (sandboxed iframe, itch.io-style embed) is never a secure context, and `randomUUID` is secure-context-only — this exact bug was found and fixed in `kit-profile` and most likely still exists in Orbital Overhaul.

**RESOLVED 2026-08-30** — `kit-profile` is vendored into `lib/` at a pinned `VERSION` and used directly, not reimplemented locally. See §21 and `DECISIONS.md`.

### 15.3 Local high scores

Top 10 per mode. `vv_scores_v1` stays one shared machine-wide table with records additively stamped `profileId` / `profileName`, matching Orbital Overhaul.

### 15.4 Online leaderboard

⛔ **One `Leaderboard` object is the only call surface for `window.KitLeaderboard`.** Nothing else reads that global except the rename flow's notice lookup and the ES-module bridge tag. Every entry point is safe to call with the module absent.

⛔ **`Leaderboard.eligible()` gates every `submit()`**, and it is the same gate the local top-10 check uses. Extend both together or neither.

⛔ **`quitToTitle()` submits `outcome: 'quit'` only when the game was actually playing at the moment it is called, checked *before* that function overwrites the state** — the same function is also game-over's "Quit to Title" row and must never double-submit.

⚠ **SETTLED — `'completed'` has no call site.** Escalating levels forever, no win condition (§3.6). Only `'died'` and `'quit'` are ever submitted. Do not invent a trigger to fill the enum.

**Registration required outside this repo:** add `vector-vortex` to the Worker's `services/leaderboard/src/registry.js`. ⛔ **The registry is readable** at `github.com/freakingid/coinless-kit` — read it rather than guessing, because an unregistered stats key flags every row it posts. Orbital Overhaul shipped exactly that bug in CS033.

Proposed `statsFields`: `level_reached`, `mode`, `start_depth`, `wells_cleared`, `purges_spent`, `max_combo`, `deaths`. A mismatch only flags, never rejects, so extending later is a one-line change — but still a deliberate one, not filler.

Known kit gap: rate limiting is not enforced in production on the Workers Free plan, and the Worker's bounds check is deliberately the entire anti-cheat story. ⛔ **No per-game score validators.**

### 15.5 Achievements

⛔ **The kit forbids achievement-shaped code in every existing module, deliberately, pending a future `kit-achievements`.** So this game owns it — written extraction-shaped: declarative definition table, event-driven evaluator, no reach into game state.

Structure follows Orbital Overhaul's proven v2 shape:

- `lifetimeUnlocked` — Set of non-tiered ids
- `lifetimeTiers` — `{ id: highestTierIndex }`, ⛔ **monotonic: only ever raise, never lower**
- `weeklyUnlocked` — Set, reset when the week rolls
- `weekKey` — ⛔ **ISO year-week, computed in UTC.** Local-timezone boundaries roll over mid-session and differ across devices.

⛔ **Achievement `id` values are save data and are never renamed**, however dated the spelling looks. Renaming one silently drops that unlock for every existing player.

⚠ Following Orbital Overhaul CS037 P6: a resume baseline **raises the evaluation loop's floor; it never writes the persisted tier state.** Those stores are week-scoped, so marking them at resume leaks into any later week.

~24 lifetime plus 5 weekly, rotated deterministically by week number so every player sees the same five.

**⚠ SETTLED 2026-08-30** — local-only. The evaluator emits a payload-shaped object from day one so server-backing later is wiring, not a rewrite. See §21 and `DECISIONS.md`.

### 15.6 Telemetry

Modelled directly on Orbital Overhaul CS039–CS040.

⛔ **`TELEMETRY_FIELDS` is the one source of truth for both row shape and CSV column order.** Adding or reordering a column edits `TELEMETRY_FIELDS` and the matching line in `push()` **together** — the list drives the header, `push()` drives the data, and they must never drift.

⛔ **Capture is a session switch: opt-in, OFF at every launch, never persisted.** A launch must be unable to revive a stale "was ON last session" state. An Options-screen home for it is a control surface over that switch, not a settings store.

⛔ **`read()` rejects any envelope `v` that doesn't match the current shape and returns an empty buffer** — silently dropping a stale run beats exporting a column of the literal string `"undefined"`.

Columns come in three kinds and the names do not tell you which: **instantaneous** (state at the sample instant), **cumulative** (run totals), and **sawtooth** (reset by some event). ⛔ **Sawtooth columns are excluded by name from any monotonicity check.** Document each column's kind at definition.

This is a tuning and debugging instrument. Because the simulation is deterministic — seeded RNG, fixed timestep, one input struct — a run is described by `{seed, mode, startDepth, inputEvents[]}` and replays exactly. ⛔ **It is explicitly not an anti-cheat mechanism** (§15.4).

**⚠ SETTLED 2026-08-30** — strictly local CSV export; nothing is posted anywhere. See §21 and `DECISIONS.md`.

---

### 15.7 Kit boundary and extraction

⛔ **A kit module never reaches into game state**, in either direction. No
`state`, no `C`, no game object. Everything crosses as an explicit parameter or a
callback the game supplies. This mirrors the kit's own "no game code lives here,
ever" constraint, and it is what makes extraction a copy rather than a rewrite.

**Consuming.** Kit modules are vendored into `lib/` at a pinned `VERSION`. A fix
is made to the vendored copy **here**, so it is exercised by a real game before
landing in the shared repo; it must stay game-agnostic; the `VERSION` is bumped
per semver; and backporting to coinless-kit is a **separate manual step**, never
implied by the edit.

⛔ **Every `lib/` module carries a sibling `.NOTES.md`** — the backport packet.
Version bumped, what changed, why, game-agnostic confirmation, backport status.
A coinless-kit reviewer reads that one file, not this game's decision history.
Template: `lib/MODULE-NOTES-TEMPLATE.md`.

**Producing.** Six systems here do not exist in the kit yet and are built
kit-shaped from v1, each carrying a `.NOTES.md` from its first commit that
doubles as draft kit documentation:

| `src/` module | Future kit module |
|---|---|
| `04-input.js` | `kit-input` |
| `15-render-hud.js` (menu/screen-state) | `kit-menu` |
| `16-audio-engine.js` + `18-audio-director.js` | `kit-audio` |
| `14-render-entities.js` (glow/particle primitives) | `kit-fx` |
| `20-achievements.js` | `kit-achievements` |
| `22-meta.js` (local high scores) | `kit-scores` |

⚠ **SETTLED — the per-phase overhead of kit-shaping is accepted deliberately**
(Paul, 2026-08-30). Do not let a module read game state because the boundary felt
inconvenient in one phase.

---

## 16. Technical architecture

### 16.1 Non-negotiables

- Vanilla JS, no frameworks, no runtime dependencies.
- ⛔ **All tunables at the top, grouped by system.** Never inline a magic number. This is the top architectural priority.
- ⛔ Entities are classes: `constructor` / `update(dt)` / `draw()` / `dead`, end-of-frame `.filter()`, never splice mid-loop (§6.5).
- `mulberry32` seeded RNG throughout, including audio variation.
- Fixed-timestep loop with an accumulator and hit-stop; `dt` clamped.
- ⛔ **Count-up timers only.** No countdown pressure. See §16.3.
- Web Audio synthesis only.
- Comments oriented to a future session with no context.

### 16.2 Build shape

Multi-file `src/` with a Node concat build script, per Paul's direction on 2026-08-30 — differing from Orbital Overhaul's single-`<script>` invariant, which was right for that repo and is not carried over.

⛔ **The concatenated single-file build is the behaviour oracle.** Any refactor of `src/` must match it exactly. The shipped file must open and play from `file://` by double-click.

⛔ **External runtime files are optional enhancements, never required.** Load as classic `<script src>`, never `fetch()` or `import` — both fail on `file://`. The one exception is a third-party ES module (the leaderboard bridge) loaded by a `<script type="module">` tag whose only job is handing exports to a `window.*` global; it carries no game logic and fails on `file://` by design. Wrap every load so failure is caught; **absence is the normal fallback path.** No leaderboard module means the game plays without a leaderboard.

⛔ **Outbound links go through one `openExternal(url)` helper**, always `window.open(url, "_blank", "noopener")`. Without `noopener` the opened page gets a live handle back into the game.

### 16.3 ⚠ SETTLED — count-up timers and finite effects

Powerup expiry and jump cooldown are finite intervals. The house rule targets *session pressure* — the arcade "HURRY UP" clock — not internal state. Resolution: internal timers count **up** toward a threshold (`token.age >= TOKEN_LIFE`), never down. The UI shows a depleting ring with **no numerals** and no ticking. No timer is ever displayed as a number counting toward zero.

### 16.4 Repository layout

```
vector-vortex/
├── CLAUDE.md                    # rules, invariants, code map. ⛔ under 50 KB
├── STATUS.md                    # current changeset only, ⛔ under ~400 lines
├── RATIONALE.md                 # why the rules exist; read on demand only
├── DECISIONS.md                 # off-cycle judgment calls
├── ROADMAP.md                   # changeset sequence to ship; on demand only
├── VECTOR-VORTEX-GDD.md         # this document, with its §0 read contract
├── DIFFICULTY-NOTES.md          # the heat curve, documented
├── EXTERNAL-FILES.md            # runtime files the build loads
├── PLANNED-FEATURES-CS0##.md    # spec for what's being built now
├── IMPLEMENTATION-PHASES-CS0##.md
├── build.js                     # Node concat src/ → dist/
├── src/                         # numbered modules, concat order
├── tools/                       # design instruments — music-lab, art labs
├── scratchpad/                  # tests: _harness.js, run-all.js, test-registry.js
├── log/CS0##.md                 # per-changeset narrative + version history
├── archive/                     # spent planning docs
└── dist/vector-vortex.html
```

⛔ **`log/` and `archive/` are not session context.** Pull one file in only when a question genuinely needs project history, and say you did.

⛔ **The GDD is read by named subsection, not in bulk.** §0 + §1 always, then what the phase names. ⛔ If §0 has no row for what you are editing, that is a defect in §0 — record it in `STATUS.md` rather than working around it.

### 16.5 Session rules

Carried over from Orbital Overhaul, which has 41 changesets of evidence behind them.

1. Read `STATUS.md` first; update it at session end.
2. ⛔ **One phase per session.** Build only what the phase scopes. Do not build ahead.
3. ⛔ **Implementation only.** If a genuine design decision surfaces that the planning doc doesn't cover, **stop and surface it.** Do not invent design.
4. Commit per phase on `main`; code and docs in the same commit. ⛔ **Never push** — that is Paul's.
5. ⛔ **Edit docs in place.** Never print a doc for copy-paste.
6. Prefer `str_replace` over full-file rewrites. Re-read the region first.
7. ⛔ **Don't refactor unprompted.** Propose it.
8. Phases flag their own risks in `STATUS.md`.

---

## 17. Testing

⛔ **New tests use `scratchpad/_harness.js`**, which owns loading the build, extracting the script, stubbing `window` / `document` / `performance` / `requestAnimationFrame` / `navigator` / `localStorage`, and the assert counters. Do not hand-roll a sandbox. Do not hand-roll world dimensions — read them from the build.

⛔ **Drive the real code.** Real `startGame` / `nextWell` / `update(1/60)` / `draw`. **Never inline a copy of the logic under test.**

⛔ **A test asserts only what its own phase owns** — never a global count or inventory of things it did not build. ⛔ **Global counts live in exactly one place, `scratchpad/test-registry.js`.**

⛔ **Run `run-all.js` before committing.** Non-zero exit means not done. A phase may not leave the suite redder than it found it. Failure-only output.

⛔ **Seed before the first build** — some nondeterminism is spent at module load, so a seed installed afterward fixes nothing.

⛔ **Frame-budget gates are counter-based, never wall-clock.**

Required coverage:

1. **Determinism** — same seed and inputs, identical state hash after 10,000 ticks.
2. **Geometry** — all 16 wells: lane count matches vertices, no NaN in any derived position.
3. ⛔ **Enemy wall behaviour** — no entity's lane leaves `[0, lanes-1]` on any open well, 5,000-tick soak each. Written against the §3.5 bug.
4. **Shot cap** — never exceeds `SHOT_MAX` under held fire.
5. **Purge** — first use clears all enemies and zero Thorns; second removes exactly one.
6. **Carrier splits** — correct count and type per variant.
7. **Heat monotonicity** — `heat(n+1) > heat(n)` for n in 1..200; every derived value inside its clamp.
8. **Scoring** — total equals the sum of logged events.
9. **Audio** — intensity stays in `[0,1]`; tier changes land only on bar boundaries; ⛔ worst-case node creation for a single scheduled step asserted under a ceiling, as Orbital Overhaul does.
10. **Achievements** — every predicate reachable; none throws on empty state; tiers monotonic.
11. **Telemetry** — `TELEMETRY_FIELDS` and `push()` agree in length and order.
12. **Soak** — 100 seeded runs to game over, no exception, no NaN, no unbounded array.

**Performance budget:** 60 fps with 16 enemies, 8 shots, 2 tokens and full particles on a 2019 mid-range laptop and a 2021 mid-range phone. Preallocated entity arrays, no per-frame allocation in the hot path.

---

## 18. Legal safety

Atari blocked Jeff Minter — co-creator of *Tempest 2000* — from shipping *TxK* ports over close resemblance, citing press describing it as essentially Tempest. The mechanic is not protectable. Trade dress and terminology are the exposure.

1. No "Tempest," no `T-####` naming, no Atari marks anywhere — code, comments, docs, marketing.
2. ⛔ **No Atari entity names** — Flipper, Fuseball, Pulsar, Tanker, Spiker, Superzapper, Blaster, Web. §3.1 is the only vocabulary, **including code identifiers.**
3. Our own silhouettes. No bowtie Flipper, no Medusa Fuseball, no spiral Spiker.
4. Our own palette and shapes. Sixteen is a structure, not an asset; Pinwheel, Stair and Fan are ours.
5. Deliberate visual divergence per §10.1.
6. No reference to Tempest in store text, page copy, or metadata.

**Review threshold:** if a reasonable reviewer would call this "a Tempest clone" rather than "a tube shooter," revise. Recognisably *of the genre*, unmistakably *not the game*.

---

## 19. Acceptance criteria

**Core** — all 16 wells render and play, open clamps and closed wraps for player *and* enemies; rim movement proportional on mouse, gamepad, touch, with keyboard tap/hold working; traverse-and-stop verified on every device; six Classic enemies and three Carrier variants correct; Purge including the weak second use; Thorns block the Dive and survive the Purge; in-flight shots clear at dive start; Start Depth selects, expands, and pays; playable title → mode → depth → play → death → game over → restart.

**Overdrive** — five tokens, max two on screen; Jump with cooldown and unmistakable airborne state on three channels; combo builds, decays, displays, feeds the director; Reaver and Warden correct; Mimic present and flagged for playtest; ring-flight inside its 4 s / 6 ring cap.

**Audio** — per-frame lookahead scheduling, no `setTimeout`/`setInterval` for notes, no audible drift over 10 minutes; flagship tracks ≥ 90 s before loop; ⛔ **every gated layer passes the solo audition**; tier changes only on bar boundaries; intensity rises ~0.4 s and falls ~2.5 s; filter sweep audible end to end; Surger charge audible over music at every tier, verified by ear on hardware; volume sliders persist per profile.

**Meta** — profiles with `keyFor` routing and no storage enumeration; `playerId` minted once with the secure-context fallback; local top-10 per mode; separate online boards; `vector-vortex` registered with stats keys read from the real registry; achievements with monotonic tiers and UTC ISO weeks; telemetry opt-in and off at launch, `TELEMETRY_FIELDS` and `push()` in agreement.

**Quality** — all 12 test groups pass; 60 fps under budget on both targets; nothing obscures `depth < 0.25`; concat build behaviourally identical to `src/`; plays from `file://`; no Atari terminology anywhere including identifiers.

---

## 20. Assumptions and decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | Continuous `(lane, depth)`, screen position derived at render | Collapses entity math to 1-D, one code path for 16 shapes, fully headless-testable |
| 2 | Snap assist when input is idle | Removes lane ambiguity without fighting input; top clone failure mode |
| 3 | Keyboard tap/hold dual mode | The only way a digital key gives both spinner affordances |
| 4 | Auto-fire default on touch | Coupled to Jump's existence; three simultaneous touch inputs otherwise |
| 5 | Introduction schedule compressed vs the original | Ceiling ~35–40, not ~99; a threat at L41 does not exist |
| 6 | Dim band at 18%, not invisible | Unknown browser gamma; P2 |
| 7 | No score rollover | The 999,999 rollover was a bug |
| 8 | Timers count up; UI shows a numberless ring | Honours no-countdown-pressure while allowing finite effects |
| 9 | Companion droid deferred | Worst value-per-risk: expensive AI, muddies attribution, reduces agency |
| 10 | Level skip cut | Redundant with Start Depth; two skip mechanisms break comparability |
| 11 | Beastly mode deferred | Gated behind level 99 |
| 12 | Ring-flight capped at 4 s / 6 rings, reusing the depth model | Keeps it a breath; first scope cut |
| 13 | Mimic on probation | Reflected shots violate a deep expectation |
| 14 | Separate boards per mode | Score scales not comparable |
| 15 | Achievements built here, extraction-shaped | Kit forbids achievement-shaped code in every module, deliberately |
| 16 | UTC ISO week | Local boundaries roll mid-session and differ across devices |
| 17 | Telemetry local, opt-in, explicitly not anti-cheat | Kit rules out server-side score reconstruction |
| 18 | **Per-frame lookahead scheduler, adopted from Orbital Overhaul** | Proven; its `never setTimeout` rule is carried over verbatim |
| 19 | **Track data is Orbital Overhaul's step-sequencer table, unchanged** | The scheduler consumes it unmodified; new tracks are data |
| 20 | **Intensity layering re-opened, narrowly** | Paul's call, 2026-08-30, on the diagnosis that the failure was compositional |
| 21 | **The standalone/solo test is the audition gate** | Paul's diagnosis: the old layers were "undefined, muddy garbage." A part, not a texture |
| 22 | **Melody lives in the foundation, never gated** | Direct fix for the wave-11 finding |
| 23 | **Scope: filter sweep + 2–3 earned layers, not 5 tiers** | Five tiers is where the clutter came from |
| 24 | Asymmetric smoothing, bar-boundary latching | Symmetric flutters; mid-phrase entry sounds like a bug |
| 25 | Reactive visuals from the scheduler, not an analyser | Analyser latency defeats the point |
| 26 | **Entities are classes** | Matches Orbital Overhaul's shipped contract |
| 27 | **Multi-file `src/` + concat build** | Paul's direction, 2026-08-30; differs from OO's single-script invariant |
| 28 | Overdrive is flags in the config, not a fork | One oracle, one test surface |
| 29 | Doc and session conventions carried from Orbital Overhaul | 41 changesets of evidence |
| 30 | Start Depth bonus counts toward score; `start_depth` also a stats field | Preserves the arcade feel while leaving a board filter possible |
| 31 | Kit modules vendored to `lib/` at a pinned VERSION, fixed here, backported manually | The fix is exercised by a real game before it reaches the shared repo |
| 32 | Every kit module carries a sibling `.NOTES.md` backport packet | A coinless-kit reviewer reads one file, not this game's history |
| 33 | Six further systems built kit-shaped from v1 | Extraction becomes a copy rather than a rewrite; overhead accepted |

---

## 21. Open questions

None. All seven resolved as of 2026-08-30; see `DECISIONS.md`.

1. ~~**Dim band (§3.7)**~~ — **RESOLVED 2026-08-30.** Kept as specced: levels
   65–80 at `DIM_BAND_ALPHA` 0.18, lanes lighting on occupancy, shot travel and
   Surger charge. ⛔ No tuning time is spent on it; revisit only if telemetry
   shows a player past level 65.
2. ~~**Start Depth and the board (§4.6)**~~ — **RESOLVED 2026-08-30.** The bonus counts toward the submitted score, and `start_depth` ships as a registered stats field so a "from level 1" board filter is possible later without a schema change.
3. ~~**Kit consumption (§15.2)**~~ — **RESOLVED 2026-08-30.** Kit modules are vendored into `lib/` at a pinned `VERSION` and used directly. Fixes are made to the vendored copy here, kept game-agnostic, and backported to coinless-kit as a separate manual step. Six further systems are built kit-shaped from v1 for later extraction. See §15.7.
4. ~~**Achievements (§15.5)**~~ — **RESOLVED 2026-08-30.** Local-only. The
   evaluator emits a payload-shaped object from day one so server-backing later
   is wiring, not a rewrite.
5. ~~**Aggregate telemetry (§15.6)**~~ — **RESOLVED 2026-08-30.** Strictly local
   CSV export; nothing is posted anywhere.
6. ~~**Mimic**~~ — **RESOLVED 2026-08-30.** Build it. ⚠ Stays on probation —
   cut in CS015 without ceremony if reflected shots read as cheap.
7. ~~**Track count for v1**~~ — **RESOLVED 2026-08-30.** Three at launch:
   `title`, `pulse`, `drive`. `deep` and `rush` are post-ship data-table
   additions.

---

## 22. What changed from v0.1.0

v0.1.0 was written believing the Orbital Overhaul repo contained only a LICENSE. A stale cached fetch reported one commit; that contradicted known context and should have been caught. The repo is at version 1.0.0.40, changeset CS041, with a 1 MB build, a 528 KB GDD, and 41 changesets of conventions.

| Was wrong | Now |
|---|---|
| "No classes, flat plain objects" as a house rule | Entities are classes (§6.5, §16.1) |
| `setInterval` audio scheduler | Per-frame lookahead, never `setTimeout`/`setInterval` (§11.2) |
| Invented arrangement/pattern track format | Orbital Overhaul's step-sequencer table (§11.3) |
| "≥100 s before loop" with no baseline | Baseline is 21.8–48 s; target ≥ 90 s (§11.3) |
| Intensity layering proposed as new | Already built, auditioned, and frozen in v3.5; re-opened deliberately and narrowly (§11.4–11.5) |
| Meta systems invented from kit docs | Specced against shipped implementations (§15) |
| Invented repo and doc layout | Matches Orbital Overhaul's conventions (§16.4–16.5) |
| Invented test approach | Harness rules carried over (§17) |
| Decision log line 23 asserted the repo was empty | Removed; this section replaces it |

---

## 23. Out of scope for v1

Two-player modes, level editor, mod support, app packaging, server-verified replays, seasonal events, in-game currency, and morphing wells (Tempest 3000's moving webs invalidate the static geometry assumption the entire depth model rests on — a v2 conversation or never).
