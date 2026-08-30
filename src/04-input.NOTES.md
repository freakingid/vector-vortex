# kit-input — change notes

**Module:** `src/04-input.js`
**Vendored from:** *originated here (Vector Vortex), destined for coinless-kit as `kit-input`*
**Current version:** `0.1.0`
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
| `pointerLockOffer` | no (default `true`) | Offer Pointer Lock on click. Never forced; refusal is a normal path. |
| `keys` | no | Binding override, shape of `INPUT_KEYS_DEFAULT`. Matched case-insensitively. |
| `actionKeys` | no | `{ actionName: ["key", …] }` — host-named actions (debug keys, screen toggles). |
| `onAction` | no | `(name) => void`, called during `sample()`, in simulation order. |

**Surface**

```js
const input = createInput({
  mouseSens: 0.022, keyTapMs: 130,
  keySpeedMin: 4, keySpeedMax: 14, keyRamp: 0.35,
  actionKeys: { cycleWell: ["w"] },
  onAction: (name) => { /* host acts */ },
});

input.attach({ window, document, element: canvas });  // DOM adapter, optional
input.sample(dt, hostStruct);   // writes {rotate,fire,purge,jump}, allocates nothing
input.reset();                  // clears every held key and pending delta
input.detach();
```

Device events also enter directly through the sink — `keyDown(key)`,
`keyUp(key)`, `mouseMove(dx)`, `setButton(name, down)` — which `attach()` is a
thin wrapper over. **That split is the module's most important structural
property:** everything except `attach()` runs with no DOM at all, so a host's
test suite can replay a recorded event list headlessly and get a byte-identical
result. A kit module that can only be exercised through a browser is a kit
module nobody writes a determinism test for.

**Two behaviours worth knowing before wiring it**

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
