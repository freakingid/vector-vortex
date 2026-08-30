// scratchpad/_seeded-random.js — mulberry32, installed over Math.random.
//
// ⛔ installSeed() must run ABOVE everything, before the first build() call.
// Some nondeterminism is spent at module-evaluation time, so a seed installed
// after the game script is evaluated fixes nothing.
"use strict";

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function installSeed(n) {
  Math.random = mulberry32(n >>> 0);
}

module.exports = { mulberry32, installSeed };
