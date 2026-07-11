import { describe, expect, it } from "vitest";
import {
  beginDrag,
  createTurntable,
  dragTo,
  endDrag,
  motorDegPerSec,
  scratchIntensity,
  stepTurntable,
  wrapDeg,
} from "./turntable";

const VINYL = motorDegPerSec("vinyl");

describe("motorDegPerSec", () => {
  it("matches the CSS spin cadences", () => {
    expect(motorDegPerSec("vinyl")).toBeCloseTo(360 / 1.8, 5);
    expect(motorDegPerSec("shellac")).toBeCloseTo(360 / 1.8, 5);
    expect(motorDegPerSec("cd")).toBeCloseTo(360 / 1.4, 5);
  });
});

describe("wrapDeg", () => {
  it("returns the signed shortest difference", () => {
    expect(wrapDeg(10)).toBe(10);
    expect(wrapDeg(190)).toBe(-170);
    expect(wrapDeg(-190)).toBe(170);
    expect(wrapDeg(360)).toBe(0);
    expect(wrapDeg(720 + 45)).toBe(45);
  });
});

describe("motor mode", () => {
  it("advances the angle at the motor rate once settled (dt clamped to 100ms/step)", () => {
    const t = createTurntable(VINYL);
    const a0 = t.angle;
    for (let i = 0; i < 10; i++) stepTurntable(t, 100); // 1s of simulated time
    expect(t.angle - a0).toBeCloseTo(VINYL, 0);
    expect(t.mode).toBe("motor");
  });

  it("eases velocity toward the motor after a disturbance", () => {
    const t = createTurntable(VINYL);
    t.velocity = 0; // stalled platter
    stepTurntable(t, 100);
    expect(t.velocity).toBeGreaterThan(0);
    expect(t.velocity).toBeLessThan(VINYL);
    for (let i = 0; i < 60; i++) stepTurntable(t, 100);
    expect(t.velocity).toBeCloseTo(VINYL, 0);
  });
});

describe("drag → coast → motor", () => {
  it("the hand owns the angle while dragging and momentum estimates from movement", () => {
    const t = createTurntable(VINYL);
    beginDrag(t);
    expect(t.mode).toBe("drag");
    expect(t.velocity).toBe(0);
    stepTurntable(t, 16); // dragging: the integrator must not move the platter
    const before = t.angle;
    expect(before).toBe(0);
    // spin fast: +30° in 16ms ≈ 1875 deg/s (blended estimate stays below instant)
    dragTo(t, 30, 16);
    expect(t.angle).toBe(30);
    expect(t.velocity).toBeGreaterThan(400);
  });

  it("coasts on release, decays, and the motor re-engages", () => {
    const t = createTurntable(VINYL);
    beginDrag(t);
    dragTo(t, 40, 16);
    dragTo(t, 80, 16);
    endDrag(t);
    expect(t.mode).toBe("coast");
    const fast = t.velocity;
    stepTurntable(t, 100);
    expect(Math.abs(t.velocity - VINYL)).toBeLessThan(Math.abs(fast - VINYL));
    for (let i = 0; i < 80; i++) stepTurntable(t, 100); // 8s: momentum gone
    expect(t.mode).toBe("motor");
    expect(t.velocity).toBeCloseTo(VINYL, 0);
  });

  it("handles the wrap seam while dragging (359° → 1°)", () => {
    const t = createTurntable(VINYL);
    t.angle = 359;
    beginDrag(t);
    dragTo(t, 361 - 360, 16); // pointer reports 1°
    expect(t.angle).toBeCloseTo(361, 5); // +2°, not −358°
  });
});

describe("scratchIntensity", () => {
  it("is 0 under motor control and bounded to 1", () => {
    const t = createTurntable(VINYL);
    expect(scratchIntensity(t)).toBe(0);
    beginDrag(t);
    t.velocity = 20000;
    expect(scratchIntensity(t)).toBe(1);
    t.velocity = VINYL; // moving with the motor — no scratch even mid-drag
    expect(scratchIntensity(t)).toBeCloseTo(0, 5);
  });
});
