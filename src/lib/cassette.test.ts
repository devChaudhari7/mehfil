import { describe, expect, it } from "vitest";
import { tapePackRadius, windFractions } from "./cassette";

describe("windFractions", () => {
  it("empties the supply as the take-up fills", () => {
    expect(windFractions(0)).toEqual({ supply: 1, takeup: 0 });
    expect(windFractions(1)).toEqual({ supply: 0, takeup: 1 });
    expect(windFractions(0.25)).toEqual({ supply: 0.75, takeup: 0.25 });
  });

  it("clamps out-of-range progress", () => {
    expect(windFractions(-0.5)).toEqual({ supply: 1, takeup: 0 });
    expect(windFractions(2)).toEqual({ supply: 0, takeup: 1 });
  });
});

describe("tapePackRadius", () => {
  it("is the hub radius when empty and the max when full", () => {
    expect(tapePackRadius(0, 4, 11)).toBeCloseTo(4);
    expect(tapePackRadius(1, 4, 11)).toBeCloseTo(11);
  });

  it("is area-proportional (sqrt), so half-wound sits above the midpoint radius", () => {
    const r = tapePackRadius(0.5, 4, 11);
    expect(r).toBeCloseTo(Math.sqrt((16 + 121) / 2)); // sqrt(mean of squares)
    expect(r).toBeGreaterThan((4 + 11) / 2); // above the linear midpoint
  });

  it("grows monotonically with fraction and clamps", () => {
    const a = tapePackRadius(0.2, 4, 11);
    const b = tapePackRadius(0.8, 4, 11);
    expect(b).toBeGreaterThan(a);
    expect(tapePackRadius(-1, 4, 11)).toBeCloseTo(4);
    expect(tapePackRadius(5, 4, 11)).toBeCloseTo(11);
  });
});
