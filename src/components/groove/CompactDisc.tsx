"use client";

/*
 * CompactDisc — the 1990s medium artifact: chrome iridescence + fine rings,
 * spins when playing (gated by reduced motion).
 */
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cx } from "@/lib/cx";

export interface CompactDiscProps {
  spinning?: boolean;
  size?: number;
  className?: string;
}

export function CompactDisc({ spinning = false, size = 300, className }: CompactDiscProps) {
  const reduced = useReducedMotion();
  const animate = spinning && !reduced;
  const hub = Math.round(size * 0.3);

  return (
    <div
      className={cx("relative shrink-0 rounded-full", className)}
      style={{
        width: size,
        height: size,
        background:
          "conic-gradient(from 0deg, #b9c7d6, #e7d6f0, #cfe9ee, #d6c0e0, #c0d8e6, #e7d6f0, #b9c7d6)",
        boxShadow: "0 30px 70px rgba(0,0,0,0.5), inset 0 0 50px rgba(255,255,255,0.22)",
        animation: animate ? "vinyl-spin 1.4s linear infinite" : undefined,
      }}
      role="img"
      aria-label="Compact disc"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0 2px, transparent 2px 6px)",
        }}
      />
      <span
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: hub,
          height: hub,
          background: "radial-gradient(circle, #0a0a0c 0 38%, #c7d2dd 39% 60%, #0a0a0c 61%)",
        }}
      />
    </div>
  );
}
