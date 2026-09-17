// test-cs008-p8.js — CS008's closing phase: the SIXTH SOAK, and the only one
// that enters through the FRONT DOOR. Twenty runs, one continuous session from
// the boot title: title → mode → START DEPTH (1 / 5 / 9 by case) → play → game
// over → RESTART → play → game over → QUIT TO TITLE, every screen change a
// keyboard press into the input sink. GDD §17 items 8, 12 and 13, on the boards
// those runs played: no exception, no NaN; score never falls within a run and
// equals the sum of its events; lives <= LIVES_MAX on every frame; the Start
// Depth bonus paid at most once per run; the rim-arrival property; non-vacuity.
//
// ⛔ TRAPS IN THE FIXTURES.
//  1. The freeze lives in Game.frame(), so the loop runs HALF a step per frame:
//     each frame is at most one step, and a step's events are that frame's.
//  2. The fire-holder has no death path on levels 1–4 (P1b). Each run holds fire
//     for HOLD_TICKS live steps, then turns passive (rotation only) until it
//     dies — still the input sink, and it is what bounds a run.
//  3. The driver STOPS pressing at the stop (STATUS, P5): a key held into game
//     over would meet a live menu. Everything is released the frame it lands.
//  4. Date.now is a counter, so every run's time seed is replayable.
//  5. "Within band" carries its own 1e-9 (GDD §17 item 13's fire-tick shot at
//     1.000 against 0.95), and a shot with a second entity in its band and lane
//     is contested — the pass may spend it there, and it obliges nothing.
//  6. ⚠ No played board reaches LIVES_MAX (measured peak 4), so the lives bound
//     is a bound: removing addScore()'s cap leaves this file green. The cap's
//     mutation proof is test-cs008-p2.js's staged rows.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260914;
installSeed(SEED);                          // ⛔ above the first buildGame()
const X = H.buildGame({ spy: ["startGame", "collideShots"] });
const { C, state } = X;
const G = X.Game;
const MS = C.FIXED_DT * 1000;
const PARK = 1 - C.RIM_CONTACT_DEPTH;
const BAND = C.HIT_DEPTH_TOL + 1e-9;        // trap 5

const CASES = 20;
const DEPTHS = [1, 5, 9];
const HOLD_TICKS = 9000;                    // trap 2
const SEGMENT_CAP = 40000;                  // live steps before a run is declared stuck
const PIN_TICKS = 300;

// GDD §7 and §4.6, AS WRITTEN THERE — never C.PTS_* or startBonus().
const GDD = { thornChip: 5, weaver: 50, carrier: 100, vaulter: 150, surger: 200,
              wellPerLevel: 100, purgeUnspent: 500, noDeath: 1000, livesMax: 6,
              startBonus: { 1: 0, 5: 7400, 9: 22300 } };

function gddPoints(e) {
  if (e instanceof X.Vaulter) return GDD.vaulter;
  if (e instanceof X.Carrier) return GDD.carrier;
  if (e instanceof X.Weaver) return GDD.weaver;
  if (e instanceof X.Surger) return GDD.surger;
  if (e instanceof X.Drifter) return e.depth < 1 / 3 ? 250 : e.depth < 2 / 3 ? 500 : 750;
  return 0;
}

let now = 0;
Date.now = () => (now += 7919);             // trap 4

// ---------------------------------------------------------------------------
// the frame loop and the keyboard
// ---------------------------------------------------------------------------

let clock = 0;
function halfFrame() { clock += MS / 2; G.frame(clock); }
function liveStep() {
  const want = G.stats.ticks + 1;
  for (let n = 0; G.stats.ticks < want && n < 8; n++) halfFrame();
}
function press(k) { G.input.keyDown(k); liveStep(); G.input.keyUp(k); liveStep(); }
function tapRight() { G.input.keyDown("ArrowRight"); liveStep(); liveStep(); G.input.keyUp("ArrowRight"); liveStep(); }
function releaseAll() { for (const k of [" ", "x", "ArrowLeft", "ArrowRight"]) G.input.keyUp(k); }

// test-cs005-p5.js's recorded rotation and wall-to-wall pin; fire held from
// the first step, a Purge every 311 — until HOLD_TICKS, then rotation only.
function drive(i) {
  const inp = G.input;
  if (i % 7 === 0)   inp.mouseMove(((i * 37) % 181) - 90);
  if (i % 53 === 0)  inp.keyDown("ArrowRight");
  if (i % 53 === 11) inp.keyUp("ArrowRight");
  if (i % 71 === 0)  inp.keyDown("ArrowLeft");
  if (i % 71 === 31) inp.keyUp("ArrowLeft");
  if (i % PIN_TICKS === 0) inp.mouseMove((Math.floor(i / PIN_TICKS) % 2) ? 4000 : -4000);
  if (i >= HOLD_TICKS) { if (i === HOLD_TICKS) { inp.keyUp(" "); inp.keyUp("x"); } return; }
  if (i === 0) inp.keyDown(" ");
  if (i % 311 === 0) inp.keyDown("x");
  if (i % 311 === 4) inp.keyUp("x");
}

// ---------------------------------------------------------------------------
// ⛔ THE RIM-ARRIVAL ORACLE, at the shot pass itself
// ---------------------------------------------------------------------------

const laneMatch = (well, a, b) => Math.abs(X.laneDelta(well, a, b)) <= C.HIT_LANE_TOL;
const inBand = (well, s, e) => !s.dead && Math.abs(s.depth() - e.depth) <= BAND && laneMatch(well, s.lane, e.lane);

const rim = { arrivals: 0, hopped: 0, obliged: 0, obligedHopped: 0, fireTick: 0, killed: 0, violations: 0, first: null };
let atRimInLane = new Map();                // Vaulter -> its lane at the last pass
let obligations = [];

X.collideShots.before = function (st, well) {
  obligations = [];
  const sk = st.skimmer;
  const next = new Map();
  if (!sk || sk.dead) { atRimInLane = next; return; }
  for (const e of st.enemies) {
    if (e.dead || !(e instanceof X.Vaulter) || e.depth < PARK || !laneMatch(well, e.lane, sk.lane)) continue;
    next.set(e, e.lane);
    if (atRimInLane.has(e)) continue;
    rim.arrivals++;
    if (e.hopping) rim.hopped++;
    const shots = st.shots.filter(s => inBand(well, s, e) &&
      !st.enemies.some(f => f !== e && !f.dead && inBand(well, s, f)));
    if (shots.length === 0) continue;
    rim.obliged++;
    if (e.hopping) rim.obligedHopped++;
    if (shots.some(s => s.depth() === 1)) rim.fireTick++;
    obligations.push({ e, shots, lane: e.lane, depth: e.depth });
  }
  atRimInLane = next;
};
X.collideShots.after = function () {
  for (const ob of obligations) {
    if (ob.e.dead) { rim.killed++; continue; }
    rim.violations++;
    if (!rim.first) {
      rim.first = `case ${caseNo}, level ${state.level}: a Vaulter at lane ${ob.lane}, depth ${ob.depth} ` +
                  `outlived shot(s) at ${ob.shots.map(s => s.depth()).join(", ")}`;
    }
  }
  obligations = [];
};

// ---------------------------------------------------------------------------
// ⛔ GDD §17 item 8, played — every step's delta is that step's events
// ---------------------------------------------------------------------------

function chipsOf(t, before, weavers) {
  let g = before === undefined ? 0 : before;
  for (const w of weavers) {
    if (w.phaseBefore === "climb" && w.e.thorn === t) g = Math.max(g, Math.min(w.e.depth, C.THORN_MAX));
  }
  if (t.dead) { let d = g, k = 0; while (d > 0) { d -= C.THORN_CHIP; k++; } return { k, fits: true }; }
  const k = Math.round((g - t.depth) / C.THORN_CHIP);
  return { k, fits: k >= 0 && Math.abs(g - k * C.THORN_CHIP - t.depth) < 1e-9 };
}

const seen = { steps: 0, frames: 0, clears: 0, deaths: 0, purgeKills: 0, chips: 0, lifeAwards: 0,
               bonusPaid: 0, restarts: 0, gameOvers: 0, maxLevel: 0, maxLives: 0, ticksPerSegment: [] };
const bad = { exceptions: 0, nan: 0, scoreDown: 0, livesOver: 0, mismatches: 0, unfit: 0,
              bonusTwice: 0, bonusWrongWell: 0, stuck: 0 };
const firsts = {};
function flag(key, msg) { bad[key]++; if (!firsts[key]) firsts[key] = msg; }

function finite(v) { return typeof v === "number" && Number.isFinite(v); }
function boardFinite() {
  const st = state;
  if (![st.score, st.lives, st.level, st.time, st.invulnTime, st.spawn.timer, st.dive.timer,
        st.dive.depth, G.hitStopLeft].every(finite)) return false;
  if (st.skimmer && !finite(st.skimmer.lane)) return false;
  for (const e of st.enemies) if (!finite(e.lane) || !finite(e.depth)) return false;
  for (const s of st.shots) if (!finite(s.lane) || !finite(s.depth())) return false;
  return true;
}

let caseNo = -1;

// One run segment: from the first play step to game over, frame by frame.
function playSegment(run) {
  let i = 0, drivenFor = -1, guard = 0;
  let deathThisWell = false;
  let lastScore = state.score;
  while (state.screen !== "gameover") {
    if (state.screen !== "play" || i > SEGMENT_CAP || guard++ > SEGMENT_CAP * 4) {
      flag("stuck", `case ${caseNo}: on "${state.screen}" at step ${i}, not game over`);
      throw new Error("the segment did not end in game over");
    }
    if (G.hitStopLeft === 0 && drivenFor !== i) { drive(i); drivenFor = i; }

    const snap = G.hitStopLeft === 0 && state.screen === "play";
    let pre, before, weavers, pushed, arr, s0, level0, deaths0, diveWas, purges0, lives0;
    if (snap) {
      pre = state.enemies.slice();
      before = new Map(pre.map(e => [e, e.depth]));
      weavers = pre.filter(e => e instanceof X.Weaver).map(e => ({ e, phaseBefore: e.phase }));
      pushed = [];
      arr = state.enemies;
      arr.push = function () { pushed.push(...arguments); return Array.prototype.push.apply(this, arguments); };
      s0 = state.score; level0 = state.level; deaths0 = state.tally.deaths; lives0 = state.lives;
      diveWas = state.dive.active; purges0 = state.tally.purgesSpent;
    }
    const t0 = G.stats.ticks;
    halfFrame();
    seen.frames++;
    if (snap) delete arr.push;

    if (state.lives > C.LIVES_MAX) flag("livesOver", `case ${caseNo}: lives ${state.lives}`);
    if (state.score < lastScore) flag("scoreDown", `case ${caseNo}: ${lastScore} -> ${state.score}`);
    lastScore = state.score;
    if (G.stats.ticks === t0) continue;

    // ---- a live step ran ----
    i++;
    seen.steps++;
    if (!boardFinite()) flag("nan", `case ${caseNo}, step ${i}: a non-finite value on the board`);
    if (state.level > seen.maxLevel) seen.maxLevel = state.level;
    if (state.lives > seen.maxLives) seen.maxLives = state.lives;
    if (!snap) continue;

    const died = state.tally.deaths > deaths0;
    if (died) { seen.deaths++; deathThisWell = true; }
    if (!died && state.lives > lives0) seen.lifeAwards++;

    let expect = 0;
    const all = pre.concat(pushed);
    for (const e of all) {
      if (!e.dead) continue;
      const p = gddPoints(e);
      if (diveWas) { if (p !== 0) expect = NaN; continue; }
      expect += p;
      if (p > 0 && state.tally.purgesSpent > purges0) seen.purgeKills++;
    }
    if (!diveWas) {
      for (const t of all) {
        if (!(t instanceof X.Thorn)) continue;
        const r = chipsOf(t, before.get(t), weavers);
        if (!r.fits) flag("unfit", `case ${caseNo}, step ${i}: a Thorn length that is not whole chips`);
        expect += GDD.thornChip * r.k;
        seen.chips += r.k;
      }
    }
    const got = state.score - s0;
    if (!diveWas && state.dive.active) {
      seen.clears++;
      expect += GDD.wellPerLevel * level0;
      if (state.purgeUses === 0) expect += GDD.purgeUnspent;
      if (!deathThisWell) expect += GDD.noDeath;
      // The Start Depth bonus, found as what the clear paid beyond §7's three.
      const bonus = GDD.startBonus[run.depth];
      if (bonus > 0 && got - expect === bonus) {
        run.bonusPaid++;
        seen.bonusPaid++;
        if (run.bonusPaid > 1) flag("bonusTwice", `case ${caseNo}: paid again at level ${level0}`);
        if (level0 !== run.depth) flag("bonusWrongWell", `case ${caseNo}: paid on level ${level0}'s clear`);
      }
      if (level0 === run.depth) expect += bonus;
    }
    if (got !== expect) flag("mismatches", `case ${caseNo}, step ${i}, level ${level0}: got ${got}, want ${expect}`);
    if (diveWas && !state.dive.active) deathThisWell = false;
    if (state.level !== level0 && !diveWas) deathThisWell = false;
  }
  // ⛔ Trap 3: the stop lands, and every key comes up on that frame.
  releaseAll();
  seen.gameOvers++;
  seen.ticksPerSegment.push(i);
  for (let n = 0; G.hitStopLeft > 0 && n < 1000; n++) halfFrame();
  liveStep(); liveStep();
}

// ---------------------------------------------------------------------------
// ⛔ THE TWENTY RUNS
// ---------------------------------------------------------------------------

G.frame(0);
H.eq(state.screen, "title", "⛔ the session boots to the title");
liveStep(); liveStep();                     // the title's entry step, before any press

const perCase = [];
for (let k = 0; k < CASES; k++) {
  caseNo = k;
  const depth = DEPTHS[k % DEPTHS.length];
  now = (SEED + k * 1000003) >>> 0;
  const run = { depth, bonusPaid: 0 };
  const L = `case ${k} (depth ${depth})`;
  const rec = { depth, onTitle: false, depthOk: false, restartOk: false, quitOk: false };
  try {
    rec.onTitle = state.screen === "title" && G.menu.cursor === 0;
    press(" ");                                            // PLAY
    // ⛔ REPAIRED IN PLACE AT CS012 P3 (O9): OVERDRIVE is MODE's first row and
    // the default highlight now, so the one step down is what keeps this soak's
    // precondition — a CLASSIC run — exactly as it always was.
    tapRight();                                            // OVERDRIVE -> CLASSIC
    press(" ");                                            // CLASSIC
    const row = X.startDepthOptions("classic").indexOf(depth);
    for (let n = 0; n < row; n++) tapRight();
    const calls0 = X.startGame.calls;
    press(" ");                                            // LEVEL d
    rec.depthOk = state.screen === "play" && state.startDepth === depth && state.level === depth &&
                  state.mode === "classic" && X.startGame.calls === calls0 + 1 && state.score === 0;
    const firstSeed = state.seed;
    playSegment(run);

    const cursorOnRestart = state.screen === "gameover" && G.menu.cursor === 0;
    press(" ");                                            // RESTART
    rec.restartOk = cursorOnRestart && state.screen === "play" && state.startDepth === depth &&
                    state.level === depth && state.seed !== firstSeed && state.score === 0 &&
                    state.lives === C.START_LIVES && X.startGame.calls === calls0 + 2;
    if (rec.restartOk) seen.restarts++;
    run.bonusPaid = 0;
    playSegment(run);

    tapRight();
    const cursorOnQuit = state.screen === "gameover" && G.menu.cursor === 1;
    press(" ");                                            // QUIT TO TITLE
    rec.quitOk = cursorOnQuit && state.screen === "title" && state.skimmer === null && state.score === 0;
    liveStep();
  } catch (err) {
    flag("exceptions", `${L}: ${err && err.stack ? err.stack.split("\n").slice(0, 3).join(" | ") : err}`);
    releaseAll();
    G.quitToTitle();
    liveStep(); liveStep();
  }
  perCase.push(rec);
}

if (process.env.P8_MEASURE) console.log(JSON.stringify({ seen, rim, bad, firsts }, null, 1));

// ---------------------------------------------------------------------------
// the claims
// ---------------------------------------------------------------------------

H.eq(bad.exceptions, 0, `⛔ no exception across twenty front-door sessions${firsts.exceptions ? " — " + firsts.exceptions : ""}`);
H.eq(bad.stuck, 0, `every run reached game over${firsts.stuck ? " — " + firsts.stuck : ""}`);
for (const [k, rec] of perCase.entries()) {
  H.assert(rec.onTitle, `case ${k}: the run begins on the title, PLAY highlighted`);
  H.assert(rec.depthOk, `⛔ case ${k}: title → mode → START DEPTH ${rec.depth} starts a CLASSIC run at level ${rec.depth}`);
  H.assert(rec.restartOk, `⛔ case ${k}: RESTART keeps depth ${rec.depth} and mode, on a new seed, with a fresh score and lives`);
  H.assert(rec.quitOk, `⛔ case ${k}: QUIT TO TITLE leaves no run behind`);
}
H.eq(bad.nan, 0, `⛔ no NaN on any live step${firsts.nan ? " — " + firsts.nan : ""}`);
H.eq(bad.scoreDown, 0, `⛔ the score never decreases within a run${firsts.scoreDown ? " — " + firsts.scoreDown : ""}`);
H.eq(bad.unfit, 0, `every Thorn's length change decodes to whole chips${firsts.unfit ? " — " + firsts.unfit : ""}`);
H.eq(bad.mismatches, 0, `⛔ GDD §17 item 8, played: every step's score delta equals its events` +
     (firsts.mismatches ? ` — first: ${firsts.mismatches}` : ""));
H.eq(bad.livesOver, 0, `⛔ lives <= C.LIVES_MAX on every frame${firsts.livesOver ? " — " + firsts.livesOver : ""}`);
H.eq(C.LIVES_MAX, GDD.livesMax, "and C.LIVES_MAX is GDD §7's 6");
H.eq(bad.bonusTwice, 0, `⛔ the Start Depth bonus is paid at most once per run${firsts.bonusTwice ? " — " + firsts.bonusTwice : ""}`);
H.eq(bad.bonusWrongWell, 0, `and only on the starting well's clear${firsts.bonusWrongWell ? " — " + firsts.bonusWrongWell : ""}`);
H.eq(rim.violations, 0, `⛔ GDD §17 item 13, played: every hunting Vaulter entering the Skimmer's lane at the park ` +
     `depth with an uncontested shot in band dies in the shot pass, before contact` + (rim.first ? ` — ${rim.first}` : ""));

// ⛔ Non-vacuity, for each claim.
H.eq(seen.restarts, CASES, "⛔ non-vacuity: a RESTART was taken in every case");
H.eq(seen.gameOvers, CASES * 2, "non-vacuity: forty game overs, two per case");
H.assert(seen.lifeAwards > 0, `⛔ non-vacuity: a life was awarded on a played board (${seen.lifeAwards})`);
H.assert(seen.bonusPaid > 0, `⛔ non-vacuity: a Start Depth bonus was paid (${seen.bonusPaid})`);
H.assert(seen.clears > 0 && seen.deaths > 0 && seen.chips > 0 && seen.purgeKills > 0,
         `non-vacuity: item 8's board cleared wells, died, chipped Thorns and Purged (${seen.clears}, ${seen.deaths}, ${seen.chips}, ${seen.purgeKills})`);
H.assert(rim.obligedHopped > 0, `⛔ non-vacuity: hunting Vaulters hopped into the lane with a shot in band (${rim.obligedHopped} of ${rim.obliged})`);
H.assert(rim.fireTick > 0, `non-vacuity: some of those shots were on their fire tick, at depth 1.000 (${rim.fireTick})`);
H.assert(seen.maxLevel >= 10, `non-vacuity: a run played past its starting band (level ${seen.maxLevel})`);

H.report("test-cs008-p8.js");
