# Vector Vortex — STATUS
Version: 0.0.1 · Changeset: CS002 · Phase: P1 done · Wells: 16/16 · Tracks: 0/5

## Phase ledger — CS002

- **P1 — the loop and the input struct** · done 2026-08-30 · `src/02-state.js`,
  `src/23-main.js`, `src/04-input.js` (+ `src/04-input.NOTES.md`),
  `scratchpad/test-cs002-p1.js`.

P1 built the one mutable game object (seven fields, exactly the ones CS002
owns), the fixed-timestep loop, and mouse + keyboard input. The loop clamps
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
- `node scratchpad/run-all.js` passes, 6 files, zero skips.
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

## Open questions (blocking)

- None.

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

- CS002 P2 — the Skimmer (`src/05-skimmer.js`): continuous `lane` float, wrap
  on closed wells and clamp on open ones, the wall squash, snap assist, drawn
  through `drawPoly`/`glowStroke`. See `IMPLEMENTATION-PHASES-CS002.md`.
- P2 hangs its update off the marked line in `Game.update()` in `23-main.js`,
  and reads `state.input.rotate` as a **lane delta for the step**, not a
  velocity — it is already scaled by `dt` where that matters.

## Playtest asks (open only)

- None yet.
