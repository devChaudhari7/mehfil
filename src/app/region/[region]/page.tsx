import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  catalogRepository,
  filmReleases,
  REGIONS,
  representativeEra,
  type Region,
} from "@/lib/catalog";
import { Heading, Mono } from "@/components/ui";
import { BrowseShell, RecordGrid, ReleaseCard, SetEra } from "@/components/browse";

/*
 * /region/[region] — browse by region (India · the West). Zone palette settles on
 * the region's most-common era. Statically generated for both regions.
 */
const LABEL: Record<Region, string> = {
  india: "India",
  west: "The West",
};

export function generateStaticParams() {
  return REGIONS.map((region) => ({ region }));
}

function isRegion(region: string): region is Region {
  return (REGIONS as readonly string[]).includes(region);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string }>;
}): Promise<Metadata> {
  const { region } = await params;
  return { title: isRegion(region) ? `${LABEL[region]} — MEHFIL` : "MEHFIL" };
}

export default async function RegionPage({ params }: { params: Promise<{ region: string }> }) {
  const { region } = await params;
  if (!isRegion(region)) notFound();

  const tracks = catalogRepository.tracksByRegion(region);
  const releases = filmReleases(tracks);

  return (
    <>
      <SetEra era={representativeEra(tracks)} />
      <BrowseShell
        header={
          <>
            <Mono className="text-accent">Region</Mono>
            <Heading level={1} className="mt-4">
              {LABEL[region]}
            </Heading>
            <p className="text-ink/70 mt-3 font-body">{tracks.length} records from the region.</p>
          </>
        }
      >
        {releases.length > 0 && (
          <section aria-label="Films">
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
          <RecordGrid tracks={tracks} label={`${LABEL[region]} records`} className="mt-8" />
        </section>
      </BrowseShell>
    </>
  );
}
