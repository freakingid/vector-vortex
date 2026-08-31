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
// CS007 P4 adds `tally`, the run's cumulative counters.
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

    // Screen / state machine (GDD 2). CS002 has one screen and no menus; the
    // enum this becomes is CS008's to define, so the value is a plain string
    // rather than a constant nothing else reads yet.
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
    // Zero is the game-over stop (screen = "gameover"), not a screen; CS008
    // owns the UI, the submission and the restart flow. The extra-life awards
    // at C.EXTRA_LIFE_FIRST / _EVERY and the C.LIVES_MAX ceiling belong to
    // addScore() in CS008 and are deliberately unread this changeset.
    lives: C.START_LIVES,

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
    // asks whether this is still 0. enterWell() is the ONLY thing that puts it
    // back to zero; 09-collision.js's updatePurge() is the only thing that
    // raises it. (CS003 P2 landed this as the boolean `purgeReady`, which
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
    // GDD 14.2's Jump is the thing that reopens that, and it is not this.
    //
    //   active  the whole gameplay pass is short-circuited while true
    //   phase   "grace" | "descent" — GDD 5's two beats
    //   timer   counts UP through the whole dive toward C.DIVE_TIME (GDD 16.3)
    //   depth   a POSITION, 1 at the rim falling to 0 at the throat. ⛔ Not the
    //           same quantity as an anchored entity's `depth`, which is a
    //           LENGTH — comparing the two is the strike test and it is the
    //           only two-depth comparison in the build (11-dive.js).
    dive: { active: false, phase: "grace", timer: 0, depth: 1 },

    // ⛔ THE RUN'S CUMULATIVE COUNTERS (GDD 15.6; 21-telemetry.js). CS007 P4.
    //
    // ⛔ WRITE-ONLY AS FAR AS THE SIMULATION IS CONCERNED. Eight numbers, each
    // incremented at the ONE place its event actually happens, and read by
    // exactly one consumer: Telemetry's row builder. ⛔ NOTHING IN THE
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
    tally: {
      deaths: 0, wellsCleared: 0, purgesSpent: 0, divesCompleted: 0,
      thornDeaths: 0, shotsFired: 0, kills: 0, spawnBlockedTicks: 0,
    },
  };
}

const state = newState();
