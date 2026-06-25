import { describe, expect, it } from "vitest";
import { hashSeed, int, makeRng, mulberry32, pick, range, shuffle } from "./rng";

describe("hashSeed", () => {
  it("is deterministic for the same string", () => {
    expect(hashSeed("lag-ja-gale|1964")).toBe(hashSeed("lag-ja-gale|1964"));
  });

  it("returns an unsigned 32-bit integer", () => {
    for (const s of ["", "a", "mehbooba-1975", "x".repeat(64)]) {
      const h = hashSeed(s);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(0xffffffff);
    }
  });

  it("distinguishes different strings", () => {
    expect(hashSeed("a")).not.toBe(hashSeed("b"));
    expect(hashSeed("track-1")).not.toBe(hashSeed("track-2"));
  });
});

describe("mulberry32 / makeRng", () => {
  it("produces a deterministic sequence for a seed", () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    const seqA = [a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it("stays within [0, 1)", () => {
    const r = makeRng("seed");
    for (let i = 0; i < 500; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("differs across seeds", () => {
    expect(makeRng("one")()).not.toBe(makeRng("two")());
  });
});

describe("range / int", () => {
  it("range stays within [lo, hi)", () => {
    const r = makeRng("range");
    for (let i = 0; i < 500; i++) {
      const v = range(r, 5, 9);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThan(9);
    }
  });

  it("int stays within [lo, hi] inclusive and hits both ends", () => {
    const r = makeRng("int");
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const v = int(r, 1, 4);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(4);
      expect(Number.isInteger(v)).toBe(true);
      seen.add(v);
    }
    expect(seen).toEqual(new Set([1, 2, 3, 4]));
  });
});

describe("pick / shuffle", () => {
  it("pick returns a member of the array", () => {
    const r = makeRng("pick");
    const arr = ["a", "b", "c"] as const;
    for (let i = 0; i < 50; i++) expect(arr).toContain(pick(r, arr));
  });

  it("shuffle is a permutation and leaves the input untouched", () => {
    const r = makeRng("shuffle");
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(r, input);
    expect(out).not.toBe(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect([...out].sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5]);
  });

  it("shuffle is deterministic for the same seed", () => {
    const a = shuffle(makeRng("k"), [1, 2, 3, 4, 5, 6]);
    const b = shuffle(makeRng("k"), [1, 2, 3, 4, 5, 6]);
    expect(a).toEqual(b);
  });
});
