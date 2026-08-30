# kit-input — change notes

**Module:** `src/04-input.js`
**Vendored from:** *originated here (Vector Vortex), destined for coinless-kit as `kit-input`*
**Current version:** `0.2.0`
**Depends on:** nothing

---

## Contract summary

`createInput(options)` collapses every supported input device into one struct —
`{ rotate, fire, purge, jump }` — and hands it to the host once per simulation
step. The host's simulation never learns which device produced a value, and
never reads a raw key map.

**⛔ The module reads no host global.** No config object, no game object, no
game function, in either direction. Every tunable arrives through `options`;
the host is what passes them in. Numeric tunables are *required* and throw when
missing, deliberately: a default inside this module would be a second tuning
surface competing with the host's config, and the host's config must stay the
only one.

`rotate` is a **lane delta for the step just sampled**, not a velocity. Mouse
motion is inherently a delta, and expressing it as a velocity means dividing by
`dt` — which is how a linear response quietly stops being linear. A rotational
host multiplies it by whatever its own "lane" means; a host with no lanes can
read it as "one unit of its discrete axis".

**Options**

| Option | Required | Meaning |
|---|---|---|
| `mouseSens` | yes | Lane units per pixel of relative motion. ⛔ Applied as one multiply — no acceleration curve. |
| `keyTapMs` | yes | A key released inside this window moves **exactly one** lane. |
| `keySpeedMin` | yes | Lane units/sec at the start of a hold. |
| `keySpeedMax` | yes | Lane units/sec at the top of the ramp. |
| `keyRamp` | yes | Seconds from `keySpeedMin` to `keySpeedMax`. |
| `touchSens` | yes | Lane units per pixel of relative touch drag. Same linear model as `mouseSens`, its own sensitivity. |
| `touchZoneFrac` | yes | Bottom fraction of `worldH` that starts a rotation drag. |
| `touchButtonR` | yes | Radius, in world-space px, of the Purge/Jump touch buttons. |
| `touchAutofire` | yes (boolean) | Fire is held for as long as a rotation drag is active — no separate fire button. ⛔ Coupled to the Jump button; see the module header. |
| `gamepadDeadzone` | yes | Stick magnitude below this contributes exactly zero. |
| `gamepadSens` | yes | Lane units/sec at full stick deflection past the deadzone. |
| `inputMirror` | yes (boolean) | Moves the Purge/Jump touch buttons to the left edge, for left-handed play. |
| `worldW` / `worldH` | yes | World-space size the touch buttons and rotation zone live in — the same fixed space every entity uses, not the window's pixel size. |
| `pointerLockOffer` | no (default `true`) | Offer Pointer Lock on click. Never forced; refusal is a normal path. |
| `keys` | no | Binding override, shape of `INPUT_KEYS_DEFAULT`. Matched case-insensitively. |
| `actionKeys` | no | `{ actionName: ["key", …] }` — host-named actions (debug keys, screen toggles). |
| `onAction` | no | `(name) => void`, called during `sample()`, in simulation order. |

**Surface**

```js
const input = createInput({
  mouseSens: 0.022, keyTapMs: 130,
  keySpeedMin: 4, keySpeedMax: 14, keyRamp: 0.35,
  touchSens: 0.030, touchZoneFrac: 0.40, touchAutofire: true, touchButtonR: 56,
  gamepadDeadzone: 0.15, gamepadSens: 12.0,
  inputMirror: false, worldW: 1280, worldH: 720,
  actionKeys: { cycleWell: ["w"] },
  onAction: (name) => { /* host acts */ },
});

input.attach({ window, document, element: canvas });  // DOM adapter, optional
input.sample(dt, hostStruct);   // writes {rotate,fire,purge,jump}, allocates nothing
input.reset();                  // clears every held key and pending delta
input.detach();
```

Device events also enter directly through the sink — `keyDown(key)`,
`keyUp(key)`, `mouseMove(dx)`, `setButton(name, down)`, `touchStart(id, x, y)`,
`touchMove(id, x, y)`, `touchEnd(id)`, `pollGamepads(win)` — which `attach()`
is a thin wrapper over (the touch trio takes world-space coordinates directly;
`attach()` is what converts a real `Touch`'s client pixels into that space).
**That split is the module's most important structural property:** everything
except `attach()` runs with no DOM at all, so a host's test suite can replay a
recorded event list headlessly and get a byte-identical result. A kit module
that can only be exercised through a browser is a kit module nobody writes a
determinism test for.

`pollGamepads(win)` is the one sink entry that is polled rather than pushed —
the Gamepad API has no motion events, so `sample()` calls it once per step
using whatever `win` `attach()` was given. A host with no `attach()` (or a
headless test) can call it directly with a plain
`{ navigator: { getGamepads: () => [...] } }`.

**Three behaviours worth knowing before wiring it**

1. **Tap/hold dual mode.** A digital key delivers both spinner affordances: a
   release inside `keyTapMs` produces exactly one lane of total displacement,
   while a longer press ramps continuously from the first step. The ramp is
   *not* suppressed during the tap window — a dead spot at the start of every
   hold is worse than the small settle-up at release — so a tap's release pays
   only the balance of the lane the ramp has not already delivered. ⛔ This
   requires the ramp integrated over `keyTapMs` to be **at most one lane**. At
   Vector Vortex's values it is ≈0.76. Past 1.0 the balance clamps to zero and
   a tap silently becomes "however far the ramp got", which is a tuning bug the
   module cannot detect for you.
2. **Named actions dispatch during `sample()`, not at event time.** A debug key
   pressed between two steps fires inside the next step, in order. Dispatching
   at DOM-event time would land host mutations halfway through a frame and
   break replay determinism.
3. **The D-pad is not a second axis model.** `pollGamepads()` turns D-pad
   buttons 14/15 into synthetic key presses (`keyDown("gamepadleft")`, etc.)
   fed through the exact same `keyDown`/`keyUp`/`advanceAxis`/`releaseAxis`
   path a real keyboard key uses. The left stick genuinely is a second thing —
   a held analog position rather than a discrete press — so it gets its own
   accumulator, gated by `gamepadDeadzone` and scaled by `gamepadSens`. Touch
   rotation is the third case, and it is not new: a drag is summed into the
   same kind of pixel-delta bucket mouse motion uses, just multiplied by
   `touchSens` instead of `mouseSens`.

---

## Changes

Newest last. One entry per change.

### 2026-08-30 — first cut: mouse and keyboard (`VERSION` — → 0.1.0)

**What changed.** New module. The sink API, `sample(dt, out)`, the tap/hold
keyboard model, relative-mouse rotation, Pointer Lock offered on click, named
host actions, and the `attach()`/`detach()` DOM adapter. Mouse and keyboard
only; touch and gamepad are the next cut and go through the same sink and the
same `sample()` — one code path, not two that agree today.

**Why.** Vector Vortex CS002 P1. The host needs one input abstraction from its
first playable commit; retrofitting one after four device paths exist means
auditing all four.

**Game-agnostic?** Yes. The module names no Vector Vortex concept — not the
Well, not the Skimmer, not the Purge as a *mechanic*. `purge` and `jump` are
struct field names the host chose and the module treats as opaque button
labels, exactly like `fire`; a different host renames them through `keys` and
`actionKeys` and nothing inside changes. No config object, no game object, no
game function is referenced, and the host's test suite asserts that by scanning
the built file's slice for this module.

**Backport status.** `not yet` — hold until the touch and gamepad paths land
(Vector Vortex CS002 P4), so the kit receives one module with all four devices
rather than a partial one that changes shape immediately.

### 2026-08-30 — touch and gamepad, the remaining two devices (`VERSION` 0.1.0 → 0.2.0)

**What changed.** `touchStart(id, x, y)` / `touchMove(id, x, y)` / `touchEnd(id)`
— a relative drag in world-space coordinates, gated to the bottom
`touchZoneFrac` of `worldH`, plus two touch buttons (Purge top-right, Jump
bottom-right, radius `touchButtonR`, mirrored to the left edge when
`inputMirror` is set). `touchAutofire` holds `fire` for as long as a drag is
active. `pollGamepads(win)` — left stick X past `gamepadDeadzone`, scaled by
`gamepadSens`; D-pad left/right (buttons 14/15) routed through the SAME
tap/hold state machine the keyboard uses, via two synthetic bound keys
(`bindSynthetic`). `attach()` gained `touchstart`/`touchmove`/`touchend`/
`touchcancel` listeners and the client-to-world coordinate conversion; it also
now stores the `window` reference `pollGamepads()` polls from, once per
`sample()`. Nine new required options (`touchSens`, `touchZoneFrac`,
`touchButtonR`, `touchAutofire`, `gamepadDeadzone`, `gamepadSens`,
`inputMirror`, `worldW`, `worldH`) — `inputRequireBool` is the boolean sibling
of the existing `inputRequireNum` guard, for the two boolean tunables.

**Why.** Vector Vortex CS002 P4, the closing phase — the module now covers all
four devices GDD §9 describes.

**Game-agnostic?** Yes. `worldW`/`worldH` describe the host's fixed coordinate
space, not a Vector Vortex concept (a well, a lane, a depth); a different host
supplies its own screen size and gets the identical rotation-zone and button
math. Purge/Jump are still opaque struct-field names the host chose, exactly as
`fire` already was. No config object, no game object, no game function is
referenced — the host's test suite extends the same source-scan that caught
this in P1.

**Backport status.** `not yet` — this is the natural point to backport (all
four devices now exist), but that is a separate, manual step per `CLAUDE.md`,
done once this changeset is verified on real hardware.
