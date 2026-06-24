"use client";

/*
 * Needle — the playhead riding the groove. Its angle tracks playback PROGRESS via
 * the interpolated clock (not the raw 250ms steps), updated imperatively in a rAF
 * loop so there are no per-frame React renders. Visible for disc eras; fades for
 * cassette/CD. Under reduced motion / Tier C it's positioned statically (no loop).
 */
import { useEffect, useRef } from "react";
import type { InterpolatedClock } from "@/lib/useInterpolatedTime";

export interface NeedleProps {
  clock: InterpolatedClock;
  visible: boolean;
  animated: boolean;
  size: number;
}

const angleFor = (p: number) => -27 + Math.min(Math.max(p, 0), 1) * 18;

export function Needle({ clock, visible, animated, size }: NeedleProps) {
  const armRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apply = (p: number) => {
      if (armRef.current) armRef.current.style.transform = `rotate(${angleFor(p)}deg)`;
    };
    if (!animated) {
      apply(clock.getProgress());
      return;
    }
    let raf = 0;
    const loop = () => {
      apply(clock.getProgress());
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [animated, clock]);

  const arm = Math.round(size * 0.46);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-[1%] right-[4%]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity var(--morph-dur) var(--ease-analog)" }}
    >
      <div ref={armRef} style={{ transformOrigin: "top right", transform: "rotate(-27deg)" }}>
        <div
          style={{
            width: arm,
            height: 6,
            borderRadius: 6,
            background:
              "linear-gradient(90deg, color-mix(in srgb, var(--ink) 65%, #000), color-mix(in srgb, var(--ink) 35%, #000))",
            boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
          }}
        />
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 4,
            marginLeft: arm - 12,
            marginTop: -4,
            background: "var(--accent)",
            boxShadow: "0 0 10px var(--glow)",
          }}
        />
      </div>
    </div>
  );
}
