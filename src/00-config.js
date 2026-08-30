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
  SNAP_IDLE_MS:         90,     // idle time before snap assist engages
  SNAP_STRENGTH:        6.0,    // lane-units/sec pull toward lane centre
  WALL_SQUASH_MS:       40,     // open-well end bounce, visual only
  SHOT_MAX:             8,      // ⛔ hard cap on shots in flight
  SHOT_TIME:            0.52,   // s, rim -> throat
  SHOT_COOLDOWN:        0.055,  // s between shots
  THORN_CHIP:           0.08,   // fraction of lane length removed per hit
  PURGE_SAVED_BONUS:    500,
  START_LIVES:          3,
  LIVES_MAX:            6,
  EXTRA_LIFE_FIRST:     20000,
  EXTRA_LIFE_EVERY:     40000,
  RESPAWN_INVULN:       1.5,    // s
  RESPAWN_PUSH_DEPTH:   0.55,   // ⛔ enemies at rim pushed here on respawn

  // ---- Dive (GDD 5) -------------------------------------------------------
  DIVE_TIME:            2.6,    // s, Classic
  DIVE_TIME_OD:         4.0,    // s, Overdrive ring-flight. ⛔ hard cap.
  DIVE_RINGS_MAX:       6,      // ⛔ hard cap.

  // ---- Enemies (GDD 6) ----------------------------------------------------
  SAFE_SPAWN_DEPTH:     0.75,   // never spawn above this in the player's lane
  SURGE_TELEGRAPH:      0.45,   // s of visible fuse before discharge
  ENEMY_CAP:            16,     // ⛔ READABILITY constraint, not difficulty.

  // ---- Difficulty (GDD 8) — one clock: game.level -------------------------
  HEAT_BASE:            0.00,
  HEAT_RISE:            1.00,
  HEAT_KNEE:            6.0,    // larger = slower early ramp
  HEAT_LINEAR:          0.020,

  // ---- Controls (GDD 9) ---------------------------------------------------
  MOUSE_SENS:           0.022,  // lane-units per px. ⛔ no acceleration curve.
  KEY_TAP_MS:           130,    // release inside this = exactly one lane
  KEY_SPEED_MIN:        4.0,    // lane-units/sec at hold start
  KEY_SPEED_MAX:        14.0,   // lane-units/sec at full ramp
  KEY_RAMP:             0.35,   // s to reach KEY_SPEED_MAX
  TOUCH_SENS:           0.030,
  TOUCH_ZONE_FRAC:      0.40,   // bottom fraction of screen = rotation zone
  TOUCH_AUTOFIRE:       true,   // ⛔ coupled to the Jump button. GDD 9.3/14.2.

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

  // ---- Build / debug ------------------------------------------------------
  GAME_VERSION:         "0.0.1",
  GAME_ID:              "vector-vortex",   // must match the Worker registry
};
