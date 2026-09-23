#!/usr/bin/env node
// build.js — concatenates src/ into the single-file deliverable dist/vector-vortex.html.
//
//   node build.js            build once
//   node build.js --watch    rebuild on any src/ change
//
// The concatenated single-file build is the BEHAVIOUR ORACLE (GDD 16.2). Tests
// load dist/, never src/, so what is tested is exactly what ships.
//
// Concat order is the explicit MANIFEST below, not a directory sort. A numeric
// prefix that sorts correctly today can sort wrongly the moment a file is
// renamed, and a silent reorder of the config block relative to its readers is
// a class of bug that costs an afternoon. The manifest is checked BOTH ways
// against the directory: a file present but unlisted is an error, and a file
// listed but absent is an error.
//
// ⛔ THE VENDORED KIT IS INLINED HERE (CS011 P1, plan M1/R2). kit-names,
// kit-storage and kit-profile are read from lib/ UNEDITED and each wrapped into
// one namespace, `const KitStorage = (function () { … return { … }; })();`, so a
// double-clicked build has storage AND the module that uses it (an import fails
// on file://). Only three line forms are rewritten, one line for one line:
//   export const|function NAME        -> const|function NAME, plus a return entry
//   export { A, B } from '../x/x.js';  -> a comment; A and B read off KitX
//   import { A, B } from '../x/x.js';  -> const { A, B } = KitX;
// ⛔ ANY OTHER import OR export FORM FAILS THE BUILD, naming the file and line,
// so a kit update can never be half-wrapped silently. kit-leaderboard is NOT
// here: it stays on shell.html's module bridge (EXTERNAL-FILES.md).
//
// ⛔ The block sits after 20-achievements.js and BEFORE 21-telemetry.js — never
// between 21-telemetry.js and 22-meta.js (test-cs007-p4.js slices that span and
// bans the storage API's name in it). Its banner is a rule of dashes, not the
// module banner's equals signs, so the closed banner scans see src/ modules only.
// Requiring this file builds nothing; running it does.

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SRC = path.join(ROOT, "src");
const OUT = path.join(ROOT, "dist", "vector-vortex.html");
const SHELL = path.join(SRC, "shell.html");
const MARKER = "<!--BUILD:SCRIPT-->";

// The concat order. Config first, main last; everything else in dependency order.
const MANIFEST = [
  "00-config.js",
  "01-rng.js",
  "02-state.js",
  "03-wells.js",
  "04-input.js",
  "05-skimmer.js",
  "06-shots.js",
  "07-enemies.js",
  "07-enemies-overdrive.js",
  "08-spawner.js",
  "09-collision.js",
  "10-powerups.js",
  "11-dive.js",
  "12-scoring.js",
  "13-render-well.js",
  "14-render-entities.js",
  "15-render-hud.js",
  "16-audio-engine.js",
  "17-audio-tracks.js",
  "18-audio-director.js",
  "19-sfx.js",
  "20-achievements.js",
  "21-telemetry.js",
  "22-meta.js",
  "22-onboarding.js",
  "23-main.js",
];

// The vendored kit, inlined in this order after KIT_INLINE_AFTER. A file may
// import only from a file listed above it.
const KIT_INLINE = [
  "lib/kit-names/kit-names.js",
  "lib/kit-storage/kit-storage.js",
  "lib/kit-profile/kit-profile.js",
];
const KIT_INLINE_AFTER = "20-achievements.js";

// "lib/kit-storage/kit-storage.js" -> "KitStorage"
function kitNamespace(file) {
  return path.basename(file, ".js").split("-")
    .map(w => w[0].toUpperCase() + w.slice(1)).join("");
}

// Wraps one kit module's source. Throws (never exits) so a test can feed it a
// form it must refuse. `known` is the namespaces already inlined above it.
function wrapKitModule(source, file, known = []) {
  const ns = kitNamespace(file);
  const lines = source.replace(/\s+$/, "").split("\n");
  const exported = [];
  const fail = (i, why) => {
    throw new Error(`${file}:${i + 1}: ${why}: ${lines[i].trim()}`);
  };
  const fromNs = (i, spec) => {
    const target = kitNamespace(spec);
    if (!/^\.\.\/kit-[a-z-]+\/kit-[a-z-]+\.js$/.test(spec) || !known.includes(target)) {
      fail(i, `imports '${spec}', which is not a kit module inlined above it`);
    }
    return target;
  };
  const names = (i, list) => {
    const out = list.split(",").map(n => n.trim()).filter(Boolean);
    if (!out.length || out.some(n => !/^[A-Za-z_$][\w$]*$/.test(n))) fail(i, "unsupported name list");
    return out;
  };
  const body = lines.map((line, i) => {
    let m;
    if ((m = /^export (const|function) ([A-Za-z_$][\w$]*)\b/.exec(line))) {
      exported.push(m[2]);
      return line.slice("export ".length);
    }
    if ((m = /^export \{([^}]*)\} from '([^']+)';$/.exec(line))) {
      const target = fromNs(i, m[2]);
      const list = names(i, m[1]);
      for (const n of list) exported.push(`${n}: ${target}.${n}`);
      return `// re-exported in the return below, off ${target}: ${list.join(", ")}`;
    }
    if ((m = /^import \{([^}]*)\} from '([^']+)';$/.exec(line))) {
      const target = fromNs(i, m[2]);
      return `const { ${names(i, m[1]).join(", ")} } = ${target};`;
    }
    if (/^\s*(import|export)\b/.test(line)) fail(i, "an import/export form build.js does not rewrite");
    if (!/^\s*\/\//.test(line) && /\bimport\s*\(|\bimport\.meta\b/.test(line)) {
      fail(i, "an import form build.js does not rewrite");
    }
    return line;
  });
  if (!exported.length) throw new Error(`${file}: exports nothing`);
  const rule = `// ${"-".repeat(74)}`;
  return `\n${rule}\n// ${file}\n${rule}\nconst ${ns} = (function () {\n` +
    `${body.join("\n")}\nreturn { ${exported.join(", ")} };\n})();\n`;
}

function checkKitInline() {
  const missing = KIT_INLINE.filter(f => !fs.existsSync(path.join(ROOT, f)));
  if (!MANIFEST.includes(KIT_INLINE_AFTER)) missing.push(`(KIT_INLINE_AFTER ${KIT_INLINE_AFTER} is not in MANIFEST)`);
  if (missing.length) {
    console.error("BUILD FAILED - KIT_INLINE lists files that are not on disk:\n  " + missing.join(", "));
    process.exit(1);
  }
}

function kitBlock() {
  const known = [];
  return KIT_INLINE.map(f => {
    const out = wrapKitModule(fs.readFileSync(path.join(ROOT, f), "utf8"), f, known);
    known.push(kitNamespace(f));
    return out;
  }).join("");
}

function checkManifest() {
  const onDisk = fs.readdirSync(SRC).filter(f => f.endsWith(".js")).sort();
  const listed = [...MANIFEST].sort();
  const missing = listed.filter(f => !onDisk.includes(f));
  const unlisted = onDisk.filter(f => !listed.includes(f));
  const errs = [];
  if (missing.length) errs.push("  listed in MANIFEST but not on disk: " + missing.join(", "));
  if (unlisted.length) errs.push("  in src/ but not in MANIFEST: " + unlisted.join(", "));
  if (errs.length) {
    console.error("BUILD FAILED - manifest and src/ disagree:\n" + errs.join("\n"));
    process.exit(1);
  }
}

function build() {
  checkManifest();
  checkKitInline();

  let kit;
  try {
    kit = kitBlock();
  } catch (e) {
    console.error("BUILD FAILED - " + e.message);
    process.exit(1);
  }

  const shell = fs.readFileSync(SHELL, "utf8");
  if (!shell.includes(MARKER)) {
    console.error(`BUILD FAILED - ${MARKER} not found in src/shell.html`);
    process.exit(1);
  }

  const parts = MANIFEST.map(f => {
    const body = fs.readFileSync(path.join(SRC, f), "utf8").replace(/\s+$/, "");
    // Banner comments make a stack trace in the built file traceable back to a
    // source module. Cheap, and the alternative is counting lines by hand.
    const banner = `\n// ${"=".repeat(74)}\n// ${f}\n// ${"=".repeat(74)}\n${body}\n`;
    return f === KIT_INLINE_AFTER ? banner + kit : banner;
  });

  const script = `<script>\n"use strict";\n${parts.join("")}\n</script>`;
  const html = shell.replace(MARKER, script);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, html, "utf8");

  const kb = (Buffer.byteLength(html, "utf8") / 1024).toFixed(1);
  console.log(`built dist/vector-vortex.html  (${MANIFEST.length} modules + ${KIT_INLINE.length} kit, ${kb} KB)`);
}

module.exports = { MANIFEST, KIT_INLINE, KIT_INLINE_AFTER, kitNamespace, wrapKitModule, build };

if (require.main !== module) return;

build();

if (process.argv.includes("--watch")) {
  console.log("watching src/ ...");
  let timer = null;
  fs.watch(SRC, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try { build(); } catch (e) { console.error("build error:", e.message); }
    }, 80);
  });
}
