// test-cs011-p6.js — CS011's closing phase: the NINTH SOAK. One front-door
// session played TWICE, once over a working store and once with storage
// blocked; ⛔ the whole-board hash matches on every frame, so persistence cannot
// steer a run (plan §8, §10 item 12). The script: PROFILE → NEW PROFILE, "SOAK"
// typed and selected; OPTIONS' MUSIC VOLUME and CONTROLS' MOUSE SENSITIVITY
// moved; Start Depths 1, 13 and 23 with RESTART and QUIT TO TITLE, one run
// touched by a bench digit, one quit from pause; a recording fake leaderboard.
// The working session also holds: no enumeration read; every stored key
// declared and no `coinless.lb.*`; one local row per eligible run end that
// placed; one submit per eligible run end, none for the bench run; `state`
// unmoved by every `Meta` call. Then a RELOAD over the working Map.
//
// ⛔ TRAPS. 1. Seed, Date.now and build are re-made per session, in that order.
//  2. Two live steps before the first press; stop pressing at game over, and
//     restart through the menu (test-cs008-p8.js, test-cs009-p6.js).
//  3. The profile and the settings come BEFORE the runs: a switch resets the
//     settings, and the record staged for Start Depth 23 lands on SOAK.
//  4. Space held for fire is released before a pause press, or it confirms.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260922;
installSeed(SEED);                          // ⛔ above the first buildGame() (trap 1)

const J = JSON.stringify;
const NS = "coinless.vector-vortex.";
const DEPTHS = [1, 13, 23];
const RECORD = 23;                          // a sitting's noteCleared, staged on SOAK (trap 3)
const HOLD_TICKS = 9000;                    // test-cs008-p8.js trap 2
const SEGMENT_CAP = 40000;
const PIN_TICKS = 300;
const BENCH_CASE = 1, BENCH_AT = 600;       // run 0 of Start Depth 13: a `1` in play
const QUIT_CASE = 2, QUIT_AT = 900;         // run 1 of Start Depth 23: pause → QUIT TO TITLE
const MEASURE = !!process.env.P6_MEASURE;

// test-cs009-p6.js's drive, unchanged.
function drive(inp, i) {
  if (i % 7 === 0)   inp.mouseMove(((i * 37) % 181) - 90);
  if (i % 53 === 0)  inp.keyDown("ArrowRight");
  if (i % 53 === 11) inp.keyUp("ArrowRight");
  if (i % 71 === 0)  inp.keyDown("ArrowLeft");
  if (i % 71 === 31) inp.keyUp("ArrowLeft");
  if (i % PIN_TICKS === 0) inp.mouseMove((Math.floor(i / PIN_TICKS) % 2) ? 4000 : -4000);
  if (i >= HOLD_TICKS) { if (i === HOLD_TICKS) { inp.keyUp(" "); inp.keyUp("x"); } return; }
  if (i === 0) inp.keyDown(" ");
  if (i % 311 === 0) inp.keyDown("x");
  if (i % 311 === 4) inp.keyUp("x");
}

// test-cs009-p6.js's whole-board hasher, unchanged.
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

// test-cs011-p5.js's recording fake, trimmed to what a run end calls.
function fakeKit() {
  const rec = { creates: 0, beginRuns: 0, submits: [] };
  rec.module = {
    create(config) {
      rec.creates++;
      return {
        beginRun() { rec.beginRuns++; return "run"; },
        submit(result) {
          rec.submits.push({ result: JSON.parse(J(result)), player: config.getPlayer() });
          return Promise.resolve({ status: "submitted" });
        },
        fetchBoard() { return new Promise(() => {}); },
        queueLength() { return 0; },
        flushQueue() { return Promise.resolve({ sent: 0, failed: 0, dropped: 0 }); },
      };
    },
  };
  return rec;
}

// ===========================================================================
// ONE SESSION
// ===========================================================================

function session(storage) {
  installSeed(SEED);                        // trap 1
  let now = 0;
  Date.now = () => (now += 7919);
  const store = new Map();
  // ⛔ CS017 P2 (plan S7-B): the bench is bound only in a C.DEBUG_KEYS build, and
  // BENCH_CASE presses `1`, so the session flips it: "a bench exists".
  const X = H.buildGame({ store, storage, mutate: [["  DEBUG_KEYS:           false,", "  DEBUG_KEYS:           true,"]] });
  const { C, state } = X;
  const G = X.Game, MS = C.FIXED_DT * 1000;
  const lb = fakeKit();
  X._env.win.KitLeaderboard = lb.module;

  const out = {
    X, store, lb, hashes: [], steps: 0, exceptions: [], stuck: [], cases: [], levels: new Set(),
    script: {}, set: {}, meta: { calls: 0, moved: 0, first: null, byName: {} },
    ends: [],
  };

  // ---- ⛔ every Meta call: the whole state before and after ------------------
  const hashState = makeHasher(X, () => null);
  const orig = Object.assign({}, X.Meta);
  const classic = () => X.Scores.list("classic");
  for (const name of Object.keys(orig)) {
    if (typeof orig[name] !== "function") continue;
    X.Meta[name] = function () {
      const end = name === "runEnded" && orig.runOpen() ? {
        outcome: arguments[0], eligible: orig.eligible(), score: state.score,
        startDepth: state.startDepth, wells: state.tally.wellsCleared, rows: classic().length, submits: lb.submits.length,
      } : null;
      const h0 = hashState();
      const r = orig[name].apply(this, arguments);
      out.meta.calls++;
      out.meta.byName[name] = (out.meta.byName[name] || 0) + 1;
      if (hashState() !== h0) { out.meta.moved++; if (!out.meta.first) out.meta.first = `${name} on ${state.screen}`; }
      if (end) {
        const rows = classic();
        end.rowsAfter = rows.length;
        end.submitsAfter = lb.submits.length;
        end.place = orig.lastPlace();
        end.row = end.place > 0 ? rows[end.place - 1] : null;
        out.ends.push(end);
      }
      return r;
    };
  }
  const hash = makeHasher(X, () => [G.hitStopLeft, G.menu.cursor, G.stats.ticks]);
  let clock = 0;
  function halfFrame() { clock += MS / 2; G.frame(clock); out.hashes.push(hash()); }
  function liveStep() {
    const want = G.stats.ticks + 1;
    for (let n = 0; G.stats.ticks < want && n < 8; n++) halfFrame();
  }
  function press(k) { G.input.keyDown(k); liveStep(); G.input.keyUp(k); liveStep(); }
  function tap(k, n) { for (let i = 0; i < n; i++) { G.input.keyDown(k); liveStep(); liveStep(); G.input.keyUp(k); liveStep(); } }
  const right = n => tap("ArrowRight", n), left = n => tap("ArrowLeft", n);
  function releaseAll() { for (const k of [" ", "x", "1", "ArrowLeft", "ArrowRight"]) G.input.keyUp(k); }
  const snap = () => G.settingsHooks.settingsSnapshot();

  // Returns true when the run left play through pause's QUIT TO TITLE.
  function playSegment(k, seg) {
    let i = 0, drivenFor = -1, guard = 0;
    while (state.screen !== "gameover") {
      if (state.screen !== "play" || i > SEGMENT_CAP || guard++ > SEGMENT_CAP * 4) {
        out.stuck.push(`case ${k} run ${seg}: on "${state.screen}" at step ${i}`);
        throw new Error("the segment did not end in game over");
      }
      if (k === QUIT_CASE && seg === 1 && i === QUIT_AT && G.hitStopLeft === 0) {
        releaseAll();                       // trap 4
        press("Escape");
        const paused = state.screen === "pause";
        right(2);
        press(" ");                          // QUIT TO TITLE
        out.script.pauseQuit = paused && state.screen === "title";
        liveStep();
        return true;
      }
      if (G.hitStopLeft === 0 && drivenFor !== i) {
        drive(G.input, i);
        if (k === BENCH_CASE && seg === 0 && i === BENCH_AT) G.input.keyDown("1");
        if (k === BENCH_CASE && seg === 0 && i === BENCH_AT + 2) G.input.keyUp("1");
        drivenFor = i;
      }
      const t0 = G.stats.ticks;
      halfFrame();
      if (G.stats.ticks === t0) continue;
      i++;
      out.steps++;
      out.levels.add(state.level);
    }
    releaseAll();                           // trap 2
    for (let n = 0; G.hitStopLeft > 0 && n < 1000; n++) halfFrame();
    liveStep(); liveStep();
    return false;
  }

  halfFrame();
  liveStep(); liveStep();                   // trap 2: the title's entry step

  try {
    // ---- PROFILE: NEW PROFILE, "SOAK" typed, Enter (trap 3) ----
    right(3); press(" ");                   // title → PROFILE
    const onProfile = state.screen === "profile";
    right(X.Profiles.list().length); press(" ");   // NEW PROFILE → NAME
    const onName = state.screen === "profileName";
    for (const ch of "soak") press(ch);
    press("Enter");
    const cur = X.Profiles.current();
    out.script.profile = onProfile && onName && state.screen === "profile" && cur.name === "SOAK";
    out.set.profileId = cur.id;
    press("Escape");                        // → title

    // ---- OPTIONS: MUSIC VOLUME down two, CONTROLS' MOUSE SENSITIVITY up two ----
    const before = snap();
    right(1); press(" ");                   // title → OPTIONS
    const onOptions = state.screen === "options";
    right(5); press(" ");                   // MUSIC VOLUME, adjusting
    left(2); press(" ");                    // a Fire ends the row, keeping the value
    left(3); press(" ");                    // CONTROLS
    const onControls = state.screen === "controls";
    press(" ");                             // MOUSE SENSITIVITY, adjusting
    right(2); press(" ");
    press("Escape"); press("Escape");       // → OPTIONS → title
    const after = snap();
    out.set.music = after.sound.music;
    out.set.mouse = after.controls.mouse;
    out.script.options = onOptions && onControls && state.screen === "title" &&
                         after.sound.music < before.sound.music && after.controls.mouse > before.controls.mouse;
  } catch (err) {
    out.exceptions.push(`setup: ${err && err.stack ? err.stack.split("\n").slice(0, 3).join(" | ") : err}`);
  }

  X.levelRecord("classic").noteCleared(RECORD);   // trap 3, on SOAK (per mode, CS012 P3)

  for (let k = 0; k < DEPTHS.length; k++) {
    const depth = DEPTHS[k];
    const r = { depth, started: false, restarted: false, quit: false };
    try {
      press(" ");                                          // PLAY
      // ⛔ REPAIRED IN PLACE AT CS012 P3 (O9): OVERDRIVE is MODE's first row, so
      // one step down restores this soak's precondition — a CLASSIC run on both
      // sides of the paired session, which is what makes the hashes comparable.
      right(1);                                            // OVERDRIVE -> CLASSIC
      press(" ");                                          // CLASSIC
      const row = X.startDepthOptions("classic").indexOf(depth);
      for (let n = 0; n < row; n++) right(1);
      press(" ");                                          // LEVEL d
      r.started = row >= 0 && state.screen === "play" && state.level === depth;
      playSegment(k, 0);
      press(" ");                                          // RESTART
      r.restarted = state.screen === "play" && state.startDepth === depth;
      if (playSegment(k, 1)) {
        r.quit = state.screen === "title";
      } else {
        right(1);
        press(" ");                                        // QUIT TO TITLE
        r.quit = state.screen === "title";
        liveStep();
      }
    } catch (err) {
      out.exceptions.push(`case ${k}: ${err && err.stack ? err.stack.split("\n").slice(0, 3).join(" | ") : err}`);
      releaseAll();
      G.quitToTitle();
      liveStep(); liveStep();
    }
    out.cases.push(r);
  }
  out.table = J(X.Scores.list("classic"));
  return out;
}

// ===========================================================================
// THE TWO SESSIONS, AND A RELOAD
// ===========================================================================

const work = session(undefined);
const blocked = session("blocked");

if (MEASURE) {
  const brief = s => ({ steps: s.steps, frames: s.hashes.length, script: s.script, set: s.set, meta: s.meta,
                        ends: s.ends.map(e => Object.assign({}, e, { row: e.row && e.row.score })),
                        levels: [...s.levels].sort((a, b) => a - b), cases: s.cases,
                        keys: [...s.store.keys()], submits: s.lb.submits.length, exceptions: s.exceptions });
  console.log(J({ work: brief(work), blocked: brief(blocked) }, null, 1));
}

const first = g => g.first ? ` — first: ${g.first}` : "";

// ---------------------------------------------------------------------------
// the front door
// ---------------------------------------------------------------------------
H.eq(work.exceptions.length + blocked.exceptions.length, 0,
     `⛔ no exception in either session${work.exceptions[0] || blocked.exceptions[0] ? " — " + (work.exceptions[0] || blocked.exceptions[0]) : ""}`);
H.eq(work.stuck.length, 0, `every run reached game over or its quit${work.stuck[0] ? " — " + work.stuck[0] : ""}`);
H.assert(work.script.profile, "PROFILE → NEW PROFILE → SOAK typed and committed, and selected");
H.assert(work.script.options, `OPTIONS: MUSIC VOLUME down and MOUSE SENSITIVITY up (${J(work.set)})`);
for (const [k, r] of work.cases.entries()) {
  H.assert(r.started && r.restarted && r.quit, `case ${k}: START DEPTH ${r.depth} → play → RESTART → back to the title (${J(r)})`);
}
H.assert(work.script.pauseQuit, "one run quit from pause through QUIT TO TITLE");
H.assert(work.levels.has(1) && work.levels.has(13) && work.levels.has(23), "non-vacuity: runs played at levels 1, 13 and 23");

// ---------------------------------------------------------------------------
// ⛔ blocked storage plays the same session, frame for frame
// ---------------------------------------------------------------------------
{
  let firstDiff = -1;
  const n = Math.min(work.hashes.length, blocked.hashes.length);
  for (let i = 0; i < n; i++) if (work.hashes[i] !== blocked.hashes[i]) { firstDiff = i; break; }
  H.eq(work.hashes.length, blocked.hashes.length, "⛔ both sessions ran the same number of frames");
  H.eq(firstDiff, -1, `⛔ the whole-board hash is identical on every frame, working store and blocked (${n} frames)`);
  H.eq(work.steps, blocked.steps, "and the same number of play steps");
  H.assert(new Set(work.hashes).size > n / 4, "non-vacuity: the hash moves with the board");
  H.eq(J(blocked.ends), J(work.ends), "⛔ the same run ends, rows and submits in both sessions");
  H.eq(blocked.table, work.table, "and the same table, the blocked one in memory");
  H.eq(blocked.store.size, 0, "fixture: the blocked session wrote nothing to the Map");
}

// ---------------------------------------------------------------------------
// the working session's storage
// ---------------------------------------------------------------------------
H.eq(work.X._env.storageReads, 0, "⛔ no enumeration read across the session (localStorage.length, key(i))");
{
  const id = work.set.profileId;
  H.eq(id, "p1", "fixture: SOAK is p1");
  // ⛔ REPAIRED IN PLACE AT CS015 P1: `achievements` is a declared per-profile
  // key (GDD 15.1). The claim is unchanged — every stored key is declared.
  // ⛔ And again at CS016 P1: `onboarding` is a declared per-profile key.
  const declared = new RegExp(`^${NS.replace(/\./g, "\\.")}(profiles|scores|(p1\\.)?(settings|progress|telemetry|achievements|onboarding))$`);
  const keys = [...work.store.keys()];
  const stray = keys.filter(k => !declared.test(k));
  H.eq(J(stray), "[]", `⛔ every stored key is declared (${J(keys)})`);
  H.eq(keys.filter(k => k.indexOf("coinless.lb.") === 0).length, 0, "⛔ no coinless.lb.* key written");
  for (const k of ["profiles", "scores", "p1.settings", "p1.progress"]) {
    H.assert(work.store.has(NS + k), `non-vacuity: ${k} is stored`);
  }
}

// ---------------------------------------------------------------------------
// the run ends: one row per eligible end that placed, one submit per eligible end
// ---------------------------------------------------------------------------
{
  const ends = work.ends, benched = ends.filter(e => !e.eligible), quits = ends.filter(e => e.outcome === "quit");
  H.eq(ends.length, 6, "fixture: six run ends (three cases, two runs each)");
  H.eq(J([benched.length, quits.length]), "[1,1]", "fixture: one bench run and one quit from pause");
  H.eq(J(ends.map(e => e.outcome)), J(["died", "died", "died", "died", "died", "quit"]), "the outcomes, in order");
  let rowsOk = 0, submitsOk = 0;
  for (const [i, e] of ends.entries()) {
    const placed = e.eligible && e.score > 0;
    H.assert(e.rows < work.X.C.SCORES_PER_MODE, `fixture: end ${i} met a table with room (${e.rows})`);
    const row = e.row || {};
    if (e.rowsAfter === e.rows + (placed ? 1 : 0) && (!placed || (row.score === e.score && row.outcome === e.outcome &&
        row.profileName === "SOAK" && row.startDepth !== undefined))) rowsOk++;
    else H.assert(false, `⛔ end ${i}: ${J(e)}`);
    if (e.submitsAfter === e.submits + (e.eligible ? 1 : 0)) submitsOk++;
  }
  H.eq(rowsOk, ends.length, "⛔ one local row per eligible run end that placed, stamped SOAK, and none otherwise");
  H.eq(submitsOk, ends.length, "⛔ one submit per eligible run end, and none for the bench run");
  H.eq(work.lb.submits.length, ends.filter(e => e.eligible).length, "and no submit anywhere else");
  H.eq(J(work.lb.submits.map(s => s.result.outcome)), J(ends.filter(e => e.eligible).map(e => e.outcome)),
       "each submit carries its run's outcome");
  H.eq(J(work.lb.submits.map(s => s.result.metric)), J(ends.filter(e => e.eligible).map(e => e.score)),
       "and its final score");
  H.assert(work.lb.submits.every(s => s.player.displayName === "SOAK"), "every submit posts under SOAK");
  H.assert(ends.filter(e => e.eligible && e.score > 0).length >= 4, "non-vacuity: at least four runs placed");
  H.eq(benched[0] && benched[0].score > 0, true, "non-vacuity: the bench run scored, and still recorded nothing");
}

H.eq(work.meta.moved, 0, `⛔ state is unmoved by every Meta call (${work.meta.calls} calls)${first(work.meta)}`);
H.assert(["runStarted", "benchUsed", "runOpen", "runEnded", "saveSettings"].every(n => work.meta.byName[n] > 0),
         `non-vacuity: the run seats, the bench flag and the settings save were all called (${J(work.meta.byName)})`);

// ---------------------------------------------------------------------------
// the reload: a second build over the working Map
// ---------------------------------------------------------------------------
{
  installSeed(SEED);
  const R = H.buildGame({ store: work.store });
  const cur = R.Profiles.current();
  H.eq(J([cur.id, cur.name]), J(["p1", "SOAK"]), "⛔ reload: SOAK is selected");
  const s = R.Game.settingsHooks.settingsSnapshot();
  H.eq(J([s.sound.music, s.controls.mouse]), J([work.set.music, work.set.mouse]), "⛔ reload: MUSIC VOLUME and MOUSE SENSITIVITY as set");
  // A run clears its levels in order from its Start Depth, so its highest
  // cleared is startDepth + wells - 1, read off the board at the run's end.
  const top = Math.max(RECORD, ...work.ends.filter(e => e.wells > 0).map(e => e.startDepth + e.wells - 1));
  H.assert(top > RECORD, `non-vacuity: the session cleared past the staged record (${top})`);
  H.eq(R.levelRecord().highestCleared(), top, "⛔ reload: SOAK's record is the highest level the session cleared");
  const list = R.startDepthOptions();
  const want = Math.min(R.C.START_DEPTH_CAP, top % 2 === 1 ? top : top - 1);
  H.eq(list[list.length - 1], want, `⛔ reload: the Start Depth list reaches it (${list[list.length - 1]})`);
  H.eq(J(R.Scores.list("classic")), work.table, "⛔ reload: the table intact");
  H.eq(R._env.storageReads, 0, "and the reload reads no enumeration either");
}

H.report("test-cs011-p6.js");
