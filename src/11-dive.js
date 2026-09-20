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
//
// ⛔ AND SINCE CS014 P1 THIS FILE ALSO OWNS THE RING FLIGHT (GDD 14.5; RF1-RF4,
// RF6, RF9), which is OVERDRIVE'S DIVE AND NOT A SECOND ONE. There is one
// module, one beat, one strike and one termination guarantee; what the mode
// flag decides is how long the beat runs and whether there is anything in it
// to fly through. ⛔ modeHas("rings") is the whole gate and `rings: false` in
// C.MODE_FLAGS' Overdrive row is the whole cut (00-config.js).
//
// ⛔ CLASSIC IS A TOTAL NO-OP. Nothing is laid, nothing is taken, no draw is
// spent and the dive is C.DIVE_TIME long — asserted as a step-by-step hash
// against a build with layRings() and takeRings() stubbed out, the Jump's and
// the token's proof (test-cs014-p1.js).
//
// ⛔ AND IT STILL SPENDS NO RNG. The ring lattice is a function of the WELL and
// of constants — never a draw, and (R6) never the level or heat either.

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
  // ⛔ EMPTIED HERE, WHICH IS WHY THE SET NEEDS NO SECOND RESET CALLER (RF1).
  // enterWell() already calls this function, so a new run, the next level, the
  // restart and the `w` debug cycler are all covered without any of them
  // knowing a ring exists. Length, not a fresh array: the bag's identity is
  // stable and nothing allocates on a path a well change takes.
  d.rings.length = 0;
}

// ---------------------------------------------------------------------------
// HOW LONG A DIVE IS (GDD 5, 14.5; RF9) — ⛔ THE WHOLE DIVE, GRACE INCLUDED
// ---------------------------------------------------------------------------
//
// ⛔ C.DIVE_TIME_OD IS READ EXACTLY AS C.DIVE_TIME IS, and that is the rule
// rather than a coincidence: C.DIVE_GRACE is a slice off the FRONT of whichever
// one is in force, so there is one place the beats are derived and retuning
// either length moves them together. The descent is 2.25 s in Classic and
// 3.65 s under the flag.
//
// ⛔ GATED ON modeHas("rings") AND NOT ON state.mode (RF6). The cut has to take
// the length with it: with `rings: false` in the Overdrive row an Overdrive
// dive is C.DIVE_TIME long again, which is exactly the behaviour four closed
// soak files assert today. A test on state.mode would leave a 4 s dive with
// nothing in it.
//
// ⛔ THIS IS C.DIVE_TIME_OD's FIRST AND ONLY READER (plan §11).
function diveTime() {
  return modeHas("rings") ? C.DIVE_TIME_OD : C.DIVE_TIME;
}

// ---------------------------------------------------------------------------
// ⛔ THE RING SET'S ONE WAY IN (GDD 14.5; RF1, RF2, RF3)
// ---------------------------------------------------------------------------
//
// Called by startDive() and by nothing else, so "a ring exists only inside a
// dive, only in a mode that has them" is structural rather than checked.
//
// ⛔ A REPEATED DIVE RE-LAYS THE SET, AND THAT IS RF3's ANSWER. A dive that
// ends in a strike restarts through startDive(), so the rings come back and can
// be earned again — GDD 5's "it repeats the dive, not the well", and
// sfx("dive")'s own rule two lines below. MEASURED at the plan (§1.3): a dive
// death is 7 in 132,956 steps, so re-earning is worth about one set per 19,000
// steps rather than an exploit.
//
// ⛔ THE DEPTHS ARE THE MIDPOINTS OF C.DIVE_RINGS_MAX EQUAL SLICES, laid in
// CROSSING order — rim first, 0.9167 down to 0.0833 at six. Every one is
// strictly below 1, so the grace beat (where d.depth holds at 1) can never
// resolve one and takeRings() needs no phase guard. That is arithmetic, not
// luck: (n - i - 0.5) / n < 1 for every i >= 0.
//
// ⛔ THE LANE WALK GOES THROUGH laneHop(), THE BUILD'S ONE WALL HELPER (GDD
// 3.5). It wraps on a closed well and MIRROR-FOLDS on an open one, and the
// `dir` it returns is written back exactly as every hopper in the roster writes
// it back — a walk that kept a stale direction would grind on the wall. ⚠ A
// fold turns the walk around, so two rings near a wall can sit close together;
// that is the fold behaving, not the lattice failing.
//
// ⛔ A FUNCTION OF THE WELL AND OF CONSTANTS, AND OF NOTHING ELSE: no draw (R3),
// no level and no heat (R6), and not the craft's lane — a set measured from
// where the player happens to be standing would make its first ring free on
// every dive.
//
// ⛔ THIS IS C.DIVE_RINGS_MAX's FIRST AND ONLY READER (plan §11).
function layRings(state, well) {
  if (!modeHas("rings", state.mode)) return;
  const rings = state.dive.rings;
  const n = C.DIVE_RINGS_MAX;
  const step = C.RING_LANE_STEP * well.lanes;
  let lane = 0, dir = 1;
  for (let i = 0; i < n; i++) {
    rings.push({ lane: lane, depth: (n - i - 0.5) / n, taken: null });
    const hop = laneHop(well, lane, step, dir);
    lane = hop.lane;
    dir = hop.dir;
  }
}

// ---------------------------------------------------------------------------
// THE TAKE PASS (GDD 14.5, 7; RF2, RF4) — ⛔ AND IT IS NOT A COLLISION
// ---------------------------------------------------------------------------
//
// 09-collision.js does not run during a dive at all, so this is not a fifth
// entry to it and there is no new kill site and no new kill line: the build
// still has FOUR sites and FIVE lines, all of them there (GDD 7).
//
// ⛔ A LANE MATCH INSIDE A DEPTH CROSSING, AND NEITHER IDEA IS NEW. The lane
// test is laneDelta() against C.RING_ARC_LANES — the same lane-distance
// function laneHit() reads against C.HIT_LANE_TOL, with the arc's own
// half-width in place of the contact tolerance, so a Ring's seam is a
// neighbourhood here too. ⛔ There is no second idea of lane-sameness and no
// second control model: the rim axis is still the only one, snap assist
// included (GDD 1.1 P1, and RF2's whole argument).
//
// ⛔ AND IT IS NOT A SECOND TWO-DEPTH COMPARISON (test-cs013-p3.js). `d.depth
// <= r.depth` compares two POSITIONS, which is ordinary arithmetic. The build's
// one two-depth comparison of the OTHER kind is the strike's, where a position
// is compared against a LENGTH — that is what GDD 6.5's `anchored` field
// records and what makes the strike singular.
//
// ⛔ EACH RING IS RESOLVED ONCE, AT THE STEP THE DESCENT REACHES IT, AND THAT
// IS "YOU STOP EARNING" (plan §8). `taken` goes null -> true or null -> false
// and never moves again, so a ring the craft was not inside is MISSED rather
// than still available lower down. A miss is the ABSENCE of a call: no penalty,
// no counter, no streak, and no bonus for a full set.
//
// ⛔ RF4's PAYOUT IS THE BOUNTY'S ROW, NOT AN ENTITY PRICE: addScore() with an
// unmultiplied literal, and nothing else. ⛔ NO comboKill(), NO dropToken(), NO
// tally.kills and NO sfx("kill") — a ring is not a kill and a Dive is not a
// kill site, so what GDD 7 says is multiplied and what builds the combo are
// both untouched (O4's rule working, not an exception to it). ⛔ addScore() is
// unchanged and stays the ONE writer and the ONE life-awarder, so a ring can
// cross an extra-life milestone and that is addScore() doing its job.
//
// ⛔ A DEAD CRAFT RESOLVES NOTHING, diveStrike()'s guard verbatim. The freeze is
// running; the next live step respawns, restarts the dive and re-lays the set.
function takeRings(state, well) {
  const sk = state.skimmer;
  if (!sk || sk.dead) return;
  const rings = state.dive.rings;
  for (let i = 0; i < rings.length; i++) {
    const r = rings[i];
    if (r.taken !== null) continue;
    if (state.dive.depth > r.depth) continue;
    r.taken = Math.abs(laneDelta(well, r.lane, sk.lane)) <= C.RING_ARC_LANES;
    if (r.taken) addScore(C.RING_POINTS);
  }
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
  // ⛔ A JUMP IN FLIGHT LANDS ON THE CLEAR STEP (GDD 14.2; CS012 P5, R4). The
  // dive short-circuits the gameplay pass, so an airborne craft carried into
  // one would hold its immunity, its lift and its music high-pass for the whole
  // descent with no way to come down. Beside the shot clear for the same
  // reason: what belongs to the well being left does not cross the throat.
  // ⛔ THE DIVE THEREFORE ALWAYS STARTS GROUNDED, in either mode.
  resetJump(state);
  // ⛔ AND THE TOKENS END WITH THE WELL (GDD 14.1; CS013 T5; 10-powerups.js):
  // no token rises through a Dive, and no Lance, Spread or Ward crosses the
  // throat — so a Ward can never absorb this module's strike. Beside the jump
  // and the shots, for their reason.
  resetTokens(state);
  // ⛔ AND OVERDRIVE'S RING SET IS LAID (GDD 14.5; CS014 RF1, RF3) — layRings()
  // is its ONE way in, and it is a no-op outside modeHas("rings"). ⛔ BELOW the
  // filter and the three resets, deliberately: everything above belongs to the
  // well being LEFT, and the set belongs to the flight about to start.
  // ⛔ The well is read the way Game.update() and Game.draw() read it, off
  // state.wellIndex — the OUTGOING well, because nextWell() runs at the dive's
  // END. Taking it as a parameter would change a signature four closed files
  // call by name.
  layRings(state, WELLS[state.wellIndex]);
  // GDD 5's rising sweep. HERE, so a repeated dive plays it again (plan §7).
  sfx("dive");
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
  // ⛔ TELEMETRY ONLY (02-state.js's `tally`), and behind the same `sk.dead`
  // the return value is read off: an invulnerable diver passes through the
  // Thorn, and a strike that killed nobody is not a death. GDD 4.5 item 5.
  if (sk.dead) { state.tally.thornDeaths++; sfx("diveStrike"); }
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
    // ⛔ NO addScore() AND NO `tally.kills`, and that is a decision (plan §0,
    // CS008 P2): the termination guarantee destroying a Thorn is not the player
    // destroying it. The build's four kill sites are all in 09-collision.js.
    // ⛔ AND NO KILL SOUND (CS009 P5), for the same reason: diveStrike's sound
    // already covers the moment.
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
  // the build). diveTime() is the total — C.DIVE_TIME, or C.DIVE_TIME_OD under
  // modeHas("rings") — and C.DIVE_GRACE is a slice off its front, so the
  // descent is that total minus the grace and retuning either moves the beats
  // together. ⛔ Read ONCE per step, into `total`, so the beat and the
  // completion check below cannot disagree about which dive this is.
  d.timer += dt;

  const total = diveTime();
  if (d.timer < C.DIVE_GRACE) {
    d.phase = "grace";
    d.depth = 1;
  } else {
    d.phase = "descent";
    const span = total - C.DIVE_GRACE;
    const t = span > 0 ? (d.timer - C.DIVE_GRACE) / span : 1;
    d.depth = t >= 1 ? 0 : 1 - t;
  }

  // ⛔ OVERDRIVE'S RING FLIGHT, ABOVE THE STRIKE TEST AND ABOVE THE COMPLETION
  // CHECK, FOR THE STRIKE'S OWN REASON (CS014 RF2). The last step of a descent
  // is at depth 0, which is at or past every ring's depth — so a take pass
  // below the completion check would never resolve the deepest ring, and one
  // below the strike would silently unpay a diver who crossed a ring on the
  // step a Thorn killed them. A no-op on an empty set, which is every Classic
  // step and every grace step.
  takeRings(state, well);

  // GDD 4.5 item 5. ⛔ Descent only — the grace beat is the input opportunity a
  // full-length Thorn would otherwise never give (00-config.js at DIVE_GRACE).
  if (d.phase === "descent" && diveStrike(state, well)) return;

  // ⛔ The dive's state is put back by nextWell() -> enterWell() -> resetDive(),
  // the one path, rather than by a second write here. On the last life
  // killSkimmer() has already set screen = "gameover" and Game.update() returns
  // above this on every later step, so a dive death that ends a run stops the
  // dive too and the frozen board stays on screen.
  // ⛔ TELEMETRY ONLY (02-state.js's `tally`), and ⚠ it is `divesCompleted`
  // rather than "divesSurvived": a diver who loses a life to a Thorn respawns
  // and finishes the dive, so this counts dives that REACHED C.DIVE_TIME. The
  // lives lost inside them are `thornDeaths`, beside it.
  if (d.timer >= total) { state.tally.divesCompleted++; nextWell(); }
}
