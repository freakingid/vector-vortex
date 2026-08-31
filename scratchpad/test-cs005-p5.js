// test-cs005-p5.js — CS005's closing phase: GDD §17 items 1, 3 and 12 against
// the COMPLETE Classic roster, plus the assertion CS005 P1's geometry exists to
// make available.
//
// ⛔ WHY THIS IS A THIRD FILE AND NOT AN EDIT TO THE OTHER TWO. STATUS.md
// carried a task saying MAX_LANE_STEP had to become per-entity "in
// test-cs003-p5.js and test-cs004-p5.js both". That task was wrong.
//  - test-cs003-p5.js never touches C.DEBUG_SPAWN_KINDS, so it runs on the
//    shipped ["vaulter"] and only Vaulters ever reach its board. Its bound is
//    right for what it observes, and CS003 P5's finding — a range check misses
//    a wrapping hop — is preserved by leaving it alone.
//  - test-cs004-p5.js sets its own three-kind MIXED list. Extending it would
//    make CS004's closing soak assert entities CS005 built, which is what
//    CLAUDE.md's "a test asserts only what its own phase owns" forbids, and it
//    would put a WIDENED bound into the file whose stated job is the stronger
//    exact-equality form.
// So this file owns CS005's board and CS005's assertions, and the only shared
// edit in the changeset is test-registry.js — the one file allowed a global
// count.
//
// It extends test-cs004-p5.js rather than restating it: the hash mixer, the
// recorded input list, the adversarial generator, the NaN walker and the
// fixtures are deliberately the same shapes so a reader who knows one knows
// all three. GDD §17 item 5 (the Purge) and item 6 (Carrier splits) are NOT
// here — item 6 is CS004's loop over CARGO, which now covers three rows and
// needed no edit, and re-asserting either would be this file claiming work it
// did not do.
//
// ⛔ SEVEN TRAPS IN THE FIXTURES.
//  1. C.DEBUG_SPAWN_KINDS ships as ["vaulter"], so on the shipped value not one
//     CS004 or CS005 entity reaches the board and every case below is vacuous.
//     Every run here sets MIXED first; the non-vacuity assertions say it worked.
//  2. ⛔ THE FORBIDDEN-KEY LIST IS A SUPERSET OF CS004's, and that is the point
//     of restating it. CS004's list is hardcoded ["r","w","0".."4"] and stopped
//     being exhaustive the moment CS005 P2 and P3 bound "5" and "6". It does not
//     FAIL there — CS004's own recorded list presses neither — so that file is
//     correct and is not edited; this one carries "5" and "6" as well.
//  3. The hash must cover a DRIFTER's phase and cross progress and a SURGER's
//     phase and timer. Without them it would pass over a build that had lost
//     either cycle entirely — the trap CS004 P5 names as its own item 3.
//  4. ⛔ THE LANE ASSERTION IS NOW PER ENTITY, in three tiers. See the block
//     above MAX_LANE_STEP; the short version is that "never hops" is an absence
//     of code and deserves the strongest form, a Vaulter and a Drifter move
//     continuously in lane space and get derived per-tick speed bounds, and the
//     two bounds are different numbers because they come from different
//     constants.
//  5. The open-well soak tops up `spawn.remaining` and `lives` every tick, and
//     raises C.ENEMY_CONCURRENT to C.ENEMY_CAP. Fixtures to hold the well open
//     and busy, not weakened assertions. ⛔ REWRITTEN, CS007 P1: the third one
//     used to be a workaround for a live defect — a standing Thorn held a
//     spawner slot, because the release budget counted EVERYTHING in the array.
//     That is fixed (the budget counts THREATS, the ceiling counts entities —
//     08-spawner.js, test-cs007-p1.js). It stays as a plain difficulty fixture
//     that keeps the board busy; removing it would move this soak's board for
//     no assertion's benefit.
//  6. Splits and lays make the board grow from INSIDE a tick, so every count
//     here is by class rather than by array length.
//  7. A Surger MUTATES killDepth to 0 for its discharge and restores it. The
//     hash carries the field, so an unrestored zero moves it — but nothing in
//     this file asserts the mutation itself, which is test-cs005-p3.js's.
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

// ⛔ THE SIX-KIND BENCH LIST — trap 1. Six ENEMY_KINDS rows, and between them
// all SIX GDD §6.1 roster classes reach the board:
//
//   vaulter        the Vaulter
//   carrierDrifter |  the Carrier, and CS005's two cargo rows rather than
//   carrierSurger  |  CS004's — the third is covered exhaustively by
//                     test-cs004-p5.js's loop over CARGO, which is a better
//                     instrument for it than a random draw
//   weaver         the Weaver, and with it the Thorn it LAYS and the bolt it
//                  FIRES — neither belongs in a list of things a well releases
//                  from its throat
//   drifter        the Drifter
//   surger         the Surger
//
// ⛔ NO LONGER ⚠ TEMPORARY, AND IT DID BECOME "run at a level where all six are
// introduced" (CS007 P3). GDD §8.1's introduction schedule landed and deleted
// C.DEBUG_SPAWN_KINDS; ⛔ MIXED_LEVEL 23 is where the schedule has released
// every kind, so MIXED stopped being a list this file writes into the build and
// became the list this file CHECKS the build's board against.
//
// ⚠ THE SCHEDULE'S SET AT 23 IS A SUPERSET BY ONE — it also has
// `carrierVaulter`, GDD §8.1's level-3 row, which the hand-written list left out
// because CS005 P4's two new cargo rows were the phase's subject and the Vaulter
// cargo was CS004's. ⛔ That costs this file nothing: every check below is by
// CLASS (`e instanceof X.Carrier`, `classCounts().carrier`), and all three
// variants are the same class carrying a different cargo string — a Carrier is a
// Carrier regardless of what is inside it (GDD §6.2). The board is strictly
// richer than the one this file was written against, never narrower.
//
// ⛔ 23 rather than 18, the schedule's other six-kind band: 18-22 is six kinds
// too, but they are the WRONG six — it has `carrierVaulter` and not yet
// `carrierSurger`, so a Surger cargo would never reach the board.
const MIXED = ["vaulter", "carrierDrifter", "carrierSurger", "weaver", "drifter", "surger"];
const MIXED_LEVEL = 23;

// ---------------------------------------------------------------------------
// GDD 17 item 1 — determinism, with CS005's new draws in it
// ---------------------------------------------------------------------------
//
// The Drifter spends one draw at spawn (its heading, inside spawnEnemy) and the
// Surger one, pickSpawnKind spends one per interval spawn off a list that is
// now six long, and each of the two new Carrier variants splits into two
// children that are two more draws. Every one comes off the run's ONE stream.

// FNV-1a over the bit pattern of each value, so a 1-ulp drift is a different
// hash. Deliberately a local copy, as both earlier soaks' are: a shared mixer
// in _harness.js would make one function three phases' to keep stable, and
// these cases are meant to be able to disagree.
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
// pattern, which would make a Surger's absent crossTime indistinguishable from
// a Drifter's absent surgeTimer.
function num(v) { return typeof v === "number" ? v : -1; }

// THE recorded input list, character for character test-cs003-p5.js's and
// test-cs004-p5.js's. ⛔ NO "r", NO "w", NO DIGITS — trap 2, asserted below
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

// What the last hashRun() actually did. A hash over an array that is always
// empty is a case that cannot fail, so the parent asserts on these afterwards
// — and CS005 adds the two new class flags, because a hash that never saw a
// Surger proves nothing about the discharge.
const lastRun = {
  maxEnemies: 0, restarts: 0, level: 0,
  sawCarrier: false, sawWeaver: false, sawThorn: false, sawBolt: false,
  sawDrifter: false, sawSurger: false, sawDischarge: false,
};

// Every phase string in the build, as one table — a Weaver's, a Drifter's and a
// Surger's. ⛔ Each string gets a DISTINCT index, so a phase machine that ran
// backwards, or one entity's phase leaking onto another, moves the hash.
// "climb" is deliberately shared: a Weaver and a Surger both have one and they
// mean the same thing.
const PHASES = ["climb", "hold", "retreat", "birth", "ride", "cross",
                "telegraph", "discharge"];

function hashRun(gameSeed) {
  installSeed(gameSeed);
  const X = H.buildGame();
  const C = X.C, G = X.Game, st = X.state;
  const DT = C.FIXED_DT;

  // Cargo names become indices off the CARGO table rather than a literal, the
  // way CS004 wrote it so that CS005's two rows cost no edit.
  const cargoNames = Object.keys(X.CARGO);

  // Trap 1, repaired (CS007 P3). The LEVEL is the fixture now, so it is set the
  // moment a run begins and the very first spawn of that run already draws a
  // kind off a full board. ⛔ AND AFTER EVERY RESTART TOO — startGame() puts the
  // level back to 1, so a run that dies out would finish the window on a
  // Vaulter-only board, which the old constant (it survived a restart) never
  // allowed.
  function armMixed() {
    st.level = MIXED_LEVEL;
    st.wellIndex = (MIXED_LEVEL - 1) % X.WELLS.length;
    X.enterWell();
  }

  G.reset();
  X.startGame(gameSeed);
  armMixed();

  let h = 2166136261 >>> 0;
  let restarts = 0;
  lastRun.maxEnemies = 0;
  lastRun.level = 0;
  lastRun.sawCarrier = lastRun.sawWeaver = lastRun.sawThorn = lastRun.sawBolt = false;
  lastRun.sawDrifter = lastRun.sawSurger = lastRun.sawDischarge = false;

  for (let i = 0; i < TICKS; i++) {
    replay(G.input, i);
    G.update(DT);

    // The stop, restarted deterministically so the rest of the ticks are live
    // ones. Through the real startGame(), with an explicit seed.
    if (st.screen === "gameover") {
      restarts++;
      X.startGame((gameSeed + restarts * 7919) >>> 0);
      armMixed();
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

    // ⛔ THE ENEMY ARRAY. Position first, then the per-class state — trap 3.
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
      else if (e instanceof X.Surger) {
        lastRun.sawSurger = true;
        if (e.phase === "discharge") lastRun.sawDischarge = true;
      }

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
      // ⛔ CS005 — trap 3. The Drifter's armour clock and its CROSS PROGRESS,
      // and the Surger's one timer. `phase` above is already in the hash, but
      // phase alone would pass over a build whose cycle had stopped ADVANCING;
      // these are the numbers that move inside a phase.
      h = mix(h, num(e.rideTimer));
      h = mix(h, num(e.crossTime));
      h = mix(h, num(e.crossFrom));
      h = mix(h, num(e.crossDelta));
      h = mix(h, num(e.surgeTimer));
      // ⛔ AND THE MUTATED FIELD ITSELF (trap 7). A Surger writes killDepth on
      // every phase change; an unrestored zero moves the hash from the tick it
      // happens on rather than only when someone finally dies to it.
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

// ⛔ TRAP 2, CHECKED AGAINST THE FUNCTION rather than trusted, and carried
// forward as a SUPERSET. "r" restarts on a time-derived seed, "w" cycles the
// well out from under the level clock, and a digit is a debug spawn — which
// would make the hash depend on the key map, and the failure would look like
// flaky determinism rather than like this. CS005 P2 and P3 bound "5" and "6",
// so a list that stops at "4" has stopped being exhaustive.
const FORBIDDEN = ["r", "w", "0", "1", "2", "3", "4", "5", "6"];
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

// A different seed must move the hash, or the two cases above prove nothing.
H.assert(hashRun(SEED + 1) !== hashA, "a different seed produces a different hash");

// ⛔ And the run being hashed is not a quiet one, and — trap 3 — it is a CS005
// one. All six roster classes have to have been on the board inside the hashed
// window, or "determinism with the new draws" is a claim about draws that were
// never spent.
H.assert(hashed.maxEnemies > 0, "the hashed run had enemies on the board");
H.assert(hashed.level > MIXED_LEVEL,
         `⛔ and cleared at least one well — nextWell() is in the hash (reached ` +
         `${hashed.level} from ${MIXED_LEVEL}). ⛔ REWRITTEN, CS007 P3: this read "> 1", ` +
         `which a run STARTED at MIXED_LEVEL satisfies without clearing anything`);
H.assert(hashed.restarts > 0,
         "and reached the game-over stop at least once — the restart path is in the hash");
H.assert(hashed.sawCarrier, "and a Carrier — the split's two draws are in the hash");
H.assert(hashed.sawWeaver, "and a Weaver");
H.assert(hashed.sawThorn, "and a Thorn it laid");
H.assert(hashed.sawBolt, "and a bolt it fired");
H.assert(hashed.sawDrifter,
         "⛔ and a DRIFTER — its heading draw and its cross progress are in the hash");
H.assert(hashed.sawSurger, "⛔ and a SURGER");
H.assert(hashed.sawDischarge,
         "⛔ and one of them reached `discharge` — the killDepth mutation happened " +
         "inside the hashed window, so an unrestored zero would move the hash");

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
// the two registry counts, and the relation between them that CS005 changed
// ---------------------------------------------------------------------------
//
// Both numbers were raised by earlier phases — `enemies` 4 -> 5 -> 6 in P2 and
// P3, `enemyKinds` 5 -> 6 -> 7 -> 9 across P2, P3 and P4 — so this confirms
// rather than moves them. The derivation is CS004's and needed no edit.

const PROJECTILE_CLASSES = [X.WeaverBolt];

const kindClasses = new Set();
for (const kind of Object.keys(X.ENEMY_KINDS)) {
  kindClasses.add(X.ENEMY_KINDS[kind](0, 0, 1).constructor);
}
const roster = [...kindClasses].filter(c => PROJECTILE_CLASSES.indexOf(c) === -1);
H.eq(Object.keys(X.ENEMY_KINDS).length, COUNTS.enemyKinds,
     "the build ships exactly the ENEMY_KINDS rows the registry counts");
H.eq(roster.length, COUNTS.enemies,
     "⛔ and exactly the GDD §6.1 roster rows — distinct classes the kind table can " +
     "build, minus the projectiles. The Classic roster is complete");

// ⛔ THE ONE THING CS005 MADE STRICT. test-cs004-p5.js asserts `kinds >= classes`
// and says in its own comment that the two were EQUAL then, because a Carrier
// variant is a kind and not a class and only one variant existed. P4 landed the
// second and third, so kinds now strictly outgrow classes — and this is the
// assertion that would notice a future session "tidying" the variant rows back
// into one generic `carrier`.
H.assert(Object.keys(X.ENEMY_KINDS).length > kindClasses.size,
         "⛔ strictly MORE kinds than classes — GDD §6.2's three Carrier variants are " +
         "three kinds behind one class, and CS005 P4 is what made that strict");

// ---------------------------------------------------------------------------
// GDD 17 item 3, extended — the six open wells with all six kinds live
// ---------------------------------------------------------------------------

const OPEN = X.WELLS.filter(w => !w.closed);
H.eq(OPEN.length, COUNTS.openWells, "the soak covers every open well");

// ⛔ THE LANE ASSERTION IS PER ENTITY, IN THREE TIERS — trap 4. All three exist
// because a RANGE CHECK CANNOT CATCH GDD §3.5's BUG: a hop or a cross that
// wraps a 13-lane strip lands inside [0, 12], and laneNormalize clamps an
// in-flight position back into range besides. The range check below is still
// run — it catches a different class of failure — but it is not the guard.
//
//  1. ⛔ Carrier, Weaver, Thorn, bolt and SURGER: exact equality, Object.is,
//     with the lane they entered with. None of them touches a lane helper;
//     "never hops" is an absence of code, and this is the strongest form
//     available. A wrapped anything cannot slip under it.
//  2. Vaulter: 2 * DT / C.VAULT_HOP_TIME. Unchanged from CS003, where it was
//     proved by mutation. A hop crosses one lane over a FIXED duration.
//  3. ⛔ Drifter: 2 * DT / C.DRIFT_CROSS_TIME, and it is DERIVED, not picked.
//     The birth cross covers half a lane in half the time (crossDur() scales
//     with |crossDelta|), so the lane SPEED is one number in both phases and
//     one constant produces it. The factor of two is slack for the exact
//     landing step, exactly as the Vaulter's is.
//
// ⚠ AND THE DRIFTER'S SPEED BOUND IS WEAKER THAN THE VAULTER'S, for a reason
// that is a property of the entity rather than of this file: crossDur() is
// proportional to |crossDelta|, so a cross of any LENGTH still moves at
// 1 / DRIFT_CROSS_TIME lanes per second. A wrapped cross would take twelve
// times as long and trip neither the bound nor the range check. What catches it
// is the LATTICE assertion below, and that is exactly what CS005 P1's geometry
// exists to make available. Mutation-checked, recorded in log/CS005.md.
const MAX_LANE_STEP = 2 * DT / C.VAULT_HOP_TIME;
const MAX_CROSS_STEP = 2 * DT / C.DRIFT_CROSS_TIME;

// Tier 1. A Surger joins CS004's four: it writes `lane` once, in the
// constructor, and touches no lane helper (GDD §6.1).
function hopless(e) {
  return e instanceof X.Carrier || e instanceof X.Weaver ||
         e instanceof X.Thorn || e instanceof X.WeaverBolt ||
         e instanceof X.Surger;
}

// ⛔ THE BOUNDARY LATTICE (GDD §3.5, CS005 P1) — the assertion this changeset
// makes available, and the one that actually carries §3.5's guarantee for a
// Drifter. Two claims, and they are about different phases:
//
//   settled (`ride`)  the lane is EXACTLY a half-integer, and inside
//                     [laneBoundaryLo, laneBoundaryHi]. On an open well that is
//                     0.5 … lanes-1.5: the two outermost boundaries are not
//                     addressable, because polyAt clamps them onto the lane
//                     CENTRES 0 and lanes-1 and an entity there would be a
//                     second silhouette on top of a first.
//
//   crossing          the lane is strictly between two ADJACENT lattice points.
//                     Expressed as the span of the cross rather than as a test
//                     on the lane itself, deliberately: `|crossDelta| is 1 or
//                     0.5` is float-exact where "is not a half-integer" is a
//                     landmine at the last interpolated step, and it is also
//                     the form that catches a wrap — a wrapped cross on the
//                     13-lane Vee has a crossDelta of 12, and no bound on
//                     SPEED or RANGE can see that.
//
// `birth` is the half-cross from the spawned lane CENTRE onto the lattice, so
// its span is 0.5 and its start is not a lattice point. That is the model, not
// an exemption: a Drifter is born vulnerable at a centre and arms once it
// settles (GDD §6.1).
function halfInteger(x) {
  return Number.isFinite(x) && Number.isInteger(x - 0.5);
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
// a time: a random walk leaves the craft near the middle, and neither a
// rim-hunting Vaulter nor a homing Drifter then has any reason to chase into an
// end lane — which is the only thing that puts a lane-crosser against the wall
// this soak exists to test.
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
  const n = { vaulter: 0, carrier: 0, weaver: 0, thorn: 0, bolt: 0, drifter: 0, surger: 0 };
  for (const e of list) {
    if (e instanceof X.Carrier) n.carrier++;
    else if (e instanceof X.WeaverBolt) n.bolt++;
    else if (e instanceof X.Weaver) n.weaver++;
    else if (e instanceof X.Thorn) n.thorn++;
    else if (e instanceof X.Drifter) n.drifter++;
    else if (e instanceof X.Surger) n.surger++;
    else if (e instanceof X.Vaulter) n.vaulter++;
  }
  return n;
}

// ⛔ A FIXTURE, AND IT IS THE ONE THAT MAKES THIS SOAK A SOAK — trap 5.
// C.ENEMY_CONCURRENT is 3, and at 3 this soak's six-kind board is thin.
// Raising the DIFFICULTY knob to the READABILITY ceiling for the soak keeps the
// well busy so the geometry is actually stressed. ⛔ C.ENEMY_CAP is untouched
// and is still asserted below.
//
// ⛔ REWRITTEN, CS007 P1 — THE REASON CHANGED AND THE FIXTURE DID NOT. This
// block used to say the spawner blocked on `state.enemies.length >= min(...)`,
// a count of EVERYTHING in the array, so three standing Thorns held it shut and
// the raise was a workaround for a live defect. That defect is FIXED: the
// release budget counts THREATS (`blocksClear && !dead`) and the readability
// ceiling still counts entities (08-spawner.js, test-cs007-p1.js, DECISIONS.md
// 2026-08-31). ⛔ KEEP THE FIXTURE — it is now a plain difficulty fixture, and
// removing it would move this soak's board for no assertion's benefit.
// ⛔ REPAIRED, CS007 P2 — THE FIXTURE'S PRECONDITION MOVED AND THE ASSERTIONS DID
// NOT. `C.ENEMY_CONCURRENT` is no longer the release budget; it is the budget's
// LEVEL-1 ENDPOINT, and `spawnLimit()` reads `enemyConcurrent()`, which
// interpolates it toward `C.ENEMY_CONCURRENT_MAX` (00-config.js). Setting the
// base alone therefore no longer sets the budget: on this soak's levels the
// interpolation walks it back DOWN toward 8, so the line below quietly stopped
// meaning "a board held open at C.ENEMY_CAP". ⛔ BOTH ENDPOINTS ARE PINNED, which
// RESTORES the precondition rather than relaxing it — the budget is C.ENEMY_CAP
// at every level again, exactly as it was before heat existed. ⛔ Nothing else
// moved: no cap raised, no seed changed, no assertion edited.
const SHIPPED_CONCURRENT = C.ENEMY_CONCURRENT;
const SHIPPED_CONCURRENT_MAX = C.ENEMY_CONCURRENT_MAX;

// Aggregated over the whole soak rather than per well: a chip and a discharge
// each need a specific accident (the player standing in a thorned lane when a
// shot arrives; a Surger surviving 2.60 s of climb), which is a per-run event
// and not a property of a well shape.
// ⚠ SIX KINDS DILUTE THE DRAW, AND TWO GUARDS HAD TO MOVE UP HERE BECAUSE OF
// IT. test-cs004-p5.js asserts a bolt and a split PER WELL and passes, on a
// list of three where a Weaver is one draw in three. On six it is one in six,
// and 5,000 ticks on the Flat produced no bolt and the Double-Vee no split —
// both measured, not feared. Neither is a per-well property: a bolt needs a
// Weaver to survive to its apex hold and a split needs the player to actually
// shoot a Carrier, and each is a per-run accident exactly as the Thorn chip
// CS004 aggregated for the same reason. The per-well claim that carries the
// lane assertions is "all six roster CLASSES were here", and that holds on
// every well.
let soakChip = false;
let soakDischarge = false;
let soakRide = false;
let soakCross = false;
let soakBolt = false;
let soakSplit = false;

for (const well of OPEN) {
  const idx = X.WELLS.indexOf(well);
  const hi = well.lanes - 1;
  const bLo = X.laneBoundaryLo(well);
  const bHi = X.laneBoundaryHi(well);

  // ⛔ Through the real lifecycle. Level idx+1 has shapeIndex idx, and idx is at
  // least 7 here, so mid-climb vaulting is on (C.VAULT_FIRST_LEVEL).
  G.reset();
  X.startGame(SEED + idx);
  C.ENEMY_CONCURRENT = C.ENEMY_CAP;
  C.ENEMY_CONCURRENT_MAX = C.ENEMY_CAP;
  state.level = idx;
  X.nextWell();
  H.eq(state.wellIndex, idx, `${well.name}: nextWell() lands on the intended shape`);

  // ⛔ Trap 1, repaired (CS007 P3). nextWell() above leaves level idx+1, which is
  // 8 to 15 across the open wells — and under GDD §8.1 that board has no Drifter
  // below 9 and no Surger below 13, so three of the six classes this loop
  // asserts on would simply not exist. ⛔ The SHAPE is what this loop is about;
  // the level was only ever how it got the shape and how it turned vaulting on.
  // It is pinned to MIXED_LEVEL, where every kind is released. ⛔ The per-tick
  // `spawn.remaining` top-up below is what holds it there — the well never
  // clears, so nothing advances the level out from under the fixture.
  state.level = MIXED_LEVEL;
  H.assert(state.level >= C.VAULT_FIRST_LEVEL,
           `${well.name}: the soak runs above VAULT_FIRST_LEVEL — vaulting is on`);
  H.assert(MIXED.every(k => X.eligibleKinds(state.level).includes(k)),
           `${well.name}: ⛔ and on a board where GDD §8.1 has released all six of this ` +
           `file's kinds (${JSON.stringify(X.eligibleKinds(state.level))})`);
  H.eq(bHi, well.lanes - 1.5,
       `${well.name}: ⛔ an open well's top boundary is lanes-1.5 — the wall is not ridable`);

  let laneOut = null, notFinite = null, depthOut = null;
  let nanPath = null, projBad = null;
  let maxEnemies = 0, maxShots = 0;
  let sawSpawn = false, sawKill = false, sawDeath = false;
  let sawEndLane = false, sawRim = false, sawLatticeEnd = false, sawBirth = false;
  let teleported = null, laneMoved = null, crossFast = null;
  let offLattice = null, badSpan = null, liveKill = null;
  let sawSplit = false, sawLay = false;
  const seen = { vaulter: false, carrier: false, weaver: false, thorn: false,
                 bolt: false, drifter: false, surger: false };

  const lanes = new Map();     // lane-crossing enemy -> the lane it held last tick
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
    // on the same tick two children arrive is GDD §6.2's split, resolved from
    // inside collideShots()'s own loop over the array. CS005's two variants
    // split into Drifters and Surgers rather than Vaulters, so the tell is the
    // carrier count falling while ANY other class rises.
    const now = classCounts(state.enemies);
    if (now.carrier < counts.carrier &&
        (now.drifter > counts.drifter || now.surger > counts.surger ||
         now.vaulter > counts.vaulter)) sawSplit = true;
    if (now.thorn > counts.thorn) sawLay = true;
    counts = now;

    for (let k = 0; k < state.enemies.length; k++) {
      const e = state.enemies[k];
      if (e instanceof X.Carrier) seen.carrier = true;
      else if (e instanceof X.WeaverBolt) seen.bolt = true;
      else if (e instanceof X.Weaver) seen.weaver = true;
      else if (e instanceof X.Thorn) seen.thorn = true;
      else if (e instanceof X.Drifter) seen.drifter = true;
      else if (e instanceof X.Surger) seen.surger = true;
      else if (e instanceof X.Vaulter) seen.vaulter = true;

      if (!isFinite(e.lane) || !isFinite(e.depth)) { notFinite = notFinite || `enemy ${e.lane}`; continue; }
      // ⛔ EXACT bounds, no epsilon. Every write to an enemy's lane goes through
      // laneNormalize, which on an open well is a clamp — a value a hair outside
      // is a hop that bypassed the helper.
      if (e.lane < 0 || e.lane > hi) laneOut = laneOut || `enemy at lane ${e.lane}`;
      if (e.depth < 0 || e.depth > 1) depthOut = depthOut || `enemy at depth ${e.depth}`;
      if (e.lane === 0 || e.lane === hi) sawEndLane = true;
      // ⛔ AND THE LATTICE HAS ITS OWN ENDS. A Drifter can never stand in lane 0
      // or lane `hi` — it settles on half-integers — so the CS003/CS004 form of
      // this guard cannot see the entity whose wall behaviour is new here. Its
      // wall is bLo/bHi, and reaching one is what says laneHop's fold bounds
      // were exercised rather than merely passed.
      if (e instanceof X.Drifter && (Object.is(e.lane, bLo) || Object.is(e.lane, bHi))) {
        sawLatticeEnd = true;
      }
      if (e.depth >= 1) sawRim = true;

      if (hopless(e)) {
        // ⛔ TIER 1, THE STRONG FORM. Object.is, not a tolerance: the lane was
        // written once, by the constructor, and nothing since has had any
        // business touching it.
        if (!born.has(e)) born.set(e, e.lane);
        else if (!Object.is(e.lane, born.get(e))) {
          laneMoved = laneMoved || `${e.constructor.name} ${born.get(e)} -> ${e.lane} at tick ${i}`;
        }
      } else {
        // TIERS 2 AND 3 — a per-tick speed bound, and WHICH bound depends on
        // the entity, because they come from different constants.
        const cap = (e instanceof X.Drifter) ? MAX_CROSS_STEP : MAX_LANE_STEP;
        const wasLane = lanes.get(e);
        if (wasLane !== undefined && Math.abs(e.lane - wasLane) > cap) {
          if (e instanceof X.Drifter) crossFast = crossFast || `${wasLane} -> ${e.lane} at tick ${i}`;
          else teleported = teleported || `${wasLane} -> ${e.lane}`;
        }
        lanes.set(e, e.lane);
      }

      // ⛔ THE LATTICE (GDD §3.5) — a Drifter, and nothing else in the build,
      // has one.
      if (e instanceof X.Drifter) {
        if (e.phase === "ride") {
          soakRide = true;
          if (!halfInteger(e.lane) || e.lane < bLo || e.lane > bHi) {
            offLattice = offLattice ||
              `settled at lane ${e.lane}, outside the lattice [${bLo}, ${bHi}] at tick ${i}`;
          }
        } else if (e.phase === "cross") {
          soakCross = true;
          const span = Math.abs(e.crossDelta);
          // ⛔ ONE LANE, or HALF of one on the birth cross. This is "strictly
          // between two adjacent lattice points" in its float-exact form, and
          // it is the assertion a wrapped cross cannot survive.
          if (!(Object.is(span, 1) || Object.is(span, 0.5))) {
            badSpan = badSpan || `crossDelta ${e.crossDelta} in phase "${e.phase}" at tick ${i}`;
          }
        } else if (e.phase === "birth") {
          // ⚠ "birth" IS THE PRE-UPDATE STATE AND NOTHING ELSE, and this soak
          // is where that becomes observable: a Drifter appended by the spawner
          // or by a split lands AFTER the entity pass has walked past it, so it
          // is inspected once with the constructor's values still on it. Its
          // first update() calls startBirth(), which arms the half-cross through
          // beginCrossTo() and leaves the phase at "cross" — the birth
          // half-cross therefore RUNS in "cross" with a span of 0.5, and no
          // Drifter is ever seen in "birth" twice.
          //
          // So the claim available here is the birth model itself (GDD §6.1):
          // unarmed, at a lane CENTRE, before it has settled anywhere.
          if (!Object.is(e.crossDelta, 0)) {
            badSpan = badSpan || `an unstarted Drifter has crossDelta ${e.crossDelta} at tick ${i}`;
          }
          if (!Number.isInteger(e.lane)) {
            badSpan = badSpan ||
              `⛔ a Drifter is born at lane ${e.lane}, not a lane CENTRE, at tick ${i}`;
          }
          sawBirth = true;
        }
      }

      // A Thorn's depth is its LENGTH, so a fall in it is a chip landing —
      // GDD §4.2's economy, running inside a live well.
      if (e instanceof X.Thorn) {
        const was = lengths.get(e);
        if (was !== undefined && e.depth < was) soakChip = true;
        lengths.set(e, e.depth);
      }

      // ⛔ A discharging Surger, seen through the SHIPPED field rather than
      // through the phase string: killDepth is 0 for exactly that window and
      // the rim band either side of it, which is the whole of GDD §4.5 item 3.
      if (e instanceof X.Surger && e.phase === "discharge") {
        soakDischarge = true;
        if (!Object.is(e.killDepth, 0)) {
          liveKill = liveKill || `killDepth ${e.killDepth} in "discharge" at tick ${i}`;
        }
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
    `${well.name}: ⛔ no Vaulter hop crosses the well — an open rim has walls, not a ` +
    `seam (${teleported})`);
  H.assert(!crossFast,
    `${well.name}: ⛔ no Drifter cross exceeds DT / DRIFT_CROSS_TIME lanes per tick — ` +
    `the birth half-cross and the full cross move at the same lane speed (${crossFast})`);
  H.assert(!laneMoved,
    `${well.name}: ⛔ a Carrier, Weaver, Thorn, bolt or SURGER's lane is EXACTLY the ` +
    `lane it entered with, on every tick — the strong form a range check cannot ` +
    `give (${laneMoved})`);
  H.assert(!offLattice,
    `${well.name}: ⛔ a settled Drifter is ON the boundary lattice — a half-integer ` +
    `inside [${bLo}, ${bHi}] (${offLattice})`);
  H.assert(!badSpan,
    `${well.name}: ⛔ every Drifter cross spans exactly one lane, or half of one on ` +
    `the birth cross — strictly between two ADJACENT lattice points (${badSpan})`);
  H.assert(!liveKill,
    `${well.name}: ⛔ a discharging Surger's killDepth is 0 — GDD §4.5 item 3 expressed ` +
    `in an existing field, on a live board rather than by inspection (${liveKill})`);
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
  // quietly stops testing the wall.
  H.assert(sawSpawn, `${well.name}: enemies spawned during the soak`);
  H.assert(sawKill, `${well.name}: and enemies died during it`);
  H.assert(sawDeath, `${well.name}: and the Skimmer was killed at least once`);
  H.assert(sawRim, `${well.name}: an enemy reached the rim — rim hunting ran`);
  H.assert(sawEndLane || sawLatticeEnd,
    `${well.name}: ⛔ the wall was exercised — an enemy reached an end LANE, or a Drifter ` +
    `settled on an end BOUNDARY (end lane ${sawEndLane}, end boundary ${sawLatticeEnd})`);
  H.assert(sawBirth,
    `${well.name}: a Drifter was seen in its unarmed birth state — the lane-centre ` +
    `claim above is not vacuous`);

  H.assert(seen.vaulter && seen.carrier && seen.weaver && seen.thorn &&
           seen.drifter && seen.surger,
    `${well.name}: ⛔ all SIX roster classes were on the board — without this the ` +
    `per-entity lane assertions are claims about entities that never existed ` +
    `(${JSON.stringify(seen)})`);
  H.assert(sawLay, `${well.name}: ⛔ a Weaver laid a Thorn during the soak`);
  if (seen.bolt) soakBolt = true;
  if (sawSplit) soakSplit = true;
}

// ⛔ The knob goes back before anything else runs. Leaving it raised would make
// the seeded runs below a different game from the one that ships.
C.ENEMY_CONCURRENT = SHIPPED_CONCURRENT;
C.ENEMY_CONCURRENT_MAX = SHIPPED_CONCURRENT_MAX;
H.eq(C.ENEMY_CONCURRENT, 3, "the soak's concurrency fixture is put back");
H.eq(C.ENEMY_CONCURRENT_MAX, 8, "and so is its heat endpoint — both halves of the budget");

H.assert(soakChip,
         "⛔ and a Thorn was chipped somewhere in the six-well soak — GDD §4.2's economy " +
         "running inside a live well");
H.assert(soakRide && soakCross,
         `⛔ and Drifters were seen BOTH riding and crossing across the six wells — the ` +
         `lattice assertion is about the settled phase and would be vacuous on a board ` +
         `where nothing ever settled (ride ${soakRide}, cross ${soakCross})`);
H.assert(soakBolt,
         "⛔ and a Weaver bolt was on the board somewhere in the six-well soak — the " +
         "tier-1 exact-lane assertion covers it");
H.assert(soakSplit,
         "⛔ and a Carrier split somewhere in the six-well soak — from inside the " +
         "collision pass, on one of CS005 P4's two new cargo rows");
H.assert(soakDischarge,
         "⛔ and a Surger discharged inside the soak — the killDepth mutation ran on a " +
         "live board, with the real collision pass reading it");

// ---------------------------------------------------------------------------
// GDD 17 item 12 — RUNS seeded runs to the game-over stop, no exception
// ---------------------------------------------------------------------------
//
// GDD §17 asks for a hundred; twenty is what a closing phase can afford on every
// commit. ⛔ On the six-kind list, so a run that ends is one that survived
// splits, lays, chips, bolts, crossings and discharges.
//
// ⛔ AND THE DRIVER IS THE RECORDED LIST PLUS A WALL-TO-WALL PIN, which is the
// one place this file departs from test-cs004-p5.js's shape. Measured, not
// preferred: on `replay` alone, seed 21936494 ran 30,000 ticks without reaching
// the stop, and the board at every sample was ONE CARRIER PARKED AT THE RIM in
// lane 7 with the quota spent. That is a genuine fixed point and not a hang —
// a Carrier is "slow, one lane, never hops" (GDD §6.1) and has no rim behaviour
// at all, so a well whose only survivor is a rim Carrier never clears, and a
// scripted player whose rotation never reaches lane 7 never kills it and is
// never killed by it. ⚠ Three of the six roster classes park rather than hunt.
// The Vaulter hunts at the rim and the Drifter keeps crossing and homes, so
// either will find a stationary player; a Carrier, a Weaver and a Surger will
// not come to you.
//
// The pin is what a real player is and the scripted list is not: it slams the
// craft from one wall to the other every PIN_TICKS, so the rim is swept end to
// end and every parked enemy is eventually met. ⛔ It is still a pure function
// of the tick index, so a failing seed is still replayable — which is the
// property `replay` was chosen for and the reason the pin is added to it rather
// than the adversarial generator used instead.
function replayWide(input, i) {
  replay(input, i);
  if (i % PIN_TICKS === 0) input.mouseMove((Math.floor(i / PIN_TICKS) % 2) ? 4000 : -4000);
}

let threw = null, stuck = null;
let soakMaxEnemies = 0, soakMaxShots = 0, soakNaN = null, soakLevels = 0;
const soakSeen = { vaulter: false, carrier: false, weaver: false, thorn: false,
                   bolt: false, drifter: false, surger: false };

for (let r = 0; r < RUNS && !threw && !stuck; r++) {
  const seed = (SEED + r * 104729) >>> 0;
  try {
    G.reset();
    X.startGame(seed);
    // Trap 1, repaired: the level is the arming. ⛔ A soak to game over is a
    // PLAYED run, so it is started on a full board and left to escalate from
    // there rather than pinned — GDD §8.1 has nothing left to add at 23.
    state.level = MIXED_LEVEL;
    state.wellIndex = (MIXED_LEVEL - 1) % X.WELLS.length;
    X.enterWell();
    let ticks = 0;
    while (state.screen !== "gameover" && ticks < RUN_CAP) {
      replayWide(G.input, ticks);
      G.update(DT);
      ticks++;
      if (state.enemies.length > soakMaxEnemies) soakMaxEnemies = state.enemies.length;
      if (state.shots.length > soakMaxShots) soakMaxShots = state.shots.length;
      if (!soakNaN) soakNaN = firstNaN(state, "state", 0);
      const n = classCounts(state.enemies);
      for (const k of Object.keys(n)) if (n[k] > 0) soakSeen[k] = true;
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
H.assert(soakLevels > MIXED_LEVEL,
         `the soak cleared at least one well — nextWell() ran (reached ${soakLevels} from ` +
         `${MIXED_LEVEL}). ⛔ REWRITTEN, CS007 P3: "> 1" is true of a run that starts at ` +
         `MIXED_LEVEL and clears nothing`);
H.assert(soakSeen.vaulter && soakSeen.carrier && soakSeen.weaver && soakSeen.thorn &&
         soakSeen.bolt && soakSeen.drifter && soakSeen.surger,
         `⛔ and the runs were six-kind ones — every roster class appeared ` +
         `(${JSON.stringify(soakSeen)})`);

H.report("test-cs005-p5.js");
