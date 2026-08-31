// test-cs003-p5.js — CS003's closing phase: the two GDD §17 invariants no
// build phase can own alone (items 1 and 3), plus a short seeded soak.
//
// Item 1 was trivially true before this changeset — the build contained no
// randomness at all. It is a real claim now, so the hash includes the enemy
// array. Item 3 is the reason the whole (lane, depth) model exists (GDD 3.5).
//
// ⛔ FOUR TRAPS IN THE FIXTURES.
//  1. The recorded input list must never press "r". That named action calls
//     startGame() with NO argument, which takes a time-derived seed — one press
//     turns the determinism case into a coin flip that usually passes.
//  2. A run reaches the game-over stop inside the window, after which update()
//     returns early and the remaining ticks hash nothing new. The determinism
//     run restarts through the real startGame() with a seed derived from its
//     own, so every tick is a live one. ⛔ CS006 P3 MOVED THAT WINDOW: the Dive
//     is ~1,100 ticks of safe time per 10,000, which pushed this run's first
//     stop from inside 10,000 ticks to tick 10,091 — see TICKS below.
//  3. The open-well soak tops up `spawn.remaining` and `lives` every tick.
//     Both are fixtures to hold the well open, not weakened assertions: a
//     cleared well advances to the next shape and the stop freezes the board,
//     and either one ends the soak early in a well it was not aimed at.
//  4. Levels are chosen so shapeIndex lands on the intended well AND is at
//     least C.VAULT_FIRST_LEVEL, or nothing mid-climb ever vaults.
"use strict";

const path = require("path");
const { execFileSync } = require("child_process");

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");
const { COUNTS } = require("./test-registry.js");

const ROOT = path.join(__dirname, "..");
const SEED = 20260830;
// ⛔ TWELVE THOUSAND, AND GDD 17 ITEM 1 ASKS FOR TEN. The extra two thousand are
// not slack: item 1's claim is a MINIMUM and a longer run only strengthens it,
// but trap 2's non-vacuity guard below — "the restart path is in the hash" —
// needs the run to actually reach the stop, and CS006 P3's Dive spends ~1,100
// of every 10,000 ticks in a beat where nothing can kill the player. That moved
// this seed's first game-over to tick 10,091, ninety-one ticks outside the old
// window. ⛔ Raise this, never lower the guard.
const TICKS = 12000;        // GDD 17 item 1 (which asks for 10,000)
const SOAK_TICKS = 5000;    // GDD 17 item 3
const RUNS = 20;
const RUN_CAP = 20000;      // ticks before a run is declared stuck
const HASH_ONLY = process.argv.includes("--hash-only");

// ---------------------------------------------------------------------------
// GDD 17 item 1 — determinism, with the enemy array in the hash
// ---------------------------------------------------------------------------

// FNV-1a over the bit pattern of each value, so a 1-ulp drift is a different
// hash. Deliberately the same mixer test-cs002-p1.js uses — a shared copy in
// _harness.js would make one hash function two phases' to keep stable, and
// these two cases are meant to be able to disagree.
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

// THE recorded input list: a pure function of the tick index, so both runs and
// both processes replay the same presses. It rotates, holds fire (so enemies
// die, wells clear and nextWell() runs), and spends the odd Purge.
//
// ⛔ NO "r" AND NO "w". "r" restarts with a time-derived seed; "w" cycles the
// well out from under the level clock. Both are debug actions, and neither
// belongs in a list that is supposed to be replayable.
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

// What the last hashRun() actually did. Hashing an array that is always empty
// is a case that cannot fail, so the parent asserts on these afterwards.
const lastRun = { maxEnemies: 0, restarts: 0, level: 0 };

// One full run, hashed every tick rather than only at the end: a divergence
// that heals — or one that lands in a stretch the run later freezes over —
// still moves the hash.
function hashRun(gameSeed) {
  installSeed(gameSeed);
  const X = H.buildGame();
  const C = X.C, G = X.Game, st = X.state;
  const DT = C.FIXED_DT;

  G.reset();
  X.startGame(gameSeed);

  let h = 2166136261 >>> 0;
  let restarts = 0;
  lastRun.maxEnemies = 0;
  lastRun.level = 0;
  for (let i = 0; i < TICKS; i++) {
    replay(G.input, i);
    G.update(DT);

    // Trap 2: the stop, restarted deterministically so the rest of the ticks
    // are live ones. Through the real startGame(), with an explicit seed.
    if (st.screen === "gameover") {
      restarts++;
      X.startGame((gameSeed + restarts * 7919) >>> 0);
    }

    h = mix(h, st.time);
    h = mix(h, st.level);
    h = mix(h, st.wellIndex);
    h = mix(h, st.seed);
    h = mix(h, st.lives);
    h = mix(h, st.invulnTime);
    h = mix(h, st.purgeUses);
    h = mix(h, st.spawn.timer);
    h = mix(h, st.spawn.remaining);
    // ⛔ CS006 P3: state.clearHold was DELETED and the Dive replaced it, so the
    // between-wells beat is hashed through the field that carries it now.
    // Dropping it instead would have silently stopped covering the one part of
    // a run this soak spends the most consecutive ticks in.
    h = mix(h, st.dive.timer);
    h = mix(h, st.dive.depth);
    h = mix(h, st.skimmer ? st.skimmer.lane : -1);
    h = mix(h, st.skimmer && st.skimmer.dead ? 1 : 0);

    h = mix(h, st.shots.length);
    for (let k = 0; k < st.shots.length; k++) {
      h = mix(h, st.shots[k].lane);
      h = mix(h, st.shots[k].t);
    }

    // ⛔ THE ENEMY ARRAY — the thing that made this test non-trivial. Position
    // first, then the hop state, which is where a stale heading would show up.
    if (st.enemies.length > lastRun.maxEnemies) lastRun.maxEnemies = st.enemies.length;
    if (st.level > lastRun.level) lastRun.level = st.level;
    h = mix(h, st.enemies.length);
    for (let k = 0; k < st.enemies.length; k++) {
      const e = st.enemies[k];
      h = mix(h, e.lane);
      h = mix(h, e.depth);
      h = mix(h, e.dead ? 1 : 0);
      h = mix(h, e.hopping ? 1 : 0);
      h = mix(h, e.hopTime);
      h = mix(h, e.hopTimer);
      h = mix(h, e.dir);
    }
  }
  lastRun.restarts = restarts;
  return h >>> 0;
}

if (HASH_ONLY) {
  process.stdout.write(String(hashRun(SEED)));
  process.exit(0);
}

const hashA = hashRun(SEED);
const hashB = hashRun(SEED);
H.eq(hashA, hashB,
     `${TICKS} ticks of the recorded input list hash identically in one process`);

const child = execFileSync(process.execPath, [__filename, "--hash-only"],
  { cwd: ROOT, encoding: "utf8", stdio: "pipe" }).trim();
H.eq(Number(child), hashA, `${TICKS} ticks hash identically across two processes`);

// A different seed must move the hash, or the two cases above prove nothing:
// they would pass just as well over a build with no randomness in it, which is
// exactly what this file exists to stop being true.
H.assert(hashRun(SEED + 1) !== hashA, "a different seed produces a different hash");

// ⛔ And the run being hashed is not a quiet one. An enemy array that is empty
// for all 10,000 ticks hashes its own length and nothing else, and the case
// above would pass over a build whose spawner never fired.
H.assert(lastRun.maxEnemies > 0, "the hashed run had enemies on the board");
H.assert(lastRun.level > 1, "and cleared at least one well — nextWell() is in the hash");
H.assert(lastRun.restarts > 0,
         "and reached the game-over stop at least once — the restart path is in the hash");

// ---------------------------------------------------------------------------
// everything below shares one build
// ---------------------------------------------------------------------------

installSeed(SEED);
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const state = X.state;
const DT = C.FIXED_DT;

// The kind table, against the one file that may name a global count. CS004
// raises it as the remaining Classic enemies land.
//
// ⚠ COUNTS.enemyKinds, NOT COUNTS.enemies, AND CS004 P3 IS WHERE THE TWO PARTED.
// This line counts ENEMY_KINDS rows; COUNTS.enemies counts GDD 6.1 ROSTER rows,
// and a row is not an enemy twice over — one row per Carrier VARIANT, and the
// Weaver's bolt is a kind with no roster entry at all. The registry carries both
// numbers and says which is which.
H.assert(X.ENEMY_KINDS !== null, "the spawner's kind table is in the build");
H.eq(Object.keys(X.ENEMY_KINDS).length, COUNTS.enemyKinds,
     "the build ships exactly the kinds the registry counts");

// ---------------------------------------------------------------------------
// GDD 17 item 3 — ⛔ no lane leaves [0, lanes-1] on any open well
// ---------------------------------------------------------------------------
//
// Written against GDD 3.5's named bug: clamping the player but leaving enemy
// hopping to wrap produces enemies that teleport across the well. Everything
// on the board is checked — enemies, shots and the craft — plus every point
// each of them projects to, and the two array ceilings.

const OPEN = X.WELLS.filter(w => !w.closed);
H.eq(OPEN.length, COUNTS.openWells, "the soak covers every open well");

// ⛔ THE RANGE CHECK ALONE DOES NOT CATCH GDD 3.5's BUG. A hop that wraps on a
// 13-lane strip sends lane 12 to lane 0, and lane 0 is inside [0, 12] — the
// enemy teleports across the well without ever leaving the legal range. The
// tell is the SPEED: one hop crosses exactly one lane over C.VAULT_HOP_TIME,
// so no single tick may move an enemy further than that. The factor of two is
// slack for the exact landing step, and the bound is derived from the
// constants rather than picked, so a retune of either moves it.
const MAX_LANE_STEP = 2 * DT / C.VAULT_HOP_TIME;

const _pt = { x: 0, y: 0 };
function badPoint(p) { return !isFinite(p.x) || !isFinite(p.y); }
function badPoints(pts) {
  for (let i = 0; i < pts.length; i++) if (badPoint(pts[i])) return true;
  return false;
}

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

// Adversarial, and it fires: the rotation slams the craft into both walls, and
// the fire is what makes enemies die rather than merely accumulate.
//
// ⛔ THE MOUSE IS PINNED TO ONE WALL FOR STRETCHES AT A TIME, alternating every
// PIN_TICKS. A purely random walk leaves the craft loitering near the middle of
// the well, and a rim-hunting Vaulter then has no reason to chase into an end
// lane at all — which is the only thing that puts a hopper against the wall
// this soak exists to test. ±4000 px is ±88 lanes at C.MOUSE_SENS, far more
// than any well has.
const PIN_TICKS = 300;      // ~5 s pinned to one end, then the other
function adversarial(input, i, r) {
  const pin = (Math.floor(i / PIN_TICKS) % 2) ? 4000 : -4000;
  if (r < 0.45)      input.mouseMove(pin);
  else if (r < 0.55) input.mouseMove((Math.random() * 2 - 1) * 4000);
  else if (r < 0.62) input.keyDown("ArrowRight");
  else if (r < 0.69) input.keyUp("ArrowRight");
  else if (r < 0.76) input.keyDown("ArrowLeft");
  else if (r < 0.83) input.keyUp("ArrowLeft");
  else if (r < 0.93) input.keyDown(" ");
  else if (r < 0.97) input.keyUp(" ");
  // above 0.97: a quiet tick, so snap assist gets to run at the wall too
}

for (const well of OPEN) {
  const idx = X.WELLS.indexOf(well);
  const hi = well.lanes - 1;

  // ⛔ Through the real lifecycle. Trap 4: level idx+1 has shapeIndex idx, and
  // idx is at least 7 here, so mid-climb vaulting is on (C.VAULT_FIRST_LEVEL).
  G.reset();
  X.startGame(SEED + idx);
  state.level = idx;
  X.nextWell();
  H.eq(state.wellIndex, idx, `${well.name}: nextWell() lands on the intended shape`);
  H.assert(state.level >= C.VAULT_FIRST_LEVEL,
           `${well.name}: the soak runs above VAULT_FIRST_LEVEL — vaulting is on`);

  let laneOut = null, notFinite = null, depthOut = null;
  let nanPath = null, projBad = null;
  let maxEnemies = 0, maxShots = 0;
  let sawSpawn = false, sawKill = false, sawDeath = false;
  let sawEndLane = false, sawRim = false;
  let teleported = null;

  const lanes = new Map();     // enemy -> the lane it held last tick
  let alive = new Set();

  for (let i = 0; i < SOAK_TICKS; i++) {
    adversarial(G.input, i, Math.random());
    // Trap 3. Fixtures, not weakened assertions.
    state.spawn.remaining = C.SPAWN_QUOTA;
    state.lives = C.START_LIVES;

    G.update(DT);

    if (state.lives < C.START_LIVES) sawDeath = true;
    if (state.enemies.length > maxEnemies) maxEnemies = state.enemies.length;
    if (state.shots.length > maxShots) maxShots = state.shots.length;

    const nowAlive = new Set(state.enemies);
    for (const e of alive) if (!nowAlive.has(e)) sawKill = true;
    for (const e of nowAlive) if (!alive.has(e)) sawSpawn = true;
    alive = nowAlive;

    for (let k = 0; k < state.enemies.length; k++) {
      const e = state.enemies[k];
      if (!isFinite(e.lane) || !isFinite(e.depth)) { notFinite = notFinite || `enemy ${e.lane}`; continue; }
      // ⛔ EXACT bounds, no epsilon. Every write to an enemy's lane goes
      // through laneNormalize, which on an open well is a clamp — a value a
      // hair outside is a hop that bypassed the helper.
      if (e.lane < 0 || e.lane > hi) laneOut = laneOut || `enemy at lane ${e.lane}`;
      if (e.depth < 0 || e.depth > 1) depthOut = depthOut || `enemy at depth ${e.depth}`;
      if (e.lane === 0 || e.lane === hi) sawEndLane = true;
      if (e.depth >= 1) sawRim = true;

      const wasLane = lanes.get(e);
      if (wasLane !== undefined && Math.abs(e.lane - wasLane) > MAX_LANE_STEP) {
        teleported = teleported || `${wasLane} -> ${e.lane}`;
      }
      lanes.set(e, e.lane);

      if (badPoint(X.screenPos(well, e.lane, e.depth, _pt))) projBad = projBad || "enemy centre";
      if (badPoints(X.entityPoints(well, e.lane, e.depth, X.VAULTER_POLY, C.VAULTER_SIZE))) {
        projBad = projBad || "enemy silhouette";
      }
    }

    for (let k = 0; k < state.shots.length; k++) {
      const s = state.shots[k];
      if (!isFinite(s.lane)) notFinite = notFinite || "shot lane";
      if (s.lane < 0 || s.lane > hi) laneOut = laneOut || `shot at lane ${s.lane}`;
      if (badPoint(X.screenPos(well, s.lane, s.depth(), _pt))) projBad = projBad || "shot";
    }

    const sk = state.skimmer;
    if (!isFinite(sk.lane)) notFinite = notFinite || "skimmer lane";
    if (sk.lane < 0 || sk.lane > hi) laneOut = laneOut || `skimmer at lane ${sk.lane}`;
    if (badPoints(X.skimmerPoints(well, sk.lane, sk.squashAmount()))) projBad = projBad || "skimmer";

    if (!nanPath) nanPath = firstNaN(state, "state", 0);
  }

  H.assert(!laneOut,
    `${well.name}: ⛔ no entity's lane leaves [0, ${hi}] over ${SOAK_TICKS} ticks (${laneOut})`);
  H.assert(!notFinite, `${well.name}: every lane and depth is finite on every tick (${notFinite})`);
  H.assert(!depthOut, `${well.name}: no enemy leaves depth [0, 1] (${depthOut})`);
  H.assert(!teleported,
    `${well.name}: ⛔ no hop crosses the well — an open rim has walls, not a seam (${teleported})`);
  H.assert(!nanPath, `${well.name}: ⛔ no NaN anywhere in state (${nanPath})`);
  H.assert(!projBad, `${well.name}: ⛔ no NaN in any projected point (${projBad})`);
  H.assert(maxEnemies <= C.ENEMY_CAP,
    `${well.name}: the enemy array never passes ENEMY_CAP (peak ${maxEnemies})`);
  H.assert(maxShots <= C.SHOT_MAX,
    `${well.name}: the shot array never passes SHOT_MAX (peak ${maxShots})`);
  H.eq(state.wellIndex, idx, `${well.name}: the soak stayed in the well it was aimed at`);
  H.eq(state.screen, "play", `${well.name}: and never reached the stop`);

  // ⛔ And the soak was actually exercised. Without these, every assertion
  // above passes on an empty board — which is exactly how a wall-behaviour
  // test quietly stops testing the wall.
  H.assert(sawSpawn, `${well.name}: enemies spawned during the soak`);
  H.assert(sawKill, `${well.name}: and enemies died during it`);
  H.assert(sawDeath, `${well.name}: and the Skimmer was killed at least once`);
  H.assert(sawRim, `${well.name}: an enemy reached the rim — rim hunting ran`);
  // ⛔ The REVERSAL itself is test-cs003-p1.js's, driven against one Vaulter in
  // isolation where the bounce sequence is exactly observable. What that case
  // cannot show is that the rule survives a live well — a spawner, a collision
  // pass, deaths, respawns and a player slamming the craft into both ends. That
  // is this soak's claim, and reaching an end lane is what makes it non-vacuous.
  H.assert(sawEndLane, `${well.name}: an enemy reached an end lane — the wall was exercised`);
}

// ---------------------------------------------------------------------------
// a short seeded soak — RUNS runs to the game-over stop, no exception
// ---------------------------------------------------------------------------
//
// GDD 17 item 12 asks for a hundred; twenty is what a closing phase can afford
// to run on every commit, and the full soak lands with the systems that make a
// long run interesting. Each run is a different seed and is driven by the same
// recorded input list as the determinism case, so a failure here is replayable.

let threw = null, stuck = null;
let soakMaxEnemies = 0, soakMaxShots = 0, soakNaN = null, soakLevels = 0;

for (let r = 0; r < RUNS && !threw && !stuck; r++) {
  const seed = (SEED + r * 104729) >>> 0;
  try {
    G.reset();
    X.startGame(seed);
    let ticks = 0;
    while (state.screen !== "gameover" && ticks < RUN_CAP) {
      replay(G.input, ticks);
      G.update(DT);
      ticks++;
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
H.assert(soakLevels > 1, `the soak cleared at least one well — nextWell() ran (reached ${soakLevels})`);

H.report();
