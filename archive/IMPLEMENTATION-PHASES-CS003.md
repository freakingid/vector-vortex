# IMPLEMENTATION-PHASES-CS003

One phase per Claude Code session. `/clear` between phases. Commit per phase on
`main`; never push.

Each phase below is the literal prompt to paste. Keep them self-contained — a
session reads `CLAUDE.md` and `STATUS.md` automatically, and nothing else unless
the prompt names it.

⛔ **`ultrathink` appears inside the prompt text where it is wanted.** It is a
per-turn lever, not a session setting, so it has to be in the pasted message.

| Phase | Builds | Model | Effort |
|---|---|---|---|
| P1 | RNG, entity contract, the Vaulter | Opus 5 | **high** |
| P2 | Spawner, `startGame`/`nextWell`/`enterWell`, well-clear | Opus 5 | medium |
| P3 | Collision pass, the Purge | Opus 5 | medium |
| P4 | Death, lives, respawn | Opus 5 | **high** |
| P5 | Invariant soak, docs, close | Opus 5 | **high** |

High effort where a wrong first guess costs a later changeset: P1 sets the
contract eight more enemies inherit, P4's death sequence interleaves with
hit-stop and the input latch, and P5 owns the two GDD §17 invariants.

---

## P1 — the RNG, the entity contract, and the Vaulter

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §0, §1, §3.2, §3.5,
> §6.1, §6.3, §6.5, §10.2, §16.1. ultrathink.
>
> Build three things.
>
> **`src/01-rng.js`** — it is still a placeholder. `mulberry32(seed)` returning a
> 0..1 generator, and a small wrapper for the draws the game actually makes
> (`rngInt(rng, n)`, `rngPick(rng, arr)`). The run's stream is created in
> `startGame()`, which does not exist yet — P2 builds it — so for now expose the
> factory and add `seed` and `rng` to `src/02-state.js`, with `rng` created from
> a fixed default in `newState()` so the suite has a stream to drive. ⛔ Nothing
> in `src/` may ever call `Math.random`.
>
> **`src/07-enemies.js`** — the contract, then the Vaulter.
>
> A thin `Enemy` base class carrying exactly: `lane`, `depth`, `dead`,
> `purgeable` (default true), `blocksClear` (default true), `killDepth` (default
> null), and the method signatures `update(dt, well, state)`, `draw(ctx, well)`,
> `onShot(shot)`. ⛔ No movement, no AI, no draw code in the base — it exists so
> the ninth enemy cannot forget a field, and the moment it holds behaviour, five
> enemies that do not climb will inherit a climb rate. Document each field for a
> session that has not read this prompt: `purgeable` is §4.3's "the Purge does
> not remove Thorns", `blocksClear` is why a Thorn is still there during the
> Dive, `killDepth` is §4.5's contact rule as a number (`null` = contact never
> kills), and `onShot` returns whether the shot is consumed.
>
> Then `class Vaulter extends Enemy`, per §6.1 and §6.3:
>
> - Climbs from `depth 0` at `C.VAULT_CLIMB`, monotonically, and stops at the
>   rim rather than passing it.
> - Vaults one lane every `C.VAULT_INTERVAL` while climbing, taking
>   `C.VAULT_HOP_TIME` to cross — `lane` is continuous through the hop, so the
>   craft is hittable in both lanes it is near. ⛔ No vaulting below
>   `C.VAULT_FIRST_LEVEL` (§6.3: level 1 Vaulters climb straight up, which is
>   how the player learns what a lane is).
> - At the rim it hunts: a hop toward the Skimmer every `C.VAULT_RIM_INTERVAL`,
>   direction from `laneDelta` (the short way round on a closed well).
>   ⛔ Rim hunting is **not** level-gated — §6.1 attaches the L2 gate to
>   vaulting only, and §12 promises a passive player dies on level 1.
> - `killDepth` is `1 - C.RIM_CONTACT_DEPTH`. `onShot` sets `dead` and consumes
>   the shot.
>
> ⛔ **Every lane hop goes through `laneHop()` from `03-wells.js`, and the
> Vaulter writes back the `dir` it returns.** That helper was built in CS001 and
> has had no caller until now. Read its header comment before you write the hop.
> An enemy that stores its own heading and asks the helper only for a position
> keeps a stale direction after a bounce and grinds against an open well's wall
> forever. This is GDD §17 item 3 and §3.5's named bug.
>
> **`src/14-render-entities.js`** — the shared entity projection helper, then the
> Vaulter's draw.
>
> ⛔ There is a trap here worth slowing down for. `perspective()` is
> `depth^0.55`, so a silhouette drawn with a *constant* depth offset — the way
> `SKIMMER_POLY` is, correctly, because the Skimmer never leaves depth 1 —
> covers roughly 13% of the well at the throat and 3% at the rim. An enemy drawn
> that way would shrink as it approached the player. An entity's drawn depth
> extent must scale with its own perspective position: offset in perspective
> space by `C.ENEMY_DEPTH_SCALE` and convert back. Add `invPerspective(p)` beside
> `perspective()` in `03-wells.js` for that, and put the shared helper — call it
> `entityPoints(well, lane, depth, poly, size)` — in `14-render-entities.js`
> where the eight later enemies will reuse it. Preallocate its scratch array; ⛔
> no per-frame allocation in the hot path.
>
> The Vaulter's silhouette is §6.1's flattened X, as a local-space point array in
> lane/depth offsets, sized by `C.VAULTER_SIZE`, drawn through `drawPoly` +
> `glowStroke` in `C.VAULTER_COLOR`. ⛔ No fill, no sprite, no per-entity
> pipeline. It must be ours, not Atari's bowtie — §18.
>
> Add to `C` in `src/00-config.js`, grouped: `ENEMY_DEPTH_SCALE` (0.10),
> `VAULTER_SIZE` (0.70), `VAULTER_COLOR` ("#FF4A4A" — mark it ⚠ placeholder, same
> standing as `SKIMMER_COLOR`), `VAULT_CLIMB` (0.18), `VAULT_INTERVAL` (2.20),
> `VAULT_HOP_TIME` (0.28), `VAULT_RIM_INTERVAL` (0.55), `VAULT_FIRST_LEVEL` (2),
> `RIM_CONTACT_DEPTH` (0.05).
>
> Write `scratchpad/test-cs003-p1.js` asserting: a Vaulter climbs monotonically
> and stops at the rim; it does not vault below `VAULT_FIRST_LEVEL` and does at
> and above it; a rim Vaulter hops toward the Skimmer and takes the short way
> across a closed well's seam; ⛔ on each of the six open wells, 5,000 ticks of a
> vaulting Vaulter never puts `lane` outside `[0, lanes-1]`, it reverses at a
> wall rather than parking or wrapping, and two bounces restore its original
> heading; the contract fields exist with their documented defaults; the drawn
> silhouette's screen height at depth 0.1 is smaller than at depth 0.9; and no
> projected point is NaN on any of the sixteen wells across depths 0 to 1.
>
> Nothing spawns Vaulters yet and nothing can shoot one — the test constructs
> them directly. Do not build the spawner, collision, the Purge, or death. Do not
> add scoring. Update `STATUS.md` and commit.

---

## P2 — the spawner and the well lifecycle

**Model: Opus 5 · Effort: medium**

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §0, §1, §2, §6.3,
> §6.5, §12, §16.1.
>
> Build `src/08-spawner.js` and the well lifecycle in `src/23-main.js`.
>
> **The spawner.** `state.spawn` is `{ timer, remaining }` — ⛔ `timer` counts UP
> toward `C.SPAWN_INTERVAL` and `remaining` starts at `C.SPAWN_QUOTA` (GDD
> §16.3: count-up timers only, no countdown anywhere in the build). A spawn
> happens when the interval is reached, the quota is not spent, and fewer than
> `min(C.ENEMY_CONCURRENT, C.ENEMY_CAP)` enemies are alive. ⛔ `C.ENEMY_CAP` is a
> readability constraint, not a difficulty knob — do not read it as one and do
> not raise it.
>
> ⛔ **One spawn entry point: `spawnEnemy(kind, lane, depth)`.** It owns §6.3's
> rule — never spawn in the Skimmer's lane above `C.SAFE_SPAWN_DEPTH` — so
> CS004's Carrier splits inherit it rather than each re-implementing it. Lane
> choice draws from `state.rng`, with up to `C.SPAWN_LANE_TRIES` deterministic
> redraws to avoid stacking a new enemy on one already near the throat.
>
> **The lifecycle.** Three functions, one path:
>
> - `enterWell()` — clears `state.enemies` and `state.shots`, re-arms the Purge
>   charge, resets the spawner. ⛔ Every entry into a well goes through it.
> - `nextWell()` — raises `state.level` by one, sets `state.wellIndex` to
>   `(level - 1) mod WELLS.length` (GDD §3.4's shapeIndex), then `enterWell()`.
> - `startGame(seed)` — resets run state, creates `state.rng` from `state.seed`
>   (the argument, or a time-derived value when absent — record the seed so a run
>   can be replayed), then `enterWell()`. Call it from boot in place of the
>   current lazy Skimmer minting.
>
> ⛔ Route the debug well-cycler through `enterWell()` too. In CS002 it swapped a
> backdrop; with enemies alive, cycling from a 16-lane well to an 11-lane one
> would strand entities on lanes that do not exist.
>
> **Well-clear.** ⛔ Two conditions, not one: the quota is spent **and** no enemy
> with `blocksClear` remains. "No enemies alive" alone is true one tick after
> `startGame()` and in every gap between spawns. On clear, hold for
> `C.WELL_CLEAR_HOLD` — ⚠ a temporary count-up pause, deleted in CS005 when the
> Dive replaces it — then `nextWell()`.
>
> Hang the enemy update pass and the end-of-frame `.filter()` in `Game.update()`
> where the `// CS003 hangs the enemies here` comment is, and add enemies to
> `draw()`'s z-order between the well and the shots. ⛔ Never splice mid-loop.
>
> Add to `C`, grouped: `SPAWN_INTERVAL` (1.60), `SPAWN_QUOTA` (10),
> `ENEMY_CONCURRENT` (3), `SPAWN_LANE_TRIES` (4), `WELL_CLEAR_HOLD` (1.00). Do
> **not** add `SPAWN_MIN` — it is a floor on a heat-derived interval and heat is
> CS005's.
>
> Two stale comments to correct in this same commit, both written before
> `ROADMAP.md` existed: `23-main.js` says "CS006 owns start and respawn" (start
> is this phase, respawn is P4), and `02-state.js` says the shapeIndex mapping
> "arrives with the Dive (CS004)" (the Dive is CS005, and `nextWell()` takes
> `wellIndex` here).
>
> Write `scratchpad/test-cs003-p2.js` asserting: spawn spacing matches
> `SPAWN_INTERVAL`; concurrent alive never exceeds `min(ENEMY_CONCURRENT,
> ENEMY_CAP)` over a long run; the quota exhausts and no further spawn happens;
> ⛔ `spawnEnemy()` never places an enemy in the Skimmer's lane above
> `SAFE_SPAWN_DEPTH`, including when called directly; the well does not clear
> while the quota has spawns left, and does once it is spent and the array is
> empty of `blocksClear` enemies; `nextWell()` raises the level, picks the
> `(level-1) mod 16` shape, clears shots and re-arms the Purge; cycling wells
> leaves no entity on an out-of-range lane; two runs from the same seed produce
> the identical spawn lane sequence; and ⛔ a source scan of the built file finds
> no `Math.random`.
>
> Do not build collision, the Purge's effect, or death. Update `STATUS.md` and
> commit.

---

## P3 — collision and the Purge

**Model: Opus 5 · Effort: medium**

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §0, §1, §4.2, §4.3,
> §4.5, §6.5.
>
> Build `src/09-collision.js` and the Purge consumer.
>
> **Collision.** ⛔ One pass, fixed deterministic order, called from
> `Game.update()` after the entity pass and before the cleanup filter. Collision
> is a 1-D overlap on `depth` plus a lane match — ⛔ no trigonometry, no screen
> coordinates, no distance in pixels.
>
> - **Shots vs enemies.** A shot within `C.HIT_LANE_TOL` lanes and
>   `C.HIT_DEPTH_TOL` depth of an enemy calls `enemy.onShot(shot)`; if the enemy
>   returns that the shot is consumed, the shot dies and frees its slot the same
>   step. ⛔ One shot resolves against at most one enemy per step. Iterate in a
>   fixed order so the same seed and the same inputs always pick the same
>   target.
> - **Enemies vs the Skimmer.** An enemy whose `killDepth` is not null, whose
>   `depth >= killDepth`, and whose lane is within `C.HIT_LANE_TOL` of the
>   Skimmer's, kills the player. P4 owns what "kills" does — for this phase, call
>   a single `killSkimmer()` that sets `state.skimmer.dead` and nothing else, so
>   P4 has exactly one place to fill in.
>
> **The Purge** (§4.3). One charge per well, re-armed by `enterWell()`, ⛔ never
> accumulated. `state.purgeUses` counts up:
>
> - First use: every enemy with `purgeable` is killed. ⛔ Non-purgeable ones are
>   untouched — that is §4.3's "does not remove Thorns", and CS004's Thorn is the
>   reason the flag exists.
> - Second use in the same well: exactly **one** enemy dies — the purgeable one
>   nearest the rim (highest `depth`). ⛔ The tie-break must be deterministic
>   (lowest lane, then array order) so the player can predict which one. No
>   bonus.
> - Third and later: nothing.
>
> ⛔ `state.input.purge` is a **level, not an edge** — all four devices write a
> held boolean. Keep a `state.purgeLatched` flag and fire only on the rising
> edge, so holding the button spends one charge. P4 will set that latch on death
> for a related reason; leave a comment saying so.
>
> Add to `C`, grouped: `HIT_LANE_TOL` (0.50), `HIT_DEPTH_TOL` (0.05).
>
> ⛔ Award no points for anything. `addScore()` is CS006's single entry point and
> the way to keep it single is to not build a temporary second one now.
> `PTS_VAULTER` and `PURGE_SAVED_BONUS` stay unread this changeset.
>
> Correct `06-shots.js`'s header while you are in it — it says there is nothing to
> collide with yet.
>
> Write `scratchpad/test-cs003-p3.js` asserting: a shot overlapping a Vaulter
> kills it and is consumed; a shot one lane over is not; one shot never kills two
> enemies in a step; an enemy in the Skimmer's lane at its `killDepth` kills, the
> same enemy one lane over does not, and an enemy with `killDepth === null` never
> does; the first Purge clears every purgeable enemy and leaves a constructed
> non-purgeable one alive; the second removes exactly one and it is the
> rim-nearest, with the tie-break stable across repeated runs; the third does
> nothing; the charge re-arms on `enterWell()` and does not accumulate; and
> holding the purge button for 60 ticks spends exactly one charge.
>
> Do not build the death sequence, lives, respawn or the game-over stop — that is
> P4. Update `STATUS.md` and commit.

---

## P4 — death, lives, respawn

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §0, §1, §4.4, §4.5,
> §6.3, §16.3. ultrathink.
>
> Fill in `killSkimmer()` from P3 and build the death sequence.
>
> `state` gains `lives` (from `C.START_LIVES`) and `invulnTime`. ⛔ `invulnTime`
> counts UP toward `C.RESPAWN_INVULN` and starts AT the threshold — already
> expired — the same pattern `shotCooldown` and `squashTime` use, so a fresh run
> is not born invulnerable.
>
> **Death.** One life is spent, `skimmer.dead` is set, and
> `Game.hitStop(C.HIT_STOP_DEATH)` freezes simulation time. An invulnerable
> Skimmer cannot die and can still fire.
>
> ⛔ **Three things about the freeze, and each one is a real trap.**
>
> 1. `update()` does not run during hit-stop, so nothing you write inside it
>    advances. The respawn therefore happens on **the first live step after the
>    freeze** — the step that sees `skimmer.dead` — not on a timer you start at
>    death.
> 2. §4.4's rim push happens **at respawn, not at death**: every enemy at or
>    above the rim is pushed to `C.RESPAWN_PUSH_DEPTH` on that first live step.
>    Pushing at death teleports the killing enemy during the 1.2 s freeze the
>    player is staring at, and the freeze is there to show them what happened.
> 3. `input.sample()` **does** still run during hit-stop — CS002 P1 drains the
>    devices deliberately so a freeze does not dump a second of banked mouse
>    motion into the first live step. The consequence is that a Purge held
>    through a death arrives at that step looking like a fresh press. ⛔ Death
>    sets `state.purgeLatched`, so the button needs a release before it fires
>    again.
>
> **Respawn.** A new Skimmer in the same lane it died in, `invulnTime` reset to
> zero, blinking at `C.INVULN_BLINK_HZ` while it counts up. Mint it the same way
> `enterWell()` does — one code path, not two that agree today.
>
> **Game over.** ⛔ Lives at zero sets `state.screen = "gameover"` and the
> gameplay systems stop stepping. This is a stop, not a screen — CS006 owns the
> game-over UI, the score submission and the restart flow. Add a named debug
> action `restart` bound to `r`, dispatched through `04-input.js`'s existing
> `actionKeys` path, calling `startGame()`. ⛔ Do not add a second input path for
> it; that is the failure §9.5 exists to prevent.
>
> Add to `C`: `INVULN_BLINK_HZ` (6).
>
> ⛔ No extra-life award at 20,000 — that is `addScore()`'s job in CS006, and
> there is no scoring in this changeset. `LIVES_MAX` and `EXTRA_LIFE_*` stay
> unread. ⛔ No fragmentation particles: §4.4's fragmentation is a `kit-fx`
> primitive and lands with the death presentation pass in CS006. Death here reads
> as hit-stop plus a blink.
>
> Correct `05-skimmer.js`'s header comment while you are in it — it says "death is
> CS006's", which was written before `ROADMAP.md` and is stale.
>
> Write `scratchpad/test-cs003-p4.js` asserting: contact costs exactly one life
> and triggers a hit-stop of `HIT_STOP_DEATH`; no second life is lost during the
> freeze however many enemies are touching; respawn happens on the first live
> step after it, in the same lane; ⛔ enemies at the rim sit at
> `RESPAWN_PUSH_DEPTH` after that step and were still at the rim during the
> freeze; an invulnerable Skimmer survives contact for exactly `RESPAWN_INVULN`
> and dies the moment it lapses; ⛔ a purge held from before the death through to
> after it does not spend a charge; lives at zero sets `screen` to `"gameover"`
> and stops spawning and moving enemies; and `startGame()` from game over
> restores `START_LIVES` and a live Skimmer.
>
> Do not build the game-over screen, scoring, the HUD, or particles. Update
> `STATUS.md` and commit.

---

## P5 — the invariant soak, docs, and the close

**Model: Opus 5 · Effort: high**

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §0, §1, §3.5, §4.3,
> §4.4, §6.1, §6.3, §6.5, §17. This is the closing phase for CS003. ultrathink.
>
> No new gameplay. Two invariants, the docs, and the close.
>
> **Write `scratchpad/test-cs003-p5.js`,** driving the real `startGame` /
> `nextWell` / `update(1/60)` — ⛔ never an inlined copy of the logic:
>
> - **GDD §17 item 1, re-verified.** Determinism was trivially true until this
>   changeset, because the build contained no randomness. Now it does. Same seed
>   and same recorded input list ⇒ identical state hash after 10,000 ticks: twice
>   in one process and once across two processes. Include the enemy array in the
>   hash. ⛔ `installSeed()` above everything, before the first build.
> - **GDD §17 item 3, the one this whole depth model exists for.** 5,000 ticks on
>   each of the six open wells, with enemies spawning, vaulting, hunting and
>   dying, and adversarial rotation input: no entity's `lane` ever outside
>   `[0, lanes-1]`, no NaN anywhere in state or in any projected point, and no
>   array growing without bound.
> - A short seeded soak — 20 runs to game over — with no exception thrown.
>
> ⛔ Raise `enemies` to 1 in `scratchpad/test-registry.js`. That count lives
> there and in no other file.
>
> **Then the docs.** Edit in place, in this commit; never print one for
> copy-paste.
>
> - GDD §4.3, §4.4, §6.1, §6.3 and §6.5 gain "**Shipped, CS003**" paragraphs in
>   the same style §4.1 and §4.2 already carry — what was actually built, the
>   constants it shipped with, and the traps a future session should not
>   rediscover. §6.5's paragraph is the important one: it is what CS004 reads
>   before adding five enemies, so spell out the contract fields, the one spawn
>   entry point, the one enemy array, and `enterWell()`.
> - ⛔ GDD §6.5 says new enemies wire into "**five** places" and then lists six.
>   `CLAUDE.md` says six. Correct the number.
> - `CLAUDE.md`'s code map: `07-enemies.js`, `08-spawner.js` and
>   `09-collision.js` are no longer placeholders. Keep it under its 50 KB
>   ceiling.
> - `log/CS003.md`: the narrative, the shipped constants, and every judgment call
>   the five phases made. `STATUS.md`'s phase ledger moves into it and `STATUS.md`
>   resets for CS004.
> - Carry forward in `STATUS.md`, explicitly, because they are real and unowned:
>   §12's promise that a passive player dies on level 1 within four seconds is
>   not yet delivered — it needs spawn lanes weighted toward the player's lane,
>   which is onboarding tuning for CS013. `VAULTER_COLOR` is a ⚠ placeholder like
>   `SKIMMER_COLOR`, and `tools/glow-lab.html` is listed in `CLAUDE.md` but does
>   not exist. `drawWell()`'s `laneState` parameter is still unwired — lane
>   occupancy lighting belongs with the dim band in CS005.
>
> **Then close.** `node build.js` and `node scratchpad/run-all.js`, green, zero
> skips. Then move `PLANNED-FEATURES-CS003.md` and
> `IMPLEMENTATION-PHASES-CS003.md` into `archive/`. ⛔ Move, do not copy — the
> repo root holds only the changeset in flight, which is what makes `archive/`'s
> never-read-by-default contract worth having. `log/CS003.md` stays where it is.
> Commit.

---

## Assumptions and decisions

| # | Decision | What would change it |
|---|---|---|
| 1 | Five phases, not four | CS003 is the largest changeset since CS001 and its last phase owns two GDD §17 invariants that no build phase can own alone. If P5 finishes in half a session, fold the close into P4 next time |
| 2 | Opus 5 throughout, effort varied rather than model varied | Every phase here touches the contract eight later enemies inherit or an invariant with a named historical bug behind it. The cheap-model saving is one session; a wrong entity contract is a CS004 rewrite |
| 3 | `ultrathink` on P1, P4 and P5 only | P1 sets the contract and carries two traps (`laneHop` write-back, perspective-space sizing). P4 interleaves with hit-stop and the input latch. P5 owns the soak. P2 and P3 are prescriptive enough that the lever buys little |
| 4 | P1 builds the RNG even though the spawner in P2 is its first real consumer | The alternative is P2 writing both a spawner and a random-number system in one session, and `01-rng.js` being a placeholder is a finding that belongs at the front of the changeset, not in the middle |
| 5 | P3's `killSkimmer()` is a one-line stub that P4 fills | It gives the collision pass a real call site without P3 needing to know what death does, and gives P4 exactly one place to write into |
| 6 | Each phase writes one test file named for the phase, and P5 writes the cross-cutting one | Matches CS001 and CS002. `test-registry.js` is touched by P5 only |
| 7 | Stale changeset pointers are corrected by the phase that touches the file, not swept in P5 | A comment saying "CS006 owns this" reads as shipped truth to a session that finds it, and it should be wrong for the shortest possible time |
| 8 | P5 archives both CS003 planning docs | Same reasoning as CS002: the root holds only the changeset in flight |