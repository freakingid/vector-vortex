// test-cs009-p2.js — CS009 P2: tools/music-lab.html and the two tracks (GDD
// 11.3, 11.4(c), 11.7; plan §4).
// Asserts what P2 owns: the lab's BLOCK A and BLOCK B are the built file's
// 16-audio-engine.js and 17-audio-tracks.js, character for character; the lab
// renders SOLO, MUTE and the PASS / FAIL mark per layer, SOLO is
// exclusive-additive, and COPY TABLE writes `audition`, `gain` and `cutoff`;
// both tracks carry no tier, valid marks and real notes, `pulse` runs >= 90 s,
// and the worst step stays under C.MUSIC_STEP_NODE_MAX.
//
// ⛔ TRAPS.
//  1. The identity check reads dist/, never src/ (CLAUDE.md): the build strips
//     trailing whitespace, so both sides are compared with it stripped.
//  2. The lab's functions are extracted by `\nfunction name(` up to the first
//     `\n}\n`, so they must keep their closing brace at column 0.
//  3. Nodes per step are COUNTED on the recording fake, never estimated.
//  4. The track count is the registry's (test-registry.js), never a literal.
"use strict";

const fs = require("fs");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");
const { COUNTS } = require("./test-registry.js");

installSeed(20260917);
const ROOT = path.join(__dirname, "..");
const LAB_PATH = "tools/music-lab.html";
const script = H.extractScript(fs.readFileSync(path.join(ROOT, "dist", "vector-vortex.html"), "utf8"));
const lab = fs.readFileSync(path.join(ROOT, LAB_PATH), "utf8");

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
const trimEnd = s => s.replace(/\s+$/, "");

// The text between a block's BEGIN and END marker lines, or null.
function labBlock(name) {
  const begin = lab.indexOf("// ===== BLOCK " + name + " BEGIN");
  const end = lab.indexOf("// ===== BLOCK " + name + " END");
  if (begin < 0 || end < begin) return null;
  return lab.slice(lab.indexOf("\n", begin) + 1, end);
}

// A top-level function's source in the lab, or null (trap 2).
function labFunction(name) {
  const at = lab.indexOf("\nfunction " + name + "(");
  if (at < 0) return null;
  const end = lab.indexOf("\n}\n", at);
  return end < 0 ? null : lab.slice(at + 1, end + 2);
}

function firstDiffLine(a, b) {
  const la = a.split("\n"), lb = b.split("\n");
  for (let i = 0; i < Math.max(la.length, lb.length); i++) {
    if (la[i] !== lb[i]) return `line ${i + 1}: lab ${JSON.stringify(la[i])} vs build ${JSON.stringify(lb[i])}`;
  }
  return "no line differs";
}

// ---------------------------------------------------------------------------
// ⛔ the lab's two blocks are the build's own text
// ---------------------------------------------------------------------------
for (const [block, file] of [["A", "16-audio-engine.js"], ["B", "17-audio-tracks.js"]]) {
  const inLab = labBlock(block), inBuild = mods[file];
  H.assert(inLab !== null, `${LAB_PATH} has BLOCK ${block}'s BEGIN and END markers`);
  H.assert(typeof inBuild === "string" && inBuild.length > 1000, `the built file has a real src/${file} slice`);
  if (inLab === null || typeof inBuild !== "string") continue;
  const same = trimEnd(inLab) === trimEnd(inBuild);
  H.assert(same, `⛔ ${LAB_PATH} BLOCK ${block} is identical text to src/${file}` +
    (same ? "" : ` — edit one, copy it to the other (${firstDiffLine(trimEnd(inLab), trimEnd(inBuild))})`));
}
H.assert(mods["17-audio-tracks.js"].includes("function buildTitleTrack(") &&
         mods["17-audio-tracks.js"].includes("function buildPulseTrack("),
  "17-audio-tracks.js holds buildTitleTrack and buildPulseTrack");

// ---------------------------------------------------------------------------
// the lab's controls
// ---------------------------------------------------------------------------
{
  const render = labFunction("renderLayers");
  H.assert(render !== null, "the lab has a renderLayers() layer renderer");
  const r = render || "";
  H.assert(/layers\.forEach\(\(L, i\) => \{/.test(r), "renderLayers builds one row per layer");
  const row = r.slice(r.indexOf("layers.forEach("), r.indexOf("tb.appendChild(tr)"));
  for (const [what, token] of [
    ["a SOLO control", 'class="solo" data-i="${i}"'],
    ["a MUTE control", 'class="mute" data-i="${i}"'],
    ["a gain slider", 'class="gain" data-i="${i}"'],
    ["a PASS mark", 'data-mark="pass"'],
    ["a FAIL mark", 'data-mark="fail"'],
    ["a — mark", 'data-mark="none"'],
  ]) {
    H.assert(row.includes(token), `⛔ every layer's row has ${what}`);
  }
  H.assert(/L\.cutoff\s*\?\s*`<input type="range" class="cutoff" data-i="\$\{i\}"/.test(row),
    "a layer with a cutoff gets a cutoff slider");
  const ui = lab.slice(lab.indexOf("// ===== LAB UI"));
  H.assert(/layerSink: \(\{ ctx, index, out \}\) => \{/.test(ui), "⛔ SOLO and MUTE hang on createMusic's layerSink, in the lab UI");

  // ⛔ SOLO is exclusive-additive.
  const src = labFunction("gateLevels");
  H.assert(src !== null, "the lab has gateLevels()");
  const gateLevels = new Function(src + "\nreturn gateLevels;")();
  const on = (lv) => lv.map(p => p[0] * p[1]);
  H.eq(JSON.stringify(on(gateLevels(4, new Set(), new Set()))), "[1,1,1,1]", "nothing soloed or muted: every layer sounds");
  H.eq(JSON.stringify(on(gateLevels(4, new Set([2]), new Set()))), "[0,0,1,0]", "⛔ one layer soloed: only it sounds");
  H.eq(JSON.stringify(on(gateLevels(4, new Set([0, 3]), new Set()))), "[1,0,0,1]", "⛔ two soloed: both sound (additive)");
  H.eq(JSON.stringify(on(gateLevels(4, new Set(), new Set([1])))), "[1,0,1,1]", "a muted layer is silent");
  H.eq(JSON.stringify(on(gateLevels(4, new Set([1]), new Set([1])))), "[0,0,0,0]", "mute outranks solo on the same layer");
}

// ---------------------------------------------------------------------------
// ⛔ COPY TABLE writes audition, gain and cutoff, and nothing else
// ---------------------------------------------------------------------------
{
  const src = labFunction("rewriteBlockB");
  H.assert(src !== null, "the lab has rewriteBlockB()");
  const rewrite = new Function(src + "\nreturn rewriteBlockB;")();
  const blockB = trimEnd(labBlock("B") || "");
  const load = text => new Function(text + "\n;return MUSIC_TRACKS;")();
  const base = load(blockB);
  H.eq(rewrite(blockB, []), blockB, "no edits: COPY TABLE prints BLOCK B unchanged");

  const BUILDERS = { title: "buildTitleTrack", pulse: "buildPulseTrack" };
  const edits = [];
  for (const key of Object.keys(BUILDERS)) {
    base[key].layers.forEach((L, i) => {
      const e = { builder: BUILDERS[key], name: L.name, audition: i % 2 === 0 ? "pass" : "fail", gain: "0.123" };
      if (L.cutoff) e.cutoff = "4321";
      edits.push(e);
    });
  }
  const marked = rewrite(blockB, edits);
  const after = load(marked);
  let auditions = 0, gains = 0, cutoffs = 0, untouched = 0, cells = 0, total = 0;
  for (const key of Object.keys(BUILDERS)) {
    after[key].layers.forEach((L, i) => {
      const was = base[key].layers[i];
      total++;
      if (L.audition === (i % 2 === 0 ? "pass" : "fail")) auditions++;
      if (L.gain === 0.123) gains++;
      if (!was.cutoff || L.cutoff === 4321) cutoffs++;
      const rest = Object.keys(was).filter(k => !["gain", "cutoff", "steps"].includes(k));
      if (rest.every(k => was[k] === L[k]) && L.cutoffTo === was.cutoffTo) untouched++;
      if (JSON.stringify(L.steps) === JSON.stringify(was.steps)) cells++;
    });
  }
  H.eq(auditions, total, "⛔ COPY TABLE writes every layer's audition mark");
  H.eq(gains, total, "COPY TABLE writes every edited gain");
  H.eq(cutoffs, total, "COPY TABLE writes every edited cutoff (and leaves cutoffTo alone)");
  H.eq(untouched, total, "COPY TABLE changes no other layer field");
  H.eq(cells, total, "COPY TABLE changes no note");
  const remarked = rewrite(marked, [{ builder: "buildPulseTrack", name: base.pulse.layers[0].name, audition: "fail" }]);
  H.eq(load(remarked).pulse.layers[0].audition, "fail", "a second mark replaces the first");
  H.eq((remarked.match(/audition: /g) || []).length, total, "and never writes a second audition field");
  const cleared = rewrite(marked, edits.map(e => ({ builder: e.builder, name: e.name, audition: null })));
  H.assert(!/audition: /.test(cleared), "a — mark removes the field");
  let threw = false;
  try { rewrite(blockB, [{ builder: "buildPulseTrack", name: "nosuchlayer", gain: "0.1" }]); } catch (err) { threw = true; }
  H.assert(threw, "an edit naming no layer throws rather than printing an unedited table");
}

// ---------------------------------------------------------------------------
// the tracks, as the built file has them
// ---------------------------------------------------------------------------
const X = H.buildGame({ audio: true });
const { C, MUSIC_TRACKS } = X;
{
  const names = Object.keys(MUSIC_TRACKS || {});
  H.eq(names.length, COUNTS.tracks, "MUSIC_TRACKS holds the registry's track count");
  H.assert(names.includes("title") && names.includes("pulse"), "the tracks are title and pulse (A5)");
  H.eq((script.match(/\bconst MUSIC_TRACKS\b/g) || []).length, 1, "⛔ MUSIC_TRACKS is declared once");
  H.assert(/\bconst MUSIC_TRACKS\b/.test(mods["17-audio-tracks.js"]), "and it is declared in 17-audio-tracks.js");
  H.assert(/tracks:\s*MUSIC_TRACKS,/.test(mods["19-sfx.js"]), "19-sfx.js hands MUSIC_TRACKS to MusicSys");

  const kit = mods["17-audio-tracks.js"];
  H.assert(!/\bC\./.test(kit) && !/\bstate\b/.test(kit.replace(/^\s*\/\/.*$/gm, "")),
    "⛔ 17-audio-tracks.js reads no config and no state (the lab runs it with neither)");
  for (const g of ["AudioSys", "MusicSys", "Game", "mulberry32"]) {
    H.assert(!new RegExp(`\\b${g}\\b`).test(kit), `17-audio-tracks.js names no game global (${g})`);
  }

  for (const name of names) {
    const t = MUSIC_TRACKS[name];
    let tiers = 0, badMarks = 0, badFreq = 0, badCell = 0, badRows = 0, notes = 0;
    for (const L of t.layers) {
      if ("tier" in L) tiers++;
      if (L.audition !== undefined && L.audition !== "pass" && L.audition !== "fail") badMarks++;
      if (!Array.isArray(L.steps) || L.steps.length !== t.steps) badRows++;
      for (const c of L.steps) {
        if (!c) continue;
        notes++;
        if (typeof c.f !== "number" || !isFinite(c.f) || !(c.f > 0)) badFreq++;
        if (!(c.dur > 0) || !isFinite(c.dur) || typeof c.g !== "number" || !isFinite(c.g) || c.g <= 0) badCell++;
      }
    }
    const secs = t.steps * t.stepDur;
    H.assert(t.layers.length > 0 && notes > 0, `${name}: ${t.layers.length} layers, ${notes} notes, ${secs} s`);
    H.eq(tiers, 0, `⛔ ${name}: no layer carries a tier (A6)`);
    H.eq(badMarks, 0, `⛔ ${name}: every audition is absent, "pass" or "fail"`);
    H.eq(badRows, 0, `${name}: every layer's row is the track's length`);
    H.eq(badFreq, 0, `⛔ ${name}: every note frequency is finite and > 0`);
    H.eq(badCell, 0, `${name}: every note's duration and gain are finite and > 0`);
    if (name === "pulse") H.assert(secs >= 90, `⛔ pulse runs >= 90 s before its loop point (${secs} s)`);
  }
}

// ⛔ worst nodes per step, counted (trap 3)
{
  const A = X.AudioSys, M = X.MusicSys, rec = X._audio;
  H.assert(A.unlock(), "fixture: the fake context unlocks");
  for (const name of Object.keys(MUSIC_TRACKS)) {
    const t = MUSIC_TRACKS[name];
    A.ctx.currentTime = 1000;
    M.setState(name);
    H.assert(M.track === t, `MusicSys plays ${name} from MUSIC_TRACKS`);
    M.ensureNoiseBuf();
    let worst = 0, at = -1;
    for (let s = 0; s < t.steps; s++) {
      const before = rec.nodes.length;
      M.scheduleStep(s, 1000 + s * t.stepDur);
      const n = rec.nodes.length - before;
      if (n > worst) { worst = n; at = s; }
    }
    H.assert(worst > 0, `${name}: the count is real (worst step ${at} creates ${worst} nodes)`);
    H.assert(worst <= C.MUSIC_STEP_NODE_MAX,
      `⛔ ${name}: worst nodes per step ${worst} <= C.MUSIC_STEP_NODE_MAX ${C.MUSIC_STEP_NODE_MAX}`);
  }
}

H.report();
