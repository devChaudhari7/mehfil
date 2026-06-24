/*
 * MEHFIL — catalog selectors (pure, dependency-free).
 *
 * Counts/filters used by the /catalog debug route and future browse pages.
 * Kept pure (operate on Track[]) so they are trivially testable and reusable
 * whether tracks come from the JSON repository now or a DB later.
 */
import type { EraId } from "@/lib/eras";
import type { EraDecade, Language, Region, Track } from "./types";

/**
 * A track is *playable* once ingestion has resolved a real, embeddable upload.
 * Until a real API run fills these, every seed track is correctly non-playable.
 */
export function isPlayable(track: Track): boolean {
  return track.sourceId !== "" && track.provenance.embeddable === true;
}

export function playableTracks(tracks: Track[]): Track[] {
  return tracks.filter(isPlayable);
}

export function playableCount(tracks: Track[]): number {
  return playableTracks(tracks).length;
}

/** Generic counter that honors `noUncheckedIndexedAccess`. */
export function countBy<K extends string>(
  tracks: Track[],
  key: (t: Track) => K,
): Record<K, number> {
  const out = {} as Record<K, number>;
  for (const track of tracks) {
    const k = key(track);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

export const countsByEra = (tracks: Track[]): Record<EraDecade, number> =>
  countBy(tracks, (t) => t.era);

export const countsByLanguage = (tracks: Track[]): Record<Language, number> =>
  countBy(tracks, (t) => t.language);

export const countsByRegion = (tracks: Track[]): Record<Region, number> =>
  countBy(tracks, (t) => t.region);

/**
 * Bridge the catalog's decade strings ("1960s") to the art-direction EraId
 * ("60s") used by src/lib/eras.ts for palette/medium. Kept here so later phases
 * can colour a track by its era zone without duplicating the mapping.
 */
const DECADE_TO_ERA: Record<EraDecade, EraId> = {
  "1950s": "50s",
  "1960s": "60s",
  "1970s": "70s",
  "1980s": "80s",
  "1990s": "90s",
};

export function decadeToEraId(decade: EraDecade): EraId {
  return DECADE_TO_ERA[decade];
}
