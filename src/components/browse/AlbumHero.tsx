"use client";

/*
 * AlbumHero — the films-as-album record-in-sleeve, the signature "pull the record
 * out of the sleeve" object on /album/[id]. Responsive + CLS-safe: a fixed-height
 * stage reserves the space, and the px sleeve size is measured from the container
 * (mirrors the GrooveStage pattern) so it scales 360→1440 without reflow. The
 * record spins when a track from this release is the one playing.
 */
import { useEffect, useRef, useState } from "react";
import type { Release } from "@/lib/catalog";
import { usePlayerStore } from "@/lib/player/usePlayerStore";
import { RecordArt } from "@/components/art";
import { RecordSleeve } from "./RecordSleeve";

const PULL_ROOM = 0.45;

export function AlbumHero({ release, rpm }: { release: Release; rpm: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);
  const currentId = usePlayerStore((s) => s.currentTrack?.id);
  const status = usePlayerStore((s) => s.status);
  const spinning =
    !!currentId && release.trackIds.includes(currentId) && status === "playing";

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
        <div style={{ viewTransitionName: "groove-record" }}>
          <RecordSleeve size={size} pullRoom={PULL_ROOM} label={rpm} spinning={spinning} bleed>
            <RecordArt subject={{ release }} size="lg" variant="sleeve" decorativeTitle />
          </RecordSleeve>
        </div>
      )}
    </div>
  );
}
