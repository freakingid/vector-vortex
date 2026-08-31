// test-cs006-p1.js — CS006 P1: GDD 3.6's past-99 well progression, state.bandRoll,
// and ⛔ the rule that nothing in the draw path spends a draw (GDD 3.6, 16.1, 17.1).
//
// Asserts what P1 owns. No claim about the Dive, laneState, throatOffset or heat.
//
// ⛔ FIVE TRAPS IN THE FIXTURES.
//  1. Boot calls startGame(), so the live state at load is a run in progress.
//     Every case starts from G.reset() + startGame(SEED).
//  2. The counting proxy REPLACES state.rng, so it wraps a real mulberry32 built
//     from state.seed — installed immediately after startGame(), which spends
//     nothing, so the counted stream is bit-aligned with the real one. A proxy
//     returning a constant would make rngInt() pick lane 0 forever and the
//     determinism case would pass vacuously.
//  3. ⛔ THE 600-DRAW CASE IS VACUOUS IF draw() RETURNS EARLY. Game.draw() opens
//     `if (!ctx) return`, so a stub canvas that handed back null would prove
//     nothing. ctx.stroke is counted to show the renderer actually ran.
//  4. The `w` presses go through G.input.sample() and NOT G.update() — named
//     actions are dispatched from sample() (04-input.js), and update() would
//     also run the spawner, which legitimately draws.
//  5. The whole walk below level 100 runs with no update(), so nothing spawns.
//     Any draw counted there came from nextWell/enterWell and nowhere else.
//
// ⛔ The stream below 100 being bit-identical to the pre-change build is proved
// somewhere else: test-cs004-p1.js's GOLDEN_LANES, recorded at 9ebd27b. This
// file proves the mechanism (zero draws spent); that file proves the outcome.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260830;

installSeed(SEED);
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const state = X.state;

// ---------------------------------------------------------------------------
// the counting proxy over the run's ONE stream (01-rng.js)
// ---------------------------------------------------------------------------

let draws = 0;

// Replace state.rng with a counted mulberry32 over the SAME seed the run holds.
// Values are unchanged; only the call count becomes observable.
function countStream() {
  const base = X.mulberry32(state.seed);
  state.rng = function () { draws++; return base(); };
  draws = 0;
}

function freshRun(seed) {
  G.reset();
  X.startGame(seed === undefined ? SEED : seed);
  countStream();
  return X.WELLS[state.wellIndex];
}

// ---------------------------------------------------------------------------
// the constant (GDD 3.6's boundary)
// ---------------------------------------------------------------------------

H.assert("BAND_RNG_LEVEL" in C, "C.BAND_RNG_LEVEL exists");
H.eq(C.BAND_RNG_LEVEL, 99, "⛔ GDD 3.6's boundary — the last BAND_COLORS row is hi: 99");
H.eq(C.BAND_COLORS[C.BAND_COLORS.length - 1].hi, C.BAND_RNG_LEVEL,
     "⛔ and it IS the last band's ceiling — two numbers for one boundary is the drift");

// ---------------------------------------------------------------------------
// the field (02-state.js)
// ---------------------------------------------------------------------------

G.reset();
H.assert("bandRoll" in state, "state.bandRoll exists");
H.eq(state.bandRoll, 0,
     "⛔ and its shipped default is 0 — exactly the literal Game.draw() passed before it");

// ---------------------------------------------------------------------------
// the walk to 99 is the modulo walk, and it spends NOTHING
// ---------------------------------------------------------------------------

freshRun();
H.eq(state.level, 1, "a fresh run starts at level 1");
H.eq(state.wellIndex, (state.level - 1) % X.WELLS.length, "and on GDD 3.4's shapeIndex");
H.eq(draws, 0, "⛔ startGame + enterWell spend no draw");

let walkOk = true, walkQuiet = true;
for (let level = 2; level <= C.BAND_RNG_LEVEL; level++) {
  draws = 0;
  X.nextWell();
  if (state.level !== level) walkOk = false;
  if (state.wellIndex !== (level - 1) % X.WELLS.length) walkOk = false;
  if (draws !== 0) walkQuiet = false;
}
H.assert(walkOk, "levels 2..99 walk (level-1) % 16, unchanged");
H.assert(walkQuiet,
         "⛔ and every one of those nextWell() calls spends ZERO draws — the run's stream " +
         "is shared, so one draw here moves every spawn lane in every run (GDD 17.1)");
H.eq(state.bandRoll, 0, "⛔ bandRoll is untouched below the boundary");

// The boundary itself: 99 is the last banded level, 100 the first rolled one.
H.eq(state.level, C.BAND_RNG_LEVEL, "the walk ended on the boundary level");
H.eq(X.wellBandColor(C.BAND_RNG_LEVEL, state.bandRoll), "#FFFFFF",
     "level 99 is still the White band, from the table");

// ---------------------------------------------------------------------------
// past the boundary: exactly two draws, every level
// ---------------------------------------------------------------------------

let pastOk = true, pastQuiet = true, rollMoved = false, colourOk = true;
const shapesA = [], rollsA = [];
for (let level = C.BAND_RNG_LEVEL + 1; level <= 300; level++) {
  draws = 0;
  X.nextWell();
  if (state.level !== level) pastOk = false;
  if (draws !== 2) pastQuiet = false;
  if (!(state.wellIndex >= 0 && state.wellIndex < X.WELLS.length)) pastOk = false;
  if (!(state.bandRoll >= 0 && state.bandRoll < 1)) pastOk = false;
  if (state.bandRoll !== 0) rollMoved = true;
  if (!C.BAND_RNG_COLORS.includes(X.wellBandColor(level, state.bandRoll))) colourOk = false;
  shapesA.push(state.wellIndex);
  rollsA.push(state.bandRoll);
}
H.assert(pastOk, "levels 100..300 keep counting and land on a real well index and a 0..1 roll");
H.assert(pastQuiet,
         "⛔ and each spends EXACTLY two draws — the shape and the band roll, in that order");
H.assert(rollMoved, "the roll actually moves off its default past the boundary");
H.assert(colourOk,
         "wellBandColor returns a C.BAND_RNG_COLORS member at every level 100..300");

// ⚠ THE CLOCK DOES NOT HOLD (02-state.js). GDD 3.6's "the counter holds" is about
// the derived band table; state.level is the one clock and telemetry samples it.
H.eq(state.level, 300, "⛔ state.level itself keeps counting past 99 — the hold is in the caller");

// ---------------------------------------------------------------------------
// one seed, one sequence
// ---------------------------------------------------------------------------

freshRun();
const shapesB = [], rollsB = [];
for (let level = 2; level <= 300; level++) {
  X.nextWell();
  if (level > C.BAND_RNG_LEVEL) { shapesB.push(state.wellIndex); rollsB.push(state.bandRoll); }
}
H.eq(shapesB.join(","), shapesA.join(","),
     "two runs of one seed produce the same shape sequence for levels 100..300");
H.eq(rollsB.join(","), rollsA.join(","), "and the same band-roll sequence");

// And a different seed must move it, or the case above proves nothing.
freshRun(SEED + 1);
const shapesC = [];
for (let level = 2; level <= 300; level++) {
  X.nextWell();
  if (level > C.BAND_RNG_LEVEL) shapesC.push(state.wellIndex);
}
H.assert(shapesC.join(",") !== shapesA.join(","), "a different seed produces a different sequence");

// ---------------------------------------------------------------------------
// ⛔ THE DRAW PATH SPENDS NOTHING (CLAUDE.md, Math and lifecycle)
// ---------------------------------------------------------------------------

// TRAP 3: prove the renderer actually ran. The stub ctx is a Proxy whose `set`
// writes through to the target, and Game holds this exact object.
const ctx2d = X._env.canvas.getContext();
let strokes = 0;
ctx2d.stroke = function () { strokes++; };

freshRun();
state.level = 150;
state.bandRoll = 0.5;
draws = 0; strokes = 0;
for (let i = 0; i < 600; i++) G.draw();
H.assert(strokes > 0, "the 600 draws actually reached the renderer (TRAP 3)");
H.eq(draws, 0,
     "⛔ 600 G.draw() calls with ZERO G.update() calls advance the stream by zero — draw() " +
     "runs once per FRAME and update() zero to C.MAX_CATCHUP_STEPS times, and hit-stop " +
     "draws ~72 frames against no simulation at all");

// The renderer is handed a VALUE, not a stream: reading bandRoll cannot spend one.
H.eq(X.wellBandColor(150, 0.5), C.BAND_RNG_COLORS[Math.floor(0.5 * C.BAND_RNG_COLORS.length)],
     "wellBandColor takes a number and indexes the palette with it");
H.eq(draws, 0, "and calling it directly still spends nothing");

// ---------------------------------------------------------------------------
// ⛔ THE DRAW IS IN nextWell(), NOT enterWell() — a keypress may not move the stream
// ---------------------------------------------------------------------------

freshRun();
state.level = 150;
draws = 0;
X.enterWell();
H.eq(draws, 0, "⛔ enterWell() spends no draw, even past the boundary — it has three callers " +
                "and one of them is a debug key");

// TRAP 4: named actions are dispatched from input.sample(), not from a listener.
const before = state.wellIndex;
draws = 0;
for (let i = 0; i < 100; i++) {
  G.input.keyDown("w");
  G.input.sample(C.FIXED_DT, state.input);
  G.input.keyUp("w");
}
H.assert(state.wellIndex !== before || X.WELLS.length === 1,
         "the 100 `w` presses actually reached runAction (non-vacuous)");
H.eq(state.level, 150, "⛔ and cycling the well does NOT touch the level clock");
H.eq(draws, 0,
     "⛔ 100 `w` presses advance the stream by zero — a stream a debug key can shift is a " +
     "determinism bug whose symptom reads as a physics bug, which is why \"w\" is on the " +
     "FORBIDDEN list of three closed soaks");

H.report("test-cs006-p1.js");
