// test-cs013-p5.js — CS013's closing phase: the ELEVENTH SOAK. Three paired
// proofs over one front-door driver that starts at the boot title (plan §7;
// GDD 17 items 1, 3, 4, 8, 12).
//  1. CLASSIC IS UNTOUCHED. One Classic session (Start Depths 1 / 13 / 23,
//     RESTART, a pause, QUIT) played twice: as is, and with
//     { stub: ["dropToken", "updateTokens", "jumpStrike"] } and BOTH new
//     schedule rows mutated out. ⛔ The state hash is identical on every frame.
//  2. THE SOUNDS CANNOT STEER OVERDRIVE. One Overdrive session (MODE →
//     OVERDRIVE → Start Depths 1 / 11 / 17 off a staged record, jumps at aloft
//     Wardens, a MimicShot sidestepped, Purges, dives, RESTART, a pause) played
//     on the recording fake and with no audio API. ⛔ Same hash on every frame.
//  3. OVERDRIVE'S INVARIANTS, on every step of that session (below), with
//     non-vacuity for every one of them.
//
// ⛔ TRAPS. 1. Seed, Date.now and build are re-made per session, in that order,
//     and each pair's two sessions start from equal stores.
//  2. Two live steps before the first press; stop pressing at the stop.
//  3. MODE's rows are OVERDRIVE then CLASSIC (CS012 P3, O9): a Classic run
//     steps one row down first.
//  4. ⛔ THE DRIVER READS THE BOARD, and every board answer it gives is a NO-OP
//     in Classic — no token, nothing aloft and no MimicShot exists there — so
//     §1's pair runs one function and is bit-identical either way.
//  5. ⛔ ITEM 8 HERE IS THE O4 CLAIM (test-cs012-p6.js's trap 5): a kill call is
//     a GDD §7 price ON THE BOARD times the multiplier live AT THAT CALL, and
//     every other call an UNMULTIPLIED literal — now including CS013 P1's
//     collected Bounty.
//  6. ⛔ THE LANDING STEP IS NOT AN AIRBORNE STEP (CS012 P6): updateJump() runs
//     at the TOP of the step, so a step that BEGINS airborne may end grounded.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260930;
installSeed(SEED);                          // ⛔ above the first buildGame() (trap 1)

const J = JSON.stringify;
const CLASSIC_DEPTHS = [1, 13, 23];
const OD_DEPTHS = [1, 11, 17];
const CLASSIC_RECORD = 23;                  // staged, so the list reaches 23
const OD_RECORD = 17;                       // staged per mode (CS012 P3, O12)
const HOLD_TICKS = 9000;                    // test-cs008-p8.js trap 2
const SEGMENT_CAP = 40000;
const PIN_TICKS = 300;
const PAUSE_CASE = 1, PAUSE_AT = 900;       // run 1 of the middle case
const MEASURE = !!process.env.P5_MEASURE;

// ⛔ BOTH OF CS013'S SCHEDULE ROWS, each in the build exactly once
// (test-cs013-p3.js and -p4.js pin the same two strings).
const ROWS = [['    { level: 11, kind: "warden" },\n', ""],
              ['    { level: 16, kind: "mimic" },\n', ""]];
const STUBS = ["dropToken", "updateTokens", "jumpStrike"];

// ⛔ GDD §7's LITERALS (test-cs008-p2.js's trap 1, for its reason).
const GDD = { thornChip: 5, weaver: 50, carrier: 100, vaulter: 150, surger: 200,
              reaver: 300, mimic: 400, warden: 500, wellPerLevel: 100,
              purgeUnspent: 500, noDeath: 1000, bounty: 2000 };

// ⛔ IT TAKES THE BUILD: `instanceof` is per build and this file runs four.
function gddPoints(Z, e) {
  if (e instanceof Z.Reaver) return GDD.reaver;      // before Vaulter: it extends it
  if (e instanceof Z.Warden) return GDD.warden;
  if (e instanceof Z.Mimic) return GDD.mimic;
  if (e instanceof Z.Vaulter) return GDD.vaulter;
  if (e instanceof Z.Carrier) return GDD.carrier;
  if (e instanceof Z.Weaver) return GDD.weaver;
  if (e instanceof Z.Surger) return GDD.surger;
  if (e instanceof Z.Drifter) return e.depth < 1 / 3 ? 250 : e.depth < 2 / 3 ? 500 : 750;
  return 0;   // the Thorn scores per chip; a bolt and a reflection are not on GDD §7
}

// 09-collision.js's own "the same lane", re-derived for the observations below.
function sameLane(Z, well, a, b) {
  return Math.abs(Z.laneDelta(well, a, b)) <= Z.C.HIT_LANE_TOL;
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

// ---------------------------------------------------------------------------
// ⛔ THE DRIVER — a hunter at the front door, and every board answer in it is
// the PLAYER'S own (STATUS's L11+ rule, now three clauses).
// ---------------------------------------------------------------------------
//
//   dodge    a MimicShot is NOT a target, it is a thing to leave (MI2): it
//            declines every shot and kills by contact, so "the deepest thing on
//            the board" steers into the one entity a shot cannot remove.
//            ⛔ UNLESS IT IS SHELLED: a Ward is one free hit (T9), and a driver
//            that dodges everything while wearing one never spends it.
//   collect  a hovering token is taken by TOUCH (T4) and by nothing else, so a
//            driver that never goes to one never collects one.
//   jump     an aloft Warden is killable only by the Jump and blocks the clear
//            (W4, W5), so a non-jumping driver stalls every board from L11.
//            ⛔ UNLESS IT IS SHELLED: it spends the free hit rather than banks
//            it, which is the only thing that ever breaks a Ward.
//   chip     a Thorn is a wall until a Lance is on, and a target after (T7):
//            C.LANCE_CHIP_MULT × C.THORN_CHIP is the effect's second half.
//   hunt     otherwise the deepest live non-projectile enemy.
//
// ⛔ Each is a NO-OP wherever the entity does not exist, which is what lets §1's
// Classic pair run this same function and hash identically (trap 4).
// ArrowRight raises `lane` (04-input.js's one axis model, 03-wells.js's
// laneDelta(a, b) = b - a): steering by the SIGN is what the driver needs, and
// a wrong one would collapse every non-vacuity below rather than pass quietly.
const RIGHT = 1;
function drive(Z, i) {
  const st = Z.state, inp = Z.Game.input, well = Z.WELLS[st.wellIndex];
  // The recorded wall pin: it is what puts the craft on an open well's WALL,
  // which is GDD §17 item 3's precondition (test-cs012-p6.js).
  if (i % PIN_TICKS === 0) inp.mouseMove((Math.floor(i / PIN_TICKS) % 2) ? 4000 : -4000);

  if (i === 0) inp.keyDown(" ");
  if (i < HOLD_TICKS) {
    if (i % 311 === 0) inp.keyDown("x");
    if (i % 311 === 4) inp.keyUp("x");
  } else if (i === HOLD_TICKS) {
    // ⛔ The stop (trap 2). It keeps steering and stops answering, so the board
    // closes on it: a jumping, firing hunter outlives any segment cap.
    inp.keyUp(" "); inp.keyUp("x"); inp.keyUp("arrowup");
  }

  const sk = st.skimmer;
  inp.keyUp("ArrowRight"); inp.keyUp("ArrowLeft");
  if (!sk || sk.dead) { inp.keyUp("arrowup"); return; }

  let dodge = null, token = null, best = null, contact = null;
  for (let n = 0; n < st.enemies.length; n++) {
    const e = st.enemies[n];
    if (e.dead) continue;
    if (e instanceof Z.MimicShot) {
      if (st.powers.ward) continue;          // shelled: it takes the hit
      const dd = Z.laneDelta(well, sk.lane, e.lane);
      if (Math.abs(dd) <= 1 && (dodge === null || Math.abs(dd) < Math.abs(dodge))) dodge = dd;
      continue;
    }
    if (e instanceof Z.WeaverBolt) continue;
    // An anchored Thorn's `depth` is the tip of an extent rooted at the throat,
    // so it ranks with the rest: a tall one really is the nearest thing in
    // its lane. Only worth going to with a Lance on (see the header).
    if (e.anchored && !st.powers.lance) continue;
    if (best === null || e.depth > best.depth) best = e;
    // ⛔ SHELLED, A CONTACT KILLER IS A TARGET RATHER THAN A THREAT (T9), and
    // the deepest is the one that will reach the rim first.
    if (e.killDepth !== null && e.killDepth !== undefined && !e.aloft &&
        (contact === null || e.depth > contact.depth)) contact = e;
  }
  for (let n = 0; n < st.tokens.length; n++) {
    const t = st.tokens[n];
    if (t.dead || t.depth < Z.C.TOKEN_HOVER_DEPTH) continue;
    const dd = Z.laneDelta(well, sk.lane, t.lane);
    if (token === null || Math.abs(dd) < Math.abs(token)) token = dd;
  }

  // ⛔ SHELLED, IT SPENDS THE SHELL, AND IT STOPS FIRING TO DO IT (T9: a Ward
  // is one free hit). ⚠ REPAIRED IN PLACE, CS015 P2: this driver only stopped
  // DODGING while shelled, and the Ward break below was then a coincidence —
  // 2 in 101,330 frames. CS015's achievement seats read the clock once per
  // evaluation, which moves this file's faked per-call Date.now and with it the
  // seed every RESTART takes; the coincidence did not survive, at twelve seeds
  // and six clock ticks. ⛔ THE PRECONDITION IS RESTORED, NOT RELAXED, and the
  // fire release is what restores it: a firing hunter's RIM SWEEP takes the
  // contact killer first (GDD 4.5), so a held trigger is why a shell almost
  // never got spent — 3,446 shelled frames, 0 breaks. Released: 11.
  const spendShell = st.powers.ward && contact !== null;
  if (i < HOLD_TICKS) { if (spendShell) inp.keyUp(" "); else inp.keyDown(" "); }
  // A dodge is a FULL push away rather than a delta, so a shot in the craft's
  // own lane (delta 0, and -0 is still 0) still moves it.
  let d;
  if (dodge !== null) d = (dodge > 0 ? -RIGHT : RIGHT);
  else if (spendShell) d = Z.laneDelta(well, sk.lane, contact.lane) * RIGHT;
  else if (token !== null) d = token * RIGHT;
  else if (best !== null) d = Z.laneDelta(well, sk.lane, best.lane) * RIGHT;
  else d = 0;
  if (d > 0.3) inp.keyDown("ArrowRight"); else if (d < -0.3) inp.keyDown("ArrowLeft");

  if (i < HOLD_TICKS && !st.powers.ward &&
      st.enemies.some(e => !e.dead && e.aloft && sameLane(Z, well, e.lane, sk.lane))) {
    inp.keyDown("arrowup");
  } else {
    inp.keyUp("arrowup");
  }
}

// ===========================================================================
// ONE SESSION — the whole front door, either mode
// ===========================================================================
//
// `o.mode`       "classic" | "overdrive"
// `o.store`      the Map this session boots and saves over
// `o.cut`        §1's stubbed-and-mutated session
// `o.audio`      §2's recording-fake session
// `o.instrument` §3's per-step invariants (the audio session alone)
function session(o) {
  installSeed(SEED);                        // trap 1
  let now = 0;
  const tick = o.clock || 7919;
  Date.now = () => (now += tick);
  const opts = { store: o.store,
                 spy: ["addScore", "comboKill", "sfx", "collectToken", "dropToken", "jumpStrike"] };
  if (o.cut) { opts.stub = STUBS; opts.mutate = ROWS; }
  if (o.audio) opts.audio = true;
  const X = H.buildGame(opts);
  const { C, state } = X;
  const G = X.Game, M = X.MusicSys, D = X.Director, A = X.AudioSys, rec = X._audio;
  const MS = C.FIXED_DT * 1000;
  const OD = o.mode === "overdrive";
  const DEPTHS = OD ? OD_DEPTHS : CLASSIC_DEPTHS;

  const out = {
    X, hashes: [], steps: 0, frames: 0, exceptions: [], stuck: [], cases: [],
    levels: new Set(), script: {}, tokenFrames: 0, table: null, record: 0,
    inv: { steps: 0, nan: 0, bounds: 0, tokenCap: 0, tokenAge: 0, tokenPos: 0,
           diveTokens: 0, draws: 0, dropCalls: 0, airDeath: 0, wardenKill: 0,
           wardenLane: 0, mimicLane: 0, reflectBudget: 0, shotMimic: 0,
           badKill: 0, badBonus: 0, badTotal: 0, leftover: 0, badBuilds: 0,
           first: {} },
    tally: { dropCalls: 0, drops: 0, atMax: 0, kinds: {}, collected: {},
             wardenJumpKills: 0, mimicKills: 0, reflections: 0, openings: 0,
             mimicShotAsks: 0, lanceChips: 0, spreadVolleys: 0, wardBreaks: 0,
             dives: 0, deaths: 0, takeoffs: 0, airSteps: 0, killCalls: 0, bountyCalls: 0,
             chipCalls: 0, bonusCalls: 0, ringCalls: 0, builds: 0, byClass: {},
             maxTokens: 0, maxShots: 0, maxMult: 1, openWellWardenSteps: 0 },
    audio: { steps: 0, byTrack: {}, sfx: 0, frames: 0, max: 0, bad: 0 },
  };
  const T = out.tally;
  const fail = (grp, msg) => { out.inv[grp]++; if (!out.inv.first[grp]) out.inv.first[grp] = msg; };

  // ---- §3's per-step bookkeeping -------------------------------------------
  const calls = [];
  let lastKills = 0, builds = 0, bounties = 0;
  let pre = null, preArr = null, pushedE = null, shots0 = 0;
  let s0 = 0, level0 = 0, diveWas = false, screen0 = "", builds0 = 0;
  let jumpPhase0 = "ground", deaths0 = 0, mimicWas = null, aloftWas = null;
  let dropCalls0 = 0, draws = 0, drawsAtDrop = 0, tokens0 = 0;
  // ⛔ THE JUMP STRIKE IS READ AT THE CALL, NOT AFTER THE STEP (W4). A strike
  // that clears the last blocker runs startDive() on the same step, and
  // startDive() calls resetJump() — so a post-step phase read says "grounded"
  // for a kill that really was airborne. MEASURED: 2 of 30 here.
  let struck = new Set(), strikeAir = false, strikeLane = null, strikePre = [];

  // ⛔ startGame() re-mints state.rng (23-main.js's Object.assign + mulberry32),
  // so the counter is re-attached rather than attached once.
  let rngRaw = null, rngWrapped = null;
  function ensureRng() {
    if (state.rng === rngWrapped) return;
    rngRaw = state.rng;
    rngWrapped = function () { draws++; return rngRaw(); };
    state.rng = rngWrapped;
  }

  X.sfx.before = name => {
    if (name === "wardBreak") T.wardBreaks++;
    if (o.audio) out.audio.sfx++;
  };
  if (o.instrument) {
    X.addScore.before = function (n) {
      const kill = state.tally.kills > lastKills;
      lastKills = state.tally.kills;
      calls.push({ n, mult: state.combo.mult, kill });
    };
    X.comboKill.before = function () { builds++; };
    X.collectToken.before = function (s, t) {
      T.collected[t.kind] = (T.collected[t.kind] || 0) + 1;
      if (t.kind === "bounty") bounties++;
    };
    // ⛔ EXACTLY ONE DRAW PER OVERDRIVE KILL (T2), measured at the call rather
    // than inferred from a total: drop or no drop, and at MAX_TOKENS too.
    X.dropToken.before = function () {
      ensureRng(); drawsAtDrop = draws; tokens0 = state.tokens.length;
      if (tokens0 >= C.MAX_TOKENS) T.atMax++;
    };
    X.dropToken.after = function () {
      T.dropCalls++;
      if (draws - drawsAtDrop !== 1) fail("draws", `a dropToken() spent ${draws - drawsAtDrop} draws`);
      if (state.tokens.length > tokens0) {
        const k = state.tokens[state.tokens.length - 1].kind;
        T.kinds[k] = (T.kinds[k] || 0) + 1;
      }
    };
    // ⛔ THE FOURTH KILL SITE, READ WHERE IT HAPPENS (W4).
    X.jumpStrike.before = function () {
      strikeAir = X.jumpAirborne(state);
      strikeLane = state.skimmer && !state.skimmer.dead ? state.skimmer.lane : null;
      strikePre = state.enemies.filter(e => e.aloft && !e.dead);
    };
    X.jumpStrike.after = function (s, well) {
      for (const e of strikePre) {
        if (!e.dead) continue;
        struck.add(e);
        if (!(strikeAir && strikeLane !== null && sameLane(X, well, e.lane, strikeLane))) {
          fail("wardenKill", `an aloft ${e.constructor.name} died with the craft ` +
               `${strikeAir ? "airborne, out of its lane" : "grounded"}`);
        } else if (e instanceof X.Warden) T.wardenJumpKills++;
      }
    };
    // ⛔ A LANCE CHIP IS THE SHOT'S OWN `pierce` (T7), read where the Thorn
    // reads it. Pure observation: it calls through and writes no state.
    const thornOnShot = X.Thorn.prototype.onShot;
    X.Thorn.prototype.onShot = function (shot) {
      if (shot && shot.pierce) T.lanceChips++;
      return thornOnShot.apply(this, arguments);
    };
    // ⛔ A MimicShot IS NEVER SHOT DEAD (MI2, the bolt's ⚠ SETTLED answer).
    const bolt = X.MimicShot.prototype.onShot;
    X.MimicShot.prototype.onShot = function () {
      T.mimicShotAsks++;
      const r = bolt.apply(this, arguments);
      if (r || this.dead) fail("shotMimic", `a MimicShot answered a shot (${r}, dead ${this.dead})`);
      return r;
    };
  }

  function preStep() {
    pre = state.enemies.slice();
    preArr = state.enemies;
    pushedE = [];
    preArr.push = function () { pushedE.push.apply(pushedE, arguments); return Array.prototype.push.apply(this, arguments); };
    // ⛔ NOT AN INTERCEPTION OF state.shots.push (CS012 P6, MEASURED):
    // updateShots() filters into a NEW array before it fires.
    shots0 = state.tally.shotsFired;
    s0 = state.score; level0 = state.level; diveWas = state.dive.active; screen0 = state.screen;
    jumpPhase0 = state.jump.phase; deaths0 = state.tally.deaths;
    mimicWas = state.enemies.filter(e => e instanceof X.Mimic && !e.dead).map(e => [e, e.phase]);
    aloftWas = state.enemies.filter(e => e.aloft && !e.dead);
    lastKills = state.tally.kills;
    calls.length = 0; builds0 = builds; bounties = 0;
    dropCalls0 = T.dropCalls;
    struck = new Set();
    ensureRng();
  }

  function postStep(stepped) {
    delete preArr.push;
    if (!stepped) return;
    out.inv.steps++;
    const well = X.WELLS[state.wellIndex];
    if (state.combo.mult > T.maxMult) T.maxMult = state.combo.mult;

    // ---- no NaN, and bounded arrays (GDD 17 item 12) ------------------------
    if (state.enemies.length > C.ENEMY_CAP) fail("bounds", `${state.enemies.length} entities`);
    // ⛔ THE CAP IN FORCE (GDD 17 item 4 as CS013 P2 reworded it): C.SHOT_MAX,
    // or C.SPREAD_SHOT_MAX for as long as Spread is on.
    const shotCap = state.powers.spread ? C.SPREAD_SHOT_MAX : C.SHOT_MAX;
    if (state.shots.length > shotCap) fail("bounds", `${state.shots.length} shots against ${shotCap}`);
    if (state.shots.length > T.maxShots) T.maxShots = state.shots.length;
    for (const v of [state.score, state.time, state.level, state.combo.mult,
                     state.jump.t, state.jump.cool, state.skimmer ? state.skimmer.lane : 0]) {
      if (!isFinite(v)) fail("nan", `a non-finite scalar on level ${state.level}`);
    }
    for (const e of state.enemies) {
      if (!isFinite(e.lane) || !isFinite(e.depth)) fail("nan", `${e.constructor.name} lane ${e.lane} depth ${e.depth}`);
    }

    // ---- ⛔ THE TOKENS (T1, T4, T5) ----------------------------------------
    if (state.tokens.length > T.maxTokens) T.maxTokens = state.tokens.length;
    if (state.tokens.length > C.MAX_TOKENS) fail("tokenCap", `${state.tokens.length} tokens on the board`);
    for (const t of state.tokens) {
      if (!isFinite(t.lane) || !isFinite(t.depth) || !isFinite(t.age)) fail("nan", `a token at lane ${t.lane}`);
      if (t.age >= C.TOKEN_LIFE) fail("tokenAge", `a live token aged ${t.age.toFixed(3)} of ${C.TOKEN_LIFE}`);
      if (t.depth < 0 || t.depth > C.TOKEN_HOVER_DEPTH) fail("tokenPos", `a token at depth ${t.depth}`);
      if (!(t.kind in C.TOKEN_WEIGHTS)) fail("tokenPos", `a token of kind ${t.kind}`);
      if (!well.closed && (t.lane < 0 || t.lane > well.lanes - 1)) fail("tokenPos", `${well.name}: a token in lane ${t.lane}`);
    }
    // ⛔ THE WELL OWNS THEM: startDive() empties the array and turns every
    // power off, so nothing rises through a Dive and no Ward meets a Thorn.
    if (state.dive.active) {
      if (state.tokens.length) fail("diveTokens", `${state.tokens.length} tokens inside a dive`);
      if (state.powers.lance || state.powers.spread || state.powers.ward) {
        fail("diveTokens", `a power survived into a dive (${J(state.powers)})`);
      }
    }
    if (state.dive.active !== diveWas && !state.dive.active) T.dives++;

    // ---- the Jump: immune airborne, and the FOURTH kill site (W4) -----------
    if (jumpPhase0 === "air" && state.jump.phase === "air") {
      T.airSteps++;
      if (state.tally.deaths > deaths0) fail("airDeath", `a contact death on an airborne step, level ${state.level}`);
    }
    if (jumpPhase0 !== "air" && state.jump.phase === "air") T.takeoffs++;
    if (state.tally.deaths > deaths0) T.deaths += state.tally.deaths - deaths0;
    // ⛔ AN ALOFT ENTITY DIES ONLY TO AN AIRBORNE CRAFT IN ITS LANE, AND THE
    // JUMP STRIKE IS THE ONLY THING THAT KILLED IT (W4). Nothing else can
    // reach one: collideShots() skips it and `purgeable` is false.
    for (const e of aloftWas) {
      if (e.dead && !struck.has(e)) {
        fail("wardenKill", `an aloft ${e.constructor.name} died away from jumpStrike()`);
      }
    }

    // ---- ⛔ GDD 17 item 3: CS013's entities on an open well ------------------
    if (!well.closed) {
      for (const e of state.enemies) {
        if (e instanceof X.Warden) {
          T.openWellWardenSteps++;
          if (e.lane < 0 || e.lane > well.lanes - 1) fail("wardenLane", `${well.name}: a Warden in lane ${e.lane}`);
        } else if (e instanceof X.Mimic || e instanceof X.MimicShot) {
          if (e.lane < 0 || e.lane > well.lanes - 1) fail("mimicLane", `${well.name}: a ${e.constructor.name} in lane ${e.lane}`);
        }
      }
    }

    // ---- ⛔ AT MOST ONE REFLECTION PER OPENING (MI1) -------------------------
    // Reflecting is the only thing that OPENS a Mimic and an open one reflects
    // nothing, so the bound is the two states rather than a counter: the
    // reflections born this step can never outnumber the Mimics that opened on
    // it. (A reflection refused at C.ENEMY_CAP opens one and adds none.)
    let born = 0;
    for (const e of pushedE) if (e instanceof X.MimicShot) born++;
    let opened = 0;
    for (const [m, was] of mimicWas) if (was === "closed" && m.phase === "open") opened++;
    T.reflections += born; T.openings += opened;
    if (born > opened) fail("reflectBudget", `${born} reflections against ${opened} openings`);

    if (screen0 !== "play") return;

    // ---- ⛔ A DIVE PAYS ONLY RINGS, BUILDS NOTHING AND ROLLS NOTHING -------
    // ⛔ REWRITTEN IN PLACE, CS014 P1 (RF4; plan §8, §11). "A dive scores
    // nothing" is REPLACED by what replaced it, and the other two halves are
    // UNCHANGED under RF4-A: ⛔ EVERY addScore CALL INSIDE A DIVE IS ONE RING AT
    // C.RING_POINTS, UNMULTIPLIED, and a Dive still builds nothing and rolls
    // nothing. A ring is not a kill and a Dive is not a kill site, so there is
    // no comboKill(), no dropToken(), no tally.kills and no kill sound on the
    // take — the four kill sites and five kill lines are unmoved (GDD 7), and
    // the Dive's termination kill still pays nothing. ⚠ The literal is read off
    // the build: C.RING_POINTS is provisional and owned by a tuning pass.
    if (diveWas) {
      for (const c of calls) {
        if (c.kill || c.n !== C.RING_POINTS) fail("badTotal", `an addScore call of ${c.n} at ×${c.mult} inside a dive`);
        else T.ringCalls++;
      }
      if (calls.length > C.DIVE_RINGS_MAX) fail("badTotal", `${calls.length} ring payouts on one step`);
      if (builds !== builds0) fail("badBuilds", "a dive built the combo");
      if (T.dropCalls !== dropCalls0) fail("dropCalls", "a dive rolled for a token");
      return;
    }

    // ---- ⛔ ITEM 8, CALL BY CALL (trap 5) -----------------------------------
    const want = [];
    for (const e of pre.concat(pushedE)) {
      if (!e.dead) continue;
      const p = gddPoints(X, e);
      if (p > 0) { want.push(p); T.byClass[e.constructor.name] = (T.byClass[e.constructor.name] || 0) + 1; }
      if (e instanceof X.Mimic) T.mimicKills++;
    }
    const allowed = [GDD.thornChip, GDD.wellPerLevel * level0, GDD.purgeUnspent, GDD.noDeath,
                     X.startBonus(state.startDepth)];
    let total = 0;
    for (const c of calls) {
      total += c.n;
      if (c.kill) {
        T.killCalls++;
        if (c.n === 0) continue;
        const price = c.n / c.mult;
        const at = want.indexOf(price);
        if (at < 0) fail("badKill", `a kill paid ${c.n} at ×${c.mult} — no GDD §7 price on the board matches`);
        else want.splice(at, 1);
      } else if (c.n === GDD.bounty && bounties > 0) {
        bounties--; T.bountyCalls++;
      } else {
        if (allowed.indexOf(c.n) < 0) fail("badBonus", `an unmultiplied call paid ${c.n} at ×${c.mult}`);
        else if (c.n === GDD.thornChip) T.chipCalls++;
        else T.bonusCalls++;
      }
    }
    if (want.length) fail("leftover", `${want.length} kill(s) unpaid (${want.join("/")})`);
    if (bounties) fail("leftover", `${bounties} collected Bount(ies) unpaid`);
    if (state.score - s0 !== total) fail("badTotal", "the step's delta is not its calls' sum");
    const built = builds - builds0, scoredKills = calls.filter(c => c.kill).length;
    if (built !== scoredKills) fail("badBuilds", `${built} builds against ${scoredKills} scored kills`);
    // ⛔ EVERY KILL AT A KILL SITE ROLLS, AND NOTHING ELSE DOES (T2).
    if (T.dropCalls - dropCalls0 !== scoredKills) {
      fail("dropCalls", `${T.dropCalls - dropCalls0} drop rolls against ${scoredKills} kills`);
    }
    // A Spread volley is more than one shot leaving the rim on one step.
    if (state.powers.spread && state.tally.shotsFired - shots0 > 1) T.spreadVolleys++;
  }

  // ---- §2's audio instrument (it observes and passes through) ---------------
  if (o.audio) {
    const sched0 = M.scheduleStep;
    M.scheduleStep = function (step, t) {
      out.audio.steps++;
      out.audio.byTrack[this.state] = (out.audio.byTrack[this.state] || 0) + 1;
      return sched0.call(this, step, t);
    };
  }

  // ---- the frame loop -------------------------------------------------------
  const hash = makeHasher(X, () => [G.hitStopLeft, G.menu.cursor, G.stats.ticks]);
  let clock = 0;
  function halfFrame() {
    clock += MS / 2;
    if (o.audio) A.ctx && (A.ctx.currentTime = clock / 1000);
    const t0 = G.stats.ticks;
    if (o.instrument) preStep();
    G.frame(clock);
    if (o.instrument) postStep(G.stats.ticks > t0);
    // ⛔ COUNTED IN EVERY SESSION, instrumented or not: "a Classic run never
    // sees one" is a claim about the two Classic sessions.
    out.tokenFrames += state.tokens.length;
    if (o.audio) {
      // ⛔ O14: RECORDED, NOT RESCALED (Paul's D6). The tenth soak read 0.6448
      // over Overdrive frames with neither a token nor an aloft entity on the
      // board; this is the same number with all of CS013 live.
      out.audio.frames++;
      for (const v of [D.level, M.intensity, M.sweepLevel]) {
        if (!(typeof v === "number" && v >= 0 && v <= 1)) out.audio.bad++;
      }
      if (D.level > out.audio.max) out.audio.max = D.level;
      rec.clear(); rec.nodes.length = 0;                   // test-cs010-p5.js's trap 4
    }
    out.frames++;
    out.hashes.push(hash());
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
      if (G.hitStopLeft === 0 && drivenFor !== i) { drive(X, i); drivenFor = i; }
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
  T.builds = builds;
  for (const k of Object.keys(T.kinds)) T.drops += T.kinds[k];
  out.table = J(X.Scores.list(o.mode));
  out.record = X.levelRecord(o.mode).highestCleared();
  return out;
}

// ===========================================================================
// THE FOUR SESSIONS — two pairs, over stores that start equal
// ===========================================================================

const S_CLASSIC = new Map();
const classicPlain = session({ mode: "classic", store: S_CLASSIC });
const classicCut = session({ mode: "classic", store: new Map(), cut: true });

const OD_CLOCK = 7919;
const odAudio = session({ mode: "overdrive", store: new Map(), audio: true,
                          instrument: true, clock: OD_CLOCK });
const odSilent = session({ mode: "overdrive", store: new Map(), clock: OD_CLOCK });

if (MEASURE) {
  const brief = s => ({ frames: s.frames, steps: s.steps, cases: s.cases, script: s.script,
                        levels: [...s.levels].sort((a, b) => a - b), record: s.record,
                        inv: s.inv, tokenFrames: s.tokenFrames, tally: s.tally,
                        audio: s.audio, exceptions: s.exceptions, stuck: s.stuck });
  console.log(J({ classicPlain: brief(classicPlain), odAudio: brief(odAudio) }, null, 1));
}

const C = classicPlain.X.C;
const first = (g, k) => (g.first && g.first[k] ? ` — first: ${g.first[k]}` : "");

// ---------------------------------------------------------------------------
// the front door, in both modes
// ---------------------------------------------------------------------------
for (const [name, s] of [["classic", classicPlain], ["classic+cut", classicCut],
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
H.eq(J(classicCut.X.C.SPAWN_SCHEDULE_OVERDRIVE), J([{ level: 6, kind: "reaver" }]),
     "fixture: the cut build's Overdrive table is the Reaver's row alone — both CS013 rows removed");
H.eq(classicPlain.tokenFrames + classicCut.tokenFrames, 0,
     "⛔ a CLASSIC session never sees a token (GDD 13; T2's mode gate)");
H.assert(odAudio.tokenFrames > 0, `non-vacuity: tokens stood on the Overdrive board (${odAudio.tokenFrames} token-frames)`);

// ---------------------------------------------------------------------------
// 1. ⛔ CLASSIC IS UNTOUCHED BY CS013 — the hash, frame for frame
// ---------------------------------------------------------------------------
{
  const a = classicPlain.hashes, b = classicCut.hashes;
  const n = Math.min(a.length, b.length);
  let firstDiff = -1;
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) { firstDiff = i; break; }
  H.eq(a.length, b.length, "⛔ both Classic sessions ran the same number of frames");
  H.eq(firstDiff, -1, `⛔ the whole-board hash is identical on every frame with dropToken(), ` +
       `updateTokens() and jumpStrike() stubbed out AND both CS013 schedule rows removed ` +
       `(${n} frames)`);
  H.eq(classicPlain.steps, classicCut.steps, "and the same number of play steps");
  H.eq(classicCut.table, classicPlain.table, "and the same local table");
  H.eq(classicCut.record, classicPlain.record, "and the same Start Depth record");
  H.assert(new Set(a).size > n / 4, "non-vacuity: the hash moves with the board");
  H.assert(n > 20000, `non-vacuity: the Classic session is a soak (${n} frames, ${classicPlain.steps} steps)`);
}

// ---------------------------------------------------------------------------
// 2. ⛔ THE SOUNDS CANNOT STEER OVERDRIVE — the hash, frame for frame
// ---------------------------------------------------------------------------
{
  const a = odAudio.hashes, b = odSilent.hashes;
  const n = Math.min(a.length, b.length);
  let firstDiff = -1;
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) { firstDiff = i; break; }
  H.eq(a.length, b.length, "⛔ both Overdrive sessions ran the same number of frames");
  H.eq(firstDiff, -1, `⛔ the whole-board hash is identical on every frame, audio on and off (${n} frames)`);
  H.eq(odAudio.steps, odSilent.steps, "and the same number of play steps");
  H.eq(odSilent.table, odAudio.table, "and the same local table");
  H.assert(new Set(a).size > n / 4, "non-vacuity: the hash moves with the board");
  H.assert(n > 20000, `non-vacuity: the Overdrive session is a soak (${n} frames, ${odAudio.steps} steps)`);
  H.assert((odAudio.audio.byTrack.drive || 0) > 1000,
           `non-vacuity: the audio session really played \`drive\` (${J(odAudio.audio.byTrack)})`);
  H.assert(odAudio.audio.sfx > 1000,
           `non-vacuity: and really sounded CS013's seats among ${odAudio.audio.sfx} sfx() calls`);
  H.eq(odAudio.audio.bad, 0,
       `⛔ GDD 17 item 9: the director's level and the music's intensity and sweep are in [0, 1] ` +
       `on all ${odAudio.audio.frames} frames`);
}

// ---- ⛔ O14: the director's maximum on a CS013 OVERDRIVE board, RECORDED -----
{
  const max = odAudio.audio.max;
  const hz = C.FILTER_MIN_HZ * Math.pow(C.FILTER_MAX_HZ / C.FILTER_MIN_HZ, max);
  H.assert(max >= C.LAYER_THRESHOLD[3],
           `non-vacuity: the director passed tier 3 on the played Overdrive boards (max ${max.toFixed(4)})`);
  H.assert(max < 1,
           `⛔ O14: the sweep still does NOT open end to end with the tokens, the Warden and the ` +
           `Mimic all live — the maximum is ${max.toFixed(4)} (${Math.round(hz)} Hz against ` +
           `C.FILTER_MAX_HZ ${C.FILTER_MAX_HZ}). GDD §19 keeps its ✗ and no weight is rescaled (Paul's D6)`);
  console.log(`  MEASURED (CS013 P5, the eleventh soak): Overdrive director max ${max.toFixed(4)}, ` +
              `sweep ${Math.round(hz)} Hz, up to ×${odAudio.tally.maxMult}, over ` +
              `${odAudio.audio.frames} front-door frames (CS012 P6's tenth soak measured 0.6448)`);
}

// ---------------------------------------------------------------------------
// 3. ⛔ OVERDRIVE'S INVARIANTS, ON EVERY STEP OF THAT SESSION
// ---------------------------------------------------------------------------
{
  const inv = odAudio.inv, T = odAudio.tally;
  H.assert(inv.steps > 10000, `fixture: the invariants were checked on ${inv.steps} steps`);
  H.eq(inv.nan, 0, `⛔ no NaN anywhere on the board (GDD 17 item 12)${first(inv, "nan")}`);
  H.eq(inv.bounds, 0, `⛔ no array past C.ENEMY_CAP or the SHOT CAP IN FORCE (GDD 17 item 4)${first(inv, "bounds")}`);
  H.eq(inv.tokenCap, 0, `⛔ never more than C.MAX_TOKENS on the board (GDD 14.1)${first(inv, "tokenCap")}`);
  H.eq(inv.tokenAge, 0, `⛔ every live token is younger than C.TOKEN_LIFE (GDD 16.3)${first(inv, "tokenAge")}`);
  H.eq(inv.tokenPos, 0, `⛔ and sits in a legal lane at a legal depth, of a kind in C.TOKEN_WEIGHTS${first(inv, "tokenPos")}`);
  H.eq(inv.diveTokens, 0, `⛔ THE WELL OWNS THEM (T5): no token and no power inside a Dive${first(inv, "diveTokens")}`);
  H.eq(inv.draws, 0, `⛔ EXACTLY ONE DRAW PER OVERDRIVE KILL (T2)${first(inv, "draws")}`);
  H.eq(inv.dropCalls, 0, `⛔ and one roll per kill at a kill site, none in a Dive${first(inv, "dropCalls")}`);
  H.eq(inv.airDeath, 0, `⛔ NO CONTACT DEATH WHILE AIRBORNE (GDD 14.2)${first(inv, "airDeath")}`);
  H.eq(inv.wardenKill, 0, `⛔ AN ALOFT ENTITY DIES ONLY TO AN AIRBORNE CRAFT IN ITS LANE (W4)${first(inv, "wardenKill")}`);
  H.eq(inv.wardenLane, 0, `⛔ GDD 17 item 3: no Warden lane leaves [0, lanes-1] on an open well${first(inv, "wardenLane")}`);
  H.eq(inv.mimicLane, 0, `⛔ nor a Mimic's or a MimicShot's${first(inv, "mimicLane")}`);
  H.eq(inv.reflectBudget, 0, `⛔ AT MOST ONE REFLECTION PER OPENING (MI1)${first(inv, "reflectBudget")}`);
  H.eq(inv.shotMimic, 0, `⛔ and no MimicShot is ever shot dead — it is dodged, not answered${first(inv, "shotMimic")}`);
  H.eq(inv.badKill + inv.badBonus + inv.badTotal + inv.leftover + inv.badBuilds, 0,
       `⛔ GDD 17 item 8 IN OVERDRIVE, call by call: every kill pays a GDD §7 price on the board ` +
       `times the multiplier live at that call — the Warden's 500 and the Mimic's 400 among them — ` +
       `and every other call is an UNMULTIPLIED literal, a collected Bounty's 2,000 among them` +
       `${first(inv, "badKill")}${first(inv, "badBonus")}${first(inv, "badTotal")}${first(inv, "leftover")}${first(inv, "badBuilds")}`);

  // ⛔ NON-VACUITY FOR EVERY CLAIM ABOVE.
  H.assert(T.dropCalls > 300, `non-vacuity: ${T.dropCalls} kills rolled for a token`);
  H.assert(T.maxTokens === C.MAX_TOKENS, `non-vacuity: the board reached C.MAX_TOKENS (${T.maxTokens})`);
  for (const k of Object.keys(C.TOKEN_WEIGHTS)) {
    H.assert((T.collected[k] || 0) > 0, `non-vacuity: a ${k} token was COLLECTED (${J(T.collected)})`);
  }
  H.assert(T.wardBreaks > 0, `non-vacuity: a Ward absorbed a hit and broke (${T.wardBreaks})`);
  H.assert(T.lanceChips > 0, `non-vacuity: a Lance shot chipped a Thorn at 3× (${T.lanceChips})`);
  H.assert(T.spreadVolleys > 0, `non-vacuity: Spread fired volleys (${T.spreadVolleys})`);
  H.assert(T.maxShots > C.SHOT_MAX, `non-vacuity: and the rack passed C.SHOT_MAX under the wider cap (${T.maxShots})`);
  H.assert(T.bountyCalls > 0, `non-vacuity: Bounties were collected and priced (${T.bountyCalls})`);
  H.assert(T.ringCalls > 0, `non-vacuity (CS014 P1): rings were taken inside dives and priced (${T.ringCalls})`);
  H.assert(T.wardenJumpKills > 0, `non-vacuity: Wardens were JUMP-KILLED (${T.wardenJumpKills})`);
  H.assert(T.openWellWardenSteps > 0, `non-vacuity: Wardens stood on OPEN wells (${T.openWellWardenSteps} entity-steps)`);
  H.assert(T.mimicKills > 0, `non-vacuity: Mimics were killed (${T.mimicKills})`);
  H.assert(T.reflections > 0, `non-vacuity: shots were REFLECTED (${T.reflections} of ${T.openings} openings)`);
  H.assert(T.mimicShotAsks > 0, `non-vacuity: and shots ASKED a MimicShot and were declined (${T.mimicShotAsks})`);
  H.assert(T.takeoffs >= 20 && T.airSteps > 1000,
           `non-vacuity: jumps were taken (${T.takeoffs} takeoffs, ${T.airSteps} wholly airborne steps)`);
  H.assert(T.dives > 0, `non-vacuity: dives ran to their end (${T.dives})`);
  H.assert(T.maxMult > 1, `non-vacuity: the multiplier was above ×1 (up to ×${T.maxMult})`);
  H.assert(T.chipCalls > 0 && T.bonusCalls > 0, `non-vacuity: Thorns chipped (${T.chipCalls}) and wells paid (${T.bonusCalls})`);
  H.assert(T.killCalls > 300 && T.builds > 300, `non-vacuity: kills scored (${T.killCalls}) and built (${T.builds})`);
  for (const k of ["Vaulter", "Carrier", "Weaver", "Drifter", "Surger", "Reaver", "Warden", "Mimic"]) {
    H.assert((T.byClass[k] || 0) > 0, `non-vacuity: a ${k} was killed on the front-door Overdrive board`);
  }
}

H.report("test-cs013-p5.js");
