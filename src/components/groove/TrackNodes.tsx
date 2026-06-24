"use client";

/*
 * TrackNodes — the current era's tracks rendered on the groove (Phase 4
 * instruction #3: DISPLAY all tracks from catalog metadata; gate only PLAYBACK on
 * a resolved sourceId). Playable tracks become the queue so next/prev work; the
 * Phase 3 dev demo overlay supplies a few real sourceIds until a live ingest runs.
 */
import { useMemo } from "react";
import { getEra } from "@/lib/eras";
import { catalogRepository, type EraDecade } from "@/lib/catalog";
import { usePlayerStore } from "@/lib/player/usePlayerStore";
import { canPlay, playFromCollection } from "@/lib/player/playFromCollection";
import { useEraStore } from "@/lib/useEraStore";
import { scriptFont } from "@/lib/fonts";
import { cx } from "@/lib/cx";

export function TrackNodes({ className }: { className?: string }) {
  const era = useEraStore((s) => s.era);
  const decade = getEra(era).decade as EraDecade;
  const tracks = useMemo(() => catalogRepository.tracksByEra(decade), [decade]);
  const currentId = usePlayerStore((s) => s.currentTrack?.id);

  return (
    <ul
      aria-label={`${decade} tracks`}
      className={cx(
        "flex h-24 flex-wrap content-start justify-center gap-2 overflow-y-auto sm:h-28",
        className,
      )}
    >
      {tracks.map((t) => {
        const playable = canPlay(t);
        const font = scriptFont(t.script);
        const isCurrent = currentId === t.id;
        return (
          <li key={t.id}>
            <button
              type="button"
              disabled={!playable}
              onClick={() => playFromCollection(tracks, t)}
              aria-label={playable ? `Play ${t.title.latin}` : `${t.title.latin} — no source yet`}
              title={playable ? "Play" : "No source yet — run a live ingest"}
              className={cx(
                "rounded-full border px-3 py-1.5 text-sm transition-[background-color,color] duration-200",
                playable
                  ? "text-ink cursor-pointer border-white/15 hover:bg-white/10"
                  : "text-ink/30 cursor-not-allowed border-white/5",
                isCurrent && "bg-btn text-btn-ink border-transparent",
              )}
            >
              <span lang={t.script === "latin" ? "en" : undefined} className={font.display}>
                {t.title.native}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
