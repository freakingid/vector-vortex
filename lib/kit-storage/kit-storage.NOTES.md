# kit-storage — change notes

**Module:** `lib/kit-storage/kit-storage.js`
**Vendored from:** coinless-kit `main` @ VERSION `0.1.0` (untagged in kit)
**Current version:** `0.1.0` — unmodified
**Depends on:** nothing

## Contract summary

⛔ **This module owns the keyspace.** All keys are `coinless.<gameId>.<key>`;
the game does not choose raw `localStorage` key names. `create({gameId, keys})`
declares every key with a version and optional `migrate`; `get`/`set` on an
undeclared key throws. `scope(id)` returns the same interface over a longer
prefix — that is the mechanism kit-profile uses for per-profile data.

Degrades rather than throwing: blocked storage (sandboxed embed) and quota
failures both fall back to an in-memory shim and emit an event.

```js
const store = KitStorage.create({ gameId: C.GAME_ID, keys: { … } });
```

## Changes

*None. Vendored unmodified.*
