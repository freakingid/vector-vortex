// test-cs009-p3.js — CS009 P3: music in the game and the OPTIONS sound rows
// (GDD 10.5, 11.1, 11.7, 13; plan §0, §5). Asserts what P3 owns:
// musicStateFor() across every screen, both optionsFrom values and both track
// settings; audioFrame()'s seat in Game.frame(); with the recording fake,
// driven through frame(), title plays `title`, play plays `pulse`, game over
// fades to silence over C.MUSIC_FADE_OUT and RESTART starts `pulse` again; the
// sound rows (MASTER / MUSIC / SFX VOLUME, MUSIC TRACK): setVol ramps, clamps,
// every exit keeps the value, a held Purge stays on OPTIONS, a quit keeps them
// and Game.reset() restores them; and no label overlaps its armed detail.
// ⛔ REWRITTEN IN PLACE (CS018 P2, Q2-A): VOICE VOLUME was a fifth row moving a
// bus with no input (A3). 1.0.1 cuts it; its claims now say the voice bus has no
// row, sits at unity and is never moved.
//
// ⛔ TRAPS.
//  1. The fake's clock is the test's: halfFrame() writes ctx.currentTime.
//  2. A setState() before the gesture is dropped, so unlock() comes after a
//     frame has already run, and the NEXT frame is what starts the music.
//  3. AUTO and PULSE both resolve to `pulse` in Classic, so the crossfade on a
//     track change is observed by pointing C.MODE_TRACK.classic at `title` for
//     one case, and restoring it.
"use strict";

const fs = require("fs");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

installSeed(20260917);
const ROOT = path.join(__dirname, "..");
const script = H.extractScript(fs.readFileSync(path.join(ROOT, "dist", "vector-vortex.html"), "utf8"));

// ---------------------------------------------------------------------------
// musicStateFor() — pure, every screen
// ---------------------------------------------------------------------------

{
  const X = H.buildGame();
  const { C } = X;
  H.eq(typeof X.musicStateFor, "function", "musicStateFor is a top-level function");
  // ⛔ REWRITTEN IN PLACE (CS012 P1). These were { classic: "pulse" } and AUTO /
  // PULSE. CS012 R10 gives Overdrive its own track and appends DRIVE, a choice
  // in either mode; the claim, that the map and the row are exactly these, holds.
  H.eq(JSON.stringify(C.MODE_TRACK), JSON.stringify({ classic: "pulse", overdrive: "drive" }), "C.MODE_TRACK is { classic: \"pulse\", overdrive: \"drive\" }");
  H.eq(JSON.stringify(C.MUSIC_TRACK_CHOICES), JSON.stringify(["auto", "pulse", "drive"]), "C.MUSIC_TRACK_CHOICES is AUTO / PULSE / DRIVE (A4, R10)");
  H.assert(!(X.MUSIC_SILENCE in X.MUSIC_TRACKS), `the silence name "${X.MUSIC_SILENCE}" names no track`);

  const TITLE_SIDE = ["title", "mode", "depth"];
  const RUN = ["play", "pause"];
  const PAGES = ["options", "controls", "keyboard", "gamepad", "credits"];
  const before = JSON.stringify({ screen: X.state.screen, mode: X.state.mode });
  let n = 0;
  for (const from of ["title", "pause"]) {
    for (const track of ["auto", "pulse"]) {
      for (const s of TITLE_SIDE.concat(RUN, PAGES, ["gameover"])) {
        const want = s === "gameover" ? X.MUSIC_SILENCE
                   : TITLE_SIDE.includes(s) ? "title"
                   : RUN.includes(s) ? "pulse"
                   : from === "pause" ? "pulse" : "title";
        const got = X.musicStateFor(s, from, "classic", track);
        H.eq(got, want, `musicStateFor(${s}, from ${from}, ${track})`);
        n++;
      }
    }
  }
  H.eq(n, 44, "eleven screens × two optionsFrom × two settings");
  H.eq(JSON.stringify({ screen: X.state.screen, mode: X.state.mode }), before, "⛔ musicStateFor writes no state");

  // AUTO resolves THROUGH C.MODE_TRACK; PULSE forces pulse.
  const saved = C.MODE_TRACK.classic;
  C.MODE_TRACK.classic = "title";
  H.eq(X.musicStateFor("play", "title", "classic", "auto"), "title", "⛔ AUTO reads C.MODE_TRACK[mode]");
  H.eq(X.musicStateFor("play", "title", "classic", "pulse"), "pulse", "⛔ PULSE forces pulse whatever the mode's track");
  C.MODE_TRACK.classic = saved;

  // Headless: the whole front door runs with audioFrame() calling a null context.
  const G = X.Game;
  G.reset(); G.frame(0); G.quitToTitle();
  let t = 0;
  for (let i = 0; i < 120; i++) { t += C.FIXED_DT * 500; G.frame(t); }
  H.eq(X.AudioSys.ctx, null, "headless: no context");
  H.eq(X.MusicSys.state, "off", "headless: audioFrame() is a no-op");
}

// ---------------------------------------------------------------------------
// the seat: once per frame, after the steps, before draw(); no state, no draw
// ---------------------------------------------------------------------------

{
  const at = script.indexOf("function audioFrame()");
  H.assert(at > 0, "audioFrame() is defined");
  const body = script.slice(at, script.indexOf("\n  }\n", at));
  H.assert(/MusicSys\.setState\(musicStateFor\(/.test(body) && body.indexOf("setState") < body.indexOf("MusicSys.update()"),
           "audioFrame() calls setState(musicStateFor(...)), then update()");
  H.assert(!/state\.[\w.]+\s*=[^=]/.test(body), "⛔ audioFrame() writes no state");
  H.assert(!/draw/i.test(body), "⛔ audioFrame() draws nothing");
  const fr = script.slice(script.indexOf("function frame(tMs)"), script.indexOf("function audioFrame()"));
  const loopEnd = fr.lastIndexOf("stats.accumulator = accumulator;");
  H.assert(fr.split("audioFrame()").length === 2, "⛔ frame() calls audioFrame() exactly once");
  H.assert(loopEnd > 0 && fr.indexOf("audioFrame()") > loopEnd && fr.indexOf("audioFrame()") < fr.indexOf("draw();"),
           "⛔ after the steps, before draw()");
}

// ---------------------------------------------------------------------------
// the fake context, driven through frame()
// ---------------------------------------------------------------------------

const X = H.buildGame({ audio: true });
const { C, state, AudioSys: A, MusicSys: M } = X;
const G = X.Game;
const rec = X._audio;
const MS = C.FIXED_DT * 1000;

let now = 1758100000000;
Date.now = () => (now += 7919);                                    // menu runs take a time seed

let clock = 0;
function halfFrame() { clock += MS / 2; if (A.ctx) A.ctx.currentTime = clock / 1000; G.frame(clock); }   // trap 1
function liveStep() {
  const want = G.stats.ticks + 1;
  for (let n = 0; G.stats.ticks < want && n < 8; n++) halfFrame();
}
function steps(n) { for (let i = 0; i < n; i++) liveStep(); }
function toTitle() { G.reset(); clock = 0; G.frame(0); G.quitToTitle(); steps(2); }
const key = k => ({ down: () => G.input.keyDown(k), up: () => G.input.keyUp(k) });
const FIRE = key(" "), PURGE = key("Shift"), ESC = key("Escape");
function press(b) { b.down(); liveStep(); b.up(); liveStep(); }
function tap(k, n) { for (let i = 0; i < n; i++) { G.input.keyDown(k); steps(2); G.input.keyUp(k); liveStep(); } }
const right = n => tap("ArrowRight", n), left = n => tap("ArrowLeft", n);

const ctx2d = X._env.canvas.getContext("2d");
function drawn() {
  const prev = ctx2d.fillText, out = [];
  ctx2d.fillText = (str, x) => out.push({ str: String(str), x, align: ctx2d.textAlign });
  G.draw();
  ctx2d.fillText = prev;
  return out;
}
const detail = label => { const t = drawn(); const i = t.findIndex(x => x.str === label); return i < 0 ? null : t[i + 1].str; };
function noOverlap(tag) {
  const t = drawn(), w = s => s.str.length * C.MENU_TEXT_SIZE * C.TEXT_CHAR_W;
  const L = t.filter(x => x.align === "left"), R = t.filter(x => x.align === "right");
  let ok = true, pair = "";
  for (const l of L) for (const r of R) if (!(l.x + w(l) < r.x - w(r))) { ok = false; pair = `"${l.str}" / "${r.str}"`; }
  H.assert(ok, `${tag}: no label overlaps a detail ${pair}`);
}
const gainLog = node => rec.automation.filter(a => a.node === node && a.param === "gain");

// Trap 2: a frame before the gesture, then the gesture, then a frame.
toTitle();
H.eq(M.state, "off", "before the gesture, setState is dropped");
A.unlock();
halfFrame();
H.eq(M.state, "title", "⛔ the next frame after the gesture starts the title track");
H.assert(rec.connections.some(c => c.from === A.voice && c.to === A.master), "the voice bus feeds master");
H.assert(M.track === X.MUSIC_TRACKS.title && M.trackGain !== null, "the title screen plays `title`");
{
  const s0 = rec.starts.length;
  steps(300);
  H.assert(rec.starts.length > s0, "and its notes are scheduled frame by frame");
}

// Into play: MODE, CLASSIC, START DEPTH 1.
// ⛔ REPAIRED IN PLACE AT CS012 P3 (O9): OVERDRIVE is MODE's first row, so one
// step down restores this file's precondition — a CLASSIC run, whose AUTO track
// is `pulse`. Every claim below is about the crossfades, not about the mode.
const titleGain = M.trackGain;
press(FIRE); H.eq(M.state, "title", "MODE plays `title`");
right(1);                                       // OVERDRIVE -> CLASSIC
press(FIRE); H.eq(M.state, "title", "START DEPTH plays `title`");
FIRE.down(); liveStep();
H.eq(state.screen, "play", "fixture: a run from the front door");
H.eq(M.state, "pulse", "⛔ entering play starts `pulse` on that frame");
H.assert(M.track === X.MUSIC_TRACKS.pulse, "play plays the pulse table");
{
  const a = gainLog(titleGain);
  const ramp = a[a.length - 1], cancel = a[a.length - 3];
  H.assert(ramp.fn === "linearRampToValueAtTime" && ramp.v === 0.0001 && Math.abs(ramp.t - cancel.t - C.MUSIC_CROSSFADE) < 1e-9,
           "the title track fades out over C.MUSIC_CROSSFADE");
}
FIRE.up(); steps(20);
const pulseGain = M.trackGain;

// Pause and OPTIONS from pause keep the gameplay track — no crossfade.
press(ESC);
H.eq(state.screen, "pause", "fixture: paused");
right(1); press(FIRE);
H.eq(state.screen, "options", "fixture: OPTIONS from pause");
H.assert(M.state === "pulse" && M.trackGain === pulseGain, "⛔ pause and its OPTIONS keep `pulse` running, uncrossfaded");

// ⛔ A MUSIC TRACK change in play is heard at once (trap 3).
{
  C.MODE_TRACK.classic = "title";
  halfFrame();
  H.eq(M.state, "title", "fixture: AUTO now resolves to `title`");
  const autoGain = M.trackGain;
  right(7); press(FIRE); right(1); press(FIRE);             // CS018 P2: MUSIC TRACK is row 7
  H.eq(detail("MUSIC TRACK"), "PULSE", "fixture: MUSIC TRACK set to PULSE");
  H.eq(M.state, "pulse", "⛔ a MUSIC TRACK change crossfades at once");
  H.assert(M.trackGain !== autoGain && gainLog(autoGain).some(a => a.v === 0.0001), "the old track is faded out");
  press(FIRE); left(1); press(FIRE);
  H.eq(detail("MUSIC TRACK"), "AUTO", "fixture: back to AUTO");
  C.MODE_TRACK.classic = "pulse";
  halfFrame();
  H.eq(M.state, "pulse", "fixture: C.MODE_TRACK restored");
}

// Game over fades to silence over C.MUSIC_FADE_OUT.
press(ESC); press(ESC);
H.eq(state.screen, "play", "fixture: back in play");
function stageDeath(lives) {
  state.spawn.remaining = 5; state.spawn.timer = 0;
  state.enemies = []; state.shots = [];
  state.lives = lives;
  const e = X.spawnEnemy("vaulter", state.skimmer.lane, 0);
  e.depth = e.killDepth;
  state.invulnTime = C.RESPAWN_INVULN;
  liveStep();
}
steps(10);
const liveGain = M.trackGain;
stageDeath(1);
H.eq(state.screen, "gameover", "fixture: the last life");
H.eq(M.state, X.MUSIC_SILENCE, "⛔ game over names the silence");
H.eq(M.trackGain, null, "and no track gain remains");
{
  const a = gainLog(liveGain);
  const ramp = a[a.length - 1], cancel = a[a.length - 3];
  H.assert(ramp.fn === "linearRampToValueAtTime" && ramp.v === 0.0001, "⛔ the pulse track gain ramps to silence");
  H.close(ramp.t - cancel.t, C.MUSIC_FADE_OUT, 1e-9, "⛔ over C.MUSIC_FADE_OUT");
}
{
  const s0 = rec.starts.length;
  for (let n = 0; G.hitStopLeft > 0 && n < 600; n++) halfFrame();
  steps(20);
  H.eq(rec.starts.length, s0, "no note is scheduled at game over");
}
press(FIRE);
H.eq(state.screen, "play", "fixture: RESTART");
H.assert(M.state === "pulse" && M.trackGain !== null && M.trackGain !== liveGain, "⛔ RESTART starts `pulse` again");

// ---------------------------------------------------------------------------
// the sound rows
// ---------------------------------------------------------------------------

// ⛔ REWRITTEN IN PLACE (CS018 P2, Q2-A): ROWS are the three volume rows; BUSES
// stay the engine's four, so every "untouched" and "unity" claim still reads the
// voice bus. Each assertion VOICE's row made is rewritten below, marked 1.0.1.
function toOptions() { G.quitToTitle(); steps(2); right(1); press(FIRE); }
const ROWS = ["master", "music", "sfx"];
const BUSES = ["master", "music", "sfx", "voice"];
const LABEL = { master: "MASTER VOLUME", music: "MUSIC VOLUME", sfx: "SFX VOLUME", voice: "VOICE VOLUME" };
const shownAt = b => b === "voice" ? null : "100%";              // 1.0.1: no VOICE row to read

toTitle();
halfFrame();
toOptions();
H.eq(state.screen, "options", "fixture: OPTIONS from the title");
H.eq(M.state, "title", "OPTIONS from the title plays `title`");
right(6);
for (const b of BUSES) H.eq(detail(LABEL[b]), shownAt(b), b === "voice" ? "no VOICE VOLUME row at launch (1.0.1)" : `${LABEL[b]} reads 100% at launch (A2)`);
H.eq(detail("MUSIC TRACK"), "AUTO", "MUSIC TRACK reads AUTO at launch");

ROWS.forEach((bus, i) => {
  toTitle(); right(1); press(FIRE);
  right(4 + i);
  press(FIRE);
  H.eq(detail(LABEL[bus]), "‹100%›", `${LABEL[bus]}: Fire arms the row`);
  noOverlap(`${LABEL[bus]} armed`);
  const n0 = gainLog(A[bus]).length, v0 = rec.valueSets.length;
  left(3);
  H.eq(state.screen, "options", `${LABEL[bus]}: rotate adjusts, the cursor stays`);
  H.eq(detail(LABEL[bus]), "‹" + "70%›", `${LABEL[bus]}: three taps down, 70%`);
  H.close(A.vol[bus], 0.7, 1e-12, `${LABEL[bus]}: ⛔ linear gain, steps / C.AUDIO_VOL_STEPS`);
  const a = gainLog(A[bus]);
  const ramp = a[a.length - 1], cancel = a[a.length - 3];
  H.eq(a.length - n0, 9, `${LABEL[bus]}: one setVol ramp per step`);
  H.assert(ramp.fn === "linearRampToValueAtTime" && Math.abs(ramp.v - 0.7) < 1e-12 &&
           Math.abs(ramp.t - cancel.t - C.AUDIO_VOL_RAMP) < 1e-9, `${LABEL[bus]}: ⛔ a ramp over C.AUDIO_VOL_RAMP`);
  H.eq(rec.valueSets.slice(v0).filter(v => v.node === A[bus]).length, 0, `${LABEL[bus]}: never a bare .value set`);
  for (const other of BUSES) if (other !== bus) H.eq(A.vol[other], 1, `${LABEL[bus]}: ${other} is untouched`);
  press(FIRE);
  H.eq(detail(LABEL[bus]), "70%", `${LABEL[bus]}: Fire exits and keeps 70%`);
  H.eq(state.screen, "options", `${LABEL[bus]}: and stays on OPTIONS`);
});

// VOICE's pass, rewritten (1.0.1): its old row, 4 + 3, is MUSIC TRACK now, and
// nothing done there moves the voice bus.
{
  toTitle(); right(1); press(FIRE);
  right(7);
  press(FIRE);
  H.eq(detail("MUSIC TRACK"), "‹AUTO›", "VOICE's old row: Fire arms MUSIC TRACK, the row after SFX VOLUME (1.0.1)");
  noOverlap("MUSIC TRACK armed on VOICE's old row");
  const n0 = gainLog(A.voice).length, v0 = rec.valueSets.length;
  left(3);
  H.eq(state.screen, "options", "VOICE's old row: rotate adjusts MUSIC TRACK, the cursor stays");
  H.eq(detail("MUSIC TRACK"), "‹AUTO›", "VOICE's old row: three taps down clamp MUSIC TRACK at AUTO");
  H.eq(A.vol.voice, 1, "⛔ the voice bus holds unity (1.0.1)");
  H.eq(gainLog(A.voice).length - n0, 0, "⛔ and no setVol ramp reaches it (1.0.1)");
  H.eq(gainLog(A.voice).length, 0, "⛔ nor ever has, this session (1.0.1)");
  H.eq(rec.valueSets.slice(v0).filter(v => v.node === A.voice).length, 0, "never a bare .value set on it either");
  for (const other of ["master", "music", "sfx"]) H.eq(A.vol[other], 1, `VOICE's old row: ${other} is untouched`);
  press(FIRE);
  H.eq(detail("MUSIC TRACK"), "AUTO", "VOICE's old row: Fire exits MUSIC TRACK and keeps AUTO");
  H.eq(state.screen, "options", "VOICE's old row: and stays on OPTIONS");
}

// ⛔ The voice bus has no input (A3), and since 1.0.1 no row.
H.eq(rec.connections.filter(c => c.to === A.voice).length, 0, "⛔ nothing is connected into the voice bus, all session");

// Clamps, and every exit keeps the value.
toOptions();
right(4); press(FIRE);
left(15);
H.eq(detail("MASTER VOLUME"), "‹" + "0%›", "clamped at 0%");
H.eq(A.vol.master, 0, "master at 0");
{
  const n = gainLog(A.master).length;
  left(2);
  H.eq(gainLog(A.master).length, n, "⛔ a tap past the clamp schedules no ramp");
}
right(15);
H.eq(detail("MASTER VOLUME"), "‹" + "100%›", "clamped at 100%");
H.eq(A.vol.master, 1, "master at 1");
left(4);
PURGE.down(); steps(6); PURGE.up(); liveStep();                   // a human-length hold
H.eq(state.screen, "options", "⛔ a held Purge leaves the row, not OPTIONS");
H.eq(detail("MASTER VOLUME"), "60%", "Purge keeps 60%");
right(1);
H.eq(detail("MUSIC VOLUME") !== null && state.screen === "options", true, "the cursor moves again once the row lets go");
press(FIRE); left(2); press(ESC);
H.eq(state.screen, "options", "⛔ Escape leaves the row, not OPTIONS");
H.eq(detail("MUSIC VOLUME"), "80%", "Escape keeps 80%");
H.close(A.vol.music, 0.8, 1e-12, "and the music bus holds 0.8");

// MUSIC TRACK: AUTO / PULSE / DRIVE (CS012 R10), clamped at both ends.
// ⛔ REPAIRED IN PLACE (CS018 P2): from MUSIC VOLUME, MUSIC TRACK is two rows on,
// not three; three now opens ACHIEVEMENTS.
right(2); press(FIRE);
H.eq(detail("MUSIC TRACK"), "‹" + "AUTO›", "MUSIC TRACK arms");
right(1);
H.eq(detail("MUSIC TRACK"), "‹" + "PULSE›", "one step: PULSE");
noOverlap("MUSIC TRACK armed on PULSE");
right(3);
// ⛔ REWRITTEN IN PLACE (CS012 P1). This was "clamped at PULSE". R10 appends
// DRIVE, so the top clamp is the row's last choice, DRIVE.
H.eq(detail("MUSIC TRACK"), "‹" + "DRIVE›", "clamped at DRIVE");
left(5);
H.eq(detail("MUSIC TRACK"), "‹" + "AUTO›", "clamped at AUTO");
right(1); press(PURGE);
H.eq(detail("MUSIC TRACK"), "PULSE", "Purge exits and keeps PULSE");

// Survives quitToTitle(); resets on Game.reset().
toOptions();
right(7);                                                         // CS018 P2: MUSIC TRACK is row 7
H.eq(detail("MASTER VOLUME"), "60%", "⛔ a quit to the title keeps MASTER 60%");
H.eq(detail("MUSIC VOLUME"), "80%", "and MUSIC 80%");
H.assert(detail("VOICE VOLUME") === null && A.vol.voice === 1, "⛔ and no VOICE row to keep: the voice bus is at unity (1.0.1)");
H.eq(detail("MUSIC TRACK"), "PULSE", "and MUSIC TRACK PULSE");
H.close(A.vol.master, 0.6, 1e-12, "and the master bus");
const before = BUSES.map(b => gainLog(A[b]).length);
G.reset();
for (const [i, b] of BUSES.entries()) {
  H.eq(A.vol[b], 1, b === "voice" ? "⛔ Game.reset() leaves voice at unity (1.0.1)" : `⛔ Game.reset() restores ${b} to unity`);
  const a = gainLog(A[b]);
  if (b === "voice") {
    H.eq(a.length, before[i], "⛔ and never ramps the voice bus: nothing moved it (1.0.1)");
    continue;
  }
  H.assert(a.length > before[i] && a[a.length - 1].fn === "linearRampToValueAtTime" && a[a.length - 1].v === 1,
           `and ramps the ${b} bus back`);
}
clock = 0; G.frame(0); G.quitToTitle(); steps(2); right(1); press(FIRE); right(7);
for (const b of BUSES) H.eq(detail(LABEL[b]), shownAt(b), b === "voice" ? "after Game.reset(), still no VOICE VOLUME row (1.0.1)" : `after Game.reset(), ${LABEL[b]} reads 100%`);
H.eq(detail("MUSIC TRACK"), "AUTO", "after Game.reset(), MUSIC TRACK reads AUTO");

H.report();
