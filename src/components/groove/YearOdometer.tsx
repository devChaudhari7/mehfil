"use client";

/*
 * YearOdometer — time made mechanical (Phase 15.6).
 *
 * Four huge, ghosted digit wheels behind the spiral, rolling with your scroll:
 * the units wheel sweeps continuously through each decade, the higher wheels
 * carry like a real odometer. Driven imperatively from the groove bus (zero
 * React renders per frame — the tape-counter pattern). Decorative (aria-hidden);
 * the spiral hub carries the accessible era label.
 */
import { useEffect, useRef } from "react";
import { odometerPositions, subscribeGroove, yearFromEraFloat } from "@/lib/grooveBus";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0]; // trailing 0 for the 9→0 roll

export function YearOdometer() {
  const colRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    return subscribeGroove((f) => {
      const pos = odometerPositions(yearFromEraFloat(f.eraFloat));
      for (let i = 0; i < 4; i++) {
        const col = colRefs.current[i];
        if (col) col.style.transform = `translateY(${(-(pos[i] ?? 0)).toFixed(3)}em)`;
      }
    });
  }, []);

  return (
    <div aria-hidden="true" className="year-odometer">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="year-odometer__wheel">
          <span
            ref={(el) => {
              colRefs.current[i] = el;
            }}
            className="year-odometer__strip"
          >
            {DIGITS.map((d, j) => (
              <span key={j}>{d}</span>
            ))}
          </span>
        </span>
      ))}
    </div>
  );
}
