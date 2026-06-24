"use client";

/*
 * SearchResults — grouped, ranked results (Tracks / Albums / Artists). Tracks play
 * (gated PlayControl, queued by the track results); albums + artists link to their
 * Phase 5 routes. Everything renders in its own script + Latin via NativeText.
 * `onSelect` lets the ⌘K palette close after a choice.
 */
import type { ComponentType } from "react";
import Link from "next/link";
import { Disc3, Music2, User } from "lucide-react";
import { totalCount, type GroupedResults } from "@/lib/search";
import { scriptForLanguage } from "@/lib/fonts";
import { NativeText } from "@/components/ui";
import { PlayControl } from "@/components/browse/PlayControl";
import { artistLine } from "@/lib/player/usePlayerStore";

function SectionHeading({ icon: Icon, children }: { icon: ComponentType<{ size?: number; className?: string }>; children: string }) {
  return (
    <h2 className="text-accent flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] uppercase">
      <Icon size={13} />
      {children}
    </h2>
  );
}

export function SearchResults({
  results,
  query,
  onSelect,
}: {
  results: GroupedResults;
  query: string;
  onSelect?: () => void;
}) {
  const q = query.trim();
  if (!q) {
    return (
      <p className="text-ink/50 font-body text-sm">
        Search across scripts — titles, artists, and films, in Devanagari, Bengali, Gurmukhi,
        or romanized.
      </p>
    );
  }

  const total = totalCount(results);
  if (total === 0) {
    return (
      <p aria-live="polite" className="text-ink/60 font-body text-sm">
        No matches for “{query}”.
      </p>
    );
  }

  const playQueue = results.tracks.map((r) => r.track);

  return (
    <div className="space-y-8">
      <p aria-live="polite" className="sr-only">
        {total} result{total === 1 ? "" : "s"} for {query}
      </p>

      {results.tracks.length > 0 && (
        <section aria-label="Tracks">
          <SectionHeading icon={Music2}>Tracks</SectionHeading>
          <ul className="mt-3 divide-y divide-white/10">
            {results.tracks.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2.5">
                <PlayControl track={r.track} queue={playQueue} variant="icon" onActivate={onSelect} />
                <div className="min-w-0 flex-1">
                  <NativeText
                    native={r.track.title.native}
                    latin={r.track.title.latin}
                    script={r.track.script}
                    size="body"
                  />
                </div>
                <span className="text-ink/50 hidden shrink-0 font-mono text-[11px] tracking-wide sm:block">
                  {artistLine(r.track)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.albums.length > 0 && (
        <section aria-label="Albums">
          <SectionHeading icon={Disc3}>Albums</SectionHeading>
          <ul className="mt-3 divide-y divide-white/10">
            {results.albums.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/album/${r.id}`}
                  onClick={onSelect}
                  className="hover:text-accent flex items-center justify-between gap-3 py-2.5"
                >
                  <span className="font-display truncate">{r.release.film}</span>
                  <span className="text-ink/50 shrink-0 font-mono text-[11px] tabular-nums">
                    {r.release.year}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.artists.length > 0 && (
        <section aria-label="Artists">
          <SectionHeading icon={User}>Artists</SectionHeading>
          <ul className="mt-3 divide-y divide-white/10">
            {results.artists.map((r) => (
              <li key={r.id}>
                <Link href={`/artist/${r.id}`} onClick={onSelect} className="hover:text-accent block py-2.5">
                  {r.artist.name.native ? (
                    <NativeText
                      native={r.artist.name.native}
                      latin={r.artist.name.latin}
                      script={scriptForLanguage(r.artist.language)}
                      size="body"
                    />
                  ) : (
                    <span className="font-display">{r.artist.name.latin}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
