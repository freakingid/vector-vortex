// test-cs004-p1.js — CS004 P1: the seventh contract field, the debug bench,
// and the no-draw rule under C.DEBUG_SPAWN_KINDS (GDD 4.4, 6.5, 9.5, 17.1).
//
// Asserts what P1 owns. It makes no claim about the Carrier, the Weaver, the
// Thorn, scoring or the heat curve — none of those exist yet.
//
// ⛔ FOUR TRAPS IN THE FIXTURES.
//  1. The clamp cases use BARE `Enemy` stubs, not Vaulters. A base Enemy's
//     update() is a no-op, so a depth that moved was moved by the respawn and
//     by nothing else. A Vaulter would climb 0.003 every tick and every
//     equality below would have to become a tolerance.
//  2. Boot calls startGame(), so the live state at load is a run in progress.
//     Every case starts from G.reset() + startGame(SEED).
//  3. `anchored` is asserted false on the Vaulter and on the base ONLY. It is
//     deliberately NOT asserted over ENEMY_KINDS — CS004 P4's Thorn is `true`,
//     and a loop here would be a trap laid for that phase.
//  4. GOLDEN_LANES was recorded from the build at 9ebd27b, BEFORE
//     pickSpawnKind() existed. It is the whole proof of the no-draw rule: one
//     stray draw per spawn moves every lane in it.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260830;

installSeed(SEED);
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const state = X.state;
const DT = C.FIXED_DT;

// A quiet, known board: the quota spent, nothing alive, no craft in flight.
// ⛔ G.reset() first — it is the only thing that clears a hit-stop a previous
// case left behind, and startGame() deliberately cannot (hitStopLeft is
// private to the loop).
function quietWell(seed) {
  G.reset();
  X.startGame(seed === undefined ? SEED : seed);
  state.spawn.remaining = 0;
  state.enemies = [];
  state.shots = [];
  G.input.reset();
  return X.WELLS[state.wellIndex];
}

// A stub whose depth only ever changes if something outside it moved it.
function stub(lane, depth, anchored) {
  const e = new X.Enemy(lane, depth);
  e.anchored = anchored === true;
  state.enemies.push(e);
  return e;
}

// ---------------------------------------------------------------------------
// the seventh contract field (GDD 6.5)
// ---------------------------------------------------------------------------

const base = new X.Enemy(3, 0.4);
H.assert("anchored" in base, "⛔ the Enemy base carries `anchored`");
H.eq(base.anchored, false, "⛔ and it defaults to false — `depth` is a position");

// ⛔ SEVEN FIELDS, THREE SIGNATURES, AND NO BEHAVIOUR (GDD 6.5). The base
// exists so the ninth enemy cannot forget a field; the moment it grows an
// eighth that is a climb rate, the instruction is to flatten it back to
// independent classes, not to add a switch. This list is the tripwire.
H.assert(
  JSON.stringify(Object.keys(base)) ===
  JSON.stringify(["lane", "depth", "dead", "purgeable", "blocksClear", "killDepth", "anchored"]),
  "⛔ the base holds exactly the seven contract fields, in contract order");
H.assert(
  JSON.stringify(Object.getOwnPropertyNames(X.Enemy.prototype)) ===
  JSON.stringify(["constructor", "update", "draw", "onShot"]),
  "⛔ and exactly the three signatures");
H.eq(X.Enemy.prototype.update.length, 3, "update(dt, well, state)");
H.eq(X.Enemy.prototype.draw.length, 2, "draw(ctx, well)");
H.eq(X.Enemy.prototype.onShot.length, 1, "onShot(shot)");

// The one enemy that exists. ⛔ Its depth is a position, so the rim push means
// exactly what it always meant for it.
quietWell();
const probeVaulter = X.spawnEnemy("vaulter", 2, 0.3);
H.assert(probeVaulter !== null, "a Vaulter spawns");
H.eq(probeVaulter.anchored, false, "⛔ the Vaulter is not anchored — its depth is a position");

// ---------------------------------------------------------------------------
// GDD 4.4's rim push — ⚠ STILL BROAD, and now skipping lengths
// ---------------------------------------------------------------------------

const well = quietWell();
const skLane = state.skimmer.lane;

// ⛔ Everything above C.RESPAWN_PUSH_DEPTH comes down, in every lane. 0.6 is
// far below the rim contact band (1 - RIM_CONTACT_DEPTH = 0.95) and comes down
// anyway: narrowing the clamp to a band at the rim turns this red.
const anchoredHigh = stub(skLane + 3, 0.9, true);
const looseHigh    = stub(skLane + 4, 0.9, false);
const looseMid     = stub(skLane + 5, 0.6, false);
const looseLow     = stub(skLane + 6, 0.4, false);

// A real death, through the real collision pass: a Vaulter in the Skimmer's
// lane, staged at the rim. ⛔ Through spawnEnemy() and then staged — spawning
// it AT 0.99 would trip GDD 6.3's safe-spawn rule and land it at 0.75.
const killer = X.spawnEnemy("vaulter", skLane, 0);
killer.depth = 0.99;

const livesBefore = state.lives;
let died = false;
for (let i = 0; i < 8 && !died; i++) { G.update(DT); died = state.skimmer.dead; }
H.assert(died, "the staged Vaulter kills the Skimmer through the one collision pass");
H.eq(state.lives, livesBefore - 1, "and it costs a life");

// The first live step after the death is the respawn step (GDD 4.4).
G.update(DT);
H.assert(state.skimmer.dead === false, "the next step respawns");
H.assert(state.invulnTime <= DT, "and arms the invulnerability window");

H.eq(anchoredHigh.depth, 0.9,
     "⛔ an ANCHORED entity at 0.9 is untouched — its depth is a LENGTH, and clamping a length is a free chip");
H.eq(looseHigh.depth, C.RESPAWN_PUSH_DEPTH,
     "⛔ an unanchored entity at 0.9 comes down to C.RESPAWN_PUSH_DEPTH");
H.eq(looseMid.depth, C.RESPAWN_PUSH_DEPTH,
     "⚠ SETTLED — and so does one at 0.6, well outside the rim contact band: the clamp is BROAD and stays broad");
H.eq(looseLow.depth, 0.4,
     "⛔ while one at 0.4 is untouched — a clamp is monotonic and never moves an entity toward the rim");
H.assert(anchoredHigh.dead === false && state.enemies.indexOf(anchoredHigh) >= 0,
         "the anchored entity is skipped by the push, not removed by it");

// ---------------------------------------------------------------------------
// the debug bench (GDD 9.5) — ⚠ TEMPORARY, five named actions
// ---------------------------------------------------------------------------

const DEBUG_DIGITS = ["1", "2", "3", "4", "0"];

// ⛔ ONE INPUT PATH. The digits are NAMED ACTIONS, not device bindings — the
// same rule "r" and "w" live under. test-cs002-p1.js owns the global scan that
// says no module but 04-input.js contains a listener at all.
for (const d of DEBUG_DIGITS) {
  H.assert(Object.keys(X.INPUT_KEYS_DEFAULT).every(k => X.INPUT_KEYS_DEFAULT[k].indexOf(d) === -1),
           `⛔ "${d}" is not a device binding — it is a named action`);
}
for (const d of DEBUG_DIGITS) {
  H.assert(d !== "r" && d !== "w",
           `⛔ "${d}" does not collide with the two keys test-cs003-p5.js's replay must never press`);
}

// One press of "1" = exactly one Vaulter, and NOT at DOM-event time.
quietWell();
H.eq(state.enemies.length, 0, "the bench case starts on an empty board");
G.input.keyDown("1");
H.eq(state.enemies.length, 0,
     "⛔ a keydown spawns NOTHING at event time — named actions are dispatched inside sample()");
G.update(DT);
G.input.keyUp("1");
H.eq(state.enemies.length, 1, "⛔ and exactly one entity after the step that sampled it");
H.assert(state.enemies[0] instanceof X.Vaulter, "of the kind the action names");
H.close(X.laneDelta(X.WELLS[state.wellIndex], state.enemies[0].lane, state.skimmer.lane), 0, 1e-9,
        "in the Skimmer's lane");
H.assert(state.enemies[0].depth < 0.01, "at the throat");

// An unbuilt kind is a NO-OP, not a throw: spawnEnemy() returns null for a kind
// ENEMY_KINDS does not list, so P2..P4 light these up by adding a row.
//
// ⚠ "2" AND "3" WERE IN THIS LIST AND ARE NOT ANY MORE. CS004 P2 landed the
// Carrier and wired spawnCarrier to the carrierVaulter kind; CS004 P3 landed
// the Weaver and lit spawnWeaver the same way. Leaving either here would assert
// that the phase it was waiting for had not shipped. The cases that "2" spawns
// exactly one Carrier and "3" exactly one Weaver belong to test-cs004-p2.js and
// test-cs004-p3.js, which own them. P4 does the same to "4".
quietWell();
for (const d of ["4"]) { G.input.keyDown(d); G.update(DT); G.input.keyUp(d); }
H.eq(state.enemies.length, 0,
     "⛔ spawnThorn is a no-op while its kind is unbuilt");

// ⛔ THROUGH spawnEnemy(), which is what makes the cap apply to the bench too.
// A bench that pushed straight into state.enemies walks past C.ENEMY_CAP, and
// that is the whole reason there is one entry point.
quietWell();
for (let i = 0; i < C.ENEMY_CAP; i++) stub(i % 4, 0.2, false);
H.eq(state.enemies.length, C.ENEMY_CAP, "the board is staged at the cap");
G.input.keyDown("1");
G.update(DT);
G.input.keyUp("1");
H.eq(state.enemies.length, C.ENEMY_CAP,
     "⛔ a bench spawn at C.ENEMY_CAP is refused — the bench goes through spawnEnemy()");

// spawnRow — one of every Classic kind, consecutive lanes, staggered depths.
// The live kinds are read off ENEMY_KINDS rather than named, so P2..P4 grow the
// row without touching this.
const liveClasses = Object.keys(X.ENEMY_KINDS).map(k => X.ENEMY_KINDS[k](0, 0, 1).constructor);
quietWell();
G.input.keyDown("0");
H.eq(state.enemies.length, 0, "⛔ spawnRow does not fire at event time either");
G.update(DT);
G.input.keyUp("0");
const row = state.enemies.slice();
H.assert(row.length >= 1, "spawnRow puts at least one entity on the board");
H.assert(row.every(e => liveClasses.indexOf(e.constructor) >= 0),
         "every entity in the row is a kind ENEMY_KINDS actually lists");
H.assert(new Set(row.map(e => e.constructor)).size === row.length,
         "⛔ one of EVERY kind — no kind appears twice in the row");
H.assert(row.every(e => e.depth >= 0 && e.depth <= C.SAFE_SPAWN_DEPTH),
         "⛔ the row is staggered inside [0, C.SAFE_SPAWN_DEPTH] — it never lands on the craft");
let ascending = true;
for (let i = 1; i < row.length; i++) if (!(row[i].depth > row[i - 1].depth)) ascending = false;
H.assert(ascending, "and the stagger ascends");

// ---------------------------------------------------------------------------
// ⚠ C.DEBUG_SPAWN_KINDS and ⛔ the no-draw rule (GDD 17.1)
// ---------------------------------------------------------------------------

H.assert(Array.isArray(C.DEBUG_SPAWN_KINDS), "C.DEBUG_SPAWN_KINDS is a list");
H.assert(JSON.stringify(C.DEBUG_SPAWN_KINDS) === JSON.stringify(["vaulter"]),
         "⚠ it ships as one entry, so the game plays exactly as it did before it existed");

// ⛔ THE NO-DRAW RULE, MEASURED DIRECTLY. A one-entry list is not a choice, so
// pickSpawnKind() must leave the stream exactly where it found it: rngPick()
// on a single-element array still advances mulberry32, and the stream is
// shared with every spawn lane in the run.
quietWell();
const noDrawProbe = X.mulberry32(SEED);
state.rng = X.mulberry32(SEED);
for (let i = 0; i < 8; i++) H.eq(X.pickSpawnKind(state), "vaulter", `pick ${i} is the one entry`);
H.eq(state.rng(), noDrawProbe(),
     "⛔ eight picks from a one-entry list spent NO draw — the stream is exactly where it started");

// A genuine choice DOES draw, from state.rng, and replays identically.
const MIXED = ["vaulter", "carrier", "weaver"];
const savedKinds = C.DEBUG_SPAWN_KINDS;
C.DEBUG_SPAWN_KINDS = MIXED;
function kindRun() {
  state.rng = X.mulberry32(SEED);
  const out = [];
  for (let i = 0; i < 300; i++) out.push(X.pickSpawnKind(state));
  return out;
}
const kindsA = kindRun();
const kindsB = kindRun();
H.assert(kindsA.join(",") === kindsB.join(","),
         "⛔ two runs on one seed produce the same kind sequence");
H.assert(new Set(kindsA).size === MIXED.length,
         "and a three-entry list really draws — all three kinds appear");
state.rng = X.mulberry32(SEED);
X.pickSpawnKind(state);
H.assert(state.rng() !== X.mulberry32(SEED)(),
         "⛔ a multi-entry pick DOES advance the stream — the no-draw case above is not vacuous");
C.DEBUG_SPAWN_KINDS = savedKinds;
H.assert(JSON.stringify(C.DEBUG_SPAWN_KINDS) === JSON.stringify(["vaulter"]),
         "the shipped list is restored before the golden run");

// ---------------------------------------------------------------------------
// ⛔ THE GOLDEN: the spawn-lane sequence is bit-identical to the pre-change build
// ---------------------------------------------------------------------------
//
// Recorded from the build at 9ebd27b, before pickSpawnKind() existed. This is
// the end-to-end form of the rule above: one stray draw per spawn shifts every
// lane after the first, and the same shift lands on the 10,000-tick replay
// test-cs003-p5.js hashes — where it would read as a physics bug, not a spawner
// one. The fixture holds `lives` up so the run never reaches the game-over
// stop, which would end the sequence early and make the case weaker than it
// looks; fire is held so enemies die, wells clear and the quota refreshes.
const GOLDEN_LANES = [10, 10, 12, 0, 8, 14, 12, 12, 8, 14, 10, 0, 7, 7, 12, 3];
const GOLDEN_TICKS = 3000;

function spawnLaneRun() {
  G.reset();
  X.startGame(SEED);
  const inp = G.input;
  inp.reset();
  inp.keyDown(" ");
  const seen = new Set();
  const lanes = [];
  for (let i = 0; i < GOLDEN_TICKS; i++) {
    if (i % 37 === 0) inp.mouseMove(((i * 41) % 173) - 86);
    state.lives = C.START_LIVES;
    G.update(DT);
    for (const e of state.enemies) if (!seen.has(e)) { seen.add(e); lanes.push(e.lane); }
  }
  inp.keyUp(" ");
  return lanes;
}

const lanes = spawnLaneRun();
H.assert(lanes.length === GOLDEN_LANES.length && lanes.every((l, i) => l === GOLDEN_LANES[i]),
         `⛔ the spawn-lane sequence over ${GOLDEN_TICKS} ticks is identical to the pre-change build ` +
         `(got [${lanes}])`);
H.assert(lanes.length >= 8, "and the run was not vacuous — it actually spawned");

H.report("test-cs004-p1.js");
