// test-cs008-p2.js — CS008 P2: scoring and extra lives (GDD 7, 4.4, 6.5, 17
// item 8; plan §3). Asserts what P2 owns: every GDD §7 row Classic can produce,
// paid at the build's three kill sites and nowhere else; the Thorn per chip;
// the clear bonuses on the clear step; lives at 20k then every 40k, capped; the
// score telemetry column; that scoring spends no RNG draw; and item 8 — on a
// played board, every step's score delta equals that step's events.
//
// ⛔ TRAPS IN THE FIXTURES.
//  1. The expected values are GDD §7's LITERALS, never C.PTS_* and never
//     e.points(): a test that read the build's own table would pass a wrong one.
//  2. Item 8 observes the board, not a log. Carrier children can be born and
//     die inside one step, so the soak watches the step's pushes onto
//     state.enemies; a Thorn can grow and be chipped in one step, so its chips
//     are decoded against the climbing Weaver that grew it.
//  3. Thorn staging lengths avoid multiples of THORN_CHIP: 0.24 - 3 × 0.08 is
//     2.8e-17, not 0, and takes a fourth chip.
//  4. The no-draw run compares against a build with addScore() stubbed OUT —
//     stubbing its effect would leave a draw inside it counted in both runs.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260913;
installSeed(SEED);                          // ⛔ above the first buildGame()
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const state = X.state;
const DT = C.FIXED_DT;
const PARK = 1 - C.RIM_CONTACT_DEPTH;
const RING = 0;

// ⛔ Trap 1 — GDD §7, as written there.
const GDD = { thornChip: 5, weaver: 50, carrier: 100, vaulter: 150, surger: 200,
              drifter: [250, 500, 750], wellPerLevel: 100, purgeUnspent: 500, noDeath: 1000,
              lifeFirst: 20000, lifeEvery: 40000, livesMax: 6 };

function gddPoints(e) {
  if (e instanceof X.Vaulter) return GDD.vaulter;
  if (e instanceof X.Carrier) return GDD.carrier;
  if (e instanceof X.Weaver) return GDD.weaver;
  if (e instanceof X.Surger) return GDD.surger;
  if (e instanceof X.Drifter) return e.depth < 1 / 3 ? 250 : e.depth < 2 / 3 ? 500 : 750;
  return 0;   // the Thorn scores per chip; the bolt is not on GDD §7
}

// A quiet board: level and well chosen, spawner held, nothing on it.
function quiet(level, wellIndex) {
  G.reset();
  X.startGame(SEED);
  state.level = level;
  state.wellIndex = wellIndex === undefined ? RING : wellIndex;
  X.enterWell();
  state.spawn.remaining = 1;
  state.spawn.timer = -1e9;
  state.enemies = [];
  state.shots = [];
  return X.WELLS[state.wellIndex];
}
function put(e) { state.enemies.push(e); return e; }
function shotAt(well, lane, depth) {
  const s = new X.Shot(well, lane);
  s.t = (1 - depth) * C.SHOT_TIME;
  state.shots.push(s);
  return s;
}
function delta(fn) { const s0 = state.score; fn(); return state.score - s0; }
function purge() {
  state.input.purge = true;
  state.purgeLatched = false;
  X.updatePurge(state);
  state.input.purge = false;
}
function drifter(lane, depth, phase) {
  const d = new X.Drifter(lane, depth, 1);
  d.phase = phase;
  return d;
}

// ---------------------------------------------------------------------------
// the contract: addScore, the fourth method, the fields
// ---------------------------------------------------------------------------

H.assert(typeof X.addScore === "function", "addScore is in the build");
H.assert(typeof X.clearBonuses === "function", "clearBonuses is in the build");
G.reset();
X.startGame(SEED);
H.eq(state.score, 0, "a run is born with score 0");
H.eq(state.nextLife, GDD.lifeFirst, "and its first milestone at 20,000");
H.eq(state.diedThisWell, false, "and no death in its first well");
H.eq(new X.Enemy(0, 0.5).points(), 0, "⛔ the base points() is 0 — default-safe, like onShot");
H.eq(new X.WeaverBolt(0, 0.5).points(), 0, "the bolt inherits it");
H.eq(new X.Thorn(0, 0.5).points(), 0, "⛔ the Thorn's is 0 — its worth is its chips");

// ⛔ The band count is the ARRAY'S LENGTH, never a literal 3.
const SHIPPED_BANDS = C.PTS_DRIFTER;
C.PTS_DRIFTER = [1, 2, 3, 4];
H.eq(drifter(0, 0.5, "cross").points(), 3, "⛔ four bands: depth 0.5 is the third — the count is the length");
H.eq(drifter(0, 1, "cross").points(), 4, "and depth 1 stays inside the last band");
C.PTS_DRIFTER = SHIPPED_BANDS;

// ---------------------------------------------------------------------------
// ⛔ GDD §7, row by row, at the shot kill site (collideShots)
// ---------------------------------------------------------------------------

function shotKill(make, depth, want, name) {
  const well = quiet(23);
  const e = put(make(5, depth));
  shotAt(well, 5, depth);
  const d = delta(() => X.collideShots(state, well));
  H.assert(e.dead, `${name}: the shot killed it`);
  H.eq(d, want, `⛔ ${name}: a shot kill pays ${want}`);
}
shotKill((l, d) => new X.Vaulter(l, d, 1), 0.5, 150, "Vaulter");
shotKill((l, d) => new X.Weaver(l, d), 0.3, 50, "Weaver");
shotKill((l, d) => new X.Surger(l, d), 0.5, 200, "Surger");
shotKill((l, d) => { const u = new X.Surger(l, d); u.setPhase("discharge"); return u; }, 0.5, 200,
         "Surger mid-discharge");
shotKill((l, d) => drifter(l, d, "cross"), 0.2, 250, "Drifter, the throat band");
shotKill((l, d) => drifter(l, d, "cross"), 0.5, 500, "Drifter, the middle band");
shotKill((l, d) => drifter(l, d, "cross"), PARK, 750, "Drifter, the rim band");

// Drifter bands at the EXACT boundaries — through the Purge, which moves nothing.
for (const [depth, want, name] of [
  [0, 250, "depth 0"], [1 / 3 - 1e-9, 250, "just below 1/3"], [1 / 3, 500, "exactly 1/3"],
  [2 / 3 - 1e-9, 500, "just below 2/3"], [2 / 3, 750, "exactly 2/3"], [1, 750, "depth 1"],
]) {
  quiet(23);
  put(drifter(5, depth, "ride"));
  H.eq(delta(purge), want, `⛔ a Drifter at ${name} pays ${want} — thirds, the rim pays most`);
}

// A Carrier, then its children — the hull pays 100, and each child for itself.
{
  const well = quiet(23);
  const hull = put(new X.Carrier(5, 0.5, "vaulter"));
  shotAt(well, 5, 0.5);
  H.eq(delta(() => X.collideShots(state, well)), 100, "⛔ a Carrier's hull pays 100 and the split pays nothing");
  const kids = state.enemies.filter(e => e !== hull && e instanceof X.Vaulter);
  H.eq(kids.length, 2, "and it split into two Vaulters");
  state.enemies = state.enemies.filter(e => !e.dead);
  state.shots = [];
  for (const k of kids) shotAt(well, k.lane, k.depth);
  H.eq(delta(() => X.collideShots(state, well)), 300, "⛔ then each child pays its own 150");

  quiet(23);
  const h2 = put(new X.Carrier(5, 0.5, "drifter"));
  shotAt(X.WELLS[RING], 5, 0.5);
  H.eq(delta(() => X.collideShots(state, X.WELLS[RING])), 100, "a Drifter Carrier's hull pays 100");
  const dk = state.enemies.filter(e => e !== h2 && e instanceof X.Drifter);
  H.eq(dk.length, 2, "and it split into two Drifters");
  H.eq(delta(purge), 1000, "⛔ and its children pay by their depth, 500 each at 0.5");
}

// ⛔ Trap 2's case: a child born and killed inside ONE pass. The first shot
// splits the Carrier; the second, behind it in the array, meets the child it
// split into the next lane. Both pay.
{
  const well = quiet(23);
  put(new X.Carrier(5, 0.5, "vaulter"));
  shotAt(well, 5, 0.5);
  shotAt(well, 6, 0.5);
  H.eq(delta(() => X.collideShots(state, well)), 100 + 150,
       "⛔ a Carrier and the child it split, killed in the same pass, both pay");
  H.eq(state.enemies.filter(e => e.dead).length, 2, "and exactly those two died");
}

// ⛔ The Thorn: 5 per chip, the killing chip included, and nothing on top.
{
  const well = quiet(23);
  const t = put(new X.Thorn(5, 0.2));   // trap 3
  const kills0 = state.tally.kills;
  const chips = [];
  for (let i = 0; i < 3; i++) {
    state.shots = [];
    shotAt(well, 5, t.depth);
    chips.push(delta(() => X.collideShots(state, well)));
  }
  H.eq(chips.join(","), "5,5,5", "⛔ a Thorn chipped three times pays 5 per chip");
  H.assert(t.dead, "and the third chip killed it");
  H.eq(state.tally.kills - kills0, 1, "it counts as one kill");
  H.eq(chips.reduce((a, b) => a + b, 0), 15, "⛔ and its death paid nothing past the chips");
}

// The bolt: a shot is declined and pays nothing; the Purge kills it for 0.
{
  const well = quiet(23);
  const b = put(new X.WeaverBolt(5, 0.5));
  shotAt(well, 5, 0.5);
  H.eq(delta(() => X.collideShots(state, well)), 0, "a shot at a bolt pays nothing");
  H.assert(!b.dead, "and the bolt declined it");
  H.eq(delta(purge), 0, "⛔ a Purged bolt pays 0");
  H.assert(b.dead, "and the Purge did kill it");
}

// ---------------------------------------------------------------------------
// ⛔ the rim sweep — a shot kill that never had to fly (collideSkimmer)
// ---------------------------------------------------------------------------

for (const [make, want, name] of [
  [l => new X.Vaulter(l, PARK, 1), 150, "Vaulter"],
  [l => new X.Carrier(l, PARK, "vaulter"), 100, "Carrier (children not touching)"],
  [l => new X.Surger(l, PARK), 200, "Surger"],
  [l => drifter(l, PARK, "cross"), 750, "crossing Drifter"],
]) {
  const well = quiet(23);
  const e = put(make(0));
  state.input.fire = true;
  const d = delta(() => X.collideSkimmer(state, well));
  H.assert(e.dead && !state.skimmer.dead, `sweep, ${name}: the enemy died and the Skimmer did not`);
  H.eq(d, want, `⛔ sweep, ${name}: pays ${want}`);
}
{
  const well = quiet(23);
  put(drifter(0.5, PARK, "ride"));
  state.input.fire = true;
  H.eq(delta(() => X.collideSkimmer(state, well)), 0, "an armoured Drifter refuses the sweep and pays nothing");
  H.assert(state.skimmer.dead, "and it killed the Skimmer");
}

// ---------------------------------------------------------------------------
// ⛔ both Purge uses score normal points
// ---------------------------------------------------------------------------
{
  quiet(23);
  put(new X.Vaulter(1, 0.4, 1));
  put(new X.Weaver(2, 0.3));
  put(new X.Surger(3, 0.5));
  put(new X.Carrier(4, 0.6, "vaulter"));
  put(new X.WeaverBolt(6, 0.5));
  const thorn = put(new X.Thorn(7, 0.5));
  const n0 = state.enemies.length;
  H.eq(delta(purge), 150 + 50 + 200 + 100, "⛔ the first Purge pays every victim's points, the bolt 0");
  H.assert(!thorn.dead, "the Thorn stands, and pays nothing");
  H.eq(state.enemies.length, n0, "and nothing split");

  quiet(23);
  put(new X.Vaulter(1, 0.4, 1));
  const top = put(new X.Surger(3, 0.6));
  state.purgeUses = 1;
  H.eq(delta(purge), 200, "⛔ the second Purge pays its one victim's points");
  H.assert(top.dead, "and the victim was the one nearest the rim");
  H.eq(delta(purge), 0, "a third press pays nothing");
}

// ---------------------------------------------------------------------------
// ⛔ extra lives — 20,000, then every 40,000, capped at LIVES_MAX
// ---------------------------------------------------------------------------
{
  G.reset();
  X.startGame(SEED);
  const L = state.lives;
  X.addScore(19999);
  H.eq(state.lives, L, "19,999 awards nothing");
  X.addScore(1);
  H.eq(state.lives, L + 1, "⛔ a life at exactly 20,000");
  H.eq(state.nextLife, 60000, "and the next is due at 60,000");
  X.addScore(39999);
  H.eq(state.lives, L + 1, "59,999 awards nothing more");
  X.addScore(1);
  H.eq(state.lives, L + 2, "⛔ a life at exactly 60,000");
  X.addScore(39999);
  H.eq(state.lives, L + 2, "99,999 awards nothing more");
  X.addScore(1);
  H.eq(state.lives, L + 3, "⛔ a life at exactly 100,000");
  H.eq(state.lives, GDD.livesMax, "which is the cap");
  X.addScore(40000);
  H.eq(state.lives, GDD.livesMax, "⛔ 140,000 at the cap awards nothing past LIVES_MAX");
  H.eq(state.nextLife, 180000, "⛔ and the lost life is not banked — the milestone moved on");

  X.startGame(SEED);
  X.addScore(60000);
  H.eq(state.lives, L + 2, "⛔ one award crossing two milestones pays both");
  H.eq(state.nextLife, 100000, "and lands on the third");

  X.startGame(SEED);
  state.lives = GDD.livesMax - 1;
  X.addScore(60000);
  H.eq(state.lives, GDD.livesMax, "⛔ one award crossing two, one below the cap: one paid, one lost");
  H.eq(state.nextLife, 100000, "and both milestones spent");

  X.startGame(SEED);
  X.addScore(5e6);
  H.eq(state.score, 5e6, "no cap and no rollover");

  const well = quiet(1);
  X.addScore(19850);
  put(new X.Vaulter(5, 0.5, 1));
  shotAt(well, 5, 0.5);
  const lives0 = state.lives;
  X.collideShots(state, well);
  H.eq(state.score, 20000, "a Vaulter shot at 19,850 lands on 20,000");
  H.eq(state.lives, lives0 + 1, "⛔ and the kill site's award paid the life");
}

// ---------------------------------------------------------------------------
// ⛔ the clear bonuses, on the clear step, through the real Game.update()
// ---------------------------------------------------------------------------

// A level-L board whose last enemy dies to a fire-tick shot on the next step.
function armClear(level) {
  state.level = level;
  state.spawn.remaining = 0;
  state.enemies = [];
  put(new X.Vaulter(Math.round(state.skimmer.lane), PARK, 1));
  G.input.keyDown(" ");
}
function clearStep() {
  const d = delta(() => G.update(DT));
  H.assert(state.dive.active, "fixture: that step was the clear edge");
  G.input.reset();
  return d;
}

quiet(7);
armClear(7);
H.eq(clearStep(), 150 + 700 + 500 + 1000,
     "⛔ L7, Purge unspent, no death: 150 + 100×7 + 500 + 1,000, all on the clear step");

quiet(23);
armClear(23);
H.eq(clearStep(), 150 + 2300 + 500 + 1000, "⛔ L23: the level bonus is 100 × level");

quiet(7);
G.input.keyDown("x");
G.update(DT);
G.input.reset();
H.eq(state.purgeUses, 1, "fixture: the Purge was spent on an empty well");
armClear(7);
H.eq(clearStep(), 150 + 700 + 1000, "⛔ Purge spent: no 500");

quiet(7);
X.killSkimmer(state);
G.update(DT);
H.assert(state.skimmer && !state.skimmer.dead, "fixture: died and respawned in this well");
armClear(7);
H.eq(clearStep(), 150 + 700 + 500, "⛔ a death in the well: no 1,000");

// ⛔ No death in the well, and the Dive that follows kills: the 1,000 stands.
// Every lane thorned, so the strike lands and the termination kill destroys one.
{
  const well = quiet(7);
  armClear(7);
  for (let l = 0; l < well.lanes; l++) put(new X.Thorn(l, C.THORN_MAX));
  const paid = clearStep();
  H.eq(paid, 150 + 700 + 500 + 1000, "⛔ the clear step before a lethal dive pays the no-death 1,000");
  const s0 = state.score, deaths0 = state.tally.deaths, kills0 = state.tally.kills;
  const thorns0 = state.enemies.filter(e => e instanceof X.Thorn).length;
  let sawFlag = false, t = 0;
  while (state.level === 7 && t++ < 2000) {
    G.update(DT);
    if (state.diedThisWell) sawFlag = true;
  }
  H.eq(state.level, 8, "fixture: the dive completed");
  H.assert(state.tally.deaths > deaths0 && sawFlag, "fixture: the dive killed, and the flag was set");
  H.eq(thorns0 - 1, 15, "fixture: the Ring was fully thorned");
  H.eq(state.score, s0, "⛔ the dive — its death and its destroyed Thorn — paid and took nothing");
  H.eq(state.tally.kills, kills0, "and the destroyed Thorn is not the player's kill");
  H.eq(state.diedThisWell, false, "⛔ the next well starts with no death against it");
  armClear(8);
  H.eq(clearStep(), 150 + 800 + 500 + 1000, "and pays its own no-death bonus");
}

// ⛔ A stopped run scores but gains no life (Paul, 2026-09-13). The last life
// and the clear land on one step: a shot takes the last Vaulter, a bolt takes
// the Skimmer, and the clear bonuses cross 20,000 after the stop.
{
  quiet(7);
  X.addScore(19000);
  state.lives = 1;
  armClear(7);
  put(new X.WeaverBolt(Math.round(state.skimmer.lane), PARK));
  const d = clearStep();
  H.eq(state.screen, "gameover", "fixture: that step spent the last life");
  H.eq(d, 150 + 700 + 500, "⛔ the game-over step still pays its clear bonuses (no death bonus: it died)");
  H.assert(state.score >= GDD.lifeFirst, "fixture: and they crossed 20,000");
  H.eq(state.lives, 0, "⛔ but a stopped run gains no life — lives stays 0");
  H.eq(state.nextLife, 60000, "and the milestone is spent, not banked");
}

// ---------------------------------------------------------------------------
// telemetry — the score column's source
// ---------------------------------------------------------------------------

// ⛔ Rewritten in place by CS008 P3, which took `mode` and `startDepth` too,
// and by CS012 P4, which took the last key (`maxCombo` -> state.combo.peak) and
// with it the object: `score` is still not a placeholder key, and nothing is.
H.assert(!("TELEMETRY_PLACEHOLDER" in C),
     "⛔ the placeholder object is gone whole, `score` sourced since CS008 P2");
H.assert(state.score > 0, "fixture: a scored run");
H.eq(X.telemetryRow(state).score, state.score, "⛔ the score column reads state.score");
H.eq(X.TELEMETRY_FIELDS.indexOf("score"), 19, "and it kept its place in the order");

// ---------------------------------------------------------------------------
// ⛔ GDD §17 item 8 — on a played board, every step's delta is that step's events
// ---------------------------------------------------------------------------

const PLAY_TICKS = 15000;
// Four boards, two seeds each. `held` holds fire throughout (the sweep's
// fire-holder, who clears wells) or pulses it (who dies); `purge` is the press
// period, 0 for never — so some wells clear with the Purge unspent.
const PLAYS = [
  { level: 1,  held: true,  purge: 0,    seeds: [11, 3407] },
  { level: 13, held: true,  purge: 311,  seeds: [11, 90210] },
  { level: 17, held: true,  purge: 1500, seeds: [11, 23] },
  { level: 23, held: false, purge: 311,  seeds: [11, 23] },
];

// test-cs006-p5.js's recorded list with its wall-to-wall pin, fire and Purge
// per the play.
function drive(input, i, play) {
  if (i % 7 === 0)   input.mouseMove(((i * 37) % 181) - 90);
  if (i % 53 === 0)  input.keyDown("ArrowRight");
  if (i % 53 === 11) input.keyUp("ArrowRight");
  if (i % 71 === 0)  input.keyDown("ArrowLeft");
  if (i % 71 === 31) input.keyUp("ArrowLeft");
  if (play.held) { if (i === 0) input.keyDown(" "); }
  else { if (i % 13 === 0) input.keyDown(" "); if (i % 13 === 9) input.keyUp(" "); }
  if (play.purge && i % play.purge === 0) input.keyDown("x");
  if (play.purge && i % play.purge === 4) input.keyUp("x");
  if (i % 300 === 0) input.mouseMove((Math.floor(i / 300) % 2) ? 4000 : -4000);
}

function begin(X, seed, level) {
  X.Game.reset();
  X.startGame(seed);
  X.state.level = level;
  X.state.wellIndex = (level - 1) % X.WELLS.length;
  X.enterWell();
}

// ⛔ Chips decoded off the board (trap 2). A Thorn's pre-collision length is
// its length at the step's start, raised to the tip of any Weaver that was
// climbing and grew it; each chip removes C.THORN_CHIP from that.
function chipsOf(t, before, weavers) {
  let g = before === undefined ? 0 : before;
  for (const w of weavers) {
    if (w.phaseBefore === "climb" && w.e.thorn === t) g = Math.max(g, Math.min(w.e.depth, C.THORN_MAX));
  }
  if (t.dead) {
    let d = g, k = 0;
    while (d > 0) { d -= C.THORN_CHIP; k++; }
    return { k, fits: true };
  }
  const k = Math.round((g - t.depth) / C.THORN_CHIP);
  return { k, fits: k >= 0 && Math.abs(g - k * C.THORN_CHIP - t.depth) < 1e-9 };
}

const seen = { steps: 0, stepsScored: 0, byClass: {}, chips: 0, purgeKills: 0, clears: 0, noDeathPaid: 0, noDeathWithheld: 0, purgeSavedPaid: 0,
               lifeSteps: 0, deaths: 0, diveDeathsAfterNoDeath: 0 };
let mismatches = 0, firstMismatch = null, unfit = 0, liveAtStart = 0, livesOver = 0, scoreDown = 0,
    livesWrong = 0;

for (const play of PLAYS) for (const seed of play.seeds) {
  begin(X, seed, play.level);
  let deathThisWell = false, paidNoDeath = false;
  for (let i = 0; i < PLAY_TICKS; i++) {
    if (state.screen === "gameover") {
      G.input.reset();
      begin(X, seed + i, play.level);
      deathThisWell = false;
      paidNoDeath = false;
    }
    drive(G.input, i, play);

    const pre = state.enemies.slice();
    if (pre.some(e => e.dead)) liveAtStart++;
    const before = new Map(pre.map(e => [e, e.depth]));
    const weavers = pre.filter(e => e instanceof X.Weaver).map(e => ({ e, phaseBefore: e.phase }));
    const pushed = [];
    const arr = state.enemies;
    arr.push = function () { pushed.push(...arguments); return Array.prototype.push.apply(this, arguments); };
    const s0 = state.score, lives0 = state.lives, level0 = state.level, deaths0 = state.tally.deaths;
    const diveWas = state.dive.active, purges0 = state.tally.purgesSpent;

    G.update(DT);
    delete arr.push;
    seen.steps++;

    const died = state.tally.deaths > deaths0;
    if (died) { seen.deaths++; deathThisWell = true; }

    let expect = 0;
    const all = pre.concat(pushed);
    for (const e of all) {
      if (!e.dead) continue;
      const p = gddPoints(e);
      if (diveWas) { if (p !== 0) expect = NaN; continue; }   // a dive kills only Thorns, for 0
      expect += p;
      if (p > 0) seen.byClass[e.constructor.name] = (seen.byClass[e.constructor.name] || 0) + 1;
      if (p > 0 && state.tally.purgesSpent > purges0) seen.purgeKills++;
    }
    if (!diveWas) {
      for (const t of all) {
        if (!(t instanceof X.Thorn)) continue;
        const r = chipsOf(t, before.get(t), weavers);
        if (!r.fits) unfit++;
        expect += GDD.thornChip * r.k;
        seen.chips += r.k;
      }
    }
    if (!diveWas && state.dive.active) {
      seen.clears++;
      expect += GDD.wellPerLevel * level0;
      if (state.purgeUses === 0) { expect += GDD.purgeUnspent; seen.purgeSavedPaid++; }
      if (!deathThisWell) { expect += GDD.noDeath; seen.noDeathPaid++; paidNoDeath = true; }
      else seen.noDeathWithheld++;
    }
    if (diveWas && died && paidNoDeath) seen.diveDeathsAfterNoDeath++;

    const got = state.score - s0;
    if (got !== 0) seen.stepsScored++;
    if (got !== expect) {
      mismatches++;
      if (!firstMismatch) firstMismatch = `seed ${seed} tick ${i}: got ${got}, want ${expect}`;
    }
    if (got < 0) scoreDown++;
    if (state.lives > GDD.livesMax) livesOver++;
    if (!died) {
      const m = s => s < GDD.lifeFirst ? 0 : 1 + Math.floor((s - GDD.lifeFirst) / GDD.lifeEvery);
      const crossed = m(state.score) - m(s0);
      if (crossed > 0) seen.lifeSteps++;
      if (state.lives !== Math.max(lives0, Math.min(GDD.livesMax, lives0 + crossed))) livesWrong++;
    }
    if (diveWas && !state.dive.active) { deathThisWell = false; paidNoDeath = false; }
    if (state.level !== level0 && !diveWas) { deathThisWell = false; paidNoDeath = false; }
  }
}

if (process.env.P2_MEASURE) console.log(JSON.stringify(seen));

H.eq(liveAtStart, 0, "fixture: every step starts on a board with no dead entity left in it");
H.eq(unfit, 0, "⛔ every Thorn's length change decodes to whole chips (trap 2)");
H.eq(mismatches, 0, `⛔ GDD §17 item 8: every step's score delta equals that step's events` +
     (firstMismatch ? ` — first: ${firstMismatch}` : ""));
H.eq(scoreDown, 0, "the score never decreases");
H.eq(livesOver, 0, "lives never exceed LIVES_MAX");
H.eq(livesWrong, 0, "⛔ on every deathless step, lives rose by exactly the milestones crossed, to the cap");

// Non-vacuity: the board produced every kind of event the claim is about.
for (const k of ["Vaulter", "Carrier", "Weaver", "Drifter", "Surger"]) {
  H.assert((seen.byClass[k] || 0) > 0, `non-vacuity: a ${k} was killed on the played board`);
}
H.assert(seen.chips > 0, "non-vacuity: Thorns were chipped");
H.assert(seen.purgeKills > 0, "non-vacuity: the Purge killed");
H.assert(seen.clears > 0 && seen.noDeathPaid > 0 && seen.noDeathWithheld > 0 && seen.purgeSavedPaid > 0,
         "non-vacuity: clears paid and withheld the no-death bonus, and paid the unspent Purge");
H.assert(seen.lifeSteps > 0, "non-vacuity: an extra life was crossed");
H.assert(seen.deaths > 0, "non-vacuity: the player died");
H.assert(seen.diveDeathsAfterNoDeath > 0, "non-vacuity: a dive killed after its well paid the no-death bonus");

// ---------------------------------------------------------------------------
// ⛔ scoring spends no RNG draw — the same run, against addScore() stubbed out
// ---------------------------------------------------------------------------

// ⛔ The comparison window ends at the first game over in EITHER run: an
// awarded life is the one thing scoring feeds back, and it only changes the run
// when it outlives a death that would have ended it.
const NODRAW = { level: 1, held: true, purge: 0, seed: 11, ticks: 20000 };
const Y = H.buildGame({ stub: ["addScore"] });   // trap 4

function drawRun(Z) {
  begin(Z, NODRAW.seed, NODRAW.level);
  const st = Z.state;
  let draws = 0;
  const raw = st.rng;
  st.rng = function () { draws++; return raw(); };
  const perTick = [];
  for (let i = 0; i < NODRAW.ticks && st.screen !== "gameover"; i++) {
    drive(Z.Game.input, i, NODRAW);
    Z.Game.update(DT);
    perTick.push({ draws, score: st.score, lives: st.lives,
                   board: st.enemies.map(e => `${e.constructor.name}:${e.lane}:${e.depth}`).join("|") });
  }
  return perTick;
}

const scored = drawRun(X);
const unscored = drawRun(Y);
const WINDOW = Math.min(scored.length, unscored.length);
let drawsDiffer = -1, boardsDiffer = -1, awarded = false;
for (let i = 0; i < WINDOW; i++) {
  if (drawsDiffer < 0 && scored[i].draws !== unscored[i].draws) drawsDiffer = i;
  if (boardsDiffer < 0 && scored[i].board !== unscored[i].board) boardsDiffer = i;
  if (scored[i].lives > unscored[i].lives) awarded = true;
}
const end = scored[WINDOW - 1];
if (process.env.P2_MEASURE) {
  console.log(JSON.stringify({ window: WINDOW, scoredLen: scored.length, unscoredLen: unscored.length,
                               draws: end.draws, score: end.score, awarded }));
}
H.eq(unscored[unscored.length - 1].score, 0, "fixture: the stubbed build scores nothing");
H.assert(end.score >= GDD.lifeFirst && awarded,
         "fixture: the scored run is scoring-heavy — past a milestone, with a life awarded, inside the window");
H.assert(end.draws > 0, "fixture: the run spends draws");
H.eq(drawsDiffer, -1, `⛔ scoring spends no RNG draw — the same draws on every one of ${WINDOW} ticks, ` +
     "addScore() stubbed out or not");
H.eq(boardsDiffer, -1, "and the same board on every tick");

H.report("test-cs008-p2.js");
