// 12-scoring.js — points, the clear bonuses and extra lives (GDD 7, 4.4). CS008 P2.
//
// ⛔ addScore() IS THE ONLY WRITER OF state.score AND THE ONLY PLACE A LIFE IS
// AWARDED. Every kill site, every bonus and every chip routes through it, so
// the milestone logic has exactly one place to live (GDD 7). A second writer is
// a score the milestones never saw.
//
// ⛔ NOTHING HERE SPENDS AN RNG DRAW, AND NOTHING IN THE SIMULATION BRANCHES ON
// state.score. The one thing scoring feeds back into the run is `lives`, through
// the milestone below — which is why a scored run and an unscored one spend the
// same draws until an awarded life outlives a game over (test-cs008-p2.js).
//
// ⛔ WHERE THE POINTS COME FROM. An enemy's worth is read off the entity through
// its fourth contract method, points() (07-enemies.js, GDD 6.5), and awarded by
// the KILL SITE on the false -> true `dead` transition. There are FOUR kill
// sites and no fifth — three until CS013 P3 added the jump strike (W4):
//
//   collideShots()     a shot kill                          (09-collision.js)
//   collideSkimmer()   the rim sweep — a shot that never had to fly (P1b)
//   updatePurge()      both uses, normal points (Paul, P2s)
//   jumpStrike()       an airborne craft in an aloft entity's lane (CS013 P3)
//
// ⛔ The Dive's termination kill awards NOTHING (11-dive.js): it is not the
// player destroying a Thorn, and it is not counted in `tally.kills` either. The
// Thorn itself scores per CHIP from inside its own onShot(), because the enemy
// decides what a hit does — its points() is 0, so its death pays nothing extra.
//
// ⛔ AND SINCE CS012 P4 THIS FILE ALSO OWNS THE COMBO (GDD 14.4), at the foot.
// ⛔ THE MULTIPLIER IS APPLIED AT THOSE KILL SITES, NOT IN addScore() — see the
// header there before changing either.

// Add `n` points, and award every extra life the new total has crossed.
//
// ⛔ `state.nextLife` IS THE NEXT MILESTONE, A FIELD, NOT A FORMULA OVER THE
// SCORE. C.EXTRA_LIFE_FIRST, then every C.EXTRA_LIFE_EVERY (Paul, P3s). The
// `while` is what makes one award that crosses two milestones pay both.
//
// ⚠ AN AWARD PAST C.LIVES_MAX IS LOST. The milestone still advances — a life
// refused at the cap is not banked for later — and since CS009 P5 it is voiced
// with `lifeLost`, GDD 4.4's "never silently swallowed". ⛔ Only on a LIVE run:
// a milestone crossed on the game-over step is not an award refused at the cap
// (the rule below), so it is silent (plan §0).
//
// ⛔ A STOPPED RUN SCORES BUT GAINS NO LIFE (Paul, 2026-09-13). A clear edge on
// the step that spent the last life (a Weaver bolt kills as a shot takes the
// well's last enemy) still pays its bonuses, because the edge runs after
// killSkimmer(). The points count toward the final score, but a milestone
// crossed there awards nothing: `lives` stays 0 on the game-over stop. An award
// EARLIER in that step, before the death, is not affected — the run had not
// stopped yet.
function addScore(n) {
  state.score += n;
  while (state.score >= state.nextLife) {
    if (state.screen !== "gameover") {
      if (state.lives < C.LIVES_MAX) { state.lives += 1; sfx("extraLife"); }
      else sfx("lifeLost");
    }
    state.nextLife += C.EXTRA_LIFE_EVERY;
  }
}

// The well-clear bonuses (GDD 7), called ONCE, from Game.update()'s clear edge —
// the step wellCleared() first says yes, before startDive() (Paul, P4s).
//
// ⛔ IN THIS ORDER, AND THE ORDER IS FIXED: the level bonus, the unspent Purge,
// no death, and the Start Depth bonus (CS008 P3).
//
// ⛔ THE START DEPTH BONUS IS PAID ON CLEARING THE STARTING WELL (Paul, S2) — it
// counts toward lives, but only for a player who survives the well they chose.
// No "paid" flag: `state.level` only rises, through nextWell(), and the `w`
// debug key moves wellIndex and never the level, so `level === startDepth` is
// true on exactly one clear edge per run. Level 1 pays startBonus(1), which is
// 0. ⚠ The game-over step's clear pays it like the other three — P2's rule, a
// stopped run scores but gains no life (addScore() above).
//
// ⛔ "NO DEATH" IS state.diedThisWell, which enterWell() clears and killSkimmer()
// sets. A dive death happens AFTER this edge and is cleared by nextWell() before
// the next one, so it never voids the bonus it follows — with no special case.
function clearBonuses(state) {
  addScore(C.PTS_WELL_PER_LEVEL * state.level);
  if (state.purgeUses === 0) addScore(C.PURGE_SAVED_BONUS);
  if (!state.diedThisWell) addScore(C.PTS_NO_DEATH_WELL);
  if (state.level === state.startDepth) addScore(startBonus(state.startDepth));
}

// GDD 4.6's SkillStep bonus for starting at depth `d`. ⛔ THE FORMULA IS
// CANONICAL (Paul, S3) and GDD 4.6's table was corrected to it:
//   1 -> 0, 3 -> 2,400, 5 -> 7,400, 7 -> 14,100, 9 -> 22,300,
//   17 -> 67,600, 33 -> 204,800, 81 -> 887,200.
// A pure function of `d` — it reads no state, and spends no draw.
function startBonus(d) {
  const R = C.START_BONUS_ROUND;
  return Math.round(C.START_BONUS_SCALE * Math.pow(d - 1, C.START_BONUS_EXP) / R) * R;
}

// ---------------------------------------------------------------------------
// THE COMBO — OVERDRIVE'S (GDD 14.4; O3, O4, O5, R2, R6; CS012 P4)
// ---------------------------------------------------------------------------
//
// ⛔ THE MULTIPLIER IS APPLIED AT THE KILL SITES AND NEVER INSIDE addScore()
// (R6). `addScore(e.points() * comboMult())` — five lines in 09-collision.js.
// addScore() stays the ONE writer of state.score and the one life-awarder, and
// it is unchanged: a multiplier folded into it would silently multiply the
// clear bonuses, the Start Depth bonus and the Thorn's per-chip 5, which is
// exactly the scope O4 ruled out.
//
// ⛔ WHAT IT MULTIPLIES, AND WHAT BUILDS IT, ARE ONE RULE (O4): kill points at
// the four kill sites — a shot, the rim sweep, both Purge uses and CS013 P3's
// jump strike — and every kill there builds it. Thorn chips, the clear bonuses
// and the Start Depth bonus are NOT multiplied and do NOT build it. ⛔ The Dive's termination kill
// still pays nothing and builds nothing (GDD 5, 7).
//
// ⛔ EACH KILL SCORES AT THE CURRENT MULTIPLIER AND THEN RAISES IT. That is the
// order O3's table was measured on, and it is why the kill sites read
// `addScore(e.points() * comboMult()); comboKill(state);` in that order.
//
// ⛔ ALL FOUR ARE TOP-LEVEL AND ALL FOUR ARE NO-OPS OUTSIDE modeHas("combo"),
// so a Classic run never touches state.combo at all: `mult` stays exactly 1,
// comboMult() returns exactly 1, and `n * 1 === n` in IEEE-754 — a Classic
// session's hash is identical to one built with these calls mutated out of
// every kill site (test-cs012-p4.js).
//
// ⛔ NOTHING HERE SPENDS AN RNG DRAW OR CALLS heat(). The combo is a function
// of kills and time, not of the level — GDD 8's one clock is untouched by it,
// and test-cs007-p2.js holds heat()'s call sites exact.

// The factor a kill site multiplies by. ⛔ EXACTLY 1 in Classic, never 1.0
// computed from something.
function comboMult() {
  if (!modeHas("combo")) return 1;
  return state.combo.mult;
}

// ⛔ THE ONE comboLost SEAT (O8; GDD 11.8, 14.4: "loss has its own sound"), and
// the one place `mult` falls. Both fall paths — a lapsed window and a death —
// come through here, so the sound is once per FALL rather than once per cause,
// and a fall that would not move the multiplier (a death at ×1) is silent.
function comboDrop(state, to) {
  const c = state.combo;
  if (to >= c.mult) return;
  c.mult = to;
  sfx("comboLost");
}

// A kill at one of O4's four sites. ⛔ Called AFTER the kill has been scored.
function comboKill(state) {
  if (!modeHas("combo", state.mode)) return;
  const c = state.combo;
  // ⛔ THE WINDOW RESTARTS ON EVERY KILL (O3), which is what makes COMBO_WINDOW
  // a lapse clock rather than a gap test between two kills.
  c.since = 0;
  c.kills++;
  if (c.kills >= C.COMBO_KILLS_PER_STEP) {
    c.kills = 0;
    c.mult = Math.min(c.mult + C.COMBO_STEP, C.COMBO_MAX);
  }
  // ⛔ AFTER the raise, so `peak` is the highest multiplier the run REACHED.
  // The first kill of an Overdrive run puts it at 1, which is what separates
  // "an Overdrive run that killed nothing" from a Classic run's 0 (R7).
  if (c.mult > c.peak) c.peak = c.mult;
}

// ⛔ A DEATH IS ×1 AT ONCE, WITH THE KILL COUNT EMPTIED (O3) — not a decay.
// Seated in killSkimmer() BELOW the invulnerability guard (09-collision.js), so
// a kill the guard declined is not a combo loss either.
function comboDeath(state) {
  if (!modeHas("combo", state.mode)) return;
  const c = state.combo;
  comboDrop(state, 1);
  c.kills = 0;
  c.since = 0;
}

// One simulation step of the lapse clock, from Game.update()'s play step.
//
// ⛔ THE CLOCK HOLDS THROUGH A DIVE (O5). MEASURED in the plan (§1.3): the
// median gap from the last kill before a clear to the first kill after it is
// 4.58–4.83 s, of which the Dive is 2.6 s and the next well's first release is
// most of the rest — so a strict window would cost half a step at every well
// change. The Dive is GDD 1.1 P4's breath and nothing can be killed in one.
// The guard is HERE as well as in the caller's ordering, so the rule is the
// function's and not the call site's.
//
// ⛔ `since` COUNTS UP (GDD 16.3) and wraps at the window: a window with no
// kill costs C.COMBO_STEP, and each further window costs another, down to ×1
// (O3). ⛔ The kill count is NOT emptied by a lapse — O3 empties it on a death
// alone. The wrap is what makes the HUD's depletion ring refill for each
// further step, which is the loss the player is being shown.
function updateCombo(state, dt) {
  if (!modeHas("combo", state.mode)) return;
  if (state.dive.active) return;
  const c = state.combo;
  c.since += dt;
  while (c.since >= C.COMBO_WINDOW) {
    c.since -= C.COMBO_WINDOW;
    comboDrop(state, Math.max(1, c.mult - C.COMBO_STEP));
  }
}
