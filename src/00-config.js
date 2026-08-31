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
  VAULT_CLIMB:          0.18,   // depth/s, throat -> rim ~5.5 s. Level-1 base.
  VAULT_INTERVAL:       2.20,   // s between mid-climb hops
  VAULT_HOP_TIME:       0.28,   // s to cross one lane; hittable in both meanwhile
  VAULT_RIM_INTERVAL:   0.55,   // s between rim hunt hops
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
  // ⚠ WEAVER_APEX IS FLAT HERE AND BECOMES HEAT-DERIVED IN CS007. GDD 8's one
  // clock (game.level) is what will decide how far up a Weaver comes, so this
  // number is the level-1 base and not the shape of the rule. Nothing reads it
  // but the Weaver's own cycle, which is what makes that swap a one-line change.
  //
  // ⛔ WEAVER_SIZE and WEAVER_BOLT_SIZE are LANE widths, the same as
  // CARRIER_SIZE above: entityPoints() scales a poly's `l` by size/2 and its
  // `d` by C.ENEMY_DEPTH_SCALE alone, so a silhouette's DEPTH extent is not a
  // function of its size.
  WEAVER_SIZE:          0.62,   // lane widths spanned by the spiral
  WEAVER_CLIMB:         0.22,   // depth/s on the way up
  WEAVER_RETREAT:       0.34,   // depth/s down — leaving is faster than arriving
  WEAVER_APEX:          0.55,   // ⚠ depth it climbs to before turning. CS007 makes this heat-derived
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
  // ⚠ SURGE_INTERVAL IS FLAT HERE AND BECOMES HEAT-DERIVED IN CS007, the same
  // standing WEAVER_APEX has: this is the level-1 base, not the shape of the
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
  SURGE_INTERVAL:       2.60,   // s of climb between discharges. ⚠ CS007 makes this heat-derived
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
  // ENEMY_CONCURRENT is the difficulty knob — how many are on screen at once,
  // and CS007's heat curve is what will raise it. ⛔ It is read as
  // min(ENEMY_CONCURRENT, ENEMY_CAP): ENEMY_CAP above is a READABILITY ceiling
  // and never a difficulty knob, so the two are not interchangeable and the
  // cap is not the thing to raise when a level should feel busier.
  //
  // SPAWN_LANE_TRIES bounds the deterministic redraws 08-spawner.js spends
  // looking for a lane that is not already occupied near the throat. Bounded
  // because the draws come from the run's ONE stream: an unbounded retry loop
  // would spend a different number of draws depending on the board and
  // desynchronize every later draw in the run.
  SPAWN_INTERVAL:       1.60,   // s between spawns. ⛔ counted UP toward.
  SPAWN_QUOTA:          10,     // enemies released per well
  ENEMY_CONCURRENT:     3,      // ⛔ alive at once — the difficulty knob
  SPAWN_LANE_TRIES:     4,      // deterministic lane redraws before settling

  // ⚠ TEMPORARY — what the interval spawner picks a kind from (pickSpawnKind,
  // 08-spawner.js). ⛔ CS003 P2's between-wells hold used to stand above this with
  // the same ⚠ standing and CS006 P3 DELETED it: the Dive (GDD 5, DIVE_GRACE /
  // DIVE_TIME above) is what a cleared well does now, and a placeholder that
  // survives beside its replacement is the thing this file is worst at. It
  // ships as one
  // entry, so the game plays exactly as it did before this list existed;
  // editing it to ["vaulter", "carrier", "weaver"] gives a mixed well with no
  // code change, which is the whole point while GDD 8.1's introduction
  // schedule does not exist yet. ⛔ That schedule DELETES this constant and its
  // reader — it is a bench, not a difficulty knob, and never both.
  //
  // ⛔ NEVER EMPTY, and ⛔ A ONE-ENTRY LIST SPENDS NO RNG DRAW. See
  // pickSpawnKind() for why the second one is load-bearing.
  DEBUG_SPAWN_KINDS:    ["vaulter"],

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
  HEAT_BASE:            0.00,
  HEAT_RISE:            1.00,
  HEAT_KNEE:            6.0,    // larger = slower early ramp
  HEAT_LINEAR:          0.020,

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
  LINE_W_THROAT:        1.0,    // px, depth 0 — GDD 10.1, thinner far away
  LINE_W_RIM:           3.0,    // px, depth 1 — thicker near the player
  GLOW_WIDE_W:          6.0,    // px, outer glow pass width multiplier base
  GLOW_WIDE_ALPHA:      0.20,
  GLOW_THIN_ALPHA:      0.95,

  // ---- Build / debug ------------------------------------------------------
  GAME_VERSION:         "0.0.1",
  GAME_ID:              "vector-vortex",   // must match the Worker registry
};
