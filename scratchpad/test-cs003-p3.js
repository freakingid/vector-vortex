// test-cs003-p3.js — CS003 P3: the collision pass and the Purge
// (GDD 4.2, 4.3, 4.5, 6.5).
//
// Asserts what P3 owns: the 1-D hit test both ways, the one-enemy-per-shot
// rule, the three Purge uses and their tie-break, and the rising-edge latch.
// Makes no claim about lives, respawn, hit-stop or scoring — those are P4/CS007.
//
// ⛔ FOUR TRAPS IN THE FIXTURES.
//  1. Boot calls startGame(), so the live state at load is a run already going.
//     Every case here starts from an explicit startGame(SEED).
//  2. The spawner keeps releasing Vaulters, and a cleared well ADVANCES after
//     C.WELL_CLEAR_HOLD. Cases that need a known board drain the quota
//     (spawn.remaining = 0) and empty state.enemies by hand BEFORE building it.
//  3. Collision is driven through Game.update(), the real loop — never by
//     calling the pass with a hand-made state. The end-of-frame filters are
//     part of what is under test.
//  4. state.input is overwritten by input.sample() at the top of every
//     update(). A held purge button is therefore staged by holding a real key
//     through Game.input, not by writing state.input.purge.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");
const { hasKnob } = require("./test-registry.js");

const SEED = 20260830;

installSeed(SEED);
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const DT = C.FIXED_DT;
const state = X.state;

// A quiet, known board: the well is entered, then the quota is drained and the
// array emptied so nothing spawns and nothing advances the level under us.
// ⛔ The quota is drained rather than the spawner stubbed — wellCleared() also
// needs a survivor to stay false, which every case here supplies.
function quietWell(seed) {
  X.startGame(seed === undefined ? SEED : seed);
  state.spawn.remaining = 0;
  state.enemies = [];
  state.shots = [];
  return X.WELLS[state.wellIndex];
}

// A Vaulter placed exactly where the case wants it. ⛔ Through spawnEnemy, the
// one entry point — but its safe-spawn clamp would move a deep spawn in the
// Skimmer's lane, so the depth is written afterwards, which is what the test
// actually wants to control.
function put(lane, depth) {
  const e = X.spawnEnemy("vaulter", lane, 0);
  e.depth = depth;
  return e;
}

// A shot at a known lane and depth. Shot depth is derived from its own clock,
// so the clock is what gets set (06-shots.js).
function shotAt(well, lane, depth) {
  const s = new X.Shot(well, lane);
  s.t = (1 - depth) * C.SHOT_TIME;
  state.shots.push(s);
  return s;
}

// One step of the real loop with the player doing nothing.
function step() { G.update(DT); }

// ---- the constants this phase adds -----------------------------------------
hasKnob(X, "HIT_LANE_TOL", { def: 0.50 }, H);
hasKnob(X, "HIT_DEPTH_TOL", { def: 0.05 }, H);
H.assert(typeof X.updateCollisions === "function", "updateCollisions is in the build");
H.assert(typeof X.killSkimmer === "function", "killSkimmer is in the build");
H.assert(typeof X.updatePurge === "function", "updatePurge is in the build");

// ⛔ No scoring this changeset — addScore() is CS007's single entry point.
H.assert(typeof X.addScore === "undefined" || X.addScore === null,
         "no addScore exists yet — scoring is CS007's");
H.assert(!("score" in state), "state carries no score field this changeset");

// ---------------------------------------------------------------------------
// Shots vs enemies — the lane match and the depth overlap
// ---------------------------------------------------------------------------

let well = quietWell();
let target = put(3, 0.5);
shotAt(well, 3, 0.5);
step();
H.assert(target.dead === true || state.enemies.indexOf(target) === -1,
         "a shot overlapping a Vaulter kills it");
H.eq(state.enemies.length, 0, "and the loop's filter removes it the same step");
H.eq(state.shots.length, 0, "the shot was consumed and freed its slot the same step");

// One lane over: no hit, and neither entity is disturbed.
well = quietWell();
target = put(3, 0.5);
shotAt(well, 4, 0.5);
step();
H.eq(state.enemies.length, 1, "a shot one lane over does not kill");
H.eq(state.shots.length, 1, "and is not consumed");

// The tolerance is exactly half a lane either side, and the boundary is
// inclusive. ⛔ Half a lane is what makes a lane a discrete choice (GDD 1.1 P1).
well = quietWell();
put(3, 0.5);
shotAt(well, 3 + C.HIT_LANE_TOL, 0.5);
step();
H.eq(state.enemies.length, 0, "a shot exactly HIT_LANE_TOL away still hits");

well = quietWell();
put(3, 0.5);
shotAt(well, 3 + C.HIT_LANE_TOL * 2, 0.5);
step();
H.eq(state.enemies.length, 1, "a shot two tolerances away misses");

// Depth: outside HIT_DEPTH_TOL is a miss even in the same lane. ⛔ The shot
// travels ~0.032 depth per step, so it is placed well clear of the band.
well = quietWell();
put(3, 0.2);
shotAt(well, 3, 0.9);
step();
H.eq(state.enemies.length, 1, "same lane, far depth: no hit");

// ⛔ Across a closed well's seam. laneDelta, not (a - b): lane 0 and the last
// lane are neighbours on a Ring, and a bare subtraction reports the long way.
const ring = X.WELLS.findIndex(w => w.closed && w.lanes >= 8);
H.assert(ring >= 0, "the roster has a closed well to test the seam on");
X.startGame(SEED);
state.wellIndex = ring;
X.enterWell();
state.spawn.remaining = 0;
state.enemies = [];
well = X.WELLS[ring];
put(0, 0.5);
shotAt(well, well.lanes - 1 + C.HIT_LANE_TOL, 0.5);
step();
H.eq(state.enemies.length, 0, "a shot hits across the seam of a closed well");

// ---------------------------------------------------------------------------
// ⛔ ONE SHOT RESOLVES AGAINST AT MOST ONE ENEMY PER STEP
// ---------------------------------------------------------------------------

well = quietWell();
const stacked = [put(3, 0.5), put(3, 0.5), put(3, 0.5)];
shotAt(well, 3, 0.5);
step();
H.eq(state.enemies.length, stacked.length - 1,
     "one shot never kills two enemies in a step");
H.eq(state.shots.length, 0, "and it was consumed by the one it did hit");

// ⛔ AND THE BREAK IS UNCONDITIONAL. An enemy that declines the shot (returns
// false from onShot — 07-enemies.js's base default, and GDD 6.2's armour) stops
// the shot's search for THIS step too; it flies on and meets what is behind it
// on a later step, at a depth it has actually travelled to. A break taken only
// on consumption lets one trigger pull walk a whole stacked lane.
well = quietWell();
const armoured = put(3, 0.5);
armoured.onShot = () => false;
const behind = put(3, 0.5);
shotAt(well, 3, 0.5);
step();
H.assert(armoured.dead === false, "an enemy that declines the shot survives it");
H.assert(behind.dead === false,
         "⛔ and the shot does not carry on to the next enemy in the same step");
H.eq(state.shots.length, 1, "the declined shot is not consumed");

// Deterministic: the same board and the same shot pick the same victim, run
// after run. Array order is the tie-break, so it is the first one placed.
for (let run = 0; run < 3; run++) {
  well = quietWell();
  const a = put(3, 0.5);
  const b = put(3, 0.5);
  shotAt(well, 3, 0.5);
  step();
  H.assert(a.dead === true && b.dead === false,
           `run ${run}: the shot always resolves against the same enemy`);
}

// ---------------------------------------------------------------------------
// Enemies vs the Skimmer (GDD 4.5)
// ---------------------------------------------------------------------------

well = quietWell();
state.skimmer.lane = 3;
let killer = put(3, 0);
killer.depth = killer.killDepth;
step();
H.assert(state.skimmer.dead === true,
         "an enemy in the Skimmer's lane AT its killDepth kills");

// Just short of killDepth is not contact.
well = quietWell();
state.skimmer.lane = 3;
killer = put(3, 0);
killer.depth = killer.killDepth - 0.01;
step();
H.assert(state.skimmer.dead === false, "just short of killDepth does not kill");

// The same enemy one lane over does not.
well = quietWell();
state.skimmer.lane = 3;
killer = put(4, 0);
killer.depth = killer.killDepth;
step();
H.assert(state.skimmer.dead === false,
         "the same enemy one lane over does not kill");

// ⛔ killDepth === null means contact NEVER kills, at any depth — the Weaver's
// case (GDD 4.5: its projectile is the threat, not its body).
well = quietWell();
state.skimmer.lane = 3;
const harmless = put(3, 0);
harmless.killDepth = null;
harmless.depth = 1;
step();
H.assert(harmless.killDepth === null, "the fixture still has a null killDepth");
H.assert(state.skimmer.dead === false,
         "an enemy with killDepth === null never kills, even at the rim");

// P3 owns only the flag. Lives, respawn and the game-over stop landed in P4 and
// are asserted in test-cs003-p4.js — the two build-ahead guards that stood here
// were satisfied by the phase they were guarding for, so they moved rather than
// being weakened. Nothing in this file reads state.lives or state.invulnTime.

// ---------------------------------------------------------------------------
// The Purge (GDD 4.3)
// ---------------------------------------------------------------------------
//
// ⛔ The button is a LEVEL. state.input is rewritten by input.sample() every
// update, so a press is staged through the real input module's key path — the
// same route a player's keyboard takes (GDD 9.5).
// 04-input.js's keyDown/keyUp sink is that route — attach() is only a DOM
// adapter over it, so this is the same code a real keypress runs.
const PURGE_KEY = "x";
function purgeDown() { G.input.keyDown(PURGE_KEY); }
function purgeUp() { G.input.keyUp(PURGE_KEY); }

// If the input module has no injectable key path, say so loudly rather than
// quietly testing something weaker.
const canDriveKeys = typeof G.input.keyDown === "function" &&
                     typeof G.input.keyUp === "function";

// ⛔ ONE PRESS, RELEASED, AND THE RELEASE STEPPED. The latch is "held last
// step", so a release that is never sampled leaves the latch set and the next
// press is not an edge at all — which would make a case asserting "nothing
// happened" pass for the wrong reason.
function purgePress() { purgeDown(); step(); purgeUp(); step(); }
H.assert(canDriveKeys, "the input module exposes the keyDown/keyUp sink");
H.assert(X.INPUT_KEYS_DEFAULT.purge.indexOf(PURGE_KEY) !== -1,
         "the key this case presses is actually bound to purge");

// A non-purgeable entity, constructed the way CS004's Thorn will be: the flag
// on the contract, never a class name (07-enemies.js).
function putThornLike(lane, depth) {
  const e = put(lane, depth);
  e.purgeable = false;
  return e;
}

// -- first use: everything purgeable dies, non-purgeable survives -------------
well = quietWell();
const survivor = putThornLike(1, 0.4);
put(2, 0.3);
put(4, 0.6);
put(6, 0.2);
if (canDriveKeys) {
  purgePress();
  H.eq(state.purgeUses, 1, "the first press spends the first use");
  H.eq(state.enemies.length, 1, "the first Purge clears every purgeable enemy");
  H.assert(state.enemies[0] === survivor,
           "⛔ and leaves the non-purgeable one alive (GDD 4.3, does not remove Thorns)");
} else {
  H.skip("the input module exposes no injectable key path");
}

// -- second use: exactly one, the rim-nearest, stable across runs -------------
// ⛔ Repeated runs, because the tie-break is the feature: GDD 4.3 promises the
// player can predict which one dies.
let secondVictimLanes = [];
for (let run = 0; run < 3 && canDriveKeys; run++) {
  well = quietWell();
  put(2, 0.30);
  put(7, 0.80);          // the rim-nearest — highest depth
  put(4, 0.55);
  put(5, 0.10);
  purgePress();                             // first use clears the board
  // Rebuild the same board for the weak second use.
  put(2, 0.30);
  const rimmost = put(7, 0.80);
  put(4, 0.55);
  put(5, 0.10);
  purgePress();
  H.eq(state.purgeUses, 2, `run ${run}: the second press spends the second use`);
  H.eq(state.enemies.length, 3, `run ${run}: the second Purge removes exactly one`);
  H.assert(state.enemies.indexOf(rimmost) === -1,
           `run ${run}: and it is the purgeable one nearest the rim`);
  secondVictimLanes.push(rimmost.lane);
}
if (canDriveKeys) {
  H.assert(secondVictimLanes.every(l => l === secondVictimLanes[0]),
           "the second use's victim is identical across repeated runs");
}

// The tie-break itself: equal depth resolves to the LOWEST lane.
if (canDriveKeys) {
  well = quietWell();
  put(6, 0.70);
  const lowLane = put(2, 0.70);
  put(9, 0.70);
  state.purgeUses = 1;      // stage the weak use directly; use 1 is covered above
  purgePress();
  H.assert(lowLane.dead === true || state.enemies.indexOf(lowLane) === -1,
           "⛔ equal depth breaks to the lowest lane");
  H.eq(state.enemies.length, 2, "and still removes exactly one");
}

// A second use with only non-purgeable enemies left touches nothing.
if (canDriveKeys) {
  well = quietWell();
  const thorn = putThornLike(3, 0.9);
  state.purgeUses = 1;
  purgePress();
  H.eq(state.purgeUses, 2, "the second press is spent even with no legal target");
  H.eq(state.enemies.length, 1, "and a non-purgeable enemy is untouched by it");
  H.assert(state.enemies[0] === thorn, "the survivor is the non-purgeable one");
}

// -- third and later: nothing ------------------------------------------------
if (canDriveKeys) {
  well = quietWell();
  put(2, 0.30);
  put(4, 0.55);
  put(6, 0.80);
  state.purgeUses = 2;
  purgePress();
  H.eq(state.purgeUses, 3, "the third press still counts up");
  H.eq(state.enemies.length, 3, "⛔ the third Purge does nothing");
  purgePress();
  H.eq(state.purgeUses, 4, "the fourth press is a real edge, not a stuck latch");
  H.eq(state.enemies.length, 3, "and neither does the fourth");
}

// -- the charge re-arms on enterWell and does not accumulate ------------------
well = quietWell();
state.purgeUses = 2;
X.enterWell();
H.eq(state.purgeUses, 0, "enterWell re-arms the Purge charge");

// ⛔ NEVER ACCUMULATED. An unspent charge carried through several wells is
// still one charge: the count goes back to zero, it does not go negative or
// bank a second strong use.
X.startGame(SEED);
for (let i = 0; i < 4; i++) X.nextWell();
H.eq(state.purgeUses, 0, "⛔ four unspent wells still leave exactly one charge");
if (canDriveKeys) {
  state.spawn.remaining = 0;
  state.enemies = [];
  well = X.WELLS[state.wellIndex];
  put(2, 0.3);
  put(5, 0.6);
  purgePress();
  H.eq(state.purgeUses, 1, "the first use in the new well is still use ONE");
  H.eq(state.enemies.length, 0, "and it is the strong one");
  // The very next press is the weak use, not a second strong one.
  put(2, 0.3);
  put(5, 0.6);
  purgePress();
  H.eq(state.enemies.length, 1, "⛔ the next press is the WEAK use, not a second clear");
}

// -- ⛔ the button is a LEVEL: holding it spends exactly one charge -----------
if (canDriveKeys) {
  well = quietWell();
  for (let i = 0; i < 8; i++) put(i % well.lanes, 0.2 + i * 0.05);
  const before = state.enemies.length;
  H.assert(before > 1, "the hold fixture has more than one enemy to lose");

  purgeDown();
  for (let t = 0; t < 60; t++) {
    // Refill so a second strong use would be visible as a second clearing.
    if (state.enemies.length === 0 && t < 58) put(2, 0.3);
    step();
  }
  purgeUp();
  H.eq(state.purgeUses, 1, "⛔ holding the purge button for 60 ticks spends exactly ONE charge");

  // And a release-then-press is a new edge.
  step();
  purgePress();
  H.eq(state.purgeUses, 2, "releasing and pressing again spends the next use");
}

// The latch tracks the button, so a session that never touches it is unlatched.
X.startGame(SEED);
H.assert(state.purgeLatched === false, "purgeLatched is false on a fresh run");

H.report();
