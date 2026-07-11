/*
 * MEHFIL — the groove frame bus (Phase 15 foundations).
 *
 * GrooveWorld's scroll controller computes the journey each frame (progress, dive,
 * about, the continuous era position). Publishing it here lets imperative consumers
 * — the year odometer, the GrooveGL shader — read/subscribe per frame WITHOUT React
 * renders, mirroring the pointerState pattern. Pure module state; trivially testable.
 */

export interface GrooveFrame {
  /** Overall scroll progress [0,1]. */
  p: number;
  /** Dive sub-progress [0,1] (outside → inside the grooves). */
  dive: number;
  /** Colophon sub-progress [0,1]. */
  about: number;
  /**
   * Continuous era position: homeIndex + traveled (may exceed the era count —
   * consumers wrap with `% eraCount`). floor(eraFloat) % count = the active era index.
   */
  eraFloat: number;
}

const frame: GrooveFrame = { p: 0, dive: 0, about: 0, eraFloat: 0 };
const subs = new Set<(f: GrooveFrame) => void>();

export function publishGrooveFrame(next: GrooveFrame): void {
  frame.p = next.p;
  frame.dive = next.dive;
  frame.about = next.about;
  frame.eraFloat = next.eraFloat;
  for (const fn of subs) fn(frame);
}

export function getGrooveFrame(): GrooveFrame {
  return frame;
}

export function subscribeGroove(fn: (f: GrooveFrame) => void): () => void {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}

/** First year of each era band, in ERA_ORDER order (50s…90s). */
const DECADE_START = [1950, 1960, 1970, 1980, 1990] as const;

/**
 * Map the continuous era position to a rolling calendar year for the odometer:
 * the decade base of the active band + the fractional travel × 9.9 (so a band
 * sweeps 1950 → ~1959.9 before rolling into the next decade).
 */
export function yearFromEraFloat(eraFloat: number, eraCount = DECADE_START.length): number {
  const idx = ((Math.floor(eraFloat) % eraCount) + eraCount) % eraCount;
  const fraction = eraFloat - Math.floor(eraFloat);
  return (DECADE_START[idx] ?? 1950) + fraction * 9.9;
}
