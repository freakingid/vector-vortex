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
  "23-main.js",
];

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

  const shell = fs.readFileSync(SHELL, "utf8");
  if (!shell.includes(MARKER)) {
    console.error(`BUILD FAILED - ${MARKER} not found in src/shell.html`);
    process.exit(1);
  }

  const parts = MANIFEST.map(f => {
    const body = fs.readFileSync(path.join(SRC, f), "utf8").replace(/\s+$/, "");
    // Banner comments make a stack trace in the built file traceable back to a
    // source module. Cheap, and the alternative is counting lines by hand.
    return `\n// ${"=".repeat(74)}\n// ${f}\n// ${"=".repeat(74)}\n${body}\n`;
  });

  const script = `<script>\n"use strict";\n${parts.join("")}\n</script>`;
  const html = shell.replace(MARKER, script);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, html, "utf8");

  const kb = (Buffer.byteLength(html, "utf8") / 1024).toFixed(1);
  console.log(`built dist/vector-vortex.html  (${MANIFEST.length} modules, ${kb} KB)`);
}

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
