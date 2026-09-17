// 17-audio-tracks.js — the music, as DATA: `title`, `pulse` and `drive` (GDD 11.3, 11.7).
//
// ⛔ COMPOSED IN tools/music-lab.html AND PORTED VERBATIM. This whole file is
// the lab's BLOCK B, character for character (test-cs009-p2.js). Never re-tune
// a gain here: move the slider in the lab, press COPY TABLE, and paste what it
// prints over this file.
//
// ⛔ A `tier` ONLY ON A LAYER MARKED PASS, and only on a track with `bar` (steps
// per bar): a tier change waits for the bar line (GDD 11.5). A layer with no
// tier is the always-on foundation, and ⛔ THE MELODY IS ALWAYS FOUNDATION.
// `pulse` earns two layers (Paul's D1, CS010): `cycle` at tier 2, the hook, and
// `tick` at tier 3, the groove. `title` is untiered. `audition` is the lab's
// PASS / FAIL mark; the scheduler reads neither it nor `tier`. ✅ Paul marked
// every `title` and `pulse` layer PASS in the lab (2026-09-16), after the
// articulation pass below. The music plays through a limiter (CS010), so those
// gains are Paul's lab balance as he set it.
// ⚠ `drive` (CS012 P1, O13) is UNAUDITIONED and UNTIERED: no layer carries a
// mark or a tier, and its gains are the composer's. Paul's lab session marks,
// tiers and balances it, and ports as its own commit.
// `heart` and `drive`'s `kick` are marked `beat: true` (CS010 P4): the engine
// reports each of their onsets through `onBeat`, on the context clock. A hand
// edit; COPY TABLE keeps it. One such layer per track.
//
// ⛔ EVERY LAYER IS WRITTEN AS A PART, to be recognisable played solo (GDD
// 11.4(c)): a tune, a line, a figure or a groove. Never texture.
//
// ⚠ SETTLED — EVERY NOTE IS STRUCK, NEVER SWELLED (Paul, 2026-09-16; GDD 11.3).
// The game is punch and staccato, right on the beat; a soft attack or a long
// ring reads as imprecise. So, on every layer:
//   attack   atk <= 0.005 s
//   decay    it starts within 0.05 s of the onset: `rel` is at least the note's
//            sounding length, so nothing holds and nothing fades in
//   length   a note SOUNDS for at most its layer's GATE, in steps, whatever its
//            written length: the rhythm is carried by the onsets
//   filter   a sweep closes over the note (bright to dark), never opens
//
// ⛔ THIS FILE READS NO GAME GLOBAL. The lab runs it with no config object.

// MIDI note number to Hz. 69 is A4.
function midiHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

// One layer's empty step row.
function trackRow(n) { return new Array(n).fill(null); }

// Writes one note into a row. `dur` is in steps; `g` scales the layer's gain.
// A noise layer reads no pitch, so its cells pass 69 and `f` stays positive.
function trackNote(row, step, m, dur, g) { row[step] = { f: midiHz(m), dur: dur, g: g }; }

// ---------------------------------------------------------------------------
// TITLE. G major, 120 BPM (Paul's pick), 16 steps to a bar, 8 bars: 16 s to
// the loop point.
// A (bars 0-3) states a four-bar theme that settles on A over D. B (bars 4-7)
// answers it, climbing to G5 and falling home to F#4, which leans back into
// bar 0's G. Four layers, each struck and short (the header's rule):
//   theme   the tune, and nothing else carries it
//   bells   a four-note falling figure on each bar's second half, high
//   glow    two chord tones a bar under the tune, stabbed
//   ground  the root on beat one, the fifth on beat four
// ---------------------------------------------------------------------------
function buildTitleTrack() {
  const BAR = 16, BARS = 8, STEPS = BAR * BARS;
  const theme = trackRow(STEPS), bells = trackRow(STEPS), glow = trackRow(STEPS), ground = trackRow(STEPS);
  // Each chord: [ground's root, bells' four falling tones, glow's two tones].
  const CHORD = {
    G:  [43, [91, 86, 83, 79], [59, 62]],
    Em: [40, [88, 83, 79, 76], [59, 55]],
    C:  [36, [88, 84, 79, 76], [60, 64]],
    D:  [38, [90, 86, 81, 78], [62, 57]],
    Bm: [47, [90, 86, 83, 78], [62, 59]],
  };
  const PROG = ["G", "Em", "C", "D", "G", "Bm", "C", "D"];
  // The most steps a note SOUNDS for, per layer (the header's rule).
  const GATE = { theme: 3, bells: 1, glow: 2, ground: 2 };
  // The tune: one row per bar, each note [step, midi, dur].
  const TUNE = [
    [[0, 71, 8], [8, 74, 4], [12, 71, 4]],
    [[0, 76, 8], [8, 74, 4], [12, 71, 4]],
    [[0, 72, 6], [6, 71, 2], [8, 67, 8]],
    [[0, 69, 16]],
    [[0, 71, 8], [8, 74, 4], [12, 79, 4]],
    [[0, 78, 8], [8, 74, 8]],
    [[0, 76, 6], [6, 74, 2], [8, 72, 4], [12, 71, 4]],
    [[0, 69, 8], [8, 66, 8]],
  ];
  for (let b = 0; b < BARS; b++) {
    const s0 = b * BAR, ch = CHORD[PROG[b]];
    for (const n of TUNE[b]) trackNote(theme, s0 + n[0], n[1], Math.min(n[2], GATE.theme), n[0] === 0 ? 1 : 0.85);
    for (let i = 0; i < 4; i++) trackNote(bells, s0 + 8 + i * 2, ch[1][i], GATE.bells, i === 0 ? 0.9 : 0.65);
    trackNote(glow, s0, ch[2][0], GATE.glow, 0.9);
    trackNote(glow, s0 + 8, ch[2][1], GATE.glow, 0.8);
    trackNote(ground, s0, ch[0], GATE.ground, 1);
    trackNote(ground, s0 + 12, ch[0] + 7, GATE.ground, 0.7);
  }
  return { stepDur: 60 / 120 / 4, steps: STEPS, bar: BAR, layers: [
    { name: "theme", type: "triangle", detune: 5, gain: 0.090, atk: 0.004, rel: 0.75, audition: "pass", steps: theme },
    { name: "bells", type: "triangle", gain: 0.086, atk: 0.004, rel: 0.25, audition: "pass", steps: bells },
    { name: "glow", type: "sawtooth", cutoff: 1600, cutoffTo: 900, detune: 8, gain: 0.056, atk: 0.004, rel: 0.5, audition: "pass", steps: glow },
    { name: "ground", type: "triangle", gain: 0.450, atk: 0.004, rel: 0.5, audition: "pass", steps: ground },
  ]};
}

// ---------------------------------------------------------------------------
// PULSE. Classic's gameplay track (GDD 13). E minor, 120 BPM (Paul's pick), 16
// steps to a bar, 36 bars: 72 s to the loop point. Sparse, tonal, and struck.
//   A (bars 0-11)   the tune stated low and plain over Em Cmaj7 G D, twice,
//                   then a four-bar answer. Heart once a bar; ticks from bar 4.
//   B (bars 12-23)  the tune lifts an octave into the relative major's colours
//                   (Cmaj7 D Bm7 Em). Heart twice a bar; the bassline walks.
//   C (bars 24-35)  the peak: the busiest bassline and ticks, the tune at its
//                   highest, then the opening motif returns (bar 32) and a B
//                   major bar pulls back to bar 0's Em.
// Six layers, each struck and short (the header's rule):
//   melody    the tune, and nothing else carries it
//   swell     two chord tones a bar, stabbed
//   bassline  the root's rhythm, a different figure per section
//   cycle     three chord tones against eight eighths, so the figure shifts
//   heart     lub-dub
//   tick      a syncopated noise figure, never on a bar's downbeat
// ---------------------------------------------------------------------------
function buildPulseTrack() {
  const BAR = 16, BARS = 36, STEPS = BAR * BARS;
  const melody = trackRow(STEPS), swell = trackRow(STEPS), bassline = trackRow(STEPS),
        cycle = trackRow(STEPS), heart = trackRow(STEPS), tick = trackRow(STEPS);
  // Each chord: [bassline's root, cycle's three tones, swell's two tones].
  const CHORD = {
    Em:    [40, [52, 59, 62], [55, 59]],
    Cmaj7: [36, [48, 55, 64], [60, 59]],
    G:     [43, [55, 62, 71], [62, 59]],
    D:     [38, [50, 57, 64], [57, 54]],
    Am7:   [45, [57, 64, 67], [57, 60]],
    Bm7:   [47, [59, 62, 66], [62, 57]],
    B:     [47, [59, 63, 66], [59, 63]],
  };
  const PROG = [
    "Em", "Cmaj7", "G", "D", "Em", "Cmaj7", "G", "D", "Am7", "Cmaj7", "Em", "D",       // A
    "Cmaj7", "D", "Bm7", "Em", "Cmaj7", "D", "G", "G", "Am7", "Bm7", "Cmaj7", "D",     // B
    "Em", "D", "Cmaj7", "G", "Am7", "Em", "Cmaj7", "D", "Em", "Cmaj7", "Am7", "B",     // C
  ];
  // The most steps a note SOUNDS for, per layer (the header's rule).
  const GATE = { melody: 3, swell: 2, bassline: 2, cycle: 1, heart: 1, tick: 1 };
  // The tune: one row per bar, each note [step, midi, dur].
  const TUNE = [
    [[0, 76, 6], [6, 74, 2], [8, 71, 8]],                   // A
    [[0, 67, 4], [4, 71, 4], [8, 76, 8]],
    [[0, 74, 6], [6, 72, 2], [8, 71, 8]],
    [[0, 69, 12], [12, 66, 4]],
    [[0, 76, 6], [6, 74, 2], [8, 71, 6], [14, 67, 2]],
    [[0, 67, 4], [4, 71, 4], [8, 76, 4], [12, 79, 4]],
    [[0, 78, 6], [6, 74, 2], [8, 71, 8]],
    [[0, 69, 16]],
    [[0, 72, 8], [8, 76, 8]],
    [[0, 74, 4], [4, 71, 12]],
    [[0, 67, 8], [8, 71, 4], [12, 69, 4]],
    [[0, 66, 16]],
    [[0, 79, 8], [8, 76, 8]],                               // B
    [[0, 78, 6], [6, 76, 2], [8, 74, 8]],
    [[0, 83, 8], [8, 81, 4], [12, 78, 4]],
    [[0, 79, 12]],
    [[0, 76, 4], [4, 79, 4], [8, 83, 8]],
    [[0, 81, 6], [6, 78, 2], [8, 74, 8]],
    [[0, 79, 16]],
    [[8, 74, 4], [12, 71, 4]],
    [[0, 72, 6], [6, 76, 2], [8, 81, 8]],
    [[0, 78, 6], [6, 74, 2], [8, 71, 8]],
    [[0, 76, 8], [8, 79, 8]],
    [[0, 78, 8], [8, 81, 8]],
    [[0, 79, 6], [6, 78, 2], [8, 76, 8]],                   // C
    [[0, 78, 6], [6, 76, 2], [8, 74, 8]],
    [[0, 76, 4], [4, 79, 4], [8, 83, 8]],
    [[0, 81, 6], [6, 79, 2], [8, 74, 8]],
    [[0, 76, 8], [8, 72, 8]],
    [[0, 71, 6], [6, 74, 2], [8, 76, 8]],
    [[0, 79, 8], [8, 76, 8]],
    [[0, 78, 16]],
    [[0, 76, 6], [6, 74, 2], [8, 71, 8]],
    [[0, 67, 4], [4, 71, 4], [8, 76, 8]],
    [[0, 72, 8], [8, 69, 8]],
    [[0, 71, 8], [8, 75, 8]],
  ];
  // Per section: the bassline's [step, semitones above the root, dur, g], the
  // cycle's tone order over eight eighths, the heart's [step, g], and the
  // tick's [step, g].
  const SECTION = [
    { bass: [[0, 0, 6, 1], [6, 7, 2, 0.7], [8, 0, 8, 0.85]],
      order: [0, 1, 2, 0, 1, 2, 0, 1],
      beat: [[0, 1], [2, 0.55]],
      ticks: [[4, 0.35], [12, 0.5]] },
    { bass: [[0, 0, 6, 1], [6, 12, 2, 0.7], [8, 7, 4, 0.8], [12, 0, 4, 0.75]],
      order: [0, 2, 1, 2, 0, 2, 1, 2],
      beat: [[0, 1], [2, 0.55], [8, 0.8], [10, 0.45]],
      ticks: [[4, 0.35], [7, 0.2], [12, 0.5], [14, 0.25]] },
    { bass: [[0, 0, 4, 1], [4, 0, 2, 0.6], [6, 7, 2, 0.7], [8, 12, 4, 0.85], [12, 7, 2, 0.7], [14, 0, 2, 0.6]],
      order: [0, 1, 2, 1, 0, 1, 2, 1],
      beat: [[0, 1], [2, 0.55], [8, 0.8], [10, 0.45]],
      ticks: [[2, 0.2], [4, 0.4], [7, 0.2], [10, 0.25], [12, 0.55], [14, 0.3]] },
  ];
  for (let b = 0; b < BARS; b++) {
    const s0 = b * BAR, ch = CHORD[PROG[b]], sec = SECTION[Math.floor(b / 12)];
    for (const n of TUNE[b]) trackNote(melody, s0 + n[0], n[1], Math.min(n[2], GATE.melody), n[0] === 0 ? 1 : 0.85);
    const two = sec === SECTION[1] ? [ch[2][1], ch[2][0]] : ch[2];
    trackNote(swell, s0, two[0], GATE.swell, 0.9);
    trackNote(swell, s0 + 8, two[1], GATE.swell, 0.8);
    for (const n of sec.bass) trackNote(bassline, s0 + n[0], ch[0] + n[1], Math.min(n[2], GATE.bassline), n[3]);
    for (let i = 0; i < 8; i++) trackNote(cycle, s0 + i * 2, ch[1][sec.order[i]], GATE.cycle, i === 0 ? 0.9 : 0.6);
    for (const n of sec.beat) trackNote(heart, s0 + n[0], 45, GATE.heart, n[1]);
    if (b >= 4) for (const n of sec.ticks) trackNote(tick, s0 + n[0], 69, GATE.tick, n[1]);
  }
  return { stepDur: 60 / 120 / 4, steps: STEPS, bar: BAR, layers: [
    { name: "melody", type: "triangle", detune: 4, gain: 0.070, atk: 0.004, rel: 0.5625, audition: "pass", steps: melody },
    { name: "swell", type: "sawtooth", cutoff: 1400, cutoffTo: 700, detune: 9, gain: 0.049, atk: 0.004, rel: 0.375, audition: "pass", steps: swell },
    { name: "bassline", type: "triangle", gain: 0.450, atk: 0.004, rel: 0.375, audition: "pass", steps: bassline },
    { name: "cycle", type: "square", cutoff: 1800, cutoffTo: 500, cutoffTime: 0.18, q: 2, gain: 0.070, atk: 0.005, rel: 0.1875, tier: 2, audition: "pass", steps: cycle },
    { name: "heart", type: "triangle", drop: 12, dropTime: 0.08, gain: 0.450, atk: 0.003, rel: 0.14, beat: true, audition: "pass", steps: heart },
    { name: "tick", noise: true, hp: 7000, gain: 0.450, atk: 0.001, rel: 0.1875, tier: 3, audition: "pass", steps: tick },
  ]};
}

// ---------------------------------------------------------------------------
// DRIVE. Overdrive's gameplay track, and the flagship (GDD 11.7, 13). A minor,
// 138 BPM (O13), 16 steps to a bar, 36 bars: 62.6 s to the loop point. Driving
// and struck: four on the floor under a pumping bass.
//   A (bars 0-11)   the hook stated in the middle register over Am F C G, twice,
//                   then a four-bar answer. Octaves on the bass's eighths, the
//                   snare on two and four; hats from bar 4.
//   B (bars 12-23)  the tune climbs an octave over F G Em Am. The bass gallops,
//                   the arp runs downhill, a ghost snare leads each bar on.
//   C (bars 24-35)  the peak: the hook an octave up, the bass and hats in
//                   sixteenths, the arp's last strike leaping an octave. The
//                   opening hook returns at bar 32, and an E major bar pulls
//                   back to bar 0's Am.
// Every section's last bar carries a snare fill into the next.
// Six layers, each struck and short (the header's rule):
//   lead   the tune, and nothing else carries it
//   arp    three chord tones struck 3 + 3 + 2, twice a bar: the riff
//   bass   the root and its octave, a different figure per section
//   kick   four on the floor, and the rim pulse's beat
//   snare  the backbeat, with a fill at every section's end
//   hat    the offbeats, filling in to sixteenths at the peak
// ---------------------------------------------------------------------------
function buildDriveTrack() {
  const BAR = 16, BARS = 36, STEPS = BAR * BARS;
  const lead = trackRow(STEPS), arp = trackRow(STEPS), bass = trackRow(STEPS),
        kick = trackRow(STEPS), snare = trackRow(STEPS), hat = trackRow(STEPS);
  // Each chord: [bass's root, arp's three tones].
  const CHORD = {
    Am: [33, [57, 60, 64]],
    F:  [29, [57, 60, 65]],
    C:  [36, [55, 60, 64]],
    G:  [31, [55, 59, 62]],
    Dm: [38, [57, 62, 65]],
    Em: [40, [55, 59, 64]],
    E:  [40, [56, 59, 64]],
  };
  const PROG = [
    "Am", "F", "C", "G", "Am", "F", "C", "G", "Dm", "Am", "F", "G",      // A
    "F", "G", "Em", "Am", "F", "G", "C", "C", "Dm", "Em", "F", "G",      // B
    "Am", "G", "F", "G", "Am", "G", "F", "E", "Am", "F", "C", "E",       // C
  ];
  // The most steps a note SOUNDS for, per layer (the header's rule).
  const GATE = { lead: 3, arp: 1, bass: 1, kick: 1, snare: 1, hat: 1 };
  // The tune: one row per bar, each note [step, midi, dur].
  const TUNE = [
    [[0, 69, 2], [2, 69, 2], [4, 76, 4], [8, 74, 2], [10, 72, 4], [14, 74, 2]],   // A
    [[0, 72, 4], [4, 69, 4], [8, 67, 2], [10, 69, 6]],
    [[0, 69, 2], [2, 69, 2], [4, 76, 4], [8, 79, 2], [10, 76, 4], [14, 74, 2]],
    [[0, 74, 6], [6, 72, 2], [8, 71, 8]],
    [[0, 69, 2], [2, 69, 2], [4, 76, 4], [8, 74, 2], [10, 72, 4], [14, 74, 2]],
    [[0, 72, 4], [4, 77, 4], [8, 76, 2], [10, 74, 2], [12, 72, 4]],
    [[0, 72, 2], [2, 74, 2], [4, 76, 4], [8, 79, 4], [12, 76, 4]],
    [[0, 74, 8], [8, 71, 4], [12, 67, 4]],
    [[0, 77, 4], [4, 76, 2], [6, 74, 2], [8, 69, 8]],
    [[0, 72, 4], [4, 76, 4], [8, 81, 8]],
    [[0, 77, 4], [4, 76, 2], [6, 74, 2], [8, 72, 4], [12, 69, 4]],
    [[0, 71, 6], [6, 74, 2], [8, 79, 8]],
    [[0, 81, 3], [3, 81, 3], [6, 79, 2], [8, 77, 4], [12, 76, 4]],                // B
    [[0, 74, 3], [3, 74, 3], [6, 76, 2], [8, 79, 8]],
    [[0, 79, 3], [3, 79, 3], [6, 76, 2], [8, 83, 4], [12, 79, 4]],
    [[0, 81, 8], [8, 76, 4], [12, 72, 4]],
    [[0, 81, 3], [3, 81, 3], [6, 84, 2], [8, 81, 4], [12, 77, 4]],
    [[0, 79, 3], [3, 79, 3], [6, 81, 2], [8, 83, 8]],
    [[0, 84, 4], [4, 83, 2], [6, 81, 2], [8, 79, 4], [12, 76, 4]],
    [[0, 79, 8], [12, 76, 2], [14, 79, 2]],
    [[0, 81, 4], [4, 77, 4], [8, 74, 4], [12, 77, 4]],
    [[0, 79, 4], [4, 76, 4], [8, 71, 4], [12, 76, 4]],
    [[0, 77, 4], [4, 81, 4], [8, 84, 4], [12, 81, 4]],
    [[0, 83, 6], [6, 81, 2], [8, 79, 4], [12, 74, 4]],
    [[0, 81, 2], [2, 81, 2], [4, 88, 4], [8, 86, 2], [10, 84, 4], [14, 86, 2]],   // C
    [[0, 83, 4], [4, 79, 4], [8, 86, 8]],
    [[0, 84, 2], [2, 84, 2], [4, 81, 4], [8, 84, 2], [10, 86, 4], [14, 84, 2]],
    [[0, 83, 6], [6, 86, 2], [8, 83, 4], [12, 79, 4]],
    [[0, 81, 2], [2, 81, 2], [4, 88, 4], [8, 86, 2], [10, 84, 4], [14, 86, 2]],
    [[0, 86, 4], [4, 83, 4], [8, 79, 4], [12, 83, 4]],
    [[0, 84, 4], [4, 81, 4], [8, 77, 4], [12, 81, 4]],
    [[0, 80, 6], [6, 83, 2], [8, 88, 8]],
    [[0, 69, 2], [2, 69, 2], [4, 76, 4], [8, 74, 2], [10, 72, 4], [14, 74, 2]],
    [[0, 72, 4], [4, 69, 4], [8, 67, 2], [10, 69, 6]],
    [[0, 69, 2], [2, 69, 2], [4, 76, 4], [8, 79, 2], [10, 76, 4], [14, 74, 2]],
    [[0, 76, 6], [6, 74, 2], [8, 71, 4], [12, 68, 4]],
  ];
  // The arp's strikes in every bar: 3 + 3 + 2 steps, twice.
  const ARP_AT = [0, 3, 6, 8, 11, 14];
  // Per section: the bass's [step, semitones above the root, g]; the arp's
  // tone order over ARP_AT, and the semitones its last strike leaps; the
  // snare's [step, g]; and the hat's [step, g].
  const SECTION = [
    { bass: [[0, 0, 1], [2, 12, 0.7], [4, 0, 0.9], [6, 12, 0.7], [8, 0, 0.95], [10, 12, 0.7], [12, 0, 0.9], [14, 12, 0.7]],
      order: [0, 2, 1, 0, 2, 1], leap: 0,
      snare: [[4, 1], [12, 1]],
      hats: [[2, 0.6], [6, 0.6], [10, 0.6], [14, 0.6]] },
    { bass: [[0, 0, 1], [2, 12, 0.7], [3, 12, 0.5], [4, 0, 0.9], [6, 12, 0.7], [7, 12, 0.5], [8, 0, 0.95], [10, 12, 0.7],
             [11, 12, 0.5], [12, 0, 0.9], [14, 7, 0.75], [15, 12, 0.55]],
      order: [2, 1, 0, 2, 1, 0], leap: 0,
      snare: [[4, 1], [12, 1], [15, 0.35]],
      hats: [[2, 0.6], [6, 0.6], [7, 0.3], [10, 0.6], [14, 0.6], [15, 0.3]] },
    { bass: [[0, 0, 1], [1, 0, 0.5], [2, 12, 0.75], [3, 0, 0.5], [4, 0, 0.9], [5, 0, 0.5], [6, 12, 0.75], [7, 7, 0.6],
             [8, 0, 0.95], [9, 0, 0.5], [10, 12, 0.75], [11, 0, 0.5], [12, 0, 0.9], [13, 0, 0.5], [14, 12, 0.75], [15, 12, 0.6]],
      order: [0, 1, 2, 0, 1, 2], leap: 12,
      snare: [[4, 1], [10, 0.35], [12, 1], [15, 0.4]],
      hats: [[1, 0.3], [2, 0.65], [3, 0.3], [5, 0.3], [6, 0.65], [7, 0.3], [9, 0.3], [10, 0.65], [11, 0.3], [13, 0.3],
             [14, 0.65], [15, 0.3]] },
  ];
  // The snare's fill, in place of its figure on every section's last bar.
  const FILL = [[4, 1], [9, 0.5], [10, 0.6], [12, 1], [13, 0.55], [14, 0.7], [15, 0.85]];
  for (let b = 0; b < BARS; b++) {
    const s0 = b * BAR, ch = CHORD[PROG[b]], sec = SECTION[Math.floor(b / 12)];
    for (const n of TUNE[b]) trackNote(lead, s0 + n[0], n[1], Math.min(n[2], GATE.lead), n[0] === 0 ? 1 : 0.85);
    for (let i = 0; i < ARP_AT.length; i++) {
      const up = i === ARP_AT.length - 1 ? sec.leap : 0;
      trackNote(arp, s0 + ARP_AT[i], ch[1][sec.order[i]] + up, GATE.arp, i === 0 ? 0.9 : i === 3 ? 0.8 : 0.65);
    }
    for (const n of sec.bass) trackNote(bass, s0 + n[0], ch[0] + n[1], GATE.bass, n[2]);
    for (let i = 0; i < 4; i++) trackNote(kick, s0 + i * 4, 50, GATE.kick, i === 0 ? 1 : 0.9);
    for (const n of (b % 12 === 11 ? FILL : sec.snare)) trackNote(snare, s0 + n[0], 69, GATE.snare, n[1]);
    if (b >= 4) for (const n of sec.hats) trackNote(hat, s0 + n[0], 69, GATE.hat, n[1]);
  }
  return { stepDur: 60 / 138 / 4, steps: STEPS, bar: BAR, layers: [
    { name: "lead", type: "sawtooth", cutoff: 3200, cutoffTo: 1400, detune: 7, gain: 0.070, atk: 0.003, rel: 0.5625, steps: lead },
    { name: "arp", type: "square", cutoff: 2400, cutoffTo: 700, cutoffTime: 0.09, q: 3, gain: 0.060, atk: 0.003, rel: 0.1875, steps: arp },
    { name: "bass", type: "sawtooth", cutoff: 1100, cutoffTo: 200, cutoffTime: 0.1, q: 4, gain: 0.300, atk: 0.003, rel: 0.1875, steps: bass },
    { name: "kick", type: "sine", drop: 24, dropTime: 0.07, gain: 0.450, atk: 0.002, rel: 0.1875, beat: true, steps: kick },
    { name: "snare", noise: true, hp: 1400, gain: 0.300, atk: 0.001, rel: 0.1875, steps: snare },
    { name: "hat", noise: true, hp: 8000, gain: 0.250, atk: 0.001, rel: 0.1875, steps: hat },
  ]};
}

// Keys are the track names a host hands to setState(). `drive` is CS012's (A5).
const MUSIC_TRACKS = {
  title: buildTitleTrack(),
  pulse: buildPulseTrack(),
  drive: buildDriveTrack(),
};
