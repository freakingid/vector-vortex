// test-cs006-p3.js — CS006 P3: the Dive, GDD §4.5 item 5, and the death-loop
// guard (GDD §5, §4.5, §4.4, §2, §6.5, §16.3).
//
// Asserts what P3 owns: the beat, the two phases, the `anchored` filter, the
// four passes that must NOT run during a dive, the Thorn strike, the
// Thorn-free respawn lane and the termination guarantee. It makes no claim
// about rendering, the doppler or the ring-flight — none of those exist.
//
// ⛔ SIX TRAPS IN THE FIXTURES.
//  1. Boot calls startGame(), so the live state at load is a run in progress.
//     Every case starts from G.reset() + startGame(SEED).
//  2. ⛔ A CLEARED WELL IS THE FIXTURE, not an accident: `spawn.remaining = 0`
//     plus no `blocksClear` survivor is what makes the NEXT step enter a dive.
//     startDive() runs at the FOOT of that step, so the dive's own clock starts
//     at zero on the step after it and every count here is off by that one.
//  3. Driven by G.update() and not G.frame(), so killSkimmer()'s hit-stop never
//     runs and the respawn is the very next step (23-main.js's headless path).
//  4. A Thorn's `depth` is a LENGTH, and spawnEnemy()'s safe-spawn rule would
//     lower a deep spawn in the craft's lane — so the length is written after
//     the spawn, exactly as test-cs004-p4.js does it.
//  5. ⛔ dive.depth reaches exactly 0 INSIDE the step that ends the dive, and
//     nextWell() resets the field on that same step — so 0 is never observable
//     from outside and the profile case asserts the last value it CAN see.
//  6. The counting proxy REPLACES state.rng with a real mulberry32 over the
//     same seed, so the counted stream stays bit-aligned with the run's.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");
const { hasKnob } = require("./test-registry.js");

const SEED = 20260830;

installSeed(SEED);
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const state = X.state;
const DT = C.FIXED_DT;
const WELLS = X.WELLS;
const PURGE_KEY = "x";

const SCRIPT = H.extractScript(require("fs").readFileSync(
  require("path").join(__dirname, "..", "dist", "vector-vortex.html"), "utf8"));

const FAN = 14;                       // GDD 3.4's open 11-lane well
const ticksFor = s => Math.ceil(s / DT);

// A cleared well on a chosen shape: the quota spent, nothing alive, a craft on
// the rim that can actually die. ⛔ G.reset() first — the only thing that
// clears a hit-stop a previous case left behind.
function clearedWell(index) {
  G.reset();
  X.startGame(SEED);
  state.wellIndex = index === undefined ? 0 : index;
  X.enterWell();
  state.spawn.remaining = 0;
  state.enemies = [];
  state.shots = [];
  state.invulnTime = C.RESPAWN_INVULN;   // fixture: expired, i.e. vulnerable
  G.input.reset();
  return WELLS[state.wellIndex];
}

// A Thorn of a chosen LENGTH — trap 4.
function thorn(lane, len) {
  const t = X.spawnEnemy("thorn", lane, 0);
  t.depth = len;
  return t;
}

const step = () => G.update(DT);

// ---------------------------------------------------------------------------
// 1. the constants, the deletions, and what stays unread
// ---------------------------------------------------------------------------

hasKnob(X, "DIVE_GRACE", { def: 0.35 }, H);
hasKnob(X, "DIVE_TIME", { def: 2.6 }, H);
H.assert(C.DIVE_GRACE > 0 && C.DIVE_GRACE < C.DIVE_TIME,
         "⛔ the grace beat is a slice off the front of C.DIVE_TIME, not an addition to it");

H.assert(!("WELL_CLEAR_HOLD" in C),
         "⛔ C.WELL_CLEAR_HOLD is gone — the Dive replaced it, it does not sit beside it");
H.assert(!("clearHold" in state), "⛔ and state.clearHold with it");
H.assert(SCRIPT.indexOf("WELL_CLEAR_HOLD") === -1,
         "⛔ WELL_CLEAR_HOLD appears NOWHERE in the built file — not in a comment either");
H.assert(SCRIPT.indexOf("clearHold") === -1,
         "⛔ and neither does clearHold");
// Non-vacuous: the scan can find a name that IS there.
H.assert(SCRIPT.indexOf("DIVE_GRACE") !== -1, "the built-file scan is not vacuous");

// ⛔ CS014's ring-flight, and it is not this changeset's. Both constants have
// existed since CS001 and must still have no reader.
H.assert(SCRIPT.indexOf("C.DIVE_TIME_OD") === -1,
         "⛔ C.DIVE_TIME_OD is still unread — the Overdrive ring-flight is CS014's");
H.assert(SCRIPT.indexOf("C.DIVE_RINGS_MAX") === -1,
         "⛔ and so is C.DIVE_RINGS_MAX");

for (const fn of ["resetDive", "startDive", "updateDive", "diveHazard",
                  "diveLaneBlocked", "diveStrike", "diveRespawnLane", "diveRespawn"]) {
  H.assert(typeof X[fn] === "function", `${fn} is in the build`);
}

// ⛔ GDD §4.5 item 5 IS NOT A killDepth, and the Thorn's stays null forever.
let well = clearedWell(0);
H.eq(thorn(3, 0.5).killDepth, null,
     "⛔ a Thorn's killDepth is still null — item 5 is a dive-phase strike test, not a rim band");

// ---------------------------------------------------------------------------
// 2. a cleared well enters the dive, and nextWell() is reached only from its end
// ---------------------------------------------------------------------------

well = clearedWell(0);
H.eq(X.wellCleared(state), true, "the fixture is a cleared well");
H.eq(state.dive.active, false, "and no dive is running yet");
const lvl0 = state.level;
step();
H.eq(state.dive.active, true, "⛔ the step that clears the well ENTERS THE DIVE");
H.eq(state.level, lvl0, "and does NOT advance the level");
H.eq(state.dive.timer, 0, "the dive's clock starts at zero (trap 2)");
H.eq(state.dive.phase, "grace", "and at the grace beat");
H.eq(state.dive.depth, 1, "at depth 1 — the rim");

// Three beats in a row: the level moves exactly once per dive, and only ever on
// a step where the dive has just ended.
let advances = 0, advancedMidDive = 0, beatsSeen = 0;
for (let b = 0; b < 3; b++) {
  state.spawn.remaining = 0;
  state.enemies = [];
  let n = 0;
  const lvl = state.level;
  while (state.level === lvl && n < ticksFor(C.DIVE_TIME) + 8) {
    const wasActive = state.dive.active;
    step();
    if (state.level !== lvl) {
      advances++;
      if (!wasActive) advancedMidDive++;      // advanced without a dive running
      if (state.dive.active) advancedMidDive++;   // or left one running behind
    }
    n++;
  }
  if (state.level === lvl + 1) beatsSeen++;
}
H.eq(advances, 3, "⛔ three cleared wells advance the level exactly three times");
H.eq(beatsSeen, 3, "and every one of them completed inside one beat");
H.eq(advancedMidDive, 0,
     "⛔ nextWell() is reached ONLY from the end of a dive — never mid-dive, never without one");

// ---------------------------------------------------------------------------
// 3. ⛔ dive start clears the shots and filters to `anchored` — WITH A LIVE BOLT
// ---------------------------------------------------------------------------
//
// ⛔ THIS IS THE TRAP IN THE FEATURE. WeaverBolt ships blocksClear = false, so a
// board holding a Thorn and a bolt in flight IS a cleared well — and the bolt is
// climbing toward the rim the player is about to leave, carrying the same rim
// band killDepth every other rim-contact entity has.

well = clearedWell(0);
state.skimmer.lane = 0;
const keptThorn = thorn(4, 0.60);
const flying = X.spawnEnemy("weaverBolt", 7, 0.50);
H.assert(flying !== null, "a bolt is in flight when the well clears");
H.eq(flying.blocksClear, false, "⛔ and it does not hold the well open — blocksClear is false");
H.eq(flying.anchored, false, "⛔ and its depth is a POSITION, not a length");
H.eq(flying.killDepth, 1 - C.RIM_CONTACT_DEPTH, "and it is lethal at the rim band");
for (let i = 0; i < 3; i++) state.shots.push(new X.Shot(well, i));
H.eq(state.shots.length, 3, "and three shots are in flight");
H.eq(X.wellCleared(state), true,
     "⛔ the well CLEARS with a bolt travelling — that is why the filter has to exist");

step();
H.eq(state.dive.active, true, "the dive started");
H.eq(state.shots.length, 0,
     "⛔ GDD §5 ⚠ SETTLED: the player's in-flight shots are cleared at dive start");
H.eq(state.enemies.length, 1, "⛔ and the board is filtered down to one survivor");
H.assert(state.enemies[0] === keptThorn, "the Thorn survives — its depth is a LENGTH");
H.assert(state.enemies.indexOf(flying) === -1,
         "⛔ and the bolt does NOT — read off `anchored`, never a class name");
H.assert(state.enemies.every(e => e.anchored),
         "⛔ every survivor of a dive is `anchored`, without exception");

// ---------------------------------------------------------------------------
// 4. ⛔ the four passes that must not run during a dive do not run
// ---------------------------------------------------------------------------

well = clearedWell(0);
state.skimmer.lane = 0;
const probeThorn = thorn(5, 0.40);      // out of the craft's lane: no strike
step();
H.eq(state.dive.active, true, "a dive is running");
H.assert(state.enemies[0] === probeThorn, "and the probe Thorn survived the filter");

// the ENTITY PASS — counted on the one entity that survives a dive
let entityUpdates = 0;
probeThorn.update = function () { entityUpdates++; };

// the SPAWNER — armed as hard as it can be: quota full, timer already at the
// interval, so a single call to updateSpawner() would release something.
state.spawn.remaining = C.SPAWN_QUOTA;
state.spawn.timer = C.SPAWN_INTERVAL;

// the COLLISION PASS — a lethal Vaulter pushed straight into the array AFTER
// the filter, sitting at its killDepth in the craft's lane. ⛔ It is not
// `anchored`, so the Dive's own strike test skips it too; the only thing that
// could kill the craft here is collideSkimmer(), and it must not run.
const lethal = new X.Vaulter(state.skimmer.lane, 0);
lethal.depth = lethal.killDepth;
state.enemies.push(lethal);

// updateShots() — a shot whose clock must not advance
const parked = new X.Shot(well, 0);
const parkedT = parked.t;
state.shots.push(parked);

// updatePurge() — the button held down through the whole dive
G.input.keyDown(PURGE_KEY);

const livesBefore = state.lives;
const boardBefore = state.enemies.length;
for (let i = 0; i < 40; i++) step();
G.input.keyUp(PURGE_KEY);

H.eq(entityUpdates, 0, "⛔ no entity pass runs during a dive");
H.eq(state.spawn.remaining, C.SPAWN_QUOTA, "⛔ no spawner runs during a dive");
H.eq(state.enemies.length, boardBefore, "and nothing arrived on the board");
H.eq(state.lives, livesBefore, "⛔ no collision pass runs during a dive");
H.eq(state.skimmer.dead, false, "and the lethal Vaulter in the craft's lane did nothing");
H.eq(parked.t, parkedT, "⛔ no shot pass runs during a dive");
H.eq(state.purgeUses, 0, "⛔ no Purge resolves during a dive");
H.assert(state.dive.active, "and the dive was still running for all of that (non-vacuous)");

// ---------------------------------------------------------------------------
// 5. the beat: depth holds through DIVE_GRACE, then falls monotonically
// ---------------------------------------------------------------------------

well = clearedWell(0);
step();                                  // the dive starts
let held = 0, graceSteps = 0, outOfRange = 0, wentUp = 0;
let last = state.dive.depth, lastSeen = state.dive.depth;
let sawDescent = false;
for (let i = 0; i < ticksFor(C.DIVE_TIME) + 8 && state.dive.active; i++) {
  step();
  if (!state.dive.active) break;         // the end resets the field (trap 5)
  const d = state.dive.depth;
  if (d < 0 || d > 1) outOfRange++;
  if (d > last + 1e-12) wentUp++;
  if (state.dive.phase === "grace") {
    graceSteps++;
    if (d !== 1) held = -1e9;            // grace with a depth other than 1
  } else {
    sawDescent = true;
  }
  if (d === 1) held++;
  last = d;
  lastSeen = d;
}
H.eq(outOfRange, 0, "⛔ dive.depth never leaves [0,1]");
H.eq(wentUp, 0, "⛔ and never rises — the descent is monotonic");
H.assert(sawDescent, "the walk actually reached the descent beat (non-vacuous)");
H.assert(held > 0, "⛔ dive.depth HOLDS at 1 through the grace beat");
H.close(graceSteps * DT, C.DIVE_GRACE, DT + 1e-9,
        "⛔ and the grace beat is exactly C.DIVE_GRACE long");
// Trap 5: the exact 0 is consumed inside the step that calls nextWell(), so the
// last visible value is one descent step above it.
const descentStep = DT / (C.DIVE_TIME - C.DIVE_GRACE);
H.assert(lastSeen >= 0 && lastSeen <= descentStep + 1e-9,
         `⛔ and it falls to the throat — last visible depth ${lastSeen} is inside one step of 0`);

// ---------------------------------------------------------------------------
// 6. ⛔ GDD §4.5 item 5 — no strike during grace, a strike on the descent
// ---------------------------------------------------------------------------
//
// ⛔ THE GRACE BEAT IS A PILLAR P2 REQUIREMENT AND THIS IS THE CASE THAT SAYS SO.
// C.THORN_MAX is 1.00, so a full-length Thorn's tip sits AT the rim: without the
// beat, a dive that begins in that lane is a death on step one with no input
// opportunity.

well = clearedWell(0);
state.skimmer.lane = 6;
const killer = thorn(6, C.THORN_MAX);
step();                                  // the dive starts
H.assert(state.enemies.indexOf(killer) !== -1, "the full-length Thorn is in the craft's lane");

const livesAtDive = state.lives;
let graceDeaths = 0, strikeStep = -1;
for (let i = 0; i < ticksFor(C.DIVE_TIME) + 8; i++) {
  const wasGrace = state.dive.phase === "grace";
  step();
  if (state.skimmer.dead) { strikeStep = i; break; }
  if (wasGrace && state.lives !== livesAtDive) graceDeaths++;
}
H.eq(graceDeaths, 0,
     "⛔ NO STRIKE DURING GRACE, with a C.THORN_MAX Thorn in the lane (GDD §1.1 P2)");
H.assert(strikeStep >= 0, "⛔ and the strike DOES land once the descent starts");
H.assert(strikeStep * DT >= C.DIVE_GRACE - DT - 1e-9,
         "and it lands no earlier than the end of the grace beat");
H.eq(state.lives, livesAtDive - 1, "⛔ a dive strike costs exactly one life");
H.eq(state.dive.active, true, "and the dive is still running");

// ---------------------------------------------------------------------------
// 7. the strike REPEATS THE DIVE, and the respawn lands in a Thorn-free lane
// ---------------------------------------------------------------------------

const lvlAtStrike = state.level;
step();                                  // the first live step: the respawn
H.eq(state.level, lvlAtStrike,
     "⛔ a dive strike repeats the DIVE, not the well — state.level does not advance (GDD §5)");
H.eq(state.dive.active, true, "the dive repeats");
H.eq(state.dive.phase, "grace", "⛔ and from the GRACE beat, not from where it died");
H.eq(state.dive.depth, 1, "back at the rim");
H.assert(state.dive.timer <= DT + 1e-12, "with the clock restarted");
H.eq(state.skimmer.dead, false, "a fresh craft is on the rim");
H.eq(state.invulnTime, 0, "and the invulnerability window is armed (GDD §4.4)");
H.assert(X.diveLaneBlocked(state, well, state.skimmer.lane) === false,
         "⛔ AND THE RESPAWN LANE HOLDS NO THORN — the death-loop guard");
H.assert(state.enemies.indexOf(killer) !== -1,
         "⛔ the Thorn that killed it is STILL THERE — a free lane existed, so nothing was destroyed");

// ⛔ AND THE WHOLE RUN TERMINATES. The naive respawn burns a life every
// C.RESPAWN_INVULN forever; this one must reach the next well.
let n = 0;
while (state.level === lvlAtStrike && n < ticksFor(C.DIVE_TIME) * 4) { step(); n++; }
H.eq(state.level, lvlAtStrike + 1, "⛔ and the repeated dive completes — no death loop");
H.eq(state.lives, livesAtDive - 1, "having cost exactly the one life");

// ---------------------------------------------------------------------------
// 8. the respawn lane is the NEAREST free one, deterministically
// ---------------------------------------------------------------------------

// Closed, 16 lanes: lanes 4, 5 and 6 blocked, died at 5. Distance 2 either way,
// ⛔ ties toward INCREASING lane.
well = clearedWell(0);
H.eq(well.closed, true, "the Ring is the closed fixture");
thorn(4, 0.3); thorn(5, 0.3); thorn(6, 0.3);
H.eq(X.diveRespawnLane(state, well, 5), 7,
     "⛔ nearest free lane by |laneDelta|, ties toward increasing lane");
H.eq(X.diveRespawnLane(state, well, 4), 3, "and from lane 4 the nearer side wins outright");
H.eq(X.diveRespawnLane(state, well, 9), 9, "an unblocked lane is its own answer — distance 0");

// The seam is a neighbourhood, not a fifteen-lane gap: block everything but 0.
well = clearedWell(0);
for (let L = 1; L < well.lanes; L++) thorn(L, 0.3);
H.eq(X.diveRespawnLane(state, well, 8), 0,
     "⛔ the walk wraps on a closed well — laneDelta, never a bare subtraction");

// Open, 11 lanes: ⛔ the walk skips lanes the well does not have rather than
// clamping them, which would visit an end lane twice and silently prefer it.
well = clearedWell(FAN);
H.eq(well.closed, false, "the Fan is the open fixture");
H.eq(well.lanes, 11, "with eleven lanes");
for (let L = 0; L < 10; L++) thorn(L, 0.3);
H.eq(X.diveRespawnLane(state, well, 0), 10,
     "⛔ on an open well the walk runs to the far end rather than wrapping");

// ⛔ 100 RUNS OF ONE SEED LAND IN THE SAME LANE. No RNG is spent choosing it, so
// this is a statement about determinism and not about luck.
const lanes = new Set();
for (let r = 0; r < 100; r++) {
  const w = clearedWell(0);
  state.skimmer.lane = 6;
  thorn(6, C.THORN_MAX);
  thorn(7, 0.5);
  let k = 0;
  while (!state.skimmer.dead && k < ticksFor(C.DIVE_TIME) + 8) { step(); k++; }
  H.assert(state.skimmer.dead, `run ${r}: the strike landed`);
  step();                                // the respawn
  lanes.add(state.skimmer.lane);
}
H.eq(lanes.size, 1, "⛔ 100 runs of one seed put the dive respawn in the SAME lane");
H.eq([...lanes][0], 5,
     "⛔ and it is lane 5 — lane 7 is blocked too, so the nearest free one is the other side");

// ---------------------------------------------------------------------------
// 9. ⛔ THE TERMINATION GUARANTEE — a fully thorned Fan
// ---------------------------------------------------------------------------
//
// ⛔ Every lane blocked, so diveRespawnLane() has no answer and the STRUCK
// THORN dies instead. That is the only path in the build by which a Thorn is
// destroyed by something other than a shot, and without it a full-length Thorn
// burns a life every C.RESPAWN_INVULN until the run ends.

well = clearedWell(FAN);
state.skimmer.lane = 5;
const wall = [];
for (let L = 0; L < well.lanes; L++) wall.push(thorn(L, C.THORN_MAX));
H.eq(state.enemies.length, well.lanes, "every lane of the Fan holds a full-length Thorn");
H.eq(X.wellCleared(state), true, "⛔ and the well is CLEAR — a Thorn does not block it");
H.eq(X.diveRespawnLane(state, well, 5), null, "⛔ there is no Thorn-free lane to land in");

const lvlWall = state.level;
const livesWall = state.lives;
let wallSteps = 0;
while (state.level === lvlWall && wallSteps < ticksFor(C.DIVE_TIME) * 8) { step(); wallSteps++; }
H.eq(state.level, lvlWall + 1,
     "⛔ a fully thorned well still TERMINATES — the dive reaches the next well");
H.eq(state.lives, livesWall - 1,
     "⛔ at the cost of exactly ONE life: the struck Thorn dies and frees its own lane");
H.assert(state.lives > 0, "and the run is not over");
const destroyed = wall.filter(t => t.dead).length;
H.eq(destroyed, 1,
     "⛔ exactly one Thorn was destroyed by something other than a shot, and only because " +
     "there was no free lane");

// ---------------------------------------------------------------------------
// 10. ⛔ A DIVE SPENDS ZERO RNG DRAWS
// ---------------------------------------------------------------------------
//
// The run has ONE stream (01-rng.js), and a draw spent inside a dive would make
// every later spawn in the run a function of how long the player was between
// wells. Trap 6: the proxy wraps a real mulberry32 over the same seed.

let draws = 0;
function countStream() {
  const base = X.mulberry32(state.seed);
  state.rng = function () { draws++; return base(); };
  draws = 0;
}

// A whole quiet dive, transition included. ⛔ At level 1 nextWell() takes its
// `else` branch and spends nothing either (CS006 P1), so the count covers the
// beat AND the well change.
well = clearedWell(0);
thorn(2, 0.4);
countStream();
step();                                  // the clearing step, then the dive
const lvlRng = state.level;
let rngSteps = 0;
while (state.level === lvlRng && rngSteps < ticksFor(C.DIVE_TIME) + 8) { step(); rngSteps++; }
H.eq(state.level, lvlRng + 1, "the counted dive actually completed (non-vacuous)");
H.eq(draws, 0, "⛔ a whole dive, transition included, spends ZERO draws from the run's stream");

// And the strike-and-respawn path spends none either — the Thorn-free lane is
// chosen by a deterministic walk, never a draw.
well = clearedWell(FAN);
state.skimmer.lane = 5;
for (let L = 0; L < well.lanes; L++) thorn(L, C.THORN_MAX);
countStream();
const lvlRng2 = state.level;
let n2 = 0;
while (state.level === lvlRng2 && n2 < ticksFor(C.DIVE_TIME) * 8) { step(); n2++; }
H.eq(state.level, lvlRng2 + 1, "the counted fully-thorned dive completed (non-vacuous)");
H.assert(state.lives < C.START_LIVES, "and it went through a strike and a respawn");
H.eq(draws, 0, "⛔ a dive strike, a Thorn kill and a respawn spend ZERO draws");

// ⛔ NON-VACUOUS: the proxy counts. Ordinary play draws, so a count of zero
// above has to mean something.
state.spawn.remaining = C.SPAWN_QUOTA;
state.spawn.timer = C.SPAWN_INTERVAL;
for (let i = 0; i < 4; i++) step();
H.assert(draws > 0, "the counting proxy is live — ordinary play does spend draws");

// ---------------------------------------------------------------------------
// 11. respawnSkimmer()'s DEFAULT is unchanged (GDD §4.4)
// ---------------------------------------------------------------------------
//
// The Dive is the one caller that passes a lane. Called without one, the craft
// still comes back where it died, which is CS003 P4's rule and must not have
// moved to make room for this phase's.

well = clearedWell(0);
state.skimmer.lane = 4;
state.skimmer.dead = true;
X.respawnSkimmer(state, well);
H.eq(state.skimmer.lane, 4,
     "⛔ respawnSkimmer() with no lane still respawns in the lane it died in");
X.respawnSkimmer(state, well, 9);
H.eq(state.skimmer.lane, 9, "and an explicit lane is honoured — the Dive's one use of it");

H.report("test-cs006-p3.js");
