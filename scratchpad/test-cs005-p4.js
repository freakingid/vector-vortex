// test-cs005-p4.js — CS005 P4: the two remaining cargo rows (GDD 6.2, 6.5,
// 10.2). Three table rows and two glyphs, and no new code path anywhere.
//
// ⛔ SHORT ON PURPOSE. CS004 wrote test-cs004-p2.js and test-cs004-p5.js as
// LOOPS OVER `CARGO`, so the split, the two draws, the child kind, the child
// depth and splitLanes' two lanes are already asserted three times over the
// moment the rows land. This file confirms that coverage arrived and then adds
// only what is genuinely this phase's.
//
// ⛔ FOUR TRAPS IN THE FIXTURES.
//  1. Boot calls startGame(), so the live state at load is a run in progress.
//     Every case starts from useWell().
//  2. The Skimmer is parked far from the split lanes: GDD 6.3's safe-spawn rule
//     LOWERS a child born in the player's lane, and a rim split is exactly the
//     case where that would silently move the depth this file is asserting.
//  3. A cargo's carrier KIND is discovered from ENEMY_KINDS, never spelled, so
//     a fourth cargo costs this file nothing either.
//  4. Draw counting hooks closePath on the harness's Proxy context and restores
//     it — drawPoly(..., true) is the only thing that calls it, which is how
//     "every glyph is an open path" is read off the real draw rather than
//     inferred from the table.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260830;

installSeed(SEED);                          // ⛔ above the first buildGame()
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const state = X.state;
const DT = C.FIXED_DT;

const WELLS = X.WELLS;
const RIM_BAND = 1 - C.RIM_CONTACT_DEPTH;

const SCRIPT = H.extractScript(require("fs").readFileSync(
  require("path").join(__dirname, "..", "dist", "vector-vortex.html"), "utf8"));

// A quiet, known board on a chosen well: quota spent, nothing alive, a craft on
// the rim. ⛔ G.reset() first — it is the only thing that clears a hit-stop a
// previous case left behind.
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
  return WELLS[state.wellIndex];
}

// The ENEMY_KINDS key that builds a Carrier of this cargo (trap 3) — the same
// lookup test-cs004-p2.js uses, and for the same reason: the mapping from a
// cargo name to a kind string is 08-spawner.js's, not a spelling this file
// gets to repeat.
function carrierKindFor(cargo) {
  for (const k of Object.keys(X.ENEMY_KINDS)) {
    const e = X.ENEMY_KINDS[k](0, 0, 1);
    if (e instanceof X.Carrier && e.cargo === cargo) return k;
  }
  return null;
}

// ---------------------------------------------------------------------------
// ⛔ GDD 6.2's TABLE IS COMPLETE — and CS004's loops now run over three rows
// ---------------------------------------------------------------------------
//
// The point of this block is not the two rows on their own; it is that the
// closed files' loops DISCOVER them. If either loop's key set stopped matching
// the other's, those files would go quietly narrower rather than red.

for (const cargo of ["drifter", "surger"]) {
  H.assert(cargo in X.CARGO, `⛔ GDD 6.2's ${cargo} row is buildable at last`);
  H.eq(X.CARGO[cargo].kind, cargo,
       `CARGO.${cargo}.kind — ⚠ two namespaces that coincide, not an identity map`);
  H.assert(cargo in X.CARGO_GLYPHS, `⛔ and it has a glyph — GDD 6.2's read is the skill`);
  H.assert(X.CARGO[cargo].kind in X.ENEMY_KINDS,
           `⛔ what ${cargo} cargo splits into is itself a live ENEMY_KINDS row`);
}

const CARGOES = Object.keys(X.CARGO);
H.assert(CARGOES.length === Object.keys(X.CARGO_GLYPHS).length &&
         CARGOES.every(c => c in X.CARGO_GLYPHS),
         "⛔ the CARGO and CARGO_GLYPHS key sets are the SAME set — that is what makes " +
         "CS004's two loops cover every row instead of whichever subset they started with");

const VARIANTS = {};
for (const cargo of CARGOES) {
  const kind = carrierKindFor(cargo);
  H.assert(kind !== null, `⛔ CARGO.${cargo} has a Carrier variant in ENEMY_KINDS`);
  VARIANTS[cargo] = kind;
}
H.eq(VARIANTS.drifter, "carrierDrifter", "the Drifter-cargo Carrier's kind string");
H.eq(VARIANTS.surger, "carrierSurger", "the Surger-cargo Carrier's kind string");

// ---------------------------------------------------------------------------
// ⛔ A CARRIER IS A CARRIER — one class, one killDepth, NO BRANCH ON CARGO
// ---------------------------------------------------------------------------
//
// ⛔ MUTATION CHECK. The whole phase is three table rows; the failure mode it
// invites is a later session "handling" a cargo somewhere. The cargo only
// matters after the Carrier dies, so nothing before that may read it.

for (const cargo of CARGOES) {
  const c = X.ENEMY_KINDS[VARIANTS[cargo]](5, 0.4, -1);
  H.assert(c instanceof X.Carrier, `${cargo}: the row builds a Carrier and not a subclass`);
  H.eq(c.cargo, cargo, `${cargo}: carrying the cargo its kind names`);
  H.eq(c.lane, 5, `${cargo}: lane is exactly the argument`);
  H.eq(c.depth, 0.4, `${cargo}: and so is depth`);
  H.eq(c.killDepth, RIM_BAND,
       `${cargo}: ⛔ killDepth is the RIM BAND like every other variant — a Carrier is a ` +
       `Carrier regardless of what is inside it, and the cargo only matters after it dies`);
  H.eq(c.purgeable, true, `${cargo}: purgeable, as carrierVaulter is`);
  H.eq(c.blocksClear, true, `${cargo}: blocksClear, as carrierVaulter is`);
  H.eq(c.anchored, false, `${cargo}: anchored is false — its depth is a POSITION`);
  H.eq(X.ENEMY_KINDS[VARIANTS[cargo]].length, 2,
       `${cargo}: the factory is (lane, depth) — ⛔ \`dir\` is ignored on all three ` +
       `variants, and spawnEnemy() still spends the draw`);
}

H.eq(X.Carrier.prototype.onShot.length, 1,
     "⛔ onShot(shot) takes no cargo — the split is table-driven (07-enemies.js)");
H.eq(X.splitLanes.length, 2,
     "⛔ splitLanes(well, lane) takes no cargo either — GDD 6.2's 'adjacent' and " +
     "'flanking' are THE SAME GEOMETRY, and the distinction is between the correct " +
     "RESPONSES rather than the placement");
H.eq(X.drawCarrier.length, 5,
     "and drawCarrier(ctx, well, lane, depth, cargo) reads the cargo for ONE thing: " +
     "which glyph to look up");

for (const pattern of ["cargo ===", "cargo ==", "cargo !==", "switch (this.cargo"]) {
  H.eq(SCRIPT.split(pattern).length - 1, 0,
       `⛔ no branch on cargo anywhere in the build ("${pattern}") — not in onShot, ` +
       `not in splitLanes, not in the draw path`);
}

// ---------------------------------------------------------------------------
// ⛔ THE GLYPH SHAPE CONSTRAINTS — asserted HERE so a reshape fails here
// ---------------------------------------------------------------------------
//
// test-cs004-p2.js line ~440 asserts the vaulter row is a plain array of at
// least two points. It says so about ONE row and it says it in a file about the
// Carrier, so a future {poly, closed} reshape would turn that file red with a
// message about CS004's silhouettes. These are the same two rules stated for
// every row, in the phase that owns the table's shape.

for (const cargo of CARGOES) {
  const g = X.CARGO_GLYPHS[cargo];
  H.assert(Array.isArray(g),
           `⛔ CARGO_GLYPHS.${cargo} is a PLAIN ARRAY of points — no {poly, closed} reshape`);
  H.assert(g.length >= 2, `${cargo}: and it has at least two points`);
  H.assert(g.every(q => isFinite(q.l) && isFinite(q.d)),
           `${cargo}: in (l, d) — lane offset and depth offset, never a screen coordinate`);
  H.assert(g.every(q => Object.keys(q).length === 2),
           `${cargo}: ⛔ and a point is (l, d) and nothing else — a per-point flag is the ` +
           `same reshape by another route`);
  H.eq(g.closed, undefined,
       `${cargo}: ⛔ the row carries no \`closed\` of its own — drawCarrier draws every ` +
       `glyph open, with no per-cargo branch`);
}

// The real draw path, recorded off the canvas context (trap 4). drawPoly's
// `closed` argument is the ONLY caller of closePath, so one close per Carrier
// is exactly "the hull is closed and the glyph is not".
function closesIn(fn) {
  const ctx = X._env.canvas.getContext("2d");
  const prev = ctx.closePath;
  let n = 0;
  ctx.closePath = () => { n++; };
  try { fn(ctx); } finally { ctx.closePath = prev; }
  return n;
}

const ring = WELLS[0];
const vee = WELLS.find(w => !w.closed) || WELLS[0];

for (const cargo of CARGOES) {
  for (const w of [ring, vee]) {
    for (const d of [0.05, 0.5, 1]) {
      H.eq(closesIn(ctx => X.drawCarrier(ctx, w, 2, d, cargo)), 1,
           `${cargo} at depth ${d} on ${w.name}: ⛔ ONE closePath — the hull. The glyph is an ` +
           `OPEN path, so it never reads as a second closed outline nested inside it`);
    }
  }
}

// ---------------------------------------------------------------------------
// ⛔ THE DESIGN RULE: A GLYPH IS A MINIATURE OF ITS CARGO'S OWN GESTURE
// ---------------------------------------------------------------------------
//
// GDD 6.2's correct responses are OPPOSITE — Drifter cargo: shoot, move away;
// Surger cargo: shoot, hold still — so a player who reads the glyph wrong does
// the exact opposite of the right thing. The channel that carries that half of
// the read is compact-versus-wide, and the drifter row is the compact one.
// ⛔ MUTATION CHECK on the rule rather than on the coordinates: a redrawn
// drifter glyph that spans the full width, or that stops doubling back, turns
// this red.

const span = g => Math.max(...g.map(q => q.l)) - Math.min(...g.map(q => q.l));
const monotonic = g => g.every((q, i) => i === 0 || q.l >= g[i - 1].l) ||
                       g.every((q, i) => i === 0 || q.l <= g[i - 1].l);

H.assert(span(X.CARGO_GLYPHS.drifter) < span(X.CARGO_GLYPHS.vaulter) &&
         span(X.CARGO_GLYPHS.drifter) < span(X.CARGO_GLYPHS.surger),
         "⛔ the drifter glyph is the COMPACT one — a cluster, visibly narrower than the " +
         "two full-width rows at the depth where all three are smallest");
H.assert(!monotonic(X.CARGO_GLYPHS.drifter),
         "⛔ and it DOUBLES BACK across the lanes — a scatter with no dominant axis, which " +
         "is what stops it reading as the surger's zigzag");
H.assert(monotonic(X.CARGO_GLYPHS.surger) && monotonic(X.CARGO_GLYPHS.vaulter),
         "while the other two run one way across the lanes: a bar with a step in it, and " +
         "an arm — each the miniature of the silhouette its cargo already has");

// ---------------------------------------------------------------------------
// ⛔ WHAT IS GENUINELY THIS PHASE'S: the children are ENTITIES, not a pair of
// positions — they begin their own cycles, independently
// ---------------------------------------------------------------------------
//
// CS004's loops assert the two children exist, are the right class, arrive at
// the parent's depth and land in splitLanes' two lanes. What no closed file can
// assert is what a Drifter or a Surger child DOES on the step after, because
// neither entity existed. A rim split is the interesting case: the parent dies
// where it is most lethal, and both children inherit that depth.

function splitAt(cargo, lane, depth) {
  const well = useWell(0);
  state.skimmer.lane = lane + 6;              // trap 2 — clear of both children
  const parent = X.spawnEnemy(VARIANTS[cargo], lane, 0);
  parent.depth = depth;
  const before = state.enemies.length;
  parent.onShot({});
  return { well, parent, kids: state.enemies.slice(before) };
}

// --- the Drifter cargo (GDD 6.2: shoot, MOVE AWAY) -------------------------

let s = splitAt("drifter", 4, 1);
H.eq(s.kids.length, 2, "⛔ a carrierDrifter killed at the RIM yields exactly two children");
H.assert(s.kids.every(k => k instanceof X.Drifter), "and both are Drifters");
H.assert(s.kids.every(k => Object.is(k.depth, s.parent.depth)),
         "⛔ both at the parent's depth EXACTLY — the rim, where it died (Object.is, no epsilon)");
H.assert(s.kids.every(k => k.killDepth === RIM_BAND),
         "each already lethal on contact, as a Drifter born anywhere else is");
H.assert(s.kids.every(k => k.phase === "birth" && k.rideTimer === 0 && k.crossTime === 0),
         "⛔ and each starts in `birth` — the constructor does not snap to a boundary and " +
         "does not need a well, which is what lets splitLanes hand it an INTEGER lane");
H.assert(s.kids[0] !== s.kids[1] && s.kids[0].lane !== s.kids[1].lane,
         "two entities in two lanes, not one shared object");

// ⛔ INDEPENDENTLY. Stepping one child must not advance the other: the birth
// cross is per-entity state, and a Drifter that inherited a sibling's timer
// would arm early — armoured, unshootable, and unexplainable.
const [d0, d1] = s.kids;
const d0Lane = d0.lane, d1Lane = d1.lane;
d0.update(DT, s.well, state);
H.eq(d0.phase, "cross", "⛔ the first child begins its birth cross on its very first update");
H.close(Math.abs(d0.crossDelta), 0.5, 1e-12,
        "half a lane onto the boundary lattice — boundaryFrom()'s birth half-step (CS005 P1)");
H.eq(d0.crossFrom, d0Lane,
     "⛔ from its OWN lane — splitLanes handed it an integer lane centre and the cross " +
     "starts there, not at the parent's");
H.eq(d1.phase, "birth", "⛔ while the second is untouched — no shared timer, no shared cross");
H.eq(d1.lane, d1Lane, "and has not moved a lane unit");

d1.update(DT, s.well, state);
H.eq(d1.phase, "cross", "the second begins its own birth cross when it is stepped");
H.close(Math.abs(d1.crossDelta), 0.5, 1e-12, "its own half-step, from its own lane");

// --- the Surger cargo (GDD 6.2: shoot, HOLD STILL) -------------------------

s = splitAt("surger", 4, 1);
H.eq(s.kids.length, 2, "⛔ a carrierSurger killed at the RIM yields exactly two children");
H.assert(s.kids.every(k => k instanceof X.Surger), "and both are Surgers");
H.assert(s.kids.every(k => Object.is(k.depth, s.parent.depth)),
         "⛔ both at the parent's depth EXACTLY — the rim, where it died");
H.assert(s.kids[0] !== s.kids[1] && s.kids[0].lane !== s.kids[1].lane,
         "two entities in two lanes");
H.assert(s.kids.every(k => k.phase === "climb" && k.surgeTimer === 0),
         "⛔ each born UNARMED, at the head of its own cycle — a split that handed the " +
         "player two lanes already discharging is GDD 6.3's visible fuse skipped");
H.assert(s.kids.every(k => k.killDepth === RIM_BAND),
         "⛔ and each with the rim band, not the discharge's 0 — setPhase() is the one writer");

// ⛔ INDEPENDENTLY, and here the stakes are higher than on the Drifter: the two
// lanes arm on two clocks, so stepping one may not arm the other.
const [g0, g1] = s.kids;
for (let i = 0; i < 2000 && g0.phase !== "discharge"; i++) g0.update(DT, s.well, state);
H.eq(g0.phase, "discharge", "the first child reaches its own discharge");
H.eq(g0.killDepth, 0, "with its lane live end to end (GDD 4.5 item 3)");
H.eq(g1.phase, "climb", "⛔ while the second is still climbing — one timer per entity");
H.eq(g1.surgeTimer, 0, "its clock never started");
H.eq(g1.killDepth, RIM_BAND, "and its lane was never lethal");

// ---------------------------------------------------------------------------
// scope — what P4 deliberately did NOT do
// ---------------------------------------------------------------------------
//
// ⛔ NO NEW DEBUG KEYS. The bench is one key per GDD 6.1 roster row, and a
// Carrier variant is a KIND rather than a roster row: pressing `2` shows a hull
// and a glyph, which is what it is for. A key for each variant is how six
// digits becomes eight.
H.eq(SCRIPT.split("spawnCarrierDrifter").length - 1, 0,
     "⛔ no bench key for carrierDrifter — a Carrier variant is a kind, not a roster row");
H.eq(SCRIPT.split("spawnCarrierSurger").length - 1, 0,
     "⛔ nor for carrierSurger");

H.report("test-cs005-p4.js");
