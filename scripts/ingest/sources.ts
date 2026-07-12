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

  // --- Phase 17 expansion — official rights-holders across all four buckets.
  // Known-stable channelIds are seeded; the rest are @handles the runner
  // resolves at run time (1 unit, cached in the committed checkpoint).
  {
    kind: "channel",
    id: "UCq-Fj5jknLsUf-MWSy4_brA",
    label: "T-Series",
    language: "hindi",
    region: "india",
    eraHint: "1980s-2010s",
    trusted: true,
  },
  {
    kind: "channel",
    id: "UCFFbwnve3yF62-tVXkTyHqg",
    label: "Zee Music",
    language: "hindi",
    region: "india",
    eraHint: "2000s-2010s",
    trusted: true,
  },
  {
    kind: "channel",
    id: "",
    handle: "@SonyMusicIndia",
    label: "Sony",
    language: "hindi",
    region: "india",
    eraHint: "1990s-2010s",
    trusted: true,
  },
  {
    kind: "channel",
    id: "",
    handle: "@YRF",
    label: "YRF",
    language: "hindi",
    region: "india",
    eraHint: "1990s-2010s",
    trusted: true,
  },
  {
    kind: "channel",
    id: "",
    handle: "@tipsofficial",
    label: "Tips",
    language: "hindi",
    region: "india",
    eraHint: "1980s-2000s",
    trusted: true,
  },
  {
    kind: "channel",
    id: "",
    handle: "@UltraBollywood",
    label: "Ultra",
    language: "hindi",
    region: "india",
    eraHint: "1970s-1990s",
    trusted: true,
  },
  {
    kind: "channel",
    id: "",
    handle: "@tseriesapnapunjab",
    label: "T-Series Apna Punjab",
    language: "punjabi",
    region: "india",
    eraHint: "1990s-2010s",
    trusted: true,
  },
  {
    kind: "channel",
    id: "",
    handle: "@SpeedRecords",
    label: "Speed Records",
    language: "punjabi",
    region: "india",
    eraHint: "2000s-2010s",
    trusted: true,
  },
  {
    kind: "channel",
    id: "",
    handle: "@SaregamaBengali",
    label: "Saregama Bengali",
    language: "bengali",
    region: "india",
    eraHint: "1950s-1990s",
    trusted: true,
  },
  {
    kind: "channel",
    id: "",
    handle: "@svfmusic",
    label: "SVF",
    language: "bengali",
    region: "india",
    eraHint: "2000s-2010s",
    trusted: true,
  },
  {
    kind: "channel",
    id: "",
    handle: "@AshaAudio",
    label: "Asha Audio",
    language: "bengali",
    region: "india",
    eraHint: "1990s-2010s",
    trusted: true,
  },
  {
    kind: "channel",
    id: "",
    handle: "@rhino",
    label: "Rhino/WMG",
    language: "english",
    region: "west",
    eraHint: "1950s-1980s",
    trusted: true,
  },
  {
    kind: "channel",
    id: "",
    handle: "@coldplay",
    label: "WMG",
    language: "english",
    region: "west",
    eraHint: "2000s-2010s",
    trusted: true,
  },
  {
    kind: "channel",
    id: "",
    handle: "@Adele",
    label: "XL",
    language: "english",
    region: "west",
    eraHint: "2010s",
    trusted: true,
  },
];
