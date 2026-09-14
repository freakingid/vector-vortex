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
// the KILL SITE on the false -> true `dead` transition. There are three kill
// sites and no fourth (plan §3):
//
//   collideShots()     a shot kill                          (09-collision.js)
//   collideSkimmer()   the rim sweep — a shot that never had to fly (P1b)
//   updatePurge()      both uses, normal points (Paul, P2s)
//
// ⛔ The Dive's termination kill awards NOTHING (11-dive.js): it is not the
// player destroying a Thorn, and it is not counted in `tally.kills` either. The
// Thorn itself scores per CHIP from inside its own onShot(), because the enemy
// decides what a hit does — its points() is 0, so its death pays nothing extra.

// Add `n` points, and award every extra life the new total has crossed.
//
// ⛔ `state.nextLife` IS THE NEXT MILESTONE, A FIELD, NOT A FORMULA OVER THE
// SCORE. C.EXTRA_LIFE_FIRST, then every C.EXTRA_LIFE_EVERY (Paul, P3s). The
// `while` is what makes one award that crosses two milestones pay both.
//
// ⚠ AN AWARD PAST C.LIVES_MAX IS LOST, AND IN CS008 THAT IS SILENT. The milestone
// still advances — a life refused at the cap is not banked for later. GDD 4.4
// wants a distinct sound for it, and audio is CS009's.
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
    if (state.lives < C.LIVES_MAX && state.screen !== "gameover") state.lives += 1;
    // else: CS009 voices the lost life here (GDD 4.4, "never silently swallowed").
    state.nextLife += C.EXTRA_LIFE_EVERY;
  }
}

// The well-clear bonuses (GDD 7), called ONCE, from Game.update()'s clear edge —
// the step wellCleared() first says yes, before startDive() (Paul, P4s).
//
// ⛔ IN THIS ORDER, AND THE ORDER IS FIXED: the level bonus, the unspent Purge,
// no death. P3 appends the Start Depth bonus here.
//
// ⛔ "NO DEATH" IS state.diedThisWell, which enterWell() clears and killSkimmer()
// sets. A dive death happens AFTER this edge and is cleared by nextWell() before
// the next one, so it never voids the bonus it follows — with no special case.
function clearBonuses(state) {
  addScore(C.PTS_WELL_PER_LEVEL * state.level);
  if (state.purgeUses === 0) addScore(C.PURGE_SAVED_BONUS);
  if (!state.diedThisWell) addScore(C.PTS_NO_DEATH_WELL);
}
