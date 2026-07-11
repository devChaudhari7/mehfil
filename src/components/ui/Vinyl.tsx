"use client";

import type { ReactNode } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cx } from "@/lib/cx";

/*
 * Vinyl — a record disc: concentric grooves (--disc/--disc2), a center label
 * (the AA-verified --btn/--btn-ink pair) with spindle hole, and a light sweep.
 * Presentational (no needle-drop logic — that's Phase 3/4).
 *
 * `spinning` runs a believable 33⅓ rotation, GATED by useReducedMotion so it
 * renders as a clean static disc (Tier C) when motion is reduced.
 */
export interface VinylProps {
  spinning?: boolean;
  /** Diameter in px. */
  size?: number;
  /** Center-label content (e.g. an RPM mark or short title). */
  label?: ReactNode;
  className?: string;
}

export function Vinyl({ spinning = false, size = 260, label, className }: VinylProps) {
  const reduced = useReducedMotion();
  const animate = spinning && !reduced;
  const labelSize = Math.round(size * 0.36);

  return (
    <div
      className={cx("relative shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Vinyl record"
    >
      <div
        data-tt-disc
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "repeating-radial-gradient(circle at 50% 50%, var(--disc) 0 3px, var(--disc2) 3px 5px)",
          boxShadow: "0 30px 70px rgba(0,0,0,0.55), inset 0 0 60px rgba(0,0,0,0.6)",
          animation: animate ? "vinyl-spin var(--spin-vinyl) linear infinite" : undefined,
        }}
      >
        {/* diagonal sheen / light sweep */}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "linear-gradient(125deg, rgba(255,255,255,0.14), transparent 38%, transparent 62%, rgba(255,255,255,0.06))",
          }}
        />
        {/* center label */}
        <span
          className="bg-btn text-btn-ink absolute top-1/2 left-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-center font-mono text-[10px] tracking-[0.16em] uppercase"
          style={{ width: labelSize, height: labelSize }}
        >
          <span
            className="px-1 leading-tight opacity-90"
            style={{ transform: "translateY(20%)" }}
          >
            {label}
          </span>
          {/* spindle hole */}
          <span
            aria-hidden="true"
            className="absolute h-3 w-3 rounded-full bg-[#0a0a0c] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.12)]"
          />
        </span>
      </div>
      {/* pointer-lit sheen — the CSS floor where GrooveGL isn't active. Outside the
          rotating layer so the light stays still while the platter spins. */}
      <span
        aria-hidden="true"
        className="disc-live-sheen pointer-events-none absolute inset-0 rounded-full"
      />
    </div>
  );
}
