import { describe, expect, it } from "vitest";
import rawCatalog from "@/data/catalog.json";
import { assertCatalogShape, type Artist, type CatalogData, type Track } from "@/lib/catalog/types";
import { mergeCatalog } from "../merge";
import { keepVideo } from "../filter";
import { parseTitle, type ParsedTitle } from "../parse";
import { FixtureYouTubeClient } from "../fixtures/client";
import { SOURCES } from "../sources";
import type { Candidate } from "../types";

const ARTISTS: Artist[] = [
  {
    id: "lata",
    name: { latin: "Lata Mangeshkar" },
    language: "hindi",
    region: "india",
    era: "1960s",
    bio: "",
  },
  {
    id: "manna",
    name: { latin: "Manna Dey" },
    language: "hindi",
    region: "india",
    era: "1950s",
    bio: "",
  },
];

function seedTrack(over: Partial<Track>): Track {
  return {
    id: "x",
    title: { native: "X", latin: "X" },
    script: "latin",
    artists: [],
    film: null,
    albumId: null,
    year: 1965,
    era: "1960s",
    language: "hindi",
    region: "india",
    durationSec: null,
    moods: ["romantic"],
    genres: ["filmi"],
    raga: null,
    tempoBucket: "mid",
    timeOfDay: "day",
    cover: "",
    source: "youtube",
    sourceId: "",
    provenance: { channelId: "", label: "Saregama", embeddable: null },
    ...over,
  };
}

function cand(
  over: Partial<Candidate> & { videoId: string; parsed: ParsedTitle },
): Candidate {
  return {
    title: "fixture title",
    channelId: "CH",
    channelTitle: "Saregama Music",
    durationSec: 240,
    embeddable: true,
    privacyStatus: "public",
    viewCount: 1000,
    publishedAt: "2015-01-01T00:00:00Z",
    thumbnail: "thumb.jpg",
    sourceLabel: "Saregama",
    sourceLanguage: "multi",
    sourceRegion: "india",
    trusted: true,
    ...over,
  };
}

function base(tracks: Track[]): CatalogData {
  return {
    _meta: {
      schemaVersion: 1,
      note: "",
      resolverFills: [],
      curatorHints: "",
      nativeSpellingsNeedProofing: false,
      scripts: {},
      eraSource: "",
    },
    artists: ARTISTS,
    albums: [],
    tracks,
  };
}

describe("mergeCatalog — resolveSeed", () => {
  it("fills only resolver fields, never the curated ones", () => {
    const t = seedTrack({
      id: "lag-ja-gale",
      title: { native: "लग जा गले", latin: "Lag Ja Gale" },
      script: "devanagari",
      artists: ["lata"],
      year: 1964,
    });
    const c = cand({
      videoId: "FIXTURE_LJG",
      durationSec: 242,
      thumbnail: "cover.jpg",
      channelId: "UC_SAREGAMA",
      parsed: { song: "Lag Ja Gale", artist: "Lata Mangeshkar", year: 1964 },
    });

    const { next, diff } = mergeCatalog(base([t]), [c]);
    expect(diff.resolvedIds).toEqual(["lag-ja-gale"]);

    const r = next.tracks[0]!;
    // resolver fields filled
    expect(r.sourceId).toBe("FIXTURE_LJG");
    expect(r.durationSec).toBe(242);
    expect(r.cover).toBe("cover.jpg");
    expect(r.provenance.channelId).toBe("UC_SAREGAMA");
    expect(r.provenance.embeddable).toBe(true);
    // curated fields untouched
    expect(r.title).toEqual({ native: "लग जा गले", latin: "Lag Ja Gale" });
    expect(r.provenance.label).toBe("Saregama");
    expect(r.moods).toBe(t.moods);
    // base mutated? no — pure
    expect(t.sourceId).toBe("");
    expect(t.durationSec).toBeNull();
  });

  it("leaves a seed unresolved when no candidate matches", () => {
    const t = seedTrack({ id: "ghost", title: { native: "G", latin: "Ghost" }, artists: ["lata"] });
    const { next, diff } = mergeCatalog(base([t]), []);
    expect(diff.unmatchedSeedIds).toEqual(["ghost"]);
    expect(next.tracks[0]!.sourceId).toBe("");
  });

  it("prefers the candidate whose channel matches the curated label", () => {
    const t = seedTrack({
      id: "foo",
      title: { native: "Foo", latin: "Foo" },
      artists: ["lata"],
      provenance: { channelId: "", label: "Saregama", embeddable: null },
    });
    const wrongLabel = cand({
      videoId: "A",
      sourceLabel: "T-Series",
      viewCount: 9_999_999,
      parsed: { song: "Foo", artist: "Lata Mangeshkar" },
    });
    const rightLabel = cand({
      videoId: "B",
      sourceLabel: "Saregama",
      viewCount: 10,
      parsed: { song: "Foo", artist: "Lata Mangeshkar" },
    });
    const { next } = mergeCatalog(base([t]), [wrongLabel, rightLabel]);
    expect(next.tracks[0]!.sourceId).toBe("B");
  });

  it("never re-touches an already-resolved seed", () => {
    const t = seedTrack({
      id: "done",
      title: { native: "Done", latin: "Done" },
      artists: ["lata"],
      sourceId: "EXISTING",
    });
    const dup = cand({
      videoId: "DUP",
      sourceLanguage: "hindi",
      parsed: { song: "Done", artist: "Lata Mangeshkar", year: 1965 },
    });
    const { next, diff } = mergeCatalog(base([t]), [dup]);
    expect(diff.resolvedIds).toEqual([]);
    expect(diff.appendedIds).toEqual([]);
    expect(next.tracks).toHaveLength(1);
    expect(next.tracks[0]!.sourceId).toBe("EXISTING");
  });
});

describe("mergeCatalog — appendDiscoveries", () => {
  it("appends a new track with a stable id, era from year, language from source", () => {
    const c = cand({
      videoId: "FIXTURE_NEW",
      sourceLabel: "Shemaroo",
      sourceLanguage: "hindi",
      parsed: { song: "Aaja Re Pardesi", film: "Madhumati", year: 1958, artist: "Lata Mangeshkar" },
    });
    const { next, diff } = mergeCatalog(base([]), [c]);
    expect(diff.appendedIds).toEqual(["aaja-re-pardesi-1958"]);
    const d = next.tracks.find((t) => t.id === "aaja-re-pardesi-1958")!;
    expect(d.era).toBe("1950s");
    expect(d.language).toBe("hindi");
    expect(d.film).toBe("Madhumati");
    expect(d.sourceId).toBe("FIXTURE_NEW");
    expect(d.source).toBe("youtube");
  });

  it("skips LATIN-titled discoveries from multi-language sources (unclassifiable)", () => {
    const c = cand({
      videoId: "M",
      sourceLanguage: "multi",
      parsed: { song: "Some New Song", year: 1970, artist: "Someone" },
    });
    const { diff } = mergeCatalog(base([]), [c]);
    expect(diff.appendedIds).toEqual([]);
    expect(diff.skipped).toBe(1);
  });

  it("classifies multi-source discoveries by their native script (Phase 19)", () => {
    const hindi = cand({
      videoId: "H1",
      sourceLanguage: "multi",
      parsed: { song: "आ जा रे परदेसी", year: 1958, artist: "लता मंगेशकर" },
    });
    const bengali = cand({
      videoId: "B1",
      sourceLanguage: "multi",
      parsed: { song: "এই রাত তোমার আমার", year: 1959, artist: "হেমন্ত" },
    });
    const punjabi = cand({
      videoId: "P1",
      sourceLanguage: "multi",
      parsed: { song: "ਜੁਗਨੀ", year: 1970, artist: "ਕੋਈ" },
    });
    const { next, diff } = mergeCatalog(base([]), [hindi, bengali, punjabi]);
    expect(diff.appendedIds).toHaveLength(3);
    const byVid = (v: string) => next.tracks.find((t) => t.sourceId === v)!;
    expect(byVid("H1").language).toBe("hindi");
    expect(byVid("H1").script).toBe("devanagari");
    expect(byVid("B1").language).toBe("bengali");
    expect(byVid("B1").script).toBe("bengali");
    expect(byVid("P1").language).toBe("punjabi");
    expect(byVid("P1").script).toBe("gurmukhi");
    // ids never collapse to empty slugs for native-script titles
    for (const id of diff.appendedIds) expect(id.length).toBeGreaterThan(0);
  });

  it("appends modern discoveries now that the eras span 1950s–2010s (Phase 16)", () => {
    const c = cand({
      videoId: "Y",
      sourceLanguage: "hindi",
      parsed: { song: "Modern Track", year: 2010, artist: "Artist" },
    });
    const { next, diff } = mergeCatalog(base([]), [c]);
    expect(diff.appendedIds).toHaveLength(1);
    expect(next.tracks.find((t) => t.sourceId === "Y")?.era).toBe("2010s");
  });

  it("still skips discoveries before the catalog's span (pre-1950)", () => {
    const c = cand({
      videoId: "Z",
      sourceLanguage: "hindi",
      parsed: { song: "Wax Cylinder Song", year: 1932, artist: "Artist" },
    });
    const { diff } = mergeCatalog(base([]), [c]);
    expect(diff.appendedIds).toEqual([]);
    expect(diff.skipped).toBe(1);
  });

  it("is idempotent across scheduled re-runs (17.1 regression)", () => {
    // First run appends the discovery (artists: [] on the built track).
    const c = cand({
      videoId: "V1",
      sourceLanguage: "hindi",
      parsed: { song: "Weekly Song", year: 1971, artist: "Some Singer" },
    });
    const first = mergeCatalog(base([]), [c]);
    expect(first.diff.appendedIds).toHaveLength(1);

    // Second run over the SAME uploads: the same candidate must NOT append again
    // (previously key-mismatched to `song|` vs `song|artist` and minted `…-2`).
    const second = mergeCatalog(first.next, [c]);
    expect(second.diff.appendedIds).toEqual([]);
    expect(second.next.tracks).toHaveLength(first.next.tracks.length);

    // Even a DIFFERENT upload of the same discovered song stays out (song-only key).
    const reupload = cand({
      videoId: "V2",
      sourceLanguage: "hindi",
      parsed: { song: "Weekly Song", year: 1971, artist: "Other Channel Credit" },
    });
    const third = mergeCatalog(first.next, [reupload]);
    expect(third.diff.appendedIds).toEqual([]);
  });

  it("collapses same-run duplicates of one song under different parsed artists", () => {
    const a = cand({
      videoId: "S1",
      sourceLanguage: "hindi",
      parsed: { song: "One Song", year: 1980, artist: "Credit A" },
    });
    const b = cand({
      videoId: "S2",
      sourceLanguage: "hindi",
      parsed: { song: "One Song", year: 1980, artist: "Credit B" },
    });
    const { diff } = mergeCatalog(base([]), [a, b]);
    expect(diff.appendedIds).toHaveLength(1);
  });
});

/** Build candidates the way the runner does, but from the offline fixtures. */
async function collectFromFixtures(): Promise<Candidate[]> {
  const client = new FixtureYouTubeClient();
  const out: Candidate[] = [];
  for (const src of SOURCES) {
    if (!src.id) continue;
    const playlist = await client.getUploadsPlaylist(src.id);
    if (!playlist) continue;
    const { videoIds } = await client.listPlaylistItems(playlist);
    const videos = await client.listVideos(videoIds);
    for (const v of videos) {
      if (!keepVideo(v)) continue;
      out.push({
        ...v,
        parsed: parseTitle(v.title),
        sourceLabel: src.label,
        sourceLanguage: src.language,
        sourceRegion: src.region,
        trusted: src.trusted,
      });
    }
  }
  return out;
}

describe("mergeCatalog — offline fixture run against the real seed", () => {
  it("resolves seeds across buckets, filters, appends, and leaves the seed file untouched", async () => {
    const seed: unknown = rawCatalog;
    assertCatalogShape(seed);
    const candidates = await collectFromFixtures();
    const { next, diff } = mergeCatalog(seed, candidates);

    // Resolves Hindi + Bengali + Punjabi seeds
    expect(diff.resolvedIds).toContain("lag-ja-gale-1964");
    expect(diff.resolvedIds).toContain("pyar-hua-ikrar-hua-1955");
    expect(diff.resolvedIds).toContain("tumi-je-amar-1957");
    expect(diff.resolvedIds).toContain("lathe-di-chadar");
    // Non-embeddable candidate was filtered out → its seed stays unresolved
    expect(diff.resolvedIds).not.toContain("aap-ki-nazron-ne-samjha-1962");

    // Appends the two Shemaroo discoveries
    expect(diff.appendedIds).toContain("aaja-re-pardesi-1958");
    expect(diff.appendedIds).toContain("aao-twist-karein-1965");
    expect(next.tracks.length).toBe(seed.tracks.length + diff.appendedIds.length);

    // Curated native script preserved on a resolved track
    const ljg = next.tracks.find((t) => t.id === "lag-ja-gale-1964")!;
    expect(ljg.title.native).toBe("लग जा गले");
    expect(ljg.sourceId).toBe("FIXTURE_LAGJAGALE");

    // The real seed object was not mutated (pure merge)
    const seedLjg = seed.tracks.find((t) => t.id === "lag-ja-gale-1964")!;
    expect(seedLjg.sourceId).toBe("");
  });
});
