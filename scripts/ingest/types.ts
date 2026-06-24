/*
 * MEHFIL ingestion — internal types.
 *
 * YouTube Data API v3 response shapes (only the fields we read), the normalized
 * RawVideo/Candidate the pipeline operates on, and the YouTubeClient interface
 * so the Live (network) and Fixture (offline) clients are interchangeable.
 */
import type { Language, Region } from "@/lib/catalog/types";
import type { ParsedTitle } from "./parse";

// --- YouTube Data API v3 (partial) ---------------------------------------

export interface YtThumbnail {
  url: string;
  width?: number;
  height?: number;
}

export interface YtVideoItem {
  id: string;
  snippet: {
    title: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: Record<string, YtThumbnail>;
  };
  contentDetails: { duration: string };
  status: { embeddable: boolean; privacyStatus: string };
  statistics?: { viewCount?: string };
}

export interface VideoListResponse {
  items: YtVideoItem[];
}

export interface PlaylistItem {
  contentDetails?: { videoId?: string };
  snippet?: { resourceId?: { videoId?: string } };
}

export interface PlaylistItemListResponse {
  items: PlaylistItem[];
  nextPageToken?: string;
}

export interface ChannelListResponse {
  items: Array<{ contentDetails: { relatedPlaylists: { uploads: string } } }>;
}

// --- Pipeline working types ----------------------------------------------

export interface RawVideo {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  durationSec: number;
  embeddable: boolean;
  privacyStatus: string;
  viewCount: number;
  publishedAt: string;
  thumbnail: string;
}

export interface Candidate extends RawVideo {
  parsed: ParsedTitle;
  /** Curated rights-holder label of the source channel (registry). */
  sourceLabel: string;
  /** "multi" sources can resolve seeds but are not appended as discoveries. */
  sourceLanguage: Language | "multi";
  sourceRegion: Region;
  trusted: boolean;
}

export interface PlaylistPage {
  videoIds: string[];
  nextPageToken?: string;
}

export interface YouTubeClient {
  readonly mode: "live" | "fixture";
  /** Quota units spent so far (1 per API call; 0 for the fixture client). */
  units: number;
  getUploadsPlaylist(channelId: string): Promise<string | null>;
  listPlaylistItems(playlistId: string, pageToken?: string): Promise<PlaylistPage>;
  listVideos(ids: string[]): Promise<RawVideo[]>;
}

// --- Merge / run reporting -----------------------------------------------

export interface MergeDiff {
  /** Seed track ids whose resolver fields were filled this run. */
  resolvedIds: string[];
  /** New discovery track ids appended this run. */
  appendedIds: string[];
  /** Seed tracks left unresolved (no confident candidate). */
  unmatchedSeedIds: string[];
  /** Candidates dropped during merge (dupes, out-of-scope year, multi-source). */
  skipped: number;
}

export interface SourceCheckpoint {
  pageToken?: string;
  lastRun?: string;
}

export interface Checkpoint {
  /** Pacific-Time date the unit tally belongs to (quota resets midnight PT). */
  quotaDate: string;
  unitsSpent: number;
  perSource: Record<string, SourceCheckpoint>;
}
