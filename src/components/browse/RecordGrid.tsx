"use client";

/*
 * RecordGrid — a mobile-first wall of TrackCards. The whole set is the play queue,
 * so next/prev flow through the grid in display order. Used by the era / language /
 * region / artist routes (and as the spiral navigator's list parallel).
 */
import type { Track } from "@/lib/catalog";
import { cx } from "@/lib/cx";
import { TrackCard } from "./TrackCard";

export function RecordGrid({
  tracks,
  label,
  className,
}: {
  tracks: Track[];
  label?: string;
  className?: string;
}) {
  return (
    <ul
      aria-label={label}
      className={cx("stagger-grid flex flex-wrap justify-center gap-x-6 gap-y-9", className)}
    >
      {tracks.map((t) => (
        <TrackCard key={t.id} track={t} queue={tracks} />
      ))}
    </ul>
  );
}
