// test-cs007-p3.js — CS007 P3: GDD §8.1's introduction schedule (GDD §6.1,
// §6.2, §8, §8.1, §17 item 1).
//
// Asserts what P3 owns: which kinds a well may release at a level, that the
// answer is a function of the level and nothing else, that the no-draw rule
// survived the change of reader, and that C.DEBUG_SPAWN_KINDS is gone. It makes
// no claim about heat's seven accessors (P2's), telemetry (P4's) or scoring.
//
// ⛔ FIVE TRAPS IN THE FIXTURES.
//  1. Boot calls startGame(), so the live state at load is a run in progress.
//     Every case starts from G.reset() + startGame(SEED).
//  2. ⛔ THE LIVE RUNS PIN THEIR LEVEL by topping up `state.spawn.remaining`
//     every tick. A well that clears advances the level, and the level IS the
//     fixture here — a run that walked into the next band would assert the
//     wrong band's set. ⛔ No dive is wanted in these cases, so the top-up costs
//     nothing; test-cs006-p5.js's counting runs need dives and stop at their
//     band's edge instead.
//  3. ⛔ THE NEGATIVE CLAIMS ACCOUNT FOR PARENTS. `thorn` and `weaverBolt` are
//     not schedule rows and never can be — they enter through Weaver.layThorn()
//     and Weaver.fire() — so "no Thorn below level 5" is a claim about the
//     WEAVER's eligibility, not the Thorn's. A Carrier's split is the same
//     shape: two Drifters can reach the board from a `carrierDrifter`, and
//     `carrierDrifter` is not eligible until 18, by which time `drifter` has
//     been eligible for nine levels anyway.
//  4. The uniformity case is a DISTRIBUTION over 70,000 picks, not a sequence.
//     ⛔ It is what stands where a weight table would be (Paul's C3 call): a
//     weighted draw would push at least one kind well off 1/7, and the measured
//     worst deviation on the shipped build is 0.0022.
//  5. §6 reads the BUILT file — the behaviour oracle (GDD §16.2) — RAW, with
//     comments left in. A deleted constant that survives in a comment is a
//     stale pointer, which is the thing this assertion exists to catch.
"use strict";

const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260830;
const DT_TICKS = 1200;      // 20 s of a pinned well, enough for a full quota

installSeed(SEED);
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const state = X.state;
const DT = C.FIXED_DT;

// GDD §8.1, as this phase built it. ⛔ THE EXPECTED SETS ARE WRITTEN OUT HERE
// RATHER THAN DERIVED FROM C.SPAWN_SCHEDULE — a test that computed them from the
// data under test would pass on any schedule at all.
const BANDS = [
  { from:  1, to:  2, kinds: ["vaulter"] },
  { from:  3, to:  4, kinds: ["vaulter", "carrierVaulter"] },
  { from:  5, to:  8, kinds: ["vaulter", "carrierVaulter", "weaver"] },
  { from:  9, to: 12, kinds: ["vaulter", "carrierVaulter", "weaver", "drifter"] },
  { from: 13, to: 17, kinds: ["vaulter", "carrierVaulter", "weaver", "drifter", "surger"] },
  { from: 18, to: 22, kinds: ["vaulter", "carrierVaulter", "weaver", "drifter", "surger",
                              "carrierDrifter"] },
  { from: 23, to: 99, kinds: ["vaulter", "carrierVaulter", "weaver", "drifter", "surger",
                              "carrierDrifter", "carrierSurger"] },
];
const BOUNDARIES = [3, 5, 9, 13, 18, 23];

function expectedAt(level) {
  for (const b of BANDS) if (level >= b.from && level <= b.to) return b.kinds;
  return BANDS[BANDS.length - 1].kinds;      // 23+ saturates
}

H.assert(typeof X.eligibleKinds === "function", "eligibleKinds is in the build");
H.assert(typeof X.pickSpawnKind === "function", "⛔ and pickSpawnKind kept its name");

// ---------------------------------------------------------------------------
// 1. ⛔ THE SCHEDULE IS DATA IN C, AND ITS SHAPE IS LOAD-BEARING
// ---------------------------------------------------------------------------

H.assert(Array.isArray(C.SPAWN_SCHEDULE), "⛔ C.SPAWN_SCHEDULE is DATA in C (CLAUDE.md)");
H.eq(C.SPAWN_SCHEDULE.length, 7,
     "⛔ seven rows — the seven SPAWNER-ELIGIBLE ENEMY_KINDS rows, and no more");
H.eq(C.SPAWN_SCHEDULE[0].level, 1,
     "⛔ the first row's level is 1 — state.level starts there, and an empty eligible set " +
     "is a well that cannot release anything");

let sorted = true, kindsOk = true, extraField = null;
const seenKinds = new Set();
for (let i = 0; i < C.SPAWN_SCHEDULE.length; i++) {
  const row = C.SPAWN_SCHEDULE[i];
  if (i > 0 && !(row.level > C.SPAWN_SCHEDULE[i - 1].level)) sorted = false;
  if (!(row.kind in X.ENEMY_KINDS)) kindsOk = false;
  if (seenKinds.has(row.kind)) kindsOk = false;
  seenKinds.add(row.kind);
  for (const k of Object.keys(row)) if (k !== "level" && k !== "kind") extraField = `${row.kind}.${k}`;
}
H.assert(sorted,
         "⛔ the rows are in STRICTLY ASCENDING level order — eligibleKinds() returns them in " +
         "schedule order, and a uniform pick over a reordered set is a different run");
H.assert(kindsOk, "⛔ and every row names a distinct ENEMY_KINDS row");

// ⛔ C3, ASSERTED AS AN ABSENCE (Paul, 2026-08-31 — DECISIONS.md;
// PLANNED-FEATURES-CS007.md §5.3). GDD §8's "Carrier cargo weights shift toward
// Drifter/Surger" is delivered by ARITHMETIC — three variants, three rows — and
// ⛔ THERE IS NO WEIGHT TABLE. A future session adding a `weight` field would
// turn this red, which is the point: the absence is a decision, not a gap.
H.eq(extraField, null,
     `⛔ NO ROW CARRIES ANYTHING BUT level AND kind — there is no cargo weight table and ` +
     `there is not meant to be one (${extraField})`);

// ⛔ AND THE TWO KINDS THAT ARE NOT THE SPAWNER'S ARE ABSENT BY NAME. Both are
// real ENEMY_KINDS rows — asserted, or "absent from the schedule" would be true
// of a kind that simply did not exist.
for (const k of ["thorn", "weaverBolt"]) {
  H.assert(k in X.ENEMY_KINDS, `${k} IS an ENEMY_KINDS row`);
  H.assert(!seenKinds.has(k),
           `⛔ but ${k} is NOT a schedule row — it enters through its Weaver parent, and a ` +
           `row here would put one in the throat with nothing that made it`);
}

// ---------------------------------------------------------------------------
// 2. ⛔ THE ELIGIBLE SET AT EVERY LEVEL, AND THE SIX BOUNDARIES
// ---------------------------------------------------------------------------

let setWrong = null;
for (let L = 1; L <= 40; L++) {
  const got = X.eligibleKinds(L);
  if (JSON.stringify(got) !== JSON.stringify(expectedAt(L))) {
    setWrong = setWrong || `level ${L}: ${JSON.stringify(got)}`;
  }
}
H.eq(setWrong, null,
     `⛔ GDD §8.1's eligible set is exact at every level 1..40 (${setWrong})`);

// ⛔ THE BOUNDARIES, EACH ONE ASSERTED FROM BOTH SIDES. A schedule that had a
// row a level early would still satisfy the band table above if the table were
// wrong the same way; this reads the STEP.
for (const b of BOUNDARIES) {
  const before = X.eligibleKinds(b - 1);
  const after = X.eligibleKinds(b);
  H.eq(after.length, before.length + 1,
       `⛔ level ${b} adds exactly ONE kind (${before.length} -> ${after.length})`);
  H.assert(before.every((k, i) => after[i] === k),
           `⛔ and level ${b - 1}'s set is a PREFIX of level ${b}'s — the set only ever grows, ` +
           `so a kind the player has learned never stops arriving`);
}

// ⛔ AND IT STEPS NOWHERE ELSE, over a range far past anything a player reaches.
let strayStep = null, shrank = null;
for (let L = 2; L <= 200; L++) {
  const prev = X.eligibleKinds(L - 1), now = X.eligibleKinds(L);
  if (now.length < prev.length) shrank = shrank || `level ${L}`;
  if (now.length !== prev.length && BOUNDARIES.indexOf(L) === -1) strayStep = strayStep || `level ${L}`;
}
H.eq(strayStep, null,
     `⛔ the set changes at 3, 5, 9, 13, 18, 23 and at NO other level in 1..200 (${strayStep})`);
H.eq(shrank, null, `⛔ and it never shrinks (${shrank})`);
H.eq(JSON.stringify(X.eligibleKinds(200)), JSON.stringify(X.eligibleKinds(23)),
     "⛔ and it saturates at 23 — GDD §8.1's 'full mix; heat alone' from there on");

// ⛔ A FUNCTION OF THE LEVEL AND NOTHING ELSE. Same level, wildly different
// board and stream: same answer.
G.reset();
X.startGame(SEED);
const cleanSet = JSON.stringify(X.eligibleKinds(13));
state.level = 13;
for (let i = 0; i < 40; i++) X.spawnEnemy("vaulter", i % 5, 0.3);
state.rng = X.mulberry32(SEED + 99);
H.eq(JSON.stringify(X.eligibleKinds(13)), cleanSet,
     "⛔ eligibleKinds reads the level and nothing else — a full board and a different " +
     "stream do not move it");

// ---------------------------------------------------------------------------
// 3. ⛔ THE NO-DRAW RULE, AS A FUNCTION OF THE ELIGIBLE SET'S SIZE
// ---------------------------------------------------------------------------
//
// ⛔ THE CONTRACT DID NOT MOVE WHEN THE READER DID. rngPick() on a
// single-element array still advances the run's ONE stream (01-rng.js), and
// that stream is shared with every spawn lane in the run — so a draw spent at
// levels 1-2 would move test-cs004-p1.js's GOLDEN_LANES, whose whole 3,000-tick
// window lives there. test-cs006-p5.js carries the same claim counted on a live
// board; this is it counted per level.

G.reset();
X.startGame(SEED);
state.enemies = [];
const real = state.rng;
let draws = 0;
state.rng = () => { draws++; return real(); };

let drawWrong = null, offSchedule = null;
for (let L = 1; L <= 30; L++) {
  state.level = L;
  const set = X.eligibleKinds(L);
  draws = 0;
  for (let i = 0; i < 25; i++) {
    const kind = X.pickSpawnKind(state);
    if (set.indexOf(kind) === -1) offSchedule = offSchedule || `level ${L} released ${kind}`;
  }
  const want = set.length < 2 ? 0 : 25;
  if (draws !== want) drawWrong = drawWrong || `level ${L} (set ${set.length}) spent ${draws}, want ${want}`;
}
state.rng = real;
H.eq(drawWrong, null,
     `⛔ a one-entry eligible set spends NO draw and every larger one spends EXACTLY ONE, ` +
     `at every level 1..30 (${drawWrong})`);
H.eq(offSchedule, null,
     `⛔ and pickSpawnKind never returns a kind the level has not introduced (${offSchedule})`);

// The pick replays: same seed, same sequence. GDD §17 item 1's guarantee, at
// the one function this phase changed.
function kindSeq(level, n) {
  state.level = level;
  state.rng = X.mulberry32(SEED);
  const out = [];
  for (let i = 0; i < n; i++) out.push(X.pickSpawnKind(state));
  return out.join(",");
}
H.eq(kindSeq(23, 200), kindSeq(23, 200),
     "⛔ two runs of the pick on one seed produce the same kind sequence");
H.assert(kindSeq(23, 200) !== kindSeq(18, 200),
         "and a different eligible set produces a different one — the case above is not vacuous");

// ---------------------------------------------------------------------------
// 4. ⛔ C3 — A UNIFORM PICK, AND THE CARGO MIX THAT FALLS OUT OF IT
// ---------------------------------------------------------------------------
//
// ⛔ Paul's call, 2026-08-31: the cargo mix shifts because the SET grows, not
// because anything weighs it. Both halves are asserted — the pick is uniform,
// and the arithmetic delivers GDD §8's row.

const N = 70000;
state.level = 23;
state.rng = X.mulberry32(SEED);
const tally = {};
for (const k of X.eligibleKinds(23)) tally[k] = 0;
for (let i = 0; i < N; i++) tally[X.pickSpawnKind(state)]++;
let worst = 0, worstKind = null;
for (const k of Object.keys(tally)) {
  const d = Math.abs(tally[k] / N - 1 / 7);
  if (d > worst) { worst = d; worstKind = k; }
}
H.assert(worst < 0.015,
         `⛔ THE KIND PICK IS UNIFORM over the eligible set — no weight table (worst ` +
         `deviation from 1/7 is ${worst.toFixed(4)} on ${worstKind}; ⚠ MEASURED 0.0022 on ` +
         `the shipped build, so this bound is loose by a factor of six)`);

// ⛔ GDD §8's "cargo weights shift toward Drifter/Surger", delivered by
// arithmetic. The Carrier SHARE of the set and the cargo split WITHIN Carriers
// are two different numbers and both come from the same three rows.
function carriers(level) {
  return X.eligibleKinds(level).filter(k => k.indexOf("carrier") === 0);
}
H.eq(carriers(3).length, 1, "levels 3-17: one Carrier variant — cargo is 100 % Vaulter");
H.eq(carriers(17).length, 1, "…and still one at 17, the last level before the Drifter cargo");
H.eq(carriers(18).length, 2, "⛔ level 18: two — the cargo split becomes 50/50 Vaulter/Drifter");
H.eq(carriers(22).length, 2, "…and still two at 22");
H.eq(carriers(23).length, 3, "⛔ level 23: three — 33/33/33, GDD §8's row delivered in full");
H.eq(X.eligibleKinds(23).length, 7,
     "and the Carrier share of the whole set is 3/7 — the mix shifted with no second draw " +
     "and no constant");

// ---------------------------------------------------------------------------
// 5. ⛔ THROUGH THE REAL SPAWNER, ON A LIVE WELL AT EVERY BAND
// ---------------------------------------------------------------------------
//
// The sections above drive one function. This drives Game.update() and reads
// what actually came out of the throat — trap 2 pins the level, trap 3 says why
// the negative claims are about PARENTS.

function bandRun(level, ticks) {
  G.reset();
  X.startGame(SEED);
  state.level = level;
  state.wellIndex = (level - 1) % X.WELLS.length;
  X.enterWell();
  const seen = { vaulter: false, carrier: false, weaver: false, thorn: false,
                 bolt: false, drifter: false, surger: false };
  const cargo = new Set();
  for (let i = 0; i < ticks; i++) {
    state.spawn.remaining = C.SPAWN_QUOTA;      // trap 2 — pin the level
    state.lives = C.START_LIVES;
    if (i % 7 === 0) G.input.mouseMove(((i * 37) % 181) - 90);
    if (i % 13 === 0) G.input.keyDown(" ");
    if (i % 13 === 9) G.input.keyUp(" ");
    G.update(DT);
    for (const e of state.enemies) {
      if (e instanceof X.Carrier) { seen.carrier = true; cargo.add(e.cargo); }
      else if (e instanceof X.WeaverBolt) seen.bolt = true;
      else if (e instanceof X.Weaver) seen.weaver = true;
      else if (e instanceof X.Thorn) seen.thorn = true;
      else if (e instanceof X.Drifter) seen.drifter = true;
      else if (e instanceof X.Surger) seen.surger = true;
      else if (e instanceof X.Vaulter) seen.vaulter = true;
    }
  }
  H.eq(state.level, level, `level ${level}: the run stayed in its band — the pin held`);
  return { seen, cargo };
}

// ⛔ THE LAST LEVEL OF EACH BAND — the strongest place to make the NEGATIVE
// claim, because it is the level at which the next kind is closest to arriving.
const b2 = bandRun(2, DT_TICKS);
H.assert(b2.seen.vaulter, "level 2: Vaulters reached the board");
H.assert(!b2.seen.carrier && !b2.seen.weaver && !b2.seen.thorn && !b2.seen.bolt &&
         !b2.seen.drifter && !b2.seen.surger,
         `⛔ AND NOTHING ELSE DID — a level-2 well is a Vaulter well, which is what makes ` +
         `every level-1 golden in this suite a recording of the shipped game ` +
         `(${JSON.stringify(b2.seen)})`);

const b4 = bandRun(4, DT_TICKS);
H.assert(b4.seen.carrier, "⛔ level 3-4: the Carrier arrived (GDD §8.1)");
H.assert(!b4.seen.weaver && !b4.seen.thorn && !b4.seen.bolt,
         "⛔ and the Weaver has NOT — which is also why no Thorn is standing, trap 3");
H.assert(!b4.seen.drifter && !b4.seen.surger, "⛔ nor the Drifter, nor the Surger");
H.eq(JSON.stringify([...b4.cargo]), JSON.stringify(["vaulter"]),
     "⛔ and every Carrier's cargo is a Vaulter — 100 %, by arithmetic and not by a weight");

const b8 = bandRun(8, DT_TICKS);
H.assert(b8.seen.weaver, "⛔ level 5-8: the Weaver arrived");
H.assert(b8.seen.thorn,
         "⛔ and a Thorn with it — laid by its parent, never released by the spawner (trap 3)");
H.assert(!b8.seen.drifter && !b8.seen.surger, "⛔ and still no Drifter and no Surger");

const b12 = bandRun(12, DT_TICKS);
H.assert(b12.seen.drifter, "⛔ level 9-12: the Drifter arrived");
H.assert(!b12.seen.surger, "⛔ and the Surger has not");

const b17 = bandRun(17, DT_TICKS);
H.assert(b17.seen.surger, "⛔ level 13-17: the Surger arrived — the roster is complete");
H.eq(JSON.stringify([...b17.cargo].sort()), JSON.stringify(["vaulter"]),
     "⛔ and cargo is STILL 100 % Vaulter at 17 — the Drifter is on the board but not " +
     "inside a hull yet");

const b22 = bandRun(22, DT_TICKS);
H.assert(b22.cargo.has("drifter"), "⛔ level 18-22: Drifter cargo arrived (GDD §6.2)");
H.assert(!b22.cargo.has("surger"), "⛔ and Surger cargo has not");

const b23 = bandRun(23, DT_TICKS);
H.assert(b23.cargo.has("surger"),
         "⛔ level 23: Surger cargo — GDD §6.2's table is complete on a live board, and " +
         "GDD §8's cargo shift is delivered with no weight table anywhere in the build");

// ---------------------------------------------------------------------------
// 6. ⛔ THE PLACEHOLDER IS GONE, AND THE BENCH THAT SHARED ITS ⚠ IS NOT
// ---------------------------------------------------------------------------
//
// H5, Paul's call. C.DEBUG_SPAWN_KINDS answered "what does the well RELEASE" — a
// difficulty question the schedule now owns — and the seven debug spawn keys
// answer "put ONE of these on screen so I can look at it", which the schedule
// neither addresses nor can. ⛔ A placeholder that outlives its replacement is
// what this section exists to prevent (CS006 P3 deleted C.WELL_CLEAR_HOLD the
// same way, and test-cs003-p2.js still asserts its absence).

H.assert(!("DEBUG_SPAWN_KINDS" in C), "⛔ C.DEBUG_SPAWN_KINDS is GONE from C");

const buildSrc = H.extractScript(
  require("fs").readFileSync(path.join(__dirname, "..", "dist", "vector-vortex.html"), "utf8"));
H.assert(buildSrc.indexOf("SPAWN_SCHEDULE") !== -1,
         "the scan is looking at the real build — SPAWN_SCHEDULE is in it");
H.eq(buildSrc.indexOf("DEBUG_SPAWN_KINDS"), -1,
     "⛔ AND DEBUG_SPAWN_KINDS DOES NOT APPEAR ANYWHERE IN THE BUILT FILE — not as a " +
     "constant, not as a reader, and not as a comment pointing at one that no longer exists");

// ⛔ AND THE BENCH SURVIVED, PROVED BY DRIVING IT ON A LEVEL WHERE THE SCHEDULE
// SAYS NO. Pressing `5` at level 1 puts a Drifter on the board, and GDD §8.1
// does not release one until level 9 — so the two mechanisms are demonstrably
// separate, which is the whole content of the H5 call.
G.reset();
X.startGame(SEED);
state.enemies = [];
H.eq(state.level, 1, "the bench case runs at level 1");
H.assert(X.eligibleKinds(1).indexOf("drifter") === -1,
         "where GDD §8.1 does not release a Drifter");
G.input.keyDown("5");
G.update(DT);
G.input.keyUp("5");
const benched = state.enemies.filter(e => e instanceof X.Drifter);
H.eq(benched.length, 1,
     "⛔ and pressing `5` still puts exactly one Drifter on it — the bench keys are NOT " +
     "TEMPORARY, they are how the ⚠ provisional palette is judged on hardware, and they " +
     "ship until CS016 decides whether debug keys ship at all");

H.report("test-cs007-p3.js");
