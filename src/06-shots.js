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
// Game.update()'s end-of-frame filter, freeing its slot against the cap the
// SAME step — that is GDD 4.2's chip-away economy, ⚠ SETTLED as emergent.
//
// ⛔ AND SINCE CS013 P2, TWO OF OVERDRIVE'S TOKENS ARE READ HERE AND NOWHERE
// ELSE IN THIS FILE (GDD 14.1; T7, T8; 10-powerups.js). SPREAD widens the
// volley to three lanes and raises the cap to C.SPREAD_SHOT_MAX for as long as
// it is on; LANCE is copied onto each Shot as `pierce` at fire time and is read
// by the collision pass. ⛔ Both are plain reads of state.powers, which is only
// ever written in Overdrive — a Classic run fires exactly what it fired before,
// to the bit (test-cs013-p2.js).

class Shot {
  // ⛔ `pierce` IS CAPTURED AT FIRE TIME, exactly as `lane` is (GDD 14.1; CS013
  // T7). It is Lance as the shot carries it, so a Lance that ends with the well
  // never reaches back into something already in flight, and a shot fired
  // before the pickup is not retro-fitted with it. Two readers, both in the
  // collision pass: collideShots() (⛔ a KILL does not consume a pierced shot)
  // and Thorn.onShot() (C.LANCE_CHIP_MULT chips instead of one). ⛔ false on
  // every shot in Classic — state.powers is never written there.
  constructor(well, lane, pierce) {
    this.lane = laneNormalize(well, lane);
    this.t = 0;
    this.dead = false;
    this.pierce = !!pierce;
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
    drawShot(ctx, well, this.lane, this.depth(), this.pierce);
  }
}

// ⛔ THE VOLLEY'S LANES (GDD 14.1's Spread, 4.2; CS013 T8). The facing lane,
// and under Spread the two neighbours with it, each through laneNormalize() —
// so a closed well wraps across its seam and an open one clamps at its wall.
//
// ⛔ DEDUPLICATED, AND THAT IS WHAT THE CLAMP COSTS. On an open well
// laneNormalize CLAMPS (03-wells.js), so at lane 0 the left neighbour comes
// back as lane 0: a naive volley would put TWO shots in the lane the player is
// facing, which is two silhouettes in one lane on the six wells where there is
// least room to read one — GDD 1.1 P2, and the same failure splitLanes() is
// written against. The wall volley is two shots, never three, and never two in
// one lane.
//
// Returns the shared array, which is read out before anything can call this
// again — the module-scratch pattern screenPos() and skimmerPoints() use. ⛔ No
// per-frame allocation (GDD 17's budget).
const _fireLanes = [];

function fireLanes(state, well, lane) {
  _fireLanes.length = 0;
  _fireLanes.push(lane);
  // ⛔ The facing lane FIRST, so a volley the cap cuts short keeps the lane the
  // player aimed at. In Classic state.powers.spread is never written, so this
  // returns the one lane and the whole feature is a single boolean read.
  if (!state.powers.spread) return _fireLanes;
  for (let d = -1; d <= 1; d += 2) {
    const l = laneNormalize(well, lane + d);
    let seen = false;
    for (let i = 0; i < _fireLanes.length; i++) if (_fireLanes[i] === l) seen = true;
    if (!seen) _fireLanes.push(l);
  }
  return _fireLanes;
}

// Ages every shot already in flight and retires whatever reached the throat,
// THEN fires (subject to cooldown and the cap in force). Called once per
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

  // ⛔ THE CAP IN FORCE (GDD 17 item 4; CS013 T8). C.SHOT_MAX, or
  // C.SPREAD_SHOT_MAX while Spread is on — one cap, read in both places it is
  // checked. Under a cap of 8 a three-lane volley cuts the lane the player is
  // FACING by 62-75 % (plan §1.6, MEASURED), which is Spread taking away the
  // shot the player aimed; at 3 × SHOT_MAX every lane keeps the ungated 15 /s.
  // ⛔ It only ever widens, and a well change clears state.shots anyway
  // (enterWell), so the cap can never shrink under shots already in flight.
  const cap = state.powers.spread ? C.SPREAD_SHOT_MAX : C.SHOT_MAX;

  // ⛔ NO SHOT LEAVES THE RIM OFF THE GROUND (GDD 14.2; O6, CS012 P5). Airborne
  // the craft "can rotate, cannot fire"; recovering it is on the rim and
  // lethal and still cannot fire, which is what stops the rim sweep (GDD 4.5)
  // from saving a landing on a parked enemy. ⛔ The cooldown above still ages,
  // so a landing is not also a cooldown wait. In Classic jumpCanFire() is
  // always true — state.jump never leaves "ground" — so this line changes
  // nothing there, to the bit (test-cs012-p5.js).
  if (state.input.fire && jumpCanFire(state) &&
      state.shotCooldown >= C.SHOT_COOLDOWN &&
      state.shots.length < cap) {
    const lanes = fireLanes(state, well, laneNormalize(well, Math.round(state.skimmer.lane)));
    // ⛔ ONE COOLDOWN AND ONE SOUND PER VOLLEY, whatever it costs in shots: the
    // trigger pull is the event, and Spread widens it rather than speeding it
    // up. The cap is re-read per shot, so a volley that meets it is short by
    // the shots it could not fit and never puts the array past its bound.
    for (let i = 0; i < lanes.length && state.shots.length < cap; i++) {
      state.shots.push(new Shot(well, lanes[i], state.powers.lance));
      // ⛔ TELEMETRY ONLY, AND WRITE-ONLY (02-state.js's `tally`). Inside the
      // loop, so it counts shots that actually left the rim rather than trigger
      // presses the cooldown or the cap refused. Nothing in the simulation
      // reads it; GDD 4.2's economy is unchanged.
      state.tally.shotsFired++;
    }
    state.shotCooldown = 0;
    sfx("fire");
  }
}
