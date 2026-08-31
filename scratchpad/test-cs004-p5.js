// test-cs004-p5.js — CS004's closing phase: the four GDD §17 items no build
// phase can own alone, re-verified against a board that now has four kinds on
// it (items 1, 3, 5 and 6), plus a seeded soak.
//
// It extends test-cs003-p5.js rather than restating it. That file owns the
// hash mixer, the recorded input list, the adversarial generator, the NaN
// walker and the teleport bound; the shapes below are deliberately the same so
// a reader who knows one knows the other. What is NEW here is what CS004 put on
// the board: a Carrier that splits from inside the collision pass, a Weaver
// that lays, a Thorn that is chipped, and a bolt that is fired.
//
// ⛔ SIX TRAPS IN THE FIXTURES.
//  1. C.DEBUG_SPAWN_KINDS ships as ["vaulter"], so with the shipped value NOT
//     ONE of CS004's entities ever reaches the board and every case below is
//     vacuous. Every run here sets the mixed list first, and the non-vacuity
//     assertions are what say it worked.
//  2. The recorded input list must press neither "r" (restarts on a
//     time-derived seed) nor "w" (cycles the well out from under the level
//     clock) nor any of the five DEBUG DIGITS — a spawn action inside a hashed
//     run makes the hash depend on a key map. That is asserted, not assumed.
//  3. The determinism hash must actually COVER the new entities. A Carrier's
//     cargo, a Weaver's phase and a Thorn's length are not numbers the CS003
//     hash reached for, and a hash blind to them would pass over a build that
//     had lost the split entirely.
//  4. ⛔ A range check does not catch GDD §3.5's bug — a wrapped hop on a
//     13-lane strip lands inside [0, 12]. CS003 catches it with a per-tick lane
//     SPEED bound. ⛔ For CS004's four entities the available assertion is
//     STRONGER AND SIMPLER: none of them hops, so `lane` is EXACTLY the lane it
//     entered with, on every tick. MAX_LANE_STEP stays the Vaulter's.
//  5. The open-well soak tops up `spawn.remaining` and `lives` every tick.
//     Fixtures to hold the well open, not weakened assertions.
//  6. Splits and lays make the board grow from INSIDE a tick, so every count
//     here is by class rather than by array length.
"use strict";

const path = require("path");
const { execFileSync } = require("child_process");

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");
const { COUNTS } = require("./test-registry.js");

const ROOT = path.join(__dirname, "..");
const SEED = 20260830;
const TICKS = 10000;        // GDD 17 item 1
const SOAK_TICKS = 5000;    // GDD 17 item 3
const RUNS = 20;            // GDD 17 item 12, at a closing phase's budget
const RUN_CAP = 30000;      // ticks before a run is declared stuck
const HASH_ONLY = process.argv.includes("--hash-only");

// ⛔ THE MIXED BENCH LIST — trap 1. The interval spawner releases these three;
// the other two CS004 entities arrive from inside the simulation, which is the
// point: a Thorn is LAID by a Weaver and a bolt is FIRED by one, and neither
// belongs in a list of things a well releases from its throat.
//
// ⚠ TEMPORARY, exactly as C.DEBUG_SPAWN_KINDS itself is. Whichever changeset
// lands GDD §8.1's introduction schedule deletes the constant, and this line
// becomes "run at a level where all four are introduced".
const MIXED = ["vaulter", "carrierVaulter", "weaver"];

// ---------------------------------------------------------------------------
// GDD 17 item 1 — determinism, with the new draws in it
// ---------------------------------------------------------------------------
//
// The Carrier's split spends TWO draws it did not spend before (one per child,
// inside spawnEnemy), the Weaver's bolt spends one, the Thorn spends one when
// it is laid, and pickSpawnKind spends one per interval spawn now that the list
// has more than one entry. Every one of them comes off the run's ONE stream, so
// the claim "same seed and same inputs, identical state" is a materially bigger
// claim than it was in CS003.

// FNV-1a over the bit pattern of each value, so a 1-ulp drift is a different
// hash. Deliberately a local copy, as test-cs003-p5.js's is: a shared mixer in
// _harness.js would make one function two phases' to keep stable, and these
// cases are meant to be able to disagree.
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
// argument into a Float64Array, and every non-number lands on the same NaN bit
// pattern — which would make a Weaver's absent hopTimer indistinguishable from
// a Carrier's absent cargo index. Deterministic either way; this way it is also
// readable.
function num(v) { return typeof v === "number" ? v : -1; }

// THE recorded input list, character for character test-cs003-p5.js's. It
// rotates, holds fire (so enemies die, wells clear and nextWell() runs), and
// spends the odd Purge. ⛔ NO "r", NO "w", NO DIGITS — trap 2, asserted below
// against this very function rather than trusted.
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
// is a case that cannot fail, so the parent asserts on these afterwards — and
// CS004 adds the four class flags, because a hash that never saw a Carrier
// proves nothing about the split.
const lastRun = {
  maxEnemies: 0, restarts: 0, level: 0,
  sawCarrier: false, sawWeaver: false, sawThorn: false, sawBolt: false,
};

// A Weaver's phase is a STRING, and the hash takes numbers. The index is the
// cycle's own order, so a phase machine that ran backwards would move the hash.
const PHASES = ["climb", "hold", "retreat"];

function hashRun(gameSeed) {
  installSeed(gameSeed);
  const X = H.buildGame();
  const C = X.C, G = X.Game, st = X.state;
  const DT = C.FIXED_DT;

  // Trap 1, and it has to happen before startGame so the very first spawn of
  // the run already draws a kind.
  C.DEBUG_SPAWN_KINDS = MIXED.slice();

  // Cargo names become indices the same way phases do, and off the CARGO table
  // rather than a literal, so CS005's two rows need no edit here.
  const cargoNames = Object.keys(X.CARGO);

  G.reset();
  X.startGame(gameSeed);

  let h = 2166136261 >>> 0;
  let restarts = 0;
  lastRun.maxEnemies = 0;
  lastRun.level = 0;
  lastRun.sawCarrier = lastRun.sawWeaver = lastRun.sawThorn = lastRun.sawBolt = false;

  for (let i = 0; i < TICKS; i++) {
    replay(G.input, i);
    G.update(DT);

    // The stop, restarted deterministically so the rest of the ticks are live
    // ones. Through the real startGame(), with an explicit seed.
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
    h = mix(h, st.clearHold);
    h = mix(h, st.skimmer ? st.skimmer.lane : -1);
    h = mix(h, st.skimmer && st.skimmer.dead ? 1 : 0);

    h = mix(h, st.shots.length);
    for (let k = 0; k < st.shots.length; k++) {
      h = mix(h, st.shots[k].lane);
      h = mix(h, st.shots[k].t);
    }

    // ⛔ THE ENEMY ARRAY. Position first, then the per-class state — trap 3.
    // The Vaulter's hop fields are CS003's; the rest are CS004's, and without
    // them a build that had lost the Weaver's cycle or the Thorn's chip would
    // hash the same as one that had not.
    if (st.enemies.length > lastRun.maxEnemies) lastRun.maxEnemies = st.enemies.length;
    if (st.level > lastRun.level) lastRun.level = st.level;
    h = mix(h, st.enemies.length);
    for (let k = 0; k < st.enemies.length; k++) {
      const e = st.enemies[k];
      if (e instanceof X.Carrier) lastRun.sawCarrier = true;
      else if (e instanceof X.WeaverBolt) lastRun.sawBolt = true;
      else if (e instanceof X.Weaver) lastRun.sawWeaver = true;
      else if (e instanceof X.Thorn) lastRun.sawThorn = true;

      h = mix(h, e.lane);
      h = mix(h, e.depth);
      h = mix(h, e.dead ? 1 : 0);
      // CS003 — the Vaulter's hop state, where a stale heading would show up.
      h = mix(h, e.hopping ? 1 : 0);
      h = mix(h, num(e.hopTime));
      h = mix(h, num(e.hopTimer));
      h = mix(h, num(e.dir));
      // CS004 — the Carrier's cargo, the Weaver's cycle, and whether it is
      // holding a Thorn. The Thorn's own state is its `depth`, already hashed:
      // that IS its length (GDD 6.5's `anchored`).
      h = mix(h, cargoNames.indexOf(e.cargo));
      h = mix(h, PHASES.indexOf(e.phase));
      h = mix(h, num(e.holdTimer));
      h = mix(h, e.fired ? 1 : 0);
      h = mix(h, e.thorn ? 1 : 0);
      h = mix(h, e.anchored ? 1 : 0);
    }
  }
  lastRun.restarts = restarts;
  return h >>> 0;
}

if (HASH_ONLY) {
  process.stdout.write(String(hashRun(SEED)));
  process.exit(0);
}

// ⛔ TRAP 2, CHECKED AGAINST THE FUNCTION rather than trusted. `replay` is
// driven over the whole hashed range into a recorder, and every key it ever
// reaches for is inspected. A future session adding a debug spawn to the list
// "to make the run more interesting" would make the hash depend on the key map,
// and the failure would look like flaky determinism rather than like this.
const FORBIDDEN = ["r", "w", "0", "1", "2", "3", "4"];
const pressed = new Set();
const recorder = {
  keyDown: k => pressed.add(k),
  keyUp: k => pressed.add(k),
  mouseMove: () => {},
};
for (let i = 0; i < TICKS; i++) replay(recorder, i);
H.assert(pressed.size > 0, "the recorded input list presses something at all");
for (const k of FORBIDDEN) {
  H.assert(!pressed.has(k),
           `⛔ the recorded input list never presses "${k}" — "r" reseeds from the clock, ` +
           `"w" cycles the well, and a digit is a debug spawn inside a hashed run`);
}

const hashA = hashRun(SEED);
const hashB = hashRun(SEED);
H.eq(hashA, hashB,
     `${TICKS} ticks of the recorded input list hash identically in one process`);

const child = execFileSync(process.execPath, [__filename, "--hash-only"],
  { cwd: ROOT, encoding: "utf8", stdio: "pipe" }).trim();
H.eq(Number(child), hashA, `${TICKS} ticks hash identically across two processes`);

// A different seed must move the hash, or the two cases above prove nothing.
H.assert(hashRun(SEED + 1) !== hashA, "a different seed produces a different hash");

// ⛔ And the run being hashed is not a quiet one, and — trap 3 — it is not a
// CS003 one either. All four of CS004's entities have to have been on the board
// inside the hashed window, or "determinism with the new draws" is a claim about
// draws that were never spent.
H.assert(lastRun.maxEnemies > 0, "the hashed run had enemies on the board");
H.assert(lastRun.level > 1, "and cleared at least one well — nextWell() is in the hash");
H.assert(lastRun.restarts > 0,
         "and reached the game-over stop at least once — the restart path is in the hash");
H.assert(lastRun.sawCarrier, "⛔ and a Carrier was on the board — the split's two draws are in it");
H.assert(lastRun.sawWeaver, "⛔ and a Weaver");
H.assert(lastRun.sawThorn, "⛔ and a Thorn it laid — that draw is in the hash too");
H.assert(lastRun.sawBolt, "⛔ and a bolt it fired");

// ---------------------------------------------------------------------------
// everything below shares one build
// ---------------------------------------------------------------------------

installSeed(SEED);
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const state = X.state;
const DT = C.FIXED_DT;

// ---------------------------------------------------------------------------
// the roster count, against the one file that may name a global count
// ---------------------------------------------------------------------------
//
// ⛔ NOT A BARE LENGTH COMPARISON, and that is the whole point of the number.
// test-cs003-p5.js compares Object.keys(ENEMY_KINDS).length against
// COUNTS.enemyKinds; this is the OTHER number. COUNTS.enemies counts GDD §6.1
// ROSTER ROWS, and a kind is not a roster row twice over:
//
//   - one kind PER CARRIER VARIANT, so GDD §6.2's three cargoes are three kinds
//     behind one roster entry (CS005 adds carrierDrifter and carrierSurger);
//   - the Weaver's bolt is a kind with no roster entry at all.
//
// So the roster is derived: the distinct CLASSES the kind table can build,
// minus the projectiles. CS005 adds two roster rows and four kinds and this
// case needs no edit.
const PROJECTILE_CLASSES = [X.WeaverBolt];

const kindClasses = new Set();
const cargoToKind = {};
for (const kind of Object.keys(X.ENEMY_KINDS)) {
  const probe = X.ENEMY_KINDS[kind](0, 0, 1);
  kindClasses.add(probe.constructor);
  if (probe instanceof X.Carrier) cargoToKind[probe.cargo] = kind;
}
const roster = [...kindClasses].filter(c => PROJECTILE_CLASSES.indexOf(c) === -1);
H.eq(roster.length, COUNTS.enemies,
     "⛔ the build ships exactly the GDD §6.1 roster rows the registry counts — " +
     "distinct classes the kind table can build, minus the projectiles");
H.assert(kindClasses.size > roster.length,
         "⛔ and there are strictly more CLASSES than roster rows — the bolt is the difference");
// ⚠ NOT STRICT, AND IT IS EQUAL TODAY. A Carrier VARIANT is a kind and not a
// class, so kinds outgrow classes the moment a second variant exists — which is
// CS005's carrierDrifter and carrierSurger. Asserting `>` here would be
// asserting a changeset that has not happened.
H.assert(Object.keys(X.ENEMY_KINDS).length >= kindClasses.size,
         "and at least as many KINDS as classes — a Carrier variant is a kind, not a class");

// ---------------------------------------------------------------------------
// GDD 17 item 3, extended — the six open wells with all four kinds live
// ---------------------------------------------------------------------------
//
// CS003's version ran a well full of Vaulters. This one runs a well that is
// also splitting, laying, chipping and firing, and adds the assertion those
// four entities make available.

const OPEN = X.WELLS.filter(w => !w.closed);
H.eq(OPEN.length, COUNTS.openWells, "the soak covers every open well");

// ⛔ THE VAULTER'S BOUND, UNCHANGED (trap 4). One hop crosses exactly one lane
// over C.VAULT_HOP_TIME, so no single tick may move one further than that; the
// factor of two is slack for the exact landing step. ⚠ It stays the Vaulter's:
// it has to become PER-ENTITY in CS005, when the Drifter becomes the first
// thing in the build that moves continuously in lane space, and that is that
// changeset's to do.
const MAX_LANE_STEP = 2 * DT / C.VAULT_HOP_TIME;

// ⛔ AND THE OTHER FOUR GET THE STRONGER FORM. A Carrier, a Weaver, a Thorn and
// a bolt touch no lane helper at all — "never hops" is an absence of code —
// so the assertion available is exact equality with the lane they entered in,
// bit for bit, rather than a speed bound that a wrapped hop can slip under.
function hopless(e) {
  return e instanceof X.Carrier || e instanceof X.Weaver ||
         e instanceof X.Thorn || e instanceof X.WeaverBolt;
}

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

// Adversarial, and it fires. ⛔ The mouse is PINNED to one wall for stretches at
// a time: a random walk leaves the craft near the middle, and a rim-hunting
// Vaulter then never chases into an end lane — which is the only thing that puts
// a hopper against the wall this soak exists to test.
const PIN_TICKS = 300;
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

function classCounts(list) {
  const n = { vaulter: 0, carrier: 0, weaver: 0, thorn: 0, bolt: 0 };
  for (const e of list) {
    if (e instanceof X.Carrier) n.carrier++;
    else if (e instanceof X.WeaverBolt) n.bolt++;
    else if (e instanceof X.Weaver) n.weaver++;
    else if (e instanceof X.Thorn) n.thorn++;
    else if (e instanceof X.Vaulter) n.vaulter++;
  }
  return n;
}

// ⛔ A FIXTURE, AND IT IS THE ONE THAT MAKES THIS SOAK A SOAK — read the ⚠ in
// STATUS.md before removing it. C.ENEMY_CONCURRENT is 3 and the spawner blocks
// on `state.enemies.length >= min(ENEMY_CONCURRENT, ENEMY_CAP)` — a count of
// EVERYTHING in the array, Thorns included. A Thorn nobody shoots is permanent,
// so with Weavers in the mix three standing Thorns hold the spawner shut: the
// measured board on the Fan was THREE enemies born in 5,000 ticks. Every
// assertion below would still pass, on a well with almost nothing in it.
//
// Raising the DIFFICULTY knob to the READABILITY ceiling for the soak is the
// same class of fixture as topping up the quota and the lives: it keeps the
// well busy so the geometry is actually stressed, and it is what CS006's heat
// curve does anyway. ⛔ C.ENEMY_CAP is untouched and is still asserted below.
const SHIPPED_CONCURRENT = C.ENEMY_CONCURRENT;

// Aggregated over the whole soak rather than per well. Splitting and laying are
// things the BOARD does and happen on every well; a chip needs the player to be
// standing in a thorned lane when a shot arrives, which is a per-run accident
// and not a property of a well shape.
let soakChip = false;

for (const well of OPEN) {
  const idx = X.WELLS.indexOf(well);
  const hi = well.lanes - 1;

  // ⛔ Through the real lifecycle. Level idx+1 has shapeIndex idx, and idx is at
  // least 7 here, so mid-climb vaulting is on (C.VAULT_FIRST_LEVEL).
  G.reset();
  X.startGame(SEED + idx);
  C.DEBUG_SPAWN_KINDS = MIXED.slice();
  C.ENEMY_CONCURRENT = C.ENEMY_CAP;
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
  let teleported = null, laneMoved = null;
  let sawSplit = false, sawLay = false, sawChip = false;
  const seen = { vaulter: false, carrier: false, weaver: false, thorn: false, bolt: false };

  const lanes = new Map();     // enemy -> the lane it held last tick
  const born = new Map();      // hopless enemy -> the lane it ENTERED with
  const lengths = new Map();   // Thorn -> the length it held last tick
  let alive = new Set();
  let counts = classCounts([]);

  for (let i = 0; i < SOAK_TICKS; i++) {
    adversarial(G.input, i, Math.random());
    // Trap 5. Fixtures, not weakened assertions.
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

    // ⛔ Trap 6 — by class, never by array length. A Carrier leaving the board
    // on the same tick two Vaulters arrive is GDD §6.2's split, resolved from
    // inside collideShots()'s own loop over the array.
    const now = classCounts(state.enemies);
    if (now.carrier < counts.carrier && now.vaulter > counts.vaulter) sawSplit = true;
    if (now.thorn > counts.thorn) sawLay = true;
    counts = now;

    for (let k = 0; k < state.enemies.length; k++) {
      const e = state.enemies[k];
      if (e instanceof X.Carrier) seen.carrier = true;
      else if (e instanceof X.WeaverBolt) seen.bolt = true;
      else if (e instanceof X.Weaver) seen.weaver = true;
      else if (e instanceof X.Thorn) seen.thorn = true;
      else if (e instanceof X.Vaulter) seen.vaulter = true;

      if (!isFinite(e.lane) || !isFinite(e.depth)) { notFinite = notFinite || `enemy ${e.lane}`; continue; }
      // ⛔ EXACT bounds, no epsilon. Every write to an enemy's lane goes through
      // laneNormalize, which on an open well is a clamp — a value a hair outside
      // is a hop that bypassed the helper.
      if (e.lane < 0 || e.lane > hi) laneOut = laneOut || `enemy at lane ${e.lane}`;
      if (e.depth < 0 || e.depth > 1) depthOut = depthOut || `enemy at depth ${e.depth}`;
      if (e.lane === 0 || e.lane === hi) sawEndLane = true;
      if (e.depth >= 1) sawRim = true;

      if (hopless(e)) {
        // ⛔ THE STRONG FORM. Object.is, not a tolerance: the lane was written
        // once, by the constructor, and nothing since has had any business
        // touching it.
        if (!born.has(e)) born.set(e, e.lane);
        else if (!Object.is(e.lane, born.get(e))) {
          laneMoved = laneMoved || `${e.constructor.name} ${born.get(e)} -> ${e.lane} at tick ${i}`;
        }
      } else {
        const wasLane = lanes.get(e);
        if (wasLane !== undefined && Math.abs(e.lane - wasLane) > MAX_LANE_STEP) {
          teleported = teleported || `${wasLane} -> ${e.lane}`;
        }
        lanes.set(e, e.lane);
      }

      // A Thorn's depth is its LENGTH, so a fall in it is a chip landing —
      // GDD §4.2's economy, running inside a live well.
      if (e instanceof X.Thorn) {
        const was = lengths.get(e);
        if (was !== undefined && e.depth < was) { sawChip = true; soakChip = true; }
        lengths.set(e, e.depth);
      }

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
  H.assert(!laneMoved,
    `${well.name}: ⛔ a Carrier, Weaver, Thorn or bolt's lane is EXACTLY the lane it ` +
    `entered with, on every tick — the strong form a range check cannot give (${laneMoved})`);
  H.assert(!nanPath, `${well.name}: ⛔ no NaN anywhere in state (${nanPath})`);
  H.assert(!projBad, `${well.name}: ⛔ no NaN in any projected point (${projBad})`);
  H.assert(maxEnemies <= C.ENEMY_CAP,
    `${well.name}: the enemy array never passes ENEMY_CAP (peak ${maxEnemies})`);
  H.assert(maxShots <= C.SHOT_MAX,
    `${well.name}: the shot array never passes SHOT_MAX (peak ${maxShots})`);
  H.eq(state.wellIndex, idx, `${well.name}: the soak stayed in the well it was aimed at`);
  H.eq(state.screen, "play", `${well.name}: and never reached the stop`);

  // ⛔ And the soak was actually exercised. Without these, every assertion above
  // passes on an empty board — which is exactly how a wall-behaviour test
  // quietly stops testing the wall. CS003's five, plus CS004's five.
  H.assert(sawSpawn, `${well.name}: enemies spawned during the soak`);
  H.assert(sawKill, `${well.name}: and enemies died during it`);
  H.assert(sawDeath, `${well.name}: and the Skimmer was killed at least once`);
  H.assert(sawRim, `${well.name}: an enemy reached the rim — rim hunting ran`);
  H.assert(sawEndLane, `${well.name}: an enemy reached an end lane — the wall was exercised`);

  H.assert(seen.vaulter && seen.carrier && seen.weaver && seen.thorn && seen.bolt,
    `${well.name}: ⛔ all four CS004 entities and the Vaulter were on the board — ` +
    `without this the exact-lane assertion is a claim about entities that never existed ` +
    `(${JSON.stringify(seen)})`);
  H.assert(sawSplit, `${well.name}: ⛔ a Carrier split during the soak — from inside the collision pass`);
  H.assert(sawLay, `${well.name}: ⛔ a Weaver laid a Thorn during the soak`);
}

// ⛔ The knob goes back before anything else runs. Leaving it raised would make
// the seeded runs below a different game from the one that ships.
C.ENEMY_CONCURRENT = SHIPPED_CONCURRENT;
H.eq(C.ENEMY_CONCURRENT, 3, "the soak's concurrency fixture is put back");

H.assert(soakChip,
         "⛔ and a Thorn was chipped somewhere in the six-well soak — GDD §4.2's economy " +
         "running inside a live well, with the collision pass and the end-of-frame filter " +
         "doing it rather than a hand-driven onShot");

// ---------------------------------------------------------------------------
// GDD 17 item 5 — the Purge's two uses, with a non-purgeable entity present
// ---------------------------------------------------------------------------
//
// ⛔ UNTESTABLE UNTIL THIS CHANGESET. CS003 P3 proved both uses against a board
// where every entity was purgeable, which cannot distinguish "reads the flag"
// from "kills everything". The Thorn is the roster's first false, so this is the
// first board on which GDD §4.3's "does not remove Thorns" means anything.
//
// ⛔ Through the real input path, so the level-to-edge latch is in it too:
// state.input.purge is a HELD boolean and the edge is detected in the game
// (GDD §9.5). Holding it down must spend exactly one charge.

function quietBoard() {
  G.reset();
  X.startGame(SEED);
  C.DEBUG_SPAWN_KINDS = MIXED.slice();
  state.enemies = [];
  state.shots = [];
  state.spawn.remaining = 0;
  state.clearHold = 0;
  state.purgeUses = 0;
  state.purgeLatched = false;
  G.input.reset();
  state.skimmer.lane = 0;
  return X.WELLS[state.wellIndex];
}

let well = quietBoard();
const pThorn = X.spawnEnemy("thorn", 6, 0);
pThorn.depth = 0.95;                       // ⛔ nearest the rim, on purpose
const pVaulter = X.spawnEnemy("vaulter", 9, 0.40);
const pCarrier = X.spawnEnemy("carrierVaulter", 11, 0.20);
const pWeaver = X.spawnEnemy("weaver", 13, 0.10);
H.eq(state.enemies.length, 4, "a mixed board: one Thorn and three purgeable enemies");
H.assert(pThorn.depth > pVaulter.depth && pThorn.depth > pCarrier.depth,
         "and the Thorn is the entity nearest the rim");

G.input.keyDown("x");
G.update(DT);
H.eq(state.purgeUses, 1, "the first use is spent, through the real held-button edge");
H.assert(pVaulter.dead && pCarrier.dead && pWeaver.dead,
         "⛔ the first use destroys every purgeable enemy in the well (GDD §4.3)");
H.eq(pThorn.dead, false,
     "⛔ AND ZERO THORNS — GDD §17 item 5, on the first board where it means anything");
H.eq(pThorn.depth, 0.95, "unchipped: the Purge is a statement, not a shot");

// ⚠ AND IT DID NOT SPLIT THE CARRIER. updatePurge() sets `dead` directly and
// never calls onShot(), which is what keeps a panic button from doubling the
// enemy count. It works by OMISSION, and omissions get "fixed".
H.eq(classCounts(state.enemies).vaulter, 0,
     "⚠ a Purged Carrier leaves no children — the Purge never calls onShot()");

// ⛔ AND WHAT SURVIVES IS THORNS, PLURAL. The entity pass runs BEFORE
// updatePurge in Game.update(), so the Weaver above took one climb step and laid
// a Thorn on the very tick it was purged — and that Thorn is not purgeable
// either. Asserting `enemies.length === 1` here would be asserting that the lay
// had not happened; asserting the CLASS is the claim actually being made.
const purgeSurvivors = state.enemies;
H.assert(purgeSurvivors.length >= 1 && purgeSurvivors.every(e => e instanceof X.Thorn),
         `⛔ every survivor of the first use is a Thorn, and nothing else is left ` +
         `(${JSON.stringify(classCounts(purgeSurvivors))})`);
H.assert(purgeSurvivors.indexOf(pThorn) >= 0, "the staged Thorn among them");

// Held down, it spends nothing more: the edge is the rule.
G.update(DT);
H.eq(state.purgeUses, 1, "⛔ holding the button spends exactly one charge");

G.input.keyUp("x");
G.update(DT);
const pLow = X.spawnEnemy("vaulter", 4, 0.20);
const pHigh = X.spawnEnemy("vaulter", 2, 0.60);
H.assert(pThorn.depth > pHigh.depth,
         "⛔ the Thorn is STILL the entity nearest the rim for the second use");

G.input.keyDown("x");
G.update(DT);
H.eq(state.purgeUses, 2, "the second use is spent");
H.eq(pThorn.dead, false,
     "⛔ and the Thorn is not its victim, though it is nearest the rim — purgeTarget " +
     "skips what it cannot destroy rather than wasting the use on it");
H.eq(pHigh.dead, true, "the victim is the purgeable enemy nearest the rim");
H.eq(pLow.dead, false, "⛔ and EXACTLY ONE dies — the weak second use is a decision, not a clear");

// ---------------------------------------------------------------------------
// GDD 17 item 6 — Carrier splits, correct count and type per variant
// ---------------------------------------------------------------------------
//
// ⛔ A LOOP OVER THE CARGO TABLE, so CS005 adds two rows and no test. The kind
// that carries each cargo is discovered from ENEMY_KINDS rather than named,
// which also asserts the thing a dead CARGO row would break: every cargo the
// table describes has a Carrier variant that actually carries it.

const cargoNames = Object.keys(X.CARGO);
H.assert(cargoNames.length >= 1, "the CARGO table has at least one row");

for (const cargo of cargoNames) {
  const kind = cargoToKind[cargo];
  H.assert(!!kind,
           `⛔ CARGO row "${cargo}" has an ENEMY_KINDS row that carries it — a cargo with ` +
           `no variant is a row nothing can ever spawn`);
  if (!kind) continue;

  const childKind = X.CARGO[cargo].kind;
  H.assert(!!X.ENEMY_KINDS[childKind],
           `⛔ and what "${cargo}" splits into ("${childKind}") is itself a kind`);
  const ChildClass = X.ENEMY_KINDS[childKind](0, 0, 1).constructor;

  well = quietBoard();
  state.skimmer.lane = 0;                  // ⛔ far from the parent: the safe-spawn
                                           // rule would LOWER a child otherwise
  const parent = X.spawnEnemy(kind, 8, 0.40);
  H.assert(parent instanceof X.Carrier, `"${kind}" builds a Carrier`);
  H.eq(parent.cargo, cargo, `carrying "${cargo}"`);
  H.eq(state.enemies.length, 1, "one Carrier on an otherwise empty board");

  const consumed = parent.onShot(null);
  H.eq(consumed, true, `⛔ any shot kills a "${cargo}" Carrier and is spent (GDD §6.1)`);
  H.eq(parent.dead, true, "the parent is dead");

  const children = state.enemies.filter(e => e !== parent);
  H.eq(children.length, 2, `⛔ EXACTLY TWO children (GDD §6.2's "${cargo}" row)`);
  H.assert(children.every(c => c instanceof ChildClass),
           `⛔ both of type "${childKind}" — the type the CARGO table names, not a default`);

  const want = X.splitLanes(well, parent.lane);
  H.eq(children[0].lane, want[0], "⛔ at the lanes splitLanes chose — one either side");
  H.eq(children[1].lane, want[1], "and the second");
  H.assert(children[0].lane !== children[1].lane,
           "⛔ two DISTINCT lanes — GDD §1.1 P2 at the moment the player reads a split");
  H.assert(children.every(c => Object.is(c.depth, parent.depth)),
           "at the depth the parent died at — a split is not a respawn");
}

// ---------------------------------------------------------------------------
// GDD 17 item 12 — RUNS seeded runs to the game-over stop, no exception
// ---------------------------------------------------------------------------
//
// GDD §17 asks for a hundred; twenty is what a closing phase can afford on every
// commit. ⛔ On the MIXED list, so a run that ends is one that survived splits,
// lays, chips and bolts. Each run is a different seed and is driven by the same
// recorded input list as the determinism case, so a failure here is replayable.

let threw = null, stuck = null;
let soakMaxEnemies = 0, soakMaxShots = 0, soakNaN = null, soakLevels = 0, soakTicks = 0;
const soakSeen = { vaulter: false, carrier: false, weaver: false, thorn: false, bolt: false };

for (let r = 0; r < RUNS && !threw && !stuck; r++) {
  const seed = (SEED + r * 104729) >>> 0;
  try {
    G.reset();
    X.startGame(seed);
    C.DEBUG_SPAWN_KINDS = MIXED.slice();
    let ticks = 0;
    while (state.screen !== "gameover" && ticks < RUN_CAP) {
      replay(G.input, ticks);
      G.update(DT);
      ticks++;
      if (state.enemies.length > soakMaxEnemies) soakMaxEnemies = state.enemies.length;
      if (state.shots.length > soakMaxShots) soakMaxShots = state.shots.length;
      if (!soakNaN) soakNaN = firstNaN(state, "state", 0);
      const n = classCounts(state.enemies);
      for (const k of Object.keys(n)) if (n[k] > 0) soakSeen[k] = true;
    }
    if (ticks > soakTicks) soakTicks = ticks;
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
H.assert(soakSeen.vaulter && soakSeen.carrier && soakSeen.weaver &&
         soakSeen.thorn && soakSeen.bolt,
         `⛔ and the runs were mixed ones — all four CS004 entities appeared ` +
         `(${JSON.stringify(soakSeen)})`);

H.report("test-cs004-p5.js");
