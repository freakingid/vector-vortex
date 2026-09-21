// 10-powerups.js — Overdrive's tokens (GDD 14.1, 16.3; CS013 P1,
// PLANNED-FEATURES-CS013.md T1–T6). What lives here: the drop (dropToken(), the
// ONE way a token enters the well), a token's life on the board
// (updateTokens(): the rise, the age, the collection, the expiry), the two
// instant effects (Bounty, Recharge), the lasting flags a pickup sets on
// state.powers, and resetTokens(), which the well calls. The draw is
// drawToken() (14-render-entities.js).
//
// ⛔ A TOKEN IS NOT AN ENEMY, AND IT LIVES IN ITS OWN ARRAY, state.tokens (T1).
// state.shots is the precedent: a second entity array exactly because the
// enemy passes would get it wrong. MEASURED at the plan (§1.4): state.enemies
// has 19 reader sites, and a token inside it needs an answer at eight, three of
// them wrong by default — collideShots() would hit-test it and its unconditional
// `break` would let a hovering token SHIELD the rim enemies behind it;
// respawnSkimmer()'s rim push would drop a hovering token to 0.55 on every
// death; and spawnEnemy() would refuse it at ENEMY_CAP and spend a heading draw
// it has no use for. dangerInputs(), telemetryRow() and laneCrowded() would each
// count it as a threat. So: no contract field, no ENEMY_KINDS row, none of the
// 19 sites touched, and GDD 6.5's "ONE array" is still true of enemies.
//
// ⛔ GDD 14.1's TWO TABLES ARE TWO. The DROP-WEIGHT TABLE (C.TOKEN_WEIGHTS,
// read by tokenKind() below) says WHICH token a drop is; the BUDGETED-EFFECT
// LIST (C.BOUNTY_POINTS here, C.LANCE_CHIP_MULT and C.SPREAD_SHOT_MAX in
// CS013 P2) says WHAT each one does. Neither reads the other's numbers, so a
// weight is never a budget and a budget is never a weight.
//
// ⛔ ONE DRAW PER OVERDRIVE KILL, FROM THE RUN'S ONE STREAM, AND NONE IN
// CLASSIC (T2). The draw is spent whether or not anything drops — at
// C.MAX_TOKENS too — and the kind comes from the SAME draw, rescaled. So "one
// draw per Overdrive kill" is a count a test can make, as test-cs006-p5.js
// counts one per spawn, and a Classic run spends exactly what it spent before.
//
// ⛔ NOTHING IN THE DRAW PATH CALLS state.rng() (CLAUDE.md, Math and
// lifecycle). Every random value a token has was drawn here, in the simulation.

// The kind a drop is, from `v` in [0, 1): the one draw rescaled by its drop
// chance (T3). A weighted walk over C.TOKEN_WEIGHTS in its KEY ORDER — the
// order is part of the table, so a board replays.
function tokenKind(v) {
  const w = C.TOKEN_WEIGHTS;
  const keys = Object.keys(w);
  let total = 0;
  for (let i = 0; i < keys.length; i++) total += w[keys[i]];
  let x = v * total;
  for (let i = 0; i < keys.length; i++) {
    x -= w[keys[i]];
    if (x < 0) return keys[i];
  }
  return keys[keys.length - 1];
}

// Tokens on the board that have not been taken or expired.
function liveTokens(state) {
  let n = 0;
  for (let i = 0; i < state.tokens.length; i++) if (!state.tokens[i].dead) n++;
  return n;
}

// ⛔ THE ONE WAY A TOKEN ENTERS THE WELL (T1, T2, T3, T4). Called by the five
// kill lines in 09-collision.js on the false -> true `dead` edge, beside
// comboKill(): a shot, the rim sweep, both Purge uses, and CS013 P3's jump
// strike (W4), which inherited the roll with the rest of the line. ⛔ Not by
// the Dive's termination kill, which is not a kill site and rolls nothing.
//
// ⛔ A TOTAL NO-OP OUTSIDE modeHas("tokens") — no draw, no write — which is what
// keeps a Classic run bit-identical to the build before this changeset.
//
// p = C.TOKEN_DROP_CHANCE / (1 + threatCount()), read AFTER the victim is dead,
// so GDD 14.1's "drop rate falls as enemy count rises" is the board the kill
// leaves behind. A drop when the draw falls under p; the kind is that same draw
// divided by p (T3). A board already at C.MAX_TOKENS still spends the draw and
// discards the drop.
//
// Born at the victim's lane, rounded to a centre, and at its depth or the hover
// depth, whichever is nearer the throat (T4). An anchored victim's depth is a
// length, so a Thorn's token is born at its tip, where the last chip landed.
function dropToken(state, e) {
  if (!modeHas("tokens", state.mode)) return;
  const u = state.rng();
  const p = C.TOKEN_DROP_CHANCE / (1 + threatCount(state));
  if (!(u < p)) return;
  if (liveTokens(state) >= C.MAX_TOKENS) return;
  const well = WELLS[state.wellIndex];
  state.tokens.push({
    kind: tokenKind(u / p),
    // `+ 0` turns Math.round(-0.4)'s -0 into 0.
    lane: laneNormalize(well, Math.round(e.lane) + 0),
    depth: e.depth < C.TOKEN_HOVER_DEPTH ? e.depth : C.TOKEN_HOVER_DEPTH,
    age: 0,
    dead: false,
    collected: false,
  });
}

// ⛔ THE PICKUP (T6, R11). The two instant tokens act here and are done; a
// lasting one sets its flag on state.powers, which CS013 P2 gives its reader.
// ⛔ A DUPLICATE DOES NOTHING MORE (T5): a second Lance while one is on sets a
// flag that is already true. It is still collected, and still sounds.
//
//   bounty    addScore(C.BOUNTY_POINTS). ⛔ NOT MULTIPLIED AND BUILDS NOTHING —
//             CS012's O4: only kill points are multiplied, and what is
//             multiplied is exactly what builds. It can cross a milestone and
//             pay a life, as any addScore() can.
//   recharge  state.purgeUses = 0, so the Purge is at full strength and its
//             HUD glyph bright. ⚠ The "Purge unspent" clear bonus then pays
//             again: clearBonuses() reads purgeUses === 0, and a recharged
//             charge is unspent. tally.purgesSpent does not move.
function collectToken(state, t) {
  t.dead = true;
  t.collected = true;
  sfx("collect");
  switch (t.kind) {
    case "bounty":   addScore(C.BOUNTY_POINTS); break;
    case "recharge": state.purgeUses = 0; break;
    case "lance":    state.powers.lance = true; break;
    case "spread":   state.powers.spread = true; break;
    case "ward":     state.powers.ward = true; break;
  }
}

// One simulation step of every token (T4), from Game.update()'s play step:
// AFTER the collision pass and both end-of-frame filters, so a token dropped
// this step is aged this step, and BEFORE the spawner and the clear edge, so a
// Bounty or a Recharge taken on the clear step is paid before the bonuses.
//
//   rise     C.TOKEN_RISE depth per second toward C.TOKEN_HOVER_DEPTH, where
//            it holds. Its lane never moves.
//   age      counts UP from the drop (GDD 16.3: `token.age >= TOKEN_LIFE`,
//            verbatim) and it expires on the step it gets there.
//   collect  by touch: a LIVE craft within C.HIT_LANE_TOL of a token that has
//            reached the hover depth. A rising token cannot be taken. Airborne
//            counts — a pickup is not contact with a killer.
//
// ⛔ Removal is this function's own end-of-pass filter, never a splice (GDD
// 6.5), and there is none to do on an empty board — a Classic step allocates
// nothing here.
function updateTokens(state, well, dt) {
  if (state.tokens.length === 0) return;
  const sk = state.skimmer;
  const live = sk && !sk.dead;
  let gone = 0;
  for (let i = 0; i < state.tokens.length; i++) {
    const t = state.tokens[i];
    if (t.dead) { gone++; continue; }
    if (t.depth < C.TOKEN_HOVER_DEPTH) {
      t.depth += C.TOKEN_RISE * dt;
      if (t.depth > C.TOKEN_HOVER_DEPTH) t.depth = C.TOKEN_HOVER_DEPTH;
    }
    t.age += dt;
    if (t.age >= C.TOKEN_LIFE) { t.dead = true; gone++; continue; }
    if (live && t.depth >= C.TOKEN_HOVER_DEPTH && laneHit(well, t.lane, sk.lane)) {
      // ⛔ WRITE-ONLY (02-state.js's `tally`; CS015 P2): which KINDS this run
      // has taken, one bit per key of C.TOKEN_WEIGHTS in its ORDER — at the
      // pickup, never in collectToken(): the effect side names no weight.
      state.tally.tokenKindsMask |= 1 << Object.keys(C.TOKEN_WEIGHTS).indexOf(t.kind);
      collectToken(state, t);
      gone++;
    }
  }
  if (gone) state.tokens = state.tokens.filter(t => !t.dead);
}

// ⛔ THE WELL OWNS THEM (T5). enterWell() and startDive() call this, so no
// token rises through a Dive and no lasting effect crosses the throat — the
// Dive is untouched, as CS012's R4 left it untouched by the Jump. ⛔ A death
// does NOT call it: tokens stay on the board and Lance and Spread stay on,
// which is the Purge charge's rule — re-armed on entry, never on death.
function resetTokens(state) {
  state.tokens = [];
  state.powers.lance = false;
  state.powers.spread = false;
  state.powers.ward = false;
}
