import { describe, expect, it } from "vitest";
import {
  getGrooveFrame,
  odometerPositions,
  publishGrooveFrame,
  subscribeGroove,
  yearFromEraFloat,
} from "./grooveBus";

describe("groove frame bus", () => {
  it("publishes into the shared frame and notifies subscribers", () => {
    let seen = 0;
    const off = subscribeGroove((f) => {
      seen = f.p;
    });
    publishGrooveFrame({ p: 0.5, dive: 1, about: 0, eraFloat: 2.25 });
    expect(seen).toBe(0.5);
    expect(getGrooveFrame()).toMatchObject({ p: 0.5, dive: 1, about: 0, eraFloat: 2.25 });
    off();
    publishGrooveFrame({ p: 0.9, dive: 1, about: 0.4, eraFloat: 3 });
    expect(seen).toBe(0.5); // unsubscribed — no longer notified
    expect(getGrooveFrame().p).toBe(0.9);
  });
});

describe("yearFromEraFloat", () => {
  it("maps band starts to decade starts", () => {
    expect(yearFromEraFloat(0)).toBe(1950);
    expect(yearFromEraFloat(1)).toBe(1960);
    expect(yearFromEraFloat(4)).toBe(1990);
  });

  it("sweeps within a band toward the decade's end", () => {
    expect(yearFromEraFloat(0.5)).toBeCloseTo(1954.95, 2);
    expect(yearFromEraFloat(2.999)).toBeLessThan(1980);
    expect(yearFromEraFloat(2.999)).toBeGreaterThan(1979.8);
  });

  it("wraps past the last era back to the 50s (the groove loops)", () => {
    expect(yearFromEraFloat(5)).toBe(1950); // homeIdx offsets can exceed the count
    expect(yearFromEraFloat(6.5)).toBeCloseTo(1964.95, 2);
  });

  it("never leaves the catalog's century", () => {
    for (let f = 0; f < 10; f += 0.173) {
      const y = yearFromEraFloat(f);
      expect(y).toBeGreaterThanOrEqual(1950);
      expect(y).toBeLessThan(2000);
    }
  });
});

describe("odometerPositions", () => {
  it("reads whole years directly", () => {
    expect(odometerPositions(1954)).toEqual([1, 9, 5, 4]);
    expect(odometerPositions(1990)).toEqual([1, 9, 9, 0]);
  });

  it("rolls only the units wheel through mid-decade", () => {
    const [th, h, t, u] = odometerPositions(1954.5);
    expect(th).toBe(1);
    expect(h).toBe(9);
    expect(t).toBe(5);
    expect(u).toBeCloseTo(4.5, 5);
  });

  it("carries the tens wheel while units sweep 9 → 0", () => {
    const [, , t, u] = odometerPositions(1959.95);
    expect(u).toBeCloseTo(9.95, 5);
    expect(t).toBeCloseTo(5.95, 5); // mid-carry into 6
  });

  it("keeps every wheel inside [0, 10]", () => {
    for (let y = 1950; y < 2000; y += 0.37) {
      for (const p of odometerPositions(y)) {
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(10);
      }
    }
  });
});
