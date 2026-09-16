// scratchpad/_harness.js — the one sandbox. ⛔ Every test uses this; never
// hand-roll a sandbox and never inline a copy of the logic under test.
//
//   const H = require("./_harness.js");
//   const { installSeed } = require("./_seeded-random.js");
//   installSeed(1234);                      // ⛔ BEFORE buildGame()
//   const X = H.buildGame();                // the game's globals
//   H.assert(X.C.SHOT_MAX === 8, "shot cap");
//   H.report();                             // exits nonzero on any failure
//
// ⛔ IT LOADS dist/vector-vortex.html, NOT src/. The concatenated single-file
// build is the behaviour oracle (GDD 16.2) — testing src/ directly would let
// a build-order bug ship green. buildGame() rebuilds first if dist/ is stale.
//
// ⛔ The RAW script is evaluated. Do not add a comment-stripping regex to the
// build path: a line comment containing "/*" plus a block-comment regex run
// first will silently delete live code and still parse. Comment stripping is a
// text-analysis job and belongs in a character scanner, not here.

"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist", "vector-vortex.html");
const SRC = path.join(ROOT, "src");

let passed = 0, failed = 0, skipped = 0;
const failures = [];
const SKIP_TAG = "SKIPPED (no git history)";

function distIsStale() {
  if (!fs.existsSync(DIST)) return true;
  const built = fs.statSync(DIST).mtimeMs;
  return fs.readdirSync(SRC).some(f => fs.statSync(path.join(SRC, f)).mtimeMs > built);
}

function extractScript(html) {
  // The LAST <script> without a type attribute is the game. The module bridge
  // tag carries type="module" and is deliberately not the game (GDD 16.2).
  const re = /<script(?![^>]*\btype=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m, last = null;
  while ((m = re.exec(html)) !== null) last = m[1];
  if (last === null) throw new Error("no classic <script> block found in dist/");
  return last;
}

function stubEnv() {
  const store = new Map();
  const noop = () => {};
  const ctx2d = new Proxy({}, {
    get: (t, k) => (k in t ? t[k] : (t[k] = k === "measureText" ? (() => ({ width: 0 })) : noop)),
    set: (t, k, v) => ((t[k] = v), true),
  });
  const canvas = {
    width: 1280, height: 720,
    getContext: () => ctx2d,
    addEventListener: noop, removeEventListener: noop,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
    style: {},
  };
  const doc = {
    getElementById: () => canvas,
    createElement: () => canvas,
    addEventListener: noop, removeEventListener: noop,
    documentElement: { style: {} },
    body: { style: {}, appendChild: noop },
  };
  const win = {
    innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
    addEventListener: noop, removeEventListener: noop,
    matchMedia: () => ({ matches: false, addEventListener: noop }),
    requestAnimationFrame: noop, cancelAnimationFrame: noop,
    performance: { now: () => 0 },
    localStorage: {
      getItem: k => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: k => store.delete(k),
      clear: () => store.clear(),
      get length() { return store.size; },
      key: i => [...store.keys()][i] ?? null,
    },
    navigator: { userAgent: "node", maxTouchPoints: 0 },
    AudioContext: undefined,   // headless: every audio entry point must guard
    open: noop,
  };
  win.window = win;
  return { win, doc, canvas, store };
}

// A RECORDING FAKE AUDIO CONTEXT (CS009 P1), installed only by
// buildGame({ audio: true }); the default stays `undefined`, so every closed
// test keeps running the guarded no-op path. It makes no sound. It counts every
// created node by kind in `created` (buffers are not nodes: `buffers`), and
// records connect() in `connections`, every param automation call in
// `automation`, every bare `.value` write in `valueSets`, and start()/stop()
// times. ⛔ THE TEST OWNS THE CLOCK: write `rec.ctx.currentTime`.
// ⚠ A param's `.value` is the LAST value written or targeted, not the value a
// ramp would have reached at currentTime.
function fakeAudio() {
  const rec = {
    contexts: [], created: {}, nodes: [], buffers: 0, connections: [], automation: [],
    valueSets: [], starts: [], stops: [], resumes: 0,
    get ctx() { return this.contexts.length ? this.contexts[this.contexts.length - 1] : null; },
    // Clears the logs, never the contexts or the node ids.
    clear() {
      this.created = {}; this.buffers = 0; this.connections.length = 0; this.automation.length = 0;
      this.valueSets.length = 0; this.starts.length = 0; this.stops.length = 0; this.resumes = 0;
    },
  };
  let nextId = 0;
  function param(node, name, init) {
    let value = init;
    const log = (fn, v, t) => rec.automation.push({ node, param: name, fn, v, t });
    return {
      get value() { return value; },
      set value(v) { rec.valueSets.push({ node, param: name, v }); value = v; },
      setValueAtTime(v, t) { log("setValueAtTime", v, t); value = v; return this; },
      linearRampToValueAtTime(v, t) { log("linearRampToValueAtTime", v, t); value = v; return this; },
      exponentialRampToValueAtTime(v, t) { log("exponentialRampToValueAtTime", v, t); value = v; return this; },
      setTargetAtTime(v, t) { log("setTargetAtTime", v, t); value = v; return this; },
      cancelScheduledValues(t) { log("cancelScheduledValues", undefined, t); return this; },
    };
  }
  function node(ctx, kind, params, source) {
    const n = {
      kind, id: nextId++, context: ctx,
      connect(to) { rec.connections.push({ from: n, to }); return to; },
      disconnect() {},
    };
    for (const k of Object.keys(params)) n[k] = param(n, k, params[k]);
    if (source) {
      n.start = t => rec.starts.push({ node: n, t });
      n.stop = t => rec.stops.push({ node: n, t });
    }
    rec.nodes.push(n);
    rec.created[kind] = (rec.created[kind] || 0) + 1;
    return n;
  }
  class FakeAudioContext {
    constructor() {
      this.currentTime = 0;
      this.sampleRate = 48000;
      this.state = "running";
      this.destination = { kind: "destination", id: nextId++, connect() {} };
      rec.contexts.push(this);
    }
    resume() { rec.resumes++; this.state = "running"; return Promise.resolve(); }
    createGain() { return node(this, "gain", { gain: 1 }); }
    createBiquadFilter() { const n = node(this, "biquad", { frequency: 350, Q: 1, gain: 0 }); n.type = "lowpass"; return n; }
    createOscillator() { const n = node(this, "oscillator", { frequency: 440, detune: 0 }, true); n.type = "sine"; return n; }
    createBufferSource() { const n = node(this, "bufferSource", { playbackRate: 1 }, true); n.buffer = null; return n; }
    createBuffer(channels, length, sampleRate) {
      rec.buffers++;
      const data = [];
      for (let i = 0; i < channels; i++) data.push(new Float32Array(length));
      return { numberOfChannels: channels, length, sampleRate, getChannelData: i => data[i] };
    }
  }
  rec.AudioContext = FakeAudioContext;
  return rec;
}

function buildGame(opts = {}) {
  if (opts.rebuild !== false && distIsStale()) {
    execFileSync(process.execPath, [path.join(ROOT, "build.js")], { stdio: "pipe" });
  }
  const script = extractScript(fs.readFileSync(DIST, "utf8"));
  const env = stubEnv();
  const audio = opts.audio ? fakeAudio() : null;
  if (audio) env.win.AudioContext = audio.AudioContext;

  // Trailing expression returns the globals a test wants to poke. Extend the
  // list as systems land. ⛔ Named explicitly, never harvested from the scope:
  // a name listed here that the build does not define comes back null, which a
  // test asserts on loudly, rather than silently shrinking the surface.
  const EXPORTS = [
    "C", "state", "WELLS",
    // the heat clock and its seven accessors (00-config.js, CS007 P2)
    "heat", "heatT", "heatLerp",
    "spawnInterval", "enemyConcurrent", "climbMult",
    "vaultInterval", "vaultRimInterval", "surgeInterval", "weaverApex",
    // the depth model (03-wells.js, CS001 P2)
    "screenPos", "perspective", "wellThroat", "wellCentroid", "wellVertCount",
    "rimPoint", "throatPoint",
    "laneWrap", "laneClamp", "laneNormalize", "laneDelta", "laneHop", "laneAtWall",
    // the boundary lattice (03-wells.js, CS005 P1)
    "laneBoundaryLo", "laneBoundaryHi", "boundaryFrom",
    // the well renderer (13-render-well.js, CS001 P3)
    "drawPoly", "glowStroke", "laneLineWidth", "wellBandColor", "wellBaseAlpha", "drawWell",
    // the lane-lighting producer (23-main.js, CS006 P4)
    "buildLaneState",
    // state, input and the loop (02/04/23, CS002 P1)
    "newState", "createInput", "INPUT_KEYS_DEFAULT", "Game",
    // the Skimmer (05-skimmer.js, CS002 P2)
    "Skimmer", "SKIMMER_POLY", "skimmerPoints",
    // shots (06-shots.js, 14-render-entities.js, CS002 P3)
    "Shot", "updateShots", "drawShot",
    // the RNG, the entity contract and the Vaulter (01/07/14, CS003 P1)
    "mulberry32", "rngInt", "rngPick", "invPerspective",
    "Enemy", "Vaulter", "entityPoints", "VAULTER_POLY", "drawVaulter",
    // the Carrier, the cargo table and the split (03/07/14, CS004 P2)
    "Carrier", "CARGO", "splitLanes", "CARRIER_POLY", "CARGO_GLYPHS", "drawCarrier",
    // the Weaver and its bolt (07/14, CS004 P3)
    "Weaver", "WeaverBolt", "WEAVER_POLY", "WEAVER_BOLT_POLY", "drawWeaver", "drawWeaverBolt",
    // the Thorn, the lane lookup and its segment draw (07/14, CS004 P4)
    "Thorn", "thornInLane", "drawThorn",
    // the Drifter and its two silhouettes (07/14, CS005 P2)
    "Drifter", "DRIFTER_POLY_RIDE", "DRIFTER_POLY_CROSS", "drawDrifter",
    // the Surger, its bar and its lane fuse (07/14, CS005 P3)
    "Surger", "SURGER_POLY", "drawSurger", "drawSurgeLane",
    // the spawner and the well lifecycle (08/23, CS003 P2)
    "spawnEnemy", "updateSpawner", "resetSpawner", "wellCleared", "spawnLimit", "ENEMY_KINDS",
    // the release budget's count — THREATS, not entities (08, CS007 P1)
    "threatCount",
    // the interval spawner's lane source (08, CS003 P2) — CS006 P5 counts its
    // bounded redraws directly, which is the form that outlives a golden
    "pickSpawnLane",
    "enterWell", "nextWell", "startGame",
    // collision and the Purge (09-collision.js, CS003 P3)
    "updateCollisions", "collideShots", "collideSkimmer", "killSkimmer",
    "updatePurge", "purgeTarget",
    // death, lives and respawn (05/23, CS003 P4)
    "spawnSkimmer", "respawnSkimmer", "skimmerBlinkVisible",
    // the Dive (11-dive.js, CS006 P3)
    "resetDive", "startDive", "updateDive", "diveHazard", "diveLaneBlocked",
    "diveStrike", "diveRespawnLane", "diveRespawn",
    // the interval spawner's kind source (08, CS004 P1). ⛔ THE EXPORT SURVIVED
    // THE SCHEDULE AND THE REASON CHANGED (CS007 P3): it used to be ⚠ TEMPORARY
    // because it went with C.DEBUG_SPAWN_KINDS, and GDD 8.1's introduction
    // schedule deleted that constant WITHOUT deleting this function — only its
    // reader moved, to C.SPAWN_SCHEDULE. Four closed files call it directly, so
    // a rename here comes back null and fails them differently than intended.
    // eligibleKinds is the schedule itself, and it is what lets a test assert a
    // level's set rather than infer it from what spawned.
    "pickSpawnKind", "eligibleKinds",
    // telemetry (21-telemetry.js, CS007 P4). ⛔ TELEMETRY_FIELDS is the one
    // source of truth for the row shape and the CSV column order, and
    // telemetryRow is the other half GDD 17 item 11 compares it against — both
    // are named here so the assertion reads the BUILT file rather than src/.
    "TELEMETRY_FIELDS", "TELEMETRY_KINDS", "telemetryRow", "telemetryCell",
    "Telemetry",
    // scoring and extra lives (12-scoring.js, CS008 P2)
    "addScore", "clearBonuses",
    // the run's parameters and Start Depth (12/22, CS008 P3)
    "startBonus", "levelRecord", "startDepthOptions",
    // text, the HUD and the death fragmentation (13/14/15, CS008 P4)
    "drawText", "drawHud", "hudLayout", "PURGE_GLYPH_POLY", "drawFragments", "fragmentT",
    // the menu model and the screens (15/23, CS008 P5)
    "createMenu", "drawMenu", "menuWindowStart",
    // kit-audio and the game's instances (16/19, CS009 P1)
    "AUDIO_VERSION", "AUDIO_BUSES", "createAudioEngine", "createMusic",
    "AudioSys", "MusicSys", "MUSIC_TRACKS",
    // music by screen (19-sfx.js, CS009 P3)
    "musicStateFor", "MUSIC_SILENCE",
  ];
  // `opts.stub` rebinds named top-level functions to no-ops AFTER the script
  // has evaluated, so every internal caller reaches the stub. For a claim of
  // the form "X changes nothing else" (test-cs008-p2.js: scoring spends no RNG
  // draw) — stubbing a function's EFFECT would still run its body. A name the
  // build does not define as a function throws rather than stubbing nothing.
  const stubs = (opts.stub || []).map(n =>
    `\n;if (typeof ${n} !== "function") throw new Error("stub: no function ${n}");` +
    `\n${n} = function () {};`).join("");
  // `opts.spy` wraps named top-level functions AFTER evaluation so every
  // internal caller reaches the wrapper, which counts calls in `.calls` and
  // otherwise passes through (test-cs008-p5.js: which screens draw the HUD).
  // A test may set `.before` / `.after` on the wrapper: each is called with the
  // same arguments around the real call (test-cs008-p8.js: the board as the
  // shot pass sees it, and as it leaves it). Both default to null.
  const spies = (opts.spy || []).map(n =>
    `\n;if (typeof ${n} !== "function") throw new Error("spy: no function ${n}");` +
    `\n${n} = (function (f) { const w = function () { w.calls++;` +
    ` if (w.before) w.before.apply(this, arguments); const r = f.apply(this, arguments);` +
    ` if (w.after) w.after.apply(this, arguments); return r; };` +
    ` w.calls = 0; w.before = null; w.after = null; return w; })(${n});`).join("");
  const tail = stubs + spies + "\n;return {" +
    EXPORTS.map(n => `${n}: (typeof ${n} !== "undefined" ? ${n} : null)`).join(", ") +
    "};";
  const fn = new Function("window", "document", "navigator", "performance",
                          "localStorage", "requestAnimationFrame", "AudioContext",
                          script + tail);

  const g = fn(env.win, env.doc, env.win.navigator, env.win.performance,
               env.win.localStorage, env.win.requestAnimationFrame,
               audio ? audio.AudioContext : undefined);
  return Object.assign({}, g, { _env: env, _audio: audio });
}

function syntaxCheck() {
  const script = extractScript(fs.readFileSync(DIST, "utf8"));
  const tmp = path.join(__dirname, "tmp");
  fs.mkdirSync(tmp, { recursive: true });
  const f = path.join(tmp, "syntax-check.js");
  fs.writeFileSync(f, script);
  execFileSync(process.execPath, ["--check", f], { stdio: "pipe" });
  fs.unlinkSync(f);
}

function assert(cond, msg) {
  if (cond) { passed++; return true; }
  failed++; failures.push(msg); return false;
}
function eq(a, b, msg) { return assert(Object.is(a, b), `${msg} (got ${a}, want ${b})`); }
function close(a, b, eps, msg) { return assert(Math.abs(a - b) <= eps, `${msg} (got ${a}, want ~${b})`); }
function skip(msg) { skipped++; console.log(`${SKIP_TAG}: ${msg}`); }

// ⛔ Failure-only output. A green run says one line; a red run says why.
function report(name) {
  const label = name || path.basename(process.argv[1]);
  if (failed === 0) {
    console.log(`ok  ${label}  (${passed} assertions${skipped ? `, ${skipped} skipped` : ""})`);
    process.exit(0);
  }
  console.error(`FAIL  ${label}  (${failed}/${passed + failed} failed)`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

module.exports = { buildGame, syntaxCheck, extractScript, assert, eq, close, skip, report, SKIP_TAG };
