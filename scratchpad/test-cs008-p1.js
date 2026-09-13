// test-cs008-p1.js — CS008 P1: the rim fix (GDD 4.2, 6.1, 6.5; plan §1.1, §2).
// Asserts what P1 owns: an enemy that arrives at the rim in a firing Skimmer's
// lane is killed on EVERY cooldown phase, the four climbs park at the kill
// band, a Vaulter hunts from there, and a shot is tested at the rim on its
// fire tick.
//
// ⛔ TRAPS IN THE FIXTURES.
//  1. The spawner is HELD, not emptied: `spawn.remaining` above 0 and the timer
//     far below the interval. A quota of 0 plus a dead board is a cleared well,
//     and the run dives instead of answering.
//  2. 0..23 ticks of pre-fire walk every cooldown phase. A fixed phase can land
//     on a lucky tick and pass a build that is still a coin flip.
//  3. A run that ends in NEITHER outcome is a failure, never a skip.
//  4. The mutation record (ε removed, (A) reverted, atRim() left at >= 1 — each
//     turns this file red) is in log/CS008.md, not here.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260913;

installSeed(SEED);                          // ⛔ above the first buildGame()
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const state = X.state;
const DT = C.FIXED_DT;
const PARK = 1 - C.RIM_CONTACT_DEPTH;

const RING = X.WELLS[0];
const VEE = X.WELLS[7];
H.assert(RING.name === "Ring" && RING.closed, "fixture: WELLS[0] is the closed Ring");
H.assert(VEE.name === "Vee" && !VEE.closed, "fixture: WELLS[7] is the open Vee");

// A live board on `wellIndex` at `level`, fire held, spawner held (trap 1), the
// Skimmer parked on lane centre `lane`.
function setup(wellIndex, level, lane) {
  G.reset();
  X.startGame(SEED);
  state.level = level;
  state.wellIndex = wellIndex;
  X.enterWell();
  state.spawn.remaining = 5;
  state.spawn.timer = -1e9;
  state.skimmer.lane = lane;
  G.input.reset();
  G.input.keyDown(" ");
}

// Step the real Game.update() until one side has won.
function outcome(maxTicks) {
  for (let t = 0; t < maxTicks; t++) {
    G.update(DT);
    if (state.skimmer.dead || state.lives < C.START_LIVES) return "died";
    if (state.dive.active) return "dived";
    if (state.enemies.filter(e => e.blocksClear && !e.dead).length === 0) return "killed";
  }
  return "neither";
}

// Kills out of 24, one run per pre-fire phase (trap 2). `place` puts the one
// enemy on the board after the pre-fire.
function arrival(wellIndex, level, lane, maxTicks, place) {
  const tally = { killed: 0, died: 0, dived: 0, neither: 0 };
  for (let p = 0; p < 24; p++) {
    setup(wellIndex, level, lane);
    for (let i = 0; i < p; i++) G.update(DT);
    state.enemies.push(place());
    tally[outcome(maxTicks)]++;
  }
  G.input.keyUp(" ");
  return tally;
}

// ---------------------------------------------------------------------------
// ⛔ THE ARRIVAL TABLE — 24/24 on the Ring AND on an open well (plan §1.1)
// ---------------------------------------------------------------------------
for (const [idx, base] of [[0, 0], [7, 5]]) {
  const name = X.WELLS[idx].name;

  // S1: a hunting Vaulter parked one lane away hops INTO a stationary Skimmer.
  const s1 = arrival(idx, 1, base, 600, () => new X.Vaulter(base + 1, PARK, 1));
  H.eq(s1.killed, 24, `⛔ ${name} S1: a rim Vaulter hopping in is killed on every cooldown phase ` +
       `(${JSON.stringify(s1)})`);
  H.eq(s1.neither + s1.dived, 0, `${name} S1: every run ended in a kill or a death (trap 3)`);

  // S2: a Vaulter climbing the Skimmer's own lane from mid-well — the control.
  const s2 = arrival(idx, 1, base, 600, () => new X.Vaulter(base, 0.5, 1));
  H.eq(s2.killed, 24, `${name} S2: a Vaulter climbing the Skimmer's lane is killed ` +
       `(${JSON.stringify(s2)})`);
  H.eq(s2.neither + s2.dived, 0, `${name} S2: every run ended in a kill or a death (trap 3)`);

  // S4: a rim Drifter two lanes away homes in.
  const s4 = arrival(idx, 9, base, 900, () => new X.Drifter(base + 2, PARK, -1));
  H.eq(s4.killed, 24, `⛔ ${name} S4: a rim Drifter homing in is killed on every cooldown phase ` +
       `(${JSON.stringify(s4)})`);
  H.eq(s4.neither + s4.dived, 0, `${name} S4: every run ended in a kill or a death (trap 3)`);
}

// ---------------------------------------------------------------------------
// (B) THE PARK DEPTH — each of the four climbs settles at exactly the kill band
// ---------------------------------------------------------------------------
{
  setup(0, 1, 0);
  G.input.keyUp(" ");
  const climbers = {
    Vaulter: new X.Vaulter(8, 0.8, 1),
    Carrier: new X.Carrier(8, 0.8, "vaulter"),
    Drifter: new X.Drifter(8, 0.8, 1),
    Surger: new X.Surger(8, 0.8),
  };
  for (const [kind, e] of Object.entries(climbers)) {
    let over = null;
    for (let i = 0; i < 1200; i++) {
      e.update(DT, RING, state);
      if (e.depth > PARK && over === null) over = e.depth;
    }
    H.eq(e.depth, PARK, `⛔ the ${kind} climb settles at exactly 1 - C.RIM_CONTACT_DEPTH`);
    H.assert(over === null, `⛔ and the ${kind} never passes it on any tick (${over})`);
  }

  // ⛔ The WeaverBolt is NOT a climber: it still reaches the rim and retires.
  const bolt = new X.WeaverBolt(8, 0.9);
  let boltAtRim = false;
  for (let i = 0; i < 60 && !bolt.dead; i++) {
    bolt.update(DT, RING, state);
    if (bolt.depth >= 1) boltAtRim = true;
  }
  H.assert(boltAtRim && bolt.dead, "the WeaverBolt is untouched — it reaches depth 1 and self-terminates");
}

// ---------------------------------------------------------------------------
// (B) atRim() — a Vaulter that reaches the park depth HUNTS from there
// ---------------------------------------------------------------------------
{
  setup(0, 1, 0);
  G.input.keyUp(" ");
  const v = new X.Vaulter(4, PARK - 0.02, 1);   // level 1: no mid-climb vaulting
  let arrivedAt = -1, hopAt = -1, hopDelta = 0;
  for (let i = 0; i < 300 && hopAt < 0; i++) {
    v.update(DT, RING, state);
    if (arrivedAt < 0 && v.depth === PARK) {
      arrivedAt = i;
      H.assert(v.atRim(), "⛔ atRim() is true at the park depth");
    }
    if (v.hopping) { hopAt = i; hopDelta = v.hopDelta; }
  }
  H.assert(arrivedAt >= 0, "the Vaulter reached the park depth");
  H.assert(hopAt > arrivedAt, `⛔ and then hunted — a rim hop started (arrived ${arrivedAt}, hop ${hopAt})`);
  H.close((hopAt - arrivedAt) * DT, X.vaultRimInterval(), 2 * DT,
          "one rim interval after arrival — the arrival reset the hunt cadence");
  H.assert(hopDelta < 0, `toward the Skimmer at lane 0 (hopDelta ${hopDelta})`);
}

// ---------------------------------------------------------------------------
// (A) ordering A1 — a shot is born and TESTED at the rim; the cap reads the
// post-retirement length
// ---------------------------------------------------------------------------
{
  setup(0, 1, 0);
  state.shots = [];
  state.shotCooldown = C.SHOT_COOLDOWN;
  state.input.fire = true;
  X.updateShots(state, RING, DT);
  H.eq(state.shots.length, 1, "a shot left the rim");
  H.eq(state.shots[0].depth(), 1, "⛔ at depth 1 on its fire tick — it was not aged before the pass");

  // Eight in flight, the oldest one step from the throat: it retires first, so
  // the cap has room on this same step.
  state.shots = [];
  for (let i = 0; i < C.SHOT_MAX; i++) state.shots.push(new X.Shot(RING, 0));
  state.shots[0].t = C.SHOT_TIME - DT / 2;
  state.shotCooldown = C.SHOT_COOLDOWN;
  X.updateShots(state, RING, DT);
  H.eq(state.shots.length, C.SHOT_MAX, "⛔ a shot retiring this step frees its slot for this step's fire");
  H.eq(state.shots[state.shots.length - 1].depth(), 1, "and the new shot is at the rim");
  G.input.keyUp(" ");
}

H.report("test-cs008-p1.js");
