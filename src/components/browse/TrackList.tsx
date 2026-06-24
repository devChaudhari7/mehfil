"use client";

/*
 * TrackList — a calm, conventional tracklist (Phase 5). The accessible "Browse as
 * list" parallel and the album page's tracklist: numbered rows, native + Latin
 * title, artist line, gated icon play. Playing any row queues the whole list.
 */
import type { Track } from "@/lib/catalog";
import { NativeText } from "@/components/ui";
import { artistLine, usePlayerStore } from "@/lib/player/usePlayerStore";
import { cx } from "@/lib/cx";
import { PlayControl } from "./PlayControl";

export function TrackList({
  tracks,
  queue,
  className,
}: {
  tracks: Track[];
  /** Queue context if different from `tracks` (defaults to `tracks`). */
  queue?: Track[];
  className?: string;
}) {
  const q = queue ?? tracks;
  const currentId = usePlayerStore((s) => s.currentTrack?.id);

  return (
    <ol className={cx("divide-y divide-white/10", className)}>
      {tracks.map((t, i) => {
        const isCurrent = currentId === t.id;
        return (
          <li
            key={t.id}
            className={cx(
              "flex items-center gap-4 px-2 py-3 transition-colors",
              isCurrent && "bg-white/[0.04]",
            )}
          >
            <span className="text-ink/40 w-6 text-right font-mono text-xs tabular-nums">
              {i + 1}
            </span>
            <PlayControl track={t} queue={q} variant="icon" />
            <div className="min-w-0 flex-1">
              <NativeText
                native={t.title.native}
                latin={t.title.latin}
                script={t.script}
                size="body"
              />
            </div>
            <span className="text-ink/50 hidden font-mono text-[11px] tracking-wide sm:block">
              {artistLine(t)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
