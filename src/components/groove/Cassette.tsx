"use client";

/*
 * Cassette — the 1980s medium artifact. Two reels turn when playing (gated by
 * reduced motion, like Vinyl). Colors ride the era tokens so it morphs in zone.
 */
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cx } from "@/lib/cx";

export interface CassetteProps {
  spinning?: boolean;
  size?: number;
  className?: string;
}

export function Cassette({ spinning = false, size = 300, className }: CassetteProps) {
  const reduced = useReducedMotion();
  const reelAnim = spinning && !reduced ? "vinyl-spin 2.4s linear infinite" : undefined;

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

      {[35, 65].map((cxp) => (
        <g
          key={cxp}
          style={{
            transformBox: "view-box",
            transformOrigin: `${cxp}px 60px`,
            animation: reelAnim,
          }}
        >
          <circle cx={cxp} cy="60" r="10.5" fill="#0c0c10" stroke="var(--accent)" strokeWidth="0.7" />
          {[0, 60, 120].map((a) => {
            const r = 8.5;
            const rad = (a * Math.PI) / 180;
            const dx = Math.cos(rad) * r;
            const dy = Math.sin(rad) * r;
            return (
              <line
                key={a}
                x1={cxp - dx}
                y1={60 - dy}
                x2={cxp + dx}
                y2={60 + dy}
                stroke="var(--accent)"
                strokeWidth="1"
                opacity="0.65"
              />
            );
          })}
          <circle cx={cxp} cy="60" r="3" fill="var(--accent)" />
        </g>
      ))}

      <circle cx="30" cy="71" r="2" fill="rgba(255,255,255,0.18)" />
      <circle cx="70" cy="71" r="2" fill="rgba(255,255,255,0.18)" />
    </svg>
  );
}
