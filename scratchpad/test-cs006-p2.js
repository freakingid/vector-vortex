// test-cs006-p2.js — CS006 P2: throatOffset's definition, the Flat and the
// Stair, and GDD §17 item 2's lane-legibility gate. Geometry and data only.
//
// Asserts what P2 owns. No claim about the Dive, laneState, past-99 or heat.
//
// ⛔ FOUR TRAPS IN THE FIXTURES.
//  1. THE GOLDENS BELOW WERE RECORDED FROM THE BUILD AT 8e0fb7c (CS006 P1),
//     BEFORE EITHER OFFSET EXISTED. They are the only way this file can say
//     "changed here and nowhere else" — a same-build comparison is
//     self-consistent and would prove nothing. Re-record only with a named
//     cause, the way test-cs004-p1.js's GOLDEN_LANES is re-recorded.
//     Run `node scratchpad/test-cs006-p2.js --record` to print them.
//  2. wellThroat() MEMOIZES under a non-configurable key, so no case here may
//     mutate a well and re-derive: every assertion reads the one cached throat.
//  3. The two sweep hashes must be non-constant or every "unchanged" case is
//     vacuous — asserted directly, well against well.
//  4. The determinism hash comes from a CHILD PROCESS running the closed
//     test-cs005-p5.js. Comparing it in-process would compare this build with
//     itself; the constant is what makes it a cross-build claim.
"use strict";

const { execFileSync } = require("child_process");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260830;

installSeed(SEED);
const X = H.buildGame();
const C = X.C;
const WELLS = X.WELLS;

const RECORD = process.argv.includes("--record");

// ---------------------------------------------------------------------------
// the two sweeps, and the 32-bit hash that pins each one
// ---------------------------------------------------------------------------

// FNV-1a over rounded coordinates. Rounding is what makes the hash survive a
// rebuild: the values are identical bit-for-bit, but a hash of raw doubles
// would also be a hash of how they were serialized.
function mix(h, v) {
  const n = Math.round(v * 1e6) | 0;
  h ^= n; h = Math.imul(h, 16777619);
  return h >>> 0;
}

// Every legal lane of a well, at a quarter-lane step. A closed well's lane
// space is a circle of circumference `lanes`; an open one's is [0, lanes-1].
function legalLanes(well) {
  const out = [];
  const hi = well.closed ? well.lanes - 0.25 : well.lanes - 1;
  for (let L = 0; L <= hi + 1e-9; L += 0.25) out.push(Math.round(L * 4) / 4);
  return out;
}

// screenPos over every legal lane x eleven depths. ⛔ This is the PAINT-TIME
// projection and the only thing a throatOffset may move.
function screenHash(well) {
  let h = 2166136261 >>> 0;
  const p = { x: 0, y: 0 };
  for (const L of legalLanes(well)) {
    for (let d = 0; d <= 10; d++) {
      X.screenPos(well, L, d / 10, p);
      h = mix(h, p.x); h = mix(h, p.y);
    }
  }
  return h;
}

// Every lane-SPACE helper over the same lanes. ⛔ An offset throat moves the
// visual end of an open well and moves nothing in here; the two must not be
// confusable later (PLANNED-FEATURES-CS006.md, hazard 4).
function laneHash(well) {
  let h = 2166136261 >>> 0;
  h = mix(h, X.laneBoundaryLo(well));
  h = mix(h, X.laneBoundaryHi(well));
  const lo = X.laneBoundaryLo(well), hi = X.laneBoundaryHi(well);
  for (const L of legalLanes(well)) {
    h = mix(h, X.laneWrap(well, L));
    h = mix(h, X.laneClamp(well, L));
    h = mix(h, X.laneNormalize(well, L));
    h = mix(h, X.laneAtWall(well, L) ? 1 : 0);
    for (const b of [0, 1.5, well.lanes - 0.5]) h = mix(h, X.laneDelta(well, L, b));
    for (const dir of [-1, 1]) {
      const bf = X.boundaryFrom(well, L, dir);
      h = mix(h, bf.lane); h = mix(h, bf.dir);
      for (const delta of [0, 1, -1, 2.5, -7]) {
        const a = X.laneHop(well, L, delta, dir);            // lane-centre bounds
        const b = X.laneHop(well, L, delta, dir, lo, hi);    // lattice bounds
        h = mix(h, a.lane); h = mix(h, a.dir);
        h = mix(h, b.lane); h = mix(h, b.dir);
      }
    }
  }
  return h;
}

// The lane-CENTRE spoke: throat point to rim point for lane L, in world px.
// ⛔ NOT the vertex spoke the renderer draws — polyAt puts lane L at vertex
// parameter L + 0.5, so a lane centre is the midpoint of two vertices, and on
// the Stair that difference is the whole finding.
const _sa = { x: 0, y: 0 }, _sb = { x: 0, y: 0 };
function spokePx(well, lane) {
  X.screenPos(well, lane, 0, _sa);
  const tx = _sa.x, ty = _sa.y;
  X.screenPos(well, lane, 1, _sb);
  return Math.hypot(_sb.x - tx, _sb.y - ty);
}

function minSpoke(well) {
  let min = Infinity;
  for (let L = 0; L < well.lanes; L++) min = Math.min(min, spokePx(well, L));
  return min;
}

if (RECORD) {
  const s = WELLS.map(screenHash), l = WELLS.map(laneHash);
  const m = WELLS.map(w => Math.round(minSpoke(w) * 10) / 10);
  const fmt = (name, a) => `const ${name} = [\n  ` +
    a.map((v, i) => `${v},`.padEnd(13) + `// ${WELLS[i].id} ${WELLS[i].name}`).join("\n  ") + "\n];";
  console.log(fmt("GOLDEN_SCREEN", s));
  console.log(fmt("GOLDEN_LANE", l));
  console.log(fmt("GOLDEN_MIN_SPOKE_PX", m));
  process.exit(0);
}

// ---------------------------------------------------------------------------
// ⛔ THE GOLDENS — recorded at 8e0fb7c, the CS006 P1 build, offsets absent.
// ---------------------------------------------------------------------------

const GOLDEN_SCREEN = [
  4228559981,  // 1 Ring
  596247805,   // 2 Box
  1586879565,  // 3 Cross
  1485274709,  // 4 Bowtie
  2767880866,  // 5 Pinwheel
  2842509526,  // 6 Delta
  3445728765,  // 7 Clover
  546049742,   // 8 Vee
  2494918559,  // 9 Stair
  2966810574,  // 10 Trough
  4111663426,  // 11 Flat
  2788554881,  // 12 Heart
  3473639093,  // 13 Star
  1312409443,  // 14 Double-Vee
  1736606747,  // 15 Fan
  204896789,   // 16 Twist
];

// ⚠ Identical rows are correct and are the point: lane space is a function of
// `closed` and `lanes` and of nothing geometric. All seven closed 16-lane wells
// share one hash, and so do the Flat and the Stair — both open, both 12 lanes.
const GOLDEN_LANE = [
  2130817677,  // 1 Ring
  2130817677,  // 2 Box
  2130817677,  // 3 Cross
  438478509,   // 4 Bowtie
  2130817677,  // 5 Pinwheel
  197729149,   // 6 Delta
  2130817677,  // 7 Clover
  1671661455,  // 8 Vee
  2866777247,  // 9 Stair
  1285520063,  // 10 Trough
  2866777247,  // 11 Flat
  2130817677,  // 12 Heart
  2130817677,  // 13 Star
  1285520063,  // 14 Double-Vee
  2720459503,  // 15 Fan
  2130817677,  // 16 Twist
];

const GOLDEN_MIN_SPOKE_PX = [
  278.1,       // 1 Ring
  292.2,       // 2 Box
  215.6,       // 3 Cross
  122.8,       // 4 Bowtie
  207.1,       // 5 Pinwheel
  141.7,       // 6 Delta
  224.2,       // 7 Clover
  121.9,       // 8 Vee
  30.4,        // 9 Stair      ⛔ under the gate
  126,         // 10 Trough
  23.6,        // 11 Flat      ⛔ under the gate
  106.2,       // 12 Heart
  209,         // 13 Star
  76.5,        // 14 Double-Vee
  85.1,        // 15 Fan
  73.9,        // 16 Twist     the tightest well the gate must not fail
];

// The two wells this phase moves, by index into WELLS.
const FLAT = 10, STAIR = 8;

// ---------------------------------------------------------------------------
// 1. the data: two offsets, and fourteen wells that are not a special case
// ---------------------------------------------------------------------------

H.eq(WELLS[FLAT].name, "Flat", "WELLS[10] is the Flat");
H.eq(WELLS[STAIR].name, "Stair", "WELLS[8] is the Stair");

let carriers = 0;
for (let i = 0; i < WELLS.length; i++) {
  const w = WELLS[i];
  if (w.throatOffset === undefined) continue;
  carriers++;
  H.assert(i === FLAT || i === STAIR,
           `only the Flat and the Stair carry a throatOffset (${w.name} does)`);
  H.assert(typeof w.throatOffset.x === "number" && typeof w.throatOffset.y === "number",
           `${w.name}'s offset is a {x, y} pair of numbers`);
}
H.eq(carriers, 2, "exactly two wells carry a throatOffset");

// ---------------------------------------------------------------------------
// 2. ⛔ the DEFINITION, asserted rather than commented: throatOffset TRANSLATES
//    the throat polygon in normalized rim space, AFTER the centroid scale.
//
//    Two independent consequences, and together they are the definition:
//      - the throat polygon's own centroid is the rim centroid PLUS the offset
//        (scaling a polygon toward its centroid leaves that centroid put), and
//      - every throat vertex sits at exactly throatScale of the rim vertex's
//        displacement from the rim centroid, offset or no offset. A scale
//        applied after a translate, or a translate of the RIM, fails this one.
// ---------------------------------------------------------------------------

for (const w of WELLS) {
  const n = X.wellVertCount(w);
  const c = X.wellCentroid(w);
  const t = X.wellThroat(w);
  const ox = (w.throatOffset && w.throatOffset.x) || 0;
  const oy = (w.throatOffset && w.throatOffset.y) || 0;

  let tx = 0, ty = 0;
  for (let i = 0; i < n; i++) { tx += t[i].x; ty += t[i].y; }
  tx /= n; ty /= n;
  H.close(tx, c.x + ox, 1e-12, `${w.name}: throat centroid x is the rim centroid + offset.x`);
  H.close(ty, c.y + oy, 1e-12, `${w.name}: throat centroid y is the rim centroid + offset.y`);

  let worstX = 0, worstY = 0;
  for (let i = 0; i < n; i++) {
    worstX = Math.max(worstX, Math.abs((t[i].x - tx) - (w.rim[i].x - c.x) * w.throatScale));
    worstY = Math.max(worstY, Math.abs((t[i].y - ty) - (w.rim[i].y - c.y) * w.throatScale));
  }
  H.close(worstX, 0, 1e-12, `${w.name}: the offset translates, it does not rescale (x)`);
  H.close(worstY, 0, 1e-12, `${w.name}: the offset translates, it does not rescale (y)`);
}

// ⛔ And the memo survives an offset. wellThroat() caches under a
// non-enumerable key and its header assumes the rim is IMMUTABLE at runtime;
// an offset in the DATA is immutable and safe, one written later would be read
// once and cached forever.
for (const i of [FLAT, STAIR, 0]) {
  const w = WELLS[i];
  const a = X.wellThroat(w), b = X.wellThroat(w);
  H.assert(a === b, `${w.name}: wellThroat() returns the SAME array on a second call`);
  H.assert(Object.keys(w).indexOf("_throat") === -1,
           `${w.name}: the memo stays non-enumerable, so the data still diffs as data`);
}

// ---------------------------------------------------------------------------
// 3. ⛔ THE LEGIBILITY GATE (GDD §17 item 2). Every lane centre of all sixteen
//    wells has a spoke of at least C.MIN_LANE_SPOKE_PX. It is a GATE: a well
//    that fails it is redrawn or offset, never the constant lowered.
// ---------------------------------------------------------------------------

H.assert(typeof C.MIN_LANE_SPOKE_PX === "number", "C.MIN_LANE_SPOKE_PX exists");

let visited = 0, expected = 0, worstPx = Infinity, worstWell = "";
for (const w of WELLS) {
  expected += w.lanes;
  for (let L = 0; L < w.lanes; L++) {
    const px = spokePx(w, L);
    visited++;
    if (px < worstPx) { worstPx = px; worstWell = `${w.name} lane ${L}`; }
    H.assert(px >= C.MIN_LANE_SPOKE_PX,
             `${w.name} lane ${L}: spoke ${px.toFixed(1)} px >= MIN_LANE_SPOKE_PX`);
  }
}
H.eq(visited, expected, "the walk visited every lane centre of every well (non-vacuous)");
H.assert(worstPx >= C.MIN_LANE_SPOKE_PX,
         `the tightest lane in the game is ${worstWell} at ${worstPx.toFixed(1)} px`);

// ⛔ And the gate SEPARATES. Recorded from the pre-offset build: the two wells
// this phase fixes were the only two under the line, and no untouched well is
// anywhere near it. A gate every well passes by accident is not a gate.
for (let i = 0; i < WELLS.length; i++) {
  const was = GOLDEN_MIN_SPOKE_PX[i];
  if (i === FLAT || i === STAIR) {
    H.assert(was < C.MIN_LANE_SPOKE_PX,
             `${WELLS[i].name} FAILED the gate before this phase (${was} px)`);
  } else {
    H.assert(was >= C.MIN_LANE_SPOKE_PX,
             `${WELLS[i].name} passed the gate before this phase too (${was} px)`);
    H.close(minSpoke(WELLS[i]), was, 0.05,
            `${WELLS[i].name}'s tightest spoke is unmoved by this phase`);
  }
}

// ---------------------------------------------------------------------------
// 4. ⛔ screenPos MOVES ON THE FLAT AND THE STAIR AND ON NO OTHER WELL.
// ---------------------------------------------------------------------------

for (let i = 0; i < WELLS.length; i++) {
  const w = WELLS[i], h = screenHash(w);
  if (i === FLAT || i === STAIR) {
    H.assert(h !== GOLDEN_SCREEN[i],
             `⛔ ${w.name}: screenPos MOVED — the offset actually reached the paint path`);
  } else {
    H.eq(h, GOLDEN_SCREEN[i], `${w.name}: screenPos is bit-identical to the P1 build`);
  }
}
H.assert(screenHash(WELLS[0]) !== screenHash(WELLS[1]),
         "the screen sweep hash is not a constant (non-vacuous)");

// ---------------------------------------------------------------------------
// 5. ⛔ AND NO LANE-SPACE HELPER MOVES ON ANY WELL, THE TWO OFFSET ONES
//    INCLUDED. laneClamp and polyAt's backstop are functions of well.lanes,
//    not of geometry. The visual end of the Stair moved; its lane space did
//    not, and CS005's boundary lattice is a lane-space fact.
// ---------------------------------------------------------------------------

for (let i = 0; i < WELLS.length; i++) {
  H.eq(laneHash(WELLS[i]), GOLDEN_LANE[i],
       `${WELLS[i].name}: every lane-space helper is bit-identical to the P1 build`);
}
H.assert(laneHash(WELLS[7]) !== laneHash(WELLS[8]),
         "the lane sweep hash is not a constant (non-vacuous)");

// ---------------------------------------------------------------------------
// 6. no NaN in any derived position — GDD §17 item 2, at lane centres AND at
//    boundaries, which is where CS005's rider lives.
// ---------------------------------------------------------------------------

let probes = 0;
const _p = { x: 0, y: 0 };
for (const w of WELLS) {
  const lanes = [];
  for (let L = 0; L < w.lanes; L++) lanes.push(L);
  for (let b = X.laneBoundaryLo(w); b <= X.laneBoundaryHi(w) + 1e-9; b += 1) lanes.push(b);
  for (const L of lanes) {
    for (const d of [0, 0.25, 0.5, 0.75, 1]) {
      X.screenPos(w, L, d, _p);
      probes++;
      if (!Number.isFinite(_p.x) || !Number.isFinite(_p.y)) {
        H.assert(false, `${w.name}: NaN at lane ${L} depth ${d}`);
      }
    }
    X.rimPoint(w, L, _p);
    if (!Number.isFinite(_p.x) || !Number.isFinite(_p.y)) H.assert(false, `${w.name}: NaN rim point at lane ${L}`);
    X.throatPoint(w, L, _p);
    if (!Number.isFinite(_p.x) || !Number.isFinite(_p.y)) H.assert(false, `${w.name}: NaN throat point at lane ${L}`);
  }
}
H.assert(probes > 0, "the NaN walk actually ran");
H.eq(probes % 5, 0, "the NaN walk probed five depths per lane (non-vacuous)");

// ---------------------------------------------------------------------------
// 7. ⛔ AND NOTHING IN THE SIMULATION MOVED. Entity position is (lane, depth)
//    and screen position is derived at paint time, so a moved throat cannot
//    move a hash — asserted, not commented. The constant is the 10,000-tick
//    hash at seed 20260830. ⚠ It was taken from the CS006 P1 build and is now
//    taken from the P4 build; the block below says why, and §8 is what carries
//    the pre-offset half of the claim after the move.
// ---------------------------------------------------------------------------

// ⛔ RE-RECORDED ONCE, AT THE CS006 P5 CLOSE, AND THE CAUSE IS NAMED. It was
// 1743051713, taken from 8e0fb7c (the CS006 P1 build); it is 2063617640, taken
// from the P4 build at ed79a32. ⛔ A RE-RECORD IS THE ONE MOMENT A STRAY RNG
// DRAW CAN BE LAUNDERED INTO A NEW BASELINE, so it happened once, deliberately,
// with the cause re-verified rather than re-derived.
//
// ⛔ THE CAUSE IS GDD §5's DIVE (CS006 P3), AND THE OLD NUMBER CANNOT COME
// BACK. Two independent reasons, either alone sufficient: the between-wells
// beat is 2.6 s where CS003 P2's deleted hold was 1.0 s, AND the soak below now
// mixes `dive.timer` / `dive.depth` where it mixed the deleted `clearHold`. The
// hashed FIELD SET changed, so ⛔ no value of C.DIVE_TIME restores it and
// bisecting for one would read as a second unexplained cause.
//
// ⛔ AND THE CAUSE LIST IS COMPLETE, MEASURED TWICE. Driven tick by tick against
// the build at 40044ee over the fields both builds share, the two are
// bit-identical up to the tick wellCleared() first returns true and diverge on
// exactly that tick, in one place — the shots array, emptied by startDive()
// (GDD §5, ⚠ SETTLED). Nothing else moved, on either board:
//   shipped ["vaulter"] list  first clear at tick 1112  (P3's measurement)
//   the six-kind MIXED list   first clear at tick 1287  (the board this hash
//                                                        actually runs on)
// ⚠ P3's ledger entry says 1,112 without saying which board; both numbers are
// the same finding measured on different spawn lists.
//
// ⛔ WHAT THE RE-RECORD RETIRES, AND WHAT REPLACES IT. This constant used to say
// "P2's throatOffset moved no simulation" as a PRE-OFFSET comparison; a number
// taken from a build that also contains the Dive can only say "these two runs
// of THIS build agree". That half of P2's claim is retired here and is carried
// instead by three things the Dive cannot touch: §4 and §5 above, both still on
// their original 8e0fb7c recordings (screenPos moves on exactly the two offset
// wells; every lane-space helper is unmoved on all sixteen), and the source
// assertion below, which needs no baseline at all.
//
// ---------------------------------------------------------------------------
// ⛔ RE-RECORDED A SECOND TIME, AT CS007 P1, AND THE CAUSE IS ONE THING.
// 2063617640 -> 571388570. ⛔ ONE BASELINE, ONE CAUSE: `updateSpawner()`'s
// release budget now counts THREATS (`blocksClear && !dead`) where it counted
// every entity in the array, so a Thorn no longer holds a release slot
// (08-spawner.js; PLANNED-FEATURES-CS007.md §4.1; DECISIONS.md 2026-08-31,
// Paul's call). This is a CROSS-FILE baseline — it runs test-cs005-p5.js
// `--hash-only` in a child process, and that soak drives a six-kind board at
// C.ENEMY_CONCURRENT 3, which is exactly the fixture the split moves.
//
// ⛔ MEASURED, in that soak's own fixture, on the PRE-SPLIT build at 1d64329
// (`git diff 1d64329 HEAD -- src/` is empty, so the measurement is against the
// code this re-record replaces): 1,072 of its 1,417 blocked spawner beats are
// beats where the spawner was blocked and `blocksClear && !dead` was under 3 —
// beats the split releases — and THE FIRST IS AT TICK 3,381. The two runs are
// therefore identical for 3,380 ticks and diverge at the first released beat.
// ⚠ PLANNED-FEATURES-CS007.md predicted 1,082 and tick 3,380 for the same
// quantity; the build is byte-identical to the one it measured, so the small
// difference is in how the two probes counted, not in behaviour. The count
// above is defined as: one per `updateSpawner()` call that reached the
// concurrency guard, took it, and would not have taken the threats form.
//
// ⛔ AND THE RE-RECORD IS GUARDED RATHER THAN TRUSTED. §4, §5 and the §8 source
// assertion below are untouched and still on their original recordings, and
// test-cs004-p1.js's GOLDEN_LANES is green with no edit — MEASURED: every
// entity on its board over its 3,000-tick window is a Vaulter, so
// `blocksClear && !dead` equals `state.enemies.length` on every tick there and
// the split is provably a no-op for it. A re-record that had moved GOLDEN_LANES
// would have been a second cause and not this one.
// ---------------------------------------------------------------------------
const P1_DETERMINISM_HASH = 571388570;

const child = execFileSync(process.execPath,
  [path.join(__dirname, "test-cs005-p5.js"), "--hash-only"],
  { cwd: path.join(__dirname, ".."), encoding: "utf8", stdio: "pipe" }).trim();
H.eq(Number(child), P1_DETERMINISM_HASH,
     "⛔ the 10,000-tick hash at seed 20260830 is the one recorded at the CS006 P5 close");

// ---------------------------------------------------------------------------
// 8. ⛔ THE BASELINE-FREE FORM OF THE SAME CLAIM: NO SIMULATION CODE CAN READ
//    A throatOffset AT ALL. It is DATA, read in exactly one function, and that
//    function is on the paint path.
// ---------------------------------------------------------------------------
//
// ⛔ This is what a re-record costs and this is what pays for it. A hash says
// "nothing moved on one seed for 10,000 ticks"; this says "nothing CAN move",
// and it survives every future retune, every new entity and the Dive itself.
// Read off the built file (the behaviour oracle, GDD §16.2) with wellThroat()'s
// own source removed from it — Function.prototype.toString() returns the exact
// slice, so the subtraction needs no comment stripping (_harness.js's header).
const buildSrc = H.extractScript(
  require("fs").readFileSync(path.join(__dirname, "..", "dist", "vector-vortex.html"), "utf8"));
const throatFn = X.wellThroat.toString();
H.assert(buildSrc.indexOf(throatFn) !== -1,
         "wellThroat()'s source is found verbatim in the built file (the subtraction is real)");
H.assert((throatFn.match(/\.throatOffset/g) || []).length >= 2,
         "⛔ wellThroat() reads throatOffset — the one function that may");
H.eq((buildSrc.split(throatFn).join("").match(/\.throatOffset/g) || []).length, 0,
     "⛔ and NOTHING ELSE IN THE BUILD READS IT — every `.throatOffset` in the shipped " +
     "file is inside wellThroat(), so an offset cannot reach a simulation value by any " +
     "path, on any seed, for any number of ticks");

H.report("test-cs006-p2.js");
