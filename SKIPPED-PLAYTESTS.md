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
`levelRecord().noteCleared(81)` unlocks every odd level to 81 for that session.
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
