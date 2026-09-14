# kit-menu — change notes

**Module:** `src/15-render-hud.js` — the menu half (`createMenu`, `drawMenu`,
`menuWindowStart`). The HUD half (`drawHud`, `hudLayout`) shares the file and
is not part of this packet.
**Vendored from:** *originated here (Vector Vortex), destined for coinless-kit as `kit-menu`*
**Current version:** `0.1.0` (`MENU_VERSION`)
**Depends on:** a host text path and a polyline stroke for `drawMenu` only
(`drawText`, `drawPoly`, `glowStroke` in Vector Vortex). The model depends on
nothing.

---

## Contract summary

`createMenu({ rotateStep })` is a cursor over a list of rows, driven by an
input snapshot once per simulation step, that returns an **action name**. The
host owns the screens and what every name does; the model owns only the
cursor, the rotation accumulator and the button edges.

**⛔ The model reads no host global.** No config object, no game object, no
game function. `rotateStep` is its one tunable and is required.

```js
const menu = createMenu({ rotateStep: 1.0 });

const title = { back: null, items: [
  { label: "PLAY",    detail: "", enabled: true,  action: "play" },
  { label: "LOCKED",  detail: "", enabled: false, action: "never" },
] };

// once per step, on every screen that is a menu:
const action = menu.step(currentScreen, { rotate, fire, purge });
if (action) host.run(action);

// whenever the host's screen changes, by any route:
menu.reset();

// a back request from outside the snapshot (a named key):
menu.back();

menu.cursor;   // the row index, for drawing and for reading a row's own data
```

**The screen.** `{ items, back }`. Each item is `{ label, detail, enabled,
action }`, and the host may add its own fields (Vector Vortex's START DEPTH rows
carry `value`) and read them through `menu.cursor`. `back` is the action name
Purge and `back()` return, or `null` for a root screen, where both do nothing.

**The snapshot.** `rotate` is a signed delta in the host's own units — the one
`rotateStep` is measured in — and `fire` / `purge` are levels (held or not).
kit-input's struct is exactly this shape.

**Five behaviours worth knowing before wiring it**

1. **Fire and Purge are rising edges** against the previous step's levels. A
   held button confirms once.
2. **Rotate accumulates.** Each whole `rotateStep` moves one row; the remainder
   is kept. With kit-input, `rotateStep` 1.0 makes a keyboard tap exactly one
   row (a tap is exactly one lane, measured exact at every tap length) and a
   mouse flick several.
3. **The cursor clamps and skips.** It never wraps, and it steps over rows that
   are not `enabled`, so a disabled row is shown and cannot be chosen.
4. **`reset()` makes the next step an ENTRY step.** The cursor goes to the
   first enabled row, the accumulator empties, the current levels are latched
   as already held, a queued `back()` is dropped, and the step returns `null`.
   A press that began before the screen appeared — the press that opened it, or
   one made during a host freeze — needs a release before it acts. ⛔ The host
   must call `reset()` on **every** screen change, including ones the menu did
   not cause; Vector Vortex does it from one place that compares the screen each
   step.
5. **Back wins a tie.** If a back and a confirm land on the same step, the back
   is returned.

`drawMenu(ctx, view)` draws `view.title`, `view.lines` (centred), then a window
of `view.items` that follows `view.cursor` (`menuWindowStart(count, cursor,
visible)` is the pure arithmetic), with a chevron on the cursor row and a
locked colour on disabled rows.

---

## Known gaps before extraction

- **`drawMenu` reads the host config for sizes and colours** (`C.MENU_*`), as
  `drawHud` does beside it. Extraction owes a `style` options argument.
- **No pointer hit-testing.** A touch host confirms with a tap *somewhere*, not
  a tap *on a row*. Vector Vortex pairs this with kit-input 0.4.0's tap source.

---

## Changes

Newest last. One entry per change.

### 2026-09-13 — first cut (`VERSION` — → 0.1.0)

**What changed.** New module: `createMenu`, `step`, `reset`, `back`, `cursor`;
`drawMenu`; `menuWindowStart`.

**Why.** Vector Vortex CS008 P5 — the title, mode, Start Depth, options and game
over screens, navigated by Rotate / Fire / Purge with Escape as a second back
(Paul, U1).

**Game-agnostic?** Yes. The model names no Vector Vortex concept: screens and
actions are host data, and the host's test suite scans `createMenu`'s body in
the built file for the config object, the game object and the well table.

**Backport status.** `not yet` — Vector Vortex P6 (pause, Options) and P7 (the
Controls page) are pages on this model and may change its shape first.
