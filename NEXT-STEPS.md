# NEXT-STEPS — Vector Vortex

Work that is **specified but not yet scheduled**: a defect found or a decision
taken outside the phase flow, written up in enough detail that a fresh session
can act on it without the conversation that produced it.

⛔ **Not session context.** A build or planning phase does not read this file
unless its prompt names it. It is picked up deliberately — *"read
`NEXT-STEPS.md` and plan the rim fix"* — and never loaded by default.

**How this file is maintained**

- ⛔ **An entry is DELETED by the session that acts on it**, in the same commit
  that lands the plan or the fix. This file is a queue, not a record; the record
  is `log/CS0##.md` and `DECISIONS.md`. An entry left here after its work landed
  is a stale pointer, which is the one failure mode this file has.
- ⛔ **Every figure names the commit it was measured at**, and an entry that
  reproduces measurements from a conversation says so, because ⛔ a session that
  acts on it **re-measures before planning against it** (`CLAUDE.md` rule 3b).
- An entry names the design calls that are **Paul's**, and leaves them open. ⛔ A
  handover is not authority to decide what the game does.

---

## Crossing a rim enemy while holding fire must always kill it

**Found 2026-09-13 by Paul, playing the CS008 P1 build (`22c75b5`).** Once a
Vaulter reaches the rim he cannot move past its lane without dying, and cannot
last ten seconds on level 1. ✅ **Paul's call is made** (`DECISIONS.md`,
2026-09-13): with fire held, an enemy at the rim that the Skimmer moves onto or
across **always dies**. It supersedes `PLANNED-FEATURES-CS008.md` R4. ⛔ **Sequence:
this lands before CS008 P2.**

**The mechanism** (P1's arrival fix does not cover it — plan §1.2). No shot can
be in a lane before the Skimmer enters it, so the only shot that can save the
player is one fired on the entry step. The fire cadence is 4 steps, so that shot
exists on about one entry step in four.

**MEASURED at `22c75b5`, in a throwaway probe — ⛔ re-measure before planning.**
Level 1, Ring, spawner held, Skimmer at lane 0, a `Vaulter(2, 1 - C.RIM_CONTACT_DEPTH, 1)`
placed after 0..23 steps of pre-fire, `ArrowRight` held until lane 4:

| Variant | killed | died |
|---|---|---|
| shipped, fire held | 6 | **18** |
| shipped, no fire | 0 | 24 |
| re-arm cooldown when `round(skimmer.lane)` changes (copy) | 17 | **7** |

⚠ **PREDICTED, not measured:** the re-arm's 7 residual deaths are the Vaulter's
rim hunt hopping toward a moving Skimmer and meeting it between lane centres,
where contact (continuous lane, `HIT_LANE_TOL` 0.5) kills but the shot's lane
(`Math.round`) is not the Vaulter's. The planning session finds out.

**Also known:** plan §1.2 measured the re-arm's cost — mouse jitter across a lane
boundary fires every step, up to `SHOT_MAX`.

**Paul's to decide, left open:**
- whether that jitter cost is acceptable, if the plan's fix carries it;
- whether the fix changes what contact means at the rim, if it needs to;
- how the phase is numbered (inserting one before P2, or a renumber).

**The already-settled reading:** a Skimmer **not** holding fire still dies on
contact (`DECISIONS.md`, flagged there).

**Acceptance, for the plan to sharpen:** the crossing probe above, fire held,
24/24 on a closed and an open well, through `Game.update()`, mutation-checked;
the P1 arrival table stays 24/24.
