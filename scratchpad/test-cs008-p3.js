// test-cs008-p3.js — CS008 P3: the run's parameters, mode and Start Depth (GDD
// 13, 4.6, 15.6; plan §4). Asserts what P3 owns: startGame(seed) is
// bit-identical to startGame(seed, { mode: "classic", startDepth: 1 }); the
// startBonus() formula; the bonus paid once, on clearing the starting well, and
// never by a run that ends there; the Start Depth list off the session record,
// which outlives startGame(); a run started at 81 (plan §1.12); and the two
// telemetry columns' source.
//
// ⛔ TRAPS IN THE FIXTURES.
//  1. The bonus values are GDD 4.6's corrected LITERALS, never startBonus()
//     read back and never C.START_BONUS_*: a test that read the build's own
//     formula would pass a wrong one.
//  2. The equivalence runs are two BUILDS, each seeded above its own
//     buildGame(): input and loop state are module-private, so a second run in
//     one build is not the same run.
//  3. The session record is module state in the build, so the staged cases run
//     in order on ONE build: the first-session list is asserted before any
//     clear, and the list cases read the record the bonus cases already wrote.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260913;
const GDD = { wellPerLevel: 100, purgeUnspent: 500, noDeath: 1000 };   // trap 1

// ---------------------------------------------------------------------------
// ⛔ THE DEFAULTS ARE BIT-IDENTICAL
// ---------------------------------------------------------------------------

// FNV-1a over each value's bit pattern — a local copy, as every soak's is.
const _f64 = new Float64Array(1);
const _u32 = new Uint32Array(_f64.buffer);
function mix(h, n) {
  _f64[0] = typeof n === "number" ? n : -1;
  for (const word of [_u32[0], _u32[1]]) {
    for (let b = 0; b < 4; b++) {
      h ^= (word >>> (b * 8)) & 0xff;
      h = Math.imul(h, 16777619) >>> 0;
    }
  }
  return h >>> 0;
}
function mixStr(h, s) { for (let i = 0; i < s.length; i++) h = mix(h, s.charCodeAt(i)); return h; }

function stateHash(h, st) {
  h = mixStr(h, st.screen); h = mixStr(h, st.mode); h = mix(h, st.startDepth);
  for (const k of ["time", "level", "wellIndex", "bandRoll", "seed", "lives", "score",
                   "nextLife", "invulnTime", "purgeUses", "shotCooldown"]) h = mix(h, st[k]);
  h = mix(h, st.spawn.timer); h = mix(h, st.spawn.remaining);
  h = mix(h, st.dive.timer); h = mix(h, st.dive.depth);
  h = mix(h, st.skimmer ? st.skimmer.lane : -1);
  h = mix(h, st.skimmer && st.skimmer.dead ? 1 : 0);
  h = mix(h, st.shots.length);
  for (const s of st.shots) { h = mix(h, s.lane); h = mix(h, s.t); }
  h = mix(h, st.enemies.length);
  for (const e of st.enemies) { h = mix(h, e.lane); h = mix(h, e.depth); h = mix(h, e.dead ? 1 : 0); }
  for (const k of Object.keys(st.tally)) h = mix(h, st.tally[k]);
  return h;
}

// test-cs005-p5.js's recorded input list: no "r", no "w", no digits.
function replay(input, i) {
  if (i % 7 === 0)   input.mouseMove(((i * 37) % 181) - 90);
  if (i % 53 === 0)  input.keyDown("ArrowRight");
  if (i % 53 === 11) input.keyUp("ArrowRight");
  if (i % 71 === 0)  input.keyDown("ArrowLeft");
  if (i % 71 === 31) input.keyUp("ArrowLeft");
  if (i % 13 === 0)  input.keyDown(" ");
  if (i % 13 === 9)  input.keyUp(" ");
  if (i % 311 === 0) input.keyDown("x");
  if (i % 311 === 4) input.keyUp("x");
}

const TICKS = 8000;
function playedRun(opts) {
  installSeed(SEED);                        // ⛔ above the build (trap 2)
  const X = H.buildGame();
  const G = X.Game, st = X.state;
  G.reset();
  if (opts === undefined) X.startGame(SEED); else X.startGame(SEED, opts);
  const snapshot = JSON.stringify(st);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < TICKS; i++) {
    replay(G.input, i);
    G.update(X.C.FIXED_DT);
    h = stateHash(h, st);
  }
  return { snapshot, h, level: st.level, score: st.score, next: st.rng() };
}

const bare = playedRun();
const explicit = playedRun({ mode: "classic", startDepth: 1 });
H.eq(explicit.snapshot, bare.snapshot,
     "⛔ startGame(seed) and startGame(seed, {classic, 1}) begin in the same state");
H.eq(explicit.h, bare.h, `⛔ ... and stay identical, step for step, over ${TICKS} played steps`);
H.eq(explicit.next, bare.next, "... with the run's one stream at the same place");
H.assert(bare.level > 1 && bare.score > 0, `fixture: the run cleared wells and scored (level ${bare.level})`);
const deeper = playedRun({ startDepth: 3 });
H.assert(deeper.h !== bare.h, "and the hash can see a start depth that differs");

// ---------------------------------------------------------------------------
// one build for the staged cases
// ---------------------------------------------------------------------------

installSeed(SEED);
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const state = X.state;
const DT = C.FIXED_DT;

// ⛔ The list first, before any case below clears a well (trap 3).
H.eq(JSON.stringify(X.startDepthOptions()), "[1,3,5,7,9]", "⛔ a first session offers 1, 3, 5, 7, 9");

// startBonus — GDD 4.6's formula, corrected (Paul, S3)
const BONUS = { 1: 0, 3: 2400, 5: 7400, 7: 14100, 9: 22300, 17: 67600, 33: 204800, 81: 887200 };
for (const d of Object.keys(BONUS)) H.eq(X.startBonus(+d), BONUS[d], `startBonus(${d})`);

// Clear the current well through the real clear edge: an empty board, no quota.
function clearNow() {
  state.spawn.remaining = 0;
  state.enemies = [];
  state.shots = [];
  const s0 = state.score;
  G.update(DT);
  H.assert(state.dive.active, `fixture: level ${state.level} cleared into the dive`);
  return state.score - s0;
}
function diveOut() {
  const lvl = state.level;
  for (let i = 0; i < 10000 && state.level === lvl; i++) G.update(DT);
  H.eq(state.level, lvl + 1, "fixture: the dive ended on the next level");
}
function begin(opts) { G.reset(); X.startGame(SEED, opts); }

// ---------------------------------------------------------------------------
// the run's parameters
// ---------------------------------------------------------------------------

begin({ mode: "overdrive", startDepth: 9 });
H.eq(state.mode, "overdrive", "state.mode is the run's mode");
H.eq(state.startDepth, 9, "state.startDepth is the run's start depth");
H.eq(state.level, 9, "⛔ the run begins at its start depth");
H.eq(state.wellIndex, 8, "... in the well the level's modulo names");
const row = X.telemetryRow(state);
H.eq(row.mode, "overdrive", "⛔ the telemetry mode column reads state.mode");
H.eq(row.startDepth, 9, "⛔ the telemetry startDepth column reads state.startDepth");
H.eq(JSON.stringify(Object.keys(C.TELEMETRY_PLACEHOLDER)), '["maxCombo"]',
     "⛔ the placeholder is one key, maxCombo");

// ---------------------------------------------------------------------------
// ⛔ the bonus: paid on clearing the starting well, once (Paul, S2)
// ---------------------------------------------------------------------------

begin({ startDepth: 9 });
H.eq(clearNow(), 9 * GDD.wellPerLevel + GDD.purgeUnspent + GDD.noDeath + 22300,
     "⛔ a run started at 9 is paid 22,300 on its first clear, beside the three bonuses");
diveOut();
H.eq(clearNow(), 10 * GDD.wellPerLevel + GDD.purgeUnspent + GDD.noDeath,
     "⛔ ... and is not paid again at 10");

begin({ startDepth: 9 });
state.lives = 1;
X.killSkimmer(state);
H.eq(state.screen, "gameover", "fixture: the run ended in well 9");
state.spawn.remaining = 0;
state.enemies = [];
for (let i = 0; i < 600; i++) G.update(DT);
H.eq(state.score, 0, "⛔ a run that dies in well 9 is never paid");
H.eq(state.tally.wellsCleared, 0, "... because it never clears it");

begin({});
H.eq(clearNow(), GDD.wellPerLevel + GDD.purgeUnspent + GDD.noDeath,
     "a default run's level-1 clear pays the three bonuses and startBonus(1), which is 0");

// ---------------------------------------------------------------------------
// ⛔ the Start Depth list, off the session record
// ---------------------------------------------------------------------------
// The level-1 and level-9/10 clears above already wrote the record: 10.

function odds(top) { const a = []; for (let d = 1; d <= top; d += 2) a.push(d); return a.join(","); }

H.eq(X.levelRecord().highestCleared(), 10, "fixture: the record is the highest level cleared so far");
H.eq(X.startDepthOptions()[X.startDepthOptions().length - 1], 9, "a record of 10 snaps to 9: still 1–9");

begin({ startDepth: 13 });
clearNow();
diveOut();
clearNow();
H.eq(X.levelRecord().highestCleared(), 14, "fixture: level 14 cleared, through the clear edge");
H.eq(X.startDepthOptions().join(","), odds(13), "⛔ clear 14 -> the list reaches 13");

X.startGame(SEED);
H.eq(X.startDepthOptions().join(","), odds(13),
     "⛔ the record survives startGame() — it is not state");
H.eq(Object.keys(state).some(k => /record|highest|cleared/i.test(k)), false,
     "... and no state field carries it");

begin({ startDepth: 81 });
state.level = 90;
state.wellIndex = (90 - 1) % X.WELLS.length;
X.enterWell();
clearNow();
H.eq(X.levelRecord().highestCleared(), 90, "fixture: level 90 cleared");
H.eq(X.startDepthOptions().join(","), odds(81), "⛔ clear 90 -> the list caps at 81");

begin({});
clearNow();
H.eq(X.startDepthOptions().length, 41, "a lower clear afterwards never shrinks the list");

// ---------------------------------------------------------------------------
// ⛔ a run started at 81 (plan §1.12)
// ---------------------------------------------------------------------------

installSeed(SEED);
const Y = H.buildGame();
Y.Game.reset();
Y.startGame(SEED, { startDepth: 81 });
H.eq(Y.state.level, 81, "a run started at 81 is at level 81");
H.eq(Y.state.wellIndex, 0, "⛔ ... lands on WELLS[0]");
H.eq(Y.state.bandRoll, 0, "⛔ ... with bandRoll 0");
installSeed(SEED);
const Z = H.buildGame();
Z.Game.reset();
Z.startGame(SEED);
H.eq(Y.state.rng(), Z.state.rng(), "⛔ ... and startGame() spent no draw getting there");

H.report("test-cs008-p3.js");
