import { describe, expect, it } from "vitest";
import {
  filmReleases,
  getRelease,
  releaseId,
  representativeEra,
  slug,
  standaloneSingles,
} from "./albums";
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

describe("slug / releaseId", () => {
  it("lowercases, folds accents, and hyphenates", () => {
    expect(slug("Woh Kaun Thi?")).toBe("woh-kaun-thi");
    expect(slug("Café Society")).toBe("cafe-society");
    expect(slug("  Sholay  ")).toBe("sholay");
  });

  it("composes a stable id from film + year", () => {
    expect(releaseId("Sholay", 1975)).toBe("sholay-1975");
  });
});

describe("filmReleases", () => {
  const tracks = [
    track({ id: "a", film: "Sholay", year: 1975, artists: ["rd-burman", "kishore"] }),
    track({ id: "b", film: "Sholay", year: 1975, artists: ["rd-burman", "lata"] }),
    track({ id: "c", film: "Aradhana", year: 1969, artists: ["kishore"] }),
    track({ id: "d", film: null, year: 1977, artists: ["bee-gees"] }), // single
  ];

  it("groups film tracks into releases keyed by (film, year)", () => {
    const releases = filmReleases(tracks);
    expect(releases).toHaveLength(2);
    const sholay = releases.find((r) => r.id === "sholay-1975")!;
    expect(sholay.trackIds).toEqual(["a", "b"]);
  });

  it("unions artist ids across the release, de-duped + order-preserved", () => {
    const sholay = getRelease(tracks, "sholay-1975")!;
    expect(sholay.artistIds).toEqual(["rd-burman", "kishore", "lata"]);
  });

  it("sorts by year then film, and ignores film-less singles", () => {
    const releases = filmReleases(tracks);
    expect(releases.map((r) => r.id)).toEqual(["aradhana-1969", "sholay-1975"]);
  });

  it("standaloneSingles returns only film-less tracks", () => {
    expect(standaloneSingles(tracks).map((t) => t.id)).toEqual(["d"]);
  });
});

describe("representativeEra", () => {
  it("picks the most frequent era as an EraId", () => {
    const tracks = [
      track({ era: "1980s" }),
      track({ era: "1980s" }),
      track({ era: "1950s" }),
    ];
    expect(representativeEra(tracks)).toBe("80s");
  });

  it("breaks ties toward the earlier decade and defaults when empty", () => {
    const tied = [track({ era: "1990s" }), track({ era: "1960s" })];
    expect(representativeEra(tied)).toBe("60s");
    expect(representativeEra([])).toBe("60s"); // DEFAULT_ERA
  });
});
