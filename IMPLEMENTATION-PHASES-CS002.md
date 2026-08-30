# IMPLEMENTATION-PHASES-CS002

One phase per Claude Code session. `/clear` between phases. Commit per phase on
`main`; never push.

Each phase below is the literal prompt to paste. Keep them self-contained — a
session reads `CLAUDE.md` and `STATUS.md` automatically, and nothing else unless
the prompt names it.

⛔ **`ultrathink` appears inside the prompt text where it is wanted.** It is a
per-turn lever, not a session setting, so it has to be in the pasted message.
P1 and P2 carry it; P3 and P4 do not need it.

---

## P1 — the loop and the input struct

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §0, §1, §2, §9,
> §16.1. Then read `CLAUDE.md`'s "Kit modules and extraction" section again
> before you write `04-input.js` — that module is being built kit-shaped.
> ultrathink.
>
> Build three modules.
>
> `src/02-state.js` — the one mutable game object. Only the fields this
> changeset owns: `screen`, `wellIndex`, `level`, `time`, `input`, `skimmer`,
> `shots`. Do not add a field because a later changeset will want it.
>
> `src/23-main.js` — the fixed-timestep loop. Accumulator, `C.FIXED_DT`,
> `dt` clamped at `C.DT_CLAMP_MAX`, at most `C.MAX_CATCHUP_STEPS` catch-up steps
> in one frame, and a hit-stop hook that freezes simulation time without
> stopping `requestAnimationFrame`. `update(dt)` and `draw()` are separate and
> `update` never touches the canvas — the whole simulation has to run headless.
>
> `src/04-input.js` — four devices to one struct, mouse and keyboard only in
> this phase. Mouse is relative horizontal motion, `Δlane = Δx * MOUSE_SENS`,
> ⛔ with no acceleration curve; Pointer Lock is offered on click and never
> forced. Keyboard is the tap/hold dual mode from §9.2: release inside
> `KEY_TAP_MS` moves exactly one lane, hold ramps `KEY_SPEED_MIN` to
> `KEY_SPEED_MAX` over `KEY_RAMP`. Output is exactly
> `{ rotate, fire, purge, jump }`. `purge` and `jump` are populated and have no
> consumer yet; that is intended.
>
> ⛔ `04-input.js` reads no game global. No `C`, no `state`. Every tunable
> arrives through the factory's options object and `23-main.js` passes them in
> from `C`. Write `src/04-input.NOTES.md` from `lib/MODULE-NOTES-TEMPLATE.md` in
> this same commit.
>
> ⛔ CS001 P3 left a debug key that cycles the sixteen wells, with its own
> listener. Delete that listener and re-home well-cycling as a named debug
> action on the real input module. Two input paths is the exact failure §9.5
> exists to prevent.
>
> Add to `C` in `src/00-config.js`, grouped: `FIXED_DT` (1/60), `DT_CLAMP_MAX`
> (0.25), `MAX_CATCHUP_STEPS` (5), `POINTER_LOCK_OFFER` (true).
>
> Write `scratchpad/test-cs002-p1.js` asserting: the same seed and the same
> recorded input event list give an identical state hash after 10,000 ticks; a
> simulated 2-second stall produces at most `MAX_CATCHUP_STEPS` steps and leaves
> the accumulator bounded; mouse response is exactly linear at several
> magnitudes; a tap inside `KEY_TAP_MS` moves exactly one lane and a hold ramps
> monotonically; and a source scan — slice the built file on `build.js`'s module
> banner comments — finds no `addEventListener`, `e.key`, `.touches`,
> `getGamepads`, `movementX` or `clientX` outside the `04-input.js` slice, and
> no `C.` inside it.
>
> Do not build the Skimmer, shots, touch, or gamepad. Update `STATUS.md` and
> commit.

---

## P2 — the Skimmer

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §0, §1, §3.5,
> §4.1, §10.2. ultrathink.
>
> Build `src/05-skimmer.js`. `skimmer.lane` is a continuous float and is never
> quantized in the simulation. Closed wells wrap; open wells clamp to
> `[0, lanes-1]` with a `C.WALL_SQUASH_MS` visual squash. Use the wrap and clamp
> helpers CS001 P2 built — do not subtract two lane floats by hand.
>
> Snap assist per §4.1: after `C.SNAP_IDLE_MS` with no rotation input, draw the
> Skimmer toward the nearest lane centre at `C.SNAP_STRENGTH`, and stop when
> within `C.SNAP_EPSILON`. ⛔ Snap is never active while `input.rotate !== 0`.
>
> Two traps worth slowing down for. Snapping across the seam of a closed well
> must take the short way — this is the same class of bug the depth model exists
> to prevent. And on an open well, snap must not pull the Skimmer past the
> clamp at either end.
>
> ⛔ The squash is visual only. It never writes `skimmer.lane`.
>
> Draw the Skimmer through `drawPoly` and `glowStroke` from CS001 P3, as a
> local-space point array. No per-entity draw pipeline, no fill, no sprite.
>
> Add to `C`: `SKIMMER_WIDTH` (0.9 lane widths), `SNAP_EPSILON` (0.01).
>
> Write `scratchpad/test-cs002-p2.js` asserting: wrap arithmetic on a 16-lane
> closed well, including across the seam; a 5,000-tick soak of adversarial input
> on each of the six open wells never puts `lane` outside `[0, lanes-1]`; snap
> is inactive on every tick where `input.rotate !== 0`; snap settles within
> `SNAP_EPSILON` of a lane centre and then stops moving; snap across the seam
> takes the short way; and the squash leaves `lane` unchanged.
>
> Do not build firing, shots, touch, or gamepad. Update `STATUS.md` and commit.

---

## P3 — firing and shots

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §0, §1, §4.2,
> §10.2, §10.3, and §17 item 4.
>
> Build `src/06-shots.js` and the shot draw in `src/14-render-entities.js`.
>
> A shot is an entity under the class contract: `constructor` / `update(dt)` /
> `draw()` / `dead`, killed by setting `dead = true`, removed by an end-of-frame
> `.filter()`. ⛔ Never splice mid-loop. A fixed pool of `C.SHOT_MAX` is the
> natural shape here and satisfies the no-per-frame-allocation rule.
>
> ⛔ A shot's lane is captured at fire time from the *nearest lane centre* — not
> the Skimmer's continuous position — and never changes afterwards. Shots are
> lane-locked; rotating after firing leaves them where they were.
>
> Travel is rim to throat over `C.SHOT_TIME`; cooldown is `C.SHOT_COOLDOWN`;
> holding fire auto-fires. A shot reaching depth 0 is retired and frees its slot
> the same frame. There is nothing to collide with in this changeset — do not
> add a collision pass, and do not add Thorn chipping.
>
> ⛔ Respect the readability contract when drawing: nothing opaque below
> `C.READABILITY_DEPTH`. A shot streak near the throat fades.
>
> Add to `C`: `SHOT_LEN` (0.06 depth units).
>
> Write `scratchpad/test-cs002-p3.js` asserting: held fire for 10,000 ticks
> never puts more than `SHOT_MAX` in flight and never grows the shot array past
> its bound; no two shots are created closer than `SHOT_COOLDOWN` apart; a shot
> fired and then followed by heavy rotation still reports its original lane; and
> a shot at depth 0 is gone the next frame.
>
> Do not build touch, gamepad, or `feel-lab`. Update `STATUS.md` and commit.

---

## P4 — touch, gamepad, feel-lab · closing phase

> Read `CLAUDE.md`, `STATUS.md`, then `VECTOR-VORTEX-GDD.md` §0, §1, §9.3, §9.4,
> §9.5. This is the closing phase for CS002.
>
> Extend `src/04-input.js` with the remaining two device paths. It still reads
> no game global; new tunables go through the same options object.
>
> Touch: relative horizontal drag anywhere in the lower `C.TOUCH_ZONE_FRAC` of
> the screen, same sensitivity model as mouse at `C.TOUCH_SENS`. ⛔ It is a
> relative drag, not a virtual stick. ⛔ `C.TOUCH_AUTOFIRE` is true — touch play
> needs one thumb for rotation, and that decision is coupled to Jump's existence
> (§14.2). Do not simplify it. Purge button top-right, Jump bottom-right, both
> radius `C.TOUCH_BUTTON_R`, mirrored when `C.INPUT_MIRROR` is set.
>
> Gamepad: left stick X proportional past `C.GAMEPAD_DEADZONE`, scaled by
> `C.GAMEPAD_SENS`. ⛔ The D-pad routes through the *same* tap/hold
> implementation the keyboard uses — one code path, not two that agree today.
>
> Add to `C`: `GAMEPAD_DEADZONE` (0.15), `GAMEPAD_SENS` (12.0),
> `TOUCH_BUTTON_R` (56), `INPUT_MIRROR` (false).
>
> Build `tools/feel-lab.html`. It measures rather than demonstrates: given a
> start lane and a target a third of the well away, it records time to target,
> overshoot in lane units, and settle time, and prints a table across a range of
> `MOUSE_SENS`, `KEY_TAP_MS`, `KEY_RAMP` and `GAMEPAD_SENS` values. It
> duplicates whatever slice of logic it needs — drift there produces a bad
> preview, never a bad build. Add it to `CLAUDE.md`'s design-instruments list in
> this commit.
>
> Write `scratchpad/test-cs002-p4.js` asserting: a synthesized touch drag
> produces the same `rotate` value as the equivalent mouse motion scaled by
> `TOUCH_SENS / MOUSE_SENS`; stick input inside the deadzone produces exactly
> zero; and the D-pad and the keyboard reach the same tap/hold implementation —
> assert the shared path, not two matching outputs.
>
> Then run the on-hardware pass. ⛔ All four devices, against the real build:
> mouse and keyboard on the laptop, gamepad on the USB pad, touch on a phone
> with `dist/` served over LAN — `file://` on a phone is not a test. The
> criterion is §9's: traverse a third of the well and stop on the intended lane.
> A device that cannot do it fails the changeset. Stop and report rather than
> recording it as a tuning note for later. Make `feel-lab` reachable over LAN
> too, so the phone numbers come from the instrument and not from an impression.
>
> Then close the changeset. Run `node scratchpad/run-all.js` and confirm green
> with zero skips. Record the constants chosen in `feel-lab`, and the
> traverse-and-stop numbers for all four devices, in `log/CS002.md`. Move the
> CS002 phase ledger into `log/CS002.md` and reset `STATUS.md` for CS003.
>
> Then move `PLANNED-FEATURES-CS002.md` and `IMPLEMENTATION-PHASES-CS002.md`
> into `archive/`. ⛔ Move, do not copy — the repo root holds only the changeset
> in flight, which is what makes `archive/`'s never-read-by-default contract
> worth having. `log/CS002.md` stays where it is; the log is the narrative and
> the archive is the spent plan, and a session pulling one should not get the
> other. Commit.

---

## Assumptions and decisions

| # | Decision | What would change it |
|---|---|---|
| 1 | Four phases, with `ultrathink` on P1 and P2 only | P1 owns determinism and the kit boundary; P2 owns the two wrap traps. P3 and P4 are prescriptive enough that the lever buys little |
| 2 | P1 carries three modules | `02-state.js` is a field list and `23-main.js` is a loop; `04-input.js` is the phase's real work. If P1 overruns, split the loop out as a P0 next time and renumber |
| 3 | Each phase writes one test file, named for the phase | Matches CS001. Global counts stay in `test-registry.js`, which none of these four phases touches — CS002 adds no counted inventory |
| 4 | P4 is the closing phase rather than a separate P5 | CS001 has no explicit closing phase; folding the close into the last phase keeps that shape while honouring `CLAUDE.md`'s STATUS-reset rule. If closing work crowds P4, split it |
| 6 | The closing phase archives both CS002 planning docs | Root holding only the in-flight changeset is what makes `archive/`'s never-read contract useful. If the docs turn out to be referenced often after close, they belong in `log/` instead, not in root |
| 5 | The debug well-cycler is re-homed rather than deleted | Later phases need a way to look at a shape without playing to it. If it costs anything to keep, it goes |
