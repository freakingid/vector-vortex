// test-cs012-p1.js — CS012 P1: `drive` (GDD 10.5, 11.3, 11.6, 11.7, 11.8; plan §3,
// O13, R10, R11). Asserts what P1 owns: `drive`'s shape (>= 36 bars in three
// sections, 138 BPM, no tier and no mark, one beat layer on every beat) and that
// the closed looping gates reach it; music-lab lists it at 138; ⛔ D16's headroom
// gate on `drive`, with its mutations; musicStateFor in both modes, an Overdrive
// run and the rim pulse on `drive`; MUSIC TRACK's three choices, saved by name.
//
// ⛔ TRAPS.
//  1. 138 BPM's stepDur is not a binary fraction: 417 of `drive`'s back-to-back
//     note pairs round to an end AFTER the next start. The sweep sorts every end
//     1e-9 s early (plan §1.8), or those ties read as overlaps.
//  2. Under D16's curve (ratio 20) a doubled layer moves the limited peak by a
//     twentieth of its dB and stays green (log/CS012.md): that mutation proves
//     the gate reads the gains; the red one is the build without its limiter.
//  3. Game.reset() restores the sound rows, so the reload never calls it.
"use strict";

const fs = require("fs");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

installSeed(20261201);                      // ⛔ above the first buildGame()
const ROOT = path.join(__dirname, "..");
const script = H.extractScript(fs.readFileSync(path.join(ROOT, "dist", "vector-vortex.html"), "utf8"));
const lab = fs.readFileSync(path.join(ROOT, "tools", "music-lab.html"), "utf8");
const NS = "coinless.vector-vortex.";
const HEADROOM_RATIO = 1.0;                 // test-cs009-p5.js's, provisional 0 dB
const TIE = 1e-9;                           // trap 1
const J = JSON.stringify;

function builtModule(name) {
  const re = /\/\/ ={74}\n\/\/ ([^\n]+)\n\/\/ ={74}\n/g;
  let m, at = -1;
  while ((m = re.exec(script)) !== null) {
    if (at >= 0) return script.slice(at, m.index);
    if (m[1].trim() === name) at = m.index + m[0].length;
  }
  return at >= 0 ? script.slice(at) : null;
}
function fnText(src, name) {
  const at = src.indexOf("\nfunction " + name + "(");
  return at < 0 ? null : src.slice(at + 1, src.indexOf("\n}\n", at) + 2);
}
const load = text => new Function(text + "\n;return MUSIC_TRACKS;")();

// ===========================================================================
// the table
// ===========================================================================
const X = H.buildGame();
const { C } = X;
const drive = X.MUSIC_TRACKS.drive;
H.assert(drive && Array.isArray(drive.layers) && drive.layers.length > 0, "MUSIC_TRACKS.drive exists");
const layer = name => drive.layers.find(L => L.name === name);
const kit = builtModule("17-audio-tracks.js") || "";
const body = fnText(kit, "buildDriveTrack") || "";
{
  H.eq(drive.stepDur, 60 / 138 / 4, "⛔ drive runs at 138 BPM (O13)");
  H.assert(/return \{ stepDur: 60 \/ 138 \/ 4, steps: STEPS, bar: BAR,/.test(body),
    "its tempo is written as the BPM, the text COPY TABLE's ladder rewrites");
  H.eq(drive.bar, 16, "16 steps to a bar");
  const bars = drive.steps / drive.bar;
  H.assert(Number.isInteger(bars) && bars >= 36, `⛔ drive runs >= 36 bars before its loop point (${bars} bars, ${(drive.steps * drive.stepDur).toFixed(1)} s)`);

  // ⛔ A→B→C: each section plays its own bass figure, bar after bar.
  const bass = layer("bass");
  const figure = b => bass.steps.slice(b * 16, (b + 1) * 16).map((c, s) => (c ? s : -1)).filter(s => s >= 0).join(",");
  const starts = [0];
  for (let b = 1; b < bars; b++) if (figure(b) !== figure(b - 1)) starts.push(b);
  H.eq(J(starts), J([0, 12, 24]), "⛔ three sections by the bass's figure: A from bar 0, B from 12, C from 24");

  H.eq(drive.layers.filter(L => "tier" in L).length, 0, "⛔ no layer carries a tier (O13): every layer, the melody too, is foundation");
  H.eq(drive.layers.filter(L => "audition" in L).length, 0, "⛔ no layer carries an audition mark (O13): Paul's lab session writes them");
  H.assert(layer("lead") && layer("lead").steps.some(Boolean), "the tune is the `lead` layer");
  const beats = drive.layers.filter(L => L.beat);
  H.eq(beats.map(L => L.name).join(","), "kick", "⛔ one layer carries beat: true, the kick (the rim pulse)");
  const kick = layer("kick");
  const onBeat = kick ? kick.steps.every((c, s) => Boolean(c) === (s % 4 === 0)) : false;
  H.assert(onBeat, "the kick strikes every beat and nothing between: four on the floor");

  // The closed looping gates reach `drive` (their claims are theirs): it is a
  // MUSIC_TRACKS key (test-cs009-p2.js), registered by its builder, whose GATE
  // table names every layer (test-cs010-p3.js reads both texts).
  const registry = kit.slice(kit.indexOf("const MUSIC_TRACKS = {"));
  H.assert(/^\s*drive:\s*buildDriveTrack\(\),$/m.test(registry), "MUSIC_TRACKS registers drive: buildDriveTrack()");
  const gate = body.match(/const GATE = \{([^}]*)\}/);
  const gated = gate ? [...gate[1].matchAll(/(\w+):\s*\d+/g)].map(m => m[1]) : [];
  H.eq(J(drive.layers.map(L => L.name).filter(n => !gated.includes(n))), "[]", "buildDriveTrack's GATE table names every layer");
}

// music-lab lists `drive`, and its tempo ladder offers 138.
{
  const blockB = (() => { const b = lab.indexOf("// ===== BLOCK B BEGIN");
    return lab.slice(lab.indexOf("\n", b) + 1, lab.indexOf("// ===== BLOCK B END")); })();
  const ui = lab.slice(lab.indexOf("// ===== LAB UI"));
  const setup = ui.slice(ui.indexOf("const LAB_TRACKS = {"), ui.indexOf("// ⛔ TEMPO, IN METRONOME STEPS"));
  const tempo = ui.slice(ui.indexOf("const TEMPO_LADDER = ["), ui.indexOf("let current = "));
  const tracks = load(blockB);
  let L = { LAB_TRACKS: {}, bpmOf: () => null, tempoChoices: () => [] };
  try { L = new Function("MUSIC_TRACKS", setup + tempo + "\nreturn { LAB_TRACKS, bpmOf, tempoChoices };")(tracks); }
  catch (err) { H.assert(false, `the lab's LAB_TRACKS and tempo ladder evaluate over BLOCK B (${err.message})`); }
  const info = L.LAB_TRACKS.drive;
  H.assert(info && info.builder === "buildDriveTrack" && info.bar === 16, "⛔ music-lab lists drive, built by buildDriveTrack");
  H.eq(J(info && info.sections), J([["A", 0], ["B", 12], ["C", 24]]), "the lab marks drive's sections where the data changes");
  H.eq(L.bpmOf(tracks.drive.stepDur), 138, "the lab reads drive at 138 BPM");
  H.assert(L.tempoChoices(tracks.drive).includes(138), "⛔ and its tempo ladder offers 138");
  const rewrite = new Function(fnText(lab, "rewriteBlockB") + "\nreturn rewriteBlockB;")();
  const slow = rewrite(blockB, [{ builder: "buildDriveTrack", stepDur: "60 / 132 / 4" }]);
  const moved = blockB.split("\n").filter((l, i) => l !== slow.split("\n")[i]).length;
  H.assert(moved === 1 && load(slow).drive.stepDur === 60 / 132 / 4, "COPY TABLE writes a new drive tempo on its one line");
}

// ===========================================================================
// ⛔ THE HEADROOM GATE ON `drive` (GDD 11.8; D16, as test-cs009-p5.js applies it)
// ===========================================================================
// The loudest overlap of note peaks over one loop is the limiter's input; its
// hard-knee curve and makeup, then the duck, the dip and the buses, must sit
// under the Surger tone's peak at master. `null` limiter: no curve (the mutation).
function headroom(Y, name) {
  const CY = Y.C, A = Y.AudioSys, M = Y.MusicSys, rec = Y._audio;
  Y.Game.reset();
  A.unlock();
  A.ctx.currentTime += 10;
  const n0 = rec.nodes.length;
  const tone = Y.Sfx.hold(CY.SFX.surgeCharge);                   // reconcileSurgeTones' own call
  const env = rec.nodes.slice(n0).find(n => n.kind === "gain" && rec.connections.some(c => c.from === n && c.to === A.sfx));
  const attack = rec.automation.find(a => a.node === env && a.fn === "exponentialRampToValueAtTime");
  tone.stop();
  const track = Y.MUSIC_TRACKS[name], loop = track.steps * track.stepDur;
  M.setState(name);
  const gates = M.layerGates.map(g => g.node);
  const t0 = A.ctx.currentTime, n1 = rec.nodes.length;
  for (let t = t0; t < t0 + loop + 1; t += 1 / 60) { A.ctx.currentTime = t; M.update(); }
  const notes = rec.nodes.slice(n1).filter(n => n.kind === "gain" && rec.connections.some(c => c.from === n && gates.includes(c.to)));
  const ev = [];
  for (const g of notes) {
    const a = rec.automation.filter(x => x.node === g && x.param === "gain");
    if (a[0].t >= t0 + loop) continue;
    ev.push([a[0].t, a[1].v], [a[a.length - 1].t - TIE, -a[1].v]);   // trap 1
  }
  ev.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  let sum = 0, loudest = 0;
  for (const e of ev) { sum += e[1]; loudest = Math.max(loudest, sum); }
  const trackPeak = Math.max(...rec.automation.filter(x => x.node === M.trackGain && x.param === "gain").map(x => x.v));
  const L = M.limiter;
  const xdB = 20 * Math.log10(loudest * trackPeak);
  const ydB = L ? (xdB > L.threshold.value ? L.threshold.value + (xdB - L.threshold.value) / L.ratio.value : xdB) -
                  0.6 * (L.threshold.value - L.threshold.value / L.ratio.value) : xdB;
  const music = Math.pow(10, ydB / 20) * M.duck.gain.value * M.dipNode.gain.value * A.vol.music * A.vol.master;
  M.setState(Y.MUSIC_SILENCE);
  return { vols: ["master", "music", "sfx"].map(b => A.vol[b]), toneAt: attack ? attack.v * A.vol.sfx : 0,
           tonePeak: (attack ? attack.v * A.vol.sfx : 0) * A.vol.master, notes: notes.length, loudest, music, L, xdB, ydB };
}
{
  const Y = H.buildGame({ audio: true });
  const CY = Y.C;
  const r = headroom(Y, "drive");
  H.assert(r.vols.every(v => v === CY.AUDIO_VOL_DEFAULT / CY.AUDIO_VOL_STEPS), "fixture: every bus at its default");
  H.eq(r.toneAt, CY.SFX.surgeCharge.gain * r.vols[2], "fixture: the held tone peaks at its recipe gain through the SFX bus");
  H.assert(r.notes > 1000, `fixture: drive's loop scheduled its notes (${r.notes})`);
  H.assert(r.L && r.L.kind === "compressor", "fixture: drive plays through the limiter");
  H.eq(r.L && r.L.knee.value, 0, "⛔ the limiter's knee is 0, so the curve model is exact (D16)");
  H.assert(r.tonePeak >= HEADROOM_RATIO * r.music,
    `⛔ headroom on drive: surgeCharge ${r.tonePeak.toFixed(3)} ≥ ${HEADROOM_RATIO} × the limited loudest moment ${r.music.toFixed(4)} (in ${r.loudest.toFixed(4)})`);

  // Mutation 1 (trap 2): the kick at double gain. The gate's input rises, and its
  // output rises by exactly the curve's slope, 1 / ratio of the input's dB.
  const kick = Y.MUSIC_TRACKS.drive.layers.find(L => L.name === "kick");
  kick.gain *= 2;
  const d = headroom(Y, "drive");
  kick.gain /= 2;
  H.assert(d.loudest > r.loudest + kick.gain / 2, `mutation: a doubled kick raises the gate's input (${r.loudest.toFixed(4)} → ${d.loudest.toFixed(4)})`);
  H.close(d.ydB - r.ydB, (d.xdB - r.xdB) / r.L.ratio.value, 1e-9,
    `mutation: and the limited peak by 1/${r.L.ratio.value} of it (${r.music.toFixed(4)} → ${d.music.toFixed(4)})`);
  H.close(headroom(Y, "drive").loudest, r.loudest, 1e-9, "fixture: the kick's gain is restored");

  // Mutation 2: the build without its limiter is red on the same loop.
  const Z = H.buildGame({ audio: true, mutate: [["  limiter:   C.MUSIC_LIMIT,\n", ""]] });
  const z = headroom(Z, "drive");
  H.eq(z.L, null, "fixture: the mutated build has no limiter");
  H.close(z.loudest, r.loudest, 1e-12, "fixture: and the same loudest moment");
  H.assert(!(z.tonePeak >= HEADROOM_RATIO * z.music), `⛔ mutation: unlimited, drive's loudest moment ${z.music.toFixed(4)} buries the tone: red`);
}

// ===========================================================================
// which track plays: C.MODE_TRACK, musicStateFor, an Overdrive run, the rim
// ===========================================================================
{
  for (const v of Object.values(C.MODE_TRACK)) H.assert(v in X.MUSIC_TRACKS, `C.MODE_TRACK's "${v}" names a track`);
  for (const v of C.MUSIC_TRACK_CHOICES.slice(1)) H.assert(v in X.MUSIC_TRACKS, `MUSIC TRACK's "${v}" names a track`);
  H.eq(C.MUSIC_TRACK_CHOICES[0], "auto", "AUTO is still the first choice, the default");
  H.eq(X.musicStateFor("play", "title", "overdrive", "auto"), "drive", "⛔ AUTO in Overdrive plays drive (R10)");
  H.eq(X.musicStateFor("play", "title", "classic", "drive"), "drive", "⛔ DRIVE forces drive in Classic (R10)");
  H.eq(X.musicStateFor("play", "title", "classic", "auto"), "pulse", "⛔ AUTO in Classic is still pulse");
  H.eq(X.musicStateFor("play", "title", "overdrive", "pulse"), "pulse", "PULSE forces pulse in Overdrive");
  H.eq(X.musicStateFor("pause", "title", "overdrive", "auto"), "drive", "Overdrive's pause keeps drive");

  // ⛔ R11: an Overdrive run through the real frame has a gameplay track, and the
  // rim lights on drive's kick and on nothing between.
  const Y = H.buildGame({ audio: true });
  const G = Y.Game, A = Y.AudioSys, M = Y.MusicSys;
  G.reset();
  A.unlock();
  Y.startGame(5, { mode: "overdrive" });
  H.eq(Y.state.mode + "/" + Y.state.screen, "overdrive/play", "fixture: an Overdrive run in play");
  const kicks = [], others = [];
  { const p = M.playNote; M.playNote = function (L, cell, t) { (L.beat ? kicks : others).push(t); return p.apply(this, arguments); }; }
  const MS = Y.C.FIXED_DT * 1000, sd = Y.MUSIC_TRACKS.drive.stepDur;
  let clock = 0, prev = 0, lit = 0, unlit = 0, between = 0, fresh = 0;
  for (let i = 0; i < 600; i++) {
    clock += MS; A.ctx.currentTime = clock / 1000; G.frame(clock);
    const now = A.ctx.currentTime;                                // each onset on the frame the clock reaches it
    for (const t of kicks) if (t > prev && t <= now) { if (Y.beatGlow(t) === 1) lit++; else unlit++; }
    for (const t of others) {
      if (t > prev && t <= now && kicks.every(k => Math.abs(k - t) > sd / 2)) { between++; if (Y.beatGlow(t) === 1) fresh++; }
    }
    prev = now;
  }
  H.eq(M.state, "drive", "⛔ AUTO: the Overdrive run plays drive, never an undefined track (R11)");
  H.assert(M.track === Y.MUSIC_TRACKS.drive, "from MUSIC_TRACKS");
  H.assert(lit > 10, `fixture: drive's kick played (${lit} onsets reached)`);
  H.eq(unlit, 0, "⛔ the rim pulse reads 1 on every kick onset");
  H.assert(between > 10, `fixture: onsets between the kicks (${between})`);
  H.eq(fresh, 0, "and never a fresh 1 on an onset between them");
}

// ===========================================================================
// MUSIC TRACK: AUTO → PULSE → DRIVE, saved by name, loaded by a reload
// ===========================================================================
function session(Y) {
  const G = Y.Game, MS = Y.C.FIXED_DT * 1000;
  let clock = 0;
  const halfFrame = () => { clock += MS / 2; if (Y.AudioSys.ctx) Y.AudioSys.ctx.currentTime = clock / 1000; G.frame(clock); };
  const liveStep = () => { const want = G.stats.ticks + 1; for (let n = 0; G.stats.ticks < want && n < 8; n++) halfFrame(); };
  const steps = n => { for (let i = 0; i < n; i++) liveStep(); };
  const press = k => { G.input.keyDown(k); liveStep(); G.input.keyUp(k); liveStep(); };
  const tap = (k, n) => { for (let i = 0; i < n; i++) { G.input.keyDown(k); steps(2); G.input.keyUp(k); liveStep(); } };
  const ctx2d = Y._env.canvas.getContext("2d");
  const drawn = () => { const prev = ctx2d.fillText, out = []; ctx2d.fillText = s => out.push(String(s)); G.draw(); ctx2d.fillText = prev; return out; };
  return {
    steps, ok: () => press(" "),
    right: n => tap("ArrowRight", n), left: n => tap("ArrowLeft", n),
    detail: label => { const t = drawn(), i = t.indexOf(label); return i < 0 ? null : t[i + 1]; },
    boot: () => { G.frame(0); steps(2); },
    // ⛔ REPAIRED IN PLACE (CS018 P2, Q2-A): VOICE VOLUME is cut, so MUSIC TRACK is
    // OPTIONS' row 7, not 8. The fixture's precondition — the cursor on the row — holds.
    toTrack: () => { G.quitToTitle(); steps(2); tap("ArrowRight", 1); press(" "); tap("ArrowRight", 7); },
  };
}
{
  const store = new Map();
  const X1 = H.buildGame({ store });
  const S1 = session(X1);
  S1.boot();
  S1.toTrack();
  H.eq(X1.state.screen + " " + S1.detail("MUSIC TRACK"), "options AUTO", "fixture: OPTIONS, MUSIC TRACK reads AUTO");
  S1.ok();
  const seen = [S1.detail("MUSIC TRACK")];
  for (let i = 0; i < 3; i++) { S1.right(1); seen.push(S1.detail("MUSIC TRACK")); }
  H.eq(J(seen), J(["‹AUTO›", "‹PULSE›", "‹DRIVE›", "‹DRIVE›"]), "⛔ MUSIC TRACK cycles AUTO → PULSE → DRIVE and clamps at DRIVE");
  S1.ok();
  H.eq(S1.detail("MUSIC TRACK"), "DRIVE", "Fire exits and keeps DRIVE");
  const stored = JSON.parse(store.get(NS + "settings") || "null");
  H.eq(stored && stored.d.sound.track, "drive", "⛔ the row saves \"drive\" by name");

  const X2 = H.buildGame({ store, audio: true });                // trap 3
  H.eq(X2.Game.settingsHooks.settingsSnapshot().sound.track, "drive", "⛔ a reload over the same store loads DRIVE");
  const S2 = session(X2);
  S2.boot();
  S2.toTrack();
  H.eq(S2.detail("MUSIC TRACK"), "DRIVE", "and OPTIONS reads DRIVE");
  X2.AudioSys.unlock();
  X2.startGame(9);
  H.eq(X2.state.mode, "classic", "fixture: a Classic run");
  S2.steps(4);
  H.eq(X2.MusicSys.state, "drive", "⛔ the reloaded DRIVE plays drive in a Classic run");
}

H.report("test-cs012-p1.js");
