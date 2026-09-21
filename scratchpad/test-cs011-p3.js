// test-cs011-p3.js — CS011 P3: the local top 10 and the run's end (GDD 7, 10.5,
// 15.3; plan §5, R6–R9, R15, R16, R20). A clear on the step that spends the last
// life is in the recorded score (with the mutation); a Dive death records once;
// quit from pause records 'quit' with the pre-quit score, game over's QUIT adds
// nothing and RESTART opens a run; a bench action makes the run ineligible (with
// the mutation) and `t` / `e` do not; createScores' order, tie, score > 0, cap
// and modes; R9's row with the name at the time; SCORES' rows; game over's line;
// `state` never moved by a Meta call; nothing enumerates storage.
//
// ⛔ TRAPS.
//  1. A fresh build boots to the title: two live steps before the first press.
//  2. Stop pressing at the stop: a key held into game over meets a live menu.
//  3. Meta's methods are wrapped ON THE OBJECT, so every internal `Meta.x()` call
//     reaches the wrapper; calls inside Meta's closure do not, and need not.
//  4. The mutants' `from` texts must each be in the build exactly once.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

installSeed(20260919);                      // ⛔ above the first buildGame()

const NS = "coinless.vector-vortex.";
const J = JSON.stringify;
const SEAT = 'if (state.screen === "gameover" && Meta.runOpen()) Meta.runEnded("died");';
const GATE = "return run !== null && !run.bench;";
const R9_KEYS = ["score", "level", "startDepth", "wells", "deaths", "durationS", "outcome",
                 "ts", "profileId", "profileName", "build"];

// ---------------------------------------------------------------------------
// the builds: every Meta method hashed around, the menu view captured, a driver
// ---------------------------------------------------------------------------

const metaLog = { calls: {}, moved: [] };
const builds = [];

function makeHasher(X) {
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
    for (const k of Object.keys(v)) { str(k); walk(v[k]); }
  }
  // state.rng is a closure the walk cannot see into: build() counts its draws.
  return () => { h = 2166136261; seen = new Map(); walk(X.state); return h; };
}

function build(opts) {
  const X = H.buildGame(Object.assign({ spy: ["drawMenu"] }, opts || {}));
  builds.push(X);
  const hash = makeHasher(X);
  for (const name of Object.keys(X.Meta)) {
    const f = X.Meta[name];
    if (typeof f !== "function") continue;
    X.Meta[name] = function () {
      metaLog.calls[name] = (metaLog.calls[name] || 0) + 1;
      const rng = X.state.rng;
      let draws = 0;
      X.state.rng = function () { draws++; return rng.apply(this, arguments); };
      const before = hash();
      let out;
      try { out = f.apply(this, arguments); } finally { X.state.rng = rng; }
      if (hash() !== before || draws > 0) metaLog.moved.push(`${name} (screen ${X.state.screen}, draws ${draws})`);
      return out;
    };
  }
  X.view = null;
  X.drawMenu.before = (ctx, view) => { X.view = { title: view.title, lines: view.lines.slice(),
    items: view.items.map(r => ({ label: r.label, detail: r.detail, enabled: r.enabled })) }; };
  return X;
}

function session(X) {
  const G = X.Game, C = X.C, MS = C.FIXED_DT * 1000;
  let clock = 0;
  const halfFrame = () => { clock += MS / 2; G.frame(clock); };
  const liveStep = () => { const want = G.stats.ticks + 1; for (let n = 0; G.stats.ticks < want && n < 8; n++) halfFrame(); };
  const steps = n => { for (let i = 0; i < n; i++) liveStep(); };
  const press = k => { G.input.keyDown(k); liveStep(); G.input.keyUp(k); liveStep(); };
  const tap = (k, n) => { for (let i = 0; i < n; i++) { G.input.keyDown(k); steps(2); G.input.keyUp(k); liveStep(); } };
  const S = {
    X, G, C, steps, press, liveStep, halfFrame,
    right: n => tap("ArrowRight", n),
    ok: () => press(" "),
    // A reset puts lastMs at 0: the clock follows it, or the first frame lurches.
    reset: () => { G.reset(); clock = 0; },
    boot: () => { G.frame(0); steps(2); },                           // trap 1
    // Title → PLAY → CLASSIC → LEVEL 1, through the menus.
    // ⛔ THE right(1) IS CS012 P3's REPAIR (O9): OVERDRIVE is MODE's first row and
    // its default highlight, so one step down restores this file's precondition,
    // a CLASSIC run — which is the mode every row and line below is about.
    play: () => { S.ok(); S.right(1); S.ok(); S.ok(); },
    // Frames until the death freeze has drained and a step has run on game over.
    settle: () => { for (let n = 0; n < 400 && (G.hitStopLeft > 0 || X.state.screen !== "gameover"); n++) halfFrame(); steps(2); },
    draw: () => { X.view = null; G.draw(); return X.view; },
    rows: () => X.Scores.list("classic"),
  };
  return S;
}

// A quiet board at `level`, as test-cs008-p2.js stages it: spawner held, nothing on it.
function quiet(S, level) {
  const { X } = S, state = X.state;
  S.reset();
  X.startGame(20260919);
  state.level = level;
  state.wellIndex = 0;
  X.enterWell();
  state.spawn.remaining = 0;
  state.spawn.timer = -1e9;
  state.enemies = [];
  state.shots = [];
  return X.WELLS[state.wellIndex];
}
const PARK = C => 1 - C.RIM_CONTACT_DEPTH;

// ---------------------------------------------------------------------------
// 1. ⛔ a clear on the step that spends the last life is in the recorded score
// ---------------------------------------------------------------------------

// One step: a fire-tick shot takes the last Vaulter, a bolt takes the last life,
// and the clear edge pays after killSkimmer(). Returns what the table recorded.
function lastLifeClear(X) {
  const S = session(X), { C } = X, state = X.state;
  quiet(S, 7);
  state.lives = 1;
  const lane = Math.round(state.skimmer.lane);
  state.enemies.push(new X.Vaulter(lane, PARK(C), 1));
  state.enemies.push(new X.WeaverBolt(lane, PARK(C)));
  X.Game.input.keyDown(" ");
  const before = state.score, rows0 = S.rows().length;
  S.liveStep();
  X.Game.input.reset();                                              // trap 2
  return { S, before, after: state.score, screen: state.screen, dive: state.dive.active,
           added: S.rows().length - rows0, row: S.rows()[0], line: S.draw().lines[2] };
}

{
  const X = build();
  const r = lastLifeClear(X);
  H.eq(r.screen, "gameover", "fixture: that step spent the last life");
  H.eq(r.after - r.before, 150 + 700 + 500, "fixture: and paid the Vaulter and the clear bonuses (no death bonus)");
  H.eq(r.added, 1, "⛔ the frame that ended the run recorded one row");
  H.eq(r.row && r.row.score, r.after, "⛔ the recorded score includes the clear bonuses paid after killSkimmer()");
  H.eq(r.row && r.row.outcome, "died", "and its outcome is 'died'");
  H.eq(r.line, "NEW HIGH SCORE #1", "⛔ game over names the placing");
  H.eq(X.Meta.runOpen(), false, "and the run is closed");
  r.S.settle();
  H.eq(r.S.rows().length, 1, "⛔ the frames after it record nothing more");
}

// Mutation: the record taken inside killSkimmer() misses the clear bonuses.
{
  const X = build({ mutate: [[SEAT, ""], ['sfx("gameOver");', 'sfx("gameOver"); Meta.runEnded("died");']] });
  const r = lastLifeClear(X);
  H.eq(r.added, 1, "mutant fixture: killSkimmer() recorded the row");
  H.assert(r.row && r.row.score !== r.after && r.row.score === r.before + 150,
           `⛔ MUTATION: recording in killSkimmer() loses the last-step clear (recorded ${r.row && r.row.score}, final ${r.after})`);
}

// ---------------------------------------------------------------------------
// 2. a Dive death (a staged Thorn strike) records once
// ---------------------------------------------------------------------------

{
  const X = build(), { C } = X, state = X.state;
  const S = session(X);
  const well = quiet(S, 9);
  state.lives = 1;
  X.addScore(4321);
  for (let l = 0; l < well.lanes; l++) state.enemies.push(new X.Thorn(l, C.THORN_MAX));
  state.enemies.push(new X.Vaulter(Math.round(state.skimmer.lane), PARK(C), 1));
  X.Game.input.keyDown(" ");
  S.liveStep();
  X.Game.input.reset();                                              // trap 2
  H.assert(state.dive.active && state.screen === "play", "fixture: the clear edge entered the dive");
  const ended0 = metaLog.calls.runEnded || 0;
  for (let n = 0; n < 2000 && state.screen !== "gameover"; n++) S.halfFrame();
  H.eq(state.tally.thornDeaths, 1, "fixture: the Dive's Thorn strike spent the last life");
  S.settle();
  for (let n = 0; n < 120; n++) S.halfFrame();
  H.eq(S.rows().length, 1, "⛔ a Dive death records one row");
  H.eq((S.rows()[0] || {}).score, state.score, "with the final score");
  H.eq((metaLog.calls.runEnded || 0) - ended0, 1, "⛔ and runEnded() was called once across every frame after it");
}

// ---------------------------------------------------------------------------
// 3. quit from pause; game over's QUIT; RESTART — through the front door
// ---------------------------------------------------------------------------

{
  const store = new Map();
  const X = build({ store }), state = X.state;
  const S = session(X);
  S.boot();
  S.play();
  H.eq(state.screen, "play", "fixture: a run through the front door");
  H.eq(X.Meta.eligible(), true, "⛔ startGame() opened an eligible run");
  X.addScore(1234);
  S.press("Escape");
  H.eq(state.screen, "pause", "fixture: paused");
  S.right(2); S.ok();                                                // QUIT TO TITLE
  H.eq(state.screen, "title", "fixture: quit to the title");
  H.eq(state.score, 0, "fixture: and the run was overwritten");
  H.eq(J(S.rows().map(r => [r.score, r.outcome])), J([[1234, "quit"]]),
       "⛔ quit from pause records one 'quit' row with the pre-quit score");
  H.eq(X.Meta.runOpen(), false, "and closes the run");
  H.eq(J(JSON.parse(store.get(NS + "scores") || '{"d":{"classic":[]}}').d.classic.map(r => r.score)), "[1234]",
       "⛔ the table is the ROOT `scores` key");

  // A run that dies, then game over's QUIT TO TITLE.
  S.play();
  X.addScore(500);
  state.lives = 1;
  X.killSkimmer(state);
  S.settle();
  H.eq(J(S.rows().map(r => [r.score, r.outcome])), J([[1234, "quit"], [500, "died"]]), "fixture: the death recorded 'died'");
  H.eq(S.draw().lines[2], "NEW HIGH SCORE #2", "⛔ game over names the placing, #2");
  S.right(1); S.ok();                                                // QUIT TO TITLE
  H.eq(state.screen, "title", "fixture: game over's QUIT reached the title");
  H.eq(S.rows().length, 2, "⛔ game over's QUIT TO TITLE records nothing");

  // RESTART opens a new run.
  S.play();
  X.addScore(700);
  state.lives = 1;
  X.killSkimmer(state);
  S.settle();
  H.eq(S.rows().length, 3, "fixture: the third run recorded");
  S.ok();                                                            // RESTART
  H.eq(state.screen, "play", "fixture: RESTART is a run");
  H.eq(J([X.Meta.runOpen(), X.Meta.eligible(), X.Meta.lastPlace()]), "[true,true,0]",
       "⛔ RESTART opens a new eligible run, with no placing yet");
  X.addScore(900);
  state.lives = 1;
  X.killSkimmer(state);
  S.settle();
  H.eq(J(S.rows().map(r => [r.score, r.outcome])), J([[1234, "quit"], [900, "died"], [700, "died"], [500, "died"]]),
       "⛔ and it records its own row: one row per run, best first");
}

// ---------------------------------------------------------------------------
// 4. the bench flag
// ---------------------------------------------------------------------------

// A front-door run that presses `keys` in play, scores, and dies.
function benchRun(X, keys) {
  const S = session(X), state = X.state;
  const log = console.log;
  S.boot();
  S.play();
  console.log = () => {};                                            // `e` exports to the console
  try { for (const k of keys) S.press(k); } finally { console.log = log; }
  const eligible = X.Meta.eligible();
  const rows0 = S.rows().length;
  X.addScore(99999);
  state.lives = 1;
  X.killSkimmer(state);
  S.settle();
  return { eligible, added: S.rows().length - rows0, line: S.draw().lines[2], place: X.Meta.lastPlace() };
}

for (const k of ["1", "2", "3", "4", "5", "6", "0", "w"]) {
  const r = benchRun(build(), [k]);
  H.eq(J([r.eligible, r.added, r.place, r.line]), J([false, 0, 0, ""]),
       `⛔ bench key ${k} in play: ineligible, no row, no placing line`);
}
{
  const r = benchRun(build(), ["t", "e", "t"]);
  H.eq(J([r.eligible, r.added, r.line]), J([true, 1, "NEW HIGH SCORE #1"]), "⛔ `t` and `e` in play leave the run eligible");
}
{
  // A bench key off play flags nothing: the run it would flag does not exist yet.
  const X = build(), S = session(X);
  S.boot();
  S.press("1");
  S.play();
  H.eq(X.Meta.eligible(), true, "a bench key on the title flags nothing");
}
{
  const r = benchRun(build({ mutate: [[GATE, "return run !== null;"]] }), ["1"]);
  H.eq(r.added, 1, "⛔ MUTATION: the flag ignored records the bench-touched run");
}

// ---------------------------------------------------------------------------
// 5. createScores: order, the tie, score > 0, the cap, the modes
// ---------------------------------------------------------------------------

{
  const X = builds[0];
  const mem = new Map();
  const store = { get: (k, fb) => (mem.has(k) ? JSON.parse(mem.get(k)) : fb), set: (k, v) => mem.set(k, J(v)) };
  const T = X.createScores({ store, key: "scores", perMode: 10, modes: ["classic", "overdrive"] });
  const add = (s, tag) => T.add("classic", { score: s, tag });
  H.eq(J([add(300, "a"), add(500, "b"), add(100, "c")]), "[1,1,3]", "ranks as added: 300 #1, 500 #1, 100 #3");
  H.eq(J(T.list("classic").map(r => r.score)), "[500,300,100]", "⛔ the list is best first");
  H.eq(add(300, "tie"), 3, "⛔ a tie goes BELOW the row already there");
  H.eq(J(T.list("classic").map(r => r.tag)), J(["b", "a", "tie", "c"]), "and the earlier row keeps its place");
  const writes = mem.get("scores");
  H.eq(J([T.qualifies("classic", 0), T.qualifies("classic", -5), add(0, "z"), add(-5, "n"), add(NaN, "q")]),
       "[false,false,0,0,0]", "⛔ score > 0: zero and below never qualify or add");
  H.eq(mem.get("scores"), writes, "and a row that does not place writes nothing");
  for (let s = 200; s < 1000; s += 100) add(s, "f" + s);
  H.eq(T.list("classic").length, 10, "⛔ the cap is 10");
  const full = T.list("classic"), last = full[9].score;
  H.eq(J([T.qualifies("classic", last), add(last, "tie10")]), "[false,0]", "⛔ a tie with the 10th does not place");
  const rank = full.filter(r => r.score > last).length + 1;
  H.eq(J([T.qualifies("classic", last + 1), add(last + 1, "in")]), J([true, rank]), `one point above it places, #${rank}, below its ties`);
  const now = T.list("classic");
  H.eq(J([now.length, now[rank - 1].tag, now.some(r => r.tag === full[9].tag)]), J([10, "in", false]),
       "⛔ still 10 rows, and the old 10th is dropped");
  H.eq(T.list("overdrive").length, 0, "⛔ per mode: classic's rows are not overdrive's");
  H.eq(T.add("overdrive", { score: 1 }), 1, "overdrive's own #1");
  H.eq(J([T.list("classic").length, T.list("overdrive").length]), "[10,1]", "and it leaves classic alone");
  let threw = false;
  try { T.list("arcade"); } catch (e) { threw = true; }
  H.assert(threw, "an undeclared mode throws");
  mem.set("scores", J({ classic: [{ score: 5 }, "junk", { score: "9" }, { score: 50 }], overdrive: 7 }));
  H.eq(J([T.list("classic").map(r => r.score), T.list("overdrive")]), "[[50,5],[]]",
       "known-value-else-default: junk rows dropped, a non-array mode reads empty, order restored");
  H.eq(J(X.Scores.list("classic").map(r => r.score)), J(builds[0].Scores.list("classic").map(r => r.score)),
       "fixture: the game's own Scores is a createScores table");
}

// ---------------------------------------------------------------------------
// 6. R9's row, with the profile's name at the time
// ---------------------------------------------------------------------------

{
  const store = new Map();
  store.set(NS + "profiles", J({ v: 1, d: { lastUsed: "p0", seq: 2, profiles: [
    { id: "p0", name: "ANONYMOUS", created: 1, playerId: null }, { id: "p1", name: "SECOND", created: 2, playerId: null }] } }));
  const X = build({ store }), state = X.state;
  const S = session(X);
  S.boot();
  X.Profiles.select("p1");
  S.play();
  X.addScore(800);
  state.tally.wellsCleared = 3;                                      // fixture values the row must carry
  state.time = 61.4;
  state.lives = 1;
  X.killSkimmer(state);
  S.settle();
  const row = S.rows()[0] || {};
  H.eq(J(Object.keys(row)), J(R9_KEYS), "⛔ a row carries R9's eleven fields, in order");
  H.eq(J([row.score, row.level, row.startDepth, row.wells, row.deaths, row.durationS, row.outcome,
          row.profileId, row.profileName, row.build]),
       J([800, 1, 1, 3, 1, 61, "died", "p1", "SECOND", X.C.GAME_VERSION]), "⛔ each read off the run as it ended");
  H.assert(Number.isInteger(row.ts) && row.ts > 1.7e12, "ts is a wall-clock ms stamp");
  S.right(1); S.ok();
  X.Profiles.select("p0");
  S.play();
  X.addScore(300);
  state.lives = 1;
  X.killSkimmer(state);
  S.settle();
  H.eq(J(S.rows().map(r => [r.score, r.profileName])), J([[800, "SECOND"], [300, "ANONYMOUS"]]),
       "⛔ one shared table, each row stamped with the name its profile had at the time");
}

// ---------------------------------------------------------------------------
// 7. SCORES and game over's line
// ---------------------------------------------------------------------------

{
  const X = build(), S = session(X), state = X.state;
  S.boot();
  let v = S.draw();
  // CS011 P4 appended PROFILE (plan R16): rewritten in place, SCORES still third.
  // ⛔ CS015 P3 appended ACHIEVEMENTS, in place and for the same reason (A1-A):
  // a row goes AFTER the ones the closed tests navigate by index, so the claim
  // — SCORES after OPTIONS, and the title's rows are exactly these — stands.
  H.eq(J(v.items.map(r => r.label)), J(["PLAY", "OPTIONS", "SCORES", "PROFILE", "ACHIEVEMENTS"]), "⛔ the title's rows: SCORES after OPTIONS");
  S.right(2); S.ok();
  H.eq(state.screen, "scores", "fixture: SCORES");
  v = S.draw();
  // ⛔ REWRITTEN IN PLACE AT CS012 P3 (O10): SCORES gained a MODE row, FIRST and
  // always, and its info line names the mode shown. With no run started this
  // session the entry mode is MODE's first row, OVERDRIVE. The claims — the info
  // line, NO SCORES YET, BACK last, and rows rebuilt on entry — are unchanged.
  H.eq(J([v.title, v.lines]), J(["SCORES", ["OVERDRIVE · LOCAL", "NO SCORES YET"]]), "⛔ empty: the info line and NO SCORES YET");
  H.eq(J(v.items.map(r => r.label)), J(["MODE", "BACK"]), "and MODE, then BACK");
  S.right(1); S.ok();
  H.eq(state.screen, "title", "⛔ BACK returns to the title");

  for (const s of [40, 9000, 1002815]) X.Scores.add("classic", { score: s, profileName: "ABCDEFGHIJKL" });
  // A run that does not place in a full table: no line.
  for (let i = 0; i < 7; i++) X.Scores.add("classic", { score: 5000 + i, profileName: "FILL" });
  S.play();
  X.addScore(10);
  state.lives = 1;
  X.killSkimmer(state);
  S.settle();
  H.eq(J([S.rows().length, X.Meta.lastPlace(), S.draw().lines[2]]), J([10, 0, ""]),
       "⛔ a run that did not place: game over's third line is empty");
  S.right(1); S.ok();
  S.right(2); S.ok();
  v = S.draw();
  // ⛔ CS012 P3 (O10): a run was started this session, so SCORES opens on ITS
  // mode — CLASSIC — and the MODE row is row 0, ahead of the entries.
  H.eq(J(v.lines), J(["CLASSIC · LOCAL"]), "a list: one info line, on the last run's mode");
  const want = [{ label: "MODE", detail: "CLASSIC", enabled: true }];
  for (const [i, r] of X.Scores.list("classic").entries()) {
    want.push({ label: (i + 1) + " " + r.profileName, detail: String(r.score), enabled: true });
  }
  want.push({ label: "BACK", detail: "", enabled: true });
  H.eq(J(v.items), J(want), "⛔ SCORES' rows equal list(\"classic\"): `n NAME`, plain digits, enabled, after MODE and before BACK");
  H.eq(v.items[1].detail, "1002815", "fixture: no separators");
  X.Scores.add("classic", { score: 2000000, profileName: "LATE" });
  H.eq(S.draw().items[1].label, "1 ABCDEFGHIJKL", "⛔ rows are rebuilt on entry, never in draw()");
  S.press("Escape");
  S.right(2); S.ok();
  H.eq(S.draw().items[1].label, "1 LATE", "and the next entry shows the new row");
  S.right(3);
  H.eq(state.screen, "scores", "rotate scrolls the rows without leaving");
}

// ---------------------------------------------------------------------------
// 8. ⛔ Meta never moves `state`; nothing enumerates storage
// ---------------------------------------------------------------------------

for (const m of ["runStarted", "benchUsed", "eligible", "runOpen", "runEnded", "scores", "lastPlace"]) {
  H.assert((metaLog.calls[m] || 0) > 0, `non-vacuity: Meta.${m}() was called (${metaLog.calls[m] || 0})`);
}
const total = Object.values(metaLog.calls).reduce((a, b) => a + b, 0);
H.eq(metaLog.moved.length, 0, `⛔ state hashed around every Meta call (${total}): never moved, no draw${metaLog.moved.length ? " — " + metaLog.moved.slice(0, 3).join("; ") : ""}`);
H.eq(builds.reduce((a, X) => a + X._env.storageReads, 0), 0, `⛔ _env.storageReads is 0 across all ${builds.length} builds`);

H.report("test-cs011-p3.js");
