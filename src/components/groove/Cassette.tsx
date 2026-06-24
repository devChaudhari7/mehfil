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
 * Two *geometries* via `variant` (animation logic is shared):
 *   - "default" — the square hero artifact (byte-stable; unchanged literals).
 *   - "deck"    — a balanced landscape cassette matching docs/concept: a single dark
 *     window frames both reels with a tape strand between them, reels vertically
 *     centered and fully inside the shell with even inset.
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

const DEG_PER_SEC = 150; // ~2.4s per revolution, matching the CSS spin

export type CassetteVariant = "default" | "deck";

interface ReelGeom {
  wellR: number;
  packHubR: number;
  packMaxR: number;
  teethR: number;
  hubR: number;
}

interface CassetteGeom {
  /** viewBox dimensions. */
  w: number;
  h: number;
  shell: { x: number; y: number; w: number; h: number; rx: number };
  reelCx: readonly [number, number];
  reelY: number;
  reel: ReelGeom;
}

// Byte-stable hero geometry — identical to the pre-fix literals.
const DEFAULT_GEOM: CassetteGeom = {
  w: 100,
  h: 100,
  shell: { x: 8, y: 24, w: 84, h: 52, rx: 6 },
  reelCx: [35, 65],
  reelY: 60,
  reel: { wellR: 10.5, packHubR: 3.2, packMaxR: 10.2, teethR: 8.5, hubR: 3 },
};

// Deck geometry — concept (330×212) mapped to a landscape viewBox.
const DECK_GEOM: CassetteGeom = {
  w: 100,
  h: 64,
  shell: { x: 2, y: 2, w: 96, h: 60, rx: 5 },
  reelCx: [29, 71],
  reelY: 33,
  reel: { wellR: 8.8, packHubR: 2.6, packMaxR: 8.0, teethR: 6.8, hubR: 2 },
};

export interface CassetteProps {
  spinning?: boolean;
  size?: number;
  /** Tape wound onto the take-up reel, 0..1 (supply = 1 − this). */
  progress?: number;
  /** When supplied (and motion allowed), drives reels + tape per frame. */
  clock?: InterpolatedClock;
  variant?: CassetteVariant;
  className?: string;
}

export function Cassette({
  spinning = false,
  size = 300,
  progress = 0.5,
  clock,
  variant = "default",
  className,
}: CassetteProps) {
  const reduced = useReducedMotion();
  const reelRefs = useRef<(SVGGElement | null)[]>([]);
  const packRefs = useRef<(SVGCircleElement | null)[]>([]);
  const geom = variant === "deck" ? DECK_GEOM : DEFAULT_GEOM;

  // CSS spin only in the hero (no clock) path; the deck drives rotation via rAF.
  const reelAnim = spinning && !reduced && !clock ? "vinyl-spin 2.4s linear infinite" : undefined;

  useEffect(() => {
    if (!clock || reduced) return;
    const { packHubR, packMaxR } = geom.reel;
    let raf = 0;
    const tick = () => {
      const deg = clock.getTime() * DEG_PER_SEC;
      const { supply, takeup } = windFractions(clock.getProgress());
      const rot = `rotate(${deg}deg)`;
      reelRefs.current[0]?.style.setProperty("transform", rot);
      reelRefs.current[1]?.style.setProperty("transform", rot);
      packRefs.current[0]?.setAttribute("r", tapePackRadius(supply, packHubR, packMaxR).toFixed(2));
      packRefs.current[1]?.setAttribute("r", tapePackRadius(takeup, packHubR, packMaxR).toFixed(2));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [clock, reduced, geom]);

  // Static pack radii (hero, reduced motion, or first paint before rAF kicks in).
  const staticWind = windFractions(progress);

  return (
    <svg
      viewBox={`0 0 ${geom.w} ${geom.h}`}
      width={size}
      height={Math.round((size * geom.h) / geom.w)}
      className={cx("shrink-0", className)}
      role="img"
      aria-label="Cassette tape"
    >
      <rect
        x={geom.shell.x}
        y={geom.shell.y}
        width={geom.shell.w}
        height={geom.shell.h}
        rx={geom.shell.rx}
        fill="var(--cass, #1a1230)"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="0.6"
      />

      {/* pre-reel chrome (reels render on top) */}
      {variant === "deck" ? (
        <>
          {/* printed label strip */}
          <rect x="14" y="5" width="72" height="7" rx="2" fill="color-mix(in srgb, var(--accent) 22%, transparent)" />
          {/* the window framing both reels */}
          <rect
            x="12"
            y="17"
            width="76"
            height="30"
            rx="3"
            fill="rgba(0,0,0,0.42)"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.5"
          />
          {/* tape strand running between the reels */}
          <rect x="24" y="25" width="52" height="3" rx="1" fill="color-mix(in srgb, var(--accent) 35%, transparent)" />
          {/* drive holes */}
          <circle cx="35" cy="55" r="1.6" fill="rgba(255,255,255,0.14)" />
          <circle cx="65" cy="55" r="1.6" fill="rgba(255,255,255,0.14)" />
        </>
      ) : (
        <>
          <rect
            x="16"
            y="29"
            width="68"
            height="16"
            rx="3"
            fill="color-mix(in srgb, var(--accent) 22%, transparent)"
          />
          <rect x="30" y="54" width="40" height="12" rx="2" fill="rgba(0,0,0,0.45)" />
        </>
      )}

      {geom.reelCx.map((rcx, i) => {
        const frac = i === 0 ? staticWind.supply : staticWind.takeup;
        const { wellR, packHubR, packMaxR, teethR, hubR } = geom.reel;
        return (
          <g
            key={rcx}
            ref={(el) => {
              reelRefs.current[i] = el;
            }}
            style={{
              transformBox: "view-box",
              transformOrigin: `${rcx}px ${geom.reelY}px`,
              animation: reelAnim,
            }}
          >
            {/* reel well */}
            <circle cx={rcx} cy={geom.reelY} r={wellR} fill="#0c0c10" stroke="var(--accent)" strokeWidth="0.7" />
            {/* wound tape pack (radius = how much tape is on this reel) */}
            <circle
              ref={(el) => {
                packRefs.current[i] = el;
              }}
              cx={rcx}
              cy={geom.reelY}
              r={tapePackRadius(frac, packHubR, packMaxR).toFixed(2)}
              fill="color-mix(in srgb, var(--accent) 32%, #241a10)"
            />
            {/* hub teeth */}
            {[0, 60, 120].map((a) => {
              const rad = (a * Math.PI) / 180;
              const dx = Math.cos(rad) * teethR;
              const dy = Math.sin(rad) * teethR;
              return (
                <line
                  key={a}
                  x1={rcx - dx}
                  y1={geom.reelY - dy}
                  x2={rcx + dx}
                  y2={geom.reelY + dy}
                  stroke="var(--accent)"
                  strokeWidth="1"
                  opacity="0.65"
                />
              );
            })}
            <circle cx={rcx} cy={geom.reelY} r={hubR} fill="var(--accent)" />
          </g>
        );
      })}

      {/* post-reel chrome (default drive holes) */}
      {variant === "default" && (
        <>
          <circle cx="30" cy="71" r="2" fill="rgba(255,255,255,0.18)" />
          <circle cx="70" cy="71" r="2" fill="rgba(255,255,255,0.18)" />
        </>
      )}
    </svg>
  );
}
