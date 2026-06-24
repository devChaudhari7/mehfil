/*
 * MEHFIL — films-as-albums (Phase 5, runtime-derived).
 *
 * The seed catalog has no `Album` rows (and no curated `albumId`s), but golden-age
 * Hindi tracks carry a `film`, and in that era the film soundtrack *is* the album.
 * So we derive album-like "releases" from `track.film` purely at read time — we do
 * NOT write them into catalog.json (that keeps the ingest merge contract clean and
 * invents no data). Tracks with no film are standalone singles (Western / Punjabi /
 * Bengali here) and surface as records on artist/era pages, never as albums.
 *
 * Pure + dependency-light so it's trivially testable and reusable from server
 * components (the /album route) and the spiral navigator alike.
 */
import { DEFAULT_ERA, type EraId } from "@/lib/eras";
import { countsByEra, decadeToEraId } from "./selectors";
import { ERA_DECADES, type EraDecade, type Language, type Region, type Track } from "./types";

export interface Release {
  /** URL-stable slug, `${slug(film)}-${year}` (year disambiguates same-named films). */
  id: string;
  film: string;
  year: number;
  era: EraDecade;
  language: Language;
  region: Region;
  /** Union of the contributing tracks' artist ids, order-preserved + de-duped. */
  artistIds: string[];
  trackIds: string[];
}

/** Lowercase, ASCII-fold, hyphenate — for stable, readable route params. */
export function slug(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "") // fold accents (é→e) before hyphenating
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Stable release id from a film + year. */
export function releaseId(film: string, year: number): string {
  return `${slug(film)}-${year}`;
}

/**
 * Group film-bearing tracks into releases, keyed by (film, year). Sorted by year
 * then film for deterministic output (route generation, navigator order).
 */
export function filmReleases(tracks: Track[]): Release[] {
  const map = new Map<string, Release>();
  for (const t of tracks) {
    if (!t.film) continue;
    const id = releaseId(t.film, t.year);
    let rel = map.get(id);
    if (!rel) {
      rel = {
        id,
        film: t.film,
        year: t.year,
        era: t.era,
        language: t.language,
        region: t.region,
        artistIds: [],
        trackIds: [],
      };
      map.set(id, rel);
    }
    rel.trackIds.push(t.id);
    for (const a of t.artists) {
      if (!rel.artistIds.includes(a)) rel.artistIds.push(a);
    }
  }
  return [...map.values()].sort((a, b) => a.year - b.year || a.film.localeCompare(b.film));
}

export function getRelease(tracks: Track[], id: string): Release | undefined {
  return filmReleases(tracks).find((r) => r.id === id);
}

/** Film-less tracks — standalone singles (not part of any derived release). */
export function standaloneSingles(tracks: Track[]): Track[] {
  return tracks.filter((t) => !t.film);
}

/**
 * The era zone a mixed track set should paint in: the most frequent era, ties
 * broken toward the earlier decade (canonical ERA_DECADES order). Used by
 * artist/album/language/region pages to pick `[data-era]`. Empty set → default.
 */
export function representativeEra(tracks: Track[]): EraId {
  if (tracks.length === 0) return DEFAULT_ERA;
  const counts = countsByEra(tracks);
  let best: EraDecade = ERA_DECADES[0];
  for (const era of ERA_DECADES) {
    if ((counts[era] ?? 0) > (counts[best] ?? 0)) best = era;
  }
  return decadeToEraId(best);
}
