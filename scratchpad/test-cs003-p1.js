// test-cs003-p1.js — CS003 P1: the seeded RNG, the entity contract, the Vaulter
// (GDD 3.2, 3.5, 6.1, 6.3, 6.5, 10.2, 16.1, 17 items 2 and 3).
//
// Asserts what P1 owns: the stream, the contract's fields and defaults, the
// climb, the L2 vault gate, ungated rim hunting, the wall behaviour GDD 3.5
// names, and the perspective-scaled silhouette. Makes no claim about spawning,
// collision, the Purge, death or scoring — none of them exist yet, so the
// Vaulters here are constructed directly and stepped by hand.
//
// ⛔ TWO TRAPS IN THE FIXTURES.
//  1. `state` must be the REAL state object: Vaulter.update reads state.level
//     and state.skimmer, and the Skimmer is minted lazily inside Game.update.
//  2. The open-well soak HOLDS depth mid-well. A free-climbing Vaulter reaches
//     the rim in 333 ticks and spends the other 4,667 rim-hunting, which is a
//     different code path; the soak is about the vaulting one.
"use strict";

const fs = require("fs");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");
const { COUNTS, hasKnob } = require("./test-registry.js");

const SEED = 20260830;

installSeed(SEED);
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const DT = C.FIXED_DT;

const wellByName = n => X.WELLS.find(w => w.name === n);
const RING = wellByName("Ring");            // closed, 16 lanes
const OPEN = X.WELLS.filter(w => !w.closed);

// The real state, with the Skimmer minted through the real path. Every Vaulter
// case below drives update(dt, well, state) directly against this object.
function driveState(level, wellIndex, skimmerLane) {
  G.reset();
  X.state.wellIndex = wellIndex;
  G.update(DT);                       // mints the Skimmer
  X.state.level = level;
  if (X.state.skimmer && skimmerLane !== undefined) X.state.skimmer.lane = skimmerLane;
  return X.state;
}

// ---- the constants this phase adds -----------------------------------------
hasKnob(X, "RNG_DEFAULT_SEED", { def: 1 }, H);
hasKnob(X, "ENEMY_DEPTH_SCALE", { def: 0.10 }, H);
hasKnob(X, "VAULTER_SIZE", { def: 0.70 }, H);
hasKnob(X, "VAULTER_COLOR", { def: "#FF4A4A" }, H);
hasKnob(X, "VAULT_CLIMB", { def: 0.18 }, H);
hasKnob(X, "VAULT_INTERVAL", { def: 2.20 }, H);
hasKnob(X, "VAULT_HOP_TIME", { def: 0.28 }, H);
hasKnob(X, "VAULT_RIM_INTERVAL", { def: 0.55 }, H);
hasKnob(X, "VAULT_FIRST_LEVEL", { def: 2 }, H);
hasKnob(X, "RIM_CONTACT_DEPTH", { def: 0.05 }, H);

H.assert(typeof X.mulberry32 === "function", "mulberry32 is in the build");
H.assert(typeof X.rngInt === "function", "rngInt is in the build");
H.assert(typeof X.rngPick === "function", "rngPick is in the build");
H.assert(typeof X.invPerspective === "function", "invPerspective is in the build");
H.assert(typeof X.Enemy === "function", "the Enemy base class is in the build");
H.assert(typeof X.Vaulter === "function", "the Vaulter class is in the build");
H.assert(typeof X.entityPoints === "function", "entityPoints is in the build");
H.assert(typeof X.drawVaulter === "function", "drawVaulter is in the build");

// ---------------------------------------------------------------------------
// ⛔ THE SEEDED STREAM. Same seed, same sequence; nothing in the build reaches
// for the platform generator (GDD 16.1, 17.1).
// ---------------------------------------------------------------------------
{
  const a = X.mulberry32(12345), b = X.mulberry32(12345), c = X.mulberry32(12346);
  let same = true, differs = false, inRange = true;
  for (let i = 0; i < 1000; i++) {
    const va = a(), vb = b(), vc = c();
    if (va !== vb) same = false;
    if (va !== vc) differs = true;
    if (!(va >= 0 && va < 1)) inRange = false;
  }
  H.assert(same, "the same seed produces the same 1,000 draws");
  H.assert(differs, "a different seed produces a different stream");
  H.assert(inRange, "every draw is in [0, 1)");

  const r = X.mulberry32(7);
  let intsOk = true;
  for (let i = 0; i < 1000; i++) {
    const n = 1 + (i % 17);
    const v = X.rngInt(r, n);
    if (!(Number.isInteger(v) && v >= 0 && v < n)) intsOk = false;
  }
  H.assert(intsOk, "rngInt(rng, n) is always an integer in [0, n)");
  H.eq(X.rngInt(r, 0), 0, "rngInt of an empty range is 0, not NaN");

  const arr = ["a", "b", "c"];
  let picksOk = true;
  for (let i = 0; i < 200; i++) if (arr.indexOf(X.rngPick(r, arr)) < 0) picksOk = false;
  H.assert(picksOk, "rngPick always returns a member of the array");
  H.eq(X.rngPick(r, []), undefined, "rngPick of an empty array is undefined");

  // state carries the run's seed and its stream, and a reset restores both.
  H.eq(X.state.seed, C.RNG_DEFAULT_SEED, "state.seed defaults to C.RNG_DEFAULT_SEED");
  H.assert(typeof X.state.rng === "function", "state.rng is a live stream");
  G.reset();
  const first = X.state.rng();
  H.eq(first, X.mulberry32(C.RNG_DEFAULT_SEED)(), "reset() restores the default stream from tick zero");

  // ⛔ The build never calls the platform's generator. The identifier is
  // deliberately absent from src/ comments too — see 01-rng.js's header.
  const dist = path.join(__dirname, "..", "dist", "vector-vortex.html");
  const script = H.extractScript(fs.readFileSync(dist, "utf8"));
  H.assert(!/Math\s*\.\s*random/.test(script),
    "⛔ the built file contains no call to the platform random generator");
}

// ---------------------------------------------------------------------------
// The contract: fields, defaults, and a base class that carries no behaviour.
// ---------------------------------------------------------------------------
{
  const e = new X.Enemy(3, 0.4);
  H.eq(e.lane, 3, "Enemy carries lane");
  H.eq(e.depth, 0.4, "Enemy carries depth");
  H.eq(e.dead, false, "Enemy starts alive");
  H.eq(e.purgeable, true, "purgeable defaults to true (GDD 4.3)");
  H.eq(e.blocksClear, true, "blocksClear defaults to true");
  H.eq(e.killDepth, null, "killDepth defaults to null — contact never kills");
  H.assert(typeof e.update === "function", "update(dt, well, state) is on the contract");
  H.assert(typeof e.draw === "function", "draw(ctx, well) is on the contract");
  H.assert(typeof e.onShot === "function", "onShot(shot) is on the contract");
  H.eq(e.onShot({}), false, "the base onShot does not consume the shot");

  // ⛔ No movement, no AI in the base — a base that moves is a base five
  // enemies that do not climb would inherit a climb rate from.
  e.update(DT, RING, X.state);
  H.eq(e.lane, 3, "the base update moves nothing (lane)");
  H.eq(e.depth, 0.4, "the base update moves nothing (depth)");

  const v = new X.Vaulter(2, 0);
  H.assert(v instanceof X.Enemy, "the Vaulter extends Enemy");
  H.eq(v.purgeable, true, "the Purge destroys a Vaulter");
  H.eq(v.blocksClear, true, "a Vaulter blocks the well clearing");
  H.eq(v.killDepth, 1 - C.RIM_CONTACT_DEPTH, "killDepth is the rim contact band (GDD 4.5)");
  H.eq(v.dir, 1, "an unspecified heading is +1");
  H.eq(new X.Vaulter(2, 0, -1).dir, -1, "a negative heading is kept");
  H.eq(v.onShot({}), true, "a shot on a Vaulter is consumed");
  H.eq(v.dead, true, "and kills it (GDD 6.1 — any shot)");
}

// ---------------------------------------------------------------------------
// The climb: monotonic, at VAULT_CLIMB, and it STOPS at the rim.
// ---------------------------------------------------------------------------
{
  const st = driveState(1, X.WELLS.indexOf(RING), 8);
  const v = new X.Vaulter(4, 0);
  let monotonic = true, overRim = false, reachedAt = -1;
  let prev = v.depth;
  for (let i = 0; i < 600; i++) {
    v.update(DT, RING, st);
    if (v.depth < prev) monotonic = false;
    if (v.depth > 1) overRim = true;
    if (reachedAt < 0 && v.depth >= 1) reachedAt = i + 1;
    prev = v.depth;
  }
  H.assert(monotonic, "the climb is monotonic — depth never decreases");
  H.assert(!overRim, "⛔ depth never passes the rim");
  H.eq(v.depth, 1, "and it settles exactly at 1");
  const expected = Math.ceil((1 / C.VAULT_CLIMB) / DT);
  H.assert(Math.abs(reachedAt - expected) <= 2,
    `the rim is reached at VAULT_CLIMB (tick ${reachedAt}, expected ~${expected})`);
}

// ---------------------------------------------------------------------------
// ⛔ THE LEVEL GATE IS ON VAULTING ONLY (GDD 6.3). 300 ticks is 5 s: two
// VAULT_INTERVALs, and still below the rim (depth 0.9), so what is being
// measured is the gate and not the rim.
// ---------------------------------------------------------------------------
{
  const runClimb = (level) => {
    const st = driveState(level, X.WELLS.indexOf(RING), 8);
    const v = new X.Vaulter(4, 0);
    for (let i = 0; i < 300; i++) v.update(DT, RING, st);
    return v;
  };

  const below = runClimb(C.VAULT_FIRST_LEVEL - 1);
  H.eq(below.lane, 4, `⛔ no mid-climb vaulting below level ${C.VAULT_FIRST_LEVEL} (GDD 6.3)`);
  H.assert(below.depth < 1, "and the level-1 Vaulter is still climbing, not parked at the rim");

  const at = runClimb(C.VAULT_FIRST_LEVEL);
  H.close(at.lane, 6, 1e-9, `two hops of exactly one lane at level ${C.VAULT_FIRST_LEVEL}`);
  H.assert(at.depth < 1, "and it vaulted while climbing, not at the rim");

  const above = runClimb(C.VAULT_FIRST_LEVEL + 3);
  H.close(above.lane, 6, 1e-9, "and above the gate, at the same VAULT_INTERVAL cadence");
}

// ---------------------------------------------------------------------------
// Rim hunting: toward the Skimmer, the SHORT way across a closed well's seam,
// and ⛔ NOT level-gated (GDD 6.1 attaches the L2 gate to vaulting; GDD 12
// promises a passive player dies on level 1).
// ---------------------------------------------------------------------------
{
  // The signed distance actually travelled. laneDelta per tick, so a hop the
  // long way round the Ring registers as -15 and this one as +1.
  const hunt = (fromLane, skimmerLane, ticks) => {
    const st = driveState(1, X.WELLS.indexOf(RING), skimmerLane);
    const v = new X.Vaulter(fromLane, 1);
    let signed = 0, prev = v.lane, jumped = false;
    for (let i = 0; i < ticks; i++) {
      v.update(DT, RING, st);
      const d = X.laneDelta(RING, prev, v.lane);
      if (Math.abs(d) > 0.5) jumped = true;   // a teleport, not a crossing
      signed += d;
      prev = v.lane;
    }
    return { v, signed, jumped };
  };

  const up = hunt(15, 0, 200);
  H.close(up.signed, 1, 1e-9, "⛔ lane 15 hunts a Skimmer at lane 0 the SHORT way (+1, not -15)");
  H.close(up.v.lane, 0, 1e-9, "and lands in the player's lane");
  H.assert(!up.jumped, "the crossing is continuous — hittable in both lanes it is near");

  const down = hunt(0, 15, 200);
  H.close(down.signed, -1, 1e-9, "and the mirror case across the seam is -1, not +15");
  H.close(down.v.lane, 15, 1e-9, "landing in the player's lane again");

  // A rim Vaulter already in the player's lane holds — nothing to hunt.
  const held = hunt(6, 6, 300);
  H.close(held.v.lane, 6, 1e-9, "a rim Vaulter in the player's lane does not hop");

  // Level 1: the hunt still happens. This is the assertion GDD 12 rests on.
  const st = driveState(1, X.WELLS.indexOf(RING), 10);
  const v = new X.Vaulter(6, 1);
  for (let i = 0; i < 200; i++) v.update(DT, RING, st);
  H.assert(v.lane > 6, "⛔ rim hunting is NOT level-gated — a level-1 Vaulter still comes for you");
}

// ---------------------------------------------------------------------------
// ⛔ GDD 17 ITEM 3 — THE WALL. 5,000 ticks of a vaulting Vaulter on each of the
// six open wells: the lane never leaves [0, lanes-1], it REVERSES at a wall
// rather than parking on it or wrapping across the well, and two bounces
// restore the heading it started with. This is GDD 3.5's named bug, and the
// reason laneHop() returns a dir the caller must write back.
// ---------------------------------------------------------------------------
{
  H.eq(OPEN.length, COUNTS.openWells, "every open well is under soak");

  for (const well of OPEN) {
    const hi = well.lanes - 1;
    const st = driveState(C.VAULT_FIRST_LEVEL, X.WELLS.indexOf(well), 0);
    const v = new X.Vaulter(0, 0, 1);

    let outOfRange = false, teleported = false, nan = false;
    let minLane = Infinity, maxLane = -Infinity;
    const flips = [];
    let prevLane = v.lane, prevDir = v.dir;

    for (let i = 0; i < 5000; i++) {
      // ⛔ Held mid-well: the soak is about lane space, and a free climb spends
      // 4,667 of these ticks at the rim on a different code path.
      v.depth = 0.5;
      v.update(DT, well, st);

      if (!(v.lane >= 0 && v.lane <= hi)) outOfRange = true;
      if (!Number.isFinite(v.lane)) nan = true;
      if (Math.abs(v.lane - prevLane) > 0.5) teleported = true;
      if (v.lane < minLane) minLane = v.lane;
      if (v.lane > maxLane) maxLane = v.lane;
      if (v.dir !== prevDir) flips.push(v.dir);
      prevLane = v.lane;
      prevDir = v.dir;
    }

    H.assert(!outOfRange, `⛔ ${well.name}: lane never leaves [0, ${hi}] over 5,000 ticks`);
    H.assert(!nan, `${well.name}: lane is finite for every one of 5,000 ticks`);
    H.assert(!teleported, `⛔ ${well.name}: no hop wraps across the well — an open rim has walls, not a seam`);
    H.close(minLane, 0, 1e-9, `${well.name}: it reaches lane 0`);
    H.close(maxLane, hi, 1e-9, `${well.name}: it reaches lane ${hi}`);
    H.assert(flips.length >= 2, `${well.name}: it bounced at least twice (${flips.length})`);
    H.eq(flips[0], -1, `⛔ ${well.name}: the first wall REVERSES the heading — it does not park`);
    H.eq(flips[1], 1, `⛔ ${well.name}: and two bounces restore the original heading`);
  }
}

// ---------------------------------------------------------------------------
// ⛔ THE PERSPECTIVE TRAP. A silhouette with a constant depth extent GROWS as
// it recedes, because perspective() is depth^0.55 and screenPos lerps linearly
// in perspective space. The drawn shape must shrink with distance.
// ---------------------------------------------------------------------------
{
  // invPerspective is the exact inverse on [0, 1] — that is what the sizing
  // rests on.
  let roundTrips = true;
  for (let i = 0; i <= 20; i++) {
    const d = i / 20;
    if (Math.abs(X.perspective(X.invPerspective(X.perspective(d))) - X.perspective(d)) > 1e-12) {
      roundTrips = false;
    }
  }
  H.assert(roundTrips, "perspective(invPerspective(p)) === p across [0, 1]");
  H.eq(X.invPerspective(1.5), 1, "invPerspective clamps past the rim");
  H.eq(X.invPerspective(-1), 0, "invPerspective clamps past the throat");

  // Lane 0 of the Ring runs from the centre to the top of the screen, so the
  // silhouette's depth extent IS its screen height there.
  const box = (depth) => {
    const pts = X.entityPoints(RING, 0, depth, X.VAULTER_POLY, C.VAULTER_SIZE);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of pts) {
      if (p.x < x0) x0 = p.x;
      if (p.x > x1) x1 = p.x;
      if (p.y < y0) y0 = p.y;
      if (p.y > y1) y1 = p.y;
    }
    return { w: x1 - x0, h: y1 - y0 };
  };

  H.assert(box(0.1).h < box(0.9).h,
    "⛔ the drawn silhouette is SMALLER at depth 0.1 than at depth 0.9");

  let growing = true;
  let last = 0;
  for (const d of [0.1, 0.3, 0.5, 0.7, 0.9]) {
    const b = box(d);
    const extent = Math.max(b.w, b.h);
    if (!(extent > last)) growing = false;
    last = extent;
  }
  H.assert(growing, "and it grows monotonically all the way in from the throat");

  H.eq(X.VAULTER_POLY.length, 8, "the flattened X is an eight-point outline, not a bowtie (GDD 18)");

  // ⛔ No per-frame allocation: the scratch is memoized per poly.
  const a = X.entityPoints(RING, 0, 0.5, X.VAULTER_POLY, C.VAULTER_SIZE);
  const b = X.entityPoints(RING, 3, 0.7, X.VAULTER_POLY, C.VAULTER_SIZE);
  H.assert(a === b, "⛔ entityPoints reuses one preallocated scratch array per poly");
}

// ---------------------------------------------------------------------------
// GDD 17 item 2 — no NaN in any projected point, on any of the sixteen wells,
// across the full depth range. Aggregated into one assertion per well: a
// per-point assert would put 10,000 lines in the counter and say no more.
// ---------------------------------------------------------------------------
{
  for (const well of X.WELLS) {
    const hi = well.lanes - 1;
    const lanes = [0, 0.37, well.lanes / 2, hi - 0.5, hi];
    let bad = null;
    for (const lane of lanes) {
      for (let i = 0; i <= 20; i++) {
        const depth = i / 20;
        const pts = X.entityPoints(well, lane, depth, X.VAULTER_POLY, C.VAULTER_SIZE);
        for (const p of pts) {
          if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) bad = `lane ${lane}, depth ${depth}`;
        }
      }
    }
    H.assert(bad === null, `${well.name}: every projected silhouette point is finite (${bad})`);
  }
}

// The draw path itself runs headless against the stubbed 2D context — a
// per-entity pipeline that reached for something the stub does not have would
// throw here rather than in a browser.
{
  const ctx = X._env.doc.getElementById("c").getContext("2d");
  let threw = null;
  try {
    const v = new X.Vaulter(3, 0.5);
    v.draw(ctx, RING);
    new X.Vaulter(0, 1).draw(ctx, OPEN[0]);
    new X.Vaulter(0, 0).draw(ctx, RING);
  } catch (err) { threw = err.message; }
  H.assert(threw === null, `the Vaulter draws through drawPoly + glowStroke (${threw})`);
}

H.report("test-cs003-p1.js");
