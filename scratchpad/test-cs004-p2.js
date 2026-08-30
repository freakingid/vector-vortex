// test-cs004-p2.js — CS004 P2: the Carrier, splitLanes() and the CARGO table
// (GDD 6.1, 6.2, 6.3, 6.5, 3.5, 4.3, 10.2).
//
// Asserts what P2 owns. It makes no claim about the Weaver, the Thorn, the
// Drifter, the Surger or scoring — none of those exist.
//
// ⛔ FIVE TRAPS IN THE FIXTURES.
//  1. Boot calls startGame(), so the live state at load is a run in progress.
//     Every case starts from useWell(), which is G.reset() + startGame() +
//     enterWell() and then silences the spawner.
//  2. The cap and the mutation cases stage BARE `Enemy` stubs. A base Enemy's
//     update() is a no-op and its onShot() returns false — both are load
//     bearing below, and neither is true of any real enemy.
//  3. The carrier KIND string is looked up through ENEMY_KINDS rather than
//     spelled, so CS005's two rows do not turn this file red.
//  4. Draw counting wraps state.rng. spawnEnemy() spends exactly one draw per
//     ACCEPTED call and none on a refusal, which is what makes "did the split
//     go through the one entry point" measurable rather than inferred.
//  5. entityPoints() returns a scratch array that is SHARED per poly, so every
//     silhouette case copies out of it before asking a second question.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260830;

installSeed(SEED);
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const state = X.state;
const DT = C.FIXED_DT;

// A quiet, known board on a chosen well: quota spent, nothing alive, a craft
// on the rim. ⛔ G.reset() first — it is the only thing that clears a hit-stop
// a previous case left behind.
function useWell(index) {
  G.reset();
  X.startGame(SEED);
  state.wellIndex = index === undefined ? 0 : index;
  X.enterWell();
  state.spawn.remaining = 0;
  state.shots = [];
  state.purgeUses = 0;
  state.purgeLatched = true;
  state.input.purge = false;
  G.input.reset();
  return X.WELLS[state.wellIndex];
}

// A stub that never moves and never consumes a shot.
function stub(lane, depth) {
  const e = new X.Enemy(lane, depth);
  state.enemies.push(e);
  return e;
}

// How many draws the run's ONE stream spent inside fn (01-rng.js, GDD 17.1).
function countDraws(fn) {
  const real = state.rng;
  let n = 0;
  state.rng = () => { n++; return real(); };
  try { fn(); } finally { state.rng = real; }
  return n;
}

// The ENEMY_KINDS key that builds a Carrier of this cargo. Looked up, never
// spelled: the mapping from a cargo name to a kind string is 08-spawner.js's
// to own, and CS005 adds two more of them.
function carrierKindFor(cargo) {
  for (const k of Object.keys(X.ENEMY_KINDS)) {
    const e = X.ENEMY_KINDS[k](0, 0, 1);
    if (e instanceof X.Carrier && e.cargo === cargo) return k;
  }
  return null;
}

// ---------------------------------------------------------------------------
// the constants, the kind row and the cargo table
// ---------------------------------------------------------------------------

H.eq(C.CARRIER_SIZE, 0.80, "C.CARRIER_SIZE");
H.eq(C.CARRIER_GLYPH_SIZE, 0.34, "C.CARRIER_GLYPH_SIZE");
H.eq(C.CARRIER_CLIMB, 0.11, "C.CARRIER_CLIMB");
H.assert(C.CARRIER_GLYPH_SIZE < C.CARRIER_SIZE,
         "⛔ the glyph is narrower than the hull it sits inside");

H.assert(X.CARGO !== null && typeof X.CARGO === "object", "the CARGO table is in the build");
H.assert("vaulter" in X.CARGO, "⛔ GDD 6.2's buildable row: vaulter cargo");

// ⛔ THE BOUNDARY, WRITTEN SO CS005 GROWS IT RATHER THAN EDITING IT. Every
// cargo row must name a kind the spawner can actually build, have a glyph to
// draw, and have a Carrier variant to be carried by. A row added ahead of its
// enemy turns this red on the row, not on a Carrier that silently splits into
// nothing.
for (const cargo of Object.keys(X.CARGO)) {
  const row = X.CARGO[cargo];
  H.assert(row && typeof row.kind === "string", `CARGO.${cargo} names a kind`);
  H.assert(row && row.kind in X.ENEMY_KINDS,
           `⛔ CARGO.${cargo}.kind is a live ENEMY_KINDS row — the split can build it`);
  H.assert(cargo in X.CARGO_GLYPHS,
           `⛔ CARGO.${cargo} has a glyph — GDD 6.2's read is the skill`);
  H.assert(carrierKindFor(cargo) !== null,
           `⛔ CARGO.${cargo} has a Carrier variant in ENEMY_KINDS`);
}
for (const cargo of Object.keys(X.CARGO_GLYPHS)) {
  H.assert(cargo in X.CARGO, `⛔ every glyph belongs to a cargo row (${cargo})`);
}

const CARRIER_VAULTER = carrierKindFor("vaulter");
H.eq(CARRIER_VAULTER, "carrierVaulter", "the Vaulter-cargo Carrier's kind string");

// ---------------------------------------------------------------------------
// the contract fields (GDD 6.5)
// ---------------------------------------------------------------------------

let well = useWell(0);
const probe = X.spawnEnemy(CARRIER_VAULTER, 3, 0);
H.assert(probe !== null && probe instanceof X.Carrier, "a Carrier spawns through spawnEnemy()");
H.eq(probe.cargo, "vaulter", "and carries the cargo its kind names");
H.eq(probe.killDepth, 1 - C.RIM_CONTACT_DEPTH,
     "⛔ killDepth is 1 - C.RIM_CONTACT_DEPTH — retuning the rim band moves the Carrier too");
H.eq(probe.purgeable, true, "the Purge destroys it (GDD 4.3)");
H.eq(probe.blocksClear, true, "and a well cannot clear with one alive");
H.eq(probe.anchored, false, "⛔ not anchored — its depth is a POSITION, not a length");

// ---------------------------------------------------------------------------
// the climb (GDD 6.1) — monotonic, one rate, stops at the rim
// ---------------------------------------------------------------------------

well = useWell(0);
const climber = new X.Carrier(4, 0, "vaulter");
let overshoot = false, wentBackwards = false, last = climber.depth;
for (let i = 1; i <= 100; i++) {
  climber.update(DT, well, state);
  if (climber.depth > 1) overshoot = true;
  if (climber.depth < last) wentBackwards = true;
  last = climber.depth;
}
H.close(climber.depth, 100 * DT * C.CARRIER_CLIMB, 1e-9,
        "⛔ 100 ticks of climb is exactly 100 * dt * C.CARRIER_CLIMB");

// GDD 6.1's "slow": throat to rim in ~9 s, and it STOPS there.
for (let i = 0; i < 3000; i++) {
  climber.update(DT, well, state);
  if (climber.depth > 1) overshoot = true;
  if (climber.depth < last) wentBackwards = true;
  last = climber.depth;
}
H.eq(climber.depth, 1, "⛔ the climb stops AT the rim — depth 1 exactly, not past it");
H.assert(!overshoot, "⛔ and never exceeds 1 on any tick — depth > 1 is not a legal position");
H.assert(!wentBackwards, "the climb is monotonic");
H.assert(!climber.dead, "reaching the rim does not kill it — contact does (GDD 4.5)");

// ---------------------------------------------------------------------------
// ⛔ ONE LANE, NEVER HOPS — exact equality, on all sixteen wells
// ---------------------------------------------------------------------------
//
// ⛔ A RANGE CHECK WOULD NOT DO. test-cs003-p5.js's finding: a wrapped hop on a
// 13-lane strip lands inside [0, 12] and the range check passes. The Carrier
// touches no lane code at all, so the assertion available here is the strong
// one — the lane it was constructed with, bit for bit, on every tick.
const LANE_TICKS = 3000;
let laneDrift = null;
for (let wi = 0; wi < X.WELLS.length; wi++) {
  const w = X.WELLS[wi];
  const starts = [0, Math.floor((w.lanes - 1) / 2), w.lanes - 1, 0.5];
  for (const start of starts) {
    const c = new X.Carrier(start, 0, "vaulter");
    for (let i = 0; i < LANE_TICKS && laneDrift === null; i++) {
      c.update(DT, w, state);
      if (!Object.is(c.lane, start)) laneDrift = `${w.name} lane ${start} -> ${c.lane} at tick ${i}`;
    }
  }
}
H.assert(laneDrift === null,
         `⛔ a Carrier's lane is EXACTLY the lane it was spawned into, for ${LANE_TICKS} ticks, ` +
         `on every well (${laneDrift})`);

// ---------------------------------------------------------------------------
// ⛔ splitLanes() — two distinct legal lanes, on all sixteen wells
// ---------------------------------------------------------------------------
//
// ⛔ MUTATION CHECK, NOT AN ASSERTION FOR ITS OWN SAKE. A splitLanes() written
// as a bare laneNormalize(lane ± 1) passes every closed well and every interior
// lane, and fails here: on the six open wells laneNormalize CLAMPS, so a lane-0
// parent puts both children in lanes 0 and 1 — two silhouettes in one lane,
// which is GDD 1.1 P2 failing at the moment the player is reading a split.

let splitBad = null;
function checkSplit(w, parent) {
  const pair = X.splitLanes(w, parent);
  const [a, b] = pair;
  const hi = w.lanes - 1;
  const tag = `${w.name}(${w.lanes}${w.closed ? " closed" : " open"}) parent ${parent} -> [${a}, ${b}]`;

  if (!isFinite(a) || !isFinite(b)) return `${tag}: not finite`;
  if (a === b) return `${tag}: the two children share a lane`;
  if (w.closed) {
    if (a < 0 || a >= w.lanes || b < 0 || b >= w.lanes) return `${tag}: outside [0, lanes)`;
    // On a closed well the pair straddles the parent, one lane either side.
    if (Math.abs(X.laneDelta(w, parent, a) + 1) > 1e-12) return `${tag}: first child is not one lane back`;
    if (Math.abs(X.laneDelta(w, parent, b) - 1) > 1e-12) return `${tag}: second child is not one lane on`;
  } else {
    if (a < 0 || a > hi || b < 0 || b > hi) return `${tag}: outside [0, ${hi}]`;
    // ⛔ The pair is SHIFTED inward, never squashed: the gap stays two lanes
    // wide at the wall, so the children still straddle a lane and one of them
    // still occupies the lane the parent died in.
    if (Math.abs((b - a) - 2) > 1e-12) return `${tag}: the pair collapsed instead of shifting`;
  }
  return null;
}

for (let wi = 0; wi < X.WELLS.length && splitBad === null; wi++) {
  const w = X.WELLS[wi];
  for (let l = 0; l <= w.lanes - 1 && splitBad === null; l++) splitBad = checkSplit(w, l);
  // Fractional parents are real: the debug bench spawns in the Skimmer's
  // continuous lane, and a Vaulter is mid-hop for C.VAULT_HOP_TIME at a time.
  for (const f of [0.25, 0.5, (w.lanes - 1) - 0.5]) {
    if (splitBad === null) splitBad = checkSplit(w, f);
  }
}
H.assert(splitBad === null,
         `⛔ splitLanes returns two distinct legal lanes on all sixteen wells (${splitBad})`);

// The named case, spelled out, because it is the one a reader will check by
// hand: the 13-lane Vee, parent at the wall.
const vee = X.WELLS.find(w => w.name === "Vee");
H.eq(vee.lanes, 13, "the Vee is the 13-lane open well GDD 6.2's example names");
H.assert(JSON.stringify(X.splitLanes(vee, 0)) === "[0,2]",
         "⛔ a parent at lane 0 of the Vee yields children at lanes 0 and 2");
H.assert(JSON.stringify(X.splitLanes(vee, 12)) === "[10,12]",
         "⛔ and one at lane 12 yields 10 and 12 — the same shift, the other wall");
H.assert(JSON.stringify(X.splitLanes(vee, 6)) === "[5,7]",
         "while an interior parent is simply one lane either side");

// ⛔ ONE HELPER FOR ALL THREE CARGO ROWS. GDD 6.2's "adjacent" and "flanking"
// describe the correct RESPONSE, not the placement, so the geometry cannot
// depend on the cargo: splitLanes does not take one.
H.eq(X.splitLanes.length, 2, "⛔ splitLanes(well, lane) — the cargo is not an argument");

// The seam is not a wall (GDD 3.5). A lane-0 parent on a Ring wraps.
const ring = X.WELLS[0];
H.assert(ring.closed, "the Ring is closed");
H.assert(JSON.stringify(X.splitLanes(ring, 0)) === `[${ring.lanes - 1},1]`,
         "⛔ a closed well wraps rather than shifting — the seam is not a wall");

// ---------------------------------------------------------------------------
// onShot — kills, consumes, and splits into two of its cargo
// ---------------------------------------------------------------------------
//
// ⛔ A LOOP OVER CARGO, so CS005 adds two rows and no test.

for (const cargo of Object.keys(X.CARGO)) {
  const kind = carrierKindFor(cargo);
  const childKind = X.CARGO[cargo].kind;
  const childClass = X.ENEMY_KINDS[childKind](0, 0, 1).constructor;

  well = useWell(0);
  state.skimmer.lane = 0;                 // out of the way of lanes 3, 4, 5
  const parent = X.spawnEnemy(kind, 4, 0);
  parent.depth = 0.5;
  const before = state.enemies.length;

  const draws = countDraws(() => {
    H.eq(parent.onShot({}), true, `${cargo}: ⛔ onShot CONSUMES the shot — one shot, one Carrier`);
  });
  H.eq(parent.dead, true, `${cargo}: and the Carrier dies`);
  H.eq(draws, 2,
       `${cargo}: ⛔ the split spends exactly TWO draws on the run's one stream — one per ` +
       `spawnEnemy(), deterministic, and not to be "saved" for a kind that ignores dir`);

  const kids = state.enemies.slice(before);
  H.eq(kids.length, 2, `${cargo}: ⛔ exactly two children, never one and never three`);
  H.assert(kids.every(k => k instanceof childClass),
           `${cargo}: both children are the kind the cargo row names`);
  H.assert(kids.every(k => k.depth === parent.depth),
           `${cargo}: both arrive at the depth the parent died at`);
  const want = X.splitLanes(X.WELLS[state.wellIndex], 4);
  H.assert(kids[0].lane === want[0] && kids[1].lane === want[1],
           `${cargo}: ⛔ and in splitLanes' two lanes (got [${kids[0].lane}, ${kids[1].lane}], ` +
           `want [${want[0]}, ${want[1]}])`);
}

// ---------------------------------------------------------------------------
// ⛔ C.ENEMY_CAP — the readability ceiling applies to a split
// ---------------------------------------------------------------------------
//
// ⛔ MUTATION CHECK. A split that pushed straight into state.enemies instead of
// calling spawnEnemy() walks past the cap, and "it is only a split" is exactly
// the bypass the one entry point exists to prevent. Both cases below turn red
// on it — the full board because two children appear, and the near-full board
// because the second one does.

well = useWell(0);
state.skimmer.lane = 0;
let full = X.spawnEnemy(CARRIER_VAULTER, 6, 0);
full.depth = 0.5;
while (state.enemies.length < C.ENEMY_CAP) stub(9, 0.2);
H.eq(state.enemies.length, C.ENEMY_CAP, "the board is staged at the cap");
let capDraws = countDraws(() => full.onShot({}));
H.eq(state.enemies.length, C.ENEMY_CAP,
     "⛔ a split on a full board adds NOTHING — the children are lost, and that is correct");
H.eq(capDraws, 0,
     "and spends no draw either: spawnEnemy() refuses above the cap before it reaches the stream");
H.assert(state.enemies.every(e => !(e instanceof X.Vaulter)),
         "no child reached the board");
H.eq(full.dead, true, "the Carrier still dies — the cap costs it its cargo, not its death");

well = useWell(0);
state.skimmer.lane = 0;
let nearly = X.spawnEnemy(CARRIER_VAULTER, 6, 0);
nearly.depth = 0.5;
while (state.enemies.length < C.ENEMY_CAP - 1) stub(9, 0.2);
capDraws = countDraws(() => nearly.onShot({}));
H.eq(state.enemies.length, C.ENEMY_CAP,
     "⛔ one slot free means exactly ONE child — the cap is a ceiling, not an all-or-nothing gate");
H.eq(capDraws, 1, "and exactly one draw was spent, on the child that got in");
H.eq(state.enemies.filter(e => e instanceof X.Vaulter).length, 1, "one child, on the board");

// ---------------------------------------------------------------------------
// ⛔ GDD 6.3's safe-spawn rule — a child is LOWERED, never relocated
// ---------------------------------------------------------------------------
//
// ⛔ MUTATION CHECK, the other half of the one above: a direct push would put
// the child at 0.99 in the Skimmer's lane, one tick from the rim contact band.

well = useWell(0);                       // the Ring: 16 lanes, closed
state.skimmer.lane = 5;
const atRim = X.spawnEnemy(CARRIER_VAULTER, 4, 0);
atRim.depth = 0.99;
atRim.onShot({});
const pair = state.enemies.filter(e => e instanceof X.Vaulter);
H.eq(pair.length, 2, "the split produced its two children");
const inLane = pair.find(e => e.lane === 5);
const clear = pair.find(e => e.lane === 3);
H.assert(inLane !== undefined && clear !== undefined,
         "⛔ both children are in splitLanes' lanes — 3 and 5, NOT moved sideways off the craft");
H.eq(inLane.depth, C.SAFE_SPAWN_DEPTH,
     "⛔ the child in the Skimmer's lane is LOWERED to C.SAFE_SPAWN_DEPTH (GDD 6.3)");
H.eq(clear.depth, 0.99,
     "and the one that is not stays exactly where the parent died — a lowering, not a rule for both");
H.assert(inLane.depth < inLane.killDepth,
         "so it cannot kill on the step it arrives");

// ---------------------------------------------------------------------------
// ⚠ SETTLED — the Purge kills Carriers WITHOUT splitting them (GDD 4.3)
// ---------------------------------------------------------------------------
//
// updatePurge() sets `dead` directly and never calls onShot(). A panic button
// that doubles the enemy count is not a panic button. This works by OMISSION,
// which is why it is asserted rather than left to be noticed.

well = useWell(0);
state.skimmer.lane = 0;
for (let i = 0; i < 6; i++) {
  const c = X.spawnEnemy(CARRIER_VAULTER, 3 + i, 0);
  c.depth = 0.3 + i * 0.05;
}
H.eq(state.enemies.length, 6, "a board of six Carriers");
state.purgeUses = 0;
state.purgeLatched = false;
state.input.purge = true;
const purgeDraws = countDraws(() => X.updatePurge(state));
state.enemies = state.enemies.filter(e => !e.dead);
H.eq(state.enemies.length, 0,
     "⚠ one Purge leaves the well EMPTY — it does not double it");
H.eq(purgeDraws, 0,
     "⛔ and spends no draw: nothing was spawned, so onShot() was never called");

// ---------------------------------------------------------------------------
// the split through a real update(1/60) step
// ---------------------------------------------------------------------------
//
// ⛔ THE ARRAY IS MUTATED FROM INSIDE collideShots()'s OWN LOOP OVER IT. Safe,
// and safe for three reasons in two files (07-enemies.js, 09-collision.js).
// This is the end-to-end proof: nothing lost, nothing double-visited, the
// children present AFTER the end-of-frame filter.

well = useWell(0);
state.skimmer.lane = 0;
const victim = X.spawnEnemy(CARRIER_VAULTER, 8, 0);
victim.depth = 0.5;
const shot = new X.Shot(well, 8);
shot.t = (1 - 0.5) * C.SHOT_TIME;        // a shot arriving at the Carrier's depth
state.shots.push(shot);
H.eq(state.shots.length, 1, "one shot in flight, in the Carrier's lane");

G.update(DT);

H.eq(state.enemies.length, 2,
     "⛔ after the step and its filter: the parent is gone and BOTH children are on the board");
H.assert(state.enemies.every(e => e instanceof X.Vaulter && !e.dead),
         "⛔ nothing was double-visited — neither child was killed by the shot that made it");
H.eq(state.shots.length, 0, "and the shot was consumed and filtered the same step");
H.assert(state.enemies.indexOf(victim) === -1, "the parent left the array");
const stepLanes = state.enemies.map(e => e.lane).sort((a, b) => a - b);
H.assert(stepLanes[0] === 7 && stepLanes[1] === 9,
         `⛔ in splitLanes' lanes (got [${stepLanes}])`);

// ⛔ MUTATION CHECK — A CONDITIONAL `break` IN collideShots.
//
// The `break` after onShot is UNCONDITIONAL, so one shot resolves against at
// most one enemy per step and cannot walk forward into the children a split
// just appended. A bare Enemy stub is the probe: its onShot() returns false, so
// the shot is NOT consumed, and only an unconditional break stops it there. Move
// the break inside the `if` and the shot walks on to the Carrier behind the
// stub, splits it, and this case goes red on all three counts below.
well = useWell(0);
state.skimmer.lane = 0;
const shield = stub(8, 0.5);
const behind = X.spawnEnemy(CARRIER_VAULTER, 8, 0);
behind.depth = 0.5;
const walker = new X.Shot(well, 8);
walker.t = (1 - 0.5) * C.SHOT_TIME;
state.shots.push(walker);
H.eq(state.enemies.indexOf(shield), 0, "the stub is ahead of the Carrier in the array");

X.collideShots(state, well);

H.eq(behind.dead, false,
     "⛔ the shot stopped at the first enemy it overlapped — the Carrier behind it is untouched");
H.eq(state.enemies.length, 2,
     "⛔ so nothing split: the array still holds the stub and the Carrier, and no children");
H.eq(walker.dead, false,
     "and the shot is still in flight — the stub declined to consume it (GDD 6.5)");
H.eq(shield.dead, false, "a bare Enemy takes no damage either");

// ---------------------------------------------------------------------------
// the silhouettes (GDD 6.1, 6.2, 10.2, 18)
// ---------------------------------------------------------------------------

const ctx = X._env.canvas.getContext("2d");

H.assert(Array.isArray(X.CARRIER_POLY) && X.CARRIER_POLY.length >= 4,
         "the hull is a local-space point array");
H.assert(X.CARRIER_POLY.every(q => isFinite(q.l) && isFinite(q.d)),
         "⛔ in (l, d) — lane offset and depth offset, never a screen coordinate");
H.assert(Array.isArray(X.CARGO_GLYPHS.vaulter) && X.CARGO_GLYPHS.vaulter.length >= 2,
         "and the Vaulter cargo glyph is a second, smaller point array");

// ⛔ entityPoints memoizes ONE scratch array per poly, so every reading is
// copied out before the next call overwrites it.
function spanOf(w, lane, depth, poly, size) {
  const pts = X.entityPoints(w, lane, depth, poly, size).map(p => ({ x: p.x, y: p.y }));
  const c = X.screenPos(w, lane, depth, { x: 0, y: 0 });
  let max = 0, bad = false;
  for (const p of pts) {
    if (!isFinite(p.x) || !isFinite(p.y)) bad = true;
    const r = Math.hypot(p.x - c.x, p.y - c.y);
    if (r > max) max = r;
  }
  return { max, bad };
}

// ⛔ GDD 6.2: the glyph has to be readable at THROAT depth, not only at the
// rim — that is the skill the section says separates competent from good. So
// it is checked at the deep end as well as the near one, and it must be a
// shape down there rather than a point.
for (const d of [0.05, 0.3, 0.6, 1.0]) {
  const hull = spanOf(ring, 4, d, X.CARRIER_POLY, C.CARRIER_SIZE);
  const glyph = spanOf(ring, 4, d, X.CARGO_GLYPHS.vaulter, C.CARRIER_GLYPH_SIZE);
  H.assert(!hull.bad && !glyph.bad, `depth ${d}: every projected point is finite`);
  H.assert(glyph.max > 0, `depth ${d}: ⛔ the glyph has extent — it never collapses to a point`);
  H.assert(glyph.max < hull.max, `depth ${d}: and it stays inside the hull`);
}

// The whole draw path, headless, on a closed and an open well, at both ends of
// the depth range. ⛔ drawPoly + glowStroke only; an unknown cargo draws the
// hull and no glyph rather than throwing.
let drew = true;
try {
  for (const w of [ring, vee]) {
    for (const d of [0, 0.5, 1]) {
      X.drawCarrier(ctx, w, 2, d, "vaulter");
      X.drawCarrier(ctx, w, 2, d, "nosuchcargo");
    }
  }
} catch (e) {
  drew = false;
  H.assert(false, `drawCarrier threw: ${e && e.message}`);
}
H.assert(drew, "drawCarrier runs headless on both topologies, and an unknown cargo is not a throw");

// A Carrier with a cargo nothing carries splits into nothing rather than
// throwing — the same shape as spawnEnemy()'s unknown kind.
well = useWell(0);
state.skimmer.lane = 0;
const empty = new X.Carrier(4, 0.5, "nosuchcargo");
state.enemies.push(empty);
const emptyDraws = countDraws(() => H.eq(empty.onShot({}), true, "an unknown cargo still consumes the shot"));
H.eq(state.enemies.length, 1, "⛔ and adds no children");
H.eq(emptyDraws, 0, "spending no draw");
H.eq(empty.dead, true, "while the Carrier still dies");

// ---------------------------------------------------------------------------
// the debug bench key that P1 left dark (GDD 9.5) — ⚠ TEMPORARY
// ---------------------------------------------------------------------------
//
// P1 wired "2" to spawnCarrier and left it a no-op because no kind answered to
// it. It answers now. ⛔ Through spawnEnemy(), like every other way in.

useWell(0);
H.eq(state.enemies.length, 0, "the bench case starts on an empty board");
G.input.keyDown("2");
H.eq(state.enemies.length, 0,
     "⛔ a keydown spawns nothing at event time — named actions are dispatched inside sample()");
G.update(DT);
G.input.keyUp("2");
H.eq(state.enemies.length, 1, "and exactly one entity after the step that sampled it");
H.assert(state.enemies[0] instanceof X.Carrier, "⚠ pressing 2 puts a Carrier on the board");
H.eq(state.enemies[0].cargo, "vaulter", "carrying the only cargo CS004 builds");

H.report("test-cs004-p2.js");
