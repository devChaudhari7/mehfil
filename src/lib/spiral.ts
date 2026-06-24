/*
 * MEHFIL — Archimedean spiral geometry (Phase 5).
 *
 * One tested source of truth for "where on the groove is fraction f?", shared by
 * the decorative GrooveSpiral backdrop and the interactive SpiralNavigator, so the
 * two can never drift. Pure math (no DOM): coordinates are returned relative to the
 * spiral center (0,0); callers add their own cx/cy. Radius grows linearly from
 * `minR` (innermost) to `maxR` (outer rim) across `turns` revolutions.
 */
export interface SpiralOpts {
  /** Number of revolutions from center to rim. */
  turns: number;
  /** Innermost radius (fraction 0). */
  minR: number;
  /** Outer-rim radius (fraction 1). */
  maxR: number;
}

export interface SpiralPoint {
  x: number;
  y: number;
  /** Angle in radians (0 = +x axis). */
  angle: number;
  radius: number;
}

export function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/** Point on the spiral at travel `fraction` ∈ [0,1] (0 = center, 1 = rim). */
export function pointAt(fraction: number, opts: SpiralOpts): SpiralPoint {
  const f = clamp01(fraction);
  const angle = f * opts.turns * Math.PI * 2;
  const radius = opts.minR + (opts.maxR - opts.minR) * f;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, angle, radius };
}

/**
 * Evenly spaced points across a [from,to] sub-range of the spiral — used to lay
 * out `count` nodes (eras / records / tracks) along one stretch of the groove.
 */
export function nodePoints(
  count: number,
  opts: SpiralOpts,
  from = 0.12,
  to = 0.95,
): SpiralPoint[] {
  if (count <= 0) return [];
  if (count === 1) return [pointAt((from + to) / 2, opts)];
  return Array.from({ length: count }, (_, i) =>
    pointAt(from + ((to - from) * i) / (count - 1), opts),
  );
}
