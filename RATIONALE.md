# RATIONALE — Vector Vortex

Why the rules in `CLAUDE.md` exist. **Not read by default** — pull one section
when a rule's scope is genuinely ambiguous. `CLAUDE.md` states rules; this file
states reasons, keyed by anchor.

---

## #music-layers

`CLAUDE.md` requires the melody in the always-on foundation tier, and requires
every gated layer to pass a solo audition. Both rules are paid for.

Orbital Overhaul built intensity layering (v3.4 P7) and froze it (v3.5). Two
findings from that game's own GDD:

1. **The trigger was wrong.** Layers gated on `musicIntensity(wave) =
   1 − e^-(w−1)/8`, a smooth curve over wave number that moved once per wave and
   was unaffected by anything the player did. Its tier-4 threshold (0.70) first
   crossed at **wave 11** — with the lead voice gated at tier 4, no gameplay
   track had an audible melody for most of a typical run. That was the actual
   cause of the "no melody" complaint, not a synthesis problem.

2. **Re-tiering was tried and rejected on audition.** The composed tiers were
   built, loaded, and played back at every intensity step. On every track the
   preferred mix was the foundation alone: the thickening read as clutter, not
   intensification.

Vector Vortex re-opens that decision deliberately (Paul, 2026-08-30) on the
diagnosis that finding 2 was **compositional, not architectural** — the layers
were, in his words, undefined and muddy. A layer written as *more texture on
top* has no identity and thickens the spectrum without adding information. A
layer written as a part — a beat you could nod to, a line you could hum —
announces itself.

Hence three changes: the trigger is live danger rather than wave number; the
melody is never gated; and the solo test is a hard audition gate rather than a
matter of taste.

**Scope is deliberately narrow** — a filter sweep plus two or three earned
layers, not five tiers. Five tiers is where the clutter came from. The sweep
does much of the work on its own and is structurally incapable of sounding
cluttered, because it adds no notes.

**The retreat is data-only.** If the audition fails again, dropping the `tier`
fields makes every gate build always-on with no code change — the same freeze
Orbital Overhaul took. Build it so that stays true.

---

## #depth-model

Entity position is `(lane, depth)` because it collapses all entity math to one
dimension: collision is a 1-D overlap plus a lane match, with no trigonometry in
the hot path. It also means all sixteen well shapes share one code path, adding
a shape is adding data, and the whole simulation runs headless with no canvas —
which is what makes the test harness possible at all.

This is the analogue of Orbital Overhaul's wrap-aware `dist2`/`angleTo`/
`shortDelta` rule: the one piece of math that, done naively, produces subtle
bugs everywhere downstream.

---

## #oracle

Tests load `dist/`, never `src/`, because the concatenated file is what ships. A
suite that tests `src/` directly passes green while a build-order bug — a module
reading `C` before `00-config.js` is evaluated, say — ships broken. The cost is
a rebuild inside the harness; the benefit is that green means shippable.
