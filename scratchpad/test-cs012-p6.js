// test-cs012-p6.js — CS012's closing phase: the TENTH SOAK. Three paired proofs
// over one front-door driver that starts at the boot title (plan §8; GDD 17
// items 1, 3, 8, 9, 12).
//  1. CLASSIC IS UNTOUCHED. One Classic session (Start Depths 1 / 13 / 23,
//     RESTART, a pause, QUIT) played twice: as is, and with the jump key pressed
//     on a fixed FRAME schedule and { stub: [updateCombo, updateJump, comboKill,
//     comboDeath] }. ⛔ The state hash is identical on every frame.
//  2. THE MUSIC CANNOT STEER OVERDRIVE. One Overdrive session (MODE → OVERDRIVE
//     → Start Depths 1 / 7 / 13, scripted jumps, Purges, dives, RESTART, a
//     pause) played on the recording fake and with no audio API. ⛔ Same hash on
//     every frame. The audio side also holds: `drive` scheduled; every intensity
//     and sweep argument in [0, 1]; the high-pass automating on exactly the
//     takeoff and landing frames; and O14's director maximum, recorded.
//  3. OVERDRIVE'S INVARIANTS, on every step of that session (below).
//
// ⛔ TRAPS. 1. Seed, Date.now and build are re-made per session, in that order,
//     and each pair's two sessions start from equal stores.
//  2. Two live steps before the first press; stop pressing at the stop.
//  3. MODE's rows are OVERDRIVE then CLASSIC (CS012 P3, O9): a Classic run steps
//     one row down first.
//  4. `state.input.jump` — and nothing else — is set aside from §1's hash: it is
//     the input under test (test-cs012-p5.js's trap 1).
//  5. ⛔ ITEM 8 HERE IS THE O4 CLAIM, NOT test-cs008-p2.js's TOTAL: a kill call
//     must be a GDD §7 price ON THE BOARD times the multiplier live AT THAT CALL
//     (a step can span a step-up), and every other call an UNMULTIPLIED literal.
//     test-cs012-p4.js owns the per-well bonus reconstruction and its mutations.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260925;
installSeed(SEED);                          // ⛔ above the first buildGame() (trap 1)

const J = JSON.stringify;
const CLASSIC_DEPTHS = [1, 13, 23];
const OD_DEPTHS = [1, 7, 13];
const CLASSIC_RECORD = 23;                  // staged, so the list reaches 23
const OD_RECORD = 13;                       // staged per mode (CS012 P3, O12)
const HOLD_TICKS = 9000;                    // test-cs008-p8.js trap 2
const SEGMENT_CAP = 40000;
const PIN_TICKS = 300;
const PAUSE_CASE = 1, PAUSE_AT = 900;       // run 1 of the middle case
// ⛔ DENSER THAN THE 2.30 s CYCLE (O6): at 60 Hz a cycle is ~138 steps, so most
// of these presses land INSIDE a cooldown and are refused, and about one in four
// takes off. A schedule longer than the cycle never exercises the gate at all.
const JUMP_EVERY = 43, JUMP_HOLD = 6;       // Overdrive's scripted presses, by play step
const CLASSIC_JUMP = 97;                    // §1's fixed FRAME schedule
const MEASURE = !!process.env.P6_MEASURE;

// ⛔ GDD §7's LITERALS (test-cs008-p2.js's trap 1, for its reason).
const GDD = { thornChip: 5, weaver: 50, carrier: 100, vaulter: 150, surger: 200,
              reaver: 300, wellPerLevel: 100, purgeUnspent: 500, noDeath: 1000,
              bounty: 2000 };   // ⛔ CS013 P1: GDD §14.1's Bounty, collected — unmultiplied, not a kill

// ⛔ IT TAKES THE BUILD: `instanceof` is per build and this file runs five
// (test-cs012-p4.js's finding).
function gddPoints(Z, e) {
  if (e instanceof Z.Reaver) return GDD.reaver;      // before Vaulter: it extends it
  if (e instanceof Z.Vaulter) return GDD.vaulter;
  if (e instanceof Z.Carrier) return GDD.carrier;
  if (e instanceof Z.Weaver) return GDD.weaver;
  if (e instanceof Z.Surger) return GDD.surger;
  if (e instanceof Z.Drifter) return e.depth < 1 / 3 ? 250 : e.depth < 2 / 3 ? 500 : 750;
  return 0;   // the Thorn scores per chip; the bolt is not on GDD §7
}

// test-cs009-p6.js's DOM target: a menu press through it is a real gesture, and
// a gesture is what creates the audio context.
function fakeTarget() {
  const l = {};
  return {
    l, visibilityState: "visible",
    addEventListener(type, fn) { (l[type] = l[type] || []).push(fn); },
    removeEventListener(type, fn) { if (l[type]) l[type] = l[type].filter(f => f !== fn); },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
    fire(type, ev) { for (const f of (l[type] || []).slice()) f(Object.assign({ preventDefault() {} }, ev)); },
  };
}

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

// test-cs012-p3.js's recording fake, ONE RECORD PER BOARD.
function fakeKit() {
  const rec = { creates: [], boards: {} };
  const of = id => (rec.boards[id] || (rec.boards[id] = { submits: [], queue: 0 }));
  rec.module = {
    create(config) {
      rec.creates.push(config.gameId);
      const b = of(config.gameId);
      return {
        beginRun() { return "run"; },
        submit(result) {
          b.submits.push({ result: JSON.parse(J(result)), player: config.getPlayer() });
          return Promise.resolve({ status: "submitted" });
        },
        fetchBoard() { return new Promise(() => {}); },
        queueLength() { return b.queue; },
        flushQueue() { return Promise.resolve({ sent: 0, failed: 0, dropped: 0 }); },
      };
    },
  };
  rec.of = of;
  rec.count = id => (rec.boards[id] ? rec.boards[id].submits.length : 0);
  rec.total = () => Object.keys(rec.boards).reduce((n, k) => n + rec.boards[k].submits.length, 0);
  return rec;
}

// ===========================================================================
// ONE SESSION — the whole front door, either mode
// ===========================================================================
//
// `o.mode`      "classic" | "overdrive"
// `o.store`     the Map this session boots and saves over
// `o.stub`      §1's stubbed session (which also presses the jump key)
// `o.audio`     §2's recording-fake session
// `o.instrument` §3's per-step invariants (the audio session alone)
function session(o) {
  installSeed(SEED);                        // trap 1
  let now = 0;
  const tick = o.clock || 7919;
  Date.now = () => (now += tick);
  const opts = { store: o.store, spy: ["addScore", "comboKill", "sfx", "newState", "collectToken"] };
  if (o.stub) opts.stub = ["updateCombo", "updateJump", "comboKill", "comboDeath"];
  if (o.audio) opts.audio = true;
  const X = H.buildGame(opts);
  const { C, state } = X;
  const G = X.Game, M = X.MusicSys, D = X.Director, A = X.AudioSys, rec = X._audio;
  const MS = C.FIXED_DT * 1000;
  const OD = o.mode === "overdrive";
  const DEPTHS = OD ? OD_DEPTHS : CLASSIC_DEPTHS;
  const lb = fakeKit();
  X._env.win.KitLeaderboard = lb.module;

  const out = {
    X, lb, hashes: [], steps: 0, frames: 0, exceptions: [], stuck: [], cases: [],
    levels: new Set(), script: {}, ends: [], reaverFrames: 0, table: null,
    record: { classic: 0, overdrive: 0 },
    // §3
    inv: { steps: 0, first: {}, lattice: 0, peak: 0, nan: 0, bounds: 0, airDeath: 0,
           airShot: 0, cooldown: 0, reaverMode: 0, reaverLevel: 0, reaverLane: 0,
           badKill: 0, badBonus: 0, badTotal: 0, leftover: 0, badBuilds: 0, diveScored: 0 },
    tally: { takeoffs: 0, refused: 0, airSteps: 0, comboLost: 0, dives: 0, killCalls: 0, zeroKills: 0,
             chipCalls: 0, bonusCalls: 0, unmultipliedAtMult: 0, builds: 0, bountyCalls: 0,
             byClass: {}, multsSeen: new Set(), maxMult: 1, maxPeak: 0 },
    // §2
    intensity: { bad: 0, first: null, max: 0, frames: 0 },
    nodes: { max: 0, steps: 0, over: 0, byTrack: {} },
    hp: { node: false, autoFrames: [], flips: [], fns: new Set(), targets: new Set() },
  };
  const fail = (grp, msg) => { out.inv[grp]++; if (!out.inv.first[grp]) out.inv.first[grp] = msg; };

  // ---- the run ends: one submit per eligible end, on the mode's board --------
  {
    const orig = X.Meta.runEnded;
    X.Meta.runEnded = function (outcome) {
      const open = X.Meta.runOpen();
      const row = open ? { outcome, eligible: X.Meta.eligible(), score: state.score,
                           mode: state.mode, startDepth: state.startDepth,
                           wells: state.tally.wellsCleared,
                           classic: lb.count(C.LEADERBOARD_GAME_IDS.classic),
                           overdrive: lb.count(C.LEADERBOARD_GAME_IDS.overdrive) } : null;
      const r = orig.apply(this, arguments);
      if (row) {
        row.classicAfter = lb.count(C.LEADERBOARD_GAME_IDS.classic);
        row.overdriveAfter = lb.count(C.LEADERBOARD_GAME_IDS.overdrive);
        out.ends.push(row);
      }
      return r;
    };
  }

  // ---- §3's per-step bookkeeping -------------------------------------------
  const LATTICE = [];
  for (let m = 1; m <= C.COMBO_MAX; m += C.COMBO_STEP) LATTICE.push(m);
  const REAVER_LEVEL = (C.SPAWN_SCHEDULE_OVERDRIVE.filter(r => r.kind === "reaver")[0] || {}).level;
  const calls = [];
  let lastKills = 0, builds = 0, runBoundary = false, bounties = 0;
  let pre = null, preArr = null, pushedE = null, shots0 = 0;
  let s0 = 0, level0 = 0, diveWas = false, screen0 = "", builds0 = 0;
  let jumpPhase0 = "ground", jumpCool0 = 0, peak0 = 0, deaths0 = 0, latched0 = false;

  X.sfx.before = name => { if (name === "comboLost") out.tally.comboLost++; };
  if (o.instrument) {
    X.addScore.before = function (n) {
      const kill = state.tally.kills > lastKills;
      lastKills = state.tally.kills;
      calls.push({ n, mult: state.combo.mult, kill });
    };
    X.comboKill.before = function () { builds++; };
    // ⛔ CS013 P1 (T6): a collected Bounty is its own unmultiplied event, counted
    // per step so item 8 prices exactly the Bounties the step took.
    X.collectToken.before = function (s, t) { if (t.kind === "bounty") bounties++; };
    // ⛔ startGame() AND quitToTitle() both re-mint `state` (23-main.js), so the
    // one honest boundary marker is newState() itself — `peak` may fall there
    // and nowhere else.
    X.newState.after = function () { runBoundary = true; };
  }

  function preStep() {
    pre = state.enemies.slice();
    preArr = state.enemies;
    pushedE = [];
    preArr.push = function () { pushedE.push.apply(pushedE, arguments); return Array.prototype.push.apply(this, arguments); };
    // ⛔ NOT AN INTERCEPTION OF state.shots.push: updateShots() FILTERS
    // state.shots into a new array BEFORE it fires, so a hook on the pre-step
    // array never sees the shot. `tally.shotsFired` rises inside the fire
    // branch itself (06-shots.js) and is the honest counter.
    shots0 = state.tally.shotsFired;
    s0 = state.score; level0 = state.level; diveWas = state.dive.active; screen0 = state.screen;
    jumpPhase0 = state.jump.phase; jumpCool0 = state.jump.cool;
    latched0 = state.jump.latched;
    peak0 = state.combo.peak; deaths0 = state.tally.deaths;
    // ⛔ `lastKills` is a WITHIN-STEP counter: the kill sites raise
    // state.tally.kills immediately before they score, so re-reading it here
    // survives a run boundary that resets the tally (trap 5).
    lastKills = state.tally.kills;
    calls.length = 0; builds0 = builds; runBoundary = false; bounties = 0;
  }

  function postStep(stepped) {
    delete preArr.push;
    if (!stepped) return;
    out.inv.steps++;
    const T = out.tally;
    const well = X.WELLS[state.wellIndex];

    // ---- the multiplier's lattice, and a peak that never falls --------------
    if (LATTICE.indexOf(state.combo.mult) < 0) fail("lattice", `×${state.combo.mult} off the half-step lattice`);
    if (!runBoundary && state.combo.peak < peak0) fail("peak", `peak fell ${peak0} -> ${state.combo.peak}`);
    // ⛔ `peak` is 0 until the run's FIRST KILL (GDD 14.4: a Classic run reports
    // 0), so the "never below the live multiplier" half starts there.
    if (state.combo.peak > 0 && state.combo.peak < state.combo.mult) {
      fail("peak", `peak ${state.combo.peak} below the live ×${state.combo.mult}`);
    }
    T.multsSeen.add(state.combo.mult);
    if (state.combo.mult > T.maxMult) T.maxMult = state.combo.mult;
    if (state.combo.peak > T.maxPeak) T.maxPeak = state.combo.peak;

    // ---- no NaN, and bounded arrays (GDD 17 item 12) ------------------------
    if (state.enemies.length > C.ENEMY_CAP) fail("bounds", `${state.enemies.length} entities`);
    if (state.shots.length > C.SHOT_MAX) fail("bounds", `${state.shots.length} shots`);
    for (const v of [state.score, state.time, state.level, state.combo.mult, state.combo.since,
                     state.combo.peak, state.jump.t, state.jump.cool,
                     state.skimmer ? state.skimmer.lane : 0]) {
      if (!isFinite(v)) fail("nan", `a non-finite scalar on level ${state.level}`);
    }
    for (const e of state.enemies) {
      if (!isFinite(e.lane) || !isFinite(e.depth)) fail("nan", `${e.constructor.name} lane ${e.lane} depth ${e.depth}`);
    }

    // ---- the Jump: immune airborne, mute airborne, and the cooldown ---------
    // ⛔ THE LANDING STEP IS NOT AN AIRBORNE STEP. updateJump() runs at the TOP
    // of the step, above updateShots() and the collision pass (23-main.js), so a
    // step that BEGINS airborne can end in `recover` — which is contact-lethal
    // and cannot fire, by design (O6). The invariant is about a step that is
    // airborne at BOTH ends; MEASURED, a pre-step reading alone calls two legal
    // landing deaths a breach.
    if (jumpPhase0 === "air" && state.jump.phase === "air") {
      T.airSteps++;
      if (state.tally.deaths > deaths0) fail("airDeath", `a contact death on an airborne step, level ${state.level}`);
      if (!runBoundary && state.tally.shotsFired > shots0) {
        fail("airShot", `${state.tally.shotsFired - shots0} shot(s) left the rim airborne`);
      }
    }
    if (jumpPhase0 !== "air" && state.jump.phase === "air") {
      T.takeoffs++;
      if (!(jumpCool0 >= C.JUMP_COOLDOWN)) fail("cooldown", `a takeoff at cool ${jumpCool0.toFixed(4)}`);
    } else if (jumpPhase0 === "ground" && !latched0 && state.jump.latched &&
               jumpCool0 < C.JUMP_COOLDOWN) {
      // ⛔ THE GATE'S OTHER SIDE (O6). The rising edge is read AFTER the step —
      // input.sample() runs inside update(), so the pre-step struct is the
      // previous step's — and updateJump() writes `latched` from the held level
      // every step, so a false → true edge on it IS the press.
      T.refused++;
    }

    // ---- the Reaver: level >= its row, Overdrive only, in range on open wells
    for (const e of state.enemies) {
      if (!(e instanceof X.Reaver)) continue;
      if (state.mode !== "overdrive") fail("reaverMode", `a Reaver in ${state.mode}`);
      if (state.level < REAVER_LEVEL) fail("reaverLevel", `a Reaver at level ${state.level}`);
      if (!well.closed && (e.lane < 0 || e.lane > well.lanes - 1)) {
        fail("reaverLane", `${well.name}: lane ${e.lane} outside [0, ${well.lanes - 1}]`);
      }
    }

    if (state.dive.active !== diveWas && !state.dive.active) T.dives++;
    if (screen0 !== "play") return;

    // ---- ⛔ A DIVE SCORES NOTHING AND BUILDS NOTHING (GDD 5, 7) -------------
    if (diveWas) {
      if (calls.length) fail("diveScored", `${calls.length} addScore calls inside a dive`);
      if (builds !== builds0) fail("badBuilds", "a dive built the combo");
      return;
    }

    // ---- ⛔ ITEM 8, CALL BY CALL (trap 5) -----------------------------------
    const want = [];
    for (const e of pre.concat(pushedE)) {
      if (!e.dead) continue;
      const p = gddPoints(X, e);
      if (p > 0) { want.push(p); T.byClass[e.constructor.name] = (T.byClass[e.constructor.name] || 0) + 1; }
    }
    const allowed = [GDD.thornChip, GDD.wellPerLevel * level0, GDD.purgeUnspent, GDD.noDeath,
                     X.startBonus(state.startDepth)];
    let total = 0;
    for (const c of calls) {
      total += c.n;
      if (c.kill) {
        T.killCalls++;
        if (c.n === 0) { T.zeroKills++; continue; }
        const price = c.n / c.mult;
        const at = want.indexOf(price);
        if (at < 0) fail("badKill", `a kill paid ${c.n} at ×${c.mult} — no GDD §7 price on the board matches`);
        else want.splice(at, 1);
      } else if (c.n === GDD.bounty && bounties > 0) {
        bounties--; T.bountyCalls++;
        if (c.mult > 1) T.unmultipliedAtMult++;
      } else {
        if (allowed.indexOf(c.n) < 0) fail("badBonus", `an unmultiplied call paid ${c.n} at ×${c.mult}`);
        else if (c.n === GDD.thornChip) T.chipCalls++;
        else T.bonusCalls++;
        if (c.mult > 1) T.unmultipliedAtMult++;
      }
    }
    if (want.length) fail("leftover", `${want.length} kill(s) unpaid (${want.join("/")})`);
    if (bounties) fail("leftover", `${bounties} collected Bount(ies) unpaid`);
    if (state.score - s0 !== total) fail("badTotal", "the step's delta is not its calls' sum");
    const built = builds - builds0, scoredKills = calls.filter(c => c.kill).length;
    if (built !== scoredKills) fail("badBuilds", `${built} builds against ${scoredKills} scored kills`);
  }

  // ---- §2's audio instruments (they observe and pass through) ---------------
  let frameArgs = [];
  let hpNode = null, prevAir = false;
  if (o.audio) {
    for (const name of ["setIntensity", "setSweep"]) {
      const f0 = M[name];
      M[name] = function (f) { frameArgs.push(f); return f0.apply(this, arguments); };
    }
    const sched0 = M.scheduleStep;
    M.scheduleStep = function (step, t) {
      const n0 = rec.nodes.length, r = sched0.call(this, step, t), n = rec.nodes.length - n0;
      out.nodes.steps++;
      out.nodes.byTrack[this.state] = (out.nodes.byTrack[this.state] || 0) + 1;
      if (n > out.nodes.max) out.nodes.max = n;
      if (n > C.MUSIC_STEP_NODE_MAX) out.nodes.over++;
      return r;
    };
  }

  function readAudio() {
    out.intensity.frames++;
    for (const v of [D.level, M.intensity, M.sweepLevel].concat(frameArgs)) {
      if (!(typeof v === "number" && v >= 0 && v <= 1)) {
        out.intensity.bad++;
        if (!out.intensity.first) out.intensity.first = `${v} on ${state.screen}`;
      }
    }
    if (D.level > out.intensity.max) out.intensity.max = D.level;
    // ⛔ The high-pass: automation only on the frames jumpAirborne() flipped.
    if (!hpNode) {
      if (M.highpass) { hpNode = M.highpass; out.hp.node = true; prevAir = X.jumpAirborne(state); }
    } else {
      for (const a of rec.automation) {
        if (a.node !== hpNode) continue;
        if (out.hp.autoFrames[out.hp.autoFrames.length - 1] !== out.frames) out.hp.autoFrames.push(out.frames);
        out.hp.fns.add(a.fn);
        out.hp.targets.add(a.v);
      }
      const air = X.jumpAirborne(state);
      if (air !== prevAir) out.hp.flips.push(out.frames);
      prevAir = air;
    }
    rec.clear(); rec.nodes.length = 0;       // test-cs010-p5.js's trap 4
  }

  // ---- the frame loop -------------------------------------------------------
  const hash = makeHasher(X, () => [G.hitStopLeft, G.menu.cursor, G.stats.ticks]);
  function snapHash() {                      // trap 4
    const held = state.input.jump;
    state.input.jump = false;
    const h = hash();
    state.input.jump = held;
    return h;
  }
  let clock = 0;
  function halfFrame() {
    clock += MS / 2;
    if (o.stub) {                            // §1's fixed FRAME schedule
      if (out.frames % CLASSIC_JUMP === 0) G.input.keyDown("arrowup");
      if (out.frames % CLASSIC_JUMP === 11) G.input.keyUp("arrowup");
    }
    if (o.audio) { frameArgs = []; A.ctx && (A.ctx.currentTime = clock / 1000); }
    const t0 = G.stats.ticks;
    if (o.instrument) preStep();
    G.frame(clock);
    if (o.instrument) postStep(G.stats.ticks > t0);
    // ⛔ COUNTED IN EVERY SESSION, instrumented or not: "a Classic run never
    // sees one" is a claim about the two Classic sessions.
    for (let n = 0; n < state.enemies.length; n++) if (state.enemies[n] instanceof X.Reaver) out.reaverFrames++;
    if (o.audio) readAudio();
    out.frames++;
    out.hashes.push(snapHash());
  }
  function liveStep() {
    const want = G.stats.ticks + 1;
    for (let n = 0; G.stats.ticks < want && n < 8; n++) halfFrame();
  }
  // ⛔ EVERY MENU PRESS GOES THROUGH THE DOM HANDLER, so each is a gesture.
  const doc = fakeTarget(), win = fakeTarget(), el = fakeTarget();
  G.input.attach({ document: doc, window: win, element: el });
  function press(k) { doc.fire("keydown", { key: k }); liveStep(); doc.fire("keyup", { key: k }); liveStep(); }
  function tap(k, n) { for (let i = 0; i < n; i++) { doc.fire("keydown", { key: k }); liveStep(); liveStep(); doc.fire("keyup", { key: k }); liveStep(); } }
  const right = n => tap("ArrowRight", n);
  function releaseAll() { for (const k of [" ", "x", "arrowup", "ArrowLeft", "ArrowRight"]) G.input.keyUp(k); }

  // Pause, hold, resume through the pause's back.
  function pauseExcursion(k) {
    releaseAll();                            // a held Fire would confirm
    press("Escape");
    if (state.screen !== "pause") throw new Error(`case ${k}: Escape did not pause (${state.screen})`);
    for (let n = 0; n < 120; n++) liveStep();
    press("Escape");                         // RESUME
    if (state.screen !== "play") throw new Error(`case ${k}: did not resume (${state.screen})`);
    out.script.paused = true;
  }

  function playSegment(k, seg) {
    let i = 0, drivenFor = -1, guard = 0, paused = !(k === PAUSE_CASE && seg === 1);
    while (state.screen !== "gameover") {
      if (state.screen !== "play" || i > SEGMENT_CAP || guard++ > SEGMENT_CAP * 4) {
        out.stuck.push(`case ${k} run ${seg}: on "${state.screen}" at step ${i}`);
        throw new Error("the segment did not end in game over");
      }
      if (!paused && i === PAUSE_AT && G.hitStopLeft === 0) {
        pauseExcursion(k);
        paused = true;
        if (i < HOLD_TICKS) G.input.keyDown(" ");
        continue;
      }
      if (G.hitStopLeft === 0 && drivenFor !== i) {
        drive(G.input, i);
        // ⛔ The takeoffs stop with the fire hold: airborne immunity is 39 % of
        // the cycle (O6), so a jumping passive board outlives its segment cap.
        if (OD && i < HOLD_TICKS) {
          if (i % JUMP_EVERY === 0) G.input.keyDown("arrowup");
          if (i % JUMP_EVERY === JUMP_HOLD) G.input.keyUp("arrowup");
        } else if (OD && i === HOLD_TICKS) G.input.keyUp("arrowup");
        drivenFor = i;
      }
      const t0 = G.stats.ticks;
      halfFrame();
      if (G.stats.ticks === t0) continue;
      i++;
      out.steps++;
      out.levels.add(state.level);
    }
    releaseAll();                            // trap 2
    for (let n = 0; G.hitStopLeft > 0 && n < 1000; n++) halfFrame();
    liveStep(); liveStep();
  }

  halfFrame();
  liveStep(); liveStep();                    // trap 2: the title's entry step
  X.levelRecord("classic").noteCleared(CLASSIC_RECORD);
  X.levelRecord("overdrive").noteCleared(OD_RECORD);

  for (let k = 0; k < DEPTHS.length; k++) {
    const depth = DEPTHS[k];
    const r = { depth, started: false, restarted: false, quit: false };
    try {
      press(" ");                                          // PLAY
      if (!OD) right(1);                                   // trap 3: OVERDRIVE -> CLASSIC
      press(" ");                                          // the mode
      const row = X.startDepthOptions(o.mode).indexOf(depth);
      for (let n = 0; n < row; n++) right(1);
      press(" ");                                          // LEVEL d
      r.started = row >= 0 && state.screen === "play" && state.level === depth &&
                  state.mode === o.mode;
      playSegment(k, 0);
      press(" ");                                          // RESTART
      r.restarted = state.screen === "play" && state.startDepth === depth;
      playSegment(k, 1);
      right(1);
      press(" ");                                          // QUIT TO TITLE
      r.quit = state.screen === "title";
      liveStep();
    } catch (err) {
      out.exceptions.push(`case ${k}: ${err && err.stack ? err.stack.split("\n").slice(0, 3).join(" | ") : err}`);
      releaseAll();
      G.quitToTitle();
      liveStep(); liveStep();
    }
    out.cases.push(r);
  }
  out.tally.builds = builds;
  out.table = { classic: J(X.Scores.list("classic")), overdrive: J(X.Scores.list("overdrive")) };
  out.record = { classic: X.levelRecord("classic").highestCleared(),
                 overdrive: X.levelRecord("overdrive").highestCleared() };
  return out;
}

// ===========================================================================
// THE FOUR SESSIONS — two pairs, over stores that start equal
// ===========================================================================

const S_CLASSIC = new Map();
const classicPlain = session({ mode: "classic", store: S_CLASSIC });
const classicJump = session({ mode: "classic", store: new Map(), stub: true });

// ⛔ The Overdrive pair boots over what the Classic session saved, so the reload
// below can hold BOTH modes. Its two sessions get equal copies of that Map.
const S_OD = S_CLASSIC;
const S_OD_B = new Map(S_CLASSIC);
// ⛔ CS013 P1: the token roll (one draw per Overdrive kill, T2) moved the
// Overdrive boards, and at the shared 7919 ms clock the session stopped
// clearing past its staged 13 (the non-vacuity in §5). The precondition is
// restored by the RUN SEEDS — each run's seed is Date.now() — never relaxed:
// at 7927 the Overdrive pair clears to 16 (MEASURED). The Classic pair keeps 7919.
const OD_CLOCK = 7927;
const odAudio = session({ mode: "overdrive", store: S_OD, audio: true, instrument: true, clock: OD_CLOCK });
const odSilent = session({ mode: "overdrive", store: S_OD_B, clock: OD_CLOCK });

if (MEASURE) {
  const brief = s => ({ frames: s.frames, steps: s.steps, cases: s.cases, script: s.script,
                        levels: [...s.levels].sort((a, b) => a - b), record: s.record,
                        ends: s.ends, inv: s.inv, reaverFrames: s.reaverFrames,
                        tally: Object.assign({}, s.tally, { multsSeen: [...s.tally.multsSeen] }),
                        intensity: s.intensity, nodes: s.nodes,
                        hp: { node: s.hp.node, autos: s.hp.autoFrames.length, flips: s.hp.flips.length,
                              fns: [...s.hp.fns], targets: [...s.hp.targets] },
                        exceptions: s.exceptions });
  console.log(J({ classicPlain: brief(classicPlain), odAudio: brief(odAudio) }, null, 1));
}

const C = classicPlain.X.C;
const first = (g, k) => (g.first && g.first[k] ? ` — first: ${g.first[k]}` : "");

// ---------------------------------------------------------------------------
// the front door, in both modes
// ---------------------------------------------------------------------------
for (const [name, s] of [["classic", classicPlain], ["classic+jump", classicJump],
                         ["overdrive+audio", odAudio], ["overdrive", odSilent]]) {
  H.eq(s.exceptions.length, 0, `⛔ no exception in the ${name} session${s.exceptions[0] ? " — " + s.exceptions[0] : ""}`);
  H.eq(s.stuck.length, 0, `${name}: every run reached game over${s.stuck[0] ? " — " + s.stuck[0] : ""}`);
  for (const [k, r] of s.cases.entries()) {
    H.assert(r.started && r.restarted && r.quit,
             `${name} case ${k}: START DEPTH ${r.depth} → play → RESTART → QUIT TO TITLE (${J(r)})`);
  }
  H.assert(s.script.paused, `${name}: one run paused and resumed`);
}
for (const d of CLASSIC_DEPTHS) H.assert(classicPlain.levels.has(d), `non-vacuity: Classic played at level ${d}`);
for (const d of OD_DEPTHS) H.assert(odAudio.levels.has(d), `non-vacuity: Overdrive played at level ${d}`);
H.eq(classicPlain.reaverFrames + classicJump.reaverFrames, 0,
     "⛔ a CLASSIC session never sees a Reaver (CS012 P2, O2)");

// ---------------------------------------------------------------------------
// 1. ⛔ CLASSIC IS UNTOUCHED BY OVERDRIVE — the hash, frame for frame
// ---------------------------------------------------------------------------
{
  const a = classicPlain.hashes, b = classicJump.hashes;
  const n = Math.min(a.length, b.length);
  let firstDiff = -1;
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) { firstDiff = i; break; }
  H.eq(a.length, b.length, "⛔ both Classic sessions ran the same number of frames");
  H.eq(firstDiff, -1, `⛔ the whole-board hash is identical on every frame with the jump key held on a ` +
       `fixed schedule and the four Overdrive entry points stubbed out (${n} frames)`);
  H.eq(classicPlain.steps, classicJump.steps, "and the same number of play steps");
  H.eq(J(classicJump.ends), J(classicPlain.ends), "⛔ the same run ends, and the same submits");
  H.eq(classicJump.table.classic, classicPlain.table.classic, "and the same local table");
  H.assert(new Set(a).size > n / 4, "non-vacuity: the hash moves with the board");
  H.assert(n > 20000, `non-vacuity: the Classic session is a soak (${n} frames, ${classicPlain.steps} steps)`);
}

// ---------------------------------------------------------------------------
// 2. ⛔ THE MUSIC CANNOT STEER OVERDRIVE — the hash, frame for frame
// ---------------------------------------------------------------------------
{
  const a = odAudio.hashes, b = odSilent.hashes;
  const n = Math.min(a.length, b.length);
  let firstDiff = -1;
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) { firstDiff = i; break; }
  H.eq(a.length, b.length, "⛔ both Overdrive sessions ran the same number of frames");
  H.eq(firstDiff, -1, `⛔ the whole-board hash is identical on every frame, audio on and off (${n} frames)`);
  H.eq(odAudio.steps, odSilent.steps, "and the same number of play steps");
  H.eq(J(odSilent.ends), J(odAudio.ends), "⛔ the same run ends, and the same submits");
  H.eq(odSilent.table.overdrive, odAudio.table.overdrive, "and the same local table");
  H.assert(new Set(a).size > n / 4, "non-vacuity: the hash moves with the board");
  H.assert(n > 20000, `non-vacuity: the Overdrive session is a soak (${n} frames, ${odAudio.steps} steps)`);
}

// ---- the audio session's music ---------------------------------------------
H.assert((odAudio.nodes.byTrack.drive || 0) > 1000,
         `⛔ \`drive\` is what an OVERDRIVE run schedules (${J(odAudio.nodes.byTrack)})`);
H.eq(odAudio.nodes.byTrack.pulse, undefined, "⛔ and `pulse` is never scheduled in one (R10)");
H.eq(odAudio.nodes.over, 0,
     `⛔ nodes per scheduled step <= C.MUSIC_STEP_NODE_MAX (worst ${odAudio.nodes.max} of ${odAudio.nodes.steps})`);
H.eq(odAudio.intensity.bad, 0,
     `⛔ GDD 17 item 9: the director's level, the music's intensity and sweep, and every setter argument ` +
     `are in [0, 1] on all ${odAudio.intensity.frames} frames${odAudio.intensity.first ? " — first: " + odAudio.intensity.first : ""}`);

// ---- the high-pass: exactly the takeoff and landing frames (O7) -------------
{
  const hp = odAudio.hp;
  H.assert(hp.node, "fixture: the high-pass node was built during the run");
  H.assert(hp.flips.length >= 20, `fixture: the run took off and landed many times (${hp.flips.length} flips)`);
  // ⛔ A COUNT AND ONE INDEX, never the two lists joined: CS012 P3 and P5 both
  // recorded that a mutation run whose answer is unreadable is a defect in the
  // test, and a 159,000-entry join is the same failure in another shape.
  let hpDiff = -1;
  for (let i = 0; i < Math.max(hp.autoFrames.length, hp.flips.length); i++) {
    if (hp.autoFrames[i] !== hp.flips[i]) { hpDiff = i; break; }
  }
  H.eq(hp.autoFrames.length, hp.flips.length,
       "⛔ the high-pass automates once per takeoff and once per landing");
  H.eq(hpDiff, -1,
       `⛔ AND ON EXACTLY THOSE FRAMES AND NO OTHER (${hp.autoFrames.length} automations, ` +
       `${hp.flips.length} flips; first mismatch at ${hpDiff}: frame ${hp.autoFrames[hpDiff]} ` +
       `against ${hp.flips[hpDiff]})`);
  H.eq([...hp.fns].join(","), "setTargetAtTime", "⛔ and it moves by setTargetAtTime alone");
  H.eq([...hp.targets].sort((p, q) => p - q).join(","), `0,${C.JUMP_HP_HZ}`,
       "⛔ between C.JUMP_HP_HZ and a resting pass-through, and nothing between");
}

// ---- ⛔ O14: the director's maximum on played OVERDRIVE boards, RECORDED ----
{
  const max = odAudio.intensity.max;
  const hz = C.FILTER_MIN_HZ * Math.pow(C.FILTER_MAX_HZ / C.FILTER_MIN_HZ, max);
  H.assert(max >= C.LAYER_THRESHOLD[3],
           `non-vacuity: the director passed tier 3 on the played Overdrive boards (max ${max.toFixed(4)})`);
  H.assert(max < 1,
           `⛔ O14: the sweep still does NOT open end to end on played Overdrive boards — the maximum is ` +
           `${max.toFixed(4)} (${Math.round(hz)} Hz against C.FILTER_MAX_HZ ${C.FILTER_MAX_HZ}). ` +
           "GDD §19 keeps its ✗ and no weight is rescaled (Paul's D6)");
  console.log(`  MEASURED (CS012 P6, the tenth soak): Overdrive director max ${max.toFixed(4)}, ` +
              `sweep ${Math.round(hz)} Hz, peak ×${odAudio.tally.maxPeak}, over ` +
              `${odAudio.intensity.frames} front-door frames (CS012 P4 measured 0.6519 on staged boards)`);
}

// ---------------------------------------------------------------------------
// 3. ⛔ OVERDRIVE'S INVARIANTS, ON EVERY STEP OF THAT SESSION
// ---------------------------------------------------------------------------
{
  const inv = odAudio.inv, T = odAudio.tally;
  H.assert(inv.steps > 10000, `fixture: the invariants were checked on ${inv.steps} steps`);
  H.eq(inv.lattice, 0, `⛔ the multiplier is on its half-step lattice on every step${first(inv, "lattice")}`);
  H.eq(inv.peak, 0, "⛔ and `peak` never falls inside a run, nor sits below the live multiplier");
  H.eq(inv.nan, 0, `⛔ no NaN anywhere on the board (GDD 17 item 12)${first(inv, "nan")}`);
  H.eq(inv.bounds, 0, "⛔ and no array past C.ENEMY_CAP / C.SHOT_MAX");
  H.eq(inv.airDeath, 0, `⛔ NO CONTACT DEATH WHILE AIRBORNE (GDD 14.2, R3)${first(inv, "airDeath")}`);
  H.eq(inv.airShot, 0, "⛔ and no shot leaves the rim airborne");
  H.eq(inv.cooldown, 0, `⛔ every takeoff respects C.JUMP_COOLDOWN, counted from landing (O6)${first(inv, "cooldown")}`);
  H.eq(inv.reaverMode, 0, "⛔ a Reaver only ever appears in OVERDRIVE");
  H.eq(inv.reaverLevel, 0, `⛔ and only from C.SPAWN_SCHEDULE_OVERDRIVE's level${first(inv, "reaverLevel")}`);
  H.eq(inv.reaverLane, 0, `⛔ GDD 17 item 3: no Reaver lane leaves [0, lanes-1] on an open well${first(inv, "reaverLane")}`);
  H.eq(inv.diveScored, 0, "⛔ a Dive scores nothing and builds nothing (GDD 5, 7)");
  H.eq(inv.badKill + inv.badBonus + inv.badTotal + inv.leftover + inv.badBuilds, 0,
       `⛔ GDD 17 item 8 IN OVERDRIVE, call by call: every kill pays a GDD §7 price on the board times the ` +
       `multiplier live at that call, and every other call is an UNMULTIPLIED literal (O4)` +
       `${first(inv, "badKill")}${first(inv, "badBonus")}${first(inv, "badTotal")}${first(inv, "leftover")}${first(inv, "badBuilds")}`);

  // ⛔ NON-VACUITY FOR EVERY CLAIM ABOVE.
  H.assert(T.takeoffs >= 40 && T.airSteps > 1000,
           `non-vacuity: jumps were taken (${T.takeoffs} takeoffs, ${T.airSteps} wholly airborne steps)`);
  H.assert(T.refused > T.takeoffs,
           `non-vacuity: MORE presses were REFUSED by the cooldown than were taken (${T.refused} against ${T.takeoffs})`);
  H.assert(T.comboLost > 0, `non-vacuity: the combo fell and sounded (${T.comboLost} comboLost)`);
  H.assert((T.byClass.Reaver || 0) > 0, `non-vacuity: Reavers were killed (${T.byClass.Reaver || 0})`);
  H.assert(odAudio.reaverFrames > 0, `non-vacuity: Reavers stood on the board (${odAudio.reaverFrames} entity-steps)`);
  H.assert(T.dives > 0, `non-vacuity: dives ran to their end (${T.dives})`);
  H.assert(T.maxMult > 1 && T.multsSeen.size >= 4,
           `non-vacuity: ${T.multsSeen.size} distinct multipliers were in force, up to ×${T.maxMult}`);
  H.assert(T.unmultipliedAtMult > 0,
           `non-vacuity: unmultiplied calls were made WHILE the multiplier was above ×1 (${T.unmultipliedAtMult})`);
  H.assert(T.chipCalls > 0 && T.bonusCalls > 0, `non-vacuity: Thorns chipped (${T.chipCalls}) and wells paid (${T.bonusCalls})`);
  H.assert(T.bountyCalls > 0, `non-vacuity (CS013 P1): Bounties were collected and priced (${T.bountyCalls})`);
  H.assert(T.killCalls > 300 && T.builds > 300, `non-vacuity: kills scored (${T.killCalls}) and built (${T.builds})`);
  for (const k of ["Vaulter", "Carrier", "Weaver", "Drifter", "Surger", "Reaver"]) {
    H.assert((T.byClass[k] || 0) > 0, `non-vacuity: a ${k} was killed on the front-door Overdrive board`);
  }
}

// ---------------------------------------------------------------------------
// 4. ⛔ ONE SUBMIT PER ELIGIBLE RUN END, ON THE MODE'S OWN CLIENT
// ---------------------------------------------------------------------------
{
  const IDS = C.LEADERBOARD_GAME_IDS;
  for (const [name, s, mine, theirs] of [["classic", classicPlain, IDS.classic, IDS.overdrive],
                                         ["overdrive", odAudio, IDS.overdrive, IDS.classic]]) {
    H.eq(s.ends.length, 6, `fixture: ${name} — six run ends (three cases, two runs each)`);
    H.eq(J(s.ends.map(e => e.outcome)), J(["died", "died", "died", "died", "died", "died"]),
         `fixture: ${name} — every run ended in a death`);
    let ok = 0, other = 0;
    for (const e of s.ends) {
      const want = e.eligible ? 1 : 0;
      const got = name === "classic" ? e.classicAfter - e.classic : e.overdriveAfter - e.overdrive;
      const stray = name === "classic" ? e.overdriveAfter - e.overdrive : e.classicAfter - e.classic;
      if (got === want) ok++; else H.assert(false, `⛔ ${name}: ${J(e)}`);
      other += stray;
    }
    H.eq(ok, s.ends.length, `⛔ ${name}: ONE submit per eligible run end`);
    H.eq(other, 0, `⛔ and NEVER one on ${theirs} — the other mode's board is untouched`);
    H.eq(s.lb.count(mine), s.ends.filter(e => e.eligible).length, `and no submit anywhere else on ${mine}`);
    H.eq(s.lb.count(theirs), 0, `fixture: ${theirs} took nothing in the ${name} session`);
    H.eq(J(s.lb.boards[mine].submits.map(x => x.result.metric)),
         J(s.ends.filter(e => e.eligible).map(e => e.score)), `${name}: each submit carries its run's final score`);
    H.eq(J(s.lb.creates.slice().sort()), J([IDS.classic, IDS.overdrive].sort()),
         `⛔ ${name}: BOTH clients are made, one per board, whichever mode is played (R8)`);
  }
  H.assert(classicPlain.lb.count(IDS.classic) > 0 && odAudio.lb.count(IDS.overdrive) > 0,
           "⛔ non-vacuity: BOTH boards were submitted to across the two sessions");
  H.eq(odAudio.lb.boards[IDS.overdrive].submits.every(s => s.result.stats.max_combo > 0), true,
       "⛔ and an Overdrive row posts its peak multiplier (R7)");
  H.eq(classicPlain.lb.boards[IDS.classic].submits.every(s => s.result.stats.max_combo === 0), true,
       "⛔ where a Classic row posts 0");
}

// ---------------------------------------------------------------------------
// 5. ⛔ A RELOAD BRINGS BACK BOTH MODES' TABLES AND RECORDS
// ---------------------------------------------------------------------------
{
  installSeed(SEED);
  let now = 0;
  Date.now = () => (now += 7919);
  const R = H.buildGame({ store: S_OD });
  H.eq(J(R.Scores.list("classic")), classicPlain.table.classic, "⛔ reload: the CLASSIC table intact");
  H.eq(J(R.Scores.list("overdrive")), odAudio.table.overdrive, "⛔ reload: the OVERDRIVE table intact");
  H.assert(R.Scores.list("classic").length > 0 && R.Scores.list("overdrive").length > 0,
           `non-vacuity: both tables hold rows (${R.Scores.list("classic").length} / ${R.Scores.list("overdrive").length})`);
  H.eq(R.levelRecord("classic").highestCleared(), classicPlain.record.classic,
       "⛔ reload: the CLASSIC Start Depth record");
  H.eq(R.levelRecord("overdrive").highestCleared(), odAudio.record.overdrive,
       "⛔ reload: and the OVERDRIVE one, its own number (O12)");
  H.eq(odAudio.record.classic, classicPlain.record.classic,
       "⛔ an OVERDRIVE session never moved the CLASSIC record");
  H.assert(classicPlain.record.classic > CLASSIC_RECORD && odAudio.record.overdrive > OD_RECORD,
           `non-vacuity: each session cleared past its staged record (${classicPlain.record.classic} / ${odAudio.record.overdrive})`);
  H.assert(R.startDepthOptions("classic").length !== R.startDepthOptions("overdrive").length,
           `⛔ so the two modes offer DIFFERENT Start Depth lists (${R.startDepthOptions("classic").length} / ` +
           `${R.startDepthOptions("overdrive").length} rows)`);
  H.eq(R._env.storageReads, 0, "and the reload reads no enumeration");
}

H.report("test-cs012-p6.js");
