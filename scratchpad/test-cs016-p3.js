// test-cs016-p3.js — CS016 P3: the pre-ship achievement pass (GDD 15.5, 17
// item 10; plan §5, N12 as answered). The two write-only counters count on a
// staged board — a token taken; a Thorn shot to nothing by plain shots and by a
// Lance — and nowhere else (a chip that leaves length, the Purge, a token not
// taken); the per-well facts are deltas that reset at the clear edge; the two
// new rows unlock from a staged clear off the REAL seat; `cleanDives` is gated
// to 0 by a Thorn death; the table is N12's answer (ids, names, notes, tiers,
// the cut row, the pool 19 and `perWeek` 5); the rotation over 104 weeks
// reaches every entry and spends no draw; and a Classic session (plus an
// Overdrive one, where tokens exist) hashes identically on every step against
// both counter lines mutated out.
// ⛔ TRAPS. 1. `facts()` lives in Meta's closure: the clear-edge seat is
//     MUTATED to publish its object (test-cs015-p3.js's string).
//  2. A weekly row unlocks only in a week that holds it: the staged clear runs
//     in the first week, found by search, whose five hold BOTH new rows.
//  3. The hash skips exactly the two counters: `tally` differs by construction.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260925;
installSeed(SEED);                          // ⛔ above the first buildGame()

const J = JSON.stringify;
const DAY = 86400000;
const BASE = Date.UTC(2026, 8, 21, 12);     // Monday noon UTC, 2026-W39

const SEAT_CLEAR = ["    return sounded(Achievements.evaluate(facts(win)));",
  "    { const _f = facts(win); globalThis.__seat(\"clear\", _f); return sounded(Achievements.evaluate(_f)); }"];
const TOK_LINE = "      state.tally.tokensCollected++;\n";
const THORN_LINE = "      state.tally.thornsDestroyed++;\n";
const COUNTERS_OUT = [[TOK_LINE, "\n"], [THORN_LINE, "\n"]];

function build(o) {
  installSeed(SEED);
  const clock = { base: (o && o.base) || BASE, t: 0 };
  Date.now = () => clock.base + clock.t;    // wall time: a read does not advance it
  const X = H.buildGame(Object.assign({ store: new Map() }, o || {}));
  X.clock = clock;
  return X;
}

function quiet(X, level, mode) {
  const st = X.state;
  X.Game.reset();
  X.startGame(SEED, { mode: mode || "classic", startDepth: level });
  st.spawn.remaining = 0; st.spawn.timer = -1e9;
  st.enemies = []; st.shots = []; st.tokens = [];
  return { st, well: X.WELLS[st.wellIndex] };
}

// A shot at exactly the Thorn's tip, in its lane, through the real collision pass.
function shoot(X, st, well, thorn, pierce) {
  const s = new X.Shot(well, thorn.lane, pierce);
  s.t = (1 - thorn.depth) * X.C.SHOT_TIME;
  st.shots = [s];
  X.collideShots(st, well);
  st.shots = [];
  st.enemies = st.enemies.filter(e => !e.dead);
}

function token(X, st, lane, over) {
  return Object.assign({ kind: Object.keys(X.C.TOKEN_WEIGHTS)[0], lane, depth: X.C.TOKEN_HOVER_DEPTH,
                         age: 0, dead: false, collected: false }, over || {});
}

const X0 = build();
const C = X0.C;

// ===========================================================================
// 1. the two counters, on a staged board, and nowhere else
// ===========================================================================

// -- tokensCollected: updateTokens()'s pickup ---------------------------------
{
  const X = build();
  const { st, well } = quiet(X, 5, "overdrive");
  const lane = st.skimmer.lane, far = X.laneNormalize(well, lane + Math.floor(well.lanes / 2));
  H.eq(st.tally.tokensCollected, 0, "fixture: a run starts at zero");
  st.tokens = [token(X, st, far), token(X, st, lane, { depth: C.TOKEN_HOVER_DEPTH / 2 })];
  X.updateTokens(st, well, C.FIXED_DT);
  H.eq(st.tally.tokensCollected, 0, "⛔ a token in another lane, or still rising, is not collected and not counted");
  st.tokens = [token(X, st, lane)];
  X.updateTokens(st, well, C.FIXED_DT);
  H.eq(st.tally.tokensCollected, 1, "⛔ a token taken at the rim counts ONE");
  H.assert(st.tally.tokenKindsMask !== 0, "and beside the kind mask, which moved with it");
  st.tokens = [token(X, st, lane, { age: C.TOKEN_LIFE })];
  X.updateTokens(st, well, C.FIXED_DT);
  H.eq(st.tally.tokensCollected, 1, "⛔ a token that EXPIRES in the lane is not counted");
  st.tokens = [token(X, st, lane), token(X, st, lane)];
  X.updateTokens(st, well, C.FIXED_DT);
  H.eq(st.tally.tokensCollected, 3, "two taken on one step count two");
}

// -- thornsDestroyed: Thorn.chip()'s own `dead` edge --------------------------
{
  const X = build();
  const { st, well } = quiet(X, 9);
  const lane = st.skimmer.lane;
  const t = new X.Thorn(lane, 1.5 * C.THORN_CHIP);
  st.enemies = [t];
  const chips0 = st.tally.thornChips, kills0 = st.tally.kills;
  shoot(X, st, well, t, false);
  H.eq(t.dead, false, "fixture: one plain shot leaves half a chip of length");
  H.eq(st.tally.thornChips - chips0, 1, "fixture: and chipped once");
  H.eq(st.tally.thornsDestroyed, 0, "⛔ a chip that leaves length destroys nothing and counts nothing");
  shoot(X, st, well, t, false);
  H.eq(t.dead, true, "fixture: the second shot takes it to nothing");
  H.eq(st.tally.thornsDestroyed, 1, "⛔ shot to nothing by plain shots: ONE");
  H.eq(st.tally.kills - kills0, 1, "and the kill site's own counter moved once, unchanged");

  // Lance: C.LANCE_CHIP_MULT chips in one hit.
  const L = new X.Thorn(lane, (C.LANCE_CHIP_MULT - 0.5) * C.THORN_CHIP);
  st.enemies = [L];
  shoot(X, st, well, L, true);
  H.eq(L.dead, true, "fixture: one Lance shot takes a short Thorn to nothing");
  H.eq(st.tally.thornsDestroyed, 2, "⛔ shot to nothing by a LANCE: ONE more, not one per chip");
  const long = new X.Thorn(lane, (C.LANCE_CHIP_MULT + 1) * C.THORN_CHIP);
  st.enemies = [long];
  shoot(X, st, well, long, true);
  H.eq(long.dead, false, "fixture: a Lance shot leaves a long Thorn standing");
  H.eq(st.tally.thornsDestroyed, 2, "⛔ and counts nothing");

  // ⛔ NOWHERE ELSE: both Purge uses leave a Thorn standing (GDD 4.3).
  const p = new X.Thorn(lane, 0.3);
  st.enemies = [p];
  for (let n = 0; n < 2; n++) {
    st.input.purge = true; X.updatePurge(st);
    st.input.purge = false; X.updatePurge(st);
  }
  H.eq(st.purgeUses, 2, "fixture: both Purge uses spent");
  H.eq(p.dead, false, "fixture: the Purge does not remove a Thorn");
  H.eq(st.tally.thornsDestroyed, 2, "⛔ the Purge counts no Thorn");
}

// -- each counter has ONE writer, on no kill line ------------------------------
{
  const src = require("fs").readFileSync(require("path").join(__dirname, "..", "dist", "vector-vortex.html"), "utf8");
  const count = (s, sub) => s.split(sub).length - 1;
  H.eq(count(src, "tally.tokensCollected"), 1, "⛔ tokensCollected has ONE writer in the build");
  H.eq(count(src, "tally.thornsDestroyed"), 1, "⛔ thornsDestroyed has ONE writer in the build");
  const lineOf = sub => src.split("\n").find(l => l.includes(sub)) || "";
  for (const sub of ["tally.tokensCollected", "tally.thornsDestroyed"]) {
    const l = lineOf(sub);
    H.assert(!/addScore|tallyKill|comboKill|dropToken/.test(l), `⛔ ${sub} sits on no kill line (${J(l.trim())})`);
  }
  // The Thorn's writer is inside chip()'s `dead` branch.
  const i = src.indexOf(THORN_LINE);
  H.assert(i > 0 && src.slice(i - 200, i).includes("this.dead = true;"), "⛔ thornsDestroyed follows chip()'s own `dead = true`");
  const k = src.indexOf(TOK_LINE);
  H.assert(k > 0 && src.slice(Math.max(0, k - 200), k).includes("tokenKindsMask |="), "⛔ tokensCollected sits beside the kind mask");
}

// ===========================================================================
// 2. the per-well facts, the new rows off the real seat, and cleanDives
// ===========================================================================
{
  // TRAP 2: the first week whose five hold both new rows.
  let base = null;
  for (let w = 0; w < 400 && base === null; w++) {
    Date.now = () => BASE + w * 7 * DAY;
    const five = X0.Achievements.weeklyFor(X0.Achievements.weekKey());
    if (five.indexOf("week_token_trio") >= 0 && five.indexOf("week_thorn_gone") >= 0) base = BASE + w * 7 * DAY;
  }
  H.assert(base !== null, "fixture: some week's five hold both new rows");

  const X = build({ base: base || BASE, mutate: [SEAT_CLEAR] });
  const seen = [];
  globalThis.__seat = (which, f) => seen.push(Object.assign({}, f));
  X.Game.frame(0);
  const { st, well } = quiet(X, 5, "overdrive");
  const lane = st.skimmer.lane;
  st.tokens = [token(X, st, lane), token(X, st, lane), token(X, st, lane)];
  X.updateTokens(st, well, C.FIXED_DT);
  const t = new X.Thorn(lane, 0.5 * C.THORN_CHIP);
  st.enemies = [t];
  shoot(X, st, well, t, false);
  // A second Thorn CHIPPED and left standing: the window counts Thorns, not chips.
  const stand = new X.Thorn(lane, 3 * C.THORN_CHIP);
  st.enemies = [stand];
  shoot(X, st, well, stand, false);
  H.eq(stand.dead, false, "fixture: a chipped Thorn still stands in this well");
  st.enemies = [];
  H.eq(st.tally.tokensCollected, 3, "fixture: three tokens taken in this well");
  H.eq(st.tally.thornsDestroyed, 1, "fixture: one Thorn shot to nothing in this well");

  const out = X.Meta.clearEdge() || [];
  const f1 = seen[seen.length - 1] || {};
  H.eq(f1.wellTokens, 3, "⛔ the clear edge reads wellTokens 3");
  H.eq(f1.wellThornsCleared, 1, "⛔ and wellThornsCleared 1 — two chips, one Thorn gone");
  H.assert(out.some(u => u.id === "week_token_trio" && u.weekKey !== null),
           `⛔ STAGED: TOKEN TRIO unlocks from the real clear-edge seat (${J(out.map(u => u.id))})`);
  H.assert(out.some(u => u.id === "week_thorn_gone" && u.weekKey !== null),
           "⛔ STAGED: THORN CLEARED unlocks from the same clear");

  // ⛔ THE WINDOW RESETS AT THE CLEAR EDGE: the next clear, with nothing taken.
  X.Meta.clearEdge();
  const f2 = seen[seen.length - 1] || {};
  H.eq(f2.wellTokens, 0, "⛔ the next well's window starts at 0 tokens — a DELTA, not the run's total");
  H.eq(f2.wellThornsCleared, 0, "⛔ and at 0 Thorns");
  H.eq(st.tally.tokensCollected, 3, "while the run's counter keeps its total");
  st.tokens = [token(X, st, lane)];
  X.updateTokens(st, well, C.FIXED_DT);
  X.Meta.clearEdge();
  H.eq((seen[seen.length - 1] || {}).wellTokens, 1, "and the window after it counts only its own");

  // ⛔ cleanDives: divesCompleted on a run with no Thorn death, else 0.
  st.tally.divesCompleted = 7; st.tally.thornDeaths = 0;
  X.Meta.clearEdge();
  H.eq((seen[seen.length - 1] || {}).cleanDives, 7, "⛔ cleanDives is the run's dives while no Thorn has killed");
  st.tally.thornDeaths = 1;
  X.Meta.clearEdge();
  H.eq((seen[seen.length - 1] || {}).cleanDives, 0, "⛔ and 0 once one has — a conjunction gated by its other half");
  H.assert(seen.every(f => !("leanClear" in f)), "⛔ `leanClear` is no longer built: its row was cut");
}

// ===========================================================================
// 3. the table is N12's answer
// ===========================================================================
{
  const A = C.ACHIEVEMENTS;
  const life = A.lifetime, pool = A.weekly;
  // ⛔ NO ID RENAMED, NO LIFETIME ROW DELETED: CS015's 23, in order.
  H.eq(J(life.map(r => r.id)), J(["wells_cleared", "kills_total", "depth_reached", "score_run", "thorn_chips",
    "deathless_wells", "dives_done", "rings_taken", "purge_saver", "first_well", "open_well", "all_wells",
    "start_deep", "dim_band", "extra_life", "lives_full", "carrier_split", "rim_sweep", "combo_max",
    "token_set", "ring_full", "jump_kill", "mimic_kill"]), "⛔ the 23 lifetime ids, unrenamed and none deleted");
  H.eq(J(pool.map(r => r.id)), J(["week_five_wells", "week_low_start_deep", "week_clean_streak",
    "week_four_rings", "week_combo_four", "week_brood", "week_open_clean", "week_purge_held",
    "week_warden_clean", "week_two_sets", "week_last_life", "week_score_50k", "week_forty_kills",
    "week_full_set", "week_deep_first", "week_quiet_well", "week_no_thorn_death",
    "week_token_trio", "week_thorn_gone"]), "⛔ the pool: CS015's 18 less `week_lean_well`, plus the two new rows");
  H.eq(pool.length, 19, "⛔ the pool is 19 (N12: 18 - 1 + 2)");
  H.eq(A.perWeek, 5, "⛔ perWeek is still 5");
  H.assert(!("wellShotPar" in A), "⛔ the shot par left with its row");

  const row = id => life.concat(pool).find(r => r.id === id) || {};
  H.eq(J(row("depth_reached").tiers), J([10, 25, 99]), "⛔ depth_reached's tiers are [10, 25, 99] (N12)");
  H.eq(row("dim_band").at, 65, "⛔ dim_band keeps 65, so the two no longer share a predicate");
  H.assert(row("depth_reached").tiers.indexOf(row("dim_band").at) < 0, "⛔ no depth_reached tier equals dim_band's");
  const dd = row("dives_done");
  H.eq(J([dd.fact, dd.name, dd.tiers]), J(["cleanDives", "CLEAN DIVES", [5, 15, 25]]),
       "⛔ dives_done reads cleanDives, is named CLEAN DIVES, tiers [5, 15, 25] (Paul, P3: 50 MEASURED past reach)");
  const tt = row("week_token_trio"), tg = row("week_thorn_gone");
  H.eq(J([tt.name, tt.note, tt.fact, tt.at, tt.mode]),
       J(["TOKEN TRIO", "TAKE THREE TOKENS IN ONE WELL", "wellTokens", 3, "overdrive"]), "⛔ TOKEN TRIO as Paul wrote it");
  H.eq(J([tg.name, tg.note, tg.fact, tg.at, tg.mode]),
       J(["THORN CLEARED", "SHOOT A THORN DOWN TO NOTHING", "wellThornsCleared", 1, null]), "⛔ THORN CLEARED as Paul wrote it");
  for (const r of [dd, tt, tg]) H.assert(r.name.length <= 20 && r.note.length <= 60, `${r.id} fits 20 / 60`);
}

// ===========================================================================
// 4. the rotation over 104 weeks: every entry, perWeek each, no draw
// ===========================================================================
{
  const st = X0.state;
  const rng = st.rng;
  let draws = 0;
  st.rng = function () { draws++; return rng.apply(this, arguments); };
  const touched = new Set();
  let bad = 0;
  for (let w = 0; w < 104; w++) {
    Date.now = () => BASE + w * 7 * DAY;
    const key = X0.Achievements.weekKey();
    const five = X0.Achievements.weeklyFor(key);
    if (five.length !== C.ACHIEVEMENTS.perWeek || new Set(five).size !== five.length) bad++;
    if (J(X0.Achievements.weeklyFor(key)) !== J(five)) bad++;
    five.forEach(id => touched.add(id));
  }
  st.rng = rng;
  H.eq(bad, 0, "⛔ every week shows perWeek distinct rows, the same on every call");
  H.eq(touched.size, C.ACHIEVEMENTS.weekly.length, "⛔ over 104 weeks every one of the 19 is reached");
  H.eq(draws, 0, "⛔ and the rotation spends NO draw");
}

// ===========================================================================
// 5. ⛔ BOTH COUNTERS ARE WRITE-ONLY: a session hashes identically without them
// ===========================================================================

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

// test-cs015-p2.js's cut-down hunter: fire held, a Purge every 311 steps, to a
// ring in reach, away from a MimicShot, to a token, else the deepest target.
function drive(X, i) {
  const st = X.state, inp = X.Game.input, well = X.WELLS[st.wellIndex];
  if (i === 0) inp.keyDown(" ");
  if (i % 311 === 0) inp.keyDown("x");
  if (i % 311 === 4) inp.keyUp("x");
  const sk = st.skimmer;
  inp.keyUp("ArrowRight"); inp.keyUp("ArrowLeft");
  if (!sk || sk.dead) { inp.keyUp("arrowup"); return; }
  let d = null;
  if (st.dive.active) {
    const span = X.diveTime() - C.DIVE_GRACE;
    for (const r of st.dive.rings) {
      if (r.taken !== null) continue;
      const dd = X.laneDelta(well, sk.lane, r.lane);
      if (Math.abs(dd) - C.RING_ARC_LANES <= Math.max(0, st.dive.depth - r.depth) * span * C.KEY_SPEED_MAX) { d = dd; break; }
    }
  }
  let dodge = null, tok = null, best = null;
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
  for (const t of st.tokens) if (!t.dead && t.depth >= C.TOKEN_HOVER_DEPTH) tok = X.laneDelta(well, sk.lane, t.lane);
  if (d === null) d = dodge !== null ? (dodge > 0 ? -1 : 1) : tok !== null ? tok : best !== null ? X.laneDelta(well, sk.lane, best.lane) : 0;
  if (d > 0.3) inp.keyDown("ArrowRight"); else if (d < -0.3) inp.keyDown("ArrowLeft");
  const aloft = st.enemies.some(e => !e.dead && e.aloft && Math.abs(X.laneDelta(well, e.lane, sk.lane)) <= C.HIT_LANE_TOL);
  if (aloft && !st.powers.ward) inp.keyDown("arrowup"); else inp.keyUp("arrowup");
}

function play(mode, depth, steps, mutate) {
  const X = build({ mutate });
  const hash = makeHasher(X, new Set(["tokensCollected", "thornsDestroyed"]));
  const G = X.Game, st = X.state, MS = C.FIXED_DT * 1000;
  G.frame(0);
  G.reset();
  X.startGame(SEED, { mode, startDepth: depth });
  const hashes = [];
  let clock = 0;
  for (let i = 0; i < steps && st.screen === "play"; i++) {
    if (G.hitStopLeft === 0) drive(X, i);
    const want = G.stats.ticks + 1;
    for (let n = 0; G.stats.ticks < want && n < 8; n++) { clock += MS / 2; X.clock.t = clock; G.frame(clock); hashes.push(hash()); }
  }
  return { hashes, tally: Object.assign({}, st.tally), level: st.level };
}

function firstDiff(a, b) {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i;
  return -1;
}

for (const [mode, depth, steps] of [["classic", 5, 9000], ["overdrive", 9, 9000]]) {
  const live = play(mode, depth, steps, []);
  const out = play(mode, depth, steps, COUNTERS_OUT);
  H.assert(live.tally.thornsDestroyed > 0, `fixture: the ${mode} session destroyed Thorns (${live.tally.thornsDestroyed})`);
  if (mode === "overdrive") H.assert(live.tally.tokensCollected > 0, `fixture: the Overdrive session took tokens (${live.tally.tokensCollected})`);
  H.eq(out.tally.thornsDestroyed + out.tally.tokensCollected, 0, `fixture: the mutated ${mode} twin counted nothing`);
  H.assert(live.hashes.length > steps, `fixture: the ${mode} session hashed every frame (${live.hashes.length})`);
  H.eq(firstDiff(live.hashes, out.hashes), -1,
       `⛔ WRITE-ONLY: the ${mode} session hashes identically on every frame with both counters mutated out (level ${live.level})`);
  // ⛔ NON-VACUITY: the pair can see a counter that steers.
  if (mode === "classic") {
    const steer = play(mode, depth, steps, [[THORN_LINE, THORN_LINE + "      state.time += 1e-9;\n"]]);
    H.assert(firstDiff(live.hashes, steer.hashes) > 0, `⛔ non-vacuity: a Thorn counter that writes state.time diverges (frame ${firstDiff(live.hashes, steer.hashes)})`);
  }
}

H.report();
