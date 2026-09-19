// test-cs009-p4.js — CS009 P4: tools/sfx-lab.html, createSfxPlayer, C.SFX
// (GDD 11.8; plan §6; Paul's A7, A8).
// Asserts what P4 owns: the lab's BLOCK A / BLOCK B / BLOCK SFX are the built
// file's 16-audio-engine.js, 17-audio-tracks.js and 00-config.js SFX group,
// character for character; every plan §7 event has a valid recipe and 2–3
// candidates; purgeWeak is not purge; COPY OUT rewrites only picked lines; on
// the recording fake, play() builds a bounded node set that stops itself, and a
// held voice's set() moves frequency and stop() stops every source; headless,
// every call is a no-op.
//
// ⛔ TRAPS.
//  1. Identity reads dist/, never src/ (CLAUDE.md), trailing whitespace stripped.
//  2. The lab's functions are extracted by `\nfunction name(` up to the first
//     `\n}\n`, so they keep their closing brace at column 0.
//  3. `rec.clear()` wipes the logs: this file counts by slice, never clears.
//  4. No seat plays anything yet (P5's), so nothing here drives Game.update().
"use strict";

const fs = require("fs");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

installSeed(20260918);
const ROOT = path.join(__dirname, "..");
const LAB_PATH = "tools/sfx-lab.html";
const script = H.extractScript(fs.readFileSync(path.join(ROOT, "dist", "vector-vortex.html"), "utf8"));
const lab = fs.readFileSync(path.join(ROOT, LAB_PATH), "utf8");
const trimEnd = s => s.replace(/\s+$/, "");

// plan §7's event list (A8: the core set, no spawn cues), and A9's voices.
// ⛔ CS012 P4 appended `comboLost` in place (GDD 14.4's "loss has its own
// sound"; O8): the list is the build's own event set, not CS009's alone.
// CS013 P1 appended `collect` in place (GDD 14.1's tokens; CS013 T11), and
// CS013 P2 `wardBreak` (GDD 14.1's Ward; T9).
const EVENTS = ["fire", "kill", "split", "chip", "bolt", "cross", "surgeCharge", "surgeDischarge",
  "death", "gameOver", "respawn", "purge", "purgeWeak", "extraLife", "lifeLost", "wellClear",
  "dive", "diveStrike", "menuMove", "menuConfirm", "menuBack", "comboLost", "collect", "wardBreak"];
const VOICES = ["vaulter", "carrier", "weaver", "weaverBolt", "thorn", "drifter", "surger", "reaver",
  "warden"];   // CS012 P2: + reaver; CS013 P3: + warden — both in place

function sliceModules(src) {
  const re = /\/\/ ={74}\n\/\/ ([^\n]+)\n\/\/ ={74}\n/g;
  const marks = [];
  let m;
  while ((m = re.exec(src)) !== null) marks.push({ name: m[1].trim(), head: m.index, body: m.index + m[0].length });
  const out = {};
  for (let i = 0; i < marks.length; i++) {
    out[marks[i].name] = src.slice(marks[i].body, i + 1 < marks.length ? marks[i + 1].head : src.length);
  }
  return out;
}
const mods = sliceModules(script);

function labBlock(name) {
  const begin = lab.indexOf("// ===== " + name + " BEGIN");
  const end = lab.indexOf("// ===== " + name + " END");
  if (begin < 0 || end < begin) return null;
  return lab.slice(lab.indexOf("\n", begin) + 1, end);
}
function fnText(src, name) {
  const at = src.indexOf("\nfunction " + name + "(");
  if (at < 0) return null;
  const end = src.indexOf("\n}\n", at);
  return end < 0 ? null : src.slice(at + 1, end + 2);
}
function firstDiffLine(a, b) {
  const la = a.split("\n"), lb = b.split("\n");
  for (let i = 0; i < Math.max(la.length, lb.length); i++) {
    if (la[i] !== lb[i]) return `line ${i + 1}: lab ${JSON.stringify(la[i])} vs build ${JSON.stringify(lb[i])}`;
  }
  return "no line differs";
}
function same(inLab, inBuild, what) {
  const ok = inLab !== null && typeof inBuild === "string" && trimEnd(inLab) === trimEnd(inBuild);
  H.assert(ok, `⛔ ${LAB_PATH} ${what}` +
    (ok || inLab === null || typeof inBuild !== "string" ? "" : ` — ${firstDiffLine(trimEnd(inLab), trimEnd(inBuild))}`));
}

// The SFX group of the built config: its header line up to the next group's.
const cfg = mods["00-config.js"] || "";
const groupAt = cfg.indexOf("  // ---- SFX (GDD 11.8)");
const groupText = groupAt < 0 ? null : cfg.slice(groupAt, cfg.indexOf("\n  // ---- ", groupAt + 1) + 1);

// ---------------------------------------------------------------------------
// ⛔ the lab's blocks are the build's own text
// ---------------------------------------------------------------------------
H.assert(groupText !== null && groupText.includes("  SFX: {"), "the built config has an SFX group");
same(labBlock("BLOCK A"), mods["16-audio-engine.js"], "BLOCK A is identical text to src/16-audio-engine.js");
same(labBlock("BLOCK B"), mods["17-audio-tracks.js"], "BLOCK B is identical text to src/17-audio-tracks.js");
same(labBlock("BLOCK SFX"), groupText, "BLOCK SFX (every candidate A) is identical text to src/00-config.js's SFX group");
{
  const inBuild = fnText(mods["16-audio-engine.js"] || "", "createSfxPlayer");
  H.assert(inBuild !== null && inBuild.length > 500, "the built file defines createSfxPlayer in 16-audio-engine.js");
  same(fnText(lab, "createSfxPlayer"), inBuild, "⛔ the lab's player code is identical text to createSfxPlayer");
}

// ---------------------------------------------------------------------------
// the recipes, as the built file has them
// ---------------------------------------------------------------------------
const X = H.buildGame({ audio: true });
const { C, sfxCheckRecipe, createSfxPlayer, AudioSys, Sfx } = X;
H.eq(X.AUDIO_VERSION, "0.4.0", "kit-audio is 0.4.0 (MINOR: the SFX player, CS010's groups, CS012's high-pass)");
H.assert(typeof createSfxPlayer === "function" && typeof sfxCheckRecipe === "function", "createSfxPlayer and sfxCheckRecipe exist");
H.assert(Sfx && typeof Sfx.play === "function" && typeof Sfx.hold === "function", "19-sfx.js builds the Sfx player");
H.assert(/createSfxPlayer\(AudioSys, \{\s*noise: mulberry32\(C\.AUDIO_NOISE_SEED\),/.test(mods["19-sfx.js"]),
  "⛔ Sfx's noise is its own seeded stream instance, from C.AUDIO_NOISE_SEED");
{
  const kit = mods["16-audio-engine.js"];
  H.assert(!/\bC\./.test(kit) && !/\bSfx\b/.test(kit) && !/Math\s*\.\s*random/.test(kit),
    "⛔ the player reads no config, names no game instance, and draws no platform noise");
}

H.eq(JSON.stringify(Object.keys(C.SFX)), JSON.stringify(EVENTS), "⛔ C.SFX holds exactly the event list above, in its order (plan §7's, + CS012 P4's comboLost, + CS013 P1's collect, + P2's wardBreak)");
for (const name of EVENTS) {
  let err = null;
  try { sfxCheckRecipe(C.SFX[name]); } catch (e) { err = e.message; }
  H.assert(err === null, `C.SFX.${name} is a valid recipe${err ? ": " + err : ""}`);
}
H.eq(JSON.stringify(Object.keys(C.SFX_KILL_PITCH)), JSON.stringify(VOICES), `⛔ C.SFX_KILL_PITCH is keyed by the ${VOICES.length} sfxVoice values`);
H.assert(VOICES.every(v => typeof C.SFX_KILL_PITCH[v] === "number" && C.SFX_KILL_PITCH[v] > 0), "every kill pitch is > 0");

// ⛔ GDD 4.3: the second use is distinctly feeble.
{
  const p = C.SFX.purge, w = C.SFX.purgeWeak;
  H.assert(JSON.stringify(p) !== JSON.stringify(w), "⛔ purgeWeak is a different recipe from purge");
  H.assert(w.gain < p.gain, `purgeWeak peaks lower than purge (${w.gain} < ${p.gain})`);
  H.assert(w.atk + w.hold + w.rel < p.atk + p.hold + p.rel, "and is shorter");
}

// ---------------------------------------------------------------------------
// the lab: candidates, the Surger audition, COPY OUT
// ---------------------------------------------------------------------------
const cands = new Function(labBlock("CANDIDATES") + "\nreturn { SFX_BRIEFS, SFX_A_LABELS, SFX_ALTS };")();
for (const name of EVENTS) {
  const alts = cands.SFX_ALTS[name] || [];
  const n = 1 + alts.length;
  H.assert(n >= 2 && n <= 3, `⛔ ${name} has 2–3 candidates (${n}), A first`);
  H.assert(typeof cands.SFX_A_LABELS[name] === "string" && typeof cands.SFX_BRIEFS[name] === "string", `${name} has a brief and an A label`);
  alts.forEach((c, i) => {
    let err = null;
    try { sfxCheckRecipe(c.recipe); } catch (e) { err = e.message; }
    H.assert(err === null && JSON.stringify(c.recipe) !== JSON.stringify(C.SFX[name]),
      `${name} candidate ${"BC"[i]} is a valid recipe, not A again${err ? ": " + err : ""}`);
  });
}
H.eq(Object.keys(cands.SFX_ALTS).length, EVENTS.length, "the lab lists no event outside the list above");

{
  const ui = lab.slice(lab.indexOf("// ===== LAB UI"));
  const telegraph = /telegraph: ([0-9.]+)/.exec(ui);
  H.assert(telegraph && Number(telegraph[1]) === C.SURGE_TELEGRAPH, "the lab drives the charge over C.SURGE_TELEGRAPH's value");
  H.assert(/tracks: \{ pulse: MUSIC_TRACKS\.pulse \}/.test(ui), "⛔ the lab's music plays BLOCK B's pulse");
  H.assert(/surgeCharge:\s*\[[^\n]*\n\s*setMusic\(true\);/.test(ui), "⛔ surgeCharge's context starts pulse");
  H.assert(/d\.handle = player\.hold\(d\.recipe\)/.test(ui) && /d\.handle\.set\(t01\)/.test(ui),
    "surgeCharge is auditioned as a held voice, set() once a frame");
  H.assert(/purgeWeak:[^\n]*at\(0, "purge"\); at\([0-9.]+, "purgeWeak", k\)/.test(ui), "⛔ purgeWeak's context plays purge beside it");
  for (const name of EVENTS) H.assert(new RegExp(`\\n  ${name}:\\s+\\["`).test(ui), `${name} has an in-context sequence`);
  H.assert(/data-play="\$\{name\}"/.test(ui) && /data-ctx="\$\{name\}"/.test(ui) && /data-pick="\$\{name\}"/.test(ui),
    "every row has ▶ per candidate, ▶ in context, and a picked mark");
}

{
  const src = ["sfxText", "sfxLine", "rewriteSfxBlock"].map(n => fnText(lab, n)).join("\n");
  const rewrite = new Function(src + "\nreturn rewriteSfxBlock;")();
  const block = labBlock("BLOCK SFX");
  H.eq(rewrite(block, {}), block, "no picks: COPY OUT prints the group unchanged");
  const allA = {};
  for (const name of EVENTS) allA[name] = C.SFX[name];
  H.eq(rewrite(block, allA), block, "⛔ every A picked explicitly: COPY OUT reprints every line exactly");
  const picked = { purge: cands.SFX_ALTS.purge[0].recipe, fire: cands.SFX_ALTS.fire[1].recipe };
  const out = rewrite(block, picked);
  const load = text => new Function("return {\n" + text + "\n};")();
  const after = load(out);
  H.eq(JSON.stringify(after.SFX.purge), JSON.stringify(picked.purge), "a B pick lands in the group");
  H.eq(JSON.stringify(after.SFX.fire), JSON.stringify(picked.fire), "a C pick lands in the group");
  const changed = out.split("\n").filter((l, i) => l !== block.split("\n")[i]).length;
  H.eq(changed, 2, "and exactly those two lines change");
  let threw = false;
  try { rewrite(block, { nosuchevent: C.SFX.fire }); } catch (e) { threw = true; }
  H.assert(threw, "a pick naming no line throws rather than printing an unedited group");
}

// ---------------------------------------------------------------------------
// ⛔ the player on the recording fake
// ---------------------------------------------------------------------------
const rec = X._audio;
H.assert(AudioSys.unlock(), "fixture: the fake context unlocks");
const ctx = AudioSys.ctx;
ctx.currentTime = 100;
const since = (list, from) => list.slice(from);
{
  let unbounded = 0, unstopped = 0, lateStop = 0, offBus = 0, silentEnd = 0;
  for (const name of EVENTS) {
    const r = C.SFX[name];
    const n0 = rec.nodes.length, s0 = rec.starts.length, p0 = rec.stops.length, c0 = rec.connections.length, a0 = rec.automation.length;
    Sfx.play(r);
    const nodes = since(rec.nodes, n0);
    const sources = nodes.filter(n => n.kind === "oscillator" || n.kind === "bufferSource");
    const gains = nodes.filter(n => n.kind === "gain"), filters = nodes.filter(n => n.kind === "biquad");
    if (gains.length !== 1 || filters.length !== (r.filter ? 1 : 0) ||
        sources.length !== (r.noise ? 1 : r.osc.length) || nodes.length > 4) unbounded++;
    const end = 100 + r.atk + r.hold + r.rel;
    const stops = since(rec.stops, p0);
    if (since(rec.starts, s0).length !== sources.length || !sources.every(s => stops.some(x => x.node === s))) unstopped++;
    if (!stops.every(x => x.t > end - 1e-9 && x.t <= end + 0.05)) lateStop++;
    if (!since(rec.connections, c0).some(c => c.from === gains[0] && c.to === AudioSys.sfx)) offBus++;
    const last = since(rec.automation, a0).filter(a => a.node === gains[0]).pop();
    if (!last || last.fn !== "exponentialRampToValueAtTime" || Math.abs(last.t - end) > 1e-9 || last.v > 0.001) silentEnd++;
  }
  H.eq(unbounded, 0, "⛔ play() builds one gain, at most one filter, and its one or two sources — nothing else");
  H.eq(unstopped, 0, "⛔ play() starts every source and stops every source it started");
  H.eq(lateStop, 0, "every stop lands at the end of the release, plus a short tail");
  H.eq(offBus, 0, "every recipe plays into the sfx bus");
  H.eq(silentEnd, 0, "every envelope ramps to silence at the end of the release");
}

// pitch and when
{
  const r = C.SFX.kill, p = C.SFX_KILL_PITCH.thorn;
  const n0 = rec.nodes.length, s0 = rec.starts.length;
  Sfx.play(r, { pitch: p, when: 101 });
  const nodes = since(rec.nodes, n0);
  const head = nodes.find(n => n.kind === (r.filter ? "biquad" : "oscillator"));
  const first = rec.automation.find(a => a.node === head && a.param === "frequency");
  const f0 = r.filter ? r.filter.f : r.osc[0].f;
  H.close(first.v, f0 * p, 1e-6, "⛔ pitch multiplies the recipe's frequencies");
  H.assert(since(rec.starts, s0).every(s => s.t === 101), "`when` starts the sound at that context time");
  const s1 = rec.starts.length;
  Sfx.play(r, { when: 50 });
  H.assert(since(rec.starts, s1).every(s => s.t === 100), "a `when` in the past starts now, never earlier");
}

// ⛔ the held voice
{
  const r = C.SFX.surgeCharge;
  H.assert(r.osc && r.osc.every(o => o.to > o.f), "fixture: surgeCharge's oscillators rise");
  const n0 = rec.nodes.length, p0 = rec.stops.length;
  const v = Sfx.hold(r);
  const oscs = since(rec.nodes, n0).filter(n => n.kind === "oscillator");
  const sources = since(rec.nodes, n0).filter(n => n.kind === "oscillator" || n.kind === "bufferSource");
  H.eq(rec.stops.length, p0, "a held voice schedules no stop of its own");
  const freqs = () => oscs.map(o => o.frequency.value);
  v.set(0);
  H.assert(freqs().every((f, i) => Math.abs(f - r.osc[i].f) < 1e-6), "⛔ set(0) holds every oscillator at f");
  ctx.currentTime = 100.2;
  v.set(0.5);
  const mid = freqs();
  H.assert(mid.every((f, i) => f > r.osc[i].f && f < r.osc[i].to), "⛔ set(0.5) moves every oscillator between f and to");
  v.set(1);
  H.assert(freqs().every((f, i) => Math.abs(f - r.osc[i].to) < 1e-6), "⛔ set(1) reaches to");
  v.set(7);
  H.assert(freqs().every((f, i) => Math.abs(f - r.osc[i].to) < 1e-6), "set() clamps past 1");
  const setCalls = rec.automation.filter(a => oscs.includes(a.node) && a.fn === "setTargetAtTime" && a.t === 100.2).length;
  H.eq(setCalls, oscs.length * 3, "each set() schedules one target per oscillator, at the current time");
  v.stop();
  const stops = since(rec.stops, p0);
  H.assert(sources.length > 0 && sources.every(s => stops.some(x => x.node === s)), "⛔ stop() stops every source");
  H.assert(stops.every(x => x.t > 100.2 && x.t <= 100.2 + r.rel + 0.05), "stop() releases over rel, then stops");
  v.stop();
  v.set(0);
  H.eq(rec.stops.length, p0 + sources.length, "a second stop(), and a set() after it, do nothing");
}

// recipe checks
{
  const bad = [
    [{ atk: 0.01, hold: 0, rel: 0.1, gain: 0.1 }, "neither osc nor noise"],
    [{ osc: [{ type: "sine", f: 440 }], noise: true, atk: 0.01, hold: 0, rel: 0.1, gain: 0.1 }, "both osc and noise"],
    [{ osc: [{ type: "sine", f: 440 }, { type: "sine", f: 440 }, { type: "sine", f: 440 }], atk: 0.01, hold: 0, rel: 0.1, gain: 0.1 }, "three oscillators"],
    [{ osc: [{ type: "sine", f: 440, to: 880 }], atk: 0.01, hold: 0, rel: 0.1, gain: 0.1 }, "a `to` with no glide"],
    [{ noise: true, filter: { type: "lowpass", f: 400, to: 800 }, atk: 0.01, hold: 0, rel: 0.1, gain: 0.1 }, "a filter `to` with no sweep"],
    [{ noise: true, atk: 0.01, hold: 0, rel: 0.1, gain: 0.1, gian: 1 }, "an unknown field"],
  ];
  for (const [r, why] of bad) {
    let threw = false;
    try { Sfx.play(r); } catch (e) { threw = true; }
    H.assert(threw, `a recipe with ${why} throws`);
  }
}

// ---------------------------------------------------------------------------
// ⛔ headless: no audio API, every call a no-op
// ---------------------------------------------------------------------------
{
  const Y = H.buildGame();
  H.assert(Y._audio === null && Y.AudioSys.ctx === null, "fixture: the default build has no context");
  let threw = null;
  try {
    for (const name of EVENTS) Y.Sfx.play(Y.C.SFX[name], { pitch: 2 });
    const v = Y.Sfx.hold(Y.C.SFX.surgeCharge);
    v.set(0.5);
    v.stop();
  } catch (e) { threw = e.message; }
  H.assert(threw === null, `⛔ headless, play, hold, set and stop are no-ops${threw ? ": " + threw : ""}`);
  H.assert(Y.AudioSys.ctx === null, "and none of them creates a context");
}

H.report();
