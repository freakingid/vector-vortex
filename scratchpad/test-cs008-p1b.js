// test-cs008-p1b.js — CS008 P1b: the crossing fix, the rim sweep (GDD 4.5,
// 6.5; plan §1.16, §2b). Asserts what P1b owns: with fire held, a rim enemy the
// Skimmer touches dies if a shot could kill it — on every cooldown phase, on
// keys and mouse, split, stacked or mid-hop — and armour, a discharge below
// the rim and a player not holding fire still die (K3).
//
// ⛔ TRAPS IN THE FIXTURES.
//  1. 40 + p ticks of pre-fire, and the rack is asserted FULL at placement. A
//     short pre-fire hides C.SHOT_MAX: that is how the re-arm's 17/24 read as
//     progress when a full rack measures 6/24 (plan §1.16).
//  2. The spawner is HELD, as in test-cs008-p1.js. A quota of 0 dives.
//  3. A run that ends in NEITHER outcome is a failure, never a skip.
//  4. The mutation record (sweep removed, fire gate removed, depth gate
//     removed, `e.dead = true` for onShot — each turns this file red) is in
//     log/CS008.md, not here.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260913;
const PRE_FIRE = 40;   // ⛔ trap 1: a shot retires on its 32nd step at a cadence of 4
const SETTLE = 20;     // ticks waited at four lanes away

installSeed(SEED);                          // ⛔ above the first buildGame()
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const state = X.state;
const DT = C.FIXED_DT;
const PARK = 1 - C.RIM_CONTACT_DEPTH;

const RING = 0, VEE = 7;
H.assert(X.WELLS[RING].name === "Ring" && X.WELLS[RING].closed, "fixture: WELLS[0] is the closed Ring");
H.assert(X.WELLS[VEE].name === "Vee" && !X.WELLS[VEE].closed, "fixture: WELLS[7] is the open Vee");

// A live board, spawner held (trap 2), the Skimmer on lane centre `lane`.
function setup(wellIndex, level, lane, fire) {
  G.reset();
  X.startGame(SEED);
  state.level = level;
  state.wellIndex = wellIndex;
  X.enterWell();
  state.spawn.remaining = 5;
  state.spawn.timer = -1e9;
  state.skimmer.lane = lane;
  G.input.reset();
  if (fire) G.input.keyDown(" ");
}

// One row, 24 pre-fire phases. The enemy goes two lanes out from `base`; the
// Skimmer crosses it to four lanes out on keys (no `rate`) or on the mouse at
// `rate` lanes per step, then waits SETTLE ticks.
function cross(o) {
  const fire = o.fire !== false;
  const key = o.dir > 0 ? "ArrowRight" : "ArrowLeft";
  const stop = o.base + 4 * o.dir;
  const r = { killed: 0, died: 0, neither: 0, rackFull: 0, rackEmpty: 0,
              kills: [], allPlacedDead: 0, sawExact: 0 };

  for (let p = 0; p < 24; p++) {
    setup(o.well, o.level, o.base, fire);
    for (let i = 0; i < PRE_FIRE + p; i++) G.update(DT);
    if (state.shots.length === C.SHOT_MAX) r.rackFull++;
    if (state.shots.length === 0) r.rackEmpty++;

    const placed = [].concat(o.place(o.base + 2 * o.dir));
    for (const e of placed) state.enemies.push(e);
    const kills0 = state.tally.kills;

    let res = "neither", moving = true, after = 0, sawExact = false;
    if (o.rate === undefined) G.input.keyDown(key);
    for (let t = 0; t < 600; t++) {
      if (moving && o.rate !== undefined) G.input.mouseMove(o.dir * o.rate / C.MOUSE_SENS);
      G.update(DT);
      const sk = state.skimmer;
      if (o.exact !== undefined && Object.is(sk.lane, o.exact)) sawExact = true;
      if (sk.dead || state.lives < C.START_LIVES) { res = "died"; break; }
      if (state.dive.active) break;
      if (!state.enemies.some(e => e.blocksClear && !e.dead)) { res = "killed"; break; }
      if (moving && (o.dir > 0 ? sk.lane >= stop : sk.lane <= stop)) {
        moving = false;
        if (o.rate === undefined) G.input.keyUp(key);
      }
      if (!moving && ++after > SETTLE) break;
    }
    G.input.reset();

    r[res]++;
    r.kills.push(state.tally.kills - kills0);
    if (placed.every(e => e.dead)) r.allPlacedDead++;
    if (sawExact) r.sawExact++;
  }
  return r;
}

// ---------------------------------------------------------------------------
// The stagings — plan §1.16's, MEASURED there at 0b41f55
// ---------------------------------------------------------------------------
const VAULTER = l => new X.Vaulter(l, PARK, 1);
const CARRIER = l => new X.Carrier(l, PARK, "vaulter");
const SURGER = l => new X.Surger(l, PARK);
// A rim Vaulter four steps from its hunt hop, so it hops INTO the mover.
const HOPPER = l => {
  const v = new X.Vaulter(l, PARK, 1);
  v.hopTimer = X.vaultRimInterval() - 4 * DT;
  return v;
};
// A Drifter on the boundary past `l`: 1e9 starts a vulnerable cross this step,
// -1e9 keeps it riding and armoured.
const DRIFTER = rideTimer => l => {
  const d = new X.Drifter(l, PARK, 1);
  d.phase = "ride";
  d.lane = l + 0.5;
  d.rideTimer = rideTimer;
  return d;
};
const STACK = l => [VAULTER(l), VAULTER(l)];
const DISCHARGER = l => {
  const u = new X.Surger(l, 0.5);
  u.setPhase("discharge");
  return u;
};

const SHOOTABLE = [
  ["C1 a parked Vaulter, keys right, Ring", { well: RING, level: 1, base: 0, dir: 1, place: VAULTER }],
  ["C2 the same on the open Vee", { well: VEE, level: 1, base: 3, dir: 1, place: VAULTER }],
  ["C3 keys LEFT, Ring", { well: RING, level: 1, base: 8, dir: -1, place: VAULTER }],
  ["C4 mouse left at 0.5 lane/step, through exactly 6.5",
    { well: RING, level: 1, base: 8, dir: -1, rate: 0.5, exact: 6.5, place: VAULTER }],
  ["C5 mouse at 0.1 lane/step", { well: RING, level: 1, base: 0, dir: 1, rate: 0.1, place: VAULTER }],
  ["C6 mouse at 0.6 lane/step", { well: RING, level: 1, base: 0, dir: 1, rate: 0.6, place: VAULTER }],
  ["C7 a parked Carrier, Ring", { well: RING, level: 3, base: 0, dir: 1, place: CARRIER }],
  ["C8 a parked Carrier, Vee", { well: VEE, level: 3, base: 3, dir: 1, place: CARRIER }],
  ["C9 a parked Surger", { well: RING, level: 13, base: 0, dir: 1, place: SURGER }],
  ["C10 a rim Vaulter hops INTO a keyboard mover", { well: RING, level: 1, base: 0, dir: 1, place: HOPPER }],
  ["C11 a rim Vaulter hops into a slow mouse mover",
    { well: RING, level: 1, base: 0, dir: 1, rate: 0.06, place: HOPPER }],
  ["C12 a crossing (vulnerable) Drifter", { well: RING, level: 9, base: 0, dir: 1, place: DRIFTER(1e9) }],
  ["C13 two Vaulters stacked in one lane", { well: RING, level: 1, base: 0, dir: 1, place: STACK }],
];

const LETHAL = [
  ["N1 C1 with fire NOT held", { well: RING, level: 1, base: 0, dir: 1, fire: false, place: VAULTER }],
  ["N2 a riding (armoured) Drifter", { well: RING, level: 9, base: 0, dir: 1, place: DRIFTER(-1e9) }],
  ["N3 a Surger discharging at depth 0.5", { well: RING, level: 13, base: 0, dir: 1, place: DISCHARGER }],
];

function tallyOf(r) {
  return JSON.stringify({ killed: r.killed, died: r.died, neither: r.neither });
}

// ---------------------------------------------------------------------------
// ⛔ C1–C13: with fire held, 24/24 killed
// ---------------------------------------------------------------------------
for (const [name, o] of SHOOTABLE) {
  const r = cross(o);
  H.eq(r.rackFull, 24, `⛔ ${name}: the rack is FULL at placement in every phase (trap 1)`);
  H.eq(r.killed, 24, `⛔ ${name}: killed on every cooldown phase (${tallyOf(r)})`);
  H.eq(r.neither, 0, `${name}: every run ended in a kill or a death (trap 3)`);

  if (o.exact !== undefined) {
    H.eq(r.sawExact, 24, `⛔ ${name}: the Skimmer really stood on exactly ${o.exact}`);
  }
  if (o.place === CARRIER) {
    H.assert(r.kills.every(k => k === 3),
             `⛔ ${name}: 3 kills in every phase — the Carrier and both children, so the ` +
             `split happened through onShot (${r.kills.join(",")})`);
  }
  if (o.place === STACK) {
    H.eq(r.allPlacedDead, 24, `⛔ ${name}: BOTH stacked Vaulters died in every phase`);
  }
}

// ---------------------------------------------------------------------------
// ⛔ N1–N3: K3 and the unfiring player, 24/24 died
// ---------------------------------------------------------------------------
for (const [name, o] of LETHAL) {
  const r = cross(o);
  if (o.fire === false) {
    H.eq(r.rackEmpty, 24, `${name}: no shot is in flight at placement — fire really is not held`);
  } else {
    H.eq(r.rackFull, 24, `${name}: the rack is FULL at placement in every phase (trap 1)`);
  }
  H.eq(r.died, 24, `⛔ ${name}: the crossing Skimmer dies on every phase (${tallyOf(r)})`);
  H.eq(r.neither, 0, `${name}: every run ended in a kill or a death (trap 3)`);
}

H.report("test-cs008-p1b.js");
