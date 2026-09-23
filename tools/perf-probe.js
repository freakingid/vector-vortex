// tools/perf-probe.js — GDD 17's budget, measured in a real engine (CS017 P1,
// plan S1–S4). The shipped file in headless Chromium, from file://.
//
//   node tools/perf-probe.js             all three parts, one JSON block
//   PARTS=boot,alloc node tools/…        a subset (boot, alloc, frame)
//   DRAWS=4000 SECONDS=6 node tools/…    longer samples (diagnosis only);
//                                        WARM / STEADY set the two warm-ups
//
// Prints, as ONE JSON block:
//   boot   the title reached, Space ×3 reaching play, exceptions, console
//          errors (the leaderboard bridge's CORS refusal is EXTERNAL-FILES.md
//          rule 2 working as designed, and is reported apart as `bridge`);
//   alloc  bytes per Game.draw() on the budget board and on an empty board,
//          from HeapProfiler sampling WITH objects collected by the major and
//          the minor GC — ⛔ without both it reports only survivors (plan §1.3)
//          — and the top attributions, function < caller (module), each
//          read twice: after WARM draws and at the JIT's steady state;
//   frame  the budget board's UNCAPPED frame cost (a second launch with
//          --disable-frame-rate-limit --disable-gpu-vsync) at 1× and 4×
//          Emulation.setCPUThrottlingRate, software raster (--disable-gpu).
//
// ⛔ THE BUDGET BOARD IS S2's: Overdrive L23, 16 enemies, 24 shots (Spread's
// cap in force), 2 tokens, the combo readout at ×4, a prompt mid-fade and a
// death's fragments. A dead craft is what draws fragments and a frozen
// simulation is what a death looks like, so `frame` times that board's draw
// and raster, and the simulation step's script cost beside it on the same
// board with the craft alive and invulnerable instead.
//
// ⛔ A DESIGN INSTRUMENT, NOT A TEST: run-all.js never runs it, it asserts
// nothing about time, and its numbers are wall-clock readings on ONE machine —
// data for GDD 17, never a gate (plan S4, §7). ⛔ It stages through the page's
// own globals (startGame, ENEMY_KINDS, Shot, state, promptQueue, Game) and
// never edits the build. ⛔ No npm dependency: Node's own WebSocket and fetch.
// ⛔ No Chromium, no numbers: it says why and exits nonzero — never a silent
// pass. It looks for CHROME_BIN, then Playwright's cache.
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn, execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist", "vector-vortex.html");
const PARTS = (process.env.PARTS || "boot,alloc,frame").split(",");
const DRAWS = +(process.env.DRAWS || 2000);
const WARM = +(process.env.WARM || 300);
const STEADY = +(process.env.STEADY || 5000);
const SECONDS = +(process.env.SECONDS || 4);
const SETTLE_MS = 1200;
const RATES = [1, 4];
const STEPS = 12;
const STAGINGS = 10;
const SEED = 777;
const LEVEL = 23;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function die(why) {
  console.error(`perf-probe: ${why}`);
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Chromium, and the build
// ---------------------------------------------------------------------------
function findChromium() {
  if (process.env.CHROME_BIN) {
    if (!fs.existsSync(process.env.CHROME_BIN)) die(`CHROME_BIN=${process.env.CHROME_BIN} does not exist`);
    return process.env.CHROME_BIN;
  }
  const cache = path.join(os.homedir(), ".cache", "ms-playwright");
  const dirs = fs.existsSync(cache)
    ? fs.readdirSync(cache).filter(d => /^chromium_headless_shell-\d+$/.test(d))
        .sort((a, b) => +b.split("-")[1] - +a.split("-")[1])
    : [];
  for (const d of dirs) {
    const bin = path.join(cache, d, "chrome-headless-shell-linux64", "chrome-headless-shell");
    if (fs.existsSync(bin)) return bin;
  }
  die(`no Chromium: CHROME_BIN is unset and ${cache} holds no chromium_headless_shell-*/ ` +
      `(npx playwright install chromium-headless-shell puts one there)`);
}

// The suite's own staleness rule (scratchpad/_harness.js): a src/ or inlined
// kit file newer than dist/ rebuilds it, so the probe measures the source.
function ensureBuilt() {
  const { KIT_INLINE } = require(path.join(ROOT, "build.js"));
  const built = fs.existsSync(DIST) ? fs.statSync(DIST).mtimeMs : -1;
  const stale = built < 0 ||
    fs.readdirSync(path.join(ROOT, "src")).some(f => fs.statSync(path.join(ROOT, "src", f)).mtimeMs > built) ||
    KIT_INLINE.some(f => fs.statSync(path.join(ROOT, f)).mtimeMs > built);
  if (stale) execFileSync(process.execPath, [path.join(ROOT, "build.js")], { stdio: "pipe" });
  return stale;
}

function commit() {
  try {
    const head = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT }).toString().trim();
    const dirty = execFileSync("git", ["status", "--porcelain", "src", "lib", "build.js"], { cwd: ROOT }).toString().trim();
    return dirty ? head + "+dirty" : head;
  } catch (e) { return "unknown"; }
}

// dist line (1-based) -> module, from the build's banners: a rule line, then
// "// <file>.js" (a dash rule for the three inlined kit modules).
function moduleMap(html) {
  const lines = html.split("\n"), at = [];
  for (let i = 1; i < lines.length; i++) {
    const m = lines[i].match(/^\/\/ ((?:lib\/[\w-]+\/)?[\w-]+\.js)$/);
    if (m && /^\/\/ [=-]{10,}$/.test(lines[i - 1])) at.push([i + 1, path.basename(m[1])]);
  }
  return line => { let name = "(page)"; for (const [l, n] of at) { if (l > line) break; name = n; } return name; };
}

// ---------------------------------------------------------------------------
// The DevTools protocol over Node's own WebSocket
// ---------------------------------------------------------------------------
async function launch(bin, extra) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "perf-probe-"));
  const proc = spawn(bin, ["--headless", "--no-sandbox", "--disable-gpu", "--remote-debugging-port=0",
    `--user-data-dir=${profile}`, "--window-size=1280,720", "--no-first-run", ...extra, "about:blank"],
    { stdio: ["ignore", "ignore", "pipe"] });
  const port = await new Promise((res, rej) => {
    let buf = "";
    const t = setTimeout(() => rej(new Error("Chromium printed no DevTools port in 15 s:\n" + buf)), 15000);
    proc.stderr.on("data", d => {
      buf += d;
      const m = buf.match(/DevTools listening on ws:\/\/[^:]+:(\d+)\//);
      if (m) { clearTimeout(t); res(+m[1]); }
    });
    proc.on("exit", code => { clearTimeout(t); rej(new Error(`Chromium exited (${code}):\n${buf}`)); });
  });
  const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  const page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });

  let id = 0;
  const pending = new Map(), listeners = [], events = [];
  ws.addEventListener("message", ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id);
      if (m.error) p.rej(new Error(JSON.stringify(m.error))); else p.res(m.result);
    } else if (m.method) {
      events.push(m);
      for (const f of listeners) f(m);
    }
  });
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params }));
  });
  const evaluate = async expr => {
    const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true });
    if (r.exceptionDetails) throw new Error("page threw: " + JSON.stringify(r.exceptionDetails).slice(0, 800));
    return r.result.value;
  };
  await send("Runtime.enable"); await send("Log.enable"); await send("Page.enable");
  const loaded = new Promise(r => listeners.push(m => { if (m.method === "Page.loadEventFired") r(); }));
  await send("Page.navigate", { url: "file://" + DIST });
  await loaded;
  const close = () => {
    try { ws.close(); } catch (e) { /* already closed */ }
    proc.kill("SIGKILL");
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* best effort */ }
  };
  return { send, evaluate, events, close, browser: version.Browser };
}

async function waitFor(p, expr, ms) {
  const until = Date.now() + ms;
  while (Date.now() < until) { if (await p.evaluate(expr)) return true; await sleep(50); }
  return false;
}

// ---------------------------------------------------------------------------
// The budget board (S2), staged through the page's own globals
// ---------------------------------------------------------------------------
// ⛔ Every kind the two rosters hold, once where the board has room; a Thorn's
// `depth` is its length. `__stage(board)`: "budget" is S2's board with the
// craft's fragments (the freeze), "live" the same with the craft alive and
// invulnerable, "empty" Classic L23 with nothing but the craft and the HUD.
const STAGE = `
window.__stage = function (board) {
  const od = board !== "empty";
  startGame(${SEED}, { mode: od ? "overdrive" : "classic", startDepth: ${LEVEL} });
  state.screen = "play";
  if (!od) return;
  const well = WELLS[state.wellIndex];
  const lanes = wellVertCount(well) - (well.closed ? 0 : 1);
  const kinds = ["vaulter", "reaver", "carrierVaulter", "carrierDrifter", "carrierSurger", "weaver",
                 "weaverBolt", "thorn", "drifter", "surger", "warden", "mimic", "mimicShot",
                 "vaulter", "reaver", "drifter"];
  for (let i = 0; i < kinds.length; i++)
    state.enemies.push(ENEMY_KINDS[kinds[i]](i % lanes, 0.15 + 0.8 * (i / kinds.length), 1));
  state.powers.spread = true;
  for (let i = 0; i < C.SPREAD_SHOT_MAX; i++) {
    const s = new Shot(well, i % lanes, i % 3 === 0);
    s.t = (i / C.SPREAD_SHOT_MAX) * C.SHOT_TIME * 0.95;
    state.shots.push(s);
  }
  for (const kind of ["lance", "spread"])
    state.tokens.push({ kind, lane: state.tokens.length + 2, depth: C.TOKEN_HOVER_DEPTH, age: 0.5, dead: false, collected: false });
  state.combo.mult = 4;
  promptQueue.rows.push(C.PROMPTS[0]);
  promptQueue.t = C.PROMPT_TIME - C.PROMPT_FADE / 2;
  if (board === "budget") { state.skimmer.dead = true; Game.hitStop(C.HIT_STOP_DEATH / 2); }
  else state.invulnTime = 1e9;
};
window.__board = function () {
  return { mode: state.mode, level: state.level, enemies: state.enemies.length, shots: state.shots.length,
           tokens: state.tokens.length, combo: state.combo.mult, prompt: promptQueue.rows.length,
           craftDead: !!(state.skimmer && state.skimmer.dead) };
};
`;

// ---------------------------------------------------------------------------
// (a) boot, (b) bytes per draw()
// ---------------------------------------------------------------------------
async function key(p, k, code, vk) {
  await p.send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code, windowsVirtualKeyCode: vk });
  await sleep(80);
  await p.send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk });
  await sleep(150);
}

async function boot(p) {
  const out = {};
  // ⚠ A press before the loop has run live steps can be lost (MEASURED once in
  // five runs), so the title must have ticked, each press waits for the screen
  // to change, and a press that changed nothing is retried ONCE and counted.
  out.titleReached = await waitFor(p, `typeof state !== "undefined" && state.screen === "title" && Game.stats.ticks > 30`, 10000);
  out.version = await p.evaluate(`typeof C !== "undefined" ? C.GAME_VERSION : null`);
  out.screens = [await p.evaluate(`state.screen`)];
  out.retries = 0;
  for (let i = 0; i < 3; i++) {
    const was = out.screens[out.screens.length - 1];
    for (let tries = 0; tries < 2; tries++) {
      await key(p, " ", "Space", 32);
      if (await waitFor(p, `state.screen !== ${JSON.stringify(was)}`, 1000)) break;
      out.retries++;
    }
    out.screens.push(await p.evaluate(`state.screen`));
  }
  out.playReached = await waitFor(p, `state.screen === "play" && Game.stats.ticks > 60`, 5000);
  Object.assign(out, await p.evaluate(`({ mode: state.mode, level: state.level, ticks: Game.stats.ticks,
    audioOpen: !!(AudioSys && AudioSys.ctx), leaderboard: typeof window.KitLeaderboard })`));
  out.exceptions = p.events.filter(e => e.method === "Runtime.exceptionThrown").map(e => {
    const d = e.params.exceptionDetails;
    return (d.exception && d.exception.description ? d.exception.description : d.text).slice(0, 200);
  });
  const errs = p.events.filter(e => (e.method === "Log.entryAdded" && e.params.entry.level === "error") ||
                                    (e.method === "Runtime.consoleAPICalled" && e.params.type === "error"))
    .map(e => e.method === "Log.entryAdded" ? e.params.entry.text + (e.params.entry.url ? " " + e.params.entry.url : "")
                                            : e.params.args.map(a => a.value || a.description).join(" "));
  const isBridge = s => /kit-leaderboard/.test(s) || /CORS|ERR_FAILED/.test(s);
  out.bridge = errs.filter(isBridge).length;
  out.consoleErrors = errs.filter(s => !isBridge(s)).map(s => s.slice(0, 200));
  out.healthy = out.titleReached && out.playReached && out.exceptions.length === 0 && out.consoleErrors.length === 0;
  return out;
}

// Two readings per board, because the number is the JIT's as much as the
// source's (MEASURED, P1): after WARM draws of the board — plan §1.3's method,
// where each allocating function still shows under its own name — and again
// after STEADY more, when TurboFan has inlined the leaves (projectPoly's bytes
// then show under drawWell) and unboxed some doubles. ⛔ Each board gets its
// OWN page: measured in one, the second board's first reading inherits the
// first board's warm-up (MEASURED: the budget board read 7,363 B after the
// empty board and 8,196 before it).
async function sample(p, where) {
  await p.send("HeapProfiler.collectGarbage");
  await p.send("HeapProfiler.startSampling", {
    samplingInterval: 16, includeObjectsCollectedByMajorGC: true, includeObjectsCollectedByMinorGC: true,
  });
  await p.evaluate(`for (let i = 0; i < ${DRAWS}; i++) Game.draw();`);
  const { profile } = await p.send("HeapProfiler.stopSampling");
  const by = new Map();
  let total = 0;
  (function walk(n, stack) {
    const f = n.callFrame;
    const name = f.functionName ? `${f.functionName} (${f.url ? where(f.lineNumber + 1) : "native"})` : "(anon)";
    const st = stack.concat(name);
    if (n.selfSize) {
      const k = st.slice(-2).reverse().join(" < ");
      by.set(k, (by.get(k) || 0) + n.selfSize);
      total += n.selfSize;
    }
    for (const c of n.children || []) walk(c, st);
  })(profile.head, []);
  return {
    bytesPerDraw: Math.round(total / DRAWS),
    top: [...by.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([k, v]) => ({ site: k, bytes: Math.round(v / DRAWS) })),
  };
}

async function bytesPerDraw(bin, board, where) {
  const p = await launch(bin, []);
  try {
    if (!await waitFor(p, `typeof state !== "undefined" && state.screen === "title"`, 10000)) throw new Error("no title");
    await p.evaluate(STAGE);
    await p.send("HeapProfiler.enable");
    await p.evaluate(`Game.stop(); __stage(${JSON.stringify(board)}); for (let i = 0; i < ${WARM}; i++) Game.draw();`);
    const afterWarm = await sample(p, where);
    await p.evaluate(`for (let i = 0; i < ${STEADY}; i++) Game.draw();`);
    const steady = await sample(p, where);
    return { board: await p.evaluate(`__board()`), afterWarm, steady };
  } finally { p.close(); }
}

// ---------------------------------------------------------------------------
// (c) uncapped frame cost
// ---------------------------------------------------------------------------
// The page's own loop, frame() → draw(), timed by a second rAF hook that holds
// the freeze open (Game.hitStop only ever raises it) and re-seats the prompt's
// clock; it allocates nothing. A freeze runs no step, so the row is the DRAW
// and its raster. The step's own script cost is timed apart, in the page, on
// the "live" board (the craft alive and invulnerable), a few steps per staging
// with the staging untimed: ⚠ re-staging a live loop whenever that board thins
// happens on nearly every step (MEASURED, 240 in 4 s), so a live-loop row
// measures the re-staging, and one staging stepped 120 times thins to 9
// enemies and no shots (MEASURED).
const HOOK = `
window.__ts = []; window.__hold = false;
(function hook(t) {
  __ts.push(t);
  if (__hold) { Game.hitStop(C.HIT_STOP_DEATH / 2); promptQueue.t = C.PROMPT_TIME - C.PROMPT_FADE / 2; }
  requestAnimationFrame(hook);
})(performance.now());
`;

async function frameCost(p) {
  const rows = [];
  await p.evaluate(STAGE + HOOK);
  for (const rate of RATES) {
    await p.send("Emulation.setCPUThrottlingRate", { rate });
    await p.evaluate(`Game.stop(); __stage("budget"); __hold = true; Game.start();`);
    await sleep(SETTLE_MS);
    await p.evaluate(`__ts.length = 0;`);
    await sleep(SECONDS * 1000);
    const r = await p.evaluate(`(function () {
      const ts = __ts.slice(), d = [], board = __board();
      for (let i = 1; i < ts.length; i++) d.push(ts[i] - ts[i - 1]);
      d.sort((a, b) => a - b);
      const q = f => +d[Math.min(d.length - 1, Math.floor(f * d.length))].toFixed(2);
      Game.stop(); __hold = false;
      // Script alone, the raster deferred: 120 draws of this board, then
      // ${STAGINGS} stagings of the live one, ${STEPS} steps each, the staging
      // outside the timer so the steps run on a near-full board.
      let t0 = performance.now();
      for (let i = 0; i < 120; i++) Game.draw();
      const draw = (performance.now() - t0) / 120;
      let stepMs = 0;
      for (let k = 0; k < ${STAGINGS}; k++) {
        __stage("live");
        t0 = performance.now();
        for (let i = 0; i < ${STEPS}; i++) Game.update(C.FIXED_DT);
        stepMs += performance.now() - t0;
      }
      const step = stepMs / (${STAGINGS} * ${STEPS});
      return { board, frames: ts.length, fps: +(1000 * (ts.length - 1) / (ts[ts.length - 1] - ts[0])).toFixed(1),
               p50ms: q(0.5), p95ms: q(0.95), jsMsPerDraw: +draw.toFixed(2), jsMsPerStep: +step.toFixed(2),
               liveAfterSteps: { enemies: state.enemies.length, shots: state.shots.length } };
    })()`);
    rows.push({ throttle: rate, ...r });
  }
  await p.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  return rows;
}

// ---------------------------------------------------------------------------
(async () => {
  if (typeof WebSocket !== "function") die(`Node ${process.version} has no built-in WebSocket (Node 22+ does)`);
  const bin = findChromium();
  const rebuilt = ensureBuilt();
  const html = fs.readFileSync(DIST, "utf8");
  const out = {
    tool: "tools/perf-probe.js", commit: commit(), rebuilt,
    dist: { path: path.relative(ROOT, DIST), bytes: Buffer.byteLength(html) },
    chromium: { bin, browser: null }, flags: "--headless --disable-gpu (software raster)",
  };
  let ok = true;

  if (PARTS.includes("boot")) {
    const p = await launch(bin, []);
    out.chromium.browser = p.browser;
    try { out.boot = await boot(p); ok = ok && out.boot.healthy; } finally { p.close(); }
  }
  if (PARTS.includes("alloc")) {
    const where = moduleMap(html);
    out.alloc = { draws: DRAWS, warm: WARM, steady: STEADY, samplingInterval: 16, collectedIncluded: "major+minor" };
    for (const board of ["budget", "empty"]) out.alloc[board] = await bytesPerDraw(bin, board, where);
  }
  if (PARTS.includes("frame")) {
    const p = await launch(bin, ["--disable-frame-rate-limit", "--disable-gpu-vsync"]);
    out.chromium.browser = out.chromium.browser || p.browser;
    try {
      out.frame = { seconds: SECONDS, settleMs: SETTLE_MS, uncapped: "--disable-frame-rate-limit --disable-gpu-vsync",
                    rows: await frameCost(p) };
    } finally { p.close(); }
  }
  console.log(JSON.stringify(out, null, 1));
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error("perf-probe:", e && e.stack || e); process.exit(1); });
