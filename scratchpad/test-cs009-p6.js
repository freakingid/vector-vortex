// test-cs009-p6.js — CS009's closing phase: the SEVENTH SOAK. One front-door
// session (test-cs008-p8.js's driver shape) played TWICE: once on the recording
// fake with a real gesture through the input's DOM handler, once with no audio
// API. ⛔ The state hash matches on every frame, so audio spends no draw and
// writes no state across real play (plan §10 item 12). The audio session also
// holds: no exception; nodes per scheduled step <= C.MUSIC_STEP_NODE_MAX; a 60 s
// hidden gap schedules no burst; held Surger voices <= telegraphing Surgers on
// every frame, and none outlives play; every plan §7 event sounded.
//
// ⛔ TRAPS IN THE FIXTURES.
//  1. Seed, Date.now counter and build are re-made per session, in that order.
//  2. Two live steps before the first press; no gameplay press past a game over.
//  3. The Start Depth record is staged (a sitting's noteCleared) so the list
//     reaches the Surger's level; `lifeLost` is staged (no played board reaches
//     C.LIVES_MAX). Each staging runs in BOTH sessions, so the hash covers it.
//  4. The fake's clock is the frame clock. The gap jumps both; no frame runs in it.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260916;
installSeed(SEED);                          // ⛔ above the first buildGame() (trap 1)

const EVENTS = ["fire", "kill", "split", "chip", "bolt", "cross", "surgeCharge", "surgeDischarge",
  "death", "gameOver", "respawn", "purge", "purgeWeak", "extraLife", "lifeLost", "wellClear",
  "dive", "diveStrike", "menuMove", "menuConfirm", "menuBack"];

const DEPTHS = [1, 13, 23];                 // one case each: two runs, RESTART between
const RECORD = 23;                          // trap 3
const HOLD_TICKS = 9000;                    // test-cs008-p8.js trap 2
const SEGMENT_CAP = 40000;
const PIN_TICKS = 300;
const GAP_CASE = 0, GAP_AT = 1200, GAP_MS = 60000;
const CAP_CASE = 2;
const MEASURE = !!process.env.P6_MEASURE;

// test-cs005-p5.js's recorded rotation and wall-to-wall pin, as test-cs008-p8.js
// drives it: fire held, a Purge every 311 steps, rotation only after HOLD_TICKS.
function drive(inp, i) {
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

// A DOM target that records its listeners (test-cs009-p1.js's shape).
function fakeTarget() {
  const l = {};
  return {
    l, visibilityState: "visible",
    addEventListener(type, fn) { (l[type] = l[type] || []).push(fn); },
    removeEventListener(type, fn) { if (l[type]) l[type] = l[type].filter(f => f !== fn); },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
    fire(type, ev) { for (const f of (l[type] || []).slice()) f(Object.assign({ preventDefault() {} }, ev)); },
  };
}

// ⛔ The whole board, walked: every own field of `state` and what it reaches,
// exact float bits, keys in insertion order — a field audio wrote, or a value it
// moved, changes the hash. A well is its index; a function is skipped (the
// run's stream shows up in what its draws decide).
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
// ONE SESSION
// ===========================================================================

function session(audio) {
  installSeed(SEED);                        // trap 1
  let now = 0;
  Date.now = () => (now += 7919);
  const X = H.buildGame({ audio, spy: ["sfx"] });
  const { C, state } = X;
  const G = X.Game, A = X.AudioSys, M = X.MusicSys, S = X.Sfx, rec = X._audio;
  const MS = C.FIXED_DT * 1000;

  const out = {
    hashes: [], steps: 0, calls: {}, played: {}, holds: 0, stops: 0,
    ctxBeforePress: null, ctxAfterPress: null, cases: [],
    voices: { over: 0, leak: 0, maxTele: 0, framesSounding: 0, first: null },
    nodes: { max: 0, steps: 0, byTrack: {}, over: 0 },
    gap: null, levels: new Set(), exceptions: [], stuck: [],
  };
  for (const n of EVENTS) { out.calls[n] = 0; out.played[n] = 0; }
  X.sfx.before = name => { out.calls[name] = (out.calls[name] || 0) + 1; };

  // ---- the audio session's instruments: they observe and pass through ----
  let frameSteps = 0;
  if (audio) {
    const nameOf = new Map(Object.keys(C.SFX).map(n => [C.SFX[n], n]));
    const play0 = S.play, hold0 = S.hold, sched0 = M.scheduleStep;
    S.play = function (recipe, o) { out.played[nameOf.get(recipe)]++; return play0.call(this, recipe, o); };
    S.hold = function (recipe) {
      const v = hold0.call(this, recipe);
      if (recipe === C.SFX.surgeCharge) out.played.surgeCharge++;
      out.holds++;
      const stop0 = v.stop;
      let done = false;
      v.stop = function () { if (!done) { done = true; out.stops++; } return stop0.apply(this, arguments); };
      return v;
    };
    M.scheduleStep = function (step, t) {
      const n0 = rec.nodes.length;
      const r = sched0.call(this, step, t);
      const n = rec.nodes.length - n0;
      frameSteps++;
      out.nodes.steps++;
      out.nodes.byTrack[this.state] = (out.nodes.byTrack[this.state] || 0) + 1;
      if (n > out.nodes.max) out.nodes.max = n;
      if (n > C.MUSIC_STEP_NODE_MAX) out.nodes.over++;
      return r;
    };
  }

  const hash = makeHasher(X, () => [G.hitStopLeft, G.menu.cursor, G.stats.ticks]);
  const telegraphing = () => state.enemies.filter(e => !e.dead && e.phase === "telegraph" &&
                                                        typeof e.chargeTip === "function").length;

  // ---- the frame loop: every frame is instrumented here, and only here ----
  let clock = 0;
  function frameAt(ms) {
    clock = ms;
    if (A.ctx) A.ctx.currentTime = clock / 1000;   // trap 4
    frameSteps = 0;
    G.frame(clock);
    out.hashes.push(hash());
    if (audio) {
      const live = out.holds - out.stops, tele = telegraphing();
      if (tele > out.voices.maxTele) out.voices.maxTele = tele;
      if (live > 0) out.voices.framesSounding++;
      if (live > tele) {
        out.voices.over++;
        if (!out.voices.first) out.voices.first = `level ${state.level}: ${live} voices, ${tele} telegraphing`;
      }
      if (live > 0 && (state.screen !== "play" || G.hitStopLeft > 0)) {
        out.voices.leak++;
        if (!out.voices.first) out.voices.first = `a voice on "${state.screen}" (freeze ${G.hitStopLeft})`;
      }
    }
  }
  const halfFrame = () => frameAt(clock + MS / 2);
  function liveStep() {
    const want = G.stats.ticks + 1;
    for (let n = 0; G.stats.ticks < want && n < 8; n++) halfFrame();
  }

  // ⛔ Menu presses go through the input's DOM handler, so each is a gesture.
  const doc = fakeTarget(), win = fakeTarget(), el = fakeTarget();
  G.input.attach({ document: doc, window: win, element: el });
  function press(k) { doc.fire("keydown", { key: k }); liveStep(); doc.fire("keyup", { key: k }); liveStep(); }
  function tapRight() { doc.fire("keydown", { key: "ArrowRight" }); liveStep(); liveStep(); doc.fire("keyup", { key: "ArrowRight" }); liveStep(); }
  function releaseAll() { for (const k of [" ", "x", "ArrowLeft", "ArrowRight"]) G.input.keyUp(k); }

  // ⛔ THE HIDDEN GAP: the page hides, no frame runs for GAP_MS, the page returns.
  function hiddenGap() {
    const g = { lag: 0, steps: -1, bound: 0, track: null, pausedBy: null, resumed: false };
    doc.visibilityState = "hidden";
    doc.fire("visibilitychange", {});
    doc.visibilityState = "visible";
    const due = audio ? M.nextStepTime : 0;
    frameAt(clock + GAP_MS);
    if (audio) {
      g.lag = A.ctx.currentTime - due;
      g.steps = frameSteps;
      g.track = M.state;
      g.bound = M.track ? Math.ceil(C.MUSIC_LOOKAHEAD / M.track.stepDur) + 1 : 0;
    }
    g.pausedBy = state.screen;
    for (let n = 0; n < 4; n++) halfFrame();
    press("Escape");                        // RESUME, through the pause's back
    g.resumed = state.screen === "play";
    out.gap = g;
  }

  function playSegment(k, seg) {
    let i = 0, drivenFor = -1, guard = 0;
    while (state.screen !== "gameover") {
      if (state.screen !== "play" || i > SEGMENT_CAP || guard++ > SEGMENT_CAP * 4) {
        out.stuck.push(`case ${k} run ${seg}: on "${state.screen}" at step ${i}`);
        throw new Error("the segment did not end in game over");
      }
      if (k === GAP_CASE && seg === 0 && i === GAP_AT && !out.gap) { hiddenGap(); continue; }
      if (k === CAP_CASE && seg === 0 && i === 0 && drivenFor < 0) {
        state.lives = C.LIVES_MAX;          // trap 3: the next award meets the cap
        state.score = state.nextLife - 1;
      }
      if (G.hitStopLeft === 0 && drivenFor !== i) { drive(G.input, i); drivenFor = i; }
      const t0 = G.stats.ticks;
      halfFrame();
      if (G.stats.ticks === t0) continue;
      i++;
      out.steps++;
      out.levels.add(state.level);
    }
    releaseAll();                           // trap 2
    for (let n = 0; G.hitStopLeft > 0 && n < 1000; n++) halfFrame();
    liveStep(); liveStep();
    if (rec) { rec.clear(); rec.nodes.length = 0; }   // the logs, never the contexts
  }

  frameAt(0);
  X.levelRecord("classic").noteCleared(RECORD);   // trap 3 (the record is per mode, CS012 P3)
  liveStep(); liveStep();                   // trap 2: the title's entry step
  out.ctxBeforePress = A.ctx !== null;

  for (let k = 0; k < DEPTHS.length; k++) {
    const depth = DEPTHS[k];
    const r = { depth, onTitle: state.screen === "title", backed: false, started: false, restarted: false, quit: false };
    try {
      press(" ");                                          // PLAY — the gesture
      if (k === 0) out.ctxAfterPress = A.ctx !== null;
      press("Escape");                                     // back to the title
      r.backed = state.screen === "title";
      press(" ");                                          // PLAY
      // ⛔ REPAIRED IN PLACE AT CS012 P3 (O9): OVERDRIVE is MODE's first row, so
      // one step down restores this session's precondition, a CLASSIC run — which
      // is what makes AUTO resolve to `pulse` here.
      tapRight();                                          // OVERDRIVE -> CLASSIC
      press(" ");                                          // CLASSIC
      const row = X.startDepthOptions("classic").indexOf(depth);
      for (let n = 0; n < row; n++) tapRight();
      press(" ");                                          // LEVEL d
      r.started = row >= 0 && state.screen === "play" && state.level === depth && state.startDepth === depth;
      playSegment(k, 0);
      press(" ");                                          // RESTART
      r.restarted = state.screen === "play" && state.startDepth === depth;
      playSegment(k, 1);
      tapRight();
      press(" ");                                          // QUIT TO TITLE
      r.quit = state.screen === "title";
      liveStep();
    } catch (err) {
      out.exceptions.push(`case ${k}: ${err && err.stack ? err.stack.split("\n").slice(0, 3).join(" | ") : err}`);
      releaseAll();
      G.quitToTitle();
      liveStep(); liveStep();
    }
    out.cases.push(r);
  }
  return out;
}

// ===========================================================================
// THE TWO SESSIONS
// ===========================================================================

const on = session(true);
const off = session(false);

if (MEASURE) {
  const brief = s => Object.assign({}, s, { hashes: s.hashes.length, levels: [...s.levels].sort((a, b) => a - b) });
  console.log(JSON.stringify({ on: brief(on), off: brief(off) }, null, 1));
}

// ---------------------------------------------------------------------------
// ⛔ the hash, frame by frame
// ---------------------------------------------------------------------------
{
  let firstDiff = -1;
  const n = Math.min(on.hashes.length, off.hashes.length);
  for (let i = 0; i < n; i++) if (on.hashes[i] !== off.hashes[i]) { firstDiff = i; break; }
  H.eq(on.hashes.length, off.hashes.length, "⛔ both sessions ran the same number of frames");
  H.eq(firstDiff, -1, `⛔ the state hash is identical on every frame, audio on and off (${n} frames)`);
  H.eq(on.steps, off.steps, "and the same number of play steps");
  H.eq(JSON.stringify(on.calls), JSON.stringify(off.calls), "⛔ every seat fired the same number of times in both sessions");
  H.assert(new Set(on.hashes).size > n / 4, "non-vacuity: the hash moves with the board");
}

// ---------------------------------------------------------------------------
// the audio session's claims
// ---------------------------------------------------------------------------
H.eq(on.exceptions.length + off.exceptions.length, 0,
     `⛔ no exception in either session${on.exceptions[0] || off.exceptions[0] ? " — " + (on.exceptions[0] || off.exceptions[0]) : ""}`);
H.eq(on.stuck.length, 0, `every run reached game over${on.stuck[0] ? " — " + on.stuck[0] : ""}`);
for (const [k, r] of on.cases.entries()) {
  H.assert(r.onTitle && r.backed && r.started && r.restarted && r.quit,
           `case ${k}: title → back → mode → START DEPTH ${r.depth} → play → RESTART → QUIT TO TITLE (${JSON.stringify(r)})`);
}
H.eq(on.ctxBeforePress, false, "⛔ no context before the first gesture, two live steps into the title");
H.eq(on.ctxAfterPress, true, "⛔ the first key press through the input's DOM handler creates it");
H.eq(off.ctxAfterPress, false, "and the silent session never has one");

H.eq(on.nodes.over, 0, `⛔ nodes per scheduled step <= C.MUSIC_STEP_NODE_MAX (worst ${on.nodes.max} of ${on.nodes.steps} steps)`);
H.assert(on.nodes.byTrack.title > 0 && on.nodes.byTrack.pulse > 1000,
         `non-vacuity: both tracks were scheduled in play (${JSON.stringify(on.nodes.byTrack)})`);

{
  const g = on.gap || {};
  H.assert(g.lag >= GAP_MS / 1000 - 1, `fixture: the gap left the scheduler ${g.lag} s behind`);
  H.eq(g.track, "pulse", "fixture: the gameplay track was live across the gap");
  H.eq(g.pausedBy, "pause", "fixture: the hidden page paused the run");
  H.assert(g.steps >= 1 && g.steps <= g.bound,
           `⛔ one frame after a ${GAP_MS / 1000} s hidden gap schedules ${g.steps} step(s), <= ceil(lookahead / stepDur) + 1 = ${g.bound}`);
  H.assert(g.resumed, "fixture: Escape resumed play");
}

H.eq(on.voices.over, 0, `⛔ held Surger voices <= telegraphing Surgers on every frame${on.voices.first ? " — " + on.voices.first : ""}`);
H.eq(on.voices.leak, 0, "⛔ and no voice sounds on a frame that ends frozen or off play");
H.assert(on.voices.maxTele >= 1 && on.voices.framesSounding > 0 && on.holds > 0,
         `non-vacuity: Surgers telegraphed and their tone sounded (${on.holds} voices, ${on.voices.framesSounding} frames)`);

for (const n of EVENTS) {
  H.assert(on.played[n] > 0, `⛔ ${n} sounded in the audio session (${on.played[n]})`);
  if (n !== "surgeCharge") H.eq(on.played[n], on.calls[n], `every ${n} seat call reached the player`);
}
H.assert(on.levels.has(1) && on.levels.has(13) && on.levels.has(23), "non-vacuity: runs played at levels 1, 13 and 23");

H.report("test-cs009-p6.js");
