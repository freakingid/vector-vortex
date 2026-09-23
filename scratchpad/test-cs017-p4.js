// test-cs017-p4.js — CS017's closing phase: the FIFTEENTH SOAK (plan S5-A, §6;
// GDD 17 item 12, 19's Core and Quality rows). ONE build, ONE front-door
// session: 100 time-seeded runs to game over, 50 per mode, alternating, each
// from a Start Depth drawn off that mode's LIVE option list with its own
// fire-hold — both drawn from the SOAK's stream, never the game's. Per played
// step: no exception, every lane / depth / score finite, enemies <= ENEMY_CAP,
// shots <= the cap in force, tokens <= MAX_TOKENS. Non-vacuity: both modes, a
// Mimic's level, a dive, distinct death levels per mode, all sixteen wells.
// ⛔ TRAPS. 1. Date.now is WALL time, the frame clock plus a base
//     (test-cs015-p4.js): every start seeds from it, so every run differs.
//  2. ⛔ The records are staged AFTER a no-write window, and the precondition
//     asserted: a staged record can mask a write (CS016 P4).
//  3. A title idled 20 s enters the demo: every visit presses at once, and the
//     session asserts no demo started. 4. Two live steps before the first press;
//     release every held key at the stop; MODE is OVERDRIVE then CLASSIC.
//  5. Start Depths are ODD: a depth is chosen by its ROW, never by value.
//  6. ⛔ Timed ALONE under 60 s before commit (S5). A timeout is not a red.
"use strict";

const H = require("./_harness.js");
const { installSeed, mulberry32 } = require("./_seeded-random.js");

const SEED = 20261117;
installSeed(SEED);                          // ⛔ above the first buildGame()

const J = JSON.stringify;
const BASE = Date.UTC(2026, 9, 5, 12);      // Monday noon UTC (trap 1)
const RUNS = 100;
const MODES = ["overdrive", "classic"];     // run k plays MODES[k % 2]
const RECORD = 30;                          // staged per mode: rows 1, 3 … 29 (trap 5)
const HOLD_MIN = 600, HOLD_SPAN = 6000;     // the fire-hold, drawn per run
const SEGMENT_CAP = 40000;
const PIN_TICKS = 300;
const IDLE_WINDOW = 600;                    // the no-write window, 10 s < ATTRACT_IDLE
const MEASURE = !!process.env.P4_MEASURE;

// ---------------------------------------------------------------------------
// ⛔ THE DRIVER — test-cs016-p4.js's four-clause L11+ hunter, UNCHANGED but for
// the hold, which is the run's own. Every clause is a no-op in Classic.
// ---------------------------------------------------------------------------
function sameLane(Z, well, a, b) {
  return Math.abs(Z.laneDelta(well, a, b)) <= Z.C.HIT_LANE_TOL;
}
const RIGHT = 1;
function drive(Z, i, hold) {
  const st = Z.state, inp = Z.Game.input, well = Z.WELLS[st.wellIndex];
  if (i % PIN_TICKS === 0) inp.mouseMove((Math.floor(i / PIN_TICKS) % 2) ? 4000 : -4000);

  if (i === 0) inp.keyDown(" ");
  if (i < hold) {
    if (i % 311 === 0) inp.keyDown("x");
    if (i % 311 === 4) inp.keyUp("x");
  } else if (i === hold) {
    inp.keyUp(" "); inp.keyUp("x"); inp.keyUp("arrowup");
  }

  const sk = st.skimmer;
  inp.keyUp("ArrowRight"); inp.keyUp("ArrowLeft");
  if (!sk || sk.dead) { inp.keyUp("arrowup"); return; }

  let ringD = null;
  if (st.dive.active && st.dive.rings.length) {
    const span = Z.diveTime() - Z.C.DIVE_GRACE;
    for (let n = 0; n < st.dive.rings.length; n++) {
      const r = st.dive.rings[n];
      if (r.taken !== null) continue;
      const dd = Z.laneDelta(well, sk.lane, r.lane);
      const reach = Math.max(0, st.dive.depth - r.depth) * span * Z.C.KEY_SPEED_MAX;
      if (Math.abs(dd) - Z.C.RING_ARC_LANES <= reach) { ringD = dd; break; }
    }
  }

  let dodge = null, token = null, best = null;
  for (let n = 0; n < st.enemies.length; n++) {
    const e = st.enemies[n];
    if (e.dead) continue;
    if (e instanceof Z.MimicShot) {
      if (st.powers.ward) continue;
      const dd = Z.laneDelta(well, sk.lane, e.lane);
      if (Math.abs(dd) <= 1 && (dodge === null || Math.abs(dd) < Math.abs(dodge))) dodge = dd;
      continue;
    }
    if (e instanceof Z.WeaverBolt) continue;
    if (e.anchored && !st.powers.lance) continue;
    if (best === null || e.depth > best.depth) best = e;
  }
  for (let n = 0; n < st.tokens.length; n++) {
    const t = st.tokens[n];
    if (t.dead || t.depth < Z.C.TOKEN_HOVER_DEPTH) continue;
    const dd = Z.laneDelta(well, sk.lane, t.lane);
    if (token === null || Math.abs(dd) < Math.abs(token)) token = dd;
  }

  let d;
  if (ringD !== null) d = ringD * RIGHT;
  else if (dodge !== null) d = (dodge > 0 ? -RIGHT : RIGHT);
  else if (token !== null) d = token * RIGHT;
  else if (best !== null) d = Z.laneDelta(well, sk.lane, best.lane) * RIGHT;
  else d = 0;
  if (d > 0.3) inp.keyDown("ArrowRight"); else if (d < -0.3) inp.keyDown("ArrowLeft");

  if (i < hold && !st.powers.ward &&
      st.enemies.some(e => !e.dead && e.aloft && sameLane(Z, well, e.lane, sk.lane))) {
    inp.keyDown("arrowup");
  } else {
    inp.keyUp("arrowup");
  }
}

// ===========================================================================
// THE BUILD AND ITS FRONT DOOR
// ===========================================================================

const store = new Map();
const S = { clock: 0 };
Date.now = () => BASE + S.clock;            // trap 1
const X = H.buildGame({ store, spy: ["startGame"] });
const { C, state } = X;
const G = X.Game, MS = C.FIXED_DT * 1000;
const soak = mulberry32(SEED ^ 0x5eed);     // the SOAK's stream; the game never reads it

const starts = [];
X.startGame.before = (seed, opts) => starts.push({ attract: !!(opts && opts.attract) });

const halfFrame = () => { S.clock += MS / 2; G.frame(S.clock); };
const liveStep = () => {
  const want = G.stats.ticks + 1;
  for (let n = 0; G.stats.ticks < want && n < 8; n++) halfFrame();
};
// A title visit is counted in live steps, from the step the screen became the
// title to the press that leaves it (trap 3).
let titleRun = 0, titleMax = 0;
const tick = () => {
  liveStep();
  if (state.screen === "title") { titleRun++; if (titleRun > titleMax) titleMax = titleRun; }
  else titleRun = 0;
};
const press = k => { G.input.keyDown(k); tick(); G.input.keyUp(k); tick(); };
const right = n => { for (let i = 0; i < n; i++) { G.input.keyDown("ArrowRight"); tick(); tick(); G.input.keyUp("ArrowRight"); tick(); } };
const releaseAll = () => { for (const k of [" ", "x", "arrowup", "ArrowLeft", "ArrowRight"]) G.input.keyUp(k); };
const bytes = () => J([...store.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)));

// ---- The per-step invariants (GDD 17 item 12), counted, first one kept -----
const inv = { steps: 0, nan: 0, enemyCap: 0, shotCap: 0, tokenCap: 0, first: {} };
const fail = (k, msg) => { inv[k]++; if (!inv.first[k]) inv.first[k] = msg; };
const T = { wells: new Set(), levels: { classic: new Set(), overdrive: new Set() },
            deathLevels: { classic: [], overdrive: [] }, dives: { classic: 0, overdrive: 0 },
            mimics: 0, maxEnemies: 0, maxShots: 0, maxTokens: 0, maxLevel: { classic: 0, overdrive: 0 } };

function check() {
  inv.steps++;
  const at = `${state.mode} L${state.level}`;
  if (state.enemies.length > C.ENEMY_CAP) fail("enemyCap", `${state.enemies.length} entities, ${at}`);
  const shotCap = state.powers.spread ? C.SPREAD_SHOT_MAX : C.SHOT_MAX;     // the cap in force
  if (state.shots.length > shotCap) fail("shotCap", `${state.shots.length} shots against ${shotCap}, ${at}`);
  if (state.tokens.length > C.MAX_TOKENS) fail("tokenCap", `${state.tokens.length} tokens, ${at}`);
  if (!Number.isFinite(state.score)) fail("nan", `score ${state.score}, ${at}`);
  if (state.skimmer && !Number.isFinite(state.skimmer.lane)) fail("nan", `the craft's lane ${state.skimmer.lane}, ${at}`);
  if (!Number.isFinite(state.dive.depth)) fail("nan", `the dive's depth ${state.dive.depth}, ${at}`);
  for (const arr of [state.enemies, state.shots, state.tokens, state.dive.rings]) {
    for (let n = 0; n < arr.length; n++) {
      const e = arr[n];
      const depth = typeof e.depth === "function" ? e.depth() : e.depth;    // a Shot's is a method
      if (!Number.isFinite(e.lane) || !Number.isFinite(depth)) {
        fail("nan", `${e.constructor.name} lane ${e.lane} depth ${depth}, ${at}`);
      }
      if (e instanceof X.Mimic) T.mimics++;
    }
  }
  if (state.enemies.length > T.maxEnemies) T.maxEnemies = state.enemies.length;
  if (state.shots.length > T.maxShots) T.maxShots = state.shots.length;
  if (state.tokens.length > T.maxTokens) T.maxTokens = state.tokens.length;
}

const exceptions = [], stuck = [], runs = [];

function playToGameOver(k, hold) {
  let i = 0, drivenFor = -1, guard = 0, diveWas = false;
  while (state.screen !== "gameover") {
    if (state.screen !== "play" || i > SEGMENT_CAP || guard++ > SEGMENT_CAP * 4) {
      stuck.push(`run ${k}: on "${state.screen}" at step ${i}`);
      throw new Error("the run did not end in game over");
    }
    if (G.hitStopLeft === 0 && drivenFor !== i) { drive(X, i, hold); drivenFor = i; }
    const t0 = G.stats.ticks;
    halfFrame();
    if (G.stats.ticks === t0) continue;
    i++;
    check();
    T.wells.add(state.wellIndex);
    T.levels[state.mode].add(state.level);
    if (state.level > T.maxLevel[state.mode]) T.maxLevel[state.mode] = state.level;
    if (state.dive.active && !diveWas) T.dives[state.mode]++;
    diveWas = state.dive.active;
  }
  return i;
}

// PLAY → the mode → START DEPTH (a row drawn off the live list) → a run → QUIT.
function runCase(k) {
  const mode = MODES[k % 2];
  const hold = HOLD_MIN + Math.floor(soak() * HOLD_SPAN);
  const r = { k, mode, hold, depth: null, started: false, eligible: false, quit: false };
  try {
    press(" ");                                       // PLAY
    if (mode === "classic") right(1);                 // trap 4
    press(" ");                                       // the mode
    const list = X.startDepthOptions(mode);           // START DEPTH is built for pendingMode
    const row = Math.floor(soak() * list.length);
    r.depth = list[row];
    right(row);
    press(" ");                                       // LEVEL d
    r.started = state.screen === "play" && state.level === r.depth && state.mode === mode;
    r.eligible = X.Meta.eligible();
    r.seed = state.seed;
    r.steps = playToGameOver(k, hold);
    r.died = state.level;
    T.deathLevels[mode].push(state.level);
    releaseAll();                                     // trap 4
    for (let n = 0; G.hitStopLeft > 0 && n < 1000; n++) halfFrame();
    tick(); tick();
    right(1);
    press(" ");                                       // QUIT TO TITLE
    r.quit = state.screen === "title";
    tick();
  } catch (err) {
    exceptions.push(`run ${k}: ${err && err.stack ? err.stack.split("\n").slice(0, 3).join(" | ") : err}`);
    releaseAll();
    G.quitToTitle();
    tick(); tick();
  }
  runs.push(r);
}

// ===========================================================================
// 1. THE BOOT, THE NO-WRITE WINDOW, THE RECORDS (trap 2)
// ===========================================================================
halfFrame();
tick(); tick();                                       // trap 4: the title's entry step
{
  const b0 = bytes();
  for (let n = 0; n < IDLE_WINDOW; n++) tick();
  H.eq(state.screen, "title", "fixture: the no-write window rests on the title");
  H.eq(bytes(), b0, `⛔ the no-write window: ${IDLE_WINDOW} steps at rest on the title move no stored byte`);
  for (const m of MODES) {
    H.eq(X.levelRecord(m).highestCleared(), 0, `⛔ precondition: no ${m} record before staging`);
    H.eq(J(X.startDepthOptions(m)), J(C.START_DEPTH_FIRST), `and ${m}'s list is the first session's`);
  }
  for (const m of MODES) X.levelRecord(m).noteCleared(RECORD);
  const want = [];
  for (let d = 1; d < RECORD; d += 2) want.push(d);
  for (const m of MODES) {
    H.eq(J(X.startDepthOptions(m)), J(want), `⛔ precondition: ${m}'s staged list is 1, 3 … ${RECORD - 1}`);
  }
  titleRun = 0; titleMax = 0;                         // the window is not a visit (trap 3)
}

// ===========================================================================
// 2. A HUNDRED RUNS
// ===========================================================================
for (let k = 0; k < RUNS; k++) runCase(k);

if (MEASURE) {
  console.log(J({ steps: inv.steps, titleMax, T: { ...T, wells: [...T.wells].sort((a, b) => a - b),
    levels: { classic: T.levels.classic.size, overdrive: T.levels.overdrive.size } },
    runs: runs.map(r => `${r.mode[0]}${r.depth}/${r.hold}->${r.died}`) }));
}

H.eq(exceptions.length, 0, `⛔ no exception in a hundred runs${exceptions[0] ? " — " + exceptions[0] : ""}`);
H.eq(stuck.length, 0, `every run reached game over${stuck[0] ? " — " + stuck[0] : ""}`);
H.eq(runs.length, RUNS, `a hundred runs (${runs.length})`);
for (const m of MODES) {
  const mine = runs.filter(r => r.mode === m);
  H.eq(mine.length, RUNS / 2, `fifty ${m} runs`);
  const bad = mine.filter(r => !(r.started && r.eligible && r.quit));
  H.eq(bad.length, 0, `⛔ every ${m} run: START DEPTH → play, eligible → game over → QUIT TO TITLE` +
       `${bad[0] ? " — " + J(bad[0]) : ""}`);
}
H.eq(new Set(runs.map(r => r.seed)).size, RUNS, "⛔ a hundred TIME-SEEDED runs: every seed distinct");
H.eq(starts.length, RUNS, "fixture: exactly one start per run, no RESTART");

// ⛔ THE DEMO NEVER STARTED (trap 3).
H.eq(starts.filter(s => s.attract).length, 0, "⛔ no title visit idled into the demo");
H.assert(titleMax < C.ATTRACT_IDLE / C.FIXED_DT,
         `every title visit pressed inside ATTRACT_IDLE (longest ${titleMax} steps)`);

// ⛔ GDD 17 ITEM 12, PER PLAYED STEP.
H.eq(inv.nan, 0, `⛔ no non-finite lane, depth or score on any of ${inv.steps} played steps${inv.first.nan ? " — " + inv.first.nan : ""}`);
H.eq(inv.enemyCap, 0, `⛔ enemies never past C.ENEMY_CAP${inv.first.enemyCap ? " — " + inv.first.enemyCap : ""}`);
H.eq(inv.shotCap, 0, `⛔ shots never past the cap in force (GDD 17 item 4)${inv.first.shotCap ? " — " + inv.first.shotCap : ""}`);
H.eq(inv.tokenCap, 0, `⛔ tokens never past C.MAX_TOKENS${inv.first.tokenCap ? " — " + inv.first.tokenCap : ""}`);

// ---- non-vacuity -----------------------------------------------------------
const MIMIC_LEVEL = C.SPAWN_SCHEDULE_OVERDRIVE.find(r => r.kind === "mimic").level;
H.assert(inv.steps > 100000, `non-vacuity: a soak (${inv.steps} played steps)`);
for (const m of MODES) {
  H.assert(T.maxLevel[m] >= MIMIC_LEVEL, `non-vacuity: ${m} played at the Mimic's level ${MIMIC_LEVEL} or past (${T.maxLevel[m]})`);
  H.assert(T.dives[m] > 0, `non-vacuity: ${m} dived (${T.dives[m]} dives)`);
  const distinct = new Set(T.deathLevels[m]).size;
  H.assert(distinct >= 10, `non-vacuity: ${m}'s fifty runs died on ${distinct} distinct levels (${J(T.deathLevels[m])})`);
  const depths = new Set(runs.filter(r => r.mode === m).map(r => r.depth)).size;
  H.assert(depths >= 8, `non-vacuity: ${m} started from ${depths} distinct Start Depths`);
}
H.assert(T.mimics > 0, `non-vacuity: a Mimic was on an Overdrive board (${T.mimics} entity-steps)`);
H.eq(J([...T.wells].sort((a, b) => a - b)), J(X.WELLS.map((w, i) => i)),
     "⛔ ALL SIXTEEN WELLS PLAYED (P3 addendum; GDD 19 Core, \"render and play\")");
H.assert(T.maxShots > C.SHOT_MAX && T.maxTokens === C.MAX_TOKENS,
         `non-vacuity: the caps were reached — shots ${T.maxShots}, tokens ${T.maxTokens}`);
console.log(`  MEASURED (CS017 P4): ${RUNS} runs, ${inv.steps} played steps; died classic ` +
            `${new Set(T.deathLevels.classic).size} / overdrive ${new Set(T.deathLevels.overdrive).size} ` +
            `distinct levels, highest ${T.maxLevel.classic} / ${T.maxLevel.overdrive}; dives ` +
            `${T.dives.classic} / ${T.dives.overdrive}; high-water enemies ${T.maxEnemies}, shots ${T.maxShots}, ` +
            `tokens ${T.maxTokens}; longest title visit ${titleMax} steps`);

H.report("test-cs017-p4.js");
