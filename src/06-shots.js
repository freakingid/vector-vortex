// 06-shots.js — player shots (GDD 4.2, 10.2, 10.3).
//
// ⛔ Position is (lane, depth), nothing else. A shot's lane is captured at fire
// time from the NEAREST LANE CENTRE — Math.round(skimmer.lane) through
// laneNormalize, exactly as Skimmer.snap() picks its own target (05-skimmer.js)
// — and never changes afterwards. Shots are lane-locked; rotating the Skimmer
// after firing leaves them exactly where they were.
//
// ⛔ Entity contract (GDD 6.5): class, constructor / update(dt) / draw() / dead.
// Killed by setting dead = true; removed by an end-of-frame .filter(), never
// spliced mid-loop.
//
// depth runs rim (1) -> throat (0) over C.SHOT_TIME (GDD 3.2's convention). A
// shot's own clock counts UP in seconds of flight time (GDD 16.3), matching
// every other timer in the build; depth is derived from it, not stepped
// directly, so retuning SHOT_TIME never touches the update loop.
//
// ⛔ Shots do NOT resolve their own hits. 09-collision.js owns the one collision
// pass (CS003 P3) and runs it after this update, so a shot's depth for the step
// is already final when it is tested. A shot the pass consumed is removed by
// Game.update()'s end-of-frame filter, freeing its slot against C.SHOT_MAX the
// SAME step — that is GDD 4.2's chip-away economy, ⚠ SETTLED as emergent.

class Shot {
  constructor(well, lane) {
    this.lane = laneNormalize(well, lane);
    this.t = 0;
    this.dead = false;
  }

  // 1 at the rim, 0 at the throat. Never negative — a shot that has overrun
  // SHOT_TIME is retired the same step, before depth is ever read again.
  depth() {
    const d = 1 - this.t / C.SHOT_TIME;
    return d < 0 ? 0 : d;
  }

  update(dt) {
    this.t += dt;
    if (this.depth() <= 0) this.dead = true;
  }

  // ⛔ drawPoly + glowStroke only (GDD 10.2); the actual point math lives in
  // 14-render-entities.js alongside whatever other entities land there.
  draw(ctx, well) {
    drawShot(ctx, well, this.lane, this.depth());
  }
}

// Ages every shot already in flight and retires whatever reached the throat,
// THEN fires (subject to cooldown and the SHOT_MAX cap). Called once per
// simulation tick, from 23-main.js, directly below the Skimmer's own update —
// that ordering is what lets a shot fired this step capture the Skimmer's
// POST-MOVE lane, the same "nearest lane centre" Skimmer.snap() targets.
//
// ⛔ AGE, FILTER, THEN FIRE — CS008 P1, and the order is the fix. A shot fired
// before the ageing loop was aged on its own fire tick, so its first TESTED
// depth was 1 - FIXED_DT / SHOT_TIME ≈ 0.968 and no shot ever existed at the
// rim: depth 1.000 got one shot sample where every other depth got three, and
// an enemy parked there was hittable on one tick of the cadence in four. Fired
// last, a shot is born at depth 1 and the collision pass tests it THERE on the
// step it leaves the rim (GDD 4.2). ⛔ The C.SHOT_MAX check reads the length
// AFTER retirement (plan A1, not A2): checking the cap before ageing lets a
// fresh unaged shot count against it and the cap binds one tick in the cadence,
// which was measured worse (PLANNED-FEATURES-CS008.md §1.1).
function updateShots(state, well, dt) {
  if (state.shotCooldown < C.SHOT_COOLDOWN) state.shotCooldown += dt;

  for (let i = 0; i < state.shots.length; i++) state.shots[i].update(dt);
  // ⛔ end-of-frame filter; a shot is never spliced out mid-loop (GDD 6.5).
  state.shots = state.shots.filter(s => !s.dead);

  if (state.input.fire &&
      state.shotCooldown >= C.SHOT_COOLDOWN &&
      state.shots.length < C.SHOT_MAX) {
    const lane = laneNormalize(well, Math.round(state.skimmer.lane));
    state.shots.push(new Shot(well, lane));
    state.shotCooldown = 0;
    // ⛔ TELEMETRY ONLY, AND WRITE-ONLY (02-state.js's `tally`). Inside the
    // branch, so it counts shots that actually left the rim rather than trigger
    // presses the cooldown or C.SHOT_MAX refused. Nothing in the simulation
    // reads it; GDD 4.2's economy is unchanged.
    state.tally.shotsFired++;
  }
}
