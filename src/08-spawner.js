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
// toward C.SPAWN_INTERVAL, `remaining` is a count spent downward. Neither is a
// countdown clock (GDD 16.3).

// The kind table. ⛔ A spawn names a kind as a STRING and this table is the one
// place a string becomes a class — CS004's Carrier split asks for "vaulter" by
// name and gets whatever this row says, so the roster grows here and nowhere
// else. `dir` is the initial heading, drawn from the run's stream by the
// caller and handed in, so an enemy that has no use for one simply ignores it.
const ENEMY_KINDS = {
  vaulter: (lane, depth, dir) => new Vaulter(lane, depth, dir),
};

// How many enemies may be alive at once. ⛔ The MIN of the two, and they are
// not the same kind of number: C.ENEMY_CONCURRENT is the difficulty knob
// (CS005's heat curve raises it), C.ENEMY_CAP is a readability ceiling that is
// never raised for difficulty. Reading only one of them is how a retune of the
// knob quietly walks past the ceiling.
function spawnLimit() {
  return Math.min(C.ENEMY_CONCURRENT, C.ENEMY_CAP);
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
//      difficulty knob and this is the one place it is enforced.
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
// ⛔ The timer HOLDS at the interval instead of growing past it. A spawn
// blocked by the concurrency limit therefore fires the instant a slot frees,
// which is what keeps the pressure constant; a timer that reset on a blocked
// beat would make a busy well quieter exactly when it should not be, and one
// that grew without bound would dump the backlog all at once.
function updateSpawner(state, well, dt) {
  const sp = state.spawn;
  if (sp.remaining <= 0) return;

  if (sp.timer < C.SPAWN_INTERVAL) sp.timer += dt;
  if (sp.timer < C.SPAWN_INTERVAL) return;
  if (state.enemies.length >= spawnLimit()) return;

  // Depth 0 is the throat — the far aperture, the only place a well releases
  // an enemy from. GDD 3.2's convention, not a magic number.
  const lane = pickSpawnLane(state, well);
  const e = spawnEnemy("vaulter", lane, 0);
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
