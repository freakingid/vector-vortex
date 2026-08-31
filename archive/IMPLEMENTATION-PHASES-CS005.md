# IMPLEMENTATION-PHASES-CS005

One phase per Claude Code session. `/clear` between phases. Commit per phase on
`main`; never push.

Each phase below is the literal prompt to paste. Keep them self-contained — a
session reads `CLAUDE.md` and `STATUS.md` automatically, and nothing else unless
the prompt names it.

⛔ **`ultrathink` appears inside the prompt text where it is wanted.** It is a
per-turn lever, not a session setting, so it has to be in the pasted message.

**Baseline:** CS004 closed at `74fb50c`. `node build.js` green (24 modules),
`node scratchpad/run-all.js` green — 19 files, zero skips. `test-registry.js`
has `enemies: 4` and `enemyKinds: 5`. GDD §6.5 lists seven contract fields and
six wiring points. `C.SURGE_TELEGRAPH`, `C.DRIFTER_COLOR`, `C.SURGER_COLOR`,
`C.PTS_DRIFTER` and `C.PTS_SURGER` all exist and are all unread.

| Phase | Builds | Model | Effort |
|---|---|---|---|
| P1 | The boundary lattice — `laneHop` bounds, `boundaryFrom` | Opus 5 | **high** |
| P2 | The Drifter — ride, cross, armour, two visual states | Opus 5 | **high** |
| P3 | The Surger — the cycle, the fuse, the discharge | Opus 5 | **high** |
| P4 | The last two cargo rows | Opus 5 | medium |
| P5 | Soak, docs, close | Opus 5 | **high** |

High effort where a wrong first guess costs a later changeset. P1 changes a
helper every hopping entity in the game will ever use. P2 sets a `killDepth` two
shipped comments currently predict wrong, and its birth model is the only shape
that keeps three closed changesets' tests green. P3 mutates a contract field for
the first time and its constant relationship with `RESPAWN_INVULN` is a safety
invariant. P5 owns three §17 items across the completed roster.

P4 is medium because CS004 built its tests already — three table rows and two
glyphs, against loops that exist. It is also the natural place to absorb
overflow from P2 or P3.

---

## P1 — the boundary lattice

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §0, §1, §3.2, §3.5,
> §6.1, §6.3, §17. Then read `src/03-wells.js` end to end — all of it, including
> the header. ultrathink.
>
> No entity this phase. Geometry only, and the point of doing it alone is that
> the change touches a helper every hopping entity in the game will ever use.
>
> **1. What the Drifter needs, and why `laneHop` cannot give it today.**
>
> The Drifter (P2) rides lane *boundaries* — half-lanes. Its lane coordinate
> changes only during a cross, and a cross is exactly one lane unit from one
> boundary to the next, so it is a hop and it goes through `laneHop()`. What
> moves continuously on a Drifter is its *depth*, along the boundary.
>
> `laneHop` mirror-folds an open well about lane `0` and lane `lanes - 1`, which
> are the extreme legal positions for a lane-*centre* entity. Verified against
> the current build:
>
> ```
> laneHop(Vee, 0.5, -1, -1)   →  { lane: 0.5,  dir: +1 }
> ```
>
> A cross that lands where it started. `07-enemies.js` documents this exact case
> at `Vaulter.startHop` and correctly dismisses it — *"a half-lane, which no
> spawner produces"*. The Drifter invalidates that premise permanently, and for
> it the degenerate case is the normal case at the wall: a whole vulnerable
> crossing window in which the entity announces itself as shootable and then
> does not move.
>
> ⛔ **This is NOT a bug in `laneHop` and you are not fixing one.** The fold
> points are correct for the Vaulter and stay correct for it forever. A
> boundary-rider's extreme legal positions are `0.5` and `lanes - 1.5`. Two
> entities want different fold bounds, not a different helper.
>
> **2. ⛔ Give `laneHop` optional fold bounds.**
>
> `laneHop(well, lane, delta, dir, lo, hi)` where `lo` defaults to `0` and `hi`
> defaults to `well.lanes - 1`. On a closed well nothing changes — it wraps and
> the bounds are moot. On an open well the mirror-fold reflects about `lo` and
> `hi` instead of about `0` and `max`.
>
> ⛔ **The four-argument form must be bit-identical to what ships today.** Do not
> take my word for it — assert it. Write a sweep in your test that walks all
> sixteen wells × lane values at quarter-lane resolution over a range that
> exceeds the strip in both directions × deltas including `±0.5`, `±1`, `±2` and
> `0` × both directions, and asserts the result is `Object.is`-identical on
> `lane` and identical on `dir` to the current behaviour. I have run this sweep
> and it comes back with zero mismatches; if yours does not, your
> generalisation is wrong, not mine.
>
> ⛔ Keep the name. `07-enemies.js`'s Vaulter header carries the invariant "EVERY
> LANE HOP GOES THROUGH `laneHop()`", and the Drifter must be able to obey it. Do
> not add a second helper with a second copy of the mirror-fold —
> `RATIONALE.md#depth-model` says why that particular piece of math must not
> exist twice.
>
> ⛔ Do not touch the Vaulter. Its call site is unchanged.
>
> **3. The lattice accessors.**
>
> `laneBoundaryLo(well)` and `laneBoundaryHi(well)`, returning `0.5` and
> `well.lanes - 1.5` on an open well. ⛔ **Numbers, not an object** — these are
> called from a per-frame path and `{lo, hi}` would allocate every call, which
> §17's perf budget forbids.
>
> Document, at the helper, **why the two outermost boundaries do not exist.**
> This is not obvious and it is not only `laneClamp`: `polyAt()` clamps an open
> well's vertex parameter to `[0.5, n - 0.5]`, which is lane `[0, n-1]`, so lane
> `-0.5` and lane `n-0.5` project to the same points as the lane *centres* `0`
> and `n-1`. The walls are not drawable, let alone ridable. A 13-lane Vee has
> **twelve** ridable boundaries, not fourteen. On a closed well all `n`
> boundaries are legal and drawable — check `polyAt(Ring, 15.5)` yourself and
> confirm it lands on vertex 0.
>
> **4. ⛔ `boundaryFrom(well, lane, dir)` — the birth helper.**
>
> A Drifter is spawned at an integer lane centre and crosses onto the lattice on
> its first update. This returns the boundary it crosses to and the heading it
> keeps: `{ lane, dir }`.
>
> - Closed: `laneWrap(well, lane + dir * 0.5)`, `dir` unchanged. There is no
>   wall. Lane 0 heading down gives `lanes - 0.5`, which is a legal boundary.
> - Open: `lane + dir * 0.5`, and if that leaves `[lo, hi]`, **reverse `dir`
>   once** and take the other side.
>
> ⛔ **One reversal always suffices, and prove it in the test rather than
> asserting it in a comment.** Exhaustively: every integer lane of each of the
> six open wells, both directions — the result is always on the lattice and
> always within half a lane of the input. It holds because a strip of three or
> more lanes has a legal boundary on the other side of every lane centre, and
> every shipped well has at least eleven.
>
> ⛔ **This does NOT go through `laneHop`.** Folding an off-lattice start about
> the lattice bounds overshoots: `laneHop(Vee, 0, -0.5, -1, 0.5, 11.5)` returns
> lane **1.5** — a lane and a half in one cross time, three times the Drifter's
> lane speed, which P5's soak would read as a teleport. Try it and see before you
> decide otherwise.
>
> ⛔ **This helper is where `well.closed` is read**, so that P2 can keep the
> property the Vaulter's header claims: nothing in `07-enemies.js` touches the
> topology, which is the only reason an entity behaves on a Ring and on a Fan
> without a branch.
>
> **5. The test.**
>
> `scratchpad/test-cs005-p1.js`, through `_harness.js`, driving the real
> helpers out of `dist/`. `installSeed(n)` above everything. Cover: the
> equivalence sweep (point 2), the lattice accessors on all sixteen wells, the
> `boundaryFrom` exhaustion (point 4), and the boundary cross itself —
> `laneHop(Vee, 0.5, -1, -1, 0.5, 11.5)` must return `{ lane: 1.5, dir: +1 }`,
> i.e. it moves a full lane and reverses rather than standing still.
>
> ⛔ Assert only what this phase owns. No entity counts, no global inventories —
> those live in `scratchpad/test-registry.js` and this phase does not change it.
>
> ⛔ Run `node build.js` and `node scratchpad/run-all.js` before committing.
> Nonzero exit means not done. `test-cs003-p5.js` and `test-cs004-p5.js` must
> both still be green and neither may be edited.
>
> **6. Docs.** GDD §3.5 gains a paragraph on the boundary lattice — what it is,
> why the outer two do not exist, and that the fold bounds are a parameter
> because two entity classes sit on two lattices. Update `STATUS.md`'s phase
> ledger. ⛔ Edit in place; do not print a document for copy-paste.

---

## P2 — the Drifter

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §0, §1, §3.5, §4.5,
> §6.1, §6.3, §6.5, §10.2, §10.3, §12. Then read `src/07-enemies.js` end to end
> — the Vaulter is your movement precedent, the Weaver's bolt is your armour
> precedent — plus `src/09-collision.js` and the `entityPoints()` header in
> `src/14-render-entities.js`. ultrathink.
>
> This is the hardest entity in the Classic roster. Its failure mode is not "too
> hard", it is a death the player cannot account for, which GDD §6.3 names as the
> most common complaint about clones.
>
> **1. ⛔ Its `killDepth` is `1 - C.RIM_CONTACT_DEPTH`, and two comments in the
> build currently say otherwise. Read this before you write the constructor.**
>
> `src/07-enemies.js`'s base-class `killDepth` note and `src/09-collision.js`'s
> `collideSkimmer()` header both predict *"the Drifter will be 0 (lethal at any
> depth, GDD §4.5 item 2)"*. **They are wrong and you are correcting them.**
>
> `collideSkimmer()` is `e.depth >= e.killDepth` plus a lane match, and there is
> no term for where the Skimmer is — because the Skimmer is always at depth 1.
> So `killDepth = 0` does not mean "kills on contact at any depth". It means
> every legal depth is a kill zone. `pickSpawnLane()` draws a lane with no
> reference to the player and `updateSpawner()` spawns at depth 0, so a Drifter
> released into the player's lane would kill them **on the spawn step, from the
> throat, having travelled nowhere**. Frequent, free, and exactly the death
> §6.3's ⛔ exists to prevent.
>
> Paul's call, recorded in `PLANNED-FEATURES-CS005.md` finding 1: `killDepth` is
> `1 - C.RIM_CONTACT_DEPTH`, the same expression the Vaulter, the Carrier and the
> bolt use, so retuning the band moves them together. §4.5 item 2's "any depth"
> means **there is no safe phase** — a Drifter kills you while armoured, so you
> can neither shoot it nor touch it — where the Weaver has no lethal phase at
> all. That is the distinction the condition is listed for.
>
> ⛔ **Correct both comments in this commit.** A comment predicting a value reads
> as shipped truth to the next session; CS003 P1 and CS004 P1 both swept stale
> pointers for exactly this reason.
>
> ⛔ Do not give the Skimmer a `depth` field to make `0` honest. That is CS006's
> Dive and CS011's Jump, and building it now is building ahead. Note in the
> comment that `0` becomes correct the moment the craft can leave the rim, and
> that it is then a one-line change.
>
> **2. ⛔ How it is born, and why this shape and no other.**
>
> A Drifter is constructed at the lane centre `spawnEnemy()` handed it, and its
> **first `update()`** starts a half-cross onto the nearest legal boundary via
> P1's `boundaryFrom()`, over `C.DRIFT_CROSS_TIME * 0.5`.
>
> ⛔ **The constructor must not snap, and must not need a `well`.** This is
> verified, not stylistic. Three closed changesets' test files depend on it:
>
> - `scratchpad/test-cs004-p1.js` probes every `ENEMY_KINDS` row as
>   `ENEMY_KINDS[kind](0, 0, 1)` with no well in scope at all.
> - `scratchpad/test-cs004-p2.js` and `scratchpad/test-cs004-p5.js` both loop
>   over `CARGO`, split a Carrier, and assert the children land in
>   `splitLanes()`' exact integer lanes and at the parent's exact depth. A
>   constructor that snapped would turn both red the moment P4 adds
>   `CARGO.drifter`.
>
> ⛔ **You may not edit any of those three files.** If you find yourself wanting
> to, the birth model is wrong.
>
> It is also the better read on its own merits: the Drifter emerges from the
> throat visibly **vulnerable** and only becomes armoured once it settles, so the
> player is shown the vulnerable state at the depth where they have the most
> time. §1.1 P2 delivered by the movement model rather than by a rule. Write
> that down.
>
> **3. The cycle.**
>
> ```
> birth   half-cross onto the lattice, C.DRIFT_CROSS_TIME * 0.5.  VULNERABLE
> ride    on the boundary, C.DRIFT_RIDE_TIME.                     INVULNERABLE
> cross   one lane to the next boundary, C.DRIFT_CROSS_TIME.      VULNERABLE
> ride    …
> ```
>
> - ⛔ **Depth climbs at `C.DRIFT_CLIMB` in BOTH phases**, stopping at 1 the way
>   the Vaulter's does and for the same reason (`depth > 1` is not a legal
>   position). This removes a whole failure mode by construction: an unshootable
>   entity that never advances is a permanent concurrency squatter, which is the
>   shape of the Thorn stall `STATUS.md` carries. Write down that this is why.
> - ⛔ **The phase is the state**, and the timers count UP (§16.3). The Weaver's
>   `phase` field is your precedent. No second flag saying which way anything is
>   moving.
> - ⛔ **The cross goes through `laneHop`** with P1's bounds
>   (`laneBoundaryLo/Hi(well)`), and ⛔ **the returned `dir` is written back**.
>   Read the Vaulter's `startHop` header before you write it: an enemy that keeps
>   its own heading and asks the helper only for a position grinds against a wall
>   forever, and that is GDD §3.5's named bug.
> - **Homing.** Above `C.DRIFT_HOME_DEPTH`, the next cross's direction comes from
>   `laneDelta(well, this.lane, skimmer.lane)` — reuse the shape of
>   `Vaulter.huntDir()`, including its three null cases. Below it, the stored
>   heading carries. §6.1's "homes near rim".
> - The lane interpolates continuously through a cross, as the Vaulter's does,
>   and lands exactly rather than on the last interpolated step.
> - ⛔ **It spawns nothing, ever.** `test-cs004-p1.js`'s `spawnRow` case filters
>   the board for entities the row's own members created, and it expects exactly
>   one source of those (the Weaver's Thorn).
>
> **4. ⛔ The armour, and the two reads that make it fair.**
>
> `onShot(shot)` is the roster's first phase-dependent one: `return false` while
> riding — the shot is not consumed and flies on, exactly as the Weaver's bolt
> does — and kill-and-consume while crossing. The Purge kills it in **either**
> phase (`purgeable = true`, §6.1's "Purge anywhere"), which needs no code.
>
> GDD §6.3 carries a ⛔ on this being visible at a glance, and §12's first-Drifter
> prompt string tells you the visual language it expects:
> `SOLID = ARMOURED · OPEN = VULNERABLE`. So there are **three independent
> channels**, and all three are available with no renderer change:
>
> | Channel | Riding | Crossing |
> |---|---|---|
> | Silhouette | a compact poly, drawn **closed** | a splayed poly, drawn **open** |
> | Stroke width | `laneLineWidth(depth) * C.DRIFT_RIDE_WIDTH` | `* C.DRIFT_CROSS_WIDTH` |
> | Alpha | `C.DRIFT_RIDE_ALPHA` | `1` |
>
> `glowStroke`'s glow spread is `width * C.GLOW_WIDE_W`, so a narrower width is
> literally a harder edge. ⛔ **Touch no global glow constant** — `GLOW_WIDE_W`,
> `GLOW_WIDE_ALPHA` and `GLOW_THIN_ALPHA` are shared with the well and every
> other entity, and retuning them is an art pass across the whole build.
>
> ⛔ **Two polys, not one poly restyled.** `entityPoints()` memoizes a scratch
> array per poly array, so a second poly costs one projection loop and zero
> allocation — the Carrier's shipped hull-and-glyph pattern. One poly drawn
> closed then open loses a single edge, which is not a read at a glance.
>
> GDD §6.1's silhouette is a "tumbling spark cluster". ⛔ It has to be **ours**
> (§18 item 3) and it has to be unmistakable from the Vaulter's flattened X, so
> no four-armed radial shape. Full alpha rules do not apply here — the alpha
> difference *is* the feature — but the riding state must still be clearly
> legible at throat depth. Judge it with key `5` before you commit.
>
> ⛔ **Assert the separation from the constants**, in your test:
> `C.DRIFT_CROSS_WIDTH / C.DRIFT_RIDE_WIDTH >= 2.0`, `C.DRIFT_RIDE_ALPHA <= 0.7`,
> and that the two polys are different arrays drawn with different `closed`
> arguments. §6.3's ⛔ is an art rule and art rules rot silently; this is what
> stops a future retune collapsing the two reads into one. It is also why this
> changeset does **not** build `tools/glow-lab.html`.
>
> **5. Wiring.**
>
> `drifter` in `ENEMY_KINDS` (`src/08-spawner.js`) — the factory takes `dir` and
> uses it, unlike every row shipped so far. `spawnDrifter` on key `"5"` in
> `actionKeys`, and one line in `runAction()`. ⛔ Named action, no second
> listener. `DEBUG_ROW_KINDS` already lists `drifter` and the stagger is already
> computed on six entries — ⛔ do not touch it.
>
> ⛔ `scratchpad/test-registry.js`: `enemies` 4 → 5, `enemyKinds` 5 → 6. That
> file is the only place a global count may live.
>
> ⛔ `C.DEBUG_SPAWN_KINDS` still ships as `["vaulter"]`. It is a bench, not a
> difficulty knob; its own header says so. Your test sets its own list.
>
> **6. The test.** `scratchpad/test-cs005-p2.js`. Drive real
> `startGame`/`update(1/60)`; never inline a copy of the logic. Cover the birth
> (constructed lane and depth `Object.is`-identical to the arguments), the cycle,
> the lattice, the wall behaviour on all six open wells, the phase-dependent
> `onShot` with a **mutation check** (a Drifter that consumes a shot while riding
> must turn it red), the Purge in both phases, `killDepth`, and the separation
> gate.
>
> ⛔ Run `node scratchpad/run-all.js` before committing. Zero skips, and
> `git diff --stat` must show no test file from CS003 or CS004 touched.
>
> **7. Docs.** GDD §6.1's Drifter row and §6.3 gain a "Shipped, CS005" paragraph
> — the boundary lattice, the birth cross, the three-channel read, and the
> `killDepth` correction with its reasoning. `STATUS.md`: ledger, and a playtest
> ask for the two states on a busy well. ⛔ Edit in place.

---

## P3 — the Surger

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §0, §1, §4.4, §4.5,
> §6.1, §6.3, §6.5, §10.2, §10.3. Then read `src/09-collision.js` end to end,
> `drawThorn()` at the foot of `src/14-render-entities.js`, and
> `respawnSkimmer()` in `src/23-main.js`. ultrathink.
>
> The Surger is the roster's first entity whose lethality is a **phase of its own
> cycle** rather than a fixed depth. GDD §6.3 puts a ⛔ on the telegraph: *fair
> difficulty is a visible fuse.*
>
> **1. ⛔ The discharge is a mutated `killDepth`. No eighth contract field.**
>
> Verified against `collideSkimmer()` as written. With `killDepth = 0` the test
> `e.depth >= e.killDepth` is unconditionally true, so the only remaining term is
> `laneHit()` — which is precisely §4.5 item 3, "being in a Surger's lane when it
> discharges". `Game.update()` runs the entity pass before the collision pass, so
> a Surger that enters the discharge on step *n* is lethal on step *n*.
>
> So: `killDepth = 1 - C.RIM_CONTACT_DEPTH` normally, mutated to `0` for the
> discharge window, restored on exit. Document at the field that this is a
> **cycle phase expressed in an existing field**, that the collision pass needs
> no branch for it, and that this is the return the contract was designed to pay.
>
> ⛔ Do not add a field. If you find you cannot express the discharge in the seven
> that exist, stop and surface it — do not add an eighth quietly.
>
> ⚠ Note the asymmetry with P2 and write it down: `killDepth = 0` is right here
> and wrong on the Drifter. On the Drifter it would be a permanent property of a
> climbing enemy; here it is a `C.SURGE_DISCHARGE` window the player was given a
> 0.45 s fuse to leave.
>
> **2. The cycle, and two rules the GDD does not spell out.**
>
> ```
> climb       depth rises at C.SURGE_CLIMB. surgeTimer counts UP toward
>             C.SURGE_INTERVAL. killDepth = the rim band.
> telegraph   C.SURGE_TELEGRAPH (0.45 s, already in C, unread until now).
>             The lane brightens throat -> rim as a growing segment.
>             killDepth = STILL the rim band.
> discharge   C.SURGE_DISCHARGE. killDepth = 0. The whole lane is live.
> climb       …
> ```
>
> - ⛔ **The lane is never lethal during the telegraph.** A fuse that kills is not
>   a fuse. This is the whole of §6.3's rule.
> - ⛔ **It starts in `climb` with `surgeTimer = 0` and can never discharge on its
>   first step**, from any spawn depth. A Surger that arrives already discharging
>   is the same unaccountable death P2's `killDepth` correction is about. It also
>   keeps `test-cs004-p1.js`'s `spawnRow` case green — that test drives one
>   `G.update(DT)` over a freshly spawned row and the Surger is in it.
> - ⛔ **`C.SURGE_DISCHARGE` must be strictly less than `C.RESPAWN_INVULN`, and
>   you assert it from the constants with the reason at the assertion.** §4.4's
>   rim push clamps enemies down to `RESPAWN_PUSH_DEPTH` on respawn so the player
>   is never killed on re-entry — but a `killDepth = 0` entity is still lethal at
>   0.55, so the push does nothing here and the invulnerability window is the
>   only thing protecting the player. That relationship is an invariant, not a
>   coincidence, and CS006's heat curve is what would break it.
> - ⛔ **One lane, never hops.** Touch no lane helper; `lane` is written once, by
>   the constructor. That is the Carrier's and the Weaver's "absence of code",
>   and it is what lets P5 give the Surger the *strong* lane assertion —
>   `Object.is` equality — rather than a speed bound.
>
> Otherwise ordinary: climbs, stops at the rim, any shot kills and consumes, the
> Purge kills it, it blocks the clear.
>
> **3. The silhouette and the fuse.**
>
> GDD §6.1's silhouette is a **zigzag bar**. ⛔ Ours (§18 item 3), and it must be
> unmistakable from the Vaulter's flattened X and the Weaver's spiral — an open
> path with square corners running across the lanes, not a coil and not a
> wingspan. `entityPoints()` + `drawPoly` + `glowStroke`, full alpha at every
> depth, as every other silhouette has it.
>
> ⛔ **The telegraph is an entity draw, not `laneState`.** `Game.draw()` passes
> `null` for `drawWell`'s `laneState` parameter and no caller passes one; wiring
> it is CS006's, with the dim band. `isLaneLit()` is a boolean over spokes and
> cannot express a progressive fill anyway.
>
> The pattern is `drawThorn()`'s, which its own header already names as the
> telegraph's precedent: preallocated scratch points, `screenPos` per end,
> `drawPoly`, `glowStroke`. ⛔ **Its own scratch points, not the Thorn's** — both
> can be live in the same lane in the same frame, and sharing module scratch
> between two segment drawers is a trap even though the calls are sequential
> leaves today.
>
> The fuse is rooted at the throat and its tip advances to the rim across
> `C.SURGE_TELEGRAPH`, so what the player sees is the charge **travelling up the
> lane at them** rather than a lane that merely gets brighter. During the
> discharge the whole lane is live at `C.SURGE_LIT_WIDTH`.
>
> ⛔ **Full alpha at every depth, including inside the throat zone**, and write
> the reason: §10.3 governs what may be drawn *over* that zone — explosions,
> particles, popups. A telegraph is not drawn over the well, it **is** lane
> geometry, and the player has to see which lane is arming from the moment it
> starts. Do not apply `shotAlpha()` to it.
>
> ⚠ Flag for playtest, do not solve: the fuse is the same shape as a Thorn, and
> `SURGER_COLOR` (`#9AF0FF`, pale cyan) sits close to the cyan band the Surger
> first appears in at L13. Motion separates them — one grows and vanishes, one is
> static and permanent. Both colours are ⚠ provisional. Put it in `STATUS.md`'s
> playtest asks.
>
> **4. Wiring.** `surger` in `ENEMY_KINDS` (`dir` ignored, the draw still spent —
> see `spawnEnemy`'s header for why). `spawnSurger` on key `"6"`.
> ⛔ `test-registry.js`: `enemies` 5 → 6, `enemyKinds` 6 → 7.
>
> **5. The test.** `scratchpad/test-cs005-p3.js`. The cycle with real
> `update(1/60)`; the telegraph is not lethal (**mutation check** — a Surger
> lethal during its fuse turns it red); §4.5 item 3 live through the real
> `killSkimmer()`; a Skimmer one lane away does not die; the constant
> relationship with `RESPAWN_INVULN`; the strong lane form; no discharge on step
> one from any spawn depth.
>
> ⛔ Run `node scratchpad/run-all.js` before committing. Zero skips. No CS003 or
> CS004 test file edited.
>
> **6. Docs.** GDD §6.1's Surger row and §6.3 gain a "Shipped, CS005" paragraph —
> the mutated `killDepth`, why the telegraph is an entity draw, and the
> `SURGE_DISCHARGE` / `RESPAWN_INVULN` relationship. GDD §6.5 gains a line at
> `killDepth` saying it is the first field the roster mutates. ⛔ Edit in place.

---

## P4 — the last two cargo rows

**Model: Opus 5 · Effort: medium**

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §0, §1, §6.2, §6.5.
> Then read the `CARGO` table header in `src/07-enemies.js`, `CARGO_GLYPHS` in
> `src/14-render-entities.js`, and — this is the important one —
> `scratchpad/test-cs004-p2.js` and `scratchpad/test-cs004-p5.js`, both of which
> already test what you are about to build.
>
> Small phase, and it completes GDD §6.2's table. Three table rows and two
> glyphs. CS004 wrote the tests as loops over `CARGO` specifically so this phase
> adds rows and not cases.
>
> **1. The rows.**
>
> - `CARGO.drifter = { kind: "drifter" }`, `CARGO.surger = { kind: "surger" }`
>   in `src/07-enemies.js`.
> - `carrierDrifter` and `carrierSurger` in `ENEMY_KINDS`
>   (`src/08-spawner.js`), one row per variant, matching `carrierVaulter`.
> - `CARGO_GLYPHS.drifter` and `CARGO_GLYPHS.surger` in
>   `src/14-render-entities.js`.
>
> ⛔ **No branch on cargo anywhere.** Not in `onShot`, not in `splitLanes`, not in
> the draw path. `Carrier.onShot()` and `splitLanes()` are unchanged and serve
> all three rows. GDD §6.2's "adjacent" (Vaulter) and "flanking" (Surger) are the
> **same geometry** — the distinction that section draws is between the correct
> *responses*, which come from what the cargo does after it lands. Do not invent
> a second placement rule now that the second word finally has an entity behind
> it; that would be a difference the player cannot see.
>
> **2. ⛔ Two constraints on the glyphs, and both are verified against tests you
> may not edit.**
>
> `scratchpad/test-cs004-p2.js` line ~440 asserts
> `Array.isArray(X.CARGO_GLYPHS.vaulter) && ... .length >= 2`. So:
>
> - ⛔ **`CARGO_GLYPHS` values stay plain arrays.** No `{poly, closed}` reshape.
> - ⛔ **Every glyph stays an open path.** `drawCarrier()` calls
>   `drawPoly(..., false)` for the glyph and that stays as it is.
>
> **The design rule, which this row completes.** The glyph is a **miniature of
> the cargo's own gesture**: the Vaulter's is a chevron, which is its arm; the
> Surger's is a zigzag, which is its bar; the Drifter's is a jagged scatter with
> no dominant axis, which is its cluster. That makes cargo-reading *learnable*
> rather than memorised, which is §6.2's stated point. Write the rule down at
> `CARGO_GLYPHS` so a ninth enemy inherits it.
>
> Legibility target is **throat depth**, not the rim: two or three points, one
> unmistakable gesture, no feature that survives only at full size. And the
> stakes are real — §6.2's correct responses are opposite (Drifter cargo: shoot,
> **move away**; Surger cargo: shoot, **hold still**), so a player who reads the
> glyph wrong does the exact opposite of the right thing.
>
> **3. The Carriers' `killDepth`.** Unchanged — `1 - C.RIM_CONTACT_DEPTH`, like
> `carrierVaulter`. A Carrier is a Carrier regardless of what is inside it; the
> cargo only matters after it dies.
>
> **4. Wiring.** ⛔ `test-registry.js`: `enemyKinds` 7 → 9. `enemies` stays at 6 —
> a Carrier variant is a **kind**, not a roster row, and `test-cs004-p5.js`
> derives the roster from distinct classes minus projectiles specifically so this
> phase does not touch it. ⛔ **No new debug keys.** The bench has one key per
> roster row and pressing `2` shows a hull and a glyph, which is what it is for.
>
> **5. The test.** `scratchpad/test-cs005-p4.js`, and it should be short. The
> heavy lifting is already done by CS004's `CARGO` loops, which now cover three
> rows instead of one — confirm that, and add only what is genuinely this
> phase's: that a `carrierDrifter` killed at the rim yields two Drifters at the
> parent's depth which then begin their birth crosses independently, and the same
> for Surgers. Also assert the glyph shape constraints in point 2 explicitly, so
> a future reshape fails here with a clear message rather than in CS004's file
> with a confusing one.
>
> ⛔ Run `node scratchpad/run-all.js` before committing. If `test-cs004-p2.js` or
> `test-cs004-p5.js` goes red, **do not edit them** — the glyph shape or the
> Drifter's birth model is wrong. Stop and say so.
>
> **6. Docs.** GDD §6.2's variant table gains a "Shipped, CS005" paragraph: three
> rows, one `splitLanes()`, the glyph design rule, and why the two words describe
> responses rather than placement. ⛔ Edit in place.

---

## P5 — the soak, the docs, the close

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §0, §1, §3.5, §6.1,
> §6.3, §6.5, §17. Then read `scratchpad/test-cs003-p5.js` and
> `scratchpad/test-cs004-p5.js` in full — they are the two soaks you are
> extending the pattern of, and ⛔ **you may not edit either one.** ultrathink.
>
> Closing phase. The Classic roster is complete after this: six enemies, three
> Carrier variants, §4.5's death conditions 1 through 4 live.
>
> **1. ⛔ Why you are writing a third soak instead of editing two.**
>
> `STATUS.md` has carried a task saying `MAX_LANE_STEP` must become per-entity
> "in `test-cs003-p5.js` and `test-cs004-p5.js` both". **That task is wrong and
> you are not doing it.** Verified before this changeset started:
>
> - `test-cs003-p5.js` never touches `C.DEBUG_SPAWN_KINDS`, so it runs on the
>   shipped `["vaulter"]` and only Vaulters reach its board. Its bound is right
>   for what it observes, and CS003 P5's finding — that a range check misses a
>   wrapping hop — is preserved by leaving it alone.
> - `test-cs004-p5.js` sets its own `MIXED` list of CS004's three spawnable
>   kinds. ⛔ **Do not extend it.** That would make CS004's closing soak assert
>   entities CS005 built, which is exactly what `CLAUDE.md`'s "a test asserts
>   only what its own phase owns" forbids, and it would put a widened bound into
>   a file whose stated job is the *stronger* exact-equality form.
>
> So: `scratchpad/test-cs005-p5.js`, on its own six-kind list, owning the new
> assertions. The only shared edit anywhere in this changeset is
> `test-registry.js`, which is the one file allowed to name a global count.
>
> ⛔ End the phase by confirming it: `git diff --stat` across the whole changeset
> must show no CS001–CS004 test file touched. State the result in `log/CS005.md`.
>
> **2. ⛔ §17 item 3, and the lane assertion is now per entity.**
>
> 5,000 ticks on each of the six open wells with all six kinds live, plus
> adversarial rotation input, topping up `spawn.remaining` and `lives` as
> fixtures the way CS004's does. No `lane` outside `[0, lanes-1]`, no `depth`
> outside `[0,1]`, no NaN in state or in any projected point, no array growing
> without bound.
>
> Three tiers, and the file should make plain why they differ:
>
> | Entities | Assertion | Why |
> |---|---|---|
> | Carrier, Weaver, Thorn, bolt, **Surger** | ⛔ `Object.is` equality with the lane it entered with | None of them touches a lane helper. "Never hops" is an absence of code — the strongest form available, and a wrapped hop cannot slip under it |
> | Vaulter | `2 * DT / C.VAULT_HOP_TIME` | Unchanged |
> | **Drifter** | `2 * DT / C.DRIFT_CROSS_TIME` | Derived from the constant, not picked. The birth cross is half the distance over half the time, so the lane speed is the same in both and this is one number |
>
> ⛔ **Mutation-check the Drifter's bound the way CS003 P5's was proved.** A range
> check does not catch GDD §3.5's bug — a wrapped cross on a 13-lane strip lands
> inside `[0, 12]`. Change the Drifter's cross to wrap instead of fold, confirm
> the bound turns red where a range check stays green, then change it back.
>
> Add the assertion this changeset makes available: a settled Drifter's lane is
> **on the boundary lattice** — a half-integer inside `[laneBoundaryLo,
> laneBoundaryHi]` — or strictly between two adjacent lattice points during a
> cross. That is the thing P1's geometry exists to guarantee.
>
> **3. §17 item 1 — determinism, with the new draws.**
>
> Same seed and recorded inputs ⇒ identical hash after 10,000 ticks, twice in one
> process and once across two, with a different seed moving it. ⛔ **The hash must
> cover a Drifter's phase and cross progress and a Surger's phase and timer**, or
> it would pass over a build that had lost the cycle entirely — the trap CS004 P5
> names as its item 3.
>
> ⛔ Carry the recorded-input key check forward as a **superset**:
> `["r","w","0","1","2","3","4","5","6"]`. CS004's list is hardcoded and stops
> being exhaustive when P2 and P3 bind two more digits. It does not fail —
> CS004's own recorded list presses none of them — so ⛔ **do not edit CS004's
> file**; note in yours that it is a superset and why.
>
> **4. §17 item 6 and the registry.**
>
> Item 6 (Carrier splits) is CS004's loop over `CARGO`, now covering three rows.
> Confirm it passes for all three; add nothing.
>
> ⛔ `scratchpad/test-registry.js` must read `enemies: 6` and `enemyKinds: 9` by
> the end of this changeset — two counts, raised by different amounts in the
> phases that landed them. Confirm; do not re-raise anything.
>
> **5. Twenty seeded runs to game over** on the six-kind list, no exception, no
> stuck run, no NaN, no unbounded array. §17 item 12 at a closing phase's budget.
>
> **6. Docs, and there are seven of them.**
>
> - **GDD.** §3.5 gains the boundary lattice (P1 wrote the first draft — confirm
>   it reads right now that two entities exercise it). §6.1's two rows and §6.3's
>   two ⛔s get their "Shipped, CS005" paragraphs if P2 and P3 have not already.
>   §6.5's `killDepth` row notes the roster's first mutated field. ⛔ Check §0 has
>   a row for everything this changeset edited; if it does not, that is a defect
>   in §0 and it goes in `STATUS.md`.
>
> - **`CLAUDE.md`.** Three small edits and ⛔ **nothing else — do not sweep it.**
>   It measures 21.8 KB against its own 50 KB ceiling (44%), and its valve rule
>   is explicit: the valve fires when an over-size section is next edited, never
>   as a standing cleanup. Trimming it now would be re-litigating a rule that is
>   not firing.
>   1. The *Math and lifecycle* section gains a line: the boundary lattice
>      exists, `laneHop`'s fold bounds are a parameter defaulting to the
>      lane-centre range, and the two outermost boundaries of an open well are
>      not addressable. Keep it a rule, not a reason — the reason goes in
>      `RATIONALE.md`.
>   2. The *Document map* gains a row for `PLAYTEST.md`: *"Open questions only
>      the eye can answer."* Read it? **Never by default** — the same contract
>      `log/` and `archive/` carry.
>   3. The *STATUS.md format* section gains one line: ⛔ **playtest asks live in
>      `PLAYTEST.md`, not here.** That is the recurrence guard and it is the only
>      new rule this changeset adds.
>
> - **`PLAYTEST.md`.** New, on-demand, at the repo root. See section 7.
>
> - **`RATIONALE.md`.** A new `#boundary-lattice` anchor holding the reasons
>   `CLAUDE.md` does not: why the fold bounds are a parameter rather than a
>   second helper, why a Drifter is born at a lane centre and crosses onto the
>   lattice, and the `polyAt` clamp that makes the outer boundaries undrawable.
>
> - **`DECISIONS.md`.** One dated entry for the `killDepth` call in P2 — it was
>   made outside the phase flow, against two shipped comments, and it is exactly
>   the kind of thing a future session rediscovers and wants to "fix".
>
> - **`ROADMAP.md`.** Two things:
>   1. CS005's row against what actually shipped. Note whether the changeset held
>      as one or wanted the seam after P2, and update assumption #2.
>   2. ⛔ **A new note under "Still open, and not owned by a changeset":
>      `src/07-enemies.js` wants splitting, and the moment is CS011.** Measured,
>      not felt: it went **39 KB / 550 lines at CS004 close to 64.8 KB / 1269
>      lines at CS005 P3** — 66% growth for two entities — and it is 65% comment
>      by line, which is correct and is the point. CS011 and CS012 add three more
>      entities (Reaver, Warden, Mimic), which puts it past 100 KB. ⛔ **Not now
>      and not as its own changeset:** the natural seam is Classic versus
>      Overdrive, the natural moment is CS011 when a new module is being created
>      anyway, and `build.js`'s two-way `MANIFEST` check makes adding one cheap
>      and safe. Recording it here is what stops it being rediscovered as a
>      surprise. Assumption #7 says no changeset is reserved for refactoring;
>      this is the alternative that rule asks for.
>
> - **`log/CS005.md`.** Section 8.
>
> **7. ⛔ `PLAYTEST.md`, and the `STATUS.md` trim.**
>
> `STATUS.md` is **407 lines against its own ⛔ ~400-line ceiling**, mid
> changeset, and it is now larger than `CLAUDE.md` — both auto-load into every
> session with no opt-out. Measure it yourself before and after
> (`wc -l STATUS.md`) and put both numbers in `log/CS005.md`.
>
> The overage is two sections carrying content their own rules put elsewhere:
>
> - **Playtest asks: 88 lines, 22% of the file.** Questions for Paul, at
>   hardware. No build session can act on any of them, and every build session
>   loads all eighty-eight.
> - **Per-phase findings: 62 lines** across P2 and P3. `CLAUDE.md` says plainly:
>   *"A phase entry is one line in the ledger, ~200 words maximum in the body.
>   Reasoning goes in `log/CS0##.md`."*
>
> What to do:
>
> 1. ⛔ **`PLAYTEST.md` has been written and is at the repo root already.** It
>    was extracted from `STATUS.md` and grouped by debug key, with a read
>    contract and a maintenance rule at the top. ⛔ **Do not rewrite it and do
>    not regenerate it from `STATUS.md`** — it is the source of truth for those
>    asks now. If it is somehow not there, stop and say so rather than
>    reconstructing it.
>
>    ⛔ **IT WAS EXTRACTED AT P3 AND IS THEREFORE INCOMPLETE.** Whatever P4 added
>    to `STATUS.md`'s "Playtest asks" section is **not** in it. Do not read step
>    3 as "the section is already covered, delete it."
>
> 2. ⛔ **Move P4's asks across BEFORE step 3, and diff to prove it.** Read
>    `STATUS.md`'s "Playtest asks" section against `PLAYTEST.md` and move over
>    every ask that is not already there, into the section it belongs to. Then
>    add P5's own. One ⛔ per phase at most: the ask the phase exists for. P4's
>    is the cargo glyph at throat depth for the two new rows, since §6.2's
>    correct responses are opposite and a misread does the exact wrong thing.
>
>    ⛔ **Report the arithmetic in your closing message**: how many asks were in
>    `STATUS.md`, how many were already in `PLAYTEST.md`, how many you moved, and
>    the final count. Those numbers must add up. An ask lost here is lost
>    silently and nothing downstream will ever notice.
>
> 3. ⛔ **Only then, delete the whole "Playtest asks" section from `STATUS.md`.**
>    Not moved to `log/CS005.md` — the log is ⛔ never read by default, and
>    burying open questions there loses them. The log gets one line saying where
>    they went.
> 4. **Collapse the P2 and P3 findings sections** into the ledger's ~200-word
>    bodies. The reasoning goes to `log/CS005.md`, in full, where it belongs.
>    Nothing is deleted — it relocates to a document already on an on-demand
>    contract, which is the same valve `CLAUDE.md` uses on itself.
>
> **8. The reset, the log, and the close.**
>
> Move what remains to `log/CS005.md`, reset `STATUS.md` for CS006, and write
> the "Next up" section from what CS005 leaves on the table.
>
> ⛔ **The reset has a target: under 250 lines.** The ~400 ceiling has to cover
> the *whole* of CS006's life, and CS006 is five or six phases each adding a
> ledger entry. Opening at 180–250 leaves the headroom; opening at 350 means the
> ceiling is breached by P3 again, which is what happened here. State the opening
> line count in `log/CS005.md` so the next close has something to compare
> against.
>
> ⛔ Carry these forward into the new `STATUS.md` explicitly:
>
> - The spawner stall is still unfixed and still CS006's. CS005 did **not** make
>   it reachable — the stall needs Thorns, which need Weavers, which need
>   `C.DEBUG_SPAWN_KINDS` to name one, and it still ships as `["vaulter"]`. But
>   CS006's design call ("does the concurrency budget count threats or
>   entities?") now has a second entity that is temporarily neither: a riding
>   Drifter cannot be shot. ⚠ It is self-resolving where a Thorn is not, because
>   it crosses on a cadence and climbs in both phases. Say that.
> - `laneState` is still unwired. Still CS006's.
> - `tools/glow-lab.html` still does not exist and still has no owner. Record
>   what CS005 did instead — the three-channel separation gate — and that the lab
>   is for the **global** glow constants, which this changeset did not touch.
>   ⛔ One line and a pointer to `PLAYTEST.md`'s palette section, not a
>   restatement of it.
> - The whole enemy palette is still ⚠ provisional, and both CS005 colours are
>   readable on hardware for the first time.
> - The `07-enemies.js` seam, as one line pointing at `ROADMAP.md`. ⛔ Do not
>   restate the measurement in two places.
> - ⛔ **No playtest asks.** They are in `PLAYTEST.md` now. A "see `PLAYTEST.md`"
>   pointer under Known issues is the whole of it.
>
> ⛔ Archive `PLANNED-FEATURES-CS005.md` and `IMPLEMENTATION-PHASES-CS005.md`.
>
> **Finish by reporting four numbers**, in `log/CS005.md` and in your closing
> message: `STATUS.md` lines before and after, `CLAUDE.md` bytes (it should not
> have moved much), and `PLAYTEST.md` line count. This changeset is the first
> that measured a document rather than trusting it, and the next close needs a
> baseline.
>
> ⛔ Version bump in `log/CS005.md`, not a central changelog. ⛔ Edit every
> document in place. ⛔ `node build.js` and `node scratchpad/run-all.js` green,
> zero skips, before the commit.

---

## Assumptions and decisions

| # | Decision | What would change it |
|---|---|---|
| 1 | Five phases, one changeset | Matches CS004's shape and `ROADMAP.md`'s 3–5 sizing. If P2 overruns a session, split after it and renumber — CS005 becomes the lattice and the Drifter, CS006 becomes the Surger, the cargo and the close |
| 2 | P1 is geometry alone, with no entity | The change touches a helper every hopping entity will ever use, and the equivalence sweep is the whole value. Bundling it into P2 means it gets written while thinking about a Drifter, which is how a default gets picked instead of proved |
| 3 | P2 and P3 each own their entity's rendering rather than a separate render phase | Both entities' ⛔s are *about* the rendering — an unreadable Drifter and an invisible fuse are the failures, not the movement. Separating them would mean judging behaviour in a state its own invariant forbids |
| 4 | P4 is medium effort | CS004 wrote its tests already, as loops. Three table rows and two glyphs against cases that exist. It is also where P2 or P3 overflow lands |
| 5 | P5 writes a third soak rather than editing two | Verified that neither closed soak's board can contain a CS005 entity, so the edit is unnecessary as well as forbidden. The `git diff --stat` check at the close is what makes that a result rather than an intention |
| 6 | Every phase runs `run-all.js` before committing, and a red CS004 file means stop | Three closed test files start exercising CS005's entities automatically. If one goes red, the new entity is wrong — editing the test to match would destroy the signal that caught it |
| 7 | The `killDepth` call gets a `DECISIONS.md` entry, not just a code comment | It was made outside the phase flow, it contradicts two shipped comments, and it is exactly the shape of thing a future session rediscovers and "fixes" || 8 | ⛔ The `STATUS.md` overage is fixed inside P5, not as its own changeset and not as a mid-flight tidy | P5 already resets `STATUS.md` — it is the valve, and it fires in one phase. A separate changeset for ~150 lines of relocation costs a session to save one, and a mid-flight tidy breaks "one phase per session" for no gain. ⚠ This IS scope growth on a changeset in flight, taken deliberately and confined to the closing phase. If the trim runs long, that is the signal it was a real refactor and should have been scoped |
| 9 | Playtest asks get their own file rather than going to `log/CS005.md` | The log is ⛔ never read by default; twenty-four open asks, two of them ⛔ readability invariants, would be lost there. `PLAYTEST.md` costs one row in the document map and introduces no new concept — it is the contract `RATIONALE.md` and `DECISIONS.md` already use. ⛔ Answered asks are deleted, not archived: if an answer mattered it changed a constant or a design, and those have homes |
| 10 | ⛔ `CLAUDE.md` is added to, never swept | It is at 44% of its ceiling and its own valve rule forbids a standing sweep. Three additions take it to roughly 22.3 KB. If it ever passes 40 KB the valve should be brought forward deliberately rather than tripped |
| 11 | `src/07-enemies.js` is noted in `ROADMAP.md` and split at CS011, not now | P4 adds about thirty lines to it, so splitting now buys nothing and costs a phase. CS011 creates a module anyway and the Classic/Overdrive seam is real rather than arbitrary. If CS006's heat pass turns out to touch every enemy class, that is a second reason and would bring it forward |
| 12 | ⛔ The reset target is under 250 lines, stated and measured | The ~400 ceiling covers a whole changeset's life, not its first day. Without an opening target the ceiling is breached mid-changeset every time, which is exactly what happened here. If CS006 opens at 250 and still breaches, the ceiling is wrong rather than the reset |