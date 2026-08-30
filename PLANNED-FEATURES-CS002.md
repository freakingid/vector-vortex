# PLANNED-FEATURES-CS002 — Control: loop, input, Skimmer, shots

**Changeset:** CS002 · **Status:** not started · **Depends on:** CS001 complete
**GDD sections in scope:** §2 (core loop), §4.1–4.2 (movement, firing), §9 (all
of controls), §10.2 (rendering rules), §16.1 (non-negotiables), §17 items 1 and 4

---

## Why this changeset exists

P1 — control fidelity above all — is the pillar that cannot be recovered later.
Every other system can be retuned by editing a constant. A rim that feels
imprecise is felt through everything built on top of it, and every one of those
systems has to be re-felt when the rim changes. So the rim is proved first,
against a measurement, before there is anything to shoot at.

The requirement from §9, restated because it is the acceptance criterion the
whole changeset serves: **a player must be able to traverse a third of the well
and stop on their intended lane, on every supported device.**

## What ships

- **P1 — the loop and the input struct.** `src/02-state.js` (the one mutable
  game object), `src/23-main.js` (fixed-timestep accumulator, clamped `dt`,
  bounded catch-up, the hit-stop hook), `src/04-input.js` (mouse and keyboard →
  one struct). Input is built kit-shaped for later extraction as `kit-input`,
  with `src/04-input.NOTES.md` from commit one.
- **P2 — the Skimmer.** `src/05-skimmer.js`: continuous `lane` float, wrap on
  closed wells and clamp on open ones, the `WALL_SQUASH_MS` end squash, snap
  assist, and the Skimmer drawn through `drawPoly` / `glowStroke`.
- **P3 — firing and shots.** `src/06-shots.js` plus shot rendering in
  `src/14-render-entities.js`: lane-locked shots, the `SHOT_MAX` cap, cooldown,
  auto-fire on hold, travel over `SHOT_TIME`, retirement at the throat.
- **P4 — touch, gamepad, and the instrument.** The remaining two device paths
  into the same struct, and `tools/feel-lab.html`, which measures
  traverse-and-stop rather than asking how it feels. P4 is the closing phase.

### Constants this changeset adds to `C`

⛔ Every one of these lands in `src/00-config.js`, grouped, before it is used
anywhere. Values are starting points, not settled; `feel-lab` is what settles
the four marked ⌁.

| Group | Constant | Proposed | Note |
|---|---|---|---|
| Loop | `FIXED_DT` | `1/60` | Sim step. GDD §17 drives tests at `1/60`. |
| Loop | `DT_CLAMP_MAX` | `0.25` | s. A tab-switch stall never becomes a physics event. |
| Loop | `MAX_CATCHUP_STEPS` | `5` | Bounds the accumulator; prevents the death spiral. |
| Skimmer | `SKIMMER_WIDTH` | `0.9` | Lane widths at the rim. |
| Skimmer | `SNAP_EPSILON` | `0.01` | Lane units; below this snap is settled and stops. |
| Shots | `SHOT_LEN` | `0.06` | Depth units, for the drawn streak. |
| Mouse | `POINTER_LOCK_OFFER` | `true` | ⛔ Offered on click, never forced (§9.1). |
| Gamepad | `GAMEPAD_DEADZONE` | `0.15` | ⌁ |
| Gamepad | `GAMEPAD_SENS` | `12.0` | ⌁ Lane-units/sec at full stick deflection. |
| Touch | `TOUCH_BUTTON_R` | `56` | px at 1280×720, for the Purge and Jump buttons. |
| Touch | `INPUT_MIRROR` | `false` | Left-handed layout swap (§9.3). |

`MOUSE_SENS`, `KEY_TAP_MS`, `KEY_SPEED_MIN/MAX`, `KEY_RAMP`, `TOUCH_SENS`,
`TOUCH_ZONE_FRAC`, `SNAP_IDLE_MS`, `SNAP_STRENGTH`, `WALL_SQUASH_MS`,
`SHOT_MAX`, `SHOT_TIME`, `SHOT_COOLDOWN` already exist and are not re-declared.
`KEY_TAP_MS` and `KEY_RAMP` are the pair §9.2 calls the most feel-critical in
the game; they are ⌁ too.

## Acceptance criteria

**The abstraction**

- [ ] ⛔ The simulation reads `state.input` and nothing else. A source scan of
      the built file, sliced on `build.js`'s module banners, finds no
      `addEventListener`, `e.key`, `.touches`, `getGamepads`, `movementX` or
      `clientX` outside the `04-input.js` slice.
- [ ] ⛔ `04-input.js` reads no game global — no `C`, no `state`. Every tunable
      arrives through the options object its factory takes, and `23-main.js` is
      what passes them in from `C`. The same scan finds no `C.` inside the
      `04-input.js` slice.
- [ ] `src/04-input.NOTES.md` exists, from `lib/MODULE-NOTES-TEMPLATE.md`.

**The loop**

- [ ] Determinism (§17.1): the same seed and the same recorded input event list
      produce an identical state hash after 10,000 ticks, across two runs in one
      process and across two processes.
- [ ] `dt` is clamped at `DT_CLAMP_MAX`; a simulated 2-second stall produces at
      most `MAX_CATCHUP_STEPS` steps in one frame and leaves the accumulator
      bounded.
- [ ] Hit-stop freezes simulation time without stopping rendering, and consumes
      no accumulator budget when it ends.

**Movement**

- [ ] Mouse is linear: for every magnitude tested, doubling `Δx` exactly doubles
      `Δlane`. ⛔ No acceleration curve.
- [ ] Keyboard tap — key released within `KEY_TAP_MS` — moves exactly one lane,
      landing within `SNAP_EPSILON` of a lane centre once snap has settled.
- [ ] Keyboard hold ramps `KEY_SPEED_MIN` → `KEY_SPEED_MAX` over `KEY_RAMP`,
      monotonically.
- [ ] ⛔ Snap assist is inactive whenever `input.rotate !== 0`, and engages only
      after `SNAP_IDLE_MS` of no rotation input.
- [ ] Snap takes the short way across the seam on a closed well, and never pulls
      the Skimmer past the clamp on an open one.
- [ ] Closed wells wrap: from lane 15.7 on a 16-lane well, `+0.6` lands on 0.3.
- [ ] ⛔ Open wells clamp: `skimmer.lane` stays inside `[0, lanes-1]` on all six
      open wells across a 5,000-tick soak of adversarial input.
- [ ] The wall squash is visual only — it never writes `skimmer.lane`.

**Firing**

- [ ] ⛔ Shots in flight never exceed `SHOT_MAX` under held fire for 10,000
      ticks (§17.4), and the shot array length stays bounded over the same run.
- [ ] Cooldown spacing holds: no two shots are created less than
      `SHOT_COOLDOWN` apart.
- [ ] ⛔ A shot's lane is captured at fire time from the nearest lane centre and
      never changes afterwards. Rotating the Skimmer after firing leaves every
      in-flight shot's lane untouched.
- [ ] Shots follow the entity contract — class, `update(dt)`, `draw()`, `dead`,
      end-of-frame `.filter()`, never spliced mid-loop.
- [ ] A shot reaching depth 0 is retired, freeing its slot the same frame.

**Devices**

- [ ] Touch drag in the lower `TOUCH_ZONE_FRAC` produces the same `rotate`
      values as the equivalent mouse motion scaled by `TOUCH_SENS / MOUSE_SENS`.
      It is a relative drag, not a virtual stick.
- [ ] ⛔ `TOUCH_AUTOFIRE` is `true` and touch play needs one thumb for rotation.
      This is coupled to Jump's existence (§9.3, §14.2) and is not simplified.
- [ ] Gamepad left stick X is proportional past `GAMEPAD_DEADZONE`; the D-pad
      routes through the *same* tap/hold implementation as the keyboard — one
      code path, asserted, not two that agree today.

**The instrument**

- [ ] `tools/feel-lab.html` runs a traverse-and-stop trial: given a start lane
      and a target a third of the well away, it records time to target,
      overshoot in lane units, and settle time, and prints a table across
      `MOUSE_SENS`, `KEY_TAP_MS`, `KEY_RAMP` and `GAMEPAD_SENS` values.
- [ ] Traverse-and-stop verified by hand in `feel-lab` on **all four devices**,
      with the chosen constants and the measured numbers recorded in
      `log/CS002.md`.
- [ ] ⛔ On-hardware pass: mouse and keyboard on the laptop, touch on a phone
      against the served build, gamepad on the USB pad. A device that cannot
      traverse a third of the well and stop on its intended lane fails the
      changeset — it is not a tuning note for later. See decision 4.
- [ ] `feel-lab` is reachable over LAN from the phone, or the phone pass is run
      against `dist/` served over LAN. `file://` on a phone is not a test.

**Close**

- [ ] `node build.js` and `node scratchpad/run-all.js` both green, zero skips.
- [ ] `CLAUDE.md`'s design-instruments list gains `tools/feel-lab.html`.
- [ ] `log/CS002.md` written, `STATUS.md` reset to CS003.

## ⛔ Scope boundaries — what this changeset does NOT touch

No enemies, no collision targets, no spawner — shots travel to the throat and
expire, and that is the whole of their lifecycle for now. No Purge *behaviour*:
`input.purge` is populated and nothing reads it. No lives, no death, no respawn,
no hit-stop *trigger* (the hook exists; nothing calls it). No Dive, no well
progression — the well is whichever one CS001's debug key selected. No scoring,
no HUD beyond a debug readout that is deleted in CS006. No audio: this changeset
does not create an `AudioContext`. No meta systems. No Overdrive — `input.jump`
is a field in the struct and nothing more; the Jump *mechanic* is CS010.

⛔ **`state` gains only the fields these four phases own.** A field added now
"because CS003 will need it" is a field CS003 cannot see the reasoning for.

## Known hazards

**Two input paths.** CS001 P3 ships a debug key that cycles the sixteen wells,
and it will have its own listener. ⛔ P1 deletes that listener and re-homes
well-cycling as a named debug action on the real input module. Leaving both is
exactly the failure §9.5 exists to prevent, and it will not announce itself —
it will show up as an input that works everywhere except one screen.

**The kit boundary costs a parameter list.** `04-input.js` taking eleven
tunables through an options object is more verbose than reading `C` directly,
and the temptation to "just read `C`, it's right there" is real. It is also the
one thing that makes the module extractable, which is why it was chosen
deliberately (`CLAUDE.md`, Kit modules and extraction).

**Snap assist against wrap.** Snapping toward the nearest lane centre across the
seam of a closed well is the classic place a naive implementation takes the long
way round. CS001 P2 built the wrap helper; P2 here must use it rather than
subtract two floats.

## Assumptions and decisions

| # | Decision | What would change it |
|---|---|---|
| 1 | P2 is the Skimmer, honouring CS001's scope note ("that is P2 of CS002") | Nothing. It is free to honour and avoids a stale pointer in a shipped doc |
| 2 | `FIXED_DT` is `1/60`, not `1/120` | GDD §17 specifies tests driven at `1/60`. If the rim proves visibly steppy at 60 Hz on a 120 Hz display, raise it — but that is a `feel-lab` finding, not a guess |
| 3 | The fixed-timestep loop lands in CS002, not CS001 | CS001 needs only a draw call. If CS001 P3 builds a real loop rather than scaffolding, P1 here inherits and hardens it instead of writing one |
| 4 | On-hardware verification on all four devices gates CS002. Paul's call, 2026-08-30 — a phone and a USB pad are to hand | Nothing. This is the pillar the changeset exists to prove, and a synthetic event through the harness cannot tell you whether a thumb can stop on a lane. If a device is unavailable on the day, the phase stops and says so rather than passing on the automatable half |
| 5 | Shots are built now, with nothing to hit | Firing feel — cooldown, cap, travel time — is half of control feel, and tuning it against a moving target in CS003 means tuning two things at once |
| 6 | `feel-lab` measures rather than demonstrates | An instrument that only shows the game is a second renderer to maintain. A table of overshoot numbers survives being read six months later |
| 7 | Purge and Jump appear in the input struct with no consumer | §9.5 fixes the struct's shape. Adding fields to it later means auditing every device path again |
| 8 | Debug well-cycling survives as a named debug action rather than being deleted | It is how every later phase looks at a shape without playing to it. If it costs anything to keep, it goes |
