/*
 * MEHFIL ingestion — live YouTube Data API v3 client (brief §6c).
 *
 * Read-only public data via an API key (no OAuth). Stays on the 1-unit path:
 * channels.list → playlistItems.list → batched videos.list. NEVER search.list
 * (100 units/call). Each HTTP call increments `units` by 1.
 */
import type {
  ChannelListResponse,
  PlaylistItemListResponse,
  PlaylistPage,
  RawVideo,
  VideoListResponse,
  YouTubeClient,
  YtThumbnail,
  YtVideoItem,
} from "./types";

const API_BASE = "https://www.googleapis.com/youtube/v3";

/** ISO-8601 duration ("PT4M2S") → seconds. */
export function parseIsoDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const h = Number(m[1] ?? 0);
  const min = Number(m[2] ?? 0);
  const s = Number(m[3] ?? 0);
  return h * 3600 + min * 60 + s;
}

function bestThumbnail(thumbs: Record<string, YtThumbnail>): string {
  for (const key of ["maxres", "standard", "high", "medium", "default"]) {
    const t = thumbs[key];
    if (t?.url) return t.url;
  }
  return "";
}

/** Normalize a videos.list item to RawVideo. Shared by the live + fixture clients. */
export function mapVideoItem(item: YtVideoItem): RawVideo {
  return {
    videoId: item.id,
    title: item.snippet.title,
    channelId: item.snippet.channelId,
    channelTitle: item.snippet.channelTitle,
    durationSec: parseIsoDuration(item.contentDetails.duration),
    embeddable: item.status.embeddable,
    privacyStatus: item.status.privacyStatus,
    viewCount: Number(item.statistics?.viewCount ?? 0),
    publishedAt: item.snippet.publishedAt,
    thumbnail: bestThumbnail(item.snippet.thumbnails),
  };
}

export class LiveYouTubeClient implements YouTubeClient {
  readonly mode = "live" as const;
  units = 0;

  constructor(private readonly apiKey: string) {}

  private async get<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${API_BASE}/${path}`);
    url.searchParams.set("key", this.apiKey);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    this.units += 1;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`YouTube ${path} ${res.status}: ${await res.text()}`);
    }
    return (await res.json()) as T;
  }

  async getUploadsPlaylist(channelId: string): Promise<string | null> {
    const data = await this.get<ChannelListResponse>("channels", {
      part: "contentDetails",
      id: channelId,
    });
    return data.items[0]?.contentDetails?.relatedPlaylists.uploads ?? null;
  }

  async resolveHandle(handle: string): Promise<string | null> {
    const data = await this.get<ChannelListResponse>("channels", {
      part: "id",
      forHandle: handle.replace(/^@/, ""),
    });
    return data.items[0]?.id ?? null;
  }

  async listPlaylistItems(playlistId: string, pageToken?: string): Promise<PlaylistPage> {
    const data = await this.get<PlaylistItemListResponse>("playlistItems", {
      part: "contentDetails,snippet",
      maxResults: "50",
      playlistId,
      ...(pageToken ? { pageToken } : {}),
    });
    const videoIds = data.items
      .map((it) => it.contentDetails?.videoId ?? it.snippet?.resourceId?.videoId)
      .filter((id): id is string => Boolean(id));
    return { videoIds, ...(data.nextPageToken ? { nextPageToken: data.nextPageToken } : {}) };
  }

  async listVideos(ids: string[]): Promise<RawVideo[]> {
    if (ids.length === 0) return [];
    if (ids.length > 50) throw new Error("listVideos: max 50 ids per call");
    const data = await this.get<VideoListResponse>("videos", {
      part: "snippet,contentDetails,status,statistics",
      id: ids.join(","),
    });
    return data.items.map(mapVideoItem);
  }
}
