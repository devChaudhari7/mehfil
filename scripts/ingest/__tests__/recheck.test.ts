import { describe, expect, it } from "vitest";
import type { CatalogData, Track } from "@/lib/catalog/types";
import { applyRecheck, resolvedIdBatches } from "../recheck";
import type { RawVideo } from "../types";

function track(over: Partial<Track>): Track {
  return {
    id: "t",
    title: { native: "T", latin: "T" },
    script: "latin",
    artists: [],
    film: null,
    albumId: null,
    year: 1970,
    era: "1970s",
    language: "hindi",
    region: "india",
    durationSec: 200,
    moods: [],
    genres: [],
    raga: null,
    tempoBucket: "mid",
    timeOfDay: "day",
    cover: "c.jpg",
    source: "youtube",
    sourceId: "VID",
    provenance: { channelId: "CH", label: "Saregama", embeddable: true },
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
    artists: [],
    albums: [],
    tracks,
  };
}

function raw(over: Partial<RawVideo> & { videoId: string }): RawVideo {
  return {
    title: "t",
    channelId: "CH",
    channelTitle: "Ch",
    durationSec: 200,
    embeddable: true,
    privacyStatus: "public",
    viewCount: 1,
    publishedAt: "2020-01-01T00:00:00Z",
    thumbnail: "",
    ...over,
  };
}

describe("applyRecheck", () => {
  it("keeps healthy tracks and untouched unresolved seeds", () => {
    const healthy = track({ id: "ok", sourceId: "A", artists: ["someone"] });
    const unresolved = track({ id: "pending", sourceId: "", artists: ["someone"] });
    const alive = new Map([["A", raw({ videoId: "A" })]]);
    const { next, diff } = applyRecheck(base([healthy, unresolved]), alive);
    expect(next.tracks).toHaveLength(2);
    expect(diff).toMatchObject({ checked: 1, healthy: 1 });
    expect(diff.revertedSeedIds).toEqual([]);
    expect(diff.removedDiscoveryIds).toEqual([]);
  });

  it("reverts a curated seed whose upload died (missing from the response)", () => {
    const seed = track({ id: "seed", sourceId: "GONE", artists: ["lata"] });
    const { next, diff } = applyRecheck(base([seed]), new Map());
    expect(diff.revertedSeedIds).toEqual(["seed"]);
    const r = next.tracks[0]!;
    expect(r.sourceId).toBe(""); // re-resolvable by the next ingest
    expect(r.cover).toBe("");
    expect(r.durationSec).toBeNull();
    expect(r.provenance.embeddable).toBeNull();
    expect(r.provenance.label).toBe("Saregama"); // curated hint preserved
    expect(r.moods).toBe(seed.moods); // curated fields untouched
  });

  it("reverts a seed that became non-embeddable or private", () => {
    const s1 = track({ id: "a", sourceId: "A", artists: ["x"] });
    const s2 = track({ id: "b", sourceId: "B", artists: ["x"] });
    const alive = new Map([
      ["A", raw({ videoId: "A", embeddable: false })],
      ["B", raw({ videoId: "B", privacyStatus: "private" })],
    ]);
    const { diff } = applyRecheck(base([s1, s2]), alive);
    expect(diff.revertedSeedIds).toEqual(["a", "b"]);
  });

  it("removes a dead discovery outright (artists: [])", () => {
    const discovery = track({ id: "disc", sourceId: "DEAD", artists: [] });
    const { next, diff } = applyRecheck(base([discovery]), new Map());
    expect(diff.removedDiscoveryIds).toEqual(["disc"]);
    expect(next.tracks).toHaveLength(0);
  });

  it("is pure — never mutates the base catalog", () => {
    const seed = track({ id: "seed", sourceId: "GONE", artists: ["lata"] });
    const data = base([seed]);
    applyRecheck(data, new Map());
    expect(data.tracks[0]!.sourceId).toBe("GONE");
  });
});

describe("resolvedIdBatches", () => {
  it("batches unique resolved ids in fifties and skips unresolved", () => {
    const tracks = [
      ...Array.from({ length: 60 }, (_, i) => track({ id: `t${i}`, sourceId: `V${i}` })),
      track({ id: "dup", sourceId: "V0" }), // duplicate videoId collapses
      track({ id: "empty", sourceId: "" }),
    ];
    const batches = resolvedIdBatches(base(tracks));
    expect(batches).toHaveLength(2);
    expect(batches[0]).toHaveLength(50);
    expect(batches[1]).toHaveLength(10);
  });
});
