# DIFFICULTY-NOTES — Vector Vortex

⛔ **One clock: `game.level`.** Every difficulty-scaled value derives from it
through `heat(level)`. No parallel clocks, no per-system counters.

```js
heat(level) = C.HEAT_BASE
            + C.HEAT_RISE * (1 - exp(-(level-1) / C.HEAT_KNEE))
            + C.HEAT_LINEAR * (level-1)
```

Fast early rise so levels 1–5 teach quickly, then near-linear, so late levels
are relentless without becoming arbitrary.

## What heat drives

| Derived value | Direction | Clamp |
|---|---|---|
| Spawn interval | falls | `SPAWN_MIN` floor |
| Concurrent enemies | rises | ⛔ `C.ENEMY_CAP` |
| Enemy climb speed | rises | — |
| Vault interval | falls | — |
| Surge frequency | rises | — |
| Weaver thorn length | rises | lane length |
| Carrier cargo weights | shift toward Drifter/Surger | — |

⛔ **`C.ENEMY_CAP` is a READABILITY constraint, not a difficulty constraint.**
Difficulty past the cap comes from faster and meaner, never from more. Raising
the cap to make the game harder is the fastest route to a game that feels cheap.

## Introduction schedule

Continuous heat, gated introductions — the player should be able to *name* what
changed.

| Level | Introduced |
|---|---|
| 1 | Vaulters (non-vaulting) |
| 2 | Vaulting |
| 3 | Carriers |
| 5 | Weavers, Thorns |
| 8 | First open well |
| 9 | Drifters |
| 13 | Surgers |
| 18 | Drifter Carriers |
| 23 | Surger Carriers |
| 27 | Full mix; heat alone |

## Tuning targets

Measure against these with the harness, not by feel.

| Player | Expected peak level |
|---|---|
| First-time | 4–6 |
| Competent, after an hour | 15–20 |
| Strong | 30–40 |
| Level 50 | A genuine achievement |
| Level 99 | A legend |
