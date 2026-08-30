# Vector Vortex — STATUS
Version: 0.0.1 · Changeset: CS002 · Phase: P4 BLOCKED (code done, on-hardware pass pending) · Wells: 16/16 · Tracks: 0/5

## Phase ledger — CS002

- **P1 — the loop and the input struct** · done 2026-08-30 · `src/02-state.js`,
  `src/23-main.js`, `src/04-input.js` (+ `src/04-input.NOTES.md`),
  `scratchpad/test-cs002-p1.js`.

- **P2 — the Skimmer** · done 2026-08-30 · `src/05-skimmer.js`, `src/00-config.js`,
  `src/23-main.js`, `VECTOR-VORTEX-GDD.md` §4.1, `scratchpad/test-cs002-p2.js`.

- **P3 — firing and shots** · done 2026-08-30 · `src/06-shots.js`,
  `src/14-render-entities.js`, `src/00-config.js`, `src/02-state.js`,
  `src/23-main.js`, `VECTOR-VORTEX-GDD.md` §4.2, `scratchpad/test-cs002-p3.js`.
  A shot's lane is captured once, at fire time, from `Math.round(skimmer.lane)`
  through `laneNormalize` — the same target `Skimmer.snap()` uses — and never
  changes afterwards. `state.shotCooldown` counts UP toward `SHOT_COOLDOWN` and
  starts already at the threshold (ready), the same pattern `squashTime` opens
  on. `updateShots(state, well, dt)` ages/spawns/retires shots and runs the
  end-of-frame `.filter()`; new cap enforcement is a plain length check before
  pushing, not a preallocated object pool — every other entity in the build
  (Skimmer, and the enemies to come) follows the same class+filter shape, so
  this stays consistent with that rather than introducing a second lifecycle
  pattern for one entity type. Draw lives in `14-render-entities.js` per the
  phase prompt, split from `06-shots.js`'s simulation: a short rim-ward streak,
  `SHOT_LEN` deep, drawn through `drawPoly`+`glowStroke`, fading linearly from
  opaque to nothing as its leading edge crosses `READABILITY_DEPTH` down to the
  throat (§10.3). No collision pass and no Thorn chipping — out of scope this
  phase, explicitly.

- **P4 — touch, gamepad, feel-lab · closing phase** · CODE DONE, HARDWARE PASS
  BLOCKED 2026-08-30 · `src/04-input.js` (+ `.NOTES.md`), `src/00-config.js`,
  `src/23-main.js`, `tools/feel-lab.html`, `tools/serve-lan.js`, `package.json`,
  `CLAUDE.md`, `scratchpad/test-cs002-p4.js`.
  Touch is a relative drag (world-space coordinates, converted from client
  pixels only in `attach()`), gated to the bottom `TOUCH_ZONE_FRAC`; Purge/Jump
  are circular buttons at radius `TOUCH_BUTTON_R`, mirrored under
  `INPUT_MIRROR`; `TOUCH_AUTOFIRE` holds `fire` for as long as a drag is
  active — no separate fire button. Gamepad: the left stick is a held analog
  position (its own accumulator, gated by `GAMEPAD_DEADZONE`, scaled by
  `GAMEPAD_SENS`), polled once per `sample()` via `pollGamepads(win)` since the
  Gamepad API has no motion events; the D-pad (buttons 14/15) is wired as two
  synthetic bound keys (`bindSynthetic`) so it rides the identical
  `keyDown`/`keyUp`/`advanceAxis`/`releaseAxis` state machine the keyboard
  uses — proven bit-for-bit in the test, not just output-matched. Nine new
  required options; `inputRequireBool` is the boolean sibling of the existing
  `inputRequireNum` guard. `tools/feel-lab.html` duplicates the response
  curves plus CS002 P2's snap assist (held fixed; not what this phase sweeps)
  and reports time-to-target/overshoot/settle-time across `MOUSE_SENS`,
  `KEY_TAP_MS`, `KEY_RAMP`, `GAMEPAD_SENS`; `tools/serve-lan.js` (`npm run
  serve`) makes it and `dist/` reachable from a phone. ⛔ **The phase's
  on-hardware pass — the actual point of a closing phase — has NOT run.** I
  have no physical mouse, keyboard, gamepad, or phone to test with; that
  verification is Paul's to do. See "Open questions (blocking)" below. The
  changeset is therefore NOT closed: `STATUS.md` is not reset, the ledger has
  not moved to `log/CS002.md`, and the two CS002 planning docs are still in
  the repo root, not `archive/`. `node scratchpad/run-all.js` is green with
  zero skips (9 files) — that covers everything sub-hardware.

P2 built the player's craft. `lane` is a continuous float and the simulation
never rounds it: closed wells wrap, open wells clamp, and every lane
arithmetic goes through CS001's `laneNormalize` / `laneDelta` — no two lane
floats are subtracted by hand. Snap assist engages after `SNAP_IDLE_MS` of
quiet, pulls at `SNAP_STRENGTH` toward the nearest lane centre, and stops
inside `SNAP_EPSILON`. ⛔ It is dead while `input.rotate !== 0`; `snapping` is
the flag the suite reads to prove it. The two traps are handled where they
live: the seam target comes back through `laneNormalize` and the direction
through `laneDelta` (short way), and the snap step is capped at the remaining
distance, which is simultaneously what stops overshoot oscillation and what
stops a pull past an open well's clamp.

The `WALL_SQUASH_MS` squash is a count-UP timer (GDD 16.3) that ages *before*
movement each step, so the impact step renders at full squash rather than
losing 42% of it to `dt`. ⛔ It never writes `lane`. The craft draws as one
local-space point array through `drawPoly` + `glowStroke`, projected by
`screenPos` into a preallocated scratch — no per-frame allocation, no fill, no
sprite. `Game.update()` mints it lazily in one place, so `reset()`, boot and a
well change all take the same path.

P1 built the one mutable game object (the fields CS002 owns — eight now that
P3 added `shotCooldown` alongside P1's `shots`), the fixed-timestep loop, and
mouse + keyboard input. The loop clamps
`dt` at `DT_CLAMP_MAX`, runs at most `MAX_CATCHUP_STEPS` steps per frame, and
⛔ **discards** the surplus past the cap rather than banking it — banked debt
is the spiral of death. `Game.update(dt)` and `Game.draw()` are separate and
update never touches the canvas, so the whole simulation runs headless.
`Game.hitStop(s)` freezes simulation time without stopping the frame loop and
leaves no accumulator debt behind it; nothing triggers it yet.

`04-input.js` is kit-shaped from commit one: it reads no `C` and no `state`,
takes every tunable through its factory's options, and splits a DOM adapter
(`attach()`) off a device-agnostic sink (`keyDown`/`keyUp`/`mouseMove`/
`setButton`) so the suite can replay a recorded event list with no DOM. Mouse
is one multiply — ⛔ no acceleration curve. Keyboard is the §9.2 dual mode: a
release inside `KEY_TAP_MS` totals exactly one lane, a hold ramps
`KEY_SPEED_MIN`→`KEY_SPEED_MAX` over `KEY_RAMP`.

CS001 P3's debug well-cycler listener is deleted; well-cycling is now the named
action `cycleWell`, dispatched by the input module during `sample()`. ⛔ One
input path.

## Working / verified

- `node build.js` produces `dist/vector-vortex.html` (24 modules); manifest is
  checked both directions against `src/`.
- `node scratchpad/run-all.js` passes, 8 files, zero skips.
- CS002 P3 verified, 37 assertions: held fire for 10,000 ticks never puts more
  than `SHOT_MAX` shots in flight; a 4,000-tick held-fire soak proves no two
  shots are created less than `SHOT_COOLDOWN` apart, by the simulation clock;
  a shot fired from a fractional lane locks to `Math.round()` of it, and 200
  ticks of adversarial rotation afterward never move it; a shot driven to
  depth 0 retires on its own next `update()`, and the same is true end-to-end
  through the real loop — the array drops it the very next `Game.update()`;
  no NaN in `drawShot`'s projected points on any well, lane or depth; and the
  built file's `06-shots.js` and `14-render-entities.js` slices contain no
  fill, rect, image, pattern, shadow or arc call, with the latter drawing
  through `drawPoly`/`glowStroke`. Known gap: the readability fade's actual
  alpha value is exercised for "throws nothing" only — the stub `ctx` does not
  capture `globalAlpha` in a form this suite asserts on, so the fade-to-zero
  claim rests on reading `shotAlpha()`, not a test oracle.
- CS002 P2 verified, 99 assertions: seven wrap cases on the 16-lane Ring
  including both directions over the seam and multi-lap deltas; a 5,000-tick
  soak of adversarial input (±88-lane mouse deltas, key holds, quiet stretches)
  on each of the six open wells never puts `lane` outside `[0, lanes-1]` or
  makes it non-finite, and each soak provably reaches a wall and idles past
  `SNAP_IDLE_MS`; `snapping` is false on every tick of every soak where
  `rotate !== 0`, and a focused case catches snap mid-pull and proves rotation
  then moves the craft by exactly `input.rotate`; snap settles inside
  `SNAP_EPSILON` and then does not move again; a craft already inside
  `SNAP_EPSILON` is left off the integer rather than rounded onto it; snap
  across the seam never enters the far side of the well and never steps
  backwards; snap from either end of an open well settles on the end lane
  without leaving `[0, lanes-1]`; the squash peaks at 1 on impact, refreshes
  while held, decays to 0, and leaves `lane` bit-identical throughout; no NaN
  in the craft's projected points on any well at any lane or squash; and the
  built file's `05-skimmer.js` slice uses `drawPoly`/`glowStroke` and contains
  no fill, rect, image, pattern, shadow or arc call.
- CS001 closed 2026-08-30 — 16 wells, the depth model, the well renderer. Full
  narrative in `log/CS001.md`.
- CS002 P1 verified: identical state hash over 10,000 ticks of one recorded
  event list, twice in-process and once across processes; a 2-second stall runs
  exactly `MAX_CATCHUP_STEPS` steps and leaves the accumulator under `FIXED_DT`,
  and the frame after it is an ordinary frame; mouse response exactly linear at
  nine magnitudes with exact doubling; tap = one lane, hold monotone to
  `KEY_SPEED_MAX`; the DOM adapter round-trips through fake event targets; and
  the built file, sliced on `build.js`'s module banners, carries no
  `addEventListener`, `e.key`, `.touches`, `getGamepads`, `movementX` or
  `clientX` outside the `04-input.js` slice, and no `C.` inside it.
- `tools/well-lab.html` exists for tuning `PERSPECTIVE_EXP`, `THROAT_SCALE`,
  and the glow constants against a real canvas before porting values in.

## Known issues

- GDD §3.3 lists `throatOffset` in the well shape, but no well defines one and
  the GDD never says what it offsets. `wellThroat` accepts it and defaults it
  to zero (applied after the scale, shifting the whole throat), so the sixteen
  shipped wells are unaffected. ⛔ Its semantics are UNDEFINED, not decided —
  if a later phase wants an offset throat, that is a design call for Paul, not
  an inference from this implementation.
- **P1 hazard for P4's `feel-lab` — the tap/hold constants are coupled.** The
  keyboard ramp is live from the *first* step of a press (a 130 ms dead spot at
  the start of every hold would be worse than the alternative), so a tap's
  release pays only the *balance* of the one lane the ramp has not already
  delivered. ⛔ That requires the ramp integrated over `KEY_TAP_MS` to be at
  most one lane. At the shipped values it is ≈0.76. Raising `KEY_TAP_MS` or
  `KEY_SPEED_MIN/MAX` past that relation makes the balance clamp to zero and a
  tap silently becomes "however far the ramp got" — the module cannot detect
  it, and `test-cs002-p1.js`'s tap case is what fails. Recorded in
  `src/04-input.NOTES.md` too.
- **P1 judgment call — devices are still drained during hit-stop.** The frozen
  branch of the frame loop calls `input.sample()` but not `update()`. Without
  it a 1.2 s death freeze would dump 1.2 s of accumulated mouse motion into the
  first live step after it. Simulation time stays frozen either way. Flagged
  because CS006 owns the death sequence and should confirm the reading.
- **P1 judgment call — the `cycleWell` debug binding is a literal in
  `23-main.js`, not in `C`.** `04-input.js` cannot read `C`, and the key name
  is a string binding rather than a numeric tunable, so `C`'s invariant is not
  in play; the module's own default keymap (`INPUT_KEYS_DEFAULT`) lives beside
  it for the same reason. If Paul wants bindings tunable from `C`, the shape is
  a `C.KEY_BINDINGS` object that `23-main.js` forwards through the same options
  object — no change to the module.

- **P2 hazard, and it belongs to the WELL DATA, not the Skimmer — the Flat
  well is geometrically degenerate.** Well 11's rim is a straight horizontal
  segment, so its centroid lies *on* that segment and `wellThroat` scales the
  rim onto itself: rim and throat are collinear and the whole well projects to
  a single horizontal line with zero vertical extent. Every other well has real
  depth. Nothing in CS002 caused it and nothing in CS002 is wrong because of
  it, but the Flat well is unplayable as shipped and it is now visible, because
  P2 is the first phase that draws something standing in a well. ⛔ Do not
  "fix" it by special-casing the Skimmer. It is the same neighbourhood as the
  `throatOffset` issue above — an offset throat is exactly what would give a
  straight rim its depth — and both are one design call for Paul. Reading
  ahead: CS004 owns well progression and would be the natural place to land it.

- **P2 judgment call — `SKIMMER_COLOR` is `#FFFFFF`, and the GDD never said.**
  §10 specifies the well's band palette and nothing about the craft, but the
  Skimmer cannot be drawn without a colour. White was chosen because the craft
  must be the most legible thing on screen (§1.1 pillar P2) and it is distinct
  from every band colour except White at levels 97–99, which is past any
  realistic ceiling. Recorded in GDD §4.1 with a ⚠. One constant to change.

- **P2 judgment call — two constants were added beyond the phase's list.**
  `SKIMMER_SQUASH` (0.35, peak fraction of width lost) and `SKIMMER_COLOR`.
  The squash had a duration in `C` but no amplitude, and both are tunables, so
  ⛔ "every tunable lives in `C`" put them there rather than inline. The
  silhouette itself is a local-space point array in `05-skimmer.js`, per GDD
  §10.2 — shape DATA, the same class of thing as `WELLS`' rim polygons.

- **P2 note — `laneWrap` perturbs an already-legal float by up to one ulp on
  first contact** (3.4 → 3.3999999999999986) and is a fixed point thereafter,
  so it does not drift over a session. It does mean a test must compare against
  the craft's own `lane`, never the number handed to the constructor.
  `test-cs002-p2.js` says so where it matters.

- **P4 judgment call — gamepad has no `fire`/`purge`/`jump` button mapping.**
  GDD §9.4 specifies only the left stick and the D-pad; it names no button for
  any of the three actions, and neither does the P4 phase prompt. Rather than
  invent one silently (CLAUDE.md: "do not invent design; do not quietly pick a
  reading"), a connected gamepad can rotate and D-pad-tap/hold but cannot fire.
  This does not block the phase's stated acceptance criterion — GDD §9's
  requirement is "traverse a third of the well and stop on the intended lane,"
  which does not require firing — but it means gamepad is not fully playable
  yet. Paul's call: which buttons (a likely default is button 0 for fire, one
  bumper for purge, another face button for jump), or defer full gamepad play
  to a later changeset.

- **P4 note — `pollGamepads()` is polled, not event-driven, and only
  gamepad 0 is read.** The Gamepad API has no motion events; `sample()` polls
  once per simulation step through whatever `window` `attach()` was given.
  Multiple connected pads are unsupported by design — GDD doesn't describe
  local multiplayer or a pad-selection UI, so reading only index 0 is the
  narrowest reading rather than a guess at unspecified scope.

## Open questions (blocking)

- **CS002 P4's on-hardware pass has not run.** GDD §9's acceptance criterion —
  "a player must be able to traverse a third of the well and stop on their
  intended lane, on every supported device" — is verified in this changeset
  only synthetically, by `tools/feel-lab.html`'s duplicated response-curve
  model and by `scratchpad/test-cs002-p4.js`'s unit assertions on the real
  `04-input.js` code. Neither substitutes for playing it: I have no physical
  mouse, keyboard, gamepad, or phone to test with, and `IMPLEMENTATION-PHASES-
  CS002.md` P4 is explicit that `file://` on a phone does not count as a test
  either. **Paul needs to run the four-device pass himself** (`npm run serve`
  serves `tools/feel-lab.html` and `dist/vector-vortex.html` over LAN for the
  phone leg) and report back pass/fail plus the traverse-and-stop feel for
  each device, so the changeset's closing steps — moving the ledger to
  `log/CS002.md`, resetting this file, archiving the two CS002 planning docs —
  can happen with real numbers rather than placeholders. Until then CS002
  stays open and P4 stays unclosed.

## Carried tasks (not blocking CS002)

- Register `vector-vortex` in the Worker's `services/leaderboard/src/registry.js`
  with the seven stats keys, before any submission is attempted.
- `src/04-input.NOTES.md` backport status is `not yet` — deliberately held
  until P4 adds touch and gamepad, so coinless-kit receives one module with all
  four device paths rather than a partial one that changes shape immediately.
- ~~Vendor kit modules~~ — done. All four (`kit-names` 0.1.0, `kit-storage`
  0.1.0, `kit-profile` 0.1.1, `kit-leaderboard` 0.2.0) are in `lib/`, unmodified,
  each with a `.NOTES.md`.
- ~~Re-home CS001 P3's debug well-cycler~~ — done in P1.

## Next up

- **Paul runs CS002 P4's on-hardware pass** (see "Open questions (blocking)")
  — the only thing left before CS002 closes. Once it's done, whoever closes
  the changeset: record the constants and the four devices' traverse-and-stop
  numbers in `log/CS002.md`, move the CS002 phase ledger there, reset
  `STATUS.md` for CS003, and move `PLANNED-FEATURES-CS002.md` +
  `IMPLEMENTATION-PHASES-CS002.md` into `archive/`.
- The Skimmer exposes `lane`, `snapping`, `squashAmount()` and `dead`. Nothing
  sets `dead`; death is CS006's.
- Shots exist now (`state.shots`, `X.Shot`, `updateShots`) but there is still
  no collision pass — a Thorn or an enemy cannot yet be hit. That is explicitly
  out of scope through P4 and lands with whichever later changeset owns
  collision (GDD §9, `09-collision.js`).

## Playtest asks (open only)

- None yet.
