"use client";

/*
 * NowPlaying — title (native script first + Latin), artist, medium badge + RPM.
 * Shows the player's current track when there is one, otherwise the era's seed
 * specimen (so the hero always reads as music, even before first play).
 */
import { getEra } from "@/lib/eras";
import { NativeText } from "@/components/ui";
import { useEraStore } from "@/lib/useEraStore";
import { artistLine, usePlayerStore } from "@/lib/player/usePlayerStore";
import { cx } from "@/lib/cx";

export function NowPlaying({ className }: { className?: string }) {
  const era = useEraStore((s) => s.era);
  const current = usePlayerStore((s) => s.currentTrack);
  const cfg = getEra(era);

  const title = current
    ? { native: current.title.native, latin: current.title.latin, script: current.script }
    : { native: cfg.seed.native, latin: cfg.seed.latin, script: cfg.seed.script };
  const who = current ? artistLine(current) : cfg.seed.who;

  return (
    <div className={cx("flex flex-col items-center gap-3 text-center", className)}>
      <div className="flex items-center gap-2">
        <span className="text-ink/70 rounded-full border border-white/15 px-2.5 py-1 font-mono text-[11px] tracking-[0.12em]">
          {cfg.mediumLabel}
        </span>
        <span className="text-accent font-mono text-[11px] tracking-[0.14em]">{cfg.rpm}</span>
      </div>
      <NativeText
        native={title.native}
        latin={title.latin}
        script={title.script}
        size="h2"
        className="groove-display"
      />
      <p className="text-ink/60 font-mono text-[11px] tracking-[0.14em] uppercase">{who}</p>
    </div>
  );
}
