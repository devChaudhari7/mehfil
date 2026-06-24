/*
 * MEHFIL — cassette tape physics (Phase 6).
 *
 * As a track plays, tape moves from the supply reel (left) to the take-up reel
 * (right). The wound pack's RADIUS isn't linear in tape length — tape area is
 * conserved, so radius grows with the square root of the wound fraction. One
 * tested source of truth for the Now Playing deck (and any future cassette view).
 */

/** Supply empties as take-up fills; both clamped to [0,1]. */
export function windFractions(progress: number): { supply: number; takeup: number } {
  const p = progress < 0 ? 0 : progress > 1 ? 1 : progress;
  return { supply: 1 - p, takeup: p };
}

/**
 * Radius of a wound tape pack at `fraction` ∈ [0,1] of capacity, between the bare
 * hub (`hubR`, fraction 0) and a full reel (`maxR`, fraction 1). Area-proportional:
 * r = sqrt(hubR² + (maxR² − hubR²)·fraction).
 */
export function tapePackRadius(fraction: number, hubR: number, maxR: number): number {
  const f = fraction < 0 ? 0 : fraction > 1 ? 1 : fraction;
  return Math.sqrt(hubR * hubR + (maxR * maxR - hubR * hubR) * f);
}
