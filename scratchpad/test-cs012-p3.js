// test-cs012-p3.js — CS012 P3: Overdrive at the front door, and its own board
// (GDD 4.6, 10.5, 13, 15.1, 15.3, 15.4; plan §5, O9–O12, R8). OVERDRIVE is MODE's
// first row and is chosen on all four devices; `progress` is v2 and per mode,
// migrated from v1, and START DEPTH reads the mode MODE chose; one kit client per
// mode, both made at once, with the two registered ids; a run submits to its own
// board and never the other's; a bench run to neither; the queued line sums both;
// SCORES' MODE row, each mode's LOCAL and ONLINE, and a stale answer dropped
// (with the mutation). ⛔ Meta and Leaderboard still write no `state`.
//
// ⛔ TRAPS.
//  1. A fresh build boots to the title: two live steps before the first press.
//  2. The fake's promises settle on microtasks: drain() before reading a screen.
//  3. The bridge is <script type="module"> and never runs here: the fake goes on
//     X._env.win, which is the game's `window`.
//  4. SCORES' rows are MODE, then VIEW (module only), the entries, BACK — so
//     VIEW is row 1, not row 0.
//  5. Stop pressing at the stop: a key held into game over meets a live menu.
"use strict";

const path = require("path");
const { execFileSync } = require("child_process");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

installSeed(20260924);                      // ⛔ above the first buildGame()

const ROOT = path.join(__dirname, "..");
const J = JSON.stringify;
const NS = "coinless.vector-vortex.";
const HINT = "NAME YOUR PROFILE TO POST UNDER YOUR NAME";
const TOKEN = "const answer = b => { if (t === token) done(b); };";
const drain = () => new Promise(r => setImmediate(r));

// ⛔ PAUL'S O11 REGISTRY COMMIT (STATUS.md, Carried tasks). Never f8d34f3: that
// commit REPLACED `vector-vortex` rather than adding beside it.
const REG_COMMIT = "e2efed5";

// ---------------------------------------------------------------------------
// the registry, read from coinless-kit — never a copied list
// ---------------------------------------------------------------------------

function readRegistry() {
  try {
    const text = execFileSync("git", ["-C", path.join(ROOT, "..", "coinless-kit"), "show",
                                      `${REG_COMMIT}:services/leaderboard/src/registry.js`],
                              { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    if (text.indexOf("export const GAMES =") < 0) return null;
    return new Function(text.replace("export const GAMES =", "return"))();
  } catch (e) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// a recording fake module (one record PER BOARD), the state hash, a driver
// ---------------------------------------------------------------------------

function fakeKit() {
  const rec = { creates: [], boards: {}, pending: [] };
  const of = id => (rec.boards[id] || (rec.boards[id] = { beginRuns: 0, submits: [], fetches: [], queue: 0 }));
  rec.module = {
    create(config) {
      rec.creates.push(config);
      const b = of(config.gameId);
      return {
        beginRun() { b.beginRuns++; return "run"; },
        submit(result) {
          b.submits.push({ result: JSON.parse(J(result)), player: config.getPlayer() });
          return Promise.resolve({ status: "submitted" });
        },
        fetchBoard(opts) {
          b.fetches.push(opts);
          return new Promise((res, rej) => rec.pending.push({ res, rej, gameId: config.gameId }));
        },
        queueLength() { return b.queue; },
        flushQueue() { return Promise.resolve({ sent: 0, failed: 0, dropped: 0 }); },
      };
    },
  };
  rec.of = of;
  return rec;
}

// test-cs011-p3.js's hasher: every scalar `state` reaches, plus a draw counter.
const metaLog = { calls: {}, moved: [] };
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
  return () => { h = 2166136261; seen = new Map(); walk(X.state); return h; };
}

// ⛔ WRAPPED ON THE OBJECT, so every internal `Meta.x()` / `Leaderboard.x()` call
// reaches the wrapper; calls inside Meta's own closure do not, and need not.
function watchMeta(X) {
  const hash = makeHasher(X);
  for (const [tag, obj] of [["Meta", X.Meta], ["Leaderboard", X.Leaderboard]]) {
    for (const name of Object.keys(obj)) {
      const f = obj[name];
      if (typeof f !== "function") continue;
      obj[name] = function () {
        const key = `${tag}.${name}`;
        metaLog.calls[key] = (metaLog.calls[key] || 0) + 1;
        const rng = X.state.rng;
        let draws = 0;
        X.state.rng = function () { draws++; return rng.apply(this, arguments); };
        const before = hash();
        let out;
        try { out = f.apply(this, arguments); } finally { X.state.rng = rng; }
        if (hash() !== before || draws > 0) metaLog.moved.push(`${key} (screen ${X.state.screen}, draws ${draws})`);
        return out;
      };
    }
  }
}

// ⛔ CS017 P2 (plan S7-B): the bench is bound only in a C.DEBUG_KEYS build, and
// this file's claim is what a bench run earns, so every build here flips it —
// the precondition "a bench exists". A caller's own `mutate` rides after it.
const BENCH_ON = [["  DEBUG_KEYS:           false,", "  DEBUG_KEYS:           true,"]];

function build(opts) {
  const X = H.buildGame(Object.assign({ spy: ["drawMenu"] }, opts || {},
                                      { mutate: BENCH_ON.concat((opts && opts.mutate) || []) }));
  X.view = null;
  X.drawMenu.before = (ctx, v) => {
    X.view = { title: v.title, lines: v.lines.slice(), cursor: v.cursor,
               items: v.items.map(r => ({ label: r.label, detail: r.detail })) };
  };
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
    X, G, C, steps, liveStep, halfFrame, press,
    right: n => tap("ArrowRight", n),
    left: n => tap("ArrowLeft", n),
    ok: () => press(" "),
    boot: () => { G.frame(0); steps(2); },                           // trap 1
    draw: () => { X.view = null; G.draw(); return X.view; },
    // ⛔ MODE's rows are OVERDRIVE, then CLASSIC (O9).
    play: mode => { S.ok(); if (mode === "classic") S.right(1); S.ok(); S.ok(); },
    toScores: () => { S.right(2); S.ok(); },
    die: () => {
      X.state.lives = 1;
      X.killSkimmer(X.state);
      for (let n = 0; n < 400 && (G.hitStopLeft > 0 || X.state.screen !== "gameover"); n++) halfFrame();
      steps(2);
    },
    labels: () => (S.draw() || { items: [] }).items.map(r => r.label),
  };
  return S;
}

(async function main() {

// ---------------------------------------------------------------------------
// 1. ⛔ the two board ids, and C.GAME_ID untouched
// ---------------------------------------------------------------------------

{
  const X = build(), C = X.C;
  H.eq(J(C.LEADERBOARD_GAME_IDS), J({ classic: "vector-vortex", overdrive: "vector-vortex-overdrive" }),
       "⛔ C.LEADERBOARD_GAME_IDS: one registered id per mode (O11)");
  H.eq(C.GAME_ID, "vector-vortex", "⛔ C.GAME_ID is unchanged — it is the SAVE keyspace, not a board id");
  H.eq(J(Object.keys(C.LEADERBOARD_GAME_IDS)), J(Object.keys(C.MODE_FLAGS)),
       "⛔ a board id per mode, in MODE_FLAGS' order (Classic first: the clients are made in it)");
  const S = session(X);
  S.boot();
  X.startGame(7, { mode: "overdrive" });
  X.Meta.saveSettings();
  H.assert([...X._env.store.keys()].every(k => k.startsWith(NS)),
           `⛔ an Overdrive run still saves under coinless.vector-vortex.* (${[...X._env.store.keys()].join(",")})`);
}

// ---------------------------------------------------------------------------
// 2. ⛔ OVERDRIVE IS CHOSEN ON ALL FOUR DEVICES, and the run is Overdrive
// ---------------------------------------------------------------------------

{
  const X = build(), S = session(X), C = X.C, G = X.Game, st = X.state;
  const zoneY = C.WORLD_H * (1 - C.TOUCH_ZONE_FRAC);
  const pad = { axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
  const nav = X._env.win.navigator;
  const DEVICES = [
    { name: "keyboard", fire: d => (d ? G.input.keyDown(" ") : G.input.keyUp(" ")) },
    { name: "mouse",    fire: d => G.input.setButton("fire", d) },
    { name: "gamepad",  setup: () => { nav.getGamepads = () => [pad]; },
      teardown: () => { nav.getGamepads = () => []; S.liveStep(); delete nav.getGamepads; },
      fire: d => { pad.buttons[0].pressed = d; } },
    { name: "touch",    fire: d => (d ? G.input.touchStart(1, C.WORLD_W / 2, zoneY / 2) : G.input.touchEnd(1)) },
  ];
  S.boot();
  for (const dev of DEVICES) {
    if (dev.setup) dev.setup();
    const hit = () => { dev.fire(true); S.liveStep(); dev.fire(false); S.liveStep(); };
    H.eq(st.screen, "title", `${dev.name}: fixture — the title`);
    hit();
    H.eq(st.screen, "mode", `${dev.name}: PLAY opens MODE`);
    const v = S.draw() || { items: [], cursor: -1 };
    H.eq(J([v.items.map(r => r.label), v.cursor]), J([["OVERDRIVE", "CLASSIC"], 0]),
         `⛔ ${dev.name}: MODE is OVERDRIVE then CLASSIC, and OVERDRIVE is the highlight (O9, GDD §13)`);
    hit();
    H.eq(st.screen, "depth", `${dev.name}: OVERDRIVE opens START DEPTH`);
    hit();
    H.eq(st.screen, "play", `${dev.name}: a START DEPTH row starts the run`);
    H.eq(st.mode, "overdrive", `⛔ ${dev.name}: and the run's state.mode is "overdrive"`);
    G.quitToTitle();
    S.steps(2);
    if (dev.teardown) dev.teardown();
  }
}

// ---------------------------------------------------------------------------
// 3. ⛔ ONE CLIENT PER BOARD, AND EACH RUN POSTS TO ITS OWN
// ---------------------------------------------------------------------------

const REG = readRegistry();
const IDS = build().C.LEADERBOARD_GAME_IDS;
const CLASSIC = IDS.classic, OVER = IDS.overdrive;

{
  const rec = fakeKit();
  const X = build(), S = session(X), C = X.C, st = X.state;
  watchMeta(X);
  X._env.win.KitLeaderboard = rec.module;
  S.boot();

  H.eq(rec.creates.length, 2, "⛔ BOTH clients are made by the first call that finds the module (R8)");
  H.eq(J(rec.creates.map(c => c.gameId)), J([CLASSIC, OVER]), "⛔ one per mode, Classic's first");
  for (const c of rec.creates) {
    H.eq(J([c.endpoint, c.gameVersion, typeof c.getPlayer]), J([C.LEADERBOARD_ENDPOINT, C.GAME_VERSION, "function"]),
         `⛔ ${c.gameId}: C's endpoint and version, and getPlayer as a callback`);
  }
  S.steps(4);
  H.eq(rec.creates.length, 2, "⛔ and a create() is never repeated");

  // An Overdrive run: one begin and one submit, on the Overdrive board alone.
  const cb = rec.of(CLASSIC), ob = rec.of(OVER);
  S.play("overdrive");
  H.eq(J([st.screen, st.mode]), J(["play", "overdrive"]), "fixture: an Overdrive run through the front door");
  H.eq(J([ob.beginRuns, cb.beginRuns]), J([1, 0]), "⛔ beginRun goes to the run's own board");
  X.addScore(4242);
  st.time = 30.2;
  st.tally.wellsCleared = 2;
  st.tally.purgesSpent = 1;
  S.die();
  H.eq(J([ob.submits.length, cb.submits.length]), J([1, 0]),
       "⛔ an Overdrive run end submits ONCE to the Overdrive board and NEVER to Classic's");
  const od = (ob.submits[0] || { result: { stats: {} } }).result;
  H.eq(J([od.metric, od.durationS, od.outcome, od.stats.mode]), J([4242, 30, "died", "overdrive"]),
       "⛔ with the run's score, its rounded duration, 'died' and stats.mode overdrive");

  // ⛔ RESTART keeps the mode, so it keeps the board.
  S.ok();
  H.eq(J([st.screen, st.mode]), J(["play", "overdrive"]), "fixture: RESTART is an Overdrive run");
  H.eq(J([ob.beginRuns, cb.beginRuns]), J([2, 0]), "⛔ RESTART begins on the same board");
  X.addScore(11);
  S.die();
  H.eq(J([ob.submits.length, cb.submits.length]), J([2, 0]), "⛔ and submits there: RESTART keeps the mode's client");
  S.right(1); S.ok();                                                // QUIT TO TITLE

  // A Classic run does the reverse.
  S.play("classic");
  H.eq(st.mode, "classic", "fixture: a Classic run through the front door");
  X.addScore(999);
  S.die();
  H.eq(J([cb.submits.length, ob.submits.length]), J([1, 2]),
       "⛔ a Classic run end submits once to Classic's board and never to Overdrive's");
  H.eq((cb.submits[0] || { result: { stats: {} } }).result.stats.mode, "classic", "with stats.mode classic");
  S.right(1); S.ok();

  // ⛔ A bench run posts to neither (M6's gate is still the one gate).
  S.play("overdrive");
  S.press("1");
  H.eq(X.Meta.eligible(), false, "fixture: a bench digit in play makes the run ineligible");
  X.addScore(99999);
  S.die();
  H.eq(J([ob.submits.length, cb.submits.length]), J([2, 1]), "⛔ a bench run submits to NEITHER board");
  H.eq(J([X.Scores.list("overdrive").length, X.Scores.list("classic").length]), J([2, 1]),
       "⛔ and the same gate kept its row out of the local table");
  S.right(1); S.ok();

  // ⛔ The title's queued line sums both boards.
  cb.queue = 0; ob.queue = 0;
  S.steps(1);
  H.eq(J(S.draw().lines), "[]", "two empty queues: no line");
  cb.queue = 2; ob.queue = 3;
  S.steps(1);
  H.eq(J(S.draw().lines), J(["5 SCORES QUEUED"]), "⛔ the queued line SUMS both boards (2 + 3)");
  cb.queue = 1; ob.queue = 0;
  S.steps(1);
  H.eq(J(S.draw().lines), J(["1 SCORE QUEUED"]), "one queued on one board: singular");
  cb.queue = 0;
  S.steps(1);
  H.eq(J(S.draw().lines), "[]", "and the line goes when both empty");

  // ⛔ THE STATS KEYS, read from coinless-kit's registry at Paul's O11 commit.
  for (const [id, sub] of [[OVER, ob.submits[0]], [CLASSIC, cb.submits[0]]]) {
    if (REG === null) { H.skip(`${id}: coinless-kit's registry.js at ${REG_COMMIT} is not readable beside this repo`); continue; }
    if (!REG[id]) { H.skip(`${id}: no entry in coinless-kit's registry.js at ${REG_COMMIT}`); continue; }
    if (!sub) { H.assert(false, `⛔ ${id}: a run submitted to this board (none did)`); continue; }
    H.eq(J(Object.keys(sub.result.stats).sort()), J(REG[id].statsFields.slice().sort()),
         `⛔ ${id}: the stats keys are exactly the registry's statsFields`);
  }
  if (REG !== null && REG[OVER]) {
    H.eq(REG[OVER].sortDirection, "desc", `fixture: ${OVER} is registered, higher is better`);
  }
}

// ---------------------------------------------------------------------------
// 4. ⛔ SCORES: the MODE row, each mode's LOCAL and ONLINE, a stale answer dropped
// ---------------------------------------------------------------------------

const boardOf = (id, entries) => ({ gameId: id, window: "all", entries });

// ⛔ GUARDED, so a mutant that never began that load fails an assertion rather
// than throwing the whole file away at its first red claim.
function settle(rec, i, how, value) {
  const pend = rec.pending[i];
  if (!pend) { H.assert(false, `fixture: load ${i} began (it did not)`); return false; }
  pend[how](value);
  return true;
}

{
  const rec = fakeKit();
  const X = build(), S = session(X), st = X.state, C = X.C;
  watchMeta(X);
  X._env.win.KitLeaderboard = rec.module;
  S.boot();
  X.Scores.add("classic", { score: 500, profileName: "CEE" });
  X.Scores.add("overdrive", { score: 900, profileName: "OHH" });

  // No run yet: the entry mode is MODE's first row (O10).
  S.toScores();
  let v = S.draw();
  H.eq(J([st.screen, v.lines[0], v.items.map(r => r.label)]),
       J(["scores", "OVERDRIVE · LOCAL", ["MODE", "VIEW", "1 OHH", "BACK"]]),
       "⛔ with no run this session SCORES opens on MODE's first row, LOCAL, with MODE first");
  H.eq(v.items[0].detail, "OVERDRIVE", "and the MODE row's detail names the mode shown");

  // The MODE row cycles, and the table follows it.
  S.ok();
  v = S.draw();
  H.eq(J([v.lines[0], v.items.map(r => [r.label, r.detail])]),
       J(["CLASSIC · LOCAL", [["MODE", "CLASSIC"], ["VIEW", "LOCAL"], ["1 CEE", "500"], ["BACK", ""]]]),
       "⛔ MODE switches to CLASSIC and the LOCAL table is that mode's");
  S.ok();
  H.eq(S.draw().lines[0], "OVERDRIVE · LOCAL", "⛔ and cycles back: two modes, MODE's two rows");

  // ⛔ ONLINE loads the SHOWN mode's board.
  S.right(1); S.ok();                                                // VIEW → ONLINE (trap 4)
  H.eq(J([rec.of(OVER).fetches.length, rec.of(CLASSIC).fetches.length]), J([1, 0]),
       "⛔ ONLINE fetches the shown mode's board, and only it");
  H.eq(J(rec.of(OVER).fetches[0]), J({ window: "all", limit: C.LEADERBOARD_BOARD_LIMIT }),
       "the all-time top 10, as CS011 P5 set it");
  H.eq(J(S.draw().lines), J(["OVERDRIVE · ONLINE", "LOADING…", HINT]), "⛔ OVERDRIVE · ONLINE, LOADING…");
  settle(rec, 0, "res", boardOf(OVER, [{ rank: 1, displayName: "ODACE", metric: 8000, flagged: false }]));
  await drain();                                                     // trap 2
  v = S.draw();
  H.eq(J([v.lines[0], v.items.map(r => r.label)]), J(["OVERDRIVE · ONLINE", ["MODE", "VIEW", "1 ODACE", "BACK"]]),
       "⛔ the Overdrive board's rows are drawn under its own info line");

  // ⛔ A MODE step on ONLINE re-loads the other board, and the first board's
  // late answer is dropped by the same token a stale load's is.
  S.left(1); S.ok();                                                 // MODE → CLASSIC, reloading
  H.eq(J([rec.of(CLASSIC).fetches.length, rec.of(OVER).fetches.length]), J([1, 1]),
       "⛔ a MODE step on ONLINE fetches the incoming mode's board");
  H.eq(J(S.draw().lines.slice(0, 2)), J(["CLASSIC · ONLINE", "LOADING…"]), "and shows LOADING… under its label");
  settle(rec, 0, "res", boardOf(OVER, [{ rank: 1, displayName: "LATEOD", metric: 1, flagged: false }]));
  await drain();
  H.eq(J(S.draw().lines.slice(0, 2)), J(["CLASSIC · ONLINE", "LOADING…"]),
       "⛔ the OUTGOING mode's answer, arriving late, is dropped");
  settle(rec, 1, "res", boardOf(CLASSIC, [{ rank: 1, displayName: "CEE", metric: 500, flagged: true }]));
  await drain();
  H.eq(J(S.draw().items.map(r => [r.label, r.detail])),
       J([["MODE", "CLASSIC"], ["VIEW", "ONLINE"], ["1 CEE", "500*"], ["BACK", ""]]),
       "⛔ and the incoming mode's answer is drawn, a flagged row ending in `*`");

  // The entry mode is the LAST RUN STARTED this session.
  S.press("Escape");
  S.play("overdrive");
  X.addScore(1500);
  S.die();
  S.right(1); S.ok();                                                // QUIT TO TITLE
  S.toScores();
  H.eq(J([S.draw().lines[0], (S.draw().items[0] || {}).detail]), J(["OVERDRIVE · LOCAL", "OVERDRIVE"]),
       "⛔ SCORES opens on the mode of the last run started this session");
  H.eq(J(X.Scores.list("overdrive").map(r => r.score)), J([1500, 900]),
       "⛔ and that run's local row landed in OVERDRIVE's table");
  H.eq(J(X.Scores.list("classic").map(r => r.score)), J([500]), "⛔ leaving CLASSIC's alone");
  S.press("Escape");
  S.play("classic");
  X.addScore(50);
  S.die();
  S.right(1); S.ok();
  S.toScores();
  H.eq(S.draw().lines[0], "CLASSIC · LOCAL", "⛔ a Classic run moves the entry mode back");
  S.press("Escape");

  // ⛔ THE ROWS ARE NEVER BUILT IN draw().
  X.Scores.add("classic", { score: 7777, profileName: "DRAWN" });
  S.toScores();
  const first = (S.draw().items[2] || {}).label;
  X.Scores.add("classic", { score: 9999, profileName: "LATER" });
  H.eq((S.draw().items[2] || {}).label, first, "⛔ a row added while SCORES is open is not drawn until it is rebuilt");
  S.press("Escape"); S.toScores();
  H.eq((S.draw().items[2] || {}).label, "1 LATER", "and the next entry shows it");
  S.press("Escape");
}

// ⛔ MUTATION: with the stale token ignored, the outgoing mode's answer paints
// under the incoming mode's label.
{
  const rec = fakeKit();
  const M = build({ mutate: [[TOKEN, "const answer = b => done(b);"]] }), S = session(M);
  M._env.win.KitLeaderboard = rec.module;
  S.boot();
  S.toScores();
  S.right(1); S.ok();                                                // VIEW → ONLINE (OVERDRIVE)
  S.left(1); S.ok();                                                 // MODE → CLASSIC, reloading
  settle(rec, 0, "res", boardOf(OVER, [{ rank: 1, displayName: "LATEOD", metric: 1, flagged: false }]));
  await drain();
  const v = S.draw();
  H.eq(J([v.lines[0], (v.items[2] || {}).label]), J(["CLASSIC · ONLINE", "1 LATEOD"]),
       "⛔ MUTATION: with no stale token the Overdrive board's late answer is drawn under CLASSIC");
}

// ---------------------------------------------------------------------------
// 5. ⛔ THE START DEPTH RECORD IS PER MODE (O12): v2, migrated, and both kept
// ---------------------------------------------------------------------------

// ⛔ A v1 record is CLASSIC's: Overdrive was not choosable before this phase.
{
  const store = new Map([[NS + "progress", J({ v: 1, d: { highestCleared: 14 } })]]);
  const X = build({ store });
  H.eq(J([X.levelRecord("classic").highestCleared(), X.levelRecord("overdrive").highestCleared()]), J([14, 0]),
       "⛔ a v1 { highestCleared } migrates to v2's `classic`, and `overdrive` starts at 0");
  H.eq(J(JSON.parse(store.get(NS + "progress"))), J({ v: 2, d: { classic: 14, overdrive: 0 } }),
       "⛔ and kit-storage writes the migrated value back at v2, under the SAME key");
  H.eq(J(X.startDepthOptions("classic")), J([1, 3, 5, 7, 9, 11, 13]), "Classic's list reaches 13");
  H.eq(J(X.startDepthOptions("overdrive")), J(X.C.START_DEPTH_FIRST), "⛔ Overdrive's is still the first list");
}

// A junk v1 payload migrates to two zeroes rather than throwing.
{
  const store = new Map([[NS + "progress", J({ v: 1, d: { highestCleared: "14" } })]]);
  const X = build({ store });
  H.eq(J([X.levelRecord("classic").highestCleared(), X.levelRecord("overdrive").highestCleared()]), J([0, 0]),
       "a v1 record that is not a whole number migrates to 0");
}

// ⛔ A CLEAR IN ONE MODE EXTENDS ONLY THAT MODE'S LIST — through the real edge.
{
  const store = new Map();
  const X = build({ store }), S = session(X), C = X.C, st = X.state;
  watchMeta(X);
  S.boot();
  X.startGame(3, { mode: "overdrive", startDepth: 14 });
  st.spawn.remaining = 0;
  st.enemies.length = 0;
  X.Game.update(C.FIXED_DT);
  H.eq(J(JSON.parse(store.get(NS + "progress")).d), J({ classic: 0, overdrive: 14 }),
       "⛔ an Overdrive clear writes `progress` v2's `overdrive` and leaves `classic` at 0");
  H.eq(J([X.startDepthOptions("overdrive").pop(), X.startDepthOptions("classic").pop()]), J([13, 9]),
       "⛔ and only Overdrive's list grew");

  X.startGame(4, { mode: "classic", startDepth: 20 });
  st.spawn.remaining = 0;
  st.enemies.length = 0;
  X.Game.update(C.FIXED_DT);
  H.eq(J(JSON.parse(store.get(NS + "progress")).d), J({ classic: 20, overdrive: 14 }),
       "⛔ a Classic clear afterwards carries Overdrive's record through: one key, both modes");

  // ⛔ START DEPTH IS BUILT FOR THE MODE MODE CHOSE, never for state.mode.
  X.Game.quitToTitle();
  S.steps(2);
  S.ok(); S.ok();                                                    // PLAY, OVERDRIVE
  H.eq(st.screen, "depth", "fixture: START DEPTH after choosing OVERDRIVE");
  H.eq(J(S.labels()), J(X.startDepthOptions("overdrive").map(d => "LEVEL " + d).slice(0, S.labels().length)),
       "⛔ OVERDRIVE's START DEPTH lists Overdrive's record (to LEVEL 13)");
  H.assert(S.labels().includes("LEVEL 13") && !S.labels().includes("LEVEL 15"), "⛔ and stops there");
  S.press("Escape");                                                 // back to MODE
  S.right(1); S.ok();                                                // CLASSIC
  H.assert(S.labels().includes("LEVEL 19") && !S.labels().includes("LEVEL 21"),
           "⛔ and CLASSIC's lists Classic's, to LEVEL 19");

  // ⛔ A RELOAD over the same Map keeps BOTH records.
  const R = build({ store });
  H.eq(J([R.levelRecord("classic").highestCleared(), R.levelRecord("overdrive").highestCleared()]), J([20, 14]),
       "⛔ a reload over the same store reads both modes' records back");
}

// ---------------------------------------------------------------------------
// 6. ⛔ Meta and Leaderboard write no `state`, and spend no draw
// ---------------------------------------------------------------------------

for (const m of ["Meta.runStarted", "Meta.runEnded", "Meta.eligible", "Meta.scores",
                 "Leaderboard.queueLength", "Leaderboard.present", "Leaderboard.load"]) {
  H.assert((metaLog.calls[m] || 0) > 0, `non-vacuity: ${m}() was called (${metaLog.calls[m] || 0})`);
}
const total = Object.values(metaLog.calls).reduce((a, b) => a + b, 0);
H.eq(metaLog.moved.length, 0,
     `⛔ state hashed around every Meta and Leaderboard call (${total}): never moved, no draw${metaLog.moved.length ? " — " + metaLog.moved.slice(0, 3).join("; ") : ""}`);

H.report("test-cs012-p3.js");

})().catch(e => { console.error(e); process.exit(1); });
