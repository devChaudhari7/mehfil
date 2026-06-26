import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalogRepository, filmReleases, representativeEra } from "@/lib/catalog";
import { scriptForLanguage } from "@/lib/fonts";
import { Body, Heading, Mono, NativeText } from "@/components/ui";
import { BrowseShell, RecordGrid, ReleaseCard, SetEra } from "@/components/browse";

/*
 * /artist/[id] — an artist's records, in the era zone they belong to. Statically
 * generated for every catalog artist. Native name renders in its own script (from
 * the artist's language) with Latin beneath.
 */

export function generateStaticParams() {
  return catalogRepository.allArtists().map((a) => ({ id: a.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const artist = catalogRepository.getArtist(id);
  return { title: artist ? `${artist.name.latin} — MEHFIL` : "MEHFIL" };
}

export default async function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = catalogRepository.getArtist(id);
  if (!artist) notFound();

  const tracks = catalogRepository.allTracks().filter((t) => t.artists.includes(id));
  const releases = filmReleases(tracks);
  const era = tracks.length > 0 ? representativeEra(tracks) : undefined;

  return (
    <>
      {era && <SetEra era={era} />}
      <BrowseShell
        header={
          <>
            <Mono className="text-accent">Artist · {artist.region === "west" ? "West" : "India"}</Mono>
            <div className="mt-4">
              {artist.name.native ? (
                <NativeText
                  native={artist.name.native}
                  latin={artist.name.latin}
                  script={scriptForLanguage(artist.language)}
                  size="h1"
                />
              ) : (
                <Heading level={1}>{artist.name.latin}</Heading>
              )}
            </div>
            {artist.bio && <Body className="text-ink/70 mt-3">{artist.bio}</Body>}
            <p className="text-ink/55 mt-3 font-mono text-xs tracking-wide">
              {tracks.length} {tracks.length === 1 ? "record" : "records"}
            </p>
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
          <RecordGrid tracks={tracks} label={`${artist.name.latin} records`} className="mt-8" />
        </section>
      </BrowseShell>
    </>
  );
}
