// scratchpad/run-all.js — runs every scratchpad/test-*.js in its own process.
//
//   node scratchpad/run-all.js [--only <substring>]
//
// ⛔ Failure-only output by default: a fully green run prints one summary line.
// A wrapper script, not an output-filtering hook — simpler and more reliable.
//
// Buckets, mutually exclusive:
//   TIMEOUT - killed after TIMEOUT_MS. err.signal is the tell: a normal failure
//             exits via process.exit(1) (status set, signal null).
//   FAILED  - nonzero exit, not a timeout.
//   SKIPPED - exit 0 but stdout contains SKIP_TAG. A loud non-answer, not a
//             pass. Only a changeset's closing phase asserts the count is zero.
//   PASSED  - exit 0, no SKIP_TAG.
//
// Exits nonzero iff anything FAILED or TIMEOUT.
"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const TIMEOUT_MS = 120000;
const MAX_BUFFER = 64 * 1024 * 1024;
const SKIP_TAG = "SKIPPED (no git history)";
const TAIL_LINES = 20;

const dir = __dirname;
const root = path.join(dir, "..");

let only = null;
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === "--only") only = process.argv[++i];
  else { console.error(`Unknown argument: ${process.argv[i]}`); process.exit(2); }
}

let files = fs.readdirSync(dir)
  .filter(f => /^test-.*\.js$/.test(f) && !f.startsWith("_"))
  .sort();
if (only) files = files.filter(f => f.includes(only));

if (!files.length) { console.error("no test files matched"); process.exit(2); }

const results = [];
for (const f of files) {
  const t0 = Date.now();
  let status = "PASSED", out = "";
  try {
    out = execFileSync(process.execPath, [path.join(dir, f)],
      { cwd: root, timeout: TIMEOUT_MS, maxBuffer: MAX_BUFFER, encoding: "utf8", stdio: "pipe" });
    if (out.includes(SKIP_TAG)) status = "SKIPPED";
  } catch (err) {
    out = (err.stdout || "") + (err.stderr || "");
    status = err.signal ? "TIMEOUT" : "FAILED";
  }
  results.push({ f, status, ms: Date.now() - t0, out });
}

const bad = results.filter(r => r.status === "FAILED" || r.status === "TIMEOUT");
const skipped = results.filter(r => r.status === "SKIPPED");

for (const r of bad) {
  console.error(`\n${r.status}  ${r.f}  (${r.ms}ms)`);
  const lines = r.out.trimEnd().split("\n");
  for (const l of lines.slice(-TAIL_LINES)) console.error(`    ${l}`);
}
for (const r of skipped) console.error(`SKIPPED  ${r.f}`);

const n = results.length;
if (bad.length === 0) {
  console.log(`ok  ${n} test files passed${skipped.length ? `, ${skipped.length} skipped` : ""}`);
  process.exit(0);
}
console.error(`\nFAIL  ${bad.length}/${n} test files`);
process.exit(1);
