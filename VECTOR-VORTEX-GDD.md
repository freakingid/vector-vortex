# Vector Vortex — Game Design Document

**Version:** 0.2.0 (draft for review)
**Date:** 2026-08-30
**Supersedes:** v0.1.0, which was written without access to the Orbital Overhaul codebase and got five things wrong. See §22.
**Status:** Pre-spec. This document is the source from which numbered spec files are generated.
**Genre:** Tube shooter (arcade, wave-based)
**Platform:** Browser, Canvas 2D + Web Audio, vanilla JS, zero runtime dependencies
**Deployment:** coinlessgames.com
**Series:** Standalone original title

---

## 0. How to read this document

Modelled on Orbital Overhaul's §0 read contract. A future session reads §0 + §1 always, then the sections its phase names.

| § | Section | Read it when you are touching… |
|---|---|---|
| 1 | Concept and pillars | Anything. Arbitrates ambiguity. |
| 2 | Core loop | Pacing, flow, state machine |
| 3 | The Well — geometry | Level shapes, rendering, the depth model |
| 4 | The Skimmer | Player movement, firing, Purge, lives |
| 5 | The Dive | Between-level sequence, Thorn hazard |
| 6 | Enemies | Any entity, spawning, AI |
| 7 | Scoring | Points, bonuses, extra lives |
| 8 | Difficulty | The heat clock, introduction schedule |
| 9 | Controls | Any input path |
| 10 | Visual design | Rendering, glow, HUD, readability |
| 11 | **Audio** | Music, SFX, the intensity director |
| 12 | Onboarding | Prompts, attract mode, first-run |
| 13 | Modes | Classic vs Overdrive gating |
| 14 | **Overdrive proposal** | Any Overdrive feature; read before building one |
| 15 | Meta systems | Profiles, scores, leaderboard, achievements, telemetry |
| 16 | Technical architecture | Build shape, file layout, entity contract |
| 17 | Testing | Any test |
| 18 | Legal safety | Naming, art, copy — anything player-visible |
| 19 | Acceptance criteria | Closing a phase |
| 20 | Assumptions and decisions | On demand |
| 21 | Open questions | Before starting a blocked spec |
| 22 | What changed from v0.1.0 | On demand |

**Markers**, same meaning as in Orbital Overhaul's `CLAUDE.md`:

- **⛔ INVARIANT** — violating this breaks the build, save data, or a shipped guarantee.
- **⚠ SETTLED** — this looks wrong and is not. Do not re-litigate it in the session you noticed it.

---

## 1. Concept and pillars

**Vector Vortex** is a browser arcade tube shooter. You hold the rim of a glowing geometric well while things climb out of it toward you. You rotate, fire down lanes, and decide continuously which lane deserves your attention.

An homage to Atari's *Tempest* (1981), built as original IP, with two modes selectable from the title screen at all times:

- **CLASSIC** — the 1981 design philosophy. No powerups, one panic button, escalation through enemy mix and geometry.
- **OVERDRIVE** — the *Tempest 2000* philosophy. Powerups, a vertical escape axis, combo scoring, reactive music.

One codebase. Overdrive is feature flags, not a fork.

### 1.1 Design pillars

**P1 — Control fidelity above all.** The rim is a proportional analog axis on every input device. A player must be able to whip a third of the way around the well and stop exactly on a lane. If a feature makes the rim feel less precise, the feature loses.

**P2 — The threat is legible before it is lethal.** Every enemy announces itself by silhouette, colour, motion, and sound, at a depth where the player can still act. Nothing obscures the throat.

**P3 — Escalation you can name.** Difficulty rises continuously from one clock, but every new *kind* of threat arrives at a specific, learnable level.

**P4 — Pacing has a heartbeat.** Every well ends in a dive: a few seconds of release with a small skill test attached.

**P5 — Every added music layer is a part, not a texture.** See §11.4. This pillar exists because Orbital Overhaul's intensity layering failed on exactly this point.

---

## 2. Core loop

```
  [ READ ] ──► [ ROTATE ] ──► [ FIRE ] ──► [ TRIAGE ]
   what's        to the        down the     which lane
   climbing      threatened    lane, lead   is next
   and where     lane          the target        │
       ▲                                         │
       └────────────────────────────────────────┘
                        │
          [ WELL CLEARED ] ──► [ DIVE ] ──► next well
```

The moment-to-moment tension is **spatial triage under a movement constraint**. You occupy one lane; everything else is unattended. On a closed well, wrap distance is a resource. On an open well, the ends are walls — the corners are both trap and fortress.

Macro loop: **survive → clear → dive → escalate.**

---

## 3. The Well

### 3.1 Vocabulary

⛔ **These are the only terms used, in prose, docs, player-facing strings, and code identifiers.** Atari's terms appear in the right column for translation and nowhere else in the repo. A variable named `flipper` is a legal exposure, not a style problem (§18).

| Our term | What it is | (Atari's, never used) |
|---|---|---|
| **Well** | The tube the player defends | Web / tube |
| **Rim** | The near edge, where the player sits | Rim / top |
| **Throat** | The distant vanishing aperture | Bottom / centre |
| **Lane** | One segment running rim→throat | Segment |
| **Depth** | Normalized position, 0 = throat, 1 = rim | — |
| **Skimmer** | The player's craft | Blaster / claw |
| **Purge** | The once-per-well panic clear | Superzapper |
| **Thorn** | Static lane hazard | Spike |
| **Start Depth** | Selectable starting level | SkillStep / warp |

### 3.2 ⛔ The depth model

**Every entity's position is `(lane, depth)`, never a screen coordinate.** `lane` is a float in lane units; `depth` is a float in `[0,1]`, 0 at the throat, 1 at the rim.

Screen position is derived at render time only:

```
screenPos(lane, depth) = lerp( throatVertex(lane), rimVertex(lane), perspective(depth) )
perspective(d) = Math.pow(d, PERSPECTIVE_EXP)   // ~0.55; lower = more rush
```

Consequences: collision is a 1-D overlap on `depth` plus a lane match, with no trigonometry in the hot path; every well shape shares one code path; adding a shape is adding data; and the whole simulation runs headless with no canvas.

This is the analogue of Orbital Overhaul's wrap-aware `dist2`/`angleTo`/`shortDelta` rule — the one piece of math that, done naively, produces subtle bugs everywhere.

### 3.3 Well data

```js
{ id, name, closed, lanes, rim: [{x,y}, ...], throatScale, throatOffset }
```

The throat is the rim polygon scaled toward its centroid. This makes the figure-eight work with no special case: its throat is a smaller figure-eight, lanes cross correctly, and no code notices.

### 3.4 The sixteen wells

| # | Name | Topology | Lanes | Character |
|---|---|---|---|---|
| 1 | Ring | Closed | 16 | The teacher |
| 2 | Box | Closed | 16 | Corners compress lanes visually |
| 3 | Cross | Closed | 16 | Deep inlets; enemies vanish and reappear |
| 4 | Bowtie | Closed | 14 | Pinch between lobes = chokepoint |
| 5 | Pinwheel | Closed | 16 | Rotational skew, uneven lane widths |
| 6 | Delta | Closed | 15 | Three flats, three sharp corners |
| 7 | Clover | Closed | 16 | Wrap feels longer than it is |
| 8 | **Vee** | **Open** | 13 | First open well; teaches the corner |
| 9 | **Stair** | **Open** | 12 | Uneven lane lengths; depth cues vary |
| 10 | **Trough** | **Open** | 14 | Long flat bottom, two walls |
| 11 | **Flat** | **Open** | 12 | Purest open-well tactics |
| 12 | Heart | Closed | 16 | The top notch is a real hazard |
| 13 | Star | Closed | 16 | Alternating deep/shallow |
| 14 | **Double-Vee** | **Open** | 14 | Three defensible positions |
| 15 | **Fan** | **Open** | 11 | Fewest lanes; every one matters |
| 16 | Twist | Closed | 16 | Figure-eight. The signature shape. |

### 3.5 ⛔ Open wells are not closed wells with a clamp

The open/closed flag is a tactical system:

- The Skimmer cannot wrap; `lane` clamps to `[0, lanes-1]` with a 40 ms visual squash.
- End lanes are threatened from one side only — defensible, and a trap.
- **Enemy lane-hopping must handle the wall.** A Vaulter that would hop past the end reverses.

Clamping the player but leaving enemy AI wrapping produces enemies that teleport across the well. §17 test 3 exists for this bug.

### 3.6 Bands and colour

`shapeIndex = (level - 1) mod 16`. Each band of sixteen recolours.

| Levels | Band | Well colour |
|---|---|---|
| 1–16 | Cyan | `#3FE0FF` |
| 17–32 | Magenta | `#FF4FD8` |
| 33–48 | Amber | `#FFB020` |
| 49–64 | Violet | `#9B6BFF` |
| 65–80 | Ember | `#FF5A3C` @ 18% |
| 81–96 | Green | `#4FFF7A` |
| 97–99 | White | `#FFFFFF` |

Past 99 the counter holds and shapes come from the seeded RNG. Heat also holds — a marathon, not an impossibility. Same shape as Orbital Overhaul's escalating-waves-forever model: there is **no win condition**, which matters for the leaderboard `outcome` enum (§15.4).

### 3.7 The dim band

Levels 65–80 render at 18% alpha; lanes light when occupied, when a shot travels them, and when a Surger charges. Full invisibility on unknown browser gamma is a P2 catastrophe. **⚠ OPEN #1** — see §21.

---

## 4. The Skimmer

### 4.1 Movement

`skimmer.lane` is a continuous float, never quantized in the simulation. Closed wells wrap; open wells clamp.

**Snap assist.** After `SNAP_IDLE_MS` (~90 ms) with no rotation input, the Skimmer is drawn toward the nearest lane centre at `SNAP_STRENGTH`. This resolves the "am I in that lane?" ambiguity that makes clones feel imprecise. ⛔ **Never active during rotation input.**

The Skimmer renders at its continuous position and fires down the nearest lane centre. Snap assist keeps visual and mechanical in agreement.

### 4.2 Firing

| Property | Constant | Value |
|---|---|---|
| Max shots in flight | `SHOT_MAX` | 8 |
| Rim→throat travel | `SHOT_TIME` | 0.52 s |
| Fire cooldown | `SHOT_COOLDOWN` | 0.055 s |
| Auto-fire on hold | — | Yes |

Shots are lane-locked and never change lanes. A shot meeting a Thorn stops and chips `THORN_CHIP` from it. Because a stopped shot frees its slot immediately, camping a thorned lane produces a rapid chip-away effect. ⚠ **SETTLED:** that is emergent, it is in the original, and it is not a bug to smooth out.

### 4.3 The Purge

One charge per well; recharges on entry, never accumulates.

- **First use:** destroys every enemy in the well. ⛔ **Does not remove Thorns.**
- **Second use, same well:** destroys exactly one enemy — the one nearest the rim, deterministically, so the player can predict it. No bonus.

The weak second use converts the Purge from a spam button into a decision. HUD shows charge as bright/dim; the second use has a distinctly feeble sound so the downgrade is *felt*.

Clearing a well with the Purge unspent awards `PURGE_SAVED_BONUS` (500).

### 4.4 Lives

Start 3. Extra life at 20,000 then every 40,000. Reserve cap 6; awards past the cap are lost with a distinct sound, never silently swallowed. Death: 1.2 s hit-stop, fragmentation, respawn in the same lane with `RESPAWN_INVULN` 1.5 s. ⛔ **Enemies at the rim are pushed to `depth = 0.55` on respawn** so the player is never killed on re-entry.

### 4.5 Death conditions

The complete list. No chip damage, no health bar.

1. An enemy reaching the rim in your lane and making contact.
2. Contact with a Drifter, any depth.
3. Being in a Surger's lane when it discharges.
4. A Weaver's projectile.
5. A Thorn during the Dive.

### 4.6 Start Depth

Options 1, 3, 5, 7, 9 on a first run; thereafter the highest level ever cleared by that profile, snapped down to odd, capped at 81.

```
startBonus(d) = round100( 800 * Math.pow(d - 1, 1.6) )
```

| Depth | 1 | 3 | 5 | 7 | 9 | 17 | 33 |
|---|---|---|---|---|---|---|---|
| Bonus | 0 | 2,400 | 7,400 | 14,300 | 22,300 | 67,500 | 191,700 |

This is the original's SkillStep, credited as the first selectable difficulty in a commercial game. It solves onboarding by letting players trade safety for score legibly — doubly valuable for a browser player with no coin invested.

⛔ **No countdown timer on the Start Depth screen.** It waits. House rule.

**⚠ OPEN #2** — leaderboard treatment of the bonus. See §21.

---

## 5. The Dive

On clearing a well, the Skimmer flies down the throat into the next. `DIVE_TIME` 2.6 s in Classic.

Remaining Thorns are the hazard. The player can rotate and must thread between them. Striking one costs a life and repeats the dive, not the well.

⛔ **In-flight shots are cleared at dive start.** Inherited from the original and deliberately unfair in a teachable way: a Thorn you were about to destroy is still there. The lesson is "clear thorns before the last enemy." ⚠ **SETTLED — do not fix this.**

Camera widens, music drops to its foundation layer (§11.5), a rising doppler sweep plays. It should feel like exhaling.

In Overdrive the Dive becomes a ring-flight — §14.5.

---

## 6. Enemies

### 6.1 Roster

| Enemy | Silhouette | First | Movement | Kills by | Killed by | Points |
|---|---|---|---|---|---|---|
| **Vaulter** | Flattened X | L1 | Climbs; vaults lanes from L2; hunts at rim | Contact / grab | Any shot, Purge | 150 |
| **Carrier** | Hollow diamond + cargo glyph | L3 | Slow, one lane, never hops | Contact | Any shot — **splits** | 100 |
| **Weaver** | Open spiral | L5 | Climbs partway laying a Thorn, retreats; fires down-lane | Its projectiles | Any shot, Purge | 50 |
| **Thorn** | Bright lane segment | L5 | Static | Only during the Dive | ⛔ Shots only | 5/chip |
| **Drifter** | Tumbling spark cluster | L9 | Rides lane *boundaries* (invulnerable); crosses lanes (vulnerable); homes near rim | Contact, any depth, instant | Shots only while crossing; Purge anywhere | 250/500/750 by depth |
| **Surger** | Zigzag bar | L13 | Climbs; periodically electrifies its whole lane | Discharge in your lane | Any shot, Purge | 200 |

### 6.2 Carrier variants

Cargo shows as a glyph in the centre. Reading it fast is the skill that separates competent from good.

| Variant | First | Splits into | Correct response |
|---|---|---|---|
| Vaulter Carrier | L3 | 2 Vaulters, adjacent | Shoot deep; you have time |
| Drifter Carrier | L18 | 2 Drifters | Shoot, **move away** |
| Surger Carrier | L23 | 2 Surgers, flanking | Shoot, **hold still** |

The two opposite correct responses make cargo-reading consequential rather than cosmetic.

### 6.3 Behaviour notes that matter

**Vaulters do not vault at level 1.** They climb straight up, which is how the player learns what a lane is. Teach-immediately applied to AI.

⛔ **Drifter invulnerability must be visible.** Riding a boundary: tight, hard-edged, dim. Crossing: bloomed open and bright. If the player cannot tell at a glance, the Drifter is not a threat, it is a random death — the most common complaint about clones.

⛔ **Surgers telegraph.** `SURGE_TELEGRAPH` 0.45 s: the lane brightens throat→rim with a rising tone, then discharge is unavoidable. Fair difficulty is a visible fuse.

⛔ **Never spawn in the Skimmer's lane above `SAFE_SPAWN_DEPTH` (0.75).**

### 6.4 Overdrive enemies

**Reaver** (L6+), **Warden** (L11+), **Mimic** (L16+). Detailed with concerns in §14.6.

### 6.5 Entity contract

⛔ Matching Orbital Overhaul: every entity is a **class** with `constructor` / `update(dt)` / `draw()` / `dead`. Kill by setting `dead = true`; remove with an end-of-frame `.filter()`. **Never splice mid-loop.**

⛔ **New enemies wire into five places:** `startGame` reset, `update()` entity pass, `update()` collision pass, `update()` cleanup filter, `draw()` z-order, and the well-clear condition. **Decide explicitly whether the new hazard can be destroyed by the Purge.**

---

## 7. Scoring

| Event | Points |
|---|---|
| Thorn chip | 5 |
| Weaver | 50 |
| Carrier | 100 |
| Vaulter | 150 |
| Surger | 200 |
| Drifter | 250 / 500 / 750 by depth |
| Reaver *(OD)* | 300 |
| Mimic *(OD)* | 400 |
| Warden *(OD)* | 500 |
| Well cleared | 100 × level |
| Purge unspent | 500 |
| Well cleared, no death | 1,000 |
| Start Depth | §4.6 |

⛔ **All scoring routes through `addScore()`.** One entry point, matching Orbital Overhaul's rule, so milestone logic has exactly one place to live.

**No score cap and no rollover.** The original's 999,999 rollover was a bug.

Overdrive adds a combo multiplier — §14.4.

---

## 8. Difficulty

⛔ **One clock: `game.level`.** No parallel clocks. Matching Orbital Overhaul's `game.wave` rule, which exists because a second clock silently desynchronises from the first.

Per house rule there are no stair-step tiers. One continuous scalar:

```js
function heat(level) {
  const t = level - 1;
  return HEAT_BASE
       + HEAT_RISE * (1 - Math.exp(-t / HEAT_KNEE))
       + HEAT_LINEAR * t;
}
```

Heat modulates spawn interval (floored), concurrent enemy cap, climb speed, vault interval, surge frequency, Weaver thorn length, and Carrier cargo weights.

⛔ **`ENEMY_CAP` is a readability constraint, not a difficulty constraint.** Difficulty past the cap comes from faster and meaner, never more. Raising it violates P2 and is the fastest route to a game that feels cheap.

### 8.1 Introduction schedule

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

Compressed relative to the original (Pulsars at 17, Pulsar Tankers at 41) because our tuned ceiling is ~35–40, not ~99. A threat introduced past the window most players reach does not exist.

### 8.2 Tuning target

First-time player: level 4–6. Competent after an hour: 15–20. Strong: 30–40. Level 50 is an achievement; 99 is a legend. Tune against these numbers with the harness, not by feel.

---

## 9. Controls

P1 is the pillar most likely to be quietly compromised. This section is deliberately prescriptive.

> **The requirement:** a player must be able to traverse a third of the well and stop on their intended lane, on every supported device.

### 9.1 Mouse — the reference implementation

Relative horizontal movement; Pointer Lock offered, never forced. `Δlane = Δx * MOUSE_SENS`. ⛔ **No acceleration curve** — a spinner has none, and adding one is the most common way to ruin this.

### 9.2 Keyboard — parity through dual mode

A digital key delivers both spinner affordances if we separate them:

- **Tap** (released within `KEY_TAP_MS`, 130 ms): move exactly one lane. Precision.
- **Hold**: accelerate `KEY_SPEED_MIN` → `KEY_SPEED_MAX` over `KEY_RAMP` (0.35 s). Traversal.

These two constants are the most feel-critical pair in the game.

### 9.3 Touch

- **Rotation:** horizontal drag anywhere in the lower 40%, relative, same sensitivity model as mouse. Not a virtual stick.
- **Fire:** ⛔ **auto-fire ON by default.** Requiring a second thumb on a game whose core input is a continuous drag is a design error — and this is what makes the Jump button affordable (§14.2).
- **Purge:** large button, top-right. **Jump:** bottom-right. Mirrorable for left-handed play.

### 9.4 Gamepad

Left stick X proportional; D-pad uses the keyboard dual-mode model.

### 9.5 Abstraction

⛔ All four collapse to one struct; the simulation never learns which device produced it. Call sites never read the raw key map — matching Orbital Overhaul's `input.*` predicates rule.

```js
state.input = { rotate: 0, fire: false, purge: false, jump: false }
```

---

## 10. Visual design

### 10.1 Direction

Neon wireframe on near-black, with **deliberate divergence from Atari's trade dress** (§18): line weight varies by depth (vector hardware could not do this), the well carries an animated gradient along its length, silhouettes and palette are ours.

### 10.2 Rendering rules

⛔ **Render through `drawPoly` + `glowStroke`**, matching Orbital Overhaul. New entities define local-space point arrays and reuse these. No per-entity pipelines, no fills, no sprites, no textures.

Glow is two strokes — wide at low alpha, thin at full — composited with `lighter` into an offscreen canvas. Roughly 4× cheaper than `shadowBlur` and it looks better.

⛔ **HUD uses `glowStroke`.** No `fillRect`, no `strokeRect`.

### 10.3 ⛔ The readability contract

**Nothing is drawn over `depth < 0.25` at an opacity that obscures an approaching enemy.** Explosions, particles, and score popups are clipped or faded in that zone. This is what Tempest 4000 was criticised for violating, and it is the difference between tense and unfair.

### 10.4 HUD

Score top-left, lives bottom-left, level and band top-right, Purge charge bottom-right, combo (Overdrive) centre-top and loud. Everything else lives in the well.

---

## 11. Audio

⛔ **Web Audio synthesis only. No audio files.** House standard, unchanged.

The architecture below is Orbital Overhaul's proven MusicSys, adopted rather than reinvented. §11.4 is the one genuinely new system, and it exists to succeed where that game's intensity layering failed.

### 11.1 Module shape

⛔ **`MusicSys` lives alongside `AudioSys`, never inside it.** `AudioSys` is a flat bag of one-shot voices and must not grow a sequencer. All music output routes into `AudioSys.music`, so the existing Music Volume slider governs everything with no new plumbing.

```
note envelopes → layerGate → trackGain (crossfaded) → duck → AudioSys.music → master
SFX ───────────────────────────────────────────────────────→ AudioSys.sfx → master
```

### 11.2 ⛔ Scheduler

**Per-frame lookahead, called once per frame from the main loop. Never `setTimeout`, never `setInterval` for notes.** Each frame, schedule any note starting within `MUSIC_LOOKAHEAD` (0.2 s) using absolute `AudioContext.currentTime`. Timing is sample-accurate and immune to frame-rate jitter.

⛔ **`scheduleStep` never consults intensity.** Every layer is always scheduled; gating is entirely a downstream gain node. That is what makes a track's note timing provably fixed regardless of what the director is doing.

### 11.3 ⛔ Tracks are DATA

Generic step-sequencer table, consumed unmodified by the scheduler:

```js
{ stepDur, steps, layers: [ { name, tier, type, cutoff, cutoffTo, detune,
                              gain, atk, rel, steps: [cell|null] } ] }
```

⛔ **Composed and auditioned in `tools/music-lab.html`, ported verbatim.** No re-tuning a single gain in the build; the lab is the source of truth for note data. New tracks are new table entries — do not touch the scheduler. `playNote`'s voice branch is the one extension point.

**Length target.** Orbital Overhaul's tracks run 21.8–48 s (`zen` longest). Vector Vortex targets **≥ 90 s before the loop point** for the two flagship tracks, achieved through A→B→C sections — the same technique `drift` and `warehouse` already use for their A→B, extended.

### 11.4 The intensity director — the new work

**What failed in Orbital Overhaul, recorded so we do not repeat it.** Layers were gated on `musicIntensity(wave) = 1 − e^-(w-1)/8`, a smooth curve over wave number. Two findings: the tier-4 threshold at 0.70 first crossed at **wave 11**, so no track had an audible melody for most of a typical run; and re-tiering was then tried and rejected on audition, because on every track the preferred mix was the foundation alone — the thickening read as clutter.

Three changes address that:

**(a) The trigger is live danger, not wave number.** A wave curve moves once per wave and is unaffected by anything the player does. That is not music reacting to you; it is music being slightly different later. Instead:

```js
raw = W_COUNT     * clamp01(enemiesAlive / EXPECTED_ENEMIES)
    + W_PROXIMITY * clamp01(nearestEnemyDepth)
    + W_COMBO     * clamp01(combo / COMBO_MAX)      // Overdrive
    + W_PERIL     * (lives <= 1 ? 1 : 0)
    + W_HEAT      * clamp01(heat / HEAT_MAX);
```

Smoothed **asymmetrically** — attack ~0.4 s so danger registers immediately, release ~2.5 s so relief is earned. Symmetric smoothing makes layers flutter, which sounds broken.

**(b) The melody is never gated.** ⛔ The foundation tier carries the tune. Layers add *to* a complete piece of music; they are never what makes it music. This is the direct fix for finding (1).

**(c) ⛔ P5 — the standalone test.** *Every layer above the foundation must be recognizable played solo, with the rest of the track muted.* A layer that only makes sense inside the stack is texture, and texture is what produced the mud. `music-lab` gains a **solo button per layer**, and a layer that fails the solo audition does not ship. This is an audition gate, not a code rule, and it is the thing that was missing last time.

### 11.5 ⛔ Scope: sweep plus two or three earned layers

Deliberately narrower than the five-tier design that failed.

1. **A filter and mix sweep**, always on. A one-pole low-pass on the music bus opens 600 Hz → 18 kHz across the intensity range. This alone is a large, unmistakable change that is structurally incapable of sounding cluttered, because it adds no notes.
2. **Two or three layers that pass §11.4(c).** Realistically a hook that is a real riff, a percussion layer that is a real groove change, and a danger layer that enters only near death. Anything that cannot survive solo does not ship.

⛔ **Tier changes latch to the next bar line**, crossfaded over `MUSIC_LAYER_CROSSFADE`. A layer entering mid-phrase sounds like a bug even when intentional.

⚠ **SETTLED — this is a re-opening of a decision Orbital Overhaul made against, taken deliberately with Paul's approval on 2026-08-30, on the diagnosis that the failure was compositional (undefined, muddy layers) rather than architectural.** If the audition fails again, the correct response is the same freeze that game took: drop the `tier` fields and every gate builds always-on with no code change. Build the machinery so that remains a data-only retreat.

⛔ **A layer's `tier`, if set, must be in `1..4`.** `LAYER_THRESHOLD` has no key for 5+, and `f >= undefined` is always false, so a tier-5 layer would be permanently silent.

### 11.6 Ducking and reactive visuals

`duck` ramps to 0.5 while a menu is open and dips 6 dB on Purge, death, and extra life — always `linearRampToValueAtTime`, never a bare `.value` set.

The scheduler emits kick and snare events to the render layer; the rim pulses on the kick. ⛔ **Driven by the scheduler, not an `AnalyserNode`** — an analyser adds latency, and tightness is the point.

### 11.7 Tracks

| Track | Mode | Character |
|---|---|---|
| `title` | — | Title screen |
| `pulse` | Classic default | Sparse, tonal, near-ambient at foundation |
| `drive` | Overdrive default | ~138 BPM. The flagship. |
| `rush` | Overdrive alt | ~150 BPM, aggressive |
| `deep` | Both | ~124 BPM, dubby, wide |

Selectable in Options, persisted per profile, cycled exactly like Orbital Overhaul's `settings.musicTrack`.

### 11.8 SFX

⛔ **The Surger charge tone is a gameplay cue, not decoration.** It must be audible over the music at every intensity tier. Verify by ear on real hardware; it is the one sound whose absence costs a life.

Every entry point is `if (!AudioSys.ctx) return;`-guarded, headless-safe.

---

## 12. Onboarding

Level 1 is the Ring, non-vaulting Vaulters at half speed, three at a time. Within four seconds, a player who does nothing sees a death; one who moves and fires kills something. Both teach.

Non-modal prompts, once per profile, in the well's line style, never pausing:

| Trigger | Prompt |
|---|---|
| First frame | `ROTATE — FIRE DOWN THE LANE` |
| First Carrier | `IT CARRIES TWO` |
| First Thorn | `THORNS BLOCK THE DIVE` |
| First Drifter | `SOLID = ARMOURED · OPEN = VULNERABLE` |
| First Surger | `ITS LANE GOES LIVE` |
| First open well | `NO WRAP — THE ENDS ARE WALLS` |
| First Purge | `ONE PER WELL` |

Attract mode after `ATTRACT_IDLE` (20 s).

---

## 13. Modes

| | CLASSIC | OVERDRIVE |
|---|---|---|
| Powerups | None | §14.1 |
| Jump | No | §14.2 |
| Combo | No | §14.4 |
| Dive | Thorn-dodge | Ring-flight |
| Extra enemies | No | Reaver, Warden, Mimic |
| Music | `pulse` | `drive` |
| Leaderboard | Own board | Own board |

Both available from first launch. Overdrive is the default highlight; Classic is presented as the purist option, not a tutorial.

---

## 14. Overdrive proposal and concerns

Each component on merit. Three are cut or deferred.

### 14.1 Powerups — **include**

Destroyed enemies occasionally drop a token that rises up its lane; collect by touch; lasts the current well only.

| Token | Effect |
|---|---|
| **Lance** | Shots pierce; chips Thorns at 3× |
| **Spread** | Fires into the lane plus both neighbours |
| **Recharge** | Restores the Purge to full strength |
| **Bounty** | +2,000 |
| **Ward** | One free hit, visible as a shell |

Weighted seeded table — not a fixed cycle, not pure random.

**Concerns.** Collection pulls you toward danger, which is good tension but means a token in a Surger's lane must read as a choice, not a gotcha — so tokens use a warm palette no enemy uses, and hover at `depth 0.8` for a beat before expiring. Clutter threatens P2 directly: ⛔ **cap `MAX_TOKENS` at 2**, and drop rate *falls* as enemy count rises. Per-well expiry creates a rhythm problem (the last ten seconds of every well are the strong ones) inherited from Tempest 2000 — **keep it anyway**, because carrying powerups across wells snowballs and trivialises escalation, which is worse.

⚠ Following Orbital Overhaul's hard-won distinction: **the budgeted-effect list and the drop-weight table are two different tables answering two different questions.** Do not conflate them.

### 14.2 Jump — **include**

Lifts off the rim for `JUMP_TIME` ~0.9 s: immune to rim contact and Surger discharge, can rotate, cannot fire. `JUMP_RECOVERY` 0.2 s vulnerable on landing.

**Concerns.** It is the one addition that changes the genre's dimensionality, and it is why Tempest 2000 felt new. It can trivialise Surgers — mitigated by `JUMP_COOLDOWN` 1.4 s, so clearing one leaves you grounded for the next. ⛔ **"Am I airborne?" must be unmistakable on three independent channels:** the Skimmer lifts visibly off the rim line, casts a bright drop-shadow onto its lane, and the music high-passes briefly. Getting this wrong makes every death feel arbitrary. Touch cost is real but affordable precisely because §9.3 makes auto-fire the touch default — ⛔ **those two decisions are coupled; changing one breaks the other.**

### 14.3 Companion droid — **defer**

Autonomous ally that floats above the well and auto-fires.

**Concerns.** It muddies the counterfactual when you die. It breaks combo attribution: if droid kills feed your multiplier the multiplier stops measuring you; if they don't, the powerup hurts your score. And it is the most expensive item here to build well — good autonomous targeting across a wrapping topology with invulnerable-phase Drifters is a genuine AI problem, and Tempest X3's droid was considered a downgrade precisely because its behaviour became unpredictable.

Worst value-per-risk in the set. If it ships later, droid kills score 50% and do not feed the combo.

### 14.4 Combo multiplier — **include**

Consecutive kills, no death, no gap beyond `COMBO_WINDOW` 2.5 s. ×1 to ×8 in half steps. Decays rather than snapping.

**Concerns.** It can turn the board into a combo-maintenance contest — mitigated by capping at ×8 and setting the window generous enough that ordinary competent play sustains ×3–4, so the multiplier rewards *not dying*, which is already what we want to reward. Hidden state is a design smell: the display carries a visible depletion ring and loss has its own sound. It feeds the audio director (§11.4), which is the strongest argument for it — a good run is something you *hear*.

### 14.5 Ring-flight dive — **include, hard-scoped**

The Overdrive Dive becomes a short ring corridor.

**Concerns.** Different control model mid-run; highest build cost in the set; and it can break P4 by turning the breath into more work.

⛔ **Scope cap: max 4 seconds, max 6 rings, no failure state beyond "you stop earning," and it reuses the depth model** — rings are objects at decreasing depth in a lane-less tube, not a second renderer. Under those constraints it is a few hundred lines. **First candidate to cut under scope pressure**, falling back to the Classic thorn-dodge.

### 14.6 Additional enemies

**Reaver** (L6+) — Vaulter at 1.6× that vaults toward the Skimmer. A parameter variation on an existing entity, the cheapest possible threat. **Include.**

**Warden** (L11+) — flies above the well, fires down, killable only by Jump. Slightly circular (it exists to justify Jump) but it makes Jump offensive as well as defensive. ⛔ **Must be visible in peripheral vision** — an off-well enemy killing you from where you weren't looking is the definition of unfair. **Include.**

**Mimic** (L16+) — reflects shots; vulnerable only while firing. **Probation.** Reflected shots that kill you are a hard sell: players read their own bullets as safe and reversing that betrays a deep expectation. Reflected shots are colour-shifted, larger, and 60% speed. Build it, playtest it, **cut it without ceremony if it reads as cheap.**

### 14.7 Level skip — **cut**

Combined with Start Depth it makes level-reached meaningless as a stat, and two overlapping skip mechanisms is one too many. Start Depth already provides the affordance, priced and legible, at run start.

### 14.8 Beastly mode — **defer**

Content gated behind clearing 99 levels is content for nobody. Revisit if telemetry ever shows players getting there.

### 14.9 Summary

| Component | Verdict | Primary risk |
|---|---|---|
| Powerups | Include | Clutter vs P2 |
| Jump | Include | Airborne readability |
| Combo | Include | Score distortion |
| Reaver | Include | None material |
| Warden | Include | Off-screen fairness |
| Ring-flight dive | Include, capped | Build cost; first cut |
| Mimic | Probation | Reflected shots feel like betrayal |
| Companion droid | Defer | Cost, attribution, agency |
| Level skip | Cut | Breaks comparability |
| Beastly mode | Defer | Nobody reaches it |

---

## 15. Meta systems

Specced against Orbital Overhaul's shipped, working implementations rather than invented.

### 15.1 Storage

⛔ **`kit-storage` owns the keyspace.** The game does not choose raw
`localStorage` key names. All keys are `coinless.<gameId>.<key>`, declared up
front via `create({gameId, keys})` with a version and optional `migrate` per key;
`get`/`set` on an undeclared key throws.

⛔ **Vector Vortex is a new game with no legacy stores.** `kit-profile` is wired
with empty `legacyRosterKey` / `legacyProbeKeys` so its `afd_*` import path —
Orbital Overhaul's — never runs here.

| Declared key | Scope | Notes |
|---|---|---|
| `settings` | Per-profile, via `scope(profileId)` | Options, bindings, track choice |
| `achievements` | Per-profile | Lifetime + weekly + tiers |
| `scores` | Root store, shared across profiles | Records stamped `profileId`/`profileName` |
| `telemetry` | Per-profile | ⛔ Lazy — untouched unless capture is on |

The profile roster itself is `kit-profile`'s, not ours.

⛔ **A row-shape change bumps that key's declared version and supplies a
`migrate`, never a new key name.**

⛔ **New state is additive under known-value-else-default loading.** Removing a
field needs no migration — a saved value for a deleted field orphans harmlessly.

### 15.2 Profiles

⛔ **`Profiles.keyFor(base)` is the one route from a store's base name to the key it reads.** Non-legacy profiles get a suffix (`vv_settings_v1:p3`); the legacy profile `p0` resolves to the bare name. ⛔ **`localStorage` is never enumerated** anywhere in the build — no `key(i)`, no `.length`, no `Object.keys` over storage.

⛔ **`activate(id)` resets the runtime to shipped defaults *before* loading the incoming profile.** Loading alone bleeds the outgoing profile's settings onto the incoming one, because the load path is written for a cold boot.

⛔ **`playerId` is minted once, on first activation, never at creation, never regenerated.** Mint-if-missing is the only writer, and it doubles as the backfill path. It is never rendered; `name` is the only user-facing identity.

⛔ **Mint via a `crypto.randomUUID` → `crypto.getRandomValues` fallback.** An opaque origin (sandboxed iframe, itch.io-style embed) is never a secure context, and `randomUUID` is secure-context-only — this exact bug was found and fixed in `kit-profile` and most likely still exists in Orbital Overhaul.

**⚠ OPEN #3** — whether to consume `kit-profile` or implement locally. See §21.

### 15.3 Local high scores

Top 10 per mode. `vv_scores_v1` stays one shared machine-wide table with records additively stamped `profileId` / `profileName`, matching Orbital Overhaul.

### 15.4 Online leaderboard

⛔ **One `Leaderboard` object is the only call surface for `window.KitLeaderboard`.** Nothing else reads that global except the rename flow's notice lookup and the ES-module bridge tag. Every entry point is safe to call with the module absent.

⛔ **`Leaderboard.eligible()` gates every `submit()`**, and it is the same gate the local top-10 check uses. Extend both together or neither.

⛔ **`quitToTitle()` submits `outcome: 'quit'` only when the game was actually playing at the moment it is called, checked *before* that function overwrites the state** — the same function is also game-over's "Quit to Title" row and must never double-submit.

⚠ **SETTLED — `'completed'` has no call site.** Escalating levels forever, no win condition (§3.6). Only `'died'` and `'quit'` are ever submitted. Do not invent a trigger to fill the enum.

**Registration required outside this repo:** add `vector-vortex` to the Worker's `services/leaderboard/src/registry.js`. ⛔ **The registry is readable** at `github.com/freakingid/coinless-kit` — read it rather than guessing, because an unregistered stats key flags every row it posts. Orbital Overhaul shipped exactly that bug in CS033.

Proposed `statsFields`: `level_reached`, `mode`, `start_depth`, `wells_cleared`, `purges_spent`, `max_combo`, `deaths`. A mismatch only flags, never rejects, so extending later is a one-line change — but still a deliberate one, not filler.

Known kit gap: rate limiting is not enforced in production on the Workers Free plan, and the Worker's bounds check is deliberately the entire anti-cheat story. ⛔ **No per-game score validators.**

### 15.5 Achievements

⛔ **The kit forbids achievement-shaped code in every existing module, deliberately, pending a future `kit-achievements`.** So this game owns it — written extraction-shaped: declarative definition table, event-driven evaluator, no reach into game state.

Structure follows Orbital Overhaul's proven v2 shape:

- `lifetimeUnlocked` — Set of non-tiered ids
- `lifetimeTiers` — `{ id: highestTierIndex }`, ⛔ **monotonic: only ever raise, never lower**
- `weeklyUnlocked` — Set, reset when the week rolls
- `weekKey` — ⛔ **ISO year-week, computed in UTC.** Local-timezone boundaries roll over mid-session and differ across devices.

⛔ **Achievement `id` values are save data and are never renamed**, however dated the spelling looks. Renaming one silently drops that unlock for every existing player.

⚠ Following Orbital Overhaul CS037 P6: a resume baseline **raises the evaluation loop's floor; it never writes the persisted tier state.** Those stores are week-scoped, so marking them at resume leaks into any later week.

~24 lifetime plus 5 weekly, rotated deterministically by week number so every player sees the same five.

**⚠ OPEN #4** — local-only or eventually server-backed. See §21.

### 15.6 Telemetry

Modelled directly on Orbital Overhaul CS039–CS040.

⛔ **`TELEMETRY_FIELDS` is the one source of truth for both row shape and CSV column order.** Adding or reordering a column edits `TELEMETRY_FIELDS` and the matching line in `push()` **together** — the list drives the header, `push()` drives the data, and they must never drift.

⛔ **Capture is a session switch: opt-in, OFF at every launch, never persisted.** A launch must be unable to revive a stale "was ON last session" state. An Options-screen home for it is a control surface over that switch, not a settings store.

⛔ **`read()` rejects any envelope `v` that doesn't match the current shape and returns an empty buffer** — silently dropping a stale run beats exporting a column of the literal string `"undefined"`.

Columns come in three kinds and the names do not tell you which: **instantaneous** (state at the sample instant), **cumulative** (run totals), and **sawtooth** (reset by some event). ⛔ **Sawtooth columns are excluded by name from any monotonicity check.** Document each column's kind at definition.

This is a tuning and debugging instrument. Because the simulation is deterministic — seeded RNG, fixed timestep, one input struct — a run is described by `{seed, mode, startDepth, inputEvents[]}` and replays exactly. ⛔ **It is explicitly not an anti-cheat mechanism** (§15.4).

**⚠ OPEN #5** — aggregate telemetry destination. See §21.

---

### 15.7 Kit boundary and extraction

⛔ **A kit module never reaches into game state**, in either direction. No
`state`, no `C`, no game object. Everything crosses as an explicit parameter or a
callback the game supplies. This mirrors the kit's own "no game code lives here,
ever" constraint, and it is what makes extraction a copy rather than a rewrite.

**Consuming.** Kit modules are vendored into `lib/` at a pinned `VERSION`. A fix
is made to the vendored copy **here**, so it is exercised by a real game before
landing in the shared repo; it must stay game-agnostic; the `VERSION` is bumped
per semver; and backporting to coinless-kit is a **separate manual step**, never
implied by the edit.

⛔ **Every `lib/` module carries a sibling `.NOTES.md`** — the backport packet.
Version bumped, what changed, why, game-agnostic confirmation, backport status.
A coinless-kit reviewer reads that one file, not this game's decision history.
Template: `lib/MODULE-NOTES-TEMPLATE.md`.

**Producing.** Six systems here do not exist in the kit yet and are built
kit-shaped from v1, each carrying a `.NOTES.md` from its first commit that
doubles as draft kit documentation:

| `src/` module | Future kit module |
|---|---|
| `04-input.js` | `kit-input` |
| `15-render-hud.js` (menu/screen-state) | `kit-menu` |
| `16-audio-engine.js` + `18-audio-director.js` | `kit-audio` |
| `14-render-entities.js` (glow/particle primitives) | `kit-fx` |
| `20-achievements.js` | `kit-achievements` |
| `22-meta.js` (local high scores) | `kit-scores` |

⚠ **SETTLED — the per-phase overhead of kit-shaping is accepted deliberately**
(Paul, 2026-08-30). Do not let a module read game state because the boundary felt
inconvenient in one phase.

---

## 16. Technical architecture

### 16.1 Non-negotiables

- Vanilla JS, no frameworks, no runtime dependencies.
- ⛔ **All tunables at the top, grouped by system.** Never inline a magic number. This is the top architectural priority.
- ⛔ Entities are classes: `constructor` / `update(dt)` / `draw()` / `dead`, end-of-frame `.filter()`, never splice mid-loop (§6.5).
- `mulberry32` seeded RNG throughout, including audio variation.
- Fixed-timestep loop with an accumulator and hit-stop; `dt` clamped.
- ⛔ **Count-up timers only.** No countdown pressure. See §16.3.
- Web Audio synthesis only.
- Comments oriented to a future session with no context.

### 16.2 Build shape

Multi-file `src/` with a Node concat build script, per Paul's direction on 2026-08-30 — differing from Orbital Overhaul's single-`<script>` invariant, which was right for that repo and is not carried over.

⛔ **The concatenated single-file build is the behaviour oracle.** Any refactor of `src/` must match it exactly. The shipped file must open and play from `file://` by double-click.

⛔ **External runtime files are optional enhancements, never required.** Load as classic `<script src>`, never `fetch()` or `import` — both fail on `file://`. The one exception is a third-party ES module (the leaderboard bridge) loaded by a `<script type="module">` tag whose only job is handing exports to a `window.*` global; it carries no game logic and fails on `file://` by design. Wrap every load so failure is caught; **absence is the normal fallback path.** No leaderboard module means the game plays without a leaderboard.

⛔ **Outbound links go through one `openExternal(url)` helper**, always `window.open(url, "_blank", "noopener")`. Without `noopener` the opened page gets a live handle back into the game.

### 16.3 ⚠ SETTLED — count-up timers and finite effects

Powerup expiry and jump cooldown are finite intervals. The house rule targets *session pressure* — the arcade "HURRY UP" clock — not internal state. Resolution: internal timers count **up** toward a threshold (`token.age >= TOKEN_LIFE`), never down. The UI shows a depleting ring with **no numerals** and no ticking. No timer is ever displayed as a number counting toward zero.

### 16.4 Repository layout

```
vector-vortex/
├── CLAUDE.md                    # rules, invariants, code map. ⛔ under 50 KB
├── STATUS.md                    # current changeset only, ⛔ under ~400 lines
├── RATIONALE.md                 # why the rules exist; read on demand only
├── DECISIONS.md                 # off-cycle judgment calls
├── VECTOR-VORTEX-GDD.md         # this document, with its §0 read contract
├── DIFFICULTY-NOTES.md          # the heat curve, documented
├── EXTERNAL-FILES.md            # runtime files the build loads
├── PLANNED-FEATURES-CS0##.md    # spec for what's being built now
├── IMPLEMENTATION-PHASES-CS0##.md
├── build.js                     # Node concat src/ → dist/
├── src/                         # numbered modules, concat order
├── tools/                       # design instruments — music-lab, art labs
├── scratchpad/                  # tests: _harness.js, run-all.js, test-registry.js
├── log/CS0##.md                 # per-changeset narrative + version history
├── archive/                     # spent planning docs
└── dist/vector-vortex.html
```

⛔ **`log/` and `archive/` are not session context.** Pull one file in only when a question genuinely needs project history, and say you did.

⛔ **The GDD is read by named subsection, not in bulk.** §0 + §1 always, then what the phase names. ⛔ If §0 has no row for what you are editing, that is a defect in §0 — record it in `STATUS.md` rather than working around it.

### 16.5 Session rules

Carried over from Orbital Overhaul, which has 41 changesets of evidence behind them.

1. Read `STATUS.md` first; update it at session end.
2. ⛔ **One phase per session.** Build only what the phase scopes. Do not build ahead.
3. ⛔ **Implementation only.** If a genuine design decision surfaces that the planning doc doesn't cover, **stop and surface it.** Do not invent design.
4. Commit per phase on `main`; code and docs in the same commit. ⛔ **Never push** — that is Paul's.
5. ⛔ **Edit docs in place.** Never print a doc for copy-paste.
6. Prefer `str_replace` over full-file rewrites. Re-read the region first.
7. ⛔ **Don't refactor unprompted.** Propose it.
8. Phases flag their own risks in `STATUS.md`.

---

## 17. Testing

⛔ **New tests use `scratchpad/_harness.js`**, which owns loading the build, extracting the script, stubbing `window` / `document` / `performance` / `requestAnimationFrame` / `navigator` / `localStorage`, and the assert counters. Do not hand-roll a sandbox. Do not hand-roll world dimensions — read them from the build.

⛔ **Drive the real code.** Real `startGame` / `nextWell` / `update(1/60)` / `draw`. **Never inline a copy of the logic under test.**

⛔ **A test asserts only what its own phase owns** — never a global count or inventory of things it did not build. ⛔ **Global counts live in exactly one place, `scratchpad/test-registry.js`.**

⛔ **Run `run-all.js` before committing.** Non-zero exit means not done. A phase may not leave the suite redder than it found it. Failure-only output.

⛔ **Seed before the first build** — some nondeterminism is spent at module load, so a seed installed afterward fixes nothing.

⛔ **Frame-budget gates are counter-based, never wall-clock.**

Required coverage:

1. **Determinism** — same seed and inputs, identical state hash after 10,000 ticks.
2. **Geometry** — all 16 wells: lane count matches vertices, no NaN in any derived position.
3. ⛔ **Enemy wall behaviour** — no entity's lane leaves `[0, lanes-1]` on any open well, 5,000-tick soak each. Written against the §3.5 bug.
4. **Shot cap** — never exceeds `SHOT_MAX` under held fire.
5. **Purge** — first use clears all enemies and zero Thorns; second removes exactly one.
6. **Carrier splits** — correct count and type per variant.
7. **Heat monotonicity** — `heat(n+1) > heat(n)` for n in 1..200; every derived value inside its clamp.
8. **Scoring** — total equals the sum of logged events.
9. **Audio** — intensity stays in `[0,1]`; tier changes land only on bar boundaries; ⛔ worst-case node creation for a single scheduled step asserted under a ceiling, as Orbital Overhaul does.
10. **Achievements** — every predicate reachable; none throws on empty state; tiers monotonic.
11. **Telemetry** — `TELEMETRY_FIELDS` and `push()` agree in length and order.
12. **Soak** — 100 seeded runs to game over, no exception, no NaN, no unbounded array.

**Performance budget:** 60 fps with 16 enemies, 8 shots, 2 tokens and full particles on a 2019 mid-range laptop and a 2021 mid-range phone. Preallocated entity arrays, no per-frame allocation in the hot path.

---

## 18. Legal safety

Atari blocked Jeff Minter — co-creator of *Tempest 2000* — from shipping *TxK* ports over close resemblance, citing press describing it as essentially Tempest. The mechanic is not protectable. Trade dress and terminology are the exposure.

1. No "Tempest," no `T-####` naming, no Atari marks anywhere — code, comments, docs, marketing.
2. ⛔ **No Atari entity names** — Flipper, Fuseball, Pulsar, Tanker, Spiker, Superzapper, Blaster, Web. §3.1 is the only vocabulary, **including code identifiers.**
3. Our own silhouettes. No bowtie Flipper, no Medusa Fuseball, no spiral Spiker.
4. Our own palette and shapes. Sixteen is a structure, not an asset; Pinwheel, Stair and Fan are ours.
5. Deliberate visual divergence per §10.1.
6. No reference to Tempest in store text, page copy, or metadata.

**Review threshold:** if a reasonable reviewer would call this "a Tempest clone" rather than "a tube shooter," revise. Recognisably *of the genre*, unmistakably *not the game*.

---

## 19. Acceptance criteria

**Core** — all 16 wells render and play, open clamps and closed wraps for player *and* enemies; rim movement proportional on mouse, gamepad, touch, with keyboard tap/hold working; traverse-and-stop verified on every device; six Classic enemies and three Carrier variants correct; Purge including the weak second use; Thorns block the Dive and survive the Purge; in-flight shots clear at dive start; Start Depth selects, expands, and pays; playable title → mode → depth → play → death → game over → restart.

**Overdrive** — five tokens, max two on screen; Jump with cooldown and unmistakable airborne state on three channels; combo builds, decays, displays, feeds the director; Reaver and Warden correct; Mimic present and flagged for playtest; ring-flight inside its 4 s / 6 ring cap.

**Audio** — per-frame lookahead scheduling, no `setTimeout`/`setInterval` for notes, no audible drift over 10 minutes; flagship tracks ≥ 90 s before loop; ⛔ **every gated layer passes the solo audition**; tier changes only on bar boundaries; intensity rises ~0.4 s and falls ~2.5 s; filter sweep audible end to end; Surger charge audible over music at every tier, verified by ear on hardware; volume sliders persist per profile.

**Meta** — profiles with `keyFor` routing and no storage enumeration; `playerId` minted once with the secure-context fallback; local top-10 per mode; separate online boards; `vector-vortex` registered with stats keys read from the real registry; achievements with monotonic tiers and UTC ISO weeks; telemetry opt-in and off at launch, `TELEMETRY_FIELDS` and `push()` in agreement.

**Quality** — all 12 test groups pass; 60 fps under budget on both targets; nothing obscures `depth < 0.25`; concat build behaviourally identical to `src/`; plays from `file://`; no Atari terminology anywhere including identifiers.

---

## 20. Assumptions and decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | Continuous `(lane, depth)`, screen position derived at render | Collapses entity math to 1-D, one code path for 16 shapes, fully headless-testable |
| 2 | Snap assist when input is idle | Removes lane ambiguity without fighting input; top clone failure mode |
| 3 | Keyboard tap/hold dual mode | The only way a digital key gives both spinner affordances |
| 4 | Auto-fire default on touch | Coupled to Jump's existence; three simultaneous touch inputs otherwise |
| 5 | Introduction schedule compressed vs the original | Ceiling ~35–40, not ~99; a threat at L41 does not exist |
| 6 | Dim band at 18%, not invisible | Unknown browser gamma; P2 |
| 7 | No score rollover | The 999,999 rollover was a bug |
| 8 | Timers count up; UI shows a numberless ring | Honours no-countdown-pressure while allowing finite effects |
| 9 | Companion droid deferred | Worst value-per-risk: expensive AI, muddies attribution, reduces agency |
| 10 | Level skip cut | Redundant with Start Depth; two skip mechanisms break comparability |
| 11 | Beastly mode deferred | Gated behind level 99 |
| 12 | Ring-flight capped at 4 s / 6 rings, reusing the depth model | Keeps it a breath; first scope cut |
| 13 | Mimic on probation | Reflected shots violate a deep expectation |
| 14 | Separate boards per mode | Score scales not comparable |
| 15 | Achievements built here, extraction-shaped | Kit forbids achievement-shaped code in every module, deliberately |
| 16 | UTC ISO week | Local boundaries roll mid-session and differ across devices |
| 17 | Telemetry local, opt-in, explicitly not anti-cheat | Kit rules out server-side score reconstruction |
| 18 | **Per-frame lookahead scheduler, adopted from Orbital Overhaul** | Proven; its `never setTimeout` rule is carried over verbatim |
| 19 | **Track data is Orbital Overhaul's step-sequencer table, unchanged** | The scheduler consumes it unmodified; new tracks are data |
| 20 | **Intensity layering re-opened, narrowly** | Paul's call, 2026-08-30, on the diagnosis that the failure was compositional |
| 21 | **The standalone/solo test is the audition gate** | Paul's diagnosis: the old layers were "undefined, muddy garbage." A part, not a texture |
| 22 | **Melody lives in the foundation, never gated** | Direct fix for the wave-11 finding |
| 23 | **Scope: filter sweep + 2–3 earned layers, not 5 tiers** | Five tiers is where the clutter came from |
| 24 | Asymmetric smoothing, bar-boundary latching | Symmetric flutters; mid-phrase entry sounds like a bug |
| 25 | Reactive visuals from the scheduler, not an analyser | Analyser latency defeats the point |
| 26 | **Entities are classes** | Matches Orbital Overhaul's shipped contract |
| 27 | **Multi-file `src/` + concat build** | Paul's direction, 2026-08-30; differs from OO's single-script invariant |
| 28 | Overdrive is flags in the config, not a fork | One oracle, one test surface |
| 29 | Doc and session conventions carried from Orbital Overhaul | 41 changesets of evidence |
| 30 | Start Depth bonus counts toward score; `start_depth` also a stats field | Preserves the arcade feel while leaving a board filter possible |
| 31 | Kit modules vendored to `lib/` at a pinned VERSION, fixed here, backported manually | The fix is exercised by a real game before it reaches the shared repo |
| 32 | Every kit module carries a sibling `.NOTES.md` backport packet | A coinless-kit reviewer reads one file, not this game's history |
| 33 | Six further systems built kit-shaped from v1 | Extraction becomes a copy rather than a rewrite; overhead accepted |

---

## 21. Open questions

1. **Dim band (§3.7)** — keep at 65–80, move earlier, or cut? At a ~35–40 ceiling it is content almost nobody sees. Blocks the rendering spec.
2. ~~**Start Depth and the board (§4.6)**~~ — **RESOLVED 2026-08-30.** The bonus counts toward the submitted score, and `start_depth` ships as a registered stats field so a "from level 1" board filter is possible later without a schema change.
3. ~~**Kit consumption (§15.2)**~~ — **RESOLVED 2026-08-30.** Kit modules are vendored into `lib/` at a pinned `VERSION` and used directly. Fixes are made to the vendored copy here, kept game-agnostic, and backported to coinless-kit as a separate manual step. Six further systems are built kit-shaped from v1 for later extraction. See §15.7.
4. **Achievements (§15.5)** — local-only, or eventually server-backed? Changes whether the evaluator emits a submittable payload.
5. **Aggregate telemetry (§15.6)** — anything posted anywhere, or strictly local export?
6. **Mimic** — comfortable building an enemy I have flagged as likely to be cut? ~100 lines, cheap to try.
7. **Track count for v1** — five assumed. Each is real authoring work in `music-lab`, and the new layer discipline makes each one more work, not less. Three at launch is a legitimate reduction.

---

## 22. What changed from v0.1.0

v0.1.0 was written believing the Orbital Overhaul repo contained only a LICENSE. A stale cached fetch reported one commit; that contradicted known context and should have been caught. The repo is at version 1.0.0.40, changeset CS041, with a 1 MB build, a 528 KB GDD, and 41 changesets of conventions.

| Was wrong | Now |
|---|---|
| "No classes, flat plain objects" as a house rule | Entities are classes (§6.5, §16.1) |
| `setInterval` audio scheduler | Per-frame lookahead, never `setTimeout`/`setInterval` (§11.2) |
| Invented arrangement/pattern track format | Orbital Overhaul's step-sequencer table (§11.3) |
| "≥100 s before loop" with no baseline | Baseline is 21.8–48 s; target ≥ 90 s (§11.3) |
| Intensity layering proposed as new | Already built, auditioned, and frozen in v3.5; re-opened deliberately and narrowly (§11.4–11.5) |
| Meta systems invented from kit docs | Specced against shipped implementations (§15) |
| Invented repo and doc layout | Matches Orbital Overhaul's conventions (§16.4–16.5) |
| Invented test approach | Harness rules carried over (§17) |
| Decision log line 23 asserted the repo was empty | Removed; this section replaces it |

---

## 23. Out of scope for v1

Two-player modes, level editor, mod support, app packaging, server-verified replays, seasonal events, in-game currency, and morphing wells (Tempest 3000's moving webs invalidate the static geometry assumption the entire depth model rests on — a v2 conversation or never).
