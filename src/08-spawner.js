// 08-spawner.js — what releases enemies into a well, and what decides the well
// is finished (GDD 2, 6.3, 6.5, 12, 16.3).
//
// ⛔ ONE ENTRY POINT: spawnEnemy(kind, lane, depth). Every enemy that enters
// state.enemies comes through it — the interval spawner below, and CS004's
// Carrier split, which is not a spawn the player can predict but is still an
// enemy appearing in a lane. That is the whole reason this is a function
// rather than three call sites doing `state.enemies.push(new Vaulter(...))`:
// GDD 6.3's safe-spawn rule and C.ENEMY_CAP are enforced in ONE place, so a
// later enemy inherits them instead of re-implementing them (and forgetting).
//
// ⛔ EVERY DRAW COMES FROM state.rng (01-rng.js). Nothing here reaches for the
// platform generator — GDD 17.1's replay guarantee is the reason, and the
// suite scans the built file for it.
//
// ⛔ The two numbers live in state.spawn (02-state.js): `timer` counts UP
// toward spawnInterval(), `remaining` is a count spent downward. Neither is a
// countdown clock (GDD 16.3).

// The kind table. ⛔ A spawn names a kind as a STRING and this table is the one
// place a string becomes a class — CS004's Carrier split asks for "vaulter" by
// name and gets whatever this row says, so the roster grows here and nowhere
// else. `dir` is the initial heading, drawn from the run's stream by the
// caller and handed in, so an enemy that has no use for one simply ignores it.
const ENEMY_KINDS = {
  vaulter: (lane, depth, dir) => new Vaulter(lane, depth, dir),
  // ⛔ ONE ROW PER CARRIER VARIANT, not one row for "a Carrier". The cargo is
  // half of what the entity IS (GDD 6.2 — reading the glyph is the skill), so
  // it belongs in the string, exactly as the class it becomes belongs in this
  // table. `dir` is ignored by all three: a Carrier never hops, and the draw
  // for it is still spent (see spawnEnemy below).
  //
  // ⛔ THREE ROWS, ONE CLASS, NO BRANCH. The cargo is a CARGO key handed to the
  // same constructor — Carrier.onShot() and splitLanes() serve all three rows
  // and neither takes a cargo. CS005 P4 completed GDD 6.2's table by adding the
  // two rows below and nothing else; a fourth cargo is the same three lines
  // (a CARGO entry, a row here, a glyph) in three files.
  carrierVaulter: (lane, depth) => new Carrier(lane, depth, "vaulter"),
  carrierDrifter: (lane, depth) => new Carrier(lane, depth, "drifter"),
  carrierSurger:  (lane, depth) => new Carrier(lane, depth, "surger"),
  // `dir` is ignored by both of these too: a Weaver never hops and a bolt
  // travels the lane it was fired in. The draw is still spent — see spawnEnemy.
  weaver: (lane, depth) => new Weaver(lane, depth),
  // ⛔ A ROW FOR THE PROJECTILE, because the projectile is an enemy in the one
  // array like everything else (GDD 6.5). Weaver.fire() asks for it by name, so
  // the bolt inherits C.ENEMY_CAP and GDD 6.3's safe-spawn rule for free —
  // exactly as the Carrier's split does. ⚠ It is NOT a GDD 6.1 roster row, so
  // it is not counted among the enemies in scratchpad/test-registry.js.
  weaverBolt: (lane, depth) => new WeaverBolt(lane, depth),
  // ⛔ A ROW FOR THE THORN, and `depth` here is the only place in this table
  // where that argument is not a POSITION: a Thorn's depth is the TIP OF AN
  // EXTENT rooted at the throat (07-enemies.js's `anchored`). Weaver.layThorn()
  // asks for one at the Weaver's own depth, one climb step above the throat,
  // and grows it from there — which is exactly why GDD 6.3's safe-spawn
  // LOWERING below is harmless on it. ⚠ A caller that asked for a finished
  // full-length Thorn in the Skimmer's lane would not have it lowered, it would
  // have it SHORTENED; nothing does, and nothing should.
  thorn: (lane, depth) => new Thorn(lane, depth),
  // ⛔ THE FIRST ROW THAT ACTUALLY USES `dir`. Every row above either takes one
  // and ignores it or does not name it at all; the Vaulter takes one but a
  // Vaulter that never vaults (level 1, GDD 6.3) never spends it. A Drifter
  // crosses on its FIRST update, so the draw spawnEnemy() spends below is read
  // immediately — which is what makes a replay of a seed put the same Drifter
  // on the same side of the lane it was born in.
  //
  // ⛔ It is handed an integer lane CENTRE like everything else and crosses onto
  // the boundary lattice itself (07-enemies.js). This table stays a function of
  // (lane, depth, dir) and learns nothing about any entity's lattice.
  drifter: (lane, depth, dir) => new Drifter(lane, depth, dir),
  // ⛔ `dir` is ignored — a Surger never hops, and `lane` is written once by its
  // constructor. The draw spawnEnemy() spends below is STILL SPENT: a kind that
  // skipped it would make the run's one stream depend on which kind came out of
  // the throat, and GDD 17.1's replay guarantee is exactly that dependency not
  // existing. The Weaver, the bolt and the Thorn are the same case.
  surger: (lane, depth) => new Surger(lane, depth),
};

// The RELEASE BUDGET — how many THREATS may be alive at once. ⛔ The MIN of the
// two, and they are not the same kind of number: enemyConcurrent() is the
// difficulty knob and it now RISES WITH HEAT (CS007 P2, 00-config.js), while
// C.ENEMY_CAP is a readability ceiling that is never raised for difficulty.
// Reading only one of them is how a retune of the knob quietly walks past the
// ceiling. ⛔ MEASURED: the shipped ladder tops out at 8, so the cap is never
// approached and the min() is belt and braces rather than a live clamp.
function spawnLimit() {
  return Math.min(enemyConcurrent(), C.ENEMY_CAP);
}

// How many things on the board are THREATS — GDD 6.5's `blocksClear`, read off
// the entity and never off a class name, exactly as wellCleared() reads it.
//
// ⛔ THIS IS WHAT THE RELEASE BUDGET COUNTS, AND IT IS NOT WHAT C.ENEMY_CAP
// COUNTS. Paul's call, 2026-08-31 (DECISIONS.md, "the spawner-stall call"):
// the concurrency budget counts THREATS; the readability ceiling keeps counting
// ENTITIES. Before the split both questions read state.enemies.length, and a
// Thorn — permanent, unshootable-by-accident, and something the player is not
// obliged to remove (GDD 6.1) — therefore held a release slot forever. Three
// standing Thorns at a release budget of 3 shut the spawner: the quota never
// spent, the well never cleared, and nothing threatened the player either.
//
// ⛔ Three follow-ons are settled with it and are NO CHANGE: no Thorn expires
// (GDD 5's lesson — clear thorns before the last enemy — depends on it
// persisting), wellCleared() is untouched, and C.ENEMY_CAP is not raised.
function threatCount(state) {
  let n = 0;
  for (let i = 0; i < state.enemies.length; i++) {
    const e = state.enemies[i];
    if (!e.dead && e.blocksClear) n++;
  }
  return n;
}

// Is `lane` the Skimmer's lane? ⛔ laneDelta, never (a - b): on a Ring, lane 15
// and lane 0 are neighbours (03-wells.js).
//
// The Skimmer's lane is CONTINUOUS — a player parked between two centres is
// half in each — so "its lane" is anything within one lane of it rather than
// Math.round()'s single answer. The wider reading is the safe direction to be
// wrong in: it declines a spawn the player might have been under, and the cost
// of declining is one lane redrawn.
function inSkimmerLane(well, lane, skimmer) {
  if (!skimmer || skimmer.dead) return false;
  return Math.abs(laneDelta(well, lane, skimmer.lane)) < 1;
}

// ⛔ THE ONLY WAY AN ENEMY ENTERS THE WELL. Returns the enemy, or null if the
// spawn was refused. Refusals are not errors — a caller that cares checks the
// return, and the interval spawner below spends no quota on one.
//
// It owns two rules:
//
//   ⛔ GDD 6.3 — never spawn in the Skimmer's lane above C.SAFE_SPAWN_DEPTH.
//      Enforced by LOWERING the depth to the safe line rather than by moving
//      the lane or refusing: a Carrier split has to put its two children
//      somewhere specific (GDD 6.2's "adjacent" / "flanking"), and relocating
//      them sideways would break the shape the player is being taught to read.
//      Dropping one deeper only ever gives the player more time.
//
//   ⛔ C.ENEMY_CAP — the readability ceiling, refused outright. It is not a
//      difficulty knob and this is the one place it is enforced. ⛔ It counts
//      RAW state.enemies.length, Thorns and bolts included, and CS007 P1's
//      threats split did NOT touch it: a Thorn is drawn, so a ceiling on what
//      is legible on screen counts it. threatCount() above is the other half.
function spawnEnemy(kind, lane, depth) {
  const make = ENEMY_KINDS[kind];
  if (!make) return null;
  if (state.enemies.length >= C.ENEMY_CAP) return null;

  const well = WELLS[state.wellIndex];
  const l = laneNormalize(well, lane);
  let d = depth || 0;
  if (d < 0) d = 0;
  if (d > 1) d = 1;
  if (d > C.SAFE_SPAWN_DEPTH && inSkimmerLane(well, l, state.skimmer)) {
    d = C.SAFE_SPAWN_DEPTH;
  }

  // ⛔ The heading comes from the run's ONE stream, so a replay of the seed
  // produces the same well. Drawn here rather than in the caller so every
  // spawn spends exactly one draw on it and the stream stays aligned.
  const dir = state.rng() < 0.5 ? -1 : 1;
  const e = make(l, d, dir);
  state.enemies.push(e);
  return e;
}

// GDD 8.1's INTRODUCTION SCHEDULE, read (CS007 P3). Which kinds the well may
// release at `level` — ⛔ A FUNCTION OF THE LEVEL AND NOTHING ELSE. No board
// state, no heat, no draw: GDD 1.1 P3 is "escalation you can name", and a set
// that depended on what happened to be on screen is not nameable.
//
// ⛔ THE SCHEDULE ITSELF IS DATA IN C (C.SPAWN_SCHEDULE, 00-config.js), where
// the reasoning lives — the cumulative rule, why `thorn` and `weaverBolt` are
// absent, why there is no cargo weight table, and which two of GDD 8.1's rows
// were already true before CS007. This function is the whole of the mechanism:
// the rows at or below the level, in schedule order.
//
// ⛔ IT IS THE SET THAT GROWS, NOT THE MIX THAT SHIFTS. The three Carrier
// variants are three separate rows, so GDD 8's "cargo weights shift toward
// Drifter/Surger" falls out of this loop and out of the uniform pick below.
//
// The array is allocated per call and that is deliberate: the one caller is
// pickSpawnKind(), which runs once per interval spawn — of the order of once a
// second, and never in the draw path, which is where GDD 17's no-allocation
// budget applies. Returning a shared array would hand a mutable schedule to
// whatever asked for it.
function eligibleKinds(level) {
  const out = [];
  for (let i = 0; i < C.SPAWN_SCHEDULE.length; i++) {
    const row = C.SPAWN_SCHEDULE[i];
    if (level >= row.level) out.push(row.kind);
  }
  return out;
}

// Which kind the interval spawner releases next. ⛔ ITS NAME, SIGNATURE AND
// NO-DRAW CONTRACT ARE UNCHANGED FROM CS004; only its READER moved, from the
// ⚠ TEMPORARY bench list CS007 P3 deleted to the schedule above. updateSpawner()
// below still asks a function rather than naming a kind, which is why the swap
// touched nothing else in this file.
//
// ⛔ A UNIFORM PICK OVER THE ELIGIBLE SET, AND THERE IS NO WEIGHT TABLE
// (Paul, 2026-08-31 — DECISIONS.md). See C.SPAWN_SCHEDULE for why that is a
// decision: the cargo mix shifts because the SET grows, not because anything
// here weighs it.
//
// ⛔ A ONE-ENTRY SET SPENDS NO DRAW, AND THAT IS NOT AN OPTIMISATION.
// rngPick() on a single-element array still advances the run's ONE stream
// (01-rng.js), and the stream is shared: one extra draw per spawn moves every
// spawn lane in every run, including the 10,000-tick replay GDD 17 item 1
// hashes. The game shipped without this function, so the no-choice case has to
// spend exactly what the old `spawnEnemy("vaulter", ...)` literal did — which
// is nothing. There is no genuine choice to make, so no randomness is spent
// making it. ⛔ Levels 1-2 are that case, and they are the levels every golden
// recording in the suite lives in.
function pickSpawnKind(state) {
  const kinds = eligibleKinds(state.level);
  if (kinds.length < 2) return kinds[0];
  return rngPick(state.rng, kinds);
}

// A lane for the next interval spawn. Draws from state.rng and redraws up to
// C.SPAWN_LANE_TRIES times to avoid stacking a new enemy on one that is still
// in the throat zone — two silhouettes at the same lane and nearly the same
// depth read as one, which is GDD 1.1 P2 ("legible before lethal") failing at
// the moment the player has the most time to react.
//
// ⛔ BOUNDED, and it settles for the last draw rather than looping until it is
// happy. An unbounded search spends a board-dependent number of draws, and the
// run's stream is shared: the next spawn, and everything else that draws,
// would shift depending on what happened to be on screen.
//
// C.READABILITY_DEPTH is "the throat zone" as the build already defines it
// (GDD 10.3) — the band where nothing opaque is drawn because nothing down
// there can be read. Reusing it is deliberate; a second constant for the same
// band would be two numbers to keep in step.
function pickSpawnLane(state, well) {
  let lane = rngInt(state.rng, well.lanes);
  for (let i = 1; i < C.SPAWN_LANE_TRIES && laneCrowded(state, well, lane); i++) {
    lane = rngInt(state.rng, well.lanes);
  }
  return lane;
}

// Is something already sitting in this lane, down in the throat zone?
function laneCrowded(state, well, lane) {
  for (let i = 0; i < state.enemies.length; i++) {
    const e = state.enemies[i];
    if (e.dead) continue;
    if (e.depth > C.READABILITY_DEPTH) continue;
    if (Math.abs(laneDelta(well, lane, e.lane)) < 1) return true;
  }
  return false;
}

// Re-arm for a fresh well. ⛔ enterWell() (23-main.js) is the only caller —
// resetting the spawner without also clearing state.enemies leaves the
// previous well's craft in a well that may have fewer lanes.
function resetSpawner(state) {
  state.spawn.timer = 0;
  state.spawn.remaining = C.SPAWN_QUOTA;
}

// One simulation step of the spawner. Called from Game.update() AFTER the
// enemy pass and its filter, so the alive count it reads is this step's truth
// and not last step's plus whatever died a moment ago.
//
// ⛔ AND THE INTERVAL IS HEAT-DERIVED (CS007 P2) — spawnInterval(), read ONCE
// per call into a local. Reading it twice would be harmless today and would
// stop being harmless the first time anything moved the clock mid-step.
// ⚠ A FALLING INTERVAL AND A HELD TIMER INTERACT, AND IT IS THE INTENDED
// BEHAVIOUR: a timer parked at the old, longer interval is already past the new
// one when the level advances, so the first spawn of a harder well is immediate
// rather than late. That is the same "a freed slot fires at once" rule below,
// arriving from the other side.
//
// ⛔ The timer HOLDS at the interval instead of growing past it. A spawn
// blocked by the concurrency limit therefore fires the instant a slot frees,
// which is what keeps the pressure constant; a timer that reset on a blocked
// beat would make a busy well quieter exactly when it should not be, and one
// that grew without bound would dump the backlog all at once.
//
// ⛔ AND THE BLOCK COUNTS THREATS, NOT ENTITIES (CS007 P1) — threatCount()
// above, against the release budget. A slot is held by something the player
// must remove to finish the well; a Thorn is not, so a Thorn does not hold one.
// The C.ENEMY_CAP refusal inside spawnEnemy() still counts everything, so a
// well full of Thorns stops releasing at the ceiling rather than at the budget.
function updateSpawner(state, well, dt) {
  const sp = state.spawn;
  if (sp.remaining <= 0) return;

  const interval = spawnInterval();
  if (sp.timer < interval) sp.timer += dt;
  if (sp.timer < interval) return;
  if (threatCount(state) >= spawnLimit()) return;

  // Depth 0 is the throat — the far aperture, the only place a well releases
  // an enemy from. GDD 3.2's convention, not a magic number.
  const lane = pickSpawnLane(state, well);
  const e = spawnEnemy(pickSpawnKind(state), lane, 0);
  if (!e) return;              // refused (the cap): the quota is not spent

  sp.timer = 0;
  sp.remaining--;
}

// ⛔ TWO CONDITIONS, NOT ONE (GDD 2). The quota must be spent AND nothing that
// blocks the clear may be left alive. "The array is empty" alone is true one
// tick after startGame() and in every gap between spawns, and a well that
// cleared itself before releasing anything is the bug this exists to prevent.
//
// `blocksClear` is read off the entity, never a class name: CS004's Thorn is
// the first false, and that is exactly why a Thorn is still standing in the
// lane during the Dive (GDD 5) rather than being an oversight here.
function wellCleared(state) {
  if (state.spawn.remaining > 0) return false;
  for (let i = 0; i < state.enemies.length; i++) {
    const e = state.enemies[i];
    if (!e.dead && e.blocksClear) return false;
  }
  return true;
}
