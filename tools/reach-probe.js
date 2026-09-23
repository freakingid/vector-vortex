// tools/reach-probe.js — the front door's reach, per achievement FACT (GDD 15.5,
// 17 item 10). The measurement behind test-cs015-p3.js's REACH table.
//
//   node tools/reach-probe.js            all four passes, in parallel
//   PASS=C node tools/reach-probe.js     one pass, JSON on stdout
//   STEPS=60000 SESS=classic9 ...        a longer / single session (diagnosis
//                                        only — REACH is 40,000 steps, always)
//
// Four passes of the closed soaks' four-clause hunter (jump at anything aloft;
// never target a MimicShot and steer away within a lane; go to a hovering
// token; steer to a ring in reach), driven through Game.frame() from
// Game.reset() + startGame(), 40,000 steps per session over Classic Start Depth
// 1 / 9 / 81 and Overdrive 1 / 9 / 17 / 81, a game over restarting the session:
//   A  fire held, the Purge spent every 311 steps
//   B  A again (a determinism check: it must equal A)
//   C  AIMED — fire only with a non-bolt, non-aloft enemy in the lane; Purge never
//   D  fire held, Purge never
// Both achievement seats are MUTATED to publish their facts object ABOVE the
// eligibility gate, so every clear edge and every run end is read.
//
// ⛔ A DESIGN INSTRUMENT, NOT A TEST: it asserts nothing and run-all.js does not
// run it. Its output is DATA: the per-fact maxima, then every row whose top
// threshold the front door did not reach. ⛔ A row it reports is reported to
// Paul, never quietly lowered, and REACH is replaced WHOLE from a fresh run,
// never patched to fit. Rebuilt at CS016 P3 from CS015's throwaway
// (log/CS016.md); it loads dist/ through the suite's harness, as a test does.
"use strict";

const path = require("path");
const fs = require("fs");
const { execFile } = require("child_process");
const ROOT = path.join(__dirname, "..");

const PASSES = ["A", "B", "C", "D"];
const SESSIONS = [["classic", 1], ["classic", 9], ["classic", 81],
                  ["overdrive", 1], ["overdrive", 9], ["overdrive", 17], ["overdrive", 81]];
const SEED = 20260921;

// ---------------------------------------------------------------------------
// one pass (a child process: PASS is set)
// ---------------------------------------------------------------------------
function runPass(PASS) {
  const H = require(path.join(ROOT, "scratchpad", "_harness.js"));
  const { installSeed } = require(path.join(ROOT, "scratchpad", "_seeded-random.js"));
  const FIRE_AIMED = PASS === "C";
  const PURGE = PASS === "A" || PASS === "B";
  const STEPS = +(process.env.STEPS || 40000);
  const sessions = process.env.SESS ? SESSIONS.filter(s => s.join("") === process.env.SESS) : SESSIONS;
  const SEATS = [
    ["    const win = wellWindow();",
     "    const win = wellWindow(); globalThis.__seat(\"clear\", facts(win));"],
    ["    const ok = eligible();",
     "    const ok = eligible(); globalThis.__seat(\"end\", facts(runEndFacts()));"],
  ];

  const max = {}, perSession = [];
  let cur = null;
  globalThis.__seat = (which, f) => {
    for (const k of Object.keys(f)) {
      if (k === "mode" || !Number.isFinite(f[k])) continue;
      if (!(k in max) || f[k] > max[k]) max[k] = f[k];
      if (!(k in cur) || f[k] > cur[k]) cur[k] = f[k];
    }
  };

  const sameLane = (Z, well, a, b) => Math.abs(Z.laneDelta(well, a, b)) <= Z.C.HIT_LANE_TOL;
  function drive(Z, i) {
    const st = Z.state, inp = Z.Game.input, well = Z.WELLS[st.wellIndex];
    if (i % 300 === 0) inp.mouseMove((Math.floor(i / 300) % 2) ? 4000 : -4000);
    if (PURGE) {
      if (i % 311 === 0) inp.keyDown("x");
      if (i % 311 === 4) inp.keyUp("x");
    }
    const sk = st.skimmer;
    inp.keyUp("ArrowRight"); inp.keyUp("ArrowLeft");
    if (!sk || sk.dead) { inp.keyUp("arrowup"); inp.keyUp(" "); return; }

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
    let dodge = null, token = null, best = null, inLane = false;
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
      if (!e.aloft && sameLane(Z, well, e.lane, sk.lane)) inLane = true;
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
    if (ringD !== null) d = ringD;
    else if (dodge !== null) d = dodge > 0 ? -1 : 1;
    else if (token !== null) d = token;
    else if (best !== null) d = Z.laneDelta(well, sk.lane, best.lane);
    else d = 0;
    if (d > 0.3) inp.keyDown("ArrowRight"); else if (d < -0.3) inp.keyDown("ArrowLeft");
    if (!FIRE_AIMED || inLane) inp.keyDown(" "); else inp.keyUp(" ");
    if (!st.powers.ward && st.enemies.some(e => !e.dead && e.aloft && sameLane(Z, well, e.lane, sk.lane))) inp.keyDown("arrowup");
    else inp.keyUp("arrowup");
  }

  let defs = null;
  for (const [mode, depth] of sessions) {
    installSeed(SEED);
    let clock = 0;
    Date.now = () => Date.UTC(2026, 8, 21, 12) + clock;   // wall time: a read does not advance it
    const X = H.buildGame({ store: new Map(), mutate: SEATS });
    defs = X.C.ACHIEVEMENTS;
    const G = X.Game, st = X.state, MS = X.C.FIXED_DT * 1000;
    cur = { mode, depth };
    let runs = 0, i = 0, drivenFor = -1;
    const start = () => { G.reset(); X.startGame(SEED + runs * 7919, { mode, startDepth: depth }); runs++; i = 0; drivenFor = -1; };
    start();
    for (let step = 0, guard = 0; step < STEPS && guard < STEPS * 8; guard++) {
      if (st.screen === "gameover") { for (const k of [" ", "x", "arrowup", "ArrowLeft", "ArrowRight"]) G.input.keyUp(k); start(); continue; }
      if (st.screen !== "play") throw new Error(`${mode} ${depth}: on "${st.screen}" at step ${step}`);
      if (G.hitStopLeft === 0 && drivenFor !== i) { drive(X, i); drivenFor = i; }
      const t0 = G.stats.ticks;
      clock += MS / 2; G.frame(clock);
      if (G.stats.ticks === t0) continue;
      i++; step++;
    }
    cur.runs = runs;
    perSession.push(cur);
  }
  return { pass: PASS, max, perSession, defs };
}

// ---------------------------------------------------------------------------
// all four (the parent: PASS is not set)
// ---------------------------------------------------------------------------
function main() {
  const t0 = Date.now();
  Promise.all(PASSES.map(p => new Promise((resolve, reject) => {
    execFile(process.execPath, [__filename], { env: Object.assign({}, process.env, { PASS: p }), maxBuffer: 64 << 20 },
      (err, out, errOut) => err ? reject(new Error(`pass ${p}: ${errOut || err.message}`)) : resolve(JSON.parse(out)));
  }))).then(results => {
    const all = {};
    for (const r of results) for (const k of Object.keys(r.max)) all[k] = Math.max(all[k] === undefined ? -Infinity : all[k], r.max[k]);
    const defs = results[0].defs;
    const rows = defs.lifetime.concat(defs.weekly);
    const named = new Set(rows.map(r => r.fact));
    const reach = {};
    for (const k of Object.keys(all).sort()) if (named.has(k)) reach[k] = all[k];

    console.log(`reach-probe: 4 passes x ${SESSIONS.length} sessions, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    console.log(`A === B (deterministic): ${JSON.stringify(results[0].max) === JSON.stringify(results[1].max)}`);
    console.log("\n// REACH, for test-cs015-p3.js — the facts a row names, max over all four passes");
    console.log("const REACH = " + JSON.stringify(reach, null, 2).replace(/"(\w+)":/g, "$1:") + ";");

    const top = r => (Array.isArray(r.tiers) ? r.tiers[r.tiers.length - 1] : r.at);
    const short = rows.filter(r => !(reach[r.fact] >= top(r)));
    console.log(`\n${rows.length} rows; unreached: ${short.length}`);
    for (const r of short) console.log(`  ⛔ ${r.id} asks ${top(r)} of \`${r.fact}\`; measured ${reach[r.fact]}`);

    // Against the table the test ships, so a drift is visible at a glance.
    const src = fs.readFileSync(path.join(ROOT, "scratchpad", "test-cs015-p3.js"), "utf8");
    const m = src.match(/const REACH = (\{[\s\S]*?\});/);
    if (m) {
      const shipped = Function(`return ${m[1]};`)();
      const keys = new Set(Object.keys(shipped).concat(Object.keys(reach)));
      const moved = [...keys].sort().filter(k => shipped[k] !== reach[k]).map(k => `${k} ${shipped[k]} -> ${reach[k]}`);
      console.log(`\nagainst the shipped REACH: ${moved.length === 0 ? "identical" : moved.length + " moved"}`);
      for (const line of moved) console.log("  " + line);
    }
  }).catch(e => { console.error(e.message); process.exit(1); });
}

if (process.env.PASS) process.stdout.write(JSON.stringify(runPass(process.env.PASS)));
else main();
