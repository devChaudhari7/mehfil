"use client";

/*
 * TimeArm — the tonearm that plays the record of time (Phase 23).
 *
 * Inside the groove, scrolling IS playback: a tonearm reaches in from the
 * spiral's edge and its stylus tracks the groove from the OUTER edge (1950,
 * where records begin) inward to the heart (Now) — your scroll position is the
 * needle's position on the record of the century. Driven imperatively off the
 * groove bus (zero React renders, no own rAF — it moves only when you scroll).
 * Decorative (aria-hidden); rendered inside the spiral's square so the
 * geometry matches the groove rings exactly.
 */
import { useEffect, useRef } from "react";
import { ERA_ORDER } from "@/lib/useEraStore";
import { getGrooveFrame, subscribeGroove } from "@/lib/grooveBus";

const ANGLE = (38 * Math.PI) / 180; // the radial line the stylus tracks
const UX = Math.cos(ANGLE);
const UY = Math.sin(ANGLE);
const PIVOT = { x: 94, y: 4 };

export function TimeArm() {
  const lineRef = useRef<SVGLineElement>(null);
  const stylusRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const apply = (eraFloat: number) => {
      const n = ERA_ORDER.length;
      const et = (((eraFloat % n) + n) % n) / n;
      // records play outside-in: 1950 at the rim, Now at the heart
      const r = 46 * (0.97 - 0.84 * et);
      const x = 50 + UX * r;
      const y = 50 + UY * r;
      lineRef.current?.setAttribute("x2", x.toFixed(2));
      lineRef.current?.setAttribute("y2", y.toFixed(2));
      stylusRef.current?.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
    };
    apply(getGrooveFrame().eraFloat);
    return subscribeGroove((f) => apply(f.eraFloat));
  }, []);

  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      {/* counterweight stub + pivot bearing */}
      <line
        x1={PIVOT.x + 3}
        y1={PIVOT.y - 2.6}
        x2={PIVOT.x}
        y2={PIVOT.y}
        stroke="color-mix(in srgb, var(--ink) 45%, transparent)"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle
        cx={PIVOT.x}
        cy={PIVOT.y}
        r="2.4"
        fill="var(--s2)"
        stroke="color-mix(in srgb, var(--ink) 40%, transparent)"
        strokeWidth="0.5"
      />
      {/* the arm */}
      <line
        ref={lineRef}
        x1={PIVOT.x}
        y1={PIVOT.y}
        x2="86"
        y2="33"
        stroke="color-mix(in srgb, var(--ink) 52%, transparent)"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      {/* the stylus, reading the groove of the current year */}
      <g ref={stylusRef}>
        <circle r="2.8" fill="color-mix(in srgb, var(--glow) 26%, transparent)" />
        <circle r="1.1" fill="var(--glow)" />
      </g>
    </svg>
  );
}
