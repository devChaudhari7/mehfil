"use client";

/*
 * BrowseCollection — the films + records lists for the era/language/region zones,
 * WINDOWED and self-sourced (Phase 25).
 *
 * Why it exists: the old server pages passed the whole filtered track array to
 * RecordGrid, which inlined every generative SVG sleeve into the prerendered HTML.
 * At 2,895 tracks that produced ~19 MB pages and broke Vercel's ISR size limit —
 * and it grew worse every week as the catalog ingest ran. This component instead
 * takes only a SOURCE DESCRIPTOR (kind + value), resolves the tracks itself from
 * the already-client-bundled `catalogRepository` (the crate + search already ship
 * it, so this costs nothing new), and renders only a capped window server-side —
 * "Show more" reveals the rest on the client. The prerendered HTML is now a small
 * constant regardless of how large the catalog grows.
 */
import { useMemo, useState } from "react";
import {
  catalogRepository,
  filmReleases,
  type EraDecade,
  type Language,
  type Region,
  type Track,
} from "@/lib/catalog";
import { Heading } from "@/components/ui";
import { ReleaseCard } from "./ReleaseCard";
import { TrackCard } from "./TrackCard";

export type CollectionSource =
  | { kind: "era"; value: EraDecade }
  | { kind: "language"; value: Language }
  | { kind: "region"; value: Region }
  | { kind: "all" };

const FILM_CAP = 48; // films shown before "show more"
const RECORD_CAP = 60; // records shown before "show more"
const STEP = 120; // reveal chunk size

function resolveTracks(source: CollectionSource): Track[] {
  switch (source.kind) {
    case "era":
      return catalogRepository.tracksByEra(source.value);
    case "language":
      return catalogRepository.tracksByLanguage(source.value);
    case "region":
      return catalogRepository.tracksByRegion(source.value);
    case "all":
      return catalogRepository.allTracks();
  }
}

function ShowMore({
  total,
  shown,
  noun,
  onMore,
  onAll,
}: {
  total: number;
  shown: number;
  noun: string;
  onMore: () => void;
  onAll: () => void;
}) {
  const remaining = total - shown;
  return (
    <div className="mt-9 flex items-center justify-center gap-5">
      <button
        type="button"
        data-magnet
        onClick={onMore}
        className="bg-btn text-btn-ink rounded-full px-6 py-3 font-mono text-xs tracking-[0.2em] uppercase transition-[filter,transform] duration-[var(--dur-1)] ease-[var(--ease-analog)] hover:brightness-110 active:translate-y-[1px]"
      >
        Show more {noun}
      </button>
      <button
        type="button"
        onClick={onAll}
        className="text-ink/55 hover:text-accent font-mono text-[11px] tracking-[0.18em] uppercase underline-offset-4 transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)] hover:underline"
      >
        All {remaining.toLocaleString()} →
      </button>
    </div>
  );
}

export function BrowseCollection({
  source,
  recordLabel,
}: {
  source: CollectionSource;
  recordLabel: string;
}) {
  const key = source.kind === "all" ? "all" : source.value;
  const tracks = useMemo(() => resolveTracks(source), [source.kind, key]); // eslint-disable-line react-hooks/exhaustive-deps
  const releases = useMemo(() => filmReleases(tracks), [tracks]);
  const [films, setFilms] = useState(FILM_CAP);
  const [records, setRecords] = useState(RECORD_CAP);

  return (
    <>
      {releases.length > 0 && (
        <section aria-label="Films">
          <Heading level={2}>Films ({releases.length.toLocaleString()})</Heading>
          <div className="stagger-grid mt-6 flex flex-wrap justify-center gap-6">
            {releases.slice(0, films).map((r) => (
              <ReleaseCard key={r.id} release={r} />
            ))}
          </div>
          {films < releases.length && (
            <ShowMore
              total={releases.length}
              shown={films}
              noun="films"
              onMore={() => setFilms((n) => Math.min(n + STEP, releases.length))}
              onAll={() => setFilms(releases.length)}
            />
          )}
        </section>
      )}

      <section aria-label="Records">
        <Heading level={2}>Records ({tracks.length.toLocaleString()})</Heading>
        <ul
          aria-label={recordLabel}
          className="stagger-grid mt-8 flex flex-wrap justify-center gap-x-6 gap-y-9"
        >
          {tracks.slice(0, records).map((t) => (
            <TrackCard key={t.id} track={t} queue={tracks} />
          ))}
        </ul>
        {records < tracks.length && (
          <ShowMore
            total={tracks.length}
            shown={records}
            noun="records"
            onMore={() => setRecords((n) => Math.min(n + STEP, tracks.length))}
            onAll={() => setRecords(tracks.length)}
          />
        )}
      </section>
    </>
  );
}
