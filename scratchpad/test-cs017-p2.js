// test-cs017-p2.js — CS017 P2: the bench behind C.DEBUG_KEYS (plan S7-B), and
// GDD 9's traverse-and-stop, per device (plan S1 (c)). Two claims:
//   1. THE SHIPPED BUILD BINDS NONE OF THE EIGHT (`1`–`6`, `0`, `w`): each
//      pressed in play is unbound, moves nothing (a twin digest, the stream
//      included) and leaves the run eligible; `t`, `e`, `p`, Escape stay bound.
//      A flagged build binds all eight and each moves the digest (non-vacuity).
//   2. TRAVERSE-AND-STOP: through the game's own input (the sink the DOM
//      adapter feeds; the pad through sample()'s own poll of the window), on
//      Ring (closed, leftward across the seam) and Vee (open, rightward off the
//      wall), from lane 0 to the lane T = round(lanes / 3) away, then released
//      until snap is done: at rest within HIT_LANE_TOL of T's centre. Sequences:
//        mouse  — ten equal moves of (T ± 0.3) lanes / 10 at the live mouseSens
//        touch  — one drag in the zone, ten equal moves, (T ± 0.3) lanes, lifted
//        hold   — the arrow held; released on the first step within 0.5 of T
//        taps   — T taps, each 3 steps down (50 ms < KEY_TAP_MS) and 3 up
//        stick  — axes[0] ±0.8; back to 0 on the first step within 0.5 of T
// "Snap done" is asserted as snap's own stop, inside SNAP_EPSILON of the centre.
// ⚠ Mouse and touch aim 0.3 lane off ON PURPOSE (a hand is not exact); snap
// resolves it. A 0.7-lane miss rests on the wrong lane — the check can fail.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 1702;
installSeed(SEED);                                      // ⛔ above the first build

const FLAG_OFF = "  DEBUG_KEYS:           false,";
const FLAG_ON  = "  DEBUG_KEYS:           true,";
const BENCH = ["1", "2", "3", "4", "5", "6", "0", "w"];
const KEPT = ["t", "e", "p", "Escape"];

const build = opts => { installSeed(SEED); return H.buildGame(Object.assign({ spy: ["spawnEnemy"] }, opts)); };
const shipped = build();
const flagged = build({ mutate: [[FLAG_OFF, FLAG_ON]] });

H.eq(shipped.C.DEBUG_KEYS, false, "⛔ C.DEBUG_KEYS ships false");
H.eq(flagged.C.DEBUG_KEYS, true, "fixture: the flagged build's switch is on");

// ===========================================================================
// 1. THE BENCH: UNBOUND IN THE SHIPPED BUILD, ALL EIGHT IN A FLAGGED ONE
// ===========================================================================

// One run from the seed; `key` (or none) pressed in play for 3 steps at step 20.
// The digest ends on one draw from the run's stream, so a spent draw shows.
function play(X, key) {
  const { Game: G, state } = X;
  G.reset();
  X.startGame(SEED, { mode: "classic" });
  const eligibleAtStart = X.Meta.eligible();
  const spawns0 = X.spawnEnemy.calls;
  let pressedSpawns = 0;
  for (let i = 0; i < 140; i++) {
    if (key !== null && i === 20) G.input.keyDown(key);
    if (key !== null && i === 23) G.input.keyUp(key);
    const before = X.spawnEnemy.calls;
    G.update(X.C.FIXED_DT);
    if (i >= 20 && i < 23) pressedSpawns += X.spawnEnemy.calls - before;
  }
  const e = state.enemies.map(n => `${n.constructor.name}:${n.lane.toFixed(6)}:${n.depth.toFixed(6)}`).join("|");
  const digest = [state.screen, state.wellIndex, state.level, state.score, state.skimmer.lane, e,
                  state.shots.length, state.rng()].join(" ");
  return { digest, eligibleAtStart, eligible: X.Meta.eligible(), spawns: X.spawnEnemy.calls - spawns0,
           pressedSpawns, screen: state.screen };
}

{
  const ref = play(shipped, null);
  H.assert(ref.eligibleAtStart && ref.eligible && ref.screen === "play",
    `fixture: an untouched shipped run is in play and eligible (${ref.screen})`);
  for (const k of BENCH) {
    H.eq(shipped.Game.input.isBound(k), false, `⛔ shipped: "${k}" is not bound`);
    const r = play(shipped, k);
    H.eq(r.digest, ref.digest, `⛔ shipped: "${k}" pressed in play moves nothing (digest, stream included)`);
    H.eq(r.eligible, true, `⛔ shipped: "${k}" pressed in play leaves the run eligible`);
  }
  for (const k of KEPT) H.eq(shipped.Game.input.isBound(k), true, `shipped: "${k}" is still bound (not a bench key)`);
}

{
  const ref = play(flagged, null);
  H.assert(ref.eligible, "fixture: an untouched flagged run is eligible");
  H.eq(ref.digest, play(shipped, null).digest, "the flag alone moves nothing: untouched runs digest identically");
  for (const k of BENCH) {
    H.eq(flagged.Game.input.isBound(k), true, `non-vacuous: flagged, "${k}" is bound`);
    const r = play(flagged, k);
    H.assert(r.digest !== ref.digest, `non-vacuous: flagged, "${k}" pressed in play moves the board`);
    H.eq(r.eligible, false, `non-vacuous: flagged, "${k}" pressed in play makes the run ineligible`);
  }
  for (const k of KEPT) H.eq(flagged.Game.input.isBound(k), true, `flagged: "${k}" is bound`);
  const spawn = play(flagged, "1");
  H.eq(spawn.pressedSpawns, 1, "flagged: `1` spawns once, through spawnEnemy()");
}

// ===========================================================================
// 2. TRAVERSE-AND-STOP, PER DEVICE, ON A CLOSED AND AN OPEN WELL (GDD 9)
// ===========================================================================
const X = shipped;
const { C, Game: G, state } = X;
const nav = X._env.win.navigator;
const pad = { axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
nav.getGamepads = () => [pad];
const touchY = C.WORLD_H * (1 - C.TOUCH_ZONE_FRAC / 2);
const WELLS = [
  { index: X.WELLS.findIndex(w => w.name === "Ring"), dir: -1 },   // closed: left, across the seam
  { index: X.WELLS.findIndex(w => w.name === "Vee"), dir: +1 },    // open: right, off the wall at 0
];

// A fresh run on the well, the craft on lane 0; returns the case's context.
function stage(wellIndex) {
  G.reset();
  X.startGame(SEED, { mode: "classic" });
  state.wellIndex = wellIndex;
  X.enterWell();
  return state.skimmer;
}

const DEVICES = {
  // Displacement devices: aim (T + miss) lanes in ten equal moves, then nothing.
  mouse(t, dir, miss) {
    const px = dir * (t + miss) / G.input.setting("mouseSens") / 10;
    for (let i = 0; i < 10; i++) { G.input.mouseMove(px); G.update(C.FIXED_DT); }
  },
  touch(t, dir, miss) {
    const px = dir * (t + miss) / G.input.setting("touchSens") / 10;
    let x = C.WORLD_W / 2;
    G.input.touchStart(4, x, touchY);
    for (let i = 0; i < 10; i++) { x += px; G.input.touchMove(4, x, touchY); G.update(C.FIXED_DT); }
    G.input.touchEnd(4);
  },
  // Rate devices: held until the craft is within half a lane of T, then let go.
  hold(t, dir, miss, near) {
    const key = dir < 0 ? "ArrowLeft" : "ArrowRight";
    G.input.keyDown(key);
    for (let i = 0; i < 600 && !near(); i++) G.update(C.FIXED_DT);
    G.input.keyUp(key);
  },
  taps(t, dir) {
    const key = dir < 0 ? "ArrowLeft" : "ArrowRight";
    for (let n = 0; n < t; n++) {
      G.input.keyDown(key);
      for (let i = 0; i < 3; i++) G.update(C.FIXED_DT);
      G.input.keyUp(key);
      for (let i = 0; i < 3; i++) G.update(C.FIXED_DT);
    }
  },
  stick(t, dir, miss, near) {
    pad.axes[0] = 0.8 * dir;
    for (let i = 0; i < 600 && !near(); i++) G.update(C.FIXED_DT);
    pad.axes[0] = 0;
  },
};

// One traverse; then released steps until snap has been idle for 10 in a row.
function traverse(device, w, miss) {
  const well = X.WELLS[w.index];
  const sk = stage(w.index);
  const t = Math.round(well.lanes / 3);
  const target = X.laneNormalize(well, w.dir * t);
  const start = sk.lane, lives = state.lives;
  const near = () => Math.abs(X.laneDelta(well, sk.lane, target)) <= 0.5;
  DEVICES[device](t, w.dir, miss, near);
  let quiet = 0, steps = 0;
  for (; steps < 240 && quiet < 10; steps++) {
    G.update(C.FIXED_DT);
    // Idle past SNAP_IDLE_MS too, so a snap that has not started cannot pass as done.
    quiet = (!sk.snapping && state.input.rotate === 0 && sk.idleTime >= C.SNAP_IDLE_MS / 1000) ? quiet + 1 : 0;
  }
  return { well, t, target, start, lane: sk.lane, rest: quiet >= 10, steps,
           same: state.skimmer === sk && !sk.dead && state.lives === lives && state.wellIndex === w.index,
           off: Math.abs(X.laneDelta(well, sk.lane, target)) };
}

for (const w of WELLS) {
  H.assert(w.index >= 0, "fixture: the well exists");
  const shape = X.WELLS[w.index].closed ? "closed" : "open";
  H.eq(X.WELLS[w.index].closed, w.dir < 0, `fixture: ${X.WELLS[w.index].name} is ${shape}`);
  const cases = [["mouse", 0.3], ["mouse", -0.3], ["touch", 0.3], ["touch", -0.3],
                 ["hold", 0], ["taps", 0], ["stick", 0]];
  for (const [device, miss] of cases) {
    const r = traverse(device, w, miss);
    const label = `${r.well.name} (${shape}), ${device}${miss ? ` aimed ${miss > 0 ? "+" : ""}${miss}` : ""}`;
    H.assert(r.start === 0 && r.same, `fixture: ${label}: from lane 0, the same craft alive on the same well`);
    H.assert(r.rest, `${label}: comes to rest, input released and snap done (${r.steps} steps)`);
    H.assert(r.off <= C.HIT_LANE_TOL,
      `⛔ ${label}: stops on lane ${r.target}, ${r.t} lanes away, within HIT_LANE_TOL of its centre (off ${r.off.toExponential(2)})`);
    H.assert(r.off <= C.SNAP_EPSILON, `${label}: and snap is what settled it, inside SNAP_EPSILON`);
  }
  // Non-vacuity: a hand 0.7 lane short rests on the neighbouring lane.
  const miss = traverse("mouse", w, -0.7);
  H.assert(miss.rest && miss.off > C.HIT_LANE_TOL,
    `non-vacuous: ${X.WELLS[w.index].name}, a 0.7-lane miss rests off the target (off ${miss.off.toFixed(3)})`);
}

// The pad path is the real one: with no pad, the stick moves nothing.
{
  const sk = stage(WELLS[0].index);
  nav.getGamepads = () => [null];
  pad.axes[0] = 0.8;
  for (let i = 0; i < 30; i++) G.update(C.FIXED_DT);
  H.eq(sk.lane, 0, "non-vacuous: the stick reaches the craft only through sample()'s poll");
  pad.axes[0] = 0;
}

H.report();
