// test-cs001-p1.js — CS001 P1 well geometry test (GDD 3.3, 3.4, 17 item 2).
//
// Asserts only what P1 owns: sixteen wells exist; each rim's vertex count
// agrees with its lane count given its topology (closed loop: lanes verts;
// open strip: lanes+1 verts); exactly the six GDD-named wells carry
// closed: false; no coordinate is NaN or outside the normalized range.
// Global counts (COUNTS.wells, COUNTS.openWells) live in test-registry.js.
"use strict";

const H = require("./_harness.js");
const { installSeed } = require("./_seeded-random.js");
const { COUNTS } = require("./test-registry.js");

installSeed(20260830);

const X = H.buildGame();
const WELLS = X.WELLS;

H.assert(Array.isArray(WELLS), "WELLS is an array");
H.eq(WELLS.length, COUNTS.wells, "sixteen wells exist");

const EXPECTED_OPEN = new Set(["Vee", "Stair", "Trough", "Flat", "Double-Vee", "Fan"]);

let openCount = 0;
for (const w of WELLS) {
  const label = `${w.id} ${w.name}`;

  H.assert(Array.isArray(w.rim) && w.rim.length > 0, `${label}: rim is a non-empty array`);
  H.assert(Number.isInteger(w.lanes) && w.lanes > 0, `${label}: lanes is a positive integer`);

  const expectedVerts = w.closed ? w.lanes : w.lanes + 1;
  H.eq(w.rim.length, expectedVerts, `${label}: rim vertex count matches lane count for its topology`);

  for (const p of w.rim) {
    H.assert(Number.isFinite(p.x) && Number.isFinite(p.y), `${label}: coordinate is finite, not NaN`);
    H.assert(Math.abs(p.x) <= 1.0001 && Math.abs(p.y) <= 1.0001, `${label}: coordinate within normalized range`);
  }

  if (!w.closed) {
    openCount++;
    H.assert(EXPECTED_OPEN.has(w.name), `${label}: open well is one of the six GDD-named open wells`);
  } else {
    H.assert(!EXPECTED_OPEN.has(w.name), `${label}: GDD-named open well is not marked closed`);
  }
}

H.eq(openCount, COUNTS.openWells, "exactly six wells carry closed: false");

for (const name of EXPECTED_OPEN) {
  const w = WELLS.find(w => w.name === name);
  H.assert(w && w.closed === false, `${name} is present and open`);
}

H.report();
