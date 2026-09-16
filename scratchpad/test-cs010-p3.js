// test-cs010-p3.js — CS010 P3: the earned layers, Paul's gains, and music-lab's
// INTENSITY and TIER (GDD 11.3, 11.5, 11.7; plan §5). Asserts what P3 owns:
// ⛔ the articulation gate (struck, never swelled) on every layer of every
// MUSIC_TRACKS entry, with its mutations; ⛔ COPY TABLE's tempo and tier
// rewrites, run from the lab's own rewriteBlockB and labEdits; a tier only on
// PASS, `melody` and `title` untiered, and the tiers reaching the game's gates;
// the lab's TIER and INTENSITY controls, and its preview copies of `C`.
//
// ⛔ TRAPS.
//  1. Decay start is computed as playNote shapes a note, at the track's OWN
//     stepDur: max(min(atk, dur/2), dur − min(rel, dur)). An absent `atk` or
//     `rel` is the engine's default (0.4 / 0.5), never 0.
//  2. GATE is read from each builder's `const GATE = {…}` TEXT in the built
//     file, through MUSIC_TRACKS' own `name: builder()` lines.
//  3. The lab's code is cut at the first column-0 `}` (test-cs009-p2.js trap 2).
"use strict";

const fs = require("fs");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

installSeed(20261003);
const ROOT = path.join(__dirname, "..");
const X = H.buildGame({ audio: true });
const { C, MUSIC_TRACKS } = X;
const script = H.extractScript(fs.readFileSync(path.join(ROOT, "dist", "vector-vortex.html"), "utf8"));
const lab = fs.readFileSync(path.join(ROOT, "tools", "music-lab.html"), "utf8");
const sfxLab = fs.readFileSync(path.join(ROOT, "tools", "sfx-lab.html"), "utf8");
const trimEnd = s => s.replace(/\s+$/, "");
const ATK_MAX = 0.005, DECAY_BY = 0.05;     // GDD 11.3, SETTLED (Paul, 2026-09-16)

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
function labBlockB() {
  const b = lab.indexOf("// ===== BLOCK B BEGIN");
  return trimEnd(lab.slice(lab.indexOf("\n", b) + 1, lab.indexOf("// ===== BLOCK B END")));
}
const load = text => new Function(text + "\n;return MUSIC_TRACKS;")();
const linesChanged = (a, b) => {
  const la = a.split("\n"), lb = b.split("\n");
  return la.length !== lb.length ? -1 : la.filter((l, i) => l !== lb[i]).length;
};

// ===========================================================================
// ⛔ THE ARTICULATION GATE
// ===========================================================================
const kit = builtModule("17-audio-tracks.js") || "";
const registry = kit.slice(kit.indexOf("const MUSIC_TRACKS = {"));
const builderOf = {};
for (const m of registry.matchAll(/^\s*(\w+):\s*(\w+)\(\),/gm)) builderOf[m[1]] = m[2];
function gateTable(builder) {
  const body = fnText(kit, builder) || "";
  const m = body.match(/const GATE = \{([^}]*)\}/);
  if (!m) return null;
  const out = {};
  for (const kv of m[1].matchAll(/(\w+):\s*(\d+)/g)) out[kv[1]] = +kv[2];
  return out;
}

// One layer, as playNote shapes its notes (trap 1).
function articulation(track, layer, gate) {
  const atk = layer.atk == null ? 0.4 : layer.atk, rel = layer.rel == null ? 0.5 : layer.rel;
  let decayBy = 0, longest = 0;
  for (const c of layer.steps) {
    if (!c) continue;
    const dur = c.dur * track.stepDur;
    decayBy = Math.max(decayBy, Math.max(Math.min(atk, dur / 2), dur - Math.min(rel, dur)));
    longest = Math.max(longest, c.dur);
  }
  return {
    atk: atk <= ATK_MAX, decay: decayBy <= DECAY_BY + 1e-12, gate: typeof gate === "number" && longest <= gate,
    sweep: !(layer.cutoff && layer.cutoffTo) || layer.cutoffTo < layer.cutoff,
    decayBy, longest,
  };
}

{
  const names = Object.keys(MUSIC_TRACKS);
  H.assert(names.length > 0 && names.every(n => builderOf[n]), `every MUSIC_TRACKS entry names its builder (${names.join(", ")})`);
  let layers = 0, sweeps = 0;
  for (const name of names) {
    const t = MUSIC_TRACKS[name], gates = gateTable(builderOf[name]);
    H.assert(gates !== null, `${name}: ${builderOf[name]} has a const GATE table`);
    for (const L of t.layers) {
      layers++;
      const a = articulation(t, L, gates && gates[L.name]);
      const at = `${name}.${L.name}`;
      H.assert(a.atk, `⛔ ${at}: atk ${L.atk} <= ${ATK_MAX} s`);
      H.assert(a.decay, `⛔ ${at}: decay starts by ${a.decayBy.toFixed(4)} s <= ${DECAY_BY} s, at ${t.stepDur} s a step`);
      H.assert(a.gate, `⛔ ${at}: the longest note, ${a.longest} steps, <= GATE ${gates && gates[L.name]}`);
      H.assert(a.sweep, `⛔ ${at}: a sweep closes (cutoffTo ${L.cutoffTo} < cutoff ${L.cutoff})`);
      if (L.cutoff && L.cutoffTo) sweeps++;
      // ⛔ The gate is not vacuous: each mutation of this layer is red.
      H.assert(!articulation(t, Object.assign({}, L, { atk: 0.02 }), gates[L.name]).atk, `mutation: ${at} with atk 0.02 is red`);
      H.assert(!articulation(t, Object.assign({}, L, { rel: 0.001 }), gates[L.name]).decay || a.longest * t.stepDur <= DECAY_BY,
               `mutation: ${at} holding its notes is red`);
      H.assert(!articulation(t, L, a.longest - 1).gate, `mutation: ${at} with GATE one step short is red`);
      if (L.cutoff && L.cutoffTo) {
        H.assert(!articulation(t, Object.assign({}, L, { cutoff: L.cutoffTo, cutoffTo: L.cutoff }), gates[L.name]).sweep,
                 `mutation: ${at}'s sweep, opened, is red`);
      }
    }
  }
  H.assert(layers >= 10 && sweeps >= 3, `fixture: the gate read ${layers} layers and ${sweeps} sweeps`);
}

// ===========================================================================
// the tiers: PASS only, melody and title untiered, and live in the game
// ===========================================================================
{
  const pulse = MUSIC_TRACKS.pulse, title = MUSIC_TRACKS.title;
  let tiered = 0;
  for (const name of Object.keys(MUSIC_TRACKS)) {
    const t = MUSIC_TRACKS[name];
    H.assert(Number.isInteger(t.bar) && t.steps % t.bar === 0, `${name} carries its bar (${t.bar} steps), dividing its steps`);
    for (const L of t.layers) {
      if (L.tier === undefined) continue;
      tiered++;
      H.eq(L.audition, "pass", `⛔ ${name}.${L.name} is tiered (${L.tier}) and marked PASS`);
    }
  }
  H.eq(title.bar, 16, "title's bar is 16 steps");
  H.eq(pulse.bar, 16, "pulse's bar is 16 steps");
  const melody = pulse.layers.find(L => L.name === "melody");
  H.assert(melody && melody.tier === undefined, "⛔ pulse's melody is untiered: the tune is foundation");
  H.eq(title.layers.filter(L => L.tier !== undefined).length, 0, "⛔ title carries no tier (D1)");
  H.assert(tiered > 0, `fixture: pulse carries earned layers (${tiered})`);

  // ⛔ The tiers reach the game's gates: foundation only at 0, every layer at 1.
  const A = X.AudioSys, M = X.MusicSys;
  H.assert(A.unlock(), "fixture: the fake context unlocks");
  for (const f of [0, 1]) {
    M.setState(X.MUSIC_SILENCE);
    M.setIntensity(f);
    M.setState("pulse");
    const got = M.layerGates.map(g => g.target).join("");
    const want = pulse.layers.map(L => (f === 1 || L.tier === undefined ? 1 : 0)).join("");
    H.eq(got, want, `⛔ pulse's gates at intensity ${f}: ${want} (tiered layers ${f ? "open" : "closed"})`);
  }
  M.setState(X.MUSIC_SILENCE);
  M.setIntensity(0);
  M.setState("title");
  H.assert(M.layerGates.every(g => g.target === 1), "title's gates are all open at intensity 0");
  M.setState(X.MUSIC_SILENCE);
}

// ===========================================================================
// ⛔ COPY TABLE: the tempo rewrite and the tier rewrite, from the lab's own code
// ===========================================================================
const P = "buildPulseTrack", T = "buildTitleTrack";
const rewriteSrc = fnText(lab, "rewriteBlockB");
H.assert(rewriteSrc !== null, "the lab has rewriteBlockB()");
const rewrite = new Function(rewriteSrc + "\nreturn rewriteBlockB;")();
const blockB = labBlockB();
const base = load(blockB);
H.eq(blockB, trimEnd(kit), "fixture: the lab's BLOCK B is the built 17-audio-tracks.js");

{
  const stepText = b => (fnText(blockB, b) || "").match(/stepDur: ([^,]+),/)[1];
  const fast = rewrite(blockB, [{ builder: P, stepDur: "60 / 132 / 4" }, { builder: T, stepDur: "60 / 96 / 4" }]);
  H.eq(linesChanged(blockB, fast), 2, "⛔ tempo: a rewrite of both tracks changes exactly two lines");
  const t = load(fast);
  H.eq(t.pulse.stepDur, 60 / 132 / 4, "tempo: pulse evaluates at 132 BPM");
  H.eq(t.title.stepDur, 60 / 96 / 4, "tempo: title evaluates at 96 BPM");
  H.eq(JSON.stringify(t.pulse.layers), JSON.stringify(base.pulse.layers), "tempo: no layer or note moves");
  const back = rewrite(fast, [{ builder: P, stepDur: stepText(P) }, { builder: T, stepDur: stepText(T) }]);
  H.eq(back, blockB, "⛔ tempo: a second rewrite restores BLOCK B exactly");
  let threw = false;
  try { rewrite(blockB, [{ builder: P }]); } catch (err) { threw = /no layer and no tempo/.test(err.message); }
  H.assert(threw, "⛔ tempo: an edit with no name and no tempo throws");
}

{
  const layerLine = (text, builder, name) => {
    const at = text.indexOf("function " + builder + "("), ls = text.indexOf(`{ name: "${name}",`, at);
    return text.slice(ls, text.indexOf("\n", ls));
  };
  const all = [];
  for (const [key, b] of [["title", T], ["pulse", P]]) base[key].layers.forEach(L => all.push({ key, b, L }));
  const baseTiered = all.filter(x => x.L.tier !== undefined);

  const bare = rewrite(blockB, all.map(x => ({ builder: x.b, name: x.L.name, tier: null })));
  H.eq(linesChanged(blockB, bare), baseTiered.length, "⛔ tier: removing every tier changes one line per tiered layer");
  H.assert(!/ tier: /.test(bare), "tier: — removes the field");

  const TIERS = [2, 3, 4];
  const tierFor = (x, i) => TIERS[i % 3];
  const edits = all.map((x, i) => ({ builder: x.b, name: x.L.name, tier: tierFor(x, i) }));
  const full = rewrite(bare, edits);
  H.eq(linesChanged(bare, full), all.length, "⛔ tier: one line changes per tiered layer");
  const f = load(full);
  let right = 0, same = 0, beside = 0;
  all.forEach((x, i) => {
    const L = f[x.key].layers.find(l => l.name === x.L.name);
    if (L.tier === tierFor(x, i)) right++;
    const rest = Object.keys(x.L).filter(k => k !== "tier");
    if (rest.every(k => JSON.stringify(L[k]) === JSON.stringify(x.L[k])) && Object.keys(L).length === rest.length + 1) same++;
    if (layerLine(full, x.b, x.L.name).includes(` tier: ${tierFor(x, i)}, audition: `)) beside++;
  });
  H.eq(right, all.length, "⛔ tier: COPY TABLE writes every layer's tier");
  H.eq(same, all.length, "tier: no other field and no note changes");
  H.eq(beside, all.length, "tier: written beside the audition mark");

  const re = rewrite(full, edits.map(e => Object.assign({}, e, { tier: 2 })));
  H.eq((re.match(/ tier: /g) || []).length, all.length, "tier: a second tier replaces the first, never a second field");
  H.assert(load(re).pulse.layers.every(L => L.tier === 2), "tier: and it reads back");
  const x0 = all.find(x => x.key === "pulse");
  const remark = rewrite(full, [{ builder: x0.b, name: x0.L.name, audition: "fail" }]);
  H.eq(load(remark).pulse.layers.find(L => L.name === x0.L.name).tier, tierFor(x0, all.indexOf(x0)),
       "tier: a later audition edit keeps the tier");
  const noMark = rewrite(bare, [{ builder: x0.b, name: x0.L.name, audition: null, tier: 3 }]);
  H.assert(layerLine(noMark, x0.b, x0.L.name).includes(" tier: 3, steps: "), "tier: a line with no mark takes it before steps");
  const restored = rewrite(bare, baseTiered.map(x => ({ builder: x.b, name: x.L.name, tier: x.L.tier })));
  H.eq(restored, blockB, "⛔ tier: re-applying the shipped tiers restores BLOCK B exactly");
  let threw = false;
  try { rewrite(blockB, [{ builder: P, name: "nosuchlayer", tier: 2 }]); } catch (err) { threw = true; }
  H.assert(threw, "tier: an edit naming no layer throws");

  // ⛔ labEdits() — the lab's own diff since load — carries tier, and a — clears it.
  const ui = lab.slice(lab.indexOf("// ===== LAB UI"));
  const setup = ui.slice(ui.indexOf("const LAB_TRACKS = {"), ui.indexOf("// ⛔ TEMPO, IN METRONOME STEPS"));
  const labEditsSrc = fnText(ui, "labEdits"), bpmSrc = fnText(ui, "bpmOf");
  H.assert(setup.includes("const ORIGINAL") && labEditsSrc && bpmSrc, "fixture: the lab's LAB_TRACKS, ORIGINAL, labEdits and bpmOf");
  const tracks = load(blockB);
  const labEdits = new Function("MUSIC_TRACKS", "const STEPS_PER_BEAT = 4;\n" + setup + bpmSrc + labEditsSrc + "\nreturn labEdits;")(tracks);
  H.eq(labEdits().length, 0, "labEdits: nothing changed, no edits");
  const plain = tracks.pulse.layers.find(L => L.tier === undefined && L.name !== "melody");
  const tieredL = tracks.pulse.layers.find(L => L.tier !== undefined);
  plain.tier = 4;
  delete tieredL.tier;
  const le = labEdits();
  H.eq(JSON.stringify(le.map(e => [e.name, e.tier])), JSON.stringify(tracks.pulse.layers.filter(L => L === plain || L === tieredL)
       .map(L => [L.name, L === plain ? 4 : null])), "⛔ labEdits: a new tier is written, a removed one is null");
  const printed = load(rewrite(blockB, le));
  H.eq(printed.pulse.layers.find(L => L.name === plain.name).tier, 4, "⛔ COPY TABLE's printed table carries the new tier");
  H.eq(printed.pulse.layers.find(L => L.name === tieredL.name).tier, undefined, "⛔ and drops the removed one");
}

// ===========================================================================
// the lab's controls: TIER only on PASS, INTENSITY through BLOCK A's setters
// ===========================================================================
{
  const ui = lab.slice(lab.indexOf("// ===== LAB UI"));
  const render = fnText(ui, "renderLayers") || "";
  const row = render.slice(render.indexOf("layers.forEach("), render.indexOf("tb.appendChild(tr)"));
  H.assert(/\[null, 2, 3, 4\]\.map\(/.test(row) && row.includes('class="tier" data-i="${i}"'), "⛔ every row has TIER —, 2, 3, 4");
  H.assert(/\$\{pass \? "" : " disabled"\}/.test(row) && /const pass = L\.audition === "pass"/.test(row),
           "⛔ TIER is disabled unless the layer is PASS");
  H.assert(/if \(L\.audition !== "pass" && L\.tier !== undefined\) setTier\(\+b\.dataset\.i, null\)/.test(render),
           "⛔ a layer that leaves PASS loses its tier");

  const setTierSrc = fnText(ui, "setTier");
  H.assert(setTierSrc !== null, "the lab has setTier()");
  const tracks = load(blockB);
  const calls = [];
  const music = { track: null, layerGates: null, intensity: 0.3, setIntensity(v) { calls.push(v); } };
  const setTier = new Function("MUSIC_TRACKS", "current", "music", setTierSrc + "\nreturn setTier;")(tracks, "pulse", music);
  const layers = tracks.pulse.layers;
  const i = layers.findIndex(L => L.tier === undefined && L.name !== "melody");
  layers[i].audition = "fail";
  setTier(i, 3);
  H.eq(layers[i].tier, undefined, "⛔ setTier refuses a layer that is not PASS");
  layers[i].audition = "pass";
  music.track = tracks.pulse;
  music.layerGates = layers.map(L => ({ tier: L.tier || 1 }));
  setTier(i, 3);
  H.eq(layers[i].tier, 3, "setTier writes the layer's tier on a PASS layer");
  H.eq(music.layerGates[i].tier, 3, "and its live gate's tier");
  H.eq(JSON.stringify(calls), "[0.3]", "and re-asks BLOCK A's setter at the held level, which latches to the bar line");
  setTier(i, null);
  H.assert(!("tier" in layers[i]) && music.layerGates[i].tier === 1, "— removes the tier, and the gate is foundation");

  H.assert(/<input type="range" id="intensity" min="0" max="1"[^>]*value="1">/.test(lab), "⛔ an INTENSITY slider, 0..1, starting at 1");
  const setLab = fnText(ui, "setLabIntensity");
  H.assert(setLab !== null, "the lab has setLabIntensity()");
  const seen = [];
  const out = { textContent: "" };
  new Function("music", "$", setLab + "\nreturn setLabIntensity;")(
    { setIntensity: v => seen.push(["intensity", v]), setSweep: v => seen.push(["sweep", v]) }, () => out)(0.42);
  H.eq(JSON.stringify(seen), JSON.stringify([["intensity", 0.42], ["sweep", 0.42]]), "⛔ INTENSITY calls BLOCK A's setIntensity and setSweep");
  H.assert(/\$\("intensity"\)\.oninput = e => setLabIntensity\(/.test(ui), "the slider drives it");
  H.assert(fnText(ui, "tierReadout") && /music\.nextBar\(now\)/.test(fnText(ui, "tierReadout")) && /latched tier/.test(fnText(ui, "tierReadout")),
           "the readout gives the latched tier and the bars to the next line, off BLOCK A's grid");

  // ⛔ The lab plays what ships: its preview copies of C, and the groups it passes.
  const labObj = src => new Function(src.slice(src.indexOf("const LAB = {"), src.indexOf("};", src.indexOf("const LAB = {")) + 2) + "\nreturn LAB;")();
  const L = labObj(ui), S = labObj(sfxLab.slice(sfxLab.indexOf("// ===== LAB UI")));
  const js = JSON.stringify;
  H.eq(js(L.limit), js(C.MUSIC_LIMIT), "music-lab's limiter is C.MUSIC_LIMIT");
  H.eq(js(L.gating), js({ thresholds: C.LAYER_THRESHOLD, ramp: C.LAYER_CROSSFADE }), "⛔ music-lab's gates are C.LAYER_THRESHOLD and C.LAYER_CROSSFADE");
  H.eq(js(L.sweep), js({ minHz: C.FILTER_MIN_HZ, maxHz: C.FILTER_MAX_HZ, q: C.FILTER_Q, tc: C.FILTER_TC }), "⛔ music-lab's sweep is C's");
  H.assert(/gating: LAB\.gating,/.test(ui) && /sweep: LAB\.sweep,/.test(ui) && /limiter: LAB\.limit,/.test(ui),
           "music-lab's createMusic passes the limiter, the gates and the sweep");
  H.eq(js(S.gating), js({ thresholds: C.LAYER_THRESHOLD, ramp: C.LAYER_CROSSFADE }), "sfx-lab's gates are C's (pulse is tiered)");
  H.assert(/music\.setIntensity\(1\);/.test(sfxLab), "sfx-lab plays pulse in context with every tier open");
}

H.report("test-cs010-p3.js");
