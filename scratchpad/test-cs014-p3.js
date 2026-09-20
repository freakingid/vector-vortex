// test-cs014-p3.js — CS014's closing phase: the TWELFTH SOAK. Three paired
// proofs over one front-door driver that starts at the boot title (plan §5;
// GDD 17 items 1, 3, 4, 8, 12).
//  1. CLASSIC IS UNTOUCHED. One Classic session (Start Depths 1 / 13 / 23,
//     RESTART, a pause, QUIT) played twice: as is, and with
//     { stub: ["layRings", "takeRings"] } AND RF6's flag mutated to false.
//     ⛔ The state hash is identical on every frame.
//  2. ⚠ THE CUT, END TO END. One Overdrive session on a build carrying the one
//     line `rings: false`. ⛔ Zero rings laid, zero score inside a dive, and
//     the dive is C.DIVE_TIME long — the Classic thorn-dodge, restored.
//  3. THE SOUNDS CANNOT STEER OVERDRIVE. One Overdrive session (MODE →
//     OVERDRIVE → Start Depths 1 / 11 / 17, rings chased, jumps, Purges,
//     dives, RESTART, a pause) on the recording fake and with no audio API.
//     ⛔ Same hash on every frame.
//  4. OVERDRIVE'S INVARIANTS, on every step of that session, with non-vacuity
//     for every one of them.
//
// ⛔ TRAPS. 1. Seed, Date.now and build are re-made per session, in that order,
//     and each pair's two sessions start from equal stores.
//  2. Two live steps before the first press; stop pressing at the stop.
//  3. MODE's rows are OVERDRIVE then CLASSIC: a Classic run steps one row down.
//  4. ⛔ THE DRIVER READS THE BOARD, and every board answer it gives is a NO-OP
//     in Classic — no token, nothing aloft, no MimicShot and ⛔ NO RING exists
//     there — so §1's pair runs one function and is bit-identical either way.
//  5. ⛔ A DIVE'S LENGTH IS A PROPERTY, NEVER A STEP COUNT (STATUS.md): 1/60 is
//     not binary. The claim is on the last observable dive.timer.
//  6. ⛔ THE DIVE'S END IS nextWell() -> enterWell() -> resetDive() ON ONE STEP,
//     so the timer and the rings are read BEFORE the step, never after.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20261010;
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
const MEASURE = !!process.env.P3_MEASURE;

// ⛔ RF6's WHOLE CUT, ONE LINE, in the build exactly once (test-cs014-p1.js
// pins the same string; buildGame() throws if it ever stops being unique).
const CUT = [["    overdrive: { jump: true,  combo: true,  tokens: true,  rings: true  },",
              "    overdrive: { jump: true,  combo: true,  tokens: true,  rings: false },"]];
const STUBS = ["layRings", "takeRings"];

// ⛔ GDD §7's LITERALS (test-cs008-p2.js's trap 1, for its reason).
const GDD = { thornChip: 5, weaver: 50, carrier: 100, vaulter: 150, surger: 200,
              reaver: 300, mimic: 400, warden: 500, wellPerLevel: 100,
              purgeUnspent: 500, noDeath: 1000, bounty: 2000 };

// ⛔ IT TAKES THE BUILD: `instanceof` is per build and this file runs five.
// ⚠ A ring is deliberately NOT on this table — it has no points() and is not
// an entity (GDD §14.5); its price is read off C.RING_POINTS in the dive branch.
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

// test-cs009-p6.js's whole-board hasher, unchanged. It walks state.dive, so the
// ring set is inside the hash for free.
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
// the PLAYER'S own (STATUS's L11+ rule, FOUR clauses since CS014).
// ---------------------------------------------------------------------------
//
//   ring     ⛔ CS014's clause. Inside a dive, steer to the next unresolved ring
//            THAT IS IN REACH: a ring is taken by being inside its arc as the
//            descent crosses its depth (RF2), the rim axis is the only control,
//            so the whole of it is a lane delta. An unreachable one is SKIPPED
//            rather than chased, because chasing it costs the next as well —
//            which is exactly what "you stop earning" is meant to feel like.
//   dodge    a MimicShot is NOT a target, it is a thing to leave (MI2): it
//            declines every shot and kills by contact.
//            ⛔ UNLESS IT IS SHELLED: a Ward is one free hit (T9).
//   collect  a hovering token is taken by TOUCH (T4) and by nothing else.
//   jump     an aloft Warden is killable only by the Jump and blocks the clear
//            (W4, W5), so a non-jumping driver stalls every board from L11.
//   chip     a Thorn is a wall until a Lance is on, and a target after (T7).
//   hunt     otherwise the deepest live non-projectile enemy.
//
// ⛔ Each is a NO-OP wherever the entity does not exist, which is what lets §1's
// Classic pair run this same function and hash identically (trap 4): in Classic
// state.dive.rings is EMPTY on every step of every dive, so the ring clause
// never calls into the build at all.
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

  // ⛔ THE RING CLAUSE, and its whole reach model is the depth model: the
  // descent falls 1 -> 0 over diveTime() - DIVE_GRACE, so the seconds left
  // before ring r resolves are (dive.depth - r.depth) x that span, and the
  // lanes the rim axis covers in them are that x C.KEY_SPEED_MAX. A ring is in
  // reach when its NEAR EDGE — C.RING_ARC_LANES in, the same half-width
  // laneDelta measures — is inside that.
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

  let dodge = null, token = null, best = null;
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
    // so it ranks with the rest. Only worth going to with a Lance on.
    if (e.anchored && !st.powers.lance) continue;
    if (best === null || e.depth > best.depth) best = e;
  }
  for (let n = 0; n < st.tokens.length; n++) {
    const t = st.tokens[n];
    if (t.dead || t.depth < Z.C.TOKEN_HOVER_DEPTH) continue;
    const dd = Z.laneDelta(well, sk.lane, t.lane);
    if (token === null || Math.abs(dd) < Math.abs(token)) token = dd;
  }

  // A dodge is a FULL push away rather than a delta, so a shot in the craft's
  // own lane (delta 0, and -0 is still 0) still moves it.
  let d;
  if (ringD !== null) d = ringD * RIGHT;
  else if (dodge !== null) d = (dodge > 0 ? -RIGHT : RIGHT);
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
// `o.stub`       §1's stubbed twin (the ring calls out)
// `o.cut`        RF6's one line mutated to false
// `o.audio`      §3's recording-fake session
// `o.instrument` §4's per-step invariants (the audio session alone)
function session(o) {
  installSeed(SEED);                        // trap 1
  let now = 0;
  const tick = o.clock || 7919;
  Date.now = () => (now += tick);
  const opts = { store: o.store,
                 spy: ["addScore", "comboKill", "sfx", "collectToken", "dropToken",
                       "jumpStrike", "layRings"] };
  if (o.stub) opts.stub = STUBS;
  if (o.cut) opts.mutate = CUT;
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
    // ⛔ THE RING FLIGHT, counted in EVERY session, instrumented or not: "zero
    // rings in Classic" and "zero rings under the cut" are claims about
    // sessions §4 never instruments.
    ring: { diveSteps: 0, dives: 0, repeats: 0, maxRings: 0, maxTaken: 0,
            takes: 0, misses: 0, score: 0, calls: 0, lives: 0, thornDeaths: 0, ended: 0,
            ends: [], strayRings: 0, relaid: 0, badRelay: 0, layDraws: 0 },
    inv: { steps: 0, nan: 0, bounds: 0, diveTokens: 0, draws: 0, diveDraws: 0,
           diveGrew: 0, diveCombo: 0, ringRange: 0, ringCount: 0,
           badKill: 0, badBonus: 0, badTotal: 0, leftover: 0, badBuilds: 0,
           dropCalls: 0, airDeath: 0, wardenKill: 0, first: {} },
    tally: { dropCalls: 0, killCalls: 0, bountyCalls: 0, chipCalls: 0,
             bonusCalls: 0, ringCalls: 0, builds: 0, byClass: {}, thornDeaths: 0,
             deaths: 0, dives: 0, takeoffs: 0, airSteps: 0, wardenJumpKills: 0,
             maxTokens: 0, maxShots: 0, maxMult: 1 },
    audio: { steps: 0, byTrack: {}, sfx: 0, frames: 0, max: 0, bad: 0 },
  };
  const T = out.tally, R = out.ring;
  const fail = (grp, msg) => { out.inv[grp]++; if (!out.inv.first[grp]) out.inv.first[grp] = msg; };

  // ---- bookkeeping ---------------------------------------------------------
  const calls = [];
  let lastKills = 0, builds = 0, bounties = 0;
  let pre = null, preArr = null, pushedE = null, shots0 = 0;
  let s0 = 0, level0 = 0, diveWas = false, screen0 = "", builds0 = 0;
  let jumpPhase0 = "ground", deaths0 = 0, aloftWas = null, enemies0 = 0, comboWas = "";
  let dropCalls0 = 0, draws = 0, drawsAtDrop = 0, tokens0 = 0, draws0 = 0;
  let struck = new Set(), strikeAir = false, strikeLane = null, strikePre = [];
  let livesPre = 0, inDivePre = false;

  // ⛔ startGame() re-mints state.rng (23-main.js's Object.assign + mulberry32),
  // so the counter is re-attached rather than attached once.
  let rngRaw = null, rngWrapped = null;
  function ensureRng() {
    if (state.rng === rngWrapped) return;
    rngRaw = state.rng;
    rngWrapped = function () { draws++; return rngRaw(); };
    state.rng = rngWrapped;
  }

  // ⛔ THE TWO RING SEATS, COUNTED IN EVERY SESSION (CS014 P2, RF8-A). One call
  // per resolution, on whichever branch the one line took — so "takes + misses"
  // is the set resolved and `takes` is what was paid for.
  X.sfx.before = name => {
    if (name === "ringTake") R.takes++;
    else if (name === "ringMiss") R.misses++;
    if (o.audio) out.audio.sfx++;
  };
  // ⛔ ALWAYS ON: what a dive pays, and whether a ring ever crossed a milestone.
  X.addScore.before = function (n) {
    inDivePre = state.dive.active; livesPre = state.lives;
    if (inDivePre) { R.score += n; R.calls++; }
    if (o.instrument) {
      const kill = state.tally.kills > lastKills;
      lastKills = state.tally.kills;
      calls.push({ n, mult: state.combo.mult, kill });
    }
  };
  X.addScore.after = function () {
    // ⛔ addScore() IS UNCHANGED AND STAYS THE ONE LIFE-AWARDER (RF4, GDD §7).
    if (inDivePre && state.lives > livesPre) R.lives++;
  };
  // ⛔ THE SET'S ONE WAY IN SPENDS NO DRAW (R3), counted at the call.
  X.layRings.before = function () { ensureRng(); draws0 = draws; };
  X.layRings.after = function () { R.layDraws += draws - draws0; };

  if (o.instrument) {
    X.comboKill.before = function () { builds++; };
    X.collectToken.before = function (s, t) { if (t.kind === "bounty") bounties++; };
    X.dropToken.before = function () {
      ensureRng(); drawsAtDrop = draws; tokens0 = state.tokens.length;
    };
    X.dropToken.after = function () {
      T.dropCalls++;
      if (draws - drawsAtDrop !== 1) fail("draws", `a dropToken() spent ${draws - drawsAtDrop} draws`);
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
  }

  function preStep() {
    pre = state.enemies.slice();
    preArr = state.enemies;
    pushedE = [];
    preArr.push = function () { pushedE.push.apply(pushedE, arguments); return Array.prototype.push.apply(this, arguments); };
    shots0 = state.tally.shotsFired;
    s0 = state.score; level0 = state.level; diveWas = state.dive.active; screen0 = state.screen;
    jumpPhase0 = state.jump.phase; deaths0 = state.tally.deaths;
    aloftWas = state.enemies.filter(e => e.aloft && !e.dead);
    enemies0 = state.enemies.length;
    comboWas = J(state.combo);
    lastKills = state.tally.kills;
    calls.length = 0; builds0 = builds; bounties = 0;
    dropCalls0 = T.dropCalls;
    struck = new Set();
    ensureRng();
    draws0 = draws;
  }

  function postStep(stepped) {
    delete preArr.push;
    if (!stepped) return;
    out.inv.steps++;
    const well = X.WELLS[state.wellIndex];
    if (state.combo.mult > T.maxMult) T.maxMult = state.combo.mult;

    // ---- no NaN, and bounded arrays (GDD 17 item 12) ------------------------
    if (state.enemies.length > C.ENEMY_CAP) fail("bounds", `${state.enemies.length} entities`);
    // ⛔ THE CAP IN FORCE (GDD 17 item 4 as CS013 P2 reworded it).
    const shotCap = state.powers.spread ? C.SPREAD_SHOT_MAX : C.SHOT_MAX;
    if (state.shots.length > shotCap) fail("bounds", `${state.shots.length} shots against ${shotCap}`);
    if (state.shots.length > T.maxShots) T.maxShots = state.shots.length;
    if (state.tokens.length > T.maxTokens) T.maxTokens = state.tokens.length;
    for (const v of [state.score, state.time, state.level, state.combo.mult,
                     state.dive.timer, state.dive.depth,
                     state.skimmer ? state.skimmer.lane : 0]) {
      if (!isFinite(v)) fail("nan", `a non-finite scalar on level ${state.level}`);
    }
    for (const e of state.enemies) {
      if (!isFinite(e.lane) || !isFinite(e.depth)) fail("nan", `${e.constructor.name} lane ${e.lane} depth ${e.depth}`);
    }
    for (const r of state.dive.rings) {
      if (!isFinite(r.lane) || !isFinite(r.depth)) fail("nan", `a ring at lane ${r.lane} depth ${r.depth}`);
    }

    // ---- the Jump and the FOURTH kill site, unchanged by CS014 --------------
    if (jumpPhase0 === "air" && state.jump.phase === "air") {
      T.airSteps++;
      if (state.tally.deaths > deaths0) fail("airDeath", `a contact death on an airborne step, level ${state.level}`);
    }
    if (jumpPhase0 !== "air" && state.jump.phase === "air") T.takeoffs++;
    if (state.tally.deaths > deaths0) T.deaths += state.tally.deaths - deaths0;
    for (const e of aloftWas) {
      if (e.dead && !struck.has(e)) {
        fail("wardenKill", `an aloft ${e.constructor.name} died away from jumpStrike()`);
      }
    }

    if (screen0 !== "play") return;

    // ---- ⛔ INSIDE A DIVE (GDD 5, 14.5; RF4, RF5, T5, O5) --------------------
    // The step-at-both-ends reading, the airborne rule's form: a step that ENDS
    // a dive runs nextWell() -> enterWell(), which is the next well's business
    // and not this beat's (trap 6).
    if (diveWas && state.dive.active) {
      // ⛔ A DIVE SPENDS ZERO DRAWS, IN BOTH MODES (R3) — the take pass, the
      // strike, the respawn walk and a repeat's re-lay all included.
      if (draws !== draws0) fail("diveDraws", `a dive step spent ${draws - draws0} draws`);
      // ⛔ THE WELL OWNS THE TOKENS (T5): startDive() empties the array and
      // turns every power off, so no Ward can absorb this module's strike.
      if (state.tokens.length) fail("diveTokens", `${state.tokens.length} tokens inside a dive`);
      if (state.powers.lance || state.powers.spread || state.powers.ward) {
        fail("diveTokens", `a power survived into a dive (${J(state.powers)})`);
      }
      // ⛔ NOTHING IS RELEASED INTO A DIVE: the spawner is short-circuited, and
      // a repeat only ever filters. A death is what can remove one.
      if (state.enemies.length > enemies0 || pushedE.length) {
        fail("diveGrew", `state.enemies grew ${enemies0} -> ${state.enemies.length} inside a dive`);
      }
      // ⛔ O5: THE COMBO CLOCK HOLDS THROUGH A DIVE. A death is the one thing
      // that moves it there, through killSkimmer() -> comboDeath().
      if (state.tally.deaths === deaths0 && J(state.combo) !== comboWas) {
        fail("diveCombo", `the combo moved inside a dive: ${comboWas} -> ${J(state.combo)}`);
      }
    }
    // ⛔ A RING EXISTS ONLY INSIDE A DIVE, AND ONLY WHERE THE FLAG IS ON.
    if (state.dive.rings.length > C.DIVE_RINGS_MAX) {
      fail("ringCount", `${state.dive.rings.length} rings against C.DIVE_RINGS_MAX`);
    }
    for (const r of state.dive.rings) {
      if (!(r.depth >= 0 && r.depth <= 1)) fail("ringRange", `a ring at depth ${r.depth}`);
      if (!(r.taken === null || r.taken === true || r.taken === false)) {
        fail("ringRange", `a ring resolved to ${J(r.taken)}`);
      }
    }

    // ---- ⛔ A DIVE PAYS ONLY RINGS, BUILDS NOTHING AND ROLLS NOTHING --------
    // RF4 and plan §8, the sentence four closed files now carry: EVERY addScore
    // call inside a Dive is one ring at C.RING_POINTS, UNMULTIPLIED. A ring is
    // not a kill and a Dive is not a kill site, so there is no comboKill(), no
    // dropToken(), no tally.kills and no kill sound on the take — the four kill
    // sites and five kill lines are unmoved, and the termination kill still
    // pays nothing. ⚠ The literal is read off the build: C.RING_POINTS is
    // provisional and owned by a tuning pass.
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

    // ---- ⛔ ITEM 8, CALL BY CALL --------------------------------------------
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
    if (T.dropCalls - dropCalls0 !== scoredKills) {
      fail("dropCalls", `${T.dropCalls - dropCalls0} drop rolls against ${scoredKills} kills`);
    }
  }

  // ---- §3's audio instrument (it observes and passes through) --------------
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
    // ⛔ READ BEFORE THE STEP (trap 6): the dive's end is
    // nextWell() -> enterWell() -> resetDive() on one step, so a post-step read
    // of the timer or the set is of the NEXT well's empty bag.
    const diveWas0 = state.dive.active, timer0 = state.dive.timer;
    const rings0 = state.dive.rings.length;
    // ⛔ A RUN THAT ENDS INSIDE A DIVE LEAVES dive.active TRUE (11-dive.js: the
    // game-over stop sits above the dive branch), and the RESTART press is what
    // clears it — so a dive "ending" on a step that did not BEGIN on "play" is
    // a menu, not a completion, and its timer is where the run stopped.
    const screenWas = state.screen;
    const thorn0 = state.tally.thornDeaths;
    let taken0 = 0;
    for (const r of state.dive.rings) if (r.taken === true) taken0++;
    if (o.instrument) preStep();
    G.frame(clock);
    if (o.instrument) postStep(G.stats.ticks > t0);
    if (G.stats.ticks > t0) {
      if (rings0 > R.maxRings) R.maxRings = rings0;
      if (taken0 > R.maxTaken) R.maxTaken = taken0;
      if (state.tally.thornDeaths > thorn0) R.thornDeaths += state.tally.thornDeaths - thorn0;
      if (diveWas0 && screenWas === "play") {
        R.diveSteps++;
        // ⛔ A DIVE DEATH ON THE LAST LIFE STOPS THE DIVE TOO (GDD §5, §4.5):
        // Game.update()'s dive branch sits BELOW the game-over stop, so there
        // is no repeat to count and the frozen board stays on screen.
        if (state.screen === "gameover") R.ended++;
        if (!state.dive.active) { R.dives++; R.ends.push(timer0); }
        else if (state.dive.timer < timer0) {
          // ⛔ A REPEATED DIVE RE-LAYS THE SET (RF3): diveRespawn() ends in
          // startDive(), so a snapshot across a repeat is of objects the array
          // no longer holds.
          R.repeats++;
          if (state.dive.rings.length) {
            R.relaid++;
            if (state.dive.rings.length !== C.DIVE_RINGS_MAX ||
                state.dive.rings.some(r => r.taken !== null)) R.badRelay++;
          }
        }
      } else if (state.dive.rings.length && !state.dive.active) {
        R.strayRings++;     // a ring outside a dive: resetDive() is the one writer
      }
    }
    out.tokenFrames += state.tokens.length;
    if (o.audio) {
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
  T.dives = R.dives;
  out.table = J(X.Scores.list(o.mode));
  out.record = X.levelRecord(o.mode).highestCleared();
  return out;
}

// ===========================================================================
// THE FIVE SESSIONS — two pairs and the cut
// ===========================================================================

const classicPlain = session({ mode: "classic", store: new Map() });
const classicCut = session({ mode: "classic", store: new Map(), stub: true, cut: true });

const OD_CLOCK = 7919;
const odAudio = session({ mode: "overdrive", store: new Map(), audio: true,
                          instrument: true, clock: OD_CLOCK });
const odSilent = session({ mode: "overdrive", store: new Map(), clock: OD_CLOCK });
const odCut = session({ mode: "overdrive", store: new Map(), cut: true, clock: OD_CLOCK });

if (MEASURE) {
  const brief = s => ({ frames: s.frames, steps: s.steps, cases: s.cases, script: s.script,
                        levels: [...s.levels].sort((a, b) => a - b), record: s.record,
                        inv: s.inv, ring: Object.assign({}, s.ring, { ends: s.ring.ends.length }),
                        tally: s.tally, audio: s.audio,
                        exceptions: s.exceptions, stuck: s.stuck });
  console.log(J({ classicPlain: brief(classicPlain), odAudio: brief(odAudio),
                  odCut: brief(odCut) }, null, 1));
}

const C = classicPlain.X.C;
const DT = C.FIXED_DT;
const first = (g, k) => (g.first && g.first[k] ? ` — first: ${g.first[k]}` : "");

// ⛔ A BEAT IS A PROPERTY, NEVER A STEP COUNT (trap 5). `dive.timer` counts up
// through the whole dive and the completion check is `timer >= total`, so the
// last timer observable before the ending step is inside one tick of `total`.
function beatIs(ends, total, label) {
  const bad = ends.filter(t => !(t < total && t + DT >= total));
  H.eq(bad.length, 0, `${label} (${ends.length} dives, worst ${bad.length ? bad[0] : "—"}, ` +
       `want [${(total - DT).toFixed(4)}, ${total})`);
}

// ---------------------------------------------------------------------------
// the front door, in every session
// ---------------------------------------------------------------------------
for (const [name, s] of [["classic", classicPlain], ["classic+cut", classicCut],
                         ["overdrive+audio", odAudio], ["overdrive", odSilent],
                         ["overdrive+cut", odCut]]) {
  H.eq(s.exceptions.length, 0, `⛔ no exception in the ${name} session${s.exceptions[0] ? " — " + s.exceptions[0] : ""}`);
  H.eq(s.stuck.length, 0, `${name}: every run reached game over${s.stuck[0] ? " — " + s.stuck[0] : ""}`);
  for (const [k, r] of s.cases.entries()) {
    H.assert(r.started && r.restarted && r.quit,
             `${name} case ${k}: START DEPTH ${r.depth} → play → RESTART → QUIT TO TITLE (${J(r)})`);
  }
  H.assert(s.script.paused, `${name}: one run paused and resumed`);
  H.assert(s.ring.dives > 0, `${name}: dives ran to their end (${s.ring.dives})`);
  // ⛔ resetDive() IS THE SET'S ONE ERASER AND enterWell() ALREADY CALLS IT, so
  // no ring ever outlives the beat it belongs to — in any mode, cut or not.
  H.eq(s.ring.strayRings, 0, `⛔ ${name}: no ring exists outside a dive`);
  H.eq(s.ring.layDraws, 0, `⛔ ${name}: layRings() spends ZERO draws (R3)`);
}
for (const d of CLASSIC_DEPTHS) H.assert(classicPlain.levels.has(d), `non-vacuity: Classic played at level ${d}`);
for (const d of OD_DEPTHS) H.assert(odAudio.levels.has(d), `non-vacuity: Overdrive played at level ${d}`);

// ---------------------------------------------------------------------------
// 1. ⛔ CLASSIC IS UNTOUCHED BY CS014 — the hash, frame for frame
// ---------------------------------------------------------------------------
{
  const a = classicPlain.hashes, b = classicCut.hashes;
  const n = Math.min(a.length, b.length);
  let firstDiff = -1;
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) { firstDiff = i; break; }
  H.eq(classicCut.X.C.MODE_FLAGS.overdrive.rings, false,
       "fixture: the twin carries RF6's cut as well as the stubs");
  H.eq(a.length, b.length, "⛔ both Classic sessions ran the same number of frames");
  H.eq(firstDiff, -1, `⛔ the whole-board hash is identical on every frame with layRings() ` +
       `and takeRings() stubbed out AND the Overdrive row's rings flag mutated to false ` +
       `(${n} frames)`);
  H.eq(classicPlain.steps, classicCut.steps, "and the same number of play steps");
  H.eq(classicCut.table, classicPlain.table, "and the same local table");
  H.eq(classicCut.record, classicPlain.record, "and the same Start Depth record");
  H.assert(new Set(a).size > n / 4, "non-vacuity: the hash moves with the board");
  H.assert(n > 20000, `non-vacuity: the Classic session is a soak (${n} frames, ${classicPlain.steps} steps)`);

  // ⛔ CLASSIC IS A TOTAL NO-OP, AND THE HASH ALONE DOES NOT SAY IT — nothing
  // laid, nothing taken, nothing sounded, and the beat is C.DIVE_TIME long.
  for (const [name, s] of [["classic", classicPlain], ["classic+cut", classicCut]]) {
    H.eq(s.ring.maxRings, 0, `⛔ ${name}: not one ring is ever laid (modeHas("rings") is false)`);
    H.eq(s.ring.takes + s.ring.misses, 0, `⛔ ${name}: and neither seat ever sounds`);
    H.eq(s.ring.score, 0, `⛔ ${name}: a Classic dive still scores NOTHING`);
    beatIs(s.ring.ends, C.DIVE_TIME, `⛔ ${name}: every dive is C.DIVE_TIME long`);
  }
  H.eq(classicPlain.tokenFrames + classicCut.tokenFrames, 0,
       "⛔ and a CLASSIC session never sees a token either (GDD 13)");
}

// ---------------------------------------------------------------------------
// 2. ⚠ THE CUT, THROUGH THE FRONT DOOR — one line, and it takes the feature
// ---------------------------------------------------------------------------
//
// ⛔ ROADMAP names CS014 as the FIRST cut under schedule pressure and its
// condition is that no other changeset's code is touched. test-cs014-p1.js
// proves the line on a driven board; this is the same claim played from the
// boot title, against the behaviour four closed soak files assert.
{
  const ZC = odCut.X.C;
  H.eq(ZC.MODE_FLAGS.overdrive.rings, false, "fixture: the Overdrive row is cut");
  H.eq(odCut.X.modeHas("rings", "overdrive"), false, "⛔ and modeHas() reads it — the gate is the whole mechanism");
  H.eq(odCut.ring.maxRings, 0, "⛔ THE CUT LAYS ZERO RINGS — so none is taken, drawn or sounded");
  H.eq(odCut.ring.takes + odCut.ring.misses, 0, "⛔ and neither seat ever sounds");
  H.eq(odCut.ring.score, 0, "⛔ and a cut Overdrive dive scores NOTHING (test-cs012-p6.js's behaviour, restored)");
  beatIs(odCut.ring.ends, ZC.DIVE_TIME,
         "⛔ and its dive is C.DIVE_TIME long, not C.DIVE_TIME_OD");
  H.eq(odCut.X.diveTime(), ZC.DIVE_TIME, "⛔ diveTime() reads the FLAG, so the cut takes the length with it");
  // ⛔ AND NO OTHER CHANGESET'S CODE IS TOUCHED (ROADMAP's condition).
  H.eq(J([ZC.MODE_FLAGS.overdrive.jump, ZC.MODE_FLAGS.overdrive.combo, ZC.MODE_FLAGS.overdrive.tokens]),
       J([true, true, true]), "⛔ the cut takes the rings and nothing else");
  H.assert(odCut.tokenFrames > 0, `non-vacuity: the cut session still had its tokens (${odCut.tokenFrames} token-frames)`);
  H.assert(odCut.ring.dives > 5, `non-vacuity: the cut session dived (${odCut.ring.dives})`);
}

// ---------------------------------------------------------------------------
// 3. ⛔ THE SOUNDS CANNOT STEER OVERDRIVE — the hash, frame for frame
// ---------------------------------------------------------------------------
//
// ⛔ CS014 P2 seated two NEW sounds inside the simulation's own take pass
// (RF8-A), which is the first time a seat has sat on a line that also scores.
// This is the pair that says the seat writes nothing.
{
  const a = odAudio.hashes, b = odSilent.hashes;
  const n = Math.min(a.length, b.length);
  let firstDiff = -1;
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) { firstDiff = i; break; }
  H.eq(a.length, b.length, "⛔ both Overdrive sessions ran the same number of frames");
  H.eq(firstDiff, -1, `⛔ the whole-board hash is identical on every frame, audio on and off (${n} frames)`);
  H.eq(odAudio.steps, odSilent.steps, "and the same number of play steps");
  H.eq(odSilent.table, odAudio.table, "and the same local table");
  H.eq(J(odSilent.ring.ends), J(odAudio.ring.ends), "and every dive ran for the same beat");
  H.eq(odSilent.ring.takes, odAudio.ring.takes, "⛔ and the same rings were taken");
  H.eq(odSilent.ring.misses, odAudio.ring.misses, "and the same rings were missed");
  H.assert(new Set(a).size > n / 4, "non-vacuity: the hash moves with the board");
  H.assert(n > 20000, `non-vacuity: the Overdrive session is a soak (${n} frames, ${odAudio.steps} steps)`);
  H.assert((odAudio.audio.byTrack.drive || 0) > 1000,
           `non-vacuity: the audio session really played \`drive\` (${J(odAudio.audio.byTrack)})`);
  H.assert(odAudio.audio.sfx > 1000,
           `non-vacuity: and really sounded CS014's seats among ${odAudio.audio.sfx} sfx() calls`);
  H.eq(odAudio.audio.bad, 0,
       `⛔ GDD 17 item 9: the director's level and the music's intensity and sweep are in [0, 1] ` +
       `on all ${odAudio.audio.frames} frames`);
}

// ---- ⛔ O14: the director's maximum on a CS014 OVERDRIVE board, RECORDED -----
{
  const max = odAudio.audio.max;
  const hz = C.FILTER_MIN_HZ * Math.pow(C.FILTER_MAX_HZ / C.FILTER_MIN_HZ, max);
  H.assert(max >= C.LAYER_THRESHOLD[3],
           `non-vacuity: the director passed tier 3 on the played Overdrive boards (max ${max.toFixed(4)})`);
  H.assert(max < 1,
           `⛔ O14: the sweep still does NOT open end to end with the ring flight live — the ` +
           `maximum is ${max.toFixed(4)} (${Math.round(hz)} Hz against C.FILTER_MAX_HZ ` +
           `${C.FILTER_MAX_HZ}). GDD §19 keeps its ✗ and no weight is rescaled (Paul's D6)`);
  console.log(`  MEASURED (CS014 P3, the twelfth soak): Overdrive director max ${max.toFixed(4)}, ` +
              `sweep ${Math.round(hz)} Hz, up to ×${odAudio.tally.maxMult}, over ` +
              `${odAudio.audio.frames} front-door frames (CS013 P5's eleventh soak measured 0.6860)`);
}

// ---------------------------------------------------------------------------
// 4. ⛔ OVERDRIVE'S INVARIANTS, ON EVERY STEP OF THAT SESSION
// ---------------------------------------------------------------------------
{
  const inv = odAudio.inv, T = odAudio.tally, R = odAudio.ring;
  H.assert(inv.steps > 10000, `fixture: the invariants were checked on ${inv.steps} steps`);
  H.eq(inv.nan, 0, `⛔ no NaN anywhere on the board, the ring set included (GDD 17 item 12)${first(inv, "nan")}`);
  H.eq(inv.bounds, 0, `⛔ no array past C.ENEMY_CAP or the SHOT CAP IN FORCE (GDD 17 item 4)${first(inv, "bounds")}`);
  H.eq(inv.ringCount, 0, `⛔ never more than C.DIVE_RINGS_MAX rings (GDD 14.5's hard cap)${first(inv, "ringCount")}`);
  H.eq(inv.ringRange, 0, `⛔ every ring depth is in [0, 1] and every ring is null / true / false${first(inv, "ringRange")}`);
  H.eq(inv.diveDraws, 0, `⛔ A DIVE SPENDS ZERO DRAWS, in both modes (R3)${first(inv, "diveDraws")}`);
  H.eq(inv.diveTokens, 0, `⛔ THE WELL OWNS THEM (T5): no token and no power inside a Dive${first(inv, "diveTokens")}`);
  H.eq(inv.diveGrew, 0, `⛔ state.enemies NEVER GROWS inside a dive — the spawner is short-circuited${first(inv, "diveGrew")}`);
  H.eq(inv.diveCombo, 0, `⛔ O5: the combo is unchanged across every dive step that is not a death${first(inv, "diveCombo")}`);
  H.eq(inv.draws, 0, `⛔ EXACTLY ONE DRAW PER OVERDRIVE KILL (T2)${first(inv, "draws")}`);
  H.eq(inv.dropCalls, 0, `⛔ one roll per kill at a kill site, and NONE in a dive${first(inv, "dropCalls")}`);
  H.eq(inv.airDeath, 0, `⛔ NO CONTACT DEATH WHILE AIRBORNE (GDD 14.2)${first(inv, "airDeath")}`);
  H.eq(inv.wardenKill, 0, `⛔ AN ALOFT ENTITY DIES ONLY TO AN AIRBORNE CRAFT IN ITS LANE (W4)${first(inv, "wardenKill")}`);
  H.eq(inv.badKill + inv.badBonus + inv.badTotal + inv.leftover + inv.badBuilds, 0,
       `⛔ GDD 17 item 8 IN OVERDRIVE, call by call: every kill pays a GDD §7 price on the board ` +
       `times the multiplier live at that call, every other call is an UNMULTIPLIED literal, and ` +
       `⛔ EVERY addScore CALL INSIDE A DIVE IS ONE RING AT C.RING_POINTS AND NOTHING ELSE (RF4)` +
       `${first(inv, "badKill")}${first(inv, "badBonus")}${first(inv, "badTotal")}${first(inv, "leftover")}${first(inv, "badBuilds")}`);
  H.eq(R.badRelay, 0, "⛔ AND A REPEATED DIVE RE-LAYS THE WHOLE SET, every ring unresolved (RF3)");

  // ⛔ NON-VACUITY FOR EVERY CLAIM ABOVE.
  H.eq(R.maxRings, C.DIVE_RINGS_MAX, `non-vacuity: the board reached C.DIVE_RINGS_MAX rings (${R.maxRings})`);
  H.assert(R.takes > 0, `non-vacuity: rings were TAKEN (${R.takes})`);
  H.assert(R.misses > 0, `non-vacuity: and rings were MISSED — "you stop earning" happened (${R.misses})`);
  H.eq(R.takes, R.calls, "⛔ ONE PAYOUT PER TAKE and none per miss — ringTake and C.RING_POINTS are the same event");
  H.eq(R.score, R.takes * C.RING_POINTS, "⛔ and every one of them paid C.RING_POINTS, unmultiplied");
  H.eq(T.ringCalls, R.calls, "and the per-step decoder priced every one of them");
  H.eq(R.maxTaken, C.DIVE_RINGS_MAX, `non-vacuity: a FULL SET was cleared in one dive (${R.maxTaken} of ${C.DIVE_RINGS_MAX})`);
  H.assert(R.repeats > 0 && R.relaid > 0,
           `non-vacuity (RF3, RF5): a dive was REPEATED after a strike and the set was re-laid (${R.repeats})`);
  H.assert(R.thornDeaths > 0, `⛔ non-vacuity (RF5): GDD §4.5 ITEM 5 STILL FIRES in Overdrive (${R.thornDeaths} Thorn deaths)`);
  H.eq(R.thornDeaths, R.repeats + R.ended,
       "⛔ and every one of them either REPEATED THE DIVE — not the well — or ENDED THE RUN, " +
       "which stops the dive too (GDD §5, §4.5 item 5)");
  H.assert(R.ended > 0, `non-vacuity: and a dive death ended a run (${R.ended})`);
  beatIs(R.ends, C.DIVE_TIME_OD, "⛔ and every Overdrive dive is C.DIVE_TIME_OD long, grace included (RF9)");
  H.assert(C.DIVE_TIME_OD > C.DIVE_TIME, "fixture: which is a different number from Classic's");
  H.assert(T.dropCalls > 300, `non-vacuity: ${T.dropCalls} kills rolled for a token`);
  H.assert(odAudio.tokenFrames > 0, `non-vacuity: tokens stood on the Overdrive board (${odAudio.tokenFrames} token-frames)`);
  H.assert(T.maxShots > C.SHOT_MAX, `non-vacuity: the rack passed C.SHOT_MAX under Spread's wider cap (${T.maxShots})`);
  H.assert(T.bountyCalls > 0, `non-vacuity: Bounties were collected and priced (${T.bountyCalls})`);
  H.assert(T.wardenJumpKills > 0, `non-vacuity: Wardens were JUMP-KILLED (${T.wardenJumpKills})`);
  H.assert(T.takeoffs >= 20 && T.airSteps > 1000,
           `non-vacuity: jumps were taken (${T.takeoffs} takeoffs, ${T.airSteps} wholly airborne steps)`);
  H.assert(T.maxMult > 1, `non-vacuity: the multiplier was above ×1 (up to ×${T.maxMult})`);
  H.assert(T.chipCalls > 0 && T.bonusCalls > 0, `non-vacuity: Thorns chipped (${T.chipCalls}) and wells paid (${T.bonusCalls})`);
  H.assert(T.killCalls > 300 && T.builds > 300, `non-vacuity: kills scored (${T.killCalls}) and built (${T.builds})`);
  for (const k of ["Vaulter", "Carrier", "Weaver", "Drifter", "Surger", "Reaver", "Warden", "Mimic"]) {
    H.assert((T.byClass[k] || 0) > 0, `non-vacuity: a ${k} was killed on the front-door Overdrive board`);
  }
  console.log(`  MEASURED (CS014 P3): ${R.dives} dives, ${R.diveSteps} dive steps, ` +
              `${R.takes} rings taken and ${R.misses} missed, ${R.repeats} repeats after a ` +
              `strike, ${R.ended} run-ending, ` +
              `${R.lives} extra lives crossed on a ring`);
}

// ---------------------------------------------------------------------------
// 5. ⛔ AN EXTRA LIFE CROSSED ON A RING — addScore() IS UNCHANGED
// ---------------------------------------------------------------------------
//
// RF4's last clause and the one the played board cannot be relied on to reach:
// C.RING_POINTS is 100 against C.EXTRA_LIFE_EVERY 40,000. ⛔ STAGED, and the
// staging is a milestone, never a second scoring path — the take pass is the
// real one, driven through the real beat (trap 4 of test-cs014-p1.js).
{
  installSeed(SEED);
  const Z = H.buildGame({ spy: ["sfx"] });
  const ZC = Z.C, st = Z.state;
  Z.Game.reset();
  Z.startGame(SEED, { mode: "overdrive", startDepth: 1 });
  st.level = 5;
  st.wellIndex = 0;                          // the closed 16-lane Ring: every ring lane is a centre
  Z.enterWell();
  st.spawn.remaining = 0; st.enemies = []; st.shots = [];
  st.invulnTime = ZC.RESPAWN_INVULN;
  Z.Game.input.reset();
  Z.startDive(st);
  const well = Z.WELLS[st.wellIndex];
  H.eq(st.dive.rings.length, ZC.DIVE_RINGS_MAX, "fixture: a full set is laid");
  st.skimmer.lane = st.dive.rings[0].lane;   // parked inside the first ring's arc
  const lives0 = st.lives, score0 = 0;
  st.score = score0;
  st.nextLife = score0 + ZC.RING_POINTS;     // the next ring is the milestone
  H.assert(st.lives < ZC.LIVES_MAX, "fixture: below the life cap, so an award is not refused");
  const heard = [];
  Z.sfx.before = n => heard.push(n);
  for (let i = 0; i < 600 && st.dive.rings[0].taken === null; i++) Z.updateDive(st, well, ZC.FIXED_DT);
  H.eq(st.dive.rings[0].taken, true, "fixture: the parked craft TOOK the first ring, through the real take pass");
  H.eq(st.score, score0 + ZC.RING_POINTS, "and paid C.RING_POINTS for it");
  H.eq(st.lives, lives0 + 1,
       "⛔ A RING CAN CROSS AN EXTRA-LIFE MILESTONE — addScore() is unchanged and stays the ONE " +
       "writer and the ONE life-awarder (RF4, GDD §7)");
  H.assert(heard.indexOf("extraLife") >= 0, "and the award is addScore()'s own, sounded there");
  H.assert(heard.indexOf("ringTake") >= 0, "beside the take's own seat");
}

H.report("test-cs014-p3.js");
