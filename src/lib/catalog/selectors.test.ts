import { describe, expect, it } from "vitest";
import { countsByLanguage, decadeToEraId, isPlayable, playableCount } from "./selectors";
import type { Track } from "./types";

function track(over: Partial<Track>): Track {
  return {
    id: "t",
    title: { native: "T", latin: "T" },
    script: "latin",
    artists: [],
    film: null,
    albumId: null,
    year: 1965,
    era: "1960s",
    language: "hindi",
    region: "india",
    durationSec: null,
    moods: [],
    genres: [],
    raga: null,
    tempoBucket: "mid",
    timeOfDay: "day",
    cover: "",
    source: "youtube",
    sourceId: "",
    provenance: { channelId: "", label: "", embeddable: null },
    ...over,
  };
}

describe("isPlayable / playableCount", () => {
  it("requires a resolved sourceId AND embeddable === true", () => {
    expect(isPlayable(track({}))).toBe(false);
    expect(
      isPlayable(track({ sourceId: "abc", provenance: { channelId: "c", label: "", embeddable: true } })),
    ).toBe(true);
    expect(
      isPlayable(track({ sourceId: "abc", provenance: { channelId: "c", label: "", embeddable: false } })),
    ).toBe(false);
    // seed (unresolved) is never playable
    expect(isPlayable(track({ sourceId: "" }))).toBe(false);
  });

  it("counts only playable tracks", () => {
    const tracks = [
      track({ id: "a" }),
      track({ id: "b", sourceId: "x", provenance: { channelId: "c", label: "", embeddable: true } }),
    ];
    expect(playableCount(tracks)).toBe(1);
  });
});

describe("countsByLanguage", () => {
  it("tallies per language", () => {
    const tracks = [
      track({ id: "a", language: "hindi" }),
      track({ id: "b", language: "hindi" }),
      track({ id: "c", language: "bengali" }),
    ];
    const counts = countsByLanguage(tracks);
    expect(counts.hindi).toBe(2);
    expect(counts.bengali).toBe(1);
  });
});

describe("decadeToEraId", () => {
  it("bridges catalog decade strings to art-direction era ids", () => {
    expect(decadeToEraId("1950s")).toBe("50s");
    expect(decadeToEraId("1960s")).toBe("60s");
    expect(decadeToEraId("1990s")).toBe("90s");
  });
});
