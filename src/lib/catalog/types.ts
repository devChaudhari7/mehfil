/*
 * MEHFIL — catalog data model (brief §8 + art-direction §8 synesthetic tags).
 *
 * These types mirror src/data/catalog.json EXACTLY and are the single source of
 * truth shared by the app data layer (repository/selectors) and the Node
 * ingestion pipeline (scripts/ingest/*). The ordered `*_VALUES` const tuples
 * double as runtime iteration order for the /catalog debug route AND derive the
 * string-literal unions, so the two can never drift apart.
 */
import type { Script } from "@/lib/fonts";

export type { Script };

export const ERA_DECADES = [
  "1950s",
  "1960s",
  "1970s",
  "1980s",
  "1990s",
  "2000s",
  "2010s",
  "2020s",
] as const;
export type EraDecade = (typeof ERA_DECADES)[number];

export const LANGUAGES = ["hindi", "punjabi", "bengali", "english"] as const;
export type Language = (typeof LANGUAGES)[number];

export const REGIONS = ["india", "west"] as const;
export type Region = (typeof REGIONS)[number];

export const TEMPO_BUCKETS = ["slow", "mid", "fast"] as const;
export type TempoBucket = (typeof TEMPO_BUCKETS)[number];

export const TIMES_OF_DAY = ["day", "dusk", "night"] as const;
export type TimeOfDay = (typeof TIMES_OF_DAY)[number];

export const AUDIO_SOURCES = ["youtube", "spotify", "local"] as const;
export type AudioSource = (typeof AUDIO_SOURCES)[number];

/**
 * Fields the ingestion resolver is allowed to write (catalog.json `_meta`).
 * Everything else on a seed track is human-curated and MUST NOT be overwritten.
 * Dotted paths (`provenance.channelId`) are nested.
 */
export const RESOLVER_FILLS = [
  "sourceId",
  "cover",
  "durationSec",
  "provenance.channelId",
  "provenance.embeddable",
] as const;
export type ResolverField = (typeof RESOLVER_FILLS)[number];

export interface LocalizedText {
  native: string;
  latin: string;
}

export interface Provenance {
  /** YouTube channelId of the resolved upload (resolver-filled). */
  channelId: string;
  /** Curated expected rights-holder, e.g. "Saregama" — picks search channel. */
  label: string;
  /** YouTube embeddable status (resolver-filled). */
  embeddable: boolean | null;
}

export interface Track {
  id: string;
  title: LocalizedText;
  script: Script;
  /** Artist ids (see Artist.id). */
  artists: string[];
  film: string | null;
  albumId: string | null;
  year: number;
  era: EraDecade;
  language: Language;
  region: Region;
  /** Resolver-filled from videos.list ISO-8601 duration. */
  durationSec: number | null;
  moods: string[];
  genres: string[];
  /** Raga id — null unless confidently curated (synesthetic layer). */
  raga: string | null;
  tempoBucket: TempoBucket;
  timeOfDay: TimeOfDay;
  /** Resolver-filled (thumbnail) or curated album-art override. */
  cover: string;
  source: AudioSource;
  /** YouTube videoId — resolver-filled; "" until a real API run resolves it. */
  sourceId: string;
  provenance: Provenance;
}

export interface Artist {
  id: string;
  name: { native?: string; latin: string };
  language: Language;
  region: Region;
  era: EraDecade;
  bio: string;
}

export interface Album {
  id: string;
  title: { native?: string; latin: string };
  artistId: string;
  year: number;
  cover: string;
  trackIds: string[];
}

export interface CatalogMeta {
  schemaVersion: number;
  note: string;
  resolverFills: string[];
  curatorHints: string;
  nativeSpellingsNeedProofing: boolean;
  scripts: Record<string, string>;
  eraSource: string;
}

export interface CatalogData {
  _meta: CatalogMeta;
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
}

/**
 * Lightweight runtime shape-check so a malformed/edited catalog.json fails loud
 * at load instead of surfacing as undefined deep in the UI. Not a full schema
 * validator — it guards the structural invariants the app relies on.
 */
export function assertCatalogShape(data: unknown): asserts data is CatalogData {
  if (typeof data !== "object" || data === null) {
    throw new Error("catalog: expected an object at the root");
  }
  const d = data as Record<string, unknown>;
  if (typeof d._meta !== "object" || d._meta === null) {
    throw new Error("catalog: missing _meta block");
  }
  for (const key of ["artists", "albums", "tracks"] as const) {
    if (!Array.isArray(d[key])) {
      throw new Error(`catalog: "${key}" must be an array`);
    }
  }
  const tracks = d.tracks as unknown[];
  const first = tracks[0];
  if (first !== undefined) {
    const t = first as Record<string, unknown>;
    for (const key of ["id", "title", "era", "language", "region", "provenance"] as const) {
      if (!(key in t)) {
        throw new Error(`catalog: track is missing required field "${key}"`);
      }
    }
  }
}
