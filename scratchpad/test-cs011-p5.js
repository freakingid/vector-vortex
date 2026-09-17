// test-cs011-p5.js — CS011 P5: the online board (GDD 15.4; plan §7, R9, R15,
// R16, R18, R19; Paul's M5, M6, M9). With no module nothing is called, SCORES is
// P3's, the title has no line and a run plays to game over; a module arriving
// late is picked up. With a recording fake: one beginRun per startGame(), one
// submit per eligible run end and never two, none for a bench run, R9's payload
// with the Worker registry's stats keys (read from coinless-kit, never copied),
// ANONYMOUS submitting with the hint; ONLINE's four states and a stale response
// dropped (with the mutation); the queued line. The REAL kit-leaderboard 0.2.1
// in Node without randomUUID mints a v4 and posts the Worker's shape, and 0.2.0's
// beginRun throws (the mutation).
//
// ⛔ TRAPS.
//  1. A fresh build boots to the title: two live steps before the first press.
//  2. The fake's promises settle on microtasks: drain() before reading a screen.
//  3. The bridge is <script type="module"> and never runs here: the fake is set
//     on X._env.win, which is the game's `window`.
"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

installSeed(20260921);                      // ⛔ above the first buildGame()

const ROOT = path.join(__dirname, "..");
const J = JSON.stringify;
const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const HINT = "NAME YOUR PROFILE TO POST UNDER YOUR NAME";
const TOKEN = "const answer = b => { if (t === token) done(b); };";
const drain = () => new Promise(r => setImmediate(r));

// ---------------------------------------------------------------------------
// the registry: coinless-kit's services/leaderboard/src/registry.js at f0b0eb2
// ---------------------------------------------------------------------------

function readRegistry() {
  try {
    const text = execFileSync("git", ["-C", path.join(ROOT, "..", "coinless-kit"), "show",
                                      "f0b0eb2:services/leaderboard/src/registry.js"],
                              { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    if (text.indexOf("export const GAMES =") < 0) return null;
    return new Function(text.replace("export const GAMES =", "return"))();
  } catch (e) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// the builds, a recording fake module and a driver
// ---------------------------------------------------------------------------

function fakeKit() {
  // ⛔ THE QUEUE IS PER BOARD since CS012 P3 (R8): the kit keys its offline queue
  // coinless.lb.<gameId>.v1, so one fake serving two clients must count them
  // apart — this file's claim is the LINE's wording, not the sum.
  const rec = { creates: [], beginRuns: 0, submits: [], fetches: [], pending: [], queues: {} };
  rec.module = {
    create(config) {
      rec.creates.push(config);
      return {
        beginRun() { rec.beginRuns++; return "run"; },
        submit(result) {
          rec.submits.push({ result: JSON.parse(J(result)), player: config.getPlayer() });
          return Promise.resolve({ status: "submitted" });
        },
        fetchBoard(opts) {
          rec.fetches.push(opts);
          return new Promise((res, rej) => rec.pending.push({ res, rej }));
        },
        queueLength() { return rec.queues[config.gameId] || 0; },
        flushQueue() { return Promise.resolve({ sent: 0, failed: 0, dropped: 0 }); },
      };
    },
  };
  return rec;
}

function build(opts) {
  const X = H.buildGame(Object.assign({ spy: ["drawMenu"] }, opts || {}));
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
    X, st: X.state, steps, liveStep, press,
    right: n => tap("ArrowRight", n),
    ok: () => press(" "),
    boot: () => { G.frame(0); steps(2); },                           // trap 1
    draw: () => { X.view = null; G.draw(); return X.view; },
    // ⛔ THE right(1) IS CS012 P3's REPAIR (O9): OVERDRIVE is MODE's first row, so
    // one step down restores this file's precondition, a CLASSIC run.
    play: () => { S.ok(); S.right(1); S.ok(); S.ok(); },             // title → PLAY → CLASSIC → LEVEL 1
    toScores: () => { S.right(2); S.ok(); },                         // title → SCORES
    // The last life spent, then frames until a step has run on game over.
    die: () => {
      X.state.lives = 1;
      X.killSkimmer(X.state);
      for (let n = 0; n < 400 && (G.hitStopLeft > 0 || X.state.screen !== "gameover"); n++) halfFrame();
      steps(2);
    },
    labels: () => S.draw().items.map(r => r.label),
  };
  return S;
}

(async function main() {

// ---------------------------------------------------------------------------
// 1. no module: nothing called, P3's SCORES, no line, a run to game over
// ---------------------------------------------------------------------------

{
  const X = build(), S = session(X), st = X.state, LB = X.Leaderboard;
  H.assert(LB !== null, "fixture: Leaderboard is in the build");
  S.boot();
  H.eq(J(S.draw().lines), "[]", "⛔ no module: the title has no info line");
  S.toScores();
  const v = S.draw();
  // ⛔ CS012 P3 (O10): the MODE row is there with or without the module, and with
  // no run started this session SCORES opens on MODE's first row, OVERDRIVE.
  H.eq(J([st.screen, v.lines, v.items.map(r => r.label)]), J(["scores", ["OVERDRIVE · LOCAL", "NO SCORES YET"], ["MODE", "BACK"]]),
       "⛔ no module: SCORES has no VIEW row (P3's screen), and MODE stays");
  S.press("Escape");
  let answered = 0;
  H.eq(J([LB.present(), LB.queueLength()]), "[false,0]", "no module: present() false, queueLength() 0");
  LB.beginRun(); LB.submit("died"); LB.load("classic", () => { answered++; });
  await drain();
  H.eq(answered, 0, "no module: load() never answers");
  S.play();
  H.eq(st.screen, "play", "fixture: a run through the front door");
  X.addScore(300);
  S.die();
  H.eq(J([st.screen, X.Scores.list("classic").length]), J(["gameover", 1]), "⛔ no module: the run plays to game over and records locally");
  H.eq(st.mode, "classic", "fixture: and it was a CLASSIC run");

  // The bridge is async: a module landing after boot is picked up by the next
  // call that looks, and nothing before it reached a fake it never saw.
  const rec = fakeKit();
  X._env.win.KitLeaderboard = rec.module;
  H.eq(rec.creates.length, 0, "fixture: installing the module calls nothing");
  S.right(1); S.ok();                                                // QUIT TO TITLE
  // ⛔ REWRITTEN IN PLACE AT CS012 P3 (R8): ONE CLIENT PER MODE, both made by the
  // first call that finds the module. The claim — that a late module is picked up
  // and the ended run is not submitted after the fact — is unchanged.
  H.eq(J([st.screen, rec.creates.length, rec.submits.length]), J(["title", 2, 0]),
       "⛔ a late module makes both clients on the next title step, and the ended run is not submitted after the fact");
}

// ---------------------------------------------------------------------------
// 2. the submits
// ---------------------------------------------------------------------------

const REG = readRegistry();
const rec = fakeKit();
const X = build(), S = session(X), st = X.state, C = X.C;
X._env.win.KitLeaderboard = rec.module;
S.boot();

{
  // ⛔ REWRITTEN IN PLACE AT CS012 P3 (R8): one client PER MODE, made once each,
  // lazily, on the first call that finds the module — Classic's first, because
  // C.LEADERBOARD_GAME_IDS names it first. test-cs012-p3.js owns the two ids.
  H.eq(rec.creates.length, 2, "⛔ the clients are made once each, lazily: one per mode");
  const cfg = rec.creates[0];
  H.eq(J([cfg.endpoint, cfg.gameId, cfg.gameVersion]), J([C.LEADERBOARD_ENDPOINT, C.GAME_ID, C.GAME_VERSION]),
       "⛔ the FIRST create() is Classic's, and gets C's endpoint, game id and version");
  H.eq(C.LEADERBOARD_ENDPOINT, "https://scores.coinlessgames.com", "C.LEADERBOARD_ENDPOINT (plan R18)");
  H.eq(typeof cfg.getPlayer, "function", "getPlayer is a callback");
}

// Every payload: integers, the two outcomes, and the registry's stats keys.
function checkPayload(sub, label) {
  const r = sub.result;
  H.eq(J(Object.keys(r).sort()), J(["durationS", "metric", "outcome", "stats"]), `${label}: R9's four fields`);
  H.assert(Number.isInteger(r.metric) && r.metric >= 0, `⛔ ${label}: metric is an integer (${r.metric})`);
  H.assert(Number.isInteger(r.durationS) && r.durationS >= 0, `⛔ ${label}: durationS is an integer (${r.durationS})`);
  H.assert(r.outcome === "died" || r.outcome === "quit", `⛔ ${label}: outcome is died or quit (${r.outcome})`);
  if (REG === null) { H.skip(`${label}: coinless-kit's registry.js at f0b0eb2 is not readable beside this repo`); return; }
  H.eq(J(Object.keys(r.stats).sort()), J(REG[C.GAME_ID].statsFields.slice().sort()),
       `⛔ ${label}: stats keys are exactly the registry's statsFields`);
  for (const k of Object.keys(r.stats)) {
    if (k === "mode") H.eq(r.stats[k], "classic", `${label}: stats.mode`);
    else H.assert(Number.isInteger(r.stats[k]), `${label}: stats.${k} is an integer (${r.stats[k]})`);
  }
}

{
  const b0 = rec.beginRuns;
  for (let i = 1; i <= 3; i++) X.startGame(i);
  H.eq(rec.beginRuns - b0, 3, "⛔ one beginRun per startGame()");
  X.Game.quitToTitle();                                              // from play: no run end
  S.steps(2);
  H.eq(J([st.screen, rec.submits.length]), J(["title", 0]), "fixture: back on the title, nothing submitted");

  // A death, the frames after it, then game over's QUIT TO TITLE.
  const b1 = rec.beginRuns;
  S.play();
  H.eq(rec.beginRuns - b1, 1, "⛔ the front door's run began once");
  X.addScore(1234);
  S.die();
  H.eq(rec.submits.length, 1, "⛔ the death submitted once");
  H.eq(J([rec.submits[0].result.metric, rec.submits[0].result.outcome]), J([1234, "died"]), "with the final score, 'died'");
  checkPayload(rec.submits[0], "died");
  H.eq(J([rec.submits[0].player.displayName, V4.test(rec.submits[0].player.playerId)]), J([C.PROFILE_ANONYMOUS_NAME, true]),
       "⛔ M9: the silent profile submits as ANONYMOUS, with its v4 playerId");
  S.steps(120);
  S.right(1); S.ok();                                                // QUIT TO TITLE
  H.eq(J([st.screen, rec.submits.length]), J(["title", 1]), "⛔ game over's frames and QUIT TO TITLE never submit twice");

  // RESTART: a new run, and still one submit per run end.
  S.play();
  X.addScore(500);
  S.die();
  H.eq(rec.submits.length, 2, "fixture: the second run submitted");
  const b2 = rec.beginRuns;
  S.ok();                                                            // RESTART
  H.eq(J([st.screen, rec.beginRuns - b2, rec.submits.length]), J(["play", 1, 2]),
       "⛔ RESTART begins a run and submits nothing more");
  X.addScore(700);
  S.die();
  H.eq(rec.submits.length, 3, "and the restarted run submits its own end");
  S.right(1); S.ok();

  // Quit from pause, with R9's stats staged.
  S.play();
  X.addScore(77);
  st.time = 12.6;
  st.tally.wellsCleared = 3;
  st.tally.purgesSpent = 2;
  st.tally.deaths = 1;
  S.press("Escape");
  H.eq(st.screen, "pause", "fixture: paused");
  S.right(2); S.ok();                                                // QUIT TO TITLE
  H.eq(rec.submits.length, 4, "⛔ quit from pause submitted once");
  const q = rec.submits[3].result;
  H.eq(J([q.metric, q.durationS, q.outcome]), J([77, 13, "quit"]), "⛔ 'quit' with the pre-quit score and Math.round(state.time)");
  H.eq(J([q.stats.level_reached, q.stats.mode, q.stats.start_depth, q.stats.wells_cleared, q.stats.purges_spent,
          q.stats.max_combo, q.stats.deaths]),
       J([1, "classic", 1, 3, 2, C.TELEMETRY_PLACEHOLDER.maxCombo, 1]), "⛔ R9: the stats read state, the tally and the placeholder");
  checkPayload(rec.submits[3], "quit");

  // A bench-touched run: begun, never submitted.
  const b3 = rec.beginRuns;
  S.play();
  S.press("1");
  X.addScore(99999);
  S.die();
  H.eq(J([rec.beginRuns - b3, rec.submits.length, X.Meta.eligible()]), J([1, 4, false]),
       "⛔ M6: a bench run begins and submits nothing");
  S.right(1); S.ok();
  H.eq(st.screen, "title", "fixture: back on the title");
}

// ---------------------------------------------------------------------------
// 3. ONLINE: loading, reached, failed, empty, a stale response, the hint
// ---------------------------------------------------------------------------

const board = entries => ({ gameId: "vector-vortex", window: "all", entries });

// ⛔ REWRITTEN IN PLACE AT CS012 P3 (O10): SCORES gained a MODE row FIRST, so
// VIEW is row 1 and every entry here steps down to it once. The entry mode is the
// last run started this session, CLASSIC, which is the mode every line below
// names — the claims are the four ONLINE states, the stale drop and the hint.
{
  S.toScores();
  S.right(1);                                                        // MODE → VIEW
  let v = S.draw();
  H.eq(J([st.screen, v.items[1].label, v.items[1].detail, v.lines[0]]), J(["scores", "VIEW", "LOCAL", "CLASSIC · LOCAL"]),
       "⛔ with the module SCORES opens LOCAL, with a VIEW row after MODE");
  H.eq(v.items.slice(2, -1).length, X.Scores.list("classic").length, "and LOCAL still lists the local table");
  S.ok();                                                            // VIEW → ONLINE
  v = S.draw();
  H.eq(J(rec.fetches), J([{ window: "all", limit: C.LEADERBOARD_BOARD_LIMIT }]), "⛔ ONLINE fetches the all-time top 10");
  H.eq(J([v.lines, v.items.map(r => [r.label, r.detail])]),
       J([["CLASSIC · ONLINE", "LOADING…", HINT], [["MODE", "CLASSIC"], ["VIEW", "ONLINE"], ["BACK", ""]]]),
       "⛔ LOADING…, and M9's hint while the profile is ANONYMOUS");

  S.ok(); S.ok();                                                    // LOCAL, ONLINE again
  H.eq(rec.fetches.length, 2, "fixture: a second load began");
  rec.pending[0].res(board([{ rank: 1, displayName: "STALE", metric: 1, flagged: false }]));
  await drain();
  H.eq(J(S.draw().lines.slice(0, 2)), J(["CLASSIC · ONLINE", "LOADING…"]), "⛔ a response for an older load is dropped");
  rec.pending[1].res(board([{ rank: 1, displayName: "ACE", metric: 5000, flagged: false },
                            { rank: 2, displayName: "ANONYMOUS", metric: 1234, flagged: true }]));
  await drain();
  v = S.draw();
  H.eq(J([v.lines, v.items.map(r => [r.label, r.detail])]),
       J([["CLASSIC · ONLINE", HINT], [["MODE", "CLASSIC"], ["VIEW", "ONLINE"], ["1 ACE", "5000"], ["2 ANONYMOUS", "1234*"], ["BACK", ""]]]),
       "⛔ reached: `rank NAME` / score, a flagged row ends in `*`");

  S.ok(); S.ok();
  rec.pending[2].rej(new Error("offline"));
  await drain();
  H.eq(J(S.draw().lines), J(["CLASSIC · ONLINE", "COULD NOT REACH THE BOARD", HINT]), "⛔ rejected: COULD NOT REACH THE BOARD");

  S.ok(); S.ok();
  rec.pending[3].res(board([]));
  await drain();
  v = S.draw();
  H.eq(J([v.lines, v.items.map(r => r.label)]), J([["CLASSIC · ONLINE", "NO SCORES YET", HINT], ["MODE", "VIEW", "BACK"]]),
       "⛔ empty: NO SCORES YET");

  // A named profile: no hint, and the next submit carries the name.
  const p = X.Profiles.current();
  H.eq(X.Profiles.rename(p.id, "ACE").ok, true, "fixture: the profile renamed");
  S.ok(); S.ok();
  rec.pending[4].res(board([]));
  await drain();
  H.eq(S.draw().lines.indexOf(HINT), -1, "⛔ a named profile shows no hint");

  // Leaving the view before the board answers: the late answer changes nothing.
  S.ok(); S.ok();
  S.press("Escape");
  H.eq(st.screen, "title", "fixture: left SCORES while loading");
  rec.pending[5].res(board([{ rank: 1, displayName: "LATE", metric: 9, flagged: false }]));
  await drain();
  S.toScores();
  H.eq(J(S.draw().lines[0]), J("CLASSIC · LOCAL"), "a late answer after leaving leaves SCORES opening LOCAL");
  S.press("Escape");

  S.play();
  S.die();
  H.eq(rec.submits[rec.submits.length - 1].player.displayName, "ACE", "⛔ getPlayer is read at submit time: the new name");
  S.right(1); S.ok();
}

// Mutation: without the token, the older load's answer overwrites the newer.
{
  const r = fakeKit();
  const M = build({ mutate: [[TOKEN, "const answer = b => done(b);"]] }), MS = session(M);
  M._env.win.KitLeaderboard = r.module;
  MS.boot();
  MS.toScores();
  MS.right(1);                                                       // MODE → VIEW
  MS.ok(); MS.ok(); MS.ok();
  r.pending[0].res(board([{ rank: 1, displayName: "STALE", metric: 1, flagged: false }]));
  await drain();
  H.eq(MS.draw().items[2].label, "1 STALE", "⛔ MUTATION: with no stale token the older response is drawn");
}

// ---------------------------------------------------------------------------
// 4. the title's queued line
// ---------------------------------------------------------------------------

{
  H.eq(st.screen, "title", "fixture: on the title");
  rec.queues[C.GAME_ID] = 0;
  S.steps(1);
  H.eq(J(S.draw().lines), "[]", "⛔ an empty queue: no line");
  rec.queues[C.GAME_ID] = 3;
  H.eq(J(S.draw().lines), "[]", "⛔ the line is written in update(), never in draw()");
  S.steps(1);
  const v = S.draw();
  H.eq(J([v.lines, v.items.map(r => r.label)]), J([["3 SCORES QUEUED"], ["PLAY", "OPTIONS", "SCORES", "PROFILE"]]),
       "⛔ three queued: \"3 SCORES QUEUED\", the four rows unchanged");
  rec.queues[C.GAME_ID] = 1;
  S.steps(1);
  H.eq(J(S.draw().lines), J(["1 SCORE QUEUED"]), "one queued: singular");
  rec.queues[C.GAME_ID] = 0;
  S.steps(1);
  H.eq(J(S.draw().lines), "[]", "and the line goes when the queue empties");
}

// ---------------------------------------------------------------------------
// 5. ⛔ the real kit-leaderboard, in Node, without crypto.randomUUID
// ---------------------------------------------------------------------------

process.removeAllListeners("warning");     // Node's typeless-ESM notice on require()

async function realKit(file) {
  const saved = { window: globalThis.window, crypto: globalThis.crypto, fetch: globalThis.fetch };
  const posts = [];
  globalThis.window = { addEventListener() {}, get localStorage() { throw new Error("blocked"); } };
  Object.defineProperty(globalThis, "crypto", { configurable: true, writable: true,
    value: { getRandomValues: a => saved.crypto.getRandomValues(a) } });
  globalThis.fetch = async (url, init) => {
    posts.push({ url, init });
    return { ok: true, status: 200, json: async () => ({ public_id: "p", flagged: false, duplicate: false,
                                                         rank: { all_time: 1, "24h": 1 } }) };
  };
  try {
    const m = require(file);
    const lb = m.create({ endpoint: "https://scores.example", gameId: "vector-vortex", gameVersion: "0.0.7",
                          getPlayer: () => ({ playerId: "3f2a9e5c-1b2d-4c3e-9f4a-5b6c7d8e9f01", displayName: "ANONYMOUS" }) });
    let id = null, threw = null, ids = [];
    // 64 ids, then the run's own: the submit carries the last one minted.
    try { for (let i = 0; i < 64; i++) ids.push(lb.beginRun()); id = lb.beginRun(); } catch (e) { threw = e; }
    const r = threw === null ? await lb.submit({ metric: 1234, durationS: 13, outcome: "died", stats: { level_reached: 1 } }) : null;
    return { version: m.VERSION, id, ids, threw, r, posts };
  } finally {
    Object.defineProperty(globalThis, "crypto", { configurable: true, writable: true, value: saved.crypto });
    globalThis.window = saved.window;
    globalThis.fetch = saved.fetch;
  }
}

{
  const real = await realKit(path.join(ROOT, "lib", "kit-leaderboard", "kit-leaderboard.js"));
  H.eq(real.version, "0.2.1", "⛔ kit-leaderboard's VERSION is 0.2.1");
  H.eq(real.threw && real.threw.message, null, "⛔ beginRun() does not throw without crypto.randomUUID");
  H.assert(V4.test(real.id || ""), `⛔ beginRun() returns a UUID v4 (${real.id})`);
  H.assert(real.ids.every(s => V4.test(s)) && new Set(real.ids).size === real.ids.length, "and 64 more are v4 and distinct");
  H.eq(real.r && real.r.status, "submitted", "fixture: the stubbed Worker accepted it");
  H.eq(real.posts.length, 1, "one POST");
  const post = real.posts[0] || { init: {} };
  H.eq(J([post.url, post.init.method, post.init.headers && post.init.headers["Content-Type"]]),
       J(["https://scores.example/v1/scores", "POST", "application/json"]), "⛔ POST /v1/scores as JSON");
  let body = null;
  try { body = JSON.parse(post.init.body); } catch (e) { /* asserted below */ }
  H.assert(body !== null, "⛔ the body parses");
  if (body !== null) {
    H.eq(J(Object.keys(body).sort()), J(["display_name", "duration_s", "game_id", "game_version", "metric", "outcome",
                                         "player_id", "run_id", "stats", "turnstile_token"]),
         "⛔ the body has the Worker's fields");
    H.eq(body.run_id, real.id, "⛔ run_id is the id beginRun() minted");
    H.assert(V4.test(body.run_id) && V4.test(body.player_id), "⛔ run_id and player_id are v4");
    H.assert(Number.isInteger(body.metric) && Number.isInteger(body.duration_s), "⛔ metric and duration_s are integers");
    H.eq(J([body.game_id, body.outcome, body.display_name]), J(["vector-vortex", "died", "ANONYMOUS"]), "and carry what was sent");
  }
}

// Mutation: 0.2.0's beginRun, in a copy laid out as lib/ is.
{
  const tmp = path.join(__dirname, "tmp", "cs011-p5");
  fs.mkdirSync(path.join(tmp, "kit-leaderboard"), { recursive: true });
  fs.mkdirSync(path.join(tmp, "kit-names"), { recursive: true });
  const src = fs.readFileSync(path.join(ROOT, "lib", "kit-leaderboard", "kit-leaderboard.js"), "utf8");
  const FROM = "currentRunId = mintRunId();";
  H.eq(src.split(FROM).length, 2, "fixture: the mutant's text is in the module exactly once");
  fs.writeFileSync(path.join(tmp, "kit-leaderboard", "kit-leaderboard.js"), src.replace(FROM, "currentRunId = crypto.randomUUID();"));
  fs.copyFileSync(path.join(ROOT, "lib", "kit-names", "kit-names.js"), path.join(tmp, "kit-names", "kit-names.js"));
  const mutant = await realKit(path.join(tmp, "kit-leaderboard", "kit-leaderboard.js"));
  H.assert(mutant.threw !== null && mutant.id === null && mutant.posts.length === 0,
           "⛔ MUTATION: 0.2.0's beginRun throws without crypto.randomUUID, and nothing posts");
}

H.report("test-cs011-p5.js");

})().catch(e => { console.error(e); process.exit(1); });
