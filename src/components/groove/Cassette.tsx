"use client";

/*
 * Cassette — the 1980s medium artifact AND the Now Playing deck object (Phase 6).
 *
 * Two modes, one component:
 *   - Medium-morph (hero): `<Cassette spinning size />` → reels CSS-spin, tape packs
 *     at a static half-wound look (progress defaults to 0.5).
 *   - Now Playing deck: pass `progress` (tape redistribution) and a `clock` to drive
 *     reel rotation + pack radii per frame off the interpolated clock (no React
 *     re-renders), mutating refs directly like GrooveSpiral/Needle.
 *
 * Reduced motion (or no clock): reels don't spin; the tape packs render at the
 * static `progress` proportion. The SVG scales to its box (viewBox units), so the
 * deck can size it purely with CSS (no JS measure, no CLS).
 */
import { useEffect, useRef } from "react";
import { tapePackRadius, windFractions } from "@/lib/cassette";
import type { InterpolatedClock } from "@/lib/useInterpolatedTime";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cx } from "@/lib/cx";

const REELS = [
  { cx: 35, label: "supply" },
  { cx: 65, label: "takeup" },
] as const;
const REEL_Y = 60;
const HUB_R = 3.2;
const PACK_MAX_R = 10.2;
const DEG_PER_SEC = 150; // ~2.4s per revolution, matching the CSS spin

export interface CassetteProps {
  spinning?: boolean;
  size?: number;
  /** Tape wound onto the take-up reel, 0..1 (supply = 1 − this). */
  progress?: number;
  /** When supplied (and motion allowed), drives reels + tape per frame. */
  clock?: InterpolatedClock;
  className?: string;
}

export function Cassette({
  spinning = false,
  size = 300,
  progress = 0.5,
  clock,
  className,
}: CassetteProps) {
  const reduced = useReducedMotion();
  const reelRefs = useRef<(SVGGElement | null)[]>([]);
  const packRefs = useRef<(SVGCircleElement | null)[]>([]);

  // CSS spin only in the hero (no clock) path; the deck drives rotation via rAF.
  const reelAnim = spinning && !reduced && !clock ? "vinyl-spin 2.4s linear infinite" : undefined;

  useEffect(() => {
    if (!clock || reduced) return;
    let raf = 0;
    const tick = () => {
      const deg = clock.getTime() * DEG_PER_SEC;
      const { supply, takeup } = windFractions(clock.getProgress());
      const rot = `rotate(${deg}deg)`;
      reelRefs.current[0]?.style.setProperty("transform", rot);
      reelRefs.current[1]?.style.setProperty("transform", rot);
      packRefs.current[0]?.setAttribute("r", tapePackRadius(supply, HUB_R, PACK_MAX_R).toFixed(2));
      packRefs.current[1]?.setAttribute("r", tapePackRadius(takeup, HUB_R, PACK_MAX_R).toFixed(2));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [clock, reduced]);

  // Static pack radii (hero, reduced motion, or first paint before rAF kicks in).
  const staticWind = windFractions(progress);

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cx("shrink-0", className)}
      role="img"
      aria-label="Cassette tape"
    >
      <rect
        x="8"
        y="24"
        width="84"
        height="52"
        rx="6"
        fill="var(--cass, #1a1230)"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="0.6"
      />
      <rect
        x="16"
        y="29"
        width="68"
        height="16"
        rx="3"
        fill="color-mix(in srgb, var(--accent) 22%, transparent)"
      />
      <rect x="30" y="54" width="40" height="12" rx="2" fill="rgba(0,0,0,0.45)" />

      {REELS.map((reel, i) => {
        const frac = i === 0 ? staticWind.supply : staticWind.takeup;
        return (
          <g
            key={reel.cx}
            ref={(el) => {
              reelRefs.current[i] = el;
            }}
            style={{
              transformBox: "view-box",
              transformOrigin: `${reel.cx}px ${REEL_Y}px`,
              animation: reelAnim,
            }}
          >
            {/* reel well */}
            <circle cx={reel.cx} cy={REEL_Y} r="10.5" fill="#0c0c10" stroke="var(--accent)" strokeWidth="0.7" />
            {/* wound tape pack (radius = how much tape is on this reel) */}
            <circle
              ref={(el) => {
                packRefs.current[i] = el;
              }}
              cx={reel.cx}
              cy={REEL_Y}
              r={tapePackRadius(frac, HUB_R, PACK_MAX_R).toFixed(2)}
              fill="color-mix(in srgb, var(--accent) 32%, #241a10)"
            />
            {/* hub teeth */}
            {[0, 60, 120].map((a) => {
              const r = 8.5;
              const rad = (a * Math.PI) / 180;
              const dx = Math.cos(rad) * r;
              const dy = Math.sin(rad) * r;
              return (
                <line
                  key={a}
                  x1={reel.cx - dx}
                  y1={REEL_Y - dy}
                  x2={reel.cx + dx}
                  y2={REEL_Y + dy}
                  stroke="var(--accent)"
                  strokeWidth="1"
                  opacity="0.65"
                />
              );
            })}
            <circle cx={reel.cx} cy={REEL_Y} r="3" fill="var(--accent)" />
          </g>
        );
      })}

      <circle cx="30" cy="71" r="2" fill="rgba(255,255,255,0.18)" />
      <circle cx="70" cy="71" r="2" fill="rgba(255,255,255,0.18)" />
    </svg>
  );
}
