import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  catalogRepository,
  countsByEra,
  countsByLanguage,
  countsByRegion,
  ERA_DECADES,
  isPlayable,
  LANGUAGES,
  REGIONS,
  playableCount,
} from "@/lib/catalog";
import { Body, Heading, Mono, NativeText } from "@/components/ui";
import { DemoPlayButton } from "@/components/player/DemoPlayButton";

/*
 * Phase 2 debug route — proves the CatalogRepository + selectors.
 * Server component: reads the bundled seed through the repository and renders
 * counts by era / language / region + the playable() count. `playable()` reads
 * 0 until a real ingestion run resolves sourceIds — by design (no invented IDs).
 */
export const metadata: Metadata = {
  title: "Catalog — MEHFIL debug",
};

const tracks = catalogRepository.allTracks();
const artists = catalogRepository.allArtists();
const albums = catalogRepository.allAlbums();

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] p-5">
      <Mono className="text-accent">{label}</Mono>
      <div className="font-display text-ink mt-2 text-4xl tabular-nums">{value}</div>
    </div>
  );
}

function CountTable({
  caption,
  rows,
}: {
  caption: string;
  rows: ReadonlyArray<{ key: string; count: number }>;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] p-5">
      <Mono className="text-accent">{caption}</Mono>
      <dl className="mt-4 space-y-2">
        {rows.map((r) => (
          <div key={r.key} className="flex items-baseline justify-between gap-4">
            <dt className="text-ink/80 font-mono text-sm tracking-wide">{r.key}</dt>
            <dd className="text-ink font-display text-xl tabular-nums">{r.count}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function CatalogDebugPage() {
  const eraCounts = countsByEra(tracks);
  const languageCounts = countsByLanguage(tracks);
  const regionCounts = countsByRegion(tracks);
  const playable = playableCount(tracks);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
      <header className="max-w-2xl">
        <Mono className="text-accent">Mehfil · Phase 2 — Catalog data layer</Mono>
        <Heading level={1} className="mt-5">
          Catalog repository &amp; selectors
        </Heading>
        <Body className="text-ink/75 mt-4">
          Read through <code className="text-ink/90">CatalogRepository</code> over the seed{" "}
          <code className="text-ink/90">catalog.json</code>. Every track is{" "}
          <em>playable</em> only once ingestion resolves a real, embeddable upload — so the
          count below is 0 until a live API run fills the source IDs.
        </Body>
      </header>

      <section
        aria-label="Catalog totals"
        className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        <Stat label="Tracks" value={tracks.length} />
        <Stat label="Artists" value={artists.length} />
        <Stat label="Albums" value={albums.length} />
        <Stat label="Playable" value={playable} />
      </section>

      <section
        aria-label="Counts by facet"
        className="mt-6 grid gap-4 md:grid-cols-3"
      >
        <CountTable
          caption="By era"
          rows={ERA_DECADES.map((era) => ({ key: era, count: eraCounts[era] ?? 0 }))}
        />
        <CountTable
          caption="By language"
          rows={LANGUAGES.map((lang) => ({
            key: lang,
            count: languageCounts[lang] ?? 0,
          }))}
        />
        <CountTable
          caption="By region"
          rows={REGIONS.map((region) => ({
            key: region,
            count: regionCounts[region] ?? 0,
          }))}
        />
      </section>

      <section aria-label="All tracks" className="mt-12">
        <Heading level={2}>Tracks ({tracks.length})</Heading>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10">
                {["Play", "Title", "Era", "Language", "Region", "Resolved", "Embeddable"].map(
                  (h) => (
                    <th key={h} scope="col" className="px-4 py-3">
                      <Mono className="text-ink/60">{h}</Mono>
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {tracks.map((t) => {
                const resolved = t.sourceId !== "";
                return (
                  <tr
                    key={t.id}
                    className="border-b border-white/5 last:border-0 align-top"
                    data-playable={isPlayable(t)}
                  >
                    <td className="px-4 py-3">
                      <DemoPlayButton trackId={t.id} />
                    </td>
                    <td className="px-4 py-3">
                      <NativeText
                        native={t.title.native}
                        latin={t.title.latin}
                        script={t.script}
                        size="body"
                      />
                    </td>
                    <td className="text-ink/80 px-4 py-3 font-mono text-sm">{t.era}</td>
                    <td className="text-ink/80 px-4 py-3 font-mono text-sm">
                      {t.language}
                    </td>
                    <td className="text-ink/80 px-4 py-3 font-mono text-sm">{t.region}</td>
                    <td className="px-4 py-3 font-mono text-sm">
                      <span className={resolved ? "text-glow" : "text-ink/40"}>
                        {resolved ? "✓" : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">
                      <span className="text-ink/70">
                        {t.provenance.embeddable === null
                          ? "—"
                          : String(t.provenance.embeddable)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="text-ink/55 mt-12 max-w-2xl border-t border-white/10 pt-6 font-mono text-[11px] leading-relaxed">
        Backing store is <code className="text-ink/80">src/data/catalog.json</code> behind{" "}
        <code className="text-ink/80">CatalogRepository</code> (swappable for SQLite/Postgres
        later). Run <code className="text-ink/80">npm run ingest:dry</code> to preview the
        merge offline; a live run with a <code className="text-ink/80">YOUTUBE_API_KEY</code>{" "}
        resolves source IDs and lifts the playable count above 0. The{" "}
        <strong className="text-ink/80">Play</strong> buttons use a dev-only demo set (a few
        official videoIds, never written to <code className="text-ink/80">catalog.json</code>)
        to exercise the Phase 3 player until ingestion fills real sources.
      </footer>
    </main>
  );
}
