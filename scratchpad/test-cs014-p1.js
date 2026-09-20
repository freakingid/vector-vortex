// test-cs014-p1.js — CS014 P1: the ring flight (GDD 4.4, 4.5, 5, 6.5, 7, 13,
// 14.4, 14.5, 16.3, 17 items 1 and 8, 19; PLANNED-FEATURES-CS014.md RF1–RF6,
// RF9, R1–R11). Asserts what P1 owns: the gate in C.MODE_FLAGS' rows, the two
// hard caps' first readers, the ring set as data on state.dive, the take pass
// as a lane match inside a depth crossing, and RF4's unmultiplied payout —
// plus ⛔ CLASSIC AS A TOTAL NO-OP, proved as a step-by-step hash, and ⚠ RF6's
// ONE-LINE CUT. Makes no claim about a visual or a sound: both are P2's.
//
// ⛔ TRAPS.
//  1. A step COUNT is never asserted — 1/60 is not binary (STATUS.md). The
//     beat is asserted as a property of dive.timer against diveTime().
//  2. `instanceof` and every constant are PER BUILD: helpers take the build.
//  3. A mutant is proved to be in the build exactly once BEFORE it is asserted
//     red; a mutation that throws otherwise reads as a pass (STATUS.md).
//  4. A ring at depth d is resolved on the first step the descent reaches d,
//     so a fixture that jumps dive.depth past a ring never resolves it — drive
//     the beat, never the field.
//  5. startDive() re-lays the set, so a snapshot taken across a repeat is of
//     objects the array no longer holds.
"use strict";

const fs = require("fs");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260920;
installSeed(SEED);                          // ⛔ above the first buildGame()
const SPIES = ["addScore", "comboKill", "dropToken", "sfx"];
const X = H.buildGame({ spy: SPIES });
const C = X.C, G = X.Game, state = X.state, DT = C.FIXED_DT;
const J = JSON.stringify;
const SCRIPT = H.extractScript(fs.readFileSync(path.join(__dirname, "..", "dist", "vector-vortex.html"), "utf8"));

const RING = X.WELLS[0], FAN = X.WELLS[14];
H.assert(RING.closed && RING.lanes === 16, "fixture: WELLS[0] is the closed 16-lane Ring");
H.assert(!FAN.closed, "fixture: WELLS[14] is an OPEN well");

// A cleared well, a craft on the rim, nothing alive. `enterWell()` has already
// called resetDive(), so the set is empty here in either mode.
function board(mode, level, wellIndex, Z) {
  const Y = Z || X;
  Y.Game.reset();
  Y.startGame(SEED, { mode: mode, startDepth: 1 });
  Y.state.level = level;
  Y.state.wellIndex = wellIndex === undefined ? (level - 1) % Y.WELLS.length : wellIndex;
  Y.enterWell();
  Y.state.spawn.remaining = 0;
  Y.state.enemies = [];
  Y.state.shots = [];
  Y.state.invulnTime = Y.C.RESPAWN_INVULN;
  Y.Game.input.reset();
  return Y.WELLS[Y.state.wellIndex];
}

// The score a thunk spends, through the real addScore().
function delta(fn, Z) {
  const Y = Z || X;
  const s0 = Y.state.score;
  fn();
  return Y.state.score - s0;
}

// ---------------------------------------------------------------------------
// 1. ⛔ THE GATE (RF6, R2) — A FIELD IN THE ROWS, NEVER A TOP-LEVEL KEY
// ---------------------------------------------------------------------------
//
// test-cs013-p1.js:60 owns "a field in the rows" and is repaired in place; what
// is asserted here is P1's own half — the flag exists, reads per mode, and is
// what the whole feature hangs off.
H.eq(C.MODE_FLAGS.classic.rings, false, "⛔ Classic's row: rings false");
H.eq(C.MODE_FLAGS.overdrive.rings, true, "⛔ Overdrive's row: rings true");
H.eq(X.modeHas("rings", "classic"), false, 'modeHas("rings", "classic") is false');
H.eq(X.modeHas("rings", "overdrive"), true, 'modeHas("rings", "overdrive") is true');
board("overdrive", 5);
H.eq(X.modeHas("rings"), true, "⛔ the mode argument defaults to state.mode (an Overdrive run)");
board("classic", 5);
H.eq(X.modeHas("rings"), false, "and on a Classic run it reads false");

// ---------------------------------------------------------------------------
// 2. ⛔ THE CONSTANTS (R11) — EVERY VALUE IN C, NO MAGIC NUMBER IN 11-dive.js
// ---------------------------------------------------------------------------
for (const [k, v] of [["DIVE_TIME", 2.6], ["DIVE_GRACE", 0.35],
                      ["DIVE_TIME_OD", 4.0], ["DIVE_RINGS_MAX", 6],
                      ["RING_POINTS", 100], ["RING_ARC_LANES", 1.5], ["RING_LANE_STEP", 0.25]]) {
  H.eq(C[k], v, `C.${k} is ${v}`);
}
// ⛔ R1: no Classic constant moved. The two above it are GDD 14.5's hard caps.
H.assert(C.DIVE_TIME_OD > C.DIVE_TIME, "⛔ an Overdrive dive is the longer one");
H.assert(C.DIVE_GRACE > 0 && C.DIVE_GRACE < C.DIVE_TIME,
         "⛔ the grace beat is a slice off the FRONT of whichever total is in force (RF9)");
{
  // ⛔ NO MAGIC NUMBER REACHES THE THREE NEW FUNCTIONS. Every numeric literal
  // in their bodies has to be structural arithmetic — 0, 0.5, 1 — rather than
  // a tunable; a tunable lives in C (CLAUDE.md, Config).
  const fnText = n => {
    const at = SCRIPT.indexOf(`\nfunction ${n}(`);
    H.assert(at >= 0, `fixture: ${n}() is in the build`);
    return SCRIPT.slice(at, SCRIPT.indexOf("\n}\n", at)).replace(/\/\/.*$/gm, "");
  };
  const bodies = ["diveTime", "layRings", "takeRings"].map(fnText).join("\n");
  const nums = (bodies.match(/(?<![\w.$])\d+(?:\.\d+)?/g) || []).filter(v => v !== "0" && v !== "1" && v !== "0.5");
  H.eq(J(nums), J([]), `⛔ the ring flight's three functions carry no tunable literal (found ${J(nums)})`);
  H.assert(/C\.RING_POINTS/.test(bodies) && /C\.RING_ARC_LANES/.test(bodies) &&
           /C\.RING_LANE_STEP/.test(bodies) && /C\.DIVE_RINGS_MAX/.test(bodies) &&
           /C\.DIVE_TIME_OD/.test(bodies),
           "⛔ and every value they use is read off C");
  // ⛔ R6: the ring flight reads the level nowhere, and spends no draw (R3).
  H.assert(!/\bheat\w*\(/.test(bodies), "⛔ R6: no heat accessor and no heat() call");
  H.assert(!/state\.level|\.rng\b|Math\s*\.\s*random/.test(bodies),
           "⛔ R3, R6: no RNG draw and no read of state.level — the lattice is the WELL and constants");
}

// ---------------------------------------------------------------------------
// 3. ⛔ THE SET (RF1, RF3) — ON state.dive, LAID BY startDive(), ITS ONE WAY IN
// ---------------------------------------------------------------------------
H.assert(!("rings" in state),
         "⛔ RF1: a ring set is NOT a third top-level array — no state.rings, so test-registry.js is unmoved");
H.assert(Array.isArray(state.dive.rings), "⛔ it is a field on state.dive, which resetDive() already owns");
H.assert(!("ring" in X.ENEMY_KINDS) && !("diveRing" in X.ENEMY_KINDS),
         "⛔ and a ring is not an enemy: no ENEMY_KINDS row (RF1, GDD 6.5)");

// ---- the lattice, on a closed well ------------------------------------------
{
  const well = board("overdrive", 5, 0);
  H.eq(state.dive.rings.length, 0, "⛔ no ring exists outside a dive — enterWell() -> resetDive() emptied it");
  X.startDive(state);
  const r = state.dive.rings;
  H.eq(r.length, C.DIVE_RINGS_MAX, "⛔ startDive() lays exactly C.DIVE_RINGS_MAX rings (RF3)");
  const n = C.DIVE_RINGS_MAX;
  const wantDepths = [];
  for (let i = 0; i < n; i++) wantDepths.push((n - i - 0.5) / n);
  H.eq(J(r.map(x => x.depth)), J(wantDepths),
       "⛔ at the midpoints of C.DIVE_RINGS_MAX equal slices, in CROSSING order — rim first");
  H.assert(r.every(x => x.depth > 0 && x.depth < 1),
           "⛔ every ring depth is strictly inside (0, 1) — which is why the grace beat resolves none");
  H.eq(J(r.map(x => x.taken)), J(new Array(n).fill(null)),
       "⛔ and every one is born PENDING — null, not false: a miss is a decision, not a default");
  // ⛔ THE WALK IS laneHop()'s, THE BUILD'S ONE WALL HELPER. Re-derived here
  // from the exported helper rather than from a copy of the arithmetic.
  const step = C.RING_LANE_STEP * well.lanes;
  let lane = 0, dir = 1, want = [];
  for (let i = 0; i < n; i++) { want.push(lane); const h = X.laneHop(well, lane, step, dir); lane = h.lane; dir = h.dir; }
  H.eq(J(r.map(x => x.lane)), J(want), "⛔ the arc centres walk through laneHop() (GDD 3.5)");
  H.assert(new Set(r.map(x => x.lane)).size > 1, "non-vacuity: the walk actually moves");
}

// ---- and on an OPEN well it folds rather than piling on the wall -------------
{
  const well = board("overdrive", 5, 14);
  X.startDive(state);
  const r = state.dive.rings;
  H.eq(r.length, C.DIVE_RINGS_MAX, "the open-well set is laid too");
  H.assert(r.every(x => x.lane >= 0 && x.lane <= well.lanes - 1),
           `⛔ GDD 3.5: no ring lane leaves [0, ${well.lanes - 1}] on an open well (${J(r.map(x => x.lane))})`);
  const onWall = r.filter(x => x.lane === well.lanes - 1 || x.lane === 0).length;
  H.assert(onWall < C.DIVE_RINGS_MAX - 1,
           `⛔ and the walk FOLDS rather than clamping — a clamp would pile the tail on one wall (${onWall} on a wall)`);
}

// ---- Classic lays nothing, in either direction ------------------------------
{
  board("classic", 5, 0);
  X.startDive(state);
  H.eq(state.dive.rings.length, 0, "⛔ CLASSIC LAYS NOTHING — layRings() is a no-op outside modeHas(\"rings\")");
  H.assert(state.dive.active, "fixture: a Classic dive really did start");
}

// ---- resetDive() empties it, and a REPEAT re-lays it (RF3) ------------------
{
  board("overdrive", 5, 0);
  X.startDive(state);
  H.assert(state.dive.rings.length > 0, "fixture: a set is on the board");
  X.resetDive(state);
  H.eq(state.dive.rings.length, 0, "⛔ resetDive() empties the set — the one writer outside updateDive()");
}
{
  const well = board("overdrive", 5, 14);
  // A fully-thorned well, so the repeat goes through the termination guarantee.
  for (let i = 0; i < well.lanes; i++) { const t = X.spawnEnemy("thorn", i, 0); t.depth = C.THORN_MAX; }
  X.startDive(state);
  const first = state.dive.rings.slice();
  first[0].taken = true;                       // stage one resolved
  state.skimmer.dead = true;
  X.diveRespawn(state, well);
  H.eq(state.dive.rings.length, C.DIVE_RINGS_MAX,
       "⛔ A REPEATED DIVE RE-LAYS THE SET (RF3) — GDD 5's 'it repeats the dive, not the well'");
  H.eq(J(state.dive.rings.map(x => x.taken)), J(new Array(C.DIVE_RINGS_MAX).fill(null)),
       "⛔ and every ring is pending again, so the set can be earned again");
  H.assert(state.dive.rings[0] !== first[0], "trap 5: they are new objects, not the old ones reset");
}

// ---------------------------------------------------------------------------
// 4. ⛔ THE BEAT (RF9) — C.DIVE_TIME_OD IS READ EXACTLY AS C.DIVE_TIME IS
// ---------------------------------------------------------------------------
//
// ⛔ Trap 1: asserted as a PROPERTY of the clock, never as a step count.
function diveRun(mode, wellIndex, lane) {
  const well = board(mode, 5, wellIndex);
  if (lane !== undefined) state.skimmer.lane = lane;
  X.startDive(state);
  const lvl = state.level;
  let steps = 0, lastTimer = 0, graceDepthOut = 0, depthOut = 0, score0 = state.score;
  // ⛔ THE SET IS SNAPSHOT EACH STEP. The dive's END is nextWell() ->
  // enterWell() -> resetDive(), which empties it on the same step it completes,
  // so a snapshot taken afterwards is always empty (test-cs006-p3.js's trap 5,
  // the same shape).
  let rings = [];
  const cap = Math.ceil(10 / DT);
  while (state.dive.active && steps < cap) {
    rings = state.dive.rings.slice();
    X.updateDive(state, well, DT);
    steps++;
    if (!state.dive.active) break;
    lastTimer = state.dive.timer;
    if (state.dive.phase === "grace" && state.dive.depth !== 1) graceDepthOut++;
    if (!(state.dive.depth >= 0 && state.dive.depth <= 1)) depthOut++;
  }
  return { well, steps, lastTimer, graceDepthOut, depthOut, advanced: state.level === lvl + 1,
           paid: state.score - score0, rings: rings };
}
{
  const od = diveRun("overdrive", 0, 0);
  H.assert(od.advanced, "fixture: the Overdrive dive completed and advanced the level");
  H.assert(od.lastTimer < C.DIVE_TIME_OD && od.lastTimer >= C.DIVE_TIME_OD - DT,
           `⛔ an Overdrive dive runs to C.DIVE_TIME_OD and no longer (last observable timer ${od.lastTimer})`);
  H.assert(od.lastTimer > C.DIVE_TIME,
           "⛔ and it is LONGER than a Classic one — C.DIVE_TIME_OD is in force, not C.DIVE_TIME");
  H.eq(od.graceDepthOut, 0, "⛔ the grace beat still holds dive.depth at 1 (GDD 5)");
  H.eq(od.depthOut, 0, "and dive.depth never leaves [0, 1]");

  const cl = diveRun("classic", 0, 0);
  H.assert(cl.advanced, "fixture: the Classic dive completed");
  H.assert(cl.lastTimer < C.DIVE_TIME && cl.lastTimer >= C.DIVE_TIME - DT,
           `⛔ a CLASSIC dive is still exactly C.DIVE_TIME long (R1; last observable timer ${cl.lastTimer})`);
  H.assert(od.steps > cl.steps, `non-vacuity: the two beats differ (${od.steps} against ${cl.steps} steps)`);
}

// ---------------------------------------------------------------------------
// 5. ⛔ THE TAKE PASS (RF2) — A LANE MATCH INSIDE A DEPTH CROSSING
// ---------------------------------------------------------------------------
//
// ⛔ Trap 4: the beat is driven, never dive.depth written.
{
  const od = diveRun("overdrive", 0, 0);        // parked at lane 0 for the whole flight
  H.eq(od.rings.length, C.DIVE_RINGS_MAX, "fixture: the set survived to the end of the flight");
  H.assert(od.rings.every(x => x.taken !== null),
           `⛔ EVERY RING IS RESOLVED BY THE END OF THE DESCENT — the last step is at depth 0, which is ` +
           `at or past every ring (${J(od.rings.map(x => x.taken))})`);
  const took = od.rings.filter(x => x.taken).length, missed = od.rings.length - took;
  H.assert(took > 0, `non-vacuity: a parked diver TOOK rings (${took})`);
  H.assert(missed > 0, `⛔ AND MISSED OTHERS — "you stop earning" has something to attach to (${missed})`);
  // ⛔ THE TAKE IS THE ARC, read through laneDelta — the build's one idea of
  // lane distance, exactly as laneHit() reads it against C.HIT_LANE_TOL.
  for (const r of od.rings) {
    const inside = Math.abs(X.laneDelta(od.well, r.lane, 0)) <= C.RING_ARC_LANES;
    H.eq(r.taken, inside, `⛔ ring at lane ${r.lane}: taken iff the craft was inside its arc`);
  }
  H.eq(od.paid, took * C.RING_POINTS, "⛔ and the flight paid exactly C.RING_POINTS per taken ring");
}
// ---- a ring the craft leaves before the crossing is MISSED, for good --------
{
  const well = board("overdrive", 5, 0);
  X.startDive(state);
  const r0 = state.dive.rings[0];
  state.skimmer.lane = r0.lane;                 // inside the first arc
  const far = X.laneNormalize(well, r0.lane + well.lanes / 2);
  let steps = 0;
  // Step to just before the first crossing, then leave.
  while (state.dive.depth > r0.depth && steps < 600) { X.updateDive(state, well, DT); steps++; }
  H.eq(r0.taken, true, "fixture: the first ring was taken from inside its arc");
  const after = delta(() => {
    state.skimmer.lane = far;
    for (let i = 0; i < 30; i++) X.updateDive(state, well, DT);
    state.skimmer.lane = r0.lane;
    for (let i = 0; i < 30 && state.dive.active; i++) X.updateDive(state, well, DT);
  });
  H.eq(r0.taken, true, "⛔ A RESOLVED RING NEVER MOVES AGAIN — it cannot be re-taken for a second payout");
  H.assert(state.dive.rings.filter(x => x.taken === false).length > 0,
           "⛔ and a ring crossed from outside its arc is MISSED, not still available lower down");
  H.assert(after >= 0, "the second half of the flight scored only rings");
}
// ---- the GRACE beat resolves nothing -----------------------------------------
{
  const well = board("overdrive", 5, 0);
  X.startDive(state);
  const paid = delta(() => {
    while (state.dive.phase === "grace" && state.dive.timer < C.DIVE_GRACE) X.updateDive(state, well, DT);
  });
  H.eq(paid, 0, "⛔ the grace beat pays nothing — every ring depth is strictly below 1 (GDD 5's input opportunity)");
}

// ---------------------------------------------------------------------------
// 6. ⛔ THE SCORE PATH (RF4, plan §8) — THE BOUNTY'S ROW, NOT AN ENTITY PRICE
// ---------------------------------------------------------------------------
{
  const well = board("overdrive", 5, 0);
  // ⛔ A LIVE MULTIPLIER: a ring taken at ×N still pays the flat literal.
  for (let i = 0; i < 4 * C.COMBO_KILLS_PER_STEP; i++) X.comboKill(state);
  H.assert(X.comboMult() > 1, `fixture: the multiplier is ×${X.comboMult()}`);
  const mult = X.comboMult(), builds0 = X.comboKill.calls, rolls0 = X.dropToken.calls;
  const kills0 = state.tally.kills, sfx0 = X.sfx.calls;
  const kinds = [];
  X.sfx.before = function (name) { kinds.push(name); };
  X.startDive(state);
  state.skimmer.lane = state.dive.rings[0].lane;
  const paid = delta(() => { for (let i = 0; i < 60; i++) X.updateDive(state, well, DT); });
  X.sfx.before = null;
  H.eq(paid, C.RING_POINTS, "⛔ A RING PAYS C.RING_POINTS, UNMULTIPLIED — at ×" + mult);
  H.eq(state.dive.rings[0].taken, true, "fixture: it was the first ring that paid");
  H.eq(X.comboKill.calls, builds0, "⛔ and it BUILDS NOTHING — no comboKill() (GDD 7, O4)");
  H.eq(X.comboMult(), mult, "⛔ the multiplier is exactly where it was");
  H.eq(X.dropToken.calls, rolls0, "⛔ and ROLLS NOTHING — no dropToken(), so no draw and no token (CS013 T2, T5)");
  H.eq(state.tally.kills, kills0, "⛔ and it is not a kill: tally.kills is unmoved");
  H.eq(kinds.indexOf("kill"), -1, `⛔ and no kill sound — a ring is not a kill site (${J(kinds)})`);
  H.assert(X.sfx.calls === sfx0 + kinds.length, "fixture: the seat spy saw every call");
}
// ---- ⛔ addScore() IS UNCHANGED AND STAYS THE ONE LIFE-AWARDER --------------
{
  const well = board("overdrive", 5, 0);
  state.score = state.nextLife - C.RING_POINTS;
  const lives0 = state.lives;
  X.startDive(state);
  state.skimmer.lane = state.dive.rings[0].lane;
  for (let i = 0; i < 60; i++) X.updateDive(state, well, DT);
  H.eq(state.dive.rings[0].taken, true, "fixture: the ring was taken");
  H.eq(state.lives, lives0 + 1,
       "⛔ A RING CAN CROSS AN EXTRA-LIFE MILESTONE, and that is addScore() working — it is unchanged (RF4)");
}
// ---- ⛔ THE FOUR KILL SITES AND FIVE KILL LINES DO NOT MOVE -----------------
{
  const line = 'addScore(e.points() * comboMult()); comboKill(state); dropToken(state, e); sfx("kill", e.sfxVoice);';
  H.eq(SCRIPT.split(line).length - 1, 4,
       "⛔ four of the five kill lines are still the shared text, verbatim (GDD 7; 09-collision.js)");
  H.assert(SCRIPT.indexOf("addScore(victim.points() * comboMult()); comboKill(state); dropToken(state, victim);") !== -1,
           "⛔ and the second Purge use is the fifth");
  // ⛔ REPAIRED IN PLACE, CS014 P2: the ban was `sfx\(`, written before RF8-A's
  // two seats existed. The CLAIM is "no kill site, no kill line, no sfxVoice",
  // and a ring's own cue is none of those — it has no sfxVoice because a ring
  // is not an entity, which is exactly what the narrowed ban still says.
  const dive = SCRIPT.slice(SCRIPT.indexOf("function layRings"), SCRIPT.indexOf("function startDive"));
  H.assert(!/comboKill|dropToken|tally\.kills|sfx\("kill"|sfxVoice/.test(dive.replace(/\/\/.*$/gm, "")),
           "⛔ and the ring flight adds none of them — no kill site, no kill line, no sfxVoice (plan §7)");
  H.eq(SCRIPT.split("    addScore(C.PTS_THORN);").length - 1, 1,
       "⛔ the Thorn's per-chip 5 is still in the build exactly once (test-cs012-p4.js's decoder reads it)");
}
// ---- ⛔ THE DIVE'S TERMINATION KILL STILL PAYS NOTHING (GDD 5, 7) -----------
{
  const well = board("overdrive", 5, 14);
  for (let i = 0; i < well.lanes; i++) { const t = X.spawnEnemy("thorn", i, 0); t.depth = C.THORN_MAX; }
  X.startDive(state);
  state.skimmer.dead = true;
  const kills0 = state.tally.kills, standing = state.enemies.length;
  const paid = delta(() => X.diveRespawn(state, well));
  H.eq(state.enemies.length, standing - 1, "fixture: the struck Thorn died (the termination guarantee)");
  H.eq(paid, 0, "⛔ and it paid NOTHING — the repeat's re-lay is not a payout either");
  H.eq(state.tally.kills, kills0, "and it is not counted as a kill");
}

// ---------------------------------------------------------------------------
// 7. ⛔ THE DIVE STILL SPENDS ZERO RNG DRAWS, IN BOTH MODES (R3)
// ---------------------------------------------------------------------------
{
  function diveDraws(mode, wellIndex) {
    const well = board(mode, 5, wellIndex);
    let draws = 0;
    const base = X.mulberry32(state.seed);
    state.rng = function () { draws++; return base(); };
    X.startDive(state);
    const lvl = state.level;
    let n = 0;
    while (state.level === lvl && n < Math.ceil(10 / DT)) { X.updateDive(state, well, DT); n++; }
    return { draws, advanced: state.level === lvl + 1 };
  }
  const od = diveDraws("overdrive", 0);
  H.assert(od.advanced, "fixture: the counted Overdrive dive completed");
  H.eq(od.draws, 0, "⛔ AN OVERDRIVE RING FLIGHT SPENDS ZERO DRAWS — the lattice is constants and the well (R3)");
  const cl = diveDraws("classic", 0);
  H.assert(cl.advanced, "fixture: the counted Classic dive completed");
  H.eq(cl.draws, 0, "⛔ and a Classic dive still spends zero (test-cs006-p3.js's claim, unmoved)");
}

// ---------------------------------------------------------------------------
// 8. ⛔ RF5 — DEATH CONDITION 5 STAYS LIVE IN BOTH MODES
// ---------------------------------------------------------------------------
{
  for (const mode of ["classic", "overdrive"]) {
    const well = board(mode, 5, 0);
    state.skimmer.lane = 3;
    const t = X.spawnEnemy("thorn", 3, 0);
    t.depth = C.THORN_MAX;
    X.startDive(state);
    const lives0 = state.lives, deaths0 = state.tally.thornDeaths;
    let n = 0;
    while (state.dive.phase === "grace" || (!state.skimmer.dead && n < 60)) { X.updateDive(state, well, DT); n++; }
    H.eq(state.lives, lives0 - 1, `⛔ GDD 4.5 item 5 still costs a life in ${mode.toUpperCase()} (RF5)`);
    H.eq(state.tally.thornDeaths, deaths0 + 1, "and is still counted as a Thorn death");
  }
}
// ---- ⛔ AND THE BUILD'S ONE TWO-DEPTH COMPARISON IS STILL THE STRIKE'S ------
//
// test-cs013-p3.js:737 owns the claim; what is asserted here is P1's own half —
// the take pass compares two POSITIONS, which is ordinary arithmetic, and it
// does not give a second entity a `depth` that is a LENGTH (GDD 6.5's
// `anchored`). ⛔ R10: the Skimmer still has no `depth`.
{
  H.assert(/dive\.depth\s*<=\s*\w+\.depth/.test(SCRIPT),
           "⛔ the dive strike's two-depth comparison is still in the build");
  H.assert(!("depth" in state.skimmer), "⛔ R10: the Skimmer still has no `depth` field");
  const well = board("overdrive", 5, 0);
  X.startDive(state);
  H.assert(state.dive.rings.every(r => !("anchored" in r)),
           "⛔ and a ring carries no `anchored` — its depth is a POSITION, and saying otherwise would be a lie (RF1)");
}

// ---------------------------------------------------------------------------
// 9. ⛔ CLASSIC IS A TOTAL NO-OP — the hash against the ring calls stubbed out
// ---------------------------------------------------------------------------
//
// test-cs009-p6.js's whole-board hasher, unchanged (test-cs012-p5.js's copy).
function makeHasher(Z, extras) {
  const wells = new Map(Z.WELLS.map((w, i) => [w, i]));
  const f64 = new Float64Array(1), u32 = new Uint32Array(f64.buffer);
  let h = 0, seen = null;
  const mixU = v => { h = Math.imul(h ^ v, 16777619) >>> 0; };
  const num = v => { f64[0] = v; mixU(u32[0]); mixU(u32[1]); };
  const str = s => { for (let i = 0; i < s.length; i++) mixU(s.charCodeAt(i)); mixU(0x1f); };
  function walk(v) {
    switch (typeof v) {
      case "number": mixU(1); num(v); return;
      case "string": mixU(2); str(v); return;
      case "boolean": mixU(v ? 3 : 4); return;
      case "undefined": mixU(5); return;
      case "function": return;
    }
    if (v === null) { mixU(6); return; }
    if (wells.has(v)) { mixU(7); num(wells.get(v)); return; }
    if (seen.has(v)) { mixU(8); num(seen.get(v)); return; }
    seen.set(v, seen.size);
    if (Array.isArray(v)) { mixU(9); num(v.length); for (let i = 0; i < v.length; i++) walk(v[i]); return; }
    str(v.constructor ? v.constructor.name : "");
    for (const k of Object.keys(v)) { str(k); walk(v[k]); }
  }
  return function () { h = 2166136261; seen = new Map(); walk(Z.state); walk(extras()); return h; };
}

const HASH_STEPS = 4000;
function session(opts, mode) {
  installSeed(SEED);
  const Z = H.buildGame(opts);
  const ZG = Z.Game, st = Z.state;
  ZG.reset();
  Z.startGame(SEED, { mode: mode, startDepth: 1 });
  const hash = makeHasher(Z, () => [ZG.hitStopLeft, ZG.stats.ticks]);
  const hashes = [];
  ZG.input.keyDown(" ");                    // fire held, so the board plays
  for (let i = 0; i < HASH_STEPS; i++) {
    if (i % 7 === 0) ZG.input.mouseMove(((i * 37) % 181) - 90);
    if (i % 300 === 0) ZG.input.mouseMove((Math.floor(i / 300) % 2) ? 4000 : -4000);
    ZG.update(Z.C.FIXED_DT);
    hashes.push(hash());
  }
  return { hashes, dives: st.tally.divesCompleted, score: st.score, level: st.level };
}
const RING_OUT = { stub: ["layRings", "takeRings"] };
{
  const real = session({}, "classic");
  const stubbed = session(RING_OUT, "classic");
  let first = -1;
  for (let i = 0; i < HASH_STEPS; i++) if (real.hashes[i] !== stubbed.hashes[i]) { first = i; break; }
  H.eq(first, -1,
       `⛔ A CLASSIC SESSION IS BIT-IDENTICAL, STEP BY STEP, to one with layRings() and takeRings() ` +
       `stubbed out — nothing laid, nothing taken, no draw spent (${HASH_STEPS} steps; first divergence ${first})`);
  H.assert(real.dives > 0, `non-vacuity: the Classic session actually dived (${real.dives} dives completed)`);
  H.assert(new Set(real.hashes).size > HASH_STEPS / 2, "non-vacuity: the hash is not constant");
}
// ---- and the stubs really do bite, which is what makes the pair meaningful ---
{
  const real = session({}, "overdrive");
  const stubbed = session(RING_OUT, "overdrive");
  let first = -1;
  for (let i = 0; i < HASH_STEPS; i++) if (real.hashes[i] !== stubbed.hashes[i]) { first = i; break; }
  H.assert(first >= 0,
           "non-vacuity: the SAME pair of builds diverges in OVERDRIVE — the stubs are live and the " +
           "Classic identity above is a statement about the gate, not about the stub doing nothing");
  H.assert(real.dives > 0, `non-vacuity: the Overdrive session dived (${real.dives})`);
}

// ---------------------------------------------------------------------------
// 10. ⚠ THE CUT (RF6, plan §6) — ONE LINE, AND IT TAKES THE WHOLE FEATURE
// ---------------------------------------------------------------------------
const CUT = [["    overdrive: { jump: true,  combo: true,  tokens: true,  rings: true  },",
              "    overdrive: { jump: true,  combo: true,  tokens: true,  rings: false },"]];
{
  // ⛔ Trap 3: the string is proved to be in the build exactly once first —
  // buildGame() throws otherwise, and a throw would otherwise read as a pass.
  H.eq(SCRIPT.split(CUT[0][0]).length - 1, 1,
       "⛔ the cut is ONE LINE, and it is in the build exactly once (MI3's shape)");
  installSeed(SEED);
  let Z = null, threw = null;
  try { Z = H.buildGame({ mutate: CUT, spy: ["addScore"] }); } catch (e) { threw = e.message; }
  H.eq(threw, null, `fixture: the cut build compiles (${threw})`);
  const ZC = Z.C, st = Z.state, ZG = Z.Game;
  H.eq(ZC.MODE_FLAGS.overdrive.rings, false, "fixture: the Overdrive row is cut");
  H.eq(Z.modeHas("rings", "overdrive"), false, "⛔ and modeHas() reads it — the gate is the whole mechanism");

  // ⛔ An Overdrive session lays zero rings, pays nothing inside a dive, and
  // its dive is C.DIVE_TIME long — exactly what four closed soak files assert.
  const laid = [];
  ZG.reset();
  Z.startGame(SEED, { mode: "overdrive", startDepth: 1 });
  let inDive = 0, paidInDive = 0, diveSteps = 0, dives = 0, lastTimer = 0;
  st.score = 0;
  Z.addScore.before = function (n) { if (st.dive.active) paidInDive += n; };
  ZG.input.keyDown(" ");
  for (let i = 0; i < HASH_STEPS; i++) {
    if (i % 7 === 0) ZG.input.mouseMove(((i * 37) % 181) - 90);
    if (i % 300 === 0) ZG.input.mouseMove((Math.floor(i / 300) % 2) ? 4000 : -4000);
    const was = st.dive.active;
    ZG.update(ZC.FIXED_DT);
    if (st.dive.active) { inDive++; laid.push(st.dive.rings.length); lastTimer = st.dive.timer; diveSteps++; }
    if (was && !st.dive.active) { dives++; H.assert(lastTimer < ZC.DIVE_TIME, ""); }
  }
  H.assert(inDive > 0 && dives > 0, `fixture: the cut Overdrive session dived (${dives} dives, ${inDive} dive steps)`);
  H.eq(Math.max.apply(null, laid), 0, "⛔ THE CUT LAYS ZERO RINGS — so none is taken, drawn or sounded");
  H.eq(paidInDive, 0, "⛔ and a cut Overdrive dive scores NOTHING (test-cs012-p6.js's behaviour, restored)");
  H.assert(lastTimer < ZC.DIVE_TIME && lastTimer >= ZC.DIVE_TIME - ZC.FIXED_DT,
           `⛔ and its dive is C.DIVE_TIME long, not C.DIVE_TIME_OD (last observable timer ${lastTimer})`);
  H.eq(Z.diveTime(), ZC.DIVE_TIME, "⛔ diveTime() reads C.DIVE_TIME on a cut Overdrive run");
  // ⛔ AND NO OTHER CHANGESET'S CODE IS TOUCHED (ROADMAP's condition on all
  // three cuts): the jump, the combo and the tokens are untouched by it.
  H.eq(J([ZC.MODE_FLAGS.overdrive.jump, ZC.MODE_FLAGS.overdrive.combo, ZC.MODE_FLAGS.overdrive.tokens]),
       J([true, true, true]), "⛔ the cut takes the rings and nothing else");
}

// ---------------------------------------------------------------------------
// 11. ⛔ MUTATION-CHECKED — the gate, the two caps' readers, the score line
// ---------------------------------------------------------------------------
//
// ⛔ Trap 3 (STATUS.md, K10): each string is proved to be in the build exactly
// once BEFORE the mutant is asserted red, the reads are guarded, and a throw is
// reported rather than counted as a pass.
function mutantRed(mutate, what, probe, want) {
  H.eq(SCRIPT.split(mutate[0][0]).length - 1, 1,
       `fixture: ${what} — the mutation string is in the build exactly once`);
  installSeed(SEED);
  let got = null, threw = null;
  try {
    const Z = H.buildGame({ mutate: mutate });
    got = probe(Z);
  } catch (e) { threw = e && e.message; }
  H.eq(threw, null, `fixture: ${what} — the mutant runs (${threw})`);
  H.assert(got !== null && J(got) !== J(want),
           `⛔ MUTATION — ${what} changes the answer (got ${J(got)}, unmutated ${J(want)})`);
  return got;
}
// A probe that is the same function for the real build and every mutant.
function probeFlight(Z) {
  const ZC = Z.C, st = Z.state;
  Z.Game.reset();
  Z.startGame(SEED, { mode: "overdrive", startDepth: 1 });
  st.level = 5; st.wellIndex = 0; Z.enterWell();
  st.spawn.remaining = 0; st.enemies = []; st.shots = [];
  Z.Game.input.reset();
  const well = Z.WELLS[0];
  Z.startDive(st);
  const laid = st.dive.rings.length;
  st.skimmer.lane = laid ? st.dive.rings[0].lane : 0;
  const s0 = st.score;
  let n = 0, last = 0;
  const lvl = st.level;
  while (st.level === lvl && n < Math.ceil(10 / ZC.FIXED_DT)) { last = st.dive.timer; Z.updateDive(st, well, ZC.FIXED_DT); n++; }
  return { laid: laid, paid: st.score - s0, longer: last > ZC.DIVE_TIME };
}
const REAL = probeFlight(X);
H.eq(REAL.laid, C.DIVE_RINGS_MAX, "fixture: the unmutated probe lays a full set");
H.assert(REAL.paid > 0, `fixture: and its diver takes at least one ring (${REAL.paid})`);
H.eq(REAL.longer, true, "fixture: and the flight runs past C.DIVE_TIME");

mutantRed([["  if (!modeHas(\"rings\", state.mode)) return;", "  if (modeHas(\"rings\", state.mode)) return;"]],
          "inverting layRings()'s gate", probeFlight, REAL);
mutantRed([["  return modeHas(\"rings\") ? C.DIVE_TIME_OD : C.DIVE_TIME;",
            "  return C.DIVE_TIME;"]],
          "diveTime() ignoring C.DIVE_TIME_OD", probeFlight, REAL);
mutantRed([["  const n = C.DIVE_RINGS_MAX;", "  const n = C.DIVE_RINGS_MAX - 1;"]],
          "layRings() laying one ring fewer than C.DIVE_RINGS_MAX", probeFlight, REAL);
// ⛔ REPAIRED IN PLACE, CS014 P2: the pin is now the CALL and not the whole
// line. P2 seated sfx("ringTake") beside the payout and sfx("ringMiss") on the
// other branch (GDD 11.8, RF8-A), which moved the line this claim was never
// about. The claim is the payout's ARGUMENT — unmultiplied — so that is what
// is pinned, and `addScore(C.RING_POINTS)` is in the build exactly once.
mutantRed([["addScore(C.RING_POINTS)", "addScore(C.RING_POINTS * comboMult())"]],
          "multiplying a ring's payout (RF4: it is the Bounty's row)",
          function (Z) {
            const ZC = Z.C, st = Z.state;
            Z.Game.reset();
            Z.startGame(SEED, { mode: "overdrive", startDepth: 1 });
            st.level = 5; st.wellIndex = 0; Z.enterWell();
            st.spawn.remaining = 0; st.enemies = []; st.shots = [];
            for (let i = 0; i < 4 * ZC.COMBO_KILLS_PER_STEP; i++) Z.comboKill(st);
            const well = Z.WELLS[0];
            Z.startDive(st);
            st.skimmer.lane = st.dive.rings.length ? st.dive.rings[0].lane : 0;
            const s0 = st.score;
            for (let i = 0; i < 60; i++) Z.updateDive(st, well, ZC.FIXED_DT);
            return { paid: st.score - s0, mult: Z.comboMult() };
          },
          (function () {
            board("overdrive", 5, 0);
            for (let i = 0; i < 4 * C.COMBO_KILLS_PER_STEP; i++) X.comboKill(state);
            const well = X.WELLS[0];
            X.startDive(state);
            state.skimmer.lane = state.dive.rings[0].lane;
            const s0 = state.score;
            for (let i = 0; i < 60; i++) X.updateDive(state, well, DT);
            return { paid: state.score - s0, mult: X.comboMult() };
          })());

H.report("test-cs014-p1.js");
