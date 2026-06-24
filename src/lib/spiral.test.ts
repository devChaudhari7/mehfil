import { describe, expect, it } from "vitest";
import { clamp01, nodePoints, pointAt } from "./spiral";

const opts = { turns: 4, minR: 10, maxR: 100 };

describe("clamp01", () => {
  it("clamps to [0,1]", () => {
    expect(clamp01(-0.5)).toBe(0);
    expect(clamp01(1.5)).toBe(1);
    expect(clamp01(0.3)).toBeCloseTo(0.3);
  });
});

describe("pointAt", () => {
  it("starts at minR on the +x axis (fraction 0)", () => {
    const p = pointAt(0, opts);
    expect(p.radius).toBeCloseTo(10);
    expect(p.angle).toBeCloseTo(0);
    expect(p.x).toBeCloseTo(10);
    expect(p.y).toBeCloseTo(0);
  });

  it("reaches maxR after `turns` full revolutions (fraction 1)", () => {
    const p = pointAt(1, opts);
    expect(p.radius).toBeCloseTo(100);
    expect(p.angle).toBeCloseTo(4 * Math.PI * 2);
    // whole number of turns → back on the +x axis
    expect(p.x).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(0);
  });

  it("grows the radius linearly with fraction", () => {
    expect(pointAt(0.5, opts).radius).toBeCloseTo(55);
  });

  it("clamps out-of-range fractions", () => {
    expect(pointAt(2, opts).radius).toBeCloseTo(100);
    expect(pointAt(-1, opts).radius).toBeCloseTo(10);
  });
});

describe("nodePoints", () => {
  it("returns evenly spaced points across the sub-range", () => {
    const pts = nodePoints(3, opts, 0, 1);
    expect(pts).toHaveLength(3);
    expect(pts[0]!.radius).toBeCloseTo(10);
    expect(pts[1]!.radius).toBeCloseTo(55);
    expect(pts[2]!.radius).toBeCloseTo(100);
  });

  it("centers a single node and handles empty", () => {
    expect(nodePoints(0, opts)).toEqual([]);
    const one = nodePoints(1, opts, 0, 1);
    expect(one).toHaveLength(1);
    expect(one[0]!.radius).toBeCloseTo(55);
  });
});
