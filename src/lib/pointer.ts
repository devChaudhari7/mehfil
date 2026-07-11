/*
 * MEHFIL — the shared pointer state (Phase 15 foundations).
 *
 * One module singleton written by PointerRoot's rAF and read imperatively (no React
 * renders) by everything that follows the hand: the needle cursor, the magnetic CTAs,
 * the DOM pointer-lamp, and the GrooveGL shader (uPointer). Coarse pointers and
 * reduced-motion never activate it — `active` stays false and every consumer no-ops.
 */
export interface PointerState {
  /** Raw pointer position (client px). */
  x: number;
  y: number;
  /** Smoothed (lerped) position — the "lamp" position. */
  sx: number;
  sy: number;
  /** True while a button/touch is down. */
  down: boolean;
  /** True when the pointer-FX system is running (fine pointer, motion allowed). */
  active: boolean;
  /** performance.now() of the last movement (idle detection). */
  lastMove: number;
}

export const pointerState: PointerState = {
  x: -1000,
  y: -1000,
  sx: -1000,
  sy: -1000,
  down: false,
  active: false,
  lastMove: 0,
};

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
