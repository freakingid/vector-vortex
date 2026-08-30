// 01-rng.js — the seeded random source (GDD 16.1, 17.1).
//
// ⛔ ONE SOURCE OF RANDOMNESS, AND IT IS SEEDED. Nothing in src/ may call the
// platform's built-in generator — not the spawner, not a particle, not an audio
// variation. GDD 17.1's determinism guarantee (same seed + same recorded input
// -> identical state after 10,000 ticks) is only worth something if there is no
// second, unseeded stream anywhere in the build.
//
// ⚠ The suite scans the BUILT file for the platform generator's identifier, so
// that identifier is deliberately not written anywhere in src/ — not even
// inside a comment saying not to use it, which is exactly the false positive
// that would train a future session to weaken the scan.
//
// mulberry32 is the same 32-bit generator scratchpad/_seeded-random.js installs
// over the platform one for tests. It is small, fast, has a period of 2^32, and
// passes gjrand's smallcrush — far past what a tube shooter needs, and short
// enough that the whole stream is auditable.
//
// A STREAM IS STATE. Each call mutates the closed-over counter, so two systems
// sharing one stream interleave their draws: adding a draw to the spawner
// shifts every subsequent draw everywhere. That is fine and intended — the run
// has ONE stream (state.rng, created from state.seed) for the same reason it
// has one clock. If a system ever needs draws that must NOT move when another
// system changes, it takes its own stream from its own seed; it does not get a
// private call into the platform generator.

// The generator. `seed` is coerced to uint32, so any integer (or a Date.now())
// is a legal seed and the same number always produces the same stream.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// An integer in [0, n). The ONE route from a 0..1 draw to an index, so no call
// site re-derives it and gets the half-open interval wrong.
//
// The final guard cannot fire with mulberry32 — its largest output is
// (2^32-1)/2^32, so floor(r * n) is at most n-1 — but `rng` is a parameter and
// a future stream that can return exactly 1 would otherwise hand back n, which
// reads as an out-of-range array index a long way from here.
function rngInt(rng, n) {
  if (!(n > 0)) return 0;
  const i = Math.floor(rng() * n);
  return i >= n ? n - 1 : (i < 0 ? 0 : i);
}

// One element of `arr`, uniformly. Returns undefined for an empty array rather
// than drawing — a draw spent on an impossible pick would desynchronize the
// stream between a run that hit the empty case and one that did not.
function rngPick(rng, arr) {
  if (!arr || !arr.length) return undefined;
  return arr[rngInt(rng, arr.length)];
}
