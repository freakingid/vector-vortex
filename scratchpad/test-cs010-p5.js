// test-cs010-p5.js — CS010's closing phase: the EIGHTH SOAK. test-cs009-p6.js's
// front-door driver (Start Depths 1 / 13 / 23, RESTART, QUIT TO TITLE), audio on,
// played TWICE: once with dangerInputs SPIED (state hashed before and after every
// call, plan §1.4's missing proof), once with its reading replaced by a constant
// (every field 1). ⛔ The two sessions' state hashes match on every frame, so the
// music cannot steer the run. The spied session also holds: intensity in [0, 1];
// every gate automation on a bar line of its track; `cycle` and `tick` entered and
// left; no bare `.value` on a gate, the sweep, limiter, duck or dip after the
// frame that built it; the duck at C.MUSIC_DUCK_GAIN on exactly D9's frames; D9's
// four dips; rimGlow 0 off play; nodes per step <= C.MUSIC_STEP_NODE_MAX.
//
// ⛔ TRAPS. 1. Seed, Date.now and build are re-made per session, in that order.
//  2. Two live steps before the first press; no gameplay press past a game over.
//  3. The constant session STILL RUNS the real dangerInputs (a spy always calls
//     through) and overwrites `out` after it: the spied session proves the read.
//  4. The fake's logs are cleared EVERY frame, after that frame is read.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260917;
installSeed(SEED);                          // ⛔ above the first buildGame() (trap 1)

const DEPTHS = [1, 13, 23];
const RECORD = 23;                          // a sitting's noteCleared, so the list reaches 23
const HOLD_TICKS = 9000;                    // test-cs008-p8.js trap 2
const SEGMENT_CAP = 40000;
const PIN_TICKS = 300;
const PAUSE_AT = 900;                       // the pause-side excursion, run 0 of each case
const D9_DIPS = ["purge", "purgeWeak", "death", "extraLife"];   // Paul's D9, never read off the build
const OPTIONS_PAGES = ["options", "controls", "keyboard", "gamepad", "credits"];
const TOL = 1e-6;
const MEASURE = !!process.env.P5_MEASURE;

// test-cs009-p6.js's drive, unchanged.
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

// A param's level from its OWN automation log, as the Web Audio timeline reads
// it: setValueAtTime steps, linearRampToValueAtTime ramps from the point before,
// cancelScheduledValues(t) drops every point at or after t.
function timeline(init) {
  const pts = [];
  return {
    apply(a) {
      if (a.fn === "cancelScheduledValues") { while (pts.length && pts[pts.length - 1].t >= a.t) pts.pop(); return true; }
      if (a.fn === "setValueAtTime" || a.fn === "linearRampToValueAtTime") {
        while (pts.length && pts[pts.length - 1].t > a.t) pts.pop();
        pts.push({ t: a.t, v: a.v, ramp: a.fn === "linearRampToValueAtTime" }); return true;
      }
      return false;
    },
    target() { return pts.length ? pts[pts.length - 1].v : init; },
    at(x) {
      let v = init, tPrev = -Infinity;
      for (const p of pts) {
        if (p.t <= x) { v = p.v; tPrev = p.t; continue; }
        if (p.ramp) v = tPrev === -Infinity ? v : v + (p.v - v) * (x - tPrev) / (p.t - tPrev);
        break;
      }
      return v;
    },
  };
}

// ===========================================================================
// ONE SESSION
// ===========================================================================

function session(mode) {
  installSeed(SEED);                        // trap 1
  let now = 0;
  Date.now = () => (now += 7919);
  const X = H.buildGame({ audio: true, spy: ["dangerInputs", "sfx", "drawWell"] });
  const { C, state } = X;
  const G = X.Game, A = X.AudioSys, M = X.MusicSys, D = X.Director, rec = X._audio;
  const MS = C.FIXED_DT * 1000;
  const SPY = mode === "spy";

  const out = {
    C, hashes: [], steps: 0, exceptions: [], stuck: [], cases: [], levels: new Set(),
    ctxBeforePress: null,
    read: { calls: 0, moved: 0, first: null },
    intensity: { frames: 0, bad: 0, first: null, max: 0, trace: 0 },
    bars: { checked: 0, off: 0, past: 0, badValue: 0, first: null, ramps: 0 },
    layers: {},                             // name -> { entered, left }
    values: { built: 0, bare: 0, first: null },
    duck: { d9: 0, other: 0, wrongTarget: 0, wrongLevel: 0, first: null, optionsFromPause: 0, optionsFromTitle: 0 },
    dips: { byEvent: {}, missing: 0, stray: 0, first: null },
    rim: { offPlayDrawn: 0, offPlayLit: 0, playLit: 0, first: null },
    nodes: { max: 0, steps: 0, over: 0, byTrack: {} },
  };
  const fail = (grp, msg) => { if (!grp.first) grp.first = msg; };

  // ---- ⛔ the read: the whole state before and after every call -------------
  const hashState = makeHasher(X, () => null);
  let hBefore = 0;
  if (SPY) {
    X.dangerInputs.before = () => { hBefore = hashState(); };
    X.dangerInputs.after = () => {
      out.read.calls++;
      if (hashState() !== hBefore) { out.read.moved++; fail(out.read, `level ${state.level}, screen ${state.screen}`); }
    };
  } else {
    X.dangerInputs.after = (st, o) => { o.count = 1; o.proximity = 1; o.peril = 1; o.heat = 1; o.combo = 1; };  // trap 3
  }

  // ---- the setters' arguments ----------------------------------------------
  let frameArgs = [];
  for (const name of ["setIntensity", "setSweep"]) {
    const f0 = M[name];
    M[name] = function (f) { frameArgs.push(f); return f0.apply(this, arguments); };
  }

  // ---- the gates: every node, its track's grid, and its own timeline --------
  const gates = new Map();                  // node -> { name, t0, barDur, tl, seen }
  let lastGates = null;
  { const s0 = M.setState;
    M.setState = function () {
      const r = s0.apply(this, arguments);
      if (M.layerGates && M.layerGates !== lastGates) {
        lastGates = M.layerGates;
        const tr = M.track;
        M.layerGates.forEach((lg, i) => gates.set(lg.node, {
          name: `${M.state}.${tr.layers[i].name}`, tier: lg.tier, t0: M.nextStepTime,
          barDur: tr.bar * tr.stepDur, tl: timeline(lg.node.gain.value), seen: lg.node.gain.value,
        }));
      }
      return r;
    };
  }

  // ---- nodes per step -------------------------------------------------------
  { const sched0 = M.scheduleStep;
    M.scheduleStep = function (step, t) {
      const n0 = rec.nodes.length, r = sched0.call(this, step, t), n = rec.nodes.length - n0;
      out.nodes.steps++;
      out.nodes.byTrack[this.state] = (out.nodes.byTrack[this.state] || 0) + 1;
      if (n > out.nodes.max) out.nodes.max = n;
      if (n > C.MUSIC_STEP_NODE_MAX) out.nodes.over++;
      return r;
    };
  }

  // ---- the dips, at the seat --------------------------------------------------
  let sfxMark = 0;
  X.sfx.before = () => { sfxMark = rec.automation.length; };
  X.sfx.after = name => {
    if (!A.ctx) return;
    const t = A.ctx.currentTime;
    const ramps = rec.automation.slice(sfxMark).filter(a => a.node === M.dipNode && a.fn === "linearRampToValueAtTime");
    const listed = D9_DIPS.indexOf(name) >= 0;
    if (listed) {
      const ok = ramps.some(a => a.v === C.MUSIC_DIP_GAIN && Math.abs(a.t - (t + C.MUSIC_DUCK_RAMP)) < TOL);
      if (ok) out.dips.byEvent[name] = (out.dips.byEvent[name] || 0) + 1;
      else { out.dips.missing++; fail(out.dips, `${name} did not dip`); }
    } else if (ramps.length) { out.dips.stray++; fail(out.dips, `${name} dipped`); }
  };

  // ---- the rim ----------------------------------------------------------------
  let rimDrawn = false, rimArg = 0;
  X.drawWell.before = function () { rimDrawn = true; rimArg = arguments[5]; };

  const hash = makeHasher(X, () => [G.hitStopLeft, G.menu.cursor, G.stats.ticks]);
  let viaPause = false;                     // where the driver opened OPTIONS from
  let duckTl = null, duckNode = null, lastD9 = null, d9Since = 0;

  // ---- the frame loop: every frame is read here, then the logs cleared (trap 4)
  let clock = 0;
  function frameAt(ms) {
    clock = ms;
    if (A.ctx) A.ctx.currentTime = clock / 1000;
    frameArgs = []; rimDrawn = false; rimArg = 0;
    G.frame(clock);
    out.hashes.push(hash());
    const t = A.ctx ? A.ctx.currentTime : 0;
    const screen = state.screen;

    // intensity in [0, 1]: the director's level, and every value the setters took
    out.intensity.frames++;
    for (const v of [D.level, M.intensity, M.sweepLevel].concat(frameArgs)) {
      if (!(typeof v === "number" && v >= 0 && v <= 1)) { out.intensity.bad++; fail(out.intensity, `${v} on ${screen}`); }
    }
    if (D.level > out.intensity.max) out.intensity.max = D.level;
    out.intensity.trace = (Math.imul(out.intensity.trace ^ Math.round(D.level * 1e9), 16777619)) >>> 0;
    if (!SPY) { rec.clear(); rec.nodes.length = 0; return; }

    // the built nodes this frame may take a .value; nothing else may
    const built = new Set(rec.nodes);
    const watched = n => gates.has(n) || n === M.sweep || n === M.limiter || n === M.duck || n === M.dipNode;
    for (const s of rec.valueSets) {
      if (!watched(s.node)) continue;
      if (built.has(s.node)) out.values.built++;
      else { out.values.bare++; fail(out.values, `${s.node.kind}.${s.param} = ${s.v} on ${screen}`); }
    }

    // the duck's timeline
    if (M.duck && M.duck !== duckNode) { duckNode = M.duck; duckTl = timeline(M.duck.gain.value); }
    for (const a of rec.automation) {
      if (a.node === duckNode && a.param === "gain") duckTl.apply(a);
      const g = gates.get(a.node);
      if (!g) continue;
      // ⛔ every gate automation on a bar line of its track, never in the past
      g.tl.apply(a);
      out.bars.checked++;
      const tb = a.fn === "linearRampToValueAtTime" ? a.t - C.LAYER_CROSSFADE : a.t;
      const q = (tb - g.t0) / g.barDur;
      if (Math.abs(q - Math.round(q)) > TOL) { out.bars.off++; fail(out.bars, `${g.name} ${a.fn} at ${a.t} (bar ${q.toFixed(4)})`); }
      if (a.t < t - TOL) { out.bars.past++; fail(out.bars, `${g.name} ${a.fn} at ${a.t} < now ${t}`); }
      if (a.fn !== "cancelScheduledValues" && a.v !== 0 && a.v !== 1) { out.bars.badValue++; fail(out.bars, `${g.name} -> ${a.v}`); }
      if (a.fn === "linearRampToValueAtTime") out.bars.ramps++;
    }

    // `cycle` and `tick`: entered and left, as the gate's own timeline reaches it
    if (M.layerGates) for (const lg of M.layerGates) {
      const g = gates.get(lg.node);
      const lv = g.tl.at(t);
      const L = out.layers[g.name] || (out.layers[g.name] = { tier: g.tier, entered: 0, left: 0 });
      if (lv === 1 && g.seen === 0) { L.entered++; g.seen = 1; }
      if (lv === 0 && g.seen === 1) { L.left++; g.seen = 0; }
    }

    // ⛔ D9: pause, and OPTIONS and its pages opened from pause — and nowhere else
    if (duckTl) {
      const d9 = screen === "pause" || (viaPause && OPTIONS_PAGES.indexOf(screen) >= 0);
      if (d9 !== lastD9) { lastD9 = d9; d9Since = t; }
      if (d9) out.duck.d9++; else out.duck.other++;
      if (OPTIONS_PAGES.indexOf(screen) >= 0) { if (viaPause) out.duck.optionsFromPause++; else out.duck.optionsFromTitle++; }
      const want = d9 ? C.MUSIC_DUCK_GAIN : 1;
      if (duckTl.target() !== want) { out.duck.wrongTarget++; fail(out.duck, `target ${duckTl.target()} on ${screen}`); }
      if (t - d9Since >= C.MUSIC_DUCK_RAMP && Math.abs(duckTl.at(t) - want) > TOL) {
        out.duck.wrongLevel++; fail(out.duck, `level ${duckTl.at(t)} on ${screen}, ${(t - d9Since).toFixed(3)} s in`);
      }
    }

    // the rim: 0 on every frame that is not play
    if (rimDrawn && screen !== "play") {
      out.rim.offPlayDrawn++;
      if (rimArg !== 0) { out.rim.offPlayLit++; fail(out.rim, `${rimArg} on ${screen}`); }
    }
    if (rimDrawn && screen === "play" && rimArg > 0) out.rim.playLit++;

    rec.clear(); rec.nodes.length = 0;      // trap 4
  }
  const halfFrame = () => frameAt(clock + MS / 2);
  function liveStep() {
    const want = G.stats.ticks + 1;
    for (let n = 0; G.stats.ticks < want && n < 8; n++) halfFrame();
  }
  function hold(steps) { for (let n = 0; n < steps; n++) liveStep(); }

  const doc = fakeTarget(), win = fakeTarget(), el = fakeTarget();
  G.input.attach({ document: doc, window: win, element: el });
  function press(k) { doc.fire("keydown", { key: k }); liveStep(); doc.fire("keyup", { key: k }); liveStep(); }
  function tapRight() { doc.fire("keydown", { key: "ArrowRight" }); liveStep(); liveStep(); doc.fire("keyup", { key: "ArrowRight" }); liveStep(); }
  function releaseAll() { for (const k of [" ", "x", "ArrowLeft", "ArrowRight"]) G.input.keyUp(k); }

  // The pause side: pause, OPTIONS from pause, back, resume — every press a menu press.
  function pauseExcursion(k) {
    releaseAll();
    press("Escape");
    if (state.screen !== "pause") throw new Error(`case ${k}: Escape did not pause (${state.screen})`);
    hold(120);
    tapRight(); viaPause = true; press(" ");
    if (state.screen !== "options") throw new Error(`case ${k}: no OPTIONS from pause (${state.screen})`);
    hold(120);
    press("Escape");
    hold(60);
    press("Escape");
    if (state.screen !== "play") throw new Error(`case ${k}: did not resume (${state.screen})`);
  }

  function playSegment(k, seg) {
    let i = 0, drivenFor = -1, guard = 0, paused = seg !== 0;
    while (state.screen !== "gameover") {
      if (state.screen !== "play" || i > SEGMENT_CAP || guard++ > SEGMENT_CAP * 4) {
        out.stuck.push(`case ${k} run ${seg}: on "${state.screen}" at step ${i}`);
        throw new Error("the segment did not end in game over");
      }
      if (!paused && i === PAUSE_AT && G.hitStopLeft === 0) {
        pauseExcursion(k);
        paused = true;
        if (i < HOLD_TICKS) G.input.keyDown(" ");
        continue;
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
  }

  frameAt(0);
  X.levelRecord().noteCleared(RECORD);
  liveStep(); liveStep();                   // trap 2: the title's entry step
  out.ctxBeforePress = A.ctx !== null;

  for (let k = 0; k < DEPTHS.length; k++) {
    const depth = DEPTHS[k];
    const r = { depth, started: false, restarted: false, quit: false, titleOptions: true };
    try {
      if (k === 0) {                         // OPTIONS from the title: no duck
        press(" "); press("Escape");        // the gesture, and back
        tapRight(); viaPause = false; press(" ");
        r.titleOptions = state.screen === "options";
        hold(120);
        press("Escape");
      }
      press(" ");                                          // PLAY
      press(" ");                                          // CLASSIC
      const row = X.startDepthOptions().indexOf(depth);
      for (let n = 0; n < row; n++) tapRight();
      press(" ");                                          // LEVEL d
      r.started = row >= 0 && state.screen === "play" && state.level === depth;
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

const spied = session("spy");
const constant = session("constant");

if (MEASURE) {
  const brief = s => Object.assign({}, s, { C: undefined, hashes: s.hashes.length, levels: [...s.levels].sort((a, b) => a - b) });
  console.log(JSON.stringify({ spied: brief(spied), constant: brief(constant) }, null, 1));
}

const first = g => g.first ? ` — first: ${g.first}` : "";

// ---------------------------------------------------------------------------
// the front door
// ---------------------------------------------------------------------------
H.eq(spied.exceptions.length + constant.exceptions.length, 0,
     `⛔ no exception in either session${spied.exceptions[0] || constant.exceptions[0] ? " — " + (spied.exceptions[0] || constant.exceptions[0]) : ""}`);
H.eq(spied.stuck.length, 0, `every run reached game over${spied.stuck[0] ? " — " + spied.stuck[0] : ""}`);
for (const [k, r] of spied.cases.entries()) {
  H.assert(r.started && r.restarted && r.quit && r.titleOptions, `case ${k}: START DEPTH ${r.depth} → play → RESTART → QUIT TO TITLE (${JSON.stringify(r)})`);
}
H.eq(spied.ctxBeforePress, false, "⛔ trap 2: no context two live steps into the title, before the first press");
H.assert(spied.levels.has(1) && spied.levels.has(13) && spied.levels.has(23), "non-vacuity: runs played at levels 1, 13 and 23");

// ---------------------------------------------------------------------------
// ⛔ the danger read writes nothing, and the music cannot steer the run
// ---------------------------------------------------------------------------
H.eq(spied.read.moved, 0, `⛔ dangerInputs leaves the whole state hash unchanged on every call (${spied.read.calls} calls)${first(spied.read)}`);
H.assert(spied.read.calls > 10000, `non-vacuity: dangerInputs was read on the played frames (${spied.read.calls})`);
{
  let firstDiff = -1;
  const n = Math.min(spied.hashes.length, constant.hashes.length);
  for (let i = 0; i < n; i++) if (spied.hashes[i] !== constant.hashes[i]) { firstDiff = i; break; }
  H.eq(spied.hashes.length, constant.hashes.length, "⛔ both sessions ran the same number of frames");
  H.eq(firstDiff, -1, `⛔ a constant danger reading leaves the state hash identical on every frame (${n} frames)`);
  H.assert(new Set(spied.hashes).size > n / 4, "non-vacuity: the hash moves with the board");
}

// ---------------------------------------------------------------------------
// the spied session's music
// ---------------------------------------------------------------------------
H.eq(spied.intensity.bad, 0, `⛔ intensity, the sweep and every setter argument in [0, 1] on every frame (${spied.intensity.frames})${first(spied.intensity)}`);
H.assert(spied.intensity.max >= spied.C.LAYER_THRESHOLD[3], `non-vacuity: intensity reached tier 3 (max ${spied.intensity.max.toFixed(4)})`);

H.eq(spied.bars.off, 0, `⛔ every gate automation lands on a bar line of its track (${spied.bars.checked} calls)${first(spied.bars)}`);
H.eq(spied.bars.past, 0, "⛔ and none is scheduled in the past");
H.eq(spied.bars.badValue, 0, "and a gate only ever targets 0 or 1");
H.assert(spied.bars.ramps >= 8, `non-vacuity: gates moved (${spied.bars.ramps} ramps)`);

for (const name of ["pulse.cycle", "pulse.tick"]) {
  const L = spied.layers[name] || { entered: 0, left: 0 };
  H.assert(L.entered >= 1 && L.left >= 1, `⛔ ${name} entered (${L.entered}) and left (${L.left}) at least once`);
}
for (const [name, L] of Object.entries(spied.layers)) {
  if (L.tier === 1) H.eq(L.entered + L.left, 0, `${name}: an untiered gate never moves`);
}

H.eq(spied.values.bare, 0, `⛔ no bare .value on a gate, the sweep, limiter, duck or dip after the frame that built it${first(spied.values)}`);
H.assert(spied.values.built > 0, `non-vacuity: construction-time sets were seen and allowed (${spied.values.built})`);

H.eq(spied.duck.wrongTarget, 0, `⛔ the duck targets C.MUSIC_DUCK_GAIN on exactly D9's frames, and 1 on every other${first(spied.duck)}`);
H.eq(spied.duck.wrongLevel, 0, "⛔ and sits there once its ramp has run");
H.assert(spied.duck.d9 > 0 && spied.duck.optionsFromPause > 0 && spied.duck.optionsFromTitle > 0,
         `non-vacuity: pause, OPTIONS from pause and OPTIONS from the title were all played (${JSON.stringify(spied.duck)})`);

for (const ev of D9_DIPS) {
  H.assert((spied.dips.byEvent[ev] || 0) > 0, `⛔ ${ev} dipped the music (${spied.dips.byEvent[ev] || 0})`);
}
H.eq(spied.dips.missing, 0, `⛔ every listed event dipped${first(spied.dips)}`);
H.eq(spied.dips.stray, 0, "⛔ and no other event did");

H.eq(spied.rim.offPlayLit, 0, `⛔ rimGlow is 0 on every drawn frame that is not play (${spied.rim.offPlayDrawn})${first(spied.rim)}`);
H.assert(spied.rim.offPlayDrawn > 0 && spied.rim.playLit > 0,
         `non-vacuity: the well was drawn off play (${spied.rim.offPlayDrawn}) and the rim lit in play (${spied.rim.playLit})`);

H.eq(spied.nodes.over, 0, `⛔ nodes per scheduled step <= C.MUSIC_STEP_NODE_MAX (worst ${spied.nodes.max} of ${spied.nodes.steps})`);
H.assert((spied.nodes.byTrack.pulse || 0) > 1000 && (spied.nodes.byTrack.title || 0) > 0,
         `non-vacuity: both tracks were scheduled (${JSON.stringify(spied.nodes.byTrack)})`);

// ⛔ non-vacuity of the constant session: its music really differed
H.assert(constant.intensity.trace !== spied.intensity.trace || constant.intensity.max !== spied.intensity.max,
         "non-vacuity: the constant reading did not reproduce the spied session's intensity");

H.report("test-cs010-p5.js");
