"use client";

/*
 * TrackCard — one track as a record-in-a-sleeve (Phase 5 browse grids). The jacket
 * shows a minimalist cover (year + language); the title renders below in its own
 * script + Latin; the record spins when this track is the one playing. Playback is
 * gated; the record pull-out is the Phase 1 RecordSleeve hover interaction.
 */
import type { Track } from "@/lib/catalog";
import { decadeToEraId } from "@/lib/catalog";
import { getEra } from "@/lib/eras";
import { RecordArt } from "@/components/art";
import { usePlayerStore } from "@/lib/player/usePlayerStore";
import { cx } from "@/lib/cx";
import { RecordSleeve } from "./RecordSleeve";
import { PlayControl } from "./PlayControl";

export interface TrackCardProps {
  track: Track;
  /** The collection this card plays within (becomes the queue). */
  queue: Track[];
  size?: number;
  className?: string;
}

export function TrackCard({ track, queue, size = 180, className }: TrackCardProps) {
  const currentId = usePlayerStore((s) => s.currentTrack?.id);
  const status = usePlayerStore((s) => s.status);
  const isCurrent = currentId === track.id;
  const spinning = isCurrent && status === "playing";
  const rpm = getEra(decadeToEraId(track.era)).rpm;

  return (
    <li className={cx("flex flex-col items-center gap-3", className)}>
      <RecordSleeve size={size} pullRoom={0.24} label={rpm} spinning={spinning} bleed>
        <RecordArt subject={{ track }} variant="sleeve" />
      </RecordSleeve>

      <div className="flex flex-col items-center gap-2 text-center" style={{ maxWidth: size }}>
        <PlayControl track={track} queue={queue} />
      </div>
    </li>
  );
}
