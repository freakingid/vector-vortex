// 02-state.js — THE one mutable game object.
//
// ⛔ There is exactly one. Every system reads and writes this object; nothing
// keeps a private copy of a field that lives here. `state` is a plain data bag
// with no methods — behaviour lives in the module that owns the field.
//
// ⛔ A field lands here when the changeset that USES it lands, never before.
// A field added "because CS003 will want it" is a field CS003 cannot see the
// reasoning for, and it reads as shipped truth to a session that finds it.
// CS002 landed the first seven; CS003 P1 adds `seed` and `rng`.
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

    // Which of the sixteen wells (03-wells.js) is being drawn. CS002 has no
    // level progression, so this is set by the debug cycle action and nothing
    // else. GDD 3.4's shapeIndex = (level-1) mod 16 mapping arrives with the
    // Dive (CS004) and takes ownership of this field then.
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
    skimmer: null,

    // Player shots in flight (06-shots.js, CS002 P3). ⛔ Entities are removed
    // by an end-of-frame .filter(), never spliced mid-loop (GDD 6.5).
    shots: [],

    // ⛔ Counts UP toward SHOT_COOLDOWN (GDD 16.3 — no countdown timers) and is
    // held at the threshold once past it. Starts AT the threshold — already
    // "expired" — so the first shot of a run does not wait out a cooldown that
    // never actually elapsed, the same reasoning 05-skimmer.js's squashTime
    // opens on.
    shotCooldown: C.SHOT_COOLDOWN,
  };
}

const state = newState();
