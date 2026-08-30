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
// `enemies`, `spawn` and `clearHold`, P3 added `purgeUses` and `purgeLatched`,
// and P4 adds `lives` and `invulnTime`.
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
    // enum this becomes is CS006's to define, so the value is a plain string
    // rather than a constant nothing else reads yet.
    screen: "play",

    // Which of the sixteen wells (03-wells.js) is being drawn. ⛔ GDD 3.4's
    // shapeIndex = (level-1) mod WELLS.length mapping is owned by nextWell()
    // (23-main.js, CS003 P2); the debug cycle action is the only other writer,
    // and it goes through enterWell() like every other well entry.
    wellIndex: 0,

    // ⛔ THE ONE CLOCK (GDD 8, CLAUDE.md Config). All difficulty scaling derives
    // from level. No parallel clocks. Drives band colour today (GDD 3.6).
    level: 1,

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
    // Zero is the game-over stop (screen = "gameover"), not a screen; CS006
    // owns the UI, the submission and the restart flow. The extra-life awards
    // at C.EXTRA_LIFE_FIRST / _EVERY and the C.LIVES_MAX ceiling belong to
    // addScore() in CS006 and are deliberately unread this changeset.
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
    // C.SPAWN_INTERVAL and HOLDS there when a spawn is blocked, so a slot that
    // frees is used immediately rather than after a fresh interval (GDD 16.3 —
    // no countdown anywhere in the build). `remaining` is a COUNT of enemies
    // the well still owes, not a clock, so it is spent downward. Both are
    // re-armed by enterWell(); nothing else writes them.
    spawn: { timer: 0, remaining: C.SPAWN_QUOTA },

    // GDD 4.3: one Purge charge per well, recharged on entry, never
    // accumulated. ⛔ A COUNT, not a flag: use 1 clears the well, use 2 kills
    // exactly one enemy, use 3+ does nothing, and CS006's PURGE_SAVED_BONUS
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

    // ⚠ TEMPORARY (C.WELL_CLEAR_HOLD). Counts UP while the well is clear and
    // resets whenever it is not, so a kill that lands during the hold cannot
    // leave a half-spent pause behind. CS005's Dive replaces this field, the
    // constant, and the branch in Game.update() that reads it.
    clearHold: 0,
  };
}

const state = newState();
