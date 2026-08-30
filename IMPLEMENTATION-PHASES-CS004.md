# IMPLEMENTATION-PHASES-CS004

One phase per Claude Code session. `/clear` between phases. Commit per phase on
`main`; never push.

Each phase below is the literal prompt to paste. Keep them self-contained — a
session reads `CLAUDE.md` and `STATUS.md` automatically, and nothing else unless
the prompt names it.

⛔ **`ultrathink` appears inside the prompt text where it is wanted.** It is a
per-turn lever, not a session setting, so it has to be in the pasted message.

**Baseline:** CS003 closed at `f322ba9`. `node build.js` green (24 modules),
`node scratchpad/run-all.js` green — 14 files, zero skips. `test-registry.js`
has `enemies: 1`. GDD §6.5 lists six contract fields and six wiring points.

| Phase | Builds | Model | Effort |
|---|---|---|---|
| P1 | The seventh contract field, the debug bench, the pointer sweep | Opus 5 | **high** |
| P2 | The Carrier, `splitLanes()`, the cargo table | Opus 5 | **high** |
| P3 | The Weaver and its bolt | Opus 5 | medium |
| P4 | The Thorn and the chip economy | Opus 5 | **high** |
| P5 | Soak, docs, close | Opus 5 | **high** |

High effort where a wrong first guess costs a later changeset. P1 changes a
contract five more entities inherit and edits two lines under a ⚠ SETTLED marker.
P2 is the first non-spawner caller of `spawnEnemy()` and it mutates
`state.enemies` from inside the collision pass's own loop. P4 is where P1's fix is
proved through the real death path. P5 owns four GDD §17 items.

---

## P1 — the seventh contract field, the bench, and the sweep

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §0, §1, §4.4, §6.1,
> §6.5, §9.5, §16.1. ultrathink.
>
> No new enemies this phase. Four things: a contract field that fixes a live bug,
> a debug bench, a pointer sweep, and a duplicate file.
>
> **1. ⛔ `anchored`, the bug it fixes, and the ⚠ marker sitting on top of it.**
>
> ⚠ **Read this whole section before you touch `respawnSkimmer()`.** There is a
> SETTLED marker two lines above the code you are changing, and it does not
> forbid this change — but you should understand exactly why before you edit
> under it.
>
> `respawnSkimmer()` in `src/23-main.js` implements GDD §4.4's rim push as an
> unconditional clamp over `state.enemies`:
>
> ```js
> if (e.depth > C.RESPAWN_PUSH_DEPTH) e.depth = C.RESPAWN_PUSH_DEPTH;
> ```
>
> GDD §4.4 and the comment above that line both carry ⚠ **SETTLED — Paul,
> 2026-08-30: the rim push is a CLAMP over every lane, not a band at the rim. Do
> not narrow it back.** That marker is about the **depth band** — everything above
> `RESPAWN_PUSH_DEPTH` comes down to it, in every lane, rather than only what sits
> inside the rim contact band. ⛔ **That stays exactly as it is. Do not touch the
> threshold, the comparison, or the fact that it applies in every lane.**
>
> What you are adding is orthogonal, and Paul has authorised it: which **entities**
> the clamp is meaningful for.
>
> P4 of this changeset adds the Thorn, whose `depth` is **the tip of an extent
> rooted at the throat**, not a position. Under the clamp, every player death
> would permanently shorten every Thorn longer than 0.55 — a free chip the player
> did not earn, invisible, in the one place nobody would look. The clamp was never
> doing the thing the settled decision protects on that entity, because the
> quantity it is clamping is not a position at all.
>
> So: add `anchored` to the `Enemy` base in `src/07-enemies.js`, default `false`,
> and make `respawnSkimmer()` skip anchored entities. ⛔ **Extend the ⚠ comment,
> do not replace it** — it should end up saying both things: the band is broad and
> stays broad, and it applies to entities whose `depth` is a position. Every enemy
> that exists today is unaffected.
>
> ⛔ Document `anchored` as a statement about **what `depth` means**, not about
> movement: a stationary enemy whose `depth` is still a position is
> `anchored = false`. Anything that ever reads `depth` as a length sets it true.
>
> ⛔ The base still holds no behaviour. Seven fields, three signatures. If you find
> yourself wanting to put a climb rate in it, GDD §6.5 tells you what that means:
> flatten the base back to independent classes, do not add a field to switch the
> behaviour off.
>
> **2. The debug bench.**
>
> These enemies are introduced at L3 and L5 in GDD §8.1, but the introduction
> schedule and the heat clock are CS006's. So nothing new will spawn on its own
> this changeset, and Paul needs a way to put one on screen.
>
> ⛔ Named actions on the existing input path, never a second listener.
> `createInput()` in `src/23-main.js` already takes `actionKeys` and `onAction`,
> and `04-input.js` dispatches queued actions inside `sample()` in simulation
> order — so a debug spawn is replay-safe and cannot land halfway through a frame.
> A `keydown` listener of its own is GDD §9.5's named failure and it already
> happened once in this repo, to the well-cycler; `23-main.js` carries the note.
>
> Add to `actionKeys`: `spawnVaulter` (`"1"`), `spawnCarrier` (`"2"`),
> `spawnWeaver` (`"3"`), `spawnThorn` (`"4"`), `spawnRow` (`"0"`). ⛔ **Digits,
> not letters** — `test-cs003-p5.js`'s recorded input list deliberately never
> presses `r` (time-derived seed) or `w` (cycles the well), and a new binding that
> collided with either would break the determinism hash.
>
> In `runAction()`, each of the first four calls
> `spawnEnemy(kind, skimmer.lane, 0)` — ⛔ through `spawnEnemy()`, so the bench
> inherits the safe-spawn rule and the cap like everything else. `spawnRow` spawns
> one of every Classic kind in consecutive lanes at staggered depths; it is ten
> lines and it exists so the palette below can be judged on hardware in one look.
>
> Only `"vaulter"` is a live kind this phase. Wire the other three against
> `ENEMY_KINDS` as it stands — `spawnEnemy()` already returns `null` for an
> unknown kind, so an unbuilt action is a no-op rather than a throw, and P2
> through P4 light them up by adding rows to that table and nothing else.
>
> **3. ⚠ `C.DEBUG_SPAWN_KINDS`, and one trap in it.**
>
> The interval spawner in `src/08-spawner.js` hardcodes
> `spawnEnemy("vaulter", lane, 0)`. Replace the literal with a
> `pickSpawnKind(state)` that reads `C.DEBUG_SPAWN_KINDS`, and add the constant as
> `["vaulter"]` — so the game plays exactly as it does today and editing one line
> gives a mixed well. ⚠ Mark it TEMPORARY in `C`, in the shape of
> `WELL_CLEAR_HOLD`: GDD §8.1's introduction schedule deletes the constant and its
> reader.
>
> ⛔ **A one-entry list must spend NO RNG draw.** `rngPick` on a single-element
> array still advances the stream, which would move every spawn lane in every run
> — including the 10,000-tick run `test-cs003-p5.js` hashes — and turn the
> determinism test red for a reason that would take an afternoon to find. Return
> element zero without drawing when there is no genuine choice, and say why in the
> comment.
>
> **4. The enemy palette.**
>
> `STATUS.md` names this: CS004 needs five more colours and the decision should be
> made once, deliberately, rather than five times by inference. Add all six
> Classic enemy colours to `C` now, as one set, each ⚠ provisional with the same
> standing as `SKIMMER_COLOR` and `VAULTER_COLOR`:
>
> `CARRIER_COLOR` `"#FFB84A"`, `WEAVER_COLOR` `"#B6FF4A"`, `WEAVER_BOLT_COLOR`
> `"#E8FF9A"`, `THORN_COLOR` `"#A98CFF"`, `DRIFTER_COLOR` `"#FF5AC8"`,
> `SURGER_COLOR` `"#9AF0FF"`. The last two are unread until CS005 and that is
> deliberate — a palette is a set, and picking four now and two later guarantees a
> clash.
>
> ⛔ Record the constraint they were chosen against, in the comment: an enemy
> colour has to read against **all seven** band colours (§3.6), because the well
> cycles and the enemies do not. Hue alone cannot separate eight simultaneous
> things; silhouette and line weight carry the load, and the palette's job is to
> stay out of cyan (levels 1–16) and magenta (17–32) and to keep the Thorn visibly
> not-a-creature.
>
> **5. The pointer sweep.** `PLANNED-FEATURES-CS004.md` splits the old CS004 in
> two, so the level-flow changeset is now **CS006** and everything after shifts by
> one. `CS005` currently appears in twelve places meaning *level flow*: five in
> `STATUS.md`, three in `VECTOR-VORTEX-GDD.md`, two in `src/00-config.js`, and one
> each in `src/02-state.js`, `src/08-spawner.js` and `src/23-main.js`.
>
> ⛔ **Not a find-and-replace.** Read each one and decide. Two of them — GDD §4.4
> (the "Shipped, CS003 P4" paragraph) and `src/09-collision.js`'s `killSkimmer()`
> comment — say *"the four death conditions CS004 and CS005 add"*, which is now
> wrong about the split as well as the number: CS004 adds condition 4 (the Weaver's
> bolt), CS005 adds 2 and 3 (Drifter and Surger), CS006 adds 5 with the Dive.
> Rewrite those two.
>
> Two more `STATUS.md` lines are stale for other reasons and fix in the same pass:
> the Flat well's "natural landing spot is CS004 (well progression, per
> `ROADMAP.md`)" — `ROADMAP.md` never put well progression in CS004, and it is now
> CS006 — and the ⚠ note that `STATUS.md` and `ROADMAP.md` disagree about who owns
> GDD §12's four-second promise. That is settled: it is onboarding, it is CS014,
> and the replacement `ROADMAP.md` in this drop already says so.
>
> CS003 P1 did this job once already for three stale pointers. The reason is in
> `archive/PLANNED-FEATURES-CS003.md`: a comment naming a changeset reads as
> shipped truth to a session that finds it, and it should be wrong for the shortest
> possible time.
>
> **6. The duplicate harness.** The repo root holds a tracked, stale copy of
> `scratchpad/_harness.js` — 143 lines against 172, and its `buildGame()` returns
> only `{ C, state }` where the live one returns forty-plus named globals. Nothing
> loads it; every test does `require("./_harness.js")` from inside `scratchpad/`.
> `STATUS.md` has carried it as "delete or de-duplicate" since CS003 P1 with no
> owner. It is a live trap for P2, whose `splitLanes` test walks all sixteen wells
> through `laneNormalize`, `laneDelta` and `WELLS` — none of which the stale copy
> exports, and all of which would come back `undefined` rather than erroring at
> require time. `git rm _harness.js`, rebuild, run the suite.
>
> **Write `scratchpad/test-cs004-p1.js`** asserting: `anchored` exists on the base
> with the documented default and every existing enemy is `false`; an anchored stub
> at `depth 0.9` is unchanged by a real death and respawn driven through
> `update(1/60)`, and an unanchored one at `0.9` is pushed to
> `RESPAWN_PUSH_DEPTH`; ⛔ the clamp is still broad — an unanchored enemy at 0.6,
> well outside the rim contact band, still comes down; each spawn action produces
> exactly one entity of its kind through `spawnEnemy()` and dispatches inside
> `sample()` rather than at event time; ⛔ the spawn-lane sequence for a fixed seed
> over 3,000 ticks is identical to the pre-change build, which is what proves the
> no-draw rule; and with a three-entry `DEBUG_SPAWN_KINDS` two runs on one seed
> produce the same kind sequence.
>
> ⛔ Mutation-check all three named invariants, do not merely assert them:
> removing the anchored skip, **narrowing the clamp to a rim band**, and making
> `pickSpawnKind` draw unconditionally must each turn the suite red.
>
> Do not build the Carrier, the Weaver, the Thorn, the Drifter or the Surger. Do
> not touch `laneHop`. Do not wire `laneState`. Do not add scoring. Update
> `STATUS.md` and commit.

---

## P2 — the Carrier, the split, and the cargo table

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §0, §1, §6.1, §6.2,
> §6.3, §6.5, §10.2, §18. §6.5's "Shipped, CS003" paragraph is the contract you
> are filling in — read it in full. Also read `src/08-spawner.js` and
> `src/09-collision.js` before you write anything: this phase is the first
> non-spawner caller of `spawnEnemy()` and it mutates `state.enemies` from inside
> the collision pass's own loop. ultrathink.
>
> **`class Carrier extends Enemy`** in `src/07-enemies.js`, per §6.1 and §6.2:
>
> - Climbs from `depth 0` at `C.CARRIER_CLIMB`, monotonically, stopping at the
>   rim. ⛔ One lane, never hops — it does not touch `laneHop` at all, and its
>   `lane` is exactly the lane it was spawned into for its whole life.
> - `killDepth = 1 - C.RIM_CONTACT_DEPTH`, the same expression the Vaulter uses,
>   so retuning the rim band moves both.
> - `cargo` is a string, handed in by the factory. `onShot()` sets `dead`,
>   consumes the shot, and splits.
>
> **The cargo table.** A `CARGO` object mapping a cargo name to what it splits
> into. §6.2 has three rows; ⛔ **only `vaulter` is buildable** — the Drifter and
> the Surger are CS005's, and so are their rows. Write the table so CS005 adds two
> entries and touches nothing else. Add `carrierVaulter` to `ENEMY_KINDS` in
> `src/08-spawner.js`; §6.5 makes that table the one place a string becomes a
> class.
>
> **`splitLanes(well, lane)`**, and read this carefully because the naive version
> is wrong on six of the sixteen wells. Both children go one lane either side of
> the parent. On a closed well `laneNormalize` already does the right thing. On an
> open well it **clamps**, so a Carrier in lane 0 splitting to `lane ± 1` puts one
> child at lane 0 and one at lane 1 — two silhouettes in one lane, on the well
> where the player has the least room, which is a §1.1 P2 failure at the exact
> moment the player is being asked to read a split.
>
> The rule: on an open well, shift the pair inward until both lanes are legal and
> distinct. A parent at lane 0 of a 13-lane Vee yields children at lanes 0 and 2 —
> the pair still straddles a lane, and the lane it straddles is the parent's, which
> keeps the trap honest at the wall.
>
> ⛔ §6.2's "adjacent" (Vaulter cargo) and "flanking" (Surger cargo) are the same
> geometry. The distinction §6.2 draws is between the correct *responses* — move
> away versus hold still — which comes from what the cargo does, not from where it
> lands. One helper serves all three rows; do not invent a second placement rule to
> justify the second word.
>
> **⛔ Both children go through `spawnEnemy()`.** Four things follow and every one
> is deliberate:
>
> - The safe-spawn rule applies: a child in the Skimmer's lane above
>   `SAFE_SPAWN_DEPTH` is **lowered**, never relocated sideways. That is exactly
>   why CS003 P2 wrote it as a depth clamp — read its comment.
> - `C.ENEMY_CAP` applies: a split on a full board adds nothing and the children
>   are lost. That is correct. The cap is a readability ceiling, not a difficulty
>   knob, and "it's only a split" is the bypass the single entry point exists to
>   prevent.
> - Each call spends one RNG draw for the heading, so a split spends two and
>   shifts every later draw in the run. Deterministic, and worth a comment so it is
>   not tidied away.
> - ⚠ The push happens **inside `collideShots()`'s loop over `state.enemies`**.
>   That is safe, for three separate reasons: the loop is index-based and re-reads
>   `.length`, the `break` after `onShot` is unconditional so the shot cannot walk
>   into its own children, and removal is still the end-of-frame `.filter()`. ⛔
>   Write that reasoning at the call site. A session that does not see it will
>   either "fix" it into a deferred queue or break it by making the `break`
>   conditional.
>
> **⚠ The Purge does not split Carriers, and it already works.** `updatePurge()`
> sets `dead` directly and never calls `onShot()`. Do not route it through
> `onShot` for consistency — a panic button that doubles the enemy count is not a
> panic button. Add the ⚠ SETTLED note in `09-collision.js` so nobody unifies the
> two paths later.
>
> **The silhouettes**, in `src/14-render-entities.js`, through `entityPoints()` +
> `drawPoly` + `glowStroke`, no fill: §6.1's hollow diamond hull at
> `C.CARRIER_SIZE`, and a cargo glyph as a **second, smaller poly** at
> `C.CARRIER_GLYPH_SIZE` drawn inside it. Two polys per entity is free —
> `entityPoints` memoizes scratch per poly array, and §6.5 notes that array is
> shared and non-reentrant per polygon. §6.2 says reading the glyph fast is the
> skill that separates competent from good, so it must be distinguishable at
> throat depth, not just at the rim. ⛔ §18: our shapes, not Atari's.
>
> Add to `C`: `CARRIER_SIZE` (0.80), `CARRIER_GLYPH_SIZE` (0.34), `CARRIER_CLIMB`
> (0.11). `CARRIER_COLOR` landed in P1.
>
> **Write `scratchpad/test-cs004-p2.js`** asserting: a Carrier climbs at
> `CARRIER_CLIMB` and stops at the rim; ⛔ its `lane` is **exactly** unchanged over
> 3,000 ticks on a closed and an open well — exact equality, not a tolerance;
> `onShot` kills it, consumes the shot, and produces exactly two children of the
> cargo kind; ⛔ `splitLanes` returns two distinct legal lanes on **all sixteen
> wells**, including from lane 0 and lane `lanes-1` of every open well; a split at
> `ENEMY_CAP` adds no children and the cap is never exceeded; a child placed in the
> Skimmer's lane above `SAFE_SPAWN_DEPTH` is lowered rather than moved; the Purge
> kills a board of Carriers and leaves it empty rather than doubling it; and a
> split that happens during a real `update(1/60)` step leaves `state.enemies`
> consistent — nothing lost, nothing double-visited by the same shot, the children
> present after the end-of-frame filter.
>
> ⛔ Mutation-check, do not merely assert: a split that pushes to `state.enemies`
> directly instead of calling `spawnEnemy()`, a `splitLanes` that uses a bare
> `laneNormalize(lane ± 1)`, and a conditional `break` in `collideShots` must each
> turn the suite red.
>
> Do not build the Weaver, the Thorn, the Drifter or the Surger. Do not add the
> other two cargo rows. Do not add scoring. Update `STATUS.md` and commit.

---

## P3 — the Weaver and its bolt

**Model: Opus 5 · Effort: medium**

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §0, §1, §4.5, §6.1,
> §6.3, §6.5, §10.2.
>
> Two classes in `src/07-enemies.js`, and GDD §4.5's fourth death condition goes
> live.
>
> **`class Weaver extends Enemy`**, per §6.1: "climbs partway laying a Thorn,
> retreats; fires down-lane". One lane, never hops. The cycle, which should be
> nameable by a player watching it — *it comes up, it leaves a thorn, it spits, it
> goes back down*:
>
> 1. Climb from the throat at `C.WEAVER_CLIMB` to `C.WEAVER_APEX`.
> 2. Hold `C.WEAVER_APEX_HOLD`, and fire **exactly one** bolt during the hold.
> 3. Retreat to the throat at `C.WEAVER_RETREAT` — faster than it arrived, so
>    leaving reads as a beat rather than a second approach.
> 4. Repeat.
>
> ⛔ `killDepth = null`. §4.5 lists the Weaver's *projectile*, not its body, so
> contact never kills at any depth including the rim. This is the first `null`
> `killDepth` in the roster and it is what that field's `null` case was written
> for. `onShot` kills it and consumes the shot. `blocksClear` stays `true`: a
> Weaver you never shoot is an enemy you never answered, and the well must not
> clear around it.
>
> The Thorn is P4's. This phase leaves a documented hook where the laying goes — a
> one-line no-op with a comment naming P4 — and nothing else. ⛔ Do not write a
> Thorn "because the cycle mentions one."
>
> **`class WeaverBolt extends Enemy`** — the projectile. Name it that way, not
> `Shot`; `Shot` is the player's and confusing the two in a collision pass is the
> kind of mistake that is invisible in review.
>
> - Travels rim-ward at `C.WEAVER_BOLT_SPEED` in the lane it was fired in. ⛔ It
>   never changes lane. Dies at `depth 1` whether or not it hit anything, so bolts
>   cannot accumulate.
> - `killDepth = 1 - C.RIM_CONTACT_DEPTH` — the same expression every rim-contact
>   entity uses. That is §4.5 item 4, live, with no new collision code.
> - `blocksClear = false`. A bolt in flight must not hold a cleared well open.
> - `purgeable = true`. The panic button saves you from it; that is what a panic
>   button is for.
> - ⚠ `onShot` returns `false` — the bolt is **not shootable** and the shot flies
>   on. It would otherwise be a free score piñata, and it would remove the lesson,
>   which is that the Weaver's output is dodged rather than answered. Note at the
>   call site that a declined shot still costs its resolution for the few steps of
>   overlap, because `collideShots`'s `break` is unconditional — the same mechanism
>   CS005's armoured Drifter depends on, and not a bug.
>
> Add `weaver` and `weaverBolt` to `ENEMY_KINDS`. ⛔ The bolt enters through
> `spawnEnemy()` like everything else — it is the second non-spawner caller and it
> inherits the cap for free. Note that the safe-spawn rule will lower a bolt fired
> in the Skimmer's lane from above 0.75, which only ever gives the player more
> time.
>
> **The silhouettes** in `src/14-render-entities.js`, through `entityPoints()`:
> §6.1's open spiral for the Weaver at `C.WEAVER_SIZE` — `drawPoly`'s `closed`
> argument is `false` for this one — and a small bolt shape at
> `C.WEAVER_BOLT_SIZE`. ⛔ §18: ours, not Atari's. The Weaver should not read as a
> threat the way the Vaulter does, because it is not one; the thing to be afraid of
> is what it leaves and what it fires.
>
> Add to `C`: `WEAVER_SIZE` (0.62), `WEAVER_CLIMB` (0.22), `WEAVER_RETREAT` (0.34),
> `WEAVER_APEX` (0.55), `WEAVER_APEX_HOLD` (0.35), `WEAVER_BOLT_SPEED` (0.32),
> `WEAVER_BOLT_SIZE` (0.30). Note in the comment that `WEAVER_APEX` is flat here
> and becomes heat-derived in CS006.
>
> **Write `scratchpad/test-cs004-p3.js`** asserting: the cycle runs — climb, hold,
> one bolt, retreat, repeat — with `depth` never leaving `[0,1]` over 5,000 ticks;
> ⛔ both the Weaver's and the bolt's `lane` are exactly unchanged for their whole
> lives; exactly one bolt per cycle, not one per step of the hold; a Weaver at the
> rim in the Skimmer's lane does not kill; a bolt reaching the rim in the Skimmer's
> lane does kill, through the real `collideSkimmer` and `killSkimmer`; a bolt with
> no Skimmer in its lane dies at `depth 1`; a bolt does not block the clear and a
> Weaver does; a shot fired through a bolt is not consumed; and the Purge destroys
> bolts.
>
> Do not build the Thorn, the Drifter or the Surger. Do not add scoring. Update
> `STATUS.md` and commit.

---

## P4 — the Thorn and the chip economy

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §0, §1, §4.2, §4.3,
> §4.4, §4.5, §5, §6.1, §6.3, §6.5, §8, §10.2, §10.3. Also read
> `src/14-render-entities.js`'s `drawShot()` before you write the Thorn's draw.
> ultrathink.
>
> The Thorn is not an enemy in any normal sense — static, unpurgeable, does not
> block the clear, killed only by shots, and its real consequence is the Dive,
> which does not exist yet. It stays in `state.enemies` regardless: GDD §6.5 states
> the one-array rule as shipped, everything the Thorn shares with an enemy is
> exactly the machinery CS003 built for it, and a second array would double all six
> wiring points to save one boolean.
>
> **`class Thorn extends Enemy`** in `src/07-enemies.js`:
>
> - ⛔ `depth` is **the tip of an extent rooted at the throat**, not a position.
>   That is what `anchored = true` (P1) declares, and it is why
>   `respawnSkimmer()` skips it. Verify that end to end in the test; a Thorn that
>   silently shortens on every death is the bug P1 exists to prevent, and the only
>   proof is the real death path.
> - ⛔ `purgeable = false` — §4.3's "does not remove Thorns", read off the flag,
>   which is why the Purge needs no special case.
> - ⛔ `blocksClear = false` — and that is exactly why a Thorn is still standing
>   during the Dive (§5), not an oversight in the clear check.
> - `killDepth = null`. It kills only during the Dive, which is CS006's.
> - `update()` does nothing. It is static, and its `lane` never changes.
> - `onShot()` subtracts `C.THORN_CHIP` from `depth`, sets `dead` at zero or below,
>   and **consumes** the shot.
>
> ⚠ **SETTLED — the rapid chip-away is GDD §4.2's emergent behaviour, not a bug to
> smooth out.** A consumed shot frees its `SHOT_MAX` slot the same step
> (`Game.update()` filters both arrays), so camping a thorned lane chips fast. It
> is in the original, it is deliberate, and it must not be rate-limited.
>
> **`drawThorn()`** in `src/14-render-entities.js`. ⛔ `entityPoints()` does not
> apply — a Thorn is a segment along the lane, not a silhouette at a point. Use
> `drawShot()`'s shape instead: module-level preallocated scratch points, two
> `screenPos` calls, one `drawPoly`, one `glowStroke`. ⛔ No per-frame allocation.
> Draw the body from `depth 0` to the tip in `C.THORN_COLOR`, plus a brighter
> `C.THORN_TIP_LEN` segment at the tip so a chip is visible as it lands. ⛔ §10.3 is
> about what may be drawn *over* the throat zone; the Thorn is lane geometry and
> draws at full alpha at every depth, exactly as the Vaulter does.
>
> **The Weaver's lay, filling P3's hook.** While climbing, the Weaver grows the
> Thorn in its lane so the tip tracks its own depth, clamped to `C.THORN_MAX` —
> §8's "clamp: lane length". ⛔ **It adopts a live Thorn already in its lane rather
> than creating a second.** Two overlapping Thorns are two hit-point pools behind
> one silhouette: a §1.1 P2 failure and a scoring oddity at once. Write a
> `thornInLane(state, well, lane)` lookup for that; ⛔ `laneDelta`, never a bare
> subtraction. A Weaver killed mid-climb leaves its Thorn at the length it reached.
>
> The Thorn enters through `spawnEnemy()` like everything else. Note in the comment
> that the safe-spawn rule is harmless here precisely because the Weaver *grows*
> the Thorn rather than dropping a finished one: it is created near the throat,
> where the rule has nothing to do.
>
> Add to `C`: `THORN_MAX` (1.00), `THORN_TIP_LEN` (0.05). `THORN_CHIP` (0.08) and
> `THORN_COLOR` already exist.
>
> **Write `scratchpad/test-cs004-p4.js`** asserting: a Thorn survives the Purge's
> first use and is never its second use's victim even when it is the entity nearest
> the rim; a well with a full-length Thorn and nothing else alive, quota spent,
> clears; a shot stops at the tip, chips exactly `THORN_CHIP`, is consumed, and
> frees its slot the same step; held fire chips repeatedly and kills the Thorn in
> the expected number of shots; a Thorn chipped past zero dies; ⛔ a Thorn at
> `depth 0.9` is exactly `0.9` after a real player death and respawn; a Weaver
> grows a Thorn as it climbs, clamped at `THORN_MAX`; a second Weaver entering the
> same lane adopts the existing Thorn rather than creating a second; and a Weaver
> killed mid-climb leaves its Thorn standing.
>
> ⛔ Mutation-check, do not merely assert: a Thorn that returns `false` from
> `onShot`, a `purgeable` Thorn, a Thorn that blocks the clear, dropping the
> anchored skip, and a Weaver that creates a second Thorn must each turn the suite
> red.
>
> Do not build the Dive. Do not wire §4.5's fifth death condition — there is
> nothing to die in. Do not add scoring. Update `STATUS.md` and commit.

---

## P5 — the soak, the docs, the close

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §0, §1, §3.5, §4.2,
> §4.3, §4.5, §6.1, §6.2, §6.3, §6.5, §17. Read `scratchpad/test-cs003-p5.js`
> before you write a line of the soak — it already owns the fixtures, the hash, the
> adversarial input generator and the teleport detector, and this phase extends
> that work rather than restating it. This is the closing phase for CS004.
> ultrathink.
>
> No new gameplay. Four GDD §17 items, the docs, and the close.
>
> **Write `scratchpad/test-cs004-p5.js`,** driving the real `startGame` /
> `nextWell` / `update(1/60)` — ⛔ never an inlined copy of the logic:
>
> - **§17 item 3, extended past CS003's version.** 5,000 ticks on each of the six
>   open wells with all four kinds live via `DEBUG_SPAWN_KINDS`, splitting, laying,
>   chipping and firing, plus adversarial rotation input. No `lane` outside
>   `[0, lanes-1]`, no `depth` outside `[0,1]`, no NaN in state or in any projected
>   point, no array growing without bound.
> - ⛔ **And the range check is not enough — CS003 P5 proved that.** A hop that
>   wraps on a 13-lane strip sends lane 12 to lane 0, and lane 0 is inside
>   `[0, 12]`; `test-cs003-p5.js` catches it with a per-tick lane SPEED bound,
>   `MAX_LANE_STEP = 2 * DT / C.VAULT_HOP_TIME`. For CS004 the correct assertion is
>   **stronger and simpler than a bound**, because none of the four entities landing
>   here hops at all: a Carrier, Weaver, Thorn or bolt's `lane` is **exactly** the
>   lane it entered with, on every tick, on every well. Exact equality, no epsilon.
>   Leave `MAX_LANE_STEP` as the Vaulter's; it has to become per-entity in CS005,
>   when the Drifter becomes the first thing that moves continuously in lane space,
>   and that is that changeset's to do.
> - **§17 item 1 re-verified with the new draws.** The Carrier's split spends two
>   draws it did not spend before. Same seed and same recorded input list ⇒
>   identical state hash after 10,000 ticks: twice in one process, once across two.
>   ⛔ `installSeed()` above everything, before the first build. ⛔ The recorded list
>   still presses neither `r` nor `w`, and must not press the five new debug keys
>   either — a spawn action inside a hashed run makes the hash depend on a key map.
> - **§17 item 5 re-verified against a mixed board.** The Purge's two uses with a
>   non-purgeable entity present, which was untestable until this changeset.
> - **§17 item 6.** Carrier splits, correct count and type for the one shipped
>   cargo row. ⛔ Write it as a loop over the `CARGO` table so CS005 adds two rows
>   and no test.
> - 20 seeded runs to game over on a mixed `DEBUG_SPAWN_KINDS`, no exception, no
>   NaN.
>
> ⛔ Raise `enemies` from 1 to 4 in `scratchpad/test-registry.js`, and check it
> against `ENEMY_KINDS` the way `test-cs003-p5.js` already does — note that
> `ENEMY_KINDS` will hold more rows than four (the three cargo kinds and the bolt),
> so the check is not a bare length comparison. The count is §6.1 roster rows:
> Vaulter, Carrier, Weaver, Thorn. The bolt is a projectile and is not one.
> `STATE_FIELDS` gets no `CS004` key — this changeset adds no `state` fields.
>
> **Then the docs.** Edit in place, in this commit; never print one for
> copy-paste.
>
> - GDD §6.1, §6.2, §6.3 and §4.5 gain "**Shipped, CS004**" paragraphs in the style
>   §4.1–§4.4 and §6.5 already carry: what was actually built, the constants it
>   shipped with, and the traps a future session should not rediscover.
> - GDD §6.5's field table goes from **six fields to seven**. `anchored` gets its
>   own row, worded as a statement about what `depth` means, with the note that it
>   is not a narrowing of §4.4's settled rim push.
> - GDD §6.5's shipped paragraph gains the split: `spawnEnemy()`'s second caller,
>   why it pushes mid-loop safely, and ⚠ that the Purge kills without calling
>   `onShot`.
> - `CLAUDE.md`: `anchored` joins the entity-lifecycle invariant. Add the ⚠ SETTLED
>   note that the Purge kills Carriers without splitting them — it works by
>   omission, and omissions get "fixed". Keep the file under its 50 KB ceiling; if
>   the Math-and-lifecycle section is over ~4 KB after the edit, move its
>   *reasoning* to `RATIONALE.md` under an anchor and leave the rule, per that
>   file's own valve.
> - `RATIONALE.md`: a `#thorn-depth` section explaining why the Thorn's `depth` is
>   its tip, why that bought a contract field instead of a collision-pass branch,
>   and why the field is orthogonal to §4.4's settled clamp. It is the kind of
>   thing that looks wrong to a fresh reader.
> - `ROADMAP.md`: confirm the CS004/CS005 split and the +1 renumber are in place
>   and that CS004's row matches what actually shipped.
> - `log/CS004.md`: the narrative, the shipped constants, and every judgment call
>   the five phases made. `STATUS.md`'s phase ledger moves into it and `STATUS.md`
>   resets for CS005.
> - Carry forward in `STATUS.md`, explicitly, because they are real and unowned:
>   the six enemy colours are ⚠ provisional and `tools/glow-lab.html` still does
>   not exist; ⚠ `C.DEBUG_SPAWN_KINDS` and its reader are temporary and belong to
>   whichever changeset lands the introduction schedule; `drawWell()`'s `laneState`
>   is still unwired; `laneHop()`'s half-lane fold point and a per-entity
>   `MAX_LANE_STEP` are both CS005's, with the Drifter as the entity that makes
>   them matter; and `throatOffset` and the degenerate Flat well are still open
>   design calls for Paul.
> - Add to `STATUS.md`'s playtest asks: does a grown Thorn protecting an enemy
>   spawned behind it read as a consequence or as the game cheating? Does a
>   full-length Thorn sealing its own lane feel like lane denial or like a wall? Is
>   the cargo glyph readable at throat depth, which §6.2 says is the skill that
>   separates competent from good? And press `0` — do the four colours separate
>   from each other and from a cyan well?
>
> **Then close.** `node build.js` and `node scratchpad/run-all.js`, green, zero
> skips. Move `PLANNED-FEATURES-CS004.md` and `IMPLEMENTATION-PHASES-CS004.md`
> into `archive/`. ⛔ Move, do not copy. `log/CS004.md` stays where it is. Commit.

---

## Assumptions and decisions

| # | Decision | What would change it |
|---|---|---|
| 1 | Five phases, matching CS003's shape | P1 is a contract change and P4 is where it is proved through the real death path, so neither folds into a neighbour. If P3 finishes in half a session, fold it into P2 next time rather than padding it |
| 2 | P1 is a contract-and-housekeeping phase with no enemy in it | The `anchored` bug is live in the build today and invisible; the pointer sweep is only correct before the phases that would copy the stale numbers; and the duplicate harness is a trap for P2 specifically. All three want to be done before any enemy lands, and none of them wants to share a session with one |
| 3 | ⛔ P1's prompt pre-authorises the edit under §4.4's ⚠ SETTLED marker, explicitly and in Paul's voice | Without it the correct behaviour is to stop, and the phase stalls. If a session reads the authorisation and still thinks the change is a narrowing, it should stop and say so — that is the marker working |
| 4 | Opus 5 throughout, effort varied rather than model varied | Same reasoning as CS003. Every phase either changes a contract five more entities inherit or touches the collision pass, and the cheap-model saving is one session against a possible CS005 rewrite |
| 5 | `ultrathink` on P1, P2, P4 and P5 | P1 changes the contract under a marker. P2 mutates the array the collision pass is walking and has a wrong-on-six-wells trap. P4 owns the settled chip economy and the proof of P1's fix. P5 extends a soak whose central finding is counter-intuitive. P3 is prescriptive enough that the lever buys little |
| 6 | The debug bench lands in P1, before any enemy it can spawn | Three of its five actions are no-ops for a phase or two, which is cheap. The alternative is each enemy phase growing the input wiring a little, which is four chances to add a second listener |
| 7 | Each phase writes one test file named for the phase; P5 writes the cross-cutting ones and is the only phase that touches `test-registry.js` | Matches CS001 through CS003 |
| 8 | P5 extends `test-cs003-p5.js`'s approach rather than re-deriving it | That file already owns the hash, the adversarial generator and the teleport detector, and its central finding — that a range check misses a wrapping hop — is the kind of thing a fresh session would not rediscover in one sitting |
| 9 | The `CARGO` table and §17 item 6's test are both written as loops over one row | CS005 adds the Drifter and Surger rows by editing data. If either needs its own split geometry, that is a finding, and a second helper is cheaper than a second table |
| 10 | P5 archives both CS004 planning docs | Same as CS002 and CS003: the root holds only the changeset in flight |