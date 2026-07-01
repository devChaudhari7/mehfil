import type { MetadataRoute } from "next";
import {
  catalogRepository,
  ERA_DECADES,
  filmReleases,
  LANGUAGES,
  REGIONS,
} from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const tracks = catalogRepository.allTracks();
  const now = new Date();
  const at = (path: string): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
  });

  return [
    ...["/", "/browse", "/catalog", "/search", "/now-playing"].map(at),
    ...ERA_DECADES.map((d) => at(`/era/${d}`)),
    ...LANGUAGES.map((l) => at(`/language/${l}`)),
    ...REGIONS.map((r) => at(`/region/${r}`)),
    ...filmReleases(tracks).map((r) => at(`/album/${r.id}`)),
    ...catalogRepository.allArtists().map((a) => at(`/artist/${a.id}`)),
  ];
}
