import { describe, expect, it } from "vitest";
import { interpolate } from "./useInterpolatedTime";

describe("interpolate", () => {
  it("extrapolates forward while playing", () => {
    expect(
      interpolate({ lastTime: 10, lastWall: 1000, now: 1500, playing: true, duration: 200 }),
    ).toBeCloseTo(10.5, 5);
  });

  it("freezes when not playing", () => {
    expect(
      interpolate({ lastTime: 42, lastWall: 1000, now: 9999, playing: false, duration: 200 }),
    ).toBe(42);
  });

  it("clamps to duration", () => {
    expect(
      interpolate({ lastTime: 199.9, lastWall: 1000, now: 6000, playing: true, duration: 200 }),
    ).toBe(200);
  });

  it("does not clamp when duration is unknown (0)", () => {
    expect(
      interpolate({ lastTime: 5, lastWall: 1000, now: 3000, playing: true, duration: 0 }),
    ).toBeCloseTo(7, 5);
  });
});
