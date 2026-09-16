// 17-audio-tracks.js — the music, as DATA: `title` and `pulse` (GDD 11.3, 11.7).
//
// ⛔ COMPOSED IN tools/music-lab.html AND PORTED VERBATIM. This whole file is
// the lab's BLOCK B, character for character (test-cs009-p2.js). Never re-tune
// a gain here: move the slider in the lab, press COPY TABLE, and paste what it
// prints over this file.
//
// ⛔ NO LAYER CARRIES A `tier` (Paul's A6). Every layer is foundation and always
// on, so the melody is never gated. `audition` is the lab's PASS / FAIL mark
// and the scheduler never reads it. ⚠ Unauditioned: no layer is marked yet.
//
// ⛔ EVERY LAYER IS WRITTEN AS A PART, to be recognisable played solo (GDD
// 11.4(c)): a tune, a line, a figure or a groove. Never texture.
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
// TITLE. G major, 60 BPM, 16 steps to a bar, 8 bars: 32 s to the loop point.
// A (bars 0-3) states a four-bar theme that settles on A over D. B (bars 4-7)
// answers it, climbing to G5 and falling home to F#4, which leans back into
// bar 0's G. Four layers:
//   theme   the tune, and nothing else carries it
//   bells   a four-note falling figure on each bar's second half, high
//   glow    a two-note-a-bar chorale line under the tune
//   ground  root for three beats, fifth on the fourth
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
    for (const n of TUNE[b]) trackNote(theme, s0 + n[0], n[1], n[2], n[0] === 0 ? 1 : 0.85);
    for (let i = 0; i < 4; i++) trackNote(bells, s0 + 8 + i * 2, ch[1][i], 2, i === 0 ? 0.9 : 0.65);
    trackNote(glow, s0, ch[2][0], 8, 0.9);
    trackNote(glow, s0 + 8, ch[2][1], 8, 0.8);
    trackNote(ground, s0, ch[0], 12, 1);
    trackNote(ground, s0 + 12, ch[0] + 7, 4, 0.7);
  }
  return { stepDur: 0.25, steps: STEPS, layers: [
    { name: "theme", type: "triangle", detune: 5, gain: 0.075, atk: 0.10, rel: 0.9, steps: theme },
    { name: "bells", type: "triangle", gain: 0.075, atk: 0.004, rel: 0.45, steps: bells },
    { name: "glow", type: "sawtooth", cutoff: 900, cutoffTo: 1600, detune: 8, gain: 0.085, atk: 1.0, rel: 1.2, steps: glow },
    { name: "ground", type: "triangle", gain: 0.090, atk: 0.20, rel: 0.8, steps: ground },
  ]};
}

// ---------------------------------------------------------------------------
// PULSE. Classic's gameplay track (GDD 13). E minor, 80 BPM, 16 steps to a
// bar, 36 bars: 108 s to the loop point. Sparse, tonal, near-ambient.
//   A (bars 0-11)   the tune stated low and plain over Em Cmaj7 G D, twice,
//                   then a four-bar answer. Heart once a bar; ticks from bar 4.
//   B (bars 12-23)  the tune lifts an octave into the relative major's colours
//                   (Cmaj7 D Bm7 Em). Heart twice a bar; the bassline walks.
//   C (bars 24-35)  the peak: the busiest bassline and ticks, the tune at its
//                   highest, then the opening motif returns (bar 32) and a B
//                   major bar pulls back to bar 0's Em.
// Six layers:
//   melody    the tune, and nothing else carries it
//   swell     a two-note-a-bar chorale line
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
    for (const n of TUNE[b]) trackNote(melody, s0 + n[0], n[1], n[2], n[0] === 0 ? 1 : 0.85);
    const two = sec === SECTION[1] ? [ch[2][1], ch[2][0]] : ch[2];
    trackNote(swell, s0, two[0], 8, 0.9);
    trackNote(swell, s0 + 8, two[1], 8, 0.8);
    for (const n of sec.bass) trackNote(bassline, s0 + n[0], ch[0] + n[1], n[2], n[3]);
    for (let i = 0; i < 8; i++) trackNote(cycle, s0 + i * 2, ch[1][sec.order[i]], 2, i === 0 ? 0.9 : 0.6);
    for (const n of sec.beat) trackNote(heart, s0 + n[0], 45, 1, n[1]);
    if (b >= 4) for (const n of sec.ticks) trackNote(tick, s0 + n[0], 69, 1, n[1]);
  }
  return { stepDur: 0.1875, steps: STEPS, layers: [
    { name: "melody", type: "triangle", detune: 4, gain: 0.070, atk: 0.08, rel: 0.6, steps: melody },
    { name: "swell", type: "sawtooth", cutoff: 700, cutoffTo: 1400, detune: 9, gain: 0.085, atk: 0.6, rel: 0.9, steps: swell },
    { name: "bassline", type: "triangle", gain: 0.098, atk: 0.01, rel: 0.25, steps: bassline },
    { name: "cycle", type: "square", cutoff: 1800, cutoffTo: 500, cutoffTime: 0.18, q: 2, gain: 0.055, atk: 0.005, rel: 0.3, steps: cycle },
    { name: "heart", type: "triangle", drop: 12, dropTime: 0.08, gain: 0.140, atk: 0.003, rel: 0.14, steps: heart },
    { name: "tick", noise: true, hp: 7000, gain: 0.050, atk: 0.001, rel: 0.04, steps: tick },
  ]};
}

// Keys are the track names a host hands to setState(). `drive` is CS012's (A5).
const MUSIC_TRACKS = {
  title: buildTitleTrack(),
  pulse: buildPulseTrack(),
};
