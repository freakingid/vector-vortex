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
  THORN_CHIP:           0.08,   // fraction of lane length removed per hit
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
  DIVE_TIME:            2.6,    // s, Classic
  DIVE_TIME_OD:         4.0,    // s, Overdrive ring-flight. ⛔ hard cap.
  DIVE_RINGS_MAX:       6,      // ⛔ hard cap.

  // ---- Enemies (GDD 6) ----------------------------------------------------
  SAFE_SPAWN_DEPTH:     0.75,   // never spawn above this in the player's lane
  SURGE_TELEGRAPH:      0.45,   // s of visible fuse before discharge
  ENEMY_CAP:            16,     // ⛔ READABILITY constraint, not difficulty.
  // ⛔ An entity's drawn depth half-extent, as a fraction of its OWN
  // perspective position — NOT a constant depth offset. perspective() is
  // depth^0.55, so a constant offset spans ~13% of the well at the throat and
  // ~3% at the rim, and an enemy drawn that way SHRINKS as it comes at you.
  // 14-render-entities.js's entityPoints() is the one reader.
  ENEMY_DEPTH_SCALE:    0.10,

  // ---- Vaulter (GDD 6.1, 6.3) ---------------------------------------------
  VAULTER_SIZE:         0.70,   // lane widths spanned by the silhouette
  VAULTER_COLOR:        "#FF4A4A",  // ⚠ placeholder — same standing as SKIMMER_COLOR
  VAULT_CLIMB:          0.18,   // depth/s, throat -> rim ~5.5 s. Level-1 base.
  VAULT_INTERVAL:       2.20,   // s between mid-climb hops
  VAULT_HOP_TIME:       0.28,   // s to cross one lane; hittable in both meanwhile
  VAULT_RIM_INTERVAL:   0.55,   // s between rim hunt hops
  VAULT_FIRST_LEVEL:    2,      // ⛔ GDD 6.3 — no mid-climb vaulting at level 1

  // ---- Spawner / well lifecycle (GDD 2, 6.3, 12) --------------------------
  // ⛔ SPAWN_INTERVAL is what state.spawn.timer counts UP toward, and
  // SPAWN_QUOTA is what state.spawn.remaining starts at — the quota is spent
  // downward because it is a COUNT of things, not a clock (GDD 16.3 governs
  // timers). A well is clear when the quota is spent AND nothing that blocks
  // the clear is left alive; "no enemies alive" alone is true one tick after
  // startGame() and in every gap between spawns.
  //
  // ENEMY_CONCURRENT is the difficulty knob — how many are on screen at once,
  // and CS005's heat curve is what will raise it. ⛔ It is read as
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
  // ⚠ TEMPORARY — the pause between the last kill and the next well. CS005's
  // Dive (GDD 5) replaces it entirely and this constant goes with it.
  WELL_CLEAR_HOLD:      1.00,   // s held on a cleared well before nextWell()

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
