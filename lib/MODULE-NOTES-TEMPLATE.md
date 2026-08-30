# <module-name> — change notes

**Copy this file to `<module-name>.NOTES.md` beside the module.** It is the
backport packet: someone merging this module into coinless-kit reads only this
file, not Vector Vortex's decision history.

**Module:** `<module-name>.js`
**Vendored from:** coinless-kit @ `<VERSION>` *(or: originated here, destined for kit)*
**Current version:** `<VERSION>`

---

## Contract summary

One paragraph: what the module does, and what the game must supply. Name every
parameter and callback that crosses the boundary. A reader should be able to
wire it into a different game from this section alone.

```js
// minimal wiring example
```

---

## Changes

Newest last. One entry per change.

### YYYY-MM-DD — <short title> (`VERSION` X.Y.Z → X.Y.Z)

**What changed.** The edit, concretely.

**Why.** What broke or was missing. Name the phase or bug.

**Game-agnostic?** Yes — <how you know>. No dependency on Vector Vortex state,
config, or vocabulary. *(If the answer is "no", the change does not belong in a
kit module — put it in the game's wrapper instead.)*

**Backport status.** `not yet` / `backported YYYY-MM-DD` / `rejected — reason`
