/*
 * MEHFIL — tiny deterministic PRNG for generative record art (Phase 9).
 *
 * Pure + dependency-free: a stable string seed (a record's id/film/year) hashes
 * (xmur3) to a 32-bit value that seeds mulberry32, so the SAME record always
 * renders the SAME sleeve and different records visibly differ. No global state,
 * no Math.random — every draw is reproducible across server and client renders.
 */

export type Rng = () => number;

/** xmur3 string hash → unsigned 32-bit seed. */
export function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

/** mulberry32 — a fast, well-distributed 32-bit PRNG returning [0, 1). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build a seeded stream from a stable key string. */
export function makeRng(seedKey: string): Rng {
  return mulberry32(hashSeed(seedKey));
}

/** Float in [lo, hi). */
export function range(rng: Rng, lo: number, hi: number): number {
  return lo + (hi - lo) * rng();
}

/** Integer in [lo, hi] (inclusive both ends). */
export function int(rng: Rng, lo: number, hi: number): number {
  return Math.floor(range(rng, lo, hi + 1));
}

/** Pick one element (non-empty array assumed). */
export function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

/** Fisher–Yates shuffle returning a NEW array (input untouched). */
export function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}
