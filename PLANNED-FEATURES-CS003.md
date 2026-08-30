# PLANNED-FEATURES-CS003 — The entity spine

**Changeset:** CS003 · **Status:** not started · **Depends on:** CS002 complete
**GDD sections in scope:** §4.3 (Purge), §4.4 (lives), §4.5 (death conditions),
§6.1 (roster — the Vaulter row), §6.3 (behaviour notes), §6.5 (entity contract),
§16.1 (non-negotiables), §17 items 1, 3 and 5

---

## Why this changeset exists

CS002 proved the rim. Nothing in the build can be hit, and nothing can hit you.
This changeset makes both true at once and, more importantly, decides **the
shape every later entity is poured into**. CS004 adds five enemies and three
Carrier variants; CS011 adds three more. If the contract they wire into is
vague, that vagueness gets copied nine times.

So CS003 is one enemy and the whole spine around it: the class contract, the one
spawn entry point, the one collision pass, the one well-entry path, death,
respawn, and the Purge. The Vaulter is here to be the thing that exercises it,
not because the Vaulter is interesting.

---

## Scope check against what CS002 actually shipped

Read before assuming `ROADMAP.md`'s one-liner is still exact. Four findings; the
scope holds, and it grows by one module.

**1. ⛔ `src/01-rng.js` is still a placeholder.** Nothing in the build has needed
randomness yet, so `mulberry32` was never written. The spawner is the first
consumer. CS003 builds it (P1), or the spawner reaches for `Math.random` and
GDD §17.1's determinism guarantee — currently true only because there is no
randomness at all — quietly stops being true. `ROADMAP.md`'s CS003 line does not
mention this; it is in scope.

**2. `startGame()` and `nextWell()` do not exist.** `Game.reset()` is the only
lifecycle function. But `CLAUDE.md`'s six-places rule names `startGame` reset and
the well-clear condition, and GDD §17 says tests drive "real `startGame` /
`nextWell` / `update(1/60)`". Both are CS003's to introduce, because CS004 wires
five enemies into them.

**3. Three source comments assign this work to the wrong changeset.** They were
written before `ROADMAP.md` existed and are stale, not a competing plan:

| File | Says | Correct |
|---|---|---|
| `05-skimmer.js` | "death is CS006's" | CS003 (P4) |
| `23-main.js` | "CS006 owns start and respawn" | CS003 (P2 start, P4 respawn) |
| `02-state.js` | "the Dive (CS004)" takes `wellIndex` | The Dive is CS005; `nextWell()` takes `wellIndex` in CS003 P2 |

⛔ The phase that touches each file corrects the comment in the same commit.
CS006 keeps the *game-over screen*, scoring and the HUD; CS003 owns the death
*sequence*.

**4. CS002's two carried items land here, as expected.** The Skimmer exposes
`dead` and nothing sets it (P4 sets it). Shots exist with no collision pass (P3
adds it). Also: `input.purge` is already populated on all four devices — the
gamepad map landed in CS002's closing commit — so CS003 adds only the consumer.
⛔ The struct carries a **level**, not an edge; the Purge consumer does its own
edge detection. See Hazards.

**Verdict: CS003's scope as written in `ROADMAP.md` still makes sense,** plus
`01-rng.js`. Nothing CS002 P4 built reshapes it.

---

## What ships

- **P1 — the RNG, the entity contract, and the Vaulter.** `src/01-rng.js`
  (`mulberry32`, the run stream), the contract in `src/07-enemies.js`, the
  Vaulter, and the shared entity projection helper in
  `src/14-render-entities.js`.
- **P2 — the spawner and the well lifecycle.** `src/08-spawner.js`, plus
  `startGame()` / `nextWell()` / `enterWell()` in `src/23-main.js` and the
  well-clear condition.
- **P3 — collision and the Purge.** `src/09-collision.js`: shot↔enemy,
  enemy↔Skimmer, and the Purge's two uses.
- **P4 — death, lives, respawn.** The death sequence, the hit-stop trigger,
  invulnerability, the rim push, and a debug game-over stop.
- **P5 — the invariant soak and the close.** GDD §17 items 1 and 3 across all
  six open wells, the registry count, docs, archive. Closing phase.

### The entity contract — the thing CS004 inherits

⛔ **Every enemy is a class extending a thin `Enemy` base** that carries the
contract fields and no behaviour. The base exists so that adding the ninth enemy
cannot forget a field; ⛔ **if it ever grows movement logic, that is the signal
to flatten it back to independent classes.**

| Member | Kind | What it is |
|---|---|---|
| `lane`, `depth` | field | ⛔ Position, and the only position. No screen coordinate is ever stored. |
| `dead` | field | Set true to kill; removed by the end-of-frame `.filter()`. ⛔ Never spliced mid-loop. |
| `purgeable` | field | ⛔ Whether the Purge destroys it. Default `true`. CS004's Thorn is the first `false`, per §4.3. |
| `blocksClear` | field | Whether it must be gone for the well to clear. Default `true`. The Thorn is `false` — that is exactly why it is still there during the Dive (§5). |
| `killDepth` | field | Contact kills the Skimmer when `depth >= killDepth`. `null` means contact never kills. The Vaulter sets the rim band; CS004's Drifter sets `0` (§4.5 item 2); the Weaver sets `null` — its projectile kills, not its body. |
| `update(dt, well, state)` | method | Movement and AI. |
| `draw(ctx, well)` | method | ⛔ `drawPoly` + `glowStroke` only. |
| `onShot(shot)` | method | The enemy decides what a hit does; returns whether the shot is consumed. The Vaulter dies and consumes. CS004's Thorn chips and consumes (§4.2's chip-away is emergent from that). An armoured Drifter returns `false` and the shot flies on. |

⛔ **One array: `state.enemies`.** Thorns, Carriers and Drifters all live in it;
the flags above decide behaviour. One update pass, one collision pass, one
filter, one z-order entry, one clear condition — which is what `CLAUDE.md`'s
six-places rule is for. A second array would double all six.

⛔ **One spawn entry point,** `spawnEnemy(kind, lane, depth)` in
`src/08-spawner.js`. It owns the §6.3 rule — never spawn in the Skimmer's lane
above `SAFE_SPAWN_DEPTH` — so CS004's Carrier splits inherit it for free rather
than each re-implementing it.

⛔ **One well-entry path,** `enterWell()`. `startGame()`, `nextWell()` and the
debug well-cycler all route through it. With enemies alive, a cycle from a
16-lane well to an 11-lane one otherwise leaves entities on lanes that do not
exist.

### Constants this changeset adds to `C`

⛔ All in `src/00-config.js`, grouped, before first use. Values are starting
points. CS005 owns retuning every one of them through `heat(level)`.

| Group | Constant | Proposed | Note |
|---|---|---|---|
| Enemies | `ENEMY_DEPTH_SCALE` | `0.10` | Drawn depth half-extent as a fraction of the entity's own perspective position. See Hazards — this is what makes an enemy shrink with distance. |
| Enemies | `INVULN_BLINK_HZ` | `6` | Respawn blink rate. |
| Vaulter | `VAULTER_SIZE` | `0.70` | Lane widths spanned. |
| Vaulter | `VAULTER_COLOR` | `"#FF4A4A"` | ⚠ Placeholder, same standing as `SKIMMER_COLOR`. |
| Vaulter | `VAULT_CLIMB` | `0.18` | Depth/s throat→rim ≈ 5.5 s. Level-1 base. |
| Vaulter | `VAULT_INTERVAL` | `2.20` | s between mid-climb hops. |
| Vaulter | `VAULT_HOP_TIME` | `0.28` | s to cross one lane. |
| Vaulter | `VAULT_RIM_INTERVAL` | `0.55` | s between rim hunt hops. |
| Vaulter | `VAULT_FIRST_LEVEL` | `2` | ⛔ §6.3 — no mid-climb vaulting at level 1. |
| Collision | `HIT_LANE_TOL` | `0.50` | Lane units. Half a lane either side. |
| Collision | `HIT_DEPTH_TOL` | `0.05` | Depth units, shot↔enemy overlap. |
| Collision | `RIM_CONTACT_DEPTH` | `0.05` | Depth band below the rim in which enemy contact kills. |
| Spawner | `SPAWN_INTERVAL` | `1.60` | s. Level-1 base. |
| Spawner | `SPAWN_QUOTA` | `10` | Enemies per well. Level-1 base. |
| Spawner | `ENEMY_CONCURRENT` | `3` | ⛔ Alive at once, clamped by `ENEMY_CAP`. §12's "three at a time". |
| Spawner | `SPAWN_LANE_TRIES` | `4` | Deterministic redraws to avoid stacking two spawns in one lane. |
| Well flow | `WELL_CLEAR_HOLD` | `1.00` | ⚠ s of pause between clear and the next well. Temporary — CS005 replaces it with the Dive. |

`SAFE_SPAWN_DEPTH`, `ENEMY_CAP`, `HIT_STOP_DEATH`, `RESPAWN_INVULN`,
`RESPAWN_PUSH_DEPTH`, `START_LIVES`, `LIVES_MAX` and `READABILITY_DEPTH` already
exist and are not re-declared. `SPAWN_MIN` is **not** added — it is a floor on a
heat-derived interval, and heat is CS005's.

### Fields `state` gains

⛔ Only these, and each lands in the phase that reads it (`CLAUDE.md`, and
`02-state.js`'s own header rule).

`seed`, `rng` (P1) · `enemies`, `spawn { timer, remaining }`, `clearHold` (P2) ·
`purgeUses`, `purgeLatched` (P3) · `lives`, `invulnTime` (P4).

⛔ **Every one of those timers counts up** toward a threshold and holds there
(GDD §16.3), matching `shotCooldown` and `squashTime`. No countdown anywhere.

---

## Acceptance criteria

**The contract**

- [ ] ⛔ Every enemy class extends `Enemy` and carries `lane`, `depth`, `dead`,
      `purgeable`, `blocksClear`, `killDepth`, `update(dt, well, state)`,
      `draw(ctx, well)`, `onShot(shot)`.
- [ ] ⛔ No enemy stores a screen coordinate. Position is `(lane, depth)`;
      projection happens at draw time only.
- [ ] ⛔ Enemies are removed by an end-of-frame `.filter()`, never spliced
      mid-loop. The `state.enemies` array length stays bounded over a long soak.
- [ ] The base class carries no movement, no AI, and no draw code.

**The RNG**

- [ ] `mulberry32` is in `src/01-rng.js`; the run's stream is created in
      `startGame()` from `state.seed`, and `state.seed` is readable afterwards
      so a run can be replayed.
- [ ] ⛔ A source scan of the built file finds **no `Math.random`** anywhere.
- [ ] Two runs from the same seed and the same recorded input produce the
      identical spawn lane sequence.

**The Vaulter**

- [ ] Climbs at `VAULT_CLIMB` from `depth 0`, monotonically, and stops at the
      rim rather than passing it.
- [ ] ⛔ Does not vault mid-climb below `VAULT_FIRST_LEVEL`; does at and above
      it, at `VAULT_INTERVAL`. Rim hunting is *not* level-gated — §6.1 attaches
      the L2 gate to vaulting only.
- [ ] At the rim, hops toward the Skimmer at `VAULT_RIM_INTERVAL`, taking the
      short way round on a closed well (`laneDelta`).
- [ ] ⛔ **Wall behaviour.** A hop that would leave an open well reverses and
      comes back — it does not park on the end lane and does not wrap. It writes
      back the `dir` `laneHop()` returns; storing its own heading and asking only
      for a position is the bug that helper's comment exists to prevent.
- [ ] ⛔ On all six open wells, no enemy's `lane` ever leaves `[0, lanes-1]`
      (GDD §17 item 3).
- [ ] Drawn through `drawPoly` + `glowStroke` from a local-space point array, and
      its drawn size shrinks with depth — screen height at `depth 0.1` is
      visibly smaller than at `depth 0.9`.
- [ ] No NaN in any projected point on any of the sixteen wells, at depths
      spanning `0` to `1`.

**The spawner and the well lifecycle**

- [ ] Spawn spacing is `SPAWN_INTERVAL`, counted up; concurrent alive never
      exceeds `min(ENEMY_CONCURRENT, ENEMY_CAP)`; the well's quota is
      `SPAWN_QUOTA` and exhausts.
- [ ] ⛔ `spawnEnemy()` never places an enemy in the Skimmer's lane above
      `SAFE_SPAWN_DEPTH`, at any call site.
- [ ] ⛔ `ENEMY_CAP` is honoured as a ceiling and is not read as a difficulty
      knob anywhere.
- [ ] ⛔ `startGame()`, `nextWell()` and the debug well-cycler all route through
      `enterWell()`. After a cycle, no entity holds a lane the new well does not
      have.
- [ ] The well clears when the quota is spent **and** no `blocksClear` enemy
      remains — not when the array happens to be empty mid-spawn.
- [ ] `nextWell()` raises `state.level` by one, sets `wellIndex` to
      `(level - 1) mod 16`, clears shots, re-arms the Purge, and resets the
      spawner.

**Collision**

- [ ] A shot overlapping an enemy within `HIT_LANE_TOL` / `HIT_DEPTH_TOL` calls
      `onShot()`; a consumed shot dies the same step and frees its slot.
- [ ] ⛔ One shot kills at most one enemy per step. The pass runs in a fixed,
      deterministic order.
- [ ] An enemy in the Skimmer's lane at or past its `killDepth` kills the
      player; the same enemy one lane over does not.
- [ ] An enemy with `killDepth === null` never kills by contact.

**The Purge**

- [ ] First use in a well destroys every `purgeable` enemy and leaves every
      non-purgeable one alone (§4.3; CS004's Thorns are the reason).
- [ ] ⛔ Second use in the same well destroys **exactly one** — the enemy
      nearest the rim — and the tie-break is deterministic, so the player can
      predict it.
- [ ] Third and later uses in the same well do nothing.
- [ ] The charge re-arms in `enterWell()` and never accumulates across wells.
- [ ] ⛔ It is edge-triggered off a level-valued struct field: holding the button
      fires once.

**Death, lives, respawn**

- [ ] Death costs one life, triggers `Game.hitStop(C.HIT_STOP_DEATH)`, and sets
      `skimmer.dead`.
- [ ] Respawn happens on the first live step after the freeze, in the same lane,
      with `invulnTime` counting up toward `RESPAWN_INVULN`, blinking at
      `INVULN_BLINK_HZ`.
- [ ] ⛔ Enemies at the rim are pushed to `RESPAWN_PUSH_DEPTH` **at respawn**,
      not at the moment of death — so the freeze frame still shows the enemy that
      killed you, and re-entry is survivable (§4.4).
- [ ] An invulnerable Skimmer cannot die and can still fire.
- [ ] ⛔ A Purge held through a death freeze does not fire on the first live
      step. Death sets the latch; it needs a release.
- [ ] Lives at zero sets `state.screen = "gameover"` and stops the gameplay
      systems. A debug restart action calls `startGame()`.

**Close**

- [ ] GDD §17 item 1 re-verified now that the build contains randomness: same
      seed, same recorded input, identical state hash after 10,000 ticks, twice
      in-process and once across processes.
- [ ] GDD §17 item 3: 5,000-tick soak on each of the six open wells with enemies
      spawning, vaulting and dying — no lane outside `[0, lanes-1]`, no NaN, no
      unbounded array.
- [ ] `scratchpad/test-registry.js` raises `enemies` to 1. ⛔ That number lives
      there and nowhere else.
- [ ] GDD §4.3, §4.4, §6.1, §6.3 and §6.5 gain "Shipped, CS003" paragraphs in
      the §4.1/§4.2 style, recording what was actually built.
- [ ] GDD §6.5's "wire into **five** places" is corrected to six — it lists six
      and `CLAUDE.md` says six.
- [ ] `node build.js` and `node scratchpad/run-all.js` green, zero skips.
- [ ] `log/CS003.md` written; `STATUS.md` reset to CS004; both CS003 planning
      docs **moved** into `archive/`.

---

## ⛔ Scope boundaries — what this changeset does NOT touch

**No scoring, at all.** A Vaulter kill awards nothing, the Purge-unspent bonus is
not paid, and no extra life is granted. ⛔ `addScore()` is CS006's single entry
point and the way to protect that invariant is to not build a second one now.
`PTS_VAULTER` and `PURGE_SAVED_BONUS` stay unread.

**No HUD.** Lives, level and Purge charge are state, not pixels. CS006.

**No other enemy.** No Carrier, Weaver, Thorn, Drifter or Surger — the contract
names their hooks (`purgeable`, `blocksClear`, `killDepth`, `onShot`) and CS004
fills them in. ⛔ Do not write a Thorn "because the Purge rule mentions it."

**No Dive.** Well-clear pauses for `WELL_CLEAR_HOLD` and moves on. CS005 inserts
the Dive between the clear and `nextWell()`.

**No heat.** `heat(level)` is not written. Every spawn and speed constant is a
flat level-1 value. CS005 makes them derived. ⛔ Do not add a second clock in the
meantime — no per-well counter, no "difficulty" field.

**No introduction schedule** beyond the single `VAULT_FIRST_LEVEL` gate, which is
§6.3 behaviour rather than §8.1 scheduling.

**No lane occupancy lighting.** `drawWell()`'s `laneState` parameter stays
unwired; it belongs with the dim band and the Surger's charge, in CS005.

**No fragmentation particles.** §4.4's fragmentation is a `kit-fx` primitive and
lands with the death sequence's presentation pass in CS006. CS003's death reads
as hit-stop plus a blink.

**No audio.** This changeset does not create an `AudioContext`.

**No Overdrive.** No Jump, no combo, no tokens, no Reaver.

**No grab.** §6.1's "contact / grab" — the original's drag-you-down animation is
presentation and is not built here. Contact kills.

---

## Known hazards

**The stale-heading bug `laneHop` was written for.** CS001 built `laneHop(well,
lane, delta, dir)` returning both a lane and a direction, and nothing has used it
yet. The Vaulter is its first caller. ⛔ It must write back the returned `dir`.
An enemy that keeps its own heading and asks only for a position grinds against
an open well's wall forever, one hop out and one hop back, and it will look like
a physics quirk rather than a logic error.

**A fixed depth extent makes a distant enemy huge.** `perspective()` is
`depth^0.55`, so screen distance is heavily compressed near the rim and stretched
near the throat. A silhouette drawn with a constant depth offset — the way
`SKIMMER_POLY` is, correctly, because the Skimmer never leaves `depth 1` — spans
about 13% of the well at the throat and 3% at the rim. It would grow as it
approaches you and then shrink. ⛔ An entity's drawn depth extent must scale with
its own perspective position (`ENEMY_DEPTH_SCALE`), which needs an
`invPerspective()` beside `perspective()` in `03-wells.js`. Build the helper once
in `14-render-entities.js`; nine enemies will use it.

**`input.purge` is a level, not an edge.** All four devices write a held boolean.
The consumer latches. Worse: `input.sample()` **still runs during hit-stop** while
`update()` does not (CS002 P1's deliberate call), so a button held across a death
freeze arrives at the first live step looking like a fresh press. ⛔ Death sets
the latch.

**The debug well-cycler now has consequences.** In CS002 it swapped a backdrop.
With enemies alive it can strand them on lanes that no longer exist. Routing it
through `enterWell()` is the fix, and it is cheaper than the alternative of
teaching every enemy to renormalize on a well change.

**Well-clear is two conditions, not one.** "No enemies alive" is true one tick
after `startGame()` and again in every gap between spawns. The quota must be
spent as well.

**The `Enemy` base is a slope.** It is thin on purpose. The first time someone
puts a climb rate or a hop timer in it, five enemies that do not climb inherit
one. ⛔ Fields and defaults only.

---

## Assumptions and decisions

| # | Decision | What would change it |
|---|---|---|
| 1 | `01-rng.js` is built here rather than left for the changeset that "needs it more" | The spawner is the first consumer of randomness in the project; a determinism guarantee that holds only because nothing is random is not a guarantee |
| 2 | A thin `Enemy` base class, not nine independent classes | Nine constructors is where one of them silently forgets `purgeable`. ⛔ If the base ever acquires behaviour, flatten it — the value is the field list, not the inheritance |
| 3 | One `state.enemies` array, with `purgeable` / `blocksClear` deciding behaviour, rather than a separate `state.thorns` | A second array doubles all six wiring points. If CS004 finds Thorns need a different update cadence or z-order, split then and pay it once |
| 4 | `killDepth` as a field rather than a per-enemy contact method | §4.5's five death conditions are three different depth rules and two non-contact ones; a number covers the three and `null` covers the others |
| 5 | `enterWell()` is the one well-entry path, and the debug cycler uses it | If cycling wells mid-run turns out to be more useful with entities preserved, that is a debug-only branch inside `enterWell()`, not a second path |
| 6 | `nextWell()` advances `state.level` and takes ownership of `wellIndex` now, ahead of `02-state.js`'s note reserving it for the Dive changeset | The alternative is a well-clear that clears into the same well. CS005 inserts the Dive *before* `nextWell()` and adds the introduction schedule *inside* it — a seam, not a rewrite |
| 7 | Rim hunting is not level-gated; only mid-climb vaulting is | §6.1 reads "climbs; vaults lanes from L2; hunts at rim" — the gate is attached to vaulting. And §12 promises a passive player dies on level 1, which a Vaulter parked harmlessly at the rim cannot deliver |
| 8 | Level 1 does not yet guarantee §12's death-within-four-seconds | That needs spawn lanes weighted toward the player's lane, which is onboarding tuning. Carried to CS013, noted in `STATUS.md` |
| 9 | The rim push happens at respawn, not at the moment of death | Pushing at death teleports the killing enemy during the freeze the player is staring at. §4.4 says "on respawn" |
| 10 | No scoring in this changeset at all | ⛔ `addScore()` is the one entry point; the way to keep it one is to not add a temporary second. Kills are wired to points in CS006 |
| 11 | `WELL_CLEAR_HOLD` is a ⚠ temporary constant | It exists so the transition is visible before the Dive exists. CS005 deletes it |
| 12 | Five phases, with the cross-cutting soak in its own closing phase | The §17 item 3 wall soak spans P1's vaulting and P2's spawning, so no single build phase owns it. If P5 turns out thin, fold it into P4 next time |
| 13 | `VAULTER_COLOR` ships as a ⚠ placeholder, same standing as `SKIMMER_COLOR` | No enemy palette is specified anywhere in the GDD, and `tools/glow-lab.html` — which `CLAUDE.md` lists — does not exist yet. The art pass is a later, deliberate decision, not an inference to make in a build phase |
| 14 | Stale changeset pointers in three source comments are corrected in place, by the phase that touches the file | They read as shipped truth to a session that finds them. Correcting them is a comment edit, not a refactor |