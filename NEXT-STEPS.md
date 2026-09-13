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

_Empty. The rim hit-window defect was planned as `CS008 P1` on 2026-09-13 —
`PLANNED-FEATURES-CS008.md` §1–§2._
