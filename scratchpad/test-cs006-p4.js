// test-cs006-p4.js — CS006 P4: buildLaneState(), the producer behind GDD 3.7's
// lane lighting, and ⛔ the gate that keeps it inside the dim band.
//
// Asserts what P4 owns: the producer, its gate, its preallocation and its three
// flags. ⛔ NOT the renderer — drawWell()'s spoke loop, wellBandColor and
// wellBaseAlpha are CS001 P3's and CS006 P1's, and this file only reads them.
// No claim about the Dive, throatOffset, heat or any global count.
//
// ⛔ FOUR TRAPS IN THE FIXTURES.
//  1. Boot calls startGame(), so the live state at load is a run in progress.
//     Every case starts from G.reset() + startGame(SEED).
//  2. THE GATE IS INVISIBLE IN THE PIXELS OUTSIDE THE BAND, which is the whole
//     reason it exists — max(1.0, 0.9) is 1.0. So it is observed by COUNTING
//     reads of state.enemies through a getter, not by looking at alpha.
//  3. ⛔ A 600-DRAW CASE IS VACUOUS IF draw() RETURNS EARLY (`if (!ctx) return`).
//     ctx.stroke is counted to show the renderer actually ran.
//  4. The producer returns its ONE array by reference, so a case that wants to
//     compare two boards must read the flags before building again.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260831;

installSeed(SEED);
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const state = X.state;
const WELLS = X.WELLS;

const SCRIPT = H.extractScript(require("fs").readFileSync(
  require("path").join(__dirname, "..", "dist", "vector-vortex.html"), "utf8"));

// A quiet board on a chosen well: a fresh run, the well swapped, nothing alive.
// No update() is ever run below, so nothing spawns behind a case's back.
function useWell(index) {
  G.reset();
  X.startGame(SEED);
  state.wellIndex = index;
  X.enterWell();
  return WELLS[index];
}

const RING = 0;                                       // closed, 16 lanes
const FAN = WELLS.findIndex(w => !w.closed);          // an open well

// Flags, copied out of the shared array (trap 4).
function snap(well) {
  const a = X.buildLaneState(state, well);
  return a.map(s => ({ occupied: s.occupied, shotTravel: s.shotTravel, surgeCharge: s.surgeCharge }));
}
const lanesWith = (rows, flag) => rows.map((r, i) => (r[flag] ? i : -1)).filter(i => i >= 0);

// ---------------------------------------------------------------------------
// ⛔ THE ALPHA ARITHMETIC — why the producer is gated at all (GDD 3.7)
// ---------------------------------------------------------------------------
//
// A lit spoke draws at Math.max(baseAlpha, C.LANE_LIT_ALPHA). Outside the dim
// band baseAlpha is 1.0, so a lit spoke and an unlit one are the SAME NUMBER.
for (const level of [1, 16, 64, 81, 99, 100, 150]) {
  const base = X.wellBaseAlpha(level);
  H.eq(Math.max(base, C.LANE_LIT_ALPHA), base,
       `⛔ at level ${level} a lit spoke draws at the unlit alpha — the producer would be a no-op`);
}
for (const level of [C.DIM_BAND_LO, 72, C.DIM_BAND_HI]) {
  const base = X.wellBaseAlpha(level);
  H.assert(Math.max(base, C.LANE_LIT_ALPHA) > base,
           `at level ${level} a lit spoke is brighter than the band — this is where lighting reads`);
}
H.assert(C.LANE_LIT_ALPHA < 1,
         "⛔ and that is only true because LANE_LIT_ALPHA is below 1 — raise it past 1 and " +
         "the gate becomes a bug rather than an optimisation");
H.assert(X.wellBaseAlpha(C.DIM_BAND_LO) < 1 && X.wellBaseAlpha(C.DIM_BAND_HI) < 1,
         "the gate's own predicate, wellBaseAlpha(level) < 1, is true across the band");
H.assert(X.wellBaseAlpha(C.DIM_BAND_LO - 1) === 1 && X.wellBaseAlpha(C.DIM_BAND_HI + 1) === 1,
         "and false on both sides of it");

// ---------------------------------------------------------------------------
// ⛔ THE GATE IS WIRED — the producer runs at 65 and 80 and NOT at 1, 64 or 81
// ---------------------------------------------------------------------------
//
// TRAP 2: counted through a getter on state.enemies. Game.draw()'s z-order loop
// reads it too, so the claim is relative: a gated-on level reads it MORE times
// than a gated-off one, and a gated-off level reads it exactly as level 1 does.
const well0 = useWell(RING);
let enemyReads = 0;
(function countEnemyReads() {
  let backing = state.enemies;
  Object.defineProperty(state, "enemies", {
    configurable: true,
    get() { enemyReads++; return backing; },
    set(v) { backing = v; },
  });
})();

const ctx2d = X._env.canvas.getContext("2d");
const realStroke = ctx2d.stroke;
let strokes = 0;
ctx2d.stroke = function () { strokes++; };

function readsAtLevel(level) {
  state.level = level;
  enemyReads = 0; strokes = 0;
  G.draw();
  return enemyReads;
}

const offBase = readsAtLevel(1);
H.assert(strokes > 0, "the draws actually reached the renderer (TRAP 3)");
H.assert(offBase > 0, "and Game.draw() reads state.enemies at all, so the counter is live");

for (const level of [64, 81, 99, 150]) {
  H.eq(readsAtLevel(level), offBase,
       `⛔ level ${level} builds no laneState — it reads state.enemies exactly as level 1 does`);
}
for (const level of [C.DIM_BAND_LO, 72, C.DIM_BAND_HI]) {
  H.eq(readsAtLevel(level), offBase + 1,
       `⛔ level ${level} IS in the dim band, so buildLaneState() runs — one extra read`);
}

ctx2d.stroke = realStroke;
Object.defineProperty(state, "enemies", { configurable: true, writable: true, value: state.enemies });

// ---------------------------------------------------------------------------
// ⛔ ONE PREALLOCATED ARRAY (GDD 17's perf budget) — identity is stable
// ---------------------------------------------------------------------------

let well = useWell(RING);
const a0 = X.buildLaneState(state, well);
H.eq(a0.length, C.LANE_LIT_MAX_LANES, "the array is C.LANE_LIT_MAX_LANES long");
H.assert(a0.every(s => s && typeof s === "object"), "every slot is a real entry object");

const entry0 = a0[0];
H.assert(X.buildLaneState(state, WELLS[FAN]) === a0,
         "⛔ the SAME array comes back for a different well — it is module-level, not per-call");

state.level = 70;
let ctxStroke = X._env.canvas.getContext("2d");
for (let i = 0; i < 600; i++) G.draw();
const a1 = X.buildLaneState(state, well);
H.assert(a1 === a0, "⛔ array identity is stable across 600 draws — nothing is allocated per frame");
H.assert(a1[0] === entry0, "⛔ and so is every ENTRY's identity — they are cleared, not replaced");

// ---------------------------------------------------------------------------
// ⛔ EVERY SLOT IS CLEARED, NOT JUST THE CURRENT WELL'S LANES
// ---------------------------------------------------------------------------
//
// 13-render-well.js indexes laneState[lanes] on an OPEN well and needs it unlit.
// A preallocated array makes that a real entry, so a stale flag from a WIDER
// well would light a narrower well's end spoke.
well = useWell(RING);
state.skimmer.lane = 0;
H.assert(X.spawnEnemy("vaulter", WELLS[RING].lanes - 1, 0.5) !== null, "a Vaulter on the widest well");
H.assert(snap(WELLS[RING])[WELLS[RING].lanes - 1].occupied, "and it lights that far lane");

const fan = useWell(FAN);
H.assert(fan.lanes < WELLS[RING].lanes, "the open well is narrower than the one before it");
const fanRows = snap(fan);
H.assert(fanRows.every(r => !r.occupied && !r.shotTravel && !r.surgeCharge),
         "⛔ every slot is clear on the narrower well, including the ones past its lane count — " +
         "drawWell reads laneState[lanes] on an open well's last spoke");

// ---------------------------------------------------------------------------
// THE THREE FLAGS — each set by the right thing, and by nothing else (GDD 3.7)
// ---------------------------------------------------------------------------

// `occupied` — a live enemy, and only an enemy.
well = useWell(RING);
state.skimmer.lane = 10;
const vaulter = X.spawnEnemy("vaulter", 3, 0.5);
H.assert(vaulter !== null, "a Vaulter in lane 3");
let rows = snap(well);
H.eq(lanesWith(rows, "occupied").join(","), "3", "⛔ `occupied` is set in the enemy's lane and no other");
H.eq(lanesWith(rows, "shotTravel").length, 0, "⛔ and an enemy sets NOTHING else — no shotTravel");
H.eq(lanesWith(rows, "surgeCharge").length, 0, "⛔ and no surgeCharge");

vaulter.dead = true;
H.eq(lanesWith(snap(well), "occupied").length, 0, "⛔ a DEAD enemy occupies nothing");
vaulter.dead = false;

// ⛔ Containment is |laneDelta| < 1, wrap-aware. A lane-centre entity lights one
// lane; a boundary rider (GDD 3.5's lattice) lights the two it sits between.
vaulter.lane = 0.5;
H.eq(lanesWith(snap(well), "occupied").join(","), "0,1",
     "an entity on the boundary lattice lights both lanes it is between");
vaulter.lane = well.lanes - 0.5;
H.eq(lanesWith(snap(well), "occupied").join(","), `0,${well.lanes - 1}`,
     "⛔ and containment WRAPS on a closed well — laneDelta, never a bare subtraction");
vaulter.dead = true;

// `shotTravel` — a live shot, and only a shot.
well = useWell(RING);
state.shots.push(new X.Shot(well, 5));
rows = snap(well);
H.eq(lanesWith(rows, "shotTravel").join(","), "5", "⛔ `shotTravel` is set in the shot's lane and no other");
H.eq(lanesWith(rows, "occupied").length, 0, "⛔ and a shot is NOT an occupant");
H.eq(lanesWith(rows, "surgeCharge").length, 0, "⛔ and does not charge");
state.shots[0].dead = true;
H.eq(lanesWith(snap(well), "shotTravel").length, 0, "⛔ a DEAD shot travels nothing");

// `surgeCharge` — a Surger in telegraph or discharge, and nothing else.
well = useWell(RING);
state.skimmer.lane = 0;
const surger = X.spawnEnemy("surger", 7, 0.5);
H.assert(surger !== null && surger instanceof X.Surger, "a Surger in lane 7");
H.eq(surger.phase, "climb", "born climbing (CS005 P3)");
rows = snap(well);
H.eq(lanesWith(rows, "occupied").join(","), "7", "a climbing Surger occupies its lane");
H.eq(lanesWith(rows, "surgeCharge").length, 0,
     "⛔ but a CLIMBING Surger does not charge — the flag is the two charge phases, not the kind");

for (const phase of ["telegraph", "discharge"]) {
  surger.setPhase(phase);
  rows = snap(well);
  H.eq(lanesWith(rows, "surgeCharge").join(","), "7", `⛔ a Surger in ${phase} sets surgeCharge in its lane`);
  H.eq(lanesWith(rows, "occupied").join(","), "7", "and is still an occupant");
  H.eq(lanesWith(rows, "shotTravel").length, 0, "and travels no shot");
}
surger.setPhase("climb");

// ⛔ A non-Surger enemy never sets surgeCharge, however it is posed.
well = useWell(RING);
state.skimmer.lane = 0;
const weaver = X.spawnEnemy("weaver", 4, 0.5);
H.assert(weaver !== null && !(weaver instanceof X.Surger), "a Weaver in lane 4");
weaver.phase = "telegraph";   // a duck-typed producer would light this one
H.eq(lanesWith(snap(well), "surgeCharge").length, 0,
     "⛔ surgeCharge is a Surger test, not a `phase` test — a non-Surger with the same field sets nothing");
H.eq(lanesWith(snap(well), "occupied").join(","), "4", "and it is still an occupant");

// An empty board sets nothing at all.
well = useWell(RING);
H.assert(snap(well).every(r => !r.occupied && !r.shotTravel && !r.surgeCharge),
         "an empty board lights no lane");

// ---------------------------------------------------------------------------
// THE PRODUCED ARRAY REACHES THE RENDERER, AND null STILL DOES TOO
// ---------------------------------------------------------------------------

// Recorded off the real canvas context: glowStroke's thin pass strokes at
// C.GLOW_THIN_ALPHA * alpha, so a lit spoke is a distinguishable number.
function recordDraw() {
  const ctx = X._env.canvas.getContext("2d");
  const prev = ctx.stroke;
  const alphas = [];
  ctx.stroke = function () { alphas.push(ctx.globalAlpha); };
  try { G.draw(); } finally { ctx.stroke = prev; }
  return alphas;
}
const LIT_THIN = C.GLOW_THIN_ALPHA * Math.max(C.DIM_BAND_ALPHA, C.LANE_LIT_ALPHA);
const DIM_THIN = C.GLOW_THIN_ALPHA * C.DIM_BAND_ALPHA;
const countAt = (arr, v) => arr.filter(a => Math.abs(a - v) < 1e-12).length;

well = useWell(RING);
state.skimmer.lane = 12;
state.level = 70;
H.assert(X.spawnEnemy("vaulter", 3, 0.5) !== null, "a Vaulter in lane 3 of the dim band");
const litFrame = recordDraw();
H.eq(countAt(litFrame, LIT_THIN), 2,
     "⛔ exactly the TWO spokes bounding lane 3 draw lit — the produced array reached drawWell");
H.assert(countAt(litFrame, DIM_THIN) > 0, "and the rest of the well is still at the dim band's alpha");

state.level = 1;
const brightFrame = recordDraw();
H.eq(countAt(brightFrame, DIM_THIN), 0, "outside the band nothing draws at DIM_BAND_ALPHA");
H.eq(countAt(brightFrame, LIT_THIN), 0,
     "⛔ and nothing draws at the lit alpha either — the gate is off and every spoke is opaque");

let threw = null;
try {
  const ctx = X._env.canvas.getContext("2d");
  for (const w of WELLS) {
    X.drawWell(ctx, w, 70, null, 0);
    X.drawWell(ctx, w, 70, X.buildLaneState(state, w), 0);
  }
} catch (e) { threw = e; }
H.assert(threw === null, `⛔ drawWell still accepts null on every well (${threw && threw.message})`);

// ---------------------------------------------------------------------------
// ⛔ THE PRODUCER SPENDS NOTHING FROM THE RUN'S ONE STREAM
// ---------------------------------------------------------------------------

well = useWell(RING);
state.skimmer.lane = 12;
X.spawnEnemy("vaulter", 3, 0.5);
X.spawnEnemy("surger", 6, 0.4);
state.shots.push(new X.Shot(well, 9));
state.level = 70;

let draws = 0;
const base = X.mulberry32(state.seed);
state.rng = function () { draws++; return base(); };

const ctxS = X._env.canvas.getContext("2d");
const keepStroke = ctxS.stroke;
strokes = 0;
ctxS.stroke = function () { strokes++; };
for (let i = 0; i < 600; i++) G.draw();
ctxS.stroke = keepStroke;

H.assert(strokes > 0, "the 600 draws actually reached the renderer (TRAP 3)");
H.eq(draws, 0,
     "⛔ 600 G.draw() calls INSIDE THE DIM BAND, with a populated board and ZERO G.update() " +
     "calls, advance the stream by zero — the producer runs in the draw path, and draw() " +
     "runs on a frame clock while update() does not (CLAUDE.md, Math and lifecycle)");

for (let i = 0; i < 50; i++) X.buildLaneState(state, well);
H.eq(draws, 0, "and calling the producer directly spends nothing either");

// Asserted against the built file, because an absence has no behavioural proof.
const start = SCRIPT.indexOf("function buildLaneState(");
H.assert(start > 0, "the built file carries buildLaneState");
const producer = SCRIPT.slice(start, SCRIPT.indexOf("\n}\n", start))
  .split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n");
H.assert(!/rng/.test(producer), "⛔ and the producer's body does not mention the stream at all");
H.assert(/laneDelta/.test(producer), "it goes through the wrap-aware lane helper");
H.assert(!/chargeTip|SURGE_TELEGRAPH/.test(producer),
         "⛔ AND THE TELEGRAPH DID NOT MOVE HERE — buildLaneState sets a boolean over spokes; " +
         "drawSurgeLane() still paints the progressive throat->rim fill inside them (GDD 6.3)");
H.assert(/wellBaseAlpha\(state\.level\) < 1 \? buildLaneState\(state, well\) : null/.test(SCRIPT),
         "⛔ Game.draw() gates the producer on the renderer's OWN band predicate, so the two " +
         "can never disagree about where the dim band is");

// ⛔ The sizing contract: the array is as long as the widest well, so no well
// loses lighting on lanes past the end of it.
const widest = WELLS.reduce((m, w) => Math.max(m, w.lanes), 0);
H.assert(widest <= C.LANE_LIT_MAX_LANES,
         `⛔ no well is wider than C.LANE_LIT_MAX_LANES (widest is ${widest})`);

H.report("CS006 P4 — buildLaneState, the dim-band gate, and lane lighting");
