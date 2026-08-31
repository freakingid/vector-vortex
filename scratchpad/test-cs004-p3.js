// test-cs004-p3.js — CS004 P3: the Weaver, its bolt, and GDD 4.5's fourth
// death condition (GDD 6.1, 6.3, 6.5, 4.5, 4.3, 10.2, 18).
//
// Asserts what P3 owns. It makes no claim about the Thorn, the Drifter, the
// Surger or scoring — none of those exist.
//
// ⛔ FIVE TRAPS IN THE FIXTURES.
//  1. Boot calls startGame(), so the live state at load is a run in progress.
//     Every case starts from useWell(), which is G.reset() + startGame() +
//     enterWell(), then silences the spawner and expires the respawn
//     invulnerability — a craft born invulnerable cannot be killed, and half
//     this file is about killing one.
//  2. Weaver.fire() goes through spawnEnemy(), which reads the GLOBAL state and
//     WELLS[state.wellIndex]. A cycle driven on a well the state does not point
//     at would put its bolts somewhere else. Cases that fire drive the well the
//     state is on.
//  3. The Weaver's body is the roster's first null killDepth, so "does not
//     kill" is asserted through the REAL collideSkimmer — a hand-rolled depth
//     comparison would pass no matter what the field held.
//  4. The bolt's onShot returns FALSE, so a shot is not consumed. The proof
//     needs something behind it that WOULD consume, or "not consumed" is
//     indistinguishable from "never overlapped".
//  5. entityPoints() returns a scratch array that is SHARED per poly, so every
//     silhouette case copies out of it before asking a second question.
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
  state.purgeUses = 0;
  state.purgeLatched = true;
  state.input.purge = false;
  state.invulnTime = C.RESPAWN_INVULN;   // fixture: expired, i.e. vulnerable
  G.input.reset();
  return X.WELLS[state.wellIndex];
}

// A stub that never moves and never consumes a shot.
function stub(lane, depth) {
  const e = new X.Enemy(lane, depth);
  state.enemies.push(e);
  return e;
}

// ---------------------------------------------------------------------------
// the constants and the two kind rows
// ---------------------------------------------------------------------------

H.eq(C.WEAVER_SIZE, 0.62, "C.WEAVER_SIZE");
H.eq(C.WEAVER_CLIMB, 0.22, "C.WEAVER_CLIMB");
H.eq(C.WEAVER_RETREAT, 0.34, "C.WEAVER_RETREAT");
H.eq(C.WEAVER_APEX, 0.55, "⚠ C.WEAVER_APEX — flat here, heat-derived in CS006");
H.eq(C.WEAVER_APEX_HOLD, 0.35, "C.WEAVER_APEX_HOLD");
H.eq(C.WEAVER_BOLT_SPEED, 0.32, "C.WEAVER_BOLT_SPEED");
H.eq(C.WEAVER_BOLT_SIZE, 0.30, "C.WEAVER_BOLT_SIZE");

H.assert(C.WEAVER_RETREAT > C.WEAVER_CLIMB,
         "⛔ leaving is FASTER than arriving — the retreat reads as a beat, not a second approach");
H.assert(C.WEAVER_APEX > 0 && C.WEAVER_APEX < 1,
         "the apex is partway up the well — GDD 6.1's 'climbs partway'");

H.assert("weaver" in X.ENEMY_KINDS, "⛔ the Weaver is an ENEMY_KINDS row");
H.assert("weaverBolt" in X.ENEMY_KINDS,
         "⛔ and so is the bolt — it enters through spawnEnemy() like everything else");

// ---------------------------------------------------------------------------
// the contract fields (GDD 6.5)
// ---------------------------------------------------------------------------

let well = useWell(0);
const wProbe = X.spawnEnemy("weaver", 3, 0);
H.assert(wProbe !== null && wProbe instanceof X.Weaver, "a Weaver spawns through spawnEnemy()");
H.eq(wProbe.killDepth, null,
     "⛔ killDepth is null — the roster's first, and GDD 4.5 item 4 is the PROJECTILE, not the body");
H.eq(wProbe.blocksClear, true,
     "⛔ blocksClear stays true — a Weaver you never shoot is an enemy you never answered");
H.eq(wProbe.purgeable, true, "the Purge destroys it (GDD 4.3)");
H.eq(wProbe.anchored, false, "⛔ not anchored — its depth is a POSITION, not a length");

const bProbe = X.spawnEnemy("weaverBolt", 3, 0.5);
H.assert(bProbe !== null && bProbe instanceof X.WeaverBolt, "a bolt spawns through spawnEnemy() too");
H.eq(bProbe.killDepth, 1 - C.RIM_CONTACT_DEPTH,
     "⛔ the bolt's killDepth is 1 - C.RIM_CONTACT_DEPTH — retuning the band moves it too");
H.eq(bProbe.blocksClear, false,
     "⛔ blocksClear is false — a bolt in flight must not hold a cleared well open");
H.eq(bProbe.purgeable, true, "⛔ purgeable — the panic button saves you from it (GDD 4.3)");
H.eq(bProbe.anchored, false, "not anchored either");

// ---------------------------------------------------------------------------
// the cycle — climb, hold, one bolt, retreat, repeat
// ---------------------------------------------------------------------------
//
// ⛔ 5,000 TICKS, DRIVEN THROUGH Weaver.update() ON THE LIVE WELL, because
// fire() goes through spawnEnemy() and spawnEnemy() reads the global state.
// Every transition is recorded, so the assertions below are about the SEQUENCE
// and not about a snapshot that happened to look right.

well = useWell(0);
state.skimmer.lane = 0;                  // out of lane 5, so no safe-spawn lowering
const cy = new X.Weaver(5, 0);
state.enemies.push(cy);

const TICKS = 5000;
const order = [];                        // phase transitions, in order
const boltsPerCycle = [];                // bolts fired between two climb starts
let cycleBolts = 0, cycles = 0;
let depthLow = Infinity, depthHigh = -Infinity;
let phase = cy.phase;
let holdSteps = 0, holdStepsSeen = null;
let climbedBackwards = false, retreatedForwards = false;
let lastDepth = cy.depth;

for (let i = 0; i < TICKS; i++) {
  cy.update(DT, well, state);
  // ⚠ COUNT BOLTS, NOT ARRAY GROWTH. This was `state.enemies.length - before`
  // until CS004 P4, and a Weaver now lays a THORN on its first climb step —
  // which grew the array by one and read as a second bolt in the first cycle.
  // The bolts are cleared at the foot of this loop, so anything of that class
  // present here was fired on this step.
  const fired = state.enemies.filter(e => e instanceof X.WeaverBolt).length;
  if (fired > 0) cycleBolts += fired;

  if (cy.depth < depthLow) depthLow = cy.depth;
  if (cy.depth > depthHigh) depthHigh = cy.depth;
  if (phase === "climb" && cy.depth < lastDepth - 1e-12) climbedBackwards = true;
  if (phase === "retreat" && cy.depth > lastDepth + 1e-12) retreatedForwards = true;
  lastDepth = cy.depth;

  if (cy.phase === "hold") holdSteps++;

  if (cy.phase !== phase) {
    order.push(`${phase}->${cy.phase}`);
    if (phase === "hold") { holdStepsSeen = holdSteps; holdSteps = 0; }
    if (cy.phase === "climb") { boltsPerCycle.push(cycleBolts); cycleBolts = 0; cycles++; }
    phase = cy.phase;
  }

  // ⛔ The bolts are cleared out each step so C.ENEMY_CAP can never refuse one
  // and turn "exactly one per cycle" into "zero because the board was full".
  // The cap is asserted on its own below.
  state.enemies = state.enemies.filter(e => !(e instanceof X.WeaverBolt));
}

H.assert(cycles >= 10, `the soak covers at least ten full cycles (got ${cycles})`);
H.assert(depthLow >= 0 && depthHigh <= 1,
         `⛔ depth never leaves [0, 1] over ${TICKS} ticks (got [${depthLow}, ${depthHigh}])`);
H.eq(depthHigh, C.WEAVER_APEX, "⛔ and it stops AT the apex — it never climbs past it");
H.eq(depthLow, 0, "and returns exactly to the throat");
H.assert(!climbedBackwards, "the climb is monotonic");
H.assert(!retreatedForwards, "and so is the retreat");

// ⛔ THE CYCLE IS NAMEABLE: it comes up, it spits, it goes back down, forever.
const wanted = ["climb->hold", "hold->retreat", "retreat->climb"];
let orderBad = null;
for (let i = 0; i < order.length; i++) {
  const want = wanted[i % 3];
  if (order[i] !== want) { orderBad = `step ${i}: ${order[i]}, want ${want}`; break; }
}
H.assert(orderBad === null,
         `⛔ the phases run climb -> hold -> retreat -> climb, in that order, every cycle (${orderBad})`);

// ⛔ EXACTLY ONE BOLT PER CYCLE — not one per step of the hold. A `fired` latch
// that was a cooldown, or a fire() outside the `if (!this.fired)`, gives ~21
// here (C.WEAVER_APEX_HOLD / C.FIXED_DT) and this is the case that says so.
H.assert(boltsPerCycle.length >= 10, "at least ten completed cycles were counted");
H.assert(boltsPerCycle.every(n => n === 1),
         `⛔ EXACTLY ONE bolt per cycle, never one per step of the hold (got [${boltsPerCycle}])`);

H.eq(holdStepsSeen, Math.ceil(C.WEAVER_APEX_HOLD / DT),
     "⛔ the hold lasts C.WEAVER_APEX_HOLD, counted UP (GDD 16.3), not a step more");

// The climb rate itself, exactly, from a fresh Weaver.
well = useWell(0);
const rate = new X.Weaver(4, 0);
for (let i = 0; i < 50; i++) rate.update(DT, well, state);
H.close(rate.depth, 50 * DT * C.WEAVER_CLIMB, 1e-9,
        "⛔ 50 ticks of climb is exactly 50 * dt * C.WEAVER_CLIMB");

// ⛔ A WEAVER THAT ARRIVED ABOVE THE APEX TURNS AROUND FROM WHERE IT IS. The
// debug row stages one as deep as C.SAFE_SPAWN_DEPTH, and CS006 moves the apex
// under live entities. Clamping to the apex on the first step would teleport
// it down the well, which is a position no motion produced.
well = useWell(0);
state.skimmer.lane = 0;
const high = new X.Weaver(6, C.SAFE_SPAWN_DEPTH);
H.assert(C.SAFE_SPAWN_DEPTH > C.WEAVER_APEX, "the fixture really does start above the apex");
high.update(DT, well, state);
H.eq(high.depth, C.SAFE_SPAWN_DEPTH,
     "⛔ the first step does not move it — no teleport down to the apex line");
H.eq(high.phase, "hold", "it goes straight to the hold, and retreats from where it was");

// ---------------------------------------------------------------------------
// ⛔ ONE LANE, NEVER HOPS — exact equality, on all sixteen wells
// ---------------------------------------------------------------------------
//
// ⛔ A RANGE CHECK WOULD NOT DO (test-cs003-p5.js's finding: a wrapped hop on a
// 13-lane strip lands inside [0, 12] and a range check passes). Neither the
// Weaver nor the bolt touches a lane helper at all, so the assertion available
// here is the strong one — the lane it was constructed with, bit for bit, for
// its whole life.

const LANE_TICKS = 3000;
let laneDrift = null;
for (let wi = 0; wi < X.WELLS.length && laneDrift === null; wi++) {
  const w = X.WELLS[wi];
  const starts = [0, Math.floor((w.lanes - 1) / 2), w.lanes - 1, 0.5];
  for (const start of starts) {
    // ⛔ The state is pointed at this well, because fire() spawns into it.
    useWell(wi);
    state.skimmer.lane = start === 0 ? Math.min(4, w.lanes - 1) : 0;
    const weav = new X.Weaver(start, 0);
    for (let i = 0; i < LANE_TICKS && laneDrift === null; i++) {
      weav.update(DT, w, state);
      if (!Object.is(weav.lane, start)) {
        laneDrift = `Weaver: ${w.name} lane ${start} -> ${weav.lane} at tick ${i}`;
      }
      // Every bolt it has fired travels the lane it was fired in, and only it.
      for (const e of state.enemies) {
        if (!(e instanceof X.WeaverBolt)) continue;
        e.update(DT, w, state);
        if (!Object.is(e.lane, start)) {
          laneDrift = `bolt: ${w.name} lane ${start} -> ${e.lane} at tick ${i}`;
        }
      }
      state.enemies = state.enemies.filter(e => !e.dead);
    }
  }
}
H.assert(laneDrift === null,
         `⛔ a Weaver's and a bolt's lane are EXACTLY the lane they entered in, for ` +
         `${LANE_TICKS} ticks, on every well (${laneDrift})`);

// ---------------------------------------------------------------------------
// the bolt's flight (GDD 4.5 item 4)
// ---------------------------------------------------------------------------

well = useWell(0);
const flight = new X.WeaverBolt(3, C.WEAVER_APEX);
for (let i = 0; i < 20; i++) flight.update(DT, well, state);
H.close(flight.depth, C.WEAVER_APEX + 20 * DT * C.WEAVER_BOLT_SPEED, 1e-9,
        "⛔ the bolt travels RIM-WARD at exactly C.WEAVER_BOLT_SPEED");
H.assert(!flight.dead, "and is alive the whole way up");

// ⛔ IT DIES AT depth 1 WHETHER OR NOT IT HIT ANYTHING, so bolts cannot
// accumulate on a board a Weaver is firing into forever.
well = useWell(0);
state.skimmer.lane = 9;                   // ⛔ nowhere near lane 3
const lonely = new X.WeaverBolt(3, 0);
let ticksToDie = 0;
while (!lonely.dead && ticksToDie < 5000) { lonely.update(DT, well, state); ticksToDie++; }
H.assert(lonely.dead, "⛔ a bolt with no Skimmer in its lane still dies");
H.eq(lonely.depth, 1, "⛔ at depth 1 — bolts cannot accumulate");
H.assert(ticksToDie < 5000, `and within one flight (${ticksToDie} ticks)`);

// ---------------------------------------------------------------------------
// ⛔ GDD 4.5 — the body does not kill, the projectile does
// ---------------------------------------------------------------------------
//
// ⛔ THROUGH THE REAL collideSkimmer() AND killSkimmer(). A hand-rolled depth
// comparison here would pass whatever killDepth held, which is the whole thing
// under test.

well = useWell(0);
state.skimmer.lane = 5;
const rimLives = state.lives;
const rimWeaver = new X.Weaver(5, 1);     // at the rim, in the craft's lane
state.enemies.push(rimWeaver);
X.collideSkimmer(state, well);
H.eq(state.skimmer.dead, false,
     "⛔ a Weaver AT THE RIM in the Skimmer's lane does NOT kill — GDD 4.5 lists its projectile");
H.eq(state.lives, rimLives, "and no life was spent");

// Every depth, not just the rim: null means contact never kills, anywhere.
let bodyKilled = null;
for (const d of [0, 0.25, 0.5, 0.75, 0.95, 1]) {
  well = useWell(0);
  state.skimmer.lane = 5;
  const body = new X.Weaver(5, d);
  state.enemies.push(body);
  X.collideSkimmer(state, well);
  if (state.skimmer.dead) bodyKilled = d;
}
H.assert(bodyKilled === null,
         `⛔ and at no depth at all (killed at ${bodyKilled}) — null is "contact never kills"`);

// The bolt, the other way round: GDD 4.5's FOURTH DEATH CONDITION, live.
well = useWell(0);
state.skimmer.lane = 5;
const livesBefore = state.lives;
const killer = new X.WeaverBolt(5, 1 - C.RIM_CONTACT_DEPTH);
state.enemies.push(killer);
X.collideSkimmer(state, well);
H.eq(state.skimmer.dead, true,
     "⛔ a bolt at the rim band in the Skimmer's lane KILLS — GDD 4.5 item 4, live");
H.eq(state.lives, livesBefore - 1, "and it costs a life, through the real killSkimmer()");

// It is the rim BAND, not the rim: a bolt still climbing is harmless.
well = useWell(0);
state.skimmer.lane = 5;
const early = new X.WeaverBolt(5, 1 - C.RIM_CONTACT_DEPTH - 0.01);
state.enemies.push(early);
X.collideSkimmer(state, well);
H.eq(state.skimmer.dead, false,
     "a bolt one step below the band is not lethal yet — the band is the rule, not the lane");

// And out of the lane it is harmless at the rim itself.
well = useWell(0);
state.skimmer.lane = 5;
const wide = new X.WeaverBolt(9, 1);
state.enemies.push(wide);
X.collideSkimmer(state, well);
H.eq(state.skimmer.dead, false, "a bolt in another lane is harmless at any depth");

// ⛔ END TO END, through Game.update(): a bolt fired in the craft's lane climbs
// and kills, with no new collision code anywhere.
well = useWell(0);
state.skimmer.lane = 7;
const runner = X.spawnEnemy("weaverBolt", 7, 0.80);
H.assert(runner !== null, "the bolt is on the board");
let steps = 0;
while (!state.skimmer.dead && steps < 600) { G.update(DT); steps++; }
H.eq(state.skimmer.dead, true,
     "⛔ a bolt climbing into the craft's lane kills it through the real loop");

// ---------------------------------------------------------------------------
// the well-clear condition (GDD 2, 6.5)
// ---------------------------------------------------------------------------

well = useWell(0);
state.skimmer.lane = 0;
const blocker = X.spawnEnemy("weaver", 4, 0.2);
H.eq(X.wellCleared(state), false,
     "⛔ a well does not clear with a Weaver alive — blocksClear is true");
blocker.dead = true;
state.enemies = state.enemies.filter(e => !e.dead);
H.eq(X.wellCleared(state), true, "and clears once it is gone");

X.spawnEnemy("weaverBolt", 4, 0.2);
H.eq(state.enemies.length, 1, "a bolt is on the board");
H.eq(X.wellCleared(state), true,
     "⛔ but a bolt in flight does NOT hold the well open — blocksClear is false");

// ---------------------------------------------------------------------------
// ⚠ SETTLED — the bolt is NOT shootable
// ---------------------------------------------------------------------------
//
// ⛔ THE PROOF NEEDS SOMETHING BEHIND IT. "The shot was not consumed" is
// indistinguishable from "the shot never overlapped" unless the shot goes on to
// meet something that WOULD consume it. A Vaulter is staged behind the bolt,
// deeper down the same lane, and the shot reaches it on a later step — which is
// also the proof that a declined shot flies ON rather than stopping.

well = useWell(0);
state.skimmer.lane = 0;
const shielded = X.spawnEnemy("weaverBolt", 6, 0.60);
const behind = X.spawnEnemy("vaulter", 6, 0.40);
const bullet = new X.Shot(well, 6);
bullet.t = (1 - 0.60) * C.SHOT_TIME;          // arriving at the bolt's depth
state.shots.push(bullet);

X.collideShots(state, well);
H.eq(bullet.dead, false,
     "⚠ a shot fired through a bolt is NOT consumed — onShot returns false (GDD 6.5)");
H.eq(shielded.dead, false, "⛔ and the bolt is untouched — it is not shootable at all");
H.eq(behind.dead, false,
     "⚠ but the shot resolved against the bolt THIS step and stopped there — the " +
     "`break` in collideShots is unconditional, so a bolt briefly shields. Not a bug.");

// It flies on, and kills what is behind it, a few steps later.
let flew = 0;
while (!behind.dead && flew < 200) {
  bullet.update(DT);
  X.collideShots(state, well);
  flew++;
}
H.eq(behind.dead, true,
     "⛔ the shot flew ON and killed the Vaulter behind the bolt — declining is not stopping");
H.eq(bullet.dead, true, "and was consumed by the thing that does consume");
H.assert(flew < 200, `within one flight (${flew} steps)`);

// ---------------------------------------------------------------------------
// ⛔ the Purge destroys bolts (GDD 4.3)
// ---------------------------------------------------------------------------

well = useWell(0);
state.skimmer.lane = 0;
for (let i = 0; i < 4; i++) X.spawnEnemy("weaverBolt", 3 + i, 0.3 + i * 0.05);
X.spawnEnemy("weaver", 9, 0.2);
H.eq(state.enemies.length, 5, "a board of four bolts and a Weaver");
state.purgeUses = 0;
state.purgeLatched = false;
state.input.purge = true;
X.updatePurge(state);
state.enemies = state.enemies.filter(e => !e.dead);
H.eq(state.enemies.length, 0,
     "⛔ one Purge clears both — the panic button saves you from a bolt, which is what it is for");

// ---------------------------------------------------------------------------
// ⛔ the bolt enters through spawnEnemy() — the cap and the safe-spawn rule
// ---------------------------------------------------------------------------
//
// ⛔ MUTATION CHECK. A fire() that pushed straight into state.enemies walks past
// C.ENEMY_CAP and past GDD 6.3's safe-spawn rule, and "it is only a projectile"
// is exactly the bypass the one entry point exists to prevent.

well = useWell(0);
state.skimmer.lane = 0;
const capped = new X.Weaver(5, C.WEAVER_APEX);
state.enemies.push(capped);
while (state.enemies.length < C.ENEMY_CAP) stub(9, 0.2);
H.eq(state.enemies.length, C.ENEMY_CAP, "the board is staged at the cap");
capped.update(DT, well, state);          // climb -> hold
capped.update(DT, well, state);          // the firing step
H.eq(state.enemies.length, C.ENEMY_CAP,
     "⛔ a bolt fired on a full board never reaches it — spawnEnemy() refuses above the cap");
H.eq(capped.fired, true,
     "⛔ and the cycle moves on: a blocked shot is a lost beat, never a bolt held over");

// GDD 6.3's safe-spawn rule reaches the bolt too. A Weaver staged above
// C.SAFE_SPAWN_DEPTH in the craft's lane fires a bolt that is LOWERED to the
// safe line rather than starting on top of the craft — which only ever gives the
// player more time.
well = useWell(0);
state.skimmer.lane = 5;
const close = new X.Weaver(5, 0.90);
state.enemies.push(close);
close.update(DT, well, state);           // -> hold
close.update(DT, well, state);           // fires
const lowered = state.enemies.filter(e => e instanceof X.WeaverBolt);
H.eq(lowered.length, 1, "the Weaver fired exactly one bolt");
H.eq(lowered[0].depth, C.SAFE_SPAWN_DEPTH,
     "⛔ and it was LOWERED to C.SAFE_SPAWN_DEPTH (GDD 6.3), never relocated sideways");
H.eq(lowered[0].lane, 5, "⛔ in the lane it was fired in — the rule is a depth clamp");
H.assert(lowered[0].depth < lowered[0].killDepth, "so it cannot kill on the step it arrives");

// ---------------------------------------------------------------------------
// the silhouettes (GDD 6.1, 10.2, 18)
// ---------------------------------------------------------------------------

const ctx = X._env.canvas.getContext("2d");

H.assert(Array.isArray(X.WEAVER_POLY) && X.WEAVER_POLY.length >= 6,
         "the spiral is a local-space point array");
H.assert(X.WEAVER_POLY.every(q => isFinite(q.l) && isFinite(q.d)),
         "⛔ in (l, d) — lane offset and depth offset, never a screen coordinate");
H.assert(Array.isArray(X.WEAVER_BOLT_POLY) && X.WEAVER_BOLT_POLY.length >= 3,
         "and the bolt is a second, smaller point array");

// C.WEAVER_SIZE means "the lane widths the shape spans", which is only true if
// the poly actually reaches ±1 across the lanes.
for (const [name, poly] of [["WEAVER_POLY", X.WEAVER_POLY], ["WEAVER_BOLT_POLY", X.WEAVER_BOLT_POLY]]) {
  const ls = poly.map(q => q.l);
  H.close(Math.min(...ls), -1, 1e-12, `${name} reaches -1 across the lanes`);
  H.close(Math.max(...ls), 1, 1e-12, `${name} reaches +1, so its SIZE constant means lane widths`);
}

// ⛔ THE OPEN PATH. drawPoly closes a path with ctx.closePath() and only when
// its `closed` argument is true, so counting that call is what says the Weaver
// is drawn open and the bolt closed. The ctx stub is a Proxy whose members are
// assignable, which is the only reason this is measurable at all.
function closePaths(fn) {
  const prev = ctx.closePath;
  let n = 0;
  ctx.closePath = () => { n++; };
  try { fn(); } finally { ctx.closePath = prev; }
  return n;
}
H.eq(closePaths(() => X.drawWeaver(ctx, X.WELLS[0], 4, 0.4)), 0,
     "⛔ the Weaver is drawn as an OPEN path — a spiral that closes is nested boxes");
H.eq(closePaths(() => X.drawWeaverBolt(ctx, X.WELLS[0], 4, 0.4)), 1,
     "and the bolt is closed — it is a dart, not a stroke");

// ⛔ entityPoints memoizes ONE scratch array per poly, so every reading is
// copied out before the next call overwrites it.
function spanOf(w, lane, depth, poly, size) {
  const pts = X.entityPoints(w, lane, depth, poly, size).map(p => ({ x: p.x, y: p.y }));
  const c = X.screenPos(w, lane, depth, { x: 0, y: 0 });
  let max = 0, bad = false;
  for (const p of pts) {
    if (!isFinite(p.x) || !isFinite(p.y)) bad = true;
    const r = Math.hypot(p.x - c.x, p.y - c.y);
    if (r > max) max = r;
  }
  return { max, bad };
}

const ring = X.WELLS[0];
const vee = X.WELLS.find(w => w.name === "Vee");
for (const d of [0.05, 0.3, 0.6, 1.0]) {
  const spiral = spanOf(ring, 4, d, X.WEAVER_POLY, C.WEAVER_SIZE);
  const dart = spanOf(ring, 4, d, X.WEAVER_BOLT_POLY, C.WEAVER_BOLT_SIZE);
  H.assert(!spiral.bad && !dart.bad, `depth ${d}: every projected point is finite`);
  H.assert(spiral.max > 0, `depth ${d}: the spiral has extent`);
  H.assert(dart.max > 0, `depth ${d}: ⛔ the dart never collapses to a point — it has to read as AIMED`);
  H.assert(dart.max < spiral.max, `depth ${d}: and the bolt is smaller than its parent`);
}

// The whole draw path, headless, on a closed and an open well, at both ends of
// the depth range.
let drew = true;
try {
  for (const w of [ring, vee]) {
    for (const d of [0, 0.5, 1]) {
      X.drawWeaver(ctx, w, 2, d);
      X.drawWeaverBolt(ctx, w, 2, d);
    }
  }
} catch (e) {
  drew = false;
  H.assert(false, `a Weaver draw threw: ${e && e.message}`);
}
H.assert(drew, "both silhouettes run headless on a closed and an open well");

// ---------------------------------------------------------------------------
// the debug bench key that P1 left dark (GDD 9.5) — ⚠ TEMPORARY
// ---------------------------------------------------------------------------
//
// P1 wired "3" to spawnWeaver and left it a no-op because no kind answered to
// it. It answers now. ⛔ Through spawnEnemy(), like every other way in.

useWell(0);
H.eq(state.enemies.length, 0, "the bench case starts on an empty board");
G.input.keyDown("3");
H.eq(state.enemies.length, 0,
     "⛔ a keydown spawns nothing at event time — named actions are dispatched inside sample()");
G.update(DT);
G.input.keyUp("3");
// ⚠ EXACTLY ONE WEAVER, not exactly one ENTITY. This asserted the array length
// until CS004 P4: the Weaver spawned by the action is already in state.enemies
// when the same step's entity pass runs, so it takes its first climb step and
// lays a Thorn before the step is over. That is the lay working, not the bench
// spawning twice, and test-cs004-p4.js owns the Thorn half of it.
H.eq(state.enemies.filter(e => e instanceof X.Weaver).length, 1,
     "and exactly one Weaver after the step that sampled it");
H.assert(state.enemies[0] instanceof X.Weaver, "⚠ pressing 3 puts a Weaver on the board");

H.report("test-cs004-p3.js");
