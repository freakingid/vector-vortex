// test-cs015-p4.js — CS015's closing phase: the THIRTEENTH SOAK (plan §6; GDD
// 15.5, 17 items 10 and 12). What its pair holds constant: THE ACHIEVEMENT
// SEATS. One front-door session over a working store — Classic at Start Depths
// 1 / 13, then Overdrive at 1 / 11, each run to game over, RESTART, run, QUIT
// TO TITLE — played twice: as is, and with both evaluator seats mutated out.
//  1. ⛔ The whole-board hash is identical on every frame: an unlock steers
//     nothing. 2. What the session earned, per mode, and every payload's row
//     matches its run's mode. 3. A RELOAD over the working Map holds every
//     unlock, and the ACHIEVEMENTS screen, opened from the title, counts them.
//  4. A WEEK ROLL — the clock moved on eight days — empties weeklyUnlocked
//     alone; a run in the new week writes it again. 5. Storage: no enumeration
//     read anywhere, and only declared keys.
// ⛔ TRAPS. 1. Seed, Date.now and build are re-made per session, in that order.
//  2. ⛔ Date.now IS WALL TIME, NOT A PER-CALL TICK: the frame clock plus a
//     Monday-noon base. The stubbed twin makes FEWER clock reads (evaluate()
//     reads once per call), and under a per-call fake that alone re-seeds every
//     RESTART (STATUS: a clock read is a mover) — a difference in the FIXTURE,
//     not in what the seats do to the board.
//  3. Two live steps before the first press; stop pressing at the stop.
//  4. MODE's rows are OVERDRIVE then CLASSIC: a Classic run steps one row down.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20261020;
installSeed(SEED);                          // ⛔ above the first buildGame() (trap 1)

const J = JSON.stringify;
const NS = "coinless.vector-vortex.";
const DAY = 86400000;
const BASE = Date.UTC(2026, 8, 21, 12);     // Monday noon UTC: 2026-W39 (trap 2)
const ROLL = 8 * DAY;                       // plan §6's week roll: -> 2026-W40
const PLAN = [["classic", 1], ["classic", 13], ["overdrive", 1], ["overdrive", 11]];
const RECORD = { classic: 13, overdrive: 11 };   // staged, so both lists reach them
const HOLD_TICKS = 9000;                    // test-cs008-p8.js trap 2
const SEGMENT_CAP = 40000;
const PIN_TICKS = 300;
const MEASURE = !!process.env.P4_MEASURE;

// ⛔ THE TWO SEATS, each in the build exactly once (buildGame() throws
// otherwise) — test-cs015-p3.js's strings. Out, the clear edge still moves the
// per-well window and the streak (Meta's closure, never `state`); what goes is
// the evaluation, its write and its sound.
const SEATS_OUT = [
  ["    return sounded(Achievements.evaluate(facts(win)));", "    return null;"],
  ["    if (booted && ok) sounded(Achievements.evaluate(facts(runEndFacts())));", ""],
];

// ---------------------------------------------------------------------------
// ⛔ THE DRIVER — test-cs014-p3.js's four-clause L11+ hunter, UNCHANGED
// (STATUS.md: jump at anything aloft; never target a MimicShot and steer away
// within a lane; go to a hovering token; steer to a ring in reach, "in reach"
// from the depth model and C.KEY_SPEED_MAX). Every clause is a no-op in Classic.
// ---------------------------------------------------------------------------
function sameLane(Z, well, a, b) {
  return Math.abs(Z.laneDelta(well, a, b)) <= Z.C.HIT_LANE_TOL;
}
const RIGHT = 1;
function drive(Z, i) {
  const st = Z.state, inp = Z.Game.input, well = Z.WELLS[st.wellIndex];
  if (i % PIN_TICKS === 0) inp.mouseMove((Math.floor(i / PIN_TICKS) % 2) ? 4000 : -4000);

  if (i === 0) inp.keyDown(" ");
  if (i < HOLD_TICKS) {
    if (i % 311 === 0) inp.keyDown("x");
    if (i % 311 === 4) inp.keyUp("x");
  } else if (i === HOLD_TICKS) {
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

  if (i < HOLD_TICKS && !st.powers.ward &&
      st.enemies.some(e => !e.dead && e.aloft && sameLane(Z, well, e.lane, sk.lane))) {
    inp.keyDown("arrowup");
  } else {
    inp.keyUp("arrowup");
  }
}

// test-cs009-p6.js's whole-board hasher, unchanged.
function makeHasher(X, extras) {
  const wells = new Map(X.WELLS.map((w, i) => [w, i]));
  const f64 = new Float64Array(1), u32 = new Uint32Array(f64.buffer);
  let h = 0, seen = null;
  const mixU = v => { h = Math.imul(h ^ v, 16777619) >>> 0; };
  const num = v => { f64[0] = v; mixU(u32[0]); mixU(u32[1]); };
  const str = s => { for (let i = 0; i < s.length; i++) mixU(s.charCodeAt(i)); mixU(0x1f); };
  function walk(v) {
    switch (typeof v) {
      case "number": mixU(1); num(v); return;
      case "string": mixU(2); str(v); return;
      case "boolean": mixU(v ? 3 : 4); return;
      case "undefined": mixU(5); return;
      case "function": return;
    }
    if (v === null) { mixU(6); return; }
    if (wells.has(v)) { mixU(7); num(wells.get(v)); return; }
    if (seen.has(v)) { mixU(8); num(seen.get(v)); return; }
    seen.set(v, seen.size);
    if (Array.isArray(v)) { mixU(9); num(v.length); for (let i = 0; i < v.length; i++) walk(v[i]); return; }
    str(v.constructor ? v.constructor.name : "");
    for (const k of Object.keys(v)) { str(k); walk(v[k]); }
  }
  return function () { h = 2166136261; seen = new Map(); walk(X.state); walk(extras()); return h; };
}

// ===========================================================================
// ONE BUILD, AND A FRONT-DOOR DRIVER FOR IT
// ===========================================================================

// ⛔ Date.now is the frame clock plus a base (trap 2), so a build and the clock
// its seeds come from are made together, and a reload is a second call over
// the same Map with a base of its own.
function open(o) {
  installSeed(SEED);                        // trap 1
  const S = { clock: 0, base: o.base };
  Date.now = () => S.base + S.clock;
  const X = H.buildGame({ store: o.store, mutate: o.mutate || [],
                          spy: ["sfx", "drawMenu"] });
  const { C, state } = X;
  const G = X.Game, MS = C.FIXED_DT * 1000;
  Object.assign(S, { X, G, hashes: [], steps: 0, exceptions: [], stuck: [], cases: [],
                     levels: new Set(), unlocks: [], sounds: 0, view: null });

  // Every payload the module returns, stamped with the run it came from.
  const evaluate = X.Achievements.evaluate;
  X.Achievements.evaluate = function (facts) {
    const out = evaluate.apply(this, arguments);
    for (const p of out) S.unlocks.push(Object.assign({ runMode: state.mode, screen: state.screen }, p));
    return out;
  };
  X.sfx.before = name => { if (name === "unlock") S.sounds++; };
  X.drawMenu.before = (ctx, view) => {
    S.view = { title: view.title, lines: view.lines.slice(),
               items: view.items.map(r => ({ label: r.label, detail: r.detail, enabled: r.enabled })) };
  };

  const hash = makeHasher(X, () => [G.hitStopLeft, G.menu.cursor, G.stats.ticks]);
  S.halfFrame = () => { S.clock += MS / 2; G.frame(S.clock); if (o.hash) S.hashes.push(hash()); };
  S.liveStep = () => {
    const want = G.stats.ticks + 1;
    for (let n = 0; G.stats.ticks < want && n < 8; n++) S.halfFrame();
  };
  S.press = k => { G.input.keyDown(k); S.liveStep(); G.input.keyUp(k); S.liveStep(); };
  S.right = n => { for (let i = 0; i < n; i++) { G.input.keyDown("ArrowRight"); S.liveStep(); S.liveStep(); G.input.keyUp("ArrowRight"); S.liveStep(); } };
  S.releaseAll = () => { for (const k of [" ", "x", "arrowup", "ArrowLeft", "ArrowRight"]) G.input.keyUp(k); };

  S.playSegment = (k, seg) => {
    let i = 0, drivenFor = -1, guard = 0;
    while (state.screen !== "gameover") {
      if (state.screen !== "play" || i > SEGMENT_CAP || guard++ > SEGMENT_CAP * 4) {
        S.stuck.push(`case ${k} run ${seg}: on "${state.screen}" at step ${i}`);
        throw new Error("the segment did not end in game over");
      }
      if (G.hitStopLeft === 0 && drivenFor !== i) { drive(X, i); drivenFor = i; }
      const t0 = G.stats.ticks;
      S.halfFrame();
      if (G.stats.ticks === t0) continue;
      i++;
      S.steps++;
      S.levels.add(`${state.mode}:${state.level}`);
    }
    S.releaseAll();                          // trap 3
    for (let n = 0; G.hitStopLeft > 0 && n < 1000; n++) S.halfFrame();
    S.liveStep(); S.liveStep();
  };

  // PLAY → the mode → START DEPTH d → a run → RESTART → a run → QUIT TO TITLE.
  S.runCase = (k, mode, depth) => {
    const r = { mode, depth, started: false, restarted: false, quit: false };
    try {
      S.press(" ");                                        // PLAY
      if (mode === "classic") S.right(1);                  // trap 4
      S.press(" ");                                        // the mode
      const row = X.startDepthOptions(mode).indexOf(depth);
      for (let n = 0; n < row; n++) S.right(1);
      S.press(" ");                                        // LEVEL d
      r.started = row >= 0 && state.screen === "play" && state.level === depth && state.mode === mode;
      S.playSegment(k, 0);
      S.press(" ");                                        // RESTART
      r.restarted = state.screen === "play" && state.startDepth === depth && state.mode === mode;
      S.playSegment(k, 1);
      S.right(1);
      S.press(" ");                                        // QUIT TO TITLE
      r.quit = state.screen === "title";
      S.liveStep();
    } catch (err) {
      S.exceptions.push(`case ${k}: ${err && err.stack ? err.stack.split("\n").slice(0, 3).join(" | ") : err}`);
      S.releaseAll();
      G.quitToTitle();
      S.liveStep(); S.liveStep();
    }
    S.cases.push(r);
  };

  // The title's fifth row (CS015 P3): PLAY, OPTIONS, SCORES, PROFILE, ACHIEVEMENTS.
  S.openAchievements = () => {
    S.right(4); S.press(" ");
    S.liveStep();                            // one drawn frame of the screen
    return state.screen === "achievements";
  };

  S.halfFrame();
  S.liveStep(); S.liveStep();                // trap 3: the title's entry step
  return S;
}

function session(o) {
  const S = open({ store: o.store, base: BASE, mutate: o.mutate, hash: true });
  S.X.levelRecord("classic").noteCleared(RECORD.classic);
  S.X.levelRecord("overdrive").noteCleared(RECORD.overdrive);
  for (let k = 0; k < PLAN.length; k++) S.runCase(k, PLAN[k][0], PLAN[k][1]);
  return S;
}

// ===========================================================================
// THE PAIR
// ===========================================================================

const workStore = new Map(), stubStore = new Map();
const work = session({ store: workStore });
const stub = session({ store: stubStore, mutate: SEATS_OUT });
const ACH = NS + "achievements";
const stored = m => (m.has(ACH) ? JSON.parse(m.get(ACH)).d : null);   // kit-storage's {v, d}

if (MEASURE) {
  const brief = s => ({ steps: s.steps, frames: s.hashes.length, cases: s.cases, sounds: s.sounds,
                        unlocks: s.unlocks.map(u => `${u.runMode}:${u.id}@${u.tier}${u.weekKey ? "/" + u.weekKey : ""}`),
                        exceptions: s.exceptions, stuck: s.stuck });
  console.log(J({ work: brief(work), stub: brief(stub), stored: stored(workStore),
                  keys: [...workStore.keys()] }, null, 1));
}

const C = work.X.C;

// ---------------------------------------------------------------------------
// the front door
// ---------------------------------------------------------------------------
for (const [name, s] of [["working", work], ["stubbed", stub]]) {
  H.eq(s.exceptions.length, 0, `⛔ no exception in the ${name} session${s.exceptions[0] ? " — " + s.exceptions[0] : ""}`);
  H.eq(s.stuck.length, 0, `${name}: every run reached game over${s.stuck[0] ? " — " + s.stuck[0] : ""}`);
  for (const [k, r] of s.cases.entries()) {
    H.assert(r.started && r.restarted && r.quit,
             `${name} case ${k}: ${r.mode} START DEPTH ${r.depth} → play → RESTART → QUIT TO TITLE (${J(r)})`);
  }
}
for (const [mode, depth] of PLAN) {
  H.assert(work.levels.has(`${mode}:${depth}`), `non-vacuity: ${mode} played at level ${depth}`);
}

// ---------------------------------------------------------------------------
// 1. ⛔ THE SEATS STEER NOTHING — the hash, frame for frame
// ---------------------------------------------------------------------------
{
  const a = work.hashes, b = stub.hashes;
  const n = Math.min(a.length, b.length);
  let firstDiff = -1;
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) { firstDiff = i; break; }
  H.eq(a.length, b.length, "⛔ both sessions ran the same number of frames");
  H.eq(firstDiff, -1, `⛔ the whole-board hash is identical on every frame with BOTH evaluator seats ` +
       `mutated out (${n} frames, ${work.steps} play steps)`);
  H.eq(work.steps, stub.steps, "and the same number of play steps");
  H.assert(new Set(a).size > n / 4, "non-vacuity: the hash moves with the board");
  H.assert(n > 20000, `non-vacuity: the session is a soak (${n} frames)`);
  // ⛔ AND THE TWIN IS A REAL TWIN: it evaluated nothing, wrote nothing, sounded nothing.
  H.eq(stub.unlocks.length + stub.sounds, 0, "fixture: the stubbed twin unlocked and sounded nothing");
  H.eq(stubStore.has(ACH), false, "fixture: and never wrote the achievements key");
  H.assert(work.unlocks.length > 0 && workStore.has(ACH),
           `non-vacuity: the working session DID unlock and write (${work.unlocks.length} payloads)`);
  H.assert(work.sounds > 0, `non-vacuity: and sounded its unlocks (${work.sounds} sfx("unlock"))`);
  H.eq(J(stubStore.get(NS + "scores")), J(workStore.get(NS + "scores")),
       "⛔ and the same local table: an unlock pays nothing (A9)");
}

// ---------------------------------------------------------------------------
// 2. what the session earned, per mode
// ---------------------------------------------------------------------------
const rowOf = {};
for (const r of C.ACHIEVEMENTS.lifetime) rowOf[r.id] = { row: r, weekly: false };
for (const r of C.ACHIEVEMENTS.weekly) rowOf[r.id] = { row: r, weekly: true };
{
  const U = work.unlocks;
  const bad = U.filter(u => !rowOf[u.id] || !(rowOf[u.id].row.mode === null || rowOf[u.id].row.mode === u.runMode));
  H.eq(bad.length, 0, `⛔ every payload's row matches its run's mode, or is untagged (A5)${bad[0] ? " — " + J(bad[0]) : ""}`);
  H.assert(U.every(u => u.screen === "play" || u.screen === "gameover" || u.screen === "pause"),
           "⛔ every unlock came from a seat — a clear edge on a play step, or a run's end");
  for (const mode of ["classic", "overdrive"]) {
    H.assert(U.some(u => u.runMode === mode), `non-vacuity: a ${mode} run unlocked something`);
  }
  H.assert(U.some(u => rowOf[u.id].row.mode === "overdrive"), "non-vacuity: an OVERDRIVE-tagged row unlocked");
  H.assert(U.some(u => rowOf[u.id].weekly), "non-vacuity: a WEEKLY row unlocked in 2026-W39");
  H.assert(U.some(u => u.tier >= 1) && U.some(u => u.tier === 0 && !u.weekKey),
           "non-vacuity: a TIER and an untiered lifetime row were both reached");
  H.eq(U.filter(u => rowOf[u.id].weekly).every(u => u.weekKey === "2026-W39"), true,
       "⛔ every weekly payload names the session's week, UTC (A11)");
  H.eq(U.filter(u => !rowOf[u.id].weekly).every(u => u.weekKey === null), true,
       "and every lifetime payload names none");
  // ⛔ TIERS ONLY RISE, across the whole session and both modes.
  const last = {};
  let fell = 0;
  for (const u of U) if (u.tier > 0) { if (u.tier <= (last[u.id] || 0)) fell++; last[u.id] = u.tier; }
  H.eq(fell, 0, "⛔ a tier is only ever RAISED, never re-sent or lowered (GDD 15.5)");
  // ⛔ AND EACH ONE ONCE: a held unlock is never returned again.
  const flat = U.filter(u => u.tier === 0).map(u => u.id);
  H.eq(flat.length, new Set(flat).size, "⛔ an untiered row unlocks at most ONCE in a session");
  console.log(`  MEASURED (CS015 P4): ${U.length} unlocks over ${work.steps} play steps — ` +
              `classic ${U.filter(u => u.runMode === "classic").length}, ` +
              `overdrive ${U.filter(u => u.runMode === "overdrive").length}; ${work.sounds} unlock sounds`);
}

// The union of what the session earned, as the store should hold it.
const earned = { flat: new Set(), tiers: {}, weekly: new Set() };
for (const u of work.unlocks) {
  if (rowOf[u.id].weekly) earned.weekly.add(u.id);
  else if (u.tier > 0) earned.tiers[u.id] = Math.max(earned.tiers[u.id] || 0, u.tier);
  else earned.flat.add(u.id);
}
const sortedTiers = t => J(Object.keys(t).sort().map(k => [k, t[k]]));

// ---------------------------------------------------------------------------
// 3. ⛔ THE RELOAD — every unlock still there, and the screen says so
// ---------------------------------------------------------------------------
let beforeRoll = null;
{
  const R = open({ store: workStore, base: BASE + DAY });   // the next day, same ISO week
  const snap = R.X.Meta.achievements();
  beforeRoll = snap;
  H.eq(snap.weekKey, "2026-W39", "fixture: the reload reads the same ISO week");
  H.eq(J(snap.lifetimeUnlocked.slice().sort()), J([...earned.flat].sort()),
       "⛔ reload: every untiered lifetime unlock the session earned is held, and nothing else");
  H.eq(sortedTiers(snap.lifetimeTiers), sortedTiers(earned.tiers),
       "⛔ reload: every tier at the highest index the session reached");
  H.eq(J(snap.weeklyUnlocked.slice().sort()), J([...earned.weekly].sort()),
       "⛔ reload: every weekly unlock of 2026-W39 is held");
  H.assert(R.openAchievements(), "fixture: the title's ACHIEVEMENTS row opens the screen on the reload");
  const got = earned.flat.size + Object.keys(earned.tiers).length;
  const life = C.ACHIEVEMENTS.lifetime.length;
  H.eq(R.view && R.view.lines[0], `${got} OF ${life} · WEEK 2026-W39`,
       "⛔ and the screen counts them, from the store (GDD 10.5)");
  const done = R.view ? R.view.items.slice(R.view.items.findIndex(r => r.label === "THIS WEEK") + 1)
                              .filter(r => r.detail !== "").length : -1;
  H.eq(done, earned.weekly.size, "and marks the week's earned rows done");
  H.eq(R.X._env.storageReads, 0, "⛔ the reload reads no enumeration");
}

// ---------------------------------------------------------------------------
// 4. ⛔ THE WEEK ROLL — eight days on, the weekly list empties ALONE
// ---------------------------------------------------------------------------
{
  const raw0 = stored(workStore);
  H.assert(raw0 && raw0.weeklyUnlocked.length > 0,
           `fixture: the store holds W39's weekly unlocks before the roll (${J(raw0 && raw0.weeklyUnlocked)})`);
  const W = open({ store: workStore, base: BASE + ROLL, hash: false });
  const snap = W.X.Meta.achievements();
  H.eq(snap.weekKey, "2026-W40", "fixture: the clock moved eight days, into the next ISO week");
  H.eq(J(snap.weeklyUnlocked), "[]", "⛔ A WEEK ROLL EMPTIES weeklyUnlocked");
  H.eq(J(snap.lifetimeUnlocked), J(beforeRoll.lifetimeUnlocked), "⛔ and keeps lifetimeUnlocked");
  H.eq(sortedTiers(snap.lifetimeTiers), sortedTiers(beforeRoll.lifetimeTiers), "⛔ and keeps lifetimeTiers");
  H.eq(J(snap.weekly), J(W.X.Achievements.weeklyFor("2026-W40")), "and shows the new week's five");
  H.assert(J(snap.weekly) !== J(beforeRoll.weekly), "non-vacuity: a different five from W39's");

  // A run in the new week: it may re-earn a row W39 already held, and the
  // store it writes carries W40 and the lifetime stores, raised or kept.
  const u0 = W.unlocks.length;
  W.runCase(0, "classic", 1);
  H.eq(W.exceptions.length + W.stuck.length, 0, `no exception in the rolled week's run${W.exceptions[0] ? " — " + W.exceptions[0] : ""}`);
  const got = W.unlocks.slice(u0).filter(u => rowOf[u.id].weekly);
  H.assert(got.length > 0 && got.every(u => u.weekKey === "2026-W40"),
           `non-vacuity: the rolled week earned its own weekly (${got.map(u => u.id).join(", ")})`);
  const raw = stored(workStore);
  H.eq(raw.weekKey, "2026-W40", "⛔ the next write stores the NEW week");
  H.assert(raw.weeklyUnlocked.every(id => snap.weekly.indexOf(id) >= 0),
           "⛔ and only the new week's ids in weeklyUnlocked — W39's are gone");
  H.assert(beforeRoll.lifetimeUnlocked.every(id => raw.lifetimeUnlocked.indexOf(id) >= 0),
           "⛔ every lifetime unlock survived the roll AND the write");
  H.assert(Object.keys(beforeRoll.lifetimeTiers).every(id => raw.lifetimeTiers[id] >= beforeRoll.lifetimeTiers[id]),
           "⛔ and no tier fell (GDD 15.5: monotonic)");
  H.eq(W.X._env.storageReads, 0, "⛔ the rolled build reads no enumeration");
}

// ---------------------------------------------------------------------------
// 5. ⛔ STORAGE — no enumeration read, only declared keys
// ---------------------------------------------------------------------------
{
  H.eq(work.X._env.storageReads, 0, "⛔ no enumeration read across the working session (localStorage.length, key(i))");
  H.eq(stub.X._env.storageReads, 0, "and none across the stubbed twin");
  const declared = new RegExp(`^${NS.replace(/\./g, "\\.")}(profiles|scores|(p\\d+\\.)?(settings|progress|telemetry|achievements))$`);
  for (const [name, m] of [["working", workStore], ["stubbed", stubStore]]) {
    const keys = [...m.keys()];
    const stray = keys.filter(k => !declared.test(k));
    H.eq(J(stray), "[]", `⛔ ${name}: only declared keys in storage (${J(keys)})`);
  }
  H.assert(workStore.has(ACH) && workStore.has(NS + "scores") && workStore.has(NS + "progress"),
           "non-vacuity: achievements, scores and progress are all stored");
  // ⛔ THE STORED SHAPE IS GDD 15.5's FOUR STORES, ARRAYS NOT SETS (A6).
  const raw = stored(workStore);
  H.eq(J(Object.keys(raw).sort()), J(["lifetimeTiers", "lifetimeUnlocked", "weekKey", "weeklyUnlocked"]),
       "⛔ the envelope is GDD 15.5's four stores and nothing else");
  H.eq(JSON.parse(workStore.get(ACH)).v, 1, "⛔ at v1");
}

H.report("test-cs015-p4.js");
