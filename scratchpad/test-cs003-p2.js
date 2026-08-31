// test-cs003-p2.js — CS003 P2: the spawner and the well lifecycle
// (GDD 2, 3.4, 4.3, 6.3, 6.5, 12, 16.3, 17 item 2).
//
// Asserts what P2 owns: spawn cadence and the concurrency limit, the quota,
// GDD 6.3's safe-spawn rule inside the ONE spawn entry point, the two-part
// well-clear condition, and the three lifecycle functions. Makes no claim
// about collision, the Purge's effect, death or scoring — none exist yet.
//
// ⛔ THREE TRAPS IN THE FIXTURES.
//  1. Boot calls startGame(), so the live state at load is a run with a
//     time-derived seed. Every case here starts from an explicit startGame(SEED).
//  2. A cleared well ADVANCES on its own after a beat — C.WELL_CLEAR_HOLD when
//     this file was written, GDD 5's Dive since CS006 P3. A case that wants the
//     quota to run dry without the level moving has to keep one blocksClear
//     enemy alive.
//  3. Enemies are killed the way the game kills them — `dead = true`, removed
//     by the loop's own end-of-frame filter — never spliced out here.
"use strict";

const fs = require("fs");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");
const { COUNTS, hasKnob } = require("./test-registry.js");

const SEED = 20260830;

installSeed(SEED);
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const DT = C.FIXED_DT;
const state = X.state;

// Ticks needed to reach a threshold a count-up timer advances by DT each step.
const ticksFor = seconds => Math.ceil(seconds / DT);
const alive = () => state.enemies.length;

// One step of the real loop, optionally killing everything that spawned so the
// concurrency limit never blocks. ⛔ Kill by the contract's flag; the loop's
// own filter does the removal.
function step(killAll) {
  G.update(DT);
  if (killAll) for (const e of state.enemies) e.dead = true;
}

// ---- the constants this phase adds -----------------------------------------
hasKnob(X, "SPAWN_INTERVAL", { def: 1.60 }, H);
hasKnob(X, "SPAWN_QUOTA", { def: 10 }, H);
hasKnob(X, "ENEMY_CONCURRENT", { def: 3 }, H);
hasKnob(X, "SPAWN_LANE_TRIES", { def: 4 }, H);
// ⛔ CS006 P3 REPLACED THE HOLD WITH THE DIVE (GDD 5), AND THIS FILE STILL OWNS
// "a cleared well advances on its own after a beat". The beat's MECHANISM
// changed; the ownership did not — so the four cases below are rewritten in
// place to the replacement behaviour rather than deleted, and the Dive's own
// coverage lives in test-cs006-p3.js and not here (CLAUDE.md, Test rules).
H.assert(!("WELL_CLEAR_HOLD" in C),
  "⛔ C.WELL_CLEAR_HOLD is GONE — the Dive replaced it, it does not sit beside it");
H.assert(!("clearHold" in state),
  "⛔ and state.clearHold with it");
hasKnob(X, "DIVE_TIME", { def: 2.6 }, H);
// ⛔ SPAWN_MIN is a floor on a HEAT-derived interval, and heat is CS007's.
H.assert(!("SPAWN_MIN" in C), "C carries no SPAWN_MIN — the heat floor is CS007's");

H.assert(typeof X.spawnEnemy === "function", "spawnEnemy is in the build");
H.assert(typeof X.startGame === "function", "startGame is in the build");
H.assert(typeof X.nextWell === "function", "nextWell is in the build");
H.assert(typeof X.enterWell === "function", "enterWell is in the build");
H.assert(typeof X.wellCleared === "function", "wellCleared is in the build");

// ---------------------------------------------------------------------------
// startGame — the run's seed, and the well it opens in
// ---------------------------------------------------------------------------

X.startGame(SEED);
H.eq(state.seed, SEED, "startGame records the seed it was given");
H.eq(state.level, 1, "a run starts at level 1");
H.eq(state.wellIndex, 0, "level 1 opens on shape 0");
H.eq(state.spawn.remaining, C.SPAWN_QUOTA, "the well owes a full quota");
H.eq(state.spawn.timer, 0, "the spawn timer starts at zero");
H.eq(alive(), 0, "no enemy is alive on entry");
H.eq(state.purgeUses, 0, "the Purge charge is armed on entry");
H.assert(state.skimmer instanceof X.Skimmer, "startGame mints the Skimmer");

X.startGame();
H.assert(typeof state.seed === "number" && isFinite(state.seed),
  "a run with no seed argument still RECORDS a finite seed (GDD 17.1 replay)");

// ---------------------------------------------------------------------------
// cadence — spawns are one C.SPAWN_INTERVAL apart
// ---------------------------------------------------------------------------

X.startGame(SEED);
const spacing = [];
let lastSpawnTick = 0;
let prevRemaining = state.spawn.remaining;
for (let t = 1; t <= ticksFor(C.SPAWN_INTERVAL) * (C.SPAWN_QUOTA + 1); t++) {
  step(true);
  if (state.spawn.remaining < prevRemaining) {
    spacing.push(t - lastSpawnTick);
    lastSpawnTick = t;
    prevRemaining = state.spawn.remaining;
  }
}
H.eq(spacing.length, C.SPAWN_QUOTA, "the quota releases exactly SPAWN_QUOTA enemies");
// ⛔ Compared as an INTERVAL, not as an exact tick count. The timer is a float
// accumulating DT, so 96 steps of 1/60 sum to 1.5999999999999992 and the
// threshold is crossed on the 97th — deterministic, and one tick is the
// resolution the simulation actually has. An exact-count assertion here would
// be a test that fails the first time SPAWN_INTERVAL is retuned to a value
// that is not a clean multiple of the step.
const first = spacing[0];
H.assert(spacing.every(s => s === first),
  `spawn spacing is constant (got ${spacing.join(",")})`);
H.assert(Math.abs(first * DT - C.SPAWN_INTERVAL) <= DT,
  `spawn spacing is C.SPAWN_INTERVAL, to within one step (${first} ticks = ${(first * DT).toFixed(4)}s)`);

// ---------------------------------------------------------------------------
// the concurrency limit, over a long run with nothing dying
// ---------------------------------------------------------------------------

X.startGame(SEED);
const limit = Math.min(C.ENEMY_CONCURRENT, C.ENEMY_CAP);
let peak = 0;
for (let t = 0; t < 5000; t++) {
  step(false);
  if (alive() > peak) peak = alive();
}
H.eq(peak, limit, "alive count reaches, and never exceeds, min(ENEMY_CONCURRENT, ENEMY_CAP)");
H.eq(state.spawn.remaining, C.SPAWN_QUOTA - limit,
  "a full board spends no more quota — the timer holds instead of banking spawns");

// ⛔ The limit frees the instant a slot does: the held timer is already at the
// threshold, so the next step spawns rather than waiting a fresh interval.
if (H.assert(alive() === limit, "the long run ends with a full board")) {
  state.enemies[0].dead = true;
  step(false);   // the filter removes it; the spawner sees the free slot
  H.eq(alive(), limit, "a freed slot is refilled on the very next step");
}

// ---------------------------------------------------------------------------
// the quota exhausts, and nothing spawns afterwards
// ---------------------------------------------------------------------------

X.startGame(SEED);
let guard = 0;
while (state.spawn.remaining > 0 && guard++ < 20000) step(true);
H.eq(state.spawn.remaining, 0, "the quota runs dry");
// Trap 2: a blocker keeps the well from clearing (and advancing) while we look.
// It goes in through the ONE entry point, which is also what a Carrier split
// will use — no test-local push into state.enemies.
const blocker = X.spawnEnemy("vaulter", 0, 0);
H.assert(blocker !== null, "spawnEnemy returns the enemy it created");
const levelHere = state.level;
for (let t = 0; t < ticksFor(C.SPAWN_INTERVAL) * 3; t++) step(false);
H.eq(state.spawn.remaining, 0, "a spent quota stays spent");
H.eq(alive(), 1, "no further enemy is released once the quota is spent");
H.eq(state.level, levelHere, "and the well does not advance while a blocker lives");

// ---------------------------------------------------------------------------
// ⛔ GDD 6.3 — spawnEnemy never puts an enemy in the Skimmer's lane above
// C.SAFE_SPAWN_DEPTH, including when called directly
// ---------------------------------------------------------------------------

let safeOk = true, awayOk = true, laneOk = true;
for (let wi = 0; wi < X.WELLS.length; wi++) {
  X.startGame(SEED);
  state.wellIndex = wi;
  X.enterWell();
  const well = X.WELLS[wi];
  const mid = Math.floor(well.lanes / 2);

  // Dead centre of a lane, and parked between two centres — a continuous lane
  // means the craft is half in each, and both are its lane.
  for (const skimLane of [mid, mid + 0.5]) {
    state.skimmer.lane = X.laneNormalize(well, skimLane);
    for (const lane of [mid, mid + 1]) {
      state.enemies = [];
      const e = X.spawnEnemy("vaulter", lane, 1.0);
      if (!e) { safeOk = false; continue; }
      const sameLane = Math.abs(X.laneDelta(well, e.lane, state.skimmer.lane)) < 1;
      if (sameLane && e.depth > C.SAFE_SPAWN_DEPTH) safeOk = false;
      if (e.lane < 0 || e.lane > well.lanes - 1) laneOk = false;
    }
  }

  // A lane the player is nowhere near keeps the depth it asked for — the rule
  // is a lane rule, not a global depth ceiling.
  state.skimmer.lane = 0;
  state.enemies = [];
  const far = X.spawnEnemy("vaulter", Math.floor(well.lanes / 2), 0.95);
  if (!far || far.depth !== 0.95) awayOk = false;
}
H.assert(safeOk, "⛔ spawnEnemy never spawns above SAFE_SPAWN_DEPTH in the Skimmer's lane, on any well");
H.assert(awayOk, "a spawn away from the Skimmer keeps its requested depth");
H.assert(laneOk, "every spawned lane is inside [0, lanes-1]");

// The cap is enforced in the one place, and it is not the concurrency knob.
X.startGame(SEED);
state.skimmer.lane = 0;
for (let i = 0; i < C.ENEMY_CAP + 5; i++) X.spawnEnemy("vaulter", 0, 0);
H.eq(alive(), C.ENEMY_CAP, "⛔ ENEMY_CAP is a hard ceiling inside spawnEnemy");
H.eq(X.spawnEnemy("vaulter", 0, 0), null, "a refused spawn returns null");
H.eq(X.spawnEnemy("nosuchkind", 0, 0), null, "an unknown kind spawns nothing");

// ---------------------------------------------------------------------------
// ⛔ well-clear is TWO conditions, not one
// ---------------------------------------------------------------------------

X.startGame(SEED);
H.assert(X.wellCleared(state) === false,
  "⛔ an empty enemy array one tick into a run is NOT a cleared well");
step(false);
H.assert(X.wellCleared(state) === false, "still not clear while the quota has spawns left");

// Quota spent, one enemy standing: not clear.
state.spawn.remaining = 0;
const survivor = X.spawnEnemy("vaulter", 0, 0.3);
H.assert(X.wellCleared(state) === false, "a spent quota alone does not clear the well");
// A non-blocking hazard (CS004's Thorn is the first) does not hold the well.
survivor.blocksClear = false;
H.assert(X.wellCleared(state) === true, "an enemy with blocksClear false does not hold the well");
survivor.blocksClear = true;
survivor.dead = true;
H.assert(X.wellCleared(state) === true, "quota spent and nothing blocking: clear");

// ---------------------------------------------------------------------------
// the beat, then nextWell — GDD 5's Dive since CS006 P3
// ---------------------------------------------------------------------------

X.startGame(SEED);
state.spawn.remaining = 0;
state.enemies = [];
const before = state.level;
// ⛔ MEASURED, NOT COUNTED, and floating point is why. The dive's clock is a
// float accumulating C.FIXED_DT, so 156 additions land a hair UNDER 2.6 and the
// beat is 157 dive steps rather than the 156 ticksFor() names; a hard tick count
// here would pin that artefact instead of the rule. What this file owns is that
// a cleared well advances on its own after a beat of the stated length, and
// both halves are asserted off the clock.
//
// ⛔ ONE STEP OF THE COUNT BELONGS TO THE CLEAR ITSELF: startDive() runs at the
// FOOT of the step that clears the well, so that step is still a gameplay step
// and the dive's own clock starts at zero on the one after it.
const beatTicks = ticksFor(C.DIVE_TIME) + 4;      // a generous cap, not the answer
let beatSteps = 0;
while (state.level === before && beatSteps < beatTicks) { step(false); beatSteps++; }
H.eq(state.level, before + 1, "the cleared well advances on its own, exactly once");
H.close((beatSteps - 1) * DT, C.DIVE_TIME, DT + 1e-9,
        "and the beat it held for is C.DIVE_TIME (GDD 5's Dive)");

// ⛔ THE REPLACEMENT FOR "a survivor mid-hold resets the hold to zero". There is
// no reset any more, because there is nothing to reset: the Dive COMMITS on the
// step the well clears (startDive() clears the shots and filters the board), so
// a survivor can only hold the beat OFF, never half-spend it. What the old case
// actually protected — that no partly-spent beat is ever carried into the next
// one — is asserted here at the other end.
X.startGame(SEED);
state.spawn.remaining = 0;
state.enemies = [];
const holder = X.spawnEnemy("vaulter", 0, 0.2);
for (let t = 0; t < beatTicks; t++) step(false);
H.eq(state.level, before, "a blocksClear survivor holds the well open past a whole beat");
H.eq(state.dive.timer, 0, "and no beat is half-spent while it waits");
holder.dead = true;
step(false);
H.eq(state.dive.timer, 0, "the beat that starts when it leaves starts from zero");

// ---------------------------------------------------------------------------
// nextWell — the level clock, GDD 3.4's shapeIndex, and the re-arm
// ---------------------------------------------------------------------------

X.startGame(SEED);
state.shots.push(new X.Shot(X.WELLS[state.wellIndex], 0));
X.spawnEnemy("vaulter", 0, 0.2);
state.purgeUses = 2;
state.spawn.remaining = 2;
const lvl = state.level;
X.nextWell();
H.eq(state.level, lvl + 1, "nextWell raises the level by one");
H.eq(state.wellIndex, (state.level - 1) % X.WELLS.length, "wellIndex is GDD 3.4's (level-1) mod shapes");
H.eq(state.shots.length, 0, "nextWell clears shots in flight");
H.eq(alive(), 0, "nextWell clears the enemies");
H.eq(state.purgeUses, 0, "nextWell re-arms the Purge charge");
H.eq(state.spawn.remaining, C.SPAWN_QUOTA, "nextWell re-arms the spawner");
H.eq(state.dive.timer, 0, "nextWell clears the beat");
H.eq(state.dive.active, false, "and leaves no dive running");

// The shape wraps at the end of the roster, and the level clock does not.
X.startGame(SEED);
state.level = COUNTS.wells;
X.nextWell();
H.eq(state.level, COUNTS.wells + 1, "the level clock keeps counting past the last shape");
H.eq(state.wellIndex, 0, "and the shape wraps back to the first");

// Every level maps to a shape that exists.
let shapeOk = true;
X.startGame(SEED);
for (let i = 0; i < X.WELLS.length * 2 + 3; i++) {
  X.nextWell();
  if (!(state.wellIndex >= 0 && state.wellIndex < X.WELLS.length)) shapeOk = false;
  if (state.wellIndex !== (state.level - 1) % X.WELLS.length) shapeOk = false;
}
H.assert(shapeOk, "shapeIndex holds for two full trips round the roster");

// ---------------------------------------------------------------------------
// ⛔ cycling wells strands nothing — the debug cycler goes through enterWell
// ---------------------------------------------------------------------------
// Driven through the REAL input path (the "w" action, 04-input.js), because
// the bug this guards is a second route into a well existing at all.

X.startGame(SEED);
let strandOk = true, skimOk = true;
for (let i = 0; i < X.WELLS.length + 2; i++) {
  // Fill the current well right up to the highest lane it has.
  const cur = X.WELLS[state.wellIndex];
  for (let k = 0; k < 4; k++) X.spawnEnemy("vaulter", cur.lanes - 1 - k, 0.2 + k * 0.1);

  G.input.keyDown("w");
  step(false);
  G.input.keyUp("w");

  const well = X.WELLS[state.wellIndex];
  for (const e of state.enemies) {
    if (!(e.lane >= 0 && e.lane <= well.lanes - 1)) strandOk = false;
  }
  if (!(state.skimmer.lane >= 0 && state.skimmer.lane <= well.lanes - 1)) skimOk = false;
}
H.assert(strandOk, "⛔ no entity survives a well change on a lane the new well does not have");
H.assert(skimOk, "the Skimmer is inside the new well's lane range after a cycle");

// ---------------------------------------------------------------------------
// determinism — same seed, same spawn lanes (GDD 17.1)
// ---------------------------------------------------------------------------

function spawnLanes(seed, ticks) {
  X.startGame(seed);
  const lanes = [];
  let rem = state.spawn.remaining;
  for (let t = 0; t < ticks; t++) {
    step(true);
    if (state.spawn.remaining < rem) {
      rem = state.spawn.remaining;
      lanes.push(state.enemies[state.enemies.length - 1].lane);
    }
    if (state.spawn.remaining === 0) rem = state.spawn.remaining;
  }
  return lanes;
}
const runA = spawnLanes(SEED, 4000);
const runB = spawnLanes(SEED, 4000);
H.assert(runA.length > 0, "the determinism run actually spawned something");
H.eq(runA.join(","), runB.join(","), "two runs from the same seed produce the identical spawn lane sequence");
const runC = spawnLanes(SEED + 1, 4000);
H.assert(runC.join(",") !== runA.join(","), "a different seed produces a different sequence");

// ---------------------------------------------------------------------------
// ⛔ the built file never calls the platform generator
// ---------------------------------------------------------------------------

const dist = fs.readFileSync(path.join(__dirname, "..", "dist", "vector-vortex.html"), "utf8");
H.assert(dist.indexOf("Math" + ".random") < 0, "⛔ the built file contains no platform RNG call");

H.report();
