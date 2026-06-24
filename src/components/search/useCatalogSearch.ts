"use client";

/*
 * useCatalogSearch — builds the search index once (over the bundled catalog +
 * films-as-albums) and runs searchCatalog for the given query. Both surfaces (the
 * /search route and the ⌘K palette) consume this so matching/ranking stay identical.
 */
import { useMemo } from "react";
import { catalogRepository, filmReleases } from "@/lib/catalog";
import { buildIndex, searchCatalog, type GroupedResults } from "@/lib/search";

export function useCatalogSearch(query: string): GroupedResults {
  const index = useMemo(() => {
    const tracks = catalogRepository.allTracks();
    return buildIndex(tracks, catalogRepository.allArtists(), filmReleases(tracks));
  }, []);
  return useMemo(() => searchCatalog(index, query), [index, query]);
}
