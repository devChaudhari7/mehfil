/*
 * MEHFIL ingestion — source registry (brief §6b).
 *
 * The pipeline reads ONLY from these official rights-holder channels/playlists.
 * Verified channel IDs are seeded below; handle-only entries carry id:"" and are
 * skipped at run time until their channelId is resolved (a one-time lookup).
 * `language: "multi"` sources (e.g. Saregama spans Hindi/Bengali/Punjabi) can
 * RESOLVE seed tracks but are not used to APPEND discoveries, since we can't
 * confidently classify a discovery's language from a multi-language channel.
 */
import type { Language, Region } from "@/lib/catalog/types";

export interface CatalogSource {
  kind: "channel" | "playlist";
  /** channelId or playlistId; "" when only a handle is known (TODO: resolve). */
  id: string;
  /** @handle, present when id is not yet resolved. */
  handle?: string;
  label: string;
  language: Language | "multi";
  region: Region;
  eraHint?: string;
  /** Official rights-holder? Preferred when picking among duplicate uploads. */
  trusted: boolean;
}

export const SOURCES: CatalogSource[] = [
  {
    kind: "channel",
    id: "UC_A7K2dXFsTMAciGmnNxy-Q",
    label: "Saregama",
    language: "multi",
    region: "india",
    eraHint: "1950s-1990s",
    trusted: true,
  },
  {
    kind: "channel",
    id: "UCP6uH_XlsxrXwZQ4DlqbqPg",
    label: "Shemaroo Filmi Gaane",
    language: "hindi",
    region: "india",
    eraHint: "1960s-1990s",
    trusted: true,
  },
  {
    kind: "channel",
    id: "UCsuSg5nYeDwNJQ4_TKsZa8w",
    label: "Shemaroo 4K Hindi Songs",
    language: "hindi",
    region: "india",
    eraHint: "1960s-1990s",
    trusted: true,
  },
  // Handle-only — resolve channelId before live use (skipped until then).
  {
    kind: "channel",
    id: "",
    handle: "@SaregamaCarvaan",
    label: "Saregama Carvaan",
    language: "multi",
    region: "india",
    eraHint: "1950s-1970s",
    trusted: true,
  },
  {
    kind: "channel",
    id: "",
    handle: "@saregamaghazal",
    label: "Saregama Ghazal",
    language: "hindi",
    region: "india",
    trusted: true,
  },
];
