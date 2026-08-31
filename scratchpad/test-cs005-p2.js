// test-cs005-p2.js — CS005 P2: the Drifter (GDD 6.1, 6.3, 4.5 item 2, 3.5,
// 6.5, 10.2, 12). Asserts what P2 owns; it makes no claim about the Surger,
// the cargo rows, scoring or the Dive, none of which exist.
//
// ⛔ SIX TRAPS IN THE FIXTURES.
//  1. killDepth is 1 - C.RIM_CONTACT_DEPTH and NOT 0. collideSkimmer has no
//     term for where the Skimmer is, so 0 would be lethal from the throat on
//     the spawn step. The mutation check drives the real spawn-and-step path.
//  2. The constructor must not snap and must not need a `well` — three closed
//     changesets' test files depend on it, so the birth is asserted with
//     Object.is against the arguments.
//  3. A riding Drifter sits ON a boundary, which is within C.HIT_LANE_TOL of
//     TWO lane centres. Cases that place the craft "out of the lane" have to
//     move it more than one lane, not one.
//  4. The wall cases PIN depth below C.DRIFT_HOME_DEPTH, so the stored heading
//     is the only input to a cross direction. Homing has its own cases.
//  5. Boot calls startGame(), so the live state at load is a run in progress.
//     Every case starts from useWell().
//  6. The draw cases hook ctx.closePath/stroke on the harness's Proxy context
//     and restore them; the three channels are read back off the real calls.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260830;

installSeed(SEED);                          // ⛔ above the first buildGame()
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const state = X.state;
const DT = C.FIXED_DT;
const EPS = 1e-12;

const WELLS = X.WELLS;
const OPEN = WELLS.filter(w => !w.closed);
const { laneDelta, laneBoundaryLo, laneBoundaryHi } = X;

// A quiet, known board on a chosen well: quota spent, nothing alive, a craft on
// the rim that can actually die. ⛔ G.reset() first — it is the only thing that
// clears a hit-stop a previous case left behind.
function useWell(index) {
  G.reset();
  X.startGame(SEED);
  state.wellIndex = index === undefined ? 0 : index;
  X.enterWell();
  state.spawn.remaining = 0;
  state.shots = [];
  state.shotCooldown = C.SHOT_COOLDOWN;
  state.purgeUses = 0;
  state.purgeLatched = true;
  state.input.purge = false;
  state.invulnTime = C.RESPAWN_INVULN;      // fixture: expired, i.e. vulnerable
  G.input.reset();
  return WELLS[state.wellIndex];
}

// A bare Drifter, off the board, driven by the exact line Game.update()'s
// entity pass runs. Used for the geometry sweeps, where a board and a collision
// pass would only add ways for the case to end early.
function loose(lane, depth, dir) {
  return X.ENEMY_KINDS.drifter(lane, depth, dir);
}

// Is `lane` a boundary — a half-integer? The landing write is exact
// (laneNormalize of an integer or half-integer plus 0.5 or 1), so this is an
// equality and never an epsilon.
function onLattice(lane) {
  return Math.abs(lane % 1) === 0.5;
}

// Drive one entity and hand every step to `visit`. `pinDepth`, when given, is
// written before each step — see trap 4.
function drive(d, well, steps, visit, pinDepth) {
  for (let i = 0; i < steps; i++) {
    if (pinDepth !== undefined) d.depth = pinDepth;
    const before = { lane: d.lane, depth: d.depth, phase: d.phase };
    d.update(DT, well, state);
    if (visit) visit(before, d, i);
  }
}

// ---------------------------------------------------------------------------
// the constants, and ⛔ THE THREE-CHANNEL SEPARATION GATE (GDD 6.3, 12)
// ---------------------------------------------------------------------------

H.eq(C.DRIFTER_SIZE, 0.66, "C.DRIFTER_SIZE — the CROSSING silhouette's lane span");
H.eq(C.DRIFT_CLIMB, 0.13, "C.DRIFT_CLIMB — depth/s, in BOTH phases");
H.eq(C.DRIFT_RIDE_TIME, 0.85, "C.DRIFT_RIDE_TIME — ⛔ the armour budget");
H.eq(C.DRIFT_CROSS_TIME, 0.45, "C.DRIFT_CROSS_TIME — s to cross one lane");
H.eq(C.DRIFT_HOME_DEPTH, 0.60, "C.DRIFT_HOME_DEPTH");
H.eq(C.DRIFT_RIDE_WIDTH, 0.70, "C.DRIFT_RIDE_WIDTH");
H.eq(C.DRIFT_CROSS_WIDTH, 1.60, "C.DRIFT_CROSS_WIDTH");
H.eq(C.DRIFT_RIDE_ALPHA, 0.55, "C.DRIFT_RIDE_ALPHA");
H.assert(typeof C.DRIFTER_COLOR === "string",
         "⚠ C.DRIFTER_COLOR already existed and is not re-declared — provisional");

// ⛔ THE GATE. GDD 6.3's "visible at a glance" is an art rule, and art rules rot
// silently — a retune that narrows the crossing bloom or brightens the ride
// collapses the two reads into one and nothing else in the suite would notice.
// This is what CS005 does INSTEAD of building tools/glow-lab.html.
H.assert(C.DRIFT_CROSS_WIDTH / C.DRIFT_RIDE_WIDTH >= 2.0,
         `⛔ the crossing stroke is at least 2x the riding one ` +
         `(got ${C.DRIFT_CROSS_WIDTH / C.DRIFT_RIDE_WIDTH})`);
H.assert(C.DRIFT_RIDE_ALPHA <= 0.7,
         `⛔ and the riding alpha is at most 0.7 against the crossing 1 (got ${C.DRIFT_RIDE_ALPHA})`);

// ⛔ Scope boundary: GDD 7's 250/500/750-by-depth is CS007's, and addScore() is
// its one entry point. The constant exists and must still have exactly one
// mention in the build — its own declaration.
const SCRIPT = H.extractScript(require("fs").readFileSync(
  require("path").join(__dirname, "..", "dist", "vector-vortex.html"), "utf8"));
H.eq(SCRIPT.split("PTS_DRIFTER").length - 1, 1,
     "⛔ C.PTS_DRIFTER is still unread — no scoring lands before addScore() (CS007)");

// ---------------------------------------------------------------------------
// the ENEMY_KINDS row, and ⛔ THE FIRST ROW THAT USES ITS `dir`
// ---------------------------------------------------------------------------

H.assert("drifter" in X.ENEMY_KINDS, "⛔ the Drifter is an ENEMY_KINDS row like everything else");
H.eq(X.ENEMY_KINDS.drifter.length, 3, "the factory is (lane, depth, dir)");
H.eq(loose(3, 0.25, -1).dir, -1, "⛔ and it USES the dir — every earlier row ignores it");
H.eq(loose(3, 0.25, 1).dir, 1, "the other heading too");
H.eq(loose(3, 0.25, undefined).dir, 1, "and anything non-negative, undefined included, is +1");

// ---------------------------------------------------------------------------
// ⛔ THE BIRTH — constructed at the lane centre it was handed, with no `well`
// ---------------------------------------------------------------------------
//
// Trap 2. test-cs004-p1.js probes every kind as ENEMY_KINDS[kind](0, 0, 1) with
// no well in scope, and test-cs004-p2.js / test-cs004-p5.js both assert a
// Carrier's children land on splitLanes()' exact INTEGER lanes at the parent's
// exact depth. A constructor that snapped to the lattice turns all three red the
// moment CARGO.drifter lands in P4, so this is Object.is and not an epsilon.
const born = loose(7, 0.3, -1);
H.assert(born instanceof X.Drifter, "the row builds a Drifter");
H.eq(born.lane, 7, "⛔ lane is EXACTLY the argument — the constructor does not snap");
H.eq(born.depth, 0.3, "⛔ and so is depth");
H.eq(born.phase, "birth", "it starts in the birth phase — constructed, no well seen yet");
H.eq(born.riding(), false, "⛔ and it is therefore VULNERABLE from the throat, not armoured");

let well = useWell(0);
state.skimmer.lane = 0;
const spawned = X.spawnEnemy("drifter", 7, 0.3);
H.eq(spawned.lane, 7, "the same through spawnEnemy(), the one entry point");
H.eq(spawned.depth, 0.3, "depth too");

// The FIRST update starts the half-cross; it does not finish it, and it does not
// move the lane on that step (the Vaulter's startHop cadence).
spawned.update(DT, well, state);
H.eq(spawned.phase, "cross", "the first update() converts the birth into a crossing");
H.eq(spawned.lane, 7, "which does not move the lane on the step it is armed");
H.close(Math.abs(spawned.crossDelta), 0.5, EPS, "⛔ a HALF cross — half a lane onto the lattice");
H.close(spawned.crossDur(), C.DRIFT_CROSS_TIME * 0.5, EPS,
        "⛔ over half the cross time, so the LANE SPEED is one number for the entity's life");

// ---------------------------------------------------------------------------
// ⛔ THE BIRTH LANDS ON THE LATTICE — every well, every lane, both headings
// ---------------------------------------------------------------------------
//
// By exhaustion rather than by sample: the wall cases are exactly two births per
// open well (lane 0 heading down, lane lanes-1 heading up) and a sampled sweep
// is not guaranteed to contain them.
const BIRTH_STEPS = Math.ceil((C.DRIFT_CROSS_TIME * 0.5) / DT) + 4;
let births = 0, offLattice = null, outOfBounds = null, wrongStep = null;
for (const w of WELLS) {
  const lo = laneBoundaryLo(w), hi = laneBoundaryHi(w);
  for (let lane = 0; lane < w.lanes; lane++) {
    for (const dir of [-1, 1]) {
      const d = loose(lane, 0, dir);
      drive(d, w, BIRTH_STEPS);
      births++;
      if (!onLattice(d.lane)) offLattice = `${w.name} lane ${lane} dir ${dir} -> ${d.lane}`;
      if (d.lane < lo - EPS || d.lane > hi + EPS) outOfBounds = `${w.name} ${lane} -> ${d.lane}`;
      if (Math.abs(Math.abs(laneDelta(w, lane, d.lane)) - 0.5) > EPS) {
        wrongStep = `${w.name} lane ${lane} dir ${dir} -> ${d.lane}`;
      }
    }
  }
}
H.assert(births === WELLS.reduce((n, w) => n + w.lanes * 2, 0), `every born case ran (${births})`);
H.assert(offLattice === null, `⛔ every birth settles ON a boundary (${offLattice})`);
H.assert(outOfBounds === null,
         `⛔ and inside [laneBoundaryLo, laneBoundaryHi] — an open well's outermost ` +
         `boundaries are not ridable (${outOfBounds})`);
H.assert(wrongStep === null,
         `⛔ exactly half a lane, so a wall birth REVERSES rather than overshooting (${wrongStep})`);

// ---------------------------------------------------------------------------
// the cycle — birth, ride, cross, ride … with every timer counting UP
// ---------------------------------------------------------------------------

well = useWell(0);                          // Ring, closed, 16 lanes
const cyc = loose(4, 0, 1);
const phases = [];
const rideRuns = [];
const crossRuns = [];
let run = null;
drive(cyc, well, 900, (before, d) => {
  if (phases.length === 0 || phases[phases.length - 1] !== d.phase) {
    phases.push(d.phase);
    run = { phase: d.phase, steps: 0 };
    (d.phase === "ride" ? rideRuns : crossRuns).push(run);
  }
  run.steps++;
});
H.eq(phases[0], "cross", "the cycle opens on the birth cross");
H.eq(phases[1], "ride", "then it settles and is armoured");
H.eq(phases[2], "cross", "then it crosses again");
H.assert(phases.slice(1).every((p, i) => p === (i % 2 === 0 ? "ride" : "cross")),
         "⛔ and it alternates forever — ride, cross, ride (no third steady state)");
H.assert(phases.length >= 8, `the run covers several full cycles (${phases.length} phases)`);

// ⛔ The phase IS the armour, and it is derived rather than a second field.
H.assert(rideRuns.length >= 3 && crossRuns.length >= 4, "several rides and several crossings");
H.close(rideRuns[1].steps * DT, C.DRIFT_RIDE_TIME, 2 * DT,
        "a ride lasts C.DRIFT_RIDE_TIME");
H.close(crossRuns[1].steps * DT, C.DRIFT_CROSS_TIME, 2 * DT,
        "a full cross lasts C.DRIFT_CROSS_TIME");
H.close(crossRuns[0].steps * DT, C.DRIFT_CROSS_TIME * 0.5, 2 * DT,
        "⛔ and the BIRTH cross lasts half of it — half the distance over half the time");

// ---------------------------------------------------------------------------
// ⛔ DEPTH CLIMBS IN BOTH PHASES, and stops at 1
// ---------------------------------------------------------------------------
//
// This is not a flourish. An unshootable entity that never advances is a
// permanent concurrency squatter — updateSpawner() counts every entity in the
// one array against C.ENEMY_CONCURRENT — which is the shape of the Thorn stall
// STATUS.md carries. The Drifter cannot have it, and the reason is this case.
const climbs = { ride: 0, cross: 0, flat: 0, bad: 0 };
const climber = loose(4, 0, 1);
drive(climber, well, 900, (before, d) => {
  const dz = d.depth - before.depth;
  if (before.depth >= 1) { if (dz === 0) climbs.flat++; return; }
  if (d.depth === 1) return;                // the step the climb clamps at the rim
  // ⚠ Not Object.is: `depth += rate * dt` accumulates, so the difference of two
  // doubles near 1 carries the last-bit error of the sum, not of the increment.
  if (Math.abs(dz - C.DRIFT_CLIMB * DT) > 1e-14) { climbs.bad++; return; }
  climbs[before.phase === "ride" ? "ride" : "cross"]++;
});
H.assert(climbs.ride > 0, "⛔ depth rises on riding steps");
H.assert(climbs.cross > 0, "⛔ and on crossing steps — a Drifter can never park");
H.eq(climbs.bad, 0, "every climbing step moves exactly C.DRIFT_CLIMB * dt");
H.eq(climber.depth, 1, "⛔ and it STOPS at the rim — depth > 1 is not a legal position");
H.assert(climbs.flat > 0, "it sat at the rim for the rest of the run");

// ⛔ The cycle CONTINUES at the rim, so a rim Drifter is a boundary-hopping
// hunter rather than a parked one.
const rimPhases = new Set();
drive(climber, well, 300, (before, d) => rimPhases.add(d.phase));
H.eq(climber.depth, 1, "still exactly at the rim");
H.assert(rimPhases.has("ride") && rimPhases.has("cross"),
         "⛔ and still alternating — the climb stopping does not stop the cycle");

// ---------------------------------------------------------------------------
// ⛔ THE WALL, on all six open wells (GDD 3.5, §17 item 3)
// ---------------------------------------------------------------------------
//
// Trap 4: depth is pinned below C.DRIFT_HOME_DEPTH so the stored heading is the
// only input to a cross direction — homing has its own cases below.
//
// ⛔ THE MUTATION CHECK IS "consecutive rides are one lane apart". Called with
// laneHop's DEFAULT (lane-centre) fold bounds, a cross from lane 0.5 heading
// down lands back on lane 0.5 — legal, inside every range check, and a whole
// vulnerable crossing window in which the Drifter announces itself as shootable
// and does not move. That is the degeneracy CS005 P1's bounds exist for.
const MAX_LANE_STEP = 2 * DT / C.DRIFT_CROSS_TIME;
let wallRuns = 0, wallFail = null, stallFail = null, speedFail = null, latticeFail = null;
let grindFail = null;
for (const w of OPEN) {
  const lo = laneBoundaryLo(w), hi = laneBoundaryHi(w);
  for (const lane of [0, 1, Math.floor(w.lanes / 2), w.lanes - 2, w.lanes - 1]) {
    for (const dir of [-1, 1]) {
      const d = loose(lane, 0, dir);
      const rides = [];
      drive(d, w, 1200, (before, e) => {
        if (e.lane < -EPS || e.lane > w.lanes - 1 + EPS) {
          wallFail = `${w.name}: lane ${e.lane} left [0, ${w.lanes - 1}]`;
        }
        if (Math.abs(laneDelta(w, before.lane, e.lane)) > MAX_LANE_STEP + EPS) {
          speedFail = `${w.name}: ${before.lane} -> ${e.lane} in one step`;
        }
        if (e.phase === "ride" && before.phase === "cross") {
          if (!onLattice(e.lane) || e.lane < lo - EPS || e.lane > hi + EPS) {
            latticeFail = `${w.name}: settled off the lattice at ${e.lane}`;
          }
          rides.push(e.lane);
        }
      }, 0.10);
      wallRuns++;
      for (let i = 1; i < rides.length; i++) {
        if (Math.abs(Math.abs(rides[i] - rides[i - 1]) - 1) > EPS) {
          stallFail = `${w.name}: ride ${rides[i - 1]} -> ${rides[i]} did not move one lane`;
        }
      }
      if (rides.length < 8) stallFail = `${w.name}: only ${rides.length} rides in 20 s`;
      // ⛔ THE MUTATION CHECK FOR THE WRITE-BACK. An entity that keeps its own
      // heading and asks laneHop only for a POSITION still moves one lane every
      // cross — it just moves out and straight back, forever, two boundaries
      // wide. That is GDD 3.5's named bug and the check above cannot see it.
      if (new Set(rides).size < 4) {
        grindFail = `${w.name}: only ${new Set(rides).size} distinct boundaries in 20 s`;
      }
    }
  }
}
H.eq(OPEN.length, 6, "the wall cases cover every open well");
H.eq(wallRuns, OPEN.length * 10, `${wallRuns} wall runs`);
H.assert(wallFail === null, `⛔ no lane ever leaves [0, lanes-1] on an open well (${wallFail})`);
H.assert(latticeFail === null,
         `⛔ every settled ride is on the lattice, inside [lo, hi] (${latticeFail})`);
H.assert(speedFail === null,
         `⛔ and no step exceeds 2 * DT / C.DRIFT_CROSS_TIME — a wrapped cross would ` +
         `land inside the range check and fail here (${speedFail})`);
H.assert(stallFail === null,
         `⛔ EVERY cross moves exactly one lane, at the wall as much as in the middle — ` +
         `the fold bounds are the boundary lattice's (${stallFail})`);
H.assert(grindFail === null,
         `⛔ and it TRAVELS rather than grinding out and back at the wall — the dir ` +
         `laneHop returns is written back (${grindFail})`);

// It really does turn around: from lane 0 heading down on every open well, the
// stored heading is +1 by the time it has settled.
let turned = 0;
for (const w of OPEN) {
  const d = loose(0, 0, -1);
  drive(d, w, BIRTH_STEPS, undefined, 0.10);
  if (d.dir === 1) turned++;
}
H.eq(turned, OPEN.length,
     "⛔ a birth into the wall reverses the HEADING as well as the position — the wall " +
     "and the crosser's direction are one piece of state (GDD 3.5)");

// ⚠ The debug bench spawns in the Skimmer's CONTINUOUS lane, so a bench Drifter
// rides BETWEEN two lattice points forever. Legal, documented in boundaryFrom's
// header, and it must still never leave the strip.
let fracFail = null;
for (const w of OPEN) {
  for (const lane of [0.2, 0.6, 3.27, w.lanes - 1.4]) {
    const d = loose(lane, 0, -1);
    drive(d, w, 600, (before, e) => {
      if (e.lane < laneBoundaryLo(w) - EPS || e.lane > laneBoundaryHi(w) + EPS) {
        if (e.phase === "ride") fracFail = `${w.name}: ${lane} settled at ${e.lane}`;
      }
    }, 0.10);
  }
}
H.assert(fracFail === null,
         `⚠ a Drifter born off a lane centre stays legal and stays inside the ` +
         `lattice bounds — it is simply never ON the lattice (${fracFail})`);

// ---------------------------------------------------------------------------
// homing (GDD 6.1's "homes near rim")
// ---------------------------------------------------------------------------
//
// Trap 3: a boundary is within C.HIT_LANE_TOL of two lane centres, so the craft
// is parked several lanes away in every case here.
function homedDir(depth, skimmerLane, storedDir) {
  const w = useWell(0);                     // Ring, 16 lanes, closed
  const d = X.spawnEnemy("drifter", 4, 0);
  drive(d, w, 400, null);                   // let it settle onto the lattice
  while (d.phase !== "ride") d.update(DT, w, state);
  d.depth = depth;
  d.dir = storedDir;
  d.rideTimer = 0;
  state.skimmer.lane = skimmerLane;
  const from = d.lane;
  while (d.phase === "ride") { d.depth = depth; d.update(DT, w, state); }
  return { sign: Math.sign(laneDelta(w, from, from + d.crossDelta)), lane: from, dir: d.dir };
}

let hom = homedDir(0.9, 8, -1);
H.eq(hom.sign, 1,
     "⛔ at or above C.DRIFT_HOME_DEPTH the cross aims at the Skimmer, overriding the stored heading");
hom = homedDir(0.9, 1, 1);
H.eq(hom.sign, -1, "and the other way round");
hom = homedDir(0.2, 8, -1);
H.eq(hom.sign, -1,
     "⛔ below it the STORED heading carries — the Drifter is only a hunter near the rim");
hom = homedDir(0.2, 1, 1);
H.eq(hom.sign, 1, "and the other way round");

// ⚠ THE ONE JUDGMENT CALL IN THE CLASS. Vaulter.huntDir() returns 0 in three
// cases and the Vaulter answers a 0 by not hopping that beat. A Drifter may not:
// declining a cross leaves it RIDING, which is armoured, and the armour budget
// is C.DRIFT_RIDE_TIME rather than "until the player moves". So a 0 falls back
// to the stored heading and the cross still happens.
well = useWell(0);
const stubState = { skimmer: null };
for (const target of [null, { lane: 4.5, dead: true }, { lane: 0.5, dead: false }]) {
  const d = loose(0, 0, 1);
  stubState.skimmer = target;
  let crossed = 0, lastPhase = d.phase;
  for (let i = 0; i < 400; i++) {
    d.depth = 0.9;
    d.update(DT, well, stubState);
    if (d.phase === "cross" && lastPhase === "ride") crossed++;
    lastPhase = d.phase;
  }
  H.assert(crossed >= 3,
           `⚠ a homing answer of 0 still crosses, on the stored heading (${crossed} crossings)`);
}

// ---------------------------------------------------------------------------
// ⛔ THE CONTRACT FIELDS (GDD 6.5) — and killDepth is NOT zero
// ---------------------------------------------------------------------------

well = useWell(0);
const probe = X.spawnEnemy("drifter", 3, 0);
H.eq(probe.purgeable, true, "⛔ purgeable — GDD 6.1's 'Purge anywhere'");
H.eq(probe.blocksClear, true, "blocksClear — a Drifter you never answered holds the well open");
H.eq(probe.anchored, false, "anchored is false — its depth is a POSITION, not a length");
H.eq(probe.killDepth, 1 - C.RIM_CONTACT_DEPTH,
     "⛔ killDepth is the rim band, the same expression the Vaulter, Carrier and bolt use");
H.assert(probe.killDepth !== 0,
         "⛔ and it is NOT 0 — two shipped comments predicted that and CS005 P2 corrected both");

// ⛔ THE MUTATION CHECK FOR killDepth = 0, THROUGH THE REAL PATHS. collideSkimmer
// has no term for where the Skimmer is (it is always at depth 1), so `>= 0` is
// every legal depth: a Drifter released into the player's lane would kill them
// on the spawn step, from the throat, having travelled nowhere.
well = useWell(0);
state.skimmer.lane = 5;
const fromThroat = X.spawnEnemy("drifter", 5, 0);
G.update(DT);
H.eq(state.skimmer.dead, false,
     "⛔ a Drifter spawned at the THROAT in the craft's lane does not kill it on the spawn step");
H.eq(state.lives, C.START_LIVES, "and no life is spent");
H.assert(!fromThroat.dead && fromThroat.depth < C.DRIFT_HOME_DEPTH, "it is simply climbing");

// Deeper than the rim band and still harmless; at the band, lethal.
let killedAt = [];
for (const depth of [0, 0.25, 0.5, 0.9, 0.94, 0.95, 1]) {
  well = useWell(0);
  state.skimmer.lane = 5;
  const d = X.spawnEnemy("drifter", 5, 0);
  d.depth = depth;
  X.collideSkimmer(state, well);
  if (state.skimmer.dead) killedAt.push(depth);
}
H.assert(JSON.stringify(killedAt) === JSON.stringify([0.95, 1]),
         `⛔ lethal only inside the rim band 1 - C.RIM_CONTACT_DEPTH (killed at ${killedAt})`);

// ⚠ A RIDING DRIFTER THREATENS TWO LANES, and that is its whole tactical
// identity. A boundary is exactly C.HIT_LANE_TOL from two lane centres, so
// laneHit is true for both — worth knowing before it is playtested, because it
// is the largest lethal footprint in Classic.
let bothLanes = 0;
for (const skLane of [4, 5]) {
  well = useWell(0);
  state.skimmer.lane = skLane;
  const d = X.spawnEnemy("drifter", 4, 0);
  d.depth = 1;
  d.lane = 4.5;
  X.collideSkimmer(state, well);
  if (state.skimmer.dead) bothLanes++;
}
H.eq(bothLanes, 2, "⚠ a Drifter on boundary 4.5 at the rim kills in lane 4 AND lane 5");

// ---------------------------------------------------------------------------
// ⛔ THE ARMOUR — the roster's first phase-dependent onShot (GDD 6.5)
// ---------------------------------------------------------------------------

// A shot placed at a chosen depth in a chosen lane, through the real class.
function shotAt(w, lane, depth) {
  const s = new X.Shot(w, lane);
  s.t = (1 - depth) * C.SHOT_TIME;
  state.shots.push(s);
  return s;
}

// Settle a Drifter into a chosen phase on a quiet board, well away from the
// craft (trap 3).
function staged(phase, depth) {
  const w = useWell(0);
  state.skimmer.lane = 12;
  const d = X.spawnEnemy("drifter", 4, 0);
  for (let i = 0; i < 400 && d.phase !== phase; i++) d.update(DT, w, state);
  d.depth = depth === undefined ? 0.5 : depth;
  return { well: w, d };
}

let s = staged("ride");
H.eq(s.d.riding(), true, "the staged Drifter is riding");
H.eq(s.d.onShot(null), false, "⛔ riding declines the shot — it is NOT consumed (GDD 6.5)");
H.eq(s.d.dead, false, "and takes no damage");

// ⛔ THE MUTATION CHECK, through the REAL collideShots: a Drifter that returned
// true while riding would retire the shot here and this case would go red on
// both counts.
let hit = shotAt(s.well, 4, s.d.depth);
hit.lane = s.d.lane;                        // a boundary is not a Shot lane, so write it
X.collideShots(state, s.well);
H.eq(s.d.dead, false, "⛔ a shot into an armoured Drifter does not kill it");
H.eq(hit.dead, false, "⛔ and does not retire the shot — it flies on to whatever is behind");

// ⚠ …but it still costs the shot its RESOLUTION for that step, because
// collideShots' break is unconditional. The Weaver bolt's header predicted this
// and it is the same mechanism. ⛔ Do not make that break conditional.
s = staged("ride");
const behind = X.spawnEnemy("vaulter", 4, 0);
behind.depth = s.d.depth;
hit = shotAt(s.well, 4, s.d.depth);
hit.lane = s.d.lane;
H.eq(state.enemies.indexOf(s.d), 0, "the Drifter is ahead of the Vaulter in the array");
X.collideShots(state, s.well);
H.eq(behind.dead, false,
     "⚠ a riding Drifter briefly SHIELDS what is behind it — one shot resolves against " +
     "at most one enemy per step, consumed or not");

// Crossing is the other half.
s = staged("cross");
H.eq(s.d.riding(), false, "the staged Drifter is crossing");
hit = shotAt(s.well, 4, s.d.depth);
hit.lane = s.d.lane;
X.collideShots(state, s.well);
H.eq(s.d.dead, true, "⛔ crossing is vulnerable: any shot kills it");
H.eq(hit.dead, true, "and the shot is spent — one shot, one Drifter");

// ---------------------------------------------------------------------------
// ⛔ THE PURGE KILLS IT IN EITHER PHASE (GDD 4.3, 6.1's "Purge anywhere")
// ---------------------------------------------------------------------------
//
// It needs no code: purgeable is inherited true and updatePurge() sets `dead`
// directly, never asking onShot(). An armour that could refuse the panic button
// would not be a panic button.
for (const phase of ["ride", "cross"]) {
  s = staged(phase);
  H.eq(s.d.phase, phase, `a ${phase}ing Drifter is on the board`);
  state.purgeLatched = false;
  state.input.purge = true;
  X.updatePurge(state);
  H.eq(s.d.dead, true, `⛔ the Purge kills a ${phase}ing Drifter`);
}

// ---------------------------------------------------------------------------
// ⛔ IT SPAWNS NOTHING, EVER
// ---------------------------------------------------------------------------
//
// test-cs004-p1.js's spawnRow case filters the board for entities the row's own
// members created and expects exactly one source of those (the Weaver's Thorn).
well = useWell(0);
const solo = X.spawnEnemy("drifter", 4, 0);
for (let i = 0; i < 1200; i++) G.update(DT);
H.assert(state.enemies.every(e => e === solo || e.dead === true),
         "⛔ twenty seconds with one Drifter on a spent quota adds nothing to the board");
H.eq(state.enemies.filter(e => e instanceof X.Drifter).length, 1, "and there is still exactly one");

// ---------------------------------------------------------------------------
// ⛔ IT READS NO well.closed (GDD 3.5)
// ---------------------------------------------------------------------------
//
// The topology lives entirely inside boundaryFrom / laneHop / laneDelta /
// laneNormalize / laneBoundaryLo-Hi, which is the only reason a Drifter behaves
// on a Ring and on a Fan without a branch. Asserted against the BUILT file,
// because that is the behaviour oracle.
const clsStart = SCRIPT.indexOf("class Drifter extends Enemy {");
H.assert(clsStart > 0, "the built file carries class Drifter");
const clsEnd = SCRIPT.indexOf("\n}\n", clsStart);
const clsBody = SCRIPT.slice(clsStart, clsEnd);
H.assert(clsBody.length > 500 && clsBody.indexOf("onShot") > 0, "the slice is the whole class");
// ⚠ Line comments are dropped first, and only line comments — the class's own
// header EXPLAINS that boundaryFrom is where well.closed is read and that the
// spawner is what the Drifter does not touch, so a raw text search finds both
// in prose. This class has no block comments and no string literals; ⛔ do not
// grow this into a general comment stripper (_harness.js's header says why).
const clsCode = clsBody.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n");
H.assert(clsCode.indexOf("laneHop") > 0, "the stripped slice is still the code");
H.assert(!/\.closed\b/.test(clsCode),
         "⛔ nothing in the Drifter reads a well's topology");
H.assert(!/spawnEnemy/.test(clsCode), "⛔ and it never reaches for the spawner");

// ---------------------------------------------------------------------------
// ⛔ THE TWO SILHOUETTES AND THE THREE CHANNELS (GDD 6.3, 10.2, 12, 18)
// ---------------------------------------------------------------------------

const RIDE = X.DRIFTER_POLY_RIDE, CROSS = X.DRIFTER_POLY_CROSS;
H.assert(Array.isArray(RIDE) && Array.isArray(CROSS), "both are local-space point arrays");
H.assert(RIDE !== CROSS, "⛔ TWO POLYS, not one poly restyled");
H.assert(RIDE.length >= 3 && CROSS.length >= 3, "each has enough points to be a shape");
H.assert(RIDE.concat(CROSS).every(q => isFinite(q.l) && isFinite(q.d)),
         "⛔ in (l, d) — lane offset and depth offset, never a screen coordinate");
const reach = p => p.reduce((m, q) => Math.max(m, Math.abs(q.l)), 0);
H.eq(reach(CROSS), 1,
     "the crossing shape reaches ±1, so C.DRIFTER_SIZE is the lane widths it spans");
H.assert(reach(RIDE) < reach(CROSS) * 0.8,
         `⛔ and the riding shape is COMPACT — a third channel that survives where line ` +
         `weight and alpha do not (${reach(RIDE)} vs ${reach(CROSS)})`);

// ⛔ Two polys cost one projection loop and ZERO allocation: entityPoints
// memoizes a scratch array PER POLY (the Carrier's hull-and-glyph pattern).
well = WELLS[0];
const ptsA = X.entityPoints(well, 4.5, 0.5, RIDE, C.DRIFTER_SIZE);
const ptsB = X.entityPoints(well, 6.5, 0.7, RIDE, C.DRIFTER_SIZE);
const ptsC = X.entityPoints(well, 4.5, 0.5, CROSS, C.DRIFTER_SIZE);
H.assert(ptsA === ptsB, "the same poly reuses one scratch array");
H.assert(ptsA !== ptsC, "and the second poly has its own");

// The real draw path, recorded off the canvas context.
function record(fn) {
  const ctx = X._env.canvas.getContext("2d");
  const prev = { close: ctx.closePath, stroke: ctx.stroke, move: ctx.moveTo, line: ctx.lineTo };
  const log = { closes: 0, moves: 0, lines: 0, strokes: [] };
  ctx.closePath = () => { log.closes++; };
  ctx.moveTo = () => { log.moves++; };
  ctx.lineTo = () => { log.lines++; };
  ctx.stroke = () => { log.strokes.push({ w: ctx.lineWidth, a: ctx.globalAlpha, c: ctx.strokeStyle }); };
  try { fn(ctx); } finally {
    ctx.closePath = prev.close; ctx.stroke = prev.stroke;
    ctx.moveTo = prev.move; ctx.lineTo = prev.line;
  }
  return log;
}

// ⛔ Driven off the ENTITY's own phase, not by passing a flag — the two states
// can never drift apart from the two behaviours.
const DEPTH = 0.5;
s = staged("ride", DEPTH);
const rideLog = record(ctx => s.d.draw(ctx, s.well));
s = staged("cross", DEPTH);
const crossLog = record(ctx => s.d.draw(ctx, s.well));

H.eq(rideLog.closes, 1, "⛔ SOLID = ARMOURED — the riding poly is drawn CLOSED (GDD 12)");
H.eq(crossLog.closes, 0, "⛔ OPEN = VULNERABLE — the crossing poly is drawn OPEN");
H.eq(rideLog.lines, RIDE.length - 1, "the riding path is the riding poly");
H.eq(crossLog.lines, CROSS.length - 1, "and the crossing path is the crossing one");
H.eq(rideLog.strokes.length, 2, "glowStroke's two passes, wide-and-dim then thin-and-bright");
H.eq(crossLog.strokes.length, 2, "the same two");
H.assert(rideLog.strokes.every(k => k.c === C.DRIFTER_COLOR), "in C.DRIFTER_COLOR");

const rideThin = rideLog.strokes[1], crossThin = crossLog.strokes[1];
H.close(rideThin.w, X.laneLineWidth(DEPTH) * C.DRIFT_RIDE_WIDTH, EPS,
        "the riding stroke is laneLineWidth x C.DRIFT_RIDE_WIDTH");
H.close(crossThin.w, X.laneLineWidth(DEPTH) * C.DRIFT_CROSS_WIDTH, EPS,
        "and the crossing stroke is laneLineWidth x C.DRIFT_CROSS_WIDTH");
H.assert(crossThin.w / rideThin.w >= 2.0,
         "⛔ measured through the real draw path, the crossing stroke is at least 2x the riding one");
H.close(rideThin.a, C.GLOW_THIN_ALPHA * C.DRIFT_RIDE_ALPHA, EPS, "the riding alpha is dimmed");
H.close(crossThin.a, C.GLOW_THIN_ALPHA, EPS, "and the crossing alpha is full");
H.assert(rideThin.a / crossThin.a <= 0.7, "⛔ measured, the riding read is at most 0.7 as bright");
H.close(rideLog.strokes[0].w / rideThin.w, C.GLOW_WIDE_W, EPS,
        "⛔ the glow spread is width x C.GLOW_WIDE_W — a narrower width IS a harder edge");
H.eq(C.GLOW_WIDE_W, 6.0, "⛔ and no global glow constant moved: GLOW_WIDE_W");
H.eq(C.GLOW_WIDE_ALPHA, 0.20, "GLOW_WIDE_ALPHA");
H.eq(C.GLOW_THIN_ALPHA, 0.95, "GLOW_THIN_ALPHA");

// Both states run headless on a closed and an open well, at every depth.
let drew = 0;
for (const w of [WELLS[0], OPEN[0]]) {
  for (const riding of [true, false]) {
    for (const depth of [0, 0.2, 0.5, 1]) {
      const log = record(ctx => X.drawDrifter(ctx, w, 3.5, depth, riding));
      if (log.strokes.length === 2 && log.strokes.every(k => isFinite(k.w))) drew++;
    }
  }
}
H.eq(drew, 16, "both silhouettes project on both topologies at every depth, with no NaN");

// ---------------------------------------------------------------------------
// the debug bench key P1 left dark (GDD 9.5) — ⚠ TEMPORARY
// ---------------------------------------------------------------------------

useWell(0);
H.eq(state.enemies.length, 0, "the bench case starts on an empty board");
G.input.keyDown("5");
H.eq(state.enemies.length, 0,
     "⛔ a keydown spawns nothing at event time — named actions are dispatched inside sample()");
G.update(DT);
G.input.keyUp("5");
H.eq(state.enemies.length, 1, "⚠ pressing 5 puts exactly one entity on the board");
H.assert(state.enemies[0] instanceof X.Drifter, "and it is a Drifter");

// ⛔ C.DEBUG_SPAWN_KINDS is a bench, never a difficulty knob: it still ships as
// one entry, so a played build is still a Vaulter build until GDD 8.1 lands.
H.assert(JSON.stringify(C.DEBUG_SPAWN_KINDS) === JSON.stringify(["vaulter"]),
         "⛔ the shipped spawn list is untouched by this phase");

// …and the interval spawner releases Drifters when a test asks it to, through
// the one entry point, with the run's one stream deciding the lane.
const savedKinds = C.DEBUG_SPAWN_KINDS;
C.DEBUG_SPAWN_KINDS = ["drifter"];
useWell(7);                                  // Vee, open, 13 lanes
state.spawn.remaining = C.SPAWN_QUOTA;
for (let i = 0; i < 1800; i++) G.update(DT);
C.DEBUG_SPAWN_KINDS = savedKinds;
H.assert(JSON.stringify(C.DEBUG_SPAWN_KINDS) === JSON.stringify(["vaulter"]),
         "the fixture put the shipped list back");
H.assert(state.time > 0, "thirty seconds of a Drifter-only well ran without throwing");

H.report("test-cs005-p2.js");
