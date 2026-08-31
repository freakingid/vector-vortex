# PLAYTEST — Vector Vortex

Open questions that **only the eye can answer**. Every one of these is a thing
the headless suite can prove is *present* and cannot prove is *legible*.

⛔ **Not session context.** A build phase never reads this file. Pull it up when
you are sitting at the machine with a build in front of you, and nowhere else.
It lives here rather than in `STATUS.md` because `STATUS.md` auto-loads into
every phase, and eighty lines of questions no build session can act on is a tax
on every one of them.

**How this file is maintained**

- A phase that ships something judgeable **appends** its asks here, not to
  `STATUS.md`. One ⛔ per phase at most — the ask the phase exists for.
- ⛔ **Answered asks are DELETED, not archived.** This file is open questions
  only. If the answer changed a constant or settled a design question, that goes
  in `DECISIONS.md` with the date; if it changed shipped behaviour, the GDD.
- An ask names its **knob** wherever one exists, so answering it is a value and
  not a redesign.
- Grouped by what you would have on screen, because a playtest is a sitting and
  not a checklist. The debug bench is `1`–`6` for one of a kind in your lane and
  `0` for the full staggered row.

---

## The ⛔ asks — readability rules the suite cannot check

Six asks whose failure mode is *a death, or a wrong move, the player cannot
account for*. Everything else in this file is tuning; these six are
correctness. One per phase that shipped something judgeable.

**⛔ Are the two Drifter states separable at a GLANCE, on a busy well?** Press
`5` a few times and watch one climb, then `0` for the full row. The read is
three channels at once: a compact **closed** knot at 0.70× line weight and 0.55
alpha while it is armoured on a boundary, against a splayed **open** scatter at
1.60× and full alpha while it crosses. The headless gate proves the three
channels are still *separated*; it cannot prove a player reads them in traffic.
⚠ The session that built this was headless and could not judge it.

**⛔ Is the fuse legible as a COUNTDOWN, in traffic?** Press `6`. The read is
meant to be *the charge is coming up the lane at me and I have until it
arrives*, not *that lane is bright*. Knob: `C.SURGE_TELEGRAPH` (0.45 s) if it is
too short to act on. ⚠ Also built headless.

**⛔ Can you tell a Drifter Carrier from a Surger Carrier at THROAT depth?**
Press `2` repeatedly until you have seen all three cargoes, and judge them where
they are smallest, not at the rim. This is the one ask in this file where a
misread does not merely cost you the read — GDD §6.2's correct responses for
these two are **opposite** (Drifter cargo: shoot, *move away*; Surger cargo:
shoot, *hold still*), so a player who confuses them does the exact wrong thing
at the worst moment. The channel meant to carry it at that size is **compact
versus full-width**: the Drifter's glyph is a tangle that doubles back, the
Surger's and the Vaulter's both span the hull. Knobs, in order of preference:
reshape the Drifter's glyph to be more obviously compact, then
`C.CARRIER_GLYPH_SIZE`, then — an art call, not a tuning one — stroking the
glyph in the cargo's own colour. ⚠ The suite asserts the compact/wide separation
and the doubling-back off the real draw calls; it cannot assert a read.

**⛔ Is a six-kind board READABLE, or is it noise?** CS005 is the first build in
which all six Classic enemies can be on one well at once, and no played build
does it yet — set `C.DEBUG_SPAWN_KINDS` to
`["vaulter", "carrierDrifter", "carrierSurger", "weaver", "drifter", "surger"]`
and play a well or two. ⚠ **The closing soak proved that board is STABLE, and
that is a different claim from playable**: it ran 5,000 ticks on each of the six
open wells with the concurrency knob raised to the readability ceiling, and
proved no lane leaves the well, no NaN reaches a projected point and no array
grows without bound. It cannot tell you whether six silhouettes, a Thorn, a
bolt, a fuse and a discharging lane are separable by eye. Knobs:
`C.ENEMY_CONCURRENT` (3, the difficulty knob) and `C.ENEMY_CAP` (16, ⛔ the
readability ceiling — this ask is exactly the one that would move it). The real
answer is GDD §8.1's introduction schedule, which is CS007's: if six at once is
noise, the schedule is what has to keep them apart.

**⛔ At level 65, does an occupied lane read as LIT, or does the band just look
broken?** The dim band (GDD §3.6–3.7) draws levels 65–80 at `C.DIM_BAND_ALPHA`
0.18, and CS006 P4 wired the lighting that is supposed to make it playable: a
lane with an enemy in it, a shot travelling it, or a Surger charging it draws
its two bounding spokes at `C.LANE_LIT_ALPHA` 0.9 instead. Press `w` to level 65
(or start a run and cycle), then bring the board up with `0`. ⚠ **This is the
only band in the game where the well is not the brightest thing on screen**, and
the failure mode is not "too dark" — it is *the player reads the dim spokes as a
rendering fault and stops trusting the well as information*. Two things only the
eye can answer: whether a lit lane reads as **this lane has something in it**
rather than as flicker, and whether an unlit well at 0.18 still reads as a well
at all on a bright screen. ⛔ Knobs: `C.LANE_LIT_ALPHA` first — it is the one
number in the pair that is **not** ⚠ SETTLED. `C.DIM_BAND_ALPHA`, `DIM_BAND_LO`
and `DIM_BAND_HI` are settled per GDD §3.7 and `DECISIONS.md`, and moving one is
a design call, not an answer to this ask. ⚠ Note the arithmetic before you
judge: outside 65–80 the producer does not run at all, because a lit spoke and
an unlit one both draw at 1.0 there — so there is nothing to look at on any
other level, and that is not a bug.

**⛔ Do the Flat (11) and the Stair (9) READ as wells now?** CS006 P2 gave both
a `throatOffset` — the Flat `{x: 0, y: -0.50}`, the Stair `{x: 0, y: -0.35}` —
and until it did, the Flat drew as a single horizontal **line** with no depth at
all and the Stair had one lane a tenth the length of another. Open
`tools/well-lab.html`, pick each, and read the new **Legibility** panel: it
gives the shortest lane-centre spoke, its lane, the max/min ratio, and PASS/FAIL
against `C.MIN_LANE_SPOKE_PX`, and it draws the shortest lane in green or red so
the eye can find it. The `throatOffset.x` / `.y` sliders move the throat live,
and the readout says when the slider has left the shipped value so a number is
hand-ported rather than guessed. ⚠ **The numbers are settled and the picture is
not**: the geometry was auditioned headlessly against the build to 1e-13 px, no
well's spokes cross and every well stays on screen, but nobody has *looked* at
either shape. Two things only the eye can answer — does the Flat read as depth
rather than as a fan of lines, and on the Stair does the throat sitting above
the left rim end read as perspective or as a mistake. Knobs: the two offsets
themselves, then `C.THROAT_SCALE` (0.055) if the throat is the problem rather
than its position. ⛔ If a number moves, move it in `src/03-wells.js`, in
`tools/well-lab.html`'s copy of the data, and in GDD §3.4's table.

---

## The Drifter — key `5`

- ⚠ **Is the riding state legible at THROAT depth?** It is the one silhouette in
  the build drawn below full alpha, and `laneLineWidth(0)` is 1.0 px before the
  0.70 multiplier. Knob: `C.DRIFT_RIDE_ALPHA` — and raising it costs separation
  from the crossing state, so this is a real trade rather than a free fix.
- **Does `C.DRIFT_RIDE_TIME` 0.85 s against `C.DRIFT_CROSS_TIME` 0.45 s feel
  like an enemy you answer or one you wait out?** It is shootable about a third
  of the time. ⛔ Raising the ride is the fastest way to make it unanswerable.
- ⚠ **Does a riding Drifter reading as "in two lanes at once" land as menace or
  as a hitbox bug?** A boundary is exactly `C.HIT_LANE_TOL` from two lane
  centres, so it kills in both and shields shots in both. It is the largest
  lethal footprint in Classic and it is intended.
- **Does the birth read?** A Drifter comes out of the throat vulnerable and
  slides half a lane before it arms. That half-second is the whole tutorial for
  the entity, and it is deliberately at the depth where the player has the most
  time.

## The Surger — key `6`

- ⚠ **The fuse is the same shape as a Thorn, in nearly the band's own colour** —
  `THORN_COLOR` `#A98CFF` against `SURGER_COLOR` `#9AF0FF`, and §8.1 puts the
  Surger at L13, still inside the cyan band. Motion is what separates them: one
  grows and vanishes, one is static and permanent. Both ⚠ provisional. Press
  `3`, let a Weaver lay one, then press `6` in the same lane.
- **Does the PAUSE read?** A Surger stops climbing the instant its lane arms. If
  that reads as glitching rather than as bracing, say so — making the climb
  continuous is one line.
- ⚠ **Is a discharging lane obviously lethal END TO END?** It kills at any depth
  for 0.30 s, including down in the throat where a lane has never been a threat
  before. If it reads as "bright near the rim", that half is learned by dying.
- **Does 2.60 s between discharges feel like a rhythm you can play around?**
  ⚠ CS007 makes `C.SURGE_INTERVAL` heat-derived, so the level-1 base is what
  that phase scales from.

## The Carrier and its cargo — key `2`

- **Is the cargo glyph readable at THROAT depth?** GDD §6.2 says reading it fast
  is the skill that separates competent from good, so the deep end is the test,
  not the rim. Press `2` and watch one climb the whole way.
- ⚠ **Should the glyph be stroked in the CARGO's colour rather than the hull's?**
  It ships in `CARRIER_COLOR` because §3.6's palette note says silhouette
  carries the read; a cargo-coloured glyph is one lookup away and is an art call.
- **Does `CARRIER_CLIMB` 0.11 — nine seconds throat to rim — read as §6.2's
  "shoot deep; you have time", or just as slow?**

## The Weaver and its bolt — key `3`

- **Does the Weaver's cycle read as a cycle?** Press `3` and watch one for ten
  seconds: *it comes up, it spits, it goes back down.* If the retreat reads as a
  second approach, `C.WEAVER_RETREAT` is the knob.
- **Is the bolt legible enough to dodge?** It is the one thing in Classic that
  cannot be shot, so the whole answer is rotating out of the lane. ~1.4 s from
  the apex to the rim.
- ⚠ **Does a Weaver sitting on the rim in your lane read as safe?** Its body
  never kills, which is correct and is going to look wrong the first time.

## The Thorn — keys `3` then `4`

- **Is a landing chip visible?** `THORN_TIP_LEN` 0.05 of twice-drawn tip is the
  whole feedback for a hit on the one enemy that does not die when you hit it.
  Press `3`, let a Weaver finish a climb, then hold fire down that lane.
- **Does a full-length Thorn sealing its own lane feel like lane denial or like
  a wall?** At `THORN_MAX` 1.00 the tip sits at the rim, so a shot is consumed
  the instant it is fired. Standing in a sealed lane is safe and useless.
- **Does a Thorn sheltering an enemy spawned behind it read as a consequence or
  as the game cheating?** A shot stops at the tip, so anything below it cannot
  be hit until it climbs past — inherited from the original, self-resolving, and
  the lane you failed to keep clean is the lesson.

## The Vaulter — key `1`

- Does the flattened X read as a *threat* at throat depth, and is
  `VAULTER_SIZE` 0.70 enough silhouette to see it coming?
- Is `HIT_DEPTH_TOL` 0.05 generous enough that a shot fired at a climbing
  Vaulter connects when it looks like it should?

## Death, respawn and pressure

- Does the death sequence read? 1.2 s of hit-stop with no fragmentation and no
  sound is a long time to look at a frozen board. CS008 adds the fragmentation
  and CS009 the sound, but the freeze LENGTH is settled now and worth judging
  bare.
- Is `RESPAWN_PUSH_DEPTH` 0.55 far enough? The clamp plus `RESPAWN_INVULN` 1.5 s
  is meant to guarantee a Vaulter cannot climb back into contact before the
  blink stops. Provable at `VAULT_CLIMB` 0.18; it stops being provable the
  moment CS007's heat curve raises the climb rate.
- Does `SPAWN_INTERVAL` 1.60 with `ENEMY_CONCURRENT` 3 produce level-1 pressure
  that feels fair?

## The palette, as a set — key `0`

⚠ **All six enemy colours are provisional and the GDD specifies none of them.**
They were chosen as one set in CS004 P1 against one constraint: an enemy colour
must read against all seven band colours (§3.6), because the well cycles and the
enemy palette does not.

- Press `0`. Do the six Classic enemy colours separate from each other and from
  the cyan band, and does the Thorn read as scenery rather than as a creature?
- Do the two segment drawers — a Thorn and an arming Surger lane — separate from
  each other and from the well's own spokes?

⚠ `tools/glow-lab.html` does not exist and has no owner. It is the instrument
for the **global** glow constants (`GLOW_WIDE_W`, `GLOW_WIDE_ALPHA`,
`GLOW_THIN_ALPHA`, `LINE_W_THROAT`, `LINE_W_RIM`) measured against a busy frame.
If answering the palette asks above turns into retuning those rather than the
per-entity multipliers, that is the signal the lab has become load-bearing and
the art pass needs a changeset.