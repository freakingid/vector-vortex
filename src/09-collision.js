// 09-collision.js — the one collision pass, and the Purge (GDD 4.2, 4.3, 4.5,
// 6.5).
//
// ⛔ COLLISION IS 1-D. A lane match plus an overlap on `depth`, and nothing
// else. No trigonometry, no screen coordinates, no distance in pixels — every
// entity's position is (lane, depth) (GDD 3.2) and the projection that turns
// that into an x/y exists only inside draw code. Writing 2-D geometry into
// entity logic is the single most common source of subtle bugs in this kind of
// game: the moment a hit test reads a projected point, the same overlap starts
// passing at the rim and failing at the throat, because perspective() is not
// linear.
//
// ⛔ ONE PASS, in a FIXED ORDER: shots against enemies, then enemies against
// the Skimmer, each iterating its array front to back. GDD 17.1's replay
// guarantee is why — the same seed and the same recorded inputs must pick the
// same target every time, and "whichever one the loop happened to reach first"
// is only deterministic if the loop order is written down.
//
// ⛔ Called from Game.update() AFTER the entity pass and BEFORE the end-of-frame
// filters. Nothing here removes an array element; hits set `dead = true` and
// the caller's .filter() does the removal (GDD 6.5). Never splice mid-loop.
//
// ⛔ No scoring. addScore() is CS006's single entry point, and the way to keep
// it single is to not build a temporary second one here. C.PTS_VAULTER and
// C.PURGE_SAVED_BONUS are deliberately unread this changeset.

// Are two lanes the same lane, to within the contact tolerance? ⛔ laneDelta,
// never (a - b): on a 16-lane Ring the distance from lane 15.9 to lane 0 is
// +0.1, and the bare subtraction says 15.9 — a shot fired across the seam would
// miss the thing it is pointed at (03-wells.js).
function laneHit(well, a, b) {
  return Math.abs(laneDelta(well, a, b)) <= C.HIT_LANE_TOL;
}

// ---------------------------------------------------------------------------
// Shots vs enemies (GDD 4.2)
// ---------------------------------------------------------------------------
//
// ⛔ ONE SHOT RESOLVES AGAINST AT MOST ONE ENEMY PER STEP — the `break` below is
// unconditional, not conditional on consumption. A shot the enemy declines to
// consume (GDD 6.2's armour, and 07-enemies.js's base-class default) flies on
// and meets whatever is behind it on a LATER step, at a depth it has actually
// travelled to. Letting it walk the rest of the array in the same step would
// make one trigger pull kill a whole stacked lane, which is exactly the
// chip-away economy GDD 4.2 is built around inverted.
//
// The enemy decides what a hit does, not this pass: it only asks. That is what
// keeps CS004's Thorn (chip, consume) and an armoured entity (no damage, do not
// consume) out of here as special cases.
//
// ⛔ NO TUNNELING CHECK IS NEEDED, and here is the arithmetic so a future
// session does not add one: a shot crosses C.SHOT_TIME (0.52 s) of depth in
// one step of C.FIXED_DT, i.e. 1/0.52/60 ≈ 0.032 depth units, and the hit band
// is 2 * C.HIT_DEPTH_TOL = 0.10 wide. The band is wider than the step, so a
// shot cannot step over an enemy. Retuning SHOT_TIME below ~0.3 s, or
// HIT_DEPTH_TOL below ~0.017, breaks that and would need swept-interval logic.
function collideShots(state, well) {
  for (let i = 0; i < state.shots.length; i++) {
    const shot = state.shots[i];
    if (shot.dead) continue;
    const sd = shot.depth();

    for (let j = 0; j < state.enemies.length; j++) {
      const e = state.enemies[j];
      if (e.dead) continue;
      if (Math.abs(sd - e.depth) > C.HIT_DEPTH_TOL) continue;
      if (!laneHit(well, shot.lane, e.lane)) continue;

      // Consumed retires the shot; the caller's filter frees its slot against
      // C.SHOT_MAX the same step, which is what makes camping a thorned lane
      // chip rapidly (GDD 4.2, ⚠ SETTLED — emergent, not a bug to smooth out).
      if (e.onShot(shot)) shot.dead = true;
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Enemies vs the Skimmer (GDD 4.5)
// ---------------------------------------------------------------------------
//
// ⛔ `killDepth` is read off the entity, never a class name (07-enemies.js).
// null means contact NEVER kills — the Weaver, whose projectile is the threat
// and whose body is not. A number is the depth at or past which contact in the
// Skimmer's lane is lethal: the Vaulter's is the rim band, the Drifter's will
// be 0 (lethal at any depth, GDD 4.5 item 2). Three of the five death
// conditions are that one comparison, which is why it is a field.
function collideSkimmer(state, well) {
  const sk = state.skimmer;
  if (!sk || sk.dead) return;

  for (let i = 0; i < state.enemies.length; i++) {
    const e = state.enemies[i];
    if (e.dead) continue;
    if (e.killDepth === null || e.killDepth === undefined) continue;
    if (e.depth < e.killDepth) continue;
    if (!laneHit(well, e.lane, sk.lane)) continue;
    killSkimmer(state);
    return;   // one death per step, whatever else is touching
  }
}

// ⛔ THE ONE PLACE THE PLAYER DIES. Today it sets the flag and nothing else;
// CS003 P4 fills in the life, the hit-stop, the respawn and the game-over stop
// HERE, so there is exactly one thing to fill in rather than a death path per
// death condition (GDD 4.5 lists five, and CS004 adds two of them).
function killSkimmer(state) {
  const sk = state.skimmer;
  if (!sk || sk.dead) return;
  sk.dead = true;
}

// ---------------------------------------------------------------------------
// The Purge (GDD 4.3)
// ---------------------------------------------------------------------------
//
// ⛔ ONE CHARGE PER WELL, re-armed by enterWell() and NEVER accumulated.
// state.purgeUses counts UP (GDD 16.3 — no countdown timers anywhere in the
// build) and is the whole rule:
//
//   1st use   every enemy with `purgeable` dies. ⛔ Non-purgeable ones are
//             untouched — GDD 4.3's "does not remove Thorns", read off the
//             entity's flag rather than a class name, which is what keeps this
//             two rules instead of a growing list of exceptions.
//   2nd use   exactly ONE enemy dies, the purgeable one nearest the rim. No
//             bonus. The weak second use is what converts the Purge from a spam
//             button into a decision.
//   3rd+      nothing.
//
// ⛔ No bonus and no points here (GDD 7 is CS006's). C.PURGE_SAVED_BONUS reads
// state.purgeUses === 0 when it lands; that is why this is a count and not the
// boolean CS003 P2 shipped.

// The second use's victim: the purgeable enemy nearest the RIM (highest depth).
//
// ⛔ THE TIE-BREAK IS PART OF THE FEATURE, not an implementation detail. GDD 4.3
// says "deterministically, so the player can predict it", so: highest depth,
// then lowest lane, then array order. The strict comparisons below are what
// give the last of those three for free — an equal candidate never displaces
// the one already held, so the earliest survivor of a full tie wins.
function purgeTarget(state) {
  let best = null;
  for (let i = 0; i < state.enemies.length; i++) {
    const e = state.enemies[i];
    if (e.dead || !e.purgeable) continue;
    if (best === null) { best = e; continue; }
    if (e.depth > best.depth) { best = e; continue; }
    if (e.depth === best.depth && e.lane < best.lane) best = e;
  }
  return best;
}

// One simulation step of the Purge.
//
// ⛔ state.input.purge IS A LEVEL, NOT AN EDGE. All four devices in 04-input.js
// write a HELD boolean into the one input struct (GDD 9.5) — there is no
// "pressed this frame" anywhere in the build, and adding one to the input
// module would be a second input shape for every device to get right. So the
// edge is detected HERE: state.purgeLatched is simply "the button was held last
// step", and the charge is spent only on a false -> true transition. Holding
// the button down for a whole well spends exactly one charge.
//
// ⛔ CS003 P4 SETS state.purgeLatched ON DEATH, and this is why it can: input
// devices are still drained during hit-stop (23-main.js, deliberate — a freeze
// must not dump a second of banked mouse motion into the first live step), so a
// Purge held through a death arrives at the step after the freeze looking like
// a fresh press. Forcing the latch true makes that step read as "still held",
// and the button needs a genuine release before it fires again. Writing the
// latch as `held` every step, rather than only clearing it on release, is what
// makes that forced value survive correctly.
function updatePurge(state) {
  const held = !!state.input.purge;
  const rising = held && !state.purgeLatched;
  state.purgeLatched = held;
  if (!rising) return;

  state.purgeUses++;

  if (state.purgeUses === 1) {
    for (let i = 0; i < state.enemies.length; i++) {
      const e = state.enemies[i];
      if (!e.dead && e.purgeable) e.dead = true;
    }
    return;
  }

  if (state.purgeUses === 2) {
    const victim = purgeTarget(state);
    // A second use with nothing left to kill is still SPENT. The charge is
    // consumed by the press, not by the result — otherwise a player could bank
    // the weak use by firing it into an empty well.
    if (victim) victim.dead = true;
  }
  // Third and later: nothing. The counter keeps rising so a HUD (CS006) can
  // tell "spent" from "spent twice" without a second field.
}

// The whole pass, in its fixed order. Called once per simulation step from
// Game.update().
function updateCollisions(state, well) {
  collideShots(state, well);
  collideSkimmer(state, well);
}
