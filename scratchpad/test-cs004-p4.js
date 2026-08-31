// test-cs004-p4.js — CS004 P4: the Thorn, the chip economy, and the Weaver's
// lay-and-adopt (GDD 6.1, 6.5, 4.2, 4.3, 4.4, 5, 8, 10.2, 10.3).
//
// Asserts what P4 owns. It makes no claim about the Dive, GDD 4.5's fifth death
// condition, scoring, the Drifter or the Surger — none of those exist.
//
// ⛔ SIX TRAPS IN THE FIXTURES.
//  1. A Thorn's `depth` is a LENGTH, not a position. Every reading below is
//     "how long is it", and the whole file is about the two places that
//     difference is load-bearing: respawnSkimmer() skips it, collideShots()
//     does not.
//  2. The anchored case has to run the REAL death path. G.update() is called
//     directly, which never freezes (the hit-stop lives in G.frame), so the
//     step after the killing one is the respawn — that IS the live path, and a
//     hand-written call to respawnSkimmer would prove nothing about it.
//  3. C.THORN_MAX is 1.00, which is also the depth ceiling, so the clamp is not
//     independently observable at shipped values. The clamp case lowers the
//     constant, drives a Weaver past it, and puts it back.
//  4. A Weaver lays on EVERY step of its climb, so a board that has a Weaver on
//     it has a Thorn on it one step later. Cases that count entities filter by
//     class rather than reading state.enemies.length.
//  5. Boot calls startGame(), so the live state at load is a run in progress.
//     Every case starts from useWell().
//  6. spawnEnemy() reads the GLOBAL state and WELLS[state.wellIndex], so a
//     Weaver driven on a well the state is not pointing at lays somewhere else.
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
const FIRE_KEY = " ";
const PURGE_KEY = "x";

// A quiet, known board on a chosen well: quota spent, nothing alive, a craft on
// the rim that can actually die. ⛔ G.reset() first — it is the only thing that
// clears a hit-stop a previous case left behind.
function useWell(index) {
  G.reset();
  X.startGame(SEED);
  state.wellIndex = index === undefined ? 0 : index;
  X.enterWell();
  state.spawn.remaining = 0;
  state.shots = [];
  state.shotCooldown = C.SHOT_COOLDOWN;
  state.purgeUses = 0;
  state.purgeLatched = true;
  state.input.purge = false;
  state.invulnTime = C.RESPAWN_INVULN;   // fixture: expired, i.e. vulnerable
  G.input.reset();
  return X.WELLS[state.wellIndex];
}

// A Thorn of a chosen LENGTH. ⛔ Through spawnEnemy(), the one entry point, but
// the length is written afterwards: the safe-spawn rule would shorten a long one
// asked for in the craft's lane, which is the very thing this file is about.
function thorn(lane, len) {
  const t = X.spawnEnemy("thorn", lane, 0);
  t.depth = len;
  return t;
}

function thornsOn(board) { return board.filter(e => e instanceof X.Thorn && !e.dead); }

// ---------------------------------------------------------------------------
// the constants and the kind row
// ---------------------------------------------------------------------------

H.eq(C.THORN_MAX, 1.00, "⛔ C.THORN_MAX — GDD 8's 'clamp: lane length'");
H.eq(C.THORN_TIP_LEN, 0.05, "C.THORN_TIP_LEN");
H.eq(C.THORN_CHIP, 0.08, "C.THORN_CHIP already existed and is not re-declared");
H.assert(typeof C.THORN_COLOR === "string", "⚠ and so does C.THORN_COLOR, provisional");
H.assert(C.THORN_TIP_LEN < C.THORN_MAX,
         "the bright tip is a fraction of the segment, not the segment");
H.assert("thorn" in X.ENEMY_KINDS, "⛔ the Thorn is an ENEMY_KINDS row like everything else");

// ---------------------------------------------------------------------------
// the contract fields (GDD 6.5)
// ---------------------------------------------------------------------------

let well = useWell(0);
const probe = X.spawnEnemy("thorn", 3, 0);
H.assert(probe !== null && probe instanceof X.Thorn, "a Thorn enters through spawnEnemy()");
H.eq(probe.purgeable, false,
     "⛔ purgeable is FALSE — GDD 4.3's 'does not remove Thorns', read off the flag");
H.eq(probe.blocksClear, false,
     "⛔ blocksClear is FALSE — which is WHY a Thorn is standing during the Dive (GDD 5)");
H.eq(probe.killDepth, null,
     "killDepth is null — it kills only during the Dive, and there is no Dive");
H.eq(probe.anchored, true,
     "⛔ anchored is TRUE — its depth is a LENGTH, and it is the roster's only one");

// ⛔ THE FLAGS ARE READ OFF THE ENTITY, so the one collision pass needs no
// branch for a Thorn: its null killDepth means contact never kills, at any
// depth including the rim, through the REAL collideSkimmer.
let contactKilled = null;
for (const len of [0.1, 0.5, 1]) {
  well = useWell(0);
  state.skimmer.lane = 4;
  thorn(4, len);
  X.collideSkimmer(state, well);
  if (state.skimmer.dead) contactKilled = len;
}
H.assert(contactKilled === null,
         `⛔ a Thorn never kills by contact, at any length (killed at ${contactKilled})`);

// ---------------------------------------------------------------------------
// ⛔ update() DOES NOTHING — static, in one lane, forever
// ---------------------------------------------------------------------------
//
// Exact equality on BOTH fields, on all sixteen wells. A range check would not
// do (test-cs003-p5.js's finding: a wrapped hop on a 13-lane strip lands inside
// [0, 12]), and a Thorn touches no lane helper at all, so the strong form is
// available: bit for bit, for its whole life.

const STATIC_TICKS = 3000;
let drift = null;
for (let wi = 0; wi < X.WELLS.length && drift === null; wi++) {
  const w = X.WELLS[wi];
  useWell(wi);
  for (const start of [0, Math.floor((w.lanes - 1) / 2), w.lanes - 1, 2.5]) {
    const t = new X.Thorn(start, 0.42);
    for (let i = 0; i < STATIC_TICKS && drift === null; i++) {
      t.update(DT, w, state);
      if (!Object.is(t.lane, start)) drift = `${w.name}: lane ${start} -> ${t.lane}`;
      if (!Object.is(t.depth, 0.42)) drift = `${w.name}: length 0.42 -> ${t.depth}`;
      if (t.dead) drift = `${w.name}: died on its own at tick ${i}`;
    }
  }
}
H.assert(drift === null,
         `⛔ a Thorn's lane and length are EXACTLY what it was built with, for ` +
         `${STATIC_TICKS} ticks, on every well (${drift})`);

// ---------------------------------------------------------------------------
// ⛔ the Purge does not touch it — either use (GDD 4.3)
// ---------------------------------------------------------------------------

well = useWell(0);
state.skimmer.lane = 0;
const survivor = thorn(6, 0.5);
X.spawnEnemy("vaulter", 8, 0.3);
X.spawnEnemy("weaver", 9, 0.2);
H.eq(state.enemies.length, 3, "a board of one Thorn and two purgeable enemies");

state.purgeLatched = false;
state.input.purge = true;
X.updatePurge(state);
H.eq(state.purgeUses, 1, "the first use is spent");
state.enemies = state.enemies.filter(e => !e.dead);
H.eq(state.enemies.length, 1, "the first use cleared everything else");
H.assert(state.enemies[0] === survivor,
         "⛔ and the Thorn survived it — GDD 4.3's 'does not remove Thorns'");
H.eq(survivor.depth, 0.5, "at its full length, unchipped — the Purge is not a shot");

// ⛔ AND IT IS NEVER THE SECOND USE'S VICTIM, EVEN AS THE ENTITY NEAREST THE
// RIM. purgeTarget() picks the highest depth first, so a Thorn at 0.95 with a
// Vaulter at 0.30 behind it is exactly the board where a `purgeable` Thorn would
// eat the weak use and leave the real threat climbing.
well = useWell(0);
state.skimmer.lane = 0;
const tallest = thorn(6, 0.95);
const behindIt = X.spawnEnemy("vaulter", 8, 0.30);
let deepest = null;
for (const e of state.enemies) if (deepest === null || e.depth > deepest.depth) deepest = e;
H.assert(deepest === tallest, "the fixture really does put the Thorn nearest the rim");

state.purgeUses = 1;                     // the first use is already spent
state.purgeLatched = false;
state.input.purge = true;
X.updatePurge(state);
H.eq(state.purgeUses, 2, "the second use is spent");
H.eq(X.purgeTarget(state), null,
     "⛔ purgeTarget skips it entirely — there is nothing purgeable left to pick");
H.eq(tallest.dead, false, "⛔ the Thorn is not the victim, though it is nearest the rim");
H.eq(behindIt.dead, true, "the victim is the purgeable enemy behind it");

// ---------------------------------------------------------------------------
// ⛔ it does not block the clear (GDD 2, 5, 6.5)
// ---------------------------------------------------------------------------

well = useWell(0);
state.skimmer.lane = 0;
const fullLength = thorn(4, C.THORN_MAX);
state.spawn.remaining = 0;
H.eq(state.enemies.length, 1, "a full-length Thorn and nothing else alive");
H.eq(X.wellCleared(state), true,
     "⛔ the well CLEARS — blocksClear is false, and that is why a Thorn is " +
     "standing there when the Dive starts (GDD 5)");

X.spawnEnemy("vaulter", 7, 0.2);
H.eq(X.wellCleared(state), false, "a Vaulter beside it does hold the well open");
H.eq(fullLength.dead, false, "and the Thorn is untouched by either answer");

// The other half of the two conditions: an unspent quota holds it open too.
state.enemies = state.enemies.filter(e => e instanceof X.Thorn);
state.spawn.remaining = 1;
H.eq(X.wellCleared(state), false, "⛔ and an unspent quota still holds it — two conditions");

// ---------------------------------------------------------------------------
// the chip economy (GDD 4.2) — ⚠ SETTLED, emergent, not to be smoothed out
// ---------------------------------------------------------------------------
//
// ⛔ A SHOT STOPS AT THE TIP, and the proof needs something BEHIND the tip that
// WOULD have died. "The Thorn was chipped" alone does not say the shot stopped
// — it says the shot arrived.

well = useWell(0);
state.skimmer.lane = 5;
const chipped = thorn(5, 0.60);
const sheltered = X.spawnEnemy("vaulter", 5, 0.30);
const round = new X.Shot(well, 5);
round.t = (1 - 0.60) * C.SHOT_TIME;      // arriving exactly at the tip
state.shots.push(round);

X.collideShots(state, well);
H.close(chipped.depth, 0.60 - C.THORN_CHIP, 1e-12,
        "⛔ one shot chips EXACTLY C.THORN_CHIP off the tip");
H.eq(chipped.dead, false, "and the Thorn is still standing");
H.eq(round.dead, true, "⛔ the shot is CONSUMED — onShot returns true");
H.eq(sheltered.dead, false,
     "⛔ so it stopped at the tip: the Vaulter sheltering below it is untouched");

// ⛔ AND THE CONSUMED SHOT FREES ITS C.SHOT_MAX SLOT THE SAME STEP. That is
// what makes camping a thorned lane chip fast (GDD 4.2, ⚠ SETTLED as emergent),
// and it is Game.update()'s end-of-frame filter over BOTH arrays that does it —
// so this case has to run a real step rather than the collision pass alone.
well = useWell(0);
state.skimmer.lane = 5;
const slotThorn = thorn(5, 0.60);
const slotShot = new X.Shot(well, 5);
slotShot.t = (1 - 0.60) * C.SHOT_TIME - DT;   // one step short of the tip
state.shots.push(slotShot);
H.eq(state.shots.length, 1, "one shot in flight, one slot spent");
G.update(DT);
H.close(slotThorn.depth, 0.60 - C.THORN_CHIP, 1e-9, "the step lands the chip");
H.eq(state.shots.length, 0,
     "⛔ and the slot is free at the END OF THAT SAME STEP, not the next one");

// ⛔ HELD FIRE CHIPS REPEATEDLY AND KILLS IT, through the real loop: the
// Skimmer's auto-fire, the real cooldown, the real cap, the real collision pass.
// 0.50 of length at 0.08 a chip is seven chips — six leave 0.02 standing and the
// seventh takes it past zero.
//
// ⚠ COUNT CHIPS, NOT SHOTS FIRED. Held fire keeps a pipeline of shots in the
// air, so the shots FIRED by the time the Thorn dies includes everything still
// travelling toward a tip that is no longer there. That is not a rate limit and
// it is not a miss; it is what auto-fire looks like.
const START_LEN = 0.50;
const WANT_CHIPS = Math.ceil(START_LEN / C.THORN_CHIP);
H.eq(WANT_CHIPS, 7, "the fixture's arithmetic: 0.50 of length is seven chips");

well = useWell(0);
state.skimmer.lane = 5;
const camped = thorn(5, START_LEN);
G.input.keyDown(FIRE_KEY);
let chips = 0, steps = 0, oddChip = null;
let len = camped.depth;
while (!camped.dead && steps < 4000) {
  G.update(DT);
  if (camped.depth < len) {
    chips++;
    // The last chip is the one that runs past zero and is clamped there.
    if (!camped.dead && Math.abs((len - camped.depth) - C.THORN_CHIP) > 1e-12) {
      oddChip = `${len} -> ${camped.depth}`;
    }
    len = camped.depth;
  }
  steps++;
}
G.input.keyUp(FIRE_KEY);
H.eq(camped.dead, true, `⛔ held fire kills a Thorn (after ${steps} steps)`);
H.eq(chips, WANT_CHIPS,
     `⛔ in exactly ${WANT_CHIPS} chips — one per shot that lands, no rate limit anywhere`);
H.assert(oddChip === null, `⛔ and every chip is exactly C.THORN_CHIP (${oddChip})`);

// ⚠ SETTLED — GDD 4.2's RAPID CHIP-AWAY, stated as the thing it actually is: a
// consumed shot frees its C.SHOT_MAX slot the same step, so the chips arrive
// pipelined at the FIRE rate rather than serialized at the FLIGHT rate. Seven
// sequential round trips would be seven times C.SHOT_TIME; this is well inside
// that, and it must not be rate-limited back out.
const serialSteps = WANT_CHIPS * (C.SHOT_TIME / DT);
H.assert(steps < serialSteps,
         `⚠ and it chips FAST — ${steps} steps against ${Math.round(serialSteps)} for the ` +
         `same shots fired one at a time. Emergent, in the original, not a bug (GDD 4.2)`);

// ⛔ CHIPPED PAST ZERO, IT DIES — and its length is left at zero rather than
// negative. depth < 0 is no more legal than depth > 1 (GDD 3.2).
well = useWell(0);
const stub = thorn(2, C.THORN_CHIP / 2);
H.eq(stub.onShot(null), true, "the last chip consumes its shot like every other");
H.eq(stub.dead, true, "⛔ a Thorn chipped past zero dies");
H.eq(stub.depth, 0, "⛔ and is left at zero length, never negative");

const exact = new X.Thorn(2, C.THORN_CHIP);
exact.onShot(null);
H.eq(exact.dead, true, "⛔ 'zero or below' — a Thorn chipped to exactly zero dies too");

// ---------------------------------------------------------------------------
// ⛔ anchored, through the REAL death path (GDD 4.4, 6.5)
// ---------------------------------------------------------------------------
//
// ⛔ THIS IS THE CASE CS004 P1 EXISTS FOR, AND THE ONLY PROOF THAT WORKS IS THE
// LIVE ONE. GDD 4.4's rim push clamps every unanchored entity's depth down to
// C.RESPAWN_PUSH_DEPTH on every player death. On a Thorn that would not be a
// push, it would be a free chip of 0.35 — silently, in the one place nobody
// would look. The control Vaulter in the same run is what proves the push
// actually ran, so "the Thorn is unchanged" cannot pass by the death not
// happening.

well = useWell(0);
state.skimmer.lane = 0;
const anchoredThorn = thorn(6, 0.9);
// ⛔ AN INERT CONTROL, not a Vaulter: the push and the entity pass run in the
// same step, so a climbing control would read 0.553 and the case would be about
// C.VAULT_CLIMB instead of about the clamp. The base Enemy is unanchored and
// does not move, which is exactly the comparison this needs.
const control = new X.Enemy(8, 0.9);
state.enemies.push(control);
const killer = X.spawnEnemy("vaulter", 0, 0);
killer.depth = killer.killDepth;         // lethal contact in the craft's lane
const livesBefore = state.lives;

let n = 0;
while (!state.skimmer.dead && n < 60) { G.update(DT); n++; }
H.eq(state.skimmer.dead, true, "the craft died through the real collision pass");
H.eq(state.lives, livesBefore - 1, "and it cost a life, through the real killSkimmer()");

const diedAs = state.skimmer;
G.update(DT);                            // ⛔ the first live step after the death
H.assert(state.skimmer !== diedAs, "the next step respawns — GDD 4.4's live path");
H.eq(control.depth, C.RESPAWN_PUSH_DEPTH,
     "⛔ the rim push really ran: the unanchored control at 0.9 came down to 0.55");
H.eq(anchoredThorn.depth, 0.9,
     "⛔ AND THE THORN AT 0.9 IS EXACTLY 0.9 — a length is not a position, and " +
     "clamping one is a free chip nobody earned (GDD 6.5's `anchored`)");
H.eq(anchoredThorn.dead, false, "it was skipped by the push, not removed by it");

// ---------------------------------------------------------------------------
// the Weaver's lay (GDD 6.1, 8) — P3's hook, filled
// ---------------------------------------------------------------------------
//
// ⛔ THE TIP TRACKS THE WEAVER'S OWN DEPTH WHILE IT CLIMBS. Every step of the
// climb, and nowhere else — so what a Weaver leaves is exactly how far it got.

well = useWell(0);
state.skimmer.lane = 0;
const layer = new X.Weaver(5, 0);
state.enemies.push(layer);
H.eq(thornsOn(state.enemies).length, 0, "no Thorn before the Weaver has moved");

layer.update(DT, well, state);
let laid = thornsOn(state.enemies);
H.eq(laid.length, 1, "⛔ one climb step stands a Thorn up in its lane");
H.eq(laid[0].lane, 5, "in the Weaver's own lane");
H.assert(layer.thorn === laid[0], "and the Weaver holds the one it is growing");

let tracked = true;
for (let i = 0; i < 200 && layer.phase === "climb"; i++) {
  layer.update(DT, well, state);
  if (!Object.is(layer.thorn.depth, layer.depth)) tracked = false;
}
H.assert(tracked, "⛔ the tip tracks the Weaver's depth exactly, every step of the climb");
H.eq(layer.phase, "hold", "the climb ended at the apex, as P3 built it");
H.close(layer.thorn.depth, C.WEAVER_APEX, 1e-12,
        "⛔ so a Weaver that reached the apex leaves exactly C.WEAVER_APEX of Thorn");

// ⛔ AND IT ONLY EVER GROWS. The cycle sends the Weaver back to the throat, and
// an unconditional `thorn.depth = tip` would saw the segment down to nothing on
// the second climb — the Weaver eating its own work while the player watches.
const grown = layer.thorn;
let shrank = null;
let low = grown.depth;
for (let i = 0; i < 3000; i++) {
  layer.update(DT, well, state);
  if (grown.depth < low - 1e-12) shrank = `${low} -> ${grown.depth} at tick ${i}`;
  if (grown.depth < low) low = grown.depth;
  state.enemies = state.enemies.filter(e => !(e instanceof X.WeaverBolt));
}
H.assert(shrank === null, `⛔ the Thorn never shortens as the Weaver cycles (${shrank})`);
H.eq(thornsOn(state.enemies).length, 1,
     "⛔ and three thousand ticks of cycling produce exactly ONE Thorn, not one per cycle");

// ⛔ CLAMPED TO C.THORN_MAX — GDD 8's "clamp: lane length".
//
// ⚠ AT SHIPPED VALUES THIS CLAMP IS NOT OBSERVABLE. C.THORN_MAX is 1.00, which
// is also the depth ceiling, and C.WEAVER_APEX is 0.55 — so nothing a Weaver
// can do reaches it. It becomes live the moment CS007 heat-derives either
// number, which is precisely when a missing clamp would be found the hard way.
// So the constant is lowered here, the clamp is driven, and it is put back.
const realMax = C.THORN_MAX;
try {
  C.THORN_MAX = 0.30;
  H.assert(C.THORN_MAX < C.WEAVER_APEX, "the fixture puts the clamp inside the climb");
  well = useWell(0);
  state.skimmer.lane = 0;
  const capped = new X.Weaver(7, 0);
  state.enemies.push(capped);
  let over = null;
  for (let i = 0; i < 400 && capped.phase === "climb"; i++) {
    capped.update(DT, well, state);
    if (capped.thorn && capped.thorn.depth > C.THORN_MAX + 1e-12) over = capped.thorn.depth;
  }
  H.assert(over === null, `⛔ the tip never passes C.THORN_MAX (reached ${over})`);
  H.eq(capped.thorn.depth, C.THORN_MAX,
       "⛔ it stops AT the clamp, and the Weaver climbs on past it without it");
  H.assert(capped.depth > C.THORN_MAX,
           "the Weaver really did climb above the clamp — the case is not vacuous");
} finally {
  C.THORN_MAX = realMax;
}
H.eq(C.THORN_MAX, 1.00, "and the constant is put back for everything after this");

// ⛔ A WEAVER KILLED MID-CLIMB LEAVES ITS THORN AT THE LENGTH IT REACHED.
well = useWell(0);
state.skimmer.lane = 0;
const doomed = new X.Weaver(3, 0);
state.enemies.push(doomed);
for (let i = 0; i < 60; i++) doomed.update(DT, well, state);
const orphan = doomed.thorn;
const reached = orphan.depth;
H.assert(reached > 0 && reached < C.WEAVER_APEX, "the Weaver is caught partway up");
H.eq(doomed.onShot(null), true, "a shot kills the Weaver and is consumed");
state.enemies = state.enemies.filter(e => !e.dead);
H.eq(thornsOn(state.enemies).length, 1, "⛔ its Thorn is still standing");
H.eq(orphan.depth, reached,
     "⛔ at exactly the length it had reached — the lay is not undone by the death");
for (let i = 0; i < 600; i++) orphan.update(DT, well, state);
H.eq(orphan.depth, reached, "and it stays there: nothing is growing it any more");

// ---------------------------------------------------------------------------
// ⛔ adoption — a second Weaver extends the first one's Thorn (GDD 1.1 P2)
// ---------------------------------------------------------------------------
//
// ⛔ TWO OVERLAPPING THORNS ARE TWO HIT-POINT POOLS BEHIND ONE SILHOUETTE. The
// player cannot see how much is left (P2), and CS008 pays per chip, so it is a
// scoring oddity at the same time.

well = useWell(0);
state.skimmer.lane = 0;
const first = new X.Weaver(4, 0);
state.enemies.push(first);
for (let i = 0; i < 80; i++) first.update(DT, well, state);
const shared = first.thorn;
H.eq(thornsOn(state.enemies).length, 1, "the first Weaver has a Thorn going");

const second = new X.Weaver(4, 0);
state.enemies.push(second);
second.update(DT, well, state);
H.eq(thornsOn(state.enemies).length, 1,
     "⛔ a second Weaver in the same lane creates NO second Thorn");
H.assert(second.thorn === shared, "⛔ it adopted the one already standing there");

// It extends it rather than resetting it: the newcomer is below the tip, and a
// grow-only rule means it contributes nothing until it climbs past.
const heldAt = shared.depth;
for (let i = 0; i < 30; i++) second.update(DT, well, state);
H.assert(shared.depth >= heldAt,
         "⛔ and a newcomer climbing BELOW the tip does not drag it back down");
let passed = 0;
while (second.depth < shared.depth && passed < 400) { second.update(DT, well, state); passed++; }
for (let i = 0; i < 30; i++) second.update(DT, well, state);
H.assert(shared.depth > heldAt,
         "⛔ but once it climbs past the tip, it extends the same segment");

// A Weaver in a DIFFERENT lane lays its own, which is the other half of the rule.
const elsewhere = new X.Weaver(9, 0);
state.enemies.push(elsewhere);
elsewhere.update(DT, well, state);
H.eq(thornsOn(state.enemies).length, 2, "a Weaver in another lane lays its own");
H.assert(elsewhere.thorn !== shared, "and it is a different segment");

// A Thorn that has been shot away is not adopted: the Weaver stands a new one up.
well = useWell(0);
state.skimmer.lane = 0;
const persistent = new X.Weaver(6, 0);
state.enemies.push(persistent);
for (let i = 0; i < 40; i++) persistent.update(DT, well, state);
const destroyed = persistent.thorn;
destroyed.dead = true;
state.enemies = state.enemies.filter(e => !e.dead);
persistent.update(DT, well, state);
H.eq(thornsOn(state.enemies).length, 1, "a Weaver whose Thorn was shot away lays another");
H.assert(persistent.thorn !== destroyed, "⛔ and does not keep growing a dead one");

// ⛔ thornInLane USES laneDelta, NEVER A BARE SUBTRACTION. On a closed well the
// seam is a neighbourhood: a Thorn at lane 15.8 of a 16-lane Ring is a third of
// a lane from lane 0.1, and `a - b` says fifteen and two thirds. Fractional
// lanes are not hypothetical — the debug bench spawns in the Skimmer's
// CONTINUOUS lane.
const ring = useWell(0);
H.assert(ring.closed && ring.lanes === 16, "the seam case is on a closed 16-lane well");
state.enemies = [];
const seamThorn = new X.Thorn(15.8, 0.4);
state.enemies.push(seamThorn);
H.assert(X.thornInLane(state, ring, 0.1) === seamThorn,
         "⛔ a Thorn across the seam IS in this lane — laneDelta, not (a - b)");
H.eq(X.thornInLane(state, ring, 8), null, "and one half the well away is not");
H.eq(X.thornInLane(state, ring, 14.8), null,
     "⛔ nor is one a whole lane away — the tolerance is C.HIT_LANE_TOL, the " +
     "same 'same lane' the collision pass uses");
seamThorn.dead = true;
H.eq(X.thornInLane(state, ring, 15.8), null, "⛔ and a dead Thorn is never adopted");

// ---------------------------------------------------------------------------
// the draw (GDD 10.2, 10.3)
// ---------------------------------------------------------------------------

const ctx = X._env.canvas.getContext("2d");

// glowStroke strokes twice per call, at C.GLOW_WIDE_ALPHA*a then 1*a, so the
// alphas a draw reaches for are readable off the stub. The ctx is a Proxy whose
// members are assignable, which is the only reason any of this is measurable.
function strokes(fn) {
  const prevStroke = ctx.stroke;
  const prevBegin = ctx.beginPath;
  const out = { alphas: [], widths: [], ops: [], paths: 0 };
  ctx.beginPath = () => { out.paths++; };
  ctx.stroke = () => {
    out.alphas.push(ctx.globalAlpha);
    out.widths.push(ctx.lineWidth);
    out.ops.push(ctx.globalCompositeOperation);
  };
  try { fn(); } finally { ctx.stroke = prevStroke; ctx.beginPath = prevBegin; }
  return out;
}

const openWell = X.WELLS.find(w => !w.closed);
H.assert(!!openWell, "an open well is available for the draw case");

const mid = strokes(() => X.drawThorn(ctx, X.WELLS[0], 4, 0.6));
H.eq(mid.paths, 2,
     "⛔ TWO paths: the body from the throat to the tip, and the tip segment again");
H.eq(mid.alphas.length, 4, "each stroked twice by glowStroke (GDD 10.2's two-pass glow)");

// ⛔ FULL ALPHA AT EVERY DEPTH, THE THROAT ZONE INCLUDED. GDD 10.3 governs what
// is drawn OVER that zone; a Thorn is lane geometry, exactly as a Vaulter is the
// approaching thing the rule protects. drawShot() fades and this must not.
const deep = strokes(() => X.drawThorn(ctx, X.WELLS[0], 4, C.READABILITY_DEPTH / 2));
H.assert(deep.alphas.length === 4 && deep.alphas.every((a, i) => Object.is(a, mid.alphas[i])),
         "⛔ a Thorn well inside C.READABILITY_DEPTH is drawn at the SAME alphas as one " +
         "at 0.6 — no shotAlpha()-style fade (GDD 10.3)");

// The tip is brighter because it is drawn over the body with `lighter`, and it
// is the wider of the two strokes — the weight of the tip's own depth against
// the body's midpoint, the way the well's spokes take a midpoint weight.
H.assert(mid.widths[2] > mid.widths[0],
         "⛔ the tip stroke is wider than the body's — it is the thing being aimed at");
H.assert(mid.ops.every(op => op === "lighter"),
         "⚠ every stroke composites additively, which is what makes the twice-drawn tip " +
         "brighter without a second colour or an alpha split");

const none = strokes(() => X.drawThorn(ctx, X.WELLS[0], 4, 0));
H.eq(none.paths, 0,
     "⛔ a Thorn with no length yet draws NOTHING — the step a Weaver stands one up");

// The whole path, headless, on a closed and an open well, across the range.
let drew = true;
try {
  for (const w of [X.WELLS[0], openWell]) {
    for (const d of [0.001, C.THORN_TIP_LEN / 2, 0.25, 0.6, 1]) {
      for (const lane of [0, w.lanes - 1, 1.5]) X.drawThorn(ctx, w, lane, d);
    }
  }
} catch (e) {
  drew = false;
  H.assert(false, `a Thorn draw threw: ${e && e.message}`);
}
H.assert(drew, "the segment draws on a closed and an open well, at every length");

// ⛔ NO PER-FRAME ALLOCATION. The scratch points and both point PAIRS are
// module-level, so a hundred draws hand drawPoly the same two arrays every time.
let sameShape = true;
const capture = [];
const prevLineTo = ctx.lineTo;
ctx.lineTo = (x, y) => capture.push(x);
for (let i = 0; i < 100; i++) X.drawThorn(ctx, X.WELLS[0], 4, 0.6);
ctx.lineTo = prevLineTo;
for (let i = 2; i < capture.length; i++) if (!Object.is(capture[i], capture[i % 2])) sameShape = false;
H.assert(sameShape && capture.length === 200,
         "⛔ a hundred draws produce identical geometry from the same preallocated scratch");

// ---------------------------------------------------------------------------
// the debug bench key that P1 left dark (GDD 9.5) — ⚠ TEMPORARY
// ---------------------------------------------------------------------------
//
// P1 wired "4" to spawnThorn and left it a no-op because no kind answered to it.
// It answers now, and "4" was the last dark digit — test-cs004-p1.js's unbuilt-
// kind case is deleted rather than looping over nothing.
//
// ⚠ THE BENCH SPAWNS AT DEPTH 0, WHICH ON A THORN IS ZERO LENGTH. That is
// deliberate and it is the same literal every other digit uses: a Thorn enters
// near the throat and is GROWN, which is exactly why GDD 6.3's safe-spawn rule
// can never shorten one. Pressing "4" therefore puts a real, live, invisible
// Thorn on the board — press "3" and watch a Weaver grow one, or "0" for the
// staggered row, to actually see one.

useWell(0);
H.eq(state.enemies.length, 0, "the bench case starts on an empty board");
G.input.keyDown("4");
H.eq(state.enemies.length, 0,
     "⛔ a keydown spawns nothing at event time — named actions are dispatched inside sample()");
G.update(DT);
G.input.keyUp("4");
H.eq(thornsOn(state.enemies).length, 1, "and exactly one Thorn after the step that sampled it");
H.eq(state.enemies[0].depth, 0, "⚠ at zero length — it is grown, never dropped finished");

H.report("test-cs004-p4.js");
