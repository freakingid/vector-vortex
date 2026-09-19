// test-cs013-p2.js — CS013 P2: Lance, Spread and the Ward (GDD 4.2, 4.4, 4.5,
// 7, 14.1, 17 items 4 and 8; PLANNED-FEATURES-CS013.md T5, T7, T8, T9).
// Asserts what P2 owns: Spread's three lanes and the cap in force on the built
// fire path, Lance as "a KILL does not consume the shot" with every non-kill
// answer unchanged, the Thorn's 3× chip priced per chip of length, GDD §17
// item 8 with Lance live on played Overdrive boards, the Ward absorbing each
// death condition below the invulnerability guard without being a death, and a
// Classic run that never reads a power — mutation-checked.
//
// ⛔ TRAPS.
//  1. A FRESH SHOT HAS t === 0 and the fire path AGES BEFORE IT FIRES, so a
//     volley is exactly the shots at t === 0 after the call. state.shots is
//     REPLACED by that call (STATUS), so a hook on the array never sees a push.
//  2. Rates are per LANE per second, never a step count: 1/60 is not binary.
//  3. `instanceof` is per build — every helper takes the build (STATUS).
//  4. mutantRed() proves its string is in the build exactly once BEFORE it
//     asserts red, and a mutant run reports counts rather than throwing.
"use strict";

const fs = require("fs");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260919;
installSeed(SEED);                          // ⛔ above the first buildGame()
const SPIES = ["addScore", "sfx", "comboKill", "collectToken"];
const X = H.buildGame({ spy: SPIES });
const C = X.C, G = X.Game, S = X.state, DT = C.FIXED_DT;
const J = JSON.stringify;
const SCRIPT = H.extractScript(fs.readFileSync(path.join(__dirname, "..", "dist", "vector-vortex.html"), "utf8"));
const PARK = 1 - C.RIM_CONTACT_DEPTH;
const RING = 0, VEE = 7;
const OPEN = X.WELLS.map((w, i) => [w, i]).filter(p => !p[0].closed);

H.assert(X.WELLS[RING].closed && X.WELLS[RING].lanes === 16, "fixture: WELLS[0] is the closed 16-lane Ring");
H.assert(!X.WELLS[VEE].closed, "fixture: WELLS[7] is open");
H.assert(OPEN.length === 6, `fixture: six open wells (${OPEN.length})`);

// A quiet board in `mode`: spawner held, nothing on it, no input.
function quiet(Z, mode, wellIndex) {
  const ZG = Z.Game, st = Z.state;
  ZG.reset();
  Z.startGame(SEED, { mode });
  st.wellIndex = wellIndex === undefined ? RING : wellIndex;
  Z.enterWell();
  st.spawn.remaining = 1;
  st.spawn.timer = -1e9;
  st.enemies = [];
  st.shots = [];
  ZG.input.reset();
  return Z.WELLS[st.wellIndex];
}
function put(e) { S.enemies.push(e); return e; }
// A shot in flight at `depth`, as the fire path would have made it.
function shotAt(Z, well, lane, depth, pierce) {
  const s = new Z.Shot(well, lane, pierce);
  s.t = (1 - depth) * Z.C.SHOT_TIME;
  Z.state.shots.push(s);
  return s;
}
// addScore calls made inside fn(), in order.
function scored(Z, fn) {
  const calls = [];
  Z.addScore.before = n => calls.push(n);
  try { fn(); } finally { Z.addScore.before = null; }
  return calls;
}
function sounded(Z, fn) {
  const names = [];
  Z.sfx.before = n => names.push(n);
  try { fn(); } finally { Z.sfx.before = null; }
  return names;
}

// ---------------------------------------------------------------------------
// 1. SPREAD — THE VOLLEY'S LANES (T8)
// ---------------------------------------------------------------------------
H.eq(C.SPREAD_SHOT_MAX, 3 * C.SHOT_MAX, `⛔ the cap under Spread is 3 × SHOT_MAX (${C.SPREAD_SHOT_MAX})`);
{
  const ring = quiet(X, "overdrive", RING);
  const lanes = (l) => X.fireLanes(S, ring, l).slice();
  S.powers.spread = false;
  H.eq(J(lanes(4)), J([4]), "⛔ without Spread the volley is the facing lane alone");
  S.powers.spread = true;
  H.eq(J(lanes(4)), J([4, 3, 5]), "⛔ with Spread it is the facing lane and both neighbours (T8)");
  H.eq(J(lanes(0)), J([0, 15, 1]), "⛔ and it wraps across a closed well's seam — laneNormalize, never (lane ± 1)");
  H.eq(J(lanes(15)), J([15, 14, 0]), "⛔ at the other side of the seam too");
}
for (const [well, idx] of OPEN) {
  const max = well.lanes - 1;
  quiet(X, "overdrive", idx);
  S.powers.spread = true;
  const lo = X.fireLanes(S, well, 0).slice(), hi = X.fireLanes(S, well, max).slice();
  H.eq(J(lo), J([0, 1]), `⛔ ${well.name}: at the low wall the volley is TWO lanes, deduplicated (T8)`);
  H.eq(J(hi), J([max, max - 1]), `⛔ ${well.name}: and two at the high wall`);
  for (const v of [lo, hi]) H.eq(new Set(v).size, v.length, `⛔ ${well.name}: never two shots in one lane`);
}

// ---------------------------------------------------------------------------
// 2. ⛔ SPREAD ON THE BUILT FIRE PATH — the rate and the cap (T8; item 4)
// ---------------------------------------------------------------------------
//
// ⛔ trap 1: the volley is the shots at t === 0 after the call, and the cap is
// read off the same flag the build reads.
function fireRun(Z, spread, wellIndex, lane, ticks) {
  const st = Z.state, ZC = Z.C;
  const well = quiet(Z, "overdrive", wellIndex);
  st.powers.spread = spread;
  st.skimmer.lane = lane;
  st.input.fire = true;
  const cap = spread ? ZC.SPREAD_SHOT_MAX : ZC.SHOT_MAX;
  const per = new Map();
  const out = { cap, over: 0, max: 0, volleys: 0, sizes: new Set(), per, ticks };
  for (let i = 0; i < ticks; i++) {
    Z.updateShots(st, well, ZC.FIXED_DT);
    let fresh = 0;
    for (const s of st.shots) if (s.t === 0) { per.set(s.lane, (per.get(s.lane) || 0) + 1); fresh++; }
    if (fresh) { out.volleys++; out.sizes.add(fresh); }
    if (st.shots.length > out.max) out.max = st.shots.length;
    if (st.shots.length > cap) out.over++;
  }
  out.rates = [...per.entries()].sort((a, b) => a[0] - b[0]).map(e => [e[0], e[1] / (ticks * ZC.FIXED_DT)]);
  return out;
}
const RATE_TICKS = 6000;                     // 100 s
const GDD_RATE = 15.0;                       // plan §1.6's row for T8's answer
{
  const r = fireRun(X, true, RING, 4, RATE_TICKS);
  H.eq(r.rates.length, 3, `⛔ held fire under Spread feeds exactly three lanes (${J(r.rates)})`);
  for (const [lane, rate] of r.rates) {
    // trap 2: one step of quantization at this cadence is 60 / 4 / 4 ≈ 0.94 /s.
    H.assert(Math.abs(rate - GDD_RATE) <= 0.95,
             `⛔ lane ${lane} keeps plan §1.6's ${GDD_RATE} shots/s under Spread (measured ${rate.toFixed(3)})`);
  }
  H.eq(r.over, 0, `⛔ GDD §17 item 4: the CAP IN FORCE (${r.cap}) is never exceeded under held fire`);
  H.eq(J([...r.sizes]), J([3]), "⛔ and every volley is a whole one at this cap — none is cut short");
  H.assert(r.max > C.SHOT_MAX, `non-vacuity: Spread really does exceed the Classic cap (${r.max} in flight against SHOT_MAX ${C.SHOT_MAX})`);
}
{
  const r = fireRun(X, false, RING, 4, RATE_TICKS);
  H.eq(r.rates.length, 1, "⛔ without Spread one lane is fed");
  H.assert(Math.abs(r.rates[0][1] - GDD_RATE) <= 0.95,
           `⛔ and at the same ${GDD_RATE} shots/s (measured ${r.rates[0][1].toFixed(3)}) — Spread costs the facing lane nothing`);
  H.eq(r.over, 0, `⛔ and C.SHOT_MAX (${C.SHOT_MAX}) is the cap in force there (test-cs002-p3.js's claim, unmoved)`);
  H.eq(r.max, C.SHOT_MAX, "fixture: the Classic cap is reached, so it is really the binding one");
}
for (const [well, idx] of OPEN) {
  for (const lane of [0, well.lanes - 1]) {
    const r = fireRun(X, true, idx, lane, 12);
    H.assert(r.volleys > 0 && J([...r.sizes]) === J([2]),
             `⛔ ${well.name} lane ${lane}: a volley at the wall is TWO shots, one per lane (${J([...r.sizes])})`);
    H.eq(r.rates.length, 2, `⛔ ${well.name} lane ${lane}: in two distinct lanes`);
    H.eq(r.over, 0, `⛔ ${well.name} lane ${lane}: under the cap in force`);
  }
}

// ---------------------------------------------------------------------------
// 3. LANCE — a KILL does not consume the shot, and nothing else changes (T7)
// ---------------------------------------------------------------------------
{
  const well = quiet(X, "overdrive", RING);
  H.eq(new X.Shot(well, 4).pierce, false, "⛔ a Shot's `pierce` is false unless it is fired with Lance");
  H.eq(new X.Shot(well, 4, true).pierce, true, "and true when it is (captured at fire time)");
  S.powers.lance = true;
  S.skimmer.lane = 4;
  S.input.fire = true;
  S.shotCooldown = C.SHOT_COOLDOWN;
  X.updateShots(S, well, DT);
  H.assert(S.shots.length > 0 && S.shots.every(s => s.pierce === true),
           "⛔ the fire path stamps state.powers.lance onto every shot it fires");
  S.powers.lance = false;
  S.shotCooldown = C.SHOT_COOLDOWN;
  X.updateShots(S, well, DT);
  H.assert(S.shots.some(s => s.pierce === false), "⛔ and a shot fired after it lapses is not pierced — it is the SHOT's field");
}

// A pierced shot flies on through a kill and kills what is behind it later.
function throughTwo(Z, pierce) {
  const well = quiet(Z, "overdrive", RING);
  const st = Z.state;
  const near = new Z.Vaulter(4, 0.62, 1), far = new Z.Vaulter(4, 0.30, 1);
  near.hopping = false; far.hopping = false;
  st.enemies.push(near, far);
  const s = shotAt(Z, well, 4, 0.62, pierce);
  Z.collideShots(st, well);
  const out = { firstKill: near.dead, spentOnKill: s.dead, secondKill: false, steps: 0, sameStep: far.dead };
  for (let i = 0; i < 40 && !s.dead && !far.dead; i++) {
    s.t += Z.C.FIXED_DT;                     // the flight, without firing more
    if (s.depth() <= 0) { s.dead = true; break; }
    Z.collideShots(st, well);
    out.steps++;
  }
  out.secondKill = far.dead;
  return out;
}
{
  const r = throughTwo(X, true);
  H.eq(J([r.firstKill, r.spentOnKill]), J([true, false]), "⛔ LANCE: a KILL does not consume the shot (T7)");
  H.eq(r.sameStep, false, "⛔ and the unconditional `break` still holds — it resolves ONE enemy per step");
  H.assert(r.secondKill && r.steps > 1, `⛔ it meets the next one on a LATER step, at a depth it travelled to (${r.steps} steps)`);
  const p = throughTwo(X, false);
  H.eq(J([p.firstKill, p.spentOnKill, p.secondKill]), J([true, true, false]),
       "fixture: without Lance the same shot is spent on the first kill and the second enemy lives");
}

// A chip, a refusal and a decline are unchanged by Lance.
function answers(Z, pierce) {
  const out = {};
  {
    const well = quiet(Z, "overdrive", RING);
    const t = new Z.Thorn(4, 0.60);
    Z.state.enemies.push(t);
    const s = shotAt(Z, well, 4, 0.60, pierce);
    Z.collideShots(Z.state, well);
    out.chip = { consumed: s.dead, dead: t.dead, len: t.depth };
  }
  {
    const well = quiet(Z, "overdrive", RING);
    const d = new Z.Drifter(4, 0.60, 1);
    d.phase = "ride"; d.rideTimer = -1e9;
    Z.state.enemies.push(d);
    const s = shotAt(Z, well, 4, 0.60, pierce);
    Z.collideShots(Z.state, well);
    out.armour = { consumed: s.dead, dead: d.dead };
  }
  {
    const well = quiet(Z, "overdrive", RING);
    const b = new Z.WeaverBolt(4, 0.60);
    Z.state.enemies.push(b);
    const s = shotAt(Z, well, 4, 0.60, pierce);
    Z.collideShots(Z.state, well);
    out.bolt = { consumed: s.dead, dead: b.dead };
  }
  {
    const well = quiet(Z, "overdrive", RING);
    const car = new Z.Carrier(4, 0.60, "vaulter");
    Z.state.enemies.push(car);
    const s = shotAt(Z, well, 4, 0.60, pierce);
    Z.collideShots(Z.state, well);
    const kids = Z.state.enemies.filter(e => e !== car && !e.dead);
    out.carrier = { consumed: s.dead, dead: car.dead, kids: kids.length, kidsHit: kids.filter(e => e.dead).length };
  }
  return out;
}
{
  const on = answers(X, true), off = answers(X, false);
  H.eq(J(on.chip), J({ consumed: true, dead: false, len: 0.60 - C.LANCE_CHIP_MULT * C.THORN_CHIP }),
       "⛔ a CHIP still consumes the shot under Lance — a chip is not a kill (T7)");
  H.eq(J(off.chip), J({ consumed: true, dead: false, len: 0.60 - C.THORN_CHIP }), "fixture: and without Lance it takes one chip");
  H.eq(J(on.armour), J(off.armour), "⛔ a riding Drifter's armour refuses exactly as it does without Lance");
  H.eq(J(on.armour), J({ consumed: false, dead: false }), "⛔ (it declines the shot, which flies on)");
  H.eq(J(on.bolt), J(off.bolt), "⛔ a Weaver bolt declines exactly as it does without Lance");
  H.eq(J(on.bolt), J({ consumed: false, dead: false }), "⛔ (declined, undamaged — GDD §6.5's shield)");
  H.eq(J([on.carrier.dead, on.carrier.kids, on.carrier.kidsHit]), J([true, 2, 0]),
       "⛔ a Carrier splits under Lance and the pierced shot does NOT walk into its children (the `break`)");
  H.eq(on.carrier.consumed, false, "⛔ and the split — a kill — does not consume it");
  H.eq(off.carrier.consumed, true, "fixture: without Lance the same split consumes it");
}

// The Thorn's 3× chip, priced per chip of length (T7; GDD §7).
{
  const well = quiet(X, "overdrive", RING);
  const t = put(new X.Thorn(4, 0.60));
  const s = shotAt(X, well, 4, 0.60, true);
  const calls = scored(X, () => X.collideShots(S, well));
  H.eq(J(calls), J([C.PTS_THORN, C.PTS_THORN, C.PTS_THORN]),
       `⛔ a Lance chip pays PTS_THORN PER CHIP OF LENGTH — ${C.LANCE_CHIP_MULT} calls of ${C.PTS_THORN}, never one of ${C.LANCE_CHIP_MULT * C.PTS_THORN} (T7)`);
  H.assert(Math.abs(0.60 - t.depth - C.LANCE_CHIP_MULT * C.THORN_CHIP) < 1e-9,
           `⛔ and removes LANCE_CHIP_MULT × THORN_CHIP of length (${(0.60 - t.depth).toFixed(3)})`);
  H.eq(s.dead, true, "and the shot stopped at the tip");
}
for (const [len, want] of [[C.THORN_CHIP, 1], [2 * C.THORN_CHIP, 2], [3 * C.THORN_CHIP, 3]]) {
  const well = quiet(X, "overdrive", RING);
  const t = put(new X.Thorn(4, len));
  shotAt(X, well, 4, len, true);
  const calls = scored(X, () => X.collideShots(S, well));
  // ⛔ The kill site's own addScore(e.points()) is the Thorn's 0 (GDD §7): the
  // chips are its whole worth, so the priced calls are the non-zero ones.
  H.eq(J(calls.filter(n => n !== 0)), J(new Array(want).fill(C.PTS_THORN)),
       `⛔ a Thorn with ${want} chip(s) of length left pays ${want} × ${C.PTS_THORN} — clamped by what is there, never ${C.LANCE_CHIP_MULT}`);
  H.eq(J([t.dead, t.depth]), J([true, 0]), "and dies at zero length, never negative (GDD 3.2)");
}
{
  // ⛔ ONE `chip` sound per hit, not per chip of length.
  const well = quiet(X, "overdrive", RING);
  put(new X.Thorn(4, 0.60));
  shotAt(X, well, 4, 0.60, true);
  const names = sounded(X, () => X.collideShots(S, well));
  H.eq(names.filter(n => n === "chip").length, 1, "⛔ a Lance chip is ONE `chip` sound — the hit is the event");
}

// ⛔ Thorn.onShot() is the first onShot that reads its argument (T7): `null` is
// legal, and no Thorn ever reaches the rim sweep that passes it.
{
  const well = quiet(X, "overdrive", RING);
  const t = new X.Thorn(4, 0.60);
  H.eq(t.killDepth, null, "⛔ a Thorn's killDepth is null, so collideSkimmer() skips it above the rim sweep");
  let threw = null;
  try { t.onShot(null); } catch (e) { threw = e.message; }
  H.eq(threw, null, "⛔ onShot(null) does not throw — the sweep's argument is guarded (T7)");
  H.eq(J([t.depth, t.dead]), J([0.60 - C.THORN_CHIP, false]), "and `null` means ONE chip, never Lance's three");

  // The sweep, staged: a full-length Thorn in a firing craft's lane at the rim.
  const rim = put(new X.Thorn(4, C.THORN_MAX));
  S.skimmer.lane = 4;
  S.input.fire = true;
  const calls = scored(X, () => X.collideSkimmer(S, well));
  H.eq(J([rim.depth, rim.dead, calls.length, S.skimmer.dead]), J([C.THORN_MAX, false, 0, false]),
       "⛔ A THORN NEVER REACHES THE RIM SWEEP: a firing craft standing in a full-length Thorn's lane neither chips it nor dies");
}

// ---------------------------------------------------------------------------
// 4. ⛔ GDD §17 ITEM 8 WITH LANCE LIVE — per addScore CALL (test-cs012-p4.js's
//    form), on played Overdrive boards
// ---------------------------------------------------------------------------
//
// ⛔ GDD §7's literals, written out (test-cs008-p2.js's trap 1).
const GDD = { thornChip: 5, weaver: 50, carrier: 100, vaulter: 150, surger: 200,
              reaver: 300, wellPerLevel: 100, purgeUnspent: 500, noDeath: 1000, bounty: 2000 };
// ⛔ trap 3: it takes the build.
function gddPoints(Z, e) {
  if (e instanceof Z.Reaver) return GDD.reaver;      // before Vaulter: it extends it
  if (e instanceof Z.Vaulter) return GDD.vaulter;
  if (e instanceof Z.Carrier) return GDD.carrier;
  if (e instanceof Z.Weaver) return GDD.weaver;
  if (e instanceof Z.Surger) return GDD.surger;
  if (e instanceof Z.Drifter) return e.depth < 1 / 3 ? 250 : e.depth < 2 / 3 ? 500 : 750;
  return 0;   // the Thorn scores per chip; the bolt is not on GDD §7
}
// test-cs012-p4.js's chip decoder, unchanged — ⛔ it prices a Thorn by its
// LENGTH CHANGE, so a 3× chip decodes as three chips of 5 with no edit.
function chipsOf(Z, t, before, weavers) {
  const ZC = Z.C;
  let g = before === undefined ? 0 : before;
  for (const w of weavers) {
    if (w.phaseBefore === "climb" && w.e.thorn === t) g = Math.max(g, Math.min(w.e.depth, ZC.THORN_MAX));
  }
  if (t.dead) {
    let d = g, k = 0;
    while (d > 0) { d -= ZC.THORN_CHIP; k++; }
    return { k, fits: true };
  }
  const k = Math.round((g - t.depth) / ZC.THORN_CHIP);
  return { k, fits: k >= 0 && Math.abs(g - k * ZC.THORN_CHIP - t.depth) < 1e-9 };
}
// test-cs012-p4.js's driver and board, unchanged.
function drive(input, i, play) {
  if (i % 7 === 0)   input.mouseMove(((i * 37) % 181) - 90);
  if (i % 53 === 0)  input.keyDown("ArrowRight");
  if (i % 53 === 11) input.keyUp("ArrowRight");
  if (i % 71 === 0)  input.keyDown("ArrowLeft");
  if (i % 71 === 31) input.keyUp("ArrowLeft");
  if (play.held) { if (i === 0) input.keyDown(" "); }
  else { if (i % 13 === 0) input.keyDown(" "); if (i % 13 === 9) input.keyUp(" "); }
  if (play.purge && i % play.purge === 0) input.keyDown("x");
  if (play.purge && i % play.purge === 4) input.keyUp("x");
  if (i % 300 === 0) input.mouseMove((Math.floor(i / 300) % 2) ? 4000 : -4000);
}
function begin(Z, seed, level) {
  Z.Game.reset();
  Z.startGame(seed, { mode: "overdrive" });
  Z.state.level = level;
  Z.state.wellIndex = (level - 1) % Z.WELLS.length;
  Z.enterWell();
}

// ⛔ LANCE HELD ON. The well owns it (T5), so it is re-armed every step rather
// than collected — this is item 8 under the effect, not a test of the pickup.
function itemEight(Z, ticks, plays) {
  const ZC = Z.C, st = Z.state, ZG = Z.Game, ZDT = ZC.FIXED_DT;
  const out = { steps: 0, killCalls: 0, chipCalls: 0, lanceChips: 0, bonusCalls: 0, bountyCalls: 0,
                builds: 0, clears: 0, deaths: 0, pierceKills: 0, maxMult: 1, byClass: {},
                badKill: 0, badBonus: 0, badTotal: 0, leftover: 0, badBuilds: 0, diveScored: 0, unfit: 0, first: null };
  const fail = (grp, msg) => { out[grp]++; if (!out.first) out.first = `${grp}: ${msg}`; };

  const calls = [];
  let lastKills = 0;
  Z.addScore.before = function (n) {
    const kill = st.tally.kills > lastKills;
    lastKills = st.tally.kills;
    calls.push({ n, mult: st.combo.mult, kill });
  };
  Z.comboKill.before = function () { out.builds++; };
  let bounties = 0;
  Z.collectToken.before = function (s, t) { if (t.kind === "bounty") bounties++; };

  for (const play of plays) for (const seed of play.seeds) {
    begin(Z, seed, play.level);
    lastKills = st.tally.kills;
    let deathThisWell = false;
    for (let i = 0; i < ticks; i++) {
      if (st.screen === "gameover") {
        ZG.input.reset();
        begin(Z, seed + i, play.level);
        lastKills = st.tally.kills;
        deathThisWell = false;
      }
      drive(ZG.input, i, play);
      st.powers.lance = true;                // ⛔ Lance live on every step

      const pre = st.enemies.slice();
      const before = new Map(pre.map(e => [e, e.depth]));
      const weavers = pre.filter(e => e instanceof Z.Weaver).map(e => ({ e, phaseBefore: e.phase }));
      const pushed = [];
      const arr = st.enemies;
      arr.push = function () { pushed.push(...arguments); return Array.prototype.push.apply(this, arguments); };
      const s0 = st.score, level0 = st.level, deaths0 = st.tally.deaths;
      const diveWas = st.dive.active;
      const shotsWere = st.shots.slice();
      calls.length = 0;
      const builds0 = out.builds;
      bounties = 0;

      ZG.update(ZDT);
      delete arr.push;
      out.steps++;
      if (st.combo.mult > out.maxMult) out.maxMult = st.combo.mult;
      if (st.tally.deaths > deaths0) { out.deaths++; deathThisWell = true; }
      // A pierced shot that survived a kill: alive after a step its lane paid for.
      if (!diveWas && calls.some(c => c.kill)) {
        for (const s of shotsWere) if (s.pierce && !s.dead && st.shots.indexOf(s) >= 0) { out.pierceKills++; break; }
      }

      const endOfStep = () => {
        if (diveWas && !st.dive.active) deathThisWell = false;
        if (st.level !== level0 && !diveWas) deathThisWell = false;
      };
      if (diveWas) {
        if (calls.length) fail("diveScored", `tick ${i}: ${calls.length} addScore calls inside a dive`);
        if (out.builds !== builds0) fail("badBuilds", `tick ${i}: a dive built the combo`);
        endOfStep();
        continue;
      }

      const want = [];
      for (const e of pre.concat(pushed)) {
        if (!e.dead) continue;
        const p = gddPoints(Z, e);
        if (p > 0) { want.push(p); out.byClass[e.constructor.name] = (out.byClass[e.constructor.name] || 0) + 1; }
      }
      let chips = 0;
      for (const t of pre.concat(pushed)) {
        if (!(t instanceof Z.Thorn)) continue;
        const r = chipsOf(Z, t, before.get(t), weavers);
        if (!r.fits) fail("unfit", `tick ${i}: a Thorn length change did not decode to whole chips`);
        if (r.k >= ZC.LANCE_CHIP_MULT) out.lanceChips++;
        chips += r.k;
      }
      const bonuses = [];
      if (st.dive.active) {
        out.clears++;
        bonuses.push(GDD.wellPerLevel * level0);
        if (st.purgeUses === 0) bonuses.push(GDD.purgeUnspent);
        if (!deathThisWell) bonuses.push(GDD.noDeath);
        if (level0 === st.startDepth) bonuses.push(Z.startBonus(st.startDepth));
      }

      let total = 0;
      for (const c of calls) {
        total += c.n;
        if (c.kill) {
          out.killCalls++;
          if (c.n === 0) continue;
          const price = c.n / c.mult;
          const at = want.indexOf(price);
          if (at < 0 || Math.abs(price - Math.round(price)) > 1e-9) {
            fail("badKill", `tick ${i}: a kill paid ${c.n} at ×${c.mult} — no GDD §7 price on the board matches`);
          } else { want.splice(at, 1); }
        } else if (c.n === GDD.bounty && bounties > 0) {
          out.bountyCalls++; bounties--;
        } else if (c.n === GDD.thornChip && chips > 0) {
          out.chipCalls++; chips--;
        } else {
          const at = bonuses.indexOf(c.n);
          if (at < 0) fail("badBonus", `tick ${i}: an unmultiplied call paid ${c.n} at ×${c.mult}`);
          else { bonuses.splice(at, 1); out.bonusCalls++; }
        }
      }
      if (want.length || chips || bonuses.length || bounties) {
        fail("leftover", `tick ${i}: ${want.length} kills (${want.join("/")}), ${chips} chips, ${bonuses.length} bonuses, ${bounties} Bounties unpaid`);
      }
      if (st.score - s0 !== total) fail("badTotal", `tick ${i}: the delta is not the calls' sum`);
      const built = out.builds - builds0;
      const scoredKills = calls.filter(c => c.kill).length;
      if (built !== scoredKills) fail("badBuilds", `tick ${i}: ${built} builds against ${scoredKills} scored kills`);
      endOfStep();
    }
  }
  Z.addScore.before = Z.comboKill.before = Z.collectToken.before = null;
  out.bad = out.badKill + out.badBonus + out.badTotal + out.leftover + out.badBuilds + out.diveScored + out.unfit;
  return out;
}
const PLAY_TICKS = 3000;
const PLAYS = [{ level: 7, held: true, purge: 900, seeds: [3, 11] },
               { level: 19, held: false, purge: 1300, seeds: [5] }];
{
  installSeed(SEED);
  const Z = H.buildGame({ spy: ["addScore", "comboKill", "collectToken"] });
  const r = itemEight(Z, PLAY_TICKS, PLAYS);
  if (process.env.P2_MEASURE) console.log(J(Object.assign({}, r, { byClass: r.byClass })));
  H.eq(r.bad, 0, `⛔ GDD §17 item 8 WITH LANCE LIVE: every step's score delta is its events at that step's ` +
       `multiplier${r.first ? " — first: " + r.first : ""}`);
  H.assert(r.killCalls > 100 && r.maxMult > 1, `non-vacuity: ${r.killCalls} kills at up to ×${r.maxMult}`);
  H.assert(r.lanceChips > 0, `non-vacuity: ${r.lanceChips} Thorn hits took a 3× chip and decoded as three 5s`);
  H.assert(r.chipCalls > 0, `non-vacuity: ${r.chipCalls} chip calls of ${GDD.thornChip} were priced`);
  H.assert(r.pierceKills > 0, `non-vacuity: ${r.pierceKills} steps ended with a pierced shot still in flight after a kill`);
  H.assert(r.bonusCalls > 0 && r.clears > 0, `non-vacuity: ${r.clears} wells cleared and paid their bonuses`);
  H.assert(Object.keys(r.byClass).length >= 4, `non-vacuity: four or more classes died (${J(r.byClass)})`);
}

// ---------------------------------------------------------------------------
// 5. ⛔ THE WARD (T9) — every death condition, absorbed, and not a death
// ---------------------------------------------------------------------------
//
// test-cs012-p5.js's stagings: the contact killers, each in the craft's lane at
// the depth at which it kills, plus the three the rim sweep does not cover.
function killers(Z, lane) {
  const P = 1 - Z.C.RIM_CONTACT_DEPTH;
  const ride = new Z.Drifter(lane, P, 1);
  ride.phase = "ride"; ride.rideTimer = -1e9;
  const surge = new Z.Surger(lane, 0.5);
  surge.setPhase("discharge");
  return [
    ["rim contact — a parked Vaulter", new Z.Vaulter(lane, P, 1)],
    ["a riding (armoured) Drifter", ride],
    ["a Surger's discharge below the rim", surge],
    ["a Weaver's bolt", new Z.WeaverBolt(lane, P)],
  ];
}
function wardHit(Z, index, opts) {
  const ZG = Z.Game, st = Z.state;
  const well = quiet(Z, "overdrive", RING);
  st.skimmer.lane = 0;
  st.input.fire = false;                     // no rim sweep
  st.invulnTime = Z.C.RESPAWN_INVULN;        // expired: the craft can die
  st.powers.ward = !(opts && opts.noWard);
  st.combo.mult = 2; st.combo.kills = 4; st.combo.peak = 2;
  st.enemies.push(killers(Z, 0)[index][1]);
  const lives = st.lives, deaths = st.tally.deaths, frozen = ZG.hitStopLeft;
  const names = [];
  Z.sfx.before = n => names.push(n);
  try { Z.collideSkimmer(st, well); } finally { Z.sfx.before = null; }
  return { dead: st.skimmer.dead, lives: st.lives - lives, deaths: st.tally.deaths - deaths,
           died: st.diedThisWell, mult: st.combo.mult, ward: st.powers.ward,
           invuln: st.invulnTime, froze: ZG.hitStopLeft !== frozen, names };
}
const KILLERS = killers(X, 0);
for (let i = 0; i < KILLERS.length; i++) {
  const name = KILLERS[i][0];
  const bare = wardHit(X, i, { noWard: true });
  H.eq(J([bare.dead, bare.lives, bare.deaths, bare.died]), J([true, -1, 1, true]),
       `fixture: ${name} kills an unshielded craft (GDD 4.5)`);
  const r = wardHit(X, i);
  H.eq(r.dead, false, `⛔ THE WARD ABSORBS IT: ${name} does not kill (T9)`);
  H.eq(J([r.lives, r.deaths, r.died, r.mult]), J([0, 0, false, 2]),
       `⛔ and it is NOT A DEATH: ${name} costs no life, no tally.deaths, no diedThisWell, no combo`);
  H.eq(r.ward, false, "⛔ the shell is spent — one free hit (GDD 14.1)");
  H.eq(r.invuln, 0, "⛔ and it starts the respawn's invulnerability window, from zero");
  H.eq(r.froze, false, "⛔ no hit-stop: nothing died");
  H.eq(J(r.names), J(["wardBreak"]), "⛔ ONE seat, one sound: wardBreak, and not `death`");
}
{
  // ⛔ ONE AT A TIME, and the window is real: a second hit inside it is declined
  // by the guard, and the one after the window kills.
  const well = quiet(X, "overdrive", RING);
  S.skimmer.lane = 0;
  S.invulnTime = C.RESPAWN_INVULN;
  S.powers.ward = true;
  const v = put(new X.Vaulter(0, PARK, 1));
  X.collideSkimmer(S, well);
  H.eq(J([S.skimmer.dead, S.powers.ward]), J([false, false]), "fixture: the first hit is absorbed");
  X.collideSkimmer(S, well);
  H.eq(S.skimmer.dead, false, "⛔ the invulnerability window the Ward started is real — the next step does not kill");
  S.invulnTime = C.RESPAWN_INVULN;
  X.collideSkimmer(S, well);
  H.eq(J([S.skimmer.dead, S.diedThisWell]), J([true, true]), "⛔ and once it expires the SECOND hit kills: one free hit, not two");
  H.eq(v.dead, false, "⛔ the enemy that touched is still there — the Ward kills nothing and pushes nothing");
}
{
  // A duplicate Ward while shelled is collected, sounds, and changes nothing (T5).
  quiet(X, "overdrive", RING);
  S.powers.ward = true;
  const t = { kind: "ward", lane: 0, depth: C.TOKEN_HOVER_DEPTH, age: 0, dead: false, collected: false };
  const names = sounded(X, () => X.collectToken(S, t));
  H.eq(J([S.powers.ward, t.collected, names.indexOf("collect") >= 0]), J([true, true, true]),
       "⛔ a second Ward while shelled is collected and sounds, and changes nothing (T5)");
}
{
  // ⛔ A DIVE NEVER REACHES IT (T5): startDive() resets the powers, so the Thorn
  // strike — GDD 4.5 item 5 — cannot be absorbed.
  const well = quiet(X, "overdrive", RING);
  S.powers.ward = true;
  put(new X.Thorn(0, 0.9));
  S.skimmer.lane = 0;
  X.startDive(S);
  H.eq(S.powers.ward, false, "⛔ startDive() spends nothing and clears everything — no Ward survives a clear (T5)");
  S.invulnTime = C.RESPAWN_INVULN;
  const lives = S.lives;
  S.dive.depth = 0.5;                        // inside the Thorn's extent, same lane
  const struck = X.diveStrike(S, well);
  H.eq(J([struck, S.lives - lives]), J([true, -1]),
       "⛔ so GDD 4.5 item 5 costs the life it always did: the Dive routes through killSkimmer() like " +
       "every other death, and T5 is what guarantees no shell is live on that board");
  // ⛔ And the reverse, stated: a shell forced back on WOULD absorb it. The
  // guarantee is T5's reset at startDive(), not a term inside killSkimmer().
  S.skimmer.dead = false;
  S.invulnTime = C.RESPAWN_INVULN;
  S.powers.ward = true;
  const lives2 = S.lives;
  const struck2 = X.diveStrike(S, well);
  H.eq(J([struck2, S.lives - lives2, S.powers.ward]), J([false, 0, false]),
       "⛔ (forced back on it absorbs the strike — which is why startDive() spending every power is the guarantee)");
}

// ---------------------------------------------------------------------------
// 6. ⛔ CLASSIC NEVER READS A POWER — the hash against a frozen state.powers
// ---------------------------------------------------------------------------
// test-cs009-p6.js's whole-board hasher, unchanged.
function makeHasher(Z, extras) {
  const wells = new Map(Z.WELLS.map((w, i) => [w, i]));
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
  return function () { h = 2166136261; seen = new Map(); walk(Z.state); walk(extras()); return h; };
}
const CLASSIC_STEPS = 5000;
// The scripted Classic player: held fire, scheduled Purges, mixed rotation.
function hunt(Z, i) {
  const inp = Z.Game.input;
  if (i === 0) inp.keyDown(" ");
  if (i % 7 === 0) inp.mouseMove(((i * 37) % 181) - 90);
  if (i % 53 === 0) inp.keyDown("ArrowRight");
  if (i % 53 === 11) inp.keyUp("ArrowRight");
  if (i % 311 === 0) inp.keyDown("x");
  if (i % 311 === 4) inp.keyUp("x");
}
// ⛔ A FROZEN state.powers: every write is counted and refused. If any Classic
// path wrote one, the two sessions would diverge — and `writes` names the field.
// ⛔ A TRUE WRITE IS THE CLAIM, not a write. resetTokens() writes `false` into
// all three on every well entry in BOTH modes (T5) — that is the well owning
// them, not Classic reading a power. A `true` is a flag being SET.
function frozenPowers(st) {
  const box = { lance: false, spread: false, ward: false };
  const log = [];
  st.powers = new Proxy(box, { set(t, k, v) { if (v === true) log.push(String(k)); return true; } });
  return log;
}
function classicSession(opts, freeze) {
  installSeed(SEED);
  const Z = H.buildGame(opts);
  const ZG = Z.Game, st = Z.state, ZDT = Z.C.FIXED_DT;
  ZG.reset();
  Z.startGame(SEED, { startDepth: 13 });
  let writes = freeze ? frozenPowers(st) : [];
  const hash = makeHasher(Z, () => [ZG.hitStopLeft, ZG.stats.ticks]);
  const out = { hashes: [], kills: 0, shots: 0, maxShots: 0, writes };
  for (let i = 0; i < CLASSIC_STEPS; i++) {
    hunt(Z, i);
    const k0 = st.tally.kills;
    ZG.update(ZDT);
    out.kills += st.tally.kills - k0;
    if (st.shots.length > out.maxShots) out.maxShots = st.shots.length;
    if (st.screen === "gameover") {
      Z.startGame((SEED + i) >>> 0, { startDepth: 13 });
      if (freeze) { const w = frozenPowers(st); out.writes = writes = writes.concat(w); w.length = 0; }
    }
    out.hashes.push(hash());
  }
  return out;
}
const firstDiff = (a, b) => { for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return i; return -1; };
{
  const real = classicSession({}, false);
  const froze = classicSession({}, true);
  H.eq(firstDiff(real.hashes, froze.hashes), -1,
       `⛔ CLASSIC NEVER SETS A FLAG: the state hash is identical on all ${CLASSIC_STEPS} steps against a FROZEN state.powers`);
  H.eq(J(froze.writes), "[]", `⛔ and no Classic path even tried to SET one (${J(froze.writes)})`);
  H.assert(real.maxShots === C.SHOT_MAX, `⛔ C.SHOT_MAX is the cap a Classic run reaches (${real.maxShots})`);
  H.assert(real.kills > 20 && new Set(real.hashes).size > CLASSIC_STEPS / 2,
           `non-vacuity: the Classic run killed (${real.kills}) and its hash moves`);
}

// ---------------------------------------------------------------------------
// 7. ⛔ MUTATION-CHECKED — trap 4
// ---------------------------------------------------------------------------
function mutantRed(from, to, what, run) {
  const found = SCRIPT.split(from).length - 1;
  H.eq(found, 1, `fixture: ${what} — the mutation string is in the build exactly once`);
  if (found !== 1) return;
  let red = null, threw = null;
  try { red = run([[from, to]]); } catch (e) { threw = e.message; }
  H.eq(threw, null, `fixture: ${what} — the mutant ran without a throw`);
  H.assert(red === true, `⛔ MUTATION — ${what} turns the claim red${red === true ? "" : " (it did NOT)"}`);
}

// 1. The Ward checked ABOVE the invulnerability guard: a declined hit spends it.
mutantRed(`  if (state.invulnTime < C.RESPAWN_INVULN) return;

  // ⛔ THE WARD ABSORBS IT`,
          `  // ⛔ THE WARD ABSORBS IT`,
          "the Ward's check moved above the invulnerability guard", mutate => {
  installSeed(SEED);
  const Z = H.buildGame({ mutate, spy: SPIES });
  const well = quiet(Z, "overdrive", RING);
  const st = Z.state;
  st.skimmer.lane = 0;
  st.invulnTime = 0;                         // invulnerable: the guard declines
  st.powers.ward = true;
  st.enemies.push(new Z.Vaulter(0, 1 - Z.C.RIM_CONTACT_DEPTH, 1));
  Z.collideSkimmer(st, well);
  return st.powers.ward === false;           // the mutant spent a shell on a declined hit
});
{
  // The control, on the unmutated build: a declined hit keeps the shell.
  const well = quiet(X, "overdrive", RING);
  S.skimmer.lane = 0;
  S.invulnTime = 0;
  S.powers.ward = true;
  put(new X.Vaulter(0, PARK, 1));
  X.collideSkimmer(S, well);
  H.eq(J([S.powers.ward, S.skimmer.dead]), J([true, false]),
       "⛔ BELOW THE GUARD: a hit invulnerability declined does not spend the shell (T9)");
}

// 2. Pierce made "never consumed" — T7's rejected alternative.
mutantRed("if (e.onShot(shot) && !(shot.pierce && e.dead)) shot.dead = true;",
          "if (e.onShot(shot) && !shot.pierce) shot.dead = true;",
          "pierce made \"never consumed\" rather than \"a kill does not consume\"", mutate => {
  installSeed(SEED);
  const Z = H.buildGame({ mutate, spy: SPIES });
  const r = answers(Z, true);
  // A chip would no longer consume, so the Thorn would be chipped again and again.
  return r.chip.consumed === false;
});

// 3. The Spread cap removed — the volley goes back to fighting SHOT_MAX.
mutantRed("  const cap = state.powers.spread ? C.SPREAD_SHOT_MAX : C.SHOT_MAX;",
          "  const cap = C.SHOT_MAX;",
          "the cap in force replaced by C.SHOT_MAX", mutate => {
  installSeed(SEED);
  const Z = H.buildGame({ mutate, spy: SPIES });
  const r = fireRun(Z, true, RING, 4, RATE_TICKS);
  return r.rates.every(e => e[1] < GDD_RATE - 0.95) && r.max <= Z.C.SHOT_MAX;
});

H.report("test-cs013-p2.js");
