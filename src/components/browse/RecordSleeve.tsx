"use client";

/*
 * RecordSleeve — the "album as a physical object" (art-direction §11.4, Phase 5).
 *
 * Composes the Phase 1 Sleeve + Vinyl: the record nests behind the jacket and
 * slides out to the right on hover (transform only → GPU, no layout shift). This
 * is the signature "pull the record out of the sleeve" interaction.
 *
 * Reduced-motion fallback (required): NO slide — the record is shown statically a
 * little out of the sleeve so the object still reads as a record-in-a-jacket.
 * `pulled` may be supplied to control the slide externally (e.g. an album hero).
 */
import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { Sleeve, Vinyl } from "@/components/ui";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cx } from "@/lib/cx";

export interface RecordSleeveProps {
  /** Jacket edge length in px (the record is sized from this). */
  size?: number;
  /** Record center-label content (e.g. RPM mark). */
  label?: ReactNode;
  /** Jacket front art / text. */
  children?: ReactNode;
  spinning?: boolean;
  /** Slide travel as a fraction of `size`. */
  pullRoom?: number;
  /** Controlled slide; omit to self-manage on hover. */
  pulled?: boolean;
  className?: string;
}

export function RecordSleeve({
  size = 260,
  label,
  children,
  spinning = false,
  pullRoom = 0.45,
  pulled,
  className,
}: RecordSleeveProps) {
  const reduced = useReducedMotion();
  const [hover, setHover] = useState(false);
  const controlled = pulled !== undefined;
  const isPulled = pulled ?? hover;

  const disc = Math.round(size * 0.88);
  const room = Math.round(size * pullRoom);
  // Reduced motion: a fixed partial peek, shown statically (no transition).
  const offset = reduced ? Math.round(room * 0.5) : isPulled ? room : 0;

  const handlers =
    reduced || controlled
      ? {}
      : { onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false) };

  return (
    <div
      className={cx("relative", className)}
      style={{ width: size + room, height: size }}
      {...handlers}
    >
      {/* the record, behind the jacket, emerging from the right edge */}
      <div
        aria-hidden="true"
        className="absolute top-1/2"
        style={
          {
            left: (size - disc) / 2,
            transform: `translate(${offset}px, -50%)`,
            transition: reduced ? undefined : "transform 0.6s var(--ease-analog)",
            willChange: "transform",
          } as CSSProperties
        }
      >
        <Vinyl size={disc} spinning={spinning} label={label} />
      </div>

      {/* the jacket on top */}
      <div className="absolute inset-y-0 left-0" style={{ width: size }}>
        <Sleeve hole>{children}</Sleeve>
      </div>
    </div>
  );
}
