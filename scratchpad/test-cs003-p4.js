// test-cs003-p4.js — CS003 P4: death, lives, respawn and the game-over stop
// (GDD 4.4, 4.5, 16.3).
//
// Asserts what P4 owns: the life, the freeze, the respawn on the first live
// step after it, GDD 4.4's rim push, the invulnerability window, the purge
// re-latch, and the stop. It makes no claim about scoring, the game-over
// screen, particles or the HUD — all CS008's.
//
// ⛔ FIVE TRAPS IN THE FIXTURES.
//  1. The freeze only exists in Game.frame(). A case driven by Game.update()
//     alone never freezes at all, so every death here goes through frame().
//  2. Frames advance by HALF a simulation step, so no frame can ever run two of
//     them — "the FIRST live step after the freeze" is not observable otherwise.
//  3. Boot calls startGame(), so the live state at load is a run in progress.
//     Every case starts from G.reset() + startGame(SEED).
//  4. The spawner keeps releasing Vaulters and a cleared well advances after
//     C.WELL_CLEAR_HOLD, so cases that need a known board drain the quota and
//     empty the array first.
//  5. Game.update() ages state.invulnTime BEFORE the collision pass, so a
//     boundary staged by writing the field is read one step later. The two
//     boundary cases here write exactly 0 and exactly C.RESPAWN_INVULN, where
//     the count-up holds and the staged value is what collision sees.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");
const { hasKnob } = require("./test-registry.js");

const SEED = 20260830;

installSeed(SEED);
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const state = X.state;
const DT = C.FIXED_DT;
const MS = DT * 1000;          // one simulation step, in milliseconds
const FREEZE_CAP = 600;        // frames; HIT_STOP_DEATH is ~144 half-frames

// ---------------------------------------------------------------------------
// fixtures
// ---------------------------------------------------------------------------

let clock = 0;

// A quiet, known board with the loop's own clocks reset. ⛔ G.reset() first:
// it is the only thing that clears a hit-stop left over from a previous case,
// and startGame() deliberately cannot (hitStopLeft is private to the loop).
function quietWell(seed) {
  G.reset();
  X.startGame(seed === undefined ? SEED : seed);
  state.spawn.remaining = 0;
  state.enemies = [];
  state.shots = [];
  clock = 0;
  G.frame(0);                  // establishes lastMs; dt is 0, so no step runs
  return X.WELLS[state.wellIndex];
}

// ⛔ HALF a simulation step per frame. A frame that could run two steps makes
// "the first live step after the freeze" unobservable, and this whole phase is
// about which step things happen on.
function halfFrame() { clock += MS / 2; G.frame(clock); }

// Frames until one LIVE simulation step has run. Returns whether it did — a
// frozen loop runs frames forever and no ticks, so the cap is what turns that
// into a failure instead of a hang.
function liveStep(label) {
  const want = G.stats.ticks + 1;
  for (let n = 0; G.stats.ticks < want && n < 8; n++) halfFrame();
  const ran = G.stats.ticks >= want;
  if (label) H.assert(ran, `${label}: a live simulation step ran`);
  return ran;
}

// Frames until the freeze lifts. Returns the frames it took.
function runFreeze() {
  let n = 0;
  while (G.hitStopLeft > 0 && n < FREEZE_CAP) { halfFrame(); n++; }
  return n;
}

// A Vaulter placed exactly where the case wants it. ⛔ Through spawnEnemy, the
// one entry point — but its safe-spawn clamp would move a deep spawn in the
// Skimmer's lane, so the depth is written afterwards.
function put(lane, depth) {
  const e = X.spawnEnemy("vaulter", lane, 0);
  e.depth = depth;
  return e;
}

// A lethal contact in the Skimmer's lane, right now, with no invulnerability.
function lethal(lane) {
  const e = put(lane, 0);
  e.depth = e.killDepth;
  state.invulnTime = C.RESPAWN_INVULN;   // fixture: expired, i.e. vulnerable
  return e;
}

// ---------------------------------------------------------------------------
// the surface this phase adds
// ---------------------------------------------------------------------------

hasKnob(X, "INVULN_BLINK_HZ", { def: 6 }, H);
hasKnob(X, "START_LIVES", { def: 3 }, H);
hasKnob(X, "RESPAWN_INVULN", { def: 1.5 }, H);
hasKnob(X, "RESPAWN_PUSH_DEPTH", { def: 0.55 }, H);
hasKnob(X, "HIT_STOP_DEATH", { def: 1.20 }, H);
H.assert(typeof X.respawnSkimmer === "function", "respawnSkimmer is in the build");
H.assert(typeof X.spawnSkimmer === "function", "spawnSkimmer is in the build");
H.assert(typeof X.skimmerBlinkVisible === "function", "skimmerBlinkVisible is in the build");

// ⛔ Still no scoring this changeset: the extra life at C.EXTRA_LIFE_FIRST and
// the C.LIVES_MAX ceiling are addScore()'s in CS008, and this phase must not
// have grown a second route to them.
H.assert(typeof X.addScore === "undefined" || X.addScore === null,
         "no addScore exists yet — scoring is CS008's");
H.assert(!("score" in state), "state carries no score field this changeset");

// ---------------------------------------------------------------------------
// shipped defaults — ⛔ a fresh run is NOT born invulnerable
// ---------------------------------------------------------------------------

let well = quietWell();
H.eq(state.lives, C.START_LIVES, "a fresh run starts with START_LIVES");
H.eq(state.invulnTime, C.RESPAWN_INVULN,
     "⛔ invulnTime starts AT the threshold — already expired (GDD 16.3)");
H.eq(state.screen, "play", "a fresh run is on the play screen");

// And the consequence, which is the whole reason for the line above: contact on
// the very first step of a run kills. A run born at invulnTime 0 survives here.
well = quietWell();
state.skimmer.lane = 3;
put(3, 0).depth = 1 - C.RIM_CONTACT_DEPTH;
liveStep("first step of a run");
H.eq(state.lives, C.START_LIVES - 1,
     "⛔ contact on the first step of a run kills — the run is not born invulnerable");

// ---------------------------------------------------------------------------
// one contact, exactly one life, and a freeze of HIT_STOP_DEATH
// ---------------------------------------------------------------------------

well = quietWell();
state.skimmer.lane = 3;
let died = state.skimmer;
let killer = lethal(3);
liveStep("the death step");
H.eq(state.lives, C.START_LIVES - 1, "contact costs exactly one life");
H.assert(state.skimmer.dead === true, "and sets skimmer.dead");
H.assert(state.skimmer === died, "the dead craft is still on screen during the freeze");
H.eq(G.hitStopLeft, C.HIT_STOP_DEATH, "and freezes the simulation for HIT_STOP_DEATH");
H.eq(state.screen, "play", "one death with lives left is not the stop");

// The freeze runs no simulation steps at all, and lasts HIT_STOP_DEATH of them.
let ticksAtDeath = G.stats.ticks;
let timeAtDeath = state.time;
let frozenFrames = runFreeze();
H.eq(G.stats.ticks, ticksAtDeath, "⛔ the freeze runs no simulation steps");
H.eq(state.time, timeAtDeath, "and simulation time does not advance during it");
H.close(frozenFrames * (DT / 2), C.HIT_STOP_DEATH, DT,
        "the freeze lasts HIT_STOP_DEATH");

// ---------------------------------------------------------------------------
// ⛔ NO SECOND LIFE DURING THE FREEZE, however many enemies are touching
// ---------------------------------------------------------------------------

well = quietWell();
state.skimmer.lane = 3;
const crowd = [];
for (let i = 0; i < 5; i++) crowd.push(lethal(3));
liveStep("the crowded death step");
H.eq(state.lives, C.START_LIVES - 1,
     "⛔ five enemies touching at once still cost exactly one life");

let lostDuringFreeze = false;
let movedDuringFreeze = false;
const rimDepths = crowd.map(e => e.depth);
for (let n = 0; G.hitStopLeft > 0 && n < FREEZE_CAP; n++) {
  halfFrame();
  if (state.lives !== C.START_LIVES - 1) lostDuringFreeze = true;
  for (let i = 0; i < crowd.length; i++) {
    if (crowd[i].depth !== rimDepths[i]) movedDuringFreeze = true;
  }
}
H.assert(!lostDuringFreeze, "⛔ no second life is lost anywhere in the freeze");
H.assert(!movedDuringFreeze,
         "⛔ and the enemies are still AT THE RIM throughout it — the push is not at death");
for (let i = 0; i < crowd.length; i++) {
  H.eq(crowd[i].depth, rimDepths[i], `crowd[${i}] ends the freeze where it killed`);
  H.assert(crowd[i].depth > C.RESPAWN_PUSH_DEPTH,
           `crowd[${i}] is still well above RESPAWN_PUSH_DEPTH when the freeze lifts`);
}

// ---------------------------------------------------------------------------
// the respawn: the FIRST live step after the freeze, in the same lane
// ---------------------------------------------------------------------------

const deadCraft = state.skimmer;
H.assert(deadCraft.dead === true, "the craft is still dead when the freeze lifts");
H.eq(state.lives, C.START_LIVES - 1, "and no life has been spent by the freeze itself");

liveStep("the respawn step");
H.assert(state.skimmer !== deadCraft, "the first live step after the freeze respawns");
H.assert(state.skimmer.dead === false, "the new craft is alive");
H.eq(state.skimmer.lane, 3, "⛔ and respawns in the lane it died in (GDD 4.4)");
H.eq(state.lives, C.START_LIVES - 1, "the respawn itself costs no life");
H.eq(state.invulnTime, 0,
     "⛔ the respawn step arms invulnTime at zero and does not also age it");

// ⛔ And GDD 4.4's rim push happened on THAT step, not at death. The enemy pass
// runs after the push in the same step, so a Vaulter has climbed exactly one
// step's worth by the time the step ends.
for (let i = 0; i < crowd.length; i++) {
  H.close(crowd[i].depth, C.RESPAWN_PUSH_DEPTH, C.VAULT_CLIMB * DT + 1e-9,
          `crowd[${i}] sits at RESPAWN_PUSH_DEPTH after the respawn step`);
}

// ⛔ THE PUSH IS A CLAMP, NOT AN ASSIGNMENT. An enemy already deeper than the
// push depth is never dragged UP to it — that would hand the player a threat
// the well had not delivered yet.
well = quietWell();
state.skimmer.lane = 3;
const deep = put(6, 0.20);
lethal(3);
liveStep("death with a deep enemy on the board");
runFreeze();
liveStep("respawn with a deep enemy on the board");
H.assert(deep.depth < C.RESPAWN_PUSH_DEPTH,
         "⛔ an enemy below the push depth is not pulled up to it");
H.close(deep.depth, 0.20 + C.VAULT_CLIMB * DT * 2, C.VAULT_CLIMB * DT + 1e-9,
        "it only advanced by its own climb");

// ---------------------------------------------------------------------------
// the invulnerability window (GDD 4.4) — exactly RESPAWN_INVULN
// ---------------------------------------------------------------------------
//
// ⛔ The boundary, staged where the count-up HOLDS so the value written is the
// value the collision pass reads.

well = quietWell();
state.skimmer.lane = 3;
killer = lethal(3);
state.invulnTime = 0;
liveStep("contact while fully invulnerable");
H.eq(state.lives, C.START_LIVES, "⛔ an invulnerable Skimmer cannot die");
H.assert(state.skimmer.dead === false, "and is not even flagged dead");
H.eq(G.hitStopLeft, 0, "and nothing froze");

state.invulnTime = C.RESPAWN_INVULN;
liveStep("contact the moment invulnerability lapses");
H.eq(state.lives, C.START_LIVES - 1,
     "⛔ and dies the moment invulnTime reaches RESPAWN_INVULN");

// An invulnerable Skimmer can still FIRE and still move — invulnerability
// suspends dying, not playing (GDD 1.1 P1). ⛔ An empty board: a lethal enemy
// parked at the rim is inside HIT_DEPTH_TOL of a shot's own launch depth, so it
// would consume the shot on the step it was fired and the array would read
// empty for the wrong reason.
well = quietWell();
state.skimmer.lane = 3;
state.invulnTime = 0;
state.shots = [];
state.shotCooldown = C.SHOT_COOLDOWN;
G.input.keyDown(" ");
liveStep("firing while invulnerable");
G.input.keyUp(" ");
H.assert(state.shots.length > 0, "an invulnerable Skimmer can still fire");
H.assert(state.invulnTime < C.RESPAWN_INVULN,
         "and the fixture really was still inside the window");

const laneBefore = state.skimmer.lane;
state.invulnTime = 0;
G.input.mouseMove(200);
liveStep("rotating while invulnerable");
H.assert(state.skimmer.lane !== laneBefore, "and still rotates");

// ⛔ The window measured end to end, through the real loop: from the respawn to
// the death it does not prevent is exactly RESPAWN_INVULN of simulation time.
well = quietWell();
state.skimmer.lane = 3;
killer = lethal(3);
liveStep("the death before the measured window");
runFreeze();
liveStep("the respawn that opens the measured window");
H.eq(state.invulnTime, 0, "the measured window opens at zero");
killer.depth = killer.killDepth;          // re-park it: the push moved it away
const livesAtRespawn = state.lives;
let survived = 0;
while (state.lives === livesAtRespawn && survived < 600) {
  liveStep();
  survived++;
}
H.assert(state.lives === livesAtRespawn - 1, "the measured window did eventually lapse");
H.close(survived * DT, C.RESPAWN_INVULN, DT,
        "⛔ an invulnerable Skimmer survives contact for exactly RESPAWN_INVULN");

// ---------------------------------------------------------------------------
// ⛔ THE PURGE RE-LATCH (GDD 4.3, and 09-collision.js's reason)
// ---------------------------------------------------------------------------
//
// Devices are still drained during hit-stop, so a button that is down when the
// freeze lifts looks like a fresh press. Death forces the latch, and the button
// needs a genuine release before it fires again.

const PURGE_KEY = "x";
H.assert(X.INPUT_KEYS_DEFAULT.purge.indexOf(PURGE_KEY) !== -1,
         "the key these cases press is actually bound to purge");
const canDriveKeys = typeof G.input.keyDown === "function" &&
                     typeof G.input.keyUp === "function";
H.assert(canDriveKeys, "the input module exposes the keyDown/keyUp sink");

// The latch itself, with the button never touched. This is the line that
// makes the two behavioural cases below possible.
well = quietWell();
state.skimmer.lane = 3;
lethal(3);
H.assert(state.purgeLatched === false, "the latch is clear before the death");
liveStep("the death that sets the latch");
H.assert(state.purgeLatched === true,
         "⛔ death sets purgeLatched, with the button never touched");

if (canDriveKeys) {
  // ⛔ A press that BEGINS during the freeze does not fire at the first live
  // step. It is banked input, not a decision the player made in the well.
  G.input.keyDown(PURGE_KEY);
  runFreeze();
  liveStep("the respawn step with purge held from the freeze");
  H.eq(state.purgeUses, 0,
       "⛔ a purge pressed DURING the freeze does not spend a charge on the first live step");
  // ...and a genuine release re-arms it.
  G.input.keyUp(PURGE_KEY);
  liveStep();
  G.input.keyDown(PURGE_KEY);
  liveStep();
  H.eq(state.purgeUses, 1, "releasing and pressing again does spend the charge");
  G.input.keyUp(PURGE_KEY);
  liveStep();
}

// ⛔ AND HELD FROM BEFORE THE DEATH THROUGH TO AFTER IT: still one charge.
if (canDriveKeys) {
  well = quietWell();
  state.skimmer.lane = 3;
  put(5, 0.3);
  put(7, 0.4);
  G.input.keyDown(PURGE_KEY);
  liveStep("the purge press before the death");
  H.eq(state.purgeUses, 1, "the press before the death spends the first use");
  H.eq(state.enemies.length, 0, "and it was the strong use");

  // A killer the Purge cannot remove, the way CS004's Thorn will be — the flag
  // on the contract, never a class name (07-enemies.js).
  const thornLike = lethal(3);
  thornLike.purgeable = false;
  liveStep("the death with purge still held");
  H.eq(state.lives, C.START_LIVES - 1, "the held purge did not save the player");
  H.eq(state.purgeUses, 1, "and the death itself spent no charge");

  runFreeze();
  liveStep("the respawn with purge still held");
  H.eq(state.purgeUses, 1,
       "⛔ a purge held from before the death through to after it spends no second charge");

  // Held for another second: still one.
  for (let i = 0; i < 60; i++) liveStep();
  H.eq(state.purgeUses, 1, "and holding it on through the well spends no more");
  G.input.keyUp(PURGE_KEY);
  liveStep();
}

// ---------------------------------------------------------------------------
// the game-over STOP (GDD 4.4) — not a screen
// ---------------------------------------------------------------------------

well = quietWell();
state.skimmer.lane = 3;
killer = lethal(3);
for (let n = 0; n < C.START_LIVES; n++) {
  killer.depth = killer.killDepth;
  state.invulnTime = C.RESPAWN_INVULN;
  liveStep(`death ${n + 1}`);
  H.eq(state.lives, C.START_LIVES - (n + 1), `death ${n + 1} costs exactly one life`);
  runFreeze();
  if (n < C.START_LIVES - 1) liveStep(`respawn ${n + 1}`);
}
H.eq(state.lives, 0, "START_LIVES deaths spend the whole reserve");
H.assert(state.lives >= 0, "⛔ and lives never goes negative");
H.eq(state.screen, "gameover", "⛔ lives at zero sets screen to gameover");

// Now prove the STOP: a spawn is due, the board is under the concurrency limit,
// and three seconds of live frames change nothing.
state.spawn.remaining = C.SPAWN_QUOTA;
state.spawn.timer = C.SPAWN_INTERVAL;      // a spawn is due on the next step
H.assert(state.enemies.length < X.spawnLimit(),
         "the stop fixture leaves room under the concurrency limit for a spawn");
const stoppedCount = state.enemies.length;
const stoppedDepth = killer.depth;
const stoppedTime = state.time;
const stoppedLevel = state.level;
const ticksBeforeStop = G.stats.ticks;
for (let f = 0; f < 360; f++) halfFrame();
H.assert(G.stats.ticks > ticksBeforeStop,
         "the loop really did run live steps — the stop is not a lingering freeze");
H.eq(state.screen, "gameover", "the stop holds");
H.eq(state.lives, 0, "and no life comes back");
H.eq(state.enemies.length, stoppedCount, "⛔ the spawner does not run at the stop");
H.eq(killer.depth, stoppedDepth, "⛔ and enemies do not move at the stop");
H.eq(state.time, stoppedTime, "simulation time does not advance at the stop");
H.eq(state.level, stoppedLevel, "and the level does not advance");
H.assert(state.skimmer.dead === true, "the craft that died stays dead at the stop");

// A cleared board does not advance the well either — the stop is above the
// C.WELL_CLEAR_HOLD branch, not merely quiet because something was still alive.
state.enemies = [];
state.spawn.remaining = 0;
for (let f = 0; f < 360; f++) halfFrame();
H.eq(state.level, stoppedLevel, "⛔ a cleared board does not advance the well at the stop");
H.eq(state.screen, "gameover", "and the stop still holds");

// ---------------------------------------------------------------------------
// startGame() from the stop, and the one input path that reaches it
// ---------------------------------------------------------------------------

X.startGame(SEED);
H.eq(state.lives, C.START_LIVES, "startGame() from game over restores START_LIVES");
H.eq(state.screen, "play", "and leaves the stop");
H.assert(state.skimmer && state.skimmer.dead === false,
         "and mints a live Skimmer");
H.eq(state.invulnTime, C.RESPAWN_INVULN,
     "⛔ and the restarted run is not born invulnerable either");
H.eq(state.level, 1, "the run restarts at level 1");
H.eq(state.enemies.length, 0, "with an empty board");

// ⛔ ONE INPUT PATH (GDD 9.5). "r" is a NAMED DEBUG ACTION dispatched by
// input.sample(), not a device binding and not a listener of its own — which is
// also why it works during a freeze, when update() never runs.
H.assert(Object.keys(X.INPUT_KEYS_DEFAULT).every(
           k => X.INPUT_KEYS_DEFAULT[k].indexOf("r") === -1),
         "⛔ 'r' is not a device binding — it is a named action");

if (canDriveKeys) {
  well = quietWell();
  state.skimmer.lane = 3;
  state.level = 4;
  killer = lethal(3);
  liveStep("the death before the restart key");
  H.assert(G.hitStopLeft > 0, "the restart key is pressed mid-freeze");
  // ⛔ TWO half-frames, because that is what spends ONE step, and named actions
  // are dispatched from input.sample() — which the freeze branch calls and
  // update() does not reach.
  G.input.keyDown("r");
  halfFrame();
  halfFrame();
  G.input.keyUp("r");
  H.eq(state.lives, C.START_LIVES, "the restart action restarts from inside the freeze");
  H.eq(state.level, 1, "and takes the run back to level 1");
  H.assert(state.skimmer.dead === false, "with a live craft");
  H.eq(G.hitStopLeft, 0,
       "⛔ and the fresh run does not inherit the remainder of the old freeze");
}

// ---------------------------------------------------------------------------
// the respawn blink (GDD 4.4) — ⛔ VISUAL ONLY
// ---------------------------------------------------------------------------

H.assert(X.skimmerBlinkVisible(C.RESPAWN_INVULN) === true,
         "a Skimmer that is not invulnerable is drawn solid");
H.assert(X.skimmerBlinkVisible(C.RESPAWN_INVULN * 2) === true,
         "and stays solid past the threshold");
H.assert(X.skimmerBlinkVisible(0) === true,
         "the respawn step itself draws — the blink starts ON");

// C.INVULN_BLINK_HZ full cycles per second over a C.RESPAWN_INVULN window is
// that many flashes. At the shipped values: 6 Hz for 1.5 s is 9.
let flashes = 0, wasOn = false;
const samples = 20000;
for (let i = 0; i < samples; i++) {
  const on = X.skimmerBlinkVisible(C.RESPAWN_INVULN * i / samples);
  if (on && !wasOn) flashes++;
  wasOn = on;
}
H.eq(flashes, Math.round(C.INVULN_BLINK_HZ * C.RESPAWN_INVULN),
     "the blink runs at INVULN_BLINK_HZ full cycles per second");

// ⛔ Visual only: it reads a number, not the game object, and changes nothing.
well = quietWell();
const blinkProbe = { lives: state.lives, lane: state.skimmer.lane, invuln: state.invulnTime };
X.skimmerBlinkVisible(0.01);
H.assert(state.lives === blinkProbe.lives &&
         state.skimmer.lane === blinkProbe.lane &&
         state.invulnTime === blinkProbe.invuln,
         "⛔ skimmerBlinkVisible touches no state");

// ---------------------------------------------------------------------------
// a soak: a real run to the stop, with nothing awarding a life on the way
// ---------------------------------------------------------------------------

G.reset();
X.startGame(SEED);
clock = 0;
G.frame(0);
let maxLives = state.lives, minLives = state.lives, sawGameOver = false;
for (let f = 0; f < 8000 && !sawGameOver; f++) {
  halfFrame();
  if (state.lives > maxLives) maxLives = state.lives;
  if (state.lives < minLives) minLives = state.lives;
  if (state.screen === "gameover") sawGameOver = true;
}
H.assert(sawGameOver, "a passive run reaches the stop unaided");
H.eq(maxLives, C.START_LIVES,
     "⛔ nothing awards an extra life this changeset — EXTRA_LIFE_* stays unread");
H.eq(minLives, 0, "and the reserve is spent down to exactly zero, never past it");
H.assert(state.skimmer !== null, "the craft object survives the stop for CS008 to draw");

H.report();
