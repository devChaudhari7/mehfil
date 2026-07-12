/*
 * MEHFIL ingestion — offline YouTubeClient backed by fixtures.
 * Used automatically when YOUTUBE_API_KEY is absent (or --dry-run). Spends zero
 * quota units and returns canned data keyed by the real registry channelIds.
 */
import { mapVideoItem } from "../client";
import type { PlaylistPage, RawVideo, YouTubeClient, YtVideoItem } from "../types";
import { FIXTURES } from "./data";

export class FixtureYouTubeClient implements YouTubeClient {
  readonly mode = "fixture" as const;
  units = 0; // offline — free

  async getUploadsPlaylist(channelId: string): Promise<string | null> {
    return FIXTURES[channelId]?.uploads ?? null;
  }

  async resolveHandle(): Promise<string | null> {
    return null; // fixtures are keyed by channelId — handles stay offline-skipped
  }

  async listPlaylistItems(playlistId: string): Promise<PlaylistPage> {
    const channel = Object.values(FIXTURES).find((c) => c.uploads === playlistId);
    return { videoIds: channel ? channel.items.map((i) => i.id) : [] };
  }

  async listVideos(ids: string[]): Promise<RawVideo[]> {
    const all = Object.values(FIXTURES).flatMap((c) => c.items);
    const byId = new Map<string, YtVideoItem>(all.map((i) => [i.id, i]));
    return ids
      .map((id) => byId.get(id))
      .filter((i): i is YtVideoItem => i !== undefined)
      .map(mapVideoItem);
  }
}
