// test-cs016-p2.js — CS016 P2: attract mode (GDD 12; plan §4, N6–N10).
// The title's idle clock (20 s at rest enters, 19 s and any input do not, title
// only, no clock read); every ender — a device reading, each named action, the
// demo's game over, its length — ends it on that step and does nothing else,
// and the ending press confirms no row; the demo writes no storage byte, opens
// no run, fires no seat, prompt or unlock, and leaves `lastRunMode`; its hash
// is the same on two loads; and a played session that never idles hashes
// identically with attractDrive stubbed.
//
// ⛔ TRAPS.
//  1. Seed, Date.now and build are re-made per build, in that order; Date.now
//     is the frame clock plus a base, so two loads read the same wall.
//  2. The game-over demo is a MUTATED length plus a driver made passive after
//     its first clear (a spy's `.after`), so it clears a well and then dies.
//  3. A menu press is an EDGE: release every held key before the next.
//  4. Meta's seats are object methods, spied by wrapping the property.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260924;
const BASE = 1.7e12;
const J = JSON.stringify;
const LEN = "ATTRACT_LENGTH:       45,";

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

// Wraps an object's method with a call counter (trap 4).
function wrap(obj, name, before) {
  const f = obj[name];
  const w = function () { w.calls++; if (before) before.apply(this, arguments); return f.apply(this, arguments); };
  w.calls = 0;
  obj[name] = w;
  return w;
}

// ---------------------------------------------------------------------------
// ONE BUILD AT THE BOOT TITLE, AND A FRONT-DOOR DRIVER FOR IT
// ---------------------------------------------------------------------------
function open(o = {}) {
  installSeed(SEED);                                           // trap 1
  const S = { clock: 0 };
  Date.now = () => BASE + S.clock;
  const store = o.store || new Map();
  const X = H.buildGame({ store, mutate: o.mutate || [], stub: o.stub || [],
                          spy: ["sfx", "drawMenu", "drawText", "drawHud", "drawPrompt", "promptScan",
                                "spawnEnemy"].concat(o.spy || []) });
  const { C, state } = X;
  const G = X.Game, MS = C.FIXED_DT * 1000;
  Object.assign(S, { X, C, G, state, store, menus: [], screens: [], texts: [], sounds: [] });
  X.drawMenu.before = (ctx, view) => {
    S.menus.push({ title: view.title, items: view.items.map(r => ({ label: r.label, detail: r.detail })) });
  };
  X.drawText.before = (ctx, text) => S.texts.push(String(text));
  X.sfx.before = name => S.sounds.push(name);
  S.M = {
    runStarted: wrap(X.Meta, "runStarted"), runEnded: wrap(X.Meta, "runEnded"),
    clearEdge: wrap(X.Meta, "clearEdge"), benchUsed: wrap(X.Meta, "benchUsed"),
    saveTelemetry: wrap(X.Meta, "saveTelemetry"), savePrompts: wrap(X.Meta, "savePrompts"),
    promptSeen: wrap(X.Meta, "promptSeen"),
    noteClassic: wrap(X.levelRecord("classic"), "noteCleared"),
    noteOverdrive: wrap(X.levelRecord("overdrive"), "noteCleared"),
    sample: wrap(X.Telemetry, "sample"), toggle: wrap(X.Telemetry, "toggle"),
  };
  S.counts = () => {
    const out = {};
    for (const k of Object.keys(S.M)) out[k] = S.M[k].calls;
    out.unlock = S.sounds.filter(n => n === "unlock").length;
    out.promptScan = X.promptScan.calls;
    return out;
  };
  S.bytes = () => J([...store.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)));
  S.halfFrame = () => { S.clock += MS / 2; G.frame(S.clock); S.screens.push(state.screen); };
  S.liveStep = () => {
    const want = G.stats.ticks + 1;
    for (let n = 0; G.stats.ticks < want && n < 8; n++) S.halfFrame();
  };
  S.steps = n => { for (let i = 0; i < n; i++) S.liveStep(); };
  S.press = k => { G.input.keyDown(k); S.liveStep(); G.input.keyUp(k); S.liveStep(); };
  S.right = n => { for (let i = 0; i < n; i++) { G.input.keyDown("ArrowRight"); S.liveStep(); S.liveStep(); G.input.keyUp("ArrowRight"); S.liveStep(); } };
  S.releaseAll = () => { for (const k of [" ", "x", "arrowup", "ArrowLeft", "ArrowRight"]) G.input.keyUp(k); };
  // Idles on the title until the demo starts; returns the steps it took, or -1.
  S.idleToDemo = () => {
    for (let n = 1; n <= 1400; n++) { S.liveStep(); if (state.screen === "play") return n; }
    return -1;
  };
  S.halfFrame();
  S.liveStep(); S.liveStep();                                  // the title's entry step
  return S;
}

// A hunter for the played sessions: fire held, steer at the deepest enemy.
function hunt(S, n) {
  const { G, state, X } = S;
  G.input.keyDown(" ");
  for (let i = 0; i < n && state.screen === "play"; i++) {
    G.input.keyUp("ArrowLeft"); G.input.keyUp("ArrowRight");
    const sk = state.skimmer;
    let best = null;
    for (const e of state.enemies) if (!e.dead && !e.anchored && (best === null || e.depth > best.depth)) best = e;
    if (sk && !sk.dead && best) {
      const d = X.laneDelta(X.WELLS[state.wellIndex], sk.lane, best.lane);
      if (d > 0.3) G.input.keyDown("ArrowRight"); else if (d < -0.3) G.input.keyDown("ArrowLeft");
    }
    if (i % 400 === 200) G.input.keyDown("x");
    if (i % 400 === 204) G.input.keyUp("x");
    S.liveStep();
  }
  S.releaseAll();
  for (let n2 = 0; S.G.hitStopLeft > 0 && n2 < 1000; n2++) S.halfFrame();
  S.liveStep();
}
// Back to the title from play (pause → QUIT TO TITLE) or game over (QUIT TO TITLE).
function leave(S) {
  if (S.state.screen === "play") { S.press("Escape"); S.right(2); S.press(" "); }
  else if (S.state.screen === "gameover") { S.liveStep(); S.right(1); S.press(" "); }
  S.liveStep();
}
// PLAY → the mode → START DEPTH 1.
function frontDoor(S, mode) {
  S.press(" ");
  if (mode === "classic") S.right(1);
  S.press(" ");
  S.press(" ");
}

// ===========================================================================
// 1. THE IDLE CLOCK (N10)
// ===========================================================================
{
  const S = open();
  const { C, state, G } = S;
  H.eq(C.ATTRACT_IDLE, 20, "C.ATTRACT_IDLE is 20 s");
  H.eq(C.ATTRACT_MODE, "overdrive", "C.ATTRACT_MODE is Overdrive (N7)");
  H.assert(C.ATTRACT_LINE.length <= 36 && C.ATTRACT_LINE.length > 0, `C.ATTRACT_LINE fits the band (${C.ATTRACT_LINE.length} ≤ 36)`);
  H.eq(state.screen, "title", "fixture: boot is the title");

  // ⛔ No wall clock: Date.now frozen for the whole idle, and the demo comes on the frames anyway.
  const dn = Date.now;
  let reads = 0;
  Date.now = () => { reads++; return BASE; };
  S.steps(Math.round(19 / C.FIXED_DT));
  H.eq(state.screen, "title", "⛔ nineteen seconds at rest on the title do not enter the demo");
  const more = S.idleToDemo();
  Date.now = dn;
  H.assert(more >= 1 && more <= Math.round(1 / C.FIXED_DT) + 1,
           `⛔ twenty seconds at rest enter it (entered ${more} steps after 19 s)`);
  H.eq(reads, 0, "⛔ the idle clock reads no wall clock (Date.now untouched across 20 s of title)");
  H.assert(state.screen === "play" && state.mode === C.ATTRACT_MODE && state.level === C.ATTRACT_DEPTH &&
           state.startDepth === C.ATTRACT_DEPTH && state.seed === (C.ATTRACT_SEED >>> 0),
           `the demo is startGame(ATTRACT_SEED, { ATTRACT_MODE, ATTRACT_DEPTH }) (${J({ mode: state.mode, level: state.level, seed: state.seed })})`);

  // Anything else zeroes it: a named action, a mouse move, a held key.
  for (const [label, act] of [["Escape (a named action)", () => S.press("Escape")],
                              ["a mouse move", () => { G.input.mouseMove(0.4); S.liveStep(); }],
                              ["a held Purge", () => S.press("x")]]) {
    G.quitToTitle(); S.liveStep(); S.liveStep();
    S.steps(Math.round(15 / C.FIXED_DT));
    act();
    S.steps(Math.round(15 / C.FIXED_DT));
    H.eq(state.screen, "title", `⛔ ${label} at 15 s zeroes the idle clock (no demo 15 s later)`);
    H.assert(S.idleToDemo() > 0, `${label}: the clock runs again from zero and the demo comes`);
  }

  // ⛔ Title only: twenty-five seconds at rest on OPTIONS start nothing.
  G.quitToTitle(); S.liveStep(); S.liveStep();
  S.right(1); S.press(" ");
  H.eq(state.screen, "options", "fixture: OPTIONS from the title");
  S.steps(Math.round(25 / C.FIXED_DT));
  H.eq(state.screen, "options", "⛔ title only: 25 s at rest on OPTIONS start no demo");
}

// ===========================================================================
// 2. EVERY ENDER ENDS IT ON THAT STEP AND DOES NOTHING ELSE (N9)
// ===========================================================================
{
  const S = open();
  const { C, state, G, X } = S;
  const nav = X._env.win.navigator;
  const pad = { axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
  nav.getGamepads = () => [pad];
  const key = k => ({ down: () => G.input.keyDown(k), up: () => G.input.keyUp(k) });
  const topY = C.TOUCH_BUTTON_R * 1.5;
  const SOURCES = [
    ["a mouse move (rotate)", { down: () => G.input.mouseMove(3), up: () => {} }],
    ["ArrowLeft (rotate)", key("ArrowLeft")],
    ["a held Fire", key(" ")],
    ["a held Purge", key("x")],
    ["a held Jump", key("arrowup")],
    ["Escape", key("Escape")],
    ["p", key("p")],
    ["the digit 1", key("1")],
    ["the digit 0", key("0")],
    ["w", key("w")],
    ["t", key("t")],
    ["e", key("e")],
    ["the page going hidden", { down: () => G.input.pageHidden(), up: () => {} }],
    ["gamepad Start", { down: () => { pad.buttons[C.GAMEPAD_PAUSE_BUTTON].pressed = true; },
                        up: () => { pad.buttons[C.GAMEPAD_PAUSE_BUTTON].pressed = false; } }],
    ["the top touch target", { down: () => G.input.touchStart(9, C.WORLD_W / 2, topY), up: () => G.input.touchEnd(9) }],
  ];
  const logs = [];
  const log0 = console.log;
  console.log = (...a) => logs.push(a.join(" "));                // `e` would export to the console
  for (const [label, src] of SOURCES) {
    G.quitToTitle(); S.liveStep(); S.liveStep();
    const n = S.idleToDemo();
    S.steps(90);
    const live = n > 0 && state.screen === "play" && state.level >= C.ATTRACT_DEPTH;
    H.assert(live, `${label}: fixture: a demo is running (${n}, ${state.screen})`);
    const bytes = S.bytes(), c0 = S.counts(), spawns = X.spawnEnemy.calls, t0 = S.screens.length;
    const tel = X.Telemetry.enabled(), logsAt = logs.length;
    src.down(); S.liveStep();
    const c1 = S.counts();
    H.eq(state.screen, "title", `⛔ ${label} ends the demo on that step`);
    H.eq(X.spawnEnemy.calls - spawns, 0, `${label}: no spawn on the ending step (no bench, no spawner)`);
    H.eq(c1.benchUsed - c0.benchUsed, 0, `${label}: no bench mark`);
    H.eq(c1.toggle - c0.toggle, 0, `${label}: no telemetry toggle`);
    H.eq(X.Telemetry.enabled(), tel, `${label}: capture unchanged`);
    H.eq(c1.saveTelemetry - c0.saveTelemetry + c1.savePrompts - c0.savePrompts, 0, `${label}: no saveTelemetry() or savePrompts()`);
    H.eq(logs.length - logsAt, 0, `${label}: no export`);
    for (let i = 0; i < 12; i++) S.liveStep();                   // held across the title's entry step
    src.up();
    S.steps(6);
    H.eq(state.screen, "title", `⛔ ${label}: the ending press confirms no row`);
    H.assert(!S.screens.slice(t0).includes("pause"), `⛔ ${label}: no pause at any frame`);
    H.eq(S.bytes(), bytes, `${label}: the store's bytes do not move`);
    H.eq(state.level, 1, `${label}: the title shows newState(), not the demo's board`);
  }
  console.log = log0;
  // The press after the ending is a real press: PLAY → MODE.
  S.press(" ");
  H.eq(state.screen, "mode", "after the ending, the next Fire confirms PLAY as ever");
}

// ===========================================================================
// 3. OUT OF THE GATE AND OUT OF STORAGE: A DEMO THAT CLEARS A WELL AND DIES
// ===========================================================================
// A real Classic run, capture ON, then a demo that clears a well and dies.
function dies(mutate = []) {
  const S = open({ mutate: [[LEN, "ATTRACT_LENGTH: 600,"]].concat(mutate), spy: ["attractDrive"] });   // trap 2
  const { state, X } = S;
  const r = { S };
  // A real Classic run first, so the store has rows and the last run STARTED is Classic.
  frontDoor(S, "classic");
  r.classic = state.screen === "play" && state.mode === "classic";
  hunt(S, 900);
  leave(S);
  r.titled = state.screen === "title";
  const log0 = console.log;
  console.log = () => {};
  S.press("t");                                                // capture ON: the ring would take rows
  console.log = log0;
  r.capture = X.Telemetry.enabled();
  const rowsBefore = X.Telemetry.count, seenBefore = X.Meta.promptsSeen().size;
  const bytes = S.bytes();
  r.keys = [...S.store.keys()].map(k => k.split(".").pop());
  X.attractDrive.after = (st, well, out) => {
    if (st.tally.wellsCleared >= 1) { out.rotate = 0; out.fire = false; out.purge = false; out.jump = false; }
  };
  const c0 = S.counts(), m0 = S.menus.length, snd0 = S.sounds.length;
  r.started = S.idleToDemo() > 0;
  let steps = 0, ineligible = 0, queued = 0, clears = 0, deaths = 0, sawGameOver = false;
  while (state.screen === "play" && steps < 60 * 400) {
    if (!X.Meta.eligible()) ineligible++;
    if (X.promptQueue.rows.length > 0) queued++;
    clears = Math.max(clears, state.tally.wellsCleared);
    deaths = Math.max(deaths, state.tally.deaths);
    S.halfFrame();
    if (state.screen === "gameover") sawGameOver = true;
    steps++;
  }
  const c1 = S.counts();
  Object.assign(r, { steps, ineligible, queued, clears, deaths, sawGameOver, screen: state.screen,
                     gameOver: S.sounds.slice(snd0).includes("gameOver"),
                     menuGameOver: S.menus.slice(m0).some(m => m.title === "GAME OVER"),
                     seenSame: X.Meta.promptsSeen().size === seenBefore,
                     rowsSame: X.Telemetry.count === rowsBefore, bytesSame: S.bytes() === bytes, delta: {} });
  for (const k of Object.keys(c1)) r.delta[k] = c1[k] - c0[k];
  return r;
}
{
  const r = dies();
  const { S } = r, { state } = S;
  H.assert(r.classic && r.titled && r.capture && r.started, `fixture: a real run, capture on, a demo (${J({ c: r.classic, t: r.titled, cap: r.capture, s: r.started })})`);
  H.assert(r.keys.includes("scores") && r.keys.includes("onboarding"), `fixture: the store holds the real run's rows (${r.keys.join(", ")})`);
  H.assert(r.clears >= 1, `fixture: the demo cleared a well (${r.clears})`);
  H.assert(r.deaths >= 1, `fixture: the demo lost craft (${r.deaths})`);
  H.assert(r.gameOver, "fixture: the demo reached its game over");
  H.eq(r.screen, "title", "⛔ the demo's game over returns to the title");
  H.assert(!r.sawGameOver, "⛔ at once: no frame ends on the game-over screen");
  H.assert(!r.menuGameOver, "⛔ the game-over menu is never drawn");
  H.eq(r.ineligible, r.steps, `⛔ Meta.eligible() is false on every demo frame (${r.steps})`);
  H.eq(r.queued, 0, "⛔ the prompt queue stays empty");
  H.assert(r.seenSame, "⛔ no prompt is marked seen");
  for (const k of ["runStarted", "runEnded", "clearEdge", "noteClassic", "noteOverdrive", "sample",
                   "unlock", "promptScan", "promptSeen", "saveTelemetry", "savePrompts"]) {
    H.eq(r.delta[k], 0, `⛔ ${k} is not called across the demo`);
  }
  H.assert(r.rowsSame, "⛔ the telemetry ring takes no demo row");
  H.assert(r.bytesSame, "⛔ THE STORE'S BYTES ARE IDENTICAL before and after a demo that clears a well and dies");
  // ⛔ lastRunMode: SCORES opens on the last run STARTED, which is still the Classic one.
  S.liveStep(); S.liveStep();                                  // the title's entry step
  S.right(2); S.press(" ");
  S.liveStep();
  const shown = S.menus[S.menus.length - 1];
  H.eq(state.screen, "scores", "fixture: SCORES from the title");
  H.eq(shown && shown.items[0].detail, "CLASSIC", "⛔ the demo leaves lastRunMode: SCORES opens on CLASSIC");
}

// ===========================================================================
// 4. THE DEMO ITSELF: SAME ON TWO LOADS, WHAT IT SHOWS, AND ITS LENGTH
// ===========================================================================
function demoRun() {
  const S = open();
  const { C, state, G, X } = S;
  const hash = makeHasher(X, () => [G.hitStopLeft, G.menu.cursor]);
  const r = { hashes: [], lastT: 0, deaths: 0, clears: 0, tokens: 0, rings: 0, kinds: new Set(),
              line: 0, hud: 0, frames: 0, prompts: 0, ineligible: 0 };
  const n = S.idleToDemo();
  r.started = n > 0;
  const c0 = S.counts(), p0 = X.drawPrompt.calls;
  while (state.screen === "play" && r.frames < 60 * 120) {
    r.lastT = state.time;
    r.deaths = state.tally.deaths;
    r.clears = state.tally.wellsCleared;
    if (state.tokens.length > 0) r.tokens++;
    if (state.dive.active) r.rings = Math.max(r.rings, state.dive.rings.filter(x => x.taken === true).length);
    for (const e of state.enemies) r.kinds.add(e.constructor.name);
    if (!X.Meta.eligible()) r.ineligible++;
    const t0 = S.texts.length, h0 = X.drawHud.calls;
    S.halfFrame();
    r.frames++;
    if (state.screen === "play") {
      if (S.texts.slice(t0).includes(C.ATTRACT_LINE)) r.line++;
      if (X.drawHud.calls > h0) r.hud++;
      r.hashes.push(hash());
    }
  }
  r.prompts = X.drawPrompt.calls - p0;
  r.counts = S.counts();
  r.c0 = c0;
  r.seen = X.Meta.promptsSeen().size;
  r.screen = state.screen;
  return r;
}
{
  const a = demoRun(), b = demoRun();
  const C = open().C;
  H.assert(a.started && b.started, "fixture: both loads entered the demo");
  H.eq(a.screen, "title", "⛔ ATTRACT_LENGTH returns the demo to the title");
  H.eq(a.deaths, 0, "fixture: the shipped demo dies nowhere, so its length is what ended it");
  H.assert(a.lastT >= C.ATTRACT_LENGTH - C.FIXED_DT && a.lastT < C.ATTRACT_LENGTH + C.FIXED_DT,
           `⛔ it ends at ATTRACT_LENGTH of simulation time (last demo step at ${a.lastT.toFixed(4)} s)`);
  H.assert(a.hashes.length > 2000, `fixture: a whole demo was hashed (${a.hashes.length} frames)`);
  let first = -1;
  for (let i = 0; i < Math.max(a.hashes.length, b.hashes.length); i++) if (a.hashes[i] !== b.hashes[i]) { first = i; break; }
  H.eq(first, -1, `⛔ the demo's hash is identical on two loads, every frame (${a.hashes.length} vs ${b.hashes.length})`);
  H.assert(a.clears >= 1 && a.tokens > 0 && a.rings > 0 && a.kinds.size >= 4,
           `the demo shows the game: ${a.clears} clears, a token, rings taken, ${[...a.kinds].join(", ")}`);
  H.eq(a.ineligible, a.frames, "⛔ Meta.eligible() is false on every demo frame");
  H.eq(a.line, a.hashes.length, "⛔ C.ATTRACT_LINE is drawn on every demo frame");
  H.eq(a.hud, a.hashes.length, "the HUD draws on every demo frame (a run is on screen)");
  H.eq(a.prompts, 0, "⛔ drawPrompt() is not called in the demo — the band carries the demo's line");
  H.eq(a.counts.promptScan - a.c0.promptScan, 0, "⛔ the prompt scan never runs in the demo");
  H.eq(a.seen, 0, "⛔ a fresh profile's demo marks no prompt seen (the first line would fire on a real run)");
  H.eq(a.counts.runStarted - a.c0.runStarted, 0, "⛔ the demo opens no run");
  H.eq(a.counts.sample - a.c0.sample, 0, "⛔ Telemetry.sample() is not called in the demo");
}

// ===========================================================================
// 5. ⛔ A PLAYED SESSION THAT NEVER IDLES, WITH attractDrive STUBBED
// ===========================================================================
function played(o) {
  const S = open(o);
  const hash = makeHasher(S.X, () => [S.G.hitStopLeft, S.G.menu.cursor, S.G.stats.ticks]);
  const out = [];
  const half = S.halfFrame;
  S.halfFrame = () => { half(); out.push(hash()); };
  S.steps(Math.round(15 / S.C.FIXED_DT));                        // idles, but under ATTRACT_IDLE
  frontDoor(S, "overdrive");
  const od = S.state.screen === "play" && S.state.mode === "overdrive";
  hunt(S, 1500);
  S.press("p"); S.steps(20); S.press("p");                       // a pause and a resume
  hunt(S, 1500);
  leave(S);
  frontDoor(S, "classic");
  const cl = S.state.screen === "play" && S.state.mode === "classic";
  hunt(S, 2500);
  leave(S);
  S.steps(Math.round(10 / S.C.FIXED_DT));
  return { hashes: out, od, cl, screen: S.state.screen, calls: S.X.attractDrive.calls };
}
{
  const work = played({ spy: ["attractDrive"] });
  const stubbed = played({ stub: ["attractDrive"] });
  H.assert(work.od && work.cl && work.screen === "title", `fixture: both runs started and the session ended on the title (${work.screen})`);
  H.eq(work.calls, 0, "fixture: the never-idle session never reaches the driver");
  let first = -1;
  for (let i = 0; i < Math.max(work.hashes.length, stubbed.hashes.length); i++) {
    if (work.hashes[i] !== stubbed.hashes[i]) { first = i; break; }
  }
  H.eq(first, -1, `⛔ a played session that never idles hashes identically with attractDrive stubbed (${work.hashes.length} frames)`);
}

// ===========================================================================
// 6. MUTATIONS — each string asserted in the build exactly once first
// ===========================================================================
{
  const src = H.extractScript(require("fs").readFileSync(require("path").join(__dirname, "..", "dist", "vector-vortex.html"), "utf8"));
  const once = str => src.split(str).length - 1;
  const M_START = ["  if (!demo) Meta.runStarted();", "  Meta.runStarted();"];
  const M_EDGE = ["      if (!attract) {\n        levelRecord().noteCleared(state.level);", "      if (true) {\n        levelRecord().noteCleared(state.level);"];
  const M_SAMPLE = ["    if (!attract) Telemetry.sample(state);", "    Telemetry.sample(state);"];
  const M_HELD = ["    state.input = held;\n", "\n"];
  const M_SCAN = ["    if (attract) return;\n    const id = promptScan(", "    const id = promptScan("];
  for (const [name, m] of [["start seat", M_START], ["clear edge", M_EDGE], ["telemetry sample", M_SAMPLE],
                           ["kept struct", M_HELD], ["prompt scan", M_SCAN]]) {
    H.eq(once(m[0]), 1, `mutation string (${name}) is in the build exactly once`);
  }
  if (once(M_START[0]) === 1) {
    const r = dies([M_START]);
    H.assert(!r.bytesSame && r.ineligible < r.steps, `⛔ mutant: the demo with a start seat is eligible and writes the store (red: ${r.ineligible}/${r.steps} ineligible)`);
  }
  if (once(M_EDGE[0]) === 1) {
    const r = dies([M_EDGE]);
    H.assert(!r.bytesSame && r.delta.noteOverdrive > 0, `⛔ mutant: the clear edge unskipped writes progress (red: ${r.delta.noteOverdrive} noteCleared)`);
  }
  if (once(M_SAMPLE[0]) === 1) {
    const r = dies([M_SAMPLE]);
    H.assert(!r.rowsSame, "⛔ mutant: the telemetry sample unskipped fills the ring (red)");
  }
  if (once(M_SCAN[0]) === 1) {
    const r = dies([M_SCAN]);
    H.assert(!r.seenSame || r.queued > 0, "⛔ mutant: the prompt scan unskipped fires a prompt in the demo (red)");
  }
  if (once(M_HELD[0]) === 1) {
    const S = open({ mutate: [M_HELD] });
    const n = S.idleToDemo();
    S.steps(90);
    S.G.input.keyDown(" "); S.steps(12); S.G.input.keyUp(" "); S.steps(6);
    H.assert(n > 0 && S.state.screen === "mode", `⛔ mutant: without the kept struct the ending Fire confirms PLAY (red: ${S.state.screen})`);
  }
}

H.report();
