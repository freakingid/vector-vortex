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
// ⛔ AND SINCE CS008 P1b THE SECOND HALF CAN KILL AN ENEMY, NOT ONLY THE
// SKIMMER: the rim sweep in collideSkimmer() asks a touching rim enemy
// onShot() while fire is held. It is still this pass and this order — shots
// resolve first, so the sweep only ever meets what the shots left standing.
//
// ⛔ Called from Game.update() AFTER the entity pass and BEFORE the end-of-frame
// filters. Nothing here removes an array element; hits set `dead = true` and
// the caller's .filter() does the removal (GDD 6.5). Never splice mid-loop.
//
// ⛔ SCORING, CS008 P2: ALL OF THE BUILD'S KILL SITES ARE IN THIS FILE —
// collideShots(), the rim sweep in collideSkimmer(), both Purge uses, and —
// CS013 P3, W4 — jumpStrike(), a FOURTH site and a FIFTH line. Each awards
// `e.points()` through addScore() (12-scoring.js) on the false -> true `dead`
// transition, beside the `tally.kills` it already counted, and nowhere else.
// The Thorn's per-chip 5 is paid inside its own onShot(), not here.
//
// ⛔ AND THE KILL SOUND, CS009 P5, beside the points on the same five lines:
// `sfx("kill", e.sfxVoice)`, the pitch read off the entity's eighth contract
// field (07-enemies.js). No sound call here writes `state` or draws.
//
// ⛔ AND SINCE CS012 P4, OVERDRIVE'S COMBO, AT THOSE SAME EDGES AND NOWHERE
// ELSE (GDD 14.4; O4, R6; 12-scoring.js). Each of the five lines reads
// `addScore(e.points() * comboMult()); comboKill(state);` — the kill is scored
// at the CURRENT multiplier and then raises it. ⛔ addScore() is unchanged and
// stays the one writer: a multiplier folded into it would also multiply the
// Thorn's per-chip 5, the clear bonuses and the Start Depth bonus, which is
// the scope O4 ruled out. ⛔ Both are exactly 1 / a no-op in Classic, so a
// Classic run is bit-identical to the build before this phase.
//
// ⛔ AND SINCE CS013 P2, TWO OF OVERDRIVE'S THREE LASTING TOKENS ARE READ IN
// THIS FILE (GDD 14.1; T7, T9; 10-powerups.js). LANCE is one term on the line
// that retires a shot — a kill does not consume a pierced one — and THE WARD is
// one early return in killSkimmer(), below its invulnerability guard and above
// everything a death does. ⛔ Neither adds a branch to the pass itself, and
// both are plain reads of a flag that is only ever written in Overdrive.
//
// ⛔ AND SINCE CS013 P1, OVERDRIVE'S TOKEN DROP, AT THOSE SAME EDGES AND NOWHERE
// ELSE (GDD 14.1; T2; 10-powerups.js). `dropToken(state, e)` follows
// comboKill() on each of the five lines: EVERY kill at a kill site rolls, and
// spends exactly ONE draw from the run's stream whether or not anything drops.
// ⛔ It is a total no-op in Classic — no draw — and the Dive's termination
// kill (11-dive.js) is not a kill site and rolls nothing.

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
      // ⛔ ALOFT IS OUT OF REACH (GDD 14.6; CS013 P3, W1, W4; 07-enemies.js's
      // ninth contract field). A shot never meets something ABOVE the well, so
      // "killable only by Jump" costs this pass one line and no branch on a
      // class. ⛔ It is also what keeps an unshootable Warden from SHIELDING
      // the rim band of its lane: a shot is born at depth 1 and would otherwise
      // be hit-tested against it on its first two steps, decline, and stop
      // there — the Weaver bolt's shipped shielding, on an entity nothing can
      // ever remove. ⛔ `aloft`, never `depth >= 1`: the flag is the phase, and
      // a climbing Warden at depth 1 for one step is still shootable-and-
      // declining rather than out of reach.
      if (e.aloft) continue;
      // ⛔ + C.HIT_DEPTH_EPS, here and nowhere else: |1 - 0.95| is
      // 0.050000000000000044 in IEEE-754, and a rim-parked enemy must not
      // escape its fire-tick shot by 4.4e-17 (00-config.js, CS008 P1).
      if (Math.abs(sd - e.depth) > C.HIT_DEPTH_TOL + C.HIT_DEPTH_EPS) continue;
      if (!laneHit(well, shot.lane, e.lane)) continue;

      // Consumed retires the shot; the caller's filter frees its slot against
      // the cap the same step, which is what makes camping a thorned lane
      // chip rapidly (GDD 4.2, ⚠ SETTLED — emergent, not a bug to smooth out).
      //
      // ⛔ AND SINCE CS013 P2, LANCE IS THE ONE EXCEPTION, AS ONE TERM (GDD
      // 14.1; T7): a KILL does not consume a pierced shot. `pierce` is the
      // shot's own field, captured at fire time (06-shots.js), and `e.dead` is
      // read after onShot() — so a CHIP, a REFUSAL (the Weaver's bolt, a riding
      // Drifter's armour) and a decline consume or fly on exactly as the enemy
      // decided, with or without Lance. ⛔ THE `break` BELOW STAYS
      // UNCONDITIONAL: a pierced shot still resolves against at most one enemy
      // per step and meets the next on a LATER step, at a depth it has actually
      // travelled to. Letting it walk the rest of the array would make one
      // trigger pull clear a stacked lane, which is the economy above inverted.
      if (e.onShot(shot) && !(shot.pierce && e.dead)) shot.dead = true;
      // ⛔ THE KILL, read off `e.dead` rather than off the return value:
      // onShot() answers "was the shot consumed", which is a different question
      // from "did the enemy die" — a Thorn chips and lives, and a Carrier that
      // splits dies. `e.dead` was false above, so this IS the false -> true
      // transition: the telemetry count (02-state.js's `tally`) and the points
      // (12-scoring.js), and nothing here branches on either.
      if (e.dead) { state.tally.kills++; addScore(e.points() * comboMult()); comboKill(state); dropToken(state, e); sfx("kill", e.sfxVoice); }
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
// the rim band with everything else. A PERMANENT zero is an unaccountable
// death, and GDD 6.3 names that as the most common complaint about games in
// this genre.
//
// ⛔ AND IT IS STILL TRUE AFTER THE DIVE AND AFTER THE JUMP — BOTH OF WHICH
// THIS HEADER PREDICTED WOULD END IT (CS006 P3, CS012 P5 R3). Neither gave the
// craft a depth:
//
//   the Dive   Game.update() short-circuits the whole gameplay pass while
//              state.dive.active, so this function does not run during one at
//              all. GDD 5's descent depth lives on state.dive and never on the
//              craft (02-state.js, 11-dive.js), and GDD 4.5 item 5 is a strike
//              test in that module rather than a killDepth here.
//   the Jump   airborne is a PHASE on state.jump (05-skimmer.js), and this
//              function SKIPS ITS WHOLE PASS while it holds — see the skip in
//              collideSkimmer() below. Immunity is a return, not an arithmetic
//              comparison, so there is still exactly one two-depth comparison
//              in the build and it is the dive strike's.
//
// ⛔ So `killDepth = 0` on a resting enemy stays as wrong as it was, and no
// future session should "finish" it: the one honest zero is the Surger's
// discharge window, below.
//
// ⚠ WHICH IS WHY THE SURGER'S ZERO IS RIGHT AND THE DRIFTER'S WOULD NOT BE, and
// it is the same number both times. The Surger's lasts C.SURGE_DISCHARGE and is
// preceded by C.SURGE_TELEGRAPH of visible fuse in which the lane is NOT lethal
// (GDD 6.3): the player is told, and then given time. A permanent kill zone is
// not a discharge, and a fuse that kills is not a fuse.
//
// ⛔ THE RIM SWEEP, CS008 P1b (GDD 4.5; PLANNED-FEATURES-CS008.md §1.16, §2b;
// Paul's K1-K4). With fire held, a rim enemy the Skimmer touches dies if a shot
// could kill it — asked AFTER the lane match and BEFORE killSkimmer():
//
//   1. THE FIRE GATE IS state.input.fire, the level every device writes, so
//      touch auto-fire counts. A player not holding fire still dies on contact.
//   2. THE DEPTH GATE IS THE PARK EXPRESSION, `1 - C.RIM_CONTACT_DEPTH`, and no
//      new constant. Its one job is a Surger discharging BELOW the rim, whose
//      killDepth is 0 there: GDD 4.5 item 3 stands.
//   3. ⛔ onShot(), NEVER `e.dead = true`. The enemy decides what a hit does
//      (GDD 6.5): a riding Drifter's armour refuses (item 2 stands), a Weaver
//      bolt declines (item 4 stands), and a Carrier splits through spawnEnemy()
//      exactly as a shot kill does. That is the OPPOSITE of the Purge's
//      ⚠ SETTLED omission below, for the same reason: the Purge is a statement,
//      and this is a shot that never had to fly. `null` is safe — no onShot in
//      the build reads its argument — and "consumed" is ignored, because there
//      is no shot to consume. `kills` counts it; `shotsFired` does not; and
//      it scores `e.points()` exactly as a shot kill does (CS008 P2).
//   4. ⛔ `continue`, NEVER `return`. Every enemy touching this step is asked,
//      stacked ones included, and a Carrier's children appended mid-loop are
//      reached by the index-based walk, exactly as in collideShots().
//
// It sits above killSkimmer()'s invulnerability guard, so an invulnerable craft
// that is firing still kills what it touches: invulnerability suspends dying,
// not playing.
//
// ⛔ WHY CONTACT-SIDE AND NOT SHOT-SIDE — read this before "unifying" it into
// updateShots(). It reads like a bypass of the fire economy, and every shot-
// based alternative was MEASURED short of 24/24 on a full rack (plan §1.16):
// re-arming the cooldown on a fire-lane change is 6/24, because SHOT_MAX
// refuses the re-armed shot; letting that shot ignore SHOT_MAX still leaves C10
// (a rim Vaulter hopping into a mover) at 0/24 and C13 (two Vaulters stacked)
// at 0/24; also testing contact on the FIRE lane lifts C10 only to 18/24 — at
// lane 1.257 the craft fires into lane 1 while the hopping Vaulter at 1.583 is
// 0.326 from contact and 0.583 off the shot's lane — drops C11 to 6/24, and
// leaves C13 at 0/24, because collideShots()' load-bearing `break` resolves one
// enemy per shot per step. The sweep is 24/24 on all thirteen shootable shapes
// and holds all three lethal ones (test-cs008-p1b.js).
//
// ⛔ AND SINCE CS012 P5, ONE SKIP ABOVE ALL OF IT: AIRBORNE (GDD 14.2; O6, R3).
// The whole pass is skipped while state.jump.phase is "air" — contact death
// AND the rim sweep together, because "immune to rim contact and Surger
// discharge" is not a fire-gated privilege and a craft that is off the rim is
// not touching what it flies over. It is ONE return rather than a term per
// death condition, so every contact killer in the roster inherits it at once:
// a Vaulter, a Carrier, a Weaver bolt, a riding or crossing Drifter, a Reaver
// and a Surger's discharge are each staged and mutation-checked in
// test-cs012-p5.js. ⛔ RECOVERY IS NOT COVERED — those C.JUMP_RECOVERY seconds
// are on the rim and lethal, and that is the whole cost of the jump.
function collideSkimmer(state, well) {
  const sk = state.skimmer;
  if (!sk || sk.dead) return;
  if (jumpAirborne(state)) return;

  for (let i = 0; i < state.enemies.length; i++) {
    const e = state.enemies[i];
    if (e.dead) continue;
    if (e.killDepth === null || e.killDepth === undefined) continue;
    if (e.depth < e.killDepth) continue;
    if (!laneHit(well, e.lane, sk.lane)) continue;
    // ⛔ The rim sweep — the header above, and the four decisions in it.
    if (state.input.fire && e.depth >= 1 - C.RIM_CONTACT_DEPTH) {
      e.onShot(null);
      if (e.dead) { state.tally.kills++; addScore(e.points() * comboMult()); comboKill(state); dropToken(state, e); sfx("kill", e.sfxVoice); continue; }
    }
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
// ⛔ No fragmentation and no score. The fragmentation is drawFragments()
// (14-render-entities.js), drawn by Game.draw() off the freeze this function
// starts, and a death costs no points. What it DOES write for scoring is
// state.diedThisWell, GDD 7's "no death" bonus (12-scoring.js).
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

  // ⛔ THE WARD ABSORBS IT, AND THAT IS NOT A DEATH (GDD 14.1, 4.4, 4.5; CS013
  // T9; 10-powerups.js). BELOW the guard, deliberately and for the same reason
  // `diedThisWell`, `deaths` and the combo are: a hit the guard declined was
  // never a hit, and spending the shell on one would cost the player a free hit
  // they never used. Above everything else, because nothing below this line
  // happened — ⛔ no life, no `diedThisWell`, no `tally.deaths`, no combo loss,
  // no freeze and no stop. GDD 14.1's "one free hit".
  //
  // What it DOES buy is the respawn's window and its blink, and nothing else
  // (T9): state.invulnTime counts UP and is armed to zero here exactly as
  // respawnSkimmer() arms it, so the player has C.RESPAWN_INVULN to leave.
  // ⛔ NO RIM PUSH — nobody died, and the enemy that touched is still there;
  // C.SURGE_DISCHARGE < C.RESPAWN_INVULN already covers a discharge running
  // through the window.
  //
  // ⛔ ONE AT A TIME (T5): the flag is a boolean, so a second Ward collected
  // while shelled is collected, sounds, and changes nothing.
  // ⛔ Unconditional, like comboDeath() below — state.powers is never written
  // outside Overdrive, so this is one boolean read in Classic and no branch.
  // ⛔ A DIVE NEVER REACHES IT: startDive() calls resetTokens(), so no Ward
  // survives the clear and the Thorn strike (GDD 4.5 item 5) cannot be absorbed.
  if (state.powers.ward) {
    state.powers.ward = false;
    state.invulnTime = 0;
    sfx("wardBreak");
    return;
  }

  sk.dead = true;
  state.lives -= 1;
  // ⛔ Below the invulnerability guard, so a declined kill is not a death.
  // enterWell() is the only thing that clears it.
  state.diedThisWell = true;
  // ⛔ TELEMETRY ONLY (02-state.js's `tally`). Counted HERE and never derived
  // as START_LIVES - lives: CS008's extra-life awards raise `lives` mid-run,
  // and the derived form would start quietly under-reporting the moment they
  // land. Below the invulnerability guard, so a declined kill is not a death.
  state.tally.deaths++;
  sfx("death");

  // ⛔ THE COMBO IS ×1 AT ONCE (GDD 14.4; O3; 12-scoring.js), and BELOW the
  // invulnerability guard for the same reason `diedThisWell` and `deaths` are:
  // a kill the guard declined is not a death, so it is not a combo loss either.
  // ⛔ Unconditional — comboDeath() is a no-op in Classic, so this function
  // stays free of a mode branch, exactly as `jump.latched` below does.
  comboDeath(state);

  // ⛔ THE BUTTON IS RE-LATCHED BY DEATH. Devices are still drained during
  // hit-stop (23-main.js — a freeze must not dump a second of banked mouse
  // motion into the first live step), so a Purge held across the freeze arrives
  // at the step after it looking like a fresh press. Forcing the latch true
  // makes that step read as "still held": the button needs a genuine release
  // before it can spend another charge. updatePurge() writes the latch as
  // `held` every step rather than only clearing it on release, which is what
  // lets this forced value behave correctly on the way out.
  state.purgeLatched = true;

  // ⛔ AND THE JUMP BUTTON WITH IT (CS012 P5; O6), for the identical reason and
  // by the identical mechanism: updateJump() writes `latched` as `held` every
  // step, so forcing it true here makes the first live step after the freeze
  // read as "still held" and the button needs a genuine release before it can
  // take off again. ⛔ Unconditional — in Classic updateJump() never runs, so
  // the field is written and never read, which costs nothing and keeps this
  // function free of a mode branch.
  state.jump.latched = true;

  // ⛔ THE STOP (GDD 4.4). Its menu is CS008 P5's (23-main.js). ⛔ The run's
  // record is NOT taken here but in frame(), after the steps (CS011 P3): a clear
  // on this step still pays after this returns. All this writes is the screen,
  // which stops stepping the gameplay systems, in Game.update(). The freeze below still runs — the
  // last death of a run reads exactly like the others.
  if (state.lives <= 0) {
    state.lives = 0;
    state.screen = "gameover";
    sfx("gameOver");
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
// ⛔ THE SOUNDS FOLLOW THE SAME COUNT (CS009 P5): `purge` on use 1, `purgeWeak`
// on use 2 — GDD 4.3's "distinctly feeble", so the downgrade is felt — played
// on the press whether or not a victim remains, and nothing on use 3+. Every
// victim of either use also makes its kill sound, like any kill site.
//
// ⛔ BOTH USES SCORE NORMAL POINTS (GDD 7; Paul, P2s) — each victim's
// `points()`, through addScore(). C.PURGE_SAVED_BONUS reads state.purgeUses ===
// 0 at the clear edge (12-scoring.js); that is why this is a count and not the
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
    sfx("purge");
    for (let i = 0; i < state.enemies.length; i++) {
      const e = state.enemies[i];
      if (!e.dead && e.purgeable) { e.dead = true; state.tally.kills++; addScore(e.points() * comboMult()); comboKill(state); dropToken(state, e); sfx("kill", e.sfxVoice); }
    }
    return;
  }

  if (state.purgeUses === 2) {
    sfx("purgeWeak");
    const victim = purgeTarget(state);
    // A second use with nothing left to kill is still SPENT. The charge is
    // consumed by the press, not by the result — otherwise a player could bank
    // the weak use by firing it into an empty well.
    // ⛔ `kills` is "the player destroyed it", by shot or by Purge, so both
    // branches of the panic button count here (02-state.js's `tally`).
    if (victim) { victim.dead = true; state.tally.kills++; addScore(victim.points() * comboMult()); comboKill(state); dropToken(state, victim); sfx("kill", victim.sfxVoice); }
  }
  // Third and later: nothing. The counter keeps rising so a HUD (CS008) can
  // tell "spent" from "spent twice" without a second field.
}

// ---------------------------------------------------------------------------
// The jump strike (GDD 14.2, 14.6, 7; CS013 P3, W4) — the FOURTH kill site
// ---------------------------------------------------------------------------
//
// ⛔ AN AIRBORNE CRAFT IN AN ALOFT ENTITY'S LANE KILLS IT. That is the whole
// function, and it is what makes the Jump OFFENSIVE as well as defensive
// (GDD 14.6): the Warden is killable only by a jump, because no shot, no rim
// sweep and no Purge can reach something above the well.
//
// ⛔ A LANE MATCH ON TWO FLAGS, AND NOT A COMPARISON OF TWO DEPTHS. Airborne is
// a PHASE on state.jump (05-skimmer.js) and aloft is a PHASE on the entity
// (07-enemies.js) — neither side has a number for how far off the rim it is, so
// the build still has exactly ONE two-depth comparison and it is the dive
// strike's (GDD 4.5 item 5, 11-dive.js). Giving the craft a depth to make this
// "honest" would be inventing a quantity to compare against a second one that
// does not exist either.
//
// ⛔ IT IS THE FOURTH KILL SITE AND THE FIFTH KILL LINE (GDD 7), and the line is
// the other four's rule verbatim: tally.kills, e.points() at the multiplier in
// force, comboKill(), T2's drop roll, and sfx("kill", e.sfxVoice) off the
// entity's own voice. GDD 7's "three kill sites, and no fourth" is corrected by
// it, in that section and in CLAUDE.md.
//
// ⛔ `continue`, NEVER `return` — the rim sweep's rule (above), for the rim
// sweep's reason: rotating airborne sweeps the craft through lanes, so one jump
// may take two Wardens and both are asked. Nothing here is spliced; the dead
// are removed by Game.update()'s end-of-frame filter.
//
// ⛔ NO INVULNERABILITY GUARD, exactly as the rim sweep has none: invulnerability
// suspends dying, not playing. And no `killDepth` term — this pass is not about
// what the entity does to the craft.
//
// It runs THIRD, after collideSkimmer(), and the two are mutually exclusive by
// construction: that pass returns at once while airborne and this one returns
// at once while grounded.
function jumpStrike(state, well) {
  const sk = state.skimmer;
  if (!sk || sk.dead) return;
  if (!jumpAirborne(state)) return;

  for (let i = 0; i < state.enemies.length; i++) {
    const e = state.enemies[i];
    if (e.dead || !e.aloft) continue;
    if (!laneHit(well, e.lane, sk.lane)) continue;
    e.dead = true;
    state.tally.kills++;
    addScore(e.points() * comboMult()); comboKill(state); dropToken(state, e); sfx("kill", e.sfxVoice);
  }
}

// The whole pass, in its fixed order. Called once per simulation step from
// Game.update().
//
// ⛔ THE JUMP STRIKE RUNS THIRD (CS013 P3, W4). Shots resolve first, then
// contact — which is skipped entirely while airborne — and then the one thing
// an airborne craft can do to the board.
function updateCollisions(state, well) {
  collideShots(state, well);
  collideSkimmer(state, well);
  jumpStrike(state, well);
}
