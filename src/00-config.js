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

  // ---- The ring flight (GDD 14.5, 5, 7; CS014 P1, RF1–RF4, RF6, RF9) ------
  // ⛔ THE TWO CAPS ABOVE FINALLY HAVE READERS, AND THEY ARE THE ONLY TWO
  // NUMBERS HERE THAT ARE NOT PROVISIONAL. DIVE_TIME_OD is read by diveTime()
  // and DIVE_RINGS_MAX by layRings(), both in 11-dive.js, and both are GDD
  // 14.5's hard scope cap — 4 seconds, 6 rings — rather than a tuning knob.
  // ⛔ DIVE_TIME_OD IS READ EXACTLY AS DIVE_TIME IS: the WHOLE dive, grace
  // included (RF9). DIVE_GRACE is unchanged and is sliced off its front the
  // same way, so an Overdrive descent is 3.65 s against Classic's 2.25 s.
  //
  // ⚠ THE THREE BELOW ARE PROVISIONAL in CS012 O16's sense — owned by a
  // tuning pass, like C.COMBO_KILLS_PER_STEP and the palette. The SHAPE around
  // them is not: six rings, evenly spaced, an arc each, an unmultiplied payout.
  //
  // ⛔ RING_POINTS IS UNMULTIPLIED AND BUILDS NOTHING (RF4, GDD 7): a ring is
  // not a kill and a Dive is not a kill site, so this is the Bounty's row, not
  // an entity price. MEASURED at the plan (§1.6): a median well pays 7,200, so
  // a full set of six is 8.3 % of one — a breath's bonus, near GDD 7's
  // PTS_NO_DEATH_WELL, and not a thing to farm.
  //
  // ⛔ RING_ARC_LANES IS A HALF-WIDTH IN LANES, read through laneDelta — the
  // build's one idea of lane distance, exactly as C.HIT_LANE_TOL is (RF2). An
  // arc therefore spans 2 x this, and a ring is taken by being inside it at the
  // step the descent crosses its depth.
  //
  // ⛔ RING_LANE_STEP IS A FRACTION OF THE WELL, NOT A LANE COUNT, and that is
  // what keeps the skill test the same shape on a 5-lane well and a 16-lane one:
  // the walk asks for the same SHARE of the rim every time. MEASURED off the
  // constants: at 0.25 on the widest well the walk is 4.0 lanes per ring and a
  // ring's near edge is 2.5 lanes away, inside 0.6083 s — 4.1 lane/s against
  // C.KEY_SPEED_MAX 14, so an attentive diver takes every one and an
  // ill-placed one misses. ⛔ The walk goes through laneHop(), the build's ONE
  // wall helper, so it wraps on a closed well and mirror-folds on an open one
  // (GDD 3.5) rather than piling rings on a wall.
  RING_POINTS:          100,    // ⚠ points a taken ring pays, UNMULTIPLIED
  RING_ARC_LANES:       1.5,    // ⚠ half-width of a ring's arc, in lanes
  RING_LANE_STEP:       0.25,   // ⚠ lanes walked between rings, as a fraction of the well

  // ---- The Dive's VISUAL (GDD 5, 10.2, 10.3; CS014 P2, RF7-A) -------------
  // ⛔ BOTH MODES, AND THAT IS RF7's ANSWER. The descent is drawn in Classic
  // and in Overdrive alike, and the rings on top of it in Overdrive. MEASURED
  // at the plan (§1.3, §1.8): a run spends 15.71 % of its steps in a dive —
  // 19.80 % at DIVE_TIME_OD — and before this phase not one render file
  // mentioned the Dive at all, so one frame in six was a still board.
  //
  // ⛔ DRAW-TIME AND NOTHING ELSE. Every value here is read by
  // 14-render-entities.js and by Game.draw(), never by the simulation: with
  // the two alphas at 0 a played session hashes identically, frame for frame,
  // in both modes (test-cs014-p2.js). That is C.JUMP_LIFT-at-0's proof.
  //
  // ⚠ ALL FIVE ARE PROVISIONAL ART, the same standing as the palette. Whether
  // the flight READS as a flight is a hardware judgment the suite cannot make
  // and is a skipped playtest (SKIPPED-PLAYTESTS.md, CS014 P2).
  //
  // ⛔ THE DESCENT IS THE WELL TRAVELLING, AND drawWell() IS UNTOUCHED. Its
  // rim ring, throat ring and spokes are the frame the flight happens in;
  // what moves is DIVE_RUNGS cross-sections of the well, laid at the midpoints
  // of as many equal slices — layRings()' own lattice — and sweeping rim-ward
  // past the craft as dive.depth falls, each leaving at the rim on the step
  // the descent reaches its own depth. ⛔ So the renderer needs no camera and
  // no second projection: diveDrawDepth() is the whole of it.
  DIVE_RUNGS:           10,     // ⚠ cross-sections of the well in flight at once
  DIVE_RUNG_ALPHA:      0.40,   // ⚠ a rung's peak alpha. ⛔ 0 draws no descent
  // ⛔ A RING IS DRAWN WHERE A TOKEN IS — above the well, below the enemies
  // (GDD 1.1 P2; CS013 T4) — and as an ARC across 2 x RING_ARC_LANES, the same
  // half-width takeRings() reads, so what is drawn is exactly what is taken.
  // ⛔ An UNRESOLVED ring only: `taken` goes null -> true/false once and for
  // good, and a resolved one has already passed the craft.
  RING_ARC_SEG:         16,     // polyline segments across a ring's arc
  RING_ALPHA:           0.90,   // ⚠ a ring's alpha above READABILITY_DEPTH. ⛔ 0 draws no ring
  // ⚠ Hue 165°, aquamarine, and it reaches for no other constant (STATUS.md):
  // clear of every band colour (12°, 39°, 140°, 195°, 258°, 313°) and of the
  // only entity a dive can hold, the Thorn's 254° — and of TOKEN_COLOR's warm
  // 56°, the eight enemy colours, WARDEN_COLOR's 222° and MIMIC_COLOR's 287°.
  RING_COLOR:           "#4AFFD1",  // ⚠ provisional, the same standing as the palette

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

  // ---- Reaver (GDD 6.4, 14.6; CS012 P2) — Overdrive only ------------------
  // A Vaulter at 1.6x that vaults toward the Skimmer (07-enemies-overdrive.js).
  // ⛔ THE RATE SCALES THE HOP AND NOTHING ELSE (Paul's O1): the hop duration
  // and both hop intervals are divided by it, and the climb stays the Vaulter's
  // `C.VAULT_CLIMB * climbMult()`. MEASURED (PLANNED-FEATURES-CS012.md §1.1): a
  // CLIMB at 1.6x breaches GDD 4.4's respawn guarantee at level 1, so
  // CLIMB_MAX_BASE and CLIMB_MULT_MAX do not move. The hop is 0.175 s, and the
  // rim interval's floor 0.35 / 1.6 = 0.219 s stays above it, so the knob stays
  // live at every level. ⛔ Heat never scales the hop (H2): the rate is a
  // constant, and GDD 17 item 3's soak bound is 2 * DT / (VAULT_HOP_TIME / rate).
  REAVER_HOP_RATE:      1.6,
  // ⚠ PROVISIONAL, like the palette (O16). The family read is the Vaulter's X at
  // the Vaulter's size; the difference is two swept barbs on the rim-side arms
  // (REAVER_POLY, 14-render-entities.js). Each barb's tip sits BARB_SWEEP lane
  // half-widths in from its arm tip and BARB_REACH depth units rimward of it; its
  // root sits BARB_ROOT of the way along the arm's inner edge.
  REAVER_SIZE:          0.70,   // lane widths spanned, = VAULTER_SIZE
  REAVER_BARB_SWEEP:    0.30,
  REAVER_BARB_REACH:    0.35,
  REAVER_BARB_ROOT:     0.35,
  REAVER_COLOR:         "#FF4A4A",  // ⚠ = VAULTER_COLOR, shared (O16); the silhouette carries the difference

  // ---- Warden (GDD 6.4, 14.6; CS013 P3) — Overdrive only ------------------
  // "Flies above the well, fires down, killable only by Jump" (GDD 14.6), and
  // W1's answer to how that is represented: ⛔ ALOFT IS A PHASE, NOT A DEPTH.
  // It climbs its lane from the throat unshootable, goes ALOFT at depth 1 — the
  // rim's own depth, the only legal one it has — and hunts along the rim from
  // there, striking its own lane on its own clock (07-enemies-overdrive.js).
  //
  // ⛔ THE CLIMB IS THE ONLY THING HEAT TOUCHES (R6, R7). `WARDEN_CLIMB *
  // climbMult()` is climbMult()'s sixth call site (test-cs007-p2.js); every
  // cycle constant below is FLAT, and there is no eighth heat accessor. ⛔ And
  // the hop duration is flat for H2's reason: GDD 17 item 3's soak bound is
  // 2 * DT / WARDEN_HOP_TIME, and a heat-scaled hop would need re-deriving at
  // every level.
  //
  // ⛔ ITS CLIMB IS NOT A CONTACT CLIMB, so it does not bind GDD 4.4's respawn
  // guarantee and C.CLIMB_MAX_BASE does not move (R6): `killDepth` is null the
  // whole way up, so it passes the rim band harmlessly. The guarantee still
  // REACHES it — `anchored` is false, so respawnSkimmer() clamps it to 0.55 and
  // a lift-off ends — and the arithmetic is the other way round from a
  // climber's: a pushed Warden re-climbs in >= 1.79 s at L99 and then needs
  // WARDEN_ARM + WARDEN_TELEGRAPH more, so its first discharge lands >= 2.84 s
  // after the respawn, past C.RESPAWN_INVULN even without the invariant below.
  WARDEN_CLIMB:         0.18,   // depth/s, throat -> ALOFT ~4.89 s at L11. ⚠ level-1 base
  // -- the hunt, aloft (W3) — one hop toward the craft every INTERVAL --
  WARDEN_HOP_INTERVAL:  0.90,   // s between hunt hops ⚠. ⛔ flat (R7)
  WARDEN_HOP_TIME:      0.35,   // s to cross one lane ⚠. ⛔ flat (H2)
  // -- the strike (W3): hover -> telegraph -> discharge, forever --
  // ⛔ WARDEN_HOVER + WARDEN_TELEGRAPH + WARDEN_DISCHARGE = 2.35 s against the
  // Jump's 2.30 s cycle (C.JUMP_TIME + C.JUMP_COOLDOWN): one strike per jump,
  // which is what makes "killable only by Jump" a rhythm rather than a wait.
  // ⛔ WARDEN_ARM is the FIRST hover after EVERY lift-off, the re-climb after a
  // respawn push included — a Warden that has just arrived over the rim is not
  // about to fire, and that beat is GDD 1.1 P2's "legible before lethal".
  WARDEN_ARM:           0.60,   // s from lift-off to the first fuse ⚠
  WARDEN_HOVER:         1.60,   // s between strikes ⚠
  WARDEN_TELEGRAPH:     0.45,   // s of visible fuse ⚠ — the Surger's benchmark
  // ⛔ WARDEN_DISCHARGE MUST STAY STRICTLY BELOW RESPAWN_INVULN (1.5 s), and it
  // is the Surger's invariant for the Surger's reason (GDD 6.1, 4.4): a strike
  // already running when the player respawns is survived by the invulnerability
  // window and by nothing else. ⛔ asserted from the constants (test-cs013-p3.js).
  WARDEN_DISCHARGE:     0.30,   // s the rim of its lane is lethal
  // -- the look (W6) — ⚠ provisional, the same standing as the palette (O16) --
  // ⛔ WARDEN_LIFT IS DRAW-TIME ONLY, exactly as C.JUMP_LIFT is (GDD 14.2): the
  // silhouette is pushed out from the well's screen centroid, `lane` and the
  // depth model are untouched, and at 0 the state hash does not move. 0.06 rim
  // radii is 18 px — MEASURED over 233 lane centres, nothing leaves the world,
  // and the craft rising to its own 0.12 apex passes through this height.
  WARDEN_LIFT:          0.06,   // rim radii out from the well's centroid
  WARDEN_SIZE:          0.80,   // lane widths spanned by the silhouette
  // ⛔ A PER-ENTITY MULTIPLIER ON laneLineWidth() and never a global glow
  // constant, the Surger's C.SURGE_LIT_WIDTH rule: the beam creeps down at
  // plain lane weight while the fuse runs and SLAMS to this when the rim goes
  // live, so the width jump is what says which instant it was.
  WARDEN_BEAM_WIDTH:    2.20,   // ⚠ x laneLineWidth for the LIVE beam
  // The centre of the widest gap in the palette (189.7° -> 255.1°, 65°),
  // hue 222°, and clear of C.TOKEN_COLOR's warm 56° (O16, T10).
  WARDEN_COLOR:         "#477EFF",  // ⚠ provisional, the same standing as the palette

  // ---- Mimic (GDD 6.4, 14.6; CS013 P4) — Overdrive only, ON PROBATION -----
  // "Reflects shots; vulnerable only while firing" (GDD 14.6), and MI1's answer
  // to what that cycle is: ⛔ REFLECT-THEN-OPEN. Closed it is guarding — a shot
  // is consumed and SENT BACK ONCE as a MimicShot — and that reflection OPENS
  // it for MIMIC_OPEN_TIME, which is "firing" and is the window a second shot
  // kills it in (07-enemies-overdrive.js).
  //
  // ⚠ ON PROBATION (GDD 14.6, 19, 21 #6): the verdict is CS017's, and
  // ⛔ ONE SCHEDULE ROW IS THE WHOLE CUT (MI3) — remove
  // `{ level: 16, kind: "mimic" }` from SPAWN_SCHEDULE_OVERDRIVE below and no
  // Mimic and no MimicShot can reach a board.
  //
  // ⛔ THE CLIMB IS THE ONLY THING HEAT TOUCHES (R6, R7). `MIMIC_CLIMB *
  // climbMult()` is climbMult()'s SEVENTH call site (test-cs007-p2.js); every
  // other constant here is FLAT, and there is no eighth heat accessor. ⛔ Its
  // climb is NOT a contact climb — `killDepth` is null at every depth — so
  // C.CLIMB_MAX_BASE and GDD 4.4's respawn guarantee do not move (R6).
  MIMIC_CLIMB:          0.16,   // depth/s, throat -> the apex ~2.5 s. ⚠ level-1 base
  // ⛔ THE APEX IS BOUNDED, AND THE BOUND IS THE WHOLE FAIRNESS ARGUMENT (MI2).
  // A reflected shot travels MIMIC_SHOT_RATIO / SHOT_TIME = 1.1538 depth/s
  // toward the rim, and the player must get at least C.SURGE_TELEGRAPH of it —
  // the Surger's 0.45 s "visible fuse" benchmark (GDD 6.3) — before it reaches
  // the kill band. So:
  //
  //   ⛔ MIMIC_APEX <= (1 - RIM_CONTACT_DEPTH) - SURGE_TELEGRAPH * (MIMIC_SHOT_RATIO / SHOT_TIME)
  //                  =  0.95 - 0.45 * 1.15385  =  0.4308
  //
  // MEASURED (arithmetic, plan MI2): from 0.40 the flight to the band is
  // 0.477 s; 0.431 is exactly 0.450 s and is the deepest legal apex. A Mimic
  // reflecting BELOW its apex — one still climbing — only ever has longer.
  // ⛔ test-cs013-p4.js asserts this from the constants, so raising the apex or
  // the ratio turns the suite red rather than shipping a shot nobody can read.
  MIMIC_APEX:           0.40,   // ⚠ holds here, one lane, never hopping
  MIMIC_OPEN_TIME:      0.50,   // s open ("firing") after a reflection ⚠. ⛔ flat
  // GDD 14.6's "60% speed", as a RATIO of the player's own shot rather than a
  // second speed constant: 0.6 / SHOT_TIME. ⛔ Never heat-scaled (H2) — and the
  // bolt's argument applies (GDD 4.4): pushed to RESPAWN_PUSH_DEPTH it reaches
  // the band at 0.347 s and self-terminates at 0.390 s + one step, both inside
  // RESPAWN_INVULN, so it is safe by self-termination. ⛔ A reflected shot
  // SLOWER than 0.30 depth/s would breach that, which is the other end of the
  // bound above.
  MIMIC_SHOT_RATIO:     0.60,
  // -- the look (MI1, MI3) — ⚠ provisional, the same standing as the palette --
  // ⛔ TWO POLYS AND THREE CHANNELS, THE DRIFTER'S (GDD 6.3, 12):
  // SOLID = ARMOURED · OPEN = VULNERABLE. Closed is a compact shape drawn
  // CLOSED at a narrow stroke and a dim alpha; open is a splayed one drawn OPEN
  // at a wide stroke and full alpha. ⛔ test-cs013-p4.js is the headless gate,
  // the Drifter's: the width ratio is at least 2 and the closed alpha at most
  // 0.7, measured back off the real glowStroke calls.
  MIMIC_SIZE:           0.72,   // lane widths spanned by the OPEN silhouette
  MIMIC_CLOSED_WIDTH:   0.70,   // x laneLineWidth — armoured: a harder, thinner edge
  MIMIC_OPEN_WIDTH:     1.60,   // x laneLineWidth — vulnerable: bloomed open
  MIMIC_CLOSED_ALPHA:   0.55,   // and dim; open is 1
  // "Colour-shifted, larger" (GDD 14.6): a reflected shot is the PLAYER'S OWN
  // STREAK, turned — drawn at these multiples of C.SHOT_LEN and laneLineWidth,
  // in the Mimic's colour. Draw-time only; MIMIC_SHOT_RATIO is the speed.
  MIMIC_SHOT_LEN:       2.00,   // x SHOT_LEN
  MIMIC_SHOT_WIDTH:     2.00,   // x laneLineWidth
  // The centre of the 259.5° -> 313.3° gap (54°), hue 286° — clear of the
  // eight enemy colours, of C.WARDEN_COLOR's 222° and of C.TOKEN_COLOR's warm
  // 56° (MI3, O16, T10). Its shots are this colour too.
  MIMIC_COLOR:          "#D447FF",  // ⚠ provisional, the same standing as the palette

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
  // ⛔ OVERDRIVE'S ROWS (GDD 13, 14.6; Paul's O2, CS012 P2). A SECOND TABLE, not a
  // `mode` field on the rows above: test-cs007-p3.js holds C.SPAWN_SCHEDULE at
  // seven rows of `level` and `kind` and nothing else, and that absence is the
  // no-weight-table decision. eligibleKinds(level, mode) merges these into the
  // Classic rows in level order, a Classic row first at an equal level, for an
  // Overdrive run only. The same rules hold: cumulative, sorted, uniform pick, no
  // weights, and a one-entry set spends no draw in either mode. ⛔ CS013 P3 added
  // the Warden at 11 and P4 the Mimic at 16. ⛔ `mimicShot` is NOT a row, for
  // `weaverBolt`'s reason: it enters through Mimic.onShot(), and a row for one
  // would put a reflected shot in the throat that nobody reflected.
  // ⚠ THE MIMIC'S ROW IS THE WHOLE OF ITS PROBATION (MI3, GDD 14.6, 21 #6):
  // delete that one line and no Mimic and no MimicShot can reach any board.
  SPAWN_SCHEDULE_OVERDRIVE: [
    { level:  6, kind: "reaver" },
    { level: 11, kind: "warden" },
    { level: 16, kind: "mimic" },
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
  // ⛔ REPRESENTATION ERROR, NOT A TUNING MARGIN (CS008 P1). An enemy parked at
  // the kill band sits at `1 - RIM_CONTACT_DEPTH` = 0.95, and a shot on its fire
  // tick sits at 1, but Math.abs(1 - 0.95) is 0.050000000000000044 — GREATER
  // than HIT_DEPTH_TOL — so without this the one shot sample that exists at the
  // rim misses the one enemy parked there. Read in exactly ONE comparison,
  // collideShots()'s band test; nothing else takes it, and it never grows.
  HIT_DEPTH_EPS:        1e-9,   // depth units, absorbs float error only

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
  GAMEPAD_PAUSE_BUTTON: 9,      // standard mapping's Start — queues `pause` (CS008 P6, U4)
  // The CONTROLS page's two sensitivity rows (CS008 P7), as multiples of
  // MOUSE_SENS / TOUCH_SENS. ✅ Paul confirmed the range, 2026-09-13. ×1.0 is
  // the shipped constant exactly, so an untouched row changes nothing.
  SENS_MIN_MULT:        0.5,
  SENS_MAX_MULT:        2.0,
  SENS_STEP:            0.1,    // one rotate step on an adjusting row

  // ---- Audio (GDD 11) -----------------------------------------------------
  MUSIC_LOOKAHEAD:      0.20,   // s. ⛔ per-frame; never setTimeout/setInterval.
  MUSIC_CROSSFADE:      0.60,   // s track-to-track
  MUSIC_FADE_OUT:       1.00,   // s to silence at game over
  MUSIC_DUCK_GAIN:      0.50,   // menu-open level
  MUSIC_DUCK_RAMP:      0.15,   // s. ⛔ ramp, never a bare .value set.
  MUSIC_DIP_GAIN:       0.50,   // -6 dB event dip (Paul's D9); ramps over MUSIC_DUCK_RAMP
  MUSIC_DIP_HOLD:       0.50,   // s held at the dip before it ramps back
  MUSIC_DIP_EVENTS:     ["purge", "purgeWeak", "death", "extraLife"], // the seat call dips the music on these (D9); never lifeLost
  // ⛔ The music limiter (Paul's D2), after the sweep and before the duck. The
  // headroom gate models its static curve, exact only at knee 0 (D16).
  MUSIC_LIMIT:          { threshold: -24, knee: 0, ratio: 20, attack: 0.001, release: 0.10 },
  LAYER_THRESHOLD:      { 2: 0.25, 3: 0.40, 4: 0.80 }, // ⛔ tier must be 1..4. Key 4 unread (no tier-4 layer)
  LAYER_CROSSFADE:      0.03,   // s gate ramp FROM THE BAR LINE: a de-click, not a fade (D11)
  FILTER_MIN_HZ:        600,    // music bus low-pass at intensity 0
  FILTER_MAX_HZ:        18000,  // ... and at intensity 1; exponential between (D14)
  FILTER_Q:             -3.0103, // dB: a Butterworth low-pass, no peak at the cutoff
  FILTER_TC:            0.05,   // s sweep time constant. ⚠ provisional
  INT_ATTACK:           0.40,   // s — danger registers fast
  INT_RELEASE:          2.50,   // s — relief is earned. ⛔ asymmetric.
  INT_W_COUNT:          0.30,
  INT_W_PROXIMITY:      0.30,
  INT_W_COMBO:          0.15,
  INT_W_PERIL:          0.15,
  INT_W_HEAT:           0.10,
  INT_EXPECTED_ENEMIES: 10,
  INT_COMBO_MAX:        8,
  // The engine (CS009 P1). ⛔ The noise buffer is its OWN stream from its own
  // seed (01-rng.js's header), never the run's: an audio draw must not move a
  // spawn lane, and the platform generator is banned from the build.
  AUDIO_NOISE_SEED:     0x5EED0A0D,
  AUDIO_VOL_STEPS:      10,     // a volume row is 0..STEPS; gain is linear, steps / STEPS
  AUDIO_VOL_DEFAULT:    10,     // every bus at unity (Paul's A2)
  AUDIO_VOL_RAMP:       0.03,   // s. ⛔ a volume change ramps, never a bare .value set.
  MUSIC_STEP_NODE_MAX:  16,     // ⚠ provisional ceiling on nodes one scheduled step creates
  // Music by screen (CS009 P3; GDD 11.7, 13). A mode's own gameplay track, which
  // the MUSIC TRACK row's AUTO resolves through. Overdrive's is `drive` (CS012 P1).
  MODE_TRACK:           { classic: "pulse", overdrive: "drive" },
  // The MUSIC TRACK row's choices in rotate order (Paul's A4). The first is the
  // default. "auto" is the mode's track; any other entry names a track and plays
  // it in either mode (CS012 R10). ⛔ Saved by NAME: never rename or remove one.
  MUSIC_TRACK_CHOICES:  ["auto", "pulse", "drive"],

  // ---- SFX (GDD 11.8) -----------------------------------------------------
  // ⛔ PORTED VERBATIM FROM tools/sfx-lab.html (CS009 P4, Paul's A7). Each
  // recipe is the lab's picked candidate, which is candidate A until Paul picks
  // another, and test-cs009-p4.js holds this group identical to the lab's
  // candidate-A block. ⛔ Never re-tune a value here by hand: pick in the lab,
  // copy out, paste over this group. One recipe per event (plan §7; A8: no spawn
  // cues). The fields are createSfxPlayer's (16-audio-engine.js).
  SFX: {
    fire:           { osc: [{ type: "square", f: 1480, to: 370 }], glide: 0.07, filter: { type: "lowpass", f: 5000, to: 1200 }, sweep: 0.07, atk: 0.002, hold: 0.01, rel: 0.06, gain: 0.12 },
    kill:           { osc: [{ type: "square", f: 330, to: 66 }, { type: "square", f: 334, to: 67 }], glide: 0.18, atk: 0.002, hold: 0.02, rel: 0.18, gain: 0.12 },
    split:          { osc: [{ type: "triangle", f: 520, to: 1040 }], glide: 0.08, atk: 0.002, hold: 0.03, rel: 0.12, gain: 0.18 },
    chip:           { osc: [{ type: "square", f: 3000, to: 2400 }], glide: 0.02, atk: 0.001, hold: 0.005, rel: 0.03, gain: 0.07 },
    bolt:           { osc: [{ type: "sawtooth", f: 900, to: 1800 }], glide: 0.1, filter: { type: "lowpass", f: 3000 }, atk: 0.005, hold: 0.03, rel: 0.08, gain: 0.12 },
    cross:          { osc: [{ type: "sine", f: 440 }, { type: "sine", f: 554 }], atk: 0.01, hold: 0.06, rel: 0.15, gain: 0.12 },
    surgeCharge:    { osc: [{ type: "sawtooth", f: 110, to: 880 }, { type: "square", f: 111, to: 886 }], glide: 0.45, filter: { type: "lowpass", f: 1200, to: 5000, q: 2 }, sweep: 0.45, atk: 0.01, hold: 0.44, rel: 0.04, gain: 0.45 },
    surgeDischarge: { noise: true, filter: { type: "lowpass", f: 6000, to: 400 }, sweep: 0.3, atk: 0.002, hold: 0.08, rel: 0.25, gain: 0.35 },
    death:          { osc: [{ type: "sawtooth", f: 440, to: 40 }, { type: "sawtooth", f: 443, to: 41 }], glide: 1.1, atk: 0.002, hold: 0.05, rel: 1.1, gain: 0.25 },
    gameOver:       { osc: [{ type: "triangle", f: 392, to: 98 }, { type: "triangle", f: 294, to: 73.5 }], glide: 1.6, atk: 0.02, hold: 0.4, rel: 1.4, gain: 0.28 },
    respawn:        { osc: [{ type: "sine", f: 330, to: 990 }, { type: "sine", f: 495, to: 1485 }], glide: 0.25, atk: 0.01, hold: 0.1, rel: 0.2, gain: 0.14 },
    purge:          { osc: [{ type: "sawtooth", f: 110, to: 1760 }, { type: "sawtooth", f: 55, to: 880 }], glide: 0.4, filter: { type: "lowpass", f: 800, to: 6000 }, sweep: 0.4, atk: 0.01, hold: 0.2, rel: 0.4, gain: 0.3 },
    purgeWeak:      { osc: [{ type: "square", f: 330, to: 220 }], glide: 0.12, atk: 0.005, hold: 0.02, rel: 0.1, gain: 0.08 },
    extraLife:      { osc: [{ type: "triangle", f: 784, to: 1568 }, { type: "triangle", f: 1175, to: 2350 }], glide: 0.08, atk: 0.005, hold: 0.2, rel: 0.4, gain: 0.18 },
    lifeLost:       { osc: [{ type: "triangle", f: 523, to: 262 }], glide: 0.3, atk: 0.005, hold: 0.1, rel: 0.3, gain: 0.18 },
    wellClear:      { osc: [{ type: "sine", f: 392, to: 784 }, { type: "square", f: 588, to: 1176 }], glide: 0.2, filter: { type: "lowpass", f: 3000 }, atk: 0.01, hold: 0.15, rel: 0.4, gain: 0.14 },
    dive:           { osc: [{ type: "sine", f: 110, to: 880 }, { type: "sine", f: 111, to: 888 }], glide: 2.4, atk: 0.4, hold: 1.8, rel: 0.4, gain: 0.22 },
    diveStrike:     { noise: true, filter: { type: "highpass", f: 2000 }, atk: 0.002, hold: 0.02, rel: 0.15, gain: 0.3 },
    menuMove:       { osc: [{ type: "square", f: 880 }], atk: 0.001, hold: 0.01, rel: 0.03, gain: 0.06 },
    menuConfirm:    { osc: [{ type: "triangle", f: 660 }, { type: "triangle", f: 990 }], atk: 0.002, hold: 0.05, rel: 0.12, gain: 0.1 },
    menuBack:       { osc: [{ type: "triangle", f: 660, to: 330 }], glide: 0.08, atk: 0.002, hold: 0.02, rel: 0.08, gain: 0.1 },
    comboLost:      { osc: [{ type: "sawtooth", f: 587, to: 220 }, { type: "sawtooth", f: 392, to: 147 }], glide: 0.22, filter: { type: "lowpass", f: 3200, to: 700 }, sweep: 0.22, atk: 0.003, hold: 0.04, rel: 0.22, gain: 0.13 },
    collect:        { osc: [{ type: "triangle", f: 1320, to: 2640 }, { type: "square", f: 1980, to: 3960 }], glide: 0.06, filter: { type: "lowpass", f: 6000 }, atk: 0.002, hold: 0.03, rel: 0.14, gain: 0.1 },
    wardBreak:      { noise: true, filter: { type: "highpass", f: 800, to: 3000 }, sweep: 0.12, atk: 0.001, hold: 0.03, rel: 0.18, gain: 0.26 },
    reflect:        { osc: [{ type: "square", f: 1760, to: 2640 }, { type: "triangle", f: 1175, to: 1760 }], glide: 0.05, filter: { type: "highpass", f: 600, to: 2200 }, sweep: 0.09, atk: 0.002, hold: 0.02, rel: 0.12, gain: 0.16 },
    ringTake:       { osc: [{ type: "sine", f: 1568 }, { type: "sine", f: 2349 }], filter: { type: "highpass", f: 700 }, atk: 0.002, hold: 0.03, rel: 0.16, gain: 0.14 },
    ringMiss:       { osc: [{ type: "triangle", f: 660, to: 440 }], glide: 0.07, filter: { type: "lowpass", f: 2200 }, atk: 0.002, hold: 0.02, rel: 0.09, gain: 0.07 },
  },
  // The kill recipe's pitch multiplier, keyed by an entity's sfxVoice (A9).
  SFX_KILL_PITCH:       { vaulter: 1, carrier: 0.75, weaver: 1.25, weaverBolt: 1.6, thorn: 2, drifter: 0.9, surger: 0.6, reaver: 1.15, warden: 0.5, mimic: 1.4, mimicShot: 1.8 },

  // ---- Overdrive (GDD 14) -------------------------------------------------
  // ⛔ THE TOKENS (GDD 14.1; CS013 P1, T1–T6, T10; 10-powerups.js). ⚠ Every
  // value below but the three GDD numbers (MAX_TOKENS, TOKEN_HOVER_DEPTH,
  // BOUNTY_POINTS) is provisional: a tuning or art pass owns it.
  // ⛔ GDD 14.1's TWO TABLES ARE TWO, AND NEITHER NAMES THE OTHER'S NUMBERS: a
  // weight is never a budget and a budget is never a weight, so retuning how
  // often Ward drops cannot change what it does, and the reverse.
  //
  // -- the life on the board (T4) --
  MAX_TOKENS:           2,      // ⛔ readability cap on powerups on screen
  TOKEN_LIFE:           9.0,    // s. ⛔ counts UP toward this. GDD 16.3.
  TOKEN_HOVER_DEPTH:    0.80,   // rises to here and holds; collectable only here
  TOKEN_RISE:           0.30,   // depth / s ⚠
  // -- THE DROP-WEIGHT TABLE: which kills drop, and WHICH token a drop is (T2, T3) --
  // p = TOKEN_DROP_CHANCE / (1 + threatCount()), off ONE draw per Overdrive
  // kill; the kind is the same draw rescaled over these weights, in this order.
  TOKEN_DROP_CHANCE:    0.10,   // ⚠ about one token per cleared well (plan §0 T2, MEASURED on bots)
  TOKEN_WEIGHTS:        { bounty: 3, lance: 2, spread: 2, ward: 2, recharge: 1 },   // ⚠
  // -- THE BUDGETED-EFFECT LIST: WHAT a token does, and how much (T6–T9) --
  // Bounty pays this, unmultiplied; Recharge re-arms the Purge (no constant);
  // Lance, Spread and Ward are CS013 P2's readers; Ward is one hit (no constant).
  BOUNTY_POINTS:        2000,   // GDD 14.1's +2,000
  LANCE_CHIP_MULT:      3,      // GDD 14.1's "chips Thorns at 3×"
  SPREAD_SHOT_MAX:      24,     // ⚠ the shot cap while Spread is on (T8: 3 × SHOT_MAX)
  // -- the look (T10) — one warm colour no enemy or band uses (hue 56°) --
  TOKEN_COLOR:          "#FFF347",  // ⚠ provisional, the same standing as the enemy palette
  TOKEN_SIZE:           0.80,   // lane widths spanned by the ring
  TOKEN_RING_SEG:       24,     // polyline segments to a full ring
  // The Ward's shell: the craft's OWN silhouette, scaled about its local
  // origin and stroked in TOKEN_COLOR around it (T9, P2). Draw-time only.
  WARD_SHELL_SCALE:     1.45,   // ⚠ how far outside the craft the shell sits
  WARD_SHELL_ALPHA:     0.85,   // ⚠ the shell's stroke alpha
  // ⛔ WHAT A MODE HAS, AS DATA (GDD 1, 20 #28: "flags in the config, not a
  // fork"; CS012 R1). One reader, modeHas() at the foot of this file. The
  // Reaver, the track and the board are not flags: they go through
  // SPAWN_SCHEDULE_OVERDRIVE, MODE_TRACK and the board's game id.
  // ⛔ A FEATURE IS A FIELD IN THE ROWS, NEVER A NEW TOP-LEVEL KEY: 22-meta.js
  // derives `progress`'s modes from Object.keys(MODE_FLAGS). CS013 P1 added
  // `tokens` (R3), and CS014 P1 `rings` (RF6, R2).
  // ⛔ `rings` IS ALSO THE RING FLIGHT'S WHOLE CUT (GDD 14.5, ROADMAP): this
  // feature is CS014's first candidate to cut under scope pressure, and
  // `true` -> `false` on the row below is the entire edit. No ring is laid, so
  // none is taken, drawn or sounded, and an Overdrive dive goes back to being
  // C.DIVE_TIME long and scoring nothing — the Classic thorn-dodge. It is the
  // Mimic's one-row shape (CS013 MI3), and test-cs014-p1.js proves it.
  MODE_FLAGS: {
    classic:   { jump: false, combo: false, tokens: false, rings: false },
    overdrive: { jump: true,  combo: true,  tokens: true,  rings: true  },
  },
  // ⛔ THE JUMP'S FOUR TIMERS, AND ALL FOUR COUNT UP (GDD 14.2, 16.3; O6).
  // JUMP_COOLDOWN runs from LANDING, and JUMP_RECOVERY is its first 0.20 s —
  // so the longest a player can spend off the rim is 0.90 in 2.30 s, 39.1 %
  // (MEASURED, plan §0's O6 table). Airborne the craft rotates and may Purge
  // and cannot fire; recovering it is on the rim, contact-lethal, and can do
  // neither. Raising JUMP_TIME or lowering JUMP_COOLDOWN moves that share.
  JUMP_TIME:            0.90,
  JUMP_RECOVERY:        0.20,
  JUMP_COOLDOWN:        1.40,
  // ⛔ THE THREE AIRBORNE CHANNELS (GDD 14.2's ⛔; O7, O16). ⚠ All four values
  // are provisional, the same standing as SKIMMER_COLOR. The first two are
  // DRAW-TIME ONLY — `lane` and the depth model are untouched by a jump — and
  // the third is kit-audio 0.4.0's optional high-pass group, passed in by
  // 19-sfx.js. ⛔ The shadow is a STROKE at this alpha; nothing here is a fill.
  JUMP_LIFT:            0.12,   // rim radii out from the well's centroid, at the apex
  JUMP_SHADOW_ALPHA:    0.6,    // the rim shadow's glow alpha, under the lifted craft
  JUMP_HP_HZ:           700,    // Hz: a clear thinning with the tune intact
  JUMP_HP_TC:           0.03,   // s: the time constant of a de-click, not a sweep
  // ⛔ THE COMBO (GDD 14.4; O3, O5; CS012 P4). Four numbers and no fifth: the
  // multiplier rises by COMBO_STEP every COMBO_KILLS_PER_STEP kills, a window
  // with no kill costs one step and each further window another, and a death is
  // ×1 at once. ⚠ COMBO_KILLS_PER_STEP is PROVISIONAL (O16): O3's table
  // MEASURED 4 as the value that lands GDD 14.4's "ordinary competent play
  // sustains ×3–4" (mean 4.76 sharp / 3.85 dull), where +0.5 per kill sustains
  // about ×7. ⛔ COMBO_WINDOW is the LAPSE clock, not a kill-gap test: the
  // window restarts on every kill and the clock HOLDS through a Dive (O5).
  COMBO_WINDOW:         2.50,   // s
  COMBO_MAX:            8,
  COMBO_STEP:           0.5,    // ⛔ the half step GDD 14.4 names; the lattice is 1, 1.5 … COMBO_MAX
  COMBO_KILLS_PER_STEP: 4,      // ⚠ provisional (O16)

  // ---- Scoring (GDD 7) ----------------------------------------------------
  PTS_THORN:            5,
  PTS_WEAVER:           50,
  PTS_CARRIER:          100,
  PTS_VAULTER:          150,
  PTS_SURGER:           200,
  // ⛔ By depth band, rim pays most (Paul, P1s): EQUAL bands, and the band
  // count is this array's LENGTH — Drifter.points() never writes a literal 3.
  PTS_DRIFTER:          [250, 500, 750],
  PTS_REAVER:           300,
  PTS_MIMIC:            400,
  PTS_WARDEN:           500,
  PTS_WELL_PER_LEVEL:   100,
  PTS_NO_DEATH_WELL:    1000,

  // ---- Start Depth (GDD 4.6) — CS008 P3 -----------------------------------
  // ⛔ THE FORMULA IS CANONICAL (Paul, S3): round-to-ROUND of
  // SCALE × (d − 1)^EXP, in startBonus() (12-scoring.js). GDD 4.6's old table
  // disagreed with it at 7, 17 and 33 and was corrected to it.
  START_BONUS_SCALE:    800,
  START_BONUS_EXP:      1.6,
  START_BONUS_ROUND:    100,
  // The list a first session offers, and the ceiling the session record can
  // extend it to (startDepthOptions(), 22-meta.js). ⛔ 81 keeps a run starting
  // below C.BAND_RNG_LEVEL, so startGame() needs no past-99 roll (plan §1.12).
  START_DEPTH_FIRST:    [1, 3, 5, 7, 9],
  START_DEPTH_CAP:      81,

  // ---- Presentation (GDD 10, 12) ------------------------------------------
  HIT_STOP_DEATH:       1.20,   // s
  READABILITY_DEPTH:    0.25,   // ⛔ nothing opaque drawn below this depth
  ATTRACT_IDLE:         20,     // s before attract mode

  // ---- Text and the HUD (GDD 10.2, 10.4) — CS008 P4 ------------------------
  // ⛔ drawText() (13-render-well.js) is the ONE text path in the build. Its
  // glow reuses GLOW_WIDE_W / GLOW_WIDE_ALPHA below, so nothing here is a
  // global glow constant.
  TEXT_FONT_FAMILY:     "ui-monospace, Menlo, Consolas, \"Courier New\", monospace",
  // Monospace advance as a fraction of the font size. ⛔ LAYOUT ONLY: hudLayout()
  // sizes a text rectangle from it rather than from measureText(), so the
  // readability and touch-button assertions are arithmetic, not a font probe.
  // Conservative on purpose — every stack above advances at or under 0.6 em.
  TEXT_CHAR_W:          0.62,
  HUD_COLOR:            "#FFFFFF",  // ⚠ provisional, the same standing as SKIMMER_COLOR
  HUD_MARGIN:           24,     // px, from the world edge to every corner item
  HUD_TEXT_SIZE:        28,     // px, score and "LEVEL n"
  HUD_ICON_SIZE:        30,     // px, a reserve craft's width, prong to prong
  HUD_ICON_DEPTH_SCALE: 2.0,    // SKIMMER_POLY `d` → px, as a multiple of the icon size
  HUD_ICON_GAP:         10,     // px between reserve craft
  HUD_LINE_W:           2.0,    // px, icon and glyph stroke
  HUD_PURGE_SIZE:       30,     // px, the Purge glyph's diameter
  HUD_PURGE_DIM_ALPHA:  0.35,   // GDD 4.3 — the weak second use still waiting
  // ⛔ THE JUMP GLYPH, OVERDRIVE ONLY (GDD 10.4, 16.3; O8). It sits LEFT of the
  // Purge glyph on the same baseline, so the Classic HUD's four rectangles are
  // bit-identical (test-cs012-p5.js). ⛔ HUD_JUMP_SIZE is the RING's diameter
  // and the rectangle hudLayout() reports — the craft inside it is smaller —
  // because the rectangle is what the readability and touch-button assertions
  // are made against. ⚠ Provisional, like the Purge glyph's art.
  HUD_JUMP_SIZE:        30,     // px, the readiness ring's diameter and the box
  HUD_JUMP_GAP:         16,     // px between that box and the Purge glyph's
  HUD_JUMP_CRAFT:       0.60,   // the craft glyph's width as a fraction of the box
  HUD_JUMP_RING_SEG:    24,     // polyline segments in a FULL ring; a partial one uses its share
  // ⛔ THE COMBO READOUT, OVERDRIVE ONLY (GDD 10.4, 14.4, 16.3; O8, O16). "×N"
  // CENTRE-TOP, absent at ×1, inside a depletion ring that empties over
  // COMBO_WINDOW. ⚠ HUD_COMBO_SIZE is O16's provisional 56, C.MENU_TITLE_SIZE's
  // "loud".
  //
  // ⛔ HUD_COMBO_Y IS 6 AND NOT HUD_MARGIN, AND THAT IS ARITHMETIC RATHER THAN
  // taste. MEASURED at CS012 P4: the Fan well's throat zone (GDD 10.3) reaches
  // y 76.29, and its x span 504.6..775.4 straddles the centre — so the whole
  // readout must clear 76.29. HUD_COMBO_Y + HUD_COMBO_SIZE + 2 × HUD_COMBO_PAD
  // is 70, which leaves 6.29 px. ⛔ An art pass that raises HUD_COMBO_SIZE
  // re-derives that sum; at HUD_MARGIN 24 the 56 px em box alone breaches it.
  // test-cs012-p4.js asserts it on all sixteen wells.
  //
  // ⛔ THE RING IS AN ELLIPSE, and it is sized for the WIDEST reading rather
  // than the current one (HUD_COMBO_CHARS — "×3.5" is four characters, "×8" is
  // two), so the rectangle is a constant and the ring does not breathe as the
  // multiplier crosses a whole number.
  HUD_COMBO_SIZE:       56,     // px, the "×N" text. ⚠ provisional (O16)
  HUD_COMBO_Y:          6,      // px, the readout rectangle's top edge
  HUD_COMBO_PAD:        4,      // px between the widest text box and the ring
  HUD_COMBO_CHARS:      4,      // the widest reading, in characters: "×3.5"
  HUD_COMBO_RING_SEG:   32,     // polyline segments in a FULL ring; a partial one uses its share
  // ⛔ H3: the touch-button side's items shift inward by this many
  // TOUCH_BUTTON_R — the button's far edge (margin 1.5 R + radius 1 R) and a
  // margin. The side is the mirror flag in the HUD view, never a detected device.
  HUD_TOUCH_INSET_R:    2.5,

  // ---- Screens and menus (GDD 10.5) — CS008 P5 ----------------------------
  // ⛔ ROTATE MOVES THE CURSOR IN WHOLE STEPS OF THIS, IN LANE UNITS. 1.0 is
  // what makes a keyboard tap exactly one row (GDD 9.2's tap is exactly one
  // lane, measured exact at every tap length) and a mouse flick several.
  MENU_ROTATE_STEP:     1.0,
  MENU_TITLE_SIZE:      56,     // px, a screen's title
  MENU_TITLE_Y:         120,    // px, the title's top edge
  MENU_TEXT_SIZE:       30,     // px, info lines and rows
  MENU_TOP_Y:           240,    // px, the first info line's top edge
  MENU_ROW_H:           46,     // px per info line and per row
  MENU_COL_W:           460,    // px, a row's label (left) to its detail (right). 460 fits "MOUSE SENSITIVITY" beside an adjusting detail (P7)
  MENU_VISIBLE_ROWS:    7,      // rows drawn at once; the window follows the cursor
  MENU_COLOR:           "#FFFFFF",  // ⚠ provisional — the selected row and the title
  MENU_IDLE_COLOR:      "#7FA8C8",  // ⚠ provisional — an enabled row not selected
  MENU_LOCKED_COLOR:    "#3A4652",  // ⚠ provisional — a row that cannot be chosen
  MENU_CHEVRON_SIZE:    12,     // px, the cursor glyph's half-height
  MENU_CHEVRON_GAP:     20,     // px between the glyph and the row's label
  MENU_LINE_W:          2.0,    // px, the cursor glyph's stroke
  // ⚠ PLACEHOLDER COPY (U6; CS008 P6) — Paul replaces it before ship. The
  // CREDITS page appends a VERSION line from GAME_VERSION, so none is typed
  // here. ⛔ GDD 18: no mention of the original game or its publisher.
  CREDITS_LINES:        ["VECTOR VORTEX", "COINLESS GAMES"],

  // ---- The death fragmentation (GDD 4.4) — CS008 P4 -----------------------
  // ⛔ drawFragments() (14-render-entities.js) is a function of hit-stop
  // progress and these, and nothing else: no RNG, no clock of its own.
  FRAG_DRIFT:           48,     // px each segment travels outward by t = 1
  FRAG_SPIN:            1.2,    // rad each segment turns by t = 1, alternating sign
  FRAG_LINE_W:          3.0,    // px — LINE_W_RIM, the craft's own weight

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
  // ⛔ THE RIM PULSE (CS010 P4; Paul's D10, GDD 11.6). `heart`'s onsets, by the
  // audio clock, raise the rim stroke's width and alpha and nothing else. ⚠
  // provisional. The alpha is capped at 1, so outside the dim band only the
  // width moves.
  RIM_PULSE_TIME:       0.10,   // s from an onset back to rest, linear
  RIM_PULSE_W:          0.5,    // width x (1 + W x glow)
  RIM_PULSE_ALPHA:      0.5,    // alpha x (1 + ALPHA x glow), capped at 1
  RIM_PULSE_RING:       8,      // onset times held; the lookahead holds at most two

  // ---- Telemetry (GDD 15.6) -----------------------------------------------
  // The ring lives in memory and is saved per profile since CS011 P2, as arrays,
  // at 22-meta.js's seats and never mid-play (plan R17). ⛔ The capture switch
  // is never stored. Its declared version is 22-meta.js's `telemetry` key.
  TELEMETRY_CAP:        4096,   // rows. ⛔ the ring DROPS the oldest and latches
                                // `wrapped`; a total read off a wrapped buffer
                                // is wrong, so the export says so in its header.
  TELEMETRY_INTERVAL:   0.50,   // s of SIMULATION time between samples (never
                                // wall clock). 4096 rows is ~34 min of a run.
  // ⛔ THERE IS NO TELEMETRY_PLACEHOLDER ANY MORE, AND THAT IS THE POINT
  // (GDD 15.6; CS012 P4, R7). It held the columns whose SOURCE was scheduled
  // later than their PLACE in the order — a column added later invalidates
  // every log recorded before it — and each key was deleted by the changeset
  // that gave that column a real source: `score` in CS008 P2 (state.score),
  // `mode` and `startDepth` in CS008 P3, and `maxCombo` here
  // (state.combo.peak). With its last key gone the object is dead code, so it
  // went with it rather than staying as an empty bag. ⛔ A future column with a
  // scheduled source mints its own constant; it does not resurrect this one.

  // ---- Meta: profiles, saves, scores (GDD 15) — CS011 ----------------------
  // The phases that read the rest of the group add them (plan §2).
  PROFILE_MAX:          8,      // kit-profile's roster ceiling (its create() refuses past it)
  SCORES_PER_MODE:      10,     // the local table's rows per mode (GDD 15.3; CS011 P3)
  // NAME's wheel (plan R13; CS011 P4): kit-names' charset in the order A–Z, 0–9,
  // space, _, -, then the two marks. A one-character entry appends; DEL and END
  // are the marks 23-main.js reads by name.
  NAME_WHEEL:           "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 _-".split("").concat(["DEL", "END"]),
  NOTICE_WRAP:          60,     // chars per line of RENAME's notice (R14: 60 × 18.6 px = 1,116 px of 1,280)
  // The online board (plan R18, R19; CS011 P5). kit-leaderboard's `endpoint` has
  // no default. The board is the top LEADERBOARD_BOARD_LIMIT players, all time.
  LEADERBOARD_ENDPOINT: "https://scores.coinlessgames.com",
  LEADERBOARD_BOARD_LIMIT: 10,
  // ⛔ ONE BOARD PER MODE (GDD 13, 15.4; CS012 P3, O11). The Worker keeps each
  // player's best row per game id and has no per-mode boards, so Overdrive
  // cannot share Classic's. Both ids are registered in coinless-kit's
  // services/leaderboard/src/registry.js. ⛔ THIS IS NOT GAME_ID: that is
  // kit-storage's keyspace (below), and renaming it would wipe every save.
  // ⛔ The key order is the order the clients are made in (22-meta.js).
  LEADERBOARD_GAME_IDS: { classic: "vector-vortex", overdrive: "vector-vortex-overdrive" },
  // kit-profile's name for the silent first profile (Paul's M2), passed to it at
  // boot so the ONLINE view's hint (M9) reads the same name the kit wrote.
  PROFILE_ANONYMOUS_NAME: "ANONYMOUS",

  // ---- Build / debug ------------------------------------------------------
  GAME_VERSION:         "0.0.10",  // ⚠ 0.0.2 was never written here — see log/CS006.md
  // ⛔ THE SAVE KEYSPACE, AND NOTHING ELSE (kit-storage: coinless.<GAME_ID>.<key>).
  // ⛔ Never change it: every stored key would be orphaned. The online boards are
  // LEADERBOARD_GAME_IDS above, one per mode (CS012 P3).
  GAME_ID:              "vector-vortex",
};

// ---------------------------------------------------------------------------
// THE HEAT CLOCK (GDD 8) — ⛔ ONE CLOCK: state.level
// ---------------------------------------------------------------------------
//
// ⛔ THE ONLY FUNCTIONS IN THIS FILE BUT ONE (modeHas(), below them), AND THEY
// ARE HERE BECAUSE THEY ARE THE TUNING SURFACE'S OTHER HALF. C above says what a value is at level 1 and what
// it is at the top; the seven accessors below say how the game walks between
// the two. Splitting them would put half of one decision in each of two files.
//
// ⛔ NO CALL SITE COMPUTES HEAT INLINE AND NO ENTITY READS A HEAT-DERIVED BASE
// CONSTANT DIRECTLY. Every derived value is exactly one function; the entity
// reads the function. That is what makes the clamp enforceable in ONE place and
// testable as a property over levels 1..200 rather than as a spot check —
// test-cs007-p2.js asserts it off the BUILT file, so a future session that
// writes a bare climb constant into an entity turns the suite red instead of
// quietly escaping the clamp. The SIX climb rates are the one shape that
// differs (CS013 P3 added the Warden's, R6): they
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

// ---------------------------------------------------------------------------
// THE MODE FLAGS' ONE READER (GDD 13; CS012 R1)
// ---------------------------------------------------------------------------
//
// Whether a mode has a feature, off C.MODE_FLAGS. ⛔ THE MODE ARGUMENT IS
// OPTIONAL in the heat accessors' pattern: omitted, it reads state.mode, the
// run's; a test passes one. True only for a flag the table declares true, so an
// unknown mode or name reads as absent rather than throwing mid-step.
function modeHas(name, mode) {
  const flags = C.MODE_FLAGS[mode === undefined ? state.mode : mode];
  return !!flags && flags[name] === true;
}
