import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  catalogRepository,
  decadeToEraId,
  ERA_DECADES,
  type EraDecade,
} from "@/lib/catalog";
import { getEra } from "@/lib/eras";
import { Heading, Mono } from "@/components/ui";
import { BrowseCollection, BrowseShell, EraDial, SetEra } from "@/components/browse";

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
  const trackCount = catalogRepository.tracksByEra(decade).length;

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
              {trackCount} records · {cfg.soundTexture}. Turn the dial to travel the eras.
            </p>
          </>
        }
      >
        <section aria-label="Tuner" className="flex justify-center">
          <EraDial />
        </section>

        <BrowseCollection source={{ kind: "era", value: decade }} recordLabel={`${decade} records`} />
      </BrowseShell>
    </>
  );
}
