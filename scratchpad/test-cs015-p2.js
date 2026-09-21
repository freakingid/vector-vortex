// test-cs015-p2.js — CS015 P2: the facts, the seats and the gate (plan §4;
// A2-A, A3-A, A4-A, A9-A, A11).
//  1. ⛔ NO BASELINE MOVES: P1_DETERMINISM_HASH 1229033515 (test-cs005-p5.js
//     --hash-only, the child test-cs006-p2.js runs), GOLDEN_LANES (test-cs004-
//     p1.js green), and one played session hashing identically on every step
//     against (a) the two seats mutated out and (b) the counters mutated out —
//     (b) with `tally` and `brood` left out of its hash, since those ARE (b).
//  2. Each counter counts its event at its own place, observed per step off
//     the one call already at that place, and staged for the rare ones.
//  3. Each seat fires once per event, on an eligible run only; ⛔ a bench run
//     reaches neither seat's write. 4. ⛔ No storage write on a play step that
//     is not the clear edge (plan §1.4's shape: a Store.set spy with the screen).
// ⛔ TRAPS. 1. ⛔ REWRITTEN IN PLACE AT CS015 P3. P1's table was placeholders
//     naming no real fact, so nothing would ever unlock and every build here
//     swapped in TABLE, one mutate per row. ⛔ P3 landed the real table, which
//     names real facts, so TABLE is EMPTY and the non-vacuity lines below are
//     what keeps the claim honest — never a weakened assertion.
//  2. Meta.runEnded() nulls `run` first, so eligible() is false inside it.
//  3. A Store.set spy sees only p0's writes (p0's scope IS the root store).
//  4. The dive's end empties state.dive.rings IN PLACE: capture before a step.
"use strict";

const path = require("path");
const { execFileSync } = require("child_process");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20261015;
installSeed(SEED);                          // ⛔ above the first buildGame()

const J = JSON.stringify;
const NS = "coinless.vector-vortex.";

// ⛔ TRAP 1, AS CS015 P3 LEFT IT: the shipped table is real, so no mutate is
// needed to make an unlock possible. The array stays because it is the seam
// every build here goes through, and emptying it is the whole repair.
const TABLE = [];

// The two seats, each in the build exactly once (buildGame() throws otherwise).
const SEAT_EDGE = ["      Meta.clearEdge();\n", "\n"];
// ⛔ REWRITTEN IN PLACE AT CS015 P3: the run-end seat gained the run's own
// closing facts and the unlock sound. Its CLAIM is the one it always made —
// mutate this line out and no run's end evaluates.
const SEAT_END = ["    if (booted && ok) sounded(Achievements.evaluate(facts(runEndFacts())));\n", "\n"];
const GATE = "return run !== null && !run.bench;";

// Every counter line P2 added, out — plus tallyKill() stubbed.
const COUNTERS_OUT = [
  ["    state.tally.thornChips++;\n", "\n"],
  ["    if (a && b) a.brood = b.brood = { left: 2 };\n", "\n"],
  ["state.lives += 1; state.tally.extraLives++; sfx(", "state.lives += 1; sfx("],
  ["      if (e.dead) { state.tally.rimSweepKills++; tallyKill(state, e); }\n", "\n"],
  ["    state.tally.jumpKills++;\n", "\n"],
  ["addScore(C.RING_POINTS); state.tally.ringsTaken++; sfx(", "addScore(C.RING_POINTS); sfx("],
  ["    if (d.rings.length > 0 && d.rings.every(r => r.taken === true)) state.tally.ringSetsTaken++;\n", "\n"],
  ["  state.tally.tokenKindsMask |= 1 << Object.keys(C.TOKEN_WEIGHTS).indexOf(t.kind);\n", "\n"],
  ["  state.tally.wellsSeenMask |= 1 << state.wellIndex;\n", "\n"],
  ["      if (!state.diedThisWell) state.tally.deathlessWells++;\n", "\n"],
  ["      if (state.purgeUses === 0) state.tally.purgeSavedClears++;\n", "\n"],
  ["      if (!well.closed) state.tally.openWellsCleared++;\n", "\n"],
];

const NEW_FIELDS = ["thornChips", "deathlessWells", "purgeSavedClears", "openWellsCleared",
  "wellsSeenMask", "extraLives", "rimSweepKills", "jumpKills", "mimicKills", "carrierSplits",
  "ringsTaken", "ringSetsTaken", "tokenKindsMask"];

// ---------------------------------------------------------------------------
// the build, the session helpers, the observers
// ---------------------------------------------------------------------------

function build(o) {
  installSeed(SEED);
  let now = Date.UTC(2026, 8, 21);
  Date.now = () => (now += 7919);
  const X = H.buildGame({
    store: new Map(),
    mutate: TABLE.concat(o.mutate || []),
    stub: o.stub || [],
    spy: ["clearBonuses", "dropToken", "collectToken", "jumpStrike", "collideSkimmer", "addScore"],
  });
  const G = X.Game, C = X.C, MS = C.FIXED_DT * 1000;
  let clock = 0;
  const obs = { edgeFrame: false, sets: [], evals: [], seatMoved: [] };
  const halfFrame = () => { obs.edgeFrame = false; clock += MS / 2; G.frame(clock); };
  const liveStep = () => { const want = G.stats.ticks + 1; for (let n = 0; G.stats.ticks < want && n < 8; n++) halfFrame(); };
  const press = k => { G.input.keyDown(k); liveStep(); G.input.keyUp(k); liveStep(); };
  const S = {
    X, G, C, obs, liveStep, halfFrame, press,
    reset: () => { G.reset(); clock = 0; },
    boot: () => { G.frame(0); liveStep(); liveStep(); },
    settle: () => { for (let n = 0; n < 400 && (G.hitStopLeft > 0 || X.state.screen !== "gameover"); n++) halfFrame(); liveStep(); liveStep(); },
    right: n => { for (let i = 0; i < n; i++) { G.input.keyDown("ArrowRight"); liveStep(); liveStep(); G.input.keyUp("ArrowRight"); liveStep(); } },
  };
  // ⛔ TRAP 3: the Store.set spy, with the screen and whether a clear edge ran
  // in this frame (clearBonuses() is called at the edge and nowhere else).
  X.clearBonuses.before = () => { obs.edgeFrame = true; };
  const realSet = X.Store.set;
  X.Store.set = (k, v) => { obs.sets.push({ key: k, screen: X.state.screen, edge: obs.edgeFrame }); return realSet(k, v); };
  // Every evaluation, with which seat it came from — ⛔ the run-end seat runs
  // with the run already closed (trap 2) — and A9 / R8 checked around it.
  const realEval = X.Achievements.evaluate;
  X.Achievements.evaluate = function (facts) {
    const st = X.state;
    const before = J([st.score, st.lives, st.nextLife, st.tally]);
    const rng = st.rng;
    let draws = 0;
    st.rng = function () { draws++; return rng.apply(this, arguments); };
    let out;
    try { out = realEval.call(this, facts); } finally { st.rng = rng; }
    if (J([st.score, st.lives, st.nextLife, st.tally]) !== before || draws > 0) obs.seatMoved.push(st.screen);
    obs.evals.push({ seat: X.Meta.runOpen() ? "edge" : "end", screen: st.screen, facts, out });
    return out;
  };
  return S;
}

function makeHasher(X, skip) {
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
    if (seen.has(v)) { mixU(8); num(seen.get(v)); return; }
    seen.set(v, seen.size);
    if (Array.isArray(v)) { mixU(9); num(v.length); for (let i = 0; i < v.length; i++) walk(v[i]); return; }
    str(v.constructor ? v.constructor.name : "");
    for (const k of Object.keys(v)) { if (skip.has(k)) continue; str(k); walk(v[k]); }
  }
  return () => { h = 2166136261; seen = new Map(); walk(X.state); num(X.Game.hitStopLeft); num(X.Game.stats.ticks); return h; };
}

// test-cs014-p3.js's hunter, cut down: fire held, a Purge every 311 steps,
// steer to a ring in reach, away from a MimicShot, to a token, else to the
// deepest target; jump at anything aloft in the lane.
function drive(S, i, purge) {
  const X = S.X, st = X.state, inp = S.G.input, well = X.WELLS[st.wellIndex];
  if (i === 0) inp.keyDown(" ");
  // ⛔ ONE RUN NEVER PURGES: "clear a well with the Purge unspent" is a clear
  // edge a Purge-spending driver never reaches (plan §1.3 measured 0, 0, 0).
  if (purge && i % 311 === 0) inp.keyDown("x");
  if (purge && i % 311 === 4) inp.keyUp("x");
  const sk = st.skimmer;
  inp.keyUp("ArrowRight"); inp.keyUp("ArrowLeft");
  if (!sk || sk.dead) { inp.keyUp("arrowup"); return; }
  let d = null;
  if (st.dive.active) {
    const span = X.diveTime() - X.C.DIVE_GRACE;
    for (const r of st.dive.rings) {
      if (r.taken !== null) continue;
      const dd = X.laneDelta(well, sk.lane, r.lane);
      if (Math.abs(dd) - X.C.RING_ARC_LANES <= Math.max(0, st.dive.depth - r.depth) * span * X.C.KEY_SPEED_MAX) { d = dd; break; }
    }
  }
  let dodge = null, token = null, best = null;
  for (const e of st.enemies) {
    if (e.dead) continue;
    if (e instanceof X.MimicShot) {
      const dd = X.laneDelta(well, sk.lane, e.lane);
      if (!st.powers.ward && Math.abs(dd) <= 1) dodge = dd;
      continue;
    }
    if (e instanceof X.WeaverBolt || (e.anchored && !st.powers.lance)) continue;
    if (best === null || e.depth > best.depth) best = e;
  }
  for (const t of st.tokens) if (!t.dead && t.depth >= X.C.TOKEN_HOVER_DEPTH) token = X.laneDelta(well, sk.lane, t.lane);
  if (d === null) d = dodge !== null ? (dodge > 0 ? -1 : 1) : token !== null ? token : best !== null ? X.laneDelta(well, sk.lane, best.lane) : 0;
  if (d > 0.3) inp.keyDown("ArrowRight"); else if (d < -0.3) inp.keyDown("ArrowLeft");
  const aloft = st.enemies.some(e => !e.dead && e.aloft && Math.abs(X.laneDelta(well, e.lane, sk.lane)) <= X.C.HIT_LANE_TOL);
  if (aloft && !st.powers.ward) inp.keyDown("arrowup"); else inp.keyUp("arrowup");
}

// A run's forced end, when the cap arrives first — identical in every twin.
function forceDeath(S) {
  const st = S.X.state;
  if (st.screen !== "play") return;
  st.powers.ward = false;
  st.lives = 1;
  st.invulnTime = S.C.RESPAWN_INVULN;
  if (st.skimmer && !st.skimmer.dead) S.X.killSkimmer(st);
  S.settle();
}

// ONE PLAYED SESSION: four runs, every step hashed and every counter watched.
//   A  Classic, Start Depth 1 — then PAUSE → QUIT TO TITLE (the 'quit' seat)
//   B  Overdrive, Start Depth 11 — the Warden, rings, tokens, the Jump
//   C  Classic, Start Depth 23 — Carriers of every cargo, Weavers, Thorns
//   D  ⛔ a BENCH run: a spawn digit pressed in play (A4)
// ⛔ RUN A IS SHORT AND ENDS BEFORE A CLEAR, deliberately: an id unlocks ONCE
// EVER, so the only way the run-END seat can be seen unlocking is for the first
// run of a fresh store to end with no clear edge behind it.
const RUNS = [
  { mode: "classic", depth: 1, steps: 420, end: "quit" },
  { mode: "overdrive", depth: 11, steps: 9000, end: "died" },
  { mode: "classic", depth: 23, steps: 6000, end: "died", purge: false },
  { mode: "classic", depth: 1, steps: 2600, end: "died", bench: true },
];

function session(o) {
  const S = build(o), X = S.X, st = X.state, C = X.C;
  const hash = makeHasher(X, o.skip || new Set());
  const bit = new Map(Object.keys(C.TOKEN_WEIGHTS).map((k, i) => [k, i]));
  const out = { hashes: [], bad: {}, want: {}, runs: [], exceptions: [] };
  const bad = (k, i) => { if (out.bad[k] === undefined) out.bad[k] = i; };
  const add = (k, n) => { out.want[k] = (out.want[k] || 0) + n; };

  // per-step observers, each on the one call already at the counter's place
  let site = null, step = null;
  X.collideSkimmer.before = () => { site = "sweep"; };
  X.collideSkimmer.after = () => { site = null; };
  X.jumpStrike.before = () => { site = "jump"; };
  X.jumpStrike.after = () => { site = null; };
  X.dropToken.before = (s, e) => {          // ⛔ on all five kill lines, and only there
    step.kills.push(e);
    if (site === "sweep") step.sweep++;
    if (site === "jump") step.jump++;
    if (e instanceof X.Mimic) step.mimic++;
  };
  X.addScore.before = n => { if (n === C.PTS_THORN) step.chips++; };
  X.clearBonuses.before = () => {
    S.obs.edgeFrame = true;
    step.edges++;
    if (!st.diedThisWell) step.deathless++;
    if (st.purgeUses === 0) step.saved++;
    if (!X.WELLS[st.wellIndex].closed) step.open++;
  };
  X.collectToken.before = (s, t) => { step.kinds.add(t.kind); };
  // Carrier lineage, independently of `brood`: the entities one split appends.
  const siblings = new Map();
  const realShot = X.Carrier.prototype.onShot;
  X.Carrier.prototype.onShot = function (shot) {
    const n0 = st.enemies.length;
    const r = realShot.call(this, shot);
    if (st.enemies.length - n0 === 2) {
      const pair = { a: st.enemies[n0], b: st.enemies[n0 + 1], dead: 0 };
      siblings.set(pair.a, pair); siblings.set(pair.b, pair);
    }
    return r;
  };

  S.boot();
  let i = 0;
  for (const run of RUNS) {
    S.reset();
    X.startGame((SEED + i) >>> 0, { mode: run.mode, startDepth: run.depth });
    let mask = 1 << st.wellIndex, kinds = new Set();
    const rec = { mode: run.mode, bench: !!run.bench, evals0: S.obs.evals.length, sets0: S.obs.sets.length,
                  edges: 0, eligible: true };
    for (let n = 0; n < run.steps && st.screen === "play"; n++, i++) {
      if (run.bench && n === 60) { S.G.input.keyDown("1"); }
      if (run.bench && n === 62) { S.G.input.keyUp("1"); }
      drive(S, n, run.purge !== false);
      step = { kills: [], sweep: 0, jump: 0, mimic: 0, chips: 0, edges: 0, deathless: 0, saved: 0, open: 0, kinds };
      const t0 = Object.assign({}, st.tally), lives0 = st.lives;
      const rings = st.dive.rings.map(r => ({ r, taken: r.taken }));
      try { S.liveStep(); } catch (e) { out.exceptions.push(`${i}: ${e.message}`); break; }
      out.hashes.push(hash());
      const t = st.tally, d = k => t[k] - t0[k];
      rec.edges += step.edges;
      mask |= 1 << st.wellIndex;
      // the counters, each against its own place
      if (d("thornChips") !== step.chips) bad("thornChips", i);
      if (d("deathlessWells") !== step.deathless) bad("deathlessWells", i);
      if (d("purgeSavedClears") !== step.saved) bad("purgeSavedClears", i);
      if (d("openWellsCleared") !== step.open) bad("openWellsCleared", i);
      if (d("wellsCleared") !== step.edges) bad("wellsCleared", i);
      if (d("rimSweepKills") !== step.sweep) bad("rimSweepKills", i);
      if (d("jumpKills") !== step.jump) bad("jumpKills", i);
      if (d("mimicKills") !== step.mimic) bad("mimicKills", i);
      if (d("extraLives") !== (st.lives - lives0) + d("deaths")) bad("extraLives", i);
      if (t.wellsSeenMask !== mask) bad("wellsSeenMask", i);
      if (X.C && [...kinds].some(k => !(t.tokenKindsMask & (1 << bit.get(k))))) bad("tokenKindsMask", i);
      if (t.tokenKindsMask >>> 0 !== [...kinds].reduce((m, k) => m | (1 << bit.get(k)), 0) >>> 0) bad("tokenKindsMask", i);
      const took = rings.filter(x => x.taken === null && x.r.taken === true).length;
      if (d("ringsTaken") !== took) bad("ringsTaken", i);
      const full = d("divesCompleted") === 1 && rings.length > 0 && rings.every(x => x.r.taken === true);
      if (d("ringSetsTaken") !== (full ? 1 : 0)) bad("ringSetsTaken", i);
      let splits = 0;
      for (const e of step.kills) { const p = siblings.get(e); if (p && ++p.dead === 2) splits++; }
      if (d("carrierSplits") !== splits) bad("carrierSplits", i);
      for (const [k, v] of [["chips", step.chips], ["edges", step.edges], ["deathless", step.deathless],
                            ["saved", step.saved], ["open", step.open], ["sweep", step.sweep], ["jump", step.jump],
                            ["mimic", step.mimic], ["took", took], ["full", full ? 1 : 0], ["splits", splits],
                            ["extra", d("extraLives")]]) add(k, v);
    }
    if (run.end === "quit" && st.screen === "play") {
      // ⛔ THE DRIVER HOLDS FIRE: a menu press is an EDGE, so every key it
      // holds is released before the pause menu is touched.
      for (const k of [" ", "x", "arrowup", "ArrowRight", "ArrowLeft"]) S.G.input.keyUp(k);
      S.liveStep(); S.liveStep();
      S.press("Escape");
      S.right(2);
      S.press(" ");                                  // QUIT TO TITLE
      rec.quitTo = st.screen;
    } else {
      forceDeath(S);
    }
    add("tokenKinds", kinds.size);
    rec.evals = S.obs.evals.slice(rec.evals0);
    rec.sets = S.obs.sets.slice(rec.sets0);
    rec.tally = Object.assign({}, st.tally);
    rec.screen = st.screen;
    out.runs.push(rec);
  }
  out.S = S;
  return out;
}

// ===========================================================================
// 1. ⛔ NO BASELINE MOVES
// ===========================================================================

{
  const root = path.join(__dirname, "..");
  const child = execFileSync(process.execPath, [path.join(__dirname, "test-cs005-p5.js"), "--hash-only"],
                             { cwd: root, encoding: "utf8", stdio: "pipe" }).trim();
  H.eq(Number(child), 1229033515, "⛔ P1_DETERMINISM_HASH is unmoved: 1229033515 (test-cs006-p2.js's child)");
  let lanes = "red";
  try {
    const o = execFileSync(process.execPath, [path.join(__dirname, "test-cs004-p1.js")],
                           { cwd: root, encoding: "utf8", stdio: "pipe" });
    if (/^ok /m.test(o)) lanes = "green";
  } catch (e) { lanes = "red"; }
  H.eq(lanes, "green", "⛔ GOLDEN_LANES is unmoved: test-cs004-p1.js is green");
}

const real = session({});
const noSeats = session({ mutate: [SEAT_EDGE, SEAT_END] });
const SKIP = new Set(["tally", "brood"]);
const realSkip = session({ skip: SKIP });
const noCounters = session({ mutate: COUNTERS_OUT, stub: ["tallyKill"], skip: SKIP });

H.eq(J(real.exceptions), "[]", "no exception in the played session");
H.assert(real.hashes.length > 8000, `fixture: the session is long (${real.hashes.length} steps)`);
{
  const first = (a, b) => { const n = Math.max(a.length, b.length); for (let k = 0; k < n; k++) if (a[k] !== b[k]) return k; return -1; };
  H.eq(first(real.hashes, noSeats.hashes), -1,
       "⛔ THE SEATS MOVE NOTHING: the whole state hashes identically on every step against both seats mutated out");
  H.eq(first(realSkip.hashes, noCounters.hashes), -1,
       "⛔ NOTHING BRANCHES ON A COUNTER: every step hashes identically with all thirteen written out (tally and brood excluded)");
  const writes = r => r.runs.map(x => x.sets.filter(s => s.key === "achievements").length).join(",");
  H.assert(writes(real) !== writes(noSeats), `non-vacuity: the seats DID write in the real session (${writes(real)} vs ${writes(noSeats)})`);
}

// ===========================================================================
// 2. each counter counts its own event at its own place (the played session)
// ===========================================================================

H.eq(J(real.bad), "{}", "⛔ every new counter moved by exactly its own event, on every step (first bad step per counter)");
H.eq(J(NEW_FIELDS.filter(k => !(k in real.S.X.state.tally))), "[]", "the thirteen fields are in newState()'s tally");
H.eq(J(NEW_FIELDS.map(k => real.S.X.newState().tally[k])), J(NEW_FIELDS.map(() => 0)), "and each starts a run at 0");
// ⛔ The rare ones — the rim sweep, the jump strike, the Mimic — are STAGED
// below rather than hoped for here: a played board reaches them by luck (plan
// §1.3 measured a rim-sweep kill 0, 0 and 6 across three sessions).
for (const k of ["chips", "edges", "deathless", "saved", "open", "took", "full", "splits", "extra", "tokenKinds"]) {
  H.assert((real.want[k] || 0) > 0, `non-vacuity: the session observed ${k} (${real.want[k] || 0})`);
}
console.log(`  observed: ${J(real.want)}`);

// ===========================================================================
// 3. the seats: once per event, eligible runs only, the payload, the bench
// ===========================================================================

{
  const [A, B, C3, D] = real.runs;
  H.eq(A.quitTo, "title", "fixture: run A quit from pause to the title");
  H.eq(B.screen, "gameover", "fixture: run B ended on game over");
  for (const r of [A, B, C3]) {
    const edge = r.evals.filter(e => e.seat === "edge"), end = r.evals.filter(e => e.seat === "end");
    H.eq(edge.length, r.edges, `⛔ the clear-edge seat fires ONCE PER CLEAR (${r.mode}, ${r.edges} clears)`);
    H.eq(end.length, 1, `⛔ the run-end seat fires ONCE (${r.mode}), reading \`ok\` — not eligible(), already false there`);
    H.assert(edge.every(e => e.screen === "play" || e.screen === "gameover"), "the clear edge is a play step");
    H.assert(end.every(e => e.screen !== "play"), "the run's end is not a play step");
  }
  H.eq(A.edges, 0, "fixture: run A ended before any clear edge, so its ONLY evaluation is the run's end");
  H.assert(B.edges > 0 && C3.edges > 0, `non-vacuity: the long runs cleared (${B.edges}, ${C3.edges})`);
  H.eq(D.evals.length, 0, "⛔ A BENCH RUN REACHES NEITHER SEAT (A4-A): no evaluation at any clear edge or at its end");
  H.eq(D.sets.filter(s => s.key === "achievements").length, 0, "⛔ and writes no `achievements`");
  H.assert(D.edges > 0, `non-vacuity: the bench run DID clear wells (${D.edges}) — only the gate differs`);
  H.eq(J(real.S.obs.seatMoved), "[]", "⛔ an evaluation moves no score, life or tally and spends no draw (A9-A, R8)");

  // the payload (A11)
  const unlocks = real.S.obs.evals.flatMap(e => e.out);
  H.assert(unlocks.length > 0, `non-vacuity: the session unlocked (${unlocks.length})`);
  H.assert(unlocks.every(u => J(Object.keys(u)) === J(["id", "tier", "weekKey", "at"])), "⛔ every unlock is { id, tier, weekKey, at } (A11)");
  H.assert(unlocks.every(u => Number.isInteger(u.tier) && Number.isFinite(u.at)), "tier and at are numbers");
  H.assert(unlocks.some(u => u.weekKey === null) && unlocks.some(u => /^\d{4}-W\d\d$/.test(u.weekKey)),
           "a lifetime unlock carries weekKey null, a weekly one the ISO week");
  const edgeUnlocks = real.S.obs.evals.filter(e => e.seat === "edge").flatMap(e => e.out);
  const endUnlocks = real.S.obs.evals.filter(e => e.seat === "end").flatMap(e => e.out);
  H.assert(edgeUnlocks.length > 0 && endUnlocks.length > 0, `non-vacuity: both seats unlocked (${edgeUnlocks.length}, ${endUnlocks.length})`);
  // ⛔ REWRITTEN IN PLACE AT CS015 P3: the claim is unchanged and it is now
  // made against the SHIPPED tags rather than one planted row — a Classic run
  // unlocks nothing tagged `overdrive`, and the Overdrive run unlocks at least
  // one row that is.
  const tagOf = (() => {
    const m = {};
    for (const r of real.S.C.ACHIEVEMENTS.lifetime.concat(real.S.C.ACHIEVEMENTS.weekly)) m[r.id] = r.mode;
    return id => m[id];
  })();
  H.assert(B.evals.some(e => e.out.some(u => tagOf(u.id) === "overdrive")),
           "non-vacuity: the Overdrive run unlocked a row tagged `overdrive`");
  H.assert(!A.evals.concat(C3.evals).some(e => e.out.some(u => tagOf(u.id) === "overdrive")),
           "⛔ the mode tag holds at the seat: a Classic run unlocks no `overdrive` row");

  // the facts object
  const f = B.evals[B.evals.length - 1].facts;
  H.eq(f.mode, "overdrive", "the facts carry the run's mode");
  H.assert(Object.keys(f).every(k => k === "mode" || Number.isFinite(f[k])), "⛔ every other fact is a finite number");
  H.eq(f.wellsSeen, (() => { let c = 0; for (let v = B.tally.wellsSeenMask; v; v >>>= 1) c += v & 1; return c; })(),
       "wellsSeen is the mask's bit count");
  H.assert(f.wellsSeen >= 2, `non-vacuity: run B saw more than one well (${f.wellsSeen})`);
  for (const k of NEW_FIELDS.filter(k => !/Mask$/.test(k))) H.eq(f[k], B.tally[k], `the run-end facts read tally.${k}`);
}

// ===========================================================================
// 4. ⛔ NO STORAGE WRITE ON A PLAY STEP THAT IS NOT THE CLEAR EDGE (plan §1.4)
// ===========================================================================

{
  const sets = real.S.obs.sets;
  const stray = sets.filter(s => s.screen === "play" && !s.edge);
  H.eq(J(stray.map(s => s.key)), "[]", "⛔ no storage write on a play step that is not the clear edge");
  H.assert(sets.some(s => s.key === NS + "achievements" || s.key === "achievements"),
           "non-vacuity: the spy saw `achievements` writes");
  const ach = sets.filter(s => s.key === "achievements");
  H.assert(ach.some(s => s.screen === "play" && s.edge), "one of them at a clear edge, on a play step");
  H.assert(ach.some(s => s.screen !== "play" && !s.edge), "and one at a run's end, off play");
}

// ===========================================================================
// 5. the rare counters, staged at their place
// ===========================================================================

function quiet(level, mode) {
  const S = build({}), X = S.X, st = X.state;
  S.boot(); S.reset();
  X.startGame(SEED, { mode: mode || "classic", startDepth: level });
  st.spawn.remaining = 0; st.spawn.timer = -1e9;
  st.enemies = []; st.shots = [];
  return { S, X, st, well: X.WELLS[st.wellIndex] };
}
{
  // the rim sweep: a parked Vaulter in the craft's lane, fire held
  const { X, st, well } = quiet(5);
  const v = new X.Vaulter(st.skimmer.lane, 1 - X.C.RIM_CONTACT_DEPTH, 1);
  st.enemies.push(v);
  st.input.fire = true; st.invulnTime = X.C.RESPAWN_INVULN;
  X.collideSkimmer(st, well);
  H.eq(v.dead, true, "fixture: the sweep killed it");
  H.eq(J([st.tally.rimSweepKills, st.tally.kills]), "[1,1]", "⛔ rimSweepKills counts the sweep's kill, beside tally.kills");
}
{
  // the jump strike: an aloft Warden in the lane, the craft airborne
  const { X, st, well } = quiet(11, "overdrive");
  const w = new X.Warden(st.skimmer.lane, 1, 1);
  w.setPhase("hover");
  st.enemies.push(w);
  st.jump.phase = "air";
  X.jumpStrike(st, well);
  H.eq(w.dead, true, "fixture: the strike killed the Warden");
  H.eq(J([st.tally.jumpKills, st.tally.kills]), "[1,1]", "⛔ jumpKills counts the jump strike's kill");
}
{
  // the Mimic: both Purge uses, and a MimicShot that is not one
  const { X, st, well } = quiet(16, "overdrive");
  st.enemies.push(new X.Mimic(0, 0.3), new X.MimicShot(1, 0.5), new X.Mimic(2, 0.2));
  st.input.purge = true; X.updatePurge(st); st.input.purge = false; X.updatePurge(st);
  H.eq(J([st.tally.mimicKills, st.tally.kills]), "[2,3]", "⛔ the first Purge: two Mimics count, the MimicShot does not");
  st.enemies = [new X.Mimic(0, 0.3)];
  st.input.purge = true; X.updatePurge(st);
  H.eq(st.tally.mimicKills, 3, "⛔ and the second Purge's one victim counts too");
}
{
  // a Carrier split: both children destroyed; one child; a Purged hull
  const { X, st, well } = quiet(9);
  const c = new X.Carrier(4, 0.5, "vaulter");
  st.enemies.push(c);
  c.onShot(null);
  const kids = st.enemies.filter(e => e !== c);
  H.eq(kids.length, 2, "fixture: the split spawned two");
  H.assert(kids[0].brood === kids[1].brood && kids[0].brood.left === 2, "the two share one brood");
  st.input.purge = true; X.updatePurge(st);
  H.eq(st.tally.carrierSplits, 1, "⛔ carrierSplits counts a Carrier whose BOTH children the player destroyed");
  st.input.purge = false; X.updatePurge(st);
  const c2 = new X.Carrier(4, 0.5, "vaulter");
  st.enemies = [c2]; c2.onShot(null);
  st.input.purge = true; X.updatePurge(st);        // the SECOND use: one victim
  H.eq(st.tally.carrierSplits, 1, "⛔ one child of two is not a split");
  st.enemies = [new X.Carrier(4, 0.5, "vaulter")];
  st.input.purge = false; X.updatePurge(st); st.input.purge = true;
  X.enterWell(); st.enemies = [new X.Carrier(4, 0.5, "vaulter")]; X.updatePurge(st);
  H.eq(st.tally.carrierSplits, 1, "⛔ a Purged Carrier never splits, so it is not one");
  // ⛔ a child refused at C.ENEMY_CAP: no pair, no brood
  st.enemies = [];
  for (let n = 0; n < X.C.ENEMY_CAP - 1; n++) st.enemies.push(new X.Vaulter(0, 0.1, 1));
  const c3 = new X.Carrier(4, 0.5, "vaulter");
  st.enemies.push(c3); c3.onShot(null);
  H.eq(st.enemies.filter(e => e.brood).length, 0, "⛔ a split the cap cut short carries no brood");
}
{
  // an extra life: awarded counts, refused at C.LIVES_MAX does not
  const { X, st } = quiet(1);
  st.lives = 2;
  X.addScore(st.nextLife - st.score);
  H.eq(J([st.lives, st.tally.extraLives]), "[3,1]", "⛔ extraLives counts an AWARDED life");
  st.lives = X.C.LIVES_MAX;
  X.addScore(st.nextLife - st.score);
  H.eq(J([st.lives, st.tally.extraLives]), J([X.C.LIVES_MAX, 1]), "⛔ and not one refused at the cap");
}
{
  // a Lance chip is three chips of length, three counts
  const { X, st } = quiet(5);
  const t = new X.Thorn(3, 0.6);
  st.enemies.push(t);
  t.onShot({ pierce: false });
  H.eq(st.tally.thornChips, 1, "⛔ thornChips: one per chip");
  t.onShot({ pierce: true });
  H.eq(st.tally.thornChips, 1 + X.C.LANCE_CHIP_MULT, "⛔ and a Lance chip is LANCE_CHIP_MULT chips of length");
}

// ===========================================================================
// 6. mutations: each seat, and the gate
// ===========================================================================

// A compact probe: one eligible clear and death, then one bench clear and death.
function seatProbe(mutate) {
  const S = build({ mutate }), X = S.X, st = X.state;
  S.boot();
  const stage = () => {
    S.reset(); X.startGame(SEED);
    st.spawn.remaining = 0; st.spawn.timer = -1e9; st.enemies = []; st.shots = [];
  };
  stage();
  S.liveStep();
  const edge = S.obs.evals.filter(e => e.seat === "edge").length;
  forceDeath(S);
  const end = S.obs.evals.filter(e => e.seat === "end").length;
  const n0 = S.obs.evals.length;
  stage();
  S.press("1");
  st.enemies = [];
  for (let k = 0; k < 4 && st.tally.wellsCleared === 0; k++) S.liveStep();
  forceDeath(S);
  return { edge, end, bench: S.obs.evals.length - n0, benchCleared: st.tally.wellsCleared };
}
{
  const p = seatProbe([]);
  H.eq(J([p.edge, p.end, p.bench]), "[1,1,0]", "the probe: one clear-edge evaluation, one run-end, none for the bench run");
  H.assert(p.benchCleared > 0, "fixture: the probe's bench run cleared");
  H.eq(seatProbe([SEAT_EDGE]).edge, 0, "⛔ mutation: the clear-edge seat out is seen (the count above is red)");
  H.eq(seatProbe([["    if (booted && ok) sounded(Achievements.evaluate(facts(runEndFacts())));", "    if (booted && eligible()) sounded(Achievements.evaluate(facts(runEndFacts())));"]]).end, 0,
       "⛔ mutation: eligible() in place of `ok` evaluates NO run's end — every run silently ineligible (red)");
  H.eq(seatProbe([["    if (!booted || !eligible()) return null;", "    if (!booted) return null;"]]).bench, 1,
       "⛔ mutation: the gate dropped from the clear edge lets the bench run evaluate (red)");
  const src = real.S.X && H.extractScript(require("fs").readFileSync(path.join(__dirname, "..", "dist", "vector-vortex.html"), "utf8"));
  H.eq(src.split(GATE).length - 1, 1, "⛔ the gate's body is unchanged and in the build exactly once (test-cs011-p3.js's GATE)");
}

H.report();
