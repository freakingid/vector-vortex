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
// ⛔ No scoring. addScore() is CS008's single entry point, and the way to keep
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
// ⚠ SETTLED — AN ENEMY MAY PUSH INTO state.enemies FROM INSIDE onShot, WHILE
// THIS LOOP IS ITERATING IT. CS004's Carrier does exactly that: a shot kills it
// and it splits into two children through spawnEnemy() (07-enemies.js), which
// appends to the array `j` is walking. That is safe, and it is safe because of
// three separate decisions rather than by luck:
//
//   1. the inner loop is INDEX-BASED and re-reads `.length` every iteration, so
//      an appended child is simply part of the array — nothing is invalidated,
//      no iterator is live across the push;
//   2. the `break` below is UNCONDITIONAL, so the shot that caused the split
//      stops here and cannot walk forward into the children it just created;
//   3. removal is still Game.update()'s end-of-frame `.filter()` — the dead
//      parent is skipped by `e.dead` for the rest of this step and removed
//      afterwards. Nothing is spliced mid-loop (GDD 6.5).
//
// ⛔ Do not "fix" this into a deferred spawn queue: a queue would put the
// children on the board one step late, at a depth they never occupied, and buy
// nothing. Do not make the `break` conditional either — that is item 2, and it
// is load-bearing for this as well as for the chip-away economy above.
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
      // ⛔ TELEMETRY ONLY (02-state.js's `tally`), and read off `e.dead` rather
      // than off the return value: onShot() answers "was the shot consumed",
      // which is a different question from "did the enemy die" — a Thorn chips
      // and lives, and a Carrier that splits dies. Nothing here branches on it.
      if (e.dead) state.tally.kills++;
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
// Skimmer's lane is lethal, and every enemy that has one holds the same rim
// band `1 - C.RIM_CONTACT_DEPTH` at rest. FOUR of the five death conditions are
// that one comparison, which is why it is a field.
//
// ⛔ AND IT IS READ FRESH EVERY STEP BECAUSE ONE ENTITY MUTATES IT. CS005 P3's
// Surger sets killDepth to 0 for its C.SURGE_DISCHARGE window and puts the rim
// band back on the way out (07-enemies.js's setPhase). With 0 the depth test
// below is unconditionally true and the only remaining term is laneHit(), which
// is GDD 4.5 item 3 — "being in a Surger's lane when it discharges" — verbatim.
// ⛔ That is the whole of item 3, and this pass has NO BRANCH for it: caching
// the value, or reading it once per well, or special-casing a class here, would
// each break a death condition that today costs zero lines.
//
// ⛔ THERE IS NO TERM HERE FOR WHERE THE SKIMMER IS, and that is what makes a
// killDepth of 0 mean something other than it looks like. The craft is always
// at depth 1, so `e.depth >= 0` is true at EVERY legal depth: a `killDepth = 0`
// enemy is lethal from the throat, on its spawn step, having travelled nowhere.
// This header predicted 0 for the Drifter until CS005 P2; GDD 4.5 item 2's "any
// depth" is about there being no safe PHASE — a Drifter kills you while it is
// armoured, so you can neither shoot it nor touch it — and the Drifter ships on
// the rim band with everything else. ⚠ Zero becomes honest as a RESTING value
// the moment the craft can leave the rim (GDD 5's Dive, GDD 14.2's Jump) and
// this pass has two depths to compare. Until then a PERMANENT zero is an
// unaccountable death, and GDD 6.3 names that as the most common complaint
// about games in this genre.
//
// ⛔ CS006 P3 SETTLED WHICH OF THOSE TWO MOMENTS IT IS, AND IT IS THE JUMP
// ALONE. The Dive shipped and is NOT that moment: Game.update() short-circuits
// the whole gameplay pass while state.dive.active, so this function does not
// run during a dive at all, and the sentence above stays literally true. GDD 5's
// descent depth lives on state.dive and never on the craft (02-state.js,
// 11-dive.js), and GDD 4.5 item 5 is a strike test in that module rather than a
// killDepth here. GDD 14.2's Jump is the thing that puts a craft off the rim
// WHILE THIS PASS IS RUNNING, and it is the one that gives this pass a second
// depth to compare.
//
// ⚠ WHICH IS WHY THE SURGER'S ZERO IS RIGHT AND THE DRIFTER'S WOULD NOT BE, and
// it is the same number both times. The Surger's lasts C.SURGE_DISCHARGE and is
// preceded by C.SURGE_TELEGRAPH of visible fuse in which the lane is NOT lethal
// (GDD 6.3): the player is told, and then given time. A permanent kill zone is
// not a discharge, and a fuse that kills is not a fuse.
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

// ⛔ THE ONE PLACE THE PLAYER DIES (GDD 4.4, 4.5). Every one of the five death
// conditions ends here, which is why the invulnerability guard, the life, the
// freeze and the game-over stop are written once rather than per condition.
//
// ⛔ WHAT IS NOT HERE, AND WHY. The respawn is not: Game.update() does not run
// during hit-stop, so a timer started on this line would not advance for the
// whole 1.2 s. The respawn is the first LIVE step after the freeze — the step
// that sees `skimmer.dead` — and it lives in respawnSkimmer() (23-main.js).
// GDD 4.4's rim push goes with it, for the same reason: pushing here would
// teleport the killing enemy away during the freeze the player is staring at,
// and the freeze exists to show them what happened.
//
// ⛔ No fragmentation and no score. Both are CS008's — the fragmentation is a
// kit-fx primitive, and addScore() is the one scoring entry point. Death in
// CS003 reads as hit-stop plus a respawn blink.
function killSkimmer(state) {
  const sk = state.skimmer;
  if (!sk || sk.dead) return;

  // ⛔ AN INVULNERABLE SKIMMER CANNOT DIE, and the guard is HERE rather than in
  // the collision pass so the four death conditions still to come get it for
  // free: CS004 added item 4 (the Weaver's bolt), CS005 added items 2 and 3 (the
  // Drifter and the Surger, and neither cost this function a line), and CS006
  // adds item 5 with the Dive. An
  // invulnerable craft can still fire and still move: invulnerability suspends
  // dying, not playing. state.invulnTime counts UP and is armed to zero by the
  // respawn (02-state.js), so "expired" is the at-or-past-threshold case.
  if (state.invulnTime < C.RESPAWN_INVULN) return;

  sk.dead = true;
  state.lives -= 1;
  // ⛔ TELEMETRY ONLY (02-state.js's `tally`). Counted HERE and never derived
  // as START_LIVES - lives: CS008's extra-life awards raise `lives` mid-run,
  // and the derived form would start quietly under-reporting the moment they
  // land. Below the invulnerability guard, so a declined kill is not a death.
  state.tally.deaths++;

  // ⛔ THE BUTTON IS RE-LATCHED BY DEATH. Devices are still drained during
  // hit-stop (23-main.js — a freeze must not dump a second of banked mouse
  // motion into the first live step), so a Purge held across the freeze arrives
  // at the step after it looking like a fresh press. Forcing the latch true
  // makes that step read as "still held": the button needs a genuine release
  // before it can spend another charge. updatePurge() writes the latch as
  // `held` every step rather than only clearing it on release, which is what
  // lets this forced value behave correctly on the way out.
  state.purgeLatched = true;

  // ⛔ THE STOP, not a screen (GDD 4.4). CS008 owns the game-over UI, the score
  // submission and the restart flow; all this changeset does is stop stepping
  // the gameplay systems, in Game.update(). The freeze below still runs — the
  // last death of a run reads exactly like the others.
  if (state.lives <= 0) {
    state.lives = 0;
    state.screen = "gameover";
  }

  // ⛔ Simulation time freezes; rendering does not. Game.hitStop() is the one
  // freeze mechanism in the build (23-main.js) and the longest request wins.
  Game.hitStop(C.HIT_STOP_DEATH);
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
// ⛔ No bonus and no points here (GDD 7 is CS008's). C.PURGE_SAVED_BONUS reads
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
  // ⛔ TELEMETRY ONLY (02-state.js's `tally`). A CHARGE CONSUMED, which is uses
  // 1 and 2 and never 3+ — the counter above keeps rising so a HUD can tell
  // "spent" from "spent twice", and a telemetry column that followed it would
  // report a player mashing an empty button as having spent five purges.
  if (state.purgeUses <= 2) state.tally.purgesSpent++;

  // ⚠ SETTLED — THE PURGE KILLS, IT DOES NOT ASK. Both branches below set
  // `dead` directly and NEITHER calls onShot(). That is why a Purge on a well
  // of CS004 Carriers leaves it empty instead of doubling it: splitting lives
  // in Carrier.onShot (07-enemies.js), and the Purge never goes there.
  //
  // ⛔ Do not route this through onShot "for consistency". The two are not the
  // same question — a shot asks the enemy what a hit does (GDD 6.5), and the
  // Purge is GDD 4.3's panic button, which is a statement rather than a
  // question. A panic button that doubles the enemy count is not a panic
  // button. This works by OMISSION, which is exactly the kind of thing that
  // gets "unified" by a later session, so it is written down here.
  if (state.purgeUses === 1) {
    for (let i = 0; i < state.enemies.length; i++) {
      const e = state.enemies[i];
      if (!e.dead && e.purgeable) { e.dead = true; state.tally.kills++; }
    }
    return;
  }

  if (state.purgeUses === 2) {
    const victim = purgeTarget(state);
    // A second use with nothing left to kill is still SPENT. The charge is
    // consumed by the press, not by the result — otherwise a player could bank
    // the weak use by firing it into an empty well.
    // ⛔ `kills` is "the player destroyed it", by shot or by Purge, so both
    // branches of the panic button count here (02-state.js's `tally`).
    if (victim) { victim.dead = true; state.tally.kills++; }
  }
  // Third and later: nothing. The counter keeps rising so a HUD (CS008) can
  // tell "spent" from "spent twice" without a second field.
}

// The whole pass, in its fixed order. Called once per simulation step from
// Game.update().
function updateCollisions(state, well) {
  collideShots(state, well);
  collideSkimmer(state, well);
}
