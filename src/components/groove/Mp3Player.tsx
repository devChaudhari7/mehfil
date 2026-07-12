"use client";

/*
 * Mp3Player — the 2000s medium artifact (Phase 16): a brushed-metal digital
 * player with a glowing screen and a click wheel. Pure DOM/CSS like its era
 * siblings; the screen pulses softly while playing (gated by reduced motion).
 */
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cx } from "@/lib/cx";

export interface Mp3PlayerProps {
  spinning?: boolean; // "playing" — the screen breathes
  size?: number;
  className?: string;
}

export function Mp3Player({ spinning = false, size = 300, className }: Mp3PlayerProps) {
  const reduced = useReducedMotion();
  const animate = spinning && !reduced;
  const w = Math.round(size * 0.58);
  const h = Math.round(size * 0.94);
  const wheel = Math.round(w * 0.66);

  return (
    <div
      className={cx("relative grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Digital music player"
    >
      <div
        className="relative flex flex-col items-center"
        style={{
          width: w,
          height: h,
          borderRadius: Math.round(w * 0.14),
          background: "linear-gradient(160deg, #dde4ec 0%, #b7c2cd 55%, #96a3b0 100%)",
          boxShadow:
            "0 30px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -2px 6px rgba(0,0,0,0.25)",
        }}
      >
        {/* screen */}
        <div
          className="relative overflow-hidden"
          style={{
            width: "78%",
            height: "34%",
            marginTop: "9%",
            borderRadius: Math.round(w * 0.06),
            background: "linear-gradient(180deg, #10161d 0%, #182230 100%)",
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.5)",
          }}
        >
          {/* the glow of whatever is playing */}
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(70% 80% at 50% 60%, color-mix(in srgb, var(--accent) 34%, transparent), transparent 75%)",
              animation: animate ? "mp3-screen 2.4s ease-in-out infinite" : undefined,
              opacity: animate ? undefined : 0.55,
            }}
          />
          {/* tiny play glyph + level ticks */}
          <span
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: 0,
              height: 0,
              borderTop: "7px solid transparent",
              borderBottom: "7px solid transparent",
              borderLeft: "11px solid color-mix(in srgb, var(--ink) 85%, transparent)",
              opacity: 0.9,
            }}
          />
        </div>

        {/* click wheel */}
        <div
          className="absolute grid place-items-center rounded-full"
          style={{
            width: wheel,
            height: wheel,
            bottom: "7%",
            background:
              "radial-gradient(circle at 50% 42%, #f4f7fa 0%, #d5dde5 55%, #bcc7d2 100%)",
            boxShadow: "inset 0 2px 6px rgba(0,0,0,0.18), 0 1px 0 rgba(255,255,255,0.8)",
          }}
        >
          <span
            className="rounded-full"
            style={{
              width: "38%",
              height: "38%",
              background: "linear-gradient(180deg, #e8edf2, #c6d0da)",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
