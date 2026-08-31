// 00-config.js — THE tuning surface. ⛔ Every tunable in the game lives here.
//
// ⛔ Never inline a magic number anywhere else in src/. If a value might ever be
// retuned, it belongs in C. This rule outranks code elegance and is the single
// highest architectural priority in the project (CLAUDE.md, Build rules).
//
// Grouped by system, in roughly the order the GDD introduces them. Keep the
// grouping comments — they are how a future session finds the knob it wants
// without reading the whole object.

const C = {

  // ---- World / view (GDD 16.1) --------------------------------------------
  // ⛔ Fixed internal resolution. Game math NEVER reads window size; the canvas
  // is letterboxed by CSS. These must match src/shell.html's canvas attributes.
  WORLD_W:              1280,
  WORLD_H:              720,

  // ---- Loop / timestep (GDD 16.1) -----------------------------------------
  // ⛔ Fixed-timestep accumulator. FIXED_DT is the ONLY dt the simulation ever
  // sees; the frame's wall-clock dt only decides how many steps run. DT_CLAMP_MAX
  // is what stops a tab-switch stall from becoming a physics event, and
  // MAX_CATCHUP_STEPS is what stops the debt from being repaid forever (the
  // spiral of death) — past the cap the surplus is discarded, not banked.
  FIXED_DT:             1 / 60, // s per simulation step. GDD 17 drives tests here.
  DT_CLAMP_MAX:         0.25,   // s — the largest frame dt ever admitted
  MAX_CATCHUP_STEPS:    5,      // ⛔ hard bound on steps in one frame

  // ---- RNG (GDD 16.1, 17.1) -----------------------------------------------
  // ⛔ The one seeded stream's fallback seed. 02-state.js's newState() builds
  // state.rng from it so the headless suite always has a stream to drive;
  // startGame() (CS003 P2) overwrites state.seed with the run's real seed and
  // rebuilds the stream from that. The VALUE is arbitrary — what matters is
  // that it is fixed, so a reset() replays identically.
  RNG_DEFAULT_SEED:     1,

  // ---- Well geometry (GDD 3) ----------------------------------------------
  PERSPECTIVE_EXP:      0.55,   // depth -> screen easing. Lower = more rush.
  THROAT_SCALE:         0.055,  // rim polygon scaled toward centroid = throat
  DIM_BAND_ALPHA:       0.18,   // levels 65-80. NOT 0 — see GDD 3.7.
  // Where the normalized [-1,1] rim space lands on the fixed world. WELL_CY
  // sits above centre: the well leans into the upper screen so the HUD and the
  // near rim have room. WELL_RADIUS is the half-extent one rim unit maps to.
  WELL_CX:              640,
  WELL_CY:              330,
  WELL_RADIUS:          300,
  // ⛔ A GATE, NOT A TUNABLE (GDD 17 item 2, 1.1 P2). The shortest lane-CENTRE
  // spoke any well may have, in world px. A lane below this is a lane an enemy
  // climbs in almost no screen distance: stationary, then lethal, with nowhere
  // for the player to read it. A well that fails the gate is REDRAWN or given a
  // throatOffset (03-wells.js) — the constant is never lowered to admit it.
  // 60 separates the two wells CS006 P2 fixed (Flat 24 px, Stair 30 px) from
  // the tightest working one (Twist 74 px), with no well inside 20 % of it.
  MIN_LANE_SPOKE_PX:    60,

  // ---- Skimmer (GDD 4) ----------------------------------------------------
  SKIMMER_WIDTH:        0.9,    // lane widths spanned at the rim
  SKIMMER_COLOR:        "#FFFFFF",  // ⚠ not specified by the GDD — see STATUS
  SNAP_IDLE_MS:         90,     // idle time before snap assist engages
  SNAP_STRENGTH:        6.0,    // lane-units/sec pull toward lane centre
  SNAP_EPSILON:         0.01,   // lane units; inside this snap is settled, and stops
  WALL_SQUASH_MS:       40,     // open-well end bounce, visual only
  SKIMMER_SQUASH:       0.35,   // peak fraction of width lost at full squash
  SHOT_MAX:             8,      // ⛔ hard cap on shots in flight
  SHOT_TIME:            0.52,   // s, rim -> throat
  SHOT_COOLDOWN:        0.055,  // s between shots
  SHOT_LEN:             0.06,   // depth units, the trailing streak's length
  THORN_CHIP:           0.08,   // fraction of lane length removed per hit — off
                                // the TIP (07-enemies.js). See THORN_MAX below.
  PURGE_SAVED_BONUS:    500,
  START_LIVES:          3,
  LIVES_MAX:            6,
  EXTRA_LIFE_FIRST:     20000,
  EXTRA_LIFE_EVERY:     40000,
  RESPAWN_INVULN:       1.5,    // s
  RESPAWN_PUSH_DEPTH:   0.55,   // ⛔ enemies at rim pushed here on respawn
  // The respawn blink, in full on/off cycles per second. ⛔ Visual only — the
  // invulnerability itself is state.invulnTime against RESPAWN_INVULN, and the
  // blink is how the player is told it is still running (GDD 1.1 P2).
  INVULN_BLINK_HZ:      6,      // on/off cycles per second while invulnerable

  // ---- Dive (GDD 5) -------------------------------------------------------
  // ⛔ DIVE_GRACE IS A PILLAR P2 REQUIREMENT, NOT POLISH. THORN_MAX is 1.00 and
  // a full-length Thorn's tip sits AT THE RIM (see the Thorn block below) — so
  // without a beat at depth 1 before the descent starts, a dive that begins in
  // that lane is a death on step one with no input opportunity: a threat that
  // is lethal before it is legible. 0.35 s is enough to read the board and
  // start moving, and the worst case fits inside it with room — eight lanes on
  // a Ring at KEY_SPEED_MAX 14 lane/s is 0.57 s, well inside the 2.25 s
  // descent that follows.
  //
  // ⛔ Counted UP toward, like every timer in the build (GDD 16.3).
  DIVE_GRACE:           0.35,   // s at depth 1 before the descent begins
  DIVE_TIME:            2.6,    // s, Classic. ⛔ the WHOLE dive, grace included
  DIVE_TIME_OD:         4.0,    // s, Overdrive ring-flight. ⛔ hard cap.
  DIVE_RINGS_MAX:       6,      // ⛔ hard cap.

  // ---- Enemies (GDD 6) ----------------------------------------------------
  SAFE_SPAWN_DEPTH:     0.75,   // never spawn above this in the player's lane
  // ⛔ GDD 6.3's "fair difficulty is a visible fuse", as seconds. It has sat
  // here unread since CS001 and CS005 P3 is its first reader; ⛔ it stays in
  // this shared group rather than moving down to the Surger block, because
  // moving a shipped key is a diff nobody can review against a value nobody
  // changed. See the Surger block below, which names it.
  SURGE_TELEGRAPH:      0.45,   // s of visible fuse before discharge
  ENEMY_CAP:            16,     // ⛔ READABILITY constraint, not difficulty.
  // ⛔ An entity's drawn depth half-extent, as a fraction of its OWN
  // perspective position — NOT a constant depth offset. perspective() is
  // depth^0.55, so a constant offset spans ~13% of the well at the throat and
  // ~3% at the rim, and an enemy drawn that way SHRINKS as it comes at you.
  // 14-render-entities.js's entityPoints() is the one reader.
  ENEMY_DEPTH_SCALE:    0.10,

  // ---- Enemy palette (GDD 6.1, 3.6) ---------------------------------------
  // ⚠ ALL PROVISIONAL, the same standing as SKIMMER_COLOR and VAULTER_COLOR:
  // the GDD specifies no enemy palette, and the first art pass owns every one
  // of these. They are here as ONE SET, chosen together in CS004 P1, because a
  // palette picked four now and two later is a palette with a clash in it.
  //
  // ⛔ THE CONSTRAINT THEY WERE CHOSEN AGAINST: an enemy colour has to read
  // against ALL SEVEN band colours (BAND_COLORS below, GDD 3.6), because the
  // well cycles and the enemy palette does not. Hue alone cannot separate
  // eight simultaneous things — silhouette and line weight carry the load, and
  // the palette's job is narrower than "look different": stay out of the two
  // bands players actually reach, cyan (levels 1-16) and magenta (17-32), and
  // keep the Thorn visibly NOT A CREATURE.
  //
  // VAULTER_COLOR is the seventh member of this set; it sits with the Vaulter's
  // other tunables below, where CS003 P1 put it.
  CARRIER_COLOR:        "#FFB84A",  // ⚠ warm amber; the hull AND its cargo glyph
  WEAVER_COLOR:         "#B6FF4A",  // ⚠ acid green
  WEAVER_BOLT_COLOR:    "#E8FF9A",  // ⚠ a paler relative of its parent
  THORN_COLOR:          "#A98CFF",  // ⚠ cool and inert — it is not a creature
  DRIFTER_COLOR:        "#FF5AC8",  // ⚠ unread until CS005, deliberately
  SURGER_COLOR:         "#9AF0FF",  // ⚠ unread until CS005, deliberately

  // ---- Vaulter (GDD 6.1, 6.3) ---------------------------------------------
  VAULTER_SIZE:         0.70,   // lane widths spanned by the silhouette
  VAULTER_COLOR:        "#FF4A4A",  // ⚠ placeholder — same standing as SKIMMER_COLOR
  // ⛔ THE THREE HEAT-DERIVED BASES BELOW ARE LEVEL-1 VALUES AND NOTHING READS
  // THEM DIRECTLY (CS007 P2). The climb goes through climbMult(), the two
  // intervals through vaultInterval() / vaultRimInterval(); see THE HEAT CLOCK
  // at the foot of this file. VAULT_HOP_TIME is NOT one of them — H2: heat
  // scales intervals and climb rates, never a hop or crossing duration, which
  // is what keeps three closed soaks' per-tick lane bounds valid unchanged.
  VAULT_CLIMB:          0.18,   // depth/s, throat -> rim ~5.5 s. Level-1 base.
  VAULT_INTERVAL:       2.20,   // s between mid-climb hops. ⛔ level-1 base
  VAULT_INTERVAL_MIN:   1.00,   // ⛔ its floor at HEAT_FULL_LEVEL
  VAULT_HOP_TIME:       0.28,   // s to cross one lane; hittable in both meanwhile
  VAULT_RIM_INTERVAL:   0.55,   // s between rim hunt hops. ⛔ level-1 base
  // ⛔ 0.35 AND NOT LOWER, AND THE REASON IS SATURATION, NOT OVERLAPPING HOPS.
  // Vaulter.update() gates on `if (this.hopping)`, so a second hop cannot start
  // inside a first at any interval. MEASURED (PLANNED-FEATURES-CS007.md §5.1):
  // the hop rate saturates at 1 / VAULT_HOP_TIME = 3.57 hops/s, so any floor
  // below 0.28 is inert. 0.35 keeps the knob live at every level — a rim
  // Vaulter at L99 hops ~79 % of ticks and still visibly pauses, which is the
  // legibility half of GDD 1.1 P2.
  VAULT_RIM_INTERVAL_MIN: 0.35, // ⛔ its floor at HEAT_FULL_LEVEL
  VAULT_FIRST_LEVEL:    2,      // ⛔ GDD 6.3 — no mid-climb vaulting at level 1

  // ---- Carrier (GDD 6.1, 6.2) ---------------------------------------------
  // ⛔ CARRIER_SIZE and CARRIER_GLYPH_SIZE are LANE widths and nothing else.
  // entityPoints() (14-render-entities.js) scales a poly's `l` by size/2 and
  // its `d` by C.ENEMY_DEPTH_SCALE alone — a silhouette's DEPTH extent is not
  // a function of its size. So these two numbers set how wide the hull is and
  // how wide the glyph inside it is, and the two polys' own `d` values set how
  // deep each one looks. Raising CARRIER_GLYPH_SIZE past CARRIER_SIZE would
  // put the glyph outside the hull across the lanes while leaving it inside on
  // depth, which reads as a rendering bug rather than as a bigger glyph.
  CARRIER_SIZE:         0.80,   // lane widths spanned by the hull
  CARRIER_GLYPH_SIZE:   0.34,   // lane widths spanned by the cargo glyph
  CARRIER_CLIMB:        0.11,   // depth/s, throat -> rim ~9 s. GDD 6.1's "slow"

  // ---- Weaver and its bolt (GDD 6.1, 4.5) ---------------------------------
  // The cycle, and it is meant to be nameable by a player watching it: it comes
  // up, it leaves a Thorn, it spits, it goes back down. WEAVER_RETREAT is
  // deliberately FASTER than WEAVER_CLIMB so leaving reads as a beat rather
  // than as a second approach.
  //
  // ⛔ WEAVER_APEX IS THE LEVEL-1 BASE AND weaverApex() IS ITS ONE READER
  // (CS007 P2). GDD 8's one clock decides how far up a Weaver comes; the
  // Weaver's cycle reads the accessor, never this number.
  //
  // ⛔ ONE NUMBER SETS FOUR THINGS, which is why GDD 8's "Weaver thorn length"
  // and its apex are one knob and not two: layThorn() writes the Thorn's tip to
  // the Weaver's own depth, so apex IS thorn length. MEASURED at the 0.75
  // ceiling (PLANNED-FEATURES-CS007.md §5.1): the bolt's apex→rim flight is
  // 0.781 s (still 1.7x SURGE_TELEGRAPH's 0.45 s "visible fuse" benchmark), the
  // Thorn costs 10 shots, it leaves 0.25 of the lane to the player, and a dive
  // is struck 0.91 s into 2.60. ⛔ The ceiling must stay strictly below 1.00:
  // at 1.00 the tip sits at the rim, the lane is sealed against the player's
  // own shots, and the bolt is born in contact.
  //
  // ⛔ WEAVER_SIZE and WEAVER_BOLT_SIZE are LANE widths, the same as
  // CARRIER_SIZE above: entityPoints() scales a poly's `l` by size/2 and its
  // `d` by C.ENEMY_DEPTH_SCALE alone, so a silhouette's DEPTH extent is not a
  // function of its size.
  WEAVER_SIZE:          0.62,   // lane widths spanned by the spiral
  WEAVER_CLIMB:         0.22,   // depth/s on the way up
  WEAVER_RETREAT:       0.34,   // depth/s down — leaving is faster than arriving
  WEAVER_APEX:          0.55,   // depth it climbs to before turning. ⛔ level-1 base
  WEAVER_APEX_MAX:      0.75,   // ⛔ its ceiling at HEAT_FULL_LEVEL. Strictly < 1.00
  WEAVER_APEX_HOLD:     0.35,   // s held at the apex, which is when it fires
  WEAVER_BOLT_SPEED:    0.32,   // depth/s toward the rim. ~1.4 s from apex to rim
  WEAVER_BOLT_SIZE:     0.30,   // lane widths spanned by the dart

  // ---- Thorn (GDD 6.1, 4.2, 5, 8) -----------------------------------------
  // ⛔ NEITHER OF THESE IS A LANE WIDTH. A Thorn is not a silhouette at a
  // point — it is a SEGMENT ALONG the lane, so both numbers are in DEPTH units
  // and neither goes anywhere near entityPoints() (14-render-entities.js).
  //
  // ⛔ AND THE THORN'S `depth` IS ITS LENGTH, not its position (07-enemies.js's
  // `anchored`). THORN_MAX is therefore GDD 8's "clamp: lane length" — the
  // longest a Weaver may grow one — and at 1.00 a full-length Thorn's tip sits
  // at the RIM, which seals the lane: a shot fired into it is consumed the
  // instant it leaves the craft. That is the intended lane denial, and this is
  // the knob if it reads as unfair rather than as a consequence.
  //
  // THORN_CHIP (0.08, up with the Skimmer's firing block where CS001 put it)
  // is what one shot takes off the tip, so a full-length Thorn is 13 shots.
  // THORN_TIP_LEN is how much of the tip is drawn a second time, so a chip is
  // visible as it lands (GDD 1.1 P2).
  THORN_MAX:            1.00,   // ⛔ depth units of LENGTH — GDD 8's lane-length clamp
  THORN_TIP_LEN:        0.05,   // depth units of brighter tip

  // ---- Drifter (GDD 6.1, 6.3, 4.5 item 2, 3.5) ----------------------------
  // The cycle, and it is meant to be readable as an ALTERNATION rather than as
  // a speed: it settles on a lane boundary and is armoured there, it crosses
  // one lane and is shootable while it does, and it climbs the whole time.
  //
  // ⛔ DRIFT_CLIMB APPLIES IN BOTH PHASES. That is what stops an unshootable
  // entity from parking — see 07-enemies.js — and it also makes the lane SPEED
  // one number: the birth half-cross covers half a lane in half the time, so
  // every crossing moves at DT / DRIFT_CROSS_TIME lane units per step and a
  // soak's bound is derived rather than picked.
  //
  // ⛔ DRIFT_RIDE_TIME IS THE ARMOUR BUDGET. At 0.85 s riding against 0.45 s
  // crossing a Drifter is shootable about a third of the time; raising it is
  // the fastest way to make an enemy the player cannot answer, and it is the
  // knob if the Drifter reads as cheap rather than as hard.
  //
  // ⛔ DRIFTER_SIZE IS A LANE WIDTH, the same as CARRIER_SIZE and WEAVER_SIZE:
  // entityPoints() scales a poly's `l` by size/2 and its `d` by
  // C.ENEMY_DEPTH_SCALE alone. It is the CROSSING silhouette's span — the
  // riding poly reaches less far across the lanes on purpose, which is one of
  // the three channels below.
  DRIFTER_SIZE:         0.66,   // lane widths spanned by the crossing silhouette
  DRIFT_CLIMB:          0.13,   // depth/s, ⛔ in BOTH phases. throat -> rim ~7.7 s
  DRIFT_RIDE_TIME:      0.85,   // s on a boundary before a cross — ⛔ the armour budget
  DRIFT_CROSS_TIME:     0.45,   // s to cross one lane, vulnerable throughout
  DRIFT_HOME_DEPTH:     0.60,   // at or above this, a cross aims at the Skimmer

  // ⛔ THE THREE-CHANNEL READ (GDD 6.3, 12). GDD 6.3 carries a ⛔ on the
  // armoured state being visible AT A GLANCE, and GDD 12's first-Drifter prompt
  // names the visual language it expects: SOLID = ARMOURED · OPEN = VULNERABLE.
  // So the two states differ on three independent channels at once —
  // silhouette (two polys, one drawn closed and one open), stroke width, and
  // alpha — and no one of them carries the read alone.
  //
  // ⛔ THESE ARE PER-ENTITY MULTIPLIERS ON laneLineWidth(), NEVER GLOBAL GLOW
  // CONSTANTS. GLOW_WIDE_W, GLOW_WIDE_ALPHA and GLOW_THIN_ALPHA are shared with
  // the well and every other entity, and retuning one of those is an art pass
  // across the whole build. glowStroke's glow spread is width * GLOW_WIDE_W, so
  // a narrower width here is literally a harder edge.
  //
  // ⛔ THE SEPARATION IS A HEADLESS GATE, in scratchpad/test-cs005-p2.js:
  // DRIFT_CROSS_WIDTH / DRIFT_RIDE_WIDTH >= 2.0 and DRIFT_RIDE_ALPHA <= 0.7.
  // GDD 6.3's rule is an art rule and art rules rot silently; a future retune
  // that collapses the two reads into one turns the suite red instead.
  DRIFT_RIDE_WIDTH:     0.70,   // ⛔ x laneLineWidth while riding — tight, hard-edged
  DRIFT_CROSS_WIDTH:    1.60,   // ⛔ …and while crossing — bloomed open
  DRIFT_RIDE_ALPHA:     0.55,   // ⛔ the dim half of the read. Crossing is 1.0

  // ---- Surger (GDD 6.1, 6.3, 4.5 item 3) ----------------------------------
  // The cycle, and it is meant to be readable as a THREAT THAT ANNOUNCES
  // ITSELF: it climbs, the lane arms from the throat upward, and then the whole
  // lane is live for a moment. ⛔ SURGE_TELEGRAPH (0.45 s) is the fuse and it
  // lives in the shared Enemies group above, where CS001 put it — it is not
  // re-declared here.
  //
  // ⛔ SURGE_DISCHARGE MUST STAY STRICTLY BELOW RESPAWN_INVULN (1.5 s), and the
  // relationship is an INVARIANT rather than a coincidence. During the
  // discharge the Surger's killDepth is 0, so GDD 4.4's rim push — which only
  // ever LOWERS an enemy's depth, to RESPAWN_PUSH_DEPTH — cannot protect a
  // respawning player from it: 0.55 is still above 0. The invulnerability
  // window is the ONLY thing standing between a respawn and a discharge that
  // was already running, so a discharge that outlasted it would kill the player
  // on the step the blink stopped, in the lane they had no way to leave.
  // scratchpad/test-cs005-p3.js asserts it from these two constants, and
  // CS007's heat curve is exactly what would break it.
  //
  // ⛔ SURGE_INTERVAL IS THE LEVEL-1 BASE AND surgeInterval() IS ITS ONE READER
  // (CS007 P2), the same standing WEAVER_APEX has: this is a level-1 value, not
  // rule.
  //
  // ⛔ DEPTH RISES IN THE CLIMB PHASE ONLY — the Drifter's DRIFT_CLIMB is the
  // one that runs in every phase, and it says so. So the honest throat→rim time
  // is not 1 / SURGE_CLIMB: the climb owns SURGE_INTERVAL out of every
  // SURGE_INTERVAL + SURGE_TELEGRAPH + SURGE_DISCHARGE (2.60 of 3.35 s), which
  // makes it ≈ 8.6 s rather than 6.7 s. The pause IS part of the read — the bar
  // stops moving at the instant its lane starts arming.
  //
  // ⛔ SURGER_SIZE IS A LANE WIDTH, like CARRIER_SIZE, WEAVER_SIZE and
  // DRIFTER_SIZE: entityPoints() scales a poly's `l` by size/2 and its `d` by
  // C.ENEMY_DEPTH_SCALE alone.
  //
  // ⛔ SURGE_LIT_WIDTH IS A PER-ENTITY MULTIPLIER ON laneLineWidth() and never a
  // global glow constant, the same rule DRIFT_RIDE_WIDTH carries: GLOW_WIDE_W,
  // GLOW_WIDE_ALPHA and GLOW_THIN_ALPHA are shared with the well and every
  // other entity. It applies to the DISCHARGE only — the fuse creeps up at
  // plain lane weight and the live lane slams to 2.20x, which is what makes the
  // moment the fuse reaches the rim a step the player can see rather than a
  // number they have to have counted.
  SURGER_SIZE:          0.85,   // lane widths spanned by the zigzag bar
  SURGE_CLIMB:          0.15,   // depth/s, ⛔ in the CLIMB phase only. See above
  SURGE_INTERVAL:       2.60,   // s of climb between discharges. ⛔ level-1 base
  // ⛔ 1.40, AND FLOORING IT MAKES THE SURGER SLOWER TO THE RIM, NOT FASTER.
  // Depth rises in the climb phase only, so the honest throat→rim time is
  // (1 / climb) * cycle / interval and a shorter interval spends a larger share
  // of the cycle not climbing. MEASURED (PLANNED-FEATURES-CS007.md §5.1): the
  // break-even climb multiplier at a 1.40 floor is x1.164 and CLIMB_MULT_MAX is
  // 1.40, so the shipped pair leaves throat→rim at 8.59 s → 7.31 s while lethal
  // duty rises 9.0 % → 14.0 %. ⛔ The floor buys LANE DENIAL, not approach speed.
  SURGE_INTERVAL_MIN:   1.40,   // ⛔ its floor at HEAT_FULL_LEVEL
  SURGE_DISCHARGE:      0.30,   // s the whole lane is live. ⛔ must stay < RESPAWN_INVULN
  SURGE_LIT_WIDTH:      2.20,   // ⛔ x laneLineWidth for the LIVE lane (not the fuse)

  // ---- Spawner / well lifecycle (GDD 2, 6.3, 12) --------------------------
  // ⛔ SPAWN_INTERVAL is what state.spawn.timer counts UP toward, and
  // SPAWN_QUOTA is what state.spawn.remaining starts at — the quota is spent
  // downward because it is a COUNT of things, not a clock (GDD 16.3 governs
  // timers). A well is clear when the quota is spent AND nothing that blocks
  // the clear is left alive; "no enemies alive" alone is true one tick after
  // startGame() and in every gap between spawns.
  //
  // ENEMY_CONCURRENT is the difficulty knob and CS007's heat curve is what
  // will raise it. ⛔ It is read as min(ENEMY_CONCURRENT, ENEMY_CAP): ENEMY_CAP
  // above is a READABILITY ceiling and never a difficulty knob, so the two are
  // not interchangeable and the cap is not the thing to raise when a level
  // should feel busier.
  //
  // ⛔ AND THE TWO NUMBERS COUNT DIFFERENT THINGS (CS007 P1, Paul's call —
  // DECISIONS.md, "the spawner-stall call"). This comment used to say the
  // spawner reads state.enemies.length; it does not any more.
  //   ENEMY_CONCURRENT — a budget on THREATS. updateSpawner() counts entities
  //     where `blocksClear && !dead` (threatCount, 08-spawner.js) against
  //     min(ENEMY_CONCURRENT, ENEMY_CAP), so it bounds how much the player has
  //     to answer, not how much is drawn.
  //   ENEMY_CAP — a ceiling on ENTITIES. spawnEnemy() still refuses on raw
  //     state.enemies.length, Thorns and bolts included, because a Thorn is
  //     drawn and a readability ceiling counts everything on screen.
  // ⛔ Before the split both read the same count and a standing Thorn held a
  // release slot forever — three of them shut a well permanently.
  //
  // SPAWN_LANE_TRIES bounds the deterministic redraws 08-spawner.js spends
  // looking for a lane that is not already occupied near the throat. Bounded
  // because the draws come from the run's ONE stream: an unbounded retry loop
  // would spend a different number of draws depending on the board and
  // desynchronize every later draw in the run.
  SPAWN_INTERVAL:       1.60,   // s between spawns. ⛔ counted UP toward. Level-1 base
  SPAWN_INTERVAL_MIN:   0.70,   // ⛔ its floor at HEAT_FULL_LEVEL
  SPAWN_QUOTA:          10,     // enemies released per well
  ENEMY_CONCURRENT:     3,      // ⛔ alive at once — the difficulty knob. Level-1 base
  // ⛔ THE KNOB THAT ACTUALLY CHANGES A WELL, and the ladder is meant to be
  // NAMEABLE by a player watching it (GDD 1.1 P3). enemyConcurrent() floors a
  // continuous interpolation, so it steps: 3 at levels 1-5, 4 from 6, 5 from
  // 16, 6 from 40, 7 from 70, 8 at 99. ⛔ Still under min(..., ENEMY_CAP), and
  // MEASURED: mean live enemies never exceeded 3.85 even at a concurrency of 16
  // with a firing player, so ENEMY_CAP 16 is nowhere near binding and is not
  // the thing to raise when a level should feel busier.
  ENEMY_CONCURRENT_MAX: 8,      // ⛔ its ceiling at HEAT_FULL_LEVEL
  SPAWN_LANE_TRIES:     4,      // deterministic lane redraws before settling

  // ⛔ GDD 8.1's INTRODUCTION SCHEDULE — which kinds the interval spawner may
  // release, as a function of state.level and NOTHING ELSE (eligibleKinds() and
  // pickSpawnKind(), 08-spawner.js). CS007 P3. It replaces CS004's ⚠ TEMPORARY
  // bench list, which answered the same question with a hand-edited array of
  // kind names — deleted with its reader, exactly as CS003 P2's between-wells
  // hold was deleted when the Dive replaced it. ⛔ NEITHER DELETED NAME IS
  // WRITTEN ANYWHERE IN THIS BUILD, not even in a comment: a placeholder that
  // outlives its replacement is what this file is worst at, and test-cs003-p2.js
  // and test-cs007-p3.js both scan the built file for the name. ⛔ The seven
  // debug spawn keys in 23-main.js answer a DIFFERENT question ("put one on
  // screen so I can look at it"), so they are not TEMPORARY and they stay.
  //
  // ⛔ DATA, and these levels are difficulty numbers — GDD 1.1 P3, "escalation
  // you can name": every new KIND of threat arrives at a specific, learnable
  // level. ⛔ CUMULATIVE AND SORTED: a row is eligible from its level onward, so
  // the set only ever GROWS, and the first row's level must be 1 because
  // state.level starts there and an empty set has nothing to spawn.
  //
  // ⛔ `thorn` AND `weaverBolt` ARE NEVER ELIGIBLE and their absence here is the
  // whole mechanism. Both enter through Weaver.layThorn() and Weaver.fire(),
  // which call spawnEnemy() directly (08-spawner.js); a row for either would put
  // one in the throat with no parent — a Thorn nobody grew, a bolt nobody fired.
  //
  // ⛔ NO CARGO WEIGHT TABLE, AND THAT IS A DECISION RATHER THAN A GAP (Paul,
  // 2026-08-31 — DECISIONS.md; PLANNED-FEATURES-CS007.md 5.3). GDD 8's row
  // "Carrier cargo weights shift toward Drifter/Surger" is delivered by
  // ARITHMETIC ALONE: the three Carrier variants are three rows below, so the
  // cargo split WITHIN Carriers is 100% Vaulter at levels 3-17, 50/50 at 18-22
  // and 33/33/33 from 23, and the Carrier share of the whole set falls from 1/2
  // to 3/7. ⛔ The kind pick stays a UNIFORM rngPick over the eligible set, which
  // is what keeps "one draw when there is a choice, none when there is not" true
  // without a second mechanism. ⛔ Do not add weights; do not add a second draw.
  //
  // ⛔ TWO OF GDD 8.1's ROWS ARE NOT ENTRIES HERE, BECAUSE THEY WERE ALREADY
  // TRUE. Rows 1 and 2 ("Vaulters, non-vaulting" then "Vaulting") are
  // VAULT_FIRST_LEVEL 2 above; row 8 ("First open well") is nextWell()'s modulo
  // mapping, which puts WELLS[7] — Vee, closed: false — at level 8. MEASURED,
  // CS007 planning. The schedule DOCUMENTS both and implements neither, and
  // ⛔ nothing in CS007 touched well selection.
  SPAWN_SCHEDULE: [
    { level:  1, kind: "vaulter" },
    { level:  3, kind: "carrierVaulter" },
    { level:  5, kind: "weaver" },
    { level:  9, kind: "drifter" },
    { level: 13, kind: "surger" },
    { level: 18, kind: "carrierDrifter" },
    { level: 23, kind: "carrierSurger" },
  ],

  // ---- Collision (GDD 4.5) ------------------------------------------------
  // The band below the rim in which an enemy's contact kills (GDD 4.5 item 1).
  // Read as `killDepth = 1 - RIM_CONTACT_DEPTH` by every enemy that kills by
  // reaching the rim.
  RIM_CONTACT_DEPTH:    0.05,
  // ⛔ The whole hit test, and it is 1-D (09-collision.js): a lane match within
  // HIT_LANE_TOL plus a depth overlap within HIT_DEPTH_TOL. No pixels, ever.
  // HIT_LANE_TOL is HALF A LANE either side, so a shot fired from a lane centre
  // covers exactly its own lane and nothing of its neighbours' — widening it
  // past 0.5 makes adjacent lanes bleed into each other and the well stops
  // being a set of discrete choices, which is GDD 1.1 P1.
  // ⛔ HIT_DEPTH_TOL must stay above (1 / SHOT_TIME) * FIXED_DT / 2 (~0.016) or
  // a shot steps clean over an enemy between two frames. See 09-collision.js.
  HIT_LANE_TOL:         0.50,   // lane units, either side
  HIT_DEPTH_TOL:        0.05,   // depth units, shot <-> enemy overlap

  // ---- Difficulty (GDD 8) — one clock: game.level -------------------------
  // The four shape constants of heat() itself, unchanged since CS001. ⛔ heat(1)
  // is EXACTLY 0, which is load-bearing: every derived value below is therefore
  // its own level-1 base at level 1, and eighteen of the suite's test files —
  // every one that never leaves level 1 — are provably unreachable by the clock.
  HEAT_BASE:            0.00,
  HEAT_RISE:            1.00,
  HEAT_KNEE:            6.0,    // larger = slower early ramp
  HEAT_LINEAR:          0.020,
  // ⛔ THE LEVEL PAST WHICH THE GAME STOPS GETTING HARDER (H3, Paul's call,
  // 2026-08-31). Form A endpoint interpolation reads every derived value as
  // base + (clamp - base) * min(heat(level) / heat(HEAT_FULL_LEVEL), 1), so
  // this one number and the per-row clamps ARE the curve — no row needs a rate
  // constant of its own and every row saturates at the same level.
  //
  // ⛔ AND THAT IS WHY THERE IS NO HEAT_HOLD_LEVEL. All seven derived rows are
  // clamped, so heat past a row's saturation changes nothing in the build and a
  // hold would be inert by construction; heat() itself never plateaus, which is
  // what keeps GDD 17 item 7's heat(n+1) > heat(n) literally true over 1..200.
  // ⛔ A hold, if one is ever needed, belongs in the CALLER and never in heat().
  HEAT_FULL_LEVEL:      99,     // ⛔ GDD 8.2's "99 is a legend"
  // ⛔ THE RESPAWN GUARANTEE'S TWO NUMBERS (GDD 4.4; H1, Paul's call).
  // CLIMB_MULT_MAX is a HARD CAP chosen so RESPAWN_PUSH_DEPTH 0.55 holds at
  // every level with no derived push: a Vaulter's terminal throat→rim is
  // 3.97 s against 5.56 s at level 1, and the climb from 0.55 to its kill band
  // takes 1.587 s against a RESPAWN_INVULN of 1.500 — a margin of +0.087 s.
  // ⛔ 1.4815 is the breach. Do not raise this without re-deriving the property
  // in test-cs007-p2.js, which asserts it over levels 1..200.
  //
  // ⛔ CLIMB_MAX_BASE IS THE FASTEST CONTACT-KILLING CLIMB ON THE ROSTER, NAMED
  // ONCE. It equals VAULT_CLIMB today and is a separate constant on purpose:
  // an assertion that named VAULT_CLIMB would go on passing the day an entity
  // faster than a Vaulter shipped, and the guarantee would be gone silently.
  // ⛔ It is NOT WEAVER_BOLT_SPEED's 0.32, which is faster and does carry a rim
  // killDepth: pushed to 0.55 a bolt reaches that band at 1.250 s, inside the
  // window, and is safe by SELF-TERMINATION instead — WeaverBolt.update() kills
  // it on the step after depth >= 1, at 1.406 s + one step, still inside. That
  // is also why the bolt is not heat-scaled: a FASTER bolt is safer and a
  // slower one would breach.
  CLIMB_MULT_MAX:       1.40,   // ⛔ ceiling on climbMult() at HEAT_FULL_LEVEL
  CLIMB_MAX_BASE:       0.18,   // ⛔ = VAULT_CLIMB. The guarantee's binding rate

  // ---- Controls (GDD 9) ---------------------------------------------------
  MOUSE_SENS:           0.022,  // lane-units per px. ⛔ no acceleration curve.
  POINTER_LOCK_OFFER:   true,   // ⛔ OFFERED on click, never forced. GDD 9.1.
  KEY_TAP_MS:           130,    // release inside this = exactly one lane
  KEY_SPEED_MIN:        4.0,    // lane-units/sec at hold start
  KEY_SPEED_MAX:        14.0,   // lane-units/sec at full ramp
  KEY_RAMP:             0.35,   // s to reach KEY_SPEED_MAX
  TOUCH_SENS:           0.030,
  TOUCH_ZONE_FRAC:      0.40,   // bottom fraction of screen = rotation zone
  TOUCH_AUTOFIRE:       true,   // ⛔ coupled to the Jump button. GDD 9.3/14.2.
  TOUCH_BUTTON_R:       56,     // px radius, Purge (top-right) and Jump (bottom-right)
  INPUT_MIRROR:         false,  // mirrors touch button corners for left-handed play
  GAMEPAD_DEADZONE:     0.15,   // stick units; below this, zero
  GAMEPAD_SENS:         12.0,   // lane-units/sec at full stick deflection

  // ---- Audio (GDD 11) -----------------------------------------------------
  MUSIC_LOOKAHEAD:      0.20,   // s. ⛔ per-frame; never setTimeout/setInterval.
  MUSIC_CROSSFADE:      0.60,   // s track-to-track
  MUSIC_FADE_OUT:       1.00,   // s to silence at game over
  MUSIC_DUCK_GAIN:      0.50,   // menu-open level
  MUSIC_DUCK_RAMP:      0.15,   // s. ⛔ ramp, never a bare .value set.
  LAYER_THRESHOLD:      { 2: 0.30, 3: 0.55, 4: 0.80 }, // ⛔ tier must be 1..4
  LAYER_CROSSFADE:      1.20,   // s thicken/thin ramp
  FILTER_MIN_HZ:        600,    // music bus low-pass at intensity 0
  FILTER_MAX_HZ:        18000,  // ... and at intensity 1
  INT_ATTACK:           0.40,   // s — danger registers fast
  INT_RELEASE:          2.50,   // s — relief is earned. ⛔ asymmetric.
  INT_W_COUNT:          0.30,
  INT_W_PROXIMITY:      0.30,
  INT_W_COMBO:          0.15,
  INT_W_PERIL:          0.15,
  INT_W_HEAT:           0.10,
  INT_EXPECTED_ENEMIES: 10,
  INT_COMBO_MAX:        8,
  INT_HEAT_MAX:         2.0,

  // ---- Overdrive (GDD 14) -------------------------------------------------
  MAX_TOKENS:           2,      // ⛔ readability cap on powerups on screen
  TOKEN_LIFE:           9.0,    // s. ⛔ counts UP toward this. GDD 16.3.
  TOKEN_HOVER_DEPTH:    0.80,
  JUMP_TIME:            0.90,
  JUMP_RECOVERY:        0.20,
  JUMP_COOLDOWN:        1.40,
  COMBO_WINDOW:         2.50,   // s
  COMBO_MAX:            8,

  // ---- Scoring (GDD 7) ----------------------------------------------------
  PTS_THORN:            5,
  PTS_WEAVER:           50,
  PTS_CARRIER:          100,
  PTS_VAULTER:          150,
  PTS_SURGER:           200,
  PTS_DRIFTER:          [250, 500, 750],  // by depth band
  PTS_REAVER:           300,
  PTS_MIMIC:            400,
  PTS_WARDEN:           500,
  PTS_WELL_PER_LEVEL:   100,
  PTS_NO_DEATH_WELL:    1000,

  // ---- Presentation (GDD 10, 12) ------------------------------------------
  HIT_STOP_DEATH:       1.20,   // s
  READABILITY_DEPTH:    0.25,   // ⛔ nothing opaque drawn below this depth
  ATTRACT_IDLE:         20,     // s before attract mode

  // ---- Well rendering (GDD 3.6, 3.7, 10.2) --------------------------------
  // Band palette. shapeIndex = (level-1) mod 16 picks the well; the BAND below
  // picks colour from level directly. Ember carries its own alpha (GDD 3.6);
  // everything else draws at LINE_ALPHA_RIM/THROAT below.
  BAND_COLORS: [
    { hi: 16, color: "#3FE0FF" },   // Cyan
    { hi: 32, color: "#FF4FD8" },   // Magenta
    { hi: 48, color: "#FFB020" },   // Amber
    { hi: 64, color: "#9B6BFF" },   // Violet
    { hi: 80, color: "#FF5A3C" },   // Ember — GDD 3.7 dim band, @ DIM_BAND_ALPHA
    { hi: 96, color: "#4FFF7A" },   // Green
    { hi: 99, color: "#FFFFFF" },   // White
  ],
  BAND_RNG_COLORS: ["#3FE0FF", "#FF4FD8", "#FFB020", "#9B6BFF", "#4FFF7A", "#FFFFFF"], // past 99, GDD 3.6
  // ⛔ GDD 3.6's boundary and NOT A TUNING TARGET. It is where the band table
  // stops having a row: BAND_COLORS' last entry is `hi: 99`, so level 100 is
  // the first level with no band of its own and the first that draws its
  // colour and its shape from the run's stream (nextWell, 23-main.js).
  // Lowering it would not make the game harder, it would delete shipped bands.
  BAND_RNG_LEVEL:       99,
  DIM_BAND_LO:          65,     // ⚠ SETTLED — GDD 3.7, do not tune
  DIM_BAND_HI:          80,     // ⚠ SETTLED — GDD 3.7, do not tune
  LANE_LIT_ALPHA:       0.9,    // occupied / shot-travel / Surger-charge lane
  // ⛔ THE SIZE OF buildLaneState()'s ONE PREALLOCATED ARRAY (23-main.js), and
  // it is the widest well in WELLS, not a tuning target. GDD 17's perf budget
  // forbids per-frame allocation in the hot path, so the producer owns a single
  // module-level array it clears and refills; this is how long it is. A well
  // wider than this would silently lose lighting on its extra lanes, which is
  // why test-cs006-p4.js asserts no well exceeds it.
  LANE_LIT_MAX_LANES:   16,
  LINE_W_THROAT:        1.0,    // px, depth 0 — GDD 10.1, thinner far away
  LINE_W_RIM:           3.0,    // px, depth 1 — thicker near the player
  GLOW_WIDE_W:          6.0,    // px, outer glow pass width multiplier base
  GLOW_WIDE_ALPHA:      0.20,
  GLOW_THIN_ALPHA:      0.95,

  // ---- Telemetry (GDD 15.6) -----------------------------------------------
  // ⛔ THE RING IS IN MEMORY AND NOTHING IS PERSISTED THIS CHANGESET.
  // kit-storage owns the keyspace and Profiles.keyFor(base) is the one route to
  // a key (CLAUDE.md, Save data); 22-meta.js is still a placeholder, so there is
  // no keyspace and no Profiles in the build. Writing telemetry anywhere today
  // would mean the game choosing a raw localStorage key name, which is
  // forbidden outright. CS011 owns persistence, the profile scope and read()'s
  // envelope-version rejection.
  TELEMETRY_CAP:        4096,   // rows. ⛔ the ring DROPS the oldest and latches
                                // `wrapped`; a total read off a wrapped buffer
                                // is wrong, so the export says so in its header.
  TELEMETRY_INTERVAL:   0.50,   // s of SIMULATION time between samples (never
                                // wall clock). 4096 rows is ~34 min of a run.
  // ⛔ FOUR COLUMNS THAT SHIP NOW WITH KNOWN-CONSTANT VALUES, and that is GDD
  // 15.6's rule rather than laziness: a column added later invalidates every
  // log recorded before it, so the ones whose SOURCE is scheduled get their
  // place in the order now and their source later. `score` and `maxCombo` land
  // with addScore() (CS008) and GDD 14.4's combo; `mode` and `startDepth` with
  // GDD 13's mode select and GDD 4.6's Start Depth. ⛔ Each key is DELETED from
  // here by the changeset that gives that column a real source.
  TELEMETRY_PLACEHOLDER: { score: 0, maxCombo: 0, mode: "classic", startDepth: 1 },

  // ---- Build / debug ------------------------------------------------------
  GAME_VERSION:         "0.0.4",   // ⚠ 0.0.2 was never written here — see log/CS006.md
  GAME_ID:              "vector-vortex",   // must match the Worker registry
};

// ---------------------------------------------------------------------------
// THE HEAT CLOCK (GDD 8) — ⛔ ONE CLOCK: state.level
// ---------------------------------------------------------------------------
//
// ⛔ THE ONLY FUNCTIONS IN THIS FILE, AND THEY ARE HERE BECAUSE THEY ARE THE
// TUNING SURFACE'S OTHER HALF. C above says what a value is at level 1 and what
// it is at the top; the seven accessors below say how the game walks between
// the two. Splitting them would put half of one decision in each of two files.
//
// ⛔ NO CALL SITE COMPUTES HEAT INLINE AND NO ENTITY READS A HEAT-DERIVED BASE
// CONSTANT DIRECTLY. Every derived value is exactly one function; the entity
// reads the function. That is what makes the clamp enforceable in ONE place and
// testable as a property over levels 1..200 rather than as a spot check —
// test-cs007-p2.js asserts it off the BUILT file, so a future session that
// writes a bare climb constant into an entity turns the suite red instead of
// quietly escaping the clamp. The five climb rates are the one shape that
// differs: they
// keep their own constants and are multiplied by climbMult(), because GDD 8
// says "climb speed", singular, and ONE multiplier is what keeps the respawn
// guarantee (GDD 4.4) a single arithmetic statement.
//
// ⛔ WHAT HEAT DOES NOT SCALE, AND IT IS A LIST, NOT AN OVERSIGHT (H2):
//   VAULT_HOP_TIME, DRIFT_CROSS_TIME, DRIFT_RIDE_TIME — heat scales intervals,
//     climb rates and the Weaver's apex, and NEVER a hop or crossing duration.
//     Three closed soaks derive per-tick lane bounds from those three numbers.
//   WEAVER_BOLT_SPEED, WEAVER_RETREAT — a bolt is ordnance, not a climb, and a
//     retreat is a departure. Neither is in GDD 8's list. Scaling the bolt
//     would shrink the Weaver's warning window twice over, once through the
//     apex and once through the speed, and see CLIMB_MAX_BASE above for why a
//     SLOWER bolt would breach the respawn guarantee.
//   SURGE_DISCHARGE — GDD 8 lists surge FREQUENCY, which is SURGE_INTERVAL.
//     The discharge window must stay strictly below RESPAWN_INVULN.
//   ENEMY_CAP — a readability ceiling (GDD 8), never a difficulty knob.
//   RESPAWN_PUSH_DEPTH — see CLIMB_MULT_MAX above. The guarantee is held by a
//     hard cap on the climb, so the push is a constant at every level.

// GDD 8's formula, verbatim, from the four constants above. ⛔ heat(1) === 0
// exactly, and ⛔ it NEVER PLATEAUS — GDD 17 item 7 asserts heat(n+1) > heat(n)
// over 1..200 and a hold inside here would fail it at n = HEAT_FULL_LEVEL.
function heat(level) {
  const t = level - 1;
  return C.HEAT_BASE
       + C.HEAT_RISE * (1 - Math.exp(-t / C.HEAT_KNEE))
       + C.HEAT_LINEAR * t;
}

// ⛔ FORM A — ENDPOINT INTERPOLATION (H3, Paul's call, 2026-08-31). The clamp
// values ARE the curve: every row is stated as its level-1 base and its
// HEAT_FULL_LEVEL endpoint, so no row carries a rate constant of its own and
// every row saturates together. `min(t, 1)` is the clamp, in one place.
//
// ⛔ THE LEVEL ARGUMENT IS OPTIONAL AND IT IS NOT A SECOND CLOCK. Omitted — the
// shipped call in every entity — it reads state.level, the one clock (GDD 8,
// 02-state.js). It exists so a test or a probe can evaluate the whole curve
// without driving a run to level 200.
function heatT(level) {
  const t = heat(level === undefined ? state.level : level) / heat(C.HEAT_FULL_LEVEL);
  return t > 1 ? 1 : t;
}

function heatLerp(base, clamp, level) {
  return base + (clamp - base) * heatT(level);
}

// ---- The seven derived values, one accessor each (GDD 8) -------------------

// Falls. ⚠ Almost inert on its own — MEASURED, dropping it 1.60 → 0.35 at a
// concurrency of 3 moved spawns in 60 s from 19 to 20. It works WITH the
// concurrency ladder, not against it.
function spawnInterval(level) {
  return heatLerp(C.SPAWN_INTERVAL, C.SPAWN_INTERVAL_MIN, level);
}

// Rises, and ⛔ FLOORED so the ladder is nameable: 3 at levels 1-5, 4 from 6,
// 5 from 16, 6 from 40, 7 from 70, 8 at 99. Still read as
// min(..., C.ENEMY_CAP) by spawnLimit() (08-spawner.js).
function enemyConcurrent(level) {
  return Math.floor(heatLerp(C.ENEMY_CONCURRENT, C.ENEMY_CONCURRENT_MAX, level));
}

// ⛔ ONE MULTIPLIER ON EVERY ENTITY CLIMB — VAULT_CLIMB, CARRIER_CLIMB,
// WEAVER_CLIMB, DRIFT_CLIMB, SURGE_CLIMB. The base is the identity 1: at level
// 1 every climb is exactly the number in C above, which is what makes heat(1)
// = 0's guarantee visible rather than arithmetic. ⛔ Its ceiling is the respawn
// guarantee's — see CLIMB_MULT_MAX above before touching it.
function climbMult(level) {
  return heatLerp(1, C.CLIMB_MULT_MAX, level);
}

// Both fall. The mid-climb cadence and the rim hunt are separate knobs because
// they are separate behaviours (07-enemies.js): one is how often a climbing
// Vaulter changes lane, the other is how hard it hunts once it has arrived.
function vaultInterval(level) {
  return heatLerp(C.VAULT_INTERVAL, C.VAULT_INTERVAL_MIN, level);
}

function vaultRimInterval(level) {
  return heatLerp(C.VAULT_RIM_INTERVAL, C.VAULT_RIM_INTERVAL_MIN, level);
}

// Falls — GDD 8's "surge frequency". See SURGE_INTERVAL_MIN above: this one
// buys lane denial and costs approach speed, and climbMult() pays it back.
function surgeInterval(level) {
  return heatLerp(C.SURGE_INTERVAL, C.SURGE_INTERVAL_MIN, level);
}

// Rises. ⛔ This is GDD 8's "Weaver thorn length" as well as its apex — one
// number, four consequences; see WEAVER_APEX_MAX above.
function weaverApex(level) {
  return heatLerp(C.WEAVER_APEX, C.WEAVER_APEX_MAX, level);
}
