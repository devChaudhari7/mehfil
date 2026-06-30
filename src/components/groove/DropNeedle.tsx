"use client";

/*
 * DropNeedle — the heart of the vinyl universe (Phase 14). Reaching the centre and
 * dropping the needle is not the END of the journey, it's the DOOR into Exploration Mode:
 *   • before: a breathing "Drop the needle" plays a signature track of the era you scrolled to.
 *   • after:  the player has awoken, and the world opens into paths — the artist, the
 *             album/film, the era, the deck — so the climax unlocks the next chapter.
 * Reuses playFromCollection (audio unlock + needle-drop + queue); follows the scroll era.
 */
import { useMemo } from "react";
import { Compass, Pause, Play } from "lucide-react";
import { catalogRepository, releaseId } from "@/lib/catalog";
import { getEra } from "@/lib/eras";
import { useEraStore } from "@/lib/useEraStore";
import { usePlayerStore } from "@/lib/player/usePlayerStore";
import { canPlay, playFromCollection } from "@/lib/player/playFromCollection";
import { GrooveLink } from "@/components/GrooveLink";
import { cx } from "@/lib/cx";

function Path({ href, label }: { href: string; label: string }) {
  return (
    <GrooveLink
      href={href}
      className="text-ink/75 hover:text-accent border-b border-transparent pb-0.5 transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)] hover:border-accent/60"
    >
      {label}
    </GrooveLink>
  );
}

export function DropNeedle() {
  const era = useEraStore((s) => s.era);
  const decade = getEra(era).decade;
  const track = usePlayerStore((s) => s.currentTrack);
  const playing = usePlayerStore((s) => s.status === "playing");

  const { tracks, signature } = useMemo(() => {
    const all = catalogRepository.allTracks().filter((t) => t.era === decade);
    return { tracks: all, signature: all.find((t) => canPlay(t)) ?? all[0] };
  }, [decade]);

  // EXPLORATION MODE — the needle has dropped; the world opens into paths.
  if (track) {
    const artistId = track.artists[0];
    const artist = artistId ? catalogRepository.getArtist(artistId) : undefined;
    const albumId = track.film ? releaseId(track.film, track.year) : undefined;
    return (
      <div className="flex w-[min(92vw,640px)] flex-col items-center gap-3.5 text-center">
        <button
          type="button"
          onClick={() => usePlayerStore.getState().togglePlay()}
          aria-label={playing ? "Pause" : "Play"}
          className="bg-btn text-btn-ink inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-mono text-[11px] tracking-[0.2em] uppercase transition-[filter,transform] duration-[var(--dur-1)] ease-[var(--ease-analog)] hover:brightness-110 active:translate-y-[1px]"
        >
          {playing ? <Pause size={13} /> : <Play size={13} />}
          <span className="max-w-[44vw] truncate normal-case tracking-normal">
            {track.title.latin}
          </span>
        </button>

        <div className="text-ink/80 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[11px] tracking-[0.14em]">
          <span className="text-ink/40 inline-flex items-center gap-1.5 uppercase">
            <Compass size={12} /> Explore
          </span>
          {artist && <Path href={`/artist/${artist.id}`} label={artist.name.latin} />}
          {albumId && track.film && <Path href={`/album/${albumId}`} label={track.film} />}
          <Path href={`/era/${decade}`} label={decade} />
          <Path href="/now-playing" label="The deck" />
        </div>
      </div>
    );
  }

  // BEFORE — drop the needle on the era you've traveled to.
  if (!signature) return null;
  const playable = canPlay(signature);
  return (
    <div className="flex flex-col items-center gap-2.5 text-center">
      <button
        type="button"
        onClick={() => signature && playFromCollection(tracks, signature)}
        disabled={!playable}
        aria-label={playable ? `Drop the needle and play ${signature.title.latin}` : "No source yet"}
        className={cx(
          "bg-btn text-btn-ink inline-flex items-center gap-2 rounded-full px-7 py-3 font-mono text-xs tracking-[0.22em] uppercase transition-[filter,transform] duration-[var(--dur-1)] ease-[var(--ease-analog)]",
          playable
            ? "cta-breathe cursor-pointer hover:brightness-110 active:translate-y-[2px]"
            : "cursor-not-allowed opacity-50",
        )}
      >
        <Play size={14} /> Drop the needle
      </button>
      <p className="text-ink/55 font-mono text-[11px] tracking-[0.14em]">
        {decade} · {signature.title.latin}
      </p>
    </div>
  );
}
