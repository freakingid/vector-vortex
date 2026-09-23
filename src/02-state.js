// 02-state.js — THE one mutable game object.
//
// ⛔ There is exactly one. Every system reads and writes this object; nothing
// keeps a private copy of a field that lives here. `state` is a plain data bag
// with no methods — behaviour lives in the module that owns the field.
//
// ⛔ A field lands here when the changeset that USES it lands, never before.
// A field added "because CS003 will want it" is a field CS003 cannot see the
// reasoning for, and it reads as shipped truth to a session that finds it.
// CS002 landed the first eight; CS003 P1 added `seed` and `rng`, P2 added
// `enemies`, `spawn` and the between-wells hold, P3 added `purgeUses` and
// `purgeLatched`,
// and P4 added `lives` and `invulnTime`. CS006 P1 adds `bandRoll`, and P3 adds
// `dive` — which DELETED CS003 P2's hold field rather than joining it (GDD 5).
// CS007 P4 adds `tally`, the run's cumulative counters. CS008 P2 adds `score`,
// `nextLife` and `diedThisWell`; P3 adds `mode` and `startDepth`. CS012 adds
// `jump` and `combo`; CS013 P1 adds `tokens` and `powers`.
//
// newState() is the shipped-default shape; `state` is one of it. The two exist
// separately so a reset writes defaults from one place instead of a second,
// drifting copy of the same field list (23-main.js's Game.reset()).

function newState() {
  return {
    // ⛔ THE RUN'S SEED AND ITS ONE STREAM (GDD 16.1, 17.1; 01-rng.js).
    // Both are shipped defaults here so the headless suite and a reset() always
    // have a stream to draw from. startGame() (CS003 P2) is what mints a real
    // seed for a run; it writes `seed` FIRST and rebuilds `rng` from it, and it
    // never regenerates `rng` from anything else — `seed` staying readable
    // afterwards is what makes a run replayable.
    //
    // ⛔ `rng` is a live closure over its own counter, not a value: copying
    // `state` copies the reference, so two "copies" of state share one stream.
    // Nothing copies state today; a save/replay feature would store `seed`.
    seed: C.RNG_DEFAULT_SEED,
    rng: mulberry32(C.RNG_DEFAULT_SEED),

    // Screen / state machine (GDD 2, 10.5). CS008 P5's values: "title",
    // "mode", "depth", "options", "play", "gameover" — plain strings, and
    // Game.update() stops the simulation on every one but "play".
    // ⛔ THE SHIPPED DEFAULT STAYS "play". Boot (23-main.js) is what sets the
    // title; every closed test starts a run through reset() and startGame().
    screen: "play",

    // Which of the sixteen wells (03-wells.js) is being drawn. ⛔ GDD 3.4's
    // shapeIndex = (level-1) mod WELLS.length mapping is owned by nextWell()
    // (23-main.js, CS003 P2); the debug cycle action is the only other writer,
    // and it goes through enterWell() like every other well entry.
    wellIndex: 0,

    // ⛔ THE ONE CLOCK (GDD 8, CLAUDE.md Config). All difficulty scaling derives
    // from level. No parallel clocks. Drives band colour today (GDD 3.6).
    //
    // ⚠ SETTLED — IT KEEPS COUNTING PAST 99, AND GDD 3.6's "the counter holds"
    // IS NOT ABOUT THIS FIELD. What holds past 99 is the DERIVED band table —
    // there is no BAND_COLORS row above `hi: 99`, so colour comes from
    // `bandRoll` below instead — and, in CS007, the heat curve. The clock
    // itself is unbounded, and has to be: telemetry samples it and
    // C.PTS_WELL_PER_LEVEL multiplies by it, so a level that stopped rising
    // would freeze the well bonus at 9,900 for the rest of a marathon run.
    //
    // ⛔ THE HOLD BELONGS IN THE CALLER, NEVER HERE. A reader that must not
    // rise past 99 clamps its own input; nothing clamps `state.level`.
    //
    // ✅ ANSWERED, CS007 P2 — NEITHER MOVES, AND NO HOLD SHIPS. This note used
    // to say GDD 17 item 7's `heat(n+1) > heat(n)` over 1..200 and a heat curve
    // that plateaus past 99 could not both be true, and that CS007 owed the
    // choice. It owes nothing: every one of the seven heat-derived rows carries
    // its own clamp (00-config.js), so heat past a row's saturation level
    // changes no value in the build and a hold would be inert by construction.
    // `heat()` never plateaus, item 7 is literally true on the shipped formula,
    // and C.HEAT_HOLD_LEVEL was not built. ⛔ The caller rule above still
    // stands — it is what a hold would have to obey if one were ever needed.
    level: 1,

    // ⛔ THE RUN'S TWO PARAMETERS (GDD 13, 4.6; CS008 P3). Written once, by
    // startGame(seed, opts), and read for the rest of the run: telemetry's two
    // columns, and clearBonuses()'s Start Depth test (12-scoring.js). The
    // shipped defaults ARE a run started with no opts, which is what keeps every
    // closed test's startGame(seed) bit-identical.
    //
    // ⛔ NEITHER IS "WHERE THE PLAYER HAS BEEN". The highest level cleared must
    // survive startGame(), which rewrites this whole object, so it lives in the
    // session record behind levelRecord() (the meta module) and never here.
    mode: "classic",
    startDepth: 1,

    // ⛔ GDD 3.6's past-99 band colour, DRAWN IN THE SIMULATION AND READ BY THE
    // RENDERER. Levels 1..99 have a band row apiece and ignore this field
    // entirely; past 99 `nextWell()` (23-main.js) spends one draw from the
    // run's ONE stream into it and Game.draw() hands it to drawWell().
    //
    // ⛔ IT IS A FIELD RATHER THAN A `state.rng()` AT THE CALL SITE, AND THAT
    // IS THE WHOLE POINT (CLAUDE.md, Math and lifecycle;
    // RATIONALE.md#draw-path-rng). draw() runs on a frame clock and update()
    // does not — a draw in the renderer would make the run's stream a function
    // of refresh rate, and hit-stop draws ~72 frames against zero simulation.
    //
    // The shipped default is 0, which is exactly the literal Game.draw() passed
    // before this field existed, so a run that never reaches level 100 is
    // bit-identical to the build before it.
    bandRoll: 0,

    // ⛔ Counts UP, in seconds of SIMULATION time — not wall clock. It advances
    // only inside Game.update(), so hit-stop freezes it (GDD 16.3: count-up
    // timers only; no countdown pressure anywhere in the build).
    time: 0,

    // ⛔ The device-agnostic input struct (GDD 9.5). Exactly four fields, and
    // the simulation never learns which device produced them. 04-input.js's
    // sample() writes into THIS object every step; call sites read predicates
    // off it and never touch a raw key map.
    input: { rotate: 0, fire: false, purge: false, jump: false },

    // The player's craft (05-skimmer.js, CS002 P2). Null until P2 builds it.
    // ⛔ A DEAD ONE IS STILL HERE. killSkimmer() (09-collision.js) sets its
    // `dead` flag and freezes the loop; the craft stays on screen through the
    // freeze so the player can see what killed them, and respawnSkimmer()
    // (23-main.js) replaces it on the first live step afterwards.
    skimmer: null,

    // ⛔ GDD 4.4 — the reserve, spent by killSkimmer() and by nothing else.
    // Zero is the game-over stop (screen = "gameover"), and since CS008 P5 its
    // menu (RESTART / QUIT TO TITLE); the submission is CS011's. ⛔ RAISED BY
    // addScore() AND NOTHING ELSE (12-scoring.js, CS008 P2): an extra life at
    // each milestone, never past C.LIVES_MAX.
    lives: C.START_LIVES,

    // ⛔ GDD 7 — the run's score. ⛔ addScore() (12-scoring.js) is its ONLY
    // writer; newState() is what puts it back to zero. No cap, no rollover.
    score: 0,

    // ⛔ GDD 4.4 — the score at which the next extra life is due. A FIELD, not
    // a formula over the score: addScore() advances it by C.EXTRA_LIFE_EVERY
    // each time it is crossed, whether or not the cap let the life through.
    nextLife: C.EXTRA_LIFE_FIRST,

    // ⛔ GDD 7's "well cleared, no death" — true once the player has died in
    // THIS well. killSkimmer() sets it; enterWell() clears it. ⚠ A dive death
    // sets it AFTER the clear edge has paid, and nextWell() clears it before
    // the next one, so a dive death never voids the bonus (Paul, P4s).
    diedThisWell: false,

    // ⛔ Counts UP toward RESPAWN_INVULN and HOLDS there (GDD 16.3 — no
    // countdown timers anywhere in the build), and STARTS AT THE THRESHOLD,
    // already expired, exactly as shotCooldown and the Skimmer's squashTime
    // do: a fresh run must not be born invulnerable. respawnSkimmer() is the
    // one place it is armed, by writing zero.
    //
    // ⛔ It lives on `state` and not on the Skimmer because it OUTLIVES the
    // craft it protects — the timer is armed at the moment a brand new craft
    // is minted, and a field on the old one would go with it.
    invulnTime: C.RESPAWN_INVULN,

    // Player shots in flight (06-shots.js, CS002 P3). ⛔ Entities are removed
    // by an end-of-frame .filter(), never spliced mid-loop (GDD 6.5).
    shots: [],

    // ⛔ Counts UP toward SHOT_COOLDOWN (GDD 16.3 — no countdown timers) and is
    // held at the threshold once past it. Starts AT the threshold — already
    // "expired" — so the first shot of a run does not wait out a cooldown that
    // never actually elapsed, the same reasoning 05-skimmer.js's squashTime
    // opens on.
    shotCooldown: C.SHOT_COOLDOWN,

    // ⛔ ONE ARRAY FOR EVERY ENEMY (07-enemies.js, CS003 P2). Thorns, Carriers
    // and Drifters all land here; the contract's flags decide behaviour, not a
    // second array. Removal is an end-of-frame .filter(), never a splice.
    enemies: [],

    // The spawner's two numbers (08-spawner.js). ⛔ `timer` counts UP toward
    // spawnInterval() and HOLDS there when a spawn is blocked, so a slot that
    // frees is used immediately rather than after a fresh interval (GDD 16.3 —
    // no countdown anywhere in the build). `remaining` is a COUNT of enemies
    // the well still owes, not a clock, so it is spent downward. Both are
    // re-armed by enterWell(); nothing else writes them.
    spawn: { timer: 0, remaining: C.SPAWN_QUOTA },

    // GDD 4.3: one Purge charge per well, recharged on entry, never
    // accumulated. ⛔ A COUNT, not a flag: use 1 clears the well, use 2 kills
    // exactly one enemy, use 3+ does nothing, and CS008's PURGE_SAVED_BONUS
    // asks whether this is still 0. enterWell() puts it back to zero, and in
    // Overdrive so does a collected Recharge token (CS013 P1, T6;
    // 10-powerups.js) — nothing else; 09-collision.js's updatePurge() is the
    // only thing that raises it. (CS003 P2 landed this as the boolean `purgeReady`, which
    // could not express the weak second use.)
    purgeUses: 0,

    // ⛔ "The purge button was held LAST step." state.input.purge is a LEVEL —
    // all four devices write a held boolean (GDD 9.5) — so the rising edge is
    // detected against this, and holding the button spends exactly one charge.
    // CS003 P4 forces it true on death; 09-collision.js explains why.
    purgeLatched: false,

    // ⛔ THE DIVE (GDD 5, 4.5 item 5; 11-dive.js). It replaced CS003 P2's
    // CS003 P2's hold outright — that one-second pause was the Dive's placeholder and
    // was deleted with its constant and its branch, not left beside it.
    //
    // ⛔ THE DIVE OWNS ITS OWN DEPTH, AND IT IS DELIBERATELY NOT A Skimmer
    // FIELD. A `skimmer.depth` that is 1 except for 2.6 s is a field two
    // systems can disagree about; a `state.dive.depth` that only means anything
    // while `active` is one that cannot. It is also what keeps
    // 09-collision.js's "there is no term here for where the Skimmer is"
    // LITERALLY true — collideSkimmer() does not run during a dive at all.
    // ⛔ AND CS012 P5's JUMP DID NOT REOPEN IT EITHER (R3). This comment used
    // to say the Jump was the thing that would: it is not. Airborne is a PHASE
    // on state.jump (below), and collideSkimmer() skips its whole pass while
    // it holds rather than comparing a craft depth against a killDepth. The
    // build still has exactly one two-depth comparison, 11-dive.js's strike.
    //
    //   active  the whole gameplay pass is short-circuited while true
    //   phase   "grace" | "descent" — GDD 5's two beats
    //   timer   counts UP through the whole dive toward diveTime() (GDD 16.3),
    //           which is C.DIVE_TIME in Classic and C.DIVE_TIME_OD under
    //           modeHas("rings") — the WHOLE dive either way, grace included
    //   depth   a POSITION, 1 at the rim falling to 0 at the throat. ⛔ Not the
    //           same quantity as an anchored entity's `depth`, which is a
    //           LENGTH — comparing the two is the strike test and it is the
    //           only two-depth comparison in the build (11-dive.js).
    //   rings   Overdrive's ring set — see below
    //
    // ⛔ A RING IS NOT AN ENEMY, AND IT IS NOT A TOKEN EITHER (GDD 14.5; CS014
    // P1, RF1). It is a FIELD ON THIS BAG rather than a third top-level array,
    // and the reason is the Dive's own shape rather than a token's. MEASURED at
    // the plan (§1.4): state.enemies has TWENTY reader functions, and the Dive
    // short-circuits the gameplay pass, so only FIVE of them run inside one —
    // and ⛔ BOTH OF THE TWO THAT WOULD MEET A RING ARE WRONG BY DEFAULT:
    //
    //   respawnSkimmer()  GDD 4.4's ⚠ SETTLED rim push is a CLAMP over every
    //                     lane, skipping only `anchored` entities. MEASURED:
    //                     it collapses 3 of 6 rings onto C.RESPAWN_PUSH_DEPTH
    //                     0.55. A ring's `depth` is a POSITION, so `anchored`
    //                     would be a lie about what `depth` MEANS (GDD 6.5),
    //                     and the alternative is a third exemption in a SETTLED
    //                     rule.
    //   startDive()       its `anchored` filter drops every ring on the repeat,
    //                     which is exactly the job that function has.
    //
    // So a ring costs no contract field, no ENEMY_KINDS row, no STATE_FIELDS
    // row and no exemption in either SETTLED rule. ⛔ state.dive is already a
    // bag that only means anything while `active`, and resetDive() is already
    // its one writer outside updateDive() — so the set inherits the whole
    // lifecycle with no second reset caller. ⛔ ITS ONE WAY IN IS layRings(),
    // from startDive(), under modeHas("rings") (11-dive.js).
    //
    //   a ring   { lane, depth, taken } — the arc's CENTRE lane and the depth
    //            the descent resolves it at, both POSITIONS; `taken` is null
    //            while the ring is still ahead, then true or false, once, for
    //            good. "You stop earning" is that false.
    dive: { active: false, phase: "grace", timer: 0, depth: 1, rings: [] },

    // ⛔ THE JUMP (GDD 14.2; O6, R2, R3; 05-skimmer.js). Overdrive's, and
    // updateJump() is a NO-OP in Classic — it writes nothing at all, not even
    // `latched`, which is what makes a Classic run with the jump button held
    // bit-identical to one without (test-cs012-p5.js).
    //
    // ⛔ AIRBORNE IS A PHASE, NOT A DEPTH. There is no `skimmer.depth` and
    // 09-collision.js still has no term for where the craft is: it SKIPS the
    // whole pass while `phase` is "air". The comments in this build that
    // predicted the Jump would give that pass a second depth to compare were
    // corrected at CS012 P5 to what shipped.
    //
    //   phase    "ground" | "air" | "recover"
    //   t        counts UP inside the phase (GDD 16.3): toward C.JUMP_TIME
    //            airborne, C.JUMP_RECOVERY recovering, unused on the ground
    //   cool     counts UP toward C.JUMP_COOLDOWN FROM LANDING (O6), and is
    //            born AT the threshold — already expired, so the first jump of
    //            a well never waits. Recovery is its first C.JUMP_RECOVERY.
    //   latched  "the jump button was held last step", exactly purgeLatched's
    //            job: takeoff is the RISING edge, so a held button never
    //            re-jumps. ⛔ killSkimmer() forces it true, and neither
    //            enterWell() nor the respawn clears it — a button held across
    //            a freeze or a well change needs a real release first.
    jump: { phase: "ground", t: 0, cool: C.JUMP_COOLDOWN, latched: false },

    // ⛔ THE COMBO (GDD 14.4; O3, O5, R2; 12-scoring.js). Overdrive's, and the
    // four functions that touch it are no-ops in Classic — which is what keeps
    // `mult` at exactly 1 there, and `n * 1 === n` in IEEE-754, so a Classic
    // run's score is bit-identical to the build before CS012 P4
    // (test-cs012-p4.js).
    //
    // ⛔ `mult` IS THE MULTIPLIER AND `peak` IS WHAT THE RUN REPORTS. GDD
    // 15.4's `max_combo` and 15.6's `maxCombo` column are both `peak` — the
    // run's highest MULTIPLIER, 5.5 rather than 11 kills (O3) — and it is 0 on
    // a Classic run, which is the value every Classic row posted before this
    // phase carried.
    //
    //   mult   1 … C.COMBO_MAX on C.COMBO_STEP's half-step lattice
    //   kills  kills since the last step up, 0 … C.COMBO_KILLS_PER_STEP − 1
    //   since  counts UP (GDD 16.3) toward C.COMBO_WINDOW, and wraps at it: a
    //          kill zeroes it, each whole window costs one step of `mult`, and
    //          ⛔ it does not advance during a Dive (O5) — the breath is not a
    //          lapse, and nothing can be killed in one
    //   peak   the highest `mult` this run reached. ⛔ Never falls
    combo: { mult: 1, kills: 0, since: 0, peak: 0 },

    // ⛔ THE TOKENS (GDD 14.1; CS013 P1, T1, T5; 10-powerups.js). Overdrive's.
    // ⛔ A SECOND ARRAY, NOT A KIND IN `enemies`: a token is not an enemy, and
    // dropToken() is its ONE way in, as spawnEnemy() is an enemy's. It is empty
    // for the whole of a Classic run — dropToken() is a no-op there.
    //   kind       a key of C.TOKEN_WEIGHTS
    //   lane       a lane CENTRE, written once at the drop; it never hops
    //   depth      a POSITION, rising at C.TOKEN_RISE to C.TOKEN_HOVER_DEPTH
    //   age        counts UP from the drop toward C.TOKEN_LIFE (GDD 16.3)
    //   dead       set true to remove it, at the end of updateTokens()
    //   collected  true when the craft took it — an instrument for the suite;
    //              nothing in the simulation reads it
    // ⛔ THE WELL OWNS THEM (T5): enterWell() and startDive() empty the array
    // and reset `powers`; a death keeps both.
    tokens: [],

    // ⛔ THE LASTING EFFECTS (GDD 14.1's budgeted-effect list; T5, R11). A
    // collected Lance, Spread or Ward sets its flag, and a duplicate does
    // nothing more. CS013 P2 gives each its reader; resetTokens() clears all
    // three with the well.
    powers: { lance: false, spread: false, ward: false },

    // ⛔ THE RUN'S CUMULATIVE COUNTERS (GDD 15.6; 21-telemetry.js). CS007 P4.
    //
    // ⛔ WRITE-ONLY AS FAR AS THE SIMULATION IS CONCERNED. Twenty-one numbers, each
    // incremented at the ONE place its event actually happens, and read only
    // OUTSIDE the simulation: Telemetry's row builder (the first eight), the
    // leaderboard payload and, since CS015 P2, Meta's achievement facts (all of
    // them, at the clear edge and the run's end, 22-meta.js). ⛔ NOTHING IN THE
    // SIMULATION BRANCHES ON ONE — that is what makes CS007 P4's headline
    // assertion true, that the 10,000-tick determinism hash is identical with
    // capture ON and OFF. A future reader that wants to gate behaviour on one
    // of these has turned an instrument into a mechanic; give it its own field.
    //
    // ⛔ THEY ARE MAINTAINED WHETHER OR NOT CAPTURE IS ON, and that is
    // deliberate: capture is a session switch a player flips mid-run
    // (21-telemetry.js), and counters that only started counting at the flip
    // would make every `deaths` and `wellsCleared` in the log a lie about the
    // run. CS008's HUD and the leaderboard's registered stats read the same
    // numbers without going near telemetry.
    //
    // ⛔ HERE AND NOT INSIDE Telemetry, so newState() resets them — a run's
    // totals belong to the run, and startGame() already writes this whole
    // object. A bag inside the module would need a second reset path and would
    // drift from this one the first time a caller forgot it.
    //
    //   deaths             killSkimmer() — ⛔ NOT START_LIVES - lives, which
    //                      CS008's extra-life awards would quietly falsify
    //   wellsCleared       the wellCleared() -> startDive() edge (23-main.js)
    //   purgesSpent        a charge actually consumed: uses 1 and 2, never 3+
    //   divesCompleted     a dive that reached C.DIVE_TIME. ⚠ COMPLETED, not
    //                      "survived" — a diver who loses a life to a Thorn
    //                      respawns and finishes the dive, and a column named
    //                      for what it does not count is GDD 15.6's own trap
    //   thornDeaths        GDD 4.5 item 5 — the dive strike that actually killed
    //   shotsFired         shots that left the rim, cooldown and cap already paid
    //   kills              enemies the PLAYER destroyed — by shot or by Purge.
    //                      ⛔ Not per kind: the roster grows (GDD 6.4), and a
    //                      column per kind guarantees the column list churns,
    //                      which is exactly what GDD 15.6's rule exists to stop
    //   spawnBlockedTicks  ⛔ the stall's own signature. A step where the
    //                      spawner had quota left and its timer at the interval
    //                      and still released nothing — the release budget
    //                      (CS007 P1) or C.ENEMY_CAP
    //
    // ⛔ CS015 P2's THIRTEEN (plan A2-A), for the achievement table's facts and
    // for nothing else — ⛔ NOT telemetry columns (TELEMETRY_FIELDS stays 29).
    // Where each is counted, beside the counter or the event already there:
    //   thornChips         Thorn.chip() — per chip of LENGTH, beside its 5 points
    //   deathlessWells     the clear edge, unless diedThisWell (23-main.js)
    //   purgeSavedClears   the clear edge, when purgeUses is 0
    //   openWellsCleared   the clear edge, on an open well
    //   wellsSeenMask      enterWell() — ⚠ a BITMASK of wellIndex, not a count:
    //                      "distinct wells this run" needs a memory, and the
    //                      fact Meta hands over is its bit count
    //   extraLives         addScore(), a life actually AWARDED (not one lost at
    //                      C.LIVES_MAX)
    //   rimSweepKills      the rim sweep's kill (09-collision.js)
    //   jumpKills          the jump strike's kill — an aloft entity, the Warden
    //   mimicKills         tallyKill(), at every kill line a Mimic can reach
    //   carrierSplits      tallyKill(): the second of a Carrier's two children
    //                      destroyed by the player (the `brood` both carry,
    //                      07-enemies.js). ⛔ Both must have been spawned
    //   ringsTaken         takeRings(), beside the ring's payout (11-dive.js)
    //   ringSetsTaken      a dive that COMPLETED with every ring of its set
    //                      taken, beside `divesCompleted`
    //   tokenKindsMask     collectToken() — ⚠ a BITMASK over C.TOKEN_WEIGHTS'
    //                      key order; the fact is its bit count
    //
    // ⛔ CS016 P3's TWO (N12, the pre-ship pass), each for one weekly row:
    //   tokensCollected    updateTokens()'s pickup, beside `tokenKindsMask`
    //   thornsDestroyed    Thorn.chip()'s own `dead` edge — ⛔ NOT a kill line:
    //                      a Thorn dies inside its own onShot, so tallyKill()
    //                      is not its seat, and the Purge and the Dive's
    //                      termination set `dead` without a chip
    tally: {
      deaths: 0, wellsCleared: 0, purgesSpent: 0, divesCompleted: 0,
      thornDeaths: 0, shotsFired: 0, kills: 0, spawnBlockedTicks: 0,
      thornChips: 0, deathlessWells: 0, purgeSavedClears: 0, openWellsCleared: 0,
      wellsSeenMask: 0, extraLives: 0, rimSweepKills: 0, jumpKills: 0,
      mimicKills: 0, carrierSplits: 0, ringsTaken: 0, ringSetsTaken: 0,
      tokenKindsMask: 0, tokensCollected: 0, thornsDestroyed: 0,
    },
  };
}

const state = newState();
