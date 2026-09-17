// test-cs012-p4.js — CS012 P4: the combo (GDD 7, 10.3, 10.4, 11.4, 11.8, 14.4,
// 15.4, 15.6, 16.3, 17 item 8; plan §6, O3, O4, O5, O8, O16, R2, R5, R6, R7).
// Asserts what P4 owns: O3's build, window, lapse and death rules staged step by
// step and O5's Dive hold; the multiplier on its half-step lattice with a peak
// that never falls; O4's scope at the four kill lines, mutation-checked; item 8
// on played Overdrive boards; Classic bit-identical with the combo calls mutated
// out; the director's combo input; the HUD readout; comboLost once per fall; and
// max_combo / maxCombo off state.combo.peak, with the placeholder gone.
//
// ⛔ TRAPS.
//  1. The expected prices are GDD §7's LITERALS, never C.PTS_* and never
//     e.points() — test-cs008-p2.js's trap 1, for its reason.
//  2. Item 8 is asserted PER addScore CALL, not per step: a step can span a
//     step-up, so "that step's multiplier" is only well defined call by call.
//     A kill call is one where state.tally.kills has just risen — the kill
//     sites increment it immediately before they score.
//  3. The four kill lines share their text, so each mutation string carries the
//     line that follows it (`break;` / `continue;` / the Purge's own shape).
//  4. §4's staged boards hold the spawner (remaining > 0, timer -1e9), so the
//     only thing on the board is what the fixture put there.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

const SEED = 20260919;

installSeed(SEED);                          // ⛔ above the first buildGame()
const X = H.buildGame();
const C = X.C;
const G = X.Game;
const state = X.state;
const DT = C.FIXED_DT;
const PARK = 1 - C.RIM_CONTACT_DEPTH;
const RING = 0;
const J = v => JSON.stringify(v);

// ⛔ Trap 1 — GDD §7, as written there.
const GDD = { thornChip: 5, weaver: 50, carrier: 100, vaulter: 150, surger: 200,
              drifter: [250, 500, 750], reaver: 300, wellPerLevel: 100,
              purgeUnspent: 500, noDeath: 1000 };

// ⛔ IT TAKES THE BUILD. `instanceof` is per build, and this file runs several
// (the mutants, the Classic pair): a copy closed over the outer one would match
// nothing in any of them and every non-vacuity check would pass on zero.
function gddPoints(Z, e) {
  if (e instanceof Z.Reaver) return GDD.reaver;      // before Vaulter: it extends it
  if (e instanceof Z.Vaulter) return GDD.vaulter;
  if (e instanceof Z.Carrier) return GDD.carrier;
  if (e instanceof Z.Weaver) return GDD.weaver;
  if (e instanceof Z.Surger) return GDD.surger;
  if (e instanceof Z.Drifter) return e.depth < 1 / 3 ? 250 : e.depth < 2 / 3 ? 500 : 750;
  return 0;   // the Thorn scores per chip; the bolt is not on GDD §7
}

H.assert(typeof X.comboMult === "function" && typeof X.comboKill === "function" &&
         typeof X.comboDeath === "function" && typeof X.updateCombo === "function",
         "fixture: 12-scoring.js exports the combo's four entry points");

// A quiet board in `mode`, spawner held (trap 4), nothing on it.
function quiet(mode, level, wellIndex) {
  G.reset();
  X.startGame(SEED, { mode });
  state.level = level === undefined ? 23 : level;
  state.wellIndex = wellIndex === undefined ? RING : wellIndex;
  X.enterWell();
  state.spawn.remaining = 1;
  state.spawn.timer = -1e9;
  state.enemies = [];
  state.shots = [];
  G.input.reset();
  return X.WELLS[state.wellIndex];
}
function put(e) { state.enemies.push(e); return e; }
function shotAt(well, lane, depth) {
  const s = new X.Shot(well, lane);
  s.t = (1 - depth) * C.SHOT_TIME;
  state.shots.push(s);
  return s;
}
function delta(fn) { const s0 = state.score; fn(); return state.score - s0; }
function purge() {
  state.input.purge = true;
  state.purgeLatched = false;
  X.updatePurge(state);
  state.input.purge = false;
}
// The multiplier after `n` kills from a fresh combo — O3's rule, written once.
function multAfter(n) {
  return Math.min(1 + Math.floor(n / C.COMBO_KILLS_PER_STEP) * C.COMBO_STEP, C.COMBO_MAX);
}
function kills(n) { for (let i = 0; i < n; i++) X.comboKill(state); }

// ---------------------------------------------------------------------------
// 1. THE KNOBS AND THE BAG (O16, R2)
// ---------------------------------------------------------------------------
for (const [k, want] of [["COMBO_WINDOW", 2.50], ["COMBO_MAX", 8], ["COMBO_STEP", 0.5],
                         ["COMBO_KILLS_PER_STEP", 4], ["HUD_COMBO_SIZE", 56]]) {
  H.eq(C[k], want, `C.${k} is O3/O16's ${want}`);
}
H.assert(!("TELEMETRY_PLACEHOLDER" in C), "⛔ C.TELEMETRY_PLACEHOLDER is deleted WHOLE (R7)");
{
  const fresh = X.newState();
  H.eq(Object.keys(fresh.combo).sort().join(","), "kills,mult,peak,since",
       "⛔ state.combo is exactly { mult, kills, since, peak } (R2)");
  H.eq(fresh.combo.mult, 1, "newState() mints it at ×1");
  H.eq(fresh.combo.kills, 0, "with no kills banked");
  H.eq(fresh.combo.since, 0, "⛔ and `since` at zero — it counts UP (GDD 16.3)");
  H.eq(fresh.combo.peak, 0, "⛔ and `peak` at 0, which is what a Classic run reports (R7)");
}

// ---------------------------------------------------------------------------
// 2. ⛔ CLASSIC: ALL FOUR ARE NO-OPS AND comboMult() IS EXACTLY 1
// ---------------------------------------------------------------------------
{
  quiet("classic", 5);
  const snap = () => J(state.combo);
  const before = snap();
  H.eq(X.comboMult(), 1, "⛔ comboMult() is exactly 1 in Classic");
  H.assert(Object.is(X.comboMult(), 1), "and it is the integer 1, not a computed 1.0");
  for (let i = 0; i < 40; i++) X.comboKill(state);
  H.eq(snap(), before, "⛔ comboKill() writes nothing in Classic");
  for (let i = 0; i < 400; i++) X.updateCombo(state, DT);
  H.eq(snap(), before, "⛔ updateCombo() writes nothing in Classic — 400 steps, six windows");
  X.comboDeath(state);
  H.eq(snap(), before, "⛔ comboDeath() writes nothing in Classic");
}

// ---------------------------------------------------------------------------
// 3. ⛔ O3's RULES, STAGED STEP BY STEP (GDD 14.4)
// ---------------------------------------------------------------------------

// ---- the build: +COMBO_STEP every COMBO_KILLS_PER_STEP kills ---------------
{
  quiet("overdrive", 5);
  const seen = [];
  for (let n = 1; n <= 4 * C.COMBO_KILLS_PER_STEP; n++) {
    X.comboKill(state);
    seen.push(state.combo.mult);
  }
  H.eq(state.combo.mult, multAfter(4 * C.COMBO_KILLS_PER_STEP),
       `⛔ ${4 * C.COMBO_KILLS_PER_STEP} kills reach ×${multAfter(4 * C.COMBO_KILLS_PER_STEP)}`);
  let wrong = -1;
  for (let n = 1; n <= seen.length; n++) if (seen[n - 1] !== multAfter(n)) { wrong = n; break; }
  H.eq(wrong, -1, `⛔ the multiplier steps up on exactly every ${C.COMBO_KILLS_PER_STEP}th kill (first wrong: ${wrong})`);
  H.eq(seen[C.COMBO_KILLS_PER_STEP - 2], 1, "⛔ and NOT before it: the kill before the step is still ×1");
  H.eq(seen[C.COMBO_KILLS_PER_STEP - 1], 1 + C.COMBO_STEP, "⛔ the step lands ON that kill");
}

// ---- the cap, and the lattice ----------------------------------------------
{
  quiet("overdrive", 5);
  const LATTICE = [];
  for (let m = 1; m <= C.COMBO_MAX; m += C.COMBO_STEP) LATTICE.push(m);
  let offLattice = 0, over = 0;
  for (let n = 0; n < 400; n++) {
    X.comboKill(state);
    if (LATTICE.indexOf(state.combo.mult) < 0) offLattice++;
    if (state.combo.mult > C.COMBO_MAX) over++;
  }
  H.eq(offLattice, 0, `⛔ the multiplier is always on the half-step lattice [1, ${C.COMBO_MAX}]`);
  H.eq(over, 0, "⛔ and never above C.COMBO_MAX");
  H.eq(state.combo.mult, C.COMBO_MAX, "400 kills sit at the cap");
  H.eq(state.combo.peak, C.COMBO_MAX, "and the peak is the cap");
}

// ---- the window restarts on every kill --------------------------------------
{
  quiet("overdrive", 5);
  for (let i = 0; i < 100; i++) X.updateCombo(state, DT);
  H.assert(state.combo.since > 0, "fixture: the clock ran");
  X.comboKill(state);
  H.eq(state.combo.since, 0, "⛔ a kill restarts the window (O3)");
}

// ---- the lapse: one step per window, down to ×1, kill count untouched -------
{
  quiet("overdrive", 5);
  kills(4 * C.COMBO_KILLS_PER_STEP + 2);
  const m0 = state.combo.mult, banked = state.combo.kills;
  H.eq(m0, 3, `fixture: the staged board sits at ×${m0}`);
  H.eq(banked, 2, "fixture: with two kills banked toward the next step");

  // ⛔ THE FIRST STEP AT OR PAST THE WINDOW IS THE ONE THAT COSTS (GDD 16.3):
  // asserted as a property, never as a step count — 1/60 is not a binary
  // fraction (test-cs012-p5.js's §7 finding).
  let steps = 0;
  while (state.combo.mult === m0) {
    X.updateCombo(state, DT);
    steps++;
    H.assert(steps < 1000, "fixture: the window lapses");
  }
  H.eq(state.combo.mult, m0 - C.COMBO_STEP, "⛔ a window with no kill costs exactly one COMBO_STEP");
  H.close(steps * DT, C.COMBO_WINDOW, DT, "⛔ and it costs it at C.COMBO_WINDOW, to the step");
  H.eq(state.combo.kills, banked, "⛔ a LAPSE does not empty the kill count — O3 empties it on a death alone");

  // each further window costs another, down to ×1
  const fell = [state.combo.mult];
  for (let i = 0; i < 1000; i++) {
    const was = state.combo.mult;
    X.updateCombo(state, DT);
    if (state.combo.mult !== was) fell.push(state.combo.mult);
  }
  H.eq(J(fell), J([2.5, 2, 1.5, 1]), "⛔ each further window costs another COMBO_STEP, down to ×1");
  H.eq(state.combo.mult, 1, "⛔ and it stops at ×1 — 1,000 more steps take it no lower");
}

// ---- a death is ×1 at once, with the kill count emptied ---------------------
{
  quiet("overdrive", 5);
  kills(5 * C.COMBO_KILLS_PER_STEP + 3);
  H.eq(state.combo.mult, 3.5, "fixture: ×3.5 with three kills banked");
  H.eq(state.combo.kills, 3, "fixture: three banked");
  const peak = state.combo.peak;
  X.comboDeath(state);
  H.eq(state.combo.mult, 1, "⛔ a death is ×1 AT ONCE, not a decay (O3)");
  H.eq(state.combo.kills, 0, "⛔ with the kill count emptied");
  H.eq(state.combo.since, 0, "and the window restarted");
  H.eq(state.combo.peak, peak, "⛔ and `peak` is untouched — it is the run's, not the life's");
}

// ---- peak never falls within a run ------------------------------------------
{
  quiet("overdrive", 5);
  let fellBack = 0, wrong = 0;
  let peak = state.combo.peak;
  for (let i = 0; i < 4000; i++) {
    if (i % 17 === 0) X.comboKill(state);
    if (i % 900 === 0 && i > 0) X.comboDeath(state);
    X.updateCombo(state, DT);
    if (state.combo.peak < peak) fellBack++;
    if (state.combo.peak < state.combo.mult) wrong++;
    peak = state.combo.peak;
  }
  H.eq(fellBack, 0, "⛔ `peak` never falls within a run — through lapses and deaths");
  H.eq(wrong, 0, "⛔ and is never below the live multiplier");
  H.assert(peak > 1, `fixture: the run reached ×${peak}`);
}

// ---------------------------------------------------------------------------
// 4. ⛔ O5 — THE WINDOW HOLDS THROUGH A DIVE
// ---------------------------------------------------------------------------
{
  quiet("overdrive", 5);
  kills(C.COMBO_KILLS_PER_STEP);
  for (let i = 0; i < 30; i++) X.updateCombo(state, DT);
  const held = { mult: state.combo.mult, since: state.combo.since };
  H.assert(held.since > 0, "fixture: the clock had run");

  state.dive.active = true;
  for (let i = 0; i < 600; i++) X.updateCombo(state, DT);   // 10 s — four windows
  H.eq(state.combo.since, held.since, "⛔ the window's clock HOLDS while state.dive.active (O5)");
  H.eq(state.combo.mult, held.mult, "⛔ so ten seconds of Dive cost the multiplier nothing");
  state.dive.active = false;
  X.updateCombo(state, DT);
  H.close(state.combo.since, held.since + DT, 1e-12, "⛔ and it resumes in the next well, where it left off");
}

// ---- and the real dive branch never steps it either -------------------------
{
  const well = quiet("overdrive", 5);
  kills(C.COMBO_KILLS_PER_STEP);
  state.enemies = [];
  X.startDive(state);
  H.assert(state.dive.active, "fixture: a real dive is running");
  const since = state.combo.since, mult = state.combo.mult;
  for (let i = 0; i < 120 && state.dive.active; i++) G.update(DT);
  H.eq(state.combo.since, since, "⛔ Game.update()'s dive branch never steps the combo either");
  H.eq(state.combo.mult, mult, "and the multiplier holds across the whole dive");
}

// ---------------------------------------------------------------------------
// 5. ⛔ O4's SCOPE — WHAT THE MULTIPLIER MULTIPLIES, AND WHAT BUILDS IT
// ---------------------------------------------------------------------------

// ---- a shot kill, at the multiplier, and it builds --------------------------
{
  const well = quiet("overdrive", 23);
  kills(C.COMBO_KILLS_PER_STEP);            // ×1.5
  const e = put(new X.Vaulter(5, 0.5, 1));
  shotAt(well, 5, 0.5);
  const d = delta(() => X.collideShots(state, well));
  H.assert(e.dead, "fixture: the shot killed it");
  H.eq(d, GDD.vaulter * 1.5, "⛔ a shot kill pays GDD §7's price × the multiplier (O4)");
  H.eq(state.combo.kills, 1, "⛔ and the kill builds the combo");
}

// ---- the rim sweep ----------------------------------------------------------
{
  const well = quiet("overdrive", 23);
  kills(2 * C.COMBO_KILLS_PER_STEP);        // ×2
  const sk = state.skimmer;
  const e = put(new X.Surger(sk.lane, PARK));
  state.input.fire = true;
  const d = delta(() => X.collideSkimmer(state, well));
  state.input.fire = false;
  H.assert(e.dead, "fixture: the rim sweep killed it");
  H.eq(d, GDD.surger * 2, "⛔ the rim sweep pays at the multiplier too");
  H.eq(state.combo.kills, 1, "⛔ and it builds");
}

// ---- both Purge uses --------------------------------------------------------
{
  const well = quiet("overdrive", 23);
  kills(4 * C.COMBO_KILLS_PER_STEP);        // ×3
  const a = put(new X.Vaulter(1, 0.4, 1)), b = put(new X.Weaver(3, 0.3));
  const d1 = delta(purge);
  H.assert(a.dead && b.dead, "fixture: use 1 cleared the well");
  H.eq(d1, (GDD.vaulter + GDD.weaver) * 3, "⛔ Purge use 1 pays every victim at the multiplier");
  H.eq(state.combo.kills, 2, "⛔ and every victim builds it (O4)");

  const c = put(new X.Surger(6, 0.7));
  const d2 = delta(purge);
  H.assert(c.dead, "fixture: use 2 took the nearest to the rim");
  H.eq(d2, GDD.surger * 3, "⛔ Purge use 2 pays at the multiplier");
  H.eq(state.combo.kills, 3, "⛔ and builds");
}

// ---- ⛔ NOT MULTIPLIED, AND THEY DO NOT BUILD --------------------------------
{
  const well = quiet("overdrive", 23);
  kills(8 * C.COMBO_KILLS_PER_STEP);        // ×5
  H.eq(state.combo.mult, 5, "fixture: ×5");
  const banked = state.combo.kills;

  const t = put(new X.Thorn(2, 0.5));
  shotAt(well, 2, 0.5);
  const chip = delta(() => X.collideShots(state, well));
  H.assert(!t.dead, "fixture: the Thorn survived the chip");
  H.eq(chip, GDD.thornChip, "⛔ A THORN CHIP IS NOT MULTIPLIED (O4) — 5, at ×5");
  H.eq(state.combo.kills, banked, "⛔ and a chip does not build the combo");
}
{
  quiet("overdrive", 7);
  kills(8 * C.COMBO_KILLS_PER_STEP);        // ×5
  state.purgeUses = 0;
  state.diedThisWell = false;
  state.startDepth = 7;                     // so the Start Depth bonus pays here
  const banked = state.combo.kills;
  const d = delta(() => X.clearBonuses(state));
  const want = GDD.wellPerLevel * 7 + GDD.purgeUnspent + GDD.noDeath + X.startBonus(7);
  H.eq(d, want, "⛔ THE CLEAR BONUSES AND THE START DEPTH BONUS ARE NOT MULTIPLIED (O4) — at ×5");
  H.assert(X.startBonus(7) > 0, "fixture: the Start Depth bonus is non-zero here");
  H.eq(state.combo.kills, banked, "⛔ and no bonus builds the combo");
}

// ---- ⛔ the Dive's termination kill pays nothing and builds nothing ----------
// GDD 5's guarantee lives in diveRespawn(), not diveStrike(): with every lane
// blocked the struck Thorn dies so the repeat can terminate.
{
  const well = quiet("overdrive", 5);
  kills(4 * C.COMBO_KILLS_PER_STEP);
  H.eq(state.combo.mult, 3, "fixture: ×3");
  for (let i = 0; i < well.lanes; i++) put(new X.Thorn(i, C.THORN_MAX));
  X.startDive(state);
  state.skimmer.dead = true;
  const banked = state.combo.kills, m = state.combo.mult, k0 = state.tally.kills;
  const standing = state.enemies.length;
  H.eq(X.diveRespawnLane(state, well, state.skimmer.lane), null,
       "fixture: every lane holds a Thorn, so there is nowhere free to land");
  const d = delta(() => X.diveRespawn(state, well));
  // ⛔ diveRespawn() ends with startDive(), which filters the dead away, so the
  // kill is read off the count rather than off a `dead` flag.
  H.eq(state.enemies.length, standing - 1,
       "fixture: the struck Thorn died instead (GDD 5's termination guarantee)");
  H.eq(d, 0, "⛔ the Dive's termination kill pays NOTHING");
  H.eq(state.tally.kills, k0, "and is not counted as a kill");
  H.eq(state.combo.kills, banked, "⛔ and builds nothing");
  H.eq(state.combo.mult, m, "and the multiplier is where it was");
}

// ---- ⛔ killSkimmer() calls comboDeath BELOW the invulnerability guard -------
{
  const well = quiet("overdrive", 5);
  kills(4 * C.COMBO_KILLS_PER_STEP);
  H.eq(state.combo.mult, 3, "fixture: ×3");
  state.invulnTime = 0;                     // invulnerable
  X.killSkimmer(state);
  H.eq(state.combo.mult, 3, "⛔ a kill the invulnerability guard declined is not a combo loss");
  state.invulnTime = C.RESPAWN_INVULN;
  X.killSkimmer(state);
  H.eq(state.combo.mult, 1, "⛔ a real death is ×1 at once");
}

// ---------------------------------------------------------------------------
// 6. ⛔ GDD §17 item 8, IN OVERDRIVE — every addScore call priced at its own
//    multiplier (trap 2), on played boards
// ---------------------------------------------------------------------------

const PLAY_TICKS = 9000;
const PLAYS = [
  { level: 1,  held: true,  purge: 0,    seeds: [11, 3407] },
  { level: 6,  held: true,  purge: 311,  seeds: [11, 90210] },
  { level: 13, held: true,  purge: 1500, seeds: [11, 23] },
  { level: 23, held: false, purge: 311,  seeds: [11, 23] },
];

// test-cs008-p2.js's recorded driver, unchanged.
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
// test-cs008-p2.js's chip decoder (its trap 2), unchanged.
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

// The soak, over a build `Z`. Returns what went wrong, so a mutant can be run
// through the same function and asserted RED.
function itemEight(Z, ticks, plays) {
  const ZC = Z.C, st = Z.state, ZG = Z.Game, ZDT = ZC.FIXED_DT;
  const out = { steps: 0, killCalls: 0, zeroKills: 0, bonusCalls: 0, chipCalls: 0, builds: 0, clears: 0,
                deaths: 0, multsSeen: new Set(), byClass: {}, maxMult: 1,
                badKill: 0, badBonus: 0, badTotal: 0, unmatched: 0, leftover: 0,
                badBuilds: 0, diveScored: 0, unfit: 0, first: null };
  const fail = (grp, msg) => { out[grp]++; if (!out.first) out.first = `${grp}: ${msg}`; };

  // trap 2 — the call log, with the multiplier live at each call.
  const calls = [];
  let lastKills = 0;
  Z.addScore.before = function (n) {
    const kill = st.tally.kills > lastKills;
    lastKills = st.tally.kills;
    calls.push({ n, mult: st.combo.mult, kill });
  };
  Z.comboKill.before = function () { out.builds++; };

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

      const pre = st.enemies.slice();
      const before = new Map(pre.map(e => [e, e.depth]));
      const weavers = pre.filter(e => e instanceof Z.Weaver).map(e => ({ e, phaseBefore: e.phase }));
      const pushed = [];
      const arr = st.enemies;
      arr.push = function () { pushed.push(...arguments); return Array.prototype.push.apply(this, arguments); };
      const s0 = st.score, level0 = st.level, deaths0 = st.tally.deaths;
      const diveWas = st.dive.active;
      calls.length = 0;
      const builds0 = out.builds;

      ZG.update(ZDT);
      delete arr.push;
      out.steps++;
      if (st.combo.mult > out.maxMult) out.maxMult = st.combo.mult;
      out.multsSeen.add(st.combo.mult);
      if (st.tally.deaths > deaths0) { out.deaths++; deathThisWell = true; }

      // ⛔ test-cs008-p2.js's per-well bookkeeping: a dive ending and a level
      // advancing each start a new well, and "no death" is per WELL (GDD 7).
      const endOfStep = () => {
        if (diveWas && !st.dive.active) deathThisWell = false;
        if (st.level !== level0 && !diveWas) deathThisWell = false;
      };

      // ⛔ A DIVE SCORES NOTHING AND BUILDS NOTHING (GDD 5, 7).
      if (diveWas) {
        if (calls.length) fail("diveScored", `tick ${i}: ${calls.length} addScore calls inside a dive`);
        if (out.builds !== builds0) fail("badBuilds", `tick ${i}: a dive built the combo`);
        endOfStep();
        continue;
      }

      // The step's kill prices, off the board (test-cs008-p2.js's method).
      // ⛔ PRICES > 0 ONLY. A zero-price death is either a kill site paying
      // e.points() of 0 (a Thorn taken by its last chip, whose worth is its
      // chips) or no kill site at all (a Weaver bolt self-terminating at depth
      // 1), and the two are the same number. A kill call of 0 is accepted below
      // as itself rather than matched against this list.
      const want = [];
      for (const e of pre.concat(pushed)) {
        if (!e.dead) continue;
        const p = gddPoints(Z, e);
        if (p > 0) { want.push(p); out.byClass[e.constructor.name] = (out.byClass[e.constructor.name] || 0) + 1; }
      }
      // ... and its unmultiplied ones: chips, then the clear bonuses.
      let chips = 0;
      for (const t of pre.concat(pushed)) {
        if (!(t instanceof Z.Thorn)) continue;
        const r = chipsOf(Z, t, before.get(t), weavers);
        if (!r.fits) fail("unfit", `tick ${i}: a Thorn length change did not decode to whole chips`);
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

      // ⛔ CALL BY CALL (trap 2).
      let total = 0;
      for (const c of calls) {
        total += c.n;
        if (c.kill) {
          out.killCalls++;
          if (c.n === 0) { out.zeroKills++; continue; }
          const price = c.n / c.mult;
          const at = want.indexOf(price);
          if (at < 0 || Math.abs(price - Math.round(price)) > 1e-9) {
            fail("badKill", `tick ${i}: a kill paid ${c.n} at ×${c.mult} — no GDD §7 price on the board matches`);
          } else { want.splice(at, 1); }
        } else if (c.n === GDD.thornChip && chips > 0) {
          out.chipCalls++; chips--;
        } else {
          const at = bonuses.indexOf(c.n);
          if (at < 0) fail("badBonus", `tick ${i}: an unmultiplied call paid ${c.n} at ×${c.mult}`);
          else { bonuses.splice(at, 1); out.bonusCalls++; }
        }
      }
      if (want.length || chips || bonuses.length) {
        fail("leftover", `tick ${i}: ${want.length} kills (${want.join("/")}), ${chips} chips, ${bonuses.length} bonuses unpaid`);
      }
      if (st.score - s0 !== total) fail("badTotal", `tick ${i}: the delta is not the calls' sum`);
      // ⛔ EVERY KILL AT THOSE SITES BUILDS IT, AND NOTHING ELSE DOES (O4).
      const built = out.builds - builds0;
      const scoredKills = calls.filter(c => c.kill).length;
      if (built !== scoredKills) fail("badBuilds", `tick ${i}: ${built} builds against ${scoredKills} scored kills`);
      endOfStep();
    }
  }
  out.bad = out.badKill + out.badBonus + out.badTotal + out.leftover + out.badBuilds +
            out.diveScored + out.unfit;
  return out;
}

{
  installSeed(SEED);
  const Z = H.buildGame({ spy: ["addScore", "comboKill"] });
  const r = itemEight(Z, PLAY_TICKS, PLAYS);
  if (process.env.P4_MEASURE) console.log(J(Object.assign({}, r, { multsSeen: [...r.multsSeen] })));
  H.eq(r.bad, 0, `⛔ GDD §17 item 8 in OVERDRIVE: every step's score delta is its events at that step's ` +
       `multiplier${r.first ? " — first: " + r.first : ""}`);
  H.assert(r.maxMult > 1, `non-vacuity: the played boards reached ×${r.maxMult}`);
  H.assert(r.multsSeen.size >= 4, `non-vacuity: ${r.multsSeen.size} distinct multipliers were in force`);
  for (const k of ["Vaulter", "Carrier", "Weaver", "Drifter", "Surger", "Reaver"]) {
    H.assert((r.byClass[k] || 0) > 0, `non-vacuity: a ${k} was killed on the played Overdrive board`);
  }
  H.assert(r.chipCalls > 0, "non-vacuity: Thorns were chipped at a live multiplier");
  H.assert(r.bonusCalls > 0 && r.clears > 0, "non-vacuity: wells cleared and paid their bonuses");
  H.assert(r.deaths > 0, "non-vacuity: the player died");
  H.assert(r.killCalls > 0 && r.builds > 0, "non-vacuity: kills scored and built");
}

// ---- ⛔ MUTATION-CHECKED: multiplying a chip or a clear bonus is RED ---------
const MUT_TICKS = 2500;
const MUT_PLAYS = [{ level: 13, held: true, purge: 1500, seeds: [11] }];
// ⛔ A THROW IS NOT A PASS. buildGame refuses a mutation string that is not in
// the build exactly once, so a stale string would otherwise read as "red".
function mutantRed(mutate, what) {
  installSeed(SEED);
  let r = null, threw = null;
  try {
    const Z = H.buildGame({ mutate, spy: ["addScore", "comboKill"] });
    r = itemEight(Z, MUT_TICKS, MUT_PLAYS);
  } catch (e) { threw = e.message; }
  H.eq(threw, null, `fixture: ${what} — the mutation string is in the build exactly once`);
  H.assert(r !== null && r.bad > 0,
           `⛔ MUTATION — ${what} turns item 8 red${r && r.first ? "" : " (it did NOT)"}`);
}
// A control: the unmutated build is green over the same window.
{
  installSeed(SEED);
  const Z = H.buildGame({ spy: ["addScore", "comboKill"] });
  const r = itemEight(Z, MUT_TICKS, MUT_PLAYS);
  H.eq(r.bad, 0, `fixture: the mutation window is green unmutated${r.first ? " — " + r.first : ""}`);
  H.assert(r.maxMult > 1, "fixture: and it reaches a live multiplier");
}
mutantRed([["    addScore(C.PTS_THORN);", "    addScore(C.PTS_THORN * comboMult());"]],
          "multiplying a Thorn chip");
mutantRed([["  addScore(C.PTS_WELL_PER_LEVEL * state.level);",
            "  addScore(C.PTS_WELL_PER_LEVEL * state.level * comboMult());"]],
          "multiplying the well-clear bonus");
mutantRed([["  if (!state.diedThisWell) addScore(C.PTS_NO_DEATH_WELL);",
            "  if (!state.diedThisWell) addScore(C.PTS_NO_DEATH_WELL * comboMult());"]],
          "multiplying the no-death bonus");
mutantRed([["addScore(e.points() * comboMult()); comboKill(state); sfx(\"kill\", e.sfxVoice); }\n      break;",
            "addScore(e.points()); comboKill(state); sfx(\"kill\", e.sfxVoice); }\n      break;"]],
          "a shot kill paid without the multiplier");
mutantRed([["addScore(e.points() * comboMult()); comboKill(state); sfx(\"kill\", e.sfxVoice); }\n      break;",
            "addScore(e.points() * comboMult()); sfx(\"kill\", e.sfxVoice); }\n      break;"]],
          "a shot kill that does not build the combo");

// ---------------------------------------------------------------------------
// 7. ⛔ CLASSIC IS UNTOUCHED — the hash against the combo mutated out
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

// ⛔ ONE UNIQUE STRING PER SITE (trap 3). buildGame throws unless each is in the
// build exactly once, so this list is its own uniqueness proof.
const COMBO_OUT = [
  ["addScore(e.points() * comboMult()); comboKill(state); sfx(\"kill\", e.sfxVoice); }\n      break;",
   "addScore(e.points()); sfx(\"kill\", e.sfxVoice); }\n      break;"],
  ["addScore(e.points() * comboMult()); comboKill(state); sfx(\"kill\", e.sfxVoice); continue; }",
   "addScore(e.points()); sfx(\"kill\", e.sfxVoice); continue; }"],
  ["if (!e.dead && e.purgeable) { e.dead = true; state.tally.kills++; addScore(e.points() * comboMult()); comboKill(state); sfx(\"kill\", e.sfxVoice); }",
   "if (!e.dead && e.purgeable) { e.dead = true; state.tally.kills++; addScore(e.points()); sfx(\"kill\", e.sfxVoice); }"],
  ["addScore(victim.points() * comboMult()); comboKill(state); sfx(\"kill\", victim.sfxVoice);",
   "addScore(victim.points()); sfx(\"kill\", victim.sfxVoice);"],
  ["\n  comboDeath(state);\n", "\n"],
  ["\n    updateCombo(state, dt);\n", "\n"],
];

const CLASSIC_STEPS = 6000;
function classicSession(mutate) {
  installSeed(SEED);
  const Z = H.buildGame({ mutate });
  const ZG = Z.Game, st = Z.state, ZDT = Z.C.FIXED_DT;
  ZG.reset();
  Z.startGame(SEED);                        // ⛔ the short form: a Classic run
  const hash = makeHasher(Z, () => [ZG.hitStopLeft, ZG.stats.ticks]);
  const hashes = [];
  ZG.input.keyDown(" ");
  for (let i = 0; i < CLASSIC_STEPS; i++) {
    drive(ZG.input, i, { held: true, purge: 311 });
    ZG.update(ZDT);
    if (st.screen === "gameover") Z.startGame((SEED + i) >>> 0);
    hashes.push(hash());
  }
  return { hashes, score: st.score, combo: J(st.combo) };
}
{
  const real = classicSession([]);
  const out = classicSession(COMBO_OUT);
  let first = -1;
  for (let i = 0; i < CLASSIC_STEPS; i++) if (real.hashes[i] !== out.hashes[i]) { first = i; break; }
  H.eq(first, -1, `⛔ CLASSIC IS UNTOUCHED: the state hash is identical on all ${CLASSIC_STEPS} steps with ` +
       `the combo calls mutated out of every kill site (first divergence ${first})`);
  H.eq(real.score, out.score, "and the run's final score is the same number");
  H.eq(real.combo, J({ mult: 1, kills: 0, since: 0, peak: 0 }),
       "⛔ and a Classic run leaves state.combo at its shipped default — nothing wrote it");
  H.assert(real.score > 0 && new Set(real.hashes).size > CLASSIC_STEPS / 2,
           "non-vacuity: the Classic run scored and its hash is not constant");
}

// ---------------------------------------------------------------------------
// 8. ⛔ THE DIRECTOR'S COMBO INPUT (R5; GDD 11.4)
// ---------------------------------------------------------------------------
{
  const read = { count: 0, proximity: 0, peril: 0, heat: 0, combo: -1 };
  quiet("classic", 5);
  kills(40);                                 // a no-op in Classic
  X.dangerInputs(state, read);
  H.eq(read.combo, 0, "⛔ dangerInputs().combo is 0 in CLASSIC (D6) — and NOT ×1's 0.125");

  quiet("overdrive", 5);
  X.dangerInputs(state, read);
  H.close(read.combo, 1 / C.INT_COMBO_MAX, 1e-12,
          "⛔ in Overdrive it is GDD 11.4's clamp01(mult / C.INT_COMBO_MAX) — ×1 reads 0.125 (R5)");
  kills(8 * C.COMBO_KILLS_PER_STEP);         // ×5
  X.dangerInputs(state, read);
  H.close(read.combo, 5 / C.INT_COMBO_MAX, 1e-12, "and ×5 reads 0.625");
  kills(400);                                // the cap
  X.dangerInputs(state, read);
  H.eq(read.combo, 1, "⛔ and ×8 reads exactly 1 — clamped, never above");
  let bad = 0;
  for (let n = 0; n < 200; n++) { X.comboKill(state); X.dangerInputs(state, read); if (!(read.combo >= 0 && read.combo <= 1)) bad++; }
  H.eq(bad, 0, "⛔ the reading is in [0, 1] on every step");
}
// ⛔ AND A DIVE STILL READS DANGER_NONE — audioFrame()'s zero board, not a branch.
{
  installSeed(SEED);
  const Z = H.buildGame({ audio: true, spy: ["dangerInputs"] });
  const ZG = Z.Game, st = Z.state, ZC = Z.C;
  let reads = 0, comboRead = [];
  Z.dangerInputs.after = (s, o) => { reads++; comboRead.push(o.combo); };
  ZG.reset();
  Z.startGame(SEED, { mode: "overdrive" });
  st.screen = "play";
  Z.enterWell();
  st.spawn.remaining = 5; st.spawn.timer = -1e9;
  Z.AudioSys.unlock();
  for (let i = 0; i < 8 * ZC.COMBO_KILLS_PER_STEP; i++) Z.comboKill(st);
  H.eq(st.combo.mult, 5, "fixture: ×5 before the dive");
  let ms = 0;
  const args = [];
  const s0 = Z.MusicSys.setIntensity;
  Z.MusicSys.setIntensity = function (v) { args.push(v); return s0.apply(this, arguments); };
  st.enemies = [];
  Z.startDive(st);
  reads = 0; comboRead = [];
  for (let f = 0; f < 30; f++) { ms += ZC.FIXED_DT * 1000; Z.AudioSys.ctx.currentTime = ms / 1000; ZG.frame(ms); }
  H.assert(st.dive.active, "fixture: still diving");
  H.eq(reads, 0, "⛔ a Dive never calls dangerInputs at all — DANGER_NONE is the whole branch (R5)");
  H.assert(args.length > 0, "fixture: the director still ran every frame");
}

// ---------------------------------------------------------------------------
// 9. ⛔ THE HUD READOUT (O8; GDD 10.3, 10.4)
// ---------------------------------------------------------------------------
function view(o) {
  return Object.assign({ score: 99999999, lives: C.LIVES_MAX, level: 999, levelColor: "#3FE0FF",
                         purgeUses: 0, mirror: false, icon: X.SKIMMER_POLY, jump: null,
                         combo: 1, comboFill: 1, mode: "classic" }, o);
}
function copyRects(v, keys) {
  const L = X.hudLayout(v);
  const out = {};
  for (const k of keys) out[k] = { x: L[k].x, y: L[k].y, w: L[k].w, h: L[k].h };
  return out;
}
const FIVE = ["score", "lives", "level", "purge", "jump"];

// ⛔ CLASSIC'S RECTANGLES ARE BIT-IDENTICAL — and so is CS012 P5's jump box.
for (const mirror of [false, true]) {
  const none = J(copyRects(view({ mirror }), FIVE));
  for (const [name, o] of [["×1 Overdrive", { mode: "overdrive" }],
                           ["×3.5 Overdrive", { mode: "overdrive", combo: 3.5, comboFill: 0.4 }],
                           ["×8 Overdrive", { mode: "overdrive", combo: 8, comboFill: 1 }]]) {
    H.eq(J(copyRects(view(Object.assign({ mirror }, o)), FIVE)), none,
         `⛔ the five HUD rectangles are bit-identical with a ${name} combo (mirror ${mirror})`);
  }
}
// The readings (O8).
H.eq(X.hudComboAlpha(view({ mode: "classic", combo: 4 })), 0, "⛔ the readout is ABSENT in Classic, whatever the number");
H.eq(X.hudComboAlpha(view({ mode: "overdrive", combo: 1 })), 0, "⛔ and ABSENT at ×1");
H.eq(X.hudComboAlpha(view({ mode: "overdrive", combo: 1.5 })), 1, "⛔ shown from ×1.5 up");
H.eq(X.hudComboText(view({ combo: 3.5 })), "×3.5", "⛔ a half step carries its decimal");
H.eq(X.hudComboText(view({ combo: 4 })), "×4", "⛔ a whole number does not");
H.eq(X.hudComboText(view({ combo: C.COMBO_MAX })), "×8", "and the cap reads ×8");
H.assert(X.hudComboText(view({ combo: 3.5 })).length <= C.HUD_COMBO_CHARS,
         "⛔ the widest reading is C.HUD_COMBO_CHARS characters");
H.eq(X.hudComboRing(view({ mode: "overdrive", combo: 2, comboFill: 0.4 })), 0.4,
     "⛔ the ring is the window's remaining fraction — FULL on a kill, empty at the lapse");
H.eq(X.hudComboRing(view({ mode: "overdrive", combo: 2, comboFill: 3 })), 1, "clamped at a full turn");
H.eq(X.hudComboRing(view({ mode: "overdrive", combo: 2, comboFill: -0.2 })), 0, "and at nothing");
H.eq(X.hudComboRing(view({ mode: "overdrive", combo: 1, comboFill: 1 })), 0, "⛔ no ring where there is no readout");
H.eq(X.hudComboRing(view({ mode: "classic", combo: 4, comboFill: 1 })), 0, "⛔ and none in Classic");

// ⛔ THE RECTANGLE CLEARS THE THROAT ZONE (GDD 10.3) AND BOTH TOUCH BUTTONS.
const overlap = (r, b) => r.x < b.x1 && r.x + r.w > b.x0 && r.y < b.y1 && r.y + r.h > b.y0;
for (const mirror of [false, true]) {
  const L = copyRects(view({ mirror, mode: "overdrive", combo: 3.5, comboFill: 1 }), ["combo", "score", "level"]);
  const r = L.combo;
  H.assert(r.w > 0 && r.h > 0 && r.x >= 0 && r.y >= 0 && r.x + r.w <= C.WORLD_W && r.y + r.h <= C.WORLD_H,
           `the combo rectangle is a real rectangle on the world (mirror ${mirror})`);
  H.close(r.x + r.w / 2, C.WORLD_W / 2, 1e-12, `⛔ CENTRE-top (mirror ${mirror})`);
  H.assert(L.score.x + L.score.w < r.x && r.x + r.w < L.level.x,
           `it clears the widest score and "LEVEL 999" (mirror ${mirror})`);

  // test-cs008-p4.js's arithmetic, on all sixteen wells.
  let bad = 0, tightest = Infinity, tightestWell = -1;
  for (let w = 0; w < X.WELLS.length; w++) {
    const well = X.WELLS[w];
    const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    const p = { x: 0, y: 0 };
    const hi = X.wellVertCount(well) - 1;
    for (let lane = 0; lane <= hi; lane += 0.25) {
      for (let d = 0; d < C.READABILITY_DEPTH; d += 0.01) {
        X.screenPos(well, lane, d, p);
        b.x0 = Math.min(b.x0, p.x); b.x1 = Math.max(b.x1, p.x);
        b.y0 = Math.min(b.y0, p.y); b.y1 = Math.max(b.y1, p.y);
      }
    }
    if (overlap(r, b)) { bad++; console.error(`well ${w} combo readout mirror ${mirror}`); }
    if (b.y0 - (r.y + r.h) < tightest) { tightest = b.y0 - (r.y + r.h); tightestWell = w; }
  }
  H.eq(bad, 0, `⛔ the combo readout clears the throat zone on all 16 wells (mirror ${mirror})`);
  if (process.env.P4_MEASURE) console.log(`combo/throat clearance ${tightest.toFixed(2)} px, tightest well ${tightestWell}`);
  H.assert(tightest > 0 && tightest < 40,
           `⛔ and the clearance is REAL but thin (${tightest.toFixed(2)} px on well ${tightestWell}) — ` +
           "an art pass that raises C.HUD_COMBO_SIZE re-derives it");

  // ⛔ H3 — the REAL touch hit test, over the rectangle.
  const input = X.createInput({
    mouseSens: C.MOUSE_SENS, keyTapMs: C.KEY_TAP_MS,
    keySpeedMin: C.KEY_SPEED_MIN, keySpeedMax: C.KEY_SPEED_MAX, keyRamp: C.KEY_RAMP,
    pointerLockOffer: C.POINTER_LOCK_OFFER,
    touchSens: C.TOUCH_SENS, touchZoneFrac: C.TOUCH_ZONE_FRAC,
    touchAutofire: C.TOUCH_AUTOFIRE, touchButtonR: C.TOUCH_BUTTON_R,
    gamepadDeadzone: C.GAMEPAD_DEADZONE, gamepadSens: C.GAMEPAD_SENS,
    inputMirror: mirror, worldW: C.WORLD_W, worldH: C.WORLD_H,
  });
  const hits = (x, y) => {
    input.touchStart(1, x, y);
    const s = input.sample(C.FIXED_DT);
    const hit = s.purge || s.jump;          // read before reset(): the shared struct
    input.touchEnd(1);
    input.reset();
    return hit;
  };
  const m = C.TOUCH_BUTTON_R * 1.5, bx = mirror ? m : C.WORLD_W - m;
  H.assert(hits(bx, m) && hits(bx, C.WORLD_H - m), `the probe registers at both button centres (mirror ${mirror})`);
  let touched = 0, probes = 0;
  for (let x = r.x; x <= r.x + r.w; x += 1) {
    for (let y = r.y; y <= r.y + r.h; y += 1) { probes++; if (hits(x, y)) { touched++; break; } }
  }
  H.assert(probes > 100, `the probe covered the rectangle (${probes})`);
  H.eq(touched, 0, `⛔ no point of the combo rectangle lands on a touch button (mirror ${mirror})`);
}

// ⛔ WHAT drawHud ACTUALLY DRAWS, and that Classic draws exactly what it did.
{
  installSeed(SEED);
  const Z = H.buildGame({ spy: ["glowStroke", "drawPoly", "drawText"] });
  const strokes = [], texts = [], polys = [];
  Z.glowStroke.before = function (c, color, w, alpha) { strokes.push(alpha); };
  Z.drawText.before = function (c, str) { texts.push(str); };
  Z.drawPoly.before = function (c, pts, closed) { polys.push({ n: pts.length, closed }); };
  const ctx = Z._env.doc.getElementById("c").getContext("2d");
  const mk = o => Object.assign({ score: 0, lives: 3, level: 1, levelColor: "#fff",
                                  purgeUses: 0, mirror: false, icon: Z.SKIMMER_POLY, jump: null,
                                  combo: 1, comboFill: 1, mode: "classic" }, o);
  const run = v => { strokes.length = 0; texts.length = 0; polys.length = 0; Z.drawHud(ctx, v); };

  run(mk({}));
  const classic = { s: strokes.length, t: texts.slice(), p: polys.length };
  run(mk({ mode: "overdrive" }));
  H.eq(J([strokes.length, texts, polys.length]), J([classic.s, classic.t, classic.p]),
       "⛔ an Overdrive run at ×1 draws exactly the Classic HUD");
  run(mk({ mode: "overdrive", combo: 3.5, comboFill: 1 }));
  H.eq(texts.length, classic.t.length + 1, "⛔ the readout is ONE more drawText() — the build's one text path");
  H.assert(texts.indexOf("×3.5") >= 0, "⛔ and it is the multiplier");
  H.eq(polys.length, classic.p + 1, "⛔ plus ONE more drawPoly — the ring");
  H.eq(strokes.length, classic.s + 1, "and one more glowStroke over it");
  const ring = polys[polys.length - 1];
  H.eq(ring.closed, false, "⛔ the ring is an OPEN polyline (a partial turn is not a closed shape)");
  H.eq(ring.n, C.HUD_COMBO_RING_SEG + 1, "⛔ a FULL ring is C.HUD_COMBO_RING_SEG segments");
  run(mk({ mode: "overdrive", combo: 3.5, comboFill: 0.25 }));
  H.eq(polys[polys.length - 1].n, Math.round(C.HUD_COMBO_RING_SEG * 0.25) + 1,
       "⛔ and a depleted one draws its share — the ring EMPTIES as the window runs");
  run(mk({ mode: "overdrive", combo: 3.5, comboFill: 0 }));
  H.eq(polys.length, classic.p, "⛔ an empty ring draws nothing, and the text still stands");
  H.eq(texts.length, classic.t.length + 1, "⛔ … the text still stands");
}

// ⛔ AND Game.draw() IS WHAT FILLS IT (O8), IN PLACE.
{
  installSeed(SEED);
  const Z = H.buildGame({ spy: ["drawHud"] });
  const ZG = Z.Game, st = Z.state, ZC = Z.C;
  let seen = null, sameObject = true, first = null;
  Z.drawHud.before = function (c, v) {
    if (first === null) first = v; else if (v !== first) sameObject = false;
    seen = { combo: v.combo, comboFill: v.comboFill, mode: v.mode };
  };
  ZG.reset();
  Z.startGame(SEED);                        // Classic
  st.screen = "play";
  ZG.draw();
  H.eq(seen.mode, "classic", "⛔ a CLASSIC run hands drawHud its mode");
  H.eq(seen.combo, 1, "and a multiplier of 1, which the readout reads as absent");

  ZG.reset();
  Z.startGame(SEED, { mode: "overdrive" });
  st.screen = "play";
  for (let i = 0; i < 8 * ZC.COMBO_KILLS_PER_STEP; i++) Z.comboKill(st);
  ZG.draw();
  H.eq(J(seen), J({ combo: 5, comboFill: 1, mode: "overdrive" }),
       "⛔ an Overdrive run hands it the multiplier and a FULL ring on the kill");
  st.combo.since = ZC.COMBO_WINDOW / 4;
  ZG.draw();
  H.close(seen.comboFill, 0.75, 1e-12, "⛔ and the ring depletes with `since`");
  st.dive.active = true;
  const held = seen.comboFill;
  for (let i = 0; i < 20; i++) ZG.draw();
  H.eq(seen.comboFill, held, "⛔ and it HOLDS in a Dive (O8, O5) — `since` does not move there");
  st.dive.active = false;
  ZG.draw();
  H.assert(sameObject, "⛔ the HUD view is filled IN PLACE, never allocated per frame");
}

// ---------------------------------------------------------------------------
// 10. ⛔ comboLost — ONE SEAT, ONCE PER FALL (O8; GDD 11.8)
// ---------------------------------------------------------------------------
H.assert(typeof C.SFX.comboLost === "object", "⛔ C.SFX.comboLost is a recipe (candidate A, from sfx-lab)");
{
  installSeed(SEED);
  const Z = H.buildGame({ audio: true, spy: ["sfx"] });
  const ZG = Z.Game, st = Z.state, ZC = Z.C, ZDT = ZC.FIXED_DT;
  let lost = 0;
  Z.sfx.before = name => { if (name === "comboLost") lost++; };
  Z.AudioSys.unlock();

  const board = mode => {
    ZG.reset();
    Z.startGame(SEED, { mode });
    st.level = 5;
    Z.enterWell();
    st.spawn.remaining = 1; st.spawn.timer = -1e9;
    st.enemies = [];
    ZG.input.reset();
    lost = 0;
  };

  // A lapse: one sound per step down, and not one per step.
  board("overdrive");
  for (let i = 0; i < 2 * ZC.COMBO_KILLS_PER_STEP; i++) Z.comboKill(st);
  H.eq(st.combo.mult, 2, "fixture: ×2");
  for (let i = 0; i < 400; i++) Z.updateCombo(st, ZDT);   // well past two windows
  H.eq(st.combo.mult, 1, "fixture: it fell to ×1");
  H.eq(lost, 2, "⛔ comboLost sounds ONCE PER FALL — two steps down, two sounds");
  const at1 = lost;
  for (let i = 0; i < 1200; i++) Z.updateCombo(st, ZDT);  // eight more windows at ×1
  H.eq(lost, at1, "⛔ and NOT at ×1, where nothing falls");

  // A death.
  board("overdrive");
  for (let i = 0; i < ZC.COMBO_KILLS_PER_STEP; i++) Z.comboKill(st);
  st.invulnTime = ZC.RESPAWN_INVULN;
  Z.killSkimmer(st);
  H.eq(lost, 1, "⛔ a death that drops the multiplier sounds once");
  st.skimmer.dead = false;
  st.invulnTime = ZC.RESPAWN_INVULN;
  Z.killSkimmer(st);
  H.eq(lost, 1, "⛔ a death at ×1 is SILENT — a fall is a fall, not a cause");

  // ⛔ and never in Classic.
  board("classic");
  for (let i = 0; i < 40; i++) Z.comboKill(st);
  for (let i = 0; i < 1200; i++) Z.updateCombo(st, ZDT);
  st.invulnTime = ZC.RESPAWN_INVULN;
  Z.killSkimmer(st);
  H.eq(lost, 0, "⛔ and it never sounds in Classic");
}
// ⛔ ONE SEAT IN THE BUILD, and it writes nothing (test-cs009-p5.js's scan form).
{
  const fs = require("fs"), path = require("path");
  const script = H.extractScript(fs.readFileSync(path.join(__dirname, "..", "dist", "vector-vortex.html"), "utf8"));
  const seats = script.split("\n").filter(l => /\bsfx\("comboLost"/.test(l) && !/^\s*\/\//.test(l));
  H.eq(seats.length, 1, `⛔ exactly ONE sfx("comboLost") seat in the build (${seats.length})`);
  H.assert(!/[^=!<>]=[^=]|\+\+|--|rng|draw/i.test(/sfx\(([^)]*)\)/.exec(seats[0])[1]),
           "⛔ and its arguments write nothing and draw nothing");
}

// ---------------------------------------------------------------------------
// 11. ⛔ max_combo AND THE maxCombo COLUMN ARE state.combo.peak (R7)
// ---------------------------------------------------------------------------
H.eq(X.TELEMETRY_FIELDS.indexOf("maxCombo"), 20, "⛔ the column kept its place in the order (R7: telemetry stays v1)");
{
  quiet("overdrive", 5);
  kills(5 * C.COMBO_KILLS_PER_STEP);
  H.eq(state.combo.peak, 3.5, "fixture: the run peaked at ×3.5");
  X.comboDeath(state);
  H.eq(X.telemetryRow(state).maxCombo, 3.5,
       "⛔ the maxCombo column is the run's PEAK MULTIPLIER, not its live one");
  quiet("classic", 5);
  kills(40);
  H.eq(X.telemetryRow(state).maxCombo, 0, "⛔ and 0 on a Classic run");
}
{
  // The payload, through the one kit client per mode.
  const rec = { submits: [] };
  const module = {
    create(cfg) {
      return {
        beginRun() { return "run"; },
        submit(result) { rec.submits.push({ gameId: cfg.gameId, result: JSON.parse(J(result)) }); return Promise.resolve({}); },
        fetchBoard() { return new Promise(() => {}); },
        queueLength() { return 0; },
        flushQueue() { return Promise.resolve({}); },
      };
    },
  };
  installSeed(SEED);
  const Z = H.buildGame();
  const ZG = Z.Game, st = Z.state, ZC = Z.C;
  Z._env.win.KitLeaderboard = module;

  ZG.reset();
  Z.startGame(SEED, { mode: "overdrive" });
  for (let i = 0; i < 5 * ZC.COMBO_KILLS_PER_STEP; i++) Z.comboKill(st);
  H.eq(st.combo.peak, 3.5, "fixture: an Overdrive run peaked at ×3.5");
  Z.comboDeath(st);
  st.time = 30;
  Z.Meta.runEnded("quit");
  H.eq(rec.submits.length, 1, "fixture: the Overdrive run submitted once");
  H.eq(rec.submits[0].result.stats.max_combo, 3.5,
       "⛔ the payload's max_combo is state.combo.peak (R7) — 3.5, not 20 kills");
  H.eq(rec.submits[0].gameId, ZC.LEADERBOARD_GAME_IDS.overdrive, "on Overdrive's own board");

  ZG.reset();
  Z.startGame(SEED);                        // Classic
  st.time = 30;
  Z.Meta.runEnded("quit");
  H.eq(rec.submits.length, 2, "fixture: the Classic run submitted too");
  H.eq(rec.submits[1].result.stats.max_combo, 0, "⛔ and a Classic row posts 0");
}

// ---------------------------------------------------------------------------
// 12. ⛔ THE COMBO SPENDS NO RNG DRAW AND CALLS NO heat()
// ---------------------------------------------------------------------------
{
  const fs = require("fs"), path = require("path");
  const script = H.extractScript(fs.readFileSync(path.join(__dirname, "..", "dist", "vector-vortex.html"), "utf8"));
  const bodies = ["comboMult", "comboDrop", "comboKill", "comboDeath", "updateCombo"].map(n => {
    const at = script.indexOf(`\nfunction ${n}(`);
    H.assert(at >= 0, `the build defines ${n}`);
    return script.slice(at, script.indexOf("\n}\n", at));
  }).join("\n");
  H.assert(!/rng|Math\s*\.\s*random/.test(bodies), "⛔ the combo spends NO RNG draw");
  H.assert(!/\bheat\(/.test(bodies.replace(/\/\/.*$/gm, "")), "⛔ and calls no heat() (test-cs007-p2.js holds its call sites)");
}
// ⛔ AND THE OVERDRIVE RUN'S STREAM IS THE COMBO'S TOO: the same draws with the
// combo calls mutated out.
{
  function drawRun(mutate) {
    installSeed(SEED);
    const Z = H.buildGame({ mutate });
    const ZG = Z.Game, st = Z.state, ZDT = Z.C.FIXED_DT;
    begin(Z, 11, 13);
    let draws = 0;
    const raw = st.rng;
    st.rng = function () { draws++; return raw(); };
    const per = [];
    ZG.input.keyDown(" ");
    for (let i = 0; i < 3000 && st.screen !== "gameover"; i++) {
      drive(ZG.input, i, { held: true, purge: 311 });
      ZG.update(ZDT);
      per.push(`${draws}|${st.enemies.map(e => `${e.constructor.name}:${e.lane}:${e.depth}`).join("~")}`);
    }
    return { per, mult: st.combo.mult };
  }
  const withCombo = drawRun([]);
  const without = drawRun(COMBO_OUT);
  const n = Math.min(withCombo.per.length, without.per.length);
  let first = -1;
  for (let i = 0; i < n; i++) if (withCombo.per[i] !== without.per[i]) { first = i; break; }
  H.assert(withCombo.mult > 1, `fixture: the Overdrive run reached ×${withCombo.mult}`);
  H.eq(first, -1, `⛔ an OVERDRIVE run spends the same draws and holds the same board with the combo ` +
       `mutated out — the multiplier feeds back nothing but the score (first divergence ${first})`);
}

// ---------------------------------------------------------------------------
// 13. ⛔ THE OVERDRIVE INTENSITY RE-MEASURE (O14; plan §1.4) — MEASURED
// ---------------------------------------------------------------------------
{
  installSeed(SEED);
  const Z = H.buildGame({ audio: true });
  const ZG = Z.Game, st = Z.state, ZC = Z.C, M = Z.MusicSys;
  const args = { intensity: [], sweep: [] };
  for (const name of ["setIntensity", "setSweep"]) {
    const f0 = M[name];
    M[name] = function (v) { args[name === "setIntensity" ? "intensity" : "sweep"].push(v); return f0.apply(this, arguments); };
  }
  Z.AudioSys.unlock();

  const MEASURE_TICKS = 4000;
  let maxLevel = 0, maxSweep = 0, out = 0, maxMult = 1, frames = 0;
  for (const play of PLAYS) for (const seed of play.seeds.slice(0, 1)) {
    begin(Z, seed, play.level);
    st.screen = "play";
    let ms = 0;
    for (let i = 0; i < MEASURE_TICKS; i++) {
      if (st.screen === "gameover") { ZG.input.reset(); begin(Z, seed + i, play.level); st.screen = "play"; }
      drive(ZG.input, i, play);
      args.intensity.length = 0; args.sweep.length = 0;
      ms += ZC.FIXED_DT * 1000;
      Z.AudioSys.ctx.currentTime = ms / 1000;
      ZG.frame(ms);
      frames++;
      for (const v of args.intensity.concat(args.sweep)) {
        if (!(v >= 0 && v <= 1)) out++;
        if (v > maxLevel) maxLevel = v;
      }
      for (const v of args.sweep) if (v > maxSweep) maxSweep = v;
      if (st.combo.mult > maxMult) maxMult = st.combo.mult;
    }
  }
  H.eq(out, 0, `⛔ GDD 17 item 9: every setIntensity / setSweep argument is in [0, 1] over ${frames} Overdrive frames`);
  H.assert(maxMult > 1, `fixture: the measured boards reached ×${maxMult}`);
  H.assert(maxLevel > 0, "fixture: the director moved");
  console.log(`  MEASURED (CS012 P4): Overdrive director max ${maxLevel.toFixed(4)}, ` +
              `sweep max ${maxSweep.toFixed(4)}, peak ×${maxMult}, over ${frames} frames ` +
              `(plan §1.4 modelled 0.521 with no Reaver and no Jump)`);
}

H.report("test-cs012-p4.js");
