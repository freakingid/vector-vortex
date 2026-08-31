// 11-dive.js — the Dive (GDD 5, 4.5 item 5, 2, 16.3). The beat between wells,
// and the last of GDD 4.5's five death conditions.
//
//   wellCleared()  ->  startDive()  ->  [ GRACE ]  ->  [ DESCENT ]  ->  nextWell()
//                                           |              |
//                                      rotate only    rotate; Thorn strike live
//
// ⛔ IT REPLACED CS003 P2's ONE-SECOND BETWEEN-WELLS HOLD, IT DOES NOT SIT
// BESIDE IT. That hold was this module's placeholder, and all three parts of it
// are deleted: its constant in 00-config.js, its field on `state`, and the
// branch at the foot of Game.update() that read them. ⛔ Neither name survives
// anywhere in the built file, and test-cs006-p3.js asserts that — a placeholder
// that outlives its replacement is what this file exists to prevent.
//
// ⛔ AND IT DOES NOT SIT WHERE THE HOLD SAT. The hold was a branch at the BOTTOM
// of update() that the whole gameplay pass fell through every step. The Dive
// SHORT-CIRCUITS: while state.dive.active there is no spawner, no enemy pass,
// no Purge, no collision pass and no well-clear check. Two edits in 23-main.js,
// not one — the branch near the top, and startDive() at the foot where the hold
// used to advance the level.
//
// ⛔ THE DIVE READS THE OUTGOING WELL. enterWell() clears state.enemies and
// mints a craft for the NEW well's lane count, so the dive has to run BEFORE
// it: nextWell() is called at the dive's END. A dive that ran after enterWell()
// would thread an empty new well and be a 2.6 s pause with a doppler on it.
//
// ⛔ IT SPENDS NO RNG. Nothing here calls state.rng() — not the strike, not the
// respawn-lane search, not the repeat. The run's ONE stream (01-rng.js) is
// untouched by a dive, which is what lets the two draws nextWell() spends past
// level 99 stay the only draws a well transition costs.
//
// ⛔ NO RENDERING. GDD 5's camera widen and doppler are presentation and are not
// this changeset's; the Dive is simulation only, and update() never touches the
// canvas (23-main.js).

// ---------------------------------------------------------------------------
// The beat fields, in one place
// ---------------------------------------------------------------------------
//
// ⛔ THE ONE WRITER OF state.dive OUTSIDE updateDive(). enterWell() calls it
// where CS003 P2's one-line hold reset used to sit, which is what makes the
// end of a dive and the `w` debug cycler agree without either knowing about the
// other: nextWell() -> enterWell() -> here.
function resetDive(state) {
  const d = state.dive;
  d.active = false;
  d.phase = "grace";
  d.timer = 0;
  d.depth = 1;
}

// ---------------------------------------------------------------------------
// Starting a dive — and ⛔ THE FILTER, which is the trap in this feature
// ---------------------------------------------------------------------------
//
// ⛔ THE DIVE IS NOT THORNS-ONLY. It is tempting to reason that a well is
// cleared before a dive, so the only thing left standing is Thorns. It is not:
// WeaverBolt ships `blocksClear = false` deliberately and with a comment
// (07-enemies.js — "a bolt in flight must not hold a cleared well open"), so
// wellCleared() returns true with a bolt travelling, and that bolt carries
// killDepth = 1 - C.RIM_CONTACT_DEPTH and is climbing toward the rim the player
// is about to leave.
//
// ⛔ SO THE BOARD IS FILTERED DOWN TO `anchored` ENTITIES, READ OFF THE CONTRACT
// FIELD AND NEVER A CLASS NAME (GDD 6.5). Today `anchored` is exactly the
// Thorn, and the rule generalises correctly rather than by coincidence:
// `anchored` means "`depth` is a LENGTH", and the Dive's hazard IS the lane
// extent. What survives a dive and what threatens it are one set, not two.
//
// ⛔ GDD 5's ⚠ SETTLED "in-flight shots are cleared at dive start" is the
// player's half of the same rule and is unchanged — a Thorn you were about to
// destroy is still there, deliberately, and the lesson is "clear thorns before
// the last enemy". Do not soften it.
//
// ⛔ `!e.dead` IS LOAD-BEARING ON THE REPEAT PATH, not belt and braces. A dive
// that ends in a strike restarts through here, and on a fully-thorned well the
// struck Thorn was killed by diveRespawn() one line earlier — without the
// deadness test it would survive the filter and be struck again forever, which
// is the exact loop the termination guarantee exists to close.
function startDive(state) {
  resetDive(state);
  state.dive.active = true;
  state.shots = [];
  state.enemies = state.enemies.filter(e => e.anchored && !e.dead);
}

// ---------------------------------------------------------------------------
// The strike (GDD 4.5 item 5) — ⛔ AND IT IS NOT A killDepth
// ---------------------------------------------------------------------------
//
// The Thorn's killDepth stays null forever. The two quantities are different
// kinds of number and the whole point of the `anchored` field is saying which:
//
//   an anchored entity's `depth`  a LENGTH — the extent [0, depth] rooted at
//                                 the throat
//   dive.depth                    a POSITION, running 1 -> 0
//
// So the strike is `dive.depth <= e.depth`, ⛔ THE ONLY TWO-DEPTH COMPARISON IN
// THE BUILD, which is why it lives here and not in the one collision pass
// (09-collision.js), whose header's "there is no term here for where the
// Skimmer is" has to stay literally true.
//
// A long Thorn is struck early in the descent and a short one late — thorn
// length IS the hazard, exactly as GDD 8 intends when it makes Weaver thorn
// length a difficulty axis. And because every extent is rooted at the throat,
// reaching depth 0 in a thorned lane is always a strike: "thread between the
// Thorns" means "be in a lane that has none", which is also why snap assist
// stays live (see updateDive).
//
// ⛔ laneHit(), the same lane-sameness the rest of the build uses — half a lane
// either side, via laneDelta so a Ring's seam is a neighbourhood and not a
// fifteen-lane gap (09-collision.js). There is no second idea of sameness here.
function diveHazard(state, well, lane, depth) {
  for (let i = 0; i < state.enemies.length; i++) {
    const e = state.enemies[i];
    if (e.dead || !e.anchored) continue;
    if (depth > e.depth) continue;               // above the tip: clear
    if (!laneHit(well, e.lane, lane)) continue;
    return e;
  }
  return null;
}

// Would a diver in `lane` be struck at some point in the descent? Any live
// anchored entity in the lane will do it: the extent is rooted at the throat,
// so depth 0 is inside every one of them. ⛔ Hence depth 0 here rather than a
// length threshold — a "short enough to survive" Thorn does not exist.
function diveLaneBlocked(state, well, lane) {
  return diveHazard(state, well, lane, 0) !== null;
}

// One strike test. Returns whether the craft actually died.
//
// ⛔ IT ROUTES THROUGH killSkimmer() LIKE EVERY OTHER DEATH CONDITION
// (09-collision.js), so item 5 inherits the invulnerability guard, the life,
// the purge re-latch, the freeze and the game-over stop without writing any of
// them. ⛔ And the return value is read off `sk.dead` rather than assumed:
// killSkimmer() declines while state.invulnTime is inside C.RESPAWN_INVULN, and
// an invulnerable diver must pass through the Thorn rather than destroy it for
// free — the repeat below is not a consolation prize.
function diveStrike(state, well) {
  const sk = state.skimmer;
  if (!sk || sk.dead) return false;
  if (!diveHazard(state, well, sk.lane, state.dive.depth)) return false;
  killSkimmer(state);
  return sk.dead;
}

// ---------------------------------------------------------------------------
// ⛔ THE DEATH LOOP GUARD. The naive respawn does not terminate.
// ---------------------------------------------------------------------------
//
// Work it through with nothing but the shipped rules: strike -> killSkimmer() ->
// hit-stop -> respawnSkimmer() puts the craft back in the lane it died in
// (GDD 4.4) -> the Thorn is still there, CORRECTLY, because the rim-push clamp
// skips `anchored` entities -> the dive repeats -> the strike is true again the
// instant C.RESPAWN_INVULN expires. A full-length Thorn burns a life every
// 1.5 s until the run ends.
//
// ⛔ THE GUARD IS THE LANE. A dive respawn lands in the nearest Thorn-free lane,
// chosen deterministically: lowest |laneDelta| from the lane it died in, ties
// toward INCREASING lane. Written as an outward walk (+1, -1, +2, -2, ...)
// rather than a scan with a comparator, because the walk IS the tie-break and
// there is nothing left to get wrong.
//
// ⛔ NO RNG. The run has ONE stream (01-rng.js) and a dive spends none of it; a
// draw here would make the well transition's cost depend on the board.
//
// ⛔ laneDelta's topology is inside laneWrap/the range test, not here: on a
// closed well the walk wraps, on an open one it skips candidates the well does
// not have rather than clamping them (which would visit the end lane twice and
// silently prefer it).
function diveRespawnLane(state, well, diedLane) {
  const n = well.lanes;
  const base = laneNormalize(well, Math.round(diedLane));
  for (let step = 0; step <= n; step++) {
    for (let s = 0; s < (step === 0 ? 1 : 2); s++) {
      const raw = base + (s === 0 ? step : -step);
      if (!well.closed && (raw < 0 || raw > n - 1)) continue;
      const lane = laneWrap(well, raw);
      if (!diveLaneBlocked(state, well, lane)) return lane;
    }
  }
  return null;
}

// The first LIVE step after a dive death — the same trigger as the gameplay
// pass's (23-main.js): the step that finds `skimmer.dead` IS the respawn step,
// never a timer started at death, which would not have advanced through the
// freeze.
//
// ⛔ AND IF EVERY LANE HOLDS A THORN, THE STRUCK THORN DIES INSTEAD. That is the
// termination guarantee, and it is ⛔ THE ONLY PATH IN THE BUILD BY WHICH A
// THORN IS DESTROYED BY SOMETHING OTHER THAN A SHOT (07-enemies.js says so at
// the class). Killing it frees the died lane, so the walk above finds it at
// step 0 on the repeat and the dive cannot cycle: every pass either lands
// somewhere safe or removes one Thorn, and there are finitely many.
//
// ⛔ Through respawnSkimmer(), the one respawn path, handed the lane rather
// than forking it: the rim push, the invulnerability arming and the ⚠ SETTLED
// anchored skip are all its and none of them are rewritten here. The push is a
// no-op on a dive board — every survivor is anchored — and that is a
// consequence of the filter, not a second rule.
//
// ⛔ The dive then repeats FROM THE GRACE BEAT and state.level does NOT advance:
// GDD 5, "repeats the dive, not the well."
function diveRespawn(state, well) {
  const diedLane = state.skimmer.lane;
  let lane = diveRespawnLane(state, well, diedLane);

  if (lane === null) {
    // ⛔ THE LANE IS RESOLVED FIRST AND THE HAZARD IS LOOKED UP AT IT. The craft
    // dies on a CONTINUOUS lane and comes back on a lane CENTRE, and at
    // C.HIT_LANE_TOL 0.5 a craft sitting exactly on a boundary matches the
    // Thorns in both neighbouring lanes — so killing "the one in the lane it
    // died on" could destroy a Thorn that was not blocking the lane it lands
    // in, and the repeat would strike again with nothing freed. Asking at the
    // landing lane makes the entity destroyed provably the one in the way.
    lane = laneNormalize(well, Math.round(diedLane));
    const struck = diveHazard(state, well, lane, 0);
    if (struck) struck.dead = true;
  }

  respawnSkimmer(state, well, lane);
  startDive(state);
}

// ---------------------------------------------------------------------------
// One simulation step of a dive. ⛔ THE WHOLE GAMEPLAY PASS IS SHORT-CIRCUITED.
// ---------------------------------------------------------------------------
//
// Called from Game.update() below the game-over stop and above everything else,
// which returns immediately after. What that leaves running is exactly the list
// GDD 5 describes and nothing more: the respawn aftermath, the invulnerability
// clock, the craft's own rotation, the beat, and the strike.
//
// ⛔ SNAP ASSIST STAYS LIVE, and it is not an oversight. C.HIT_LANE_TOL is 0.5,
// so safety is lane-GRANULAR — "thread between the Thorns" means "be in a lane
// that has none" — and snapping to a lane centre is what makes that
// unambiguous. Snapping is aligned with the hazard rather than against it. This
// is pillar P1 and it does not get suspended for a set piece.
//
// ⛔ THE STRIKE IS TESTED BEFORE THE COMPLETION CHECK. The last step of a
// descent is at depth 0, which is inside every extent rooted at the throat, so
// testing completion first would let a player who never left a thorned lane
// walk out of it on the final step.
function updateDive(state, well, dt) {
  const d = state.dive;

  // ⛔ The death aftermath first, exactly as the gameplay pass does it, and the
  // invulnerability clock is the ELSE branch so the respawn step is not also
  // aged. Falling through afterwards is deliberate: diveRespawn() has just
  // restarted the dive at timer 0, and the step it lands on is a grace step,
  // where there is no strike test to be caught by.
  if (state.skimmer.dead) diveRespawn(state, well);
  else if (state.invulnTime < C.RESPAWN_INVULN) state.invulnTime += dt;

  state.skimmer.update(dt, well, state.input);

  // ⛔ COUNTS UP, through the WHOLE dive (GDD 16.3 — no countdown anywhere in
  // the build). C.DIVE_TIME is the total and C.DIVE_GRACE is a slice off its
  // front, so the descent is DIVE_TIME - DIVE_GRACE and retuning either one
  // moves the beats together.
  d.timer += dt;

  if (d.timer < C.DIVE_GRACE) {
    d.phase = "grace";
    d.depth = 1;
  } else {
    d.phase = "descent";
    const span = C.DIVE_TIME - C.DIVE_GRACE;
    const t = span > 0 ? (d.timer - C.DIVE_GRACE) / span : 1;
    d.depth = t >= 1 ? 0 : 1 - t;
  }

  // GDD 4.5 item 5. ⛔ Descent only — the grace beat is the input opportunity a
  // full-length Thorn would otherwise never give (00-config.js at DIVE_GRACE).
  if (d.phase === "descent" && diveStrike(state, well)) return;

  // ⛔ The dive's state is put back by nextWell() -> enterWell() -> resetDive(),
  // the one path, rather than by a second write here. On the last life
  // killSkimmer() has already set screen = "gameover" and Game.update() returns
  // above this on every later step, so a dive death that ends a run stops the
  // dive too and the frozen board stays on screen.
  if (d.timer >= C.DIVE_TIME) nextWell();
}
