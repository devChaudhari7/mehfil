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

/** The year the "Now" band sweeps to — the journey literally ends today. */
export const NOW_YEAR = new Date().getFullYear();

/**
 * Era bands in ERA_ORDER order (50s…10s). Uniform decades sweep ~9.9 years; the
 * streaming band spans 2010 → the current year, so the odometer arrives at NOW.
 */
export const ERA_SPANS: readonly { start: number; span: number }[] = [
  { start: 1950, span: 9.9 },
  { start: 1960, span: 9.9 },
  { start: 1970, span: 9.9 },
  { start: 1980, span: 9.9 },
  { start: 1990, span: 9.9 },
  { start: 2000, span: 9.9 },
  { start: 2010, span: 9.9 },
  { start: 2020, span: Math.max(NOW_YEAR - 2020, 5) },
];

/**
 * Map the continuous era position to a rolling calendar year for the odometer:
 * the band's start year + the fractional travel × the band's span.
 */
export function yearFromEraFloat(eraFloat: number, eraCount = ERA_SPANS.length): number {
  const idx = ((Math.floor(eraFloat) % eraCount) + eraCount) % eraCount;
  const fraction = eraFloat - Math.floor(eraFloat);
  const band = ERA_SPANS[idx] ?? ERA_SPANS[0]!;
  return band.start + fraction * band.span;
}

/**
 * Mechanical-odometer digit positions for a (possibly fractional) year:
 * [thousands, hundreds, tens, units], each in [0, 10). The units wheel rolls
 * continuously; higher wheels roll only while the wheel below sweeps 9 → 0
 * (the classic carry), so 1959.95 reads as the 5 rolling into 6 mid-turn.
 */
export function odometerPositions(year: number): [number, number, number, number] {
  const y = Math.max(year, 0);
  const units = y % 10;
  const carryU = Math.max(units - 9, 0); // 0→1 across the last tenth of the wheel
  const tens = (Math.floor(y / 10) % 10) + carryU;
  const carryT = Math.max(tens - 9, 0);
  const hundreds = (Math.floor(y / 100) % 10) + carryT;
  const carryH = Math.max(hundreds - 9, 0);
  const thousands = (Math.floor(y / 1000) % 10) + carryH;
  return [
    Math.min(thousands, 10),
    Math.min(hundreds, 10),
    Math.min(tens, 10),
    Math.min(units, 10),
  ];
}
