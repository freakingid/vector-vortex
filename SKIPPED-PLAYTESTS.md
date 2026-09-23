# SKIPPED PLAYTESTS — Vector Vortex

⛔ **Paul does no playtests (2026-09-16, `DECISIONS.md`).** This file is **not**
a to-do list for him. It records the playtests a phase would have asked for,
what they were meant to find out, and the knob that would move if one were ever
run. The shipped values stand as they are.

⛔ **Not session context.** No session reads this file unless a prompt names it.

**How this file is maintained**

- A phase that ships something only a person could judge (feel, legibility, a
  sound) **appends one entry** here and carries on. ⛔ It never blocks, never
  waits, and never asks Paul to play.
- Each entry has: **changeset and phase**, **what Paul would have done**, **what
  we were trying to learn**, and **knobs**. Keep an entry short.
- If a later changeset makes an entry moot (the thing is removed or rebuilt),
  delete the entry in that commit.
- If Paul ever plays something anyway and says what he saw, record the result
  in `DECISIONS.md` and delete the entry.

**If one is ever run.** `START DEPTH` reaches a level; in the browser console,
`levelRecord("classic").noteCleared(81)` unlocks every odd level to 81 for that
session, and `levelRecord("overdrive").noteCleared(81)` does the same for
Overdrive — ⛔ **the record is per mode since CS012 P3**, and a bare
`levelRecord()` reads `state.mode`, which on the title is the LAST run's.
`w` changes the well **shape**, not the level. Bench keys: `1`–`6` spawn one of
each Classic kind in your lane, `0` spawns the full staggered row. `t` turns
telemetry capture on, and `e` prints the CSV to the console.

---

## Correctness-grade skips

These would have checked for a death or wrong move the player cannot account
for.

### CS005 P2 — Drifter states at a glance
- **Would have done:** pressed `5` a few times, then `0`, and checked whether the
  armoured (closed, dim, thin) and crossing (open, bright, thick) Drifter states
  can be told apart in traffic.
- **Trying to learn:** whether players can tell when a Drifter can be shot. The
  suite proves the three visual channels differ; it cannot prove anyone reads them.
- **Knobs:** `C.DRIFT_RIDE_ALPHA` and the ride/cross line-weight multipliers.

### CS005 P3 — Surger fuse reads as a countdown
- **Would have done:** pressed `6` and watched the fuse climb.
- **Trying to learn:** whether it reads as "the charge is coming at me" and not
  just "that lane is bright".
- **Knobs:** `C.SURGE_TELEGRAPH` (0.45 s).

### CS005 P4 — Drifter Carrier vs Surger Carrier at throat depth
- **Would have done:** pressed `2` until all three cargoes appeared, and judged
  them at their smallest.
- **Trying to learn:** whether the two cargoes can be told apart. They need
  opposite responses (Drifter: shoot, move away; Surger: shoot, hold still), so a
  misread costs a life.
- **Knobs:** the Drifter glyph's shape, then `C.CARRIER_GLYPH_SIZE`, then stroking
  the glyph in the cargo's colour (an art call).

### CS005 P5 (reachable since CS008 P5) — a six-kind board at level 23
- **Would have done:** pressed `0` for the static row, then played from START DEPTH
  23, the first level with all seven schedule rows.
- **Trying to learn:** whether six kinds arriving at once is readable at the
  level the game introduces them, or just noise.
- **Knobs:** `C.ENEMY_CONCURRENT`, then `C.ENEMY_CAP` (16, the readability
  ceiling), then `C.SPAWN_SCHEDULE`.

### CS006 P4 — lit lanes in the dim band at level 65
- **Would have done:** started at level 65 and pressed `0`.
- **Trying to learn:** whether a lane with something in it reads as "lit", and
  whether the dim well (0.18 alpha) still reads as a well rather than a
  rendering fault.
- **Knobs:** `C.LANE_LIT_ALPHA` (0.9). `DIM_BAND_*` are ⚠ SETTLED and not knobs.

### CS006 P2 — the Flat (11) and the Stair (9) read as wells
- **Would have done:** opened `tools/well-lab.html`, picked each well, and looked.
- **Trying to learn:** whether the Flat reads as depth rather than a fan of
  lines, and whether the Stair's raised throat reads as perspective or as a
  mistake. The geometry is measured, but nobody has looked at it.
- **Knobs:** the two `throatOffset` values (in `03-wells.js`, the lab and GDD
  §3.4 together), then `C.THROAT_SCALE`.

### CS006 P3 — the Dive feels like a breath
- **Would have done:** cleared a well with a Thorn standing and paid attention to
  the 2.6 s that followed.
- **Trying to learn:** whether the Dive feels like a release with a small skill
  test (GDD pillar P4) or like dead time. Also whether `C.DIVE_GRACE` is long
  enough to see thorned lanes, and whether a player can tell a Thorn killed them
  when the Dive has no visual.
- **Knobs:** `C.DIVE_TIME` (2.6, the whole dive), `C.DIVE_GRACE` (0.35). "Couldn't
  tell what killed me" means the Dive needs a visual, not a retune.

---

### CS009 P5 — the Surger tone over `pulse`, on real hardware
- **Would have done:** played from START DEPTH 23 with `pulse` at default volumes,
  on laptop speakers, headphones and a phone. Pressed `6` in a busy moment and
  listened for the rising charge tone.
- **Trying to learn:** whether the tone is heard over the music and the other SFX
  in time to leave the lane. It is the one sound whose absence costs a life. The
  headless gate (`test-cs009-p5.js`) compares peak gains only, not loudness as a
  person hears it: small speakers lose the low start of the sweep (110 Hz).
- **Knobs:** `C.SFX.surgeCharge` `gain` (0.45; re-pick in `tools/sfx-lab.html`),
  then the gate's `HEADROOM_RATIO` (1.0, ⚠ provisional 0 dB), then
  `C.AUDIO_VOL_DEFAULT`.

## Pacing skips

### CS007 P3 (+P4 telemetry) — each new kind is noticeable
- **Would have done:** played from level 1 with `t` on, named what was new at
  each level (5, 9, 13 …), and pressed `e` at the end.
- **Trying to learn:** whether GDD pillar P3 works, that is, whether each new
  kind arrives at a level the player can notice and learn from. The failure is an
  arrival lost in the rising heat, or arrivals spaced too far apart.
- **Knobs:** `C.HEAT_KNEE` (6.0), `C.HEAT_FULL_LEVEL` (99), then schedule rows
  (last resort; see `DIFFICULTY-NOTES.md`).

### CS008 P1b (written at P8) — levels 1–4 still tense (K2)
- **Would have done:** played two runs from level 1, one holding fire the whole
  time and one firing only on purpose, with `t` and `e`.
- **Trying to learn:** whether the first four wells still have pressure now that
  holding fire cannot die there (MEASURED 0 deaths in 20 × 60 s). This feeds GDD
  §8.2's target of a first-time player reaching level 4–6. The sweep rule itself
  is settled.
- **Knobs:** `C.SPAWN_INTERVAL`, `C.ENEMY_CONCURRENT`, then `C.HEAT_KNEE`, then the
  Weaver row at 5 (last resort).

---

## Tuning and feel skips

### CS003 P1, CS008 P1 — the Vaulter (`1`)
- **Trying to learn:** whether the flattened X reads as a threat at the throat
  (`VAULTER_SIZE` 0.70), and whether `HIT_DEPTH_TOL` 0.05 lets shots land when
  they look like they should. Also (CS008 P1): whether an enemy parked at 0.95,
  2–9 px inside the rim, reads as "here" rather than "still coming". If it
  doesn't, no knob fixes it; the fix is to draw at 1 and collide at 0.95, which is
  its own call.

### CS003 P2, P4 — level-1 pressure and respawn
- **Trying to learn:** whether `SPAWN_INTERVAL` 1.60 with `ENEMY_CONCURRENT` 3
  feels fair at level 1, and whether `RESPAWN_PUSH_DEPTH` 0.55 plus
  `RESPAWN_INVULN` 1.5 s feels like enough room after a death.

### CS004 P1 — the enemy palette as a set (`0`)
- **Trying to learn:** whether the six provisional enemy colours separate from
  each other and from every band colour, whether the Thorn reads as scenery, and
  whether a Thorn and an arming Surger lane separate from the well's spokes. If
  that turns into retuning global glow constants, `tools/glow-lab.html` (unowned)
  has become necessary.

### CS004 P2, CS005 P4 — the Carrier and its cargo (`2`)
- **Trying to learn:** whether the cargo glyph reads at the throat (GDD §6.2's
  skill), whether it should be stroked in the cargo's colour, and whether
  `CARRIER_CLIMB` 0.11 (nine seconds) reads as "shoot deep, you have time" or as
  slow.

### CS004 P3 — the Weaver and its bolt (`3`)
- **Trying to learn:** whether the Weaver's cycle (climb, fire, retreat) reads
  as a cycle (`C.WEAVER_RETREAT`), whether the unshootable bolt is dodgeable
  (about 1.4 s from apex to rim), and whether a harmless Weaver on the rim reads
  as safe.

### CS004 P4 — the Thorn (`3` then `4`)
- **Trying to learn:** whether a chip is visible (`THORN_TIP_LEN` 0.05), whether a
  full-length Thorn reads as lane denial rather than a wall, and whether an enemy
  hidden behind a Thorn reads as a consequence rather than cheating.

### CS005 P2 — the Drifter (`5`), beyond the ⛔ above
- **Trying to learn:** whether the riding state reads at the throat (a real trade
  against separation), whether a 0.85 s ride against a 0.45 s cross feels
  answerable, whether being lethal in two lanes reads as menace rather than a
  hitbox bug, and whether the vulnerable birth teaches the enemy.

### CS005 P3 — the Surger (`6`), beyond the ⛔ above
- **Trying to learn:** whether the fuse separates from a Thorn (same shape,
  similar colour), whether the Surger stopping to arm reads as bracing rather
  than a glitch, whether a discharging lane reads as lethal end to end, and
  whether a 2.60 s discharge rhythm can be played around.

### CS008 P4 — death fragmentation and the HUD
- **Trying to learn:** whether the fragments read as *your* craft breaking
  (`C.FRAG_DRIFT`, `C.FRAG_SPIN`, `C.HIT_STOP_DEATH` 1.2 s). On a phone, whether
  the HUD clears the thumbs, including left-handed (`C.HUD_TOUCH_INSET_R`).
  Whether reserve craft read as lives, the dim Purge reads as "one weak use"
  (`C.HUD_PURGE_DIM_ALPHA`), and "LEVEL n" reads on every band, including the dim
  band.

### CS008 P5, P6 — the screens on every device
- **Would have done:** gone title → PLAY → CLASSIC → LEVEL 5 → die → RESTART → die
  → QUIT TO TITLE, then pause → OPTIONS → CREDITS → back, on a mouse, keyboard,
  gamepad and phone.
- **Trying to learn:** whether any step leaves a player unsure which input moves,
  confirms or backs out. On a phone: whether taps land in the drag zone and do
  nothing (`C.TOUCH_ZONE_FRAC`, shared with play). With a mouse: whether
  `C.MENU_ROTATE_STEP` 1.0 is too twitchy on the 41-row list. Whether ignoring
  presses during the death freeze reads as an unresponsive menu.

### CS008 P7 — the Controls page on hardware
- **Trying to learn:** whether ×0.5–×2.0 in ×0.1 steps is the right sensitivity
  range on a real mouse and phone (`C.SENS_MIN_MULT`, `C.SENS_MAX_MULT`,
  `C.SENS_STEP`), whether rebinding works on a real pad, and whether a refused
  swap explains itself.

### CS009 P5 — the SFX mix and clutter at high spawn rates
- **Would have done:** played levels 17–30 holding fire, and spent a first Purge
  on a full board.
- **Trying to learn:** whether `fire` at the full cadence tires the ear, whether
  stacked `kill`s blur together (a first Purge plays one per victim, all at once),
  whether the Drifter's birth `cross` reads as a spawn cue (A8 says none), and
  whether menu ticks are too loud next to `title`.
- **Knobs:** each `C.SFX` recipe's `gain` (re-pick in the lab), `C.SFX_KILL_PITCH`,
  and `C.AUDIO_VOL_DEFAULT`.

### CS010 P2 — the menu duck and the event dips on hardware
- **Would have done:** paused and opened OPTIONS mid-run with `pulse` playing,
  then spent a Purge, a weak Purge, lost a life, and crossed an extra-life
  milestone, on speakers and on headphones.
- **Trying to learn:** whether −6 dB under a menu reads as "the game is waiting"
  without sounding broken, whether 0.15 s ramps click or drag, and whether a
  0.5 s dip is heard as a punctuation of the event or as a dropout (a death dips
  inside its own 1.1 s sound).
- **Knobs:** `C.MUSIC_DUCK_GAIN`, `C.MUSIC_DUCK_RAMP`, `C.MUSIC_DIP_GAIN`,
  `C.MUSIC_DIP_HOLD`.

### CS010 P3 — the tiered `pulse` in play
- **Would have done:** played Start Depth 1, 13 and 23 with `pulse`, holding fire,
  through a well clear and a Dive, then let a board fill and died down to the
  last life.
- **Trying to learn:** whether `cycle` (the hook) entering at 0.25 and `tick`
  (the groove) at 0.40 read as the music answering the board, or as layers
  flickering; whether a layer that enters on the bar line ever sounds late to
  the danger that called it; whether the 30 ms gate ramp clicks; whether the
  Dive's release, dropping both at bar lines, reads as relief.
- **Knobs:** `C.LAYER_THRESHOLD` (2 and 3), `C.LAYER_CROSSFADE`, the two `tier`
  fields (re-set in music-lab, COPY TABLE), `C.INT_ATTACK`, `C.INT_RELEASE`.

### CS010 P3 — the limiter on hardware, in three browsers
- **Would have done:** played `pulse` and `title` at unity on laptop speakers,
  headphones and a phone, in Chrome, Firefox and Safari, with a Surger
  telegraphing over the loudest bars of `pulse`'s C section.
- **Trying to learn:** whether −24 dB at ratio 20 pumps or breathes audibly on
  the struck beats; whether Firefox's and Safari's compressors (their detector
  and makeup, which the spec does not pin; plan §11 R3) come out louder or
  softer than Chromium's render (`pulse` −24.30 dB, peak 0.454); and whether the
  Surger tone still stands clear of the music in each.
- **Knobs:** `C.MUSIC_LIMIT` (threshold, ratio, attack, release; ⛔ the knee stays
  0 and the headroom gate pins the rest), the layer gains in music-lab.

### CS010 P3 — `title` at ground 0.45
- **Would have done:** sat on the title, MODE and START DEPTH screens for two
  loops of `title`, on speakers and headphones.
- **Trying to learn:** whether the ground at 0.45 behind the limiter still sits
  under the theme rather than swallowing it, and whether it booms on small
  speakers.
- **Knobs:** `title`'s `ground` gain (music-lab, COPY TABLE).

### CS010 P5 — the Surger tone at every tier, by ear on hardware
- **Would have done:** played Start Depth 13 and 23 with `pulse` until `tick`
  (tier 3) was in, then waited for a Surger to telegraph over the C section, on
  laptop speakers, headphones and a phone; once more with a board thin enough
  that only the foundation played.
- **Trying to learn:** GDD §19's "Surger charge audible over music at every
  tier, verified by ear on hardware". The suite holds it by the limiter-curve
  model and unity gates (`test-cs009-p5.js`), which measures peaks, not what a
  person hears; the render runs up to 2.2 dB over the model.
- **Knobs:** `C.SFX.surgeCharge` `gain` (sfx-lab), `C.MUSIC_LIMIT` threshold,
  `C.LAYER_THRESHOLD`, the tier gains in music-lab.

### CS010 P4 — the rim pulse over a busy rim
- **Would have done:** played `pulse` from Start Depth 1 and 23 with a full
  rim (Vaulters hunting, Surgers telegraphing, shots out), and once in the dim
  band (Start Depth 65), watching the rim through a well clear and a Dive.
- **Trying to learn:** whether the pulse reads as the music's heartbeat or as
  flicker; whether a 1.5× rim stroke on every `heart` onset hides a rim-level
  enemy or the Skimmer's own outline; whether it feels on the beat (the audio
  clock against the display's latency); whether in the dim band the alpha
  lift reads as lanes lighting.
- **Knobs:** `C.RIM_PULSE_TIME`, `C.RIM_PULSE_W`, `C.RIM_PULSE_ALPHA`; which
  layer carries `beat: true` (a three-file data edit).

### CS012 P1 — `drive` by ear
- **Would have done:** played `drive` through two loops on laptop speakers,
  headphones and a phone (MUSIC TRACK DRIVE in a Classic run, since Overdrive is
  not choosable until P3), then switched between PULSE and DRIVE mid-run, and
  watched the rim through the kick.
- **Trying to learn:** whether `drive` reads as the flagship, driving and
  struck; whether the composer's balance holds (no mix was rendered: the kick
  and bass may swallow the `lead`, the noise `snare` and `hat` may be harsh, and
  the F1 bass roots at 44 Hz may vanish on small speakers); whether it sits
  level with `pulse` on a track change; whether 138 BPM is the tempo.
- **Knobs:** every `drive` gain, cutoff and the tempo (music-lab, COPY TABLE).
  ⛔ The solo audition, PASS marks and tiers are Paul's lab work, not a
  playtest; they port as their own commit.

### CS011 P4 — NAME on a pad, a phone and a keyboard
- **Would have done:** named a new profile and renamed it on a gamepad (D-pad
  and stick), on a phone by drag and tap, and on a keyboard by typing; then
  deleted one.
- **Trying to learn:** whether one wheel entry per lane is too slow on a pad
  and too twitchy on a stick or a drag; whether `|` reads as a cursor and SPACE
  reads as a character; whether the mixed-case notice sits right among the
  capitals; whether a keyboard player, whose Space and Z type, finds Enter.
- **Knobs:** `C.MENU_ROTATE_STEP` (shared with every menu), `C.NAME_WHEEL`'s
  order, `C.NOTICE_WRAP`; the cursor mark and the SPACE label in
  `refreshNameLines()`.

### CS011 P5 — a real run posted and read back online
- **Would have done:** served the build over `http://` with `lib/` beside it,
  played a Classic run to game over and one quit from pause, opened SCORES →
  VIEW → ONLINE, then played again offline and watched the title's queued line
  empty when the network came back.
- **Trying to learn:** whether the live Worker accepts the payload from a real
  origin (CORS, the registry's deployed `statsFields`); whether LOADING… reads
  as waiting rather than broken; whether the `*` and the M9 hint are
  understood; whether VIEW as the first row, opening LOCAL on every entry,
  feels right.
- **Knobs:** `C.LEADERBOARD_BOARD_LIMIT`; the VIEW row's place and the entry
  view in `buildScoreRows()` / `toScores`; the state and hint strings there.

### CS011 P6 — storage and the meta screens in Firefox and Safari (plan K4)
- **Would have done:** opened the built file by double-click and the itch.io
  upload in Firefox and Safari (desktop, and Safari on iOS); created a profile,
  moved a volume and a sensitivity, played a run to a local score, reloaded,
  and checked PROFILE, SCORES and game over's line; then repeated in a private
  window.
- **Trying to learn:** whether `file://` storage survives a reload in each
  browser (Chromium was the only one measured, plan §1.1 and §1.6); whether an
  itch.io embed's sandbox blocks storage there, and whether the in-memory
  fallback then plays cleanly; whether a private window's quota fails loudly or
  quietly; whether the screens lay out the same.
- **Knobs:** none in `C`. A browser that loses saves is a note on the itch.io
  page, or kit-storage's fallback (`lib/`, a PATCH with its `.NOTES.md`).

### CS011 P6 — the NAME wheel's feel on a pad
- **Would have done:** (P4's entry above covers three devices; this is the pad
  alone, in depth) named and renamed profiles on an Xbox-style pad with the
  D-pad and with the left stick, spelling a 12-character name with DEL and END,
  and cancelling with Purge.
- **Trying to learn:** whether one wheel entry per `C.MENU_ROTATE_STEP` of rotate
  is slow on the D-pad and overshoots on the stick; whether starting on A and
  staying on the last entry after Fire is the right rhythm; whether DEL and END
  are found at the wheel's end, left of A.
- **Knobs:** `C.MENU_ROTATE_STEP` (shared with every menu), `C.NAME_WHEEL`'s
  order and where DEL and END sit, `C.GAMEPAD_SENS`.

### CS012 P2 — the Reaver read against the Vaulter
- **Would have done:** started Overdrive at START DEPTH 7 on a laptop and a phone,
  played until Reavers and Vaulters were on the board together, at the throat,
  mid-well and at the rim; then Classic at the same depth for comparison, and
  listened to a Reaver kill beside a Vaulter kill with music on.
- **Trying to learn:** whether the two swept barbs tell a Reaver from a Vaulter at
  a glance in the same colour (O16), especially small at the throat; whether a
  hop of 0.175 s reads as a lane change or as a flicker; whether a Reaver hunting
  toward the craft from its first update reads as fair on arrival; whether the
  1.15 kill pitch is recognisably "a faster Vaulter".
- **Knobs:** `C.REAVER_BARB_SWEEP`, `C.REAVER_BARB_REACH`, `C.REAVER_BARB_ROOT`,
  `C.REAVER_SIZE`, `C.REAVER_COLOR` (split it from `VAULTER_COLOR`),
  `C.REAVER_HOP_RATE` (⛔ the hop only, O1); the kill pitch through sfx-lab's KILL
  PITCH table (B 1.06, C 1.33).

## CS012 P3 — MODE's default highlight, and SCORES' layout

- **Changeset / phase:** CS012 P3 (Overdrive at the front door, and its own board).
- **What Paul would have done:** boot the game, press PLAY, and look at MODE
  without choosing anything; then back out to SCORES and step its MODE and VIEW
  rows on a machine with a few local scores and a reachable board.
- **What we were trying to learn:** two things a headless test cannot answer.
  (1) MODE now ships GDD §13's "Overdrive is the default highlight" purely as
  ROW ORDER — OVERDRIVE first, CLASSIC second, both enabled, same colour, no
  mark. Does that actually read as a recommendation, or does it read as an
  arbitrary order, so that a first-time player picks Overdrive without knowing
  the difference? The alternative shape is a detail string, a colour, or a line
  above the rows. (2) SCORES now opens with MODE as its first row and VIEW as
  its second, and the info line carries the mode (`OVERDRIVE · ONLINE`). Is two
  cycling rows above the table one row too many to scan, and does the info line
  do enough work that the MODE row's detail is redundant?
- **Knobs:** the order of `SCREENS.mode.items` (`23-main.js`); a detail string on
  either MODE row; `C.MENU_COLOR` / `C.MENU_IDLE_COLOR` if the highlight wants a
  colour; the order of SCORES' MODE and VIEW rows and whether VIEW cycles four
  states instead (O10's alternative); the info line's wording in
  `buildScoreRows()`.
- ⚠ The entry mode — "the mode of the last run started this session, else MODE's
  first row" (O10) — is the part most likely to surprise, and it is also the part
  a person would notice in one session and a test cannot judge.

## CS012 P5 — the three airborne channels, the high-pass by ear, and the jump on touch

- **Changeset / phase:** CS012 P5 (the Jump).
- **What Paul would have done:** three sittings. (1) An Overdrive run from
  START DEPTH 7 with a mouse, jumping over rim Vaulters and Reavers and a
  Surger's discharge, watching only the craft. (2) The same run with the
  headphones on and the music up, listening for the moment the tune thins.
  (3) The same run on a phone over `npm run serve`, thumb on the drag zone,
  tapping the bottom-right button.
- **What we were trying to learn:** GDD §14.2's ⛔ is the only acceptance
  criterion in this changeset a headless test cannot touch — *"am I airborne?"
  must be unmistakable on three independent channels*, and "unmistakable" is a
  judgment. The suite proves all three are wired, that they engage on the
  takeoff step and release on the landing step, and that none of them can move
  the simulation. It cannot say whether **0.12 rim radii is visible** at a
  glance on the sixteen wells (the shallow ones project the rim close to the
  world edge, where the lift has least room), whether **a 0.6-alpha shadow
  under a bright craft reads as a shadow** rather than as a second craft, or
  whether **700 Hz is the thinning** rather than a mute — `drive`'s bass and
  kick carry most of its weight, so the high-pass may read as the track
  dropping out rather than lifting. Getting this wrong makes every death that
  follows a landing feel arbitrary, which is the concern §14.2 names.
  Sitting (3) is a different question: `TOUCH_BUTTON_R` 56 px at the
  bottom-right corner with auto-fire on — ⛔ §9.3's coupling — is one thumb
  doing two jobs, and whether a jump is reachable **without losing the drag**
  is the thing that decides whether Overdrive is playable on a phone at all.
- **Knobs:** `C.JUMP_LIFT` (0.12 rim radii), `C.JUMP_SHADOW_ALPHA` (0.6),
  `C.JUMP_HP_HZ` (700) and `C.JUMP_HP_TC` (0.03); `C.JUMP_TIME`,
  `C.JUMP_RECOVERY` and `C.JUMP_COOLDOWN` if the window feels wrong rather than
  the read; `C.TOUCH_BUTTON_R` and the button's centre
  (`touchButtonCenters()`, `04-input.js`) for the phone pass;
  `C.HUD_JUMP_SIZE`, `C.HUD_JUMP_GAP` and `C.HUD_JUMP_CRAFT` for the glyph.
- ⚠ **The alternative O7 flagged and we did not build:** the high-pass as a
  short pulse at takeoff (~0.25 s) rather than one held for the whole jump. If
  sitting (2) says the held filter reads as a dropout, that is the shape to
  try — and it is a change to `audioFrame()`'s argument, not to kit-audio.
- ⚠ The glyph's **art** is provisional on the same footing as the Purge glyph's
  and the palette: the suite asserts where its rectangle is, never what it
  looks like.

## CS012 P4 — the combo's feel, its readout, and `comboLost`

- **Would have done:** four sittings, all Overdrive. (1) Started at depth 1 and
  played four or five wells, watching the ×N at the top of the screen and asking
  whether the run *feels* like ×3–4 most of the time, and whether losing it
  reads as something he did rather than something that happened. (2) Parked on
  a busy level 13 board, deliberately stopped firing, and watched the depletion
  ring empty and the multiplier tick down a half step at a time. (3) Played with
  the eyes on the rim, not the readout, and asked whether he could tell the
  multiplier's state from the ring alone — and whether 56 px centre-top is a
  help or a distraction over the throat. (4) Listened to `comboLost` on its own
  and over `drive` at several intensities, and beside `death` and `lifeLost`.
- **What we were trying to learn:** ⛔ **`C.COMBO_KILLS_PER_STEP` is the only
  number in this phase that changes how the game plays**, and O3 MEASURED it on
  bots, not on a person. The plan's table says 4 gives a mean of 4.76 (sharp) /
  3.85 (dull) against GDD §14.4's ×3–4 target, where the literal +0.5 per kill
  gives about ×7 — but a bot has no sense of momentum, and the question §14.4
  actually raises is whether the board turns into a combo-maintenance contest.
  A person would answer that in one sitting; the suite cannot pose it. The
  lapse rule is the other half: O3 keeps the kill count across a lapse, so a
  player who stops for a second loses a half step but not their progress toward
  the next — whether that reads as generous or as mush is a judgment.
  Sitting (3) is GDD §10.3's question in the one place the readout genuinely
  crowds it: MEASURED, the combo rectangle clears the Fan well's throat zone by
  **6.29 px**, which is a pass on the contract and a coin-flip on the eye.
  Sitting (4) is §11.8's: `comboLost` fires far more often than `death` or
  `lifeLost` — several times a well on a mediocre run — so a sound that is a
  shade too loud or too long becomes the thing the player hears most.
- **Knobs:** `C.COMBO_KILLS_PER_STEP` (4) first, then `C.COMBO_WINDOW` (2.5) and
  `C.COMBO_STEP` (0.5); `C.COMBO_MAX` (8) is GDD §14.4's and should not move.
  `C.HUD_COMBO_SIZE` (56), `C.HUD_COMBO_Y` (6), `C.HUD_COMBO_PAD` (4) and
  `C.HUD_COMBO_RING_SEG` (32) for the readout — ⛔ **raising the size re-derives
  the 76.29 px Fan clearance** (GDD §10.4). `C.SFX.comboLost` for the sound,
  through `tools/sfx-lab.html`, which offers candidates B ("triangle slip") and
  C ("noise exhale") beside the shipped A ("saw pair sag").
- ⚠ **What no sitting can settle here:** O14's sweep. MEASURED on played
  Overdrive boards, the director peaks at **0.6519** against the 1.0 the sweep
  needs to open end to end (GDD §19). That is a weights question (`C.INT_W_*`)
  and Paul's D6 ruled out rescaling them, so it is not a playtest — it is a
  number recorded and left alone.

## CS012 P6 — the tenth soak's asks

The soak proves what a machine can prove about Overdrive: that Classic is
untouched by it, that the music cannot steer it, and that its invariants hold on
every step of a played board. ⛔ **Three things it cannot pose, and all three are
about a run rather than a rule.**

- **Would have done:** three sittings, all Overdrive, all at the front door.
  (1) MODE → OVERDRIVE → START DEPTH 1, and played five or six wells without
  looking at anything but the rim — asking whether Overdrive reads as *the same
  game with more in it* or as a different game. The soak's Overdrive session
  runs 121,840 frames through levels 1–16 and cannot tell those apart.
  (2) A run at START DEPTH 13 with the jump button deliberately overused, to find
  out whether **18.8 % of the play steps spent airborne** — which is what the
  scripted driver actually produced, against O6's 39.1 % ceiling — feels like a
  tool or like a crutch, and whether the 509 refused presses read as *the
  cooldown working* or as *the button not working*. ⛔ **A refused press has no
  channel of its own**: the HUD glyph dims and fills, and that is all.
  (3) A run played to a real game over with the eyes on the score, watching the
  combo readout, the jump glyph and the level colour compete for the same glance
  — the one arrangement question CS012 created and no assertion can settle.
- **What we were trying to learn:** ⛔ **whether Overdrive's three additions
  interact**, which is the only question a phase test structurally cannot ask.
  P2 owns the Reaver, P4 the combo and P5 the Jump, and each asserts its own
  behaviour in isolation; P6 asserts that they coexist without breaking an
  invariant. Whether a board with Reavers *and* a live multiplier *and* a jump
  available is fun, legible, or merely busy is a judgment about all three at
  once. The soak's own numbers are the case for asking: 451 kills at multipliers
  from ×1 to ×5, 98 combo losses, 274 takeoffs and 27 dives in one session — a
  lot happening per minute, and nobody has watched any of it.
- **Knobs:** `C.JUMP_COOLDOWN` (1.40) and `C.JUMP_TIME` (0.90) for sitting (2),
  in that order — O6's table gives the airborne share for each origin, so a
  change there is priced. `C.COMBO_KILLS_PER_STEP` (4) for sitting (1), which is
  CS012 P4's ask and the same knob. `C.HUD_COMBO_SIZE` (56), `C.HUD_COMBO_Y` (6),
  `C.HUD_JUMP_SIZE` and `C.HUD_JUMP_GAP` for sitting (3) — ⛔ **raising the combo
  size re-derives the Fan well's 76.29 px clearance** (GDD §10.4).
  `C.REAVER_HOP_RATE` (1.6) is **not** on this list: O1 measured that the climb
  cannot move without re-deriving GDD §4.4's respawn guarantee, and the hop is
  what "1.6×" names.
- ⚠ **What no sitting can settle here, and it is the same one CS012 P4 flagged:**
  O14's sweep. Two independent measurements now agree — 0.6519 on staged boards
  and **0.6448** over 121,840 front-door frames — against the 1.0 the sweep needs
  to open end to end. That is a weights question (`C.INT_W_*`), Paul's D6 ruled
  out rescaling them, and a person listening to it would hear a filter that opens
  most of the way. It is a number recorded and left alone, not a playtest.

## CS013 P1 — the tokens: the drop rate, the rise and hover, the pull, the glyphs and the gold

- **Changeset / phase:** CS013 P1 (tokens: the drop, the life on the board,
  Bounty and Recharge).
- **Would have done:** three sittings, all Overdrive. (1) Played five or six
  wells from START DEPTH 1 and counted the tokens he SAW, asking whether about
  one a well feels like a reward or like noise, and whether the fade-in from the
  throat reads as "something is coming up" or goes unnoticed until it hovers.
  (2) At START DEPTH 13, deliberately chased every token and asked whether
  collection's pull toward danger reads as a choice (GDD 14.1) — above all a
  token hovering in a telegraphing Surger's lane — and whether nine seconds, the
  rise included, is long enough to decide. (3) Stopped on a board with two
  tokens up and named each glyph at a glance, at the hover depth and while
  rising: needle, fan, burst, gem, arc-over-craft. Then listened to `collect`
  over `drive`, beside `kill` and `extraLife`.
- **What we were trying to learn:** ⛔ **`C.TOKEN_DROP_CHANCE` (0.10) was
  measured on two bots** (plan §1.3: 0.77–1.30 tokens per cleared well), and a
  bot is not a player — a human who hunts gets more drops than the held driver
  and fewer than the hunter. Whether gold `#FFF347` separates from the amber
  Carrier, the band Amber and the Weaver's yellow-green at throat depth, where it
  is faded, is a colour judgment. Whether the five glyphs are learnable is GDD
  6.2's own question, asked of a new set.
- **Knobs:** `C.TOKEN_DROP_CHANCE` (0.10) and the curve's `1 + threats`;
  `C.TOKEN_WEIGHTS` (3/2/2/2/1); `C.TOKEN_RISE` (0.30); `C.TOKEN_LIFE` (9.0;
  GDD 14.1's "a beat"); `C.TOKEN_SIZE` (0.80); `C.TOKEN_COLOR`; the five
  `TOKEN_GLYPHS` in `14-render-entities.js`; `C.SFX.collect` (sfx-lab candidate
  A, with B and C beside it). ⛔ `MAX_TOKENS` 2 and `TOKEN_HOVER_DEPTH` 0.80 are
  GDD 14.1's and not knobs.

## CS013 P2 — Lance, Spread and the Ward: the feel of the widened volley, the pierce, and reading the shell

- **Changeset / phase:** CS013 P2 (Lance, Spread and Ward — the three lasting
  effects).
- **Would have done:** three sittings, all Overdrive. (1) Collected a Spread at
  START DEPTH 7 and played the rest of the well, asking whether three lanes at
  the same 15 shots/s reads as *more power* or as *less aim* — and, at an open
  well's wall, whether the two-shot volley feels like a gap or goes unnoticed.
  (2) Collected a Lance and hunted a stacked lane and a thorned lane, asking
  whether "a kill does not consume the shot" is legible from the gold streak
  alone, and whether a 3× chip reads as three chips (three `chip` sounds would
  say so; it ships as one) or as a bigger bite. (3) Took a Ward, then walked
  into a Vaulter, a riding Drifter, a Surger's discharge and a bolt in turn, and
  said out loud each time whether he had just died — the shell, the blink and
  `wardBreak` against the `death` he did not hear.
- **What we were trying to learn:** ⛔ **The Ward is the one effect whose
  failure mode is a player who cannot tell a save from a death.** The shell is
  the craft's own outline scaled by `WARD_SHELL_SCALE` 1.45 in the token gold, at
  alpha 0.85; whether that separates from the craft's own stroke at speed, in the
  dim band (GDD 3.7) and over a lit rim, is a colour-and-weight judgment no test
  makes. ⚠ **And whether `wardBreak` is heard as relief rather than as a loss**:
  its recipe is sfx-lab candidate A and Paul has not picked. Spread's cap of 24
  is MEASURED to hold the facing lane's rate (plan §1.6, `test-cs013-p2.js`), but
  ⚠ **whether 24 streaks on screen breaks GDD 1.1 P2's legibility is exactly
  what a person sees and a rate does not** — and the per-frame allocation that
  comes with them is CS017's to measure (plan F4, K14).
- **Knobs:** `C.SPREAD_SHOT_MAX` (24 = 3 × `SHOT_MAX`) and the volley's lane
  set; `C.LANCE_CHIP_MULT` (3); `C.WARD_SHELL_SCALE` (1.45) and
  `C.WARD_SHELL_ALPHA` (0.85); `C.SFX.wardBreak` (sfx-lab candidate A, with two
  alternates beside it); `C.TOKEN_COLOR`, shared with the tokens themselves.
  ⛔ "One free hit" and "lanes −1, 0, +1" are GDD 14.1's and not knobs.

## CS013 P3 — the Warden: peripheral visibility, a shared fuse tone, and how the jump kill feels

- **Changeset / phase:** CS013 P3 (the Warden — aloft as a phase, the strike,
  and the jump kill).
- **Would have done:** three sittings, all Overdrive, START DEPTH 13. (1) Played
  a full well on each of the sixteen wells' shapes he could reach, with a Warden
  live, and after each one answered ONE question: *did I always know where it
  was?* — including when it hovered over the top lanes, where the combo readout
  overlaps the rim (F1). (2) Stood in a Warden's lane and let it fire, twice: once
  with the music at its loudest tier and once silent, saying out loud each time
  whether the rising tone he heard was a Surger's or the Warden's. (3) Jumped at
  one, ten times: from its own lane, from three lanes away, and mid-rotation
  across it — and said whether killing a thing by *flying into it* reads as a
  kill or as a collision he got away with.
- **What we were trying to learn:** ⛔ **GDD 14.6's ⛔ is a person's judgment
  and nothing else** — "must be visible in peripheral vision; an off-well enemy
  killing you from where you weren't looking is the definition of unfair." The
  lift is MEASURED (§1.5: at 0.06 rim radii nothing leaves the world on any of
  233 lane centres, 7 sit within 18 px of an edge and 11 fall inside the combo
  rectangle against 10 at the rim), but *measured on screen* and *seen while
  playing* are different questions and only the second one is the rule.
  ⚠ **The shared fuse tone is the sharper risk.** W6 gives the Warden the
  Surger's `surgeCharge` voice and its `surgeDischarge` on the grounds that the
  sentence is identical — "the rim of this lane is about to be lethal; leave or
  jump." If a player instead hears *a Surger* and looks down the well for a bar
  that is not there, the sound has cost them the 0.45 s it was meant to buy, and
  the answer is a second held-voice map in `19-sfx.js` rather than a retune.
  ⚠ **And whether one strike per jump is a rhythm or a treadmill**: the cycle is
  2.35 s against the Jump's 2.30 s by construction, which is a number, not a
  feel. A non-jumping player cannot clear a Warden's well at all (W5, MEASURED),
  so how quickly that reads as "jump at it" rather than "the well is stuck" is
  the whole of the onboarding question CS016 inherits.
- **Knobs:** `C.WARDEN_LIFT` (0.06 rim radii ⚠) and `C.WARDEN_COLOR`
  (`#477EFF` ⚠, hue 222°); `C.WARDEN_SIZE` (0.80) and `WARDEN_POLY`'s eight
  points; `C.WARDEN_BEAM_WIDTH` (2.20 ⚠) and `C.WARDEN_TELEGRAPH` (0.45);
  `C.WARDEN_ARM` (0.60), `C.WARDEN_HOVER` (1.60), `C.WARDEN_HOP_INTERVAL`
  (0.90) and `C.WARDEN_HOP_TIME` (0.35); `C.SFX_KILL_PITCH.warden` (0.5,
  sfx-lab candidate A, two alternates beside it). ⛔ `C.WARDEN_DISCHARGE` 0.30
  is bounded by `RESPAWN_INVULN` and is not freely tunable; "killable only by
  Jump", `blocksClear` and the L11 row are GDD 14.6's and W4/W5's, not knobs.

## CS013 P4 — the Mimic: ⛔ THE PROBATION ASK — does a reflected shot read as cheap?

- **Changeset / phase:** CS013 P4 (the Mimic and its `MimicShot` — reflect-then-open,
  the reflected shot, and the one-row cut).
- ⛔ **THIS IS NOT A TUNING ASK. IT IS THE VERDICT GDD §14.6 AND §21 #6 RESERVE**
  — "build it, playtest it, **cut it without ceremony if it reads as cheap**" —
  and CS017 is where the answer lands. Every other entry in this file asks
  whether a shipped thing feels right; this one asks whether a shipped thing
  should exist.
- **Would have done:** three sittings, all Overdrive, START DEPTH 17 (the first
  depth that releases one). (1) Played five wells with fire held the way he
  actually plays, and after each reflection that killed him answered ONE
  question out loud, immediately, before thinking about it: *was that my fault?*
  The count of "no" is the verdict. (2) Played five more wells with fire
  **tapped** rather than held — the Mimic's cycle is built around held fire
  (MEASURED: held fire meets one fifteen times a second, so it costs exactly one
  reflection and dies inside its own 0.5 s window), and a player who taps meets
  a guard that has re-armed. Said whether the second reflection reads as *his*
  mistake or as the enemy cheating. (3) Stood one lane off a Mimic and shot it
  deliberately, ten times, watching only the violet streak: said whether he read
  it as **his own shot coming back** or as a new enemy projectile, and whether
  0.477 s was enough to leave the lane.
- **What we were trying to learn:** ⛔ **Whether the Mimic ships at all.**
  §14.6's concern is a statement about players, not about numbers: "players read
  their own bullets as safe and reversing that betrays a deep expectation." The
  build answers the *fairness* half in arithmetic — ⛔ `MIMIC_APEX` is bounded so
  every reflection gives at least `SURGE_TELEGRAPH` 0.45 s of flight, asserted
  from the constants and on played boards (§6.4), and the reflected shot is
  drawn as the player's own streak, colour-shifted and doubled, so it is
  *legible* as the thing that came back. ⚠ **Legible and fair are not the same
  as ACCEPTABLE**, and the third sitting is the one that separates them: a
  player who reads it correctly, has time to leave, and still feels cheated is
  the case the probation exists for. ⚠ **The second sitting is the sharper
  risk**: the one-reflection budget is a property of HELD fire, and nothing in
  the build gives a tapping player a different Mimic.
- **Knobs:** `C.MIMIC_OPEN_TIME` (0.50 s ⚠ — the window, and the whole budget
  rests on it being longer than the fire cadence); `C.MIMIC_SHOT_RATIO` (0.60,
  GDD §14.6's "60% speed"); `C.MIMIC_SHOT_LEN` / `C.MIMIC_SHOT_WIDTH` (2 / 2 ⚠)
  and `C.MIMIC_COLOR` (`#D447FF` ⚠, hue 286°); `C.MIMIC_SIZE` (0.72 ⚠),
  `MIMIC_POLY_CLOSED` / `MIMIC_POLY_OPEN` and the three read channels
  (`C.MIMIC_CLOSED_WIDTH` 0.70, `C.MIMIC_OPEN_WIDTH` 1.60,
  `C.MIMIC_CLOSED_ALPHA` 0.55 — ⛔ bounded by the headless gate, ratio ≥ 2 and
  alpha ≤ 0.7); `C.MIMIC_CLIMB` (0.16 ⚠); `C.SFX.reflect` and
  `C.SFX_KILL_PITCH.mimic` / `.mimicShot` (1.4 / 1.8, sfx-lab candidate A, two
  alternates each). ⛔ **`C.MIMIC_APEX` 0.40 is NOT a free knob** — it is
  bounded at 0.4308 by the fuse arithmetic, with 0.031 of headroom.
  ⛔ **And the one knob that is not a number: `{ level: 16, kind: "mimic" }` in
  `C.SPAWN_SCHEDULE_OVERDRIVE`.** Deleting that line is the cut, whole.

---

## CS013 P5 — the eleventh soak: is a full Overdrive board one game or four systems?

- **Changeset / phase:** CS013 P5 (the eleventh soak, the review and the close).
- **Would have done:** two sittings on the board the soak plays, and one on the
  thing the soak cannot be. (1) **Overdrive, START DEPTH 17, five wells, fire
  held.** That is the first depth where everything CS012 and CS013 built is on
  the board at once — the Reaver, the Warden, the Mimic, a reflection, up to two
  tokens, the Jump and a multiplier — and the only question is whether it reads
  as one game. After each well, named the one thing he was actually tracking.
  (2) **The same five wells with the HUD covered** except the score, to say
  whether the board alone tells him what he has: a gold streak means Lance, a
  gold shell means Ward, three streaks mean Spread, a bright Purge glyph means
  Recharge — ⛔ **there is no HUD item for any of it** (T10), and that was a
  deliberate call. (3) **Ten deliberate token pickups in a Surger's or a
  Warden's lane**, saying each time whether going for it felt like a choice or a
  gotcha — §14.1's own concern, in the one situation the suite can only count.
- **What we were trying to learn:** ⛔ **Whether P2 survives full density.**
  Every piece of CS013 is legible in isolation and asserted so; the soak proves
  they do not corrupt each other's state, and it proves nothing at all about
  whether a person can read them at the same time. The three specific risks are
  named and none is answerable headless: a token in a lethal lane is a CHOICE
  only if the player can see both in time; the five effects are invisible except
  where they act, which is elegant if it works and a memory test if it does not;
  and ⚠ **the driver has perfect information** — it steers to the deepest
  entity, jumps at anything aloft the instant it is in reach, sidesteps every
  reflection and walks to every token — so ⛔ **every difficulty number in this
  changeset was measured against a player nobody is.**
- **Knobs:** `C.TOKEN_DROP_CHANCE` (0.10 ⚠), `C.TOKEN_WEIGHTS`
  (`{ bounty: 3, lance: 2, spread: 2, ward: 2, recharge: 1 }` ⚠),
  `C.TOKEN_RISE` (0.30 ⚠), `C.TOKEN_LIFE` (9.0) and `C.TOKEN_HOVER_DEPTH`
  (0.80); `C.MAX_TOKENS` (⛔ **2 is GDD §14.1's invariant, not a knob**);
  `C.TOKEN_COLOR` (`#FFF347` ⚠) and `C.TOKEN_SIZE`; and, if the answer is "too
  much at once", ⛔ **the honest lever is `C.SPAWN_SCHEDULE_OVERDRIVE`'s three
  levels (6 / 11 / 16), not a drop rate** — spreading the introductions is
  §8.1's own mechanism and costs one edit.
- ⚠ **And one measurement this sitting would settle by ear:** the director's
  maximum on a full CS013 board is **0.6860** (the highest yet, against CS010's
  Classic 0.668), so the filter sweep reaches 6,187 Hz of its 18,000. ⛔ GDD §19
  keeps its ✗ and nothing is rescaled (Paul's D6) — but whether a sweep that
  never opens is *audible as a sweep at all* is an ear question, and it has now
  been recorded four times without being asked.

## CS014 P1 — the flight itself: is 4.0 s still a breath, and is a full set worth 600?

⚠ **Written at the CS014 close, not at P1.** ⛔ The review found that P1 shipped
two numbers only a person can judge and appended nothing here, which
`CLAUDE.md` requires of any phase that does. The asks are P1's; the date is the
close's.

- **Changeset / phase:** CS014 P1 (the ring flight's simulation half).
- **Would have done:** two sittings, both in Overdrive from START DEPTH 13, ten
  wells each. (1) **The beat.** Play ten wells and say, after each dive, whether
  it felt like a breath or like a job — GDD §1.1 P4's word is *release*, and
  §14.5's own stated concern is that the ring flight "can break P4 by turning
  the breath into more work". ⚠ MEASURED: a 4.0 s dive is **62 % longer** than
  Classic's 2.6 and takes the Dive's share of a run from **13.82 % to 19.80 %**,
  against a mean well of 16.2 s — so one frame in five of an Overdrive run is
  now this beat. (2) **The price.** Play ten wells reading the score after each
  clear and each dive, and say whether six rings felt like a bonus or like
  loose change. ⚠ MEASURED over 108 scored wells: a median well pays **7,200**
  and clear bonuses average 2,951, so a full set at 100 a ring is **600** —
  **8.3 % of a median well**, about a fifth of what the clear bonuses pay, and
  near `PTS_NO_DEATH_WELL` 1,000 in weight.
- **What we were trying to learn:** ⛔ **Whether the cap the GDD wrote as a
  ceiling is the right number to have SHIPPED at.** `C.DIVE_TIME_OD` 4.0 and
  `C.DIVE_RINGS_MAX` 6 are §14.5's hard caps, and ⛔ **both are inside the cap
  at any smaller value** — the plan's RF9-C and RF3-C say so explicitly. The
  suite proves the beat is 4.0 s to the tick, that six rings are laid and
  resolved once each, and that 207 of them were taken and 6 missed on a played
  board. It cannot say whether the fifth second of a still well is a rest or a
  wait, and it cannot say whether a payout is satisfying. ⚠ And the two
  questions interact: a shorter dive makes the same six rings harder to reach,
  which is RF2's skill test getting sharper rather than the flight getting
  cheaper.
- **Knobs:** `C.DIVE_TIME_OD` (4.0 ⚠ — ⛔ **a ceiling, so it may only come
  DOWN**; `C.DIVE_GRACE` 0.35 is a slice off its front and is a §1.1 P2
  requirement, not a knob), `C.DIVE_RINGS_MAX` (6 ⚠ — the same, a ceiling),
  `C.RING_POINTS` (100 ⚠), and the two that set how hard a ring is to reach,
  `C.RING_LANE_STEP` (0.25 ⚠) and `C.RING_ARC_LANES` (1.5 ⚠). ⛔ **No Classic
  constant is on this list**: `C.DIVE_TIME` 2.6 and `C.DIVE_GRACE` 0.35 did not
  move and are not CS014's to move (plan R1).

## CS014 P2 — the Dive you can see: does the descent READ as a flight, and is a miss audible?

- **Changeset / phase:** CS014 P2 (the Dive's visual and the two audio seats).
- **Would have done:** three sittings, all of them on the beat a run spends one
  frame in six in. (1) **Classic, START DEPTH 13, ten wells, watching nothing
  but the dive.** MEASURED at the plan (§1.3): **98 of 134 dives begin with an
  empty board**, so in three dives out of four the descent is the ONLY thing on
  screen — and before this phase there was nothing there at all. The question is
  the one sentence RF7-A turns on: with `C.DIVE_RUNGS` cross-sections of the
  well sweeping rim-ward past a craft that does not move, does it read as
  *flying down the tube*, or as *rings coming up at you*? Named which, out loud,
  on each of the ten. (2) **Overdrive, START DEPTH 13, ten wells, taking rings
  deliberately and missing deliberately.** An Overdrive descent is **3.65 s**
  and lays six rings one every **0.6083 s**; the ask is whether a ring's arc is
  legible far enough out to decide, and whether the decision feels like steering
  rather than luck — ⛔ the whole of RF2's answer is that a ring you must cross
  the well for is a ring you can miss. (3) **The same ten with the screen turned
  away**, saying from `ringTake` and `ringMiss` alone how many of the six he
  took.
- **What we were trying to learn:** ⛔ **Whether the descent is a flight and
  whether a miss is audible — neither is a thing the suite can answer.** The
  suite proves the descent is drawn in both modes, that a rung leaves at the rim
  on the step the descent reaches its depth, that a ring's drawn arc is exactly
  the arc `takeRings()` measures, that nothing is opaque in the throat zone, and
  that none of it moves a hash. It cannot say whether **10 rungs over 2.25 s**
  (Classic) or 3.65 s (Overdrive) reads as motion or as a strobe, whether
  `C.DIVE_RUNG_ALPHA` 0.40 is a texture or a distraction over a board the player
  is supposed to be reading Thorns on during the grace beat, or whether
  aquamarine at hue 165° separates from a **band green** well at levels 81–96.
  And the sound half is the sharper one: ⛔ **"you stop earning" is the ABSENCE
  of a score** (GDD §14.5), so `ringMiss` is the only channel it has —
  and it must never be mistaken for `diveStrike` (0.30), which costs a life on
  the same beat. ⚠ **Both cues sit over `dive`'s 2.4 s rising sweep at 0.22**,
  and sfx-lab plays them in context against it, but the lab is not a dive.
- **Knobs:** `C.DIVE_RUNGS` (10 ⚠), `C.DIVE_RUNG_ALPHA` (0.40 ⚠),
  `C.RING_ALPHA` (0.90 ⚠), `C.RING_ARC_SEG` (16) and `C.RING_COLOR`
  (`#4AFFD1` ⚠) — ⛔ **all five are draw-time only, so every one of them is a
  free tuning knob: moving any of them cannot move a hash** (`test-cs014-p2.js`
  proves it at 0). The two recipes are `C.SFX.ringTake` and `C.SFX.ringMiss`,
  ⛔ **picked in `tools/sfx-lab.html`, never hand-tuned here** — candidate A is
  "sine fifth chime" and "triangle dip", each with two alternates and an
  in-context sequence that lands the rings on the flight's own 0.6083 s.
  ⚠ And if the answer to (2) is "luck", ⛔ **the honest lever is
  `C.RING_LANE_STEP` (0.25 ⚠) or `C.RING_ARC_LANES` (1.5 ⚠), which are
  simulation and P1's**, not a visual constant.

## CS014 P3 — the twelfth soak's asks: does the flight survive a whole run?

- **Changeset / phase:** CS014 P3 (the twelfth soak, the review and the close).
- **Would have done:** one long sitting, Overdrive, START DEPTH 1, played until
  the lives run out — the thing the soak does 26 times and Paul does none of.
  Then the same run in Classic, watching only the dives. The three questions a
  bot cannot answer on its own board: (1) **does the flight stay interesting by
  the tenth well**, or does a beat that pays the same 600 every time become a
  thing you stop steering for; (2) ⛔ **does the ring flight ever collide with
  the Thorn dodge in a way that reads as unfair** — a dive board is empty three
  times in four, but when it is not, the driver that chases rings ignores Thorns
  and the suite counted **11 Thorn deaths, 9 of them repeating the dive**;
  (3) **is the repeat generous or exploitable** — a repeated dive RE-LAYS the
  set, so a life lost buys the rings back (RF3-A), and MEASURED it is worth
  about one set per 19,000 steps rather than a farm.
- **What we were trying to learn:** ⛔ **Whether the three systems CS012–CS014
  added read as one game over a full run.** CS013 P5 asked this of the board;
  this asks it of the beat between boards. The twelfth soak proves the flight is
  correct on every step of 81,278 front-door frames and that nothing in it moves
  a hash, a draw or a baseline — it cannot say whether a player who has just
  cleared a hard well wants a four-second steering task or a rest. ⚠ **And one
  measurement that would settle by ear:** the director's maximum with the flight
  live is **0.6539**, *below* CS013's 0.6860, because a longer release beat
  reads less danger — so the sweep opens even less of its 18 kHz than the four
  times it has already been recorded not opening. ⛔ GDD §19 keeps its ✗ and
  nothing is rescaled (Paul's D6).
- **Knobs:** everything in the two CS014 entries above, and ⛔ **nothing new**:
  the soak added no constant. ⚠ If the answer to (1) is "it goes flat",
  ⛔ **the honest lever is `C.RING_LANE_STEP`, not `C.RING_POINTS`** — a bonus
  that is hard to take stays interesting at a fixed price, and a price that
  rises with nothing behind it is the combo's job (§14.4), which deliberately
  does not multiply a ring.

---

## CS015 P3 — the ACHIEVEMENTS screen, and the `unlock` sound

- **What Paul would have done:** open ACHIEVEMENTS from the title with nothing
  unlocked and again after a run or two, read down the list with the cursor, and
  then play one well with the sound on to hear the unlock land.
- **What we were trying to learn:** three things a measurement cannot answer.
  (1) **Does the list read as goals or as a wall?** 23 lifetime rows plus a
  week's five, with a 7-row window, means a player scrolls; the screen leans on
  a short `name` beside a `n/3` or DONE detail and a one-line `note` for the
  cursor row, and whether that pairing tells you what a row WANTS at a glance is
  a legibility question. ⛔ **A locked row's detail is EMPTY rather than the word
  LOCKED**, deliberately, so the column reads as what has been done — that is
  the specific choice a look would confirm or overturn.
  (2) **Is the `note` line in the right place?** It sits above the rows, so the
  eye travels up from the cursor to read it. Two info lines is the MEASURED
  ceiling (a third pushes the seventh row off the canvas), so the alternative is
  not "more lines" but a different pairing.
  (3) **Does `unlock` land, and does it stay out of `extraLife`'s way?** It is
  candidate A, unauditioned, and it fires on the same step as `wellClear` with
  `dive` 0.3 s behind. ⛔ It PAYS NOTHING, so mistaking it for `extraLife` —
  which does — is the failure mode the recipe is shaped against: a level struck
  fifth where `extraLife` lifts.
- **Knobs:** every `name` and `note` in `C.ACHIEVEMENTS` (⛔ **never an `id`** —
  those are save data), `C.MENU_COL_W`, `C.MENU_VISIBLE_ROWS`, `C.MENU_ROW_H`
  and `C.MENU_TOP_Y` (⚠ the last three are every menu's, not this screen's), the
  DONE / `n/3` detail strings in `23-main.js`, and `C.SFX.unlock` — ⛔ **which is
  re-picked in `tools/sfx-lab.html` and ported verbatim, never hand-tuned here.**
  Its two alternates are in the lab: "square bell pair" and "triangle step up".

---

## CS015 P4 — the thirteenth soak's asks: are the achievements worth chasing?

- **What Paul would have done:** play a normal week of sessions in both modes
  with a fresh profile — no bench keys, the fire button tapped rather than held
  — and open ACHIEVEMENTS at the start and the end of each sitting.
- **What we were trying to learn:** three things every CS015 measurement was
  taken on a BOT to stand in for.
  (1) **Do the week's five feel WEEKLY?** The pool is 18 rows and a week shows
  five; the thirteenth soak's one bot session (eight runs) earned **three of
  W39's five** — `week_forty_kills` and `week_score_50k` in Classic,
  `week_full_set` in Overdrive. If most weeks'
  five fall in a sitting, the rotation is a checklist rather than a reason to
  come back; if some week's five are all Overdrive-only or all hard, a Classic
  player has nothing that week.
  (2) **Are the tiers reachable by a HUMAN, not a hunter?** Every threshold was
  set near half of what a four-clause bot reached in 40,000 steps (GDD §15.5,
  Paul's rule after P2), and ⚠ `C.ACHIEVEMENTS.wellShotPar` 120 came from a
  driver that HOLDS THE TRIGGER — a person who taps may find `week_lean_well`
  free, and a person who dies more may never see `deathless_wells`' top tier.
  (3) **Does the screen tell a player anything?** It is the only surface — no
  toast, by A1 — so an unlock is heard (`unlock`) and never seen until the
  player goes looking. Whether a player ever opens the screen, and whether the
  count line ("N OF 23 · WEEK …") means anything without onboarding, is
  CS016's question as much as this one's.
- **Knobs:** every `tiers` / `at` threshold and `wellShotPar` in
  `C.ACHIEVEMENTS`, `perWeek`, and every `name` and `note` — ⛔ **never an `id`,
  and never the pool's LENGTH after ship** (the rotation walks it by length).
  ⚠ The pre-ship pass in `NEXT-STEPS.md` already owns three threshold calls and
  the two unshipped weekly rows; this ask would inform it, not replace it.

## CS016 P1 — the first-run prompts: do they read, and do they teach?

- **What Paul would have done:** start a fresh profile in each mode, on a desktop
  browser and a phone, and play the first few wells of each without reading
  the GDD — once with hands off for ten seconds, once playing normally.
- **What we were trying to learn:** (1) **does the band read** — a white
  28 px line at y 636, centre-bottom, under every rim, over a board that can
  be busy there (a craft on a bottom lane passes over it; plan §1.4, §1.6);
  (2) **do the glyphs render** — the texts carry `—` and `·` (plan K13), and a
  platform font without them draws a box, not a layout break; (3) **is 4.0 s
  long enough, and a 0.5 s fade soft enough**, when a deep Start Depth queues
  four lines in a first well (sixteen seconds of prompts); (4) **does the first
  line turn a passive player into an active one** — the measured passive death
  is 6.9–11.4 s, three seconds later than GDD §12 once promised (N1-A).
- **Knobs:** `C.PROMPT_TIME`, `C.PROMPT_FADE`, `C.PROMPT_COLOR`,
  `C.PROMPT_SIZE` (⛔ `PROMPT_Y` and the size re-derive the band's clearance,
  asserted in `test-cs016-p1.js`), and any row's `text` (≤ 36 characters).
  ⛔ Never a trigger's level or a heat-clock base.

## CS016 P2 — attract mode: does it read as a demo, and is it heard?

- **What Paul would have done:** open the build fresh from `file://`, touch
  nothing for twenty seconds, watch the demo to its end, then play a run, quit,
  and leave the title idle again; once on a desktop, once on a phone.
- **What we were trying to learn:** (1) **is a demo legible AS a demo** — the
  board and the HUD are exactly a run's, and one white line in the prompt band
  (`DEMO — PRESS ANY KEY`) is all that says otherwise; (2) ⚠ **a fresh load's
  demo is SILENT** (plan K6): the browser opens audio only on a key, click or
  lifted touch, and that gesture ends the demo — only a demo entered after a
  played session has music; whether that silence reads as broken is a human
  call; (3) **does the driver look like a player** — it steers at the keyboard's
  top speed, holds fire and spends a Purge every 5.2 s; (4) **is 45 s at Start
  Depth 5 the right showcase** (MEASURED on the shipped seed: two clears, two
  ring flights with every ring taken, tokens, Vaulter / Weaver / Thorn / Reaver
  / Carrier, no death); (5) ⚠ **"ANY KEY" is not quite true**: an unbound key
  (`q`, Enter, Tab) reaches neither the struct nor a named action and does not
  end the demo (`STATUS.md`).
- **Knobs:** `C.ATTRACT_SEED`, `C.ATTRACT_DEPTH`, `C.ATTRACT_LENGTH`,
  `C.ATTRACT_PURGE_EVERY`, `C.ATTRACT_LINE` (≤ 36 characters) and
  `C.ATTRACT_IDLE`. ⛔ Never `C.ATTRACT_MODE` without Paul, and never a gate.
