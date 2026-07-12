import { describe, expect, it } from "vitest";
import { keepVideo } from "../filter";
import type { RawVideo } from "../types";

function raw(over: Partial<RawVideo> = {}): RawVideo {
  return {
    videoId: "v1",
    title: "Lag Ja Gale | Woh Kaun Thi (1964) | Lata Mangeshkar",
    channelId: "c1",
    channelTitle: "Saregama Music",
    durationSec: 242,
    embeddable: true,
    privacyStatus: "public",
    viewCount: 1000,
    publishedAt: "2015-01-01T00:00:00Z",
    thumbnail: "thumb.jpg",
    ...over,
  };
}

describe("keepVideo", () => {
  it("keeps an embeddable, public, full-length song", () => {
    expect(keepVideo(raw())).toBe(true);
  });

  it("keeps a legit 'Lyrical' upload", () => {
    expect(keepVideo(raw({ title: "Pehla Nasha (Lyrical) | Jo Jeeta Wohi Sikandar" }))).toBe(
      true,
    );
  });

  it("drops non-embeddable videos", () => {
    expect(keepVideo(raw({ embeddable: false }))).toBe(false);
  });

  it("drops non-public videos", () => {
    expect(keepVideo(raw({ privacyStatus: "unlisted" }))).toBe(false);
  });

  it("drops Shorts/clips under a minute", () => {
    expect(keepVideo(raw({ durationSec: 45 }))).toBe(false);
  });

  it("drops karaoke, remixes, jukeboxes, and #shorts", () => {
    expect(keepVideo(raw({ title: "Lag Ja Gale (Karaoke Version)" }))).toBe(false);
    expect(keepVideo(raw({ title: "Mehbooba Mehbooba (Remix)" }))).toBe(false);
    expect(keepVideo(raw({ title: "Best of Rafi | Audio Jukebox" }))).toBe(false);
    expect(keepVideo(raw({ title: "Mehbooba Mehbooba #shorts" }))).toBe(false);
  });

  it("drops movie-length uploads (label channels post full films between songs)", () => {
    expect(keepVideo(raw({ durationSec: 2 * 3600 }))).toBe(false);
    expect(keepVideo(raw({ durationSec: 14 * 60 }))).toBe(true); // a long song is fine
  });

  it("drops full-movie / scene / dialogue titles", () => {
    expect(keepVideo(raw({ title: "ACP Prithviraj Singh Action Full Movie" }))).toBe(false);
    expect(keepVideo(raw({ title: "Sholay — Best Scene HD" }))).toBe(false);
    expect(keepVideo(raw({ title: "Gabbar Famous Dialogue" }))).toBe(false);
  });
});
