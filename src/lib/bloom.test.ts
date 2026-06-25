import { describe, expect, it } from "vitest";
import { bloomParams } from "./bloom";

describe("bloomParams", () => {
  it("maps timeOfDay to a dawn→night base hue", () => {
    expect(bloomParams({ timeOfDay: "day" }).hue).toBeCloseTo(46);
    expect(bloomParams({ timeOfDay: "dusk" }).hue).toBeCloseTo(22);
    expect(bloomParams({ timeOfDay: "night" }).hue).toBeCloseTo(248);
  });

  it("maps tempo to breathing intensity + speed", () => {
    expect(bloomParams({ tempoBucket: "slow" }).speed).toBeLessThan(
      bloomParams({ tempoBucket: "fast" }).speed,
    );
    expect(bloomParams({ tempoBucket: "fast" }).intensity).toBeGreaterThan(
      bloomParams({ tempoBucket: "slow" }).intensity,
    );
  });

  it("lets moods shift hue + saturation, keeping values in range", () => {
    const festive = bloomParams({ timeOfDay: "day", moods: ["festive"], tempoBucket: "fast" });
    expect(festive.saturation).toBeGreaterThan(0.7);
    expect(festive.intensity).toBeLessThanOrEqual(1);
    const brooding = bloomParams({ timeOfDay: "night", moods: ["brooding"] });
    expect(brooding.saturation).toBeLessThan(0.7);
  });

  it("is robust to absent/unknown tags (ingest defaults)", () => {
    const d = bloomParams({});
    expect(d.hue).toBeCloseTo(22); // defaults to dusk
    expect(d.intensity).toBeGreaterThanOrEqual(0.2);
    const u = bloomParams({ timeOfDay: "day", moods: ["__nope__", "joyful"] });
    expect(u.hue).toBeGreaterThanOrEqual(0);
    expect(u.hue).toBeLessThan(360);
  });
});
