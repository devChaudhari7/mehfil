import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalogRepository, filmReleases, representativeEra } from "@/lib/catalog";
import { scriptForLanguage } from "@/lib/fonts";
import { Body, Heading, Mono, NativeText } from "@/components/ui";
import { BrowseShell, SetEra } from "@/components/browse";
import { RetroWall } from "@/components/browse/RetroWall";

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
            <Mono className="text-accent">
              A retrospective · {artist.region === "west" ? "the West" : "India"}
            </Mono>
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
              in {releases.length + tracks.filter((t) => !t.film).length} parts ·{" "}
              {tracks.length} {tracks.length === 1 ? "recording" : "recordings"}
            </p>
          </>
        }
      >
        {/* the wall: films + singles interleaved by year, each in its era's light */}
        <section aria-label="The retrospective">
          <RetroWall releases={releases} tracks={tracks} />
        </section>
      </BrowseShell>
    </>
  );
}
