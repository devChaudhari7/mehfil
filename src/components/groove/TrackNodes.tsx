"use client";

/*
 * TrackNodes — the current era's tracks rendered on the groove (Phase 4
 * instruction #3: DISPLAY all tracks from catalog metadata; gate only PLAYBACK on
 * a resolved sourceId). Playable tracks become the queue so next/prev work; the
 * Phase 3 dev demo overlay supplies a few real sourceIds until a live ingest runs.
 */
import { useMemo } from "react";
import { getEra } from "@/lib/eras";
import { catalogRepository, isPlayable, type EraDecade, type Track } from "@/lib/catalog";
import { getDemoTracks } from "@/lib/audio";
import { usePlayerStore } from "@/lib/player/usePlayerStore";
import { useSoundStore } from "@/lib/sound/useSoundStore";
import { playNeedleDrop } from "@/lib/sound/sfx";
import { useEraStore } from "@/lib/useEraStore";
import { scriptFont } from "@/lib/fonts";
import { cx } from "@/lib/cx";

const demoMap = new Map(getDemoTracks().map((t) => [t.id, t] as const));
const effective = (t: Track): Track => demoMap.get(t.id) ?? t;

export function TrackNodes({ className }: { className?: string }) {
  const era = useEraStore((s) => s.era);
  const decade = getEra(era).decade as EraDecade;
  const tracks = useMemo(() => catalogRepository.tracksByEra(decade), [decade]);
  const currentId = usePlayerStore((s) => s.currentTrack?.id);

  function play(track: Track) {
    const queue = tracks.map(effective).filter(isPlayable);
    const index = queue.findIndex((t) => t.id === track.id);
    if (index < 0) return;
    useSoundStore.getState().unlock();
    usePlayerStore.getState().setQueue(queue, index);
    usePlayerStore.getState().playQueueAt(index);
    playNeedleDrop();
  }

  return (
    <ul
      aria-label={`${decade} tracks`}
      className={cx("flex max-h-28 flex-wrap justify-center gap-2 overflow-y-auto", className)}
    >
      {tracks.map((t) => {
        const canPlay = isPlayable(effective(t));
        const font = scriptFont(t.script);
        const isCurrent = currentId === t.id;
        return (
          <li key={t.id}>
            <button
              type="button"
              disabled={!canPlay}
              onClick={() => play(t)}
              aria-label={canPlay ? `Play ${t.title.latin}` : `${t.title.latin} — no source yet`}
              title={canPlay ? "Play" : "No source yet — run a live ingest"}
              className={cx(
                "rounded-full border px-3 py-1.5 text-sm transition-[background-color,color] duration-200",
                canPlay
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
