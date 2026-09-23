// test-cs016-p4.js — CS016's closing phase: the FOURTEENTH SOAK (plan §6; GDD
// 12, 17 item 12, 19's Onboarding row). Its pair holds THE PROMPTS AND THE
// DEMO'S DRIVER constant: one front-door session that never idles (Classic at
// Start Depth 15, Overdrive at 17, each to game over, RESTART, again, QUIT),
// as is and with promptScan, promptStep and attractDrive stubbed — ⛔ the
// whole-board hash identical on every frame, every row fired EXACTLY ONCE and
// drawn. Then a RELOAD fires nothing seen; a NEW PROFILE idles the title into
// the demo, ends it with Fire, the store's bytes unmoved, and a real run,
// eligible, sees every row once more; a switch BACK and a second reload fire
// nothing. ⛔ TRAPS. 1. Seed, Date.now and build are re-made per build.
//  2. ⛔ Date.now is WALL time, the frame clock plus a base (test-cs015-p4.js):
//     a read does not advance it, so the pair's RESTART seeds agree.
//  3. Two live steps before the first press; stop pressing at the stop; MODE
//     is OVERDRIVE then CLASSIC. 4. A trigger is PROBED off the REAL scan with
//     one row unseen and a scratch queue — never re-derived, never in the pair.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20261023;
installSeed(SEED);                          // ⛔ above the first buildGame() (trap 1)

const J = JSON.stringify;
const NS = "coinless.vector-vortex.";
const DAY = 86400000;
const BASE = Date.UTC(2026, 8, 28, 12);     // Monday noon UTC (trap 2)
const RECORD = { classic: 15, overdrive: 17 };   // staged per profile, so both lists reach them
const PLAN = [["classic", RECORD.classic], ["overdrive", RECORD.overdrive]];
const HOLD_TICKS = 9000;                    // test-cs008-p8.js trap 2
const SEGMENT_CAP = 40000;
const PIN_TICKS = 300;
const DEMO_SECONDS = 30;                    // of ATTRACT_LENGTH's 45: past the demo's first clear edge
const STUBS = ["promptScan", "promptStep", "attractDrive"];
const MEASURE = !!process.env.P4_MEASURE;

// ---------------------------------------------------------------------------
// ⛔ THE DRIVER — test-cs015-p4.js's, UNCHANGED (test-cs014-p3.js's four-clause
// L11+ hunter). Every clause is a no-op in Classic.
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

function open(o) {
  installSeed(SEED);                        // trap 1
  const S = { clock: 0, base: o.base };
  Date.now = () => S.base + S.clock;        // trap 2
  const X = H.buildGame({ store: o.store, stub: o.stub || [],
                          spy: ["drawText", "attractDrive", "promptScan", "startGame"] });
  const { C, state } = X;
  const G = X.Game, MS = C.FIXED_DT * 1000;
  const ids = C.PROMPTS.map(r => r.id);
  Object.assign(S, { X, C, G, state, ids, hashes: [], steps: 0, exceptions: [], stuck: [], cases: [],
                     levels: new Set(), fires: [], drawn: [], line: 0, starts: [], probe: null });
  const who = () => { const p = X.Profiles.current(); return p ? p.id : null; };
  S.who = who;

  // Every row that joins the game's queue, stamped (test-cs016-p1.js trap 2).
  const rows = X.promptQueue.rows, push = rows.push;
  rows.push = function (r) {
    S.fires.push({ id: r.id, profile: who(), mode: state.mode, level: state.level, step: S.steps });
    return push.call(this, r);
  };
  // What the band draws: a row's text, or the demo's line.
  X.drawText.before = (ctx, text, x, y) => {
    if (y !== C.PROMPT_Y) return;
    if (text === C.ATTRACT_LINE) S.line++;
    else S.drawn.push({ text, profile: who(), step: S.steps });
  };
  X.startGame.before = (seed, opts) => S.starts.push({ attract: !!(opts && opts.attract), profile: who() });

  const hash = o.hash ? makeHasher(X, () => [G.hitStopLeft, G.menu.cursor, G.stats.ticks]) : null;
  S.halfFrame = () => { S.clock += MS / 2; G.frame(S.clock); if (hash) S.hashes.push(hash()); };
  S.liveStep = () => {
    const want = G.stats.ticks + 1;
    for (let n = 0; G.stats.ticks < want && n < 8; n++) S.halfFrame();
  };
  S.stepN = n => { for (let i = 0; i < n; i++) S.liveStep(); };
  S.press = k => { G.input.keyDown(k); S.liveStep(); G.input.keyUp(k); S.liveStep(); };
  S.right = n => { for (let i = 0; i < n; i++) { G.input.keyDown("ArrowRight"); S.liveStep(); S.liveStep(); G.input.keyUp("ArrowRight"); S.liveStep(); } };
  S.releaseAll = () => { for (const k of [" ", "x", "arrowup", "ArrowLeft", "ArrowRight"]) G.input.keyUp(k); };
  S.bytes = () => J([...o.store.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)));

  // ⛔ THE PROBE (trap 4): which rows' triggers hold on this board, read off
  // the REAL scan with exactly one row unseen and a scratch queue. The game's
  // own queue and Meta's seen set are not touched.
  const scratch = { rows: [], t: 0 };
  const allBut = ids.map(id => new Set(ids.filter(x => x !== id)));
  S.probeStep = () => {
    if (!S.probe || state.screen !== "play") return;
    const well = X.WELLS[state.wellIndex];
    for (let n = 0; n < ids.length; n++) {
      if (X.promptScan(state, well, allBut[n], scratch) === ids[n]) S.probe.add(ids[n]);
      scratch.rows.length = 0;
    }
  };

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
      S.levels.add(`${who()}:${state.mode}:${state.level}`);
      S.probeStep();
    }
    S.releaseAll();                          // trap 3
    for (let n = 0; G.hitStopLeft > 0 && n < 1000; n++) S.halfFrame();
    S.liveStep(); S.liveStep();
  };

  // PLAY → the mode → START DEPTH d → a run [→ RESTART → a run] → QUIT TO TITLE.
  S.runCase = (k, mode, depth, restart) => {
    const r = { mode, depth, profile: who(), started: false, eligible: false, restarted: !restart, quit: false };
    try {
      S.press(" ");                                        // PLAY
      if (mode === "classic") S.right(1);                  // trap 3
      S.press(" ");                                        // the mode
      const row = X.startDepthOptions(mode).indexOf(depth);
      for (let n = 0; n < row; n++) S.right(1);
      S.press(" ");                                        // LEVEL d
      r.started = row >= 0 && state.screen === "play" && state.level === depth && state.mode === mode;
      r.eligible = X.Meta.eligible();
      r.seed = state.seed;
      S.playSegment(k, 0);
      if (restart) {
        S.press(" ");                                      // RESTART
        r.restarted = state.screen === "play" && state.startDepth === depth && state.mode === mode;
        S.playSegment(k, 1);
      }
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
    return r;
  };

  // The title's fourth row, PROFILE (PLAY, OPTIONS, SCORES, PROFILE, ACHIEVEMENTS).
  // NEW PROFILE types a name and commits, which selects it (test-cs011-p6.js).
  S.newProfile = name => {
    S.right(3); S.press(" ");
    const onProfile = state.screen === "profile";
    S.right(X.Profiles.list().length); S.press(" ");
    const onName = state.screen === "profileName";
    for (const ch of name.toLowerCase()) S.press(ch);
    S.press("Enter");
    const cur = X.Profiles.current();
    const ok = onProfile && onName && state.screen === "profile" && cur && cur.name === name;
    S.press("Escape");
    return ok && state.screen === "title" ? cur.id : null;
  };
  // PROFILE → a profile's row → SELECT → back to the title.
  S.selectProfile = id => {
    S.right(3); S.press(" ");
    const row = X.Profiles.list().findIndex(p => p.id === id);
    const onProfile = state.screen === "profile";
    S.right(row); S.press(" ");
    const onPage = state.screen === "profilePage";
    S.press(" ");                                          // SELECT
    const ok = onProfile && onPage && state.screen === "profile" && who() === id;
    S.press("Escape");
    return ok && state.screen === "title";
  };
  S.stageRecords = () => {
    X.levelRecord("classic").noteCleared(RECORD.classic);
    X.levelRecord("overdrive").noteCleared(RECORD.overdrive);
  };

  S.halfFrame();
  S.liveStep(); S.liveStep();                // trap 3: the title's entry step
  return S;
}

const firesOf = (S, profile) => S.fires.filter(f => f.profile === profile).map(f => f.id);
const once = (C, list) => C.PROMPTS.map(r => r.id).filter(id => list.filter(x => x === id).length !== 1);

// ===========================================================================
// 1. THE PAIR — a session that never idles, as is and with the module stubbed
// ===========================================================================

function session(o) {
  const S = open({ store: o.store, base: BASE, stub: o.stub, hash: true });
  S.stageRecords();
  for (let k = 0; k < PLAN.length; k++) S.runCase(k, PLAN[k][0], PLAN[k][1], true);
  return S;
}

const workStore = new Map(), twinStore = new Map();
const work = session({ store: workStore });
const twin = session({ store: twinStore, stub: STUBS });
const C = work.C;
const IDS = C.PROMPTS.map(r => r.id);
const P0 = work.who();

if (MEASURE) {
  console.log(J({ steps: work.steps, frames: work.hashes.length, cases: work.cases,
                  fires: work.fires, drawn: [...new Set(work.drawn.map(d => d.text))].length,
                  levels: [...work.levels].sort() }));
}

for (const [name, s] of [["working", work], ["stubbed", twin]]) {
  H.eq(s.exceptions.length, 0, `⛔ no exception in the ${name} session${s.exceptions[0] ? " — " + s.exceptions[0] : ""}`);
  H.eq(s.stuck.length, 0, `${name}: every run reached game over${s.stuck[0] ? " — " + s.stuck[0] : ""}`);
  for (const [k, r] of s.cases.entries()) {
    H.assert(r.started && r.restarted && r.quit && r.eligible,
             `${name} case ${k}: ${r.mode} START DEPTH ${r.depth} → play, eligible → RESTART → QUIT TO TITLE (${J(r)})`);
  }
  // ⛔ THE PRECONDITION: THIS SESSION NEVER IDLES INTO A DEMO.
  H.eq(s.starts.filter(x => x.attract).length + s.X.attractDrive.calls + s.line, 0,
       `⛔ ${name}: the session never idles — no demo start, no driver call, no demo line`);
}
for (const [mode, depth] of PLAN) {
  H.assert(work.levels.has(`${P0}:${mode}:${depth}`), `non-vacuity: ${mode} played at Start Depth ${depth}`);
}

// ⛔ THE MODULE STEERS NOTHING — the hash, frame for frame.
{
  const a = work.hashes, b = twin.hashes;
  const n = Math.min(a.length, b.length);
  let firstDiff = -1;
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) { firstDiff = i; break; }
  H.eq(a.length, b.length, "⛔ both sessions ran the same number of frames");
  H.eq(firstDiff, -1, `⛔ the whole-board hash is identical on every frame with promptScan, promptStep and ` +
       `attractDrive stubbed (${n} frames, ${work.steps} play steps)`);
  H.eq(work.steps, twin.steps, "and the same number of play steps");
  H.assert(new Set(a).size > n / 4, "non-vacuity: the hash moves with the board");
  H.assert(n > 20000, `non-vacuity: the session is a soak (${n} frames)`);
  // ⛔ AND THE TWIN IS A REAL TWIN: its seats ran, and fired, drew and stored nothing.
  H.assert(twin.X.promptScan.calls > 0, `fixture: the twin's scan seat ran, stubbed (${twin.X.promptScan.calls} calls)`);
  H.eq(twin.fires.length + twin.drawn.length, 0, "fixture: the stubbed twin fired and drew no prompt");
  H.eq(twinStore.has(NS + "onboarding"), false, "fixture: and never wrote the onboarding key");
  H.assert(work.fires.length > 0 && workStore.has(NS + "onboarding"),
           `non-vacuity: the working session DID fire and store (${work.fires.length} fires)`);
}

// ⛔ EVERY ROW EXACTLY ONCE ON THE PROFILE, ACROSS BOTH RESTARTS, AND DRAWN.
{
  const got = firesOf(work, P0);
  H.eq(J(once(C, got)), "[]", `⛔ every C.PROMPTS row fired EXACTLY ONCE on ${P0} across two RESTARTs (${J(got)})`);
  H.eq(got.length, IDS.length, "and nothing else fired");
  H.assert(work.fires.some(f => f.mode === "classic") && work.fires.some(f => f.mode === "overdrive"),
           "non-vacuity: rows fired in both modes");
  // A row is SEEN when the band draws it: every fired row's text reached the screen.
  const texts = new Set(work.drawn.map(d => d.text));
  const unseen = C.PROMPTS.filter(r => !texts.has(r.text)).map(r => r.id);
  H.eq(J(unseen), "[]", "⛔ every row's line was drawn in the band");
  H.eq(J([...work.X.Meta.promptsSeen()].sort()), J(IDS.slice().sort()), "⛔ Meta holds all twelve seen");
  const stored = JSON.parse(workStore.get(NS + "onboarding"));
  H.eq(J([stored.v, stored.d.seen.slice().sort()]), J([1, IDS.slice().sort()]),
       "⛔ and the store holds them, { seen } at v1, written at a seat");
  // The RESTARTs are non-vacuous for row 1 by its trigger: it holds on EVERY play step.
  H.assert(work.cases.every(r => r.restarted), "non-vacuity: both RESTARTs played (row 1's trigger holds on every play step)");
  console.log(`  MEASURED (CS016 P4): the pair — ${work.hashes.length} frames, ${work.steps} play steps; ` +
              `fired ${J(work.fires.map(f => `${f.id}@${f.mode[0]}${f.level}`))}`);
}

// ===========================================================================
// 2. THE RELOAD, A NEW PROFILE, THE DEMO, A SWITCH BACK
// ===========================================================================

const R = open({ store: workStore, base: BASE + DAY });
const heldP0 = new Set();
{
  H.eq(R.who(), P0, "fixture: the reload boots the same profile");
  H.eq(R.X.Meta.promptsSeen().size, IDS.length, "⛔ reload: the seen set loads all twelve");
  // Both modes again, the probe on: nothing fires that the profile saw.
  R.probe = heldP0;
  for (let k = 0; k < PLAN.length; k++) R.runCase(10 + k, PLAN[k][0], PLAN[k][1], true);
  R.probe = null;
  H.eq(J(firesOf(R, P0)), "[]", "⛔ a RELOAD fires nothing the profile saw");
  H.assert(heldP0.size >= IDS.length - 1,
           `non-vacuity: the reload's runs held ${heldP0.size} of the ${IDS.length} triggers (${J([...heldP0])})`);
}

// A NEW PROFILE, then the title idled into the demo.
let P1 = null, demo = {};
{
  P1 = R.newProfile("SECOND");
  H.assert(P1 !== null && P1 !== P0, `fixture: PROFILE → NEW PROFILE → SECOND, selected, back on the title (${P1})`);
  H.eq(R.X.Meta.promptsSeen().size, 0, "⛔ a new profile starts with nothing seen");
  // ⛔ No record staged yet: a demo clear that reached noteCleared() would
  // raise this profile's Overdrive record from nothing, and move a byte.
  H.eq(R.X.levelRecord("overdrive").highestCleared(), 0, "fixture: the new profile has no Overdrive record");
  R.liveStep(); R.liveStep();

  const bytes = R.bytes(), fires0 = R.fires.length, drawn0 = R.drawn.length, line0 = R.line;
  const { state, C: RC, X, G } = R;
  let n = 0;
  for (n = 1; n <= 1400 && state.screen !== "play"; n++) R.liveStep();
  demo.idled = n;
  demo.started = state.screen === "play" && R.starts.length > 0 && R.starts[R.starts.length - 1].attract;
  demo.shape = J({ mode: state.mode, level: state.level, seed: state.seed });
  const held = new Set();
  R.probe = held;
  let steps = 0, ineligible = 0;
  while (state.screen === "play" && steps < Math.round(DEMO_SECONDS / RC.FIXED_DT)) {
    R.liveStep(); R.probeStep(); steps++;
    if (!X.Meta.eligible()) ineligible++;
  }
  R.probe = null;
  Object.assign(demo, { steps, ineligible, held, time: state.time, clears: state.tally.wellsCleared,
                        driven: X.attractDrive.calls, playing: state.screen === "play" });
  // ⛔ ENDED BY FIRE — the line's own input — on that step.
  G.input.keyDown(" "); R.liveStep();
  demo.ended = state.screen;
  for (let i = 0; i < 12; i++) R.liveStep();               // held across the title's entry step
  G.input.keyUp(" "); R.stepN(6);
  demo.after = state.screen;
  Object.assign(demo, { bytesSame: R.bytes() === bytes, fires: R.fires.length - fires0,
                        drawn: R.drawn.length - drawn0, line: R.line - line0,
                        seen: X.Meta.promptsSeen().size });

  H.assert(demo.started && demo.idled > 1000, `⛔ the title, idled, entered the demo (${demo.idled} steps, ${demo.shape})`);
  H.eq(demo.shape, J({ mode: RC.ATTRACT_MODE, level: RC.ATTRACT_DEPTH, seed: RC.ATTRACT_SEED >>> 0 }),
       "and it is the shipped demo: ATTRACT_MODE at ATTRACT_DEPTH on ATTRACT_SEED");
  H.assert(demo.playing && demo.time < RC.ATTRACT_LENGTH,
           `fixture: still in the demo when Fire came (${demo.time.toFixed(2)} s < ${RC.ATTRACT_LENGTH})`);
  H.assert(demo.driven >= demo.steps, `fixture: the driver drove every demo step (${demo.driven})`);
  H.eq(demo.ineligible, demo.steps, `⛔ Meta.eligible() is false on every demo step (${demo.steps})`);
  H.eq(demo.ended, "title", "⛔ Fire ENDS the demo on that step");
  H.eq(demo.after, "title", "⛔ and confirms no row: still the title after the release");
  H.eq(demo.fires + demo.drawn, 0, "⛔ the demo fired and drew no prompt");
  H.eq(demo.seen, 0, "⛔ and marked none seen");
  H.assert(demo.line >= demo.steps, `⛔ the demo's line was drawn on every demo frame (${demo.line} ≥ ${demo.steps})`);
  H.assert(demo.held.has("rotate") && demo.held.size >= 4,
           `non-vacuity: ${demo.held.size} triggers held in the demo (${J([...demo.held])})`);
  H.assert(demo.clears >= 1, `non-vacuity: the demo passed a clear edge (${demo.clears} wells)`);
  H.assert(demo.bytesSame, "⛔ ZERO STORAGE BYTES CHANGED across the idle, the demo and its ending");
}

// A real run on the new profile: eligible, and every row again, once.
const heldP1 = new Set();
{
  R.stageRecords();
  const bytes = R.bytes();
  R.probe = heldP1;
  const cs = PLAN.map(([mode, depth], k) => R.runCase(20 + k, mode, depth, true));
  R.probe = null;
  H.assert(cs.every(r => r.started && r.restarted && r.quit && r.profile === P1),
           `the new profile: both cases through the front door, with RESTART (${J(cs)})`);
  H.assert(cs[0].eligible, "⛔ the real run after the demo is ELIGIBLE");
  H.assert(cs[0].seed !== (C.ATTRACT_SEED >>> 0), `and on its own time seed (${cs[0].seed})`);
  H.eq(R.starts.filter(s => s.profile === P1 && !s.attract).length, 4, "fixture: four real starts on the new profile");
  const got = firesOf(R, P1);
  H.eq(got[0], "rotate", "⛔ the demo marked nothing: the new profile's first real step shows the first line");
  H.eq(J(once(C, got)), "[]", `⛔ A NEW PROFILE SEES EVERY ROW AGAIN, EXACTLY ONCE, across two RESTARTs (${J(got)})`);
  H.eq(got.length, IDS.length, "and nothing else");
  const texts = new Set(R.drawn.filter(d => d.profile === P1).map(d => d.text));
  H.eq(J(C.PROMPTS.filter(r => !texts.has(r.text)).map(r => r.id)), "[]", "⛔ and every row's line was drawn on it");
  if (MEASURE) {
    const lag = S => IDS.map(id => {
      const f = S.fires.find(x => x.id === id && x.profile === (S === work ? P0 : P1));
      const text = C.PROMPTS.find(r => r.id === id).text;
      const d = S.drawn.find(x => x.text === text && x.profile === (S === work ? P0 : P1));
      return `${id}:${f ? f.step : "-"}->${d ? d.step : "-"}`;
    });
    console.log(J({ lagP0: lag(work), lagP1: lag(R) }));
  }
  H.assert(R.bytes() !== bytes, "non-vacuity: the real runs DID write the store");
  const own = workStore.get(`${NS}${P1}.onboarding`);
  H.eq(own ? J(JSON.parse(own).d.seen.slice().sort()) : null, J(IDS.slice().sort()),
       "⛔ per profile: the new profile's twelve under its own scope");
  H.eq(J(JSON.parse(workStore.get(NS + "onboarding")).d.seen.slice().sort()), J(IDS.slice().sort()),
       "and p0's root key still holds its own twelve");
}

// A switch BACK: nothing fires.
const heldBack = new Set();
{
  H.assert(R.selectProfile(P0), "fixture: PROFILE → the first profile → SELECT → the title");
  H.eq(R.X.Meta.promptsSeen().size, IDS.length, "⛔ a switch back loads the first profile's twelve");
  R.probe = heldBack;
  R.runCase(30, "overdrive", RECORD.overdrive, false);
  R.probe = null;
  H.eq(J(firesOf(R, P0)), "[]", "⛔ and the first profile, switched back to, fires nothing");
  H.assert(heldBack.size >= 6, `non-vacuity: ${heldBack.size} triggers held on that run (${J([...heldBack])})`);
  H.eq(R.exceptions.length + R.stuck.length, 0, `no exception in the reload${R.exceptions[0] ? " — " + R.exceptions[0] : ""}`);
  H.assert(R.cases.every(r => r.started && r.restarted && r.quit),
           `every case of the reload started, restarted where asked, and quit (${J(R.cases.map(r => r.started && r.restarted && r.quit))})`);
  // ⛔ Across both profiles, every trigger held while it was already seen, and fired nothing.
  const all = new Set([...heldP0, ...heldBack]);
  H.eq(J(IDS.filter(id => !all.has(id) && id !== "unlock")), "[]",
       `non-vacuity: every board-read trigger held on the first profile after it had seen all twelve`);
  console.log(`  MEASURED (CS016 P4): demo ${demo.steps} steps, ${demo.clears} clear(s), held ${J([...demo.held])}; ` +
              `reload held ${J([...heldP0])}; switch-back held ${J([...heldBack])}`);
}

// ===========================================================================
// 3. A SECOND RELOAD — both sets held, and the second profile fires nothing
// ===========================================================================
{
  const F = open({ store: workStore, base: BASE + 2 * DAY });
  H.eq(F.who(), P0, "fixture: the second reload boots the profile last selected");
  H.eq(F.X.Meta.promptsSeen().size, IDS.length, "⛔ second reload: the first profile's twelve");
  H.assert(F.selectProfile(P1), "fixture: PROFILE → SECOND → SELECT");
  H.eq(F.X.Meta.promptsSeen().size, IDS.length, "⛔ and the second profile's twelve");
  const held = new Set();
  F.probe = held;
  F.runCase(40, "classic", RECORD.classic, false);
  F.probe = null;
  H.eq(J(firesOf(F, P1)) + F.exceptions.length, "[]0", "⛔ the second profile, reloaded, fires nothing");
  H.assert(held.size >= 6, `non-vacuity: ${held.size} triggers held (${J([...held])})`);
  H.eq(F.X._env.storageReads + R.X._env.storageReads + work.X._env.storageReads + twin.X._env.storageReads, 0,
       "⛔ no enumeration read in any build (localStorage.length, key(i))");
}

// ===========================================================================
// 4. STORAGE — declared keys only
// ===========================================================================
{
  const declared = new RegExp(`^${NS.replace(/\./g, "\\.")}(profiles|scores|(p\\d+\\.)?(settings|progress|telemetry|achievements|onboarding))$`);
  for (const [name, m] of [["working", workStore], ["stubbed", twinStore]]) {
    const keys = [...m.keys()];
    H.eq(J(keys.filter(k => !declared.test(k))), "[]", `⛔ ${name}: only declared keys in storage (${J(keys)})`);
  }
  H.assert(workStore.has(`${NS}${P1}.onboarding`) && workStore.has(NS + "onboarding"),
           "non-vacuity: both profiles' onboarding keys are stored");
}

H.report("test-cs016-p4.js");
