import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  catalogRepository,
  decadeToEraId,
  ERA_DECADES,
  filmReleases,
  type EraDecade,
} from "@/lib/catalog";
import { getEra } from "@/lib/eras";
import { Heading, Mono } from "@/components/ui";
import { BrowseShell, EraDial, RecordGrid, ReleaseCard, SetEra } from "@/components/browse";

/*
 * /era/[decade] — the era zone. The dial tunes between decades; selecting one
 * morphs the whole stage to that era's palette (SetEra) and lists its records +
 * films. Statically generated for all five decades. Display is ungated; only
 * playback is gated (RecordGrid → PlayControl), until a live ingest fills sources.
 */
export function generateStaticParams() {
  return ERA_DECADES.map((decade) => ({ decade }));
}

function isDecade(decade: string): decade is EraDecade {
  return (ERA_DECADES as readonly string[]).includes(decade);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ decade: string }>;
}): Promise<Metadata> {
  const { decade } = await params;
  return { title: isDecade(decade) ? `The ${decade} — MEHFIL` : "MEHFIL" };
}

export default async function EraPage({ params }: { params: Promise<{ decade: string }> }) {
  const { decade } = await params;
  if (!isDecade(decade)) notFound();

  const eraId = decadeToEraId(decade);
  const cfg = getEra(eraId);
  const tracks = catalogRepository.tracksByEra(decade);
  const releases = filmReleases(tracks);

  return (
    <>
      <SetEra era={eraId} />
      <BrowseShell
        header={
          <>
            <Mono className="text-accent">
              {cfg.mediumLabel} · {cfg.rpm}
            </Mono>
            <Heading level={1} className="mt-4">
              The {decade}
            </Heading>
            <p className="text-ink/70 mt-3 font-body">
              {tracks.length} records · {cfg.soundTexture}. Turn the dial to travel the eras.
            </p>
          </>
        }
      >
        <section aria-label="Tuner" className="flex justify-center">
          <EraDial />
        </section>

        {releases.length > 0 && (
          <section aria-label="Films in this era">
            <Heading level={2}>Films</Heading>
            <div className="stagger-grid mt-6 flex flex-wrap justify-center gap-6">
              {releases.map((r) => (
                <ReleaseCard key={r.id} release={r} />
              ))}
            </div>
          </section>
        )}

        <section aria-label="Records">
          <Heading level={2}>Records</Heading>
          <RecordGrid tracks={tracks} label={`${decade} records`} className="mt-8" />
        </section>
      </BrowseShell>
    </>
  );
}
