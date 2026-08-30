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

function buildGame(opts = {}) {
  if (opts.rebuild !== false && distIsStale()) {
    execFileSync(process.execPath, [path.join(ROOT, "build.js")], { stdio: "pipe" });
  }
  const script = extractScript(fs.readFileSync(DIST, "utf8"));
  const env = stubEnv();

  // Trailing expression returns the globals a test wants to poke. Extend the
  // list as systems land. ⛔ Named explicitly, never harvested from the scope:
  // a name listed here that the build does not define comes back null, which a
  // test asserts on loudly, rather than silently shrinking the surface.
  const EXPORTS = [
    "C", "state", "WELLS",
    // the depth model (03-wells.js, CS001 P2)
    "screenPos", "perspective", "wellThroat", "wellCentroid", "wellVertCount",
    "rimPoint", "throatPoint",
    "laneWrap", "laneClamp", "laneNormalize", "laneDelta", "laneHop", "laneAtWall",
    // the well renderer (13-render-well.js, CS001 P3)
    "drawPoly", "glowStroke", "laneLineWidth", "wellBandColor", "wellBaseAlpha", "drawWell",
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
    // the spawner and the well lifecycle (08/23, CS003 P2)
    "spawnEnemy", "updateSpawner", "resetSpawner", "wellCleared", "spawnLimit", "ENEMY_KINDS",
    "enterWell", "nextWell", "startGame",
    // collision and the Purge (09-collision.js, CS003 P3)
    "updateCollisions", "collideShots", "collideSkimmer", "killSkimmer",
    "updatePurge", "purgeTarget",
    // death, lives and respawn (05/23, CS003 P4)
    "spawnSkimmer", "respawnSkimmer", "skimmerBlinkVisible",
    // the interval spawner's kind source (08, CS004 P1) — ⚠ TEMPORARY, it goes
    // with C.DEBUG_SPAWN_KINDS when GDD 8.1's introduction schedule lands
    "pickSpawnKind",
  ];
  const tail = "\n;return {" +
    EXPORTS.map(n => `${n}: (typeof ${n} !== "undefined" ? ${n} : null)`).join(", ") +
    "};";
  const fn = new Function("window", "document", "navigator", "performance",
                          "localStorage", "requestAnimationFrame", "AudioContext",
                          script + tail);

  const g = fn(env.win, env.doc, env.win.navigator, env.win.performance,
               env.win.localStorage, env.win.requestAnimationFrame, undefined);
  return Object.assign({}, g, { _env: env });
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
