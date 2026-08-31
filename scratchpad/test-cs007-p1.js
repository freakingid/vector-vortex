// scratchpad/test-cs007-p1.js — CS007 P1: the spawner-stall split.
//
// ⛔ ONE CLAIM: the release budget counts THREATS (`blocksClear && !dead`), the
// readability ceiling keeps counting ENTITIES. Paul's call, 2026-08-31
// (DECISIONS.md, "the spawner-stall call"; PLANNED-FEATURES-CS007.md §4.1).
//
// ⛔ FOUR TRAPS IN THE FIXTURES.
//  1. The repro needs BOTH halves. "The quota spends" alone would pass on a
//     build that simply deleted the limit, so §3 below stages a board of live
//     threats and asserts the spawner blocks exactly as it always did.
//  2. A PASSIVE player never clears the well — a Vaulter that reaches the rim
//     kills the Skimmer and keeps standing. §2's second half therefore answers
//     the threats through GDD §6.5's own kill (`dead = true`) and asserts the
//     well CLEARS WITH THE THREE THORNS STILL ON IT: that is the release budget
//     and `wellCleared()` agreeing, and `wellCleared()` was not touched.
//  3. §4 and §5 drive `updateSpawner()` directly with the timer pre-armed
//     rather than through `Game.update()`, so nothing on the board moves
//     between the staging and the beat under test.
//  4. C.ENEMY_CONCURRENT is NOT raised anywhere here. The whole point is the
//     behaviour at the shipped 3, which is the budget the run has at level 5
//     where the Weaver arrives (PLANNED-FEATURES-CS007.md §4.2).

"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260831;
installSeed(SEED);                     // ⛔ before the first build

const X = H.buildGame();
const C = X.C;
const G = X.Game;
const state = X.state;
const DT = C.FIXED_DT;

// Three Thorns, spread around the well, at full length. Through spawnEnemy() —
// the one way in (GDD §6.5) — so nothing here re-implements a spawn.
function standingThorns(well, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(X.spawnEnemy("thorn", Math.floor((i * well.lanes) / n), C.THORN_MAX));
  }
  return out;
}

function freshWell() {
  G.reset();
  X.startGame(SEED);
  return X.WELLS[state.wellIndex];
}

// ---------------------------------------------------------------------------
// 1. the split is read off the FLAG, never off a class name (GDD §6.5)
// ---------------------------------------------------------------------------

{
  const well = freshWell();
  state.enemies.length = 0;
  const a = X.spawnEnemy("vaulter", 0, 0.4);
  const b = X.spawnEnemy("vaulter", 2, 0.4);
  const thorn = X.spawnEnemy("thorn", 4, C.THORN_MAX);

  H.eq(X.threatCount(state), 2,
       "⛔ threatCount() counts the two Vaulters and not the Thorn");
  H.eq(state.enemies.length, 3,
       "and all three are in the ONE array — the split is a count, not a second array");

  // ⛔ THE FLAG, NOT THE CLASS. A Vaulter with blocksClear turned off must stop
  // counting, or the count is really an instanceof in disguise.
  b.blocksClear = false;
  H.eq(X.threatCount(state), 1,
       "⛔ a Vaulter with blocksClear false stops counting — the flag is what is read");
  b.blocksClear = true;

  a.dead = true;
  H.eq(X.threatCount(state), 1, "and a dead threat stops counting before the filter runs");
  H.assert(thorn.blocksClear === false && thorn.anchored === true,
           "the Thorn's own contract fields are unchanged by this phase");
}

// ---------------------------------------------------------------------------
// 2. ⛔ THE REPRO FROM STATUS.md, TERMINATING
// ---------------------------------------------------------------------------
//
// ⛔ MEASURED BEFORE THIS PHASE, at 1d64329: three standing Thorns, quota full,
// no input, 6,000 ticks (100 simulated seconds) —
//
//     level 1 -> 1      quota 10 -> 10      board 3 -> 3
//     threats now 0     spawner blocked: true
//
// Three Thorns nobody shoots held all three release slots forever: the quota
// never spent, the well never cleared, and nothing threatened the player
// either. Both halves below are what that measurement becomes after the split.

{
  const well = freshWell();
  const thorns = standingThorns(well, 3);
  state.spawn.remaining = C.SPAWN_QUOTA;

  const before = { level: state.level, quota: state.spawn.remaining, board: state.enemies.length };
  for (let i = 0; i < 6000; i++) G.update(DT);

  H.assert(state.spawn.remaining < before.quota,
           `⛔ THE QUOTA SPENDS. Before the split it sat at ${before.quota} for the whole ` +
           `6,000 ticks; now ${before.quota} -> ${state.spawn.remaining}`);
  H.assert(state.enemies.length > before.board,
           `⛔ and the board grows past the three Thorns (${before.board} -> ` +
           `${state.enemies.length}) — the release budget is no longer held by them`);
  H.eq(thorns.filter(t => !t.dead).length, 3,
       "⛔ and all three Thorns are STILL STANDING — no Thorn expires (GDD §5's lesson " +
       "depends on it persisting), and this phase added no expiry");
}

// The other half: a player who answers the threats finishes the well. ⛔ The
// well must clear WITH THE THORNS ON IT — `wellCleared()` is untouched and
// already reads `blocksClear`, so the two counts agree without being the same
// count. Threats are killed through the contract's own kill (`dead = true`,
// GDD §6.5) once they climb past the middle of the well.
{
  const well = freshWell();
  const thorns = standingThorns(well, 3);
  state.spawn.remaining = C.SPAWN_QUOTA;

  let clearedAt = -1, thornsAtClear = -1, released = 0;
  for (let i = 0; i < 6000 && clearedAt < 0; i++) {
    for (const e of state.enemies) {
      if (!e.dead && e.blocksClear && e.depth >= 0.5) e.dead = true;
    }
    const quotaBefore = state.spawn.remaining;
    G.update(DT);
    if (state.spawn.remaining < quotaBefore) released++;
    if (state.spawn.remaining === 0 && X.wellCleared(state)) {
      clearedAt = i;
      thornsAtClear = thorns.filter(t => !t.dead).length;
    }
  }

  H.assert(clearedAt > 0,
           `⛔ THE WELL CLEARS — before the split this loop ran out its 6,000 ticks with ` +
           `the quota untouched (cleared at tick ${clearedAt})`);
  H.eq(released, C.SPAWN_QUOTA,
       "⛔ and every one of the quota's releases actually happened — the well was finished " +
       "by spending the quota, not by the quota never having been there");
  H.eq(thornsAtClear, 3,
       "⛔ and it cleared with all three Thorns STANDING IN IT — wellCleared() is " +
       "untouched and already read blocksClear; the split did not change what CLEAR means");
}

// ---------------------------------------------------------------------------
// 3. ⛔ A BOARD OF LIVE THREATS STILL BLOCKS — trap 1
// ---------------------------------------------------------------------------
//
// Without this the case above would pass on a build that had simply removed the
// concurrency limit rather than changing what it counts.

{
  const well = freshWell();
  state.enemies.length = 0;
  for (let i = 0; i < C.ENEMY_CONCURRENT; i++) X.spawnEnemy("vaulter", i * 2, 0.3);

  state.spawn.remaining = C.SPAWN_QUOTA;
  state.spawn.timer = C.SPAWN_INTERVAL;      // the beat is due, trap 3

  H.eq(X.threatCount(state), C.ENEMY_CONCURRENT, "three Vaulters are three threats");
  const board = state.enemies.length;
  X.updateSpawner(state, well, DT);
  H.eq(state.enemies.length, board,
       "⛔ THE SPAWNER STILL BLOCKS on a full board of live threats — the limit was " +
       "not removed, it was pointed at a different count");
  H.eq(state.spawn.remaining, C.SPAWN_QUOTA, "and no quota is spent on a blocked beat");
  H.eq(state.spawn.timer, C.SPAWN_INTERVAL,
       "and the timer HOLDS at the interval, so the spawn fires the instant a slot frees");

  // One of them dies: the slot frees, on the very next beat, with nothing else
  // about the board changed.
  state.enemies[0].dead = true;
  X.updateSpawner(state, well, DT);
  H.eq(state.spawn.remaining, C.SPAWN_QUOTA - 1,
       "and one threat dying frees exactly one slot");
}

// ---------------------------------------------------------------------------
// 4. ⛔ THE BOLT FREES A SLOT TOO — the claim is about the FLAG, not the Thorn
// ---------------------------------------------------------------------------
//
// `WeaverBolt` is the roster's other `blocksClear: false` entity (GDD §6.5). If
// only the Thorn freed a slot, this phase would have special-cased a class.

{
  const well = freshWell();
  state.enemies.length = 0;
  X.spawnEnemy("vaulter", 0, 0.3);
  X.spawnEnemy("vaulter", 2, 0.3);
  for (let i = 0; i < 4; i++) X.spawnEnemy("weaverBolt", 4 + i, 0.3);

  H.assert(state.enemies.length > C.ENEMY_CONCURRENT,
           "the board is over the release budget in ENTITIES");
  H.eq(X.threatCount(state), 2, "but only two of them are THREATS");

  state.spawn.remaining = C.SPAWN_QUOTA;
  state.spawn.timer = C.SPAWN_INTERVAL;
  X.updateSpawner(state, well, DT);
  H.eq(state.spawn.remaining, C.SPAWN_QUOTA - 1,
       "⛔ and the spawner releases — a bolt frees a slot exactly as a Thorn does, " +
       "because the count reads blocksClear and not a class name");
}

// ---------------------------------------------------------------------------
// 5. ⛔ AND THE READABILITY CEILING STILL HOLDS
// ---------------------------------------------------------------------------
//
// The split must not have walked past C.ENEMY_CAP on its way to fixing the
// release budget. ⛔ ENEMY_CAP counts ENTITIES — Thorns included — and it is
// enforced in exactly one place, inside spawnEnemy(), which this phase did not
// touch. A board of nothing but Thorns is the case that tells the two counts
// apart: zero threats, and still refused.

{
  const well = freshWell();
  state.enemies.length = 0;
  for (let i = 0; i < C.ENEMY_CAP; i++) {
    H.assert(X.spawnEnemy("thorn", i % well.lanes, C.THORN_MAX) !== null,
             `Thorn ${i + 1} of C.ENEMY_CAP is accepted`);
  }
  H.eq(state.enemies.length, C.ENEMY_CAP, "the board is staged at the ceiling exactly");
  H.eq(X.threatCount(state), 0, "⛔ and not one of them is a threat");

  H.eq(X.spawnEnemy("thorn", 0, C.THORN_MAX), null,
       "⛔ THE CEILING STILL REFUSES, at zero threats — C.ENEMY_CAP counts ENTITIES");
  H.eq(X.spawnEnemy("vaulter", 0, 0.2), null,
       "⛔ and it refuses a live threat too, so the ceiling is not a threat count either");
  H.eq(state.enemies.length, C.ENEMY_CAP, "and nothing was pushed past it");

  // And the interval spawner spends no quota on a refusal — unchanged, and the
  // reason the case above matters: the budget now says yes where the cap says no.
  state.spawn.remaining = C.SPAWN_QUOTA;
  state.spawn.timer = C.SPAWN_INTERVAL;
  X.updateSpawner(state, well, DT);
  H.eq(state.spawn.remaining, C.SPAWN_QUOTA,
       "⛔ the release budget lets the beat through and the CEILING refuses it — " +
       "and a refused spawn spends no quota");
  H.eq(state.enemies.length, C.ENEMY_CAP, "the board is still exactly at the ceiling");
}

// ---------------------------------------------------------------------------
// 6. the two numbers are still read as a MIN, and neither was retuned
// ---------------------------------------------------------------------------

H.eq(C.ENEMY_CONCURRENT, 3,
     "⛔ C.ENEMY_CONCURRENT is still a flat 3 — no heat this phase (that is P2's)");
H.eq(C.ENEMY_CAP, 16, "⛔ and C.ENEMY_CAP is not raised — it is a readability ceiling");
H.eq(X.spawnLimit(), Math.min(C.ENEMY_CONCURRENT, C.ENEMY_CAP),
     "the release budget is still the MIN of the two");

H.report("test-cs007-p1.js");
