// test-cs002-p2.js — CS002 P2: the Skimmer (GDD 3.5, 4.1, 10.2).
//
// Asserts what P2 owns: the continuous lane float, wrap on closed wells, the
// clamp and the visual squash on open ones, and snap assist including its two
// traps. It re-asserts nothing of CS001's depth model and makes no claim about
// shots, which do not exist yet.
//
// Three things worth knowing before editing this file:
//   - The soak drives the WHOLE stack (Game.update -> the real input module ->
//     the real Skimmer). The focused cases call skimmer.update() directly with
//     a struct, because a rotation of exactly 0.6 lanes cannot be expressed as
//     an integer number of mouse pixels. Both are the real code; neither
//     inlines a copy of it.
//   - skimmerPoints() returns a SHARED preallocated array. Copy out of it
//     before calling it again, or the comparison compares a thing with itself.
//   - Per-tick checks accumulate a flag and assert ONCE. 5,000 assertions per
//     well would bury the one that mattered.
"use strict";

const fs = require("fs");
const path = require("path");

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");
const { COUNTS, hasKnob } = require("./test-registry.js");

const ROOT = path.join(__dirname, "..");
const SEED = 20260830;

installSeed(SEED);
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const DT = C.FIXED_DT;

const wellByName = n => X.WELLS.find(w => w.name === n);
const RING = wellByName("Ring");     // closed, 16 lanes — the seam cases
const FAN  = wellByName("Fan");      // open, 11 lanes — the wall cases

// A rotation-only input struct. The Skimmer reads `rotate` and nothing else
// this phase; fire/purge/jump are P3's and CS010's.
const rot = v => ({ rotate: v, fire: false, purge: false, jump: false });

// ---- the constants this phase adds -----------------------------------------
hasKnob(X, "SKIMMER_WIDTH", { def: 0.9 }, H);
hasKnob(X, "SNAP_EPSILON", { def: 0.01 }, H);
hasKnob(X, "SKIMMER_SQUASH", { def: 0.35 }, H);
H.assert(typeof C.SKIMMER_COLOR === "string", "C.SKIMMER_COLOR exists");
H.assert(typeof X.Skimmer === "function", "the Skimmer class is in the build");

// ---------------------------------------------------------------------------
// wiring — the Skimmer is minted and driven by the real loop
// ---------------------------------------------------------------------------

G.reset();
H.eq(X.state.skimmer, null, "reset() leaves no Skimmer behind");
G.update(DT);
H.assert(X.state.skimmer instanceof X.Skimmer, "the loop mints a Skimmer on its first step");

// Mouse motion through the real input module reaches skimmer.lane, unscaled by
// anything but MOUSE_SENS. This is the one case that proves the whole path.
G.reset();
G.update(DT);
X.state.wellIndex = 0;
X.state.skimmer.lane = 4;
G.input.mouseMove(100);
G.update(DT);
H.close(X.state.skimmer.lane, 4 + 100 * C.MOUSE_SENS, 1e-12,
  "mouse motion moves the Skimmer by Δx * MOUSE_SENS lanes");

// ---------------------------------------------------------------------------
// closed wells wrap — including across the seam (GDD 3.5)
// ---------------------------------------------------------------------------

H.eq(RING.lanes, 16, "the seam cases run on a 16-lane closed well");

const WRAP = [
  { from: 15.7, by:  0.6, to:  0.3 },   // the acceptance criterion, forwards
  { from:  0.3, by: -0.6, to: 15.7 },   // ...and backwards over the same seam
  { from: 15.9, by:  0.1, to:  0.0 },   // landing exactly on the seam
  { from:  0.0, by: -0.5, to: 15.5 },
  { from:  4.0, by: 16.0, to:  4.0 },   // a whole lap is the identity
  { from:  0.0, by: 33.5, to:  1.5 },   // two laps and a half, in one step
  { from:  2.0, by: -50.0, to: 0.0 },   // ...and the same magnitude backwards
];
for (const c of WRAP) {
  const sk = new X.Skimmer(RING, c.from);
  sk.update(DT, RING, rot(c.by));
  H.close(sk.lane, c.to, 1e-12, `closed well: ${c.from} + ${c.by} wraps to ${c.to}`);
  H.assert(sk.lane >= 0 && sk.lane < RING.lanes, `closed well: ${c.from} + ${c.by} stays in [0, lanes)`);
}

// A closed well has a seam, not a wall: no amount of rotation squashes.
{
  const sk = new X.Skimmer(RING, 0);
  let sawSquash = false;
  for (let i = 0; i < 400; i++) {
    sk.update(DT, RING, rot(i % 2 ? -7.3 : 9.1));
    if (sk.squashAmount() > 0) sawSquash = true;
  }
  H.assert(!sawSquash, "a closed well never squashes — the seam is not a wall (GDD 3.5)");
}

// ---------------------------------------------------------------------------
// ⛔ open wells clamp — 5,000-tick soak of adversarial input, every open well
// ---------------------------------------------------------------------------
//
// Driven through the real input module: huge mouse deltas (±4000 px is ±88
// lanes at MOUSE_SENS, far more than any well has), key holds, and quiet ticks
// so snap assist gets to run at the wall too. `snapping` is checked on every
// tick of the same soak, so the ⛔ "never during rotation input" rule is
// exercised against real input rather than a hand-built struct.

const SOAK_TICKS = 5000;
const openWells = X.WELLS.filter(w => !w.closed);
H.eq(openWells.length, COUNTS.openWells, "the soak covers every open well");

function adversarial(input, r) {
  if (r < 0.35)      input.mouseMove((Math.random() * 2 - 1) * 4000);
  else if (r < 0.45) input.keyDown("ArrowRight");
  else if (r < 0.55) input.keyUp("ArrowRight");
  else if (r < 0.65) input.keyDown("ArrowLeft");
  else if (r < 0.75) input.keyUp("ArrowLeft");
  // above 0.75: a quiet tick, so the idle clock can reach SNAP_IDLE_MS
}

let snapDuringRotation = false, sawSnapped = false;
for (const well of openWells) {
  const idx = X.WELLS.indexOf(well);
  G.reset();
  X.state.wellIndex = idx;

  const hi = well.lanes - 1;
  const idleAt = C.SNAP_IDLE_MS / 1000;
  let outOfRange = false, notFinite = false, sawSquash = false, sawIdle = false;

  for (let i = 0; i < SOAK_TICKS; i++) {
    adversarial(G.input, Math.random());
    G.update(DT);
    const sk = X.state.skimmer;
    if (!isFinite(sk.lane)) notFinite = true;
    if (sk.lane < 0 || sk.lane > hi) outOfRange = true;
    if (sk.squashAmount() > 0) sawSquash = true;
    if (X.state.input.rotate === 0 && sk.idleTime >= idleAt) sawIdle = true;
    if (sk.snapping) sawSnapped = true;
    if (X.state.input.rotate !== 0 && sk.snapping) snapDuringRotation = true;
  }

  H.assert(!outOfRange, `${well.name}: lane never leaves [0, ${hi}] over ${SOAK_TICKS} adversarial ticks`);
  H.assert(!notFinite, `${well.name}: lane is finite on every tick`);
  H.assert(sawSquash, `${well.name}: the soak actually reached a wall — the clamp was exercised`);
  // The snap BRANCH being reached is what this proves. Whether it then had
  // anywhere to pull is not a per-well property: a craft pinned against a wall
  // is already sitting exactly on the end lane centre, so snap correctly does
  // nothing, and Stair and Trough spend most of the soak there.
  H.assert(sawIdle, `${well.name}: the soak idled past SNAP_IDLE_MS — the snap branch ran`);
}
H.assert(!snapDuringRotation,
  "⛔ snap assist is inactive on every tick where input.rotate !== 0 (GDD 4.1)");
H.assert(sawSnapped, "and snap assist did actually pull the craft during the soaks");

// ---------------------------------------------------------------------------
// ⛔ snap is never active during rotation input — the focused case
// ---------------------------------------------------------------------------
//
// Caught mid-pull: the craft is left off-centre with snap engaged, then
// rotation resumes. If any snap leaked in, the lane would drift toward 3 and
// the exact arithmetic below would fail.
{
  const sk = new X.Skimmer(RING, 3.4);
  for (let i = 0; i < 7; i++) sk.update(DT, RING, rot(0));   // 5 idle + 2 snap steps
  H.assert(sk.snapping, "snap is engaged before rotation resumes");
  H.assert(Math.abs(sk.lane - 3) > C.SNAP_EPSILON, "and it is caught mid-pull, not settled");

  const base = sk.lane;
  let leaked = false, snapped = false;
  for (let i = 1; i <= 20; i++) {
    sk.update(DT, RING, rot(0.05));
    if (sk.snapping) snapped = true;
    if (Math.abs(sk.lane - (base + 0.05 * i)) > 1e-12) leaked = true;
  }
  H.assert(!snapped, "snapping is false on every step with rotation input");
  H.assert(!leaked, "rotation moves the craft by exactly input.rotate — no snap contribution");
}

// Snap does not engage before SNAP_IDLE_MS of quiet.
{
  const quietTicks = Math.floor((C.SNAP_IDLE_MS / 1000) / DT);   // 5 at the shipped values
  const sk = new X.Skimmer(RING, 3.4);
  // ⚠ laneWrap's double-mod moves an already-legal float by up to an ulp on
  // first contact (3.4 -> 3.3999999999999986) and is a fixed point thereafter.
  // The reference is therefore the craft's OWN lane, never the constructor's
  // argument — comparing against 3.4 tests the wrap helper, not snap assist.
  const start = sk.lane;
  let moved = false;
  for (let i = 0; i < quietTicks; i++) {
    sk.update(DT, RING, rot(0));
    if (!Object.is(sk.lane, start) || sk.snapping) moved = true;
  }
  H.assert(!moved, `snap waits out SNAP_IDLE_MS (${quietTicks} quiet steps) before it pulls`);
  sk.update(DT, RING, rot(0));
  H.assert(sk.snapping, "snap engages on the step that crosses SNAP_IDLE_MS");
}

// ---------------------------------------------------------------------------
// snap settles inside SNAP_EPSILON of a lane centre, and then stops
// ---------------------------------------------------------------------------
{
  const sk = new X.Skimmer(RING, 3.4);
  for (let i = 0; i < 200; i++) sk.update(DT, RING, rot(0));
  const off = Math.abs(X.laneDelta(RING, sk.lane, Math.round(sk.lane)));
  H.assert(off <= C.SNAP_EPSILON, `snap settles within SNAP_EPSILON of a lane centre (off by ${off})`);

  const settled = sk.lane;
  let drifted = false;
  for (let i = 0; i < 200; i++) {
    sk.update(DT, RING, rot(0));
    if (!Object.is(sk.lane, settled)) drifted = true;
  }
  H.assert(!drifted, "a settled Skimmer stops moving — snap does not jitter around the centre");
  H.assert(!sk.snapping, "and reports itself as not snapping once settled");

  // ⛔ Settling is not quantization: the simulation never rounds `lane`, it is
  // snap arriving. A craft left just inside SNAP_EPSILON is left alone, off
  // the integer, which is the difference.
  const near = new X.Skimmer(RING, 5 + C.SNAP_EPSILON / 2);
  const parkedAt = near.lane;
  for (let i = 0; i < 60; i++) near.update(DT, RING, rot(0));
  H.eq(near.lane, parkedAt,
    "a craft already inside SNAP_EPSILON is left where it is, not rounded onto the centre");
  H.assert(near.lane !== 5, "...and it is genuinely off the lane centre while being left alone");
}

// ---------------------------------------------------------------------------
// ⛔ TRAP 1 — snap across the seam takes the SHORT way
// ---------------------------------------------------------------------------
//
// From 15.7 on a 16-lane well the nearest centre is lane 0, +0.3 away. The
// naive (target - lane) is -15.7 and would drag the craft backwards through
// the entire well; the path check below is what catches that.
{
  const sk = new X.Skimmer(RING, 15.7);
  let wrongSide = false, wentBackwards = false;
  let prev = sk.lane;
  for (let i = 0; i < 60; i++) {
    sk.update(DT, RING, rot(0));
    if (sk.lane > 0.5 && sk.lane < 15.5) wrongSide = true;
    if (X.laneDelta(RING, prev, sk.lane) < -1e-12) wentBackwards = true;
    prev = sk.lane;
  }
  H.assert(!wrongSide, "⛔ snap across the seam never enters the far side of the well");
  H.assert(!wentBackwards, "⛔ every snap step across the seam moves the short way (forwards)");
  const off = Math.abs(X.laneDelta(RING, sk.lane, 0));
  H.assert(off <= C.SNAP_EPSILON, `snap across the seam arrives at lane 0 (off by ${off})`);
}

// ---------------------------------------------------------------------------
// ⛔ TRAP 2 — on an open well, snap never pulls past the clamp
// ---------------------------------------------------------------------------
{
  const hi = FAN.lanes - 1;
  H.assert(!FAN.closed && FAN.lanes === 11, "the wall cases run on an 11-lane open well");

  for (const [start, target] of [[hi - 0.4, hi], [0.4, 0]]) {
    const sk = new X.Skimmer(FAN, start);
    let past = false;
    for (let i = 0; i < 120; i++) {
      sk.update(DT, FAN, rot(0));
      if (sk.lane < 0 || sk.lane > hi) past = true;
    }
    H.assert(!past, `⛔ snap from ${start} never pulls the craft outside [0, ${hi}]`);
    H.close(sk.lane, target, C.SNAP_EPSILON, `snap from ${start} settles on the end lane ${target}`);
  }

  // Parked exactly on the end lane, snap has nowhere to pull and does nothing.
  const parked = new X.Skimmer(FAN, hi);
  for (let i = 0; i < 60; i++) parked.update(DT, FAN, rot(0));
  H.eq(parked.lane, hi, "a craft parked on the end lane is not pushed off it by snap");
}

// ---------------------------------------------------------------------------
// ⛔ the wall squash is VISUAL ONLY — it never writes lane
// ---------------------------------------------------------------------------
{
  const hi = FAN.lanes - 1;
  const sk = new X.Skimmer(FAN, hi);
  H.eq(sk.squashAmount(), 0, "a fresh Skimmer is not squashing");

  sk.update(DT, FAN, rot(5));               // shove hard into the far wall
  H.eq(sk.lane, hi, "⛔ the clamp holds the craft on the end lane");
  H.eq(sk.squashAmount(), 1, "the impact step renders at full squash");

  // The squash decays over WALL_SQUASH_MS while `lane` does not move at all.
  let laneMoved = false, outOfUnit = false;
  const decayTicks = Math.ceil((C.WALL_SQUASH_MS / 1000) / DT) + 1;
  for (let i = 0; i < decayTicks; i++) {
    sk.update(DT, FAN, rot(0));
    const a = sk.squashAmount();
    if (a < 0 || a > 1) outOfUnit = true;
    if (!Object.is(sk.lane, hi)) laneMoved = true;
  }
  H.assert(!laneMoved, "⛔ the squash leaves lane unchanged for its whole decay");
  H.assert(!outOfUnit, "the squash amount stays inside [0, 1]");
  H.eq(sk.squashAmount(), 0, `the squash is over ${decayTicks} steps after impact`);

  // Held against the wall, the squash refreshes rather than expiring — and
  // lane still never moves.
  let heldMoved = false;
  for (let i = 0; i < 120; i++) {
    sk.update(DT, FAN, rot(3));
    if (!Object.is(sk.lane, hi)) heldMoved = true;
  }
  H.eq(sk.squashAmount(), 1, "holding into the wall keeps the squash at full");
  H.assert(!heldMoved, "⛔ and grinding the wall for two seconds still never writes lane");

  // The squash IS visible: same lane, different geometry. skimmerPoints returns
  // a shared scratch array, so the first result is copied out before the second
  // call overwrites it.
  const flat = X.skimmerPoints(FAN, hi, 0).map(p => ({ x: p.x, y: p.y }));
  const bent = X.skimmerPoints(FAN, hi, 1);
  let differs = false;
  for (let i = 0; i < flat.length; i++) {
    if (Math.abs(flat[i].x - bent[i].x) > 1e-9 || Math.abs(flat[i].y - bent[i].y) > 1e-9) differs = true;
  }
  H.assert(differs, "the squash changes the drawn silhouette — it is visual, and it is visible");
}

// ---------------------------------------------------------------------------
// a well change never leaves the craft on a lane the new well does not have
// ---------------------------------------------------------------------------
{
  const sk = new X.Skimmer(RING, 15.5);
  sk.update(DT, FAN, rot(0));               // the debug cycler, or CS004's Dive
  H.assert(sk.lane >= 0 && sk.lane <= FAN.lanes - 1,
    `cycling from a 16-lane closed well to an 11-lane open one lands legally (got ${sk.lane})`);
}

// ---------------------------------------------------------------------------
// rendering — ⛔ drawPoly + glowStroke, a local-space point array (GDD 10.2)
// ---------------------------------------------------------------------------

H.assert(Array.isArray(X.SKIMMER_POLY) && X.SKIMMER_POLY.length >= 3,
  "the Skimmer is a local-space point array");
{
  let outward = false, lo = 0, hiL = 0;
  for (const p of X.SKIMMER_POLY) {
    if (p.d > 0) outward = true;
    if (p.l < lo) lo = p.l;
    if (p.l > hiL) hiL = p.l;
  }
  H.assert(!outward, "no silhouette vertex sits outside the rim, where perspective() would flatten it");
  H.eq(lo, -1, "the silhouette reaches exactly one half-width to port");
  H.eq(hiL, 1, "...and exactly one half-width to starboard, so it spans SKIMMER_WIDTH lanes");
}

// No NaN in any derived position, on all sixteen wells, at every lane centre
// and either side of it (GDD 17 item 2's class of bug).
{
  let bad = 0;
  for (const well of X.WELLS) {
    for (let l = 0; l < well.lanes; l += 0.5) {
      for (const s of [0, 0.5, 1]) {
        const pts = X.skimmerPoints(well, X.laneNormalize(well, l), s);
        for (const p of pts) if (!isFinite(p.x) || !isFinite(p.y)) bad++;
      }
    }
  }
  H.eq(bad, 0, "no NaN in the Skimmer's projected points, on any well, at any lane or squash");
}

// The real draw path, against the harness's stubbed context.
{
  G.reset();
  let threw = null;
  try {
    for (let i = 0; i < X.WELLS.length; i++) {
      X.state.wellIndex = i;
      G.update(DT);
      X.state.skimmer.lane = X.laneNormalize(X.WELLS[i], i * 1.37);
      G.draw();
    }
  } catch (e) { threw = e; }
  H.eq(threw, null, "drawing the Skimmer on all sixteen wells throws nothing");
}

// The shipped file, sliced on build.js's banners: the Skimmer draws through the
// two primitives and nothing else.
{
  const script = H.extractScript(fs.readFileSync(path.join(ROOT, "dist", "vector-vortex.html"), "utf8"));
  const re = /\/\/ ={74}\n\/\/ ([^\n]+)\n\/\/ ={74}\n/g;
  const marks = [];
  let m;
  while ((m = re.exec(script)) !== null) marks.push({ name: m[1].trim(), head: m.index, body: m.index + m[0].length });
  const i = marks.findIndex(k => k.name === "05-skimmer.js");
  H.assert(i >= 0, "the banner scan finds 05-skimmer.js in the built file");
  const slice = script.slice(marks[i].body, marks[i + 1].head);

  H.assert(slice.includes("drawPoly(") && slice.includes("glowStroke("),
    "05-skimmer.js draws through drawPoly and glowStroke");
  for (const token of ["ctx.fill", "fillRect", "strokeRect", "drawImage", "createPattern", "shadowBlur", ".arc("]) {
    H.assert(!slice.includes(token),
      `05-skimmer.js must not contain "${token}" — no per-entity pipeline (GDD 10.2)`);
  }
}

H.report("test-cs002-p2.js");
