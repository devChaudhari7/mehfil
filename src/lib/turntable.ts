/*
 * MEHFIL — turntable physics (Phase 15.5, pure).
 *
 * The living record: an angular integrator with three modes —
 *   motor  · the platter runs at the medium's RPM (velocity eases toward it),
 *   drag   · the hand owns the angle; velocity is estimated from the drag,
 *   coast  · released — momentum decays exponentially until the motor re-engages.
 * Everything is deterministic math on a small mutable state (mutation keeps the
 * rAF loop allocation-free), so the whole feel is unit-testable.
 */
import type { Medium } from "@/lib/eras";

export interface Turntable {
  /** Platter angle in degrees (unbounded; CSS rotate accepts any value). */
  angle: number;
  /** Angular velocity in deg/s. */
  velocity: number;
  /** The motor's target velocity in deg/s. */
  motor: number;
  mode: "motor" | "drag" | "coast";
}

/** Matches the CSS spin cadence (--spin-vinyl 1.8s/rev, --spin-cd 1.4s/rev). */
export function motorDegPerSec(medium: Medium): number {
  if (medium === "cd") return 360 / 1.4;
  return 360 / 1.8; // shellac + vinyl (cassettes never reach the turntable)
}

export function createTurntable(motor: number): Turntable {
  return { angle: 0, velocity: motor, motor, mode: "motor" };
}

/** Signed shortest angular difference, in (−180, 180]. */
export function wrapDeg(d: number): number {
  return ((((d + 180) % 360) + 360) % 360) - 180;
}

/** Advance the integrator by dtMs. No-op while the hand owns the platter. */
export function stepTurntable(t: Turntable, dtMs: number): void {
  const dt = Math.min(Math.max(dtMs, 0), 100) / 1000;
  if (t.mode === "drag") return;
  if (t.mode === "coast") {
    // momentum bleeds off; the motor re-engages once the platter is close
    const k = Math.exp(-dt / 0.85);
    t.velocity = t.motor + (t.velocity - t.motor) * k;
    if (Math.abs(t.velocity - t.motor) < 10) t.mode = "motor";
  } else {
    // motor mode still eases (a real platter has spin-up inertia)
    const k = Math.exp(-dt / 0.4);
    t.velocity = t.motor + (t.velocity - t.motor) * k;
  }
  t.angle += t.velocity * dt;
}

/** The hand grabs the platter. */
export function beginDrag(t: Turntable): void {
  t.mode = "drag";
  t.velocity = 0;
}

/** The hand moved to `angleDeg` (same reference frame as t.angle) over dtMs. */
export function dragTo(t: Turntable, angleDeg: number, dtMs: number): void {
  const d = wrapDeg(angleDeg - t.angle);
  t.angle += d;
  if (dtMs > 0) {
    const instant = (d / dtMs) * 1000;
    // blend for a stable velocity estimate across jittery pointer events
    t.velocity = t.velocity * 0.6 + instant * 0.4;
  }
}

/** The hand lets go — coast on the accumulated momentum. */
export function endDrag(t: Turntable): void {
  t.mode = "coast";
}

/**
 * How hard the needle is being scratched: 0 when the motor owns the platter,
 * rising toward 1 as the platter velocity diverges from the motor's.
 */
export function scratchIntensity(t: Turntable): number {
  if (t.mode === "motor") return 0;
  return Math.min(Math.abs(t.velocity - t.motor) / 900, 1);
}
