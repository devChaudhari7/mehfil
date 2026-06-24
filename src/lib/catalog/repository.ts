/*
 * MEHFIL — CatalogRepository (brief §6.8/§16).
 *
 * The UI reads the catalog only through this interface so the backing store can
 * move from catalog.json to SQLite/Postgres later without touching components.
 * `JsonCatalogRepository` is the v1 implementation over the bundled seed JSON.
 */
import rawCatalog from "@/data/catalog.json";
import { isPlayable } from "./selectors";
import {
  assertCatalogShape,
  type Album,
  type Artist,
  type CatalogData,
  type CatalogMeta,
  type EraDecade,
  type Language,
  type Region,
  type Track,
} from "./types";

export interface CatalogRepository {
  meta(): CatalogMeta;
  allTracks(): Track[];
  allArtists(): Artist[];
  allAlbums(): Album[];
  getTrack(id: string): Track | undefined;
  getArtist(id: string): Artist | undefined;
  tracksByEra(era: EraDecade): Track[];
  tracksByLanguage(language: Language): Track[];
  tracksByRegion(region: Region): Track[];
  /** Tracks with a resolved, embeddable upload (see selectors.isPlayable). */
  playable(): Track[];
}

export class JsonCatalogRepository implements CatalogRepository {
  private readonly data: CatalogData;

  constructor(data: unknown = rawCatalog) {
    assertCatalogShape(data);
    this.data = data;
  }

  meta(): CatalogMeta {
    return this.data._meta;
  }

  allTracks(): Track[] {
    return this.data.tracks;
  }

  allArtists(): Artist[] {
    return this.data.artists;
  }

  allAlbums(): Album[] {
    return this.data.albums;
  }

  getTrack(id: string): Track | undefined {
    return this.data.tracks.find((t) => t.id === id);
  }

  getArtist(id: string): Artist | undefined {
    return this.data.artists.find((a) => a.id === id);
  }

  tracksByEra(era: EraDecade): Track[] {
    return this.data.tracks.filter((t) => t.era === era);
  }

  tracksByLanguage(language: Language): Track[] {
    return this.data.tracks.filter((t) => t.language === language);
  }

  tracksByRegion(region: Region): Track[] {
    return this.data.tracks.filter((t) => t.region === region);
  }

  playable(): Track[] {
    return this.data.tracks.filter(isPlayable);
  }
}

/** Shared singleton over the bundled seed catalog. */
export const catalogRepository: CatalogRepository = new JsonCatalogRepository();
