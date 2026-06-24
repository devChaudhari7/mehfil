"use client";

/*
 * AlbumHero — the films-as-album record-in-sleeve, the signature "pull the record
 * out of the sleeve" object on /album/[id]. Responsive + CLS-safe: a fixed-height
 * stage reserves the space, and the px sleeve size is measured from the container
 * (mirrors the GrooveStage pattern) so it scales 360→1440 without reflow. The
 * record spins when a track from this release is the one playing.
 */
import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "@/lib/player/usePlayerStore";
import { RecordSleeve } from "./RecordSleeve";

const PULL_ROOM = 0.45;

export function AlbumHero({
  film,
  year,
  rpm,
  trackIds,
}: {
  film: string;
  year: number;
  rpm: string;
  trackIds: string[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);
  const currentId = usePlayerStore((s) => s.currentTrack?.id);
  const status = usePlayerStore((s) => s.status);
  const spinning = !!currentId && trackIds.includes(currentId) && status === "playing";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w) setSize(Math.min(320, Math.floor(w / (1 + PULL_ROOM))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="flex w-full items-center justify-center"
      style={{ height: "min(86vw, 360px)" }}
    >
      {size > 0 && (
        <RecordSleeve size={size} pullRoom={PULL_ROOM} label={rpm} spinning={spinning}>
          <div className="text-ink">
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase opacity-70">
              Film soundtrack
            </span>
            <div className="font-display mt-2 text-2xl leading-tight">{film}</div>
            <div className="font-mono mt-2 text-sm tabular-nums opacity-70">{year}</div>
          </div>
        </RecordSleeve>
      )}
    </div>
  );
}
