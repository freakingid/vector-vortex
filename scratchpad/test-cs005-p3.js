// test-cs005-p3.js — CS005 P3: the Surger (GDD 6.1, 6.3, 4.5 item 3, 6.5,
// 10.2, 10.3, 18). Asserts what P3 owns; it makes no claim about the cargo
// rows, the soak, scoring or the Dive, none of which exist.
//
// ⛔ SIX TRAPS IN THE FIXTURES.
//  1. killDepth is MUTATED, not fixed. Every case that reads it has to say
//     which phase it read it in, and the restore is as load-bearing as the
//     mutation — an unrestored 0 is a permanently lane-lethal enemy.
//  2. The lethality cases drive the REAL G.update(), so the entity pass runs
//     before the collision pass exactly as it ships. A Surger pinned at depth
//     0.30 is far below the rim band, so the ONLY thing that can kill there is
//     the discharge.
//  3. Death spends a life and arms invulnerability, and a respawn step cannot
//     die at all. The cycle case restores `lives` and `invulnTime` every step,
//     which is why it can count lethal steps per phase instead of stopping at
//     the first one.
//  4. The Surger sits on an INTEGER lane, so C.HIT_LANE_TOL (0.5) makes one
//     lane away genuinely safe — unlike the Drifter, which rides a boundary and
//     threatens two lanes at once.
//  5. Boot calls startGame(), so the live state at load is a run in progress.
//     Every case starts from useWell().
//  6. The draw cases hook moveTo/lineTo/closePath/stroke on the harness's Proxy
//     context and restore them; the fuse's geometry is read back off the real
//     calls and compared against screenPos().
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
const RIM_BAND = 1 - C.RIM_CONTACT_DEPTH;
const CYCLE = C.SURGE_INTERVAL + C.SURGE_TELEGRAPH + C.SURGE_DISCHARGE;

const SCRIPT = H.extractScript(require("fs").readFileSync(
  require("path").join(__dirname, "..", "dist", "vector-vortex.html"), "utf8"));

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

// A bare Surger, off the board, driven by the exact line Game.update()'s entity
// pass runs. Used wherever a board and a collision pass would only add ways for
// the case to end early.
function loose(lane, depth, dir) {
  return X.ENEMY_KINDS.surger(lane, depth, dir);
}

// Step one entity until it reaches `phase`. `pinDepth`, when given, is held
// before every step and once more afterwards (trap 2).
function driveToPhase(d, well, phase, pinDepth) {
  for (let i = 0; i < 2000 && d.phase !== phase; i++) {
    if (pinDepth !== undefined) d.depth = pinDepth;
    d.update(DT, well, state);
  }
  if (pinDepth !== undefined) d.depth = pinDepth;
  return d;
}

// ---------------------------------------------------------------------------
// the constants, and ⛔ THE ONE RELATIONSHIP THAT IS AN INVARIANT
// ---------------------------------------------------------------------------

H.eq(C.SURGER_SIZE, 0.85, "C.SURGER_SIZE — the zigzag bar's lane span");
H.eq(C.SURGE_CLIMB, 0.15, "C.SURGE_CLIMB — depth/s, in the CLIMB phase only");
H.eq(C.SURGE_INTERVAL, 2.60, "C.SURGE_INTERVAL — s of climb between discharges");
H.eq(C.SURGE_DISCHARGE, 0.30, "C.SURGE_DISCHARGE — s the whole lane is live");
H.eq(C.SURGE_LIT_WIDTH, 2.20, "C.SURGE_LIT_WIDTH — x laneLineWidth for the live lane");
H.eq(C.SURGE_TELEGRAPH, 0.45,
     "⛔ C.SURGE_TELEGRAPH already existed and is NOT re-declared — CS005 P3 is its first reader");
H.assert(typeof C.SURGER_COLOR === "string",
         "⚠ C.SURGER_COLOR already existed and is not re-declared — provisional");

// ⛔ THE INVARIANT, WITH THE REASON AT THE ASSERTION. During the discharge the
// Surger's killDepth is 0, so GDD 4.4's rim push cannot protect a respawning
// player from it: that push only ever LOWERS an enemy's depth, to
// C.RESPAWN_PUSH_DEPTH, and 0.55 is still above 0. The invulnerability window
// is therefore the ONLY thing between a respawn and a discharge that was
// already running. A discharge that outlasted it would kill the player on the
// step the blink stopped, in the lane they had no way to leave. This is not a
// coincidence between two numbers; ⛔ CS006's heat curve is what would break it.
H.assert(C.SURGE_DISCHARGE < C.RESPAWN_INVULN,
         `⛔ C.SURGE_DISCHARGE (${C.SURGE_DISCHARGE}) must stay STRICTLY below ` +
         `C.RESPAWN_INVULN (${C.RESPAWN_INVULN}) — GDD 4.4's rim push does nothing ` +
         `against a killDepth of 0, so the invulnerability window is the only guard`);

// ⛔ Scope boundary: GDD 7's 200 points is CS007's, and addScore() is its one
// entry point. The constant exists and must still have exactly one mention in
// the build — its own declaration.
H.eq(SCRIPT.split("PTS_SURGER").length - 1, 1,
     "⛔ C.PTS_SURGER is still unread — no scoring lands before addScore() (CS007)");

// ---------------------------------------------------------------------------
// the ENEMY_KINDS row — ⛔ `dir` ignored, the draw still spent
// ---------------------------------------------------------------------------

H.assert("surger" in X.ENEMY_KINDS, "⛔ the Surger is an ENEMY_KINDS row like everything else");
H.eq(X.ENEMY_KINDS.surger.length, 2,
     "the factory is (lane, depth) — ⛔ `dir` is ignored, as it is on the Weaver, " +
     "the bolt and the Thorn; spawnEnemy() still spends the draw");

const born = loose(7, 0.3, -1);
H.assert(born instanceof X.Surger, "the row builds a Surger");
H.eq(born.lane, 7, "lane is exactly the argument");
H.eq(born.depth, 0.3, "and so is depth");
H.eq(born.dir, undefined, "⛔ it stores no heading at all — there is nothing to keep in step");

// ---------------------------------------------------------------------------
// ⛔ THE CONTRACT FIELDS (GDD 6.5) — SEVEN, AND NO EIGHTH
// ---------------------------------------------------------------------------

let well = useWell(0);
const probe = X.spawnEnemy("surger", 3, 0);
H.eq(probe.purgeable, true, "⛔ purgeable — GDD 6.1's 'Any shot, Purge'");
H.eq(probe.blocksClear, true, "blocksClear — a Surger you never answered holds the well open");
H.eq(probe.anchored, false, "anchored is false — its depth is a POSITION, not a length");
H.eq(probe.killDepth, RIM_BAND,
     "⛔ killDepth is the rim band at rest, the same expression every other rim-contact " +
     "entity uses — so a Surger that reaches the rim in your lane kills by GDD 4.5 item 1 too");

// ⛔ NO EIGHTH CONTRACT FIELD. The discharge is a MUTATED killDepth, so the
// Surger's own state is exactly the base class's seven plus a phase string and
// one up-counting timer. A field named for lane lethality would be the eighth,
// and collideSkimmer() would need a branch to read it.
const baseFields = Object.keys(new X.Enemy(0, 0));
const surgerFields = Object.keys(probe);
const added = surgerFields.filter(k => baseFields.indexOf(k) === -1);
H.assert(added.length === 2 && added.indexOf("phase") >= 0 && added.indexOf("surgeTimer") >= 0,
         `⛔ it adds only a phase and one timer to the seven contract fields (${added})`);
H.assert(!/killDepth\s*===\s*0|surg|discharg|charge/i.test(
           SCRIPT.slice(SCRIPT.indexOf("function collideSkimmer"),
                        SCRIPT.indexOf("function collideSkimmer") + 1200)),
         "⛔ and collideSkimmer() grew no branch for it — that is the return the " +
         "contract was designed to pay");

// ---------------------------------------------------------------------------
// ⛔ IT CAN NEVER DISCHARGE ON ITS FIRST STEP, FROM ANY SPAWN DEPTH
// ---------------------------------------------------------------------------
//
// A Surger that arrives already discharging is the same unaccountable death
// CS005 P2's killDepth correction is about, and GDD 6.3 is explicit that the
// fuse is the fairness. It is also what keeps test-cs004-p1.js's spawnRow case
// green — that case drives one G.update(DT) over a freshly spawned row.
let firstStepFail = null;
for (const w of WELLS) {
  for (const depth of [0, 0.25, 0.5, C.SAFE_SPAWN_DEPTH, 1]) {
    const d = loose(0, depth, 1);
    if (d.phase !== "climb" || d.surgeTimer !== 0) {
      firstStepFail = `${w.name} @${depth}: born ${d.phase}, timer ${d.surgeTimer}`;
    }
    d.update(DT, w, state);
    if (d.phase !== "climb" || d.killDepth !== RIM_BAND || d.chargeTip() !== 0) {
      firstStepFail = `${w.name} @${depth}: step one left it ${d.phase}, killDepth ${d.killDepth}`;
    }
  }
}
H.assert(firstStepFail === null,
         `⛔ born in climb with a zero timer, and still climbing after one step, on every ` +
         `well at every spawn depth (${firstStepFail})`);

// The same through the real spawn-and-step path, in the craft's own lane.
well = useWell(0);
state.skimmer.lane = 5;
const fromThroat = X.spawnEnemy("surger", 5, 0);
G.update(DT);
H.eq(state.skimmer.dead, false,
     "⛔ a Surger spawned at the THROAT in the craft's lane does not kill it on the spawn step");
H.eq(state.lives, C.START_LIVES, "and no life is spent");
H.eq(fromThroat.phase, "climb", "it is simply climbing");

// ---------------------------------------------------------------------------
// the cycle — climb, telegraph, discharge, climb … with one up-counting timer
// ---------------------------------------------------------------------------

well = useWell(0);                          // Ring, closed, 16 lanes
const cyc = loose(4, 0, 1);
const phases = [];
const runs = { climb: [], telegraph: [], discharge: [] };
let run = null;
let timerFail = null;
drive(cyc, well, 1400, (before, d) => {
  if (phases.length === 0 || phases[phases.length - 1] !== d.phase) {
    phases.push(d.phase);
    run = { steps: 0 };
    runs[d.phase].push(run);
    // ⛔ THE TIMER IS RESET AT EVERY TRANSITION rather than compared against a
    // running total. A transition that left it running would make the next
    // phase one step long. ⚠ Not the FIRST entry: that one is the constructor's
    // climb, already one step old by the time this visitor sees it.
    if (phases.length > 1 && d.surgeTimer !== 0) {
      timerFail = `${d.phase} entered with timer ${d.surgeTimer}`;
    }
  } else if (!(d.surgeTimer > before.timer)) {
    timerFail = `${d.phase} timer did not count up (${before.timer} -> ${d.surgeTimer})`;
  }
  run.steps++;
});
H.eq(phases[0], "climb", "the cycle opens in climb");
H.eq(phases[1], "telegraph", "then the lane arms");
H.eq(phases[2], "discharge", "then it goes live");
H.eq(phases[3], "climb", "then it climbs again");
H.assert(phases.every((p, i) => p === ["climb", "telegraph", "discharge"][i % 3]),
         "⛔ and it repeats in that order forever — no fourth state, no skipped fuse");
H.assert(phases.length >= 9, `the run covers several full cycles (${phases.length} phases)`);
H.assert(timerFail === null, `⛔ one timer, counting UP, reset at every transition (${timerFail})`);

H.close(runs.climb[1].steps * DT, C.SURGE_INTERVAL, 2 * DT, "a climb lasts C.SURGE_INTERVAL");
H.close(runs.telegraph[1].steps * DT, C.SURGE_TELEGRAPH, 2 * DT,
        "⛔ a telegraph lasts C.SURGE_TELEGRAPH — the fuse GDD 6.3 requires");
H.close(runs.discharge[1].steps * DT, C.SURGE_DISCHARGE, 2 * DT,
        "and a discharge lasts C.SURGE_DISCHARGE");
H.close(runs.climb[0].steps * DT, C.SURGE_INTERVAL, 2 * DT,
        "⛔ the FIRST climb is a full interval too — a fresh Surger is no closer to " +
        "discharging than one that has just fired");

// ---------------------------------------------------------------------------
// ⛔ killDepth THROUGH THE WHOLE CYCLE — the rim band, EXCEPT the discharge
// ---------------------------------------------------------------------------

const bands = { climb: new Set(), telegraph: new Set(), discharge: new Set() };
const k = loose(4, 0, 1);
drive(k, well, 1400, (before, d) => bands[d.phase].add(d.killDepth));
H.assert(bands.climb.size === 1 && bands.climb.has(RIM_BAND),
         "⛔ climbing: killDepth is the rim band");
H.assert(bands.telegraph.size === 1 && bands.telegraph.has(RIM_BAND),
         "⛔ AND THROUGH THE WHOLE TELEGRAPH TOO — the fuse is a warning, not the effect");
H.assert(bands.discharge.size === 1 && bands.discharge.has(0),
         "⛔ discharging: killDepth is EXACTLY 0, so the only remaining term in " +
         "collideSkimmer is laneHit() — which is GDD 4.5 item 3 verbatim");
H.eq(k.killDepth, RIM_BAND,
     "⛔ and it is RESTORED on the way out — an unrestored 0 is a permanently " +
     "lane-lethal enemy nothing downstream could tell from a collision-pass bug");

// ---------------------------------------------------------------------------
// ⛔ DEPTH RISES IN THE CLIMB PHASE ONLY, and stops at 1
// ---------------------------------------------------------------------------
//
// ⚠ THE ASYMMETRY WITH THE DRIFTER IS DELIBERATE AND IT IS THE OTHER WAY ROUND
// FROM killDepth. C.DRIFT_CLIMB runs in BOTH of that entity's phases because
// riding is unshootable and a parked unshootable entity is a concurrency
// squatter. A Surger is shootable in all three phases, so nothing forces it —
// and the pause is worth having: the bar stops moving at the instant its lane
// starts arming, which is a fourth channel on the fuse for free.
const moved = { climb: 0, telegraph: 0, discharge: 0 };
const still = { climb: 0, telegraph: 0, discharge: 0 };
let rateFail = null, boundFail = null;
const climber = loose(4, 0, 1);
drive(climber, well, 3000, (before, d) => {
  const dz = d.depth - before.depth;
  if (d.depth < 0 || d.depth > 1) boundFail = `depth left [0,1] at ${d.depth}`;
  if (dz === 0) { still[before.phase]++; return; }
  moved[before.phase]++;
  // ⚠ Not Object.is: `depth += rate * dt` accumulates, so the difference of two
  // doubles near 1 carries the last-bit error of the sum, not of the increment.
  if (d.depth !== 1 && Math.abs(dz - C.SURGE_CLIMB * DT) > 1e-14) {
    rateFail = `${before.phase}: moved ${dz}`;
  }
});
H.assert(moved.climb > 0, "⛔ depth rises on climbing steps");
H.eq(moved.telegraph, 0, "⛔ and NOT during the telegraph");
H.eq(moved.discharge, 0, "⛔ nor during the discharge");
H.assert(still.telegraph > 0 && still.discharge > 0, "both of those phases were observed");
H.assert(rateFail === null, `every climbing step moves exactly C.SURGE_CLIMB * dt (${rateFail})`);
H.assert(boundFail === null, `⛔ depth never leaves [0,1] (${boundFail})`);
H.eq(climber.depth, 1, "⛔ and it STOPS at the rim — depth > 1 is not a legal position");

// ⛔ The cycle CONTINUES at the rim: a Surger that has arrived still discharges.
const rimPhases = new Set();
drive(climber, well, 600, (before, d) => rimPhases.add(d.phase));
H.eq(climber.depth, 1, "still exactly at the rim");
H.assert(rimPhases.has("climb") && rimPhases.has("telegraph") && rimPhases.has("discharge"),
         "⛔ and still cycling — the climb stopping does not stop the discharges");

// ---------------------------------------------------------------------------
// ⛔ GDD 4.5 ITEM 3, LIVE — through the real G.update() and the real killSkimmer
// ---------------------------------------------------------------------------
//
// ⛔ THE MUTATION CHECK FOR THE FUSE. A Surger whose killDepth went to 0 when
// the telegraph STARTED rather than when it ended turns this red: the craft
// stands in the lane for the whole cycle and the only phase that may kill it is
// the discharge. Trap 3 — lives and invulnerability are restored every step, so
// this counts lethal steps per phase instead of stopping at the first death.
well = useWell(0);
state.skimmer.lane = 5;
const live = X.spawnEnemy("surger", 5, 0);
const seen = { climb: 0, telegraph: 0, discharge: 0 };
const kills = { climb: 0, telegraph: 0, discharge: 0 };
let livesSpent = 0;
const CYCLE_STEPS = Math.ceil(CYCLE / DT) + 40;
for (let i = 0; i < CYCLE_STEPS; i++) {
  live.depth = 0.30;                        // trap 2 — far below the rim band
  state.lives = C.START_LIVES;              // fixture: the run never ends
  const wasDead = state.skimmer.dead;
  G.update(DT);
  seen[live.phase]++;
  if (!wasDead && state.skimmer.dead) { kills[live.phase]++; livesSpent++; }
  state.invulnTime = C.RESPAWN_INVULN;      // fixture: vulnerable again next step
}
H.assert(seen.climb > 0 && seen.telegraph > 0 && seen.discharge > 0,
         "the craft stood in the lane through a whole cycle");
H.eq(kills.climb, 0,
     "⛔ a climbing Surger at depth 0.30 is harmless — killDepth is the rim band and " +
     "the craft is not at the rim's depth, it is in the rim's LANE");
H.eq(kills.telegraph, 0,
     "⛔ THE LANE IS NEVER LETHAL DURING THE TELEGRAPH. A fuse that kills is not a " +
     "fuse, and that sentence is the whole of GDD 6.3's rule");
H.assert(kills.discharge > 0,
         `⛔ and the discharge kills at a depth the Surger has merely reached — GDD 4.5 ` +
         `item 3, live (${kills.discharge} lethal steps)`);
H.assert(livesSpent > 0, "through the real killSkimmer(), which spent a life for each");

// One clean death, isolated, so the life and the freeze are readable.
well = useWell(0);
state.skimmer.lane = 5;
const one = X.spawnEnemy("surger", 5, 0.30);
driveToPhase(one, well, "discharge", 0.30);
H.eq(one.phase, "discharge", "the staged Surger is discharging");
H.eq(one.killDepth, 0, "with killDepth mutated to 0");
H.eq(state.skimmer.dead, false, "and nothing has touched the craft yet");
X.collideSkimmer(state, well);
H.eq(state.skimmer.dead, true,
     "⛔ being in a discharging Surger's lane kills, at any depth it has reached");
H.eq(state.lives, C.START_LIVES - 1, "one life, through the one death route");

// ⛔ AND ONE LANE AWAY DOES NOT DIE. laneHit's C.HIT_LANE_TOL is half a lane and
// the Surger sits on an integer lane centre, so a neighbour is exactly one lane
// away and safe. ⚠ Nothing widens the lane test for a discharge — GDD 4.5 item 3
// is "a Surger's LANE", singular, and the Drifter is the entity that threatens
// two (it rides a boundary).
let neighbourDeaths = 0;
for (const skLane of [4, 6, 3, 7]) {
  well = useWell(0);
  state.skimmer.lane = skLane;
  const n = X.spawnEnemy("surger", 5, 0.30);
  driveToPhase(n, well, "discharge", 0.30);
  X.collideSkimmer(state, well);
  if (state.skimmer.dead) neighbourDeaths++;
}
H.eq(neighbourDeaths, 0,
     "⛔ a craft one lane away from a discharging Surger does not die — the discharge " +
     "is a lane, not a blast radius");

// ---------------------------------------------------------------------------
// ⛔ ONE LANE, NEVER HOPS — the STRONG form (GDD 6.1, 3.5)
// ---------------------------------------------------------------------------
//
// It touches no lane helper, so exact equality is available and is both
// stronger and simpler than a per-step speed bound. This is what lets CS005
// P5's soak put the Surger in with the Carrier, the Weaver, the bolt and the
// Thorn rather than giving it a bound of its own.
let laneFail = null, sweepRuns = 0;
for (const w of WELLS) {
  for (const lane of [0, 1, Math.floor(w.lanes / 2), w.lanes - 1]) {
    const d = loose(lane, 0, -1);
    drive(d, w, 700, (before, e) => {
      if (!Object.is(e.lane, lane)) laneFail = `${w.name}: lane ${lane} became ${e.lane}`;
    });
    sweepRuns++;
  }
}
H.eq(sweepRuns, WELLS.length * 4, `${sweepRuns} lane runs, every well`);
H.assert(laneFail === null,
         `⛔ lane is Object.is-identical to its spawn lane on every tick, on every ` +
         `well — an ABSENCE of code, not a flag (${laneFail})`);

// ---------------------------------------------------------------------------
// ⛔ ANY SHOT KILLS IT AND IS CONSUMED — in every phase, the discharge included
// ---------------------------------------------------------------------------
//
// The lane being live is a threat to the player standing in it, never armour
// for the thing making it. Driven through the real collideShots().
function shotAt(w, lane, depth) {
  const s = new X.Shot(w, lane);
  s.t = (1 - depth) * C.SHOT_TIME;
  state.shots.push(s);
  return s;
}
for (const phase of ["climb", "telegraph", "discharge"]) {
  well = useWell(0);
  state.skimmer.lane = 12;                  // trap 4 — well out of the lane
  const d = X.spawnEnemy("surger", 4, 0.40);
  driveToPhase(d, well, phase, 0.40);
  H.eq(d.phase, phase, `a ${phase} Surger is on the board`);
  const hit = shotAt(well, 4, d.depth);
  X.collideShots(state, well);
  H.eq(d.dead, true, `⛔ any shot kills a ${phase} Surger`);
  H.eq(hit.dead, true, "and the shot is spent — one shot, one Surger");
}

// ⛔ The Purge kills it in every phase too, and that needs no code: `purgeable`
// is inherited true and updatePurge() sets `dead` directly, never asking
// onShot() (⚠ SETTLED, and it works by omission).
for (const phase of ["climb", "telegraph", "discharge"]) {
  well = useWell(0);
  state.skimmer.lane = 12;
  const d = X.spawnEnemy("surger", 4, 0.40);
  driveToPhase(d, well, phase, 0.40);
  state.purgeLatched = false;
  state.input.purge = true;
  X.updatePurge(state);
  H.eq(d.dead, true, `⛔ the Purge kills a ${phase} Surger`);
}

// ⛔ It blocks the clear: a well with a spent quota and a live Surger in it is
// not clear, which is what stops a player waiting one out.
well = useWell(0);
H.eq(X.wellCleared(state), true, "an empty well with a spent quota is clear");
X.spawnEnemy("surger", 4, 0.2);
H.eq(X.wellCleared(state), false, "⛔ and a Surger in it is not — blocksClear is true");

// ---------------------------------------------------------------------------
// ⛔ IT SPAWNS NOTHING, EVER, and reads no topology (GDD 3.5)
// ---------------------------------------------------------------------------

well = useWell(0);
state.skimmer.lane = 12;
const solo = X.spawnEnemy("surger", 4, 0);
for (let i = 0; i < 1800; i++) {
  state.lives = C.START_LIVES;
  G.update(DT);
}
H.assert(state.enemies.every(e => e === solo || e.dead === true),
         "⛔ thirty seconds with one Surger on a spent quota adds nothing to the board");
H.eq(state.enemies.filter(e => e instanceof X.Surger).length, 1, "and there is still exactly one");

// Asserted against the BUILT file, because that is the behaviour oracle and
// there is no behavioural way to prove an absence. ⚠ Line comments are dropped
// first, and only line comments — the class's own header names laneHop and the
// spawner in prose. ⛔ Do not grow this into a general comment stripper
// (_harness.js's header says why).
function codeOf(marker) {
  const start = SCRIPT.indexOf(marker);
  H.assert(start > 0, `the built file carries ${marker}`);
  const body = SCRIPT.slice(start, SCRIPT.indexOf("\n}\n", start));
  return body.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n");
}
const clsCode = codeOf("class Surger extends Enemy {");
H.assert(clsCode.indexOf("onShot") > 0 && clsCode.length > 500, "the stripped slice is the class");
H.assert(!/laneHop|laneDelta|laneNormalize|boundaryFrom|laneBoundary/.test(clsCode),
         "⛔ the Surger touches no lane helper at all");
H.assert(!/\.closed\b/.test(clsCode), "⛔ and reads no well's topology");
H.assert(!/spawnEnemy/.test(clsCode), "⛔ and never reaches for the spawner");

// ---------------------------------------------------------------------------
// ⛔ THE SILHOUETTE (GDD 6.1, 10.2, 18 item 3) — an OPEN path of square corners
// ---------------------------------------------------------------------------

const POLY = X.SURGER_POLY;
H.assert(Array.isArray(POLY) && POLY.length >= 6, "SURGER_POLY is a local-space point array");
H.assert(POLY.every(q => isFinite(q.l) && isFinite(q.d)),
         "⛔ in (l, d) — lane offset and depth offset, never a screen coordinate");
H.eq(POLY.reduce((m, q) => Math.max(m, Math.abs(q.l)), 0), 1,
     "it reaches ±1, so C.SURGER_SIZE is the lane widths it spans");
let notSquare = null;
for (let i = 1; i < POLY.length; i++) {
  const a = POLY[i - 1], b = POLY[i];
  if (a.l !== b.l && a.d !== b.d) notSquare = `${i}: (${a.l},${a.d}) -> (${b.l},${b.d})`;
}
H.assert(notSquare === null,
         `⛔ EVERY CORNER IS SQUARE — each segment holds either l or d, which is the ` +
         `divergence GDD 18 item 3 requires from a diagonal lightning rod (${notSquare})`);
let turns = 0;
for (let i = 1; i < POLY.length; i++) if (POLY[i].d !== POLY[i - 1].d) turns++;
H.assert(turns >= 4, `and it really zigzags — ${turns} crossings of the bar's axis`);
H.assert(POLY !== X.VAULTER_POLY && POLY !== X.WEAVER_POLY && POLY !== X.DRIFTER_POLY_CROSS,
         "⛔ its own shape, shared with nothing");

// ⛔ No per-frame allocation: entityPoints memoizes a scratch array PER POLY.
const ptsA = X.entityPoints(WELLS[0], 4, 0.5, POLY, C.SURGER_SIZE);
const ptsB = X.entityPoints(WELLS[0], 6, 0.7, POLY, C.SURGER_SIZE);
H.assert(ptsA === ptsB, "the bar reuses one scratch array");
H.assert(ptsA !== X.entityPoints(WELLS[0], 4, 0.5, X.VAULTER_POLY, C.VAULTER_SIZE),
         "and it is not the Vaulter's");

// ---------------------------------------------------------------------------
// ⛔ THE FUSE (GDD 6.3, 10.2, 10.3) — a segment ALONG the lane, entity-drawn
// ---------------------------------------------------------------------------

// The real draw path, recorded off the canvas context (trap 6).
function record(fn) {
  const ctx = X._env.canvas.getContext("2d");
  const prev = { close: ctx.closePath, stroke: ctx.stroke, move: ctx.moveTo, line: ctx.lineTo };
  const log = { closes: 0, pts: [], strokes: [] };
  ctx.closePath = () => { log.closes++; };
  ctx.moveTo = (x, y) => { log.pts.push({ x, y, move: true }); };
  ctx.lineTo = (x, y) => { log.pts.push({ x, y, move: false }); };
  ctx.stroke = () => { log.strokes.push({ w: ctx.lineWidth, a: ctx.globalAlpha, c: ctx.strokeStyle }); };
  try { fn(ctx); } finally {
    ctx.closePath = prev.close; ctx.stroke = prev.stroke;
    ctx.moveTo = prev.move; ctx.lineTo = prev.line;
  }
  return log;
}
const at = (w, lane, depth) => { const o = { x: 0, y: 0 }; X.screenPos(w, lane, depth, o); return o; };

well = WELLS[0];
let log = record(ctx => X.drawSurgeLane(ctx, well, 3, 0, false));
H.eq(log.strokes.length, 0,
     "⛔ a zero-length fuse draws nothing — the first step of a telegraph, and drawing " +
     "it would be a zero-length path (drawThorn's rule)");

log = record(ctx => X.drawSurgeLane(ctx, well, 3, 0.4, false));
H.eq(log.pts.length, 2, "the fuse is one two-point segment");
H.eq(log.closes, 0, "open, like every segment in this build");
H.close(log.pts[0].x, at(well, 3, 0).x, 1e-9, "⛔ ROOTED AT THE THROAT — x");
H.close(log.pts[0].y, at(well, 3, 0).y, 1e-9, "and y");
H.close(log.pts[1].x, at(well, 3, 0.4).x, 1e-9, "⛔ with the TIP at the charge's depth — x");
H.close(log.pts[1].y, at(well, 3, 0.4).y, 1e-9, "and y");

// ⛔ THE TIP ADVANCES TOWARD THE RIM ACROSS C.SURGE_TELEGRAPH. What the player
// has to see is the charge TRAVELLING UP THE LANE AT THEM, not a lane that
// merely gets brighter — a uniform glow says nothing about how long they have.
const fuse = loose(3, 0.2, 1);
driveToPhase(fuse, well, "telegraph", 0.2);
const tips = [];
while (fuse.phase === "telegraph") {
  tips.push(fuse.chargeTip());
  fuse.depth = 0.2;
  fuse.update(DT, well, state);
}
H.assert(tips.length > 20, `the fuse was sampled across the whole telegraph (${tips.length} steps)`);
H.eq(tips[0], 0, "it starts at the throat with no length");
H.assert(tips.every((t, i) => i === 0 || t > tips[i - 1]), "⛔ and grows on every step");
H.assert(tips[tips.length - 1] > 0.9 && tips[tips.length - 1] <= 1,
         `⛔ reaching the rim as the fuse ends (${tips[tips.length - 1]})`);
H.eq(fuse.phase, "discharge", "and the step it reaches the rim is the step the lane goes live");
H.eq(fuse.chargeTip(), 1, "⛔ the discharge lights the WHOLE lane");

// ⛔ FULL ALPHA AT EVERY DEPTH, INCLUDING INSIDE THE THROAT ZONE. GDD 10.3
// governs what may be drawn OVER that zone; a telegraph is not drawn over the
// well, it IS lane geometry. ⛔ MUTATION CHECK for shotAlpha() being applied to
// it: a fuse invisible for its first third is not a fuse.
const deep = record(ctx => X.drawSurgeLane(ctx, well, 3, 0.05, false));
H.eq(deep.strokes.length, 2, "glowStroke's two passes, wide-and-dim then thin-and-bright");
H.close(deep.strokes[1].a, C.GLOW_THIN_ALPHA, EPS,
        "⛔ a fuse 0.05 deep — well inside C.READABILITY_DEPTH — is at FULL alpha");
H.assert(deep.strokes.every(k2 => k2.c === C.SURGER_COLOR), "in C.SURGER_COLOR");

// ⛔ THE WIDTH IS THE STATE CHANGE, and it is a per-entity multiplier on
// laneLineWidth() — never a global glow constant. The fuse creeps up at plain
// lane weight; the discharge slams the whole lane to C.SURGE_LIT_WIDTH.
const fuseFull = record(ctx => X.drawSurgeLane(ctx, well, 3, 1, false));
const liveLane = record(ctx => X.drawSurgeLane(ctx, well, 3, 1, true));
H.close(fuseFull.strokes[1].w, X.laneLineWidth(0.5), EPS,
        "the fuse takes its MIDPOINT's lane weight, as drawThorn's body does");
H.close(liveLane.strokes[1].w, X.laneLineWidth(0.5) * C.SURGE_LIT_WIDTH, EPS,
        "and the live lane is that x C.SURGE_LIT_WIDTH");
H.assert(liveLane.strokes[1].w / fuseFull.strokes[1].w >= 2.0,
         "⛔ measured through the real draw path, the live lane is at least 2x the fuse — " +
         "the fuse reaching the rim and the lane going live are the same instant, so the " +
         "width jump is what says WHICH instant it was");
H.eq(C.GLOW_WIDE_W, 6.0, "⛔ and no global glow constant moved: GLOW_WIDE_W");
H.eq(C.GLOW_WIDE_ALPHA, 0.20, "GLOW_WIDE_ALPHA");
H.eq(C.GLOW_THIN_ALPHA, 0.95, "GLOW_THIN_ALPHA");

// ⛔ ITS OWN SCRATCH POINTS, NOT THE THORN'S. Both can be live in the same lane
// in the same frame. There is no behavioural way to catch sharing — drawPoly
// issues its moveTo/lineTo before the next caller writes — so this is asserted
// against the built text, like the topology check above.
const fuseCode = codeOf("function drawSurgeLane(");
H.assert(/_surge/.test(fuseCode), "the fuse uses its own preallocated scratch");
H.assert(!/_thorn/.test(fuseCode),
         "⛔ and never the Thorn's — sharing module scratch between two segment drawers " +
         "would show up as one of them drawn at the other's length, intermittently");
H.assert(!/\[\s*_/.test(fuseCode),
         "⛔ and the point PAIR is preallocated too — drawPoly(ctx, [a, b]) allocates an " +
         "array literal every call, in a path with up to C.ENEMY_CAP entities in it");

// ⛔ THE TELEGRAPH IS NOT drawWell()'s laneState. Game.draw() still passes null,
// and isLaneLit() is a boolean over spokes that could not express a progressive
// fill anyway. Wiring it is CS006's, with the dim band.
H.assert(/drawWell\(ctx, well, state\.level, null, 0\)/.test(SCRIPT),
         "⛔ drawWell's laneState parameter is still unwired");

// The entity's own draw: the lane goes down first, then the bar on top of it.
well = useWell(0);
state.skimmer.lane = 12;
const shown = X.spawnEnemy("surger", 4, 0.5);
const climbLog = record(ctx => shown.draw(ctx, well));
H.eq(climbLog.closes, 0, "⛔ the bar is an OPEN path — no closePath (GDD 10.2)");
H.eq(climbLog.pts.length, POLY.length, "a climbing Surger draws the bar and nothing else");
H.eq(climbLog.strokes.length, 2, "one glowStroke, two passes");

driveToPhase(shown, well, "discharge", 0.5);
const liveLog = record(ctx => shown.draw(ctx, well));
H.eq(liveLog.pts.length, POLY.length + 2, "a discharging one draws its lane as well");
H.assert(liveLog.pts[0].move === true && liveLog.pts[2].move === true,
         "two separate paths, not one scribble joining the lane to the bar");
H.close(liveLog.pts[0].x, at(well, 4, 0).x, 1e-9,
        "⛔ and the LANE is drawn first, so the silhouette sits on top of its own charge — " +
        "a fuse drawn over it at C.SURGE_LIT_WIDTH would swallow it when it matters most");
H.eq(liveLog.strokes.length, 4, "two glowStrokes, two passes each");

// Both states run headless on a closed and an open well, at every depth.
let drew = 0;
for (const w of [WELLS[0], WELLS.filter(x => !x.closed)[0]]) {
  for (const tip of [0, 0.3, 1]) {
    for (const isLive of [true, false]) {
      for (const depth of [0, 0.2, 0.5, 1]) {
        const l = record(ctx => X.drawSurger(ctx, w, 3, depth, tip, isLive));
        if (l.strokes.every(st => isFinite(st.w)) && l.pts.every(p => isFinite(p.x) && isFinite(p.y))) {
          drew++;
        }
      }
    }
  }
}
H.eq(drew, 48, "the bar and every fuse state project on both topologies with no NaN");

// ---------------------------------------------------------------------------
// the debug bench key P2 left dark (GDD 9.5) — ⚠ TEMPORARY
// ---------------------------------------------------------------------------

useWell(0);
H.eq(state.enemies.length, 0, "the bench case starts on an empty board");
G.input.keyDown("6");
H.eq(state.enemies.length, 0,
     "⛔ a keydown spawns nothing at event time — named actions are dispatched inside sample()");
G.update(DT);
G.input.keyUp("6");
H.eq(state.enemies.length, 1, "⚠ pressing 6 puts exactly one entity on the board");
H.assert(state.enemies[0] instanceof X.Surger, "and it is a Surger");

// ⛔ C.DEBUG_SPAWN_KINDS is a bench, never a difficulty knob: it still ships as
// one entry, so a played build is still a Vaulter build until GDD 8.1 lands.
H.assert(JSON.stringify(C.DEBUG_SPAWN_KINDS) === JSON.stringify(["vaulter"]),
         "⛔ the shipped spawn list is untouched by this phase");

// …and the interval spawner releases Surgers when a test asks it to, through
// the one entry point, with the run's one stream deciding the lane.
const savedKinds = C.DEBUG_SPAWN_KINDS;
C.DEBUG_SPAWN_KINDS = ["surger"];
useWell(7);                                  // Vee, open, 13 lanes
state.spawn.remaining = C.SPAWN_QUOTA;
for (let i = 0; i < 1800; i++) {
  state.lives = C.START_LIVES;
  G.update(DT);
}
C.DEBUG_SPAWN_KINDS = savedKinds;
H.assert(JSON.stringify(C.DEBUG_SPAWN_KINDS) === JSON.stringify(["vaulter"]),
         "the fixture put the shipped list back");
H.assert(state.time > 0, "thirty seconds of a Surger-only well ran without throwing");

H.report("test-cs005-p3.js");

// Drive one entity and hand every step to `visit`. Hoisted, so the cases above
// read in the order they matter rather than in declaration order.
function drive(d, well, steps, visit) {
  for (let i = 0; i < steps; i++) {
    const before = { lane: d.lane, depth: d.depth, phase: d.phase, timer: d.surgeTimer };
    d.update(DT, well, state);
    if (visit) visit(before, d, i);
  }
}
