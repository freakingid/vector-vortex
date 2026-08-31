// test-cs006-p5.js — CS006's closing phase: GDD §17 items 1 and 12 against a
// board that now has a DIVE in it, plus the count-based form of the no-draw
// rule that CS007 inherits.
//
// ⛔ WHY THIS IS A FOURTH FILE AND NOT AN EDIT TO THE OTHER THREE. CS005's
// close established the pattern and the reason: a soak asserts its own
// changeset's board. test-cs003-p5.js runs the shipped ["vaulter"] list,
// test-cs004-p5.js three kinds in the exact-lane form, test-cs005-p5.js six
// kinds in three tiers — none of them was written to say anything about a beat
// between wells that did not exist when they were written. This file owns the
// Dive.
//
// It extends test-cs005-p5.js rather than restating it: the hash mixer, the
// recorded input list, the NaN walker, `replayWide`'s wall-to-wall pin and the
// two fixtures are deliberately the same shapes, so a reader who knows one
// knows all four. ⛔ It does NOT restate that file's lane assertions, its
// lattice cases or its per-well §17 item 3 soak — those are CS005's claims
// about CS005's geometry and re-asserting them here would be this file
// claiming work it did not do.
//
// ⛔ SIX TRAPS IN THE FIXTURES.
//  1. C.DEBUG_SPAWN_KINDS ships as ["vaulter"], so on the shipped value no
//     Weaver ever spawns, no Thorn is ever laid, and every dive below threads
//     an EMPTY well — which is a set of cases that cannot fail. Every soak run
//     here sets MIXED first; the non-vacuity assertions say it worked.
//  2. ⛔ AND C.ENEMY_CONCURRENT IS RAISED TO C.ENEMY_CAP for the soak, exactly
//     as CS004's and CS005's closes do — it keeps the board busy enough that a
//     dive has Thorns to thread. ⛔ REWRITTEN, CS007 P1: this used to be a
//     WORKAROUND for a live defect — a standing Thorn held a spawner slot and
//     three of them shut the well — and that defect is now FIXED. The release
//     budget counts THREATS (`blocksClear && !dead`), the readability ceiling
//     still counts entities (08-spawner.js, test-cs007-p1.js, DECISIONS.md
//     2026-08-31). The raise stays as a plain difficulty fixture.
//     ⛔ Both fixtures are put back and both are asserted back.
//  3. ⛔ THE HASH MUST COVER dive.active AND dive.phase, not only the two
//     numbers test-cs005-p5.js already folds in. timer and depth alone would
//     pass over a build whose short-circuit had stopped short-circuiting: the
//     beat would still count, the gameplay pass would run underneath it, and
//     the hash of the beat would be unchanged.
//  4. A dive is ~156 ticks and a well is ~1,300, so a 10,000-tick window holds
//     only a handful. ⛔ The hashed run is asserted to have COMPLETED one —
//     without that, "determinism with the Dive in it" is a claim about a beat
//     that never ran.
//  5. ⛔ THE ENEMY ARRAY IS CHECKED IN BOTH DIRECTIONS ACROSS A DIVE. startDive()
//     FILTERS that array, and a filter that kept the wrong side shows up as a
//     board that EMPTIES, never as one that grows — so "never grows" and "at
//     least one dive began with a survivor, and every survivor was anchored"
//     are two different assertions and both are here.
//  6. The RNG counting section runs on the SHIPPED one-entry list and restores
//     it. Its control is a two-entry list of the SAME kind — which spends
//     pickSpawnKind's draw without putting a splitting Carrier or a laying
//     Weaver on the board, so the extra draw is provably the kind pick and not
//     a second entity's.
"use strict";

const path = require("path");
const { execFileSync } = require("child_process");

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const ROOT = path.join(__dirname, "..");
const SEED = 20260830;
const TICKS = 10000;        // GDD §17 item 1
const RUNS = 20;            // GDD §17 item 12, at a closing phase's budget
const RUN_CAP = 30000;      // ticks before a run is declared stuck
const PIN_TICKS = 300;      // test-cs005-p5.js's wall-to-wall pin period
const HASH_ONLY = process.argv.includes("--hash-only");

// The six-kind bench list, character for character test-cs005-p5.js's. ⚠
// TEMPORARY exactly as C.DEBUG_SPAWN_KINDS itself is: GDD §8.1's introduction
// schedule deletes the constant and this line becomes "run at a level where all
// six are introduced". ⛔ The Weaver is the load-bearing entry HERE — it is the
// only source of Thorns, and a Thorn is the Dive's only hazard.
const MIXED = ["vaulter", "carrierDrifter", "carrierSurger", "weaver", "drifter", "surger"];

// ---------------------------------------------------------------------------
// GDD §17 item 1 — determinism, with a completed dive inside the window
// ---------------------------------------------------------------------------

// FNV-1a over the bit pattern of each value, so a 1-ulp drift is a different
// hash. A local copy, as all three earlier soaks' are: a shared mixer would
// make one function four phases' to keep stable, and these cases are meant to
// be able to disagree.
const _f64 = new Float64Array(1);
const _u32 = new Uint32Array(_f64.buffer);
function mix(h, n) {
  _f64[0] = n;
  for (const word of [_u32[0], _u32[1]]) {
    for (let b = 0; b < 4; b++) {
      h ^= (word >>> (b * 8)) & 0xff;
      h = Math.imul(h, 16777619) >>> 0;
    }
  }
  return h >>> 0;
}

// A non-number becomes a fixed sentinel rather than undefined: `mix` writes its
// argument into a Float64Array and every non-number lands on the same NaN bit
// pattern, which would make one entity's absent field indistinguishable from
// another's.
function num(v) { return typeof v === "number" ? v : -1; }

// THE recorded input list, character for character the other three soaks'.
// ⛔ NO "r", NO "w", NO DIGITS — asserted below against this very function.
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

// test-cs005-p5.js's driver: the recorded list plus a wall-to-wall pin, so the
// rim is swept end to end and a parked enemy is eventually met. Still a pure
// function of the tick index, so a failing seed is still replayable.
function replayWide(input, i) {
  replay(input, i);
  if (i % PIN_TICKS === 0) input.mouseMove((Math.floor(i / PIN_TICKS) % 2) ? 4000 : -4000);
}

// ⛔ ROTATION ONLY, AND NEVER FIRE. The one driver in this file that is not a
// variant of the recorded list, and it exists for one claim: a passive run
// still terminates. A well clears on quota-spent AND nothing that blocks the
// clear alive, and a player who never fires kills nothing — so a passive run
// reaches the game-over stop or it stalls, and a stall is the shape of every
// stall this project has found.
function replayPassive(input, i) {
  if (i % 7 === 0)   input.mouseMove(((i * 37) % 181) - 90);
  if (i % 53 === 0)  input.keyDown("ArrowRight");
  if (i % 53 === 11) input.keyUp("ArrowRight");
  if (i % 71 === 0)  input.keyDown("ArrowLeft");
  if (i % 71 === 31) input.keyUp("ArrowLeft");
  if (i % PIN_TICKS === 0) input.mouseMove((Math.floor(i / PIN_TICKS) % 2) ? 4000 : -4000);
}

// Entity phase strings, one table, distinct indices — test-cs005-p5.js's.
const PHASES = ["climb", "hold", "retreat", "birth", "ride", "cross",
                "telegraph", "discharge"];
// ⛔ THE DIVE'S OWN PHASES ARE A SEPARATE NAMESPACE. GDD §5's two beats are not
// entity phases and must not share indices with them — a table that folded both
// in would let a Weaver's "hold" and a beat collide in the hash.
const DIVE_PHASES = ["grace", "descent"];

// What the last hashRun() actually did, so the parent can assert the hashed run
// was not a quiet one — and, trap 4, that it dived.
const lastRun = {
  maxEnemies: 0, restarts: 0, level: 0,
  diveTicks: 0, divesStarted: 0, divesCompleted: 0, sawDescent: false,
  sawCarrier: false, sawWeaver: false, sawThorn: false, sawBolt: false,
  sawDrifter: false, sawSurger: false,
};

function hashRun(gameSeed) {
  installSeed(gameSeed);
  const X = H.buildGame();
  const C = X.C, G = X.Game, st = X.state;
  const DT = C.FIXED_DT;

  // Trap 1, before startGame so the very first spawn of the run already draws
  // a kind off the six-long list.
  C.DEBUG_SPAWN_KINDS = MIXED.slice();

  const cargoNames = Object.keys(X.CARGO);

  G.reset();
  X.startGame(gameSeed);

  let h = 2166136261 >>> 0;
  let restarts = 0;
  lastRun.maxEnemies = 0;
  lastRun.level = 0;
  lastRun.diveTicks = lastRun.divesStarted = lastRun.divesCompleted = 0;
  lastRun.sawDescent = false;
  lastRun.sawCarrier = lastRun.sawWeaver = lastRun.sawThorn = lastRun.sawBolt = false;
  lastRun.sawDrifter = lastRun.sawSurger = false;

  let wasActive = false;
  let levelAtDiveStart = st.level;

  for (let i = 0; i < TICKS; i++) {
    replay(G.input, i);
    G.update(DT);

    // The stop, restarted deterministically so the rest of the ticks are live
    // ones. Through the real startGame(), with an explicit seed.
    if (st.screen === "gameover") {
      restarts++;
      X.startGame((gameSeed + restarts * 7919) >>> 0);
    }

    // ⛔ A COMPLETED DIVE, NOT MERELY A STARTED ONE (trap 4). The only path out
    // of an active dive that is not a restart is updateDive() -> nextWell() ->
    // enterWell() -> resetDive(), and that path advances the level — so
    // "active fell, and the level went up" is the completion, expressed in the
    // two fields the loop itself moves.
    const active = st.dive.active;
    if (active && !wasActive) { lastRun.divesStarted++; levelAtDiveStart = st.level; }
    if (!active && wasActive && st.level === levelAtDiveStart + 1) lastRun.divesCompleted++;
    if (active) {
      lastRun.diveTicks++;
      if (st.dive.phase === "descent") lastRun.sawDescent = true;
    }
    wasActive = active;

    h = mix(h, st.time);
    h = mix(h, st.level);
    h = mix(h, st.wellIndex);
    h = mix(h, st.seed);
    h = mix(h, st.lives);
    h = mix(h, st.invulnTime);
    h = mix(h, st.purgeUses);
    h = mix(h, st.spawn.timer);
    h = mix(h, st.spawn.remaining);
    // ⛔ THE DIVE, ALL FOUR FIELDS — trap 3. test-cs005-p5.js folds in `timer`
    // and `depth` because they replaced the deleted hold; this file folds in
    // the STATE MACHINE as well, because a build whose short-circuit had
    // stopped short-circuiting would move neither of the other two.
    h = mix(h, st.dive.active ? 1 : 0);
    h = mix(h, DIVE_PHASES.indexOf(st.dive.phase));
    h = mix(h, st.dive.timer);
    h = mix(h, st.dive.depth);
    h = mix(h, st.skimmer ? st.skimmer.lane : -1);
    h = mix(h, st.skimmer && st.skimmer.dead ? 1 : 0);

    h = mix(h, st.shots.length);
    for (let k = 0; k < st.shots.length; k++) {
      h = mix(h, st.shots[k].lane);
      h = mix(h, st.shots[k].t);
    }

    if (st.enemies.length > lastRun.maxEnemies) lastRun.maxEnemies = st.enemies.length;
    if (st.level > lastRun.level) lastRun.level = st.level;
    h = mix(h, st.enemies.length);
    for (let k = 0; k < st.enemies.length; k++) {
      const e = st.enemies[k];
      if (e instanceof X.Carrier) lastRun.sawCarrier = true;
      else if (e instanceof X.WeaverBolt) lastRun.sawBolt = true;
      else if (e instanceof X.Weaver) lastRun.sawWeaver = true;
      else if (e instanceof X.Thorn) lastRun.sawThorn = true;
      else if (e instanceof X.Drifter) lastRun.sawDrifter = true;
      else if (e instanceof X.Surger) lastRun.sawSurger = true;

      h = mix(h, e.lane);
      h = mix(h, e.depth);
      h = mix(h, e.dead ? 1 : 0);
      h = mix(h, e.hopping ? 1 : 0);
      h = mix(h, num(e.hopTime));
      h = mix(h, num(e.hopTimer));
      h = mix(h, num(e.dir));
      h = mix(h, cargoNames.indexOf(e.cargo));
      h = mix(h, PHASES.indexOf(e.phase));
      h = mix(h, num(e.holdTimer));
      h = mix(h, e.fired ? 1 : 0);
      h = mix(h, e.thorn ? 1 : 0);
      h = mix(h, e.anchored ? 1 : 0);
      h = mix(h, num(e.rideTimer));
      h = mix(h, num(e.crossTime));
      h = mix(h, num(e.crossFrom));
      h = mix(h, num(e.crossDelta));
      h = mix(h, num(e.surgeTimer));
      h = mix(h, num(e.killDepth));
    }
  }
  lastRun.restarts = restarts;
  return h >>> 0;
}

if (HASH_ONLY) {
  process.stdout.write(String(hashRun(SEED)));
  process.exit(0);
}

// ⛔ THE FORBIDDEN-KEY LIST, CHECKED AGAINST THE FUNCTION rather than trusted.
// "r" restarts on a time-derived seed, "w" cycles the well out from under the
// level clock — and out from under a dive — and a digit is a debug spawn. Same
// superset test-cs005-p5.js carries: "5" and "6" are bound, so a list that
// stops at "4" has stopped being exhaustive.
const FORBIDDEN = ["r", "w", "0", "1", "2", "3", "4", "5", "6"];
const pressed = new Set();
const recorder = {
  keyDown: k => pressed.add(k),
  keyUp: k => pressed.add(k),
  mouseMove: () => {},
};
for (let i = 0; i < TICKS; i++) { replay(recorder, i); replayWide(recorder, i); replayPassive(recorder, i); }
H.assert(pressed.size > 0, "the recorded input lists press something at all");
for (const k of FORBIDDEN) {
  H.assert(!pressed.has(k),
           `⛔ no driver in this file ever presses "${k}" — "r" reseeds from the clock, ` +
           `"w" cycles the well out from under a dive, and a digit is a debug spawn`);
}
H.assert(pressed.has(" "),
         "and the two firing drivers really do press fire — the passive driver's claim " +
         "below is a contrast, not the only thing measured");

const hashA = hashRun(SEED);
const hashB = hashRun(SEED);
H.eq(hashA, hashB,
     `${TICKS} ticks of the recorded input list hash identically in one process`);

const child = execFileSync(process.execPath, [__filename, "--hash-only"],
  { cwd: ROOT, encoding: "utf8", stdio: "pipe" }).trim();
H.eq(Number(child), hashA, `${TICKS} ticks hash identically across two processes`);

// ⛔ SNAPSHOT THE HASHED RUN'S BOOKKEEPING BEFORE THE DIFFERENT-SEED CASE.
// REPAIRED, CS007 P1 — a fixture, not an assertion. `lastRun` is overwritten by
// every hashRun(), so the checks below read whatever ran LAST, and the line
// above runs SEED + 1. Every one of them says "the hashed run", so they were
// always about the SEED run; on SEED + 1 they were describing a run nothing
// else in this file looks at. CS007 P1's threats split is what exposed it —
// wells now progress instead of stalling, so on SEED + 1 the scripted player
// survives 913 ticks past this window (MEASURED: first stop at tick 10,913,
// window 10,000) and `restarts` came back 0. ⛔ This RESTORES the precondition
// the assertions were always about rather than relaxing one: nothing in
// hashRun() changed, so the hash itself does not move.
const hashed = Object.assign({}, lastRun);

H.assert(hashRun(SEED + 1) !== hashA, "a different seed produces a different hash");

// ⛔ AND THE HASHED RUN DIVED — trap 4. Everything above is a claim about a
// beat, and without these it is a claim about a beat that never ran.
H.assert(hashed.maxEnemies > 0, "the hashed run had enemies on the board");
H.assert(hashed.level > 1, "and cleared at least one well");
H.assert(hashed.restarts > 0, "and reached the game-over stop at least once");
H.assert(hashed.divesStarted > 0, "⛔ and a dive STARTED inside the hashed window");
H.assert(hashed.divesCompleted > 0,
         `⛔ and one COMPLETED — active fell and the level advanced, which is the only ` +
         `exit updateDive() has (started ${hashed.divesStarted}, ` +
         `completed ${hashed.divesCompleted})`);
H.assert(hashed.sawDescent,
         "⛔ and the descent beat ran — a window that only ever saw `grace` would hash " +
         "a dive.depth that never left 1");
H.assert(hashed.diveTicks > 100,
         `⛔ and the dive is a real slice of the window, not a single step ` +
         `(${hashed.diveTicks} of ${TICKS} ticks)`);
H.assert(hashed.sawCarrier && hashed.sawWeaver && hashed.sawThorn &&
         hashed.sawDrifter && hashed.sawSurger,
         "and the six-kind board was live inside it — the Weaver in particular, " +
         "because it is the only source of the Dive's only hazard");

// ---------------------------------------------------------------------------
// everything below shares one build
// ---------------------------------------------------------------------------

installSeed(SEED);
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const state = X.state;
const DT = C.FIXED_DT;

// First NaN anywhere reachable from `state`, as a path, or null. Functions are
// skipped (state.rng is a live closure, and calling it would consume a draw).
function firstNaN(v, label, depth) {
  if (depth > 6) return null;
  if (typeof v === "number") return Number.isNaN(v) ? label : null;
  if (v === null || typeof v !== "object") return null;
  if (Array.isArray(v)) {
    for (let i = 0; i < v.length; i++) {
      const hit = firstNaN(v[i], `${label}[${i}]`, depth + 1);
      if (hit) return hit;
    }
    return null;
  }
  for (const k of Object.keys(v)) {
    if (typeof v[k] === "function") continue;
    const hit = firstNaN(v[k], `${label}.${k}`, depth + 1);
    if (hit) return hit;
  }
  return null;
}

// ---------------------------------------------------------------------------
// GDD §17 item 12 — RUNS seeded runs to the stop, with the Dive in the middle
// ---------------------------------------------------------------------------
//
// GDD §17 asks for a hundred; twenty is what a closing phase can afford on every
// commit, which is the budget test-cs004-p5.js and test-cs005-p5.js set.
//
// ⛔ THE TWO FIXTURES ARE BOTH RAISED HERE — traps 1 and 2 — and this is the
// first soak in the project that needs the second one for a reason of its own.
// A dive with no Thorn in it is a 2.6 s pause: the hazard exists only if a
// Weaver survived long enough to lay one, and the concurrency block is what
// stops Weavers reaching the board at all once three Thorns are standing.
const SHIPPED_KINDS = C.DEBUG_SPAWN_KINDS.slice();
const SHIPPED_CONCURRENT = C.ENEMY_CONCURRENT;

let threw = null, stuck = null;
let soakMaxEnemies = 0, soakMaxShots = 0, soakNaN = null, soakLevels = 0;
let diveGrew = null, diveLoose = null, diveShot = null, diveDepthOut = null;
let divesStarted = 0, divesCompleted = 0, divesWithSurvivor = 0, diveDeaths = 0;
let worstDiveLives = 0, worstDiveSeed = 0;

for (let r = 0; r < RUNS && !threw && !stuck; r++) {
  const seed = (SEED + r * 104729) >>> 0;
  try {
    G.reset();
    X.startGame(seed);
    C.DEBUG_SPAWN_KINDS = MIXED.slice();
    C.ENEMY_CONCURRENT = C.ENEMY_CAP;

    let ticks = 0;
    let wasActive = false, levelAtDiveStart = state.level;
    let prevLen = 0, livesLostInDive = 0;

    while (state.screen !== "gameover" && ticks < RUN_CAP) {
      const livesBefore = state.lives;
      replayWide(G.input, ticks);
      G.update(DT);
      ticks++;

      const active = state.dive.active;
      if (active && !wasActive) {
        divesStarted++;
        levelAtDiveStart = state.level;
        livesLostInDive = 0;
        prevLen = state.enemies.length;
        // ⛔ Trap 5, the direction a filter bug does NOT show up in. A dive
        // that began with a survivor is a dive whose filter kept the anchored
        // side; a build that kept the wrong side leaves an empty board here
        // and every hazard assertion below passes vacuously.
        if (state.enemies.length > 0) divesWithSurvivor++;
      }
      if (!active && wasActive && state.level === levelAtDiveStart + 1) divesCompleted++;

      if (active) {
        // ⛔ Trap 5, the direction it does. Nothing is spawned during a dive —
        // no spawner, no entity pass, so no lay and no split — so the array can
        // only ever shrink, and it shrinks only by the termination guarantee.
        if (state.enemies.length > prevLen) {
          diveGrew = diveGrew || `seed ${seed} tick ${ticks}: ${prevLen} -> ${state.enemies.length}`;
        }
        prevLen = state.enemies.length;

        // ⛔ EVERY SURVIVOR IS ANCHORED, read off the contract field and never a
        // class name (GDD §6.5). This is the assertion a WeaverBolt would trip:
        // it ships blocksClear = false, so a well clears with one travelling.
        for (let k = 0; k < state.enemies.length; k++) {
          const e = state.enemies[k];
          if (!e.anchored) diveLoose = diveLoose || `${e.constructor.name} at tick ${ticks} of seed ${seed}`;
        }
        // GDD §5's ⚠ SETTLED half: in-flight shots are cleared at dive start,
        // and nothing fires during one.
        if (state.shots.length > 0) {
          diveShot = diveShot || `seed ${seed} tick ${ticks}: ${state.shots.length} shots`;
        }
        if (!(state.dive.depth >= 0 && state.dive.depth <= 1)) {
          diveDepthOut = diveDepthOut || `seed ${seed} tick ${ticks}: depth ${state.dive.depth}`;
        }
        if (livesBefore > state.lives) {
          livesLostInDive += livesBefore - state.lives;
          diveDeaths += livesBefore - state.lives;
          if (livesLostInDive > worstDiveLives) {
            worstDiveLives = livesLostInDive;
            worstDiveSeed = seed;
          }
        }
      }
      wasActive = active;

      if (state.enemies.length > soakMaxEnemies) soakMaxEnemies = state.enemies.length;
      if (state.shots.length > soakMaxShots) soakMaxShots = state.shots.length;
      if (!soakNaN) soakNaN = firstNaN(state, "state", 0);
    }
    if (state.screen !== "gameover") stuck = `seed ${seed} after ${ticks} ticks`;
    if (state.level > soakLevels) soakLevels = state.level;
  } catch (err) {
    threw = `seed ${seed}: ${err && err.message}`;
  }
}

H.assert(!threw, `⛔ ${RUNS} seeded runs to game over throw nothing (${threw})`);
H.assert(!stuck, `every run reached the stop inside ${RUN_CAP} ticks (${stuck})`);
H.assert(!soakNaN, `no NaN in state across the whole soak (${soakNaN})`);
H.assert(soakMaxEnemies <= C.ENEMY_CAP,
         `the enemy array stays under ENEMY_CAP across the soak (peak ${soakMaxEnemies})`);
H.assert(soakMaxShots <= C.SHOT_MAX,
         `the shot array stays under SHOT_MAX across the soak (peak ${soakMaxShots})`);
H.assert(soakLevels > 1, `the soak cleared at least one well (reached ${soakLevels})`);

// ⛔ THE ARRAY ACROSS A DIVE, BOTH DIRECTIONS — trap 5.
H.assert(!diveGrew,
         `⛔ state.enemies never GROWS during a dive — the spawner, the lay and the split ` +
         `are all downstream of the short-circuit (${diveGrew})`);
H.assert(!diveLoose,
         `⛔ and every entity alive during a dive is anchored — startDive() filtered on ` +
         `the CONTRACT FIELD and never a class name, so a travelling bolt cannot be ` +
         `aboard (${diveLoose})`);
H.assert(divesWithSurvivor > 0,
         `⛔ and at least one dive began with a survivor on the board — the direction a ` +
         `filter that kept the WRONG side would fail in, which is a board that empties ` +
         `rather than one that grows (${divesWithSurvivor} of ${divesStarted})`);
H.assert(!diveShot,
         `⛔ no shot exists at any point in a dive — GDD §5's ⚠ SETTLED clear, and nothing ` +
         `fires under a short-circuited pass (${diveShot})`);
H.assert(!diveDepthOut, `dive.depth never leaves [0, 1] (${diveDepthOut})`);

// ⛔ AND DIVE DEATHS DO NOT LOOP. The naive respawn burns a life every
// RESPAWN_INVULN forever (11-dive.js); the guarantee is that every strike
// either lands the craft somewhere safe or removes one Thorn, and there are
// finitely many. ⚠ MEASURED WORST IS EXACTLY 2, at seed 21622307 — the bound is
// not slack, and a red here means a retune moved the guarantee, not that the
// number was arbitrary. A third life inside one dive is the loop.
H.assert(divesStarted > 0 && divesCompleted > 0,
         `⛔ dives ran and completed across the soak (${divesStarted} started, ` +
         `${divesCompleted} completed)`);
H.assert(diveDeaths > 0,
         `⛔ and at least one of them cost a life — without a strike anywhere in the soak ` +
         `the loop guard below is a claim about a path that was never taken ` +
         `(${diveDeaths} across ${divesStarted} dives)`);
H.assert(worstDiveLives <= 2,
         `⛔ no run loses more than two lives inside ONE dive sequence — the death loop ` +
         `guard, on a live board (worst ${worstDiveLives}, seed ${worstDiveSeed})`);

// ---------------------------------------------------------------------------
// ⛔ A RUN THAT NEVER PRESSES FIRE STILL TERMINATES
// ---------------------------------------------------------------------------
//
// ⚠ AND IT TERMINATES BY DYING, NOT BY DIVING — measured, and worth writing
// down because it is the opposite of what the phase prompt expected. A well
// clears on `quota spent AND nothing that blocks the clear alive`, and a player
// who never fires kills nothing, so a passive run never reaches a dive at all:
// state.level is 1 at the stop on every seed below. The Dive cannot rescue a
// passive run; the game-over stop is what ends it.
let passiveStuck = null, passiveLevels = 0, passiveTicks = 0;
for (let r = 0; r < 4 && !passiveStuck; r++) {
  const seed = (SEED + r * 31337) >>> 0;
  G.reset();
  X.startGame(seed);
  C.DEBUG_SPAWN_KINDS = MIXED.slice();
  C.ENEMY_CONCURRENT = C.ENEMY_CAP;
  let ticks = 0;
  while (state.screen !== "gameover" && ticks < RUN_CAP) {
    replayPassive(G.input, ticks);
    G.update(DT);
    ticks++;
  }
  if (state.screen !== "gameover") passiveStuck = `seed ${seed} after ${ticks} ticks`;
  if (state.level > passiveLevels) passiveLevels = state.level;
  if (ticks > passiveTicks) passiveTicks = ticks;
}
H.assert(!passiveStuck,
         `⛔ a run that never presses fire still reaches the stop inside ${RUN_CAP} ticks — ` +
         `a passive stall is the shape of every stall this project has found (${passiveStuck})`);
H.assert(passiveTicks > 0 && passiveTicks < RUN_CAP,
         `and it gets there in ${passiveTicks} ticks or fewer, not on the cap`);

// ---------------------------------------------------------------------------
// ⛔ THE FIXTURES GO BACK, AND THEY ARE ASSERTED BACK
// ---------------------------------------------------------------------------
//
// Leaving either raised would make every case below a different game from the
// one that ships — and the RNG section below is the one that would notice, so
// the restore comes first and is checked before it runs.
C.DEBUG_SPAWN_KINDS = SHIPPED_KINDS.slice();
C.ENEMY_CONCURRENT = SHIPPED_CONCURRENT;
H.assert(JSON.stringify(C.DEBUG_SPAWN_KINDS) === JSON.stringify(["vaulter"]),
         "⛔ the soak's kind fixture is put back to the shipped one-entry list");
H.eq(C.ENEMY_CONCURRENT, 3, "⛔ and the concurrency fixture is put back");
H.eq(C.ENEMY_CAP, 16, "⛔ and C.ENEMY_CAP was never touched — it is a readability ceiling");

// ---------------------------------------------------------------------------
// ⛔ THE NO-DRAW RULE AS A COUNT, WHICH IS THE FORM THAT SURVIVES A RETUNE
// ---------------------------------------------------------------------------
//
// test-cs004-p1.js's GOLDEN_LANES is a recorded sequence, and a recorded
// sequence is at its weakest the moment somebody re-records it: every future
// spawner retune legitimately moves it, and a stray draw hides inside a
// legitimate move. ⛔ THIS IS THE ABSOLUTE FORM OF THE SAME CLAIM. An interval
// spawn spends exactly pickSpawnLane's bounded [1, C.SPAWN_LANE_TRIES] plus
// spawnEnemy's ONE heading draw, and — while C.DEBUG_SPAWN_KINDS has one entry
// — no third. It needs no baseline and survives every retune.
//
// ⛔ THIS FILE OWNS THE FORM, NOT THE GOLDEN. GOLDEN_LANES is green and on its
// original recording from 9ebd27b; CS006 did not move it and did not re-record
// it. CS007's introduction schedule is what legitimately moves it, and this is
// the assertion that lets it be replaced rather than merely re-recorded
// (PLANNED-FEATURES-CS006.md, H6).
function countingRun(kinds, ticks) {
  G.reset();
  X.startGame(SEED);
  C.DEBUG_SPAWN_KINDS = kinds.slice();

  // ⛔ WRAPPED AFTER startGame(), because startGame() rebuilds state.rng from
  // state.seed — a proxy installed before it is thrown away by it. Every draw
  // site in the build reads `state.rng` at call time (08-spawner.js,
  // 23-main.js), so the field IS the seam.
  const real = state.rng;
  let draws = 0;
  state.rng = () => { draws++; return real(); };

  const seen = new Set(state.enemies);
  const out = { perSpawn: [], idleDraws: 0, diveDraws: 0, diveTicks: 0, extra: 0 };
  for (let i = 0; i < ticks && state.screen !== "gameover"; i++) {
    replay(G.input, i);
    const before = draws;
    const wasDive = state.dive.active;
    G.update(DT);
    const spent = draws - before;

    let added = 0;
    for (const e of state.enemies) if (!seen.has(e)) { seen.add(e); added++; }

    if (wasDive || state.dive.active) { out.diveTicks++; out.diveDraws += spent; }
    if (added === 1) out.perSpawn.push(spent);
    else if (added === 0) out.idleDraws += spent;
    else out.extra++;                       // more than one arrival in a tick
  }
  state.rng = real;
  return out;
}

// ⛔ ONE ENTRY. Only the interval spawner puts anything on the board — a
// Vaulter neither splits nor lays — so a tick's draws are attributable to the
// spawn that happened in it and to nothing else.
const one = countingRun(["vaulter"], 6000);
H.assert(one.perSpawn.length >= 8,
         `the counting run actually spawned (${one.perSpawn.length} interval spawns)`);
H.eq(one.extra, 0,
     "and no tick added two entities — a Vaulter neither splits nor lays, so every " +
     "tick's draws belong to at most one spawn");
const oneMin = Math.min(...one.perSpawn);
const oneMax = Math.max(...one.perSpawn);
H.assert(oneMin >= 2,
         `⛔ every interval spawn spends AT LEAST 2 draws — pickSpawnLane's first plus ` +
         `spawnEnemy's heading (min ${oneMin})`);
H.assert(oneMax <= 1 + C.SPAWN_LANE_TRIES,
         `⛔ and AT MOST 1 + C.SPAWN_LANE_TRIES — pickSpawnLane is bounded and settles for ` +
         `its last draw rather than looping (max ${oneMax}, bound ${1 + C.SPAWN_LANE_TRIES})`);
H.eq(one.idleDraws, 0,
     "⛔ and a tick that spawned nothing spends NOTHING — including a blocked or refused " +
     "beat, which must not spend a lane draw it cannot use");
H.assert(one.diveTicks > 0 && one.diveDraws === 0,
         `⛔ AND A DIVE SPENDS ZERO DRAWS on a live board — the strike, the respawn-lane ` +
         `walk and the repeat are all deterministic (${one.diveTicks} dive ticks, ` +
         `${one.diveDraws} draws)`);

// ⛔ THE CONTROL, AND IT IS WHAT MAKES "no third draw" MEAN ANYTHING — trap 6.
// Two entries of the SAME kind: pickSpawnKind now faces a genuine choice and
// spends its draw, and nothing else about the board changes — no Carrier to
// split, no Weaver to lay. The difference between the two runs is therefore
// exactly one draw, and it is provably the kind pick's.
const two = countingRun(["vaulter", "vaulter"], 6000);
H.assert(two.perSpawn.length >= 8, `the control run spawned too (${two.perSpawn.length})`);
H.eq(Math.min(...two.perSpawn), oneMin + 1,
     "⛔ a two-entry list spends exactly ONE draw more per spawn — so the one-entry case " +
     "above is a measured absence and not a vacuous pass");
H.eq(two.idleDraws, 0, "and the control spends nothing on a tick that spawned nothing");

// ⛔ AND THE SUM IS DECOMPOSED, so a stray draw is caught at the component that
// grew rather than only in the total. Each of the three is counted directly on
// the shipped function, which is the form that needs no baseline at all.
G.reset();
X.startGame(SEED);
C.DEBUG_SPAWN_KINDS = SHIPPED_KINDS.slice();
state.enemies = [];
let fnDraws = 0;
const realFn = state.rng;
state.rng = () => { fnDraws++; return realFn(); };

fnDraws = 0;
X.pickSpawnKind(state);
H.eq(fnDraws, 0,
     "⛔ pickSpawnKind spends ZERO draws on the shipped one-entry list — there is no " +
     "choice to make, so no randomness is spent making it");

C.DEBUG_SPAWN_KINDS = ["vaulter", "vaulter"];
fnDraws = 0;
X.pickSpawnKind(state);
H.eq(fnDraws, 1, "and exactly ONE on a two-entry list — rngPick's");
C.DEBUG_SPAWN_KINDS = SHIPPED_KINDS.slice();

fnDraws = 0;
const probe = X.spawnEnemy("vaulter", 3, 0.2);
H.assert(probe !== null, "the heading probe actually spawned");
H.eq(fnDraws, 1,
     "⛔ spawnEnemy spends EXACTLY ONE draw — the heading, drawn there rather than in " +
     "the caller so every spawn spends the same and the stream stays aligned");

state.enemies = [];
fnDraws = 0;
X.pickSpawnLane(state, X.WELLS[state.wellIndex]);
H.eq(fnDraws, 1, "⛔ and pickSpawnLane spends exactly one on an uncrowded board");
state.rng = realFn;

// ⛔ AND THE UPPER BOUND IS REAL, proved on the function rather than waited for:
// C.SPAWN_INTERVAL is 1.60 s, so in ordinary play an enemy has climbed out of
// the throat zone before the next beat and the redraw never fires — measured,
// which is why the live runs above only ever see the floor. A board where EVERY
// lane is crowded is what exercises it, and pickSpawnLane must settle for its
// last draw rather than loop.
G.reset();
X.startGame(SEED);
const cWell = X.WELLS[state.wellIndex];
state.enemies = [];
for (let L = 0; L < cWell.lanes; L++) X.spawnEnemy("vaulter", L, C.READABILITY_DEPTH * 0.5);
H.eq(state.enemies.length, cWell.lanes, "every lane of the counting well is crowded");
let laneDraws = 0;
const realLane = state.rng;
state.rng = () => { laneDraws++; return realLane(); };
X.pickSpawnLane(state, cWell);
state.rng = realLane;
H.eq(laneDraws, C.SPAWN_LANE_TRIES,
     "⛔ a fully crowded board spends exactly C.SPAWN_LANE_TRIES lane draws and then " +
     "SETTLES — bounded, never a board-dependent search");

// The fixtures, once more, after the last case that touched them.
C.DEBUG_SPAWN_KINDS = SHIPPED_KINDS.slice();
H.assert(JSON.stringify(C.DEBUG_SPAWN_KINDS) === JSON.stringify(["vaulter"]),
         "⛔ and the shipped kind list is what this file leaves behind");
H.eq(C.ENEMY_CONCURRENT, SHIPPED_CONCURRENT,
     "⛔ and the shipped concurrency knob is what this file leaves behind");

H.report("test-cs006-p5.js");
