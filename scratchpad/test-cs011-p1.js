// test-cs011-p1.js — CS011 P1: the kit inlined at build, the store, the silent
// ANONYMOUS profile (GDD 15.1, 15.2; plan §3). build.js's wrapper keeps each lib/
// file line for line; a first boot stores one selected profile with a v4
// playerId; a reload selects it and creates nothing; blocked storage plays; the
// mint survives a missing randomUUID; nothing enumerates storage; no storage API
// is named outside the three inlined bodies.
//
// ⛔ TRAPS.
//  1. The boot block runs inside buildGame(), so every build here has booted.
//  2. ⚠ kit-profile's select() of the id boot already points at is a no-op, so
//     the stored roster's `lastUsed` stays "" on a first boot (measured). The
//     kit's own boot then selects roster[0], the same profile: "selected" is
//     asserted through current() and the reload, never through that byte.
//  3. The code scan strips comments with a character scanner, never a regex
//     (_harness.js's header); it runs on game code only, never on kit bodies.
"use strict";

const fs = require("fs");
const path = require("path");
const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");

installSeed(20260916);                      // ⛔ above the first buildGame()

const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist", "vector-vortex.html");
const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ROSTER = "coinless.vector-vortex.profiles";

// ---------------------------------------------------------------------------
// 1. build.js is requirable, and its wrapper refuses what it cannot rewrite
// ---------------------------------------------------------------------------

H.buildGame();                               // freshen dist/ before timing it
const distTime = fs.statSync(DIST).mtimeMs;
const B = require("../build.js");
H.eq(fs.statSync(DIST).mtimeMs, distTime, "requiring build.js builds nothing");
H.assert(typeof B.wrapKitModule === "function" && Array.isArray(B.KIT_INLINE), "build.js exports its wrapper and KIT_INLINE");
H.eq(JSON.stringify(B.KIT_INLINE), JSON.stringify(["lib/kit-names/kit-names.js",
  "lib/kit-storage/kit-storage.js", "lib/kit-profile/kit-profile.js"]), "KIT_INLINE lists the three modules, in order");
H.eq(B.KIT_INLINE_AFTER, "20-achievements.js", "the block follows 20-achievements.js");

function refuses(src, want, msg) {
  let err = null;
  try { B.wrapKitModule(src, "lib/kit-x/kit-x.js", ["KitNames"]); } catch (e) { err = e; }
  H.assert(err !== null && err.message.includes(want), `${msg} (got ${err ? err.message : "no throw"})`);
}
refuses("export const VERSION = '1';\n\nexport default function f() {}\n", "lib/kit-x/kit-x.js:3:",
        "⛔ `export default` fails, naming the file and the line");
refuses("export const A = 1;\nexport {\n  A as B\n};\n", "lib/kit-x/kit-x.js:2:", "⛔ a multi-line export fails");
refuses("import * as N from '../kit-names/kit-names.js';\nexport const A = 1;\n", "lib/kit-x/kit-x.js:1:",
        "⛔ a namespace import fails");
refuses("import { A } from '../kit-leaderboard/kit-leaderboard.js';\nexport const B = 1;\n", ":1:",
        "⛔ an import from a module not inlined above it fails");
refuses("export const A = 1;\nconst m = import('./x.js');\n", ":2:", "⛔ a dynamic import fails");

// ---------------------------------------------------------------------------
// 2. ⛔ each inlined body is its lib/ file, only the rewritten lines differing
// ---------------------------------------------------------------------------

const script = H.extractScript(fs.readFileSync(DIST, "utf8"));
const RULE = "// " + "-".repeat(74) + "\n";

// The inlined region for one file: [banner start, end of its "})();" line).
function region(file) {
  const head = script.indexOf(RULE + "// " + file + "\n");
  const ns = B.kitNamespace(file);
  const open = `const ${ns} = (function () {\n`;
  const bodyAt = script.indexOf(open, head);
  const closeAt = script.indexOf("\n})();\n", bodyAt);
  const retAt = script.lastIndexOf("\nreturn { ", closeAt);
  return { head, end: closeAt + "\n})();\n".length, ns,
           body: head < 0 || bodyAt < 0 ? null : script.slice(bodyAt + open.length, retAt) };
}

// Returns the mismatching line numbers; empty means only rewritten lines differ.
function compareBody(libText, body, counts) {
  const a = libText.replace(/\s+$/, "").split("\n"), b = body.split("\n");
  const bad = [];
  if (a.length !== b.length) return ["line count " + a.length + " vs " + b.length];
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue;
    let ok = false, m;
    if ((m = /^export (const|function) /.exec(a[i]))) ok = b[i] === a[i].slice("export ".length);
    else if ((m = /^import \{([^}]*)\} from '[^']+';$/.exec(a[i]))) ok = /^const \{[^}]*\} = Kit[A-Z]\w*;$/.test(b[i]);
    else if (/^export \{[^}]*\} from '[^']+';$/.test(a[i])) ok = b[i].startsWith("// re-exported in the return below");
    if (ok) counts.rewritten++; else bad.push(i + 1);
  }
  return bad;
}

const regions = [];
for (const file of B.KIT_INLINE) {
  const r = region(file);
  regions.push(r);
  H.assert(r.body !== null, `${file} is inlined under its banner`);
  if (r.body === null) continue;
  const lib = fs.readFileSync(path.join(ROOT, file), "utf8");
  const counts = { rewritten: 0 };
  const bad = compareBody(lib, r.body, counts);
  H.eq(bad.join(","), "", `⛔ ${file}: the inlined body is the lib/ file, import and export lines aside`);
  H.assert(counts.rewritten > 0, `${file}: the comparison saw its rewritten lines (${counts.rewritten})`);
  H.eq(script.slice(r.head - 1, r.end), B.wrapKitModule(lib, file, B.KIT_INLINE.slice(0, B.KIT_INLINE.indexOf(file)).map(B.kitNamespace)),
       `${file}: the build's block is the wrapper's output`);

  // MUTATION: one character of the lib/ text changed, on a line no rewrite touches.
  const lines = lib.split("\n");
  const at = lines.findIndex((l, i) => i > lines.length / 2 && /[a-z]/.test(l) && !/^(import|export) /.test(l));
  lines[at] = lines[at].replace(/[a-z]/, c => (c === "a" ? "b" : "a"));
  H.assert(compareBody(lines.join("\n"), r.body, { rewritten: 0 }).length === 1,
           `⛔ mutation: ${file} with one character changed at line ${at + 1} is red`);
}
H.assert(regions.every((r, i) => i === 0 || r.head > regions[i - 1].end), "the three bodies are in KIT_INLINE order");
H.assert(regions[0].head > script.indexOf("// 20-achievements.js\n") && regions[2].end < script.indexOf("// 21-telemetry.js\n"),
         "⛔ the block sits after 20-achievements.js and before 21-telemetry.js");

// ---------------------------------------------------------------------------
// 3. ⛔ no storage API named outside the three inlined bodies
// ---------------------------------------------------------------------------

function stripComments(src) {
  let out = "", i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      out += c; i++;
      while (i < n) {
        if (src[i] === "\\") { out += src.slice(i, i + 2); i += 2; continue; }
        out += src[i];
        if (src[i] === q) { i++; break; }
        i++;
      }
      continue;
    }
    if (c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") i++; continue; }
    if (c === "/" && src[i + 1] === "*") {
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    out += c; i++;
  }
  return out;
}
let outside = "";
let from = 0;
for (const r of regions) { outside += script.slice(from, r.head); from = r.end; }
outside += script.slice(from);
const inside = regions.map(r => script.slice(r.head, r.end)).join("");
H.assert(inside.includes("window.localStorage"), "non-vacuous: the kit bodies do name the storage API");
H.assert(script.includes("function startDepthOptions") && outside.includes("function startDepthOptions"),
         "non-vacuous: the game code is still in the scanned text");
const gameCode = stripComments(outside);
for (const api of ["localStorage", "sessionStorage", "indexedDB"]) {
  H.assert(!gameCode.includes(api), `⛔ the game code outside the inlined kit never names ${api}`);
}

// ---------------------------------------------------------------------------
// the front door, shared by the played runs
// ---------------------------------------------------------------------------

function session(X) {
  const G = X.Game, MS = X.C.FIXED_DT * 1000;
  let clock = 0;
  const halfFrame = () => { clock += MS / 2; G.frame(clock); };
  const liveStep = () => { const want = G.stats.ticks + 1; for (let n = 0; G.stats.ticks < want && n < 8; n++) halfFrame(); };
  const press = k => { G.input.keyDown(k); liveStep(); G.input.keyUp(k); liveStep(); };
  return {
    // title → PLAY → CLASSIC → LEVEL 1, then passive on one life until game over.
    // ⛔ The ArrowRight is CS012 P3's repair (O9): OVERDRIVE is MODE's first row.
    playToGameOver() {
      G.frame(0);
      liveStep(); liveStep();
      press(" "); press("ArrowRight"); press(" "); press(" ");
      const started = X.state.screen === "play";
      X.state.lives = 1;
      for (let n = 0; X.state.screen === "play" && n < 400000; n++) halfFrame();
      return { started, over: X.state.screen === "gameover" };
    },
  };
}

// ---------------------------------------------------------------------------
// 4. the first boot, the legacy mutation, the reload
// ---------------------------------------------------------------------------

const store = new Map();
const X1 = H.buildGame({ store });
H.eq(X1.state.screen, "title", "⛔ a first boot lands on the title");
H.eq(X1.Store.available, true, "the store is available");
H.eq(JSON.stringify([...store.keys()]), JSON.stringify([ROSTER]), "⛔ a first boot stores exactly the profiles key");
const roster1 = store.get(ROSTER);
const env1 = JSON.parse(roster1);
H.eq(env1.v, 1, "the roster is kit-storage's envelope, version 1");
H.eq(env1.d.profiles.length, 1, "⛔ one profile");
const p = env1.d.profiles[0];
H.eq(p.name, "ANONYMOUS", "⛔ named ANONYMOUS");
H.assert(V4.test(p.playerId || ""), `⛔ its playerId is a UUID v4 (got ${p.playerId})`);
const cur1 = X1.Profiles.current();
H.eq(cur1.id, p.id, "⛔ and it is the selected profile");
H.eq(cur1.playerId, p.playerId, "current() reads the stored playerId");
H.eq(X1.Profiles.scope(), X1.Store, "⛔ profile p0's scope is the root store");

// A planted Orbital Overhaul roster is never imported ...
const LEGACY = JSON.stringify({ v: 1, lastUsed: "p0", seq: 1, profiles: [{ id: "p0", name: "GHOST", created: 1 }] });
const planted = new Map([["afd_profiles_v1", LEGACY]]);
const XL = H.buildGame({ store: planted });
H.eq(XL.Profiles.current().name, "ANONYMOUS", "⛔ legacyRosterKey null: a planted afd_profiles_v1 roster is not imported");
H.eq(planted.get("afd_profiles_v1"), LEGACY, "and the planted bytes are untouched");
// ... and MUTATION: '' in its place imports it.
const mutant = new Map([["afd_profiles_v1", LEGACY]]);
const XM = H.buildGame({ store: mutant, mutate: [["legacyRosterKey: null,", "legacyRosterKey: '',"]] });
H.eq(XM.Profiles.current().name, "GHOST", "⛔ mutation: legacyRosterKey '' imports the planted roster (the assertion above is red)");

// The reload.
const X2 = H.buildGame({ store });
H.eq(X2.Profiles.current().id, cur1.id, "⛔ a reload selects the same profile");
H.eq(X2.Profiles.current().playerId, cur1.playerId, "⛔ with the same playerId");
H.eq(X2.Profiles.list().length, 1, "⛔ and creates nothing");
H.eq(store.get(ROSTER), roster1, "the reload writes nothing to the roster");
H.eq(store.size, 1, "and stores no other key");

// ⛔ No enumeration across a boot and a played run.
H.eq(X2._env.storageReads, 0, "fixture: the reload booted without enumerating");
const run2 = session(X2).playToGameOver();
H.assert(run2.started && run2.over, "fixture: the reloaded session played a run to game over");
H.eq(X2._env.storageReads, 0, "⛔ localStorage.length and key(i) are never read across boot and a played run");
void X2._env.win.localStorage.length;
H.eq(X2._env.storageReads, 1, "non-vacuous: the counter counts a length read");

// ---------------------------------------------------------------------------
// 5. blocked storage plays; the mint without randomUUID
// ---------------------------------------------------------------------------

const XB = H.buildGame({ storage: "blocked" });
let threw = false;
try { void XB._env.win.localStorage; } catch (e) { threw = true; }
H.assert(threw, "fixture: the blocked store's getter throws");
H.eq(XB.Store.available, false, "⛔ blocked: Store.available is false");
H.eq(XB.state.screen, "title", "⛔ blocked: boots to the title");
H.eq(XB.Profiles.current().name, "ANONYMOUS", "blocked: the session still has its ANONYMOUS profile");
const runB = session(XB).playToGameOver();
H.assert(runB.started, "⛔ blocked: a run starts from the title");
H.assert(runB.over, "⛔ blocked: and plays to game over");
H.eq(XB._env.store.size, 0, "blocked: nothing reached the store");

let randomValues = 0;
const noUuid = { getRandomValues: a => { randomValues++; return globalThis.crypto.getRandomValues(a); } };
const XC = H.buildGame({ crypto: noUuid });
H.assert(randomValues > 0, "fixture: the minted id came through getRandomValues");
H.assert(V4.test(XC.Profiles.current().playerId || ""), `⛔ with crypto.randomUUID hidden, the minted id is still v4 (got ${XC.Profiles.current().playerId})`);

H.report("test-cs011-p1.js");
