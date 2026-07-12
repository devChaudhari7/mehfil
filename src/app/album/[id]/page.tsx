import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  catalogRepository,
  decadeToEraId,
  filmReleases,
  getRelease,
  type Track,
} from "@/lib/catalog";
import { getEra } from "@/lib/eras";
import { Heading, Mono } from "@/components/ui";
import { BrowseShell, SetEra } from "@/components/browse";
import { Gatefold } from "@/components/browse/Gatefold";

/*
 * /album/[id] — a film soundtrack as an album (films-as-albums, derived at read
 * time; see lib/catalog/albums.ts). The signature "pull the record out of the
 * sleeve" object sits above the tracklist; playing any track queues the album.
 * Statically generated for every derived release.
 */
const allTracks = catalogRepository.allTracks();

export function generateStaticParams() {
  return filmReleases(allTracks).map((r) => ({ id: r.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const release = getRelease(allTracks, id);
  return { title: release ? `${release.film} (${release.year}) — MEHFIL` : "MEHFIL" };
}

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const release = getRelease(allTracks, id);
  if (!release) notFound();

  const tracks = release.trackIds
    .map((tid) => catalogRepository.getTrack(tid))
    .filter((t): t is Track => Boolean(t));
  const cfg = getEra(decadeToEraId(release.era));
  const artists = release.artistIds
    .map((aid) => catalogRepository.getArtist(aid))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  return (
    <>
      <SetEra era={decadeToEraId(release.era)} />
      <BrowseShell
        header={
          <>
            <Mono className="text-accent">
              Film soundtrack · {cfg.mediumLabel} · {cfg.rpm}
            </Mono>
            <Heading level={1} className="mt-4">
              {release.film}
            </Heading>
            <p className="text-ink/70 mt-3 font-body">
              {release.year} ·{" "}
              {artists.map((a, i) => (
                <span key={a.id}>
                  {i > 0 && ", "}
                  <Link href={`/artist/${a.id}`} className="hover:text-accent underline-offset-4 hover:underline">
                    {a.name.latin}
                  </Link>
                </span>
              ))}
            </p>
          </>
        }
      >
        {/* the gatefold: cover opens on its hinge → liner notes + the pressing
            sheet inside; the vinyl slides out (Phase 18 · Archive + Instrument) */}
        <section aria-label="The record" className="flex justify-center py-6">
          <Gatefold release={release} tracks={tracks} rpm={cfg.rpm} />
        </section>
      </BrowseShell>
    </>
  );
}
