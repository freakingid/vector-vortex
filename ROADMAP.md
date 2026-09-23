# ROADMAP — Vector Vortex

Changeset sequence from the current skeleton to ship. One line per changeset:
what it ships, which GDD sections it covers.

⛔ **This file is a plan, not a contract.** A changeset's real scope is its
`PLANNED-FEATURES-CS0##.md`, written just before it starts. Renumbering later
changesets is expected and cheap; editing a spec doc mid-flight is not.

---

## The sequence

| CS | What ships | GDD §§ |
|---|---|---|
| **CS001** | Repo skeleton, the sixteen well definitions, the depth model, static well rendering, `tools/well-lab.html` | §3, §16 |
| **CS002** | Fixed-timestep loop, one input struct across four devices, Skimmer movement and snap assist, shots, `tools/feel-lab.html` | §2, §4.1–4.2, §9, §16.1 |
| **CS003** | Entity spine: the class contract, spawner, collision, the Vaulter, well-clear, death and respawn, the Purge | §4.3–4.5, §6.1, §6.3, §6.5 |
| **CS004** | The Carrier and its split, the Weaver and its bolt, the Thorn; the `anchored` contract field and the debug spawn bench | §4.2, §4.5, §6.1–6.3, §6.5 |
| **CS005** | The Drifter and the Surger: the boundary lattice and `laneHop`'s fold-bound parameter, the discharge telegraph, the remaining two cargo rows | §6.1–6.3, §3.5, §6.5 |
| **CS006** | The well ends: the Dive, well progression and the colour-band roll, `laneState` and the dim band, `throatOffset` and the two degenerate wells, GDD §4.5 item 5 | §3.3, §3.6–3.7, §5, §4.5 |
| **CS007** | The run escalates: the heat clock and every value derived from it, GDD §8.1's introduction schedule, the spawner-stall call, telemetry as the tuning instrument | §8, §8.1, §15.6 |
| **CS008** | ✅ **Shipped 2026-09-13.** The rim fix (P1: every arrival killable) and the rim sweep (P1b: a fire-holding crossing kills), then front of house: scoring and extra lives, mode and Start Depth, one text path, the HUD and death fragmentation, title → mode → Start Depth → play → game over → restart, pause from five sources, Options, Credits, a Controls page with rebinding, and the sixth soak through the front door. ⚠ Nine phases — Paul's scope call, 2026-09-13, plus P1b | §4.2, §4.4, §4.6, §6.1, §7, §9, §10.4–10.5, §13, §17 items 8, 13, 14 |
| **CS009** | ✅ **Shipped 2026-09-16.** The audio engine: kit-audio (`AudioSys`, `MusicSys` with a stall-resyncing per-frame lookahead scheduler, the SFX player), the gesture unlock, `tools/music-lab.html` with SOLO, MUTE and PASS / FAIL per layer, the untiered `title` and `pulse` tracks, music by screen, OPTIONS' four volumes and MUSIC TRACK, `tools/sfx-lab.html`, the Classic SFX at their seats with the held Surger tone and the over-cap life sound, and the seventh soak (audio on and off, one hash). ⚠ Six phases plus a port commit; `drive` moved to CS012 | §4.4, §6.5, §10.5, §11.1–11.3, §11.7–11.8, §17 item 9 |
| **CS010** | ✅ **Shipped 2026-09-16.** The intensity director: kit-audio 0.3.0 (bar-latched tier gates, the filter sweep, a limiter on the music, the menu duck and the event dips), a live-danger signal read through one `dangerInputs()` that writes no state, two earned layers on `pulse` (`cycle` tier 2, `tick` tier 3, both PASS), Paul's lab gains behind the limiter, music-lab's INTENSITY and TIER, the rim pulse on `heart`'s onsets, and the eighth soak. Five phases, as planned | §5, §11.1, §11.3–11.8, §17 item 9, §19 |
| **CS011** | ✅ **Shipped 2026-09-16.** Meta: kit-names, kit-storage and kit-profile inlined at build, a silent ANONYMOUS first profile, settings / the Start Depth record / telemetry saved per profile, the local top 10 per mode with the bench flag, kit-leaderboard 0.2.1 and one `Leaderboard` over the bridge, SCORES (LOCAL / ONLINE), PROFILE with NAME entry (kit-input 0.8.0's text mode), and the ninth soak (working store and blocked, one hash). Six phases, as planned. ⚠ Achievements moved to CS015 (Paul's M4) | §4.6, §10.5, §15.1–15.4, §15.6 |
| **CS012** | ✅ **Shipped 2026-09-17.** Overdrive's core: the `drive` track (138 BPM, 36 bars A→B→C, Overdrive's AUTO), `C.MODE_FLAGS` and `modeHas()`, the Reaver in a new `07-enemies-overdrive.js` behind a second schedule table, OVERDRIVE on MODE with its own online board, SCORES per mode and a per-mode Start Depth record, the Jump (airborne as a phase, the lift, the shadow and kit-audio 0.4.0's high-pass), the combo multiplier at the kill sites with its readout, `comboLost`, the director's fifth input and `max_combo`'s real source, and the tenth soak. Six phases, as planned | §11.4, §11.7, §13, §14.2, §14.4, §14.6, §15.3, §15.4, §19 |
| **CS013** | ✅ **Shipped 2026-09-20.** Overdrive's tokens and its remaining enemies: five tokens in their own array behind one `dropToken()` (one draw per Overdrive kill, a total no-op in Classic), Bounty and Recharge instant, Lance / Spread / Ward with their readers, the two GDD §14.1 tables kept apart, `collect` and `wardBreak`; the **Warden** — aloft as a PHASE, the ninth contract field, and the **jump strike**, the build's fourth kill site; the **Mimic** on probation with `MimicShot extends WeaverBolt`, cutting in one schedule row; and the eleventh soak. Five phases, as planned | §14.1, §14.6, §6.4, §6.5, §7, §8.1, §17, §19 |
| **CS014** | ✅ **Shipped 2026-09-20.** The ring-flight Dive, hard-capped at 4 s / 6 rings: a fourth mode flag `rings` that is the whole gate AND the whole cut, `diveTime()` over `C.DIVE_TIME_OD`, six rings laid rim-first on a lattice of the well and constants alone, a take pass that is a lane match inside a depth crossing, `C.RING_POINTS` unmultiplied — and **the Dive's visual, in BOTH modes**, plus `ringTake` / `ringMiss` and the twelfth soak. Three phases, as planned | §5, §7, §13, §14.5, §19 |
| **CS015** | ✅ **Shipped 2026-09-20.** Achievements, local-only: `createAchievements()` in `20-achievements.js` as kit-achievements' draft (the table handed over as data, the clock injected), the `achievements` key v1 per profile, the UTC ISO week and a stride-walk rotation, thirteen write-only `tally` counters and two seats (the clear edge and the run's end) behind the one gate, **the id table — 23 lifetime ids and 18 weekly, save data from P3 on and every row MEASURED reachable** — the ACHIEVEMENTS screen off the title and OPTIONS, the `unlock` sound, and the thirteenth soak. Four phases, as planned | §10.5, §15.5, §17 items 10 and 12, §19 |
| **CS016** | ✅ **Shipped 2026-09-23.** Onboarding: GDD §12's four-second promise MEASURED against level 1 and restated to what ships (no base, lane or schedule moved); **twelve first-run prompts** — §12's seven and five rows CS013–CS015 left owing — once per profile in a band under every rim, from `src/22-onboarding.js`'s board-read triggers, on a new `onboarding` key written only at the seats that already write; **attract mode**, the title idled 20 s into a fixed-seed Overdrive demo that opens no run and moves no storage byte; the **pre-ship achievement pass** (two counters, two pool rows, one cut, two re-aimed tiers, `tools/reach-probe.js`); and the fourteenth soak. Four phases, as planned | §10.4, §12, §15.1, §15.5, §17 items 10 and 12, §19 |
| **CS017** | ✅ **Shipped 2026-09-23 — 1.0.0.** Ship, with no playtest: GDD §17's budget restated to the worst board the build can produce and MEASURED by `tools/perf-probe.js` (headless Chromium, frame cost and bytes per `draw()` as data), the canvas work gated by counter, every allocating expression on the draw path removed; the debug bench behind `C.DEBUG_KEYS` (off in the shipped build) and traverse-and-stop asserted per device; the Mimic KEPT on a measurement; the legal sweep (the package scanned clean; the repository goes private, Paul's); §19's six rows each given an at-ship verdict block, every hardware half a skipped playtest; the itch script's zip fallback; `C.GAME_VERSION` 1.0.0; and the fifteenth soak, §17 item 12's hundred runs in one file. Four phases, as planned | §14.6, §17, §18, §19, §21 #6 |
| **CS018** | **Planned 2026-09-23 — 1.0.1, the first post-ship patch.** GDD §19's ten open coverage gaps each given a carrier in one new file — §17 item 7's full 1..200, `pulse`'s A→B→C, the stick at every deflection, the shot's throat fade, `dist/` slice-identical to `src/` (and `build.js`'s `$`-unsafe injection fixed), the week key under three pinned time zones, level 1's first seconds re-measured, the four audio values §19 names, and the page's markup and package in the vocabulary scan; the VOICE VOLUME row cut from OPTIONS (kit-audio's bus stays, fed and moved by nothing); `C.GAME_VERSION` 1.0.1. Two phases, the second ending in the close | §9.4, §10.5, §11.1, §11.7, §12, §15.5, §17, §18, §19 |

⛔ **CS017 CLOSED THE ROADMAP** (Paul's S14), and the sequence to ship ended there. ⛔ **Post-ship work is a PATCH, one row per changeset, added by its own planning session** (Paul's CS018 planning prompt, 2026-09-23) from `STATUS.md`'s carried tasks and `NEXT-STEPS.md`.

⛔ **The sequence above has been renumbered +1 twice, and the second time is the
current one.** The first landed with CS004's split (2026-08-30):
`PLANNED-FEATURES-CS004.md` inventoried twelve in-repo pointers saying `CS005`
meaning *level flow*; CS004 P1 found **seventeen**, plus twenty-two more that
said `CS006` meaning *front of house* and two that said `CS014` meaning *ship* —
the whole tail shifted, not just the one label — and swept all of them.

⛔ **The second landed with CS006's split** (2026-08-30, CS006 P0): CS006 became
*the well ends*, a new CS007 became *the run escalates*, and everything from the
old CS007 onward shifted by one. The sweep read every `CS006`-and-later pointer
in `src/`, `scratchpad/` and the root documents and found **seventy-three**,
plus forty-seven renumbered labels in this file. ⛔ `log/` (34 hits) and
`archive/` (85 hits) were deliberately NOT swept — a closed record says what a
closed session believed, and correcting it is falsifying it. If you find another
live pointer, it means the same thing both times: read it, decide what it
*meant*, and correct it.

⛔ **A third shift landed with CS011 P1** (2026-09-16, Paul's M4): achievements
left CS011 for a new **CS015**, so onboarding became CS016 and ship CS017. The
sweep read every live `CS015` / `CS016` pointer and every "achievements are
CS011's" pointer. `log/` and `archive/` were not swept, for the same reason.

**CS001 through CS017 are closed; the game shipped at 1.0.0.** Their narratives are in `log/CS0##.md`;
`STATUS.md` carries only the changeset in flight. CS004's row above is what
actually shipped — three enemies, the bolt, `splitLanes()`, the seventh contract
field and the five-key debug bench — with ⚠ no introduction schedule and ⚠ no
scoring, both of which it deliberately left to CS007 and CS008.

**CS005 held as ONE changeset and did not want the seam after P2.** Five phases,
in the order the row above names them: the boundary lattice (P1), the Drifter
(P2), the Surger (P3), the two cargo rows (P4), the soak and the close (P5). The
plan's own worry was that P1's geometry plus two entities plus two cargo rows
was two changesets' work; it was not, and the reason is that ⛔ **P1 shipped no
entity.** A phase of pure geometry, pinned bit-identical to the previous build
by a 16,856-case sweep, is what let P2 and P3 each be one entity against a
settled helper rather than an entity *and* an argument about lane arithmetic.
⚠ The one thing that did grow past its estimate was `src/07-enemies.js` — see
below, and it is CS012's.

**What CS005 shipped against the row: everything, plus one field mutation the
plan did not have.** The Classic roster is complete at six, GDD §6.2's variant
table is complete at three, and four of GDD §4.5's five death conditions are
live (only item 5, a Thorn during the Dive, is unwired, and it is not a
`killDepth`). ⛔ The Surger expresses §4.5 item 3 by **mutating `killDepth` to
`0` and restoring it** rather than by an eighth contract field or a branch in
the collision pass — recorded in GDD §6.5 and `DECISIONS.md`, and the roster's
first mutated contract field.

**CS006 held as ONE changeset after splitting itself in two, and shipped its row
in full.** Six phases: the renumber (P0), past-99 progression and the band roll
(P1), `throatOffset` and the two degenerate wells (P2), the Dive (P3),
`laneState` and the dim band (P4), the soak and the close (P5). ⛔ **The Dive
REPLACED CS003 P2's between-wells hold** — the constant, the `state` field and
the branch are all deleted, and neither name survives in the built file — and it
lands GDD §4.5's fifth and last death condition, with the death-loop guard that
makes a fully thorned well terminate. `C.MIN_LANE_SPOKE_PX` 60 lands as a
**gate**: the Flat and the Stair were the only two wells under it, both are
offset, and no untouched well is inside 20 % of the line.

⚠ **What CS006 deliberately left.** The Dive has **no visual** — no camera
widen, no doppler, no descent rendering; GDD §5 scopes those as presentation and
no changeset owns them yet, which makes it the largest gap in the build between
what is simulated and what is seen. The spawner stall it inherited is untouched
and still CS007's, on purpose: the design call belongs to the changeset that
makes it reachable. And ⛔ **the single sanctioned baseline re-record was NOT the
one the plan predicted** — `test-cs004-p1.js`'s `GOLDEN_LANES` is green and
untouched, and `test-cs006-p2.js`'s `P1_DETERMINISM_HASH` is what the Dive moved.
`log/CS006.md` carries the cause, and CS006 P5 replaced the golden's guard role
with a draws-per-spawn count so CS007 could move it without laundering anything.
⚠ **CS007 never needed to** — see the correction under "Why this order" — but the
count is what let all three of CS007's `P1_DETERMINISM_HASH` re-records be
*checked* rather than merely recorded, which is the job it was built for.

**CS007 held as ONE changeset and shipped its row in full.** Five phases — the
spawner-stall split (P1), the heat clock and every value derived from it (P2),
GDD §8.1's introduction schedule (P3), telemetry (P4), the soak and the close
(P5). ⚠ **It was planned as six and dropped to five when Paul answered H1**: the
guarantee is held by a hard `C.CLIMB_MULT_MAX` of 1.40 with
`C.RESPAWN_PUSH_DEPTH` staying 0.55 at every level, so the phase that was to
build a derived push had no production code left to write.

**What CS007 shipped against the row.** ⛔ **One clock** — `heat()` and seven
accessors beside `C`, Form A endpoint interpolation, `C.HEAT_FULL_LEVEL` 99, and
`heat(1)` exactly 0. ⛔ **The introduction schedule as DATA** — `C.SPAWN_SCHEDULE`,
seven `{ level, kind }` rows, `eligibleKinds(level)` a function of the level and
nothing else, and CS004's ⚠ TEMPORARY bench constant deleted outright. ⛔ **The
spawner-stall call built as settled** — the release budget counts THREATS, the
readability ceiling keeps counting ENTITIES, `wellCleared()` untouched and no
Thorn expiring. ⛔ **Telemetry** — 29 columns including all eight heat-derived
values, a ring, a session switch that is OFF at every launch, and a CSV export to
`console.log`. And a **fifth soak file**, `test-cs007-p5.js`, which owns the run
that moves between bands rather than one pinned to a level.

⚠ **What CS007 deliberately left.** ⛔ **Nothing was tuned.** The instrument was
built and the curve was chosen from measured option tables, but no playtest
evidence has been collected and GDD §8.2's targets are still targets — it is logged
in `SKIPPED-PLAYTESTS.md`, and it is the one thing the suite cannot check. ⛔ **No
persistence** for the telemetry buffer: `kit-storage` owns the keyspace and
`22-meta.js` is still a placeholder, so CS011 owns it. **No scoring, no HUD, no
Start Depth** (CS008's), **no Dive visual**, **no spawn-lane weighting toward the
player's lane** (GDD §12's four-second promise is onboarding and is CS016's), and
**`src/07-enemies.js` is not split** — still CS012's. ⛔ **And the four-key
`C.TELEMETRY_PLACEHOLDER` shrinks rather than staying**: CS008 deletes two keys,
Start Depth a third and the combo the fourth, and a key left there after its
column has a real source is a column silently reporting zero.

**CS008 held as ONE changeset and shipped its row in full, in nine phases, not
the eight planned.** Paul played P1 and found that crossing a rim enemy with fire
held still killed him. That re-opened R4, and P1b — the rim sweep — was planned
and built between P1 and P2 with no renumber. Four more commits carried calls
Paul made after a phase (P2, P3, P6, and H4 after P4). ⚠ **The planned P5/P6
split was never needed.**

**What CS008 shipped against the row.** ⛔ **The rim is fair**: an enemy arriving
at the rim in a firing lane dies on every cooldown phase, which needed a float
tolerance (`C.HIT_DEPTH_EPS`) nobody had predicted, and a fire-holding Skimmer
kills any rim enemy a shot could kill on contact. ⛔ **Scoring has one writer**,
`addScore()`, which also owns extra lives (20k, then every 40k, capped at 6). A
stopped run scores but gains no life. **Start Depth** pays its bonus on clearing
the starting well, from a session record. **One text path** (`drawText()`), a HUD
that insets beside the touch buttons, and a fragmentation driven by the freeze
itself. **The front door**: title, mode (OVERDRIVE shown, locked), START DEPTH,
game over with RESTART, and pause from Escape, `p`, gamepad Start, a touch target
and a hidden tab. OPTIONS, CREDITS, and a Controls page with two sensitivities,
left-handed touch, auto-fire and keyboard and gamepad rebinding. Three kit
modules moved: kit-input to 0.6.0, and first drafts of kit-menu and kit-fx.
⛔ One baseline moved twice (P1, P1b) and `GOLDEN_LANES` gained two appended
entries, each with one cause. Nothing else moved in P2–P8.

⚠ **What CS008 deliberately left.** **No sound**: the over-cap life sound and
OPTIONS' Sound/Music row are CS009's. **No persistence**: the Start Depth
record, the settings and the bindings are session-only, and the `'quit'` and
`'died'` submits have a seat in `quitToTitle()` but no call. All of that is
CS011's. **No tuning**: a fire-holder has no death path on levels 1–4, and
whether those wells still feel tense is logged in `SKIPPED-PLAYTESTS.md`.
The touch buttons are live but undrawn, and the Dive still has no visual.
Neither has an owner.

**CS009 held as ONE changeset and shipped its row, less one track.** Six
phases: the engine (P1), music-lab and two tracks (P2), music in the game and
the OPTIONS rows (P3), sfx-lab and the SFX player (P4), the seats (P5), and the
seventh soak plus the close (P6). One port commit carried Paul's sfx-lab picks.
⚠ Six is one past the guideline, as plan R6 predicted, and its P4/P4b fallback
was never needed.

**What CS009 shipped against the row.** ⛔ **kit-audio** (`16-audio-engine.js`,
0.2.0): four buses, Orbital Overhaul's scheduler ported with a **stall resync**,
and an SFX player that plays recipes as DATA and holds a voice. Orbital Overhaul
burst 931 notes after a 60 s stall. Here, the frame after a hidden minute
schedules 2 steps. ⛔ **No sound before a gesture**: kit-input 0.7.0's
`onGesture` creates the context. **Two untiered tracks**, `title` (32 s) and
`pulse` (108 s, A→B→C), composed in `tools/music-lab.html`, which binds to the
build by text identity. **Music follows the screen.** OPTIONS gained MASTER,
MUSIC, SFX and VOICE VOLUME, and MUSIC TRACK. **21 SFX recipes**, Paul's picks
from `tools/sfx-lab.html`, sound at 23 seats, and `sfxVoice` is the eighth
contract field. The Surger charge tone is a held voice that follows the fuse,
passes a headless headroom gate over both tracks, and stops on any frozen or
off-play frame. An award past the life cap now sounds. ⛔ **The seventh soak
plays one front-door session with audio on and with audio off, and the state
hash is identical on every frame.** No baseline moved in any phase.

⚠ **What CS009 deliberately left.** **`drive` is CS012's** (Paul's A5): it has
nothing to play under until Overdrive exists. **The director is CS010's**: no
intensity, no tiers, no sweep, no ducking and no rim pulse. The tracks are
untiered, and the duck is a unity node. That also means the "at every tier" half
of the Surger tone guarantee cannot be tested before CS010. **No persistence**:
the volumes and the track setting are session-only, and that is CS011's.
After the close, Paul's music-lab work came in. "Struck, never swelled" meant
both tracks were re-articulated. Then he picked **120 BPM** for both and marked
**every layer PASS**. `pulse` now loops at 72 s (36 bars), and it is 8.2 dB
under the level he set, to hold the Surger tone's headroom gate. Paul's call:
a limiter on the music, in CS010, buys it back. The VOICE bus is live and nothing feeds it (A3). A pad-only
player is silent until a key, click or tap, and no changeset owns that.

**CS010 held as ONE changeset of five phases and shipped its row.** kit-audio
0.3.0 (P1), the director (P2, plus Paul's resume follow-up), the earned layers
and Paul's gains (P3), the rim pulse (P4), and the eighth soak plus the close
(P5). Paul answered all sixteen calls in the planning session.

**What CS010 shipped against the row.** ⛔ **Music reacts to the board, not the
level.** One top-level `dangerInputs(state, out)` reads live non-anchored
enemies, the deepest of them, the last life and `heatT(level)`. kit-audio's
`createDirector` smooths the mix asymmetrically on the audio clock (0.4 s up,
2.5 s down). Play drives it, a Dive reads zero, pause holds it, and a run starts
from 0. ⛔ **Tier changes latch to the bar line** in the setter; the scheduler
still reads no intensity. `pulse`'s `cycle` enters at 0.25 and `tick` at 0.40.
The foundation (melody included) is never gated, and there is no danger layer.
A Butterworth sweep follows the level, 600 Hz → 18 kHz. ⛔ **A limiter on the
music** (−24 dB, ratio 20) lets `pulse` play at exactly Paul's lab gains, and
the Surger tone's headroom gate became the limiter's curve model. The menu duck
is on the pause side only. The dips fire on `purge`, `purgeWeak`, `death` and
`extraLife`. The rim pulses on `heart`'s onsets by the audio clock. music-lab
gained INTENSITY and TIER, and plays limited. ⛔ **The eighth soak** hashes
`state` around every `dangerInputs` call, and shows that a constant danger
reading leaves the run's hash unchanged on every frame. No baseline moved.

⚠ **What CS010 deliberately left.** **The combo input is CS012's**: Classic
has no combo, so `INT_W_COMBO` is fed 0 and nothing was rescaled (Paul's D6).
Classic's played intensity peaks at 0.668, so **the sweep never fully opens in
Classic**, and GDD §19's "audible end to end" is not met by Classic play. CS012
re-measures intensity on Overdrive boards once the combo exists. **`title` stays
untiered** and nothing is tier 4. No ATK / REL / GATE controls in music-lab.
**No persistence** (CS011). Every ear check is a skipped playtest: the tiers in
play, the limiter in three browsers, the duck and dips, the rim pulse, and the
Surger tone at every tier. Still unowned: the Surger tone's own 1.106 sample
peak, the pad-only silence, the VOICE bus and the Dive's visual.

**CS011 held as ONE changeset of six phases and shipped its row.** The kit
inline, the store and the silent profile (P1), what a profile keeps (P2), the
local top 10 and the run's end (P3), the profile screens and NAME (P4), the
online board (P5), and the ninth soak plus the close (P6). Paul answered M1–M9
in the planning session, and took two findings during the build: the stored
`lastUsed` stays `""` after a first boot (P1), and DELETE runs the kit's
`remove(id)` before the key removes, the reverse of R12's wording (P4).

**What CS011 shipped against the row.** ⛔ **The game saves from a
double-clicked file.** kit-names, kit-storage and kit-profile are wrapped into the
single HTML unedited, and a form the wrapper cannot rewrite fails the build. One
`Store` declares `settings`, `progress`, `telemetry` and `scores`; the game never
builds a key string and never enumerates storage. The first launch makes one
ANONYMOUS profile and lands on the title. Every CONTROLS, KEYBOARD, GAMEPAD and
sound setting, the Start Depth record and the telemetry rows are saved per
profile, and a switch resets to shipped defaults before it loads. The run has
three seats (start, `'quit'` from pause, `'died'` after the frame's steps) and
one gate, `Meta.eligible()`, which a bench key in play closes. The local top 10
is kit-shaped (`createScores`, the kit-scores draft). kit-leaderboard 0.2.1
mints a run id without `randomUUID`, and every eligible run end submits once
with the registry's seven stats keys. SCORES has LOCAL and, with the module,
ONLINE; game over names a placing and the title names a queue. PROFILE creates,
selects, renames and deletes, and NAME takes an arcade wheel on every device or
typing on a keyboard, where a typed key fires no action. ⛔ **The ninth soak**
plays one front-door session over a working store and over a blocked one with the
same hash on every frame, and a reload brings the profile, the settings, the
record and the table back. No baseline moved.

⚠ **What CS011 deliberately left.** **Achievements are CS015's** (M4): no key,
no evaluator, no screen. **Overdrive's boards are CS012's**: SCORES lists CLASSIC
only, and the Worker keeps one best row per player per game id, so Overdrive
needs its own id before it posts. **The registry's rate bound was Paul's** (M7),
outside this repo: raised from 1,200 to 100,000 and redeployed after the close
(coinless-kit `e9a4c2c`), so deep Start Depth runs are no longer flagged. No time-window switch on ONLINE, no profile filter on
LOCAL, no score erase, no save-and-resume. On NAME a keyboard player's Space, Z
and X type. Every browser and device check is a skipped playtest: storage over
`file://` and itch.io in Firefox and Safari, NAME on a pad, and a real run posted
online. Still unowned: the pad-only silence, the VOICE bus, the Dive's visual and
the Surger tone's 1.106 peak.

**CS012 held as ONE changeset of six phases and shipped its row.** `drive` (P1),
the mode flags, the Reaver and Overdrive's schedule (P2), Overdrive at the front
door and on its own board (P3), the Jump (P5), the combo (P4) and the tenth soak
plus the close (P6). ⚠ **P5 and P4 ran in the reverse of the planned order**, at
Paul's request; nothing in P5 reads the combo, so the only visible consequence is
that `STATE_FIELDS.CS012` reads `["jump", "combo"]`. Paul answered O1–O16 in the
planning session and took **every recommendation**, which is the first time that
has happened in this project — and the reason is worth naming: the plan priced
each call with a measurement rather than an argument, and the one call it could
not price (O14's sweep) it recommended *accepting*.

**What CS012 shipped against the row.** ⛔ **Overdrive is a mode a player can
choose, and it is flags rather than a fork.** `C.MODE_FLAGS` is two rows of two
booleans with one reader, `modeHas()`; the Reaver goes through a second schedule
table, the track through `C.MODE_TRACK` and the board through
`C.LEADERBOARD_GAME_IDS`, so no flag exists for those three. ⛔ **The Jump is a
PHASE, not a Skimmer depth** — `collideSkimmer()` skips its whole pass while
airborne, which covers all seven contact killers and the rim sweep in one line,
and the build still has exactly one two-depth comparison. Six shipped comments
and two GDD sections had predicted the opposite for three changesets and were all
corrected in that commit. ⛔ **The combo multiplies at the four kill lines and
never inside `addScore()`**, so chips, the three clear bonuses and the Start
Depth bonus stay unmultiplied — and a Classic run is bit-identical, asserted step
for step against the combo mutated out of every site. ⛔ **OVERDRIVE is MODE's
first row, and the row order IS GDD §13's highlight** — no mark, no colour, no
flag, and fifteen closed front-door fixtures took one press each. Overdrive posts
to `vector-vortex-overdrive`, SCORES lists either mode, and `progress` became v2
per mode with a migration. `drive` is 36 bars at 138 BPM, untiered until Paul's
lab pass. ⛔ **The tenth soak is two pairs** — Classic against a jump-pressed,
Overdrive-stubbed twin, and Overdrive with music against Overdrive without —
matching on every one of 232,014 frames, with Overdrive's invariants checked on
every step of a played board. ⛔ **No baseline moved in any phase.**

⚠ **What CS012 deliberately left.** **Tokens, the Warden and the Mimic are
CS013's**, the ring-flight Dive CS014's, achievements CS015's. **`drive` ships
unheard**: its gains are the composer's, no mix was rendered, and Paul's lab
session ports as its own commit — ⚠ and a finding came out of trying to guard it,
that under the limiter's curve the headroom gate cannot catch a louder track at
all (red needs an input of 152.8), which is Paul's call and nobody's changeset.
**The sweep still does not open end to end**: O14 said accept, record and keep
GDD §19's ✗, and two independent measurements now agree at 0.6448–0.6519 against
the 1.0 it needs. ⚠ **Both numbers were superseded in CS013 and the row did not
move** — 0.6593 staged and 0.6860 over 114,446 front-door frames with the tokens,
the Warden and the Mimic live (CS013 P5's review). No intensity weight was rescaled, no telemetry column added, no
bench key for an Overdrive enemy, and no kit module backported. Still unowned:
the pad-only silence, the VOICE bus, the Dive's visual, the Surger tone's 1.106
peak, and the whole palette.

**CS013 held as ONE changeset of five phases and shipped its row.** The tokens
(P1), Lance, Spread and the Ward (P2), the Warden (P3), the Mimic (P4), the
eleventh soak and the close (P5) — the order the plan named, and ⛔ **the seams
were GDD §14.1's own**: P1 is the drop-weight table, the entity and the two
instant effects, P2 the three with a budget, each of which edits a hot, pinned
path. Paul answered T1–T11, W1–W6, MI1–MI3 in the planning session and took
**every recommendation**, the second changeset running for which that is true —
and, as in CS012, the reason is that the plan priced each call with a measurement
rather than an argument.

**What CS013 shipped against the row.** ⛔ **A token is not an enemy.** It lives
in `state.tokens`, `dropToken()` is its one way in, and the plan MEASURED why:
`state.enemies` has nineteen reader sites and a token inside it would shield the
enemies behind it from shots, be pushed down the well on every death, be refused
at `ENEMY_CAP` and be counted as a threat. ⛔ **Every kill at a kill site rolls,
and each Overdrive kill spends exactly ONE draw from the run's one stream** —
drop or no drop, at the cap too — which is a count a test can make, and it is a
total no-op in Classic, so `P1_DETERMINISM_HASH` never moved. ⛔ **Aloft is a
PHASE, not a depth**: the Warden arrives out of the throat like every other
threat, climbs its lane unshootable and goes aloft at depth 1 with a draw-time
lift, so nothing in the build gained a depth above 1 and the depth model is
untouched. It is killable by the **jump strike** and nothing else — the build's
**fourth kill site and fifth kill line**, a lane match on two flags, so the one
two-depth comparison in the build is still the dive strike's. ⛔ **The Mimic's
budget is its two states rather than a counter**: reflecting is the only thing
that opens it and an open one reflects nothing, so "at most one reflection per
opening" is structural — and `MIMIC_APEX` is bounded from the constants so every
reflection gives at least the Surger's 0.45 s fuse, which is §14.6's "hard sell"
answered in arithmetic. ⛔ **The eleventh soak is two paired sessions over one
board-reading driver** — Classic against a build with the token calls and the
jump strike stubbed out *and both new schedule rows removed*, and Overdrive with
music against Overdrive without — matching on every one of 239,202 frames, with
Overdrive's invariants checked on every played step. ⛔ **No baseline moved in
any phase.**

⚠ **What CS013 deliberately left.** **The ring-flight Dive is CS014's**,
achievements CS015's, onboarding CS016's — and GDD §12's four-second promise now
has two more things to teach, *jump at the thing you cannot shoot* and *leave the
lane your own shot came back down*. ⚠ **The Mimic ships ON PROBATION and the cut
is one line**: `{ level: 16, kind: "mimic" }` is the only thing that puts one on
a board, proved by mutating that row out and playing a session that releases zero
Mimics and zero reflections. The verdict is CS017's. **Nothing was tuned**: the
drop rate, the weights, the rise, the Warden's eleven constants and the Mimic's
are all ⚠ provisional and MEASURED on bots, and every ask is in
`SKIPPED-PLAYTESTS.md`. ⚠ **Spread triples the shots on screen** — the cap in
force is 24 where §17's performance budget still names 8 — and `drawShot()`
allocates on every call; both are CS017's to measure. F1 and F2 are recorded and
not fixed. Still unowned: the Dive's visual, the pad-only silence, the VOICE bus,
the Surger tone's 1.106 peak, and the whole palette.

**CS014 held as ONE changeset of three phases and shipped its row.** The flight
(P1), the visual and the two seats (P2), the twelfth soak, the review and the
close (P3) — the order and the seams the plan named. Paul answered RF1–RF9 in
the planning session and took **every recommendation**, the third changeset
running for which that is true, and for the reason CS012 and CS013 both had: the
plan priced each call with a measurement rather than an argument.

**What CS014 shipped against the row.** ⛔ **Overdrive's Dive is a ring flight
and it is the SAME dive** — one module, one beat, one strike, one termination
guarantee, and `modeHas("rings")` decides only how long the beat runs and
whether there is anything in it. `diveTime()` returns `C.DIVE_TIME_OD` 4.0 or
`C.DIVE_TIME` 2.6 and ⛔ **each is the WHOLE dive, grace included**, so the cut
takes the length with it. ⛔ **A ring is not an enemy and not a token either**:
it is a field on `state.dive`, `layRings()` is its one way in and `resetDive()`
empties it, so the set inherits the beat's whole lifecycle with no second reset
caller — and the plan MEASURED why, that only 5 of `state.enemies`' 20 readers
run inside a dive and both a ring would meet are wrong by default (§4.4's push
collapses 3 of 6 rings onto 0.55; `startDive()`'s `anchored` filter drops them
on the repeat). ⛔ **The lattice is a function of the WELL and of constants and
of nothing else** — no draw, no heat, no level, not the craft's lane — so a dive
still spends **zero** RNG draws in both modes. ⛔ **Each ring is resolved ONCE
and "you stop earning" is the ABSENCE of a call**: no miss counter, no streak,
no full-set bonus. ⛔ **A ring pays through `addScore()`, unmultiplied, building
nothing and rolling nothing** — the Bounty's row — so the four kill sites and
five kill lines are unmoved and `09-collision.js` was never opened. ⛔ **The
Dive you can see, in both modes**, and "not a second renderer" honoured
literally: `C.DIVE_RUNGS` cross-sections of the well sweeping past through one
function of two numbers, no camera, no canvas transform, `13-render-well.js`
untouched, and both alphas at 0 leaving the hash identical. ⚠ A world ZOOM was
priced first and is **MEASURED unavailable** — the widest well caps it at ×1.10,
and past that the craft leaves the frame. ⛔ **The twelfth soak is five
front-door sessions**: Classic bit-identical against the ring calls stubbed and
the flag cut, Overdrive with music against Overdrive without, and ⛔ **the
one-line cut played end to end**, with Overdrive's invariants on every step and
non-vacuity for each. ⛔ **No baseline moved in any phase.** GDD §19's Overdrive
row closes here, met.

⚠ **What CS014 deliberately left.** **Achievements are CS015's**, onboarding
CS016's, ship CS017's — and GDD §12's four-second promise now has a third thing
to teach: an Overdrive dive is something you **steer**, and nothing on screen
says a ring is worth going to. **Nothing was tuned**: `RING_POINTS` 100,
`RING_ARC_LANES` 1.5, `RING_LANE_STEP` 0.25 and the five visual values are all
⚠ provisional and MEASURED on bots, and every ask is in `SKIPPED-PLAYTESTS.md` —
⚠ including plan K7's, **whether a 4.0 s dive still feels like a breath** when it
takes the Dive's share of a run from 13.8 % to 19.8 %. **No telemetry column, no
`tally` field, no HUD item, no spawn row, no heat accessor, no kill site, no
`sfxVoice`, no `ENEMY_KINDS` row and no kit edited.** ⚠ **The sweep still does
not open end to end**: the twelfth soak measured **0.6539** with the flight live,
below CS013's 0.6860, which stands — the row keeps its ✗ and nothing was
rescaled (Paul's D6). ✅ **The Dive's visual leaves the unowned list**, where it
had sat since CS006. Still unowned: the pad-only silence, the VOICE bus, the
Surger tone's 1.106 peak, the whole palette and the HUD sizes, F1 and F2.

**CS015 held as ONE changeset of four phases and shipped its row.** The module
and the store (P1), the facts and the seats (P2), the id table and the surface
(P3), the thirteenth soak, the review and the close (P4). Paul answered A1–A12
in the planning session and took **every recommendation**, the fourth
changeset running, with one qualification (A8: `purge_wide` dropped) — and
answered two gaps after P2 and three questions after P3 the same day.

**What CS015 shipped against the row.** ⛔ **The ids are save data and were
written ONCE, against the finished game**: 23 lifetime rows (nine tiered) and an
18-row weekly pool, five a week, ⛔ **every row MEASURED reachable per row**
against four front-door probe passes — and a row no board reached was cut or
reported, never lowered. ⛔ **"Lifetime" is one run, banked**: `lifetimeTiers` is
monotonic, so a per-run threshold over a store that never resets is "your best
run, kept", and `achievements` stays v1 with no bookkeeping written at every
clear. ⛔ **The evaluator reads one flat facts object at two seats and no
third**, behind the gate the boards already use; a per-well window is the delta
since the last clear edge, in Meta's closure, and costs no `tally` field. ⛔ **An
unlock is worth nothing** — no points, no life — so the five item-8 price
decoders needed no term and no kill line moved. ⛔ **The thirteenth soak plays
both modes through the front door and hashes identically on every frame against
both seats mutated out**; a reload holds every unlock, and a week roll empties
the weekly list alone. ⛔ **No baseline moved in any phase.** GDD §19's Meta row
closes here, its last ✗ met.

⚠ **What CS015 deliberately left.** **A pre-ship achievement pass is owed, in
CS016 or CS017** (`NEXT-STEPS.md`, Paul's, after P3): plan §9's two weekly rows
that had no fact — three tokens in one well, a Thorn chipped to nothing — each
owe one `tally` counter and one pool row, and three threshold calls
(`depth_reached`'s top tier collides with `dim_band`; `dives_done` fires one well
behind `wells_cleared`; `wellShotPar` 120 came from a trigger-holding driver).
⛔ **Adding a pool row reshuffles which five a week shows, so it is free only
before ship.** ⚠ `mimic_kill` rides on the Mimic's probation (CS017). **No toast
and no onboarding**: an unlock is heard and never seen until the player opens
the screen, which is CS016's to teach. **Nothing was tuned**: every threshold,
name and note is ⚠ provisional and MEASURED on bots, and every ask is in
`SKIPPED-PLAYTESTS.md`; `unlock` is candidate A, batched into `drive`'s lab
session. ⚠ The vocabulary scan became a substring scan along the way (Paul's
call, before P3). Still unowned: the pad-only silence, the VOICE bus, the Surger
tone's 1.106 peak, the whole palette and the HUD sizes, F1 and F2.

**CS016 held as ONE changeset of four phases and shipped its row.** The prompts,
the band and the key (P1), attract mode (P2), the pre-ship achievement pass (P3),
the fourteenth soak, the review and the close (P4). Paul answered N1–N13 before
P1 and took **every recommendation**, the fifth changeset running — all five
candidate prompt rows in, and the achievement pass here rather than in ship —
and made three calls mid-flight: the demo's line names Fire (P2),
`dives_done`'s tiers came down to what the probe could reach (P3), and the
probe was kept as `tools/reach-probe.js` (after P3).

**What CS016 shipped against the row.** ⛔ **The headline promise was MEASURED
false before planning began, and the sentence moved, not the game**: a mover
kills inside three seconds (64 of 64), a passive player dies between 6.9 and
11.4 s, and both floors are heat-clock bases, so GDD §12 now says exactly that
(N1-A) and `GOLDEN_LANES` and `P1_DETERMINISM_HASH` never moved. ⛔ **Nothing of
the changeset is on `state`**: the queue, its clock, the seen set, the idle clock
and the demo's flag live in the module's bag, Meta's closure and `Game`'s
closure, so a played session hashes identically with the module stubbed — in
both modes, on every frame, in the fourteenth soak. ⛔ **The demo is a run with no
start seat**: `run` stays null, the one gate reads false with no new term, and
the store's bytes are identical across a demo that clears a well and dies.
⛔ **Once per profile is a key written only where writes already happen**, which
is what kept CS015's "no play-step write but the clear edge" pin untouched. The
achievement pass landed while the pool's length was still free: 23 lifetime and
19 weekly, every row MEASURED reachable by a probe that is now a tool. ⛔ **No
baseline moved in any phase.** GDD §19's Onboarding row — added by P1 — closes
met.

⚠ **What CS016 deliberately left.** **Ship is CS017's**: the Mimic's verdict
(and with it prompt row 11 and `mimic_kill`), the performance budget ("8 shots"
against Spread's 24; `drawShot()` allocates per call, and `drawPrompt()` builds
one `rgba()` string per frame of a fade), the seven debug spawn actions, the
device matrix and the legal sweep. **Nothing was tuned**: `PROMPT_TIME`,
`PROMPT_FADE`, `PROMPT_COLOR`, the demo's seed, depth, length and Purge period
are ⚠ provisional, and every ask — the band's readability, K13's `—` and `·`
glyphs, the demo read as a demo and its silence on a fresh load, and a deep
Start Depth's eight-line queue — is in `SKIPPED-PLAYTESTS.md`. **No toast**
(CS015's A1 stands): row 12 says where to look, once per profile. **No level-1
retune and no spawn-lane weighting** (N1-A). **No sound, no screen value, no HUD
rectangle, no kill line, no telemetry column and no kit edited.** ⛔ After ship
the achievement pool's LENGTH is frozen with its ids. Still unowned: the pad-only
silence, the VOICE bus, the Surger tone's 1.106 peak, the whole palette and the
HUD sizes, F1 and F2.

**What CS017 shipped against the row.** ⛔ **Every hardware clause was split in
two, and only the half a machine can measure was claimed**: the budget board's
frame cost (4.3 ms p50 at 1× CPU, ~18 ms at 4×, software raster) and bytes per
`draw()` are `tools/perf-probe.js`'s DATA, the suite holds the canvas WORK at
156 strokes and 8 text calls by counter, and "60 fps on a 2019 laptop and a
2021 phone", traverse-and-stop by hand, the two other browsers and every "by
ear" are `SKIPPED-PLAYTESTS.md` entries. ⛔ **§17's allocation sentence met a
`CLAUDE.md` invariant and lost**: it is scoped to the draw path, where every
allocating expression is gone (four sites, then `wellBandColor()`'s loop, then
the HUD and game-over strings, both by Paul's addenda). ⛔ **No key a player can
press voids a run**: the bench's eight bindings exist only in a flagged build,
and a sweep found one closed file that had gone VACUOUS without going red. The
Mimic is KEPT: for a player who trusts their own shots, a reflection kills less
often per instance than a Weaver bolt or a Warden. GDD §19 carries an at-ship
block per row — 45 clauses, none ✗ at the close — and **§17 item 12's hundred
runs were met in one file for the first time**, all sixteen wells played.
⛔ **No simulation line moved in any phase**: `P1_DETERMINISM_HASH` 1229033515
and `GOLDEN_LANES` stand, as they have since CS009.

⚠ **What CS017 deliberately left.** **Nothing was tuned** — not the glow's two
passes (the lever if a phone ever measures slow, S4-C), not the director's
weights (S11), not the Mimic's dodge in the soaks' driver and `attractDrive()`,
which MEASURED worse than no dodge for a bot. **The engine's own allocation**
under `entityPoints()` (~5 KB a budget frame, V8's boxed doubles) is recorded,
not chased (S3-B). **Ten coverage gaps the §19 sweep named** stay open —
§17 item 7's loop one short, `pulse`'s A→B→C, the stick at one deflection,
the shot's throat fade, no `dist/`-vs-`src/` slice, `TZ` unpinned, level 1's
first seconds measured once, `INT_*` / `FILTER_*` unpinned — because new
coverage belongs in a new changeset's file. **Paul's, outside the repo**: the
repository made private, the itch page's copy, the upload. **Carried, and
none of it ship's** (S13): Paul's one lab session (`drive` and five cues), the
kit backports, the pad-only silence, the VOICE bus, the Surger tone's 1.106
peak, the palette and HUD sizes, `glow-lab`'s audition, F1, F2, the four
unreachable entity cases, and whether the headroom gate should bound the
limiter's input. ⛔ **Frozen at ship**: the 23 lifetime and 19 weekly
achievement ids and the pool's length.

---

## Why this order

**Control feel is provable at CS002, before anything can be shot.** P1 is the
pillar that cannot be recovered by tuning a constant later — a rim that feels
imprecise is a game nobody finishes, and every system built on top of a bad rim
has to be re-felt when it changes. CS002 ends with a measuring instrument
(`feel-lab`) and a traverse-and-stop number, not an impression.

**The Classic roster takes two changesets, split by risk, not by count.** CS004
is the three enemies that pour into CS003's contract as it shipped — the
Carrier's split is the spawner's first non-spawner caller, and the Thorn is what
`purgeable` and `blocksClear` were written for. CS005 is the two whose
*readability is the feature*: both the Drifter's visible invulnerability and the
Surger's telegraph carry a ⛔ in §6.3, both need geometry or rendering work the
spine did not anticipate, and both are the enemies whose failure mode is a death
the player cannot account for. The split is also forced — the Drifter Carrier
(L18) and Surger Carrier (L23) cannot be built before their cargo exists.

**The music risk lands at CS010, mid-run, not at the end.** This is the one
system with a recorded prior failure. It cannot come earlier: the director's
trigger is live danger, so auditioning it requires a game that produces danger —
CS003 through CS008. CS010 is the first changeset where the audition is
meaningful, and it is followed by six more, so a failed audition has room to take
its named retreat (drop the `tier` fields; every gate builds always-on) without
threatening the ship date.

**Level flow is two changesets, split by cause, not by size.** The old CS006
carried five systems and the seam is visible once the files are counted: the
well half (progression, the band roll, `laneState`, `throatOffset`, the Dive)
and the run half (the heat clock, the introduction schedule, the spawner-stall
call, telemetry) **share exactly one file, `23-main.js`, and they share it in two
different functions.** The well is CS006; the run is CS007.

⛔ **The split's real justification is a BASELINE RE-RECORD, and this paragraph
named the wrong baseline** — see the ⚠ correction below, written after both
changesets measured it. It predicted `test-cs004-p1.js`'s `GOLDEN_LANES` on three
grounds: the Dive changing when level 2 starts inside its 3,000-tick window, heat
changing the spawn interval, and the introduction schedule changing the draw count
per spawn. **All three are measured false.** The argument for splitting survives
intact on the baseline that did move: **separately-reasoned re-records instead of
one that absorbs three unrelated causes at once** — and a re-record is the one
moment a stray RNG draw can be laundered into a new baseline, so a re-record with
one nameable cause is worth two commits. The
supporting reasons: CS006 already has to edit four closed test files without
adding two more to the same `run-all.js` output, and the heat clock's guard is
written in `respawnSkimmer()`, which the Dive changes — so heat has to land
*after* the Dive rather than beside it.

⚠ **MEASURED AT BOTH CLOSES, AND THE PREMISE ABOVE IS WRONG IN BOTH HALVES — the
split is still right, for a better reason.** The Dive does **not** move
`GOLDEN_LANES`: its 3,000-tick window now crosses a well clear, but the extra
1.6 s of dive costs it no spawn, so the recorded sequence is identical and CS006
re-recorded nothing there. ⛔ **And neither does the introduction schedule, which
is what this paragraph used to predict.** Measured at CS007 P3: the golden's
window ends at **level 2** (2,065 ticks at level 1, 935 at level 2), and GDD
§8.1's eligible set is **one entry** throughout that band — a one-entry set spends
no draw, so the draw count per spawn is unchanged where the golden lives. ⛔ **And
it was not heat either** (the other prediction, in `PLANNED-FEATURES-CS007.md`
§1.1): level 2's spawn interval is **1.5472**, not the 1.428 four documents
printed, which is level *5*'s. `GOLDEN_LANES` is on its original `9ebd27b`
recording, all sixteen entries, through the whole of CS006 and CS007.

⛔ **What actually moved, both times, was `test-cs006-p2.js`'s
`P1_DETERMINISM_HASH`** — once in CS006 (the Dive) and three times in CS007 (the
threats split, heat, and a closed soak's fixture becoming a level), each with one
nameable cause. **The conclusion holds and is stronger for it: two changesets
meant separately-reasoned re-records rather than one that absorbed three unrelated
causes at once.** `test-cs006-p5.js`'s draws-per-spawn count is what made each of
CS007's three checkable rather than merely recorded — it needs no baseline and
survives every retune, and CS007 P3 made it a function of the LEVEL, which is
strictly more than it could say before.

**A playable Classic game exists at CS008.** Everything after it is addition.
If the schedule breaks, the game that ships is Classic-only and complete rather
than Overdrive-half-done.

**Overdrive is sequenced by risk, cheapest first.** CS012 is flags and one
parameter-variant enemy. CS013 is content. CS014 is the only piece with a
different control model and the highest build cost, so it sits alone, late, and
cuttable in one commit.

⛔ **Cut order under schedule pressure, in this order:** CS014 (ring-flight
falls back to the Classic thorn-dodge), then the Mimic in CS013, then CS012's
`drive` track — `title` plus `pulse` is a shippable floor. None of these three
cuts touches another changeset's code.

⚠ **Two of the three cuts are now BUILT AS ONE LINE and PROVED as one line**:
`rings: false` in `C.MODE_FLAGS`' Overdrive row (CS014, `test-cs014-p1.js` on a
driven board and `test-cs014-p3.js` from the boot title) and
`{ level: 16, kind: "mimic" }` out of `C.SPAWN_SCHEDULE_OVERDRIVE` (CS013 MI3).
⚠ **The DESCENT is deliberately not inside CS014's cut**: it is drawn in both
modes, so cutting the rings leaves a Classic dive that still reads as a flight.

---

## GDD open questions — all resolved

⛔ **GDD §21 carries no open questions.** All seven are resolved as of
2026-08-30; #1 and #4–#7 below were taken on the recommended defaults.

| GDD §21 | Resolution | Lands in |
|---|---|---|
| #1 Dim band (§3.7) | Keep as specced: levels 65–80 at `DIM_BAND_ALPHA` 0.18, lanes lighting on occupancy, shot travel and Surger charge. Spend no tuning time on it — the renderer handles lane occupancy anyway, so the band is a few lines on top of work already required. Re-audition only if telemetry ever shows a player past level 65. | CS001 P3 — **shipped** |
| #4 Achievements | Local-only. The evaluator returns a payload-shaped object from day one, so server-backing later is wiring rather than a rewrite. | CS015 (moved from CS011, Paul's M4) |
| #5 Aggregate telemetry | Strictly local CSV export. Nothing is posted anywhere. It is a tuning instrument and explicitly not anti-cheat; a destination adds a privacy surface for no tuning benefit. | CS007 P4 — **shipped**; ⛔ persistence is CS011's |
| #6 Mimic | Build it. ~100 lines against an existing shot path, and the probation verdict needs a playtest rather than an argument. Cut it in CS017, without ceremony, if it reads cheap. | CS013; ✅ **KEPT at CS017** (S6, on a measurement — the playtest stays skipped) |
| #7 Track count | Three at launch: `title`, `pulse`, `drive`. `deep` and `rush` are new table entries with no code change, so they are post-ship content, not a scope cut. | `title`, `pulse`: CS009 — **shipped**. `drive`: **CS012** (Paul's A5, 2026-09-16) |

---

## Still open, and not owned by a changeset

Design calls for Paul, all carried in `STATUS.md`, plus one measured
engineering note that is not a design call at all. The first two are not enemy
questions, so neither CS004 nor CS005 touched them. The third is an enemy
question that only becomes reachable when the introduction schedule lands, which
is why it is named against CS007 rather than left unowned. The last is the
module seam, named against CS012 for the same reason.

- ✅ **CLOSED by CS008 P1 and P1b — the rim hit-window defect.** An enemy parked
  at depth 1.000 was hittable on 1 tick in 4. P1 made every arrival killable
  ((A) + (B) + a float tolerance the handover had not predicted). P1b's rim sweep
  made a fire-holding crossing kill, after Paul played P1 (`DECISIONS.md`,
  2026-09-13). `test-cs008-p8.js` asserts the arrival property on played boards.
  `log/CS008.md`; the spent plan is in `archive/`.

- ✅ **CLOSED by CS006 P2 — GDD §3.3's `throatOffset` is defined.** It is a
  translation of the throat polygon in normalized rim space, applied **after**
  the centroid scale, DATA and never written at runtime. GDD §3.3 carries the
  definition; `test-cs006-p2.js` asserts it on all sixteen wells.
- ✅ **CLOSED by CS007 P1 — a standing Thorn holds a spawner slot, and the budget
  now counts THREATS** (found CS004 P5, settled by Paul before CS007's spec, built
  at `adb0bd7`). `updateSpawner()` blocks on `state.enemies.length >=
  min(ENEMY_CONCURRENT, ENEMY_CAP)`, a count of *everything* in the one array —
  so three Thorns nobody shoots hold the spawner shut and the well never clears.
  ⛔ **CS007 P1 built the split**: the release budget counts `blocksClear && !dead`
  (`threatCount()`), `C.ENEMY_CAP` keeps counting entities at one enforcement
  site, no Thorn expires and `wellCleared()` is untouched. Reasoning in
  `DECISIONS.md`; the repro, the re-record and its cause in `log/CS007.md`.
  ⛔ **`test-cs007-p5.js` verifies it end to end on a played board**: every blocked
  beat in a twenty-run soak is legal against a threat count recomputed off GDD
  §6.5's contract field, and reverting `threatCount()` turns that red.
- ✅ **CLOSED by CS006 P2 — the Flat (11) and the Stair (9) are offset.** The
  Flat's shortest lane-centre spoke went 23.6 → 151.8 px, the Stair's 30.4 →
  79.6 px, both past `C.MIN_LANE_SPOKE_PX` 60. ⚠ **The numbers are settled and
  the picture is not** — nobody has looked at either shape, and the skipped ask is in
  `SKIPPED-PLAYTESTS.md`.
- ✅ **DONE by CS012 P2 — the split, by Paul's O15.** `src/07-enemies-overdrive.js`
  sits in `MANIFEST` directly after `07-enemies.js` and holds Overdrive's roster
  (the Reaver; CS013's Warden and Mimic). Nothing moved out of `07-enemies.js`,
  which gained a header pointer. The note below is kept as the record.
- **`src/07-enemies.js` wants splitting, and the moment is CS012.** Measured
  at the CS005 close, not felt: it went from **39.1 KB / 782 lines** at CS004
  close (`74fb50c`) to **65.2 KB / 1,277 lines** — **+67% by size for two
  entities** — and it is **65% comment by line** (833 of 1,277), which is
  correct and is the point: this is the file where an entity's contract, its
  cycle and every judgment call behind them are written down. CS012 and CS013
  add three more entities (Reaver, Warden, Mimic), which puts it past 100 KB.

  ⛔ **Not now, and not as its own changeset.** The natural seam is **Classic
  versus Overdrive** — it falls exactly where the roster does, so it is a move
  and not a redesign — and the natural moment is **CS012**, when a new enemy
  module is being created anyway and the split costs one file that was going to
  be written regardless. `build.js`'s two-way `MANIFEST` check makes adding a
  module cheap and safe: a file on disk but unlisted fails the build, and so
  does a file listed but absent. Assumption #7 says no changeset is reserved for
  refactoring; ⛔ **this note is the alternative that rule asks for** — recording
  the measurement and the moment is what stops a future session rediscovering it
  as a surprise and taking the seam somewhere worse.

---

## Assumptions and decisions

| # | Decision | What would change it |
|---|---|---|
| 1 | Sixteen changesets, sized so each holds 3–5 phases of one session each. ⚠ **CS008 held nine** (eight by Paul's U3 scope call, plus P1b) and four follow-up commits. Every phase landed in its own commit, and the planned P5/P6 split was never used. The guideline bent for a deliberate scope call and did not break. ⚠ **CS009 held six** plus one port commit, which its plan's R6 predicted | A phase that repeatedly overruns a session means the changeset was too coarse; split it rather than letting phases sprawl |
| 2 | ✅ **Settled — enemies split across three changesets**, and the split was right. Spine plus one enemy (CS003), the three that fit the contract (CS004), the two that needed new machinery (CS005) | Originally two. CS004's scope check found a contract field missing, a `laneHop` degeneracy the Drifter is the first entity to reach, and two cargo rows that cannot be built before their cargo. The open question left here was whether CS005 was really two sessions; it was **five phases in one changeset and wanted no seam**, because P1 shipped geometry and no entity, which is what kept P2 and P3 to one entity each. ⛔ Nothing further changes this — the Classic roster is complete. The three Overdrive enemies are CS012 and CS013 and are scoped there |
| 3 | Telemetry ships with the heat clock, not with the other meta systems. ⚠ Since CS006's split that is the **new CS007**, not CS006 — the same pairing it always had, one row further down | It is a tuning instrument, and the tuning it serves is difficulty. An instrument built one changeset *before* the thing it measures ships with a column list that has to be edited the moment heat lands, and `TELEMETRY_FIELDS` and `push()` must be edited together (GDD §15.6). If difficulty tuning turns out to need nothing beyond `feel-lab`, move it back to CS011 with the other meta systems |
| 4 | Meta (CS011) sits after audio, not before | Meta's only external dependency is the Worker registry entry, which Paul can make in parallel today. If that registration proves slow, move CS011 earlier |
| 5 | Front of house (CS008) comes before audio | The audio director reads score, combo, lives and level; specifying it against a real HUD and a real game-over path is cheaper than against placeholders |
| 6 | ✅ **Settled at CS016 — GDD §12's four-second promise was onboarding, and the SENTENCE moved.** Settled 2026-08-30; closed 2026-09-23 by Paul's N1-A: MEASURED false in its passive half, restated, and no spawn lane weighted | CS003 P5 flagged that this file and `STATUS.md` disagreed — this file read it as a spawner-tuning question for the level-flow changeset, `STATUS.md` read it as onboarding. `STATUS.md` wins: it needs spawn lanes weighted toward the player's lane, which is a *teaching* decision made against a first-run experience, not a difficulty curve. If CS007's heat pass finds it falls out of the spawner for free, take it there and note the move. ⚠ **It did not** — CS007 touched no spawn-lane selection at all, and `pickSpawnLane()` is unchanged since CS003 |
| 7 | No changeset is reserved for refactoring | If the CS008 HUD and the CS011 meta screens end up duplicating layout code, propose a refactor changeset then — don't reserve time for a problem that may not appear |
| 8 | `ROADMAP.md` is its own file, not a section of `DECISIONS.md`. Paul's call, 2026-08-30 | It needs editing every time a changeset is renumbered, and `DECISIONS.md` is append-only. Adding it means one row in `CLAUDE.md`'s document map and one in GDD §16.4, both on the "on demand only" read contract |
| 9 | The enemy palette is chosen as a set in CS004 P1, all six Classic colours at once, all ⚠ provisional | Picking four now and two in CS005 guarantees a clash, and `C` already carries forward-looking constants. `tools/glow-lab.html` remains unbuilt and unowned; whichever changeset takes the art pass owns it |